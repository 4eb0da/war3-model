import { resolve } from 'node:path';
import { defineConfig, LibraryFormats, type Plugin } from 'vite';
import pkg from './package.json';

const isSamples = Boolean(process.env.SAMPLES);

const banner = `/*!
    war3-model v${pkg.version}
	https://github.com/4eb0da/war3-model
	Released under the MIT License.
*/`;

function emitModulePackageFile(): Plugin {
    return {
        generateBundle() {
            this.emitFile({ fileName: 'package.json', source: `{"type":"module"}`, type: 'asset' });
        },
        name: 'emit-module-package-file'
    };
}

export default defineConfig(() => {
    if (isSamples) {
        return {
            base: 'https://4eb0da.ru/war3-model/dist/',
            build: {
                outDir: resolve(import.meta.dirname, 'docs/dist'),
                rollupOptions: {
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
            emitModulePackageFile(),
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
