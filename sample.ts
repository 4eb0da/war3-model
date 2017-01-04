import {parse} from './parsers/mdl';
import {mat4} from 'gl-matrix';
import {Model} from './model';

let model: Model;
let canvas: HTMLCanvasElement;
let gl: WebGLRenderingContext;
let shaderProgram: WebGLProgram;
let shaderProgramLocations: any = {};
let modelVertexBuffer: WebGLBuffer[] = [];
let modelTexCoordBuffer: WebGLBuffer[] = [];
let modelIndexBuffer: WebGLBuffer[] = [];
let pMatrix = mat4.create();
let mvMatrix = mat4.create();
let modelTexture: WebGLTexture;
let modelTextureImage: HTMLImageElement;

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
        debugger;
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

    shaderProgramLocations.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
    shaderProgramLocations.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
    shaderProgramLocations.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');
}

function initBuffers () {
    for (let i = 0; i < model.Geosets.length; ++i) {
        modelVertexBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, model.Geosets[i].Vertices, gl.STATIC_DRAW);

        modelTexCoordBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, modelTexCoordBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, model.Geosets[i].TVertices, gl.STATIC_DRAW);

        modelIndexBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelIndexBuffer[i]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.Geosets[i].Faces, gl.STATIC_DRAW);
    }
}

function drawScene () {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, Math.PI / 4 , canvas.width / canvas.height, 0.1, 1000.0);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0.0, -50.0, -300.0]);
    mat4.rotateX(mvMatrix, mvMatrix, -Math.PI / 3);
    mat4.rotateZ(mvMatrix, mvMatrix, -Math.PI / 3);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, modelTexture);
    gl.uniform1i(shaderProgramLocations.samplerUniform, 0);
    gl.uniformMatrix4fv(shaderProgramLocations.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

    for (let i = 0; i < model.Geosets.length - 1; ++i) {
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBuffer[i]);
        gl.vertexAttribPointer(shaderProgramLocations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, modelTexCoordBuffer[i]);
        gl.vertexAttribPointer(shaderProgramLocations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelIndexBuffer[i]);
        gl.drawElements(gl.TRIANGLES, model.Geosets[i].Faces.length, gl.UNSIGNED_SHORT, 0);
    }
}

function tick() {
    // requestAnimationFrame(tick);
    drawScene();
    // animate();
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
