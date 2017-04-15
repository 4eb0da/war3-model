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

let gl: WebGLRenderingContext;
let shaderProgram: WebGLProgram;
let shaderProgramLocations: any = {};
let particleStorage: Particle[] = [];

let rotateCenter: vec3 = vec3.fromValues(0, 0, 0);
let firstColor = vec4.create();
let secondColor = vec4.create();
let color = vec4.create();
let tailPos = vec3.create();
let tailCross = vec3.create();

let vertexShader = `
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;
    attribute vec4 aColor;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec2 vTextureCoord;
    varying vec4 vColor;

    void main(void) {
        vec4 position = vec4(aVertexPosition, 1.0);
        gl_Position = uPMatrix * uMVMatrix * position;
        vTextureCoord = aTextureCoord;
        vColor = aColor;
    }
`;

let fragmentShader = `
    precision mediump float;

    varying vec2 vTextureCoord;
    varying vec4 vColor;

    uniform sampler2D uSampler;
    uniform vec3 uReplaceableColor;
    uniform float uReplaceableType;
    uniform float uDiscardAlphaLevel;

    float hypot (vec2 z) {
        float t;
        float x = abs(z.x);
        float y = abs(z.y);
        t = min(x, y);
        x = max(x, y);
        t = t / x;
        return (z.x == 0.0 && z.y == 0.0) ? 0.0 : x * sqrt(1.0 + t * t);
    }

    void main(void) {
        vec2 coords = vec2(vTextureCoord.s, vTextureCoord.t);
        if (uReplaceableType == 0.) {
            gl_FragColor = texture2D(uSampler, coords);
        } else if (uReplaceableType == 1.) {
            gl_FragColor = vec4(uReplaceableColor, 1.0);
        } else if (uReplaceableType == 2.) {
            float dist = hypot(coords - vec2(0.5, 0.5)) * 2.;
            float truncateDist = clamp(1. - dist * 1.4, 0., 1.);
            float alpha = sin(truncateDist);
            gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);
        }
        gl_FragColor *= vColor;
        
        if (gl_FragColor[3] < uDiscardAlphaLevel) {
            discard;
        }
    }
`;

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
    // xyz
    headVertices: Float32Array;
    headVertexBuffer: WebGLBuffer;
    // xy
    tailTexCoords: Float32Array;
    tailTexCoordBuffer: WebGLBuffer;
    // xy
    headTexCoords: Float32Array;
    headTexCoordBuffer: WebGLBuffer;
    // rgba
    colors: Float32Array;
    colorBuffer: WebGLBuffer;
    // 2 * triangles
    indices: Uint16Array;
    indexBuffer: WebGLBuffer;
}

const DISCARD_ALPHA_KEY_LEVEL = 0.83;
const DISCARD_MODULATE_LEVEL = 0.01;

export class ParticlesController {
    public static initGL (glContext: WebGLRenderingContext) {
        gl = glContext;

        ParticlesController.initShaders();
    }

    private static initShaders (): void {
        let vertex = getShader(gl, vertexShader, gl.VERTEX_SHADER);
        let fragment = getShader(gl, fragmentShader, gl.FRAGMENT_SHADER);

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertex);
        gl.attachShader(shaderProgram, fragment);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }

        gl.useProgram(shaderProgram);

        shaderProgramLocations.vertexPositionAttribute =
            gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        shaderProgramLocations.textureCoordAttribute =
            gl.getAttribLocation(shaderProgram, 'aTextureCoord');
        shaderProgramLocations.colorAttribute =
            gl.getAttribLocation(shaderProgram, 'aColor');

        shaderProgramLocations.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
        shaderProgramLocations.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        shaderProgramLocations.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');
        shaderProgramLocations.replaceableColorUniform =
            gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        shaderProgramLocations.replaceableTypeUniform =
            gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        shaderProgramLocations.discardAlphaLevelUniform =
            gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
    }

    private static updateParticle (particle: Particle, delta: number): void {
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

    private static resizeEmitterBuffers (emitter: ParticleEmitterWrapper, size: number): void {
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

        let colors = new Float32Array(size * 4 * 4);    // 4 vertices * rgba
        let indices = new Uint16Array(size * 6);        // 4 vertices * 2 triangles

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
            if (emitter.type & ParticleEmitter2FramesFlags.Tail) {
                emitter.tailVertexBuffer = gl.createBuffer();
                emitter.tailTexCoordBuffer = gl.createBuffer();
            }
            if (emitter.type & ParticleEmitter2FramesFlags.Head) {
                emitter.headVertexBuffer = gl.createBuffer();
                emitter.headTexCoordBuffer = gl.createBuffer();
            }
            emitter.colorBuffer = gl.createBuffer();
            emitter.indexBuffer = gl.createBuffer();
        }
    }

    private interp: ModelInterp;
    private rendererData: RendererData;
    private emitters: ParticleEmitterWrapper[];

    private particleBaseVectors: vec3[];

    constructor (interp: ModelInterp, rendererData: RendererData) {
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

            for (let particleEmitter of rendererData.model.ParticleEmitters2) {
                let emitter: ParticleEmitterWrapper = {
                    emission: 0,
                    squirtFrame: 0,
                    particles: [],
                    props: particleEmitter,
                    capacity: 0,
                    baseCapacity: 0,
                    type: particleEmitter.FrameFlags,
                    tailVertices: null,
                    tailVertexBuffer: null,
                    headVertices: null,
                    headVertexBuffer: null,
                    tailTexCoords: null,
                    tailTexCoordBuffer: null,
                    headTexCoords: null,
                    headTexCoordBuffer: null,
                    colors: null,
                    colorBuffer: null,
                    indices: null,
                    indexBuffer: null
                };

                emitter.baseCapacity = Math.ceil(
                    ModelInterp.maxAnimVectorVal(emitter.props.EmissionRate) * emitter.props.LifeSpan
                );

                this.emitters.push(emitter);
            }
        }
    }

    public update (delta: number): void {
        for (let emitter of this.emitters) {
            this.updateEmitter(emitter, delta);
        }
    }

    public render (mvMatrix: mat4, pMatrix: mat4): void {
        gl.enable(gl.CULL_FACE);
        gl.useProgram(shaderProgram);

        gl.uniformMatrix4fv(shaderProgramLocations.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        gl.enableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);
        gl.enableVertexAttribArray(shaderProgramLocations.colorAttribute);

        for (let emitter of this.emitters) {
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

        gl.disableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.disableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);
        gl.disableVertexAttribArray(shaderProgramLocations.colorAttribute);
    }

    private updateEmitter (emitter: ParticleEmitterWrapper, delta: number): void {
        let visibility = this.interp.animVectorVal(emitter.props.Visibility, 1);

        if (visibility > 0) {
            if (emitter.props.Squirt && typeof emitter.props.EmissionRate !== 'number') {
                let interp = this.interp.findKeyframes(emitter.props.EmissionRate);

                if (interp && interp.left && interp.left.Frame !== emitter.squirtFrame) {
                    emitter.squirtFrame = interp.left.Frame;
                    if (interp.left.Vector[0] > 0) {
                        emitter.emission += interp.left.Vector[0] * 1000;
                    }
                }
            } else {
                let emissionRate = this.interp.animVectorVal(emitter.props.EmissionRate, 0);

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
            let updatedParticles = [];
            for (let particle of emitter.particles) {
                ParticlesController.updateParticle(particle, delta);
                if (particle.lifeSpan > 0) {
                    updatedParticles.push(particle);
                } else {
                    particleStorage.push(particle);
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

            ParticlesController.resizeEmitterBuffers(emitter, emitter.particles.length);
            for (let i = 0; i < emitter.particles.length; ++i) {
                this.updateParticleBuffers(emitter.particles[i], i, emitter);
            }
        }
    }

    private createParticle (emitter: ParticleEmitterWrapper, emitterMatrix: mat4) {
        let particle: Particle;

        if (particleStorage.length) {
            particle = particleStorage.pop();
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

        let width: number = this.interp.animVectorVal(emitter.props.Width, 0);
        let length: number = this.interp.animVectorVal(emitter.props.Length, 0);
        let speedScale: number = this.interp.animVectorVal(emitter.props.Speed, 0);
        let variation: number = this.interp.animVectorVal(emitter.props.Variation, 0);
        let latitude: number = degToRad(this.interp.animVectorVal(emitter.props.Latitude, 0));

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
        let globalT: number = 1 - particle.lifeSpan / emitter.props.LifeSpan;
        let firstHalf: boolean = globalT < emitter.props.Time;
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

        scale = lerp(firstScale, secondScale, t);

        if (emitter.type & ParticleEmitter2FramesFlags.Head) {
            for (let i = 0; i < 4; ++i) {
                emitter.headVertices[index * 12 + i * 3]     = this.particleBaseVectors[i][0] * scale;
                emitter.headVertices[index * 12 + i * 3 + 1] = this.particleBaseVectors[i][1] * scale;
                emitter.headVertices[index * 12 + i * 3 + 2] = this.particleBaseVectors[i][2] * scale;

                if (emitter.props.Flags & ParticleEmitter2Flags.XYQuad) {
                    let x = emitter.headVertices[index * 12 + i * 3];
                    let y = emitter.headVertices[index * 12 + i * 3 + 1];
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
        let firstFrame = uvAnim[0];
        let secondFrame = uvAnim[1];
        let frame = Math.round(lerp(firstFrame, secondFrame, t));
        let texCoordX = frame % emitter.props.Columns;
        let texCoordY = Math.floor(frame / emitter.props.Rows);
        let cellWidth = 1 / emitter.props.Columns;
        let cellHeight = 1 / emitter.props.Rows;

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
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, DISCARD_ALPHA_KEY_LEVEL);
        } else if (emitter.props.FilterMode === ParticleEmitter2FilterMode.Modulate ||
            emitter.props.FilterMode === ParticleEmitter2FilterMode.Modulate2x) {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, DISCARD_MODULATE_LEVEL);
        } else {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, 0.);
        }

        if (emitter.props.FilterMode === ParticleEmitter2FilterMode.Blend) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);
        } else if (emitter.props.FilterMode === ParticleEmitter2FilterMode.Additive) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false);
        } else if (emitter.props.FilterMode === ParticleEmitter2FilterMode.AlphaKey) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false);
        } else if (emitter.props.FilterMode === ParticleEmitter2FilterMode.Modulate) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ZERO, gl.ONE);
            gl.depthMask(false);
        } else if (emitter.props.FilterMode === ParticleEmitter2FilterMode.Modulate2x) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.DST_COLOR, gl.SRC_COLOR, gl.ZERO, gl.ONE);
            gl.depthMask(false);
        }

        let texture = this.rendererData.model.Textures[emitter.props.TextureID];
        if (texture.Image) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.rendererData.textures[texture.Image]);
            gl.uniform1i(shaderProgramLocations.samplerUniform, 0);
            gl.uniform1f(shaderProgramLocations.replaceableTypeUniform, 0);
        } else if (texture.ReplaceableId === 1 || texture.ReplaceableId === 2) {
            gl.uniform3fv(shaderProgramLocations.replaceableColorUniform, this.rendererData.teamColor);
            gl.uniform1f(shaderProgramLocations.replaceableTypeUniform, texture.ReplaceableId);
        }
    }

    private setGeneralBuffers (emitter: ParticleEmitterWrapper): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, emitter.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, emitter.colors, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(shaderProgramLocations.colorAttribute, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, emitter.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, emitter.indices, gl.DYNAMIC_DRAW);
    }

    private renderEmitterType (emitter: ParticleEmitterWrapper, type: ParticleEmitter2FramesFlags): void {
        if (type === ParticleEmitter2FramesFlags.Tail) {
            gl.bindBuffer(gl.ARRAY_BUFFER, emitter.tailTexCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, emitter.tailTexCoords, gl.DYNAMIC_DRAW);
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, emitter.headTexCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, emitter.headTexCoords, gl.DYNAMIC_DRAW);
        }
        gl.vertexAttribPointer(shaderProgramLocations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        if (type === ParticleEmitter2FramesFlags.Tail) {
            gl.bindBuffer(gl.ARRAY_BUFFER, emitter.tailVertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, emitter.tailVertices, gl.DYNAMIC_DRAW);
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, emitter.headVertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, emitter.headVertices, gl.DYNAMIC_DRAW);
        }
        gl.vertexAttribPointer(shaderProgramLocations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

        gl.drawElements(gl.TRIANGLES, emitter.particles.length * 6, gl.UNSIGNED_SHORT, 0);
    }
}
