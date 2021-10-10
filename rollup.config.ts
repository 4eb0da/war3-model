import { RollupOptions, Plugin } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';

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

export default (_command: Record<string, unknown>): RollupOptions | RollupOptions[] => {
    const cjs: RollupOptions = {
        input: {
            'war3-model': 'index.ts'
        },
        output: {
            banner,
            dir: 'dist',
            format: 'cjs',
            sourcemap: true,
            chunkFileNames: '[name]',
            // manualChunks: {
            //     'mdl/parse.js': ['mdl/parse.ts'],
            //     'mdl/generate.js': ['mdl/generate.ts'],
            //     'mdx/parse.js': ['mdx/parse.ts'],
            //     'mdx/generate.js': ['mdx/generate.ts'],
            //     'blp/decode.js': ['blp/decode.ts']
            // }
        },
        plugins: [
            commonjs(),
            typescript()
        ],
        external: [
            'gl-matrix'
        ]
    };

    const esm: RollupOptions = {
        ...cjs,
        output: {
            ...cjs.output,
            dir: 'dist/es',
            format: 'es'
        },
        plugins: [
            commonjs(),
            typescript(),
            emitModulePackageFile()
        ]
    };

    const browserGlobals: RollupOptions = {
        input: 'browser.ts',
        output: [{
            banner,
            name: 'war3model',
            format: 'umd',
            file: 'dist/war3-model.browser.js',
            sourcemap: true
        }],
        plugins: [
            commonjs(),
            typescript(),
            resolve({ browser: true }),
            terser({ module: true, output: { comments: 'some' } })
        ]
    };

    const browserES: RollupOptions = {
        input: 'index.ts',
        output: [{
            banner,
            format: 'es',
            file: 'dist/es/war3-model.browser.js',
            sourcemap: true
        }],
        plugins: [
            commonjs(),
            typescript(),
            resolve({ browser: true }),
            terser({ module: true, output: { comments: 'some' } })
        ]
    };

    const nodeTypings: RollupOptions = {
        input: 'index.ts',
        output: {
            file: 'dist/war3-model.d.ts'
        },
        plugins: [
            dts()
        ]
    };

    const browserTypings: RollupOptions = {
        input: 'browser.ts',
        output: {
            file: 'dist/war3-model.browser.d.ts'
        },
        plugins: [
            dts()
        ]
    };

    return [
        cjs,
        esm,
        browserGlobals,
        browserES,
        nodeTypings,
        browserTypings
    ];
};