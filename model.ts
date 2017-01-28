export interface ModelInfo {
    Name: String;
    MinimumExtent: Float32Array;
    MaximumExtent: Float32Array;
    BoundsRadius: number;
    BlendTime: number;
}

export interface Sequence {
    Interval: Uint32Array;
    NonLooping: boolean;
    MinimumExtent: Float32Array;
    MaximumExtent: Float32Array;
    BoundsRadius: number;
    MoveSpeed: number;
    Rarity: number;
}

export enum TextureFlags {
    WrapWidth = 1,
    WrapHeight = 2
}

export interface Texture {
    Image: string;
    ReplaceableId?: number;
    Flags?: TextureFlags;
}

export enum FilterMode {
    None = 0,
    Transparent = 1,
    Blend = 2,
    Additive = 3,
    AddAlpha = 4,
    Modulate = 5,
    Modulate2x = 6
}

export enum LineType {
    DontInterp = 0,
    Linear = 1,
    Hermite = 2,
    Bezier = 3
}

export interface AnimKeyframe {
    Frame: number;
    Vector: Float32Array;
    InTan?: Float32Array;
    OutTan?: Float32Array;
}

export interface AnimVector {
    LineType: LineType;
    GlobalSeqId?: number;
    Keys: AnimKeyframe[];
}

export enum LayerShading {
    Unshaded = 1,
    SphereEnvMap = 2,
    TwoSided = 16,
    Unfogged = 32,
    NoDepthTest = 64,
    NoDepthSet = 128
}

export interface Layer {
    FilterMode?: FilterMode;
    Shading?: number;
    TextureID?: AnimVector|number;
    TVertexAnimId?: number;
    Alpha?: AnimVector|number;
}

export enum MaterialRenderMode {
    ConstantColor = 1,
    SortPrimsFarZ = 16,
    FullResolution = 32,
}

export interface Material {
    PriorityPlane?: number;
    RenderMode?: number;
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

export enum GeosetAnimFlags {
    DropShadow = 1,
    Color = 2
}

export interface GeosetAnim {
    Alpha: AnimVector|number;
    Color: AnimVector|Float32Array;
    Flags: number;
    GeosetId: number;
}

export enum NodeFlags {
    DontInheritTranslation = 1,
    DontInheritScaling = 2,
    DontInheritRotation = 4,
    Billboarded = 8,
    BillboardedLockX = 16,
    BillboardedLockY = 32,
    BillboardedLockZ = 64,
    CameraAnchored = 128
}

export enum NodeType {
    Helper = 0,
    Bone = 256,
    Light = 512,
    EventObject = 1024,
    Attachment = 2048,
    ParticleEmitter = 4096,
    CollisionShape = 8192,
    RibbonEmitter = 16384
}

export interface Node {
    Type: string;
    Name: string;
    ObjectId: number;
    Parent?: number;
    PivotPoint: Float32Array;
    Flags: number;

    Translation?: AnimVector;
    Rotation?: AnimVector;
    Scaling?: AnimVector;
}

export interface Bone extends Node {
    GeosetId?: number;
    GeosetAnimId?: number;
}

export interface Helper extends Node {
}

export interface Attachment extends Node {
    Path?: string;
    AttachmentID?: number;
    Visibility?: AnimVector;
}

export interface EventObject extends Node {
    EventTrack: Uint32Array;
}

export enum CollisionShapeType {
    Box = 0,
    Sphere = 2
}

export interface CollisionShape extends Node {
    Shape: CollisionShapeType;
    Vertices: Float32Array;
    BoundsRadius?: number;
}

export enum ParticleEmitter2Flags {
    Unshaded = 32768,
    SortPrimsFarZ = 65536,
    LineEmitter = 131072,
    Unfogged = 262144,
    ModelSpace = 524288,
    XYQuad = 1048576
}

export enum ParticleEmitter2FilterMode {
    Blend = 0,
    Additive = 1,
    Modulate = 2,
    Modulate2x = 3,
    AlphaKey = 4
}

// Not actually mapped to mdx flags (0: Head, 1: Tail, 2: Both)
export enum ParticleEmitter2FramesFlags {
    Head = 1,
    Tail = 2
}

export interface ParticleEmitter2 extends Node {
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
    FilterMode?: ParticleEmitter2FilterMode;
    Rows?: number;
    Columns?: number;
    FrameFlags: number;
    TailLength?: number;
    Time?: number;
    SegmentColor?: Float32Array[];
    Alpha?: Uint8Array;
    ParticleScaling?: Float32Array;
    LifeSpanUVAnim?: Uint32Array;
    DecayUVAnim?: Uint32Array;
    TailUVAnim?: Uint32Array;
    TailDecayUVAnim?: Uint32Array;
    TextureID?: number;
    ReplaceableId?: number;
    PriorityPlane?: number;
}

export interface Camera {
    Name: string;
    Position: Float32Array;
    FieldOfView: number;
    NearClip: number;
    FarClip: number;
    TargetPosition: Float32Array;
    TargetTranslation?: AnimVector;
    Translation?: AnimVector;
    Rotation?: AnimVector;
}

export enum LightType {
    Omnidirectional = 0,
    Directional = 1,
    Ambient = 2
}

export interface Light extends Node {
    LightType: LightType;

    AttenuationStart?: number;
    AttenuationEnd?: number;

    Color?: AnimVector|Float32Array;
    Intensity?: AnimVector|number;
    AmbIntensity?: AnimVector|number;
    AmbColor?: AnimVector|Float32Array;

    Visibility?: AnimVector;
}

export interface RibbonEmitter extends Node {
    HeightAbove?: AnimVector|number;
    HeightBelow?: AnimVector|number;
    Alpha?: number;
    Color?: Float32Array;
    LifeSpan?: number;
    TextureSlot?: number;
    EmissionRate?: number;
    Rows?: number;
    Columns?: number;
    MaterialID?: number;
    Gravity?: number;

    Visibility?: AnimVector;
}

export interface TVertexAnim {
    Translation?: AnimVector;
    Rotation?: AnimVector;
    Scaling?: AnimVector;
}

export interface Model {
    Version: number;
    Info: ModelInfo;
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
    EventObjects: {[key: string]: EventObject};
    CollisionShapes: {[key: string]: CollisionShape};
    GlobalSequences?: number[];
    ParticleEmitters2?: {[key: string]: ParticleEmitter2};
    Cameras?: {[key: string]: Camera};
    Lights?: {[key: string]: Light};
    RibbonEmitters?: {[key: string]: RibbonEmitter};
    TextureAnims?: TVertexAnim[];
}
