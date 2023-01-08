import {getShader} from './util';
import {RendererData} from './rendererData';
import {ModelInterp} from './modelInterp';
import {FilterMode, Layer, LayerShading, Material, RibbonEmitter} from '../model';
import {mat4, vec3} from 'gl-matrix';

const vertexShader = `
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec2 vTextureCoord;

    void main(void) {
        vec4 position = vec4(aVertexPosition, 1.0);
        gl_Position = uPMatrix * uMVMatrix * position;
        vTextureCoord = aTextureCoord;
    }
`;

const fragmentShader = `
    precision mediump float;

    varying vec2 vTextureCoord;

    uniform sampler2D uSampler;
    uniform vec3 uReplaceableColor;
    uniform float uReplaceableType;
    uniform float uDiscardAlphaLevel;
    uniform vec4 uColor;

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
        gl_FragColor *= uColor;
        
        if (gl_FragColor[3] < uDiscardAlphaLevel) {
            discard;
        }
    }
`;

interface RibbonEmitterWrapper {
    emission: number;
    props: RibbonEmitter;
    capacity: number;
    baseCapacity: number;
    creationTimes: number[];

    // xyz
    vertices: Float32Array;
    vertexBuffer: WebGLBuffer;
    // xy
    texCoords: Float32Array;
    texCoordBuffer: WebGLBuffer;
}

export class RibbonsController {
    private gl: WebGL2RenderingContext | WebGLRenderingContext;
    private shaderProgram: WebGLProgram;
    private vertexShader: WebGLShader;
    private fragmentShader: WebGLShader;

    private shaderProgramLocations: {
        vertexPositionAttribute: number,
        textureCoordAttribute: number,
        pMatrixUniform: WebGLUniformLocation | null,
        mvMatrixUniform: WebGLUniformLocation | null,
        samplerUniform: WebGLUniformLocation | null,
        replaceableColorUniform: WebGLUniformLocation | null,
        replaceableTypeUniform: WebGLUniformLocation | null,
        discardAlphaLevelUniform: WebGLUniformLocation | null,
        colorUniform: WebGLUniformLocation | null
    };

    private interp: ModelInterp;
    private rendererData: RendererData;
    private emitters: RibbonEmitterWrapper[];

    constructor (interp: ModelInterp, rendererData: RendererData) {
        this.shaderProgramLocations = {
            vertexPositionAttribute: null,
            textureCoordAttribute: null,
            pMatrixUniform: null,
            mvMatrixUniform: null,
            samplerUniform: null,
            replaceableColorUniform: null,
            replaceableTypeUniform: null,
            discardAlphaLevelUniform: null,
            colorUniform: null
        };

        this.interp = interp;
        this.rendererData = rendererData;
        this.emitters = [];

        if (rendererData.model.RibbonEmitters.length) {
            for (const ribbonEmitter of rendererData.model.RibbonEmitters) {
                const emitter: RibbonEmitterWrapper = {
                    emission: 0,
                    props: ribbonEmitter,
                    capacity: 0,
                    baseCapacity: 0,
                    creationTimes: [],
                    vertices: null,
                    vertexBuffer: null,
                    texCoords: null,
                    texCoordBuffer: null
                };

                emitter.baseCapacity = Math.ceil(
                    ModelInterp.maxAnimVectorVal(emitter.props.EmissionRate) * emitter.props.LifeSpan
                ) + 1; // extra points

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
        this.emitters = [];
    }

    public initGL (glContext: WebGLRenderingContext): void {
        this.gl = glContext;

        this.initShaders();
    }

    public update (delta: number): void {
        for (const emitter of this.emitters) {
            this.updateEmitter(emitter, delta);
        }
    }

    public render (mvMatrix: mat4, pMatrix: mat4): void {
        this.gl.useProgram(this.shaderProgram);

        this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform, false, pMatrix);
        this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute);
        this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);

        for (const emitter of this.emitters) {
            if (emitter.creationTimes.length < 2) {
                continue;
            }

            this.gl.uniform4f(
                this.shaderProgramLocations.colorUniform,
                emitter.props.Color[0], emitter.props.Color[1], emitter.props.Color[2],
                this.interp.animVectorVal(emitter.props.Alpha, 1)
            );

            this.setGeneralBuffers(emitter);
            const materialID: number = emitter.props.MaterialID;
            const material: Material = this.rendererData.model.Materials[materialID];
            for (let j = 0; j < material.Layers.length; ++j) {
                this.setLayerProps(material.Layers[j], this.rendererData.materialLayerTextureID[materialID][j]);
                this.renderEmitter(emitter);
            }
        }

        this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute);
        this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);
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

        this.shaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uPMatrix');
        this.shaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        this.shaderProgramLocations.samplerUniform = this.gl.getUniformLocation(shaderProgram, 'uSampler');
        this.shaderProgramLocations.replaceableColorUniform =
            this.gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        this.shaderProgramLocations.replaceableTypeUniform =
            this.gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        this.shaderProgramLocations.discardAlphaLevelUniform =
            this.gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
        this.shaderProgramLocations.colorUniform =
            this.gl.getUniformLocation(shaderProgram, 'uColor');
    }

    private resizeEmitterBuffers (emitter: RibbonEmitterWrapper, size: number): void {
        if (size <= emitter.capacity) {
            return;
        }

        size = Math.min(size, emitter.baseCapacity);

        const vertices = new Float32Array(size * 2 * 3);  // 2 vertices * xyz
        const texCoords = new Float32Array(size * 2 * 2); // 2 vertices * xy

        if (emitter.vertices) {
            vertices.set(emitter.vertices);
        }

        emitter.vertices = vertices;
        emitter.texCoords = texCoords;

        emitter.capacity = size;

        if (!emitter.vertexBuffer) {
            emitter.vertexBuffer = this.gl.createBuffer();
            emitter.texCoordBuffer = this.gl.createBuffer();
        }
    }

    private updateEmitter (emitter: RibbonEmitterWrapper, delta: number): void {
        const now = Date.now();
        const visibility = this.interp.animVectorVal(emitter.props.Visibility, 0);

        if (visibility > 0) {
            const emissionRate = emitter.props.EmissionRate;

            emitter.emission += emissionRate * delta;

            if (emitter.emission >= 1000) {
                // only once per tick
                emitter.emission = emitter.emission % 1000;

                if (emitter.creationTimes.length + 1 > emitter.capacity) {
                    this.resizeEmitterBuffers(emitter, emitter.creationTimes.length + 1);
                }

                this.appendVertices(emitter);

                emitter.creationTimes.push(now);
            }
        }

        if (emitter.creationTimes.length) {
            while (emitter.creationTimes[0] + emitter.props.LifeSpan * 1000 < now) {
                emitter.creationTimes.shift();
                for (let i = 0; i + 6 + 5 < emitter.vertices.length; i += 6) {
                    emitter.vertices[i]     = emitter.vertices[i + 6];
                    emitter.vertices[i + 1] = emitter.vertices[i + 7];
                    emitter.vertices[i + 2] = emitter.vertices[i + 8];
                    emitter.vertices[i + 3] = emitter.vertices[i + 9];
                    emitter.vertices[i + 4] = emitter.vertices[i + 10];
                    emitter.vertices[i + 5] = emitter.vertices[i + 11];
                }
            }
        }

        // still exists
        if (emitter.creationTimes.length) {
            this.updateEmitterTexCoords(emitter, now);
        }
    }

    private appendVertices (emitter: RibbonEmitterWrapper): void {
        const first: vec3 = vec3.clone(emitter.props.PivotPoint as vec3);
        const second: vec3 = vec3.clone(emitter.props.PivotPoint as vec3);

        first[1] -= this.interp.animVectorVal(emitter.props.HeightBelow, 0);
        second[1] += this.interp.animVectorVal(emitter.props.HeightAbove, 0);

        const emitterMatrix: mat4 = this.rendererData.nodes[emitter.props.ObjectId].matrix;
        vec3.transformMat4(first, first, emitterMatrix);
        vec3.transformMat4(second, second, emitterMatrix);

        const currentSize = emitter.creationTimes.length;
        emitter.vertices[currentSize * 6]     = first[0];
        emitter.vertices[currentSize * 6 + 1] = first[1];
        emitter.vertices[currentSize * 6 + 2] = first[2];
        emitter.vertices[currentSize * 6 + 3] = second[0];
        emitter.vertices[currentSize * 6 + 4] = second[1];
        emitter.vertices[currentSize * 6 + 5] = second[2];
    }

    private updateEmitterTexCoords (emitter: RibbonEmitterWrapper, now: number): void {
        for (let i = 0; i < emitter.creationTimes.length; ++i) {
            let relativePos = (now - emitter.creationTimes[i]) / (emitter.props.LifeSpan * 1000);
            const textureSlot = this.interp.animVectorVal(emitter.props.TextureSlot, 0);

            const texCoordX = textureSlot % emitter.props.Columns;
            const texCoordY = Math.floor(textureSlot / emitter.props.Rows);
            const cellWidth = 1 / emitter.props.Columns;
            const cellHeight = 1 / emitter.props.Rows;

            relativePos = texCoordX * cellWidth + relativePos * cellWidth;

            emitter.texCoords[i * 2 * 2]     = relativePos;
            emitter.texCoords[i * 2 * 2 + 1] = texCoordY * cellHeight;
            emitter.texCoords[i * 2 * 2 + 2] = relativePos;
            emitter.texCoords[i * 2 * 2 + 3] = (1 + texCoordY) * cellHeight;
        }
    }

    private setLayerProps (layer: Layer, textureID: number): void {
        const texture = this.rendererData.model.Textures[textureID];

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

        /*if (typeof layer.TVertexAnimId === 'number') {
            let anim: TVertexAnim = this.rendererData.model.TextureAnims[layer.TVertexAnimId];
            let translationRes = this.interp.vec3(translation, anim.Translation);
            let rotationRes = this.interp.quat(rotation, anim.Rotation);
            let scalingRes = this.interp.vec3(scaling, anim.Scaling);
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
        }*/
    }

    private setGeneralBuffers (emitter: RibbonEmitterWrapper): void {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, emitter.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, emitter.texCoords, this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, emitter.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, emitter.vertices, this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);
    }

    private renderEmitter (emitter: RibbonEmitterWrapper): void {
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, emitter.creationTimes.length * 2);
    }
}
