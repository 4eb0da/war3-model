import {Sequence, Model, GeosetAnim, Node} from '../model';
import {vec3, quat, mat4} from 'gl-matrix';

export interface NodeWrapper {
    node: Node;
    matrix: mat4;
    childs: NodeWrapper[];
}

export interface RendererData {
    model: Model;
    frame: number;
    animation: number;
    animationInfo: Sequence;
    globalSequencesFrames: number[];

    rootNode: NodeWrapper;
    nodes: NodeWrapper[];

    // geoset-to-anim map
    geosetAnims: GeosetAnim[];
    geosetAlpha: number[];
    materialLayerTextureID: number[][];
    teamColor: vec3;
    cameraPos: vec3;
    cameraQuat: quat;
    textures: {[key: string]: WebGLTexture};
}
