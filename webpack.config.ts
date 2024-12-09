/**
 * webpack.config.ts: Webpack configuration factory.
 */

import path from 'node:path';
import webpack from 'webpack';

export default (env: any, argv: any): webpack.Configuration => {
    console.warn(`Webpack configuration path: ${__filename}\n- Building ${argv.mode} bundle.\n- Build environment variables:`);
    console.table(env);
    return {
        mode: argv.mode,
        entry: path.join(__dirname, 'src', 'lib.ts'),
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: 'ts-loader',
                            options: {
                                configFile: 'tsconfig.build.json',
                            },
                        },
                    ],
                    exclude: [/node_modules/, /lib/, /res/, /script/, /.*\.spec\.ts$/],
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
        },
        output: {
            filename: 'mathjslab.js',
            path: path.join(__dirname, 'lib'),
            library: {
                name: 'mathjslab',
                type: 'umd',
            },
            clean: true,
            globalObject: 'globalThis',
        },
    };
};
