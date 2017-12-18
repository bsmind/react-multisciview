const path = require('path');
const webpack = require('webpack');

const settings = {
    entry: "./src/index.js",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, '../react-multiview-server/static/js'),
        publicPath: '../react-multiview-server/static/'
    },
    watch: true,
    resolve: {
        extensions: ['.js', '.json', '.css']
    },
    devtool: "eval-source-map",
    module: {
        rules: [
            {
                test: /\.js?$/,
                loader: 'babel-loader',
                options: {
                    presets: [['es2015', {modules: false}], 'stage-2', 'react'],
                    plugins: ['transform-node-env-inline'],
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                            localIndentName: '[name]--[local]--[hash:base64:8]'
                        }
                    },
                    'postcss-loader'
                ]
            },
        ]
    },
};

module.exports = settings;