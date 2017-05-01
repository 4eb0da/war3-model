import {parse as parseMDL} from '../../parsers/mdl';
import {parse as parseMDX} from '../../parsers/mdx';
import {vec3, mat4, quat} from 'gl-matrix';
import {Model, TextureFlags} from '../../model';
import {ModelRenderer} from '../../renderer/modelRenderer';
import {vec3RotateZ} from '../../renderer/util';

let model: Model;
let modelRenderer: ModelRenderer;
let canvas: HTMLCanvasElement;
let gl: WebGLRenderingContext;
let pMatrix = mat4.create();
let mvMatrix = mat4.create();
let loadedTextures = 0;
let totalTextures = 0;

let cameraTheta = Math.PI / 4;
let cameraPhi = 0;
let cameraDistance = 500;
let cameraTargetZ = 50;

let cameraBasePos: vec3 = vec3.create();
let cameraPos: vec3 = vec3.create();
let cameraTarget: vec3 = vec3.create();
let cameraUp: vec3 = vec3.fromValues(0, 0, 1);
let cameraQuat: quat = quat.create();

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
    if (gl) {
        return;
    }

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

    mat4.perspective(pMatrix, Math.PI / 4 , canvas.width / canvas.height, 0.1, 10000.0);

    vec3.set(
        cameraBasePos,
        Math.cos(cameraTheta) * Math.cos(cameraPhi) * cameraDistance,
        Math.cos(cameraTheta) * Math.sin(cameraPhi) * cameraDistance,
        Math.sin(cameraTheta) * cameraDistance
    );
    cameraTarget[2] = cameraTargetZ;

    // tslint:disable-next-line
    vec3RotateZ(cameraPos, cameraBasePos, window['angle'] || 0);
    mat4.lookAt(mvMatrix, cameraPos, cameraTarget, cameraUp);

    calcCameraQuat();

    modelRenderer.setCamera(cameraPos, cameraQuat);
    modelRenderer.render(mvMatrix, pMatrix);
}

function tick(timestamp: number) {
    requestAnimationFrame(tick);
    updateModel(timestamp);
    drawScene();
}

function loadTexture (src: string, textureName: string, flags: TextureFlags) {
    let img = new Image();

    img.onload = () => {
        modelRenderer.setTexture(textureName, img, flags);

        if (++loadedTextures === totalTextures) {
            requestAnimationFrame(tick);
        }
    };
    img.src = src;
}

function parseModel(isBinary: boolean, xhr: XMLHttpRequest): Model {
    if (isBinary) {
        return parseMDX(xhr.response as ArrayBuffer);
    } else {
        return parseMDL(xhr.responseText);
    }
}

function processModelLoading () {
    console.log(model);

    loadedTextures = totalTextures = 0;

    modelRenderer = new ModelRenderer(model);

    initGL();
    modelRenderer.initGL(gl);

    setAnimationList();
}

function setSampleTextures () {
    for (let texture of model.Textures) {
        if (texture.Image) {
            ++totalTextures;
            loadTexture(texture.Image, texture.Image, texture.Flags);
        }
    }
}

function setEmptyTextures () {
    for (let texture of model.Textures) {
        if (texture.Image) {
            ++totalTextures;
            loadTexture('preview/empty.png', texture.Image, 0);
        }
    }
}

function loadModel () {
    const xhr = new XMLHttpRequest();
    const file = 'preview/Footman.mdl';
    const isBinary = file.indexOf('.mdx') > -1;

    if (isBinary) {
        xhr.responseType = 'arraybuffer';
    }

    xhr.open('GET', file, true);
    xhr.onreadystatechange = () => {
        if (xhr.status === 200 && xhr.readyState === XMLHttpRequest.DONE) {
            model = parseModel(isBinary, xhr);
            processModelLoading();
            setSampleTextures();
        }
    };
    xhr.send();
}

function init() {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initControls();
    initCameraMove();
    initDragDrop();
    // loadModel();
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
}

function initControls () {
    let inputColor = document.getElementById('color') as HTMLInputElement;
    inputColor.addEventListener('input', () => {
        let val = inputColor.value.slice(1);
        let arr = vec3.fromValues(
            parseInt(val.slice(0, 2), 16) / 255,
            parseInt(val.slice(2, 4), 16) / 255,
            parseInt(val.slice(4, 6), 16) / 255
        );
        modelRenderer.setTeamColor(arr);
    });

    let select = document.getElementById('select') as HTMLSelectElement;
    select.addEventListener('input', () => {
        modelRenderer.setSequence(parseInt(select.value, 10));
    });

    let inputZ = document.getElementById('targetZ') as HTMLInputElement;
    inputZ.addEventListener('input', () => {
        cameraTargetZ = parseInt(inputZ.value, 10);
    });

    let inputDistance = document.getElementById('distance') as HTMLInputElement;
    inputDistance.addEventListener('input', () => {
        cameraDistance = parseInt(inputDistance.value, 10);
    });
}

function initCameraMove () {
    let down = false;
    let downX, downY;

    function coords (event) {
        let list = (event.changedTouches && event.changedTouches.length ?
            event.changedTouches :
            event.touches) || [event];

        return [list[0].pageX, list[0].pageY];
    }

    function updateCameraDistance (distance: number): void {
        cameraDistance = distance;
        if (cameraDistance > 1000) {
            cameraDistance = 1000;
        }
        if (cameraDistance < 100) {
            cameraDistance = 100;
        }
        (document.getElementById('distance') as HTMLInputElement).value = String(cameraDistance);
    }

    function pointerDown (event) {
        if (event.target !== canvas) {
            return;
        }

        down = true;

        [downX, downY] = coords(event);
    }

    function pointerMove (event) {
        if (!down) {
            return;
        }

        if (event.type === 'touchmove') {
            event.preventDefault();
        }

        if (event.changedTouches && event.changedTouches.length > 1 ||
            event.touches && event.touches.length > 1) {
            return;
        }

        let [x, y] = coords(event);

        cameraPhi += -1 * (x - downX) * 0.01;
        cameraTheta += (y - downY) * 0.01;

        if (cameraTheta > Math.PI / 2 * 0.98) {
            cameraTheta = Math.PI / 2 * 0.98;
        }
        if (cameraTheta < 0) {
            cameraTheta = 0;
        }

        downX = x;
        downY = y;
    }

    function pointerUp () {
        down = false;
    }

    function wheel (event) {
        updateCameraDistance(cameraDistance * (1 - event.deltaY / 30));
    }

    let startCameraDistance: number;
    function gestureStart () {
        startCameraDistance = cameraDistance;
    }

    function gestureChange (event) {
        updateCameraDistance(startCameraDistance * (1 / event.scale));
    }

    document.addEventListener('mousedown', pointerDown);
    document.addEventListener('touchstart', pointerDown);
    document.addEventListener('mousemove', pointerMove);
    document.addEventListener('touchmove', pointerMove);
    document.addEventListener('mouseup', pointerUp);
    document.addEventListener('touchend', pointerUp);
    document.addEventListener('touchcancel', pointerUp);
    document.addEventListener('wheel', wheel);
    document.addEventListener('gesturestart', gestureStart);
    document.addEventListener('gesturechange', gestureChange);
}

function updateCanvasSize () {
    let width = canvas.parentElement.offsetWidth;
    let height = canvas.parentElement.offsetHeight;
    let dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
}

function encode (html) {
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setAnimationList () {
    let list: any[] = model.Sequences.map(seq => seq.Name);

    if (list.length === 0) {
        list = ['None'];
    }

    let select = document.getElementById('select') as HTMLSelectElement;
    select.innerHTML = list.map((item, index) => `<option value="${index}">${encode(item)}</option>`).join('');
}

function setDragDropTextures () {
    let texturesContainer = document.querySelector('.drag-textures');

    texturesContainer.innerHTML = '';

    for (let texture of model.Textures) {
        if (texture.Image) {
            let row = document.createElement('div');

            row.className = 'drag';
            row.textContent = texture.Image;
            row.setAttribute('data-texture', texture.Image);
            row.setAttribute('data-texture-flags', String(texture.Flags));
            texturesContainer.appendChild(row);
        }
    }
}

function initDragDrop () {
    let container = document.querySelector('.container');
    let dropTarget;

    container.addEventListener('dragenter', function onDragEnter (event) {
        let target = event.target as HTMLElement;

        if (dropTarget && dropTarget !== event.target && dropTarget.classList) {
            dropTarget.classList.remove('drag_hovered');
        }
        if (!target.classList) {
            target = target.parentElement;
        }
        dropTarget = target;
        if (target && target.classList && target.classList.contains('drag')) {
            target.classList.add('drag_hovered');
        }
        container.classList.add('container_drag');
        event.preventDefault();
    });
    container.addEventListener('dragleave', function onDragLeave (event) {
        if (event.target === dropTarget) {
            container.classList.remove('container_drag');
            if (dropTarget && dropTarget.classList) {
                dropTarget.classList.remove('drag_hovered');
            }
        }
    });
    container.addEventListener('dragover', function onDragLeave (event: DragEvent) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });
    let dropModel = (file) => {
        let reader = new FileReader();
        let isMDX = file.name.indexOf('.mdx') > -1;

        reader.onload = () => {
            try {
                if (isMDX) {
                    model = parseMDX(reader.result);
                } else {
                    model = parseMDL(reader.result);
                }
            } catch (err) {
                // showError(err);
                return;
            }

            processModelLoading();
            setEmptyTextures();
            setDragDropTextures();
        };

        if (isMDX) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    };
    let dropTexture = (file) => {
        let reader = new FileReader();
        let textureName = dropTarget.getAttribute('data-texture');
        let textureFlags = Number(dropTarget.getAttribute('data-texture-flags'));

        reader.onload = () => {
            let img = new Image();

            img.onload = () => {
                modelRenderer.setTexture(textureName, img, textureFlags);
            };

            img.src = reader.result;
        };

        reader.readAsDataURL(file);
    };
    container.addEventListener('drop', function onDrop (event: DragEvent) {
        event.preventDefault();
        container.classList.remove('container_drag');
        container.classList.add('container_custom');
        if (!dropTarget) {
            return;
        }
        dropTarget.classList.remove('drag_hovered');

        let file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (!file) {
            return;
        }

        if (dropTarget.getAttribute('data-texture')) {
            dropTexture(file);
        } else {
            dropModel(file);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
