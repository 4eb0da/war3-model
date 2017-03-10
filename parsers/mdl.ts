import {
    Model, Layer, GeosetAnim, AnimVector, LineType, AnimKeyframe, Node,
    CollisionShape, ParticleEmitter2, Camera, MaterialRenderMode, FilterMode, LayerShading, TextureFlags,
    GeosetAnimFlags, NodeFlags, CollisionShapeType, ParticleEmitter2Flags, ParticleEmitter2FramesFlags, Light,
    LightType, TVertexAnim, RibbonEmitter, ParticleEmitter2FilterMode, ParticleEmitter, ParticleEmitterFlags
} from '../model';

class State {
    public readonly str: string;
    public pos: number;

    constructor (str: string) {
        this.str = str;
        this.pos = 0;
    }

    public char (): string {
        return this.str[this.pos];
    }
}

function parseComment (state: State): boolean {
    if (state.char() === '/' && state.str[state.pos + 1] === '/') {
        state.pos += 2;
        while (state.str[++state.pos] !== '\n');
        ++state.pos;
        return true;
    }
    return false;
}

const spaceRE = /\s/i;
function parseSpace (state: State): void {
    while (spaceRE.test(state.char())) {
        ++state.pos;
    }
}

const keywordFirstCharRE = /[a-z]/i;
const keywordOtherCharRE = /[a-z0-9]/i;
function parseKeyword (state: State): string {
    if (!keywordFirstCharRE.test(state.char())) {
        return null;
    }

    let keyword = state.char();
    ++state.pos;

    while (keywordOtherCharRE.test(state.char())) {
        keyword += state.str[state.pos++];
    }

    parseSpace(state);

    return keyword;
}

function parseSymbol (state: State, symbol: string): void {
    if (state.char() === symbol) {
        ++state.pos;
        parseSpace(state);
    }
}

function strictParseSymbol (state: State, symbol: string): void {
    if (state.char() !== symbol) {
        throw new Error('SyntaxError, near ' + state.pos);
    }

    ++state.pos;
    parseSpace(state);
}

function parseString (state: State): string {
    if (state.char() === '"') {
        const start = ++state.pos; // "

        while (state.char() !== '"') {
            ++state.pos;
        }

        ++state.pos; // "

        let res = state.str.substring(start, state.pos - 1);

        parseSpace(state);

        return res;
    }

    return null;
}

const numberFirstCharRE = /[-0-9]/;
const numberOtherCharRE = /[-+.0-9e]/i;
function parseNumber (state: State): number|null {
    if (numberFirstCharRE.test(state.char())) {
        const start = state.pos;

        ++state.pos;

        while (numberOtherCharRE.test(state.char())) {
            ++state.pos;
        }

        let res = parseFloat(state.str.substring(start, state.pos));

        parseSpace(state);

        return res;
    }

    return null;
}

function parseArray (state: State, arr?: number[]|Uint16Array|Uint32Array|Float32Array, pos?: number): typeof arr|null {
    if (state.char() !== '{') {
        return null;
    }

    if (!arr) {
        arr = [];
        pos = 0;
    }

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        arr[pos++] = parseNumber(state);

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    return arr;
}

function parseArrayOrSingleItem<ArrType extends Uint16Array|Uint32Array|Float32Array>
    (state: State, arr: ArrType): ArrType {
    if (state.char() !== '{') {
        arr[0] = parseNumber(state);
        return arr;
    }

    let pos = 0;

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        arr[pos++] = parseNumber(state);

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    return arr;
}

function parseObject (state: State): [string|number|null, any] {
    let prefix: string|number|null = null;
    let obj = {};

    if (state.char() !== '{') {
        prefix = parseString(state) || parseNumber(state);
    }

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword: string = parseKeyword(state);

        if (keyword === 'Interval') {
            let array = new Uint32Array(2);
            obj[keyword] = parseArray(state, array, 0);
        } else if (keyword === 'MinimumExtent' || keyword === 'MaximumExtent') {
            let array = new Float32Array(3);
            obj[keyword] = parseArray(state, array, 0);
        } else {
            obj[keyword] = parseArray(state) || parseString(state);
            if (obj[keyword] === null) {
                obj[keyword] = parseNumber(state);
            }
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    return [prefix, obj];
}

function parseVersion (state: State, model: Model): void {
    const [unused, obj] = parseObject(state);

    if (obj.FormatVersion) {
        model.Version = obj.FormatVersion;
    }
}

function parseModelInfo (state: State, model: Model): void {
    const [name, obj] = parseObject(state);

    model.Info = obj;
    model.Info.Name = name as string;
}

function parseSequences (state: State, model: Model): void {
    parseNumber(state); // count, not used

    strictParseSymbol(state, '{');

    let res = {};

    while (state.char() !== '}') {
        parseKeyword(state); // Anim

        const [name, obj] = parseObject(state);
        obj.Name = name;
        obj.NonLooping = 'NonLooping' in obj;

        res[name] = obj;
    }

    strictParseSymbol(state, '}');

    model.Sequences = res;
}

function parseTextures (state: State, model: Model): void {
    let res = [];

    parseNumber(state); // count, not used

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        parseKeyword(state); // Bitmap

        const [unused, obj] = parseObject(state);
        obj.Flags = 0;
        if ('WrapWidth' in obj) {
            obj.Flags += TextureFlags.WrapWidth;
            delete obj.WrapWidth;
        }
        if ('WrapHeight' in obj) {
            obj.Flags += TextureFlags.WrapHeight;
            delete obj.WrapHeight;
        }

        res.push(obj);
    }

    strictParseSymbol(state, '}');

    model.Textures = res;
}

function parseAnimKeyframe (state: State, frame: number, itemCount: number, lineType: LineType): AnimKeyframe {
    let res: AnimKeyframe = {
        Frame: frame,
        Vector: null
    };

    res.Vector = parseArrayOrSingleItem(state, new Float32Array(itemCount));

    strictParseSymbol(state, ',');

    if (lineType === LineType.Hermite || lineType === LineType.Bezier) {
        parseKeyword(state); // InTan
        res.InTan = parseArrayOrSingleItem(state, new Float32Array(itemCount));
        strictParseSymbol(state, ',');

        parseKeyword(state); // OutTan
        res.OutTan = parseArrayOrSingleItem(state, new Float32Array(itemCount));
        strictParseSymbol(state, ',');
    }

    return res;
}

function parseAnimVector (state: State, itemCount: number): AnimVector {
    let animVector: AnimVector = {
        LineType: LineType.DontInterp,
        GlobalSeqId: null,
        Keys: []
    };

    parseNumber(state); // count, not used

    strictParseSymbol(state, '{');

    let lineType: string = parseKeyword(state);
    if (lineType === 'DontInterp' || lineType === 'Linear' || lineType === 'Hermite' || lineType === 'Bezier') {
        animVector.LineType = LineType[lineType];
    }

    strictParseSymbol(state, ',');

    while (state.char() !== '}') {
        let keyword = parseKeyword(state);

        if (keyword === 'GlobalSeqId') {
            animVector[keyword] = parseNumber(state);
            strictParseSymbol(state, ',');
        } else {
            let frame = parseNumber(state);
            strictParseSymbol(state, ':');

            animVector.Keys.push(parseAnimKeyframe(state, frame, itemCount, animVector.LineType));
        }
    }

    strictParseSymbol(state, '}');

    return animVector;
}

function parseLayer (state: State): Layer {
    let res: Layer = {
        Shading: 0
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        let keyword = parseKeyword(state);
        let isStatic = false;

        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }

        if (!isStatic && (keyword === 'Alpha' || keyword === 'TextureID')) {
            // todo support int (TextureID)
            res[keyword] = parseAnimVector(state, 1);
        } else if (keyword === 'Unshaded' || keyword === 'SphereEnvMap' || keyword === 'TwoSided' ||
            keyword === 'Unfogged' || keyword === 'NoDepthTest' || keyword === 'NoDepthSet') {
            res.Shading |= LayerShading[keyword];
        } else if (keyword === 'FilterMode') {
            let val = parseKeyword(state);

            if (val === 'None' || val === 'Transparent' || val === 'Blend' || val === 'Additive' ||
                val === 'AddAlpha' || val === 'Modulate' || val === 'Modulate2x') {
                res.FilterMode = FilterMode[val];
            }
        } else if (keyword === 'TVertexAnimId') {
            res.TVertexAnimId = parseNumber(state);
        } else {
            let val: string|number = parseNumber(state);

            if (val === null) {
                val = parseKeyword(state);
            }

            res[keyword] = val;
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    return res;
}

function parseMaterials (state: State, model: Model): void {
    let res = [];

    parseNumber(state); // count, not used

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        let obj = {
            RenderMode: 0,
            Layers: []
        };

        parseKeyword(state); // Material

        strictParseSymbol(state, '{');

        while (state.char() !== '}') {
            const keyword = parseKeyword(state);

            if (keyword === 'Layer') {
                obj.Layers.push(parseLayer(state));
            } else if (keyword === 'PriorityPlane') {
                obj[keyword] = parseNumber(state);
            } else if (keyword === 'ConstantColor' || keyword === 'SortPrimsFarZ' || keyword === 'FullResolution') {
                obj.RenderMode |= MaterialRenderMode[keyword];
            } else {
                throw new Error('Unknown material property ' + keyword);
            }

            parseSymbol(state, ',');
        }

        strictParseSymbol(state, '}');

        res.push(obj);
    }

    strictParseSymbol(state, '}');

    model.Materials = res;
}

function parseGeoset (state: State, model: Model): void {
    let res = {
        Vertices: null,
        Normals: null,
        TVertices: null,
        VertexGroup: null,
        Faces: null,
        Groups: null,
        TotalGroupsCount: null,
        MinimumExtent: null,
        MaximumExtent: null,
        BoundsRadius: null,
        Anims: null,
        MaterialID: null,
        SelectionGroup: null,
        Unselectable: false
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'Vertices' || keyword === 'Normals' || keyword === 'TVertices') {
            let countPerObj = 3;
            let constructor = Float32Array;

            if (keyword === 'TVertices') {
                countPerObj = 2;
            }

            const count = parseNumber(state);
            res[keyword] = new Float32Array(count * countPerObj);

            strictParseSymbol(state, '{');

            for (let index = 0; index < count; ++index) {
                parseArray(state, res[keyword], index * countPerObj);
                strictParseSymbol(state, ',');
            }

            strictParseSymbol(state, '}');
        } else if (keyword === 'VertexGroup') {
            res[keyword] = new Uint8Array(res.Vertices.length / 3);

            parseArray(state, res[keyword], 0);
        } else if (keyword === 'Faces') {
            parseNumber(state); // group count, always 1?
            let indexCount = parseNumber(state);

            res.Faces = new Uint16Array(indexCount);

            strictParseSymbol(state, '{');
            parseKeyword(state); // Triangles
            strictParseSymbol(state, '{');
            parseArray(state, res.Faces, 0);

            parseSymbol(state, ',');

            strictParseSymbol(state, '}');
            strictParseSymbol(state, '}');
        } else if (keyword === 'Groups') {
            let groups = [];
            parseNumber(state); // groups count, unused
            res.TotalGroupsCount = parseNumber(state); // summed in subarrays

            strictParseSymbol(state, '{');

            while (state.char() !== '}') {
                parseKeyword(state); // Matrices

                groups.push(parseArray(state));

                parseSymbol(state, ',');
            }

            strictParseSymbol(state, '}');

            res.Groups = groups;
        } else if (keyword === 'MinimumExtent' || keyword === 'MaximumExtent') {
            let arr = new Float32Array(3);
            res[keyword] = parseArray(state, arr, 0);
            strictParseSymbol(state, ',');
        } else if (keyword === 'BoundsRadius' || keyword === 'MaterialID' || keyword === 'SelectionGroup') {
            res[keyword] = parseNumber(state);
            strictParseSymbol(state, ',');
        } else if (keyword === 'Anim') {
            let [unused, obj] = parseObject(state);

            res.Anims = res.Anims || [];
            res.Anims.push(obj);
        } else if (keyword === 'Unselectable') {
            res.Unselectable = true;
            strictParseSymbol(state, ',');
        }
    }

    strictParseSymbol(state, '}');

    model.Geosets.push(res);
}

function parseGeosetAnim (state: State, model: Model) {
    let res: GeosetAnim = {
        GeosetId: -1,
        Alpha: null,
        Color: null,
        Flags: 0
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        let isStatic = false;
        let keyword = parseKeyword(state);

        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }

        if (keyword === 'Alpha') {
            if (isStatic) {
                res.Alpha = parseNumber(state);
            } else {
                res.Alpha = parseAnimVector(state, 1);
            }
        } else if (keyword === 'Color') {
            if (isStatic) {
                let array = new Float32Array(3);
                res.Color = parseArray(state, array, 0) as Float32Array;
                res.Color.reverse();
            } else {
                res.Color = parseAnimVector(state, 3);
                for (let key of res.Color.Keys) {
                    key.Vector.reverse();
                    if (key.InTan) {
                        key.InTan.reverse();
                        key.OutTan.reverse();
                    }
                }
            }
        } else if (keyword === 'DropShadow') {
            res.Flags |= GeosetAnimFlags[keyword];
        } else {
            res[keyword] = parseNumber(state);
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.GeosetAnims.push(res);
}

function parseNode (state: State, type: string, model: Model): Node {
    const name = parseString(state);

    let node: Node = {
        Type: type,
        Name: name,
        ObjectId: null,
        PivotPoint: null,
        Flags: 0
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling' || keyword === 'Visibility') {
            let itemCount = 3;
            if (keyword === 'Rotation') {
                itemCount = 4;
            } else if (keyword === 'Visibility') {
                itemCount = 1;
            }
            node[keyword] = parseAnimVector(state, itemCount);
        } else if (keyword === 'BillboardedLockZ' || keyword === 'BillboardedLockY' || keyword === 'BillboardedLockX' ||
            keyword === 'Billboarded' || keyword === 'CameraAnchored') {
            node.Flags |= NodeFlags[keyword];
        } else if (keyword === 'DontInherit') {
            strictParseSymbol(state, '{');

            let val = parseKeyword(state);

            if (val === 'Translation') {
                node.Flags |= NodeFlags.DontInheritTranslation;
            } else if (val === 'Rotation') {
                node.Flags |= NodeFlags.DontInheritRotation;
            } else if (val === 'Scaling') {
                node.Flags |= NodeFlags.DontInheritScaling;
            }

            strictParseSymbol(state, '}');
        } else {
            let val = parseKeyword(state) || parseNumber(state);

            if (keyword === 'GeosetId' && val === 'Multiple' ||
                keyword === 'GeosetAnimId' && val === 'None') {
                val = null;
            }

            node[keyword] = val;
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.Nodes[node.ObjectId] = node;

    return node;
}

function parseBone (state: State, model: Model) {
    const node = parseNode(state, 'Bone', model);

    model.Bones[node.Name] = node;
}

function parseHelper (state: State, model: Model) {
    const node = parseNode(state, 'Helper', model);

    model.Helpers[node.Name] = node;
}

function parseAttachment (state: State, model: Model) {
    const node = parseNode(state, 'Attachment', model);

    model.Attachments[node.Name] = node;
}

function parsePivotPoints (state: State, model: Model) {
    const count = parseNumber(state);

    let res = [];

    strictParseSymbol(state, '{');

    for (let i = 0; i < count; ++i) {
        res.push(parseArray(state, new Float32Array(3), 0));
        strictParseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.PivotPoints = res;
}

function parseEventObject (state: State, model: Model) {
    const name = parseString(state);

    let res = {
        Type: 'EventObject',
        Name: name,
        ObjectId: null,
        PivotPoint: null,
        EventTrack: null,
        Flags: 0
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'EventTrack') {
            let count = parseNumber(state); // EventTrack count

            res.EventTrack = parseArray(state, new Uint32Array(count), 0);
        } else {
            res[keyword] = parseNumber(state);
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.EventObjects[res.Name] = res;
    model.Nodes.push(res);
}

function parseCollisionShape (state: State, model: Model) {
    const name = parseString(state);

    let res: CollisionShape = {
        Type: 'CollisionShape',
        Name: name,
        ObjectId: null,
        PivotPoint: null,
        Shape: CollisionShapeType.Box,
        Vertices: null,
        Flags: 0
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'Sphere') {
            res.Shape = CollisionShapeType.Sphere;
        } else if (keyword === 'Box') {
            res.Shape = CollisionShapeType.Box;
        } else if (keyword === 'Vertices') {
            let count = parseNumber(state);
            let vertices = new Float32Array(count * 3);

            strictParseSymbol(state, '{');

            for (let i = 0; i < count; ++i) {
                parseArray(state, vertices, i * 3);
                strictParseSymbol(state, ',');
            }

            strictParseSymbol(state, '}');

            res.Vertices = vertices;
        } else {
            res[keyword] = parseNumber(state);
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.CollisionShapes[res.Name] = res;
    model.Nodes.push(res);
}

function parseGlobalSequences (state: State, model: Model) {
    let res = [];

    let count = parseNumber(state);

    strictParseSymbol(state, '{');

    for (let i = 0; i < count; ++i) {
        const keyword = parseKeyword(state);

        if (keyword === 'Duration') {
            res.push(parseNumber(state));
        }
        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.GlobalSequences = res;
}

function parseUnknownBlock (state: State) {
    let opened;
    while (state.char() !== undefined && state.char() !== '{') {
        ++state.pos;
    }
    opened = 1;
    ++state.pos;

    while (state.char() !== undefined && opened > 0) {
        if (state.char() === '{') {
            ++opened;
        } else if (state.char() === '}') {
            --opened;
        }
        ++state.pos;
    }
    parseSpace(state);
}

function parseParticleEmitter (state: State, model: Model) {
    let res: ParticleEmitter = {
        Name: null,
        Flags: 0
    } as ParticleEmitter;

    res.Name = parseString(state);

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        let keyword = parseKeyword(state);
        let isStatic = false;

        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }

        if (keyword === 'EmissionRate' || keyword === 'Gravity' || keyword === 'Longitude' || keyword === 'Latitude' ||
            keyword === 'ObjectId' || keyword === 'Parent') {
            res[keyword] = parseNumber(state);
        } else if (keyword === 'EmitterUsesMDL' || keyword === 'EmitterUsesTGA') {
            res.Flags |= ParticleEmitterFlags[keyword];
        } else if (keyword === 'Visibility' || keyword === 'Translation' || keyword === 'Rotation' ||
            keyword === 'Scaling') {
            let itemCount = 3;
            if (keyword === 'Visibility') {
                itemCount = 1;
            } else if (keyword === 'Rotation') {
                itemCount = 4;
            }
            res[keyword] = parseAnimVector(state, itemCount);
        } else if (keyword === 'Particle') {
            strictParseSymbol(state, '{');

            while (state.char() !== '}') {
                let keyword2 = parseKeyword(state);
                let isStatic2 = false;

                if (keyword2 === 'static') {
                    isStatic2 = true;
                    keyword2 = parseKeyword(state);
                }

                if (keyword2 === 'LifeSpan' || keyword2 === 'InitVelocity') {
                    res[keyword2] = parseNumber(state);
                } else if (keyword2 === 'Path') {
                    res.Path = parseString(state);
                }

                parseSymbol(state, ',');
            }

            strictParseSymbol(state, '}');
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.ParticleEmitters[res.Name] = res;
}

function parseParticleEmitter2 (state: State, model: Model) {
    let name = parseString(state);

    let res: ParticleEmitter2 = {
        Type: 'ParticleEmitter2',
        Name: name,
        ObjectId: null,
        PivotPoint: null,
        Flags: 0,
        FrameFlags: 0
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        let keyword = parseKeyword(state);
        let isStatic = false;

        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }

        if (!isStatic && (keyword === 'Speed' || keyword === 'Variation' || keyword === 'Latitude' ||
            keyword === 'Gravity' || keyword === 'Visibility' || keyword === 'EmissionRate' || keyword === 'Width' ||
            keyword === 'Length' || keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling')) {
            let itemCount = 3;
            switch (keyword) {
                case 'Rotation':
                    itemCount = 4;
                    break;
                case 'Speed':
                case 'Variation':
                case 'Latitude':
                case 'Gravity':
                case 'Visibility':
                case 'EmissionRate':
                case 'Width':
                case 'Length':
                    itemCount = 1;
                    break;
            }
            res[keyword] = parseAnimVector(state, itemCount);
        } else if (keyword === 'SortPrimsFarZ' || keyword === 'Unshaded' || keyword === 'LineEmitter' ||
            keyword === 'Unfogged' || keyword === 'ModelSpace' || keyword === 'XYQuad') {
            res.Flags |= ParticleEmitter2Flags[keyword];
        } else if (keyword === 'Both') {
            res.FrameFlags |= ParticleEmitter2FramesFlags.Head | ParticleEmitter2FramesFlags.Tail;
        } else if (keyword === 'Head' || keyword === 'Tail') {
            res.FrameFlags |= ParticleEmitter2FramesFlags[keyword];
        } else if (keyword === 'Squirt') {
            res[keyword] = true;
        } else if (keyword === 'SegmentColor') {
            let colors = [];

            strictParseSymbol(state, '{');
            while (state.char() !== '}') {
                parseKeyword(state); // Color

                let colorArr = new Float32Array(3);
                parseArray(state, colorArr, 0);

                // bgr order, inverse from mdx
                let temp = colorArr[0];
                colorArr[0] = colorArr[2];
                colorArr[2] = temp;
                colors.push(colorArr);

                parseSymbol(state, ',');
            }
            strictParseSymbol(state, '}');

            res.SegmentColor = colors;
        } else if (keyword === 'Alpha') {
            res.Alpha = new Uint8Array(3);
            parseArray(state, res.Alpha, 0);
        } else if (keyword === 'ParticleScaling') {
            res[keyword] = new Float32Array(3);
            parseArray(state, res[keyword], 0);
        } else if (keyword === 'LifeSpanUVAnim' || keyword === 'DecayUVAnim' || keyword === 'TailUVAnim' ||
                keyword === 'TailDecayUVAnim') {
            res[keyword] = new Uint32Array(3);
            parseArray(state, res[keyword], 0);
        } else if (keyword === 'Transparent' || keyword === 'Blend' || keyword === 'Additive' ||
                keyword === 'AlphaKey' || keyword === 'Modulate' || keyword === 'Modulate2x') {
            res.FilterMode = ParticleEmitter2FilterMode[keyword];
        } else {
            res[keyword] = parseNumber(state);
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.ParticleEmitters2[res.Name] = res;
    model.Nodes.push(res);
}

function parseCamera (state: State, model: Model) {
    let res: Camera = {
        Name: null,
        Position: null,
        FieldOfView: 0,
        NearClip: 0,
        FarClip: 0,
        TargetPosition: null
    };

    res.Name = parseString(state);

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'Position') {
            res.Position = new Float32Array(3);
            parseArray(state, res.Position, 0);
        } else if (keyword === 'FieldOfView' || keyword === 'NearClip' || keyword === 'FarClip') {
            res[keyword] = parseNumber(state);
        } else if (keyword === 'Target') {
            strictParseSymbol(state, '{');

            while (state.char() !== '}') {
                const keyword2 = parseKeyword(state);

                if (keyword2 === 'Position') {
                    res.TargetPosition = new Float32Array(3);
                    parseArray(state, res.TargetPosition, 0);
                } else if (keyword2 === 'Translation') {
                    res.TargetTranslation = parseAnimVector(state, 3);
                }

                parseSymbol(state, ',');
            }

            strictParseSymbol(state, '}');
        } else if (keyword === 'Translation' || keyword === 'Rotation') {
            res[keyword] = parseAnimVector(state, keyword === 'Rotation' ? 1 : 3);
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.Cameras[res.Name] = res;
}

function parseLight (state: State, model: Model) {
    let name = parseString(state);

    let res: Light = {
        Type: 'Light',
        Name: name,
        ObjectId: null,
        PivotPoint: null,
        Flags: 0,
        LightType: 0
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        let keyword = parseKeyword(state);
        let isStatic = false;

        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }

        if (!isStatic && (keyword === 'Visibility' || keyword === 'Color' || keyword === 'Intensity' ||
            keyword === 'AmbIntensity' || keyword === 'AmbColor' || keyword === 'Translation' ||
            keyword === 'Rotation' || keyword === 'Scaling')) {
            let itemCount = 3;
            switch (keyword) {
                case 'Rotation':
                    itemCount = 4;
                    break;
                case 'Visibility':
                case 'Intensity':
                case 'AmbIntensity':
                    itemCount = 1;
                    break;
            }
            res[keyword] = parseAnimVector(state, itemCount);
        } else if (keyword === 'Omnidirectional' || keyword === 'Directional' || keyword === 'Ambient') {
            res.LightType = LightType[keyword];
        } else if (keyword === 'Color' || keyword === 'AmbColor') {
            let color = new Float32Array(3);
            parseArray(state, color, 0);

            // bgr order, inverse from mdx
            let temp = color[0];
            color[0] = color[2];
            color[2] = temp;

            res[keyword] = color;
        } else {
            res[keyword] = parseNumber(state);
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.Lights[res.Name] = res;
    model.Nodes.push(res);
}

function parseTextureAnims (state: State, model: Model): void {
    let res = [];

    parseNumber(state); // count, not used

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        let obj: TVertexAnim = {};

        parseKeyword(state); // TVertexAnim

        strictParseSymbol(state, '{');

        while (state.char() !== '}') {
            const keyword = parseKeyword(state);

            if (keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling') {
                let itemCount = keyword === 'Rotation' ? 4 : 3;
                obj[keyword] = parseAnimVector(state, itemCount);
            } else {
                throw new Error('Unknown texture anim property ' + keyword);
            }

            parseSymbol(state, ',');
        }

        strictParseSymbol(state, '}');

        res.push(obj);
    }

    strictParseSymbol(state, '}');

    model.TextureAnims = res;
}

function parseRibbonEmitter (state: State, model: Model) {
    let name = parseString(state);

    let res: RibbonEmitter = {
        Type: 'RibbonEmitter',
        Name: name,
        ObjectId: null,
        PivotPoint: null,
        Flags: 0
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        let keyword = parseKeyword(state);
        let isStatic = false;

        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }

        if (!isStatic && (keyword === 'Visibility' || keyword === 'HeightAbove' || keyword === 'HeightBelow' ||
            keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling')) {
            let itemCount = 3;
            switch (keyword) {
                case 'Rotation':
                    itemCount = 4;
                    break;
                case 'Visibility':
                case 'HeightAbove':
                case 'HeightBelow':
                    itemCount = 1;
                    break;
            }
            res[keyword] = parseAnimVector(state, itemCount);
        } else if (keyword === 'Color') {
            let color = new Float32Array(3);
            parseArray(state, color, 0);

            // bgr order, inverse from mdx
            let temp = color[0];
            color[0] = color[2];
            color[2] = temp;

            res[keyword] = color;
        } else {
            res[keyword] = parseNumber(state);
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.RibbonEmitters[res.Name] = res;
    model.Nodes.push(res);
}

const parsers = {
    Version: parseVersion,
    Model: parseModelInfo,
    Sequences: parseSequences,
    Textures: parseTextures,
    Materials: parseMaterials,
    Geoset: parseGeoset,
    GeosetAnim: parseGeosetAnim,
    Bone: parseBone,
    Helper: parseHelper,
    Attachment: parseAttachment,
    PivotPoints: parsePivotPoints,
    EventObject: parseEventObject,
    CollisionShape: parseCollisionShape,
    GlobalSequences: parseGlobalSequences,
    ParticleEmitter: parseParticleEmitter,
    ParticleEmitter2: parseParticleEmitter2,
    Camera: parseCamera,
    Light: parseLight,
    TextureAnims: parseTextureAnims,
    RibbonEmitter: parseRibbonEmitter
};

export function parse (str: string): Model {
    const state = new State(str);
    let model = {
        Info: {
            Name: '',
            MinimumExtent: null,
            MaximumExtent: null,
            BoundsRadius: 0,
            BlendTime: 150
        },
        Sequences: {},
        Textures: [],
        Materials: [],
        Geosets: [],
        GeosetAnims: [],
        Bones: {},
        Helpers: {},
        Attachments: {},
        Nodes: [],
        PivotPoints: [],
        EventObjects: {},
        CollisionShapes: {},
        ParticleEmitters: {},
        ParticleEmitters2: {},
        Cameras: {},
        Lights: {},
        RibbonEmitters: {},
        // default
        Version: 800
    };

    while (state.pos < state.str.length) {
        while (parseComment(state));
        const keyword = parseKeyword(state);

        if (keyword) {
            if (keyword in parsers) {
                parsers[keyword](state, model);
            } else {
                parseUnknownBlock(state);
            }
        } else {
            break;
        }
    }

    for (let i = 0; i < model.Nodes.length; ++i) {
        if (model.PivotPoints[i]) {
            model.Nodes[i].PivotPoint = model.PivotPoints[i];
        }
    }

    return model;
}
