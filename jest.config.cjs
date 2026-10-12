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
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'unit-tests',
            testEnvironment,
            testMatch: [src_prefix + '*' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'complex-tests',
            testEnvironment,
            testMatch: [src_prefix + 'Complex*' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'blas-tests',
            testEnvironment,
            testMatch: [src_prefix + 'BLAS' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'lapack-tests',
            testEnvironment,
            testMatch: [src_prefix + 'LAPACK' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'blas-lapack-tests',
            testEnvironment,
            testMatch: [src_prefix + '@(BLAS|LAPACK)' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'scope-callframe-callable-context-tests',
            testEnvironment,
            testMatch: [src_prefix + '@(Scope|CallFrame|Callable|Context)' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'interpreter-tests',
            testEnvironment,
            testMatch: [src_prefix + 'Interpreter{,Error}' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'function-tests',
            testEnvironment,
            testMatch: [src_prefix + 'Function*' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'class-tests',
            testEnvironment,
            testMatch: [src_prefix + 'Class*' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'architecture-tests',
            testEnvironment,
            testMatch: [test_prefix + 'architecture/**/*' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'compatibility-tests',
            testEnvironment,
            testMatch: [test_prefix + 'compatibility/**/*' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'parser-fixtures-tests',
            testEnvironment,
            testMatch: [test_prefix + 'parser/**/*' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'function-infrastructure-tests',
            testEnvironment,
            testMatch: [test_prefix + 'function-infrastructure/**/*' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'package-source-tests',
            testEnvironment,
            testMatch: [test_prefix + 'package/**/*' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'mfile-tests',
            testEnvironment,
            testMatch: [test_prefix + 'mfile/mfile.spec.ts'],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'node-tests',
            testEnvironment,
            testMatch: [test_prefix + 'node/**/*' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'node-cjs2015-tests',
            testEnvironment,
            testMatch: [test_prefix + 'node/**/*cjs2015' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'node-cjs2022-tests',
            testEnvironment,
            testMatch: [test_prefix + 'node/**/*cjs2022' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'node-esm2022-tests',
            testEnvironment,
            testMatch: [test_prefix + 'node/**/*esm2022' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'web-tests',
            testEnvironment: 'jsdom',
            testMatch: [test_prefix + 'web/**/*umd2015' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'web-umd2015-tests',
            testEnvironment: 'jsdom',
            testMatch: [test_prefix + 'web/**/*umd2015' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'web-umd2022-tests',
            testEnvironment: 'jsdom',
            testMatch: [test_prefix + 'web/**/*umd2022' + postfix],
            transform,
        },
        {
            modulePathIgnorePatterns: ['<rootDir>/test-results/'],
            displayName: 'web-esm2022-tests',
            testEnvironment: 'jsdom',
            testMatch: [test_prefix + 'web/**/*esm2022' + postfix],
            transform,
        },
    ],
};
