export interface Sequence {
    Interval: Uint32Array;
    NonLooping: boolean;
    MinimumExtent: Float32Array;
    MaximumExtent: Float32Array;
    BoundsRadius: number;
}

export interface Texture {
    Image: string;
    ReplaceableId?: number;
}

export type FilterMode = 'None'|'Transparent'|'Blend'|'Additive'|'AddAlpha'|'Modulate'|'Modulate2x';

export type LineType = 'DontInterp'|'Linear'|'Bezier'|'Hermite';

export interface AnimKeyframe {
    Frame: number;
    Vector: Float32Array;
    InTan?: Float32Array;
    OutTan?: Float32Array;
}

export interface AnimVector {
    LineType: LineType;
    Keys: AnimKeyframe[];
    GlobalSeqId?: number;
}

export interface Layer {
    FilterMode?: FilterMode;
    Unshaded?: boolean;
    SphereEnvMap?: boolean;
    TwoSided?: boolean;
    Unfogged?: boolean;
    NoDepthTest?: boolean;
    NoDepthSet?: boolean;
    TextureID?: number;
    Alpha?: AnimVector|number;
}

export interface Material {
    ConstantColor?: boolean;
    SortPrimsFarZ?: boolean;
    FullResolution?: boolean;
    PriorityPlane?: number;
    Layers: Layer[];
}

export interface GeosetAnimInfo {
    MinimumExtent: Float32Array;
    MaximumExtent: Float32Array;
    BoundsRadius: number;
}

export interface Geoset {
    Vertices: Float32Array;
    Normals: Float32Array;
    TVertices: Float32Array;
    VertexGroup: Uint16Array;
    Faces: Uint16Array;
    Groups: number[][];
    TotalGroupsCount: number;
    MinimumExtent: Float32Array;
    MaximumExtent: Float32Array;
    BoundsRadius: number;
    Anims: GeosetAnimInfo[];
    MaterialID: number;
    SelectionGroup: number;
    Unselectable: boolean;
}

export interface GeosetAnim {
    Alpha: AnimVector|number;
    DropShadow?: boolean;
    GeosetId: number;
}

export interface Node {
    Type: string;
    Name: string;
    ObjectId: number;
    Parent?: number;
    PivotPoint: Float32Array;

    BillboardedLockZ?: boolean;
    BillboardedLockY?: boolean;
    BillboardedLockX?: boolean;
    Billboarded?: boolean;
    CameraAnchored?: boolean;
    DontInheritTranslation?: boolean;
    DontInheritRotation?: boolean;
    DontInheritScaling?: boolean;
}

export interface Bone extends Node {
    GeosetId?: number;
    GeosetAnimId?: number;
    Translation?: AnimVector;
    Rotation?: AnimVector;
    Scaling?: AnimVector;
}

export interface Helper extends Node {
    Translation?: AnimVector;
    Rotation?: AnimVector;
    Scaling?: AnimVector;
}

export interface Attachment extends Node {
    AttachmentID?: number;
    Visibility?: AnimVector;
}

export interface EventObject extends Node {
    EventTrack: Uint32Array;
}

export interface CollisionShape extends Node {
    Shape: 'Box' | 'Sphere';
    Vertices: Float32Array;
    BoundsRadius?: number;
}

export interface ParticleEmitter2 extends Node {
    SortPrimsFarZ?: boolean;
    Unshaded?: boolean;
    LineEmitter?: boolean;
    Unfogged?: boolean;
    ModelSpace?: boolean;
    XYQuad?: boolean;
    Speed?: AnimVector|number;
    Variation?: AnimVector|number;
    Latitude?: AnimVector|number;
    Gravity?: AnimVector|number;
    Visibility?: AnimVector|number;
    Squirt?: boolean;
    LifeSpan?: number;
    EmissionRate?: AnimVector|number;
    Width?: AnimVector|number;
    Length?: AnimVector|number;
    FilterMode?: FilterMode;
    Rows?: number;
    Columns?: number;
    Head?: boolean;
    Tail?: boolean;
    TailLength?: number;
    Time?: number;
    SegmentColor?: number[][];
    Alpha?: number[];
    ParticleScaling?: number[];
    LifeSpanUVAnim?: number[];
    DecayUVAnim?: number[];
    TailUVAnim?: number[];
    TailDecayUVAnim?: number[];
    TextureID?: number;
    ReplaceableId?: number;
    PriorityPlane?: number;
}

export interface GlobalSequences {
    Duration: number;
}

export interface Model {
    Version: number;
    Info: any;
    Sequences: {[key: string]: Sequence};
    Textures: Texture[];
    Materials: Material[];
    Geosets: Geoset[];
    GeosetAnims: GeosetAnim[];
    Bones: {[key: string]: Bone};
    Helpers: {[key: string]: Helper};
    Attachments: {[key: string]: Attachment};
    Nodes: Node[];
    PivotPoints: Float32Array[];
    EventObjects: EventObject[];
    CollisionShapes: CollisionShape[];
    GlobalSequences?: GlobalSequences;
    ParticleEmitters2?: ParticleEmitter2[];
}
