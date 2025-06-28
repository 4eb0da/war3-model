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
    materialLayerNormalTextureID: number[][];
    materialLayerOrmTextureID: number[][];
    materialLayerReflectionTextureID: number[][];
    teamColor: vec3;
    cameraPos: vec3;
    cameraQuat: quat;
    lightPos: vec3;
    lightColor: vec3;
    shadowBias: number;
    shadowSmoothingStep: number;
    textures: {[key: string]: WebGLTexture};
    gpuTextures: {[key: string]: GPUTexture};
    gpuSamplers: GPUSampler[];
    gpuDepthSampler: GPUSampler;
    requiredEnvMaps: {[key: string]: boolean};
    envTextures: {[key: string]: WebGLTexture};
    gpuEnvTextures: {[key: string]: GPUTexture};
    irradianceMap: {[key: string]: WebGLTexture};
    gpuIrradianceMap: {[key: string]: GPUTexture};
    prefilteredEnvMap: {[key: string]: WebGLTexture};
    gpuPrefilteredEnvMap: {[key: string]: GPUTexture};

    gpuEmptyTexture: GPUTexture;
    gpuEmptyCubeTexture: GPUTexture;
    gpuDepthEmptyTexture: GPUTexture;
}
