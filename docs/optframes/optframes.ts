'use strict';

import {parse as parseMDL} from '../../mdl/parse';
import {parse as parseMDX} from '../../mdx/parse';
import {generate as generateMDL} from '../../mdl/generate';
import {generate as generateMDX} from '../../mdx/generate';
import {AnimKeyframe, AnimVector, Model} from '../../model';
import '../shim';

document.addEventListener('DOMContentLoaded', function init () {
    let container = document.querySelector('.container');
    let saveMDL = document.querySelector('.save[data-type="mdl"]');
    let saveMDX = document.querySelector('.save[data-type="mdx"]');
    let label = document.querySelector('.label');
    let log = document.querySelector('.log');
    let dropTarget;
    let model: Model;
    let cleanedName: string;

    container.addEventListener('dragenter', function onDragEnter (event) {
        dropTarget = event.target;
        container.classList.add('container_drag');
        event.preventDefault();
    });
    container.addEventListener('dragleave', function onDragLeave (event) {
        if (event.target === dropTarget) {
            container.classList.remove('container_drag');
        }
    });
    container.addEventListener('dragover', function onDragLeave (event: DragEvent) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });
    container.addEventListener('drop', function onDrop (event: DragEvent) {
        event.preventDefault();
        container.classList.remove('container_drag');

        let file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (!file) {
            return;
        }

        let reader = new FileReader();
        let isMDX = file.name.indexOf('.mdx') > -1;

        cleanedName = file.name.replace(/\.[^.]+$/, '');

        reader.onload = () => {
            try {
                if (isMDX) {
                    model = parseMDX(reader.result);
                } else {
                    model = parseMDL(reader.result);
                }
            } catch (err) {
                showError(err);
                return;
            }

            processModel();
        };

        if (isMDX) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    });

    [saveMDL, saveMDX].forEach(button => {
        button.addEventListener('click', function save (event) {
            event.preventDefault();

            let res: Blob;
            let isMDL = button.getAttribute('data-type') === 'mdl';

            if (isMDL) {
                res = new Blob([generateMDL(model)], {type: 'octet/stream'});
            } else {
                res = new Blob([generateMDX(model)], {type: 'octet/stream'});
            }

            let link = document.createElement('a');
            link.style.display = 'none';
            document.body.appendChild(link);

            link.href = URL.createObjectURL(res);
            link.download = cleanedName + (isMDL ? '.mdl' : '.mdx');
            link.click();
            URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
        });
    });

    function clearLog () {
        log.innerHTML = '';
    }

    function logStr (str) {
        let p = document.createElement('p');

        p.textContent = str;
        log.appendChild(p);
    }

    function processModel () {
        clearLog();
        logStr('Optimization is lossy, make sure to test result models');
        let totalKeys = 0,
            cleanedKeys = 0;

        let isSameKey = (keyframe0: AnimKeyframe, keyframe1: AnimKeyframe): boolean => {
            for (let i = 0; i < keyframe0.Vector.length; ++i) {
                if (keyframe0.Vector[i] !== keyframe1.Vector[i]) {
                    return false;
                }
            }
            if (keyframe0.InTan) {
                for (let i = 0; i < keyframe0.InTan.length; ++i) {
                    if (keyframe0.InTan[i] !== keyframe1.InTan[i]) {
                        return false;
                    }
                }
                for (let i = 0; i < keyframe0.OutTan.length; ++i) {
                    if (keyframe0.OutTan[i] !== keyframe1.OutTan[i]) {
                        return false;
                    }
                }
            }
            return true;
        };

        let processKeys = (obj: any, key: string): void => {
            let animVector: AnimVector = obj[key];
            let sequences = model.Sequences;
            let globalSequences = model.GlobalSequences;

            if (!animVector || !animVector.Keys) {
                return;
            }
            totalKeys += animVector.Keys.length;

            let newKeys = [];

            let processAnim = (from: number, to: number): void => {
                let keys = [];

                for (let keyframe of animVector.Keys) {
                    if (keyframe.Frame >= from && keyframe.Frame <= to) {
                        keys.push(keyframe);
                    }
                }
                let prevKey: AnimKeyframe = null;
                let filtered = [];
                for (let i = 0; i < keys.length; ++i) {
                    if (!prevKey) {
                        prevKey = keys[i];
                        filtered.push(keys[i]);
                    } else {
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
            } else {
                for (let anim of sequences) {
                    processAnim(anim.Interval[0], anim.Interval[1]);
                }
            }

            cleanedKeys += animVector.Keys.length - newKeys.length;

            animVector.Keys = newKeys;
        };

        for (let node of model.Nodes) {
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

        for (let camera of model.Cameras) {
            processKeys(camera, 'TargetTranslation');
            processKeys(camera, 'Translation');
            processKeys(camera, 'Rotation');
        }

        for (let anim of model.TextureAnims) {
            processKeys(anim, 'Translation');
            processKeys(anim, 'Rotation');
            processKeys(anim, 'Scaling');
        }

        for (let material of model.Materials) {
            for (let layer of material.Layers) {
                processKeys(layer, 'TextureID');
                processKeys(layer, 'Alpha');
            }
        }

        logStr(cleanedKeys + '/' + totalKeys + ' frames removed');

        container.classList.add('container_with-data');
    }

    function showError (err): void {
        container.classList.remove('container_with-data');
        label.textContent = err;
    }
});
