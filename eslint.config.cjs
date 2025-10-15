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
const js = require('@eslint/js');
const jestPlugin = require('eslint-plugin-jest');

console.log(`Running project lint (configuration: ${path.basename(__filename)}) ...`);

const basePlugins = {
    import: importPlugin,
    prettier: prettierPlugin,
};

const prettierRules = {
    ...prettierPlugin.configs.recommended.rules,
    ...eslintConfigPrettier.rules,
};

const tsPluginConfigRules = {
    ...tsPlugin.configs['eslint-recommended'].rules,
    ...tsPlugin.configs['recommended'].rules,
};

const tsConfigRules = {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
};

const esmComplyRules = {
    /* ----------------------------- ESM Modules ----------------------------- */
    /* Disallows the use of TS internal namespaces and modules. */
    '@typescript-eslint/no-namespace': 'error',
    /* Disallows imports with require() */
    '@typescript-eslint/no-require-imports': 'error',
    /* Disallows CommonJS-style exports (module.exports / exports) */
    'import/no-commonjs': 'error',
    /* Disallows the use of dynamic 'require' (CJS) */
    'import/no-dynamic-require': 'error',
    /* Ensures that only ESM syntax is used for import/export. */
    'import/export': 'error',
    /* Ensures import paths are correct (ESM resolves). */
    'import/no-unresolved': ['error', { commonjs: false, caseSensitive: true }],
    /* Disallows redundant imports and requires consistent bundling. */
    'import/order': [
        'warn',
        {
            groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index'],
            'newlines-between': 'always',
        },
    ],
    /* Disallows the use of duplicate exports. */
    'import/no-duplicates': 'error',
    /* Requires all imports to be at the top of the file. */
    'import/first': 'error',
    /* Disallows importing files with incorrect .cjs or .js extensions. */
    'import/extensions': [
        'error',
        'ignorePackages',
        {
            ts: 'never',
            cts: 'never',
            mts: 'never',
        },
    ],
    /* ------------------------ Compatibility and style ---------------------- */
    /* Disallows implicit global variables from CommonJS. */
    'no-undef': 'error',
    /* Disallows direct use of exports, require, module, __dirname, __filename. */
    'no-restricted-globals': [
        'error',
        {
            name: 'exports',
            message: 'Use ES module exports (export/export default) instead.',
        },
        {
            name: 'require',
            message: 'Use ES module imports instead of require().',
        },
        {
            name: 'module',
            message: 'Use ES module syntax instead of module.exports.',
        },
        {
            name: '__dirname',
            message: 'Use import.meta.url and fileURLToPath() in ESM.',
        },
        {
            name: '__filename',
            message: 'Use import.meta.url and fileURLToPath() in ESM.',
        },
    ],
};

const esmComplySettings = {
    'import/resolver': {
        /* Makes eslint-plugin-import understand tsconfig paths. */
        typescript: {
            alwaysTryTypes: true,
        },
        /* Ensures compatibility with ESM and omitted extension. */
        node: {
            extensions: ['.js', '.ts', '.mjs'],
        },
    },
};

module.exports = [
    /* Global configuration. */
    {
        ignores: ['lib/**', 'node_modules/**', 'res/**', 'script/build/**'],
    },
    /* TypeScript source code. */
    {
        ...js.configs.recommended,
        files: ['src/**/*.{,c,m}ts'],
        ignores: ['src/MathJSLabLexer.ts', 'src/MathJSLabParser.ts', 'src/**/*.spec.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: 'tsconfig.json',
                tsconfigRootDir: __dirname,
                sourceType: 'module',
                ecmaVersion: 'latest',
            },
            globals: {
                ...globals.es2021,
                ...globals.node,
                ...globals.browser,
            },
        },
        plugins: {
            ...basePlugins,
            '@typescript-eslint': tsPlugin,
        },
        settings: esmComplySettings,
        rules: {
            ...tsPluginConfigRules,
            ...tsConfigRules,
            ...prettierRules,
            ...esmComplyRules,
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            /* Allows imports without extension. */
            'import/extensions': [
                'error',
                'ignorePackages',
                {
                    js: 'never',
                    ts: 'never',
                    mjs: 'never',
                },
            ],
            /* Disables resolution checking, useful when TS resolves paths. */
            'import/no-unresolved': 'off',
        },
    },
    /* JavaScript source code. */
    {
        files: ['src/**/*.{,c,m}js'],
        ignores: ['src/**/*.spec.{,c,m}js'],
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 2022,
            globals: {
                ...globals.es2021,
                ...globals.node,
                ...globals.browser,
            },
        },
        rules: {
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            /* JavaScript general rules. */
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'error',
        },
    },
    /* TypeScript scripts and configuration. */
    {
        files: ['script/**/*.{,c,m}ts', 'eslint.config.{,c,m}ts', 'jest.config.{,c,m}ts', 'webpack.config.{,c,m}ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: 'tsconfig.json',
                tsconfigRootDir: __dirname,
                globals: {
                    ...globals.es2021,
                    ...globals.node,
                },
            },
        },
        plugins: {
            ...basePlugins,
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPluginConfigRules,
            ...tsConfigRules,
            ...prettierRules,
            'no-console': 'off',
        },
    },
    /* JavaScript scripts and configuration. */
    {
        files: ['script/**/*.{,c,m}js', 'eslint.config.{,c,m}js', 'jest.config.{,c,m}js', 'webpack.config.{,c,m}js'],
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 2022,
            globals: {
                ...globals.es2021,
                ...globals.node,
            },
        },
        rules: {
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            /* JavaScript general rules. */
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'error',
        },
    },
    /*  TypeScript tests. */
    {
        files: ['test/**/*.{,c,m}ts', '**/*.spec.{,c,m}ts'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.es2021,
                ...globals.node,
                ...globals.jest,
                jest: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
            },
        },
        plugins: {
            ...basePlugins,
            '@typescript-eslint': tsPlugin,
            jest: jestPlugin,
        },
        rules: {
            ...tsPluginConfigRules,
            ...tsConfigRules,
            ...prettierRules,
            ...jestPlugin.configs.recommended.rules,
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            /* JavaScript general rules. */
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'error',
            /* Jest specific rules. */
            'jest/no-disabled-tests': 'warn',
            'jest/no-focused-tests': 'error',
            'jest/no-identical-title': 'error',
            'jest/valid-expect': 'error',
        },
    },
    /*  JavaScript tests. */
    {
        files: ['test/**/*.{,c,m}js', '**/*.spec.{,c,m}js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.es2021,
                ...globals.node,
                ...globals.jest,
                jest: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
            },
        },
        plugins: {
            ...basePlugins,
            jest: jestPlugin,
        },
        rules: {
            ...jestPlugin.configs.recommended.rules,
            ...prettierRules,
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            /* JavaScript general rules. */
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'no-console': 'off',
            /* Jest specific rules. */
            'jest/no-disabled-tests': 'warn',
            'jest/no-focused-tests': 'error',
            'jest/no-identical-title': 'error',
            'jest/valid-expect': 'error',
        },
    },
];
