import { RollupOptions } from 'rollup';
import dts from 'rollup-plugin-dts';

export default (_command: Record<string, unknown>): RollupOptions | RollupOptions[] => {
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
        nodeTypings,
        browserTypings
    ];
};