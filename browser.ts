import * as model from './model';
import {parse as parseMDL} from './mdl/parse';
import {parse as parseMDX} from './mdx/parse';
import {generate as generateMDL} from './mdl/generate';
import {generate as generateMDX} from './mdx/generate';
import * as blp from './blp/blpimage';
import {decode as decodeBLP, getImageData as getBLPImageData} from './blp/decode';
import {ModelRenderer} from './renderer/modelRenderer';

const war3model = {
    model,
    parseMDX,
    generateMDX,
    parseMDL,
    generateMDL,
    blp,
    decodeBLP,
    getBLPImageData,
    ModelRenderer
};

declare global {
    interface Window {
        war3model: typeof war3model;
    }
}

window.war3model = war3model;