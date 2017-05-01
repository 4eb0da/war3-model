(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mdl_1 = require("../../parsers/mdl");
var mdx_1 = require("../../parsers/mdx");
var gl_matrix_1 = require("gl-matrix");
var modelRenderer_1 = require("../../renderer/modelRenderer");
var util_1 = require("../../renderer/util");
var model;
var modelRenderer;
var canvas;
var gl;
var pMatrix = gl_matrix_1.mat4.create();
var mvMatrix = gl_matrix_1.mat4.create();
var loadedTextures = 0;
var totalTextures = 0;
var cameraTheta = Math.PI / 4;
var cameraPhi = 0;
var cameraDistance = 500;
var cameraTargetZ = 50;
var cameraBasePos = gl_matrix_1.vec3.create();
var cameraPos = gl_matrix_1.vec3.create();
var cameraTarget = gl_matrix_1.vec3.create();
var cameraUp = gl_matrix_1.vec3.fromValues(0, 0, 1);
var cameraQuat = gl_matrix_1.quat.create();
var start;
function updateModel(timestamp) {
    if (!start) {
        start = timestamp;
    }
    var delta = timestamp - start;
    // delta /= 10;
    start = timestamp;
    modelRenderer.update(delta);
}
function initGL() {
    if (gl) {
        return;
    }
    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }
    catch (err) {
        alert(err);
    }
}
var cameraPosProjected = gl_matrix_1.vec3.create();
var verticalQuat = gl_matrix_1.quat.create();
var fromCameraBaseVec = gl_matrix_1.vec3.fromValues(1, 0, 0);
function calcCameraQuat() {
    gl_matrix_1.vec3.set(cameraPosProjected, cameraPos[0], cameraPos[1], 0);
    gl_matrix_1.vec3.subtract(cameraPos, cameraPos, cameraTarget);
    gl_matrix_1.vec3.normalize(cameraPosProjected, cameraPosProjected);
    gl_matrix_1.vec3.normalize(cameraPos, cameraPos);
    gl_matrix_1.quat.rotationTo(cameraQuat, fromCameraBaseVec, cameraPosProjected);
    gl_matrix_1.quat.rotationTo(verticalQuat, cameraPosProjected, cameraPos);
    gl_matrix_1.quat.mul(cameraQuat, verticalQuat, cameraQuat);
}
function drawScene() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl_matrix_1.mat4.perspective(pMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 10000.0);
    gl_matrix_1.vec3.set(cameraBasePos, Math.cos(cameraTheta) * Math.cos(cameraPhi) * cameraDistance, Math.cos(cameraTheta) * Math.sin(cameraPhi) * cameraDistance, Math.sin(cameraTheta) * cameraDistance);
    cameraTarget[2] = cameraTargetZ;
    // tslint:disable-next-line
    util_1.vec3RotateZ(cameraPos, cameraBasePos, window['angle'] || 0);
    gl_matrix_1.mat4.lookAt(mvMatrix, cameraPos, cameraTarget, cameraUp);
    calcCameraQuat();
    modelRenderer.setCamera(cameraPos, cameraQuat);
    modelRenderer.render(mvMatrix, pMatrix);
}
function tick(timestamp) {
    requestAnimationFrame(tick);
    updateModel(timestamp);
    drawScene();
}
function loadTexture(src, textureName, flags) {
    var img = new Image();
    img.onload = function () {
        modelRenderer.setTexture(textureName, img, flags);
        if (++loadedTextures === totalTextures) {
            requestAnimationFrame(tick);
        }
    };
    img.src = src;
}
function parseModel(isBinary, xhr) {
    if (isBinary) {
        return mdx_1.parse(xhr.response);
    }
    else {
        return mdl_1.parse(xhr.responseText);
    }
}
function processModelLoading() {
    console.log(model);
    loadedTextures = totalTextures = 0;
    modelRenderer = new modelRenderer_1.ModelRenderer(model);
    initGL();
    modelRenderer.initGL(gl);
    setAnimationList();
}
function setSampleTextures() {
    for (var _i = 0, _a = model.Textures; _i < _a.length; _i++) {
        var texture = _a[_i];
        if (texture.Image) {
            ++totalTextures;
            loadTexture(texture.Image, texture.Image, texture.Flags);
        }
    }
}
function setEmptyTextures() {
    for (var _i = 0, _a = model.Textures; _i < _a.length; _i++) {
        var texture = _a[_i];
        if (texture.Image) {
            ++totalTextures;
            loadTexture('preview/empty.png', texture.Image, 0);
        }
    }
}
function loadModel() {
    var xhr = new XMLHttpRequest();
    var file = 'preview/Footman.mdl';
    var isBinary = file.indexOf('.mdx') > -1;
    if (isBinary) {
        xhr.responseType = 'arraybuffer';
    }
    xhr.open('GET', file, true);
    xhr.onreadystatechange = function () {
        if (xhr.status === 200 && xhr.readyState === XMLHttpRequest.DONE) {
            model = parseModel(isBinary, xhr);
            processModelLoading();
            setSampleTextures();
        }
    };
    xhr.send();
}
function init() {
    canvas = document.getElementById('canvas');
    initControls();
    initCameraMove();
    initDragDrop();
    // loadModel();
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
}
function initControls() {
    var inputColor = document.getElementById('color');
    inputColor.addEventListener('input', function () {
        var val = inputColor.value.slice(1);
        var arr = gl_matrix_1.vec3.fromValues(parseInt(val.slice(0, 2), 16) / 255, parseInt(val.slice(2, 4), 16) / 255, parseInt(val.slice(4, 6), 16) / 255);
        modelRenderer.setTeamColor(arr);
    });
    var select = document.getElementById('select');
    select.addEventListener('input', function () {
        modelRenderer.setSequence(parseInt(select.value, 10));
    });
    var inputZ = document.getElementById('targetZ');
    inputZ.addEventListener('input', function () {
        cameraTargetZ = parseInt(inputZ.value, 10);
    });
    var inputDistance = document.getElementById('distance');
    inputDistance.addEventListener('input', function () {
        cameraDistance = parseInt(inputDistance.value, 10);
    });
}
function initCameraMove() {
    var down = false;
    var downX, downY;
    function coords(event) {
        var list = (event.changedTouches && event.changedTouches.length ?
            event.changedTouches :
            event.touches) || [event];
        return [list[0].pageX, list[0].pageY];
    }
    function updateCameraDistance(distance) {
        cameraDistance = distance;
        if (cameraDistance > 1000) {
            cameraDistance = 1000;
        }
        if (cameraDistance < 100) {
            cameraDistance = 100;
        }
        document.getElementById('distance').value = String(cameraDistance);
    }
    function pointerDown(event) {
        if (event.target !== canvas) {
            return;
        }
        down = true;
        _a = coords(event), downX = _a[0], downY = _a[1];
        var _a;
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
        var _a = coords(event), x = _a[0], y = _a[1];
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
    function pointerUp() {
        down = false;
    }
    function wheel(event) {
        updateCameraDistance(cameraDistance * (1 - event.deltaY / 30));
    }
    var startCameraDistance;
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
    var width = canvas.parentElement.offsetWidth;
    var height = canvas.parentElement.offsetHeight;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
}
function encode(html) {
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function setAnimationList() {
    var list = model.Sequences.map(function (seq) { return seq.Name; });
    if (list.length === 0) {
        list = ['None'];
    }
    var select = document.getElementById('select');
    select.innerHTML = list.map(function (item, index) { return "<option value=\"" + index + "\">" + encode(item) + "</option>"; }).join('');
}
function setDragDropTextures() {
    var texturesContainer = document.querySelector('.drag-textures');
    texturesContainer.innerHTML = '';
    for (var _i = 0, _a = model.Textures; _i < _a.length; _i++) {
        var texture = _a[_i];
        if (texture.Image) {
            var row = document.createElement('div');
            row.className = 'drag';
            row.textContent = texture.Image;
            row.setAttribute('data-texture', texture.Image);
            row.setAttribute('data-texture-flags', String(texture.Flags));
            texturesContainer.appendChild(row);
        }
    }
}
function initDragDrop() {
    var container = document.querySelector('.container');
    var dropTarget;
    container.addEventListener('dragenter', function onDragEnter(event) {
        var target = event.target;
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
    container.addEventListener('dragover', function onDragLeave(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });
    var dropModel = function (file) {
        var reader = new FileReader();
        var isMDX = file.name.indexOf('.mdx') > -1;
        reader.onload = function () {
            try {
                if (isMDX) {
                    model = mdx_1.parse(reader.result);
                }
                else {
                    model = mdl_1.parse(reader.result);
                }
            }
            catch (err) {
                // showError(err);
                return;
            }
            processModelLoading();
            setEmptyTextures();
            setDragDropTextures();
        };
        if (isMDX) {
            reader.readAsArrayBuffer(file);
        }
        else {
            reader.readAsText(file);
        }
    };
    var dropTexture = function (file) {
        var reader = new FileReader();
        var textureName = dropTarget.getAttribute('data-texture');
        var textureFlags = Number(dropTarget.getAttribute('data-texture-flags'));
        reader.onload = function () {
            var img = new Image();
            img.onload = function () {
                modelRenderer.setTexture(textureName, img, textureFlags);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    };
    container.addEventListener('drop', function onDrop(event) {
        event.preventDefault();
        container.classList.remove('container_drag');
        container.classList.add('container_custom');
        if (!dropTarget) {
            return;
        }
        dropTarget.classList.remove('drag_hovered');
        var file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (!file) {
            return;
        }
        if (dropTarget.getAttribute('data-texture')) {
            dropTexture(file);
        }
        else {
            dropModel(file);
        }
    });
}
document.addEventListener('DOMContentLoaded', init);
//# sourceMappingURL=preview.js.map
},{"../../parsers/mdl":13,"../../parsers/mdx":14,"../../renderer/modelRenderer":17,"../../renderer/util":20,"gl-matrix":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TextureFlags;
(function (TextureFlags) {
    TextureFlags[TextureFlags["WrapWidth"] = 1] = "WrapWidth";
    TextureFlags[TextureFlags["WrapHeight"] = 2] = "WrapHeight";
})(TextureFlags = exports.TextureFlags || (exports.TextureFlags = {}));
var FilterMode;
(function (FilterMode) {
    FilterMode[FilterMode["None"] = 0] = "None";
    FilterMode[FilterMode["Transparent"] = 1] = "Transparent";
    FilterMode[FilterMode["Blend"] = 2] = "Blend";
    FilterMode[FilterMode["Additive"] = 3] = "Additive";
    FilterMode[FilterMode["AddAlpha"] = 4] = "AddAlpha";
    FilterMode[FilterMode["Modulate"] = 5] = "Modulate";
    FilterMode[FilterMode["Modulate2x"] = 6] = "Modulate2x";
})(FilterMode = exports.FilterMode || (exports.FilterMode = {}));
var LineType;
(function (LineType) {
    LineType[LineType["DontInterp"] = 0] = "DontInterp";
    LineType[LineType["Linear"] = 1] = "Linear";
    LineType[LineType["Hermite"] = 2] = "Hermite";
    LineType[LineType["Bezier"] = 3] = "Bezier";
})(LineType = exports.LineType || (exports.LineType = {}));
var LayerShading;
(function (LayerShading) {
    LayerShading[LayerShading["Unshaded"] = 1] = "Unshaded";
    LayerShading[LayerShading["SphereEnvMap"] = 2] = "SphereEnvMap";
    LayerShading[LayerShading["TwoSided"] = 16] = "TwoSided";
    LayerShading[LayerShading["Unfogged"] = 32] = "Unfogged";
    LayerShading[LayerShading["NoDepthTest"] = 64] = "NoDepthTest";
    LayerShading[LayerShading["NoDepthSet"] = 128] = "NoDepthSet";
})(LayerShading = exports.LayerShading || (exports.LayerShading = {}));
var MaterialRenderMode;
(function (MaterialRenderMode) {
    MaterialRenderMode[MaterialRenderMode["ConstantColor"] = 1] = "ConstantColor";
    MaterialRenderMode[MaterialRenderMode["SortPrimsFarZ"] = 16] = "SortPrimsFarZ";
    MaterialRenderMode[MaterialRenderMode["FullResolution"] = 32] = "FullResolution";
})(MaterialRenderMode = exports.MaterialRenderMode || (exports.MaterialRenderMode = {}));
var GeosetAnimFlags;
(function (GeosetAnimFlags) {
    GeosetAnimFlags[GeosetAnimFlags["DropShadow"] = 1] = "DropShadow";
    GeosetAnimFlags[GeosetAnimFlags["Color"] = 2] = "Color";
})(GeosetAnimFlags = exports.GeosetAnimFlags || (exports.GeosetAnimFlags = {}));
var NodeFlags;
(function (NodeFlags) {
    NodeFlags[NodeFlags["DontInheritTranslation"] = 1] = "DontInheritTranslation";
    NodeFlags[NodeFlags["DontInheritRotation"] = 2] = "DontInheritRotation";
    NodeFlags[NodeFlags["DontInheritScaling"] = 4] = "DontInheritScaling";
    NodeFlags[NodeFlags["Billboarded"] = 8] = "Billboarded";
    NodeFlags[NodeFlags["BillboardedLockX"] = 16] = "BillboardedLockX";
    NodeFlags[NodeFlags["BillboardedLockY"] = 32] = "BillboardedLockY";
    NodeFlags[NodeFlags["BillboardedLockZ"] = 64] = "BillboardedLockZ";
    NodeFlags[NodeFlags["CameraAnchored"] = 128] = "CameraAnchored";
})(NodeFlags = exports.NodeFlags || (exports.NodeFlags = {}));
var NodeType;
(function (NodeType) {
    NodeType[NodeType["Helper"] = 0] = "Helper";
    NodeType[NodeType["Bone"] = 256] = "Bone";
    NodeType[NodeType["Light"] = 512] = "Light";
    NodeType[NodeType["EventObject"] = 1024] = "EventObject";
    NodeType[NodeType["Attachment"] = 2048] = "Attachment";
    NodeType[NodeType["ParticleEmitter"] = 4096] = "ParticleEmitter";
    NodeType[NodeType["CollisionShape"] = 8192] = "CollisionShape";
    NodeType[NodeType["RibbonEmitter"] = 16384] = "RibbonEmitter";
})(NodeType = exports.NodeType || (exports.NodeType = {}));
var CollisionShapeType;
(function (CollisionShapeType) {
    CollisionShapeType[CollisionShapeType["Box"] = 0] = "Box";
    CollisionShapeType[CollisionShapeType["Sphere"] = 2] = "Sphere";
})(CollisionShapeType = exports.CollisionShapeType || (exports.CollisionShapeType = {}));
var ParticleEmitterFlags;
(function (ParticleEmitterFlags) {
    ParticleEmitterFlags[ParticleEmitterFlags["EmitterUsesMDL"] = 32768] = "EmitterUsesMDL";
    ParticleEmitterFlags[ParticleEmitterFlags["EmitterUsesTGA"] = 65536] = "EmitterUsesTGA";
})(ParticleEmitterFlags = exports.ParticleEmitterFlags || (exports.ParticleEmitterFlags = {}));
var ParticleEmitter2Flags;
(function (ParticleEmitter2Flags) {
    ParticleEmitter2Flags[ParticleEmitter2Flags["Unshaded"] = 32768] = "Unshaded";
    ParticleEmitter2Flags[ParticleEmitter2Flags["SortPrimsFarZ"] = 65536] = "SortPrimsFarZ";
    ParticleEmitter2Flags[ParticleEmitter2Flags["LineEmitter"] = 131072] = "LineEmitter";
    ParticleEmitter2Flags[ParticleEmitter2Flags["Unfogged"] = 262144] = "Unfogged";
    ParticleEmitter2Flags[ParticleEmitter2Flags["ModelSpace"] = 524288] = "ModelSpace";
    ParticleEmitter2Flags[ParticleEmitter2Flags["XYQuad"] = 1048576] = "XYQuad";
})(ParticleEmitter2Flags = exports.ParticleEmitter2Flags || (exports.ParticleEmitter2Flags = {}));
var ParticleEmitter2FilterMode;
(function (ParticleEmitter2FilterMode) {
    ParticleEmitter2FilterMode[ParticleEmitter2FilterMode["Blend"] = 0] = "Blend";
    ParticleEmitter2FilterMode[ParticleEmitter2FilterMode["Additive"] = 1] = "Additive";
    ParticleEmitter2FilterMode[ParticleEmitter2FilterMode["Modulate"] = 2] = "Modulate";
    ParticleEmitter2FilterMode[ParticleEmitter2FilterMode["Modulate2x"] = 3] = "Modulate2x";
    ParticleEmitter2FilterMode[ParticleEmitter2FilterMode["AlphaKey"] = 4] = "AlphaKey";
})(ParticleEmitter2FilterMode = exports.ParticleEmitter2FilterMode || (exports.ParticleEmitter2FilterMode = {}));
// Not actually mapped to mdx flags (0: Head, 1: Tail, 2: Both)
var ParticleEmitter2FramesFlags;
(function (ParticleEmitter2FramesFlags) {
    ParticleEmitter2FramesFlags[ParticleEmitter2FramesFlags["Head"] = 1] = "Head";
    ParticleEmitter2FramesFlags[ParticleEmitter2FramesFlags["Tail"] = 2] = "Tail";
})(ParticleEmitter2FramesFlags = exports.ParticleEmitter2FramesFlags || (exports.ParticleEmitter2FramesFlags = {}));
var LightType;
(function (LightType) {
    LightType[LightType["Omnidirectional"] = 0] = "Omnidirectional";
    LightType[LightType["Directional"] = 1] = "Directional";
    LightType[LightType["Ambient"] = 2] = "Ambient";
})(LightType = exports.LightType || (exports.LightType = {}));
//# sourceMappingURL=model.js.map
},{}],3:[function(require,module,exports){
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.3.2
 */

/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */
// END HEADER

exports.glMatrix = require("./gl-matrix/common.js");
exports.mat2 = require("./gl-matrix/mat2.js");
exports.mat2d = require("./gl-matrix/mat2d.js");
exports.mat3 = require("./gl-matrix/mat3.js");
exports.mat4 = require("./gl-matrix/mat4.js");
exports.quat = require("./gl-matrix/quat.js");
exports.vec2 = require("./gl-matrix/vec2.js");
exports.vec3 = require("./gl-matrix/vec3.js");
exports.vec4 = require("./gl-matrix/vec4.js");
},{"./gl-matrix/common.js":4,"./gl-matrix/mat2.js":5,"./gl-matrix/mat2d.js":6,"./gl-matrix/mat3.js":7,"./gl-matrix/mat4.js":8,"./gl-matrix/quat.js":9,"./gl-matrix/vec2.js":10,"./gl-matrix/vec3.js":11,"./gl-matrix/vec4.js":12}],4:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

/**
 * @class Common utilities
 * @name glMatrix
 */
var glMatrix = {};

// Configuration Constants
glMatrix.EPSILON = 0.000001;
glMatrix.ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
glMatrix.RANDOM = Math.random;
glMatrix.ENABLE_SIMD = false;

// Capability detection
glMatrix.SIMD_AVAILABLE = (glMatrix.ARRAY_TYPE === Float32Array) && ('SIMD' in this);
glMatrix.USE_SIMD = glMatrix.ENABLE_SIMD && glMatrix.SIMD_AVAILABLE;

/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Type} type Array type, such as Float32Array or Array
 */
glMatrix.setMatrixArrayType = function(type) {
    glMatrix.ARRAY_TYPE = type;
}

var degree = Math.PI / 180;

/**
* Convert Degree To Radian
*
* @param {Number} Angle in Degrees
*/
glMatrix.toRadian = function(a){
     return a * degree;
}

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less 
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 * 
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */
glMatrix.equals = function(a, b) {
	return Math.abs(a - b) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a), Math.abs(b));
}

module.exports = glMatrix;

},{}],5:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 2x2 Matrix
 * @name mat2
 */
var mat2 = {};

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
mat2.create = function() {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {mat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
mat2.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
mat2.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Create a new mat2 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out A new 2x2 matrix
 */
mat2.fromValues = function(m00, m01, m10, m11) {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = m00;
    out[1] = m01;
    out[2] = m10;
    out[3] = m11;
    return out;
};

/**
 * Set the components of a mat2 to the given values
 *
 * @param {mat2} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out
 */
mat2.set = function(out, m00, m01, m10, m11) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m10;
    out[3] = m11;
    return out;
};


/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a1 = a[1];
        out[1] = a[2];
        out[2] = a1;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }
    
    return out;
};

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],

        // Calculate the determinant
        det = a0 * a3 - a2 * a1;

    if (!det) {
        return null;
    }
    det = 1.0 / det;
    
    out[0] =  a3 * det;
    out[1] = -a1 * det;
    out[2] = -a2 * det;
    out[3] =  a0 * det;

    return out;
};

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.adjoint = function(out, a) {
    // Caching this value is nessecary if out == a
    var a0 = a[0];
    out[0] =  a[3];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] =  a0;

    return out;
};

/**
 * Calculates the determinant of a mat2
 *
 * @param {mat2} a the source matrix
 * @returns {Number} determinant of a
 */
mat2.determinant = function (a) {
    return a[0] * a[3] - a[2] * a[1];
};

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    return out;
};

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
mat2.mul = mat2.multiply;

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a2 * s;
    out[1] = a1 *  c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    return out;
};

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
mat2.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    return out;
};

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.rotate(dest, dest, rad);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.fromRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.scale(dest, dest, vec);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat2} out
 */
mat2.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = v[1];
    return out;
}

/**
 * Returns a string representation of a mat2
 *
 * @param {mat2} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2.str = function (a) {
    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

/**
 * Returns Frobenius norm of a mat2
 *
 * @param {mat2} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat2.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2)))
};

/**
 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
 * @param {mat2} L the lower triangular matrix 
 * @param {mat2} D the diagonal matrix 
 * @param {mat2} U the upper triangular matrix 
 * @param {mat2} a the input matrix to factorize
 */

mat2.LDU = function (L, D, U, a) { 
    L[2] = a[2]/a[0]; 
    U[0] = a[0]; 
    U[1] = a[1]; 
    U[3] = a[3] - L[2] * U[1]; 
    return [L, D, U];       
}; 

/**
 * Adds two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
 * Alias for {@link mat2.subtract}
 * @function
 */
mat2.sub = mat2.subtract;

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat2} a The first matrix.
 * @param {mat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat2.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
};

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat2} a The first matrix.
 * @param {mat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat2.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)));
};

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2} out
 */
mat2.multiplyScalar = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
 * Adds two mat2's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2} out the receiving vector
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2} out
 */
mat2.multiplyScalarAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    return out;
};

module.exports = mat2;

},{"./common.js":4}],6:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 2x3 Matrix
 * @name mat2d
 * 
 * @description 
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, c, tx,
 *  b, d, ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, c, tx,
 *  b, d, ty,
 *  0, 0, 1]
 * </pre>
 * The last row is ignored so the array is shorter and operations are faster.
 */
var mat2d = {};

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.create = function() {
    var out = new glMatrix.ARRAY_TYPE(6);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {mat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(6);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
mat2d.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Create a new mat2d with the given values
 *
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} A new mat2d
 */
mat2d.fromValues = function(a, b, c, d, tx, ty) {
    var out = new glMatrix.ARRAY_TYPE(6);
    out[0] = a;
    out[1] = b;
    out[2] = c;
    out[3] = d;
    out[4] = tx;
    out[5] = ty;
    return out;
};

/**
 * Set the components of a mat2d to the given values
 *
 * @param {mat2d} out the receiving matrix
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} out
 */
mat2d.set = function(out, a, b, c, d, tx, ty) {
    out[0] = a;
    out[1] = b;
    out[2] = c;
    out[3] = d;
    out[4] = tx;
    out[5] = ty;
    return out;
};

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.invert = function(out, a) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5];

    var det = aa * ad - ab * ac;
    if(!det){
        return null;
    }
    det = 1.0 / det;

    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
};

/**
 * Calculates the determinant of a mat2d
 *
 * @param {mat2d} a the source matrix
 * @returns {Number} determinant of a
 */
mat2d.determinant = function (a) {
    return a[0] * a[3] - a[1] * a[2];
};

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    out[4] = a0 * b4 + a2 * b5 + a4;
    out[5] = a1 * b4 + a3 * b5 + a5;
    return out;
};

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
mat2d.mul = mat2d.multiply;

/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a2 * s;
    out[1] = a1 *  c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    out[4] = a4;
    out[5] = a5;
    return out;
};

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
mat2d.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    out[4] = a4;
    out[5] = a5;
    return out;
};

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
mat2d.translate = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        v0 = v[0], v1 = v[1];
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = a0 * v0 + a2 * v1 + a4;
    out[5] = a1 * v0 + a3 * v1 + a5;
    return out;
};

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.rotate(dest, dest, rad);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.fromRotation = function(out, rad) {
    var s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;
    out[4] = 0;
    out[5] = 0;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.scale(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat2d} out
 */
mat2d.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = v[1];
    out[4] = 0;
    out[5] = 0;
    return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.translate(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {vec2} v Translation vector
 * @returns {mat2d} out
 */
mat2d.fromTranslation = function(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = v[0];
    out[5] = v[1];
    return out;
}

/**
 * Returns a string representation of a mat2d
 *
 * @param {mat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2d.str = function (a) {
    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ')';
};

/**
 * Returns Frobenius norm of a mat2d
 *
 * @param {mat2d} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat2d.frob = function (a) { 
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + 1))
}; 

/**
 * Adds two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    return out;
};

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    return out;
};

/**
 * Alias for {@link mat2d.subtract}
 * @function
 */
mat2d.sub = mat2d.subtract;

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2d} out
 */
mat2d.multiplyScalar = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    return out;
};

/**
 * Adds two mat2d's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2d} out the receiving vector
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2d} out
 */
mat2d.multiplyScalarAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    out[4] = a[4] + (b[4] * scale);
    out[5] = a[5] + (b[5] * scale);
    return out;
};

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat2d} a The first matrix.
 * @param {mat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat2d.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
};

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat2d} a The first matrix.
 * @param {mat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat2d.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
            Math.abs(a4 - b4) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
            Math.abs(a5 - b5) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a5), Math.abs(b5)));
};

module.exports = mat2d;

},{"./common.js":4}],7:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 3x3 Matrix
 * @name mat3
 */
var mat3 = {};

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
mat3.create = function() {
    var out = new glMatrix.ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {mat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
mat3.fromMat4 = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
};

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
mat3.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Create a new mat3 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} A new mat3
 */
mat3.fromValues = function(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    var out = new glMatrix.ARRAY_TYPE(9);
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
};

/**
 * Set the components of a mat3 to the given values
 *
 * @param {mat3} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} out
 */
mat3.set = function(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
};

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
mat3.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }
    
    return out;
};

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    out[0] = (a11 * a22 - a12 * a21);
    out[1] = (a02 * a21 - a01 * a22);
    out[2] = (a01 * a12 - a02 * a11);
    out[3] = (a12 * a20 - a10 * a22);
    out[4] = (a00 * a22 - a02 * a20);
    out[5] = (a02 * a10 - a00 * a12);
    out[6] = (a10 * a21 - a11 * a20);
    out[7] = (a01 * a20 - a00 * a21);
    out[8] = (a00 * a11 - a01 * a10);
    return out;
};

/**
 * Calculates the determinant of a mat3
 *
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
mat3.mul = mat3.multiply;

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
mat3.translate = function(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],
        x = v[0], y = v[1];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;

    out[3] = a10;
    out[4] = a11;
    out[5] = a12;

    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
};

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        s = Math.sin(rad),
        c = Math.cos(rad);

    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;

    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;

    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
};

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.scale = function(out, a, v) {
    var x = v[0], y = v[1];

    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];

    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];

    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.translate(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {vec2} v Translation vector
 * @returns {mat3} out
 */
mat3.fromTranslation = function(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = v[0];
    out[7] = v[1];
    out[8] = 1;
    return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.rotate(dest, dest, rad);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.fromRotation = function(out, rad) {
    var s = Math.sin(rad), c = Math.cos(rad);

    out[0] = c;
    out[1] = s;
    out[2] = 0;

    out[3] = -s;
    out[4] = c;
    out[5] = 0;

    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.scale(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat3} out
 */
mat3.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;

    out[3] = 0;
    out[4] = v[1];
    out[5] = 0;

    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
}

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat2d} a the matrix to copy
 * @returns {mat3} out
 **/
mat3.fromMat2d = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;

    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;

    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
};

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;

    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;

    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;

    return out;
};

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
mat3.normalFromMat4 = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

    return out;
};

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

/**
 * Returns Frobenius norm of a mat3
 *
 * @param {mat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat3.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2)))
};

/**
 * Adds two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    return out;
};

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    return out;
};

/**
 * Alias for {@link mat3.subtract}
 * @function
 */
mat3.sub = mat3.subtract;

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat3} out
 */
mat3.multiplyScalar = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    return out;
};

/**
 * Adds two mat3's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat3} out the receiving vector
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat3} out
 */
mat3.multiplyScalarAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    out[4] = a[4] + (b[4] * scale);
    out[5] = a[5] + (b[5] * scale);
    out[6] = a[6] + (b[6] * scale);
    out[7] = a[7] + (b[7] * scale);
    out[8] = a[8] + (b[8] * scale);
    return out;
};

/*
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat3} a The first matrix.
 * @param {mat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat3.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && 
           a[3] === b[3] && a[4] === b[4] && a[5] === b[5] &&
           a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
};

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat3} a The first matrix.
 * @param {mat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat3.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7], a8 = a[8];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = a[6], b7 = b[7], b8 = b[8];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
            Math.abs(a4 - b4) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
            Math.abs(a5 - b5) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a5), Math.abs(b5)) &&
            Math.abs(a6 - b6) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a6), Math.abs(b6)) &&
            Math.abs(a7 - b7) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a7), Math.abs(b7)) &&
            Math.abs(a8 - b8) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a8), Math.abs(b8)));
};


module.exports = mat3;

},{"./common.js":4}],8:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 4x4 Matrix
 * @name mat4
 */
var mat4 = {
  scalar: {},
  SIMD: {},
};

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
mat4.create = function() {
    var out = new glMatrix.ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
mat4.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */
mat4.fromValues = function(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    var out = new glMatrix.ARRAY_TYPE(16);
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
};

/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */
mat4.set = function(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
};


/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
mat4.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Transpose the values of a mat4 not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.scalar.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }

    return out;
};

/**
 * Transpose the values of a mat4 using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.SIMD.transpose = function(out, a) {
    var a0, a1, a2, a3,
        tmp01, tmp23,
        out0, out1, out2, out3;

    a0 = SIMD.Float32x4.load(a, 0);
    a1 = SIMD.Float32x4.load(a, 4);
    a2 = SIMD.Float32x4.load(a, 8);
    a3 = SIMD.Float32x4.load(a, 12);

    tmp01 = SIMD.Float32x4.shuffle(a0, a1, 0, 1, 4, 5);
    tmp23 = SIMD.Float32x4.shuffle(a2, a3, 0, 1, 4, 5);
    out0  = SIMD.Float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
    out1  = SIMD.Float32x4.shuffle(tmp01, tmp23, 1, 3, 5, 7);
    SIMD.Float32x4.store(out, 0,  out0);
    SIMD.Float32x4.store(out, 4,  out1);

    tmp01 = SIMD.Float32x4.shuffle(a0, a1, 2, 3, 6, 7);
    tmp23 = SIMD.Float32x4.shuffle(a2, a3, 2, 3, 6, 7);
    out2  = SIMD.Float32x4.shuffle(tmp01, tmp23, 0, 2, 4, 6);
    out3  = SIMD.Float32x4.shuffle(tmp01, tmp23, 1, 3, 5, 7);
    SIMD.Float32x4.store(out, 8,  out2);
    SIMD.Float32x4.store(out, 12, out3);

    return out;
};

/**
 * Transpse a mat4 using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.transpose = glMatrix.USE_SIMD ? mat4.SIMD.transpose : mat4.scalar.transpose;

/**
 * Inverts a mat4 not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.scalar.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

/**
 * Inverts a mat4 using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.SIMD.invert = function(out, a) {
  var row0, row1, row2, row3,
      tmp1,
      minor0, minor1, minor2, minor3,
      det,
      a0 = SIMD.Float32x4.load(a, 0),
      a1 = SIMD.Float32x4.load(a, 4),
      a2 = SIMD.Float32x4.load(a, 8),
      a3 = SIMD.Float32x4.load(a, 12);

  // Compute matrix adjugate
  tmp1 = SIMD.Float32x4.shuffle(a0, a1, 0, 1, 4, 5);
  row1 = SIMD.Float32x4.shuffle(a2, a3, 0, 1, 4, 5);
  row0 = SIMD.Float32x4.shuffle(tmp1, row1, 0, 2, 4, 6);
  row1 = SIMD.Float32x4.shuffle(row1, tmp1, 1, 3, 5, 7);
  tmp1 = SIMD.Float32x4.shuffle(a0, a1, 2, 3, 6, 7);
  row3 = SIMD.Float32x4.shuffle(a2, a3, 2, 3, 6, 7);
  row2 = SIMD.Float32x4.shuffle(tmp1, row3, 0, 2, 4, 6);
  row3 = SIMD.Float32x4.shuffle(row3, tmp1, 1, 3, 5, 7);

  tmp1   = SIMD.Float32x4.mul(row2, row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor0 = SIMD.Float32x4.mul(row1, tmp1);
  minor1 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row1, tmp1), minor0);
  minor1 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor1);
  minor1 = SIMD.Float32x4.swizzle(minor1, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(row1, row2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor0 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor0);
  minor3 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(minor0, SIMD.Float32x4.mul(row3, tmp1));
  minor3 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor3);
  minor3 = SIMD.Float32x4.swizzle(minor3, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(row1, 2, 3, 0, 1), row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  row2   = SIMD.Float32x4.swizzle(row2, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row2, tmp1), minor0);
  minor2 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(minor0, SIMD.Float32x4.mul(row2, tmp1));
  minor2 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor2);
  minor2 = SIMD.Float32x4.swizzle(minor2, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(row0, row1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor2 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor2);
  minor3 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row2, tmp1), minor3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor2 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row3, tmp1), minor2);
  minor3 = SIMD.Float32x4.sub(minor3, SIMD.Float32x4.mul(row2, tmp1));

  tmp1   = SIMD.Float32x4.mul(row0, row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor1 = SIMD.Float32x4.sub(minor1, SIMD.Float32x4.mul(row2, tmp1));
  minor2 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row1, tmp1), minor2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor1 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row2, tmp1), minor1);
  minor2 = SIMD.Float32x4.sub(minor2, SIMD.Float32x4.mul(row1, tmp1));

  tmp1   = SIMD.Float32x4.mul(row0, row2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor1 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor1);
  minor3 = SIMD.Float32x4.sub(minor3, SIMD.Float32x4.mul(row1, tmp1));
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor1 = SIMD.Float32x4.sub(minor1, SIMD.Float32x4.mul(row3, tmp1));
  minor3 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row1, tmp1), minor3);

  // Compute matrix determinant
  det   = SIMD.Float32x4.mul(row0, minor0);
  det   = SIMD.Float32x4.add(SIMD.Float32x4.swizzle(det, 2, 3, 0, 1), det);
  det   = SIMD.Float32x4.add(SIMD.Float32x4.swizzle(det, 1, 0, 3, 2), det);
  tmp1  = SIMD.Float32x4.reciprocalApproximation(det);
  det   = SIMD.Float32x4.sub(
               SIMD.Float32x4.add(tmp1, tmp1),
               SIMD.Float32x4.mul(det, SIMD.Float32x4.mul(tmp1, tmp1)));
  det   = SIMD.Float32x4.swizzle(det, 0, 0, 0, 0);
  if (!det) {
      return null;
  }

  // Compute matrix inverse
  SIMD.Float32x4.store(out, 0,  SIMD.Float32x4.mul(det, minor0));
  SIMD.Float32x4.store(out, 4,  SIMD.Float32x4.mul(det, minor1));
  SIMD.Float32x4.store(out, 8,  SIMD.Float32x4.mul(det, minor2));
  SIMD.Float32x4.store(out, 12, SIMD.Float32x4.mul(det, minor3));
  return out;
}

/**
 * Inverts a mat4 using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.invert = glMatrix.USE_SIMD ? mat4.SIMD.invert : mat4.scalar.invert;

/**
 * Calculates the adjugate of a mat4 not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.scalar.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return out;
};

/**
 * Calculates the adjugate of a mat4 using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.SIMD.adjoint = function(out, a) {
  var a0, a1, a2, a3;
  var row0, row1, row2, row3;
  var tmp1;
  var minor0, minor1, minor2, minor3;

  var a0 = SIMD.Float32x4.load(a, 0);
  var a1 = SIMD.Float32x4.load(a, 4);
  var a2 = SIMD.Float32x4.load(a, 8);
  var a3 = SIMD.Float32x4.load(a, 12);

  // Transpose the source matrix.  Sort of.  Not a true transpose operation
  tmp1 = SIMD.Float32x4.shuffle(a0, a1, 0, 1, 4, 5);
  row1 = SIMD.Float32x4.shuffle(a2, a3, 0, 1, 4, 5);
  row0 = SIMD.Float32x4.shuffle(tmp1, row1, 0, 2, 4, 6);
  row1 = SIMD.Float32x4.shuffle(row1, tmp1, 1, 3, 5, 7);

  tmp1 = SIMD.Float32x4.shuffle(a0, a1, 2, 3, 6, 7);
  row3 = SIMD.Float32x4.shuffle(a2, a3, 2, 3, 6, 7);
  row2 = SIMD.Float32x4.shuffle(tmp1, row3, 0, 2, 4, 6);
  row3 = SIMD.Float32x4.shuffle(row3, tmp1, 1, 3, 5, 7);

  tmp1   = SIMD.Float32x4.mul(row2, row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor0 = SIMD.Float32x4.mul(row1, tmp1);
  minor1 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row1, tmp1), minor0);
  minor1 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor1);
  minor1 = SIMD.Float32x4.swizzle(minor1, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(row1, row2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor0 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor0);
  minor3 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(minor0, SIMD.Float32x4.mul(row3, tmp1));
  minor3 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor3);
  minor3 = SIMD.Float32x4.swizzle(minor3, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(row1, 2, 3, 0, 1), row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  row2   = SIMD.Float32x4.swizzle(row2, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row2, tmp1), minor0);
  minor2 = SIMD.Float32x4.mul(row0, tmp1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor0 = SIMD.Float32x4.sub(minor0, SIMD.Float32x4.mul(row2, tmp1));
  minor2 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row0, tmp1), minor2);
  minor2 = SIMD.Float32x4.swizzle(minor2, 2, 3, 0, 1);

  tmp1   = SIMD.Float32x4.mul(row0, row1);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor2 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor2);
  minor3 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row2, tmp1), minor3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor2 = SIMD.Float32x4.sub(SIMD.Float32x4.mul(row3, tmp1), minor2);
  minor3 = SIMD.Float32x4.sub(minor3, SIMD.Float32x4.mul(row2, tmp1));

  tmp1   = SIMD.Float32x4.mul(row0, row3);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor1 = SIMD.Float32x4.sub(minor1, SIMD.Float32x4.mul(row2, tmp1));
  minor2 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row1, tmp1), minor2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor1 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row2, tmp1), minor1);
  minor2 = SIMD.Float32x4.sub(minor2, SIMD.Float32x4.mul(row1, tmp1));

  tmp1   = SIMD.Float32x4.mul(row0, row2);
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 1, 0, 3, 2);
  minor1 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row3, tmp1), minor1);
  minor3 = SIMD.Float32x4.sub(minor3, SIMD.Float32x4.mul(row1, tmp1));
  tmp1   = SIMD.Float32x4.swizzle(tmp1, 2, 3, 0, 1);
  minor1 = SIMD.Float32x4.sub(minor1, SIMD.Float32x4.mul(row3, tmp1));
  minor3 = SIMD.Float32x4.add(SIMD.Float32x4.mul(row1, tmp1), minor3);

  SIMD.Float32x4.store(out, 0,  minor0);
  SIMD.Float32x4.store(out, 4,  minor1);
  SIMD.Float32x4.store(out, 8,  minor2);
  SIMD.Float32x4.store(out, 12, minor3);
  return out;
};

/**
 * Calculates the adjugate of a mat4 using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
 mat4.adjoint = glMatrix.USE_SIMD ? mat4.SIMD.adjoint : mat4.scalar.adjoint;

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
mat4.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

/**
 * Multiplies two mat4's explicitly using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand, must be a Float32Array
 * @param {mat4} b the second operand, must be a Float32Array
 * @returns {mat4} out
 */
mat4.SIMD.multiply = function (out, a, b) {
    var a0 = SIMD.Float32x4.load(a, 0);
    var a1 = SIMD.Float32x4.load(a, 4);
    var a2 = SIMD.Float32x4.load(a, 8);
    var a3 = SIMD.Float32x4.load(a, 12);

    var b0 = SIMD.Float32x4.load(b, 0);
    var out0 = SIMD.Float32x4.add(
                   SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b0, 0, 0, 0, 0), a0),
                   SIMD.Float32x4.add(
                       SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b0, 1, 1, 1, 1), a1),
                       SIMD.Float32x4.add(
                           SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b0, 2, 2, 2, 2), a2),
                           SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b0, 3, 3, 3, 3), a3))));
    SIMD.Float32x4.store(out, 0, out0);

    var b1 = SIMD.Float32x4.load(b, 4);
    var out1 = SIMD.Float32x4.add(
                   SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b1, 0, 0, 0, 0), a0),
                   SIMD.Float32x4.add(
                       SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b1, 1, 1, 1, 1), a1),
                       SIMD.Float32x4.add(
                           SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b1, 2, 2, 2, 2), a2),
                           SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b1, 3, 3, 3, 3), a3))));
    SIMD.Float32x4.store(out, 4, out1);

    var b2 = SIMD.Float32x4.load(b, 8);
    var out2 = SIMD.Float32x4.add(
                   SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b2, 0, 0, 0, 0), a0),
                   SIMD.Float32x4.add(
                       SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b2, 1, 1, 1, 1), a1),
                       SIMD.Float32x4.add(
                               SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b2, 2, 2, 2, 2), a2),
                               SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b2, 3, 3, 3, 3), a3))));
    SIMD.Float32x4.store(out, 8, out2);

    var b3 = SIMD.Float32x4.load(b, 12);
    var out3 = SIMD.Float32x4.add(
                   SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b3, 0, 0, 0, 0), a0),
                   SIMD.Float32x4.add(
                        SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b3, 1, 1, 1, 1), a1),
                        SIMD.Float32x4.add(
                            SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b3, 2, 2, 2, 2), a2),
                            SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(b3, 3, 3, 3, 3), a3))));
    SIMD.Float32x4.store(out, 12, out3);

    return out;
};

/**
 * Multiplies two mat4's explicitly not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.scalar.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

/**
 * Multiplies two mat4's using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.multiply = glMatrix.USE_SIMD ? mat4.SIMD.multiply : mat4.scalar.multiply;

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
mat4.mul = mat4.multiply;

/**
 * Translate a mat4 by the given vector not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.scalar.translate = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
};

/**
 * Translates a mat4 by the given vector using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.SIMD.translate = function (out, a, v) {
    var a0 = SIMD.Float32x4.load(a, 0),
        a1 = SIMD.Float32x4.load(a, 4),
        a2 = SIMD.Float32x4.load(a, 8),
        a3 = SIMD.Float32x4.load(a, 12),
        vec = SIMD.Float32x4(v[0], v[1], v[2] , 0);

    if (a !== out) {
        out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
        out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
        out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
    }

    a0 = SIMD.Float32x4.mul(a0, SIMD.Float32x4.swizzle(vec, 0, 0, 0, 0));
    a1 = SIMD.Float32x4.mul(a1, SIMD.Float32x4.swizzle(vec, 1, 1, 1, 1));
    a2 = SIMD.Float32x4.mul(a2, SIMD.Float32x4.swizzle(vec, 2, 2, 2, 2));

    var t0 = SIMD.Float32x4.add(a0, SIMD.Float32x4.add(a1, SIMD.Float32x4.add(a2, a3)));
    SIMD.Float32x4.store(out, 12, t0);

    return out;
};

/**
 * Translates a mat4 by the given vector using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.translate = glMatrix.USE_SIMD ? mat4.SIMD.translate : mat4.scalar.translate;

/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
mat4.scalar.scale = function(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Scales the mat4 by the dimensions in the given vec3 using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
mat4.SIMD.scale = function(out, a, v) {
    var a0, a1, a2;
    var vec = SIMD.Float32x4(v[0], v[1], v[2], 0);

    a0 = SIMD.Float32x4.load(a, 0);
    SIMD.Float32x4.store(
        out, 0, SIMD.Float32x4.mul(a0, SIMD.Float32x4.swizzle(vec, 0, 0, 0, 0)));

    a1 = SIMD.Float32x4.load(a, 4);
    SIMD.Float32x4.store(
        out, 4, SIMD.Float32x4.mul(a1, SIMD.Float32x4.swizzle(vec, 1, 1, 1, 1)));

    a2 = SIMD.Float32x4.load(a, 8);
    SIMD.Float32x4.store(
        out, 8, SIMD.Float32x4.mul(a2, SIMD.Float32x4.swizzle(vec, 2, 2, 2, 2)));

    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Scales the mat4 by the dimensions in the given vec3 using SIMD if available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 */
mat4.scale = glMatrix.USE_SIMD ? mat4.SIMD.scale : mat4.scalar.scale;

/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.rotate = function (out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < glMatrix.EPSILON) { return null; }

    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.scalar.rotateX = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0]  = a[0];
        out[1]  = a[1];
        out[2]  = a[2];
        out[3]  = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.SIMD.rotateX = function (out, a, rad) {
    var s = SIMD.Float32x4.splat(Math.sin(rad)),
        c = SIMD.Float32x4.splat(Math.cos(rad));

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
      out[0]  = a[0];
      out[1]  = a[1];
      out[2]  = a[2];
      out[3]  = a[3];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    var a_1 = SIMD.Float32x4.load(a, 4);
    var a_2 = SIMD.Float32x4.load(a, 8);
    SIMD.Float32x4.store(out, 4,
                         SIMD.Float32x4.add(SIMD.Float32x4.mul(a_1, c), SIMD.Float32x4.mul(a_2, s)));
    SIMD.Float32x4.store(out, 8,
                         SIMD.Float32x4.sub(SIMD.Float32x4.mul(a_2, c), SIMD.Float32x4.mul(a_1, s)));
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis using SIMD if availabe and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateX = glMatrix.USE_SIMD ? mat4.SIMD.rotateX : mat4.scalar.rotateX;

/**
 * Rotates a matrix by the given angle around the Y axis not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.scalar.rotateY = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Y axis using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.SIMD.rotateY = function (out, a, rad) {
    var s = SIMD.Float32x4.splat(Math.sin(rad)),
        c = SIMD.Float32x4.splat(Math.cos(rad));

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    var a_0 = SIMD.Float32x4.load(a, 0);
    var a_2 = SIMD.Float32x4.load(a, 8);
    SIMD.Float32x4.store(out, 0,
                         SIMD.Float32x4.sub(SIMD.Float32x4.mul(a_0, c), SIMD.Float32x4.mul(a_2, s)));
    SIMD.Float32x4.store(out, 8,
                         SIMD.Float32x4.add(SIMD.Float32x4.mul(a_0, s), SIMD.Float32x4.mul(a_2, c)));
    return out;
};

/**
 * Rotates a matrix by the given angle around the Y axis if SIMD available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
 mat4.rotateY = glMatrix.USE_SIMD ? mat4.SIMD.rotateY : mat4.scalar.rotateY;

/**
 * Rotates a matrix by the given angle around the Z axis not using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.scalar.rotateZ = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Z axis using SIMD
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.SIMD.rotateZ = function (out, a, rad) {
    var s = SIMD.Float32x4.splat(Math.sin(rad)),
        c = SIMD.Float32x4.splat(Math.cos(rad));

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    var a_0 = SIMD.Float32x4.load(a, 0);
    var a_1 = SIMD.Float32x4.load(a, 4);
    SIMD.Float32x4.store(out, 0,
                         SIMD.Float32x4.add(SIMD.Float32x4.mul(a_0, c), SIMD.Float32x4.mul(a_1, s)));
    SIMD.Float32x4.store(out, 4,
                         SIMD.Float32x4.sub(SIMD.Float32x4.mul(a_1, c), SIMD.Float32x4.mul(a_0, s)));
    return out;
};

/**
 * Rotates a matrix by the given angle around the Z axis if SIMD available and enabled
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
 mat4.rotateZ = glMatrix.USE_SIMD ? mat4.SIMD.rotateZ : mat4.scalar.rotateZ;

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromTranslation = function(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Scaling vector
 * @returns {mat4} out
 */
mat4.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = v[1];
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = v[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.fromRotation = function(out, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t;

    if (Math.abs(len) < glMatrix.EPSILON) { return null; }

    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    // Perform rotation-specific matrix multiplication
    out[0] = x * x * t + c;
    out[1] = y * x * t + z * s;
    out[2] = z * x * t - y * s;
    out[3] = 0;
    out[4] = x * y * t - z * s;
    out[5] = y * y * t + c;
    out[6] = z * y * t + x * s;
    out[7] = 0;
    out[8] = x * z * t + y * s;
    out[9] = y * z * t - x * s;
    out[10] = z * z * t + c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.fromXRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);

    // Perform axis-specific matrix multiplication
    out[0]  = 1;
    out[1]  = 0;
    out[2]  = 0;
    out[3]  = 0;
    out[4] = 0;
    out[5] = c;
    out[6] = s;
    out[7] = 0;
    out[8] = 0;
    out[9] = -s;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.fromYRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);

    // Perform axis-specific matrix multiplication
    out[0]  = c;
    out[1]  = 0;
    out[2]  = -s;
    out[3]  = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = s;
    out[9] = 0;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.fromZRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);

    // Perform axis-specific matrix multiplication
    out[0]  = c;
    out[1]  = s;
    out[2]  = 0;
    out[3]  = 0;
    out[4] = -s;
    out[5] = c;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromRotationTranslation = function (out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
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
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;

    return out;
};

/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {mat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
mat4.getTranslation = function (out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];

  return out;
};

/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {mat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */
mat4.getRotation = function (out, mat) {
  // Algorithm taken from http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
  var trace = mat[0] + mat[5] + mat[10];
  var S = 0;

  if (trace > 0) { 
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (mat[6] - mat[9]) / S;
    out[1] = (mat[8] - mat[2]) / S; 
    out[2] = (mat[1] - mat[4]) / S; 
  } else if ((mat[0] > mat[5])&(mat[0] > mat[10])) { 
    S = Math.sqrt(1.0 + mat[0] - mat[5] - mat[10]) * 2;
    out[3] = (mat[6] - mat[9]) / S;
    out[0] = 0.25 * S;
    out[1] = (mat[1] + mat[4]) / S; 
    out[2] = (mat[8] + mat[2]) / S; 
  } else if (mat[5] > mat[10]) { 
    S = Math.sqrt(1.0 + mat[5] - mat[0] - mat[10]) * 2;
    out[3] = (mat[8] - mat[2]) / S;
    out[0] = (mat[1] + mat[4]) / S; 
    out[1] = 0.25 * S;
    out[2] = (mat[6] + mat[9]) / S; 
  } else { 
    S = Math.sqrt(1.0 + mat[10] - mat[0] - mat[5]) * 2;
    out[3] = (mat[1] - mat[4]) / S;
    out[0] = (mat[8] + mat[2]) / S;
    out[1] = (mat[6] + mat[9]) / S;
    out[2] = 0.25 * S;
  }

  return out;
};

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @param {vec3} s Scaling vector
 * @returns {mat4} out
 */
mat4.fromRotationTranslationScale = function (out, q, v, s) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
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
        sx = s[0],
        sy = s[1],
        sz = s[2];

    out[0] = (1 - (yy + zz)) * sx;
    out[1] = (xy + wz) * sx;
    out[2] = (xz - wy) * sx;
    out[3] = 0;
    out[4] = (xy - wz) * sy;
    out[5] = (1 - (xx + zz)) * sy;
    out[6] = (yz + wx) * sy;
    out[7] = 0;
    out[8] = (xz + wy) * sz;
    out[9] = (yz - wx) * sz;
    out[10] = (1 - (xx + yy)) * sz;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;

    return out;
};

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     mat4.translate(dest, origin);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *     mat4.translate(dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @param {vec3} s Scaling vector
 * @param {vec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */
mat4.fromRotationTranslationScaleOrigin = function (out, q, v, s, o) {
  // Quaternion math
  var x = q[0], y = q[1], z = q[2], w = q[3],
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

      sx = s[0],
      sy = s[1],
      sz = s[2],

      ox = o[0],
      oy = o[1],
      oz = o[2];

  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0] + ox - (out[0] * ox + out[4] * oy + out[8] * oz);
  out[13] = v[1] + oy - (out[1] * ox + out[5] * oy + out[9] * oz);
  out[14] = v[2] + oz - (out[2] * ox + out[6] * oy + out[10] * oz);
  out[15] = 1;

  return out;
};

/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */
mat4.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;

    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;

    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.frustum = function (out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspective = function (out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspectiveFromFieldOfView = function (out, fov, near, far) {
    var upTan = Math.tan(fov.upDegrees * Math.PI/180.0),
        downTan = Math.tan(fov.downDegrees * Math.PI/180.0),
        leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0),
        rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0),
        xScale = 2.0 / (leftTan + rightTan),
        yScale = 2.0 / (upTan + downTan);

    out[0] = xScale;
    out[1] = 0.0;
    out[2] = 0.0;
    out[3] = 0.0;
    out[4] = 0.0;
    out[5] = yScale;
    out[6] = 0.0;
    out[7] = 0.0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = ((upTan - downTan) * yScale * 0.5);
    out[10] = far / (near - far);
    out[11] = -1.0;
    out[12] = 0.0;
    out[13] = 0.0;
    out[14] = (far * near) / (near - far);
    out[15] = 0.0;
    return out;
}

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAt = function (out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < glMatrix.EPSILON &&
        Math.abs(eyey - centery) < glMatrix.EPSILON &&
        Math.abs(eyez - centerz) < glMatrix.EPSILON) {
        return mat4.identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};

/**
 * Returns a string representation of a mat4
 *
 * @param {mat4} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat4.str = function (a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' +
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

/**
 * Returns Frobenius norm of a mat4
 *
 * @param {mat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat4.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2) + Math.pow(a[9], 2) + Math.pow(a[10], 2) + Math.pow(a[11], 2) + Math.pow(a[12], 2) + Math.pow(a[13], 2) + Math.pow(a[14], 2) + Math.pow(a[15], 2) ))
};

/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    out[9] = a[9] + b[9];
    out[10] = a[10] + b[10];
    out[11] = a[11] + b[11];
    out[12] = a[12] + b[12];
    out[13] = a[13] + b[13];
    out[14] = a[14] + b[14];
    out[15] = a[15] + b[15];
    return out;
};

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    out[9] = a[9] - b[9];
    out[10] = a[10] - b[10];
    out[11] = a[11] - b[11];
    out[12] = a[12] - b[12];
    out[13] = a[13] - b[13];
    out[14] = a[14] - b[14];
    out[15] = a[15] - b[15];
    return out;
};

/**
 * Alias for {@link mat4.subtract}
 * @function
 */
mat4.sub = mat4.subtract;

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */
mat4.multiplyScalar = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    out[9] = a[9] * b;
    out[10] = a[10] * b;
    out[11] = a[11] * b;
    out[12] = a[12] * b;
    out[13] = a[13] * b;
    out[14] = a[14] * b;
    out[15] = a[15] * b;
    return out;
};

/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */
mat4.multiplyScalarAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    out[4] = a[4] + (b[4] * scale);
    out[5] = a[5] + (b[5] * scale);
    out[6] = a[6] + (b[6] * scale);
    out[7] = a[7] + (b[7] * scale);
    out[8] = a[8] + (b[8] * scale);
    out[9] = a[9] + (b[9] * scale);
    out[10] = a[10] + (b[10] * scale);
    out[11] = a[11] + (b[11] * scale);
    out[12] = a[12] + (b[12] * scale);
    out[13] = a[13] + (b[13] * scale);
    out[14] = a[14] + (b[14] * scale);
    out[15] = a[15] + (b[15] * scale);
    return out;
};

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat4} a The first matrix.
 * @param {mat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat4.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && 
           a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && 
           a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] &&
           a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
};

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat4} a The first matrix.
 * @param {mat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
mat4.equals = function (a, b) {
    var a0  = a[0],  a1  = a[1],  a2  = a[2],  a3  = a[3],
        a4  = a[4],  a5  = a[5],  a6  = a[6],  a7  = a[7], 
        a8  = a[8],  a9  = a[9],  a10 = a[10], a11 = a[11], 
        a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];

    var b0  = b[0],  b1  = b[1],  b2  = b[2],  b3  = b[3],
        b4  = b[4],  b5  = b[5],  b6  = b[6],  b7  = b[7], 
        b8  = b[8],  b9  = b[9],  b10 = b[10], b11 = b[11], 
        b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];

    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
            Math.abs(a4 - b4) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
            Math.abs(a5 - b5) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a5), Math.abs(b5)) &&
            Math.abs(a6 - b6) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a6), Math.abs(b6)) &&
            Math.abs(a7 - b7) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a7), Math.abs(b7)) &&
            Math.abs(a8 - b8) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a8), Math.abs(b8)) &&
            Math.abs(a9 - b9) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a9), Math.abs(b9)) &&
            Math.abs(a10 - b10) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a10), Math.abs(b10)) &&
            Math.abs(a11 - b11) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a11), Math.abs(b11)) &&
            Math.abs(a12 - b12) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a12), Math.abs(b12)) &&
            Math.abs(a13 - b13) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a13), Math.abs(b13)) &&
            Math.abs(a14 - b14) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a14), Math.abs(b14)) &&
            Math.abs(a15 - b15) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a15), Math.abs(b15)));
};



module.exports = mat4;

},{"./common.js":4}],9:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");
var mat3 = require("./mat3.js");
var vec3 = require("./vec3.js");
var vec4 = require("./vec4.js");

/**
 * @class Quaternion
 * @name quat
 */
var quat = {};

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
quat.create = function() {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {vec3} a the initial vector
 * @param {vec3} b the destination vector
 * @returns {quat} out
 */
quat.rotationTo = (function() {
    var tmpvec3 = vec3.create();
    var xUnitVec3 = vec3.fromValues(1,0,0);
    var yUnitVec3 = vec3.fromValues(0,1,0);

    return function(out, a, b) {
        var dot = vec3.dot(a, b);
        if (dot < -0.999999) {
            vec3.cross(tmpvec3, xUnitVec3, a);
            if (vec3.length(tmpvec3) < 0.000001)
                vec3.cross(tmpvec3, yUnitVec3, a);
            vec3.normalize(tmpvec3, tmpvec3);
            quat.setAxisAngle(out, tmpvec3, Math.PI);
            return out;
        } else if (dot > 0.999999) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        } else {
            vec3.cross(tmpvec3, a, b);
            out[0] = tmpvec3[0];
            out[1] = tmpvec3[1];
            out[2] = tmpvec3[2];
            out[3] = 1 + dot;
            return quat.normalize(out, out);
        }
    };
})();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {vec3} view  the vector representing the viewing direction
 * @param {vec3} right the vector representing the local "right" direction
 * @param {vec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
quat.setAxes = (function() {
    var matr = mat3.create();

    return function(out, view, right, up) {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];

        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];

        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];

        return quat.normalize(out, quat.fromMat3(out, matr));
    };
})();

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {quat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
quat.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
quat.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the source quaternion
 * @returns {quat} out
 * @function
 */
quat.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
quat.set = vec4.set;

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
quat.identity = function(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {vec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
quat.setAxisAngle = function(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
};

/**
 * Gets the rotation axis and angle for a given
 *  quaternion. If a quaternion is created with
 *  setAxisAngle, this method will return the same
 *  values as providied in the original parameter list
 *  OR functionally equivalent values.
 * Example: The quaternion formed by axis [0, 0, 1] and
 *  angle -90 is the same as the quaternion formed by
 *  [0, 0, 1] and 270. This method favors the latter.
 * @param  {vec3} out_axis  Vector receiving the axis of rotation
 * @param  {quat} q     Quaternion to be decomposed
 * @return {Number}     Angle, in radians, of the rotation
 */
quat.getAxisAngle = function(out_axis, q) {
    var rad = Math.acos(q[3]) * 2.0;
    var s = Math.sin(rad / 2.0);
    if (s != 0.0) {
        out_axis[0] = q[0] / s;
        out_axis[1] = q[1] / s;
        out_axis[2] = q[2] / s;
    } else {
        // If s is zero, return any axis (no rotation - axis does not matter)
        out_axis[0] = 1;
        out_axis[1] = 0;
        out_axis[2] = 0;
    }
    return rad;
};

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 * @function
 */
quat.add = vec4.add;

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 */
quat.multiply = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
};

/**
 * Alias for {@link quat.multiply}
 * @function
 */
quat.mul = quat.multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {quat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
quat.scale = vec4.scale;

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateX = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateY = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateZ = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bz = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
};

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate W component of
 * @returns {quat} out
 */
quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
};

/**
 * Calculates the dot product of two quat's
 *
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
quat.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 * @function
 */
quat.lerp = vec4.lerp;

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
quat.slerp = function (out, a, b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    var        omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if ( cosom < 0.0 ) {
        cosom = -cosom;
        bx = - bx;
        by = - by;
        bz = - bz;
        bw = - bw;
    }
    // calculate coefficients
    if ( (1.0 - cosom) > 0.000001 ) {
        // standard case (slerp)
        omega  = Math.acos(cosom);
        sinom  = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {        
        // "from" and "to" quaternions are very close 
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    
    return out;
};

/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {quat} c the third operand
 * @param {quat} d the fourth operand
 * @param {Number} t interpolation amount
 * @returns {quat} out
 */
quat.sqlerp = (function () {
  var temp1 = quat.create();
  var temp2 = quat.create();
  
  return function (out, a, b, c, d, t) {
    quat.slerp(temp1, a, d, t);
    quat.slerp(temp2, b, c, t);
    quat.slerp(out, temp1, temp2, 2 * t * (1 - t));
    
    return out;
  };
}());

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate inverse of
 * @returns {quat} out
 */
quat.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0*invDot;
    out[1] = -a1*invDot;
    out[2] = -a2*invDot;
    out[3] = a3*invDot;
    return out;
};

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate conjugate of
 * @returns {quat} out
 */
quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
};

/**
 * Calculates the length of a quat
 *
 * @param {quat} a vector to calculate length of
 * @returns {Number} length of a
 * @function
 */
quat.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
quat.len = quat.length;

/**
 * Calculates the squared length of a quat
 *
 * @param {quat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
quat.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
quat.sqrLen = quat.squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
quat.normalize = vec4.normalize;

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
quat.fromMat3 = function(out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if ( fTrace > 0.0 ) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0);  // 2w
        out[3] = 0.5 * fRoot;
        fRoot = 0.5/fRoot;  // 1/(4w)
        out[0] = (m[5]-m[7])*fRoot;
        out[1] = (m[6]-m[2])*fRoot;
        out[2] = (m[1]-m[3])*fRoot;
    } else {
        // |w| <= 1/2
        var i = 0;
        if ( m[4] > m[0] )
          i = 1;
        if ( m[8] > m[i*3+i] )
          i = 2;
        var j = (i+1)%3;
        var k = (i+2)%3;
        
        fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[j*3+k] - m[k*3+j]) * fRoot;
        out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
        out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
    }
    
    return out;
};

/**
 * Returns a string representation of a quatenion
 *
 * @param {quat} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

/**
 * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {quat} a The first quaternion.
 * @param {quat} b The second quaternion.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
quat.exactEquals = vec4.exactEquals;

/**
 * Returns whether or not the quaternions have approximately the same elements in the same position.
 *
 * @param {quat} a The first vector.
 * @param {quat} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
quat.equals = vec4.equals;

module.exports = quat;

},{"./common.js":4,"./mat3.js":7,"./vec3.js":11,"./vec4.js":12}],10:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 2 Dimensional Vector
 * @name vec2
 */
var vec2 = {};

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
vec2.create = function() {
    var out = new glMatrix.ARRAY_TYPE(2);
    out[0] = 0;
    out[1] = 0;
    return out;
};

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
vec2.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
vec2.fromValues = function(x, y) {
    var out = new glMatrix.ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
vec2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
vec2.set = function(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
vec2.sub = vec2.subtract;

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
};

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
vec2.mul = vec2.multiply;

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
};

/**
 * Alias for {@link vec2.divide}
 * @function
 */
vec2.div = vec2.divide;

/**
 * Math.ceil the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to ceil
 * @returns {vec2} out
 */
vec2.ceil = function (out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    return out;
};

/**
 * Math.floor the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to floor
 * @returns {vec2} out
 */
vec2.floor = function (out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    return out;
};

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
};

/**
 * Math.round the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to round
 * @returns {vec2} out
 */
vec2.round = function (out, a) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
vec2.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
vec2.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
vec2.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.distance}
 * @function
 */
vec2.dist = vec2.distance;

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec2.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
vec2.sqrDist = vec2.squaredDistance;

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
vec2.length = function (a) {
    var x = a[0],
        y = a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.length}
 * @function
 */
vec2.len = vec2.length;

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec2.squaredLength = function (a) {
    var x = a[0],
        y = a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
vec2.sqrLen = vec2.squaredLength;

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
vec2.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to invert
 * @returns {vec2} out
 */
vec2.inverse = function(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1];
    var len = x*x + y*y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
vec2.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
vec2.cross = function(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
vec2.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */
vec2.random = function (out, scale) {
    scale = scale || 1.0;
    var r = glMatrix.RANDOM() * 2.0 * Math.PI;
    out[0] = Math.cos(r) * scale;
    out[1] = Math.sin(r) * scale;
    return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2d = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat4 = function(out, a, m) {
    var x = a[0], 
        y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
};

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec2.forEach = (function() {
    var vec = vec2.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec2} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec2.str = function (a) {
    return 'vec2(' + a[0] + ', ' + a[1] + ')';
};

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {vec2} a The first vector.
 * @param {vec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec2.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1];
};

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec2} a The first vector.
 * @param {vec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec2.equals = function (a, b) {
    var a0 = a[0], a1 = a[1];
    var b0 = b[0], b1 = b[1];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)));
};

module.exports = vec2;

},{"./common.js":4}],11:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 3 Dimensional Vector
 * @name vec3
 */
var vec3 = {};

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
vec3.create = function() {
    var out = new glMatrix.ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
};

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
vec3.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
vec3.fromValues = function(x, y, z) {
    var out = new glMatrix.ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
vec3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
vec3.set = function(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
};

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
vec3.sub = vec3.subtract;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
};

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
vec3.mul = vec3.multiply;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
};

/**
 * Alias for {@link vec3.divide}
 * @function
 */
vec3.div = vec3.divide;

/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to ceil
 * @returns {vec3} out
 */
vec3.ceil = function (out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    return out;
};

/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to floor
 * @returns {vec3} out
 */
vec3.floor = function (out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    return out;
};

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
};

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
};

/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to round
 * @returns {vec3} out
 */
vec3.round = function (out, a) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    out[2] = Math.round(a[2]);
    return out;
};

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
vec3.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
};

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
vec3.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
vec3.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.distance}
 * @function
 */
vec3.dist = vec3.distance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec3.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
vec3.sqrDist = vec3.squaredDistance;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
vec3.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.length}
 * @function
 */
vec3.len = vec3.length;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec3.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
vec3.sqrLen = vec3.squaredLength;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
vec3.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
};

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to invert
 * @returns {vec3} out
 */
vec3.inverse = function(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
};

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
vec3.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
vec3.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.cross = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
};

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
};

/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {vec3} c the third operand
 * @param {vec3} d the fourth operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.hermite = function (out, a, b, c, d, t) {
  var factorTimes2 = t * t,
      factor1 = factorTimes2 * (2 * t - 3) + 1,
      factor2 = factorTimes2 * (t - 2) + t,
      factor3 = factorTimes2 * (t - 1),
      factor4 = factorTimes2 * (3 - 2 * t);
  
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  
  return out;
};

/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {vec3} c the third operand
 * @param {vec3} d the fourth operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.bezier = function (out, a, b, c, d, t) {
  var inverseFactor = 1 - t,
      inverseFactorTimesTwo = inverseFactor * inverseFactor,
      factorTimes2 = t * t,
      factor1 = inverseFactorTimesTwo * inverseFactor,
      factor2 = 3 * t * inverseFactorTimesTwo,
      factor3 = 3 * factorTimes2 * inverseFactor,
      factor4 = factorTimes2 * t;
  
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  
  return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
vec3.random = function (out, scale) {
    scale = scale || 1.0;

    var r = glMatrix.RANDOM() * 2.0 * Math.PI;
    var z = (glMatrix.RANDOM() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0-z*z) * scale;

    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
};

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2],
        w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
};

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat3 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
};

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
vec3.transformQuat = function(out, a, q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
vec3.rotateX = function(out, a, b, c){
   var p = [], r=[];
	  //Translate point to the origin
	  p[0] = a[0] - b[0];
	  p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];

	  //perform rotation
	  r[0] = p[0];
	  r[1] = p[1]*Math.cos(c) - p[2]*Math.sin(c);
	  r[2] = p[1]*Math.sin(c) + p[2]*Math.cos(c);

	  //translate to correct position
	  out[0] = r[0] + b[0];
	  out[1] = r[1] + b[1];
	  out[2] = r[2] + b[2];

  	return out;
};

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
vec3.rotateY = function(out, a, b, c){
  	var p = [], r=[];
  	//Translate point to the origin
  	p[0] = a[0] - b[0];
  	p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];
  
  	//perform rotation
  	r[0] = p[2]*Math.sin(c) + p[0]*Math.cos(c);
  	r[1] = p[1];
  	r[2] = p[2]*Math.cos(c) - p[0]*Math.sin(c);
  
  	//translate to correct position
  	out[0] = r[0] + b[0];
  	out[1] = r[1] + b[1];
  	out[2] = r[2] + b[2];
  
  	return out;
};

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
vec3.rotateZ = function(out, a, b, c){
  	var p = [], r=[];
  	//Translate point to the origin
  	p[0] = a[0] - b[0];
  	p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];
  
  	//perform rotation
  	r[0] = p[0]*Math.cos(c) - p[1]*Math.sin(c);
  	r[1] = p[0]*Math.sin(c) + p[1]*Math.cos(c);
  	r[2] = p[2];
  
  	//translate to correct position
  	out[0] = r[0] + b[0];
  	out[1] = r[1] + b[1];
  	out[2] = r[2] + b[2];
  
  	return out;
};

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec3.forEach = (function() {
    var vec = vec3.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 3;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
        }
        
        return a;
    };
})();

/**
 * Get the angle between two 3D vectors
 * @param {vec3} a The first operand
 * @param {vec3} b The second operand
 * @returns {Number} The angle in radians
 */
vec3.angle = function(a, b) {
   
    var tempA = vec3.fromValues(a[0], a[1], a[2]);
    var tempB = vec3.fromValues(b[0], b[1], b[2]);
 
    vec3.normalize(tempA, tempA);
    vec3.normalize(tempB, tempB);
 
    var cosine = vec3.dot(tempA, tempB);

    if(cosine > 1.0){
        return 0;
    } else {
        return Math.acos(cosine);
    }     
};

/**
 * Returns a string representation of a vector
 *
 * @param {vec3} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec3.str = function (a) {
    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
};

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec3.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
};

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec3.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2];
    var b0 = b[0], b1 = b[1], b2 = b[2];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)));
};

module.exports = vec3;

},{"./common.js":4}],12:[function(require,module,exports){
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("./common.js");

/**
 * @class 4 Dimensional Vector
 * @name vec4
 */
var vec4 = {};

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
vec4.create = function() {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
};

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {vec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
vec4.clone = function(a) {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
vec4.fromValues = function(x, y, z, w) {
    var out = new glMatrix.ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the source vector
 * @returns {vec4} out
 */
vec4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
vec4.set = function(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
vec4.sub = vec4.subtract;

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
};

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
vec4.mul = vec4.multiply;

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
};

/**
 * Alias for {@link vec4.divide}
 * @function
 */
vec4.div = vec4.divide;

/**
 * Math.ceil the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to ceil
 * @returns {vec4} out
 */
vec4.ceil = function (out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    out[3] = Math.ceil(a[3]);
    return out;
};

/**
 * Math.floor the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to floor
 * @returns {vec4} out
 */
vec4.floor = function (out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    out[3] = Math.floor(a[3]);
    return out;
};

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
};

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
};

/**
 * Math.round the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to round
 * @returns {vec4} out
 */
vec4.round = function (out, a) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    out[2] = Math.round(a[2]);
    out[3] = Math.round(a[3]);
    return out;
};

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
vec4.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */
vec4.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} distance between a and b
 */
vec4.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.distance}
 * @function
 */
vec4.dist = vec4.distance;

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec4.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
vec4.sqrDist = vec4.squaredDistance;

/**
 * Calculates the length of a vec4
 *
 * @param {vec4} a vector to calculate length of
 * @returns {Number} length of a
 */
vec4.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.length}
 * @function
 */
vec4.len = vec4.length;

/**
 * Calculates the squared length of a vec4
 *
 * @param {vec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec4.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
vec4.sqrLen = vec4.squaredLength;

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to negate
 * @returns {vec4} out
 */
vec4.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
};

/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to invert
 * @returns {vec4} out
 */
vec4.inverse = function(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
};

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to normalize
 * @returns {vec4} out
 */
vec4.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    var len = x*x + y*y + z*z + w*w;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = x * len;
        out[1] = y * len;
        out[2] = z * len;
        out[3] = w * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} dot product of a and b
 */
vec4.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
};

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec4} out
 */
vec4.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */
vec4.random = function (out, scale) {
    scale = scale || 1.0;

    //TODO: This is a pretty awful way of doing this. Find something better.
    out[0] = glMatrix.RANDOM();
    out[1] = glMatrix.RANDOM();
    out[2] = glMatrix.RANDOM();
    out[3] = glMatrix.RANDOM();
    vec4.normalize(out, out);
    vec4.scale(out, out, scale);
    return out;
};

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec4} out
 */
vec4.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
};

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec4} out
 */
vec4.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    out[3] = a[3];
    return out;
};

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec4.forEach = (function() {
    var vec = vec4.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 4;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec4} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec4.str = function (a) {
    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {vec4} a The first vector.
 * @param {vec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec4.exactEquals = function (a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
};

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec4} a The first vector.
 * @param {vec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
vec4.equals = function (a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    return (Math.abs(a0 - b0) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= glMatrix.EPSILON*Math.max(1.0, Math.abs(a3), Math.abs(b3)));
};

module.exports = vec4;

},{"./common.js":4}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("../model");
var State = (function () {
    function State(str) {
        this.str = str;
        this.pos = 0;
    }
    State.prototype.char = function () {
        return this.str[this.pos];
    };
    return State;
}());
function throwError(state, str) {
    if (str === void 0) { str = ''; }
    throw new Error("SyntaxError, near " + state.pos + (str ? ', ' + str : ''));
}
function parseComment(state) {
    if (state.char() === '/' && state.str[state.pos + 1] === '/') {
        state.pos += 2;
        while (state.pos < state.str.length && state.str[++state.pos] !== '\n')
            ;
        ++state.pos;
        return true;
    }
    return false;
}
var spaceRE = /\s/i;
function parseSpace(state) {
    while (spaceRE.test(state.char())) {
        ++state.pos;
    }
}
var keywordFirstCharRE = /[a-z]/i;
var keywordOtherCharRE = /[a-z0-9]/i;
function parseKeyword(state) {
    if (!keywordFirstCharRE.test(state.char())) {
        return null;
    }
    var keyword = state.char();
    ++state.pos;
    while (keywordOtherCharRE.test(state.char())) {
        keyword += state.str[state.pos++];
    }
    parseSpace(state);
    return keyword;
}
function parseSymbol(state, symbol) {
    if (state.char() === symbol) {
        ++state.pos;
        parseSpace(state);
    }
}
function strictParseSymbol(state, symbol) {
    if (state.char() !== symbol) {
        throwError(state, "extected " + symbol);
    }
    ++state.pos;
    parseSpace(state);
}
function parseString(state) {
    if (state.char() === '"') {
        var start = ++state.pos; // "
        while (state.char() !== '"') {
            ++state.pos;
        }
        ++state.pos; // "
        var res = state.str.substring(start, state.pos - 1);
        parseSpace(state);
        return res;
    }
    return null;
}
var numberFirstCharRE = /[-0-9]/;
var numberOtherCharRE = /[-+.0-9e]/i;
function parseNumber(state) {
    if (numberFirstCharRE.test(state.char())) {
        var start = state.pos;
        ++state.pos;
        while (numberOtherCharRE.test(state.char())) {
            ++state.pos;
        }
        var res = parseFloat(state.str.substring(start, state.pos));
        parseSpace(state);
        return res;
    }
    return null;
}
function parseArray(state, arr, pos) {
    if (state.char() !== '{') {
        return null;
    }
    if (!arr) {
        arr = [];
        pos = 0;
    }
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var num = parseNumber(state);
        if (num === null) {
            throwError(state, 'expected number');
        }
        arr[pos++] = num;
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    return arr;
}
function parseArrayOrSingleItem(state, arr) {
    if (state.char() !== '{') {
        arr[0] = parseNumber(state);
        return arr;
    }
    var pos = 0;
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var num = parseNumber(state);
        if (num === null) {
            throwError(state, 'expected number');
        }
        arr[pos++] = num;
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    return arr;
}
function parseObject(state) {
    var prefix = null;
    var obj = {};
    if (state.char() !== '{') {
        prefix = parseString(state);
        if (prefix === null) {
            prefix = parseNumber(state);
        }
        if (prefix === null) {
            throwError(state, 'expected string or number');
        }
    }
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'Interval') {
            var array = new Uint32Array(2);
            obj[keyword] = parseArray(state, array, 0);
        }
        else if (keyword === 'MinimumExtent' || keyword === 'MaximumExtent') {
            var array = new Float32Array(3);
            obj[keyword] = parseArray(state, array, 0);
        }
        else {
            obj[keyword] = parseArray(state) || parseString(state);
            if (obj[keyword] === null) {
                obj[keyword] = parseNumber(state);
            }
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    return [prefix, obj];
}
function parseVersion(state, model) {
    var _a = parseObject(state), unused = _a[0], obj = _a[1];
    if (obj.FormatVersion) {
        model.Version = obj.FormatVersion;
    }
}
function parseModelInfo(state, model) {
    var _a = parseObject(state), name = _a[0], obj = _a[1];
    model.Info = obj;
    model.Info.Name = name;
}
function parseSequences(state, model) {
    parseNumber(state); // count, not used
    strictParseSymbol(state, '{');
    var res = [];
    while (state.char() !== '}') {
        parseKeyword(state); // Anim
        var _a = parseObject(state), name_1 = _a[0], obj = _a[1];
        obj.Name = name_1;
        obj.NonLooping = 'NonLooping' in obj;
        res.push(obj);
    }
    strictParseSymbol(state, '}');
    model.Sequences = res;
}
function parseTextures(state, model) {
    var res = [];
    parseNumber(state); // count, not used
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        parseKeyword(state); // Bitmap
        var _a = parseObject(state), unused = _a[0], obj = _a[1];
        obj.Flags = 0;
        if ('WrapWidth' in obj) {
            obj.Flags += model_1.TextureFlags.WrapWidth;
            delete obj.WrapWidth;
        }
        if ('WrapHeight' in obj) {
            obj.Flags += model_1.TextureFlags.WrapHeight;
            delete obj.WrapHeight;
        }
        res.push(obj);
    }
    strictParseSymbol(state, '}');
    model.Textures = res;
}
var AnimVectorType;
(function (AnimVectorType) {
    AnimVectorType[AnimVectorType["INT1"] = 0] = "INT1";
    AnimVectorType[AnimVectorType["FLOAT1"] = 1] = "FLOAT1";
    AnimVectorType[AnimVectorType["FLOAT3"] = 2] = "FLOAT3";
    AnimVectorType[AnimVectorType["FLOAT4"] = 3] = "FLOAT4";
})(AnimVectorType || (AnimVectorType = {}));
var animVectorSize = (_a = {},
    _a[AnimVectorType.INT1] = 1,
    _a[AnimVectorType.FLOAT1] = 1,
    _a[AnimVectorType.FLOAT3] = 3,
    _a[AnimVectorType.FLOAT4] = 4,
    _a);
function parseAnimKeyframe(state, frame, type, lineType) {
    var res = {
        Frame: frame,
        Vector: null
    };
    var Vector = type === AnimVectorType.INT1 ? Int32Array : Float32Array;
    var itemCount = animVectorSize[type];
    res.Vector = parseArrayOrSingleItem(state, new Vector(itemCount));
    strictParseSymbol(state, ',');
    if (lineType === model_1.LineType.Hermite || lineType === model_1.LineType.Bezier) {
        parseKeyword(state); // InTan
        res.InTan = parseArrayOrSingleItem(state, new Vector(itemCount));
        strictParseSymbol(state, ',');
        parseKeyword(state); // OutTan
        res.OutTan = parseArrayOrSingleItem(state, new Vector(itemCount));
        strictParseSymbol(state, ',');
    }
    return res;
}
function parseAnimVector(state, type) {
    var animVector = {
        LineType: model_1.LineType.DontInterp,
        GlobalSeqId: null,
        Keys: []
    };
    parseNumber(state); // count, not used
    strictParseSymbol(state, '{');
    var lineType = parseKeyword(state);
    if (lineType === 'DontInterp' || lineType === 'Linear' || lineType === 'Hermite' || lineType === 'Bezier') {
        animVector.LineType = model_1.LineType[lineType];
    }
    strictParseSymbol(state, ',');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        if (keyword === 'GlobalSeqId') {
            animVector[keyword] = parseNumber(state);
            strictParseSymbol(state, ',');
        }
        else {
            var frame = parseNumber(state);
            if (frame === null) {
                throwError(state, 'expected frame number or GlobalSeqId');
            }
            strictParseSymbol(state, ':');
            animVector.Keys.push(parseAnimKeyframe(state, frame, type, animVector.LineType));
        }
    }
    strictParseSymbol(state, '}');
    return animVector;
}
function parseLayer(state) {
    var res = {
        Alpha: null,
        TVertexAnimId: null,
        Shading: 0,
        CoordId: 0
    };
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        var isStatic = false;
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }
        if (!isStatic && keyword === 'TextureID') {
            res[keyword] = parseAnimVector(state, AnimVectorType.INT1);
        }
        else if (!isStatic && keyword === 'Alpha') {
            res[keyword] = parseAnimVector(state, AnimVectorType.FLOAT1);
        }
        else if (keyword === 'Unshaded' || keyword === 'SphereEnvMap' || keyword === 'TwoSided' ||
            keyword === 'Unfogged' || keyword === 'NoDepthTest' || keyword === 'NoDepthSet') {
            res.Shading |= model_1.LayerShading[keyword];
        }
        else if (keyword === 'FilterMode') {
            var val = parseKeyword(state);
            if (val === 'None' || val === 'Transparent' || val === 'Blend' || val === 'Additive' ||
                val === 'AddAlpha' || val === 'Modulate' || val === 'Modulate2x') {
                res.FilterMode = model_1.FilterMode[val];
            }
        }
        else if (keyword === 'TVertexAnimId') {
            res.TVertexAnimId = parseNumber(state);
        }
        else {
            var val = parseNumber(state);
            if (val === null) {
                val = parseKeyword(state);
            }
            res[keyword] = val;
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    return res;
}
function parseMaterials(state, model) {
    var res = [];
    parseNumber(state); // count, not used
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var obj = {
            RenderMode: 0,
            Layers: []
        };
        parseKeyword(state); // Material
        strictParseSymbol(state, '{');
        while (state.char() !== '}') {
            var keyword = parseKeyword(state);
            if (!keyword) {
                throwError(state);
            }
            if (keyword === 'Layer') {
                obj.Layers.push(parseLayer(state));
            }
            else if (keyword === 'PriorityPlane') {
                obj[keyword] = parseNumber(state);
            }
            else if (keyword === 'ConstantColor' || keyword === 'SortPrimsFarZ' || keyword === 'FullResolution') {
                obj.RenderMode |= model_1.MaterialRenderMode[keyword];
            }
            else {
                throw new Error('Unknown material property ' + keyword);
            }
            parseSymbol(state, ',');
        }
        strictParseSymbol(state, '}');
        res.push(obj);
    }
    strictParseSymbol(state, '}');
    model.Materials = res;
}
function parseGeoset(state, model) {
    var res = {
        Vertices: null,
        Normals: null,
        TVertices: [],
        VertexGroup: null,
        Faces: null,
        Groups: null,
        TotalGroupsCount: null,
        MinimumExtent: null,
        MaximumExtent: null,
        BoundsRadius: null,
        Anims: [],
        MaterialID: null,
        SelectionGroup: null,
        Unselectable: false
    };
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'Vertices' || keyword === 'Normals' || keyword === 'TVertices') {
            var countPerObj = 3;
            if (keyword === 'TVertices') {
                countPerObj = 2;
            }
            var count = parseNumber(state);
            var arr = new Float32Array(count * countPerObj);
            strictParseSymbol(state, '{');
            for (var index = 0; index < count; ++index) {
                parseArray(state, arr, index * countPerObj);
                strictParseSymbol(state, ',');
            }
            strictParseSymbol(state, '}');
            if (keyword === 'TVertices') {
                res.TVertices.push(arr);
            }
            else {
                res[keyword] = arr;
            }
        }
        else if (keyword === 'VertexGroup') {
            res[keyword] = new Uint8Array(res.Vertices.length / 3);
            parseArray(state, res[keyword], 0);
        }
        else if (keyword === 'Faces') {
            parseNumber(state); // group count, always 1?
            var indexCount = parseNumber(state);
            res.Faces = new Uint16Array(indexCount);
            strictParseSymbol(state, '{');
            parseKeyword(state); // Triangles
            strictParseSymbol(state, '{');
            parseArray(state, res.Faces, 0);
            parseSymbol(state, ',');
            strictParseSymbol(state, '}');
            strictParseSymbol(state, '}');
        }
        else if (keyword === 'Groups') {
            var groups = [];
            parseNumber(state); // groups count, unused
            res.TotalGroupsCount = parseNumber(state); // summed in subarrays
            strictParseSymbol(state, '{');
            while (state.char() !== '}') {
                parseKeyword(state); // Matrices
                groups.push(parseArray(state));
                parseSymbol(state, ',');
            }
            strictParseSymbol(state, '}');
            res.Groups = groups;
        }
        else if (keyword === 'MinimumExtent' || keyword === 'MaximumExtent') {
            var arr = new Float32Array(3);
            res[keyword] = parseArray(state, arr, 0);
            strictParseSymbol(state, ',');
        }
        else if (keyword === 'BoundsRadius' || keyword === 'MaterialID' || keyword === 'SelectionGroup') {
            res[keyword] = parseNumber(state);
            strictParseSymbol(state, ',');
        }
        else if (keyword === 'Anim') {
            var _a = parseObject(state), unused = _a[0], obj = _a[1];
            if (obj.Alpha === undefined) {
                obj.Alpha = 1;
            }
            res.Anims.push(obj);
        }
        else if (keyword === 'Unselectable') {
            res.Unselectable = true;
            strictParseSymbol(state, ',');
        }
    }
    strictParseSymbol(state, '}');
    model.Geosets.push(res);
}
function parseGeosetAnim(state, model) {
    var res = {
        GeosetId: -1,
        Alpha: 1,
        Color: null,
        Flags: 0
    };
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        var isStatic = false;
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }
        if (keyword === 'Alpha') {
            if (isStatic) {
                res.Alpha = parseNumber(state);
            }
            else {
                res.Alpha = parseAnimVector(state, AnimVectorType.FLOAT1);
            }
        }
        else if (keyword === 'Color') {
            if (isStatic) {
                var array = new Float32Array(3);
                res.Color = parseArray(state, array, 0);
                res.Color.reverse();
            }
            else {
                res.Color = parseAnimVector(state, AnimVectorType.FLOAT3);
                for (var _i = 0, _a = res.Color.Keys; _i < _a.length; _i++) {
                    var key = _a[_i];
                    key.Vector.reverse();
                    if (key.InTan) {
                        key.InTan.reverse();
                        key.OutTan.reverse();
                    }
                }
            }
        }
        else if (keyword === 'DropShadow') {
            res.Flags |= model_1.GeosetAnimFlags[keyword];
        }
        else {
            res[keyword] = parseNumber(state);
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.GeosetAnims.push(res);
}
function parseNode(state, type, model) {
    var name = parseString(state);
    var node = {
        Name: name,
        ObjectId: null,
        Parent: null,
        PivotPoint: null,
        Flags: model_1.NodeType[type]
    };
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling' || keyword === 'Visibility') {
            var vectorType = AnimVectorType.FLOAT3;
            if (keyword === 'Rotation') {
                vectorType = AnimVectorType.FLOAT4;
            }
            else if (keyword === 'Visibility') {
                vectorType = AnimVectorType.FLOAT1;
            }
            node[keyword] = parseAnimVector(state, vectorType);
        }
        else if (keyword === 'BillboardedLockZ' || keyword === 'BillboardedLockY' || keyword === 'BillboardedLockX' ||
            keyword === 'Billboarded' || keyword === 'CameraAnchored') {
            node.Flags |= model_1.NodeFlags[keyword];
        }
        else if (keyword === 'DontInherit') {
            strictParseSymbol(state, '{');
            var val = parseKeyword(state);
            if (val === 'Translation') {
                node.Flags |= model_1.NodeFlags.DontInheritTranslation;
            }
            else if (val === 'Rotation') {
                node.Flags |= model_1.NodeFlags.DontInheritRotation;
            }
            else if (val === 'Scaling') {
                node.Flags |= model_1.NodeFlags.DontInheritScaling;
            }
            strictParseSymbol(state, '}');
        }
        else if (keyword === 'Path') {
            node[keyword] = parseString(state);
        }
        else {
            var val = parseKeyword(state) || parseNumber(state);
            if (keyword === 'GeosetId' && val === 'Multiple' ||
                keyword === 'GeosetAnimId' && val === 'None') {
                val = null;
            }
            node[keyword] = val;
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.Nodes[node.ObjectId] = node;
    return node;
}
function parseBone(state, model) {
    var node = parseNode(state, 'Bone', model);
    model.Bones.push(node);
}
function parseHelper(state, model) {
    var node = parseNode(state, 'Helper', model);
    model.Helpers.push(node);
}
function parseAttachment(state, model) {
    var node = parseNode(state, 'Attachment', model);
    model.Attachments.push(node);
}
function parsePivotPoints(state, model) {
    var count = parseNumber(state);
    var res = [];
    strictParseSymbol(state, '{');
    for (var i = 0; i < count; ++i) {
        res.push(parseArray(state, new Float32Array(3), 0));
        strictParseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.PivotPoints = res;
}
function parseEventObject(state, model) {
    var name = parseString(state);
    var res = {
        Name: name,
        ObjectId: null,
        Parent: null,
        PivotPoint: null,
        EventTrack: null,
        Flags: model_1.NodeType.EventObject
    };
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'EventTrack') {
            var count = parseNumber(state); // EventTrack count
            res.EventTrack = parseArray(state, new Uint32Array(count), 0);
        }
        else if (keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling') {
            var type = keyword === 'Rotation' ? AnimVectorType.FLOAT4 : AnimVectorType.FLOAT3;
            res[keyword] = parseAnimVector(state, type);
        }
        else {
            res[keyword] = parseNumber(state);
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.EventObjects.push(res);
    model.Nodes.push(res);
}
function parseCollisionShape(state, model) {
    var name = parseString(state);
    var res = {
        Name: name,
        ObjectId: null,
        Parent: null,
        PivotPoint: null,
        Shape: model_1.CollisionShapeType.Box,
        Vertices: null,
        Flags: model_1.NodeType.CollisionShape
    };
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'Sphere') {
            res.Shape = model_1.CollisionShapeType.Sphere;
        }
        else if (keyword === 'Box') {
            res.Shape = model_1.CollisionShapeType.Box;
        }
        else if (keyword === 'Vertices') {
            var count = parseNumber(state);
            var vertices = new Float32Array(count * 3);
            strictParseSymbol(state, '{');
            for (var i = 0; i < count; ++i) {
                parseArray(state, vertices, i * 3);
                strictParseSymbol(state, ',');
            }
            strictParseSymbol(state, '}');
            res.Vertices = vertices;
        }
        else if (keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling') {
            var type = keyword === 'Rotation' ? AnimVectorType.FLOAT4 : AnimVectorType.FLOAT3;
            res[keyword] = parseAnimVector(state, type);
        }
        else {
            res[keyword] = parseNumber(state);
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.CollisionShapes.push(res);
    model.Nodes.push(res);
}
function parseGlobalSequences(state, model) {
    var res = [];
    var count = parseNumber(state);
    strictParseSymbol(state, '{');
    for (var i = 0; i < count; ++i) {
        var keyword = parseKeyword(state);
        if (keyword === 'Duration') {
            res.push(parseNumber(state));
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.GlobalSequences = res;
}
function parseUnknownBlock(state) {
    var opened;
    while (state.char() !== undefined && state.char() !== '{') {
        ++state.pos;
    }
    opened = 1;
    ++state.pos;
    while (state.char() !== undefined && opened > 0) {
        if (state.char() === '{') {
            ++opened;
        }
        else if (state.char() === '}') {
            --opened;
        }
        ++state.pos;
    }
    parseSpace(state);
}
function parseParticleEmitter(state, model) {
    var res = {
        ObjectId: null,
        Parent: null,
        Name: null,
        Flags: 0
    };
    res.Name = parseString(state);
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        var isStatic = false;
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }
        if (keyword === 'ObjectId' || keyword === 'Parent') {
            res[keyword] = parseNumber(state);
        }
        else if (keyword === 'EmitterUsesMDL' || keyword === 'EmitterUsesTGA') {
            res.Flags |= model_1.ParticleEmitterFlags[keyword];
        }
        else if (!isStatic && (keyword === 'Visibility' || keyword === 'Translation' || keyword === 'Rotation' ||
            keyword === 'Scaling' || keyword === 'EmissionRate' || keyword === 'Gravity' || keyword === 'Longitude' ||
            keyword === 'Latitude')) {
            var type = AnimVectorType.FLOAT3;
            if (keyword === 'Visibility' || keyword === 'EmissionRate' || keyword === 'Gravity' ||
                keyword === 'Longitude' || keyword === 'Latitude') {
                type = AnimVectorType.FLOAT1;
            }
            else if (keyword === 'Rotation') {
                type = AnimVectorType.FLOAT4;
            }
            res[keyword] = parseAnimVector(state, type);
        }
        else if (keyword === 'Particle') {
            strictParseSymbol(state, '{');
            while (state.char() !== '}') {
                var keyword2 = parseKeyword(state);
                var isStatic2 = false;
                if (keyword2 === 'static') {
                    isStatic2 = true;
                    keyword2 = parseKeyword(state);
                }
                if (!isStatic2 && (keyword2 === 'LifeSpan' || keyword2 === 'InitVelocity')) {
                    res[keyword2] = parseAnimVector(state, AnimVectorType.FLOAT1);
                }
                else if (keyword2 === 'LifeSpan' || keyword2 === 'InitVelocity') {
                    res[keyword2] = parseNumber(state);
                }
                else if (keyword2 === 'Path') {
                    res.Path = parseString(state);
                }
                parseSymbol(state, ',');
            }
            strictParseSymbol(state, '}');
        }
        else {
            res[keyword] = parseNumber(state);
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.ParticleEmitters.push(res);
}
function parseParticleEmitter2(state, model) {
    var name = parseString(state);
    var res = {
        Name: name,
        ObjectId: null,
        Parent: null,
        PivotPoint: null,
        Flags: model_1.NodeType.ParticleEmitter,
        FrameFlags: 0
    };
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        var isStatic = false;
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }
        if (!isStatic && (keyword === 'Speed' || keyword === 'Latitude' || keyword === 'Visibility' ||
            keyword === 'EmissionRate' || keyword === 'Width' || keyword === 'Length' || keyword === 'Translation' ||
            keyword === 'Rotation' || keyword === 'Scaling' || keyword === 'Gravity' || keyword === 'Variation')) {
            var type = AnimVectorType.FLOAT3;
            switch (keyword) {
                case 'Rotation':
                    type = AnimVectorType.FLOAT4;
                    break;
                case 'Speed':
                case 'Latitude':
                case 'Visibility':
                case 'EmissionRate':
                case 'Width':
                case 'Length':
                case 'Gravity':
                case 'Variation':
                    type = AnimVectorType.FLOAT1;
                    break;
            }
            res[keyword] = parseAnimVector(state, type);
        }
        else if (keyword === 'Variation' || keyword === 'Gravity') {
            res[keyword] = parseNumber(state);
        }
        else if (keyword === 'SortPrimsFarZ' || keyword === 'Unshaded' || keyword === 'LineEmitter' ||
            keyword === 'Unfogged' || keyword === 'ModelSpace' || keyword === 'XYQuad') {
            res.Flags |= model_1.ParticleEmitter2Flags[keyword];
        }
        else if (keyword === 'Both') {
            res.FrameFlags |= model_1.ParticleEmitter2FramesFlags.Head | model_1.ParticleEmitter2FramesFlags.Tail;
        }
        else if (keyword === 'Head' || keyword === 'Tail') {
            res.FrameFlags |= model_1.ParticleEmitter2FramesFlags[keyword];
        }
        else if (keyword === 'Squirt') {
            res[keyword] = true;
        }
        else if (keyword === 'DontInherit') {
            strictParseSymbol(state, '{');
            var val = parseKeyword(state);
            if (val === 'Translation') {
                res.Flags |= model_1.NodeFlags.DontInheritTranslation;
            }
            else if (val === 'Rotation') {
                res.Flags |= model_1.NodeFlags.DontInheritRotation;
            }
            else if (val === 'Scaling') {
                res.Flags |= model_1.NodeFlags.DontInheritScaling;
            }
            strictParseSymbol(state, '}');
        }
        else if (keyword === 'SegmentColor') {
            var colors = [];
            strictParseSymbol(state, '{');
            while (state.char() !== '}') {
                parseKeyword(state); // Color
                var colorArr = new Float32Array(3);
                parseArray(state, colorArr, 0);
                // bgr order, inverse from mdx
                var temp = colorArr[0];
                colorArr[0] = colorArr[2];
                colorArr[2] = temp;
                colors.push(colorArr);
                parseSymbol(state, ',');
            }
            strictParseSymbol(state, '}');
            res.SegmentColor = colors;
        }
        else if (keyword === 'Alpha') {
            res.Alpha = new Uint8Array(3);
            parseArray(state, res.Alpha, 0);
        }
        else if (keyword === 'ParticleScaling') {
            res[keyword] = new Float32Array(3);
            parseArray(state, res[keyword], 0);
        }
        else if (keyword === 'LifeSpanUVAnim' || keyword === 'DecayUVAnim' || keyword === 'TailUVAnim' ||
            keyword === 'TailDecayUVAnim') {
            res[keyword] = new Uint32Array(3);
            parseArray(state, res[keyword], 0);
        }
        else if (keyword === 'Transparent' || keyword === 'Blend' || keyword === 'Additive' ||
            keyword === 'AlphaKey' || keyword === 'Modulate' || keyword === 'Modulate2x') {
            res.FilterMode = model_1.ParticleEmitter2FilterMode[keyword];
        }
        else {
            res[keyword] = parseNumber(state);
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.ParticleEmitters2.push(res);
    model.Nodes.push(res);
}
function parseCamera(state, model) {
    var res = {
        Name: null,
        Position: null,
        FieldOfView: 0,
        NearClip: 0,
        FarClip: 0,
        TargetPosition: null
    };
    res.Name = parseString(state);
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'Position') {
            res.Position = new Float32Array(3);
            parseArray(state, res.Position, 0);
        }
        else if (keyword === 'FieldOfView' || keyword === 'NearClip' || keyword === 'FarClip') {
            res[keyword] = parseNumber(state);
        }
        else if (keyword === 'Target') {
            strictParseSymbol(state, '{');
            while (state.char() !== '}') {
                var keyword2 = parseKeyword(state);
                if (keyword2 === 'Position') {
                    res.TargetPosition = new Float32Array(3);
                    parseArray(state, res.TargetPosition, 0);
                }
                else if (keyword2 === 'Translation') {
                    res.TargetTranslation = parseAnimVector(state, AnimVectorType.FLOAT3);
                }
                parseSymbol(state, ',');
            }
            strictParseSymbol(state, '}');
        }
        else if (keyword === 'Translation' || keyword === 'Rotation') {
            res[keyword] = parseAnimVector(state, keyword === 'Rotation' ?
                AnimVectorType.FLOAT1 :
                AnimVectorType.FLOAT3);
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.Cameras.push(res);
}
function parseLight(state, model) {
    var name = parseString(state);
    var res = {
        Name: name,
        ObjectId: null,
        Parent: null,
        PivotPoint: null,
        Flags: model_1.NodeType.Light,
        LightType: 0
    };
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        var isStatic = false;
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }
        if (!isStatic && (keyword === 'Visibility' || keyword === 'Color' || keyword === 'Intensity' ||
            keyword === 'AmbIntensity' || keyword === 'AmbColor' || keyword === 'Translation' ||
            keyword === 'Rotation' || keyword === 'Scaling' || keyword === 'AttenuationStart' ||
            keyword === 'AttenuationEnd')) {
            var type = AnimVectorType.FLOAT3;
            switch (keyword) {
                case 'Rotation':
                    type = AnimVectorType.FLOAT4;
                    break;
                case 'Visibility':
                case 'Intensity':
                case 'AmbIntensity':
                case 'AttenuationStart':
                case 'AttenuationEnd':
                    type = AnimVectorType.FLOAT1;
                    break;
            }
            res[keyword] = parseAnimVector(state, type);
            if (keyword === 'Color' || keyword === 'AmbColor') {
                for (var _i = 0, _a = res[keyword].Keys; _i < _a.length; _i++) {
                    var key = _a[_i];
                    key.Vector.reverse();
                    if (key.InTan) {
                        key.InTan.reverse();
                        key.OutTan.reverse();
                    }
                }
            }
        }
        else if (keyword === 'Omnidirectional' || keyword === 'Directional' || keyword === 'Ambient') {
            res.LightType = model_1.LightType[keyword];
        }
        else if (keyword === 'Color' || keyword === 'AmbColor') {
            var color = new Float32Array(3);
            parseArray(state, color, 0);
            // bgr order, inverse from mdx
            var temp = color[0];
            color[0] = color[2];
            color[2] = temp;
            res[keyword] = color;
        }
        else {
            res[keyword] = parseNumber(state);
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.Lights.push(res);
    model.Nodes.push(res);
}
function parseTextureAnims(state, model) {
    var res = [];
    parseNumber(state); // count, not used
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var obj = {};
        parseKeyword(state); // TVertexAnim
        strictParseSymbol(state, '{');
        while (state.char() !== '}') {
            var keyword = parseKeyword(state);
            if (!keyword) {
                throwError(state);
            }
            if (keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling') {
                var type = keyword === 'Rotation' ? AnimVectorType.FLOAT4 : AnimVectorType.FLOAT3;
                obj[keyword] = parseAnimVector(state, type);
            }
            else {
                throw new Error('Unknown texture anim property ' + keyword);
            }
            parseSymbol(state, ',');
        }
        strictParseSymbol(state, '}');
        res.push(obj);
    }
    strictParseSymbol(state, '}');
    model.TextureAnims = res;
}
function parseRibbonEmitter(state, model) {
    var name = parseString(state);
    var res = {
        Name: name,
        ObjectId: null,
        Parent: null,
        PivotPoint: null,
        Flags: model_1.NodeType.RibbonEmitter,
        HeightAbove: null,
        HeightBelow: null,
        Alpha: null,
        Color: null,
        LifeSpan: null,
        TextureSlot: null,
        EmissionRate: null,
        Rows: null,
        Columns: null,
        MaterialID: null,
        Gravity: null,
        Visibility: null
    };
    strictParseSymbol(state, '{');
    while (state.char() !== '}') {
        var keyword = parseKeyword(state);
        var isStatic = false;
        if (!keyword) {
            throwError(state);
        }
        if (keyword === 'static') {
            isStatic = true;
            keyword = parseKeyword(state);
        }
        if (!isStatic && (keyword === 'Visibility' || keyword === 'HeightAbove' || keyword === 'HeightBelow' ||
            keyword === 'Translation' || keyword === 'Rotation' || keyword === 'Scaling' || keyword === 'Alpha' ||
            keyword === 'TextureSlot')) {
            var type = AnimVectorType.FLOAT3;
            switch (keyword) {
                case 'Rotation':
                    type = AnimVectorType.FLOAT4;
                    break;
                case 'Visibility':
                case 'HeightAbove':
                case 'HeightBelow':
                case 'Alpha':
                    type = AnimVectorType.FLOAT1;
                    break;
                case 'TextureSlot':
                    type = AnimVectorType.INT1;
                    break;
            }
            res[keyword] = parseAnimVector(state, type);
        }
        else if (keyword === 'Color') {
            var color = new Float32Array(3);
            parseArray(state, color, 0);
            // bgr order, inverse from mdx
            var temp = color[0];
            color[0] = color[2];
            color[2] = temp;
            res[keyword] = color;
        }
        else {
            res[keyword] = parseNumber(state);
        }
        parseSymbol(state, ',');
    }
    strictParseSymbol(state, '}');
    model.RibbonEmitters.push(res);
    model.Nodes.push(res);
}
var parsers = {
    Version: parseVersion,
    Model: parseModelInfo,
    Sequences: parseSequences,
    Textures: parseTextures,
    Materials: parseMaterials,
    Geoset: parseGeoset,
    GeosetAnim: parseGeosetAnim,
    Bone: parseBone,
    Helper: parseHelper,
    Attachment: parseAttachment,
    PivotPoints: parsePivotPoints,
    EventObject: parseEventObject,
    CollisionShape: parseCollisionShape,
    GlobalSequences: parseGlobalSequences,
    ParticleEmitter: parseParticleEmitter,
    ParticleEmitter2: parseParticleEmitter2,
    Camera: parseCamera,
    Light: parseLight,
    TextureAnims: parseTextureAnims,
    RibbonEmitter: parseRibbonEmitter
};
function parse(str) {
    var state = new State(str);
    var model = {
        // default
        Version: 800,
        Info: {
            Name: '',
            MinimumExtent: null,
            MaximumExtent: null,
            BoundsRadius: 0,
            BlendTime: 150
        },
        Sequences: [],
        GlobalSequences: [],
        Textures: [],
        Materials: [],
        TextureAnims: [],
        Geosets: [],
        GeosetAnims: [],
        Bones: [],
        Helpers: [],
        Attachments: [],
        EventObjects: [],
        ParticleEmitters: [],
        ParticleEmitters2: [],
        Cameras: [],
        Lights: [],
        RibbonEmitters: [],
        CollisionShapes: [],
        PivotPoints: [],
        Nodes: []
    };
    while (state.pos < state.str.length) {
        while (parseComment(state))
            ;
        var keyword = parseKeyword(state);
        if (keyword) {
            if (keyword in parsers) {
                parsers[keyword](state, model);
            }
            else {
                parseUnknownBlock(state);
            }
        }
        else {
            break;
        }
    }
    for (var i = 0; i < model.Nodes.length; ++i) {
        if (model.PivotPoints[i]) {
            model.Nodes[i].PivotPoint = model.PivotPoints[i];
        }
    }
    return model;
}
exports.parse = parse;
var _a;
//# sourceMappingURL=mdl.js.map
},{"../model":2}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("../model");
var BIG_ENDIAN = true;
var NONE = -1;
var AnimVectorType;
(function (AnimVectorType) {
    AnimVectorType[AnimVectorType["INT1"] = 0] = "INT1";
    AnimVectorType[AnimVectorType["FLOAT1"] = 1] = "FLOAT1";
    AnimVectorType[AnimVectorType["FLOAT3"] = 2] = "FLOAT3";
    AnimVectorType[AnimVectorType["FLOAT4"] = 3] = "FLOAT4";
})(AnimVectorType || (AnimVectorType = {}));
var animVectorSize = (_a = {},
    _a[AnimVectorType.INT1] = 1,
    _a[AnimVectorType.FLOAT1] = 1,
    _a[AnimVectorType.FLOAT3] = 3,
    _a[AnimVectorType.FLOAT4] = 4,
    _a);
var State = (function () {
    function State(arrayBuffer) {
        this.ab = arrayBuffer;
        this.pos = 0;
        this.length = arrayBuffer.byteLength;
        this.view = new DataView(this.ab);
        this.uint = new Uint8Array(this.ab);
    }
    State.prototype.keyword = function () {
        var res = String.fromCharCode(this.uint[this.pos], this.uint[this.pos + 1], this.uint[this.pos + 2], this.uint[this.pos + 3]);
        this.pos += 4;
        return res;
    };
    State.prototype.expectKeyword = function (keyword, errorText) {
        if (this.keyword() !== keyword) {
            throw new Error(errorText);
        }
    };
    State.prototype.uint8 = function () {
        return this.view.getUint8(this.pos++);
    };
    State.prototype.uint16 = function () {
        var res = this.view.getUint16(this.pos, BIG_ENDIAN);
        this.pos += 2;
        return res;
    };
    State.prototype.int32 = function () {
        var res = this.view.getInt32(this.pos, BIG_ENDIAN);
        this.pos += 4;
        return res;
    };
    State.prototype.float32 = function () {
        var res = this.view.getFloat32(this.pos, BIG_ENDIAN);
        this.pos += 4;
        return res;
    };
    State.prototype.str = function (length) {
        // actual string length
        // data may consist of ['a', 'b', 'c', 0, 0, 0]
        var stringLength = length;
        while (this.uint[this.pos + stringLength - 1] === 0 && stringLength > 0) {
            --stringLength;
        }
        // ??
        // TS2461:Type 'Uint8Array' is not an array type.
        // let res = String.fromCharCode(...this.uint.slice(this.pos, this.pos + length));
        var res = String.fromCharCode.apply(String, this.uint.slice(this.pos, this.pos + stringLength));
        this.pos += length;
        return res;
    };
    State.prototype.animVector = function (type) {
        var res = {
            Keys: []
        };
        var isInt = type === AnimVectorType.INT1;
        var vectorSize = animVectorSize[type];
        var keysCount = this.int32();
        res.LineType = this.int32();
        res.GlobalSeqId = this.int32();
        if (res.GlobalSeqId === NONE) {
            res.GlobalSeqId = null;
        }
        for (var i = 0; i < keysCount; ++i) {
            var animKeyFrame = {};
            animKeyFrame.Frame = this.int32();
            if (isInt) {
                animKeyFrame.Vector = new Int32Array(vectorSize);
            }
            else {
                animKeyFrame.Vector = new Float32Array(vectorSize);
            }
            for (var j = 0; j < vectorSize; ++j) {
                if (isInt) {
                    animKeyFrame.Vector[j] = this.int32();
                }
                else {
                    animKeyFrame.Vector[j] = this.float32();
                }
            }
            if (res.LineType === model_1.LineType.Hermite || res.LineType === model_1.LineType.Bezier) {
                for (var _i = 0, _a = ['InTan', 'OutTan']; _i < _a.length; _i++) {
                    var part = _a[_i];
                    animKeyFrame[part] = new Float32Array(vectorSize);
                    for (var j = 0; j < vectorSize; ++j) {
                        if (isInt) {
                            animKeyFrame[part][j] = this.int32();
                        }
                        else {
                            animKeyFrame[part][j] = this.float32();
                        }
                    }
                }
            }
            res.Keys.push(animKeyFrame);
        }
        return res;
    };
    return State;
}());
function parseExtent(obj, state) {
    obj.BoundsRadius = state.float32();
    for (var _i = 0, _a = ['MinimumExtent', 'MaximumExtent']; _i < _a.length; _i++) {
        var key = _a[_i];
        obj[key] = new Float32Array(3);
        for (var i = 0; i < 3; ++i) {
            obj[key][i] = state.float32();
        }
    }
}
function parseVersion(model, state) {
    model.Version = state.int32();
}
var MODEL_NAME_LENGTH = 0x150;
function parseModelInfo(model, state) {
    model.Info.Name = state.str(MODEL_NAME_LENGTH);
    state.int32(); // unknown 4-byte sequence
    parseExtent(model.Info, state);
    model.Info.BlendTime = state.int32();
}
var MODEL_SEQUENCE_NAME_LENGTH = 0x50;
function parseSequences(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var name_1 = state.str(MODEL_SEQUENCE_NAME_LENGTH);
        var sequence = {};
        sequence.Name = name_1;
        var interval = new Uint32Array(2);
        interval[0] = state.int32();
        interval[1] = state.int32();
        sequence.Interval = interval;
        sequence.MoveSpeed = state.float32();
        sequence.NonLooping = state.int32() > 0;
        sequence.Rarity = state.float32();
        state.int32(); // unknown 4-byte sequence (syncPoint?)
        parseExtent(sequence, state);
        model.Sequences.push(sequence);
    }
}
function parseMaterials(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        state.int32(); // material size inclusive
        var material = {
            Layers: []
        };
        material.PriorityPlane = state.int32();
        material.RenderMode = state.int32();
        state.expectKeyword('LAYS', 'Incorrect materials format');
        var layersCount = state.int32();
        for (var i = 0; i < layersCount; ++i) {
            var startPos2 = state.pos;
            var size2 = state.int32();
            var layer = {};
            layer.FilterMode = state.int32();
            layer.Shading = state.int32();
            layer.TextureID = state.int32();
            layer.TVertexAnimId = state.int32();
            if (layer.TVertexAnimId === NONE) {
                layer.TVertexAnimId = null;
            }
            layer.CoordId = state.int32();
            layer.Alpha = state.float32();
            while (state.pos < startPos2 + size2) {
                var keyword = state.keyword();
                if (keyword === 'KMTA') {
                    layer.Alpha = state.animVector(AnimVectorType.FLOAT1);
                }
                else if (keyword === 'KMTF') {
                    layer.TextureID = state.animVector(AnimVectorType.INT1);
                }
                else {
                    throw new Error('Unknown layer chunk data ' + keyword);
                }
            }
            material.Layers.push(layer);
        }
        model.Materials.push(material);
    }
}
var MODEL_TEXTURE_PATH_LENGTH = 0x100;
function parseTextures(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var texture = {};
        texture.ReplaceableId = state.int32();
        texture.Image = state.str(MODEL_TEXTURE_PATH_LENGTH);
        state.int32(); // unknown 4-byte sequence
        texture.Flags = state.int32();
        model.Textures.push(texture);
    }
}
function parseGeosets(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var geoset = {};
        state.int32(); // geoset size, not used
        state.expectKeyword('VRTX', 'Incorrect geosets format');
        var verticesCount = state.int32();
        geoset.Vertices = new Float32Array(verticesCount * 3);
        for (var i = 0; i < verticesCount * 3; ++i) {
            geoset.Vertices[i] = state.float32();
        }
        state.expectKeyword('NRMS', 'Incorrect geosets format');
        var normalsCount = state.int32();
        geoset.Normals = new Float32Array(normalsCount * 3);
        for (var i = 0; i < normalsCount * 3; ++i) {
            geoset.Normals[i] = state.float32();
        }
        state.expectKeyword('PTYP', 'Incorrect geosets format');
        var primitiveCount = state.int32();
        for (var i = 0; i < primitiveCount; ++i) {
            if (state.int32() !== 4) {
                throw new Error('Incorrect geosets format');
            }
        }
        state.expectKeyword('PCNT', 'Incorrect geosets format');
        var faceGroupCount = state.int32();
        for (var i = 0; i < faceGroupCount; ++i) {
            state.int32();
        }
        state.expectKeyword('PVTX', 'Incorrect geosets format');
        var indicesCount = state.int32();
        geoset.Faces = new Uint16Array(indicesCount);
        for (var i = 0; i < indicesCount; ++i) {
            geoset.Faces[i] = state.uint16();
        }
        state.expectKeyword('GNDX', 'Incorrect geosets format');
        var verticesGroupCount = state.int32();
        geoset.VertexGroup = new Uint8Array(verticesGroupCount);
        for (var i = 0; i < verticesGroupCount; ++i) {
            geoset.VertexGroup[i] = state.uint8();
        }
        state.expectKeyword('MTGC', 'Incorrect geosets format');
        var groupsCount = state.int32();
        geoset.Groups = [];
        for (var i = 0; i < groupsCount; ++i) {
            // new Array(array length)
            geoset.Groups[i] = new Array(state.int32());
        }
        state.expectKeyword('MATS', 'Incorrect geosets format');
        geoset.TotalGroupsCount = state.int32();
        var groupIndex = 0;
        var groupCounter = 0;
        for (var i = 0; i < geoset.TotalGroupsCount; ++i) {
            if (groupIndex >= geoset.Groups[groupCounter].length) {
                groupIndex = 0;
                groupCounter++;
            }
            geoset.Groups[groupCounter][groupIndex++] = state.int32();
        }
        geoset.MaterialID = state.int32();
        geoset.SelectionGroup = state.int32();
        geoset.Unselectable = state.int32() > 0;
        parseExtent(geoset, state);
        var geosetAnimCount = state.int32();
        geoset.Anims = [];
        for (var i = 0; i < geosetAnimCount; ++i) {
            var geosetAnim = {};
            parseExtent(geosetAnim, state);
            geoset.Anims.push(geosetAnim);
        }
        state.expectKeyword('UVAS', 'Incorrect geosets format');
        var textureChunkCount = state.int32();
        geoset.TVertices = [];
        for (var i = 0; i < textureChunkCount; ++i) {
            state.expectKeyword('UVBS', 'Incorrect geosets format');
            var textureCoordsCount = state.int32();
            var tvertices = new Float32Array(textureCoordsCount * 2);
            for (var i_1 = 0; i_1 < textureCoordsCount * 2; ++i_1) {
                tvertices[i_1] = state.float32();
            }
            geoset.TVertices.push(tvertices);
        }
        model.Geosets.push(geoset);
    }
}
function parseGeosetAnims(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var animStartPos = state.pos;
        var animSize = state.int32();
        var geosetAnim = {};
        geosetAnim.Alpha = state.float32();
        geosetAnim.Flags = state.int32();
        geosetAnim.Color = new Float32Array(3);
        for (var i = 0; i < 3; ++i) {
            geosetAnim.Color[i] = state.float32();
        }
        geosetAnim.GeosetId = state.int32();
        if (geosetAnim.GeosetId === NONE) {
            geosetAnim.GeosetId = null;
        }
        while (state.pos < animStartPos + animSize) {
            var keyword = state.keyword();
            if (keyword === 'KGAO') {
                geosetAnim.Alpha = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KGAC') {
                geosetAnim.Color = state.animVector(AnimVectorType.FLOAT3);
            }
            else {
                throw new Error('Incorrect GeosetAnim chunk data ' + keyword);
            }
        }
        model.GeosetAnims.push(geosetAnim);
    }
}
var MODEL_NODE_NAME_LENGTH = 0x50;
function parseNode(model, node, state) {
    var startPos = state.pos;
    var size = state.int32();
    node.Name = state.str(MODEL_NODE_NAME_LENGTH);
    node.ObjectId = state.int32();
    if (node.ObjectId === NONE) {
        node.ObjectId = null;
    }
    node.Parent = state.int32();
    if (node.Parent === NONE) {
        node.Parent = null;
    }
    node.Flags = state.int32();
    while (state.pos < startPos + size) {
        var keyword = state.keyword();
        if (keyword === 'KGTR') {
            node.Translation = state.animVector(AnimVectorType.FLOAT3);
        }
        else if (keyword === 'KGRT') {
            node.Rotation = state.animVector(AnimVectorType.FLOAT4);
        }
        else if (keyword === 'KGSC') {
            node.Scaling = state.animVector(AnimVectorType.FLOAT3);
        }
        else {
            throw new Error('Incorrect node chunk data ' + keyword);
        }
    }
    model.Nodes[node.ObjectId] = node;
}
function parseBones(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var bone = {};
        parseNode(model, bone, state);
        bone.GeosetId = state.int32();
        if (bone.GeosetId === NONE) {
            bone.GeosetId = null;
        }
        bone.GeosetAnimId = state.int32();
        if (bone.GeosetAnimId === NONE) {
            bone.GeosetAnimId = null;
        }
        model.Bones.push(bone);
    }
}
function parseHelpers(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var helper = {};
        parseNode(model, helper, state);
        model.Helpers.push(helper);
    }
}
var MODEL_ATTACHMENT_PATH_LENGTH = 0x100;
function parseAttachments(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var attachmentStart = state.pos;
        var attachmentSize = state.int32();
        var attachment = {};
        parseNode(model, attachment, state);
        attachment.Path = state.str(MODEL_ATTACHMENT_PATH_LENGTH);
        state.int32(); // unknown 4-byte
        attachment.AttachmentID = state.int32();
        if (state.pos < attachmentStart + attachmentSize) {
            state.expectKeyword('KATV', 'Incorrect attachment chunk data');
            attachment.Visibility = state.animVector(AnimVectorType.FLOAT1);
        }
        model.Attachments.push(attachment);
    }
}
function parsePivotPoints(model, state, size) {
    var pointsCount = size / (4 * 3);
    for (var i = 0; i < pointsCount; ++i) {
        model.PivotPoints[i] = new Float32Array(3);
        model.PivotPoints[i][0] = state.float32();
        model.PivotPoints[i][1] = state.float32();
        model.PivotPoints[i][2] = state.float32();
    }
}
function parseEventObjects(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var eventObject = {};
        parseNode(model, eventObject, state);
        state.expectKeyword('KEVT', 'Incorrect EventObject chunk data');
        var eventTrackCount = state.int32();
        eventObject.EventTrack = new Uint32Array(eventTrackCount);
        state.int32(); // unused 4-byte?
        for (var i = 0; i < eventTrackCount; ++i) {
            eventObject.EventTrack[i] = state.int32();
        }
        model.EventObjects.push(eventObject);
    }
}
function parseCollisionShapes(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var collisionShape = {};
        parseNode(model, collisionShape, state);
        collisionShape.Shape = state.int32();
        if (collisionShape.Shape === model_1.CollisionShapeType.Box) {
            collisionShape.Vertices = new Float32Array(6);
        }
        else {
            collisionShape.Vertices = new Float32Array(3);
        }
        for (var i = 0; i < collisionShape.Vertices.length; ++i) {
            collisionShape.Vertices[i] = state.float32();
        }
        if (collisionShape.Shape === model_1.CollisionShapeType.Sphere) {
            collisionShape.BoundsRadius = state.float32();
        }
        model.CollisionShapes.push(collisionShape);
    }
}
function parseGlobalSequences(model, state, size) {
    var startPos = state.pos;
    model.GlobalSequences = [];
    while (state.pos < startPos + size) {
        model.GlobalSequences.push(state.int32());
    }
}
var MODEL_PARTICLE_EMITTER_PATH_LENGTH = 0x100;
function parseParticleEmitters(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var emitterStart = state.pos;
        var emitterSize = state.int32();
        var emitter = {};
        parseNode(model, emitter, state);
        emitter.EmissionRate = state.float32();
        emitter.Gravity = state.float32();
        emitter.Longitude = state.float32();
        emitter.Latitude = state.float32();
        emitter.Path = state.str(MODEL_PARTICLE_EMITTER_PATH_LENGTH);
        state.int32();
        emitter.LifeSpan = state.float32();
        emitter.InitVelocity = state.float32();
        while (state.pos < emitterStart + emitterSize) {
            var keyword = state.keyword();
            if (keyword === 'KPEV') {
                emitter.Visibility = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KPEE') {
                emitter.EmissionRate = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KPEG') {
                emitter.Gravity = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KPLN') {
                emitter.Longitude = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KPLT') {
                emitter.Latitude = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KPEL') {
                emitter.LifeSpan = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KPES') {
                emitter.InitVelocity = state.animVector(AnimVectorType.FLOAT1);
            }
            else {
                throw new Error('Incorrect particle emitter chunk data ' + keyword);
            }
        }
        model.ParticleEmitters.push(emitter);
    }
}
function parseParticleEmitters2(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var emitterStart = state.pos;
        var emitterSize = state.int32();
        var emitter = {};
        parseNode(model, emitter, state);
        emitter.Speed = state.float32();
        emitter.Variation = state.float32();
        emitter.Latitude = state.float32();
        emitter.Gravity = state.float32();
        emitter.LifeSpan = state.float32();
        emitter.EmissionRate = state.float32();
        emitter.Width = state.float32();
        emitter.Length = state.float32();
        emitter.FilterMode = state.int32();
        emitter.Rows = state.int32();
        emitter.Columns = state.int32();
        var frameFlags = state.int32();
        emitter.FrameFlags = 0;
        if (frameFlags === 0 || frameFlags === 2) {
            emitter.FrameFlags |= model_1.ParticleEmitter2FramesFlags.Head;
        }
        if (frameFlags === 1 || frameFlags === 2) {
            emitter.FrameFlags |= model_1.ParticleEmitter2FramesFlags.Tail;
        }
        emitter.TailLength = state.float32();
        emitter.Time = state.float32();
        emitter.SegmentColor = [];
        // always 3 segments
        for (var i = 0; i < 3; ++i) {
            emitter.SegmentColor[i] = new Float32Array(3);
            //  rgb order, inverse from mdl
            for (var j = 0; j < 3; ++j) {
                emitter.SegmentColor[i][j] = state.float32();
            }
        }
        emitter.Alpha = new Uint8Array(3);
        for (var i = 0; i < 3; ++i) {
            emitter.Alpha[i] = state.uint8();
        }
        emitter.ParticleScaling = new Float32Array(3);
        for (var i = 0; i < 3; ++i) {
            emitter.ParticleScaling[i] = state.float32();
        }
        for (var _i = 0, _a = ['LifeSpanUVAnim', 'DecayUVAnim', 'TailUVAnim', 'TailDecayUVAnim']; _i < _a.length; _i++) {
            var part = _a[_i];
            emitter[part] = new Uint32Array(3);
            for (var i = 0; i < 3; ++i) {
                emitter[part][i] = state.int32();
            }
        }
        emitter.TextureID = state.int32();
        if (emitter.TextureID === NONE) {
            emitter.TextureID = null;
        }
        emitter.Squirt = state.int32() > 0;
        emitter.PriorityPlane = state.int32();
        emitter.ReplaceableId = state.int32();
        while (state.pos < emitterStart + emitterSize) {
            var keyword = state.keyword();
            if (keyword === 'KP2V') {
                emitter.Visibility = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KP2E') {
                emitter.EmissionRate = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KP2W') {
                emitter.Width = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KP2N') {
                emitter.Length = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KP2S') {
                emitter.Speed = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KP2L') {
                emitter.Latitude = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KP2G') {
                emitter.Gravity = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KP2R') {
                emitter.Variation = state.animVector(AnimVectorType.FLOAT1);
            }
            else {
                throw new Error('Incorrect particle emitter2 chunk data ' + keyword);
            }
        }
        model.ParticleEmitters2.push(emitter);
    }
}
var MODEL_CAMERA_NAME_LENGTH = 0x50;
function parseCameras(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var cameraStart = state.pos;
        var cameraSize = state.int32();
        var camera = {};
        camera.Name = state.str(MODEL_CAMERA_NAME_LENGTH);
        camera.Position = new Float32Array(3);
        camera.Position[0] = state.float32();
        camera.Position[1] = state.float32();
        camera.Position[2] = state.float32();
        camera.FieldOfView = state.float32();
        camera.FarClip = state.float32();
        camera.NearClip = state.float32();
        camera.TargetPosition = new Float32Array(3);
        camera.TargetPosition[0] = state.float32();
        camera.TargetPosition[1] = state.float32();
        camera.TargetPosition[2] = state.float32();
        while (state.pos < cameraStart + cameraSize) {
            var keyword = state.keyword();
            if (keyword === 'KCTR') {
                camera.Translation = state.animVector(AnimVectorType.FLOAT3);
            }
            else if (keyword === 'KTTR') {
                camera.TargetTranslation = state.animVector(AnimVectorType.FLOAT3);
            }
            else if (keyword === 'KCRL') {
                camera.Rotation = state.animVector(AnimVectorType.FLOAT1);
            }
            else {
                throw new Error('Incorrect camera chunk data ' + keyword);
            }
        }
        model.Cameras.push(camera);
    }
}
function parseLights(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var lightStart = state.pos;
        var lightSize = state.int32();
        var light = {};
        parseNode(model, light, state);
        light.LightType = state.int32();
        light.AttenuationStart = state.float32();
        light.AttenuationEnd = state.float32();
        light.Color = new Float32Array(3);
        //  rgb order, inverse from mdl
        for (var j = 0; j < 3; ++j) {
            light.Color[j] = state.float32();
        }
        light.Intensity = state.float32();
        light.AmbColor = new Float32Array(3);
        //  rgb order, inverse from mdl
        for (var j = 0; j < 3; ++j) {
            light.AmbColor[j] = state.float32();
        }
        light.AmbIntensity = state.float32();
        while (state.pos < lightStart + lightSize) {
            var keyword = state.keyword();
            if (keyword === 'KLAV') {
                light.Visibility = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KLAC') {
                light.Color = state.animVector(AnimVectorType.FLOAT3);
            }
            else if (keyword === 'KLAI') {
                light.Intensity = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KLBC') {
                light.AmbColor = state.animVector(AnimVectorType.FLOAT3);
            }
            else if (keyword === 'KLBI') {
                light.AmbIntensity = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KLAS') {
                light.AttenuationStart = state.animVector(AnimVectorType.INT1);
            }
            else if (keyword === 'KLAE') {
                light.AttenuationEnd = state.animVector(AnimVectorType.INT1);
            }
            else {
                throw new Error('Incorrect light chunk data ' + keyword);
            }
        }
        model.Lights.push(light);
    }
}
function parseTextureAnims(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var animStart = state.pos;
        var animSize = state.int32();
        var anim = {};
        while (state.pos < animStart + animSize) {
            var keyword = state.keyword();
            if (keyword === 'KTAT') {
                anim.Translation = state.animVector(AnimVectorType.FLOAT3);
            }
            else if (keyword === 'KTAR') {
                anim.Rotation = state.animVector(AnimVectorType.FLOAT4);
            }
            else if (keyword === 'KTAS') {
                anim.Scaling = state.animVector(AnimVectorType.FLOAT3);
            }
            else {
                throw new Error('Incorrect light chunk data ' + keyword);
            }
        }
        model.TextureAnims.push(anim);
    }
}
function parseRibbonEmitters(model, state, size) {
    var startPos = state.pos;
    while (state.pos < startPos + size) {
        var emitterStart = state.pos;
        var emitterSize = state.int32();
        var emitter = {};
        parseNode(model, emitter, state);
        emitter.HeightAbove = state.float32();
        emitter.HeightBelow = state.float32();
        emitter.Alpha = state.float32();
        emitter.Color = new Float32Array(3);
        //  rgb order, inverse from mdl
        for (var j = 0; j < 3; ++j) {
            emitter.Color[j] = state.float32();
        }
        emitter.LifeSpan = state.float32();
        emitter.TextureSlot = state.int32();
        emitter.EmissionRate = state.int32();
        emitter.Rows = state.int32();
        emitter.Columns = state.int32();
        emitter.MaterialID = state.int32();
        emitter.Gravity = state.float32();
        while (state.pos < emitterStart + emitterSize) {
            var keyword = state.keyword();
            if (keyword === 'KRVS') {
                emitter.Visibility = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KRHA') {
                emitter.HeightAbove = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KRHB') {
                emitter.HeightBelow = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KRAL') {
                emitter.Alpha = state.animVector(AnimVectorType.FLOAT1);
            }
            else if (keyword === 'KRTX') {
                emitter.TextureSlot = state.animVector(AnimVectorType.INT1);
            }
            else {
                throw new Error('Incorrect ribbon emitter chunk data ' + keyword);
            }
        }
        model.RibbonEmitters.push(emitter);
    }
}
var parsers = {
    VERS: parseVersion,
    MODL: parseModelInfo,
    SEQS: parseSequences,
    MTLS: parseMaterials,
    TEXS: parseTextures,
    GEOS: parseGeosets,
    GEOA: parseGeosetAnims,
    BONE: parseBones,
    HELP: parseHelpers,
    ATCH: parseAttachments,
    PIVT: parsePivotPoints,
    EVTS: parseEventObjects,
    CLID: parseCollisionShapes,
    GLBS: parseGlobalSequences,
    PREM: parseParticleEmitters,
    PRE2: parseParticleEmitters2,
    CAMS: parseCameras,
    LITE: parseLights,
    TXAN: parseTextureAnims,
    RIBB: parseRibbonEmitters
};
function parse(arrayBuffer) {
    var state = new State(arrayBuffer);
    if (state.keyword() !== 'MDLX') {
        throw new Error('Not a mdx model');
    }
    var model = {
        // default
        Version: 800,
        Info: {
            Name: '',
            MinimumExtent: null,
            MaximumExtent: null,
            BoundsRadius: 0,
            BlendTime: 150
        },
        Sequences: [],
        GlobalSequences: [],
        Textures: [],
        Materials: [],
        TextureAnims: [],
        Geosets: [],
        GeosetAnims: [],
        Bones: [],
        Helpers: [],
        Attachments: [],
        EventObjects: [],
        ParticleEmitters: [],
        ParticleEmitters2: [],
        Cameras: [],
        Lights: [],
        RibbonEmitters: [],
        CollisionShapes: [],
        PivotPoints: [],
        Nodes: []
    };
    while (state.pos < state.length) {
        var keyword = state.keyword();
        var size = state.int32();
        if (keyword in parsers) {
            parsers[keyword](model, state, size);
        }
        else {
            throw new Error('Unknown group ' + keyword);
        }
    }
    for (var i = 0; i < model.Nodes.length; ++i) {
        if (model.Nodes[i] && model.PivotPoints[i]) {
            model.Nodes[i].PivotPoint = model.PivotPoints[i];
        }
    }
    return model;
}
exports.parse = parse;
var _a;
//# sourceMappingURL=mdx.js.map
},{"../model":2}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("../model");
var gl_matrix_1 = require("gl-matrix");
function lerp(left, right, t) {
    return left * (1 - t) + right * t;
}
exports.lerp = lerp;
function interpNum(frame, left, right, lineType) {
    if (left.Frame === right.Frame) {
        return left.Vector[0];
    }
    var t = (frame - left.Frame) / (right.Frame - left.Frame);
    if (lineType === model_1.LineType.DontInterp) {
        return left.Vector[0];
        // } else if (animVector.LineType === 'Bezier') {
        //     return vec3.bezier(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
        // } else if (animVector.LineType === 'Hermite') {
        //     return vec3.hermite(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    }
    else {
        // Linear
        return lerp(left.Vector[0], right.Vector[0], t);
    }
}
exports.interpNum = interpNum;
function interpVec3(out, frame, left, right, lineType) {
    if (left.Frame === right.Frame) {
        return left.Vector;
    }
    var t = (frame - left.Frame) / (right.Frame - left.Frame);
    if (lineType === model_1.LineType.DontInterp) {
        return left.Vector;
    }
    else if (lineType === model_1.LineType.Bezier) {
        return gl_matrix_1.vec3.bezier(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    }
    else if (lineType === model_1.LineType.Hermite) {
        return gl_matrix_1.vec3.hermite(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    }
    else {
        return gl_matrix_1.vec3.lerp(out, left.Vector, right.Vector, t);
    }
}
exports.interpVec3 = interpVec3;
function interpQuat(out, frame, left, right, lineType) {
    if (left.Frame === right.Frame) {
        return left.Vector;
    }
    var t = (frame - left.Frame) / (right.Frame - left.Frame);
    if (lineType === model_1.LineType.DontInterp) {
        return left.Vector;
    }
    else if (lineType === model_1.LineType.Hermite || lineType === model_1.LineType.Bezier) {
        return gl_matrix_1.quat.sqlerp(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    }
    else {
        return gl_matrix_1.quat.slerp(out, left.Vector, right.Vector, t);
    }
}
exports.interpQuat = interpQuat;
//# sourceMappingURL=interp.js.map
},{"../model":2,"gl-matrix":3}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var interp_1 = require("./interp");
var findLocalFrameRes = {
    frame: 0,
    from: 0,
    to: 0
};
var findKeyframesRes = {
    frame: 0,
    left: null,
    right: null
};
var ModelInterp = (function () {
    function ModelInterp(rendererData) {
        this.rendererData = rendererData;
    }
    ModelInterp.maxAnimVectorVal = function (vector) {
        if (typeof vector === 'number') {
            return vector;
        }
        var max = vector.Keys[0].Vector[0];
        for (var i = 1; i < vector.Keys.length; ++i) {
            if (vector.Keys[i].Vector[0] > max) {
                max = vector.Keys[i].Vector[0];
            }
        }
        return max;
    };
    ModelInterp.prototype.num = function (animVector) {
        var res = this.findKeyframes(animVector);
        if (!res) {
            return null;
        }
        return interp_1.interpNum(res.frame, res.left, res.right, animVector.LineType);
    };
    ModelInterp.prototype.vec3 = function (out, animVector) {
        var res = this.findKeyframes(animVector);
        if (!res) {
            return null;
        }
        return interp_1.interpVec3(out, res.frame, res.left, res.right, animVector.LineType);
    };
    ModelInterp.prototype.quat = function (out, animVector) {
        var res = this.findKeyframes(animVector);
        if (!res) {
            return null;
        }
        return interp_1.interpQuat(out, res.frame, res.left, res.right, animVector.LineType);
    };
    ModelInterp.prototype.animVectorVal = function (vector, defaultVal) {
        var res;
        if (typeof vector === 'number') {
            res = vector;
        }
        else {
            res = this.num(vector);
            if (res === null) {
                res = defaultVal;
            }
        }
        return res;
    };
    ModelInterp.prototype.findKeyframes = function (animVector) {
        if (!animVector) {
            return null;
        }
        var _a = this.findLocalFrame(animVector), frame = _a.frame, from = _a.from, to = _a.to;
        var array = animVector.Keys;
        var first = 0;
        var count = array.length;
        if (count === 0) {
            return null;
        }
        if (array[0].Frame > to) {
            return null;
        }
        else if (array[count - 1].Frame < from) {
            return null;
        }
        while (count > 0) {
            var step = count >> 1;
            if (array[first + step].Frame <= frame) {
                first = first + step + 1;
                count -= step + 1;
            }
            else {
                count = step;
            }
        }
        if (first === 0) {
            return null;
        }
        if (first === array.length || array[first].Frame > to) {
            if (array[first - 1].Frame >= from) {
                findKeyframesRes.frame = frame;
                findKeyframesRes.left = array[first - 1];
                findKeyframesRes.right = array[first - 1];
                return findKeyframesRes;
            }
            else {
                return null;
            }
        }
        if (array[first - 1].Frame < from) {
            if (array[first].Frame <= to) {
                findKeyframesRes.frame = frame;
                findKeyframesRes.left = array[first];
                findKeyframesRes.right = array[first];
                return findKeyframesRes;
            }
            else {
                return null;
            }
        }
        findKeyframesRes.frame = frame;
        findKeyframesRes.left = array[first - 1];
        findKeyframesRes.right = array[first];
        return findKeyframesRes;
    };
    ModelInterp.prototype.findLocalFrame = function (animVector) {
        if (typeof animVector.GlobalSeqId === 'number') {
            findLocalFrameRes.frame = this.rendererData.globalSequencesFrames[animVector.GlobalSeqId];
            findLocalFrameRes.from = 0;
            findLocalFrameRes.to = this.rendererData.model.GlobalSequences[animVector.GlobalSeqId];
        }
        else {
            findLocalFrameRes.frame = this.rendererData.frame;
            findLocalFrameRes.from = this.rendererData.animationInfo.Interval[0];
            findLocalFrameRes.to = this.rendererData.animationInfo.Interval[1];
        }
        return findLocalFrameRes;
    };
    return ModelInterp;
}());
exports.ModelInterp = ModelInterp;
//# sourceMappingURL=modelInterp.js.map
},{"./interp":15}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("../model");
var gl_matrix_1 = require("gl-matrix");
var util_1 = require("./util");
var modelInterp_1 = require("./modelInterp");
var particles_1 = require("./particles");
var ribbons_1 = require("./ribbons");
var MAX_NODES = 128;
var gl;
var shaderProgram;
var shaderProgramLocations = {};
var anisotropicExt;
var vertexShaderHardwareSkinning = "\n    attribute vec3 aVertexPosition;\n    attribute vec2 aTextureCoord;\n    attribute vec4 aGroup;\n\n    uniform mat4 uMVMatrix;\n    uniform mat4 uPMatrix;\n    uniform mat4 uNodesMatrices[" + MAX_NODES + "];\n\n    varying vec2 vTextureCoord;\n\n    void main(void) {\n        vec4 position = vec4(aVertexPosition, 1.0);\n        int count = 1;\n        vec4 sum = uNodesMatrices[int(aGroup[0])] * position;\n\n        if (aGroup[1] < " + MAX_NODES + ".) {\n            sum += uNodesMatrices[int(aGroup[1])] * position;\n            count += 1;\n        }\n        if (aGroup[2] < " + MAX_NODES + ".) {\n            sum += uNodesMatrices[int(aGroup[2])] * position;\n            count += 1;\n        }\n        if (aGroup[3] < " + MAX_NODES + ".) {\n            sum += uNodesMatrices[int(aGroup[3])] * position;\n            count += 1;\n        }\n        sum.xyz /= float(count);\n        sum.w = 1.;\n        position = sum;\n\n        gl_Position = uPMatrix * uMVMatrix * position;\n        vTextureCoord = aTextureCoord;\n    }\n";
var vertexShaderSoftwareSkinning = "\n    attribute vec3 aVertexPosition;\n    attribute vec2 aTextureCoord;\n\n    uniform mat4 uMVMatrix;\n    uniform mat4 uPMatrix;\n\n    varying vec2 vTextureCoord;\n\n    void main(void) {\n        vec4 position = vec4(aVertexPosition, 1.0);\n        gl_Position = uPMatrix * uMVMatrix * position;\n        vTextureCoord = aTextureCoord;\n    }\n";
var fragmentShader = "\n    precision mediump float;\n\n    varying vec2 vTextureCoord;\n\n    uniform sampler2D uSampler;\n    uniform vec3 uReplaceableColor;\n    uniform float uReplaceableType;\n    uniform float uDiscardAlphaLevel;\n    uniform mat3 uTVextexAnim;\n\n    float hypot (vec2 z) {\n        float t;\n        float x = abs(z.x);\n        float y = abs(z.y);\n        t = min(x, y);\n        x = max(x, y);\n        t = t / x;\n        return (z.x == 0.0 && z.y == 0.0) ? 0.0 : x * sqrt(1.0 + t * t);\n    }\n\n    void main(void) {\n        vec2 texCoord = (uTVextexAnim * vec3(vTextureCoord.s, vTextureCoord.t, 1.)).st;\n\n        if (uReplaceableType == 0.) {\n            gl_FragColor = texture2D(uSampler, texCoord);\n        } else if (uReplaceableType == 1.) {\n            gl_FragColor = vec4(uReplaceableColor, 1.0);\n        } else if (uReplaceableType == 2.) {\n            float dist = hypot(texCoord - vec2(0.5, 0.5)) * 2.;\n            float truncateDist = clamp(1. - dist * 1.4, 0., 1.);\n            float alpha = sin(truncateDist);\n            gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);\n        }\n\n        // hand-made alpha-test\n        if (gl_FragColor[3] < uDiscardAlphaLevel) {\n            discard;\n        }\n    }\n";
var translation = gl_matrix_1.vec3.create();
var rotation = gl_matrix_1.quat.create();
var scaling = gl_matrix_1.vec3.create();
var defaultTranslation = gl_matrix_1.vec3.fromValues(0, 0, 0);
var defaultRotation = gl_matrix_1.quat.fromValues(0, 0, 0, 1);
var defaultScaling = gl_matrix_1.vec3.fromValues(1, 1, 1);
var tempParentRotationQuat = gl_matrix_1.quat.create();
var tempParentRotationMat = gl_matrix_1.mat4.create();
var tempCameraMat = gl_matrix_1.mat4.create();
var tempTransformedPivotPoint = gl_matrix_1.vec3.create();
var tempAxis = gl_matrix_1.vec3.create();
var tempLockQuat = gl_matrix_1.quat.create();
var tempLockMat = gl_matrix_1.mat4.create();
var tempXAxis = gl_matrix_1.vec3.create();
var tempCameraVec = gl_matrix_1.vec3.create();
var tempCross0 = gl_matrix_1.vec3.create();
var tempCross1 = gl_matrix_1.vec3.create();
var tempPos = gl_matrix_1.vec3.create();
var tempSum = gl_matrix_1.vec3.create();
var tempVec3 = gl_matrix_1.vec3.create();
var identifyMat3 = gl_matrix_1.mat3.create();
var texCoordMat4 = gl_matrix_1.mat4.create();
var texCoordMat3 = gl_matrix_1.mat3.create();
var ModelRenderer = (function () {
    function ModelRenderer(model) {
        this.vertexBuffer = [];
        this.vertices = []; // Array per geoset for software skinning
        this.texCoordBuffer = [];
        this.indexBuffer = [];
        this.groupBuffer = [];
        this.model = model;
        this.rendererData = {
            model: model,
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
        this.rendererData.teamColor = gl_matrix_1.vec3.fromValues(1., 0., 0.);
        this.rendererData.cameraPos = gl_matrix_1.vec3.create();
        this.rendererData.cameraQuat = gl_matrix_1.quat.create();
        this.setSequence(0);
        this.rendererData.rootNode = {
            // todo
            node: {},
            matrix: gl_matrix_1.mat4.create(),
            childs: []
        };
        for (var _i = 0, _a = model.Nodes; _i < _a.length; _i++) {
            var node = _a[_i];
            this.rendererData.nodes[node.ObjectId] = {
                node: node,
                matrix: gl_matrix_1.mat4.create(),
                childs: []
            };
        }
        for (var _b = 0, _c = model.Nodes; _b < _c.length; _b++) {
            var node = _c[_b];
            if (!node.Parent) {
                this.rendererData.rootNode.childs.push(this.rendererData.nodes[node.ObjectId]);
            }
            else {
                this.rendererData.nodes[node.Parent].childs.push(this.rendererData.nodes[node.ObjectId]);
            }
        }
        if (model.GlobalSequences) {
            for (var i = 0; i < model.GlobalSequences.length; ++i) {
                this.rendererData.globalSequencesFrames[i] = 0;
            }
        }
        for (var i = 0; i < model.GeosetAnims.length; ++i) {
            this.rendererData.geosetAnims[model.GeosetAnims[i].GeosetId] = model.GeosetAnims[i];
        }
        for (var i = 0; i < model.Materials.length; ++i) {
            this.rendererData.materialLayerTextureID[i] = new Array(model.Materials[i].Layers.length);
        }
        this.interp = new modelInterp_1.ModelInterp(this.rendererData);
        this.particlesController = new particles_1.ParticlesController(this.interp, this.rendererData);
        this.ribbonsController = new ribbons_1.RibbonsController(this.interp, this.rendererData);
    }
    ModelRenderer.prototype.initGL = function (glContext) {
        gl = glContext;
        // Max bones + MV + P
        this.softwareSkinning = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) < 4 * (MAX_NODES + 2);
        anisotropicExt = (gl.getExtension('EXT_texture_filter_anisotropic') ||
            gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic'));
        this.initShaders();
        this.initBuffers();
        particles_1.ParticlesController.initGL(glContext);
        ribbons_1.RibbonsController.initGL(glContext);
    };
    ModelRenderer.prototype.setTexture = function (path, img, flags) {
        this.rendererData.textures[path] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.rendererData.textures[path]);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        if (flags & model_1.TextureFlags.WrapWidth) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        }
        if (flags & model_1.TextureFlags.WrapHeight) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        if (anisotropicExt) {
            var max = gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            gl.texParameterf(gl.TEXTURE_2D, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    ModelRenderer.prototype.setCamera = function (cameraPos, cameraQuat) {
        gl_matrix_1.vec3.copy(this.rendererData.cameraPos, cameraPos);
        gl_matrix_1.quat.copy(this.rendererData.cameraQuat, cameraQuat);
    };
    ModelRenderer.prototype.setSequence = function (index) {
        this.rendererData.animation = index;
        this.rendererData.animationInfo = this.model.Sequences[this.rendererData.animation];
        this.rendererData.frame = this.rendererData.animationInfo.Interval[0];
    };
    ModelRenderer.prototype.setTeamColor = function (color) {
        gl_matrix_1.vec3.copy(this.rendererData.teamColor, color);
    };
    ModelRenderer.prototype.update = function (delta) {
        this.rendererData.frame += delta;
        if (this.rendererData.frame > this.rendererData.animationInfo.Interval[1]) {
            this.rendererData.frame = this.rendererData.animationInfo.Interval[0];
        }
        this.updateGlobalSequences(delta);
        this.updateNode(this.rendererData.rootNode);
        this.particlesController.update(delta);
        this.ribbonsController.update(delta);
        for (var i = 0; i < this.model.Geosets.length; ++i) {
            this.rendererData.geosetAlpha[i] = this.findAlpha(i);
        }
        for (var i = 0; i < this.rendererData.materialLayerTextureID.length; ++i) {
            for (var j = 0; j < this.rendererData.materialLayerTextureID[i].length; ++j) {
                this.updateLayerTextureId(i, j);
            }
        }
    };
    ModelRenderer.prototype.render = function (mvMatrix, pMatrix) {
        gl.useProgram(shaderProgram);
        gl.uniformMatrix4fv(shaderProgramLocations.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgramLocations.mvMatrixUniform, false, mvMatrix);
        gl.enableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);
        if (!this.softwareSkinning) {
            gl.enableVertexAttribArray(shaderProgramLocations.groupAttribute);
        }
        if (!this.softwareSkinning) {
            for (var j = 0; j < MAX_NODES; ++j) {
                if (this.rendererData.nodes[j]) {
                    gl.uniformMatrix4fv(shaderProgramLocations.nodesMatricesAttributes[j], false, this.rendererData.nodes[j].matrix);
                }
            }
        }
        for (var i = 0; i < this.model.Geosets.length; ++i) {
            if (this.rendererData.geosetAlpha[i] < 1e-6) {
                continue;
            }
            if (this.softwareSkinning) {
                this.generateGeosetVertices(i);
            }
            var materialID = this.model.Geosets[i].MaterialID;
            var material = this.model.Materials[materialID];
            for (var j = 0; j < material.Layers.length; ++j) {
                this.setLayerProps(material.Layers[j], this.rendererData.materialLayerTextureID[materialID][j]);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                gl.vertexAttribPointer(shaderProgramLocations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
                gl.vertexAttribPointer(shaderProgramLocations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
                if (!this.softwareSkinning) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.groupBuffer[i]);
                    gl.vertexAttribPointer(shaderProgramLocations.groupAttribute, 4, gl.UNSIGNED_BYTE, false, 0, 0);
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
    };
    ModelRenderer.prototype.generateGeosetVertices = function (geosetIndex) {
        var geoset = this.model.Geosets[geosetIndex];
        var buffer = this.vertices[geosetIndex];
        for (var i = 0; i < buffer.length; i += 3) {
            var index = i / 3;
            var group = geoset.Groups[geoset.VertexGroup[index]];
            gl_matrix_1.vec3.set(tempPos, geoset.Vertices[i], geoset.Vertices[i + 1], geoset.Vertices[i + 2]);
            gl_matrix_1.vec3.set(tempSum, 0, 0, 0);
            for (var j = 0; j < group.length; ++j) {
                gl_matrix_1.vec3.add(tempSum, tempSum, gl_matrix_1.vec3.transformMat4(tempVec3, tempPos, this.rendererData.nodes[group[j]].matrix));
            }
            gl_matrix_1.vec3.scale(tempPos, tempSum, 1 / group.length);
            buffer[i] = tempPos[0];
            buffer[i + 1] = tempPos[1];
            buffer[i + 2] = tempPos[2];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer[geosetIndex]);
        gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
    };
    ModelRenderer.prototype.updateLayerTextureId = function (materialId, layerId) {
        var TextureID = this.model.Materials[materialId].Layers[layerId].TextureID;
        if (typeof TextureID === 'number') {
            this.rendererData.materialLayerTextureID[materialId][layerId] = TextureID;
        }
        else {
            this.rendererData.materialLayerTextureID[materialId][layerId] = this.interp.num(TextureID);
        }
    };
    ModelRenderer.prototype.initShaders = function () {
        if (shaderProgram) {
            return;
        }
        var vertex = util_1.getShader(gl, this.softwareSkinning ? vertexShaderSoftwareSkinning : vertexShaderHardwareSkinning, gl.VERTEX_SHADER);
        var fragment = util_1.getShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
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
            for (var i = 0; i < MAX_NODES; ++i) {
                shaderProgramLocations.nodesMatricesAttributes[i] =
                    gl.getUniformLocation(shaderProgram, "uNodesMatrices[" + i + "]");
            }
        }
    };
    ModelRenderer.prototype.initBuffers = function () {
        for (var i = 0; i < this.model.Geosets.length; ++i) {
            this.vertexBuffer[i] = gl.createBuffer();
            if (this.softwareSkinning) {
                this.vertices[i] = new Float32Array(this.model.Geosets[i].Vertices.length);
            }
            else {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                gl.bufferData(gl.ARRAY_BUFFER, this.model.Geosets[i].Vertices, gl.STATIC_DRAW);
            }
            this.texCoordBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
            gl.bufferData(gl.ARRAY_BUFFER, this.model.Geosets[i].TVertices[0], gl.STATIC_DRAW);
            if (!this.softwareSkinning) {
                this.groupBuffer[i] = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this.groupBuffer[i]);
                var buffer = new Uint8Array(this.model.Geosets[i].VertexGroup.length * 4);
                for (var j = 0; j < buffer.length; j += 4) {
                    var index = j / 4;
                    var group = this.model.Geosets[i].Groups[this.model.Geosets[i].VertexGroup[index]];
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
    };
    /*private resetGlobalSequences (): void {
        for (let i = 0; i < this.rendererData.globalSequencesFrames.length; ++i) {
            this.rendererData.globalSequencesFrames[i] = 0;
        }
    }*/
    ModelRenderer.prototype.updateGlobalSequences = function (delta) {
        for (var i = 0; i < this.rendererData.globalSequencesFrames.length; ++i) {
            this.rendererData.globalSequencesFrames[i] += delta;
            if (this.rendererData.globalSequencesFrames[i] > this.model.GlobalSequences[i]) {
                this.rendererData.globalSequencesFrames[i] = 0;
            }
        }
    };
    ModelRenderer.prototype.updateNode = function (node) {
        var translationRes = this.interp.vec3(translation, node.node.Translation);
        var rotationRes = this.interp.quat(rotation, node.node.Rotation);
        var scalingRes = this.interp.vec3(scaling, node.node.Scaling);
        if (!translationRes && !rotationRes && !scalingRes) {
            gl_matrix_1.mat4.identity(node.matrix);
        }
        else if (translationRes && !rotationRes && !scalingRes) {
            gl_matrix_1.mat4.fromTranslation(node.matrix, translationRes);
        }
        else if (!translationRes && rotationRes && !scalingRes) {
            util_1.mat4fromRotationOrigin(node.matrix, rotationRes, node.node.PivotPoint);
        }
        else {
            gl_matrix_1.mat4.fromRotationTranslationScaleOrigin(node.matrix, rotationRes || defaultRotation, translationRes || defaultTranslation, scalingRes || defaultScaling, node.node.PivotPoint);
        }
        if (node.node.Parent) {
            gl_matrix_1.mat4.mul(node.matrix, this.rendererData.nodes[node.node.Parent].matrix, node.matrix);
        }
        var billboardedLock = node.node.Flags & model_1.NodeFlags.BillboardedLockX ||
            node.node.Flags & model_1.NodeFlags.BillboardedLockY ||
            node.node.Flags & model_1.NodeFlags.BillboardedLockZ;
        if (node.node.Flags & model_1.NodeFlags.Billboarded) {
            gl_matrix_1.vec3.transformMat4(tempTransformedPivotPoint, node.node.PivotPoint, node.matrix);
            if (node.node.Parent) {
                // cancel parent rotation from PivotPoint
                gl_matrix_1.mat4.getRotation(tempParentRotationQuat, this.rendererData.nodes[node.node.Parent].matrix);
                gl_matrix_1.quat.invert(tempParentRotationQuat, tempParentRotationQuat);
                util_1.mat4fromRotationOrigin(tempParentRotationMat, tempParentRotationQuat, tempTransformedPivotPoint);
                gl_matrix_1.mat4.mul(node.matrix, tempParentRotationMat, node.matrix);
            }
            // rotate to camera
            util_1.mat4fromRotationOrigin(tempCameraMat, this.rendererData.cameraQuat, tempTransformedPivotPoint);
            gl_matrix_1.mat4.mul(node.matrix, tempCameraMat, node.matrix);
        }
        else if (billboardedLock) {
            gl_matrix_1.vec3.transformMat4(tempTransformedPivotPoint, node.node.PivotPoint, node.matrix);
            gl_matrix_1.vec3.copy(tempAxis, node.node.PivotPoint);
            // todo BillboardedLockX ?
            if (node.node.Flags & model_1.NodeFlags.BillboardedLockX) {
                tempAxis[0] += 1;
            }
            else if (node.node.Flags & model_1.NodeFlags.BillboardedLockY) {
                tempAxis[1] += 1;
            }
            else if (node.node.Flags & model_1.NodeFlags.BillboardedLockZ) {
                tempAxis[2] += 1;
            }
            gl_matrix_1.vec3.transformMat4(tempAxis, tempAxis, node.matrix);
            gl_matrix_1.vec3.sub(tempAxis, tempAxis, tempTransformedPivotPoint);
            gl_matrix_1.vec3.set(tempXAxis, 1, 0, 0);
            gl_matrix_1.vec3.add(tempXAxis, tempXAxis, node.node.PivotPoint);
            gl_matrix_1.vec3.transformMat4(tempXAxis, tempXAxis, node.matrix);
            gl_matrix_1.vec3.sub(tempXAxis, tempXAxis, tempTransformedPivotPoint);
            gl_matrix_1.vec3.set(tempCameraVec, -1, 0, 0);
            gl_matrix_1.vec3.transformQuat(tempCameraVec, tempCameraVec, this.rendererData.cameraQuat);
            gl_matrix_1.vec3.cross(tempCross0, tempAxis, tempCameraVec);
            gl_matrix_1.vec3.cross(tempCross1, tempAxis, tempCross0);
            gl_matrix_1.vec3.normalize(tempCross1, tempCross1);
            gl_matrix_1.quat.rotationTo(tempLockQuat, tempXAxis, tempCross1);
            util_1.mat4fromRotationOrigin(tempLockMat, tempLockQuat, tempTransformedPivotPoint);
            gl_matrix_1.mat4.mul(node.matrix, tempLockMat, node.matrix);
        }
        for (var _i = 0, _a = node.childs; _i < _a.length; _i++) {
            var child = _a[_i];
            this.updateNode(child);
        }
    };
    ModelRenderer.prototype.findAlpha = function (geosetId) {
        var geosetAnim = this.rendererData.geosetAnims[geosetId];
        if (!geosetAnim || geosetAnim.Alpha === undefined) {
            return 1;
        }
        if (typeof geosetAnim.Alpha === 'number') {
            return geosetAnim.Alpha;
        }
        var interpRes = this.interp.num(geosetAnim.Alpha);
        if (interpRes === null) {
            return 1;
        }
        return interpRes;
    };
    ModelRenderer.prototype.setLayerProps = function (layer, textureID) {
        var texture = this.model.Textures[textureID];
        if (layer.Shading & model_1.LayerShading.TwoSided) {
            gl.disable(gl.CULL_FACE);
        }
        else {
            gl.enable(gl.CULL_FACE);
        }
        if (layer.FilterMode === model_1.FilterMode.Transparent) {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, 0.75);
        }
        else {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, 0.);
        }
        if (layer.FilterMode === model_1.FilterMode.None) {
            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(true);
        }
        else if (layer.FilterMode === model_1.FilterMode.Transparent) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(true);
        }
        else if (layer.FilterMode === model_1.FilterMode.Blend) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);
        }
        else if (layer.FilterMode === model_1.FilterMode.Additive) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_COLOR, gl.ONE);
            gl.depthMask(false);
        }
        else if (layer.FilterMode === model_1.FilterMode.AddAlpha) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false);
        }
        else if (layer.FilterMode === model_1.FilterMode.Modulate) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ZERO, gl.ONE);
            gl.depthMask(false);
        }
        else if (layer.FilterMode === model_1.FilterMode.Modulate2x) {
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
        }
        else if (texture.ReplaceableId === 1 || texture.ReplaceableId === 2) {
            gl.uniform3fv(shaderProgramLocations.replaceableColorUniform, this.rendererData.teamColor);
            gl.uniform1f(shaderProgramLocations.replaceableTypeUniform, texture.ReplaceableId);
        }
        if (layer.Shading & model_1.LayerShading.NoDepthTest) {
            gl.disable(gl.DEPTH_TEST);
        }
        if (layer.Shading & model_1.LayerShading.NoDepthSet) {
            gl.depthMask(false);
        }
        if (typeof layer.TVertexAnimId === 'number') {
            var anim = this.rendererData.model.TextureAnims[layer.TVertexAnimId];
            var translationRes = this.interp.vec3(translation, anim.Translation);
            var rotationRes = this.interp.quat(rotation, anim.Rotation);
            var scalingRes = this.interp.vec3(scaling, anim.Scaling);
            gl_matrix_1.mat4.fromRotationTranslationScale(texCoordMat4, rotationRes || defaultRotation, translationRes || defaultTranslation, scalingRes || defaultScaling);
            gl_matrix_1.mat3.set(texCoordMat3, texCoordMat4[0], texCoordMat4[1], 0, texCoordMat4[4], texCoordMat4[5], 0, texCoordMat4[12], texCoordMat4[13], 0);
            gl.uniformMatrix3fv(shaderProgramLocations.tVertexAnimUniform, false, texCoordMat3);
        }
        else {
            gl.uniformMatrix3fv(shaderProgramLocations.tVertexAnimUniform, false, identifyMat3);
        }
    };
    return ModelRenderer;
}());
exports.ModelRenderer = ModelRenderer;
//# sourceMappingURL=modelRenderer.js.map
},{"../model":2,"./modelInterp":16,"./particles":18,"./ribbons":19,"./util":20,"gl-matrix":3}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("../model");
var gl_matrix_1 = require("gl-matrix");
var modelInterp_1 = require("./modelInterp");
var util_1 = require("./util");
var interp_1 = require("./interp");
var gl;
var shaderProgram;
var shaderProgramLocations = {};
var particleStorage = [];
var rotateCenter = gl_matrix_1.vec3.fromValues(0, 0, 0);
var firstColor = gl_matrix_1.vec4.create();
var secondColor = gl_matrix_1.vec4.create();
var color = gl_matrix_1.vec4.create();
var tailPos = gl_matrix_1.vec3.create();
var tailCross = gl_matrix_1.vec3.create();
var vertexShader = "\n    attribute vec3 aVertexPosition;\n    attribute vec2 aTextureCoord;\n    attribute vec4 aColor;\n\n    uniform mat4 uMVMatrix;\n    uniform mat4 uPMatrix;\n\n    varying vec2 vTextureCoord;\n    varying vec4 vColor;\n\n    void main(void) {\n        vec4 position = vec4(aVertexPosition, 1.0);\n        gl_Position = uPMatrix * uMVMatrix * position;\n        vTextureCoord = aTextureCoord;\n        vColor = aColor;\n    }\n";
var fragmentShader = "\n    precision mediump float;\n\n    varying vec2 vTextureCoord;\n    varying vec4 vColor;\n\n    uniform sampler2D uSampler;\n    uniform vec3 uReplaceableColor;\n    uniform float uReplaceableType;\n    uniform float uDiscardAlphaLevel;\n\n    float hypot (vec2 z) {\n        float t;\n        float x = abs(z.x);\n        float y = abs(z.y);\n        t = min(x, y);\n        x = max(x, y);\n        t = t / x;\n        return (z.x == 0.0 && z.y == 0.0) ? 0.0 : x * sqrt(1.0 + t * t);\n    }\n\n    void main(void) {\n        vec2 coords = vec2(vTextureCoord.s, vTextureCoord.t);\n        if (uReplaceableType == 0.) {\n            gl_FragColor = texture2D(uSampler, coords);\n        } else if (uReplaceableType == 1.) {\n            gl_FragColor = vec4(uReplaceableColor, 1.0);\n        } else if (uReplaceableType == 2.) {\n            float dist = hypot(coords - vec2(0.5, 0.5)) * 2.;\n            float truncateDist = clamp(1. - dist * 1.4, 0., 1.);\n            float alpha = sin(truncateDist);\n            gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);\n        }\n        gl_FragColor *= vColor;\n        \n        if (gl_FragColor[3] < uDiscardAlphaLevel) {\n            discard;\n        }\n    }\n";
var DISCARD_ALPHA_KEY_LEVEL = 0.83;
var DISCARD_MODULATE_LEVEL = 0.01;
var ParticlesController = (function () {
    function ParticlesController(interp, rendererData) {
        this.interp = interp;
        this.rendererData = rendererData;
        this.emitters = [];
        if (rendererData.model.ParticleEmitters2.length) {
            this.particleBaseVectors = [
                gl_matrix_1.vec3.create(),
                gl_matrix_1.vec3.create(),
                gl_matrix_1.vec3.create(),
                gl_matrix_1.vec3.create()
            ];
            for (var _i = 0, _a = rendererData.model.ParticleEmitters2; _i < _a.length; _i++) {
                var particleEmitter = _a[_i];
                var emitter = {
                    emission: 0,
                    squirtFrame: 0,
                    particles: [],
                    props: particleEmitter,
                    capacity: 0,
                    baseCapacity: 0,
                    type: particleEmitter.FrameFlags,
                    tailVertices: null,
                    tailVertexBuffer: null,
                    headVertices: null,
                    headVertexBuffer: null,
                    tailTexCoords: null,
                    tailTexCoordBuffer: null,
                    headTexCoords: null,
                    headTexCoordBuffer: null,
                    colors: null,
                    colorBuffer: null,
                    indices: null,
                    indexBuffer: null
                };
                emitter.baseCapacity = Math.ceil(modelInterp_1.ModelInterp.maxAnimVectorVal(emitter.props.EmissionRate) * emitter.props.LifeSpan);
                this.emitters.push(emitter);
            }
        }
    }
    ParticlesController.initGL = function (glContext) {
        gl = glContext;
        ParticlesController.initShaders();
    };
    ParticlesController.initShaders = function () {
        var vertex = util_1.getShader(gl, vertexShader, gl.VERTEX_SHADER);
        var fragment = util_1.getShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertex);
        gl.attachShader(shaderProgram, fragment);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        gl.useProgram(shaderProgram);
        shaderProgramLocations.vertexPositionAttribute =
            gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        shaderProgramLocations.textureCoordAttribute =
            gl.getAttribLocation(shaderProgram, 'aTextureCoord');
        shaderProgramLocations.colorAttribute =
            gl.getAttribLocation(shaderProgram, 'aColor');
        shaderProgramLocations.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
        shaderProgramLocations.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        shaderProgramLocations.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');
        shaderProgramLocations.replaceableColorUniform =
            gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        shaderProgramLocations.replaceableTypeUniform =
            gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        shaderProgramLocations.discardAlphaLevelUniform =
            gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
    };
    ParticlesController.updateParticle = function (particle, delta) {
        delta /= 1000;
        particle.lifeSpan -= delta;
        if (particle.lifeSpan <= 0) {
            return;
        }
        particle.speed[2] -= particle.gravity * delta;
        particle.pos[0] += particle.speed[0] * delta;
        particle.pos[1] += particle.speed[1] * delta;
        particle.pos[2] += particle.speed[2] * delta;
    };
    ParticlesController.resizeEmitterBuffers = function (emitter, size) {
        if (size <= emitter.capacity) {
            return;
        }
        size = Math.max(size, emitter.baseCapacity);
        var tailVertices;
        var headVertices;
        var tailTexCoords;
        var headTexCoords;
        if (emitter.type & model_1.ParticleEmitter2FramesFlags.Tail) {
            tailVertices = new Float32Array(size * 4 * 3); // 4 vertices * xyz
            tailTexCoords = new Float32Array(size * 4 * 2); // 4 vertices * xy
        }
        if (emitter.type & model_1.ParticleEmitter2FramesFlags.Head) {
            headVertices = new Float32Array(size * 4 * 3); // 4 vertices * xyz
            headTexCoords = new Float32Array(size * 4 * 2); // 4 vertices * xy
        }
        var colors = new Float32Array(size * 4 * 4); // 4 vertices * rgba
        var indices = new Uint16Array(size * 6); // 4 vertices * 2 triangles
        if (emitter.capacity) {
            indices.set(emitter.indices);
        }
        for (var i = emitter.capacity; i < size; ++i) {
            indices[i * 6] = i * 4;
            indices[i * 6 + 1] = i * 4 + 1;
            indices[i * 6 + 2] = i * 4 + 2;
            indices[i * 6 + 3] = i * 4 + 2;
            indices[i * 6 + 4] = i * 4 + 1;
            indices[i * 6 + 5] = i * 4 + 3;
        }
        if (tailVertices) {
            emitter.tailVertices = tailVertices;
            emitter.tailTexCoords = tailTexCoords;
        }
        if (headVertices) {
            emitter.headVertices = headVertices;
            emitter.headTexCoords = headTexCoords;
        }
        emitter.colors = colors;
        emitter.indices = indices;
        emitter.capacity = size;
        if (!emitter.indexBuffer) {
            if (emitter.type & model_1.ParticleEmitter2FramesFlags.Tail) {
                emitter.tailVertexBuffer = gl.createBuffer();
                emitter.tailTexCoordBuffer = gl.createBuffer();
            }
            if (emitter.type & model_1.ParticleEmitter2FramesFlags.Head) {
                emitter.headVertexBuffer = gl.createBuffer();
                emitter.headTexCoordBuffer = gl.createBuffer();
            }
            emitter.colorBuffer = gl.createBuffer();
            emitter.indexBuffer = gl.createBuffer();
        }
    };
    ParticlesController.prototype.update = function (delta) {
        for (var _i = 0, _a = this.emitters; _i < _a.length; _i++) {
            var emitter = _a[_i];
            this.updateEmitter(emitter, delta);
        }
    };
    ParticlesController.prototype.render = function (mvMatrix, pMatrix) {
        gl.enable(gl.CULL_FACE);
        gl.useProgram(shaderProgram);
        gl.uniformMatrix4fv(shaderProgramLocations.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgramLocations.mvMatrixUniform, false, mvMatrix);
        gl.enableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);
        gl.enableVertexAttribArray(shaderProgramLocations.colorAttribute);
        for (var _i = 0, _a = this.emitters; _i < _a.length; _i++) {
            var emitter = _a[_i];
            if (!emitter.particles.length) {
                continue;
            }
            this.setLayerProps(emitter);
            this.setGeneralBuffers(emitter);
            if (emitter.type & model_1.ParticleEmitter2FramesFlags.Tail) {
                this.renderEmitterType(emitter, model_1.ParticleEmitter2FramesFlags.Tail);
            }
            if (emitter.type & model_1.ParticleEmitter2FramesFlags.Head) {
                this.renderEmitterType(emitter, model_1.ParticleEmitter2FramesFlags.Head);
            }
        }
        gl.disableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.disableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);
        gl.disableVertexAttribArray(shaderProgramLocations.colorAttribute);
    };
    ParticlesController.prototype.updateEmitter = function (emitter, delta) {
        var visibility = this.interp.animVectorVal(emitter.props.Visibility, 1);
        if (visibility > 0) {
            if (emitter.props.Squirt && typeof emitter.props.EmissionRate !== 'number') {
                var interp = this.interp.findKeyframes(emitter.props.EmissionRate);
                if (interp && interp.left && interp.left.Frame !== emitter.squirtFrame) {
                    emitter.squirtFrame = interp.left.Frame;
                    if (interp.left.Vector[0] > 0) {
                        emitter.emission += interp.left.Vector[0] * 1000;
                    }
                }
            }
            else {
                var emissionRate = this.interp.animVectorVal(emitter.props.EmissionRate, 0);
                emitter.emission += emissionRate * delta;
            }
            while (emitter.emission >= 1000) {
                emitter.emission -= 1000;
                emitter.particles.push(this.createParticle(emitter, this.rendererData.nodes[emitter.props.ObjectId].matrix));
            }
        }
        if (emitter.particles.length) {
            var updatedParticles = [];
            for (var _i = 0, _a = emitter.particles; _i < _a.length; _i++) {
                var particle = _a[_i];
                ParticlesController.updateParticle(particle, delta);
                if (particle.lifeSpan > 0) {
                    updatedParticles.push(particle);
                }
                else {
                    particleStorage.push(particle);
                }
            }
            emitter.particles = updatedParticles;
            if (emitter.type & model_1.ParticleEmitter2FramesFlags.Head) {
                if (emitter.props.Flags & model_1.ParticleEmitter2Flags.XYQuad) {
                    gl_matrix_1.vec3.set(this.particleBaseVectors[0], -1, 1, 0);
                    gl_matrix_1.vec3.set(this.particleBaseVectors[1], -1, -1, 0);
                    gl_matrix_1.vec3.set(this.particleBaseVectors[2], 1, 1, 0);
                    gl_matrix_1.vec3.set(this.particleBaseVectors[3], 1, -1, 0);
                }
                else {
                    gl_matrix_1.vec3.set(this.particleBaseVectors[0], 0, -1, 1);
                    gl_matrix_1.vec3.set(this.particleBaseVectors[1], 0, -1, -1);
                    gl_matrix_1.vec3.set(this.particleBaseVectors[2], 0, 1, 1);
                    gl_matrix_1.vec3.set(this.particleBaseVectors[3], 0, 1, -1);
                    for (var i = 0; i < 4; ++i) {
                        gl_matrix_1.vec3.transformQuat(this.particleBaseVectors[i], this.particleBaseVectors[i], this.rendererData.cameraQuat);
                    }
                }
            }
            ParticlesController.resizeEmitterBuffers(emitter, emitter.particles.length);
            for (var i = 0; i < emitter.particles.length; ++i) {
                this.updateParticleBuffers(emitter.particles[i], i, emitter);
            }
        }
    };
    ParticlesController.prototype.createParticle = function (emitter, emitterMatrix) {
        var particle;
        if (particleStorage.length) {
            particle = particleStorage.pop();
        }
        else {
            particle = {
                emitter: null,
                pos: gl_matrix_1.vec3.create(),
                angle: 0,
                speed: gl_matrix_1.vec3.create(),
                gravity: null,
                lifeSpan: null
            };
        }
        var width = this.interp.animVectorVal(emitter.props.Width, 0);
        var length = this.interp.animVectorVal(emitter.props.Length, 0);
        var speedScale = this.interp.animVectorVal(emitter.props.Speed, 0);
        var variation = this.interp.animVectorVal(emitter.props.Variation, 0);
        var latitude = util_1.degToRad(this.interp.animVectorVal(emitter.props.Latitude, 0));
        particle.emitter = emitter;
        particle.pos[0] = emitter.props.PivotPoint[0] + util_1.rand(-width, width);
        particle.pos[1] = emitter.props.PivotPoint[1] + util_1.rand(-length, length);
        particle.pos[2] = emitter.props.PivotPoint[2];
        gl_matrix_1.vec3.transformMat4(particle.pos, particle.pos, emitterMatrix);
        if (variation > 0) {
            speedScale *= 1 + util_1.rand(-variation, variation);
        }
        gl_matrix_1.vec3.set(particle.speed, 0, 0, speedScale);
        particle.angle = util_1.rand(0, Math.PI * 2);
        gl_matrix_1.vec3.rotateY(particle.speed, particle.speed, rotateCenter, util_1.rand(0, latitude));
        gl_matrix_1.vec3.rotateZ(particle.speed, particle.speed, rotateCenter, particle.angle);
        if (emitter.props.Flags & model_1.ParticleEmitter2Flags.LineEmitter) {
            particle.speed[0] = 0;
        }
        gl_matrix_1.vec3.transformMat4(particle.speed, particle.speed, emitterMatrix);
        // minus translation of emitterMatrix
        particle.speed[0] -= emitterMatrix[12];
        particle.speed[1] -= emitterMatrix[13];
        particle.speed[2] -= emitterMatrix[14];
        particle.gravity = this.interp.animVectorVal(emitter.props.Gravity, 0);
        particle.lifeSpan = emitter.props.LifeSpan;
        return particle;
    };
    ParticlesController.prototype.updateParticleBuffers = function (particle, index, emitter) {
        var globalT = 1 - particle.lifeSpan / emitter.props.LifeSpan;
        var firstHalf = globalT < emitter.props.Time;
        var t;
        if (firstHalf) {
            t = globalT / emitter.props.Time;
        }
        else {
            t = (globalT - emitter.props.Time) / (1 - emitter.props.Time);
        }
        this.updateParticleVertices(particle, index, emitter, firstHalf, t);
        this.updateParticleTexCoords(index, emitter, firstHalf, t);
        this.updateParticleColor(index, emitter, firstHalf, t);
    };
    ParticlesController.prototype.updateParticleVertices = function (particle, index, emitter, firstHalf, t) {
        var firstScale;
        var secondScale;
        var scale;
        if (firstHalf) {
            firstScale = emitter.props.ParticleScaling[0];
            secondScale = emitter.props.ParticleScaling[1];
        }
        else {
            firstScale = emitter.props.ParticleScaling[1];
            secondScale = emitter.props.ParticleScaling[2];
        }
        scale = interp_1.lerp(firstScale, secondScale, t);
        if (emitter.type & model_1.ParticleEmitter2FramesFlags.Head) {
            for (var i = 0; i < 4; ++i) {
                emitter.headVertices[index * 12 + i * 3] = this.particleBaseVectors[i][0] * scale;
                emitter.headVertices[index * 12 + i * 3 + 1] = this.particleBaseVectors[i][1] * scale;
                emitter.headVertices[index * 12 + i * 3 + 2] = this.particleBaseVectors[i][2] * scale;
                if (emitter.props.Flags & model_1.ParticleEmitter2Flags.XYQuad) {
                    var x = emitter.headVertices[index * 12 + i * 3];
                    var y = emitter.headVertices[index * 12 + i * 3 + 1];
                    emitter.headVertices[index * 12 + i * 3] = x * Math.cos(particle.angle) -
                        y * Math.sin(particle.angle);
                    emitter.headVertices[index * 12 + i * 3 + 1] = x * Math.sin(particle.angle) +
                        y * Math.cos(particle.angle);
                }
            }
        }
        if (emitter.type & model_1.ParticleEmitter2FramesFlags.Tail) {
            tailPos[0] = -particle.speed[0] * emitter.props.TailLength;
            tailPos[1] = -particle.speed[1] * emitter.props.TailLength;
            tailPos[2] = -particle.speed[2] * emitter.props.TailLength;
            gl_matrix_1.vec3.cross(tailCross, particle.speed, this.rendererData.cameraPos);
            gl_matrix_1.vec3.normalize(tailCross, tailCross);
            gl_matrix_1.vec3.scale(tailCross, tailCross, scale);
            emitter.tailVertices[index * 12] = tailCross[0];
            emitter.tailVertices[index * 12 + 1] = tailCross[1];
            emitter.tailVertices[index * 12 + 2] = tailCross[2];
            emitter.tailVertices[index * 12 + 3] = -tailCross[0];
            emitter.tailVertices[index * 12 + 3 + 1] = -tailCross[1];
            emitter.tailVertices[index * 12 + 3 + 2] = -tailCross[2];
            emitter.tailVertices[index * 12 + 2 * 3] = tailCross[0] + tailPos[0];
            emitter.tailVertices[index * 12 + 2 * 3 + 1] = tailCross[1] + tailPos[1];
            emitter.tailVertices[index * 12 + 2 * 3 + 2] = tailCross[2] + tailPos[2];
            emitter.tailVertices[index * 12 + 3 * 3] = -tailCross[0] + tailPos[0];
            emitter.tailVertices[index * 12 + 3 * 3 + 1] = -tailCross[1] + tailPos[1];
            emitter.tailVertices[index * 12 + 3 * 3 + 2] = -tailCross[2] + tailPos[2];
        }
        for (var i = 0; i < 4; ++i) {
            if (emitter.headVertices) {
                emitter.headVertices[index * 12 + i * 3] += particle.pos[0];
                emitter.headVertices[index * 12 + i * 3 + 1] += particle.pos[1];
                emitter.headVertices[index * 12 + i * 3 + 2] += particle.pos[2];
            }
            if (emitter.tailVertices) {
                emitter.tailVertices[index * 12 + i * 3] += particle.pos[0];
                emitter.tailVertices[index * 12 + i * 3 + 1] += particle.pos[1];
                emitter.tailVertices[index * 12 + i * 3 + 2] += particle.pos[2];
            }
        }
    };
    ParticlesController.prototype.updateParticleTexCoords = function (index, emitter, firstHalf, t) {
        if (emitter.type & model_1.ParticleEmitter2FramesFlags.Head) {
            this.updateParticleTexCoordsByType(index, emitter, firstHalf, t, model_1.ParticleEmitter2FramesFlags.Head);
        }
        if (emitter.type & model_1.ParticleEmitter2FramesFlags.Tail) {
            this.updateParticleTexCoordsByType(index, emitter, firstHalf, t, model_1.ParticleEmitter2FramesFlags.Tail);
        }
    };
    ParticlesController.prototype.updateParticleTexCoordsByType = function (index, emitter, firstHalf, t, type) {
        var uvAnim;
        var texCoords;
        if (type === model_1.ParticleEmitter2FramesFlags.Tail) {
            uvAnim = firstHalf ? emitter.props.TailUVAnim : emitter.props.TailDecayUVAnim;
            texCoords = emitter.tailTexCoords;
        }
        else {
            uvAnim = firstHalf ? emitter.props.LifeSpanUVAnim : emitter.props.DecayUVAnim;
            texCoords = emitter.headTexCoords;
        }
        var firstFrame = uvAnim[0];
        var secondFrame = uvAnim[1];
        var frame = Math.round(interp_1.lerp(firstFrame, secondFrame, t));
        var texCoordX = frame % emitter.props.Columns;
        var texCoordY = Math.floor(frame / emitter.props.Rows);
        var cellWidth = 1 / emitter.props.Columns;
        var cellHeight = 1 / emitter.props.Rows;
        texCoords[index * 8] = texCoordX * cellWidth;
        texCoords[index * 8 + 1] = texCoordY * cellHeight;
        texCoords[index * 8 + 2] = texCoordX * cellWidth;
        texCoords[index * 8 + 3] = (1 + texCoordY) * cellHeight;
        texCoords[index * 8 + 4] = (1 + texCoordX) * cellWidth;
        texCoords[index * 8 + 5] = texCoordY * cellHeight;
        texCoords[index * 8 + 6] = (1 + texCoordX) * cellWidth;
        texCoords[index * 8 + 7] = (1 + texCoordY) * cellHeight;
    };
    ParticlesController.prototype.updateParticleColor = function (index, emitter, firstHalf, t) {
        if (firstHalf) {
            firstColor[0] = emitter.props.SegmentColor[0][0];
            firstColor[1] = emitter.props.SegmentColor[0][1];
            firstColor[2] = emitter.props.SegmentColor[0][2];
            firstColor[3] = emitter.props.Alpha[0] / 255;
            secondColor[0] = emitter.props.SegmentColor[1][0];
            secondColor[1] = emitter.props.SegmentColor[1][1];
            secondColor[2] = emitter.props.SegmentColor[1][2];
            secondColor[3] = emitter.props.Alpha[1] / 255;
        }
        else {
            firstColor[0] = emitter.props.SegmentColor[1][0];
            firstColor[1] = emitter.props.SegmentColor[1][1];
            firstColor[2] = emitter.props.SegmentColor[1][2];
            firstColor[3] = emitter.props.Alpha[1] / 255;
            secondColor[0] = emitter.props.SegmentColor[2][0];
            secondColor[1] = emitter.props.SegmentColor[2][1];
            secondColor[2] = emitter.props.SegmentColor[2][2];
            secondColor[3] = emitter.props.Alpha[2] / 255;
        }
        gl_matrix_1.vec4.lerp(color, firstColor, secondColor, t);
        for (var i = 0; i < 4; ++i) {
            emitter.colors[index * 16 + i * 4] = color[0];
            emitter.colors[index * 16 + i * 4 + 1] = color[1];
            emitter.colors[index * 16 + i * 4 + 2] = color[2];
            emitter.colors[index * 16 + i * 4 + 3] = color[3];
        }
    };
    ParticlesController.prototype.setLayerProps = function (emitter) {
        if (emitter.props.FilterMode === model_1.ParticleEmitter2FilterMode.AlphaKey) {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, DISCARD_ALPHA_KEY_LEVEL);
        }
        else if (emitter.props.FilterMode === model_1.ParticleEmitter2FilterMode.Modulate ||
            emitter.props.FilterMode === model_1.ParticleEmitter2FilterMode.Modulate2x) {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, DISCARD_MODULATE_LEVEL);
        }
        else {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, 0.);
        }
        if (emitter.props.FilterMode === model_1.ParticleEmitter2FilterMode.Blend) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);
        }
        else if (emitter.props.FilterMode === model_1.ParticleEmitter2FilterMode.Additive) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false);
        }
        else if (emitter.props.FilterMode === model_1.ParticleEmitter2FilterMode.AlphaKey) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false);
        }
        else if (emitter.props.FilterMode === model_1.ParticleEmitter2FilterMode.Modulate) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ZERO, gl.ONE);
            gl.depthMask(false);
        }
        else if (emitter.props.FilterMode === model_1.ParticleEmitter2FilterMode.Modulate2x) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.DST_COLOR, gl.SRC_COLOR, gl.ZERO, gl.ONE);
            gl.depthMask(false);
        }
        var texture = this.rendererData.model.Textures[emitter.props.TextureID];
        if (texture.Image) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.rendererData.textures[texture.Image]);
            gl.uniform1i(shaderProgramLocations.samplerUniform, 0);
            gl.uniform1f(shaderProgramLocations.replaceableTypeUniform, 0);
        }
        else if (texture.ReplaceableId === 1 || texture.ReplaceableId === 2) {
            gl.uniform3fv(shaderProgramLocations.replaceableColorUniform, this.rendererData.teamColor);
            gl.uniform1f(shaderProgramLocations.replaceableTypeUniform, texture.ReplaceableId);
        }
    };
    ParticlesController.prototype.setGeneralBuffers = function (emitter) {
        gl.bindBuffer(gl.ARRAY_BUFFER, emitter.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, emitter.colors, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(shaderProgramLocations.colorAttribute, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, emitter.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, emitter.indices, gl.DYNAMIC_DRAW);
    };
    ParticlesController.prototype.renderEmitterType = function (emitter, type) {
        if (type === model_1.ParticleEmitter2FramesFlags.Tail) {
            gl.bindBuffer(gl.ARRAY_BUFFER, emitter.tailTexCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, emitter.tailTexCoords, gl.DYNAMIC_DRAW);
        }
        else {
            gl.bindBuffer(gl.ARRAY_BUFFER, emitter.headTexCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, emitter.headTexCoords, gl.DYNAMIC_DRAW);
        }
        gl.vertexAttribPointer(shaderProgramLocations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
        if (type === model_1.ParticleEmitter2FramesFlags.Tail) {
            gl.bindBuffer(gl.ARRAY_BUFFER, emitter.tailVertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, emitter.tailVertices, gl.DYNAMIC_DRAW);
        }
        else {
            gl.bindBuffer(gl.ARRAY_BUFFER, emitter.headVertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, emitter.headVertices, gl.DYNAMIC_DRAW);
        }
        gl.vertexAttribPointer(shaderProgramLocations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.TRIANGLES, emitter.particles.length * 6, gl.UNSIGNED_SHORT, 0);
    };
    return ParticlesController;
}());
exports.ParticlesController = ParticlesController;
//# sourceMappingURL=particles.js.map
},{"../model":2,"./interp":15,"./modelInterp":16,"./util":20,"gl-matrix":3}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var modelInterp_1 = require("./modelInterp");
var model_1 = require("../model");
var gl_matrix_1 = require("gl-matrix");
var gl;
var shaderProgram;
var shaderProgramLocations = {};
var vertexShader = "\n    attribute vec3 aVertexPosition;\n    attribute vec2 aTextureCoord;\n\n    uniform mat4 uMVMatrix;\n    uniform mat4 uPMatrix;\n\n    varying vec2 vTextureCoord;\n\n    void main(void) {\n        vec4 position = vec4(aVertexPosition, 1.0);\n        gl_Position = uPMatrix * uMVMatrix * position;\n        vTextureCoord = aTextureCoord;\n    }\n";
var fragmentShader = "\n    precision mediump float;\n\n    varying vec2 vTextureCoord;\n\n    uniform sampler2D uSampler;\n    uniform vec3 uReplaceableColor;\n    uniform float uReplaceableType;\n    uniform float uDiscardAlphaLevel;\n    uniform vec4 uColor;\n\n    float hypot (vec2 z) {\n        float t;\n        float x = abs(z.x);\n        float y = abs(z.y);\n        t = min(x, y);\n        x = max(x, y);\n        t = t / x;\n        return (z.x == 0.0 && z.y == 0.0) ? 0.0 : x * sqrt(1.0 + t * t);\n    }\n\n    void main(void) {\n        vec2 coords = vec2(vTextureCoord.s, vTextureCoord.t);\n        if (uReplaceableType == 0.) {\n            gl_FragColor = texture2D(uSampler, coords);\n        } else if (uReplaceableType == 1.) {\n            gl_FragColor = vec4(uReplaceableColor, 1.0);\n        } else if (uReplaceableType == 2.) {\n            float dist = hypot(coords - vec2(0.5, 0.5)) * 2.;\n            float truncateDist = clamp(1. - dist * 1.4, 0., 1.);\n            float alpha = sin(truncateDist);\n            gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);\n        }\n        gl_FragColor *= uColor;\n        \n        if (gl_FragColor[3] < uDiscardAlphaLevel) {\n            discard;\n        }\n    }\n";
var RibbonsController = (function () {
    function RibbonsController(interp, rendererData) {
        this.interp = interp;
        this.rendererData = rendererData;
        this.emitters = [];
        if (rendererData.model.RibbonEmitters.length) {
            for (var _i = 0, _a = rendererData.model.RibbonEmitters; _i < _a.length; _i++) {
                var ribbonEmitter = _a[_i];
                var emitter = {
                    emission: 0,
                    props: ribbonEmitter,
                    capacity: 0,
                    baseCapacity: 0,
                    creationTimes: [],
                    vertices: null,
                    vertexBuffer: null,
                    texCoords: null,
                    texCoordBuffer: null
                };
                emitter.baseCapacity = Math.ceil(modelInterp_1.ModelInterp.maxAnimVectorVal(emitter.props.EmissionRate) * emitter.props.LifeSpan) + 1; // extra points
                this.emitters.push(emitter);
            }
        }
    }
    RibbonsController.initGL = function (glContext) {
        gl = glContext;
        RibbonsController.initShaders();
    };
    RibbonsController.initShaders = function () {
        var vertex = util_1.getShader(gl, vertexShader, gl.VERTEX_SHADER);
        var fragment = util_1.getShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertex);
        gl.attachShader(shaderProgram, fragment);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
        gl.useProgram(shaderProgram);
        shaderProgramLocations.vertexPositionAttribute =
            gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        shaderProgramLocations.textureCoordAttribute =
            gl.getAttribLocation(shaderProgram, 'aTextureCoord');
        shaderProgramLocations.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
        shaderProgramLocations.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        shaderProgramLocations.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');
        shaderProgramLocations.replaceableColorUniform =
            gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        shaderProgramLocations.replaceableTypeUniform =
            gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        shaderProgramLocations.discardAlphaLevelUniform =
            gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
        shaderProgramLocations.colorUniform =
            gl.getUniformLocation(shaderProgram, 'uColor');
    };
    RibbonsController.resizeEmitterBuffers = function (emitter, size) {
        if (size <= emitter.capacity) {
            return;
        }
        size = Math.min(size, emitter.baseCapacity);
        var vertices = new Float32Array(size * 2 * 3); // 2 vertices * xyz
        var texCoords = new Float32Array(size * 2 * 2); // 2 vertices * xy
        if (emitter.vertices) {
            vertices.set(emitter.vertices);
        }
        emitter.vertices = vertices;
        emitter.texCoords = texCoords;
        emitter.capacity = size;
        if (!emitter.vertexBuffer) {
            emitter.vertexBuffer = gl.createBuffer();
            emitter.texCoordBuffer = gl.createBuffer();
        }
    };
    RibbonsController.prototype.update = function (delta) {
        for (var _i = 0, _a = this.emitters; _i < _a.length; _i++) {
            var emitter = _a[_i];
            this.updateEmitter(emitter, delta);
        }
    };
    RibbonsController.prototype.render = function (mvMatrix, pMatrix) {
        gl.useProgram(shaderProgram);
        gl.uniformMatrix4fv(shaderProgramLocations.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgramLocations.mvMatrixUniform, false, mvMatrix);
        gl.enableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);
        for (var _i = 0, _a = this.emitters; _i < _a.length; _i++) {
            var emitter = _a[_i];
            if (emitter.creationTimes.length < 2) {
                continue;
            }
            gl.uniform4f(shaderProgramLocations.colorUniform, emitter.props.Color[0], emitter.props.Color[1], emitter.props.Color[2], this.interp.animVectorVal(emitter.props.Alpha, 1));
            this.setGeneralBuffers(emitter);
            var materialID = emitter.props.MaterialID;
            var material = this.rendererData.model.Materials[materialID];
            for (var j = 0; j < material.Layers.length; ++j) {
                this.setLayerProps(material.Layers[j], this.rendererData.materialLayerTextureID[materialID][j]);
                this.renderEmitter(emitter);
            }
        }
        gl.disableVertexAttribArray(shaderProgramLocations.vertexPositionAttribute);
        gl.disableVertexAttribArray(shaderProgramLocations.textureCoordAttribute);
    };
    RibbonsController.prototype.updateEmitter = function (emitter, delta) {
        var now = Date.now();
        var visibility = this.interp.animVectorVal(emitter.props.Visibility, 1);
        if (visibility > 0) {
            var emissionRate = emitter.props.EmissionRate;
            emitter.emission += emissionRate * delta;
            if (emitter.emission >= 1000) {
                // only once per tick
                emitter.emission = emitter.emission % 1000;
                if (emitter.creationTimes.length + 1 > emitter.capacity) {
                    RibbonsController.resizeEmitterBuffers(emitter, emitter.creationTimes.length + 1);
                }
                this.appendVertices(emitter);
                emitter.creationTimes.push(now);
            }
        }
        if (emitter.creationTimes.length) {
            while (emitter.creationTimes[0] + emitter.props.LifeSpan * 1000 < now) {
                emitter.creationTimes.shift();
                for (var i = 0; i + 6 + 5 < emitter.vertices.length; i += 6) {
                    emitter.vertices[i] = emitter.vertices[i + 6];
                    emitter.vertices[i + 1] = emitter.vertices[i + 7];
                    emitter.vertices[i + 2] = emitter.vertices[i + 8];
                    emitter.vertices[i + 3] = emitter.vertices[i + 9];
                    emitter.vertices[i + 4] = emitter.vertices[i + 10];
                    emitter.vertices[i + 5] = emitter.vertices[i + 11];
                }
            }
        }
        // still exists
        if (emitter.creationTimes.length) {
            this.updateEmitterTexCoords(emitter, now);
        }
    };
    RibbonsController.prototype.appendVertices = function (emitter) {
        var first = gl_matrix_1.vec3.clone(emitter.props.PivotPoint);
        var second = gl_matrix_1.vec3.clone(emitter.props.PivotPoint);
        first[1] -= this.interp.animVectorVal(emitter.props.HeightBelow, 0);
        second[1] += this.interp.animVectorVal(emitter.props.HeightAbove, 0);
        var emitterMatrix = this.rendererData.nodes[emitter.props.ObjectId].matrix;
        gl_matrix_1.vec3.transformMat4(first, first, emitterMatrix);
        gl_matrix_1.vec3.transformMat4(second, second, emitterMatrix);
        var currentSize = emitter.creationTimes.length;
        emitter.vertices[currentSize * 6] = first[0];
        emitter.vertices[currentSize * 6 + 1] = first[1];
        emitter.vertices[currentSize * 6 + 2] = first[2];
        emitter.vertices[currentSize * 6 + 3] = second[0];
        emitter.vertices[currentSize * 6 + 4] = second[1];
        emitter.vertices[currentSize * 6 + 5] = second[2];
    };
    RibbonsController.prototype.updateEmitterTexCoords = function (emitter, now) {
        for (var i = 0; i < emitter.creationTimes.length; ++i) {
            var relativePos = (now - emitter.creationTimes[i]) / (emitter.props.LifeSpan * 1000);
            var textureSlot = this.interp.animVectorVal(emitter.props.TextureSlot, 0);
            var texCoordX = textureSlot % emitter.props.Columns;
            var texCoordY = Math.floor(textureSlot / emitter.props.Rows);
            var cellWidth = 1 / emitter.props.Columns;
            var cellHeight = 1 / emitter.props.Rows;
            relativePos = texCoordX * cellWidth + relativePos * cellWidth;
            emitter.texCoords[i * 2 * 2] = relativePos;
            emitter.texCoords[i * 2 * 2 + 1] = texCoordY * cellHeight;
            emitter.texCoords[i * 2 * 2 + 2] = relativePos;
            emitter.texCoords[i * 2 * 2 + 3] = (1 + texCoordY) * cellHeight;
        }
    };
    RibbonsController.prototype.setLayerProps = function (layer, textureID) {
        var texture = this.rendererData.model.Textures[textureID];
        if (layer.Shading & model_1.LayerShading.TwoSided) {
            gl.disable(gl.CULL_FACE);
        }
        else {
            gl.enable(gl.CULL_FACE);
        }
        if (layer.FilterMode === model_1.FilterMode.Transparent) {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, 0.75);
        }
        else {
            gl.uniform1f(shaderProgramLocations.discardAlphaLevelUniform, 0.);
        }
        if (layer.FilterMode === model_1.FilterMode.None) {
            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(true);
        }
        else if (layer.FilterMode === model_1.FilterMode.Transparent) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(true);
        }
        else if (layer.FilterMode === model_1.FilterMode.Blend) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);
        }
        else if (layer.FilterMode === model_1.FilterMode.Additive) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_COLOR, gl.ONE);
            gl.depthMask(false);
        }
        else if (layer.FilterMode === model_1.FilterMode.AddAlpha) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false);
        }
        else if (layer.FilterMode === model_1.FilterMode.Modulate) {
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ZERO, gl.ONE);
            gl.depthMask(false);
        }
        else if (layer.FilterMode === model_1.FilterMode.Modulate2x) {
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
        }
        else if (texture.ReplaceableId === 1 || texture.ReplaceableId === 2) {
            gl.uniform3fv(shaderProgramLocations.replaceableColorUniform, this.rendererData.teamColor);
            gl.uniform1f(shaderProgramLocations.replaceableTypeUniform, texture.ReplaceableId);
        }
        if (layer.Shading & model_1.LayerShading.NoDepthTest) {
            gl.disable(gl.DEPTH_TEST);
        }
        if (layer.Shading & model_1.LayerShading.NoDepthSet) {
            gl.depthMask(false);
        }
        /*if (typeof layer.TVertexAnimId === 'number') {
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
        }*/
    };
    RibbonsController.prototype.setGeneralBuffers = function (emitter) {
        gl.bindBuffer(gl.ARRAY_BUFFER, emitter.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, emitter.texCoords, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(shaderProgramLocations.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, emitter.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, emitter.vertices, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(shaderProgramLocations.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    };
    RibbonsController.prototype.renderEmitter = function (emitter) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, emitter.creationTimes.length * 2);
    };
    return RibbonsController;
}());
exports.RibbonsController = RibbonsController;
//# sourceMappingURL=ribbons.js.map
},{"../model":2,"./modelInterp":16,"./util":20,"gl-matrix":3}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function mat4fromRotationOrigin(out, rotation, origin) {
    var x = rotation[0], y = rotation[1], z = rotation[2], w = rotation[3], x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2, ox = origin[0], oy = origin[1], oz = origin[2];
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
exports.mat4fromRotationOrigin = mat4fromRotationOrigin;
/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function vec3RotateZ(out, a, c) {
    out[0] = a[0] * Math.cos(c) - a[1] * Math.sin(c);
    out[1] = a[0] * Math.sin(c) + a[1] * Math.cos(c);
    out[2] = a[2];
    return out;
}
exports.vec3RotateZ = vec3RotateZ;
function rand(from, to) {
    return from + Math.random() * (to - from);
}
exports.rand = rand;
function degToRad(angle) {
    return angle * Math.PI / 180;
}
exports.degToRad = degToRad;
function getShader(gl, source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
exports.getShader = getShader;
//# sourceMappingURL=util.js.map
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImRvY3MvcHJldmlldy9wcmV2aWV3LmpzIiwibW9kZWwuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXguanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvY29tbW9uLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L21hdDIuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvbWF0MmQuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvbWF0My5qcyIsIm5vZGVfbW9kdWxlcy9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQ0LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3F1YXQuanMiLCJub2RlX21vZHVsZXMvZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvdmVjMi5qcyIsIm5vZGVfbW9kdWxlcy9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC92ZWMzLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3ZlYzQuanMiLCJwYXJzZXJzL21kbC5qcyIsInBhcnNlcnMvbWR4LmpzIiwicmVuZGVyZXIvaW50ZXJwLmpzIiwicmVuZGVyZXIvbW9kZWxJbnRlcnAuanMiLCJyZW5kZXJlci9tb2RlbFJlbmRlcmVyLmpzIiwicmVuZGVyZXIvcGFydGljbGVzLmpzIiwicmVuZGVyZXIvcmliYm9ucy5qcyIsInJlbmRlcmVyL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9XQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxdUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2tCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6d0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ptQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9SQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbWRsXzEgPSByZXF1aXJlKFwiLi4vLi4vcGFyc2Vycy9tZGxcIik7XG52YXIgbWR4XzEgPSByZXF1aXJlKFwiLi4vLi4vcGFyc2Vycy9tZHhcIik7XG52YXIgZ2xfbWF0cml4XzEgPSByZXF1aXJlKFwiZ2wtbWF0cml4XCIpO1xudmFyIG1vZGVsUmVuZGVyZXJfMSA9IHJlcXVpcmUoXCIuLi8uLi9yZW5kZXJlci9tb2RlbFJlbmRlcmVyXCIpO1xudmFyIHV0aWxfMSA9IHJlcXVpcmUoXCIuLi8uLi9yZW5kZXJlci91dGlsXCIpO1xudmFyIG1vZGVsO1xudmFyIG1vZGVsUmVuZGVyZXI7XG52YXIgY2FudmFzO1xudmFyIGdsO1xudmFyIHBNYXRyaXggPSBnbF9tYXRyaXhfMS5tYXQ0LmNyZWF0ZSgpO1xudmFyIG12TWF0cml4ID0gZ2xfbWF0cml4XzEubWF0NC5jcmVhdGUoKTtcbnZhciBsb2FkZWRUZXh0dXJlcyA9IDA7XG52YXIgdG90YWxUZXh0dXJlcyA9IDA7XG52YXIgY2FtZXJhVGhldGEgPSBNYXRoLlBJIC8gNDtcbnZhciBjYW1lcmFQaGkgPSAwO1xudmFyIGNhbWVyYURpc3RhbmNlID0gNTAwO1xudmFyIGNhbWVyYVRhcmdldFogPSA1MDtcbnZhciBjYW1lcmFCYXNlUG9zID0gZ2xfbWF0cml4XzEudmVjMy5jcmVhdGUoKTtcbnZhciBjYW1lcmFQb3MgPSBnbF9tYXRyaXhfMS52ZWMzLmNyZWF0ZSgpO1xudmFyIGNhbWVyYVRhcmdldCA9IGdsX21hdHJpeF8xLnZlYzMuY3JlYXRlKCk7XG52YXIgY2FtZXJhVXAgPSBnbF9tYXRyaXhfMS52ZWMzLmZyb21WYWx1ZXMoMCwgMCwgMSk7XG52YXIgY2FtZXJhUXVhdCA9IGdsX21hdHJpeF8xLnF1YXQuY3JlYXRlKCk7XG52YXIgc3RhcnQ7XG5mdW5jdGlvbiB1cGRhdGVNb2RlbCh0aW1lc3RhbXApIHtcbiAgICBpZiAoIXN0YXJ0KSB7XG4gICAgICAgIHN0YXJ0ID0gdGltZXN0YW1wO1xuICAgIH1cbiAgICB2YXIgZGVsdGEgPSB0aW1lc3RhbXAgLSBzdGFydDtcbiAgICAvLyBkZWx0YSAvPSAxMDtcbiAgICBzdGFydCA9IHRpbWVzdGFtcDtcbiAgICBtb2RlbFJlbmRlcmVyLnVwZGF0ZShkZWx0YSk7XG59XG5mdW5jdGlvbiBpbml0R0woKSB7XG4gICAgaWYgKGdsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XG4gICAgICAgIGdsLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMS4wKTtcbiAgICAgICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICBnbC5kZXB0aEZ1bmMoZ2wuTEVRVUFMKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBhbGVydChlcnIpO1xuICAgIH1cbn1cbnZhciBjYW1lcmFQb3NQcm9qZWN0ZWQgPSBnbF9tYXRyaXhfMS52ZWMzLmNyZWF0ZSgpO1xudmFyIHZlcnRpY2FsUXVhdCA9IGdsX21hdHJpeF8xLnF1YXQuY3JlYXRlKCk7XG52YXIgZnJvbUNhbWVyYUJhc2VWZWMgPSBnbF9tYXRyaXhfMS52ZWMzLmZyb21WYWx1ZXMoMSwgMCwgMCk7XG5mdW5jdGlvbiBjYWxjQ2FtZXJhUXVhdCgpIHtcbiAgICBnbF9tYXRyaXhfMS52ZWMzLnNldChjYW1lcmFQb3NQcm9qZWN0ZWQsIGNhbWVyYVBvc1swXSwgY2FtZXJhUG9zWzFdLCAwKTtcbiAgICBnbF9tYXRyaXhfMS52ZWMzLnN1YnRyYWN0KGNhbWVyYVBvcywgY2FtZXJhUG9zLCBjYW1lcmFUYXJnZXQpO1xuICAgIGdsX21hdHJpeF8xLnZlYzMubm9ybWFsaXplKGNhbWVyYVBvc1Byb2plY3RlZCwgY2FtZXJhUG9zUHJvamVjdGVkKTtcbiAgICBnbF9tYXRyaXhfMS52ZWMzLm5vcm1hbGl6ZShjYW1lcmFQb3MsIGNhbWVyYVBvcyk7XG4gICAgZ2xfbWF0cml4XzEucXVhdC5yb3RhdGlvblRvKGNhbWVyYVF1YXQsIGZyb21DYW1lcmFCYXNlVmVjLCBjYW1lcmFQb3NQcm9qZWN0ZWQpO1xuICAgIGdsX21hdHJpeF8xLnF1YXQucm90YXRpb25Ubyh2ZXJ0aWNhbFF1YXQsIGNhbWVyYVBvc1Byb2plY3RlZCwgY2FtZXJhUG9zKTtcbiAgICBnbF9tYXRyaXhfMS5xdWF0Lm11bChjYW1lcmFRdWF0LCB2ZXJ0aWNhbFF1YXQsIGNhbWVyYVF1YXQpO1xufVxuZnVuY3Rpb24gZHJhd1NjZW5lKCkge1xuICAgIGdsLnZpZXdwb3J0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgZ2wuZGVwdGhNYXNrKHRydWUpO1xuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICBnbF9tYXRyaXhfMS5tYXQ0LnBlcnNwZWN0aXZlKHBNYXRyaXgsIE1hdGguUEkgLyA0LCBjYW52YXMud2lkdGggLyBjYW52YXMuaGVpZ2h0LCAwLjEsIDEwMDAwLjApO1xuICAgIGdsX21hdHJpeF8xLnZlYzMuc2V0KGNhbWVyYUJhc2VQb3MsIE1hdGguY29zKGNhbWVyYVRoZXRhKSAqIE1hdGguY29zKGNhbWVyYVBoaSkgKiBjYW1lcmFEaXN0YW5jZSwgTWF0aC5jb3MoY2FtZXJhVGhldGEpICogTWF0aC5zaW4oY2FtZXJhUGhpKSAqIGNhbWVyYURpc3RhbmNlLCBNYXRoLnNpbihjYW1lcmFUaGV0YSkgKiBjYW1lcmFEaXN0YW5jZSk7XG4gICAgY2FtZXJhVGFyZ2V0WzJdID0gY2FtZXJhVGFyZ2V0WjtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmVcbiAgICB1dGlsXzEudmVjM1JvdGF0ZVooY2FtZXJhUG9zLCBjYW1lcmFCYXNlUG9zLCB3aW5kb3dbJ2FuZ2xlJ10gfHwgMCk7XG4gICAgZ2xfbWF0cml4XzEubWF0NC5sb29rQXQobXZNYXRyaXgsIGNhbWVyYVBvcywgY2FtZXJhVGFyZ2V0LCBjYW1lcmFVcCk7XG4gICAgY2FsY0NhbWVyYVF1YXQoKTtcbiAgICBtb2RlbFJlbmRlcmVyLnNldENhbWVyYShjYW1lcmFQb3MsIGNhbWVyYVF1YXQpO1xuICAgIG1vZGVsUmVuZGVyZXIucmVuZGVyKG12TWF0cml4LCBwTWF0cml4KTtcbn1cbmZ1bmN0aW9uIHRpY2sodGltZXN0YW1wKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgIHVwZGF0ZU1vZGVsKHRpbWVzdGFtcCk7XG4gICAgZHJhd1NjZW5lKCk7XG59XG5mdW5jdGlvbiBsb2FkVGV4dHVyZShzcmMsIHRleHR1cmVOYW1lLCBmbGFncykge1xuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2RlbFJlbmRlcmVyLnNldFRleHR1cmUodGV4dHVyZU5hbWUsIGltZywgZmxhZ3MpO1xuICAgICAgICBpZiAoKytsb2FkZWRUZXh0dXJlcyA9PT0gdG90YWxUZXh0dXJlcykge1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBpbWcuc3JjID0gc3JjO1xufVxuZnVuY3Rpb24gcGFyc2VNb2RlbChpc0JpbmFyeSwgeGhyKSB7XG4gICAgaWYgKGlzQmluYXJ5KSB7XG4gICAgICAgIHJldHVybiBtZHhfMS5wYXJzZSh4aHIucmVzcG9uc2UpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG1kbF8xLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHByb2Nlc3NNb2RlbExvYWRpbmcoKSB7XG4gICAgY29uc29sZS5sb2cobW9kZWwpO1xuICAgIGxvYWRlZFRleHR1cmVzID0gdG90YWxUZXh0dXJlcyA9IDA7XG4gICAgbW9kZWxSZW5kZXJlciA9IG5ldyBtb2RlbFJlbmRlcmVyXzEuTW9kZWxSZW5kZXJlcihtb2RlbCk7XG4gICAgaW5pdEdMKCk7XG4gICAgbW9kZWxSZW5kZXJlci5pbml0R0woZ2wpO1xuICAgIHNldEFuaW1hdGlvbkxpc3QoKTtcbn1cbmZ1bmN0aW9uIHNldFNhbXBsZVRleHR1cmVzKCkge1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5UZXh0dXJlczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIHRleHR1cmUgPSBfYVtfaV07XG4gICAgICAgIGlmICh0ZXh0dXJlLkltYWdlKSB7XG4gICAgICAgICAgICArK3RvdGFsVGV4dHVyZXM7XG4gICAgICAgICAgICBsb2FkVGV4dHVyZSh0ZXh0dXJlLkltYWdlLCB0ZXh0dXJlLkltYWdlLCB0ZXh0dXJlLkZsYWdzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNldEVtcHR5VGV4dHVyZXMoKSB7XG4gICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IG1vZGVsLlRleHR1cmVzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgdGV4dHVyZSA9IF9hW19pXTtcbiAgICAgICAgaWYgKHRleHR1cmUuSW1hZ2UpIHtcbiAgICAgICAgICAgICsrdG90YWxUZXh0dXJlcztcbiAgICAgICAgICAgIGxvYWRUZXh0dXJlKCdwcmV2aWV3L2VtcHR5LnBuZycsIHRleHR1cmUuSW1hZ2UsIDApO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gbG9hZE1vZGVsKCkge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB2YXIgZmlsZSA9ICdwcmV2aWV3L0Zvb3RtYW4ubWRsJztcbiAgICB2YXIgaXNCaW5hcnkgPSBmaWxlLmluZGV4T2YoJy5tZHgnKSA+IC0xO1xuICAgIGlmIChpc0JpbmFyeSkge1xuICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcbiAgICB9XG4gICAgeGhyLm9wZW4oJ0dFVCcsIGZpbGUsIHRydWUpO1xuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDAgJiYgeGhyLnJlYWR5U3RhdGUgPT09IFhNTEh0dHBSZXF1ZXN0LkRPTkUpIHtcbiAgICAgICAgICAgIG1vZGVsID0gcGFyc2VNb2RlbChpc0JpbmFyeSwgeGhyKTtcbiAgICAgICAgICAgIHByb2Nlc3NNb2RlbExvYWRpbmcoKTtcbiAgICAgICAgICAgIHNldFNhbXBsZVRleHR1cmVzKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHhoci5zZW5kKCk7XG59XG5mdW5jdGlvbiBpbml0KCkge1xuICAgIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcbiAgICBpbml0Q29udHJvbHMoKTtcbiAgICBpbml0Q2FtZXJhTW92ZSgpO1xuICAgIGluaXREcmFnRHJvcCgpO1xuICAgIC8vIGxvYWRNb2RlbCgpO1xuICAgIHVwZGF0ZUNhbnZhc1NpemUoKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdXBkYXRlQ2FudmFzU2l6ZSk7XG59XG5mdW5jdGlvbiBpbml0Q29udHJvbHMoKSB7XG4gICAgdmFyIGlucHV0Q29sb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29sb3InKTtcbiAgICBpbnB1dENvbG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdmFsID0gaW5wdXRDb2xvci52YWx1ZS5zbGljZSgxKTtcbiAgICAgICAgdmFyIGFyciA9IGdsX21hdHJpeF8xLnZlYzMuZnJvbVZhbHVlcyhwYXJzZUludCh2YWwuc2xpY2UoMCwgMiksIDE2KSAvIDI1NSwgcGFyc2VJbnQodmFsLnNsaWNlKDIsIDQpLCAxNikgLyAyNTUsIHBhcnNlSW50KHZhbC5zbGljZSg0LCA2KSwgMTYpIC8gMjU1KTtcbiAgICAgICAgbW9kZWxSZW5kZXJlci5zZXRUZWFtQ29sb3IoYXJyKTtcbiAgICB9KTtcbiAgICB2YXIgc2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbGVjdCcpO1xuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9kZWxSZW5kZXJlci5zZXRTZXF1ZW5jZShwYXJzZUludChzZWxlY3QudmFsdWUsIDEwKSk7XG4gICAgfSk7XG4gICAgdmFyIGlucHV0WiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXJnZXRaJyk7XG4gICAgaW5wdXRaLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjYW1lcmFUYXJnZXRaID0gcGFyc2VJbnQoaW5wdXRaLnZhbHVlLCAxMCk7XG4gICAgfSk7XG4gICAgdmFyIGlucHV0RGlzdGFuY2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlzdGFuY2UnKTtcbiAgICBpbnB1dERpc3RhbmNlLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjYW1lcmFEaXN0YW5jZSA9IHBhcnNlSW50KGlucHV0RGlzdGFuY2UudmFsdWUsIDEwKTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGluaXRDYW1lcmFNb3ZlKCkge1xuICAgIHZhciBkb3duID0gZmFsc2U7XG4gICAgdmFyIGRvd25YLCBkb3duWTtcbiAgICBmdW5jdGlvbiBjb29yZHMoZXZlbnQpIHtcbiAgICAgICAgdmFyIGxpc3QgPSAoZXZlbnQuY2hhbmdlZFRvdWNoZXMgJiYgZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoID9cbiAgICAgICAgICAgIGV2ZW50LmNoYW5nZWRUb3VjaGVzIDpcbiAgICAgICAgICAgIGV2ZW50LnRvdWNoZXMpIHx8IFtldmVudF07XG4gICAgICAgIHJldHVybiBbbGlzdFswXS5wYWdlWCwgbGlzdFswXS5wYWdlWV07XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZUNhbWVyYURpc3RhbmNlKGRpc3RhbmNlKSB7XG4gICAgICAgIGNhbWVyYURpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgICAgIGlmIChjYW1lcmFEaXN0YW5jZSA+IDEwMDApIHtcbiAgICAgICAgICAgIGNhbWVyYURpc3RhbmNlID0gMTAwMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FtZXJhRGlzdGFuY2UgPCAxMDApIHtcbiAgICAgICAgICAgIGNhbWVyYURpc3RhbmNlID0gMTAwO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaXN0YW5jZScpLnZhbHVlID0gU3RyaW5nKGNhbWVyYURpc3RhbmNlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcG9pbnRlckRvd24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCAhPT0gY2FudmFzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZG93biA9IHRydWU7XG4gICAgICAgIF9hID0gY29vcmRzKGV2ZW50KSwgZG93blggPSBfYVswXSwgZG93blkgPSBfYVsxXTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwb2ludGVyTW92ZShldmVudCkge1xuICAgICAgICBpZiAoIWRvd24pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQudHlwZSA9PT0gJ3RvdWNobW92ZScpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50LmNoYW5nZWRUb3VjaGVzICYmIGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aCA+IDEgfHxcbiAgICAgICAgICAgIGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIF9hID0gY29vcmRzKGV2ZW50KSwgeCA9IF9hWzBdLCB5ID0gX2FbMV07XG4gICAgICAgIGNhbWVyYVBoaSArPSAtMSAqICh4IC0gZG93blgpICogMC4wMTtcbiAgICAgICAgY2FtZXJhVGhldGEgKz0gKHkgLSBkb3duWSkgKiAwLjAxO1xuICAgICAgICBpZiAoY2FtZXJhVGhldGEgPiBNYXRoLlBJIC8gMiAqIDAuOTgpIHtcbiAgICAgICAgICAgIGNhbWVyYVRoZXRhID0gTWF0aC5QSSAvIDIgKiAwLjk4O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjYW1lcmFUaGV0YSA8IDApIHtcbiAgICAgICAgICAgIGNhbWVyYVRoZXRhID0gMDtcbiAgICAgICAgfVxuICAgICAgICBkb3duWCA9IHg7XG4gICAgICAgIGRvd25ZID0geTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcG9pbnRlclVwKCkge1xuICAgICAgICBkb3duID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHdoZWVsKGV2ZW50KSB7XG4gICAgICAgIHVwZGF0ZUNhbWVyYURpc3RhbmNlKGNhbWVyYURpc3RhbmNlICogKDEgLSBldmVudC5kZWx0YVkgLyAzMCkpO1xuICAgIH1cbiAgICB2YXIgc3RhcnRDYW1lcmFEaXN0YW5jZTtcbiAgICBmdW5jdGlvbiBnZXN0dXJlU3RhcnQoKSB7XG4gICAgICAgIHN0YXJ0Q2FtZXJhRGlzdGFuY2UgPSBjYW1lcmFEaXN0YW5jZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2VzdHVyZUNoYW5nZShldmVudCkge1xuICAgICAgICB1cGRhdGVDYW1lcmFEaXN0YW5jZShzdGFydENhbWVyYURpc3RhbmNlICogKDEgLyBldmVudC5zY2FsZSkpO1xuICAgIH1cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBwb2ludGVyRG93bik7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHBvaW50ZXJEb3duKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBwb2ludGVyTW92ZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgcG9pbnRlck1vdmUpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBwb2ludGVyVXApO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgcG9pbnRlclVwKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHBvaW50ZXJVcCk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB3aGVlbCk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZ2VzdHVyZXN0YXJ0JywgZ2VzdHVyZVN0YXJ0KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdnZXN0dXJlY2hhbmdlJywgZ2VzdHVyZUNoYW5nZSk7XG59XG5mdW5jdGlvbiB1cGRhdGVDYW52YXNTaXplKCkge1xuICAgIHZhciB3aWR0aCA9IGNhbnZhcy5wYXJlbnRFbGVtZW50Lm9mZnNldFdpZHRoO1xuICAgIHZhciBoZWlnaHQgPSBjYW52YXMucGFyZW50RWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgdmFyIGRwciA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDE7XG4gICAgY2FudmFzLndpZHRoID0gd2lkdGggKiBkcHI7XG4gICAgY2FudmFzLmhlaWdodCA9IGhlaWdodCAqIGRwcjtcbn1cbmZ1bmN0aW9uIGVuY29kZShodG1sKSB7XG4gICAgcmV0dXJuIGh0bWwucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbn1cbmZ1bmN0aW9uIHNldEFuaW1hdGlvbkxpc3QoKSB7XG4gICAgdmFyIGxpc3QgPSBtb2RlbC5TZXF1ZW5jZXMubWFwKGZ1bmN0aW9uIChzZXEpIHsgcmV0dXJuIHNlcS5OYW1lOyB9KTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbGlzdCA9IFsnTm9uZSddO1xuICAgIH1cbiAgICB2YXIgc2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbGVjdCcpO1xuICAgIHNlbGVjdC5pbm5lckhUTUwgPSBsaXN0Lm1hcChmdW5jdGlvbiAoaXRlbSwgaW5kZXgpIHsgcmV0dXJuIFwiPG9wdGlvbiB2YWx1ZT1cXFwiXCIgKyBpbmRleCArIFwiXFxcIj5cIiArIGVuY29kZShpdGVtKSArIFwiPC9vcHRpb24+XCI7IH0pLmpvaW4oJycpO1xufVxuZnVuY3Rpb24gc2V0RHJhZ0Ryb3BUZXh0dXJlcygpIHtcbiAgICB2YXIgdGV4dHVyZXNDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZHJhZy10ZXh0dXJlcycpO1xuICAgIHRleHR1cmVzQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5UZXh0dXJlczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIHRleHR1cmUgPSBfYVtfaV07XG4gICAgICAgIGlmICh0ZXh0dXJlLkltYWdlKSB7XG4gICAgICAgICAgICB2YXIgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICByb3cuY2xhc3NOYW1lID0gJ2RyYWcnO1xuICAgICAgICAgICAgcm93LnRleHRDb250ZW50ID0gdGV4dHVyZS5JbWFnZTtcbiAgICAgICAgICAgIHJvdy5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGV4dHVyZScsIHRleHR1cmUuSW1hZ2UpO1xuICAgICAgICAgICAgcm93LnNldEF0dHJpYnV0ZSgnZGF0YS10ZXh0dXJlLWZsYWdzJywgU3RyaW5nKHRleHR1cmUuRmxhZ3MpKTtcbiAgICAgICAgICAgIHRleHR1cmVzQ29udGFpbmVyLmFwcGVuZENoaWxkKHJvdyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBpbml0RHJhZ0Ryb3AoKSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jb250YWluZXInKTtcbiAgICB2YXIgZHJvcFRhcmdldDtcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgZnVuY3Rpb24gb25EcmFnRW50ZXIoZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgaWYgKGRyb3BUYXJnZXQgJiYgZHJvcFRhcmdldCAhPT0gZXZlbnQudGFyZ2V0ICYmIGRyb3BUYXJnZXQuY2xhc3NMaXN0KSB7XG4gICAgICAgICAgICBkcm9wVGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ2RyYWdfaG92ZXJlZCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGFyZ2V0LmNsYXNzTGlzdCkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgZHJvcFRhcmdldCA9IHRhcmdldDtcbiAgICAgICAgaWYgKHRhcmdldCAmJiB0YXJnZXQuY2xhc3NMaXN0ICYmIHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2RyYWcnKSkge1xuICAgICAgICAgICAgdGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2RyYWdfaG92ZXJlZCcpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdjb250YWluZXJfZHJhZycpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCBmdW5jdGlvbiBvbkRyYWdMZWF2ZShldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSBkcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnY29udGFpbmVyX2RyYWcnKTtcbiAgICAgICAgICAgIGlmIChkcm9wVGFyZ2V0ICYmIGRyb3BUYXJnZXQuY2xhc3NMaXN0KSB7XG4gICAgICAgICAgICAgICAgZHJvcFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnX2hvdmVyZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIGZ1bmN0aW9uIG9uRHJhZ0xlYXZlKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ2NvcHknO1xuICAgIH0pO1xuICAgIHZhciBkcm9wTW9kZWwgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgdmFyIGlzTURYID0gZmlsZS5uYW1lLmluZGV4T2YoJy5tZHgnKSA+IC0xO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoaXNNRFgpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwgPSBtZHhfMS5wYXJzZShyZWFkZXIucmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsID0gbWRsXzEucGFyc2UocmVhZGVyLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIC8vIHNob3dFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByb2Nlc3NNb2RlbExvYWRpbmcoKTtcbiAgICAgICAgICAgIHNldEVtcHR5VGV4dHVyZXMoKTtcbiAgICAgICAgICAgIHNldERyYWdEcm9wVGV4dHVyZXMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGlzTURYKSB7XG4gICAgICAgICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIGRyb3BUZXh0dXJlID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciB0ZXh0dXJlTmFtZSA9IGRyb3BUYXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXRleHR1cmUnKTtcbiAgICAgICAgdmFyIHRleHR1cmVGbGFncyA9IE51bWJlcihkcm9wVGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS10ZXh0dXJlLWZsYWdzJykpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBtb2RlbFJlbmRlcmVyLnNldFRleHR1cmUodGV4dHVyZU5hbWUsIGltZywgdGV4dHVyZUZsYWdzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWcuc3JjID0gcmVhZGVyLnJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgfTtcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIGZ1bmN0aW9uIG9uRHJvcChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnY29udGFpbmVyX2RyYWcnKTtcbiAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ2NvbnRhaW5lcl9jdXN0b20nKTtcbiAgICAgICAgaWYgKCFkcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZHJvcFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnX2hvdmVyZWQnKTtcbiAgICAgICAgdmFyIGZpbGUgPSBldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMgJiYgZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzWzBdO1xuICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZHJvcFRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGV4dHVyZScpKSB7XG4gICAgICAgICAgICBkcm9wVGV4dHVyZShmaWxlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRyb3BNb2RlbChmaWxlKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGluaXQpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHJldmlldy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBUZXh0dXJlRmxhZ3M7XG4oZnVuY3Rpb24gKFRleHR1cmVGbGFncykge1xuICAgIFRleHR1cmVGbGFnc1tUZXh0dXJlRmxhZ3NbXCJXcmFwV2lkdGhcIl0gPSAxXSA9IFwiV3JhcFdpZHRoXCI7XG4gICAgVGV4dHVyZUZsYWdzW1RleHR1cmVGbGFnc1tcIldyYXBIZWlnaHRcIl0gPSAyXSA9IFwiV3JhcEhlaWdodFwiO1xufSkoVGV4dHVyZUZsYWdzID0gZXhwb3J0cy5UZXh0dXJlRmxhZ3MgfHwgKGV4cG9ydHMuVGV4dHVyZUZsYWdzID0ge30pKTtcbnZhciBGaWx0ZXJNb2RlO1xuKGZ1bmN0aW9uIChGaWx0ZXJNb2RlKSB7XG4gICAgRmlsdGVyTW9kZVtGaWx0ZXJNb2RlW1wiTm9uZVwiXSA9IDBdID0gXCJOb25lXCI7XG4gICAgRmlsdGVyTW9kZVtGaWx0ZXJNb2RlW1wiVHJhbnNwYXJlbnRcIl0gPSAxXSA9IFwiVHJhbnNwYXJlbnRcIjtcbiAgICBGaWx0ZXJNb2RlW0ZpbHRlck1vZGVbXCJCbGVuZFwiXSA9IDJdID0gXCJCbGVuZFwiO1xuICAgIEZpbHRlck1vZGVbRmlsdGVyTW9kZVtcIkFkZGl0aXZlXCJdID0gM10gPSBcIkFkZGl0aXZlXCI7XG4gICAgRmlsdGVyTW9kZVtGaWx0ZXJNb2RlW1wiQWRkQWxwaGFcIl0gPSA0XSA9IFwiQWRkQWxwaGFcIjtcbiAgICBGaWx0ZXJNb2RlW0ZpbHRlck1vZGVbXCJNb2R1bGF0ZVwiXSA9IDVdID0gXCJNb2R1bGF0ZVwiO1xuICAgIEZpbHRlck1vZGVbRmlsdGVyTW9kZVtcIk1vZHVsYXRlMnhcIl0gPSA2XSA9IFwiTW9kdWxhdGUyeFwiO1xufSkoRmlsdGVyTW9kZSA9IGV4cG9ydHMuRmlsdGVyTW9kZSB8fCAoZXhwb3J0cy5GaWx0ZXJNb2RlID0ge30pKTtcbnZhciBMaW5lVHlwZTtcbihmdW5jdGlvbiAoTGluZVR5cGUpIHtcbiAgICBMaW5lVHlwZVtMaW5lVHlwZVtcIkRvbnRJbnRlcnBcIl0gPSAwXSA9IFwiRG9udEludGVycFwiO1xuICAgIExpbmVUeXBlW0xpbmVUeXBlW1wiTGluZWFyXCJdID0gMV0gPSBcIkxpbmVhclwiO1xuICAgIExpbmVUeXBlW0xpbmVUeXBlW1wiSGVybWl0ZVwiXSA9IDJdID0gXCJIZXJtaXRlXCI7XG4gICAgTGluZVR5cGVbTGluZVR5cGVbXCJCZXppZXJcIl0gPSAzXSA9IFwiQmV6aWVyXCI7XG59KShMaW5lVHlwZSA9IGV4cG9ydHMuTGluZVR5cGUgfHwgKGV4cG9ydHMuTGluZVR5cGUgPSB7fSkpO1xudmFyIExheWVyU2hhZGluZztcbihmdW5jdGlvbiAoTGF5ZXJTaGFkaW5nKSB7XG4gICAgTGF5ZXJTaGFkaW5nW0xheWVyU2hhZGluZ1tcIlVuc2hhZGVkXCJdID0gMV0gPSBcIlVuc2hhZGVkXCI7XG4gICAgTGF5ZXJTaGFkaW5nW0xheWVyU2hhZGluZ1tcIlNwaGVyZUVudk1hcFwiXSA9IDJdID0gXCJTcGhlcmVFbnZNYXBcIjtcbiAgICBMYXllclNoYWRpbmdbTGF5ZXJTaGFkaW5nW1wiVHdvU2lkZWRcIl0gPSAxNl0gPSBcIlR3b1NpZGVkXCI7XG4gICAgTGF5ZXJTaGFkaW5nW0xheWVyU2hhZGluZ1tcIlVuZm9nZ2VkXCJdID0gMzJdID0gXCJVbmZvZ2dlZFwiO1xuICAgIExheWVyU2hhZGluZ1tMYXllclNoYWRpbmdbXCJOb0RlcHRoVGVzdFwiXSA9IDY0XSA9IFwiTm9EZXB0aFRlc3RcIjtcbiAgICBMYXllclNoYWRpbmdbTGF5ZXJTaGFkaW5nW1wiTm9EZXB0aFNldFwiXSA9IDEyOF0gPSBcIk5vRGVwdGhTZXRcIjtcbn0pKExheWVyU2hhZGluZyA9IGV4cG9ydHMuTGF5ZXJTaGFkaW5nIHx8IChleHBvcnRzLkxheWVyU2hhZGluZyA9IHt9KSk7XG52YXIgTWF0ZXJpYWxSZW5kZXJNb2RlO1xuKGZ1bmN0aW9uIChNYXRlcmlhbFJlbmRlck1vZGUpIHtcbiAgICBNYXRlcmlhbFJlbmRlck1vZGVbTWF0ZXJpYWxSZW5kZXJNb2RlW1wiQ29uc3RhbnRDb2xvclwiXSA9IDFdID0gXCJDb25zdGFudENvbG9yXCI7XG4gICAgTWF0ZXJpYWxSZW5kZXJNb2RlW01hdGVyaWFsUmVuZGVyTW9kZVtcIlNvcnRQcmltc0ZhclpcIl0gPSAxNl0gPSBcIlNvcnRQcmltc0ZhclpcIjtcbiAgICBNYXRlcmlhbFJlbmRlck1vZGVbTWF0ZXJpYWxSZW5kZXJNb2RlW1wiRnVsbFJlc29sdXRpb25cIl0gPSAzMl0gPSBcIkZ1bGxSZXNvbHV0aW9uXCI7XG59KShNYXRlcmlhbFJlbmRlck1vZGUgPSBleHBvcnRzLk1hdGVyaWFsUmVuZGVyTW9kZSB8fCAoZXhwb3J0cy5NYXRlcmlhbFJlbmRlck1vZGUgPSB7fSkpO1xudmFyIEdlb3NldEFuaW1GbGFncztcbihmdW5jdGlvbiAoR2Vvc2V0QW5pbUZsYWdzKSB7XG4gICAgR2Vvc2V0QW5pbUZsYWdzW0dlb3NldEFuaW1GbGFnc1tcIkRyb3BTaGFkb3dcIl0gPSAxXSA9IFwiRHJvcFNoYWRvd1wiO1xuICAgIEdlb3NldEFuaW1GbGFnc1tHZW9zZXRBbmltRmxhZ3NbXCJDb2xvclwiXSA9IDJdID0gXCJDb2xvclwiO1xufSkoR2Vvc2V0QW5pbUZsYWdzID0gZXhwb3J0cy5HZW9zZXRBbmltRmxhZ3MgfHwgKGV4cG9ydHMuR2Vvc2V0QW5pbUZsYWdzID0ge30pKTtcbnZhciBOb2RlRmxhZ3M7XG4oZnVuY3Rpb24gKE5vZGVGbGFncykge1xuICAgIE5vZGVGbGFnc1tOb2RlRmxhZ3NbXCJEb250SW5oZXJpdFRyYW5zbGF0aW9uXCJdID0gMV0gPSBcIkRvbnRJbmhlcml0VHJhbnNsYXRpb25cIjtcbiAgICBOb2RlRmxhZ3NbTm9kZUZsYWdzW1wiRG9udEluaGVyaXRSb3RhdGlvblwiXSA9IDJdID0gXCJEb250SW5oZXJpdFJvdGF0aW9uXCI7XG4gICAgTm9kZUZsYWdzW05vZGVGbGFnc1tcIkRvbnRJbmhlcml0U2NhbGluZ1wiXSA9IDRdID0gXCJEb250SW5oZXJpdFNjYWxpbmdcIjtcbiAgICBOb2RlRmxhZ3NbTm9kZUZsYWdzW1wiQmlsbGJvYXJkZWRcIl0gPSA4XSA9IFwiQmlsbGJvYXJkZWRcIjtcbiAgICBOb2RlRmxhZ3NbTm9kZUZsYWdzW1wiQmlsbGJvYXJkZWRMb2NrWFwiXSA9IDE2XSA9IFwiQmlsbGJvYXJkZWRMb2NrWFwiO1xuICAgIE5vZGVGbGFnc1tOb2RlRmxhZ3NbXCJCaWxsYm9hcmRlZExvY2tZXCJdID0gMzJdID0gXCJCaWxsYm9hcmRlZExvY2tZXCI7XG4gICAgTm9kZUZsYWdzW05vZGVGbGFnc1tcIkJpbGxib2FyZGVkTG9ja1pcIl0gPSA2NF0gPSBcIkJpbGxib2FyZGVkTG9ja1pcIjtcbiAgICBOb2RlRmxhZ3NbTm9kZUZsYWdzW1wiQ2FtZXJhQW5jaG9yZWRcIl0gPSAxMjhdID0gXCJDYW1lcmFBbmNob3JlZFwiO1xufSkoTm9kZUZsYWdzID0gZXhwb3J0cy5Ob2RlRmxhZ3MgfHwgKGV4cG9ydHMuTm9kZUZsYWdzID0ge30pKTtcbnZhciBOb2RlVHlwZTtcbihmdW5jdGlvbiAoTm9kZVR5cGUpIHtcbiAgICBOb2RlVHlwZVtOb2RlVHlwZVtcIkhlbHBlclwiXSA9IDBdID0gXCJIZWxwZXJcIjtcbiAgICBOb2RlVHlwZVtOb2RlVHlwZVtcIkJvbmVcIl0gPSAyNTZdID0gXCJCb25lXCI7XG4gICAgTm9kZVR5cGVbTm9kZVR5cGVbXCJMaWdodFwiXSA9IDUxMl0gPSBcIkxpZ2h0XCI7XG4gICAgTm9kZVR5cGVbTm9kZVR5cGVbXCJFdmVudE9iamVjdFwiXSA9IDEwMjRdID0gXCJFdmVudE9iamVjdFwiO1xuICAgIE5vZGVUeXBlW05vZGVUeXBlW1wiQXR0YWNobWVudFwiXSA9IDIwNDhdID0gXCJBdHRhY2htZW50XCI7XG4gICAgTm9kZVR5cGVbTm9kZVR5cGVbXCJQYXJ0aWNsZUVtaXR0ZXJcIl0gPSA0MDk2XSA9IFwiUGFydGljbGVFbWl0dGVyXCI7XG4gICAgTm9kZVR5cGVbTm9kZVR5cGVbXCJDb2xsaXNpb25TaGFwZVwiXSA9IDgxOTJdID0gXCJDb2xsaXNpb25TaGFwZVwiO1xuICAgIE5vZGVUeXBlW05vZGVUeXBlW1wiUmliYm9uRW1pdHRlclwiXSA9IDE2Mzg0XSA9IFwiUmliYm9uRW1pdHRlclwiO1xufSkoTm9kZVR5cGUgPSBleHBvcnRzLk5vZGVUeXBlIHx8IChleHBvcnRzLk5vZGVUeXBlID0ge30pKTtcbnZhciBDb2xsaXNpb25TaGFwZVR5cGU7XG4oZnVuY3Rpb24gKENvbGxpc2lvblNoYXBlVHlwZSkge1xuICAgIENvbGxpc2lvblNoYXBlVHlwZVtDb2xsaXNpb25TaGFwZVR5cGVbXCJCb3hcIl0gPSAwXSA9IFwiQm94XCI7XG4gICAgQ29sbGlzaW9uU2hhcGVUeXBlW0NvbGxpc2lvblNoYXBlVHlwZVtcIlNwaGVyZVwiXSA9IDJdID0gXCJTcGhlcmVcIjtcbn0pKENvbGxpc2lvblNoYXBlVHlwZSA9IGV4cG9ydHMuQ29sbGlzaW9uU2hhcGVUeXBlIHx8IChleHBvcnRzLkNvbGxpc2lvblNoYXBlVHlwZSA9IHt9KSk7XG52YXIgUGFydGljbGVFbWl0dGVyRmxhZ3M7XG4oZnVuY3Rpb24gKFBhcnRpY2xlRW1pdHRlckZsYWdzKSB7XG4gICAgUGFydGljbGVFbWl0dGVyRmxhZ3NbUGFydGljbGVFbWl0dGVyRmxhZ3NbXCJFbWl0dGVyVXNlc01ETFwiXSA9IDMyNzY4XSA9IFwiRW1pdHRlclVzZXNNRExcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXJGbGFnc1tQYXJ0aWNsZUVtaXR0ZXJGbGFnc1tcIkVtaXR0ZXJVc2VzVEdBXCJdID0gNjU1MzZdID0gXCJFbWl0dGVyVXNlc1RHQVwiO1xufSkoUGFydGljbGVFbWl0dGVyRmxhZ3MgPSBleHBvcnRzLlBhcnRpY2xlRW1pdHRlckZsYWdzIHx8IChleHBvcnRzLlBhcnRpY2xlRW1pdHRlckZsYWdzID0ge30pKTtcbnZhciBQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3M7XG4oZnVuY3Rpb24gKFBhcnRpY2xlRW1pdHRlcjJGbGFncykge1xuICAgIFBhcnRpY2xlRW1pdHRlcjJGbGFnc1tQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3NbXCJVbnNoYWRlZFwiXSA9IDMyNzY4XSA9IFwiVW5zaGFkZWRcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3NbUGFydGljbGVFbWl0dGVyMkZsYWdzW1wiU29ydFByaW1zRmFyWlwiXSA9IDY1NTM2XSA9IFwiU29ydFByaW1zRmFyWlwiO1xuICAgIFBhcnRpY2xlRW1pdHRlcjJGbGFnc1tQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3NbXCJMaW5lRW1pdHRlclwiXSA9IDEzMTA3Ml0gPSBcIkxpbmVFbWl0dGVyXCI7XG4gICAgUGFydGljbGVFbWl0dGVyMkZsYWdzW1BhcnRpY2xlRW1pdHRlcjJGbGFnc1tcIlVuZm9nZ2VkXCJdID0gMjYyMTQ0XSA9IFwiVW5mb2dnZWRcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3NbUGFydGljbGVFbWl0dGVyMkZsYWdzW1wiTW9kZWxTcGFjZVwiXSA9IDUyNDI4OF0gPSBcIk1vZGVsU3BhY2VcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3NbUGFydGljbGVFbWl0dGVyMkZsYWdzW1wiWFlRdWFkXCJdID0gMTA0ODU3Nl0gPSBcIlhZUXVhZFwiO1xufSkoUGFydGljbGVFbWl0dGVyMkZsYWdzID0gZXhwb3J0cy5QYXJ0aWNsZUVtaXR0ZXIyRmxhZ3MgfHwgKGV4cG9ydHMuUGFydGljbGVFbWl0dGVyMkZsYWdzID0ge30pKTtcbnZhciBQYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZTtcbihmdW5jdGlvbiAoUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGUpIHtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZVtQYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZVtcIkJsZW5kXCJdID0gMF0gPSBcIkJsZW5kXCI7XG4gICAgUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGVbUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGVbXCJBZGRpdGl2ZVwiXSA9IDFdID0gXCJBZGRpdGl2ZVwiO1xuICAgIFBhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlW1BhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlW1wiTW9kdWxhdGVcIl0gPSAyXSA9IFwiTW9kdWxhdGVcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZVtQYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZVtcIk1vZHVsYXRlMnhcIl0gPSAzXSA9IFwiTW9kdWxhdGUyeFwiO1xuICAgIFBhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlW1BhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlW1wiQWxwaGFLZXlcIl0gPSA0XSA9IFwiQWxwaGFLZXlcIjtcbn0pKFBhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlID0gZXhwb3J0cy5QYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZSB8fCAoZXhwb3J0cy5QYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZSA9IHt9KSk7XG4vLyBOb3QgYWN0dWFsbHkgbWFwcGVkIHRvIG1keCBmbGFncyAoMDogSGVhZCwgMTogVGFpbCwgMjogQm90aClcbnZhciBQYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3M7XG4oZnVuY3Rpb24gKFBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncykge1xuICAgIFBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFnc1tQYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3NbXCJIZWFkXCJdID0gMV0gPSBcIkhlYWRcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3NbUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzW1wiVGFpbFwiXSA9IDJdID0gXCJUYWlsXCI7XG59KShQYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MgPSBleHBvcnRzLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncyB8fCAoZXhwb3J0cy5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MgPSB7fSkpO1xudmFyIExpZ2h0VHlwZTtcbihmdW5jdGlvbiAoTGlnaHRUeXBlKSB7XG4gICAgTGlnaHRUeXBlW0xpZ2h0VHlwZVtcIk9tbmlkaXJlY3Rpb25hbFwiXSA9IDBdID0gXCJPbW5pZGlyZWN0aW9uYWxcIjtcbiAgICBMaWdodFR5cGVbTGlnaHRUeXBlW1wiRGlyZWN0aW9uYWxcIl0gPSAxXSA9IFwiRGlyZWN0aW9uYWxcIjtcbiAgICBMaWdodFR5cGVbTGlnaHRUeXBlW1wiQW1iaWVudFwiXSA9IDJdID0gXCJBbWJpZW50XCI7XG59KShMaWdodFR5cGUgPSBleHBvcnRzLkxpZ2h0VHlwZSB8fCAoZXhwb3J0cy5MaWdodFR5cGUgPSB7fSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kZWwuanMubWFwIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IGdsLW1hdHJpeCAtIEhpZ2ggcGVyZm9ybWFuY2UgbWF0cml4IGFuZCB2ZWN0b3Igb3BlcmF0aW9uc1xuICogQGF1dGhvciBCcmFuZG9uIEpvbmVzXG4gKiBAYXV0aG9yIENvbGluIE1hY0tlbnppZSBJVlxuICogQHZlcnNpb24gMi4zLjJcbiAqL1xuXG4vKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuLy8gRU5EIEhFQURFUlxuXG5leHBvcnRzLmdsTWF0cml4ID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L2NvbW1vbi5qc1wiKTtcbmV4cG9ydHMubWF0MiA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC9tYXQyLmpzXCIpO1xuZXhwb3J0cy5tYXQyZCA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC9tYXQyZC5qc1wiKTtcbmV4cG9ydHMubWF0MyA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC9tYXQzLmpzXCIpO1xuZXhwb3J0cy5tYXQ0ID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L21hdDQuanNcIik7XG5leHBvcnRzLnF1YXQgPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvcXVhdC5qc1wiKTtcbmV4cG9ydHMudmVjMiA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC92ZWMyLmpzXCIpO1xuZXhwb3J0cy52ZWMzID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L3ZlYzMuanNcIik7XG5leHBvcnRzLnZlYzQgPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvdmVjNC5qc1wiKTsiLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG4vKipcbiAqIEBjbGFzcyBDb21tb24gdXRpbGl0aWVzXG4gKiBAbmFtZSBnbE1hdHJpeFxuICovXG52YXIgZ2xNYXRyaXggPSB7fTtcblxuLy8gQ29uZmlndXJhdGlvbiBDb25zdGFudHNcbmdsTWF0cml4LkVQU0lMT04gPSAwLjAwMDAwMTtcbmdsTWF0cml4LkFSUkFZX1RZUEUgPSAodHlwZW9mIEZsb2F0MzJBcnJheSAhPT0gJ3VuZGVmaW5lZCcpID8gRmxvYXQzMkFycmF5IDogQXJyYXk7XG5nbE1hdHJpeC5SQU5ET00gPSBNYXRoLnJhbmRvbTtcbmdsTWF0cml4LkVOQUJMRV9TSU1EID0gZmFsc2U7XG5cbi8vIENhcGFiaWxpdHkgZGV0ZWN0aW9uXG5nbE1hdHJpeC5TSU1EX0FWQUlMQUJMRSA9IChnbE1hdHJpeC5BUlJBWV9UWVBFID09PSBGbG9hdDMyQXJyYXkpICYmICgnU0lNRCcgaW4gdGhpcyk7XG5nbE1hdHJpeC5VU0VfU0lNRCA9IGdsTWF0cml4LkVOQUJMRV9TSU1EICYmIGdsTWF0cml4LlNJTURfQVZBSUxBQkxFO1xuXG4vKipcbiAqIFNldHMgdGhlIHR5cGUgb2YgYXJyYXkgdXNlZCB3aGVuIGNyZWF0aW5nIG5ldyB2ZWN0b3JzIGFuZCBtYXRyaWNlc1xuICpcbiAqIEBwYXJhbSB7VHlwZX0gdHlwZSBBcnJheSB0eXBlLCBzdWNoIGFzIEZsb2F0MzJBcnJheSBvciBBcnJheVxuICovXG5nbE1hdHJpeC5zZXRNYXRyaXhBcnJheVR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgZ2xNYXRyaXguQVJSQVlfVFlQRSA9IHR5cGU7XG59XG5cbnZhciBkZWdyZWUgPSBNYXRoLlBJIC8gMTgwO1xuXG4vKipcbiogQ29udmVydCBEZWdyZWUgVG8gUmFkaWFuXG4qXG4qIEBwYXJhbSB7TnVtYmVyfSBBbmdsZSBpbiBEZWdyZWVzXG4qL1xuZ2xNYXRyaXgudG9SYWRpYW4gPSBmdW5jdGlvbihhKXtcbiAgICAgcmV0dXJuIGEgKiBkZWdyZWU7XG59XG5cbi8qKlxuICogVGVzdHMgd2hldGhlciBvciBub3QgdGhlIGFyZ3VtZW50cyBoYXZlIGFwcHJveGltYXRlbHkgdGhlIHNhbWUgdmFsdWUsIHdpdGhpbiBhbiBhYnNvbHV0ZVxuICogb3IgcmVsYXRpdmUgdG9sZXJhbmNlIG9mIGdsTWF0cml4LkVQU0lMT04gKGFuIGFic29sdXRlIHRvbGVyYW5jZSBpcyB1c2VkIGZvciB2YWx1ZXMgbGVzcyBcbiAqIHRoYW4gb3IgZXF1YWwgdG8gMS4wLCBhbmQgYSByZWxhdGl2ZSB0b2xlcmFuY2UgaXMgdXNlZCBmb3IgbGFyZ2VyIHZhbHVlcylcbiAqIFxuICogQHBhcmFtIHtOdW1iZXJ9IGEgVGhlIGZpcnN0IG51bWJlciB0byB0ZXN0LlxuICogQHBhcmFtIHtOdW1iZXJ9IGIgVGhlIHNlY29uZCBudW1iZXIgdG8gdGVzdC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSBudW1iZXJzIGFyZSBhcHByb3hpbWF0ZWx5IGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbmdsTWF0cml4LmVxdWFscyA9IGZ1bmN0aW9uKGEsIGIpIHtcblx0cmV0dXJuIE1hdGguYWJzKGEgLSBiKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYSksIE1hdGguYWJzKGIpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnbE1hdHJpeDtcbiIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgMngyIE1hdHJpeFxuICogQG5hbWUgbWF0MlxuICovXG52YXIgbWF0MiA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaWRlbnRpdHkgbWF0MlxuICpcbiAqIEByZXR1cm5zIHttYXQyfSBhIG5ldyAyeDIgbWF0cml4XG4gKi9cbm1hdDIuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDQpO1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBtYXQyIGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQyfSBhIG1hdHJpeCB0byBjbG9uZVxuICogQHJldHVybnMge21hdDJ9IGEgbmV3IDJ4MiBtYXRyaXhcbiAqL1xubWF0Mi5jbG9uZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgbWF0MiB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLmNvcHkgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCBhIG1hdDIgdG8gdGhlIGlkZW50aXR5IG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuaWRlbnRpdHkgPSBmdW5jdGlvbihvdXQpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBtYXQyIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDAgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMClcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDEgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggMSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTAgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMilcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTEgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggMylcbiAqIEByZXR1cm5zIHttYXQyfSBvdXQgQSBuZXcgMngyIG1hdHJpeFxuICovXG5tYXQyLmZyb21WYWx1ZXMgPSBmdW5jdGlvbihtMDAsIG0wMSwgbTEwLCBtMTEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XG4gICAgb3V0WzBdID0gbTAwO1xuICAgIG91dFsxXSA9IG0wMTtcbiAgICBvdXRbMl0gPSBtMTA7XG4gICAgb3V0WzNdID0gbTExO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBvZiBhIG1hdDIgdG8gdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge051bWJlcn0gbTAwIENvbXBvbmVudCBpbiBjb2x1bW4gMCwgcm93IDAgcG9zaXRpb24gKGluZGV4IDApXG4gKiBAcGFyYW0ge051bWJlcn0gbTAxIENvbXBvbmVudCBpbiBjb2x1bW4gMCwgcm93IDEgcG9zaXRpb24gKGluZGV4IDEpXG4gKiBAcGFyYW0ge051bWJlcn0gbTEwIENvbXBvbmVudCBpbiBjb2x1bW4gMSwgcm93IDAgcG9zaXRpb24gKGluZGV4IDIpXG4gKiBAcGFyYW0ge051bWJlcn0gbTExIENvbXBvbmVudCBpbiBjb2x1bW4gMSwgcm93IDEgcG9zaXRpb24gKGluZGV4IDMpXG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuc2V0ID0gZnVuY3Rpb24ob3V0LCBtMDAsIG0wMSwgbTEwLCBtMTEpIHtcbiAgICBvdXRbMF0gPSBtMDA7XG4gICAgb3V0WzFdID0gbTAxO1xuICAgIG91dFsyXSA9IG0xMDtcbiAgICBvdXRbM10gPSBtMTE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cblxuLyoqXG4gKiBUcmFuc3Bvc2UgdGhlIHZhbHVlcyBvZiBhIG1hdDJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIudHJhbnNwb3NlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgLy8gSWYgd2UgYXJlIHRyYW5zcG9zaW5nIG91cnNlbHZlcyB3ZSBjYW4gc2tpcCBhIGZldyBzdGVwcyBidXQgaGF2ZSB0byBjYWNoZSBzb21lIHZhbHVlc1xuICAgIGlmIChvdXQgPT09IGEpIHtcbiAgICAgICAgdmFyIGExID0gYVsxXTtcbiAgICAgICAgb3V0WzFdID0gYVsyXTtcbiAgICAgICAgb3V0WzJdID0gYTE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgb3V0WzBdID0gYVswXTtcbiAgICAgICAgb3V0WzFdID0gYVsyXTtcbiAgICAgICAgb3V0WzJdID0gYVsxXTtcbiAgICAgICAgb3V0WzNdID0gYVszXTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogSW52ZXJ0cyBhIG1hdDJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuaW52ZXJ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSxcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gICAgICAgIGRldCA9IGEwICogYTMgLSBhMiAqIGExO1xuXG4gICAgaWYgKCFkZXQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGRldCA9IDEuMCAvIGRldDtcbiAgICBcbiAgICBvdXRbMF0gPSAgYTMgKiBkZXQ7XG4gICAgb3V0WzFdID0gLWExICogZGV0O1xuICAgIG91dFsyXSA9IC1hMiAqIGRldDtcbiAgICBvdXRbM10gPSAgYTAgKiBkZXQ7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhZGp1Z2F0ZSBvZiBhIG1hdDJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuYWRqb2ludCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIC8vIENhY2hpbmcgdGhpcyB2YWx1ZSBpcyBuZXNzZWNhcnkgaWYgb3V0ID09IGFcbiAgICB2YXIgYTAgPSBhWzBdO1xuICAgIG91dFswXSA9ICBhWzNdO1xuICAgIG91dFsxXSA9IC1hWzFdO1xuICAgIG91dFsyXSA9IC1hWzJdO1xuICAgIG91dFszXSA9ICBhMDtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgbWF0MlxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge051bWJlcn0gZGV0ZXJtaW5hbnQgb2YgYVxuICovXG5tYXQyLmRldGVybWluYW50ID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gYVswXSAqIGFbM10gLSBhWzJdICogYVsxXTtcbn07XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gbWF0MidzXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLm11bHRpcGx5ID0gZnVuY3Rpb24gKG91dCwgYSwgYikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM107XG4gICAgdmFyIGIwID0gYlswXSwgYjEgPSBiWzFdLCBiMiA9IGJbMl0sIGIzID0gYlszXTtcbiAgICBvdXRbMF0gPSBhMCAqIGIwICsgYTIgKiBiMTtcbiAgICBvdXRbMV0gPSBhMSAqIGIwICsgYTMgKiBiMTtcbiAgICBvdXRbMl0gPSBhMCAqIGIyICsgYTIgKiBiMztcbiAgICBvdXRbM10gPSBhMSAqIGIyICsgYTMgKiBiMztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIG1hdDIubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xubWF0Mi5tdWwgPSBtYXQyLm11bHRpcGx5O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXQyIGJ5IHRoZSBnaXZlbiBhbmdsZVxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIucm90YXRlID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSxcbiAgICAgICAgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIG91dFswXSA9IGEwICogIGMgKyBhMiAqIHM7XG4gICAgb3V0WzFdID0gYTEgKiAgYyArIGEzICogcztcbiAgICBvdXRbMl0gPSBhMCAqIC1zICsgYTIgKiBjO1xuICAgIG91dFszXSA9IGExICogLXMgKyBhMyAqIGM7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2NhbGVzIHRoZSBtYXQyIGJ5IHRoZSBkaW1lbnNpb25zIGluIHRoZSBnaXZlbiB2ZWMyXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHt2ZWMyfSB2IHRoZSB2ZWMyIHRvIHNjYWxlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqKi9cbm1hdDIuc2NhbGUgPSBmdW5jdGlvbihvdXQsIGEsIHYpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdLFxuICAgICAgICB2MCA9IHZbMF0sIHYxID0gdlsxXTtcbiAgICBvdXRbMF0gPSBhMCAqIHYwO1xuICAgIG91dFsxXSA9IGExICogdjA7XG4gICAgb3V0WzJdID0gYTIgKiB2MTtcbiAgICBvdXRbM10gPSBhMyAqIHYxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIGdpdmVuIGFuZ2xlXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0Mi5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQyLnJvdGF0ZShkZXN0LCBkZXN0LCByYWQpO1xuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IG1hdDIgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuZnJvbVJvdGF0aW9uID0gZnVuY3Rpb24ob3V0LCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIG91dFswXSA9IGM7XG4gICAgb3V0WzFdID0gcztcbiAgICBvdXRbMl0gPSAtcztcbiAgICBvdXRbM10gPSBjO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHNjYWxpbmdcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQyLmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDIuc2NhbGUoZGVzdCwgZGVzdCwgdmVjKTtcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCBtYXQyIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3ZlYzJ9IHYgU2NhbGluZyB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqL1xubWF0Mi5mcm9tU2NhbGluZyA9IGZ1bmN0aW9uKG91dCwgdikge1xuICAgIG91dFswXSA9IHZbMF07XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IHZbMV07XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgbWF0MlxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gbWF0IG1hdHJpeCB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gKi9cbm1hdDIuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ21hdDIoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIGFbM10gKyAnKSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgRnJvYmVuaXVzIG5vcm0gb2YgYSBtYXQyXG4gKlxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBtYXRyaXggdG8gY2FsY3VsYXRlIEZyb2Jlbml1cyBub3JtIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBGcm9iZW5pdXMgbm9ybVxuICovXG5tYXQyLmZyb2IgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybihNYXRoLnNxcnQoTWF0aC5wb3coYVswXSwgMikgKyBNYXRoLnBvdyhhWzFdLCAyKSArIE1hdGgucG93KGFbMl0sIDIpICsgTWF0aC5wb3coYVszXSwgMikpKVxufTtcblxuLyoqXG4gKiBSZXR1cm5zIEwsIEQgYW5kIFUgbWF0cmljZXMgKExvd2VyIHRyaWFuZ3VsYXIsIERpYWdvbmFsIGFuZCBVcHBlciB0cmlhbmd1bGFyKSBieSBmYWN0b3JpemluZyB0aGUgaW5wdXQgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJ9IEwgdGhlIGxvd2VyIHRyaWFuZ3VsYXIgbWF0cml4IFxuICogQHBhcmFtIHttYXQyfSBEIHRoZSBkaWFnb25hbCBtYXRyaXggXG4gKiBAcGFyYW0ge21hdDJ9IFUgdGhlIHVwcGVyIHRyaWFuZ3VsYXIgbWF0cml4IFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBpbnB1dCBtYXRyaXggdG8gZmFjdG9yaXplXG4gKi9cblxubWF0Mi5MRFUgPSBmdW5jdGlvbiAoTCwgRCwgVSwgYSkgeyBcbiAgICBMWzJdID0gYVsyXS9hWzBdOyBcbiAgICBVWzBdID0gYVswXTsgXG4gICAgVVsxXSA9IGFbMV07IFxuICAgIFVbM10gPSBhWzNdIC0gTFsyXSAqIFVbMV07IFxuICAgIHJldHVybiBbTCwgRCwgVV07ICAgICAgIFxufTsgXG5cbi8qKlxuICogQWRkcyB0d28gbWF0MidzXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLmFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKyBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gKyBiWzJdO1xuICAgIG91dFszXSA9IGFbM10gKyBiWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyBtYXRyaXggYiBmcm9tIG1hdHJpeCBhXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLnN1YnRyYWN0ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAtIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAtIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSAtIGJbMl07XG4gICAgb3V0WzNdID0gYVszXSAtIGJbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBtYXQyLnN1YnRyYWN0fVxuICogQGZ1bmN0aW9uXG4gKi9cbm1hdDIuc3ViID0gbWF0Mi5zdWJ0cmFjdDtcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBtYXRyaWNlcyBoYXZlIGV4YWN0bHkgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24gKHdoZW4gY29tcGFyZWQgd2l0aCA9PT0pXG4gKlxuICogQHBhcmFtIHttYXQyfSBhIFRoZSBmaXJzdCBtYXRyaXguXG4gKiBAcGFyYW0ge21hdDJ9IGIgVGhlIHNlY29uZCBtYXRyaXguXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgbWF0cmljZXMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbm1hdDIuZXhhY3RFcXVhbHMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhWzBdID09PSBiWzBdICYmIGFbMV0gPT09IGJbMV0gJiYgYVsyXSA9PT0gYlsyXSAmJiBhWzNdID09PSBiWzNdO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBtYXRyaWNlcyBoYXZlIGFwcHJveGltYXRlbHkgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24uXG4gKlxuICogQHBhcmFtIHttYXQyfSBhIFRoZSBmaXJzdCBtYXRyaXguXG4gKiBAcGFyYW0ge21hdDJ9IGIgVGhlIHNlY29uZCBtYXRyaXguXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgbWF0cmljZXMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbm1hdDIuZXF1YWxzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdO1xuICAgIHZhciBiMCA9IGJbMF0sIGIxID0gYlsxXSwgYjIgPSBiWzJdLCBiMyA9IGJbM107XG4gICAgcmV0dXJuIChNYXRoLmFicyhhMCAtIGIwKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTApLCBNYXRoLmFicyhiMCkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMSAtIGIxKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTEpLCBNYXRoLmFicyhiMSkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMiAtIGIyKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTIpLCBNYXRoLmFicyhiMikpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMyAtIGIzKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTMpLCBNYXRoLmFicyhiMykpKTtcbn07XG5cbi8qKlxuICogTXVsdGlwbHkgZWFjaCBlbGVtZW50IG9mIHRoZSBtYXRyaXggYnkgYSBzY2FsYXIuXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgbWF0cml4IHRvIHNjYWxlXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIG1hdHJpeCdzIGVsZW1lbnRzIGJ5XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIubXVsdGlwbHlTY2FsYXIgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICogYjtcbiAgICBvdXRbMV0gPSBhWzFdICogYjtcbiAgICBvdXRbMl0gPSBhWzJdICogYjtcbiAgICBvdXRbM10gPSBhWzNdICogYjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIHR3byBtYXQyJ3MgYWZ0ZXIgbXVsdGlwbHlpbmcgZWFjaCBlbGVtZW50IG9mIHRoZSBzZWNvbmQgb3BlcmFuZCBieSBhIHNjYWxhciB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge21hdDJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGUgdGhlIGFtb3VudCB0byBzY2FsZSBiJ3MgZWxlbWVudHMgYnkgYmVmb3JlIGFkZGluZ1xuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLm11bHRpcGx5U2NhbGFyQW5kQWRkID0gZnVuY3Rpb24ob3V0LCBhLCBiLCBzY2FsZSkge1xuICAgIG91dFswXSA9IGFbMF0gKyAoYlswXSAqIHNjYWxlKTtcbiAgICBvdXRbMV0gPSBhWzFdICsgKGJbMV0gKiBzY2FsZSk7XG4gICAgb3V0WzJdID0gYVsyXSArIChiWzJdICogc2NhbGUpO1xuICAgIG91dFszXSA9IGFbM10gKyAoYlszXSAqIHNjYWxlKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtYXQyO1xuIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyAyeDMgTWF0cml4XG4gKiBAbmFtZSBtYXQyZFxuICogXG4gKiBAZGVzY3JpcHRpb24gXG4gKiBBIG1hdDJkIGNvbnRhaW5zIHNpeCBlbGVtZW50cyBkZWZpbmVkIGFzOlxuICogPHByZT5cbiAqIFthLCBjLCB0eCxcbiAqICBiLCBkLCB0eV1cbiAqIDwvcHJlPlxuICogVGhpcyBpcyBhIHNob3J0IGZvcm0gZm9yIHRoZSAzeDMgbWF0cml4OlxuICogPHByZT5cbiAqIFthLCBjLCB0eCxcbiAqICBiLCBkLCB0eSxcbiAqICAwLCAwLCAxXVxuICogPC9wcmU+XG4gKiBUaGUgbGFzdCByb3cgaXMgaWdub3JlZCBzbyB0aGUgYXJyYXkgaXMgc2hvcnRlciBhbmQgb3BlcmF0aW9ucyBhcmUgZmFzdGVyLlxuICovXG52YXIgbWF0MmQgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGlkZW50aXR5IG1hdDJkXG4gKlxuICogQHJldHVybnMge21hdDJkfSBhIG5ldyAyeDMgbWF0cml4XG4gKi9cbm1hdDJkLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg2KTtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IG1hdDJkIGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQyZH0gYSBtYXRyaXggdG8gY2xvbmVcbiAqIEByZXR1cm5zIHttYXQyZH0gYSBuZXcgMngzIG1hdHJpeFxuICovXG5tYXQyZC5jbG9uZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNik7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICBvdXRbNF0gPSBhWzRdO1xuICAgIG91dFs1XSA9IGFbNV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIG1hdDJkIHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLmNvcHkgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIG91dFs0XSA9IGFbNF07XG4gICAgb3V0WzVdID0gYVs1XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXQgYSBtYXQyZCB0byB0aGUgaWRlbnRpdHkgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5pZGVudGl0eSA9IGZ1bmN0aW9uKG91dCkge1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDE7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBtYXQyZCB3aXRoIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gYSBDb21wb25lbnQgQSAoaW5kZXggMClcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIENvbXBvbmVudCBCIChpbmRleCAxKVxuICogQHBhcmFtIHtOdW1iZXJ9IGMgQ29tcG9uZW50IEMgKGluZGV4IDIpXG4gKiBAcGFyYW0ge051bWJlcn0gZCBDb21wb25lbnQgRCAoaW5kZXggMylcbiAqIEBwYXJhbSB7TnVtYmVyfSB0eCBDb21wb25lbnQgVFggKGluZGV4IDQpXG4gKiBAcGFyYW0ge051bWJlcn0gdHkgQ29tcG9uZW50IFRZIChpbmRleCA1KVxuICogQHJldHVybnMge21hdDJkfSBBIG5ldyBtYXQyZFxuICovXG5tYXQyZC5mcm9tVmFsdWVzID0gZnVuY3Rpb24oYSwgYiwgYywgZCwgdHgsIHR5KSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDYpO1xuICAgIG91dFswXSA9IGE7XG4gICAgb3V0WzFdID0gYjtcbiAgICBvdXRbMl0gPSBjO1xuICAgIG91dFszXSA9IGQ7XG4gICAgb3V0WzRdID0gdHg7XG4gICAgb3V0WzVdID0gdHk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgbWF0MmQgdG8gdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHtOdW1iZXJ9IGEgQ29tcG9uZW50IEEgKGluZGV4IDApXG4gKiBAcGFyYW0ge051bWJlcn0gYiBDb21wb25lbnQgQiAoaW5kZXggMSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBjIENvbXBvbmVudCBDIChpbmRleCAyKVxuICogQHBhcmFtIHtOdW1iZXJ9IGQgQ29tcG9uZW50IEQgKGluZGV4IDMpXG4gKiBAcGFyYW0ge051bWJlcn0gdHggQ29tcG9uZW50IFRYIChpbmRleCA0KVxuICogQHBhcmFtIHtOdW1iZXJ9IHR5IENvbXBvbmVudCBUWSAoaW5kZXggNSlcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLnNldCA9IGZ1bmN0aW9uKG91dCwgYSwgYiwgYywgZCwgdHgsIHR5KSB7XG4gICAgb3V0WzBdID0gYTtcbiAgICBvdXRbMV0gPSBiO1xuICAgIG91dFsyXSA9IGM7XG4gICAgb3V0WzNdID0gZDtcbiAgICBvdXRbNF0gPSB0eDtcbiAgICBvdXRbNV0gPSB0eTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBJbnZlcnRzIGEgbWF0MmRcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLmludmVydCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhYSA9IGFbMF0sIGFiID0gYVsxXSwgYWMgPSBhWzJdLCBhZCA9IGFbM10sXG4gICAgICAgIGF0eCA9IGFbNF0sIGF0eSA9IGFbNV07XG5cbiAgICB2YXIgZGV0ID0gYWEgKiBhZCAtIGFiICogYWM7XG4gICAgaWYoIWRldCl7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSBhZCAqIGRldDtcbiAgICBvdXRbMV0gPSAtYWIgKiBkZXQ7XG4gICAgb3V0WzJdID0gLWFjICogZGV0O1xuICAgIG91dFszXSA9IGFhICogZGV0O1xuICAgIG91dFs0XSA9IChhYyAqIGF0eSAtIGFkICogYXR4KSAqIGRldDtcbiAgICBvdXRbNV0gPSAoYWIgKiBhdHggLSBhYSAqIGF0eSkgKiBkZXQ7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSBtYXQyZFxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRldGVybWluYW50IG9mIGFcbiAqL1xubWF0MmQuZGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiBhWzBdICogYVszXSAtIGFbMV0gKiBhWzJdO1xufTtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBtYXQyZCdzXG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge21hdDJkfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQubXVsdGlwbHkgPSBmdW5jdGlvbiAob3V0LCBhLCBiKSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSwgYTQgPSBhWzRdLCBhNSA9IGFbNV0sXG4gICAgICAgIGIwID0gYlswXSwgYjEgPSBiWzFdLCBiMiA9IGJbMl0sIGIzID0gYlszXSwgYjQgPSBiWzRdLCBiNSA9IGJbNV07XG4gICAgb3V0WzBdID0gYTAgKiBiMCArIGEyICogYjE7XG4gICAgb3V0WzFdID0gYTEgKiBiMCArIGEzICogYjE7XG4gICAgb3V0WzJdID0gYTAgKiBiMiArIGEyICogYjM7XG4gICAgb3V0WzNdID0gYTEgKiBiMiArIGEzICogYjM7XG4gICAgb3V0WzRdID0gYTAgKiBiNCArIGEyICogYjUgKyBhNDtcbiAgICBvdXRbNV0gPSBhMSAqIGI0ICsgYTMgKiBiNSArIGE1O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgbWF0MmQubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xubWF0MmQubXVsID0gbWF0MmQubXVsdGlwbHk7XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdDJkIGJ5IHRoZSBnaXZlbiBhbmdsZVxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLnJvdGF0ZSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sIGE0ID0gYVs0XSwgYTUgPSBhWzVdLFxuICAgICAgICBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgb3V0WzBdID0gYTAgKiAgYyArIGEyICogcztcbiAgICBvdXRbMV0gPSBhMSAqICBjICsgYTMgKiBzO1xuICAgIG91dFsyXSA9IGEwICogLXMgKyBhMiAqIGM7XG4gICAgb3V0WzNdID0gYTEgKiAtcyArIGEzICogYztcbiAgICBvdXRbNF0gPSBhNDtcbiAgICBvdXRbNV0gPSBhNTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTY2FsZXMgdGhlIG1hdDJkIGJ5IHRoZSBkaW1lbnNpb25zIGluIHRoZSBnaXZlbiB2ZWMyXG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBtYXRyaXggdG8gdHJhbnNsYXRlXG4gKiBAcGFyYW0ge3ZlYzJ9IHYgdGhlIHZlYzIgdG8gc2NhbGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqKi9cbm1hdDJkLnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSwgYTQgPSBhWzRdLCBhNSA9IGFbNV0sXG4gICAgICAgIHYwID0gdlswXSwgdjEgPSB2WzFdO1xuICAgIG91dFswXSA9IGEwICogdjA7XG4gICAgb3V0WzFdID0gYTEgKiB2MDtcbiAgICBvdXRbMl0gPSBhMiAqIHYxO1xuICAgIG91dFszXSA9IGEzICogdjE7XG4gICAgb3V0WzRdID0gYTQ7XG4gICAgb3V0WzVdID0gYTU7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNsYXRlcyB0aGUgbWF0MmQgYnkgdGhlIGRpbWVuc2lvbnMgaW4gdGhlIGdpdmVuIHZlYzJcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIG1hdHJpeCB0byB0cmFuc2xhdGVcbiAqIEBwYXJhbSB7dmVjMn0gdiB0aGUgdmVjMiB0byB0cmFuc2xhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqKi9cbm1hdDJkLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKG91dCwgYSwgdikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sIGE0ID0gYVs0XSwgYTUgPSBhWzVdLFxuICAgICAgICB2MCA9IHZbMF0sIHYxID0gdlsxXTtcbiAgICBvdXRbMF0gPSBhMDtcbiAgICBvdXRbMV0gPSBhMTtcbiAgICBvdXRbMl0gPSBhMjtcbiAgICBvdXRbM10gPSBhMztcbiAgICBvdXRbNF0gPSBhMCAqIHYwICsgYTIgKiB2MSArIGE0O1xuICAgIG91dFs1XSA9IGExICogdjAgKyBhMyAqIHYxICsgYTU7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgZ2l2ZW4gYW5nbGVcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQyZC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQyZC5yb3RhdGUoZGVzdCwgZGVzdCwgcmFkKTtcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgbWF0MmQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5mcm9tUm90YXRpb24gPSBmdW5jdGlvbihvdXQsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSwgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgb3V0WzBdID0gYztcbiAgICBvdXRbMV0gPSBzO1xuICAgIG91dFsyXSA9IC1zO1xuICAgIG91dFszXSA9IGM7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHNjYWxpbmdcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQyZC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQyZC5zY2FsZShkZXN0LCBkZXN0LCB2ZWMpO1xuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCBtYXQyZCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHt2ZWMyfSB2IFNjYWxpbmcgdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5mcm9tU2NhbGluZyA9IGZ1bmN0aW9uKG91dCwgdikge1xuICAgIG91dFswXSA9IHZbMF07XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IHZbMV07XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHRyYW5zbGF0aW9uXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0MmQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0MmQudHJhbnNsYXRlKGRlc3QsIGRlc3QsIHZlYyk7XG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IG1hdDJkIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3ZlYzJ9IHYgVHJhbnNsYXRpb24gdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5mcm9tVHJhbnNsYXRpb24gPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIG91dFs0XSA9IHZbMF07XG4gICAgb3V0WzVdID0gdlsxXTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBtYXQyZFxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IGEgbWF0cml4IHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXhcbiAqL1xubWF0MmQuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ21hdDJkKCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcsICcgKyBcbiAgICAgICAgICAgICAgICAgICAgYVszXSArICcsICcgKyBhWzRdICsgJywgJyArIGFbNV0gKyAnKSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgRnJvYmVuaXVzIG5vcm0gb2YgYSBtYXQyZFxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIG1hdHJpeCB0byBjYWxjdWxhdGUgRnJvYmVuaXVzIG5vcm0gb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IEZyb2Jlbml1cyBub3JtXG4gKi9cbm1hdDJkLmZyb2IgPSBmdW5jdGlvbiAoYSkgeyBcbiAgICByZXR1cm4oTWF0aC5zcXJ0KE1hdGgucG93KGFbMF0sIDIpICsgTWF0aC5wb3coYVsxXSwgMikgKyBNYXRoLnBvdyhhWzJdLCAyKSArIE1hdGgucG93KGFbM10sIDIpICsgTWF0aC5wb3coYVs0XSwgMikgKyBNYXRoLnBvdyhhWzVdLCAyKSArIDEpKVxufTsgXG5cbi8qKlxuICogQWRkcyB0d28gbWF0MmQnc1xuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQyZH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLmFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKyBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gKyBiWzJdO1xuICAgIG91dFszXSA9IGFbM10gKyBiWzNdO1xuICAgIG91dFs0XSA9IGFbNF0gKyBiWzRdO1xuICAgIG91dFs1XSA9IGFbNV0gKyBiWzVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyBtYXRyaXggYiBmcm9tIG1hdHJpeCBhXG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge21hdDJkfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQuc3VidHJhY3QgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC0gYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdIC0gYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdIC0gYlsyXTtcbiAgICBvdXRbM10gPSBhWzNdIC0gYlszXTtcbiAgICBvdXRbNF0gPSBhWzRdIC0gYls0XTtcbiAgICBvdXRbNV0gPSBhWzVdIC0gYls1XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIG1hdDJkLnN1YnRyYWN0fVxuICogQGZ1bmN0aW9uXG4gKi9cbm1hdDJkLnN1YiA9IG1hdDJkLnN1YnRyYWN0O1xuXG4vKipcbiAqIE11bHRpcGx5IGVhY2ggZWxlbWVudCBvZiB0aGUgbWF0cml4IGJ5IGEgc2NhbGFyLlxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIHNjYWxlXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIG1hdHJpeCdzIGVsZW1lbnRzIGJ5XG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5tdWx0aXBseVNjYWxhciA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiO1xuICAgIG91dFsyXSA9IGFbMl0gKiBiO1xuICAgIG91dFszXSA9IGFbM10gKiBiO1xuICAgIG91dFs0XSA9IGFbNF0gKiBiO1xuICAgIG91dFs1XSA9IGFbNV0gKiBiO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIG1hdDJkJ3MgYWZ0ZXIgbXVsdGlwbHlpbmcgZWFjaCBlbGVtZW50IG9mIHRoZSBzZWNvbmQgb3BlcmFuZCBieSBhIHNjYWxhciB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7bWF0MmR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGUgdGhlIGFtb3VudCB0byBzY2FsZSBiJ3MgZWxlbWVudHMgYnkgYmVmb3JlIGFkZGluZ1xuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQubXVsdGlwbHlTY2FsYXJBbmRBZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIsIHNjYWxlKSB7XG4gICAgb3V0WzBdID0gYVswXSArIChiWzBdICogc2NhbGUpO1xuICAgIG91dFsxXSA9IGFbMV0gKyAoYlsxXSAqIHNjYWxlKTtcbiAgICBvdXRbMl0gPSBhWzJdICsgKGJbMl0gKiBzY2FsZSk7XG4gICAgb3V0WzNdID0gYVszXSArIChiWzNdICogc2NhbGUpO1xuICAgIG91dFs0XSA9IGFbNF0gKyAoYls0XSAqIHNjYWxlKTtcbiAgICBvdXRbNV0gPSBhWzVdICsgKGJbNV0gKiBzY2FsZSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgbWF0cmljZXMgaGF2ZSBleGFjdGx5IHRoZSBzYW1lIGVsZW1lbnRzIGluIHRoZSBzYW1lIHBvc2l0aW9uICh3aGVuIGNvbXBhcmVkIHdpdGggPT09KVxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IGEgVGhlIGZpcnN0IG1hdHJpeC5cbiAqIEBwYXJhbSB7bWF0MmR9IGIgVGhlIHNlY29uZCBtYXRyaXguXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgbWF0cmljZXMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbm1hdDJkLmV4YWN0RXF1YWxzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYVswXSA9PT0gYlswXSAmJiBhWzFdID09PSBiWzFdICYmIGFbMl0gPT09IGJbMl0gJiYgYVszXSA9PT0gYlszXSAmJiBhWzRdID09PSBiWzRdICYmIGFbNV0gPT09IGJbNV07XG59O1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIG1hdHJpY2VzIGhhdmUgYXBwcm94aW1hdGVseSB0aGUgc2FtZSBlbGVtZW50cyBpbiB0aGUgc2FtZSBwb3NpdGlvbi5cbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBhIFRoZSBmaXJzdCBtYXRyaXguXG4gKiBAcGFyYW0ge21hdDJkfSBiIFRoZSBzZWNvbmQgbWF0cml4LlxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIG1hdHJpY2VzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5tYXQyZC5lcXVhbHMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sIGE0ID0gYVs0XSwgYTUgPSBhWzVdO1xuICAgIHZhciBiMCA9IGJbMF0sIGIxID0gYlsxXSwgYjIgPSBiWzJdLCBiMyA9IGJbM10sIGI0ID0gYls0XSwgYjUgPSBiWzVdO1xuICAgIHJldHVybiAoTWF0aC5hYnMoYTAgLSBiMCkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEwKSwgTWF0aC5hYnMoYjApKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTEgLSBiMSkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGExKSwgTWF0aC5hYnMoYjEpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTIgLSBiMikgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEyKSwgTWF0aC5hYnMoYjIpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTMgLSBiMykgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEzKSwgTWF0aC5hYnMoYjMpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTQgLSBiNCkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE0KSwgTWF0aC5hYnMoYjQpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTUgLSBiNSkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE1KSwgTWF0aC5hYnMoYjUpKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdDJkO1xuIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyAzeDMgTWF0cml4XG4gKiBAbmFtZSBtYXQzXG4gKi9cbnZhciBtYXQzID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpZGVudGl0eSBtYXQzXG4gKlxuICogQHJldHVybnMge21hdDN9IGEgbmV3IDN4MyBtYXRyaXhcbiAqL1xubWF0My5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoOSk7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAxO1xuICAgIG91dFs1XSA9IDA7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29waWVzIHRoZSB1cHBlci1sZWZ0IDN4MyB2YWx1ZXMgaW50byB0aGUgZ2l2ZW4gbWF0My5cbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIDN4MyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSAgIHRoZSBzb3VyY2UgNHg0IG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmZyb21NYXQ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVs0XTtcbiAgICBvdXRbNF0gPSBhWzVdO1xuICAgIG91dFs1XSA9IGFbNl07XG4gICAgb3V0WzZdID0gYVs4XTtcbiAgICBvdXRbN10gPSBhWzldO1xuICAgIG91dFs4XSA9IGFbMTBdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgbWF0MyBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0M30gYSBtYXRyaXggdG8gY2xvbmVcbiAqIEByZXR1cm5zIHttYXQzfSBhIG5ldyAzeDMgbWF0cml4XG4gKi9cbm1hdDMuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDkpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIG91dFs2XSA9IGFbNl07XG4gICAgb3V0WzddID0gYVs3XTtcbiAgICBvdXRbOF0gPSBhWzhdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBtYXQzIHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIG91dFs2XSA9IGFbNl07XG4gICAgb3V0WzddID0gYVs3XTtcbiAgICBvdXRbOF0gPSBhWzhdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBtYXQzIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDAgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMClcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDEgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggMSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDIgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggMilcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTAgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMylcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTEgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggNClcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTIgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggNSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjAgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggNilcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjEgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggNylcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjIgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggOClcbiAqIEByZXR1cm5zIHttYXQzfSBBIG5ldyBtYXQzXG4gKi9cbm1hdDMuZnJvbVZhbHVlcyA9IGZ1bmN0aW9uKG0wMCwgbTAxLCBtMDIsIG0xMCwgbTExLCBtMTIsIG0yMCwgbTIxLCBtMjIpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoOSk7XG4gICAgb3V0WzBdID0gbTAwO1xuICAgIG91dFsxXSA9IG0wMTtcbiAgICBvdXRbMl0gPSBtMDI7XG4gICAgb3V0WzNdID0gbTEwO1xuICAgIG91dFs0XSA9IG0xMTtcbiAgICBvdXRbNV0gPSBtMTI7XG4gICAgb3V0WzZdID0gbTIwO1xuICAgIG91dFs3XSA9IG0yMTtcbiAgICBvdXRbOF0gPSBtMjI7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgbWF0MyB0byB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDAgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMClcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDEgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggMSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDIgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggMilcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTAgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMylcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTEgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggNClcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTIgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggNSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjAgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggNilcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjEgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggNylcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjIgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggOClcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5zZXQgPSBmdW5jdGlvbihvdXQsIG0wMCwgbTAxLCBtMDIsIG0xMCwgbTExLCBtMTIsIG0yMCwgbTIxLCBtMjIpIHtcbiAgICBvdXRbMF0gPSBtMDA7XG4gICAgb3V0WzFdID0gbTAxO1xuICAgIG91dFsyXSA9IG0wMjtcbiAgICBvdXRbM10gPSBtMTA7XG4gICAgb3V0WzRdID0gbTExO1xuICAgIG91dFs1XSA9IG0xMjtcbiAgICBvdXRbNl0gPSBtMjA7XG4gICAgb3V0WzddID0gbTIxO1xuICAgIG91dFs4XSA9IG0yMjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXQgYSBtYXQzIHRvIHRoZSBpZGVudGl0eSBtYXRyaXhcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmlkZW50aXR5ID0gZnVuY3Rpb24ob3V0KSB7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAxO1xuICAgIG91dFs1XSA9IDA7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNwb3NlIHRoZSB2YWx1ZXMgb2YgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLnRyYW5zcG9zZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIC8vIElmIHdlIGFyZSB0cmFuc3Bvc2luZyBvdXJzZWx2ZXMgd2UgY2FuIHNraXAgYSBmZXcgc3RlcHMgYnV0IGhhdmUgdG8gY2FjaGUgc29tZSB2YWx1ZXNcbiAgICBpZiAob3V0ID09PSBhKSB7XG4gICAgICAgIHZhciBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMTIgPSBhWzVdO1xuICAgICAgICBvdXRbMV0gPSBhWzNdO1xuICAgICAgICBvdXRbMl0gPSBhWzZdO1xuICAgICAgICBvdXRbM10gPSBhMDE7XG4gICAgICAgIG91dFs1XSA9IGFbN107XG4gICAgICAgIG91dFs2XSA9IGEwMjtcbiAgICAgICAgb3V0WzddID0gYTEyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG91dFswXSA9IGFbMF07XG4gICAgICAgIG91dFsxXSA9IGFbM107XG4gICAgICAgIG91dFsyXSA9IGFbNl07XG4gICAgICAgIG91dFszXSA9IGFbMV07XG4gICAgICAgIG91dFs0XSA9IGFbNF07XG4gICAgICAgIG91dFs1XSA9IGFbN107XG4gICAgICAgIG91dFs2XSA9IGFbMl07XG4gICAgICAgIG91dFs3XSA9IGFbNV07XG4gICAgICAgIG91dFs4XSA9IGFbOF07XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEludmVydHMgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmludmVydCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLFxuICAgICAgICBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdLFxuICAgICAgICBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdLFxuXG4gICAgICAgIGIwMSA9IGEyMiAqIGExMSAtIGExMiAqIGEyMSxcbiAgICAgICAgYjExID0gLWEyMiAqIGExMCArIGExMiAqIGEyMCxcbiAgICAgICAgYjIxID0gYTIxICogYTEwIC0gYTExICogYTIwLFxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICAgICAgZGV0ID0gYTAwICogYjAxICsgYTAxICogYjExICsgYTAyICogYjIxO1xuXG4gICAgaWYgKCFkZXQpIHsgXG4gICAgICAgIHJldHVybiBudWxsOyBcbiAgICB9XG4gICAgZGV0ID0gMS4wIC8gZGV0O1xuXG4gICAgb3V0WzBdID0gYjAxICogZGV0O1xuICAgIG91dFsxXSA9ICgtYTIyICogYTAxICsgYTAyICogYTIxKSAqIGRldDtcbiAgICBvdXRbMl0gPSAoYTEyICogYTAxIC0gYTAyICogYTExKSAqIGRldDtcbiAgICBvdXRbM10gPSBiMTEgKiBkZXQ7XG4gICAgb3V0WzRdID0gKGEyMiAqIGEwMCAtIGEwMiAqIGEyMCkgKiBkZXQ7XG4gICAgb3V0WzVdID0gKC1hMTIgKiBhMDAgKyBhMDIgKiBhMTApICogZGV0O1xuICAgIG91dFs2XSA9IGIyMSAqIGRldDtcbiAgICBvdXRbN10gPSAoLWEyMSAqIGEwMCArIGEwMSAqIGEyMCkgKiBkZXQ7XG4gICAgb3V0WzhdID0gKGExMSAqIGEwMCAtIGEwMSAqIGExMCkgKiBkZXQ7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgYWRqdWdhdGUgb2YgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmFkam9pbnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSxcbiAgICAgICAgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XSxcbiAgICAgICAgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XTtcblxuICAgIG91dFswXSA9IChhMTEgKiBhMjIgLSBhMTIgKiBhMjEpO1xuICAgIG91dFsxXSA9IChhMDIgKiBhMjEgLSBhMDEgKiBhMjIpO1xuICAgIG91dFsyXSA9IChhMDEgKiBhMTIgLSBhMDIgKiBhMTEpO1xuICAgIG91dFszXSA9IChhMTIgKiBhMjAgLSBhMTAgKiBhMjIpO1xuICAgIG91dFs0XSA9IChhMDAgKiBhMjIgLSBhMDIgKiBhMjApO1xuICAgIG91dFs1XSA9IChhMDIgKiBhMTAgLSBhMDAgKiBhMTIpO1xuICAgIG91dFs2XSA9IChhMTAgKiBhMjEgLSBhMTEgKiBhMjApO1xuICAgIG91dFs3XSA9IChhMDEgKiBhMjAgLSBhMDAgKiBhMjEpO1xuICAgIG91dFs4XSA9IChhMDAgKiBhMTEgLSBhMDEgKiBhMTApO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgbWF0M1xuICpcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge051bWJlcn0gZGV0ZXJtaW5hbnQgb2YgYVxuICovXG5tYXQzLmRldGVybWluYW50ID0gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSxcbiAgICAgICAgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XSxcbiAgICAgICAgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XTtcblxuICAgIHJldHVybiBhMDAgKiAoYTIyICogYTExIC0gYTEyICogYTIxKSArIGEwMSAqICgtYTIyICogYTEwICsgYTEyICogYTIwKSArIGEwMiAqIChhMjEgKiBhMTAgLSBhMTEgKiBhMjApO1xufTtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBtYXQzJ3NcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge21hdDN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMubXVsdGlwbHkgPSBmdW5jdGlvbiAob3V0LCBhLCBiKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sXG4gICAgICAgIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV0sXG4gICAgICAgIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF0sXG5cbiAgICAgICAgYjAwID0gYlswXSwgYjAxID0gYlsxXSwgYjAyID0gYlsyXSxcbiAgICAgICAgYjEwID0gYlszXSwgYjExID0gYls0XSwgYjEyID0gYls1XSxcbiAgICAgICAgYjIwID0gYls2XSwgYjIxID0gYls3XSwgYjIyID0gYls4XTtcblxuICAgIG91dFswXSA9IGIwMCAqIGEwMCArIGIwMSAqIGExMCArIGIwMiAqIGEyMDtcbiAgICBvdXRbMV0gPSBiMDAgKiBhMDEgKyBiMDEgKiBhMTEgKyBiMDIgKiBhMjE7XG4gICAgb3V0WzJdID0gYjAwICogYTAyICsgYjAxICogYTEyICsgYjAyICogYTIyO1xuXG4gICAgb3V0WzNdID0gYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwO1xuICAgIG91dFs0XSA9IGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMTtcbiAgICBvdXRbNV0gPSBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjI7XG5cbiAgICBvdXRbNl0gPSBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjA7XG4gICAgb3V0WzddID0gYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxO1xuICAgIG91dFs4XSA9IGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIG1hdDMubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xubWF0My5tdWwgPSBtYXQzLm11bHRpcGx5O1xuXG4vKipcbiAqIFRyYW5zbGF0ZSBhIG1hdDMgYnkgdGhlIGdpdmVuIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byB0cmFuc2xhdGVcbiAqIEBwYXJhbSB7dmVjMn0gdiB2ZWN0b3IgdG8gdHJhbnNsYXRlIGJ5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMudHJhbnNsYXRlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sXG4gICAgICAgIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV0sXG4gICAgICAgIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF0sXG4gICAgICAgIHggPSB2WzBdLCB5ID0gdlsxXTtcblxuICAgIG91dFswXSA9IGEwMDtcbiAgICBvdXRbMV0gPSBhMDE7XG4gICAgb3V0WzJdID0gYTAyO1xuXG4gICAgb3V0WzNdID0gYTEwO1xuICAgIG91dFs0XSA9IGExMTtcbiAgICBvdXRbNV0gPSBhMTI7XG5cbiAgICBvdXRbNl0gPSB4ICogYTAwICsgeSAqIGExMCArIGEyMDtcbiAgICBvdXRbN10gPSB4ICogYTAxICsgeSAqIGExMSArIGEyMTtcbiAgICBvdXRbOF0gPSB4ICogYTAyICsgeSAqIGExMiArIGEyMjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0MyBieSB0aGUgZ2l2ZW4gYW5nbGVcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLnJvdGF0ZSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLFxuICAgICAgICBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdLFxuICAgICAgICBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdLFxuXG4gICAgICAgIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKTtcblxuICAgIG91dFswXSA9IGMgKiBhMDAgKyBzICogYTEwO1xuICAgIG91dFsxXSA9IGMgKiBhMDEgKyBzICogYTExO1xuICAgIG91dFsyXSA9IGMgKiBhMDIgKyBzICogYTEyO1xuXG4gICAgb3V0WzNdID0gYyAqIGExMCAtIHMgKiBhMDA7XG4gICAgb3V0WzRdID0gYyAqIGExMSAtIHMgKiBhMDE7XG4gICAgb3V0WzVdID0gYyAqIGExMiAtIHMgKiBhMDI7XG5cbiAgICBvdXRbNl0gPSBhMjA7XG4gICAgb3V0WzddID0gYTIxO1xuICAgIG91dFs4XSA9IGEyMjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTY2FsZXMgdGhlIG1hdDMgYnkgdGhlIGRpbWVuc2lvbnMgaW4gdGhlIGdpdmVuIHZlYzJcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge3ZlYzJ9IHYgdGhlIHZlYzIgdG8gc2NhbGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDN9IG91dFxuICoqL1xubWF0My5zY2FsZSA9IGZ1bmN0aW9uKG91dCwgYSwgdikge1xuICAgIHZhciB4ID0gdlswXSwgeSA9IHZbMV07XG5cbiAgICBvdXRbMF0gPSB4ICogYVswXTtcbiAgICBvdXRbMV0gPSB4ICogYVsxXTtcbiAgICBvdXRbMl0gPSB4ICogYVsyXTtcblxuICAgIG91dFszXSA9IHkgKiBhWzNdO1xuICAgIG91dFs0XSA9IHkgKiBhWzRdO1xuICAgIG91dFs1XSA9IHkgKiBhWzVdO1xuXG4gICAgb3V0WzZdID0gYVs2XTtcbiAgICBvdXRbN10gPSBhWzddO1xuICAgIG91dFs4XSA9IGFbOF07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHRyYW5zbGF0aW9uXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0My5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQzLnRyYW5zbGF0ZShkZXN0LCBkZXN0LCB2ZWMpO1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7dmVjMn0gdiBUcmFuc2xhdGlvbiB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5mcm9tVHJhbnNsYXRpb24gPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDE7XG4gICAgb3V0WzVdID0gMDtcbiAgICBvdXRbNl0gPSB2WzBdO1xuICAgIG91dFs3XSA9IHZbMV07XG4gICAgb3V0WzhdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIGdpdmVuIGFuZ2xlXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0My5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQzLnJvdGF0ZShkZXN0LCBkZXN0LCByYWQpO1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuZnJvbVJvdGF0aW9uID0gZnVuY3Rpb24ob3V0LCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksIGMgPSBNYXRoLmNvcyhyYWQpO1xuXG4gICAgb3V0WzBdID0gYztcbiAgICBvdXRbMV0gPSBzO1xuICAgIG91dFsyXSA9IDA7XG5cbiAgICBvdXRbM10gPSAtcztcbiAgICBvdXRbNF0gPSBjO1xuICAgIG91dFs1XSA9IDA7XG5cbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZlY3RvciBzY2FsaW5nXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0My5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQzLnNjYWxlKGRlc3QsIGRlc3QsIHZlYyk7XG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgbWF0MyByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHt2ZWMyfSB2IFNjYWxpbmcgdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuZnJvbVNjYWxpbmcgPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSB2WzBdO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcblxuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gdlsxXTtcbiAgICBvdXRbNV0gPSAwO1xuXG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDb3BpZXMgdGhlIHZhbHVlcyBmcm9tIGEgbWF0MmQgaW50byBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIGNvcHlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqKi9cbm1hdDMuZnJvbU1hdDJkID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IDA7XG5cbiAgICBvdXRbM10gPSBhWzJdO1xuICAgIG91dFs0XSA9IGFbM107XG4gICAgb3V0WzVdID0gMDtcblxuICAgIG91dFs2XSA9IGFbNF07XG4gICAgb3V0WzddID0gYVs1XTtcbiAgICBvdXRbOF0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiogQ2FsY3VsYXRlcyBhIDN4MyBtYXRyaXggZnJvbSB0aGUgZ2l2ZW4gcXVhdGVybmlvblxuKlxuKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4qIEBwYXJhbSB7cXVhdH0gcSBRdWF0ZXJuaW9uIHRvIGNyZWF0ZSBtYXRyaXggZnJvbVxuKlxuKiBAcmV0dXJucyB7bWF0M30gb3V0XG4qL1xubWF0My5mcm9tUXVhdCA9IGZ1bmN0aW9uIChvdXQsIHEpIHtcbiAgICB2YXIgeCA9IHFbMF0sIHkgPSBxWzFdLCB6ID0gcVsyXSwgdyA9IHFbM10sXG4gICAgICAgIHgyID0geCArIHgsXG4gICAgICAgIHkyID0geSArIHksXG4gICAgICAgIHoyID0geiArIHosXG5cbiAgICAgICAgeHggPSB4ICogeDIsXG4gICAgICAgIHl4ID0geSAqIHgyLFxuICAgICAgICB5eSA9IHkgKiB5MixcbiAgICAgICAgenggPSB6ICogeDIsXG4gICAgICAgIHp5ID0geiAqIHkyLFxuICAgICAgICB6eiA9IHogKiB6MixcbiAgICAgICAgd3ggPSB3ICogeDIsXG4gICAgICAgIHd5ID0gdyAqIHkyLFxuICAgICAgICB3eiA9IHcgKiB6MjtcblxuICAgIG91dFswXSA9IDEgLSB5eSAtIHp6O1xuICAgIG91dFszXSA9IHl4IC0gd3o7XG4gICAgb3V0WzZdID0genggKyB3eTtcblxuICAgIG91dFsxXSA9IHl4ICsgd3o7XG4gICAgb3V0WzRdID0gMSAtIHh4IC0geno7XG4gICAgb3V0WzddID0genkgLSB3eDtcblxuICAgIG91dFsyXSA9IHp4IC0gd3k7XG4gICAgb3V0WzVdID0genkgKyB3eDtcbiAgICBvdXRbOF0gPSAxIC0geHggLSB5eTtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiogQ2FsY3VsYXRlcyBhIDN4MyBub3JtYWwgbWF0cml4ICh0cmFuc3Bvc2UgaW52ZXJzZSkgZnJvbSB0aGUgNHg0IG1hdHJpeFxuKlxuKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4qIEBwYXJhbSB7bWF0NH0gYSBNYXQ0IHRvIGRlcml2ZSB0aGUgbm9ybWFsIG1hdHJpeCBmcm9tXG4qXG4qIEByZXR1cm5zIHttYXQzfSBvdXRcbiovXG5tYXQzLm5vcm1hbEZyb21NYXQ0ID0gZnVuY3Rpb24gKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdLFxuXG4gICAgICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICAgICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXG4gICAgICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICAgICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXG4gICAgICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICAgICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXG4gICAgICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICAgICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzIsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XG5cbiAgICBpZiAoIWRldCkgeyBcbiAgICAgICAgcmV0dXJuIG51bGw7IFxuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMV0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcbiAgICBvdXRbMl0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcblxuICAgIG91dFszXSA9IChhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDkpICogZGV0O1xuICAgIG91dFs0XSA9IChhMDAgKiBiMTEgLSBhMDIgKiBiMDggKyBhMDMgKiBiMDcpICogZGV0O1xuICAgIG91dFs1XSA9IChhMDEgKiBiMDggLSBhMDAgKiBiMTAgLSBhMDMgKiBiMDYpICogZGV0O1xuXG4gICAgb3V0WzZdID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0WzddID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0WzhdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgbWF0M1xuICpcbiAqIEBwYXJhbSB7bWF0M30gbWF0IG1hdHJpeCB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gKi9cbm1hdDMuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ21hdDMoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIFxuICAgICAgICAgICAgICAgICAgICBhWzNdICsgJywgJyArIGFbNF0gKyAnLCAnICsgYVs1XSArICcsICcgKyBcbiAgICAgICAgICAgICAgICAgICAgYVs2XSArICcsICcgKyBhWzddICsgJywgJyArIGFbOF0gKyAnKSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgRnJvYmVuaXVzIG5vcm0gb2YgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gY2FsY3VsYXRlIEZyb2Jlbml1cyBub3JtIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBGcm9iZW5pdXMgbm9ybVxuICovXG5tYXQzLmZyb2IgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybihNYXRoLnNxcnQoTWF0aC5wb3coYVswXSwgMikgKyBNYXRoLnBvdyhhWzFdLCAyKSArIE1hdGgucG93KGFbMl0sIDIpICsgTWF0aC5wb3coYVszXSwgMikgKyBNYXRoLnBvdyhhWzRdLCAyKSArIE1hdGgucG93KGFbNV0sIDIpICsgTWF0aC5wb3coYVs2XSwgMikgKyBNYXRoLnBvdyhhWzddLCAyKSArIE1hdGgucG93KGFbOF0sIDIpKSlcbn07XG5cbi8qKlxuICogQWRkcyB0d28gbWF0MydzXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKyBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gKyBiWzJdO1xuICAgIG91dFszXSA9IGFbM10gKyBiWzNdO1xuICAgIG91dFs0XSA9IGFbNF0gKyBiWzRdO1xuICAgIG91dFs1XSA9IGFbNV0gKyBiWzVdO1xuICAgIG91dFs2XSA9IGFbNl0gKyBiWzZdO1xuICAgIG91dFs3XSA9IGFbN10gKyBiWzddO1xuICAgIG91dFs4XSA9IGFbOF0gKyBiWzhdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyBtYXRyaXggYiBmcm9tIG1hdHJpeCBhXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLnN1YnRyYWN0ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAtIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAtIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSAtIGJbMl07XG4gICAgb3V0WzNdID0gYVszXSAtIGJbM107XG4gICAgb3V0WzRdID0gYVs0XSAtIGJbNF07XG4gICAgb3V0WzVdID0gYVs1XSAtIGJbNV07XG4gICAgb3V0WzZdID0gYVs2XSAtIGJbNl07XG4gICAgb3V0WzddID0gYVs3XSAtIGJbN107XG4gICAgb3V0WzhdID0gYVs4XSAtIGJbOF07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBtYXQzLnN1YnRyYWN0fVxuICogQGZ1bmN0aW9uXG4gKi9cbm1hdDMuc3ViID0gbWF0My5zdWJ0cmFjdDtcblxuLyoqXG4gKiBNdWx0aXBseSBlYWNoIGVsZW1lbnQgb2YgdGhlIG1hdHJpeCBieSBhIHNjYWxhci5cbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gc2NhbGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIGFtb3VudCB0byBzY2FsZSB0aGUgbWF0cml4J3MgZWxlbWVudHMgYnlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5tdWx0aXBseVNjYWxhciA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiO1xuICAgIG91dFsyXSA9IGFbMl0gKiBiO1xuICAgIG91dFszXSA9IGFbM10gKiBiO1xuICAgIG91dFs0XSA9IGFbNF0gKiBiO1xuICAgIG91dFs1XSA9IGFbNV0gKiBiO1xuICAgIG91dFs2XSA9IGFbNl0gKiBiO1xuICAgIG91dFs3XSA9IGFbN10gKiBiO1xuICAgIG91dFs4XSA9IGFbOF0gKiBiO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIG1hdDMncyBhZnRlciBtdWx0aXBseWluZyBlYWNoIGVsZW1lbnQgb2YgdGhlIHNlY29uZCBvcGVyYW5kIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7bWF0M30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsZSB0aGUgYW1vdW50IHRvIHNjYWxlIGIncyBlbGVtZW50cyBieSBiZWZvcmUgYWRkaW5nXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMubXVsdGlwbHlTY2FsYXJBbmRBZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIsIHNjYWxlKSB7XG4gICAgb3V0WzBdID0gYVswXSArIChiWzBdICogc2NhbGUpO1xuICAgIG91dFsxXSA9IGFbMV0gKyAoYlsxXSAqIHNjYWxlKTtcbiAgICBvdXRbMl0gPSBhWzJdICsgKGJbMl0gKiBzY2FsZSk7XG4gICAgb3V0WzNdID0gYVszXSArIChiWzNdICogc2NhbGUpO1xuICAgIG91dFs0XSA9IGFbNF0gKyAoYls0XSAqIHNjYWxlKTtcbiAgICBvdXRbNV0gPSBhWzVdICsgKGJbNV0gKiBzY2FsZSk7XG4gICAgb3V0WzZdID0gYVs2XSArIChiWzZdICogc2NhbGUpO1xuICAgIG91dFs3XSA9IGFbN10gKyAoYls3XSAqIHNjYWxlKTtcbiAgICBvdXRbOF0gPSBhWzhdICsgKGJbOF0gKiBzY2FsZSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBtYXRyaWNlcyBoYXZlIGV4YWN0bHkgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24gKHdoZW4gY29tcGFyZWQgd2l0aCA9PT0pXG4gKlxuICogQHBhcmFtIHttYXQzfSBhIFRoZSBmaXJzdCBtYXRyaXguXG4gKiBAcGFyYW0ge21hdDN9IGIgVGhlIHNlY29uZCBtYXRyaXguXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgbWF0cmljZXMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbm1hdDMuZXhhY3RFcXVhbHMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhWzBdID09PSBiWzBdICYmIGFbMV0gPT09IGJbMV0gJiYgYVsyXSA9PT0gYlsyXSAmJiBcbiAgICAgICAgICAgYVszXSA9PT0gYlszXSAmJiBhWzRdID09PSBiWzRdICYmIGFbNV0gPT09IGJbNV0gJiZcbiAgICAgICAgICAgYVs2XSA9PT0gYls2XSAmJiBhWzddID09PSBiWzddICYmIGFbOF0gPT09IGJbOF07XG59O1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIG1hdHJpY2VzIGhhdmUgYXBwcm94aW1hdGVseSB0aGUgc2FtZSBlbGVtZW50cyBpbiB0aGUgc2FtZSBwb3NpdGlvbi5cbiAqXG4gKiBAcGFyYW0ge21hdDN9IGEgVGhlIGZpcnN0IG1hdHJpeC5cbiAqIEBwYXJhbSB7bWF0M30gYiBUaGUgc2Vjb25kIG1hdHJpeC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSBtYXRyaWNlcyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xubWF0My5lcXVhbHMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sIGE0ID0gYVs0XSwgYTUgPSBhWzVdLCBhNiA9IGFbNl0sIGE3ID0gYVs3XSwgYTggPSBhWzhdO1xuICAgIHZhciBiMCA9IGJbMF0sIGIxID0gYlsxXSwgYjIgPSBiWzJdLCBiMyA9IGJbM10sIGI0ID0gYls0XSwgYjUgPSBiWzVdLCBiNiA9IGFbNl0sIGI3ID0gYls3XSwgYjggPSBiWzhdO1xuICAgIHJldHVybiAoTWF0aC5hYnMoYTAgLSBiMCkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEwKSwgTWF0aC5hYnMoYjApKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTEgLSBiMSkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGExKSwgTWF0aC5hYnMoYjEpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTIgLSBiMikgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEyKSwgTWF0aC5hYnMoYjIpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTMgLSBiMykgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEzKSwgTWF0aC5hYnMoYjMpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTQgLSBiNCkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE0KSwgTWF0aC5hYnMoYjQpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTUgLSBiNSkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE1KSwgTWF0aC5hYnMoYjUpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTYgLSBiNikgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE2KSwgTWF0aC5hYnMoYjYpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTcgLSBiNykgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE3KSwgTWF0aC5hYnMoYjcpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTggLSBiOCkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGE4KSwgTWF0aC5hYnMoYjgpKSk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gbWF0MztcbiIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgNHg0IE1hdHJpeFxuICogQG5hbWUgbWF0NFxuICovXG52YXIgbWF0NCA9IHtcbiAgc2NhbGFyOiB7fSxcbiAgU0lNRDoge30sXG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaWRlbnRpdHkgbWF0NFxuICpcbiAqIEByZXR1cm5zIHttYXQ0fSBhIG5ldyA0eDQgbWF0cml4XG4gKi9cbm1hdDQuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDE2KTtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMTtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSAxO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgbWF0NCBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gYSBtYXRyaXggdG8gY2xvbmVcbiAqIEByZXR1cm5zIHttYXQ0fSBhIG5ldyA0eDQgbWF0cml4XG4gKi9cbm1hdDQuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDE2KTtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIG91dFs0XSA9IGFbNF07XG4gICAgb3V0WzVdID0gYVs1XTtcbiAgICBvdXRbNl0gPSBhWzZdO1xuICAgIG91dFs3XSA9IGFbN107XG4gICAgb3V0WzhdID0gYVs4XTtcbiAgICBvdXRbOV0gPSBhWzldO1xuICAgIG91dFsxMF0gPSBhWzEwXTtcbiAgICBvdXRbMTFdID0gYVsxMV07XG4gICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgIG91dFsxM10gPSBhWzEzXTtcbiAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBtYXQ0IHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIG91dFs2XSA9IGFbNl07XG4gICAgb3V0WzddID0gYVs3XTtcbiAgICBvdXRbOF0gPSBhWzhdO1xuICAgIG91dFs5XSA9IGFbOV07XG4gICAgb3V0WzEwXSA9IGFbMTBdO1xuICAgIG91dFsxMV0gPSBhWzExXTtcbiAgICBvdXRbMTJdID0gYVsxMl07XG4gICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICBvdXRbMTVdID0gYVsxNV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IG1hdDQgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG0wMCBDb21wb25lbnQgaW4gY29sdW1uIDAsIHJvdyAwIHBvc2l0aW9uIChpbmRleCAwKVxuICogQHBhcmFtIHtOdW1iZXJ9IG0wMSBDb21wb25lbnQgaW4gY29sdW1uIDAsIHJvdyAxIHBvc2l0aW9uIChpbmRleCAxKVxuICogQHBhcmFtIHtOdW1iZXJ9IG0wMiBDb21wb25lbnQgaW4gY29sdW1uIDAsIHJvdyAyIHBvc2l0aW9uIChpbmRleCAyKVxuICogQHBhcmFtIHtOdW1iZXJ9IG0wMyBDb21wb25lbnQgaW4gY29sdW1uIDAsIHJvdyAzIHBvc2l0aW9uIChpbmRleCAzKVxuICogQHBhcmFtIHtOdW1iZXJ9IG0xMCBDb21wb25lbnQgaW4gY29sdW1uIDEsIHJvdyAwIHBvc2l0aW9uIChpbmRleCA0KVxuICogQHBhcmFtIHtOdW1iZXJ9IG0xMSBDb21wb25lbnQgaW4gY29sdW1uIDEsIHJvdyAxIHBvc2l0aW9uIChpbmRleCA1KVxuICogQHBhcmFtIHtOdW1iZXJ9IG0xMiBDb21wb25lbnQgaW4gY29sdW1uIDEsIHJvdyAyIHBvc2l0aW9uIChpbmRleCA2KVxuICogQHBhcmFtIHtOdW1iZXJ9IG0xMyBDb21wb25lbnQgaW4gY29sdW1uIDEsIHJvdyAzIHBvc2l0aW9uIChpbmRleCA3KVxuICogQHBhcmFtIHtOdW1iZXJ9IG0yMCBDb21wb25lbnQgaW4gY29sdW1uIDIsIHJvdyAwIHBvc2l0aW9uIChpbmRleCA4KVxuICogQHBhcmFtIHtOdW1iZXJ9IG0yMSBDb21wb25lbnQgaW4gY29sdW1uIDIsIHJvdyAxIHBvc2l0aW9uIChpbmRleCA5KVxuICogQHBhcmFtIHtOdW1iZXJ9IG0yMiBDb21wb25lbnQgaW4gY29sdW1uIDIsIHJvdyAyIHBvc2l0aW9uIChpbmRleCAxMClcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjMgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMyBwb3NpdGlvbiAoaW5kZXggMTEpXG4gKiBAcGFyYW0ge051bWJlcn0gbTMwIENvbXBvbmVudCBpbiBjb2x1bW4gMywgcm93IDAgcG9zaXRpb24gKGluZGV4IDEyKVxuICogQHBhcmFtIHtOdW1iZXJ9IG0zMSBDb21wb25lbnQgaW4gY29sdW1uIDMsIHJvdyAxIHBvc2l0aW9uIChpbmRleCAxMylcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMzIgQ29tcG9uZW50IGluIGNvbHVtbiAzLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggMTQpXG4gKiBAcGFyYW0ge051bWJlcn0gbTMzIENvbXBvbmVudCBpbiBjb2x1bW4gMywgcm93IDMgcG9zaXRpb24gKGluZGV4IDE1KVxuICogQHJldHVybnMge21hdDR9IEEgbmV3IG1hdDRcbiAqL1xubWF0NC5mcm9tVmFsdWVzID0gZnVuY3Rpb24obTAwLCBtMDEsIG0wMiwgbTAzLCBtMTAsIG0xMSwgbTEyLCBtMTMsIG0yMCwgbTIxLCBtMjIsIG0yMywgbTMwLCBtMzEsIG0zMiwgbTMzKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDE2KTtcbiAgICBvdXRbMF0gPSBtMDA7XG4gICAgb3V0WzFdID0gbTAxO1xuICAgIG91dFsyXSA9IG0wMjtcbiAgICBvdXRbM10gPSBtMDM7XG4gICAgb3V0WzRdID0gbTEwO1xuICAgIG91dFs1XSA9IG0xMTtcbiAgICBvdXRbNl0gPSBtMTI7XG4gICAgb3V0WzddID0gbTEzO1xuICAgIG91dFs4XSA9IG0yMDtcbiAgICBvdXRbOV0gPSBtMjE7XG4gICAgb3V0WzEwXSA9IG0yMjtcbiAgICBvdXRbMTFdID0gbTIzO1xuICAgIG91dFsxMl0gPSBtMzA7XG4gICAgb3V0WzEzXSA9IG0zMTtcbiAgICBvdXRbMTRdID0gbTMyO1xuICAgIG91dFsxNV0gPSBtMzM7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgbWF0NCB0byB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDAgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggMClcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDEgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggMSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDIgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggMilcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMDMgQ29tcG9uZW50IGluIGNvbHVtbiAwLCByb3cgMyBwb3NpdGlvbiAoaW5kZXggMylcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTAgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggNClcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTEgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggNSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTIgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggNilcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMTMgQ29tcG9uZW50IGluIGNvbHVtbiAxLCByb3cgMyBwb3NpdGlvbiAoaW5kZXggNylcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjAgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMCBwb3NpdGlvbiAoaW5kZXggOClcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjEgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggOSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMjIgQ29tcG9uZW50IGluIGNvbHVtbiAyLCByb3cgMiBwb3NpdGlvbiAoaW5kZXggMTApXG4gKiBAcGFyYW0ge051bWJlcn0gbTIzIENvbXBvbmVudCBpbiBjb2x1bW4gMiwgcm93IDMgcG9zaXRpb24gKGluZGV4IDExKVxuICogQHBhcmFtIHtOdW1iZXJ9IG0zMCBDb21wb25lbnQgaW4gY29sdW1uIDMsIHJvdyAwIHBvc2l0aW9uIChpbmRleCAxMilcbiAqIEBwYXJhbSB7TnVtYmVyfSBtMzEgQ29tcG9uZW50IGluIGNvbHVtbiAzLCByb3cgMSBwb3NpdGlvbiAoaW5kZXggMTMpXG4gKiBAcGFyYW0ge051bWJlcn0gbTMyIENvbXBvbmVudCBpbiBjb2x1bW4gMywgcm93IDIgcG9zaXRpb24gKGluZGV4IDE0KVxuICogQHBhcmFtIHtOdW1iZXJ9IG0zMyBDb21wb25lbnQgaW4gY29sdW1uIDMsIHJvdyAzIHBvc2l0aW9uIChpbmRleCAxNSlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5zZXQgPSBmdW5jdGlvbihvdXQsIG0wMCwgbTAxLCBtMDIsIG0wMywgbTEwLCBtMTEsIG0xMiwgbTEzLCBtMjAsIG0yMSwgbTIyLCBtMjMsIG0zMCwgbTMxLCBtMzIsIG0zMykge1xuICAgIG91dFswXSA9IG0wMDtcbiAgICBvdXRbMV0gPSBtMDE7XG4gICAgb3V0WzJdID0gbTAyO1xuICAgIG91dFszXSA9IG0wMztcbiAgICBvdXRbNF0gPSBtMTA7XG4gICAgb3V0WzVdID0gbTExO1xuICAgIG91dFs2XSA9IG0xMjtcbiAgICBvdXRbN10gPSBtMTM7XG4gICAgb3V0WzhdID0gbTIwO1xuICAgIG91dFs5XSA9IG0yMTtcbiAgICBvdXRbMTBdID0gbTIyO1xuICAgIG91dFsxMV0gPSBtMjM7XG4gICAgb3V0WzEyXSA9IG0zMDtcbiAgICBvdXRbMTNdID0gbTMxO1xuICAgIG91dFsxNF0gPSBtMzI7XG4gICAgb3V0WzE1XSA9IG0zMztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuXG4vKipcbiAqIFNldCBhIG1hdDQgdG8gdGhlIGlkZW50aXR5IG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuaWRlbnRpdHkgPSBmdW5jdGlvbihvdXQpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMTtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSAxO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zcG9zZSB0aGUgdmFsdWVzIG9mIGEgbWF0NCBub3QgdXNpbmcgU0lNRFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5zY2FsYXIudHJhbnNwb3NlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgLy8gSWYgd2UgYXJlIHRyYW5zcG9zaW5nIG91cnNlbHZlcyB3ZSBjYW4gc2tpcCBhIGZldyBzdGVwcyBidXQgaGF2ZSB0byBjYWNoZSBzb21lIHZhbHVlc1xuICAgIGlmIChvdXQgPT09IGEpIHtcbiAgICAgICAgdmFyIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgICAgICAgICBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICAgICAgYTIzID0gYVsxMV07XG5cbiAgICAgICAgb3V0WzFdID0gYVs0XTtcbiAgICAgICAgb3V0WzJdID0gYVs4XTtcbiAgICAgICAgb3V0WzNdID0gYVsxMl07XG4gICAgICAgIG91dFs0XSA9IGEwMTtcbiAgICAgICAgb3V0WzZdID0gYVs5XTtcbiAgICAgICAgb3V0WzddID0gYVsxM107XG4gICAgICAgIG91dFs4XSA9IGEwMjtcbiAgICAgICAgb3V0WzldID0gYTEyO1xuICAgICAgICBvdXRbMTFdID0gYVsxNF07XG4gICAgICAgIG91dFsxMl0gPSBhMDM7XG4gICAgICAgIG91dFsxM10gPSBhMTM7XG4gICAgICAgIG91dFsxNF0gPSBhMjM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgb3V0WzBdID0gYVswXTtcbiAgICAgICAgb3V0WzFdID0gYVs0XTtcbiAgICAgICAgb3V0WzJdID0gYVs4XTtcbiAgICAgICAgb3V0WzNdID0gYVsxMl07XG4gICAgICAgIG91dFs0XSA9IGFbMV07XG4gICAgICAgIG91dFs1XSA9IGFbNV07XG4gICAgICAgIG91dFs2XSA9IGFbOV07XG4gICAgICAgIG91dFs3XSA9IGFbMTNdO1xuICAgICAgICBvdXRbOF0gPSBhWzJdO1xuICAgICAgICBvdXRbOV0gPSBhWzZdO1xuICAgICAgICBvdXRbMTBdID0gYVsxMF07XG4gICAgICAgIG91dFsxMV0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzEyXSA9IGFbM107XG4gICAgICAgIG91dFsxM10gPSBhWzddO1xuICAgICAgICBvdXRbMTRdID0gYVsxMV07XG4gICAgICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc3Bvc2UgdGhlIHZhbHVlcyBvZiBhIG1hdDQgdXNpbmcgU0lNRFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5TSU1ELnRyYW5zcG9zZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhMCwgYTEsIGEyLCBhMyxcbiAgICAgICAgdG1wMDEsIHRtcDIzLFxuICAgICAgICBvdXQwLCBvdXQxLCBvdXQyLCBvdXQzO1xuXG4gICAgYTAgPSBTSU1ELkZsb2F0MzJ4NC5sb2FkKGEsIDApO1xuICAgIGExID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCA0KTtcbiAgICBhMiA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgOCk7XG4gICAgYTMgPSBTSU1ELkZsb2F0MzJ4NC5sb2FkKGEsIDEyKTtcblxuICAgIHRtcDAxID0gU0lNRC5GbG9hdDMyeDQuc2h1ZmZsZShhMCwgYTEsIDAsIDEsIDQsIDUpO1xuICAgIHRtcDIzID0gU0lNRC5GbG9hdDMyeDQuc2h1ZmZsZShhMiwgYTMsIDAsIDEsIDQsIDUpO1xuICAgIG91dDAgID0gU0lNRC5GbG9hdDMyeDQuc2h1ZmZsZSh0bXAwMSwgdG1wMjMsIDAsIDIsIDQsIDYpO1xuICAgIG91dDEgID0gU0lNRC5GbG9hdDMyeDQuc2h1ZmZsZSh0bXAwMSwgdG1wMjMsIDEsIDMsIDUsIDcpO1xuICAgIFNJTUQuRmxvYXQzMng0LnN0b3JlKG91dCwgMCwgIG91dDApO1xuICAgIFNJTUQuRmxvYXQzMng0LnN0b3JlKG91dCwgNCwgIG91dDEpO1xuXG4gICAgdG1wMDEgPSBTSU1ELkZsb2F0MzJ4NC5zaHVmZmxlKGEwLCBhMSwgMiwgMywgNiwgNyk7XG4gICAgdG1wMjMgPSBTSU1ELkZsb2F0MzJ4NC5zaHVmZmxlKGEyLCBhMywgMiwgMywgNiwgNyk7XG4gICAgb3V0MiAgPSBTSU1ELkZsb2F0MzJ4NC5zaHVmZmxlKHRtcDAxLCB0bXAyMywgMCwgMiwgNCwgNik7XG4gICAgb3V0MyAgPSBTSU1ELkZsb2F0MzJ4NC5zaHVmZmxlKHRtcDAxLCB0bXAyMywgMSwgMywgNSwgNyk7XG4gICAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCA4LCAgb3V0Mik7XG4gICAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCAxMiwgb3V0Myk7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc3BzZSBhIG1hdDQgdXNpbmcgU0lNRCBpZiBhdmFpbGFibGUgYW5kIGVuYWJsZWRcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQudHJhbnNwb3NlID0gZ2xNYXRyaXguVVNFX1NJTUQgPyBtYXQ0LlNJTUQudHJhbnNwb3NlIDogbWF0NC5zY2FsYXIudHJhbnNwb3NlO1xuXG4vKipcbiAqIEludmVydHMgYSBtYXQ0IG5vdCB1c2luZyBTSU1EXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnNjYWxhci5pbnZlcnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XSxcblxuICAgICAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXG4gICAgICAgIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCxcbiAgICAgICAgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLFxuICAgICAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXG4gICAgICAgIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSxcbiAgICAgICAgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLFxuICAgICAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXG4gICAgICAgIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCxcbiAgICAgICAgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLFxuICAgICAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXG4gICAgICAgIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSxcbiAgICAgICAgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLFxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICAgICAgZGV0ID0gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xuXG4gICAgaWYgKCFkZXQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGRldCA9IDEuMCAvIGRldDtcblxuICAgIG91dFswXSA9IChhMTEgKiBiMTEgLSBhMTIgKiBiMTAgKyBhMTMgKiBiMDkpICogZGV0O1xuICAgIG91dFsxXSA9IChhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDkpICogZGV0O1xuICAgIG91dFsyXSA9IChhMzEgKiBiMDUgLSBhMzIgKiBiMDQgKyBhMzMgKiBiMDMpICogZGV0O1xuICAgIG91dFszXSA9IChhMjIgKiBiMDQgLSBhMjEgKiBiMDUgLSBhMjMgKiBiMDMpICogZGV0O1xuICAgIG91dFs0XSA9IChhMTIgKiBiMDggLSBhMTAgKiBiMTEgLSBhMTMgKiBiMDcpICogZGV0O1xuICAgIG91dFs1XSA9IChhMDAgKiBiMTEgLSBhMDIgKiBiMDggKyBhMDMgKiBiMDcpICogZGV0O1xuICAgIG91dFs2XSA9IChhMzIgKiBiMDIgLSBhMzAgKiBiMDUgLSBhMzMgKiBiMDEpICogZGV0O1xuICAgIG91dFs3XSA9IChhMjAgKiBiMDUgLSBhMjIgKiBiMDIgKyBhMjMgKiBiMDEpICogZGV0O1xuICAgIG91dFs4XSA9IChhMTAgKiBiMTAgLSBhMTEgKiBiMDggKyBhMTMgKiBiMDYpICogZGV0O1xuICAgIG91dFs5XSA9IChhMDEgKiBiMDggLSBhMDAgKiBiMTAgLSBhMDMgKiBiMDYpICogZGV0O1xuICAgIG91dFsxMF0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldDtcbiAgICBvdXRbMTFdID0gKGEyMSAqIGIwMiAtIGEyMCAqIGIwNCAtIGEyMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzEyXSA9IChhMTEgKiBiMDcgLSBhMTAgKiBiMDkgLSBhMTIgKiBiMDYpICogZGV0O1xuICAgIG91dFsxM10gPSAoYTAwICogYjA5IC0gYTAxICogYjA3ICsgYTAyICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTRdID0gKGEzMSAqIGIwMSAtIGEzMCAqIGIwMyAtIGEzMiAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzE1XSA9IChhMjAgKiBiMDMgLSBhMjEgKiBiMDEgKyBhMjIgKiBiMDApICogZGV0O1xuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogSW52ZXJ0cyBhIG1hdDQgdXNpbmcgU0lNRFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5TSU1ELmludmVydCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICB2YXIgcm93MCwgcm93MSwgcm93Miwgcm93MyxcbiAgICAgIHRtcDEsXG4gICAgICBtaW5vcjAsIG1pbm9yMSwgbWlub3IyLCBtaW5vcjMsXG4gICAgICBkZXQsXG4gICAgICBhMCA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgMCksXG4gICAgICBhMSA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgNCksXG4gICAgICBhMiA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgOCksXG4gICAgICBhMyA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgMTIpO1xuXG4gIC8vIENvbXB1dGUgbWF0cml4IGFkanVnYXRlXG4gIHRtcDEgPSBTSU1ELkZsb2F0MzJ4NC5zaHVmZmxlKGEwLCBhMSwgMCwgMSwgNCwgNSk7XG4gIHJvdzEgPSBTSU1ELkZsb2F0MzJ4NC5zaHVmZmxlKGEyLCBhMywgMCwgMSwgNCwgNSk7XG4gIHJvdzAgPSBTSU1ELkZsb2F0MzJ4NC5zaHVmZmxlKHRtcDEsIHJvdzEsIDAsIDIsIDQsIDYpO1xuICByb3cxID0gU0lNRC5GbG9hdDMyeDQuc2h1ZmZsZShyb3cxLCB0bXAxLCAxLCAzLCA1LCA3KTtcbiAgdG1wMSA9IFNJTUQuRmxvYXQzMng0LnNodWZmbGUoYTAsIGExLCAyLCAzLCA2LCA3KTtcbiAgcm93MyA9IFNJTUQuRmxvYXQzMng0LnNodWZmbGUoYTIsIGEzLCAyLCAzLCA2LCA3KTtcbiAgcm93MiA9IFNJTUQuRmxvYXQzMng0LnNodWZmbGUodG1wMSwgcm93MywgMCwgMiwgNCwgNik7XG4gIHJvdzMgPSBTSU1ELkZsb2F0MzJ4NC5zaHVmZmxlKHJvdzMsIHRtcDEsIDEsIDMsIDUsIDcpO1xuXG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0Lm11bChyb3cyLCByb3czKTtcbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh0bXAxLCAxLCAwLCAzLCAyKTtcbiAgbWlub3IwID0gU0lNRC5GbG9hdDMyeDQubXVsKHJvdzEsIHRtcDEpO1xuICBtaW5vcjEgPSBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MCwgdG1wMSk7XG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0LnN3aXp6bGUodG1wMSwgMiwgMywgMCwgMSk7XG4gIG1pbm9yMCA9IFNJTUQuRmxvYXQzMng0LnN1YihTSU1ELkZsb2F0MzJ4NC5tdWwocm93MSwgdG1wMSksIG1pbm9yMCk7XG4gIG1pbm9yMSA9IFNJTUQuRmxvYXQzMng0LnN1YihTSU1ELkZsb2F0MzJ4NC5tdWwocm93MCwgdG1wMSksIG1pbm9yMSk7XG4gIG1pbm9yMSA9IFNJTUQuRmxvYXQzMng0LnN3aXp6bGUobWlub3IxLCAyLCAzLCAwLCAxKTtcblxuICB0bXAxICAgPSBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MSwgcm93Mik7XG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0LnN3aXp6bGUodG1wMSwgMSwgMCwgMywgMik7XG4gIG1pbm9yMCA9IFNJTUQuRmxvYXQzMng0LmFkZChTSU1ELkZsb2F0MzJ4NC5tdWwocm93MywgdG1wMSksIG1pbm9yMCk7XG4gIG1pbm9yMyA9IFNJTUQuRmxvYXQzMng0Lm11bChyb3cwLCB0bXAxKTtcbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh0bXAxLCAyLCAzLCAwLCAxKTtcbiAgbWlub3IwID0gU0lNRC5GbG9hdDMyeDQuc3ViKG1pbm9yMCwgU0lNRC5GbG9hdDMyeDQubXVsKHJvdzMsIHRtcDEpKTtcbiAgbWlub3IzID0gU0lNRC5GbG9hdDMyeDQuc3ViKFNJTUQuRmxvYXQzMng0Lm11bChyb3cwLCB0bXAxKSwgbWlub3IzKTtcbiAgbWlub3IzID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZShtaW5vcjMsIDIsIDMsIDAsIDEpO1xuXG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0Lm11bChTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHJvdzEsIDIsIDMsIDAsIDEpLCByb3czKTtcbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh0bXAxLCAxLCAwLCAzLCAyKTtcbiAgcm93MiAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZShyb3cyLCAyLCAzLCAwLCAxKTtcbiAgbWlub3IwID0gU0lNRC5GbG9hdDMyeDQuYWRkKFNJTUQuRmxvYXQzMng0Lm11bChyb3cyLCB0bXAxKSwgbWlub3IwKTtcbiAgbWlub3IyID0gU0lNRC5GbG9hdDMyeDQubXVsKHJvdzAsIHRtcDEpO1xuICB0bXAxICAgPSBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHRtcDEsIDIsIDMsIDAsIDEpO1xuICBtaW5vcjAgPSBTSU1ELkZsb2F0MzJ4NC5zdWIobWlub3IwLCBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MiwgdG1wMSkpO1xuICBtaW5vcjIgPSBTSU1ELkZsb2F0MzJ4NC5zdWIoU0lNRC5GbG9hdDMyeDQubXVsKHJvdzAsIHRtcDEpLCBtaW5vcjIpO1xuICBtaW5vcjIgPSBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKG1pbm9yMiwgMiwgMywgMCwgMSk7XG5cbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQubXVsKHJvdzAsIHJvdzEpO1xuICB0bXAxICAgPSBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHRtcDEsIDEsIDAsIDMsIDIpO1xuICBtaW5vcjIgPSBTSU1ELkZsb2F0MzJ4NC5hZGQoU0lNRC5GbG9hdDMyeDQubXVsKHJvdzMsIHRtcDEpLCBtaW5vcjIpO1xuICBtaW5vcjMgPSBTSU1ELkZsb2F0MzJ4NC5zdWIoU0lNRC5GbG9hdDMyeDQubXVsKHJvdzIsIHRtcDEpLCBtaW5vcjMpO1xuICB0bXAxICAgPSBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHRtcDEsIDIsIDMsIDAsIDEpO1xuICBtaW5vcjIgPSBTSU1ELkZsb2F0MzJ4NC5zdWIoU0lNRC5GbG9hdDMyeDQubXVsKHJvdzMsIHRtcDEpLCBtaW5vcjIpO1xuICBtaW5vcjMgPSBTSU1ELkZsb2F0MzJ4NC5zdWIobWlub3IzLCBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MiwgdG1wMSkpO1xuXG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0Lm11bChyb3cwLCByb3czKTtcbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh0bXAxLCAxLCAwLCAzLCAyKTtcbiAgbWlub3IxID0gU0lNRC5GbG9hdDMyeDQuc3ViKG1pbm9yMSwgU0lNRC5GbG9hdDMyeDQubXVsKHJvdzIsIHRtcDEpKTtcbiAgbWlub3IyID0gU0lNRC5GbG9hdDMyeDQuYWRkKFNJTUQuRmxvYXQzMng0Lm11bChyb3cxLCB0bXAxKSwgbWlub3IyKTtcbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh0bXAxLCAyLCAzLCAwLCAxKTtcbiAgbWlub3IxID0gU0lNRC5GbG9hdDMyeDQuYWRkKFNJTUQuRmxvYXQzMng0Lm11bChyb3cyLCB0bXAxKSwgbWlub3IxKTtcbiAgbWlub3IyID0gU0lNRC5GbG9hdDMyeDQuc3ViKG1pbm9yMiwgU0lNRC5GbG9hdDMyeDQubXVsKHJvdzEsIHRtcDEpKTtcblxuICB0bXAxICAgPSBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MCwgcm93Mik7XG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0LnN3aXp6bGUodG1wMSwgMSwgMCwgMywgMik7XG4gIG1pbm9yMSA9IFNJTUQuRmxvYXQzMng0LmFkZChTSU1ELkZsb2F0MzJ4NC5tdWwocm93MywgdG1wMSksIG1pbm9yMSk7XG4gIG1pbm9yMyA9IFNJTUQuRmxvYXQzMng0LnN1YihtaW5vcjMsIFNJTUQuRmxvYXQzMng0Lm11bChyb3cxLCB0bXAxKSk7XG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0LnN3aXp6bGUodG1wMSwgMiwgMywgMCwgMSk7XG4gIG1pbm9yMSA9IFNJTUQuRmxvYXQzMng0LnN1YihtaW5vcjEsIFNJTUQuRmxvYXQzMng0Lm11bChyb3czLCB0bXAxKSk7XG4gIG1pbm9yMyA9IFNJTUQuRmxvYXQzMng0LmFkZChTSU1ELkZsb2F0MzJ4NC5tdWwocm93MSwgdG1wMSksIG1pbm9yMyk7XG5cbiAgLy8gQ29tcHV0ZSBtYXRyaXggZGV0ZXJtaW5hbnRcbiAgZGV0ICAgPSBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MCwgbWlub3IwKTtcbiAgZGV0ICAgPSBTSU1ELkZsb2F0MzJ4NC5hZGQoU0lNRC5GbG9hdDMyeDQuc3dpenpsZShkZXQsIDIsIDMsIDAsIDEpLCBkZXQpO1xuICBkZXQgICA9IFNJTUQuRmxvYXQzMng0LmFkZChTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKGRldCwgMSwgMCwgMywgMiksIGRldCk7XG4gIHRtcDEgID0gU0lNRC5GbG9hdDMyeDQucmVjaXByb2NhbEFwcHJveGltYXRpb24oZGV0KTtcbiAgZGV0ICAgPSBTSU1ELkZsb2F0MzJ4NC5zdWIoXG4gICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5hZGQodG1wMSwgdG1wMSksXG4gICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5tdWwoZGV0LCBTSU1ELkZsb2F0MzJ4NC5tdWwodG1wMSwgdG1wMSkpKTtcbiAgZGV0ICAgPSBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKGRldCwgMCwgMCwgMCwgMCk7XG4gIGlmICghZGV0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIENvbXB1dGUgbWF0cml4IGludmVyc2VcbiAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCAwLCAgU0lNRC5GbG9hdDMyeDQubXVsKGRldCwgbWlub3IwKSk7XG4gIFNJTUQuRmxvYXQzMng0LnN0b3JlKG91dCwgNCwgIFNJTUQuRmxvYXQzMng0Lm11bChkZXQsIG1pbm9yMSkpO1xuICBTSU1ELkZsb2F0MzJ4NC5zdG9yZShvdXQsIDgsICBTSU1ELkZsb2F0MzJ4NC5tdWwoZGV0LCBtaW5vcjIpKTtcbiAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCAxMiwgU0lNRC5GbG9hdDMyeDQubXVsKGRldCwgbWlub3IzKSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogSW52ZXJ0cyBhIG1hdDQgdXNpbmcgU0lNRCBpZiBhdmFpbGFibGUgYW5kIGVuYWJsZWRcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuaW52ZXJ0ID0gZ2xNYXRyaXguVVNFX1NJTUQgPyBtYXQ0LlNJTUQuaW52ZXJ0IDogbWF0NC5zY2FsYXIuaW52ZXJ0O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGFkanVnYXRlIG9mIGEgbWF0NCBub3QgdXNpbmcgU0lNRFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5zY2FsYXIuYWRqb2ludCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdO1xuXG4gICAgb3V0WzBdICA9ICAoYTExICogKGEyMiAqIGEzMyAtIGEyMyAqIGEzMikgLSBhMjEgKiAoYTEyICogYTMzIC0gYTEzICogYTMyKSArIGEzMSAqIChhMTIgKiBhMjMgLSBhMTMgKiBhMjIpKTtcbiAgICBvdXRbMV0gID0gLShhMDEgKiAoYTIyICogYTMzIC0gYTIzICogYTMyKSAtIGEyMSAqIChhMDIgKiBhMzMgLSBhMDMgKiBhMzIpICsgYTMxICogKGEwMiAqIGEyMyAtIGEwMyAqIGEyMikpO1xuICAgIG91dFsyXSAgPSAgKGEwMSAqIChhMTIgKiBhMzMgLSBhMTMgKiBhMzIpIC0gYTExICogKGEwMiAqIGEzMyAtIGEwMyAqIGEzMikgKyBhMzEgKiAoYTAyICogYTEzIC0gYTAzICogYTEyKSk7XG4gICAgb3V0WzNdICA9IC0oYTAxICogKGExMiAqIGEyMyAtIGExMyAqIGEyMikgLSBhMTEgKiAoYTAyICogYTIzIC0gYTAzICogYTIyKSArIGEyMSAqIChhMDIgKiBhMTMgLSBhMDMgKiBhMTIpKTtcbiAgICBvdXRbNF0gID0gLShhMTAgKiAoYTIyICogYTMzIC0gYTIzICogYTMyKSAtIGEyMCAqIChhMTIgKiBhMzMgLSBhMTMgKiBhMzIpICsgYTMwICogKGExMiAqIGEyMyAtIGExMyAqIGEyMikpO1xuICAgIG91dFs1XSAgPSAgKGEwMCAqIChhMjIgKiBhMzMgLSBhMjMgKiBhMzIpIC0gYTIwICogKGEwMiAqIGEzMyAtIGEwMyAqIGEzMikgKyBhMzAgKiAoYTAyICogYTIzIC0gYTAzICogYTIyKSk7XG4gICAgb3V0WzZdICA9IC0oYTAwICogKGExMiAqIGEzMyAtIGExMyAqIGEzMikgLSBhMTAgKiAoYTAyICogYTMzIC0gYTAzICogYTMyKSArIGEzMCAqIChhMDIgKiBhMTMgLSBhMDMgKiBhMTIpKTtcbiAgICBvdXRbN10gID0gIChhMDAgKiAoYTEyICogYTIzIC0gYTEzICogYTIyKSAtIGExMCAqIChhMDIgKiBhMjMgLSBhMDMgKiBhMjIpICsgYTIwICogKGEwMiAqIGExMyAtIGEwMyAqIGExMikpO1xuICAgIG91dFs4XSAgPSAgKGExMCAqIChhMjEgKiBhMzMgLSBhMjMgKiBhMzEpIC0gYTIwICogKGExMSAqIGEzMyAtIGExMyAqIGEzMSkgKyBhMzAgKiAoYTExICogYTIzIC0gYTEzICogYTIxKSk7XG4gICAgb3V0WzldICA9IC0oYTAwICogKGEyMSAqIGEzMyAtIGEyMyAqIGEzMSkgLSBhMjAgKiAoYTAxICogYTMzIC0gYTAzICogYTMxKSArIGEzMCAqIChhMDEgKiBhMjMgLSBhMDMgKiBhMjEpKTtcbiAgICBvdXRbMTBdID0gIChhMDAgKiAoYTExICogYTMzIC0gYTEzICogYTMxKSAtIGExMCAqIChhMDEgKiBhMzMgLSBhMDMgKiBhMzEpICsgYTMwICogKGEwMSAqIGExMyAtIGEwMyAqIGExMSkpO1xuICAgIG91dFsxMV0gPSAtKGEwMCAqIChhMTEgKiBhMjMgLSBhMTMgKiBhMjEpIC0gYTEwICogKGEwMSAqIGEyMyAtIGEwMyAqIGEyMSkgKyBhMjAgKiAoYTAxICogYTEzIC0gYTAzICogYTExKSk7XG4gICAgb3V0WzEyXSA9IC0oYTEwICogKGEyMSAqIGEzMiAtIGEyMiAqIGEzMSkgLSBhMjAgKiAoYTExICogYTMyIC0gYTEyICogYTMxKSArIGEzMCAqIChhMTEgKiBhMjIgLSBhMTIgKiBhMjEpKTtcbiAgICBvdXRbMTNdID0gIChhMDAgKiAoYTIxICogYTMyIC0gYTIyICogYTMxKSAtIGEyMCAqIChhMDEgKiBhMzIgLSBhMDIgKiBhMzEpICsgYTMwICogKGEwMSAqIGEyMiAtIGEwMiAqIGEyMSkpO1xuICAgIG91dFsxNF0gPSAtKGEwMCAqIChhMTEgKiBhMzIgLSBhMTIgKiBhMzEpIC0gYTEwICogKGEwMSAqIGEzMiAtIGEwMiAqIGEzMSkgKyBhMzAgKiAoYTAxICogYTEyIC0gYTAyICogYTExKSk7XG4gICAgb3V0WzE1XSA9ICAoYTAwICogKGExMSAqIGEyMiAtIGExMiAqIGEyMSkgLSBhMTAgKiAoYTAxICogYTIyIC0gYTAyICogYTIxKSArIGEyMCAqIChhMDEgKiBhMTIgLSBhMDIgKiBhMTEpKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhZGp1Z2F0ZSBvZiBhIG1hdDQgdXNpbmcgU0lNRFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5TSU1ELmFkam9pbnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgdmFyIGEwLCBhMSwgYTIsIGEzO1xuICB2YXIgcm93MCwgcm93MSwgcm93Miwgcm93MztcbiAgdmFyIHRtcDE7XG4gIHZhciBtaW5vcjAsIG1pbm9yMSwgbWlub3IyLCBtaW5vcjM7XG5cbiAgdmFyIGEwID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCAwKTtcbiAgdmFyIGExID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCA0KTtcbiAgdmFyIGEyID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCA4KTtcbiAgdmFyIGEzID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCAxMik7XG5cbiAgLy8gVHJhbnNwb3NlIHRoZSBzb3VyY2UgbWF0cml4LiAgU29ydCBvZi4gIE5vdCBhIHRydWUgdHJhbnNwb3NlIG9wZXJhdGlvblxuICB0bXAxID0gU0lNRC5GbG9hdDMyeDQuc2h1ZmZsZShhMCwgYTEsIDAsIDEsIDQsIDUpO1xuICByb3cxID0gU0lNRC5GbG9hdDMyeDQuc2h1ZmZsZShhMiwgYTMsIDAsIDEsIDQsIDUpO1xuICByb3cwID0gU0lNRC5GbG9hdDMyeDQuc2h1ZmZsZSh0bXAxLCByb3cxLCAwLCAyLCA0LCA2KTtcbiAgcm93MSA9IFNJTUQuRmxvYXQzMng0LnNodWZmbGUocm93MSwgdG1wMSwgMSwgMywgNSwgNyk7XG5cbiAgdG1wMSA9IFNJTUQuRmxvYXQzMng0LnNodWZmbGUoYTAsIGExLCAyLCAzLCA2LCA3KTtcbiAgcm93MyA9IFNJTUQuRmxvYXQzMng0LnNodWZmbGUoYTIsIGEzLCAyLCAzLCA2LCA3KTtcbiAgcm93MiA9IFNJTUQuRmxvYXQzMng0LnNodWZmbGUodG1wMSwgcm93MywgMCwgMiwgNCwgNik7XG4gIHJvdzMgPSBTSU1ELkZsb2F0MzJ4NC5zaHVmZmxlKHJvdzMsIHRtcDEsIDEsIDMsIDUsIDcpO1xuXG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0Lm11bChyb3cyLCByb3czKTtcbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh0bXAxLCAxLCAwLCAzLCAyKTtcbiAgbWlub3IwID0gU0lNRC5GbG9hdDMyeDQubXVsKHJvdzEsIHRtcDEpO1xuICBtaW5vcjEgPSBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MCwgdG1wMSk7XG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0LnN3aXp6bGUodG1wMSwgMiwgMywgMCwgMSk7XG4gIG1pbm9yMCA9IFNJTUQuRmxvYXQzMng0LnN1YihTSU1ELkZsb2F0MzJ4NC5tdWwocm93MSwgdG1wMSksIG1pbm9yMCk7XG4gIG1pbm9yMSA9IFNJTUQuRmxvYXQzMng0LnN1YihTSU1ELkZsb2F0MzJ4NC5tdWwocm93MCwgdG1wMSksIG1pbm9yMSk7XG4gIG1pbm9yMSA9IFNJTUQuRmxvYXQzMng0LnN3aXp6bGUobWlub3IxLCAyLCAzLCAwLCAxKTtcblxuICB0bXAxICAgPSBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MSwgcm93Mik7XG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0LnN3aXp6bGUodG1wMSwgMSwgMCwgMywgMik7XG4gIG1pbm9yMCA9IFNJTUQuRmxvYXQzMng0LmFkZChTSU1ELkZsb2F0MzJ4NC5tdWwocm93MywgdG1wMSksIG1pbm9yMCk7XG4gIG1pbm9yMyA9IFNJTUQuRmxvYXQzMng0Lm11bChyb3cwLCB0bXAxKTtcbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh0bXAxLCAyLCAzLCAwLCAxKTtcbiAgbWlub3IwID0gU0lNRC5GbG9hdDMyeDQuc3ViKG1pbm9yMCwgU0lNRC5GbG9hdDMyeDQubXVsKHJvdzMsIHRtcDEpKTtcbiAgbWlub3IzID0gU0lNRC5GbG9hdDMyeDQuc3ViKFNJTUQuRmxvYXQzMng0Lm11bChyb3cwLCB0bXAxKSwgbWlub3IzKTtcbiAgbWlub3IzID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZShtaW5vcjMsIDIsIDMsIDAsIDEpO1xuXG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0Lm11bChTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHJvdzEsIDIsIDMsIDAsIDEpLCByb3czKTtcbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh0bXAxLCAxLCAwLCAzLCAyKTtcbiAgcm93MiAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZShyb3cyLCAyLCAzLCAwLCAxKTtcbiAgbWlub3IwID0gU0lNRC5GbG9hdDMyeDQuYWRkKFNJTUQuRmxvYXQzMng0Lm11bChyb3cyLCB0bXAxKSwgbWlub3IwKTtcbiAgbWlub3IyID0gU0lNRC5GbG9hdDMyeDQubXVsKHJvdzAsIHRtcDEpO1xuICB0bXAxICAgPSBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHRtcDEsIDIsIDMsIDAsIDEpO1xuICBtaW5vcjAgPSBTSU1ELkZsb2F0MzJ4NC5zdWIobWlub3IwLCBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MiwgdG1wMSkpO1xuICBtaW5vcjIgPSBTSU1ELkZsb2F0MzJ4NC5zdWIoU0lNRC5GbG9hdDMyeDQubXVsKHJvdzAsIHRtcDEpLCBtaW5vcjIpO1xuICBtaW5vcjIgPSBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKG1pbm9yMiwgMiwgMywgMCwgMSk7XG5cbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQubXVsKHJvdzAsIHJvdzEpO1xuICB0bXAxICAgPSBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHRtcDEsIDEsIDAsIDMsIDIpO1xuICBtaW5vcjIgPSBTSU1ELkZsb2F0MzJ4NC5hZGQoU0lNRC5GbG9hdDMyeDQubXVsKHJvdzMsIHRtcDEpLCBtaW5vcjIpO1xuICBtaW5vcjMgPSBTSU1ELkZsb2F0MzJ4NC5zdWIoU0lNRC5GbG9hdDMyeDQubXVsKHJvdzIsIHRtcDEpLCBtaW5vcjMpO1xuICB0bXAxICAgPSBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHRtcDEsIDIsIDMsIDAsIDEpO1xuICBtaW5vcjIgPSBTSU1ELkZsb2F0MzJ4NC5zdWIoU0lNRC5GbG9hdDMyeDQubXVsKHJvdzMsIHRtcDEpLCBtaW5vcjIpO1xuICBtaW5vcjMgPSBTSU1ELkZsb2F0MzJ4NC5zdWIobWlub3IzLCBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MiwgdG1wMSkpO1xuXG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0Lm11bChyb3cwLCByb3czKTtcbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh0bXAxLCAxLCAwLCAzLCAyKTtcbiAgbWlub3IxID0gU0lNRC5GbG9hdDMyeDQuc3ViKG1pbm9yMSwgU0lNRC5GbG9hdDMyeDQubXVsKHJvdzIsIHRtcDEpKTtcbiAgbWlub3IyID0gU0lNRC5GbG9hdDMyeDQuYWRkKFNJTUQuRmxvYXQzMng0Lm11bChyb3cxLCB0bXAxKSwgbWlub3IyKTtcbiAgdG1wMSAgID0gU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh0bXAxLCAyLCAzLCAwLCAxKTtcbiAgbWlub3IxID0gU0lNRC5GbG9hdDMyeDQuYWRkKFNJTUQuRmxvYXQzMng0Lm11bChyb3cyLCB0bXAxKSwgbWlub3IxKTtcbiAgbWlub3IyID0gU0lNRC5GbG9hdDMyeDQuc3ViKG1pbm9yMiwgU0lNRC5GbG9hdDMyeDQubXVsKHJvdzEsIHRtcDEpKTtcblxuICB0bXAxICAgPSBTSU1ELkZsb2F0MzJ4NC5tdWwocm93MCwgcm93Mik7XG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0LnN3aXp6bGUodG1wMSwgMSwgMCwgMywgMik7XG4gIG1pbm9yMSA9IFNJTUQuRmxvYXQzMng0LmFkZChTSU1ELkZsb2F0MzJ4NC5tdWwocm93MywgdG1wMSksIG1pbm9yMSk7XG4gIG1pbm9yMyA9IFNJTUQuRmxvYXQzMng0LnN1YihtaW5vcjMsIFNJTUQuRmxvYXQzMng0Lm11bChyb3cxLCB0bXAxKSk7XG4gIHRtcDEgICA9IFNJTUQuRmxvYXQzMng0LnN3aXp6bGUodG1wMSwgMiwgMywgMCwgMSk7XG4gIG1pbm9yMSA9IFNJTUQuRmxvYXQzMng0LnN1YihtaW5vcjEsIFNJTUQuRmxvYXQzMng0Lm11bChyb3czLCB0bXAxKSk7XG4gIG1pbm9yMyA9IFNJTUQuRmxvYXQzMng0LmFkZChTSU1ELkZsb2F0MzJ4NC5tdWwocm93MSwgdG1wMSksIG1pbm9yMyk7XG5cbiAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCAwLCAgbWlub3IwKTtcbiAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCA0LCAgbWlub3IxKTtcbiAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCA4LCAgbWlub3IyKTtcbiAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCAxMiwgbWlub3IzKTtcbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgYWRqdWdhdGUgb2YgYSBtYXQ0IHVzaW5nIFNJTUQgaWYgYXZhaWxhYmxlIGFuZCBlbmFibGVkXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG4gbWF0NC5hZGpvaW50ID0gZ2xNYXRyaXguVVNFX1NJTUQgPyBtYXQ0LlNJTUQuYWRqb2ludCA6IG1hdDQuc2NhbGFyLmFkam9pbnQ7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSBtYXQ0XG4gKlxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkZXRlcm1pbmFudCBvZiBhXG4gKi9cbm1hdDQuZGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdLFxuXG4gICAgICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICAgICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXG4gICAgICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICAgICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXG4gICAgICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICAgICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXG4gICAgICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICAgICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzI7XG5cbiAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gICAgcmV0dXJuIGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNjtcbn07XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gbWF0NCdzIGV4cGxpY2l0bHkgdXNpbmcgU0lNRFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIGZpcnN0IG9wZXJhbmQsIG11c3QgYmUgYSBGbG9hdDMyQXJyYXlcbiAqIEBwYXJhbSB7bWF0NH0gYiB0aGUgc2Vjb25kIG9wZXJhbmQsIG11c3QgYmUgYSBGbG9hdDMyQXJyYXlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5TSU1ELm11bHRpcGx5ID0gZnVuY3Rpb24gKG91dCwgYSwgYikge1xuICAgIHZhciBhMCA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgMCk7XG4gICAgdmFyIGExID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCA0KTtcbiAgICB2YXIgYTIgPSBTSU1ELkZsb2F0MzJ4NC5sb2FkKGEsIDgpO1xuICAgIHZhciBhMyA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgMTIpO1xuXG4gICAgdmFyIGIwID0gU0lNRC5GbG9hdDMyeDQubG9hZChiLCAwKTtcbiAgICB2YXIgb3V0MCA9IFNJTUQuRmxvYXQzMng0LmFkZChcbiAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5tdWwoU0lNRC5GbG9hdDMyeDQuc3dpenpsZShiMCwgMCwgMCwgMCwgMCksIGEwKSxcbiAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5hZGQoXG4gICAgICAgICAgICAgICAgICAgICAgIFNJTUQuRmxvYXQzMng0Lm11bChTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKGIwLCAxLCAxLCAxLCAxKSwgYTEpLFxuICAgICAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5hZGQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5tdWwoU0lNRC5GbG9hdDMyeDQuc3dpenpsZShiMCwgMiwgMiwgMiwgMiksIGEyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFNJTUQuRmxvYXQzMng0Lm11bChTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKGIwLCAzLCAzLCAzLCAzKSwgYTMpKSkpO1xuICAgIFNJTUQuRmxvYXQzMng0LnN0b3JlKG91dCwgMCwgb3V0MCk7XG5cbiAgICB2YXIgYjEgPSBTSU1ELkZsb2F0MzJ4NC5sb2FkKGIsIDQpO1xuICAgIHZhciBvdXQxID0gU0lNRC5GbG9hdDMyeDQuYWRkKFxuICAgICAgICAgICAgICAgICAgIFNJTUQuRmxvYXQzMng0Lm11bChTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKGIxLCAwLCAwLCAwLCAwKSwgYTApLFxuICAgICAgICAgICAgICAgICAgIFNJTUQuRmxvYXQzMng0LmFkZChcbiAgICAgICAgICAgICAgICAgICAgICAgU0lNRC5GbG9hdDMyeDQubXVsKFNJTUQuRmxvYXQzMng0LnN3aXp6bGUoYjEsIDEsIDEsIDEsIDEpLCBhMSksXG4gICAgICAgICAgICAgICAgICAgICAgIFNJTUQuRmxvYXQzMng0LmFkZChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFNJTUQuRmxvYXQzMng0Lm11bChTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKGIxLCAyLCAyLCAyLCAyKSwgYTIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgU0lNRC5GbG9hdDMyeDQubXVsKFNJTUQuRmxvYXQzMng0LnN3aXp6bGUoYjEsIDMsIDMsIDMsIDMpLCBhMykpKSk7XG4gICAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCA0LCBvdXQxKTtcblxuICAgIHZhciBiMiA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYiwgOCk7XG4gICAgdmFyIG91dDIgPSBTSU1ELkZsb2F0MzJ4NC5hZGQoXG4gICAgICAgICAgICAgICAgICAgU0lNRC5GbG9hdDMyeDQubXVsKFNJTUQuRmxvYXQzMng0LnN3aXp6bGUoYjIsIDAsIDAsIDAsIDApLCBhMCksXG4gICAgICAgICAgICAgICAgICAgU0lNRC5GbG9hdDMyeDQuYWRkKFxuICAgICAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5tdWwoU0lNRC5GbG9hdDMyeDQuc3dpenpsZShiMiwgMSwgMSwgMSwgMSksIGExKSxcbiAgICAgICAgICAgICAgICAgICAgICAgU0lNRC5GbG9hdDMyeDQuYWRkKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNJTUQuRmxvYXQzMng0Lm11bChTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKGIyLCAyLCAyLCAyLCAyKSwgYTIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNJTUQuRmxvYXQzMng0Lm11bChTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKGIyLCAzLCAzLCAzLCAzKSwgYTMpKSkpO1xuICAgIFNJTUQuRmxvYXQzMng0LnN0b3JlKG91dCwgOCwgb3V0Mik7XG5cbiAgICB2YXIgYjMgPSBTSU1ELkZsb2F0MzJ4NC5sb2FkKGIsIDEyKTtcbiAgICB2YXIgb3V0MyA9IFNJTUQuRmxvYXQzMng0LmFkZChcbiAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5tdWwoU0lNRC5GbG9hdDMyeDQuc3dpenpsZShiMywgMCwgMCwgMCwgMCksIGEwKSxcbiAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5hZGQoXG4gICAgICAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5tdWwoU0lNRC5GbG9hdDMyeDQuc3dpenpsZShiMywgMSwgMSwgMSwgMSksIGExKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFNJTUQuRmxvYXQzMng0LmFkZChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5tdWwoU0lNRC5GbG9hdDMyeDQuc3dpenpsZShiMywgMiwgMiwgMiwgMiksIGEyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5tdWwoU0lNRC5GbG9hdDMyeDQuc3dpenpsZShiMywgMywgMywgMywgMyksIGEzKSkpKTtcbiAgICBTSU1ELkZsb2F0MzJ4NC5zdG9yZShvdXQsIDEyLCBvdXQzKTtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIG1hdDQncyBleHBsaWNpdGx5IG5vdCB1c2luZyBTSU1EXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQ0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnNjYWxhci5tdWx0aXBseSA9IGZ1bmN0aW9uIChvdXQsIGEsIGIpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XTtcblxuICAgIC8vIENhY2hlIG9ubHkgdGhlIGN1cnJlbnQgbGluZSBvZiB0aGUgc2Vjb25kIG1hdHJpeFxuICAgIHZhciBiMCAgPSBiWzBdLCBiMSA9IGJbMV0sIGIyID0gYlsyXSwgYjMgPSBiWzNdO1xuICAgIG91dFswXSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRbMV0gPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0WzJdID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dFszXSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcblxuICAgIGIwID0gYls0XTsgYjEgPSBiWzVdOyBiMiA9IGJbNl07IGIzID0gYls3XTtcbiAgICBvdXRbNF0gPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0WzVdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dFs2XSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRbN10gPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG5cbiAgICBiMCA9IGJbOF07IGIxID0gYls5XTsgYjIgPSBiWzEwXTsgYjMgPSBiWzExXTtcbiAgICBvdXRbOF0gPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0WzldID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dFsxMF0gPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0WzExXSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcblxuICAgIGIwID0gYlsxMl07IGIxID0gYlsxM107IGIyID0gYlsxNF07IGIzID0gYlsxNV07XG4gICAgb3V0WzEyXSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRbMTNdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dFsxNF0gPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0WzE1XSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBtYXQ0J3MgdXNpbmcgU0lNRCBpZiBhdmFpbGFibGUgYW5kIGVuYWJsZWRcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge21hdDR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQubXVsdGlwbHkgPSBnbE1hdHJpeC5VU0VfU0lNRCA/IG1hdDQuU0lNRC5tdWx0aXBseSA6IG1hdDQuc2NhbGFyLm11bHRpcGx5O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgbWF0NC5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG5tYXQ0Lm11bCA9IG1hdDQubXVsdGlwbHk7XG5cbi8qKlxuICogVHJhbnNsYXRlIGEgbWF0NCBieSB0aGUgZ2l2ZW4gdmVjdG9yIG5vdCB1c2luZyBTSU1EXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHRyYW5zbGF0ZVxuICogQHBhcmFtIHt2ZWMzfSB2IHZlY3RvciB0byB0cmFuc2xhdGUgYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5zY2FsYXIudHJhbnNsYXRlID0gZnVuY3Rpb24gKG91dCwgYSwgdikge1xuICAgIHZhciB4ID0gdlswXSwgeSA9IHZbMV0sIHogPSB2WzJdLFxuICAgICAgICBhMDAsIGEwMSwgYTAyLCBhMDMsXG4gICAgICAgIGExMCwgYTExLCBhMTIsIGExMyxcbiAgICAgICAgYTIwLCBhMjEsIGEyMiwgYTIzO1xuXG4gICAgaWYgKGEgPT09IG91dCkge1xuICAgICAgICBvdXRbMTJdID0gYVswXSAqIHggKyBhWzRdICogeSArIGFbOF0gKiB6ICsgYVsxMl07XG4gICAgICAgIG91dFsxM10gPSBhWzFdICogeCArIGFbNV0gKiB5ICsgYVs5XSAqIHogKyBhWzEzXTtcbiAgICAgICAgb3V0WzE0XSA9IGFbMl0gKiB4ICsgYVs2XSAqIHkgKyBhWzEwXSAqIHogKyBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGFbM10gKiB4ICsgYVs3XSAqIHkgKyBhWzExXSAqIHogKyBhWzE1XTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBhMDAgPSBhWzBdOyBhMDEgPSBhWzFdOyBhMDIgPSBhWzJdOyBhMDMgPSBhWzNdO1xuICAgICAgICBhMTAgPSBhWzRdOyBhMTEgPSBhWzVdOyBhMTIgPSBhWzZdOyBhMTMgPSBhWzddO1xuICAgICAgICBhMjAgPSBhWzhdOyBhMjEgPSBhWzldOyBhMjIgPSBhWzEwXTsgYTIzID0gYVsxMV07XG5cbiAgICAgICAgb3V0WzBdID0gYTAwOyBvdXRbMV0gPSBhMDE7IG91dFsyXSA9IGEwMjsgb3V0WzNdID0gYTAzO1xuICAgICAgICBvdXRbNF0gPSBhMTA7IG91dFs1XSA9IGExMTsgb3V0WzZdID0gYTEyOyBvdXRbN10gPSBhMTM7XG4gICAgICAgIG91dFs4XSA9IGEyMDsgb3V0WzldID0gYTIxOyBvdXRbMTBdID0gYTIyOyBvdXRbMTFdID0gYTIzO1xuXG4gICAgICAgIG91dFsxMl0gPSBhMDAgKiB4ICsgYTEwICogeSArIGEyMCAqIHogKyBhWzEyXTtcbiAgICAgICAgb3V0WzEzXSA9IGEwMSAqIHggKyBhMTEgKiB5ICsgYTIxICogeiArIGFbMTNdO1xuICAgICAgICBvdXRbMTRdID0gYTAyICogeCArIGExMiAqIHkgKyBhMjIgKiB6ICsgYVsxNF07XG4gICAgICAgIG91dFsxNV0gPSBhMDMgKiB4ICsgYTEzICogeSArIGEyMyAqIHogKyBhWzE1XTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2xhdGVzIGEgbWF0NCBieSB0aGUgZ2l2ZW4gdmVjdG9yIHVzaW5nIFNJTURcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gdHJhbnNsYXRlXG4gKiBAcGFyYW0ge3ZlYzN9IHYgdmVjdG9yIHRvIHRyYW5zbGF0ZSBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LlNJTUQudHJhbnNsYXRlID0gZnVuY3Rpb24gKG91dCwgYSwgdikge1xuICAgIHZhciBhMCA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgMCksXG4gICAgICAgIGExID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCA0KSxcbiAgICAgICAgYTIgPSBTSU1ELkZsb2F0MzJ4NC5sb2FkKGEsIDgpLFxuICAgICAgICBhMyA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgMTIpLFxuICAgICAgICB2ZWMgPSBTSU1ELkZsb2F0MzJ4NCh2WzBdLCB2WzFdLCB2WzJdICwgMCk7XG5cbiAgICBpZiAoYSAhPT0gb3V0KSB7XG4gICAgICAgIG91dFswXSA9IGFbMF07IG91dFsxXSA9IGFbMV07IG91dFsyXSA9IGFbMl07IG91dFszXSA9IGFbM107XG4gICAgICAgIG91dFs0XSA9IGFbNF07IG91dFs1XSA9IGFbNV07IG91dFs2XSA9IGFbNl07IG91dFs3XSA9IGFbN107XG4gICAgICAgIG91dFs4XSA9IGFbOF07IG91dFs5XSA9IGFbOV07IG91dFsxMF0gPSBhWzEwXTsgb3V0WzExXSA9IGFbMTFdO1xuICAgIH1cblxuICAgIGEwID0gU0lNRC5GbG9hdDMyeDQubXVsKGEwLCBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHZlYywgMCwgMCwgMCwgMCkpO1xuICAgIGExID0gU0lNRC5GbG9hdDMyeDQubXVsKGExLCBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHZlYywgMSwgMSwgMSwgMSkpO1xuICAgIGEyID0gU0lNRC5GbG9hdDMyeDQubXVsKGEyLCBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHZlYywgMiwgMiwgMiwgMikpO1xuXG4gICAgdmFyIHQwID0gU0lNRC5GbG9hdDMyeDQuYWRkKGEwLCBTSU1ELkZsb2F0MzJ4NC5hZGQoYTEsIFNJTUQuRmxvYXQzMng0LmFkZChhMiwgYTMpKSk7XG4gICAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCAxMiwgdDApO1xuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNsYXRlcyBhIG1hdDQgYnkgdGhlIGdpdmVuIHZlY3RvciB1c2luZyBTSU1EIGlmIGF2YWlsYWJsZSBhbmQgZW5hYmxlZFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byB0cmFuc2xhdGVcbiAqIEBwYXJhbSB7dmVjM30gdiB2ZWN0b3IgdG8gdHJhbnNsYXRlIGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQudHJhbnNsYXRlID0gZ2xNYXRyaXguVVNFX1NJTUQgPyBtYXQ0LlNJTUQudHJhbnNsYXRlIDogbWF0NC5zY2FsYXIudHJhbnNsYXRlO1xuXG4vKipcbiAqIFNjYWxlcyB0aGUgbWF0NCBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjMyBub3QgdXNpbmcgdmVjdG9yaXphdGlvblxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byBzY2FsZVxuICogQHBhcmFtIHt2ZWMzfSB2IHRoZSB2ZWMzIHRvIHNjYWxlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqKi9cbm1hdDQuc2NhbGFyLnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIHggPSB2WzBdLCB5ID0gdlsxXSwgeiA9IHZbMl07XG5cbiAgICBvdXRbMF0gPSBhWzBdICogeDtcbiAgICBvdXRbMV0gPSBhWzFdICogeDtcbiAgICBvdXRbMl0gPSBhWzJdICogeDtcbiAgICBvdXRbM10gPSBhWzNdICogeDtcbiAgICBvdXRbNF0gPSBhWzRdICogeTtcbiAgICBvdXRbNV0gPSBhWzVdICogeTtcbiAgICBvdXRbNl0gPSBhWzZdICogeTtcbiAgICBvdXRbN10gPSBhWzddICogeTtcbiAgICBvdXRbOF0gPSBhWzhdICogejtcbiAgICBvdXRbOV0gPSBhWzldICogejtcbiAgICBvdXRbMTBdID0gYVsxMF0gKiB6O1xuICAgIG91dFsxMV0gPSBhWzExXSAqIHo7XG4gICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgIG91dFsxM10gPSBhWzEzXTtcbiAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyB0aGUgbWF0NCBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjMyB1c2luZyB2ZWN0b3JpemF0aW9uXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHNjYWxlXG4gKiBAcGFyYW0ge3ZlYzN9IHYgdGhlIHZlYzMgdG8gc2NhbGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICoqL1xubWF0NC5TSU1ELnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIGEwLCBhMSwgYTI7XG4gICAgdmFyIHZlYyA9IFNJTUQuRmxvYXQzMng0KHZbMF0sIHZbMV0sIHZbMl0sIDApO1xuXG4gICAgYTAgPSBTSU1ELkZsb2F0MzJ4NC5sb2FkKGEsIDApO1xuICAgIFNJTUQuRmxvYXQzMng0LnN0b3JlKFxuICAgICAgICBvdXQsIDAsIFNJTUQuRmxvYXQzMng0Lm11bChhMCwgU0lNRC5GbG9hdDMyeDQuc3dpenpsZSh2ZWMsIDAsIDAsIDAsIDApKSk7XG5cbiAgICBhMSA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgNCk7XG4gICAgU0lNRC5GbG9hdDMyeDQuc3RvcmUoXG4gICAgICAgIG91dCwgNCwgU0lNRC5GbG9hdDMyeDQubXVsKGExLCBTSU1ELkZsb2F0MzJ4NC5zd2l6emxlKHZlYywgMSwgMSwgMSwgMSkpKTtcblxuICAgIGEyID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCA4KTtcbiAgICBTSU1ELkZsb2F0MzJ4NC5zdG9yZShcbiAgICAgICAgb3V0LCA4LCBTSU1ELkZsb2F0MzJ4NC5tdWwoYTIsIFNJTUQuRmxvYXQzMng0LnN3aXp6bGUodmVjLCAyLCAyLCAyLCAyKSkpO1xuXG4gICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgIG91dFsxM10gPSBhWzEzXTtcbiAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyB0aGUgbWF0NCBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjMyB1c2luZyBTSU1EIGlmIGF2YWlsYWJsZSBhbmQgZW5hYmxlZFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byBzY2FsZVxuICogQHBhcmFtIHt2ZWMzfSB2IHRoZSB2ZWMzIHRvIHNjYWxlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5zY2FsZSA9IGdsTWF0cml4LlVTRV9TSU1EID8gbWF0NC5TSU1ELnNjYWxlIDogbWF0NC5zY2FsYXIuc2NhbGU7XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdDQgYnkgdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgZ2l2ZW4gYXhpc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcGFyYW0ge3ZlYzN9IGF4aXMgdGhlIGF4aXMgdG8gcm90YXRlIGFyb3VuZFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnJvdGF0ZSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCwgYXhpcykge1xuICAgIHZhciB4ID0gYXhpc1swXSwgeSA9IGF4aXNbMV0sIHogPSBheGlzWzJdLFxuICAgICAgICBsZW4gPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KSxcbiAgICAgICAgcywgYywgdCxcbiAgICAgICAgYTAwLCBhMDEsIGEwMiwgYTAzLFxuICAgICAgICBhMTAsIGExMSwgYTEyLCBhMTMsXG4gICAgICAgIGEyMCwgYTIxLCBhMjIsIGEyMyxcbiAgICAgICAgYjAwLCBiMDEsIGIwMixcbiAgICAgICAgYjEwLCBiMTEsIGIxMixcbiAgICAgICAgYjIwLCBiMjEsIGIyMjtcblxuICAgIGlmIChNYXRoLmFicyhsZW4pIDwgZ2xNYXRyaXguRVBTSUxPTikgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgbGVuID0gMSAvIGxlbjtcbiAgICB4ICo9IGxlbjtcbiAgICB5ICo9IGxlbjtcbiAgICB6ICo9IGxlbjtcblxuICAgIHMgPSBNYXRoLnNpbihyYWQpO1xuICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIHQgPSAxIC0gYztcblxuICAgIGEwMCA9IGFbMF07IGEwMSA9IGFbMV07IGEwMiA9IGFbMl07IGEwMyA9IGFbM107XG4gICAgYTEwID0gYVs0XTsgYTExID0gYVs1XTsgYTEyID0gYVs2XTsgYTEzID0gYVs3XTtcbiAgICBhMjAgPSBhWzhdOyBhMjEgPSBhWzldOyBhMjIgPSBhWzEwXTsgYTIzID0gYVsxMV07XG5cbiAgICAvLyBDb25zdHJ1Y3QgdGhlIGVsZW1lbnRzIG9mIHRoZSByb3RhdGlvbiBtYXRyaXhcbiAgICBiMDAgPSB4ICogeCAqIHQgKyBjOyBiMDEgPSB5ICogeCAqIHQgKyB6ICogczsgYjAyID0geiAqIHggKiB0IC0geSAqIHM7XG4gICAgYjEwID0geCAqIHkgKiB0IC0geiAqIHM7IGIxMSA9IHkgKiB5ICogdCArIGM7IGIxMiA9IHogKiB5ICogdCArIHggKiBzO1xuICAgIGIyMCA9IHggKiB6ICogdCArIHkgKiBzOyBiMjEgPSB5ICogeiAqIHQgLSB4ICogczsgYjIyID0geiAqIHogKiB0ICsgYztcblxuICAgIC8vIFBlcmZvcm0gcm90YXRpb24tc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzBdID0gYTAwICogYjAwICsgYTEwICogYjAxICsgYTIwICogYjAyO1xuICAgIG91dFsxXSA9IGEwMSAqIGIwMCArIGExMSAqIGIwMSArIGEyMSAqIGIwMjtcbiAgICBvdXRbMl0gPSBhMDIgKiBiMDAgKyBhMTIgKiBiMDEgKyBhMjIgKiBiMDI7XG4gICAgb3V0WzNdID0gYTAzICogYjAwICsgYTEzICogYjAxICsgYTIzICogYjAyO1xuICAgIG91dFs0XSA9IGEwMCAqIGIxMCArIGExMCAqIGIxMSArIGEyMCAqIGIxMjtcbiAgICBvdXRbNV0gPSBhMDEgKiBiMTAgKyBhMTEgKiBiMTEgKyBhMjEgKiBiMTI7XG4gICAgb3V0WzZdID0gYTAyICogYjEwICsgYTEyICogYjExICsgYTIyICogYjEyO1xuICAgIG91dFs3XSA9IGEwMyAqIGIxMCArIGExMyAqIGIxMSArIGEyMyAqIGIxMjtcbiAgICBvdXRbOF0gPSBhMDAgKiBiMjAgKyBhMTAgKiBiMjEgKyBhMjAgKiBiMjI7XG4gICAgb3V0WzldID0gYTAxICogYjIwICsgYTExICogYjIxICsgYTIxICogYjIyO1xuICAgIG91dFsxMF0gPSBhMDIgKiBiMjAgKyBhMTIgKiBiMjEgKyBhMjIgKiBiMjI7XG4gICAgb3V0WzExXSA9IGEwMyAqIGIyMCArIGExMyAqIGIyMSArIGEyMyAqIGIyMjtcblxuICAgIGlmIChhICE9PSBvdXQpIHsgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgbGFzdCByb3dcbiAgICAgICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgICAgICBvdXRbMTNdID0gYVsxM107XG4gICAgICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0cml4IGJ5IHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFggYXhpcyBub3QgdXNpbmcgU0lNRFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuc2NhbGFyLnJvdGF0ZVggPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpLFxuICAgICAgICBhMTAgPSBhWzRdLFxuICAgICAgICBhMTEgPSBhWzVdLFxuICAgICAgICBhMTIgPSBhWzZdLFxuICAgICAgICBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLFxuICAgICAgICBhMjEgPSBhWzldLFxuICAgICAgICBhMjIgPSBhWzEwXSxcbiAgICAgICAgYTIzID0gYVsxMV07XG5cbiAgICBpZiAoYSAhPT0gb3V0KSB7IC8vIElmIHRoZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGRpZmZlciwgY29weSB0aGUgdW5jaGFuZ2VkIHJvd3NcbiAgICAgICAgb3V0WzBdICA9IGFbMF07XG4gICAgICAgIG91dFsxXSAgPSBhWzFdO1xuICAgICAgICBvdXRbMl0gID0gYVsyXTtcbiAgICAgICAgb3V0WzNdICA9IGFbM107XG4gICAgICAgIG91dFsxMl0gPSBhWzEyXTtcbiAgICAgICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgICAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICB9XG5cbiAgICAvLyBQZXJmb3JtIGF4aXMtc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzRdID0gYTEwICogYyArIGEyMCAqIHM7XG4gICAgb3V0WzVdID0gYTExICogYyArIGEyMSAqIHM7XG4gICAgb3V0WzZdID0gYTEyICogYyArIGEyMiAqIHM7XG4gICAgb3V0WzddID0gYTEzICogYyArIGEyMyAqIHM7XG4gICAgb3V0WzhdID0gYTIwICogYyAtIGExMCAqIHM7XG4gICAgb3V0WzldID0gYTIxICogYyAtIGExMSAqIHM7XG4gICAgb3V0WzEwXSA9IGEyMiAqIGMgLSBhMTIgKiBzO1xuICAgIG91dFsxMV0gPSBhMjMgKiBjIC0gYTEzICogcztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0cml4IGJ5IHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFggYXhpcyB1c2luZyBTSU1EXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5TSU1ELnJvdGF0ZVggPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICB2YXIgcyA9IFNJTUQuRmxvYXQzMng0LnNwbGF0KE1hdGguc2luKHJhZCkpLFxuICAgICAgICBjID0gU0lNRC5GbG9hdDMyeDQuc3BsYXQoTWF0aC5jb3MocmFkKSk7XG5cbiAgICBpZiAoYSAhPT0gb3V0KSB7IC8vIElmIHRoZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGRpZmZlciwgY29weSB0aGUgdW5jaGFuZ2VkIHJvd3NcbiAgICAgIG91dFswXSAgPSBhWzBdO1xuICAgICAgb3V0WzFdICA9IGFbMV07XG4gICAgICBvdXRbMl0gID0gYVsyXTtcbiAgICAgIG91dFszXSAgPSBhWzNdO1xuICAgICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgICAgb3V0WzE0XSA9IGFbMTRdO1xuICAgICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICB2YXIgYV8xID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCA0KTtcbiAgICB2YXIgYV8yID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCA4KTtcbiAgICBTSU1ELkZsb2F0MzJ4NC5zdG9yZShvdXQsIDQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgU0lNRC5GbG9hdDMyeDQuYWRkKFNJTUQuRmxvYXQzMng0Lm11bChhXzEsIGMpLCBTSU1ELkZsb2F0MzJ4NC5tdWwoYV8yLCBzKSkpO1xuICAgIFNJTUQuRmxvYXQzMng0LnN0b3JlKG91dCwgOCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5zdWIoU0lNRC5GbG9hdDMyeDQubXVsKGFfMiwgYyksIFNJTUQuRmxvYXQzMng0Lm11bChhXzEsIHMpKSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdHJpeCBieSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBYIGF4aXMgdXNpbmcgU0lNRCBpZiBhdmFpbGFiZSBhbmQgZW5hYmxlZFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQucm90YXRlWCA9IGdsTWF0cml4LlVTRV9TSU1EID8gbWF0NC5TSU1ELnJvdGF0ZVggOiBtYXQ0LnNjYWxhci5yb3RhdGVYO1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXRyaXggYnkgdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWSBheGlzIG5vdCB1c2luZyBTSU1EXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5zY2FsYXIucm90YXRlWSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCksXG4gICAgICAgIGEwMCA9IGFbMF0sXG4gICAgICAgIGEwMSA9IGFbMV0sXG4gICAgICAgIGEwMiA9IGFbMl0sXG4gICAgICAgIGEwMyA9IGFbM10sXG4gICAgICAgIGEyMCA9IGFbOF0sXG4gICAgICAgIGEyMSA9IGFbOV0sXG4gICAgICAgIGEyMiA9IGFbMTBdLFxuICAgICAgICBhMjMgPSBhWzExXTtcblxuICAgIGlmIChhICE9PSBvdXQpIHsgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgcm93c1xuICAgICAgICBvdXRbNF0gID0gYVs0XTtcbiAgICAgICAgb3V0WzVdICA9IGFbNV07XG4gICAgICAgIG91dFs2XSAgPSBhWzZdO1xuICAgICAgICBvdXRbN10gID0gYVs3XTtcbiAgICAgICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgICAgICBvdXRbMTNdID0gYVsxM107XG4gICAgICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbMF0gPSBhMDAgKiBjIC0gYTIwICogcztcbiAgICBvdXRbMV0gPSBhMDEgKiBjIC0gYTIxICogcztcbiAgICBvdXRbMl0gPSBhMDIgKiBjIC0gYTIyICogcztcbiAgICBvdXRbM10gPSBhMDMgKiBjIC0gYTIzICogcztcbiAgICBvdXRbOF0gPSBhMDAgKiBzICsgYTIwICogYztcbiAgICBvdXRbOV0gPSBhMDEgKiBzICsgYTIxICogYztcbiAgICBvdXRbMTBdID0gYTAyICogcyArIGEyMiAqIGM7XG4gICAgb3V0WzExXSA9IGEwMyAqIHMgKyBhMjMgKiBjO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXRyaXggYnkgdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWSBheGlzIHVzaW5nIFNJTURcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LlNJTUQucm90YXRlWSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHZhciBzID0gU0lNRC5GbG9hdDMyeDQuc3BsYXQoTWF0aC5zaW4ocmFkKSksXG4gICAgICAgIGMgPSBTSU1ELkZsb2F0MzJ4NC5zcGxhdChNYXRoLmNvcyhyYWQpKTtcblxuICAgIGlmIChhICE9PSBvdXQpIHsgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgcm93c1xuICAgICAgICBvdXRbNF0gID0gYVs0XTtcbiAgICAgICAgb3V0WzVdICA9IGFbNV07XG4gICAgICAgIG91dFs2XSAgPSBhWzZdO1xuICAgICAgICBvdXRbN10gID0gYVs3XTtcbiAgICAgICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgICAgICBvdXRbMTNdID0gYVsxM107XG4gICAgICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICB2YXIgYV8wID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCAwKTtcbiAgICB2YXIgYV8yID0gU0lNRC5GbG9hdDMyeDQubG9hZChhLCA4KTtcbiAgICBTSU1ELkZsb2F0MzJ4NC5zdG9yZShvdXQsIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgU0lNRC5GbG9hdDMyeDQuc3ViKFNJTUQuRmxvYXQzMng0Lm11bChhXzAsIGMpLCBTSU1ELkZsb2F0MzJ4NC5tdWwoYV8yLCBzKSkpO1xuICAgIFNJTUQuRmxvYXQzMng0LnN0b3JlKG91dCwgOCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBTSU1ELkZsb2F0MzJ4NC5hZGQoU0lNRC5GbG9hdDMyeDQubXVsKGFfMCwgcyksIFNJTUQuRmxvYXQzMng0Lm11bChhXzIsIGMpKSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdHJpeCBieSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBZIGF4aXMgaWYgU0lNRCBhdmFpbGFibGUgYW5kIGVuYWJsZWRcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG4gbWF0NC5yb3RhdGVZID0gZ2xNYXRyaXguVVNFX1NJTUQgPyBtYXQ0LlNJTUQucm90YXRlWSA6IG1hdDQuc2NhbGFyLnJvdGF0ZVk7XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdHJpeCBieSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBaIGF4aXMgbm90IHVzaW5nIFNJTURcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnNjYWxhci5yb3RhdGVaID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKSxcbiAgICAgICAgYTAwID0gYVswXSxcbiAgICAgICAgYTAxID0gYVsxXSxcbiAgICAgICAgYTAyID0gYVsyXSxcbiAgICAgICAgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSxcbiAgICAgICAgYTExID0gYVs1XSxcbiAgICAgICAgYTEyID0gYVs2XSxcbiAgICAgICAgYTEzID0gYVs3XTtcblxuICAgIGlmIChhICE9PSBvdXQpIHsgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgbGFzdCByb3dcbiAgICAgICAgb3V0WzhdICA9IGFbOF07XG4gICAgICAgIG91dFs5XSAgPSBhWzldO1xuICAgICAgICBvdXRbMTBdID0gYVsxMF07XG4gICAgICAgIG91dFsxMV0gPSBhWzExXTtcbiAgICAgICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgICAgICBvdXRbMTNdID0gYVsxM107XG4gICAgICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbMF0gPSBhMDAgKiBjICsgYTEwICogcztcbiAgICBvdXRbMV0gPSBhMDEgKiBjICsgYTExICogcztcbiAgICBvdXRbMl0gPSBhMDIgKiBjICsgYTEyICogcztcbiAgICBvdXRbM10gPSBhMDMgKiBjICsgYTEzICogcztcbiAgICBvdXRbNF0gPSBhMTAgKiBjIC0gYTAwICogcztcbiAgICBvdXRbNV0gPSBhMTEgKiBjIC0gYTAxICogcztcbiAgICBvdXRbNl0gPSBhMTIgKiBjIC0gYTAyICogcztcbiAgICBvdXRbN10gPSBhMTMgKiBjIC0gYTAzICogcztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0cml4IGJ5IHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFogYXhpcyB1c2luZyBTSU1EXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5TSU1ELnJvdGF0ZVogPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICB2YXIgcyA9IFNJTUQuRmxvYXQzMng0LnNwbGF0KE1hdGguc2luKHJhZCkpLFxuICAgICAgICBjID0gU0lNRC5GbG9hdDMyeDQuc3BsYXQoTWF0aC5jb3MocmFkKSk7XG5cbiAgICBpZiAoYSAhPT0gb3V0KSB7IC8vIElmIHRoZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGRpZmZlciwgY29weSB0aGUgdW5jaGFuZ2VkIGxhc3Qgcm93XG4gICAgICAgIG91dFs4XSAgPSBhWzhdO1xuICAgICAgICBvdXRbOV0gID0gYVs5XTtcbiAgICAgICAgb3V0WzEwXSA9IGFbMTBdO1xuICAgICAgICBvdXRbMTFdID0gYVsxMV07XG4gICAgICAgIG91dFsxMl0gPSBhWzEyXTtcbiAgICAgICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgICAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICB9XG5cbiAgICAvLyBQZXJmb3JtIGF4aXMtc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgdmFyIGFfMCA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgMCk7XG4gICAgdmFyIGFfMSA9IFNJTUQuRmxvYXQzMng0LmxvYWQoYSwgNCk7XG4gICAgU0lNRC5GbG9hdDMyeDQuc3RvcmUob3V0LCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgIFNJTUQuRmxvYXQzMng0LmFkZChTSU1ELkZsb2F0MzJ4NC5tdWwoYV8wLCBjKSwgU0lNRC5GbG9hdDMyeDQubXVsKGFfMSwgcykpKTtcbiAgICBTSU1ELkZsb2F0MzJ4NC5zdG9yZShvdXQsIDQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgU0lNRC5GbG9hdDMyeDQuc3ViKFNJTUQuRmxvYXQzMng0Lm11bChhXzEsIGMpLCBTSU1ELkZsb2F0MzJ4NC5tdWwoYV8wLCBzKSkpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXRyaXggYnkgdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWiBheGlzIGlmIFNJTUQgYXZhaWxhYmxlIGFuZCBlbmFibGVkXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xuIG1hdDQucm90YXRlWiA9IGdsTWF0cml4LlVTRV9TSU1EID8gbWF0NC5TSU1ELnJvdGF0ZVogOiBtYXQ0LnNjYWxhci5yb3RhdGVaO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZlY3RvciB0cmFuc2xhdGlvblxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgZGVzdCwgdmVjKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3ZlYzN9IHYgVHJhbnNsYXRpb24gdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVRyYW5zbGF0aW9uID0gZnVuY3Rpb24ob3V0LCB2KSB7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IDE7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gMTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gdlswXTtcbiAgICBvdXRbMTNdID0gdlsxXTtcbiAgICBvdXRbMTRdID0gdlsyXTtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZlY3RvciBzY2FsaW5nXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnNjYWxlKGRlc3QsIGRlc3QsIHZlYyk7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHt2ZWMzfSB2IFNjYWxpbmcgdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVNjYWxpbmcgPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSB2WzBdO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gdlsxXTtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSB2WzJdO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgZ2l2ZW4gYW5nbGUgYXJvdW5kIGEgZ2l2ZW4gYXhpc1xuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC5yb3RhdGUoZGVzdCwgZGVzdCwgcmFkLCBheGlzKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHBhcmFtIHt2ZWMzfSBheGlzIHRoZSBheGlzIHRvIHJvdGF0ZSBhcm91bmRcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tUm90YXRpb24gPSBmdW5jdGlvbihvdXQsIHJhZCwgYXhpcykge1xuICAgIHZhciB4ID0gYXhpc1swXSwgeSA9IGF4aXNbMV0sIHogPSBheGlzWzJdLFxuICAgICAgICBsZW4gPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KSxcbiAgICAgICAgcywgYywgdDtcblxuICAgIGlmIChNYXRoLmFicyhsZW4pIDwgZ2xNYXRyaXguRVBTSUxPTikgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgbGVuID0gMSAvIGxlbjtcbiAgICB4ICo9IGxlbjtcbiAgICB5ICo9IGxlbjtcbiAgICB6ICo9IGxlbjtcblxuICAgIHMgPSBNYXRoLnNpbihyYWQpO1xuICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIHQgPSAxIC0gYztcblxuICAgIC8vIFBlcmZvcm0gcm90YXRpb24tc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzBdID0geCAqIHggKiB0ICsgYztcbiAgICBvdXRbMV0gPSB5ICogeCAqIHQgKyB6ICogcztcbiAgICBvdXRbMl0gPSB6ICogeCAqIHQgLSB5ICogcztcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IHggKiB5ICogdCAtIHogKiBzO1xuICAgIG91dFs1XSA9IHkgKiB5ICogdCArIGM7XG4gICAgb3V0WzZdID0geiAqIHkgKiB0ICsgeCAqIHM7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSB4ICogeiAqIHQgKyB5ICogcztcbiAgICBvdXRbOV0gPSB5ICogeiAqIHQgLSB4ICogcztcbiAgICBvdXRbMTBdID0geiAqIHogKiB0ICsgYztcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBYIGF4aXNcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQucm90YXRlWChkZXN0LCBkZXN0LCByYWQpO1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVhSb3RhdGlvbiA9IGZ1bmN0aW9uKG91dCwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKTtcblxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbMF0gID0gMTtcbiAgICBvdXRbMV0gID0gMDtcbiAgICBvdXRbMl0gID0gMDtcbiAgICBvdXRbM10gID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IGM7XG4gICAgb3V0WzZdID0gcztcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gLXM7XG4gICAgb3V0WzEwXSA9IGM7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9IDA7XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWSBheGlzXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnJvdGF0ZVkoZGVzdCwgZGVzdCwgcmFkKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21ZUm90YXRpb24gPSBmdW5jdGlvbihvdXQsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCk7XG5cbiAgICAvLyBQZXJmb3JtIGF4aXMtc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzBdICA9IGM7XG4gICAgb3V0WzFdICA9IDA7XG4gICAgb3V0WzJdICA9IC1zO1xuICAgIG91dFszXSAgPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMTtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gcztcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSBjO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFogYXhpc1xuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC5yb3RhdGVaKGRlc3QsIGRlc3QsIHJhZCk7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tWlJvdGF0aW9uID0gZnVuY3Rpb24ob3V0LCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuXG4gICAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxuICAgIG91dFswXSAgPSBjO1xuICAgIG91dFsxXSAgPSBzO1xuICAgIG91dFsyXSAgPSAwO1xuICAgIG91dFszXSAgPSAwO1xuICAgIG91dFs0XSA9IC1zO1xuICAgIG91dFs1XSA9IGM7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gMTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24gcm90YXRpb24gYW5kIHZlY3RvciB0cmFuc2xhdGlvblxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgdmVjKTtcbiAqICAgICB2YXIgcXVhdE1hdCA9IG1hdDQuY3JlYXRlKCk7XG4gKiAgICAgcXVhdDQudG9NYXQ0KHF1YXQsIHF1YXRNYXQpO1xuICogICAgIG1hdDQubXVsdGlwbHkoZGVzdCwgcXVhdE1hdCk7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0NH0gcSBSb3RhdGlvbiBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3ZlYzN9IHYgVHJhbnNsYXRpb24gdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVJvdGF0aW9uVHJhbnNsYXRpb24gPSBmdW5jdGlvbiAob3V0LCBxLCB2KSB7XG4gICAgLy8gUXVhdGVybmlvbiBtYXRoXG4gICAgdmFyIHggPSBxWzBdLCB5ID0gcVsxXSwgeiA9IHFbMl0sIHcgPSBxWzNdLFxuICAgICAgICB4MiA9IHggKyB4LFxuICAgICAgICB5MiA9IHkgKyB5LFxuICAgICAgICB6MiA9IHogKyB6LFxuXG4gICAgICAgIHh4ID0geCAqIHgyLFxuICAgICAgICB4eSA9IHggKiB5MixcbiAgICAgICAgeHogPSB4ICogejIsXG4gICAgICAgIHl5ID0geSAqIHkyLFxuICAgICAgICB5eiA9IHkgKiB6MixcbiAgICAgICAgenogPSB6ICogejIsXG4gICAgICAgIHd4ID0gdyAqIHgyLFxuICAgICAgICB3eSA9IHcgKiB5MixcbiAgICAgICAgd3ogPSB3ICogejI7XG5cbiAgICBvdXRbMF0gPSAxIC0gKHl5ICsgenopO1xuICAgIG91dFsxXSA9IHh5ICsgd3o7XG4gICAgb3V0WzJdID0geHogLSB3eTtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IHh5IC0gd3o7XG4gICAgb3V0WzVdID0gMSAtICh4eCArIHp6KTtcbiAgICBvdXRbNl0gPSB5eiArIHd4O1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0geHogKyB3eTtcbiAgICBvdXRbOV0gPSB5eiAtIHd4O1xuICAgIG91dFsxMF0gPSAxIC0gKHh4ICsgeXkpO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSB2WzBdO1xuICAgIG91dFsxM10gPSB2WzFdO1xuICAgIG91dFsxNF0gPSB2WzJdO1xuICAgIG91dFsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdHJhbnNsYXRpb24gdmVjdG9yIGNvbXBvbmVudCBvZiBhIHRyYW5zZm9ybWF0aW9uXG4gKiAgbWF0cml4LiBJZiBhIG1hdHJpeCBpcyBidWlsdCB3aXRoIGZyb21Sb3RhdGlvblRyYW5zbGF0aW9uLFxuICogIHRoZSByZXR1cm5lZCB2ZWN0b3Igd2lsbCBiZSB0aGUgc2FtZSBhcyB0aGUgdHJhbnNsYXRpb24gdmVjdG9yXG4gKiAgb3JpZ2luYWxseSBzdXBwbGllZC5cbiAqIEBwYXJhbSAge3ZlYzN9IG91dCBWZWN0b3IgdG8gcmVjZWl2ZSB0cmFuc2xhdGlvbiBjb21wb25lbnRcbiAqIEBwYXJhbSAge21hdDR9IG1hdCBNYXRyaXggdG8gYmUgZGVjb21wb3NlZCAoaW5wdXQpXG4gKiBAcmV0dXJuIHt2ZWMzfSBvdXRcbiAqL1xubWF0NC5nZXRUcmFuc2xhdGlvbiA9IGZ1bmN0aW9uIChvdXQsIG1hdCkge1xuICBvdXRbMF0gPSBtYXRbMTJdO1xuICBvdXRbMV0gPSBtYXRbMTNdO1xuICBvdXRbMl0gPSBtYXRbMTRdO1xuXG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBxdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgcm90YXRpb25hbCBjb21wb25lbnRcbiAqICBvZiBhIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC4gSWYgYSBtYXRyaXggaXMgYnVpbHQgd2l0aFxuICogIGZyb21Sb3RhdGlvblRyYW5zbGF0aW9uLCB0aGUgcmV0dXJuZWQgcXVhdGVybmlvbiB3aWxsIGJlIHRoZVxuICogIHNhbWUgYXMgdGhlIHF1YXRlcm5pb24gb3JpZ2luYWxseSBzdXBwbGllZC5cbiAqIEBwYXJhbSB7cXVhdH0gb3V0IFF1YXRlcm5pb24gdG8gcmVjZWl2ZSB0aGUgcm90YXRpb24gY29tcG9uZW50XG4gKiBAcGFyYW0ge21hdDR9IG1hdCBNYXRyaXggdG8gYmUgZGVjb21wb3NlZCAoaW5wdXQpXG4gKiBAcmV0dXJuIHtxdWF0fSBvdXRcbiAqL1xubWF0NC5nZXRSb3RhdGlvbiA9IGZ1bmN0aW9uIChvdXQsIG1hdCkge1xuICAvLyBBbGdvcml0aG0gdGFrZW4gZnJvbSBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9nZW9tZXRyeS9yb3RhdGlvbnMvY29udmVyc2lvbnMvbWF0cml4VG9RdWF0ZXJuaW9uL2luZGV4Lmh0bVxuICB2YXIgdHJhY2UgPSBtYXRbMF0gKyBtYXRbNV0gKyBtYXRbMTBdO1xuICB2YXIgUyA9IDA7XG5cbiAgaWYgKHRyYWNlID4gMCkgeyBcbiAgICBTID0gTWF0aC5zcXJ0KHRyYWNlICsgMS4wKSAqIDI7XG4gICAgb3V0WzNdID0gMC4yNSAqIFM7XG4gICAgb3V0WzBdID0gKG1hdFs2XSAtIG1hdFs5XSkgLyBTO1xuICAgIG91dFsxXSA9IChtYXRbOF0gLSBtYXRbMl0pIC8gUzsgXG4gICAgb3V0WzJdID0gKG1hdFsxXSAtIG1hdFs0XSkgLyBTOyBcbiAgfSBlbHNlIGlmICgobWF0WzBdID4gbWF0WzVdKSYobWF0WzBdID4gbWF0WzEwXSkpIHsgXG4gICAgUyA9IE1hdGguc3FydCgxLjAgKyBtYXRbMF0gLSBtYXRbNV0gLSBtYXRbMTBdKSAqIDI7XG4gICAgb3V0WzNdID0gKG1hdFs2XSAtIG1hdFs5XSkgLyBTO1xuICAgIG91dFswXSA9IDAuMjUgKiBTO1xuICAgIG91dFsxXSA9IChtYXRbMV0gKyBtYXRbNF0pIC8gUzsgXG4gICAgb3V0WzJdID0gKG1hdFs4XSArIG1hdFsyXSkgLyBTOyBcbiAgfSBlbHNlIGlmIChtYXRbNV0gPiBtYXRbMTBdKSB7IFxuICAgIFMgPSBNYXRoLnNxcnQoMS4wICsgbWF0WzVdIC0gbWF0WzBdIC0gbWF0WzEwXSkgKiAyO1xuICAgIG91dFszXSA9IChtYXRbOF0gLSBtYXRbMl0pIC8gUztcbiAgICBvdXRbMF0gPSAobWF0WzFdICsgbWF0WzRdKSAvIFM7IFxuICAgIG91dFsxXSA9IDAuMjUgKiBTO1xuICAgIG91dFsyXSA9IChtYXRbNl0gKyBtYXRbOV0pIC8gUzsgXG4gIH0gZWxzZSB7IFxuICAgIFMgPSBNYXRoLnNxcnQoMS4wICsgbWF0WzEwXSAtIG1hdFswXSAtIG1hdFs1XSkgKiAyO1xuICAgIG91dFszXSA9IChtYXRbMV0gLSBtYXRbNF0pIC8gUztcbiAgICBvdXRbMF0gPSAobWF0WzhdICsgbWF0WzJdKSAvIFM7XG4gICAgb3V0WzFdID0gKG1hdFs2XSArIG1hdFs5XSkgLyBTO1xuICAgIG91dFsyXSA9IDAuMjUgKiBTO1xuICB9XG5cbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgcXVhdGVybmlvbiByb3RhdGlvbiwgdmVjdG9yIHRyYW5zbGF0aW9uIGFuZCB2ZWN0b3Igc2NhbGVcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQudHJhbnNsYXRlKGRlc3QsIHZlYyk7XG4gKiAgICAgdmFyIHF1YXRNYXQgPSBtYXQ0LmNyZWF0ZSgpO1xuICogICAgIHF1YXQ0LnRvTWF0NChxdWF0LCBxdWF0TWF0KTtcbiAqICAgICBtYXQ0Lm11bHRpcGx5KGRlc3QsIHF1YXRNYXQpO1xuICogICAgIG1hdDQuc2NhbGUoZGVzdCwgc2NhbGUpXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0NH0gcSBSb3RhdGlvbiBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3ZlYzN9IHYgVHJhbnNsYXRpb24gdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IHMgU2NhbGluZyB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tUm90YXRpb25UcmFuc2xhdGlvblNjYWxlID0gZnVuY3Rpb24gKG91dCwgcSwgdiwgcykge1xuICAgIC8vIFF1YXRlcm5pb24gbWF0aFxuICAgIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgICAgeDIgPSB4ICsgeCxcbiAgICAgICAgeTIgPSB5ICsgeSxcbiAgICAgICAgejIgPSB6ICsgeixcblxuICAgICAgICB4eCA9IHggKiB4MixcbiAgICAgICAgeHkgPSB4ICogeTIsXG4gICAgICAgIHh6ID0geCAqIHoyLFxuICAgICAgICB5eSA9IHkgKiB5MixcbiAgICAgICAgeXogPSB5ICogejIsXG4gICAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgICB3eCA9IHcgKiB4MixcbiAgICAgICAgd3kgPSB3ICogeTIsXG4gICAgICAgIHd6ID0gdyAqIHoyLFxuICAgICAgICBzeCA9IHNbMF0sXG4gICAgICAgIHN5ID0gc1sxXSxcbiAgICAgICAgc3ogPSBzWzJdO1xuXG4gICAgb3V0WzBdID0gKDEgLSAoeXkgKyB6eikpICogc3g7XG4gICAgb3V0WzFdID0gKHh5ICsgd3opICogc3g7XG4gICAgb3V0WzJdID0gKHh6IC0gd3kpICogc3g7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAoeHkgLSB3eikgKiBzeTtcbiAgICBvdXRbNV0gPSAoMSAtICh4eCArIHp6KSkgKiBzeTtcbiAgICBvdXRbNl0gPSAoeXogKyB3eCkgKiBzeTtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9ICh4eiArIHd5KSAqIHN6O1xuICAgIG91dFs5XSA9ICh5eiAtIHd4KSAqIHN6O1xuICAgIG91dFsxMF0gPSAoMSAtICh4eCArIHl5KSkgKiBzejtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gdlswXTtcbiAgICBvdXRbMTNdID0gdlsxXTtcbiAgICBvdXRbMTRdID0gdlsyXTtcbiAgICBvdXRbMTVdID0gMTtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24gcm90YXRpb24sIHZlY3RvciB0cmFuc2xhdGlvbiBhbmQgdmVjdG9yIHNjYWxlLCByb3RhdGluZyBhbmQgc2NhbGluZyBhcm91bmQgdGhlIGdpdmVuIG9yaWdpblxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgdmVjKTtcbiAqICAgICBtYXQ0LnRyYW5zbGF0ZShkZXN0LCBvcmlnaW4pO1xuICogICAgIHZhciBxdWF0TWF0ID0gbWF0NC5jcmVhdGUoKTtcbiAqICAgICBxdWF0NC50b01hdDQocXVhdCwgcXVhdE1hdCk7XG4gKiAgICAgbWF0NC5tdWx0aXBseShkZXN0LCBxdWF0TWF0KTtcbiAqICAgICBtYXQ0LnNjYWxlKGRlc3QsIHNjYWxlKVxuICogICAgIG1hdDQudHJhbnNsYXRlKGRlc3QsIG5lZ2F0aXZlT3JpZ2luKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3F1YXQ0fSBxIFJvdGF0aW9uIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7dmVjM30gdiBUcmFuc2xhdGlvbiB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gcyBTY2FsaW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBvIFRoZSBvcmlnaW4gdmVjdG9yIGFyb3VuZCB3aGljaCB0byBzY2FsZSBhbmQgcm90YXRlXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVJvdGF0aW9uVHJhbnNsYXRpb25TY2FsZU9yaWdpbiA9IGZ1bmN0aW9uIChvdXQsIHEsIHYsIHMsIG8pIHtcbiAgLy8gUXVhdGVybmlvbiBtYXRoXG4gIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgIHgyID0geCArIHgsXG4gICAgICB5MiA9IHkgKyB5LFxuICAgICAgejIgPSB6ICsgeixcblxuICAgICAgeHggPSB4ICogeDIsXG4gICAgICB4eSA9IHggKiB5MixcbiAgICAgIHh6ID0geCAqIHoyLFxuICAgICAgeXkgPSB5ICogeTIsXG4gICAgICB5eiA9IHkgKiB6MixcbiAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgd3ggPSB3ICogeDIsXG4gICAgICB3eSA9IHcgKiB5MixcbiAgICAgIHd6ID0gdyAqIHoyLFxuXG4gICAgICBzeCA9IHNbMF0sXG4gICAgICBzeSA9IHNbMV0sXG4gICAgICBzeiA9IHNbMl0sXG5cbiAgICAgIG94ID0gb1swXSxcbiAgICAgIG95ID0gb1sxXSxcbiAgICAgIG96ID0gb1syXTtcblxuICBvdXRbMF0gPSAoMSAtICh5eSArIHp6KSkgKiBzeDtcbiAgb3V0WzFdID0gKHh5ICsgd3opICogc3g7XG4gIG91dFsyXSA9ICh4eiAtIHd5KSAqIHN4O1xuICBvdXRbM10gPSAwO1xuICBvdXRbNF0gPSAoeHkgLSB3eikgKiBzeTtcbiAgb3V0WzVdID0gKDEgLSAoeHggKyB6eikpICogc3k7XG4gIG91dFs2XSA9ICh5eiArIHd4KSAqIHN5O1xuICBvdXRbN10gPSAwO1xuICBvdXRbOF0gPSAoeHogKyB3eSkgKiBzejtcbiAgb3V0WzldID0gKHl6IC0gd3gpICogc3o7XG4gIG91dFsxMF0gPSAoMSAtICh4eCArIHl5KSkgKiBzejtcbiAgb3V0WzExXSA9IDA7XG4gIG91dFsxMl0gPSB2WzBdICsgb3ggLSAob3V0WzBdICogb3ggKyBvdXRbNF0gKiBveSArIG91dFs4XSAqIG96KTtcbiAgb3V0WzEzXSA9IHZbMV0gKyBveSAtIChvdXRbMV0gKiBveCArIG91dFs1XSAqIG95ICsgb3V0WzldICogb3opO1xuICBvdXRbMTRdID0gdlsyXSArIG96IC0gKG91dFsyXSAqIG94ICsgb3V0WzZdICogb3kgKyBvdXRbMTBdICogb3opO1xuICBvdXRbMTVdID0gMTtcblxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIGEgNHg0IG1hdHJpeCBmcm9tIHRoZSBnaXZlbiBxdWF0ZXJuaW9uXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0fSBxIFF1YXRlcm5pb24gdG8gY3JlYXRlIG1hdHJpeCBmcm9tXG4gKlxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21RdWF0ID0gZnVuY3Rpb24gKG91dCwgcSkge1xuICAgIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgICAgeDIgPSB4ICsgeCxcbiAgICAgICAgeTIgPSB5ICsgeSxcbiAgICAgICAgejIgPSB6ICsgeixcblxuICAgICAgICB4eCA9IHggKiB4MixcbiAgICAgICAgeXggPSB5ICogeDIsXG4gICAgICAgIHl5ID0geSAqIHkyLFxuICAgICAgICB6eCA9IHogKiB4MixcbiAgICAgICAgenkgPSB6ICogeTIsXG4gICAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgICB3eCA9IHcgKiB4MixcbiAgICAgICAgd3kgPSB3ICogeTIsXG4gICAgICAgIHd6ID0gdyAqIHoyO1xuXG4gICAgb3V0WzBdID0gMSAtIHl5IC0geno7XG4gICAgb3V0WzFdID0geXggKyB3ejtcbiAgICBvdXRbMl0gPSB6eCAtIHd5O1xuICAgIG91dFszXSA9IDA7XG5cbiAgICBvdXRbNF0gPSB5eCAtIHd6O1xuICAgIG91dFs1XSA9IDEgLSB4eCAtIHp6O1xuICAgIG91dFs2XSA9IHp5ICsgd3g7XG4gICAgb3V0WzddID0gMDtcblxuICAgIG91dFs4XSA9IHp4ICsgd3k7XG4gICAgb3V0WzldID0genkgLSB3eDtcbiAgICBvdXRbMTBdID0gMSAtIHh4IC0geXk7XG4gICAgb3V0WzExXSA9IDA7XG5cbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIGZydXN0dW0gbWF0cml4IHdpdGggdGhlIGdpdmVuIGJvdW5kc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgZnJ1c3R1bSBtYXRyaXggd2lsbCBiZSB3cml0dGVuIGludG9cbiAqIEBwYXJhbSB7TnVtYmVyfSBsZWZ0IExlZnQgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7TnVtYmVyfSByaWdodCBSaWdodCBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtOdW1iZXJ9IGJvdHRvbSBCb3R0b20gYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7TnVtYmVyfSB0b3AgVG9wIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge051bWJlcn0gbmVhciBOZWFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge051bWJlcn0gZmFyIEZhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZydXN0dW0gPSBmdW5jdGlvbiAob3V0LCBsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsIG5lYXIsIGZhcikge1xuICAgIHZhciBybCA9IDEgLyAocmlnaHQgLSBsZWZ0KSxcbiAgICAgICAgdGIgPSAxIC8gKHRvcCAtIGJvdHRvbSksXG4gICAgICAgIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMF0gPSAobmVhciAqIDIpICogcmw7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAobmVhciAqIDIpICogdGI7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IChyaWdodCArIGxlZnQpICogcmw7XG4gICAgb3V0WzldID0gKHRvcCArIGJvdHRvbSkgKiB0YjtcbiAgICBvdXRbMTBdID0gKGZhciArIG5lYXIpICogbmY7XG4gICAgb3V0WzExXSA9IC0xO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAoZmFyICogbmVhciAqIDIpICogbmY7XG4gICAgb3V0WzE1XSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcGVyc3BlY3RpdmUgcHJvamVjdGlvbiBtYXRyaXggd2l0aCB0aGUgZ2l2ZW4gYm91bmRzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCBmcnVzdHVtIG1hdHJpeCB3aWxsIGJlIHdyaXR0ZW4gaW50b1xuICogQHBhcmFtIHtudW1iZXJ9IGZvdnkgVmVydGljYWwgZmllbGQgb2YgdmlldyBpbiByYWRpYW5zXG4gKiBAcGFyYW0ge251bWJlcn0gYXNwZWN0IEFzcGVjdCByYXRpby4gdHlwaWNhbGx5IHZpZXdwb3J0IHdpZHRoL2hlaWdodFxuICogQHBhcmFtIHtudW1iZXJ9IG5lYXIgTmVhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtudW1iZXJ9IGZhciBGYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5wZXJzcGVjdGl2ZSA9IGZ1bmN0aW9uIChvdXQsIGZvdnksIGFzcGVjdCwgbmVhciwgZmFyKSB7XG4gICAgdmFyIGYgPSAxLjAgLyBNYXRoLnRhbihmb3Z5IC8gMiksXG4gICAgICAgIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMF0gPSBmIC8gYXNwZWN0O1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gZjtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgICBvdXRbMTFdID0gLTE7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9ICgyICogZmFyICogbmVhcikgKiBuZjtcbiAgICBvdXRbMTVdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBwZXJzcGVjdGl2ZSBwcm9qZWN0aW9uIG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBmaWVsZCBvZiB2aWV3LlxuICogVGhpcyBpcyBwcmltYXJpbHkgdXNlZnVsIGZvciBnZW5lcmF0aW5nIHByb2plY3Rpb24gbWF0cmljZXMgdG8gYmUgdXNlZFxuICogd2l0aCB0aGUgc3RpbGwgZXhwZXJpZW1lbnRhbCBXZWJWUiBBUEkuXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCBmcnVzdHVtIG1hdHJpeCB3aWxsIGJlIHdyaXR0ZW4gaW50b1xuICogQHBhcmFtIHtPYmplY3R9IGZvdiBPYmplY3QgY29udGFpbmluZyB0aGUgZm9sbG93aW5nIHZhbHVlczogdXBEZWdyZWVzLCBkb3duRGVncmVlcywgbGVmdERlZ3JlZXMsIHJpZ2h0RGVncmVlc1xuICogQHBhcmFtIHtudW1iZXJ9IG5lYXIgTmVhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtudW1iZXJ9IGZhciBGYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5wZXJzcGVjdGl2ZUZyb21GaWVsZE9mVmlldyA9IGZ1bmN0aW9uIChvdXQsIGZvdiwgbmVhciwgZmFyKSB7XG4gICAgdmFyIHVwVGFuID0gTWF0aC50YW4oZm92LnVwRGVncmVlcyAqIE1hdGguUEkvMTgwLjApLFxuICAgICAgICBkb3duVGFuID0gTWF0aC50YW4oZm92LmRvd25EZWdyZWVzICogTWF0aC5QSS8xODAuMCksXG4gICAgICAgIGxlZnRUYW4gPSBNYXRoLnRhbihmb3YubGVmdERlZ3JlZXMgKiBNYXRoLlBJLzE4MC4wKSxcbiAgICAgICAgcmlnaHRUYW4gPSBNYXRoLnRhbihmb3YucmlnaHREZWdyZWVzICogTWF0aC5QSS8xODAuMCksXG4gICAgICAgIHhTY2FsZSA9IDIuMCAvIChsZWZ0VGFuICsgcmlnaHRUYW4pLFxuICAgICAgICB5U2NhbGUgPSAyLjAgLyAodXBUYW4gKyBkb3duVGFuKTtcblxuICAgIG91dFswXSA9IHhTY2FsZTtcbiAgICBvdXRbMV0gPSAwLjA7XG4gICAgb3V0WzJdID0gMC4wO1xuICAgIG91dFszXSA9IDAuMDtcbiAgICBvdXRbNF0gPSAwLjA7XG4gICAgb3V0WzVdID0geVNjYWxlO1xuICAgIG91dFs2XSA9IDAuMDtcbiAgICBvdXRbN10gPSAwLjA7XG4gICAgb3V0WzhdID0gLSgobGVmdFRhbiAtIHJpZ2h0VGFuKSAqIHhTY2FsZSAqIDAuNSk7XG4gICAgb3V0WzldID0gKCh1cFRhbiAtIGRvd25UYW4pICogeVNjYWxlICogMC41KTtcbiAgICBvdXRbMTBdID0gZmFyIC8gKG5lYXIgLSBmYXIpO1xuICAgIG91dFsxMV0gPSAtMS4wO1xuICAgIG91dFsxMl0gPSAwLjA7XG4gICAgb3V0WzEzXSA9IDAuMDtcbiAgICBvdXRbMTRdID0gKGZhciAqIG5lYXIpIC8gKG5lYXIgLSBmYXIpO1xuICAgIG91dFsxNV0gPSAwLjA7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBvcnRob2dvbmFsIHByb2plY3Rpb24gbWF0cml4IHdpdGggdGhlIGdpdmVuIGJvdW5kc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgZnJ1c3R1bSBtYXRyaXggd2lsbCBiZSB3cml0dGVuIGludG9cbiAqIEBwYXJhbSB7bnVtYmVyfSBsZWZ0IExlZnQgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7bnVtYmVyfSByaWdodCBSaWdodCBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtudW1iZXJ9IGJvdHRvbSBCb3R0b20gYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7bnVtYmVyfSB0b3AgVG9wIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge251bWJlcn0gbmVhciBOZWFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge251bWJlcn0gZmFyIEZhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0Lm9ydGhvID0gZnVuY3Rpb24gKG91dCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcbiAgICB2YXIgbHIgPSAxIC8gKGxlZnQgLSByaWdodCksXG4gICAgICAgIGJ0ID0gMSAvIChib3R0b20gLSB0b3ApLFxuICAgICAgICBuZiA9IDEgLyAobmVhciAtIGZhcik7XG4gICAgb3V0WzBdID0gLTIgKiBscjtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IC0yICogYnQ7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gMiAqIG5mO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAobGVmdCArIHJpZ2h0KSAqIGxyO1xuICAgIG91dFsxM10gPSAodG9wICsgYm90dG9tKSAqIGJ0O1xuICAgIG91dFsxNF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBsb29rLWF0IG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBleWUgcG9zaXRpb24sIGZvY2FsIHBvaW50LCBhbmQgdXAgYXhpc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgZnJ1c3R1bSBtYXRyaXggd2lsbCBiZSB3cml0dGVuIGludG9cbiAqIEBwYXJhbSB7dmVjM30gZXllIFBvc2l0aW9uIG9mIHRoZSB2aWV3ZXJcbiAqIEBwYXJhbSB7dmVjM30gY2VudGVyIFBvaW50IHRoZSB2aWV3ZXIgaXMgbG9va2luZyBhdFxuICogQHBhcmFtIHt2ZWMzfSB1cCB2ZWMzIHBvaW50aW5nIHVwXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQubG9va0F0ID0gZnVuY3Rpb24gKG91dCwgZXllLCBjZW50ZXIsIHVwKSB7XG4gICAgdmFyIHgwLCB4MSwgeDIsIHkwLCB5MSwgeTIsIHowLCB6MSwgejIsIGxlbixcbiAgICAgICAgZXlleCA9IGV5ZVswXSxcbiAgICAgICAgZXlleSA9IGV5ZVsxXSxcbiAgICAgICAgZXlleiA9IGV5ZVsyXSxcbiAgICAgICAgdXB4ID0gdXBbMF0sXG4gICAgICAgIHVweSA9IHVwWzFdLFxuICAgICAgICB1cHogPSB1cFsyXSxcbiAgICAgICAgY2VudGVyeCA9IGNlbnRlclswXSxcbiAgICAgICAgY2VudGVyeSA9IGNlbnRlclsxXSxcbiAgICAgICAgY2VudGVyeiA9IGNlbnRlclsyXTtcblxuICAgIGlmIChNYXRoLmFicyhleWV4IC0gY2VudGVyeCkgPCBnbE1hdHJpeC5FUFNJTE9OICYmXG4gICAgICAgIE1hdGguYWJzKGV5ZXkgLSBjZW50ZXJ5KSA8IGdsTWF0cml4LkVQU0lMT04gJiZcbiAgICAgICAgTWF0aC5hYnMoZXlleiAtIGNlbnRlcnopIDwgZ2xNYXRyaXguRVBTSUxPTikge1xuICAgICAgICByZXR1cm4gbWF0NC5pZGVudGl0eShvdXQpO1xuICAgIH1cblxuICAgIHowID0gZXlleCAtIGNlbnRlcng7XG4gICAgejEgPSBleWV5IC0gY2VudGVyeTtcbiAgICB6MiA9IGV5ZXogLSBjZW50ZXJ6O1xuXG4gICAgbGVuID0gMSAvIE1hdGguc3FydCh6MCAqIHowICsgejEgKiB6MSArIHoyICogejIpO1xuICAgIHowICo9IGxlbjtcbiAgICB6MSAqPSBsZW47XG4gICAgejIgKj0gbGVuO1xuXG4gICAgeDAgPSB1cHkgKiB6MiAtIHVweiAqIHoxO1xuICAgIHgxID0gdXB6ICogejAgLSB1cHggKiB6MjtcbiAgICB4MiA9IHVweCAqIHoxIC0gdXB5ICogejA7XG4gICAgbGVuID0gTWF0aC5zcXJ0KHgwICogeDAgKyB4MSAqIHgxICsgeDIgKiB4Mik7XG4gICAgaWYgKCFsZW4pIHtcbiAgICAgICAgeDAgPSAwO1xuICAgICAgICB4MSA9IDA7XG4gICAgICAgIHgyID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsZW4gPSAxIC8gbGVuO1xuICAgICAgICB4MCAqPSBsZW47XG4gICAgICAgIHgxICo9IGxlbjtcbiAgICAgICAgeDIgKj0gbGVuO1xuICAgIH1cblxuICAgIHkwID0gejEgKiB4MiAtIHoyICogeDE7XG4gICAgeTEgPSB6MiAqIHgwIC0gejAgKiB4MjtcbiAgICB5MiA9IHowICogeDEgLSB6MSAqIHgwO1xuXG4gICAgbGVuID0gTWF0aC5zcXJ0KHkwICogeTAgKyB5MSAqIHkxICsgeTIgKiB5Mik7XG4gICAgaWYgKCFsZW4pIHtcbiAgICAgICAgeTAgPSAwO1xuICAgICAgICB5MSA9IDA7XG4gICAgICAgIHkyID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsZW4gPSAxIC8gbGVuO1xuICAgICAgICB5MCAqPSBsZW47XG4gICAgICAgIHkxICo9IGxlbjtcbiAgICAgICAgeTIgKj0gbGVuO1xuICAgIH1cblxuICAgIG91dFswXSA9IHgwO1xuICAgIG91dFsxXSA9IHkwO1xuICAgIG91dFsyXSA9IHowO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0geDE7XG4gICAgb3V0WzVdID0geTE7XG4gICAgb3V0WzZdID0gejE7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSB4MjtcbiAgICBvdXRbOV0gPSB5MjtcbiAgICBvdXRbMTBdID0gejI7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IC0oeDAgKiBleWV4ICsgeDEgKiBleWV5ICsgeDIgKiBleWV6KTtcbiAgICBvdXRbMTNdID0gLSh5MCAqIGV5ZXggKyB5MSAqIGV5ZXkgKyB5MiAqIGV5ZXopO1xuICAgIG91dFsxNF0gPSAtKHowICogZXlleCArIHoxICogZXlleSArIHoyICogZXlleik7XG4gICAgb3V0WzE1XSA9IDE7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgbWF0NFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gbWF0IG1hdHJpeCB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gKi9cbm1hdDQuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ21hdDQoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIGFbM10gKyAnLCAnICtcbiAgICAgICAgICAgICAgICAgICAgYVs0XSArICcsICcgKyBhWzVdICsgJywgJyArIGFbNl0gKyAnLCAnICsgYVs3XSArICcsICcgK1xuICAgICAgICAgICAgICAgICAgICBhWzhdICsgJywgJyArIGFbOV0gKyAnLCAnICsgYVsxMF0gKyAnLCAnICsgYVsxMV0gKyAnLCAnICtcbiAgICAgICAgICAgICAgICAgICAgYVsxMl0gKyAnLCAnICsgYVsxM10gKyAnLCAnICsgYVsxNF0gKyAnLCAnICsgYVsxNV0gKyAnKSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgRnJvYmVuaXVzIG5vcm0gb2YgYSBtYXQ0XG4gKlxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gY2FsY3VsYXRlIEZyb2Jlbml1cyBub3JtIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBGcm9iZW5pdXMgbm9ybVxuICovXG5tYXQ0LmZyb2IgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybihNYXRoLnNxcnQoTWF0aC5wb3coYVswXSwgMikgKyBNYXRoLnBvdyhhWzFdLCAyKSArIE1hdGgucG93KGFbMl0sIDIpICsgTWF0aC5wb3coYVszXSwgMikgKyBNYXRoLnBvdyhhWzRdLCAyKSArIE1hdGgucG93KGFbNV0sIDIpICsgTWF0aC5wb3coYVs2XSwgMikgKyBNYXRoLnBvdyhhWzddLCAyKSArIE1hdGgucG93KGFbOF0sIDIpICsgTWF0aC5wb3coYVs5XSwgMikgKyBNYXRoLnBvdyhhWzEwXSwgMikgKyBNYXRoLnBvdyhhWzExXSwgMikgKyBNYXRoLnBvdyhhWzEyXSwgMikgKyBNYXRoLnBvdyhhWzEzXSwgMikgKyBNYXRoLnBvdyhhWzE0XSwgMikgKyBNYXRoLnBvdyhhWzE1XSwgMikgKSlcbn07XG5cbi8qKlxuICogQWRkcyB0d28gbWF0NCdzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQ0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKyBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gKyBiWzJdO1xuICAgIG91dFszXSA9IGFbM10gKyBiWzNdO1xuICAgIG91dFs0XSA9IGFbNF0gKyBiWzRdO1xuICAgIG91dFs1XSA9IGFbNV0gKyBiWzVdO1xuICAgIG91dFs2XSA9IGFbNl0gKyBiWzZdO1xuICAgIG91dFs3XSA9IGFbN10gKyBiWzddO1xuICAgIG91dFs4XSA9IGFbOF0gKyBiWzhdO1xuICAgIG91dFs5XSA9IGFbOV0gKyBiWzldO1xuICAgIG91dFsxMF0gPSBhWzEwXSArIGJbMTBdO1xuICAgIG91dFsxMV0gPSBhWzExXSArIGJbMTFdO1xuICAgIG91dFsxMl0gPSBhWzEyXSArIGJbMTJdO1xuICAgIG91dFsxM10gPSBhWzEzXSArIGJbMTNdO1xuICAgIG91dFsxNF0gPSBhWzE0XSArIGJbMTRdO1xuICAgIG91dFsxNV0gPSBhWzE1XSArIGJbMTVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyBtYXRyaXggYiBmcm9tIG1hdHJpeCBhXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQ0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnN1YnRyYWN0ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAtIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAtIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSAtIGJbMl07XG4gICAgb3V0WzNdID0gYVszXSAtIGJbM107XG4gICAgb3V0WzRdID0gYVs0XSAtIGJbNF07XG4gICAgb3V0WzVdID0gYVs1XSAtIGJbNV07XG4gICAgb3V0WzZdID0gYVs2XSAtIGJbNl07XG4gICAgb3V0WzddID0gYVs3XSAtIGJbN107XG4gICAgb3V0WzhdID0gYVs4XSAtIGJbOF07XG4gICAgb3V0WzldID0gYVs5XSAtIGJbOV07XG4gICAgb3V0WzEwXSA9IGFbMTBdIC0gYlsxMF07XG4gICAgb3V0WzExXSA9IGFbMTFdIC0gYlsxMV07XG4gICAgb3V0WzEyXSA9IGFbMTJdIC0gYlsxMl07XG4gICAgb3V0WzEzXSA9IGFbMTNdIC0gYlsxM107XG4gICAgb3V0WzE0XSA9IGFbMTRdIC0gYlsxNF07XG4gICAgb3V0WzE1XSA9IGFbMTVdIC0gYlsxNV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBtYXQ0LnN1YnRyYWN0fVxuICogQGZ1bmN0aW9uXG4gKi9cbm1hdDQuc3ViID0gbWF0NC5zdWJ0cmFjdDtcblxuLyoqXG4gKiBNdWx0aXBseSBlYWNoIGVsZW1lbnQgb2YgdGhlIG1hdHJpeCBieSBhIHNjYWxhci5cbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gc2NhbGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIGFtb3VudCB0byBzY2FsZSB0aGUgbWF0cml4J3MgZWxlbWVudHMgYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5tdWx0aXBseVNjYWxhciA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiO1xuICAgIG91dFsyXSA9IGFbMl0gKiBiO1xuICAgIG91dFszXSA9IGFbM10gKiBiO1xuICAgIG91dFs0XSA9IGFbNF0gKiBiO1xuICAgIG91dFs1XSA9IGFbNV0gKiBiO1xuICAgIG91dFs2XSA9IGFbNl0gKiBiO1xuICAgIG91dFs3XSA9IGFbN10gKiBiO1xuICAgIG91dFs4XSA9IGFbOF0gKiBiO1xuICAgIG91dFs5XSA9IGFbOV0gKiBiO1xuICAgIG91dFsxMF0gPSBhWzEwXSAqIGI7XG4gICAgb3V0WzExXSA9IGFbMTFdICogYjtcbiAgICBvdXRbMTJdID0gYVsxMl0gKiBiO1xuICAgIG91dFsxM10gPSBhWzEzXSAqIGI7XG4gICAgb3V0WzE0XSA9IGFbMTRdICogYjtcbiAgICBvdXRbMTVdID0gYVsxNV0gKiBiO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIG1hdDQncyBhZnRlciBtdWx0aXBseWluZyBlYWNoIGVsZW1lbnQgb2YgdGhlIHNlY29uZCBvcGVyYW5kIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7bWF0NH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsZSB0aGUgYW1vdW50IHRvIHNjYWxlIGIncyBlbGVtZW50cyBieSBiZWZvcmUgYWRkaW5nXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQubXVsdGlwbHlTY2FsYXJBbmRBZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIsIHNjYWxlKSB7XG4gICAgb3V0WzBdID0gYVswXSArIChiWzBdICogc2NhbGUpO1xuICAgIG91dFsxXSA9IGFbMV0gKyAoYlsxXSAqIHNjYWxlKTtcbiAgICBvdXRbMl0gPSBhWzJdICsgKGJbMl0gKiBzY2FsZSk7XG4gICAgb3V0WzNdID0gYVszXSArIChiWzNdICogc2NhbGUpO1xuICAgIG91dFs0XSA9IGFbNF0gKyAoYls0XSAqIHNjYWxlKTtcbiAgICBvdXRbNV0gPSBhWzVdICsgKGJbNV0gKiBzY2FsZSk7XG4gICAgb3V0WzZdID0gYVs2XSArIChiWzZdICogc2NhbGUpO1xuICAgIG91dFs3XSA9IGFbN10gKyAoYls3XSAqIHNjYWxlKTtcbiAgICBvdXRbOF0gPSBhWzhdICsgKGJbOF0gKiBzY2FsZSk7XG4gICAgb3V0WzldID0gYVs5XSArIChiWzldICogc2NhbGUpO1xuICAgIG91dFsxMF0gPSBhWzEwXSArIChiWzEwXSAqIHNjYWxlKTtcbiAgICBvdXRbMTFdID0gYVsxMV0gKyAoYlsxMV0gKiBzY2FsZSk7XG4gICAgb3V0WzEyXSA9IGFbMTJdICsgKGJbMTJdICogc2NhbGUpO1xuICAgIG91dFsxM10gPSBhWzEzXSArIChiWzEzXSAqIHNjYWxlKTtcbiAgICBvdXRbMTRdID0gYVsxNF0gKyAoYlsxNF0gKiBzY2FsZSk7XG4gICAgb3V0WzE1XSA9IGFbMTVdICsgKGJbMTVdICogc2NhbGUpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIG1hdHJpY2VzIGhhdmUgZXhhY3RseSB0aGUgc2FtZSBlbGVtZW50cyBpbiB0aGUgc2FtZSBwb3NpdGlvbiAod2hlbiBjb21wYXJlZCB3aXRoID09PSlcbiAqXG4gKiBAcGFyYW0ge21hdDR9IGEgVGhlIGZpcnN0IG1hdHJpeC5cbiAqIEBwYXJhbSB7bWF0NH0gYiBUaGUgc2Vjb25kIG1hdHJpeC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSBtYXRyaWNlcyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xubWF0NC5leGFjdEVxdWFscyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gPT09IGJbMF0gJiYgYVsxXSA9PT0gYlsxXSAmJiBhWzJdID09PSBiWzJdICYmIGFbM10gPT09IGJbM10gJiYgXG4gICAgICAgICAgIGFbNF0gPT09IGJbNF0gJiYgYVs1XSA9PT0gYls1XSAmJiBhWzZdID09PSBiWzZdICYmIGFbN10gPT09IGJbN10gJiYgXG4gICAgICAgICAgIGFbOF0gPT09IGJbOF0gJiYgYVs5XSA9PT0gYls5XSAmJiBhWzEwXSA9PT0gYlsxMF0gJiYgYVsxMV0gPT09IGJbMTFdICYmXG4gICAgICAgICAgIGFbMTJdID09PSBiWzEyXSAmJiBhWzEzXSA9PT0gYlsxM10gJiYgYVsxNF0gPT09IGJbMTRdICYmIGFbMTVdID09PSBiWzE1XTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgbWF0cmljZXMgaGF2ZSBhcHByb3hpbWF0ZWx5IHRoZSBzYW1lIGVsZW1lbnRzIGluIHRoZSBzYW1lIHBvc2l0aW9uLlxuICpcbiAqIEBwYXJhbSB7bWF0NH0gYSBUaGUgZmlyc3QgbWF0cml4LlxuICogQHBhcmFtIHttYXQ0fSBiIFRoZSBzZWNvbmQgbWF0cml4LlxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIG1hdHJpY2VzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5tYXQ0LmVxdWFscyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgdmFyIGEwICA9IGFbMF0sICBhMSAgPSBhWzFdLCAgYTIgID0gYVsyXSwgIGEzICA9IGFbM10sXG4gICAgICAgIGE0ICA9IGFbNF0sICBhNSAgPSBhWzVdLCAgYTYgID0gYVs2XSwgIGE3ICA9IGFbN10sIFxuICAgICAgICBhOCAgPSBhWzhdLCAgYTkgID0gYVs5XSwgIGExMCA9IGFbMTBdLCBhMTEgPSBhWzExXSwgXG4gICAgICAgIGExMiA9IGFbMTJdLCBhMTMgPSBhWzEzXSwgYTE0ID0gYVsxNF0sIGExNSA9IGFbMTVdO1xuXG4gICAgdmFyIGIwICA9IGJbMF0sICBiMSAgPSBiWzFdLCAgYjIgID0gYlsyXSwgIGIzICA9IGJbM10sXG4gICAgICAgIGI0ICA9IGJbNF0sICBiNSAgPSBiWzVdLCAgYjYgID0gYls2XSwgIGI3ICA9IGJbN10sIFxuICAgICAgICBiOCAgPSBiWzhdLCAgYjkgID0gYls5XSwgIGIxMCA9IGJbMTBdLCBiMTEgPSBiWzExXSwgXG4gICAgICAgIGIxMiA9IGJbMTJdLCBiMTMgPSBiWzEzXSwgYjE0ID0gYlsxNF0sIGIxNSA9IGJbMTVdO1xuXG4gICAgcmV0dXJuIChNYXRoLmFicyhhMCAtIGIwKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTApLCBNYXRoLmFicyhiMCkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMSAtIGIxKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTEpLCBNYXRoLmFicyhiMSkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMiAtIGIyKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTIpLCBNYXRoLmFicyhiMikpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMyAtIGIzKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTMpLCBNYXRoLmFicyhiMykpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhNCAtIGI0KSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTQpLCBNYXRoLmFicyhiNCkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhNSAtIGI1KSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTUpLCBNYXRoLmFicyhiNSkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhNiAtIGI2KSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTYpLCBNYXRoLmFicyhiNikpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhNyAtIGI3KSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTcpLCBNYXRoLmFicyhiNykpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhOCAtIGI4KSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTgpLCBNYXRoLmFicyhiOCkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhOSAtIGI5KSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTkpLCBNYXRoLmFicyhiOSkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMTAgLSBiMTApIDw9IGdsTWF0cml4LkVQU0lMT04qTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhMTApLCBNYXRoLmFicyhiMTApKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTExIC0gYjExKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTExKSwgTWF0aC5hYnMoYjExKSkgJiZcbiAgICAgICAgICAgIE1hdGguYWJzKGExMiAtIGIxMikgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGExMiksIE1hdGguYWJzKGIxMikpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMTMgLSBiMTMpIDw9IGdsTWF0cml4LkVQU0lMT04qTWF0aC5tYXgoMS4wLCBNYXRoLmFicyhhMTMpLCBNYXRoLmFicyhiMTMpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTE0IC0gYjE0KSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTE0KSwgTWF0aC5hYnMoYjE0KSkgJiZcbiAgICAgICAgICAgIE1hdGguYWJzKGExNSAtIGIxNSkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGExNSksIE1hdGguYWJzKGIxNSkpKTtcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdDQ7XG4iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG52YXIgZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9jb21tb24uanNcIik7XG52YXIgbWF0MyA9IHJlcXVpcmUoXCIuL21hdDMuanNcIik7XG52YXIgdmVjMyA9IHJlcXVpcmUoXCIuL3ZlYzMuanNcIik7XG52YXIgdmVjNCA9IHJlcXVpcmUoXCIuL3ZlYzQuanNcIik7XG5cbi8qKlxuICogQGNsYXNzIFF1YXRlcm5pb25cbiAqIEBuYW1lIHF1YXRcbiAqL1xudmFyIHF1YXQgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGlkZW50aXR5IHF1YXRcbiAqXG4gKiBAcmV0dXJucyB7cXVhdH0gYSBuZXcgcXVhdGVybmlvblxuICovXG5xdWF0LmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg0KTtcbiAgICBvdXRbMF0gPSAwO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldHMgYSBxdWF0ZXJuaW9uIHRvIHJlcHJlc2VudCB0aGUgc2hvcnRlc3Qgcm90YXRpb24gZnJvbSBvbmVcbiAqIHZlY3RvciB0byBhbm90aGVyLlxuICpcbiAqIEJvdGggdmVjdG9ycyBhcmUgYXNzdW1lZCB0byBiZSB1bml0IGxlbmd0aC5cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb24uXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGluaXRpYWwgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIGRlc3RpbmF0aW9uIHZlY3RvclxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LnJvdGF0aW9uVG8gPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRtcHZlYzMgPSB2ZWMzLmNyZWF0ZSgpO1xuICAgIHZhciB4VW5pdFZlYzMgPSB2ZWMzLmZyb21WYWx1ZXMoMSwwLDApO1xuICAgIHZhciB5VW5pdFZlYzMgPSB2ZWMzLmZyb21WYWx1ZXMoMCwxLDApO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgICAgICB2YXIgZG90ID0gdmVjMy5kb3QoYSwgYik7XG4gICAgICAgIGlmIChkb3QgPCAtMC45OTk5OTkpIHtcbiAgICAgICAgICAgIHZlYzMuY3Jvc3ModG1wdmVjMywgeFVuaXRWZWMzLCBhKTtcbiAgICAgICAgICAgIGlmICh2ZWMzLmxlbmd0aCh0bXB2ZWMzKSA8IDAuMDAwMDAxKVxuICAgICAgICAgICAgICAgIHZlYzMuY3Jvc3ModG1wdmVjMywgeVVuaXRWZWMzLCBhKTtcbiAgICAgICAgICAgIHZlYzMubm9ybWFsaXplKHRtcHZlYzMsIHRtcHZlYzMpO1xuICAgICAgICAgICAgcXVhdC5zZXRBeGlzQW5nbGUob3V0LCB0bXB2ZWMzLCBNYXRoLlBJKTtcbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoZG90ID4gMC45OTk5OTkpIHtcbiAgICAgICAgICAgIG91dFswXSA9IDA7XG4gICAgICAgICAgICBvdXRbMV0gPSAwO1xuICAgICAgICAgICAgb3V0WzJdID0gMDtcbiAgICAgICAgICAgIG91dFszXSA9IDE7XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmVjMy5jcm9zcyh0bXB2ZWMzLCBhLCBiKTtcbiAgICAgICAgICAgIG91dFswXSA9IHRtcHZlYzNbMF07XG4gICAgICAgICAgICBvdXRbMV0gPSB0bXB2ZWMzWzFdO1xuICAgICAgICAgICAgb3V0WzJdID0gdG1wdmVjM1syXTtcbiAgICAgICAgICAgIG91dFszXSA9IDEgKyBkb3Q7XG4gICAgICAgICAgICByZXR1cm4gcXVhdC5ub3JtYWxpemUob3V0LCBvdXQpO1xuICAgICAgICB9XG4gICAgfTtcbn0pKCk7XG5cbi8qKlxuICogU2V0cyB0aGUgc3BlY2lmaWVkIHF1YXRlcm5pb24gd2l0aCB2YWx1ZXMgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW5cbiAqIGF4ZXMuIEVhY2ggYXhpcyBpcyBhIHZlYzMgYW5kIGlzIGV4cGVjdGVkIHRvIGJlIHVuaXQgbGVuZ3RoIGFuZFxuICogcGVycGVuZGljdWxhciB0byBhbGwgb3RoZXIgc3BlY2lmaWVkIGF4ZXMuXG4gKlxuICogQHBhcmFtIHt2ZWMzfSB2aWV3ICB0aGUgdmVjdG9yIHJlcHJlc2VudGluZyB0aGUgdmlld2luZyBkaXJlY3Rpb25cbiAqIEBwYXJhbSB7dmVjM30gcmlnaHQgdGhlIHZlY3RvciByZXByZXNlbnRpbmcgdGhlIGxvY2FsIFwicmlnaHRcIiBkaXJlY3Rpb25cbiAqIEBwYXJhbSB7dmVjM30gdXAgICAgdGhlIHZlY3RvciByZXByZXNlbnRpbmcgdGhlIGxvY2FsIFwidXBcIiBkaXJlY3Rpb25cbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5zZXRBeGVzID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYXRyID0gbWF0My5jcmVhdGUoKTtcblxuICAgIHJldHVybiBmdW5jdGlvbihvdXQsIHZpZXcsIHJpZ2h0LCB1cCkge1xuICAgICAgICBtYXRyWzBdID0gcmlnaHRbMF07XG4gICAgICAgIG1hdHJbM10gPSByaWdodFsxXTtcbiAgICAgICAgbWF0cls2XSA9IHJpZ2h0WzJdO1xuXG4gICAgICAgIG1hdHJbMV0gPSB1cFswXTtcbiAgICAgICAgbWF0cls0XSA9IHVwWzFdO1xuICAgICAgICBtYXRyWzddID0gdXBbMl07XG5cbiAgICAgICAgbWF0clsyXSA9IC12aWV3WzBdO1xuICAgICAgICBtYXRyWzVdID0gLXZpZXdbMV07XG4gICAgICAgIG1hdHJbOF0gPSAtdmlld1syXTtcblxuICAgICAgICByZXR1cm4gcXVhdC5ub3JtYWxpemUob3V0LCBxdWF0LmZyb21NYXQzKG91dCwgbWF0cikpO1xuICAgIH07XG59KSgpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgcXVhdCBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIHF1YXRlcm5pb25cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdGVybmlvbiB0byBjbG9uZVxuICogQHJldHVybnMge3F1YXR9IGEgbmV3IHF1YXRlcm5pb25cbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmNsb25lID0gdmVjNC5jbG9uZTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHF1YXQgaW5pdGlhbGl6ZWQgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geiBaIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHcgVyBjb21wb25lbnRcbiAqIEByZXR1cm5zIHtxdWF0fSBhIG5ldyBxdWF0ZXJuaW9uXG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5mcm9tVmFsdWVzID0gdmVjNC5mcm9tVmFsdWVzO1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBxdWF0IHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgc291cmNlIHF1YXRlcm5pb25cbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmNvcHkgPSB2ZWM0LmNvcHk7XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgcXVhdCB0byB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0gdyBXIGNvbXBvbmVudFxuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuc2V0ID0gdmVjNC5zZXQ7XG5cbi8qKlxuICogU2V0IGEgcXVhdCB0byB0aGUgaWRlbnRpdHkgcXVhdGVybmlvblxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LmlkZW50aXR5ID0gZnVuY3Rpb24ob3V0KSB7XG4gICAgb3V0WzBdID0gMDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXRzIGEgcXVhdCBmcm9tIHRoZSBnaXZlbiBhbmdsZSBhbmQgcm90YXRpb24gYXhpcyxcbiAqIHRoZW4gcmV0dXJucyBpdC5cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7dmVjM30gYXhpcyB0aGUgYXhpcyBhcm91bmQgd2hpY2ggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSBpbiByYWRpYW5zXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKiovXG5xdWF0LnNldEF4aXNBbmdsZSA9IGZ1bmN0aW9uKG91dCwgYXhpcywgcmFkKSB7XG4gICAgcmFkID0gcmFkICogMC41O1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKTtcbiAgICBvdXRbMF0gPSBzICogYXhpc1swXTtcbiAgICBvdXRbMV0gPSBzICogYXhpc1sxXTtcbiAgICBvdXRbMl0gPSBzICogYXhpc1syXTtcbiAgICBvdXRbM10gPSBNYXRoLmNvcyhyYWQpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIHJvdGF0aW9uIGF4aXMgYW5kIGFuZ2xlIGZvciBhIGdpdmVuXG4gKiAgcXVhdGVybmlvbi4gSWYgYSBxdWF0ZXJuaW9uIGlzIGNyZWF0ZWQgd2l0aFxuICogIHNldEF4aXNBbmdsZSwgdGhpcyBtZXRob2Qgd2lsbCByZXR1cm4gdGhlIHNhbWVcbiAqICB2YWx1ZXMgYXMgcHJvdmlkaWVkIGluIHRoZSBvcmlnaW5hbCBwYXJhbWV0ZXIgbGlzdFxuICogIE9SIGZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHZhbHVlcy5cbiAqIEV4YW1wbGU6IFRoZSBxdWF0ZXJuaW9uIGZvcm1lZCBieSBheGlzIFswLCAwLCAxXSBhbmRcbiAqICBhbmdsZSAtOTAgaXMgdGhlIHNhbWUgYXMgdGhlIHF1YXRlcm5pb24gZm9ybWVkIGJ5XG4gKiAgWzAsIDAsIDFdIGFuZCAyNzAuIFRoaXMgbWV0aG9kIGZhdm9ycyB0aGUgbGF0dGVyLlxuICogQHBhcmFtICB7dmVjM30gb3V0X2F4aXMgIFZlY3RvciByZWNlaXZpbmcgdGhlIGF4aXMgb2Ygcm90YXRpb25cbiAqIEBwYXJhbSAge3F1YXR9IHEgICAgIFF1YXRlcm5pb24gdG8gYmUgZGVjb21wb3NlZFxuICogQHJldHVybiB7TnVtYmVyfSAgICAgQW5nbGUsIGluIHJhZGlhbnMsIG9mIHRoZSByb3RhdGlvblxuICovXG5xdWF0LmdldEF4aXNBbmdsZSA9IGZ1bmN0aW9uKG91dF9heGlzLCBxKSB7XG4gICAgdmFyIHJhZCA9IE1hdGguYWNvcyhxWzNdKSAqIDIuMDtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCAvIDIuMCk7XG4gICAgaWYgKHMgIT0gMC4wKSB7XG4gICAgICAgIG91dF9heGlzWzBdID0gcVswXSAvIHM7XG4gICAgICAgIG91dF9heGlzWzFdID0gcVsxXSAvIHM7XG4gICAgICAgIG91dF9heGlzWzJdID0gcVsyXSAvIHM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgcyBpcyB6ZXJvLCByZXR1cm4gYW55IGF4aXMgKG5vIHJvdGF0aW9uIC0gYXhpcyBkb2VzIG5vdCBtYXR0ZXIpXG4gICAgICAgIG91dF9heGlzWzBdID0gMTtcbiAgICAgICAgb3V0X2F4aXNbMV0gPSAwO1xuICAgICAgICBvdXRfYXhpc1syXSA9IDA7XG4gICAgfVxuICAgIHJldHVybiByYWQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIHF1YXQnc1xuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5hZGQgPSB2ZWM0LmFkZDtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBxdWF0J3NcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0Lm11bHRpcGx5ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgdmFyIGF4ID0gYVswXSwgYXkgPSBhWzFdLCBheiA9IGFbMl0sIGF3ID0gYVszXSxcbiAgICAgICAgYnggPSBiWzBdLCBieSA9IGJbMV0sIGJ6ID0gYlsyXSwgYncgPSBiWzNdO1xuXG4gICAgb3V0WzBdID0gYXggKiBidyArIGF3ICogYnggKyBheSAqIGJ6IC0gYXogKiBieTtcbiAgICBvdXRbMV0gPSBheSAqIGJ3ICsgYXcgKiBieSArIGF6ICogYnggLSBheCAqIGJ6O1xuICAgIG91dFsyXSA9IGF6ICogYncgKyBhdyAqIGJ6ICsgYXggKiBieSAtIGF5ICogYng7XG4gICAgb3V0WzNdID0gYXcgKiBidyAtIGF4ICogYnggLSBheSAqIGJ5IC0gYXogKiBiejtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHF1YXQubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5tdWwgPSBxdWF0Lm11bHRpcGx5O1xuXG4vKipcbiAqIFNjYWxlcyBhIHF1YXQgYnkgYSBzY2FsYXIgbnVtYmVyXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgdmVjdG9yIHRvIHNjYWxlXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIHZlY3RvciBieVxuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuc2NhbGUgPSB2ZWM0LnNjYWxlO1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBxdWF0ZXJuaW9uIGJ5IHRoZSBnaXZlbiBhbmdsZSBhYm91dCB0aGUgWCBheGlzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgcXVhdCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gcm90YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gcmFkIGFuZ2xlIChpbiByYWRpYW5zKSB0byByb3RhdGVcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5yb3RhdGVYID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgcmFkICo9IDAuNTsgXG5cbiAgICB2YXIgYXggPSBhWzBdLCBheSA9IGFbMV0sIGF6ID0gYVsyXSwgYXcgPSBhWzNdLFxuICAgICAgICBieCA9IE1hdGguc2luKHJhZCksIGJ3ID0gTWF0aC5jb3MocmFkKTtcblxuICAgIG91dFswXSA9IGF4ICogYncgKyBhdyAqIGJ4O1xuICAgIG91dFsxXSA9IGF5ICogYncgKyBheiAqIGJ4O1xuICAgIG91dFsyXSA9IGF6ICogYncgLSBheSAqIGJ4O1xuICAgIG91dFszXSA9IGF3ICogYncgLSBheCAqIGJ4O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBxdWF0ZXJuaW9uIGJ5IHRoZSBnaXZlbiBhbmdsZSBhYm91dCB0aGUgWSBheGlzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgcXVhdCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gcm90YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gcmFkIGFuZ2xlIChpbiByYWRpYW5zKSB0byByb3RhdGVcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5yb3RhdGVZID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgcmFkICo9IDAuNTsgXG5cbiAgICB2YXIgYXggPSBhWzBdLCBheSA9IGFbMV0sIGF6ID0gYVsyXSwgYXcgPSBhWzNdLFxuICAgICAgICBieSA9IE1hdGguc2luKHJhZCksIGJ3ID0gTWF0aC5jb3MocmFkKTtcblxuICAgIG91dFswXSA9IGF4ICogYncgLSBheiAqIGJ5O1xuICAgIG91dFsxXSA9IGF5ICogYncgKyBhdyAqIGJ5O1xuICAgIG91dFsyXSA9IGF6ICogYncgKyBheCAqIGJ5O1xuICAgIG91dFszXSA9IGF3ICogYncgLSBheSAqIGJ5O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBxdWF0ZXJuaW9uIGJ5IHRoZSBnaXZlbiBhbmdsZSBhYm91dCB0aGUgWiBheGlzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgcXVhdCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gcm90YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gcmFkIGFuZ2xlIChpbiByYWRpYW5zKSB0byByb3RhdGVcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5yb3RhdGVaID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgcmFkICo9IDAuNTsgXG5cbiAgICB2YXIgYXggPSBhWzBdLCBheSA9IGFbMV0sIGF6ID0gYVsyXSwgYXcgPSBhWzNdLFxuICAgICAgICBieiA9IE1hdGguc2luKHJhZCksIGJ3ID0gTWF0aC5jb3MocmFkKTtcblxuICAgIG91dFswXSA9IGF4ICogYncgKyBheSAqIGJ6O1xuICAgIG91dFsxXSA9IGF5ICogYncgLSBheCAqIGJ6O1xuICAgIG91dFsyXSA9IGF6ICogYncgKyBhdyAqIGJ6O1xuICAgIG91dFszXSA9IGF3ICogYncgLSBheiAqIGJ6O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIFcgY29tcG9uZW50IG9mIGEgcXVhdCBmcm9tIHRoZSBYLCBZLCBhbmQgWiBjb21wb25lbnRzLlxuICogQXNzdW1lcyB0aGF0IHF1YXRlcm5pb24gaXMgMSB1bml0IGluIGxlbmd0aC5cbiAqIEFueSBleGlzdGluZyBXIGNvbXBvbmVudCB3aWxsIGJlIGlnbm9yZWQuXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdCB0byBjYWxjdWxhdGUgVyBjb21wb25lbnQgb2ZcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5jYWxjdWxhdGVXID0gZnVuY3Rpb24gKG91dCwgYSkge1xuICAgIHZhciB4ID0gYVswXSwgeSA9IGFbMV0sIHogPSBhWzJdO1xuXG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIG91dFsyXSA9IHo7XG4gICAgb3V0WzNdID0gTWF0aC5zcXJ0KE1hdGguYWJzKDEuMCAtIHggKiB4IC0geSAqIHkgLSB6ICogeikpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byBxdWF0J3NcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7cXVhdH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRvdCBwcm9kdWN0IG9mIGEgYW5kIGJcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmRvdCA9IHZlYzQuZG90O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gcXVhdCdzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7cXVhdH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50IGJldHdlZW4gdGhlIHR3byBpbnB1dHNcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmxlcnAgPSB2ZWM0LmxlcnA7XG5cbi8qKlxuICogUGVyZm9ybXMgYSBzcGhlcmljYWwgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gcXVhdFxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQuc2xlcnAgPSBmdW5jdGlvbiAob3V0LCBhLCBiLCB0KSB7XG4gICAgLy8gYmVuY2htYXJrczpcbiAgICAvLyAgICBodHRwOi8vanNwZXJmLmNvbS9xdWF0ZXJuaW9uLXNsZXJwLWltcGxlbWVudGF0aW9uc1xuXG4gICAgdmFyIGF4ID0gYVswXSwgYXkgPSBhWzFdLCBheiA9IGFbMl0sIGF3ID0gYVszXSxcbiAgICAgICAgYnggPSBiWzBdLCBieSA9IGJbMV0sIGJ6ID0gYlsyXSwgYncgPSBiWzNdO1xuXG4gICAgdmFyICAgICAgICBvbWVnYSwgY29zb20sIHNpbm9tLCBzY2FsZTAsIHNjYWxlMTtcblxuICAgIC8vIGNhbGMgY29zaW5lXG4gICAgY29zb20gPSBheCAqIGJ4ICsgYXkgKiBieSArIGF6ICogYnogKyBhdyAqIGJ3O1xuICAgIC8vIGFkanVzdCBzaWducyAoaWYgbmVjZXNzYXJ5KVxuICAgIGlmICggY29zb20gPCAwLjAgKSB7XG4gICAgICAgIGNvc29tID0gLWNvc29tO1xuICAgICAgICBieCA9IC0gYng7XG4gICAgICAgIGJ5ID0gLSBieTtcbiAgICAgICAgYnogPSAtIGJ6O1xuICAgICAgICBidyA9IC0gYnc7XG4gICAgfVxuICAgIC8vIGNhbGN1bGF0ZSBjb2VmZmljaWVudHNcbiAgICBpZiAoICgxLjAgLSBjb3NvbSkgPiAwLjAwMDAwMSApIHtcbiAgICAgICAgLy8gc3RhbmRhcmQgY2FzZSAoc2xlcnApXG4gICAgICAgIG9tZWdhICA9IE1hdGguYWNvcyhjb3NvbSk7XG4gICAgICAgIHNpbm9tICA9IE1hdGguc2luKG9tZWdhKTtcbiAgICAgICAgc2NhbGUwID0gTWF0aC5zaW4oKDEuMCAtIHQpICogb21lZ2EpIC8gc2lub207XG4gICAgICAgIHNjYWxlMSA9IE1hdGguc2luKHQgKiBvbWVnYSkgLyBzaW5vbTtcbiAgICB9IGVsc2UgeyAgICAgICAgXG4gICAgICAgIC8vIFwiZnJvbVwiIGFuZCBcInRvXCIgcXVhdGVybmlvbnMgYXJlIHZlcnkgY2xvc2UgXG4gICAgICAgIC8vICAuLi4gc28gd2UgY2FuIGRvIGEgbGluZWFyIGludGVycG9sYXRpb25cbiAgICAgICAgc2NhbGUwID0gMS4wIC0gdDtcbiAgICAgICAgc2NhbGUxID0gdDtcbiAgICB9XG4gICAgLy8gY2FsY3VsYXRlIGZpbmFsIHZhbHVlc1xuICAgIG91dFswXSA9IHNjYWxlMCAqIGF4ICsgc2NhbGUxICogYng7XG4gICAgb3V0WzFdID0gc2NhbGUwICogYXkgKyBzY2FsZTEgKiBieTtcbiAgICBvdXRbMl0gPSBzY2FsZTAgKiBheiArIHNjYWxlMSAqIGJ6O1xuICAgIG91dFszXSA9IHNjYWxlMCAqIGF3ICsgc2NhbGUxICogYnc7XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgYSBzcGhlcmljYWwgbGluZWFyIGludGVycG9sYXRpb24gd2l0aCB0d28gY29udHJvbCBwb2ludHNcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBjIHRoZSB0aGlyZCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGQgdGhlIGZvdXJ0aCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudFxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LnNxbGVycCA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciB0ZW1wMSA9IHF1YXQuY3JlYXRlKCk7XG4gIHZhciB0ZW1wMiA9IHF1YXQuY3JlYXRlKCk7XG4gIFxuICByZXR1cm4gZnVuY3Rpb24gKG91dCwgYSwgYiwgYywgZCwgdCkge1xuICAgIHF1YXQuc2xlcnAodGVtcDEsIGEsIGQsIHQpO1xuICAgIHF1YXQuc2xlcnAodGVtcDIsIGIsIGMsIHQpO1xuICAgIHF1YXQuc2xlcnAob3V0LCB0ZW1wMSwgdGVtcDIsIDIgKiB0ICogKDEgLSB0KSk7XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbiAgfTtcbn0oKSk7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgaW52ZXJzZSBvZiBhIHF1YXRcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0IHRvIGNhbGN1bGF0ZSBpbnZlcnNlIG9mXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQuaW52ZXJ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSxcbiAgICAgICAgZG90ID0gYTAqYTAgKyBhMSphMSArIGEyKmEyICsgYTMqYTMsXG4gICAgICAgIGludkRvdCA9IGRvdCA/IDEuMC9kb3QgOiAwO1xuICAgIFxuICAgIC8vIFRPRE86IFdvdWxkIGJlIGZhc3RlciB0byByZXR1cm4gWzAsMCwwLDBdIGltbWVkaWF0ZWx5IGlmIGRvdCA9PSAwXG5cbiAgICBvdXRbMF0gPSAtYTAqaW52RG90O1xuICAgIG91dFsxXSA9IC1hMSppbnZEb3Q7XG4gICAgb3V0WzJdID0gLWEyKmludkRvdDtcbiAgICBvdXRbM10gPSBhMyppbnZEb3Q7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgY29uanVnYXRlIG9mIGEgcXVhdFxuICogSWYgdGhlIHF1YXRlcm5pb24gaXMgbm9ybWFsaXplZCwgdGhpcyBmdW5jdGlvbiBpcyBmYXN0ZXIgdGhhbiBxdWF0LmludmVyc2UgYW5kIHByb2R1Y2VzIHRoZSBzYW1lIHJlc3VsdC5cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0IHRvIGNhbGN1bGF0ZSBjb25qdWdhdGUgb2ZcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5jb25qdWdhdGUgPSBmdW5jdGlvbiAob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gLWFbMF07XG4gICAgb3V0WzFdID0gLWFbMV07XG4gICAgb3V0WzJdID0gLWFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggb2YgYSBxdWF0XG4gKlxuICogQHBhcmFtIHtxdWF0fSBhIHZlY3RvciB0byBjYWxjdWxhdGUgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBsZW5ndGggb2YgYVxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQubGVuZ3RoID0gdmVjNC5sZW5ndGg7XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBxdWF0Lmxlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmxlbiA9IHF1YXQubGVuZ3RoO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIGEgcXVhdFxuICpcbiAqIEBwYXJhbSB7cXVhdH0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIHNxdWFyZWQgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGxlbmd0aCBvZiBhXG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5zcXVhcmVkTGVuZ3RoID0gdmVjNC5zcXVhcmVkTGVuZ3RoO1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgcXVhdC5zcXVhcmVkTGVuZ3RofVxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuc3FyTGVuID0gcXVhdC5zcXVhcmVkTGVuZ3RoO1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIHF1YXRcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0ZXJuaW9uIHRvIG5vcm1hbGl6ZVxuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQubm9ybWFsaXplID0gdmVjNC5ub3JtYWxpemU7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gZnJvbSB0aGUgZ2l2ZW4gM3gzIHJvdGF0aW9uIG1hdHJpeC5cbiAqXG4gKiBOT1RFOiBUaGUgcmVzdWx0YW50IHF1YXRlcm5pb24gaXMgbm90IG5vcm1hbGl6ZWQsIHNvIHlvdSBzaG91bGQgYmUgc3VyZVxuICogdG8gcmVub3JtYWxpemUgdGhlIHF1YXRlcm5pb24geW91cnNlbGYgd2hlcmUgbmVjZXNzYXJ5LlxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHttYXQzfSBtIHJvdGF0aW9uIG1hdHJpeFxuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuZnJvbU1hdDMgPSBmdW5jdGlvbihvdXQsIG0pIHtcbiAgICAvLyBBbGdvcml0aG0gaW4gS2VuIFNob2VtYWtlJ3MgYXJ0aWNsZSBpbiAxOTg3IFNJR0dSQVBIIGNvdXJzZSBub3Rlc1xuICAgIC8vIGFydGljbGUgXCJRdWF0ZXJuaW9uIENhbGN1bHVzIGFuZCBGYXN0IEFuaW1hdGlvblwiLlxuICAgIHZhciBmVHJhY2UgPSBtWzBdICsgbVs0XSArIG1bOF07XG4gICAgdmFyIGZSb290O1xuXG4gICAgaWYgKCBmVHJhY2UgPiAwLjAgKSB7XG4gICAgICAgIC8vIHx3fCA+IDEvMiwgbWF5IGFzIHdlbGwgY2hvb3NlIHcgPiAxLzJcbiAgICAgICAgZlJvb3QgPSBNYXRoLnNxcnQoZlRyYWNlICsgMS4wKTsgIC8vIDJ3XG4gICAgICAgIG91dFszXSA9IDAuNSAqIGZSb290O1xuICAgICAgICBmUm9vdCA9IDAuNS9mUm9vdDsgIC8vIDEvKDR3KVxuICAgICAgICBvdXRbMF0gPSAobVs1XS1tWzddKSpmUm9vdDtcbiAgICAgICAgb3V0WzFdID0gKG1bNl0tbVsyXSkqZlJvb3Q7XG4gICAgICAgIG91dFsyXSA9IChtWzFdLW1bM10pKmZSb290O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHx3fCA8PSAxLzJcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICBpZiAoIG1bNF0gPiBtWzBdIClcbiAgICAgICAgICBpID0gMTtcbiAgICAgICAgaWYgKCBtWzhdID4gbVtpKjMraV0gKVxuICAgICAgICAgIGkgPSAyO1xuICAgICAgICB2YXIgaiA9IChpKzEpJTM7XG4gICAgICAgIHZhciBrID0gKGkrMiklMztcbiAgICAgICAgXG4gICAgICAgIGZSb290ID0gTWF0aC5zcXJ0KG1baSozK2ldLW1baiozK2pdLW1bayozK2tdICsgMS4wKTtcbiAgICAgICAgb3V0W2ldID0gMC41ICogZlJvb3Q7XG4gICAgICAgIGZSb290ID0gMC41IC8gZlJvb3Q7XG4gICAgICAgIG91dFszXSA9IChtW2oqMytrXSAtIG1bayozK2pdKSAqIGZSb290O1xuICAgICAgICBvdXRbal0gPSAobVtqKjMraV0gKyBtW2kqMytqXSkgKiBmUm9vdDtcbiAgICAgICAgb3V0W2tdID0gKG1bayozK2ldICsgbVtpKjMra10pICogZlJvb3Q7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBxdWF0ZW5pb25cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IHZlYyB2ZWN0b3IgdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvclxuICovXG5xdWF0LnN0ciA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuICdxdWF0KCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcsICcgKyBhWzNdICsgJyknO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBxdWF0ZXJuaW9ucyBoYXZlIGV4YWN0bHkgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24gKHdoZW4gY29tcGFyZWQgd2l0aCA9PT0pXG4gKlxuICogQHBhcmFtIHtxdWF0fSBhIFRoZSBmaXJzdCBxdWF0ZXJuaW9uLlxuICogQHBhcmFtIHtxdWF0fSBiIFRoZSBzZWNvbmQgcXVhdGVybmlvbi5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSB2ZWN0b3JzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5xdWF0LmV4YWN0RXF1YWxzID0gdmVjNC5leGFjdEVxdWFscztcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBxdWF0ZXJuaW9ucyBoYXZlIGFwcHJveGltYXRlbHkgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24uXG4gKlxuICogQHBhcmFtIHtxdWF0fSBhIFRoZSBmaXJzdCB2ZWN0b3IuXG4gKiBAcGFyYW0ge3F1YXR9IGIgVGhlIHNlY29uZCB2ZWN0b3IuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmVjdG9ycyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xucXVhdC5lcXVhbHMgPSB2ZWM0LmVxdWFscztcblxubW9kdWxlLmV4cG9ydHMgPSBxdWF0O1xuIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyAyIERpbWVuc2lvbmFsIFZlY3RvclxuICogQG5hbWUgdmVjMlxuICovXG52YXIgdmVjMiA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcsIGVtcHR5IHZlYzJcbiAqXG4gKiBAcmV0dXJucyB7dmVjMn0gYSBuZXcgMkQgdmVjdG9yXG4gKi9cbnZlYzIuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDIpO1xuICAgIG91dFswXSA9IDA7XG4gICAgb3V0WzFdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzIgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIGNsb25lXG4gKiBAcmV0dXJucyB7dmVjMn0gYSBuZXcgMkQgdmVjdG9yXG4gKi9cbnZlYzIuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDIpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzIgaW5pdGlhbGl6ZWQgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcmV0dXJucyB7dmVjMn0gYSBuZXcgMkQgdmVjdG9yXG4gKi9cbnZlYzIuZnJvbVZhbHVlcyA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMik7XG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSB2ZWMyIHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBzb3VyY2UgdmVjdG9yXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMyIHRvIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuc2V0ID0gZnVuY3Rpb24ob3V0LCB4LCB5KSB7XG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5hZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICsgYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdICsgYlsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdHMgdmVjdG9yIGIgZnJvbSB2ZWN0b3IgYVxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5zdWJ0cmFjdCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gLSBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gLSBiWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5zdWJ0cmFjdH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLnN1YiA9IHZlYzIuc3VidHJhY3Q7XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLm11bHRpcGx5ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAqIGJbMV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLm11bHRpcGx5fVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIubXVsID0gdmVjMi5tdWx0aXBseTtcblxuLyoqXG4gKiBEaXZpZGVzIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuZGl2aWRlID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAvIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAvIGJbMV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLmRpdmlkZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLmRpdiA9IHZlYzIuZGl2aWRlO1xuXG4vKipcbiAqIE1hdGguY2VpbCB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBjZWlsXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuY2VpbCA9IGZ1bmN0aW9uIChvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBNYXRoLmNlaWwoYVswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5jZWlsKGFbMV0pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE1hdGguZmxvb3IgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gZmxvb3JcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5mbG9vciA9IGZ1bmN0aW9uIChvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBNYXRoLmZsb29yKGFbMF0pO1xuICAgIG91dFsxXSA9IE1hdGguZmxvb3IoYVsxXSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWluaW11bSBvZiB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLm1pbiA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IE1hdGgubWluKGFbMF0sIGJbMF0pO1xuICAgIG91dFsxXSA9IE1hdGgubWluKGFbMV0sIGJbMV0pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG1heGltdW0gb2YgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5tYXggPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBNYXRoLm1heChhWzBdLCBiWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLm1heChhWzFdLCBiWzFdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBNYXRoLnJvdW5kIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjMlxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIHJvdW5kXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIucm91bmQgPSBmdW5jdGlvbiAob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gTWF0aC5yb3VuZChhWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLnJvdW5kKGFbMV0pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyBhIHZlYzIgYnkgYSBzY2FsYXIgbnVtYmVyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHNjYWxlXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIHZlY3RvciBieVxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGI7XG4gICAgb3V0WzFdID0gYVsxXSAqIGI7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjMidzIGFmdGVyIHNjYWxpbmcgdGhlIHNlY29uZCBvcGVyYW5kIGJ5IGEgc2NhbGFyIHZhbHVlXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxlIHRoZSBhbW91bnQgdG8gc2NhbGUgYiBieSBiZWZvcmUgYWRkaW5nXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuc2NhbGVBbmRBZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIsIHNjYWxlKSB7XG4gICAgb3V0WzBdID0gYVswXSArIChiWzBdICogc2NhbGUpO1xuICAgIG91dFsxXSA9IGFbMV0gKyAoYlsxXSAqIHNjYWxlKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkaXN0YW5jZSBiZXR3ZWVuIGEgYW5kIGJcbiAqL1xudmVjMi5kaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgeCA9IGJbMF0gLSBhWzBdLFxuICAgICAgICB5ID0gYlsxXSAtIGFbMV07XG4gICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkpO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIuZGlzdGFuY2V9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5kaXN0ID0gdmVjMi5kaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzIuc3F1YXJlZERpc3RhbmNlID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXTtcbiAgICByZXR1cm4geCp4ICsgeSp5O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIuc3F1YXJlZERpc3RhbmNlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIuc3FyRGlzdCA9IHZlYzIuc3F1YXJlZERpc3RhbmNlO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiBhIHZlYzJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBsZW5ndGggb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGxlbmd0aCBvZiBhXG4gKi9cbnZlYzIubGVuZ3RoID0gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5KTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLmxlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLmxlbiA9IHZlYzIubGVuZ3RoO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIGEgdmVjMlxuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIHNxdWFyZWQgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGxlbmd0aCBvZiBhXG4gKi9cbnZlYzIuc3F1YXJlZExlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXTtcbiAgICByZXR1cm4geCp4ICsgeSp5O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIuc3F1YXJlZExlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLnNxckxlbiA9IHZlYzIuc3F1YXJlZExlbmd0aDtcblxuLyoqXG4gKiBOZWdhdGVzIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjMlxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIG5lZ2F0ZVxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLm5lZ2F0ZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IC1hWzBdO1xuICAgIG91dFsxXSA9IC1hWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGludmVyc2Ugb2YgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gaW52ZXJ0XG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuaW52ZXJzZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICBvdXRbMF0gPSAxLjAgLyBhWzBdO1xuICBvdXRbMV0gPSAxLjAgLyBhWzFdO1xuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBOb3JtYWxpemUgYSB2ZWMyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubm9ybWFsaXplID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXTtcbiAgICB2YXIgbGVuID0geCp4ICsgeSp5O1xuICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICAgIC8vVE9ETzogZXZhbHVhdGUgdXNlIG9mIGdsbV9pbnZzcXJ0IGhlcmU/XG4gICAgICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQobGVuKTtcbiAgICAgICAgb3V0WzBdID0gYVswXSAqIGxlbjtcbiAgICAgICAgb3V0WzFdID0gYVsxXSAqIGxlbjtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZG90IHByb2R1Y3Qgb2YgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZG90IHByb2R1Y3Qgb2YgYSBhbmQgYlxuICovXG52ZWMyLmRvdCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gKiBiWzBdICsgYVsxXSAqIGJbMV07XG59O1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBjcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWMyJ3NcbiAqIE5vdGUgdGhhdCB0aGUgY3Jvc3MgcHJvZHVjdCBtdXN0IGJ5IGRlZmluaXRpb24gcHJvZHVjZSBhIDNEIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMi5jcm9zcyA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIHZhciB6ID0gYVswXSAqIGJbMV0gLSBhWzFdICogYlswXTtcbiAgICBvdXRbMF0gPSBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IHo7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgYSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubGVycCA9IGZ1bmN0aW9uIChvdXQsIGEsIGIsIHQpIHtcbiAgICB2YXIgYXggPSBhWzBdLFxuICAgICAgICBheSA9IGFbMV07XG4gICAgb3V0WzBdID0gYXggKyB0ICogKGJbMF0gLSBheCk7XG4gICAgb3V0WzFdID0gYXkgKyB0ICogKGJbMV0gLSBheSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmFuZG9tIHZlY3RvciB3aXRoIHRoZSBnaXZlbiBzY2FsZVxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0gW3NjYWxlXSBMZW5ndGggb2YgdGhlIHJlc3VsdGluZyB2ZWN0b3IuIElmIG9tbWl0dGVkLCBhIHVuaXQgdmVjdG9yIHdpbGwgYmUgcmV0dXJuZWRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5yYW5kb20gPSBmdW5jdGlvbiAob3V0LCBzY2FsZSkge1xuICAgIHNjYWxlID0gc2NhbGUgfHwgMS4wO1xuICAgIHZhciByID0gZ2xNYXRyaXguUkFORE9NKCkgKiAyLjAgKiBNYXRoLlBJO1xuICAgIG91dFswXSA9IE1hdGguY29zKHIpICogc2NhbGU7XG4gICAgb3V0WzFdID0gTWF0aC5zaW4ocikgKiBzY2FsZTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMyIHdpdGggYSBtYXQyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQyfSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnRyYW5zZm9ybU1hdDIgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVsyXSAqIHk7XG4gICAgb3V0WzFdID0gbVsxXSAqIHggKyBtWzNdICogeTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMyIHdpdGggYSBtYXQyZFxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0MmR9IG0gbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIudHJhbnNmb3JtTWF0MmQgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVsyXSAqIHkgKyBtWzRdO1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVszXSAqIHkgKyBtWzVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzIgd2l0aCBhIG1hdDNcbiAqIDNyZCB2ZWN0b3IgY29tcG9uZW50IGlzIGltcGxpY2l0bHkgJzEnXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQzfSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnRyYW5zZm9ybU1hdDMgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVszXSAqIHkgKyBtWzZdO1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVs0XSAqIHkgKyBtWzddO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzIgd2l0aCBhIG1hdDRcbiAqIDNyZCB2ZWN0b3IgY29tcG9uZW50IGlzIGltcGxpY2l0bHkgJzAnXG4gKiA0dGggdmVjdG9yIGNvbXBvbmVudCBpcyBpbXBsaWNpdGx5ICcxJ1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0NH0gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi50cmFuc2Zvcm1NYXQ0ID0gZnVuY3Rpb24ob3V0LCBhLCBtKSB7XG4gICAgdmFyIHggPSBhWzBdLCBcbiAgICAgICAgeSA9IGFbMV07XG4gICAgb3V0WzBdID0gbVswXSAqIHggKyBtWzRdICogeSArIG1bMTJdO1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVs1XSAqIHkgKyBtWzEzXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtIHNvbWUgb3BlcmF0aW9uIG92ZXIgYW4gYXJyYXkgb2YgdmVjMnMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYSB0aGUgYXJyYXkgb2YgdmVjdG9ycyB0byBpdGVyYXRlIG92ZXJcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdHJpZGUgTnVtYmVyIG9mIGVsZW1lbnRzIGJldHdlZW4gdGhlIHN0YXJ0IG9mIGVhY2ggdmVjMi4gSWYgMCBhc3N1bWVzIHRpZ2h0bHkgcGFja2VkXG4gKiBAcGFyYW0ge051bWJlcn0gb2Zmc2V0IE51bWJlciBvZiBlbGVtZW50cyB0byBza2lwIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5XG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgTnVtYmVyIG9mIHZlYzJzIHRvIGl0ZXJhdGUgb3Zlci4gSWYgMCBpdGVyYXRlcyBvdmVyIGVudGlyZSBhcnJheVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCB2ZWN0b3IgaW4gdGhlIGFycmF5XG4gKiBAcGFyYW0ge09iamVjdH0gW2FyZ10gYWRkaXRpb25hbCBhcmd1bWVudCB0byBwYXNzIHRvIGZuXG4gKiBAcmV0dXJucyB7QXJyYXl9IGFcbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLmZvckVhY2ggPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZlYyA9IHZlYzIuY3JlYXRlKCk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oYSwgc3RyaWRlLCBvZmZzZXQsIGNvdW50LCBmbiwgYXJnKSB7XG4gICAgICAgIHZhciBpLCBsO1xuICAgICAgICBpZighc3RyaWRlKSB7XG4gICAgICAgICAgICBzdHJpZGUgPSAyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIW9mZnNldCkge1xuICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYoY291bnQpIHtcbiAgICAgICAgICAgIGwgPSBNYXRoLm1pbigoY291bnQgKiBzdHJpZGUpICsgb2Zmc2V0LCBhLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsID0gYS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IG9mZnNldDsgaSA8IGw7IGkgKz0gc3RyaWRlKSB7XG4gICAgICAgICAgICB2ZWNbMF0gPSBhW2ldOyB2ZWNbMV0gPSBhW2krMV07XG4gICAgICAgICAgICBmbih2ZWMsIHZlYywgYXJnKTtcbiAgICAgICAgICAgIGFbaV0gPSB2ZWNbMF07IGFbaSsxXSA9IHZlY1sxXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfTtcbn0pKCk7XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjMn0gdmVjIHZlY3RvciB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXG4gKi9cbnZlYzIuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ3ZlYzIoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcpJztcbn07XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgdmVjdG9ycyBleGFjdGx5IGhhdmUgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24gKHdoZW4gY29tcGFyZWQgd2l0aCA9PT0pXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIFRoZSBmaXJzdCB2ZWN0b3IuXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgVGhlIHNlY29uZCB2ZWN0b3IuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmVjdG9ycyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xudmVjMi5leGFjdEVxdWFscyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gPT09IGJbMF0gJiYgYVsxXSA9PT0gYlsxXTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgdmVjdG9ycyBoYXZlIGFwcHJveGltYXRlbHkgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24uXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIFRoZSBmaXJzdCB2ZWN0b3IuXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgVGhlIHNlY29uZCB2ZWN0b3IuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmVjdG9ycyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xudmVjMi5lcXVhbHMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXTtcbiAgICB2YXIgYjAgPSBiWzBdLCBiMSA9IGJbMV07XG4gICAgcmV0dXJuIChNYXRoLmFicyhhMCAtIGIwKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTApLCBNYXRoLmFicyhiMCkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMSAtIGIxKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTEpLCBNYXRoLmFicyhiMSkpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdmVjMjtcbiIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgMyBEaW1lbnNpb25hbCBWZWN0b3JcbiAqIEBuYW1lIHZlYzNcbiAqL1xudmFyIHZlYzMgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3LCBlbXB0eSB2ZWMzXG4gKlxuICogQHJldHVybnMge3ZlYzN9IGEgbmV3IDNEIHZlY3RvclxuICovXG52ZWMzLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSgzKTtcbiAgICBvdXRbMF0gPSAwO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzMgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIGNsb25lXG4gKiBAcmV0dXJucyB7dmVjM30gYSBuZXcgM0QgdmVjdG9yXG4gKi9cbnZlYzMuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDMpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdmVjMyBpbml0aWFsaXplZCB3aXRoIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XG4gKiBAcmV0dXJucyB7dmVjM30gYSBuZXcgM0QgdmVjdG9yXG4gKi9cbnZlYzMuZnJvbVZhbHVlcyA9IGZ1bmN0aW9uKHgsIHksIHopIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMyk7XG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIG91dFsyXSA9IHo7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIHZlYzMgdG8gYW5vdGhlclxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHNvdXJjZSB2ZWN0b3JcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5jb3B5ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgdmVjMyB0byB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHogWiBjb21wb25lbnRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5zZXQgPSBmdW5jdGlvbihvdXQsIHgsIHksIHopIHtcbiAgICBvdXRbMF0gPSB4O1xuICAgIG91dFsxXSA9IHk7XG4gICAgb3V0WzJdID0gejtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuYWRkID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSArIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSArIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSArIGJbMl07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU3VidHJhY3RzIHZlY3RvciBiIGZyb20gdmVjdG9yIGFcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuc3VidHJhY3QgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC0gYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdIC0gYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdIC0gYlsyXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMuc3VidHJhY3R9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5zdWIgPSB2ZWMzLnN1YnRyYWN0O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5tdWx0aXBseSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gKiBiWzJdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMzLm11bCA9IHZlYzMubXVsdGlwbHk7XG5cbi8qKlxuICogRGl2aWRlcyB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmRpdmlkZSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gLyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gLyBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gLyBiWzJdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5kaXZpZGV9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5kaXYgPSB2ZWMzLmRpdmlkZTtcblxuLyoqXG4gKiBNYXRoLmNlaWwgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gY2VpbFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmNlaWwgPSBmdW5jdGlvbiAob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gTWF0aC5jZWlsKGFbMF0pO1xuICAgIG91dFsxXSA9IE1hdGguY2VpbChhWzFdKTtcbiAgICBvdXRbMl0gPSBNYXRoLmNlaWwoYVsyXSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogTWF0aC5mbG9vciB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byBmbG9vclxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmZsb29yID0gZnVuY3Rpb24gKG91dCwgYSkge1xuICAgIG91dFswXSA9IE1hdGguZmxvb3IoYVswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5mbG9vcihhWzFdKTtcbiAgICBvdXRbMl0gPSBNYXRoLmZsb29yKGFbMl0pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG1pbmltdW0gb2YgdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5taW4gPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBNYXRoLm1pbihhWzBdLCBiWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLm1pbihhWzFdLCBiWzFdKTtcbiAgICBvdXRbMl0gPSBNYXRoLm1pbihhWzJdLCBiWzJdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtYXhpbXVtIG9mIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMubWF4ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gTWF0aC5tYXgoYVswXSwgYlswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5tYXgoYVsxXSwgYlsxXSk7XG4gICAgb3V0WzJdID0gTWF0aC5tYXgoYVsyXSwgYlsyXSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogTWF0aC5yb3VuZCB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byByb3VuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnJvdW5kID0gZnVuY3Rpb24gKG91dCwgYSkge1xuICAgIG91dFswXSA9IE1hdGgucm91bmQoYVswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5yb3VuZChhWzFdKTtcbiAgICBvdXRbMl0gPSBNYXRoLnJvdW5kKGFbMl0pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyBhIHZlYzMgYnkgYSBzY2FsYXIgbnVtYmVyXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgdmVjdG9yIHRvIHNjYWxlXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIHZlY3RvciBieVxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGI7XG4gICAgb3V0WzFdID0gYVsxXSAqIGI7XG4gICAgb3V0WzJdID0gYVsyXSAqIGI7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjMydzIGFmdGVyIHNjYWxpbmcgdGhlIHNlY29uZCBvcGVyYW5kIGJ5IGEgc2NhbGFyIHZhbHVlXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxlIHRoZSBhbW91bnQgdG8gc2NhbGUgYiBieSBiZWZvcmUgYWRkaW5nXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuc2NhbGVBbmRBZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIsIHNjYWxlKSB7XG4gICAgb3V0WzBdID0gYVswXSArIChiWzBdICogc2NhbGUpO1xuICAgIG91dFsxXSA9IGFbMV0gKyAoYlsxXSAqIHNjYWxlKTtcbiAgICBvdXRbMl0gPSBhWzJdICsgKGJbMl0gKiBzY2FsZSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZXVjbGlkaWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzMuZGlzdGFuY2UgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHggPSBiWzBdIC0gYVswXSxcbiAgICAgICAgeSA9IGJbMV0gLSBhWzFdLFxuICAgICAgICB6ID0gYlsyXSAtIGFbMl07XG4gICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkgKyB6KnopO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMuZGlzdGFuY2V9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5kaXN0ID0gdmVjMy5kaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzMuc3F1YXJlZERpc3RhbmNlID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXSxcbiAgICAgICAgeiA9IGJbMl0gLSBhWzJdO1xuICAgIHJldHVybiB4KnggKyB5KnkgKyB6Kno7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5zcXVhcmVkRGlzdGFuY2V9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5zcXJEaXN0ID0gdmVjMy5zcXVhcmVkRGlzdGFuY2U7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9mIGEgdmVjM1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gbGVuZ3RoIG9mIGFcbiAqL1xudmVjMy5sZW5ndGggPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV0sXG4gICAgICAgIHogPSBhWzJdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5ICsgeip6KTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMzLmxlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMzLmxlbiA9IHZlYzMubGVuZ3RoO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIGEgdmVjM1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIHNxdWFyZWQgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGxlbmd0aCBvZiBhXG4gKi9cbnZlYzMuc3F1YXJlZExlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXSxcbiAgICAgICAgeiA9IGFbMl07XG4gICAgcmV0dXJuIHgqeCArIHkqeSArIHoqejtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMzLnNxdWFyZWRMZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5zcXJMZW4gPSB2ZWMzLnNxdWFyZWRMZW5ndGg7XG5cbi8qKlxuICogTmVnYXRlcyB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byBuZWdhdGVcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5uZWdhdGUgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSAtYVswXTtcbiAgICBvdXRbMV0gPSAtYVsxXTtcbiAgICBvdXRbMl0gPSAtYVsyXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnZlcnNlIG9mIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjM1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIGludmVydFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmludmVyc2UgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgb3V0WzBdID0gMS4wIC8gYVswXTtcbiAgb3V0WzFdID0gMS4wIC8gYVsxXTtcbiAgb3V0WzJdID0gMS4wIC8gYVsyXTtcbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogTm9ybWFsaXplIGEgdmVjM1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIG5vcm1hbGl6ZVxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV0sXG4gICAgICAgIHogPSBhWzJdO1xuICAgIHZhciBsZW4gPSB4KnggKyB5KnkgKyB6Kno7XG4gICAgaWYgKGxlbiA+IDApIHtcbiAgICAgICAgLy9UT0RPOiBldmFsdWF0ZSB1c2Ugb2YgZ2xtX2ludnNxcnQgaGVyZT9cbiAgICAgICAgbGVuID0gMSAvIE1hdGguc3FydChsZW4pO1xuICAgICAgICBvdXRbMF0gPSBhWzBdICogbGVuO1xuICAgICAgICBvdXRbMV0gPSBhWzFdICogbGVuO1xuICAgICAgICBvdXRbMl0gPSBhWzJdICogbGVuO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBvZiB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkb3QgcHJvZHVjdCBvZiBhIGFuZCBiXG4gKi9cbnZlYzMuZG90ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYVswXSAqIGJbMF0gKyBhWzFdICogYlsxXSArIGFbMl0gKiBiWzJdO1xufTtcblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgY3Jvc3MgcHJvZHVjdCBvZiB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmNyb3NzID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgdmFyIGF4ID0gYVswXSwgYXkgPSBhWzFdLCBheiA9IGFbMl0sXG4gICAgICAgIGJ4ID0gYlswXSwgYnkgPSBiWzFdLCBieiA9IGJbMl07XG5cbiAgICBvdXRbMF0gPSBheSAqIGJ6IC0gYXogKiBieTtcbiAgICBvdXRbMV0gPSBheiAqIGJ4IC0gYXggKiBiejtcbiAgICBvdXRbMl0gPSBheCAqIGJ5IC0gYXkgKiBieDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50IGJldHdlZW4gdGhlIHR3byBpbnB1dHNcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5sZXJwID0gZnVuY3Rpb24gKG91dCwgYSwgYiwgdCkge1xuICAgIHZhciBheCA9IGFbMF0sXG4gICAgICAgIGF5ID0gYVsxXSxcbiAgICAgICAgYXogPSBhWzJdO1xuICAgIG91dFswXSA9IGF4ICsgdCAqIChiWzBdIC0gYXgpO1xuICAgIG91dFsxXSA9IGF5ICsgdCAqIChiWzFdIC0gYXkpO1xuICAgIG91dFsyXSA9IGF6ICsgdCAqIChiWzJdIC0gYXopO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgaGVybWl0ZSBpbnRlcnBvbGF0aW9uIHdpdGggdHdvIGNvbnRyb2wgcG9pbnRzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBjIHRoZSB0aGlyZCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGQgdGhlIGZvdXJ0aCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuaGVybWl0ZSA9IGZ1bmN0aW9uIChvdXQsIGEsIGIsIGMsIGQsIHQpIHtcbiAgdmFyIGZhY3RvclRpbWVzMiA9IHQgKiB0LFxuICAgICAgZmFjdG9yMSA9IGZhY3RvclRpbWVzMiAqICgyICogdCAtIDMpICsgMSxcbiAgICAgIGZhY3RvcjIgPSBmYWN0b3JUaW1lczIgKiAodCAtIDIpICsgdCxcbiAgICAgIGZhY3RvcjMgPSBmYWN0b3JUaW1lczIgKiAodCAtIDEpLFxuICAgICAgZmFjdG9yNCA9IGZhY3RvclRpbWVzMiAqICgzIC0gMiAqIHQpO1xuICBcbiAgb3V0WzBdID0gYVswXSAqIGZhY3RvcjEgKyBiWzBdICogZmFjdG9yMiArIGNbMF0gKiBmYWN0b3IzICsgZFswXSAqIGZhY3RvcjQ7XG4gIG91dFsxXSA9IGFbMV0gKiBmYWN0b3IxICsgYlsxXSAqIGZhY3RvcjIgKyBjWzFdICogZmFjdG9yMyArIGRbMV0gKiBmYWN0b3I0O1xuICBvdXRbMl0gPSBhWzJdICogZmFjdG9yMSArIGJbMl0gKiBmYWN0b3IyICsgY1syXSAqIGZhY3RvcjMgKyBkWzJdICogZmFjdG9yNDtcbiAgXG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgYmV6aWVyIGludGVycG9sYXRpb24gd2l0aCB0d28gY29udHJvbCBwb2ludHNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGMgdGhlIHRoaXJkIG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gZCB0aGUgZm91cnRoIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50IGJldHdlZW4gdGhlIHR3byBpbnB1dHNcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5iZXppZXIgPSBmdW5jdGlvbiAob3V0LCBhLCBiLCBjLCBkLCB0KSB7XG4gIHZhciBpbnZlcnNlRmFjdG9yID0gMSAtIHQsXG4gICAgICBpbnZlcnNlRmFjdG9yVGltZXNUd28gPSBpbnZlcnNlRmFjdG9yICogaW52ZXJzZUZhY3RvcixcbiAgICAgIGZhY3RvclRpbWVzMiA9IHQgKiB0LFxuICAgICAgZmFjdG9yMSA9IGludmVyc2VGYWN0b3JUaW1lc1R3byAqIGludmVyc2VGYWN0b3IsXG4gICAgICBmYWN0b3IyID0gMyAqIHQgKiBpbnZlcnNlRmFjdG9yVGltZXNUd28sXG4gICAgICBmYWN0b3IzID0gMyAqIGZhY3RvclRpbWVzMiAqIGludmVyc2VGYWN0b3IsXG4gICAgICBmYWN0b3I0ID0gZmFjdG9yVGltZXMyICogdDtcbiAgXG4gIG91dFswXSA9IGFbMF0gKiBmYWN0b3IxICsgYlswXSAqIGZhY3RvcjIgKyBjWzBdICogZmFjdG9yMyArIGRbMF0gKiBmYWN0b3I0O1xuICBvdXRbMV0gPSBhWzFdICogZmFjdG9yMSArIGJbMV0gKiBmYWN0b3IyICsgY1sxXSAqIGZhY3RvcjMgKyBkWzFdICogZmFjdG9yNDtcbiAgb3V0WzJdID0gYVsyXSAqIGZhY3RvcjEgKyBiWzJdICogZmFjdG9yMiArIGNbMl0gKiBmYWN0b3IzICsgZFsyXSAqIGZhY3RvcjQ7XG4gIFxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gdmVjdG9yIHdpdGggdGhlIGdpdmVuIHNjYWxlXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSBbc2NhbGVdIExlbmd0aCBvZiB0aGUgcmVzdWx0aW5nIHZlY3Rvci4gSWYgb21taXR0ZWQsIGEgdW5pdCB2ZWN0b3Igd2lsbCBiZSByZXR1cm5lZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnJhbmRvbSA9IGZ1bmN0aW9uIChvdXQsIHNjYWxlKSB7XG4gICAgc2NhbGUgPSBzY2FsZSB8fCAxLjA7XG5cbiAgICB2YXIgciA9IGdsTWF0cml4LlJBTkRPTSgpICogMi4wICogTWF0aC5QSTtcbiAgICB2YXIgeiA9IChnbE1hdHJpeC5SQU5ET00oKSAqIDIuMCkgLSAxLjA7XG4gICAgdmFyIHpTY2FsZSA9IE1hdGguc3FydCgxLjAteip6KSAqIHNjYWxlO1xuXG4gICAgb3V0WzBdID0gTWF0aC5jb3MocikgKiB6U2NhbGU7XG4gICAgb3V0WzFdID0gTWF0aC5zaW4ocikgKiB6U2NhbGU7XG4gICAgb3V0WzJdID0geiAqIHNjYWxlO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzMgd2l0aCBhIG1hdDQuXG4gKiA0dGggdmVjdG9yIGNvbXBvbmVudCBpcyBpbXBsaWNpdGx5ICcxJ1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0NH0gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy50cmFuc2Zvcm1NYXQ0ID0gZnVuY3Rpb24ob3V0LCBhLCBtKSB7XG4gICAgdmFyIHggPSBhWzBdLCB5ID0gYVsxXSwgeiA9IGFbMl0sXG4gICAgICAgIHcgPSBtWzNdICogeCArIG1bN10gKiB5ICsgbVsxMV0gKiB6ICsgbVsxNV07XG4gICAgdyA9IHcgfHwgMS4wO1xuICAgIG91dFswXSA9IChtWzBdICogeCArIG1bNF0gKiB5ICsgbVs4XSAqIHogKyBtWzEyXSkgLyB3O1xuICAgIG91dFsxXSA9IChtWzFdICogeCArIG1bNV0gKiB5ICsgbVs5XSAqIHogKyBtWzEzXSkgLyB3O1xuICAgIG91dFsyXSA9IChtWzJdICogeCArIG1bNl0gKiB5ICsgbVsxMF0gKiB6ICsgbVsxNF0pIC8gdztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMzIHdpdGggYSBtYXQzLlxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0NH0gbSB0aGUgM3gzIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnRyYW5zZm9ybU1hdDMgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sIHkgPSBhWzFdLCB6ID0gYVsyXTtcbiAgICBvdXRbMF0gPSB4ICogbVswXSArIHkgKiBtWzNdICsgeiAqIG1bNl07XG4gICAgb3V0WzFdID0geCAqIG1bMV0gKyB5ICogbVs0XSArIHogKiBtWzddO1xuICAgIG91dFsyXSA9IHggKiBtWzJdICsgeSAqIG1bNV0gKyB6ICogbVs4XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMzIHdpdGggYSBxdWF0XG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHtxdWF0fSBxIHF1YXRlcm5pb24gdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy50cmFuc2Zvcm1RdWF0ID0gZnVuY3Rpb24ob3V0LCBhLCBxKSB7XG4gICAgLy8gYmVuY2htYXJrczogaHR0cDovL2pzcGVyZi5jb20vcXVhdGVybmlvbi10cmFuc2Zvcm0tdmVjMy1pbXBsZW1lbnRhdGlvbnNcblxuICAgIHZhciB4ID0gYVswXSwgeSA9IGFbMV0sIHogPSBhWzJdLFxuICAgICAgICBxeCA9IHFbMF0sIHF5ID0gcVsxXSwgcXogPSBxWzJdLCBxdyA9IHFbM10sXG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHF1YXQgKiB2ZWNcbiAgICAgICAgaXggPSBxdyAqIHggKyBxeSAqIHogLSBxeiAqIHksXG4gICAgICAgIGl5ID0gcXcgKiB5ICsgcXogKiB4IC0gcXggKiB6LFxuICAgICAgICBpeiA9IHF3ICogeiArIHF4ICogeSAtIHF5ICogeCxcbiAgICAgICAgaXcgPSAtcXggKiB4IC0gcXkgKiB5IC0gcXogKiB6O1xuXG4gICAgLy8gY2FsY3VsYXRlIHJlc3VsdCAqIGludmVyc2UgcXVhdFxuICAgIG91dFswXSA9IGl4ICogcXcgKyBpdyAqIC1xeCArIGl5ICogLXF6IC0gaXogKiAtcXk7XG4gICAgb3V0WzFdID0gaXkgKiBxdyArIGl3ICogLXF5ICsgaXogKiAtcXggLSBpeCAqIC1xejtcbiAgICBvdXRbMl0gPSBpeiAqIHF3ICsgaXcgKiAtcXogKyBpeCAqIC1xeSAtIGl5ICogLXF4O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSBhIDNEIHZlY3RvciBhcm91bmQgdGhlIHgtYXhpc1xuICogQHBhcmFtIHt2ZWMzfSBvdXQgVGhlIHJlY2VpdmluZyB2ZWMzXG4gKiBAcGFyYW0ge3ZlYzN9IGEgVGhlIHZlYzMgcG9pbnQgdG8gcm90YXRlXG4gKiBAcGFyYW0ge3ZlYzN9IGIgVGhlIG9yaWdpbiBvZiB0aGUgcm90YXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBjIFRoZSBhbmdsZSBvZiByb3RhdGlvblxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnJvdGF0ZVggPSBmdW5jdGlvbihvdXQsIGEsIGIsIGMpe1xuICAgdmFyIHAgPSBbXSwgcj1bXTtcblx0ICAvL1RyYW5zbGF0ZSBwb2ludCB0byB0aGUgb3JpZ2luXG5cdCAgcFswXSA9IGFbMF0gLSBiWzBdO1xuXHQgIHBbMV0gPSBhWzFdIC0gYlsxXTtcbiAgXHRwWzJdID0gYVsyXSAtIGJbMl07XG5cblx0ICAvL3BlcmZvcm0gcm90YXRpb25cblx0ICByWzBdID0gcFswXTtcblx0ICByWzFdID0gcFsxXSpNYXRoLmNvcyhjKSAtIHBbMl0qTWF0aC5zaW4oYyk7XG5cdCAgclsyXSA9IHBbMV0qTWF0aC5zaW4oYykgKyBwWzJdKk1hdGguY29zKGMpO1xuXG5cdCAgLy90cmFuc2xhdGUgdG8gY29ycmVjdCBwb3NpdGlvblxuXHQgIG91dFswXSA9IHJbMF0gKyBiWzBdO1xuXHQgIG91dFsxXSA9IHJbMV0gKyBiWzFdO1xuXHQgIG91dFsyXSA9IHJbMl0gKyBiWzJdO1xuXG4gIFx0cmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlIGEgM0QgdmVjdG9yIGFyb3VuZCB0aGUgeS1heGlzXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCBUaGUgcmVjZWl2aW5nIHZlYzNcbiAqIEBwYXJhbSB7dmVjM30gYSBUaGUgdmVjMyBwb2ludCB0byByb3RhdGVcbiAqIEBwYXJhbSB7dmVjM30gYiBUaGUgb3JpZ2luIG9mIHRoZSByb3RhdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IGMgVGhlIGFuZ2xlIG9mIHJvdGF0aW9uXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMucm90YXRlWSA9IGZ1bmN0aW9uKG91dCwgYSwgYiwgYyl7XG4gIFx0dmFyIHAgPSBbXSwgcj1bXTtcbiAgXHQvL1RyYW5zbGF0ZSBwb2ludCB0byB0aGUgb3JpZ2luXG4gIFx0cFswXSA9IGFbMF0gLSBiWzBdO1xuICBcdHBbMV0gPSBhWzFdIC0gYlsxXTtcbiAgXHRwWzJdID0gYVsyXSAtIGJbMl07XG4gIFxuICBcdC8vcGVyZm9ybSByb3RhdGlvblxuICBcdHJbMF0gPSBwWzJdKk1hdGguc2luKGMpICsgcFswXSpNYXRoLmNvcyhjKTtcbiAgXHRyWzFdID0gcFsxXTtcbiAgXHRyWzJdID0gcFsyXSpNYXRoLmNvcyhjKSAtIHBbMF0qTWF0aC5zaW4oYyk7XG4gIFxuICBcdC8vdHJhbnNsYXRlIHRvIGNvcnJlY3QgcG9zaXRpb25cbiAgXHRvdXRbMF0gPSByWzBdICsgYlswXTtcbiAgXHRvdXRbMV0gPSByWzFdICsgYlsxXTtcbiAgXHRvdXRbMl0gPSByWzJdICsgYlsyXTtcbiAgXG4gIFx0cmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlIGEgM0QgdmVjdG9yIGFyb3VuZCB0aGUgei1heGlzXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCBUaGUgcmVjZWl2aW5nIHZlYzNcbiAqIEBwYXJhbSB7dmVjM30gYSBUaGUgdmVjMyBwb2ludCB0byByb3RhdGVcbiAqIEBwYXJhbSB7dmVjM30gYiBUaGUgb3JpZ2luIG9mIHRoZSByb3RhdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IGMgVGhlIGFuZ2xlIG9mIHJvdGF0aW9uXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMucm90YXRlWiA9IGZ1bmN0aW9uKG91dCwgYSwgYiwgYyl7XG4gIFx0dmFyIHAgPSBbXSwgcj1bXTtcbiAgXHQvL1RyYW5zbGF0ZSBwb2ludCB0byB0aGUgb3JpZ2luXG4gIFx0cFswXSA9IGFbMF0gLSBiWzBdO1xuICBcdHBbMV0gPSBhWzFdIC0gYlsxXTtcbiAgXHRwWzJdID0gYVsyXSAtIGJbMl07XG4gIFxuICBcdC8vcGVyZm9ybSByb3RhdGlvblxuICBcdHJbMF0gPSBwWzBdKk1hdGguY29zKGMpIC0gcFsxXSpNYXRoLnNpbihjKTtcbiAgXHRyWzFdID0gcFswXSpNYXRoLnNpbihjKSArIHBbMV0qTWF0aC5jb3MoYyk7XG4gIFx0clsyXSA9IHBbMl07XG4gIFxuICBcdC8vdHJhbnNsYXRlIHRvIGNvcnJlY3QgcG9zaXRpb25cbiAgXHRvdXRbMF0gPSByWzBdICsgYlswXTtcbiAgXHRvdXRbMV0gPSByWzFdICsgYlsxXTtcbiAgXHRvdXRbMl0gPSByWzJdICsgYlsyXTtcbiAgXG4gIFx0cmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybSBzb21lIG9wZXJhdGlvbiBvdmVyIGFuIGFycmF5IG9mIHZlYzNzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGEgdGhlIGFycmF5IG9mIHZlY3RvcnMgdG8gaXRlcmF0ZSBvdmVyXG4gKiBAcGFyYW0ge051bWJlcn0gc3RyaWRlIE51bWJlciBvZiBlbGVtZW50cyBiZXR3ZWVuIHRoZSBzdGFydCBvZiBlYWNoIHZlYzMuIElmIDAgYXNzdW1lcyB0aWdodGx5IHBhY2tlZFxuICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldCBOdW1iZXIgb2YgZWxlbWVudHMgdG8gc2tpcCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheVxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IE51bWJlciBvZiB2ZWMzcyB0byBpdGVyYXRlIG92ZXIuIElmIDAgaXRlcmF0ZXMgb3ZlciBlbnRpcmUgYXJyYXlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggdmVjdG9yIGluIHRoZSBhcnJheVxuICogQHBhcmFtIHtPYmplY3R9IFthcmddIGFkZGl0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyB0byBmblxuICogQHJldHVybnMge0FycmF5fSBhXG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5mb3JFYWNoID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ZWMgPSB2ZWMzLmNyZWF0ZSgpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGEsIHN0cmlkZSwgb2Zmc2V0LCBjb3VudCwgZm4sIGFyZykge1xuICAgICAgICB2YXIgaSwgbDtcbiAgICAgICAgaWYoIXN0cmlkZSkge1xuICAgICAgICAgICAgc3RyaWRlID0gMztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCFvZmZzZXQpIHtcbiAgICAgICAgICAgIG9mZnNldCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmKGNvdW50KSB7XG4gICAgICAgICAgICBsID0gTWF0aC5taW4oKGNvdW50ICogc3RyaWRlKSArIG9mZnNldCwgYS5sZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbCA9IGEubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGkgPSBvZmZzZXQ7IGkgPCBsOyBpICs9IHN0cmlkZSkge1xuICAgICAgICAgICAgdmVjWzBdID0gYVtpXTsgdmVjWzFdID0gYVtpKzFdOyB2ZWNbMl0gPSBhW2krMl07XG4gICAgICAgICAgICBmbih2ZWMsIHZlYywgYXJnKTtcbiAgICAgICAgICAgIGFbaV0gPSB2ZWNbMF07IGFbaSsxXSA9IHZlY1sxXTsgYVtpKzJdID0gdmVjWzJdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYTtcbiAgICB9O1xufSkoKTtcblxuLyoqXG4gKiBHZXQgdGhlIGFuZ2xlIGJldHdlZW4gdHdvIDNEIHZlY3RvcnNcbiAqIEBwYXJhbSB7dmVjM30gYSBUaGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIFRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gVGhlIGFuZ2xlIGluIHJhZGlhbnNcbiAqL1xudmVjMy5hbmdsZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgIFxuICAgIHZhciB0ZW1wQSA9IHZlYzMuZnJvbVZhbHVlcyhhWzBdLCBhWzFdLCBhWzJdKTtcbiAgICB2YXIgdGVtcEIgPSB2ZWMzLmZyb21WYWx1ZXMoYlswXSwgYlsxXSwgYlsyXSk7XG4gXG4gICAgdmVjMy5ub3JtYWxpemUodGVtcEEsIHRlbXBBKTtcbiAgICB2ZWMzLm5vcm1hbGl6ZSh0ZW1wQiwgdGVtcEIpO1xuIFxuICAgIHZhciBjb3NpbmUgPSB2ZWMzLmRvdCh0ZW1wQSwgdGVtcEIpO1xuXG4gICAgaWYoY29zaW5lID4gMS4wKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYWNvcyhjb3NpbmUpO1xuICAgIH0gICAgIFxufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgdmVjdG9yXG4gKlxuICogQHBhcmFtIHt2ZWMzfSB2ZWMgdmVjdG9yIHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAqL1xudmVjMy5zdHIgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiAndmVjMygnICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnKSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHZlY3RvcnMgaGF2ZSBleGFjdGx5IHRoZSBzYW1lIGVsZW1lbnRzIGluIHRoZSBzYW1lIHBvc2l0aW9uICh3aGVuIGNvbXBhcmVkIHdpdGggPT09KVxuICpcbiAqIEBwYXJhbSB7dmVjM30gYSBUaGUgZmlyc3QgdmVjdG9yLlxuICogQHBhcmFtIHt2ZWMzfSBiIFRoZSBzZWNvbmQgdmVjdG9yLlxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIHZlY3RvcnMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbnZlYzMuZXhhY3RFcXVhbHMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhWzBdID09PSBiWzBdICYmIGFbMV0gPT09IGJbMV0gJiYgYVsyXSA9PT0gYlsyXTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgdmVjdG9ycyBoYXZlIGFwcHJveGltYXRlbHkgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24uXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBhIFRoZSBmaXJzdCB2ZWN0b3IuXG4gKiBAcGFyYW0ge3ZlYzN9IGIgVGhlIHNlY29uZCB2ZWN0b3IuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmVjdG9ycyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xudmVjMy5lcXVhbHMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdO1xuICAgIHZhciBiMCA9IGJbMF0sIGIxID0gYlsxXSwgYjIgPSBiWzJdO1xuICAgIHJldHVybiAoTWF0aC5hYnMoYTAgLSBiMCkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEwKSwgTWF0aC5hYnMoYjApKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTEgLSBiMSkgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGExKSwgTWF0aC5hYnMoYjEpKSAmJlxuICAgICAgICAgICAgTWF0aC5hYnMoYTIgLSBiMikgPD0gZ2xNYXRyaXguRVBTSUxPTipNYXRoLm1heCgxLjAsIE1hdGguYWJzKGEyKSwgTWF0aC5hYnMoYjIpKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzM7XG4iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG52YXIgZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9jb21tb24uanNcIik7XG5cbi8qKlxuICogQGNsYXNzIDQgRGltZW5zaW9uYWwgVmVjdG9yXG4gKiBAbmFtZSB2ZWM0XG4gKi9cbnZhciB2ZWM0ID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldywgZW1wdHkgdmVjNFxuICpcbiAqIEByZXR1cm5zIHt2ZWM0fSBhIG5ldyA0RCB2ZWN0b3JcbiAqL1xudmVjNC5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XG4gICAgb3V0WzBdID0gMDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzQgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIGNsb25lXG4gKiBAcmV0dXJucyB7dmVjNH0gYSBuZXcgNEQgdmVjdG9yXG4gKi9cbnZlYzQuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDQpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB2ZWM0IGluaXRpYWxpemVkIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHogWiBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB3IFcgY29tcG9uZW50XG4gKiBAcmV0dXJucyB7dmVjNH0gYSBuZXcgNEQgdmVjdG9yXG4gKi9cbnZlYzQuZnJvbVZhbHVlcyA9IGZ1bmN0aW9uKHgsIHksIHosIHcpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIG91dFsyXSA9IHo7XG4gICAgb3V0WzNdID0gdztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgdmVjNCB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgc291cmNlIHZlY3RvclxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LmNvcHkgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzQgdG8gdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0gdyBXIGNvbXBvbmVudFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LnNldCA9IGZ1bmN0aW9uKG91dCwgeCwgeSwgeiwgdykge1xuICAgIG91dFswXSA9IHg7XG4gICAgb3V0WzFdID0geTtcbiAgICBvdXRbMl0gPSB6O1xuICAgIG91dFszXSA9IHc7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LmFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKyBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gKyBiWzJdO1xuICAgIG91dFszXSA9IGFbM10gKyBiWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyB2ZWN0b3IgYiBmcm9tIHZlY3RvciBhXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LnN1YnRyYWN0ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAtIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAtIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSAtIGJbMl07XG4gICAgb3V0WzNdID0gYVszXSAtIGJbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0LnN1YnRyYWN0fVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQuc3ViID0gdmVjNC5zdWJ0cmFjdDtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQubXVsdGlwbHkgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICogYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdICogYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdICogYlsyXTtcbiAgICBvdXRbM10gPSBhWzNdICogYlszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzQubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjNC5tdWwgPSB2ZWM0Lm11bHRpcGx5O1xuXG4vKipcbiAqIERpdmlkZXMgdHdvIHZlYzQnc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5kaXZpZGUgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC8gYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdIC8gYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdIC8gYlsyXTtcbiAgICBvdXRbM10gPSBhWzNdIC8gYlszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzQuZGl2aWRlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQuZGl2ID0gdmVjNC5kaXZpZGU7XG5cbi8qKlxuICogTWF0aC5jZWlsIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjNFxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIGNlaWxcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5jZWlsID0gZnVuY3Rpb24gKG91dCwgYSkge1xuICAgIG91dFswXSA9IE1hdGguY2VpbChhWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLmNlaWwoYVsxXSk7XG4gICAgb3V0WzJdID0gTWF0aC5jZWlsKGFbMl0pO1xuICAgIG91dFszXSA9IE1hdGguY2VpbChhWzNdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBNYXRoLmZsb29yIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjNFxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIGZsb29yXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQuZmxvb3IgPSBmdW5jdGlvbiAob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gTWF0aC5mbG9vcihhWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLmZsb29yKGFbMV0pO1xuICAgIG91dFsyXSA9IE1hdGguZmxvb3IoYVsyXSk7XG4gICAgb3V0WzNdID0gTWF0aC5mbG9vcihhWzNdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtaW5pbXVtIG9mIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQubWluID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gTWF0aC5taW4oYVswXSwgYlswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5taW4oYVsxXSwgYlsxXSk7XG4gICAgb3V0WzJdID0gTWF0aC5taW4oYVsyXSwgYlsyXSk7XG4gICAgb3V0WzNdID0gTWF0aC5taW4oYVszXSwgYlszXSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWF4aW11bSBvZiB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0Lm1heCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IE1hdGgubWF4KGFbMF0sIGJbMF0pO1xuICAgIG91dFsxXSA9IE1hdGgubWF4KGFbMV0sIGJbMV0pO1xuICAgIG91dFsyXSA9IE1hdGgubWF4KGFbMl0sIGJbMl0pO1xuICAgIG91dFszXSA9IE1hdGgubWF4KGFbM10sIGJbM10pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE1hdGgucm91bmQgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWM0XG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB2ZWN0b3IgdG8gcm91bmRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5yb3VuZCA9IGZ1bmN0aW9uIChvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBNYXRoLnJvdW5kKGFbMF0pO1xuICAgIG91dFsxXSA9IE1hdGgucm91bmQoYVsxXSk7XG4gICAgb3V0WzJdID0gTWF0aC5yb3VuZChhWzJdKTtcbiAgICBvdXRbM10gPSBNYXRoLnJvdW5kKGFbM10pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyBhIHZlYzQgYnkgYSBzY2FsYXIgbnVtYmVyXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgdmVjdG9yIHRvIHNjYWxlXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIHZlY3RvciBieVxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGI7XG4gICAgb3V0WzFdID0gYVsxXSAqIGI7XG4gICAgb3V0WzJdID0gYVsyXSAqIGI7XG4gICAgb3V0WzNdID0gYVszXSAqIGI7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjNCdzIGFmdGVyIHNjYWxpbmcgdGhlIHNlY29uZCBvcGVyYW5kIGJ5IGEgc2NhbGFyIHZhbHVlXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxlIHRoZSBhbW91bnQgdG8gc2NhbGUgYiBieSBiZWZvcmUgYWRkaW5nXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQuc2NhbGVBbmRBZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIsIHNjYWxlKSB7XG4gICAgb3V0WzBdID0gYVswXSArIChiWzBdICogc2NhbGUpO1xuICAgIG91dFsxXSA9IGFbMV0gKyAoYlsxXSAqIHNjYWxlKTtcbiAgICBvdXRbMl0gPSBhWzJdICsgKGJbMl0gKiBzY2FsZSk7XG4gICAgb3V0WzNdID0gYVszXSArIChiWzNdICogc2NhbGUpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYlxuICovXG52ZWM0LmRpc3RhbmNlID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXSxcbiAgICAgICAgeiA9IGJbMl0gLSBhWzJdLFxuICAgICAgICB3ID0gYlszXSAtIGFbM107XG4gICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkgKyB6KnogKyB3KncpO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzQuZGlzdGFuY2V9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjNC5kaXN0ID0gdmVjNC5kaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzQuc3F1YXJlZERpc3RhbmNlID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXSxcbiAgICAgICAgeiA9IGJbMl0gLSBhWzJdLFxuICAgICAgICB3ID0gYlszXSAtIGFbM107XG4gICAgcmV0dXJuIHgqeCArIHkqeSArIHoqeiArIHcqdztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0LnNxdWFyZWREaXN0YW5jZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWM0LnNxckRpc3QgPSB2ZWM0LnNxdWFyZWREaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggb2YgYSB2ZWM0XG4gKlxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBjYWxjdWxhdGUgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBsZW5ndGggb2YgYVxuICovXG52ZWM0Lmxlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXSxcbiAgICAgICAgeiA9IGFbMl0sXG4gICAgICAgIHcgPSBhWzNdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5ICsgeip6ICsgdyp3KTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0Lmxlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWM0LmxlbiA9IHZlYzQubGVuZ3RoO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIGEgdmVjNFxuICpcbiAqIEBwYXJhbSB7dmVjNH0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIHNxdWFyZWQgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGxlbmd0aCBvZiBhXG4gKi9cbnZlYzQuc3F1YXJlZExlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXSxcbiAgICAgICAgeiA9IGFbMl0sXG4gICAgICAgIHcgPSBhWzNdO1xuICAgIHJldHVybiB4KnggKyB5KnkgKyB6KnogKyB3Knc7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5zcXVhcmVkTGVuZ3RofVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQuc3FyTGVuID0gdmVjNC5zcXVhcmVkTGVuZ3RoO1xuXG4vKipcbiAqIE5lZ2F0ZXMgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWM0XG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB2ZWN0b3IgdG8gbmVnYXRlXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQubmVnYXRlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gLWFbMF07XG4gICAgb3V0WzFdID0gLWFbMV07XG4gICAgb3V0WzJdID0gLWFbMl07XG4gICAgb3V0WzNdID0gLWFbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW52ZXJzZSBvZiB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzRcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBpbnZlcnRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5pbnZlcnNlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gIG91dFswXSA9IDEuMCAvIGFbMF07XG4gIG91dFsxXSA9IDEuMCAvIGFbMV07XG4gIG91dFsyXSA9IDEuMCAvIGFbMl07XG4gIG91dFszXSA9IDEuMCAvIGFbM107XG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIHZlYzRcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBub3JtYWxpemVcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5ub3JtYWxpemUgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdLFxuICAgICAgICB6ID0gYVsyXSxcbiAgICAgICAgdyA9IGFbM107XG4gICAgdmFyIGxlbiA9IHgqeCArIHkqeSArIHoqeiArIHcqdztcbiAgICBpZiAobGVuID4gMCkge1xuICAgICAgICBsZW4gPSAxIC8gTWF0aC5zcXJ0KGxlbik7XG4gICAgICAgIG91dFswXSA9IHggKiBsZW47XG4gICAgICAgIG91dFsxXSA9IHkgKiBsZW47XG4gICAgICAgIG91dFsyXSA9IHogKiBsZW47XG4gICAgICAgIG91dFszXSA9IHcgKiBsZW47XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRvdCBwcm9kdWN0IG9mIGEgYW5kIGJcbiAqL1xudmVjNC5kb3QgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhWzBdICogYlswXSArIGFbMV0gKiBiWzFdICsgYVsyXSAqIGJbMl0gKyBhWzNdICogYlszXTtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgYSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQubGVycCA9IGZ1bmN0aW9uIChvdXQsIGEsIGIsIHQpIHtcbiAgICB2YXIgYXggPSBhWzBdLFxuICAgICAgICBheSA9IGFbMV0sXG4gICAgICAgIGF6ID0gYVsyXSxcbiAgICAgICAgYXcgPSBhWzNdO1xuICAgIG91dFswXSA9IGF4ICsgdCAqIChiWzBdIC0gYXgpO1xuICAgIG91dFsxXSA9IGF5ICsgdCAqIChiWzFdIC0gYXkpO1xuICAgIG91dFsyXSA9IGF6ICsgdCAqIChiWzJdIC0gYXopO1xuICAgIG91dFszXSA9IGF3ICsgdCAqIChiWzNdIC0gYXcpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHJhbmRvbSB2ZWN0b3Igd2l0aCB0aGUgZ2l2ZW4gc2NhbGVcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHtOdW1iZXJ9IFtzY2FsZV0gTGVuZ3RoIG9mIHRoZSByZXN1bHRpbmcgdmVjdG9yLiBJZiBvbW1pdHRlZCwgYSB1bml0IHZlY3RvciB3aWxsIGJlIHJldHVybmVkXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQucmFuZG9tID0gZnVuY3Rpb24gKG91dCwgc2NhbGUpIHtcbiAgICBzY2FsZSA9IHNjYWxlIHx8IDEuMDtcblxuICAgIC8vVE9ETzogVGhpcyBpcyBhIHByZXR0eSBhd2Z1bCB3YXkgb2YgZG9pbmcgdGhpcy4gRmluZCBzb21ldGhpbmcgYmV0dGVyLlxuICAgIG91dFswXSA9IGdsTWF0cml4LlJBTkRPTSgpO1xuICAgIG91dFsxXSA9IGdsTWF0cml4LlJBTkRPTSgpO1xuICAgIG91dFsyXSA9IGdsTWF0cml4LlJBTkRPTSgpO1xuICAgIG91dFszXSA9IGdsTWF0cml4LlJBTkRPTSgpO1xuICAgIHZlYzQubm9ybWFsaXplKG91dCwgb3V0KTtcbiAgICB2ZWM0LnNjYWxlKG91dCwgb3V0LCBzY2FsZSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgdmVjNCB3aXRoIGEgbWF0NC5cbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gKiBAcGFyYW0ge21hdDR9IG0gbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQudHJhbnNmb3JtTWF0NCA9IGZ1bmN0aW9uKG91dCwgYSwgbSkge1xuICAgIHZhciB4ID0gYVswXSwgeSA9IGFbMV0sIHogPSBhWzJdLCB3ID0gYVszXTtcbiAgICBvdXRbMF0gPSBtWzBdICogeCArIG1bNF0gKiB5ICsgbVs4XSAqIHogKyBtWzEyXSAqIHc7XG4gICAgb3V0WzFdID0gbVsxXSAqIHggKyBtWzVdICogeSArIG1bOV0gKiB6ICsgbVsxM10gKiB3O1xuICAgIG91dFsyXSA9IG1bMl0gKiB4ICsgbVs2XSAqIHkgKyBtWzEwXSAqIHogKyBtWzE0XSAqIHc7XG4gICAgb3V0WzNdID0gbVszXSAqIHggKyBtWzddICogeSArIG1bMTFdICogeiArIG1bMTVdICogdztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWM0IHdpdGggYSBxdWF0XG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHtxdWF0fSBxIHF1YXRlcm5pb24gdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC50cmFuc2Zvcm1RdWF0ID0gZnVuY3Rpb24ob3V0LCBhLCBxKSB7XG4gICAgdmFyIHggPSBhWzBdLCB5ID0gYVsxXSwgeiA9IGFbMl0sXG4gICAgICAgIHF4ID0gcVswXSwgcXkgPSBxWzFdLCBxeiA9IHFbMl0sIHF3ID0gcVszXSxcblxuICAgICAgICAvLyBjYWxjdWxhdGUgcXVhdCAqIHZlY1xuICAgICAgICBpeCA9IHF3ICogeCArIHF5ICogeiAtIHF6ICogeSxcbiAgICAgICAgaXkgPSBxdyAqIHkgKyBxeiAqIHggLSBxeCAqIHosXG4gICAgICAgIGl6ID0gcXcgKiB6ICsgcXggKiB5IC0gcXkgKiB4LFxuICAgICAgICBpdyA9IC1xeCAqIHggLSBxeSAqIHkgLSBxeiAqIHo7XG5cbiAgICAvLyBjYWxjdWxhdGUgcmVzdWx0ICogaW52ZXJzZSBxdWF0XG4gICAgb3V0WzBdID0gaXggKiBxdyArIGl3ICogLXF4ICsgaXkgKiAtcXogLSBpeiAqIC1xeTtcbiAgICBvdXRbMV0gPSBpeSAqIHF3ICsgaXcgKiAtcXkgKyBpeiAqIC1xeCAtIGl4ICogLXF6O1xuICAgIG91dFsyXSA9IGl6ICogcXcgKyBpdyAqIC1xeiArIGl4ICogLXF5IC0gaXkgKiAtcXg7XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtIHNvbWUgb3BlcmF0aW9uIG92ZXIgYW4gYXJyYXkgb2YgdmVjNHMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYSB0aGUgYXJyYXkgb2YgdmVjdG9ycyB0byBpdGVyYXRlIG92ZXJcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdHJpZGUgTnVtYmVyIG9mIGVsZW1lbnRzIGJldHdlZW4gdGhlIHN0YXJ0IG9mIGVhY2ggdmVjNC4gSWYgMCBhc3N1bWVzIHRpZ2h0bHkgcGFja2VkXG4gKiBAcGFyYW0ge051bWJlcn0gb2Zmc2V0IE51bWJlciBvZiBlbGVtZW50cyB0byBza2lwIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5XG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgTnVtYmVyIG9mIHZlYzRzIHRvIGl0ZXJhdGUgb3Zlci4gSWYgMCBpdGVyYXRlcyBvdmVyIGVudGlyZSBhcnJheVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCB2ZWN0b3IgaW4gdGhlIGFycmF5XG4gKiBAcGFyYW0ge09iamVjdH0gW2FyZ10gYWRkaXRpb25hbCBhcmd1bWVudCB0byBwYXNzIHRvIGZuXG4gKiBAcmV0dXJucyB7QXJyYXl9IGFcbiAqIEBmdW5jdGlvblxuICovXG52ZWM0LmZvckVhY2ggPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZlYyA9IHZlYzQuY3JlYXRlKCk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oYSwgc3RyaWRlLCBvZmZzZXQsIGNvdW50LCBmbiwgYXJnKSB7XG4gICAgICAgIHZhciBpLCBsO1xuICAgICAgICBpZighc3RyaWRlKSB7XG4gICAgICAgICAgICBzdHJpZGUgPSA0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIW9mZnNldCkge1xuICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYoY291bnQpIHtcbiAgICAgICAgICAgIGwgPSBNYXRoLm1pbigoY291bnQgKiBzdHJpZGUpICsgb2Zmc2V0LCBhLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsID0gYS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IG9mZnNldDsgaSA8IGw7IGkgKz0gc3RyaWRlKSB7XG4gICAgICAgICAgICB2ZWNbMF0gPSBhW2ldOyB2ZWNbMV0gPSBhW2krMV07IHZlY1syXSA9IGFbaSsyXTsgdmVjWzNdID0gYVtpKzNdO1xuICAgICAgICAgICAgZm4odmVjLCB2ZWMsIGFyZyk7XG4gICAgICAgICAgICBhW2ldID0gdmVjWzBdOyBhW2krMV0gPSB2ZWNbMV07IGFbaSsyXSA9IHZlY1syXTsgYVtpKzNdID0gdmVjWzNdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYTtcbiAgICB9O1xufSkoKTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgdmVjdG9yXG4gKlxuICogQHBhcmFtIHt2ZWM0fSB2ZWMgdmVjdG9yIHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAqL1xudmVjNC5zdHIgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiAndmVjNCgnICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnLCAnICsgYVszXSArICcpJztcbn07XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgdmVjdG9ycyBoYXZlIGV4YWN0bHkgdGhlIHNhbWUgZWxlbWVudHMgaW4gdGhlIHNhbWUgcG9zaXRpb24gKHdoZW4gY29tcGFyZWQgd2l0aCA9PT0pXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBhIFRoZSBmaXJzdCB2ZWN0b3IuXG4gKiBAcGFyYW0ge3ZlYzR9IGIgVGhlIHNlY29uZCB2ZWN0b3IuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgdmVjdG9ycyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xudmVjNC5leGFjdEVxdWFscyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gPT09IGJbMF0gJiYgYVsxXSA9PT0gYlsxXSAmJiBhWzJdID09PSBiWzJdICYmIGFbM10gPT09IGJbM107XG59O1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHZlY3RvcnMgaGF2ZSBhcHByb3hpbWF0ZWx5IHRoZSBzYW1lIGVsZW1lbnRzIGluIHRoZSBzYW1lIHBvc2l0aW9uLlxuICpcbiAqIEBwYXJhbSB7dmVjNH0gYSBUaGUgZmlyc3QgdmVjdG9yLlxuICogQHBhcmFtIHt2ZWM0fSBiIFRoZSBzZWNvbmQgdmVjdG9yLlxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIHZlY3RvcnMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbnZlYzQuZXF1YWxzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdO1xuICAgIHZhciBiMCA9IGJbMF0sIGIxID0gYlsxXSwgYjIgPSBiWzJdLCBiMyA9IGJbM107XG4gICAgcmV0dXJuIChNYXRoLmFicyhhMCAtIGIwKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTApLCBNYXRoLmFicyhiMCkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMSAtIGIxKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTEpLCBNYXRoLmFicyhiMSkpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMiAtIGIyKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTIpLCBNYXRoLmFicyhiMikpICYmXG4gICAgICAgICAgICBNYXRoLmFicyhhMyAtIGIzKSA8PSBnbE1hdHJpeC5FUFNJTE9OKk1hdGgubWF4KDEuMCwgTWF0aC5hYnMoYTMpLCBNYXRoLmFicyhiMykpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdmVjNDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIG1vZGVsXzEgPSByZXF1aXJlKFwiLi4vbW9kZWxcIik7XG52YXIgU3RhdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0YXRlKHN0cikge1xuICAgICAgICB0aGlzLnN0ciA9IHN0cjtcbiAgICAgICAgdGhpcy5wb3MgPSAwO1xuICAgIH1cbiAgICBTdGF0ZS5wcm90b3R5cGUuY2hhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyW3RoaXMucG9zXTtcbiAgICB9O1xuICAgIHJldHVybiBTdGF0ZTtcbn0oKSk7XG5mdW5jdGlvbiB0aHJvd0Vycm9yKHN0YXRlLCBzdHIpIHtcbiAgICBpZiAoc3RyID09PSB2b2lkIDApIHsgc3RyID0gJyc7IH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJTeW50YXhFcnJvciwgbmVhciBcIiArIHN0YXRlLnBvcyArIChzdHIgPyAnLCAnICsgc3RyIDogJycpKTtcbn1cbmZ1bmN0aW9uIHBhcnNlQ29tbWVudChzdGF0ZSkge1xuICAgIGlmIChzdGF0ZS5jaGFyKCkgPT09ICcvJyAmJiBzdGF0ZS5zdHJbc3RhdGUucG9zICsgMV0gPT09ICcvJykge1xuICAgICAgICBzdGF0ZS5wb3MgKz0gMjtcbiAgICAgICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXRlLnN0ci5sZW5ndGggJiYgc3RhdGUuc3RyWysrc3RhdGUucG9zXSAhPT0gJ1xcbicpXG4gICAgICAgICAgICA7XG4gICAgICAgICsrc3RhdGUucG9zO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxudmFyIHNwYWNlUkUgPSAvXFxzL2k7XG5mdW5jdGlvbiBwYXJzZVNwYWNlKHN0YXRlKSB7XG4gICAgd2hpbGUgKHNwYWNlUkUudGVzdChzdGF0ZS5jaGFyKCkpKSB7XG4gICAgICAgICsrc3RhdGUucG9zO1xuICAgIH1cbn1cbnZhciBrZXl3b3JkRmlyc3RDaGFyUkUgPSAvW2Etel0vaTtcbnZhciBrZXl3b3JkT3RoZXJDaGFyUkUgPSAvW2EtejAtOV0vaTtcbmZ1bmN0aW9uIHBhcnNlS2V5d29yZChzdGF0ZSkge1xuICAgIGlmICgha2V5d29yZEZpcnN0Q2hhclJFLnRlc3Qoc3RhdGUuY2hhcigpKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIGtleXdvcmQgPSBzdGF0ZS5jaGFyKCk7XG4gICAgKytzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKGtleXdvcmRPdGhlckNoYXJSRS50ZXN0KHN0YXRlLmNoYXIoKSkpIHtcbiAgICAgICAga2V5d29yZCArPSBzdGF0ZS5zdHJbc3RhdGUucG9zKytdO1xuICAgIH1cbiAgICBwYXJzZVNwYWNlKHN0YXRlKTtcbiAgICByZXR1cm4ga2V5d29yZDtcbn1cbmZ1bmN0aW9uIHBhcnNlU3ltYm9sKHN0YXRlLCBzeW1ib2wpIHtcbiAgICBpZiAoc3RhdGUuY2hhcigpID09PSBzeW1ib2wpIHtcbiAgICAgICAgKytzdGF0ZS5wb3M7XG4gICAgICAgIHBhcnNlU3BhY2Uoc3RhdGUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCBzeW1ib2wpIHtcbiAgICBpZiAoc3RhdGUuY2hhcigpICE9PSBzeW1ib2wpIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgXCJleHRlY3RlZCBcIiArIHN5bWJvbCk7XG4gICAgfVxuICAgICsrc3RhdGUucG9zO1xuICAgIHBhcnNlU3BhY2Uoc3RhdGUpO1xufVxuZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUuY2hhcigpID09PSAnXCInKSB7XG4gICAgICAgIHZhciBzdGFydCA9ICsrc3RhdGUucG9zOyAvLyBcIlxuICAgICAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnXCInKSB7XG4gICAgICAgICAgICArK3N0YXRlLnBvcztcbiAgICAgICAgfVxuICAgICAgICArK3N0YXRlLnBvczsgLy8gXCJcbiAgICAgICAgdmFyIHJlcyA9IHN0YXRlLnN0ci5zdWJzdHJpbmcoc3RhcnQsIHN0YXRlLnBvcyAtIDEpO1xuICAgICAgICBwYXJzZVNwYWNlKHN0YXRlKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG52YXIgbnVtYmVyRmlyc3RDaGFyUkUgPSAvWy0wLTldLztcbnZhciBudW1iZXJPdGhlckNoYXJSRSA9IC9bLSsuMC05ZV0vaTtcbmZ1bmN0aW9uIHBhcnNlTnVtYmVyKHN0YXRlKSB7XG4gICAgaWYgKG51bWJlckZpcnN0Q2hhclJFLnRlc3Qoc3RhdGUuY2hhcigpKSkge1xuICAgICAgICB2YXIgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gICAgICAgICsrc3RhdGUucG9zO1xuICAgICAgICB3aGlsZSAobnVtYmVyT3RoZXJDaGFyUkUudGVzdChzdGF0ZS5jaGFyKCkpKSB7XG4gICAgICAgICAgICArK3N0YXRlLnBvcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzID0gcGFyc2VGbG9hdChzdGF0ZS5zdHIuc3Vic3RyaW5nKHN0YXJ0LCBzdGF0ZS5wb3MpKTtcbiAgICAgICAgcGFyc2VTcGFjZShzdGF0ZSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gcGFyc2VBcnJheShzdGF0ZSwgYXJyLCBwb3MpIHtcbiAgICBpZiAoc3RhdGUuY2hhcigpICE9PSAneycpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICghYXJyKSB7XG4gICAgICAgIGFyciA9IFtdO1xuICAgICAgICBwb3MgPSAwO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIG51bSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgaWYgKG51bSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2V4cGVjdGVkIG51bWJlcicpO1xuICAgICAgICB9XG4gICAgICAgIGFycltwb3MrK10gPSBudW07XG4gICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICByZXR1cm4gYXJyO1xufVxuZnVuY3Rpb24gcGFyc2VBcnJheU9yU2luZ2xlSXRlbShzdGF0ZSwgYXJyKSB7XG4gICAgaWYgKHN0YXRlLmNoYXIoKSAhPT0gJ3snKSB7XG4gICAgICAgIGFyclswXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9XG4gICAgdmFyIHBvcyA9IDA7XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBudW0gPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgIGlmIChudW0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdleHBlY3RlZCBudW1iZXInKTtcbiAgICAgICAgfVxuICAgICAgICBhcnJbcG9zKytdID0gbnVtO1xuICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgcmV0dXJuIGFycjtcbn1cbmZ1bmN0aW9uIHBhcnNlT2JqZWN0KHN0YXRlKSB7XG4gICAgdmFyIHByZWZpeCA9IG51bGw7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgIGlmIChzdGF0ZS5jaGFyKCkgIT09ICd7Jykge1xuICAgICAgICBwcmVmaXggPSBwYXJzZVN0cmluZyhzdGF0ZSk7XG4gICAgICAgIGlmIChwcmVmaXggPT09IG51bGwpIHtcbiAgICAgICAgICAgIHByZWZpeCA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJlZml4ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZXhwZWN0ZWQgc3RyaW5nIG9yIG51bWJlcicpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIGlmICgha2V5d29yZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleXdvcmQgPT09ICdJbnRlcnZhbCcpIHtcbiAgICAgICAgICAgIHZhciBhcnJheSA9IG5ldyBVaW50MzJBcnJheSgyKTtcbiAgICAgICAgICAgIG9ialtrZXl3b3JkXSA9IHBhcnNlQXJyYXkoc3RhdGUsIGFycmF5LCAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnTWluaW11bUV4dGVudCcgfHwga2V5d29yZCA9PT0gJ01heGltdW1FeHRlbnQnKSB7XG4gICAgICAgICAgICB2YXIgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICAgICAgb2JqW2tleXdvcmRdID0gcGFyc2VBcnJheShzdGF0ZSwgYXJyYXksIDApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb2JqW2tleXdvcmRdID0gcGFyc2VBcnJheShzdGF0ZSkgfHwgcGFyc2VTdHJpbmcoc3RhdGUpO1xuICAgICAgICAgICAgaWYgKG9ialtrZXl3b3JkXSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9ialtrZXl3b3JkXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgcmV0dXJuIFtwcmVmaXgsIG9ial07XG59XG5mdW5jdGlvbiBwYXJzZVZlcnNpb24oc3RhdGUsIG1vZGVsKSB7XG4gICAgdmFyIF9hID0gcGFyc2VPYmplY3Qoc3RhdGUpLCB1bnVzZWQgPSBfYVswXSwgb2JqID0gX2FbMV07XG4gICAgaWYgKG9iai5Gb3JtYXRWZXJzaW9uKSB7XG4gICAgICAgIG1vZGVsLlZlcnNpb24gPSBvYmouRm9ybWF0VmVyc2lvbjtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZU1vZGVsSW5mbyhzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgX2EgPSBwYXJzZU9iamVjdChzdGF0ZSksIG5hbWUgPSBfYVswXSwgb2JqID0gX2FbMV07XG4gICAgbW9kZWwuSW5mbyA9IG9iajtcbiAgICBtb2RlbC5JbmZvLk5hbWUgPSBuYW1lO1xufVxuZnVuY3Rpb24gcGFyc2VTZXF1ZW5jZXMoc3RhdGUsIG1vZGVsKSB7XG4gICAgcGFyc2VOdW1iZXIoc3RhdGUpOyAvLyBjb3VudCwgbm90IHVzZWRcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHBhcnNlS2V5d29yZChzdGF0ZSk7IC8vIEFuaW1cbiAgICAgICAgdmFyIF9hID0gcGFyc2VPYmplY3Qoc3RhdGUpLCBuYW1lXzEgPSBfYVswXSwgb2JqID0gX2FbMV07XG4gICAgICAgIG9iai5OYW1lID0gbmFtZV8xO1xuICAgICAgICBvYmouTm9uTG9vcGluZyA9ICdOb25Mb29waW5nJyBpbiBvYmo7XG4gICAgICAgIHJlcy5wdXNoKG9iaik7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLlNlcXVlbmNlcyA9IHJlcztcbn1cbmZ1bmN0aW9uIHBhcnNlVGV4dHVyZXMoc3RhdGUsIG1vZGVsKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIHBhcnNlTnVtYmVyKHN0YXRlKTsgLy8gY291bnQsIG5vdCB1c2VkXG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHBhcnNlS2V5d29yZChzdGF0ZSk7IC8vIEJpdG1hcFxuICAgICAgICB2YXIgX2EgPSBwYXJzZU9iamVjdChzdGF0ZSksIHVudXNlZCA9IF9hWzBdLCBvYmogPSBfYVsxXTtcbiAgICAgICAgb2JqLkZsYWdzID0gMDtcbiAgICAgICAgaWYgKCdXcmFwV2lkdGgnIGluIG9iaikge1xuICAgICAgICAgICAgb2JqLkZsYWdzICs9IG1vZGVsXzEuVGV4dHVyZUZsYWdzLldyYXBXaWR0aDtcbiAgICAgICAgICAgIGRlbGV0ZSBvYmouV3JhcFdpZHRoO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnV3JhcEhlaWdodCcgaW4gb2JqKSB7XG4gICAgICAgICAgICBvYmouRmxhZ3MgKz0gbW9kZWxfMS5UZXh0dXJlRmxhZ3MuV3JhcEhlaWdodDtcbiAgICAgICAgICAgIGRlbGV0ZSBvYmouV3JhcEhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICByZXMucHVzaChvYmopO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5UZXh0dXJlcyA9IHJlcztcbn1cbnZhciBBbmltVmVjdG9yVHlwZTtcbihmdW5jdGlvbiAoQW5pbVZlY3RvclR5cGUpIHtcbiAgICBBbmltVmVjdG9yVHlwZVtBbmltVmVjdG9yVHlwZVtcIklOVDFcIl0gPSAwXSA9IFwiSU5UMVwiO1xuICAgIEFuaW1WZWN0b3JUeXBlW0FuaW1WZWN0b3JUeXBlW1wiRkxPQVQxXCJdID0gMV0gPSBcIkZMT0FUMVwiO1xuICAgIEFuaW1WZWN0b3JUeXBlW0FuaW1WZWN0b3JUeXBlW1wiRkxPQVQzXCJdID0gMl0gPSBcIkZMT0FUM1wiO1xuICAgIEFuaW1WZWN0b3JUeXBlW0FuaW1WZWN0b3JUeXBlW1wiRkxPQVQ0XCJdID0gM10gPSBcIkZMT0FUNFwiO1xufSkoQW5pbVZlY3RvclR5cGUgfHwgKEFuaW1WZWN0b3JUeXBlID0ge30pKTtcbnZhciBhbmltVmVjdG9yU2l6ZSA9IChfYSA9IHt9LFxuICAgIF9hW0FuaW1WZWN0b3JUeXBlLklOVDFdID0gMSxcbiAgICBfYVtBbmltVmVjdG9yVHlwZS5GTE9BVDFdID0gMSxcbiAgICBfYVtBbmltVmVjdG9yVHlwZS5GTE9BVDNdID0gMyxcbiAgICBfYVtBbmltVmVjdG9yVHlwZS5GTE9BVDRdID0gNCxcbiAgICBfYSk7XG5mdW5jdGlvbiBwYXJzZUFuaW1LZXlmcmFtZShzdGF0ZSwgZnJhbWUsIHR5cGUsIGxpbmVUeXBlKSB7XG4gICAgdmFyIHJlcyA9IHtcbiAgICAgICAgRnJhbWU6IGZyYW1lLFxuICAgICAgICBWZWN0b3I6IG51bGxcbiAgICB9O1xuICAgIHZhciBWZWN0b3IgPSB0eXBlID09PSBBbmltVmVjdG9yVHlwZS5JTlQxID8gSW50MzJBcnJheSA6IEZsb2F0MzJBcnJheTtcbiAgICB2YXIgaXRlbUNvdW50ID0gYW5pbVZlY3RvclNpemVbdHlwZV07XG4gICAgcmVzLlZlY3RvciA9IHBhcnNlQXJyYXlPclNpbmdsZUl0ZW0oc3RhdGUsIG5ldyBWZWN0b3IoaXRlbUNvdW50KSk7XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgaWYgKGxpbmVUeXBlID09PSBtb2RlbF8xLkxpbmVUeXBlLkhlcm1pdGUgfHwgbGluZVR5cGUgPT09IG1vZGVsXzEuTGluZVR5cGUuQmV6aWVyKSB7XG4gICAgICAgIHBhcnNlS2V5d29yZChzdGF0ZSk7IC8vIEluVGFuXG4gICAgICAgIHJlcy5JblRhbiA9IHBhcnNlQXJyYXlPclNpbmdsZUl0ZW0oc3RhdGUsIG5ldyBWZWN0b3IoaXRlbUNvdW50KSk7XG4gICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgICAgICBwYXJzZUtleXdvcmQoc3RhdGUpOyAvLyBPdXRUYW5cbiAgICAgICAgcmVzLk91dFRhbiA9IHBhcnNlQXJyYXlPclNpbmdsZUl0ZW0oc3RhdGUsIG5ldyBWZWN0b3IoaXRlbUNvdW50KSk7XG4gICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCB0eXBlKSB7XG4gICAgdmFyIGFuaW1WZWN0b3IgPSB7XG4gICAgICAgIExpbmVUeXBlOiBtb2RlbF8xLkxpbmVUeXBlLkRvbnRJbnRlcnAsXG4gICAgICAgIEdsb2JhbFNlcUlkOiBudWxsLFxuICAgICAgICBLZXlzOiBbXVxuICAgIH07XG4gICAgcGFyc2VOdW1iZXIoc3RhdGUpOyAvLyBjb3VudCwgbm90IHVzZWRcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB2YXIgbGluZVR5cGUgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgIGlmIChsaW5lVHlwZSA9PT0gJ0RvbnRJbnRlcnAnIHx8IGxpbmVUeXBlID09PSAnTGluZWFyJyB8fCBsaW5lVHlwZSA9PT0gJ0hlcm1pdGUnIHx8IGxpbmVUeXBlID09PSAnQmV6aWVyJykge1xuICAgICAgICBhbmltVmVjdG9yLkxpbmVUeXBlID0gbW9kZWxfMS5MaW5lVHlwZVtsaW5lVHlwZV07XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnR2xvYmFsU2VxSWQnKSB7XG4gICAgICAgICAgICBhbmltVmVjdG9yW2tleXdvcmRdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgZnJhbWUgPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgICAgICBpZiAoZnJhbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZXhwZWN0ZWQgZnJhbWUgbnVtYmVyIG9yIEdsb2JhbFNlcUlkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJzonKTtcbiAgICAgICAgICAgIGFuaW1WZWN0b3IuS2V5cy5wdXNoKHBhcnNlQW5pbUtleWZyYW1lKHN0YXRlLCBmcmFtZSwgdHlwZSwgYW5pbVZlY3Rvci5MaW5lVHlwZSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIHJldHVybiBhbmltVmVjdG9yO1xufVxuZnVuY3Rpb24gcGFyc2VMYXllcihzdGF0ZSkge1xuICAgIHZhciByZXMgPSB7XG4gICAgICAgIEFscGhhOiBudWxsLFxuICAgICAgICBUVmVydGV4QW5pbUlkOiBudWxsLFxuICAgICAgICBTaGFkaW5nOiAwLFxuICAgICAgICBDb29yZElkOiAwXG4gICAgfTtcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICB2YXIgaXNTdGF0aWMgPSBmYWxzZTtcbiAgICAgICAgaWYgKCFrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICAgICAgIGlzU3RhdGljID0gdHJ1ZTtcbiAgICAgICAgICAgIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNTdGF0aWMgJiYga2V5d29yZCA9PT0gJ1RleHR1cmVJRCcpIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgQW5pbVZlY3RvclR5cGUuSU5UMSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWlzU3RhdGljICYmIGtleXdvcmQgPT09ICdBbHBoYScpIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnVW5zaGFkZWQnIHx8IGtleXdvcmQgPT09ICdTcGhlcmVFbnZNYXAnIHx8IGtleXdvcmQgPT09ICdUd29TaWRlZCcgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdVbmZvZ2dlZCcgfHwga2V5d29yZCA9PT0gJ05vRGVwdGhUZXN0JyB8fCBrZXl3b3JkID09PSAnTm9EZXB0aFNldCcpIHtcbiAgICAgICAgICAgIHJlcy5TaGFkaW5nIHw9IG1vZGVsXzEuTGF5ZXJTaGFkaW5nW2tleXdvcmRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdGaWx0ZXJNb2RlJykge1xuICAgICAgICAgICAgdmFyIHZhbCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgICAgICBpZiAodmFsID09PSAnTm9uZScgfHwgdmFsID09PSAnVHJhbnNwYXJlbnQnIHx8IHZhbCA9PT0gJ0JsZW5kJyB8fCB2YWwgPT09ICdBZGRpdGl2ZScgfHxcbiAgICAgICAgICAgICAgICB2YWwgPT09ICdBZGRBbHBoYScgfHwgdmFsID09PSAnTW9kdWxhdGUnIHx8IHZhbCA9PT0gJ01vZHVsYXRlMngnKSB7XG4gICAgICAgICAgICAgICAgcmVzLkZpbHRlck1vZGUgPSBtb2RlbF8xLkZpbHRlck1vZGVbdmFsXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnVFZlcnRleEFuaW1JZCcpIHtcbiAgICAgICAgICAgIHJlcy5UVmVydGV4QW5pbUlkID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbCA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgICAgIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gdmFsO1xuICAgICAgICB9XG4gICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gcGFyc2VNYXRlcmlhbHMoc3RhdGUsIG1vZGVsKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIHBhcnNlTnVtYmVyKHN0YXRlKTsgLy8gY291bnQsIG5vdCB1c2VkXG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBvYmogPSB7XG4gICAgICAgICAgICBSZW5kZXJNb2RlOiAwLFxuICAgICAgICAgICAgTGF5ZXJzOiBbXVxuICAgICAgICB9O1xuICAgICAgICBwYXJzZUtleXdvcmQoc3RhdGUpOyAvLyBNYXRlcmlhbFxuICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICAgICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgICAgICBpZiAoIWtleXdvcmQpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChrZXl3b3JkID09PSAnTGF5ZXInKSB7XG4gICAgICAgICAgICAgICAgb2JqLkxheWVycy5wdXNoKHBhcnNlTGF5ZXIoc3RhdGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdQcmlvcml0eVBsYW5lJykge1xuICAgICAgICAgICAgICAgIG9ialtrZXl3b3JkXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdDb25zdGFudENvbG9yJyB8fCBrZXl3b3JkID09PSAnU29ydFByaW1zRmFyWicgfHwga2V5d29yZCA9PT0gJ0Z1bGxSZXNvbHV0aW9uJykge1xuICAgICAgICAgICAgICAgIG9iai5SZW5kZXJNb2RlIHw9IG1vZGVsXzEuTWF0ZXJpYWxSZW5kZXJNb2RlW2tleXdvcmRdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIG1hdGVyaWFsIHByb3BlcnR5ICcgKyBrZXl3b3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgICAgICB9XG4gICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgICAgICByZXMucHVzaChvYmopO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5NYXRlcmlhbHMgPSByZXM7XG59XG5mdW5jdGlvbiBwYXJzZUdlb3NldChzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBWZXJ0aWNlczogbnVsbCxcbiAgICAgICAgTm9ybWFsczogbnVsbCxcbiAgICAgICAgVFZlcnRpY2VzOiBbXSxcbiAgICAgICAgVmVydGV4R3JvdXA6IG51bGwsXG4gICAgICAgIEZhY2VzOiBudWxsLFxuICAgICAgICBHcm91cHM6IG51bGwsXG4gICAgICAgIFRvdGFsR3JvdXBzQ291bnQ6IG51bGwsXG4gICAgICAgIE1pbmltdW1FeHRlbnQ6IG51bGwsXG4gICAgICAgIE1heGltdW1FeHRlbnQ6IG51bGwsXG4gICAgICAgIEJvdW5kc1JhZGl1czogbnVsbCxcbiAgICAgICAgQW5pbXM6IFtdLFxuICAgICAgICBNYXRlcmlhbElEOiBudWxsLFxuICAgICAgICBTZWxlY3Rpb25Hcm91cDogbnVsbCxcbiAgICAgICAgVW5zZWxlY3RhYmxlOiBmYWxzZVxuICAgIH07XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgaWYgKCFrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ1ZlcnRpY2VzJyB8fCBrZXl3b3JkID09PSAnTm9ybWFscycgfHwga2V5d29yZCA9PT0gJ1RWZXJ0aWNlcycpIHtcbiAgICAgICAgICAgIHZhciBjb3VudFBlck9iaiA9IDM7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ1RWZXJ0aWNlcycpIHtcbiAgICAgICAgICAgICAgICBjb3VudFBlck9iaiA9IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY291bnQgPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgICAgICB2YXIgYXJyID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIGNvdW50UGVyT2JqKTtcbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGNvdW50OyArK2luZGV4KSB7XG4gICAgICAgICAgICAgICAgcGFyc2VBcnJheShzdGF0ZSwgYXJyLCBpbmRleCAqIGNvdW50UGVyT2JqKTtcbiAgICAgICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgICAgICAgICAgaWYgKGtleXdvcmQgPT09ICdUVmVydGljZXMnKSB7XG4gICAgICAgICAgICAgICAgcmVzLlRWZXJ0aWNlcy5wdXNoKGFycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNba2V5d29yZF0gPSBhcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1ZlcnRleEdyb3VwJykge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gbmV3IFVpbnQ4QXJyYXkocmVzLlZlcnRpY2VzLmxlbmd0aCAvIDMpO1xuICAgICAgICAgICAgcGFyc2VBcnJheShzdGF0ZSwgcmVzW2tleXdvcmRdLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnRmFjZXMnKSB7XG4gICAgICAgICAgICBwYXJzZU51bWJlcihzdGF0ZSk7IC8vIGdyb3VwIGNvdW50LCBhbHdheXMgMT9cbiAgICAgICAgICAgIHZhciBpbmRleENvdW50ID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICAgICAgcmVzLkZhY2VzID0gbmV3IFVpbnQxNkFycmF5KGluZGV4Q291bnQpO1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgICAgICAgICBwYXJzZUtleXdvcmQoc3RhdGUpOyAvLyBUcmlhbmdsZXNcbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgICAgICAgICAgcGFyc2VBcnJheShzdGF0ZSwgcmVzLkZhY2VzLCAwKTtcbiAgICAgICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnR3JvdXBzJykge1xuICAgICAgICAgICAgdmFyIGdyb3VwcyA9IFtdO1xuICAgICAgICAgICAgcGFyc2VOdW1iZXIoc3RhdGUpOyAvLyBncm91cHMgY291bnQsIHVudXNlZFxuICAgICAgICAgICAgcmVzLlRvdGFsR3JvdXBzQ291bnQgPSBwYXJzZU51bWJlcihzdGF0ZSk7IC8vIHN1bW1lZCBpbiBzdWJhcnJheXNcbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgICAgICAgICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VLZXl3b3JkKHN0YXRlKTsgLy8gTWF0cmljZXNcbiAgICAgICAgICAgICAgICBncm91cHMucHVzaChwYXJzZUFycmF5KHN0YXRlKSk7XG4gICAgICAgICAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICAgICAgICAgIHJlcy5Hcm91cHMgPSBncm91cHM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ01pbmltdW1FeHRlbnQnIHx8IGtleXdvcmQgPT09ICdNYXhpbXVtRXh0ZW50Jykge1xuICAgICAgICAgICAgdmFyIGFyciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZUFycmF5KHN0YXRlLCBhcnIsIDApO1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0JvdW5kc1JhZGl1cycgfHwga2V5d29yZCA9PT0gJ01hdGVyaWFsSUQnIHx8IGtleXdvcmQgPT09ICdTZWxlY3Rpb25Hcm91cCcpIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdBbmltJykge1xuICAgICAgICAgICAgdmFyIF9hID0gcGFyc2VPYmplY3Qoc3RhdGUpLCB1bnVzZWQgPSBfYVswXSwgb2JqID0gX2FbMV07XG4gICAgICAgICAgICBpZiAob2JqLkFscGhhID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBvYmouQWxwaGEgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLkFuaW1zLnB1c2gob2JqKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnVW5zZWxlY3RhYmxlJykge1xuICAgICAgICAgICAgcmVzLlVuc2VsZWN0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5HZW9zZXRzLnB1c2gocmVzKTtcbn1cbmZ1bmN0aW9uIHBhcnNlR2Vvc2V0QW5pbShzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBHZW9zZXRJZDogLTEsXG4gICAgICAgIEFscGhhOiAxLFxuICAgICAgICBDb2xvcjogbnVsbCxcbiAgICAgICAgRmxhZ3M6IDBcbiAgICB9O1xuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIHZhciBpc1N0YXRpYyA9IGZhbHNlO1xuICAgICAgICBpZiAoIWtleXdvcmQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnc3RhdGljJykge1xuICAgICAgICAgICAgaXNTdGF0aWMgPSB0cnVlO1xuICAgICAgICAgICAga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleXdvcmQgPT09ICdBbHBoYScpIHtcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xuICAgICAgICAgICAgICAgIHJlcy5BbHBoYSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcy5BbHBoYSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnQ29sb3InKSB7XG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICAgICAgICAgIHJlcy5Db2xvciA9IHBhcnNlQXJyYXkoc3RhdGUsIGFycmF5LCAwKTtcbiAgICAgICAgICAgICAgICByZXMuQ29sb3IucmV2ZXJzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzLkNvbG9yID0gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCBBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSByZXMuQ29sb3IuS2V5czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IF9hW19pXTtcbiAgICAgICAgICAgICAgICAgICAga2V5LlZlY3Rvci5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkuSW5UYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleS5JblRhbi5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXkuT3V0VGFuLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnRHJvcFNoYWRvdycpIHtcbiAgICAgICAgICAgIHJlcy5GbGFncyB8PSBtb2RlbF8xLkdlb3NldEFuaW1GbGFnc1trZXl3b3JkXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgbW9kZWwuR2Vvc2V0QW5pbXMucHVzaChyZXMpO1xufVxuZnVuY3Rpb24gcGFyc2VOb2RlKHN0YXRlLCB0eXBlLCBtb2RlbCkge1xuICAgIHZhciBuYW1lID0gcGFyc2VTdHJpbmcoc3RhdGUpO1xuICAgIHZhciBub2RlID0ge1xuICAgICAgICBOYW1lOiBuYW1lLFxuICAgICAgICBPYmplY3RJZDogbnVsbCxcbiAgICAgICAgUGFyZW50OiBudWxsLFxuICAgICAgICBQaXZvdFBvaW50OiBudWxsLFxuICAgICAgICBGbGFnczogbW9kZWxfMS5Ob2RlVHlwZVt0eXBlXVxuICAgIH07XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgaWYgKCFrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ1RyYW5zbGF0aW9uJyB8fCBrZXl3b3JkID09PSAnUm90YXRpb24nIHx8IGtleXdvcmQgPT09ICdTY2FsaW5nJyB8fCBrZXl3b3JkID09PSAnVmlzaWJpbGl0eScpIHtcbiAgICAgICAgICAgIHZhciB2ZWN0b3JUeXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQzO1xuICAgICAgICAgICAgaWYgKGtleXdvcmQgPT09ICdSb3RhdGlvbicpIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JUeXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQ0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1Zpc2liaWxpdHknKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yVHlwZSA9IEFuaW1WZWN0b3JUeXBlLkZMT0FUMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGVba2V5d29yZF0gPSBwYXJzZUFuaW1WZWN0b3Ioc3RhdGUsIHZlY3RvclR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdCaWxsYm9hcmRlZExvY2taJyB8fCBrZXl3b3JkID09PSAnQmlsbGJvYXJkZWRMb2NrWScgfHwga2V5d29yZCA9PT0gJ0JpbGxib2FyZGVkTG9ja1gnIHx8XG4gICAgICAgICAgICBrZXl3b3JkID09PSAnQmlsbGJvYXJkZWQnIHx8IGtleXdvcmQgPT09ICdDYW1lcmFBbmNob3JlZCcpIHtcbiAgICAgICAgICAgIG5vZGUuRmxhZ3MgfD0gbW9kZWxfMS5Ob2RlRmxhZ3Nba2V5d29yZF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0RvbnRJbmhlcml0Jykge1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgICAgICAgICB2YXIgdmFsID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgICAgIGlmICh2YWwgPT09ICdUcmFuc2xhdGlvbicpIHtcbiAgICAgICAgICAgICAgICBub2RlLkZsYWdzIHw9IG1vZGVsXzEuTm9kZUZsYWdzLkRvbnRJbmhlcml0VHJhbnNsYXRpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2YWwgPT09ICdSb3RhdGlvbicpIHtcbiAgICAgICAgICAgICAgICBub2RlLkZsYWdzIHw9IG1vZGVsXzEuTm9kZUZsYWdzLkRvbnRJbmhlcml0Um90YXRpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2YWwgPT09ICdTY2FsaW5nJykge1xuICAgICAgICAgICAgICAgIG5vZGUuRmxhZ3MgfD0gbW9kZWxfMS5Ob2RlRmxhZ3MuRG9udEluaGVyaXRTY2FsaW5nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1BhdGgnKSB7XG4gICAgICAgICAgICBub2RlW2tleXdvcmRdID0gcGFyc2VTdHJpbmcoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbCA9IHBhcnNlS2V5d29yZChzdGF0ZSkgfHwgcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICAgICAgaWYgKGtleXdvcmQgPT09ICdHZW9zZXRJZCcgJiYgdmFsID09PSAnTXVsdGlwbGUnIHx8XG4gICAgICAgICAgICAgICAga2V5d29yZCA9PT0gJ0dlb3NldEFuaW1JZCcgJiYgdmFsID09PSAnTm9uZScpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZVtrZXl3b3JkXSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgbW9kZWwuTm9kZXNbbm9kZS5PYmplY3RJZF0gPSBub2RlO1xuICAgIHJldHVybiBub2RlO1xufVxuZnVuY3Rpb24gcGFyc2VCb25lKHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciBub2RlID0gcGFyc2VOb2RlKHN0YXRlLCAnQm9uZScsIG1vZGVsKTtcbiAgICBtb2RlbC5Cb25lcy5wdXNoKG5vZGUpO1xufVxuZnVuY3Rpb24gcGFyc2VIZWxwZXIoc3RhdGUsIG1vZGVsKSB7XG4gICAgdmFyIG5vZGUgPSBwYXJzZU5vZGUoc3RhdGUsICdIZWxwZXInLCBtb2RlbCk7XG4gICAgbW9kZWwuSGVscGVycy5wdXNoKG5vZGUpO1xufVxuZnVuY3Rpb24gcGFyc2VBdHRhY2htZW50KHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciBub2RlID0gcGFyc2VOb2RlKHN0YXRlLCAnQXR0YWNobWVudCcsIG1vZGVsKTtcbiAgICBtb2RlbC5BdHRhY2htZW50cy5wdXNoKG5vZGUpO1xufVxuZnVuY3Rpb24gcGFyc2VQaXZvdFBvaW50cyhzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgY291bnQgPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgICAgICByZXMucHVzaChwYXJzZUFycmF5KHN0YXRlLCBuZXcgRmxvYXQzMkFycmF5KDMpLCAwKSk7XG4gICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5QaXZvdFBvaW50cyA9IHJlcztcbn1cbmZ1bmN0aW9uIHBhcnNlRXZlbnRPYmplY3Qoc3RhdGUsIG1vZGVsKSB7XG4gICAgdmFyIG5hbWUgPSBwYXJzZVN0cmluZyhzdGF0ZSk7XG4gICAgdmFyIHJlcyA9IHtcbiAgICAgICAgTmFtZTogbmFtZSxcbiAgICAgICAgT2JqZWN0SWQ6IG51bGwsXG4gICAgICAgIFBhcmVudDogbnVsbCxcbiAgICAgICAgUGl2b3RQb2ludDogbnVsbCxcbiAgICAgICAgRXZlbnRUcmFjazogbnVsbCxcbiAgICAgICAgRmxhZ3M6IG1vZGVsXzEuTm9kZVR5cGUuRXZlbnRPYmplY3RcbiAgICB9O1xuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIGlmICgha2V5d29yZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleXdvcmQgPT09ICdFdmVudFRyYWNrJykge1xuICAgICAgICAgICAgdmFyIGNvdW50ID0gcGFyc2VOdW1iZXIoc3RhdGUpOyAvLyBFdmVudFRyYWNrIGNvdW50XG4gICAgICAgICAgICByZXMuRXZlbnRUcmFjayA9IHBhcnNlQXJyYXkoc3RhdGUsIG5ldyBVaW50MzJBcnJheShjb3VudCksIDApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdUcmFuc2xhdGlvbicgfHwga2V5d29yZCA9PT0gJ1JvdGF0aW9uJyB8fCBrZXl3b3JkID09PSAnU2NhbGluZycpIHtcbiAgICAgICAgICAgIHZhciB0eXBlID0ga2V5d29yZCA9PT0gJ1JvdGF0aW9uJyA/IEFuaW1WZWN0b3JUeXBlLkZMT0FUNCA6IEFuaW1WZWN0b3JUeXBlLkZMT0FUMztcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgdHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLkV2ZW50T2JqZWN0cy5wdXNoKHJlcyk7XG4gICAgbW9kZWwuTm9kZXMucHVzaChyZXMpO1xufVxuZnVuY3Rpb24gcGFyc2VDb2xsaXNpb25TaGFwZShzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgbmFtZSA9IHBhcnNlU3RyaW5nKHN0YXRlKTtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBOYW1lOiBuYW1lLFxuICAgICAgICBPYmplY3RJZDogbnVsbCxcbiAgICAgICAgUGFyZW50OiBudWxsLFxuICAgICAgICBQaXZvdFBvaW50OiBudWxsLFxuICAgICAgICBTaGFwZTogbW9kZWxfMS5Db2xsaXNpb25TaGFwZVR5cGUuQm94LFxuICAgICAgICBWZXJ0aWNlczogbnVsbCxcbiAgICAgICAgRmxhZ3M6IG1vZGVsXzEuTm9kZVR5cGUuQ29sbGlzaW9uU2hhcGVcbiAgICB9O1xuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIGlmICgha2V5d29yZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleXdvcmQgPT09ICdTcGhlcmUnKSB7XG4gICAgICAgICAgICByZXMuU2hhcGUgPSBtb2RlbF8xLkNvbGxpc2lvblNoYXBlVHlwZS5TcGhlcmU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0JveCcpIHtcbiAgICAgICAgICAgIHJlcy5TaGFwZSA9IG1vZGVsXzEuQ29sbGlzaW9uU2hhcGVUeXBlLkJveDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnVmVydGljZXMnKSB7XG4gICAgICAgICAgICB2YXIgY291bnQgPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgICAgICB2YXIgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogMyk7XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgICAgICAgICAgICAgIHBhcnNlQXJyYXkoc3RhdGUsIHZlcnRpY2VzLCBpICogMyk7XG4gICAgICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICAgICAgICAgIHJlcy5WZXJ0aWNlcyA9IHZlcnRpY2VzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdUcmFuc2xhdGlvbicgfHwga2V5d29yZCA9PT0gJ1JvdGF0aW9uJyB8fCBrZXl3b3JkID09PSAnU2NhbGluZycpIHtcbiAgICAgICAgICAgIHZhciB0eXBlID0ga2V5d29yZCA9PT0gJ1JvdGF0aW9uJyA/IEFuaW1WZWN0b3JUeXBlLkZMT0FUNCA6IEFuaW1WZWN0b3JUeXBlLkZMT0FUMztcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgdHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLkNvbGxpc2lvblNoYXBlcy5wdXNoKHJlcyk7XG4gICAgbW9kZWwuTm9kZXMucHVzaChyZXMpO1xufVxuZnVuY3Rpb24gcGFyc2VHbG9iYWxTZXF1ZW5jZXMoc3RhdGUsIG1vZGVsKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIHZhciBjb3VudCA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyArK2kpIHtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0R1cmF0aW9uJykge1xuICAgICAgICAgICAgcmVzLnB1c2gocGFyc2VOdW1iZXIoc3RhdGUpKTtcbiAgICAgICAgfVxuICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgbW9kZWwuR2xvYmFsU2VxdWVuY2VzID0gcmVzO1xufVxuZnVuY3Rpb24gcGFyc2VVbmtub3duQmxvY2soc3RhdGUpIHtcbiAgICB2YXIgb3BlbmVkO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09IHVuZGVmaW5lZCAmJiBzdGF0ZS5jaGFyKCkgIT09ICd7Jykge1xuICAgICAgICArK3N0YXRlLnBvcztcbiAgICB9XG4gICAgb3BlbmVkID0gMTtcbiAgICArK3N0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSB1bmRlZmluZWQgJiYgb3BlbmVkID4gMCkge1xuICAgICAgICBpZiAoc3RhdGUuY2hhcigpID09PSAneycpIHtcbiAgICAgICAgICAgICsrb3BlbmVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHN0YXRlLmNoYXIoKSA9PT0gJ30nKSB7XG4gICAgICAgICAgICAtLW9wZW5lZDtcbiAgICAgICAgfVxuICAgICAgICArK3N0YXRlLnBvcztcbiAgICB9XG4gICAgcGFyc2VTcGFjZShzdGF0ZSk7XG59XG5mdW5jdGlvbiBwYXJzZVBhcnRpY2xlRW1pdHRlcihzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBPYmplY3RJZDogbnVsbCxcbiAgICAgICAgUGFyZW50OiBudWxsLFxuICAgICAgICBOYW1lOiBudWxsLFxuICAgICAgICBGbGFnczogMFxuICAgIH07XG4gICAgcmVzLk5hbWUgPSBwYXJzZVN0cmluZyhzdGF0ZSk7XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgdmFyIGlzU3RhdGljID0gZmFsc2U7XG4gICAgICAgIGlmICgha2V5d29yZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleXdvcmQgPT09ICdzdGF0aWMnKSB7XG4gICAgICAgICAgICBpc1N0YXRpYyA9IHRydWU7XG4gICAgICAgICAgICBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ09iamVjdElkJyB8fCBrZXl3b3JkID09PSAnUGFyZW50Jykge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdFbWl0dGVyVXNlc01ETCcgfHwga2V5d29yZCA9PT0gJ0VtaXR0ZXJVc2VzVEdBJykge1xuICAgICAgICAgICAgcmVzLkZsYWdzIHw9IG1vZGVsXzEuUGFydGljbGVFbWl0dGVyRmxhZ3Nba2V5d29yZF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWlzU3RhdGljICYmIChrZXl3b3JkID09PSAnVmlzaWJpbGl0eScgfHwga2V5d29yZCA9PT0gJ1RyYW5zbGF0aW9uJyB8fCBrZXl3b3JkID09PSAnUm90YXRpb24nIHx8XG4gICAgICAgICAgICBrZXl3b3JkID09PSAnU2NhbGluZycgfHwga2V5d29yZCA9PT0gJ0VtaXNzaW9uUmF0ZScgfHwga2V5d29yZCA9PT0gJ0dyYXZpdHknIHx8IGtleXdvcmQgPT09ICdMb25naXR1ZGUnIHx8XG4gICAgICAgICAgICBrZXl3b3JkID09PSAnTGF0aXR1ZGUnKSkge1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBBbmltVmVjdG9yVHlwZS5GTE9BVDM7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ1Zpc2liaWxpdHknIHx8IGtleXdvcmQgPT09ICdFbWlzc2lvblJhdGUnIHx8IGtleXdvcmQgPT09ICdHcmF2aXR5JyB8fFxuICAgICAgICAgICAgICAgIGtleXdvcmQgPT09ICdMb25naXR1ZGUnIHx8IGtleXdvcmQgPT09ICdMYXRpdHVkZScpIHtcbiAgICAgICAgICAgICAgICB0eXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1JvdGF0aW9uJykge1xuICAgICAgICAgICAgICAgIHR5cGUgPSBBbmltVmVjdG9yVHlwZS5GTE9BVDQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZUFuaW1WZWN0b3Ioc3RhdGUsIHR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdQYXJ0aWNsZScpIHtcbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgICAgICAgICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleXdvcmQyID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgICAgICAgICB2YXIgaXNTdGF0aWMyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKGtleXdvcmQyID09PSAnc3RhdGljJykge1xuICAgICAgICAgICAgICAgICAgICBpc1N0YXRpYzIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBrZXl3b3JkMiA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghaXNTdGF0aWMyICYmIChrZXl3b3JkMiA9PT0gJ0xpZmVTcGFuJyB8fCBrZXl3b3JkMiA9PT0gJ0luaXRWZWxvY2l0eScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc1trZXl3b3JkMl0gPSBwYXJzZUFuaW1WZWN0b3Ioc3RhdGUsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQyID09PSAnTGlmZVNwYW4nIHx8IGtleXdvcmQyID09PSAnSW5pdFZlbG9jaXR5Jykge1xuICAgICAgICAgICAgICAgICAgICByZXNba2V5d29yZDJdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkMiA9PT0gJ1BhdGgnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5QYXRoID0gcGFyc2VTdHJpbmcoc3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5QYXJ0aWNsZUVtaXR0ZXJzLnB1c2gocmVzKTtcbn1cbmZ1bmN0aW9uIHBhcnNlUGFydGljbGVFbWl0dGVyMihzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgbmFtZSA9IHBhcnNlU3RyaW5nKHN0YXRlKTtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBOYW1lOiBuYW1lLFxuICAgICAgICBPYmplY3RJZDogbnVsbCxcbiAgICAgICAgUGFyZW50OiBudWxsLFxuICAgICAgICBQaXZvdFBvaW50OiBudWxsLFxuICAgICAgICBGbGFnczogbW9kZWxfMS5Ob2RlVHlwZS5QYXJ0aWNsZUVtaXR0ZXIsXG4gICAgICAgIEZyYW1lRmxhZ3M6IDBcbiAgICB9O1xuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIHZhciBpc1N0YXRpYyA9IGZhbHNlO1xuICAgICAgICBpZiAoIWtleXdvcmQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnc3RhdGljJykge1xuICAgICAgICAgICAgaXNTdGF0aWMgPSB0cnVlO1xuICAgICAgICAgICAga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1N0YXRpYyAmJiAoa2V5d29yZCA9PT0gJ1NwZWVkJyB8fCBrZXl3b3JkID09PSAnTGF0aXR1ZGUnIHx8IGtleXdvcmQgPT09ICdWaXNpYmlsaXR5JyB8fFxuICAgICAgICAgICAga2V5d29yZCA9PT0gJ0VtaXNzaW9uUmF0ZScgfHwga2V5d29yZCA9PT0gJ1dpZHRoJyB8fCBrZXl3b3JkID09PSAnTGVuZ3RoJyB8fCBrZXl3b3JkID09PSAnVHJhbnNsYXRpb24nIHx8XG4gICAgICAgICAgICBrZXl3b3JkID09PSAnUm90YXRpb24nIHx8IGtleXdvcmQgPT09ICdTY2FsaW5nJyB8fCBrZXl3b3JkID09PSAnR3Jhdml0eScgfHwga2V5d29yZCA9PT0gJ1ZhcmlhdGlvbicpKSB7XG4gICAgICAgICAgICB2YXIgdHlwZSA9IEFuaW1WZWN0b3JUeXBlLkZMT0FUMztcbiAgICAgICAgICAgIHN3aXRjaCAoa2V5d29yZCkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ1JvdGF0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IEFuaW1WZWN0b3JUeXBlLkZMT0FUNDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnU3BlZWQnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ0xhdGl0dWRlJzpcbiAgICAgICAgICAgICAgICBjYXNlICdWaXNpYmlsaXR5JzpcbiAgICAgICAgICAgICAgICBjYXNlICdFbWlzc2lvblJhdGUnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ1dpZHRoJzpcbiAgICAgICAgICAgICAgICBjYXNlICdMZW5ndGgnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ0dyYXZpdHknOlxuICAgICAgICAgICAgICAgIGNhc2UgJ1ZhcmlhdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBBbmltVmVjdG9yVHlwZS5GTE9BVDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCB0eXBlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnVmFyaWF0aW9uJyB8fCBrZXl3b3JkID09PSAnR3Jhdml0eScpIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnU29ydFByaW1zRmFyWicgfHwga2V5d29yZCA9PT0gJ1Vuc2hhZGVkJyB8fCBrZXl3b3JkID09PSAnTGluZUVtaXR0ZXInIHx8XG4gICAgICAgICAgICBrZXl3b3JkID09PSAnVW5mb2dnZWQnIHx8IGtleXdvcmQgPT09ICdNb2RlbFNwYWNlJyB8fCBrZXl3b3JkID09PSAnWFlRdWFkJykge1xuICAgICAgICAgICAgcmVzLkZsYWdzIHw9IG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZsYWdzW2tleXdvcmRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdCb3RoJykge1xuICAgICAgICAgICAgcmVzLkZyYW1lRmxhZ3MgfD0gbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MuSGVhZCB8IG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLlRhaWw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0hlYWQnIHx8IGtleXdvcmQgPT09ICdUYWlsJykge1xuICAgICAgICAgICAgcmVzLkZyYW1lRmxhZ3MgfD0gbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3Nba2V5d29yZF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1NxdWlydCcpIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0RvbnRJbmhlcml0Jykge1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgICAgICAgICB2YXIgdmFsID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgICAgIGlmICh2YWwgPT09ICdUcmFuc2xhdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXMuRmxhZ3MgfD0gbW9kZWxfMS5Ob2RlRmxhZ3MuRG9udEluaGVyaXRUcmFuc2xhdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA9PT0gJ1JvdGF0aW9uJykge1xuICAgICAgICAgICAgICAgIHJlcy5GbGFncyB8PSBtb2RlbF8xLk5vZGVGbGFncy5Eb250SW5oZXJpdFJvdGF0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmFsID09PSAnU2NhbGluZycpIHtcbiAgICAgICAgICAgICAgICByZXMuRmxhZ3MgfD0gbW9kZWxfMS5Ob2RlRmxhZ3MuRG9udEluaGVyaXRTY2FsaW5nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1NlZ21lbnRDb2xvcicpIHtcbiAgICAgICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgICAgICAgICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VLZXl3b3JkKHN0YXRlKTsgLy8gQ29sb3JcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JBcnIgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICAgICAgICAgIHBhcnNlQXJyYXkoc3RhdGUsIGNvbG9yQXJyLCAwKTtcbiAgICAgICAgICAgICAgICAvLyBiZ3Igb3JkZXIsIGludmVyc2UgZnJvbSBtZHhcbiAgICAgICAgICAgICAgICB2YXIgdGVtcCA9IGNvbG9yQXJyWzBdO1xuICAgICAgICAgICAgICAgIGNvbG9yQXJyWzBdID0gY29sb3JBcnJbMl07XG4gICAgICAgICAgICAgICAgY29sb3JBcnJbMl0gPSB0ZW1wO1xuICAgICAgICAgICAgICAgIGNvbG9ycy5wdXNoKGNvbG9yQXJyKTtcbiAgICAgICAgICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgICAgICAgICAgcmVzLlNlZ21lbnRDb2xvciA9IGNvbG9ycztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnQWxwaGEnKSB7XG4gICAgICAgICAgICByZXMuQWxwaGEgPSBuZXcgVWludDhBcnJheSgzKTtcbiAgICAgICAgICAgIHBhcnNlQXJyYXkoc3RhdGUsIHJlcy5BbHBoYSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1BhcnRpY2xlU2NhbGluZycpIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgICAgICBwYXJzZUFycmF5KHN0YXRlLCByZXNba2V5d29yZF0sIDApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdMaWZlU3BhblVWQW5pbScgfHwga2V5d29yZCA9PT0gJ0RlY2F5VVZBbmltJyB8fCBrZXl3b3JkID09PSAnVGFpbFVWQW5pbScgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdUYWlsRGVjYXlVVkFuaW0nKSB7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBuZXcgVWludDMyQXJyYXkoMyk7XG4gICAgICAgICAgICBwYXJzZUFycmF5KHN0YXRlLCByZXNba2V5d29yZF0sIDApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdUcmFuc3BhcmVudCcgfHwga2V5d29yZCA9PT0gJ0JsZW5kJyB8fCBrZXl3b3JkID09PSAnQWRkaXRpdmUnIHx8XG4gICAgICAgICAgICBrZXl3b3JkID09PSAnQWxwaGFLZXknIHx8IGtleXdvcmQgPT09ICdNb2R1bGF0ZScgfHwga2V5d29yZCA9PT0gJ01vZHVsYXRlMngnKSB7XG4gICAgICAgICAgICByZXMuRmlsdGVyTW9kZSA9IG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGVba2V5d29yZF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLlBhcnRpY2xlRW1pdHRlcnMyLnB1c2gocmVzKTtcbiAgICBtb2RlbC5Ob2Rlcy5wdXNoKHJlcyk7XG59XG5mdW5jdGlvbiBwYXJzZUNhbWVyYShzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBOYW1lOiBudWxsLFxuICAgICAgICBQb3NpdGlvbjogbnVsbCxcbiAgICAgICAgRmllbGRPZlZpZXc6IDAsXG4gICAgICAgIE5lYXJDbGlwOiAwLFxuICAgICAgICBGYXJDbGlwOiAwLFxuICAgICAgICBUYXJnZXRQb3NpdGlvbjogbnVsbFxuICAgIH07XG4gICAgcmVzLk5hbWUgPSBwYXJzZVN0cmluZyhzdGF0ZSk7XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgaWYgKCFrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ1Bvc2l0aW9uJykge1xuICAgICAgICAgICAgcmVzLlBvc2l0aW9uID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgICAgIHBhcnNlQXJyYXkoc3RhdGUsIHJlcy5Qb3NpdGlvbiwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0ZpZWxkT2ZWaWV3JyB8fCBrZXl3b3JkID09PSAnTmVhckNsaXAnIHx8IGtleXdvcmQgPT09ICdGYXJDbGlwJykge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdUYXJnZXQnKSB7XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICAgICAgICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICAgICAgICAgIHZhciBrZXl3b3JkMiA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGtleXdvcmQyID09PSAnUG9zaXRpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5UYXJnZXRQb3NpdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgICAgICAgICAgICAgIHBhcnNlQXJyYXkoc3RhdGUsIHJlcy5UYXJnZXRQb3NpdGlvbiwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQyID09PSAnVHJhbnNsYXRpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5UYXJnZXRUcmFuc2xhdGlvbiA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgQW5pbVZlY3RvclR5cGUuRkxPQVQzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnVHJhbnNsYXRpb24nIHx8IGtleXdvcmQgPT09ICdSb3RhdGlvbicpIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwga2V5d29yZCA9PT0gJ1JvdGF0aW9uJyA/XG4gICAgICAgICAgICAgICAgQW5pbVZlY3RvclR5cGUuRkxPQVQxIDpcbiAgICAgICAgICAgICAgICBBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgICAgICB9XG4gICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5DYW1lcmFzLnB1c2gocmVzKTtcbn1cbmZ1bmN0aW9uIHBhcnNlTGlnaHQoc3RhdGUsIG1vZGVsKSB7XG4gICAgdmFyIG5hbWUgPSBwYXJzZVN0cmluZyhzdGF0ZSk7XG4gICAgdmFyIHJlcyA9IHtcbiAgICAgICAgTmFtZTogbmFtZSxcbiAgICAgICAgT2JqZWN0SWQ6IG51bGwsXG4gICAgICAgIFBhcmVudDogbnVsbCxcbiAgICAgICAgUGl2b3RQb2ludDogbnVsbCxcbiAgICAgICAgRmxhZ3M6IG1vZGVsXzEuTm9kZVR5cGUuTGlnaHQsXG4gICAgICAgIExpZ2h0VHlwZTogMFxuICAgIH07XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgdmFyIGlzU3RhdGljID0gZmFsc2U7XG4gICAgICAgIGlmICgha2V5d29yZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleXdvcmQgPT09ICdzdGF0aWMnKSB7XG4gICAgICAgICAgICBpc1N0YXRpYyA9IHRydWU7XG4gICAgICAgICAgICBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzU3RhdGljICYmIChrZXl3b3JkID09PSAnVmlzaWJpbGl0eScgfHwga2V5d29yZCA9PT0gJ0NvbG9yJyB8fCBrZXl3b3JkID09PSAnSW50ZW5zaXR5JyB8fFxuICAgICAgICAgICAga2V5d29yZCA9PT0gJ0FtYkludGVuc2l0eScgfHwga2V5d29yZCA9PT0gJ0FtYkNvbG9yJyB8fCBrZXl3b3JkID09PSAnVHJhbnNsYXRpb24nIHx8XG4gICAgICAgICAgICBrZXl3b3JkID09PSAnUm90YXRpb24nIHx8IGtleXdvcmQgPT09ICdTY2FsaW5nJyB8fCBrZXl3b3JkID09PSAnQXR0ZW51YXRpb25TdGFydCcgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdBdHRlbnVhdGlvbkVuZCcpKSB7XG4gICAgICAgICAgICB2YXIgdHlwZSA9IEFuaW1WZWN0b3JUeXBlLkZMT0FUMztcbiAgICAgICAgICAgIHN3aXRjaCAoa2V5d29yZCkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ1JvdGF0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IEFuaW1WZWN0b3JUeXBlLkZMT0FUNDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnVmlzaWJpbGl0eSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnSW50ZW5zaXR5JzpcbiAgICAgICAgICAgICAgICBjYXNlICdBbWJJbnRlbnNpdHknOlxuICAgICAgICAgICAgICAgIGNhc2UgJ0F0dGVudWF0aW9uU3RhcnQnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ0F0dGVudWF0aW9uRW5kJzpcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IEFuaW1WZWN0b3JUeXBlLkZMT0FUMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZUFuaW1WZWN0b3Ioc3RhdGUsIHR5cGUpO1xuICAgICAgICAgICAgaWYgKGtleXdvcmQgPT09ICdDb2xvcicgfHwga2V5d29yZCA9PT0gJ0FtYkNvbG9yJykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSByZXNba2V5d29yZF0uS2V5czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IF9hW19pXTtcbiAgICAgICAgICAgICAgICAgICAga2V5LlZlY3Rvci5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkuSW5UYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleS5JblRhbi5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXkuT3V0VGFuLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnT21uaWRpcmVjdGlvbmFsJyB8fCBrZXl3b3JkID09PSAnRGlyZWN0aW9uYWwnIHx8IGtleXdvcmQgPT09ICdBbWJpZW50Jykge1xuICAgICAgICAgICAgcmVzLkxpZ2h0VHlwZSA9IG1vZGVsXzEuTGlnaHRUeXBlW2tleXdvcmRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdDb2xvcicgfHwga2V5d29yZCA9PT0gJ0FtYkNvbG9yJykge1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgICAgIHBhcnNlQXJyYXkoc3RhdGUsIGNvbG9yLCAwKTtcbiAgICAgICAgICAgIC8vIGJnciBvcmRlciwgaW52ZXJzZSBmcm9tIG1keFxuICAgICAgICAgICAgdmFyIHRlbXAgPSBjb2xvclswXTtcbiAgICAgICAgICAgIGNvbG9yWzBdID0gY29sb3JbMl07XG4gICAgICAgICAgICBjb2xvclsyXSA9IHRlbXA7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBjb2xvcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgbW9kZWwuTGlnaHRzLnB1c2gocmVzKTtcbiAgICBtb2RlbC5Ob2Rlcy5wdXNoKHJlcyk7XG59XG5mdW5jdGlvbiBwYXJzZVRleHR1cmVBbmltcyhzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgcGFyc2VOdW1iZXIoc3RhdGUpOyAvLyBjb3VudCwgbm90IHVzZWRcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAgICBwYXJzZUtleXdvcmQoc3RhdGUpOyAvLyBUVmVydGV4QW5pbVxuICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICAgICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgICAgICBpZiAoIWtleXdvcmQpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChrZXl3b3JkID09PSAnVHJhbnNsYXRpb24nIHx8IGtleXdvcmQgPT09ICdSb3RhdGlvbicgfHwga2V5d29yZCA9PT0gJ1NjYWxpbmcnKSB7XG4gICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBrZXl3b3JkID09PSAnUm90YXRpb24nID8gQW5pbVZlY3RvclR5cGUuRkxPQVQ0IDogQW5pbVZlY3RvclR5cGUuRkxPQVQzO1xuICAgICAgICAgICAgICAgIG9ialtrZXl3b3JkXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgdHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gdGV4dHVyZSBhbmltIHByb3BlcnR5ICcgKyBrZXl3b3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgICAgICB9XG4gICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgICAgICByZXMucHVzaChvYmopO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5UZXh0dXJlQW5pbXMgPSByZXM7XG59XG5mdW5jdGlvbiBwYXJzZVJpYmJvbkVtaXR0ZXIoc3RhdGUsIG1vZGVsKSB7XG4gICAgdmFyIG5hbWUgPSBwYXJzZVN0cmluZyhzdGF0ZSk7XG4gICAgdmFyIHJlcyA9IHtcbiAgICAgICAgTmFtZTogbmFtZSxcbiAgICAgICAgT2JqZWN0SWQ6IG51bGwsXG4gICAgICAgIFBhcmVudDogbnVsbCxcbiAgICAgICAgUGl2b3RQb2ludDogbnVsbCxcbiAgICAgICAgRmxhZ3M6IG1vZGVsXzEuTm9kZVR5cGUuUmliYm9uRW1pdHRlcixcbiAgICAgICAgSGVpZ2h0QWJvdmU6IG51bGwsXG4gICAgICAgIEhlaWdodEJlbG93OiBudWxsLFxuICAgICAgICBBbHBoYTogbnVsbCxcbiAgICAgICAgQ29sb3I6IG51bGwsXG4gICAgICAgIExpZmVTcGFuOiBudWxsLFxuICAgICAgICBUZXh0dXJlU2xvdDogbnVsbCxcbiAgICAgICAgRW1pc3Npb25SYXRlOiBudWxsLFxuICAgICAgICBSb3dzOiBudWxsLFxuICAgICAgICBDb2x1bW5zOiBudWxsLFxuICAgICAgICBNYXRlcmlhbElEOiBudWxsLFxuICAgICAgICBHcmF2aXR5OiBudWxsLFxuICAgICAgICBWaXNpYmlsaXR5OiBudWxsXG4gICAgfTtcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICB2YXIgaXNTdGF0aWMgPSBmYWxzZTtcbiAgICAgICAgaWYgKCFrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICAgICAgIGlzU3RhdGljID0gdHJ1ZTtcbiAgICAgICAgICAgIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNTdGF0aWMgJiYgKGtleXdvcmQgPT09ICdWaXNpYmlsaXR5JyB8fCBrZXl3b3JkID09PSAnSGVpZ2h0QWJvdmUnIHx8IGtleXdvcmQgPT09ICdIZWlnaHRCZWxvdycgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdUcmFuc2xhdGlvbicgfHwga2V5d29yZCA9PT0gJ1JvdGF0aW9uJyB8fCBrZXl3b3JkID09PSAnU2NhbGluZycgfHwga2V5d29yZCA9PT0gJ0FscGhhJyB8fFxuICAgICAgICAgICAga2V5d29yZCA9PT0gJ1RleHR1cmVTbG90JykpIHtcbiAgICAgICAgICAgIHZhciB0eXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQzO1xuICAgICAgICAgICAgc3dpdGNoIChrZXl3b3JkKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnUm90YXRpb24nOlxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQ0O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdWaXNpYmlsaXR5JzpcbiAgICAgICAgICAgICAgICBjYXNlICdIZWlnaHRBYm92ZSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnSGVpZ2h0QmVsb3cnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ0FscGhhJzpcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IEFuaW1WZWN0b3JUeXBlLkZMT0FUMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnVGV4dHVyZVNsb3QnOlxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gQW5pbVZlY3RvclR5cGUuSU5UMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZUFuaW1WZWN0b3Ioc3RhdGUsIHR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdDb2xvcicpIHtcbiAgICAgICAgICAgIHZhciBjb2xvciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgICAgICBwYXJzZUFycmF5KHN0YXRlLCBjb2xvciwgMCk7XG4gICAgICAgICAgICAvLyBiZ3Igb3JkZXIsIGludmVyc2UgZnJvbSBtZHhcbiAgICAgICAgICAgIHZhciB0ZW1wID0gY29sb3JbMF07XG4gICAgICAgICAgICBjb2xvclswXSA9IGNvbG9yWzJdO1xuICAgICAgICAgICAgY29sb3JbMl0gPSB0ZW1wO1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gY29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLlJpYmJvbkVtaXR0ZXJzLnB1c2gocmVzKTtcbiAgICBtb2RlbC5Ob2Rlcy5wdXNoKHJlcyk7XG59XG52YXIgcGFyc2VycyA9IHtcbiAgICBWZXJzaW9uOiBwYXJzZVZlcnNpb24sXG4gICAgTW9kZWw6IHBhcnNlTW9kZWxJbmZvLFxuICAgIFNlcXVlbmNlczogcGFyc2VTZXF1ZW5jZXMsXG4gICAgVGV4dHVyZXM6IHBhcnNlVGV4dHVyZXMsXG4gICAgTWF0ZXJpYWxzOiBwYXJzZU1hdGVyaWFscyxcbiAgICBHZW9zZXQ6IHBhcnNlR2Vvc2V0LFxuICAgIEdlb3NldEFuaW06IHBhcnNlR2Vvc2V0QW5pbSxcbiAgICBCb25lOiBwYXJzZUJvbmUsXG4gICAgSGVscGVyOiBwYXJzZUhlbHBlcixcbiAgICBBdHRhY2htZW50OiBwYXJzZUF0dGFjaG1lbnQsXG4gICAgUGl2b3RQb2ludHM6IHBhcnNlUGl2b3RQb2ludHMsXG4gICAgRXZlbnRPYmplY3Q6IHBhcnNlRXZlbnRPYmplY3QsXG4gICAgQ29sbGlzaW9uU2hhcGU6IHBhcnNlQ29sbGlzaW9uU2hhcGUsXG4gICAgR2xvYmFsU2VxdWVuY2VzOiBwYXJzZUdsb2JhbFNlcXVlbmNlcyxcbiAgICBQYXJ0aWNsZUVtaXR0ZXI6IHBhcnNlUGFydGljbGVFbWl0dGVyLFxuICAgIFBhcnRpY2xlRW1pdHRlcjI6IHBhcnNlUGFydGljbGVFbWl0dGVyMixcbiAgICBDYW1lcmE6IHBhcnNlQ2FtZXJhLFxuICAgIExpZ2h0OiBwYXJzZUxpZ2h0LFxuICAgIFRleHR1cmVBbmltczogcGFyc2VUZXh0dXJlQW5pbXMsXG4gICAgUmliYm9uRW1pdHRlcjogcGFyc2VSaWJib25FbWl0dGVyXG59O1xuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gICAgdmFyIHN0YXRlID0gbmV3IFN0YXRlKHN0cik7XG4gICAgdmFyIG1vZGVsID0ge1xuICAgICAgICAvLyBkZWZhdWx0XG4gICAgICAgIFZlcnNpb246IDgwMCxcbiAgICAgICAgSW5mbzoge1xuICAgICAgICAgICAgTmFtZTogJycsXG4gICAgICAgICAgICBNaW5pbXVtRXh0ZW50OiBudWxsLFxuICAgICAgICAgICAgTWF4aW11bUV4dGVudDogbnVsbCxcbiAgICAgICAgICAgIEJvdW5kc1JhZGl1czogMCxcbiAgICAgICAgICAgIEJsZW5kVGltZTogMTUwXG4gICAgICAgIH0sXG4gICAgICAgIFNlcXVlbmNlczogW10sXG4gICAgICAgIEdsb2JhbFNlcXVlbmNlczogW10sXG4gICAgICAgIFRleHR1cmVzOiBbXSxcbiAgICAgICAgTWF0ZXJpYWxzOiBbXSxcbiAgICAgICAgVGV4dHVyZUFuaW1zOiBbXSxcbiAgICAgICAgR2Vvc2V0czogW10sXG4gICAgICAgIEdlb3NldEFuaW1zOiBbXSxcbiAgICAgICAgQm9uZXM6IFtdLFxuICAgICAgICBIZWxwZXJzOiBbXSxcbiAgICAgICAgQXR0YWNobWVudHM6IFtdLFxuICAgICAgICBFdmVudE9iamVjdHM6IFtdLFxuICAgICAgICBQYXJ0aWNsZUVtaXR0ZXJzOiBbXSxcbiAgICAgICAgUGFydGljbGVFbWl0dGVyczI6IFtdLFxuICAgICAgICBDYW1lcmFzOiBbXSxcbiAgICAgICAgTGlnaHRzOiBbXSxcbiAgICAgICAgUmliYm9uRW1pdHRlcnM6IFtdLFxuICAgICAgICBDb2xsaXNpb25TaGFwZXM6IFtdLFxuICAgICAgICBQaXZvdFBvaW50czogW10sXG4gICAgICAgIE5vZGVzOiBbXVxuICAgIH07XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXRlLnN0ci5sZW5ndGgpIHtcbiAgICAgICAgd2hpbGUgKHBhcnNlQ29tbWVudChzdGF0ZSkpXG4gICAgICAgICAgICA7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgaWYgKGtleXdvcmQpIHtcbiAgICAgICAgICAgIGlmIChrZXl3b3JkIGluIHBhcnNlcnMpIHtcbiAgICAgICAgICAgICAgICBwYXJzZXJzW2tleXdvcmRdKHN0YXRlLCBtb2RlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJzZVVua25vd25CbG9jayhzdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vZGVsLk5vZGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChtb2RlbC5QaXZvdFBvaW50c1tpXSkge1xuICAgICAgICAgICAgbW9kZWwuTm9kZXNbaV0uUGl2b3RQb2ludCA9IG1vZGVsLlBpdm90UG9pbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtb2RlbDtcbn1cbmV4cG9ydHMucGFyc2UgPSBwYXJzZTtcbnZhciBfYTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1kbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBtb2RlbF8xID0gcmVxdWlyZShcIi4uL21vZGVsXCIpO1xudmFyIEJJR19FTkRJQU4gPSB0cnVlO1xudmFyIE5PTkUgPSAtMTtcbnZhciBBbmltVmVjdG9yVHlwZTtcbihmdW5jdGlvbiAoQW5pbVZlY3RvclR5cGUpIHtcbiAgICBBbmltVmVjdG9yVHlwZVtBbmltVmVjdG9yVHlwZVtcIklOVDFcIl0gPSAwXSA9IFwiSU5UMVwiO1xuICAgIEFuaW1WZWN0b3JUeXBlW0FuaW1WZWN0b3JUeXBlW1wiRkxPQVQxXCJdID0gMV0gPSBcIkZMT0FUMVwiO1xuICAgIEFuaW1WZWN0b3JUeXBlW0FuaW1WZWN0b3JUeXBlW1wiRkxPQVQzXCJdID0gMl0gPSBcIkZMT0FUM1wiO1xuICAgIEFuaW1WZWN0b3JUeXBlW0FuaW1WZWN0b3JUeXBlW1wiRkxPQVQ0XCJdID0gM10gPSBcIkZMT0FUNFwiO1xufSkoQW5pbVZlY3RvclR5cGUgfHwgKEFuaW1WZWN0b3JUeXBlID0ge30pKTtcbnZhciBhbmltVmVjdG9yU2l6ZSA9IChfYSA9IHt9LFxuICAgIF9hW0FuaW1WZWN0b3JUeXBlLklOVDFdID0gMSxcbiAgICBfYVtBbmltVmVjdG9yVHlwZS5GTE9BVDFdID0gMSxcbiAgICBfYVtBbmltVmVjdG9yVHlwZS5GTE9BVDNdID0gMyxcbiAgICBfYVtBbmltVmVjdG9yVHlwZS5GTE9BVDRdID0gNCxcbiAgICBfYSk7XG52YXIgU3RhdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0YXRlKGFycmF5QnVmZmVyKSB7XG4gICAgICAgIHRoaXMuYWIgPSBhcnJheUJ1ZmZlcjtcbiAgICAgICAgdGhpcy5wb3MgPSAwO1xuICAgICAgICB0aGlzLmxlbmd0aCA9IGFycmF5QnVmZmVyLmJ5dGVMZW5ndGg7XG4gICAgICAgIHRoaXMudmlldyA9IG5ldyBEYXRhVmlldyh0aGlzLmFiKTtcbiAgICAgICAgdGhpcy51aW50ID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5hYik7XG4gICAgfVxuICAgIFN0YXRlLnByb3RvdHlwZS5rZXl3b3JkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVzID0gU3RyaW5nLmZyb21DaGFyQ29kZSh0aGlzLnVpbnRbdGhpcy5wb3NdLCB0aGlzLnVpbnRbdGhpcy5wb3MgKyAxXSwgdGhpcy51aW50W3RoaXMucG9zICsgMl0sIHRoaXMudWludFt0aGlzLnBvcyArIDNdKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gNDtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFN0YXRlLnByb3RvdHlwZS5leHBlY3RLZXl3b3JkID0gZnVuY3Rpb24gKGtleXdvcmQsIGVycm9yVGV4dCkge1xuICAgICAgICBpZiAodGhpcy5rZXl3b3JkKCkgIT09IGtleXdvcmQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvclRleHQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdGF0ZS5wcm90b3R5cGUudWludDggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXcuZ2V0VWludDgodGhpcy5wb3MrKyk7XG4gICAgfTtcbiAgICBTdGF0ZS5wcm90b3R5cGUudWludDE2ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy52aWV3LmdldFVpbnQxNih0aGlzLnBvcywgQklHX0VORElBTik7XG4gICAgICAgIHRoaXMucG9zICs9IDI7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBTdGF0ZS5wcm90b3R5cGUuaW50MzIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXMgPSB0aGlzLnZpZXcuZ2V0SW50MzIodGhpcy5wb3MsIEJJR19FTkRJQU4pO1xuICAgICAgICB0aGlzLnBvcyArPSA0O1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgU3RhdGUucHJvdG90eXBlLmZsb2F0MzIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXMgPSB0aGlzLnZpZXcuZ2V0RmxvYXQzMih0aGlzLnBvcywgQklHX0VORElBTik7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBTdGF0ZS5wcm90b3R5cGUuc3RyID0gZnVuY3Rpb24gKGxlbmd0aCkge1xuICAgICAgICAvLyBhY3R1YWwgc3RyaW5nIGxlbmd0aFxuICAgICAgICAvLyBkYXRhIG1heSBjb25zaXN0IG9mIFsnYScsICdiJywgJ2MnLCAwLCAwLCAwXVxuICAgICAgICB2YXIgc3RyaW5nTGVuZ3RoID0gbGVuZ3RoO1xuICAgICAgICB3aGlsZSAodGhpcy51aW50W3RoaXMucG9zICsgc3RyaW5nTGVuZ3RoIC0gMV0gPT09IDAgJiYgc3RyaW5nTGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLS1zdHJpbmdMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgLy8gPz9cbiAgICAgICAgLy8gVFMyNDYxOlR5cGUgJ1VpbnQ4QXJyYXknIGlzIG5vdCBhbiBhcnJheSB0eXBlLlxuICAgICAgICAvLyBsZXQgcmVzID0gU3RyaW5nLmZyb21DaGFyQ29kZSguLi50aGlzLnVpbnQuc2xpY2UodGhpcy5wb3MsIHRoaXMucG9zICsgbGVuZ3RoKSk7XG4gICAgICAgIHZhciByZXMgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgdGhpcy51aW50LnNsaWNlKHRoaXMucG9zLCB0aGlzLnBvcyArIHN0cmluZ0xlbmd0aCkpO1xuICAgICAgICB0aGlzLnBvcyArPSBsZW5ndGg7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBTdGF0ZS5wcm90b3R5cGUuYW5pbVZlY3RvciA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgIHZhciByZXMgPSB7XG4gICAgICAgICAgICBLZXlzOiBbXVxuICAgICAgICB9O1xuICAgICAgICB2YXIgaXNJbnQgPSB0eXBlID09PSBBbmltVmVjdG9yVHlwZS5JTlQxO1xuICAgICAgICB2YXIgdmVjdG9yU2l6ZSA9IGFuaW1WZWN0b3JTaXplW3R5cGVdO1xuICAgICAgICB2YXIga2V5c0NvdW50ID0gdGhpcy5pbnQzMigpO1xuICAgICAgICByZXMuTGluZVR5cGUgPSB0aGlzLmludDMyKCk7XG4gICAgICAgIHJlcy5HbG9iYWxTZXFJZCA9IHRoaXMuaW50MzIoKTtcbiAgICAgICAgaWYgKHJlcy5HbG9iYWxTZXFJZCA9PT0gTk9ORSkge1xuICAgICAgICAgICAgcmVzLkdsb2JhbFNlcUlkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXNDb3VudDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgYW5pbUtleUZyYW1lID0ge307XG4gICAgICAgICAgICBhbmltS2V5RnJhbWUuRnJhbWUgPSB0aGlzLmludDMyKCk7XG4gICAgICAgICAgICBpZiAoaXNJbnQpIHtcbiAgICAgICAgICAgICAgICBhbmltS2V5RnJhbWUuVmVjdG9yID0gbmV3IEludDMyQXJyYXkodmVjdG9yU2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbmltS2V5RnJhbWUuVmVjdG9yID0gbmV3IEZsb2F0MzJBcnJheSh2ZWN0b3JTaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmVjdG9yU2l6ZTsgKytqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzSW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1LZXlGcmFtZS5WZWN0b3Jbal0gPSB0aGlzLmludDMyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhbmltS2V5RnJhbWUuVmVjdG9yW2pdID0gdGhpcy5mbG9hdDMyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcy5MaW5lVHlwZSA9PT0gbW9kZWxfMS5MaW5lVHlwZS5IZXJtaXRlIHx8IHJlcy5MaW5lVHlwZSA9PT0gbW9kZWxfMS5MaW5lVHlwZS5CZXppZXIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gWydJblRhbicsICdPdXRUYW4nXTsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnQgPSBfYVtfaV07XG4gICAgICAgICAgICAgICAgICAgIGFuaW1LZXlGcmFtZVtwYXJ0XSA9IG5ldyBGbG9hdDMyQXJyYXkodmVjdG9yU2l6ZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmVjdG9yU2l6ZTsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNJbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltS2V5RnJhbWVbcGFydF1bal0gPSB0aGlzLmludDMyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltS2V5RnJhbWVbcGFydF1bal0gPSB0aGlzLmZsb2F0MzIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5LZXlzLnB1c2goYW5pbUtleUZyYW1lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgcmV0dXJuIFN0YXRlO1xufSgpKTtcbmZ1bmN0aW9uIHBhcnNlRXh0ZW50KG9iaiwgc3RhdGUpIHtcbiAgICBvYmouQm91bmRzUmFkaXVzID0gc3RhdGUuZmxvYXQzMigpO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBbJ01pbmltdW1FeHRlbnQnLCAnTWF4aW11bUV4dGVudCddOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIga2V5ID0gX2FbX2ldO1xuICAgICAgICBvYmpba2V5XSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgKytpKSB7XG4gICAgICAgICAgICBvYmpba2V5XVtpXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlVmVyc2lvbihtb2RlbCwgc3RhdGUpIHtcbiAgICBtb2RlbC5WZXJzaW9uID0gc3RhdGUuaW50MzIoKTtcbn1cbnZhciBNT0RFTF9OQU1FX0xFTkdUSCA9IDB4MTUwO1xuZnVuY3Rpb24gcGFyc2VNb2RlbEluZm8obW9kZWwsIHN0YXRlKSB7XG4gICAgbW9kZWwuSW5mby5OYW1lID0gc3RhdGUuc3RyKE1PREVMX05BTUVfTEVOR1RIKTtcbiAgICBzdGF0ZS5pbnQzMigpOyAvLyB1bmtub3duIDQtYnl0ZSBzZXF1ZW5jZVxuICAgIHBhcnNlRXh0ZW50KG1vZGVsLkluZm8sIHN0YXRlKTtcbiAgICBtb2RlbC5JbmZvLkJsZW5kVGltZSA9IHN0YXRlLmludDMyKCk7XG59XG52YXIgTU9ERUxfU0VRVUVOQ0VfTkFNRV9MRU5HVEggPSAweDUwO1xuZnVuY3Rpb24gcGFyc2VTZXF1ZW5jZXMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIG5hbWVfMSA9IHN0YXRlLnN0cihNT0RFTF9TRVFVRU5DRV9OQU1FX0xFTkdUSCk7XG4gICAgICAgIHZhciBzZXF1ZW5jZSA9IHt9O1xuICAgICAgICBzZXF1ZW5jZS5OYW1lID0gbmFtZV8xO1xuICAgICAgICB2YXIgaW50ZXJ2YWwgPSBuZXcgVWludDMyQXJyYXkoMik7XG4gICAgICAgIGludGVydmFsWzBdID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgaW50ZXJ2YWxbMV0gPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBzZXF1ZW5jZS5JbnRlcnZhbCA9IGludGVydmFsO1xuICAgICAgICBzZXF1ZW5jZS5Nb3ZlU3BlZWQgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIHNlcXVlbmNlLk5vbkxvb3BpbmcgPSBzdGF0ZS5pbnQzMigpID4gMDtcbiAgICAgICAgc2VxdWVuY2UuUmFyaXR5ID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBzdGF0ZS5pbnQzMigpOyAvLyB1bmtub3duIDQtYnl0ZSBzZXF1ZW5jZSAoc3luY1BvaW50PylcbiAgICAgICAgcGFyc2VFeHRlbnQoc2VxdWVuY2UsIHN0YXRlKTtcbiAgICAgICAgbW9kZWwuU2VxdWVuY2VzLnB1c2goc2VxdWVuY2UpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlTWF0ZXJpYWxzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHN0YXRlLmludDMyKCk7IC8vIG1hdGVyaWFsIHNpemUgaW5jbHVzaXZlXG4gICAgICAgIHZhciBtYXRlcmlhbCA9IHtcbiAgICAgICAgICAgIExheWVyczogW11cbiAgICAgICAgfTtcbiAgICAgICAgbWF0ZXJpYWwuUHJpb3JpdHlQbGFuZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIG1hdGVyaWFsLlJlbmRlck1vZGUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdMQVlTJywgJ0luY29ycmVjdCBtYXRlcmlhbHMgZm9ybWF0Jyk7XG4gICAgICAgIHZhciBsYXllcnNDb3VudCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGF5ZXJzQ291bnQ7ICsraSkge1xuICAgICAgICAgICAgdmFyIHN0YXJ0UG9zMiA9IHN0YXRlLnBvcztcbiAgICAgICAgICAgIHZhciBzaXplMiA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSB7fTtcbiAgICAgICAgICAgIGxheWVyLkZpbHRlck1vZGUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICAgICAgbGF5ZXIuU2hhZGluZyA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgICAgICBsYXllci5UZXh0dXJlSUQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICAgICAgbGF5ZXIuVFZlcnRleEFuaW1JZCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgICAgICBpZiAobGF5ZXIuVFZlcnRleEFuaW1JZCA9PT0gTk9ORSkge1xuICAgICAgICAgICAgICAgIGxheWVyLlRWZXJ0ZXhBbmltSWQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGF5ZXIuQ29vcmRJZCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgICAgICBsYXllci5BbHBoYSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvczIgKyBzaXplMikge1xuICAgICAgICAgICAgICAgIHZhciBrZXl3b3JkID0gc3RhdGUua2V5d29yZCgpO1xuICAgICAgICAgICAgICAgIGlmIChrZXl3b3JkID09PSAnS01UQScpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuQWxwaGEgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLTVRGJykge1xuICAgICAgICAgICAgICAgICAgICBsYXllci5UZXh0dXJlSUQgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLklOVDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxheWVyIGNodW5rIGRhdGEgJyArIGtleXdvcmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1hdGVyaWFsLkxheWVycy5wdXNoKGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5NYXRlcmlhbHMucHVzaChtYXRlcmlhbCk7XG4gICAgfVxufVxudmFyIE1PREVMX1RFWFRVUkVfUEFUSF9MRU5HVEggPSAweDEwMDtcbmZ1bmN0aW9uIHBhcnNlVGV4dHVyZXMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIHRleHR1cmUgPSB7fTtcbiAgICAgICAgdGV4dHVyZS5SZXBsYWNlYWJsZUlkID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgdGV4dHVyZS5JbWFnZSA9IHN0YXRlLnN0cihNT0RFTF9URVhUVVJFX1BBVEhfTEVOR1RIKTtcbiAgICAgICAgc3RhdGUuaW50MzIoKTsgLy8gdW5rbm93biA0LWJ5dGUgc2VxdWVuY2VcbiAgICAgICAgdGV4dHVyZS5GbGFncyA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIG1vZGVsLlRleHR1cmVzLnB1c2godGV4dHVyZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gcGFyc2VHZW9zZXRzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciBnZW9zZXQgPSB7fTtcbiAgICAgICAgc3RhdGUuaW50MzIoKTsgLy8gZ2Vvc2V0IHNpemUsIG5vdCB1c2VkXG4gICAgICAgIHN0YXRlLmV4cGVjdEtleXdvcmQoJ1ZSVFgnLCAnSW5jb3JyZWN0IGdlb3NldHMgZm9ybWF0Jyk7XG4gICAgICAgIHZhciB2ZXJ0aWNlc0NvdW50ID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZ2Vvc2V0LlZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0aWNlc0NvdW50ICogMyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmVydGljZXNDb3VudCAqIDM7ICsraSkge1xuICAgICAgICAgICAgZ2Vvc2V0LlZlcnRpY2VzW2ldID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLmV4cGVjdEtleXdvcmQoJ05STVMnLCAnSW5jb3JyZWN0IGdlb3NldHMgZm9ybWF0Jyk7XG4gICAgICAgIHZhciBub3JtYWxzQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBnZW9zZXQuTm9ybWFscyA9IG5ldyBGbG9hdDMyQXJyYXkobm9ybWFsc0NvdW50ICogMyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9ybWFsc0NvdW50ICogMzsgKytpKSB7XG4gICAgICAgICAgICBnZW9zZXQuTm9ybWFsc1tpXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdQVFlQJywgJ0luY29ycmVjdCBnZW9zZXRzIGZvcm1hdCcpO1xuICAgICAgICB2YXIgcHJpbWl0aXZlQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByaW1pdGl2ZUNvdW50OyArK2kpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5pbnQzMigpICE9PSA0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3QgZ2Vvc2V0cyBmb3JtYXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdQQ05UJywgJ0luY29ycmVjdCBnZW9zZXRzIGZvcm1hdCcpO1xuICAgICAgICB2YXIgZmFjZUdyb3VwQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZhY2VHcm91cENvdW50OyArK2kpIHtcbiAgICAgICAgICAgIHN0YXRlLmludDMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuZXhwZWN0S2V5d29yZCgnUFZUWCcsICdJbmNvcnJlY3QgZ2Vvc2V0cyBmb3JtYXQnKTtcbiAgICAgICAgdmFyIGluZGljZXNDb3VudCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGdlb3NldC5GYWNlcyA9IG5ldyBVaW50MTZBcnJheShpbmRpY2VzQ291bnQpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluZGljZXNDb3VudDsgKytpKSB7XG4gICAgICAgICAgICBnZW9zZXQuRmFjZXNbaV0gPSBzdGF0ZS51aW50MTYoKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdHTkRYJywgJ0luY29ycmVjdCBnZW9zZXRzIGZvcm1hdCcpO1xuICAgICAgICB2YXIgdmVydGljZXNHcm91cENvdW50ID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZ2Vvc2V0LlZlcnRleEdyb3VwID0gbmV3IFVpbnQ4QXJyYXkodmVydGljZXNHcm91cENvdW50KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZXJ0aWNlc0dyb3VwQ291bnQ7ICsraSkge1xuICAgICAgICAgICAgZ2Vvc2V0LlZlcnRleEdyb3VwW2ldID0gc3RhdGUudWludDgoKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdNVEdDJywgJ0luY29ycmVjdCBnZW9zZXRzIGZvcm1hdCcpO1xuICAgICAgICB2YXIgZ3JvdXBzQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBnZW9zZXQuR3JvdXBzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXBzQ291bnQ7ICsraSkge1xuICAgICAgICAgICAgLy8gbmV3IEFycmF5KGFycmF5IGxlbmd0aClcbiAgICAgICAgICAgIGdlb3NldC5Hcm91cHNbaV0gPSBuZXcgQXJyYXkoc3RhdGUuaW50MzIoKSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuZXhwZWN0S2V5d29yZCgnTUFUUycsICdJbmNvcnJlY3QgZ2Vvc2V0cyBmb3JtYXQnKTtcbiAgICAgICAgZ2Vvc2V0LlRvdGFsR3JvdXBzQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICB2YXIgZ3JvdXBJbmRleCA9IDA7XG4gICAgICAgIHZhciBncm91cENvdW50ZXIgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlb3NldC5Ub3RhbEdyb3Vwc0NvdW50OyArK2kpIHtcbiAgICAgICAgICAgIGlmIChncm91cEluZGV4ID49IGdlb3NldC5Hcm91cHNbZ3JvdXBDb3VudGVyXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBncm91cEluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICBncm91cENvdW50ZXIrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdlb3NldC5Hcm91cHNbZ3JvdXBDb3VudGVyXVtncm91cEluZGV4KytdID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgfVxuICAgICAgICBnZW9zZXQuTWF0ZXJpYWxJRCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGdlb3NldC5TZWxlY3Rpb25Hcm91cCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGdlb3NldC5VbnNlbGVjdGFibGUgPSBzdGF0ZS5pbnQzMigpID4gMDtcbiAgICAgICAgcGFyc2VFeHRlbnQoZ2Vvc2V0LCBzdGF0ZSk7XG4gICAgICAgIHZhciBnZW9zZXRBbmltQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBnZW9zZXQuQW5pbXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnZW9zZXRBbmltQ291bnQ7ICsraSkge1xuICAgICAgICAgICAgdmFyIGdlb3NldEFuaW0gPSB7fTtcbiAgICAgICAgICAgIHBhcnNlRXh0ZW50KGdlb3NldEFuaW0sIHN0YXRlKTtcbiAgICAgICAgICAgIGdlb3NldC5Bbmltcy5wdXNoKGdlb3NldEFuaW0pO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLmV4cGVjdEtleXdvcmQoJ1VWQVMnLCAnSW5jb3JyZWN0IGdlb3NldHMgZm9ybWF0Jyk7XG4gICAgICAgIHZhciB0ZXh0dXJlQ2h1bmtDb3VudCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGdlb3NldC5UVmVydGljZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZXh0dXJlQ2h1bmtDb3VudDsgKytpKSB7XG4gICAgICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdVVkJTJywgJ0luY29ycmVjdCBnZW9zZXRzIGZvcm1hdCcpO1xuICAgICAgICAgICAgdmFyIHRleHR1cmVDb29yZHNDb3VudCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgICAgICB2YXIgdHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheSh0ZXh0dXJlQ29vcmRzQ291bnQgKiAyKTtcbiAgICAgICAgICAgIGZvciAodmFyIGlfMSA9IDA7IGlfMSA8IHRleHR1cmVDb29yZHNDb3VudCAqIDI7ICsraV8xKSB7XG4gICAgICAgICAgICAgICAgdHZlcnRpY2VzW2lfMV0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnZW9zZXQuVFZlcnRpY2VzLnB1c2godHZlcnRpY2VzKTtcbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5HZW9zZXRzLnB1c2goZ2Vvc2V0KTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZUdlb3NldEFuaW1zKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciBhbmltU3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgICAgIHZhciBhbmltU2l6ZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIHZhciBnZW9zZXRBbmltID0ge307XG4gICAgICAgIGdlb3NldEFuaW0uQWxwaGEgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGdlb3NldEFuaW0uRmxhZ3MgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBnZW9zZXRBbmltLkNvbG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyArK2kpIHtcbiAgICAgICAgICAgIGdlb3NldEFuaW0uQ29sb3JbaV0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgZ2Vvc2V0QW5pbS5HZW9zZXRJZCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGlmIChnZW9zZXRBbmltLkdlb3NldElkID09PSBOT05FKSB7XG4gICAgICAgICAgICBnZW9zZXRBbmltLkdlb3NldElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoc3RhdGUucG9zIDwgYW5pbVN0YXJ0UG9zICsgYW5pbVNpemUpIHtcbiAgICAgICAgICAgIHZhciBrZXl3b3JkID0gc3RhdGUua2V5d29yZCgpO1xuICAgICAgICAgICAgaWYgKGtleXdvcmQgPT09ICdLR0FPJykge1xuICAgICAgICAgICAgICAgIGdlb3NldEFuaW0uQWxwaGEgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS0dBQycpIHtcbiAgICAgICAgICAgICAgICBnZW9zZXRBbmltLkNvbG9yID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3QgR2Vvc2V0QW5pbSBjaHVuayBkYXRhICcgKyBrZXl3b3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5HZW9zZXRBbmltcy5wdXNoKGdlb3NldEFuaW0pO1xuICAgIH1cbn1cbnZhciBNT0RFTF9OT0RFX05BTUVfTEVOR1RIID0gMHg1MDtcbmZ1bmN0aW9uIHBhcnNlTm9kZShtb2RlbCwgbm9kZSwgc3RhdGUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgdmFyIHNpemUgPSBzdGF0ZS5pbnQzMigpO1xuICAgIG5vZGUuTmFtZSA9IHN0YXRlLnN0cihNT0RFTF9OT0RFX05BTUVfTEVOR1RIKTtcbiAgICBub2RlLk9iamVjdElkID0gc3RhdGUuaW50MzIoKTtcbiAgICBpZiAobm9kZS5PYmplY3RJZCA9PT0gTk9ORSkge1xuICAgICAgICBub2RlLk9iamVjdElkID0gbnVsbDtcbiAgICB9XG4gICAgbm9kZS5QYXJlbnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgIGlmIChub2RlLlBhcmVudCA9PT0gTk9ORSkge1xuICAgICAgICBub2RlLlBhcmVudCA9IG51bGw7XG4gICAgfVxuICAgIG5vZGUuRmxhZ3MgPSBzdGF0ZS5pbnQzMigpO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBzdGF0ZS5rZXl3b3JkKCk7XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnS0dUUicpIHtcbiAgICAgICAgICAgIG5vZGUuVHJhbnNsYXRpb24gPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tHUlQnKSB7XG4gICAgICAgICAgICBub2RlLlJvdGF0aW9uID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLR1NDJykge1xuICAgICAgICAgICAgbm9kZS5TY2FsaW5nID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3Qgbm9kZSBjaHVuayBkYXRhICcgKyBrZXl3b3JkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBtb2RlbC5Ob2Rlc1tub2RlLk9iamVjdElkXSA9IG5vZGU7XG59XG5mdW5jdGlvbiBwYXJzZUJvbmVzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciBib25lID0ge307XG4gICAgICAgIHBhcnNlTm9kZShtb2RlbCwgYm9uZSwgc3RhdGUpO1xuICAgICAgICBib25lLkdlb3NldElkID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgaWYgKGJvbmUuR2Vvc2V0SWQgPT09IE5PTkUpIHtcbiAgICAgICAgICAgIGJvbmUuR2Vvc2V0SWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGJvbmUuR2Vvc2V0QW5pbUlkID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgaWYgKGJvbmUuR2Vvc2V0QW5pbUlkID09PSBOT05FKSB7XG4gICAgICAgICAgICBib25lLkdlb3NldEFuaW1JZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbW9kZWwuQm9uZXMucHVzaChib25lKTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZUhlbHBlcnMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIGhlbHBlciA9IHt9O1xuICAgICAgICBwYXJzZU5vZGUobW9kZWwsIGhlbHBlciwgc3RhdGUpO1xuICAgICAgICBtb2RlbC5IZWxwZXJzLnB1c2goaGVscGVyKTtcbiAgICB9XG59XG52YXIgTU9ERUxfQVRUQUNITUVOVF9QQVRIX0xFTkdUSCA9IDB4MTAwO1xuZnVuY3Rpb24gcGFyc2VBdHRhY2htZW50cyhtb2RlbCwgc3RhdGUsIHNpemUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICB2YXIgYXR0YWNobWVudFN0YXJ0ID0gc3RhdGUucG9zO1xuICAgICAgICB2YXIgYXR0YWNobWVudFNpemUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICB2YXIgYXR0YWNobWVudCA9IHt9O1xuICAgICAgICBwYXJzZU5vZGUobW9kZWwsIGF0dGFjaG1lbnQsIHN0YXRlKTtcbiAgICAgICAgYXR0YWNobWVudC5QYXRoID0gc3RhdGUuc3RyKE1PREVMX0FUVEFDSE1FTlRfUEFUSF9MRU5HVEgpO1xuICAgICAgICBzdGF0ZS5pbnQzMigpOyAvLyB1bmtub3duIDQtYnl0ZVxuICAgICAgICBhdHRhY2htZW50LkF0dGFjaG1lbnRJRCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGlmIChzdGF0ZS5wb3MgPCBhdHRhY2htZW50U3RhcnQgKyBhdHRhY2htZW50U2l6ZSkge1xuICAgICAgICAgICAgc3RhdGUuZXhwZWN0S2V5d29yZCgnS0FUVicsICdJbmNvcnJlY3QgYXR0YWNobWVudCBjaHVuayBkYXRhJyk7XG4gICAgICAgICAgICBhdHRhY2htZW50LlZpc2liaWxpdHkgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgIH1cbiAgICAgICAgbW9kZWwuQXR0YWNobWVudHMucHVzaChhdHRhY2htZW50KTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZVBpdm90UG9pbnRzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBwb2ludHNDb3VudCA9IHNpemUgLyAoNCAqIDMpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRzQ291bnQ7ICsraSkge1xuICAgICAgICBtb2RlbC5QaXZvdFBvaW50c1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgIG1vZGVsLlBpdm90UG9pbnRzW2ldWzBdID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBtb2RlbC5QaXZvdFBvaW50c1tpXVsxXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgbW9kZWwuUGl2b3RQb2ludHNbaV1bMl0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgfVxufVxuZnVuY3Rpb24gcGFyc2VFdmVudE9iamVjdHMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIGV2ZW50T2JqZWN0ID0ge307XG4gICAgICAgIHBhcnNlTm9kZShtb2RlbCwgZXZlbnRPYmplY3QsIHN0YXRlKTtcbiAgICAgICAgc3RhdGUuZXhwZWN0S2V5d29yZCgnS0VWVCcsICdJbmNvcnJlY3QgRXZlbnRPYmplY3QgY2h1bmsgZGF0YScpO1xuICAgICAgICB2YXIgZXZlbnRUcmFja0NvdW50ID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZXZlbnRPYmplY3QuRXZlbnRUcmFjayA9IG5ldyBVaW50MzJBcnJheShldmVudFRyYWNrQ291bnQpO1xuICAgICAgICBzdGF0ZS5pbnQzMigpOyAvLyB1bnVzZWQgNC1ieXRlP1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV2ZW50VHJhY2tDb3VudDsgKytpKSB7XG4gICAgICAgICAgICBldmVudE9iamVjdC5FdmVudFRyYWNrW2ldID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5FdmVudE9iamVjdHMucHVzaChldmVudE9iamVjdCk7XG4gICAgfVxufVxuZnVuY3Rpb24gcGFyc2VDb2xsaXNpb25TaGFwZXMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIGNvbGxpc2lvblNoYXBlID0ge307XG4gICAgICAgIHBhcnNlTm9kZShtb2RlbCwgY29sbGlzaW9uU2hhcGUsIHN0YXRlKTtcbiAgICAgICAgY29sbGlzaW9uU2hhcGUuU2hhcGUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBpZiAoY29sbGlzaW9uU2hhcGUuU2hhcGUgPT09IG1vZGVsXzEuQ29sbGlzaW9uU2hhcGVUeXBlLkJveCkge1xuICAgICAgICAgICAgY29sbGlzaW9uU2hhcGUuVmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KDYpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29sbGlzaW9uU2hhcGUuVmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sbGlzaW9uU2hhcGUuVmVydGljZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGNvbGxpc2lvblNoYXBlLlZlcnRpY2VzW2ldID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2xsaXNpb25TaGFwZS5TaGFwZSA9PT0gbW9kZWxfMS5Db2xsaXNpb25TaGFwZVR5cGUuU3BoZXJlKSB7XG4gICAgICAgICAgICBjb2xsaXNpb25TaGFwZS5Cb3VuZHNSYWRpdXMgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgbW9kZWwuQ29sbGlzaW9uU2hhcGVzLnB1c2goY29sbGlzaW9uU2hhcGUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlR2xvYmFsU2VxdWVuY2VzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICBtb2RlbC5HbG9iYWxTZXF1ZW5jZXMgPSBbXTtcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIG1vZGVsLkdsb2JhbFNlcXVlbmNlcy5wdXNoKHN0YXRlLmludDMyKCkpO1xuICAgIH1cbn1cbnZhciBNT0RFTF9QQVJUSUNMRV9FTUlUVEVSX1BBVEhfTEVOR1RIID0gMHgxMDA7XG5mdW5jdGlvbiBwYXJzZVBhcnRpY2xlRW1pdHRlcnMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIGVtaXR0ZXJTdGFydCA9IHN0YXRlLnBvcztcbiAgICAgICAgdmFyIGVtaXR0ZXJTaXplID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgdmFyIGVtaXR0ZXIgPSB7fTtcbiAgICAgICAgcGFyc2VOb2RlKG1vZGVsLCBlbWl0dGVyLCBzdGF0ZSk7XG4gICAgICAgIGVtaXR0ZXIuRW1pc3Npb25SYXRlID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLkdyYXZpdHkgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuTG9uZ2l0dWRlID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLkxhdGl0dWRlID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLlBhdGggPSBzdGF0ZS5zdHIoTU9ERUxfUEFSVElDTEVfRU1JVFRFUl9QQVRIX0xFTkdUSCk7XG4gICAgICAgIHN0YXRlLmludDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuTGlmZVNwYW4gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuSW5pdFZlbG9jaXR5ID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICB3aGlsZSAoc3RhdGUucG9zIDwgZW1pdHRlclN0YXJ0ICsgZW1pdHRlclNpemUpIHtcbiAgICAgICAgICAgIHZhciBrZXl3b3JkID0gc3RhdGUua2V5d29yZCgpO1xuICAgICAgICAgICAgaWYgKGtleXdvcmQgPT09ICdLUEVWJykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuVmlzaWJpbGl0eSA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLUEVFJykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuRW1pc3Npb25SYXRlID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tQRUcnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5HcmF2aXR5ID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tQTE4nKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5Mb25naXR1ZGUgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1BMVCcpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLkxhdGl0dWRlID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tQRUwnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5MaWZlU3BhbiA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLUEVTJykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuSW5pdFZlbG9jaXR5ID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3QgcGFydGljbGUgZW1pdHRlciBjaHVuayBkYXRhICcgKyBrZXl3b3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5QYXJ0aWNsZUVtaXR0ZXJzLnB1c2goZW1pdHRlcik7XG4gICAgfVxufVxuZnVuY3Rpb24gcGFyc2VQYXJ0aWNsZUVtaXR0ZXJzMihtb2RlbCwgc3RhdGUsIHNpemUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICB2YXIgZW1pdHRlclN0YXJ0ID0gc3RhdGUucG9zO1xuICAgICAgICB2YXIgZW1pdHRlclNpemUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICB2YXIgZW1pdHRlciA9IHt9O1xuICAgICAgICBwYXJzZU5vZGUobW9kZWwsIGVtaXR0ZXIsIHN0YXRlKTtcbiAgICAgICAgZW1pdHRlci5TcGVlZCA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZW1pdHRlci5WYXJpYXRpb24gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuTGF0aXR1ZGUgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuR3Jhdml0eSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZW1pdHRlci5MaWZlU3BhbiA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZW1pdHRlci5FbWlzc2lvblJhdGUgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuV2lkdGggPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuTGVuZ3RoID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLkZpbHRlck1vZGUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBlbWl0dGVyLlJvd3MgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBlbWl0dGVyLkNvbHVtbnMgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICB2YXIgZnJhbWVGbGFncyA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuRnJhbWVGbGFncyA9IDA7XG4gICAgICAgIGlmIChmcmFtZUZsYWdzID09PSAwIHx8IGZyYW1lRmxhZ3MgPT09IDIpIHtcbiAgICAgICAgICAgIGVtaXR0ZXIuRnJhbWVGbGFncyB8PSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5IZWFkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmcmFtZUZsYWdzID09PSAxIHx8IGZyYW1lRmxhZ3MgPT09IDIpIHtcbiAgICAgICAgICAgIGVtaXR0ZXIuRnJhbWVGbGFncyB8PSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5UYWlsO1xuICAgICAgICB9XG4gICAgICAgIGVtaXR0ZXIuVGFpbExlbmd0aCA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZW1pdHRlci5UaW1lID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLlNlZ21lbnRDb2xvciA9IFtdO1xuICAgICAgICAvLyBhbHdheXMgMyBzZWdtZW50c1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7ICsraSkge1xuICAgICAgICAgICAgZW1pdHRlci5TZWdtZW50Q29sb3JbaV0gPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICAgICAgLy8gIHJnYiBvcmRlciwgaW52ZXJzZSBmcm9tIG1kbFxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAzOyArK2opIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLlNlZ21lbnRDb2xvcltpXVtqXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbWl0dGVyLkFscGhhID0gbmV3IFVpbnQ4QXJyYXkoMyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgKytpKSB7XG4gICAgICAgICAgICBlbWl0dGVyLkFscGhhW2ldID0gc3RhdGUudWludDgoKTtcbiAgICAgICAgfVxuICAgICAgICBlbWl0dGVyLlBhcnRpY2xlU2NhbGluZyA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgKytpKSB7XG4gICAgICAgICAgICBlbWl0dGVyLlBhcnRpY2xlU2NhbGluZ1tpXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gWydMaWZlU3BhblVWQW5pbScsICdEZWNheVVWQW5pbScsICdUYWlsVVZBbmltJywgJ1RhaWxEZWNheVVWQW5pbSddOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIHBhcnQgPSBfYVtfaV07XG4gICAgICAgICAgICBlbWl0dGVyW3BhcnRdID0gbmV3IFVpbnQzMkFycmF5KDMpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyArK2kpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyW3BhcnRdW2ldID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbWl0dGVyLlRleHR1cmVJRCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGlmIChlbWl0dGVyLlRleHR1cmVJRCA9PT0gTk9ORSkge1xuICAgICAgICAgICAgZW1pdHRlci5UZXh0dXJlSUQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVtaXR0ZXIuU3F1aXJ0ID0gc3RhdGUuaW50MzIoKSA+IDA7XG4gICAgICAgIGVtaXR0ZXIuUHJpb3JpdHlQbGFuZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuUmVwbGFjZWFibGVJZCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBlbWl0dGVyU3RhcnQgKyBlbWl0dGVyU2l6ZSkge1xuICAgICAgICAgICAgdmFyIGtleXdvcmQgPSBzdGF0ZS5rZXl3b3JkKCk7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0tQMlYnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5WaXNpYmlsaXR5ID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tQMkUnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5FbWlzc2lvblJhdGUgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1AyVycpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLldpZHRoID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tQMk4nKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5MZW5ndGggPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1AyUycpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLlNwZWVkID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tQMkwnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5MYXRpdHVkZSA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLUDJHJykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuR3Jhdml0eSA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLUDJSJykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuVmFyaWF0aW9uID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3QgcGFydGljbGUgZW1pdHRlcjIgY2h1bmsgZGF0YSAnICsga2V5d29yZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbW9kZWwuUGFydGljbGVFbWl0dGVyczIucHVzaChlbWl0dGVyKTtcbiAgICB9XG59XG52YXIgTU9ERUxfQ0FNRVJBX05BTUVfTEVOR1RIID0gMHg1MDtcbmZ1bmN0aW9uIHBhcnNlQ2FtZXJhcyhtb2RlbCwgc3RhdGUsIHNpemUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICB2YXIgY2FtZXJhU3RhcnQgPSBzdGF0ZS5wb3M7XG4gICAgICAgIHZhciBjYW1lcmFTaXplID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgdmFyIGNhbWVyYSA9IHt9O1xuICAgICAgICBjYW1lcmEuTmFtZSA9IHN0YXRlLnN0cihNT0RFTF9DQU1FUkFfTkFNRV9MRU5HVEgpO1xuICAgICAgICBjYW1lcmEuUG9zaXRpb24gPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICBjYW1lcmEuUG9zaXRpb25bMF0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGNhbWVyYS5Qb3NpdGlvblsxXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgY2FtZXJhLlBvc2l0aW9uWzJdID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBjYW1lcmEuRmllbGRPZlZpZXcgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGNhbWVyYS5GYXJDbGlwID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBjYW1lcmEuTmVhckNsaXAgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGNhbWVyYS5UYXJnZXRQb3NpdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgIGNhbWVyYS5UYXJnZXRQb3NpdGlvblswXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgY2FtZXJhLlRhcmdldFBvc2l0aW9uWzFdID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBjYW1lcmEuVGFyZ2V0UG9zaXRpb25bMl0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBjYW1lcmFTdGFydCArIGNhbWVyYVNpemUpIHtcbiAgICAgICAgICAgIHZhciBrZXl3b3JkID0gc3RhdGUua2V5d29yZCgpO1xuICAgICAgICAgICAgaWYgKGtleXdvcmQgPT09ICdLQ1RSJykge1xuICAgICAgICAgICAgICAgIGNhbWVyYS5UcmFuc2xhdGlvbiA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLVFRSJykge1xuICAgICAgICAgICAgICAgIGNhbWVyYS5UYXJnZXRUcmFuc2xhdGlvbiA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLQ1JMJykge1xuICAgICAgICAgICAgICAgIGNhbWVyYS5Sb3RhdGlvbiA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5jb3JyZWN0IGNhbWVyYSBjaHVuayBkYXRhICcgKyBrZXl3b3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5DYW1lcmFzLnB1c2goY2FtZXJhKTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZUxpZ2h0cyhtb2RlbCwgc3RhdGUsIHNpemUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICB2YXIgbGlnaHRTdGFydCA9IHN0YXRlLnBvcztcbiAgICAgICAgdmFyIGxpZ2h0U2l6ZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIHZhciBsaWdodCA9IHt9O1xuICAgICAgICBwYXJzZU5vZGUobW9kZWwsIGxpZ2h0LCBzdGF0ZSk7XG4gICAgICAgIGxpZ2h0LkxpZ2h0VHlwZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGxpZ2h0LkF0dGVudWF0aW9uU3RhcnQgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGxpZ2h0LkF0dGVudWF0aW9uRW5kID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBsaWdodC5Db2xvciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgIC8vICByZ2Igb3JkZXIsIGludmVyc2UgZnJvbSBtZGxcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAzOyArK2opIHtcbiAgICAgICAgICAgIGxpZ2h0LkNvbG9yW2pdID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICB9XG4gICAgICAgIGxpZ2h0LkludGVuc2l0eSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgbGlnaHQuQW1iQ29sb3IgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICAvLyAgcmdiIG9yZGVyLCBpbnZlcnNlIGZyb20gbWRsXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMzsgKytqKSB7XG4gICAgICAgICAgICBsaWdodC5BbWJDb2xvcltqXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgfVxuICAgICAgICBsaWdodC5BbWJJbnRlbnNpdHkgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBsaWdodFN0YXJ0ICsgbGlnaHRTaXplKSB7XG4gICAgICAgICAgICB2YXIga2V5d29yZCA9IHN0YXRlLmtleXdvcmQoKTtcbiAgICAgICAgICAgIGlmIChrZXl3b3JkID09PSAnS0xBVicpIHtcbiAgICAgICAgICAgICAgICBsaWdodC5WaXNpYmlsaXR5ID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tMQUMnKSB7XG4gICAgICAgICAgICAgICAgbGlnaHQuQ29sb3IgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS0xBSScpIHtcbiAgICAgICAgICAgICAgICBsaWdodC5JbnRlbnNpdHkgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS0xCQycpIHtcbiAgICAgICAgICAgICAgICBsaWdodC5BbWJDb2xvciA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLTEJJJykge1xuICAgICAgICAgICAgICAgIGxpZ2h0LkFtYkludGVuc2l0eSA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLTEFTJykge1xuICAgICAgICAgICAgICAgIGxpZ2h0LkF0dGVudWF0aW9uU3RhcnQgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLklOVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tMQUUnKSB7XG4gICAgICAgICAgICAgICAgbGlnaHQuQXR0ZW51YXRpb25FbmQgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLklOVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3QgbGlnaHQgY2h1bmsgZGF0YSAnICsga2V5d29yZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbW9kZWwuTGlnaHRzLnB1c2gobGlnaHQpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlVGV4dHVyZUFuaW1zKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciBhbmltU3RhcnQgPSBzdGF0ZS5wb3M7XG4gICAgICAgIHZhciBhbmltU2l6ZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIHZhciBhbmltID0ge307XG4gICAgICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBhbmltU3RhcnQgKyBhbmltU2l6ZSkge1xuICAgICAgICAgICAgdmFyIGtleXdvcmQgPSBzdGF0ZS5rZXl3b3JkKCk7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0tUQVQnKSB7XG4gICAgICAgICAgICAgICAgYW5pbS5UcmFuc2xhdGlvbiA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLVEFSJykge1xuICAgICAgICAgICAgICAgIGFuaW0uUm90YXRpb24gPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUNCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1RBUycpIHtcbiAgICAgICAgICAgICAgICBhbmltLlNjYWxpbmcgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdCBsaWdodCBjaHVuayBkYXRhICcgKyBrZXl3b3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5UZXh0dXJlQW5pbXMucHVzaChhbmltKTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZVJpYmJvbkVtaXR0ZXJzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciBlbWl0dGVyU3RhcnQgPSBzdGF0ZS5wb3M7XG4gICAgICAgIHZhciBlbWl0dGVyU2l6ZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIHZhciBlbWl0dGVyID0ge307XG4gICAgICAgIHBhcnNlTm9kZShtb2RlbCwgZW1pdHRlciwgc3RhdGUpO1xuICAgICAgICBlbWl0dGVyLkhlaWdodEFib3ZlID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLkhlaWdodEJlbG93ID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLkFscGhhID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLkNvbG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgLy8gIHJnYiBvcmRlciwgaW52ZXJzZSBmcm9tIG1kbFxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDM7ICsraikge1xuICAgICAgICAgICAgZW1pdHRlci5Db2xvcltqXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgfVxuICAgICAgICBlbWl0dGVyLkxpZmVTcGFuID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLlRleHR1cmVTbG90ID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZW1pdHRlci5FbWlzc2lvblJhdGUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBlbWl0dGVyLlJvd3MgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBlbWl0dGVyLkNvbHVtbnMgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBlbWl0dGVyLk1hdGVyaWFsSUQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBlbWl0dGVyLkdyYXZpdHkgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBlbWl0dGVyU3RhcnQgKyBlbWl0dGVyU2l6ZSkge1xuICAgICAgICAgICAgdmFyIGtleXdvcmQgPSBzdGF0ZS5rZXl3b3JkKCk7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0tSVlMnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5WaXNpYmlsaXR5ID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tSSEEnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5IZWlnaHRBYm92ZSA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLUkhCJykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuSGVpZ2h0QmVsb3cgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1JBTCcpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLkFscGhhID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tSVFgnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5UZXh0dXJlU2xvdCA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuSU5UMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdCByaWJib24gZW1pdHRlciBjaHVuayBkYXRhICcgKyBrZXl3b3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5SaWJib25FbWl0dGVycy5wdXNoKGVtaXR0ZXIpO1xuICAgIH1cbn1cbnZhciBwYXJzZXJzID0ge1xuICAgIFZFUlM6IHBhcnNlVmVyc2lvbixcbiAgICBNT0RMOiBwYXJzZU1vZGVsSW5mbyxcbiAgICBTRVFTOiBwYXJzZVNlcXVlbmNlcyxcbiAgICBNVExTOiBwYXJzZU1hdGVyaWFscyxcbiAgICBURVhTOiBwYXJzZVRleHR1cmVzLFxuICAgIEdFT1M6IHBhcnNlR2Vvc2V0cyxcbiAgICBHRU9BOiBwYXJzZUdlb3NldEFuaW1zLFxuICAgIEJPTkU6IHBhcnNlQm9uZXMsXG4gICAgSEVMUDogcGFyc2VIZWxwZXJzLFxuICAgIEFUQ0g6IHBhcnNlQXR0YWNobWVudHMsXG4gICAgUElWVDogcGFyc2VQaXZvdFBvaW50cyxcbiAgICBFVlRTOiBwYXJzZUV2ZW50T2JqZWN0cyxcbiAgICBDTElEOiBwYXJzZUNvbGxpc2lvblNoYXBlcyxcbiAgICBHTEJTOiBwYXJzZUdsb2JhbFNlcXVlbmNlcyxcbiAgICBQUkVNOiBwYXJzZVBhcnRpY2xlRW1pdHRlcnMsXG4gICAgUFJFMjogcGFyc2VQYXJ0aWNsZUVtaXR0ZXJzMixcbiAgICBDQU1TOiBwYXJzZUNhbWVyYXMsXG4gICAgTElURTogcGFyc2VMaWdodHMsXG4gICAgVFhBTjogcGFyc2VUZXh0dXJlQW5pbXMsXG4gICAgUklCQjogcGFyc2VSaWJib25FbWl0dGVyc1xufTtcbmZ1bmN0aW9uIHBhcnNlKGFycmF5QnVmZmVyKSB7XG4gICAgdmFyIHN0YXRlID0gbmV3IFN0YXRlKGFycmF5QnVmZmVyKTtcbiAgICBpZiAoc3RhdGUua2V5d29yZCgpICE9PSAnTURMWCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYSBtZHggbW9kZWwnKTtcbiAgICB9XG4gICAgdmFyIG1vZGVsID0ge1xuICAgICAgICAvLyBkZWZhdWx0XG4gICAgICAgIFZlcnNpb246IDgwMCxcbiAgICAgICAgSW5mbzoge1xuICAgICAgICAgICAgTmFtZTogJycsXG4gICAgICAgICAgICBNaW5pbXVtRXh0ZW50OiBudWxsLFxuICAgICAgICAgICAgTWF4aW11bUV4dGVudDogbnVsbCxcbiAgICAgICAgICAgIEJvdW5kc1JhZGl1czogMCxcbiAgICAgICAgICAgIEJsZW5kVGltZTogMTUwXG4gICAgICAgIH0sXG4gICAgICAgIFNlcXVlbmNlczogW10sXG4gICAgICAgIEdsb2JhbFNlcXVlbmNlczogW10sXG4gICAgICAgIFRleHR1cmVzOiBbXSxcbiAgICAgICAgTWF0ZXJpYWxzOiBbXSxcbiAgICAgICAgVGV4dHVyZUFuaW1zOiBbXSxcbiAgICAgICAgR2Vvc2V0czogW10sXG4gICAgICAgIEdlb3NldEFuaW1zOiBbXSxcbiAgICAgICAgQm9uZXM6IFtdLFxuICAgICAgICBIZWxwZXJzOiBbXSxcbiAgICAgICAgQXR0YWNobWVudHM6IFtdLFxuICAgICAgICBFdmVudE9iamVjdHM6IFtdLFxuICAgICAgICBQYXJ0aWNsZUVtaXR0ZXJzOiBbXSxcbiAgICAgICAgUGFydGljbGVFbWl0dGVyczI6IFtdLFxuICAgICAgICBDYW1lcmFzOiBbXSxcbiAgICAgICAgTGlnaHRzOiBbXSxcbiAgICAgICAgUmliYm9uRW1pdHRlcnM6IFtdLFxuICAgICAgICBDb2xsaXNpb25TaGFwZXM6IFtdLFxuICAgICAgICBQaXZvdFBvaW50czogW10sXG4gICAgICAgIE5vZGVzOiBbXVxuICAgIH07XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXRlLmxlbmd0aCkge1xuICAgICAgICB2YXIga2V5d29yZCA9IHN0YXRlLmtleXdvcmQoKTtcbiAgICAgICAgdmFyIHNpemUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBpZiAoa2V5d29yZCBpbiBwYXJzZXJzKSB7XG4gICAgICAgICAgICBwYXJzZXJzW2tleXdvcmRdKG1vZGVsLCBzdGF0ZSwgc2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZ3JvdXAgJyArIGtleXdvcmQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9kZWwuTm9kZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKG1vZGVsLk5vZGVzW2ldICYmIG1vZGVsLlBpdm90UG9pbnRzW2ldKSB7XG4gICAgICAgICAgICBtb2RlbC5Ob2Rlc1tpXS5QaXZvdFBvaW50ID0gbW9kZWwuUGl2b3RQb2ludHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1vZGVsO1xufVxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlO1xudmFyIF9hO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWR4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIG1vZGVsXzEgPSByZXF1aXJlKFwiLi4vbW9kZWxcIik7XG52YXIgZ2xfbWF0cml4XzEgPSByZXF1aXJlKFwiZ2wtbWF0cml4XCIpO1xuZnVuY3Rpb24gbGVycChsZWZ0LCByaWdodCwgdCkge1xuICAgIHJldHVybiBsZWZ0ICogKDEgLSB0KSArIHJpZ2h0ICogdDtcbn1cbmV4cG9ydHMubGVycCA9IGxlcnA7XG5mdW5jdGlvbiBpbnRlcnBOdW0oZnJhbWUsIGxlZnQsIHJpZ2h0LCBsaW5lVHlwZSkge1xuICAgIGlmIChsZWZ0LkZyYW1lID09PSByaWdodC5GcmFtZSkge1xuICAgICAgICByZXR1cm4gbGVmdC5WZWN0b3JbMF07XG4gICAgfVxuICAgIHZhciB0ID0gKGZyYW1lIC0gbGVmdC5GcmFtZSkgLyAocmlnaHQuRnJhbWUgLSBsZWZ0LkZyYW1lKTtcbiAgICBpZiAobGluZVR5cGUgPT09IG1vZGVsXzEuTGluZVR5cGUuRG9udEludGVycCkge1xuICAgICAgICByZXR1cm4gbGVmdC5WZWN0b3JbMF07XG4gICAgICAgIC8vIH0gZWxzZSBpZiAoYW5pbVZlY3Rvci5MaW5lVHlwZSA9PT0gJ0JlemllcicpIHtcbiAgICAgICAgLy8gICAgIHJldHVybiB2ZWMzLmJlemllcihvdXQsIGxlZnQuVmVjdG9yLCBsZWZ0Lk91dFRhbiwgcmlnaHQuSW5UYW4sIHJpZ2h0LlZlY3RvciwgdCk7XG4gICAgICAgIC8vIH0gZWxzZSBpZiAoYW5pbVZlY3Rvci5MaW5lVHlwZSA9PT0gJ0hlcm1pdGUnKSB7XG4gICAgICAgIC8vICAgICByZXR1cm4gdmVjMy5oZXJtaXRlKG91dCwgbGVmdC5WZWN0b3IsIGxlZnQuT3V0VGFuLCByaWdodC5JblRhbiwgcmlnaHQuVmVjdG9yLCB0KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIExpbmVhclxuICAgICAgICByZXR1cm4gbGVycChsZWZ0LlZlY3RvclswXSwgcmlnaHQuVmVjdG9yWzBdLCB0KTtcbiAgICB9XG59XG5leHBvcnRzLmludGVycE51bSA9IGludGVycE51bTtcbmZ1bmN0aW9uIGludGVycFZlYzMob3V0LCBmcmFtZSwgbGVmdCwgcmlnaHQsIGxpbmVUeXBlKSB7XG4gICAgaWYgKGxlZnQuRnJhbWUgPT09IHJpZ2h0LkZyYW1lKSB7XG4gICAgICAgIHJldHVybiBsZWZ0LlZlY3RvcjtcbiAgICB9XG4gICAgdmFyIHQgPSAoZnJhbWUgLSBsZWZ0LkZyYW1lKSAvIChyaWdodC5GcmFtZSAtIGxlZnQuRnJhbWUpO1xuICAgIGlmIChsaW5lVHlwZSA9PT0gbW9kZWxfMS5MaW5lVHlwZS5Eb250SW50ZXJwKSB7XG4gICAgICAgIHJldHVybiBsZWZ0LlZlY3RvcjtcbiAgICB9XG4gICAgZWxzZSBpZiAobGluZVR5cGUgPT09IG1vZGVsXzEuTGluZVR5cGUuQmV6aWVyKSB7XG4gICAgICAgIHJldHVybiBnbF9tYXRyaXhfMS52ZWMzLmJlemllcihvdXQsIGxlZnQuVmVjdG9yLCBsZWZ0Lk91dFRhbiwgcmlnaHQuSW5UYW4sIHJpZ2h0LlZlY3RvciwgdCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGxpbmVUeXBlID09PSBtb2RlbF8xLkxpbmVUeXBlLkhlcm1pdGUpIHtcbiAgICAgICAgcmV0dXJuIGdsX21hdHJpeF8xLnZlYzMuaGVybWl0ZShvdXQsIGxlZnQuVmVjdG9yLCBsZWZ0Lk91dFRhbiwgcmlnaHQuSW5UYW4sIHJpZ2h0LlZlY3RvciwgdCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gZ2xfbWF0cml4XzEudmVjMy5sZXJwKG91dCwgbGVmdC5WZWN0b3IsIHJpZ2h0LlZlY3RvciwgdCk7XG4gICAgfVxufVxuZXhwb3J0cy5pbnRlcnBWZWMzID0gaW50ZXJwVmVjMztcbmZ1bmN0aW9uIGludGVycFF1YXQob3V0LCBmcmFtZSwgbGVmdCwgcmlnaHQsIGxpbmVUeXBlKSB7XG4gICAgaWYgKGxlZnQuRnJhbWUgPT09IHJpZ2h0LkZyYW1lKSB7XG4gICAgICAgIHJldHVybiBsZWZ0LlZlY3RvcjtcbiAgICB9XG4gICAgdmFyIHQgPSAoZnJhbWUgLSBsZWZ0LkZyYW1lKSAvIChyaWdodC5GcmFtZSAtIGxlZnQuRnJhbWUpO1xuICAgIGlmIChsaW5lVHlwZSA9PT0gbW9kZWxfMS5MaW5lVHlwZS5Eb250SW50ZXJwKSB7XG4gICAgICAgIHJldHVybiBsZWZ0LlZlY3RvcjtcbiAgICB9XG4gICAgZWxzZSBpZiAobGluZVR5cGUgPT09IG1vZGVsXzEuTGluZVR5cGUuSGVybWl0ZSB8fCBsaW5lVHlwZSA9PT0gbW9kZWxfMS5MaW5lVHlwZS5CZXppZXIpIHtcbiAgICAgICAgcmV0dXJuIGdsX21hdHJpeF8xLnF1YXQuc3FsZXJwKG91dCwgbGVmdC5WZWN0b3IsIGxlZnQuT3V0VGFuLCByaWdodC5JblRhbiwgcmlnaHQuVmVjdG9yLCB0KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBnbF9tYXRyaXhfMS5xdWF0LnNsZXJwKG91dCwgbGVmdC5WZWN0b3IsIHJpZ2h0LlZlY3RvciwgdCk7XG4gICAgfVxufVxuZXhwb3J0cy5pbnRlcnBRdWF0ID0gaW50ZXJwUXVhdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWludGVycC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBpbnRlcnBfMSA9IHJlcXVpcmUoXCIuL2ludGVycFwiKTtcbnZhciBmaW5kTG9jYWxGcmFtZVJlcyA9IHtcbiAgICBmcmFtZTogMCxcbiAgICBmcm9tOiAwLFxuICAgIHRvOiAwXG59O1xudmFyIGZpbmRLZXlmcmFtZXNSZXMgPSB7XG4gICAgZnJhbWU6IDAsXG4gICAgbGVmdDogbnVsbCxcbiAgICByaWdodDogbnVsbFxufTtcbnZhciBNb2RlbEludGVycCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTW9kZWxJbnRlcnAocmVuZGVyZXJEYXRhKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXJEYXRhID0gcmVuZGVyZXJEYXRhO1xuICAgIH1cbiAgICBNb2RlbEludGVycC5tYXhBbmltVmVjdG9yVmFsID0gZnVuY3Rpb24gKHZlY3Rvcikge1xuICAgICAgICBpZiAodHlwZW9mIHZlY3RvciA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJldHVybiB2ZWN0b3I7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1heCA9IHZlY3Rvci5LZXlzWzBdLlZlY3RvclswXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB2ZWN0b3IuS2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKHZlY3Rvci5LZXlzW2ldLlZlY3RvclswXSA+IG1heCkge1xuICAgICAgICAgICAgICAgIG1heCA9IHZlY3Rvci5LZXlzW2ldLlZlY3RvclswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF4O1xuICAgIH07XG4gICAgTW9kZWxJbnRlcnAucHJvdG90eXBlLm51bSA9IGZ1bmN0aW9uIChhbmltVmVjdG9yKSB7XG4gICAgICAgIHZhciByZXMgPSB0aGlzLmZpbmRLZXlmcmFtZXMoYW5pbVZlY3Rvcik7XG4gICAgICAgIGlmICghcmVzKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW50ZXJwXzEuaW50ZXJwTnVtKHJlcy5mcmFtZSwgcmVzLmxlZnQsIHJlcy5yaWdodCwgYW5pbVZlY3Rvci5MaW5lVHlwZSk7XG4gICAgfTtcbiAgICBNb2RlbEludGVycC5wcm90b3R5cGUudmVjMyA9IGZ1bmN0aW9uIChvdXQsIGFuaW1WZWN0b3IpIHtcbiAgICAgICAgdmFyIHJlcyA9IHRoaXMuZmluZEtleWZyYW1lcyhhbmltVmVjdG9yKTtcbiAgICAgICAgaWYgKCFyZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnRlcnBfMS5pbnRlcnBWZWMzKG91dCwgcmVzLmZyYW1lLCByZXMubGVmdCwgcmVzLnJpZ2h0LCBhbmltVmVjdG9yLkxpbmVUeXBlKTtcbiAgICB9O1xuICAgIE1vZGVsSW50ZXJwLnByb3RvdHlwZS5xdWF0ID0gZnVuY3Rpb24gKG91dCwgYW5pbVZlY3Rvcikge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy5maW5kS2V5ZnJhbWVzKGFuaW1WZWN0b3IpO1xuICAgICAgICBpZiAoIXJlcykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGludGVycF8xLmludGVycFF1YXQob3V0LCByZXMuZnJhbWUsIHJlcy5sZWZ0LCByZXMucmlnaHQsIGFuaW1WZWN0b3IuTGluZVR5cGUpO1xuICAgIH07XG4gICAgTW9kZWxJbnRlcnAucHJvdG90eXBlLmFuaW1WZWN0b3JWYWwgPSBmdW5jdGlvbiAodmVjdG9yLCBkZWZhdWx0VmFsKSB7XG4gICAgICAgIHZhciByZXM7XG4gICAgICAgIGlmICh0eXBlb2YgdmVjdG9yID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgcmVzID0gdmVjdG9yO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzID0gdGhpcy5udW0odmVjdG9yKTtcbiAgICAgICAgICAgIGlmIChyZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXMgPSBkZWZhdWx0VmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBNb2RlbEludGVycC5wcm90b3R5cGUuZmluZEtleWZyYW1lcyA9IGZ1bmN0aW9uIChhbmltVmVjdG9yKSB7XG4gICAgICAgIGlmICghYW5pbVZlY3Rvcikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIF9hID0gdGhpcy5maW5kTG9jYWxGcmFtZShhbmltVmVjdG9yKSwgZnJhbWUgPSBfYS5mcmFtZSwgZnJvbSA9IF9hLmZyb20sIHRvID0gX2EudG87XG4gICAgICAgIHZhciBhcnJheSA9IGFuaW1WZWN0b3IuS2V5cztcbiAgICAgICAgdmFyIGZpcnN0ID0gMDtcbiAgICAgICAgdmFyIGNvdW50ID0gYXJyYXkubGVuZ3RoO1xuICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcnJheVswXS5GcmFtZSA+IHRvKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhcnJheVtjb3VudCAtIDFdLkZyYW1lIDwgZnJvbSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGNvdW50ID4gMCkge1xuICAgICAgICAgICAgdmFyIHN0ZXAgPSBjb3VudCA+PiAxO1xuICAgICAgICAgICAgaWYgKGFycmF5W2ZpcnN0ICsgc3RlcF0uRnJhbWUgPD0gZnJhbWUpIHtcbiAgICAgICAgICAgICAgICBmaXJzdCA9IGZpcnN0ICsgc3RlcCArIDE7XG4gICAgICAgICAgICAgICAgY291bnQgLT0gc3RlcCArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb3VudCA9IHN0ZXA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpcnN0ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlyc3QgPT09IGFycmF5Lmxlbmd0aCB8fCBhcnJheVtmaXJzdF0uRnJhbWUgPiB0bykge1xuICAgICAgICAgICAgaWYgKGFycmF5W2ZpcnN0IC0gMV0uRnJhbWUgPj0gZnJvbSkge1xuICAgICAgICAgICAgICAgIGZpbmRLZXlmcmFtZXNSZXMuZnJhbWUgPSBmcmFtZTtcbiAgICAgICAgICAgICAgICBmaW5kS2V5ZnJhbWVzUmVzLmxlZnQgPSBhcnJheVtmaXJzdCAtIDFdO1xuICAgICAgICAgICAgICAgIGZpbmRLZXlmcmFtZXNSZXMucmlnaHQgPSBhcnJheVtmaXJzdCAtIDFdO1xuICAgICAgICAgICAgICAgIHJldHVybiBmaW5kS2V5ZnJhbWVzUmVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFycmF5W2ZpcnN0IC0gMV0uRnJhbWUgPCBmcm9tKSB7XG4gICAgICAgICAgICBpZiAoYXJyYXlbZmlyc3RdLkZyYW1lIDw9IHRvKSB7XG4gICAgICAgICAgICAgICAgZmluZEtleWZyYW1lc1Jlcy5mcmFtZSA9IGZyYW1lO1xuICAgICAgICAgICAgICAgIGZpbmRLZXlmcmFtZXNSZXMubGVmdCA9IGFycmF5W2ZpcnN0XTtcbiAgICAgICAgICAgICAgICBmaW5kS2V5ZnJhbWVzUmVzLnJpZ2h0ID0gYXJyYXlbZmlyc3RdO1xuICAgICAgICAgICAgICAgIHJldHVybiBmaW5kS2V5ZnJhbWVzUmVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZmluZEtleWZyYW1lc1Jlcy5mcmFtZSA9IGZyYW1lO1xuICAgICAgICBmaW5kS2V5ZnJhbWVzUmVzLmxlZnQgPSBhcnJheVtmaXJzdCAtIDFdO1xuICAgICAgICBmaW5kS2V5ZnJhbWVzUmVzLnJpZ2h0ID0gYXJyYXlbZmlyc3RdO1xuICAgICAgICByZXR1cm4gZmluZEtleWZyYW1lc1JlcztcbiAgICB9O1xuICAgIE1vZGVsSW50ZXJwLnByb3RvdHlwZS5maW5kTG9jYWxGcmFtZSA9IGZ1bmN0aW9uIChhbmltVmVjdG9yKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYW5pbVZlY3Rvci5HbG9iYWxTZXFJZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGZpbmRMb2NhbEZyYW1lUmVzLmZyYW1lID0gdGhpcy5yZW5kZXJlckRhdGEuZ2xvYmFsU2VxdWVuY2VzRnJhbWVzW2FuaW1WZWN0b3IuR2xvYmFsU2VxSWRdO1xuICAgICAgICAgICAgZmluZExvY2FsRnJhbWVSZXMuZnJvbSA9IDA7XG4gICAgICAgICAgICBmaW5kTG9jYWxGcmFtZVJlcy50byA9IHRoaXMucmVuZGVyZXJEYXRhLm1vZGVsLkdsb2JhbFNlcXVlbmNlc1thbmltVmVjdG9yLkdsb2JhbFNlcUlkXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZpbmRMb2NhbEZyYW1lUmVzLmZyYW1lID0gdGhpcy5yZW5kZXJlckRhdGEuZnJhbWU7XG4gICAgICAgICAgICBmaW5kTG9jYWxGcmFtZVJlcy5mcm9tID0gdGhpcy5yZW5kZXJlckRhdGEuYW5pbWF0aW9uSW5mby5JbnRlcnZhbFswXTtcbiAgICAgICAgICAgIGZpbmRMb2NhbEZyYW1lUmVzLnRvID0gdGhpcy5yZW5kZXJlckRhdGEuYW5pbWF0aW9uSW5mby5JbnRlcnZhbFsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmluZExvY2FsRnJhbWVSZXM7XG4gICAgfTtcbiAgICByZXR1cm4gTW9kZWxJbnRlcnA7XG59KCkpO1xuZXhwb3J0cy5Nb2RlbEludGVycCA9IE1vZGVsSW50ZXJwO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kZWxJbnRlcnAuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbW9kZWxfMSA9IHJlcXVpcmUoXCIuLi9tb2RlbFwiKTtcbnZhciBnbF9tYXRyaXhfMSA9IHJlcXVpcmUoXCJnbC1tYXRyaXhcIik7XG52YXIgdXRpbF8xID0gcmVxdWlyZShcIi4vdXRpbFwiKTtcbnZhciBtb2RlbEludGVycF8xID0gcmVxdWlyZShcIi4vbW9kZWxJbnRlcnBcIik7XG52YXIgcGFydGljbGVzXzEgPSByZXF1aXJlKFwiLi9wYXJ0aWNsZXNcIik7XG52YXIgcmliYm9uc18xID0gcmVxdWlyZShcIi4vcmliYm9uc1wiKTtcbnZhciBNQVhfTk9ERVMgPSAxMjg7XG52YXIgZ2w7XG52YXIgc2hhZGVyUHJvZ3JhbTtcbnZhciBzaGFkZXJQcm9ncmFtTG9jYXRpb25zID0ge307XG52YXIgYW5pc290cm9waWNFeHQ7XG52YXIgdmVydGV4U2hhZGVySGFyZHdhcmVTa2lubmluZyA9IFwiXFxuICAgIGF0dHJpYnV0ZSB2ZWMzIGFWZXJ0ZXhQb3NpdGlvbjtcXG4gICAgYXR0cmlidXRlIHZlYzIgYVRleHR1cmVDb29yZDtcXG4gICAgYXR0cmlidXRlIHZlYzQgYUdyb3VwO1xcblxcbiAgICB1bmlmb3JtIG1hdDQgdU1WTWF0cml4O1xcbiAgICB1bmlmb3JtIG1hdDQgdVBNYXRyaXg7XFxuICAgIHVuaWZvcm0gbWF0NCB1Tm9kZXNNYXRyaWNlc1tcIiArIE1BWF9OT0RFUyArIFwiXTtcXG5cXG4gICAgdmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XFxuXFxuICAgIHZvaWQgbWFpbih2b2lkKSB7XFxuICAgICAgICB2ZWM0IHBvc2l0aW9uID0gdmVjNChhVmVydGV4UG9zaXRpb24sIDEuMCk7XFxuICAgICAgICBpbnQgY291bnQgPSAxO1xcbiAgICAgICAgdmVjNCBzdW0gPSB1Tm9kZXNNYXRyaWNlc1tpbnQoYUdyb3VwWzBdKV0gKiBwb3NpdGlvbjtcXG5cXG4gICAgICAgIGlmIChhR3JvdXBbMV0gPCBcIiArIE1BWF9OT0RFUyArIFwiLikge1xcbiAgICAgICAgICAgIHN1bSArPSB1Tm9kZXNNYXRyaWNlc1tpbnQoYUdyb3VwWzFdKV0gKiBwb3NpdGlvbjtcXG4gICAgICAgICAgICBjb3VudCArPSAxO1xcbiAgICAgICAgfVxcbiAgICAgICAgaWYgKGFHcm91cFsyXSA8IFwiICsgTUFYX05PREVTICsgXCIuKSB7XFxuICAgICAgICAgICAgc3VtICs9IHVOb2Rlc01hdHJpY2VzW2ludChhR3JvdXBbMl0pXSAqIHBvc2l0aW9uO1xcbiAgICAgICAgICAgIGNvdW50ICs9IDE7XFxuICAgICAgICB9XFxuICAgICAgICBpZiAoYUdyb3VwWzNdIDwgXCIgKyBNQVhfTk9ERVMgKyBcIi4pIHtcXG4gICAgICAgICAgICBzdW0gKz0gdU5vZGVzTWF0cmljZXNbaW50KGFHcm91cFszXSldICogcG9zaXRpb247XFxuICAgICAgICAgICAgY291bnQgKz0gMTtcXG4gICAgICAgIH1cXG4gICAgICAgIHN1bS54eXogLz0gZmxvYXQoY291bnQpO1xcbiAgICAgICAgc3VtLncgPSAxLjtcXG4gICAgICAgIHBvc2l0aW9uID0gc3VtO1xcblxcbiAgICAgICAgZ2xfUG9zaXRpb24gPSB1UE1hdHJpeCAqIHVNVk1hdHJpeCAqIHBvc2l0aW9uO1xcbiAgICAgICAgdlRleHR1cmVDb29yZCA9IGFUZXh0dXJlQ29vcmQ7XFxuICAgIH1cXG5cIjtcbnZhciB2ZXJ0ZXhTaGFkZXJTb2Z0d2FyZVNraW5uaW5nID0gXCJcXG4gICAgYXR0cmlidXRlIHZlYzMgYVZlcnRleFBvc2l0aW9uO1xcbiAgICBhdHRyaWJ1dGUgdmVjMiBhVGV4dHVyZUNvb3JkO1xcblxcbiAgICB1bmlmb3JtIG1hdDQgdU1WTWF0cml4O1xcbiAgICB1bmlmb3JtIG1hdDQgdVBNYXRyaXg7XFxuXFxuICAgIHZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1xcblxcbiAgICB2b2lkIG1haW4odm9pZCkge1xcbiAgICAgICAgdmVjNCBwb3NpdGlvbiA9IHZlYzQoYVZlcnRleFBvc2l0aW9uLCAxLjApO1xcbiAgICAgICAgZ2xfUG9zaXRpb24gPSB1UE1hdHJpeCAqIHVNVk1hdHJpeCAqIHBvc2l0aW9uO1xcbiAgICAgICAgdlRleHR1cmVDb29yZCA9IGFUZXh0dXJlQ29vcmQ7XFxuICAgIH1cXG5cIjtcbnZhciBmcmFnbWVudFNoYWRlciA9IFwiXFxuICAgIHByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1xcblxcbiAgICB2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcXG5cXG4gICAgdW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XFxuICAgIHVuaWZvcm0gdmVjMyB1UmVwbGFjZWFibGVDb2xvcjtcXG4gICAgdW5pZm9ybSBmbG9hdCB1UmVwbGFjZWFibGVUeXBlO1xcbiAgICB1bmlmb3JtIGZsb2F0IHVEaXNjYXJkQWxwaGFMZXZlbDtcXG4gICAgdW5pZm9ybSBtYXQzIHVUVmV4dGV4QW5pbTtcXG5cXG4gICAgZmxvYXQgaHlwb3QgKHZlYzIgeikge1xcbiAgICAgICAgZmxvYXQgdDtcXG4gICAgICAgIGZsb2F0IHggPSBhYnMoei54KTtcXG4gICAgICAgIGZsb2F0IHkgPSBhYnMoei55KTtcXG4gICAgICAgIHQgPSBtaW4oeCwgeSk7XFxuICAgICAgICB4ID0gbWF4KHgsIHkpO1xcbiAgICAgICAgdCA9IHQgLyB4O1xcbiAgICAgICAgcmV0dXJuICh6LnggPT0gMC4wICYmIHoueSA9PSAwLjApID8gMC4wIDogeCAqIHNxcnQoMS4wICsgdCAqIHQpO1xcbiAgICB9XFxuXFxuICAgIHZvaWQgbWFpbih2b2lkKSB7XFxuICAgICAgICB2ZWMyIHRleENvb3JkID0gKHVUVmV4dGV4QW5pbSAqIHZlYzModlRleHR1cmVDb29yZC5zLCB2VGV4dHVyZUNvb3JkLnQsIDEuKSkuc3Q7XFxuXFxuICAgICAgICBpZiAodVJlcGxhY2VhYmxlVHlwZSA9PSAwLikge1xcbiAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1U2FtcGxlciwgdGV4Q29vcmQpO1xcbiAgICAgICAgfSBlbHNlIGlmICh1UmVwbGFjZWFibGVUeXBlID09IDEuKSB7XFxuICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCh1UmVwbGFjZWFibGVDb2xvciwgMS4wKTtcXG4gICAgICAgIH0gZWxzZSBpZiAodVJlcGxhY2VhYmxlVHlwZSA9PSAyLikge1xcbiAgICAgICAgICAgIGZsb2F0IGRpc3QgPSBoeXBvdCh0ZXhDb29yZCAtIHZlYzIoMC41LCAwLjUpKSAqIDIuO1xcbiAgICAgICAgICAgIGZsb2F0IHRydW5jYXRlRGlzdCA9IGNsYW1wKDEuIC0gZGlzdCAqIDEuNCwgMC4sIDEuKTtcXG4gICAgICAgICAgICBmbG9hdCBhbHBoYSA9IHNpbih0cnVuY2F0ZURpc3QpO1xcbiAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQodVJlcGxhY2VhYmxlQ29sb3IgKiBhbHBoYSwgMS4wKTtcXG4gICAgICAgIH1cXG5cXG4gICAgICAgIC8vIGhhbmQtbWFkZSBhbHBoYS10ZXN0XFxuICAgICAgICBpZiAoZ2xfRnJhZ0NvbG9yWzNdIDwgdURpc2NhcmRBbHBoYUxldmVsKSB7XFxuICAgICAgICAgICAgZGlzY2FyZDtcXG4gICAgICAgIH1cXG4gICAgfVxcblwiO1xudmFyIHRyYW5zbGF0aW9uID0gZ2xfbWF0cml4XzEudmVjMy5jcmVhdGUoKTtcbnZhciByb3RhdGlvbiA9IGdsX21hdHJpeF8xLnF1YXQuY3JlYXRlKCk7XG52YXIgc2NhbGluZyA9IGdsX21hdHJpeF8xLnZlYzMuY3JlYXRlKCk7XG52YXIgZGVmYXVsdFRyYW5zbGF0aW9uID0gZ2xfbWF0cml4XzEudmVjMy5mcm9tVmFsdWVzKDAsIDAsIDApO1xudmFyIGRlZmF1bHRSb3RhdGlvbiA9IGdsX21hdHJpeF8xLnF1YXQuZnJvbVZhbHVlcygwLCAwLCAwLCAxKTtcbnZhciBkZWZhdWx0U2NhbGluZyA9IGdsX21hdHJpeF8xLnZlYzMuZnJvbVZhbHVlcygxLCAxLCAxKTtcbnZhciB0ZW1wUGFyZW50Um90YXRpb25RdWF0ID0gZ2xfbWF0cml4XzEucXVhdC5jcmVhdGUoKTtcbnZhciB0ZW1wUGFyZW50Um90YXRpb25NYXQgPSBnbF9tYXRyaXhfMS5tYXQ0LmNyZWF0ZSgpO1xudmFyIHRlbXBDYW1lcmFNYXQgPSBnbF9tYXRyaXhfMS5tYXQ0LmNyZWF0ZSgpO1xudmFyIHRlbXBUcmFuc2Zvcm1lZFBpdm90UG9pbnQgPSBnbF9tYXRyaXhfMS52ZWMzLmNyZWF0ZSgpO1xudmFyIHRlbXBBeGlzID0gZ2xfbWF0cml4XzEudmVjMy5jcmVhdGUoKTtcbnZhciB0ZW1wTG9ja1F1YXQgPSBnbF9tYXRyaXhfMS5xdWF0LmNyZWF0ZSgpO1xudmFyIHRlbXBMb2NrTWF0ID0gZ2xfbWF0cml4XzEubWF0NC5jcmVhdGUoKTtcbnZhciB0ZW1wWEF4aXMgPSBnbF9tYXRyaXhfMS52ZWMzLmNyZWF0ZSgpO1xudmFyIHRlbXBDYW1lcmFWZWMgPSBnbF9tYXRyaXhfMS52ZWMzLmNyZWF0ZSgpO1xudmFyIHRlbXBDcm9zczAgPSBnbF9tYXRyaXhfMS52ZWMzLmNyZWF0ZSgpO1xudmFyIHRlbXBDcm9zczEgPSBnbF9tYXRyaXhfMS52ZWMzLmNyZWF0ZSgpO1xudmFyIHRlbXBQb3MgPSBnbF9tYXRyaXhfMS52ZWMzLmNyZWF0ZSgpO1xudmFyIHRlbXBTdW0gPSBnbF9tYXRyaXhfMS52ZWMzLmNyZWF0ZSgpO1xudmFyIHRlbXBWZWMzID0gZ2xfbWF0cml4XzEudmVjMy5jcmVhdGUoKTtcbnZhciBpZGVudGlmeU1hdDMgPSBnbF9tYXRyaXhfMS5tYXQzLmNyZWF0ZSgpO1xudmFyIHRleENvb3JkTWF0NCA9IGdsX21hdHJpeF8xLm1hdDQuY3JlYXRlKCk7XG52YXIgdGV4Q29vcmRNYXQzID0gZ2xfbWF0cml4XzEubWF0My5jcmVhdGUoKTtcbnZhciBNb2RlbFJlbmRlcmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2RlbFJlbmRlcmVyKG1vZGVsKSB7XG4gICAgICAgIHRoaXMudmVydGV4QnVmZmVyID0gW107XG4gICAgICAgIHRoaXMudmVydGljZXMgPSBbXTsgLy8gQXJyYXkgcGVyIGdlb3NldCBmb3Igc29mdHdhcmUgc2tpbm5pbmdcbiAgICAgICAgdGhpcy50ZXhDb29yZEJ1ZmZlciA9IFtdO1xuICAgICAgICB0aGlzLmluZGV4QnVmZmVyID0gW107XG4gICAgICAgIHRoaXMuZ3JvdXBCdWZmZXIgPSBbXTtcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICB0aGlzLnJlbmRlcmVyRGF0YSA9IHtcbiAgICAgICAgICAgIG1vZGVsOiBtb2RlbCxcbiAgICAgICAgICAgIGZyYW1lOiAwLFxuICAgICAgICAgICAgYW5pbWF0aW9uOiBudWxsLFxuICAgICAgICAgICAgYW5pbWF0aW9uSW5mbzogbnVsbCxcbiAgICAgICAgICAgIGdsb2JhbFNlcXVlbmNlc0ZyYW1lczogW10sXG4gICAgICAgICAgICByb290Tm9kZTogbnVsbCxcbiAgICAgICAgICAgIG5vZGVzOiBbXSxcbiAgICAgICAgICAgIGdlb3NldEFuaW1zOiBbXSxcbiAgICAgICAgICAgIGdlb3NldEFscGhhOiBbXSxcbiAgICAgICAgICAgIG1hdGVyaWFsTGF5ZXJUZXh0dXJlSUQ6IFtdLFxuICAgICAgICAgICAgdGVhbUNvbG9yOiBudWxsLFxuICAgICAgICAgICAgY2FtZXJhUG9zOiBudWxsLFxuICAgICAgICAgICAgY2FtZXJhUXVhdDogbnVsbCxcbiAgICAgICAgICAgIHRleHR1cmVzOiB7fVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnJlbmRlcmVyRGF0YS50ZWFtQ29sb3IgPSBnbF9tYXRyaXhfMS52ZWMzLmZyb21WYWx1ZXMoMS4sIDAuLCAwLik7XG4gICAgICAgIHRoaXMucmVuZGVyZXJEYXRhLmNhbWVyYVBvcyA9IGdsX21hdHJpeF8xLnZlYzMuY3JlYXRlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyZXJEYXRhLmNhbWVyYVF1YXQgPSBnbF9tYXRyaXhfMS5xdWF0LmNyZWF0ZSgpO1xuICAgICAgICB0aGlzLnNldFNlcXVlbmNlKDApO1xuICAgICAgICB0aGlzLnJlbmRlcmVyRGF0YS5yb290Tm9kZSA9IHtcbiAgICAgICAgICAgIC8vIHRvZG9cbiAgICAgICAgICAgIG5vZGU6IHt9LFxuICAgICAgICAgICAgbWF0cml4OiBnbF9tYXRyaXhfMS5tYXQ0LmNyZWF0ZSgpLFxuICAgICAgICAgICAgY2hpbGRzOiBbXVxuICAgICAgICB9O1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gbW9kZWwuTm9kZXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IF9hW19pXTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXJEYXRhLm5vZGVzW25vZGUuT2JqZWN0SWRdID0ge1xuICAgICAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICAgICAgbWF0cml4OiBnbF9tYXRyaXhfMS5tYXQ0LmNyZWF0ZSgpLFxuICAgICAgICAgICAgICAgIGNoaWxkczogW11cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgX2IgPSAwLCBfYyA9IG1vZGVsLk5vZGVzOyBfYiA8IF9jLmxlbmd0aDsgX2IrKykge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBfY1tfYl07XG4gICAgICAgICAgICBpZiAoIW5vZGUuUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlckRhdGEucm9vdE5vZGUuY2hpbGRzLnB1c2godGhpcy5yZW5kZXJlckRhdGEubm9kZXNbbm9kZS5PYmplY3RJZF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlckRhdGEubm9kZXNbbm9kZS5QYXJlbnRdLmNoaWxkcy5wdXNoKHRoaXMucmVuZGVyZXJEYXRhLm5vZGVzW25vZGUuT2JqZWN0SWRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobW9kZWwuR2xvYmFsU2VxdWVuY2VzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vZGVsLkdsb2JhbFNlcXVlbmNlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXJEYXRhLmdsb2JhbFNlcXVlbmNlc0ZyYW1lc1tpXSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb2RlbC5HZW9zZXRBbmltcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlckRhdGEuZ2Vvc2V0QW5pbXNbbW9kZWwuR2Vvc2V0QW5pbXNbaV0uR2Vvc2V0SWRdID0gbW9kZWwuR2Vvc2V0QW5pbXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb2RlbC5NYXRlcmlhbHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXJEYXRhLm1hdGVyaWFsTGF5ZXJUZXh0dXJlSURbaV0gPSBuZXcgQXJyYXkobW9kZWwuTWF0ZXJpYWxzW2ldLkxheWVycy5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW50ZXJwID0gbmV3IG1vZGVsSW50ZXJwXzEuTW9kZWxJbnRlcnAodGhpcy5yZW5kZXJlckRhdGEpO1xuICAgICAgICB0aGlzLnBhcnRpY2xlc0NvbnRyb2xsZXIgPSBuZXcgcGFydGljbGVzXzEuUGFydGljbGVzQ29udHJvbGxlcih0aGlzLmludGVycCwgdGhpcy5yZW5kZXJlckRhdGEpO1xuICAgICAgICB0aGlzLnJpYmJvbnNDb250cm9sbGVyID0gbmV3IHJpYmJvbnNfMS5SaWJib25zQ29udHJvbGxlcih0aGlzLmludGVycCwgdGhpcy5yZW5kZXJlckRhdGEpO1xuICAgIH1cbiAgICBNb2RlbFJlbmRlcmVyLnByb3RvdHlwZS5pbml0R0wgPSBmdW5jdGlvbiAoZ2xDb250ZXh0KSB7XG4gICAgICAgIGdsID0gZ2xDb250ZXh0O1xuICAgICAgICAvLyBNYXggYm9uZXMgKyBNViArIFBcbiAgICAgICAgdGhpcy5zb2Z0d2FyZVNraW5uaW5nID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLk1BWF9WRVJURVhfVU5JRk9STV9WRUNUT1JTKSA8IDQgKiAoTUFYX05PREVTICsgMik7XG4gICAgICAgIGFuaXNvdHJvcGljRXh0ID0gKGdsLmdldEV4dGVuc2lvbignRVhUX3RleHR1cmVfZmlsdGVyX2FuaXNvdHJvcGljJykgfHxcbiAgICAgICAgICAgIGdsLmdldEV4dGVuc2lvbignTU9aX0VYVF90ZXh0dXJlX2ZpbHRlcl9hbmlzb3Ryb3BpYycpIHx8XG4gICAgICAgICAgICBnbC5nZXRFeHRlbnNpb24oJ1dFQktJVF9FWFRfdGV4dHVyZV9maWx0ZXJfYW5pc290cm9waWMnKSk7XG4gICAgICAgIHRoaXMuaW5pdFNoYWRlcnMoKTtcbiAgICAgICAgdGhpcy5pbml0QnVmZmVycygpO1xuICAgICAgICBwYXJ0aWNsZXNfMS5QYXJ0aWNsZXNDb250cm9sbGVyLmluaXRHTChnbENvbnRleHQpO1xuICAgICAgICByaWJib25zXzEuUmliYm9uc0NvbnRyb2xsZXIuaW5pdEdMKGdsQ29udGV4dCk7XG4gICAgfTtcbiAgICBNb2RlbFJlbmRlcmVyLnByb3RvdHlwZS5zZXRUZXh0dXJlID0gZnVuY3Rpb24gKHBhdGgsIGltZywgZmxhZ3MpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlckRhdGEudGV4dHVyZXNbcGF0aF0gPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMucmVuZGVyZXJEYXRhLnRleHR1cmVzW3BhdGhdKTtcbiAgICAgICAgLy8gZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdHJ1ZSk7XG4gICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1nKTtcbiAgICAgICAgaWYgKGZsYWdzICYgbW9kZWxfMS5UZXh0dXJlRmxhZ3MuV3JhcFdpZHRoKSB7XG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5SRVBFQVQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZsYWdzICYgbW9kZWxfMS5UZXh0dXJlRmxhZ3MuV3JhcEhlaWdodCkge1xuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuUkVQRUFUKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgICAgICB9XG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSX01JUE1BUF9ORUFSRVNUKTtcbiAgICAgICAgaWYgKGFuaXNvdHJvcGljRXh0KSB7XG4gICAgICAgICAgICB2YXIgbWF4ID0gZ2wuZ2V0UGFyYW1ldGVyKGFuaXNvdHJvcGljRXh0Lk1BWF9URVhUVVJFX01BWF9BTklTT1RST1BZX0VYVCk7XG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJmKGdsLlRFWFRVUkVfMkQsIGFuaXNvdHJvcGljRXh0LlRFWFRVUkVfTUFYX0FOSVNPVFJPUFlfRVhULCBtYXgpO1xuICAgICAgICB9XG4gICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcbiAgICB9O1xuICAgIE1vZGVsUmVuZGVyZXIucHJvdG90eXBlLnNldENhbWVyYSA9IGZ1bmN0aW9uIChjYW1lcmFQb3MsIGNhbWVyYVF1YXQpIHtcbiAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5jb3B5KHRoaXMucmVuZGVyZXJEYXRhLmNhbWVyYVBvcywgY2FtZXJhUG9zKTtcbiAgICAgICAgZ2xfbWF0cml4XzEucXVhdC5jb3B5KHRoaXMucmVuZGVyZXJEYXRhLmNhbWVyYVF1YXQsIGNhbWVyYVF1YXQpO1xuICAgIH07XG4gICAgTW9kZWxSZW5kZXJlci5wcm90b3R5cGUuc2V0U2VxdWVuY2UgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlckRhdGEuYW5pbWF0aW9uID0gaW5kZXg7XG4gICAgICAgIHRoaXMucmVuZGVyZXJEYXRhLmFuaW1hdGlvbkluZm8gPSB0aGlzLm1vZGVsLlNlcXVlbmNlc1t0aGlzLnJlbmRlcmVyRGF0YS5hbmltYXRpb25dO1xuICAgICAgICB0aGlzLnJlbmRlcmVyRGF0YS5mcmFtZSA9IHRoaXMucmVuZGVyZXJEYXRhLmFuaW1hdGlvbkluZm8uSW50ZXJ2YWxbMF07XG4gICAgfTtcbiAgICBNb2RlbFJlbmRlcmVyLnByb3RvdHlwZS5zZXRUZWFtQ29sb3IgPSBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5jb3B5KHRoaXMucmVuZGVyZXJEYXRhLnRlYW1Db2xvciwgY29sb3IpO1xuICAgIH07XG4gICAgTW9kZWxSZW5kZXJlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXJEYXRhLmZyYW1lICs9IGRlbHRhO1xuICAgICAgICBpZiAodGhpcy5yZW5kZXJlckRhdGEuZnJhbWUgPiB0aGlzLnJlbmRlcmVyRGF0YS5hbmltYXRpb25JbmZvLkludGVydmFsWzFdKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyRGF0YS5mcmFtZSA9IHRoaXMucmVuZGVyZXJEYXRhLmFuaW1hdGlvbkluZm8uSW50ZXJ2YWxbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVHbG9iYWxTZXF1ZW5jZXMoZGVsdGEpO1xuICAgICAgICB0aGlzLnVwZGF0ZU5vZGUodGhpcy5yZW5kZXJlckRhdGEucm9vdE5vZGUpO1xuICAgICAgICB0aGlzLnBhcnRpY2xlc0NvbnRyb2xsZXIudXBkYXRlKGRlbHRhKTtcbiAgICAgICAgdGhpcy5yaWJib25zQ29udHJvbGxlci51cGRhdGUoZGVsdGEpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubW9kZWwuR2Vvc2V0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlckRhdGEuZ2Vvc2V0QWxwaGFbaV0gPSB0aGlzLmZpbmRBbHBoYShpKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucmVuZGVyZXJEYXRhLm1hdGVyaWFsTGF5ZXJUZXh0dXJlSUQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5yZW5kZXJlckRhdGEubWF0ZXJpYWxMYXllclRleHR1cmVJRFtpXS5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5ZXJUZXh0dXJlSWQoaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1vZGVsUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChtdk1hdHJpeCwgcE1hdHJpeCkge1xuICAgICAgICBnbC51c2VQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xuICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMucE1hdHJpeFVuaWZvcm0sIGZhbHNlLCBwTWF0cml4KTtcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDRmdihzaGFkZXJQcm9ncmFtTG9jYXRpb25zLm12TWF0cml4VW5pZm9ybSwgZmFsc2UsIG12TWF0cml4KTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSk7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMudGV4dHVyZUNvb3JkQXR0cmlidXRlKTtcbiAgICAgICAgaWYgKCF0aGlzLnNvZnR3YXJlU2tpbm5pbmcpIHtcbiAgICAgICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMuZ3JvdXBBdHRyaWJ1dGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5zb2Z0d2FyZVNraW5uaW5nKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IE1BWF9OT0RFUzsgKytqKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVuZGVyZXJEYXRhLm5vZGVzW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5ub2Rlc01hdHJpY2VzQXR0cmlidXRlc1tqXSwgZmFsc2UsIHRoaXMucmVuZGVyZXJEYXRhLm5vZGVzW2pdLm1hdHJpeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tb2RlbC5HZW9zZXRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5yZW5kZXJlckRhdGEuZ2Vvc2V0QWxwaGFbaV0gPCAxZS02KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5zb2Z0d2FyZVNraW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUdlb3NldFZlcnRpY2VzKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1hdGVyaWFsSUQgPSB0aGlzLm1vZGVsLkdlb3NldHNbaV0uTWF0ZXJpYWxJRDtcbiAgICAgICAgICAgIHZhciBtYXRlcmlhbCA9IHRoaXMubW9kZWwuTWF0ZXJpYWxzW21hdGVyaWFsSURdO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBtYXRlcmlhbC5MYXllcnMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldExheWVyUHJvcHMobWF0ZXJpYWwuTGF5ZXJzW2pdLCB0aGlzLnJlbmRlcmVyRGF0YS5tYXRlcmlhbExheWVyVGV4dHVyZUlEW21hdGVyaWFsSURdW2pdKTtcbiAgICAgICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXJbaV0pO1xuICAgICAgICAgICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSwgMywgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy50ZXhDb29yZEJ1ZmZlcltpXSk7XG4gICAgICAgICAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnRleHR1cmVDb29yZEF0dHJpYnV0ZSwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuc29mdHdhcmVTa2lubmluZykge1xuICAgICAgICAgICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5ncm91cEJ1ZmZlcltpXSk7XG4gICAgICAgICAgICAgICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5ncm91cEF0dHJpYnV0ZSwgNCwgZ2wuVU5TSUdORURfQllURSwgZmFsc2UsIDAsIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyW2ldKTtcbiAgICAgICAgICAgICAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCB0aGlzLm1vZGVsLkdlb3NldHNbaV0uRmFjZXMubGVuZ3RoLCBnbC5VTlNJR05FRF9TSE9SVCwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMudmVydGV4UG9zaXRpb25BdHRyaWJ1dGUpO1xuICAgICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUpO1xuICAgICAgICBpZiAoIXRoaXMuc29mdHdhcmVTa2lubmluZykge1xuICAgICAgICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMuZ3JvdXBBdHRyaWJ1dGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGFydGljbGVzQ29udHJvbGxlci5yZW5kZXIobXZNYXRyaXgsIHBNYXRyaXgpO1xuICAgICAgICB0aGlzLnJpYmJvbnNDb250cm9sbGVyLnJlbmRlcihtdk1hdHJpeCwgcE1hdHJpeCk7XG4gICAgfTtcbiAgICBNb2RlbFJlbmRlcmVyLnByb3RvdHlwZS5nZW5lcmF0ZUdlb3NldFZlcnRpY2VzID0gZnVuY3Rpb24gKGdlb3NldEluZGV4KSB7XG4gICAgICAgIHZhciBnZW9zZXQgPSB0aGlzLm1vZGVsLkdlb3NldHNbZ2Vvc2V0SW5kZXhdO1xuICAgICAgICB2YXIgYnVmZmVyID0gdGhpcy52ZXJ0aWNlc1tnZW9zZXRJbmRleF07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnVmZmVyLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBpIC8gMztcbiAgICAgICAgICAgIHZhciBncm91cCA9IGdlb3NldC5Hcm91cHNbZ2Vvc2V0LlZlcnRleEdyb3VwW2luZGV4XV07XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLnNldCh0ZW1wUG9zLCBnZW9zZXQuVmVydGljZXNbaV0sIGdlb3NldC5WZXJ0aWNlc1tpICsgMV0sIGdlb3NldC5WZXJ0aWNlc1tpICsgMl0pO1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5zZXQodGVtcFN1bSwgMCwgMCwgMCk7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGdyb3VwLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5hZGQodGVtcFN1bSwgdGVtcFN1bSwgZ2xfbWF0cml4XzEudmVjMy50cmFuc2Zvcm1NYXQ0KHRlbXBWZWMzLCB0ZW1wUG9zLCB0aGlzLnJlbmRlcmVyRGF0YS5ub2Rlc1tncm91cFtqXV0ubWF0cml4KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLnNjYWxlKHRlbXBQb3MsIHRlbXBTdW0sIDEgLyBncm91cC5sZW5ndGgpO1xuICAgICAgICAgICAgYnVmZmVyW2ldID0gdGVtcFBvc1swXTtcbiAgICAgICAgICAgIGJ1ZmZlcltpICsgMV0gPSB0ZW1wUG9zWzFdO1xuICAgICAgICAgICAgYnVmZmVyW2kgKyAyXSA9IHRlbXBQb3NbMl07XG4gICAgICAgIH1cbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyW2dlb3NldEluZGV4XSk7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIsIGdsLkRZTkFNSUNfRFJBVyk7XG4gICAgfTtcbiAgICBNb2RlbFJlbmRlcmVyLnByb3RvdHlwZS51cGRhdGVMYXllclRleHR1cmVJZCA9IGZ1bmN0aW9uIChtYXRlcmlhbElkLCBsYXllcklkKSB7XG4gICAgICAgIHZhciBUZXh0dXJlSUQgPSB0aGlzLm1vZGVsLk1hdGVyaWFsc1ttYXRlcmlhbElkXS5MYXllcnNbbGF5ZXJJZF0uVGV4dHVyZUlEO1xuICAgICAgICBpZiAodHlwZW9mIFRleHR1cmVJRCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXJEYXRhLm1hdGVyaWFsTGF5ZXJUZXh0dXJlSURbbWF0ZXJpYWxJZF1bbGF5ZXJJZF0gPSBUZXh0dXJlSUQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyRGF0YS5tYXRlcmlhbExheWVyVGV4dHVyZUlEW21hdGVyaWFsSWRdW2xheWVySWRdID0gdGhpcy5pbnRlcnAubnVtKFRleHR1cmVJRCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1vZGVsUmVuZGVyZXIucHJvdG90eXBlLmluaXRTaGFkZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2hhZGVyUHJvZ3JhbSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB2ZXJ0ZXggPSB1dGlsXzEuZ2V0U2hhZGVyKGdsLCB0aGlzLnNvZnR3YXJlU2tpbm5pbmcgPyB2ZXJ0ZXhTaGFkZXJTb2Z0d2FyZVNraW5uaW5nIDogdmVydGV4U2hhZGVySGFyZHdhcmVTa2lubmluZywgZ2wuVkVSVEVYX1NIQURFUik7XG4gICAgICAgIHZhciBmcmFnbWVudCA9IHV0aWxfMS5nZXRTaGFkZXIoZ2wsIGZyYWdtZW50U2hhZGVyLCBnbC5GUkFHTUVOVF9TSEFERVIpO1xuICAgICAgICBzaGFkZXJQcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgICAgICBnbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgdmVydGV4KTtcbiAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHNoYWRlclByb2dyYW0sIGZyYWdtZW50KTtcbiAgICAgICAgZ2wubGlua1Byb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XG4gICAgICAgIGlmICghZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihzaGFkZXJQcm9ncmFtLCBnbC5MSU5LX1NUQVRVUykpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdDb3VsZCBub3QgaW5pdGlhbGlzZSBzaGFkZXJzJyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2wudXNlUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sICdhVmVydGV4UG9zaXRpb24nKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAnYVRleHR1cmVDb29yZCcpO1xuICAgICAgICBpZiAoIXRoaXMuc29mdHdhcmVTa2lubmluZykge1xuICAgICAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5ncm91cEF0dHJpYnV0ZSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sICdhR3JvdXAnKTtcbiAgICAgICAgfVxuICAgICAgICBzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnBNYXRyaXhVbmlmb3JtID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sICd1UE1hdHJpeCcpO1xuICAgICAgICBzaGFkZXJQcm9ncmFtTG9jYXRpb25zLm12TWF0cml4VW5pZm9ybSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAndU1WTWF0cml4Jyk7XG4gICAgICAgIHNoYWRlclByb2dyYW1Mb2NhdGlvbnMuc2FtcGxlclVuaWZvcm0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ3VTYW1wbGVyJyk7XG4gICAgICAgIHNoYWRlclByb2dyYW1Mb2NhdGlvbnMucmVwbGFjZWFibGVDb2xvclVuaWZvcm0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ3VSZXBsYWNlYWJsZUNvbG9yJyk7XG4gICAgICAgIHNoYWRlclByb2dyYW1Mb2NhdGlvbnMucmVwbGFjZWFibGVUeXBlVW5pZm9ybSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAndVJlcGxhY2VhYmxlVHlwZScpO1xuICAgICAgICBzaGFkZXJQcm9ncmFtTG9jYXRpb25zLmRpc2NhcmRBbHBoYUxldmVsVW5pZm9ybSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAndURpc2NhcmRBbHBoYUxldmVsJyk7XG4gICAgICAgIHNoYWRlclByb2dyYW1Mb2NhdGlvbnMudFZlcnRleEFuaW1Vbmlmb3JtID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sICd1VFZleHRleEFuaW0nKTtcbiAgICAgICAgaWYgKCF0aGlzLnNvZnR3YXJlU2tpbm5pbmcpIHtcbiAgICAgICAgICAgIHNoYWRlclByb2dyYW1Mb2NhdGlvbnMubm9kZXNNYXRyaWNlc0F0dHJpYnV0ZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTUFYX05PREVTOyArK2kpIHtcbiAgICAgICAgICAgICAgICBzaGFkZXJQcm9ncmFtTG9jYXRpb25zLm5vZGVzTWF0cmljZXNBdHRyaWJ1dGVzW2ldID1cbiAgICAgICAgICAgICAgICAgICAgZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidU5vZGVzTWF0cmljZXNbXCIgKyBpICsgXCJdXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBNb2RlbFJlbmRlcmVyLnByb3RvdHlwZS5pbml0QnVmZmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1vZGVsLkdlb3NldHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMudmVydGV4QnVmZmVyW2ldID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5zb2Z0d2FyZVNraW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52ZXJ0aWNlc1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5tb2RlbC5HZW9zZXRzW2ldLlZlcnRpY2VzLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXJbaV0pO1xuICAgICAgICAgICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLm1vZGVsLkdlb3NldHNbaV0uVmVydGljZXMsIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudGV4Q29vcmRCdWZmZXJbaV0gPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnRleENvb3JkQnVmZmVyW2ldKTtcbiAgICAgICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLm1vZGVsLkdlb3NldHNbaV0uVFZlcnRpY2VzWzBdLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc29mdHdhcmVTa2lubmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBCdWZmZXJbaV0gPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5ncm91cEJ1ZmZlcltpXSk7XG4gICAgICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KHRoaXMubW9kZWwuR2Vvc2V0c1tpXS5WZXJ0ZXhHcm91cC5sZW5ndGggKiA0KTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGJ1ZmZlci5sZW5ndGg7IGogKz0gNCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBqIC8gNDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGdyb3VwID0gdGhpcy5tb2RlbC5HZW9zZXRzW2ldLkdyb3Vwc1t0aGlzLm1vZGVsLkdlb3NldHNbaV0uVmVydGV4R3JvdXBbaW5kZXhdXTtcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyW2pdID0gZ3JvdXBbMF07XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltqICsgMV0gPSBncm91cC5sZW5ndGggPiAxID8gZ3JvdXBbMV0gOiBNQVhfTk9ERVM7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltqICsgMl0gPSBncm91cC5sZW5ndGggPiAyID8gZ3JvdXBbMl0gOiBNQVhfTk9ERVM7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltqICsgM10gPSBncm91cC5sZW5ndGggPiAzID8gZ3JvdXBbM10gOiBNQVhfTk9ERVM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIsIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaW5kZXhCdWZmZXJbaV0gPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuaW5kZXhCdWZmZXJbaV0pO1xuICAgICAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5tb2RlbC5HZW9zZXRzW2ldLkZhY2VzLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qcHJpdmF0ZSByZXNldEdsb2JhbFNlcXVlbmNlcyAoKTogdm9pZCB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5yZW5kZXJlckRhdGEuZ2xvYmFsU2VxdWVuY2VzRnJhbWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyRGF0YS5nbG9iYWxTZXF1ZW5jZXNGcmFtZXNbaV0gPSAwO1xuICAgICAgICB9XG4gICAgfSovXG4gICAgTW9kZWxSZW5kZXJlci5wcm90b3R5cGUudXBkYXRlR2xvYmFsU2VxdWVuY2VzID0gZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yZW5kZXJlckRhdGEuZ2xvYmFsU2VxdWVuY2VzRnJhbWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyRGF0YS5nbG9iYWxTZXF1ZW5jZXNGcmFtZXNbaV0gKz0gZGVsdGE7XG4gICAgICAgICAgICBpZiAodGhpcy5yZW5kZXJlckRhdGEuZ2xvYmFsU2VxdWVuY2VzRnJhbWVzW2ldID4gdGhpcy5tb2RlbC5HbG9iYWxTZXF1ZW5jZXNbaV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyRGF0YS5nbG9iYWxTZXF1ZW5jZXNGcmFtZXNbaV0gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBNb2RlbFJlbmRlcmVyLnByb3RvdHlwZS51cGRhdGVOb2RlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIHRyYW5zbGF0aW9uUmVzID0gdGhpcy5pbnRlcnAudmVjMyh0cmFuc2xhdGlvbiwgbm9kZS5ub2RlLlRyYW5zbGF0aW9uKTtcbiAgICAgICAgdmFyIHJvdGF0aW9uUmVzID0gdGhpcy5pbnRlcnAucXVhdChyb3RhdGlvbiwgbm9kZS5ub2RlLlJvdGF0aW9uKTtcbiAgICAgICAgdmFyIHNjYWxpbmdSZXMgPSB0aGlzLmludGVycC52ZWMzKHNjYWxpbmcsIG5vZGUubm9kZS5TY2FsaW5nKTtcbiAgICAgICAgaWYgKCF0cmFuc2xhdGlvblJlcyAmJiAhcm90YXRpb25SZXMgJiYgIXNjYWxpbmdSZXMpIHtcbiAgICAgICAgICAgIGdsX21hdHJpeF8xLm1hdDQuaWRlbnRpdHkobm9kZS5tYXRyaXgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRyYW5zbGF0aW9uUmVzICYmICFyb3RhdGlvblJlcyAmJiAhc2NhbGluZ1Jlcykge1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEubWF0NC5mcm9tVHJhbnNsYXRpb24obm9kZS5tYXRyaXgsIHRyYW5zbGF0aW9uUmVzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghdHJhbnNsYXRpb25SZXMgJiYgcm90YXRpb25SZXMgJiYgIXNjYWxpbmdSZXMpIHtcbiAgICAgICAgICAgIHV0aWxfMS5tYXQ0ZnJvbVJvdGF0aW9uT3JpZ2luKG5vZGUubWF0cml4LCByb3RhdGlvblJlcywgbm9kZS5ub2RlLlBpdm90UG9pbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEubWF0NC5mcm9tUm90YXRpb25UcmFuc2xhdGlvblNjYWxlT3JpZ2luKG5vZGUubWF0cml4LCByb3RhdGlvblJlcyB8fCBkZWZhdWx0Um90YXRpb24sIHRyYW5zbGF0aW9uUmVzIHx8IGRlZmF1bHRUcmFuc2xhdGlvbiwgc2NhbGluZ1JlcyB8fCBkZWZhdWx0U2NhbGluZywgbm9kZS5ub2RlLlBpdm90UG9pbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLm5vZGUuUGFyZW50KSB7XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS5tYXQ0Lm11bChub2RlLm1hdHJpeCwgdGhpcy5yZW5kZXJlckRhdGEubm9kZXNbbm9kZS5ub2RlLlBhcmVudF0ubWF0cml4LCBub2RlLm1hdHJpeCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJpbGxib2FyZGVkTG9jayA9IG5vZGUubm9kZS5GbGFncyAmIG1vZGVsXzEuTm9kZUZsYWdzLkJpbGxib2FyZGVkTG9ja1ggfHxcbiAgICAgICAgICAgIG5vZGUubm9kZS5GbGFncyAmIG1vZGVsXzEuTm9kZUZsYWdzLkJpbGxib2FyZGVkTG9ja1kgfHxcbiAgICAgICAgICAgIG5vZGUubm9kZS5GbGFncyAmIG1vZGVsXzEuTm9kZUZsYWdzLkJpbGxib2FyZGVkTG9ja1o7XG4gICAgICAgIGlmIChub2RlLm5vZGUuRmxhZ3MgJiBtb2RlbF8xLk5vZGVGbGFncy5CaWxsYm9hcmRlZCkge1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy50cmFuc2Zvcm1NYXQ0KHRlbXBUcmFuc2Zvcm1lZFBpdm90UG9pbnQsIG5vZGUubm9kZS5QaXZvdFBvaW50LCBub2RlLm1hdHJpeCk7XG4gICAgICAgICAgICBpZiAobm9kZS5ub2RlLlBhcmVudCkge1xuICAgICAgICAgICAgICAgIC8vIGNhbmNlbCBwYXJlbnQgcm90YXRpb24gZnJvbSBQaXZvdFBvaW50XG4gICAgICAgICAgICAgICAgZ2xfbWF0cml4XzEubWF0NC5nZXRSb3RhdGlvbih0ZW1wUGFyZW50Um90YXRpb25RdWF0LCB0aGlzLnJlbmRlcmVyRGF0YS5ub2Rlc1tub2RlLm5vZGUuUGFyZW50XS5tYXRyaXgpO1xuICAgICAgICAgICAgICAgIGdsX21hdHJpeF8xLnF1YXQuaW52ZXJ0KHRlbXBQYXJlbnRSb3RhdGlvblF1YXQsIHRlbXBQYXJlbnRSb3RhdGlvblF1YXQpO1xuICAgICAgICAgICAgICAgIHV0aWxfMS5tYXQ0ZnJvbVJvdGF0aW9uT3JpZ2luKHRlbXBQYXJlbnRSb3RhdGlvbk1hdCwgdGVtcFBhcmVudFJvdGF0aW9uUXVhdCwgdGVtcFRyYW5zZm9ybWVkUGl2b3RQb2ludCk7XG4gICAgICAgICAgICAgICAgZ2xfbWF0cml4XzEubWF0NC5tdWwobm9kZS5tYXRyaXgsIHRlbXBQYXJlbnRSb3RhdGlvbk1hdCwgbm9kZS5tYXRyaXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcm90YXRlIHRvIGNhbWVyYVxuICAgICAgICAgICAgdXRpbF8xLm1hdDRmcm9tUm90YXRpb25PcmlnaW4odGVtcENhbWVyYU1hdCwgdGhpcy5yZW5kZXJlckRhdGEuY2FtZXJhUXVhdCwgdGVtcFRyYW5zZm9ybWVkUGl2b3RQb2ludCk7XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS5tYXQ0Lm11bChub2RlLm1hdHJpeCwgdGVtcENhbWVyYU1hdCwgbm9kZS5tYXRyaXgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGJpbGxib2FyZGVkTG9jaykge1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy50cmFuc2Zvcm1NYXQ0KHRlbXBUcmFuc2Zvcm1lZFBpdm90UG9pbnQsIG5vZGUubm9kZS5QaXZvdFBvaW50LCBub2RlLm1hdHJpeCk7XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLmNvcHkodGVtcEF4aXMsIG5vZGUubm9kZS5QaXZvdFBvaW50KTtcbiAgICAgICAgICAgIC8vIHRvZG8gQmlsbGJvYXJkZWRMb2NrWCA/XG4gICAgICAgICAgICBpZiAobm9kZS5ub2RlLkZsYWdzICYgbW9kZWxfMS5Ob2RlRmxhZ3MuQmlsbGJvYXJkZWRMb2NrWCkge1xuICAgICAgICAgICAgICAgIHRlbXBBeGlzWzBdICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChub2RlLm5vZGUuRmxhZ3MgJiBtb2RlbF8xLk5vZGVGbGFncy5CaWxsYm9hcmRlZExvY2tZKSB7XG4gICAgICAgICAgICAgICAgdGVtcEF4aXNbMV0gKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5vZGUubm9kZS5GbGFncyAmIG1vZGVsXzEuTm9kZUZsYWdzLkJpbGxib2FyZGVkTG9ja1opIHtcbiAgICAgICAgICAgICAgICB0ZW1wQXhpc1syXSArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy50cmFuc2Zvcm1NYXQ0KHRlbXBBeGlzLCB0ZW1wQXhpcywgbm9kZS5tYXRyaXgpO1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5zdWIodGVtcEF4aXMsIHRlbXBBeGlzLCB0ZW1wVHJhbnNmb3JtZWRQaXZvdFBvaW50KTtcbiAgICAgICAgICAgIGdsX21hdHJpeF8xLnZlYzMuc2V0KHRlbXBYQXhpcywgMSwgMCwgMCk7XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLmFkZCh0ZW1wWEF4aXMsIHRlbXBYQXhpcywgbm9kZS5ub2RlLlBpdm90UG9pbnQpO1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy50cmFuc2Zvcm1NYXQ0KHRlbXBYQXhpcywgdGVtcFhBeGlzLCBub2RlLm1hdHJpeCk7XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLnN1Yih0ZW1wWEF4aXMsIHRlbXBYQXhpcywgdGVtcFRyYW5zZm9ybWVkUGl2b3RQb2ludCk7XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLnNldCh0ZW1wQ2FtZXJhVmVjLCAtMSwgMCwgMCk7XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLnRyYW5zZm9ybVF1YXQodGVtcENhbWVyYVZlYywgdGVtcENhbWVyYVZlYywgdGhpcy5yZW5kZXJlckRhdGEuY2FtZXJhUXVhdCk7XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLmNyb3NzKHRlbXBDcm9zczAsIHRlbXBBeGlzLCB0ZW1wQ2FtZXJhVmVjKTtcbiAgICAgICAgICAgIGdsX21hdHJpeF8xLnZlYzMuY3Jvc3ModGVtcENyb3NzMSwgdGVtcEF4aXMsIHRlbXBDcm9zczApO1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5ub3JtYWxpemUodGVtcENyb3NzMSwgdGVtcENyb3NzMSk7XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS5xdWF0LnJvdGF0aW9uVG8odGVtcExvY2tRdWF0LCB0ZW1wWEF4aXMsIHRlbXBDcm9zczEpO1xuICAgICAgICAgICAgdXRpbF8xLm1hdDRmcm9tUm90YXRpb25PcmlnaW4odGVtcExvY2tNYXQsIHRlbXBMb2NrUXVhdCwgdGVtcFRyYW5zZm9ybWVkUGl2b3RQb2ludCk7XG4gICAgICAgICAgICBnbF9tYXRyaXhfMS5tYXQ0Lm11bChub2RlLm1hdHJpeCwgdGVtcExvY2tNYXQsIG5vZGUubWF0cml4KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gbm9kZS5jaGlsZHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBfYVtfaV07XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU5vZGUoY2hpbGQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBNb2RlbFJlbmRlcmVyLnByb3RvdHlwZS5maW5kQWxwaGEgPSBmdW5jdGlvbiAoZ2Vvc2V0SWQpIHtcbiAgICAgICAgdmFyIGdlb3NldEFuaW0gPSB0aGlzLnJlbmRlcmVyRGF0YS5nZW9zZXRBbmltc1tnZW9zZXRJZF07XG4gICAgICAgIGlmICghZ2Vvc2V0QW5pbSB8fCBnZW9zZXRBbmltLkFscGhhID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZ2Vvc2V0QW5pbS5BbHBoYSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJldHVybiBnZW9zZXRBbmltLkFscGhhO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbnRlcnBSZXMgPSB0aGlzLmludGVycC5udW0oZ2Vvc2V0QW5pbS5BbHBoYSk7XG4gICAgICAgIGlmIChpbnRlcnBSZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnRlcnBSZXM7XG4gICAgfTtcbiAgICBNb2RlbFJlbmRlcmVyLnByb3RvdHlwZS5zZXRMYXllclByb3BzID0gZnVuY3Rpb24gKGxheWVyLCB0ZXh0dXJlSUQpIHtcbiAgICAgICAgdmFyIHRleHR1cmUgPSB0aGlzLm1vZGVsLlRleHR1cmVzW3RleHR1cmVJRF07XG4gICAgICAgIGlmIChsYXllci5TaGFkaW5nICYgbW9kZWxfMS5MYXllclNoYWRpbmcuVHdvU2lkZWQpIHtcbiAgICAgICAgICAgIGdsLmRpc2FibGUoZ2wuQ1VMTF9GQUNFKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5DVUxMX0ZBQ0UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXllci5GaWx0ZXJNb2RlID09PSBtb2RlbF8xLkZpbHRlck1vZGUuVHJhbnNwYXJlbnQpIHtcbiAgICAgICAgICAgIGdsLnVuaWZvcm0xZihzaGFkZXJQcm9ncmFtTG9jYXRpb25zLmRpc2NhcmRBbHBoYUxldmVsVW5pZm9ybSwgMC43NSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBnbC51bmlmb3JtMWYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5kaXNjYXJkQWxwaGFMZXZlbFVuaWZvcm0sIDAuKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGF5ZXIuRmlsdGVyTW9kZSA9PT0gbW9kZWxfMS5GaWx0ZXJNb2RlLk5vbmUpIHtcbiAgICAgICAgICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICAgICAgLy8gZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSk7XG4gICAgICAgICAgICBnbC5kZXB0aE1hc2sodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGF5ZXIuRmlsdGVyTW9kZSA9PT0gbW9kZWxfMS5GaWx0ZXJNb2RlLlRyYW5zcGFyZW50KSB7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICAgICAgZ2wuYmxlbmRGdW5jU2VwYXJhdGUoZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBLCBnbC5PTkUsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xuICAgICAgICAgICAgZ2wuZGVwdGhNYXNrKHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxheWVyLkZpbHRlck1vZGUgPT09IG1vZGVsXzEuRmlsdGVyTW9kZS5CbGVuZCkge1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICAgICAgICAgIGdsLmJsZW5kRnVuY1NlcGFyYXRlKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSwgZ2wuT05FLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcbiAgICAgICAgICAgIGdsLmRlcHRoTWFzayhmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGF5ZXIuRmlsdGVyTW9kZSA9PT0gbW9kZWxfMS5GaWx0ZXJNb2RlLkFkZGl0aXZlKSB7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICAgICAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19DT0xPUiwgZ2wuT05FKTtcbiAgICAgICAgICAgIGdsLmRlcHRoTWFzayhmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGF5ZXIuRmlsdGVyTW9kZSA9PT0gbW9kZWxfMS5GaWx0ZXJNb2RlLkFkZEFscGhhKSB7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICAgICAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FKTtcbiAgICAgICAgICAgIGdsLmRlcHRoTWFzayhmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGF5ZXIuRmlsdGVyTW9kZSA9PT0gbW9kZWxfMS5GaWx0ZXJNb2RlLk1vZHVsYXRlKSB7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICAgICAgZ2wuYmxlbmRGdW5jU2VwYXJhdGUoZ2wuWkVSTywgZ2wuU1JDX0NPTE9SLCBnbC5aRVJPLCBnbC5PTkUpO1xuICAgICAgICAgICAgZ2wuZGVwdGhNYXNrKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsYXllci5GaWx0ZXJNb2RlID09PSBtb2RlbF8xLkZpbHRlck1vZGUuTW9kdWxhdGUyeCkge1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICAgICAgICAgIGdsLmJsZW5kRnVuY1NlcGFyYXRlKGdsLkRTVF9DT0xPUiwgZ2wuU1JDX0NPTE9SLCBnbC5aRVJPLCBnbC5PTkUpO1xuICAgICAgICAgICAgZ2wuZGVwdGhNYXNrKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGV4dHVyZS5JbWFnZSkge1xuICAgICAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCk7XG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnJlbmRlcmVyRGF0YS50ZXh0dXJlc1t0ZXh0dXJlLkltYWdlXSk7XG4gICAgICAgICAgICBnbC51bmlmb3JtMWkoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5zYW1wbGVyVW5pZm9ybSwgMCk7XG4gICAgICAgICAgICBnbC51bmlmb3JtMWYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5yZXBsYWNlYWJsZVR5cGVVbmlmb3JtLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ZXh0dXJlLlJlcGxhY2VhYmxlSWQgPT09IDEgfHwgdGV4dHVyZS5SZXBsYWNlYWJsZUlkID09PSAyKSB7XG4gICAgICAgICAgICBnbC51bmlmb3JtM2Z2KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMucmVwbGFjZWFibGVDb2xvclVuaWZvcm0sIHRoaXMucmVuZGVyZXJEYXRhLnRlYW1Db2xvcik7XG4gICAgICAgICAgICBnbC51bmlmb3JtMWYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5yZXBsYWNlYWJsZVR5cGVVbmlmb3JtLCB0ZXh0dXJlLlJlcGxhY2VhYmxlSWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXllci5TaGFkaW5nICYgbW9kZWxfMS5MYXllclNoYWRpbmcuTm9EZXB0aFRlc3QpIHtcbiAgICAgICAgICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxheWVyLlNoYWRpbmcgJiBtb2RlbF8xLkxheWVyU2hhZGluZy5Ob0RlcHRoU2V0KSB7XG4gICAgICAgICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbGF5ZXIuVFZlcnRleEFuaW1JZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHZhciBhbmltID0gdGhpcy5yZW5kZXJlckRhdGEubW9kZWwuVGV4dHVyZUFuaW1zW2xheWVyLlRWZXJ0ZXhBbmltSWRdO1xuICAgICAgICAgICAgdmFyIHRyYW5zbGF0aW9uUmVzID0gdGhpcy5pbnRlcnAudmVjMyh0cmFuc2xhdGlvbiwgYW5pbS5UcmFuc2xhdGlvbik7XG4gICAgICAgICAgICB2YXIgcm90YXRpb25SZXMgPSB0aGlzLmludGVycC5xdWF0KHJvdGF0aW9uLCBhbmltLlJvdGF0aW9uKTtcbiAgICAgICAgICAgIHZhciBzY2FsaW5nUmVzID0gdGhpcy5pbnRlcnAudmVjMyhzY2FsaW5nLCBhbmltLlNjYWxpbmcpO1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEubWF0NC5mcm9tUm90YXRpb25UcmFuc2xhdGlvblNjYWxlKHRleENvb3JkTWF0NCwgcm90YXRpb25SZXMgfHwgZGVmYXVsdFJvdGF0aW9uLCB0cmFuc2xhdGlvblJlcyB8fCBkZWZhdWx0VHJhbnNsYXRpb24sIHNjYWxpbmdSZXMgfHwgZGVmYXVsdFNjYWxpbmcpO1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEubWF0My5zZXQodGV4Q29vcmRNYXQzLCB0ZXhDb29yZE1hdDRbMF0sIHRleENvb3JkTWF0NFsxXSwgMCwgdGV4Q29vcmRNYXQ0WzRdLCB0ZXhDb29yZE1hdDRbNV0sIDAsIHRleENvb3JkTWF0NFsxMl0sIHRleENvb3JkTWF0NFsxM10sIDApO1xuICAgICAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDNmdihzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnRWZXJ0ZXhBbmltVW5pZm9ybSwgZmFsc2UsIHRleENvb3JkTWF0Myk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBnbC51bmlmb3JtTWF0cml4M2Z2KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMudFZlcnRleEFuaW1Vbmlmb3JtLCBmYWxzZSwgaWRlbnRpZnlNYXQzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIE1vZGVsUmVuZGVyZXI7XG59KCkpO1xuZXhwb3J0cy5Nb2RlbFJlbmRlcmVyID0gTW9kZWxSZW5kZXJlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1vZGVsUmVuZGVyZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbW9kZWxfMSA9IHJlcXVpcmUoXCIuLi9tb2RlbFwiKTtcbnZhciBnbF9tYXRyaXhfMSA9IHJlcXVpcmUoXCJnbC1tYXRyaXhcIik7XG52YXIgbW9kZWxJbnRlcnBfMSA9IHJlcXVpcmUoXCIuL21vZGVsSW50ZXJwXCIpO1xudmFyIHV0aWxfMSA9IHJlcXVpcmUoXCIuL3V0aWxcIik7XG52YXIgaW50ZXJwXzEgPSByZXF1aXJlKFwiLi9pbnRlcnBcIik7XG52YXIgZ2w7XG52YXIgc2hhZGVyUHJvZ3JhbTtcbnZhciBzaGFkZXJQcm9ncmFtTG9jYXRpb25zID0ge307XG52YXIgcGFydGljbGVTdG9yYWdlID0gW107XG52YXIgcm90YXRlQ2VudGVyID0gZ2xfbWF0cml4XzEudmVjMy5mcm9tVmFsdWVzKDAsIDAsIDApO1xudmFyIGZpcnN0Q29sb3IgPSBnbF9tYXRyaXhfMS52ZWM0LmNyZWF0ZSgpO1xudmFyIHNlY29uZENvbG9yID0gZ2xfbWF0cml4XzEudmVjNC5jcmVhdGUoKTtcbnZhciBjb2xvciA9IGdsX21hdHJpeF8xLnZlYzQuY3JlYXRlKCk7XG52YXIgdGFpbFBvcyA9IGdsX21hdHJpeF8xLnZlYzMuY3JlYXRlKCk7XG52YXIgdGFpbENyb3NzID0gZ2xfbWF0cml4XzEudmVjMy5jcmVhdGUoKTtcbnZhciB2ZXJ0ZXhTaGFkZXIgPSBcIlxcbiAgICBhdHRyaWJ1dGUgdmVjMyBhVmVydGV4UG9zaXRpb247XFxuICAgIGF0dHJpYnV0ZSB2ZWMyIGFUZXh0dXJlQ29vcmQ7XFxuICAgIGF0dHJpYnV0ZSB2ZWM0IGFDb2xvcjtcXG5cXG4gICAgdW5pZm9ybSBtYXQ0IHVNVk1hdHJpeDtcXG4gICAgdW5pZm9ybSBtYXQ0IHVQTWF0cml4O1xcblxcbiAgICB2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcXG4gICAgdmFyeWluZyB2ZWM0IHZDb2xvcjtcXG5cXG4gICAgdm9pZCBtYWluKHZvaWQpIHtcXG4gICAgICAgIHZlYzQgcG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMS4wKTtcXG4gICAgICAgIGdsX1Bvc2l0aW9uID0gdVBNYXRyaXggKiB1TVZNYXRyaXggKiBwb3NpdGlvbjtcXG4gICAgICAgIHZUZXh0dXJlQ29vcmQgPSBhVGV4dHVyZUNvb3JkO1xcbiAgICAgICAgdkNvbG9yID0gYUNvbG9yO1xcbiAgICB9XFxuXCI7XG52YXIgZnJhZ21lbnRTaGFkZXIgPSBcIlxcbiAgICBwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcXG5cXG4gICAgdmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XFxuICAgIHZhcnlpbmcgdmVjNCB2Q29sb3I7XFxuXFxuICAgIHVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1xcbiAgICB1bmlmb3JtIHZlYzMgdVJlcGxhY2VhYmxlQ29sb3I7XFxuICAgIHVuaWZvcm0gZmxvYXQgdVJlcGxhY2VhYmxlVHlwZTtcXG4gICAgdW5pZm9ybSBmbG9hdCB1RGlzY2FyZEFscGhhTGV2ZWw7XFxuXFxuICAgIGZsb2F0IGh5cG90ICh2ZWMyIHopIHtcXG4gICAgICAgIGZsb2F0IHQ7XFxuICAgICAgICBmbG9hdCB4ID0gYWJzKHoueCk7XFxuICAgICAgICBmbG9hdCB5ID0gYWJzKHoueSk7XFxuICAgICAgICB0ID0gbWluKHgsIHkpO1xcbiAgICAgICAgeCA9IG1heCh4LCB5KTtcXG4gICAgICAgIHQgPSB0IC8geDtcXG4gICAgICAgIHJldHVybiAoei54ID09IDAuMCAmJiB6LnkgPT0gMC4wKSA/IDAuMCA6IHggKiBzcXJ0KDEuMCArIHQgKiB0KTtcXG4gICAgfVxcblxcbiAgICB2b2lkIG1haW4odm9pZCkge1xcbiAgICAgICAgdmVjMiBjb29yZHMgPSB2ZWMyKHZUZXh0dXJlQ29vcmQucywgdlRleHR1cmVDb29yZC50KTtcXG4gICAgICAgIGlmICh1UmVwbGFjZWFibGVUeXBlID09IDAuKSB7XFxuICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCBjb29yZHMpO1xcbiAgICAgICAgfSBlbHNlIGlmICh1UmVwbGFjZWFibGVUeXBlID09IDEuKSB7XFxuICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCh1UmVwbGFjZWFibGVDb2xvciwgMS4wKTtcXG4gICAgICAgIH0gZWxzZSBpZiAodVJlcGxhY2VhYmxlVHlwZSA9PSAyLikge1xcbiAgICAgICAgICAgIGZsb2F0IGRpc3QgPSBoeXBvdChjb29yZHMgLSB2ZWMyKDAuNSwgMC41KSkgKiAyLjtcXG4gICAgICAgICAgICBmbG9hdCB0cnVuY2F0ZURpc3QgPSBjbGFtcCgxLiAtIGRpc3QgKiAxLjQsIDAuLCAxLik7XFxuICAgICAgICAgICAgZmxvYXQgYWxwaGEgPSBzaW4odHJ1bmNhdGVEaXN0KTtcXG4gICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KHVSZXBsYWNlYWJsZUNvbG9yICogYWxwaGEsIDEuMCk7XFxuICAgICAgICB9XFxuICAgICAgICBnbF9GcmFnQ29sb3IgKj0gdkNvbG9yO1xcbiAgICAgICAgXFxuICAgICAgICBpZiAoZ2xfRnJhZ0NvbG9yWzNdIDwgdURpc2NhcmRBbHBoYUxldmVsKSB7XFxuICAgICAgICAgICAgZGlzY2FyZDtcXG4gICAgICAgIH1cXG4gICAgfVxcblwiO1xudmFyIERJU0NBUkRfQUxQSEFfS0VZX0xFVkVMID0gMC44MztcbnZhciBESVNDQVJEX01PRFVMQVRFX0xFVkVMID0gMC4wMTtcbnZhciBQYXJ0aWNsZXNDb250cm9sbGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQYXJ0aWNsZXNDb250cm9sbGVyKGludGVycCwgcmVuZGVyZXJEYXRhKSB7XG4gICAgICAgIHRoaXMuaW50ZXJwID0gaW50ZXJwO1xuICAgICAgICB0aGlzLnJlbmRlcmVyRGF0YSA9IHJlbmRlcmVyRGF0YTtcbiAgICAgICAgdGhpcy5lbWl0dGVycyA9IFtdO1xuICAgICAgICBpZiAocmVuZGVyZXJEYXRhLm1vZGVsLlBhcnRpY2xlRW1pdHRlcnMyLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5wYXJ0aWNsZUJhc2VWZWN0b3JzID0gW1xuICAgICAgICAgICAgICAgIGdsX21hdHJpeF8xLnZlYzMuY3JlYXRlKCksXG4gICAgICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5jcmVhdGUoKSxcbiAgICAgICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLmNyZWF0ZSgpLFxuICAgICAgICAgICAgICAgIGdsX21hdHJpeF8xLnZlYzMuY3JlYXRlKClcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gcmVuZGVyZXJEYXRhLm1vZGVsLlBhcnRpY2xlRW1pdHRlcnMyOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0aWNsZUVtaXR0ZXIgPSBfYVtfaV07XG4gICAgICAgICAgICAgICAgdmFyIGVtaXR0ZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgIGVtaXNzaW9uOiAwLFxuICAgICAgICAgICAgICAgICAgICBzcXVpcnRGcmFtZTogMCxcbiAgICAgICAgICAgICAgICAgICAgcGFydGljbGVzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgcHJvcHM6IHBhcnRpY2xlRW1pdHRlcixcbiAgICAgICAgICAgICAgICAgICAgY2FwYWNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGJhc2VDYXBhY2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogcGFydGljbGVFbWl0dGVyLkZyYW1lRmxhZ3MsXG4gICAgICAgICAgICAgICAgICAgIHRhaWxWZXJ0aWNlczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgdGFpbFZlcnRleEJ1ZmZlcjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgaGVhZFZlcnRpY2VzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBoZWFkVmVydGV4QnVmZmVyOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB0YWlsVGV4Q29vcmRzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB0YWlsVGV4Q29vcmRCdWZmZXI6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRUZXhDb29yZHM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRUZXhDb29yZEJ1ZmZlcjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgY29sb3JzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBjb2xvckJ1ZmZlcjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNlczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhCdWZmZXI6IG51bGxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuYmFzZUNhcGFjaXR5ID0gTWF0aC5jZWlsKG1vZGVsSW50ZXJwXzEuTW9kZWxJbnRlcnAubWF4QW5pbVZlY3RvclZhbChlbWl0dGVyLnByb3BzLkVtaXNzaW9uUmF0ZSkgKiBlbWl0dGVyLnByb3BzLkxpZmVTcGFuKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXJzLnB1c2goZW1pdHRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgUGFydGljbGVzQ29udHJvbGxlci5pbml0R0wgPSBmdW5jdGlvbiAoZ2xDb250ZXh0KSB7XG4gICAgICAgIGdsID0gZ2xDb250ZXh0O1xuICAgICAgICBQYXJ0aWNsZXNDb250cm9sbGVyLmluaXRTaGFkZXJzKCk7XG4gICAgfTtcbiAgICBQYXJ0aWNsZXNDb250cm9sbGVyLmluaXRTaGFkZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdmVydGV4ID0gdXRpbF8xLmdldFNoYWRlcihnbCwgdmVydGV4U2hhZGVyLCBnbC5WRVJURVhfU0hBREVSKTtcbiAgICAgICAgdmFyIGZyYWdtZW50ID0gdXRpbF8xLmdldFNoYWRlcihnbCwgZnJhZ21lbnRTaGFkZXIsIGdsLkZSQUdNRU5UX1NIQURFUik7XG4gICAgICAgIHNoYWRlclByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgIGdsLmF0dGFjaFNoYWRlcihzaGFkZXJQcm9ncmFtLCB2ZXJ0ZXgpO1xuICAgICAgICBnbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgZnJhZ21lbnQpO1xuICAgICAgICBnbC5saW5rUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcbiAgICAgICAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHNoYWRlclByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSkge1xuICAgICAgICAgICAgYWxlcnQoJ0NvdWxkIG5vdCBpbml0aWFsaXNlIHNoYWRlcnMnKTtcbiAgICAgICAgfVxuICAgICAgICBnbC51c2VQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xuICAgICAgICBzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlID1cbiAgICAgICAgICAgIGdsLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sICdhVmVydGV4UG9zaXRpb24nKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUgPVxuICAgICAgICAgICAgZ2wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ2FUZXh0dXJlQ29vcmQnKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5jb2xvckF0dHJpYnV0ZSA9XG4gICAgICAgICAgICBnbC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAnYUNvbG9yJyk7XG4gICAgICAgIHNoYWRlclByb2dyYW1Mb2NhdGlvbnMucE1hdHJpeFVuaWZvcm0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ3VQTWF0cml4Jyk7XG4gICAgICAgIHNoYWRlclByb2dyYW1Mb2NhdGlvbnMubXZNYXRyaXhVbmlmb3JtID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sICd1TVZNYXRyaXgnKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5zYW1wbGVyVW5pZm9ybSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAndVNhbXBsZXInKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5yZXBsYWNlYWJsZUNvbG9yVW5pZm9ybSA9XG4gICAgICAgICAgICBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ3VSZXBsYWNlYWJsZUNvbG9yJyk7XG4gICAgICAgIHNoYWRlclByb2dyYW1Mb2NhdGlvbnMucmVwbGFjZWFibGVUeXBlVW5pZm9ybSA9XG4gICAgICAgICAgICBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ3VSZXBsYWNlYWJsZVR5cGUnKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5kaXNjYXJkQWxwaGFMZXZlbFVuaWZvcm0gPVxuICAgICAgICAgICAgZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sICd1RGlzY2FyZEFscGhhTGV2ZWwnKTtcbiAgICB9O1xuICAgIFBhcnRpY2xlc0NvbnRyb2xsZXIudXBkYXRlUGFydGljbGUgPSBmdW5jdGlvbiAocGFydGljbGUsIGRlbHRhKSB7XG4gICAgICAgIGRlbHRhIC89IDEwMDA7XG4gICAgICAgIHBhcnRpY2xlLmxpZmVTcGFuIC09IGRlbHRhO1xuICAgICAgICBpZiAocGFydGljbGUubGlmZVNwYW4gPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBhcnRpY2xlLnNwZWVkWzJdIC09IHBhcnRpY2xlLmdyYXZpdHkgKiBkZWx0YTtcbiAgICAgICAgcGFydGljbGUucG9zWzBdICs9IHBhcnRpY2xlLnNwZWVkWzBdICogZGVsdGE7XG4gICAgICAgIHBhcnRpY2xlLnBvc1sxXSArPSBwYXJ0aWNsZS5zcGVlZFsxXSAqIGRlbHRhO1xuICAgICAgICBwYXJ0aWNsZS5wb3NbMl0gKz0gcGFydGljbGUuc3BlZWRbMl0gKiBkZWx0YTtcbiAgICB9O1xuICAgIFBhcnRpY2xlc0NvbnRyb2xsZXIucmVzaXplRW1pdHRlckJ1ZmZlcnMgPSBmdW5jdGlvbiAoZW1pdHRlciwgc2l6ZSkge1xuICAgICAgICBpZiAoc2l6ZSA8PSBlbWl0dGVyLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc2l6ZSA9IE1hdGgubWF4KHNpemUsIGVtaXR0ZXIuYmFzZUNhcGFjaXR5KTtcbiAgICAgICAgdmFyIHRhaWxWZXJ0aWNlcztcbiAgICAgICAgdmFyIGhlYWRWZXJ0aWNlcztcbiAgICAgICAgdmFyIHRhaWxUZXhDb29yZHM7XG4gICAgICAgIHZhciBoZWFkVGV4Q29vcmRzO1xuICAgICAgICBpZiAoZW1pdHRlci50eXBlICYgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MuVGFpbCkge1xuICAgICAgICAgICAgdGFpbFZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShzaXplICogNCAqIDMpOyAvLyA0IHZlcnRpY2VzICogeHl6XG4gICAgICAgICAgICB0YWlsVGV4Q29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShzaXplICogNCAqIDIpOyAvLyA0IHZlcnRpY2VzICogeHlcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW1pdHRlci50eXBlICYgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MuSGVhZCkge1xuICAgICAgICAgICAgaGVhZFZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShzaXplICogNCAqIDMpOyAvLyA0IHZlcnRpY2VzICogeHl6XG4gICAgICAgICAgICBoZWFkVGV4Q29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShzaXplICogNCAqIDIpOyAvLyA0IHZlcnRpY2VzICogeHlcbiAgICAgICAgfVxuICAgICAgICB2YXIgY29sb3JzID0gbmV3IEZsb2F0MzJBcnJheShzaXplICogNCAqIDQpOyAvLyA0IHZlcnRpY2VzICogcmdiYVxuICAgICAgICB2YXIgaW5kaWNlcyA9IG5ldyBVaW50MTZBcnJheShzaXplICogNik7IC8vIDQgdmVydGljZXMgKiAyIHRyaWFuZ2xlc1xuICAgICAgICBpZiAoZW1pdHRlci5jYXBhY2l0eSkge1xuICAgICAgICAgICAgaW5kaWNlcy5zZXQoZW1pdHRlci5pbmRpY2VzKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gZW1pdHRlci5jYXBhY2l0eTsgaSA8IHNpemU7ICsraSkge1xuICAgICAgICAgICAgaW5kaWNlc1tpICogNl0gPSBpICogNDtcbiAgICAgICAgICAgIGluZGljZXNbaSAqIDYgKyAxXSA9IGkgKiA0ICsgMTtcbiAgICAgICAgICAgIGluZGljZXNbaSAqIDYgKyAyXSA9IGkgKiA0ICsgMjtcbiAgICAgICAgICAgIGluZGljZXNbaSAqIDYgKyAzXSA9IGkgKiA0ICsgMjtcbiAgICAgICAgICAgIGluZGljZXNbaSAqIDYgKyA0XSA9IGkgKiA0ICsgMTtcbiAgICAgICAgICAgIGluZGljZXNbaSAqIDYgKyA1XSA9IGkgKiA0ICsgMztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGFpbFZlcnRpY2VzKSB7XG4gICAgICAgICAgICBlbWl0dGVyLnRhaWxWZXJ0aWNlcyA9IHRhaWxWZXJ0aWNlcztcbiAgICAgICAgICAgIGVtaXR0ZXIudGFpbFRleENvb3JkcyA9IHRhaWxUZXhDb29yZHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhlYWRWZXJ0aWNlcykge1xuICAgICAgICAgICAgZW1pdHRlci5oZWFkVmVydGljZXMgPSBoZWFkVmVydGljZXM7XG4gICAgICAgICAgICBlbWl0dGVyLmhlYWRUZXhDb29yZHMgPSBoZWFkVGV4Q29vcmRzO1xuICAgICAgICB9XG4gICAgICAgIGVtaXR0ZXIuY29sb3JzID0gY29sb3JzO1xuICAgICAgICBlbWl0dGVyLmluZGljZXMgPSBpbmRpY2VzO1xuICAgICAgICBlbWl0dGVyLmNhcGFjaXR5ID0gc2l6ZTtcbiAgICAgICAgaWYgKCFlbWl0dGVyLmluZGV4QnVmZmVyKSB7XG4gICAgICAgICAgICBpZiAoZW1pdHRlci50eXBlICYgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MuVGFpbCkge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIudGFpbFZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIudGFpbFRleENvb3JkQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZW1pdHRlci50eXBlICYgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MuSGVhZCkge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuaGVhZFZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuaGVhZFRleENvb3JkQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbWl0dGVyLmNvbG9yQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgICAgICBlbWl0dGVyLmluZGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBhcnRpY2xlc0NvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdGhpcy5lbWl0dGVyczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBlbWl0dGVyID0gX2FbX2ldO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVFbWl0dGVyKGVtaXR0ZXIsIGRlbHRhKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGFydGljbGVzQ29udHJvbGxlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKG12TWF0cml4LCBwTWF0cml4KSB7XG4gICAgICAgIGdsLmVuYWJsZShnbC5DVUxMX0ZBQ0UpO1xuICAgICAgICBnbC51c2VQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xuICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMucE1hdHJpeFVuaWZvcm0sIGZhbHNlLCBwTWF0cml4KTtcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDRmdihzaGFkZXJQcm9ncmFtTG9jYXRpb25zLm12TWF0cml4VW5pZm9ybSwgZmFsc2UsIG12TWF0cml4KTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSk7XG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMudGV4dHVyZUNvb3JkQXR0cmlidXRlKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5jb2xvckF0dHJpYnV0ZSk7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB0aGlzLmVtaXR0ZXJzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIGVtaXR0ZXIgPSBfYVtfaV07XG4gICAgICAgICAgICBpZiAoIWVtaXR0ZXIucGFydGljbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXRMYXllclByb3BzKGVtaXR0ZXIpO1xuICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmFsQnVmZmVycyhlbWl0dGVyKTtcbiAgICAgICAgICAgIGlmIChlbWl0dGVyLnR5cGUgJiBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5UYWlsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJFbWl0dGVyVHlwZShlbWl0dGVyLCBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5UYWlsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbWl0dGVyLnR5cGUgJiBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5IZWFkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJFbWl0dGVyVHlwZShlbWl0dGVyLCBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5IZWFkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSk7XG4gICAgICAgIGdsLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnRleHR1cmVDb29yZEF0dHJpYnV0ZSk7XG4gICAgICAgIGdsLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtTG9jYXRpb25zLmNvbG9yQXR0cmlidXRlKTtcbiAgICB9O1xuICAgIFBhcnRpY2xlc0NvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZUVtaXR0ZXIgPSBmdW5jdGlvbiAoZW1pdHRlciwgZGVsdGEpIHtcbiAgICAgICAgdmFyIHZpc2liaWxpdHkgPSB0aGlzLmludGVycC5hbmltVmVjdG9yVmFsKGVtaXR0ZXIucHJvcHMuVmlzaWJpbGl0eSwgMSk7XG4gICAgICAgIGlmICh2aXNpYmlsaXR5ID4gMCkge1xuICAgICAgICAgICAgaWYgKGVtaXR0ZXIucHJvcHMuU3F1aXJ0ICYmIHR5cGVvZiBlbWl0dGVyLnByb3BzLkVtaXNzaW9uUmF0ZSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJwID0gdGhpcy5pbnRlcnAuZmluZEtleWZyYW1lcyhlbWl0dGVyLnByb3BzLkVtaXNzaW9uUmF0ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGludGVycCAmJiBpbnRlcnAubGVmdCAmJiBpbnRlcnAubGVmdC5GcmFtZSAhPT0gZW1pdHRlci5zcXVpcnRGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBlbWl0dGVyLnNxdWlydEZyYW1lID0gaW50ZXJwLmxlZnQuRnJhbWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcnAubGVmdC5WZWN0b3JbMF0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbWl0dGVyLmVtaXNzaW9uICs9IGludGVycC5sZWZ0LlZlY3RvclswXSAqIDEwMDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgZW1pc3Npb25SYXRlID0gdGhpcy5pbnRlcnAuYW5pbVZlY3RvclZhbChlbWl0dGVyLnByb3BzLkVtaXNzaW9uUmF0ZSwgMCk7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5lbWlzc2lvbiArPSBlbWlzc2lvblJhdGUgKiBkZWx0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChlbWl0dGVyLmVtaXNzaW9uID49IDEwMDApIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLmVtaXNzaW9uIC09IDEwMDA7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5wYXJ0aWNsZXMucHVzaCh0aGlzLmNyZWF0ZVBhcnRpY2xlKGVtaXR0ZXIsIHRoaXMucmVuZGVyZXJEYXRhLm5vZGVzW2VtaXR0ZXIucHJvcHMuT2JqZWN0SWRdLm1hdHJpeCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChlbWl0dGVyLnBhcnRpY2xlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciB1cGRhdGVkUGFydGljbGVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gZW1pdHRlci5wYXJ0aWNsZXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcnRpY2xlID0gX2FbX2ldO1xuICAgICAgICAgICAgICAgIFBhcnRpY2xlc0NvbnRyb2xsZXIudXBkYXRlUGFydGljbGUocGFydGljbGUsIGRlbHRhKTtcbiAgICAgICAgICAgICAgICBpZiAocGFydGljbGUubGlmZVNwYW4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZWRQYXJ0aWNsZXMucHVzaChwYXJ0aWNsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0aWNsZVN0b3JhZ2UucHVzaChwYXJ0aWNsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW1pdHRlci5wYXJ0aWNsZXMgPSB1cGRhdGVkUGFydGljbGVzO1xuICAgICAgICAgICAgaWYgKGVtaXR0ZXIudHlwZSAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLkhlYWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZW1pdHRlci5wcm9wcy5GbGFncyAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZsYWdzLlhZUXVhZCkge1xuICAgICAgICAgICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLnNldCh0aGlzLnBhcnRpY2xlQmFzZVZlY3RvcnNbMF0sIC0xLCAxLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5zZXQodGhpcy5wYXJ0aWNsZUJhc2VWZWN0b3JzWzFdLCAtMSwgLTEsIDApO1xuICAgICAgICAgICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLnNldCh0aGlzLnBhcnRpY2xlQmFzZVZlY3RvcnNbMl0sIDEsIDEsIDApO1xuICAgICAgICAgICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLnNldCh0aGlzLnBhcnRpY2xlQmFzZVZlY3RvcnNbM10sIDEsIC0xLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGdsX21hdHJpeF8xLnZlYzMuc2V0KHRoaXMucGFydGljbGVCYXNlVmVjdG9yc1swXSwgMCwgLTEsIDEpO1xuICAgICAgICAgICAgICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLnNldCh0aGlzLnBhcnRpY2xlQmFzZVZlY3RvcnNbMV0sIDAsIC0xLCAtMSk7XG4gICAgICAgICAgICAgICAgICAgIGdsX21hdHJpeF8xLnZlYzMuc2V0KHRoaXMucGFydGljbGVCYXNlVmVjdG9yc1syXSwgMCwgMSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGdsX21hdHJpeF8xLnZlYzMuc2V0KHRoaXMucGFydGljbGVCYXNlVmVjdG9yc1szXSwgMCwgMSwgLTEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy50cmFuc2Zvcm1RdWF0KHRoaXMucGFydGljbGVCYXNlVmVjdG9yc1tpXSwgdGhpcy5wYXJ0aWNsZUJhc2VWZWN0b3JzW2ldLCB0aGlzLnJlbmRlcmVyRGF0YS5jYW1lcmFRdWF0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFBhcnRpY2xlc0NvbnRyb2xsZXIucmVzaXplRW1pdHRlckJ1ZmZlcnMoZW1pdHRlciwgZW1pdHRlci5wYXJ0aWNsZXMubGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW1pdHRlci5wYXJ0aWNsZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVBhcnRpY2xlQnVmZmVycyhlbWl0dGVyLnBhcnRpY2xlc1tpXSwgaSwgZW1pdHRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBhcnRpY2xlc0NvbnRyb2xsZXIucHJvdG90eXBlLmNyZWF0ZVBhcnRpY2xlID0gZnVuY3Rpb24gKGVtaXR0ZXIsIGVtaXR0ZXJNYXRyaXgpIHtcbiAgICAgICAgdmFyIHBhcnRpY2xlO1xuICAgICAgICBpZiAocGFydGljbGVTdG9yYWdlLmxlbmd0aCkge1xuICAgICAgICAgICAgcGFydGljbGUgPSBwYXJ0aWNsZVN0b3JhZ2UucG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXJ0aWNsZSA9IHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyOiBudWxsLFxuICAgICAgICAgICAgICAgIHBvczogZ2xfbWF0cml4XzEudmVjMy5jcmVhdGUoKSxcbiAgICAgICAgICAgICAgICBhbmdsZTogMCxcbiAgICAgICAgICAgICAgICBzcGVlZDogZ2xfbWF0cml4XzEudmVjMy5jcmVhdGUoKSxcbiAgICAgICAgICAgICAgICBncmF2aXR5OiBudWxsLFxuICAgICAgICAgICAgICAgIGxpZmVTcGFuOiBudWxsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciB3aWR0aCA9IHRoaXMuaW50ZXJwLmFuaW1WZWN0b3JWYWwoZW1pdHRlci5wcm9wcy5XaWR0aCwgMCk7XG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmludGVycC5hbmltVmVjdG9yVmFsKGVtaXR0ZXIucHJvcHMuTGVuZ3RoLCAwKTtcbiAgICAgICAgdmFyIHNwZWVkU2NhbGUgPSB0aGlzLmludGVycC5hbmltVmVjdG9yVmFsKGVtaXR0ZXIucHJvcHMuU3BlZWQsIDApO1xuICAgICAgICB2YXIgdmFyaWF0aW9uID0gdGhpcy5pbnRlcnAuYW5pbVZlY3RvclZhbChlbWl0dGVyLnByb3BzLlZhcmlhdGlvbiwgMCk7XG4gICAgICAgIHZhciBsYXRpdHVkZSA9IHV0aWxfMS5kZWdUb1JhZCh0aGlzLmludGVycC5hbmltVmVjdG9yVmFsKGVtaXR0ZXIucHJvcHMuTGF0aXR1ZGUsIDApKTtcbiAgICAgICAgcGFydGljbGUuZW1pdHRlciA9IGVtaXR0ZXI7XG4gICAgICAgIHBhcnRpY2xlLnBvc1swXSA9IGVtaXR0ZXIucHJvcHMuUGl2b3RQb2ludFswXSArIHV0aWxfMS5yYW5kKC13aWR0aCwgd2lkdGgpO1xuICAgICAgICBwYXJ0aWNsZS5wb3NbMV0gPSBlbWl0dGVyLnByb3BzLlBpdm90UG9pbnRbMV0gKyB1dGlsXzEucmFuZCgtbGVuZ3RoLCBsZW5ndGgpO1xuICAgICAgICBwYXJ0aWNsZS5wb3NbMl0gPSBlbWl0dGVyLnByb3BzLlBpdm90UG9pbnRbMl07XG4gICAgICAgIGdsX21hdHJpeF8xLnZlYzMudHJhbnNmb3JtTWF0NChwYXJ0aWNsZS5wb3MsIHBhcnRpY2xlLnBvcywgZW1pdHRlck1hdHJpeCk7XG4gICAgICAgIGlmICh2YXJpYXRpb24gPiAwKSB7XG4gICAgICAgICAgICBzcGVlZFNjYWxlICo9IDEgKyB1dGlsXzEucmFuZCgtdmFyaWF0aW9uLCB2YXJpYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGdsX21hdHJpeF8xLnZlYzMuc2V0KHBhcnRpY2xlLnNwZWVkLCAwLCAwLCBzcGVlZFNjYWxlKTtcbiAgICAgICAgcGFydGljbGUuYW5nbGUgPSB1dGlsXzEucmFuZCgwLCBNYXRoLlBJICogMik7XG4gICAgICAgIGdsX21hdHJpeF8xLnZlYzMucm90YXRlWShwYXJ0aWNsZS5zcGVlZCwgcGFydGljbGUuc3BlZWQsIHJvdGF0ZUNlbnRlciwgdXRpbF8xLnJhbmQoMCwgbGF0aXR1ZGUpKTtcbiAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5yb3RhdGVaKHBhcnRpY2xlLnNwZWVkLCBwYXJ0aWNsZS5zcGVlZCwgcm90YXRlQ2VudGVyLCBwYXJ0aWNsZS5hbmdsZSk7XG4gICAgICAgIGlmIChlbWl0dGVyLnByb3BzLkZsYWdzICYgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRmxhZ3MuTGluZUVtaXR0ZXIpIHtcbiAgICAgICAgICAgIHBhcnRpY2xlLnNwZWVkWzBdID0gMDtcbiAgICAgICAgfVxuICAgICAgICBnbF9tYXRyaXhfMS52ZWMzLnRyYW5zZm9ybU1hdDQocGFydGljbGUuc3BlZWQsIHBhcnRpY2xlLnNwZWVkLCBlbWl0dGVyTWF0cml4KTtcbiAgICAgICAgLy8gbWludXMgdHJhbnNsYXRpb24gb2YgZW1pdHRlck1hdHJpeFxuICAgICAgICBwYXJ0aWNsZS5zcGVlZFswXSAtPSBlbWl0dGVyTWF0cml4WzEyXTtcbiAgICAgICAgcGFydGljbGUuc3BlZWRbMV0gLT0gZW1pdHRlck1hdHJpeFsxM107XG4gICAgICAgIHBhcnRpY2xlLnNwZWVkWzJdIC09IGVtaXR0ZXJNYXRyaXhbMTRdO1xuICAgICAgICBwYXJ0aWNsZS5ncmF2aXR5ID0gdGhpcy5pbnRlcnAuYW5pbVZlY3RvclZhbChlbWl0dGVyLnByb3BzLkdyYXZpdHksIDApO1xuICAgICAgICBwYXJ0aWNsZS5saWZlU3BhbiA9IGVtaXR0ZXIucHJvcHMuTGlmZVNwYW47XG4gICAgICAgIHJldHVybiBwYXJ0aWNsZTtcbiAgICB9O1xuICAgIFBhcnRpY2xlc0NvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVBhcnRpY2xlQnVmZmVycyA9IGZ1bmN0aW9uIChwYXJ0aWNsZSwgaW5kZXgsIGVtaXR0ZXIpIHtcbiAgICAgICAgdmFyIGdsb2JhbFQgPSAxIC0gcGFydGljbGUubGlmZVNwYW4gLyBlbWl0dGVyLnByb3BzLkxpZmVTcGFuO1xuICAgICAgICB2YXIgZmlyc3RIYWxmID0gZ2xvYmFsVCA8IGVtaXR0ZXIucHJvcHMuVGltZTtcbiAgICAgICAgdmFyIHQ7XG4gICAgICAgIGlmIChmaXJzdEhhbGYpIHtcbiAgICAgICAgICAgIHQgPSBnbG9iYWxUIC8gZW1pdHRlci5wcm9wcy5UaW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdCA9IChnbG9iYWxUIC0gZW1pdHRlci5wcm9wcy5UaW1lKSAvICgxIC0gZW1pdHRlci5wcm9wcy5UaW1lKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZVBhcnRpY2xlVmVydGljZXMocGFydGljbGUsIGluZGV4LCBlbWl0dGVyLCBmaXJzdEhhbGYsIHQpO1xuICAgICAgICB0aGlzLnVwZGF0ZVBhcnRpY2xlVGV4Q29vcmRzKGluZGV4LCBlbWl0dGVyLCBmaXJzdEhhbGYsIHQpO1xuICAgICAgICB0aGlzLnVwZGF0ZVBhcnRpY2xlQ29sb3IoaW5kZXgsIGVtaXR0ZXIsIGZpcnN0SGFsZiwgdCk7XG4gICAgfTtcbiAgICBQYXJ0aWNsZXNDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVQYXJ0aWNsZVZlcnRpY2VzID0gZnVuY3Rpb24gKHBhcnRpY2xlLCBpbmRleCwgZW1pdHRlciwgZmlyc3RIYWxmLCB0KSB7XG4gICAgICAgIHZhciBmaXJzdFNjYWxlO1xuICAgICAgICB2YXIgc2Vjb25kU2NhbGU7XG4gICAgICAgIHZhciBzY2FsZTtcbiAgICAgICAgaWYgKGZpcnN0SGFsZikge1xuICAgICAgICAgICAgZmlyc3RTY2FsZSA9IGVtaXR0ZXIucHJvcHMuUGFydGljbGVTY2FsaW5nWzBdO1xuICAgICAgICAgICAgc2Vjb25kU2NhbGUgPSBlbWl0dGVyLnByb3BzLlBhcnRpY2xlU2NhbGluZ1sxXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZpcnN0U2NhbGUgPSBlbWl0dGVyLnByb3BzLlBhcnRpY2xlU2NhbGluZ1sxXTtcbiAgICAgICAgICAgIHNlY29uZFNjYWxlID0gZW1pdHRlci5wcm9wcy5QYXJ0aWNsZVNjYWxpbmdbMl07XG4gICAgICAgIH1cbiAgICAgICAgc2NhbGUgPSBpbnRlcnBfMS5sZXJwKGZpcnN0U2NhbGUsIHNlY29uZFNjYWxlLCB0KTtcbiAgICAgICAgaWYgKGVtaXR0ZXIudHlwZSAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLkhlYWQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgKytpKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5oZWFkVmVydGljZXNbaW5kZXggKiAxMiArIGkgKiAzXSA9IHRoaXMucGFydGljbGVCYXNlVmVjdG9yc1tpXVswXSAqIHNjYWxlO1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuaGVhZFZlcnRpY2VzW2luZGV4ICogMTIgKyBpICogMyArIDFdID0gdGhpcy5wYXJ0aWNsZUJhc2VWZWN0b3JzW2ldWzFdICogc2NhbGU7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5oZWFkVmVydGljZXNbaW5kZXggKiAxMiArIGkgKiAzICsgMl0gPSB0aGlzLnBhcnRpY2xlQmFzZVZlY3RvcnNbaV1bMl0gKiBzY2FsZTtcbiAgICAgICAgICAgICAgICBpZiAoZW1pdHRlci5wcm9wcy5GbGFncyAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZsYWdzLlhZUXVhZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IGVtaXR0ZXIuaGVhZFZlcnRpY2VzW2luZGV4ICogMTIgKyBpICogM107XG4gICAgICAgICAgICAgICAgICAgIHZhciB5ID0gZW1pdHRlci5oZWFkVmVydGljZXNbaW5kZXggKiAxMiArIGkgKiAzICsgMV07XG4gICAgICAgICAgICAgICAgICAgIGVtaXR0ZXIuaGVhZFZlcnRpY2VzW2luZGV4ICogMTIgKyBpICogM10gPSB4ICogTWF0aC5jb3MocGFydGljbGUuYW5nbGUpIC1cbiAgICAgICAgICAgICAgICAgICAgICAgIHkgKiBNYXRoLnNpbihwYXJ0aWNsZS5hbmdsZSk7XG4gICAgICAgICAgICAgICAgICAgIGVtaXR0ZXIuaGVhZFZlcnRpY2VzW2luZGV4ICogMTIgKyBpICogMyArIDFdID0geCAqIE1hdGguc2luKHBhcnRpY2xlLmFuZ2xlKSArXG4gICAgICAgICAgICAgICAgICAgICAgICB5ICogTWF0aC5jb3MocGFydGljbGUuYW5nbGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZW1pdHRlci50eXBlICYgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MuVGFpbCkge1xuICAgICAgICAgICAgdGFpbFBvc1swXSA9IC1wYXJ0aWNsZS5zcGVlZFswXSAqIGVtaXR0ZXIucHJvcHMuVGFpbExlbmd0aDtcbiAgICAgICAgICAgIHRhaWxQb3NbMV0gPSAtcGFydGljbGUuc3BlZWRbMV0gKiBlbWl0dGVyLnByb3BzLlRhaWxMZW5ndGg7XG4gICAgICAgICAgICB0YWlsUG9zWzJdID0gLXBhcnRpY2xlLnNwZWVkWzJdICogZW1pdHRlci5wcm9wcy5UYWlsTGVuZ3RoO1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5jcm9zcyh0YWlsQ3Jvc3MsIHBhcnRpY2xlLnNwZWVkLCB0aGlzLnJlbmRlcmVyRGF0YS5jYW1lcmFQb3MpO1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5ub3JtYWxpemUodGFpbENyb3NzLCB0YWlsQ3Jvc3MpO1xuICAgICAgICAgICAgZ2xfbWF0cml4XzEudmVjMy5zY2FsZSh0YWlsQ3Jvc3MsIHRhaWxDcm9zcywgc2NhbGUpO1xuICAgICAgICAgICAgZW1pdHRlci50YWlsVmVydGljZXNbaW5kZXggKiAxMl0gPSB0YWlsQ3Jvc3NbMF07XG4gICAgICAgICAgICBlbWl0dGVyLnRhaWxWZXJ0aWNlc1tpbmRleCAqIDEyICsgMV0gPSB0YWlsQ3Jvc3NbMV07XG4gICAgICAgICAgICBlbWl0dGVyLnRhaWxWZXJ0aWNlc1tpbmRleCAqIDEyICsgMl0gPSB0YWlsQ3Jvc3NbMl07XG4gICAgICAgICAgICBlbWl0dGVyLnRhaWxWZXJ0aWNlc1tpbmRleCAqIDEyICsgM10gPSAtdGFpbENyb3NzWzBdO1xuICAgICAgICAgICAgZW1pdHRlci50YWlsVmVydGljZXNbaW5kZXggKiAxMiArIDMgKyAxXSA9IC10YWlsQ3Jvc3NbMV07XG4gICAgICAgICAgICBlbWl0dGVyLnRhaWxWZXJ0aWNlc1tpbmRleCAqIDEyICsgMyArIDJdID0gLXRhaWxDcm9zc1syXTtcbiAgICAgICAgICAgIGVtaXR0ZXIudGFpbFZlcnRpY2VzW2luZGV4ICogMTIgKyAyICogM10gPSB0YWlsQ3Jvc3NbMF0gKyB0YWlsUG9zWzBdO1xuICAgICAgICAgICAgZW1pdHRlci50YWlsVmVydGljZXNbaW5kZXggKiAxMiArIDIgKiAzICsgMV0gPSB0YWlsQ3Jvc3NbMV0gKyB0YWlsUG9zWzFdO1xuICAgICAgICAgICAgZW1pdHRlci50YWlsVmVydGljZXNbaW5kZXggKiAxMiArIDIgKiAzICsgMl0gPSB0YWlsQ3Jvc3NbMl0gKyB0YWlsUG9zWzJdO1xuICAgICAgICAgICAgZW1pdHRlci50YWlsVmVydGljZXNbaW5kZXggKiAxMiArIDMgKiAzXSA9IC10YWlsQ3Jvc3NbMF0gKyB0YWlsUG9zWzBdO1xuICAgICAgICAgICAgZW1pdHRlci50YWlsVmVydGljZXNbaW5kZXggKiAxMiArIDMgKiAzICsgMV0gPSAtdGFpbENyb3NzWzFdICsgdGFpbFBvc1sxXTtcbiAgICAgICAgICAgIGVtaXR0ZXIudGFpbFZlcnRpY2VzW2luZGV4ICogMTIgKyAzICogMyArIDJdID0gLXRhaWxDcm9zc1syXSArIHRhaWxQb3NbMl07XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyArK2kpIHtcbiAgICAgICAgICAgIGlmIChlbWl0dGVyLmhlYWRWZXJ0aWNlcykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuaGVhZFZlcnRpY2VzW2luZGV4ICogMTIgKyBpICogM10gKz0gcGFydGljbGUucG9zWzBdO1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuaGVhZFZlcnRpY2VzW2luZGV4ICogMTIgKyBpICogMyArIDFdICs9IHBhcnRpY2xlLnBvc1sxXTtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLmhlYWRWZXJ0aWNlc1tpbmRleCAqIDEyICsgaSAqIDMgKyAyXSArPSBwYXJ0aWNsZS5wb3NbMl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZW1pdHRlci50YWlsVmVydGljZXMpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLnRhaWxWZXJ0aWNlc1tpbmRleCAqIDEyICsgaSAqIDNdICs9IHBhcnRpY2xlLnBvc1swXTtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLnRhaWxWZXJ0aWNlc1tpbmRleCAqIDEyICsgaSAqIDMgKyAxXSArPSBwYXJ0aWNsZS5wb3NbMV07XG4gICAgICAgICAgICAgICAgZW1pdHRlci50YWlsVmVydGljZXNbaW5kZXggKiAxMiArIGkgKiAzICsgMl0gKz0gcGFydGljbGUucG9zWzJdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBQYXJ0aWNsZXNDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVQYXJ0aWNsZVRleENvb3JkcyA9IGZ1bmN0aW9uIChpbmRleCwgZW1pdHRlciwgZmlyc3RIYWxmLCB0KSB7XG4gICAgICAgIGlmIChlbWl0dGVyLnR5cGUgJiBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5IZWFkKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVBhcnRpY2xlVGV4Q29vcmRzQnlUeXBlKGluZGV4LCBlbWl0dGVyLCBmaXJzdEhhbGYsIHQsIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLkhlYWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbWl0dGVyLnR5cGUgJiBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5UYWlsKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVBhcnRpY2xlVGV4Q29vcmRzQnlUeXBlKGluZGV4LCBlbWl0dGVyLCBmaXJzdEhhbGYsIHQsIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLlRhaWwpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQYXJ0aWNsZXNDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVQYXJ0aWNsZVRleENvb3Jkc0J5VHlwZSA9IGZ1bmN0aW9uIChpbmRleCwgZW1pdHRlciwgZmlyc3RIYWxmLCB0LCB0eXBlKSB7XG4gICAgICAgIHZhciB1dkFuaW07XG4gICAgICAgIHZhciB0ZXhDb29yZHM7XG4gICAgICAgIGlmICh0eXBlID09PSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5UYWlsKSB7XG4gICAgICAgICAgICB1dkFuaW0gPSBmaXJzdEhhbGYgPyBlbWl0dGVyLnByb3BzLlRhaWxVVkFuaW0gOiBlbWl0dGVyLnByb3BzLlRhaWxEZWNheVVWQW5pbTtcbiAgICAgICAgICAgIHRleENvb3JkcyA9IGVtaXR0ZXIudGFpbFRleENvb3JkcztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHV2QW5pbSA9IGZpcnN0SGFsZiA/IGVtaXR0ZXIucHJvcHMuTGlmZVNwYW5VVkFuaW0gOiBlbWl0dGVyLnByb3BzLkRlY2F5VVZBbmltO1xuICAgICAgICAgICAgdGV4Q29vcmRzID0gZW1pdHRlci5oZWFkVGV4Q29vcmRzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBmaXJzdEZyYW1lID0gdXZBbmltWzBdO1xuICAgICAgICB2YXIgc2Vjb25kRnJhbWUgPSB1dkFuaW1bMV07XG4gICAgICAgIHZhciBmcmFtZSA9IE1hdGgucm91bmQoaW50ZXJwXzEubGVycChmaXJzdEZyYW1lLCBzZWNvbmRGcmFtZSwgdCkpO1xuICAgICAgICB2YXIgdGV4Q29vcmRYID0gZnJhbWUgJSBlbWl0dGVyLnByb3BzLkNvbHVtbnM7XG4gICAgICAgIHZhciB0ZXhDb29yZFkgPSBNYXRoLmZsb29yKGZyYW1lIC8gZW1pdHRlci5wcm9wcy5Sb3dzKTtcbiAgICAgICAgdmFyIGNlbGxXaWR0aCA9IDEgLyBlbWl0dGVyLnByb3BzLkNvbHVtbnM7XG4gICAgICAgIHZhciBjZWxsSGVpZ2h0ID0gMSAvIGVtaXR0ZXIucHJvcHMuUm93cztcbiAgICAgICAgdGV4Q29vcmRzW2luZGV4ICogOF0gPSB0ZXhDb29yZFggKiBjZWxsV2lkdGg7XG4gICAgICAgIHRleENvb3Jkc1tpbmRleCAqIDggKyAxXSA9IHRleENvb3JkWSAqIGNlbGxIZWlnaHQ7XG4gICAgICAgIHRleENvb3Jkc1tpbmRleCAqIDggKyAyXSA9IHRleENvb3JkWCAqIGNlbGxXaWR0aDtcbiAgICAgICAgdGV4Q29vcmRzW2luZGV4ICogOCArIDNdID0gKDEgKyB0ZXhDb29yZFkpICogY2VsbEhlaWdodDtcbiAgICAgICAgdGV4Q29vcmRzW2luZGV4ICogOCArIDRdID0gKDEgKyB0ZXhDb29yZFgpICogY2VsbFdpZHRoO1xuICAgICAgICB0ZXhDb29yZHNbaW5kZXggKiA4ICsgNV0gPSB0ZXhDb29yZFkgKiBjZWxsSGVpZ2h0O1xuICAgICAgICB0ZXhDb29yZHNbaW5kZXggKiA4ICsgNl0gPSAoMSArIHRleENvb3JkWCkgKiBjZWxsV2lkdGg7XG4gICAgICAgIHRleENvb3Jkc1tpbmRleCAqIDggKyA3XSA9ICgxICsgdGV4Q29vcmRZKSAqIGNlbGxIZWlnaHQ7XG4gICAgfTtcbiAgICBQYXJ0aWNsZXNDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVQYXJ0aWNsZUNvbG9yID0gZnVuY3Rpb24gKGluZGV4LCBlbWl0dGVyLCBmaXJzdEhhbGYsIHQpIHtcbiAgICAgICAgaWYgKGZpcnN0SGFsZikge1xuICAgICAgICAgICAgZmlyc3RDb2xvclswXSA9IGVtaXR0ZXIucHJvcHMuU2VnbWVudENvbG9yWzBdWzBdO1xuICAgICAgICAgICAgZmlyc3RDb2xvclsxXSA9IGVtaXR0ZXIucHJvcHMuU2VnbWVudENvbG9yWzBdWzFdO1xuICAgICAgICAgICAgZmlyc3RDb2xvclsyXSA9IGVtaXR0ZXIucHJvcHMuU2VnbWVudENvbG9yWzBdWzJdO1xuICAgICAgICAgICAgZmlyc3RDb2xvclszXSA9IGVtaXR0ZXIucHJvcHMuQWxwaGFbMF0gLyAyNTU7XG4gICAgICAgICAgICBzZWNvbmRDb2xvclswXSA9IGVtaXR0ZXIucHJvcHMuU2VnbWVudENvbG9yWzFdWzBdO1xuICAgICAgICAgICAgc2Vjb25kQ29sb3JbMV0gPSBlbWl0dGVyLnByb3BzLlNlZ21lbnRDb2xvclsxXVsxXTtcbiAgICAgICAgICAgIHNlY29uZENvbG9yWzJdID0gZW1pdHRlci5wcm9wcy5TZWdtZW50Q29sb3JbMV1bMl07XG4gICAgICAgICAgICBzZWNvbmRDb2xvclszXSA9IGVtaXR0ZXIucHJvcHMuQWxwaGFbMV0gLyAyNTU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmaXJzdENvbG9yWzBdID0gZW1pdHRlci5wcm9wcy5TZWdtZW50Q29sb3JbMV1bMF07XG4gICAgICAgICAgICBmaXJzdENvbG9yWzFdID0gZW1pdHRlci5wcm9wcy5TZWdtZW50Q29sb3JbMV1bMV07XG4gICAgICAgICAgICBmaXJzdENvbG9yWzJdID0gZW1pdHRlci5wcm9wcy5TZWdtZW50Q29sb3JbMV1bMl07XG4gICAgICAgICAgICBmaXJzdENvbG9yWzNdID0gZW1pdHRlci5wcm9wcy5BbHBoYVsxXSAvIDI1NTtcbiAgICAgICAgICAgIHNlY29uZENvbG9yWzBdID0gZW1pdHRlci5wcm9wcy5TZWdtZW50Q29sb3JbMl1bMF07XG4gICAgICAgICAgICBzZWNvbmRDb2xvclsxXSA9IGVtaXR0ZXIucHJvcHMuU2VnbWVudENvbG9yWzJdWzFdO1xuICAgICAgICAgICAgc2Vjb25kQ29sb3JbMl0gPSBlbWl0dGVyLnByb3BzLlNlZ21lbnRDb2xvclsyXVsyXTtcbiAgICAgICAgICAgIHNlY29uZENvbG9yWzNdID0gZW1pdHRlci5wcm9wcy5BbHBoYVsyXSAvIDI1NTtcbiAgICAgICAgfVxuICAgICAgICBnbF9tYXRyaXhfMS52ZWM0LmxlcnAoY29sb3IsIGZpcnN0Q29sb3IsIHNlY29uZENvbG9yLCB0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyArK2kpIHtcbiAgICAgICAgICAgIGVtaXR0ZXIuY29sb3JzW2luZGV4ICogMTYgKyBpICogNF0gPSBjb2xvclswXTtcbiAgICAgICAgICAgIGVtaXR0ZXIuY29sb3JzW2luZGV4ICogMTYgKyBpICogNCArIDFdID0gY29sb3JbMV07XG4gICAgICAgICAgICBlbWl0dGVyLmNvbG9yc1tpbmRleCAqIDE2ICsgaSAqIDQgKyAyXSA9IGNvbG9yWzJdO1xuICAgICAgICAgICAgZW1pdHRlci5jb2xvcnNbaW5kZXggKiAxNiArIGkgKiA0ICsgM10gPSBjb2xvclszXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGFydGljbGVzQ29udHJvbGxlci5wcm90b3R5cGUuc2V0TGF5ZXJQcm9wcyA9IGZ1bmN0aW9uIChlbWl0dGVyKSB7XG4gICAgICAgIGlmIChlbWl0dGVyLnByb3BzLkZpbHRlck1vZGUgPT09IG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGUuQWxwaGFLZXkpIHtcbiAgICAgICAgICAgIGdsLnVuaWZvcm0xZihzaGFkZXJQcm9ncmFtTG9jYXRpb25zLmRpc2NhcmRBbHBoYUxldmVsVW5pZm9ybSwgRElTQ0FSRF9BTFBIQV9LRVlfTEVWRUwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVtaXR0ZXIucHJvcHMuRmlsdGVyTW9kZSA9PT0gbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZS5Nb2R1bGF0ZSB8fFxuICAgICAgICAgICAgZW1pdHRlci5wcm9wcy5GaWx0ZXJNb2RlID09PSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlLk1vZHVsYXRlMngpIHtcbiAgICAgICAgICAgIGdsLnVuaWZvcm0xZihzaGFkZXJQcm9ncmFtTG9jYXRpb25zLmRpc2NhcmRBbHBoYUxldmVsVW5pZm9ybSwgRElTQ0FSRF9NT0RVTEFURV9MRVZFTCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBnbC51bmlmb3JtMWYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5kaXNjYXJkQWxwaGFMZXZlbFVuaWZvcm0sIDAuKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW1pdHRlci5wcm9wcy5GaWx0ZXJNb2RlID09PSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlLkJsZW5kKSB7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICAgICAgZ2wuYmxlbmRGdW5jU2VwYXJhdGUoZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBLCBnbC5PTkUsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xuICAgICAgICAgICAgZ2wuZGVwdGhNYXNrKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlbWl0dGVyLnByb3BzLkZpbHRlck1vZGUgPT09IG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGUuQWRkaXRpdmUpIHtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgICAgICAgICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLCBnbC5PTkUpO1xuICAgICAgICAgICAgZ2wuZGVwdGhNYXNrKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlbWl0dGVyLnByb3BzLkZpbHRlck1vZGUgPT09IG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGUuQWxwaGFLZXkpIHtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgICAgICAgICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLCBnbC5PTkUpO1xuICAgICAgICAgICAgZ2wuZGVwdGhNYXNrKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlbWl0dGVyLnByb3BzLkZpbHRlck1vZGUgPT09IG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGUuTW9kdWxhdGUpIHtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgICAgICAgICBnbC5ibGVuZEZ1bmNTZXBhcmF0ZShnbC5aRVJPLCBnbC5TUkNfQ09MT1IsIGdsLlpFUk8sIGdsLk9ORSk7XG4gICAgICAgICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVtaXR0ZXIucHJvcHMuRmlsdGVyTW9kZSA9PT0gbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZS5Nb2R1bGF0ZTJ4KSB7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICAgICAgZ2wuYmxlbmRGdW5jU2VwYXJhdGUoZ2wuRFNUX0NPTE9SLCBnbC5TUkNfQ09MT1IsIGdsLlpFUk8sIGdsLk9ORSk7XG4gICAgICAgICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0ZXh0dXJlID0gdGhpcy5yZW5kZXJlckRhdGEubW9kZWwuVGV4dHVyZXNbZW1pdHRlci5wcm9wcy5UZXh0dXJlSURdO1xuICAgICAgICBpZiAodGV4dHVyZS5JbWFnZSkge1xuICAgICAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCk7XG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnJlbmRlcmVyRGF0YS50ZXh0dXJlc1t0ZXh0dXJlLkltYWdlXSk7XG4gICAgICAgICAgICBnbC51bmlmb3JtMWkoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5zYW1wbGVyVW5pZm9ybSwgMCk7XG4gICAgICAgICAgICBnbC51bmlmb3JtMWYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5yZXBsYWNlYWJsZVR5cGVVbmlmb3JtLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ZXh0dXJlLlJlcGxhY2VhYmxlSWQgPT09IDEgfHwgdGV4dHVyZS5SZXBsYWNlYWJsZUlkID09PSAyKSB7XG4gICAgICAgICAgICBnbC51bmlmb3JtM2Z2KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMucmVwbGFjZWFibGVDb2xvclVuaWZvcm0sIHRoaXMucmVuZGVyZXJEYXRhLnRlYW1Db2xvcik7XG4gICAgICAgICAgICBnbC51bmlmb3JtMWYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5yZXBsYWNlYWJsZVR5cGVVbmlmb3JtLCB0ZXh0dXJlLlJlcGxhY2VhYmxlSWQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQYXJ0aWNsZXNDb250cm9sbGVyLnByb3RvdHlwZS5zZXRHZW5lcmFsQnVmZmVycyA9IGZ1bmN0aW9uIChlbWl0dGVyKSB7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBlbWl0dGVyLmNvbG9yQnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGVtaXR0ZXIuY29sb3JzLCBnbC5EWU5BTUlDX0RSQVcpO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlclByb2dyYW1Mb2NhdGlvbnMuY29sb3JBdHRyaWJ1dGUsIDQsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGVtaXR0ZXIuaW5kZXhCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBlbWl0dGVyLmluZGljZXMsIGdsLkRZTkFNSUNfRFJBVyk7XG4gICAgfTtcbiAgICBQYXJ0aWNsZXNDb250cm9sbGVyLnByb3RvdHlwZS5yZW5kZXJFbWl0dGVyVHlwZSA9IGZ1bmN0aW9uIChlbWl0dGVyLCB0eXBlKSB7XG4gICAgICAgIGlmICh0eXBlID09PSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5UYWlsKSB7XG4gICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgZW1pdHRlci50YWlsVGV4Q29vcmRCdWZmZXIpO1xuICAgICAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGVtaXR0ZXIudGFpbFRleENvb3JkcywgZ2wuRFlOQU1JQ19EUkFXKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBlbWl0dGVyLmhlYWRUZXhDb29yZEJ1ZmZlcik7XG4gICAgICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZW1pdHRlci5oZWFkVGV4Q29vcmRzLCBnbC5EWU5BTUlDX0RSQVcpO1xuICAgICAgICB9XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG4gICAgICAgIGlmICh0eXBlID09PSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5UYWlsKSB7XG4gICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgZW1pdHRlci50YWlsVmVydGV4QnVmZmVyKTtcbiAgICAgICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBlbWl0dGVyLnRhaWxWZXJ0aWNlcywgZ2wuRFlOQU1JQ19EUkFXKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBlbWl0dGVyLmhlYWRWZXJ0ZXhCdWZmZXIpO1xuICAgICAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGVtaXR0ZXIuaGVhZFZlcnRpY2VzLCBnbC5EWU5BTUlDX0RSQVcpO1xuICAgICAgICB9XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSwgMywgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgZ2wuZHJhd0VsZW1lbnRzKGdsLlRSSUFOR0xFUywgZW1pdHRlci5wYXJ0aWNsZXMubGVuZ3RoICogNiwgZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuICAgIH07XG4gICAgcmV0dXJuIFBhcnRpY2xlc0NvbnRyb2xsZXI7XG59KCkpO1xuZXhwb3J0cy5QYXJ0aWNsZXNDb250cm9sbGVyID0gUGFydGljbGVzQ29udHJvbGxlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBhcnRpY2xlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB1dGlsXzEgPSByZXF1aXJlKFwiLi91dGlsXCIpO1xudmFyIG1vZGVsSW50ZXJwXzEgPSByZXF1aXJlKFwiLi9tb2RlbEludGVycFwiKTtcbnZhciBtb2RlbF8xID0gcmVxdWlyZShcIi4uL21vZGVsXCIpO1xudmFyIGdsX21hdHJpeF8xID0gcmVxdWlyZShcImdsLW1hdHJpeFwiKTtcbnZhciBnbDtcbnZhciBzaGFkZXJQcm9ncmFtO1xudmFyIHNoYWRlclByb2dyYW1Mb2NhdGlvbnMgPSB7fTtcbnZhciB2ZXJ0ZXhTaGFkZXIgPSBcIlxcbiAgICBhdHRyaWJ1dGUgdmVjMyBhVmVydGV4UG9zaXRpb247XFxuICAgIGF0dHJpYnV0ZSB2ZWMyIGFUZXh0dXJlQ29vcmQ7XFxuXFxuICAgIHVuaWZvcm0gbWF0NCB1TVZNYXRyaXg7XFxuICAgIHVuaWZvcm0gbWF0NCB1UE1hdHJpeDtcXG5cXG4gICAgdmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XFxuXFxuICAgIHZvaWQgbWFpbih2b2lkKSB7XFxuICAgICAgICB2ZWM0IHBvc2l0aW9uID0gdmVjNChhVmVydGV4UG9zaXRpb24sIDEuMCk7XFxuICAgICAgICBnbF9Qb3NpdGlvbiA9IHVQTWF0cml4ICogdU1WTWF0cml4ICogcG9zaXRpb247XFxuICAgICAgICB2VGV4dHVyZUNvb3JkID0gYVRleHR1cmVDb29yZDtcXG4gICAgfVxcblwiO1xudmFyIGZyYWdtZW50U2hhZGVyID0gXCJcXG4gICAgcHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XFxuXFxuICAgIHZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1xcblxcbiAgICB1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcXG4gICAgdW5pZm9ybSB2ZWMzIHVSZXBsYWNlYWJsZUNvbG9yO1xcbiAgICB1bmlmb3JtIGZsb2F0IHVSZXBsYWNlYWJsZVR5cGU7XFxuICAgIHVuaWZvcm0gZmxvYXQgdURpc2NhcmRBbHBoYUxldmVsO1xcbiAgICB1bmlmb3JtIHZlYzQgdUNvbG9yO1xcblxcbiAgICBmbG9hdCBoeXBvdCAodmVjMiB6KSB7XFxuICAgICAgICBmbG9hdCB0O1xcbiAgICAgICAgZmxvYXQgeCA9IGFicyh6LngpO1xcbiAgICAgICAgZmxvYXQgeSA9IGFicyh6LnkpO1xcbiAgICAgICAgdCA9IG1pbih4LCB5KTtcXG4gICAgICAgIHggPSBtYXgoeCwgeSk7XFxuICAgICAgICB0ID0gdCAvIHg7XFxuICAgICAgICByZXR1cm4gKHoueCA9PSAwLjAgJiYgei55ID09IDAuMCkgPyAwLjAgOiB4ICogc3FydCgxLjAgKyB0ICogdCk7XFxuICAgIH1cXG5cXG4gICAgdm9pZCBtYWluKHZvaWQpIHtcXG4gICAgICAgIHZlYzIgY29vcmRzID0gdmVjMih2VGV4dHVyZUNvb3JkLnMsIHZUZXh0dXJlQ29vcmQudCk7XFxuICAgICAgICBpZiAodVJlcGxhY2VhYmxlVHlwZSA9PSAwLikge1xcbiAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1U2FtcGxlciwgY29vcmRzKTtcXG4gICAgICAgIH0gZWxzZSBpZiAodVJlcGxhY2VhYmxlVHlwZSA9PSAxLikge1xcbiAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQodVJlcGxhY2VhYmxlQ29sb3IsIDEuMCk7XFxuICAgICAgICB9IGVsc2UgaWYgKHVSZXBsYWNlYWJsZVR5cGUgPT0gMi4pIHtcXG4gICAgICAgICAgICBmbG9hdCBkaXN0ID0gaHlwb3QoY29vcmRzIC0gdmVjMigwLjUsIDAuNSkpICogMi47XFxuICAgICAgICAgICAgZmxvYXQgdHJ1bmNhdGVEaXN0ID0gY2xhbXAoMS4gLSBkaXN0ICogMS40LCAwLiwgMS4pO1xcbiAgICAgICAgICAgIGZsb2F0IGFscGhhID0gc2luKHRydW5jYXRlRGlzdCk7XFxuICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCh1UmVwbGFjZWFibGVDb2xvciAqIGFscGhhLCAxLjApO1xcbiAgICAgICAgfVxcbiAgICAgICAgZ2xfRnJhZ0NvbG9yICo9IHVDb2xvcjtcXG4gICAgICAgIFxcbiAgICAgICAgaWYgKGdsX0ZyYWdDb2xvclszXSA8IHVEaXNjYXJkQWxwaGFMZXZlbCkge1xcbiAgICAgICAgICAgIGRpc2NhcmQ7XFxuICAgICAgICB9XFxuICAgIH1cXG5cIjtcbnZhciBSaWJib25zQ29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmliYm9uc0NvbnRyb2xsZXIoaW50ZXJwLCByZW5kZXJlckRhdGEpIHtcbiAgICAgICAgdGhpcy5pbnRlcnAgPSBpbnRlcnA7XG4gICAgICAgIHRoaXMucmVuZGVyZXJEYXRhID0gcmVuZGVyZXJEYXRhO1xuICAgICAgICB0aGlzLmVtaXR0ZXJzID0gW107XG4gICAgICAgIGlmIChyZW5kZXJlckRhdGEubW9kZWwuUmliYm9uRW1pdHRlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gcmVuZGVyZXJEYXRhLm1vZGVsLlJpYmJvbkVtaXR0ZXJzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgIHZhciByaWJib25FbWl0dGVyID0gX2FbX2ldO1xuICAgICAgICAgICAgICAgIHZhciBlbWl0dGVyID0ge1xuICAgICAgICAgICAgICAgICAgICBlbWlzc2lvbjogMCxcbiAgICAgICAgICAgICAgICAgICAgcHJvcHM6IHJpYmJvbkVtaXR0ZXIsXG4gICAgICAgICAgICAgICAgICAgIGNhcGFjaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICBiYXNlQ2FwYWNpdHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0aW9uVGltZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNlczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgdmVydGV4QnVmZmVyOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB0ZXhDb29yZHM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIHRleENvb3JkQnVmZmVyOiBudWxsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLmJhc2VDYXBhY2l0eSA9IE1hdGguY2VpbChtb2RlbEludGVycF8xLk1vZGVsSW50ZXJwLm1heEFuaW1WZWN0b3JWYWwoZW1pdHRlci5wcm9wcy5FbWlzc2lvblJhdGUpICogZW1pdHRlci5wcm9wcy5MaWZlU3BhbikgKyAxOyAvLyBleHRyYSBwb2ludHNcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXJzLnB1c2goZW1pdHRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgUmliYm9uc0NvbnRyb2xsZXIuaW5pdEdMID0gZnVuY3Rpb24gKGdsQ29udGV4dCkge1xuICAgICAgICBnbCA9IGdsQ29udGV4dDtcbiAgICAgICAgUmliYm9uc0NvbnRyb2xsZXIuaW5pdFNoYWRlcnMoKTtcbiAgICB9O1xuICAgIFJpYmJvbnNDb250cm9sbGVyLmluaXRTaGFkZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdmVydGV4ID0gdXRpbF8xLmdldFNoYWRlcihnbCwgdmVydGV4U2hhZGVyLCBnbC5WRVJURVhfU0hBREVSKTtcbiAgICAgICAgdmFyIGZyYWdtZW50ID0gdXRpbF8xLmdldFNoYWRlcihnbCwgZnJhZ21lbnRTaGFkZXIsIGdsLkZSQUdNRU5UX1NIQURFUik7XG4gICAgICAgIHNoYWRlclByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgIGdsLmF0dGFjaFNoYWRlcihzaGFkZXJQcm9ncmFtLCB2ZXJ0ZXgpO1xuICAgICAgICBnbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgZnJhZ21lbnQpO1xuICAgICAgICBnbC5saW5rUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcbiAgICAgICAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHNoYWRlclByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSkge1xuICAgICAgICAgICAgYWxlcnQoJ0NvdWxkIG5vdCBpbml0aWFsaXNlIHNoYWRlcnMnKTtcbiAgICAgICAgfVxuICAgICAgICBnbC51c2VQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xuICAgICAgICBzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlID1cbiAgICAgICAgICAgIGdsLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sICdhVmVydGV4UG9zaXRpb24nKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUgPVxuICAgICAgICAgICAgZ2wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ2FUZXh0dXJlQ29vcmQnKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5wTWF0cml4VW5pZm9ybSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAndVBNYXRyaXgnKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5tdk1hdHJpeFVuaWZvcm0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ3VNVk1hdHJpeCcpO1xuICAgICAgICBzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnNhbXBsZXJVbmlmb3JtID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sICd1U2FtcGxlcicpO1xuICAgICAgICBzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnJlcGxhY2VhYmxlQ29sb3JVbmlmb3JtID1cbiAgICAgICAgICAgIGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAndVJlcGxhY2VhYmxlQ29sb3InKTtcbiAgICAgICAgc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5yZXBsYWNlYWJsZVR5cGVVbmlmb3JtID1cbiAgICAgICAgICAgIGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAndVJlcGxhY2VhYmxlVHlwZScpO1xuICAgICAgICBzaGFkZXJQcm9ncmFtTG9jYXRpb25zLmRpc2NhcmRBbHBoYUxldmVsVW5pZm9ybSA9XG4gICAgICAgICAgICBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ3VEaXNjYXJkQWxwaGFMZXZlbCcpO1xuICAgICAgICBzaGFkZXJQcm9ncmFtTG9jYXRpb25zLmNvbG9yVW5pZm9ybSA9XG4gICAgICAgICAgICBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ3VDb2xvcicpO1xuICAgIH07XG4gICAgUmliYm9uc0NvbnRyb2xsZXIucmVzaXplRW1pdHRlckJ1ZmZlcnMgPSBmdW5jdGlvbiAoZW1pdHRlciwgc2l6ZSkge1xuICAgICAgICBpZiAoc2l6ZSA8PSBlbWl0dGVyLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc2l6ZSA9IE1hdGgubWluKHNpemUsIGVtaXR0ZXIuYmFzZUNhcGFjaXR5KTtcbiAgICAgICAgdmFyIHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShzaXplICogMiAqIDMpOyAvLyAyIHZlcnRpY2VzICogeHl6XG4gICAgICAgIHZhciB0ZXhDb29yZHMgPSBuZXcgRmxvYXQzMkFycmF5KHNpemUgKiAyICogMik7IC8vIDIgdmVydGljZXMgKiB4eVxuICAgICAgICBpZiAoZW1pdHRlci52ZXJ0aWNlcykge1xuICAgICAgICAgICAgdmVydGljZXMuc2V0KGVtaXR0ZXIudmVydGljZXMpO1xuICAgICAgICB9XG4gICAgICAgIGVtaXR0ZXIudmVydGljZXMgPSB2ZXJ0aWNlcztcbiAgICAgICAgZW1pdHRlci50ZXhDb29yZHMgPSB0ZXhDb29yZHM7XG4gICAgICAgIGVtaXR0ZXIuY2FwYWNpdHkgPSBzaXplO1xuICAgICAgICBpZiAoIWVtaXR0ZXIudmVydGV4QnVmZmVyKSB7XG4gICAgICAgICAgICBlbWl0dGVyLnZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICAgICAgZW1pdHRlci50ZXhDb29yZEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBSaWJib25zQ29udHJvbGxlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB0aGlzLmVtaXR0ZXJzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIGVtaXR0ZXIgPSBfYVtfaV07XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUVtaXR0ZXIoZW1pdHRlciwgZGVsdGEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBSaWJib25zQ29udHJvbGxlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKG12TWF0cml4LCBwTWF0cml4KSB7XG4gICAgICAgIGdsLnVzZVByb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XG4gICAgICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5wTWF0cml4VW5pZm9ybSwgZmFsc2UsIHBNYXRyaXgpO1xuICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMubXZNYXRyaXhVbmlmb3JtLCBmYWxzZSwgbXZNYXRyaXgpO1xuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUpO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdGhpcy5lbWl0dGVyczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBlbWl0dGVyID0gX2FbX2ldO1xuICAgICAgICAgICAgaWYgKGVtaXR0ZXIuY3JlYXRpb25UaW1lcy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnbC51bmlmb3JtNGYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5jb2xvclVuaWZvcm0sIGVtaXR0ZXIucHJvcHMuQ29sb3JbMF0sIGVtaXR0ZXIucHJvcHMuQ29sb3JbMV0sIGVtaXR0ZXIucHJvcHMuQ29sb3JbMl0sIHRoaXMuaW50ZXJwLmFuaW1WZWN0b3JWYWwoZW1pdHRlci5wcm9wcy5BbHBoYSwgMSkpO1xuICAgICAgICAgICAgdGhpcy5zZXRHZW5lcmFsQnVmZmVycyhlbWl0dGVyKTtcbiAgICAgICAgICAgIHZhciBtYXRlcmlhbElEID0gZW1pdHRlci5wcm9wcy5NYXRlcmlhbElEO1xuICAgICAgICAgICAgdmFyIG1hdGVyaWFsID0gdGhpcy5yZW5kZXJlckRhdGEubW9kZWwuTWF0ZXJpYWxzW21hdGVyaWFsSURdO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBtYXRlcmlhbC5MYXllcnMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldExheWVyUHJvcHMobWF0ZXJpYWwuTGF5ZXJzW2pdLCB0aGlzLnJlbmRlcmVyRGF0YS5tYXRlcmlhbExheWVyVGV4dHVyZUlEW21hdGVyaWFsSURdW2pdKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckVtaXR0ZXIoZW1pdHRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW1Mb2NhdGlvbnMudmVydGV4UG9zaXRpb25BdHRyaWJ1dGUpO1xuICAgICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUpO1xuICAgIH07XG4gICAgUmliYm9uc0NvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZUVtaXR0ZXIgPSBmdW5jdGlvbiAoZW1pdHRlciwgZGVsdGEpIHtcbiAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIHZhciB2aXNpYmlsaXR5ID0gdGhpcy5pbnRlcnAuYW5pbVZlY3RvclZhbChlbWl0dGVyLnByb3BzLlZpc2liaWxpdHksIDEpO1xuICAgICAgICBpZiAodmlzaWJpbGl0eSA+IDApIHtcbiAgICAgICAgICAgIHZhciBlbWlzc2lvblJhdGUgPSBlbWl0dGVyLnByb3BzLkVtaXNzaW9uUmF0ZTtcbiAgICAgICAgICAgIGVtaXR0ZXIuZW1pc3Npb24gKz0gZW1pc3Npb25SYXRlICogZGVsdGE7XG4gICAgICAgICAgICBpZiAoZW1pdHRlci5lbWlzc2lvbiA+PSAxMDAwKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBvbmNlIHBlciB0aWNrXG4gICAgICAgICAgICAgICAgZW1pdHRlci5lbWlzc2lvbiA9IGVtaXR0ZXIuZW1pc3Npb24gJSAxMDAwO1xuICAgICAgICAgICAgICAgIGlmIChlbWl0dGVyLmNyZWF0aW9uVGltZXMubGVuZ3RoICsgMSA+IGVtaXR0ZXIuY2FwYWNpdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgUmliYm9uc0NvbnRyb2xsZXIucmVzaXplRW1pdHRlckJ1ZmZlcnMoZW1pdHRlciwgZW1pdHRlci5jcmVhdGlvblRpbWVzLmxlbmd0aCArIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZFZlcnRpY2VzKGVtaXR0ZXIpO1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuY3JlYXRpb25UaW1lcy5wdXNoKG5vdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVtaXR0ZXIuY3JlYXRpb25UaW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHdoaWxlIChlbWl0dGVyLmNyZWF0aW9uVGltZXNbMF0gKyBlbWl0dGVyLnByb3BzLkxpZmVTcGFuICogMTAwMCA8IG5vdykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuY3JlYXRpb25UaW1lcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpICsgNiArIDUgPCBlbWl0dGVyLnZlcnRpY2VzLmxlbmd0aDsgaSArPSA2KSB7XG4gICAgICAgICAgICAgICAgICAgIGVtaXR0ZXIudmVydGljZXNbaV0gPSBlbWl0dGVyLnZlcnRpY2VzW2kgKyA2XTtcbiAgICAgICAgICAgICAgICAgICAgZW1pdHRlci52ZXJ0aWNlc1tpICsgMV0gPSBlbWl0dGVyLnZlcnRpY2VzW2kgKyA3XTtcbiAgICAgICAgICAgICAgICAgICAgZW1pdHRlci52ZXJ0aWNlc1tpICsgMl0gPSBlbWl0dGVyLnZlcnRpY2VzW2kgKyA4XTtcbiAgICAgICAgICAgICAgICAgICAgZW1pdHRlci52ZXJ0aWNlc1tpICsgM10gPSBlbWl0dGVyLnZlcnRpY2VzW2kgKyA5XTtcbiAgICAgICAgICAgICAgICAgICAgZW1pdHRlci52ZXJ0aWNlc1tpICsgNF0gPSBlbWl0dGVyLnZlcnRpY2VzW2kgKyAxMF07XG4gICAgICAgICAgICAgICAgICAgIGVtaXR0ZXIudmVydGljZXNbaSArIDVdID0gZW1pdHRlci52ZXJ0aWNlc1tpICsgMTFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBzdGlsbCBleGlzdHNcbiAgICAgICAgaWYgKGVtaXR0ZXIuY3JlYXRpb25UaW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRW1pdHRlclRleENvb3JkcyhlbWl0dGVyLCBub3cpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBSaWJib25zQ29udHJvbGxlci5wcm90b3R5cGUuYXBwZW5kVmVydGljZXMgPSBmdW5jdGlvbiAoZW1pdHRlcikge1xuICAgICAgICB2YXIgZmlyc3QgPSBnbF9tYXRyaXhfMS52ZWMzLmNsb25lKGVtaXR0ZXIucHJvcHMuUGl2b3RQb2ludCk7XG4gICAgICAgIHZhciBzZWNvbmQgPSBnbF9tYXRyaXhfMS52ZWMzLmNsb25lKGVtaXR0ZXIucHJvcHMuUGl2b3RQb2ludCk7XG4gICAgICAgIGZpcnN0WzFdIC09IHRoaXMuaW50ZXJwLmFuaW1WZWN0b3JWYWwoZW1pdHRlci5wcm9wcy5IZWlnaHRCZWxvdywgMCk7XG4gICAgICAgIHNlY29uZFsxXSArPSB0aGlzLmludGVycC5hbmltVmVjdG9yVmFsKGVtaXR0ZXIucHJvcHMuSGVpZ2h0QWJvdmUsIDApO1xuICAgICAgICB2YXIgZW1pdHRlck1hdHJpeCA9IHRoaXMucmVuZGVyZXJEYXRhLm5vZGVzW2VtaXR0ZXIucHJvcHMuT2JqZWN0SWRdLm1hdHJpeDtcbiAgICAgICAgZ2xfbWF0cml4XzEudmVjMy50cmFuc2Zvcm1NYXQ0KGZpcnN0LCBmaXJzdCwgZW1pdHRlck1hdHJpeCk7XG4gICAgICAgIGdsX21hdHJpeF8xLnZlYzMudHJhbnNmb3JtTWF0NChzZWNvbmQsIHNlY29uZCwgZW1pdHRlck1hdHJpeCk7XG4gICAgICAgIHZhciBjdXJyZW50U2l6ZSA9IGVtaXR0ZXIuY3JlYXRpb25UaW1lcy5sZW5ndGg7XG4gICAgICAgIGVtaXR0ZXIudmVydGljZXNbY3VycmVudFNpemUgKiA2XSA9IGZpcnN0WzBdO1xuICAgICAgICBlbWl0dGVyLnZlcnRpY2VzW2N1cnJlbnRTaXplICogNiArIDFdID0gZmlyc3RbMV07XG4gICAgICAgIGVtaXR0ZXIudmVydGljZXNbY3VycmVudFNpemUgKiA2ICsgMl0gPSBmaXJzdFsyXTtcbiAgICAgICAgZW1pdHRlci52ZXJ0aWNlc1tjdXJyZW50U2l6ZSAqIDYgKyAzXSA9IHNlY29uZFswXTtcbiAgICAgICAgZW1pdHRlci52ZXJ0aWNlc1tjdXJyZW50U2l6ZSAqIDYgKyA0XSA9IHNlY29uZFsxXTtcbiAgICAgICAgZW1pdHRlci52ZXJ0aWNlc1tjdXJyZW50U2l6ZSAqIDYgKyA1XSA9IHNlY29uZFsyXTtcbiAgICB9O1xuICAgIFJpYmJvbnNDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVFbWl0dGVyVGV4Q29vcmRzID0gZnVuY3Rpb24gKGVtaXR0ZXIsIG5vdykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVtaXR0ZXIuY3JlYXRpb25UaW1lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIHJlbGF0aXZlUG9zID0gKG5vdyAtIGVtaXR0ZXIuY3JlYXRpb25UaW1lc1tpXSkgLyAoZW1pdHRlci5wcm9wcy5MaWZlU3BhbiAqIDEwMDApO1xuICAgICAgICAgICAgdmFyIHRleHR1cmVTbG90ID0gdGhpcy5pbnRlcnAuYW5pbVZlY3RvclZhbChlbWl0dGVyLnByb3BzLlRleHR1cmVTbG90LCAwKTtcbiAgICAgICAgICAgIHZhciB0ZXhDb29yZFggPSB0ZXh0dXJlU2xvdCAlIGVtaXR0ZXIucHJvcHMuQ29sdW1ucztcbiAgICAgICAgICAgIHZhciB0ZXhDb29yZFkgPSBNYXRoLmZsb29yKHRleHR1cmVTbG90IC8gZW1pdHRlci5wcm9wcy5Sb3dzKTtcbiAgICAgICAgICAgIHZhciBjZWxsV2lkdGggPSAxIC8gZW1pdHRlci5wcm9wcy5Db2x1bW5zO1xuICAgICAgICAgICAgdmFyIGNlbGxIZWlnaHQgPSAxIC8gZW1pdHRlci5wcm9wcy5Sb3dzO1xuICAgICAgICAgICAgcmVsYXRpdmVQb3MgPSB0ZXhDb29yZFggKiBjZWxsV2lkdGggKyByZWxhdGl2ZVBvcyAqIGNlbGxXaWR0aDtcbiAgICAgICAgICAgIGVtaXR0ZXIudGV4Q29vcmRzW2kgKiAyICogMl0gPSByZWxhdGl2ZVBvcztcbiAgICAgICAgICAgIGVtaXR0ZXIudGV4Q29vcmRzW2kgKiAyICogMiArIDFdID0gdGV4Q29vcmRZICogY2VsbEhlaWdodDtcbiAgICAgICAgICAgIGVtaXR0ZXIudGV4Q29vcmRzW2kgKiAyICogMiArIDJdID0gcmVsYXRpdmVQb3M7XG4gICAgICAgICAgICBlbWl0dGVyLnRleENvb3Jkc1tpICogMiAqIDIgKyAzXSA9ICgxICsgdGV4Q29vcmRZKSAqIGNlbGxIZWlnaHQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFJpYmJvbnNDb250cm9sbGVyLnByb3RvdHlwZS5zZXRMYXllclByb3BzID0gZnVuY3Rpb24gKGxheWVyLCB0ZXh0dXJlSUQpIHtcbiAgICAgICAgdmFyIHRleHR1cmUgPSB0aGlzLnJlbmRlcmVyRGF0YS5tb2RlbC5UZXh0dXJlc1t0ZXh0dXJlSURdO1xuICAgICAgICBpZiAobGF5ZXIuU2hhZGluZyAmIG1vZGVsXzEuTGF5ZXJTaGFkaW5nLlR3b1NpZGVkKSB7XG4gICAgICAgICAgICBnbC5kaXNhYmxlKGdsLkNVTExfRkFDRSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuQ1VMTF9GQUNFKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGF5ZXIuRmlsdGVyTW9kZSA9PT0gbW9kZWxfMS5GaWx0ZXJNb2RlLlRyYW5zcGFyZW50KSB7XG4gICAgICAgICAgICBnbC51bmlmb3JtMWYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy5kaXNjYXJkQWxwaGFMZXZlbFVuaWZvcm0sIDAuNzUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZ2wudW5pZm9ybTFmKHNoYWRlclByb2dyYW1Mb2NhdGlvbnMuZGlzY2FyZEFscGhhTGV2ZWxVbmlmb3JtLCAwLik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxheWVyLkZpbHRlck1vZGUgPT09IG1vZGVsXzEuRmlsdGVyTW9kZS5Ob25lKSB7XG4gICAgICAgICAgICBnbC5kaXNhYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICAgICAgICAgIC8vIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xuICAgICAgICAgICAgZ2wuZGVwdGhNYXNrKHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxheWVyLkZpbHRlck1vZGUgPT09IG1vZGVsXzEuRmlsdGVyTW9kZS5UcmFuc3BhcmVudCkge1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICAgICAgICAgIGdsLmJsZW5kRnVuY1NlcGFyYXRlKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSwgZ2wuT05FLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcbiAgICAgICAgICAgIGdsLmRlcHRoTWFzayh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsYXllci5GaWx0ZXJNb2RlID09PSBtb2RlbF8xLkZpbHRlck1vZGUuQmxlbmQpIHtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgICAgICAgICBnbC5ibGVuZEZ1bmNTZXBhcmF0ZShnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEsIGdsLk9ORSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSk7XG4gICAgICAgICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxheWVyLkZpbHRlck1vZGUgPT09IG1vZGVsXzEuRmlsdGVyTW9kZS5BZGRpdGl2ZSkge1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICAgICAgICAgIGdsLmJsZW5kRnVuYyhnbC5TUkNfQ09MT1IsIGdsLk9ORSk7XG4gICAgICAgICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxheWVyLkZpbHRlck1vZGUgPT09IG1vZGVsXzEuRmlsdGVyTW9kZS5BZGRBbHBoYSkge1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICAgICAgICAgIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORSk7XG4gICAgICAgICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGxheWVyLkZpbHRlck1vZGUgPT09IG1vZGVsXzEuRmlsdGVyTW9kZS5Nb2R1bGF0ZSkge1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICAgICAgICAgIGdsLmJsZW5kRnVuY1NlcGFyYXRlKGdsLlpFUk8sIGdsLlNSQ19DT0xPUiwgZ2wuWkVSTywgZ2wuT05FKTtcbiAgICAgICAgICAgIGdsLmRlcHRoTWFzayhmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGF5ZXIuRmlsdGVyTW9kZSA9PT0gbW9kZWxfMS5GaWx0ZXJNb2RlLk1vZHVsYXRlMngpIHtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgICAgICAgICBnbC5ibGVuZEZ1bmNTZXBhcmF0ZShnbC5EU1RfQ09MT1IsIGdsLlNSQ19DT0xPUiwgZ2wuWkVSTywgZ2wuT05FKTtcbiAgICAgICAgICAgIGdsLmRlcHRoTWFzayhmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRleHR1cmUuSW1hZ2UpIHtcbiAgICAgICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xuICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5yZW5kZXJlckRhdGEudGV4dHVyZXNbdGV4dHVyZS5JbWFnZV0pO1xuICAgICAgICAgICAgZ2wudW5pZm9ybTFpKHNoYWRlclByb2dyYW1Mb2NhdGlvbnMuc2FtcGxlclVuaWZvcm0sIDApO1xuICAgICAgICAgICAgZ2wudW5pZm9ybTFmKHNoYWRlclByb2dyYW1Mb2NhdGlvbnMucmVwbGFjZWFibGVUeXBlVW5pZm9ybSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGV4dHVyZS5SZXBsYWNlYWJsZUlkID09PSAxIHx8IHRleHR1cmUuUmVwbGFjZWFibGVJZCA9PT0gMikge1xuICAgICAgICAgICAgZ2wudW5pZm9ybTNmdihzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnJlcGxhY2VhYmxlQ29sb3JVbmlmb3JtLCB0aGlzLnJlbmRlcmVyRGF0YS50ZWFtQ29sb3IpO1xuICAgICAgICAgICAgZ2wudW5pZm9ybTFmKHNoYWRlclByb2dyYW1Mb2NhdGlvbnMucmVwbGFjZWFibGVUeXBlVW5pZm9ybSwgdGV4dHVyZS5SZXBsYWNlYWJsZUlkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGF5ZXIuU2hhZGluZyAmIG1vZGVsXzEuTGF5ZXJTaGFkaW5nLk5vRGVwdGhUZXN0KSB7XG4gICAgICAgICAgICBnbC5kaXNhYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXllci5TaGFkaW5nICYgbW9kZWxfMS5MYXllclNoYWRpbmcuTm9EZXB0aFNldCkge1xuICAgICAgICAgICAgZ2wuZGVwdGhNYXNrKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICAvKmlmICh0eXBlb2YgbGF5ZXIuVFZlcnRleEFuaW1JZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGxldCBhbmltOiBUVmVydGV4QW5pbSA9IHRoaXMucmVuZGVyZXJEYXRhLm1vZGVsLlRleHR1cmVBbmltc1tsYXllci5UVmVydGV4QW5pbUlkXTtcbiAgICAgICAgICAgIGxldCB0cmFuc2xhdGlvblJlcyA9IHRoaXMuaW50ZXJwLnZlYzModHJhbnNsYXRpb24sIGFuaW0uVHJhbnNsYXRpb24pO1xuICAgICAgICAgICAgbGV0IHJvdGF0aW9uUmVzID0gdGhpcy5pbnRlcnAucXVhdChyb3RhdGlvbiwgYW5pbS5Sb3RhdGlvbik7XG4gICAgICAgICAgICBsZXQgc2NhbGluZ1JlcyA9IHRoaXMuaW50ZXJwLnZlYzMoc2NhbGluZywgYW5pbS5TY2FsaW5nKTtcbiAgICAgICAgICAgIG1hdDQuZnJvbVJvdGF0aW9uVHJhbnNsYXRpb25TY2FsZShcbiAgICAgICAgICAgICAgICB0ZXhDb29yZE1hdDQsXG4gICAgICAgICAgICAgICAgcm90YXRpb25SZXMgfHwgZGVmYXVsdFJvdGF0aW9uLFxuICAgICAgICAgICAgICAgIHRyYW5zbGF0aW9uUmVzIHx8IGRlZmF1bHRUcmFuc2xhdGlvbixcbiAgICAgICAgICAgICAgICBzY2FsaW5nUmVzIHx8IGRlZmF1bHRTY2FsaW5nXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbWF0My5zZXQoXG4gICAgICAgICAgICAgICAgdGV4Q29vcmRNYXQzLFxuICAgICAgICAgICAgICAgIHRleENvb3JkTWF0NFswXSwgdGV4Q29vcmRNYXQ0WzFdLCAwLFxuICAgICAgICAgICAgICAgIHRleENvb3JkTWF0NFs0XSwgdGV4Q29vcmRNYXQ0WzVdLCAwLFxuICAgICAgICAgICAgICAgIHRleENvb3JkTWF0NFsxMl0sIHRleENvb3JkTWF0NFsxM10sIDBcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGdsLnVuaWZvcm1NYXRyaXgzZnYoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy50VmVydGV4QW5pbVVuaWZvcm0sIGZhbHNlLCB0ZXhDb29yZE1hdDMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDNmdihzaGFkZXJQcm9ncmFtTG9jYXRpb25zLnRWZXJ0ZXhBbmltVW5pZm9ybSwgZmFsc2UsIGlkZW50aWZ5TWF0Myk7XG4gICAgICAgIH0qL1xuICAgIH07XG4gICAgUmliYm9uc0NvbnRyb2xsZXIucHJvdG90eXBlLnNldEdlbmVyYWxCdWZmZXJzID0gZnVuY3Rpb24gKGVtaXR0ZXIpIHtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGVtaXR0ZXIudGV4Q29vcmRCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZW1pdHRlci50ZXhDb29yZHMsIGdsLkRZTkFNSUNfRFJBVyk7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyUHJvZ3JhbUxvY2F0aW9ucy50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBlbWl0dGVyLnZlcnRleEJ1ZmZlcik7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBlbWl0dGVyLnZlcnRpY2VzLCBnbC5EWU5BTUlDX0RSQVcpO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlclByb2dyYW1Mb2NhdGlvbnMudmVydGV4UG9zaXRpb25BdHRyaWJ1dGUsIDMsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG4gICAgfTtcbiAgICBSaWJib25zQ29udHJvbGxlci5wcm90b3R5cGUucmVuZGVyRW1pdHRlciA9IGZ1bmN0aW9uIChlbWl0dGVyKSB7XG4gICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIGVtaXR0ZXIuY3JlYXRpb25UaW1lcy5sZW5ndGggKiAyKTtcbiAgICB9O1xuICAgIHJldHVybiBSaWJib25zQ29udHJvbGxlcjtcbn0oKSk7XG5leHBvcnRzLlJpYmJvbnNDb250cm9sbGVyID0gUmliYm9uc0NvbnRyb2xsZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1yaWJib25zLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gbWF0NGZyb21Sb3RhdGlvbk9yaWdpbihvdXQsIHJvdGF0aW9uLCBvcmlnaW4pIHtcbiAgICB2YXIgeCA9IHJvdGF0aW9uWzBdLCB5ID0gcm90YXRpb25bMV0sIHogPSByb3RhdGlvblsyXSwgdyA9IHJvdGF0aW9uWzNdLCB4MiA9IHggKyB4LCB5MiA9IHkgKyB5LCB6MiA9IHogKyB6LCB4eCA9IHggKiB4MiwgeHkgPSB4ICogeTIsIHh6ID0geCAqIHoyLCB5eSA9IHkgKiB5MiwgeXogPSB5ICogejIsIHp6ID0geiAqIHoyLCB3eCA9IHcgKiB4Miwgd3kgPSB3ICogeTIsIHd6ID0gdyAqIHoyLCBveCA9IG9yaWdpblswXSwgb3kgPSBvcmlnaW5bMV0sIG96ID0gb3JpZ2luWzJdO1xuICAgIG91dFswXSA9ICgxIC0gKHl5ICsgenopKTtcbiAgICBvdXRbMV0gPSAoeHkgKyB3eik7XG4gICAgb3V0WzJdID0gKHh6IC0gd3kpO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gKHh5IC0gd3opO1xuICAgIG91dFs1XSA9ICgxIC0gKHh4ICsgenopKTtcbiAgICBvdXRbNl0gPSAoeXogKyB3eCk7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAoeHogKyB3eSk7XG4gICAgb3V0WzldID0gKHl6IC0gd3gpO1xuICAgIG91dFsxMF0gPSAoMSAtICh4eCArIHl5KSk7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IG94IC0gKG91dFswXSAqIG94ICsgb3V0WzRdICogb3kgKyBvdXRbOF0gKiBveik7XG4gICAgb3V0WzEzXSA9IG95IC0gKG91dFsxXSAqIG94ICsgb3V0WzVdICogb3kgKyBvdXRbOV0gKiBveik7XG4gICAgb3V0WzE0XSA9IG96IC0gKG91dFsyXSAqIG94ICsgb3V0WzZdICogb3kgKyBvdXRbMTBdICogb3opO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5leHBvcnRzLm1hdDRmcm9tUm90YXRpb25PcmlnaW4gPSBtYXQ0ZnJvbVJvdGF0aW9uT3JpZ2luO1xuLyoqXG4gKiBSb3RhdGUgYSAzRCB2ZWN0b3IgYXJvdW5kIHRoZSB6LWF4aXNcbiAqIEBwYXJhbSB7dmVjM30gb3V0IFRoZSByZWNlaXZpbmcgdmVjM1xuICogQHBhcmFtIHt2ZWMzfSBhIFRoZSB2ZWMzIHBvaW50IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IGMgVGhlIGFuZ2xlIG9mIHJvdGF0aW9uXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbmZ1bmN0aW9uIHZlYzNSb3RhdGVaKG91dCwgYSwgYykge1xuICAgIG91dFswXSA9IGFbMF0gKiBNYXRoLmNvcyhjKSAtIGFbMV0gKiBNYXRoLnNpbihjKTtcbiAgICBvdXRbMV0gPSBhWzBdICogTWF0aC5zaW4oYykgKyBhWzFdICogTWF0aC5jb3MoYyk7XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICByZXR1cm4gb3V0O1xufVxuZXhwb3J0cy52ZWMzUm90YXRlWiA9IHZlYzNSb3RhdGVaO1xuZnVuY3Rpb24gcmFuZChmcm9tLCB0bykge1xuICAgIHJldHVybiBmcm9tICsgTWF0aC5yYW5kb20oKSAqICh0byAtIGZyb20pO1xufVxuZXhwb3J0cy5yYW5kID0gcmFuZDtcbmZ1bmN0aW9uIGRlZ1RvUmFkKGFuZ2xlKSB7XG4gICAgcmV0dXJuIGFuZ2xlICogTWF0aC5QSSAvIDE4MDtcbn1cbmV4cG9ydHMuZGVnVG9SYWQgPSBkZWdUb1JhZDtcbmZ1bmN0aW9uIGdldFNoYWRlcihnbCwgc291cmNlLCB0eXBlKSB7XG4gICAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKTtcbiAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcbiAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICBhbGVydChnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHNoYWRlcjtcbn1cbmV4cG9ydHMuZ2V0U2hhZGVyID0gZ2V0U2hhZGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbC5qcy5tYXAiXX0=
