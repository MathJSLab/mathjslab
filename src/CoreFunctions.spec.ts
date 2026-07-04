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
            expect(CoreFunctions.functions.isempty).toBe(CoreFunctions.isempty);
            expect(CoreFunctions.signatures.isempty).toBeDefined();
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
