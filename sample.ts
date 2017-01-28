import {parse as parseMdl} from './parsers/mdl';
import {parse as parseMdx} from './parsers/mdx';
import {vec3, mat4, quat} from 'gl-matrix';
import {Model, Sequence, AnimVector, Layer, FilterMode, LayerShading, LineType, NodeFlags} from './model';

let model: Model;
let canvas: HTMLCanvasElement;
let gl: WebGLRenderingContext;
let shaderProgram: WebGLProgram;
let shaderProgramLocations: any = {};
let modelVertexBuffer: WebGLBuffer[] = [];
let modelTexCoordBuffer: WebGLBuffer[] = [];
let modelIndexBuffer: WebGLBuffer[] = [];
let modelGroupBuffer: WebGLBuffer[] = [];
let pMatrix = mat4.create();
let mvMatrix = mat4.create();
let loadedTextures = 0;
let totalTextures = 0;
let modelTextures: {[key: string]: WebGLTexture} = {};
let modelTextureImages: {[key: string]: HTMLImageElement} = {};
let rootNode: any = {
    node: {
        PivotPoint: [0, 0, 0],
    },
    matrix: mat4.create(),
    childs: []
};

let nodes: any = {};
let geosetAnims: any = {};
let geosetAlpha: any = {};
let animation = 'Walk Defend';
let animationInfo: Sequence;
let frm;
let globalSequencesFrames = [];
let teamColor: vec3 = vec3.fromValues(1, 0, 0);

let cameraBasePos: vec3 = vec3.fromValues(200, 0, 200);
let cameraPos: vec3 = vec3.clone(cameraBasePos);
let cameraTarget: vec3 = vec3.fromValues(0, 0, 50);
let cameraUp: vec3 = vec3.fromValues(0, 0, 1);
let cameraQuat: quat = quat.create();

let rotateCenter: vec3 = vec3.fromValues(0, 0, 0);
let fromCameraBaseVec: vec3 = vec3.fromValues(1, 0, 0);

function mat4fromRotationOrigin (out: mat4, rotation: quat, origin: vec3): mat4 {
    let x = rotation[0], y = rotation[1], z = rotation[2], w = rotation[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2,

        ox = origin[0],
        oy = origin[1],
        oz = origin[2];

    out[0] = (1 - (yy + zz));
    out[1] = (xy + wz);
    out[2] = (xz - wy);
    out[3] = 0;
    out[4] = (xy - wz);
    out[5] = (1 - (xx + zz));
    out[6] = (yz + wx);
    out[7] = 0;
    out[8] = (xz + wy);
    out[9] = (yz - wx);
    out[10] = (1 - (xx + yy));
    out[11] = 0;
    out[12] = ox - (out[0] * ox + out[4] * oy + out[8] * oz);
    out[13] = oy - (out[1] * ox + out[5] * oy + out[9] * oz);
    out[14] = oz - (out[2] * ox + out[6] * oy + out[10] * oz);
    out[15] = 1;

    return out;
}

function createModelHelpers () {
    animationInfo = model.Sequences[animation];
    if (animationInfo) {
        frm = animationInfo.Interval[0];
    } else {
        frm = 0;
    }

    for (let node of model.Nodes) {
        nodes[node.ObjectId] = {
            node,
            matrix: mat4.create(),
            childs: []
        };
    }
    for (let node of model.Nodes) {
        if (!node.Parent) {
            rootNode.childs.push(nodes[node.ObjectId]);
        } else {
            nodes[node.Parent].childs.push(nodes[node.ObjectId]);
        }
    }

    if (model.GlobalSequences) {
        for (let i = 0; i < model.GlobalSequences.length; ++i) {
            globalSequencesFrames[i] = 0;
        }
    }

    for (let i = 0; i < model.GeosetAnims.length; ++i) {
        geosetAnims[model.GeosetAnims[i].GeosetId] = model.GeosetAnims[i];
    }
}

let start;
function updateModel (timestamp: number) {
    if (!start) {
        start = timestamp;
    }
    let delta = timestamp - start;
    // delta /= 10;
    start = timestamp;

    frm += delta;
    if (frm > animationInfo.Interval[1]) {
        frm = animationInfo.Interval[0];
        resetGlobalSequences();
    } else {
        updateGlobalSequences(delta);
    }

    updateNode(rootNode, frm);

    for (let i = 0; i < model.Geosets.length; ++i) {
        geosetAlpha[i] = findAlpha(i);
    }
}

function updateGlobalSequences (delta) {
    for (let i = 0; i < globalSequencesFrames.length; ++i) {
        globalSequencesFrames[i] += delta;
        if (globalSequencesFrames[i] > model.GlobalSequences[i]) {
            globalSequencesFrames[i] = 0;
        }
    }
}

function resetGlobalSequences () {
    for (let i = 0; i < globalSequencesFrames.length; ++i) {
        globalSequencesFrames[i] = 0;
    }
}

function findLocalFrame (animVector: AnimVector) {
    if (typeof animVector.GlobalSeqId === 'number') {
        return {
            frame: globalSequencesFrames[animVector.GlobalSeqId],
            from: 0,
            to: model.GlobalSequences[animVector.GlobalSeqId]
        };
    } else {
        return {
            frame: frm,
            from: animationInfo.Interval[0],
            to: animationInfo.Interval[1]
        };
    }
}

function findKeyframes (animVector: AnimVector) {
    if (!animVector) {
        return null;
    }

    let {frame, from, to} = findLocalFrame(animVector);

    let array = animVector.Keys;
    let first = 0;
    let count = array.length;

    if (count === 0) {
        return null;
    }

    if (array[0].Frame > to) {
        return null;
    } else if (array[count - 1].Frame < from) {
        return null;
    }

    while (count > 0) {
        let step = count >> 1;
        if (array[first + step].Frame <= frame) {
            first = first + step + 1;
            count -= step + 1;
        } else {
            count = step;
        }
    }

    if (first === 0) {
        return null;
    }
    if (first === array.length || array[first].Frame > to) {
        return {
            frame,
            left: array[first - 1],
            right: array[first - 1]
        };
    }
    if (array[first - 1].Frame < from) {
        return null;
    }

    return {
        frame,
        left: array[first - 1],
        right: array[first]
    };
}

function interpNum (animVector: AnimVector): number|null {
    let res = findKeyframes(animVector);
    if (!res) {
        return null;
    }
    let {left, right} = res;
    if (left.Frame === right.Frame) {
        return left.Vector[0];
    }

    let t = (res.frame - left.Frame) / (right.Frame - left.Frame);

    if (animVector.LineType === LineType.DontInterp) {
        return left.Vector[0];
    // } else if (animVector.LineType === 'Bezier') {
    //     return vec3.bezier(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    // } else if (animVector.LineType === 'Hermite') {
    //     return vec3.hermite(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    } else {
        // Linear
        return left.Vector[0] * (1 - t) + right.Vector[0] * t;
    }
}

function interpVec3 (out: vec3, animVector: AnimVector): vec3 {
    let res = findKeyframes(animVector);
    if (!res) {
        return null;
    }
    let {left, right} = res;
    if (left.Frame === right.Frame) {
        return <vec3> left.Vector;
    }

    let t = (res.frame - left.Frame) / (right.Frame - left.Frame);

    if (animVector.LineType === LineType.DontInterp) {
        return <vec3> left.Vector;
    } else if (animVector.LineType === LineType.Bezier) {
        return vec3.bezier(out, <vec3> left.Vector, <vec3> left.OutTan, <vec3> right.InTan, <vec3> right.Vector, t);
    } else if (animVector.LineType === LineType.Hermite) {
        return vec3.hermite(out, <vec3> left.Vector, <vec3> left.OutTan, <vec3> right.InTan, <vec3> right.Vector, t);
    } else {
        return vec3.lerp(out, <vec3> left.Vector, <vec3> right.Vector, t);
    }
}

function interpQuat (out: quat, animVector: AnimVector): quat {
    let res = findKeyframes(animVector);
    if (!res) {
        return null;
    }
    let {left, right} = res;
    if (left.Frame === right.Frame) {
        return <quat> left.Vector;
    }

    let t = (res.frame - left.Frame) / (right.Frame - left.Frame);

    if (animVector.LineType === LineType.DontInterp) {
        return <quat> left.Vector;
    } else if (animVector.LineType === LineType.Hermite || animVector.LineType === LineType.Bezier) {
        return quat.sqlerp(out, <quat> left.Vector, <quat> left.OutTan, <quat> right.InTan, <quat> right.Vector, t);
    } else {
        return quat.slerp(out, <quat> left.Vector, <quat> right.Vector, t);
    }
}

let translation = vec3.create();
let rotation = quat.create();
let scaling = vec3.create();

let defaultTranslation = vec3.fromValues(0, 0, 0);
let defaultRotation = quat.fromValues(0, 0, 0, 1);
let defaultScaling = vec3.fromValues(1, 1, 1);

let tempParentRotationQuat: quat = quat.create();
let tempParentRotationMat: mat4 = mat4.create();
let tempCameraMat: mat4 = mat4.create();

function updateNode (node, frame) {
    let translationRes = interpVec3(translation, node.node.Translation);
    let rotationRes = interpQuat(rotation, node.node.Rotation);
    let scalingRes = interpVec3(scaling, node.node.Scaling);

    if (!translationRes && !rotationRes && !scalingRes) {
        mat4.identity(node.matrix);
    } else if (translationRes && !rotationRes && !scalingRes) {
        mat4.fromTranslation(node.matrix, translationRes);
    } else if (!translationRes && rotationRes && !scalingRes) {
        mat4fromRotationOrigin(node.matrix, rotationRes, node.node.PivotPoint);
    } else {
        mat4.fromRotationTranslationScaleOrigin(node.matrix,
            rotationRes || defaultRotation,
            translationRes || defaultTranslation,
            scalingRes || defaultScaling,
            node.node.PivotPoint
        );
    }

    if (node.node.Parent) {
        mat4.mul(node.matrix, nodes[node.node.Parent].matrix, node.matrix);
    }

    if (node.node.Flags & NodeFlags.Billboarded) {
        if (node.node.Parent) {
            // cancel parent rotation from PivotPoint
            mat4.getRotation(tempParentRotationQuat, nodes[node.node.Parent].matrix);
            mat4fromRotationOrigin(tempParentRotationMat, tempParentRotationQuat, node.node.PivotPoint);
            mat4.mul(node.matrix, node.matrix, tempParentRotationMat);
        }
        // rotate to camera
        mat4fromRotationOrigin(tempCameraMat, cameraQuat, node.node.PivotPoint);
        mat4.mul(node.matrix, node.matrix, tempCameraMat);
    }

    for (let child of node.childs) {
        updateNode(child, frame);
    }
}

function findAlpha (geosetId: number): number {
    let geosetAnim = geosetAnims[geosetId];

    if (!geosetAnim || geosetAnim.Alpha === undefined) {
        return 1;
    }

    if (typeof geosetAnim.Alpha === 'number') {
        return geosetAnim.Alpha;
    }

    let interpRes = interpNum(geosetAnim.Alpha);

    if (interpRes === null) {
        return 1;
    }
    return interpRes;
}

function initLayer (layer: Layer) {
    // todo TextureID animation
    let texture = model.Textures[<number> layer.TextureID];

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
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(true);
    } else if (layer.FilterMode === FilterMode.Blend) {
        gl.enable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
        gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
        gl.depthMask(false);
    } else if (layer.FilterMode === FilterMode.Modulate2x) {
        gl.enable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.blendFunc(gl.DST_COLOR, gl.SRC_COLOR);
        gl.depthMask(false);
    }

    if (texture.Image) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, modelTextures[texture.Image]);
        gl.uniform1i(shaderProgramLocations.samplerUniform, 0);
        gl.uniform1f(shaderProgramLocations.replaceableTypeUniform, 0);
    } else if (texture.ReplaceableId === 1 || texture.ReplaceableId === 2) {
        gl.uniform3fv(shaderProgramLocations.replaceableColorUniform, teamColor);
        gl.uniform1f(shaderProgramLocations.replaceableTypeUniform, texture.ReplaceableId);
    }

    if (layer.Shading === LayerShading.NoDepthTest) {
        gl.disable(gl.DEPTH_TEST);
    }
    if (layer.Shading === LayerShading.NoDepthSet) {
        gl.depthMask(false);
    }
}

let anisotropicExt;

function initGL () {
    canvas = <HTMLCanvasElement> document.getElementById('canvas');

    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        anisotropicExt = (
            gl.getExtension('EXT_texture_filter_anisotropic') ||
            gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
        );

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        initShaders();
        initBuffers();
    } catch (err) {
        alert(err);
    }
}

function getShader (id) {
    let shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    let str = '';
    let k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType === 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    let shader;
    let type = shaderScript.getAttribute('type');
    if (type === 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type === 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders () {
    let fragmentShader = getShader('shader-fs');
    let vertexShader = getShader('shader-vs');

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
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

    shaderProgramLocations.nodesMatricesAttributes = [];
    for (let i = 0; i < 128; ++i) {
        shaderProgramLocations.nodesMatricesAttributes[i] =
            gl.getUniformLocation(shaderProgram, `uNodesMatrices[${i}]`);
    }
}

function initBuffers () {
    for (let i = 0; i < model.Geosets.length; ++i) {
        modelVertexBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, model.Geosets[i].Vertices, gl.STATIC_DRAW);

        modelTexCoordBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, modelTexCoordBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, model.Geosets[i].TVertices, gl.STATIC_DRAW);

        modelGroupBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, modelGroupBuffer[i]);
        let buffer = new Uint16Array(model.Geosets[i].VertexGroup.length * 4);
        for (let j = 0; j < buffer.length; j += 4) {
            let index = j / 4;
            let group = model.Geosets[i].Groups[model.Geosets[i].VertexGroup[index]];
            buffer[j] = group[0];
            buffer[j + 1] = group.length > 1 ? group[1] : 128;
            buffer[j + 2] = group.length > 2 ? group[2] : 128;
            buffer[j + 3] = group.length > 3 ? group[3] : 128;
        }
        gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);

        modelIndexBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelIndexBuffer[i]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.Geosets[i].Faces, gl.STATIC_DRAW);
    }
}

function drawScene () {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, Math.PI / 4 , canvas.width / canvas.height, 0.1, 1000.0);

    // tslint:disable-next-line
    mat4.lookAt(mvMatrix, vec3.rotateZ(cameraPos, cameraBasePos, rotateCenter, window['angle'] || 0), cameraTarget, cameraUp);
    // calc quat for billboard bones
    quat.rotationTo(cameraQuat, fromCameraBaseVec, vec3.normalize(cameraPos, cameraPos));

    gl.uniformMatrix4fv(shaderProgramLocations.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

    for (let j = 0; j < 128; ++j) {
        if (nodes[j]) {
            gl.uniformMatrix4fv(shaderProgramLocations.nodesMatricesAttributes[j], false, nodes[j].matrix);
        }
    }

    for (let i = 0; i < model.Geosets.length; ++i) {
        if (geosetAlpha[i] < 1e-6) {
            continue;
        }

        let material = model.Materials[model.Geosets[i].MaterialID];

        for (let j = 0; j < material.Layers.length; ++j) {
            initLayer(material.Layers[j]);

            gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBuffer[i]);
            gl.vertexAttribPointer(shaderProgramLocations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, modelTexCoordBuffer[i]);
            gl.vertexAttribPointer(shaderProgramLocations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, modelGroupBuffer[i]);
            gl.vertexAttribPointer(shaderProgramLocations.groupAttribute, 4, gl.UNSIGNED_SHORT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelIndexBuffer[i]);
            gl.drawElements(gl.TRIANGLES, model.Geosets[i].Faces.length, gl.UNSIGNED_SHORT, 0);
        }
    }
}

function tick(timestamp: number) {
    requestAnimationFrame(tick);
    updateModel(timestamp);
    drawScene();
}

function loadTexture (src) {
    modelTextures[src] = gl.createTexture();
    modelTextureImages[src] = new Image();
    modelTextureImages[src].onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, modelTextures[src]);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, modelTextureImages[src]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

        if (anisotropicExt) {
            let max = gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            gl.texParameterf(gl.TEXTURE_2D, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);

        if (++loadedTextures === totalTextures) {
            requestAnimationFrame(tick);
        }
    };
    modelTextureImages[src].src = src;
}

function parseModel(isBinary: boolean, xhr: XMLHttpRequest): Model {
    if (isBinary) {
        return parseMdx(<ArrayBuffer> xhr.response);
    } else {
        return parseMdl(xhr.responseText);
    }
}

function processModelLoading() {
    console.log(model);

    createModelHelpers();

    initGL();
    for (let texture of model.Textures) {
        if (texture.Image) {
            ++totalTextures;
            loadTexture(texture.Image);
        }
    }
}

function loadModel () {
    const xhr = new XMLHttpRequest();
    const file = 'Footman.mdl';
    const isBinary = file.indexOf('.mdx') > -1;

    if (isBinary) {
        xhr.responseType = 'arraybuffer';
    }

    xhr.open('GET', file, true);
    xhr.onreadystatechange = () => {
        if (xhr.status === 200 && xhr.readyState === XMLHttpRequest.DONE) {
            model = parseModel(isBinary, xhr);
            processModelLoading();
        }
    };
    xhr.send();
}

function init() {
    loadModel();
}

document.addEventListener('DOMContentLoaded', init);
