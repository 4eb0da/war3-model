import {vec3, mat4, quat} from 'gl-matrix';
import parseDds from 'parse-dds';

import {parse as parseMDL} from '../../mdl/parse';
import {parse as parseMDX} from '../../mdx/parse';
import {Model, TextureFlags} from '../../model';
import {ModelRenderer} from '../../renderer/modelRenderer';
import {vec3RotateZ} from '../../renderer/util';
import {decode, getImageData} from '../../blp/decode';
import '../common/shim';

let model: Model;
let modelRenderer: ModelRenderer;
let canvas: HTMLCanvasElement;
let gl: WebGLRenderingContext;
const pMatrix = mat4.create();
const mvMatrix = mat4.create();
const CLEANUP_NAME_REGEXP = /.*?([^\\/]+)\.\w+$/;
let ddsExt: WEBGL_compressed_texture_s3tc | null = null;

let cameraTheta = Math.PI / 4;
let cameraPhi = 0;
let cameraDistance = 500;
let cameraTargetZ = 50;

let wireframe = false;
let showSkeleton = false;
let skeletonNodes: string[] | null = null;

const cameraBasePos: vec3 = vec3.create();
const cameraPos: vec3 = vec3.create();
const cameraTarget: vec3 = vec3.create();
const cameraUp: vec3 = vec3.fromValues(0, 0, 1);
const cameraQuat: quat = quat.create();

let start;
function updateModel (timestamp: number) {
    if (!start) {
        start = timestamp;
    }
    const delta = timestamp - start;
    // delta /= 10;
    start = timestamp;

    modelRenderer.update(delta);
}

function initGL () {
    if (gl) {
        return;
    }

    try {
        const opts: WebGLContextAttributes = {
            antialias: true,
            alpha: false
        };

        gl = canvas.getContext('webgl2', opts) ||
            canvas.getContext('webgl', opts) ||
            canvas.getContext('experimental-webgl', opts) as
            (WebGL2RenderingContext | WebGLRenderingContext);

        ddsExt = (
            gl.getExtension('WEBGL_compressed_texture_s3tc') ||
            gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
            gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc')
        );

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    } catch (err) {
        alert(err);
    }
}

const cameraPosProjected: vec3 = vec3.create();
const verticalQuat: quat = quat.create();
const fromCameraBaseVec: vec3 = vec3.fromValues(1, 0, 0);
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
    modelRenderer.render(mvMatrix, pMatrix, {
        wireframe
    });

    if (showSkeleton) {
        modelRenderer.renderSkeleton(mvMatrix, pMatrix, skeletonNodes);
    }
}

function tick(timestamp: number) {
    requestAnimationFrame(tick);
    updateModel(timestamp);
    drawScene();
}

function loadTexture (src: string, textureName: string, flags: TextureFlags) {
    const img = new Image();

    img.onload = () => {
        modelRenderer.setTextureImage(textureName, img, flags);

        handleLoadedTexture();
    };
    img.src = src;
}

let started = false;
function handleLoadedTexture (): void {
    if (!started) {
        started = true;
        requestAnimationFrame(tick);
    }
}

/* function parseModel(isBinary: boolean, xhr: XMLHttpRequest): Model {
    if (isBinary) {
        return parseMDX(xhr.response as ArrayBuffer);
    } else {
        return parseMDL(xhr.responseText);
    }
} */

function processModelLoading () {
    console.log(model);

    modelRenderer = new ModelRenderer(model);
    modelRenderer.setTeamColor(parseColor(inputColor.value));

    initGL();
    modelRenderer.initGL(gl);

    setAnimationList();
}

/* function setSampleTextures () {
    for (let texture of model.Textures) {
        if (texture.Image) {
            ++totalTextures;
            loadTexture(texture.Image, texture.Image, texture.Flags);
        }
    }
} */

/* function loadModel () {
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
} */

function init() {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initControls();
    initCameraMove();
    initDragDrop();
    // loadModel();
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
}

function parseColor(value: string): vec3 {
    const val = value.slice(1);

    return vec3.fromValues(
        parseInt(val.slice(0, 2), 16) / 255,
        parseInt(val.slice(2, 4), 16) / 255,
        parseInt(val.slice(4, 6), 16) / 255
    );
}

const inputColor = document.getElementById('color') as HTMLInputElement;

function initControls () {
    inputColor.addEventListener('input', () => {
        modelRenderer.setTeamColor(parseColor(inputColor.value));
    });

    const select = document.getElementById('select') as HTMLSelectElement;
    select.addEventListener('input', () => {
        modelRenderer.setSequence(parseInt(select.value, 10));
    });

    const inputZ = document.getElementById('targetZ') as HTMLInputElement;
    cameraTargetZ = parseInt(inputZ.value, 10);
    inputZ.addEventListener('input', () => {
        cameraTargetZ = parseInt(inputZ.value, 10);
    });

    const inputDistance = document.getElementById('distance') as HTMLInputElement;
    cameraDistance = parseInt(inputDistance.value, 10);
    inputDistance.addEventListener('input', () => {
        cameraDistance = parseInt(inputDistance.value, 10);
    });

    const wireframeCheck = document.getElementById('wireframe') as HTMLInputElement;
    wireframe = wireframeCheck.checked;
    wireframeCheck.addEventListener('input', () => {
        wireframe = wireframeCheck.checked;
    });

    const readSkeletonNodes = (value: string) => {
        const val = value.trim();

        if (val === '*') {
            return null;
        } else {
            return [val];
        }
    };

    const skeleton = document.getElementById('skeleton') as HTMLInputElement;
    skeletonNodes = readSkeletonNodes(skeleton.value);
    skeleton.addEventListener('input', () => {
        skeletonNodes = readSkeletonNodes(skeleton.value);
    });

    const setShowSkeleton = (val: boolean): void => {
        showSkeleton = val;
        skeleton.disabled = !val;
    };

    const skeletonCheck = document.getElementById('show_skeleton') as HTMLInputElement;
    setShowSkeleton(skeletonCheck.checked);
    skeletonCheck.addEventListener('input', () => {
        setShowSkeleton(skeletonCheck.checked);
    });
}

function initCameraMove () {
    let down = false;
    let downX, downY;

    function coords (event) {
        const list = (event.changedTouches && event.changedTouches.length ?
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

        const [x, y] = coords(event);

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
        updateCameraDistance(cameraDistance * (1 - event.wheelDelta / 600));
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
    const width = canvas.parentElement.offsetWidth;
    const height = canvas.parentElement.offsetHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
}

function setAnimationList () {
    let list: string[] = model.Sequences.map(seq => seq.Name);

    if (list.length === 0) {
        list = ['None'];
    }

    const select = document.getElementById('select') as HTMLSelectElement;
    select.innerHTML = '';
    list.forEach((item, index) => {
        const option = document.createElement('option');
        option.textContent = item;
        option.value = String(index);
        select.appendChild(option);
    });

    const skeleton = document.getElementById('skeleton') as HTMLSelectElement;
    for (const node of model.Nodes) {
        if (node) {
            const option = document.createElement('option');
            option.textContent = node.Name;
            option.value = node.Name;
            skeleton.appendChild(option);
        }
    }
}

function setDragDropTextures () {
    const texturesContainer = document.querySelector('.drag-textures');

    texturesContainer.innerHTML = '';

    for (const texture of model.Textures) {
        if (texture.Image) {
            const row = document.createElement('div');

            row.className = 'drag';
            row.textContent = texture.Image;
            row.setAttribute('data-texture', texture.Image);
            row.setAttribute('data-texture-flags', String(texture.Flags));
            texturesContainer.appendChild(row);
        }
    }
}

function initDragDrop () {
    const container = document.querySelector('.container');
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
    const dropModel = (file, textures) => {
        const reader = new FileReader();
        const isMDX = file.name.indexOf('.mdx') > -1;

        reader.onload = () => {
            try {
                if (isMDX) {
                    model = parseMDX(reader.result as ArrayBuffer);
                } else {
                    model = parseMDL(reader.result as string);
                }
            } catch (err) {
                console.error(err);
                // showError(err);
                return;
            }

            processModelLoading();
            setTextures(textures);
            setDragDropTextures();
        };

        if (isMDX) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    };

    const dropTexture = (file: File, textureName: string, textureFlags: TextureFlags) => {
        return new Promise<void>(resolve => {
            const reader = new FileReader();
            const isBLP = file.name.indexOf('.blp') > -1;
            const isDDS = file.name.indexOf('.dds') > -1;

            reader.onload = () => {
                try {
                    if (isDDS) {
                        const dds = parseDds(reader.result as ArrayBuffer);

                        console.log(dds);

                        let format: GLenum;

                        if (dds.format === 'dxt1') {
                            format = ddsExt.COMPRESSED_RGB_S3TC_DXT1_EXT;
                        } else if (dds.format === 'dxt3') {
                            format = ddsExt.COMPRESSED_RGBA_S3TC_DXT3_EXT;
                        } else if (dds.format === 'dxt5') {
                            format = ddsExt.COMPRESSED_RGBA_S3TC_DXT5_EXT;
                        }

                        modelRenderer.setTextureCompressedImage(
                            textureName,
                            format,
                            reader.result as ArrayBuffer,
                            dds,
                            textureFlags
                        );
                        resolve();
                    } else if (isBLP) {
                        const blp = decode(reader.result as ArrayBuffer);

                        console.log(file.name, blp);

                        modelRenderer.setTextureImageData(
                            textureName,
                            blp.mipmaps.map((_mipmap, i) => getImageData(blp, i)),
                            textureFlags
                        );
                        resolve();
                    } else {
                        const img = new Image();

                        img.onload = () => {
                            console.log(file.name, img);
                            modelRenderer.setTextureImage(textureName, img, textureFlags);
                            resolve();
                        };

                        img.src = reader.result as string;
                    }
                } catch (err) {
                    console.error(err);
                    resolve();
                }
            };

            if (isBLP || isDDS) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    };
    container.addEventListener('drop', function onDrop (event: DragEvent) {
        event.preventDefault();
        container.classList.remove('container_drag');
        container.classList.add('container_custom');
        if (!dropTarget) {
            return;
        }
        dropTarget.classList.remove('drag_hovered');

        const files = event.dataTransfer.files;
        if (!files || !files.length) {
            return;
        }

        if (dropTarget.getAttribute('data-texture')) {
            dropTexture(files[0], dropTarget.getAttribute('data-texture'),
                Number(dropTarget.getAttribute('data-texture-flags'))).then(() => {
                    handleLoadedTexture();
                });
        } else {
            let modelFile;

            for (let i = 0; i < files.length; ++i) {
                const file = files[i];

                if (file.name.indexOf('.mdl') > -1 || file.name.indexOf('.mdx') > -1) {
                    modelFile = file;
                    break;
                }
            }

            if (modelFile) {
                const textures = {};

                for (let i = 0; i < files.length; ++i) {
                    const file = files[i],
                        name = file.name.replace(CLEANUP_NAME_REGEXP, '$1').toLowerCase();

                    if (file.name.indexOf('.mdl') > -1 || file.name.indexOf('.mdx') > -1) {
                        continue;
                    }

                    textures[name] = file;
                }

                dropModel(modelFile, textures);
            }
        }
    });



    function setTextures (textures) {
        const promises: Promise<void>[] = [];

        for (const texture of model.Textures) {
            if (texture.Image) {
                const cleanupName = texture.Image.replace(CLEANUP_NAME_REGEXP, '$1').toLowerCase();
                if (cleanupName in textures) {
                    promises.push(dropTexture(textures[cleanupName], texture.Image, texture.Flags));
                } else {
                    loadTexture('empty.png', texture.Image, 0);
                }
            }
        }

        Promise.all(promises).then(() => {
            handleLoadedTexture();
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
