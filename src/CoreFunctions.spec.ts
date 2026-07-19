/// <reference types="jest" />
import path from 'node:path';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { CoreFunctions } from './CoreFunctions';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Definition', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(CoreFunctions).toBeDefined();
            expect(CoreFunctions.functions.isempty.func).toBe(CoreFunctions.isempty);
            expect(CoreFunctions.functions.isempty.signature).toBe(CoreFunctions.isemptySignature);
        });
    });

    describe('Shape predicates and dimensions', () => {
        it('Should classify scalar, vector, matrix, cell, and structure values.', () => {
            const scalar = Complex.create(1);
            const row = MultiArray.firstRow([Complex.one(), Complex.two()]);
            const matrix = new MultiArray([2, 2]);
            const cell = MultiArray.firstRow([new CharString('x')], true);
            const structure = new Structure({ value: Complex.one() });

            expect(Complex.realToNumber(CoreFunctions.isscalar(scalar))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isrow(row))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isvector(row))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.ismatrix(matrix))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.iscell(cell))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isstruct(structure))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.ischar(new CharString('abc')))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isnumeric(matrix))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isnumeric(Complex.true()))).toBe(0);
            expect(Complex.realToNumber(CoreFunctions.islogical(MultiArray.firstRow([Complex.true(), Complex.false()])))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isreal(MultiArray.firstRow([Complex.one(), Complex.create(2)])))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isreal(Complex.true()))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isreal(Complex.create(1, 2)))).toBe(0);
        });

        it('Should report ndims, rows, columns, length, and numel.', () => {
            const matrix = new MultiArray([2, 3]);

            expect(Complex.realToNumber(CoreFunctions.ndims(matrix))).toBe(2);
            expect(Complex.realToNumber(CoreFunctions.rows(matrix))).toBe(2);
            expect(Complex.realToNumber(CoreFunctions.columns(matrix))).toBe(3);
            expect(Complex.realToNumber(CoreFunctions.Length(matrix))).toBe(3);
            expect(Complex.realToNumber(CoreFunctions.numel(matrix))).toBe(6);
            expect(Complex.realToNumber(CoreFunctions.numel(matrix, new CharString(':'), Complex.one()))).toBe(2);
        });

        it('Should distinguish vector and matrix norm orders 1 and Inf.', () => {
            const vector = MultiArray.firstRow([Complex.create(1), Complex.create(-2), Complex.create(3)]);
            const matrix = new MultiArray([2, 2]);
            matrix.array[0][0] = Complex.create(1);
            matrix.array[0][1] = Complex.create(2);
            matrix.array[1][0] = Complex.create(3);
            matrix.array[1][1] = Complex.create(4);

            expect(Complex.realToNumber(CoreFunctions.norm(vector, Complex.create(1)) as any)).toBe(6);
            expect(Complex.realToNumber(CoreFunctions.norm(vector, Complex.inf_0()) as any)).toBe(3);
            expect(Complex.realToNumber(CoreFunctions.norm(vector, Complex.create(-Infinity)) as any)).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.norm(matrix, Complex.create(1)) as any)).toBe(6);
            expect(Complex.realToNumber(CoreFunctions.norm(matrix, Complex.inf_0()) as any)).toBe(7);
            expect(() => CoreFunctions.norm(matrix, Complex.create(-Infinity))).toThrow('Invalid call to norm.');
        });

        it('Should compute matrix spectral norm for default and order 2.', () => {
            const matrix = new MultiArray([2, 2]);
            matrix.array[0][0] = Complex.create(1);
            matrix.array[0][1] = Complex.create(2);
            matrix.array[1][0] = Complex.create(3);
            matrix.array[1][1] = Complex.create(4);
            const expected = Math.sqrt((30 + Math.sqrt(884)) / 2);

            expect(Complex.realToNumber(CoreFunctions.norm(matrix) as any)).toBeCloseTo(expected, 10);
            expect(Complex.realToNumber(CoreFunctions.norm(matrix, Complex.create(2)) as any)).toBeCloseTo(expected, 10);
            expect(() => CoreFunctions.norm(matrix, Complex.create(3))).toThrow('Invalid call to norm.');
        });

        it('Should test structure fields by name or cell array of names.', () => {
            const structure = new Structure({ alpha: Complex.one(), beta: Complex.two() });
            const names = MultiArray.firstRow([new CharString('alpha'), new CharString('missing')], true);
            const result = CoreFunctions.isfield(structure, names) as MultiArray;

            expect(CoreFunctions.functions.isfield.func).toBe(CoreFunctions.isfield);
            expect(CoreFunctions.functions.isfield.signature).toBe(CoreFunctions.isfieldSignature);
            expect(Complex.realToNumber(CoreFunctions.isfield(structure, new CharString('alpha')) as any)).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isfield(structure, new CharString('missing')) as any)).toBe(0);
            expect(result).toBeInstanceOf(MultiArray);
            expect(result.dimension).toEqual([1, 2]);
            expect(result.array[0].map((value) => Complex.realToNumber(value as any))).toEqual([1, 0]);
        });
    });

    describe('Validation', () => {
        it('Should reject invalid arity for scalar predicates.', () => {
            expect(() => CoreFunctions.isempty(Complex.one(), Complex.two())).toThrow("Invalid call to isempty. Type 'help isempty' to see correct usage.");
            expect(() => CoreFunctions.isrow()).toThrow("Invalid call to isrow. Type 'help isrow' to see correct usage.");
        });

        it('Should reject cell arrays for functions that require numeric arrays.', () => {
            expect(() => CoreFunctions.throwErrorIfCellArray('sample', MultiArray.firstRow([Complex.one()], true))).toThrow("sample: wrong type argument 'cell'");
        });
    });
});
