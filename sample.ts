import {parse} from './parsers/mdl';
import {vec3, mat4, quat} from 'gl-matrix';
import {Model, Sequence, AnimVector} from './model';

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
let modelTexture: WebGLTexture;
let modelTextureImage: HTMLImageElement;
let rootNode: any = {
    node: {
        PivotPoint: [0, 0, 0],
    },
    matrix: mat4.create(),
    childs: []
};

let nodes: any = {};
let geosetAlpha: any = {};
let animation = 'Walk Defend';
let frame;
let animationInfo: Sequence;

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

function processModel () {
    animationInfo = model.Sequences[animation];
    frame = animationInfo.Interval[0];

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
}

let start;
function updateModel () {
    if (!start) {
        start = Date.now();
    }
    let delta = Date.now() - start;
    // delta /= 10;
    start = Date.now();

    frame += delta;
    if (frame > animationInfo.Interval[1]) {
        frame = animationInfo.Interval[0];
    }

    updateNode(rootNode, frame);

    for (let i = 0; i < model.Geosets.length; ++i) {
        geosetAlpha[i] = findAlpha(i, frame, animationInfo.Interval);
    }
}

function findKeyframes (animVector: AnimVector, frame: number, interval: number[]) {
    if (!animVector) {
        return null;
    }

    let array = animVector.Keys;
    let first = 0;
    let count = array.length;

    if (count === 0) {
        return null;
    }

    if (array[0].Frame > interval[1]) {
        return null;
    } else if (array[count - 1].Frame < interval[0]) {
        return null;
    }

    while (count > 0) {
        let step = Math.floor(count / 2);
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
    if (first === array.length || array[first].Frame > interval[1]) {
        return {
            left: array[first - 1],
            right: array[first - 1]
        };
    }
    if (array[first - 1].Frame < interval[0]) {
        return null;
    }

    return {
        left: array[first - 1],
        right: array[first]
    };
}

function interpNum (animVector: AnimVector, frame: number, interval: number[]): number|null {
    let res = findKeyframes(animVector, frame, interval);
    if (!res) {
        return null;
    }
    let {left, right} = res;
    if (left.Frame === right.Frame) {
        return left.Vector[0];
    }

    let t = (frame - left.Frame) / (right.Frame - left.Frame);

    if (animVector.LineType === 'DontInterp') {
        return right.Vector[0];
    // } else if (animVector.LineType === 'Bezier') {
    //     return vec3.bezier(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    // } else if (animVector.LineType === 'Hermite') {
    //     return vec3.hermite(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    } else {
        // Linear
        return left.Vector[0] * (1 - t) + right.Vector[0] * t;
    }
}

function interpVec3 (out: vec3, animVector: AnimVector, frame: number, interval: number[]) {
    let res = findKeyframes(animVector, frame, interval);
    if (!res) {
        return null;
    }
    let {left, right} = res;
    if (left.Frame === right.Frame) {
        return left.Vector;
    }

    let t = (frame - left.Frame) / (right.Frame - left.Frame);

    if (animVector.LineType === 'DontInterp') {
        return right.Vector;
    } else if (animVector.LineType === 'Bezier') {
        return vec3.bezier(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    } else if (animVector.LineType === 'Hermite') {
        return vec3.hermite(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    } else {
        return vec3.lerp(out, left.Vector, right.Vector, t);
    }
}

function interpQuat (out: quat, animVector: AnimVector, frame: number, interval: number[]) {
    let res = findKeyframes(animVector, frame, interval);
    if (!res) {
        return null;
    }
    let {left, right} = res;
    if (left.Frame === right.Frame) {
        return left.Vector;
    }

    let t = (frame - left.Frame) / (right.Frame - left.Frame);

    if (animVector.LineType === 'DontInterp') {
        return right.Vector;
    } else if (animVector.LineType === 'Bezier' || animVector.LineType === 'Hermite') {
        return quat.sqlerp(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    } else {
        return quat.slerp(out, left.Vector, right.Vector, t);
    }
}

let translation = vec3.create();
let rotation = quat.create();
let scaling = vec3.create();

let defaultTranslation = vec3.fromValues(0, 0, 0);
let defaultRotation = quat.fromValues(0, 0, 0, 1);
let defaultScaling = vec3.fromValues(1, 1, 1);

function updateNode (node, frame) {
    let translationRes = interpVec3(translation, node.node.Translation, frame, animationInfo.Interval);
    let rotationRes = interpQuat(rotation, node.node.Rotation, frame, animationInfo.Interval);
    let scalingRes = interpVec3(scaling, node.node.Scaling, frame, animationInfo.Interval);

    if (translationRes && !rotationRes && !scalingRes) {
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

    if (node.node.Parent !== undefined) {
        mat4.mul(node.matrix, nodes[node.node.Parent].matrix, node.matrix);
    }

    for (let child of node.childs) {
        updateNode(child, frame);
    }
}

function findAlpha (geosetId: number, frame: number, interval: number[]): number {
    let geosetAnim = model.GeosetAnims[geosetId];

    if (!geosetAnim || geosetAnim.Alpha === undefined) {
        return 1;
    }

    if (typeof geosetAnim.Alpha === 'number') {
        return geosetAnim.Alpha;
    }

    let interpRes = interpNum(geosetAnim.Alpha, frame, interval);

    if (interpRes === null) {
        return 1;
    }
    return interpRes;
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

let prevMatrixUniform = [];
for (let i = 0; i < 128; ++i) {
    prevMatrixUniform[i] = -100500;
}

function drawScene () {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, Math.PI / 4 , canvas.width / canvas.height, 0.1, 1000.0);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0.0, -50.0, -300.0]);
    mat4.rotateX(mvMatrix, mvMatrix, -Math.PI / 3);
    mat4.rotateZ(mvMatrix, mvMatrix, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, modelTexture);
    gl.uniform1i(shaderProgramLocations.samplerUniform, 0);
    gl.uniformMatrix4fv(shaderProgramLocations.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

    for (let j = 0; j < 128; ++j) {
        if (nodes[j]) {
            if (prevMatrixUniform[j] !== nodes[j].matrix[5]) {
                prevMatrixUniform[j] = nodes[j].matrix[5];
                gl.uniformMatrix4fv(shaderProgramLocations.nodesMatricesAttributes[j], false, nodes[j].matrix);
            }
        }
    }

    for (let i = 0; i < model.Geosets.length; ++i) {
        if (geosetAlpha[i] <= 0) {
            continue;
        }

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

function tick() {
    requestAnimationFrame(tick);
    updateModel();
    drawScene();
}

function loadTexture (texture) {
    modelTexture = gl.createTexture();
    modelTextureImage = new Image();
    modelTextureImage.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, modelTexture);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, modelTextureImage);
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

        tick();
    };
    modelTextureImage.src = texture;
}

function parseModel (responseText: string) {
    model = parse(responseText);

    console.log(model);

    processModel();

    initGL();
    loadTexture(model.Textures[0].Image);
}

function loadModel () {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', 'Footman.mdl', true);
    xhr.onreadystatechange = () => {
        if (xhr.status === 200 && xhr.readyState === XMLHttpRequest.DONE) {
            parseModel(xhr.responseText);
        }
    };
    xhr.send();
}

function init() {
    loadModel();
}

document.addEventListener('DOMContentLoaded', init);
