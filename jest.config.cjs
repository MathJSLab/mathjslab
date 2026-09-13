/**
 * jest.config.js: Jest configuration.
 */
const tsconfig = '<rootDir>/tsconfig.jest.json';
const transform = {
    '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig }],
};
const postfix = '.spec.?([cm])[jt]s';
const src_prefix = '<rootDir>/src/**/';
const test_prefix = '<rootDir>/test/';
const testEnvironment = 'node';
/** @type {import('jest').Config} */
module.exports = {
    verbose: true,
    preset: 'ts-jest',
    moduleFileExtensions: ['ts', 'js', 'json'],
    rootDir: '.',
    projects: [
        {
            displayName: 'unit-tests',
            testEnvironment,
            testMatch: [src_prefix + '*' + postfix],
            transform,
        },
        {
            displayName: 'complex-tests',
            testEnvironment,
            testMatch: [src_prefix + 'Complex*' + postfix],
            transform,
        },
        {
            displayName: 'blas-tests',
            testEnvironment,
            testMatch: [src_prefix + 'BLAS' + postfix],
            transform,
        },
        {
            displayName: 'lapack-tests',
            testEnvironment,
            testMatch: [src_prefix + 'LAPACK' + postfix],
            transform,
        },
        {
            displayName: 'blas-lapack-tests',
            testEnvironment,
            testMatch: [src_prefix + '@(BLAS|LAPACK)' + postfix],
            transform,
        },
        {
            displayName: 'scope-callframe-callable-context-tests',
            testEnvironment,
            testMatch: [src_prefix + '@(Scope|CallFrame|Callable|Context)' + postfix],
            transform,
        },
        {
            displayName: 'interpreter-tests',
            testEnvironment,
            testMatch: [src_prefix + 'Interpreter{,Error}' + postfix],
            transform,
        },
        {
            displayName: 'function-tests',
            testEnvironment,
            testMatch: [src_prefix + 'Function*' + postfix],
            transform,
        },
        {
            displayName: 'class-tests',
            testEnvironment,
            testMatch: [src_prefix + 'Class*' + postfix],
            transform,
        },
        {
            displayName: 'architecture-tests',
            testEnvironment,
            testMatch: [test_prefix + 'architecture/**/*' + postfix],
            transform,
        },
        {
            displayName: 'compatibility-tests',
            testEnvironment,
            testMatch: [test_prefix + 'compatibility/**/*' + postfix],
            transform,
        },
        {
            displayName: 'parser-fixtures-tests',
            testEnvironment,
            testMatch: [test_prefix + 'parser/**/*' + postfix],
            transform,
        },
        {
            displayName: 'function-infrastructure-tests',
            testEnvironment,
            testMatch: [test_prefix + 'function-infrastructure/**/*' + postfix],
            transform,
        },
        {
            displayName: 'package-source-tests',
            testEnvironment,
            testMatch: [test_prefix + 'package/**/*' + postfix],
            transform,
        },
        {
            displayName: 'mfile-tests',
            testEnvironment,
            testMatch: [test_prefix + 'mfile/mfile.spec.ts'],
            transform,
        },
        {
            displayName: 'node-tests',
            testEnvironment,
            testMatch: [test_prefix + 'node/**/*' + postfix],
            transform,
        },
        {
            displayName: 'node-cjs2015-tests',
            testEnvironment,
            testMatch: [test_prefix + 'node/**/*cjs2015' + postfix],
            transform,
        },
        {
            displayName: 'node-cjs2022-tests',
            testEnvironment,
            testMatch: [test_prefix + 'node/**/*cjs2022' + postfix],
            transform,
        },
        {
            displayName: 'node-esm2022-tests',
            testEnvironment,
            testMatch: [test_prefix + 'node/**/*esm2022' + postfix],
            transform,
        },
        {
            displayName: 'web-tests',
            testEnvironment: 'jsdom',
            testMatch: [test_prefix + 'web/**/*umd2015' + postfix],
            transform,
        },
        {
            displayName: 'web-umd2015-tests',
            testEnvironment: 'jsdom',
            testMatch: [test_prefix + 'web/**/*umd2015' + postfix],
            transform,
        },
        {
            displayName: 'web-umd2022-tests',
            testEnvironment: 'jsdom',
            testMatch: [test_prefix + 'web/**/*umd2022' + postfix],
            transform,
        },
        {
            displayName: 'web-esm2022-tests',
            testEnvironment: 'jsdom',
            testMatch: [test_prefix + 'web/**/*esm2022' + postfix],
            transform,
        },
    ],
};
