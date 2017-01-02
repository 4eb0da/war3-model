import {parse} from './parsers/mdlParser';

function parseModel (responseText: string) {
    const model = parse(responseText);

    console.log(model);
}

function loadModel () {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', 'Footman.mdl', true);
    xhr.onreadystatechange = () => {
        if (xhr.status === 200 && xhr.readyState === XMLHttpRequest.DONE) {
            parseModel(xhr.responseText);
        }
    };
    xhr.send();
}

function init() {
    loadModel();
}

document.addEventListener('DOMContentLoaded', init);
