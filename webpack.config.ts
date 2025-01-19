/**
 * webpack.config.ts: Webpack configuration factory.
 */

import path from 'node:path';
import webpack from 'webpack';

export default (env: any, argv: any): webpack.Configuration[] => {
    console.warn(`Webpack configuration path: ${__filename}\n- Building ${argv.mode} bundle.\n- Build environment variables:`);
    console.table(env);
    return [
        /* 1. Build for UMD and ES2015 target (legacy environments). */
        {
            mode: argv.mode,
            entry: {
                umd2015: path.join(__dirname, 'src', 'lib.umd2015.ts'),
            },
            target: ['web', 'es2015'],
            output: {
                filename: 'mathjslab.[name].js',
                path: path.join(__dirname, 'lib'),
                library: {
                    name: 'mathjslab',
                    type: 'umd',
                },
                globalObject: 'globalThis',
            },
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
        },
        /* 2. Build for UMD and ES2020 target (modern compatible environments). */
        {
            mode: argv.mode,
            entry: {
                umd2020: path.join(__dirname, 'src', 'lib.ts'),
            },
            target: ['web', 'es2020'],
            output: {
                filename: 'mathjslab.[name].js',
                path: path.join(__dirname, 'lib'),
                library: {
                    name: 'mathjslab',
                    type: 'umd',
                },
                globalObject: 'globalThis',
            },
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        use: [
                            {
                                loader: 'ts-loader',
                                options: {
                                    configFile: 'tsconfig.es2020.json',
                                },
                            },
                        ],
                        exclude: [/node_modules/, /lib/, /res/, /script/, /.*\.spec\.ts$/, /.*\.umd2015\.ts$/],
                    },
                ],
            },
            resolve: {
                extensions: ['.ts', '.js'],
            },
        },
        /* 3. Build for ESM and ES2020 target (modern environments). */
        {
            mode: argv.mode,
            entry: {
                esm2020: path.join(__dirname, 'src', 'lib.ts'),
            },
            target: ['web', 'es2020'],
            output: {
                filename: 'mathjslab.[name].js',
                path: path.join(__dirname, 'lib'),
                library: {
                    type: 'module',
                },
            },
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        use: [
                            {
                                loader: 'ts-loader',
                                options: {
                                    configFile: 'tsconfig.es2020.json',
                                },
                            },
                        ],
                        exclude: [/node_modules/, /lib/, /res/, /script/, /.*\.spec\.ts$/, /.*\.umd2015\.ts$/],
                    },
                ],
            },
            resolve: {
                extensions: ['.ts', '.js'],
            },
            experiments: {
                outputModule: true,
            },
        },
    ];
};
