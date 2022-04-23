'use strict';

import {parse as parseMDL} from '../../mdl/parse';
import {parse as parseMDX} from '../../mdx/parse';
import {generate as generateMDL} from '../../mdl/generate';
import {generate as generateMDX} from '../../mdx/generate';
import {Model} from '../../model';
import '../common/shim';

import * as monaco from 'monaco-editor';

document.addEventListener('DOMContentLoaded', function init () {
    const container = document.querySelector('.container');
    const save = document.querySelector('.save');
    const label = document.querySelector('.label');
    let dropTarget;
    let editor: monaco.editor.IStandaloneCodeEditor;
    let model: Model;
    let isMDX: boolean;
    let convertedName: string;

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

        const file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        isMDX = file.name.indexOf('.mdx') > -1;

        reader.onload = () => {
            try {
                if (isMDX) {
                    model = parseMDX(reader.result as ArrayBuffer);
                } else {
                    model = parseMDL(reader.result as string);
                }
            } catch (err) {
                showError(err);
                return;
            }

            setModel(file.name);
        };

        if (isMDX) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    });

    save.addEventListener('click', function save (event) {
        event.preventDefault();

        let res: Blob;

        if (isMDX) {
            res = new Blob([generateMDL(model)], {type: 'octet/stream'});
        } else {
            res = new Blob([generateMDX(model)], {type: 'octet/stream'});
        }

        const link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);

        link.href = URL.createObjectURL(res);
        link.download = convertedName;
        link.click();
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
    });

    function createEditor (): void {
        if (editor) {
            return;
        }
        editor = monaco.editor.create(document.querySelector('.editor-elem'), {
            value: '',
            language: 'json',
            automaticLayout: true
        });
    }

    function setModel (filename: string): void {
        container.classList.add('container_with-data');

        createEditor();
        editor.setValue(JSON.stringify(model, (_key, value) => {
            if (
                value instanceof Float32Array || value instanceof Int32Array ||
                value instanceof Uint16Array || value instanceof Uint8Array
            ) {
                const res = [];

                for (let i = 0; i < value.length; ++i) {
                    res[i] = value[i];
                }

                return res;
            }
            return value;
        }, 2));

        editor.setScrollLeft(0, monaco.editor.ScrollType.Immediate);
        editor.setScrollTop(0, monaco.editor.ScrollType.Immediate);
        editor.trigger('war3-model', 'editor.foldLevel2', null);

        convertedName = filename.replace(/\.md(x|l)/i, '.' + (isMDX ? 'mdl' : 'mdx'));

        save.textContent = 'Save ' + convertedName;
    }

    function showError (err): void {
        container.classList.remove('container_with-data');
        label.textContent = err;
    }
});
