import {
    ParticleEmitter2, ParticleEmitter2FilterMode, ParticleEmitter2Flags,
    ParticleEmitter2FramesFlags
} from '../model';
import {vec3, vec4} from 'gl-matrix';
import {ModelInterp} from './modelInterp';
import {mat4} from 'gl-matrix';
import {degToRad, rand, getShader} from './util';
import {RendererData} from './rendererData';
import {lerp} from './interp';
import vertexShader from './shaders/webgl/particles.vs.glsl?raw';
import fragmentShader from './shaders/webgl/particles.fs.glsl?raw';
import particlesShader from './shaders/webgpu/particles.wgsl?raw';

const MULTISAMPLE = 4;

const rotateCenter: vec3 = vec3.fromValues(0, 0, 0);
const firstColor = vec4.create();
const secondColor = vec4.create();
const color = vec4.create();
const tailPos = vec3.create();
const tailCross = vec3.create();

interface Particle {
    emitter: ParticleEmitterWrapper;
    // xyz
    pos: vec3;
    // xyz
    speed: vec3;
    angle: number;
    gravity: number;
    lifeSpan: number;
}

interface ParticleEmitterWrapper {
    index: number;

    emission: number;
    squirtFrame: number;
    particles: Particle[];
    props: ParticleEmitter2;
    capacity: number;
    baseCapacity: number;
    // head or tail or both
    type: number;

    // xyz
    tailVertices: Float32Array;
    tailVertexBuffer: WebGLBuffer;
    tailVertexGPUBuffer: GPUBuffer;
    // xyz
    headVertices: Float32Array;
    headVertexBuffer: WebGLBuffer;
    headVertexGPUBuffer: GPUBuffer;
    // xy
    tailTexCoords: Float32Array;
    tailTexCoordBuffer: WebGLBuffer;
    tailTexCoordGPUBuffer: GPUBuffer;
    // xy
    headTexCoords: Float32Array;
    headTexCoordBuffer: WebGLBuffer;
    headTexCoordGPUBuffer: GPUBuffer;
    // rgba
    colors: Float32Array;
    colorBuffer: WebGLBuffer;
    colorGPUBuffer: GPUBuffer;
    // 2 * triangles
    indices: Uint16Array;
    indexBuffer: WebGLBuffer;
    indexGPUBuffer: GPUBuffer;

    fsUniformsBuffer: GPUBuffer;
}

const DISCARD_ALPHA_KEY_LEVEL = 0.83;
const DISCARD_MODULATE_LEVEL = 0.01;

export class ParticlesController {
    private gl: WebGL2RenderingContext | WebGLRenderingContext;
    private shaderProgram: WebGLProgram;
    private vertexShader: WebGLShader;
    private fragmentShader: WebGLShader;

    private device: GPUDevice;
    private gpuShaderModule: GPUShaderModule;
    private gpuPipelineLayout: GPUPipelineLayout;
    private gpuPipelines: GPURenderPipeline[];
    private vsBindGroupLayout: GPUBindGroupLayout | null;
    private fsBindGroupLayout: GPUBindGroupLayout | null;
    private gpuVSUniformsBuffer: GPUBuffer;
    private gpuVSUniformsBindGroup: GPUBindGroup;

    private shaderProgramLocations: {
        vertexPositionAttribute: number | null;
        textureCoordAttribute: number | null;
        colorAttribute: number | null;
        pMatrixUniform: WebGLUniformLocation | null;
        mvMatrixUniform: WebGLUniformLocation | null;
        samplerUniform: WebGLUniformLocation | null;
        replaceableColorUniform: WebGLUniformLocation | null;
        replaceableTypeUniform: WebGLUniformLocation | null;
        discardAlphaLevelUniform: WebGLUniformLocation | null;
    };

    private particleStorage: Particle[];

    private interp: ModelInterp;
    private rendererData: RendererData;
    private emitters: ParticleEmitterWrapper[];

    private particleBaseVectors: vec3[];

    constructor (interp: ModelInterp, rendererData: RendererData) {
        this.shaderProgramLocations = {
            vertexPositionAttribute: null,
            textureCoordAttribute: null,
            colorAttribute: null,
            pMatrixUniform: null,
            mvMatrixUniform: null,
            samplerUniform: null,
            replaceableColorUniform: null,
            replaceableTypeUniform: null,
            discardAlphaLevelUniform: null
        };
        this.particleStorage = [];
        this.interp = interp;
        this.rendererData = rendererData;
        this.emitters = [];

        if (rendererData.model.ParticleEmitters2.length) {
            this.particleBaseVectors = [
                vec3.create(),
                vec3.create(),
                vec3.create(),
                vec3.create()
            ];

            for (let i = 0; i < rendererData.model.ParticleEmitters2.length; ++i) {
                const particleEmitter = rendererData.model.ParticleEmitters2[i];
                const emitter: ParticleEmitterWrapper = {
                    index: i,
                    emission: 0,
                    squirtFrame: 0,
                    particles: [],
                    props: particleEmitter,
                    capacity: 0,
                    baseCapacity: 0,
                    type: particleEmitter.FrameFlags,
                    tailVertices: null,
                    tailVertexBuffer: null,
                    tailVertexGPUBuffer: null,
                    headVertices: null,
                    headVertexBuffer: null,
                    headVertexGPUBuffer: null,
                    tailTexCoords: null,
                    tailTexCoordBuffer: null,
                    tailTexCoordGPUBuffer: null,
                    headTexCoords: null,
                    headTexCoordBuffer: null,
                    headTexCoordGPUBuffer: null,
                    colors: null,
                    colorBuffer: null,
                    colorGPUBuffer: null,
                    indices: null,
                    indexBuffer: null,
                    indexGPUBuffer: null,
                    fsUniformsBuffer: null
                };

                emitter.baseCapacity = Math.ceil(
                    ModelInterp.maxAnimVectorVal(emitter.props.EmissionRate) * emitter.props.LifeSpan
                );

                this.emitters.push(emitter);
            }
        }
    }

    public destroy (): void {
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
        this.particleStorage = [];

        if (this.gpuVSUniformsBuffer) {
            this.gpuVSUniformsBuffer.destroy();
            this.gpuVSUniformsBuffer = null;
        }

        for (const emitter of this.emitters) {
            if (emitter.colorGPUBuffer) {
                emitter.colorGPUBuffer.destroy();
            }
            if (emitter.indexGPUBuffer) {
                emitter.indexGPUBuffer.destroy();
            }
            if (emitter.headVertexGPUBuffer) {
                emitter.headVertexGPUBuffer.destroy();
            }
            if (emitter.tailVertexGPUBuffer) {
                emitter.tailVertexGPUBuffer.destroy();
            }
            if (emitter.headTexCoordGPUBuffer) {
                emitter.headTexCoordGPUBuffer.destroy();
            }
            if (emitter.tailTexCoordGPUBuffer) {
                emitter.tailTexCoordGPUBuffer.destroy();
            }
            if (emitter.fsUniformsBuffer) {
                emitter.fsUniformsBuffer.destroy();
            }
        }

        this.emitters = [];
    }

    public initGL (glContext: WebGLRenderingContext): void {
        this.gl = glContext;

        this.initShaders();
    }

    public initGPUDevice (device: GPUDevice): void {
        this.device = device;

        this.gpuShaderModule = device.createShaderModule({
            label: 'particles shader module',
            code: particlesShader
        });

        this.vsBindGroupLayout = this.device.createBindGroupLayout({
            label: 'particles vs bind group layout',
            entries: [ {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: 'uniform',
                    hasDynamicOffset: false,
                    minBindingSize: 128
                }
            }] as const
        });
        this.fsBindGroupLayout = this.device.createBindGroupLayout({
            label: 'particles bind group layout2',
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                    type: 'uniform',
                        hasDynamicOffset: false,
                        minBindingSize: 32
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
                        viewDimension: "2d",
                        multisampled: false
                    }
                }
            ] as const
        });

        this.gpuPipelineLayout = this.device.createPipelineLayout({
            label: 'particles pipeline layout',
            bindGroupLayouts: [
                this.vsBindGroupLayout,
                this.fsBindGroupLayout
            ]
        });

        const createPipeline = (name: string, blend: GPUBlendState, depth: GPUDepthStencilState) => {
            return device.createRenderPipeline({
                label: `particles pipeline ${name}`,
                layout: this.gpuPipelineLayout,
                vertex: {
                    module: this.gpuShaderModule,
                    buffers: [{
                        arrayStride: 12,
                        attributes: [{
                            shaderLocation: 0,
                            offset: 0,
                            format: 'float32x3' as const
                        }]
                    }, {
                        arrayStride: 8,
                        attributes: [{
                            shaderLocation: 1,
                            offset: 0,
                            format: 'float32x2' as const
                        }]
                    }, {
                        arrayStride: 16,
                        attributes: [{
                            shaderLocation: 2,
                            offset: 0,
                            format: 'float32x4' as const
                        }]
                    }]
                },
                fragment: {
                    module: this.gpuShaderModule,
                    targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend
                    }]
                },
                depthStencil: depth,
                multisample: {
                    count: MULTISAMPLE
                }
            });
        };

        this.gpuPipelines = [
            createPipeline('blend', {
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
            }),
            createPipeline('additive', {
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
            }),
            createPipeline('modulate', {
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
            }),
            createPipeline('modulate2x', {
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
            }),
            createPipeline('alphaKey', {
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
            }),
        ];

        this.gpuVSUniformsBuffer = this.device.createBuffer({
            label: 'particles vs uniforms',
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.gpuVSUniformsBindGroup = this.device.createBindGroup({
            layout: this.vsBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.gpuVSUniformsBuffer }
                }
            ]
        });
    }

    private initShaders (): void {
        const vertex = this.vertexShader = getShader(this.gl, vertexShader, this.gl.VERTEX_SHADER);
        const fragment = this.fragmentShader = getShader(this.gl, fragmentShader, this.gl.FRAGMENT_SHADER);

        const shaderProgram = this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertex);
        this.gl.attachShader(shaderProgram, fragment);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }

        this.gl.useProgram(shaderProgram);

        this.shaderProgramLocations.vertexPositionAttribute =
            this.gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.shaderProgramLocations.textureCoordAttribute =
            this.gl.getAttribLocation(shaderProgram, 'aTextureCoord');
        this.shaderProgramLocations.colorAttribute =
            this.gl.getAttribLocation(shaderProgram, 'aColor');

        this.shaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uPMatrix');
        this.shaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        this.shaderProgramLocations.samplerUniform = this.gl.getUniformLocation(shaderProgram, 'uSampler');
        this.shaderProgramLocations.replaceableColorUniform =
            this.gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        this.shaderProgramLocations.replaceableTypeUniform =
            this.gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        this.shaderProgramLocations.discardAlphaLevelUniform =
            this.gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
    }

    private updateParticle (particle: Particle, delta: number): void {
        delta /= 1000;

        particle.lifeSpan -= delta;
        if (particle.lifeSpan <= 0) {
            return;
        }
        particle.speed[2] -= particle.gravity * delta;

        particle.pos[0] += particle.speed[0] * delta;
        particle.pos[1] += particle.speed[1] * delta;
        particle.pos[2] += particle.speed[2] * delta;
    }

    private resizeEmitterBuffers (emitter: ParticleEmitterWrapper, size: number): void {
        if (size <= emitter.capacity) {
            return;
        }

        size = Math.max(size, emitter.baseCapacity);

        let tailVertices;
        let headVertices;
        let tailTexCoords;
        let headTexCoords;

        if (emitter.type & ParticleEmitter2FramesFlags.Tail) {
            tailVertices = new Float32Array(size * 4 * 3);  // 4 vertices * xyz
            tailTexCoords = new Float32Array(size * 4 * 2); // 4 vertices * xy
        }
        if (emitter.type & ParticleEmitter2FramesFlags.Head) {
            headVertices = new Float32Array(size * 4 * 3);  // 4 vertices * xyz
            headTexCoords = new Float32Array(size * 4 * 2); // 4 vertices * xy
        }

        const colors = new Float32Array(size * 4 * 4);    // 4 vertices * rgba
        const indices = new Uint16Array(size * 6);        // 4 vertices * 2 triangles

        if (emitter.capacity) {
            indices.set(emitter.indices);
        }

        for (let i = emitter.capacity; i < size; ++i) {
            indices[i * 6    ] = i * 4    ;
            indices[i * 6 + 1] = i * 4 + 1;
            indices[i * 6 + 2] = i * 4 + 2;
            indices[i * 6 + 3] = i * 4 + 2;
            indices[i * 6 + 4] = i * 4 + 1;
            indices[i * 6 + 5] = i * 4 + 3;
        }

        if (tailVertices) {
            emitter.tailVertices = tailVertices;
            emitter.tailTexCoords = tailTexCoords;
        }
        if (headVertices) {
            emitter.headVertices = headVertices;
            emitter.headTexCoords = headTexCoords;
        }
        emitter.colors = colors;
        emitter.indices = indices;

        emitter.capacity = size;

        if (!emitter.indexBuffer) {
            if (this.gl) {
                if (emitter.type & ParticleEmitter2FramesFlags.Tail) {
                    emitter.tailVertexBuffer = this.gl.createBuffer();
                    emitter.tailTexCoordBuffer = this.gl.createBuffer();
                }
                if (emitter.type & ParticleEmitter2FramesFlags.Head) {
                    emitter.headVertexBuffer = this.gl.createBuffer();
                    emitter.headTexCoordBuffer = this.gl.createBuffer();
                }
                emitter.colorBuffer = this.gl.createBuffer();
                emitter.indexBuffer = this.gl.createBuffer();
            } else if (this.device) {
                if (emitter.type & ParticleEmitter2FramesFlags.Tail) {
                    emitter.tailVertexGPUBuffer?.destroy();
                    emitter.tailVertexGPUBuffer = this.device.createBuffer({
                        label: `particles tail vertex buffer ${emitter.index}`,
                        size: tailVertices.byteLength,
                        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
                    });
                    emitter.tailTexCoordGPUBuffer?.destroy();
                    emitter.tailTexCoordGPUBuffer = this.device.createBuffer({
                        label: `particles tail texCoords buffer ${emitter.index}`,
                        size: tailTexCoords.byteLength,
                        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
                    });
                }
                if (emitter.type & ParticleEmitter2FramesFlags.Head) {
                    emitter.headVertexGPUBuffer?.destroy();
                    emitter.headVertexGPUBuffer = this.device.createBuffer({
                        label: `particles head vertex buffer ${emitter.index}`,
                        size: headVertices.byteLength,
                        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
                    });
                    emitter.headTexCoordGPUBuffer?.destroy();
                    emitter.headTexCoordGPUBuffer = this.device.createBuffer({
                        label: `particles head texCoords buffer ${emitter.index}`,
                        size: headTexCoords.byteLength,
                        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
                    });
                }
                emitter.colorGPUBuffer?.destroy();
                emitter.colorGPUBuffer = this.device.createBuffer({
                    label: `particles color buffer ${emitter.index}`,
                    size: colors.byteLength,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
                });
                emitter.indexGPUBuffer?.destroy();
                emitter.indexGPUBuffer = this.device.createBuffer({
                    label: `particles index buffer ${emitter.index}`,
                    size: indices.byteLength,
                    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
                });
            }
        }
    }

    public update (delta: number): void {
        for (const emitter of this.emitters) {
            this.updateEmitter(emitter, delta);
        }
    }

    public render (mvMatrix: mat4, pMatrix: mat4): void {
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.useProgram(this.shaderProgram);

        this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform, false, pMatrix);
        this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute);
        this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);
        this.gl.enableVertexAttribArray(this.shaderProgramLocations.colorAttribute);

        for (const emitter of this.emitters) {
            if (!emitter.particles.length) {
                continue;
            }

            this.setLayerProps(emitter);
            this.setGeneralBuffers(emitter);

            if (emitter.type & ParticleEmitter2FramesFlags.Tail) {
                this.renderEmitterType(emitter, ParticleEmitter2FramesFlags.Tail);
            }
            if (emitter.type & ParticleEmitter2FramesFlags.Head) {
                this.renderEmitterType(emitter, ParticleEmitter2FramesFlags.Head);
            }
        }

        this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute);
        this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);
        this.gl.disableVertexAttribArray(this.shaderProgramLocations.colorAttribute);
    }

    private renderGPUEmitterType(pass: GPURenderPassEncoder, emitter: ParticleEmitterWrapper, type: ParticleEmitter2FramesFlags): void {
        if (type === ParticleEmitter2FramesFlags.Tail) {
            this.device.queue.writeBuffer(emitter.tailTexCoordGPUBuffer, 0, emitter.tailTexCoords);
            pass.setVertexBuffer(1, emitter.tailTexCoordGPUBuffer);
        } else {
            this.device.queue.writeBuffer(emitter.headTexCoordGPUBuffer, 0, emitter.headTexCoords);
            pass.setVertexBuffer(1, emitter.headTexCoordGPUBuffer);
        }

        if (type === ParticleEmitter2FramesFlags.Tail) {
            this.device.queue.writeBuffer(emitter.tailVertexGPUBuffer, 0, emitter.tailVertices);
            pass.setVertexBuffer(0, emitter.tailVertexGPUBuffer);
        } else {
            this.device.queue.writeBuffer(emitter.headVertexGPUBuffer, 0, emitter.headVertices);
            pass.setVertexBuffer(0, emitter.headVertexGPUBuffer);
        }

        pass.drawIndexed(emitter.particles.length * 6);
    }

    public renderGPU (pass: GPURenderPassEncoder, mvMatrix: mat4, pMatrix: mat4): void {
        const VSUniformsValues = new ArrayBuffer(128);
        const VSUniformsViews = {
            mvMatrix: new Float32Array(VSUniformsValues, 0, 16),
            pMatrix: new Float32Array(VSUniformsValues, 64, 16)
        };
        VSUniformsViews.mvMatrix.set(mvMatrix);
        VSUniformsViews.pMatrix.set(pMatrix);
        this.device.queue.writeBuffer(this.gpuVSUniformsBuffer, 0, VSUniformsValues);

        pass.setBindGroup(0, this.gpuVSUniformsBindGroup);

        for (const emitter of this.emitters) {
            if (!emitter.particles.length) {
                continue;
            }

            const pipeline = this.gpuPipelines[emitter.props.FilterMode] || this.gpuPipelines[0];
            pass.setPipeline(pipeline);

            const textureID = emitter.props.TextureID;
            const texture = this.rendererData.model.Textures[textureID];

            const fsUniformsValues = new ArrayBuffer(32);
            const fsUniformsViews = {
                replaceableColor: new Float32Array(fsUniformsValues, 0, 3),
                replaceableType: new Uint32Array(fsUniformsValues, 12, 1),
                discardAlphaLevel: new Float32Array(fsUniformsValues, 16, 1),
            };

            fsUniformsViews.replaceableColor.set(this.rendererData.teamColor);
            fsUniformsViews.replaceableType.set([texture.ReplaceableId || 0]);
            if (emitter.props.FilterMode === ParticleEmitter2FilterMode.AlphaKey) {
                fsUniformsViews.discardAlphaLevel.set([DISCARD_ALPHA_KEY_LEVEL]);
            } else if (
                emitter.props.FilterMode === ParticleEmitter2FilterMode.Modulate ||
                emitter.props.FilterMode === ParticleEmitter2FilterMode.Modulate2x
            ) {
                fsUniformsViews.discardAlphaLevel.set([DISCARD_MODULATE_LEVEL]);
            } else {
                fsUniformsViews.discardAlphaLevel.set([0]);
            }

            if (!emitter.fsUniformsBuffer) {
                emitter.fsUniformsBuffer = this.device.createBuffer({
                    label: `particles fs uniforms ${emitter.index}`,
                    size: 32,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                });
            }

            this.device.queue.writeBuffer(emitter.fsUniformsBuffer, 0, fsUniformsValues);

            const fsUniformsBindGroup = this.device.createBindGroup({
                label: `particles fs uniforms ${emitter.index}`,
                layout: this.fsBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: { buffer: emitter.fsUniformsBuffer }
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

            pass.setBindGroup(1, fsUniformsBindGroup);

            this.device.queue.writeBuffer(emitter.colorGPUBuffer, 0, emitter.colors);
            this.device.queue.writeBuffer(emitter.indexGPUBuffer, 0, emitter.indices);
            pass.setVertexBuffer(2, emitter.colorGPUBuffer);
            pass.setIndexBuffer(emitter.indexGPUBuffer, 'uint16');

            if (emitter.type & ParticleEmitter2FramesFlags.Tail) {
                this.renderGPUEmitterType(pass, emitter, ParticleEmitter2FramesFlags.Tail);
            }
            if (emitter.type & ParticleEmitter2FramesFlags.Head) {
                this.renderGPUEmitterType(pass, emitter, ParticleEmitter2FramesFlags.Head);
            }
        }
    }

    private updateEmitter (emitter: ParticleEmitterWrapper, delta: number): void {
        const visibility = this.interp.animVectorVal(emitter.props.Visibility, 1);

        if (visibility > 0) {
            if (emitter.props.Squirt && typeof emitter.props.EmissionRate !== 'number') {
                const interp = this.interp.findKeyframes(emitter.props.EmissionRate);

                if (interp && interp.left && interp.left.Frame !== emitter.squirtFrame) {
                    emitter.squirtFrame = interp.left.Frame;
                    if (interp.left.Vector[0] > 0) {
                        emitter.emission += interp.left.Vector[0] * 1000;
                    }
                }
            } else {
                const emissionRate = this.interp.animVectorVal(emitter.props.EmissionRate, 0);

                emitter.emission += emissionRate * delta;
            }

            while (emitter.emission >= 1000) {
                emitter.emission -= 1000;
                emitter.particles.push(
                    this.createParticle(emitter, this.rendererData.nodes[emitter.props.ObjectId].matrix)
                );
            }
        }

        if (emitter.particles.length) {
            const updatedParticles = [];
            for (const particle of emitter.particles) {
                this.updateParticle(particle, delta);
                if (particle.lifeSpan > 0) {
                    updatedParticles.push(particle);
                } else {
                    this.particleStorage.push(particle);
                }
            }
            emitter.particles = updatedParticles;

            if (emitter.type & ParticleEmitter2FramesFlags.Head) {
                if (emitter.props.Flags & ParticleEmitter2Flags.XYQuad) {
                    vec3.set(this.particleBaseVectors[0], -1,  1, 0);
                    vec3.set(this.particleBaseVectors[1], -1, -1, 0);
                    vec3.set(this.particleBaseVectors[2],  1,  1, 0);
                    vec3.set(this.particleBaseVectors[3],  1, -1, 0);
                } else {
                    vec3.set(this.particleBaseVectors[0], 0, -1,  1);
                    vec3.set(this.particleBaseVectors[1], 0, -1, -1);
                    vec3.set(this.particleBaseVectors[2], 0,  1,  1);
                    vec3.set(this.particleBaseVectors[3], 0,  1, -1);

                    for (let i = 0; i < 4; ++i) {
                        vec3.transformQuat(this.particleBaseVectors[i], this.particleBaseVectors[i],
                            this.rendererData.cameraQuat);
                    }
                }
            }

            this.resizeEmitterBuffers(emitter, emitter.particles.length);
            for (let i = 0; i < emitter.particles.length; ++i) {
                this.updateParticleBuffers(emitter.particles[i], i, emitter);
            }
        }
    }

    private createParticle (emitter: ParticleEmitterWrapper, emitterMatrix: mat4) {
        let particle: Particle;

        if (this.particleStorage.length) {
            particle = this.particleStorage.pop();
        } else {
            particle = {
                emitter: null,
                pos: vec3.create(),
                angle: 0,
                speed: vec3.create(),
                gravity: null,
                lifeSpan: null
            };
        }

        const width: number = this.interp.animVectorVal(emitter.props.Width, 0);
        const length: number = this.interp.animVectorVal(emitter.props.Length, 0);
        let speedScale: number = this.interp.animVectorVal(emitter.props.Speed, 0);
        const variation: number = this.interp.animVectorVal(emitter.props.Variation, 0);
        const latitude: number = degToRad(this.interp.animVectorVal(emitter.props.Latitude, 0));

        particle.emitter = emitter;

        particle.pos[0] = emitter.props.PivotPoint[0] + rand(-width, width);
        particle.pos[1] = emitter.props.PivotPoint[1] + rand(-length, length);
        particle.pos[2] = emitter.props.PivotPoint[2];
        vec3.transformMat4(particle.pos, particle.pos, emitterMatrix);

        if (variation > 0) {
            speedScale *= 1 + rand(-variation, variation);
        }

        vec3.set(particle.speed, 0, 0, speedScale);
        particle.angle = rand(0, Math.PI * 2);
        vec3.rotateY(particle.speed, particle.speed, rotateCenter, rand(0, latitude));
        vec3.rotateZ(particle.speed, particle.speed, rotateCenter, particle.angle);
        if (emitter.props.Flags & ParticleEmitter2Flags.LineEmitter) {
            particle.speed[0] = 0;
        }
        vec3.transformMat4(particle.speed, particle.speed, emitterMatrix);
        // minus translation of emitterMatrix
        particle.speed[0] -= emitterMatrix[12];
        particle.speed[1] -= emitterMatrix[13];
        particle.speed[2] -= emitterMatrix[14];

        particle.gravity = this.interp.animVectorVal(emitter.props.Gravity, 0);

        particle.lifeSpan = emitter.props.LifeSpan;

        return particle;
    }

    private updateParticleBuffers (particle: Particle, index: number, emitter: ParticleEmitterWrapper): void {
        const globalT: number = 1 - particle.lifeSpan / emitter.props.LifeSpan;
        const firstHalf: boolean = globalT < emitter.props.Time;
        let t: number;

        if (firstHalf) {
            t = globalT / emitter.props.Time;
        } else {
            t = (globalT - emitter.props.Time) / (1 - emitter.props.Time);
        }

        this.updateParticleVertices(particle, index, emitter, firstHalf, t);
        this.updateParticleTexCoords(index, emitter, firstHalf, t);
        this.updateParticleColor(index, emitter, firstHalf, t);
    }

    private updateParticleVertices (particle: Particle, index: number, emitter: ParticleEmitterWrapper,
                                    firstHalf: boolean, t: number) {
        let firstScale;
        let secondScale;
        let scale;

        if (firstHalf) {
            firstScale = emitter.props.ParticleScaling[0];
            secondScale = emitter.props.ParticleScaling[1];
        } else {
            firstScale = emitter.props.ParticleScaling[1];
            secondScale = emitter.props.ParticleScaling[2];
        }

        // eslint-disable-next-line prefer-const
        scale = lerp(firstScale, secondScale, t);

        if (emitter.type & ParticleEmitter2FramesFlags.Head) {
            for (let i = 0; i < 4; ++i) {
                emitter.headVertices[index * 12 + i * 3]     = this.particleBaseVectors[i][0] * scale;
                emitter.headVertices[index * 12 + i * 3 + 1] = this.particleBaseVectors[i][1] * scale;
                emitter.headVertices[index * 12 + i * 3 + 2] = this.particleBaseVectors[i][2] * scale;

                if (emitter.props.Flags & ParticleEmitter2Flags.XYQuad) {
                    const x = emitter.headVertices[index * 12 + i * 3];
                    const y = emitter.headVertices[index * 12 + i * 3 + 1];
                    emitter.headVertices[index * 12 + i * 3]     = x * Math.cos(particle.angle) -
                        y * Math.sin(particle.angle);
                    emitter.headVertices[index * 12 + i * 3 + 1] = x * Math.sin(particle.angle) +
                        y * Math.cos(particle.angle);
                }
            }
        }
        if (emitter.type & ParticleEmitter2FramesFlags.Tail) {
            tailPos[0] = -particle.speed[0] * emitter.props.TailLength;
            tailPos[1] = -particle.speed[1] * emitter.props.TailLength;
            tailPos[2] = -particle.speed[2] * emitter.props.TailLength;

            vec3.cross(tailCross, particle.speed, this.rendererData.cameraPos);
            vec3.normalize(tailCross, tailCross);
            vec3.scale(tailCross, tailCross, scale);

            emitter.tailVertices[index * 12]             =  tailCross[0];
            emitter.tailVertices[index * 12         + 1] =  tailCross[1];
            emitter.tailVertices[index * 12         + 2] =  tailCross[2];

            emitter.tailVertices[index * 12 +     3]     = -tailCross[0];
            emitter.tailVertices[index * 12 +     3 + 1] = -tailCross[1];
            emitter.tailVertices[index * 12 +     3 + 2] = -tailCross[2];

            emitter.tailVertices[index * 12 + 2 * 3]     =  tailCross[0] + tailPos[0];
            emitter.tailVertices[index * 12 + 2 * 3 + 1] =  tailCross[1] + tailPos[1];
            emitter.tailVertices[index * 12 + 2 * 3 + 2] =  tailCross[2] + tailPos[2];

            emitter.tailVertices[index * 12 + 3 * 3]     = -tailCross[0] + tailPos[0];
            emitter.tailVertices[index * 12 + 3 * 3 + 1] = -tailCross[1] + tailPos[1];
            emitter.tailVertices[index * 12 + 3 * 3 + 2] = -tailCross[2] + tailPos[2];
        }

        for (let i = 0; i < 4; ++i) {
            if (emitter.headVertices) {
                emitter.headVertices[index * 12 + i * 3]     += particle.pos[0];
                emitter.headVertices[index * 12 + i * 3 + 1] += particle.pos[1];
                emitter.headVertices[index * 12 + i * 3 + 2] += particle.pos[2];
            }
            if (emitter.tailVertices) {
                emitter.tailVertices[index * 12 + i * 3]     += particle.pos[0];
                emitter.tailVertices[index * 12 + i * 3 + 1] += particle.pos[1];
                emitter.tailVertices[index * 12 + i * 3 + 2] += particle.pos[2];
            }
        }
    }

    private updateParticleTexCoords (index: number, emitter: ParticleEmitterWrapper, firstHalf: boolean, t: number) {
        if (emitter.type & ParticleEmitter2FramesFlags.Head) {
            this.updateParticleTexCoordsByType(index, emitter, firstHalf, t, ParticleEmitter2FramesFlags.Head);
        }
        if (emitter.type & ParticleEmitter2FramesFlags.Tail) {
            this.updateParticleTexCoordsByType(index, emitter, firstHalf, t, ParticleEmitter2FramesFlags.Tail);
        }
    }

    private updateParticleTexCoordsByType (index: number, emitter: ParticleEmitterWrapper, firstHalf: boolean,
                                           t: number, type: ParticleEmitter2FramesFlags) {
        let uvAnim;
        let texCoords;
        if (type === ParticleEmitter2FramesFlags.Tail) {
            uvAnim = firstHalf ? emitter.props.TailUVAnim : emitter.props.TailDecayUVAnim;
            texCoords = emitter.tailTexCoords;
        } else {
            uvAnim = firstHalf ? emitter.props.LifeSpanUVAnim : emitter.props.DecayUVAnim;
            texCoords = emitter.headTexCoords;
        }
        const firstFrame = uvAnim[0];
        const secondFrame = uvAnim[1];
        const frame = Math.round(lerp(firstFrame, secondFrame, t));
        const texCoordX = frame % emitter.props.Columns;
        const texCoordY = Math.floor(frame / emitter.props.Rows);
        const cellWidth = 1 / emitter.props.Columns;
        const cellHeight = 1 / emitter.props.Rows;

        texCoords[index * 8] = texCoordX * cellWidth;
        texCoords[index * 8 + 1] = texCoordY * cellHeight;

        texCoords[index * 8 + 2] = texCoordX * cellWidth;
        texCoords[index * 8 + 3] = (1 + texCoordY) * cellHeight;

        texCoords[index * 8 + 4] = (1 + texCoordX) * cellWidth;
        texCoords[index * 8 + 5] = texCoordY * cellHeight;

        texCoords[index * 8 + 6] = (1 + texCoordX) * cellWidth;
        texCoords[index * 8 + 7] = (1 + texCoordY) * cellHeight;
    }

    private updateParticleColor(index: number, emitter: ParticleEmitterWrapper, firstHalf: boolean, t: number) {
        if (firstHalf) {
            firstColor[0] = emitter.props.SegmentColor[0][0];
            firstColor[1] = emitter.props.SegmentColor[0][1];
            firstColor[2] = emitter.props.SegmentColor[0][2];
            firstColor[3] = emitter.props.Alpha[0] / 255;

            secondColor[0] = emitter.props.SegmentColor[1][0];
            secondColor[1] = emitter.props.SegmentColor[1][1];
            secondColor[2] = emitter.props.SegmentColor[1][2];
            secondColor[3] = emitter.props.Alpha[1] / 255;
        } else {
            firstColor[0] = emitter.props.SegmentColor[1][0];
            firstColor[1] = emitter.props.SegmentColor[1][1];
            firstColor[2] = emitter.props.SegmentColor[1][2];
            firstColor[3] = emitter.props.Alpha[1] / 255;

            secondColor[0] = emitter.props.SegmentColor[2][0];
            secondColor[1] = emitter.props.SegmentColor[2][1];
            secondColor[2] = emitter.props.SegmentColor[2][2];
            secondColor[3] = emitter.props.Alpha[2] / 255;
        }

        vec4.lerp(color, firstColor, secondColor, t);

        for (let i = 0; i < 4; ++i) {
            emitter.colors[index * 16 + i * 4]     = color[0];
            emitter.colors[index * 16 + i * 4 + 1] = color[1];
            emitter.colors[index * 16 + i * 4 + 2] = color[2];
            emitter.colors[index * 16 + i * 4 + 3] = color[3];
        }
    }

    private setLayerProps (emitter: ParticleEmitterWrapper): void {
        if (emitter.props.FilterMode === ParticleEmitter2FilterMode.AlphaKey) {
            this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, DISCARD_ALPHA_KEY_LEVEL);
        } else if (emitter.props.FilterMode === ParticleEmitter2FilterMode.Modulate ||
            emitter.props.FilterMode === ParticleEmitter2FilterMode.Modulate2x) {
                this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, DISCARD_MODULATE_LEVEL);
        } else {
            this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, 0.);
        }

        if (emitter.props.FilterMode === ParticleEmitter2FilterMode.Blend) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(false);
        } else if (emitter.props.FilterMode === ParticleEmitter2FilterMode.Additive) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (emitter.props.FilterMode === ParticleEmitter2FilterMode.AlphaKey) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (emitter.props.FilterMode === ParticleEmitter2FilterMode.Modulate) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.ZERO, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (emitter.props.FilterMode === ParticleEmitter2FilterMode.Modulate2x) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.DST_COLOR, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.ONE);
            this.gl.depthMask(false);
        }

        const texture = this.rendererData.model.Textures[emitter.props.TextureID];
        if (texture.Image) {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[texture.Image]);
            this.gl.uniform1i(this.shaderProgramLocations.samplerUniform, 0);
            this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform, 0);
        } else if (texture.ReplaceableId === 1 || texture.ReplaceableId === 2) {
            this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform, this.rendererData.teamColor);
            this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform, texture.ReplaceableId);
        }
    }

    private setGeneralBuffers (emitter: ParticleEmitterWrapper): void {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, emitter.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, emitter.colors, this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.shaderProgramLocations.colorAttribute, 4, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, emitter.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, emitter.indices, this.gl.DYNAMIC_DRAW);
    }

    private renderEmitterType (emitter: ParticleEmitterWrapper, type: ParticleEmitter2FramesFlags): void {
        if (type === ParticleEmitter2FramesFlags.Tail) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, emitter.tailTexCoordBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, emitter.tailTexCoords, this.gl.DYNAMIC_DRAW);
        } else {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, emitter.headTexCoordBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, emitter.headTexCoords, this.gl.DYNAMIC_DRAW);
        }
        this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);

        if (type === ParticleEmitter2FramesFlags.Tail) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, emitter.tailVertexBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, emitter.tailVertices, this.gl.DYNAMIC_DRAW);
        } else {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, emitter.headVertexBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, emitter.headVertices, this.gl.DYNAMIC_DRAW);
        }
        this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.drawElements(this.gl.TRIANGLES, emitter.particles.length * 6, this.gl.UNSIGNED_SHORT, 0);
    }
}
