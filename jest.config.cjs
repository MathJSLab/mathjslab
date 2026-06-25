/**
 * jest.config.js: Jest configuration.
 */

/** @type {import('jest').Config} */
module.exports = {
    verbose: true,
    preset: 'ts-jest',
    moduleFileExtensions: ['ts', 'js', 'json'],
    rootDir: '.',
    projects: [
        {
            displayName: 'unit-tests',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/src/**/*.spec.{js,cjs,mjs,ts,cts,mts}'],
            transform: {
                '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
            },
        },
        {
            displayName: 'lapack-tests',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/src/**/LAPACK.spec.{js,cjs,mjs,ts,cts,mts}'],
            transform: {
                '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
            },
        },
        {
            displayName: 'lapack-single-tests',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/src/**/LAPACKsingle.spec.{js,cjs,mjs,ts,cts,mts}'],
            transform: {
                '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
            },
        },
        {
            displayName: 'interpreter-tests',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/src/**/Interpreter.spec.{js,cjs,mjs,ts,cts,mts}'],
            transform: {
                '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
            },
        },
        {
            displayName: 'node-cjs2015-tests',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/test/node/**/*cjs2015.spec.{js,cjs,mjs,ts,cts,mts}'],
            transform: {
                '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
            },
        },
        {
            displayName: 'node-cjs2022-tests',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/test/node/**/*cjs2022.spec.{js,cjs,mjs,ts,cts,mts}'],
            transform: {
                '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
            },
        },
        {
            displayName: 'node-esm2022-tests',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/test/node/**/*esm2022.spec.{js,cjs,mjs,ts,cts,mts}'],
            transform: {
                '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
            },
        },
        {
            displayName: 'web-umd2015-tests',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/test/web/**/*umd2015.spec.{js,cjs,mjs,ts,cts,mts}'],
            transform: {
                '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
            },
        },
        {
            displayName: 'web-umd2022-tests',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/test/web/**/*umd2022.spec.{js,cjs,mjs,ts,cts,mts}'],
            transform: {
                '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
            },
        },
        {
            displayName: 'web-esm2022-tests',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/test/web/**/*esm2022.spec.{js,cjs,mjs,ts,cts,mts}'],
            transform: {
                '^.+\\.[cm]?ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
            },
        },
    ],
};
