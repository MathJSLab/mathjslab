/**
 * webpack.config.ts: Webpack configuration factory.
 */
import fs from 'node:fs';
import path from 'node:path';
import webpack from 'webpack';
import { LicenseWebpackPlugin } from 'license-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import buildConfig from 'build.config.json';

export const WebpackConfiguration: webpack.Configuration[] = [
    /* 1. Build for UMD and ES2015 target (legacy browser environments). */
    {
        name: 'web.umd2015',
        entry: path.join(__dirname, 'src', 'lib.es2015.ts'),
        target: ['web', 'es2015'],
        output: {
            library: {
                type: 'umd',
                // umdNamedDefine: true,
            },
        },
        module: {
            rules: [
                {
                    use: {
                        options: {
                            configFile: 'tsconfig.cjs.es2015.json',
                        },
                    },
                },
            ],
        },
        resolve: {
            alias: {
                'decimal.js': require.resolve('decimal.js'),
            },
        },
    },
    /* 2. Build for CommonJS and ES2015 target (legacy node environments). */
    {
        name: 'node.cjs2015',
        entry: path.join(__dirname, 'src', 'lib.es2015.ts'),
        target: ['node', 'es2015'],
        output: {
            library: {
                type: 'commonjs',
            },
        },
        module: {
            rules: [
                {
                    use: {
                        options: {
                            configFile: 'tsconfig.cjs.es2015.json',
                        },
                    },
                },
            ],
        },
        resolve: {
            alias: {
                'decimal.js': require.resolve('decimal.js'),
            },
        },
    },
    /* 3. Build for UMD and ES2020 target (modern compatible browser environments). */
    {
        name: 'web.umd2020',
        entry: path.join(__dirname, 'src', 'lib-core.ts'),
        target: ['web', 'es2020'],
        output: {
            library: {
                type: 'umd2',
                umdNamedDefine: true,
            },
        },
        module: {
            rules: [
                {
                    use: {
                        options: {
                            configFile: 'tsconfig.cjs.es2020.json',
                        },
                    },
                    exclude: [/.*\.es2015\.ts$/],
                },
            ],
        },
        resolve: {
            alias: {
                'decimal.js': require.resolve('decimal.js'),
            },
        },
    },
    /* 4. Build for CommonJS and ES2020 target (modern compatible node environments). */
    {
        name: 'node.cjs2020',
        entry: path.join(__dirname, 'src', 'lib-core.ts'),
        target: ['node', 'es2020'],
        output: {
            library: {
                type: 'commonjs2',
            },
        },
        module: {
            rules: [
                {
                    use: {
                        options: {
                            configFile: 'tsconfig.cjs.es2020.json',
                        },
                    },
                    exclude: [/.*\.es2015\.ts$/],
                },
            ],
        },
        resolve: {
            alias: {
                'decimal.js': require.resolve('decimal.js'),
            },
        },
    },
    /* 5. Build for ESM and ES2020 target (modern browser environments). */
    {
        name: 'web.esm2020',
        entry: path.join(__dirname, 'src', 'lib-core.ts'),
        target: ['web', 'es2020'],
        output: {
            library: {
                type: 'module',
            },
        },
        module: {
            rules: [
                {
                    use: {
                        options: {
                            configFile: 'tsconfig.esm.es2020.json',
                        },
                    },
                    exclude: [/.*\.es2015\.ts$/],
                },
            ],
        },
    },
    /* 6. Build for ESM and ES2020 target (modern node environments). */
    {
        name: 'node.esm2020',
        entry: path.join(__dirname, 'src', 'lib-core.ts'),
        target: ['node', 'es2020'],
        output: {
            library: {
                type: 'module',
            },
        },
        module: {
            rules: [
                {
                    use: {
                        options: {
                            configFile: 'tsconfig.esm.es2020.json',
                        },
                    },
                    exclude: [/.*\.es2015\.ts$/],
                },
            ],
        },
    },
    /* 7. Build development mode. It's for CommonJS and ES2020 target (modern compatible node environments). */
    {
        name: 'cjs.dev',
        entry: path.join(__dirname, 'src', 'lib-core.ts'),
        target: ['node', 'es2020'],
        output: {
            library: {
                type: 'commonjs2',
            },
        },
        module: {
            rules: [
                {
                    use: {
                        options: {
                            configFile: 'tsconfig.cjs.es2020.json',
                        },
                    },
                    exclude: [/.*\.es2015\.ts$/],
                },
            ],
        },
        resolve: {
            alias: {
                'decimal.js': require.resolve('decimal.js'),
            },
        },
    },
];

export default (env: any, argv: any): webpack.Configuration[] => {
    const mode = (argv.mode || 'production') as 'production' | 'development';
    const isProduction = mode === 'production';
    const buildConfiguration = buildConfig[mode];
    const exclude = ['node_modules', 'lib', 'report', 'res', 'script', /.*\.spec\.[jt]s$/].map((dir) => (typeof dir === 'string' ? path.join(__dirname, dir) : dir));
    console.log(`Running Webpack (configuration: ${__filename} ...`);
    console.warn(`Build environment variables:`);
    console.table(env);
    const bundlesConfiguration = WebpackConfiguration.filter((config) => buildConfiguration.bundles.includes(config.name!));
    console.log(`Building the following ${bundlesConfiguration.length === 1 ? `${mode} bundle` : `${bundlesConfiguration.length} ${mode} bundles`}:`);
    return bundlesConfiguration.map((config, index) => {
        console.log(`${index + 1}. ${config.name}`);
        config.mode = mode;
        config.output!.path = path.join(__dirname, 'lib');
        config.output!.filename = `mathjslab.${config.name}.js`;
        // @ts-ignore
        if (config.output.library.type === 'module') {
            config.experiments = {
                outputModule: true,
            };
            // @ts-ignore
        } else if (config.output.library.type.startsWith('umd') || config.output.library.type.startsWith('commonjs')) {
            // @ts-ignore
            config.output!.library.name = 'mathjslab';
            config.output!.globalObject = 'globalThis';
        } else {
            // @ts-ignore
            throw new Error(`invalid output.library.type: '${config.output.library.type}'`);
        }
        // @ts-ignore
        config.module.rules[0].test = /\.ts$/;
        // @ts-ignore
        config.module.rules[0].use.loader = 'ts-loader';
        // @ts-ignore
        if (Array.isArray(config.module.rules[0].exclude)) {
            // @ts-ignore
            config.module.rules[0].exclude.push(...exclude);
        }
        // @ts-ignore
        else if (typeof config.module.rules[0].exclude === 'undefined') {
            // @ts-ignore
            config.module.rules[0].exclude = exclude;
            // @ts-ignore
        } else if (config.module.rules[0].exclude.constructor.name === 'RegExp' || typeof config.module.rules[0].exclude === 'string') {
            // @ts-ignore
            config.module.rules[0].exclude = [exclude];
        } else {
            // @ts-ignore
            throw new Error(`invalid "exclude" parameter at configuration[${index}]: ${config.module.rules[0].exclude}`);
        }
        const extensions = ['.ts', '.js'];
        if (typeof config.resolve === 'object') {
            config.resolve.extensions = extensions;
        } else {
            config.resolve = { extensions };
        }
        config.plugins = [
            isProduction
                ? (new LicenseWebpackPlugin({
                      perChunkOutput: false,
                      outputFilename: `${config.output!.filename}.LICENSE.txt`,
                      addBanner: false,
                      additionalModules: [
                          {
                              name: 'mathjslab',
                              directory: './',
                          },
                          {
                              name: 'decimal.js',
                              directory: './node_modules/decimal.js',
                          },
                      ],
                      licenseTextOverrides: {
                          antlr4: fs.readFileSync(path.resolve(__dirname, 'res', 'antlr-LICENSE.txt'), 'utf-8'),
                      },
                  }) as unknown as webpack.WebpackPluginInstance)
                : undefined,
            new webpack.DefinePlugin({
                __WEBPACK_BUNDLE_CONFIGURATION: JSON.stringify(config.name),
            }),
        ];
        if (typeof buildConfiguration.analyzer !== 'undefined') {
            if (buildConfiguration.analyzer) {
                let options: BundleAnalyzerPlugin.Options = {
                    analyzerMode: 'static',
                    openAnalyzer: true,
                    generateStatsFile: true,
                    defaultSizes: 'stat',
                    statsFilename: `../report/${config.name}.stats.json`,
                    reportFilename: `../report/${config.name}.html`,
                };
                if (typeof buildConfiguration.analyzer === 'object') {
                    options = Object.assign(options, buildConfiguration.analyzer);
                }
                config.plugins.push(new BundleAnalyzerPlugin(options));
            }
        }
        return config;
    });
};
