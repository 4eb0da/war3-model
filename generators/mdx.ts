import {
    Model, Sequence, Material, Layer, AnimVector, LineType, TVertexAnim, Geoset, GeosetAnim, Node,
    Bone, Light, Attachment, ParticleEmitter2, ParticleEmitter2FramesFlags, RibbonEmitter, Camera, EventObject,
    CollisionShape, CollisionShapeType, ParticleEmitter
} from '../model';

const BIG_ENDIAN = true;
const NONE = -1;

class Stream {
    private readonly ab: ArrayBuffer;
    private readonly uint: Uint8Array;
    private readonly view: DataView;
    private pos: number;

    constructor (arrayBuffer: ArrayBuffer) {
        this.ab = arrayBuffer;
        this.uint = new Uint8Array(this.ab);
        this.view = new DataView(this.ab);
        this.pos = 0;
    }

    public keyword (keyword: string): void {
        this.uint[this.pos    ] = keyword.charCodeAt(0);
        this.uint[this.pos + 1] = keyword.charCodeAt(1);
        this.uint[this.pos + 2] = keyword.charCodeAt(2);
        this.uint[this.pos + 3] = keyword.charCodeAt(3);

        this.pos += 4;
    }

    public uint8 (num: number): void {
        this.view.setUint8(this.pos, num);
        this.pos += 1;
    }

    public uint16 (num: number): void {
        this.view.setUint16(this.pos, num, BIG_ENDIAN);
        this.pos += 2;
    }

    public int32 (num: number): void {
        this.view.setInt32(this.pos, num, BIG_ENDIAN);
        this.pos += 4;
    }

    public uint32 (num: number): void {
        this.view.setUint32(this.pos, num, BIG_ENDIAN);
        this.pos += 4;
    }

    public float32 (num: number): void {
        this.view.setFloat32(this.pos, num, BIG_ENDIAN);
        this.pos += 4;
    }

    public float32Array (arr: Float32Array): void {
        for (let i = 0; i < arr.length; ++i) {
            this.float32(arr[i]);
        }
    }

    public uint8Array (arr: Uint8Array): void {
        for (let i = 0; i < arr.length; ++i) {
            this.uint8(arr[i]);
        }
    }

    public uint16Array (arr: Uint16Array): void {
        for (let i = 0; i < arr.length; ++i) {
            this.uint16(arr[i]);
        }
    }

    public int32Array (arr: Int32Array): void {
        for (let i = 0; i < arr.length; ++i) {
            this.int32(arr[i]);
        }
    }

    public uint32Array (arr: Uint32Array): void {
        for (let i = 0; i < arr.length; ++i) {
            this.uint32(arr[i]);
        }
    }

    public str (str: string, len: number): void {
        for (let i = 0; i < len; ++i, ++this.pos) {
            this.uint[this.pos] = i < str.length ? str.charCodeAt(i) : 0;
        }
    }

    public animVector (animVector: AnimVector, type: AnimVectorType): void {
        let isInt = type === AnimVectorType.INT1;

        this.int32(animVector.Keys.length);
        this.int32(animVector.LineType);
        this.int32(animVector.GlobalSeqId !== null ? animVector.GlobalSeqId : NONE);

        for (let keyFrame of animVector.Keys) {
            this.int32(keyFrame.Frame);
            if (isInt) {
                this.int32Array(keyFrame.Vector);
            } else {
                this.float32Array(keyFrame.Vector);
            }
            if (animVector.LineType === LineType.Hermite || animVector.LineType === LineType.Bezier) {
                if (isInt) {
                    this.int32Array(keyFrame.InTan);
                    this.int32Array(keyFrame.OutTan);
                } else {
                    this.float32Array(keyFrame.InTan);
                    this.float32Array(keyFrame.OutTan);
                }
            }
        }
    }
}

interface ObjWithExtent {
    BoundsRadius: number;
    MinimumExtent: Float32Array;
    MaximumExtent: Float32Array;
}

function generateExtent (obj: ObjWithExtent, stream: Stream): void {
    stream.float32(obj.BoundsRadius);

    for (let key of ['MinimumExtent', 'MaximumExtent']) {
        stream.float32Array(obj[key]);
    }
}


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

function byteLengthAnimVector (animVector: AnimVector, type: AnimVectorType): number {
    return 4 /* key count */ +
        4 /* LineType */ +
        4 /* GlobalSeqId */ +
        animVector.Keys.length * (
            4 /* frame */ +
            4 * animVectorSize[type] *
                (animVector.LineType === LineType.Hermite || animVector.LineType === LineType.Bezier ? 3 : 1)
        );
}


function sum (arr) {
    return arr.reduce((a, b) => {
        return a + b;
    }, 0);
}


function byteLengthVersion (): number {
    return 4 /* keyword */ +
        4 /* size */ +
        4 /* version */;
}

function generateVersion (model: Model, stream: Stream): void {
    stream.keyword('VERS');
    stream.int32(4);
    stream.int32(model.Version);
}


const MODEL_NAME_LENGTH = 0x150;
function byteLengthModelInfo (): number {
    return 4 /* keyword */ +
        4 /* size */ +
        MODEL_NAME_LENGTH +
        4 /* 4-byte zero ? */ +
        4 * 7 /* extent */ +
        4; /* blend time */
}

function generateModelInfo (model: Model, stream: Stream): void {
    stream.keyword('MODL');
    stream.int32(byteLengthModelInfo() - 8);
    stream.str(model.Info.Name, MODEL_NAME_LENGTH);
    stream.int32(0);
    generateExtent(model.Info, stream);
    stream.int32(model.Info.BlendTime);
}


const MODEL_SEQUENCE_NAME_LENGTH = 0x50;
function byteLengthSequence (): number {
    return MODEL_SEQUENCE_NAME_LENGTH +
        4 * 2 /* interval */ +
        4 /* MoveSpeed */ +
        4 /* NonLooping */ +
        4 /* Rarity */ +
        4 +
        4 * 7; /* extent */
}

function byteLengthSequences (model: Model): number {
    if (!model.Sequences.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Sequences.map(byteLengthSequence));
}

function generateSequences (model: Model, stream: Stream): void {
    if (!model.Sequences.length) {
        return;
    }

    stream.keyword('SEQS');
    stream.int32(byteLengthSequences(model) - 8);

    for (let sequence of model.Sequences) {
        stream.str(sequence.Name, MODEL_SEQUENCE_NAME_LENGTH);
        stream.int32(sequence.Interval[0]);
        stream.int32(sequence.Interval[1]);
        stream.float32(sequence.MoveSpeed);
        stream.int32(sequence.NonLooping ? 1 : 0);
        stream.float32(sequence.Rarity);
        stream.int32(0);
        generateExtent(sequence, stream);
    }
}


function byteLengthGlobalSequences (model: Model): number {
    if (!model.GlobalSequences || !model.GlobalSequences.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        4 * model.GlobalSequences.length;
}

function generateGlobalSequences (model: Model, stream: Stream): void {
    if (!model.GlobalSequences || !model.GlobalSequences.length) {
        return;
    }

    stream.keyword('GLBS');
    stream.int32(model.GlobalSequences.length * 4);
    for (let duration of model.GlobalSequences) {
        stream.int32(duration);
    }
}


function byteLengthLayer (layer: Layer): number {
    return 4 /* size */ +
        4 /* FilterMode */ +
        4 /* Shading */ +
        4 /* static TextureID */ +
        4 /* TVertexAnimId */ +
        4 +
        4 /* static Alpha */ +
        (layer.Alpha !== null && typeof layer.Alpha !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(layer.Alpha as AnimVector, AnimVectorType.FLOAT1) :
            0
        ) +
        (layer.TextureID !== null && typeof layer.TextureID !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(layer.TextureID as AnimVector, AnimVectorType.INT1) :
            0
        );
}

function byteLengthMaterial (material: Material): number {
    return 4 /* size */ +
        4 /* PriorityPlane */ +
        4 /* RenderMode */ +
        4 /* LAYS keyword */ +
        4 /* layer count */ +
        sum(material.Layers.map(layer => byteLengthLayer(layer)));
}

function byteLengthMaterials (model: Model): number {
    if (!model.Materials.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Materials.map(material => byteLengthMaterial(material)));
}

function generateMaterials (model: Model, stream: Stream): void {
    if (!model.Materials.length) {
        return;
    }

    stream.keyword('MTLS');
    stream.int32(byteLengthMaterials(model) - 8);

    for (let material of model.Materials) {
        stream.int32(byteLengthMaterial(material));
        stream.int32(material.PriorityPlane);
        stream.int32(material.RenderMode);
        stream.keyword('LAYS');
        stream.int32(material.Layers.length);

        for (let layer of material.Layers) {
            stream.int32(byteLengthLayer(layer));
            stream.int32(layer.FilterMode);
            stream.int32(layer.Shading);
            stream.int32(typeof layer.TextureID === 'number' ? layer.TextureID : 0);
            stream.int32(layer.TVertexAnimId !== null ? layer.TVertexAnimId : NONE);
            stream.int32(layer.CoordId);
            stream.float32(typeof layer.Alpha === 'number' ? layer.Alpha : 1);

            if (layer.Alpha && typeof layer.Alpha !== 'number') {
                stream.keyword('KMTA');
                stream.animVector(layer.Alpha, AnimVectorType.FLOAT1);
            }
            if (layer.TextureID && typeof layer.TextureID !== 'number') {
                stream.keyword('KMTF');
                stream.animVector(layer.TextureID, AnimVectorType.INT1);
            }
        }
    }
}


const MODEL_TEXTURE_PATH_LENGTH = 0x100;
function byteLengthTexture (): number {
    return 4 /* ReplaceableId */ +
        MODEL_TEXTURE_PATH_LENGTH +
        4 /* str trailing zero ? */ +
        4 /* Flags */;
}

function byteLengthTextures (model: Model): number {
    if (!model.Textures.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Textures.map(texture => byteLengthTexture()));
}

function generateTextures (model: Model, stream: Stream): void {
    if (!model.Textures.length) {
        return;
    }

    stream.keyword('TEXS');
    stream.int32(byteLengthTextures(model) - 8);

    for (let texture of model.Textures) {
        stream.int32(texture.ReplaceableId);
        stream.str(texture.Image, MODEL_TEXTURE_PATH_LENGTH);
        stream.int32(0);
        stream.int32(texture.Flags);
    }
}


function byteLengthTextureAnim (anim: TVertexAnim): number {
    return 4 /* size */ +
        (anim.Translation ? 4 /* keyword */ + byteLengthAnimVector(anim.Translation, AnimVectorType.FLOAT3) : 0) +
        (anim.Rotation ? 4 /* keyword */ + byteLengthAnimVector(anim.Rotation, AnimVectorType.FLOAT4) : 0) +
        (anim.Scaling ? 4 /* keyword */ + byteLengthAnimVector(anim.Scaling, AnimVectorType.FLOAT3) : 0);
}

function byteLengthTextureAnims (model: Model): number {
    if (!model.TextureAnims || !model.TextureAnims.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.TextureAnims.map(anim => byteLengthTextureAnim(anim)));
}

function generateTextureAnims (model: Model, stream: Stream): void {
    if (!model.TextureAnims || !model.TextureAnims.length) {
        return;
    }

    stream.keyword('TXAN');
    stream.int32(byteLengthTextureAnims(model) - 8);

    for (let anim of model.TextureAnims) {
        stream.int32(byteLengthTextureAnim(anim));

        if (anim.Translation) {
            stream.keyword('KTAT');
            stream.animVector(anim.Translation, AnimVectorType.FLOAT3);
        }
        if (anim.Rotation) {
            stream.keyword('KTAR');
            stream.animVector(anim.Rotation, AnimVectorType.FLOAT4);
        }
        if (anim.Scaling) {
            stream.keyword('KTAS');
            stream.animVector(anim.Scaling, AnimVectorType.FLOAT3);
        }
    }
}


function byteLengthGeoset (geoset: Geoset): number {
    return 4 /* size */ +
        4 /* VRTX keyword */ +
        4 /* vertices count */ +
        4 * geoset.Vertices.length /* vertices data */ +
        4 /* NRMS keyword */ +
        4 /* normals count */ +
        4 * geoset.Normals.length /* normals data */ +
        4 /* PTYP keyword */ +
        4 /* primitive count */ +
        4 /* int "4" */ +
        4 /* PCNT keyword */ +
        4 /* face group count */ +
        4 /* faces count */ +
        4 /* PVTX keyword */ +
        4 /* indices count */ +
        2 * geoset.Faces.length /* indices data */ +
        4 /* GNDX keyword */ +
        4 /* vertex group count */ +
        geoset.VertexGroup.length /* vertex group data */ +
        4 /* MTGC keyword */ +
        4 /* group count */ +
        4 * geoset.Groups.length /* group data */ +
        4 /* MATS keyword */ +
        4 /* total group count */ +
        4 * geoset.TotalGroupsCount /* groups data */ +
        4 /* MaterialID */ +
        4 /* SelectionGroup */ +
        4 /* Unselectable */ +
        4 * 7 /* extent */ +
        4 /* geoset anim count */ +
        4 * 7 * geoset.Anims.length /* geoset anim data */ +
        4 /* UVAS keyword */ +
        4 /* TVertices count */ +
        sum(geoset.TVertices.map(tvertices =>
            4 /* UVBS keyword */ +
            4 /* texture coord count */ +
            4 * tvertices.length /* texture coord data */
        ));
}

function byteLengthGeosets (model: Model): number {
    if (!model.Geosets.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Geosets.map(geoset => byteLengthGeoset(geoset)));
}

function generateGeosets (model: Model, stream: Stream): void {
    if (!model.Geosets.length) {
        return;
    }

    stream.keyword('GEOS');
    stream.int32(byteLengthGeosets(model) - 8);

    for (let geoset of model.Geosets) {
        stream.int32(byteLengthGeoset(geoset));

        stream.keyword('VRTX');
        stream.int32(geoset.Vertices.length / 3);
        stream.float32Array(geoset.Vertices);

        stream.keyword('NRMS');
        stream.int32(geoset.Normals.length / 3);
        stream.float32Array(geoset.Normals);

        stream.keyword('PTYP');
        stream.int32(1);
        stream.int32(4);

        stream.keyword('PCNT');
        stream.int32(1);
        stream.int32(geoset.Faces.length);

        stream.keyword('PVTX');
        stream.int32(geoset.Faces.length);
        stream.uint16Array(geoset.Faces);

        stream.keyword('GNDX');
        stream.int32(geoset.VertexGroup.length);
        stream.uint8Array(geoset.VertexGroup);

        stream.keyword('MTGC');
        stream.int32(geoset.Groups.length);
        for (let i = 0; i < geoset.Groups.length; ++i) {
            stream.int32(geoset.Groups[i].length);
        }

        stream.keyword('MATS');
        stream.int32(geoset.TotalGroupsCount);
        for (let group of geoset.Groups) {
            for (let index of group) {
                stream.int32(index);
            }
        }

        stream.int32(geoset.MaterialID);
        stream.int32(geoset.SelectionGroup);
        stream.int32(geoset.Unselectable ? 4 : 0);

        generateExtent(geoset, stream);

        stream.int32(geoset.Anims.length);
        for (let anim of geoset.Anims) {
            generateExtent(anim, stream);
        }

        stream.keyword('UVAS');
        stream.int32(geoset.TVertices.length);

        for (let tvertices of geoset.TVertices) {
            stream.keyword('UVBS');
            stream.int32(tvertices.length / 2);
            stream.float32Array(tvertices);
        }
    }
}


function byteLengthGeosetAnim (anim: GeosetAnim): number {
    return 4 /* size */ +
        4 /* static Alpha */ +
        4 /* Flags */ +
        4 * 3 /* static Color */ +
        4 /* GeosetId */ +
        (typeof anim.Alpha !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(anim.Alpha, AnimVectorType.FLOAT1) :
            0
        ) +
        (anim.Color && !(anim.Color instanceof Float32Array) ?
            4 /* keyword */ + byteLengthAnimVector(anim.Color, AnimVectorType.FLOAT3) :
            0
        );
}

function byteLengthGeosetAnims (model: Model): number {
    if (!model.GeosetAnims.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.GeosetAnims.map(anim => byteLengthGeosetAnim(anim)));
}

function generateGeosetAnims (model: Model, stream: Stream): void {
    if (!model.GeosetAnims.length) {
        return;
    }

    stream.keyword('GEOA');
    stream.int32(byteLengthGeosetAnims(model) - 8);

    for (let anim of model.GeosetAnims) {
        stream.int32(byteLengthGeosetAnim(anim));
        stream.float32(typeof anim.Alpha === 'number' ? anim.Alpha : 1);
        stream.int32(anim.Flags);
        if (anim.Color && anim.Color instanceof Float32Array) {
            stream.float32(anim.Color[0]);
            stream.float32(anim.Color[1]);
            stream.float32(anim.Color[2]);
        } else {
            stream.float32(1);
            stream.float32(1);
            stream.float32(1);
        }
        stream.int32(anim.GeosetId !== null ? anim.GeosetId : NONE);

        if (anim.Alpha !== null && typeof anim.Alpha !== 'number') {
            stream.keyword('KGAO');
            stream.animVector(anim.Alpha, AnimVectorType.FLOAT1);
        }
        if (anim.Color && !(anim.Color instanceof Float32Array)) {
            stream.keyword('KGAC');
            stream.animVector(anim.Color, AnimVectorType.FLOAT3);
        }
    }
}


const MODEL_NODE_NAME_LENGTH = 0x50;
function byteLengthNode (node: Node): number {
    return 4 /* size */ +
        MODEL_NODE_NAME_LENGTH +
        4 /* ObjectId */ +
        4 /* Parent */ +
        4 /* Flags */ +
        (node.Translation ? 4 /*keyword */ + byteLengthAnimVector(node.Translation, AnimVectorType.FLOAT3) : 0) +
        (node.Rotation ? 4 /*keyword */ + byteLengthAnimVector(node.Rotation, AnimVectorType.FLOAT4) : 0) +
        (node.Scaling ? 4 /*keyword */ + byteLengthAnimVector(node.Scaling, AnimVectorType.FLOAT3) : 0);
}

function byteLengthBone (bone: Bone): number {
    return byteLengthNode(bone) +
        4 /* GeosetId */ +
        4; /* GeosetAnimId */
}

function byteLengthBones (model: Model): number {
    if (!model.Bones.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Bones.map(byteLengthBone));
}

function generateNode (node: Node, stream: Stream): void {
    stream.int32(byteLengthNode(node));
    stream.str(node.Name, MODEL_NODE_NAME_LENGTH);
    stream.int32(node.ObjectId !== null ? node.ObjectId : NONE);
    stream.int32(node.Parent !== null ? node.Parent : NONE);
    stream.int32(node.Flags);

    if (node.Translation) {
        stream.keyword('KGTR');
        stream.animVector(node.Translation, AnimVectorType.FLOAT3);
    }

    if (node.Rotation) {
        stream.keyword('KGRT');
        stream.animVector(node.Rotation, AnimVectorType.FLOAT4);
    }

    if (node.Scaling) {
        stream.keyword('KGSC');
        stream.animVector(node.Scaling, AnimVectorType.FLOAT3);
    }
}

function generateBones (model: Model, stream: Stream): void {
    if (!model.Bones.length) {
        return;
    }

    stream.keyword('BONE');
    stream.int32(byteLengthBones(model) - 8);

    for (let bone of model.Bones) {
        generateNode(bone, stream);
        stream.int32(bone.GeosetId !== null ? bone.GeosetId : NONE);
        stream.int32(bone.GeosetAnimId !== null ? bone.GeosetAnimId : NONE);
    }
}


function byteLengthLight (light: Light): number {
    return 4 /* size */ +
        byteLengthNode(light) +
        4 /* LightType */ +
        4 /* AttenuationStart */ +
        4 /* AttenuationEnd */ +
        4 * 3 /* static Color */ +
        4 /* static Intensity */ +
        4 * 3 /* static AmbColor */ +
        4 /* static AmbIntensity */ +
        (light.Visibility ? 4 /* keyword */ + byteLengthAnimVector(light.Visibility, AnimVectorType.FLOAT1) : 0) +
        (light.Color && !(light.Color instanceof Float32Array) ?
            4 /* keyword */ + byteLengthAnimVector(light.Color as AnimVector, AnimVectorType.FLOAT3) :
            0
        ) +
        (light.Intensity && typeof light.Intensity !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(light.Intensity, AnimVectorType.FLOAT1) :
            0
        ) +
        (light.AttenuationStart && typeof light.AttenuationStart !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(light.AttenuationStart, AnimVectorType.FLOAT1) :
            0
        ) +
        (light.AttenuationEnd && typeof light.AttenuationEnd !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(light.AttenuationEnd, AnimVectorType.FLOAT1) :
            0
        ) +
        (light.AmbColor && !(light.AmbColor instanceof Float32Array) ?
            4 /* keyword */ + byteLengthAnimVector(light.AmbColor as AnimVector, AnimVectorType.FLOAT3) :
            0
        ) +
        (light.AmbIntensity && typeof light.AmbIntensity !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(light.AmbIntensity, AnimVectorType.FLOAT1) :
            0
        );
}

function byteLengthLights (model: Model): number {
    if (!model.Lights.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Lights.map(byteLengthLight));
}

function generateLights (model: Model, stream: Stream): void {
    if (!model.Lights.length) {
        return;
    }

    stream.keyword('LITE');
    stream.int32(byteLengthLights(model) - 8);

    for (let light of model.Lights) {
        stream.int32(byteLengthLight(light));
        generateNode(light, stream);
        stream.int32(light.LightType);
        stream.float32(typeof light.AttenuationStart === 'number' ? light.AttenuationStart : 0);
        stream.float32(typeof light.AttenuationEnd === 'number' ? light.AttenuationEnd : 0);

        if (light.Color instanceof Float32Array) {
            stream.float32(light.Color[0]);
            stream.float32(light.Color[1]);
            stream.float32(light.Color[2]);
        } else {
            stream.float32(1);
            stream.float32(1);
            stream.float32(1);
        }

        stream.float32(typeof light.Intensity === 'number' ? light.Intensity : 0);

        if (light.AmbColor instanceof Float32Array) {
            stream.float32(light.AmbColor[0]);
            stream.float32(light.AmbColor[1]);
            stream.float32(light.AmbColor[2]);
        } else {
            stream.float32(1);
            stream.float32(1);
            stream.float32(1);
        }

        stream.float32(typeof light.AmbIntensity === 'number' ? light.AmbIntensity : 0);

        if (light.Intensity && typeof light.Intensity !== 'number') {
            stream.keyword('KLAI');
            stream.animVector(light.Intensity, AnimVectorType.FLOAT1);
        }
        if (light.Visibility) {
            stream.keyword('KLAV');
            stream.animVector(light.Visibility, AnimVectorType.FLOAT1);
        }
        if (light.Color && !(light.Color instanceof Float32Array)) {
            stream.keyword('KLAC');
            stream.animVector(light.Color, AnimVectorType.FLOAT3);
        }
        if (light.AmbColor && !(light.AmbColor instanceof Float32Array)) {
            stream.keyword('KLBC');
            stream.animVector(light.AmbColor, AnimVectorType.FLOAT3);
        }
        if (light.AmbIntensity && typeof light.AmbIntensity !== 'number') {
            stream.keyword('KLBI');
            stream.animVector(light.AmbIntensity, AnimVectorType.FLOAT1);
        }
        if (light.AttenuationStart && typeof light.AttenuationStart !== 'number') {
            stream.keyword('KLAS');
            stream.animVector(light.AttenuationStart, AnimVectorType.INT1);
        }
        if (light.AttenuationEnd && typeof light.AttenuationEnd !== 'number') {
            stream.keyword('KLAE');
            stream.animVector(light.AttenuationEnd, AnimVectorType.INT1);
        }
    }
}


function byteLengthHelpers (model: Model): number {
    if (model.Helpers.length === 0) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Helpers.map(byteLengthNode));
}

function generateHelpers (model: Model, stream: Stream): void {
    if (model.Helpers.length === 0) {
        return;
    }

    stream.keyword('HELP');
    stream.int32(byteLengthHelpers(model) - 8);

    for (let helper of model.Helpers) {
        generateNode(helper, stream);
    }
}


const MODEL_ATTACHMENT_PATH_LENGTH = 0x100;
function byteLengthAttachment (attachment: Attachment): number {
    return 4 /* size */ +
        byteLengthNode(attachment) +
        MODEL_ATTACHMENT_PATH_LENGTH +
        4 /* zero ? */ +
        4 /* AttachmentID */ +
        (attachment.Visibility ?
            4 /* keyword */ + byteLengthAnimVector(attachment.Visibility, AnimVectorType.FLOAT1) :
            0
        );
}

function byteLengthAttachments (model: Model): number {
    if (model.Attachments.length === 0) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Attachments.map(byteLengthAttachment));
}

function generateAttachments (model: Model, stream: Stream): void {
    if (model.Attachments.length === 0) {
        return;
    }

    stream.keyword('ATCH');
    stream.int32(byteLengthAttachments(model) - 8);

    for (let attachment of model.Attachments) {
        stream.int32(byteLengthAttachment(attachment));
        generateNode(attachment, stream);

        stream.str(attachment.Path || '', MODEL_ATTACHMENT_PATH_LENGTH);
        stream.int32(0);
        stream.int32(attachment.AttachmentID);

        if (attachment.Visibility) {
            stream.keyword('KATV');
            stream.animVector(attachment.Visibility, AnimVectorType.FLOAT1);
        }
    }
}


function byteLengthPivotPoints (model: Model): number {
    if (!model.PivotPoints.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        4 * 3 * model.PivotPoints.length;
}

function generatePivotPoints (model: Model, stream: Stream): void {
    if (!model.PivotPoints.length) {
        return;
    }

    stream.keyword('PIVT');
    stream.int32(model.PivotPoints.length * 4 * 3);

    for (let point of model.PivotPoints) {
        stream.float32Array(point);
    }
}


const MODEL_PARTICLE_EMITTER_PATH_LENGTH = 0x100;
function byteLengthParticleEmitter (emitter: ParticleEmitter): number {
    return 4 /* size */ +
        byteLengthNode(emitter) +
        4 /* EmissionRate */ +
        4 /* Gravity */ +
        4 /* Longitude */ +
        4 /* Latitude */ +
        MODEL_PARTICLE_EMITTER_PATH_LENGTH +
        4 +
        4 /* LifeSpan */ +
        4 /* InitVelocity */ +
        (emitter.Visibility && typeof emitter.Visibility !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Visibility, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.EmissionRate && typeof emitter.EmissionRate !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.EmissionRate, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.Gravity && typeof emitter.Gravity !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Gravity, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.Longitude && typeof emitter.Longitude !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Longitude, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.Latitude && typeof emitter.Latitude !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Latitude, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.LifeSpan && typeof emitter.LifeSpan !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.LifeSpan, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.InitVelocity && typeof emitter.InitVelocity !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.InitVelocity, AnimVectorType.FLOAT1) :
            0
        );
}

function byteLengthParticleEmitters (model: Model): number {
    if (!model.ParticleEmitters.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.ParticleEmitters.map(byteLengthParticleEmitter));
}

function generateParticleEmitters (model: Model, stream: Stream): void {
    if (!model.ParticleEmitters.length) {
        return;
    }

    stream.keyword('PREM');
    stream.int32(byteLengthParticleEmitters(model) - 8);

    for (let emitter of model.ParticleEmitters) {
        stream.int32(byteLengthParticleEmitter(emitter));
        generateNode(emitter, stream);

        stream.float32(typeof emitter.EmissionRate === 'number' ? emitter.EmissionRate : 0);
        stream.float32(typeof emitter.Gravity === 'number' ? emitter.Gravity : 0);
        stream.float32(typeof emitter.Longitude === 'number' ? emitter.Longitude : 0);
        stream.float32(typeof emitter.Latitude === 'number' ? emitter.Latitude : 0);
        stream.str(emitter.Path, MODEL_PARTICLE_EMITTER_PATH_LENGTH);
        stream.int32(0);
        stream.float32(typeof emitter.LifeSpan === 'number' ? emitter.LifeSpan : 0);
        stream.float32(typeof emitter.InitVelocity === 'number' ? emitter.InitVelocity : 0);

        if (emitter.Visibility && typeof emitter.Visibility !== 'number') {
            stream.keyword('KPEV');
            stream.animVector(emitter.Visibility, AnimVectorType.FLOAT1);
        }
        if (emitter.EmissionRate && typeof emitter.EmissionRate !== 'number') {
            stream.keyword('KPEE');
            stream.animVector(emitter.EmissionRate, AnimVectorType.FLOAT1);
        }
        if (emitter.Gravity && typeof emitter.Gravity !== 'number') {
            stream.keyword('KPEG');
            stream.animVector(emitter.Gravity, AnimVectorType.FLOAT1);
        }
        if (emitter.Longitude && typeof emitter.Longitude !== 'number') {
            stream.keyword('KPLN');
            stream.animVector(emitter.Longitude, AnimVectorType.FLOAT1);
        }
        if (emitter.Latitude && typeof emitter.Latitude !== 'number') {
            stream.keyword('KPLT');
            stream.animVector(emitter.Latitude, AnimVectorType.FLOAT1);
        }
        if (emitter.LifeSpan && typeof emitter.LifeSpan !== 'number') {
            stream.keyword('KPEL');
            stream.animVector(emitter.LifeSpan, AnimVectorType.FLOAT1);
        }
        if (emitter.InitVelocity && typeof emitter.InitVelocity !== 'number') {
            stream.keyword('KPES');
            stream.animVector(emitter.InitVelocity, AnimVectorType.FLOAT1);
        }
    }
}


function byteLengthParticleEmitter2 (emitter: ParticleEmitter2): number {
    return 4 /* size */ +
        byteLengthNode(emitter) +
        4 /* static Speed */ +
        4 /* Variation */ +
        4 /* static Latitude */ +
        4 /* Gravity */ +
        4 /* LifeSpan */ +
        4 /* static EmissionRate */ +
        4 /* static Length */ +
        4 /* static Width */ +
        4 /* FilterMode */ +
        4 /* Rows */ +
        4 /* Columns */ +
        4 /* FrameFlags */ +
        4 /* TailLength */ +
        4 /* Time */ +
        4 * 3 * 3 /* SegmentColor */ +
        3 /* Alpha uint * 3 */ +
        4 * 3 /* ParticleScaling */ +
        4 * 3 /* LifeSpanUVAnim */ +
        4 * 3 /* DecayUVAnim */ +
        4 * 3 /* TailUVAnim */ +
        4 * 3 /* TailDecayUVAnim */ +
        4 /* TextureID */ +
        4 /* Squirt */ +
        4 /* PriorityPlane */ +
        4 /* ReplaceableId */ +
        (emitter.Visibility && typeof emitter.Visibility !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Visibility, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.EmissionRate && typeof emitter.EmissionRate !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.EmissionRate, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.Width && typeof emitter.Width !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Width, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.Length && typeof emitter.Length !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Length, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.Speed && typeof emitter.Speed !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Speed, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.Latitude && typeof emitter.Latitude !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Latitude, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.Gravity && typeof emitter.Gravity !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Gravity, AnimVectorType.FLOAT1) :
            0
        ) +
        (emitter.Variation && typeof emitter.Variation !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Variation, AnimVectorType.FLOAT1) :
            0
        );
}

function byteLengthParticleEmitters2 (model: Model): number {
    if (!model.ParticleEmitters2.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.ParticleEmitters2.map(byteLengthParticleEmitter2));
}

function generateParticleEmitters2 (model: Model, stream: Stream): void {
    if (!model.ParticleEmitters2.length) {
        return;
    }

    stream.keyword('PRE2');
    stream.int32(byteLengthParticleEmitters2(model) - 8);

    for (let emitter of model.ParticleEmitters2) {
        stream.int32(byteLengthParticleEmitter2(emitter));
        generateNode(emitter, stream);

        stream.float32(typeof emitter.Speed === 'number' ? emitter.Speed : 0);
        stream.float32(typeof emitter.Variation === 'number' ? emitter.Variation : 0);
        stream.float32(typeof emitter.Latitude === 'number' ? emitter.Latitude : 0);
        stream.float32(typeof emitter.Gravity === 'number' ? emitter.Gravity : 0);
        stream.float32(emitter.LifeSpan);
        stream.float32(typeof emitter.EmissionRate === 'number' ? emitter.EmissionRate : 0);
        stream.float32(typeof emitter.Width === 'number' ? emitter.Width : 0);
        stream.float32(typeof emitter.Length === 'number' ? emitter.Length : 0);

        stream.int32(emitter.FilterMode);
        stream.int32(emitter.Rows);
        stream.int32(emitter.Columns);

        if (emitter.FrameFlags & ParticleEmitter2FramesFlags.Head &&
            emitter.FrameFlags & ParticleEmitter2FramesFlags.Tail) {
            stream.int32(2);
        } else if (emitter.FrameFlags & ParticleEmitter2FramesFlags.Tail) {
            stream.int32(1);
        } else if (emitter.FrameFlags & ParticleEmitter2FramesFlags.Head) {
            stream.int32(0);
        }

        stream.float32(emitter.TailLength);
        stream.float32(emitter.Time);

        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                stream.float32(emitter.SegmentColor[i][j]);
            }
        }

        for (let i = 0; i < 3; ++i) {
            stream.uint8(emitter.Alpha[i]);
        }

        for (let i = 0; i < 3; ++i) {
            stream.float32(emitter.ParticleScaling[i]);
        }

        for (let part of ['LifeSpanUVAnim', 'DecayUVAnim', 'TailUVAnim', 'TailDecayUVAnim']) {
            for (let i = 0; i < 3; ++i) {
                stream.int32(emitter[part][i]);
            }
        }

        stream.int32(emitter.TextureID !== null ? emitter.TextureID : NONE);
        stream.int32(emitter.Squirt ? 1 : 0);
        stream.int32(emitter.PriorityPlane);
        stream.int32(emitter.ReplaceableId);

        if (emitter.Speed && typeof emitter.Speed !== 'number') {
            stream.keyword('KP2S');
            stream.animVector(emitter.Speed, AnimVectorType.FLOAT1);
        }
        if (emitter.Latitude && typeof emitter.Latitude !== 'number') {
            stream.keyword('KP2L');
            stream.animVector(emitter.Latitude, AnimVectorType.FLOAT1);
        }
        if (emitter.EmissionRate && typeof emitter.EmissionRate !== 'number') {
            stream.keyword('KP2E');
            stream.animVector(emitter.EmissionRate, AnimVectorType.FLOAT1);
        }
        if (emitter.Visibility && typeof emitter.Visibility !== 'number') {
            stream.keyword('KP2V');
            stream.animVector(emitter.Visibility, AnimVectorType.FLOAT1);
        }
        if (emitter.Length && typeof emitter.Length !== 'number') {
            stream.keyword('KP2N');
            stream.animVector(emitter.Length, AnimVectorType.FLOAT1);
        }
        if (emitter.Width && typeof emitter.Width !== 'number') {
            stream.keyword('KP2W');
            stream.animVector(emitter.Width, AnimVectorType.FLOAT1);
        }
        if (emitter.Gravity && typeof emitter.Gravity !== 'number') {
            stream.keyword('KP2G');
            stream.animVector(emitter.Gravity, AnimVectorType.FLOAT1);
        }
        if (emitter.Variation && typeof emitter.Variation !== 'number') {
            stream.keyword('KP2R');
            stream.animVector(emitter.Variation, AnimVectorType.FLOAT1);
        }
    }
}


function byteLengthRibbonEmitter (emitter: RibbonEmitter): number {
    return 4 /* size */ +
        byteLengthNode(emitter) +
        4 /* static HeightAbove */ +
        4 /* static HeightBelow */ +
        4 /* Alpha */ +
        4 * 3 /* Color */ +
        4 /* LifeSpan */ +
        4 /* TextureSlot */ +
        4 /* EmissionRate */ +
        4 /* Rows */ +
        4 /* Columns */ +
        4 /* MaterialID */ +
        4 /* Gravity */ +
        (emitter.Visibility ? 4 /* keyword */ + byteLengthAnimVector(emitter.Visibility, AnimVectorType.FLOAT1) : 0) +
        (typeof emitter.HeightAbove !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.HeightAbove, AnimVectorType.FLOAT1) :
            0
        ) +
        (typeof emitter.HeightBelow !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.HeightBelow, AnimVectorType.FLOAT1) :
            0
        ) +
        (typeof emitter.Alpha !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Alpha, AnimVectorType.FLOAT1) :
            0
        ) +
        (typeof emitter.TextureSlot !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.TextureSlot, AnimVectorType.FLOAT1) :
            0
        );
}

function byteLengthRibbonEmitters (model: Model): number {
    if (!model.RibbonEmitters.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.RibbonEmitters.map(byteLengthRibbonEmitter));
}

function generateRibbonEmitters (model: Model, stream: Stream): void {
    if (!model.RibbonEmitters.length) {
        return;
    }

    stream.keyword('RIBB');
    stream.int32(byteLengthRibbonEmitters(model) - 8);

    for (let emitter of model.RibbonEmitters) {
        stream.int32(byteLengthRibbonEmitter(emitter));
        generateNode(emitter, stream);

        stream.float32(typeof emitter.HeightAbove === 'number' ? emitter.HeightAbove : 0);
        stream.float32(typeof emitter.HeightBelow === 'number' ? emitter.HeightBelow : 0);
        stream.float32(typeof emitter.Alpha === 'number' ? emitter.Alpha : 0);
        if (emitter.Color) {
            stream.float32Array(emitter.Color);
        } else {
            stream.float32(1);
            stream.float32(1);
            stream.float32(1);
        }
        stream.float32(emitter.LifeSpan);
        stream.int32(typeof emitter.TextureSlot === 'number' ? emitter.TextureSlot : 0);
        stream.int32(emitter.EmissionRate);
        stream.int32(emitter.Rows);
        stream.int32(emitter.Columns);
        stream.int32(emitter.MaterialID);
        stream.float32(emitter.Gravity);

        if (emitter.Visibility) {
            stream.keyword('KRVS');
            stream.animVector(emitter.Visibility, AnimVectorType.FLOAT1);
        }
        if (typeof emitter.HeightAbove !== 'number') {
            stream.keyword('KRHA');
            stream.animVector(emitter.HeightAbove, AnimVectorType.FLOAT1);
        }
        if (typeof emitter.HeightBelow !== 'number') {
            stream.keyword('KRHB');
            stream.animVector(emitter.HeightBelow, AnimVectorType.FLOAT1);
        }
        if (typeof emitter.Alpha !== 'number') {
            stream.keyword('KRAL');
            stream.animVector(emitter.Alpha, AnimVectorType.FLOAT1);
        }
        if (typeof emitter.TextureSlot !== 'number') {
            stream.keyword('KRTX');
            stream.animVector(emitter.TextureSlot, AnimVectorType.INT1);
        }
    }
}


const MODEL_CAMERA_NAME_LENGTH = 0x50;
function byteLengthCamera (camera: Camera): number {
    return 4 /* size */ +
        MODEL_CAMERA_NAME_LENGTH +
        4 * 3 /* Position */ +
        4 /* FieldOfView */ +
        4 /* FarClip */ +
        4 /* NearClip */ +
        4 * 3 /* TargetPosition */ +
        (camera.Translation ? 4 /* keyword */ + byteLengthAnimVector(camera.Translation, AnimVectorType.FLOAT3) : 0) +
        (camera.TargetTranslation ?
            4 /* keyword */ + byteLengthAnimVector(camera.TargetTranslation, AnimVectorType.FLOAT3) :
            0
        ) +
        (camera.Rotation ? 4 /* keyword */ + byteLengthAnimVector(camera.Rotation, AnimVectorType.FLOAT1) : 0);
}

function byteLengthCameras (model: Model): number {
    if (!model.Cameras.length) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Cameras.map(byteLengthCamera));
}

function generateCameras (model: Model, stream: Stream): void {
    if (!model.Cameras.length) {
        return;
    }

    stream.keyword('CAMS');
    stream.int32(byteLengthCameras(model) - 8);

    for (let camera of model.Cameras) {
        stream.int32(byteLengthCamera(camera));
        stream.str(camera.Name, MODEL_CAMERA_NAME_LENGTH);
        stream.float32Array(camera.Position);
        stream.float32(camera.FieldOfView);
        stream.float32(camera.FarClip);
        stream.float32(camera.NearClip);
        stream.float32Array(camera.TargetPosition);

        if (camera.Translation) {
            stream.keyword('KCTR');
            stream.animVector(camera.Translation, AnimVectorType.FLOAT3);
        }
        if (camera.Rotation) {
            stream.keyword('KCRL');
            stream.animVector(camera.Rotation, AnimVectorType.FLOAT1);
        }
        if (camera.TargetTranslation) {
            stream.keyword('KTTR');
            stream.animVector(camera.TargetTranslation, AnimVectorType.FLOAT3);
        }
    }
}


function byteLengthEventObject (eventObject: EventObject): number {
    return byteLengthNode(eventObject) +
        4 /* KEVT keyword */ +
        4 /* count */ +
        4 +
        4 * eventObject.EventTrack.length;
}

function byteLengthEventObjects (model: Model): number {
    if (model.EventObjects.length === 0) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.EventObjects.map(byteLengthEventObject));
}

function generateEventObjects (model: Model, stream: Stream): void {
    if (model.EventObjects.length === 0) {
        return;
    }

    stream.keyword('EVTS');
    stream.int32(byteLengthEventObjects(model) - 8);

    for (let eventObject of model.EventObjects) {
        generateNode(eventObject, stream);
        stream.keyword('KEVT');
        stream.int32(eventObject.EventTrack.length);
        // todo GlobalSequenceId
        stream.int32(NONE); // GlobalSequenceId ?
        stream.uint32Array(eventObject.EventTrack);
    }
}


function byteLengthCollisionShape (collisionShape: CollisionShape): number {
    return byteLengthNode(collisionShape) +
        4 /* Shape */ +
        (collisionShape.Shape === CollisionShapeType.Box ? 6 : 3) * 4 /* Vertices */ +
        (collisionShape.Shape === CollisionShapeType.Sphere ? 4 : 0); /* BoundsRadius */
}

function byteLengthCollisionShapes (model: Model): number {
    if (model.CollisionShapes.length === 0) {
        return 0;
    }

    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.CollisionShapes.map(byteLengthCollisionShape));
}

function generateCollisionShapes (model: Model, stream: Stream): void {
    if (model.CollisionShapes.length === 0) {
        return;
    }

    stream.keyword('CLID');
    stream.int32(byteLengthCollisionShapes(model) - 8);

    for (let collisionShape of model.CollisionShapes) {
        generateNode(collisionShape, stream);
        stream.int32(collisionShape.Shape);
        stream.float32Array(collisionShape.Vertices);
        if (collisionShape.Shape === CollisionShapeType.Sphere) {
            stream.float32(collisionShape.BoundsRadius);
        }
    }
}


const byteLength: [(model: Model) => number] = [
    byteLengthVersion,
    byteLengthModelInfo,
    byteLengthSequences,
    byteLengthGlobalSequences,
    byteLengthMaterials,
    byteLengthTextures,
    byteLengthTextureAnims,
    byteLengthGeosets,
    byteLengthGeosetAnims,
    byteLengthBones,
    byteLengthLights,
    byteLengthHelpers,
    byteLengthAttachments,
    byteLengthPivotPoints,
    byteLengthParticleEmitters,
    byteLengthParticleEmitters2,
    byteLengthRibbonEmitters,
    byteLengthCameras,
    byteLengthEventObjects,
    byteLengthCollisionShapes
];

const generators: [(model: Model, stream: Stream) => void] = [
    generateVersion,
    generateModelInfo,
    generateSequences,
    generateGlobalSequences,
    generateMaterials,
    generateTextures,
    generateTextureAnims,
    generateGeosets,
    generateGeosetAnims,
    generateBones,
    generateLights,
    generateHelpers,
    generateAttachments,
    generatePivotPoints,
    generateParticleEmitters,
    generateParticleEmitters2,
    generateRibbonEmitters,
    generateCameras,
    generateEventObjects,
    generateCollisionShapes
];

export function generate (model: Model): ArrayBuffer {
    let totalLength = 4 /* format keyword */;

    for (let lenFunc of byteLength) {
        totalLength += lenFunc(model);
    }

    let res = new ArrayBuffer(totalLength);
    let stream = new Stream(res);

    stream.keyword('MDLX');

    for (let generator of generators) {
        generator(model, stream);
    }

    return res;
}
