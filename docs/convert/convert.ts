'use strict';

import {parse as parseMDL} from '../../parsers/mdl';
import {parse as parseMDX} from '../../parsers/mdx';
import {generate as generateMDL} from '../../generators/mdl';
import {generate as generateMDX} from '../../generators/mdx';
import {Model} from '../../model';

import * as CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/indent-fold';

document.addEventListener('DOMContentLoaded', function init () {
    let container = document.querySelector('.container');
    let save = document.querySelector('.save');
    let label = document.querySelector('.label');
    let dropTarget;
    let editor;
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

        let file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (!file) {
            return;
        }

        let reader = new FileReader();
        isMDX = file.name.indexOf('.mdx') > -1;

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

        let link = document.createElement('a');
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
        editor = CodeMirror.fromTextArea(document.querySelector('.textarea') as HTMLTextAreaElement, {
            mode: 'application/json',
            matchBrackets: true,
            lineWrapping: true,
            readOnly: true,
            dragDrop: false,
            foldGutter: true,
            gutters: ['CodeMirror-foldgutter'],
            minFoldSize: 1
        });
    }

    function setModel (filename: string): void {
        container.classList.add('container_with-data');

        createEditor();
        editor.setValue(JSON.stringify(model, (key, value) => {
            if (value instanceof Float32Array || value instanceof Int32Array || value instanceof Uint16Array ||
                value instanceof Uint8Array) {
                let res = [];

                for (let i = 0; i < value.length; ++i) {
                    res[i] = value[i];
                }

                return res;
            }
            return value;
        }, 2));

        // foldAll seems to be too slow on big models
        // editor.execCommand('foldAll');
        // editor.execCommand('unfold');
        editor.scrollTo(0, 0);

        convertedName = filename.replace(/\.md(x|l)/i, '.' + (isMDX ? 'mdl' : 'mdx'));

        save.textContent = 'Save ' + convertedName;
    }

    function showError (err): void {
        container.classList.remove('container_with-data');
        label.textContent = err;
    }
});
