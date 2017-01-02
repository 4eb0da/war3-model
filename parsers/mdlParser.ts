import {
    Model, NumberArray, Layer, GeosetAnim, AnimVector, LineType, AnimKeyframe, Node,
    CollisionShape
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

const keywordCharRE = /[a-z]/i;
function parseKeyword (state: State): string {
    let keyword = '';

    while (keywordCharRE.test(state.char())) {
        keyword += state.str[state.pos++];
    }

    parseSpace(state);

    return keyword;
}

function parseSymbol (state: State, symbol: string): void {
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

        return state.str.substring(start, state.pos - 1);
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

        return parseFloat(state.str.substring(start, state.pos));
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

    parseSymbol(state, '{');

    while (state.char() !== '}') {
        arr[pos++] = parseNumber(state);

        parseSpace(state);
        if (state.char() === ',') {
            parseSymbol(state, ',');
        }
    }

    parseSymbol(state, '}');

    return arr;
}

function parseObject (state: State): [string|number|null, any] {
    let prefix: string|number|null = null;
    let obj = {};

    if (state.char() !== '{') {
        prefix = parseString(state) || parseNumber(state);
        parseSpace(state);
    }

    parseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword: string = parseKeyword(state);
        parseSpace(state);
        obj[keyword] = parseArray(state) || parseString(state);
        if (obj[keyword] === null) {
            obj[keyword] = parseNumber(state);
        }
        parseSpace(state);
        ++state.pos; // ,
        parseSpace(state);
    }

    parseSymbol(state, '}');

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
    parseSpace(state);

    parseSymbol(state, '{');

    let res = {};

    while (state.char() !== '}') {
        parseKeyword(state); // Anim

        const [name, obj] = parseObject(state);
        obj.NonLooping = 'NonLooping' in obj;

        res[name] = obj;
    }

    parseSymbol(state, '}');

    model.Sequences = res;
}

function parseTextures (state: State, model: Model): void {
    let res = [];

    parseNumber(state); // count, not used
    parseSpace(state);

    parseSymbol(state, '{');

    while (state.char() !== '}') {
        parseKeyword(state); // Bitmap

        const [unused, obj] = parseObject(state);
        obj.WrapWidth = 'WrapWidth' in obj;
        obj.WrapHeight = 'WrapHeight' in obj;

        res.push(obj);
    }

    parseSymbol(state, '}');

    model.Textures = res;
}

function parseAnimKeyframe (state: State, lineType: LineType): AnimKeyframe {
    let res: AnimKeyframe = {
        Vector: null
    };

    res.Vector = parseArray(state) || [parseNumber(state)];
    parseSpace(state);
    parseSymbol(state, ',');

    if (lineType === 'Bezier' || lineType === 'Hermite') {
        parseKeyword(state); // InTan
        res.InTan = parseArray(state) || [parseNumber(state)];
        parseSpace(state);
        parseSymbol(state, ',');

        parseKeyword(state); // OutTan
        res.OutTan = parseArray(state) || [parseNumber(state)];
        parseSpace(state);
        parseSymbol(state, ',');
    }

    return res;
}

function parseAnimVector (state: State): AnimVector {
    let animVector: AnimVector = {
        LineType: 'Linear',
        Keys: {}
    };

    parseNumber(state); // count, not used
    parseSpace(state);

    parseSymbol(state, '{');

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

    parseSymbol(state, ',');

    while (state.char() !== '}') {
        let keyframe = parseNumber(state);
        parseSpace(state);
        parseSymbol(state, ':');

        animVector.Keys[keyframe] = parseAnimKeyframe(state, animVector.LineType);
    }

    parseSymbol(state, '}');

    return animVector;
}

function parseLayer (state: State): Layer {
    let res: Layer = {};

    parseSymbol(state, '{');

    while (state.char() !== '}') {
        let keyword = parseKeyword(state);

        if (keyword === 'static') {
            keyword = parseKeyword(state);
        }

        if (keyword === 'Alpha') {
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

        if (state.char() === ',') {
            parseSymbol(state, ',');
        }
    }

    parseSymbol(state, '}');

    return res;
}

function parseMaterials (state: State, model: Model): void {
    let res = [];

    parseNumber(state); // count, not used
    parseSpace(state);

    parseSymbol(state, '{');

    while (state.char() !== '}') {
        let obj = {
            layers: []
        };

        parseKeyword(state); // Material

        parseSymbol(state, '{');

        while (state.char() !== '}') {
            const keyword = parseKeyword(state);

            if (keyword === 'Layer') {
                obj.layers.push(parseLayer(state));
            } else if (keyword === 'PriorityPlane') {
                let val = parseNumber(state);
                parseSpace(state);
                obj[keyword] = val;
            } else {
                obj[keyword] = true;
            }
        }

        parseSymbol(state, '}');

        res.push(obj);
    }

    parseSymbol(state, '}');

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

    parseSymbol(state, '{');

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
            parseSpace(state);
            res[keyword] = new Float32Array(count * countPerObj);

            parseSymbol(state, '{');

            for (let index = 0; index < count; ++index) {
                parseArray(state, res[keyword], index * countPerObj);
                parseSymbol(state, ',');
            }

            parseSymbol(state, '}');
        } else if (keyword === 'VertexGroup') {
            res[keyword] = new Int16Array(res.Vertices.length / 3);

            parseArray(state, res[keyword], 0);
        } else if (keyword === 'Faces') {
            parseNumber(state); // group count, always 1?
            parseSpace(state);
            let indexCount = parseNumber(state);
            parseSpace(state);

            res.Faces = new Int16Array(indexCount);

            parseSymbol(state, '{');
            parseKeyword(state); // Triangles
            parseSymbol(state, '{');
            parseArray(state, res.Faces, 0);

            if (state.char() === ',') {
                parseSymbol(state, ',');
            }

            parseSymbol(state, '}');
            parseSymbol(state, '}');
        } else if (keyword === 'Groups') {
            let groups = [];
            parseNumber(state); // groups count, unused
            parseSpace(state);
            res.TotalGroupsCount = parseNumber(state); // summed in subarrays
            parseSpace(state);

            parseSymbol(state, '{');

            while (state.char() !== '}') {
                parseKeyword(state); // Matrices

                groups.push(parseArray(state));

                if (state.char() === ',') {
                    parseSymbol(state, ',');
                }
            }

            parseSymbol(state, '}');

            res.Groups = groups;
        } else if (keyword === 'MinimumExtent' || keyword === 'MaximumExtent') {
            res[keyword] = parseArray(state);
            parseSymbol(state, ',');
        } else if (keyword === 'BoundsRadius' || keyword === 'MaterialID' || keyword === 'SelectionGroup') {
            res[keyword] = parseNumber(state);
            parseSymbol(state, ',');
        } else if (keyword === 'Anim') {
            let [unused, obj] = parseObject(state);

            res.Anims = res.Anims || [];
            res.Anims.push(obj);
        } else if (keyword === 'Unselectable') {
            res.Unselectable = true;
        }
    }

    parseSymbol(state, '}');

    model.Geosets.push(res);
}

function parseGeosetAnim (state: State, model: Model) {
    let res: GeosetAnim = {
        GeosetId: -1,
        Alpha: null
    };

    parseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'Alpha') {
            res.Alpha = parseAnimVector(state);
        } else if (keyword === 'DropShadow') {
            res.DropShadow = true;
        } else {
            res[keyword] = parseNumber(state);
        }

        if (state.char() === ',') {
            parseSymbol(state, ',');
        }
    }

    parseSymbol(state, '}');

    model.GeosetAnims.push(res);
}

function parseNode (state: State, type: string, model: Model): Node {
    const name = parseString(state);
    parseSpace(state);

    let node = {
        Type: type,
        Name: name,
        ObjectId: null,
        PivotPoint: null
    };

    parseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling' || keyword === 'Visibility') {
            node[keyword] = parseAnimVector(state);
        } else if (keyword === 'BillboardedLockZ' || keyword === 'BillboardedLockY' || keyword === 'BillboardedLockX' ||
            keyword === 'Billboarded' || keyword === 'CameraAnchored') {
            node[keyword] = true;
        } else {
            let val = parseKeyword(state) || parseNumber(state);
            parseSpace(state);

            if (keyword === 'GeosetId' && val === 'Multiple' ||
                keyword === 'GeosetAnimId' && val === 'None') {
                val = -1;
            }

            node[keyword] = val;
        }

        if (state.char() === ',') {
            parseSymbol(state, ',');
        }
    }

    parseSymbol(state, '}');

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
    parseSpace(state);

    let res = [];

    parseSymbol(state, '{');

    for (let i = 0; i < count; ++i) {
        res.push(parseArray(state));
        parseSymbol(state, ',');
    }

    parseSymbol(state, '}');

    model.PivotPoints = res;
}

function parseEventObject (state: State, model: Model) {
    const name = parseString(state);
    parseSpace(state);

    let res = {
        Type: 'EventObject',
        Name: name,
        ObjectId: null,
        PivotPoint: null,
        EventTrack: null
    };

    parseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'EventTrack') {
            parseNumber(state); // EventTrack count, not used
            parseSpace(state);

            res.EventTrack = parseArray(state);
        } else {
            res[keyword] = parseNumber(state);
        }

        parseSpace(state);

        if (state.char() === ',') {
            parseSymbol(state, ',');
        }
    }

    parseSymbol(state, '}');

    model.EventObjects.push(res);
    model.Nodes.push(res);
}

function parseCollisionShape (state: State, model: Model) {
    const name = parseString(state);
    parseSpace(state);

    let res: CollisionShape = {
        Type: 'CollisionShape',
        Name: name,
        ObjectId: null,
        PivotPoint: null,
        Shape: 'Box',
        Vertices: null
    };

    parseSymbol(state, '{');

    while (state.char() !== '}') {
        const keyword = parseKeyword(state);

        if (keyword === 'Sphere') {
            res.Shape = 'Sphere';
        } else if (keyword === 'Box') {
            res.Shape = 'Box';
        } else if (keyword === 'Vertices') {
            let vertices = [];
            let count = parseNumber(state);
            parseSpace(state);

            parseSymbol(state, '{');

            for (let i = 0; i < count; ++i) {
                vertices.push(parseArray(state));
                parseSymbol(state, ',');
            }

            parseSymbol(state, '}');

            res.Vertices = vertices;
        } else {
            let val = parseNumber(state);
            parseSpace(state);

            res[keyword] = val;
        }

        if (state.char() === ',') {
            parseSymbol(state, ',');
        }
    }

    parseSymbol(state, '}');

    model.CollisionShapes.push(res);
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
        // default
        Version: 800
    };

    while (state.pos < state.str.length) {
        parseComment(state);
        const keyword = parseKeyword(state);

        if (keyword && keyword in parsers) {
            parsers[keyword](state, model);
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
