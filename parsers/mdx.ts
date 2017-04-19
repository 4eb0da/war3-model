import {
    Model, Sequence, Material, Layer, AnimVector, AnimKeyframe, LineType, Texture, Geoset,
    GeosetAnimInfo, GeosetAnim, Node, Bone, Helper, Attachment, EventObject, CollisionShape, CollisionShapeType,
    ParticleEmitter2, ParticleEmitter2FramesFlags, Camera, Light, TVertexAnim, RibbonEmitter, ParticleEmitter
} from '../model';

const BIG_ENDIAN = true;
const NONE = -1;

enum AnimVectorType {
    INT1,
    FLOAT1,
    FLOAT3,
    FLOAT4
}

const animVectorSize = {
    [AnimVectorType.INT1]: 1,
    [AnimVectorType.FLOAT1]: 1,
    [AnimVectorType.FLOAT3]: 3,
    [AnimVectorType.FLOAT4]: 4
};

class State {
    // pos in bytes
    public pos: number;
    public length: number;

    private readonly ab: ArrayBuffer;
    private readonly view: DataView;
    private readonly uint: Uint8Array;

    constructor (arrayBuffer: ArrayBuffer) {
        this.ab = arrayBuffer;
        this.pos = 0;
        this.length = arrayBuffer.byteLength;

        this.view = new DataView(this.ab);
        this.uint = new Uint8Array(this.ab);
    }

    public keyword (): string {
        let res = String.fromCharCode(
            this.uint[this.pos],
            this.uint[this.pos + 1],
            this.uint[this.pos + 2],
            this.uint[this.pos + 3]
        );

        this.pos += 4;

        return res;
    }

    public expectKeyword (keyword: string, errorText: string): void {
        if (this.keyword() !== keyword) {
            throw new Error(errorText);
        }
    }

    public uint8 (): number {
        return this.view.getUint8(this.pos++);
    }

    public uint16 (): number {
        let res = this.view.getUint16(this.pos, BIG_ENDIAN);

        this.pos += 2;

        return res;
    }

    public int32 (): number {
        let res = this.view.getInt32(this.pos, BIG_ENDIAN);

        this.pos += 4;

        return res;
    }

    public float32 (): number {
        let res = this.view.getFloat32(this.pos, BIG_ENDIAN);

        this.pos += 4;

        return res;
    }

    public str (length: number) {
        // actual string length
        // data may consist of ['a', 'b', 'c', 0, 0, 0]
        let stringLength = length;

        while (this.uint[this.pos + stringLength - 1] === 0 && stringLength > 0) {
            --stringLength;
        }

        // ??
        // TS2461:Type 'Uint8Array' is not an array type.
        // let res = String.fromCharCode(...this.uint.slice(this.pos, this.pos + length));
        let res = String.fromCharCode.apply(String, this.uint.slice(this.pos, this.pos + stringLength));

        this.pos += length;

        return res;
    }

    public animVector (type: AnimVectorType): AnimVector {
        let res: AnimVector = {
            Keys: []
        } as AnimVector;

        let isInt = type === AnimVectorType.INT1;

        let vectorSize = animVectorSize[type];

        let keysCount = this.int32();
        res.LineType = this.int32();
        res.GlobalSeqId = this.int32();

        if (res.GlobalSeqId === NONE) {
            res.GlobalSeqId = null;
        }

        for (let i = 0; i < keysCount; ++i) {
            let animKeyFrame: AnimKeyframe = {} as AnimKeyframe;

            animKeyFrame.Frame = this.int32();

            if (isInt) {
                animKeyFrame.Vector = new Int32Array(vectorSize);
            } else {
                animKeyFrame.Vector = new Float32Array(vectorSize);
            }
            for (let j = 0; j < vectorSize; ++j) {
                if (isInt) {
                    animKeyFrame.Vector[j] = this.int32();
                } else {
                    animKeyFrame.Vector[j] = this.float32();
                }
            }

            if (res.LineType === LineType.Hermite || res.LineType === LineType.Bezier) {
                for (let part of ['InTan', 'OutTan']) {
                    animKeyFrame[part] = new Float32Array(vectorSize);
                    for (let j = 0; j < vectorSize; ++j) {
                        if (isInt) {
                            animKeyFrame[part][j] = this.int32();
                        } else {
                            animKeyFrame[part][j] = this.float32();
                        }
                    }
                }
            }

            res.Keys.push(animKeyFrame);
        }

        return res;
    }
}

interface ObjWithExtent {
    BoundsRadius: number;
    MinimumExtent: Float32Array;
    MaximumExtent: Float32Array;
}

function parseExtent (obj: ObjWithExtent, state: State) {
    obj.BoundsRadius = state.float32();

    for (let key of ['MinimumExtent', 'MaximumExtent']) {
        obj[key] = new Float32Array(3);
        for (let i = 0; i < 3; ++i) {
            obj[key][i] = state.float32();
        }
    }
}

function parseVersion (model: Model, state: State): void {
    model.Version = state.int32();
}

const MODEL_NAME_LENGTH = 0x150;
function parseModelInfo (model: Model, state: State): void {
    model.Info.Name = state.str(MODEL_NAME_LENGTH);
    state.int32(); // unknown 4-byte sequence
    parseExtent(model.Info, state);
    model.Info.BlendTime = state.int32();
}

const MODEL_SEQUENCE_NAME_LENGTH = 0x50;
function parseSequences (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let name = state.str(MODEL_SEQUENCE_NAME_LENGTH);

        let sequence: Sequence = {} as Sequence;

        sequence.Name = name;

        let interval = new Uint32Array(2);
        interval[0] = state.int32();
        interval[1] = state.int32();
        sequence.Interval = interval;

        sequence.MoveSpeed = state.float32();
        sequence.NonLooping = state.int32() > 0;
        sequence.Rarity = state.float32();
        state.int32(); // unknown 4-byte sequence (syncPoint?)

        parseExtent(sequence, state);

        model.Sequences.push(sequence);
    }
}

function parseMaterials (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        state.int32(); // material size inclusive

        let material: Material = {
            Layers: []
        } as Material;

        material.PriorityPlane = state.int32();
        material.RenderMode = state.int32();

        state.expectKeyword('LAYS', 'Incorrect materials format');

        let layersCount = state.int32();

        for (let i = 0; i < layersCount; ++i) {
            let startPos2 = state.pos;
            let size2 = state.int32();

            let layer: Layer = {} as Layer;

            layer.FilterMode = state.int32();
            layer.Shading = state.int32();
            layer.TextureID = state.int32();
            layer.TVertexAnimId = state.int32();
            if (layer.TVertexAnimId === NONE) {
                layer.TVertexAnimId = null;
            }
            layer.CoordId = state.int32();
            layer.Alpha = state.float32();

            while (state.pos < startPos2 + size2) {
                let keyword = state.keyword();

                if (keyword === 'KMTA') {
                    layer.Alpha = state.animVector(AnimVectorType.FLOAT1);
                } else if (keyword === 'KMTF') {
                    layer.TextureID = state.animVector(AnimVectorType.INT1);
                } else {
                    throw new Error('Unknown layer chunk data ' + keyword);
                }
            }

            material.Layers.push(layer);
        }

        model.Materials.push(material);
    }
}

const MODEL_TEXTURE_PATH_LENGTH = 0x100;
function parseTextures (model: Model, state: State, size: number) {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let texture: Texture = {} as Texture;

        texture.ReplaceableId = state.int32();
        texture.Image = state.str(MODEL_TEXTURE_PATH_LENGTH);
        state.int32(); // unknown 4-byte sequence
        texture.Flags = state.int32();

        model.Textures.push(texture);
    }
}

function parseGeosets (model: Model, state: State, size: number) {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let geoset: Geoset = {} as Geoset;

        state.int32(); // geoset size, not used

        state.expectKeyword('VRTX', 'Incorrect geosets format');
        let verticesCount = state.int32();
        geoset.Vertices = new Float32Array(verticesCount * 3);
        for (let i = 0; i < verticesCount * 3; ++i) {
            geoset.Vertices[i] = state.float32();
        }

        state.expectKeyword('NRMS', 'Incorrect geosets format');
        let normalsCount = state.int32();
        geoset.Normals = new Float32Array(normalsCount * 3);
        for (let i = 0; i < normalsCount * 3; ++i) {
            geoset.Normals[i] = state.float32();
        }

        state.expectKeyword('PTYP', 'Incorrect geosets format');
        let primitiveCount = state.int32();
        for (let i = 0; i < primitiveCount; ++i) {
            if (state.int32() !== 4) {
                throw new Error('Incorrect geosets format');
            }
        }

        state.expectKeyword('PCNT', 'Incorrect geosets format');
        let faceGroupCount = state.int32();
        for (let i = 0; i < faceGroupCount; ++i) {
            state.int32();
        }

        state.expectKeyword('PVTX', 'Incorrect geosets format');
        let indicesCount = state.int32();
        geoset.Faces = new Uint16Array(indicesCount);
        for (let i = 0; i < indicesCount; ++i) {
            geoset.Faces[i] = state.uint16();
        }

        state.expectKeyword('GNDX', 'Incorrect geosets format');
        let verticesGroupCount = state.int32();
        geoset.VertexGroup = new Uint8Array(verticesGroupCount);
        for (let i = 0; i < verticesGroupCount; ++i) {
            geoset.VertexGroup[i] = state.uint8();
        }

        state.expectKeyword('MTGC', 'Incorrect geosets format');
        let groupsCount = state.int32();
        geoset.Groups = [];
        for (let i = 0; i < groupsCount; ++i) {
            // new Array(array length)
            geoset.Groups[i] = new Array(state.int32());
        }

        state.expectKeyword('MATS', 'Incorrect geosets format');
        geoset.TotalGroupsCount = state.int32();
        let groupIndex = 0;
        let groupCounter = 0;
        for (let i = 0; i < geoset.TotalGroupsCount; ++i) {
            if (groupIndex >= geoset.Groups[groupCounter].length) {
                groupIndex = 0;
                groupCounter++;
            }
            geoset.Groups[groupCounter][groupIndex++] = state.int32();
        }

        geoset.MaterialID = state.int32();
        geoset.SelectionGroup = state.int32();
        geoset.Unselectable = state.int32() > 0;

        parseExtent(geoset, state);

        let geosetAnimCount = state.int32();
        geoset.Anims = [];

        for (let i = 0; i < geosetAnimCount; ++i) {
            let geosetAnim: GeosetAnimInfo = {} as GeosetAnimInfo;

            parseExtent(geosetAnim, state);

            geoset.Anims.push(geosetAnim);
        }

        state.expectKeyword('UVAS', 'Incorrect geosets format');
        let textureChunkCount = state.int32();
        geoset.TVertices = [];

        for (let i = 0; i < textureChunkCount; ++i) {
            state.expectKeyword('UVBS', 'Incorrect geosets format');
            let textureCoordsCount = state.int32();

            let tvertices = new Float32Array(textureCoordsCount * 2);
            for (let i = 0; i < textureCoordsCount * 2; ++i) {
                tvertices[i] = state.float32();
            }

            geoset.TVertices.push(tvertices);
        }

        model.Geosets.push(geoset);
    }
}

function parseGeosetAnims (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let animStartPos = state.pos;
        let animSize = state.int32();

        let geosetAnim: GeosetAnim = {} as GeosetAnim;

        geosetAnim.Alpha = state.float32();
        geosetAnim.Flags = state.int32();
        geosetAnim.Color = new Float32Array(3);
        for (let i = 0; i < 3; ++i) {
            geosetAnim.Color[i] = state.float32();
        }
        geosetAnim.GeosetId = state.int32();
        if (geosetAnim.GeosetId === NONE) {
            geosetAnim.GeosetId = null;
        }

        while (state.pos < animStartPos + animSize) {
            let keyword = state.keyword();

            if (keyword === 'KGAO') {
                geosetAnim.Alpha = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KGAC') {
                geosetAnim.Color = state.animVector(AnimVectorType.FLOAT3);
            } else {
                throw new Error('Incorrect GeosetAnim chunk data ' + keyword);
            }
        }

        model.GeosetAnims.push(geosetAnim);
    }
}

const MODEL_NODE_NAME_LENGTH = 0x50;
function parseNode (model: Model, node: Node, state: State): void {
    let startPos = state.pos;
    let size = state.int32();

    node.Name = state.str(MODEL_NODE_NAME_LENGTH);
    node.ObjectId = state.int32();
    if (node.ObjectId === NONE) {
        node.ObjectId = null;
    }
    node.Parent = state.int32();
    if (node.Parent === NONE) {
        node.Parent = null;
    }
    node.Flags = state.int32();

    while (state.pos < startPos + size) {
        let keyword = state.keyword();

        if (keyword === 'KGTR') {
            node.Translation = state.animVector(AnimVectorType.FLOAT3);
        } else if (keyword === 'KGRT') {
            node.Rotation = state.animVector(AnimVectorType.FLOAT4);
        } else if (keyword === 'KGSC') {
            node.Scaling = state.animVector(AnimVectorType.FLOAT3);
        } else {
            throw new Error('Incorrect node chunk data ' + keyword);
        }
    }

    model.Nodes[node.ObjectId] = node;
}

function parseBones (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let bone: Bone = {} as Bone;

        parseNode(model, bone, state);

        bone.GeosetId = state.int32();
        if (bone.GeosetId === NONE) {
            bone.GeosetId = null;
        }
        bone.GeosetAnimId = state.int32();
        if (bone.GeosetAnimId === NONE) {
            bone.GeosetAnimId = null;
        }

        model.Bones.push(bone);
    }
}

function parseHelpers (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let helper: Helper = {} as Helper;

        parseNode(model, helper, state);

        model.Helpers.push(helper);
    }
}

const MODEL_ATTACHMENT_PATH_LENGTH = 0x100;
function parseAttachments (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let attachmentStart = state.pos;
        let attachmentSize = state.int32();
        let attachment: Attachment = {} as Attachment;

        parseNode(model, attachment, state);

        attachment.Path = state.str(MODEL_ATTACHMENT_PATH_LENGTH);
        state.int32(); // unknown 4-byte
        attachment.AttachmentID = state.int32();

        if (state.pos < attachmentStart + attachmentSize) {
            state.expectKeyword('KATV', 'Incorrect attachment chunk data');

            attachment.Visibility = state.animVector(AnimVectorType.FLOAT1);
        }

        model.Attachments.push(attachment);
    }
}

function parsePivotPoints (model: Model, state: State, size: number): void {
    let pointsCount = size / (4 * 3);

    for (let i = 0; i < pointsCount; ++i) {
        model.PivotPoints[i] = new Float32Array(3);
        model.PivotPoints[i][0] = state.float32();
        model.PivotPoints[i][1] = state.float32();
        model.PivotPoints[i][2] = state.float32();
    }
}

function parseEventObjects (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let eventObject: EventObject = {} as EventObject;

        parseNode(model, eventObject, state);
        state.expectKeyword('KEVT', 'Incorrect EventObject chunk data');

        let eventTrackCount = state.int32();
        eventObject.EventTrack = new Uint32Array(eventTrackCount);
        state.int32(); // unused 4-byte?
        for (let i = 0; i < eventTrackCount; ++i) {
            eventObject.EventTrack[i] = state.int32();
        }

        model.EventObjects.push(eventObject);
    }
}

function parseCollisionShapes (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let collisionShape: CollisionShape = {} as CollisionShape;

        parseNode(model, collisionShape, state);

        collisionShape.Shape = state.int32();

        if (collisionShape.Shape === CollisionShapeType.Box) {
            collisionShape.Vertices = new Float32Array(6);
        } else {
            collisionShape.Vertices = new Float32Array(3);
        }

        for (let i = 0; i < collisionShape.Vertices.length; ++i) {
            collisionShape.Vertices[i] = state.float32();
        }

        if (collisionShape.Shape === CollisionShapeType.Sphere) {
            collisionShape.BoundsRadius = state.float32();
        }

        model.CollisionShapes.push(collisionShape);
    }
}

function parseGlobalSequences (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    model.GlobalSequences = [];

    while (state.pos < startPos + size) {
        model.GlobalSequences.push(state.int32());
    }
}

const MODEL_PARTICLE_EMITTER_PATH_LENGTH = 0x100;
function parseParticleEmitters (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let emitterStart = state.pos;
        let emitterSize = state.int32();
        let emitter: ParticleEmitter = {} as ParticleEmitter;

        parseNode(model, emitter, state);

        emitter.EmissionRate = state.float32();
        emitter.Gravity = state.float32();
        emitter.Longitude = state.float32();
        emitter.Latitude = state.float32();

        emitter.Path = state.str(MODEL_PARTICLE_EMITTER_PATH_LENGTH);
        state.int32();

        emitter.LifeSpan = state.float32();
        emitter.InitVelocity = state.float32();

        while (state.pos < emitterStart + emitterSize) {
            let keyword = state.keyword();

            if (keyword === 'KPEV') {
                emitter.Visibility = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KPEE') {
                emitter.EmissionRate = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KPEG') {
                emitter.Gravity = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KPLN') {
                emitter.Longitude = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KPLT') {
                emitter.Latitude = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KPEL') {
                emitter.LifeSpan = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KPES') {
                emitter.InitVelocity = state.animVector(AnimVectorType.FLOAT1);
            } else {
                throw new Error('Incorrect particle emitter chunk data ' + keyword);
            }
        }

        model.ParticleEmitters.push(emitter);
    }
}

function parseParticleEmitters2 (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let emitterStart = state.pos;
        let emitterSize = state.int32();
        let emitter: ParticleEmitter2 = {} as ParticleEmitter2;

        parseNode(model, emitter, state);

        emitter.Speed = state.float32();
        emitter.Variation = state.float32();
        emitter.Latitude = state.float32();
        emitter.Gravity = state.float32();
        emitter.LifeSpan = state.float32();
        emitter.EmissionRate = state.float32();
        emitter.Width = state.float32();
        emitter.Length = state.float32();

        emitter.FilterMode = state.int32();
        emitter.Rows = state.int32();
        emitter.Columns = state.int32();

        let frameFlags = state.int32();
        emitter.FrameFlags = 0;
        if (frameFlags === 0 || frameFlags === 2) {
            emitter.FrameFlags |= ParticleEmitter2FramesFlags.Head;
        }
        if (frameFlags === 1 || frameFlags === 2) {
            emitter.FrameFlags |= ParticleEmitter2FramesFlags.Tail;
        }

        emitter.TailLength = state.float32();
        emitter.Time = state.float32();

        emitter.SegmentColor = [];
        // always 3 segments
        for (let i = 0; i < 3; ++i) {
            emitter.SegmentColor[i] = new Float32Array(3);
            //  rgb order, inverse from mdl
            for (let j = 0; j < 3; ++j) {
                emitter.SegmentColor[i][j] = state.float32();
            }
        }

        emitter.Alpha = new Uint8Array(3);
        for (let i = 0; i < 3; ++i) {
            emitter.Alpha[i] = state.uint8();
        }

        emitter.ParticleScaling = new Float32Array(3);
        for (let i = 0; i < 3; ++i) {
            emitter.ParticleScaling[i] = state.float32();
        }

        for (let part of ['LifeSpanUVAnim', 'DecayUVAnim', 'TailUVAnim', 'TailDecayUVAnim']) {
            emitter[part] = new Uint32Array(3);
            for (let i = 0; i < 3; ++i) {
                emitter[part][i] = state.int32();
            }
        }

        emitter.TextureID = state.int32();
        if (emitter.TextureID === NONE) {
            emitter.TextureID = null;
        }
        emitter.Squirt = state.int32() > 0;
        emitter.PriorityPlane = state.int32();
        emitter.ReplaceableId = state.int32();

        while (state.pos < emitterStart + emitterSize) {
            let keyword = state.keyword();

            if (keyword === 'KP2V') {
                emitter.Visibility = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KP2E') {
                emitter.EmissionRate = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KP2W') {
                emitter.Width = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KP2N') {
                emitter.Length = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KP2S') {
                emitter.Speed = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KP2L') {
                emitter.Latitude = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KP2G') {
                emitter.Gravity = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KP2R') {
                emitter.Variation = state.animVector(AnimVectorType.FLOAT1);
            } else {
                throw new Error('Incorrect particle emitter2 chunk data ' + keyword);
            }
        }

        model.ParticleEmitters2.push(emitter);
    }
}

const MODEL_CAMERA_NAME_LENGTH = 0x50;
function parseCameras (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let cameraStart = state.pos;
        let cameraSize = state.int32();

        let camera: Camera = {} as Camera;

        camera.Name = state.str(MODEL_CAMERA_NAME_LENGTH);

        camera.Position = new Float32Array(3);
        camera.Position[0] = state.float32();
        camera.Position[1] = state.float32();
        camera.Position[2] = state.float32();

        camera.FieldOfView = state.float32();
        camera.FarClip = state.float32();
        camera.NearClip = state.float32();

        camera.TargetPosition = new Float32Array(3);
        camera.TargetPosition[0] = state.float32();
        camera.TargetPosition[1] = state.float32();
        camera.TargetPosition[2] = state.float32();

        while (state.pos < cameraStart + cameraSize) {
            let keyword = state.keyword();

            if (keyword === 'KCTR') {
                camera.Translation = state.animVector(AnimVectorType.FLOAT3);
            } else if (keyword === 'KTTR') {
                camera.TargetTranslation = state.animVector(AnimVectorType.FLOAT3);
            } else if (keyword === 'KCRL') {
                camera.Rotation = state.animVector(AnimVectorType.FLOAT1);
            } else {
                throw new Error('Incorrect camera chunk data ' + keyword);
            }
        }

        model.Cameras.push(camera);
    }
}

function parseLights (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let lightStart = state.pos;
        let lightSize = state.int32();

        let light: Light = {} as Light;

        parseNode(model, light, state);

        light.LightType = state.int32();
        light.AttenuationStart = state.float32();
        light.AttenuationEnd = state.float32();

        light.Color = new Float32Array(3);
        //  rgb order, inverse from mdl
        for (let j = 0; j < 3; ++j) {
            light.Color[j] = state.float32();
        }

        light.Intensity = state.float32();

        light.AmbColor = new Float32Array(3);
        //  rgb order, inverse from mdl
        for (let j = 0; j < 3; ++j) {
            light.AmbColor[j] = state.float32();
        }

        light.AmbIntensity = state.float32();

        while (state.pos < lightStart + lightSize) {
            let keyword = state.keyword();

            if (keyword === 'KLAV') {
                light.Visibility = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KLAC') {
                light.Color = state.animVector(AnimVectorType.FLOAT3);
            } else if (keyword === 'KLAI') {
                light.Intensity = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KLBC') {
                light.AmbColor = state.animVector(AnimVectorType.FLOAT3);
            } else if (keyword === 'KLBI') {
                light.AmbIntensity = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KLAS') {
                light.AttenuationStart = state.animVector(AnimVectorType.INT1);
            } else if (keyword === 'KLAE') {
                light.AttenuationEnd = state.animVector(AnimVectorType.INT1);
            } else {
                throw new Error('Incorrect light chunk data ' + keyword);
            }
        }

        model.Lights.push(light);
    }
}

function parseTextureAnims (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let animStart = state.pos;
        let animSize = state.int32();

        let anim: TVertexAnim = {} as TVertexAnim;

        while (state.pos < animStart + animSize) {
            let keyword = state.keyword();

            if (keyword === 'KTAT') {
                anim.Translation = state.animVector(AnimVectorType.FLOAT3);
            } else if (keyword === 'KTAR') {
                anim.Rotation = state.animVector(AnimVectorType.FLOAT4);
            } else if (keyword === 'KTAS') {
                anim.Scaling = state.animVector(AnimVectorType.FLOAT3);
            } else {
                throw new Error('Incorrect light chunk data ' + keyword);
            }
        }

        model.TextureAnims.push(anim);
    }
}

function parseRibbonEmitters (model: Model, state: State, size: number): void {
    let startPos = state.pos;

    while (state.pos < startPos + size) {
        let emitterStart = state.pos;
        let emitterSize = state.int32();

        let emitter: RibbonEmitter = {} as RibbonEmitter;

        parseNode(model, emitter, state);

        emitter.HeightAbove = state.float32();
        emitter.HeightBelow = state.float32();
        emitter.Alpha = state.float32();

        emitter.Color = new Float32Array(3);
        //  rgb order, inverse from mdl
        for (let j = 0; j < 3; ++j) {
            emitter.Color[j] = state.float32();
        }

        emitter.LifeSpan = state.float32();
        emitter.TextureSlot = state.int32();

        emitter.EmissionRate = state.int32();
        emitter.Rows = state.int32();
        emitter.Columns = state.int32();
        emitter.MaterialID = state.int32();
        emitter.Gravity = state.float32();

        while (state.pos < emitterStart + emitterSize) {
            let keyword = state.keyword();

            if (keyword === 'KRVS') {
                emitter.Visibility = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KRHA') {
                emitter.HeightAbove = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KRHB') {
                emitter.HeightBelow = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KRAL') {
                emitter.Alpha = state.animVector(AnimVectorType.FLOAT1);
            } else if (keyword === 'KRTX') {
                emitter.TextureSlot = state.animVector(AnimVectorType.INT1);
            } else {
                throw new Error('Incorrect ribbon emitter chunk data ' + keyword);
            }
        }

        model.RibbonEmitters.push(emitter);
    }
}

const parsers: {[key: string]: (model: Model, state: State, size: number) => void} = {
    VERS: parseVersion,
    MODL: parseModelInfo,
    SEQS: parseSequences,
    MTLS: parseMaterials,
    TEXS: parseTextures,
    GEOS: parseGeosets,
    GEOA: parseGeosetAnims,
    BONE: parseBones,
    HELP: parseHelpers,
    ATCH: parseAttachments,
    PIVT: parsePivotPoints,
    EVTS: parseEventObjects,
    CLID: parseCollisionShapes,
    GLBS: parseGlobalSequences,
    PREM: parseParticleEmitters,
    PRE2: parseParticleEmitters2,
    CAMS: parseCameras,
    LITE: parseLights,
    TXAN: parseTextureAnims,
    RIBB: parseRibbonEmitters
};

export function parse (arrayBuffer: ArrayBuffer): Model {
    const state = new State(arrayBuffer);

    if (state.keyword() !== 'MDLX') {
        throw new Error('Not a mdx model');
    }

    let model: Model = {
        // default
        Version: 800,
        Info: {
            Name: '',
            MinimumExtent: null,
            MaximumExtent: null,
            BoundsRadius: 0,
            BlendTime: 150
        },
        Sequences: [],
        GlobalSequences: [],
        Textures: [],
        Materials: [],
        TextureAnims: [],
        Geosets: [],
        GeosetAnims: [],
        Bones: [],
        Helpers: [],
        Attachments: [],
        EventObjects: [],
        ParticleEmitters: [],
        ParticleEmitters2: [],
        Cameras: [],
        Lights: [],
        RibbonEmitters: [],
        CollisionShapes: [],
        PivotPoints: [],
        Nodes: []
    };

    while (state.pos < state.length) {
        const keyword = state.keyword();
        const size = state.int32();

        if (keyword in parsers) {
            parsers[keyword](model, state, size);
        } else {
            throw new Error('Unknown group ' + keyword);
        }
    }

    for (let i = 0; i < model.Nodes.length; ++i) {
        if (model.Nodes[i] && model.PivotPoints[i]) {
            model.Nodes[i].PivotPoint = model.PivotPoints[i];
        }
    }

    return model;
}
