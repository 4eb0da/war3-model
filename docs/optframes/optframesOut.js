(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var parse_1 = require("../../mdl/parse");
var parse_2 = require("../../mdx/parse");
var generate_1 = require("../../mdl/generate");
var generate_2 = require("../../mdx/generate");
require("../shim");
document.addEventListener('DOMContentLoaded', function init() {
    var container = document.querySelector('.container');
    var saveMDL = document.querySelector('.save[data-type="mdl"]');
    var saveMDX = document.querySelector('.save[data-type="mdx"]');
    var label = document.querySelector('.label');
    var log = document.querySelector('.log');
    var dropTarget;
    var model;
    var cleanedName;
    container.addEventListener('dragenter', function onDragEnter(event) {
        dropTarget = event.target;
        container.classList.add('container_drag');
        event.preventDefault();
    });
    container.addEventListener('dragleave', function onDragLeave(event) {
        if (event.target === dropTarget) {
            container.classList.remove('container_drag');
        }
    });
    container.addEventListener('dragover', function onDragLeave(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });
    container.addEventListener('drop', function onDrop(event) {
        event.preventDefault();
        container.classList.remove('container_drag');
        var file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        var isMDX = file.name.indexOf('.mdx') > -1;
        cleanedName = file.name.replace(/\.[^.]+$/, '');
        reader.onload = function () {
            try {
                if (isMDX) {
                    model = parse_2.parse(reader.result);
                }
                else {
                    model = parse_1.parse(reader.result);
                }
            }
            catch (err) {
                showError(err);
                return;
            }
            processModel();
        };
        if (isMDX) {
            reader.readAsArrayBuffer(file);
        }
        else {
            reader.readAsText(file);
        }
    });
    [saveMDL, saveMDX].forEach(function (button) {
        button.addEventListener('click', function save(event) {
            event.preventDefault();
            var res;
            var isMDL = button.getAttribute('data-type') === 'mdl';
            if (isMDL) {
                res = new Blob([generate_1.generate(model)], { type: 'octet/stream' });
            }
            else {
                res = new Blob([generate_2.generate(model)], { type: 'octet/stream' });
            }
            var link = document.createElement('a');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.href = URL.createObjectURL(res);
            link.download = cleanedName + (isMDL ? '.mdl' : '.mdx');
            link.click();
            URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
        });
    });
    function clearLog() {
        log.innerHTML = '';
    }
    function logStr(str) {
        var p = document.createElement('p');
        p.textContent = str;
        log.appendChild(p);
    }
    function processModel() {
        clearLog();
        logStr('Optimization is lossy, make sure to test result models');
        var totalKeys = 0, cleanedKeys = 0;
        var isSameKey = function (keyframe0, keyframe1) {
            for (var i = 0; i < keyframe0.Vector.length; ++i) {
                if (keyframe0.Vector[i] !== keyframe1.Vector[i]) {
                    return false;
                }
            }
            if (keyframe0.InTan) {
                for (var i = 0; i < keyframe0.InTan.length; ++i) {
                    if (keyframe0.InTan[i] !== keyframe1.InTan[i]) {
                        return false;
                    }
                }
                for (var i = 0; i < keyframe0.OutTan.length; ++i) {
                    if (keyframe0.OutTan[i] !== keyframe1.OutTan[i]) {
                        return false;
                    }
                }
            }
            return true;
        };
        var processKeys = function (obj, key) {
            var animVector = obj[key];
            var sequences = model.Sequences;
            var globalSequences = model.GlobalSequences;
            if (!animVector || !animVector.Keys) {
                return;
            }
            totalKeys += animVector.Keys.length;
            var newKeys = [];
            var processAnim = function (from, to) {
                var keys = [];
                for (var _i = 0, _a = animVector.Keys; _i < _a.length; _i++) {
                    var keyframe = _a[_i];
                    if (keyframe.Frame >= from && keyframe.Frame <= to) {
                        keys.push(keyframe);
                    }
                }
                var prevKey = null;
                var filtered = [];
                for (var i = 0; i < keys.length; ++i) {
                    if (!prevKey) {
                        prevKey = keys[i];
                        filtered.push(keys[i]);
                    }
                    else {
                        if (!(isSameKey(keys[i], prevKey) &&
                            (i + 1 === keys.length || isSameKey(keys[i], keys[i + 1])))) {
                            filtered.push(keys[i]);
                        }
                        prevKey = keys[i];
                    }
                }
                newKeys = newKeys.concat(filtered);
            };
            if (animVector.GlobalSeqId !== null) {
                processAnim(0, globalSequences[animVector.GlobalSeqId]);
            }
            else {
                for (var _i = 0, sequences_1 = sequences; _i < sequences_1.length; _i++) {
                    var anim = sequences_1[_i];
                    processAnim(anim.Interval[0], anim.Interval[1]);
                }
            }
            cleanedKeys += animVector.Keys.length - newKeys.length;
            animVector.Keys = newKeys;
        };
        for (var _i = 0, _a = model.Nodes; _i < _a.length; _i++) {
            var node = _a[_i];
            processKeys(node, 'Translation');
            processKeys(node, 'Rotation');
            processKeys(node, 'Scaling');
            processKeys(node, 'Visibility');
            processKeys(node, 'EmissionRate');
            processKeys(node, 'Gravity');
            processKeys(node, 'Latitude');
            processKeys(node, 'LifeSpan');
            processKeys(node, 'InitVelocity');
            processKeys(node, 'Speed');
            processKeys(node, 'Variation');
            processKeys(node, 'Width');
            processKeys(node, 'Length');
            processKeys(node, 'AttenuationStart');
            processKeys(node, 'AttenuationEnd');
            processKeys(node, 'Color');
            processKeys(node, 'Intensity');
            processKeys(node, 'AmbIntensity');
            processKeys(node, 'AmbColor');
            processKeys(node, 'HeightAbove');
            processKeys(node, 'HeightBelow');
            processKeys(node, 'Alpha');
            processKeys(node, 'TextureSlot');
        }
        for (var _b = 0, _c = model.Cameras; _b < _c.length; _b++) {
            var camera = _c[_b];
            processKeys(camera, 'TargetTranslation');
            processKeys(camera, 'Translation');
            processKeys(camera, 'Rotation');
        }
        for (var _d = 0, _e = model.TextureAnims; _d < _e.length; _d++) {
            var anim = _e[_d];
            processKeys(anim, 'Translation');
            processKeys(anim, 'Rotation');
            processKeys(anim, 'Scaling');
        }
        for (var _f = 0, _g = model.Materials; _f < _g.length; _f++) {
            var material = _g[_f];
            for (var _h = 0, _j = material.Layers; _h < _j.length; _h++) {
                var layer = _j[_h];
                processKeys(layer, 'TextureID');
                processKeys(layer, 'Alpha');
            }
        }
        logStr(cleanedKeys + '/' + totalKeys + ' frames removed');
        container.classList.add('container_with-data');
    }
    function showError(err) {
        container.classList.remove('container_with-data');
        label.textContent = err;
    }
});
//# sourceMappingURL=optframes.js.map
},{"../../mdl/generate":3,"../../mdl/parse":4,"../../mdx/generate":5,"../../mdx/parse":6,"../shim":2}],2:[function(require,module,exports){
if (!Float32Array.prototype.reverse) {
    Float32Array.prototype.reverse = Array.prototype.reverse;
}

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("../model");
var FLOAT_PRESICION = 6;
var EPSILON = 1e-6;
function isNotEmptyVec3(vec, val) {
    if (val === void 0) { val = 0; }
    return Math.abs(vec[0] - val) > EPSILON ||
        Math.abs(vec[1] - val) > EPSILON ||
        Math.abs(vec[2] - val) > EPSILON;
}
function generateTab(tabSize) {
    if (tabSize === void 0) { tabSize = 1; }
    if (tabSize === 0) {
        return '';
    }
    var res = '\t';
    for (var i = 1; i < tabSize; ++i) {
        res += '\t';
    }
    return res;
}
function generateWrappedString(val) {
    return "\"" + val + "\"";
}
function generateWrappedStringOrNumber(val) {
    if (typeof val === 'number') {
        return String(val);
    }
    return generateWrappedString(val);
}
function generateBlockStart(blockName, subInfo, tabSize) {
    if (subInfo === void 0) { subInfo = null; }
    if (tabSize === void 0) { tabSize = 0; }
    return generateTab(tabSize) +
        blockName + ' ' +
        (subInfo !== null ? generateWrappedStringOrNumber(subInfo) + ' ' : '') +
        '{\n';
}
function generateBlockEnd(tabSize) {
    if (tabSize === void 0) { tabSize = 0; }
    return generateTab(tabSize) + '}\n';
}
var trailingZeroRegExp = /(\..+?)0+$/;
var trailingZeroRegExp2 = /\.0+$/;
var negativeZeroRegExp = /^-0$/;
function generateFloat(val) {
    return val.toFixed(FLOAT_PRESICION)
        .replace(trailingZeroRegExp, '$1')
        .replace(trailingZeroRegExp2, '')
        .replace(negativeZeroRegExp, '0');
}
function generateFloatArray(arr, reverse) {
    if (reverse === void 0) { reverse = false; }
    var middle = '';
    if (reverse) {
        for (var i = arr.length - 1; i >= 0; --i) {
            if (i < arr.length - 1) {
                middle += ', ';
            }
            middle += generateFloat(arr[i]);
        }
    }
    else {
        for (var i = 0; i < arr.length; ++i) {
            if (i > 0) {
                middle += ', ';
            }
            middle += generateFloat(arr[i]);
        }
    }
    return '{ ' + middle + ' }';
}
function generateUIntArray(arr) {
    var middle = '';
    for (var i = 0; i < arr.length; ++i) {
        if (i > 0) {
            middle += ', ';
        }
        middle += String(arr[i]);
    }
    return '{ ' + middle + ' }';
}
function generateStatic(isStatic) {
    return isStatic ? 'static ' : '';
}
function generateProp(name, val, isStatic, tabSize) {
    if (tabSize === void 0) { tabSize = 1; }
    return generateTab(tabSize) + generateStatic(isStatic) + name + " " + val + ",\n";
}
function generateIntProp(name, val, isStatic, tabSize) {
    if (isStatic === void 0) { isStatic = null; }
    if (tabSize === void 0) { tabSize = 1; }
    return generateProp(name, String(val), isStatic, tabSize);
}
function generateFloatProp(name, val, isStatic, tabSize) {
    if (isStatic === void 0) { isStatic = null; }
    if (tabSize === void 0) { tabSize = 1; }
    return generateProp(name, generateFloat(val), isStatic, tabSize);
}
function generateStringProp(name, val, isStatic, tabSize) {
    if (isStatic === void 0) { isStatic = null; }
    if (tabSize === void 0) { tabSize = 1; }
    return generateProp(name, val, isStatic, tabSize);
}
function generateWrappedStringProp(name, val, isStatic, tabSize) {
    if (isStatic === void 0) { isStatic = null; }
    if (tabSize === void 0) { tabSize = 1; }
    return generateProp(name, generateWrappedString(val), isStatic, tabSize);
}
function generateFloatArrayProp(name, val, isStatic, tabSize) {
    if (isStatic === void 0) { isStatic = null; }
    if (tabSize === void 0) { tabSize = 1; }
    return generateProp(name, generateFloatArray(val), isStatic, tabSize);
}
function generateUIntArrayProp(name, val, isStatic, tabSize) {
    if (isStatic === void 0) { isStatic = null; }
    if (tabSize === void 0) { tabSize = 1; }
    return generateProp(name, generateUIntArray(val), isStatic, tabSize);
}
function generateBooleanProp(name, tabSize) {
    if (tabSize === void 0) { tabSize = 1; }
    return generateTab(tabSize) + name + ',\n';
}
function generateIntPropIfNotEmpty(name, val, defaultVal, isStatic, tabSize) {
    if (defaultVal === void 0) { defaultVal = 0; }
    if (isStatic === void 0) { isStatic = null; }
    if (tabSize === void 0) { tabSize = 1; }
    if (val !== defaultVal && val !== null && val !== undefined) {
        return generateIntProp(name, val, isStatic, tabSize);
    }
    return '';
}
function generateFloatPropIfNotEmpty(name, val, defaultVal, isStatic, tabSize) {
    if (defaultVal === void 0) { defaultVal = 0; }
    if (isStatic === void 0) { isStatic = null; }
    if (tabSize === void 0) { tabSize = 1; }
    if (Math.abs(val - defaultVal) > EPSILON) {
        return generateFloatProp(name, val, isStatic, tabSize);
    }
    return '';
}
function generateLineType(lineType) {
    switch (lineType) {
        case model_1.LineType.DontInterp:
            return 'DontInterp';
        case model_1.LineType.Linear:
            return 'Linear';
        case model_1.LineType.Bezier:
            return 'Bezier';
        case model_1.LineType.Hermite:
            return 'Hermite';
    }
    return '';
}
function generateAnimKeyFrame(key, tabSize, reverse) {
    if (tabSize === void 0) { tabSize = 2; }
    if (reverse === void 0) { reverse = false; }
    var res = generateTab(tabSize) + key.Frame + ': ' +
        (key.Vector.length === 1 ? generateFloat(key.Vector[0]) : generateFloatArray(key.Vector, reverse)) + ',\n';
    if (key.InTan /* or OutTan */) {
        res += generateTab(tabSize + 1) + 'InTan ' +
            (key.InTan.length === 1 ? generateFloat(key.InTan[0]) : generateFloatArray(key.InTan, reverse)) + ',\n';
        res += generateTab(tabSize + 1) + 'OutTan ' +
            (key.OutTan.length === 1 ? generateFloat(key.OutTan[0]) : generateFloatArray(key.OutTan, reverse)) + ',\n';
    }
    return res;
}
function generateAnimVectorProp(name, val, defaultVal, tabSize, reverse) {
    if (defaultVal === void 0) { defaultVal = 0; }
    if (tabSize === void 0) { tabSize = 1; }
    if (reverse === void 0) { reverse = false; }
    if (val === null || val === undefined) {
        return '';
    }
    if (typeof val === 'number') {
        if (typeof defaultVal === 'number' && Math.abs(val - defaultVal) < EPSILON) {
            return '';
        }
        else {
            return generateFloatProp(name, val, true, tabSize);
        }
    }
    else {
        return generateBlockStart(name, val.Keys.length, tabSize) +
            generateBooleanProp(generateLineType(val.LineType), tabSize + 1) +
            (val.GlobalSeqId !== null ? generateIntProp('GlobalSeqId', val.GlobalSeqId, null, tabSize + 1) : '') +
            val.Keys.map(function (key) { return generateAnimKeyFrame(key, tabSize + 1, reverse); }).join('') +
            generateBlockEnd(tabSize);
    }
}
function generateVersion(model) {
    return generateBlockStart('Version') +
        generateIntProp('FormatVersion', model.Version) +
        generateBlockEnd();
}
function generateModel(model) {
    return generateBlockStart('Model', model.Info.Name) +
        generateIntPropIfNotEmpty('NumGeosets', model.Geosets.length) +
        generateIntPropIfNotEmpty('NumGeosetAnims', model.GeosetAnims.length) +
        generateIntPropIfNotEmpty('NumHelpers', model.Helpers.length) +
        generateIntPropIfNotEmpty('NumBones', model.Bones.length) +
        (model.Lights.length ? generateIntPropIfNotEmpty('NumLights', model.Lights.length) : '') +
        generateIntPropIfNotEmpty('NumAttachments', model.Attachments.length) +
        generateIntPropIfNotEmpty('NumEvents', model.EventObjects.length) +
        generateIntPropIfNotEmpty('NumParticleEmitters', model.ParticleEmitters.length) +
        (model.ParticleEmitters2.length ?
            generateIntPropIfNotEmpty('NumParticleEmitters2', model.ParticleEmitters2.length) :
            '') +
        (model.RibbonEmitters.length ?
            generateIntPropIfNotEmpty('NumRibbonEmitters', model.RibbonEmitters.length) :
            '') +
        generateIntProp('BlendTime', model.Info.BlendTime) +
        generateFloatArrayProp('MinimumExtent', model.Info.MinimumExtent) +
        generateFloatArrayProp('MaximumExtent', model.Info.MaximumExtent) +
        generateFloatPropIfNotEmpty('BoundsRadius', model.Info.BoundsRadius) +
        generateBlockEnd();
}
function generateSequences(model) {
    return generateBlockStart('Sequences', model.Sequences.length) +
        model.Sequences.map(generateSequenceChunk).join('') +
        generateBlockEnd();
}
function generateSequenceChunk(sequence) {
    return generateBlockStart('Anim', sequence.Name, 1) +
        generateUIntArrayProp('Interval', sequence.Interval, null, 2) +
        generateFloatPropIfNotEmpty('Rarity', sequence.Rarity, 0, null, 2) +
        generateFloatPropIfNotEmpty('MoveSpeed', sequence.MoveSpeed, 0, null, 2) +
        (sequence.NonLooping ? generateBooleanProp('NonLooping', 2) : '') +
        generateFloatArrayProp('MinimumExtent', sequence.MinimumExtent, null, 2) +
        generateFloatArrayProp('MaximumExtent', sequence.MaximumExtent, null, 2) +
        generateFloatPropIfNotEmpty('BoundsRadius', sequence.BoundsRadius, 0, null, 2) +
        generateBlockEnd(1);
}
function generateGlobalSequences(model) {
    if (!model.GlobalSequences || !model.GlobalSequences.length) {
        return '';
    }
    return generateBlockStart('GlobalSequences', model.GlobalSequences.length) +
        model.GlobalSequences.map(function (duration) { return generateIntProp('Duration', duration); }).join('') +
        generateBlockEnd();
}
function generateTextures(model) {
    if (!model.Textures.length) {
        return '';
    }
    return generateBlockStart('Textures', model.Textures.length) +
        model.Textures.map(generateTextureChunk).join('') +
        generateBlockEnd();
}
function generateTextureChunk(texture) {
    return generateBlockStart('Bitmap', null, 1) +
        generateWrappedStringProp('Image', texture.Image, null, 2) +
        generateIntPropIfNotEmpty('ReplaceableId', texture.ReplaceableId, 0, null, 2) +
        (texture.Flags & model_1.TextureFlags.WrapWidth ? generateBooleanProp('WrapWidth', 2) : '') +
        (texture.Flags & model_1.TextureFlags.WrapHeight ? generateBooleanProp('WrapHeight', 2) : '') +
        generateBlockEnd(1);
}
function generateMaterials(model) {
    if (!model.Materials.length) {
        return '';
    }
    return generateBlockStart('Materials', model.Materials.length) +
        model.Materials.map(generateMaterialChunk).join('') +
        generateBlockEnd();
}
function generateMaterialChunk(material) {
    return generateBlockStart('Material', null, 1) +
        (material.RenderMode & model_1.MaterialRenderMode.ConstantColor ? generateBooleanProp('ConstantColor', 2) : '') +
        (material.RenderMode & model_1.MaterialRenderMode.SortPrimsFarZ ? generateBooleanProp('SortPrimsFarZ', 2) : '') +
        (material.RenderMode & model_1.MaterialRenderMode.FullResolution ? generateBooleanProp('FullResolution', 2) : '') +
        generateIntPropIfNotEmpty('PriorityPlane', material.PriorityPlane, 0, null, 2) +
        material.Layers.map(generateLayerChunk).join('') +
        generateBlockEnd(1);
}
function generateFilterMode(filterMode) {
    switch (filterMode) {
        case model_1.FilterMode.None:
            return 'None';
        case model_1.FilterMode.Transparent:
            return 'Transparent';
        case model_1.FilterMode.Blend:
            return 'Blend';
        case model_1.FilterMode.Additive:
            return 'Additive';
        case model_1.FilterMode.AddAlpha:
            return 'AddAlpha';
        case model_1.FilterMode.Modulate:
            return 'Modulate';
        case model_1.FilterMode.Modulate2x:
            return 'Modulate2x';
    }
    return '';
}
function generateLayerChunk(layer) {
    return generateBlockStart('Layer', null, 2) +
        generateStringProp('FilterMode', generateFilterMode(layer.FilterMode), null, 3) +
        (layer.Alpha !== undefined ? generateAnimVectorProp('Alpha', layer.Alpha, 1, 3) : '') +
        (layer.TextureID !== undefined ? generateAnimVectorProp('TextureID', layer.TextureID, null, 3) : '') +
        (layer.Shading & model_1.LayerShading.TwoSided ? generateBooleanProp('TwoSided', 3) : '') +
        (layer.Shading & model_1.LayerShading.Unshaded ? generateBooleanProp('Unshaded', 3) : '') +
        (layer.Shading & model_1.LayerShading.Unfogged ? generateBooleanProp('Unfogged', 3) : '') +
        (layer.Shading & model_1.LayerShading.SphereEnvMap ? generateBooleanProp('SphereEnvMap', 3) : '') +
        (layer.Shading & model_1.LayerShading.NoDepthTest ? generateBooleanProp('NoDepthTest', 3) : '') +
        (layer.Shading & model_1.LayerShading.NoDepthSet ? generateBooleanProp('NoDepthSet', 3) : '') +
        generateIntPropIfNotEmpty('CoordId', layer.CoordId, 0, null, 3) +
        generateIntPropIfNotEmpty('TVertexAnimId', layer.TVertexAnimId, null, null, 3) +
        generateBlockEnd(2);
}
function generateTextureAnims(model) {
    if (!model.TextureAnims.length) {
        return '';
    }
    return generateBlockStart('TextureAnims', model.TextureAnims.length) +
        model.TextureAnims.map(generateTextureAnimChunk).join('') +
        generateBlockEnd();
}
function generateTextureAnimChunk(textureAnim) {
    return generateBlockStart('TVertexAnim', null, 1) +
        (textureAnim.Translation ? generateAnimVectorProp('Translation', textureAnim.Translation, null, 2) : '') +
        (textureAnim.Rotation ? generateAnimVectorProp('Rotation', textureAnim.Rotation, null, 2) : '') +
        (textureAnim.Scaling ? generateAnimVectorProp('Scaling', textureAnim.Scaling, null, 2) : '') +
        generateBlockEnd(1);
}
function generateGeosets(model) {
    if (!model.Geosets.length) {
        return '';
    }
    return model.Geosets.map(generateGeosetChunk).join('');
}
function generateGeosetChunk(geoset) {
    return generateBlockStart('Geoset') +
        generateGeosetArray('Vertices', geoset.Vertices, 3) +
        generateGeosetArray('Normals', geoset.Normals, 3) +
        generateGeosetArray('TVertices', geoset.TVertices[0], 2) +
        generateGeosetVertexGroup(geoset.VertexGroup) +
        generateGeosetFaces(geoset.Faces) +
        generateGeosetGroups(geoset.Groups) +
        generateFloatArrayProp('MinimumExtent', geoset.MinimumExtent) +
        generateFloatArrayProp('MaximumExtent', geoset.MaximumExtent) +
        generateFloatPropIfNotEmpty('BoundsRadius', geoset.BoundsRadius) +
        generateGeosetAnimInfos(geoset.Anims) +
        generateIntProp('MaterialID', geoset.MaterialID) +
        generateIntProp('SelectionGroup', geoset.SelectionGroup) +
        (geoset.Unselectable ? generateBooleanProp('Unselectable') : '') +
        generateBlockEnd();
}
function generateGeosetArray(name, arr, elemLength) {
    var middle = '';
    var elemCount = arr.length / elemLength;
    for (var i = 0; i < elemCount; ++i) {
        middle += generateTab(2) + generateFloatArray(arr.slice(i * elemLength, (i + 1) * elemLength)) + ',\n';
    }
    return generateBlockStart(name, elemCount, 1) +
        middle +
        generateBlockEnd(1);
}
function generateGeosetVertexGroup(arr) {
    var middle = '';
    for (var i = 0; i < arr.length; ++i) {
        middle += generateTab(2) + arr[i] + ',\n';
    }
    return generateBlockStart('VertexGroup', null, 1) +
        middle +
        generateBlockEnd(1);
}
function generateGeosetFaces(arr) {
    return generateBlockStart("Faces 1 " + arr.length, null, 1) +
        generateBlockStart('Triangles', null, 2) +
        generateTab(3) + generateUIntArray(arr) + ',\n' +
        generateBlockEnd(2) +
        generateBlockEnd(1);
}
function generateGeosetGroups(groups) {
    var totalMatrices = 0;
    var middle = '';
    for (var _i = 0, groups_1 = groups; _i < groups_1.length; _i++) {
        var group = groups_1[_i];
        totalMatrices += group.length;
        middle += generateTab(2) + 'Matrices ' + generateUIntArray(group) + ',\n';
    }
    return generateBlockStart("Groups " + groups.length + " " + totalMatrices, null, 1) +
        middle +
        generateBlockEnd(1);
}
function generateGeosetAnimInfos(anims) {
    if (!anims) {
        return '';
    }
    return anims.map(generateGeosetAnimInfoChunk).join('');
}
function generateGeosetAnimInfoChunk(anim) {
    return generateBlockStart('Anim', null, 1) +
        generateFloatArrayProp('MinimumExtent', anim.MinimumExtent, null, 2) +
        generateFloatArrayProp('MaximumExtent', anim.MaximumExtent, null, 2) +
        generateFloatPropIfNotEmpty('BoundsRadius', anim.BoundsRadius, 0, null, 2) +
        generateBlockEnd(1);
}
function generateGeosetAnims(model) {
    if (!model.GeosetAnims.length) {
        return '';
    }
    return model.GeosetAnims.map(generateGeosetAnimChunk).join('');
}
function generateColorProp(name, color, isStatic, tabSize) {
    if (tabSize === void 0) { tabSize = 1; }
    if (color) {
        if (color instanceof Float32Array) {
            if (!isStatic || isNotEmptyVec3(color, 1)) {
                var middle = '';
                for (var i = 2; i >= 0; --i) {
                    if (i < 2) {
                        middle += ', ';
                    }
                    middle += generateFloat(color[i]);
                }
                return "" + generateTab(tabSize) + (isStatic ? 'static ' : '') + name + " { " + middle + " },\n";
            }
        }
        else {
            return generateAnimVectorProp(name, color, null, tabSize, true);
        }
    }
    return '';
}
function generateGeosetAnimChunk(geosetAnim) {
    return generateBlockStart('GeosetAnim') +
        generateIntProp('GeosetId', geosetAnim.GeosetId) +
        generateAnimVectorProp('Alpha', geosetAnim.Alpha, 1) +
        generateColorProp('Color', geosetAnim.Color, true) +
        (geosetAnim.Flags & model_1.GeosetAnimFlags.DropShadow ? generateBooleanProp('DropShadow') : '') +
        generateBlockEnd();
}
function generateNodeProps(node) {
    return generateIntProp('ObjectId', node.ObjectId) +
        generateIntPropIfNotEmpty('Parent', node.Parent, null) +
        generateNodeDontInherit(node.Flags) +
        (node.Flags & model_1.NodeFlags.Billboarded ? generateBooleanProp('Billboarded') : '') +
        (node.Flags & model_1.NodeFlags.BillboardedLockX ? generateBooleanProp('BillboardedLockX') : '') +
        (node.Flags & model_1.NodeFlags.BillboardedLockY ? generateBooleanProp('BillboardedLockY') : '') +
        (node.Flags & model_1.NodeFlags.BillboardedLockZ ? generateBooleanProp('BillboardedLockZ') : '') +
        (node.Flags & model_1.NodeFlags.CameraAnchored ? generateBooleanProp('CameraAnchored') : '') +
        (node.Translation !== undefined ? generateAnimVectorProp('Translation', node.Translation) : '') +
        (node.Rotation !== undefined ? generateAnimVectorProp('Rotation', node.Rotation) : '') +
        (node.Scaling !== undefined ? generateAnimVectorProp('Scaling', node.Scaling) : '');
}
function generateNodeDontInherit(flags) {
    var flagsStrs = [];
    if (flags & model_1.NodeFlags.DontInheritTranslation) {
        flagsStrs.push('Translation');
    }
    if (flags & model_1.NodeFlags.DontInheritRotation) {
        flagsStrs.push('Rotation');
    }
    if (flags & model_1.NodeFlags.DontInheritScaling) {
        flagsStrs.push('Scaling');
    }
    if (!flagsStrs.length) {
        return '';
    }
    return generateTab(1) + 'DontInherit { ' + flagsStrs.join(', ') + ' },\n';
}
function generateBones(model) {
    if (!model.Bones.length) {
        return '';
    }
    return model.Bones.map(generateBoneChunk).join('');
}
function generateBoneChunk(bone) {
    return generateBlockStart('Bone', bone.Name) +
        generateNodeProps(bone) +
        (bone.GeosetId !== null ?
            generateIntProp('GeosetId', bone.GeosetId) :
            generateStringProp('GeosetId', 'Multiple')) +
        (bone.GeosetAnimId !== null ?
            generateIntProp('GeosetAnimId', bone.GeosetAnimId) :
            generateStringProp('GeosetAnimId', 'None')) +
        generateBlockEnd();
}
function generateLights(model) {
    if (!model.Lights.length) {
        return '';
    }
    return model.Lights.map(generateLightChunk).join('');
}
function generateLightChunk(light) {
    return generateBlockStart('Light', light.Name) +
        generateNodeProps(light) +
        generateBooleanProp(generateLightType(light.LightType)) +
        generateAnimVectorProp('AttenuationStart', light.AttenuationStart) +
        generateAnimVectorProp('AttenuationEnd', light.AttenuationEnd) +
        generateColorProp('Color', light.Color, true) +
        generateAnimVectorProp('Intensity', light.Intensity, null) +
        generateColorProp('AmbColor', light.AmbColor, true) +
        generateAnimVectorProp('AmbIntensity', light.AmbIntensity, null) +
        generateAnimVectorProp('Visibility', light.Visibility, 1) +
        generateBlockEnd();
}
function generateLightType(lightType) {
    switch (lightType) {
        case model_1.LightType.Omnidirectional:
            return 'Omnidirectional';
        case model_1.LightType.Directional:
            return 'Directional';
        case model_1.LightType.Ambient:
            return 'Ambient';
    }
    return '';
}
function generateHelpers(model) {
    return model.Helpers.map(generateHelperChunk).join('');
}
function generateHelperChunk(helper) {
    return generateBlockStart('Helper', helper.Name) +
        generateNodeProps(helper) +
        generateBlockEnd();
}
function generateAttachments(model) {
    return model.Attachments.map(generateAttachmentChunk).join('');
}
function generateAttachmentChunk(attachment) {
    return generateBlockStart('Attachment', attachment.Name) +
        generateNodeProps(attachment) +
        generateIntProp('AttachmentID', attachment.AttachmentID) +
        (attachment.Path ? generateWrappedStringProp('Path', attachment.Path) : '') +
        generateAnimVectorProp('Visibility', attachment.Visibility, 1) +
        generateBlockEnd();
}
function generatePivotPoints(model) {
    return generateBlockStart('PivotPoints', model.PivotPoints.length) +
        model.PivotPoints.map(function (point) { return "" + generateTab() + generateFloatArray(point) + ",\n"; }).join('') +
        generateBlockEnd();
}
function generateParticleEmitters(model) {
    return model.ParticleEmitters.map(generateParticleEmitterChunk).join('');
}
function generateParticleEmitterChunk(emitter) {
    return generateBlockStart('ParticleEmitter', emitter.Name) +
        generateNodeProps(emitter) +
        (emitter.Flags & model_1.ParticleEmitterFlags.EmitterUsesMDL ? generateBooleanProp('EmitterUsesMDL') : '') +
        (emitter.Flags & model_1.ParticleEmitterFlags.EmitterUsesTGA ? generateBooleanProp('EmitterUsesTGA') : '') +
        generateAnimVectorProp('EmissionRate', emitter.EmissionRate) +
        generateAnimVectorProp('Gravity', emitter.Gravity) +
        generateAnimVectorProp('Longitude', emitter.Longitude) +
        generateAnimVectorProp('Latitude', emitter.Latitude) +
        generateAnimVectorProp('Visibility', emitter.Visibility) +
        generateBlockStart('Particle', null, 1) +
        generateAnimVectorProp('LifeSpan', emitter.LifeSpan, null, 2) +
        generateAnimVectorProp('InitVelocity', emitter.InitVelocity, null, 2) +
        generateWrappedStringProp('Path', emitter.Path, false, 2) +
        generateBlockEnd(1) +
        generateBlockEnd();
}
function generateParticleEmitters2(model) {
    return model.ParticleEmitters2.map(generateParticleEmitter2Chunk).join('');
}
function generateParticleEmitters2FilterMode(filterMode) {
    switch (filterMode) {
        case model_1.ParticleEmitter2FilterMode.Blend:
            return 'Blend';
        case model_1.ParticleEmitter2FilterMode.Additive:
            return 'Additive';
        case model_1.ParticleEmitter2FilterMode.Modulate:
            return 'Modulate';
        case model_1.ParticleEmitter2FilterMode.Modulate2x:
            return 'Modulate2x';
        case model_1.ParticleEmitter2FilterMode.AlphaKey:
            return 'AlphaKey';
    }
    return '';
}
function generateSegmentColor(colors) {
    return generateBlockStart('SegmentColor', null, 1) +
        colors.map(function (color) { return generateColorProp('Color', color, false, 2); }).join('') +
        generateTab() + '},\n';
}
function generateParticleEmitter2FrameFlags(frameFlags) {
    if (frameFlags & model_1.ParticleEmitter2FramesFlags.Head && frameFlags & model_1.ParticleEmitter2FramesFlags.Tail) {
        return 'Both';
    }
    else if (frameFlags & model_1.ParticleEmitter2FramesFlags.Head) {
        return 'Head';
    }
    else if (frameFlags & model_1.ParticleEmitter2FramesFlags.Tail) {
        return 'Tail';
    }
    return '';
}
function generateParticleEmitter2Chunk(particleEmitter2) {
    return generateBlockStart('ParticleEmitter2', particleEmitter2.Name) +
        generateNodeProps(particleEmitter2) +
        generateBooleanProp(generateParticleEmitters2FilterMode(particleEmitter2.FilterMode)) +
        generateAnimVectorProp('Speed', particleEmitter2.Speed, null) +
        generateAnimVectorProp('Variation', particleEmitter2.Variation, null) +
        generateAnimVectorProp('Latitude', particleEmitter2.Latitude, null) +
        generateAnimVectorProp('Gravity', particleEmitter2.Gravity, null) +
        generateAnimVectorProp('EmissionRate', particleEmitter2.EmissionRate, null) +
        generateAnimVectorProp('Width', particleEmitter2.Width, null) +
        generateAnimVectorProp('Length', particleEmitter2.Length, null) +
        generateAnimVectorProp('Visibility', particleEmitter2.Visibility, 1) +
        generateSegmentColor(particleEmitter2.SegmentColor) +
        generateUIntArrayProp('Alpha', particleEmitter2.Alpha) +
        generateFloatArrayProp('ParticleScaling', particleEmitter2.ParticleScaling) +
        generateFloatArrayProp('LifeSpanUVAnim', particleEmitter2.LifeSpanUVAnim) +
        generateFloatArrayProp('DecayUVAnim', particleEmitter2.DecayUVAnim) +
        generateFloatArrayProp('TailUVAnim', particleEmitter2.TailUVAnim) +
        generateFloatArrayProp('TailDecayUVAnim', particleEmitter2.TailDecayUVAnim) +
        generateIntPropIfNotEmpty('Rows', particleEmitter2.Rows, 0) +
        generateIntPropIfNotEmpty('Columns', particleEmitter2.Columns, 0) +
        generateIntProp('TextureID', particleEmitter2.TextureID) +
        generateIntPropIfNotEmpty('Time', particleEmitter2.Time, 0) +
        generateIntPropIfNotEmpty('LifeSpan', particleEmitter2.LifeSpan, 0) +
        generateIntPropIfNotEmpty('TailLength', particleEmitter2.TailLength, 0) +
        (particleEmitter2.Flags & model_1.ParticleEmitter2Flags.SortPrimsFarZ ? generateBooleanProp('SortPrimsFarZ') : '') +
        (particleEmitter2.Flags & model_1.ParticleEmitter2Flags.LineEmitter ? generateBooleanProp('LineEmitter') : '') +
        (particleEmitter2.Flags & model_1.ParticleEmitter2Flags.ModelSpace ? generateBooleanProp('ModelSpace') : '') +
        (particleEmitter2.Flags & model_1.ParticleEmitter2Flags.Unshaded ? generateBooleanProp('Unshaded') : '') +
        (particleEmitter2.Flags & model_1.ParticleEmitter2Flags.Unfogged ? generateBooleanProp('Unfogged') : '') +
        (particleEmitter2.Flags & model_1.ParticleEmitter2Flags.XYQuad ? generateBooleanProp('XYQuad') : '') +
        (particleEmitter2.Squirt ? generateBooleanProp('Squirt') : '') +
        generateBooleanProp(generateParticleEmitter2FrameFlags(particleEmitter2.FrameFlags)) +
        generateBlockEnd();
}
function generateRibbonEmitters(model) {
    return model.RibbonEmitters.map(generateRibbonEmitterChunk).join('');
}
function generateRibbonEmitterChunk(ribbonEmitter) {
    return generateBlockStart('RibbonEmitter', ribbonEmitter.Name) +
        generateNodeProps(ribbonEmitter) +
        generateAnimVectorProp('HeightAbove', ribbonEmitter.HeightAbove, null) +
        generateAnimVectorProp('HeightBelow', ribbonEmitter.HeightBelow, null) +
        generateAnimVectorProp('Alpha', ribbonEmitter.Alpha, null) +
        generateColorProp('Color', ribbonEmitter.Color, true) +
        generateAnimVectorProp('TextureSlot', ribbonEmitter.TextureSlot, null) +
        generateAnimVectorProp('Visibility', ribbonEmitter.Visibility, 1) +
        generateIntProp('EmissionRate', ribbonEmitter.EmissionRate) +
        generateIntProp('LifeSpan', ribbonEmitter.LifeSpan) +
        generateIntPropIfNotEmpty('Gravity', ribbonEmitter.Gravity, 0) +
        generateIntProp('Rows', ribbonEmitter.Rows) +
        generateIntProp('Columns', ribbonEmitter.Columns) +
        generateIntPropIfNotEmpty('MaterialID', ribbonEmitter.MaterialID) +
        generateBlockEnd();
}
function generateEventObjects(model) {
    return model.EventObjects.map(generateEventObjectChunk).join('');
}
function generateEventTrack(eventTrack) {
    var middle = '';
    for (var i = 0; i < eventTrack.length; ++i) {
        middle += generateTab(2) + eventTrack[i] + ',\n';
    }
    return generateBlockStart('EventTrack', eventTrack.length, 1) +
        middle +
        generateBlockEnd(1);
}
function generateEventObjectChunk(eventObject) {
    return generateBlockStart('EventObject', eventObject.Name) +
        generateNodeProps(eventObject) +
        generateEventTrack(eventObject.EventTrack) +
        generateBlockEnd();
}
function generateCameras(model) {
    return model.Cameras.map(generateCameraChunk).join('');
}
function generateCameraChunk(camera) {
    return generateBlockStart('Camera', camera.Name) +
        generateFloatProp('FieldOfView', camera.FieldOfView) +
        generateFloatProp('FarClip', camera.FarClip) +
        generateFloatProp('NearClip', camera.NearClip) +
        generateFloatArrayProp('Position', camera.Position) +
        generateAnimVectorProp('Translation', camera.Translation) +
        generateAnimVectorProp('Rotation', camera.Rotation) +
        generateBlockStart('Target', null, 1) +
        generateFloatArrayProp('Position', camera.TargetPosition, null, 2) +
        generateAnimVectorProp('Translation', camera.TargetTranslation, null, 2) +
        generateBlockEnd(1) +
        generateBlockEnd();
}
function generateCollisionShapes(model) {
    return model.CollisionShapes.map(generateCollisionShapeChunk).join('');
}
function generateCollisionShapeChunk(collisionShape) {
    var middle = '';
    if (collisionShape.Shape === model_1.CollisionShapeType.Box) {
        middle = generateBooleanProp('Box');
        middle += generateBlockStart('Vertices', 2, 1) +
            generateTab(2) + generateFloatArray(collisionShape.Vertices.slice(0, 3)) + ',\n' +
            generateTab(2) + generateFloatArray(collisionShape.Vertices.slice(3, 6)) + ',\n' +
            generateBlockEnd(1);
    }
    else {
        middle = generateBooleanProp('Sphere');
        middle += generateBlockStart('Vertices', 1, 1) +
            generateTab(2) + generateFloatArray(collisionShape.Vertices) + ',\n' +
            generateBlockEnd(1) +
            generateFloatProp('BoundsRadius', collisionShape.BoundsRadius);
    }
    return generateBlockStart('CollisionShape', collisionShape.Name) +
        generateNodeProps(collisionShape) +
        middle +
        generateBlockEnd();
}
var generators = [
    generateVersion,
    generateModel,
    generateSequences,
    generateGlobalSequences,
    generateTextures,
    generateMaterials,
    generateTextureAnims,
    generateGeosets,
    generateGeosetAnims,
    generateBones,
    generateLights,
    generateHelpers,
    generateAttachments,
    generatePivotPoints,
    generateParticleEmitters,
    generateParticleEmitters2,
    generateRibbonEmitters,
    generateEventObjects,
    generateCameras,
    generateCollisionShapes
];
function generate(model) {
    var res = '';
    for (var _i = 0, generators_1 = generators; _i < generators_1.length; _i++) {
        var generator = generators_1[_i];
        res += generator(model);
    }
    return res;
}
exports.generate = generate;
//# sourceMappingURL=generate.js.map
},{"../model":7}],4:[function(require,module,exports){
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
//# sourceMappingURL=parse.js.map
},{"../model":7}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("../model");
var BIG_ENDIAN = true;
var NONE = -1;
var Stream = (function () {
    function Stream(arrayBuffer) {
        this.ab = arrayBuffer;
        this.uint = new Uint8Array(this.ab);
        this.view = new DataView(this.ab);
        this.pos = 0;
    }
    Stream.prototype.keyword = function (keyword) {
        this.uint[this.pos] = keyword.charCodeAt(0);
        this.uint[this.pos + 1] = keyword.charCodeAt(1);
        this.uint[this.pos + 2] = keyword.charCodeAt(2);
        this.uint[this.pos + 3] = keyword.charCodeAt(3);
        this.pos += 4;
    };
    Stream.prototype.uint8 = function (num) {
        this.view.setUint8(this.pos, num);
        this.pos += 1;
    };
    Stream.prototype.uint16 = function (num) {
        this.view.setUint16(this.pos, num, BIG_ENDIAN);
        this.pos += 2;
    };
    Stream.prototype.int32 = function (num) {
        this.view.setInt32(this.pos, num, BIG_ENDIAN);
        this.pos += 4;
    };
    Stream.prototype.uint32 = function (num) {
        this.view.setUint32(this.pos, num, BIG_ENDIAN);
        this.pos += 4;
    };
    Stream.prototype.float32 = function (num) {
        this.view.setFloat32(this.pos, num, BIG_ENDIAN);
        this.pos += 4;
    };
    Stream.prototype.float32Array = function (arr) {
        for (var i = 0; i < arr.length; ++i) {
            this.float32(arr[i]);
        }
    };
    Stream.prototype.uint8Array = function (arr) {
        for (var i = 0; i < arr.length; ++i) {
            this.uint8(arr[i]);
        }
    };
    Stream.prototype.uint16Array = function (arr) {
        for (var i = 0; i < arr.length; ++i) {
            this.uint16(arr[i]);
        }
    };
    Stream.prototype.int32Array = function (arr) {
        for (var i = 0; i < arr.length; ++i) {
            this.int32(arr[i]);
        }
    };
    Stream.prototype.uint32Array = function (arr) {
        for (var i = 0; i < arr.length; ++i) {
            this.uint32(arr[i]);
        }
    };
    Stream.prototype.str = function (str, len) {
        for (var i = 0; i < len; ++i, ++this.pos) {
            this.uint[this.pos] = i < str.length ? str.charCodeAt(i) : 0;
        }
    };
    Stream.prototype.animVector = function (animVector, type) {
        var isInt = type === AnimVectorType.INT1;
        this.int32(animVector.Keys.length);
        this.int32(animVector.LineType);
        this.int32(animVector.GlobalSeqId !== null ? animVector.GlobalSeqId : NONE);
        for (var _i = 0, _a = animVector.Keys; _i < _a.length; _i++) {
            var keyFrame = _a[_i];
            this.int32(keyFrame.Frame);
            if (isInt) {
                this.int32Array(keyFrame.Vector);
            }
            else {
                this.float32Array(keyFrame.Vector);
            }
            if (animVector.LineType === model_1.LineType.Hermite || animVector.LineType === model_1.LineType.Bezier) {
                if (isInt) {
                    this.int32Array(keyFrame.InTan);
                    this.int32Array(keyFrame.OutTan);
                }
                else {
                    this.float32Array(keyFrame.InTan);
                    this.float32Array(keyFrame.OutTan);
                }
            }
        }
    };
    return Stream;
}());
function generateExtent(obj, stream) {
    stream.float32(obj.BoundsRadius || 0);
    for (var _i = 0, _a = ['MinimumExtent', 'MaximumExtent']; _i < _a.length; _i++) {
        var key = _a[_i];
        stream.float32Array(obj[key]);
    }
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
function byteLengthAnimVector(animVector, type) {
    return 4 /* key count */ +
        4 /* LineType */ +
        4 /* GlobalSeqId */ +
        animVector.Keys.length * (4 /* frame */ +
            4 * animVectorSize[type] *
                (animVector.LineType === model_1.LineType.Hermite || animVector.LineType === model_1.LineType.Bezier ? 3 : 1));
}
function sum(arr) {
    return arr.reduce(function (a, b) {
        return a + b;
    }, 0);
}
function byteLengthVersion() {
    return 4 /* keyword */ +
        4 /* size */ +
        4 /* version */;
}
function generateVersion(model, stream) {
    stream.keyword('VERS');
    stream.int32(4);
    stream.int32(model.Version);
}
var MODEL_NAME_LENGTH = 0x150;
function byteLengthModelInfo() {
    return 4 /* keyword */ +
        4 /* size */ +
        MODEL_NAME_LENGTH +
        4 /* 4-byte zero ? */ +
        4 * 7 /* extent */ +
        4; /* blend time */
}
function generateModelInfo(model, stream) {
    stream.keyword('MODL');
    stream.int32(byteLengthModelInfo() - 8);
    stream.str(model.Info.Name, MODEL_NAME_LENGTH);
    stream.int32(0);
    generateExtent(model.Info, stream);
    stream.int32(model.Info.BlendTime);
}
var MODEL_SEQUENCE_NAME_LENGTH = 0x50;
function byteLengthSequence() {
    return MODEL_SEQUENCE_NAME_LENGTH +
        4 * 2 /* interval */ +
        4 /* MoveSpeed */ +
        4 /* NonLooping */ +
        4 /* Rarity */ +
        4 +
        4 * 7; /* extent */
}
function byteLengthSequences(model) {
    if (!model.Sequences.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Sequences.map(byteLengthSequence));
}
function generateSequences(model, stream) {
    if (!model.Sequences.length) {
        return;
    }
    stream.keyword('SEQS');
    stream.int32(byteLengthSequences(model) - 8);
    for (var _i = 0, _a = model.Sequences; _i < _a.length; _i++) {
        var sequence = _a[_i];
        stream.str(sequence.Name, MODEL_SEQUENCE_NAME_LENGTH);
        stream.int32(sequence.Interval[0]);
        stream.int32(sequence.Interval[1]);
        stream.float32(sequence.MoveSpeed);
        stream.int32(sequence.NonLooping ? 1 : 0);
        stream.float32(sequence.Rarity);
        stream.int32(0);
        generateExtent(sequence, stream);
    }
}
function byteLengthGlobalSequences(model) {
    if (!model.GlobalSequences || !model.GlobalSequences.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        4 * model.GlobalSequences.length;
}
function generateGlobalSequences(model, stream) {
    if (!model.GlobalSequences || !model.GlobalSequences.length) {
        return;
    }
    stream.keyword('GLBS');
    stream.int32(model.GlobalSequences.length * 4);
    for (var _i = 0, _a = model.GlobalSequences; _i < _a.length; _i++) {
        var duration = _a[_i];
        stream.int32(duration);
    }
}
function byteLengthLayer(layer) {
    return 4 /* size */ +
        4 /* FilterMode */ +
        4 /* Shading */ +
        4 /* static TextureID */ +
        4 /* TVertexAnimId */ +
        4 +
        4 /* static Alpha */ +
        (layer.Alpha !== null && typeof layer.Alpha !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(layer.Alpha, AnimVectorType.FLOAT1) :
            0) +
        (layer.TextureID !== null && typeof layer.TextureID !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(layer.TextureID, AnimVectorType.INT1) :
            0);
}
function byteLengthMaterial(material) {
    return 4 /* size */ +
        4 /* PriorityPlane */ +
        4 /* RenderMode */ +
        4 /* LAYS keyword */ +
        4 /* layer count */ +
        sum(material.Layers.map(function (layer) { return byteLengthLayer(layer); }));
}
function byteLengthMaterials(model) {
    if (!model.Materials.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Materials.map(function (material) { return byteLengthMaterial(material); }));
}
function generateMaterials(model, stream) {
    if (!model.Materials.length) {
        return;
    }
    stream.keyword('MTLS');
    stream.int32(byteLengthMaterials(model) - 8);
    for (var _i = 0, _a = model.Materials; _i < _a.length; _i++) {
        var material = _a[_i];
        stream.int32(byteLengthMaterial(material));
        stream.int32(material.PriorityPlane);
        stream.int32(material.RenderMode);
        stream.keyword('LAYS');
        stream.int32(material.Layers.length);
        for (var _b = 0, _c = material.Layers; _b < _c.length; _b++) {
            var layer = _c[_b];
            stream.int32(byteLengthLayer(layer));
            stream.int32(layer.FilterMode);
            stream.int32(layer.Shading);
            stream.int32(typeof layer.TextureID === 'number' ? layer.TextureID : 0);
            stream.int32(layer.TVertexAnimId !== null ? layer.TVertexAnimId : NONE);
            stream.int32(layer.CoordId);
            stream.float32(typeof layer.Alpha === 'number' ? layer.Alpha : 1);
            if (layer.Alpha && typeof layer.Alpha !== 'number') {
                stream.keyword('KMTA');
                stream.animVector(layer.Alpha, AnimVectorType.FLOAT1);
            }
            if (layer.TextureID && typeof layer.TextureID !== 'number') {
                stream.keyword('KMTF');
                stream.animVector(layer.TextureID, AnimVectorType.INT1);
            }
        }
    }
}
var MODEL_TEXTURE_PATH_LENGTH = 0x100;
function byteLengthTexture() {
    return 4 /* ReplaceableId */ +
        MODEL_TEXTURE_PATH_LENGTH +
        4 /* str trailing zero ? */ +
        4 /* Flags */;
}
function byteLengthTextures(model) {
    if (!model.Textures.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Textures.map(function (texture) { return byteLengthTexture(); }));
}
function generateTextures(model, stream) {
    if (!model.Textures.length) {
        return;
    }
    stream.keyword('TEXS');
    stream.int32(byteLengthTextures(model) - 8);
    for (var _i = 0, _a = model.Textures; _i < _a.length; _i++) {
        var texture = _a[_i];
        stream.int32(texture.ReplaceableId);
        stream.str(texture.Image, MODEL_TEXTURE_PATH_LENGTH);
        stream.int32(0);
        stream.int32(texture.Flags);
    }
}
function byteLengthTextureAnim(anim) {
    return 4 /* size */ +
        (anim.Translation ? 4 /* keyword */ + byteLengthAnimVector(anim.Translation, AnimVectorType.FLOAT3) : 0) +
        (anim.Rotation ? 4 /* keyword */ + byteLengthAnimVector(anim.Rotation, AnimVectorType.FLOAT4) : 0) +
        (anim.Scaling ? 4 /* keyword */ + byteLengthAnimVector(anim.Scaling, AnimVectorType.FLOAT3) : 0);
}
function byteLengthTextureAnims(model) {
    if (!model.TextureAnims || !model.TextureAnims.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.TextureAnims.map(function (anim) { return byteLengthTextureAnim(anim); }));
}
function generateTextureAnims(model, stream) {
    if (!model.TextureAnims || !model.TextureAnims.length) {
        return;
    }
    stream.keyword('TXAN');
    stream.int32(byteLengthTextureAnims(model) - 8);
    for (var _i = 0, _a = model.TextureAnims; _i < _a.length; _i++) {
        var anim = _a[_i];
        stream.int32(byteLengthTextureAnim(anim));
        if (anim.Translation) {
            stream.keyword('KTAT');
            stream.animVector(anim.Translation, AnimVectorType.FLOAT3);
        }
        if (anim.Rotation) {
            stream.keyword('KTAR');
            stream.animVector(anim.Rotation, AnimVectorType.FLOAT4);
        }
        if (anim.Scaling) {
            stream.keyword('KTAS');
            stream.animVector(anim.Scaling, AnimVectorType.FLOAT3);
        }
    }
}
function byteLengthGeoset(geoset) {
    return 4 /* size */ +
        4 /* VRTX keyword */ +
        4 /* vertices count */ +
        4 * geoset.Vertices.length /* vertices data */ +
        4 /* NRMS keyword */ +
        4 /* normals count */ +
        4 * geoset.Normals.length /* normals data */ +
        4 /* PTYP keyword */ +
        4 /* primitive count */ +
        4 /* int "4" */ +
        4 /* PCNT keyword */ +
        4 /* face group count */ +
        4 /* faces count */ +
        4 /* PVTX keyword */ +
        4 /* indices count */ +
        2 * geoset.Faces.length /* indices data */ +
        4 /* GNDX keyword */ +
        4 /* vertex group count */ +
        geoset.VertexGroup.length /* vertex group data */ +
        4 /* MTGC keyword */ +
        4 /* group count */ +
        4 * geoset.Groups.length /* group data */ +
        4 /* MATS keyword */ +
        4 /* total group count */ +
        4 * geoset.TotalGroupsCount /* groups data */ +
        4 /* MaterialID */ +
        4 /* SelectionGroup */ +
        4 /* Unselectable */ +
        4 * 7 /* extent */ +
        4 /* geoset anim count */ +
        4 * 7 * geoset.Anims.length /* geoset anim data */ +
        4 /* UVAS keyword */ +
        4 /* TVertices count */ +
        sum(geoset.TVertices.map(function (tvertices) {
            return 4 /* UVBS keyword */ +
                4 /* texture coord count */ +
                4 * tvertices.length;
        } /* texture coord data */));
}
function byteLengthGeosets(model) {
    if (!model.Geosets.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Geosets.map(function (geoset) { return byteLengthGeoset(geoset); }));
}
function generateGeosets(model, stream) {
    if (!model.Geosets.length) {
        return;
    }
    stream.keyword('GEOS');
    stream.int32(byteLengthGeosets(model) - 8);
    for (var _i = 0, _a = model.Geosets; _i < _a.length; _i++) {
        var geoset = _a[_i];
        stream.int32(byteLengthGeoset(geoset));
        stream.keyword('VRTX');
        stream.int32(geoset.Vertices.length / 3);
        stream.float32Array(geoset.Vertices);
        stream.keyword('NRMS');
        stream.int32(geoset.Normals.length / 3);
        stream.float32Array(geoset.Normals);
        stream.keyword('PTYP');
        stream.int32(1);
        stream.int32(4);
        stream.keyword('PCNT');
        stream.int32(1);
        stream.int32(geoset.Faces.length);
        stream.keyword('PVTX');
        stream.int32(geoset.Faces.length);
        stream.uint16Array(geoset.Faces);
        stream.keyword('GNDX');
        stream.int32(geoset.VertexGroup.length);
        stream.uint8Array(geoset.VertexGroup);
        stream.keyword('MTGC');
        stream.int32(geoset.Groups.length);
        for (var i = 0; i < geoset.Groups.length; ++i) {
            stream.int32(geoset.Groups[i].length);
        }
        stream.keyword('MATS');
        stream.int32(geoset.TotalGroupsCount);
        for (var _b = 0, _c = geoset.Groups; _b < _c.length; _b++) {
            var group = _c[_b];
            for (var _d = 0, group_1 = group; _d < group_1.length; _d++) {
                var index = group_1[_d];
                stream.int32(index);
            }
        }
        stream.int32(geoset.MaterialID);
        stream.int32(geoset.SelectionGroup);
        stream.int32(geoset.Unselectable ? 4 : 0);
        generateExtent(geoset, stream);
        stream.int32(geoset.Anims.length);
        for (var _e = 0, _f = geoset.Anims; _e < _f.length; _e++) {
            var anim = _f[_e];
            generateExtent(anim, stream);
        }
        stream.keyword('UVAS');
        stream.int32(geoset.TVertices.length);
        for (var _g = 0, _h = geoset.TVertices; _g < _h.length; _g++) {
            var tvertices = _h[_g];
            stream.keyword('UVBS');
            stream.int32(tvertices.length / 2);
            stream.float32Array(tvertices);
        }
    }
}
function byteLengthGeosetAnim(anim) {
    return 4 /* size */ +
        4 /* static Alpha */ +
        4 /* Flags */ +
        4 * 3 /* static Color */ +
        4 /* GeosetId */ +
        (typeof anim.Alpha !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(anim.Alpha, AnimVectorType.FLOAT1) :
            0) +
        (anim.Color && !(anim.Color instanceof Float32Array) ?
            4 /* keyword */ + byteLengthAnimVector(anim.Color, AnimVectorType.FLOAT3) :
            0);
}
function byteLengthGeosetAnims(model) {
    if (!model.GeosetAnims.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.GeosetAnims.map(function (anim) { return byteLengthGeosetAnim(anim); }));
}
function generateGeosetAnims(model, stream) {
    if (!model.GeosetAnims.length) {
        return;
    }
    stream.keyword('GEOA');
    stream.int32(byteLengthGeosetAnims(model) - 8);
    for (var _i = 0, _a = model.GeosetAnims; _i < _a.length; _i++) {
        var anim = _a[_i];
        stream.int32(byteLengthGeosetAnim(anim));
        stream.float32(typeof anim.Alpha === 'number' ? anim.Alpha : 1);
        stream.int32(anim.Flags);
        if (anim.Color && anim.Color instanceof Float32Array) {
            stream.float32(anim.Color[0]);
            stream.float32(anim.Color[1]);
            stream.float32(anim.Color[2]);
        }
        else {
            stream.float32(1);
            stream.float32(1);
            stream.float32(1);
        }
        stream.int32(anim.GeosetId !== null ? anim.GeosetId : NONE);
        if (anim.Alpha !== null && typeof anim.Alpha !== 'number') {
            stream.keyword('KGAO');
            stream.animVector(anim.Alpha, AnimVectorType.FLOAT1);
        }
        if (anim.Color && !(anim.Color instanceof Float32Array)) {
            stream.keyword('KGAC');
            stream.animVector(anim.Color, AnimVectorType.FLOAT3);
        }
    }
}
var MODEL_NODE_NAME_LENGTH = 0x50;
function byteLengthNode(node) {
    return 4 /* size */ +
        MODEL_NODE_NAME_LENGTH +
        4 /* ObjectId */ +
        4 /* Parent */ +
        4 /* Flags */ +
        (node.Translation ? 4 /*keyword */ + byteLengthAnimVector(node.Translation, AnimVectorType.FLOAT3) : 0) +
        (node.Rotation ? 4 /*keyword */ + byteLengthAnimVector(node.Rotation, AnimVectorType.FLOAT4) : 0) +
        (node.Scaling ? 4 /*keyword */ + byteLengthAnimVector(node.Scaling, AnimVectorType.FLOAT3) : 0);
}
function byteLengthBone(bone) {
    return byteLengthNode(bone) +
        4 /* GeosetId */ +
        4; /* GeosetAnimId */
}
function byteLengthBones(model) {
    if (!model.Bones.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Bones.map(byteLengthBone));
}
function generateNode(node, stream) {
    stream.int32(byteLengthNode(node));
    stream.str(node.Name, MODEL_NODE_NAME_LENGTH);
    stream.int32(node.ObjectId !== null ? node.ObjectId : NONE);
    stream.int32(node.Parent !== null ? node.Parent : NONE);
    stream.int32(node.Flags);
    if (node.Translation) {
        stream.keyword('KGTR');
        stream.animVector(node.Translation, AnimVectorType.FLOAT3);
    }
    if (node.Rotation) {
        stream.keyword('KGRT');
        stream.animVector(node.Rotation, AnimVectorType.FLOAT4);
    }
    if (node.Scaling) {
        stream.keyword('KGSC');
        stream.animVector(node.Scaling, AnimVectorType.FLOAT3);
    }
}
function generateBones(model, stream) {
    if (!model.Bones.length) {
        return;
    }
    stream.keyword('BONE');
    stream.int32(byteLengthBones(model) - 8);
    for (var _i = 0, _a = model.Bones; _i < _a.length; _i++) {
        var bone = _a[_i];
        generateNode(bone, stream);
        stream.int32(bone.GeosetId !== null ? bone.GeosetId : NONE);
        stream.int32(bone.GeosetAnimId !== null ? bone.GeosetAnimId : NONE);
    }
}
function byteLengthLight(light) {
    return 4 /* size */ +
        byteLengthNode(light) +
        4 /* LightType */ +
        4 /* AttenuationStart */ +
        4 /* AttenuationEnd */ +
        4 * 3 /* static Color */ +
        4 /* static Intensity */ +
        4 * 3 /* static AmbColor */ +
        4 /* static AmbIntensity */ +
        (light.Visibility ? 4 /* keyword */ + byteLengthAnimVector(light.Visibility, AnimVectorType.FLOAT1) : 0) +
        (light.Color && !(light.Color instanceof Float32Array) ?
            4 /* keyword */ + byteLengthAnimVector(light.Color, AnimVectorType.FLOAT3) :
            0) +
        (light.Intensity && typeof light.Intensity !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(light.Intensity, AnimVectorType.FLOAT1) :
            0) +
        (light.AttenuationStart && typeof light.AttenuationStart !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(light.AttenuationStart, AnimVectorType.FLOAT1) :
            0) +
        (light.AttenuationEnd && typeof light.AttenuationEnd !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(light.AttenuationEnd, AnimVectorType.FLOAT1) :
            0) +
        (light.AmbColor && !(light.AmbColor instanceof Float32Array) ?
            4 /* keyword */ + byteLengthAnimVector(light.AmbColor, AnimVectorType.FLOAT3) :
            0) +
        (light.AmbIntensity && typeof light.AmbIntensity !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(light.AmbIntensity, AnimVectorType.FLOAT1) :
            0);
}
function byteLengthLights(model) {
    if (!model.Lights.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Lights.map(byteLengthLight));
}
function generateLights(model, stream) {
    if (!model.Lights.length) {
        return;
    }
    stream.keyword('LITE');
    stream.int32(byteLengthLights(model) - 8);
    for (var _i = 0, _a = model.Lights; _i < _a.length; _i++) {
        var light = _a[_i];
        stream.int32(byteLengthLight(light));
        generateNode(light, stream);
        stream.int32(light.LightType);
        stream.float32(typeof light.AttenuationStart === 'number' ? light.AttenuationStart : 0);
        stream.float32(typeof light.AttenuationEnd === 'number' ? light.AttenuationEnd : 0);
        if (light.Color instanceof Float32Array) {
            stream.float32(light.Color[0]);
            stream.float32(light.Color[1]);
            stream.float32(light.Color[2]);
        }
        else {
            stream.float32(1);
            stream.float32(1);
            stream.float32(1);
        }
        stream.float32(typeof light.Intensity === 'number' ? light.Intensity : 0);
        if (light.AmbColor instanceof Float32Array) {
            stream.float32(light.AmbColor[0]);
            stream.float32(light.AmbColor[1]);
            stream.float32(light.AmbColor[2]);
        }
        else {
            stream.float32(1);
            stream.float32(1);
            stream.float32(1);
        }
        stream.float32(typeof light.AmbIntensity === 'number' ? light.AmbIntensity : 0);
        if (light.Intensity && typeof light.Intensity !== 'number') {
            stream.keyword('KLAI');
            stream.animVector(light.Intensity, AnimVectorType.FLOAT1);
        }
        if (light.Visibility) {
            stream.keyword('KLAV');
            stream.animVector(light.Visibility, AnimVectorType.FLOAT1);
        }
        if (light.Color && !(light.Color instanceof Float32Array)) {
            stream.keyword('KLAC');
            stream.animVector(light.Color, AnimVectorType.FLOAT3);
        }
        if (light.AmbColor && !(light.AmbColor instanceof Float32Array)) {
            stream.keyword('KLBC');
            stream.animVector(light.AmbColor, AnimVectorType.FLOAT3);
        }
        if (light.AmbIntensity && typeof light.AmbIntensity !== 'number') {
            stream.keyword('KLBI');
            stream.animVector(light.AmbIntensity, AnimVectorType.FLOAT1);
        }
        if (light.AttenuationStart && typeof light.AttenuationStart !== 'number') {
            stream.keyword('KLAS');
            stream.animVector(light.AttenuationStart, AnimVectorType.INT1);
        }
        if (light.AttenuationEnd && typeof light.AttenuationEnd !== 'number') {
            stream.keyword('KLAE');
            stream.animVector(light.AttenuationEnd, AnimVectorType.INT1);
        }
    }
}
function byteLengthHelpers(model) {
    if (model.Helpers.length === 0) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Helpers.map(byteLengthNode));
}
function generateHelpers(model, stream) {
    if (model.Helpers.length === 0) {
        return;
    }
    stream.keyword('HELP');
    stream.int32(byteLengthHelpers(model) - 8);
    for (var _i = 0, _a = model.Helpers; _i < _a.length; _i++) {
        var helper = _a[_i];
        generateNode(helper, stream);
    }
}
var MODEL_ATTACHMENT_PATH_LENGTH = 0x100;
function byteLengthAttachment(attachment) {
    return 4 /* size */ +
        byteLengthNode(attachment) +
        MODEL_ATTACHMENT_PATH_LENGTH +
        4 /* zero ? */ +
        4 /* AttachmentID */ +
        (attachment.Visibility ?
            4 /* keyword */ + byteLengthAnimVector(attachment.Visibility, AnimVectorType.FLOAT1) :
            0);
}
function byteLengthAttachments(model) {
    if (model.Attachments.length === 0) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Attachments.map(byteLengthAttachment));
}
function generateAttachments(model, stream) {
    if (model.Attachments.length === 0) {
        return;
    }
    stream.keyword('ATCH');
    stream.int32(byteLengthAttachments(model) - 8);
    for (var _i = 0, _a = model.Attachments; _i < _a.length; _i++) {
        var attachment = _a[_i];
        stream.int32(byteLengthAttachment(attachment));
        generateNode(attachment, stream);
        stream.str(attachment.Path || '', MODEL_ATTACHMENT_PATH_LENGTH);
        stream.int32(0);
        stream.int32(attachment.AttachmentID);
        if (attachment.Visibility) {
            stream.keyword('KATV');
            stream.animVector(attachment.Visibility, AnimVectorType.FLOAT1);
        }
    }
}
function byteLengthPivotPoints(model) {
    if (!model.PivotPoints.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        4 * 3 * model.PivotPoints.length;
}
function generatePivotPoints(model, stream) {
    if (!model.PivotPoints.length) {
        return;
    }
    stream.keyword('PIVT');
    stream.int32(model.PivotPoints.length * 4 * 3);
    for (var _i = 0, _a = model.PivotPoints; _i < _a.length; _i++) {
        var point = _a[_i];
        stream.float32Array(point);
    }
}
var MODEL_PARTICLE_EMITTER_PATH_LENGTH = 0x100;
function byteLengthParticleEmitter(emitter) {
    return 4 /* size */ +
        byteLengthNode(emitter) +
        4 /* EmissionRate */ +
        4 /* Gravity */ +
        4 /* Longitude */ +
        4 /* Latitude */ +
        MODEL_PARTICLE_EMITTER_PATH_LENGTH +
        4 +
        4 /* LifeSpan */ +
        4 /* InitVelocity */ +
        (emitter.Visibility && typeof emitter.Visibility !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Visibility, AnimVectorType.FLOAT1) :
            0) +
        (emitter.EmissionRate && typeof emitter.EmissionRate !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.EmissionRate, AnimVectorType.FLOAT1) :
            0) +
        (emitter.Gravity && typeof emitter.Gravity !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Gravity, AnimVectorType.FLOAT1) :
            0) +
        (emitter.Longitude && typeof emitter.Longitude !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Longitude, AnimVectorType.FLOAT1) :
            0) +
        (emitter.Latitude && typeof emitter.Latitude !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Latitude, AnimVectorType.FLOAT1) :
            0) +
        (emitter.LifeSpan && typeof emitter.LifeSpan !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.LifeSpan, AnimVectorType.FLOAT1) :
            0) +
        (emitter.InitVelocity && typeof emitter.InitVelocity !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.InitVelocity, AnimVectorType.FLOAT1) :
            0);
}
function byteLengthParticleEmitters(model) {
    if (!model.ParticleEmitters.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.ParticleEmitters.map(byteLengthParticleEmitter));
}
function generateParticleEmitters(model, stream) {
    if (!model.ParticleEmitters.length) {
        return;
    }
    stream.keyword('PREM');
    stream.int32(byteLengthParticleEmitters(model) - 8);
    for (var _i = 0, _a = model.ParticleEmitters; _i < _a.length; _i++) {
        var emitter = _a[_i];
        stream.int32(byteLengthParticleEmitter(emitter));
        generateNode(emitter, stream);
        stream.float32(typeof emitter.EmissionRate === 'number' ? emitter.EmissionRate : 0);
        stream.float32(typeof emitter.Gravity === 'number' ? emitter.Gravity : 0);
        stream.float32(typeof emitter.Longitude === 'number' ? emitter.Longitude : 0);
        stream.float32(typeof emitter.Latitude === 'number' ? emitter.Latitude : 0);
        stream.str(emitter.Path, MODEL_PARTICLE_EMITTER_PATH_LENGTH);
        stream.int32(0);
        stream.float32(typeof emitter.LifeSpan === 'number' ? emitter.LifeSpan : 0);
        stream.float32(typeof emitter.InitVelocity === 'number' ? emitter.InitVelocity : 0);
        if (emitter.Visibility && typeof emitter.Visibility !== 'number') {
            stream.keyword('KPEV');
            stream.animVector(emitter.Visibility, AnimVectorType.FLOAT1);
        }
        if (emitter.EmissionRate && typeof emitter.EmissionRate !== 'number') {
            stream.keyword('KPEE');
            stream.animVector(emitter.EmissionRate, AnimVectorType.FLOAT1);
        }
        if (emitter.Gravity && typeof emitter.Gravity !== 'number') {
            stream.keyword('KPEG');
            stream.animVector(emitter.Gravity, AnimVectorType.FLOAT1);
        }
        if (emitter.Longitude && typeof emitter.Longitude !== 'number') {
            stream.keyword('KPLN');
            stream.animVector(emitter.Longitude, AnimVectorType.FLOAT1);
        }
        if (emitter.Latitude && typeof emitter.Latitude !== 'number') {
            stream.keyword('KPLT');
            stream.animVector(emitter.Latitude, AnimVectorType.FLOAT1);
        }
        if (emitter.LifeSpan && typeof emitter.LifeSpan !== 'number') {
            stream.keyword('KPEL');
            stream.animVector(emitter.LifeSpan, AnimVectorType.FLOAT1);
        }
        if (emitter.InitVelocity && typeof emitter.InitVelocity !== 'number') {
            stream.keyword('KPES');
            stream.animVector(emitter.InitVelocity, AnimVectorType.FLOAT1);
        }
    }
}
function byteLengthParticleEmitter2(emitter) {
    return 4 /* size */ +
        byteLengthNode(emitter) +
        4 /* static Speed */ +
        4 /* Variation */ +
        4 /* static Latitude */ +
        4 /* Gravity */ +
        4 /* LifeSpan */ +
        4 /* static EmissionRate */ +
        4 /* static Length */ +
        4 /* static Width */ +
        4 /* FilterMode */ +
        4 /* Rows */ +
        4 /* Columns */ +
        4 /* FrameFlags */ +
        4 /* TailLength */ +
        4 /* Time */ +
        4 * 3 * 3 /* SegmentColor */ +
        3 /* Alpha uint * 3 */ +
        4 * 3 /* ParticleScaling */ +
        4 * 3 /* LifeSpanUVAnim */ +
        4 * 3 /* DecayUVAnim */ +
        4 * 3 /* TailUVAnim */ +
        4 * 3 /* TailDecayUVAnim */ +
        4 /* TextureID */ +
        4 /* Squirt */ +
        4 /* PriorityPlane */ +
        4 /* ReplaceableId */ +
        (emitter.Visibility && typeof emitter.Visibility !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Visibility, AnimVectorType.FLOAT1) :
            0) +
        (emitter.EmissionRate && typeof emitter.EmissionRate !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.EmissionRate, AnimVectorType.FLOAT1) :
            0) +
        (emitter.Width && typeof emitter.Width !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Width, AnimVectorType.FLOAT1) :
            0) +
        (emitter.Length && typeof emitter.Length !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Length, AnimVectorType.FLOAT1) :
            0) +
        (emitter.Speed && typeof emitter.Speed !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Speed, AnimVectorType.FLOAT1) :
            0) +
        (emitter.Latitude && typeof emitter.Latitude !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Latitude, AnimVectorType.FLOAT1) :
            0) +
        (emitter.Gravity && typeof emitter.Gravity !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Gravity, AnimVectorType.FLOAT1) :
            0) +
        (emitter.Variation && typeof emitter.Variation !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Variation, AnimVectorType.FLOAT1) :
            0);
}
function byteLengthParticleEmitters2(model) {
    if (!model.ParticleEmitters2.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.ParticleEmitters2.map(byteLengthParticleEmitter2));
}
function generateParticleEmitters2(model, stream) {
    if (!model.ParticleEmitters2.length) {
        return;
    }
    stream.keyword('PRE2');
    stream.int32(byteLengthParticleEmitters2(model) - 8);
    for (var _i = 0, _a = model.ParticleEmitters2; _i < _a.length; _i++) {
        var emitter = _a[_i];
        stream.int32(byteLengthParticleEmitter2(emitter));
        generateNode(emitter, stream);
        stream.float32(typeof emitter.Speed === 'number' ? emitter.Speed : 0);
        stream.float32(typeof emitter.Variation === 'number' ? emitter.Variation : 0);
        stream.float32(typeof emitter.Latitude === 'number' ? emitter.Latitude : 0);
        stream.float32(typeof emitter.Gravity === 'number' ? emitter.Gravity : 0);
        stream.float32(emitter.LifeSpan);
        stream.float32(typeof emitter.EmissionRate === 'number' ? emitter.EmissionRate : 0);
        stream.float32(typeof emitter.Width === 'number' ? emitter.Width : 0);
        stream.float32(typeof emitter.Length === 'number' ? emitter.Length : 0);
        stream.int32(emitter.FilterMode);
        stream.int32(emitter.Rows);
        stream.int32(emitter.Columns);
        if (emitter.FrameFlags & model_1.ParticleEmitter2FramesFlags.Head &&
            emitter.FrameFlags & model_1.ParticleEmitter2FramesFlags.Tail) {
            stream.int32(2);
        }
        else if (emitter.FrameFlags & model_1.ParticleEmitter2FramesFlags.Tail) {
            stream.int32(1);
        }
        else if (emitter.FrameFlags & model_1.ParticleEmitter2FramesFlags.Head) {
            stream.int32(0);
        }
        stream.float32(emitter.TailLength);
        stream.float32(emitter.Time);
        for (var i = 0; i < 3; ++i) {
            for (var j = 0; j < 3; ++j) {
                stream.float32(emitter.SegmentColor[i][j]);
            }
        }
        for (var i = 0; i < 3; ++i) {
            stream.uint8(emitter.Alpha[i]);
        }
        for (var i = 0; i < 3; ++i) {
            stream.float32(emitter.ParticleScaling[i]);
        }
        for (var _b = 0, _c = ['LifeSpanUVAnim', 'DecayUVAnim', 'TailUVAnim', 'TailDecayUVAnim']; _b < _c.length; _b++) {
            var part = _c[_b];
            for (var i = 0; i < 3; ++i) {
                stream.int32(emitter[part][i]);
            }
        }
        stream.int32(emitter.TextureID !== null ? emitter.TextureID : NONE);
        stream.int32(emitter.Squirt ? 1 : 0);
        stream.int32(emitter.PriorityPlane);
        stream.int32(emitter.ReplaceableId);
        if (emitter.Speed && typeof emitter.Speed !== 'number') {
            stream.keyword('KP2S');
            stream.animVector(emitter.Speed, AnimVectorType.FLOAT1);
        }
        if (emitter.Latitude && typeof emitter.Latitude !== 'number') {
            stream.keyword('KP2L');
            stream.animVector(emitter.Latitude, AnimVectorType.FLOAT1);
        }
        if (emitter.EmissionRate && typeof emitter.EmissionRate !== 'number') {
            stream.keyword('KP2E');
            stream.animVector(emitter.EmissionRate, AnimVectorType.FLOAT1);
        }
        if (emitter.Visibility && typeof emitter.Visibility !== 'number') {
            stream.keyword('KP2V');
            stream.animVector(emitter.Visibility, AnimVectorType.FLOAT1);
        }
        if (emitter.Length && typeof emitter.Length !== 'number') {
            stream.keyword('KP2N');
            stream.animVector(emitter.Length, AnimVectorType.FLOAT1);
        }
        if (emitter.Width && typeof emitter.Width !== 'number') {
            stream.keyword('KP2W');
            stream.animVector(emitter.Width, AnimVectorType.FLOAT1);
        }
        if (emitter.Gravity && typeof emitter.Gravity !== 'number') {
            stream.keyword('KP2G');
            stream.animVector(emitter.Gravity, AnimVectorType.FLOAT1);
        }
        if (emitter.Variation && typeof emitter.Variation !== 'number') {
            stream.keyword('KP2R');
            stream.animVector(emitter.Variation, AnimVectorType.FLOAT1);
        }
    }
}
function byteLengthRibbonEmitter(emitter) {
    return 4 /* size */ +
        byteLengthNode(emitter) +
        4 /* static HeightAbove */ +
        4 /* static HeightBelow */ +
        4 /* Alpha */ +
        4 * 3 /* Color */ +
        4 /* LifeSpan */ +
        4 /* TextureSlot */ +
        4 /* EmissionRate */ +
        4 /* Rows */ +
        4 /* Columns */ +
        4 /* MaterialID */ +
        4 /* Gravity */ +
        (emitter.Visibility ? 4 /* keyword */ + byteLengthAnimVector(emitter.Visibility, AnimVectorType.FLOAT1) : 0) +
        (typeof emitter.HeightAbove !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.HeightAbove, AnimVectorType.FLOAT1) :
            0) +
        (typeof emitter.HeightBelow !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.HeightBelow, AnimVectorType.FLOAT1) :
            0) +
        (typeof emitter.Alpha !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.Alpha, AnimVectorType.FLOAT1) :
            0) +
        (typeof emitter.TextureSlot !== 'number' ?
            4 /* keyword */ + byteLengthAnimVector(emitter.TextureSlot, AnimVectorType.FLOAT1) :
            0);
}
function byteLengthRibbonEmitters(model) {
    if (!model.RibbonEmitters.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.RibbonEmitters.map(byteLengthRibbonEmitter));
}
function generateRibbonEmitters(model, stream) {
    if (!model.RibbonEmitters.length) {
        return;
    }
    stream.keyword('RIBB');
    stream.int32(byteLengthRibbonEmitters(model) - 8);
    for (var _i = 0, _a = model.RibbonEmitters; _i < _a.length; _i++) {
        var emitter = _a[_i];
        stream.int32(byteLengthRibbonEmitter(emitter));
        generateNode(emitter, stream);
        stream.float32(typeof emitter.HeightAbove === 'number' ? emitter.HeightAbove : 0);
        stream.float32(typeof emitter.HeightBelow === 'number' ? emitter.HeightBelow : 0);
        stream.float32(typeof emitter.Alpha === 'number' ? emitter.Alpha : 0);
        if (emitter.Color) {
            stream.float32Array(emitter.Color);
        }
        else {
            stream.float32(1);
            stream.float32(1);
            stream.float32(1);
        }
        stream.float32(emitter.LifeSpan);
        stream.int32(typeof emitter.TextureSlot === 'number' ? emitter.TextureSlot : 0);
        stream.int32(emitter.EmissionRate);
        stream.int32(emitter.Rows);
        stream.int32(emitter.Columns);
        stream.int32(emitter.MaterialID);
        stream.float32(emitter.Gravity);
        if (emitter.Visibility) {
            stream.keyword('KRVS');
            stream.animVector(emitter.Visibility, AnimVectorType.FLOAT1);
        }
        if (typeof emitter.HeightAbove !== 'number') {
            stream.keyword('KRHA');
            stream.animVector(emitter.HeightAbove, AnimVectorType.FLOAT1);
        }
        if (typeof emitter.HeightBelow !== 'number') {
            stream.keyword('KRHB');
            stream.animVector(emitter.HeightBelow, AnimVectorType.FLOAT1);
        }
        if (typeof emitter.Alpha !== 'number') {
            stream.keyword('KRAL');
            stream.animVector(emitter.Alpha, AnimVectorType.FLOAT1);
        }
        if (typeof emitter.TextureSlot !== 'number') {
            stream.keyword('KRTX');
            stream.animVector(emitter.TextureSlot, AnimVectorType.INT1);
        }
    }
}
var MODEL_CAMERA_NAME_LENGTH = 0x50;
function byteLengthCamera(camera) {
    return 4 /* size */ +
        MODEL_CAMERA_NAME_LENGTH +
        4 * 3 /* Position */ +
        4 /* FieldOfView */ +
        4 /* FarClip */ +
        4 /* NearClip */ +
        4 * 3 /* TargetPosition */ +
        (camera.Translation ? 4 /* keyword */ + byteLengthAnimVector(camera.Translation, AnimVectorType.FLOAT3) : 0) +
        (camera.TargetTranslation ?
            4 /* keyword */ + byteLengthAnimVector(camera.TargetTranslation, AnimVectorType.FLOAT3) :
            0) +
        (camera.Rotation ? 4 /* keyword */ + byteLengthAnimVector(camera.Rotation, AnimVectorType.FLOAT1) : 0);
}
function byteLengthCameras(model) {
    if (!model.Cameras.length) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.Cameras.map(byteLengthCamera));
}
function generateCameras(model, stream) {
    if (!model.Cameras.length) {
        return;
    }
    stream.keyword('CAMS');
    stream.int32(byteLengthCameras(model) - 8);
    for (var _i = 0, _a = model.Cameras; _i < _a.length; _i++) {
        var camera = _a[_i];
        stream.int32(byteLengthCamera(camera));
        stream.str(camera.Name, MODEL_CAMERA_NAME_LENGTH);
        stream.float32Array(camera.Position);
        stream.float32(camera.FieldOfView);
        stream.float32(camera.FarClip);
        stream.float32(camera.NearClip);
        stream.float32Array(camera.TargetPosition);
        if (camera.Translation) {
            stream.keyword('KCTR');
            stream.animVector(camera.Translation, AnimVectorType.FLOAT3);
        }
        if (camera.Rotation) {
            stream.keyword('KCRL');
            stream.animVector(camera.Rotation, AnimVectorType.FLOAT1);
        }
        if (camera.TargetTranslation) {
            stream.keyword('KTTR');
            stream.animVector(camera.TargetTranslation, AnimVectorType.FLOAT3);
        }
    }
}
function byteLengthEventObject(eventObject) {
    return byteLengthNode(eventObject) +
        4 /* KEVT keyword */ +
        4 /* count */ +
        4 +
        4 * eventObject.EventTrack.length;
}
function byteLengthEventObjects(model) {
    if (model.EventObjects.length === 0) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.EventObjects.map(byteLengthEventObject));
}
function generateEventObjects(model, stream) {
    if (model.EventObjects.length === 0) {
        return;
    }
    stream.keyword('EVTS');
    stream.int32(byteLengthEventObjects(model) - 8);
    for (var _i = 0, _a = model.EventObjects; _i < _a.length; _i++) {
        var eventObject = _a[_i];
        generateNode(eventObject, stream);
        stream.keyword('KEVT');
        stream.int32(eventObject.EventTrack.length);
        // todo GlobalSequenceId
        stream.int32(NONE); // GlobalSequenceId ?
        stream.uint32Array(eventObject.EventTrack);
    }
}
function byteLengthCollisionShape(collisionShape) {
    return byteLengthNode(collisionShape) +
        4 /* Shape */ +
        (collisionShape.Shape === model_1.CollisionShapeType.Box ? 6 : 3) * 4 /* Vertices */ +
        (collisionShape.Shape === model_1.CollisionShapeType.Sphere ? 4 : 0); /* BoundsRadius */
}
function byteLengthCollisionShapes(model) {
    if (model.CollisionShapes.length === 0) {
        return 0;
    }
    return 4 /* keyword */ +
        4 /* size */ +
        sum(model.CollisionShapes.map(byteLengthCollisionShape));
}
function generateCollisionShapes(model, stream) {
    if (model.CollisionShapes.length === 0) {
        return;
    }
    stream.keyword('CLID');
    stream.int32(byteLengthCollisionShapes(model) - 8);
    for (var _i = 0, _a = model.CollisionShapes; _i < _a.length; _i++) {
        var collisionShape = _a[_i];
        generateNode(collisionShape, stream);
        stream.int32(collisionShape.Shape);
        stream.float32Array(collisionShape.Vertices);
        if (collisionShape.Shape === model_1.CollisionShapeType.Sphere) {
            stream.float32(collisionShape.BoundsRadius);
        }
    }
}
var byteLength = [
    byteLengthVersion,
    byteLengthModelInfo,
    byteLengthSequences,
    byteLengthGlobalSequences,
    byteLengthMaterials,
    byteLengthTextures,
    byteLengthTextureAnims,
    byteLengthGeosets,
    byteLengthGeosetAnims,
    byteLengthBones,
    byteLengthLights,
    byteLengthHelpers,
    byteLengthAttachments,
    byteLengthPivotPoints,
    byteLengthParticleEmitters,
    byteLengthParticleEmitters2,
    byteLengthRibbonEmitters,
    byteLengthCameras,
    byteLengthEventObjects,
    byteLengthCollisionShapes
];
var generators = [
    generateVersion,
    generateModelInfo,
    generateSequences,
    generateGlobalSequences,
    generateMaterials,
    generateTextures,
    generateTextureAnims,
    generateGeosets,
    generateGeosetAnims,
    generateBones,
    generateLights,
    generateHelpers,
    generateAttachments,
    generatePivotPoints,
    generateParticleEmitters,
    generateParticleEmitters2,
    generateRibbonEmitters,
    generateCameras,
    generateEventObjects,
    generateCollisionShapes
];
function generate(model) {
    var totalLength = 4 /* format keyword */;
    for (var _i = 0, byteLength_1 = byteLength; _i < byteLength_1.length; _i++) {
        var lenFunc = byteLength_1[_i];
        totalLength += lenFunc(model);
    }
    var res = new ArrayBuffer(totalLength);
    var stream = new Stream(res);
    stream.keyword('MDLX');
    for (var _a = 0, generators_1 = generators; _a < generators_1.length; _a++) {
        var generator = generators_1[_a];
        generator(model, stream);
    }
    return res;
}
exports.generate = generate;
var _a;
//# sourceMappingURL=generate.js.map
},{"../model":7}],6:[function(require,module,exports){
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
            for (var j = 0; j < textureCoordsCount * 2; ++j) {
                tvertices[j] = state.float32();
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
//# sourceMappingURL=parse.js.map
},{"../model":7}],7:[function(require,module,exports){
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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImRvY3Mvb3B0ZnJhbWVzL29wdGZyYW1lcy5qcyIsImRvY3Mvc2hpbS5qcyIsIm1kbC9nZW5lcmF0ZS5qcyIsIm1kbC9wYXJzZS5qcyIsIm1keC9nZW5lcmF0ZS5qcyIsIm1keC9wYXJzZS5qcyIsIm1vZGVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzd0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcnRDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3Z6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHBhcnNlXzEgPSByZXF1aXJlKFwiLi4vLi4vbWRsL3BhcnNlXCIpO1xudmFyIHBhcnNlXzIgPSByZXF1aXJlKFwiLi4vLi4vbWR4L3BhcnNlXCIpO1xudmFyIGdlbmVyYXRlXzEgPSByZXF1aXJlKFwiLi4vLi4vbWRsL2dlbmVyYXRlXCIpO1xudmFyIGdlbmVyYXRlXzIgPSByZXF1aXJlKFwiLi4vLi4vbWR4L2dlbmVyYXRlXCIpO1xucmVxdWlyZShcIi4uL3NoaW1cIik7XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNvbnRhaW5lcicpO1xuICAgIHZhciBzYXZlTURMID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNhdmVbZGF0YS10eXBlPVwibWRsXCJdJyk7XG4gICAgdmFyIHNhdmVNRFggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2F2ZVtkYXRhLXR5cGU9XCJtZHhcIl0nKTtcbiAgICB2YXIgbGFiZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubGFiZWwnKTtcbiAgICB2YXIgbG9nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmxvZycpO1xuICAgIHZhciBkcm9wVGFyZ2V0O1xuICAgIHZhciBtb2RlbDtcbiAgICB2YXIgY2xlYW5lZE5hbWU7XG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbnRlcicsIGZ1bmN0aW9uIG9uRHJhZ0VudGVyKGV2ZW50KSB7XG4gICAgICAgIGRyb3BUYXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdjb250YWluZXJfZHJhZycpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCBmdW5jdGlvbiBvbkRyYWdMZWF2ZShldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSBkcm9wVGFyZ2V0KSB7XG4gICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnY29udGFpbmVyX2RyYWcnKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIGZ1bmN0aW9uIG9uRHJhZ0xlYXZlKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ2NvcHknO1xuICAgIH0pO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgZnVuY3Rpb24gb25Ecm9wKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCdjb250YWluZXJfZHJhZycpO1xuICAgICAgICB2YXIgZmlsZSA9IGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlcyAmJiBldmVudC5kYXRhVHJhbnNmZXIuZmlsZXNbMF07XG4gICAgICAgIGlmICghZmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgaXNNRFggPSBmaWxlLm5hbWUuaW5kZXhPZignLm1keCcpID4gLTE7XG4gICAgICAgIGNsZWFuZWROYW1lID0gZmlsZS5uYW1lLnJlcGxhY2UoL1xcLlteLl0rJC8sICcnKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTURYKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsID0gcGFyc2VfMi5wYXJzZShyZWFkZXIucmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsID0gcGFyc2VfMS5wYXJzZShyZWFkZXIucmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgc2hvd0Vycm9yKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJvY2Vzc01vZGVsKCk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChpc01EWCkge1xuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBbc2F2ZU1ETCwgc2F2ZU1EWF0uZm9yRWFjaChmdW5jdGlvbiAoYnV0dG9uKSB7XG4gICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIHNhdmUoZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgcmVzO1xuICAgICAgICAgICAgdmFyIGlzTURMID0gYnV0dG9uLmdldEF0dHJpYnV0ZSgnZGF0YS10eXBlJykgPT09ICdtZGwnO1xuICAgICAgICAgICAgaWYgKGlzTURMKSB7XG4gICAgICAgICAgICAgICAgcmVzID0gbmV3IEJsb2IoW2dlbmVyYXRlXzEuZ2VuZXJhdGUobW9kZWwpXSwgeyB0eXBlOiAnb2N0ZXQvc3RyZWFtJyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcyA9IG5ldyBCbG9iKFtnZW5lcmF0ZV8yLmdlbmVyYXRlKG1vZGVsKV0sIHsgdHlwZTogJ29jdGV0L3N0cmVhbScgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGxpbmsuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobGluayk7XG4gICAgICAgICAgICBsaW5rLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKHJlcyk7XG4gICAgICAgICAgICBsaW5rLmRvd25sb2FkID0gY2xlYW5lZE5hbWUgKyAoaXNNREwgPyAnLm1kbCcgOiAnLm1keCcpO1xuICAgICAgICAgICAgbGluay5jbGljaygpO1xuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChsaW5rLmhyZWYpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChsaW5rKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgZnVuY3Rpb24gY2xlYXJMb2coKSB7XG4gICAgICAgIGxvZy5pbm5lckhUTUwgPSAnJztcbiAgICB9XG4gICAgZnVuY3Rpb24gbG9nU3RyKHN0cikge1xuICAgICAgICB2YXIgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgICAgICAgcC50ZXh0Q29udGVudCA9IHN0cjtcbiAgICAgICAgbG9nLmFwcGVuZENoaWxkKHApO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwcm9jZXNzTW9kZWwoKSB7XG4gICAgICAgIGNsZWFyTG9nKCk7XG4gICAgICAgIGxvZ1N0cignT3B0aW1pemF0aW9uIGlzIGxvc3N5LCBtYWtlIHN1cmUgdG8gdGVzdCByZXN1bHQgbW9kZWxzJyk7XG4gICAgICAgIHZhciB0b3RhbEtleXMgPSAwLCBjbGVhbmVkS2V5cyA9IDA7XG4gICAgICAgIHZhciBpc1NhbWVLZXkgPSBmdW5jdGlvbiAoa2V5ZnJhbWUwLCBrZXlmcmFtZTEpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5ZnJhbWUwLlZlY3Rvci5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGlmIChrZXlmcmFtZTAuVmVjdG9yW2ldICE9PSBrZXlmcmFtZTEuVmVjdG9yW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoa2V5ZnJhbWUwLkluVGFuKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlmcmFtZTAuSW5UYW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleWZyYW1lMC5JblRhbltpXSAhPT0ga2V5ZnJhbWUxLkluVGFuW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlmcmFtZTAuT3V0VGFuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXlmcmFtZTAuT3V0VGFuW2ldICE9PSBrZXlmcmFtZTEuT3V0VGFuW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHByb2Nlc3NLZXlzID0gZnVuY3Rpb24gKG9iaiwga2V5KSB7XG4gICAgICAgICAgICB2YXIgYW5pbVZlY3RvciA9IG9ialtrZXldO1xuICAgICAgICAgICAgdmFyIHNlcXVlbmNlcyA9IG1vZGVsLlNlcXVlbmNlcztcbiAgICAgICAgICAgIHZhciBnbG9iYWxTZXF1ZW5jZXMgPSBtb2RlbC5HbG9iYWxTZXF1ZW5jZXM7XG4gICAgICAgICAgICBpZiAoIWFuaW1WZWN0b3IgfHwgIWFuaW1WZWN0b3IuS2V5cykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRvdGFsS2V5cyArPSBhbmltVmVjdG9yLktleXMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIG5ld0tleXMgPSBbXTtcbiAgICAgICAgICAgIHZhciBwcm9jZXNzQW5pbSA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xuICAgICAgICAgICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IGFuaW1WZWN0b3IuS2V5czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleWZyYW1lID0gX2FbX2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ZnJhbWUuRnJhbWUgPj0gZnJvbSAmJiBrZXlmcmFtZS5GcmFtZSA8PSB0bykge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleWZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcHJldktleSA9IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIGZpbHRlcmVkID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcHJldktleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldktleSA9IGtleXNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKGtleXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoaXNTYW1lS2V5KGtleXNbaV0sIHByZXZLZXkpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGkgKyAxID09PSBrZXlzLmxlbmd0aCB8fCBpc1NhbWVLZXkoa2V5c1tpXSwga2V5c1tpICsgMV0pKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKGtleXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldktleSA9IGtleXNbaV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV3S2V5cyA9IG5ld0tleXMuY29uY2F0KGZpbHRlcmVkKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoYW5pbVZlY3Rvci5HbG9iYWxTZXFJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3NBbmltKDAsIGdsb2JhbFNlcXVlbmNlc1thbmltVmVjdG9yLkdsb2JhbFNlcUlkXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIHNlcXVlbmNlc18xID0gc2VxdWVuY2VzOyBfaSA8IHNlcXVlbmNlc18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYW5pbSA9IHNlcXVlbmNlc18xW19pXTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0FuaW0oYW5pbS5JbnRlcnZhbFswXSwgYW5pbS5JbnRlcnZhbFsxXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xlYW5lZEtleXMgKz0gYW5pbVZlY3Rvci5LZXlzLmxlbmd0aCAtIG5ld0tleXMubGVuZ3RoO1xuICAgICAgICAgICAgYW5pbVZlY3Rvci5LZXlzID0gbmV3S2V5cztcbiAgICAgICAgfTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IG1vZGVsLk5vZGVzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBfYVtfaV07XG4gICAgICAgICAgICBwcm9jZXNzS2V5cyhub2RlLCAnVHJhbnNsYXRpb24nKTtcbiAgICAgICAgICAgIHByb2Nlc3NLZXlzKG5vZGUsICdSb3RhdGlvbicpO1xuICAgICAgICAgICAgcHJvY2Vzc0tleXMobm9kZSwgJ1NjYWxpbmcnKTtcbiAgICAgICAgICAgIHByb2Nlc3NLZXlzKG5vZGUsICdWaXNpYmlsaXR5Jyk7XG4gICAgICAgICAgICBwcm9jZXNzS2V5cyhub2RlLCAnRW1pc3Npb25SYXRlJyk7XG4gICAgICAgICAgICBwcm9jZXNzS2V5cyhub2RlLCAnR3Jhdml0eScpO1xuICAgICAgICAgICAgcHJvY2Vzc0tleXMobm9kZSwgJ0xhdGl0dWRlJyk7XG4gICAgICAgICAgICBwcm9jZXNzS2V5cyhub2RlLCAnTGlmZVNwYW4nKTtcbiAgICAgICAgICAgIHByb2Nlc3NLZXlzKG5vZGUsICdJbml0VmVsb2NpdHknKTtcbiAgICAgICAgICAgIHByb2Nlc3NLZXlzKG5vZGUsICdTcGVlZCcpO1xuICAgICAgICAgICAgcHJvY2Vzc0tleXMobm9kZSwgJ1ZhcmlhdGlvbicpO1xuICAgICAgICAgICAgcHJvY2Vzc0tleXMobm9kZSwgJ1dpZHRoJyk7XG4gICAgICAgICAgICBwcm9jZXNzS2V5cyhub2RlLCAnTGVuZ3RoJyk7XG4gICAgICAgICAgICBwcm9jZXNzS2V5cyhub2RlLCAnQXR0ZW51YXRpb25TdGFydCcpO1xuICAgICAgICAgICAgcHJvY2Vzc0tleXMobm9kZSwgJ0F0dGVudWF0aW9uRW5kJyk7XG4gICAgICAgICAgICBwcm9jZXNzS2V5cyhub2RlLCAnQ29sb3InKTtcbiAgICAgICAgICAgIHByb2Nlc3NLZXlzKG5vZGUsICdJbnRlbnNpdHknKTtcbiAgICAgICAgICAgIHByb2Nlc3NLZXlzKG5vZGUsICdBbWJJbnRlbnNpdHknKTtcbiAgICAgICAgICAgIHByb2Nlc3NLZXlzKG5vZGUsICdBbWJDb2xvcicpO1xuICAgICAgICAgICAgcHJvY2Vzc0tleXMobm9kZSwgJ0hlaWdodEFib3ZlJyk7XG4gICAgICAgICAgICBwcm9jZXNzS2V5cyhub2RlLCAnSGVpZ2h0QmVsb3cnKTtcbiAgICAgICAgICAgIHByb2Nlc3NLZXlzKG5vZGUsICdBbHBoYScpO1xuICAgICAgICAgICAgcHJvY2Vzc0tleXMobm9kZSwgJ1RleHR1cmVTbG90Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgX2IgPSAwLCBfYyA9IG1vZGVsLkNhbWVyYXM7IF9iIDwgX2MubGVuZ3RoOyBfYisrKSB7XG4gICAgICAgICAgICB2YXIgY2FtZXJhID0gX2NbX2JdO1xuICAgICAgICAgICAgcHJvY2Vzc0tleXMoY2FtZXJhLCAnVGFyZ2V0VHJhbnNsYXRpb24nKTtcbiAgICAgICAgICAgIHByb2Nlc3NLZXlzKGNhbWVyYSwgJ1RyYW5zbGF0aW9uJyk7XG4gICAgICAgICAgICBwcm9jZXNzS2V5cyhjYW1lcmEsICdSb3RhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIF9kID0gMCwgX2UgPSBtb2RlbC5UZXh0dXJlQW5pbXM7IF9kIDwgX2UubGVuZ3RoOyBfZCsrKSB7XG4gICAgICAgICAgICB2YXIgYW5pbSA9IF9lW19kXTtcbiAgICAgICAgICAgIHByb2Nlc3NLZXlzKGFuaW0sICdUcmFuc2xhdGlvbicpO1xuICAgICAgICAgICAgcHJvY2Vzc0tleXMoYW5pbSwgJ1JvdGF0aW9uJyk7XG4gICAgICAgICAgICBwcm9jZXNzS2V5cyhhbmltLCAnU2NhbGluZycpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIF9mID0gMCwgX2cgPSBtb2RlbC5NYXRlcmlhbHM7IF9mIDwgX2cubGVuZ3RoOyBfZisrKSB7XG4gICAgICAgICAgICB2YXIgbWF0ZXJpYWwgPSBfZ1tfZl07XG4gICAgICAgICAgICBmb3IgKHZhciBfaCA9IDAsIF9qID0gbWF0ZXJpYWwuTGF5ZXJzOyBfaCA8IF9qLmxlbmd0aDsgX2grKykge1xuICAgICAgICAgICAgICAgIHZhciBsYXllciA9IF9qW19oXTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzS2V5cyhsYXllciwgJ1RleHR1cmVJRCcpO1xuICAgICAgICAgICAgICAgIHByb2Nlc3NLZXlzKGxheWVyLCAnQWxwaGEnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsb2dTdHIoY2xlYW5lZEtleXMgKyAnLycgKyB0b3RhbEtleXMgKyAnIGZyYW1lcyByZW1vdmVkJyk7XG4gICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdjb250YWluZXJfd2l0aC1kYXRhJyk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNob3dFcnJvcihlcnIpIHtcbiAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ2NvbnRhaW5lcl93aXRoLWRhdGEnKTtcbiAgICAgICAgbGFiZWwudGV4dENvbnRlbnQgPSBlcnI7XG4gICAgfVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1vcHRmcmFtZXMuanMubWFwIiwiaWYgKCFGbG9hdDMyQXJyYXkucHJvdG90eXBlLnJldmVyc2UpIHtcbiAgICBGbG9hdDMyQXJyYXkucHJvdG90eXBlLnJldmVyc2UgPSBBcnJheS5wcm90b3R5cGUucmV2ZXJzZTtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIG1vZGVsXzEgPSByZXF1aXJlKFwiLi4vbW9kZWxcIik7XG52YXIgRkxPQVRfUFJFU0lDSU9OID0gNjtcbnZhciBFUFNJTE9OID0gMWUtNjtcbmZ1bmN0aW9uIGlzTm90RW1wdHlWZWMzKHZlYywgdmFsKSB7XG4gICAgaWYgKHZhbCA9PT0gdm9pZCAwKSB7IHZhbCA9IDA7IH1cbiAgICByZXR1cm4gTWF0aC5hYnModmVjWzBdIC0gdmFsKSA+IEVQU0lMT04gfHxcbiAgICAgICAgTWF0aC5hYnModmVjWzFdIC0gdmFsKSA+IEVQU0lMT04gfHxcbiAgICAgICAgTWF0aC5hYnModmVjWzJdIC0gdmFsKSA+IEVQU0lMT047XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVRhYih0YWJTaXplKSB7XG4gICAgaWYgKHRhYlNpemUgPT09IHZvaWQgMCkgeyB0YWJTaXplID0gMTsgfVxuICAgIGlmICh0YWJTaXplID09PSAwKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgdmFyIHJlcyA9ICdcXHQnO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGFiU2l6ZTsgKytpKSB7XG4gICAgICAgIHJlcyArPSAnXFx0JztcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlV3JhcHBlZFN0cmluZyh2YWwpIHtcbiAgICByZXR1cm4gXCJcXFwiXCIgKyB2YWwgKyBcIlxcXCJcIjtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlV3JhcHBlZFN0cmluZ09yTnVtYmVyKHZhbCkge1xuICAgIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gU3RyaW5nKHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBnZW5lcmF0ZVdyYXBwZWRTdHJpbmcodmFsKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlQmxvY2tTdGFydChibG9ja05hbWUsIHN1YkluZm8sIHRhYlNpemUpIHtcbiAgICBpZiAoc3ViSW5mbyA9PT0gdm9pZCAwKSB7IHN1YkluZm8gPSBudWxsOyB9XG4gICAgaWYgKHRhYlNpemUgPT09IHZvaWQgMCkgeyB0YWJTaXplID0gMDsgfVxuICAgIHJldHVybiBnZW5lcmF0ZVRhYih0YWJTaXplKSArXG4gICAgICAgIGJsb2NrTmFtZSArICcgJyArXG4gICAgICAgIChzdWJJbmZvICE9PSBudWxsID8gZ2VuZXJhdGVXcmFwcGVkU3RyaW5nT3JOdW1iZXIoc3ViSW5mbykgKyAnICcgOiAnJykgK1xuICAgICAgICAne1xcbic7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUJsb2NrRW5kKHRhYlNpemUpIHtcbiAgICBpZiAodGFiU2l6ZSA9PT0gdm9pZCAwKSB7IHRhYlNpemUgPSAwOyB9XG4gICAgcmV0dXJuIGdlbmVyYXRlVGFiKHRhYlNpemUpICsgJ31cXG4nO1xufVxudmFyIHRyYWlsaW5nWmVyb1JlZ0V4cCA9IC8oXFwuLis/KTArJC87XG52YXIgdHJhaWxpbmdaZXJvUmVnRXhwMiA9IC9cXC4wKyQvO1xudmFyIG5lZ2F0aXZlWmVyb1JlZ0V4cCA9IC9eLTAkLztcbmZ1bmN0aW9uIGdlbmVyYXRlRmxvYXQodmFsKSB7XG4gICAgcmV0dXJuIHZhbC50b0ZpeGVkKEZMT0FUX1BSRVNJQ0lPTilcbiAgICAgICAgLnJlcGxhY2UodHJhaWxpbmdaZXJvUmVnRXhwLCAnJDEnKVxuICAgICAgICAucmVwbGFjZSh0cmFpbGluZ1plcm9SZWdFeHAyLCAnJylcbiAgICAgICAgLnJlcGxhY2UobmVnYXRpdmVaZXJvUmVnRXhwLCAnMCcpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVGbG9hdEFycmF5KGFyciwgcmV2ZXJzZSkge1xuICAgIGlmIChyZXZlcnNlID09PSB2b2lkIDApIHsgcmV2ZXJzZSA9IGZhbHNlOyB9XG4gICAgdmFyIG1pZGRsZSA9ICcnO1xuICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBhcnIubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGlmIChpIDwgYXJyLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICBtaWRkbGUgKz0gJywgJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1pZGRsZSArPSBnZW5lcmF0ZUZsb2F0KGFycltpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICBtaWRkbGUgKz0gJywgJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1pZGRsZSArPSBnZW5lcmF0ZUZsb2F0KGFycltpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICd7ICcgKyBtaWRkbGUgKyAnIH0nO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVVSW50QXJyYXkoYXJyKSB7XG4gICAgdmFyIG1pZGRsZSA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgbWlkZGxlICs9ICcsICc7XG4gICAgICAgIH1cbiAgICAgICAgbWlkZGxlICs9IFN0cmluZyhhcnJbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gJ3sgJyArIG1pZGRsZSArICcgfSc7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVN0YXRpYyhpc1N0YXRpYykge1xuICAgIHJldHVybiBpc1N0YXRpYyA/ICdzdGF0aWMgJyA6ICcnO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVQcm9wKG5hbWUsIHZhbCwgaXNTdGF0aWMsIHRhYlNpemUpIHtcbiAgICBpZiAodGFiU2l6ZSA9PT0gdm9pZCAwKSB7IHRhYlNpemUgPSAxOyB9XG4gICAgcmV0dXJuIGdlbmVyYXRlVGFiKHRhYlNpemUpICsgZ2VuZXJhdGVTdGF0aWMoaXNTdGF0aWMpICsgbmFtZSArIFwiIFwiICsgdmFsICsgXCIsXFxuXCI7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUludFByb3AobmFtZSwgdmFsLCBpc1N0YXRpYywgdGFiU2l6ZSkge1xuICAgIGlmIChpc1N0YXRpYyA9PT0gdm9pZCAwKSB7IGlzU3RhdGljID0gbnVsbDsgfVxuICAgIGlmICh0YWJTaXplID09PSB2b2lkIDApIHsgdGFiU2l6ZSA9IDE7IH1cbiAgICByZXR1cm4gZ2VuZXJhdGVQcm9wKG5hbWUsIFN0cmluZyh2YWwpLCBpc1N0YXRpYywgdGFiU2l6ZSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUZsb2F0UHJvcChuYW1lLCB2YWwsIGlzU3RhdGljLCB0YWJTaXplKSB7XG4gICAgaWYgKGlzU3RhdGljID09PSB2b2lkIDApIHsgaXNTdGF0aWMgPSBudWxsOyB9XG4gICAgaWYgKHRhYlNpemUgPT09IHZvaWQgMCkgeyB0YWJTaXplID0gMTsgfVxuICAgIHJldHVybiBnZW5lcmF0ZVByb3AobmFtZSwgZ2VuZXJhdGVGbG9hdCh2YWwpLCBpc1N0YXRpYywgdGFiU2l6ZSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVN0cmluZ1Byb3AobmFtZSwgdmFsLCBpc1N0YXRpYywgdGFiU2l6ZSkge1xuICAgIGlmIChpc1N0YXRpYyA9PT0gdm9pZCAwKSB7IGlzU3RhdGljID0gbnVsbDsgfVxuICAgIGlmICh0YWJTaXplID09PSB2b2lkIDApIHsgdGFiU2l6ZSA9IDE7IH1cbiAgICByZXR1cm4gZ2VuZXJhdGVQcm9wKG5hbWUsIHZhbCwgaXNTdGF0aWMsIHRhYlNpemUpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVXcmFwcGVkU3RyaW5nUHJvcChuYW1lLCB2YWwsIGlzU3RhdGljLCB0YWJTaXplKSB7XG4gICAgaWYgKGlzU3RhdGljID09PSB2b2lkIDApIHsgaXNTdGF0aWMgPSBudWxsOyB9XG4gICAgaWYgKHRhYlNpemUgPT09IHZvaWQgMCkgeyB0YWJTaXplID0gMTsgfVxuICAgIHJldHVybiBnZW5lcmF0ZVByb3AobmFtZSwgZ2VuZXJhdGVXcmFwcGVkU3RyaW5nKHZhbCksIGlzU3RhdGljLCB0YWJTaXplKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlRmxvYXRBcnJheVByb3AobmFtZSwgdmFsLCBpc1N0YXRpYywgdGFiU2l6ZSkge1xuICAgIGlmIChpc1N0YXRpYyA9PT0gdm9pZCAwKSB7IGlzU3RhdGljID0gbnVsbDsgfVxuICAgIGlmICh0YWJTaXplID09PSB2b2lkIDApIHsgdGFiU2l6ZSA9IDE7IH1cbiAgICByZXR1cm4gZ2VuZXJhdGVQcm9wKG5hbWUsIGdlbmVyYXRlRmxvYXRBcnJheSh2YWwpLCBpc1N0YXRpYywgdGFiU2l6ZSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVVJbnRBcnJheVByb3AobmFtZSwgdmFsLCBpc1N0YXRpYywgdGFiU2l6ZSkge1xuICAgIGlmIChpc1N0YXRpYyA9PT0gdm9pZCAwKSB7IGlzU3RhdGljID0gbnVsbDsgfVxuICAgIGlmICh0YWJTaXplID09PSB2b2lkIDApIHsgdGFiU2l6ZSA9IDE7IH1cbiAgICByZXR1cm4gZ2VuZXJhdGVQcm9wKG5hbWUsIGdlbmVyYXRlVUludEFycmF5KHZhbCksIGlzU3RhdGljLCB0YWJTaXplKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlQm9vbGVhblByb3AobmFtZSwgdGFiU2l6ZSkge1xuICAgIGlmICh0YWJTaXplID09PSB2b2lkIDApIHsgdGFiU2l6ZSA9IDE7IH1cbiAgICByZXR1cm4gZ2VuZXJhdGVUYWIodGFiU2l6ZSkgKyBuYW1lICsgJyxcXG4nO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVJbnRQcm9wSWZOb3RFbXB0eShuYW1lLCB2YWwsIGRlZmF1bHRWYWwsIGlzU3RhdGljLCB0YWJTaXplKSB7XG4gICAgaWYgKGRlZmF1bHRWYWwgPT09IHZvaWQgMCkgeyBkZWZhdWx0VmFsID0gMDsgfVxuICAgIGlmIChpc1N0YXRpYyA9PT0gdm9pZCAwKSB7IGlzU3RhdGljID0gbnVsbDsgfVxuICAgIGlmICh0YWJTaXplID09PSB2b2lkIDApIHsgdGFiU2l6ZSA9IDE7IH1cbiAgICBpZiAodmFsICE9PSBkZWZhdWx0VmFsICYmIHZhbCAhPT0gbnVsbCAmJiB2YWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZ2VuZXJhdGVJbnRQcm9wKG5hbWUsIHZhbCwgaXNTdGF0aWMsIHRhYlNpemUpO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUZsb2F0UHJvcElmTm90RW1wdHkobmFtZSwgdmFsLCBkZWZhdWx0VmFsLCBpc1N0YXRpYywgdGFiU2l6ZSkge1xuICAgIGlmIChkZWZhdWx0VmFsID09PSB2b2lkIDApIHsgZGVmYXVsdFZhbCA9IDA7IH1cbiAgICBpZiAoaXNTdGF0aWMgPT09IHZvaWQgMCkgeyBpc1N0YXRpYyA9IG51bGw7IH1cbiAgICBpZiAodGFiU2l6ZSA9PT0gdm9pZCAwKSB7IHRhYlNpemUgPSAxOyB9XG4gICAgaWYgKE1hdGguYWJzKHZhbCAtIGRlZmF1bHRWYWwpID4gRVBTSUxPTikge1xuICAgICAgICByZXR1cm4gZ2VuZXJhdGVGbG9hdFByb3AobmFtZSwgdmFsLCBpc1N0YXRpYywgdGFiU2l6ZSk7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlTGluZVR5cGUobGluZVR5cGUpIHtcbiAgICBzd2l0Y2ggKGxpbmVUeXBlKSB7XG4gICAgICAgIGNhc2UgbW9kZWxfMS5MaW5lVHlwZS5Eb250SW50ZXJwOlxuICAgICAgICAgICAgcmV0dXJuICdEb250SW50ZXJwJztcbiAgICAgICAgY2FzZSBtb2RlbF8xLkxpbmVUeXBlLkxpbmVhcjpcbiAgICAgICAgICAgIHJldHVybiAnTGluZWFyJztcbiAgICAgICAgY2FzZSBtb2RlbF8xLkxpbmVUeXBlLkJlemllcjpcbiAgICAgICAgICAgIHJldHVybiAnQmV6aWVyJztcbiAgICAgICAgY2FzZSBtb2RlbF8xLkxpbmVUeXBlLkhlcm1pdGU6XG4gICAgICAgICAgICByZXR1cm4gJ0hlcm1pdGUnO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUFuaW1LZXlGcmFtZShrZXksIHRhYlNpemUsIHJldmVyc2UpIHtcbiAgICBpZiAodGFiU2l6ZSA9PT0gdm9pZCAwKSB7IHRhYlNpemUgPSAyOyB9XG4gICAgaWYgKHJldmVyc2UgPT09IHZvaWQgMCkgeyByZXZlcnNlID0gZmFsc2U7IH1cbiAgICB2YXIgcmVzID0gZ2VuZXJhdGVUYWIodGFiU2l6ZSkgKyBrZXkuRnJhbWUgKyAnOiAnICtcbiAgICAgICAgKGtleS5WZWN0b3IubGVuZ3RoID09PSAxID8gZ2VuZXJhdGVGbG9hdChrZXkuVmVjdG9yWzBdKSA6IGdlbmVyYXRlRmxvYXRBcnJheShrZXkuVmVjdG9yLCByZXZlcnNlKSkgKyAnLFxcbic7XG4gICAgaWYgKGtleS5JblRhbiAvKiBvciBPdXRUYW4gKi8pIHtcbiAgICAgICAgcmVzICs9IGdlbmVyYXRlVGFiKHRhYlNpemUgKyAxKSArICdJblRhbiAnICtcbiAgICAgICAgICAgIChrZXkuSW5UYW4ubGVuZ3RoID09PSAxID8gZ2VuZXJhdGVGbG9hdChrZXkuSW5UYW5bMF0pIDogZ2VuZXJhdGVGbG9hdEFycmF5KGtleS5JblRhbiwgcmV2ZXJzZSkpICsgJyxcXG4nO1xuICAgICAgICByZXMgKz0gZ2VuZXJhdGVUYWIodGFiU2l6ZSArIDEpICsgJ091dFRhbiAnICtcbiAgICAgICAgICAgIChrZXkuT3V0VGFuLmxlbmd0aCA9PT0gMSA/IGdlbmVyYXRlRmxvYXQoa2V5Lk91dFRhblswXSkgOiBnZW5lcmF0ZUZsb2F0QXJyYXkoa2V5Lk91dFRhbiwgcmV2ZXJzZSkpICsgJyxcXG4nO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVBbmltVmVjdG9yUHJvcChuYW1lLCB2YWwsIGRlZmF1bHRWYWwsIHRhYlNpemUsIHJldmVyc2UpIHtcbiAgICBpZiAoZGVmYXVsdFZhbCA9PT0gdm9pZCAwKSB7IGRlZmF1bHRWYWwgPSAwOyB9XG4gICAgaWYgKHRhYlNpemUgPT09IHZvaWQgMCkgeyB0YWJTaXplID0gMTsgfVxuICAgIGlmIChyZXZlcnNlID09PSB2b2lkIDApIHsgcmV2ZXJzZSA9IGZhbHNlOyB9XG4gICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZiAodHlwZW9mIGRlZmF1bHRWYWwgPT09ICdudW1iZXInICYmIE1hdGguYWJzKHZhbCAtIGRlZmF1bHRWYWwpIDwgRVBTSUxPTikge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlRmxvYXRQcm9wKG5hbWUsIHZhbCwgdHJ1ZSwgdGFiU2l6ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQobmFtZSwgdmFsLktleXMubGVuZ3RoLCB0YWJTaXplKSArXG4gICAgICAgICAgICBnZW5lcmF0ZUJvb2xlYW5Qcm9wKGdlbmVyYXRlTGluZVR5cGUodmFsLkxpbmVUeXBlKSwgdGFiU2l6ZSArIDEpICtcbiAgICAgICAgICAgICh2YWwuR2xvYmFsU2VxSWQgIT09IG51bGwgPyBnZW5lcmF0ZUludFByb3AoJ0dsb2JhbFNlcUlkJywgdmFsLkdsb2JhbFNlcUlkLCBudWxsLCB0YWJTaXplICsgMSkgOiAnJykgK1xuICAgICAgICAgICAgdmFsLktleXMubWFwKGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIGdlbmVyYXRlQW5pbUtleUZyYW1lKGtleSwgdGFiU2l6ZSArIDEsIHJldmVyc2UpOyB9KS5qb2luKCcnKSArXG4gICAgICAgICAgICBnZW5lcmF0ZUJsb2NrRW5kKHRhYlNpemUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdlbmVyYXRlVmVyc2lvbihtb2RlbCkge1xuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ1ZlcnNpb24nKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcCgnRm9ybWF0VmVyc2lvbicsIG1vZGVsLlZlcnNpb24pICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVNb2RlbChtb2RlbCkge1xuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ01vZGVsJywgbW9kZWwuSW5mby5OYW1lKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcElmTm90RW1wdHkoJ051bUdlb3NldHMnLCBtb2RlbC5HZW9zZXRzLmxlbmd0aCkgK1xuICAgICAgICBnZW5lcmF0ZUludFByb3BJZk5vdEVtcHR5KCdOdW1HZW9zZXRBbmltcycsIG1vZGVsLkdlb3NldEFuaW1zLmxlbmd0aCkgK1xuICAgICAgICBnZW5lcmF0ZUludFByb3BJZk5vdEVtcHR5KCdOdW1IZWxwZXJzJywgbW9kZWwuSGVscGVycy5sZW5ndGgpICtcbiAgICAgICAgZ2VuZXJhdGVJbnRQcm9wSWZOb3RFbXB0eSgnTnVtQm9uZXMnLCBtb2RlbC5Cb25lcy5sZW5ndGgpICtcbiAgICAgICAgKG1vZGVsLkxpZ2h0cy5sZW5ndGggPyBnZW5lcmF0ZUludFByb3BJZk5vdEVtcHR5KCdOdW1MaWdodHMnLCBtb2RlbC5MaWdodHMubGVuZ3RoKSA6ICcnKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcElmTm90RW1wdHkoJ051bUF0dGFjaG1lbnRzJywgbW9kZWwuQXR0YWNobWVudHMubGVuZ3RoKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcElmTm90RW1wdHkoJ051bUV2ZW50cycsIG1vZGVsLkV2ZW50T2JqZWN0cy5sZW5ndGgpICtcbiAgICAgICAgZ2VuZXJhdGVJbnRQcm9wSWZOb3RFbXB0eSgnTnVtUGFydGljbGVFbWl0dGVycycsIG1vZGVsLlBhcnRpY2xlRW1pdHRlcnMubGVuZ3RoKSArXG4gICAgICAgIChtb2RlbC5QYXJ0aWNsZUVtaXR0ZXJzMi5sZW5ndGggP1xuICAgICAgICAgICAgZ2VuZXJhdGVJbnRQcm9wSWZOb3RFbXB0eSgnTnVtUGFydGljbGVFbWl0dGVyczInLCBtb2RlbC5QYXJ0aWNsZUVtaXR0ZXJzMi5sZW5ndGgpIDpcbiAgICAgICAgICAgICcnKSArXG4gICAgICAgIChtb2RlbC5SaWJib25FbWl0dGVycy5sZW5ndGggP1xuICAgICAgICAgICAgZ2VuZXJhdGVJbnRQcm9wSWZOb3RFbXB0eSgnTnVtUmliYm9uRW1pdHRlcnMnLCBtb2RlbC5SaWJib25FbWl0dGVycy5sZW5ndGgpIDpcbiAgICAgICAgICAgICcnKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcCgnQmxlbmRUaW1lJywgbW9kZWwuSW5mby5CbGVuZFRpbWUpICtcbiAgICAgICAgZ2VuZXJhdGVGbG9hdEFycmF5UHJvcCgnTWluaW11bUV4dGVudCcsIG1vZGVsLkluZm8uTWluaW11bUV4dGVudCkgK1xuICAgICAgICBnZW5lcmF0ZUZsb2F0QXJyYXlQcm9wKCdNYXhpbXVtRXh0ZW50JywgbW9kZWwuSW5mby5NYXhpbXVtRXh0ZW50KSArXG4gICAgICAgIGdlbmVyYXRlRmxvYXRQcm9wSWZOb3RFbXB0eSgnQm91bmRzUmFkaXVzJywgbW9kZWwuSW5mby5Cb3VuZHNSYWRpdXMpICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVTZXF1ZW5jZXMobW9kZWwpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVCbG9ja1N0YXJ0KCdTZXF1ZW5jZXMnLCBtb2RlbC5TZXF1ZW5jZXMubGVuZ3RoKSArXG4gICAgICAgIG1vZGVsLlNlcXVlbmNlcy5tYXAoZ2VuZXJhdGVTZXF1ZW5jZUNodW5rKS5qb2luKCcnKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlU2VxdWVuY2VDaHVuayhzZXF1ZW5jZSkge1xuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ0FuaW0nLCBzZXF1ZW5jZS5OYW1lLCAxKSArXG4gICAgICAgIGdlbmVyYXRlVUludEFycmF5UHJvcCgnSW50ZXJ2YWwnLCBzZXF1ZW5jZS5JbnRlcnZhbCwgbnVsbCwgMikgK1xuICAgICAgICBnZW5lcmF0ZUZsb2F0UHJvcElmTm90RW1wdHkoJ1Jhcml0eScsIHNlcXVlbmNlLlJhcml0eSwgMCwgbnVsbCwgMikgK1xuICAgICAgICBnZW5lcmF0ZUZsb2F0UHJvcElmTm90RW1wdHkoJ01vdmVTcGVlZCcsIHNlcXVlbmNlLk1vdmVTcGVlZCwgMCwgbnVsbCwgMikgK1xuICAgICAgICAoc2VxdWVuY2UuTm9uTG9vcGluZyA/IGdlbmVyYXRlQm9vbGVhblByb3AoJ05vbkxvb3BpbmcnLCAyKSA6ICcnKSArXG4gICAgICAgIGdlbmVyYXRlRmxvYXRBcnJheVByb3AoJ01pbmltdW1FeHRlbnQnLCBzZXF1ZW5jZS5NaW5pbXVtRXh0ZW50LCBudWxsLCAyKSArXG4gICAgICAgIGdlbmVyYXRlRmxvYXRBcnJheVByb3AoJ01heGltdW1FeHRlbnQnLCBzZXF1ZW5jZS5NYXhpbXVtRXh0ZW50LCBudWxsLCAyKSArXG4gICAgICAgIGdlbmVyYXRlRmxvYXRQcm9wSWZOb3RFbXB0eSgnQm91bmRzUmFkaXVzJywgc2VxdWVuY2UuQm91bmRzUmFkaXVzLCAwLCBudWxsLCAyKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoMSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUdsb2JhbFNlcXVlbmNlcyhtb2RlbCkge1xuICAgIGlmICghbW9kZWwuR2xvYmFsU2VxdWVuY2VzIHx8ICFtb2RlbC5HbG9iYWxTZXF1ZW5jZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgcmV0dXJuIGdlbmVyYXRlQmxvY2tTdGFydCgnR2xvYmFsU2VxdWVuY2VzJywgbW9kZWwuR2xvYmFsU2VxdWVuY2VzLmxlbmd0aCkgK1xuICAgICAgICBtb2RlbC5HbG9iYWxTZXF1ZW5jZXMubWFwKGZ1bmN0aW9uIChkdXJhdGlvbikgeyByZXR1cm4gZ2VuZXJhdGVJbnRQcm9wKCdEdXJhdGlvbicsIGR1cmF0aW9uKTsgfSkuam9pbignJykgK1xuICAgICAgICBnZW5lcmF0ZUJsb2NrRW5kKCk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVRleHR1cmVzKG1vZGVsKSB7XG4gICAgaWYgKCFtb2RlbC5UZXh0dXJlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICByZXR1cm4gZ2VuZXJhdGVCbG9ja1N0YXJ0KCdUZXh0dXJlcycsIG1vZGVsLlRleHR1cmVzLmxlbmd0aCkgK1xuICAgICAgICBtb2RlbC5UZXh0dXJlcy5tYXAoZ2VuZXJhdGVUZXh0dXJlQ2h1bmspLmpvaW4oJycpICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVUZXh0dXJlQ2h1bmsodGV4dHVyZSkge1xuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ0JpdG1hcCcsIG51bGwsIDEpICtcbiAgICAgICAgZ2VuZXJhdGVXcmFwcGVkU3RyaW5nUHJvcCgnSW1hZ2UnLCB0ZXh0dXJlLkltYWdlLCBudWxsLCAyKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcElmTm90RW1wdHkoJ1JlcGxhY2VhYmxlSWQnLCB0ZXh0dXJlLlJlcGxhY2VhYmxlSWQsIDAsIG51bGwsIDIpICtcbiAgICAgICAgKHRleHR1cmUuRmxhZ3MgJiBtb2RlbF8xLlRleHR1cmVGbGFncy5XcmFwV2lkdGggPyBnZW5lcmF0ZUJvb2xlYW5Qcm9wKCdXcmFwV2lkdGgnLCAyKSA6ICcnKSArXG4gICAgICAgICh0ZXh0dXJlLkZsYWdzICYgbW9kZWxfMS5UZXh0dXJlRmxhZ3MuV3JhcEhlaWdodCA/IGdlbmVyYXRlQm9vbGVhblByb3AoJ1dyYXBIZWlnaHQnLCAyKSA6ICcnKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoMSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZU1hdGVyaWFscyhtb2RlbCkge1xuICAgIGlmICghbW9kZWwuTWF0ZXJpYWxzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ01hdGVyaWFscycsIG1vZGVsLk1hdGVyaWFscy5sZW5ndGgpICtcbiAgICAgICAgbW9kZWwuTWF0ZXJpYWxzLm1hcChnZW5lcmF0ZU1hdGVyaWFsQ2h1bmspLmpvaW4oJycpICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVNYXRlcmlhbENodW5rKG1hdGVyaWFsKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlQmxvY2tTdGFydCgnTWF0ZXJpYWwnLCBudWxsLCAxKSArXG4gICAgICAgIChtYXRlcmlhbC5SZW5kZXJNb2RlICYgbW9kZWxfMS5NYXRlcmlhbFJlbmRlck1vZGUuQ29uc3RhbnRDb2xvciA/IGdlbmVyYXRlQm9vbGVhblByb3AoJ0NvbnN0YW50Q29sb3InLCAyKSA6ICcnKSArXG4gICAgICAgIChtYXRlcmlhbC5SZW5kZXJNb2RlICYgbW9kZWxfMS5NYXRlcmlhbFJlbmRlck1vZGUuU29ydFByaW1zRmFyWiA/IGdlbmVyYXRlQm9vbGVhblByb3AoJ1NvcnRQcmltc0ZhclonLCAyKSA6ICcnKSArXG4gICAgICAgIChtYXRlcmlhbC5SZW5kZXJNb2RlICYgbW9kZWxfMS5NYXRlcmlhbFJlbmRlck1vZGUuRnVsbFJlc29sdXRpb24gPyBnZW5lcmF0ZUJvb2xlYW5Qcm9wKCdGdWxsUmVzb2x1dGlvbicsIDIpIDogJycpICtcbiAgICAgICAgZ2VuZXJhdGVJbnRQcm9wSWZOb3RFbXB0eSgnUHJpb3JpdHlQbGFuZScsIG1hdGVyaWFsLlByaW9yaXR5UGxhbmUsIDAsIG51bGwsIDIpICtcbiAgICAgICAgbWF0ZXJpYWwuTGF5ZXJzLm1hcChnZW5lcmF0ZUxheWVyQ2h1bmspLmpvaW4oJycpICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgxKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlRmlsdGVyTW9kZShmaWx0ZXJNb2RlKSB7XG4gICAgc3dpdGNoIChmaWx0ZXJNb2RlKSB7XG4gICAgICAgIGNhc2UgbW9kZWxfMS5GaWx0ZXJNb2RlLk5vbmU6XG4gICAgICAgICAgICByZXR1cm4gJ05vbmUnO1xuICAgICAgICBjYXNlIG1vZGVsXzEuRmlsdGVyTW9kZS5UcmFuc3BhcmVudDpcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNwYXJlbnQnO1xuICAgICAgICBjYXNlIG1vZGVsXzEuRmlsdGVyTW9kZS5CbGVuZDpcbiAgICAgICAgICAgIHJldHVybiAnQmxlbmQnO1xuICAgICAgICBjYXNlIG1vZGVsXzEuRmlsdGVyTW9kZS5BZGRpdGl2ZTpcbiAgICAgICAgICAgIHJldHVybiAnQWRkaXRpdmUnO1xuICAgICAgICBjYXNlIG1vZGVsXzEuRmlsdGVyTW9kZS5BZGRBbHBoYTpcbiAgICAgICAgICAgIHJldHVybiAnQWRkQWxwaGEnO1xuICAgICAgICBjYXNlIG1vZGVsXzEuRmlsdGVyTW9kZS5Nb2R1bGF0ZTpcbiAgICAgICAgICAgIHJldHVybiAnTW9kdWxhdGUnO1xuICAgICAgICBjYXNlIG1vZGVsXzEuRmlsdGVyTW9kZS5Nb2R1bGF0ZTJ4OlxuICAgICAgICAgICAgcmV0dXJuICdNb2R1bGF0ZTJ4JztcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVMYXllckNodW5rKGxheWVyKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlQmxvY2tTdGFydCgnTGF5ZXInLCBudWxsLCAyKSArXG4gICAgICAgIGdlbmVyYXRlU3RyaW5nUHJvcCgnRmlsdGVyTW9kZScsIGdlbmVyYXRlRmlsdGVyTW9kZShsYXllci5GaWx0ZXJNb2RlKSwgbnVsbCwgMykgK1xuICAgICAgICAobGF5ZXIuQWxwaGEgIT09IHVuZGVmaW5lZCA/IGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ0FscGhhJywgbGF5ZXIuQWxwaGEsIDEsIDMpIDogJycpICtcbiAgICAgICAgKGxheWVyLlRleHR1cmVJRCAhPT0gdW5kZWZpbmVkID8gZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnVGV4dHVyZUlEJywgbGF5ZXIuVGV4dHVyZUlELCBudWxsLCAzKSA6ICcnKSArXG4gICAgICAgIChsYXllci5TaGFkaW5nICYgbW9kZWxfMS5MYXllclNoYWRpbmcuVHdvU2lkZWQgPyBnZW5lcmF0ZUJvb2xlYW5Qcm9wKCdUd29TaWRlZCcsIDMpIDogJycpICtcbiAgICAgICAgKGxheWVyLlNoYWRpbmcgJiBtb2RlbF8xLkxheWVyU2hhZGluZy5VbnNoYWRlZCA/IGdlbmVyYXRlQm9vbGVhblByb3AoJ1Vuc2hhZGVkJywgMykgOiAnJykgK1xuICAgICAgICAobGF5ZXIuU2hhZGluZyAmIG1vZGVsXzEuTGF5ZXJTaGFkaW5nLlVuZm9nZ2VkID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnVW5mb2dnZWQnLCAzKSA6ICcnKSArXG4gICAgICAgIChsYXllci5TaGFkaW5nICYgbW9kZWxfMS5MYXllclNoYWRpbmcuU3BoZXJlRW52TWFwID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnU3BoZXJlRW52TWFwJywgMykgOiAnJykgK1xuICAgICAgICAobGF5ZXIuU2hhZGluZyAmIG1vZGVsXzEuTGF5ZXJTaGFkaW5nLk5vRGVwdGhUZXN0ID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnTm9EZXB0aFRlc3QnLCAzKSA6ICcnKSArXG4gICAgICAgIChsYXllci5TaGFkaW5nICYgbW9kZWxfMS5MYXllclNoYWRpbmcuTm9EZXB0aFNldCA/IGdlbmVyYXRlQm9vbGVhblByb3AoJ05vRGVwdGhTZXQnLCAzKSA6ICcnKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcElmTm90RW1wdHkoJ0Nvb3JkSWQnLCBsYXllci5Db29yZElkLCAwLCBudWxsLCAzKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcElmTm90RW1wdHkoJ1RWZXJ0ZXhBbmltSWQnLCBsYXllci5UVmVydGV4QW5pbUlkLCBudWxsLCBudWxsLCAzKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoMik7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVRleHR1cmVBbmltcyhtb2RlbCkge1xuICAgIGlmICghbW9kZWwuVGV4dHVyZUFuaW1zLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ1RleHR1cmVBbmltcycsIG1vZGVsLlRleHR1cmVBbmltcy5sZW5ndGgpICtcbiAgICAgICAgbW9kZWwuVGV4dHVyZUFuaW1zLm1hcChnZW5lcmF0ZVRleHR1cmVBbmltQ2h1bmspLmpvaW4oJycpICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVUZXh0dXJlQW5pbUNodW5rKHRleHR1cmVBbmltKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlQmxvY2tTdGFydCgnVFZlcnRleEFuaW0nLCBudWxsLCAxKSArXG4gICAgICAgICh0ZXh0dXJlQW5pbS5UcmFuc2xhdGlvbiA/IGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ1RyYW5zbGF0aW9uJywgdGV4dHVyZUFuaW0uVHJhbnNsYXRpb24sIG51bGwsIDIpIDogJycpICtcbiAgICAgICAgKHRleHR1cmVBbmltLlJvdGF0aW9uID8gZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnUm90YXRpb24nLCB0ZXh0dXJlQW5pbS5Sb3RhdGlvbiwgbnVsbCwgMikgOiAnJykgK1xuICAgICAgICAodGV4dHVyZUFuaW0uU2NhbGluZyA/IGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ1NjYWxpbmcnLCB0ZXh0dXJlQW5pbS5TY2FsaW5nLCBudWxsLCAyKSA6ICcnKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoMSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUdlb3NldHMobW9kZWwpIHtcbiAgICBpZiAoIW1vZGVsLkdlb3NldHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgcmV0dXJuIG1vZGVsLkdlb3NldHMubWFwKGdlbmVyYXRlR2Vvc2V0Q2h1bmspLmpvaW4oJycpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVHZW9zZXRDaHVuayhnZW9zZXQpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVCbG9ja1N0YXJ0KCdHZW9zZXQnKSArXG4gICAgICAgIGdlbmVyYXRlR2Vvc2V0QXJyYXkoJ1ZlcnRpY2VzJywgZ2Vvc2V0LlZlcnRpY2VzLCAzKSArXG4gICAgICAgIGdlbmVyYXRlR2Vvc2V0QXJyYXkoJ05vcm1hbHMnLCBnZW9zZXQuTm9ybWFscywgMykgK1xuICAgICAgICBnZW5lcmF0ZUdlb3NldEFycmF5KCdUVmVydGljZXMnLCBnZW9zZXQuVFZlcnRpY2VzWzBdLCAyKSArXG4gICAgICAgIGdlbmVyYXRlR2Vvc2V0VmVydGV4R3JvdXAoZ2Vvc2V0LlZlcnRleEdyb3VwKSArXG4gICAgICAgIGdlbmVyYXRlR2Vvc2V0RmFjZXMoZ2Vvc2V0LkZhY2VzKSArXG4gICAgICAgIGdlbmVyYXRlR2Vvc2V0R3JvdXBzKGdlb3NldC5Hcm91cHMpICtcbiAgICAgICAgZ2VuZXJhdGVGbG9hdEFycmF5UHJvcCgnTWluaW11bUV4dGVudCcsIGdlb3NldC5NaW5pbXVtRXh0ZW50KSArXG4gICAgICAgIGdlbmVyYXRlRmxvYXRBcnJheVByb3AoJ01heGltdW1FeHRlbnQnLCBnZW9zZXQuTWF4aW11bUV4dGVudCkgK1xuICAgICAgICBnZW5lcmF0ZUZsb2F0UHJvcElmTm90RW1wdHkoJ0JvdW5kc1JhZGl1cycsIGdlb3NldC5Cb3VuZHNSYWRpdXMpICtcbiAgICAgICAgZ2VuZXJhdGVHZW9zZXRBbmltSW5mb3MoZ2Vvc2V0LkFuaW1zKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcCgnTWF0ZXJpYWxJRCcsIGdlb3NldC5NYXRlcmlhbElEKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcCgnU2VsZWN0aW9uR3JvdXAnLCBnZW9zZXQuU2VsZWN0aW9uR3JvdXApICtcbiAgICAgICAgKGdlb3NldC5VbnNlbGVjdGFibGUgPyBnZW5lcmF0ZUJvb2xlYW5Qcm9wKCdVbnNlbGVjdGFibGUnKSA6ICcnKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlR2Vvc2V0QXJyYXkobmFtZSwgYXJyLCBlbGVtTGVuZ3RoKSB7XG4gICAgdmFyIG1pZGRsZSA9ICcnO1xuICAgIHZhciBlbGVtQ291bnQgPSBhcnIubGVuZ3RoIC8gZWxlbUxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1Db3VudDsgKytpKSB7XG4gICAgICAgIG1pZGRsZSArPSBnZW5lcmF0ZVRhYigyKSArIGdlbmVyYXRlRmxvYXRBcnJheShhcnIuc2xpY2UoaSAqIGVsZW1MZW5ndGgsIChpICsgMSkgKiBlbGVtTGVuZ3RoKSkgKyAnLFxcbic7XG4gICAgfVxuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQobmFtZSwgZWxlbUNvdW50LCAxKSArXG4gICAgICAgIG1pZGRsZSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoMSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUdlb3NldFZlcnRleEdyb3VwKGFycikge1xuICAgIHZhciBtaWRkbGUgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkge1xuICAgICAgICBtaWRkbGUgKz0gZ2VuZXJhdGVUYWIoMikgKyBhcnJbaV0gKyAnLFxcbic7XG4gICAgfVxuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ1ZlcnRleEdyb3VwJywgbnVsbCwgMSkgK1xuICAgICAgICBtaWRkbGUgK1xuICAgICAgICBnZW5lcmF0ZUJsb2NrRW5kKDEpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVHZW9zZXRGYWNlcyhhcnIpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVCbG9ja1N0YXJ0KFwiRmFjZXMgMSBcIiArIGFyci5sZW5ndGgsIG51bGwsIDEpICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja1N0YXJ0KCdUcmlhbmdsZXMnLCBudWxsLCAyKSArXG4gICAgICAgIGdlbmVyYXRlVGFiKDMpICsgZ2VuZXJhdGVVSW50QXJyYXkoYXJyKSArICcsXFxuJyArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoMikgK1xuICAgICAgICBnZW5lcmF0ZUJsb2NrRW5kKDEpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVHZW9zZXRHcm91cHMoZ3JvdXBzKSB7XG4gICAgdmFyIHRvdGFsTWF0cmljZXMgPSAwO1xuICAgIHZhciBtaWRkbGUgPSAnJztcbiAgICBmb3IgKHZhciBfaSA9IDAsIGdyb3Vwc18xID0gZ3JvdXBzOyBfaSA8IGdyb3Vwc18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgZ3JvdXAgPSBncm91cHNfMVtfaV07XG4gICAgICAgIHRvdGFsTWF0cmljZXMgKz0gZ3JvdXAubGVuZ3RoO1xuICAgICAgICBtaWRkbGUgKz0gZ2VuZXJhdGVUYWIoMikgKyAnTWF0cmljZXMgJyArIGdlbmVyYXRlVUludEFycmF5KGdyb3VwKSArICcsXFxuJztcbiAgICB9XG4gICAgcmV0dXJuIGdlbmVyYXRlQmxvY2tTdGFydChcIkdyb3VwcyBcIiArIGdyb3Vwcy5sZW5ndGggKyBcIiBcIiArIHRvdGFsTWF0cmljZXMsIG51bGwsIDEpICtcbiAgICAgICAgbWlkZGxlICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgxKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlR2Vvc2V0QW5pbUluZm9zKGFuaW1zKSB7XG4gICAgaWYgKCFhbmltcykge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHJldHVybiBhbmltcy5tYXAoZ2VuZXJhdGVHZW9zZXRBbmltSW5mb0NodW5rKS5qb2luKCcnKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlR2Vvc2V0QW5pbUluZm9DaHVuayhhbmltKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlQmxvY2tTdGFydCgnQW5pbScsIG51bGwsIDEpICtcbiAgICAgICAgZ2VuZXJhdGVGbG9hdEFycmF5UHJvcCgnTWluaW11bUV4dGVudCcsIGFuaW0uTWluaW11bUV4dGVudCwgbnVsbCwgMikgK1xuICAgICAgICBnZW5lcmF0ZUZsb2F0QXJyYXlQcm9wKCdNYXhpbXVtRXh0ZW50JywgYW5pbS5NYXhpbXVtRXh0ZW50LCBudWxsLCAyKSArXG4gICAgICAgIGdlbmVyYXRlRmxvYXRQcm9wSWZOb3RFbXB0eSgnQm91bmRzUmFkaXVzJywgYW5pbS5Cb3VuZHNSYWRpdXMsIDAsIG51bGwsIDIpICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgxKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlR2Vvc2V0QW5pbXMobW9kZWwpIHtcbiAgICBpZiAoIW1vZGVsLkdlb3NldEFuaW1zLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHJldHVybiBtb2RlbC5HZW9zZXRBbmltcy5tYXAoZ2VuZXJhdGVHZW9zZXRBbmltQ2h1bmspLmpvaW4oJycpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVDb2xvclByb3AobmFtZSwgY29sb3IsIGlzU3RhdGljLCB0YWJTaXplKSB7XG4gICAgaWYgKHRhYlNpemUgPT09IHZvaWQgMCkgeyB0YWJTaXplID0gMTsgfVxuICAgIGlmIChjb2xvcikge1xuICAgICAgICBpZiAoY29sb3IgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgICAgIGlmICghaXNTdGF0aWMgfHwgaXNOb3RFbXB0eVZlYzMoY29sb3IsIDEpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZGRsZSA9ICcnO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAyOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA8IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pZGRsZSArPSAnLCAnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1pZGRsZSArPSBnZW5lcmF0ZUZsb2F0KGNvbG9yW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiXCIgKyBnZW5lcmF0ZVRhYih0YWJTaXplKSArIChpc1N0YXRpYyA/ICdzdGF0aWMgJyA6ICcnKSArIG5hbWUgKyBcIiB7IFwiICsgbWlkZGxlICsgXCIgfSxcXG5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKG5hbWUsIGNvbG9yLCBudWxsLCB0YWJTaXplLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUdlb3NldEFuaW1DaHVuayhnZW9zZXRBbmltKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlQmxvY2tTdGFydCgnR2Vvc2V0QW5pbScpICtcbiAgICAgICAgZ2VuZXJhdGVJbnRQcm9wKCdHZW9zZXRJZCcsIGdlb3NldEFuaW0uR2Vvc2V0SWQpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnQWxwaGEnLCBnZW9zZXRBbmltLkFscGhhLCAxKSArXG4gICAgICAgIGdlbmVyYXRlQ29sb3JQcm9wKCdDb2xvcicsIGdlb3NldEFuaW0uQ29sb3IsIHRydWUpICtcbiAgICAgICAgKGdlb3NldEFuaW0uRmxhZ3MgJiBtb2RlbF8xLkdlb3NldEFuaW1GbGFncy5Ecm9wU2hhZG93ID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnRHJvcFNoYWRvdycpIDogJycpICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVOb2RlUHJvcHMobm9kZSkge1xuICAgIHJldHVybiBnZW5lcmF0ZUludFByb3AoJ09iamVjdElkJywgbm9kZS5PYmplY3RJZCkgK1xuICAgICAgICBnZW5lcmF0ZUludFByb3BJZk5vdEVtcHR5KCdQYXJlbnQnLCBub2RlLlBhcmVudCwgbnVsbCkgK1xuICAgICAgICBnZW5lcmF0ZU5vZGVEb250SW5oZXJpdChub2RlLkZsYWdzKSArXG4gICAgICAgIChub2RlLkZsYWdzICYgbW9kZWxfMS5Ob2RlRmxhZ3MuQmlsbGJvYXJkZWQgPyBnZW5lcmF0ZUJvb2xlYW5Qcm9wKCdCaWxsYm9hcmRlZCcpIDogJycpICtcbiAgICAgICAgKG5vZGUuRmxhZ3MgJiBtb2RlbF8xLk5vZGVGbGFncy5CaWxsYm9hcmRlZExvY2tYID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnQmlsbGJvYXJkZWRMb2NrWCcpIDogJycpICtcbiAgICAgICAgKG5vZGUuRmxhZ3MgJiBtb2RlbF8xLk5vZGVGbGFncy5CaWxsYm9hcmRlZExvY2tZID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnQmlsbGJvYXJkZWRMb2NrWScpIDogJycpICtcbiAgICAgICAgKG5vZGUuRmxhZ3MgJiBtb2RlbF8xLk5vZGVGbGFncy5CaWxsYm9hcmRlZExvY2taID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnQmlsbGJvYXJkZWRMb2NrWicpIDogJycpICtcbiAgICAgICAgKG5vZGUuRmxhZ3MgJiBtb2RlbF8xLk5vZGVGbGFncy5DYW1lcmFBbmNob3JlZCA/IGdlbmVyYXRlQm9vbGVhblByb3AoJ0NhbWVyYUFuY2hvcmVkJykgOiAnJykgK1xuICAgICAgICAobm9kZS5UcmFuc2xhdGlvbiAhPT0gdW5kZWZpbmVkID8gZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnVHJhbnNsYXRpb24nLCBub2RlLlRyYW5zbGF0aW9uKSA6ICcnKSArXG4gICAgICAgIChub2RlLlJvdGF0aW9uICE9PSB1bmRlZmluZWQgPyBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKCdSb3RhdGlvbicsIG5vZGUuUm90YXRpb24pIDogJycpICtcbiAgICAgICAgKG5vZGUuU2NhbGluZyAhPT0gdW5kZWZpbmVkID8gZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnU2NhbGluZycsIG5vZGUuU2NhbGluZykgOiAnJyk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZU5vZGVEb250SW5oZXJpdChmbGFncykge1xuICAgIHZhciBmbGFnc1N0cnMgPSBbXTtcbiAgICBpZiAoZmxhZ3MgJiBtb2RlbF8xLk5vZGVGbGFncy5Eb250SW5oZXJpdFRyYW5zbGF0aW9uKSB7XG4gICAgICAgIGZsYWdzU3Rycy5wdXNoKCdUcmFuc2xhdGlvbicpO1xuICAgIH1cbiAgICBpZiAoZmxhZ3MgJiBtb2RlbF8xLk5vZGVGbGFncy5Eb250SW5oZXJpdFJvdGF0aW9uKSB7XG4gICAgICAgIGZsYWdzU3Rycy5wdXNoKCdSb3RhdGlvbicpO1xuICAgIH1cbiAgICBpZiAoZmxhZ3MgJiBtb2RlbF8xLk5vZGVGbGFncy5Eb250SW5oZXJpdFNjYWxpbmcpIHtcbiAgICAgICAgZmxhZ3NTdHJzLnB1c2goJ1NjYWxpbmcnKTtcbiAgICB9XG4gICAgaWYgKCFmbGFnc1N0cnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgcmV0dXJuIGdlbmVyYXRlVGFiKDEpICsgJ0RvbnRJbmhlcml0IHsgJyArIGZsYWdzU3Rycy5qb2luKCcsICcpICsgJyB9LFxcbic7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUJvbmVzKG1vZGVsKSB7XG4gICAgaWYgKCFtb2RlbC5Cb25lcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICByZXR1cm4gbW9kZWwuQm9uZXMubWFwKGdlbmVyYXRlQm9uZUNodW5rKS5qb2luKCcnKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlQm9uZUNodW5rKGJvbmUpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVCbG9ja1N0YXJ0KCdCb25lJywgYm9uZS5OYW1lKSArXG4gICAgICAgIGdlbmVyYXRlTm9kZVByb3BzKGJvbmUpICtcbiAgICAgICAgKGJvbmUuR2Vvc2V0SWQgIT09IG51bGwgP1xuICAgICAgICAgICAgZ2VuZXJhdGVJbnRQcm9wKCdHZW9zZXRJZCcsIGJvbmUuR2Vvc2V0SWQpIDpcbiAgICAgICAgICAgIGdlbmVyYXRlU3RyaW5nUHJvcCgnR2Vvc2V0SWQnLCAnTXVsdGlwbGUnKSkgK1xuICAgICAgICAoYm9uZS5HZW9zZXRBbmltSWQgIT09IG51bGwgP1xuICAgICAgICAgICAgZ2VuZXJhdGVJbnRQcm9wKCdHZW9zZXRBbmltSWQnLCBib25lLkdlb3NldEFuaW1JZCkgOlxuICAgICAgICAgICAgZ2VuZXJhdGVTdHJpbmdQcm9wKCdHZW9zZXRBbmltSWQnLCAnTm9uZScpKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlTGlnaHRzKG1vZGVsKSB7XG4gICAgaWYgKCFtb2RlbC5MaWdodHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgcmV0dXJuIG1vZGVsLkxpZ2h0cy5tYXAoZ2VuZXJhdGVMaWdodENodW5rKS5qb2luKCcnKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlTGlnaHRDaHVuayhsaWdodCkge1xuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ0xpZ2h0JywgbGlnaHQuTmFtZSkgK1xuICAgICAgICBnZW5lcmF0ZU5vZGVQcm9wcyhsaWdodCkgK1xuICAgICAgICBnZW5lcmF0ZUJvb2xlYW5Qcm9wKGdlbmVyYXRlTGlnaHRUeXBlKGxpZ2h0LkxpZ2h0VHlwZSkpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnQXR0ZW51YXRpb25TdGFydCcsIGxpZ2h0LkF0dGVudWF0aW9uU3RhcnQpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnQXR0ZW51YXRpb25FbmQnLCBsaWdodC5BdHRlbnVhdGlvbkVuZCkgK1xuICAgICAgICBnZW5lcmF0ZUNvbG9yUHJvcCgnQ29sb3InLCBsaWdodC5Db2xvciwgdHJ1ZSkgK1xuICAgICAgICBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKCdJbnRlbnNpdHknLCBsaWdodC5JbnRlbnNpdHksIG51bGwpICtcbiAgICAgICAgZ2VuZXJhdGVDb2xvclByb3AoJ0FtYkNvbG9yJywgbGlnaHQuQW1iQ29sb3IsIHRydWUpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnQW1iSW50ZW5zaXR5JywgbGlnaHQuQW1iSW50ZW5zaXR5LCBudWxsKSArXG4gICAgICAgIGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ1Zpc2liaWxpdHknLCBsaWdodC5WaXNpYmlsaXR5LCAxKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlTGlnaHRUeXBlKGxpZ2h0VHlwZSkge1xuICAgIHN3aXRjaCAobGlnaHRUeXBlKSB7XG4gICAgICAgIGNhc2UgbW9kZWxfMS5MaWdodFR5cGUuT21uaWRpcmVjdGlvbmFsOlxuICAgICAgICAgICAgcmV0dXJuICdPbW5pZGlyZWN0aW9uYWwnO1xuICAgICAgICBjYXNlIG1vZGVsXzEuTGlnaHRUeXBlLkRpcmVjdGlvbmFsOlxuICAgICAgICAgICAgcmV0dXJuICdEaXJlY3Rpb25hbCc7XG4gICAgICAgIGNhc2UgbW9kZWxfMS5MaWdodFR5cGUuQW1iaWVudDpcbiAgICAgICAgICAgIHJldHVybiAnQW1iaWVudCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlSGVscGVycyhtb2RlbCkge1xuICAgIHJldHVybiBtb2RlbC5IZWxwZXJzLm1hcChnZW5lcmF0ZUhlbHBlckNodW5rKS5qb2luKCcnKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlSGVscGVyQ2h1bmsoaGVscGVyKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlQmxvY2tTdGFydCgnSGVscGVyJywgaGVscGVyLk5hbWUpICtcbiAgICAgICAgZ2VuZXJhdGVOb2RlUHJvcHMoaGVscGVyKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlQXR0YWNobWVudHMobW9kZWwpIHtcbiAgICByZXR1cm4gbW9kZWwuQXR0YWNobWVudHMubWFwKGdlbmVyYXRlQXR0YWNobWVudENodW5rKS5qb2luKCcnKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlQXR0YWNobWVudENodW5rKGF0dGFjaG1lbnQpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVCbG9ja1N0YXJ0KCdBdHRhY2htZW50JywgYXR0YWNobWVudC5OYW1lKSArXG4gICAgICAgIGdlbmVyYXRlTm9kZVByb3BzKGF0dGFjaG1lbnQpICtcbiAgICAgICAgZ2VuZXJhdGVJbnRQcm9wKCdBdHRhY2htZW50SUQnLCBhdHRhY2htZW50LkF0dGFjaG1lbnRJRCkgK1xuICAgICAgICAoYXR0YWNobWVudC5QYXRoID8gZ2VuZXJhdGVXcmFwcGVkU3RyaW5nUHJvcCgnUGF0aCcsIGF0dGFjaG1lbnQuUGF0aCkgOiAnJykgK1xuICAgICAgICBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKCdWaXNpYmlsaXR5JywgYXR0YWNobWVudC5WaXNpYmlsaXR5LCAxKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlUGl2b3RQb2ludHMobW9kZWwpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVCbG9ja1N0YXJ0KCdQaXZvdFBvaW50cycsIG1vZGVsLlBpdm90UG9pbnRzLmxlbmd0aCkgK1xuICAgICAgICBtb2RlbC5QaXZvdFBvaW50cy5tYXAoZnVuY3Rpb24gKHBvaW50KSB7IHJldHVybiBcIlwiICsgZ2VuZXJhdGVUYWIoKSArIGdlbmVyYXRlRmxvYXRBcnJheShwb2ludCkgKyBcIixcXG5cIjsgfSkuam9pbignJykgK1xuICAgICAgICBnZW5lcmF0ZUJsb2NrRW5kKCk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVBhcnRpY2xlRW1pdHRlcnMobW9kZWwpIHtcbiAgICByZXR1cm4gbW9kZWwuUGFydGljbGVFbWl0dGVycy5tYXAoZ2VuZXJhdGVQYXJ0aWNsZUVtaXR0ZXJDaHVuaykuam9pbignJyk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVBhcnRpY2xlRW1pdHRlckNodW5rKGVtaXR0ZXIpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVCbG9ja1N0YXJ0KCdQYXJ0aWNsZUVtaXR0ZXInLCBlbWl0dGVyLk5hbWUpICtcbiAgICAgICAgZ2VuZXJhdGVOb2RlUHJvcHMoZW1pdHRlcikgK1xuICAgICAgICAoZW1pdHRlci5GbGFncyAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyRmxhZ3MuRW1pdHRlclVzZXNNREwgPyBnZW5lcmF0ZUJvb2xlYW5Qcm9wKCdFbWl0dGVyVXNlc01ETCcpIDogJycpICtcbiAgICAgICAgKGVtaXR0ZXIuRmxhZ3MgJiBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlckZsYWdzLkVtaXR0ZXJVc2VzVEdBID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnRW1pdHRlclVzZXNUR0EnKSA6ICcnKSArXG4gICAgICAgIGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ0VtaXNzaW9uUmF0ZScsIGVtaXR0ZXIuRW1pc3Npb25SYXRlKSArXG4gICAgICAgIGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ0dyYXZpdHknLCBlbWl0dGVyLkdyYXZpdHkpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnTG9uZ2l0dWRlJywgZW1pdHRlci5Mb25naXR1ZGUpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnTGF0aXR1ZGUnLCBlbWl0dGVyLkxhdGl0dWRlKSArXG4gICAgICAgIGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ1Zpc2liaWxpdHknLCBlbWl0dGVyLlZpc2liaWxpdHkpICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja1N0YXJ0KCdQYXJ0aWNsZScsIG51bGwsIDEpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnTGlmZVNwYW4nLCBlbWl0dGVyLkxpZmVTcGFuLCBudWxsLCAyKSArXG4gICAgICAgIGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ0luaXRWZWxvY2l0eScsIGVtaXR0ZXIuSW5pdFZlbG9jaXR5LCBudWxsLCAyKSArXG4gICAgICAgIGdlbmVyYXRlV3JhcHBlZFN0cmluZ1Byb3AoJ1BhdGgnLCBlbWl0dGVyLlBhdGgsIGZhbHNlLCAyKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoMSkgK1xuICAgICAgICBnZW5lcmF0ZUJsb2NrRW5kKCk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVBhcnRpY2xlRW1pdHRlcnMyKG1vZGVsKSB7XG4gICAgcmV0dXJuIG1vZGVsLlBhcnRpY2xlRW1pdHRlcnMyLm1hcChnZW5lcmF0ZVBhcnRpY2xlRW1pdHRlcjJDaHVuaykuam9pbignJyk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVBhcnRpY2xlRW1pdHRlcnMyRmlsdGVyTW9kZShmaWx0ZXJNb2RlKSB7XG4gICAgc3dpdGNoIChmaWx0ZXJNb2RlKSB7XG4gICAgICAgIGNhc2UgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZS5CbGVuZDpcbiAgICAgICAgICAgIHJldHVybiAnQmxlbmQnO1xuICAgICAgICBjYXNlIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGUuQWRkaXRpdmU6XG4gICAgICAgICAgICByZXR1cm4gJ0FkZGl0aXZlJztcbiAgICAgICAgY2FzZSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlLk1vZHVsYXRlOlxuICAgICAgICAgICAgcmV0dXJuICdNb2R1bGF0ZSc7XG4gICAgICAgIGNhc2UgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZS5Nb2R1bGF0ZTJ4OlxuICAgICAgICAgICAgcmV0dXJuICdNb2R1bGF0ZTJ4JztcbiAgICAgICAgY2FzZSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlLkFscGhhS2V5OlxuICAgICAgICAgICAgcmV0dXJuICdBbHBoYUtleSc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlU2VnbWVudENvbG9yKGNvbG9ycykge1xuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ1NlZ21lbnRDb2xvcicsIG51bGwsIDEpICtcbiAgICAgICAgY29sb3JzLm1hcChmdW5jdGlvbiAoY29sb3IpIHsgcmV0dXJuIGdlbmVyYXRlQ29sb3JQcm9wKCdDb2xvcicsIGNvbG9yLCBmYWxzZSwgMik7IH0pLmpvaW4oJycpICtcbiAgICAgICAgZ2VuZXJhdGVUYWIoKSArICd9LFxcbic7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVBhcnRpY2xlRW1pdHRlcjJGcmFtZUZsYWdzKGZyYW1lRmxhZ3MpIHtcbiAgICBpZiAoZnJhbWVGbGFncyAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLkhlYWQgJiYgZnJhbWVGbGFncyAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLlRhaWwpIHtcbiAgICAgICAgcmV0dXJuICdCb3RoJztcbiAgICB9XG4gICAgZWxzZSBpZiAoZnJhbWVGbGFncyAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLkhlYWQpIHtcbiAgICAgICAgcmV0dXJuICdIZWFkJztcbiAgICB9XG4gICAgZWxzZSBpZiAoZnJhbWVGbGFncyAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLlRhaWwpIHtcbiAgICAgICAgcmV0dXJuICdUYWlsJztcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJ0aWNsZUVtaXR0ZXIyQ2h1bmsocGFydGljbGVFbWl0dGVyMikge1xuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ1BhcnRpY2xlRW1pdHRlcjInLCBwYXJ0aWNsZUVtaXR0ZXIyLk5hbWUpICtcbiAgICAgICAgZ2VuZXJhdGVOb2RlUHJvcHMocGFydGljbGVFbWl0dGVyMikgK1xuICAgICAgICBnZW5lcmF0ZUJvb2xlYW5Qcm9wKGdlbmVyYXRlUGFydGljbGVFbWl0dGVyczJGaWx0ZXJNb2RlKHBhcnRpY2xlRW1pdHRlcjIuRmlsdGVyTW9kZSkpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnU3BlZWQnLCBwYXJ0aWNsZUVtaXR0ZXIyLlNwZWVkLCBudWxsKSArXG4gICAgICAgIGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ1ZhcmlhdGlvbicsIHBhcnRpY2xlRW1pdHRlcjIuVmFyaWF0aW9uLCBudWxsKSArXG4gICAgICAgIGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ0xhdGl0dWRlJywgcGFydGljbGVFbWl0dGVyMi5MYXRpdHVkZSwgbnVsbCkgK1xuICAgICAgICBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKCdHcmF2aXR5JywgcGFydGljbGVFbWl0dGVyMi5HcmF2aXR5LCBudWxsKSArXG4gICAgICAgIGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ0VtaXNzaW9uUmF0ZScsIHBhcnRpY2xlRW1pdHRlcjIuRW1pc3Npb25SYXRlLCBudWxsKSArXG4gICAgICAgIGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ1dpZHRoJywgcGFydGljbGVFbWl0dGVyMi5XaWR0aCwgbnVsbCkgK1xuICAgICAgICBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKCdMZW5ndGgnLCBwYXJ0aWNsZUVtaXR0ZXIyLkxlbmd0aCwgbnVsbCkgK1xuICAgICAgICBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKCdWaXNpYmlsaXR5JywgcGFydGljbGVFbWl0dGVyMi5WaXNpYmlsaXR5LCAxKSArXG4gICAgICAgIGdlbmVyYXRlU2VnbWVudENvbG9yKHBhcnRpY2xlRW1pdHRlcjIuU2VnbWVudENvbG9yKSArXG4gICAgICAgIGdlbmVyYXRlVUludEFycmF5UHJvcCgnQWxwaGEnLCBwYXJ0aWNsZUVtaXR0ZXIyLkFscGhhKSArXG4gICAgICAgIGdlbmVyYXRlRmxvYXRBcnJheVByb3AoJ1BhcnRpY2xlU2NhbGluZycsIHBhcnRpY2xlRW1pdHRlcjIuUGFydGljbGVTY2FsaW5nKSArXG4gICAgICAgIGdlbmVyYXRlRmxvYXRBcnJheVByb3AoJ0xpZmVTcGFuVVZBbmltJywgcGFydGljbGVFbWl0dGVyMi5MaWZlU3BhblVWQW5pbSkgK1xuICAgICAgICBnZW5lcmF0ZUZsb2F0QXJyYXlQcm9wKCdEZWNheVVWQW5pbScsIHBhcnRpY2xlRW1pdHRlcjIuRGVjYXlVVkFuaW0pICtcbiAgICAgICAgZ2VuZXJhdGVGbG9hdEFycmF5UHJvcCgnVGFpbFVWQW5pbScsIHBhcnRpY2xlRW1pdHRlcjIuVGFpbFVWQW5pbSkgK1xuICAgICAgICBnZW5lcmF0ZUZsb2F0QXJyYXlQcm9wKCdUYWlsRGVjYXlVVkFuaW0nLCBwYXJ0aWNsZUVtaXR0ZXIyLlRhaWxEZWNheVVWQW5pbSkgK1xuICAgICAgICBnZW5lcmF0ZUludFByb3BJZk5vdEVtcHR5KCdSb3dzJywgcGFydGljbGVFbWl0dGVyMi5Sb3dzLCAwKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcElmTm90RW1wdHkoJ0NvbHVtbnMnLCBwYXJ0aWNsZUVtaXR0ZXIyLkNvbHVtbnMsIDApICtcbiAgICAgICAgZ2VuZXJhdGVJbnRQcm9wKCdUZXh0dXJlSUQnLCBwYXJ0aWNsZUVtaXR0ZXIyLlRleHR1cmVJRCkgK1xuICAgICAgICBnZW5lcmF0ZUludFByb3BJZk5vdEVtcHR5KCdUaW1lJywgcGFydGljbGVFbWl0dGVyMi5UaW1lLCAwKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcElmTm90RW1wdHkoJ0xpZmVTcGFuJywgcGFydGljbGVFbWl0dGVyMi5MaWZlU3BhbiwgMCkgK1xuICAgICAgICBnZW5lcmF0ZUludFByb3BJZk5vdEVtcHR5KCdUYWlsTGVuZ3RoJywgcGFydGljbGVFbWl0dGVyMi5UYWlsTGVuZ3RoLCAwKSArXG4gICAgICAgIChwYXJ0aWNsZUVtaXR0ZXIyLkZsYWdzICYgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRmxhZ3MuU29ydFByaW1zRmFyWiA/IGdlbmVyYXRlQm9vbGVhblByb3AoJ1NvcnRQcmltc0ZhclonKSA6ICcnKSArXG4gICAgICAgIChwYXJ0aWNsZUVtaXR0ZXIyLkZsYWdzICYgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRmxhZ3MuTGluZUVtaXR0ZXIgPyBnZW5lcmF0ZUJvb2xlYW5Qcm9wKCdMaW5lRW1pdHRlcicpIDogJycpICtcbiAgICAgICAgKHBhcnRpY2xlRW1pdHRlcjIuRmxhZ3MgJiBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGbGFncy5Nb2RlbFNwYWNlID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnTW9kZWxTcGFjZScpIDogJycpICtcbiAgICAgICAgKHBhcnRpY2xlRW1pdHRlcjIuRmxhZ3MgJiBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGbGFncy5VbnNoYWRlZCA/IGdlbmVyYXRlQm9vbGVhblByb3AoJ1Vuc2hhZGVkJykgOiAnJykgK1xuICAgICAgICAocGFydGljbGVFbWl0dGVyMi5GbGFncyAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZsYWdzLlVuZm9nZ2VkID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnVW5mb2dnZWQnKSA6ICcnKSArXG4gICAgICAgIChwYXJ0aWNsZUVtaXR0ZXIyLkZsYWdzICYgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRmxhZ3MuWFlRdWFkID8gZ2VuZXJhdGVCb29sZWFuUHJvcCgnWFlRdWFkJykgOiAnJykgK1xuICAgICAgICAocGFydGljbGVFbWl0dGVyMi5TcXVpcnQgPyBnZW5lcmF0ZUJvb2xlYW5Qcm9wKCdTcXVpcnQnKSA6ICcnKSArXG4gICAgICAgIGdlbmVyYXRlQm9vbGVhblByb3AoZ2VuZXJhdGVQYXJ0aWNsZUVtaXR0ZXIyRnJhbWVGbGFncyhwYXJ0aWNsZUVtaXR0ZXIyLkZyYW1lRmxhZ3MpKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlUmliYm9uRW1pdHRlcnMobW9kZWwpIHtcbiAgICByZXR1cm4gbW9kZWwuUmliYm9uRW1pdHRlcnMubWFwKGdlbmVyYXRlUmliYm9uRW1pdHRlckNodW5rKS5qb2luKCcnKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlUmliYm9uRW1pdHRlckNodW5rKHJpYmJvbkVtaXR0ZXIpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVCbG9ja1N0YXJ0KCdSaWJib25FbWl0dGVyJywgcmliYm9uRW1pdHRlci5OYW1lKSArXG4gICAgICAgIGdlbmVyYXRlTm9kZVByb3BzKHJpYmJvbkVtaXR0ZXIpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnSGVpZ2h0QWJvdmUnLCByaWJib25FbWl0dGVyLkhlaWdodEFib3ZlLCBudWxsKSArXG4gICAgICAgIGdlbmVyYXRlQW5pbVZlY3RvclByb3AoJ0hlaWdodEJlbG93JywgcmliYm9uRW1pdHRlci5IZWlnaHRCZWxvdywgbnVsbCkgK1xuICAgICAgICBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKCdBbHBoYScsIHJpYmJvbkVtaXR0ZXIuQWxwaGEsIG51bGwpICtcbiAgICAgICAgZ2VuZXJhdGVDb2xvclByb3AoJ0NvbG9yJywgcmliYm9uRW1pdHRlci5Db2xvciwgdHJ1ZSkgK1xuICAgICAgICBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKCdUZXh0dXJlU2xvdCcsIHJpYmJvbkVtaXR0ZXIuVGV4dHVyZVNsb3QsIG51bGwpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnVmlzaWJpbGl0eScsIHJpYmJvbkVtaXR0ZXIuVmlzaWJpbGl0eSwgMSkgK1xuICAgICAgICBnZW5lcmF0ZUludFByb3AoJ0VtaXNzaW9uUmF0ZScsIHJpYmJvbkVtaXR0ZXIuRW1pc3Npb25SYXRlKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcCgnTGlmZVNwYW4nLCByaWJib25FbWl0dGVyLkxpZmVTcGFuKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcElmTm90RW1wdHkoJ0dyYXZpdHknLCByaWJib25FbWl0dGVyLkdyYXZpdHksIDApICtcbiAgICAgICAgZ2VuZXJhdGVJbnRQcm9wKCdSb3dzJywgcmliYm9uRW1pdHRlci5Sb3dzKSArXG4gICAgICAgIGdlbmVyYXRlSW50UHJvcCgnQ29sdW1ucycsIHJpYmJvbkVtaXR0ZXIuQ29sdW1ucykgK1xuICAgICAgICBnZW5lcmF0ZUludFByb3BJZk5vdEVtcHR5KCdNYXRlcmlhbElEJywgcmliYm9uRW1pdHRlci5NYXRlcmlhbElEKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlRXZlbnRPYmplY3RzKG1vZGVsKSB7XG4gICAgcmV0dXJuIG1vZGVsLkV2ZW50T2JqZWN0cy5tYXAoZ2VuZXJhdGVFdmVudE9iamVjdENodW5rKS5qb2luKCcnKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlRXZlbnRUcmFjayhldmVudFRyYWNrKSB7XG4gICAgdmFyIG1pZGRsZSA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnRUcmFjay5sZW5ndGg7ICsraSkge1xuICAgICAgICBtaWRkbGUgKz0gZ2VuZXJhdGVUYWIoMikgKyBldmVudFRyYWNrW2ldICsgJyxcXG4nO1xuICAgIH1cbiAgICByZXR1cm4gZ2VuZXJhdGVCbG9ja1N0YXJ0KCdFdmVudFRyYWNrJywgZXZlbnRUcmFjay5sZW5ndGgsIDEpICtcbiAgICAgICAgbWlkZGxlICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgxKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlRXZlbnRPYmplY3RDaHVuayhldmVudE9iamVjdCkge1xuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ0V2ZW50T2JqZWN0JywgZXZlbnRPYmplY3QuTmFtZSkgK1xuICAgICAgICBnZW5lcmF0ZU5vZGVQcm9wcyhldmVudE9iamVjdCkgK1xuICAgICAgICBnZW5lcmF0ZUV2ZW50VHJhY2soZXZlbnRPYmplY3QuRXZlbnRUcmFjaykgK1xuICAgICAgICBnZW5lcmF0ZUJsb2NrRW5kKCk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUNhbWVyYXMobW9kZWwpIHtcbiAgICByZXR1cm4gbW9kZWwuQ2FtZXJhcy5tYXAoZ2VuZXJhdGVDYW1lcmFDaHVuaykuam9pbignJyk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUNhbWVyYUNodW5rKGNhbWVyYSkge1xuICAgIHJldHVybiBnZW5lcmF0ZUJsb2NrU3RhcnQoJ0NhbWVyYScsIGNhbWVyYS5OYW1lKSArXG4gICAgICAgIGdlbmVyYXRlRmxvYXRQcm9wKCdGaWVsZE9mVmlldycsIGNhbWVyYS5GaWVsZE9mVmlldykgK1xuICAgICAgICBnZW5lcmF0ZUZsb2F0UHJvcCgnRmFyQ2xpcCcsIGNhbWVyYS5GYXJDbGlwKSArXG4gICAgICAgIGdlbmVyYXRlRmxvYXRQcm9wKCdOZWFyQ2xpcCcsIGNhbWVyYS5OZWFyQ2xpcCkgK1xuICAgICAgICBnZW5lcmF0ZUZsb2F0QXJyYXlQcm9wKCdQb3NpdGlvbicsIGNhbWVyYS5Qb3NpdGlvbikgK1xuICAgICAgICBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKCdUcmFuc2xhdGlvbicsIGNhbWVyYS5UcmFuc2xhdGlvbikgK1xuICAgICAgICBnZW5lcmF0ZUFuaW1WZWN0b3JQcm9wKCdSb3RhdGlvbicsIGNhbWVyYS5Sb3RhdGlvbikgK1xuICAgICAgICBnZW5lcmF0ZUJsb2NrU3RhcnQoJ1RhcmdldCcsIG51bGwsIDEpICtcbiAgICAgICAgZ2VuZXJhdGVGbG9hdEFycmF5UHJvcCgnUG9zaXRpb24nLCBjYW1lcmEuVGFyZ2V0UG9zaXRpb24sIG51bGwsIDIpICtcbiAgICAgICAgZ2VuZXJhdGVBbmltVmVjdG9yUHJvcCgnVHJhbnNsYXRpb24nLCBjYW1lcmEuVGFyZ2V0VHJhbnNsYXRpb24sIG51bGwsIDIpICtcbiAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgxKSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlQ29sbGlzaW9uU2hhcGVzKG1vZGVsKSB7XG4gICAgcmV0dXJuIG1vZGVsLkNvbGxpc2lvblNoYXBlcy5tYXAoZ2VuZXJhdGVDb2xsaXNpb25TaGFwZUNodW5rKS5qb2luKCcnKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlQ29sbGlzaW9uU2hhcGVDaHVuayhjb2xsaXNpb25TaGFwZSkge1xuICAgIHZhciBtaWRkbGUgPSAnJztcbiAgICBpZiAoY29sbGlzaW9uU2hhcGUuU2hhcGUgPT09IG1vZGVsXzEuQ29sbGlzaW9uU2hhcGVUeXBlLkJveCkge1xuICAgICAgICBtaWRkbGUgPSBnZW5lcmF0ZUJvb2xlYW5Qcm9wKCdCb3gnKTtcbiAgICAgICAgbWlkZGxlICs9IGdlbmVyYXRlQmxvY2tTdGFydCgnVmVydGljZXMnLCAyLCAxKSArXG4gICAgICAgICAgICBnZW5lcmF0ZVRhYigyKSArIGdlbmVyYXRlRmxvYXRBcnJheShjb2xsaXNpb25TaGFwZS5WZXJ0aWNlcy5zbGljZSgwLCAzKSkgKyAnLFxcbicgK1xuICAgICAgICAgICAgZ2VuZXJhdGVUYWIoMikgKyBnZW5lcmF0ZUZsb2F0QXJyYXkoY29sbGlzaW9uU2hhcGUuVmVydGljZXMuc2xpY2UoMywgNikpICsgJyxcXG4nICtcbiAgICAgICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoMSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBtaWRkbGUgPSBnZW5lcmF0ZUJvb2xlYW5Qcm9wKCdTcGhlcmUnKTtcbiAgICAgICAgbWlkZGxlICs9IGdlbmVyYXRlQmxvY2tTdGFydCgnVmVydGljZXMnLCAxLCAxKSArXG4gICAgICAgICAgICBnZW5lcmF0ZVRhYigyKSArIGdlbmVyYXRlRmxvYXRBcnJheShjb2xsaXNpb25TaGFwZS5WZXJ0aWNlcykgKyAnLFxcbicgK1xuICAgICAgICAgICAgZ2VuZXJhdGVCbG9ja0VuZCgxKSArXG4gICAgICAgICAgICBnZW5lcmF0ZUZsb2F0UHJvcCgnQm91bmRzUmFkaXVzJywgY29sbGlzaW9uU2hhcGUuQm91bmRzUmFkaXVzKTtcbiAgICB9XG4gICAgcmV0dXJuIGdlbmVyYXRlQmxvY2tTdGFydCgnQ29sbGlzaW9uU2hhcGUnLCBjb2xsaXNpb25TaGFwZS5OYW1lKSArXG4gICAgICAgIGdlbmVyYXRlTm9kZVByb3BzKGNvbGxpc2lvblNoYXBlKSArXG4gICAgICAgIG1pZGRsZSArXG4gICAgICAgIGdlbmVyYXRlQmxvY2tFbmQoKTtcbn1cbnZhciBnZW5lcmF0b3JzID0gW1xuICAgIGdlbmVyYXRlVmVyc2lvbixcbiAgICBnZW5lcmF0ZU1vZGVsLFxuICAgIGdlbmVyYXRlU2VxdWVuY2VzLFxuICAgIGdlbmVyYXRlR2xvYmFsU2VxdWVuY2VzLFxuICAgIGdlbmVyYXRlVGV4dHVyZXMsXG4gICAgZ2VuZXJhdGVNYXRlcmlhbHMsXG4gICAgZ2VuZXJhdGVUZXh0dXJlQW5pbXMsXG4gICAgZ2VuZXJhdGVHZW9zZXRzLFxuICAgIGdlbmVyYXRlR2Vvc2V0QW5pbXMsXG4gICAgZ2VuZXJhdGVCb25lcyxcbiAgICBnZW5lcmF0ZUxpZ2h0cyxcbiAgICBnZW5lcmF0ZUhlbHBlcnMsXG4gICAgZ2VuZXJhdGVBdHRhY2htZW50cyxcbiAgICBnZW5lcmF0ZVBpdm90UG9pbnRzLFxuICAgIGdlbmVyYXRlUGFydGljbGVFbWl0dGVycyxcbiAgICBnZW5lcmF0ZVBhcnRpY2xlRW1pdHRlcnMyLFxuICAgIGdlbmVyYXRlUmliYm9uRW1pdHRlcnMsXG4gICAgZ2VuZXJhdGVFdmVudE9iamVjdHMsXG4gICAgZ2VuZXJhdGVDYW1lcmFzLFxuICAgIGdlbmVyYXRlQ29sbGlzaW9uU2hhcGVzXG5dO1xuZnVuY3Rpb24gZ2VuZXJhdGUobW9kZWwpIHtcbiAgICB2YXIgcmVzID0gJyc7XG4gICAgZm9yICh2YXIgX2kgPSAwLCBnZW5lcmF0b3JzXzEgPSBnZW5lcmF0b3JzOyBfaSA8IGdlbmVyYXRvcnNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IGdlbmVyYXRvcnNfMVtfaV07XG4gICAgICAgIHJlcyArPSBnZW5lcmF0b3IobW9kZWwpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuZXhwb3J0cy5nZW5lcmF0ZSA9IGdlbmVyYXRlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2VuZXJhdGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbW9kZWxfMSA9IHJlcXVpcmUoXCIuLi9tb2RlbFwiKTtcbnZhciBTdGF0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RhdGUoc3RyKSB7XG4gICAgICAgIHRoaXMuc3RyID0gc3RyO1xuICAgICAgICB0aGlzLnBvcyA9IDA7XG4gICAgfVxuICAgIFN0YXRlLnByb3RvdHlwZS5jaGFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJbdGhpcy5wb3NdO1xuICAgIH07XG4gICAgcmV0dXJuIFN0YXRlO1xufSgpKTtcbmZ1bmN0aW9uIHRocm93RXJyb3Ioc3RhdGUsIHN0cikge1xuICAgIGlmIChzdHIgPT09IHZvaWQgMCkgeyBzdHIgPSAnJzsgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIlN5bnRheEVycm9yLCBuZWFyIFwiICsgc3RhdGUucG9zICsgKHN0ciA/ICcsICcgKyBzdHIgOiAnJykpO1xufVxuZnVuY3Rpb24gcGFyc2VDb21tZW50KHN0YXRlKSB7XG4gICAgaWYgKHN0YXRlLmNoYXIoKSA9PT0gJy8nICYmIHN0YXRlLnN0cltzdGF0ZS5wb3MgKyAxXSA9PT0gJy8nKSB7XG4gICAgICAgIHN0YXRlLnBvcyArPSAyO1xuICAgICAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhdGUuc3RyLmxlbmd0aCAmJiBzdGF0ZS5zdHJbKytzdGF0ZS5wb3NdICE9PSAnXFxuJylcbiAgICAgICAgICAgIDtcbiAgICAgICAgKytzdGF0ZS5wb3M7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG52YXIgc3BhY2VSRSA9IC9cXHMvaTtcbmZ1bmN0aW9uIHBhcnNlU3BhY2Uoc3RhdGUpIHtcbiAgICB3aGlsZSAoc3BhY2VSRS50ZXN0KHN0YXRlLmNoYXIoKSkpIHtcbiAgICAgICAgKytzdGF0ZS5wb3M7XG4gICAgfVxufVxudmFyIGtleXdvcmRGaXJzdENoYXJSRSA9IC9bYS16XS9pO1xudmFyIGtleXdvcmRPdGhlckNoYXJSRSA9IC9bYS16MC05XS9pO1xuZnVuY3Rpb24gcGFyc2VLZXl3b3JkKHN0YXRlKSB7XG4gICAgaWYgKCFrZXl3b3JkRmlyc3RDaGFyUkUudGVzdChzdGF0ZS5jaGFyKCkpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIga2V5d29yZCA9IHN0YXRlLmNoYXIoKTtcbiAgICArK3N0YXRlLnBvcztcbiAgICB3aGlsZSAoa2V5d29yZE90aGVyQ2hhclJFLnRlc3Qoc3RhdGUuY2hhcigpKSkge1xuICAgICAgICBrZXl3b3JkICs9IHN0YXRlLnN0cltzdGF0ZS5wb3MrK107XG4gICAgfVxuICAgIHBhcnNlU3BhY2Uoc3RhdGUpO1xuICAgIHJldHVybiBrZXl3b3JkO1xufVxuZnVuY3Rpb24gcGFyc2VTeW1ib2woc3RhdGUsIHN5bWJvbCkge1xuICAgIGlmIChzdGF0ZS5jaGFyKCkgPT09IHN5bWJvbCkge1xuICAgICAgICArK3N0YXRlLnBvcztcbiAgICAgICAgcGFyc2VTcGFjZShzdGF0ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsIHN5bWJvbCkge1xuICAgIGlmIChzdGF0ZS5jaGFyKCkgIT09IHN5bWJvbCkge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCBcImV4dGVjdGVkIFwiICsgc3ltYm9sKTtcbiAgICB9XG4gICAgKytzdGF0ZS5wb3M7XG4gICAgcGFyc2VTcGFjZShzdGF0ZSk7XG59XG5mdW5jdGlvbiBwYXJzZVN0cmluZyhzdGF0ZSkge1xuICAgIGlmIChzdGF0ZS5jaGFyKCkgPT09ICdcIicpIHtcbiAgICAgICAgdmFyIHN0YXJ0ID0gKytzdGF0ZS5wb3M7IC8vIFwiXG4gICAgICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICdcIicpIHtcbiAgICAgICAgICAgICsrc3RhdGUucG9zO1xuICAgICAgICB9XG4gICAgICAgICsrc3RhdGUucG9zOyAvLyBcIlxuICAgICAgICB2YXIgcmVzID0gc3RhdGUuc3RyLnN1YnN0cmluZyhzdGFydCwgc3RhdGUucG9zIC0gMSk7XG4gICAgICAgIHBhcnNlU3BhY2Uoc3RhdGUpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbnZhciBudW1iZXJGaXJzdENoYXJSRSA9IC9bLTAtOV0vO1xudmFyIG51bWJlck90aGVyQ2hhclJFID0gL1stKy4wLTllXS9pO1xuZnVuY3Rpb24gcGFyc2VOdW1iZXIoc3RhdGUpIHtcbiAgICBpZiAobnVtYmVyRmlyc3RDaGFyUkUudGVzdChzdGF0ZS5jaGFyKCkpKSB7XG4gICAgICAgIHZhciBzdGFydCA9IHN0YXRlLnBvcztcbiAgICAgICAgKytzdGF0ZS5wb3M7XG4gICAgICAgIHdoaWxlIChudW1iZXJPdGhlckNoYXJSRS50ZXN0KHN0YXRlLmNoYXIoKSkpIHtcbiAgICAgICAgICAgICsrc3RhdGUucG9zO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXMgPSBwYXJzZUZsb2F0KHN0YXRlLnN0ci5zdWJzdHJpbmcoc3RhcnQsIHN0YXRlLnBvcykpO1xuICAgICAgICBwYXJzZVNwYWNlKHN0YXRlKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBwYXJzZUFycmF5KHN0YXRlLCBhcnIsIHBvcykge1xuICAgIGlmIChzdGF0ZS5jaGFyKCkgIT09ICd7Jykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKCFhcnIpIHtcbiAgICAgICAgYXJyID0gW107XG4gICAgICAgIHBvcyA9IDA7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICB2YXIgbnVtID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICBpZiAobnVtID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZXhwZWN0ZWQgbnVtYmVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgYXJyW3BvcysrXSA9IG51bTtcbiAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIHJldHVybiBhcnI7XG59XG5mdW5jdGlvbiBwYXJzZUFycmF5T3JTaW5nbGVJdGVtKHN0YXRlLCBhcnIpIHtcbiAgICBpZiAoc3RhdGUuY2hhcigpICE9PSAneycpIHtcbiAgICAgICAgYXJyWzBdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH1cbiAgICB2YXIgcG9zID0gMDtcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIG51bSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgaWYgKG51bSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2V4cGVjdGVkIG51bWJlcicpO1xuICAgICAgICB9XG4gICAgICAgIGFycltwb3MrK10gPSBudW07XG4gICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICByZXR1cm4gYXJyO1xufVxuZnVuY3Rpb24gcGFyc2VPYmplY3Qoc3RhdGUpIHtcbiAgICB2YXIgcHJlZml4ID0gbnVsbDtcbiAgICB2YXIgb2JqID0ge307XG4gICAgaWYgKHN0YXRlLmNoYXIoKSAhPT0gJ3snKSB7XG4gICAgICAgIHByZWZpeCA9IHBhcnNlU3RyaW5nKHN0YXRlKTtcbiAgICAgICAgaWYgKHByZWZpeCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcHJlZml4ID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmVmaXggPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdleHBlY3RlZCBzdHJpbmcgb3IgbnVtYmVyJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgaWYgKCFrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0ludGVydmFsJykge1xuICAgICAgICAgICAgdmFyIGFycmF5ID0gbmV3IFVpbnQzMkFycmF5KDIpO1xuICAgICAgICAgICAgb2JqW2tleXdvcmRdID0gcGFyc2VBcnJheShzdGF0ZSwgYXJyYXksIDApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdNaW5pbXVtRXh0ZW50JyB8fCBrZXl3b3JkID09PSAnTWF4aW11bUV4dGVudCcpIHtcbiAgICAgICAgICAgIHZhciBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgICAgICBvYmpba2V5d29yZF0gPSBwYXJzZUFycmF5KHN0YXRlLCBhcnJheSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvYmpba2V5d29yZF0gPSBwYXJzZUFycmF5KHN0YXRlKSB8fCBwYXJzZVN0cmluZyhzdGF0ZSk7XG4gICAgICAgICAgICBpZiAob2JqW2tleXdvcmRdID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb2JqW2tleXdvcmRdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICByZXR1cm4gW3ByZWZpeCwgb2JqXTtcbn1cbmZ1bmN0aW9uIHBhcnNlVmVyc2lvbihzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgX2EgPSBwYXJzZU9iamVjdChzdGF0ZSksIHVudXNlZCA9IF9hWzBdLCBvYmogPSBfYVsxXTtcbiAgICBpZiAob2JqLkZvcm1hdFZlcnNpb24pIHtcbiAgICAgICAgbW9kZWwuVmVyc2lvbiA9IG9iai5Gb3JtYXRWZXJzaW9uO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlTW9kZWxJbmZvKHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciBfYSA9IHBhcnNlT2JqZWN0KHN0YXRlKSwgbmFtZSA9IF9hWzBdLCBvYmogPSBfYVsxXTtcbiAgICBtb2RlbC5JbmZvID0gb2JqO1xuICAgIG1vZGVsLkluZm8uTmFtZSA9IG5hbWU7XG59XG5mdW5jdGlvbiBwYXJzZVNlcXVlbmNlcyhzdGF0ZSwgbW9kZWwpIHtcbiAgICBwYXJzZU51bWJlcihzdGF0ZSk7IC8vIGNvdW50LCBub3QgdXNlZFxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgcGFyc2VLZXl3b3JkKHN0YXRlKTsgLy8gQW5pbVxuICAgICAgICB2YXIgX2EgPSBwYXJzZU9iamVjdChzdGF0ZSksIG5hbWVfMSA9IF9hWzBdLCBvYmogPSBfYVsxXTtcbiAgICAgICAgb2JqLk5hbWUgPSBuYW1lXzE7XG4gICAgICAgIG9iai5Ob25Mb29waW5nID0gJ05vbkxvb3BpbmcnIGluIG9iajtcbiAgICAgICAgcmVzLnB1c2gob2JqKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgbW9kZWwuU2VxdWVuY2VzID0gcmVzO1xufVxuZnVuY3Rpb24gcGFyc2VUZXh0dXJlcyhzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgcGFyc2VOdW1iZXIoc3RhdGUpOyAvLyBjb3VudCwgbm90IHVzZWRcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgcGFyc2VLZXl3b3JkKHN0YXRlKTsgLy8gQml0bWFwXG4gICAgICAgIHZhciBfYSA9IHBhcnNlT2JqZWN0KHN0YXRlKSwgdW51c2VkID0gX2FbMF0sIG9iaiA9IF9hWzFdO1xuICAgICAgICBvYmouRmxhZ3MgPSAwO1xuICAgICAgICBpZiAoJ1dyYXBXaWR0aCcgaW4gb2JqKSB7XG4gICAgICAgICAgICBvYmouRmxhZ3MgKz0gbW9kZWxfMS5UZXh0dXJlRmxhZ3MuV3JhcFdpZHRoO1xuICAgICAgICAgICAgZGVsZXRlIG9iai5XcmFwV2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdXcmFwSGVpZ2h0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIG9iai5GbGFncyArPSBtb2RlbF8xLlRleHR1cmVGbGFncy5XcmFwSGVpZ2h0O1xuICAgICAgICAgICAgZGVsZXRlIG9iai5XcmFwSGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHJlcy5wdXNoKG9iaik7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLlRleHR1cmVzID0gcmVzO1xufVxudmFyIEFuaW1WZWN0b3JUeXBlO1xuKGZ1bmN0aW9uIChBbmltVmVjdG9yVHlwZSkge1xuICAgIEFuaW1WZWN0b3JUeXBlW0FuaW1WZWN0b3JUeXBlW1wiSU5UMVwiXSA9IDBdID0gXCJJTlQxXCI7XG4gICAgQW5pbVZlY3RvclR5cGVbQW5pbVZlY3RvclR5cGVbXCJGTE9BVDFcIl0gPSAxXSA9IFwiRkxPQVQxXCI7XG4gICAgQW5pbVZlY3RvclR5cGVbQW5pbVZlY3RvclR5cGVbXCJGTE9BVDNcIl0gPSAyXSA9IFwiRkxPQVQzXCI7XG4gICAgQW5pbVZlY3RvclR5cGVbQW5pbVZlY3RvclR5cGVbXCJGTE9BVDRcIl0gPSAzXSA9IFwiRkxPQVQ0XCI7XG59KShBbmltVmVjdG9yVHlwZSB8fCAoQW5pbVZlY3RvclR5cGUgPSB7fSkpO1xudmFyIGFuaW1WZWN0b3JTaXplID0gKF9hID0ge30sXG4gICAgX2FbQW5pbVZlY3RvclR5cGUuSU5UMV0gPSAxLFxuICAgIF9hW0FuaW1WZWN0b3JUeXBlLkZMT0FUMV0gPSAxLFxuICAgIF9hW0FuaW1WZWN0b3JUeXBlLkZMT0FUM10gPSAzLFxuICAgIF9hW0FuaW1WZWN0b3JUeXBlLkZMT0FUNF0gPSA0LFxuICAgIF9hKTtcbmZ1bmN0aW9uIHBhcnNlQW5pbUtleWZyYW1lKHN0YXRlLCBmcmFtZSwgdHlwZSwgbGluZVR5cGUpIHtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBGcmFtZTogZnJhbWUsXG4gICAgICAgIFZlY3RvcjogbnVsbFxuICAgIH07XG4gICAgdmFyIFZlY3RvciA9IHR5cGUgPT09IEFuaW1WZWN0b3JUeXBlLklOVDEgPyBJbnQzMkFycmF5IDogRmxvYXQzMkFycmF5O1xuICAgIHZhciBpdGVtQ291bnQgPSBhbmltVmVjdG9yU2l6ZVt0eXBlXTtcbiAgICByZXMuVmVjdG9yID0gcGFyc2VBcnJheU9yU2luZ2xlSXRlbShzdGF0ZSwgbmV3IFZlY3RvcihpdGVtQ291bnQpKTtcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICBpZiAobGluZVR5cGUgPT09IG1vZGVsXzEuTGluZVR5cGUuSGVybWl0ZSB8fCBsaW5lVHlwZSA9PT0gbW9kZWxfMS5MaW5lVHlwZS5CZXppZXIpIHtcbiAgICAgICAgcGFyc2VLZXl3b3JkKHN0YXRlKTsgLy8gSW5UYW5cbiAgICAgICAgcmVzLkluVGFuID0gcGFyc2VBcnJheU9yU2luZ2xlSXRlbShzdGF0ZSwgbmV3IFZlY3RvcihpdGVtQ291bnQpKTtcbiAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgICAgIHBhcnNlS2V5d29yZChzdGF0ZSk7IC8vIE91dFRhblxuICAgICAgICByZXMuT3V0VGFuID0gcGFyc2VBcnJheU9yU2luZ2xlSXRlbShzdGF0ZSwgbmV3IFZlY3RvcihpdGVtQ291bnQpKTtcbiAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5mdW5jdGlvbiBwYXJzZUFuaW1WZWN0b3Ioc3RhdGUsIHR5cGUpIHtcbiAgICB2YXIgYW5pbVZlY3RvciA9IHtcbiAgICAgICAgTGluZVR5cGU6IG1vZGVsXzEuTGluZVR5cGUuRG9udEludGVycCxcbiAgICAgICAgR2xvYmFsU2VxSWQ6IG51bGwsXG4gICAgICAgIEtleXM6IFtdXG4gICAgfTtcbiAgICBwYXJzZU51bWJlcihzdGF0ZSk7IC8vIGNvdW50LCBub3QgdXNlZFxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHZhciBsaW5lVHlwZSA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgaWYgKGxpbmVUeXBlID09PSAnRG9udEludGVycCcgfHwgbGluZVR5cGUgPT09ICdMaW5lYXInIHx8IGxpbmVUeXBlID09PSAnSGVybWl0ZScgfHwgbGluZVR5cGUgPT09ICdCZXppZXInKSB7XG4gICAgICAgIGFuaW1WZWN0b3IuTGluZVR5cGUgPSBtb2RlbF8xLkxpbmVUeXBlW2xpbmVUeXBlXTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgaWYgKGtleXdvcmQgPT09ICdHbG9iYWxTZXFJZCcpIHtcbiAgICAgICAgICAgIGFuaW1WZWN0b3Jba2V5d29yZF0gPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBmcmFtZSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgICAgIGlmIChmcmFtZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdleHBlY3RlZCBmcmFtZSBudW1iZXIgb3IgR2xvYmFsU2VxSWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnOicpO1xuICAgICAgICAgICAgYW5pbVZlY3Rvci5LZXlzLnB1c2gocGFyc2VBbmltS2V5ZnJhbWUoc3RhdGUsIGZyYW1lLCB0eXBlLCBhbmltVmVjdG9yLkxpbmVUeXBlKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgcmV0dXJuIGFuaW1WZWN0b3I7XG59XG5mdW5jdGlvbiBwYXJzZUxheWVyKHN0YXRlKSB7XG4gICAgdmFyIHJlcyA9IHtcbiAgICAgICAgQWxwaGE6IG51bGwsXG4gICAgICAgIFRWZXJ0ZXhBbmltSWQ6IG51bGwsXG4gICAgICAgIFNoYWRpbmc6IDAsXG4gICAgICAgIENvb3JkSWQ6IDBcbiAgICB9O1xuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIHZhciBpc1N0YXRpYyA9IGZhbHNlO1xuICAgICAgICBpZiAoIWtleXdvcmQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnc3RhdGljJykge1xuICAgICAgICAgICAgaXNTdGF0aWMgPSB0cnVlO1xuICAgICAgICAgICAga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1N0YXRpYyAmJiBrZXl3b3JkID09PSAnVGV4dHVyZUlEJykge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCBBbmltVmVjdG9yVHlwZS5JTlQxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghaXNTdGF0aWMgJiYga2V5d29yZCA9PT0gJ0FscGhhJykge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdVbnNoYWRlZCcgfHwga2V5d29yZCA9PT0gJ1NwaGVyZUVudk1hcCcgfHwga2V5d29yZCA9PT0gJ1R3b1NpZGVkJyB8fFxuICAgICAgICAgICAga2V5d29yZCA9PT0gJ1VuZm9nZ2VkJyB8fCBrZXl3b3JkID09PSAnTm9EZXB0aFRlc3QnIHx8IGtleXdvcmQgPT09ICdOb0RlcHRoU2V0Jykge1xuICAgICAgICAgICAgcmVzLlNoYWRpbmcgfD0gbW9kZWxfMS5MYXllclNoYWRpbmdba2V5d29yZF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0ZpbHRlck1vZGUnKSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgICAgIGlmICh2YWwgPT09ICdOb25lJyB8fCB2YWwgPT09ICdUcmFuc3BhcmVudCcgfHwgdmFsID09PSAnQmxlbmQnIHx8IHZhbCA9PT0gJ0FkZGl0aXZlJyB8fFxuICAgICAgICAgICAgICAgIHZhbCA9PT0gJ0FkZEFscGhhJyB8fCB2YWwgPT09ICdNb2R1bGF0ZScgfHwgdmFsID09PSAnTW9kdWxhdGUyeCcpIHtcbiAgICAgICAgICAgICAgICByZXMuRmlsdGVyTW9kZSA9IG1vZGVsXzEuRmlsdGVyTW9kZVt2YWxdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdUVmVydGV4QW5pbUlkJykge1xuICAgICAgICAgICAgcmVzLlRWZXJ0ZXhBbmltSWQgPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhbCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIHJldHVybiByZXM7XG59XG5mdW5jdGlvbiBwYXJzZU1hdGVyaWFscyhzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgcGFyc2VOdW1iZXIoc3RhdGUpOyAvLyBjb3VudCwgbm90IHVzZWRcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIG9iaiA9IHtcbiAgICAgICAgICAgIFJlbmRlck1vZGU6IDAsXG4gICAgICAgICAgICBMYXllcnM6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHBhcnNlS2V5d29yZChzdGF0ZSk7IC8vIE1hdGVyaWFsXG4gICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgICAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgICAgIGlmICgha2V5d29yZCkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGtleXdvcmQgPT09ICdMYXllcicpIHtcbiAgICAgICAgICAgICAgICBvYmouTGF5ZXJzLnB1c2gocGFyc2VMYXllcihzdGF0ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1ByaW9yaXR5UGxhbmUnKSB7XG4gICAgICAgICAgICAgICAgb2JqW2tleXdvcmRdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0NvbnN0YW50Q29sb3InIHx8IGtleXdvcmQgPT09ICdTb3J0UHJpbXNGYXJaJyB8fCBrZXl3b3JkID09PSAnRnVsbFJlc29sdXRpb24nKSB7XG4gICAgICAgICAgICAgICAgb2JqLlJlbmRlck1vZGUgfD0gbW9kZWxfMS5NYXRlcmlhbFJlbmRlck1vZGVba2V5d29yZF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbWF0ZXJpYWwgcHJvcGVydHkgJyArIGtleXdvcmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgICAgIHJlcy5wdXNoKG9iaik7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLk1hdGVyaWFscyA9IHJlcztcbn1cbmZ1bmN0aW9uIHBhcnNlR2Vvc2V0KHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciByZXMgPSB7XG4gICAgICAgIFZlcnRpY2VzOiBudWxsLFxuICAgICAgICBOb3JtYWxzOiBudWxsLFxuICAgICAgICBUVmVydGljZXM6IFtdLFxuICAgICAgICBWZXJ0ZXhHcm91cDogbnVsbCxcbiAgICAgICAgRmFjZXM6IG51bGwsXG4gICAgICAgIEdyb3VwczogbnVsbCxcbiAgICAgICAgVG90YWxHcm91cHNDb3VudDogbnVsbCxcbiAgICAgICAgTWluaW11bUV4dGVudDogbnVsbCxcbiAgICAgICAgTWF4aW11bUV4dGVudDogbnVsbCxcbiAgICAgICAgQm91bmRzUmFkaXVzOiBudWxsLFxuICAgICAgICBBbmltczogW10sXG4gICAgICAgIE1hdGVyaWFsSUQ6IG51bGwsXG4gICAgICAgIFNlbGVjdGlvbkdyb3VwOiBudWxsLFxuICAgICAgICBVbnNlbGVjdGFibGU6IGZhbHNlXG4gICAgfTtcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICBpZiAoIWtleXdvcmQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnVmVydGljZXMnIHx8IGtleXdvcmQgPT09ICdOb3JtYWxzJyB8fCBrZXl3b3JkID09PSAnVFZlcnRpY2VzJykge1xuICAgICAgICAgICAgdmFyIGNvdW50UGVyT2JqID0gMztcbiAgICAgICAgICAgIGlmIChrZXl3b3JkID09PSAnVFZlcnRpY2VzJykge1xuICAgICAgICAgICAgICAgIGNvdW50UGVyT2JqID0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjb3VudCA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgICAgIHZhciBhcnIgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogY291bnRQZXJPYmopO1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgY291bnQ7ICsraW5kZXgpIHtcbiAgICAgICAgICAgICAgICBwYXJzZUFycmF5KHN0YXRlLCBhcnIsIGluZGV4ICogY291bnRQZXJPYmopO1xuICAgICAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ1RWZXJ0aWNlcycpIHtcbiAgICAgICAgICAgICAgICByZXMuVFZlcnRpY2VzLnB1c2goYXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IGFycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnVmVydGV4R3JvdXAnKSB7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBuZXcgVWludDhBcnJheShyZXMuVmVydGljZXMubGVuZ3RoIC8gMyk7XG4gICAgICAgICAgICBwYXJzZUFycmF5KHN0YXRlLCByZXNba2V5d29yZF0sIDApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdGYWNlcycpIHtcbiAgICAgICAgICAgIHBhcnNlTnVtYmVyKHN0YXRlKTsgLy8gZ3JvdXAgY291bnQsIGFsd2F5cyAxP1xuICAgICAgICAgICAgdmFyIGluZGV4Q291bnQgPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgICAgICByZXMuRmFjZXMgPSBuZXcgVWludDE2QXJyYXkoaW5kZXhDb3VudCk7XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICAgICAgICAgIHBhcnNlS2V5d29yZChzdGF0ZSk7IC8vIFRyaWFuZ2xlc1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgICAgICAgICBwYXJzZUFycmF5KHN0YXRlLCByZXMuRmFjZXMsIDApO1xuICAgICAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdHcm91cHMnKSB7XG4gICAgICAgICAgICB2YXIgZ3JvdXBzID0gW107XG4gICAgICAgICAgICBwYXJzZU51bWJlcihzdGF0ZSk7IC8vIGdyb3VwcyBjb3VudCwgdW51c2VkXG4gICAgICAgICAgICByZXMuVG90YWxHcm91cHNDb3VudCA9IHBhcnNlTnVtYmVyKHN0YXRlKTsgLy8gc3VtbWVkIGluIHN1YmFycmF5c1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgICAgICAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgICAgICAgICBwYXJzZUtleXdvcmQoc3RhdGUpOyAvLyBNYXRyaWNlc1xuICAgICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKHBhcnNlQXJyYXkoc3RhdGUpKTtcbiAgICAgICAgICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgICAgICAgICAgcmVzLkdyb3VwcyA9IGdyb3VwcztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnTWluaW11bUV4dGVudCcgfHwga2V5d29yZCA9PT0gJ01heGltdW1FeHRlbnQnKSB7XG4gICAgICAgICAgICB2YXIgYXJyID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlQXJyYXkoc3RhdGUsIGFyciwgMCk7XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnQm91bmRzUmFkaXVzJyB8fCBrZXl3b3JkID09PSAnTWF0ZXJpYWxJRCcgfHwga2V5d29yZCA9PT0gJ1NlbGVjdGlvbkdyb3VwJykge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0FuaW0nKSB7XG4gICAgICAgICAgICB2YXIgX2EgPSBwYXJzZU9iamVjdChzdGF0ZSksIHVudXNlZCA9IF9hWzBdLCBvYmogPSBfYVsxXTtcbiAgICAgICAgICAgIGlmIChvYmouQWxwaGEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG9iai5BbHBoYSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuQW5pbXMucHVzaChvYmopO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdVbnNlbGVjdGFibGUnKSB7XG4gICAgICAgICAgICByZXMuVW5zZWxlY3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLkdlb3NldHMucHVzaChyZXMpO1xufVxuZnVuY3Rpb24gcGFyc2VHZW9zZXRBbmltKHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciByZXMgPSB7XG4gICAgICAgIEdlb3NldElkOiAtMSxcbiAgICAgICAgQWxwaGE6IDEsXG4gICAgICAgIENvbG9yOiBudWxsLFxuICAgICAgICBGbGFnczogMFxuICAgIH07XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgdmFyIGlzU3RhdGljID0gZmFsc2U7XG4gICAgICAgIGlmICgha2V5d29yZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleXdvcmQgPT09ICdzdGF0aWMnKSB7XG4gICAgICAgICAgICBpc1N0YXRpYyA9IHRydWU7XG4gICAgICAgICAgICBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0FscGhhJykge1xuICAgICAgICAgICAgaWYgKGlzU3RhdGljKSB7XG4gICAgICAgICAgICAgICAgcmVzLkFscGhhID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzLkFscGhhID0gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdDb2xvcicpIHtcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xuICAgICAgICAgICAgICAgIHZhciBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgICAgICAgICAgcmVzLkNvbG9yID0gcGFyc2VBcnJheShzdGF0ZSwgYXJyYXksIDApO1xuICAgICAgICAgICAgICAgIHJlcy5Db2xvci5yZXZlcnNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMuQ29sb3IgPSBwYXJzZUFuaW1WZWN0b3Ioc3RhdGUsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHJlcy5Db2xvci5LZXlzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gX2FbX2ldO1xuICAgICAgICAgICAgICAgICAgICBrZXkuVmVjdG9yLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5JblRhbikge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5LkluVGFuLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleS5PdXRUYW4ucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdEcm9wU2hhZG93Jykge1xuICAgICAgICAgICAgcmVzLkZsYWdzIHw9IG1vZGVsXzEuR2Vvc2V0QW5pbUZsYWdzW2tleXdvcmRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5HZW9zZXRBbmltcy5wdXNoKHJlcyk7XG59XG5mdW5jdGlvbiBwYXJzZU5vZGUoc3RhdGUsIHR5cGUsIG1vZGVsKSB7XG4gICAgdmFyIG5hbWUgPSBwYXJzZVN0cmluZyhzdGF0ZSk7XG4gICAgdmFyIG5vZGUgPSB7XG4gICAgICAgIE5hbWU6IG5hbWUsXG4gICAgICAgIE9iamVjdElkOiBudWxsLFxuICAgICAgICBQYXJlbnQ6IG51bGwsXG4gICAgICAgIFBpdm90UG9pbnQ6IG51bGwsXG4gICAgICAgIEZsYWdzOiBtb2RlbF8xLk5vZGVUeXBlW3R5cGVdXG4gICAgfTtcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICBpZiAoIWtleXdvcmQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnVHJhbnNsYXRpb24nIHx8IGtleXdvcmQgPT09ICdSb3RhdGlvbicgfHwga2V5d29yZCA9PT0gJ1NjYWxpbmcnIHx8IGtleXdvcmQgPT09ICdWaXNpYmlsaXR5Jykge1xuICAgICAgICAgICAgdmFyIHZlY3RvclR5cGUgPSBBbmltVmVjdG9yVHlwZS5GTE9BVDM7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ1JvdGF0aW9uJykge1xuICAgICAgICAgICAgICAgIHZlY3RvclR5cGUgPSBBbmltVmVjdG9yVHlwZS5GTE9BVDQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnVmlzaWJpbGl0eScpIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JUeXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZVtrZXl3b3JkXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgdmVjdG9yVHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0JpbGxib2FyZGVkTG9ja1onIHx8IGtleXdvcmQgPT09ICdCaWxsYm9hcmRlZExvY2tZJyB8fCBrZXl3b3JkID09PSAnQmlsbGJvYXJkZWRMb2NrWCcgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdCaWxsYm9hcmRlZCcgfHwga2V5d29yZCA9PT0gJ0NhbWVyYUFuY2hvcmVkJykge1xuICAgICAgICAgICAgbm9kZS5GbGFncyB8PSBtb2RlbF8xLk5vZGVGbGFnc1trZXl3b3JkXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnRG9udEluaGVyaXQnKSB7XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICAgICAgICAgIHZhciB2YWwgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICAgICAgaWYgKHZhbCA9PT0gJ1RyYW5zbGF0aW9uJykge1xuICAgICAgICAgICAgICAgIG5vZGUuRmxhZ3MgfD0gbW9kZWxfMS5Ob2RlRmxhZ3MuRG9udEluaGVyaXRUcmFuc2xhdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA9PT0gJ1JvdGF0aW9uJykge1xuICAgICAgICAgICAgICAgIG5vZGUuRmxhZ3MgfD0gbW9kZWxfMS5Ob2RlRmxhZ3MuRG9udEluaGVyaXRSb3RhdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA9PT0gJ1NjYWxpbmcnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5GbGFncyB8PSBtb2RlbF8xLk5vZGVGbGFncy5Eb250SW5oZXJpdFNjYWxpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnUGF0aCcpIHtcbiAgICAgICAgICAgIG5vZGVba2V5d29yZF0gPSBwYXJzZVN0cmluZyhzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gcGFyc2VLZXl3b3JkKHN0YXRlKSB8fCBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0dlb3NldElkJyAmJiB2YWwgPT09ICdNdWx0aXBsZScgfHxcbiAgICAgICAgICAgICAgICBrZXl3b3JkID09PSAnR2Vvc2V0QW5pbUlkJyAmJiB2YWwgPT09ICdOb25lJykge1xuICAgICAgICAgICAgICAgIHZhbCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlW2tleXdvcmRdID0gdmFsO1xuICAgICAgICB9XG4gICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5Ob2Rlc1tub2RlLk9iamVjdElkXSA9IG5vZGU7XG4gICAgcmV0dXJuIG5vZGU7XG59XG5mdW5jdGlvbiBwYXJzZUJvbmUoc3RhdGUsIG1vZGVsKSB7XG4gICAgdmFyIG5vZGUgPSBwYXJzZU5vZGUoc3RhdGUsICdCb25lJywgbW9kZWwpO1xuICAgIG1vZGVsLkJvbmVzLnB1c2gobm9kZSk7XG59XG5mdW5jdGlvbiBwYXJzZUhlbHBlcihzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgbm9kZSA9IHBhcnNlTm9kZShzdGF0ZSwgJ0hlbHBlcicsIG1vZGVsKTtcbiAgICBtb2RlbC5IZWxwZXJzLnB1c2gobm9kZSk7XG59XG5mdW5jdGlvbiBwYXJzZUF0dGFjaG1lbnQoc3RhdGUsIG1vZGVsKSB7XG4gICAgdmFyIG5vZGUgPSBwYXJzZU5vZGUoc3RhdGUsICdBdHRhY2htZW50JywgbW9kZWwpO1xuICAgIG1vZGVsLkF0dGFjaG1lbnRzLnB1c2gobm9kZSk7XG59XG5mdW5jdGlvbiBwYXJzZVBpdm90UG9pbnRzKHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciBjb3VudCA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgIHJlcy5wdXNoKHBhcnNlQXJyYXkoc3RhdGUsIG5ldyBGbG9hdDMyQXJyYXkoMyksIDApKTtcbiAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLlBpdm90UG9pbnRzID0gcmVzO1xufVxuZnVuY3Rpb24gcGFyc2VFdmVudE9iamVjdChzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgbmFtZSA9IHBhcnNlU3RyaW5nKHN0YXRlKTtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBOYW1lOiBuYW1lLFxuICAgICAgICBPYmplY3RJZDogbnVsbCxcbiAgICAgICAgUGFyZW50OiBudWxsLFxuICAgICAgICBQaXZvdFBvaW50OiBudWxsLFxuICAgICAgICBFdmVudFRyYWNrOiBudWxsLFxuICAgICAgICBGbGFnczogbW9kZWxfMS5Ob2RlVHlwZS5FdmVudE9iamVjdFxuICAgIH07XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgaWYgKCFrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0V2ZW50VHJhY2snKSB7XG4gICAgICAgICAgICB2YXIgY291bnQgPSBwYXJzZU51bWJlcihzdGF0ZSk7IC8vIEV2ZW50VHJhY2sgY291bnRcbiAgICAgICAgICAgIHJlcy5FdmVudFRyYWNrID0gcGFyc2VBcnJheShzdGF0ZSwgbmV3IFVpbnQzMkFycmF5KGNvdW50KSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1RyYW5zbGF0aW9uJyB8fCBrZXl3b3JkID09PSAnUm90YXRpb24nIHx8IGtleXdvcmQgPT09ICdTY2FsaW5nJykge1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBrZXl3b3JkID09PSAnUm90YXRpb24nID8gQW5pbVZlY3RvclR5cGUuRkxPQVQ0IDogQW5pbVZlY3RvclR5cGUuRkxPQVQzO1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCB0eXBlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgbW9kZWwuRXZlbnRPYmplY3RzLnB1c2gocmVzKTtcbiAgICBtb2RlbC5Ob2Rlcy5wdXNoKHJlcyk7XG59XG5mdW5jdGlvbiBwYXJzZUNvbGxpc2lvblNoYXBlKHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciBuYW1lID0gcGFyc2VTdHJpbmcoc3RhdGUpO1xuICAgIHZhciByZXMgPSB7XG4gICAgICAgIE5hbWU6IG5hbWUsXG4gICAgICAgIE9iamVjdElkOiBudWxsLFxuICAgICAgICBQYXJlbnQ6IG51bGwsXG4gICAgICAgIFBpdm90UG9pbnQ6IG51bGwsXG4gICAgICAgIFNoYXBlOiBtb2RlbF8xLkNvbGxpc2lvblNoYXBlVHlwZS5Cb3gsXG4gICAgICAgIFZlcnRpY2VzOiBudWxsLFxuICAgICAgICBGbGFnczogbW9kZWxfMS5Ob2RlVHlwZS5Db2xsaXNpb25TaGFwZVxuICAgIH07XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgaWYgKCFrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ1NwaGVyZScpIHtcbiAgICAgICAgICAgIHJlcy5TaGFwZSA9IG1vZGVsXzEuQ29sbGlzaW9uU2hhcGVUeXBlLlNwaGVyZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnQm94Jykge1xuICAgICAgICAgICAgcmVzLlNoYXBlID0gbW9kZWxfMS5Db2xsaXNpb25TaGFwZVR5cGUuQm94O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdWZXJ0aWNlcycpIHtcbiAgICAgICAgICAgIHZhciBjb3VudCA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgICAgIHZhciB2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiAzKTtcbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VBcnJheShzdGF0ZSwgdmVydGljZXMsIGkgKiAzKTtcbiAgICAgICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgICAgICAgICAgcmVzLlZlcnRpY2VzID0gdmVydGljZXM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1RyYW5zbGF0aW9uJyB8fCBrZXl3b3JkID09PSAnUm90YXRpb24nIHx8IGtleXdvcmQgPT09ICdTY2FsaW5nJykge1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBrZXl3b3JkID09PSAnUm90YXRpb24nID8gQW5pbVZlY3RvclR5cGUuRkxPQVQ0IDogQW5pbVZlY3RvclR5cGUuRkxPQVQzO1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCB0eXBlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgbW9kZWwuQ29sbGlzaW9uU2hhcGVzLnB1c2gocmVzKTtcbiAgICBtb2RlbC5Ob2Rlcy5wdXNoKHJlcyk7XG59XG5mdW5jdGlvbiBwYXJzZUdsb2JhbFNlcXVlbmNlcyhzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgdmFyIGNvdW50ID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnRHVyYXRpb24nKSB7XG4gICAgICAgICAgICByZXMucHVzaChwYXJzZU51bWJlcihzdGF0ZSkpO1xuICAgICAgICB9XG4gICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5HbG9iYWxTZXF1ZW5jZXMgPSByZXM7XG59XG5mdW5jdGlvbiBwYXJzZVVua25vd25CbG9jayhzdGF0ZSkge1xuICAgIHZhciBvcGVuZWQ7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gdW5kZWZpbmVkICYmIHN0YXRlLmNoYXIoKSAhPT0gJ3snKSB7XG4gICAgICAgICsrc3RhdGUucG9zO1xuICAgIH1cbiAgICBvcGVuZWQgPSAxO1xuICAgICsrc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09IHVuZGVmaW5lZCAmJiBvcGVuZWQgPiAwKSB7XG4gICAgICAgIGlmIChzdGF0ZS5jaGFyKCkgPT09ICd7Jykge1xuICAgICAgICAgICAgKytvcGVuZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc3RhdGUuY2hhcigpID09PSAnfScpIHtcbiAgICAgICAgICAgIC0tb3BlbmVkO1xuICAgICAgICB9XG4gICAgICAgICsrc3RhdGUucG9zO1xuICAgIH1cbiAgICBwYXJzZVNwYWNlKHN0YXRlKTtcbn1cbmZ1bmN0aW9uIHBhcnNlUGFydGljbGVFbWl0dGVyKHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciByZXMgPSB7XG4gICAgICAgIE9iamVjdElkOiBudWxsLFxuICAgICAgICBQYXJlbnQ6IG51bGwsXG4gICAgICAgIE5hbWU6IG51bGwsXG4gICAgICAgIEZsYWdzOiAwXG4gICAgfTtcbiAgICByZXMuTmFtZSA9IHBhcnNlU3RyaW5nKHN0YXRlKTtcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICB2YXIgaXNTdGF0aWMgPSBmYWxzZTtcbiAgICAgICAgaWYgKCFrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICAgICAgIGlzU3RhdGljID0gdHJ1ZTtcbiAgICAgICAgICAgIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnT2JqZWN0SWQnIHx8IGtleXdvcmQgPT09ICdQYXJlbnQnKSB7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0VtaXR0ZXJVc2VzTURMJyB8fCBrZXl3b3JkID09PSAnRW1pdHRlclVzZXNUR0EnKSB7XG4gICAgICAgICAgICByZXMuRmxhZ3MgfD0gbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXJGbGFnc1trZXl3b3JkXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghaXNTdGF0aWMgJiYgKGtleXdvcmQgPT09ICdWaXNpYmlsaXR5JyB8fCBrZXl3b3JkID09PSAnVHJhbnNsYXRpb24nIHx8IGtleXdvcmQgPT09ICdSb3RhdGlvbicgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdTY2FsaW5nJyB8fCBrZXl3b3JkID09PSAnRW1pc3Npb25SYXRlJyB8fCBrZXl3b3JkID09PSAnR3Jhdml0eScgfHwga2V5d29yZCA9PT0gJ0xvbmdpdHVkZScgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdMYXRpdHVkZScpKSB7XG4gICAgICAgICAgICB2YXIgdHlwZSA9IEFuaW1WZWN0b3JUeXBlLkZMT0FUMztcbiAgICAgICAgICAgIGlmIChrZXl3b3JkID09PSAnVmlzaWJpbGl0eScgfHwga2V5d29yZCA9PT0gJ0VtaXNzaW9uUmF0ZScgfHwga2V5d29yZCA9PT0gJ0dyYXZpdHknIHx8XG4gICAgICAgICAgICAgICAga2V5d29yZCA9PT0gJ0xvbmdpdHVkZScgfHwga2V5d29yZCA9PT0gJ0xhdGl0dWRlJykge1xuICAgICAgICAgICAgICAgIHR5cGUgPSBBbmltVmVjdG9yVHlwZS5GTE9BVDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnUm90YXRpb24nKSB7XG4gICAgICAgICAgICAgICAgdHlwZSA9IEFuaW1WZWN0b3JUeXBlLkZMT0FUNDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgdHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1BhcnRpY2xlJykge1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgICAgICAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5d29yZDIgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICAgICAgICAgIHZhciBpc1N0YXRpYzIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAoa2V5d29yZDIgPT09ICdzdGF0aWMnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzU3RhdGljMiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGtleXdvcmQyID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFpc1N0YXRpYzIgJiYgKGtleXdvcmQyID09PSAnTGlmZVNwYW4nIHx8IGtleXdvcmQyID09PSAnSW5pdFZlbG9jaXR5JykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzW2tleXdvcmQyXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZDIgPT09ICdMaWZlU3BhbicgfHwga2V5d29yZDIgPT09ICdJbml0VmVsb2NpdHknKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc1trZXl3b3JkMl0gPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQyID09PSAnUGF0aCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLlBhdGggPSBwYXJzZVN0cmluZyhzdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLlBhcnRpY2xlRW1pdHRlcnMucHVzaChyZXMpO1xufVxuZnVuY3Rpb24gcGFyc2VQYXJ0aWNsZUVtaXR0ZXIyKHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciBuYW1lID0gcGFyc2VTdHJpbmcoc3RhdGUpO1xuICAgIHZhciByZXMgPSB7XG4gICAgICAgIE5hbWU6IG5hbWUsXG4gICAgICAgIE9iamVjdElkOiBudWxsLFxuICAgICAgICBQYXJlbnQ6IG51bGwsXG4gICAgICAgIFBpdm90UG9pbnQ6IG51bGwsXG4gICAgICAgIEZsYWdzOiBtb2RlbF8xLk5vZGVUeXBlLlBhcnRpY2xlRW1pdHRlcixcbiAgICAgICAgRnJhbWVGbGFnczogMFxuICAgIH07XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgdmFyIGlzU3RhdGljID0gZmFsc2U7XG4gICAgICAgIGlmICgha2V5d29yZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleXdvcmQgPT09ICdzdGF0aWMnKSB7XG4gICAgICAgICAgICBpc1N0YXRpYyA9IHRydWU7XG4gICAgICAgICAgICBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzU3RhdGljICYmIChrZXl3b3JkID09PSAnU3BlZWQnIHx8IGtleXdvcmQgPT09ICdMYXRpdHVkZScgfHwga2V5d29yZCA9PT0gJ1Zpc2liaWxpdHknIHx8XG4gICAgICAgICAgICBrZXl3b3JkID09PSAnRW1pc3Npb25SYXRlJyB8fCBrZXl3b3JkID09PSAnV2lkdGgnIHx8IGtleXdvcmQgPT09ICdMZW5ndGgnIHx8IGtleXdvcmQgPT09ICdUcmFuc2xhdGlvbicgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdSb3RhdGlvbicgfHwga2V5d29yZCA9PT0gJ1NjYWxpbmcnIHx8IGtleXdvcmQgPT09ICdHcmF2aXR5JyB8fCBrZXl3b3JkID09PSAnVmFyaWF0aW9uJykpIHtcbiAgICAgICAgICAgIHZhciB0eXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQzO1xuICAgICAgICAgICAgc3dpdGNoIChrZXl3b3JkKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnUm90YXRpb24nOlxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQ0O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdTcGVlZCc6XG4gICAgICAgICAgICAgICAgY2FzZSAnTGF0aXR1ZGUnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ1Zpc2liaWxpdHknOlxuICAgICAgICAgICAgICAgIGNhc2UgJ0VtaXNzaW9uUmF0ZSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnV2lkdGgnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ0xlbmd0aCc6XG4gICAgICAgICAgICAgICAgY2FzZSAnR3Jhdml0eSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnVmFyaWF0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IEFuaW1WZWN0b3JUeXBlLkZMT0FUMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZUFuaW1WZWN0b3Ioc3RhdGUsIHR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdWYXJpYXRpb24nIHx8IGtleXdvcmQgPT09ICdHcmF2aXR5Jykge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdTb3J0UHJpbXNGYXJaJyB8fCBrZXl3b3JkID09PSAnVW5zaGFkZWQnIHx8IGtleXdvcmQgPT09ICdMaW5lRW1pdHRlcicgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdVbmZvZ2dlZCcgfHwga2V5d29yZCA9PT0gJ01vZGVsU3BhY2UnIHx8IGtleXdvcmQgPT09ICdYWVF1YWQnKSB7XG4gICAgICAgICAgICByZXMuRmxhZ3MgfD0gbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRmxhZ3Nba2V5d29yZF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0JvdGgnKSB7XG4gICAgICAgICAgICByZXMuRnJhbWVGbGFncyB8PSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5IZWFkIHwgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MuVGFpbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnSGVhZCcgfHwga2V5d29yZCA9PT0gJ1RhaWwnKSB7XG4gICAgICAgICAgICByZXMuRnJhbWVGbGFncyB8PSBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFnc1trZXl3b3JkXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnU3F1aXJ0Jykge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnRG9udEluaGVyaXQnKSB7XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICAgICAgICAgIHZhciB2YWwgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICAgICAgaWYgKHZhbCA9PT0gJ1RyYW5zbGF0aW9uJykge1xuICAgICAgICAgICAgICAgIHJlcy5GbGFncyB8PSBtb2RlbF8xLk5vZGVGbGFncy5Eb250SW5oZXJpdFRyYW5zbGF0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmFsID09PSAnUm90YXRpb24nKSB7XG4gICAgICAgICAgICAgICAgcmVzLkZsYWdzIHw9IG1vZGVsXzEuTm9kZUZsYWdzLkRvbnRJbmhlcml0Um90YXRpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2YWwgPT09ICdTY2FsaW5nJykge1xuICAgICAgICAgICAgICAgIHJlcy5GbGFncyB8PSBtb2RlbF8xLk5vZGVGbGFncy5Eb250SW5oZXJpdFNjYWxpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnU2VnbWVudENvbG9yJykge1xuICAgICAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd7Jyk7XG4gICAgICAgICAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgICAgICAgICBwYXJzZUtleXdvcmQoc3RhdGUpOyAvLyBDb2xvclxuICAgICAgICAgICAgICAgIHZhciBjb2xvckFyciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgICAgICAgICAgcGFyc2VBcnJheShzdGF0ZSwgY29sb3JBcnIsIDApO1xuICAgICAgICAgICAgICAgIC8vIGJnciBvcmRlciwgaW52ZXJzZSBmcm9tIG1keFxuICAgICAgICAgICAgICAgIHZhciB0ZW1wID0gY29sb3JBcnJbMF07XG4gICAgICAgICAgICAgICAgY29sb3JBcnJbMF0gPSBjb2xvckFyclsyXTtcbiAgICAgICAgICAgICAgICBjb2xvckFyclsyXSA9IHRlbXA7XG4gICAgICAgICAgICAgICAgY29sb3JzLnB1c2goY29sb3JBcnIpO1xuICAgICAgICAgICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgICAgICAgICByZXMuU2VnbWVudENvbG9yID0gY29sb3JzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdBbHBoYScpIHtcbiAgICAgICAgICAgIHJlcy5BbHBoYSA9IG5ldyBVaW50OEFycmF5KDMpO1xuICAgICAgICAgICAgcGFyc2VBcnJheShzdGF0ZSwgcmVzLkFscGhhLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnUGFydGljbGVTY2FsaW5nJykge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgICAgIHBhcnNlQXJyYXkoc3RhdGUsIHJlc1trZXl3b3JkXSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0xpZmVTcGFuVVZBbmltJyB8fCBrZXl3b3JkID09PSAnRGVjYXlVVkFuaW0nIHx8IGtleXdvcmQgPT09ICdUYWlsVVZBbmltJyB8fFxuICAgICAgICAgICAga2V5d29yZCA9PT0gJ1RhaWxEZWNheVVWQW5pbScpIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IG5ldyBVaW50MzJBcnJheSgzKTtcbiAgICAgICAgICAgIHBhcnNlQXJyYXkoc3RhdGUsIHJlc1trZXl3b3JkXSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1RyYW5zcGFyZW50JyB8fCBrZXl3b3JkID09PSAnQmxlbmQnIHx8IGtleXdvcmQgPT09ICdBZGRpdGl2ZScgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdBbHBoYUtleScgfHwga2V5d29yZCA9PT0gJ01vZHVsYXRlJyB8fCBrZXl3b3JkID09PSAnTW9kdWxhdGUyeCcpIHtcbiAgICAgICAgICAgIHJlcy5GaWx0ZXJNb2RlID0gbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZVtrZXl3b3JkXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgbW9kZWwuUGFydGljbGVFbWl0dGVyczIucHVzaChyZXMpO1xuICAgIG1vZGVsLk5vZGVzLnB1c2gocmVzKTtcbn1cbmZ1bmN0aW9uIHBhcnNlQ2FtZXJhKHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciByZXMgPSB7XG4gICAgICAgIE5hbWU6IG51bGwsXG4gICAgICAgIFBvc2l0aW9uOiBudWxsLFxuICAgICAgICBGaWVsZE9mVmlldzogMCxcbiAgICAgICAgTmVhckNsaXA6IDAsXG4gICAgICAgIEZhckNsaXA6IDAsXG4gICAgICAgIFRhcmdldFBvc2l0aW9uOiBudWxsXG4gICAgfTtcbiAgICByZXMuTmFtZSA9IHBhcnNlU3RyaW5nKHN0YXRlKTtcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICBpZiAoIWtleXdvcmQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnUG9zaXRpb24nKSB7XG4gICAgICAgICAgICByZXMuUG9zaXRpb24gPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICAgICAgcGFyc2VBcnJheShzdGF0ZSwgcmVzLlBvc2l0aW9uLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnRmllbGRPZlZpZXcnIHx8IGtleXdvcmQgPT09ICdOZWFyQ2xpcCcgfHwga2V5d29yZCA9PT0gJ0ZhckNsaXAnKSB7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBwYXJzZU51bWJlcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ1RhcmdldCcpIHtcbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgICAgICAgICAgd2hpbGUgKHN0YXRlLmNoYXIoKSAhPT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleXdvcmQyID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgICAgICAgICBpZiAoa2V5d29yZDIgPT09ICdQb3NpdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLlRhcmdldFBvc2l0aW9uID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VBcnJheShzdGF0ZSwgcmVzLlRhcmdldFBvc2l0aW9uLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZDIgPT09ICdUcmFuc2xhdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLlRhcmdldFRyYW5zbGF0aW9uID0gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCBBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdUcmFuc2xhdGlvbicgfHwga2V5d29yZCA9PT0gJ1JvdGF0aW9uJykge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCBrZXl3b3JkID09PSAnUm90YXRpb24nID9cbiAgICAgICAgICAgICAgICBBbmltVmVjdG9yVHlwZS5GTE9BVDEgOlxuICAgICAgICAgICAgICAgIEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgIH1cbiAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLkNhbWVyYXMucHVzaChyZXMpO1xufVxuZnVuY3Rpb24gcGFyc2VMaWdodChzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgbmFtZSA9IHBhcnNlU3RyaW5nKHN0YXRlKTtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBOYW1lOiBuYW1lLFxuICAgICAgICBPYmplY3RJZDogbnVsbCxcbiAgICAgICAgUGFyZW50OiBudWxsLFxuICAgICAgICBQaXZvdFBvaW50OiBudWxsLFxuICAgICAgICBGbGFnczogbW9kZWxfMS5Ob2RlVHlwZS5MaWdodCxcbiAgICAgICAgTGlnaHRUeXBlOiAwXG4gICAgfTtcbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ3snKTtcbiAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICB2YXIgaXNTdGF0aWMgPSBmYWxzZTtcbiAgICAgICAgaWYgKCFrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICAgICAgIGlzU3RhdGljID0gdHJ1ZTtcbiAgICAgICAgICAgIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNTdGF0aWMgJiYgKGtleXdvcmQgPT09ICdWaXNpYmlsaXR5JyB8fCBrZXl3b3JkID09PSAnQ29sb3InIHx8IGtleXdvcmQgPT09ICdJbnRlbnNpdHknIHx8XG4gICAgICAgICAgICBrZXl3b3JkID09PSAnQW1iSW50ZW5zaXR5JyB8fCBrZXl3b3JkID09PSAnQW1iQ29sb3InIHx8IGtleXdvcmQgPT09ICdUcmFuc2xhdGlvbicgfHxcbiAgICAgICAgICAgIGtleXdvcmQgPT09ICdSb3RhdGlvbicgfHwga2V5d29yZCA9PT0gJ1NjYWxpbmcnIHx8IGtleXdvcmQgPT09ICdBdHRlbnVhdGlvblN0YXJ0JyB8fFxuICAgICAgICAgICAga2V5d29yZCA9PT0gJ0F0dGVudWF0aW9uRW5kJykpIHtcbiAgICAgICAgICAgIHZhciB0eXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQzO1xuICAgICAgICAgICAgc3dpdGNoIChrZXl3b3JkKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnUm90YXRpb24nOlxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQ0O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdWaXNpYmlsaXR5JzpcbiAgICAgICAgICAgICAgICBjYXNlICdJbnRlbnNpdHknOlxuICAgICAgICAgICAgICAgIGNhc2UgJ0FtYkludGVuc2l0eSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnQXR0ZW51YXRpb25TdGFydCc6XG4gICAgICAgICAgICAgICAgY2FzZSAnQXR0ZW51YXRpb25FbmQnOlxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgdHlwZSk7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0NvbG9yJyB8fCBrZXl3b3JkID09PSAnQW1iQ29sb3InKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHJlc1trZXl3b3JkXS5LZXlzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gX2FbX2ldO1xuICAgICAgICAgICAgICAgICAgICBrZXkuVmVjdG9yLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5JblRhbikge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5LkluVGFuLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleS5PdXRUYW4ucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdPbW5pZGlyZWN0aW9uYWwnIHx8IGtleXdvcmQgPT09ICdEaXJlY3Rpb25hbCcgfHwga2V5d29yZCA9PT0gJ0FtYmllbnQnKSB7XG4gICAgICAgICAgICByZXMuTGlnaHRUeXBlID0gbW9kZWxfMS5MaWdodFR5cGVba2V5d29yZF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0NvbG9yJyB8fCBrZXl3b3JkID09PSAnQW1iQ29sb3InKSB7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICAgICAgcGFyc2VBcnJheShzdGF0ZSwgY29sb3IsIDApO1xuICAgICAgICAgICAgLy8gYmdyIG9yZGVyLCBpbnZlcnNlIGZyb20gbWR4XG4gICAgICAgICAgICB2YXIgdGVtcCA9IGNvbG9yWzBdO1xuICAgICAgICAgICAgY29sb3JbMF0gPSBjb2xvclsyXTtcbiAgICAgICAgICAgIGNvbG9yWzJdID0gdGVtcDtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IGNvbG9yO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzW2tleXdvcmRdID0gcGFyc2VOdW1iZXIoc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIHBhcnNlU3ltYm9sKHN0YXRlLCAnLCcpO1xuICAgIH1cbiAgICBzdHJpY3RQYXJzZVN5bWJvbChzdGF0ZSwgJ30nKTtcbiAgICBtb2RlbC5MaWdodHMucHVzaChyZXMpO1xuICAgIG1vZGVsLk5vZGVzLnB1c2gocmVzKTtcbn1cbmZ1bmN0aW9uIHBhcnNlVGV4dHVyZUFuaW1zKHN0YXRlLCBtb2RlbCkge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBwYXJzZU51bWJlcihzdGF0ZSk7IC8vIGNvdW50LCBub3QgdXNlZFxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICB2YXIgb2JqID0ge307XG4gICAgICAgIHBhcnNlS2V5d29yZChzdGF0ZSk7IC8vIFRWZXJ0ZXhBbmltXG4gICAgICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgICAgICB3aGlsZSAoc3RhdGUuY2hhcigpICE9PSAnfScpIHtcbiAgICAgICAgICAgIHZhciBrZXl3b3JkID0gcGFyc2VLZXl3b3JkKHN0YXRlKTtcbiAgICAgICAgICAgIGlmICgha2V5d29yZCkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGtleXdvcmQgPT09ICdUcmFuc2xhdGlvbicgfHwga2V5d29yZCA9PT0gJ1JvdGF0aW9uJyB8fCBrZXl3b3JkID09PSAnU2NhbGluZycpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IGtleXdvcmQgPT09ICdSb3RhdGlvbicgPyBBbmltVmVjdG9yVHlwZS5GTE9BVDQgOiBBbmltVmVjdG9yVHlwZS5GTE9BVDM7XG4gICAgICAgICAgICAgICAgb2JqW2tleXdvcmRdID0gcGFyc2VBbmltVmVjdG9yKHN0YXRlLCB0eXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biB0ZXh0dXJlIGFuaW0gcHJvcGVydHkgJyArIGtleXdvcmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFyc2VTeW1ib2woc3RhdGUsICcsJyk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgICAgIHJlcy5wdXNoKG9iaik7XG4gICAgfVxuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAnfScpO1xuICAgIG1vZGVsLlRleHR1cmVBbmltcyA9IHJlcztcbn1cbmZ1bmN0aW9uIHBhcnNlUmliYm9uRW1pdHRlcihzdGF0ZSwgbW9kZWwpIHtcbiAgICB2YXIgbmFtZSA9IHBhcnNlU3RyaW5nKHN0YXRlKTtcbiAgICB2YXIgcmVzID0ge1xuICAgICAgICBOYW1lOiBuYW1lLFxuICAgICAgICBPYmplY3RJZDogbnVsbCxcbiAgICAgICAgUGFyZW50OiBudWxsLFxuICAgICAgICBQaXZvdFBvaW50OiBudWxsLFxuICAgICAgICBGbGFnczogbW9kZWxfMS5Ob2RlVHlwZS5SaWJib25FbWl0dGVyLFxuICAgICAgICBIZWlnaHRBYm92ZTogbnVsbCxcbiAgICAgICAgSGVpZ2h0QmVsb3c6IG51bGwsXG4gICAgICAgIEFscGhhOiBudWxsLFxuICAgICAgICBDb2xvcjogbnVsbCxcbiAgICAgICAgTGlmZVNwYW46IG51bGwsXG4gICAgICAgIFRleHR1cmVTbG90OiBudWxsLFxuICAgICAgICBFbWlzc2lvblJhdGU6IG51bGwsXG4gICAgICAgIFJvd3M6IG51bGwsXG4gICAgICAgIENvbHVtbnM6IG51bGwsXG4gICAgICAgIE1hdGVyaWFsSUQ6IG51bGwsXG4gICAgICAgIEdyYXZpdHk6IG51bGwsXG4gICAgICAgIFZpc2liaWxpdHk6IG51bGxcbiAgICB9O1xuICAgIHN0cmljdFBhcnNlU3ltYm9sKHN0YXRlLCAneycpO1xuICAgIHdoaWxlIChzdGF0ZS5jaGFyKCkgIT09ICd9Jykge1xuICAgICAgICB2YXIga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIHZhciBpc1N0YXRpYyA9IGZhbHNlO1xuICAgICAgICBpZiAoIWtleXdvcmQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXl3b3JkID09PSAnc3RhdGljJykge1xuICAgICAgICAgICAgaXNTdGF0aWMgPSB0cnVlO1xuICAgICAgICAgICAga2V5d29yZCA9IHBhcnNlS2V5d29yZChzdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1N0YXRpYyAmJiAoa2V5d29yZCA9PT0gJ1Zpc2liaWxpdHknIHx8IGtleXdvcmQgPT09ICdIZWlnaHRBYm92ZScgfHwga2V5d29yZCA9PT0gJ0hlaWdodEJlbG93JyB8fFxuICAgICAgICAgICAga2V5d29yZCA9PT0gJ1RyYW5zbGF0aW9uJyB8fCBrZXl3b3JkID09PSAnUm90YXRpb24nIHx8IGtleXdvcmQgPT09ICdTY2FsaW5nJyB8fCBrZXl3b3JkID09PSAnQWxwaGEnIHx8XG4gICAgICAgICAgICBrZXl3b3JkID09PSAnVGV4dHVyZVNsb3QnKSkge1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBBbmltVmVjdG9yVHlwZS5GTE9BVDM7XG4gICAgICAgICAgICBzd2l0Y2ggKGtleXdvcmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdSb3RhdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBBbmltVmVjdG9yVHlwZS5GTE9BVDQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1Zpc2liaWxpdHknOlxuICAgICAgICAgICAgICAgIGNhc2UgJ0hlaWdodEFib3ZlJzpcbiAgICAgICAgICAgICAgICBjYXNlICdIZWlnaHRCZWxvdyc6XG4gICAgICAgICAgICAgICAgY2FzZSAnQWxwaGEnOlxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gQW5pbVZlY3RvclR5cGUuRkxPQVQxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdUZXh0dXJlU2xvdCc6XG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBBbmltVmVjdG9yVHlwZS5JTlQxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlQW5pbVZlY3RvcihzdGF0ZSwgdHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0NvbG9yJykge1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgICAgIHBhcnNlQXJyYXkoc3RhdGUsIGNvbG9yLCAwKTtcbiAgICAgICAgICAgIC8vIGJnciBvcmRlciwgaW52ZXJzZSBmcm9tIG1keFxuICAgICAgICAgICAgdmFyIHRlbXAgPSBjb2xvclswXTtcbiAgICAgICAgICAgIGNvbG9yWzBdID0gY29sb3JbMl07XG4gICAgICAgICAgICBjb2xvclsyXSA9IHRlbXA7XG4gICAgICAgICAgICByZXNba2V5d29yZF0gPSBjb2xvcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc1trZXl3b3JkXSA9IHBhcnNlTnVtYmVyKHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBwYXJzZVN5bWJvbChzdGF0ZSwgJywnKTtcbiAgICB9XG4gICAgc3RyaWN0UGFyc2VTeW1ib2woc3RhdGUsICd9Jyk7XG4gICAgbW9kZWwuUmliYm9uRW1pdHRlcnMucHVzaChyZXMpO1xuICAgIG1vZGVsLk5vZGVzLnB1c2gocmVzKTtcbn1cbnZhciBwYXJzZXJzID0ge1xuICAgIFZlcnNpb246IHBhcnNlVmVyc2lvbixcbiAgICBNb2RlbDogcGFyc2VNb2RlbEluZm8sXG4gICAgU2VxdWVuY2VzOiBwYXJzZVNlcXVlbmNlcyxcbiAgICBUZXh0dXJlczogcGFyc2VUZXh0dXJlcyxcbiAgICBNYXRlcmlhbHM6IHBhcnNlTWF0ZXJpYWxzLFxuICAgIEdlb3NldDogcGFyc2VHZW9zZXQsXG4gICAgR2Vvc2V0QW5pbTogcGFyc2VHZW9zZXRBbmltLFxuICAgIEJvbmU6IHBhcnNlQm9uZSxcbiAgICBIZWxwZXI6IHBhcnNlSGVscGVyLFxuICAgIEF0dGFjaG1lbnQ6IHBhcnNlQXR0YWNobWVudCxcbiAgICBQaXZvdFBvaW50czogcGFyc2VQaXZvdFBvaW50cyxcbiAgICBFdmVudE9iamVjdDogcGFyc2VFdmVudE9iamVjdCxcbiAgICBDb2xsaXNpb25TaGFwZTogcGFyc2VDb2xsaXNpb25TaGFwZSxcbiAgICBHbG9iYWxTZXF1ZW5jZXM6IHBhcnNlR2xvYmFsU2VxdWVuY2VzLFxuICAgIFBhcnRpY2xlRW1pdHRlcjogcGFyc2VQYXJ0aWNsZUVtaXR0ZXIsXG4gICAgUGFydGljbGVFbWl0dGVyMjogcGFyc2VQYXJ0aWNsZUVtaXR0ZXIyLFxuICAgIENhbWVyYTogcGFyc2VDYW1lcmEsXG4gICAgTGlnaHQ6IHBhcnNlTGlnaHQsXG4gICAgVGV4dHVyZUFuaW1zOiBwYXJzZVRleHR1cmVBbmltcyxcbiAgICBSaWJib25FbWl0dGVyOiBwYXJzZVJpYmJvbkVtaXR0ZXJcbn07XG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgICB2YXIgc3RhdGUgPSBuZXcgU3RhdGUoc3RyKTtcbiAgICB2YXIgbW9kZWwgPSB7XG4gICAgICAgIC8vIGRlZmF1bHRcbiAgICAgICAgVmVyc2lvbjogODAwLFxuICAgICAgICBJbmZvOiB7XG4gICAgICAgICAgICBOYW1lOiAnJyxcbiAgICAgICAgICAgIE1pbmltdW1FeHRlbnQ6IG51bGwsXG4gICAgICAgICAgICBNYXhpbXVtRXh0ZW50OiBudWxsLFxuICAgICAgICAgICAgQm91bmRzUmFkaXVzOiAwLFxuICAgICAgICAgICAgQmxlbmRUaW1lOiAxNTBcbiAgICAgICAgfSxcbiAgICAgICAgU2VxdWVuY2VzOiBbXSxcbiAgICAgICAgR2xvYmFsU2VxdWVuY2VzOiBbXSxcbiAgICAgICAgVGV4dHVyZXM6IFtdLFxuICAgICAgICBNYXRlcmlhbHM6IFtdLFxuICAgICAgICBUZXh0dXJlQW5pbXM6IFtdLFxuICAgICAgICBHZW9zZXRzOiBbXSxcbiAgICAgICAgR2Vvc2V0QW5pbXM6IFtdLFxuICAgICAgICBCb25lczogW10sXG4gICAgICAgIEhlbHBlcnM6IFtdLFxuICAgICAgICBBdHRhY2htZW50czogW10sXG4gICAgICAgIEV2ZW50T2JqZWN0czogW10sXG4gICAgICAgIFBhcnRpY2xlRW1pdHRlcnM6IFtdLFxuICAgICAgICBQYXJ0aWNsZUVtaXR0ZXJzMjogW10sXG4gICAgICAgIENhbWVyYXM6IFtdLFxuICAgICAgICBMaWdodHM6IFtdLFxuICAgICAgICBSaWJib25FbWl0dGVyczogW10sXG4gICAgICAgIENvbGxpc2lvblNoYXBlczogW10sXG4gICAgICAgIFBpdm90UG9pbnRzOiBbXSxcbiAgICAgICAgTm9kZXM6IFtdXG4gICAgfTtcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhdGUuc3RyLmxlbmd0aCkge1xuICAgICAgICB3aGlsZSAocGFyc2VDb21tZW50KHN0YXRlKSlcbiAgICAgICAgICAgIDtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBwYXJzZUtleXdvcmQoc3RhdGUpO1xuICAgICAgICBpZiAoa2V5d29yZCkge1xuICAgICAgICAgICAgaWYgKGtleXdvcmQgaW4gcGFyc2Vycykge1xuICAgICAgICAgICAgICAgIHBhcnNlcnNba2V5d29yZF0oc3RhdGUsIG1vZGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcnNlVW5rbm93bkJsb2NrKHN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9kZWwuTm9kZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKG1vZGVsLlBpdm90UG9pbnRzW2ldKSB7XG4gICAgICAgICAgICBtb2RlbC5Ob2Rlc1tpXS5QaXZvdFBvaW50ID0gbW9kZWwuUGl2b3RQb2ludHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1vZGVsO1xufVxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlO1xudmFyIF9hO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGFyc2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbW9kZWxfMSA9IHJlcXVpcmUoXCIuLi9tb2RlbFwiKTtcbnZhciBCSUdfRU5ESUFOID0gdHJ1ZTtcbnZhciBOT05FID0gLTE7XG52YXIgU3RyZWFtID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdHJlYW0oYXJyYXlCdWZmZXIpIHtcbiAgICAgICAgdGhpcy5hYiA9IGFycmF5QnVmZmVyO1xuICAgICAgICB0aGlzLnVpbnQgPSBuZXcgVWludDhBcnJheSh0aGlzLmFiKTtcbiAgICAgICAgdGhpcy52aWV3ID0gbmV3IERhdGFWaWV3KHRoaXMuYWIpO1xuICAgICAgICB0aGlzLnBvcyA9IDA7XG4gICAgfVxuICAgIFN0cmVhbS5wcm90b3R5cGUua2V5d29yZCA9IGZ1bmN0aW9uIChrZXl3b3JkKSB7XG4gICAgICAgIHRoaXMudWludFt0aGlzLnBvc10gPSBrZXl3b3JkLmNoYXJDb2RlQXQoMCk7XG4gICAgICAgIHRoaXMudWludFt0aGlzLnBvcyArIDFdID0ga2V5d29yZC5jaGFyQ29kZUF0KDEpO1xuICAgICAgICB0aGlzLnVpbnRbdGhpcy5wb3MgKyAyXSA9IGtleXdvcmQuY2hhckNvZGVBdCgyKTtcbiAgICAgICAgdGhpcy51aW50W3RoaXMucG9zICsgM10gPSBrZXl3b3JkLmNoYXJDb2RlQXQoMyk7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLnVpbnQ4ID0gZnVuY3Rpb24gKG51bSkge1xuICAgICAgICB0aGlzLnZpZXcuc2V0VWludDgodGhpcy5wb3MsIG51bSk7XG4gICAgICAgIHRoaXMucG9zICs9IDE7XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLnVpbnQxNiA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICAgICAgdGhpcy52aWV3LnNldFVpbnQxNih0aGlzLnBvcywgbnVtLCBCSUdfRU5ESUFOKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gMjtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuaW50MzIgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgIHRoaXMudmlldy5zZXRJbnQzMih0aGlzLnBvcywgbnVtLCBCSUdfRU5ESUFOKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gNDtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUudWludDMyID0gZnVuY3Rpb24gKG51bSkge1xuICAgICAgICB0aGlzLnZpZXcuc2V0VWludDMyKHRoaXMucG9zLCBudW0sIEJJR19FTkRJQU4pO1xuICAgICAgICB0aGlzLnBvcyArPSA0O1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5mbG9hdDMyID0gZnVuY3Rpb24gKG51bSkge1xuICAgICAgICB0aGlzLnZpZXcuc2V0RmxvYXQzMih0aGlzLnBvcywgbnVtLCBCSUdfRU5ESUFOKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gNDtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuZmxvYXQzMkFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdGhpcy5mbG9hdDMyKGFycltpXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUudWludDhBcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMudWludDgoYXJyW2ldKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS51aW50MTZBcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMudWludDE2KGFycltpXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuaW50MzJBcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMuaW50MzIoYXJyW2ldKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS51aW50MzJBcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMudWludDMyKGFycltpXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuc3RyID0gZnVuY3Rpb24gKHN0ciwgbGVuKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2ksICsrdGhpcy5wb3MpIHtcbiAgICAgICAgICAgIHRoaXMudWludFt0aGlzLnBvc10gPSBpIDwgc3RyLmxlbmd0aCA/IHN0ci5jaGFyQ29kZUF0KGkpIDogMDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5hbmltVmVjdG9yID0gZnVuY3Rpb24gKGFuaW1WZWN0b3IsIHR5cGUpIHtcbiAgICAgICAgdmFyIGlzSW50ID0gdHlwZSA9PT0gQW5pbVZlY3RvclR5cGUuSU5UMTtcbiAgICAgICAgdGhpcy5pbnQzMihhbmltVmVjdG9yLktleXMubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5pbnQzMihhbmltVmVjdG9yLkxpbmVUeXBlKTtcbiAgICAgICAgdGhpcy5pbnQzMihhbmltVmVjdG9yLkdsb2JhbFNlcUlkICE9PSBudWxsID8gYW5pbVZlY3Rvci5HbG9iYWxTZXFJZCA6IE5PTkUpO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gYW5pbVZlY3Rvci5LZXlzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIGtleUZyYW1lID0gX2FbX2ldO1xuICAgICAgICAgICAgdGhpcy5pbnQzMihrZXlGcmFtZS5GcmFtZSk7XG4gICAgICAgICAgICBpZiAoaXNJbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludDMyQXJyYXkoa2V5RnJhbWUuVmVjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZmxvYXQzMkFycmF5KGtleUZyYW1lLlZlY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYW5pbVZlY3Rvci5MaW5lVHlwZSA9PT0gbW9kZWxfMS5MaW5lVHlwZS5IZXJtaXRlIHx8IGFuaW1WZWN0b3IuTGluZVR5cGUgPT09IG1vZGVsXzEuTGluZVR5cGUuQmV6aWVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzSW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50MzJBcnJheShrZXlGcmFtZS5JblRhbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50MzJBcnJheShrZXlGcmFtZS5PdXRUYW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mbG9hdDMyQXJyYXkoa2V5RnJhbWUuSW5UYW4pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZsb2F0MzJBcnJheShrZXlGcmFtZS5PdXRUYW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIFN0cmVhbTtcbn0oKSk7XG5mdW5jdGlvbiBnZW5lcmF0ZUV4dGVudChvYmosIHN0cmVhbSkge1xuICAgIHN0cmVhbS5mbG9hdDMyKG9iai5Cb3VuZHNSYWRpdXMgfHwgMCk7XG4gICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IFsnTWluaW11bUV4dGVudCcsICdNYXhpbXVtRXh0ZW50J107IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBfYVtfaV07XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyQXJyYXkob2JqW2tleV0pO1xuICAgIH1cbn1cbnZhciBBbmltVmVjdG9yVHlwZTtcbihmdW5jdGlvbiAoQW5pbVZlY3RvclR5cGUpIHtcbiAgICBBbmltVmVjdG9yVHlwZVtBbmltVmVjdG9yVHlwZVtcIklOVDFcIl0gPSAwXSA9IFwiSU5UMVwiO1xuICAgIEFuaW1WZWN0b3JUeXBlW0FuaW1WZWN0b3JUeXBlW1wiRkxPQVQxXCJdID0gMV0gPSBcIkZMT0FUMVwiO1xuICAgIEFuaW1WZWN0b3JUeXBlW0FuaW1WZWN0b3JUeXBlW1wiRkxPQVQzXCJdID0gMl0gPSBcIkZMT0FUM1wiO1xuICAgIEFuaW1WZWN0b3JUeXBlW0FuaW1WZWN0b3JUeXBlW1wiRkxPQVQ0XCJdID0gM10gPSBcIkZMT0FUNFwiO1xufSkoQW5pbVZlY3RvclR5cGUgfHwgKEFuaW1WZWN0b3JUeXBlID0ge30pKTtcbnZhciBhbmltVmVjdG9yU2l6ZSA9IChfYSA9IHt9LFxuICAgIF9hW0FuaW1WZWN0b3JUeXBlLklOVDFdID0gMSxcbiAgICBfYVtBbmltVmVjdG9yVHlwZS5GTE9BVDFdID0gMSxcbiAgICBfYVtBbmltVmVjdG9yVHlwZS5GTE9BVDNdID0gMyxcbiAgICBfYVtBbmltVmVjdG9yVHlwZS5GTE9BVDRdID0gNCxcbiAgICBfYSk7XG5mdW5jdGlvbiBieXRlTGVuZ3RoQW5pbVZlY3RvcihhbmltVmVjdG9yLCB0eXBlKSB7XG4gICAgcmV0dXJuIDQgLyoga2V5IGNvdW50ICovICtcbiAgICAgICAgNCAvKiBMaW5lVHlwZSAqLyArXG4gICAgICAgIDQgLyogR2xvYmFsU2VxSWQgKi8gK1xuICAgICAgICBhbmltVmVjdG9yLktleXMubGVuZ3RoICogKDQgLyogZnJhbWUgKi8gK1xuICAgICAgICAgICAgNCAqIGFuaW1WZWN0b3JTaXplW3R5cGVdICpcbiAgICAgICAgICAgICAgICAoYW5pbVZlY3Rvci5MaW5lVHlwZSA9PT0gbW9kZWxfMS5MaW5lVHlwZS5IZXJtaXRlIHx8IGFuaW1WZWN0b3IuTGluZVR5cGUgPT09IG1vZGVsXzEuTGluZVR5cGUuQmV6aWVyID8gMyA6IDEpKTtcbn1cbmZ1bmN0aW9uIHN1bShhcnIpIHtcbiAgICByZXR1cm4gYXJyLnJlZHVjZShmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gYSArIGI7XG4gICAgfSwgMCk7XG59XG5mdW5jdGlvbiBieXRlTGVuZ3RoVmVyc2lvbigpIHtcbiAgICByZXR1cm4gNCAvKiBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBzaXplICovICtcbiAgICAgICAgNCAvKiB2ZXJzaW9uICovO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVWZXJzaW9uKG1vZGVsLCBzdHJlYW0pIHtcbiAgICBzdHJlYW0ua2V5d29yZCgnVkVSUycpO1xuICAgIHN0cmVhbS5pbnQzMig0KTtcbiAgICBzdHJlYW0uaW50MzIobW9kZWwuVmVyc2lvbik7XG59XG52YXIgTU9ERUxfTkFNRV9MRU5HVEggPSAweDE1MDtcbmZ1bmN0aW9uIGJ5dGVMZW5ndGhNb2RlbEluZm8oKSB7XG4gICAgcmV0dXJuIDQgLyoga2V5d29yZCAqLyArXG4gICAgICAgIDQgLyogc2l6ZSAqLyArXG4gICAgICAgIE1PREVMX05BTUVfTEVOR1RIICtcbiAgICAgICAgNCAvKiA0LWJ5dGUgemVybyA/ICovICtcbiAgICAgICAgNCAqIDcgLyogZXh0ZW50ICovICtcbiAgICAgICAgNDsgLyogYmxlbmQgdGltZSAqL1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVNb2RlbEluZm8obW9kZWwsIHN0cmVhbSkge1xuICAgIHN0cmVhbS5rZXl3b3JkKCdNT0RMJyk7XG4gICAgc3RyZWFtLmludDMyKGJ5dGVMZW5ndGhNb2RlbEluZm8oKSAtIDgpO1xuICAgIHN0cmVhbS5zdHIobW9kZWwuSW5mby5OYW1lLCBNT0RFTF9OQU1FX0xFTkdUSCk7XG4gICAgc3RyZWFtLmludDMyKDApO1xuICAgIGdlbmVyYXRlRXh0ZW50KG1vZGVsLkluZm8sIHN0cmVhbSk7XG4gICAgc3RyZWFtLmludDMyKG1vZGVsLkluZm8uQmxlbmRUaW1lKTtcbn1cbnZhciBNT0RFTF9TRVFVRU5DRV9OQU1FX0xFTkdUSCA9IDB4NTA7XG5mdW5jdGlvbiBieXRlTGVuZ3RoU2VxdWVuY2UoKSB7XG4gICAgcmV0dXJuIE1PREVMX1NFUVVFTkNFX05BTUVfTEVOR1RIICtcbiAgICAgICAgNCAqIDIgLyogaW50ZXJ2YWwgKi8gK1xuICAgICAgICA0IC8qIE1vdmVTcGVlZCAqLyArXG4gICAgICAgIDQgLyogTm9uTG9vcGluZyAqLyArXG4gICAgICAgIDQgLyogUmFyaXR5ICovICtcbiAgICAgICAgNCArXG4gICAgICAgIDQgKiA3OyAvKiBleHRlbnQgKi9cbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhTZXF1ZW5jZXMobW9kZWwpIHtcbiAgICBpZiAoIW1vZGVsLlNlcXVlbmNlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiA0IC8qIGtleXdvcmQgKi8gK1xuICAgICAgICA0IC8qIHNpemUgKi8gK1xuICAgICAgICBzdW0obW9kZWwuU2VxdWVuY2VzLm1hcChieXRlTGVuZ3RoU2VxdWVuY2UpKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlU2VxdWVuY2VzKG1vZGVsLCBzdHJlYW0pIHtcbiAgICBpZiAoIW1vZGVsLlNlcXVlbmNlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdHJlYW0ua2V5d29yZCgnU0VRUycpO1xuICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoU2VxdWVuY2VzKG1vZGVsKSAtIDgpO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5TZXF1ZW5jZXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBzZXF1ZW5jZSA9IF9hW19pXTtcbiAgICAgICAgc3RyZWFtLnN0cihzZXF1ZW5jZS5OYW1lLCBNT0RFTF9TRVFVRU5DRV9OQU1FX0xFTkdUSCk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihzZXF1ZW5jZS5JbnRlcnZhbFswXSk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihzZXF1ZW5jZS5JbnRlcnZhbFsxXSk7XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKHNlcXVlbmNlLk1vdmVTcGVlZCk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihzZXF1ZW5jZS5Ob25Mb29waW5nID8gMSA6IDApO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMihzZXF1ZW5jZS5SYXJpdHkpO1xuICAgICAgICBzdHJlYW0uaW50MzIoMCk7XG4gICAgICAgIGdlbmVyYXRlRXh0ZW50KHNlcXVlbmNlLCBzdHJlYW0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhHbG9iYWxTZXF1ZW5jZXMobW9kZWwpIHtcbiAgICBpZiAoIW1vZGVsLkdsb2JhbFNlcXVlbmNlcyB8fCAhbW9kZWwuR2xvYmFsU2VxdWVuY2VzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIDQgLyoga2V5d29yZCAqLyArXG4gICAgICAgIDQgLyogc2l6ZSAqLyArXG4gICAgICAgIDQgKiBtb2RlbC5HbG9iYWxTZXF1ZW5jZXMubGVuZ3RoO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVHbG9iYWxTZXF1ZW5jZXMobW9kZWwsIHN0cmVhbSkge1xuICAgIGlmICghbW9kZWwuR2xvYmFsU2VxdWVuY2VzIHx8ICFtb2RlbC5HbG9iYWxTZXF1ZW5jZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3RyZWFtLmtleXdvcmQoJ0dMQlMnKTtcbiAgICBzdHJlYW0uaW50MzIobW9kZWwuR2xvYmFsU2VxdWVuY2VzLmxlbmd0aCAqIDQpO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5HbG9iYWxTZXF1ZW5jZXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBkdXJhdGlvbiA9IF9hW19pXTtcbiAgICAgICAgc3RyZWFtLmludDMyKGR1cmF0aW9uKTtcbiAgICB9XG59XG5mdW5jdGlvbiBieXRlTGVuZ3RoTGF5ZXIobGF5ZXIpIHtcbiAgICByZXR1cm4gNCAvKiBzaXplICovICtcbiAgICAgICAgNCAvKiBGaWx0ZXJNb2RlICovICtcbiAgICAgICAgNCAvKiBTaGFkaW5nICovICtcbiAgICAgICAgNCAvKiBzdGF0aWMgVGV4dHVyZUlEICovICtcbiAgICAgICAgNCAvKiBUVmVydGV4QW5pbUlkICovICtcbiAgICAgICAgNCArXG4gICAgICAgIDQgLyogc3RhdGljIEFscGhhICovICtcbiAgICAgICAgKGxheWVyLkFscGhhICE9PSBudWxsICYmIHR5cGVvZiBsYXllci5BbHBoYSAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IobGF5ZXIuQWxwaGEsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSkgOlxuICAgICAgICAgICAgMCkgK1xuICAgICAgICAobGF5ZXIuVGV4dHVyZUlEICE9PSBudWxsICYmIHR5cGVvZiBsYXllci5UZXh0dXJlSUQgIT09ICdudW1iZXInID9cbiAgICAgICAgICAgIDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGxheWVyLlRleHR1cmVJRCwgQW5pbVZlY3RvclR5cGUuSU5UMSkgOlxuICAgICAgICAgICAgMCk7XG59XG5mdW5jdGlvbiBieXRlTGVuZ3RoTWF0ZXJpYWwobWF0ZXJpYWwpIHtcbiAgICByZXR1cm4gNCAvKiBzaXplICovICtcbiAgICAgICAgNCAvKiBQcmlvcml0eVBsYW5lICovICtcbiAgICAgICAgNCAvKiBSZW5kZXJNb2RlICovICtcbiAgICAgICAgNCAvKiBMQVlTIGtleXdvcmQgKi8gK1xuICAgICAgICA0IC8qIGxheWVyIGNvdW50ICovICtcbiAgICAgICAgc3VtKG1hdGVyaWFsLkxheWVycy5tYXAoZnVuY3Rpb24gKGxheWVyKSB7IHJldHVybiBieXRlTGVuZ3RoTGF5ZXIobGF5ZXIpOyB9KSk7XG59XG5mdW5jdGlvbiBieXRlTGVuZ3RoTWF0ZXJpYWxzKG1vZGVsKSB7XG4gICAgaWYgKCFtb2RlbC5NYXRlcmlhbHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gNCAvKiBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBzaXplICovICtcbiAgICAgICAgc3VtKG1vZGVsLk1hdGVyaWFscy5tYXAoZnVuY3Rpb24gKG1hdGVyaWFsKSB7IHJldHVybiBieXRlTGVuZ3RoTWF0ZXJpYWwobWF0ZXJpYWwpOyB9KSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZU1hdGVyaWFscyhtb2RlbCwgc3RyZWFtKSB7XG4gICAgaWYgKCFtb2RlbC5NYXRlcmlhbHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3RyZWFtLmtleXdvcmQoJ01UTFMnKTtcbiAgICBzdHJlYW0uaW50MzIoYnl0ZUxlbmd0aE1hdGVyaWFscyhtb2RlbCkgLSA4KTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gbW9kZWwuTWF0ZXJpYWxzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgbWF0ZXJpYWwgPSBfYVtfaV07XG4gICAgICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoTWF0ZXJpYWwobWF0ZXJpYWwpKTtcbiAgICAgICAgc3RyZWFtLmludDMyKG1hdGVyaWFsLlByaW9yaXR5UGxhbmUpO1xuICAgICAgICBzdHJlYW0uaW50MzIobWF0ZXJpYWwuUmVuZGVyTW9kZSk7XG4gICAgICAgIHN0cmVhbS5rZXl3b3JkKCdMQVlTJyk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihtYXRlcmlhbC5MYXllcnMubGVuZ3RoKTtcbiAgICAgICAgZm9yICh2YXIgX2IgPSAwLCBfYyA9IG1hdGVyaWFsLkxheWVyczsgX2IgPCBfYy5sZW5ndGg7IF9iKyspIHtcbiAgICAgICAgICAgIHZhciBsYXllciA9IF9jW19iXTtcbiAgICAgICAgICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoTGF5ZXIobGF5ZXIpKTtcbiAgICAgICAgICAgIHN0cmVhbS5pbnQzMihsYXllci5GaWx0ZXJNb2RlKTtcbiAgICAgICAgICAgIHN0cmVhbS5pbnQzMihsYXllci5TaGFkaW5nKTtcbiAgICAgICAgICAgIHN0cmVhbS5pbnQzMih0eXBlb2YgbGF5ZXIuVGV4dHVyZUlEID09PSAnbnVtYmVyJyA/IGxheWVyLlRleHR1cmVJRCA6IDApO1xuICAgICAgICAgICAgc3RyZWFtLmludDMyKGxheWVyLlRWZXJ0ZXhBbmltSWQgIT09IG51bGwgPyBsYXllci5UVmVydGV4QW5pbUlkIDogTk9ORSk7XG4gICAgICAgICAgICBzdHJlYW0uaW50MzIobGF5ZXIuQ29vcmRJZCk7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMih0eXBlb2YgbGF5ZXIuQWxwaGEgPT09ICdudW1iZXInID8gbGF5ZXIuQWxwaGEgOiAxKTtcbiAgICAgICAgICAgIGlmIChsYXllci5BbHBoYSAmJiB0eXBlb2YgbGF5ZXIuQWxwaGEgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tNVEEnKTtcbiAgICAgICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihsYXllci5BbHBoYSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsYXllci5UZXh0dXJlSUQgJiYgdHlwZW9mIGxheWVyLlRleHR1cmVJRCAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0ua2V5d29yZCgnS01URicpO1xuICAgICAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGxheWVyLlRleHR1cmVJRCwgQW5pbVZlY3RvclR5cGUuSU5UMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG52YXIgTU9ERUxfVEVYVFVSRV9QQVRIX0xFTkdUSCA9IDB4MTAwO1xuZnVuY3Rpb24gYnl0ZUxlbmd0aFRleHR1cmUoKSB7XG4gICAgcmV0dXJuIDQgLyogUmVwbGFjZWFibGVJZCAqLyArXG4gICAgICAgIE1PREVMX1RFWFRVUkVfUEFUSF9MRU5HVEggK1xuICAgICAgICA0IC8qIHN0ciB0cmFpbGluZyB6ZXJvID8gKi8gK1xuICAgICAgICA0IC8qIEZsYWdzICovO1xufVxuZnVuY3Rpb24gYnl0ZUxlbmd0aFRleHR1cmVzKG1vZGVsKSB7XG4gICAgaWYgKCFtb2RlbC5UZXh0dXJlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiA0IC8qIGtleXdvcmQgKi8gK1xuICAgICAgICA0IC8qIHNpemUgKi8gK1xuICAgICAgICBzdW0obW9kZWwuVGV4dHVyZXMubWFwKGZ1bmN0aW9uICh0ZXh0dXJlKSB7IHJldHVybiBieXRlTGVuZ3RoVGV4dHVyZSgpOyB9KSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVRleHR1cmVzKG1vZGVsLCBzdHJlYW0pIHtcbiAgICBpZiAoIW1vZGVsLlRleHR1cmVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHN0cmVhbS5rZXl3b3JkKCdURVhTJyk7XG4gICAgc3RyZWFtLmludDMyKGJ5dGVMZW5ndGhUZXh0dXJlcyhtb2RlbCkgLSA4KTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gbW9kZWwuVGV4dHVyZXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciB0ZXh0dXJlID0gX2FbX2ldO1xuICAgICAgICBzdHJlYW0uaW50MzIodGV4dHVyZS5SZXBsYWNlYWJsZUlkKTtcbiAgICAgICAgc3RyZWFtLnN0cih0ZXh0dXJlLkltYWdlLCBNT0RFTF9URVhUVVJFX1BBVEhfTEVOR1RIKTtcbiAgICAgICAgc3RyZWFtLmludDMyKDApO1xuICAgICAgICBzdHJlYW0uaW50MzIodGV4dHVyZS5GbGFncyk7XG4gICAgfVxufVxuZnVuY3Rpb24gYnl0ZUxlbmd0aFRleHR1cmVBbmltKGFuaW0pIHtcbiAgICByZXR1cm4gNCAvKiBzaXplICovICtcbiAgICAgICAgKGFuaW0uVHJhbnNsYXRpb24gPyA0IC8qIGtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3RvcihhbmltLlRyYW5zbGF0aW9uLCBBbmltVmVjdG9yVHlwZS5GTE9BVDMpIDogMCkgK1xuICAgICAgICAoYW5pbS5Sb3RhdGlvbiA/IDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGFuaW0uUm90YXRpb24sIEFuaW1WZWN0b3JUeXBlLkZMT0FUNCkgOiAwKSArXG4gICAgICAgIChhbmltLlNjYWxpbmcgPyA0IC8qIGtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3RvcihhbmltLlNjYWxpbmcsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMykgOiAwKTtcbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhUZXh0dXJlQW5pbXMobW9kZWwpIHtcbiAgICBpZiAoIW1vZGVsLlRleHR1cmVBbmltcyB8fCAhbW9kZWwuVGV4dHVyZUFuaW1zLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIDQgLyoga2V5d29yZCAqLyArXG4gICAgICAgIDQgLyogc2l6ZSAqLyArXG4gICAgICAgIHN1bShtb2RlbC5UZXh0dXJlQW5pbXMubWFwKGZ1bmN0aW9uIChhbmltKSB7IHJldHVybiBieXRlTGVuZ3RoVGV4dHVyZUFuaW0oYW5pbSk7IH0pKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlVGV4dHVyZUFuaW1zKG1vZGVsLCBzdHJlYW0pIHtcbiAgICBpZiAoIW1vZGVsLlRleHR1cmVBbmltcyB8fCAhbW9kZWwuVGV4dHVyZUFuaW1zLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHN0cmVhbS5rZXl3b3JkKCdUWEFOJyk7XG4gICAgc3RyZWFtLmludDMyKGJ5dGVMZW5ndGhUZXh0dXJlQW5pbXMobW9kZWwpIC0gOCk7XG4gICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IG1vZGVsLlRleHR1cmVBbmltczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGFuaW0gPSBfYVtfaV07XG4gICAgICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoVGV4dHVyZUFuaW0oYW5pbSkpO1xuICAgICAgICBpZiAoYW5pbS5UcmFuc2xhdGlvbikge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tUQVQnKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGFuaW0uVHJhbnNsYXRpb24sIEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFuaW0uUm90YXRpb24pIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLVEFSJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihhbmltLlJvdGF0aW9uLCBBbmltVmVjdG9yVHlwZS5GTE9BVDQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbmltLlNjYWxpbmcpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLVEFTJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihhbmltLlNjYWxpbmcsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBieXRlTGVuZ3RoR2Vvc2V0KGdlb3NldCkge1xuICAgIHJldHVybiA0IC8qIHNpemUgKi8gK1xuICAgICAgICA0IC8qIFZSVFgga2V5d29yZCAqLyArXG4gICAgICAgIDQgLyogdmVydGljZXMgY291bnQgKi8gK1xuICAgICAgICA0ICogZ2Vvc2V0LlZlcnRpY2VzLmxlbmd0aCAvKiB2ZXJ0aWNlcyBkYXRhICovICtcbiAgICAgICAgNCAvKiBOUk1TIGtleXdvcmQgKi8gK1xuICAgICAgICA0IC8qIG5vcm1hbHMgY291bnQgKi8gK1xuICAgICAgICA0ICogZ2Vvc2V0Lk5vcm1hbHMubGVuZ3RoIC8qIG5vcm1hbHMgZGF0YSAqLyArXG4gICAgICAgIDQgLyogUFRZUCBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBwcmltaXRpdmUgY291bnQgKi8gK1xuICAgICAgICA0IC8qIGludCBcIjRcIiAqLyArXG4gICAgICAgIDQgLyogUENOVCBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBmYWNlIGdyb3VwIGNvdW50ICovICtcbiAgICAgICAgNCAvKiBmYWNlcyBjb3VudCAqLyArXG4gICAgICAgIDQgLyogUFZUWCBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBpbmRpY2VzIGNvdW50ICovICtcbiAgICAgICAgMiAqIGdlb3NldC5GYWNlcy5sZW5ndGggLyogaW5kaWNlcyBkYXRhICovICtcbiAgICAgICAgNCAvKiBHTkRYIGtleXdvcmQgKi8gK1xuICAgICAgICA0IC8qIHZlcnRleCBncm91cCBjb3VudCAqLyArXG4gICAgICAgIGdlb3NldC5WZXJ0ZXhHcm91cC5sZW5ndGggLyogdmVydGV4IGdyb3VwIGRhdGEgKi8gK1xuICAgICAgICA0IC8qIE1UR0Mga2V5d29yZCAqLyArXG4gICAgICAgIDQgLyogZ3JvdXAgY291bnQgKi8gK1xuICAgICAgICA0ICogZ2Vvc2V0Lkdyb3Vwcy5sZW5ndGggLyogZ3JvdXAgZGF0YSAqLyArXG4gICAgICAgIDQgLyogTUFUUyBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiB0b3RhbCBncm91cCBjb3VudCAqLyArXG4gICAgICAgIDQgKiBnZW9zZXQuVG90YWxHcm91cHNDb3VudCAvKiBncm91cHMgZGF0YSAqLyArXG4gICAgICAgIDQgLyogTWF0ZXJpYWxJRCAqLyArXG4gICAgICAgIDQgLyogU2VsZWN0aW9uR3JvdXAgKi8gK1xuICAgICAgICA0IC8qIFVuc2VsZWN0YWJsZSAqLyArXG4gICAgICAgIDQgKiA3IC8qIGV4dGVudCAqLyArXG4gICAgICAgIDQgLyogZ2Vvc2V0IGFuaW0gY291bnQgKi8gK1xuICAgICAgICA0ICogNyAqIGdlb3NldC5Bbmltcy5sZW5ndGggLyogZ2Vvc2V0IGFuaW0gZGF0YSAqLyArXG4gICAgICAgIDQgLyogVVZBUyBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBUVmVydGljZXMgY291bnQgKi8gK1xuICAgICAgICBzdW0oZ2Vvc2V0LlRWZXJ0aWNlcy5tYXAoZnVuY3Rpb24gKHR2ZXJ0aWNlcykge1xuICAgICAgICAgICAgcmV0dXJuIDQgLyogVVZCUyBrZXl3b3JkICovICtcbiAgICAgICAgICAgICAgICA0IC8qIHRleHR1cmUgY29vcmQgY291bnQgKi8gK1xuICAgICAgICAgICAgICAgIDQgKiB0dmVydGljZXMubGVuZ3RoO1xuICAgICAgICB9IC8qIHRleHR1cmUgY29vcmQgZGF0YSAqLykpO1xufVxuZnVuY3Rpb24gYnl0ZUxlbmd0aEdlb3NldHMobW9kZWwpIHtcbiAgICBpZiAoIW1vZGVsLkdlb3NldHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gNCAvKiBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBzaXplICovICtcbiAgICAgICAgc3VtKG1vZGVsLkdlb3NldHMubWFwKGZ1bmN0aW9uIChnZW9zZXQpIHsgcmV0dXJuIGJ5dGVMZW5ndGhHZW9zZXQoZ2Vvc2V0KTsgfSkpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVHZW9zZXRzKG1vZGVsLCBzdHJlYW0pIHtcbiAgICBpZiAoIW1vZGVsLkdlb3NldHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3RyZWFtLmtleXdvcmQoJ0dFT1MnKTtcbiAgICBzdHJlYW0uaW50MzIoYnl0ZUxlbmd0aEdlb3NldHMobW9kZWwpIC0gOCk7XG4gICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IG1vZGVsLkdlb3NldHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBnZW9zZXQgPSBfYVtfaV07XG4gICAgICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoR2Vvc2V0KGdlb3NldCkpO1xuICAgICAgICBzdHJlYW0ua2V5d29yZCgnVlJUWCcpO1xuICAgICAgICBzdHJlYW0uaW50MzIoZ2Vvc2V0LlZlcnRpY2VzLmxlbmd0aCAvIDMpO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMkFycmF5KGdlb3NldC5WZXJ0aWNlcyk7XG4gICAgICAgIHN0cmVhbS5rZXl3b3JkKCdOUk1TJyk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihnZW9zZXQuTm9ybWFscy5sZW5ndGggLyAzKTtcbiAgICAgICAgc3RyZWFtLmZsb2F0MzJBcnJheShnZW9zZXQuTm9ybWFscyk7XG4gICAgICAgIHN0cmVhbS5rZXl3b3JkKCdQVFlQJyk7XG4gICAgICAgIHN0cmVhbS5pbnQzMigxKTtcbiAgICAgICAgc3RyZWFtLmludDMyKDQpO1xuICAgICAgICBzdHJlYW0ua2V5d29yZCgnUENOVCcpO1xuICAgICAgICBzdHJlYW0uaW50MzIoMSk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihnZW9zZXQuRmFjZXMubGVuZ3RoKTtcbiAgICAgICAgc3RyZWFtLmtleXdvcmQoJ1BWVFgnKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGdlb3NldC5GYWNlcy5sZW5ndGgpO1xuICAgICAgICBzdHJlYW0udWludDE2QXJyYXkoZ2Vvc2V0LkZhY2VzKTtcbiAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0dORFgnKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGdlb3NldC5WZXJ0ZXhHcm91cC5sZW5ndGgpO1xuICAgICAgICBzdHJlYW0udWludDhBcnJheShnZW9zZXQuVmVydGV4R3JvdXApO1xuICAgICAgICBzdHJlYW0ua2V5d29yZCgnTVRHQycpO1xuICAgICAgICBzdHJlYW0uaW50MzIoZ2Vvc2V0Lkdyb3Vwcy5sZW5ndGgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlb3NldC5Hcm91cHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHN0cmVhbS5pbnQzMihnZW9zZXQuR3JvdXBzW2ldLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtLmtleXdvcmQoJ01BVFMnKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGdlb3NldC5Ub3RhbEdyb3Vwc0NvdW50KTtcbiAgICAgICAgZm9yICh2YXIgX2IgPSAwLCBfYyA9IGdlb3NldC5Hcm91cHM7IF9iIDwgX2MubGVuZ3RoOyBfYisrKSB7XG4gICAgICAgICAgICB2YXIgZ3JvdXAgPSBfY1tfYl07XG4gICAgICAgICAgICBmb3IgKHZhciBfZCA9IDAsIGdyb3VwXzEgPSBncm91cDsgX2QgPCBncm91cF8xLmxlbmd0aDsgX2QrKykge1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGdyb3VwXzFbX2RdO1xuICAgICAgICAgICAgICAgIHN0cmVhbS5pbnQzMihpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtLmludDMyKGdlb3NldC5NYXRlcmlhbElEKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGdlb3NldC5TZWxlY3Rpb25Hcm91cCk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihnZW9zZXQuVW5zZWxlY3RhYmxlID8gNCA6IDApO1xuICAgICAgICBnZW5lcmF0ZUV4dGVudChnZW9zZXQsIHN0cmVhbSk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihnZW9zZXQuQW5pbXMubGVuZ3RoKTtcbiAgICAgICAgZm9yICh2YXIgX2UgPSAwLCBfZiA9IGdlb3NldC5BbmltczsgX2UgPCBfZi5sZW5ndGg7IF9lKyspIHtcbiAgICAgICAgICAgIHZhciBhbmltID0gX2ZbX2VdO1xuICAgICAgICAgICAgZ2VuZXJhdGVFeHRlbnQoYW5pbSwgc3RyZWFtKTtcbiAgICAgICAgfVxuICAgICAgICBzdHJlYW0ua2V5d29yZCgnVVZBUycpO1xuICAgICAgICBzdHJlYW0uaW50MzIoZ2Vvc2V0LlRWZXJ0aWNlcy5sZW5ndGgpO1xuICAgICAgICBmb3IgKHZhciBfZyA9IDAsIF9oID0gZ2Vvc2V0LlRWZXJ0aWNlczsgX2cgPCBfaC5sZW5ndGg7IF9nKyspIHtcbiAgICAgICAgICAgIHZhciB0dmVydGljZXMgPSBfaFtfZ107XG4gICAgICAgICAgICBzdHJlYW0ua2V5d29yZCgnVVZCUycpO1xuICAgICAgICAgICAgc3RyZWFtLmludDMyKHR2ZXJ0aWNlcy5sZW5ndGggLyAyKTtcbiAgICAgICAgICAgIHN0cmVhbS5mbG9hdDMyQXJyYXkodHZlcnRpY2VzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhHZW9zZXRBbmltKGFuaW0pIHtcbiAgICByZXR1cm4gNCAvKiBzaXplICovICtcbiAgICAgICAgNCAvKiBzdGF0aWMgQWxwaGEgKi8gK1xuICAgICAgICA0IC8qIEZsYWdzICovICtcbiAgICAgICAgNCAqIDMgLyogc3RhdGljIENvbG9yICovICtcbiAgICAgICAgNCAvKiBHZW9zZXRJZCAqLyArXG4gICAgICAgICh0eXBlb2YgYW5pbS5BbHBoYSAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoYW5pbS5BbHBoYSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKSArXG4gICAgICAgIChhbmltLkNvbG9yICYmICEoYW5pbS5Db2xvciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoYW5pbS5Db2xvciwgQW5pbVZlY3RvclR5cGUuRkxPQVQzKSA6XG4gICAgICAgICAgICAwKTtcbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhHZW9zZXRBbmltcyhtb2RlbCkge1xuICAgIGlmICghbW9kZWwuR2Vvc2V0QW5pbXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gNCAvKiBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBzaXplICovICtcbiAgICAgICAgc3VtKG1vZGVsLkdlb3NldEFuaW1zLm1hcChmdW5jdGlvbiAoYW5pbSkgeyByZXR1cm4gYnl0ZUxlbmd0aEdlb3NldEFuaW0oYW5pbSk7IH0pKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlR2Vvc2V0QW5pbXMobW9kZWwsIHN0cmVhbSkge1xuICAgIGlmICghbW9kZWwuR2Vvc2V0QW5pbXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3RyZWFtLmtleXdvcmQoJ0dFT0EnKTtcbiAgICBzdHJlYW0uaW50MzIoYnl0ZUxlbmd0aEdlb3NldEFuaW1zKG1vZGVsKSAtIDgpO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5HZW9zZXRBbmltczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGFuaW0gPSBfYVtfaV07XG4gICAgICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoR2Vvc2V0QW5pbShhbmltKSk7XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKHR5cGVvZiBhbmltLkFscGhhID09PSAnbnVtYmVyJyA/IGFuaW0uQWxwaGEgOiAxKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGFuaW0uRmxhZ3MpO1xuICAgICAgICBpZiAoYW5pbS5Db2xvciAmJiBhbmltLkNvbG9yIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMihhbmltLkNvbG9yWzBdKTtcbiAgICAgICAgICAgIHN0cmVhbS5mbG9hdDMyKGFuaW0uQ29sb3JbMV0pO1xuICAgICAgICAgICAgc3RyZWFtLmZsb2F0MzIoYW5pbS5Db2xvclsyXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMigxKTtcbiAgICAgICAgICAgIHN0cmVhbS5mbG9hdDMyKDEpO1xuICAgICAgICAgICAgc3RyZWFtLmZsb2F0MzIoMSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtLmludDMyKGFuaW0uR2Vvc2V0SWQgIT09IG51bGwgPyBhbmltLkdlb3NldElkIDogTk9ORSk7XG4gICAgICAgIGlmIChhbmltLkFscGhhICE9PSBudWxsICYmIHR5cGVvZiBhbmltLkFscGhhICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tHQU8nKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGFuaW0uQWxwaGEsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFuaW0uQ29sb3IgJiYgIShhbmltLkNvbG9yIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSkge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tHQUMnKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGFuaW0uQ29sb3IsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgIH1cbiAgICB9XG59XG52YXIgTU9ERUxfTk9ERV9OQU1FX0xFTkdUSCA9IDB4NTA7XG5mdW5jdGlvbiBieXRlTGVuZ3RoTm9kZShub2RlKSB7XG4gICAgcmV0dXJuIDQgLyogc2l6ZSAqLyArXG4gICAgICAgIE1PREVMX05PREVfTkFNRV9MRU5HVEggK1xuICAgICAgICA0IC8qIE9iamVjdElkICovICtcbiAgICAgICAgNCAvKiBQYXJlbnQgKi8gK1xuICAgICAgICA0IC8qIEZsYWdzICovICtcbiAgICAgICAgKG5vZGUuVHJhbnNsYXRpb24gPyA0IC8qa2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKG5vZGUuVHJhbnNsYXRpb24sIEFuaW1WZWN0b3JUeXBlLkZMT0FUMykgOiAwKSArXG4gICAgICAgIChub2RlLlJvdGF0aW9uID8gNCAvKmtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3Rvcihub2RlLlJvdGF0aW9uLCBBbmltVmVjdG9yVHlwZS5GTE9BVDQpIDogMCkgK1xuICAgICAgICAobm9kZS5TY2FsaW5nID8gNCAvKmtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3Rvcihub2RlLlNjYWxpbmcsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMykgOiAwKTtcbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhCb25lKGJvbmUpIHtcbiAgICByZXR1cm4gYnl0ZUxlbmd0aE5vZGUoYm9uZSkgK1xuICAgICAgICA0IC8qIEdlb3NldElkICovICtcbiAgICAgICAgNDsgLyogR2Vvc2V0QW5pbUlkICovXG59XG5mdW5jdGlvbiBieXRlTGVuZ3RoQm9uZXMobW9kZWwpIHtcbiAgICBpZiAoIW1vZGVsLkJvbmVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIDQgLyoga2V5d29yZCAqLyArXG4gICAgICAgIDQgLyogc2l6ZSAqLyArXG4gICAgICAgIHN1bShtb2RlbC5Cb25lcy5tYXAoYnl0ZUxlbmd0aEJvbmUpKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlTm9kZShub2RlLCBzdHJlYW0pIHtcbiAgICBzdHJlYW0uaW50MzIoYnl0ZUxlbmd0aE5vZGUobm9kZSkpO1xuICAgIHN0cmVhbS5zdHIobm9kZS5OYW1lLCBNT0RFTF9OT0RFX05BTUVfTEVOR1RIKTtcbiAgICBzdHJlYW0uaW50MzIobm9kZS5PYmplY3RJZCAhPT0gbnVsbCA/IG5vZGUuT2JqZWN0SWQgOiBOT05FKTtcbiAgICBzdHJlYW0uaW50MzIobm9kZS5QYXJlbnQgIT09IG51bGwgPyBub2RlLlBhcmVudCA6IE5PTkUpO1xuICAgIHN0cmVhbS5pbnQzMihub2RlLkZsYWdzKTtcbiAgICBpZiAobm9kZS5UcmFuc2xhdGlvbikge1xuICAgICAgICBzdHJlYW0ua2V5d29yZCgnS0dUUicpO1xuICAgICAgICBzdHJlYW0uYW5pbVZlY3Rvcihub2RlLlRyYW5zbGF0aW9uLCBBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgIH1cbiAgICBpZiAobm9kZS5Sb3RhdGlvbikge1xuICAgICAgICBzdHJlYW0ua2V5d29yZCgnS0dSVCcpO1xuICAgICAgICBzdHJlYW0uYW5pbVZlY3Rvcihub2RlLlJvdGF0aW9uLCBBbmltVmVjdG9yVHlwZS5GTE9BVDQpO1xuICAgIH1cbiAgICBpZiAobm9kZS5TY2FsaW5nKSB7XG4gICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLR1NDJyk7XG4gICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKG5vZGUuU2NhbGluZywgQW5pbVZlY3RvclR5cGUuRkxPQVQzKTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUJvbmVzKG1vZGVsLCBzdHJlYW0pIHtcbiAgICBpZiAoIW1vZGVsLkJvbmVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHN0cmVhbS5rZXl3b3JkKCdCT05FJyk7XG4gICAgc3RyZWFtLmludDMyKGJ5dGVMZW5ndGhCb25lcyhtb2RlbCkgLSA4KTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gbW9kZWwuQm9uZXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBib25lID0gX2FbX2ldO1xuICAgICAgICBnZW5lcmF0ZU5vZGUoYm9uZSwgc3RyZWFtKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGJvbmUuR2Vvc2V0SWQgIT09IG51bGwgPyBib25lLkdlb3NldElkIDogTk9ORSk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihib25lLkdlb3NldEFuaW1JZCAhPT0gbnVsbCA/IGJvbmUuR2Vvc2V0QW5pbUlkIDogTk9ORSk7XG4gICAgfVxufVxuZnVuY3Rpb24gYnl0ZUxlbmd0aExpZ2h0KGxpZ2h0KSB7XG4gICAgcmV0dXJuIDQgLyogc2l6ZSAqLyArXG4gICAgICAgIGJ5dGVMZW5ndGhOb2RlKGxpZ2h0KSArXG4gICAgICAgIDQgLyogTGlnaHRUeXBlICovICtcbiAgICAgICAgNCAvKiBBdHRlbnVhdGlvblN0YXJ0ICovICtcbiAgICAgICAgNCAvKiBBdHRlbnVhdGlvbkVuZCAqLyArXG4gICAgICAgIDQgKiAzIC8qIHN0YXRpYyBDb2xvciAqLyArXG4gICAgICAgIDQgLyogc3RhdGljIEludGVuc2l0eSAqLyArXG4gICAgICAgIDQgKiAzIC8qIHN0YXRpYyBBbWJDb2xvciAqLyArXG4gICAgICAgIDQgLyogc3RhdGljIEFtYkludGVuc2l0eSAqLyArXG4gICAgICAgIChsaWdodC5WaXNpYmlsaXR5ID8gNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IobGlnaHQuVmlzaWJpbGl0eSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6IDApICtcbiAgICAgICAgKGxpZ2h0LkNvbG9yICYmICEobGlnaHQuQ29sb3IgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpID9cbiAgICAgICAgICAgIDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGxpZ2h0LkNvbG9yLCBBbmltVmVjdG9yVHlwZS5GTE9BVDMpIDpcbiAgICAgICAgICAgIDApICtcbiAgICAgICAgKGxpZ2h0LkludGVuc2l0eSAmJiB0eXBlb2YgbGlnaHQuSW50ZW5zaXR5ICE9PSAnbnVtYmVyJyA/XG4gICAgICAgICAgICA0IC8qIGtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3RvcihsaWdodC5JbnRlbnNpdHksIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSkgOlxuICAgICAgICAgICAgMCkgK1xuICAgICAgICAobGlnaHQuQXR0ZW51YXRpb25TdGFydCAmJiB0eXBlb2YgbGlnaHQuQXR0ZW51YXRpb25TdGFydCAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IobGlnaHQuQXR0ZW51YXRpb25TdGFydCwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKSArXG4gICAgICAgIChsaWdodC5BdHRlbnVhdGlvbkVuZCAmJiB0eXBlb2YgbGlnaHQuQXR0ZW51YXRpb25FbmQgIT09ICdudW1iZXInID9cbiAgICAgICAgICAgIDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGxpZ2h0LkF0dGVudWF0aW9uRW5kLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpIDpcbiAgICAgICAgICAgIDApICtcbiAgICAgICAgKGxpZ2h0LkFtYkNvbG9yICYmICEobGlnaHQuQW1iQ29sb3IgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpID9cbiAgICAgICAgICAgIDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGxpZ2h0LkFtYkNvbG9yLCBBbmltVmVjdG9yVHlwZS5GTE9BVDMpIDpcbiAgICAgICAgICAgIDApICtcbiAgICAgICAgKGxpZ2h0LkFtYkludGVuc2l0eSAmJiB0eXBlb2YgbGlnaHQuQW1iSW50ZW5zaXR5ICE9PSAnbnVtYmVyJyA/XG4gICAgICAgICAgICA0IC8qIGtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3RvcihsaWdodC5BbWJJbnRlbnNpdHksIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSkgOlxuICAgICAgICAgICAgMCk7XG59XG5mdW5jdGlvbiBieXRlTGVuZ3RoTGlnaHRzKG1vZGVsKSB7XG4gICAgaWYgKCFtb2RlbC5MaWdodHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gNCAvKiBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBzaXplICovICtcbiAgICAgICAgc3VtKG1vZGVsLkxpZ2h0cy5tYXAoYnl0ZUxlbmd0aExpZ2h0KSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUxpZ2h0cyhtb2RlbCwgc3RyZWFtKSB7XG4gICAgaWYgKCFtb2RlbC5MaWdodHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3RyZWFtLmtleXdvcmQoJ0xJVEUnKTtcbiAgICBzdHJlYW0uaW50MzIoYnl0ZUxlbmd0aExpZ2h0cyhtb2RlbCkgLSA4KTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gbW9kZWwuTGlnaHRzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgbGlnaHQgPSBfYVtfaV07XG4gICAgICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoTGlnaHQobGlnaHQpKTtcbiAgICAgICAgZ2VuZXJhdGVOb2RlKGxpZ2h0LCBzdHJlYW0pO1xuICAgICAgICBzdHJlYW0uaW50MzIobGlnaHQuTGlnaHRUeXBlKTtcbiAgICAgICAgc3RyZWFtLmZsb2F0MzIodHlwZW9mIGxpZ2h0LkF0dGVudWF0aW9uU3RhcnQgPT09ICdudW1iZXInID8gbGlnaHQuQXR0ZW51YXRpb25TdGFydCA6IDApO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMih0eXBlb2YgbGlnaHQuQXR0ZW51YXRpb25FbmQgPT09ICdudW1iZXInID8gbGlnaHQuQXR0ZW51YXRpb25FbmQgOiAwKTtcbiAgICAgICAgaWYgKGxpZ2h0LkNvbG9yIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMihsaWdodC5Db2xvclswXSk7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMihsaWdodC5Db2xvclsxXSk7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMihsaWdodC5Db2xvclsyXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMigxKTtcbiAgICAgICAgICAgIHN0cmVhbS5mbG9hdDMyKDEpO1xuICAgICAgICAgICAgc3RyZWFtLmZsb2F0MzIoMSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtLmZsb2F0MzIodHlwZW9mIGxpZ2h0LkludGVuc2l0eSA9PT0gJ251bWJlcicgPyBsaWdodC5JbnRlbnNpdHkgOiAwKTtcbiAgICAgICAgaWYgKGxpZ2h0LkFtYkNvbG9yIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMihsaWdodC5BbWJDb2xvclswXSk7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMihsaWdodC5BbWJDb2xvclsxXSk7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMihsaWdodC5BbWJDb2xvclsyXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMigxKTtcbiAgICAgICAgICAgIHN0cmVhbS5mbG9hdDMyKDEpO1xuICAgICAgICAgICAgc3RyZWFtLmZsb2F0MzIoMSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtLmZsb2F0MzIodHlwZW9mIGxpZ2h0LkFtYkludGVuc2l0eSA9PT0gJ251bWJlcicgPyBsaWdodC5BbWJJbnRlbnNpdHkgOiAwKTtcbiAgICAgICAgaWYgKGxpZ2h0LkludGVuc2l0eSAmJiB0eXBlb2YgbGlnaHQuSW50ZW5zaXR5ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tMQUknKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGxpZ2h0LkludGVuc2l0eSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGlnaHQuVmlzaWJpbGl0eSkge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tMQVYnKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGxpZ2h0LlZpc2liaWxpdHksIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpZ2h0LkNvbG9yICYmICEobGlnaHQuQ29sb3IgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpKSB7XG4gICAgICAgICAgICBzdHJlYW0ua2V5d29yZCgnS0xBQycpO1xuICAgICAgICAgICAgc3RyZWFtLmFuaW1WZWN0b3IobGlnaHQuQ29sb3IsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpZ2h0LkFtYkNvbG9yICYmICEobGlnaHQuQW1iQ29sb3IgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpKSB7XG4gICAgICAgICAgICBzdHJlYW0ua2V5d29yZCgnS0xCQycpO1xuICAgICAgICAgICAgc3RyZWFtLmFuaW1WZWN0b3IobGlnaHQuQW1iQ29sb3IsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpZ2h0LkFtYkludGVuc2l0eSAmJiB0eXBlb2YgbGlnaHQuQW1iSW50ZW5zaXR5ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tMQkknKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGxpZ2h0LkFtYkludGVuc2l0eSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGlnaHQuQXR0ZW51YXRpb25TdGFydCAmJiB0eXBlb2YgbGlnaHQuQXR0ZW51YXRpb25TdGFydCAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLTEFTJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihsaWdodC5BdHRlbnVhdGlvblN0YXJ0LCBBbmltVmVjdG9yVHlwZS5JTlQxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGlnaHQuQXR0ZW51YXRpb25FbmQgJiYgdHlwZW9mIGxpZ2h0LkF0dGVudWF0aW9uRW5kICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tMQUUnKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGxpZ2h0LkF0dGVudWF0aW9uRW5kLCBBbmltVmVjdG9yVHlwZS5JTlQxKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhIZWxwZXJzKG1vZGVsKSB7XG4gICAgaWYgKG1vZGVsLkhlbHBlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gNCAvKiBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBzaXplICovICtcbiAgICAgICAgc3VtKG1vZGVsLkhlbHBlcnMubWFwKGJ5dGVMZW5ndGhOb2RlKSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUhlbHBlcnMobW9kZWwsIHN0cmVhbSkge1xuICAgIGlmIChtb2RlbC5IZWxwZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHN0cmVhbS5rZXl3b3JkKCdIRUxQJyk7XG4gICAgc3RyZWFtLmludDMyKGJ5dGVMZW5ndGhIZWxwZXJzKG1vZGVsKSAtIDgpO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5IZWxwZXJzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgaGVscGVyID0gX2FbX2ldO1xuICAgICAgICBnZW5lcmF0ZU5vZGUoaGVscGVyLCBzdHJlYW0pO1xuICAgIH1cbn1cbnZhciBNT0RFTF9BVFRBQ0hNRU5UX1BBVEhfTEVOR1RIID0gMHgxMDA7XG5mdW5jdGlvbiBieXRlTGVuZ3RoQXR0YWNobWVudChhdHRhY2htZW50KSB7XG4gICAgcmV0dXJuIDQgLyogc2l6ZSAqLyArXG4gICAgICAgIGJ5dGVMZW5ndGhOb2RlKGF0dGFjaG1lbnQpICtcbiAgICAgICAgTU9ERUxfQVRUQUNITUVOVF9QQVRIX0xFTkdUSCArXG4gICAgICAgIDQgLyogemVybyA/ICovICtcbiAgICAgICAgNCAvKiBBdHRhY2htZW50SUQgKi8gK1xuICAgICAgICAoYXR0YWNobWVudC5WaXNpYmlsaXR5ID9cbiAgICAgICAgICAgIDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGF0dGFjaG1lbnQuVmlzaWJpbGl0eSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKTtcbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhBdHRhY2htZW50cyhtb2RlbCkge1xuICAgIGlmIChtb2RlbC5BdHRhY2htZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiA0IC8qIGtleXdvcmQgKi8gK1xuICAgICAgICA0IC8qIHNpemUgKi8gK1xuICAgICAgICBzdW0obW9kZWwuQXR0YWNobWVudHMubWFwKGJ5dGVMZW5ndGhBdHRhY2htZW50KSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUF0dGFjaG1lbnRzKG1vZGVsLCBzdHJlYW0pIHtcbiAgICBpZiAobW9kZWwuQXR0YWNobWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3RyZWFtLmtleXdvcmQoJ0FUQ0gnKTtcbiAgICBzdHJlYW0uaW50MzIoYnl0ZUxlbmd0aEF0dGFjaG1lbnRzKG1vZGVsKSAtIDgpO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5BdHRhY2htZW50czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGF0dGFjaG1lbnQgPSBfYVtfaV07XG4gICAgICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoQXR0YWNobWVudChhdHRhY2htZW50KSk7XG4gICAgICAgIGdlbmVyYXRlTm9kZShhdHRhY2htZW50LCBzdHJlYW0pO1xuICAgICAgICBzdHJlYW0uc3RyKGF0dGFjaG1lbnQuUGF0aCB8fCAnJywgTU9ERUxfQVRUQUNITUVOVF9QQVRIX0xFTkdUSCk7XG4gICAgICAgIHN0cmVhbS5pbnQzMigwKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGF0dGFjaG1lbnQuQXR0YWNobWVudElEKTtcbiAgICAgICAgaWYgKGF0dGFjaG1lbnQuVmlzaWJpbGl0eSkge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tBVFYnKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGF0dGFjaG1lbnQuVmlzaWJpbGl0eSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhQaXZvdFBvaW50cyhtb2RlbCkge1xuICAgIGlmICghbW9kZWwuUGl2b3RQb2ludHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gNCAvKiBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBzaXplICovICtcbiAgICAgICAgNCAqIDMgKiBtb2RlbC5QaXZvdFBvaW50cy5sZW5ndGg7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVBpdm90UG9pbnRzKG1vZGVsLCBzdHJlYW0pIHtcbiAgICBpZiAoIW1vZGVsLlBpdm90UG9pbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHN0cmVhbS5rZXl3b3JkKCdQSVZUJyk7XG4gICAgc3RyZWFtLmludDMyKG1vZGVsLlBpdm90UG9pbnRzLmxlbmd0aCAqIDQgKiAzKTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gbW9kZWwuUGl2b3RQb2ludHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBwb2ludCA9IF9hW19pXTtcbiAgICAgICAgc3RyZWFtLmZsb2F0MzJBcnJheShwb2ludCk7XG4gICAgfVxufVxudmFyIE1PREVMX1BBUlRJQ0xFX0VNSVRURVJfUEFUSF9MRU5HVEggPSAweDEwMDtcbmZ1bmN0aW9uIGJ5dGVMZW5ndGhQYXJ0aWNsZUVtaXR0ZXIoZW1pdHRlcikge1xuICAgIHJldHVybiA0IC8qIHNpemUgKi8gK1xuICAgICAgICBieXRlTGVuZ3RoTm9kZShlbWl0dGVyKSArXG4gICAgICAgIDQgLyogRW1pc3Npb25SYXRlICovICtcbiAgICAgICAgNCAvKiBHcmF2aXR5ICovICtcbiAgICAgICAgNCAvKiBMb25naXR1ZGUgKi8gK1xuICAgICAgICA0IC8qIExhdGl0dWRlICovICtcbiAgICAgICAgTU9ERUxfUEFSVElDTEVfRU1JVFRFUl9QQVRIX0xFTkdUSCArXG4gICAgICAgIDQgK1xuICAgICAgICA0IC8qIExpZmVTcGFuICovICtcbiAgICAgICAgNCAvKiBJbml0VmVsb2NpdHkgKi8gK1xuICAgICAgICAoZW1pdHRlci5WaXNpYmlsaXR5ICYmIHR5cGVvZiBlbWl0dGVyLlZpc2liaWxpdHkgIT09ICdudW1iZXInID9cbiAgICAgICAgICAgIDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGVtaXR0ZXIuVmlzaWJpbGl0eSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKSArXG4gICAgICAgIChlbWl0dGVyLkVtaXNzaW9uUmF0ZSAmJiB0eXBlb2YgZW1pdHRlci5FbWlzc2lvblJhdGUgIT09ICdudW1iZXInID9cbiAgICAgICAgICAgIDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGVtaXR0ZXIuRW1pc3Npb25SYXRlLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpIDpcbiAgICAgICAgICAgIDApICtcbiAgICAgICAgKGVtaXR0ZXIuR3Jhdml0eSAmJiB0eXBlb2YgZW1pdHRlci5HcmF2aXR5ICE9PSAnbnVtYmVyJyA/XG4gICAgICAgICAgICA0IC8qIGtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3RvcihlbWl0dGVyLkdyYXZpdHksIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSkgOlxuICAgICAgICAgICAgMCkgK1xuICAgICAgICAoZW1pdHRlci5Mb25naXR1ZGUgJiYgdHlwZW9mIGVtaXR0ZXIuTG9uZ2l0dWRlICE9PSAnbnVtYmVyJyA/XG4gICAgICAgICAgICA0IC8qIGtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3RvcihlbWl0dGVyLkxvbmdpdHVkZSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKSArXG4gICAgICAgIChlbWl0dGVyLkxhdGl0dWRlICYmIHR5cGVvZiBlbWl0dGVyLkxhdGl0dWRlICE9PSAnbnVtYmVyJyA/XG4gICAgICAgICAgICA0IC8qIGtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3RvcihlbWl0dGVyLkxhdGl0dWRlLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpIDpcbiAgICAgICAgICAgIDApICtcbiAgICAgICAgKGVtaXR0ZXIuTGlmZVNwYW4gJiYgdHlwZW9mIGVtaXR0ZXIuTGlmZVNwYW4gIT09ICdudW1iZXInID9cbiAgICAgICAgICAgIDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGVtaXR0ZXIuTGlmZVNwYW4sIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSkgOlxuICAgICAgICAgICAgMCkgK1xuICAgICAgICAoZW1pdHRlci5Jbml0VmVsb2NpdHkgJiYgdHlwZW9mIGVtaXR0ZXIuSW5pdFZlbG9jaXR5ICE9PSAnbnVtYmVyJyA/XG4gICAgICAgICAgICA0IC8qIGtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3RvcihlbWl0dGVyLkluaXRWZWxvY2l0eSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKTtcbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhQYXJ0aWNsZUVtaXR0ZXJzKG1vZGVsKSB7XG4gICAgaWYgKCFtb2RlbC5QYXJ0aWNsZUVtaXR0ZXJzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIDQgLyoga2V5d29yZCAqLyArXG4gICAgICAgIDQgLyogc2l6ZSAqLyArXG4gICAgICAgIHN1bShtb2RlbC5QYXJ0aWNsZUVtaXR0ZXJzLm1hcChieXRlTGVuZ3RoUGFydGljbGVFbWl0dGVyKSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVBhcnRpY2xlRW1pdHRlcnMobW9kZWwsIHN0cmVhbSkge1xuICAgIGlmICghbW9kZWwuUGFydGljbGVFbWl0dGVycy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdHJlYW0ua2V5d29yZCgnUFJFTScpO1xuICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoUGFydGljbGVFbWl0dGVycyhtb2RlbCkgLSA4KTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gbW9kZWwuUGFydGljbGVFbWl0dGVyczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGVtaXR0ZXIgPSBfYVtfaV07XG4gICAgICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoUGFydGljbGVFbWl0dGVyKGVtaXR0ZXIpKTtcbiAgICAgICAgZ2VuZXJhdGVOb2RlKGVtaXR0ZXIsIHN0cmVhbSk7XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKHR5cGVvZiBlbWl0dGVyLkVtaXNzaW9uUmF0ZSA9PT0gJ251bWJlcicgPyBlbWl0dGVyLkVtaXNzaW9uUmF0ZSA6IDApO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMih0eXBlb2YgZW1pdHRlci5HcmF2aXR5ID09PSAnbnVtYmVyJyA/IGVtaXR0ZXIuR3Jhdml0eSA6IDApO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMih0eXBlb2YgZW1pdHRlci5Mb25naXR1ZGUgPT09ICdudW1iZXInID8gZW1pdHRlci5Mb25naXR1ZGUgOiAwKTtcbiAgICAgICAgc3RyZWFtLmZsb2F0MzIodHlwZW9mIGVtaXR0ZXIuTGF0aXR1ZGUgPT09ICdudW1iZXInID8gZW1pdHRlci5MYXRpdHVkZSA6IDApO1xuICAgICAgICBzdHJlYW0uc3RyKGVtaXR0ZXIuUGF0aCwgTU9ERUxfUEFSVElDTEVfRU1JVFRFUl9QQVRIX0xFTkdUSCk7XG4gICAgICAgIHN0cmVhbS5pbnQzMigwKTtcbiAgICAgICAgc3RyZWFtLmZsb2F0MzIodHlwZW9mIGVtaXR0ZXIuTGlmZVNwYW4gPT09ICdudW1iZXInID8gZW1pdHRlci5MaWZlU3BhbiA6IDApO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMih0eXBlb2YgZW1pdHRlci5Jbml0VmVsb2NpdHkgPT09ICdudW1iZXInID8gZW1pdHRlci5Jbml0VmVsb2NpdHkgOiAwKTtcbiAgICAgICAgaWYgKGVtaXR0ZXIuVmlzaWJpbGl0eSAmJiB0eXBlb2YgZW1pdHRlci5WaXNpYmlsaXR5ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tQRVYnKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGVtaXR0ZXIuVmlzaWJpbGl0eSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW1pdHRlci5FbWlzc2lvblJhdGUgJiYgdHlwZW9mIGVtaXR0ZXIuRW1pc3Npb25SYXRlICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tQRUUnKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGVtaXR0ZXIuRW1pc3Npb25SYXRlLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbWl0dGVyLkdyYXZpdHkgJiYgdHlwZW9mIGVtaXR0ZXIuR3Jhdml0eSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUEVHJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLkdyYXZpdHksIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVtaXR0ZXIuTG9uZ2l0dWRlICYmIHR5cGVvZiBlbWl0dGVyLkxvbmdpdHVkZSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUExOJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLkxvbmdpdHVkZSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW1pdHRlci5MYXRpdHVkZSAmJiB0eXBlb2YgZW1pdHRlci5MYXRpdHVkZSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUExUJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLkxhdGl0dWRlLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbWl0dGVyLkxpZmVTcGFuICYmIHR5cGVvZiBlbWl0dGVyLkxpZmVTcGFuICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tQRUwnKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGVtaXR0ZXIuTGlmZVNwYW4sIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVtaXR0ZXIuSW5pdFZlbG9jaXR5ICYmIHR5cGVvZiBlbWl0dGVyLkluaXRWZWxvY2l0eSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUEVTJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLkluaXRWZWxvY2l0eSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhQYXJ0aWNsZUVtaXR0ZXIyKGVtaXR0ZXIpIHtcbiAgICByZXR1cm4gNCAvKiBzaXplICovICtcbiAgICAgICAgYnl0ZUxlbmd0aE5vZGUoZW1pdHRlcikgK1xuICAgICAgICA0IC8qIHN0YXRpYyBTcGVlZCAqLyArXG4gICAgICAgIDQgLyogVmFyaWF0aW9uICovICtcbiAgICAgICAgNCAvKiBzdGF0aWMgTGF0aXR1ZGUgKi8gK1xuICAgICAgICA0IC8qIEdyYXZpdHkgKi8gK1xuICAgICAgICA0IC8qIExpZmVTcGFuICovICtcbiAgICAgICAgNCAvKiBzdGF0aWMgRW1pc3Npb25SYXRlICovICtcbiAgICAgICAgNCAvKiBzdGF0aWMgTGVuZ3RoICovICtcbiAgICAgICAgNCAvKiBzdGF0aWMgV2lkdGggKi8gK1xuICAgICAgICA0IC8qIEZpbHRlck1vZGUgKi8gK1xuICAgICAgICA0IC8qIFJvd3MgKi8gK1xuICAgICAgICA0IC8qIENvbHVtbnMgKi8gK1xuICAgICAgICA0IC8qIEZyYW1lRmxhZ3MgKi8gK1xuICAgICAgICA0IC8qIFRhaWxMZW5ndGggKi8gK1xuICAgICAgICA0IC8qIFRpbWUgKi8gK1xuICAgICAgICA0ICogMyAqIDMgLyogU2VnbWVudENvbG9yICovICtcbiAgICAgICAgMyAvKiBBbHBoYSB1aW50ICogMyAqLyArXG4gICAgICAgIDQgKiAzIC8qIFBhcnRpY2xlU2NhbGluZyAqLyArXG4gICAgICAgIDQgKiAzIC8qIExpZmVTcGFuVVZBbmltICovICtcbiAgICAgICAgNCAqIDMgLyogRGVjYXlVVkFuaW0gKi8gK1xuICAgICAgICA0ICogMyAvKiBUYWlsVVZBbmltICovICtcbiAgICAgICAgNCAqIDMgLyogVGFpbERlY2F5VVZBbmltICovICtcbiAgICAgICAgNCAvKiBUZXh0dXJlSUQgKi8gK1xuICAgICAgICA0IC8qIFNxdWlydCAqLyArXG4gICAgICAgIDQgLyogUHJpb3JpdHlQbGFuZSAqLyArXG4gICAgICAgIDQgLyogUmVwbGFjZWFibGVJZCAqLyArXG4gICAgICAgIChlbWl0dGVyLlZpc2liaWxpdHkgJiYgdHlwZW9mIGVtaXR0ZXIuVmlzaWJpbGl0eSAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoZW1pdHRlci5WaXNpYmlsaXR5LCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpIDpcbiAgICAgICAgICAgIDApICtcbiAgICAgICAgKGVtaXR0ZXIuRW1pc3Npb25SYXRlICYmIHR5cGVvZiBlbWl0dGVyLkVtaXNzaW9uUmF0ZSAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoZW1pdHRlci5FbWlzc2lvblJhdGUsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSkgOlxuICAgICAgICAgICAgMCkgK1xuICAgICAgICAoZW1pdHRlci5XaWR0aCAmJiB0eXBlb2YgZW1pdHRlci5XaWR0aCAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoZW1pdHRlci5XaWR0aCwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKSArXG4gICAgICAgIChlbWl0dGVyLkxlbmd0aCAmJiB0eXBlb2YgZW1pdHRlci5MZW5ndGggIT09ICdudW1iZXInID9cbiAgICAgICAgICAgIDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGVtaXR0ZXIuTGVuZ3RoLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpIDpcbiAgICAgICAgICAgIDApICtcbiAgICAgICAgKGVtaXR0ZXIuU3BlZWQgJiYgdHlwZW9mIGVtaXR0ZXIuU3BlZWQgIT09ICdudW1iZXInID9cbiAgICAgICAgICAgIDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGVtaXR0ZXIuU3BlZWQsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSkgOlxuICAgICAgICAgICAgMCkgK1xuICAgICAgICAoZW1pdHRlci5MYXRpdHVkZSAmJiB0eXBlb2YgZW1pdHRlci5MYXRpdHVkZSAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoZW1pdHRlci5MYXRpdHVkZSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKSArXG4gICAgICAgIChlbWl0dGVyLkdyYXZpdHkgJiYgdHlwZW9mIGVtaXR0ZXIuR3Jhdml0eSAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoZW1pdHRlci5HcmF2aXR5LCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpIDpcbiAgICAgICAgICAgIDApICtcbiAgICAgICAgKGVtaXR0ZXIuVmFyaWF0aW9uICYmIHR5cGVvZiBlbWl0dGVyLlZhcmlhdGlvbiAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoZW1pdHRlci5WYXJpYXRpb24sIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSkgOlxuICAgICAgICAgICAgMCk7XG59XG5mdW5jdGlvbiBieXRlTGVuZ3RoUGFydGljbGVFbWl0dGVyczIobW9kZWwpIHtcbiAgICBpZiAoIW1vZGVsLlBhcnRpY2xlRW1pdHRlcnMyLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIDQgLyoga2V5d29yZCAqLyArXG4gICAgICAgIDQgLyogc2l6ZSAqLyArXG4gICAgICAgIHN1bShtb2RlbC5QYXJ0aWNsZUVtaXR0ZXJzMi5tYXAoYnl0ZUxlbmd0aFBhcnRpY2xlRW1pdHRlcjIpKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlUGFydGljbGVFbWl0dGVyczIobW9kZWwsIHN0cmVhbSkge1xuICAgIGlmICghbW9kZWwuUGFydGljbGVFbWl0dGVyczIubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3RyZWFtLmtleXdvcmQoJ1BSRTInKTtcbiAgICBzdHJlYW0uaW50MzIoYnl0ZUxlbmd0aFBhcnRpY2xlRW1pdHRlcnMyKG1vZGVsKSAtIDgpO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5QYXJ0aWNsZUVtaXR0ZXJzMjsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGVtaXR0ZXIgPSBfYVtfaV07XG4gICAgICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoUGFydGljbGVFbWl0dGVyMihlbWl0dGVyKSk7XG4gICAgICAgIGdlbmVyYXRlTm9kZShlbWl0dGVyLCBzdHJlYW0pO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMih0eXBlb2YgZW1pdHRlci5TcGVlZCA9PT0gJ251bWJlcicgPyBlbWl0dGVyLlNwZWVkIDogMCk7XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKHR5cGVvZiBlbWl0dGVyLlZhcmlhdGlvbiA9PT0gJ251bWJlcicgPyBlbWl0dGVyLlZhcmlhdGlvbiA6IDApO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMih0eXBlb2YgZW1pdHRlci5MYXRpdHVkZSA9PT0gJ251bWJlcicgPyBlbWl0dGVyLkxhdGl0dWRlIDogMCk7XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKHR5cGVvZiBlbWl0dGVyLkdyYXZpdHkgPT09ICdudW1iZXInID8gZW1pdHRlci5HcmF2aXR5IDogMCk7XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKGVtaXR0ZXIuTGlmZVNwYW4pO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMih0eXBlb2YgZW1pdHRlci5FbWlzc2lvblJhdGUgPT09ICdudW1iZXInID8gZW1pdHRlci5FbWlzc2lvblJhdGUgOiAwKTtcbiAgICAgICAgc3RyZWFtLmZsb2F0MzIodHlwZW9mIGVtaXR0ZXIuV2lkdGggPT09ICdudW1iZXInID8gZW1pdHRlci5XaWR0aCA6IDApO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMih0eXBlb2YgZW1pdHRlci5MZW5ndGggPT09ICdudW1iZXInID8gZW1pdHRlci5MZW5ndGggOiAwKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGVtaXR0ZXIuRmlsdGVyTW9kZSk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihlbWl0dGVyLlJvd3MpO1xuICAgICAgICBzdHJlYW0uaW50MzIoZW1pdHRlci5Db2x1bW5zKTtcbiAgICAgICAgaWYgKGVtaXR0ZXIuRnJhbWVGbGFncyAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLkhlYWQgJiZcbiAgICAgICAgICAgIGVtaXR0ZXIuRnJhbWVGbGFncyAmIG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLlRhaWwpIHtcbiAgICAgICAgICAgIHN0cmVhbS5pbnQzMigyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlbWl0dGVyLkZyYW1lRmxhZ3MgJiBtb2RlbF8xLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncy5UYWlsKSB7XG4gICAgICAgICAgICBzdHJlYW0uaW50MzIoMSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZW1pdHRlci5GcmFtZUZsYWdzICYgbW9kZWxfMS5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MuSGVhZCkge1xuICAgICAgICAgICAgc3RyZWFtLmludDMyKDApO1xuICAgICAgICB9XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKGVtaXR0ZXIuVGFpbExlbmd0aCk7XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKGVtaXR0ZXIuVGltZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgKytpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDM7ICsraikge1xuICAgICAgICAgICAgICAgIHN0cmVhbS5mbG9hdDMyKGVtaXR0ZXIuU2VnbWVudENvbG9yW2ldW2pdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7ICsraSkge1xuICAgICAgICAgICAgc3RyZWFtLnVpbnQ4KGVtaXR0ZXIuQWxwaGFbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgKytpKSB7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMihlbWl0dGVyLlBhcnRpY2xlU2NhbGluZ1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgX2IgPSAwLCBfYyA9IFsnTGlmZVNwYW5VVkFuaW0nLCAnRGVjYXlVVkFuaW0nLCAnVGFpbFVWQW5pbScsICdUYWlsRGVjYXlVVkFuaW0nXTsgX2IgPCBfYy5sZW5ndGg7IF9iKyspIHtcbiAgICAgICAgICAgIHZhciBwYXJ0ID0gX2NbX2JdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyArK2kpIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0uaW50MzIoZW1pdHRlcltwYXJ0XVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtLmludDMyKGVtaXR0ZXIuVGV4dHVyZUlEICE9PSBudWxsID8gZW1pdHRlci5UZXh0dXJlSUQgOiBOT05FKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGVtaXR0ZXIuU3F1aXJ0ID8gMSA6IDApO1xuICAgICAgICBzdHJlYW0uaW50MzIoZW1pdHRlci5Qcmlvcml0eVBsYW5lKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGVtaXR0ZXIuUmVwbGFjZWFibGVJZCk7XG4gICAgICAgIGlmIChlbWl0dGVyLlNwZWVkICYmIHR5cGVvZiBlbWl0dGVyLlNwZWVkICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tQMlMnKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGVtaXR0ZXIuU3BlZWQsIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVtaXR0ZXIuTGF0aXR1ZGUgJiYgdHlwZW9mIGVtaXR0ZXIuTGF0aXR1ZGUgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBzdHJlYW0ua2V5d29yZCgnS1AyTCcpO1xuICAgICAgICAgICAgc3RyZWFtLmFuaW1WZWN0b3IoZW1pdHRlci5MYXRpdHVkZSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW1pdHRlci5FbWlzc2lvblJhdGUgJiYgdHlwZW9mIGVtaXR0ZXIuRW1pc3Npb25SYXRlICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tQMkUnKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGVtaXR0ZXIuRW1pc3Npb25SYXRlLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbWl0dGVyLlZpc2liaWxpdHkgJiYgdHlwZW9mIGVtaXR0ZXIuVmlzaWJpbGl0eSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUDJWJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLlZpc2liaWxpdHksIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVtaXR0ZXIuTGVuZ3RoICYmIHR5cGVvZiBlbWl0dGVyLkxlbmd0aCAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUDJOJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLkxlbmd0aCwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW1pdHRlci5XaWR0aCAmJiB0eXBlb2YgZW1pdHRlci5XaWR0aCAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUDJXJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLldpZHRoLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbWl0dGVyLkdyYXZpdHkgJiYgdHlwZW9mIGVtaXR0ZXIuR3Jhdml0eSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUDJHJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLkdyYXZpdHksIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVtaXR0ZXIuVmFyaWF0aW9uICYmIHR5cGVvZiBlbWl0dGVyLlZhcmlhdGlvbiAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUDJSJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLlZhcmlhdGlvbiwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhSaWJib25FbWl0dGVyKGVtaXR0ZXIpIHtcbiAgICByZXR1cm4gNCAvKiBzaXplICovICtcbiAgICAgICAgYnl0ZUxlbmd0aE5vZGUoZW1pdHRlcikgK1xuICAgICAgICA0IC8qIHN0YXRpYyBIZWlnaHRBYm92ZSAqLyArXG4gICAgICAgIDQgLyogc3RhdGljIEhlaWdodEJlbG93ICovICtcbiAgICAgICAgNCAvKiBBbHBoYSAqLyArXG4gICAgICAgIDQgKiAzIC8qIENvbG9yICovICtcbiAgICAgICAgNCAvKiBMaWZlU3BhbiAqLyArXG4gICAgICAgIDQgLyogVGV4dHVyZVNsb3QgKi8gK1xuICAgICAgICA0IC8qIEVtaXNzaW9uUmF0ZSAqLyArXG4gICAgICAgIDQgLyogUm93cyAqLyArXG4gICAgICAgIDQgLyogQ29sdW1ucyAqLyArXG4gICAgICAgIDQgLyogTWF0ZXJpYWxJRCAqLyArXG4gICAgICAgIDQgLyogR3Jhdml0eSAqLyArXG4gICAgICAgIChlbWl0dGVyLlZpc2liaWxpdHkgPyA0IC8qIGtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3RvcihlbWl0dGVyLlZpc2liaWxpdHksIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSkgOiAwKSArXG4gICAgICAgICh0eXBlb2YgZW1pdHRlci5IZWlnaHRBYm92ZSAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoZW1pdHRlci5IZWlnaHRBYm92ZSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKSArXG4gICAgICAgICh0eXBlb2YgZW1pdHRlci5IZWlnaHRCZWxvdyAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoZW1pdHRlci5IZWlnaHRCZWxvdywgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKSArXG4gICAgICAgICh0eXBlb2YgZW1pdHRlci5BbHBoYSAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoZW1pdHRlci5BbHBoYSwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKSArXG4gICAgICAgICh0eXBlb2YgZW1pdHRlci5UZXh0dXJlU2xvdCAhPT0gJ251bWJlcicgP1xuICAgICAgICAgICAgNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoZW1pdHRlci5UZXh0dXJlU2xvdCwgQW5pbVZlY3RvclR5cGUuRkxPQVQxKSA6XG4gICAgICAgICAgICAwKTtcbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhSaWJib25FbWl0dGVycyhtb2RlbCkge1xuICAgIGlmICghbW9kZWwuUmliYm9uRW1pdHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gNCAvKiBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBzaXplICovICtcbiAgICAgICAgc3VtKG1vZGVsLlJpYmJvbkVtaXR0ZXJzLm1hcChieXRlTGVuZ3RoUmliYm9uRW1pdHRlcikpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVSaWJib25FbWl0dGVycyhtb2RlbCwgc3RyZWFtKSB7XG4gICAgaWYgKCFtb2RlbC5SaWJib25FbWl0dGVycy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdHJlYW0ua2V5d29yZCgnUklCQicpO1xuICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoUmliYm9uRW1pdHRlcnMobW9kZWwpIC0gOCk7XG4gICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IG1vZGVsLlJpYmJvbkVtaXR0ZXJzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgZW1pdHRlciA9IF9hW19pXTtcbiAgICAgICAgc3RyZWFtLmludDMyKGJ5dGVMZW5ndGhSaWJib25FbWl0dGVyKGVtaXR0ZXIpKTtcbiAgICAgICAgZ2VuZXJhdGVOb2RlKGVtaXR0ZXIsIHN0cmVhbSk7XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKHR5cGVvZiBlbWl0dGVyLkhlaWdodEFib3ZlID09PSAnbnVtYmVyJyA/IGVtaXR0ZXIuSGVpZ2h0QWJvdmUgOiAwKTtcbiAgICAgICAgc3RyZWFtLmZsb2F0MzIodHlwZW9mIGVtaXR0ZXIuSGVpZ2h0QmVsb3cgPT09ICdudW1iZXInID8gZW1pdHRlci5IZWlnaHRCZWxvdyA6IDApO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMih0eXBlb2YgZW1pdHRlci5BbHBoYSA9PT0gJ251bWJlcicgPyBlbWl0dGVyLkFscGhhIDogMCk7XG4gICAgICAgIGlmIChlbWl0dGVyLkNvbG9yKSB7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMkFycmF5KGVtaXR0ZXIuQ29sb3IpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc3RyZWFtLmZsb2F0MzIoMSk7XG4gICAgICAgICAgICBzdHJlYW0uZmxvYXQzMigxKTtcbiAgICAgICAgICAgIHN0cmVhbS5mbG9hdDMyKDEpO1xuICAgICAgICB9XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKGVtaXR0ZXIuTGlmZVNwYW4pO1xuICAgICAgICBzdHJlYW0uaW50MzIodHlwZW9mIGVtaXR0ZXIuVGV4dHVyZVNsb3QgPT09ICdudW1iZXInID8gZW1pdHRlci5UZXh0dXJlU2xvdCA6IDApO1xuICAgICAgICBzdHJlYW0uaW50MzIoZW1pdHRlci5FbWlzc2lvblJhdGUpO1xuICAgICAgICBzdHJlYW0uaW50MzIoZW1pdHRlci5Sb3dzKTtcbiAgICAgICAgc3RyZWFtLmludDMyKGVtaXR0ZXIuQ29sdW1ucyk7XG4gICAgICAgIHN0cmVhbS5pbnQzMihlbWl0dGVyLk1hdGVyaWFsSUQpO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMihlbWl0dGVyLkdyYXZpdHkpO1xuICAgICAgICBpZiAoZW1pdHRlci5WaXNpYmlsaXR5KSB7XG4gICAgICAgICAgICBzdHJlYW0ua2V5d29yZCgnS1JWUycpO1xuICAgICAgICAgICAgc3RyZWFtLmFuaW1WZWN0b3IoZW1pdHRlci5WaXNpYmlsaXR5LCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZW1pdHRlci5IZWlnaHRBYm92ZSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUkhBJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLkhlaWdodEFib3ZlLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZW1pdHRlci5IZWlnaHRCZWxvdyAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUkhCJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLkhlaWdodEJlbG93LCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZW1pdHRlci5BbHBoYSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUkFMJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLkFscGhhLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZW1pdHRlci5UZXh0dXJlU2xvdCAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLUlRYJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihlbWl0dGVyLlRleHR1cmVTbG90LCBBbmltVmVjdG9yVHlwZS5JTlQxKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbnZhciBNT0RFTF9DQU1FUkFfTkFNRV9MRU5HVEggPSAweDUwO1xuZnVuY3Rpb24gYnl0ZUxlbmd0aENhbWVyYShjYW1lcmEpIHtcbiAgICByZXR1cm4gNCAvKiBzaXplICovICtcbiAgICAgICAgTU9ERUxfQ0FNRVJBX05BTUVfTEVOR1RIICtcbiAgICAgICAgNCAqIDMgLyogUG9zaXRpb24gKi8gK1xuICAgICAgICA0IC8qIEZpZWxkT2ZWaWV3ICovICtcbiAgICAgICAgNCAvKiBGYXJDbGlwICovICtcbiAgICAgICAgNCAvKiBOZWFyQ2xpcCAqLyArXG4gICAgICAgIDQgKiAzIC8qIFRhcmdldFBvc2l0aW9uICovICtcbiAgICAgICAgKGNhbWVyYS5UcmFuc2xhdGlvbiA/IDQgLyoga2V5d29yZCAqLyArIGJ5dGVMZW5ndGhBbmltVmVjdG9yKGNhbWVyYS5UcmFuc2xhdGlvbiwgQW5pbVZlY3RvclR5cGUuRkxPQVQzKSA6IDApICtcbiAgICAgICAgKGNhbWVyYS5UYXJnZXRUcmFuc2xhdGlvbiA/XG4gICAgICAgICAgICA0IC8qIGtleXdvcmQgKi8gKyBieXRlTGVuZ3RoQW5pbVZlY3RvcihjYW1lcmEuVGFyZ2V0VHJhbnNsYXRpb24sIEFuaW1WZWN0b3JUeXBlLkZMT0FUMykgOlxuICAgICAgICAgICAgMCkgK1xuICAgICAgICAoY2FtZXJhLlJvdGF0aW9uID8gNCAvKiBrZXl3b3JkICovICsgYnl0ZUxlbmd0aEFuaW1WZWN0b3IoY2FtZXJhLlJvdGF0aW9uLCBBbmltVmVjdG9yVHlwZS5GTE9BVDEpIDogMCk7XG59XG5mdW5jdGlvbiBieXRlTGVuZ3RoQ2FtZXJhcyhtb2RlbCkge1xuICAgIGlmICghbW9kZWwuQ2FtZXJhcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiA0IC8qIGtleXdvcmQgKi8gK1xuICAgICAgICA0IC8qIHNpemUgKi8gK1xuICAgICAgICBzdW0obW9kZWwuQ2FtZXJhcy5tYXAoYnl0ZUxlbmd0aENhbWVyYSkpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVDYW1lcmFzKG1vZGVsLCBzdHJlYW0pIHtcbiAgICBpZiAoIW1vZGVsLkNhbWVyYXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3RyZWFtLmtleXdvcmQoJ0NBTVMnKTtcbiAgICBzdHJlYW0uaW50MzIoYnl0ZUxlbmd0aENhbWVyYXMobW9kZWwpIC0gOCk7XG4gICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IG1vZGVsLkNhbWVyYXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBjYW1lcmEgPSBfYVtfaV07XG4gICAgICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoQ2FtZXJhKGNhbWVyYSkpO1xuICAgICAgICBzdHJlYW0uc3RyKGNhbWVyYS5OYW1lLCBNT0RFTF9DQU1FUkFfTkFNRV9MRU5HVEgpO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMkFycmF5KGNhbWVyYS5Qb3NpdGlvbik7XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKGNhbWVyYS5GaWVsZE9mVmlldyk7XG4gICAgICAgIHN0cmVhbS5mbG9hdDMyKGNhbWVyYS5GYXJDbGlwKTtcbiAgICAgICAgc3RyZWFtLmZsb2F0MzIoY2FtZXJhLk5lYXJDbGlwKTtcbiAgICAgICAgc3RyZWFtLmZsb2F0MzJBcnJheShjYW1lcmEuVGFyZ2V0UG9zaXRpb24pO1xuICAgICAgICBpZiAoY2FtZXJhLlRyYW5zbGF0aW9uKSB7XG4gICAgICAgICAgICBzdHJlYW0ua2V5d29yZCgnS0NUUicpO1xuICAgICAgICAgICAgc3RyZWFtLmFuaW1WZWN0b3IoY2FtZXJhLlRyYW5zbGF0aW9uLCBBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjYW1lcmEuUm90YXRpb24pIHtcbiAgICAgICAgICAgIHN0cmVhbS5rZXl3b3JkKCdLQ1JMJyk7XG4gICAgICAgICAgICBzdHJlYW0uYW5pbVZlY3RvcihjYW1lcmEuUm90YXRpb24sIEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhbWVyYS5UYXJnZXRUcmFuc2xhdGlvbikge1xuICAgICAgICAgICAgc3RyZWFtLmtleXdvcmQoJ0tUVFInKTtcbiAgICAgICAgICAgIHN0cmVhbS5hbmltVmVjdG9yKGNhbWVyYS5UYXJnZXRUcmFuc2xhdGlvbiwgQW5pbVZlY3RvclR5cGUuRkxPQVQzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhFdmVudE9iamVjdChldmVudE9iamVjdCkge1xuICAgIHJldHVybiBieXRlTGVuZ3RoTm9kZShldmVudE9iamVjdCkgK1xuICAgICAgICA0IC8qIEtFVlQga2V5d29yZCAqLyArXG4gICAgICAgIDQgLyogY291bnQgKi8gK1xuICAgICAgICA0ICtcbiAgICAgICAgNCAqIGV2ZW50T2JqZWN0LkV2ZW50VHJhY2subGVuZ3RoO1xufVxuZnVuY3Rpb24gYnl0ZUxlbmd0aEV2ZW50T2JqZWN0cyhtb2RlbCkge1xuICAgIGlmIChtb2RlbC5FdmVudE9iamVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gNCAvKiBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBzaXplICovICtcbiAgICAgICAgc3VtKG1vZGVsLkV2ZW50T2JqZWN0cy5tYXAoYnl0ZUxlbmd0aEV2ZW50T2JqZWN0KSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUV2ZW50T2JqZWN0cyhtb2RlbCwgc3RyZWFtKSB7XG4gICAgaWYgKG1vZGVsLkV2ZW50T2JqZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdHJlYW0ua2V5d29yZCgnRVZUUycpO1xuICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoRXZlbnRPYmplY3RzKG1vZGVsKSAtIDgpO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5FdmVudE9iamVjdHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBldmVudE9iamVjdCA9IF9hW19pXTtcbiAgICAgICAgZ2VuZXJhdGVOb2RlKGV2ZW50T2JqZWN0LCBzdHJlYW0pO1xuICAgICAgICBzdHJlYW0ua2V5d29yZCgnS0VWVCcpO1xuICAgICAgICBzdHJlYW0uaW50MzIoZXZlbnRPYmplY3QuRXZlbnRUcmFjay5sZW5ndGgpO1xuICAgICAgICAvLyB0b2RvIEdsb2JhbFNlcXVlbmNlSWRcbiAgICAgICAgc3RyZWFtLmludDMyKE5PTkUpOyAvLyBHbG9iYWxTZXF1ZW5jZUlkID9cbiAgICAgICAgc3RyZWFtLnVpbnQzMkFycmF5KGV2ZW50T2JqZWN0LkV2ZW50VHJhY2spO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGJ5dGVMZW5ndGhDb2xsaXNpb25TaGFwZShjb2xsaXNpb25TaGFwZSkge1xuICAgIHJldHVybiBieXRlTGVuZ3RoTm9kZShjb2xsaXNpb25TaGFwZSkgK1xuICAgICAgICA0IC8qIFNoYXBlICovICtcbiAgICAgICAgKGNvbGxpc2lvblNoYXBlLlNoYXBlID09PSBtb2RlbF8xLkNvbGxpc2lvblNoYXBlVHlwZS5Cb3ggPyA2IDogMykgKiA0IC8qIFZlcnRpY2VzICovICtcbiAgICAgICAgKGNvbGxpc2lvblNoYXBlLlNoYXBlID09PSBtb2RlbF8xLkNvbGxpc2lvblNoYXBlVHlwZS5TcGhlcmUgPyA0IDogMCk7IC8qIEJvdW5kc1JhZGl1cyAqL1xufVxuZnVuY3Rpb24gYnl0ZUxlbmd0aENvbGxpc2lvblNoYXBlcyhtb2RlbCkge1xuICAgIGlmIChtb2RlbC5Db2xsaXNpb25TaGFwZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gNCAvKiBrZXl3b3JkICovICtcbiAgICAgICAgNCAvKiBzaXplICovICtcbiAgICAgICAgc3VtKG1vZGVsLkNvbGxpc2lvblNoYXBlcy5tYXAoYnl0ZUxlbmd0aENvbGxpc2lvblNoYXBlKSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUNvbGxpc2lvblNoYXBlcyhtb2RlbCwgc3RyZWFtKSB7XG4gICAgaWYgKG1vZGVsLkNvbGxpc2lvblNoYXBlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdHJlYW0ua2V5d29yZCgnQ0xJRCcpO1xuICAgIHN0cmVhbS5pbnQzMihieXRlTGVuZ3RoQ29sbGlzaW9uU2hhcGVzKG1vZGVsKSAtIDgpO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5Db2xsaXNpb25TaGFwZXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBjb2xsaXNpb25TaGFwZSA9IF9hW19pXTtcbiAgICAgICAgZ2VuZXJhdGVOb2RlKGNvbGxpc2lvblNoYXBlLCBzdHJlYW0pO1xuICAgICAgICBzdHJlYW0uaW50MzIoY29sbGlzaW9uU2hhcGUuU2hhcGUpO1xuICAgICAgICBzdHJlYW0uZmxvYXQzMkFycmF5KGNvbGxpc2lvblNoYXBlLlZlcnRpY2VzKTtcbiAgICAgICAgaWYgKGNvbGxpc2lvblNoYXBlLlNoYXBlID09PSBtb2RlbF8xLkNvbGxpc2lvblNoYXBlVHlwZS5TcGhlcmUpIHtcbiAgICAgICAgICAgIHN0cmVhbS5mbG9hdDMyKGNvbGxpc2lvblNoYXBlLkJvdW5kc1JhZGl1cyk7XG4gICAgICAgIH1cbiAgICB9XG59XG52YXIgYnl0ZUxlbmd0aCA9IFtcbiAgICBieXRlTGVuZ3RoVmVyc2lvbixcbiAgICBieXRlTGVuZ3RoTW9kZWxJbmZvLFxuICAgIGJ5dGVMZW5ndGhTZXF1ZW5jZXMsXG4gICAgYnl0ZUxlbmd0aEdsb2JhbFNlcXVlbmNlcyxcbiAgICBieXRlTGVuZ3RoTWF0ZXJpYWxzLFxuICAgIGJ5dGVMZW5ndGhUZXh0dXJlcyxcbiAgICBieXRlTGVuZ3RoVGV4dHVyZUFuaW1zLFxuICAgIGJ5dGVMZW5ndGhHZW9zZXRzLFxuICAgIGJ5dGVMZW5ndGhHZW9zZXRBbmltcyxcbiAgICBieXRlTGVuZ3RoQm9uZXMsXG4gICAgYnl0ZUxlbmd0aExpZ2h0cyxcbiAgICBieXRlTGVuZ3RoSGVscGVycyxcbiAgICBieXRlTGVuZ3RoQXR0YWNobWVudHMsXG4gICAgYnl0ZUxlbmd0aFBpdm90UG9pbnRzLFxuICAgIGJ5dGVMZW5ndGhQYXJ0aWNsZUVtaXR0ZXJzLFxuICAgIGJ5dGVMZW5ndGhQYXJ0aWNsZUVtaXR0ZXJzMixcbiAgICBieXRlTGVuZ3RoUmliYm9uRW1pdHRlcnMsXG4gICAgYnl0ZUxlbmd0aENhbWVyYXMsXG4gICAgYnl0ZUxlbmd0aEV2ZW50T2JqZWN0cyxcbiAgICBieXRlTGVuZ3RoQ29sbGlzaW9uU2hhcGVzXG5dO1xudmFyIGdlbmVyYXRvcnMgPSBbXG4gICAgZ2VuZXJhdGVWZXJzaW9uLFxuICAgIGdlbmVyYXRlTW9kZWxJbmZvLFxuICAgIGdlbmVyYXRlU2VxdWVuY2VzLFxuICAgIGdlbmVyYXRlR2xvYmFsU2VxdWVuY2VzLFxuICAgIGdlbmVyYXRlTWF0ZXJpYWxzLFxuICAgIGdlbmVyYXRlVGV4dHVyZXMsXG4gICAgZ2VuZXJhdGVUZXh0dXJlQW5pbXMsXG4gICAgZ2VuZXJhdGVHZW9zZXRzLFxuICAgIGdlbmVyYXRlR2Vvc2V0QW5pbXMsXG4gICAgZ2VuZXJhdGVCb25lcyxcbiAgICBnZW5lcmF0ZUxpZ2h0cyxcbiAgICBnZW5lcmF0ZUhlbHBlcnMsXG4gICAgZ2VuZXJhdGVBdHRhY2htZW50cyxcbiAgICBnZW5lcmF0ZVBpdm90UG9pbnRzLFxuICAgIGdlbmVyYXRlUGFydGljbGVFbWl0dGVycyxcbiAgICBnZW5lcmF0ZVBhcnRpY2xlRW1pdHRlcnMyLFxuICAgIGdlbmVyYXRlUmliYm9uRW1pdHRlcnMsXG4gICAgZ2VuZXJhdGVDYW1lcmFzLFxuICAgIGdlbmVyYXRlRXZlbnRPYmplY3RzLFxuICAgIGdlbmVyYXRlQ29sbGlzaW9uU2hhcGVzXG5dO1xuZnVuY3Rpb24gZ2VuZXJhdGUobW9kZWwpIHtcbiAgICB2YXIgdG90YWxMZW5ndGggPSA0IC8qIGZvcm1hdCBrZXl3b3JkICovO1xuICAgIGZvciAodmFyIF9pID0gMCwgYnl0ZUxlbmd0aF8xID0gYnl0ZUxlbmd0aDsgX2kgPCBieXRlTGVuZ3RoXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBsZW5GdW5jID0gYnl0ZUxlbmd0aF8xW19pXTtcbiAgICAgICAgdG90YWxMZW5ndGggKz0gbGVuRnVuYyhtb2RlbCk7XG4gICAgfVxuICAgIHZhciByZXMgPSBuZXcgQXJyYXlCdWZmZXIodG90YWxMZW5ndGgpO1xuICAgIHZhciBzdHJlYW0gPSBuZXcgU3RyZWFtKHJlcyk7XG4gICAgc3RyZWFtLmtleXdvcmQoJ01ETFgnKTtcbiAgICBmb3IgKHZhciBfYSA9IDAsIGdlbmVyYXRvcnNfMSA9IGdlbmVyYXRvcnM7IF9hIDwgZ2VuZXJhdG9yc18xLmxlbmd0aDsgX2ErKykge1xuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gZ2VuZXJhdG9yc18xW19hXTtcbiAgICAgICAgZ2VuZXJhdG9yKG1vZGVsLCBzdHJlYW0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuZXhwb3J0cy5nZW5lcmF0ZSA9IGdlbmVyYXRlO1xudmFyIF9hO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2VuZXJhdGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbW9kZWxfMSA9IHJlcXVpcmUoXCIuLi9tb2RlbFwiKTtcbnZhciBCSUdfRU5ESUFOID0gdHJ1ZTtcbnZhciBOT05FID0gLTE7XG52YXIgQW5pbVZlY3RvclR5cGU7XG4oZnVuY3Rpb24gKEFuaW1WZWN0b3JUeXBlKSB7XG4gICAgQW5pbVZlY3RvclR5cGVbQW5pbVZlY3RvclR5cGVbXCJJTlQxXCJdID0gMF0gPSBcIklOVDFcIjtcbiAgICBBbmltVmVjdG9yVHlwZVtBbmltVmVjdG9yVHlwZVtcIkZMT0FUMVwiXSA9IDFdID0gXCJGTE9BVDFcIjtcbiAgICBBbmltVmVjdG9yVHlwZVtBbmltVmVjdG9yVHlwZVtcIkZMT0FUM1wiXSA9IDJdID0gXCJGTE9BVDNcIjtcbiAgICBBbmltVmVjdG9yVHlwZVtBbmltVmVjdG9yVHlwZVtcIkZMT0FUNFwiXSA9IDNdID0gXCJGTE9BVDRcIjtcbn0pKEFuaW1WZWN0b3JUeXBlIHx8IChBbmltVmVjdG9yVHlwZSA9IHt9KSk7XG52YXIgYW5pbVZlY3RvclNpemUgPSAoX2EgPSB7fSxcbiAgICBfYVtBbmltVmVjdG9yVHlwZS5JTlQxXSA9IDEsXG4gICAgX2FbQW5pbVZlY3RvclR5cGUuRkxPQVQxXSA9IDEsXG4gICAgX2FbQW5pbVZlY3RvclR5cGUuRkxPQVQzXSA9IDMsXG4gICAgX2FbQW5pbVZlY3RvclR5cGUuRkxPQVQ0XSA9IDQsXG4gICAgX2EpO1xudmFyIFN0YXRlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdGF0ZShhcnJheUJ1ZmZlcikge1xuICAgICAgICB0aGlzLmFiID0gYXJyYXlCdWZmZXI7XG4gICAgICAgIHRoaXMucG9zID0gMDtcbiAgICAgICAgdGhpcy5sZW5ndGggPSBhcnJheUJ1ZmZlci5ieXRlTGVuZ3RoO1xuICAgICAgICB0aGlzLnZpZXcgPSBuZXcgRGF0YVZpZXcodGhpcy5hYik7XG4gICAgICAgIHRoaXMudWludCA9IG5ldyBVaW50OEFycmF5KHRoaXMuYWIpO1xuICAgIH1cbiAgICBTdGF0ZS5wcm90b3R5cGUua2V5d29yZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJlcyA9IFN0cmluZy5mcm9tQ2hhckNvZGUodGhpcy51aW50W3RoaXMucG9zXSwgdGhpcy51aW50W3RoaXMucG9zICsgMV0sIHRoaXMudWludFt0aGlzLnBvcyArIDJdLCB0aGlzLnVpbnRbdGhpcy5wb3MgKyAzXSk7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBTdGF0ZS5wcm90b3R5cGUuZXhwZWN0S2V5d29yZCA9IGZ1bmN0aW9uIChrZXl3b3JkLCBlcnJvclRleHQpIHtcbiAgICAgICAgaWYgKHRoaXMua2V5d29yZCgpICE9PSBrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JUZXh0KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RhdGUucHJvdG90eXBlLnVpbnQ4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52aWV3LmdldFVpbnQ4KHRoaXMucG9zKyspO1xuICAgIH07XG4gICAgU3RhdGUucHJvdG90eXBlLnVpbnQxNiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJlcyA9IHRoaXMudmlldy5nZXRVaW50MTYodGhpcy5wb3MsIEJJR19FTkRJQU4pO1xuICAgICAgICB0aGlzLnBvcyArPSAyO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgU3RhdGUucHJvdG90eXBlLmludDMyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy52aWV3LmdldEludDMyKHRoaXMucG9zLCBCSUdfRU5ESUFOKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gNDtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFN0YXRlLnByb3RvdHlwZS5mbG9hdDMyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy52aWV3LmdldEZsb2F0MzIodGhpcy5wb3MsIEJJR19FTkRJQU4pO1xuICAgICAgICB0aGlzLnBvcyArPSA0O1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgU3RhdGUucHJvdG90eXBlLnN0ciA9IGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgICAgICAgLy8gYWN0dWFsIHN0cmluZyBsZW5ndGhcbiAgICAgICAgLy8gZGF0YSBtYXkgY29uc2lzdCBvZiBbJ2EnLCAnYicsICdjJywgMCwgMCwgMF1cbiAgICAgICAgdmFyIHN0cmluZ0xlbmd0aCA9IGxlbmd0aDtcbiAgICAgICAgd2hpbGUgKHRoaXMudWludFt0aGlzLnBvcyArIHN0cmluZ0xlbmd0aCAtIDFdID09PSAwICYmIHN0cmluZ0xlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC0tc3RyaW5nTGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIC8vID8/XG4gICAgICAgIC8vIFRTMjQ2MTpUeXBlICdVaW50OEFycmF5JyBpcyBub3QgYW4gYXJyYXkgdHlwZS5cbiAgICAgICAgLy8gbGV0IHJlcyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoLi4udGhpcy51aW50LnNsaWNlKHRoaXMucG9zLCB0aGlzLnBvcyArIGxlbmd0aCkpO1xuICAgICAgICB2YXIgcmVzID0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIHRoaXMudWludC5zbGljZSh0aGlzLnBvcywgdGhpcy5wb3MgKyBzdHJpbmdMZW5ndGgpKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gbGVuZ3RoO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgU3RhdGUucHJvdG90eXBlLmFuaW1WZWN0b3IgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICB2YXIgcmVzID0ge1xuICAgICAgICAgICAgS2V5czogW11cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGlzSW50ID0gdHlwZSA9PT0gQW5pbVZlY3RvclR5cGUuSU5UMTtcbiAgICAgICAgdmFyIHZlY3RvclNpemUgPSBhbmltVmVjdG9yU2l6ZVt0eXBlXTtcbiAgICAgICAgdmFyIGtleXNDb3VudCA9IHRoaXMuaW50MzIoKTtcbiAgICAgICAgcmVzLkxpbmVUeXBlID0gdGhpcy5pbnQzMigpO1xuICAgICAgICByZXMuR2xvYmFsU2VxSWQgPSB0aGlzLmludDMyKCk7XG4gICAgICAgIGlmIChyZXMuR2xvYmFsU2VxSWQgPT09IE5PTkUpIHtcbiAgICAgICAgICAgIHJlcy5HbG9iYWxTZXFJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzQ291bnQ7ICsraSkge1xuICAgICAgICAgICAgdmFyIGFuaW1LZXlGcmFtZSA9IHt9O1xuICAgICAgICAgICAgYW5pbUtleUZyYW1lLkZyYW1lID0gdGhpcy5pbnQzMigpO1xuICAgICAgICAgICAgaWYgKGlzSW50KSB7XG4gICAgICAgICAgICAgICAgYW5pbUtleUZyYW1lLlZlY3RvciA9IG5ldyBJbnQzMkFycmF5KHZlY3RvclNpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5pbUtleUZyYW1lLlZlY3RvciA9IG5ldyBGbG9hdDMyQXJyYXkodmVjdG9yU2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZlY3RvclNpemU7ICsraikge1xuICAgICAgICAgICAgICAgIGlmIChpc0ludCkge1xuICAgICAgICAgICAgICAgICAgICBhbmltS2V5RnJhbWUuVmVjdG9yW2pdID0gdGhpcy5pbnQzMigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYW5pbUtleUZyYW1lLlZlY3RvcltqXSA9IHRoaXMuZmxvYXQzMigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXMuTGluZVR5cGUgPT09IG1vZGVsXzEuTGluZVR5cGUuSGVybWl0ZSB8fCByZXMuTGluZVR5cGUgPT09IG1vZGVsXzEuTGluZVR5cGUuQmV6aWVyKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IFsnSW5UYW4nLCAnT3V0VGFuJ107IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJ0ID0gX2FbX2ldO1xuICAgICAgICAgICAgICAgICAgICBhbmltS2V5RnJhbWVbcGFydF0gPSBuZXcgRmxvYXQzMkFycmF5KHZlY3RvclNpemUpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZlY3RvclNpemU7ICsraikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzSW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbUtleUZyYW1lW3BhcnRdW2pdID0gdGhpcy5pbnQzMigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbUtleUZyYW1lW3BhcnRdW2pdID0gdGhpcy5mbG9hdDMyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuS2V5cy5wdXNoKGFuaW1LZXlGcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIHJldHVybiBTdGF0ZTtcbn0oKSk7XG5mdW5jdGlvbiBwYXJzZUV4dGVudChvYmosIHN0YXRlKSB7XG4gICAgb2JqLkJvdW5kc1JhZGl1cyA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gWydNaW5pbXVtRXh0ZW50JywgJ01heGltdW1FeHRlbnQnXTsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGtleSA9IF9hW19pXTtcbiAgICAgICAgb2JqW2tleV0gPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7ICsraSkge1xuICAgICAgICAgICAgb2JqW2tleV1baV0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZVZlcnNpb24obW9kZWwsIHN0YXRlKSB7XG4gICAgbW9kZWwuVmVyc2lvbiA9IHN0YXRlLmludDMyKCk7XG59XG52YXIgTU9ERUxfTkFNRV9MRU5HVEggPSAweDE1MDtcbmZ1bmN0aW9uIHBhcnNlTW9kZWxJbmZvKG1vZGVsLCBzdGF0ZSkge1xuICAgIG1vZGVsLkluZm8uTmFtZSA9IHN0YXRlLnN0cihNT0RFTF9OQU1FX0xFTkdUSCk7XG4gICAgc3RhdGUuaW50MzIoKTsgLy8gdW5rbm93biA0LWJ5dGUgc2VxdWVuY2VcbiAgICBwYXJzZUV4dGVudChtb2RlbC5JbmZvLCBzdGF0ZSk7XG4gICAgbW9kZWwuSW5mby5CbGVuZFRpbWUgPSBzdGF0ZS5pbnQzMigpO1xufVxudmFyIE1PREVMX1NFUVVFTkNFX05BTUVfTEVOR1RIID0gMHg1MDtcbmZ1bmN0aW9uIHBhcnNlU2VxdWVuY2VzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciBuYW1lXzEgPSBzdGF0ZS5zdHIoTU9ERUxfU0VRVUVOQ0VfTkFNRV9MRU5HVEgpO1xuICAgICAgICB2YXIgc2VxdWVuY2UgPSB7fTtcbiAgICAgICAgc2VxdWVuY2UuTmFtZSA9IG5hbWVfMTtcbiAgICAgICAgdmFyIGludGVydmFsID0gbmV3IFVpbnQzMkFycmF5KDIpO1xuICAgICAgICBpbnRlcnZhbFswXSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGludGVydmFsWzFdID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgc2VxdWVuY2UuSW50ZXJ2YWwgPSBpbnRlcnZhbDtcbiAgICAgICAgc2VxdWVuY2UuTW92ZVNwZWVkID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBzZXF1ZW5jZS5Ob25Mb29waW5nID0gc3RhdGUuaW50MzIoKSA+IDA7XG4gICAgICAgIHNlcXVlbmNlLlJhcml0eSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgc3RhdGUuaW50MzIoKTsgLy8gdW5rbm93biA0LWJ5dGUgc2VxdWVuY2UgKHN5bmNQb2ludD8pXG4gICAgICAgIHBhcnNlRXh0ZW50KHNlcXVlbmNlLCBzdGF0ZSk7XG4gICAgICAgIG1vZGVsLlNlcXVlbmNlcy5wdXNoKHNlcXVlbmNlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZU1hdGVyaWFscyhtb2RlbCwgc3RhdGUsIHNpemUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICBzdGF0ZS5pbnQzMigpOyAvLyBtYXRlcmlhbCBzaXplIGluY2x1c2l2ZVxuICAgICAgICB2YXIgbWF0ZXJpYWwgPSB7XG4gICAgICAgICAgICBMYXllcnM6IFtdXG4gICAgICAgIH07XG4gICAgICAgIG1hdGVyaWFsLlByaW9yaXR5UGxhbmUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBtYXRlcmlhbC5SZW5kZXJNb2RlID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgc3RhdGUuZXhwZWN0S2V5d29yZCgnTEFZUycsICdJbmNvcnJlY3QgbWF0ZXJpYWxzIGZvcm1hdCcpO1xuICAgICAgICB2YXIgbGF5ZXJzQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxheWVyc0NvdW50OyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzdGFydFBvczIgPSBzdGF0ZS5wb3M7XG4gICAgICAgICAgICB2YXIgc2l6ZTIgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICAgICAgdmFyIGxheWVyID0ge307XG4gICAgICAgICAgICBsYXllci5GaWx0ZXJNb2RlID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgICAgIGxheWVyLlNoYWRpbmcgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICAgICAgbGF5ZXIuVGV4dHVyZUlEID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgICAgIGxheWVyLlRWZXJ0ZXhBbmltSWQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICAgICAgaWYgKGxheWVyLlRWZXJ0ZXhBbmltSWQgPT09IE5PTkUpIHtcbiAgICAgICAgICAgICAgICBsYXllci5UVmVydGV4QW5pbUlkID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxheWVyLkNvb3JkSWQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICAgICAgbGF5ZXIuQWxwaGEgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgICAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MyICsgc2l6ZTIpIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5d29yZCA9IHN0YXRlLmtleXdvcmQoKTtcbiAgICAgICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0tNVEEnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxheWVyLkFscGhhID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS01URicpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuVGV4dHVyZUlEID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5JTlQxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsYXllciBjaHVuayBkYXRhICcgKyBrZXl3b3JkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtYXRlcmlhbC5MYXllcnMucHVzaChsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgbW9kZWwuTWF0ZXJpYWxzLnB1c2gobWF0ZXJpYWwpO1xuICAgIH1cbn1cbnZhciBNT0RFTF9URVhUVVJFX1BBVEhfTEVOR1RIID0gMHgxMDA7XG5mdW5jdGlvbiBwYXJzZVRleHR1cmVzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciB0ZXh0dXJlID0ge307XG4gICAgICAgIHRleHR1cmUuUmVwbGFjZWFibGVJZCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIHRleHR1cmUuSW1hZ2UgPSBzdGF0ZS5zdHIoTU9ERUxfVEVYVFVSRV9QQVRIX0xFTkdUSCk7XG4gICAgICAgIHN0YXRlLmludDMyKCk7IC8vIHVua25vd24gNC1ieXRlIHNlcXVlbmNlXG4gICAgICAgIHRleHR1cmUuRmxhZ3MgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBtb2RlbC5UZXh0dXJlcy5wdXNoKHRleHR1cmUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlR2Vvc2V0cyhtb2RlbCwgc3RhdGUsIHNpemUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICB2YXIgZ2Vvc2V0ID0ge307XG4gICAgICAgIHN0YXRlLmludDMyKCk7IC8vIGdlb3NldCBzaXplLCBub3QgdXNlZFxuICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdWUlRYJywgJ0luY29ycmVjdCBnZW9zZXRzIGZvcm1hdCcpO1xuICAgICAgICB2YXIgdmVydGljZXNDb3VudCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGdlb3NldC5WZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkodmVydGljZXNDb3VudCAqIDMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZlcnRpY2VzQ291bnQgKiAzOyArK2kpIHtcbiAgICAgICAgICAgIGdlb3NldC5WZXJ0aWNlc1tpXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdOUk1TJywgJ0luY29ycmVjdCBnZW9zZXRzIGZvcm1hdCcpO1xuICAgICAgICB2YXIgbm9ybWFsc0NvdW50ID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZ2Vvc2V0Lk5vcm1hbHMgPSBuZXcgRmxvYXQzMkFycmF5KG5vcm1hbHNDb3VudCAqIDMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vcm1hbHNDb3VudCAqIDM7ICsraSkge1xuICAgICAgICAgICAgZ2Vvc2V0Lk5vcm1hbHNbaV0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuZXhwZWN0S2V5d29yZCgnUFRZUCcsICdJbmNvcnJlY3QgZ2Vvc2V0cyBmb3JtYXQnKTtcbiAgICAgICAgdmFyIHByaW1pdGl2ZUNvdW50ID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcmltaXRpdmVDb3VudDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuaW50MzIoKSAhPT0gNCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5jb3JyZWN0IGdlb3NldHMgZm9ybWF0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuZXhwZWN0S2V5d29yZCgnUENOVCcsICdJbmNvcnJlY3QgZ2Vvc2V0cyBmb3JtYXQnKTtcbiAgICAgICAgdmFyIGZhY2VHcm91cENvdW50ID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmYWNlR3JvdXBDb3VudDsgKytpKSB7XG4gICAgICAgICAgICBzdGF0ZS5pbnQzMigpO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLmV4cGVjdEtleXdvcmQoJ1BWVFgnLCAnSW5jb3JyZWN0IGdlb3NldHMgZm9ybWF0Jyk7XG4gICAgICAgIHZhciBpbmRpY2VzQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBnZW9zZXQuRmFjZXMgPSBuZXcgVWludDE2QXJyYXkoaW5kaWNlc0NvdW50KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbmRpY2VzQ291bnQ7ICsraSkge1xuICAgICAgICAgICAgZ2Vvc2V0LkZhY2VzW2ldID0gc3RhdGUudWludDE2KCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuZXhwZWN0S2V5d29yZCgnR05EWCcsICdJbmNvcnJlY3QgZ2Vvc2V0cyBmb3JtYXQnKTtcbiAgICAgICAgdmFyIHZlcnRpY2VzR3JvdXBDb3VudCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGdlb3NldC5WZXJ0ZXhHcm91cCA9IG5ldyBVaW50OEFycmF5KHZlcnRpY2VzR3JvdXBDb3VudCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmVydGljZXNHcm91cENvdW50OyArK2kpIHtcbiAgICAgICAgICAgIGdlb3NldC5WZXJ0ZXhHcm91cFtpXSA9IHN0YXRlLnVpbnQ4KCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuZXhwZWN0S2V5d29yZCgnTVRHQycsICdJbmNvcnJlY3QgZ2Vvc2V0cyBmb3JtYXQnKTtcbiAgICAgICAgdmFyIGdyb3Vwc0NvdW50ID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZ2Vvc2V0Lkdyb3VwcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3Vwc0NvdW50OyArK2kpIHtcbiAgICAgICAgICAgIC8vIG5ldyBBcnJheShhcnJheSBsZW5ndGgpXG4gICAgICAgICAgICBnZW9zZXQuR3JvdXBzW2ldID0gbmV3IEFycmF5KHN0YXRlLmludDMyKCkpO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLmV4cGVjdEtleXdvcmQoJ01BVFMnLCAnSW5jb3JyZWN0IGdlb3NldHMgZm9ybWF0Jyk7XG4gICAgICAgIGdlb3NldC5Ub3RhbEdyb3Vwc0NvdW50ID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgdmFyIGdyb3VwSW5kZXggPSAwO1xuICAgICAgICB2YXIgZ3JvdXBDb3VudGVyID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnZW9zZXQuVG90YWxHcm91cHNDb3VudDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoZ3JvdXBJbmRleCA+PSBnZW9zZXQuR3JvdXBzW2dyb3VwQ291bnRlcl0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgZ3JvdXBDb3VudGVyKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnZW9zZXQuR3JvdXBzW2dyb3VwQ291bnRlcl1bZ3JvdXBJbmRleCsrXSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgZ2Vvc2V0Lk1hdGVyaWFsSUQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBnZW9zZXQuU2VsZWN0aW9uR3JvdXAgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBnZW9zZXQuVW5zZWxlY3RhYmxlID0gc3RhdGUuaW50MzIoKSA+IDA7XG4gICAgICAgIHBhcnNlRXh0ZW50KGdlb3NldCwgc3RhdGUpO1xuICAgICAgICB2YXIgZ2Vvc2V0QW5pbUNvdW50ID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZ2Vvc2V0LkFuaW1zID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2Vvc2V0QW5pbUNvdW50OyArK2kpIHtcbiAgICAgICAgICAgIHZhciBnZW9zZXRBbmltID0ge307XG4gICAgICAgICAgICBwYXJzZUV4dGVudChnZW9zZXRBbmltLCBzdGF0ZSk7XG4gICAgICAgICAgICBnZW9zZXQuQW5pbXMucHVzaChnZW9zZXRBbmltKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdVVkFTJywgJ0luY29ycmVjdCBnZW9zZXRzIGZvcm1hdCcpO1xuICAgICAgICB2YXIgdGV4dHVyZUNodW5rQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBnZW9zZXQuVFZlcnRpY2VzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dHVyZUNodW5rQ291bnQ7ICsraSkge1xuICAgICAgICAgICAgc3RhdGUuZXhwZWN0S2V5d29yZCgnVVZCUycsICdJbmNvcnJlY3QgZ2Vvc2V0cyBmb3JtYXQnKTtcbiAgICAgICAgICAgIHZhciB0ZXh0dXJlQ29vcmRzQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICAgICAgdmFyIHR2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZUNvb3Jkc0NvdW50ICogMik7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRleHR1cmVDb29yZHNDb3VudCAqIDI7ICsraikge1xuICAgICAgICAgICAgICAgIHR2ZXJ0aWNlc1tqXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdlb3NldC5UVmVydGljZXMucHVzaCh0dmVydGljZXMpO1xuICAgICAgICB9XG4gICAgICAgIG1vZGVsLkdlb3NldHMucHVzaChnZW9zZXQpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlR2Vvc2V0QW5pbXMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIGFuaW1TdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICAgICAgdmFyIGFuaW1TaXplID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgdmFyIGdlb3NldEFuaW0gPSB7fTtcbiAgICAgICAgZ2Vvc2V0QW5pbS5BbHBoYSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZ2Vvc2V0QW5pbS5GbGFncyA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGdlb3NldEFuaW0uQ29sb3IgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7ICsraSkge1xuICAgICAgICAgICAgZ2Vvc2V0QW5pbS5Db2xvcltpXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgfVxuICAgICAgICBnZW9zZXRBbmltLkdlb3NldElkID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgaWYgKGdlb3NldEFuaW0uR2Vvc2V0SWQgPT09IE5PTkUpIHtcbiAgICAgICAgICAgIGdlb3NldEFuaW0uR2Vvc2V0SWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBhbmltU3RhcnRQb3MgKyBhbmltU2l6ZSkge1xuICAgICAgICAgICAgdmFyIGtleXdvcmQgPSBzdGF0ZS5rZXl3b3JkKCk7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0tHQU8nKSB7XG4gICAgICAgICAgICAgICAgZ2Vvc2V0QW5pbS5BbHBoYSA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLR0FDJykge1xuICAgICAgICAgICAgICAgIGdlb3NldEFuaW0uQ29sb3IgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdCBHZW9zZXRBbmltIGNodW5rIGRhdGEgJyArIGtleXdvcmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1vZGVsLkdlb3NldEFuaW1zLnB1c2goZ2Vvc2V0QW5pbSk7XG4gICAgfVxufVxudmFyIE1PREVMX05PREVfTkFNRV9MRU5HVEggPSAweDUwO1xuZnVuY3Rpb24gcGFyc2VOb2RlKG1vZGVsLCBub2RlLCBzdGF0ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB2YXIgc2l6ZSA9IHN0YXRlLmludDMyKCk7XG4gICAgbm9kZS5OYW1lID0gc3RhdGUuc3RyKE1PREVMX05PREVfTkFNRV9MRU5HVEgpO1xuICAgIG5vZGUuT2JqZWN0SWQgPSBzdGF0ZS5pbnQzMigpO1xuICAgIGlmIChub2RlLk9iamVjdElkID09PSBOT05FKSB7XG4gICAgICAgIG5vZGUuT2JqZWN0SWQgPSBudWxsO1xuICAgIH1cbiAgICBub2RlLlBhcmVudCA9IHN0YXRlLmludDMyKCk7XG4gICAgaWYgKG5vZGUuUGFyZW50ID09PSBOT05FKSB7XG4gICAgICAgIG5vZGUuUGFyZW50ID0gbnVsbDtcbiAgICB9XG4gICAgbm9kZS5GbGFncyA9IHN0YXRlLmludDMyKCk7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICB2YXIga2V5d29yZCA9IHN0YXRlLmtleXdvcmQoKTtcbiAgICAgICAgaWYgKGtleXdvcmQgPT09ICdLR1RSJykge1xuICAgICAgICAgICAgbm9kZS5UcmFuc2xhdGlvbiA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS0dSVCcpIHtcbiAgICAgICAgICAgIG5vZGUuUm90YXRpb24gPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUNCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tHU0MnKSB7XG4gICAgICAgICAgICBub2RlLlNjYWxpbmcgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdCBub2RlIGNodW5rIGRhdGEgJyArIGtleXdvcmQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG1vZGVsLk5vZGVzW25vZGUuT2JqZWN0SWRdID0gbm9kZTtcbn1cbmZ1bmN0aW9uIHBhcnNlQm9uZXMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIGJvbmUgPSB7fTtcbiAgICAgICAgcGFyc2VOb2RlKG1vZGVsLCBib25lLCBzdGF0ZSk7XG4gICAgICAgIGJvbmUuR2Vvc2V0SWQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBpZiAoYm9uZS5HZW9zZXRJZCA9PT0gTk9ORSkge1xuICAgICAgICAgICAgYm9uZS5HZW9zZXRJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgYm9uZS5HZW9zZXRBbmltSWQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBpZiAoYm9uZS5HZW9zZXRBbmltSWQgPT09IE5PTkUpIHtcbiAgICAgICAgICAgIGJvbmUuR2Vvc2V0QW5pbUlkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5Cb25lcy5wdXNoKGJvbmUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlSGVscGVycyhtb2RlbCwgc3RhdGUsIHNpemUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICB2YXIgaGVscGVyID0ge307XG4gICAgICAgIHBhcnNlTm9kZShtb2RlbCwgaGVscGVyLCBzdGF0ZSk7XG4gICAgICAgIG1vZGVsLkhlbHBlcnMucHVzaChoZWxwZXIpO1xuICAgIH1cbn1cbnZhciBNT0RFTF9BVFRBQ0hNRU5UX1BBVEhfTEVOR1RIID0gMHgxMDA7XG5mdW5jdGlvbiBwYXJzZUF0dGFjaG1lbnRzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciBhdHRhY2htZW50U3RhcnQgPSBzdGF0ZS5wb3M7XG4gICAgICAgIHZhciBhdHRhY2htZW50U2l6ZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIHZhciBhdHRhY2htZW50ID0ge307XG4gICAgICAgIHBhcnNlTm9kZShtb2RlbCwgYXR0YWNobWVudCwgc3RhdGUpO1xuICAgICAgICBhdHRhY2htZW50LlBhdGggPSBzdGF0ZS5zdHIoTU9ERUxfQVRUQUNITUVOVF9QQVRIX0xFTkdUSCk7XG4gICAgICAgIHN0YXRlLmludDMyKCk7IC8vIHVua25vd24gNC1ieXRlXG4gICAgICAgIGF0dGFjaG1lbnQuQXR0YWNobWVudElEID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgaWYgKHN0YXRlLnBvcyA8IGF0dGFjaG1lbnRTdGFydCArIGF0dGFjaG1lbnRTaXplKSB7XG4gICAgICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdLQVRWJywgJ0luY29ycmVjdCBhdHRhY2htZW50IGNodW5rIGRhdGEnKTtcbiAgICAgICAgICAgIGF0dGFjaG1lbnQuVmlzaWJpbGl0eSA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5BdHRhY2htZW50cy5wdXNoKGF0dGFjaG1lbnQpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlUGl2b3RQb2ludHMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHBvaW50c0NvdW50ID0gc2l6ZSAvICg0ICogMyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHNDb3VudDsgKytpKSB7XG4gICAgICAgIG1vZGVsLlBpdm90UG9pbnRzW2ldID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgbW9kZWwuUGl2b3RQb2ludHNbaV1bMF0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIG1vZGVsLlBpdm90UG9pbnRzW2ldWzFdID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBtb2RlbC5QaXZvdFBvaW50c1tpXVsyXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZUV2ZW50T2JqZWN0cyhtb2RlbCwgc3RhdGUsIHNpemUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICB2YXIgZXZlbnRPYmplY3QgPSB7fTtcbiAgICAgICAgcGFyc2VOb2RlKG1vZGVsLCBldmVudE9iamVjdCwgc3RhdGUpO1xuICAgICAgICBzdGF0ZS5leHBlY3RLZXl3b3JkKCdLRVZUJywgJ0luY29ycmVjdCBFdmVudE9iamVjdCBjaHVuayBkYXRhJyk7XG4gICAgICAgIHZhciBldmVudFRyYWNrQ291bnQgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBldmVudE9iamVjdC5FdmVudFRyYWNrID0gbmV3IFVpbnQzMkFycmF5KGV2ZW50VHJhY2tDb3VudCk7XG4gICAgICAgIHN0YXRlLmludDMyKCk7IC8vIHVudXNlZCA0LWJ5dGU/XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnRUcmFja0NvdW50OyArK2kpIHtcbiAgICAgICAgICAgIGV2ZW50T2JqZWN0LkV2ZW50VHJhY2tbaV0gPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICB9XG4gICAgICAgIG1vZGVsLkV2ZW50T2JqZWN0cy5wdXNoKGV2ZW50T2JqZWN0KTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZUNvbGxpc2lvblNoYXBlcyhtb2RlbCwgc3RhdGUsIHNpemUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICB2YXIgY29sbGlzaW9uU2hhcGUgPSB7fTtcbiAgICAgICAgcGFyc2VOb2RlKG1vZGVsLCBjb2xsaXNpb25TaGFwZSwgc3RhdGUpO1xuICAgICAgICBjb2xsaXNpb25TaGFwZS5TaGFwZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGlmIChjb2xsaXNpb25TaGFwZS5TaGFwZSA9PT0gbW9kZWxfMS5Db2xsaXNpb25TaGFwZVR5cGUuQm94KSB7XG4gICAgICAgICAgICBjb2xsaXNpb25TaGFwZS5WZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoNik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb2xsaXNpb25TaGFwZS5WZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xsaXNpb25TaGFwZS5WZXJ0aWNlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgY29sbGlzaW9uU2hhcGUuVmVydGljZXNbaV0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbGxpc2lvblNoYXBlLlNoYXBlID09PSBtb2RlbF8xLkNvbGxpc2lvblNoYXBlVHlwZS5TcGhlcmUpIHtcbiAgICAgICAgICAgIGNvbGxpc2lvblNoYXBlLkJvdW5kc1JhZGl1cyA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5Db2xsaXNpb25TaGFwZXMucHVzaChjb2xsaXNpb25TaGFwZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gcGFyc2VHbG9iYWxTZXF1ZW5jZXMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIG1vZGVsLkdsb2JhbFNlcXVlbmNlcyA9IFtdO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgbW9kZWwuR2xvYmFsU2VxdWVuY2VzLnB1c2goc3RhdGUuaW50MzIoKSk7XG4gICAgfVxufVxudmFyIE1PREVMX1BBUlRJQ0xFX0VNSVRURVJfUEFUSF9MRU5HVEggPSAweDEwMDtcbmZ1bmN0aW9uIHBhcnNlUGFydGljbGVFbWl0dGVycyhtb2RlbCwgc3RhdGUsIHNpemUpIHtcbiAgICB2YXIgc3RhcnRQb3MgPSBzdGF0ZS5wb3M7XG4gICAgd2hpbGUgKHN0YXRlLnBvcyA8IHN0YXJ0UG9zICsgc2l6ZSkge1xuICAgICAgICB2YXIgZW1pdHRlclN0YXJ0ID0gc3RhdGUucG9zO1xuICAgICAgICB2YXIgZW1pdHRlclNpemUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICB2YXIgZW1pdHRlciA9IHt9O1xuICAgICAgICBwYXJzZU5vZGUobW9kZWwsIGVtaXR0ZXIsIHN0YXRlKTtcbiAgICAgICAgZW1pdHRlci5FbWlzc2lvblJhdGUgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuR3Jhdml0eSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZW1pdHRlci5Mb25naXR1ZGUgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuTGF0aXR1ZGUgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuUGF0aCA9IHN0YXRlLnN0cihNT0RFTF9QQVJUSUNMRV9FTUlUVEVSX1BBVEhfTEVOR1RIKTtcbiAgICAgICAgc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZW1pdHRlci5MaWZlU3BhbiA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZW1pdHRlci5Jbml0VmVsb2NpdHkgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBlbWl0dGVyU3RhcnQgKyBlbWl0dGVyU2l6ZSkge1xuICAgICAgICAgICAgdmFyIGtleXdvcmQgPSBzdGF0ZS5rZXl3b3JkKCk7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0tQRVYnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5WaXNpYmlsaXR5ID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tQRUUnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5FbWlzc2lvblJhdGUgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1BFRycpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLkdyYXZpdHkgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1BMTicpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLkxvbmdpdHVkZSA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLUExUJykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuTGF0aXR1ZGUgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1BFTCcpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLkxpZmVTcGFuID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tQRVMnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5Jbml0VmVsb2NpdHkgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdCBwYXJ0aWNsZSBlbWl0dGVyIGNodW5rIGRhdGEgJyArIGtleXdvcmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1vZGVsLlBhcnRpY2xlRW1pdHRlcnMucHVzaChlbWl0dGVyKTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZVBhcnRpY2xlRW1pdHRlcnMyKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciBlbWl0dGVyU3RhcnQgPSBzdGF0ZS5wb3M7XG4gICAgICAgIHZhciBlbWl0dGVyU2l6ZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIHZhciBlbWl0dGVyID0ge307XG4gICAgICAgIHBhcnNlTm9kZShtb2RlbCwgZW1pdHRlciwgc3RhdGUpO1xuICAgICAgICBlbWl0dGVyLlNwZWVkID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLlZhcmlhdGlvbiA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZW1pdHRlci5MYXRpdHVkZSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZW1pdHRlci5HcmF2aXR5ID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLkxpZmVTcGFuID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLkVtaXNzaW9uUmF0ZSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZW1pdHRlci5XaWR0aCA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgZW1pdHRlci5MZW5ndGggPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuRmlsdGVyTW9kZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuUm93cyA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuQ29sdW1ucyA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIHZhciBmcmFtZUZsYWdzID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZW1pdHRlci5GcmFtZUZsYWdzID0gMDtcbiAgICAgICAgaWYgKGZyYW1lRmxhZ3MgPT09IDAgfHwgZnJhbWVGbGFncyA9PT0gMikge1xuICAgICAgICAgICAgZW1pdHRlci5GcmFtZUZsYWdzIHw9IG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLkhlYWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZyYW1lRmxhZ3MgPT09IDEgfHwgZnJhbWVGbGFncyA9PT0gMikge1xuICAgICAgICAgICAgZW1pdHRlci5GcmFtZUZsYWdzIHw9IG1vZGVsXzEuUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzLlRhaWw7XG4gICAgICAgIH1cbiAgICAgICAgZW1pdHRlci5UYWlsTGVuZ3RoID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBlbWl0dGVyLlRpbWUgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuU2VnbWVudENvbG9yID0gW107XG4gICAgICAgIC8vIGFsd2F5cyAzIHNlZ21lbnRzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgKytpKSB7XG4gICAgICAgICAgICBlbWl0dGVyLlNlZ21lbnRDb2xvcltpXSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgICAgICAvLyAgcmdiIG9yZGVyLCBpbnZlcnNlIGZyb20gbWRsXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDM7ICsraikge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuU2VnbWVudENvbG9yW2ldW2pdID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVtaXR0ZXIuQWxwaGEgPSBuZXcgVWludDhBcnJheSgzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyArK2kpIHtcbiAgICAgICAgICAgIGVtaXR0ZXIuQWxwaGFbaV0gPSBzdGF0ZS51aW50OCgpO1xuICAgICAgICB9XG4gICAgICAgIGVtaXR0ZXIuUGFydGljbGVTY2FsaW5nID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyArK2kpIHtcbiAgICAgICAgICAgIGVtaXR0ZXIuUGFydGljbGVTY2FsaW5nW2ldID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBbJ0xpZmVTcGFuVVZBbmltJywgJ0RlY2F5VVZBbmltJywgJ1RhaWxVVkFuaW0nLCAnVGFpbERlY2F5VVZBbmltJ107IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGFydCA9IF9hW19pXTtcbiAgICAgICAgICAgIGVtaXR0ZXJbcGFydF0gPSBuZXcgVWludDMyQXJyYXkoMyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7ICsraSkge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXJbcGFydF1baV0gPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVtaXR0ZXIuVGV4dHVyZUlEID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgaWYgKGVtaXR0ZXIuVGV4dHVyZUlEID09PSBOT05FKSB7XG4gICAgICAgICAgICBlbWl0dGVyLlRleHR1cmVJRCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZW1pdHRlci5TcXVpcnQgPSBzdGF0ZS5pbnQzMigpID4gMDtcbiAgICAgICAgZW1pdHRlci5Qcmlvcml0eVBsYW5lID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgZW1pdHRlci5SZXBsYWNlYWJsZUlkID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgd2hpbGUgKHN0YXRlLnBvcyA8IGVtaXR0ZXJTdGFydCArIGVtaXR0ZXJTaXplKSB7XG4gICAgICAgICAgICB2YXIga2V5d29yZCA9IHN0YXRlLmtleXdvcmQoKTtcbiAgICAgICAgICAgIGlmIChrZXl3b3JkID09PSAnS1AyVicpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLlZpc2liaWxpdHkgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1AyRScpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLkVtaXNzaW9uUmF0ZSA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLUDJXJykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuV2lkdGggPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1AyTicpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLkxlbmd0aCA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLUDJTJykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuU3BlZWQgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1AyTCcpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLkxhdGl0dWRlID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tQMkcnKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5HcmF2aXR5ID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tQMlInKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5WYXJpYXRpb24gPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdCBwYXJ0aWNsZSBlbWl0dGVyMiBjaHVuayBkYXRhICcgKyBrZXl3b3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5QYXJ0aWNsZUVtaXR0ZXJzMi5wdXNoKGVtaXR0ZXIpO1xuICAgIH1cbn1cbnZhciBNT0RFTF9DQU1FUkFfTkFNRV9MRU5HVEggPSAweDUwO1xuZnVuY3Rpb24gcGFyc2VDYW1lcmFzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciBjYW1lcmFTdGFydCA9IHN0YXRlLnBvcztcbiAgICAgICAgdmFyIGNhbWVyYVNpemUgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICB2YXIgY2FtZXJhID0ge307XG4gICAgICAgIGNhbWVyYS5OYW1lID0gc3RhdGUuc3RyKE1PREVMX0NBTUVSQV9OQU1FX0xFTkdUSCk7XG4gICAgICAgIGNhbWVyYS5Qb3NpdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgIGNhbWVyYS5Qb3NpdGlvblswXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgY2FtZXJhLlBvc2l0aW9uWzFdID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBjYW1lcmEuUG9zaXRpb25bMl0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGNhbWVyYS5GaWVsZE9mVmlldyA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgY2FtZXJhLkZhckNsaXAgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGNhbWVyYS5OZWFyQ2xpcCA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgY2FtZXJhLlRhcmdldFBvc2l0aW9uID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgY2FtZXJhLlRhcmdldFBvc2l0aW9uWzBdID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBjYW1lcmEuVGFyZ2V0UG9zaXRpb25bMV0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGNhbWVyYS5UYXJnZXRQb3NpdGlvblsyXSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgd2hpbGUgKHN0YXRlLnBvcyA8IGNhbWVyYVN0YXJ0ICsgY2FtZXJhU2l6ZSkge1xuICAgICAgICAgICAgdmFyIGtleXdvcmQgPSBzdGF0ZS5rZXl3b3JkKCk7XG4gICAgICAgICAgICBpZiAoa2V5d29yZCA9PT0gJ0tDVFInKSB7XG4gICAgICAgICAgICAgICAgY2FtZXJhLlRyYW5zbGF0aW9uID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tUVFInKSB7XG4gICAgICAgICAgICAgICAgY2FtZXJhLlRhcmdldFRyYW5zbGF0aW9uID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tDUkwnKSB7XG4gICAgICAgICAgICAgICAgY2FtZXJhLlJvdGF0aW9uID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3QgY2FtZXJhIGNodW5rIGRhdGEgJyArIGtleXdvcmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1vZGVsLkNhbWVyYXMucHVzaChjYW1lcmEpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlTGlnaHRzKG1vZGVsLCBzdGF0ZSwgc2l6ZSkge1xuICAgIHZhciBzdGFydFBvcyA9IHN0YXRlLnBvcztcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhcnRQb3MgKyBzaXplKSB7XG4gICAgICAgIHZhciBsaWdodFN0YXJ0ID0gc3RhdGUucG9zO1xuICAgICAgICB2YXIgbGlnaHRTaXplID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgdmFyIGxpZ2h0ID0ge307XG4gICAgICAgIHBhcnNlTm9kZShtb2RlbCwgbGlnaHQsIHN0YXRlKTtcbiAgICAgICAgbGlnaHQuTGlnaHRUeXBlID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgbGlnaHQuQXR0ZW51YXRpb25TdGFydCA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgbGlnaHQuQXR0ZW51YXRpb25FbmQgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGxpZ2h0LkNvbG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgICAgLy8gIHJnYiBvcmRlciwgaW52ZXJzZSBmcm9tIG1kbFxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDM7ICsraikge1xuICAgICAgICAgICAgbGlnaHQuQ29sb3Jbal0gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGlnaHQuSW50ZW5zaXR5ID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICBsaWdodC5BbWJDb2xvciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICAgIC8vICByZ2Igb3JkZXIsIGludmVyc2UgZnJvbSBtZGxcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAzOyArK2opIHtcbiAgICAgICAgICAgIGxpZ2h0LkFtYkNvbG9yW2pdID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICB9XG4gICAgICAgIGxpZ2h0LkFtYkludGVuc2l0eSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgd2hpbGUgKHN0YXRlLnBvcyA8IGxpZ2h0U3RhcnQgKyBsaWdodFNpemUpIHtcbiAgICAgICAgICAgIHZhciBrZXl3b3JkID0gc3RhdGUua2V5d29yZCgpO1xuICAgICAgICAgICAgaWYgKGtleXdvcmQgPT09ICdLTEFWJykge1xuICAgICAgICAgICAgICAgIGxpZ2h0LlZpc2liaWxpdHkgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS0xBQycpIHtcbiAgICAgICAgICAgICAgICBsaWdodC5Db2xvciA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLTEFJJykge1xuICAgICAgICAgICAgICAgIGxpZ2h0LkludGVuc2l0eSA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLTEJDJykge1xuICAgICAgICAgICAgICAgIGxpZ2h0LkFtYkNvbG9yID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tMQkknKSB7XG4gICAgICAgICAgICAgICAgbGlnaHQuQW1iSW50ZW5zaXR5ID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tMQVMnKSB7XG4gICAgICAgICAgICAgICAgbGlnaHQuQXR0ZW51YXRpb25TdGFydCA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuSU5UMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS0xBRScpIHtcbiAgICAgICAgICAgICAgICBsaWdodC5BdHRlbnVhdGlvbkVuZCA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuSU5UMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdCBsaWdodCBjaHVuayBkYXRhICcgKyBrZXl3b3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtb2RlbC5MaWdodHMucHVzaChsaWdodCk7XG4gICAgfVxufVxuZnVuY3Rpb24gcGFyc2VUZXh0dXJlQW5pbXMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIGFuaW1TdGFydCA9IHN0YXRlLnBvcztcbiAgICAgICAgdmFyIGFuaW1TaXplID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgdmFyIGFuaW0gPSB7fTtcbiAgICAgICAgd2hpbGUgKHN0YXRlLnBvcyA8IGFuaW1TdGFydCArIGFuaW1TaXplKSB7XG4gICAgICAgICAgICB2YXIga2V5d29yZCA9IHN0YXRlLmtleXdvcmQoKTtcbiAgICAgICAgICAgIGlmIChrZXl3b3JkID09PSAnS1RBVCcpIHtcbiAgICAgICAgICAgICAgICBhbmltLlRyYW5zbGF0aW9uID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tUQVInKSB7XG4gICAgICAgICAgICAgICAgYW5pbS5Sb3RhdGlvbiA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLVEFTJykge1xuICAgICAgICAgICAgICAgIGFuaW0uU2NhbGluZyA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5jb3JyZWN0IGxpZ2h0IGNodW5rIGRhdGEgJyArIGtleXdvcmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1vZGVsLlRleHR1cmVBbmltcy5wdXNoKGFuaW0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBhcnNlUmliYm9uRW1pdHRlcnMobW9kZWwsIHN0YXRlLCBzaXplKSB7XG4gICAgdmFyIHN0YXJ0UG9zID0gc3RhdGUucG9zO1xuICAgIHdoaWxlIChzdGF0ZS5wb3MgPCBzdGFydFBvcyArIHNpemUpIHtcbiAgICAgICAgdmFyIGVtaXR0ZXJTdGFydCA9IHN0YXRlLnBvcztcbiAgICAgICAgdmFyIGVtaXR0ZXJTaXplID0gc3RhdGUuaW50MzIoKTtcbiAgICAgICAgdmFyIGVtaXR0ZXIgPSB7fTtcbiAgICAgICAgcGFyc2VOb2RlKG1vZGVsLCBlbWl0dGVyLCBzdGF0ZSk7XG4gICAgICAgIGVtaXR0ZXIuSGVpZ2h0QWJvdmUgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuSGVpZ2h0QmVsb3cgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuQWxwaGEgPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuQ29sb3IgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgICAvLyAgcmdiIG9yZGVyLCBpbnZlcnNlIGZyb20gbWRsXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMzsgKytqKSB7XG4gICAgICAgICAgICBlbWl0dGVyLkNvbG9yW2pdID0gc3RhdGUuZmxvYXQzMigpO1xuICAgICAgICB9XG4gICAgICAgIGVtaXR0ZXIuTGlmZVNwYW4gPSBzdGF0ZS5mbG9hdDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuVGV4dHVyZVNsb3QgPSBzdGF0ZS5pbnQzMigpO1xuICAgICAgICBlbWl0dGVyLkVtaXNzaW9uUmF0ZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuUm93cyA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuQ29sdW1ucyA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuTWF0ZXJpYWxJRCA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGVtaXR0ZXIuR3Jhdml0eSA9IHN0YXRlLmZsb2F0MzIoKTtcbiAgICAgICAgd2hpbGUgKHN0YXRlLnBvcyA8IGVtaXR0ZXJTdGFydCArIGVtaXR0ZXJTaXplKSB7XG4gICAgICAgICAgICB2YXIga2V5d29yZCA9IHN0YXRlLmtleXdvcmQoKTtcbiAgICAgICAgICAgIGlmIChrZXl3b3JkID09PSAnS1JWUycpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLlZpc2liaWxpdHkgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1JIQScpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLkhlaWdodEFib3ZlID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5GTE9BVDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5d29yZCA9PT0gJ0tSSEInKSB7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5IZWlnaHRCZWxvdyA9IHN0YXRlLmFuaW1WZWN0b3IoQW5pbVZlY3RvclR5cGUuRkxPQVQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleXdvcmQgPT09ICdLUkFMJykge1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIuQWxwaGEgPSBzdGF0ZS5hbmltVmVjdG9yKEFuaW1WZWN0b3JUeXBlLkZMT0FUMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXl3b3JkID09PSAnS1JUWCcpIHtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLlRleHR1cmVTbG90ID0gc3RhdGUuYW5pbVZlY3RvcihBbmltVmVjdG9yVHlwZS5JTlQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5jb3JyZWN0IHJpYmJvbiBlbWl0dGVyIGNodW5rIGRhdGEgJyArIGtleXdvcmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1vZGVsLlJpYmJvbkVtaXR0ZXJzLnB1c2goZW1pdHRlcik7XG4gICAgfVxufVxudmFyIHBhcnNlcnMgPSB7XG4gICAgVkVSUzogcGFyc2VWZXJzaW9uLFxuICAgIE1PREw6IHBhcnNlTW9kZWxJbmZvLFxuICAgIFNFUVM6IHBhcnNlU2VxdWVuY2VzLFxuICAgIE1UTFM6IHBhcnNlTWF0ZXJpYWxzLFxuICAgIFRFWFM6IHBhcnNlVGV4dHVyZXMsXG4gICAgR0VPUzogcGFyc2VHZW9zZXRzLFxuICAgIEdFT0E6IHBhcnNlR2Vvc2V0QW5pbXMsXG4gICAgQk9ORTogcGFyc2VCb25lcyxcbiAgICBIRUxQOiBwYXJzZUhlbHBlcnMsXG4gICAgQVRDSDogcGFyc2VBdHRhY2htZW50cyxcbiAgICBQSVZUOiBwYXJzZVBpdm90UG9pbnRzLFxuICAgIEVWVFM6IHBhcnNlRXZlbnRPYmplY3RzLFxuICAgIENMSUQ6IHBhcnNlQ29sbGlzaW9uU2hhcGVzLFxuICAgIEdMQlM6IHBhcnNlR2xvYmFsU2VxdWVuY2VzLFxuICAgIFBSRU06IHBhcnNlUGFydGljbGVFbWl0dGVycyxcbiAgICBQUkUyOiBwYXJzZVBhcnRpY2xlRW1pdHRlcnMyLFxuICAgIENBTVM6IHBhcnNlQ2FtZXJhcyxcbiAgICBMSVRFOiBwYXJzZUxpZ2h0cyxcbiAgICBUWEFOOiBwYXJzZVRleHR1cmVBbmltcyxcbiAgICBSSUJCOiBwYXJzZVJpYmJvbkVtaXR0ZXJzXG59O1xuZnVuY3Rpb24gcGFyc2UoYXJyYXlCdWZmZXIpIHtcbiAgICB2YXIgc3RhdGUgPSBuZXcgU3RhdGUoYXJyYXlCdWZmZXIpO1xuICAgIGlmIChzdGF0ZS5rZXl3b3JkKCkgIT09ICdNRExYJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIG1keCBtb2RlbCcpO1xuICAgIH1cbiAgICB2YXIgbW9kZWwgPSB7XG4gICAgICAgIC8vIGRlZmF1bHRcbiAgICAgICAgVmVyc2lvbjogODAwLFxuICAgICAgICBJbmZvOiB7XG4gICAgICAgICAgICBOYW1lOiAnJyxcbiAgICAgICAgICAgIE1pbmltdW1FeHRlbnQ6IG51bGwsXG4gICAgICAgICAgICBNYXhpbXVtRXh0ZW50OiBudWxsLFxuICAgICAgICAgICAgQm91bmRzUmFkaXVzOiAwLFxuICAgICAgICAgICAgQmxlbmRUaW1lOiAxNTBcbiAgICAgICAgfSxcbiAgICAgICAgU2VxdWVuY2VzOiBbXSxcbiAgICAgICAgR2xvYmFsU2VxdWVuY2VzOiBbXSxcbiAgICAgICAgVGV4dHVyZXM6IFtdLFxuICAgICAgICBNYXRlcmlhbHM6IFtdLFxuICAgICAgICBUZXh0dXJlQW5pbXM6IFtdLFxuICAgICAgICBHZW9zZXRzOiBbXSxcbiAgICAgICAgR2Vvc2V0QW5pbXM6IFtdLFxuICAgICAgICBCb25lczogW10sXG4gICAgICAgIEhlbHBlcnM6IFtdLFxuICAgICAgICBBdHRhY2htZW50czogW10sXG4gICAgICAgIEV2ZW50T2JqZWN0czogW10sXG4gICAgICAgIFBhcnRpY2xlRW1pdHRlcnM6IFtdLFxuICAgICAgICBQYXJ0aWNsZUVtaXR0ZXJzMjogW10sXG4gICAgICAgIENhbWVyYXM6IFtdLFxuICAgICAgICBMaWdodHM6IFtdLFxuICAgICAgICBSaWJib25FbWl0dGVyczogW10sXG4gICAgICAgIENvbGxpc2lvblNoYXBlczogW10sXG4gICAgICAgIFBpdm90UG9pbnRzOiBbXSxcbiAgICAgICAgTm9kZXM6IFtdXG4gICAgfTtcbiAgICB3aGlsZSAoc3RhdGUucG9zIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgICAgIHZhciBrZXl3b3JkID0gc3RhdGUua2V5d29yZCgpO1xuICAgICAgICB2YXIgc2l6ZSA9IHN0YXRlLmludDMyKCk7XG4gICAgICAgIGlmIChrZXl3b3JkIGluIHBhcnNlcnMpIHtcbiAgICAgICAgICAgIHBhcnNlcnNba2V5d29yZF0obW9kZWwsIHN0YXRlLCBzaXplKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBncm91cCAnICsga2V5d29yZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb2RlbC5Ob2Rlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAobW9kZWwuTm9kZXNbaV0gJiYgbW9kZWwuUGl2b3RQb2ludHNbaV0pIHtcbiAgICAgICAgICAgIG1vZGVsLk5vZGVzW2ldLlBpdm90UG9pbnQgPSBtb2RlbC5QaXZvdFBvaW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbW9kZWw7XG59XG5leHBvcnRzLnBhcnNlID0gcGFyc2U7XG52YXIgX2E7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wYXJzZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBUZXh0dXJlRmxhZ3M7XG4oZnVuY3Rpb24gKFRleHR1cmVGbGFncykge1xuICAgIFRleHR1cmVGbGFnc1tUZXh0dXJlRmxhZ3NbXCJXcmFwV2lkdGhcIl0gPSAxXSA9IFwiV3JhcFdpZHRoXCI7XG4gICAgVGV4dHVyZUZsYWdzW1RleHR1cmVGbGFnc1tcIldyYXBIZWlnaHRcIl0gPSAyXSA9IFwiV3JhcEhlaWdodFwiO1xufSkoVGV4dHVyZUZsYWdzID0gZXhwb3J0cy5UZXh0dXJlRmxhZ3MgfHwgKGV4cG9ydHMuVGV4dHVyZUZsYWdzID0ge30pKTtcbnZhciBGaWx0ZXJNb2RlO1xuKGZ1bmN0aW9uIChGaWx0ZXJNb2RlKSB7XG4gICAgRmlsdGVyTW9kZVtGaWx0ZXJNb2RlW1wiTm9uZVwiXSA9IDBdID0gXCJOb25lXCI7XG4gICAgRmlsdGVyTW9kZVtGaWx0ZXJNb2RlW1wiVHJhbnNwYXJlbnRcIl0gPSAxXSA9IFwiVHJhbnNwYXJlbnRcIjtcbiAgICBGaWx0ZXJNb2RlW0ZpbHRlck1vZGVbXCJCbGVuZFwiXSA9IDJdID0gXCJCbGVuZFwiO1xuICAgIEZpbHRlck1vZGVbRmlsdGVyTW9kZVtcIkFkZGl0aXZlXCJdID0gM10gPSBcIkFkZGl0aXZlXCI7XG4gICAgRmlsdGVyTW9kZVtGaWx0ZXJNb2RlW1wiQWRkQWxwaGFcIl0gPSA0XSA9IFwiQWRkQWxwaGFcIjtcbiAgICBGaWx0ZXJNb2RlW0ZpbHRlck1vZGVbXCJNb2R1bGF0ZVwiXSA9IDVdID0gXCJNb2R1bGF0ZVwiO1xuICAgIEZpbHRlck1vZGVbRmlsdGVyTW9kZVtcIk1vZHVsYXRlMnhcIl0gPSA2XSA9IFwiTW9kdWxhdGUyeFwiO1xufSkoRmlsdGVyTW9kZSA9IGV4cG9ydHMuRmlsdGVyTW9kZSB8fCAoZXhwb3J0cy5GaWx0ZXJNb2RlID0ge30pKTtcbnZhciBMaW5lVHlwZTtcbihmdW5jdGlvbiAoTGluZVR5cGUpIHtcbiAgICBMaW5lVHlwZVtMaW5lVHlwZVtcIkRvbnRJbnRlcnBcIl0gPSAwXSA9IFwiRG9udEludGVycFwiO1xuICAgIExpbmVUeXBlW0xpbmVUeXBlW1wiTGluZWFyXCJdID0gMV0gPSBcIkxpbmVhclwiO1xuICAgIExpbmVUeXBlW0xpbmVUeXBlW1wiSGVybWl0ZVwiXSA9IDJdID0gXCJIZXJtaXRlXCI7XG4gICAgTGluZVR5cGVbTGluZVR5cGVbXCJCZXppZXJcIl0gPSAzXSA9IFwiQmV6aWVyXCI7XG59KShMaW5lVHlwZSA9IGV4cG9ydHMuTGluZVR5cGUgfHwgKGV4cG9ydHMuTGluZVR5cGUgPSB7fSkpO1xudmFyIExheWVyU2hhZGluZztcbihmdW5jdGlvbiAoTGF5ZXJTaGFkaW5nKSB7XG4gICAgTGF5ZXJTaGFkaW5nW0xheWVyU2hhZGluZ1tcIlVuc2hhZGVkXCJdID0gMV0gPSBcIlVuc2hhZGVkXCI7XG4gICAgTGF5ZXJTaGFkaW5nW0xheWVyU2hhZGluZ1tcIlNwaGVyZUVudk1hcFwiXSA9IDJdID0gXCJTcGhlcmVFbnZNYXBcIjtcbiAgICBMYXllclNoYWRpbmdbTGF5ZXJTaGFkaW5nW1wiVHdvU2lkZWRcIl0gPSAxNl0gPSBcIlR3b1NpZGVkXCI7XG4gICAgTGF5ZXJTaGFkaW5nW0xheWVyU2hhZGluZ1tcIlVuZm9nZ2VkXCJdID0gMzJdID0gXCJVbmZvZ2dlZFwiO1xuICAgIExheWVyU2hhZGluZ1tMYXllclNoYWRpbmdbXCJOb0RlcHRoVGVzdFwiXSA9IDY0XSA9IFwiTm9EZXB0aFRlc3RcIjtcbiAgICBMYXllclNoYWRpbmdbTGF5ZXJTaGFkaW5nW1wiTm9EZXB0aFNldFwiXSA9IDEyOF0gPSBcIk5vRGVwdGhTZXRcIjtcbn0pKExheWVyU2hhZGluZyA9IGV4cG9ydHMuTGF5ZXJTaGFkaW5nIHx8IChleHBvcnRzLkxheWVyU2hhZGluZyA9IHt9KSk7XG52YXIgTWF0ZXJpYWxSZW5kZXJNb2RlO1xuKGZ1bmN0aW9uIChNYXRlcmlhbFJlbmRlck1vZGUpIHtcbiAgICBNYXRlcmlhbFJlbmRlck1vZGVbTWF0ZXJpYWxSZW5kZXJNb2RlW1wiQ29uc3RhbnRDb2xvclwiXSA9IDFdID0gXCJDb25zdGFudENvbG9yXCI7XG4gICAgTWF0ZXJpYWxSZW5kZXJNb2RlW01hdGVyaWFsUmVuZGVyTW9kZVtcIlNvcnRQcmltc0ZhclpcIl0gPSAxNl0gPSBcIlNvcnRQcmltc0ZhclpcIjtcbiAgICBNYXRlcmlhbFJlbmRlck1vZGVbTWF0ZXJpYWxSZW5kZXJNb2RlW1wiRnVsbFJlc29sdXRpb25cIl0gPSAzMl0gPSBcIkZ1bGxSZXNvbHV0aW9uXCI7XG59KShNYXRlcmlhbFJlbmRlck1vZGUgPSBleHBvcnRzLk1hdGVyaWFsUmVuZGVyTW9kZSB8fCAoZXhwb3J0cy5NYXRlcmlhbFJlbmRlck1vZGUgPSB7fSkpO1xudmFyIEdlb3NldEFuaW1GbGFncztcbihmdW5jdGlvbiAoR2Vvc2V0QW5pbUZsYWdzKSB7XG4gICAgR2Vvc2V0QW5pbUZsYWdzW0dlb3NldEFuaW1GbGFnc1tcIkRyb3BTaGFkb3dcIl0gPSAxXSA9IFwiRHJvcFNoYWRvd1wiO1xuICAgIEdlb3NldEFuaW1GbGFnc1tHZW9zZXRBbmltRmxhZ3NbXCJDb2xvclwiXSA9IDJdID0gXCJDb2xvclwiO1xufSkoR2Vvc2V0QW5pbUZsYWdzID0gZXhwb3J0cy5HZW9zZXRBbmltRmxhZ3MgfHwgKGV4cG9ydHMuR2Vvc2V0QW5pbUZsYWdzID0ge30pKTtcbnZhciBOb2RlRmxhZ3M7XG4oZnVuY3Rpb24gKE5vZGVGbGFncykge1xuICAgIE5vZGVGbGFnc1tOb2RlRmxhZ3NbXCJEb250SW5oZXJpdFRyYW5zbGF0aW9uXCJdID0gMV0gPSBcIkRvbnRJbmhlcml0VHJhbnNsYXRpb25cIjtcbiAgICBOb2RlRmxhZ3NbTm9kZUZsYWdzW1wiRG9udEluaGVyaXRSb3RhdGlvblwiXSA9IDJdID0gXCJEb250SW5oZXJpdFJvdGF0aW9uXCI7XG4gICAgTm9kZUZsYWdzW05vZGVGbGFnc1tcIkRvbnRJbmhlcml0U2NhbGluZ1wiXSA9IDRdID0gXCJEb250SW5oZXJpdFNjYWxpbmdcIjtcbiAgICBOb2RlRmxhZ3NbTm9kZUZsYWdzW1wiQmlsbGJvYXJkZWRcIl0gPSA4XSA9IFwiQmlsbGJvYXJkZWRcIjtcbiAgICBOb2RlRmxhZ3NbTm9kZUZsYWdzW1wiQmlsbGJvYXJkZWRMb2NrWFwiXSA9IDE2XSA9IFwiQmlsbGJvYXJkZWRMb2NrWFwiO1xuICAgIE5vZGVGbGFnc1tOb2RlRmxhZ3NbXCJCaWxsYm9hcmRlZExvY2tZXCJdID0gMzJdID0gXCJCaWxsYm9hcmRlZExvY2tZXCI7XG4gICAgTm9kZUZsYWdzW05vZGVGbGFnc1tcIkJpbGxib2FyZGVkTG9ja1pcIl0gPSA2NF0gPSBcIkJpbGxib2FyZGVkTG9ja1pcIjtcbiAgICBOb2RlRmxhZ3NbTm9kZUZsYWdzW1wiQ2FtZXJhQW5jaG9yZWRcIl0gPSAxMjhdID0gXCJDYW1lcmFBbmNob3JlZFwiO1xufSkoTm9kZUZsYWdzID0gZXhwb3J0cy5Ob2RlRmxhZ3MgfHwgKGV4cG9ydHMuTm9kZUZsYWdzID0ge30pKTtcbnZhciBOb2RlVHlwZTtcbihmdW5jdGlvbiAoTm9kZVR5cGUpIHtcbiAgICBOb2RlVHlwZVtOb2RlVHlwZVtcIkhlbHBlclwiXSA9IDBdID0gXCJIZWxwZXJcIjtcbiAgICBOb2RlVHlwZVtOb2RlVHlwZVtcIkJvbmVcIl0gPSAyNTZdID0gXCJCb25lXCI7XG4gICAgTm9kZVR5cGVbTm9kZVR5cGVbXCJMaWdodFwiXSA9IDUxMl0gPSBcIkxpZ2h0XCI7XG4gICAgTm9kZVR5cGVbTm9kZVR5cGVbXCJFdmVudE9iamVjdFwiXSA9IDEwMjRdID0gXCJFdmVudE9iamVjdFwiO1xuICAgIE5vZGVUeXBlW05vZGVUeXBlW1wiQXR0YWNobWVudFwiXSA9IDIwNDhdID0gXCJBdHRhY2htZW50XCI7XG4gICAgTm9kZVR5cGVbTm9kZVR5cGVbXCJQYXJ0aWNsZUVtaXR0ZXJcIl0gPSA0MDk2XSA9IFwiUGFydGljbGVFbWl0dGVyXCI7XG4gICAgTm9kZVR5cGVbTm9kZVR5cGVbXCJDb2xsaXNpb25TaGFwZVwiXSA9IDgxOTJdID0gXCJDb2xsaXNpb25TaGFwZVwiO1xuICAgIE5vZGVUeXBlW05vZGVUeXBlW1wiUmliYm9uRW1pdHRlclwiXSA9IDE2Mzg0XSA9IFwiUmliYm9uRW1pdHRlclwiO1xufSkoTm9kZVR5cGUgPSBleHBvcnRzLk5vZGVUeXBlIHx8IChleHBvcnRzLk5vZGVUeXBlID0ge30pKTtcbnZhciBDb2xsaXNpb25TaGFwZVR5cGU7XG4oZnVuY3Rpb24gKENvbGxpc2lvblNoYXBlVHlwZSkge1xuICAgIENvbGxpc2lvblNoYXBlVHlwZVtDb2xsaXNpb25TaGFwZVR5cGVbXCJCb3hcIl0gPSAwXSA9IFwiQm94XCI7XG4gICAgQ29sbGlzaW9uU2hhcGVUeXBlW0NvbGxpc2lvblNoYXBlVHlwZVtcIlNwaGVyZVwiXSA9IDJdID0gXCJTcGhlcmVcIjtcbn0pKENvbGxpc2lvblNoYXBlVHlwZSA9IGV4cG9ydHMuQ29sbGlzaW9uU2hhcGVUeXBlIHx8IChleHBvcnRzLkNvbGxpc2lvblNoYXBlVHlwZSA9IHt9KSk7XG52YXIgUGFydGljbGVFbWl0dGVyRmxhZ3M7XG4oZnVuY3Rpb24gKFBhcnRpY2xlRW1pdHRlckZsYWdzKSB7XG4gICAgUGFydGljbGVFbWl0dGVyRmxhZ3NbUGFydGljbGVFbWl0dGVyRmxhZ3NbXCJFbWl0dGVyVXNlc01ETFwiXSA9IDMyNzY4XSA9IFwiRW1pdHRlclVzZXNNRExcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXJGbGFnc1tQYXJ0aWNsZUVtaXR0ZXJGbGFnc1tcIkVtaXR0ZXJVc2VzVEdBXCJdID0gNjU1MzZdID0gXCJFbWl0dGVyVXNlc1RHQVwiO1xufSkoUGFydGljbGVFbWl0dGVyRmxhZ3MgPSBleHBvcnRzLlBhcnRpY2xlRW1pdHRlckZsYWdzIHx8IChleHBvcnRzLlBhcnRpY2xlRW1pdHRlckZsYWdzID0ge30pKTtcbnZhciBQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3M7XG4oZnVuY3Rpb24gKFBhcnRpY2xlRW1pdHRlcjJGbGFncykge1xuICAgIFBhcnRpY2xlRW1pdHRlcjJGbGFnc1tQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3NbXCJVbnNoYWRlZFwiXSA9IDMyNzY4XSA9IFwiVW5zaGFkZWRcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3NbUGFydGljbGVFbWl0dGVyMkZsYWdzW1wiU29ydFByaW1zRmFyWlwiXSA9IDY1NTM2XSA9IFwiU29ydFByaW1zRmFyWlwiO1xuICAgIFBhcnRpY2xlRW1pdHRlcjJGbGFnc1tQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3NbXCJMaW5lRW1pdHRlclwiXSA9IDEzMTA3Ml0gPSBcIkxpbmVFbWl0dGVyXCI7XG4gICAgUGFydGljbGVFbWl0dGVyMkZsYWdzW1BhcnRpY2xlRW1pdHRlcjJGbGFnc1tcIlVuZm9nZ2VkXCJdID0gMjYyMTQ0XSA9IFwiVW5mb2dnZWRcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3NbUGFydGljbGVFbWl0dGVyMkZsYWdzW1wiTW9kZWxTcGFjZVwiXSA9IDUyNDI4OF0gPSBcIk1vZGVsU3BhY2VcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRmxhZ3NbUGFydGljbGVFbWl0dGVyMkZsYWdzW1wiWFlRdWFkXCJdID0gMTA0ODU3Nl0gPSBcIlhZUXVhZFwiO1xufSkoUGFydGljbGVFbWl0dGVyMkZsYWdzID0gZXhwb3J0cy5QYXJ0aWNsZUVtaXR0ZXIyRmxhZ3MgfHwgKGV4cG9ydHMuUGFydGljbGVFbWl0dGVyMkZsYWdzID0ge30pKTtcbnZhciBQYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZTtcbihmdW5jdGlvbiAoUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGUpIHtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZVtQYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZVtcIkJsZW5kXCJdID0gMF0gPSBcIkJsZW5kXCI7XG4gICAgUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGVbUGFydGljbGVFbWl0dGVyMkZpbHRlck1vZGVbXCJBZGRpdGl2ZVwiXSA9IDFdID0gXCJBZGRpdGl2ZVwiO1xuICAgIFBhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlW1BhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlW1wiTW9kdWxhdGVcIl0gPSAyXSA9IFwiTW9kdWxhdGVcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZVtQYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZVtcIk1vZHVsYXRlMnhcIl0gPSAzXSA9IFwiTW9kdWxhdGUyeFwiO1xuICAgIFBhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlW1BhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlW1wiQWxwaGFLZXlcIl0gPSA0XSA9IFwiQWxwaGFLZXlcIjtcbn0pKFBhcnRpY2xlRW1pdHRlcjJGaWx0ZXJNb2RlID0gZXhwb3J0cy5QYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZSB8fCAoZXhwb3J0cy5QYXJ0aWNsZUVtaXR0ZXIyRmlsdGVyTW9kZSA9IHt9KSk7XG4vLyBOb3QgYWN0dWFsbHkgbWFwcGVkIHRvIG1keCBmbGFncyAoMDogSGVhZCwgMTogVGFpbCwgMjogQm90aClcbnZhciBQYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3M7XG4oZnVuY3Rpb24gKFBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncykge1xuICAgIFBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFnc1tQYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3NbXCJIZWFkXCJdID0gMV0gPSBcIkhlYWRcIjtcbiAgICBQYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3NbUGFydGljbGVFbWl0dGVyMkZyYW1lc0ZsYWdzW1wiVGFpbFwiXSA9IDJdID0gXCJUYWlsXCI7XG59KShQYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MgPSBleHBvcnRzLlBhcnRpY2xlRW1pdHRlcjJGcmFtZXNGbGFncyB8fCAoZXhwb3J0cy5QYXJ0aWNsZUVtaXR0ZXIyRnJhbWVzRmxhZ3MgPSB7fSkpO1xudmFyIExpZ2h0VHlwZTtcbihmdW5jdGlvbiAoTGlnaHRUeXBlKSB7XG4gICAgTGlnaHRUeXBlW0xpZ2h0VHlwZVtcIk9tbmlkaXJlY3Rpb25hbFwiXSA9IDBdID0gXCJPbW5pZGlyZWN0aW9uYWxcIjtcbiAgICBMaWdodFR5cGVbTGlnaHRUeXBlW1wiRGlyZWN0aW9uYWxcIl0gPSAxXSA9IFwiRGlyZWN0aW9uYWxcIjtcbiAgICBMaWdodFR5cGVbTGlnaHRUeXBlW1wiQW1iaWVudFwiXSA9IDJdID0gXCJBbWJpZW50XCI7XG59KShMaWdodFR5cGUgPSBleHBvcnRzLkxpZ2h0VHlwZSB8fCAoZXhwb3J0cy5MaWdodFR5cGUgPSB7fSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kZWwuanMubWFwIl19
