/// <reference types="vite/client" />
/// <reference types="@webgpu/types" />

import type {DdsInfo} from 'dds-parser';
import {
    Model, Node, AnimVector, NodeFlags, Layer, LayerShading, FilterMode,
    TextureFlags, TVertexAnim, Geoset
} from '../model';
import {vec3, quat, mat3, mat4} from 'gl-matrix';
import {mat4fromRotationOrigin, getShader, isWebGL2} from './util';
import {ModelInterp} from './modelInterp';
import {RendererData, NodeWrapper} from './rendererData';
import {ParticlesController} from './particles';
import {RibbonsController} from './ribbons';
import vertexShaderHardwareSkinningSource from './shaders/webgl/sdHardwareSkinning.vs.glsl?raw';
import vertexShaderSoftwareSkinning from './shaders/webgl/sdSoftwareSkinning.vs.glsl?raw';
import fragmentShader from './shaders/webgl/sd.fs.glsl?raw';
import vertexShaderHDHardwareSkinningOldSource from './shaders/webgl/hdHardwareSkinningOld.vs.glsl?raw';
import vertexShaderHDHardwareSkinningNewSource from './shaders/webgl/hdHardwareSkinningNew.vs.glsl?raw';
import fragmentShaderHDOld from './shaders/webgl/hdOld.fs.glsl?raw';
import fragmentShaderHDNewSource from './shaders/webgl/hdNew.fs.glsl?raw';
import skeletonVertexShader from './shaders/webgl/skeleton.vs.glsl?raw';
import skeletonFragmentShader from './shaders/webgl/skeleton.fs.glsl?raw';
import envToCubemapVertexShader from './shaders/webgl/envToCubemap.vs.glsl?raw';
import envToCubemapFragmentShader from './shaders/webgl/envToCubemap.fs.glsl?raw';
import envVertexShader from './shaders/webgl/env.vs.glsl?raw';
import envFragmentShader from './shaders/webgl/env.fs.glsl?raw';
import convoluteEnvDiffuseVertexShader from './shaders/webgl/convoluteEnvDiffuse.vs.glsl?raw';
import convoluteEnvDiffuseFragmentShader from './shaders/webgl/convoluteEnvDiffuse.fs.glsl?raw';
import prefilterEnvVertexShader from './shaders/webgl/prefilterEnv.vs.glsl?raw';
import prefilterEnvFragmentShader from './shaders/webgl/prefilterEnv.fs.glsl?raw';
import integrateBRDFVertexShader from './shaders/webgl/integrateBRDF.vs.glsl?raw';
import integrateBRDFFragmentShader from './shaders/webgl/integrateBRDF.fs.glsl?raw';
import sdShaderSource from './shaders/webgpu/sd.wgsl?raw';
import hdShaderSource from './shaders/webgpu/hd.wgsl?raw';
import depthShaderSource from './shaders/webgpu/depth.wgsl?raw';
import skeletonShaderSource from './shaders/webgpu/skeleton.wgsl?raw';
import envShader from './shaders/webgpu/env.wgsl?raw';
import envToCubemapShader from './shaders/webgpu/envToCubemap.wgsl?raw';
import convoluteEnvDiffuseShader from './shaders/webgpu/convoluteEnvDiffuse.wgsl?raw';
import prefilterEnvShader from './shaders/webgpu/prefilterEnv.wgsl?raw';
import integrateBRDFFShader from './shaders/webgpu/integrateBRDF.wgsl?raw';
import { generateMips } from './generateMips';

// actually, all is number
export type DDS_FORMAT = WEBGL_compressed_texture_s3tc['COMPRESSED_RGBA_S3TC_DXT1_EXT'] |
    WEBGL_compressed_texture_s3tc['COMPRESSED_RGBA_S3TC_DXT3_EXT'] |
    WEBGL_compressed_texture_s3tc['COMPRESSED_RGBA_S3TC_DXT5_EXT'] |
    WEBGL_compressed_texture_s3tc['COMPRESSED_RGB_S3TC_DXT1_EXT'];

const MAX_NODES = 254;

const ENV_MAP_SIZE = 2048;
const ENV_CONVOLUTE_DIFFUSE_SIZE = 32;
const ENV_PREFILTER_SIZE = 128;
const MAX_ENV_MIP_LEVELS = 8;
const BRDF_LUT_SIZE = 512;

const MULTISAMPLE = 4;

const FILTER_MODES_WITH_DEPTH_WRITE = new Set([0, 1]);

interface WebGLProgramObject<A extends string, U extends string> {
    program: WebGLProgram;
    vertexShader: WebGLShader;
    fragmentShader: WebGLShader;
    attributes: Record<A, GLuint>;
    uniforms: Record<U, WebGLUniformLocation>;
}

const vertexShaderHardwareSkinning = vertexShaderHardwareSkinningSource.replace(/\$\{MAX_NODES}/g, String(MAX_NODES));
const vertexShaderHDHardwareSkinningOld = vertexShaderHDHardwareSkinningOldSource.replace(/\$\{MAX_NODES}/g, String(MAX_NODES));
const vertexShaderHDHardwareSkinningNew = vertexShaderHDHardwareSkinningNewSource.replace(/\$\{MAX_NODES}/g, String(MAX_NODES));
const fragmentShaderHDNew = fragmentShaderHDNewSource.replace(/\$\{MAX_ENV_MIP_LEVELS}/g, String(MAX_ENV_MIP_LEVELS.toFixed(1)));
const sdShader = sdShaderSource.replace(/\$\{MAX_NODES}/g, String(MAX_NODES));
const hdShader = hdShaderSource.replace(/\$\{MAX_NODES}/g, String(MAX_NODES)).replace(/\$\{MAX_ENV_MIP_LEVELS}/g, String(MAX_ENV_MIP_LEVELS.toFixed(1)));
const depthShader = depthShaderSource.replace(/\$\{MAX_NODES}/g, String(MAX_NODES));

const translation = vec3.create();
const rotation = quat.create();
const scaling = vec3.create();

const defaultTranslation = vec3.fromValues(0, 0, 0);
const defaultRotation = quat.fromValues(0, 0, 0, 1);
const defaultScaling = vec3.fromValues(1, 1, 1);

const tempParentRotationQuat: quat = quat.create();
const tempParentRotationMat: mat4 = mat4.create();
const tempCameraMat: mat4 = mat4.create();
const tempTransformedPivotPoint: vec3 = vec3.create();
const tempAxis: vec3 = vec3.create();
const tempLockQuat: quat = quat.create();
const tempLockMat: mat4 = mat4.create();
const tempXAxis: vec3 = vec3.create();
const tempCameraVec: vec3 = vec3.create();
const tempCross0: vec3 = vec3.create();
const tempCross1: vec3 = vec3.create();

const tempPos: vec3 = vec3.create();
const tempSum: vec3 = vec3.create();
const tempVec3: vec3 = vec3.create();

const identifyMat3: mat3 = mat3.create();
const texCoordMat4: mat4 = mat4.create();
const texCoordMat3: mat3 = mat3.create();

const GPU_LAYER_PROPS: [string, GPUBlendState, GPUDepthStencilState][] = [['none', {
    color: {
        operation: 'add',
        srcFactor: 'one',
        dstFactor: 'zero'
    },
    alpha: {
        operation: 'add',
        srcFactor: 'one',
        dstFactor: 'zero'
    }
}, {
    depthWriteEnabled: true,
    depthCompare: 'less-equal',
    format: 'depth24plus'
}], ['transparent', {
    color: {
        operation: 'add',
        srcFactor: 'src-alpha',
        dstFactor: 'one-minus-src-alpha'
    },
    alpha: {
        operation: 'add',
        srcFactor: 'one',
        dstFactor: 'one-minus-src-alpha'
    }
}, {
    depthWriteEnabled: true,
    depthCompare: 'less-equal',
    format: 'depth24plus'
}], ['blend', {
    color: {
        operation: 'add',
        srcFactor: 'src-alpha',
        dstFactor: 'one-minus-src-alpha'
    },
    alpha: {
        operation: 'add',
        srcFactor: 'one',
        dstFactor: 'one-minus-src-alpha'
    }
}, {
    depthWriteEnabled: false,
    depthCompare: 'less-equal',
    format: 'depth24plus'
}], ['additive', {
    color: {
        operation: 'add',
        srcFactor: 'src',
        dstFactor: 'one'
    },
    alpha: {
        operation: 'add',
        srcFactor: 'src',
        dstFactor: 'one'
    }
}, {
    depthWriteEnabled: false,
    depthCompare: 'less-equal',
    format: 'depth24plus'
}], ['addAlpha', {
    color: {
        operation: 'add',
        srcFactor: 'src-alpha',
        dstFactor: 'one'
    },
    alpha: {
        operation: 'add',
        srcFactor: 'src-alpha',
        dstFactor: 'one'
    }
}, {
    depthWriteEnabled: false,
    depthCompare: 'less-equal',
    format: 'depth24plus'
}], ['modulate', {
    color: {
        operation: 'add',
        srcFactor: 'zero',
        dstFactor: 'src'
    },
    alpha: {
        operation: 'add',
        srcFactor: 'zero',
        dstFactor: 'one'
    }
}, {
    depthWriteEnabled: false,
    depthCompare: 'less-equal',
    format: 'depth24plus'
}], ['modulate2x', {
    color: {
        operation: 'add',
        srcFactor: 'dst',
        dstFactor: 'src'
    },
    alpha: {
        operation: 'add',
        srcFactor: 'zero',
        dstFactor: 'one'
    }
}, {
    depthWriteEnabled: false,
    depthCompare: 'less-equal',
    format: 'depth24plus'
}]];

export class ModelRenderer {
    private isHD: boolean;

    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext | WebGLRenderingContext;
    private device: GPUDevice;
    private gpuContext: GPUCanvasContext;
    private anisotropicExt: EXT_texture_filter_anisotropic | null;
    private colorBufferFloatExt: EXT_color_buffer_float | null;
    private vertexShader: WebGLShader | null;
    private fragmentShader: WebGLShader | null;
    private shaderProgram: WebGLProgram | null;
    private vsBindGroupLayout: GPUBindGroupLayout | null;
    private fsBindGroupLayout: GPUBindGroupLayout | null;
    private gpuShaderModule: GPUShaderModule | null;
    private gpuDepthShaderModule: GPUShaderModule | null;
    private gpuPipelines: Record<string, GPURenderPipeline> = {};
    private gpuWireframePipeline: GPURenderPipeline | null;
    private gpuShadowPipeline: GPURenderPipeline | null;
    private gpuPipelineLayout: GPUPipelineLayout | null;
    private gpuRenderPassDescriptor: GPURenderPassDescriptor | null;
    private shaderProgramLocations: {
        vertexPositionAttribute: number | null;
        normalsAttribute: number | null;
        textureCoordAttribute: number | null;
        groupAttribute: number | null;
        skinAttribute: number | null;
        weightAttribute: number | null;
        tangentAttribute: number | null;
        pMatrixUniform: WebGLUniformLocation | null;
        mvMatrixUniform: WebGLUniformLocation | null;
        samplerUniform: WebGLUniformLocation | null;
        normalSamplerUniform: WebGLUniformLocation | null;
        ormSamplerUniform: WebGLUniformLocation | null;
        replaceableColorUniform: WebGLUniformLocation | null;
        replaceableTypeUniform: WebGLUniformLocation | null;
        discardAlphaLevelUniform: WebGLUniformLocation | null;
        tVertexAnimUniform: WebGLUniformLocation | null;
        nodesMatricesAttributes: (WebGLUniformLocation | null)[];
        lightPosUniform: WebGLUniformLocation | null;
        lightColorUniform: WebGLUniformLocation | null;
        cameraPosUniform: WebGLUniformLocation | null;
        shadowParamsUniform: WebGLUniformLocation | null;
        shadowMapSamplerUniform: WebGLUniformLocation | null;
        shadowMapLightMatrixUniform: WebGLUniformLocation | null;
        hasEnvUniform: WebGLUniformLocation | null;
        irradianceMapUniform: WebGLUniformLocation | null;
        prefilteredEnvUniform: WebGLUniformLocation | null;
        brdfLUTUniform: WebGLUniformLocation | null;
    };
    private skeletonShaderProgram: WebGLProgram | null;
    private skeletonVertexShader: WebGLShader | null;
    private skeletonFragmentShader: WebGLShader | null;
    private skeletonShaderProgramLocations: {
        vertexPositionAttribute: number | null;
        colorAttribute: number | null;
        pMatrixUniform: WebGLUniformLocation | null;
        mvMatrixUniform: WebGLUniformLocation | null;
    };
    private skeletonVertexBuffer: WebGLBuffer | null;
    private skeletonColorBuffer: WebGLBuffer | null;
    private skeletonShaderModule: GPUShaderModule;
    private skeletonBindGroupLayout: GPUBindGroupLayout;
    private skeletonPipelineLayout: GPUPipelineLayout;
    private skeletonPipeline: GPURenderPipeline;
    private skeletonGPUVertexBuffer: GPUBuffer;
    private skeletonGPUColorBuffer: GPUBuffer;
    private skeletonGPUUniformsBuffer: GPUBuffer;

    private model: Model;
    private interp: ModelInterp;
    private rendererData: RendererData;
    private particlesController: ParticlesController;
    private ribbonsController: RibbonsController;

    private softwareSkinning: boolean;
    private vertexBuffer: WebGLBuffer[] = [];
    private normalBuffer: WebGLBuffer[] = [];
    private vertices: Float32Array[] = []; // Array per geoset for software skinning
    private texCoordBuffer: WebGLBuffer[] = [];
    private indexBuffer: WebGLBuffer[] = [];
    private wireframeIndexBuffer: WebGLBuffer[] = [];
    private wireframeIndexGPUBuffer: GPUBuffer[] = [];
    private groupBuffer: WebGLBuffer[] = [];
    private skinWeightBuffer: WebGLBuffer[] = [];
    private tangentBuffer: WebGLBuffer[] = [];

    private envShaderModeule: GPUShaderModule;
    private envPiepeline: GPURenderPipeline;
    private envVSBindGroupLayout: GPUBindGroupLayout | null;
    private envFSBindGroupLayout: GPUBindGroupLayout | null;
    private envVSUniformsBuffer: GPUBuffer;
    private envVSBindGroup: GPUBindGroup;
    private envSampler: GPUSampler;
    private cubeVertexBuffer: WebGLBuffer;
    private cubeGPUVertexBuffer: GPUBuffer;
    private squareVertexBuffer: WebGLBuffer;
    private brdfLUT: WebGLTexture;
    private gpuBrdfLUT: GPUTexture;
    private gpuBrdfSampler: GPUSampler;

    private envToCubemap: WebGLProgramObject<'aPos', 'uPMatrix' | 'uMVMatrix' | 'uEquirectangularMap'>;
    private envToCubemapShaderModule: GPUShaderModule;
    private envToCubemapPiepeline: GPURenderPipeline;
    private envToCubemapVSBindGroupLayout: GPUBindGroupLayout | null;
    private envToCubemapFSBindGroupLayout: GPUBindGroupLayout | null;
    private envToCubemapSampler: GPUSampler;
    private envSphere: WebGLProgramObject<'aPos', 'uPMatrix' | 'uMVMatrix' | 'uEnvironmentMap'>;
    private convoluteDiffuseEnv: WebGLProgramObject<'aPos', 'uPMatrix' | 'uMVMatrix' | 'uEnvironmentMap'>;
    private convoluteDiffuseEnvShaderModule: GPUShaderModule;
    private convoluteDiffuseEnvPiepeline: GPURenderPipeline;
    private convoluteDiffuseEnvVSBindGroupLayout: GPUBindGroupLayout | null;
    private convoluteDiffuseEnvFSBindGroupLayout: GPUBindGroupLayout | null;
    private convoluteDiffuseEnvSampler: GPUSampler;
    private prefilterEnv: WebGLProgramObject<'aPos', 'uPMatrix' | 'uMVMatrix' | 'uEnvironmentMap' | 'uRoughness'>;
    private prefilterEnvShaderModule: GPUShaderModule;
    private prefilterEnvPiepeline: GPURenderPipeline;
    private prefilterEnvVSBindGroupLayout: GPUBindGroupLayout | null;
    private prefilterEnvFSBindGroupLayout: GPUBindGroupLayout | null;
    private prefilterEnvSampler: GPUSampler;
    private integrateBRDF: WebGLProgramObject<'aPos', never>;

    private gpuMultisampleTexture: GPUTexture;
    private gpuDepthTexture: GPUTexture;
    private gpuVertexBuffer: GPUBuffer[] = [];
    private gpuNormalBuffer: GPUBuffer[] = [];
    private gpuTexCoordBuffer: GPUBuffer[] = [];
    private gpuGroupBuffer: GPUBuffer[] = [];
    private gpuIndexBuffer: GPUBuffer[] = [];
    private gpuSkinWeightBuffer: GPUBuffer[] = [];
    private gpuTangentBuffer: GPUBuffer[] = [];
    private gpuVSUniformsBuffer: GPUBuffer;
    private gpuVSUniformsBindGroup: GPUBindGroup;
    private gpuFSUniformsBuffers: GPUBuffer[][] = [];

    constructor(model: Model) {
        this.isHD = model.Geosets?.some(it => it.SkinWeights?.length > 0);

        this.shaderProgramLocations = {
            vertexPositionAttribute: null,
            normalsAttribute: null,
            textureCoordAttribute: null,
            groupAttribute: null,
            skinAttribute: null,
            weightAttribute: null,
            tangentAttribute: null,
            pMatrixUniform: null,
            mvMatrixUniform: null,
            samplerUniform: null,
            normalSamplerUniform: null,
            ormSamplerUniform: null,
            replaceableColorUniform: null,
            replaceableTypeUniform: null,
            discardAlphaLevelUniform: null,
            tVertexAnimUniform: null,
            nodesMatricesAttributes: null,
            lightPosUniform: null,
            lightColorUniform: null,
            cameraPosUniform: null,
            shadowParamsUniform: null,
            shadowMapSamplerUniform: null,
            shadowMapLightMatrixUniform: null,
            hasEnvUniform: null,
            irradianceMapUniform: null,
            prefilteredEnvUniform: null,
            brdfLUTUniform: null
        };
        this.skeletonShaderProgramLocations = {
            vertexPositionAttribute: null,
            colorAttribute: null,
            mvMatrixUniform: null,
            pMatrixUniform: null
        };

        this.model = model;

        this.rendererData = {
            model,
            frame: 0,
            animation: null,
            animationInfo: null,
            globalSequencesFrames: [],
            rootNode: null,
            nodes: [],
            geosetAnims: [],
            geosetAlpha: [],
            materialLayerTextureID: [],
            materialLayerNormalTextureID: [],
            materialLayerOrmTextureID: [],
            materialLayerReflectionTextureID: [],
            teamColor: null,
            lastTeamColor: vec3.create(),
            cameraPos: null,
            cameraQuat: null,
            lightPos: null,
            lightColor: null,
            shadowBias: 0,
            shadowSmoothingStep: 0,
            textures: {},
            gpuTextures: {},
            gpuSamplers: [],
            gpuDepthSampler: null,
            gpuEmptyTexture: null,
            gpuEmptyCubeTexture: null,
            gpuDepthEmptyTexture: null,
            envTextures: {},
            gpuEnvTextures: {},
            requiredEnvMaps: {},
            irradianceMap: {},
            gpuIrradianceMap: {},
            prefilteredEnvMap: {},
            gpuPrefilteredEnvMap: {}
        };

        this.rendererData.teamColor = vec3.fromValues(1., 0., 0.);
        this.rendererData.cameraPos = vec3.create();
        this.rendererData.cameraQuat = quat.create();
        this.rendererData.lightPos = vec3.fromValues(1000, 1000, 1000);
        this.rendererData.lightColor = vec3.fromValues(1, 1, 1);

        this.setSequence(0);

        this.rendererData.rootNode = {
            // todo
            node: {} as Node,
            matrix: mat4.create(),
            childs: []
        };
        for (const node of model.Nodes) {
            if (node) {
                this.rendererData.nodes[node.ObjectId] = {
                    node,
                    matrix: mat4.create(),
                    childs: []
                };
            }
        }
        for (const node of model.Nodes) {
            if (node) {
                if (!node.Parent && node.Parent !== 0) {
                    this.rendererData.rootNode.childs.push(this.rendererData.nodes[node.ObjectId]);
                } else {
                    this.rendererData.nodes[node.Parent].childs.push(this.rendererData.nodes[node.ObjectId]);
                }
            }
        }

        if (model.GlobalSequences) {
            for (let i = 0; i < model.GlobalSequences.length; ++i) {
                this.rendererData.globalSequencesFrames[i] = 0;
            }
        }

        for (let i = 0; i < model.GeosetAnims.length; ++i) {
            this.rendererData.geosetAnims[model.GeosetAnims[i].GeosetId] = model.GeosetAnims[i];
        }

        for (let i = 0; i < model.Materials.length; ++i) {
            this.rendererData.materialLayerTextureID[i] = new Array(model.Materials[i].Layers.length);
            this.rendererData.materialLayerNormalTextureID[i] = new Array(model.Materials[i].Layers.length);
            this.rendererData.materialLayerOrmTextureID[i] = new Array(model.Materials[i].Layers.length);
            this.rendererData.materialLayerReflectionTextureID[i] = new Array(model.Materials[i].Layers.length);
        }

        this.interp = new ModelInterp(this.rendererData);
        this.particlesController = new ParticlesController(this.interp, this.rendererData);
        this.ribbonsController = new RibbonsController(this.interp, this.rendererData);
    }

    public destroy (): void {
        if (this.particlesController) {
            this.particlesController.destroy();
            this.particlesController = null;
        }
        if (this.ribbonsController) {
            this.ribbonsController.destroy();
            this.ribbonsController = null;
        }

        if (this.device) {
            for (const buffer of this.wireframeIndexGPUBuffer) {
                buffer.destroy();
            }
            this.gpuMultisampleTexture?.destroy();
            this.gpuDepthTexture?.destroy();

            for (const buffer of this.gpuVertexBuffer) {
                buffer.destroy();
            }
            for (const buffer of this.gpuNormalBuffer) {
                buffer.destroy();
            }
            for (const buffer of this.gpuTexCoordBuffer) {
                buffer.destroy();
            }
            for (const buffer of this.gpuGroupBuffer) {
                buffer.destroy();
            }
            for (const buffer of this.gpuIndexBuffer) {
                buffer.destroy();
            }
            for (const buffer of this.gpuSkinWeightBuffer) {
                buffer.destroy();
            }
            for (const buffer of this.gpuTangentBuffer) {
                buffer.destroy();
            }
            this.gpuVSUniformsBuffer?.destroy();
            for (const materialID in this.gpuFSUniformsBuffers) {
                for (const buffer of this.gpuFSUniformsBuffers[materialID]) {
                    buffer.destroy();
                }
            }

            if (this.skeletonGPUVertexBuffer) {
                this.skeletonGPUVertexBuffer.destroy();
                this.skeletonGPUVertexBuffer = null;
            }
            if (this.skeletonGPUColorBuffer) {
                this.skeletonGPUColorBuffer.destroy();
                this.skeletonGPUColorBuffer = null;
            }
            if (this.skeletonGPUUniformsBuffer) {
                this.skeletonGPUUniformsBuffer.destroy();
                this.skeletonGPUUniformsBuffer = null;
            }
            if (this.envVSUniformsBuffer) {
                this.envVSUniformsBuffer.destroy();
                this.envVSUniformsBuffer = null;
            }
            if (this.cubeGPUVertexBuffer) {
                this.cubeGPUVertexBuffer.destroy();
                this.cubeGPUVertexBuffer = null;
            }
            for (const buffer of this.wireframeIndexGPUBuffer) {
                buffer?.destroy();
            }
        }

        if (this.gl) {
            if (this.skeletonShaderProgram) {
                if (this.skeletonVertexShader) {
                    this.gl.detachShader(this.skeletonShaderProgram, this.skeletonVertexShader);
                    this.gl.deleteShader(this.skeletonVertexShader);
                    this.skeletonVertexShader = null;
                }
                if (this.skeletonFragmentShader) {
                    this.gl.detachShader(this.skeletonShaderProgram, this.skeletonFragmentShader);
                    this.gl.deleteShader(this.skeletonFragmentShader);
                    this.skeletonFragmentShader = null;
                }
                this.gl.deleteProgram(this.skeletonShaderProgram);
                this.skeletonShaderProgram = null;
            }

            if (this.shaderProgram) {
                if (this.vertexShader) {
                    this.gl.detachShader(this.shaderProgram, this.vertexShader);
                    this.gl.deleteShader(this.vertexShader);
                    this.vertexShader = null;
                }
                if (this.fragmentShader) {
                    this.gl.detachShader(this.shaderProgram, this.fragmentShader);
                    this.gl.deleteShader(this.fragmentShader);
                    this.fragmentShader = null;
                }
                this.gl.deleteProgram(this.shaderProgram);
                this.shaderProgram = null;
            }

            this.destroyShaderProgramObject(this.envToCubemap);
            this.destroyShaderProgramObject(this.envSphere);
            this.destroyShaderProgramObject(this.convoluteDiffuseEnv);
            this.destroyShaderProgramObject(this.prefilterEnv);
            this.destroyShaderProgramObject(this.integrateBRDF);

            this.gl.deleteBuffer(this.cubeVertexBuffer);
            this.gl.deleteBuffer(this.squareVertexBuffer);
        }
    }

    private initRequiredEnvMaps (): void {
        if (this.model.Version >= 1000 && (isWebGL2(this.gl) || this.device)) {
            this.model.Materials.forEach(material => {
                let layer;
                if (
                    material.Shader === 'Shader_HD_DefaultUnit' && material.Layers.length === 6 && typeof material.Layers[5].TextureID === 'number' ||
                    this.model.Version >= 1100 && (layer = material.Layers.find(it => it.ShaderTypeId === 1 && it.ReflectionsTextureID)) && typeof layer.ReflectionsTextureID === 'number'
                ) {
                    const id = this.model.Version >= 1100 && layer ? layer.ReflectionsTextureID : material.Layers[5].TextureID;
                    this.rendererData.requiredEnvMaps[this.model.Textures[id].Image] = true;
                }
            });
        }
    }

    public initGL (glContext: WebGL2RenderingContext | WebGLRenderingContext): void {
        this.gl = glContext;
        // Max bones + MV + P
        this.softwareSkinning = this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS) < 4 * (MAX_NODES + 2);
        this.anisotropicExt = (
            this.gl.getExtension('EXT_texture_filter_anisotropic') ||
            this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
        );
        this.colorBufferFloatExt = this.gl.getExtension('EXT_color_buffer_float');

        this.initRequiredEnvMaps();

        this.initShaders();
        this.initBuffers();
        this.initCube();
        this.initSquare();
        this.initBRDFLUT();
        this.particlesController.initGL(glContext);
        this.ribbonsController.initGL(glContext);
    }

    public async initGPUDevice (canvas: HTMLCanvasElement, device: GPUDevice, context: GPUCanvasContext): Promise<void> {
        this.canvas = canvas;
        this.device = device;
        this.gpuContext = context;

        this.initRequiredEnvMaps();

        this.initGPUShaders();
        this.initGPUPipeline();
        this.initGPUBuffers();
        this.initGPUUniformBuffers();
        this.initGPUMultisampleTexture();
        this.initGPUDepthTexture();
        this.initGPUEmptyTexture();
        this.initCube();
        this.initGPUBRDFLUT();
        this.particlesController.initGPUDevice(device);
        this.ribbonsController.initGPUDevice(device);
    }

    public setTextureImage (path: string, img: HTMLImageElement): void {
        if (this.device) {
            const texture = this.rendererData.gpuTextures[path] = this.device.createTexture({
                size: [img.width, img.height],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            });
            this.device.queue.copyExternalImageToTexture(
                {
                    source: img
                },
                { texture },
                {
                    width: img.width,
                    height: img.height
                }
            );
            generateMips(this.device, texture);
            this.processEnvMaps(path);
        } else {
            this.rendererData.textures[path] = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);
            // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
            const flags = this.model.Textures.find(it => it.Image === path)?.Flags || 0;
            this.setTextureParameters(flags, true);

            this.gl.generateMipmap(this.gl.TEXTURE_2D);

            this.processEnvMaps(path);

            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        }
    }

    public setTextureImageData (path: string, imageData: ImageData[]): void {
        let count = 1;
        for (let i = 1; i < imageData.length; ++i, ++count) {
            if (
                imageData[i].width !== imageData[i - 1].width / 2 ||
                imageData[i].height !== imageData[i - 1].height / 2
            ) {
                break;
            }
        }

        if (this.device) {
            const texture = this.rendererData.gpuTextures[path] = this.device.createTexture({
                size: [imageData[0].width, imageData[0].height],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
                mipLevelCount: count
            });
            for (let i = 0; i < count; ++i) {
                this.device.queue.writeTexture(
                    {
                        texture,
                        mipLevel: i
                    },
                    imageData[i].data,
                    { bytesPerRow: imageData[i].width * 4 },
                    { width: imageData[i].width, height: imageData[i].height },
                );
            }
            this.processEnvMaps(path);
        } else {
            this.rendererData.textures[path] = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);
            // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            for (let i = 0; i < count; ++i) {
                this.gl.texImage2D(this.gl.TEXTURE_2D, i, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, imageData[i]);
            }
            const flags = this.model.Textures.find(it => it.Image === path)?.Flags || 0;
            this.setTextureParameters(flags, false);
            this.processEnvMaps(path);

            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        }
    }

    public setTextureCompressedImage (path: string, format: DDS_FORMAT, imageData: ArrayBuffer, ddsInfo: DdsInfo): void {
        this.rendererData.textures[path] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);

        const view = new Uint8Array(imageData);

        let count = 1;
        for (let i = 1; i < ddsInfo.images.length; ++i) {
            const image = ddsInfo.images[i];
            if (image.shape.width >= 2 && image.shape.height >= 2) {
                count = i + 1;
            }
        }

        if (isWebGL2(this.gl)) {
            this.gl.texStorage2D(this.gl.TEXTURE_2D, count, format, ddsInfo.images[0].shape.width, ddsInfo.images[0].shape.height);

            for (let i = 0; i < count; ++i) {
                const image = ddsInfo.images[i];
                this.gl.compressedTexSubImage2D(this.gl.TEXTURE_2D, i, 0, 0, image.shape.width, image.shape.height, format, view.subarray(image.offset, image.offset + image.length));
            }
        } else {
            for (let i = 0; i < count; ++i) {
                const image = ddsInfo.images[i];
                this.gl.compressedTexImage2D(this.gl.TEXTURE_2D, i, format, image.shape.width, image.shape.height, 0, view.subarray(image.offset, image.offset + image.length));
            }
        }

        const flags = this.model.Textures.find(it => it.Image === path)?.Flags || 0;
        this.setTextureParameters(flags, isWebGL2(this.gl));
        this.processEnvMaps(path);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    public setGPUTextureCompressedImage (path: string, format: GPUTextureFormat, imageData: ArrayBuffer, ddsInfo: DdsInfo): void {
        const view = new Uint8Array(imageData);

        let count = 1;
        for (let i = 1; i < ddsInfo.images.length; ++i) {
            const image = ddsInfo.images[i];
            if (image.shape.width >= 4 && image.shape.height >= 4) {
                count = i + 1;
            }
        }
        const texture = this.rendererData.gpuTextures[path] = this.device.createTexture({
            size: [ddsInfo.shape.width, ddsInfo.shape.height],
            format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            mipLevelCount: count
        });
        for (let i = 0; i < count; ++i) {
            const image = ddsInfo.images[i];
            this.device.queue.writeTexture(
                {
                    texture,
                    mipLevel: i
                },
                view.subarray(image.offset, image.offset + image.length),
                { bytesPerRow: image.shape.width * (format === 'bc1-rgba-unorm' ? 2 : 4) },
                { width: image.shape.width, height: image.shape.height },
            );
        }

        this.processEnvMaps(path);
    }

    public setCamera (cameraPos: vec3, cameraQuat: quat): void {
        vec3.copy(this.rendererData.cameraPos, cameraPos);
        quat.copy(this.rendererData.cameraQuat, cameraQuat);
    }

    public setLightPosition (lightPos: vec3): void {
        vec3.copy(this.rendererData.lightPos, lightPos);
    }

    public setLightColor (lightColor: vec3): void {
        vec3.copy(this.rendererData.lightColor, lightColor);
    }

    public setSequence (index: number): void {
        this.rendererData.animation = index;
        this.rendererData.animationInfo = this.model.Sequences[this.rendererData.animation];
        this.rendererData.frame = this.rendererData.animationInfo.Interval[0];
    }

    public getSequence (): number {
        return this.rendererData.animation;
    }

    public setFrame (frame: number): void {
        const index = this.model.Sequences.findIndex(it => it.Interval[0] <= frame && it.Interval[1] >= frame);

        if (index < 0) {
            return;
        }

        this.rendererData.animation = index;
        this.rendererData.animationInfo = this.model.Sequences[this.rendererData.animation];
        this.rendererData.frame = frame;
    }

    public getFrame (): number {
        return this.rendererData.frame;
    }

    public setTeamColor (color: vec3): void {
        vec3.copy(this.rendererData.teamColor, color);
    }

    public update (delta: number): void {
        this.rendererData.frame += delta;
        if (this.rendererData.frame > this.rendererData.animationInfo.Interval[1]) {
            this.rendererData.frame = this.rendererData.animationInfo.Interval[0];
        }
        this.updateGlobalSequences(delta);

        this.updateNode(this.rendererData.rootNode);

        this.particlesController.update(delta);
        this.ribbonsController.update(delta);

        for (let i = 0; i < this.model.Geosets.length; ++i) {
            this.rendererData.geosetAlpha[i] = this.findAlpha(i);
        }

        for (let materialId = 0; materialId < this.rendererData.materialLayerTextureID.length; ++materialId) {
            for (let layerId = 0; layerId < this.rendererData.materialLayerTextureID[materialId].length; ++layerId) {
                const layer = this.model.Materials[materialId].Layers[layerId];
                const TextureID: AnimVector|number = layer.TextureID;
                const NormalTextureID: AnimVector|number = layer.NormalTextureID;
                const ORMTextureID: AnimVector|number = layer.ORMTextureID;
                const ReflectionsTextureID: AnimVector|number = layer.ReflectionsTextureID;

                if (typeof TextureID === 'number') {
                    this.rendererData.materialLayerTextureID[materialId][layerId] = TextureID;
                } else {
                    this.rendererData.materialLayerTextureID[materialId][layerId] = this.interp.num(TextureID);
                }
                if (typeof NormalTextureID !== 'undefined') {
                    this.rendererData.materialLayerNormalTextureID[materialId][layerId] = typeof NormalTextureID === 'number' ? NormalTextureID : this.interp.num(NormalTextureID);
                }
                if (typeof ORMTextureID !== 'undefined') {
                    this.rendererData.materialLayerOrmTextureID[materialId][layerId] = typeof ORMTextureID === 'number' ? ORMTextureID : this.interp.num(ORMTextureID);
                }
                if (typeof ReflectionsTextureID !== 'undefined') {
                    this.rendererData.materialLayerReflectionTextureID[materialId][layerId] = typeof ReflectionsTextureID === 'number' ? ReflectionsTextureID : this.interp.num(ReflectionsTextureID);
                }
            }
        }
    }

    public render (mvMatrix: mat4, pMatrix: mat4, {
        wireframe,
        env,
        levelOfDetail = 0,
        useEnvironmentMap = false,
        shadowMapTexture,
        shadowMapMatrix,
        shadowBias,
        shadowSmoothingStep,
        depthTextureTarget
    } : {
        wireframe?: boolean;
        env?: boolean;
        levelOfDetail?: number;
        useEnvironmentMap?: boolean;
        shadowMapTexture?: WebGLTexture | GPUTexture;
        shadowMapMatrix?: mat4;
        shadowBias?: number;
        shadowSmoothingStep?: number;
        depthTextureTarget?: GPUTexture;
    }): void {
        if (depthTextureTarget && !this.isHD) {
            return;
        }

        if (this.device) {
            if (this.gpuMultisampleTexture.width !== this.canvas.width || this.gpuMultisampleTexture.height !== this.canvas.height) {
                this.gpuMultisampleTexture.destroy();
                this.initGPUMultisampleTexture();
            }

            if (this.gpuDepthTexture.width !== this.canvas.width || this.gpuDepthTexture.height !== this.canvas.height) {
                this.gpuDepthTexture.destroy();
                this.initGPUDepthTexture();
            }

            let renderPassDescriptor: GPURenderPassDescriptor;
            if (depthTextureTarget) {
                renderPassDescriptor = {
                    label: 'shadow renderPass',
                    colorAttachments: [],
                    depthStencilAttachment: {
                        view: depthTextureTarget.createView(),
                        depthClearValue: 1,
                        depthLoadOp: 'clear',
                        depthStoreOp: 'store'
                    }
                };
            } else {
                renderPassDescriptor = this.gpuRenderPassDescriptor;
                if (MULTISAMPLE > 1) {
                    this.gpuRenderPassDescriptor.colorAttachments[0].view =
                        this.gpuMultisampleTexture.createView();
                    this.gpuRenderPassDescriptor.colorAttachments[0].resolveTarget =
                        this.gpuContext.getCurrentTexture().createView();
                } else {
                    this.gpuRenderPassDescriptor.colorAttachments[0].view =
                        this.gpuContext.getCurrentTexture().createView();
                }

                this.gpuRenderPassDescriptor.depthStencilAttachment = {
                    view: this.gpuDepthTexture.createView(),
                    depthClearValue: 1,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store'
                };
            }

            const encoder = this.device.createCommandEncoder();
            const pass = encoder.beginRenderPass(renderPassDescriptor);

            if (env) {
                this.renderEnvironmentGPU(pass, mvMatrix, pMatrix);
            }

            const VSUniformsValues = new ArrayBuffer(128 + 64 * MAX_NODES);
            const VSUniformsViews = {
                mvMatrix: new Float32Array(VSUniformsValues, 0, 16),
                pMatrix: new Float32Array(VSUniformsValues, 64, 16),
                nodesMatrices: new Float32Array(VSUniformsValues, 128, 16 * MAX_NODES),
            };
            VSUniformsViews.mvMatrix.set(mvMatrix);
            VSUniformsViews.pMatrix.set(pMatrix);
            for (let j = 0; j < MAX_NODES; ++j) {
                if (this.rendererData.nodes[j]) {
                    VSUniformsViews.nodesMatrices.set(this.rendererData.nodes[j].matrix, j * 16);
                }
            }
            this.device.queue.writeBuffer(this.gpuVSUniformsBuffer, 0, VSUniformsValues);

            for (let i = 0; i < this.model.Geosets.length; ++i) {
                const geoset = this.model.Geosets[i];
                if (this.rendererData.geosetAlpha[i] < 1e-6) {
                    continue;
                }
                if (geoset.LevelOfDetail !== undefined && geoset.LevelOfDetail !== levelOfDetail) {
                    continue;
                }

                if (wireframe && !this.wireframeIndexGPUBuffer[i]) {
                    this.createWireframeGPUBuffer(i);
                }

                const materialID = geoset.MaterialID;
                const material = this.model.Materials[materialID];

                pass.setVertexBuffer(0, this.gpuVertexBuffer[i]);
                pass.setVertexBuffer(1, this.gpuNormalBuffer[i]);
                pass.setVertexBuffer(2, this.gpuTexCoordBuffer[i]);

                if (this.isHD) {
                    pass.setVertexBuffer(3, this.gpuTangentBuffer[i]);
                    pass.setVertexBuffer(4, this.gpuSkinWeightBuffer[i]);
                    pass.setVertexBuffer(5, this.gpuSkinWeightBuffer[i]);
                } else {
                    pass.setVertexBuffer(3, this.gpuGroupBuffer[i]);
                }

                pass.setIndexBuffer(wireframe ? this.wireframeIndexGPUBuffer[i] : this.gpuIndexBuffer[i], 'uint16');

                if (this.isHD) {
                    const baseLayer = material.Layers[0];
                    if (depthTextureTarget && !FILTER_MODES_WITH_DEPTH_WRITE.has(baseLayer.FilterMode || 0)) {
                        continue;
                    }
                    const pipeline = depthTextureTarget ?
                        this.gpuShadowPipeline :
                        (wireframe ? this.gpuWireframePipeline : this.getGPUPipeline(baseLayer));
                    pass.setPipeline(pipeline);

                    const textures = this.rendererData.materialLayerTextureID[materialID];
                    const normalTextres = this.rendererData.materialLayerNormalTextureID[materialID];
                    const ormTextres = this.rendererData.materialLayerOrmTextureID[materialID];
                    const envTextres = this.rendererData.materialLayerReflectionTextureID[materialID];
                    const diffuseTextureID = textures[0];
                    const diffuseTexture = this.model.Textures[diffuseTextureID];
                    const normalTextureID = baseLayer?.ShaderTypeId === 1 ? normalTextres[0] : textures[1];
                    const normalTexture = this.model.Textures[normalTextureID];
                    const ormTextureID = baseLayer?.ShaderTypeId === 1 ? ormTextres[0] : textures[2];
                    const ormTexture = this.model.Textures[ormTextureID];
                    const envTextureID = baseLayer?.ShaderTypeId === 1 ? envTextres[0] : textures[5];
                    const envTexture = this.model.Textures[envTextureID];

                    const envTextureImage = envTexture?.Image;
                    const irradianceMap = this.rendererData.gpuIrradianceMap[envTextureImage];
                    const prefilteredEnv = this.rendererData.gpuPrefilteredEnvMap[envTextureImage];

                    const hasEnv = env && irradianceMap && prefilteredEnv;

                    this.gpuFSUniformsBuffers[materialID] ||= [];
                    let gpuFSUniformsBuffer = this.gpuFSUniformsBuffers[materialID][0];

                    if (!gpuFSUniformsBuffer) {
                        gpuFSUniformsBuffer = this.gpuFSUniformsBuffers[materialID][0] = this.device.createBuffer({
                            label: `fs uniforms ${materialID}`,
                            size: 208,
                            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                        });
                    }

                    const tVetexAnim = this.getTexCoordMatrix(baseLayer);

                    const FSUniformsValues = new ArrayBuffer(208);
                    const FSUniformsViews = {
                        replaceableColor: new Float32Array(FSUniformsValues, 0, 3),
                        discardAlphaLevel: new Float32Array(FSUniformsValues, 12, 1),
                        tVertexAnim: new Float32Array(FSUniformsValues, 16, 12),
                        lightPos: new Float32Array(FSUniformsValues, 64, 3),
                        lightColor: new Float32Array(FSUniformsValues, 80, 3),
                        cameraPos: new Float32Array(FSUniformsValues, 96, 3),
                        shadowParams: new Float32Array(FSUniformsValues, 112, 3),
                        shadowMapLightMatrix: new Float32Array(FSUniformsValues, 128, 16),
                        hasEnv: new Float32Array(FSUniformsValues, 192, 1)
                    };
                    FSUniformsViews.replaceableColor.set(this.rendererData.teamColor);
                    // FSUniformsViews.replaceableType.set([texture.ReplaceableId || 0]);
                    FSUniformsViews.discardAlphaLevel.set([baseLayer.FilterMode === FilterMode.Transparent ? .75 : 0]);
                    FSUniformsViews.tVertexAnim.set(tVetexAnim.slice(0, 3));
                    FSUniformsViews.tVertexAnim.set(tVetexAnim.slice(3, 6), 4);
                    FSUniformsViews.tVertexAnim.set(tVetexAnim.slice(6, 9), 8);
                    FSUniformsViews.lightPos.set(this.rendererData.lightPos);
                    FSUniformsViews.lightColor.set(this.rendererData.lightColor);
                    FSUniformsViews.cameraPos.set(this.rendererData.cameraPos);
                    if (shadowMapTexture && shadowMapMatrix) {
                        FSUniformsViews.shadowParams.set([1, shadowBias ?? 1e-6, shadowSmoothingStep ?? 1 / 1024]);
                        FSUniformsViews.shadowMapLightMatrix.set(shadowMapMatrix);
                    } else {
                        FSUniformsViews.shadowParams.set([0, 0, 0]);
                        FSUniformsViews.shadowMapLightMatrix.set([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                    }
                    FSUniformsViews.hasEnv.set([hasEnv ? 1 : 0]);
                    this.device.queue.writeBuffer(gpuFSUniformsBuffer, 0, FSUniformsValues);

                    const fsBindGroup = this.device.createBindGroup({
                        label: `fs uniforms ${materialID}`,
                        layout: this.fsBindGroupLayout,
                        entries: [
                            {
                                binding: 0,
                                resource: { buffer: gpuFSUniformsBuffer }
                            },
                            {
                                binding: 1,
                                resource: this.rendererData.gpuSamplers[diffuseTextureID]
                            },
                            {
                                binding: 2,
                                resource: (this.rendererData.gpuTextures[diffuseTexture.Image] || this.rendererData.gpuEmptyTexture).createView()
                            },
                            {
                                binding: 3,
                                resource: this.rendererData.gpuSamplers[normalTextureID]
                            },
                            {
                                binding: 4,
                                resource: (this.rendererData.gpuTextures[normalTexture.Image] || this.rendererData.gpuEmptyTexture).createView()
                            },
                            {
                                binding: 5,
                                resource: this.rendererData.gpuSamplers[ormTextureID]
                            },
                            {
                                binding: 6,
                                resource: (this.rendererData.gpuTextures[ormTexture.Image] || this.rendererData.gpuEmptyTexture).createView()
                            },
                            {
                                binding: 7,
                                resource: this.rendererData.gpuDepthSampler
                            },
                            {
                                binding: 8,
                                resource: (shadowMapTexture as GPUTexture || this.rendererData.gpuDepthEmptyTexture).createView()
                            },
                            {
                                binding: 9,
                                resource: this.prefilterEnvSampler
                            },
                            {
                                binding: 10,
                                resource: (irradianceMap as GPUTexture || this.rendererData.gpuEmptyCubeTexture).createView({
                                    dimension: 'cube'
                                })
                            },
                            {
                                binding: 11,
                                resource: this.prefilterEnvSampler
                            },
                            {
                                binding: 12,
                                resource: (prefilteredEnv as GPUTexture || this.rendererData.gpuEmptyCubeTexture).createView({
                                    dimension: 'cube'
                                })
                            },
                            {
                                binding: 13,
                                resource: this.gpuBrdfSampler
                            },
                            {
                                binding: 14,
                                resource: this.gpuBrdfLUT.createView()
                            }
                        ]
                    });

                    pass.setBindGroup(0, this.gpuVSUniformsBindGroup);
                    pass.setBindGroup(1, fsBindGroup);

                    pass.drawIndexed(wireframe ? geoset.Faces.length * 2 : geoset.Faces.length);
                } else {
                    for (let j = 0; j < material.Layers.length; ++j) {
                        const layer = material.Layers[j];
                        const textureID = this.rendererData.materialLayerTextureID[materialID][j];
                        const texture = this.model.Textures[textureID];

                        const pipeline = wireframe ? this.gpuWireframePipeline : this.getGPUPipeline(layer);
                        pass.setPipeline(pipeline);

                        this.gpuFSUniformsBuffers[materialID] ||= [];
                        let gpuFSUniformsBuffer = this.gpuFSUniformsBuffers[materialID][j];

                        let needWriteBuffer = typeof layer.TVertexAnimId === 'number' || !vec3.equals(this.rendererData.teamColor, this.rendererData.lastTeamColor);
                        if (!gpuFSUniformsBuffer) {
                            gpuFSUniformsBuffer = this.gpuFSUniformsBuffers[materialID][j] = this.device.createBuffer({
                                label: `fs uniforms ${materialID} ${j}`,
                                size: 80,
                                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                            });
                            needWriteBuffer = true;
                        }

                        if (needWriteBuffer) {
                            const tVetexAnim = this.getTexCoordMatrix(layer);

                            const FSUniformsValues = new ArrayBuffer(80);
                            const FSUniformsViews = {
                                replaceableColor: new Float32Array(FSUniformsValues, 0, 3),
                                replaceableType: new Uint32Array(FSUniformsValues, 12, 1),
                                discardAlphaLevel: new Float32Array(FSUniformsValues, 16, 1),
                                tVertexAnim: new Float32Array(FSUniformsValues, 32, 12),
                            };
                            FSUniformsViews.replaceableColor.set(this.rendererData.teamColor);
                            FSUniformsViews.replaceableType.set([texture.ReplaceableId || 0]);
                            FSUniformsViews.discardAlphaLevel.set([layer.FilterMode === FilterMode.Transparent ? .75 : 0]);
                            FSUniformsViews.tVertexAnim.set(tVetexAnim.slice(0, 3));
                            FSUniformsViews.tVertexAnim.set(tVetexAnim.slice(3, 6), 4);
                            FSUniformsViews.tVertexAnim.set(tVetexAnim.slice(6, 9), 8);
                            this.device.queue.writeBuffer(gpuFSUniformsBuffer, 0, FSUniformsValues);
                        }

                        const fsBindGroup = this.device.createBindGroup({
                            label: `fs uniforms ${materialID} ${j}`,
                            layout: this.fsBindGroupLayout,
                            entries: [
                                {
                                    binding: 0,
                                    resource: { buffer: gpuFSUniformsBuffer }
                                },
                                {
                                    binding: 1,
                                    resource: this.rendererData.gpuSamplers[textureID]
                                },
                                {
                                    binding: 2,
                                    resource: (this.rendererData.gpuTextures[texture.Image] || this.rendererData.gpuEmptyTexture).createView()
                                }
                            ]
                        });

                        pass.setBindGroup(0, this.gpuVSUniformsBindGroup);
                        pass.setBindGroup(1, fsBindGroup);

                        pass.drawIndexed(wireframe ? geoset.Faces.length * 2 : geoset.Faces.length);
                    }
                }
            }

            this.particlesController.renderGPU(pass, mvMatrix, pMatrix);
            this.ribbonsController.renderGPU(pass, mvMatrix, pMatrix);

            pass.end();

            const commandBuffer = encoder.finish();
            this.device.queue.submit([commandBuffer]);

            vec3.copy(this.rendererData.lastTeamColor, this.rendererData.teamColor);

            return;
        }

        if (env) {
            this.renderEnvironment(mvMatrix, pMatrix);
        }

        this.gl.useProgram(this.shaderProgram);

        this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform, false, pMatrix);
        this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute);
        this.gl.enableVertexAttribArray(this.shaderProgramLocations.normalsAttribute);
        this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);

        if (this.isHD) {
            this.gl.enableVertexAttribArray(this.shaderProgramLocations.skinAttribute);
            this.gl.enableVertexAttribArray(this.shaderProgramLocations.weightAttribute);
            this.gl.enableVertexAttribArray(this.shaderProgramLocations.tangentAttribute);
        } else {
            if (!this.softwareSkinning) {
                this.gl.enableVertexAttribArray(this.shaderProgramLocations.groupAttribute);
            }
        }

        if (!this.softwareSkinning) {
            for (let j = 0; j < MAX_NODES; ++j) {
                if (this.rendererData.nodes[j]) {
                    this.gl.uniformMatrix4fv(this.shaderProgramLocations.nodesMatricesAttributes[j], false,
                        this.rendererData.nodes[j].matrix);
                }
            }
        }


        for (let i = 0; i < this.model.Geosets.length; ++i) {
            const geoset = this.model.Geosets[i];
            if (this.rendererData.geosetAlpha[i] < 1e-6) {
                continue;
            }
            if (geoset.LevelOfDetail !== undefined && geoset.LevelOfDetail !== levelOfDetail) {
                continue;
            }

            if (this.softwareSkinning) {
                this.generateGeosetVertices(i);
            }

            const materialID = geoset.MaterialID;
            const material = this.model.Materials[materialID];

            // Shader_HD_DefaultUnit
            if (this.isHD) {
                this.gl.uniform3fv(this.shaderProgramLocations.lightPosUniform, this.rendererData.lightPos);
                this.gl.uniform3fv(this.shaderProgramLocations.lightColorUniform, this.rendererData.lightColor);
                // this.gl.uniform3fv(this.shaderProgramLocations.lightPosUniform, this.rendererData.cameraPos);
                this.gl.uniform3fv(this.shaderProgramLocations.cameraPosUniform, this.rendererData.cameraPos);

                if (shadowMapTexture && shadowMapMatrix) {
                    this.gl.uniform3f(this.shaderProgramLocations.shadowParamsUniform, 1, shadowBias ?? 1e-6, shadowSmoothingStep ?? 1 / 1024);

                    this.gl.activeTexture(this.gl.TEXTURE3);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, shadowMapTexture);
                    this.gl.uniform1i(this.shaderProgramLocations.shadowMapSamplerUniform, 3);
                    this.gl.uniformMatrix4fv(this.shaderProgramLocations.shadowMapLightMatrixUniform, false, shadowMapMatrix);
                } else {
                    this.gl.uniform3f(this.shaderProgramLocations.shadowParamsUniform, 0, 0, 0);
                }

                const envTextureId = this.model.Version >= 1100 && material.Layers.find(it => it.ShaderTypeId === 1 && typeof it.ReflectionsTextureID === 'number')?.ReflectionsTextureID || material.Layers[5]?.TextureID;
                const envTexture = this.model.Textures[envTextureId as number]?.Image;
                const irradianceMap = this.rendererData.irradianceMap[envTexture];
                const prefilteredEnv = this.rendererData.prefilteredEnvMap[envTexture];
                if (useEnvironmentMap && irradianceMap && prefilteredEnv) {
                    this.gl.uniform1i(this.shaderProgramLocations.hasEnvUniform, 1);
                    this.gl.activeTexture(this.gl.TEXTURE4);
                    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, irradianceMap);
                    this.gl.uniform1i(this.shaderProgramLocations.irradianceMapUniform, 4);
                    this.gl.activeTexture(this.gl.TEXTURE5);
                    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, prefilteredEnv);
                    this.gl.uniform1i(this.shaderProgramLocations.prefilteredEnvUniform, 5);
                    this.gl.activeTexture(this.gl.TEXTURE6);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.brdfLUT);
                    this.gl.uniform1i(this.shaderProgramLocations.brdfLUTUniform, 6);
                } else {
                    this.gl.uniform1i(this.shaderProgramLocations.hasEnvUniform, 0);
                    this.gl.uniform1i(this.shaderProgramLocations.irradianceMapUniform, 4);
                    this.gl.uniform1i(this.shaderProgramLocations.prefilteredEnvUniform, 5);
                    this.gl.uniform1i(this.shaderProgramLocations.brdfLUTUniform, 6);
                }

                this.setLayerPropsHD(materialID, material.Layers);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.normalsAttribute, 3, this.gl.FLOAT, false, 0, 0);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skinWeightBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.skinAttribute, 4, this.gl.UNSIGNED_BYTE, false, 8, 0);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.weightAttribute, 4, this.gl.UNSIGNED_BYTE, true, 8, 4);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tangentBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.tangentAttribute, 4, this.gl.FLOAT, false, 0, 0);

                if (wireframe && !this.wireframeIndexBuffer[i]) {
                    this.createWireframeBuffer(i);
                }

                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, wireframe ? this.wireframeIndexBuffer[i] : this.indexBuffer[i]);
                this.gl.drawElements(
                    wireframe ? this.gl.LINES : this.gl.TRIANGLES,
                    wireframe ? geoset.Faces.length * 2 : geoset.Faces.length,
                    this.gl.UNSIGNED_SHORT,
                    0
                );

                if (shadowMapTexture && shadowMapMatrix) {
                    this.gl.activeTexture(this.gl.TEXTURE3);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
                }
            } else {
                for (let j = 0; j < material.Layers.length; ++j) {
                    this.setLayerProps(material.Layers[j], this.rendererData.materialLayerTextureID[materialID][j]);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                    this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer[i]);
                    this.gl.vertexAttribPointer(this.shaderProgramLocations.normalsAttribute, 3, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
                    this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);

                    if (!this.softwareSkinning) {
                        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.groupBuffer[i]);
                        this.gl.vertexAttribPointer(this.shaderProgramLocations.groupAttribute, 4, this.gl.UNSIGNED_SHORT, false, 0, 0);
                    }

                    if (wireframe && !this.wireframeIndexBuffer[i]) {
                        this.createWireframeBuffer(i);
                    }

                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, wireframe ? this.wireframeIndexBuffer[i] : this.indexBuffer[i]);
                    this.gl.drawElements(
                        wireframe ? this.gl.LINES : this.gl.TRIANGLES,
                        wireframe ? geoset.Faces.length * 2 : geoset.Faces.length,
                        this.gl.UNSIGNED_SHORT,
                        0
                    );
                }
            }
        }

        this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute);
        this.gl.disableVertexAttribArray(this.shaderProgramLocations.normalsAttribute);
        this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);
        if (this.isHD) {
            this.gl.disableVertexAttribArray(this.shaderProgramLocations.skinAttribute);
            this.gl.disableVertexAttribArray(this.shaderProgramLocations.weightAttribute);
            this.gl.disableVertexAttribArray(this.shaderProgramLocations.tangentAttribute);
        } else {
            if (!this.softwareSkinning) {
                this.gl.disableVertexAttribArray(this.shaderProgramLocations.groupAttribute);
            }
        }

        this.particlesController.render(mvMatrix, pMatrix);
        this.ribbonsController.render(mvMatrix, pMatrix);
    }

    private renderEnvironmentGPU (pass: GPURenderPassEncoder, mvMatrix: mat4, pMatrix: mat4) {
        pass.setPipeline(this.envPiepeline);

        const VSUniformsValues = new ArrayBuffer(128);
        const VSUniformsViews = {
            mvMatrix: new Float32Array(VSUniformsValues, 0, 16),
            pMatrix: new Float32Array(VSUniformsValues, 64, 16)
        };
        VSUniformsViews.mvMatrix.set(mvMatrix);
        VSUniformsViews.pMatrix.set(pMatrix);
        this.device.queue.writeBuffer(this.envVSUniformsBuffer, 0, VSUniformsValues);

        pass.setBindGroup(0, this.envVSBindGroup);

        for (const path in this.rendererData.gpuEnvTextures) {
            const fsUniformsBindGroup = this.device.createBindGroup({
                label: `env fs uniforms ${path}`,
                layout: this.envFSBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: this.envSampler
                    },
                    {
                        binding: 1,
                        resource: this.rendererData.gpuEnvTextures[path].createView({ dimension: 'cube' })
                    }
                ]
            });

            pass.setBindGroup(1, fsUniformsBindGroup);

            pass.setPipeline(this.envPiepeline);
            pass.setVertexBuffer(0, this.cubeGPUVertexBuffer);

            pass.draw(6 * 6);
        }
    }

    private renderEnvironment (mvMatrix: mat4, pMatrix: mat4): void {
        if (!isWebGL2(this.gl)) {
            return;
        }

        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE);

        for (const path in this.rendererData.envTextures) {
            this.gl.useProgram(this.envSphere.program);

            this.gl.uniformMatrix4fv(this.envSphere.uniforms.uPMatrix, false, pMatrix);
            this.gl.uniformMatrix4fv(this.envSphere.uniforms.uMVMatrix, false, mvMatrix);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.rendererData.envTextures[path]);
            this.gl.uniform1i(this.envSphere.uniforms.uEnvironmentMap, 0);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
            this.gl.enableVertexAttribArray(this.envSphere.attributes.aPos);
            this.gl.vertexAttribPointer(this.envSphere.attributes.aPos, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * 6);
            this.gl.disableVertexAttribArray(this.envSphere.attributes.aPos);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
        }
    }

    /**
     * @param mvMatrix
     * @param pMatrix
     * @param nodes Nodes to highlight. null means draw all
     */
    public renderSkeleton (mvMatrix: mat4, pMatrix: mat4, nodes: string[] | null): void {
        const coords = [];
        const colors = [];
        const line = (node0: NodeWrapper, node1: NodeWrapper) => {
            vec3.transformMat4(tempPos, node0.node.PivotPoint, node0.matrix);
            coords.push(
                tempPos[0],
                tempPos[1],
                tempPos[2]
            );
            vec3.transformMat4(tempPos, node1.node.PivotPoint, node1.matrix);
            coords.push(
                tempPos[0],
                tempPos[1],
                tempPos[2]
            );

            colors.push(
                0,
                1,
                0,
                0,
                0,
                1,
            );
        };
        const updateNode = (node: NodeWrapper) => {
            if ((node.node.Parent || node.node.Parent === 0) && (!nodes || nodes.includes(node.node.Name))) {
                line(node, this.rendererData.nodes[node.node.Parent]);
            }
            for (const child of node.childs) {
                updateNode(child);
            }
        };
        updateNode(this.rendererData.rootNode);
        if (!coords.length) {
            return;
        }
        const vertexBuffer = new Float32Array(coords);
        const colorBuffer = new Float32Array(colors);

        if (this.device) {
            if (!this.skeletonShaderModule) {
                this.skeletonShaderModule = this.device.createShaderModule({
                    label: 'skeleton',
                    code: skeletonShaderSource
                });
            }

            if (!this.skeletonBindGroupLayout) {
                this.skeletonBindGroupLayout = this.device.createBindGroupLayout({
                    label: 'skeleton bind group layout',
                    entries: [{
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        buffer: {
                            type: 'uniform',
                            hasDynamicOffset: false,
                            minBindingSize: 128
                        }
                    }] as const
                });
            }

            if (!this.skeletonPipelineLayout) {
                this.skeletonPipelineLayout = this.device.createPipelineLayout({
                    label: 'skeleton pipeline layout',
                    bindGroupLayouts: [
                        this.skeletonBindGroupLayout
                    ]
                });
            }

            if (!this.skeletonPipeline) {
                this.skeletonPipeline = this.device.createRenderPipeline({
                    label: 'skeleton pipeline',
                    layout: this.skeletonPipelineLayout,
                    vertex: {
                        module: this.skeletonShaderModule,
                        buffers: [{
                            // vertices
                            arrayStride: 12,
                            attributes: [{
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3' as const
                            }]
                        }, {
                            // colors
                            arrayStride: 12,
                            attributes: [{
                                shaderLocation: 1,
                                offset: 0,
                                format: 'float32x3' as const
                            }]
                        }]
                    },
                    fragment: {
                        module: this.skeletonShaderModule,
                        targets: [{
                            format: navigator.gpu.getPreferredCanvasFormat(),
                            blend: {
                                color: {
                                    operation: 'add',
                                    srcFactor: 'src-alpha',
                                    dstFactor: 'one-minus-src-alpha'
                                },
                                alpha: {
                                    operation: 'add',
                                    srcFactor: 'one',
                                    dstFactor: 'one-minus-src-alpha'
                                }
                            } as const
                        }]
                    },
                    primitive: {
                        topology: 'line-list'
                    }
                });
            }

            this.skeletonGPUVertexBuffer?.destroy();
            this.skeletonGPUColorBuffer?.destroy();
            this.skeletonGPUUniformsBuffer?.destroy();

            const vertex = this.skeletonGPUVertexBuffer = this.device.createBuffer({
                label: 'skeleton vertex',
                size: vertexBuffer.byteLength,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true
            });
            new Float32Array(
                vertex.getMappedRange(0, vertex.size)
            ).set(vertexBuffer);
            vertex.unmap();

            const color = this.skeletonGPUColorBuffer = this.device.createBuffer({
                label: 'skeleton color',
                size: colorBuffer.byteLength,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true
            });
            new Float32Array(
                color.getMappedRange(0, color.size)
            ).set(colorBuffer);
            color.unmap();

            const uniformsBuffer = this.skeletonGPUUniformsBuffer = this.device.createBuffer({
                label: 'skeleton vs uniforms',
                size: 128,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            const uniformsBindGroup = this.device.createBindGroup({
                label: 'skeleton uniforms bind group',
                layout: this.skeletonBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: { buffer: uniformsBuffer }
                    }
                ]
            });

            const renderPassDescriptor: GPURenderPassDescriptor = {
                label: 'skeleton renderPass',
                colorAttachments: [{
                    view: this.gpuContext.getCurrentTexture().createView(),
                    clearValue: [0, 0, 0, 1],
                    loadOp: 'load',
                    storeOp: 'store'
                }] as const
            };

            const encoder = this.device.createCommandEncoder();
            const pass = encoder.beginRenderPass(renderPassDescriptor);

            const VSUniformsValues = new ArrayBuffer(128);
            const VSUniformsViews = {
                mvMatrix: new Float32Array(VSUniformsValues, 0, 16),
                pMatrix: new Float32Array(VSUniformsValues, 64, 16),
            };
            VSUniformsViews.mvMatrix.set(mvMatrix);
            VSUniformsViews.pMatrix.set(pMatrix);
            this.device.queue.writeBuffer(uniformsBuffer, 0, VSUniformsValues);

            pass.setVertexBuffer(0, vertex);
            pass.setVertexBuffer(1, color);
            pass.setPipeline(this.skeletonPipeline);
            pass.setBindGroup(0, uniformsBindGroup);

            pass.draw(vertexBuffer.length / 3);
            pass.end();

            const commandBuffer = encoder.finish();
            this.device.queue.submit([commandBuffer]);

            return;
        }

        if (!this.skeletonShaderProgram) {
            this.skeletonShaderProgram = this.initSkeletonShaderProgram();
        }

        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);

        this.gl.useProgram(this.skeletonShaderProgram);

        this.gl.uniformMatrix4fv(this.skeletonShaderProgramLocations.pMatrixUniform, false, pMatrix);
        this.gl.uniformMatrix4fv(this.skeletonShaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        this.gl.enableVertexAttribArray(this.skeletonShaderProgramLocations.vertexPositionAttribute);
        this.gl.enableVertexAttribArray(this.skeletonShaderProgramLocations.colorAttribute);

        if (!this.skeletonVertexBuffer) {
            this.skeletonVertexBuffer = this.gl.createBuffer();
        }
        if (!this.skeletonColorBuffer) {
            this.skeletonColorBuffer = this.gl.createBuffer();
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skeletonVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexBuffer, this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.skeletonShaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skeletonColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, colorBuffer, this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.skeletonShaderProgramLocations.colorAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.LINES, 0, vertexBuffer.length / 3);

        this.gl.disableVertexAttribArray(this.skeletonShaderProgramLocations.vertexPositionAttribute);
        this.gl.disableVertexAttribArray(this.skeletonShaderProgramLocations.colorAttribute);
    }

    private initSkeletonShaderProgram (): WebGLProgram {
        const vertex = this.skeletonVertexShader = getShader(this.gl, skeletonVertexShader, this.gl.VERTEX_SHADER);
        const fragment = this.skeletonFragmentShader = getShader(this.gl, skeletonFragmentShader, this.gl.FRAGMENT_SHADER);

        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertex);
        this.gl.attachShader(shaderProgram, fragment);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }

        this.gl.useProgram(shaderProgram);

        this.skeletonShaderProgramLocations.vertexPositionAttribute = this.gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.skeletonShaderProgramLocations.colorAttribute = this.gl.getAttribLocation(shaderProgram, 'aColor');
        this.skeletonShaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uPMatrix');
        this.skeletonShaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uMVMatrix');

        return shaderProgram;
    }

    private generateGeosetVertices (geosetIndex: number): void {
        const geoset: Geoset = this.model.Geosets[geosetIndex];
        const buffer = this.vertices[geosetIndex];

        for (let i = 0; i < buffer.length; i += 3) {
            const index = i / 3;
            const group = geoset.Groups[geoset.VertexGroup[index]];

            vec3.set(tempPos, geoset.Vertices[i], geoset.Vertices[i + 1], geoset.Vertices[i + 2]);
            vec3.set(tempSum, 0, 0, 0);
            for (let j = 0; j < group.length; ++j) {
                vec3.add(
                    tempSum, tempSum,
                    vec3.transformMat4(tempVec3, tempPos, this.rendererData.nodes[group[j]].matrix)
                );
            }
            vec3.scale(tempPos, tempSum, 1 / group.length);
            buffer[i]     = tempPos[0];
            buffer[i + 1] = tempPos[1];
            buffer[i + 2] = tempPos[2];
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[geosetIndex]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.DYNAMIC_DRAW);
    }

    private setTextureParameters (flags: TextureFlags | 0, hasMipmaps: boolean) {
        if (flags & TextureFlags.WrapWidth) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        }
        if (flags & TextureFlags.WrapHeight) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        }
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, hasMipmaps ? this.gl.LINEAR_MIPMAP_NEAREST : this.gl.LINEAR);

        if (this.anisotropicExt) {
            const max = this.gl.getParameter(this.anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }
    }

    private processEnvMaps (path: string): void {
        if (
            !this.rendererData.requiredEnvMaps[path] ||
            !(this.rendererData.textures[path] || this.rendererData.gpuTextures[path]) ||
            !(isWebGL2(this.gl) || this.device) ||
            !(this.colorBufferFloatExt || this.device)
        ) {
            return;
        }

        if (this.gl) {
            this.gl.disable(this.gl.BLEND);
            this.gl.disable(this.gl.DEPTH_TEST);
            this.gl.disable(this.gl.CULL_FACE);
        }

        const pMatrix = mat4.create();
        const mvMatrix = mat4.create();
        const eye = vec3.fromValues(0, 0, 0);
        let center;
        let up;
        if (this.device) {
            center = [
                vec3.fromValues(1, 0, 0),
                vec3.fromValues(-1, 0, 0),
                vec3.fromValues(0, -1, 0),
                vec3.fromValues(0, 1, 0),
                vec3.fromValues(0, 0, 1),
                vec3.fromValues(0, 0, -1)
            ];
            up = [
                vec3.fromValues(0, -1, 0),
                vec3.fromValues(0, -1, 0),
                vec3.fromValues(0, 0, -1),
                vec3.fromValues(0, 0, 1),
                vec3.fromValues(0, -1, 0),
                vec3.fromValues(0, -1, 0)
            ];
        } else {
            center = [
                vec3.fromValues(1, 0, 0),
                vec3.fromValues(-1, 0, 0),
                vec3.fromValues(0, 1, 0),
                vec3.fromValues(0, -1, 0),
                vec3.fromValues(0, 0, 1),
                vec3.fromValues(0, 0, -1)
            ];
            up = [
                vec3.fromValues(0, -1, 0),
                vec3.fromValues(0, -1, 0),
                vec3.fromValues(0, 0, 1),
                vec3.fromValues(0, 0, -1),
                vec3.fromValues(0, -1, 0),
                vec3.fromValues(0, -1, 0)
            ];
        }

        mat4.perspective(pMatrix, Math.PI / 2, 1, .1, 10);

        let framebuffer: WebGLFramebuffer;
        let cubemap: WebGLTexture;
        let gpuCubemap: GPUTexture;

        if (this.device) {
            gpuCubemap = this.rendererData.gpuEnvTextures[path] = this.device.createTexture({
                label: `env cubemap ${path}`,
                size: [ENV_MAP_SIZE, ENV_MAP_SIZE, 6],
                format: navigator.gpu.getPreferredCanvasFormat(),
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                mipLevelCount: MAX_ENV_MIP_LEVELS
            });

            const encoder = this.device.createCommandEncoder({
                label: 'env to cubemap'
            });
            const buffers: GPUBuffer[] = [];

            for (let i = 0; i < 6; ++i) {
                mat4.lookAt(mvMatrix, eye, center[i], up[i]);

                const pass = encoder.beginRenderPass({
                    label: 'env to cubemap',
                    colorAttachments: [{
                        view: gpuCubemap.createView({
                            dimension: '2d',
                            baseArrayLayer: i,
                            baseMipLevel: 0,
                            mipLevelCount: 1
                        }),
                        clearValue: [0, 0, 0, 1],
                        loadOp: 'clear',
                        storeOp: 'store'
                    }] as const
                });

                const VSUniformsValues = new ArrayBuffer(128);
                const VSUniformsViews = {
                    mvMatrix: new Float32Array(VSUniformsValues, 0, 16),
                    pMatrix: new Float32Array(VSUniformsValues, 64, 16)
                };
                VSUniformsViews.mvMatrix.set(mvMatrix);
                VSUniformsViews.pMatrix.set(pMatrix);
                const buffer = this.device.createBuffer({
                    label: `env to cubemap vs uniforms ${i}`,
                    size: 128,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                });
                buffers.push(buffer);
                this.device.queue.writeBuffer(buffer, 0, VSUniformsValues);

                const bindGroup = this.device.createBindGroup({
                    label: `env to cubemap vs bind group ${i}`,
                    layout: this.envToCubemapVSBindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: { buffer }
                        }
                    ]
                });

                pass.setBindGroup(0, bindGroup);

                const fsUniformsBindGroup = this.device.createBindGroup({
                    label: `env to cubemap fs uniforms ${i}`,
                    layout: this.envToCubemapFSBindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: this.envToCubemapSampler
                        },
                        {
                            binding: 1,
                            resource: this.rendererData.gpuTextures[path].createView()
                        }
                    ]
                });

                pass.setBindGroup(1, fsUniformsBindGroup);

                pass.setPipeline(this.envToCubemapPiepeline);
                pass.setVertexBuffer(0, this.cubeGPUVertexBuffer);

                pass.draw(6 * 6);

                pass.end();
            }

            const commandBuffer = encoder.finish();
            this.device.queue.submit([commandBuffer]);
            this.device.queue.onSubmittedWorkDone().finally(() => {
                buffers.forEach(buffer => {
                    buffer.destroy();
                });
            });
        } else if (isWebGL2(this.gl)) {
            framebuffer = this.gl.createFramebuffer();

            this.gl.useProgram(this.envToCubemap.program);

            cubemap = this.rendererData.envTextures[path] = this.gl.createTexture();
            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, cubemap);
            for (let i = 0; i < 6; ++i) {
                this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGBA16F, ENV_MAP_SIZE, ENV_MAP_SIZE, 0, this.gl.RGBA, this.gl.FLOAT, null);
            }

            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
            this.gl.enableVertexAttribArray(this.envToCubemap.attributes.aPos);
            this.gl.vertexAttribPointer(this.envToCubemap.attributes.aPos, 3, this.gl.FLOAT, false, 0, 0);

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

            this.gl.uniformMatrix4fv(this.envToCubemap.uniforms.uPMatrix, false, pMatrix);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);
            this.gl.uniform1i(this.envToCubemap.uniforms.uEquirectangularMap, 0);
            this.gl.viewport(0, 0, ENV_MAP_SIZE, ENV_MAP_SIZE);
            for (let i = 0; i < 6; ++i) {
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, cubemap, 0);
                this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

                mat4.lookAt(mvMatrix, eye, center[i], up[i]);
                this.gl.uniformMatrix4fv(this.envToCubemap.uniforms.uMVMatrix, false, mvMatrix);

                this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * 6);
            }

            this.gl.disableVertexAttribArray(this.envToCubemap.attributes.aPos);

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }

        // generate mips
        if (this.device) {
            generateMips(this.device, gpuCubemap);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, cubemap);
            this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);

            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
        }

        // Diffuse env convolution

        if (this.device) {
            gpuCubemap = this.rendererData.gpuIrradianceMap[path] = this.device.createTexture({
                label: `convolute diffuse ${path}`,
                size: [ENV_CONVOLUTE_DIFFUSE_SIZE, ENV_CONVOLUTE_DIFFUSE_SIZE, 6],
                format: navigator.gpu.getPreferredCanvasFormat(),
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                mipLevelCount: 5
            });

            const encoder = this.device.createCommandEncoder({
                label: 'convolute diffuse'
            });
            const buffers: GPUBuffer[] = [];

            for (let i = 0; i < 6; ++i) {
                mat4.lookAt(mvMatrix, eye, center[i], up[i]);

                const pass = encoder.beginRenderPass({
                    label: 'convolute diffuse',
                    colorAttachments: [{
                        view: gpuCubemap.createView({
                            dimension: '2d',
                            baseArrayLayer: i,
                            baseMipLevel: 0,
                            mipLevelCount: 1
                        }),
                        clearValue: [0, 0, 0, 1],
                        loadOp: 'clear',
                        storeOp: 'store'
                    }] as const
                });

                const VSUniformsValues = new ArrayBuffer(128);
                const VSUniformsViews = {
                    mvMatrix: new Float32Array(VSUniformsValues, 0, 16),
                    pMatrix: new Float32Array(VSUniformsValues, 64, 16)
                };
                VSUniformsViews.mvMatrix.set(mvMatrix);
                VSUniformsViews.pMatrix.set(pMatrix);
                const buffer = this.device.createBuffer({
                    label: `convolute diffuse vs uniforms ${i}`,
                    size: 128,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                });
                buffers.push(buffer);
                this.device.queue.writeBuffer(buffer, 0, VSUniformsValues);

                const bindGroup = this.device.createBindGroup({
                    label: `convolute diffuse vs bind group ${i}`,
                    layout: this.convoluteDiffuseEnvVSBindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: { buffer }
                        }
                    ]
                });

                pass.setBindGroup(0, bindGroup);

                const fsUniformsBindGroup = this.device.createBindGroup({
                    label: `convolute diffuse fs uniforms ${i}`,
                    layout: this.convoluteDiffuseEnvFSBindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: this.convoluteDiffuseEnvSampler
                        },
                        {
                            binding: 1,
                            resource: this.rendererData.gpuEnvTextures[path].createView({
                                dimension: 'cube'
                            })
                        }
                    ]
                });

                pass.setBindGroup(1, fsUniformsBindGroup);

                pass.setPipeline(this.convoluteDiffuseEnvPiepeline);
                pass.setVertexBuffer(0, this.cubeGPUVertexBuffer);

                pass.draw(6 * 6);

                pass.end();
            }

            const commandBuffer = encoder.finish();
            this.device.queue.submit([commandBuffer]);
            this.device.queue.onSubmittedWorkDone().finally(() => {
                buffers.forEach(buffer => {
                    buffer.destroy();
                });
            });
        } else if (isWebGL2(this.gl)) {
            this.gl.useProgram(this.convoluteDiffuseEnv.program);
            const diffuseCubemap = this.rendererData.irradianceMap[path] = this.gl.createTexture();

            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, diffuseCubemap);
            for (let i = 0; i < 6; ++i) {
                this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGBA16F, ENV_CONVOLUTE_DIFFUSE_SIZE, ENV_CONVOLUTE_DIFFUSE_SIZE, 0, this.gl.RGBA, this.gl.FLOAT, null);
            }

            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
            this.gl.enableVertexAttribArray(this.convoluteDiffuseEnv.attributes.aPos);
            this.gl.vertexAttribPointer(this.convoluteDiffuseEnv.attributes.aPos, 3, this.gl.FLOAT, false, 0, 0);

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

            this.gl.uniformMatrix4fv(this.convoluteDiffuseEnv.uniforms.uPMatrix, false, pMatrix);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.rendererData.envTextures[path]);
            this.gl.uniform1i(this.convoluteDiffuseEnv.uniforms.uEnvironmentMap, 0);
            this.gl.viewport(0, 0, ENV_CONVOLUTE_DIFFUSE_SIZE, ENV_CONVOLUTE_DIFFUSE_SIZE);
            for (let i = 0; i < 6; ++i) {
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, diffuseCubemap, 0);
                this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

                mat4.lookAt(mvMatrix, eye, center[i], up[i]);
                this.gl.uniformMatrix4fv(this.convoluteDiffuseEnv.uniforms.uMVMatrix, false, mvMatrix);

                this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * 6);
            }

            this.gl.disableVertexAttribArray(this.convoluteDiffuseEnv.attributes.aPos);

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, diffuseCubemap);
            this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
        }

        // Prefilter env map with different roughness

        if (this.device) {
            const prefilterEnv = this.rendererData.gpuPrefilteredEnvMap[path] = this.device.createTexture({
                label: `prefilter env ${path}`,
                size: [ENV_PREFILTER_SIZE, ENV_PREFILTER_SIZE, 6],
                format: navigator.gpu.getPreferredCanvasFormat(),
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                mipLevelCount: MAX_ENV_MIP_LEVELS
            });

            const encoder = this.device.createCommandEncoder({
                label: 'prefilter env'
            });
            const buffers: GPUBuffer[] = [];

            for (let mip = 0; mip < MAX_ENV_MIP_LEVELS; ++mip) {
                const FSUniformsValues = new ArrayBuffer(4);
                const FSUniformsViews = {
                    roughness: new Float32Array(FSUniformsValues),
                };
                const roughness = mip / (MAX_ENV_MIP_LEVELS - 1);
                FSUniformsViews.roughness.set([roughness]);
                const fsBuffer = this.device.createBuffer({
                    label: `prefilter env fs uniforms ${mip}`,
                    size: 4,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                });
                buffers.push(fsBuffer);
                this.device.queue.writeBuffer(fsBuffer, 0, FSUniformsValues);

                const fsUniformsBindGroup = this.device.createBindGroup({
                    label: `prefilter env fs uniforms ${mip}`,
                    layout: this.prefilterEnvFSBindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: {
                                buffer: fsBuffer
                            }
                        },
                        {
                            binding: 1,
                            resource: this.prefilterEnvSampler
                        },
                        {
                            binding: 2,
                            resource: this.rendererData.gpuEnvTextures[path].createView({
                                dimension: 'cube'
                            })
                        }
                    ]
                });

                for (let i = 0; i < 6; ++i) {
                    const pass = encoder.beginRenderPass({
                        label: 'prefilter env',
                        colorAttachments: [{
                            view: prefilterEnv.createView({
                                dimension: '2d',
                                baseArrayLayer: i,
                                baseMipLevel: mip,
                                mipLevelCount: 1
                            }),
                            clearValue: [0, 0, 0, 1],
                            loadOp: 'clear',
                            storeOp: 'store'
                        }] as const
                    });

                    mat4.lookAt(mvMatrix, eye, center[i], up[i]);

                    const VSUniformsValues = new ArrayBuffer(128);
                    const VSUniformsViews = {
                        mvMatrix: new Float32Array(VSUniformsValues, 0, 16),
                        pMatrix: new Float32Array(VSUniformsValues, 64, 16)
                    };
                    VSUniformsViews.mvMatrix.set(mvMatrix);
                    VSUniformsViews.pMatrix.set(pMatrix);
                    const vsBuffer = this.device.createBuffer({
                        label: 'prefilter env vs uniforms',
                        size: 128,
                        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                    });
                    buffers.push(vsBuffer);
                    this.device.queue.writeBuffer(vsBuffer, 0, VSUniformsValues);

                    const fsBindGroup = this.device.createBindGroup({
                        label: 'prefilter env vs bind group',
                        layout: this.prefilterEnvVSBindGroupLayout,
                        entries: [
                            {
                                binding: 0,
                                resource: { buffer: vsBuffer }
                            }
                        ]
                    });

                    pass.setPipeline(this.prefilterEnvPiepeline);

                    pass.setBindGroup(0, fsBindGroup);
                    pass.setBindGroup(1, fsUniformsBindGroup);

                    pass.setVertexBuffer(0, this.cubeGPUVertexBuffer);

                    pass.draw(6 * 6);

                    pass.end();
                }
            }

            const commandBuffer = encoder.finish();
            this.device.queue.submit([commandBuffer]);
            this.device.queue.onSubmittedWorkDone().finally(() => {
                buffers.forEach(buffer => {
                    buffer.destroy();
                });
            });
        } else if (isWebGL2(this.gl)) {
            this.gl.useProgram(this.prefilterEnv.program);

            const prefilterCubemap = this.rendererData.prefilteredEnvMap[path] = this.gl.createTexture();
            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, prefilterCubemap);
            this.gl.texStorage2D(this.gl.TEXTURE_CUBE_MAP, MAX_ENV_MIP_LEVELS, this.gl.RGBA16F, ENV_PREFILTER_SIZE, ENV_PREFILTER_SIZE);
            // for (let i = 0; i < 6; ++i) {
            // this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGB, ENV_PREFILTER_SIZE, ENV_PREFILTER_SIZE, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, null);
            // }
            for (let mip = 0; mip < MAX_ENV_MIP_LEVELS; ++mip) {
                for (let i = 0; i < 6; ++i) {
                    const size = ENV_PREFILTER_SIZE * .5 ** mip;
                    const data = new Float32Array(size * size * 4);
                    this.gl.texSubImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, mip, 0, 0, size, size, this.gl.RGBA, this.gl.FLOAT, data);
                }
            }

            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
            this.gl.enableVertexAttribArray(this.prefilterEnv.attributes.aPos);
            this.gl.vertexAttribPointer(this.prefilterEnv.attributes.aPos, 3, this.gl.FLOAT, false, 0, 0);

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

            this.gl.uniformMatrix4fv(this.prefilterEnv.uniforms.uPMatrix, false, pMatrix);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.rendererData.envTextures[path]);
            this.gl.uniform1i(this.prefilterEnv.uniforms.uEnvironmentMap, 0);

            for (let mip = 0; mip < MAX_ENV_MIP_LEVELS; ++mip) {
                const mipWidth = ENV_PREFILTER_SIZE *.5 ** mip;
                const mipHeight = ENV_PREFILTER_SIZE *.5 ** mip;
                this.gl.viewport(0, 0, mipWidth, mipHeight);

                const roughness = mip / (MAX_ENV_MIP_LEVELS - 1);

                this.gl.uniform1f(this.prefilterEnv.uniforms.uRoughness, roughness);

                for (let i = 0; i < 6; ++i) {
                    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, prefilterCubemap, mip);
                    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

                    mat4.lookAt(mvMatrix, eye, center[i], up[i]);
                    this.gl.uniformMatrix4fv(this.prefilterEnv.uniforms.uMVMatrix, false, mvMatrix);

                    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * 6);
                }
            }

            // cleanup

            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
            this.gl.deleteFramebuffer(framebuffer);
        }
    }

    private initShaderProgram<A extends string, U extends string>(
        vertex: string,
        fragment: string,
        attributesDesc: Record<A, string>,
        uniformsDesc: Record<U, string>
    ): WebGLProgramObject<A, U> {
        const vertexShader = getShader(this.gl, vertex, this.gl.VERTEX_SHADER);
        const fragmentShader = getShader(this.gl, fragment, this.gl.FRAGMENT_SHADER);
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error('Could not initialise shaders');
        }

        const attributes = {} as Record<A, GLuint>;
        for (const name in attributesDesc) {
            attributes[name] = this.gl.getAttribLocation(program, name);
            if (attributes[name] < 0) {
                throw new Error('Missing shader attribute location: ' + name);
            }
        }

        const uniforms = {} as Record<U, WebGLUniformLocation>;
        for (const name in uniformsDesc) {
            uniforms[name] = this.gl.getUniformLocation(program, name);
            if (!uniforms[name]) {
                throw new Error('Missing shader uniform location: ' + name);
            }
        }

        return {
            program,
            vertexShader,
            fragmentShader,
            attributes,
            uniforms
        };
    }

    private destroyShaderProgramObject<A extends string, U extends string>(object: WebGLProgramObject<A, U>): void {
        if (object.program) {
            if (object.vertexShader) {
                this.gl.detachShader(object.program, object.vertexShader);
                this.gl.deleteShader(object.vertexShader);
                object.vertexShader = null;
            }
            if (object.fragmentShader) {
                this.gl.detachShader(object.program, object.fragmentShader);
                this.gl.deleteShader(object.fragmentShader);
                object.fragmentShader = null;
            }
            this.gl.deleteProgram(object.program);
            object.program = null;
        }
    }

    private initShaders (): void {
        if (this.shaderProgram) {
            return;
        }

        let vertexShaderSource;
        if (this.isHD) {
            vertexShaderSource = isWebGL2(this.gl) ? vertexShaderHDHardwareSkinningNew : vertexShaderHDHardwareSkinningOld;
        } else if (this.softwareSkinning) {
            vertexShaderSource = vertexShaderSoftwareSkinning;
        } else {
            vertexShaderSource = vertexShaderHardwareSkinning;
        }

        let fragmentShaderSource;
        if (this.isHD) {
            fragmentShaderSource = isWebGL2(this.gl) ? fragmentShaderHDNew : fragmentShaderHDOld;
        } else {
            fragmentShaderSource = fragmentShader;
        }

        const vertex = this.vertexShader = getShader(this.gl, vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragment = this.fragmentShader = getShader(this.gl, fragmentShaderSource, this.gl.FRAGMENT_SHADER);

        const shaderProgram = this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertex);
        this.gl.attachShader(shaderProgram, fragment);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }

        this.gl.useProgram(shaderProgram);

        this.shaderProgramLocations.vertexPositionAttribute = this.gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.shaderProgramLocations.normalsAttribute = this.gl.getAttribLocation(shaderProgram, 'aNormal');
        this.shaderProgramLocations.textureCoordAttribute = this.gl.getAttribLocation(shaderProgram, 'aTextureCoord');
        if (this.isHD) {
            this.shaderProgramLocations.skinAttribute = this.gl.getAttribLocation(shaderProgram, 'aSkin');
            this.shaderProgramLocations.weightAttribute = this.gl.getAttribLocation(shaderProgram, 'aBoneWeight');
            this.shaderProgramLocations.tangentAttribute = this.gl.getAttribLocation(shaderProgram, 'aTangent');
        } else {
            if (!this.softwareSkinning) {
                this.shaderProgramLocations.groupAttribute = this.gl.getAttribLocation(shaderProgram, 'aGroup');
            }
        }

        this.shaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uPMatrix');
        this.shaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        this.shaderProgramLocations.samplerUniform = this.gl.getUniformLocation(shaderProgram, 'uSampler');
        this.shaderProgramLocations.replaceableColorUniform = this.gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        if (this.isHD) {
            this.shaderProgramLocations.normalSamplerUniform = this.gl.getUniformLocation(shaderProgram, 'uNormalSampler');
            this.shaderProgramLocations.ormSamplerUniform = this.gl.getUniformLocation(shaderProgram, 'uOrmSampler');
            this.shaderProgramLocations.lightPosUniform = this.gl.getUniformLocation(shaderProgram, 'uLightPos');
            this.shaderProgramLocations.lightColorUniform = this.gl.getUniformLocation(shaderProgram, 'uLightColor');
            this.shaderProgramLocations.cameraPosUniform = this.gl.getUniformLocation(shaderProgram, 'uCameraPos');

            this.shaderProgramLocations.shadowParamsUniform = this.gl.getUniformLocation(shaderProgram, 'uShadowParams');
            this.shaderProgramLocations.shadowMapSamplerUniform = this.gl.getUniformLocation(shaderProgram, 'uShadowMapSampler');
            this.shaderProgramLocations.shadowMapLightMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uShadowMapLightMatrix');

            this.shaderProgramLocations.hasEnvUniform = this.gl.getUniformLocation(shaderProgram, 'uHasEnv');
            this.shaderProgramLocations.irradianceMapUniform = this.gl.getUniformLocation(shaderProgram, 'uIrradianceMap');
            this.shaderProgramLocations.prefilteredEnvUniform = this.gl.getUniformLocation(shaderProgram, 'uPrefilteredEnv');
            this.shaderProgramLocations.brdfLUTUniform = this.gl.getUniformLocation(shaderProgram, 'uBRDFLUT');
        } else {
            this.shaderProgramLocations.replaceableTypeUniform = this.gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        }
        this.shaderProgramLocations.discardAlphaLevelUniform = this.gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
        this.shaderProgramLocations.tVertexAnimUniform = this.gl.getUniformLocation(shaderProgram, 'uTVextexAnim');

        if (!this.softwareSkinning) {
            this.shaderProgramLocations.nodesMatricesAttributes = [];
            for (let i = 0; i < MAX_NODES; ++i) {
                this.shaderProgramLocations.nodesMatricesAttributes[i] =
                    this.gl.getUniformLocation(shaderProgram, `uNodesMatrices[${i}]`);
            }
        }

        if (this.isHD && isWebGL2(this.gl)) {
            this.envToCubemap = this.initShaderProgram(envToCubemapVertexShader, envToCubemapFragmentShader, {
                aPos: 'aPos'
            }, {
                uPMatrix: 'uPMatrix',
                uMVMatrix: 'uMVMatrix',
                uEquirectangularMap: 'uEquirectangularMap'
            });

            this.envSphere = this.initShaderProgram(envVertexShader, envFragmentShader, {
                aPos: 'aPos'
            }, {
                uPMatrix: 'uPMatrix',
                uMVMatrix: 'uMVMatrix',
                uEnvironmentMap: 'uEnvironmentMap'
            });

            this.convoluteDiffuseEnv = this.initShaderProgram(convoluteEnvDiffuseVertexShader, convoluteEnvDiffuseFragmentShader, {
                aPos: 'aPos'
            }, {
                uPMatrix: 'uPMatrix',
                uMVMatrix: 'uMVMatrix',
                uEnvironmentMap: 'uEnvironmentMap'
            });

            this.prefilterEnv = this.initShaderProgram(prefilterEnvVertexShader, prefilterEnvFragmentShader, {
                aPos: 'aPos'
            }, {
                uPMatrix: 'uPMatrix',
                uMVMatrix: 'uMVMatrix',
                uEnvironmentMap: 'uEnvironmentMap',
                uRoughness: 'uRoughness'
            });

            this.integrateBRDF = this.initShaderProgram(integrateBRDFVertexShader, integrateBRDFFragmentShader, {
                aPos: 'aPos'
            }, {});
        }
    }

    private initGPUShaders (): void {
        if (this.gpuShaderModule) {
            return;
        }

        this.gpuShaderModule = this.device.createShaderModule({
            label: 'main',
            code: this.isHD ? hdShader : sdShader
        });

        this.gpuDepthShaderModule = this.device.createShaderModule({
            label: 'depth',
            code: depthShader
        });

        for (let i = 0; i < this.model.Textures.length; ++i) {
            const texture = this.model.Textures[i];
            const flags = texture.Flags;
            const addressModeU: GPUAddressMode = flags & TextureFlags.WrapWidth ? 'repeat' : 'clamp-to-edge';
            const addressModeV: GPUAddressMode = flags & TextureFlags.WrapHeight ? 'repeat' : 'clamp-to-edge';
            this.rendererData.gpuSamplers[i] = this.device.createSampler({
                label: `texture sampler ${i}`,
                minFilter: 'linear',
                magFilter: 'linear',
                mipmapFilter: 'linear',
                maxAnisotropy: 16,
                addressModeU,
                addressModeV
            });
        }

        this.rendererData.gpuDepthSampler = this.device.createSampler({
            label: 'texture depth sampler',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            compare: 'less',
            minFilter: 'nearest',
            magFilter: 'nearest'
        });

        if (this.isHD) {
            // Render env runtime
            this.envShaderModeule = this.device.createShaderModule({
                label: 'env',
                code: envShader
            });

            this.envPiepeline = this.device.createRenderPipeline({
                label: 'env',
                layout: 'auto',
                vertex: {
                    module: this.envShaderModeule,
                    buffers: [{
                        arrayStride: 12,
                        attributes: [{
                            shaderLocation: 0,
                            offset: 0,
                            format: 'float32x3' as const
                        }]
                    }]
                },
                fragment: {
                    module: this.envShaderModeule,
                    targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat()
                    }]
                },
                depthStencil: {
                    depthWriteEnabled: false,
                    depthCompare: 'always',
                    format: 'depth24plus'
                },
                multisample: {
                    count: MULTISAMPLE
                }
            });

            this.envVSUniformsBuffer = this.device.createBuffer({
                label: 'env vs uniforms',
                size: 128,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            this.envVSBindGroupLayout = this.envPiepeline.getBindGroupLayout(0);
            this.envVSBindGroup = this.device.createBindGroup({
                label: 'env vs bind group',
                layout: this.envVSBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: { buffer: this.envVSUniformsBuffer }
                    }
                ]
            });

            this.envSampler = this.device.createSampler({
                label: 'env cube sampler',
                addressModeU: 'clamp-to-edge',
                addressModeV: 'clamp-to-edge',
                addressModeW: 'clamp-to-edge',
                minFilter: 'linear',
                magFilter: 'linear'
            });

            this.envFSBindGroupLayout = this.envPiepeline.getBindGroupLayout(1);

            // Convert env equirectangular map to the cube map
            this.envToCubemapShaderModule = this.device.createShaderModule({
                label: 'env to cubemap',
                code: envToCubemapShader
            });

            this.envToCubemapPiepeline = this.device.createRenderPipeline({
                label: 'env to cubemap',
                layout: 'auto',
                vertex: {
                    module: this.envToCubemapShaderModule,
                    buffers: [{
                        arrayStride: 12,
                        attributes: [{
                            shaderLocation: 0,
                            offset: 0,
                            format: 'float32x3' as const
                        }]
                    }]
                },
                fragment: {
                    module: this.envToCubemapShaderModule,
                    targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat()
                    }]
                }
            });

            this.envToCubemapVSBindGroupLayout = this.envToCubemapPiepeline.getBindGroupLayout(0);

            this.envToCubemapSampler = this.device.createSampler({
                label: 'env to cubemap sampler',
                addressModeU: 'clamp-to-edge',
                addressModeV: 'clamp-to-edge',
                minFilter: 'linear',
                magFilter: 'linear'
            });

            this.envToCubemapFSBindGroupLayout = this.envToCubemapPiepeline.getBindGroupLayout(1);

            this.convoluteDiffuseEnvShaderModule = this.device.createShaderModule({
                label: 'convolute diffuse',
                code: convoluteEnvDiffuseShader
            });
            this.convoluteDiffuseEnvPiepeline = this.device.createRenderPipeline({
                label: 'convolute diffuse',
                layout: 'auto',
                vertex: {
                    module: this.convoluteDiffuseEnvShaderModule,
                    buffers: [{
                        arrayStride: 12,
                        attributes: [{
                            shaderLocation: 0,
                            offset: 0,
                            format: 'float32x3' as const
                        }]
                    }]
                },
                fragment: {
                    module: this.convoluteDiffuseEnvShaderModule,
                    targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat()
                    }]
                }
            });
            this.convoluteDiffuseEnvVSBindGroupLayout = this.convoluteDiffuseEnvPiepeline.getBindGroupLayout(0);
            this.convoluteDiffuseEnvFSBindGroupLayout = this.convoluteDiffuseEnvPiepeline.getBindGroupLayout(1);
            this.convoluteDiffuseEnvSampler = this.device.createSampler({
                label: 'convolute diffuse',
                addressModeU: 'clamp-to-edge',
                addressModeV: 'clamp-to-edge',
                minFilter: 'linear',
                magFilter: 'linear'
            });


            this.prefilterEnvShaderModule = this.device.createShaderModule({
                label: 'prefilter env',
                code: prefilterEnvShader
            });
            this.prefilterEnvPiepeline = this.device.createRenderPipeline({
                label: 'prefilter env',
                layout: 'auto',
                vertex: {
                    module: this.prefilterEnvShaderModule,
                    buffers: [{
                        arrayStride: 12,
                        attributes: [{
                            shaderLocation: 0,
                            offset: 0,
                            format: 'float32x3' as const
                        }]
                    }]
                },
                fragment: {
                    module: this.prefilterEnvShaderModule,
                    targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat()
                    }]
                }
            });
            this.prefilterEnvVSBindGroupLayout = this.prefilterEnvPiepeline.getBindGroupLayout(0);
            this.prefilterEnvFSBindGroupLayout = this.prefilterEnvPiepeline.getBindGroupLayout(1);
            this.prefilterEnvSampler = this.device.createSampler({
                label: 'prefilter env',
                addressModeU: 'clamp-to-edge',
                addressModeV: 'clamp-to-edge',
                addressModeW: 'clamp-to-edge',
                minFilter: 'linear',
                magFilter: 'linear'
            });
        }
    }

    private createWireframeBuffer (index: number): void {
        const faces = this.model.Geosets[index].Faces;
        const lines = new Uint16Array(faces.length * 2);

        for (let i = 0; i < faces.length; i += 3) {
            lines[i * 2]     = faces[i];
            lines[i * 2 + 1] = faces[i + 1];
            lines[i * 2 + 2] = faces[i + 1];
            lines[i * 2 + 3] = faces[i + 2];
            lines[i * 2 + 4] = faces[i + 2];
            lines[i * 2 + 5] = faces[i];
        }

        this.wireframeIndexBuffer[index] = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.wireframeIndexBuffer[index]);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, lines, this.gl.STATIC_DRAW);
    }

    private createWireframeGPUBuffer (index: number): void {
        const faces = this.model.Geosets[index].Faces;
        const lines = new Uint16Array(faces.length * 2);

        for (let i = 0; i < faces.length; i += 3) {
            lines[i * 2]     = faces[i];
            lines[i * 2 + 1] = faces[i + 1];
            lines[i * 2 + 2] = faces[i + 1];
            lines[i * 2 + 3] = faces[i + 2];
            lines[i * 2 + 4] = faces[i + 2];
            lines[i * 2 + 5] = faces[i];
        }

        this.wireframeIndexGPUBuffer[index] = this.device.createBuffer({
            label: `wireframe ${index}`,
            size: lines.byteLength,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true
        });
        new Uint16Array(
            this.wireframeIndexGPUBuffer[index].getMappedRange(0, this.wireframeIndexGPUBuffer[index].size)
        ).set(lines);
        this.wireframeIndexGPUBuffer[index].unmap();
    }

    private initBuffers (): void {
        for (let i = 0; i < this.model.Geosets.length; ++i) {
            const geoset = this.model.Geosets[i];

            this.vertexBuffer[i] = this.gl.createBuffer();
            if (this.softwareSkinning) {
                this.vertices[i] = new Float32Array(geoset.Vertices.length);
            } else {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, geoset.Vertices, this.gl.STATIC_DRAW);
            }

            this.normalBuffer[i] = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer[i]);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, geoset.Normals, this.gl.STATIC_DRAW);

            this.texCoordBuffer[i] = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, geoset.TVertices[0], this.gl.STATIC_DRAW);

            if (this.isHD) {
                this.skinWeightBuffer[i] = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skinWeightBuffer[i]);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, geoset.SkinWeights, this.gl.STATIC_DRAW);

                this.tangentBuffer[i] = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tangentBuffer[i]);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, geoset.Tangents, this.gl.STATIC_DRAW);
            } else {
                if (!this.softwareSkinning) {
                    this.groupBuffer[i] = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.groupBuffer[i]);
                    const buffer = new Uint16Array(geoset.VertexGroup.length * 4);
                    for (let j = 0; j < buffer.length; j += 4) {
                        const index = j / 4;
                        const group = geoset.Groups[geoset.VertexGroup[index]];
                        buffer[j] = group[0];
                        buffer[j + 1] = group.length > 1 ? group[1] : MAX_NODES;
                        buffer[j + 2] = group.length > 2 ? group[2] : MAX_NODES;
                        buffer[j + 3] = group.length > 3 ? group[3] : MAX_NODES;
                    }
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.STATIC_DRAW);
                }
            }

            this.indexBuffer[i] = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, geoset.Faces, this.gl.STATIC_DRAW);
        }
    }

    private createGPUPipeline (
        name: string,
        blend: GPUBlendState | undefined,
        depth: GPUDepthStencilState,
        shaderModule: GPUShaderModule = this.gpuShaderModule,
        extra: Partial<GPURenderPipelineDescriptor> = {}
    ) : GPURenderPipeline {
        return this.device.createRenderPipeline({
            label: `pipeline ${name}`,
            layout: this.gpuPipelineLayout,
            vertex: {
                module: shaderModule,
                buffers: [{
                    // vertices
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x3' as const
                    }]
                }, {
                    // normals
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 1,
                        offset: 0,
                        format: 'float32x3' as const
                    }]
                }, {
                    // textureCoord
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 2,
                        offset: 0,
                        format: 'float32x2' as const
                    }]
                }, ...(this.isHD ? [{
                    // tangents
                    arrayStride: 16,
                    attributes: [{
                        shaderLocation: 3,
                        offset: 0,
                        format: 'float32x4' as const
                    }]
                }, {
                    // skin
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 4,
                        offset: 0,
                        format: 'uint8x4' as const
                    }]
                }, {
                    // boneWeight
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 5,
                        offset: 4,
                        format: 'unorm8x4' as const
                    }]
                }] : [{
                    // group
                    arrayStride: 4,
                    attributes: [{
                        shaderLocation: 3,
                        offset: 0,
                        format: 'uint8x4' as const
                    }]
                }])]
            },
            fragment: {
                module: shaderModule,
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend
                }]
            },
            depthStencil: depth,
            multisample: {
                count: MULTISAMPLE
            },
            ...extra
        });
    }

    private createGPUPipelineByLayer (filterMode: FilterMode, twoSided: boolean) : GPURenderPipeline {
        return this.createGPUPipeline(...GPU_LAYER_PROPS[filterMode], undefined, {
            primitive: {
                cullMode: twoSided ? 'none' : 'back'
            }
        });
    }

    private getGPUPipeline (layer: Layer): GPURenderPipeline {
        const filterMode = layer.FilterMode || 0;
        const twoSided = Boolean((layer.Shading || 0) & LayerShading.TwoSided);

        const key = `${filterMode}-${twoSided}`;

        if (!this.gpuPipelines[key]) {
            this.gpuPipelines[key] = this.createGPUPipelineByLayer(filterMode, twoSided);
        }

        return this.gpuPipelines[key];
    }

    private initGPUPipeline (): void {
        this.vsBindGroupLayout = this.device.createBindGroupLayout({
            label: 'vs bind group layout',
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: 'uniform',
                    hasDynamicOffset: false,
                    minBindingSize: 128 + 64 * MAX_NODES
                }
            }] as const
        });
        this.fsBindGroupLayout = this.device.createBindGroupLayout({
            label: 'fs bind group layout2',
            entries: this.isHD ? [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                        hasDynamicOffset: false,
                        minBindingSize: 208
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'filtering'
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float',
                        viewDimension: '2d',
                        multisampled: false
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'filtering'
                    }
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float',
                        viewDimension: '2d',
                        multisampled: false
                    }
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'filtering'
                    }
                },
                {
                    binding: 6,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float',
                        viewDimension: '2d',
                        multisampled: false
                    }
                },
                {
                    binding: 7,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'comparison'
                    }
                },
                {
                    binding: 8,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'depth',
                        viewDimension: '2d',
                        multisampled: false
                    }
                },
                {
                    binding: 9,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'filtering'
                    }
                },
                {
                    binding: 10,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float',
                        viewDimension: 'cube',
                        multisampled: false
                    }
                },
                {
                    binding: 11,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'filtering'
                    }
                },
                {
                    binding: 12,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float',
                        viewDimension: 'cube',
                        multisampled: false
                    }
                },
                {
                    binding: 13,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'filtering'
                    }
                },
                {
                    binding: 14,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float',
                        viewDimension: '2d',
                        multisampled: false
                    }
                }
            ] as const : [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                        hasDynamicOffset: false,
                        minBindingSize: 80
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'filtering'
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float',
                        viewDimension: '2d',
                        multisampled: false
                    }
                }
            ] as const
        });

        this.gpuPipelineLayout = this.device.createPipelineLayout({
            label: 'pipeline layout',
            bindGroupLayouts: [
                this.vsBindGroupLayout,
                this.fsBindGroupLayout
            ]
        });

        this.gpuWireframePipeline = this.createGPUPipeline('wireframe', {
            color: {
                operation: 'add',
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha'
            },
            alpha: {
                operation: 'add',
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha'
            }
        }, {
            depthWriteEnabled: true,
            depthCompare: 'less-equal',
            format: 'depth24plus'
        }, undefined, {
            primitive: {
                topology: 'line-list'
            }
        });

        if (this.isHD) {
            this.gpuShadowPipeline = this.createGPUPipeline('shadow', undefined, {
                depthWriteEnabled: true,
                depthCompare: 'less-equal',
                format: 'depth32float'
            }, this.gpuDepthShaderModule, {
                fragment: {
                    module: this.gpuDepthShaderModule,
                    targets: []
                },
                multisample: {
                    count: 1
                }
            });
        }

        this.gpuRenderPassDescriptor = {
            label: 'basic renderPass',
            colorAttachments: [
                {
                    view: null,
                    clearValue: [0, 0, 0, 1],
                    loadOp: 'clear' as const,
                    storeOp: 'store' as const
                }
            ]
        };
    }

    private initGPUBuffers (): void {
        for (let i = 0; i < this.model.Geosets.length; ++i) {
            const geoset = this.model.Geosets[i];

            this.gpuVertexBuffer[i] = this.device.createBuffer({
                label: `vertex ${i}`,
                size: geoset.Vertices.byteLength,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true
            });
            new Float32Array(
                this.gpuVertexBuffer[i].getMappedRange(0, this.gpuVertexBuffer[i].size)
            ).set(geoset.Vertices);
            this.gpuVertexBuffer[i].unmap();

            this.gpuNormalBuffer[i] = this.device.createBuffer({
                label: `normal ${i}`,
                size: geoset.Normals.byteLength,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true
            });
            new Float32Array(
                this.gpuNormalBuffer[i].getMappedRange(0, this.gpuNormalBuffer[i].size)
            ).set(geoset.Normals);
            this.gpuNormalBuffer[i].unmap();

            this.gpuTexCoordBuffer[i] = this.device.createBuffer({
                label: `texCoord ${i}`,
                size: geoset.TVertices[0].byteLength,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true
            });
            new Float32Array(
                this.gpuTexCoordBuffer[i].getMappedRange(0, this.gpuTexCoordBuffer[i].size)
            ).set(geoset.TVertices[0]);
            this.gpuTexCoordBuffer[i].unmap();

            if (this.isHD) {
                this.gpuSkinWeightBuffer[i] = this.device.createBuffer({
                    label: `SkinWeight ${i}`,
                    size: geoset.SkinWeights.byteLength,
                    usage: GPUBufferUsage.VERTEX,
                    mappedAtCreation: true
                });
                new Uint8Array(
                    this.gpuSkinWeightBuffer[i].getMappedRange(0, this.gpuSkinWeightBuffer[i].size)
                ).set(geoset.SkinWeights);
                this.gpuSkinWeightBuffer[i].unmap();

                this.gpuTangentBuffer[i] = this.device.createBuffer({
                    label: `Tangents ${i}`,
                    size: geoset.Tangents.byteLength,
                    usage: GPUBufferUsage.VERTEX,
                    mappedAtCreation: true
                });
                new Float32Array(
                    this.gpuTangentBuffer[i].getMappedRange(0, this.gpuTangentBuffer[i].size)
                ).set(geoset.Tangents);
                this.gpuTangentBuffer[i].unmap();
            } else {
                const buffer = new Uint8Array(geoset.VertexGroup.length * 4);
                for (let j = 0; j < buffer.length; j += 4) {
                    const index = j / 4;
                    const group = geoset.Groups[geoset.VertexGroup[index]];
                    buffer[j] = group[0];
                    buffer[j + 1] = group.length > 1 ? group[1] : MAX_NODES;
                    buffer[j + 2] = group.length > 2 ? group[2] : MAX_NODES;
                    buffer[j + 3] = group.length > 3 ? group[3] : MAX_NODES;
                }
                this.gpuGroupBuffer[i] = this.device.createBuffer({
                    label: `group ${i}`,
                    size: 4 * geoset.VertexGroup.length,
                    usage: GPUBufferUsage.VERTEX,
                    mappedAtCreation: true
                });
                new Uint8Array(
                    this.gpuGroupBuffer[i].getMappedRange(0, this.gpuGroupBuffer[i].size)
                ).set(buffer);
                this.gpuGroupBuffer[i].unmap();
            }

            const size = Math.ceil(geoset.Faces.byteLength / 4) * 4;
            this.gpuIndexBuffer[i] = this.device.createBuffer({
                label: `index ${i}`,
                size: 2 * size,
                usage: GPUBufferUsage.INDEX,
                mappedAtCreation: true
            });
            new Uint16Array(
                this.gpuIndexBuffer[i].getMappedRange(0, size)
            ).set(geoset.Faces);
            this.gpuIndexBuffer[i].unmap();
        }
    }

    private initGPUUniformBuffers (): void {
        this.gpuVSUniformsBuffer = this.device.createBuffer({
            label: 'vs uniforms',
            size: 128 + 64 * MAX_NODES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.gpuVSUniformsBindGroup = this.device.createBindGroup({
            label: 'vs uniforms bind group',
            layout: this.vsBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.gpuVSUniformsBuffer }
                }
            ]
        });
    }

    private initGPUMultisampleTexture (): void {
        this.gpuMultisampleTexture = this.device.createTexture({
            label: 'multisample texutre',
            size: [this.canvas.width, this.canvas.height],
            format: navigator.gpu.getPreferredCanvasFormat(),
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            sampleCount: MULTISAMPLE
        });
    }

    private initGPUDepthTexture (): void {
        this.gpuDepthTexture = this.device.createTexture({
            label: 'depth texture',
            size: [this.canvas.width, this.canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            sampleCount: MULTISAMPLE
        });
    }

    private initGPUEmptyTexture (): void {
        const texture = this.rendererData.gpuEmptyTexture = this.device.createTexture({
            label: 'empty texture',
            size: [1, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        this.device.queue.writeTexture(
            { texture },
            new Uint8Array([255, 255, 255, 255]),
            { bytesPerRow: 1 * 4 },
            { width: 1, height: 1 },
        );

        this.rendererData.gpuEmptyCubeTexture = this.device.createTexture({
            label: 'empty cube texture',
            size: [1, 1, 6],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        this.rendererData.gpuDepthEmptyTexture = this.device.createTexture({
            label: 'empty depth texture',
            size: [1, 1],
            format: 'depth32float',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
    }

    private initCube (): void {
        const data = new Float32Array([
            -0.5, -0.5,  -0.5,
            -0.5,  0.5,  -0.5,
            0.5, -0.5,  -0.5,
            -0.5,  0.5,  -0.5,
            0.5,  0.5,  -0.5,
            0.5, -0.5,  -0.5,

            -0.5, -0.5,   0.5,
            0.5, -0.5,   0.5,
            -0.5,  0.5,   0.5,
            -0.5,  0.5,   0.5,
            0.5, -0.5,   0.5,
            0.5,  0.5,   0.5,

            -0.5,   0.5, -0.5,
            -0.5,   0.5,  0.5,
            0.5,   0.5, -0.5,
            -0.5,   0.5,  0.5,
            0.5,   0.5,  0.5,
            0.5,   0.5, -0.5,

            -0.5,  -0.5, -0.5,
            0.5,  -0.5, -0.5,
            -0.5,  -0.5,  0.5,
            -0.5,  -0.5,  0.5,
            0.5,  -0.5, -0.5,
            0.5,  -0.5,  0.5,

            -0.5,  -0.5, -0.5,
            -0.5,  -0.5,  0.5,
            -0.5,   0.5, -0.5,
            -0.5,  -0.5,  0.5,
            -0.5,   0.5,  0.5,
            -0.5,   0.5, -0.5,

            0.5,  -0.5, -0.5,
            0.5,   0.5, -0.5,
            0.5,  -0.5,  0.5,
            0.5,  -0.5,  0.5,
            0.5,   0.5, -0.5,
            0.5,   0.5,  0.5,
        ]);

        if (this.device) {
            const vertex = this.cubeGPUVertexBuffer = this.device.createBuffer({
                label: 'skeleton vertex',
                size: data.byteLength,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true
            });
            new Float32Array(
                vertex.getMappedRange(0, vertex.size)
            ).set(data);
            vertex.unmap();
        } else {
            this.cubeVertexBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        }
    }

    private initSquare (): void {
        this.squareVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0,
            -1.0, 1.0,
        ]), this.gl.STATIC_DRAW);
    }

    private initBRDFLUT (): void {
        if (!isWebGL2(this.gl) || !this.isHD || !this.colorBufferFloatExt) {
            return;
        }

        this.brdfLUT = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.brdfLUT);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RG16F, BRDF_LUT_SIZE, BRDF_LUT_SIZE, 0, this.gl.RG, this.gl.FLOAT, null);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        const framebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.brdfLUT, 0);

        this.gl.useProgram(this.integrateBRDF.program);

        this.gl.viewport(0, 0, BRDF_LUT_SIZE, BRDF_LUT_SIZE);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.enableVertexAttribArray(this.integrateBRDF.attributes.aPos);
        this.gl.vertexAttribPointer(this.integrateBRDF.attributes.aPos, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.gl.deleteFramebuffer(framebuffer);
    }

    private initGPUBRDFLUT (): void {
        const shaderModule = this.device.createShaderModule({
            label: 'integrate brdf',
            code: integrateBRDFFShader
        });

        this.gpuBrdfLUT = this.device.createTexture({
            label: 'brdf',
            size: [BRDF_LUT_SIZE, BRDF_LUT_SIZE],
            format: 'rg16float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        const square = new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0,
            -1.0, 1.0,
        ]);
        const buffer = this.device.createBuffer({
            label: 'brdf square',
            size:  square.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(
            buffer.getMappedRange(0, buffer.size)
        ).set(square);
        buffer.unmap();

        const encoder = this.device.createCommandEncoder({
            label: 'integrate brdf'
        });

        const pass = encoder.beginRenderPass({
            label: 'integrate brdf',
            colorAttachments: [{
                view: this.gpuBrdfLUT.createView(),
                clearValue: [0, 0, 0, 1],
                loadOp: 'clear',
                storeOp: 'store'
            }] as const
        });

        pass.setPipeline(this.device.createRenderPipeline({
            label: 'integrate brdf',
            layout: 'auto',
            vertex: {
                module: shaderModule,
                buffers: [{
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x2' as const
                    }]
                }]
            },
            fragment: {
                module: shaderModule,
                targets: [{
                    format: 'rg16float'
                }] as const
            }
        }));

        pass.setVertexBuffer(0, buffer);
        pass.draw(6);
        pass.end();

        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);
        this.device.queue.onSubmittedWorkDone().finally(() => {
            buffer.destroy();
        });

        this.gpuBrdfSampler = this.device.createSampler({
            label: 'brdf lut',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            minFilter: 'linear',
            magFilter: 'linear'
        });
    }

    /*private resetGlobalSequences (): void {
        for (let i = 0; i < this.rendererData.globalSequencesFrames.length; ++i) {
            this.rendererData.globalSequencesFrames[i] = 0;
        }
    }*/

    private updateGlobalSequences (delta: number): void {
        for (let i = 0; i < this.rendererData.globalSequencesFrames.length; ++i) {
            this.rendererData.globalSequencesFrames[i] += delta;
            if (this.rendererData.globalSequencesFrames[i] > this.model.GlobalSequences[i]) {
                this.rendererData.globalSequencesFrames[i] = 0;
            }
        }
    }

    private updateNode (node: NodeWrapper): void {
        const translationRes = this.interp.vec3(translation, node.node.Translation);
        const rotationRes = this.interp.quat(rotation, node.node.Rotation);
        const scalingRes = this.interp.vec3(scaling, node.node.Scaling);

        if (!translationRes && !rotationRes && !scalingRes) {
            mat4.identity(node.matrix);
        } else if (translationRes && !rotationRes && !scalingRes) {
            mat4.fromTranslation(node.matrix, translationRes);
        } else if (!translationRes && rotationRes && !scalingRes) {
            mat4fromRotationOrigin(node.matrix, rotationRes, node.node.PivotPoint as vec3);
        } else {
            mat4.fromRotationTranslationScaleOrigin(node.matrix,
                rotationRes || defaultRotation,
                translationRes || defaultTranslation,
                scalingRes || defaultScaling,
                node.node.PivotPoint as vec3
            );
        }

        if (node.node.Parent || node.node.Parent === 0) {
            mat4.mul(node.matrix, this.rendererData.nodes[node.node.Parent].matrix, node.matrix);
        }

        const billboardedLock = node.node.Flags & NodeFlags.BillboardedLockX ||
            node.node.Flags & NodeFlags.BillboardedLockY ||
            node.node.Flags & NodeFlags.BillboardedLockZ;

        if (node.node.Flags & NodeFlags.Billboarded) {
            vec3.transformMat4(tempTransformedPivotPoint, node.node.PivotPoint as vec3, node.matrix);

            if (node.node.Parent || node.node.Parent === 0) {
                // cancel parent rotation from PivotPoint
                mat4.getRotation(tempParentRotationQuat, this.rendererData.nodes[node.node.Parent].matrix);
                quat.invert(tempParentRotationQuat, tempParentRotationQuat);
                mat4fromRotationOrigin(tempParentRotationMat, tempParentRotationQuat,
                    tempTransformedPivotPoint);
                mat4.mul(node.matrix, tempParentRotationMat, node.matrix);
            }

            // rotate to camera
            mat4fromRotationOrigin(tempCameraMat, this.rendererData.cameraQuat,
                tempTransformedPivotPoint);
            mat4.mul(node.matrix, tempCameraMat, node.matrix);
        } else if (billboardedLock) {
            vec3.transformMat4(tempTransformedPivotPoint, node.node.PivotPoint as vec3, node.matrix);
            vec3.copy(tempAxis, node.node.PivotPoint as vec3);

            // todo BillboardedLockX ?
            if (node.node.Flags & NodeFlags.BillboardedLockX) {
                tempAxis[0] += 1;
            } else if (node.node.Flags & NodeFlags.BillboardedLockY) {
                tempAxis[1] += 1;
            } else if (node.node.Flags & NodeFlags.BillboardedLockZ) {
                tempAxis[2] += 1;
            }

            vec3.transformMat4(tempAxis, tempAxis, node.matrix);
            vec3.sub(tempAxis, tempAxis, tempTransformedPivotPoint);

            vec3.set(tempXAxis, 1, 0, 0);
            vec3.add(tempXAxis, tempXAxis, node.node.PivotPoint as vec3);
            vec3.transformMat4(tempXAxis, tempXAxis, node.matrix);
            vec3.sub(tempXAxis, tempXAxis, tempTransformedPivotPoint);

            vec3.set(tempCameraVec, -1, 0, 0);
            vec3.transformQuat(tempCameraVec, tempCameraVec, this.rendererData.cameraQuat);

            vec3.cross(tempCross0, tempAxis, tempCameraVec);
            vec3.cross(tempCross1, tempAxis, tempCross0);

            vec3.normalize(tempCross1, tempCross1);

            quat.rotationTo(tempLockQuat, tempXAxis, tempCross1);
            mat4fromRotationOrigin(tempLockMat, tempLockQuat, tempTransformedPivotPoint);
            mat4.mul(node.matrix, tempLockMat, node.matrix);
        }

        for (const child of node.childs) {
            this.updateNode(child);
        }
    }

    private findAlpha (geosetId: number): number {
        const geosetAnim = this.rendererData.geosetAnims[geosetId];

        if (!geosetAnim || geosetAnim.Alpha === undefined) {
            return 1;
        }

        if (typeof geosetAnim.Alpha === 'number') {
            return geosetAnim.Alpha;
        }

        const interpRes = this.interp.num(geosetAnim.Alpha);

        if (interpRes === null) {
            return 1;
        }
        return interpRes;
    }

    private getTexCoordMatrix (layer: Layer): mat3 {
        if (typeof layer.TVertexAnimId === 'number') {
            const anim: TVertexAnim = this.rendererData.model.TextureAnims[layer.TVertexAnimId];
            const translationRes = this.interp.vec3(translation, anim.Translation);
            const rotationRes = this.interp.quat(rotation, anim.Rotation);
            const scalingRes = this.interp.vec3(scaling, anim.Scaling);
            mat4.fromRotationTranslationScale(
                texCoordMat4,
                rotationRes || defaultRotation,
                translationRes || defaultTranslation,
                scalingRes || defaultScaling
            );
            mat3.set(
                texCoordMat3,
                texCoordMat4[0], texCoordMat4[1], 0,
                texCoordMat4[4], texCoordMat4[5], 0,
                texCoordMat4[12], texCoordMat4[13], 0
            );

            return texCoordMat3;
        } else {
            return identifyMat3;
        }
    }

    private setLayerProps (layer: Layer, textureID: number): void {
        const texture = this.model.Textures[textureID];

        if (layer.Shading & LayerShading.TwoSided) {
            this.gl.disable(this.gl.CULL_FACE);
        } else {
            this.gl.enable(this.gl.CULL_FACE);
        }

        if (layer.FilterMode === FilterMode.Transparent) {
            this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, 0.75);
        } else {
            this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, 0.);
        }

        if (layer.FilterMode === FilterMode.None) {
            this.gl.disable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            // this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(true);
        } else if (layer.FilterMode === FilterMode.Transparent) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(true);
        } else if (layer.FilterMode === FilterMode.Blend) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.Additive) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFunc(this.gl.SRC_COLOR, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.AddAlpha) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.Modulate) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.ZERO, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.Modulate2x) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.DST_COLOR, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.ONE);
            this.gl.depthMask(false);
        }

        if (texture.Image) {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[texture.Image]);
            this.gl.uniform1i(this.shaderProgramLocations.samplerUniform, 0);
            this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform, 0);
        } else if (texture.ReplaceableId === 1 || texture.ReplaceableId === 2) {
            this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform, this.rendererData.teamColor);
            this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform, texture.ReplaceableId);
        }

        if (layer.Shading & LayerShading.NoDepthTest) {
            this.gl.disable(this.gl.DEPTH_TEST);
        }
        if (layer.Shading & LayerShading.NoDepthSet) {
            this.gl.depthMask(false);
        }

        this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform, false, this.getTexCoordMatrix(layer));
    }

    private setLayerPropsHD (materialID: number, layers: Layer[]): void {
        const baseLayer = layers[0];
        const textures = this.rendererData.materialLayerTextureID[materialID];
        const normalTextres = this.rendererData.materialLayerNormalTextureID[materialID];
        const ormTextres = this.rendererData.materialLayerOrmTextureID[materialID];
        const diffuseTextureID = textures[0];
        const diffuseTexture = this.model.Textures[diffuseTextureID];
        const normalTextureID = baseLayer?.ShaderTypeId === 1 ? normalTextres[0] : textures[1];
        const normalTexture = this.model.Textures[normalTextureID];
        const ormTextureID = baseLayer?.ShaderTypeId === 1 ? ormTextres[0] : textures[2];
        const ormTexture = this.model.Textures[ormTextureID];
        // const emissiveTextureID = textures[3];
        // const emissiveTexture = this.model.Textures[emissiveTextureID];
        // const teamColorTextureID = textures[4];
        // const teamColorTexture = this.model.Textures[teamColorTextureID];
        // const envTextureID = textures[5];
        // const envTexture = this.model.Textures[envTextureID];

        if (baseLayer.Shading & LayerShading.TwoSided) {
            this.gl.disable(this.gl.CULL_FACE);
        } else {
            this.gl.enable(this.gl.CULL_FACE);
        }

        if (baseLayer.FilterMode === FilterMode.Transparent) {
            this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, 0.75);
        } else {
            this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, 0.);
        }

        if (baseLayer.FilterMode === FilterMode.None) {
            this.gl.disable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            // this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(true);
        } else if (baseLayer.FilterMode === FilterMode.Transparent) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(true);
        } else if (baseLayer.FilterMode === FilterMode.Blend) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(false);
        } else if (baseLayer.FilterMode === FilterMode.Additive) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFunc(this.gl.SRC_COLOR, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (baseLayer.FilterMode === FilterMode.AddAlpha) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (baseLayer.FilterMode === FilterMode.Modulate) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.ZERO, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (baseLayer.FilterMode === FilterMode.Modulate2x) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.DST_COLOR, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.ONE);
            this.gl.depthMask(false);
        }

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[diffuseTexture.Image]);
        this.gl.uniform1i(this.shaderProgramLocations.samplerUniform, 0);

        if (baseLayer.Shading & LayerShading.NoDepthTest) {
            this.gl.disable(this.gl.DEPTH_TEST);
        }
        if (baseLayer.Shading & LayerShading.NoDepthSet) {
            this.gl.depthMask(false);
        }

        if (typeof baseLayer.TVertexAnimId === 'number') {
            const anim: TVertexAnim = this.rendererData.model.TextureAnims[baseLayer.TVertexAnimId];
            const translationRes = this.interp.vec3(translation, anim.Translation);
            const rotationRes = this.interp.quat(rotation, anim.Rotation);
            const scalingRes = this.interp.vec3(scaling, anim.Scaling);
            mat4.fromRotationTranslationScale(
                texCoordMat4,
                rotationRes || defaultRotation,
                translationRes || defaultTranslation,
                scalingRes || defaultScaling
            );
            mat3.set(
                texCoordMat3,
                texCoordMat4[0], texCoordMat4[1], 0,
                texCoordMat4[4], texCoordMat4[5], 0,
                texCoordMat4[12], texCoordMat4[13], 0
            );

            this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform, false, texCoordMat3);
        } else {
            this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform, false, identifyMat3);
        }

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[normalTexture.Image]);
        this.gl.uniform1i(this.shaderProgramLocations.normalSamplerUniform, 1);

        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[ormTexture.Image]);
        this.gl.uniform1i(this.shaderProgramLocations.ormSamplerUniform, 2);

        this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform, this.rendererData.teamColor);
    }
}
