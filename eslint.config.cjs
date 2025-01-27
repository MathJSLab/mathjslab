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
        files: ['script/**/*.{ts,cts,mts}', 'eslint.config.{ts,cts,mts}', 'jest.config.{ts,cts,mts}', 'webpack.config.{ts,cts,mts}', '**/*.spec.{ts,cts,mts}'],
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
            '@typescript-eslint/ban-ts-comment': 'off',
        },
    },
    {
        files: ['**/*.{js,cjs,mjs}', '**/*.spec.{js,cjs,mjs}'],
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 2020,
            globals: {
                ...globals.node,
                jest: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
            },
        },
        plugins: {
            jest: require('eslint-plugin-jest'),
        },
        rules: {
            // JavaScript general rules.
            'no-unused-vars': 'warn',
            'no-undef': 'error',
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            // Jest specific rules.
            'jest/no-disabled-tests': 'warn',
            'jest/no-focused-tests': 'error',
            'jest/no-identical-title': 'error',
            'jest/valid-expect': 'error',
        },
    },
];
