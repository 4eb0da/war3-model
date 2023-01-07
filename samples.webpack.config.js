const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const base = {
    mode,
    output: {
        chunkFilename: mode === 'production' ? '[contenthash].js' : '[name].js'
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        }, {
            test: /\.ttf$/,
            use: ['file-loader']
        }, {
            test: /\.ts$/,
            use: [{
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                    compilerOptions: {
                        noEmit: false
                    }
                }
            }]
        }, {
            test: /\.js$/,
            enforce: 'pre',
            use: ['source-map-loader'],
        }]
    },
    resolve: {
        extensions: ['.ts', '...']
    }
};

module.exports = [{
    ...base,
    entry: './docs/convert/convert.ts',
    output: {
        ...base.output,
        path: path.resolve(__dirname, 'docs', 'convert', 'dist')
    },
    plugins: [
        new MonacoWebpackPlugin({
            languages: ['json']
        })
    ]
}, {
    ...base,
    entry: './docs/decodeblp/decodeblp.ts',
    output: {
        ...base.output,
        path: path.resolve(__dirname, 'docs', 'decodeblp', 'dist')
    }
}, {
    ...base,
    entry: './docs/optframes/optframes.ts',
    output: {
        ...base.output,
        path: path.resolve(__dirname, 'docs', 'optframes', 'dist')
    }
}, {
    ...base,
    entry: './docs/preview/preview.ts',
    output: {
        ...base.output,
        path: path.resolve(__dirname, 'docs', 'preview', 'dist')
    }
}];