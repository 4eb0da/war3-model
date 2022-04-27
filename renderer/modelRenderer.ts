import {
    Model, Node, AnimVector, NodeFlags, Layer, LayerShading, FilterMode,
    TextureFlags, TVertexAnim, Geoset
} from '../model';
import {vec3, quat, mat3, mat4} from 'gl-matrix';
import parseDds from 'parse-dds';
import {mat4fromRotationOrigin, getShader, isWebGL2} from './util';
import {ModelInterp} from './modelInterp';
import {ParticlesController} from './particles';
import {RendererData, NodeWrapper} from './rendererData';
import {RibbonsController} from './ribbons';

// actually, all is number
type DDS_FORMAT = WEBGL_compressed_texture_s3tc['COMPRESSED_RGBA_S3TC_DXT1_EXT'] | 
    WEBGL_compressed_texture_s3tc['COMPRESSED_RGBA_S3TC_DXT3_EXT'] | 
    WEBGL_compressed_texture_s3tc['COMPRESSED_RGBA_S3TC_DXT5_EXT'] | 
    WEBGL_compressed_texture_s3tc['COMPRESSED_RGB_S3TC_DXT1_EXT'];

const MAX_NODES = 256;

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

const skeletonVertexShader = `
    attribute vec3 aVertexPosition;
    attribute vec3 aColor;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec3 vColor;

    void main(void) {
        vec4 position = vec4(aVertexPosition, 1.0);
        gl_Position = uPMatrix * uMVMatrix * position;
        vColor = aColor;
    }
`;

const skeletonFragmentShader = `
    precision mediump float;

    varying vec3 vColor;

    void main(void) {
        gl_FragColor = vec4(vColor, 1.0);
    }
`;

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

export class ModelRenderer {
    private gl: WebGL2RenderingContext | WebGLRenderingContext;
    private anisotropicExt: EXT_texture_filter_anisotropic | null;
    private vertexShader: WebGLShader | null;
    private fragmentShader: WebGLShader | null;
    private shaderProgram: WebGLProgram | null;
    private shaderProgramLocations: {
        vertexPositionAttribute: number | null;
        textureCoordAttribute: number | null;
        groupAttribute: number | null;
        pMatrixUniform: WebGLUniformLocation | null;
        mvMatrixUniform: WebGLUniformLocation | null;
        samplerUniform: WebGLUniformLocation | null;
        replaceableColorUniform: WebGLUniformLocation | null;
        replaceableTypeUniform: WebGLUniformLocation | null;
        discardAlphaLevelUniform: WebGLUniformLocation | null;
        tVertexAnimUniform: WebGLUniformLocation | null;
        nodesMatricesAttributes: (WebGLUniformLocation | null)[];
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
    private wireframeIndexBuffer: WebGLBuffer[] = [];
    private groupBuffer: WebGLBuffer[] = [];

    constructor(model: Model) {
        this.shaderProgramLocations = {
            vertexPositionAttribute: null,
            textureCoordAttribute: null,
            groupAttribute: null,
            pMatrixUniform: null,
            mvMatrixUniform: null,
            samplerUniform: null,
            replaceableColorUniform: null,
            replaceableTypeUniform: null,
            discardAlphaLevelUniform: null,
            tVertexAnimUniform: null,
            nodesMatricesAttributes: null
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
        for (const node of model.Nodes) {
            this.rendererData.nodes[node.ObjectId] = {
                node,
                matrix: mat4.create(),
                childs: []
            };
        }
        for (const node of model.Nodes) {
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

    public destroy () {
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
    }

    public initGL (glContext: WebGLRenderingContext): void {
        this.gl = glContext;
        // Max bones + MV + P
        this.softwareSkinning = this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS) < 4 * (MAX_NODES + 2);
        this.anisotropicExt = (
            this.gl.getExtension('EXT_texture_filter_anisotropic') ||
            this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
        );
        this.initShaders();
        this.initBuffers();
        ParticlesController.initGL(glContext);
        RibbonsController.initGL(glContext);
    }

    public setTextureImage (path: string, img: HTMLImageElement, flags: TextureFlags): void {
        this.rendererData.textures[path] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);
        // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
        this.setTextureParameters(flags, true);

        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    public setTextureImageData (path: string, imageData: ImageData[], flags: TextureFlags): void {
        this.rendererData.textures[path] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);
        // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        for (let i = 0; i < imageData.length; ++i) {
            this.gl.texImage2D(this.gl.TEXTURE_2D, i, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, imageData[i]);
        }
        this.setTextureParameters(flags, false);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    public setTextureCompressedImage (path: string, format: DDS_FORMAT, imageData: ArrayBuffer, ddsInfo: ReturnType<typeof parseDds>, flags: TextureFlags): void {
        this.rendererData.textures[path] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);

        const view = new Uint8Array(imageData);

        if (isWebGL2(this.gl)) {
            this.gl.texStorage2D(this.gl.TEXTURE_2D, ddsInfo.images.length, format, ddsInfo.images[0].shape[0], ddsInfo.images[0].shape[0]);
            
            for (let i = 0; i < ddsInfo.images.length; ++i) {
                const image = ddsInfo.images[i];
                this.gl.compressedTexSubImage2D(this.gl.TEXTURE_2D, i, 0, 0, image.shape[0], image.shape[1], format, view.subarray(image.offset, image.offset + image.length));
            }
        } else {
            for (let i = 0; i < ddsInfo.images.length; ++i) {
                const image = ddsInfo.images[i];
                if (image.shape[0] >= 2 && image.shape[1] >= 2) {
                    this.gl.compressedTexImage2D(this.gl.TEXTURE_2D, i, format, image.shape[0], image.shape[1], 0, view.subarray(image.offset, image.offset + image.length));
                } else {
                    break;
                }
            }
        }

        this.setTextureParameters(flags, isWebGL2(this.gl));

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
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

    public render (mvMatrix: mat4, pMatrix: mat4, { wireframe } : {
        wireframe: boolean;
    }): void {
        this.gl.useProgram(this.shaderProgram);

        this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform, false, pMatrix);
        this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute);
        this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);
        if (!this.softwareSkinning) {
            this.gl.enableVertexAttribArray(this.shaderProgramLocations.groupAttribute);
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
            if (this.rendererData.geosetAlpha[i] < 1e-6) {
                continue;
            }

            if (this.softwareSkinning) {
                this.generateGeosetVertices(i);
            }

            const materialID = this.model.Geosets[i].MaterialID;
            const material = this.model.Materials[materialID];

            for (let j = 0; j < material.Layers.length; ++j) {
                this.setLayerProps(material.Layers[j], this.rendererData.materialLayerTextureID[materialID][j]);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

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
                    wireframe ? this.model.Geosets[i].Faces.length * 2 : this.model.Geosets[i].Faces.length,
                    this.gl.UNSIGNED_SHORT,
                    0
                );
            }
        }

        this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute);
        this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);
        if (!this.softwareSkinning) {
            this.gl.disableVertexAttribArray(this.shaderProgramLocations.groupAttribute);
        }

        this.particlesController.render(mvMatrix, pMatrix);
        this.ribbonsController.render(mvMatrix, pMatrix);
    }

    /**
     * @param mvMatrix 
     * @param pMatrix 
     * @param nodes Nodes to highlight. null means draw all
     */
    public renderSkeleton (mvMatrix: mat4, pMatrix: mat4, nodes: string[] | null): void {
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
        const vertexBuffer = new Float32Array(coords);
        const colorBuffer = new Float32Array(colors);

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

    private setTextureParameters (flags: TextureFlags, hasMipmaps: boolean) {
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

    private updateLayerTextureId (materialId: number, layerId: number): void {
        const TextureID: AnimVector|number = this.model.Materials[materialId].Layers[layerId].TextureID;

        if (typeof TextureID === 'number') {
            this.rendererData.materialLayerTextureID[materialId][layerId] = TextureID;
        } else {
            this.rendererData.materialLayerTextureID[materialId][layerId] = this.interp.num(TextureID);
        }
    }

    private initShaders (): void {
        if (this.shaderProgram) {
            return;
        }

        const vertex = this.vertexShader = getShader(this.gl, this.softwareSkinning ? vertexShaderSoftwareSkinning : vertexShaderHardwareSkinning,
            this.gl.VERTEX_SHADER);
        const fragment = this.fragmentShader = getShader(this.gl, fragmentShader, this.gl.FRAGMENT_SHADER);

        const shaderProgram = this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertex);
        this.gl.attachShader(shaderProgram, fragment);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }

        this.gl.useProgram(shaderProgram);

        this.shaderProgramLocations.vertexPositionAttribute = this.gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.shaderProgramLocations.textureCoordAttribute = this.gl.getAttribLocation(shaderProgram, 'aTextureCoord');
        if (!this.softwareSkinning) {
            this.shaderProgramLocations.groupAttribute = this.gl.getAttribLocation(shaderProgram, 'aGroup');
        }

        this.shaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uPMatrix');
        this.shaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        this.shaderProgramLocations.samplerUniform = this.gl.getUniformLocation(shaderProgram, 'uSampler');
        this.shaderProgramLocations.replaceableColorUniform = this.gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        this.shaderProgramLocations.replaceableTypeUniform = this.gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        this.shaderProgramLocations.discardAlphaLevelUniform = this.gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
        this.shaderProgramLocations.tVertexAnimUniform = this.gl.getUniformLocation(shaderProgram, 'uTVextexAnim');

        if (!this.softwareSkinning) {
            this.shaderProgramLocations.nodesMatricesAttributes = [];
            for (let i = 0; i < MAX_NODES; ++i) {
                this.shaderProgramLocations.nodesMatricesAttributes[i] =
                this.gl.getUniformLocation(shaderProgram, `uNodesMatrices[${i}]`);
            }
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

    private initBuffers (): void {
        for (let i = 0; i < this.model.Geosets.length; ++i) {
            this.vertexBuffer[i] = this.gl.createBuffer();
            if (this.softwareSkinning) {
                this.vertices[i] = new Float32Array(this.model.Geosets[i].Vertices.length);
            } else {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, this.model.Geosets[i].Vertices, this.gl.STATIC_DRAW);
            }

            this.texCoordBuffer[i] = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.model.Geosets[i].TVertices[0], this.gl.STATIC_DRAW);

            if (!this.softwareSkinning) {
                this.groupBuffer[i] = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.groupBuffer[i]);
                const buffer = new Uint16Array(this.model.Geosets[i].VertexGroup.length * 4);
                for (let j = 0; j < buffer.length; j += 4) {
                    const index = j / 4;
                    const group = this.model.Geosets[i].Groups[this.model.Geosets[i].VertexGroup[index]];
                    buffer[j] = group[0];
                    buffer[j + 1] = group.length > 1 ? group[1] : MAX_NODES;
                    buffer[j + 2] = group.length > 2 ? group[2] : MAX_NODES;
                    buffer[j + 3] = group.length > 3 ? group[3] : MAX_NODES;
                }
                this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.STATIC_DRAW);
            }

            this.indexBuffer[i] = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.model.Geosets[i].Faces, this.gl.STATIC_DRAW);
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

            this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform, false, texCoordMat3);
        } else {
            this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform, false, identifyMat3);
        }
    }
}
