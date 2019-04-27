const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: [
      './src/index.js'
    ],
    target: 'node',
    mode: 'production',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js',
        publicPath: 'build/'
    },
    module: {
        rules: [
            {
                use: 'babel-loader',
                exclude: /(node_modules)/,
                test: /\.js$/
            }
        ],
    },
    externals: [nodeExternals()]
}
