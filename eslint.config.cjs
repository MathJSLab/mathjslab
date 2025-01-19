/**
 * eslint.config.cjs: ESLint configuration.
 */
const path = require('node:path');
const globals = require('globals');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierPlugin = require('eslint-plugin-prettier');
const eslintConfigPrettier = require('eslint-config-prettier');
const importPlugin = require('eslint-plugin-import');

console.log(`Running project lint (configuration: ${path.basename(__filename)}) ...`);

module.exports = [
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: 'tsconfig.json',
                tsconfigRootDir: __dirname,
                sourceType: 'module',
                globals: {
                    ...globals.es2015,
                },
            },
        },
        plugins: {
            import: importPlugin,
            '@typescript-eslint': tsPlugin,
            prettier: prettierPlugin,
        },
        ignores: ['eslint.config.*', 'jest.config.*', 'webpack.config.*', '**/*.spec.*', 'res/**', 'lib/**', 'src/MathJSLabLexer.ts', 'src/MathJSLabParser.ts'],
        rules: {
            ...tsPlugin.configs['eslint-recommended'].rules,
            ...tsPlugin.configs['recommended'].rules,
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/ban-types': 'off',
            'no-console': 'warn',
            ...prettierPlugin.configs.recommended.rules,
            ...eslintConfigPrettier.rules,
        },
    },
    {
        files: ['script/**/*.ts', 'eslint.config.*', 'jest.config.*', 'webpack.config.*', '**/*.spec.*'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: 'tsconfig.json',
                tsconfigRootDir: __dirname,
                globals: {
                    ...globals.es2015,
                },
            },
        },
        plugins: {
            import: importPlugin,
            '@typescript-eslint': tsPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            ...tsPlugin.configs['eslint-recommended'].rules,
            ...tsPlugin.configs['recommended'].rules,
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'no-console': 'off',
            ...prettierPlugin.configs.recommended.rules,
            ...eslintConfigPrettier.rules,
        },
    },
];
