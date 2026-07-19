/// <reference types="jest" />
import path from 'node:path';
import type { BuiltInFunctionParameter } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';
import { FunctionHandle } from './FunctionHandle';
import { FunctionValidation } from './FunctionValidation';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Behavior', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(FunctionValidation).toBeDefined();
            expect(FunctionValidation.matchesBuiltInParameter).toBeDefined();
        });

        it('Should classify scalar, array, cell, text and function handle values.', () => {
            const matrix = new MultiArray([1, 2], [[Complex.create(1), Complex.create(2)]]);
            const logicalRow = new MultiArray([1, 2], [[Complex.true(), Complex.false()]]);
            const cell = new MultiArray([1, 1], [[Complex.create(1)]], true);

            expect(FunctionValidation.className(Complex.create(1))).toBe('double');
            expect(FunctionValidation.className(Complex.true())).toBe('logical');
            expect(FunctionValidation.className(matrix)).toBe('double');
            expect(FunctionValidation.className(logicalRow)).toBe('logical');
            expect(FunctionValidation.className(cell)).toBe('cell');
            expect(FunctionValidation.className(new CharString('x'))).toBe('char');
            expect(FunctionValidation.className(FunctionHandle.create('sin'))).toBe('function_handle');
        });

        it('Should expose numeric elements only for numeric scalar and non-cell arrays.', () => {
            const matrix = new MultiArray([1, 2], [[Complex.create(1), Complex.create(2)]]);
            const logicalRow = new MultiArray([1, 2], [[Complex.true(), Complex.false()]]);
            const cell = new MultiArray([1, 1], [[Complex.create(1)]], true);

            expect(FunctionValidation.numericElements(Complex.create(1))).toHaveLength(1);
            expect(FunctionValidation.numericElements(Complex.true())).toBeUndefined();
            expect(FunctionValidation.numericElements(matrix)).toHaveLength(2);
            expect(FunctionValidation.numericElements(logicalRow)).toBeUndefined();
            expect(FunctionValidation.numericElements(logicalRow, { includeLogical: true })).toHaveLength(2);
            expect(FunctionValidation.isLogicalValue(logicalRow)).toBe(true);
            expect(FunctionValidation.numericElements(cell)).toBeUndefined();
            expect(FunctionValidation.numericElements(new CharString('x'))).toBeUndefined();
        });

        it('Should match MATLAB-like built-in argument validators.', () => {
            const matrix = new MultiArray(
                [2, 2],
                [
                    [Complex.create(1), Complex.create(2)],
                    [Complex.create(3), Complex.create(4)],
                ],
            );
            const row = new MultiArray([1, 2], [[Complex.create(1), Complex.create(2)]]);
            const withZero = new MultiArray([1, 2], [[Complex.create(1), Complex.create(0)]]);

            expect(FunctionValidation.matchesBuiltInValidator(matrix, 'numericOrLogical')).toBe(true);
            expect(FunctionValidation.matchesBuiltInValidator(Complex.true(), 'numeric')).toBe(false);
            expect(FunctionValidation.matchesBuiltInValidator(Complex.true(), 'numericOrLogical')).toBe(true);
            expect(FunctionValidation.matchesBuiltInValidator(new CharString('x'), 'numericOrLogical')).toBe(false);
            expect(FunctionValidation.matchesBuiltInValidator(new CharString('x'), 'textScalar')).toBe(true);
            expect(FunctionValidation.matchesBuiltInValidator(Complex.create(1), 'textScalar')).toBe(false);
            expect(FunctionValidation.matchesBuiltInValidator(new CharString('abc'), 'scalar')).toBe(false);
            expect(FunctionValidation.matchesBuiltInValidator(new CharString('abc'), 'vector')).toBe(true);
            expect(FunctionValidation.matchesBuiltInValidator(new CharString('ab'), 'twoElement')).toBe(true);
            expect(FunctionValidation.matchesBuiltInValidator(row, 'matrix2d')).toBe(true);
            expect(FunctionValidation.matchesBuiltInValidator(matrix, 'squareMatrix')).toBe(true);
            expect(FunctionValidation.matchesBuiltInValidator(row, 'squareMatrix')).toBe(false);
            expect(FunctionValidation.matchesBuiltInValidator(matrix, 'nonzero')).toBe(true);
            expect(FunctionValidation.matchesBuiltInValidator(withZero, 'nonzero')).toBe(false);
        });

        it('Should map MATLAB-like arguments block validator names to built-in predicates.', () => {
            expect(FunctionValidation.builtInValidatorForArgumentValidator('mustBeNumericOrLogical')).toBe('numericOrLogical');
            expect(FunctionValidation.builtInValidatorForArgumentValidator('mustBeTextScalar')).toBe('textScalar');
            expect(FunctionValidation.builtInValidatorForArgumentValidator('mustBeMatrix')).toBe('matrix2d');
            expect(FunctionValidation.builtInValidatorForArgumentValidator('mustBeSquare')).toBe('squareMatrix');
            expect(FunctionValidation.builtInValidatorForArgumentValidator('mustBeNonzero')).toBe('nonzero');
        });

        it('Should validate dimensions and reshape dimensions.', () => {
            expect(FunctionValidation.isDimensionValue(Complex.create(0), false)).toBe(true);
            expect(FunctionValidation.isDimensionValue(Complex.create(2), false)).toBe(true);
            expect(FunctionValidation.isDimensionValue(Complex.create(-1), false)).toBe(false);
            expect(FunctionValidation.isDimensionValue(new CharString(''), true)).toBe(true);
            expect(FunctionValidation.isDimensionVector(Complex.create(2), false)).toBe(true);
            expect(FunctionValidation.isDimensionVector(new MultiArray([1, 2], [[Complex.create(2), Complex.create(3)]]), false)).toBe(true);
            expect(FunctionValidation.isDimensionVector(new MultiArray([1, 2], [[Complex.create(2), Complex.create(-3)]]), false)).toBe(false);
        });

        it('Should match parameters with classes, string sets and identifier constraints.', () => {
            expect(FunctionValidation.matchesParameter(Complex.create(1), { classes: ['double'], validators: ['scalar', 'real'] })).toBe(true);
            expect(FunctionValidation.matchesParameter(Complex.true(), { classes: ['double'] })).toBe(false);
            expect(FunctionValidation.matchesParameter(Complex.true(), { classes: ['logical'] })).toBe(true);
            expect(FunctionValidation.matchesParameter(new CharString('omitnan'), { classes: ['char'], allowedStrings: ['omitnan', 'includenan'] })).toBe(true);
            expect(FunctionValidation.matchesParameter(new CharString('bad-name'), { classes: ['char'], identifier: true })).toBe(false);
            expect(FunctionValidation.matchesParameter(new CharString('good_name'), { classes: ['char'], identifier: true })).toBe(true);
        });

        it('Should match variadic parameter groups repeatedly.', () => {
            const args = [new CharString('a'), Complex.create(1), new CharString('b'), Complex.create(2)];
            const parameters: BuiltInFunctionParameter[] = [
                {
                    name: 'pair',
                    variadic: true,
                    variadicGroup: [
                        { name: 'field', classes: ['char'] },
                        { name: 'value', classes: ['double'], validators: ['scalar'] },
                    ],
                },
            ];

            expect(FunctionValidation.argumentsMatchBuiltInParameters(args, parameters)).toBe(true);
            expect(FunctionValidation.argumentsMatchBuiltInParameters([Complex.create(1), new CharString('a')], parameters)).toBe(false);
        });
    });
});
