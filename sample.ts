import {parse as parseMdl} from './parsers/mdl';
import {parse as parseMdx} from './parsers/mdx';
import {vec3, mat4, quat} from 'gl-matrix';
import {Model, TextureFlags} from './model';
import {ModelRenderer} from './renderer/modelRenderer';

// todo Join filter modes

let model: Model;
let modelRenderer: ModelRenderer;
let canvas: HTMLCanvasElement;
let gl: WebGLRenderingContext;
let pMatrix = mat4.create();
let mvMatrix = mat4.create();
let loadedTextures = 0;
let totalTextures = 0;

let cameraBasePos: vec3 = vec3.fromValues(300, 0, 300);
let cameraPos: vec3 = vec3.clone(cameraBasePos);
let cameraTarget: vec3 = vec3.fromValues(0, 0, 50);
let cameraUp: vec3 = vec3.fromValues(0, 0, 1);
let cameraQuat: quat = quat.create();

let rotateCenter: vec3 = vec3.fromValues(0, 0, 0);

let start;
function updateModel (timestamp: number) {
    if (!start) {
        start = timestamp;
    }
    let delta = timestamp - start;
    // delta /= 10;
    start = timestamp;

    modelRenderer.update(delta);
}

function initGL () {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;

    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    } catch (err) {
        alert(err);
    }
}

let cameraPosProjected: vec3 = vec3.create();
let verticalQuat: quat = quat.create();
let fromCameraBaseVec: vec3 = vec3.fromValues(1, 0, 0);
function calcCameraQuat () {
    vec3.set(cameraPosProjected, cameraPos[0], cameraPos[1], 0);
    vec3.subtract(cameraPos, cameraPos, cameraTarget);
    vec3.normalize(cameraPosProjected, cameraPosProjected);
    vec3.normalize(cameraPos, cameraPos);

    quat.rotationTo(cameraQuat, fromCameraBaseVec, cameraPosProjected);
    quat.rotationTo(verticalQuat, cameraPosProjected, cameraPos);
    quat.mul(cameraQuat, verticalQuat, cameraQuat);
}

function drawScene () {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, Math.PI / 4 , canvas.width / canvas.height, 0.1, 1000.0);

    // tslint:disable-next-line
    vec3.rotateZ(cameraPos, cameraBasePos, rotateCenter, window['angle'] || 0);
    mat4.lookAt(mvMatrix, cameraPos, cameraTarget, cameraUp);

    calcCameraQuat();

    modelRenderer.setCameraQuat(cameraQuat);
    modelRenderer.render(mvMatrix, pMatrix);
}

function tick(timestamp: number) {
    requestAnimationFrame(tick);
    updateModel(timestamp);
    drawScene();
}

function loadTexture (src: string, flags: TextureFlags) {
    let img = new Image();

    img.onload = () => {
        modelRenderer.setTexture(src, img, flags);

        if (++loadedTextures === totalTextures) {
            requestAnimationFrame(tick);
        }
    };
    img.src = src;
}

function parseModel(isBinary: boolean, xhr: XMLHttpRequest): Model {
    if (isBinary) {
        return parseMdx(xhr.response as ArrayBuffer);
    } else {
        return parseMdl(xhr.responseText);
    }
}

function processModelLoading() {
    console.log(model);

    modelRenderer = new ModelRenderer(model);

    initGL();
    modelRenderer.initGL(gl);

    for (let texture of model.Textures) {
        if (texture.Image) {
            ++totalTextures;
            loadTexture(texture.Image, texture.Flags);
        }
    }
}

function loadModel () {
    const xhr = new XMLHttpRequest();
    const file = 'WaterElemental.mdl';
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
