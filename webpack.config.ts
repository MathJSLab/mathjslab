import path from 'path';
import webpack from 'webpack';

const config: webpack.Configuration = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /(\.ts)|(\.js)$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        configFile: "tsconfig.build.json"
                    }
                }],
                exclude: [
                    /node_modules/,
                    /test/,
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            parser: path.resolve(__dirname, "src/"),
        },
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
};

export default config;
