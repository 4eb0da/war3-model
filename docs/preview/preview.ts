/// <reference types="@webgpu/types" />

import { vec3, mat4, quat } from 'gl-matrix';
import { decodeDds, parseHeaders } from 'dds-parser';

import { parse as parseMDL } from '../../mdl/parse';
import { parse as parseMDX } from '../../mdx/parse';
import { Model, TextureFlags } from '../../model';
import { DDS_FORMAT, ModelRenderer } from '../../renderer/modelRenderer';
import { vec3RotateZ } from '../../renderer/util';
import { decode, getImageData } from '../../blp/decode';
import '../common/shim';

let model: Model;
let modelRenderer: ModelRenderer;
let canvas: HTMLCanvasElement;
let gl: WebGLRenderingContext | WebGL2RenderingContext;
let gpuContext: GPUCanvasContext;
let gpuDevice: GPUDevice;
const pMatrix = mat4.create();
const mvMatrix = mat4.create();
const lightMVMatrix = mat4.create();
const shadowMapMatrix = mat4.create();
const CLEANUP_NAME_REGEXP = /.*?([^\\/]+)\.\w+$/;
let ddsExt: WEBGL_compressed_texture_s3tc | null = null;
let rgtcExt: EXT_texture_compression_rgtc | null = null;

const SHADOW_QUALITY = 4096;
const FB_WIDTH = SHADOW_QUALITY;
const FB_HEIGHT = SHADOW_QUALITY;
let framebuffer: WebGLFramebuffer;
let framebufferTexture: WebGLTexture;
let framebufferDepthTexture: WebGLTexture;

let cameraTheta = Math.PI / 4;
let cameraPhi = 0;
let cameraDistance = 500;
let cameraTargetZ = 50;

let wireframe = false;
let showSkeleton = false;
let skeletonNodes: string[] | null = null;
let shadow = true;
let ibl = true;
let lod = 0;
let isAnimationPlaying = true;

const cameraBasePos: vec3 = vec3.create();
const cameraPos: vec3 = vec3.create();
const cameraPosTemp: vec3 = vec3.create();
const cameraTarget: vec3 = vec3.create();
const cameraUp: vec3 = vec3.fromValues(0, 0, 1);
// const cameraQuat: quat = quat.create();
const lightPosition: vec3 = vec3.fromValues(200, 200, 200);
const lightTarget: vec3 = vec3.fromValues(0, 0, 0);
const lightColor: vec3 = vec3.fromValues(1, 1, 1);

let start;
function updateModel(timestamp: number) {
    if (!start) {
        start = timestamp;
    }
    const delta = timestamp - start;
    // delta /= 10;
    start = timestamp;

    if (isAnimationPlaying) {
        modelRenderer.update(delta);
    }
    updateAnimationFrame();
}

async function initGL() {
    if (gl || gpuDevice) {
        return;
    }

    try {
        try {
            const adapter = await navigator.gpu?.requestAdapter();
            gpuDevice = await adapter?.requestDevice();
            gpuContext = canvas.getContext('webgpu');
            gpuContext.configure({
                device: gpuDevice,
                format: navigator.gpu.getPreferredCanvasFormat(),
                alphaMode: 'premultiplied'
              });
            return;
        } catch (err) {
            // do nothing
        }

        const opts: WebGLContextAttributes = {
            antialias: false,
            alpha: false
        };

        if (!gpuContext) {
            gl = canvas.getContext('webgl2', opts) ||
                canvas.getContext('webgl', opts) ||
                canvas.getContext('experimental-webgl', opts) as
                (WebGL2RenderingContext | WebGLRenderingContext);
        }

        let supportShadows = false;
        if (gl instanceof WebGLRenderingContext) {
            const depthExt = gl.getExtension('WEBGL_depth_texture');
            if (depthExt) {
                supportShadows = true;
            }
        } else {
            supportShadows = true;
        }

        ddsExt = (
            gl.getExtension('WEBGL_compressed_texture_s3tc') ||
            gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
            gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc')
        );

        rgtcExt = (
            gl.getExtension('EXT_texture_compression_rgtc')
        );

        if (supportShadows) {
            framebuffer = gl.createFramebuffer();

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

            framebufferTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, framebufferTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, FB_WIDTH, FB_HEIGHT, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebufferTexture, 0);

            framebufferDepthTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, framebufferDepthTexture);
            if (gl instanceof WebGLRenderingContext) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, FB_WIDTH, FB_HEIGHT, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, FB_WIDTH, FB_HEIGHT, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, framebufferDepthTexture, 0);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        gl.clearColor(0.15, 0.15, 0.15, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    } catch (err) {
        alert(err);
    }
}

const cameraPosProjected: vec3 = vec3.create();
const verticalQuat: quat = quat.create();
const fromCameraBaseVec: vec3 = vec3.fromValues(1, 0, 0);
function calcCameraQuat(cameraPos: vec3, cameraTarget: vec3): quat {
    vec3.set(cameraPosProjected, cameraPos[0], cameraPos[1], 0);
    vec3.subtract(cameraPosTemp, cameraPos, cameraTarget);
    vec3.normalize(cameraPosProjected, cameraPosProjected);
    vec3.normalize(cameraPosTemp, cameraPosTemp);

    const cameraQuat = quat.create();
    quat.rotationTo(cameraQuat, fromCameraBaseVec, cameraPosProjected);
    quat.rotationTo(verticalQuat, cameraPosProjected, cameraPosTemp);
    quat.mul(cameraQuat, verticalQuat, cameraQuat);

    return cameraQuat;
}

function drawScene() {
    if (gl) {
        gl.depthMask(true);
    }
    mat4.perspective(pMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 3000.0);

    vec3.set(
        cameraBasePos,
        Math.cos(cameraTheta) * Math.cos(cameraPhi) * cameraDistance,
        Math.cos(cameraTheta) * Math.sin(cameraPhi) * cameraDistance,
        cameraTargetZ + Math.sin(cameraTheta) * cameraDistance
    );
    cameraTarget[2] = cameraTargetZ;

    vec3RotateZ(cameraPos, cameraBasePos, window['angle'] || 0);
    mat4.lookAt(mvMatrix, cameraPos, cameraTarget, cameraUp);
    mat4.lookAt(lightMVMatrix, lightPosition, lightTarget, cameraUp);

    mat4.identity(shadowMapMatrix);
    mat4.translate(shadowMapMatrix, shadowMapMatrix, vec3.fromValues(.5, .5, .5));
    mat4.scale(shadowMapMatrix, shadowMapMatrix, vec3.fromValues(.5, .5, .5));
    mat4.multiply(shadowMapMatrix, shadowMapMatrix, pMatrix);
    mat4.multiply(shadowMapMatrix, shadowMapMatrix, lightMVMatrix);

    const cameraQuat: quat = calcCameraQuat(cameraPos, cameraTarget);
    const lightQuat: quat = calcCameraQuat(lightPosition, lightTarget);

    modelRenderer.setLightPosition(lightPosition);
    modelRenderer.setLightColor(lightColor);

    if (shadow && framebuffer) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, FB_WIDTH, FB_HEIGHT);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        modelRenderer.setCamera(lightPosition, lightQuat);
        modelRenderer.render(lightMVMatrix, pMatrix, {
            wireframe: false
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    modelRenderer.setCamera(cameraPos, cameraQuat);
    if (ibl) {
        modelRenderer.renderEnvironment(mvMatrix, pMatrix);
    }
    modelRenderer.render(mvMatrix, pMatrix, {
        levelOfDetail: lod,
        wireframe,
        useEnvironmentMap: ibl,
        shadowMapTexture: shadow ? framebufferDepthTexture : undefined,
        shadowMapMatrix: shadow ? shadowMapMatrix : undefined,
        shadowBias: 1e-6,
        shadowSmoothingStep: 1 / SHADOW_QUALITY
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

function loadTexture(src: string, textureName: string, flags: TextureFlags | 0) {
    const img = new Image();

    img.onload = () => {
        modelRenderer.setTextureImage(textureName, img, flags);

        handleLoadedTexture();
    };
    img.src = src;
}

let started = false;
function handleLoadedTexture(): void {
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

async function processModelLoading() {
    console.log(model);

    modelRenderer = new ModelRenderer(model);
    modelRenderer.setTeamColor(parseColor(inputColor.value));

    await initGL();
    if (gpuDevice) {
        modelRenderer.initGPUDevice(canvas, gpuDevice, gpuContext);
    } else {
        modelRenderer.initGL(gl);
    }

    setAnimationList();
    updateAnimationFrame();
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

function initControls() {
    inputColor.addEventListener('input', () => {
        if (modelRenderer) {
            modelRenderer.setTeamColor(parseColor(inputColor.value));
        }
    });

    const select = document.getElementById('select') as HTMLSelectElement;
    select.addEventListener('input', () => {
        if (modelRenderer) {
            modelRenderer.setSequence(parseInt(select.value, 10));
        }
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

    const shadowCheck = document.getElementById('shadow') as HTMLInputElement;
    shadow = shadowCheck.checked;
    shadowCheck.addEventListener('input', () => {
        shadow = shadowCheck.checked;
    });

    const iblCheck = document.getElementById('ibl') as HTMLInputElement;
    ibl = iblCheck.checked;
    iblCheck.addEventListener('input', () => {
        ibl = iblCheck.checked;
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

    const lodSelect = document.getElementById('lod') as HTMLInputElement;
    lod = Number(lodSelect.value);
    lodSelect.addEventListener('change', () => {
        lod = Number(lodSelect.value);
    });

    const toggleAnimation = document.querySelector<HTMLInputElement>('#toggle_animation') as HTMLInputElement;
    toggleAnimation.addEventListener('click', () => {
        isAnimationPlaying = !isAnimationPlaying;
        toggleAnimation.textContent = isAnimationPlaying ? '⏸' : '⏵';
    });

    const frameRange = document.querySelector<HTMLInputElement>('#frame_range') as HTMLInputElement;
    const frameInput = document.querySelector<HTMLInputElement>('#frame_input') as HTMLInputElement;
    frameRange.addEventListener('input', () => {
        if (modelRenderer) {
            modelRenderer.setFrame(Number(frameRange.value));
            modelRenderer.update(0);
        }
    });
    frameInput.addEventListener('input', () => {
        if (modelRenderer) {
            modelRenderer.setFrame(Number(frameInput.value));
            modelRenderer.update(0);
        }
    });
}

function initCameraMove() {
    let down = false;
    let isMiddle = false;
    let downX, downY;

    function coords(event) {
        const list = (event.changedTouches && event.changedTouches.length ?
            event.changedTouches :
            event.touches) || [event];

        return [list[0].pageX, list[0].pageY];
    }

    function updateCameraDistance(distance: number): void {
        cameraDistance = distance;
        if (cameraDistance > 1000) {
            cameraDistance = 1000;
        }
        if (cameraDistance < 100) {
            cameraDistance = 100;
        }
        (document.getElementById('distance') as HTMLInputElement).value = String(cameraDistance);
    }

    function pointerDown(event: PointerEvent) {
        if (event.target !== canvas || event.button > 1) {
            return;
        }

        isMiddle = event.button === 1;
        down = true;

        [downX, downY] = coords(event);
    }

    function pointerMove(event) {
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

        if (isMiddle) {
            cameraTargetZ += (y - downY) * .2;

            const min = model?.Info.MinimumExtent[2] || 0;
            const max = model?.Info.MaximumExtent[2] || 100;

            cameraTargetZ = Math.max(min, Math.min(max, cameraTargetZ));
        } else {
            cameraPhi += -1 * (x - downX) * 0.01;
            cameraTheta += (y - downY) * 0.01;

            if (cameraTheta > Math.PI / 2 * 0.98) {
                cameraTheta = Math.PI / 2 * 0.98;
            }
            if (cameraTheta < -Math.PI / 2 * 0.98) {
                cameraTheta = -Math.PI / 2 * 0.98;
            }
        }

        downX = x;
        downY = y;
    }

    function pointerUp() {
        down = false;
    }

    const controls = document.querySelector<HTMLDivElement>('.controls');
    function wheel(event) {
        if (controls.contains(event.target)) {
            return;
        }

        updateCameraDistance(cameraDistance * (1 - event.wheelDelta / 600));
    }

    let startCameraDistance: number;
    function gestureStart() {
        startCameraDistance = cameraDistance;
    }

    function gestureChange(event) {
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

function updateCanvasSize() {
    const width = canvas.parentElement.offsetWidth;
    const height = canvas.parentElement.offsetHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
}

function updateAnimationFrame() {
    if (!modelRenderer) {
        return;
    }

    const index = modelRenderer.getSequence();
    const animation = model.Sequences[index];
    const frame = Math.round(modelRenderer.getFrame());

    const range = document.querySelector<HTMLInputElement>('#frame_range');
    const input = document.querySelector<HTMLInputElement>('#frame_input');
    const select = document.getElementById('select') as HTMLSelectElement;

    range.setAttribute('min', String(animation.Interval[0]));
    range.setAttribute('max', String(animation.Interval[1]));
    range.value = String(frame);

    input.value = String(frame);

    select.value = String(index);
}

function setAnimationList() {
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

function setDragDropTextures() {
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

function initDragDrop() {
    const container = document.querySelector('.container');
    let dropTarget;

    container.addEventListener('dragenter', function onDragEnter(event) {
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
    container.addEventListener('dragleave', function onDragLeave(event) {
        if (event.target === dropTarget) {
            container.classList.remove('container_drag');
            if (dropTarget && dropTarget.classList) {
                dropTarget.classList.remove('drag_hovered');
            }
        }
    });
    container.addEventListener('dragover', function onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });
    const dropModel = (file, textures) => {
        const reader = new FileReader();
        const isMDX = file.name.indexOf('.mdx') > -1;

        reader.onload = async () => {
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

            await processModelLoading();
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
                        const array = reader.result as ArrayBuffer;
                        const dds = parseHeaders(array);

                        console.log(dds);

                        let format: GLenum;

                        if (dds.format === 'dxt1') {
                            format = ddsExt?.COMPRESSED_RGB_S3TC_DXT1_EXT;
                        } else if (dds.format === 'dxt3') {
                            format = ddsExt?.COMPRESSED_RGBA_S3TC_DXT3_EXT;
                        } else if (dds.format === 'dxt5') {
                            format = ddsExt?.COMPRESSED_RGBA_S3TC_DXT5_EXT;
                        } else if (dds.format === 'ati2') {
                            format = rgtcExt?.COMPRESSED_RED_GREEN_RGTC2_EXT;
                        }

                        if (format) {
                            modelRenderer.setTextureCompressedImage(
                                textureName,
                                format as DDS_FORMAT,
                                reader.result as ArrayBuffer,
                                dds,
                                textureFlags
                            );
                        } else {
                            const uint8 = new Uint8Array(array);
                            const datas: ImageData[] = dds.images
                                .filter(image => image.shape.width > 0 && image.shape.height > 0)
                                .map(image => {
                                    const src = uint8.slice(image.offset, image.offset + image.length);
                                    const rgba = decodeDds(src, dds.format, image.shape.width, image.shape.height);
                                    return new ImageData(new Uint8ClampedArray(rgba), image.shape.width, image.shape.height);
                                });

                            modelRenderer.setTextureImageData(
                                textureName,
                                datas,
                                textureFlags
                            );
                        }

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
                    console.error(err.stack);
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
    container.addEventListener('drop', function onDrop(event: DragEvent) {
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



    function setTextures(textures) {
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
