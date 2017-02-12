import {
    Model, Node, AnimVector, NodeFlags, Layer, LayerShading, FilterMode,
    TextureFlags, TVertexAnim
} from '../model';
import {vec3, quat, mat3, mat4} from 'gl-matrix';
import {mat4fromRotationOrigin, getShader} from './util';
import {ModelInterp} from './modelInterp';
import {ParticlesController} from './particles';
import {RendererData, NodeWrapper} from './rendererData';

const MAX_NODES = 128;

let gl: WebGLRenderingContext;
let shaderProgram: WebGLProgram;
let shaderProgramLocations: any = {};
let anisotropicExt: any;

const vertexShader = `
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;
    attribute vec4 aGroup;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    uniform mat4 uNodesMatrices[${MAX_NODES}];

    varying vec2 vTextureCoord;

    void main(void) {
        vec4 position = vec4(aVertexPosition, 1.0);
        int count = 1;
        vec4 sum = uNodesMatrices[int(aGroup[0])] * position;

        if (aGroup[1] < ${MAX_NODES}.) {
            sum += uNodesMatrices[int(aGroup[1])] * position;
            count += 1;
        }
        if (aGroup[2] < ${MAX_NODES}.) {
            sum += uNodesMatrices[int(aGroup[2])] * position;
            count += 1;
        }
        if (aGroup[3] < ${MAX_NODES}.) {
            sum += uNodesMatrices[int(aGroup[3])] * position;
            count += 1;
        }
        sum.xyz /= float(count);
        sum.w = 1.;
        position = sum;

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
    uniform mat3 uTVextexAnim;

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
        vec2 texCoord = (uTVextexAnim * vec3(vTextureCoord.s, vTextureCoord.t, 1.)).st;

        if (uReplaceableType == 0.) {
            gl_FragColor = texture2D(uSampler, texCoord);
        } else if (uReplaceableType == 1.) {
            gl_FragColor = vec4(uReplaceableColor, 1.0);
        } else if (uReplaceableType == 2.) {
            float dist = hypot(texCoord - vec2(0.5, 0.5)) * 2.;
            float truncateDist = clamp(1. - dist * 1.4, 0., 1.);
            float alpha = sin(truncateDist);
            gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);
        }

        // hand-made alpha-test
        if (gl_FragColor[3] < uDiscardAlphaLevel) {
            discard;
        }
    }
`;

let translation = vec3.create();
let rotation = quat.create();
let scaling = vec3.create();

let defaultTranslation = vec3.fromValues(0, 0, 0);
let defaultRotation = quat.fromValues(0, 0, 0, 1);
let defaultScaling = vec3.fromValues(1, 1, 1);

let tempParentRotationQuat: quat = quat.create();
let tempParentRotationMat: mat4 = mat4.create();
let tempCameraMat: mat4 = mat4.create();

let identifyMat3: mat3 = mat3.create();
let texCoordMat4: mat4 = mat4.create();
let texCoordMat3: mat3 = mat3.create();

export class ModelRenderer {
    private static initShaders (): void {
        if (shaderProgram) {
            return;
        }

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

        shaderProgramLocations.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        gl.enableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);

        shaderProgramLocations.textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
        gl.enableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);

        shaderProgramLocations.groupAttribute = gl.getAttribLocation(shaderProgram, 'aGroup');
        gl.enableVertexAttribArray(shaderProgramLocations.groupAttribute);

        shaderProgramLocations.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
        shaderProgramLocations.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        shaderProgramLocations.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');
        shaderProgramLocations.replaceableColorUniform = gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        shaderProgramLocations.replaceableTypeUniform = gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        shaderProgramLocations.discardAlphaLevelUniform = gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
        shaderProgramLocations.tVertexAnimUniform = gl.getUniformLocation(shaderProgram, 'uTVextexAnim');

        shaderProgramLocations.nodesMatricesAttributes = [];
        for (let i = 0; i < MAX_NODES; ++i) {
            shaderProgramLocations.nodesMatricesAttributes[i] =
                gl.getUniformLocation(shaderProgram, `uNodesMatrices[${i}]`);
        }
    }

    private model: Model;
    private interp: ModelInterp;
    private rendererData: RendererData;
    private particlesController: ParticlesController;

    private vertexBuffer: WebGLBuffer[] = [];
    private texCoordBuffer: WebGLBuffer[] = [];
    private indexBuffer: WebGLBuffer[] = [];
    private groupBuffer: WebGLBuffer[] = [];

    constructor(model: Model) {
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
            teamColor: null,
            cameraQuat: null,
            textures: {}
        };

        this.rendererData.teamColor = vec3.fromValues(1., 0., 0.);
        this.rendererData.cameraQuat = quat.create();

        this.rendererData.animation = Object.keys(model.Sequences)[0];
        this.rendererData.animationInfo = model.Sequences[this.rendererData.animation];
        this.rendererData.frame = this.rendererData.animationInfo.Interval[0];

        this.rendererData.rootNode = {
            // todo
            node: <Node> {},
            matrix: mat4.create(),
            childs: []
        };
        for (let node of model.Nodes) {
            this.rendererData.nodes[node.ObjectId] = {
                node,
                matrix: mat4.create(),
                childs: []
            };
        }
        for (let node of model.Nodes) {
            if (!node.Parent) {
                this.rendererData.rootNode.childs.push(this.rendererData.nodes[node.ObjectId]);
            } else {
                this.rendererData.nodes[node.Parent].childs.push(this.rendererData.nodes[node.ObjectId]);
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
        }

        this.interp = new ModelInterp(this.rendererData);
        this.particlesController = new ParticlesController(this.interp, this.rendererData);
    }

    public initGL (glContext: WebGLRenderingContext): void {
        gl = glContext;
        anisotropicExt = (
            gl.getExtension('EXT_texture_filter_anisotropic') ||
            gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
        );
        ModelRenderer.initShaders();
        this.initBuffers();
        ParticlesController.initGL(glContext);
    }

    public setTexture (path: string, img: HTMLImageElement, flags: TextureFlags): void {
        this.rendererData.textures[path] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.rendererData.textures[path]);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        if (flags & TextureFlags.WrapWidth) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        }
        if (flags & TextureFlags.WrapHeight) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

        if (anisotropicExt) {
            let max = gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            gl.texParameterf(gl.TEXTURE_2D, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    public setCameraQuat (cameraQuat: quat): void {
        quat.copy(this.rendererData.cameraQuat, cameraQuat);
    }

    public update (delta: number): void {
        this.rendererData.frame += delta;
        if (this.rendererData.frame > this.rendererData.animationInfo.Interval[1]) {
            this.rendererData.frame = this.rendererData.animationInfo.Interval[0];
            this.resetGlobalSequences();
        } else {
            this.updateGlobalSequences(delta);
        }

        this.particlesController.update(delta);

        this.updateNode(this.rendererData.rootNode);

        for (let i = 0; i < this.model.Geosets.length; ++i) {
            this.rendererData.geosetAlpha[i] = this.findAlpha(i);
        }

        for (let i = 0; i < this.rendererData.materialLayerTextureID.length; ++i) {
            for (let j = 0; j < this.rendererData.materialLayerTextureID[i].length; ++j) {
                let TextureID: AnimVector|number = this.model.Materials[i].Layers[j].TextureID;

                if (typeof TextureID === 'number') {
                    this.rendererData.materialLayerTextureID[i][j] = TextureID;
                } else {
                    this.rendererData.materialLayerTextureID[i][j] = this.interp.num(TextureID);
                }
            }
        }
    }

    public render (mvMatrix: mat4, pMatrix: mat4): void {
        gl.useProgram(shaderProgram);

        gl.uniformMatrix4fv(shaderProgramLocations.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        for (let j = 0; j < MAX_NODES; ++j) {
            if (this.rendererData.nodes[j]) {
                gl.uniformMatrix4fv(shaderProgramLocations.nodesMatricesAttributes[j], false,
                    this.rendererData.nodes[j].matrix);
            }
        }

        for (let i = 0; i < this.model.Geosets.length; ++i) {
            if (this.rendererData.geosetAlpha[i] < 1e-6) {
                continue;
            }

            let materialID = this.model.Geosets[i].MaterialID;
            let material = this.model.Materials[materialID];

            for (let j = 0; j < material.Layers.length; ++j) {
                this.setLayerProps(material.Layers[j], this.rendererData.materialLayerTextureID[materialID][j]);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                gl.vertexAttribPointer(shaderProgramLocations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
                gl.vertexAttribPointer(shaderProgramLocations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.groupBuffer[i]);
                gl.vertexAttribPointer(shaderProgramLocations.groupAttribute, 4, gl.UNSIGNED_SHORT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
                gl.drawElements(gl.TRIANGLES, this.model.Geosets[i].Faces.length, gl.UNSIGNED_SHORT, 0);
            }
        }

        this.particlesController.render(mvMatrix, pMatrix);
    }

    private initBuffers (): void {
        for (let i = 0; i < this.model.Geosets.length; ++i) {
            this.vertexBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer[i]);
            gl.bufferData(gl.ARRAY_BUFFER, this.model.Geosets[i].Vertices, gl.STATIC_DRAW);

            this.texCoordBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
            gl.bufferData(gl.ARRAY_BUFFER, this.model.Geosets[i].TVertices, gl.STATIC_DRAW);

            this.groupBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.groupBuffer[i]);
            let buffer = new Uint16Array(this.model.Geosets[i].VertexGroup.length * 4);
            for (let j = 0; j < buffer.length; j += 4) {
                let index = j / 4;
                let group = this.model.Geosets[i].Groups[this.model.Geosets[i].VertexGroup[index]];
                buffer[j] = group[0];
                buffer[j + 1] = group.length > 1 ? group[1] : MAX_NODES;
                buffer[j + 2] = group.length > 2 ? group[2] : MAX_NODES;
                buffer[j + 3] = group.length > 3 ? group[3] : MAX_NODES;
            }
            gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);

            this.indexBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.model.Geosets[i].Faces, gl.STATIC_DRAW);
        }
    }

    private resetGlobalSequences (): void {
        for (let i = 0; i < this.rendererData.globalSequencesFrames.length; ++i) {
            this.rendererData.globalSequencesFrames[i] = 0;
        }
    }

    private updateGlobalSequences (delta: number): void {
        for (let i = 0; i < this.rendererData.globalSequencesFrames.length; ++i) {
            this.rendererData.globalSequencesFrames[i] += delta;
            if (this.rendererData.globalSequencesFrames[i] > this.model.GlobalSequences[i]) {
                this.rendererData.globalSequencesFrames[i] = 0;
            }
        }
    }

    private updateNode (node: NodeWrapper): void {
        let translationRes = this.interp.vec3(translation, node.node.Translation);
        let rotationRes = this.interp.quat(rotation, node.node.Rotation);
        let scalingRes = this.interp.vec3(scaling, node.node.Scaling);

        if (!translationRes && !rotationRes && !scalingRes) {
            mat4.identity(node.matrix);
        } else if (translationRes && !rotationRes && !scalingRes) {
            mat4.fromTranslation(node.matrix, translationRes);
        } else if (!translationRes && rotationRes && !scalingRes) {
            mat4fromRotationOrigin(node.matrix, rotationRes, <vec3> node.node.PivotPoint);
        } else {
            mat4.fromRotationTranslationScaleOrigin(node.matrix,
                rotationRes || defaultRotation,
                translationRes || defaultTranslation,
                scalingRes || defaultScaling,
                <vec3> node.node.PivotPoint
            );
        }

        if (node.node.Parent) {
            mat4.mul(node.matrix, this.rendererData.nodes[node.node.Parent].matrix, node.matrix);
        }

        if (node.node.Flags & NodeFlags.Billboarded) {
            if (node.node.Parent) {
                // cancel parent rotation from PivotPoint
                mat4.getRotation(tempParentRotationQuat, this.rendererData.nodes[node.node.Parent].matrix);
                mat4fromRotationOrigin(tempParentRotationMat, tempParentRotationQuat, <vec3> node.node.PivotPoint);
                mat4.mul(node.matrix, node.matrix, tempParentRotationMat);
            }
            // rotate to camera
            mat4fromRotationOrigin(tempCameraMat, this.rendererData.cameraQuat, <vec3> node.node.PivotPoint);
            mat4.mul(node.matrix, node.matrix, tempCameraMat);
        }

        for (let child of node.childs) {
            this.updateNode(child);
        }
    }

    private findAlpha (geosetId: number): number {
        let geosetAnim = this.rendererData.geosetAnims[geosetId];

        if (!geosetAnim || geosetAnim.Alpha === undefined) {
            return 1;
        }

        if (typeof geosetAnim.Alpha === 'number') {
            return geosetAnim.Alpha;
        }

        let interpRes = this.interp.num(geosetAnim.Alpha);

        if (interpRes === null) {
            return 1;
        }
        return interpRes;
    }

    private setLayerProps (layer: Layer, textureID: number): void {
        let texture = this.model.Textures[textureID];

        if (layer.Shading === LayerShading.TwoSided) {
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

        if (layer.Shading === LayerShading.NoDepthTest) {
            gl.disable(gl.DEPTH_TEST);
        }
        if (layer.Shading === LayerShading.NoDepthSet) {
            gl.depthMask(false);
        }

        if (typeof layer.TVertexAnimId === 'number') {
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
        }
    }
}
