import {getShader} from './util';
import {RendererData} from './rendererData';
import {ModelInterp} from './modelInterp';
import {FilterMode, Layer, LayerShading, Material, RibbonEmitter} from '../model';
import {mat4, vec3} from 'gl-matrix';
let gl: WebGLRenderingContext;
let shaderProgram: WebGLProgram;
let shaderProgramLocations: any = {};

let vertexShader = `
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

let fragmentShader = `
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
    public static initGL (glContext: WebGLRenderingContext) {
        gl = glContext;

        RibbonsController.initShaders();
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

        shaderProgramLocations.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
        shaderProgramLocations.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        shaderProgramLocations.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');
        shaderProgramLocations.replaceableColorUniform =
            gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        shaderProgramLocations.replaceableTypeUniform =
            gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        shaderProgramLocations.discardAlphaLevelUniform =
            gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
        shaderProgramLocations.colorUniform =
            gl.getUniformLocation(shaderProgram, 'uColor');
    }

    private static resizeEmitterBuffers (emitter: RibbonEmitterWrapper, size: number): void {
        if (size <= emitter.capacity) {
            return;
        }

        size = Math.min(size, emitter.baseCapacity);

        let vertices = new Float32Array(size * 2 * 3);  // 2 vertices * xyz
        let texCoords = new Float32Array(size * 2 * 2); // 2 vertices * xy

        if (emitter.vertices) {
            vertices.set(emitter.vertices);
        }

        emitter.vertices = vertices;
        emitter.texCoords = texCoords;

        emitter.capacity = size;

        if (!emitter.vertexBuffer) {
            emitter.vertexBuffer = gl.createBuffer();
            emitter.texCoordBuffer = gl.createBuffer();
        }
    }

    private interp: ModelInterp;
    private rendererData: RendererData;
    private emitters: RibbonEmitterWrapper[];

    constructor (interp: ModelInterp, rendererData: RendererData) {
        this.interp = interp;
        this.rendererData = rendererData;
        this.emitters = [];

        if (rendererData.model.RibbonEmitters) {
            for (let i in rendererData.model.RibbonEmitters) {
                if (rendererData.model.RibbonEmitters.hasOwnProperty(i)) {
                    let emitter: RibbonEmitterWrapper = {
                        emission: 0,
                        props: rendererData.model.RibbonEmitters[i],
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
    }

    public update (delta: number): void {
        for (let emitter of this.emitters) {
            this.updateEmitter(emitter, delta);
        }
    }

    public render (mvMatrix: mat4, pMatrix: mat4): void {
        gl.useProgram(shaderProgram);

        gl.uniformMatrix4fv(shaderProgramLocations.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        gl.enableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);

        for (let emitter of this.emitters) {
            if (emitter.creationTimes.length < 2) {
                continue;
            }

            gl.uniform4f(shaderProgramLocations.colorUniform,
                emitter.props.Color[0], emitter.props.Color[1], emitter.props.Color[2],
                this.interp.animVectorVal(emitter.props.Alpha, 1)
            );

            this.setGeneralBuffers(emitter);
            let materialID: number = emitter.props.MaterialID;
            let material: Material = this.rendererData.model.Materials[materialID];
            for (let j = 0; j < material.Layers.length; ++j) {
                this.setLayerProps(material.Layers[j], this.rendererData.materialLayerTextureID[materialID][j]);
                this.renderEmitter(emitter);
            }
        }

        gl.disableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.disableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);
    }

    private updateEmitter (emitter: RibbonEmitterWrapper, delta: number): void {
        let now = Date.now();
        let visibility = this.interp.animVectorVal(emitter.props.Visibility, 1);

        if (visibility > 0) {
            let emissionRate = emitter.props.EmissionRate;

            emitter.emission += emissionRate * delta;

            if (emitter.emission >= 1000) {
                // only once per tick
                emitter.emission = emitter.emission % 1000;

                if (emitter.creationTimes.length + 1 > emitter.capacity) {
                    RibbonsController.resizeEmitterBuffers(emitter, emitter.creationTimes.length + 1);
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
        let first: vec3 = vec3.clone(emitter.props.PivotPoint as vec3);
        let second: vec3 = vec3.clone(emitter.props.PivotPoint as vec3);

        first[1] -= this.interp.animVectorVal(emitter.props.HeightBelow, 0);
        second[1] += this.interp.animVectorVal(emitter.props.HeightAbove, 0);

        let emitterMatrix: mat4 = this.rendererData.nodes[emitter.props.ObjectId].matrix;
        vec3.transformMat4(first, first, emitterMatrix);
        vec3.transformMat4(second, second, emitterMatrix);

        let currentSize = emitter.creationTimes.length;
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
            let textureSlot = this.interp.animVectorVal(emitter.props.TextureSlot, 0);

            let texCoordX = textureSlot % emitter.props.Columns;
            let texCoordY = Math.floor(textureSlot / emitter.props.Rows);
            let cellWidth = 1 / emitter.props.Columns;
            let cellHeight = 1 / emitter.props.Rows;

            relativePos = texCoordX * cellWidth + relativePos * cellWidth;

            emitter.texCoords[i * 2 * 2]     = relativePos;
            emitter.texCoords[i * 2 * 2 + 1] = texCoordY * cellHeight;
            emitter.texCoords[i * 2 * 2 + 2] = relativePos;
            emitter.texCoords[i * 2 * 2 + 3] = (1 + texCoordY) * cellHeight;
        }
    }

    private setLayerProps (layer: Layer, textureID: number): void {
        let texture = this.rendererData.model.Textures[textureID];

        if (layer.Shading & LayerShading.TwoSided) {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
        }

        if (layer.FilterMode === FilterMode.Transparent) {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, 0.75);
        } else {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, 0.);
        }

        if (layer.FilterMode === FilterMode.None) {
            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(true);
        } else if (layer.FilterMode === FilterMode.Transparent) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(true);
        } else if (layer.FilterMode === FilterMode.Blend) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.Additive) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_COLOR, gl.ONE);
            gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.AddAlpha) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.Modulate) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ZERO, gl.ONE);
            gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.Modulate2x) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.DST_COLOR, gl.SRC_COLOR, gl.ZERO, gl.ONE);
            gl.depthMask(false);
        }

        if (texture.Image) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.rendererData.textures[texture.Image]);
            gl.uniform1i(shaderProgramLocations.samplerUniform, 0);
            gl.uniform1f(shaderProgramLocations.replaceableTypeUniform, 0);
        } else if (texture.ReplaceableId === 1 || texture.ReplaceableId === 2) {
            gl.uniform3fv(shaderProgramLocations.replaceableColorUniform, this.rendererData.teamColor);
            gl.uniform1f(shaderProgramLocations.replaceableTypeUniform, texture.ReplaceableId);
        }

        if (layer.Shading & LayerShading.NoDepthTest) {
            gl.disable(gl.DEPTH_TEST);
        }
        if (layer.Shading & LayerShading.NoDepthSet) {
            gl.depthMask(false);
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

            gl.uniformMatrix3fv(shaderProgramLocations.tVertexAnimUniform, false, texCoordMat3);
        } else {
            gl.uniformMatrix3fv(shaderProgramLocations.tVertexAnimUniform, false, identifyMat3);
        }*/
    }

    private setGeneralBuffers (emitter: RibbonEmitterWrapper): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, emitter.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, emitter.texCoords, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(shaderProgramLocations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, emitter.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, emitter.vertices, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(shaderProgramLocations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    }

    private renderEmitter (emitter: RibbonEmitterWrapper): void {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, emitter.creationTimes.length * 2);
    }
}
