'use strict';

import {BLPImage} from '../../blp/blpimage';
import {decode, getImageData} from '../../blp/decode';

document.addEventListener('DOMContentLoaded', function init () {
    let container = document.querySelector('.container');
    let preview = document.querySelector('.preview');
    let save = document.querySelector('.save');
    let label = document.querySelector('.label');
    let dropTarget;

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

        reader.onload = () => {
            try {
                let blp: BLPImage = decode(reader.result);

                console.log(blp);

                clearPreview();
                container.classList.add('container_hidden');
                for (let i = 0; i < blp.mipmaps.length; ++i) {
                    let imageData = getImageData(blp, i);

                    let canvas = document.createElement('canvas');
                    canvas.width = imageData.width;
                    canvas.height = imageData.height;
                    let ctx = canvas.getContext('2d');
                    ctx.putImageData(imageData, 0, 0);

                    let previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    let previewLabel = document.createElement('div');
                    previewLabel.className = 'preview-item__label';
                    previewLabel.textContent = `${imageData.width}x${imageData.height}`;
                    previewItem.appendChild(canvas);
                    previewItem.appendChild(previewLabel);

                    preview.appendChild(previewItem);
                }
            } catch (err) {
                showError(err);
            }
        };

        reader.readAsArrayBuffer(file);
    });

    function clearPreview () {
        preview.innerHTML = '';
    }

    function showError (err): void {
        clearPreview();
        container.classList.remove('container_hidden');
        label.textContent = err;
        console.error(err);
    }
});
