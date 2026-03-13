import { resolve } from 'node:path';
import { defineConfig, LibraryFormats, type Plugin } from 'vite';
import pkg from './package.json';
import dts from 'vite-plugin-dts';

const isSamples = Boolean(process.env.SAMPLES);

const banner = `/*!
    war3-model v${pkg.version}
	https://github.com/4eb0da/war3-model
	Released under the MIT License.
*/`;

function emitBrowserDts(): Plugin {
    return {
        generateBundle() {
            this.emitFile({
                fileName: 'war3-model.browser.d.ts',
                source: `import type {
    model,
    parseMDX,
    generateMDX,
    parseMDL,
    generateMDL,
    blp,
    decodeBLP,
    getBLPImageData,
    ModelRenderer
} from './war3-model.d.ts';

declare global {
    interface Window {
        war3model: {
            model: typeof model;
            parseMDX: typeof parseMDX;
            generateMDX: typeof generateMDX;
            parseMDL: typeof parseMDL;
            generateMDL: typeof generateMDL;
            blp: typeof blp;
            decodeBLP: typeof decodeBLP;
            getBLPImageData: typeof getBLPImageData;
            ModelRenderer: typeof ModelRenderer;
        };
    }
}
`,
                type: 'asset'
            });
        },
        name: 'emit-browser-dts'
    };
}

export default defineConfig(() => {
    if (isSamples) {
        return {
            base: 'https://4eb0da.ru/war3-model/dist/',
            build: {
                outDir: resolve(import.meta.dirname, 'docs/dist'),
                rolldownOptions: {
                    input: {
                        convert: resolve(import.meta.dirname, 'docs/convert/convert.html'),
                        decodeblp: resolve(import.meta.dirname, 'docs/decodeblp/decodeblp.html'),
                        optframes: resolve(import.meta.dirname, 'docs/optframes/optframes.html'),
                        preview: resolve(import.meta.dirname, 'docs/preview/preview.html'),
                    },
                    output: {
                        banner
                    }
                }
            }
        };
    }

    return {
        plugins: [
            emitBrowserDts(),
            dts({
                rollupTypes: true,
            }),
        ],
        build: {
            sourcemap: true,
            minify: false,
            lib: {
                entry: 'index.ts',
                fileName: format => {
                    if (format === 'es') {
                        return 'es/war3-model.mjs';
                    }
                    if (format === 'umd') {
                        return 'war3-model.browser.js';
                    }
                    return 'war3-model.cjs';
                },
                formats: ['cjs', 'es', 'umd'] as LibraryFormats[],
                name: 'war3model'
            }
        }
    };
});
