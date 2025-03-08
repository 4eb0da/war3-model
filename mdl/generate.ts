import {
    Model, Sequence, Texture, TextureFlags, Material, MaterialRenderMode, Layer, FilterMode, Node,
    AnimVector, LineType, AnimKeyframe, LayerShading, TVertexAnim, Geoset, GeosetAnimInfo, GeosetAnim, GeosetAnimFlags,
    NodeFlags, Bone, Light, LightType, Helper, Attachment, ParticleEmitter2, ParticleEmitter2FilterMode,
    ParticleEmitter2Flags, ParticleEmitter2FramesFlags, RibbonEmitter, EventObject, Camera, CollisionShape,
    CollisionShapeType, ParticleEmitter, ParticleEmitterFlags, FaceFX, BindPose, ParticleEmitterPopcorn, ParticleEmitterPopcornFlags
} from '../model';
import { LAYER_TEXTURE_ID_MAP } from '../renderer/util';

const FLOAT_PRESICION = 6;
const EPSILON = 1e-6;

function isNotEmptyVec3 (vec: Float32Array, val = 0) {
    return Math.abs(vec[0] - val) > EPSILON ||
        Math.abs(vec[1] - val) > EPSILON ||
        Math.abs(vec[2] - val) > EPSILON;
}

function generateTab (tabSize = 1): string {
    if (tabSize === 0) {
        return '';
    }

    let res = '\t';

    for (let i = 1; i < tabSize; ++i) {
        res += '\t';
    }

    return res;
}

function generateWrappedString (val: string): string {
    return `"${val}"`;
}

function generateWrappedStringOrNumber (val: string|number): string {
    if (typeof val === 'number') {
        return String(val);
    }
    return generateWrappedString(val);
}

function generateBlockStart (blockName: string, subInfo: string|number|null = null, tabSize = 0): string {
    return generateTab(tabSize) +
            blockName + ' ' +
            (subInfo !== null ? generateWrappedStringOrNumber(subInfo) + ' ' : '') +
            '{\n';
}

function generateBlockEnd (tabSize = 0) {
    return generateTab(tabSize) + '}\n';
}

const trailingZeroRegExp = /(\..+?)0+$/;
const trailingZeroRegExp2 = /\.0+$/;
const negativeZeroRegExp = /^-0$/;
function generateNumber (val: number): string {
    return val.toFixed(FLOAT_PRESICION)
        .replace(trailingZeroRegExp, '$1')
        .replace(trailingZeroRegExp2, '')
        .replace(negativeZeroRegExp, '0');
}

function generateArray (arr: Float32Array|Int32Array|Uint32Array|Uint8Array, reverse = false): string {
    let middle = '';

    if (reverse) {
        for (let i = arr.length - 1; i >= 0; --i) {
            if (i < arr.length - 1) {
                middle += ', ';
            }

            middle += generateNumber(arr[i]);
        }
    } else {
        for (let i = 0; i < arr.length; ++i) {
            if (i > 0) {
                middle += ', ';
            }

            middle += generateNumber(arr[i]);
        }
    }

    return '{ ' + middle + ' }';
}

function generateUIntArray (arr: number[]|Uint8Array|Uint16Array|Uint32Array): string {
    let middle = '';

    for (let i = 0; i < arr.length; ++i) {
        if (i > 0) {
            middle += ', ';
        }

        middle += String(arr[i]);
    }

    return '{ ' + middle + ' }';
}

function generateStatic (isStatic: boolean|null) {
    return isStatic ? 'static ' : '';
}

function generateProp (name: string, val: string, isStatic: boolean|null, tabSize = 1): string {
    return `${generateTab(tabSize) + generateStatic(isStatic) + name} ${val},\n`;
}

function generateIntProp (name: string, val: number, isStatic: boolean|null = null, tabSize = 1): string {
    return generateProp(name, String(val), isStatic, tabSize);
}

function generateFloatProp (name: string, val: number, isStatic: boolean|null = null, tabSize = 1): string {
    return generateProp(name, generateNumber(val), isStatic, tabSize);
}

function generateStringProp (name: string, val: string, isStatic: boolean|null = null, tabSize = 1): string {
    return generateProp(name, val, isStatic, tabSize);
}

function generateWrappedStringProp (name: string, val: string, isStatic: boolean|null = null,
                                    tabSize = 1): string {
    return generateProp(name, generateWrappedString(val), isStatic, tabSize);
}

function generateFloatArrayProp (name: string, val: Uint32Array|Float32Array, isStatic: boolean|null = null,
                                 tabSize = 1): string {
    return generateProp(name, generateArray(val), isStatic, tabSize);
}

function generateUIntArrayProp (name: string, val: Uint8Array|Uint32Array, isStatic: boolean|null = null,
                                tabSize = 1): string {
    return generateProp(name, generateUIntArray(val), isStatic, tabSize);
}

function generateBooleanProp (name: string, tabSize = 1): string {
    return generateTab(tabSize) + name + ',\n';
}

function generateIntPropIfNotEmpty (name: string, val: number|null|undefined, defaultVal = 0,
                                    isStatic: boolean|null = null, tabSize = 1): string {
    if (val !== defaultVal && val !== null && val !== undefined) {
        return generateIntProp(name, val, isStatic, tabSize);
    }
    return '';
}

function generateFloatPropIfNotEmpty (name: string, val: number, defaultVal = 0, isStatic: boolean|null = null,
                                      tabSize = 1): string {
    if (Math.abs(val - defaultVal) > EPSILON) {
        return generateFloatProp(name, val, isStatic, tabSize);
    }
    return '';
}

function generateLineType (lineType: LineType): string {
    switch (lineType) {
        case LineType.DontInterp:
            return 'DontInterp';
        case LineType.Linear:
            return 'Linear';
        case LineType.Bezier:
            return 'Bezier';
        case LineType.Hermite:
            return 'Hermite';
    }

    return '';
}

function generateAnimKeyFrame (key: AnimKeyframe, tabSize = 2, reverse = false) {
    let res = generateTab(tabSize) + key.Frame + ': ' +
        (key.Vector.length === 1 ? generateNumber(key.Vector[0]) : generateArray(key.Vector, reverse)) + ',\n';

    if (key.InTan/* or OutTan */) {
        res += generateTab(tabSize + 1) + 'InTan ' +
            (key.InTan.length === 1 ? generateNumber(key.InTan[0]) : generateArray(key.InTan, reverse)) + ',\n';
        res += generateTab(tabSize + 1) + 'OutTan ' +
            (key.OutTan.length === 1 ? generateNumber(key.OutTan[0]) : generateArray(key.OutTan, reverse)) + ',\n';
    }

    return res;
}

function generateAnimVectorProp (
    name: string,
    val: AnimVector|number,
    defaultVal: number|null = 0,
    tabSize = 1,
    reverse = false
): string {
    if (val === null || val === undefined) {
        return '';
    }

    if (typeof val === 'number') {
        if (typeof defaultVal === 'number' && Math.abs(val - defaultVal) < EPSILON) {
            return '';
        } else {
            return generateFloatProp(name, val, true, tabSize);
        }
    } else {
        return generateBlockStart(name, val.Keys.length, tabSize) +
            generateBooleanProp(generateLineType(val.LineType), tabSize + 1) +
            (val.GlobalSeqId !== null ? generateIntProp('GlobalSeqId', val.GlobalSeqId, null, tabSize + 1) : '') +
            val.Keys.map(key => generateAnimKeyFrame(key, tabSize + 1, reverse)).join('') +
            generateBlockEnd(tabSize);
    }
}

function generateVersion (model: Model): string {
    return generateBlockStart('Version') +
            generateIntProp('FormatVersion', model.Version) +
            generateBlockEnd();
}

function generateModel (model: Model): string {
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

function generateSequences (model: Model): string {
    return generateBlockStart('Sequences', model.Sequences.length) +
            model.Sequences.map(generateSequenceChunk).join('') +
            generateBlockEnd();
}

function generateSequenceChunk (sequence: Sequence): string {
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

function generateGlobalSequences (model: Model): string {
    if (!model.GlobalSequences || !model.GlobalSequences.length) {
        return '';
    }

    return generateBlockStart('GlobalSequences', model.GlobalSequences.length) +
        model.GlobalSequences.map(duration => generateIntProp('Duration', duration)).join('') +
        generateBlockEnd();
}

function generateTextures (model: Model): string {
    if (!model.Textures.length) {
        return '';
    }

    return generateBlockStart('Textures', model.Textures.length) +
        model.Textures.map(generateTextureChunk).join('') +
        generateBlockEnd();
}

function generateTextureChunk (texture: Texture): string {
    return generateBlockStart('Bitmap', null, 1) +
        generateWrappedStringProp('Image', texture.Image, null, 2) +
        generateIntPropIfNotEmpty('ReplaceableId', texture.ReplaceableId, 0, null, 2) +
        (texture.Flags & TextureFlags.WrapWidth ? generateBooleanProp('WrapWidth', 2) : '') +
        (texture.Flags & TextureFlags.WrapHeight ? generateBooleanProp('WrapHeight', 2) : '') +
        generateBlockEnd(1);
}

function generateMaterials (model: Model): string {
    if (!model.Materials.length) {
        return '';
    }

    return generateBlockStart('Materials', model.Materials.length) +
        model.Materials.map(it => generateMaterialChunk(model, it)).join('') +
        generateBlockEnd();
}

function generateMaterialChunk (model: Model, material: Material): string {
    let shader = '';

    if (model.Version >= 900 && model.Version < 1100 && material.Shader) {
        shader = generateWrappedStringProp('Shader', material.Shader, false, 2);
    }

    return generateBlockStart('Material', null, 1) +
        (material.RenderMode & MaterialRenderMode.ConstantColor ? generateBooleanProp('ConstantColor', 2) : '') +
        (material.RenderMode & MaterialRenderMode.SortPrimsFarZ ? generateBooleanProp('SortPrimsFarZ', 2) : '') +
        (material.RenderMode & MaterialRenderMode.FullResolution ? generateBooleanProp('FullResolution', 2) : '') +
        generateIntPropIfNotEmpty('PriorityPlane', material.PriorityPlane, 0, null, 2) +
        generateIntPropIfNotEmpty('RenderMode', material.RenderMode, 0, null, 2) +
        shader +
        material.Layers.map(it => generateLayerChunk(model, it)).join('') +
        generateBlockEnd(1);
}

function generateFilterMode (filterMode: FilterMode): string {
    switch (filterMode) {
        case FilterMode.None:
            return 'None';
        case FilterMode.Transparent:
            return 'Transparent';
        case FilterMode.Blend:
            return 'Blend';
        case FilterMode.Additive:
            return 'Additive';
        case FilterMode.AddAlpha:
            return 'AddAlpha';
        case FilterMode.Modulate:
            return 'Modulate';
        case FilterMode.Modulate2x:
            return 'Modulate2x';
    }
    return '';
}

function generateLayerChunk (model: Model, layer: Layer) {
    let middle = '';

    if (model.Version >= 900) {
        middle += (layer.EmissiveGain !== undefined ? generateAnimVectorProp('EmissiveGain', layer.EmissiveGain, 1, 3) : '');
        if (model.Version >= 1000) {
            middle += (layer.FresnelColor !== undefined ? generateColorProp('FresnelColor', layer.FresnelColor, true, 3) : '');
            middle += (layer.FresnelOpacity !== undefined ? generateAnimVectorProp('FresnelOpacity', layer.FresnelOpacity, 0, 3) : '');
            middle += (layer.FresnelTeamColor !== undefined ? generateAnimVectorProp('FresnelTeamColor', layer.FresnelTeamColor, 0, 3) : '');
        }
    }
    if (model.Version >= 1100) {
        middle += generateIntProp('ShaderTypeId', layer.ShaderTypeId || 0, null, 3);

        LAYER_TEXTURE_ID_MAP.slice(1).forEach(name => {
            const val = layer[name];
            if (val !== undefined) {
                middle += generateAnimVectorProp(name, val, null, 3);
            }
        });
    }

    return generateBlockStart('Layer', null, 2) +
        generateStringProp('FilterMode', generateFilterMode(layer.FilterMode), null, 3) +
        (layer.Alpha !== undefined ? generateAnimVectorProp('Alpha', layer.Alpha, 1, 3) : '') +
        (layer.TextureID !== undefined ? generateAnimVectorProp('TextureID', layer.TextureID, null, 3) : '') +
        (layer.Shading & LayerShading.TwoSided ? generateBooleanProp('TwoSided', 3) : '') +
        (layer.Shading & LayerShading.Unshaded ? generateBooleanProp('Unshaded', 3) : '') +
        (layer.Shading & LayerShading.Unfogged ? generateBooleanProp('Unfogged', 3) : '') +
        (layer.Shading & LayerShading.SphereEnvMap ? generateBooleanProp('SphereEnvMap', 3) : '') +
        (layer.Shading & LayerShading.NoDepthTest ? generateBooleanProp('NoDepthTest', 3) : '') +
        (layer.Shading & LayerShading.NoDepthSet ? generateBooleanProp('NoDepthSet', 3) : '') +
        generateIntPropIfNotEmpty('CoordId', layer.CoordId, 0, null, 3) +
        generateIntPropIfNotEmpty('TVertexAnimId', layer.TVertexAnimId, null, null, 3) +
        middle +
        generateBlockEnd(2);
}

function generateTextureAnims (model: Model): string {
    if (!model.TextureAnims.length) {
        return '';
    }

    return generateBlockStart('TextureAnims', model.TextureAnims.length) +
        model.TextureAnims.map(generateTextureAnimChunk).join('') +
        generateBlockEnd();
}

function generateTextureAnimChunk (textureAnim: TVertexAnim): string {
    return generateBlockStart('TVertexAnim', null, 1) +
        (textureAnim.Translation ? generateAnimVectorProp('Translation', textureAnim.Translation, null, 2) : '') +
        (textureAnim.Rotation ? generateAnimVectorProp('Rotation', textureAnim.Rotation, null, 2) : '') +
        (textureAnim.Scaling ? generateAnimVectorProp('Scaling', textureAnim.Scaling, null, 2) : '') +
        generateBlockEnd(1);
}

function generateGeosets (model: Model): string {
    if (!model.Geosets.length) {
        return '';
    }

    return model.Geosets.map(it => generateGeosetChunk(model, it)).join('');
}

function generateGeosetChunk (model: Model, geoset: Geoset): string {
    let middle = '';

    if (model.Version >= 900) {
        middle += (geoset.LevelOfDetail !== undefined ? generateIntProp('LevelOfDetail', geoset.LevelOfDetail) : '') +
            (geoset.Name ? generateWrappedStringProp('Name', geoset.Name) : '') +
            (geoset.Tangents ? generateGeosetArray('Tangents', geoset.Tangents, 4) : '') +
            (geoset.SkinWeights ? generateGeosetArray('SkinWeights', geoset.SkinWeights, 8) : '');
    }

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
        middle +
        generateBlockEnd();
}

function generateGeosetArray (name: string, arr: Float32Array|Uint8Array, elemLength: number): string {
    let middle = '';
    const elemCount = arr.length / elemLength;

    for (let i = 0; i < elemCount; ++i) {
        middle += generateTab(2) + generateArray(arr.slice(i * elemLength, (i + 1) * elemLength)) + ',\n';
    }

    return generateBlockStart(name, elemCount, 1) +
        middle +
        generateBlockEnd(1);
}

function generateGeosetVertexGroup (arr: Uint8Array|Uint16Array): string {
    if (!arr.length) {
        return '';
    }

    let middle = '';

    for (let i = 0; i < arr.length; ++i) {
        middle += generateTab(2) + arr[i] + ',\n';
    }

    return generateBlockStart('VertexGroup', null, 1) +
        middle +
        generateBlockEnd(1);
}

function generateGeosetFaces (arr: Uint16Array): string {
    return generateBlockStart(`Faces 1 ${arr.length}`, null, 1) +
        generateBlockStart('Triangles', null, 2) +
        generateTab(3) + generateUIntArray(arr) + ',\n' +
        generateBlockEnd(2) +
        generateBlockEnd(1);
}

function generateGeosetGroups (groups: number[][]): string {
    let totalMatrices = 0;
    let middle = '';

    for (const group of groups) {
        totalMatrices += group.length;
        middle += generateTab(2) + 'Matrices ' + generateUIntArray(group) + ',\n';
    }

    return generateBlockStart(`Groups ${groups.length} ${totalMatrices}`, null, 1) +
        middle +
        generateBlockEnd(1);
}

function generateGeosetAnimInfos (anims: GeosetAnimInfo[]): string {
    if (!anims) {
        return '';
    }

    return anims.map(generateGeosetAnimInfoChunk).join('');
}

function generateGeosetAnimInfoChunk (anim: GeosetAnimInfo): string {
    return generateBlockStart('Anim', null, 1) +
        generateFloatArrayProp('MinimumExtent', anim.MinimumExtent, null, 2) +
        generateFloatArrayProp('MaximumExtent', anim.MaximumExtent, null, 2) +
        generateFloatPropIfNotEmpty('BoundsRadius', anim.BoundsRadius, 0, null, 2) +
        generateBlockEnd(1);
}

function generateGeosetAnims (model: Model): string {
    if (!model.GeosetAnims.length) {
        return '';
    }

    return model.GeosetAnims.map(generateGeosetAnimChunk).join('');
}

function generateColorProp (name: string, color: AnimVector|Float32Array, isStatic: boolean|null,
                            tabSize = 1): string {
    if (color) {
        if (color instanceof Float32Array) {
            if (!isStatic || isNotEmptyVec3(color, 1)) {
                let middle = '';

                for (let i = 2; i >= 0; --i) {
                    if (i < 2) {
                        middle += ', ';
                    }
                    middle += generateNumber(color[i]);
                }

                return `${generateTab(tabSize)}${isStatic ? 'static ' : ''}${name} { ${middle} },\n`;
            }
        } else {
            return generateAnimVectorProp(name, color, null, tabSize, true);
        }
    }

    return '';
}

function generateGeosetAnimChunk (geosetAnim: GeosetAnim): string {
    return generateBlockStart('GeosetAnim') +
        generateIntProp('GeosetId', geosetAnim.GeosetId) +
        generateAnimVectorProp('Alpha', geosetAnim.Alpha, 1) +
        generateColorProp('Color', geosetAnim.Color, true) +
        (geosetAnim.Flags & GeosetAnimFlags.DropShadow ? generateBooleanProp('DropShadow') : '') +
        generateBlockEnd();
}

function generateNodeProps (node: Node): string {
    return generateIntProp('ObjectId', node.ObjectId) +
        generateIntPropIfNotEmpty('Parent', node.Parent, null) +
        generateNodeDontInherit(node.Flags) +
        (node.Flags & NodeFlags.Billboarded ? generateBooleanProp('Billboarded') : '') +
        (node.Flags & NodeFlags.BillboardedLockX ? generateBooleanProp('BillboardedLockX') : '') +
        (node.Flags & NodeFlags.BillboardedLockY ? generateBooleanProp('BillboardedLockY') : '') +
        (node.Flags & NodeFlags.BillboardedLockZ ? generateBooleanProp('BillboardedLockZ') : '') +
        (node.Flags & NodeFlags.CameraAnchored ? generateBooleanProp('CameraAnchored') : '') +
        (node.Translation !== undefined ? generateAnimVectorProp('Translation', node.Translation) : '') +
        (node.Rotation !== undefined ? generateAnimVectorProp('Rotation', node.Rotation) : '') +
        (node.Scaling !== undefined ? generateAnimVectorProp('Scaling', node.Scaling) : '');
}

function generateNodeDontInherit (flags: NodeFlags) {
    const flagsStrs: string[] = [];

    if (flags & NodeFlags.DontInheritTranslation) {
        flagsStrs.push('Translation');
    }
    if (flags & NodeFlags.DontInheritRotation) {
        flagsStrs.push('Rotation');
    }
    if (flags & NodeFlags.DontInheritScaling) {
        flagsStrs.push('Scaling');
    }

    if (!flagsStrs.length) {
        return '';
    }

    return generateTab(1) + 'DontInherit { ' + flagsStrs.join(', ') + ' },\n';
}

function generateBones (model: Model): string {
    if (!model.Bones.length) {
        return '';
    }

    return model.Bones.map(generateBoneChunk).join('');
}

function generateBoneChunk (bone: Bone): string {
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

function generateLights (model: Model): string {
    if (!model.Lights.length) {
        return '';
    }

    return model.Lights.map(generateLightChunk).join('');
}

function generateLightChunk (light: Light): string {
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

function generateLightType (lightType: LightType): string {
    switch (lightType) {
        case LightType.Omnidirectional:
            return 'Omnidirectional';
        case LightType.Directional:
            return 'Directional';
        case LightType.Ambient:
            return 'Ambient';
    }

    return '';
}

function generateHelpers (model: Model): string {
    return model.Helpers.map(generateHelperChunk).join('');
}

function generateHelperChunk (helper: Helper): string {
    return generateBlockStart('Helper', helper.Name) +
        generateNodeProps(helper) +
        generateBlockEnd();
}

function generateAttachments (model: Model): string {
    return model.Attachments.map(generateAttachmentChunk).join('');
}

function generateAttachmentChunk (attachment: Attachment): string {
    return generateBlockStart('Attachment', attachment.Name) +
        generateNodeProps(attachment) +
        generateIntProp('AttachmentID', attachment.AttachmentID) +
        (attachment.Path ? generateWrappedStringProp('Path', attachment.Path) : '') +
        generateAnimVectorProp('Visibility', attachment.Visibility, 1) +
        generateBlockEnd();
}

function generatePivotPoints (model: Model): string {
    return generateBlockStart('PivotPoints', model.PivotPoints.length) +
        model.PivotPoints.map(point => `${generateTab()}${generateArray(point)},\n`).join('') +
        generateBlockEnd();
}

function generateParticleEmitters (model: Model): string {
    return model.ParticleEmitters.map(generateParticleEmitterChunk).join('');
}

function generateParticleEmitterChunk (emitter: ParticleEmitter): string {
    return generateBlockStart('ParticleEmitter', emitter.Name) +
        generateNodeProps(emitter) +
        (emitter.Flags & ParticleEmitterFlags.EmitterUsesMDL ? generateBooleanProp('EmitterUsesMDL') : '') +
        (emitter.Flags & ParticleEmitterFlags.EmitterUsesTGA ? generateBooleanProp('EmitterUsesTGA') : '') +
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

function generateParticleEmitters2 (model: Model): string {
    return model.ParticleEmitters2.map(generateParticleEmitter2Chunk).join('');
}

function generateParticleEmitters2FilterMode (filterMode: ParticleEmitter2FilterMode): string {
    switch (filterMode) {
        case ParticleEmitter2FilterMode.Blend:
            return 'Blend';
        case ParticleEmitter2FilterMode.Additive:
            return 'Additive';
        case ParticleEmitter2FilterMode.Modulate:
            return 'Modulate';
        case ParticleEmitter2FilterMode.Modulate2x:
            return 'Modulate2x';
        case ParticleEmitter2FilterMode.AlphaKey:
            return 'AlphaKey';
    }

    return '';
}

function generateSegmentColor (colors: Float32Array[]): string {
    return generateBlockStart('SegmentColor', null, 1) +
        colors.map(color => generateColorProp('Color', color, false, 2)).join('') +
        generateTab() + '},\n';
}

function generateParticleEmitter2FrameFlags (frameFlags: ParticleEmitter2FramesFlags): string {
    if (frameFlags & ParticleEmitter2FramesFlags.Head && frameFlags & ParticleEmitter2FramesFlags.Tail) {
        return 'Both';
    } else if (frameFlags & ParticleEmitter2FramesFlags.Head) {
        return 'Head';
    } else if (frameFlags & ParticleEmitter2FramesFlags.Tail) {
        return 'Tail';
    }
    return '';
}

function generateParticleEmitter2Chunk (particleEmitter2: ParticleEmitter2) {
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
        generateIntPropIfNotEmpty('PriorityPlane', particleEmitter2.PriorityPlane, 0) +
        generateIntPropIfNotEmpty('ReplaceableId', particleEmitter2.ReplaceableId, null) +
        (particleEmitter2.Flags & ParticleEmitter2Flags.SortPrimsFarZ ? generateBooleanProp('SortPrimsFarZ') : '') +
        (particleEmitter2.Flags & ParticleEmitter2Flags.LineEmitter ? generateBooleanProp('LineEmitter') : '') +
        (particleEmitter2.Flags & ParticleEmitter2Flags.ModelSpace ? generateBooleanProp('ModelSpace') : '') +
        (particleEmitter2.Flags & ParticleEmitter2Flags.Unshaded ? generateBooleanProp('Unshaded') : '') +
        (particleEmitter2.Flags & ParticleEmitter2Flags.Unfogged ? generateBooleanProp('Unfogged') : '') +
        (particleEmitter2.Flags & ParticleEmitter2Flags.XYQuad ? generateBooleanProp('XYQuad') : '') +
        (particleEmitter2.Squirt ? generateBooleanProp('Squirt') : '') +
        generateBooleanProp(generateParticleEmitter2FrameFlags(particleEmitter2.FrameFlags)) +
        generateBlockEnd();
}

function generateRibbonEmitters (model: Model): string {
    return model.RibbonEmitters.map(generateRibbonEmitterChunk).join('');
}

function generateRibbonEmitterChunk (ribbonEmitter: RibbonEmitter): string {
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
        generateIntProp('MaterialID', ribbonEmitter.MaterialID) +
        generateBlockEnd();
}

function generateEventObjects (model: Model): string {
    return model.EventObjects.map(generateEventObjectChunk).join('');
}

function generateEventTrack (eventTrack: Uint32Array): string {
    let middle = '';

    for (let i = 0; i < eventTrack.length; ++i) {
        middle += generateTab(2) + eventTrack[i] + ',\n';
    }

    return generateBlockStart('EventTrack', eventTrack.length, 1) +
        middle +
        generateBlockEnd(1);
}

function generateEventObjectChunk (eventObject: EventObject): string {
    return generateBlockStart('EventObject', eventObject.Name) +
        generateNodeProps(eventObject) +
        generateEventTrack(eventObject.EventTrack) +
        generateBlockEnd();
}

function generateCameras (model: Model): string {
    return model.Cameras.map(generateCameraChunk).join('');
}

function generateCameraChunk (camera: Camera): string {
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

function generateCollisionShapes (model: Model): string {
    return model.CollisionShapes.map(generateCollisionShapeChunk).join('');
}

function generateCollisionShapeChunk (collisionShape: CollisionShape): string {
    let middle = '';

    if (collisionShape.Shape === CollisionShapeType.Box) {
        middle = generateBooleanProp('Box');
        middle += generateBlockStart('Vertices', 2, 1) +
            generateTab(2) + generateArray(collisionShape.Vertices.slice(0, 3)) + ',\n' +
            generateTab(2) + generateArray(collisionShape.Vertices.slice(3, 6)) + ',\n' +
            generateBlockEnd(1);
    } else {
        middle = generateBooleanProp('Sphere');
        middle += generateBlockStart('Vertices', 1, 1) +
            generateTab(2) + generateArray(collisionShape.Vertices) + ',\n' +
            generateBlockEnd(1) +
            generateFloatProp('BoundsRadius', collisionShape.BoundsRadius);
    }

    return generateBlockStart('CollisionShape', collisionShape.Name) +
        generateNodeProps(collisionShape) +
        middle +
        generateBlockEnd();
}

function generateFaceFX (model: Model): string {
    if (model.Version < 900 || !model.FaceFX) {
        return '';
    }
    return model.FaceFX.map(generateFaceFXChunk).join('');
}

function generateFaceFXChunk (faceFX: FaceFX): string {
    return generateBlockStart('FaceFX', faceFX.Name) +
        generateWrappedStringProp('Path', faceFX.Path) +
        generateBlockEnd();
}

function generateBindPose (model: Model): string {
    if (model.Version < 900 || !model.BindPoses) {
        return '';
    }
    return model.BindPoses.map(generateBindPoseChunk).join('');
}

function generateBindPoseChunk (bindPose: BindPose): string {
    const middle = generateBlockStart('Matrices', bindPose.Matrices.length, 1) +
        bindPose.Matrices.map(item => {
            return generateTab(2) + generateArray(item) + ',';
        }).join('\n') + '\n' +
        generateBlockEnd(1);

    return generateBlockStart('BindPose') +
        middle +
        generateBlockEnd();
}

function generateParticleEmitterPopcorn (model: Model): string {
    if (model.Version < 900 || !model.ParticleEmitterPopcorns) {
        return '';
    }
    return model.ParticleEmitterPopcorns.map(generateParticleEmitterPopcornChunk).join('');
}

function generateParticleEmitterPopcornChunk (emitter: ParticleEmitterPopcorn): string {
    return generateBlockStart('ParticleEmitterPopcorn', emitter.Name) +
        generateNodeProps(emitter) +
        (emitter.Flags & ParticleEmitterPopcornFlags.Unshaded ? generateBooleanProp('Unshaded') : '') +
        (emitter.Flags & ParticleEmitterPopcornFlags.SortPrimsFarZ ? generateBooleanProp('SortPrimsFarZ') : '') +
        (emitter.Flags & ParticleEmitterPopcornFlags.Unfogged ? generateBooleanProp('Unfogged') : '') +
        generateAnimVectorProp('LifeSpan', emitter.LifeSpan, null) +
        generateAnimVectorProp('EmissionRate', emitter.EmissionRate, 0) +
        generateAnimVectorProp('Speed', emitter.Speed, 0) +
        generateColorProp('Color', emitter.Color, true) +
        generateAnimVectorProp('Alpha', emitter.Alpha, 1) +
        generateIntPropIfNotEmpty('ReplaceableId', emitter.ReplaceableId, 0, null) +
        generateWrappedStringProp('Path', emitter.Path, false) +
        generateWrappedStringProp('AnimVisibilityGuide', emitter.AnimVisibilityGuide, false) +
        generateAnimVectorProp('Visibility', emitter.Visibility) +
        generateBlockEnd();
}

const generators: ((model: Model) => string)[] = [
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
    generateCollisionShapes,
    generateFaceFX,
    generateBindPose,
    generateParticleEmitterPopcorn
];

export function generate (model: Model): string {
    let res = '';

    for (const generator of generators) {
        res += generator(model);
    }

    return res;
}
