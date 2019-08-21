import {
    Model, Node, AnimVector, NodeFlags, Layer, LayerShading, FilterMode,
    TextureFlags, TVertexAnim, Geoset
} from '../model';
import {vec3, quat, mat3, mat4} from 'gl-matrix';
import {mat4fromRotationOrigin, getShader} from './util';
import {ModelInterp} from './modelInterp';
import {ParticlesController} from './particles';
import {RendererData, NodeWrapper} from './rendererData';
import {RibbonsController} from './ribbons';

const MAX_NODES = 256;

let gl: WebGLRenderingContext;
let shaderProgram: WebGLProgram;
let shaderProgramLocations: any = {};
let anisotropicExt: any;

const vertexShaderHardwareSkinning = `
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

const vertexShaderSoftwareSkinning = `
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
let tempTransformedPivotPoint: vec3 = vec3.create();
let tempAxis: vec3 = vec3.create();
let tempLockQuat: quat = quat.create();
let tempLockMat: mat4 = mat4.create();
let tempXAxis: vec3 = vec3.create();
let tempCameraVec: vec3 = vec3.create();
let tempCross0: vec3 = vec3.create();
let tempCross1: vec3 = vec3.create();

let tempPos: vec3 = vec3.create();
let tempSum: vec3 = vec3.create();
let tempVec3: vec3 = vec3.create();

let identifyMat3: mat3 = mat3.create();
let texCoordMat4: mat4 = mat4.create();
let texCoordMat3: mat3 = mat3.create();

export class ModelRenderer {
    private model: Model;
    private interp: ModelInterp;
    private rendererData: RendererData;
    private particlesController: ParticlesController;
    private ribbonsController: RibbonsController;

    private softwareSkinning: boolean;
    private vertexBuffer: WebGLBuffer[] = [];
    private vertices: Float32Array[] = []; // Array per geoset for software skinning
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
            cameraPos: null,
            cameraQuat: null,
            textures: {}
        };

        this.rendererData.teamColor = vec3.fromValues(1., 0., 0.);
        this.rendererData.cameraPos = vec3.create();
        this.rendererData.cameraQuat = quat.create();

        this.setSequence(0);

        this.rendererData.rootNode = {
            // todo
            node: {} as Node,
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
            if (!node.Parent && node.Parent !== 0) {
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
        this.ribbonsController = new RibbonsController(this.interp, this.rendererData);
    }

    public initGL (glContext: WebGLRenderingContext): void {
        gl = glContext;
        // Max bones + MV + P
        this.softwareSkinning = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) < 4 * (MAX_NODES + 2);
        anisotropicExt = (
            gl.getExtension('EXT_texture_filter_anisotropic') ||
            gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
        );
        this.initShaders();
        this.initBuffers();
        ParticlesController.initGL(glContext);
        RibbonsController.initGL(glContext);
    }

    public setTextureImage (path: string, img: HTMLImageElement, flags: TextureFlags): void {
        this.rendererData.textures[path] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.rendererData.textures[path]);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        this.setTextureParameters(flags);

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    public setTextureImageData (path: string, imageData: ImageData[], flags: TextureFlags): void {
        this.rendererData.textures[path] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.rendererData.textures[path]);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        for (let i = 0; i < imageData.length; ++i) {
            gl.texImage2D(gl.TEXTURE_2D, i, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData[i]);
        }
        this.setTextureParameters(flags);

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    public setCamera (cameraPos: vec3, cameraQuat: quat): void {
        vec3.copy(this.rendererData.cameraPos, cameraPos);
        quat.copy(this.rendererData.cameraQuat, cameraQuat);
    }

    public setSequence (index: number): void {
        this.rendererData.animation = index;
        this.rendererData.animationInfo = this.model.Sequences[this.rendererData.animation];
        this.rendererData.frame = this.rendererData.animationInfo.Interval[0];
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

        for (let i = 0; i < this.rendererData.materialLayerTextureID.length; ++i) {
            for (let j = 0; j < this.rendererData.materialLayerTextureID[i].length; ++j) {
                this.updateLayerTextureId(i, j);
            }
        }
    }

    public render (mvMatrix: mat4, pMatrix: mat4): void {
        gl.useProgram(shaderProgram);

        gl.uniformMatrix4fv(shaderProgramLocations.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        gl.enableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);
        if (!this.softwareSkinning) {
            gl.enableVertexAttribArray(shaderProgramLocations.groupAttribute);
        }

        if (!this.softwareSkinning) {
            for (let j = 0; j < MAX_NODES; ++j) {
                if (this.rendererData.nodes[j]) {
                    gl.uniformMatrix4fv(shaderProgramLocations.nodesMatricesAttributes[j], false,
                        this.rendererData.nodes[j].matrix);
                }
            }
        }

        for (let i = 0; i < this.model.Geosets.length; ++i) {
            if (this.rendererData.geosetAlpha[i] < 1e-6) {
                continue;
            }

            if (this.softwareSkinning) {
                this.generateGeosetVertices(i);
            }

            let materialID = this.model.Geosets[i].MaterialID;
            let material = this.model.Materials[materialID];

            for (let j = 0; j < material.Layers.length; ++j) {
                this.setLayerProps(material.Layers[j], this.rendererData.materialLayerTextureID[materialID][j]);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                gl.vertexAttribPointer(shaderProgramLocations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
                gl.vertexAttribPointer(shaderProgramLocations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

                if (!this.softwareSkinning) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.groupBuffer[i]);
                    gl.vertexAttribPointer(shaderProgramLocations.groupAttribute, 4, gl.UNSIGNED_SHORT, false, 0, 0);
                }

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
                gl.drawElements(gl.TRIANGLES, this.model.Geosets[i].Faces.length, gl.UNSIGNED_SHORT, 0);
            }
        }

        gl.disableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.disableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);
        if (!this.softwareSkinning) {
            gl.disableVertexAttribArray(shaderProgramLocations.groupAttribute);
        }

        this.particlesController.render(mvMatrix, pMatrix);
        this.ribbonsController.render(mvMatrix, pMatrix);
    }

    private generateGeosetVertices (geosetIndex: number): void {
        let geoset: Geoset = this.model.Geosets[geosetIndex];
        let buffer = this.vertices[geosetIndex];

        for (let i = 0; i < buffer.length; i += 3) {
            let index = i / 3;
            let group = geoset.Groups[geoset.VertexGroup[index]];

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
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer[geosetIndex]);
        gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    }

    private setTextureParameters (flags: TextureFlags) {
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
    }

    private updateLayerTextureId (materialId: number, layerId: number): void {
        let TextureID: AnimVector|number = this.model.Materials[materialId].Layers[layerId].TextureID;

        if (typeof TextureID === 'number') {
            this.rendererData.materialLayerTextureID[materialId][layerId] = TextureID;
        } else {
            this.rendererData.materialLayerTextureID[materialId][layerId] = this.interp.num(TextureID);
        }
    }

    private initShaders (): void {
        if (shaderProgram) {
            return;
        }

        let vertex = getShader(gl, this.softwareSkinning ? vertexShaderSoftwareSkinning : vertexShaderHardwareSkinning,
            gl.VERTEX_SHADER);
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
        shaderProgramLocations.textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
        if (!this.softwareSkinning) {
            shaderProgramLocations.groupAttribute = gl.getAttribLocation(shaderProgram, 'aGroup');
        }

        shaderProgramLocations.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
        shaderProgramLocations.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        shaderProgramLocations.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');
        shaderProgramLocations.replaceableColorUniform = gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        shaderProgramLocations.replaceableTypeUniform = gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        shaderProgramLocations.discardAlphaLevelUniform = gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
        shaderProgramLocations.tVertexAnimUniform = gl.getUniformLocation(shaderProgram, 'uTVextexAnim');

        if (!this.softwareSkinning) {
            shaderProgramLocations.nodesMatricesAttributes = [];
            for (let i = 0; i < MAX_NODES; ++i) {
                shaderProgramLocations.nodesMatricesAttributes[i] =
                    gl.getUniformLocation(shaderProgram, `uNodesMatrices[${i}]`);
            }
        }
    }

    private initBuffers (): void {
        for (let i = 0; i < this.model.Geosets.length; ++i) {
            this.vertexBuffer[i] = gl.createBuffer();
            if (this.softwareSkinning) {
                this.vertices[i] = new Float32Array(this.model.Geosets[i].Vertices.length);
            } else {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                gl.bufferData(gl.ARRAY_BUFFER, this.model.Geosets[i].Vertices, gl.STATIC_DRAW);
            }

            this.texCoordBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
            gl.bufferData(gl.ARRAY_BUFFER, this.model.Geosets[i].TVertices[0], gl.STATIC_DRAW);

            if (!this.softwareSkinning) {
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
            }

            this.indexBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.model.Geosets[i].Faces, gl.STATIC_DRAW);
        }
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
        let translationRes = this.interp.vec3(translation, node.node.Translation);
        let rotationRes = this.interp.quat(rotation, node.node.Rotation);
        let scalingRes = this.interp.vec3(scaling, node.node.Scaling);

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

        let billboardedLock = node.node.Flags & NodeFlags.BillboardedLockX ||
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
