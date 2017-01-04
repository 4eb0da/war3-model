import {
    Model, NumberArray, Layer, GeosetAnim, AnimVector, LineType, AnimKeyframe, Node,
    CollisionShape, ParticleEmitter2
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
const numberOtherCharRE = /[.0-9e]/i;
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

function parseArray (state: State, arr?: NumberArray, pos?: number): NumberArray|null {
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

function parseObject (state: State): [string|number|null, any] {
    let prefix: string|number|null = null;
    let obj = {};

    if (state.char() !== '{') {
        prefix = parseString(state) || parseNumber(state);
    }

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword: string = parseKeyword(state);
        parseSpace(state);
        obj[keyword] = parseArray(state) || parseString(state);
        if (obj[keyword] === null) {
            obj[keyword] = parseNumber(state);
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

function parseModel (state: State, model: Model): void {
    const [name, obj] = parseObject(state);

    model.Info = obj;
    model.Info.name = name;
}

function parseSequences (state: State, model: Model): void {
    parseNumber(state); // count, not used

    strictParseSymbol(state, '{');

    let res = {};

    while (state.char() !== '}') {
        parseKeyword(state); // Anim

        const [name, obj] = parseObject(state);
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
        obj.WrapWidth = 'WrapWidth' in obj;
        obj.WrapHeight = 'WrapHeight' in obj;

        res.push(obj);
    }

    strictParseSymbol(state, '}');

    model.Textures = res;
}

function parseAnimKeyframe (state: State, lineType: LineType): AnimKeyframe {
    let res: AnimKeyframe = {
        Vector: null
    };

    res.Vector = parseArray(state) || [parseNumber(state)];
    strictParseSymbol(state, ',');

    if (lineType === 'Bezier' || lineType === 'Hermite') {
        parseKeyword(state); // InTan
        res.InTan = parseArray(state) || [parseNumber(state)];
        strictParseSymbol(state, ',');

        parseKeyword(state); // OutTan
        res.OutTan = parseArray(state) || [parseNumber(state)];
        strictParseSymbol(state, ',');
    }

    return res;
}

function parseAnimVector (state: State): AnimVector {
    let animVector: AnimVector = {
        LineType: 'Linear',
        Keys: {}
    };

    parseNumber(state); // count, not used

    strictParseSymbol(state, '{');

    let lineType: string = parseKeyword(state);
    // string enum :(
    if (lineType === 'DontInterp') {
        animVector.LineType = 'DontInterp';
    } else if (lineType === 'Linear') {
        animVector.LineType = 'Linear';
    } else if (lineType === 'Bezier') {
        animVector.LineType = 'Bezier';
    } else if (lineType === 'Hermite') {
        animVector.LineType = 'Hermite';
    }

    strictParseSymbol(state, ',');

    while (state.char() !== '}') {
        let keyword = parseKeyword(state);

        if (keyword === 'GlobalSeqId') {
            animVector[keyword] = parseNumber(state);
            strictParseSymbol(state, ',');
        } else {
            let keyframe = parseNumber(state);
            strictParseSymbol(state, ':');

            animVector.Keys[keyframe] = parseAnimKeyframe(state, animVector.LineType);
        }
    }

    strictParseSymbol(state, '}');

    return animVector;
}

function parseLayer (state: State): Layer {
    let res: Layer = {};

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        let keyword = parseKeyword(state);
        let isStatic = false;

        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }

        if (keyword === 'Alpha' && !isStatic) {
            res.Alpha = parseAnimVector(state);
        } else if (keyword === 'Unshaded' || keyword === 'SphereEnvMap' || keyword === 'TwoSided' ||
            keyword === 'Unfogged' || keyword === 'NoDepthTest') {
            res[keyword] = true;
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
            layers: []
        };

        parseKeyword(state); // Material

        strictParseSymbol(state, '{');

        while (state.char() !== '}') {
            const keyword = parseKeyword(state);

            if (keyword === 'Layer') {
                obj.layers.push(parseLayer(state));
            } else if (keyword === 'PriorityPlane') {
                let val = parseNumber(state);
                obj[keyword] = val;
            } else {
                obj[keyword] = true;
            }
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

            switch (keyword) {
                case 'TVertices':
                    countPerObj = 2;
                    break;
                case 'VertexGroup':
                    countPerObj = 1;
                    constructor = Int16Array;
                    break;
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
            res[keyword] = new Int16Array(res.Vertices.length / 3);

            parseArray(state, res[keyword], 0);
        } else if (keyword === 'Faces') {
            parseNumber(state); // group count, always 1?
            let indexCount = parseNumber(state);

            res.Faces = new Int16Array(indexCount);

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
            res[keyword] = parseArray(state);
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
        Alpha: null
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'Alpha') {
            res.Alpha = parseAnimVector(state);
        } else if (keyword === 'DropShadow') {
            res.DropShadow = true;
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
        PivotPoint: null
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling' || keyword === 'Visibility') {
            node[keyword] = parseAnimVector(state);
        } else if (keyword === 'BillboardedLockZ' || keyword === 'BillboardedLockY' || keyword === 'BillboardedLockX' ||
            keyword === 'Billboarded' || keyword === 'CameraAnchored') {
            node[keyword] = true;
        } else if (keyword === 'DontInherit') {
            strictParseSymbol(state, '{');

            let val = parseKeyword(state);

            if (val === 'Translation') {
                node.DontInheritTranslation = true;
            } else if (val === 'Rotation') {
                node.DontInheritRotation = true;
            } else if (val === 'Scaling') {
                node.DontInheritScaling = true;
            }

            strictParseSymbol(state, '}');
        } else {
            let val = parseKeyword(state) || parseNumber(state);

            if (keyword === 'GeosetId' && val === 'Multiple' ||
                keyword === 'GeosetAnimId' && val === 'None') {
                val = -1;
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
        res.push(parseArray(state));
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
        EventTrack: null
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'EventTrack') {
            parseNumber(state); // EventTrack count, not used

            res.EventTrack = parseArray(state);
        } else {
            res[keyword] = parseNumber(state);
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.EventObjects.push(res);
    model.Nodes.push(res);
}

function parseCollisionShape (state: State, model: Model) {
    const name = parseString(state);

    let res: CollisionShape = {
        Type: 'CollisionShape',
        Name: name,
        ObjectId: null,
        PivotPoint: null,
        Shape: 'Box',
        Vertices: null
    };

    strictParseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'Sphere') {
            res.Shape = 'Sphere';
        } else if (keyword === 'Box') {
            res.Shape = 'Box';
        } else if (keyword === 'Vertices') {
            let vertices = [];
            let count = parseNumber(state);

            strictParseSymbol(state, '{');

            for (let i = 0; i < count; ++i) {
                vertices.push(parseArray(state));
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

    model.CollisionShapes.push(res);
    model.Nodes.push(res);
}

function parseGlobalSequences (state: State, model: Model) {
    let res = {
        Durations: []
    };

    let count = parseNumber(state);

    strictParseSymbol(state, '{');

    for (let i = 0; i < count; ++i) {
        const keyword = parseKeyword(state);

        if (keyword === 'Duration') {
            res.Durations.push(parseNumber(state));
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

function parseParticleEmitter2 (state: State, model: Model) {
    let name = parseString(state);

    let res: ParticleEmitter2 = {
        Type: 'ParticleEmitter2',
        Name: name,
        ObjectId: null,
        PivotPoint: null
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
            res[keyword] = parseAnimVector(state);
        } else if (keyword === 'SortPrimsFarZ' || keyword === 'Unshaded' || keyword === 'LineEmitter' ||
            keyword === 'Unfogged' || keyword === 'ModelSpace' || keyword === 'XYQuad' || keyword === 'Squirt' ||
            keyword === 'Head' || keyword === 'Tail') {
            res[keyword] = true;
        } else if (keyword === 'SegmentColor') {
            let colors = [];

            strictParseSymbol(state, '{');
            while (state.char() !== '}') {
                parseKeyword(state); // Color
                colors.push(parseArray(state));
                parseSymbol(state, ',');
            }
            strictParseSymbol(state, '}');

            res.SegmentColor = colors;
        } else if (keyword === 'Alpha' || keyword === 'ParticleScaling' || keyword === 'LifeSpanUVAnim' ||
                keyword === 'DecayUVAnim' || keyword === 'TailUVAnim' || keyword === 'TailDecayUVAnim') {
            res[keyword] = parseArray(state);
        } else if (keyword === 'Transparent') {
            res.FilterMode = 'Transparent';
        } else if (keyword === 'Blend') {
            res.FilterMode = 'Blend';
        } else if (keyword === 'Additive') {
            res.FilterMode = 'Additive';
        } else if (keyword === 'AddAlpha') {
            res.FilterMode = 'AddAlpha';
        } else if (keyword === 'AddAlpha') {
            res.FilterMode = 'AddAlpha';
        } else if (keyword === 'Modulate') {
            res.FilterMode = 'Modulate';
        } else if (keyword === 'Modulate2x') {
            res.FilterMode = 'Modulate2x';
        } else {
            let val = parseNumber(state);

            res[keyword] = val;
        }

        parseSymbol(state, ',');
    }

    strictParseSymbol(state, '}');

    model.ParticleEmitters2.push(res);
    model.Nodes.push(res);
}

const parsers = {
    Version: parseVersion,
    Model: parseModel,
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
    ParticleEmitter2: parseParticleEmitter2,
};

export function parse (str: string): Model {
    const state = new State(str);
    let model = {
        Info: {},
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
        EventObjects: [],
        CollisionShapes: [],
        ParticleEmitters2: [],
        // default
        Version: 800
    };

    while (state.pos < state.str.length) {
        parseComment(state);
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
