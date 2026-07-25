/// <reference types="jest" />
import path from 'node:path';
import { CharString } from './CharString';
import { Complex, type ComplexType } from './Complex';
import { CoreFunctions } from './CoreFunctions';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const realNumber = (value: unknown): number => {
    if (!Complex.isInstanceOf(value)) {
        throw new Error('expected a Complex scalar.');
    }
    return Complex.realToNumber(value as ComplexType);
};

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

        it('Should convert numeric and text values to character arrays.', () => {
            const vector = MultiArray.firstRow([Complex.create(65), Complex.create(66), Complex.create(67)]);
            const matrix = new MultiArray([2, 2]);
            matrix.array[0][0] = Complex.create(65);
            matrix.array[0][1] = Complex.create(66);
            matrix.array[1][0] = Complex.create(67);
            matrix.array[1][1] = Complex.create(68);

            expect((CoreFunctions.char(Complex.create(65)) as CharString).str).toBe('A');
            expect((CoreFunctions.char(vector) as CharString).str).toBe('ABC');
            expect((CoreFunctions.char(new CharString('abc')) as CharString).str).toBe('abc');
            expect((CoreFunctions.char(Complex.create(65.9)) as CharString).str).toBe('A');
            expect((CoreFunctions.char(Complex.create(-1)) as CharString).str.charCodeAt(0)).toBe(0);
            expect((CoreFunctions.char(Complex.create(70000)) as CharString).str.charCodeAt(0)).toBe(65535);

            const charMatrix = CoreFunctions.char(matrix) as MultiArray;
            expect(charMatrix.dimension).toEqual([2, 2]);
            expect((charMatrix.array[0][0] as CharString).str).toBe('A');
            expect((charMatrix.array[1][1] as CharString).str).toBe('D');

            const padded = CoreFunctions.char(new CharString('ab'), new CharString('c')) as MultiArray;
            expect(padded.dimension).toEqual([2, 2]);
            expect((padded.array[1][1] as CharString).str).toBe(' ');
            expect(() => CoreFunctions.char(MultiArray.firstRow([new CharString('x')], true))).toThrow('char: invalid conversion input.');
        });

        it('Should convert numeric and character values to double arrays.', () => {
            const numeric = MultiArray.firstRow([Complex.create(1), Complex.true()]);
            const charMatrix = CoreFunctions.char(new CharString('ab'), new CharString('c')) as MultiArray;

            expect(realNumber(CoreFunctions.double(Complex.true()))).toBe(1);
            expect(CoreFunctions.double(Complex.create(1, 2))!.toString()).toBe('1+2i');
            expect((CoreFunctions.double(new CharString('A')) as ComplexType).toString()).toBe('65');
            expect((CoreFunctions.double(new CharString('ABC')) as MultiArray).array[0].map(realNumber)).toEqual([65, 66, 67]);

            const numericResult = CoreFunctions.double(numeric) as MultiArray;
            expect(numericResult.dimension).toEqual([1, 2]);
            expect(numericResult.array[0].map(realNumber)).toEqual([1, 1]);

            const charMatrixCodes = CoreFunctions.double(charMatrix) as MultiArray;
            expect(charMatrixCodes.dimension).toEqual([2, 2]);
            expect(charMatrixCodes.array.map((row) => row.map(realNumber))).toEqual([
                [97, 98],
                [99, 32],
            ]);
            expect((CoreFunctions.double(new CharString('')) as MultiArray).dimension).toEqual([0, 0]);
            expect(() => CoreFunctions.double(MultiArray.firstRow([new CharString('x')], true))).toThrow('double: invalid conversion input.');
        });

        it('Should convert numeric and character values to logical arrays.', () => {
            const numeric = new MultiArray([2, 2]);
            numeric.array[0][0] = Complex.zero();
            numeric.array[0][1] = Complex.create(-2);
            numeric.array[1][0] = Complex.create(3);
            numeric.array[1][1] = Complex.true();
            const charCodes = CoreFunctions.char(MultiArray.firstRow([Complex.create(65), Complex.zero()])) as CharString;

            expect(realNumber(CoreFunctions.logical(Complex.zero()))).toBe(0);
            expect(realNumber(CoreFunctions.logical(Complex.create(-1)))).toBe(1);
            expect((CoreFunctions.logical(numeric) as MultiArray).array.map((row) => row.map(realNumber))).toEqual([
                [0, 1],
                [1, 1],
            ]);
            expect((CoreFunctions.logical(charCodes) as MultiArray).array[0].map(realNumber)).toEqual([1, 0]);
            expect((CoreFunctions.logical(new CharString('')) as MultiArray).dimension).toEqual([0, 0]);
            expect(() => CoreFunctions.logical(Complex.create(1, 2))).toThrow('logical: complex and NaN values cannot be converted to logical.');
            expect(() => CoreFunctions.logical(Complex.NaN_0())).toThrow('logical: complex and NaN values cannot be converted to logical.');
            expect(() => CoreFunctions.logical(MultiArray.firstRow([new CharString('x')], true))).toThrow('logical: invalid conversion input.');
        });

        it('Should classify finite, infinite, and NaN values.', () => {
            const values = MultiArray.firstRow([Complex.create(1), Complex.NaN_0(), Complex.inf_0(), Complex.create(Infinity, NaN), Complex.create(1, 2)]);
            const text = new CharString('abc');

            expect(realNumber(CoreFunctions.isnan(Complex.NaN_0()))).toBe(1);
            expect(realNumber(CoreFunctions.isnan(Complex.create(Infinity, NaN)))).toBe(1);
            expect(realNumber(CoreFunctions.isinf(Complex.inf_0()))).toBe(1);
            expect(realNumber(CoreFunctions.isinf(Complex.create(Infinity, NaN)))).toBe(1);
            expect(realNumber(CoreFunctions.isfinite(Complex.create(1, 2)))).toBe(1);
            expect(realNumber(CoreFunctions.isfinite(Complex.create(1, Infinity)))).toBe(0);
            expect((CoreFunctions.isnan(values) as MultiArray).array[0].map(realNumber)).toEqual([0, 1, 0, 1, 0]);
            expect((CoreFunctions.isinf(values) as MultiArray).array[0].map(realNumber)).toEqual([0, 0, 1, 1, 0]);
            expect((CoreFunctions.isfinite(values) as MultiArray).array[0].map(realNumber)).toEqual([1, 0, 0, 0, 1]);
            expect((CoreFunctions.isfinite(text) as MultiArray).array[0].map(realNumber)).toEqual([1, 1, 1]);
            expect(() => CoreFunctions.isnan(MultiArray.firstRow([new CharString('x')], true))).toThrow('isnan: invalid conversion input.');
            expect(() => CoreFunctions.isinf(MultiArray.firstRow([new CharString('x')], true))).toThrow('isinf: invalid conversion input.');
            expect(() => CoreFunctions.isfinite(MultiArray.firstRow([new CharString('x')], true))).toThrow('isfinite: invalid conversion input.');
        });

        it('Should classify floating-point and integer storage classes.', () => {
            expect(realNumber(CoreFunctions.isfloat(Complex.create(2)))).toBe(1);
            expect(realNumber(CoreFunctions.isfloat(Complex.create(2, 3)))).toBe(1);
            expect(realNumber(CoreFunctions.isfloat(MultiArray.firstRow([Complex.create(1), Complex.NaN_0(), Complex.inf_0()])))).toBe(1);
            expect(realNumber(CoreFunctions.isfloat(Complex.true()))).toBe(0);
            expect(realNumber(CoreFunctions.isfloat(new CharString('abc')))).toBe(0);
            expect(realNumber(CoreFunctions.isinteger(Complex.create(2)))).toBe(0);
            expect(realNumber(CoreFunctions.isinteger(MultiArray.firstRow([Complex.create(1), Complex.create(2)])))).toBe(0);
            expect(realNumber(CoreFunctions.isinteger(Complex.true()))).toBe(0);
            expect(realNumber(CoreFunctions.isinteger(new CharString('abc')))).toBe(0);
            expect(() => CoreFunctions.isfloat()).toThrow("Invalid call to isfloat. Type 'help isfloat' to see correct usage.");
            expect(() => CoreFunctions.isinteger()).toThrow("Invalid call to isinteger. Type 'help isinteger' to see correct usage.");
        });

        it('Should distinguish vector and matrix norm orders 1 and Inf.', () => {
            const vector = MultiArray.firstRow([Complex.create(1), Complex.create(-2), Complex.create(3)]);
            const matrix = new MultiArray([2, 2]);
            matrix.array[0][0] = Complex.create(1);
            matrix.array[0][1] = Complex.create(2);
            matrix.array[1][0] = Complex.create(3);
            matrix.array[1][1] = Complex.create(4);

            expect(realNumber(CoreFunctions.norm(vector, Complex.create(1)))).toBe(6);
            expect(realNumber(CoreFunctions.norm(vector, Complex.inf_0()))).toBe(3);
            expect(realNumber(CoreFunctions.norm(vector, Complex.create(-Infinity)))).toBe(1);
            expect(realNumber(CoreFunctions.norm(matrix, Complex.create(1)))).toBe(6);
            expect(realNumber(CoreFunctions.norm(matrix, Complex.inf_0()))).toBe(7);
            expect(() => CoreFunctions.norm(matrix, Complex.create(-Infinity))).toThrow('Invalid call to norm.');
        });

        it('Should compute matrix spectral norm for default and order 2.', () => {
            const matrix = new MultiArray([2, 2]);
            matrix.array[0][0] = Complex.create(1);
            matrix.array[0][1] = Complex.create(2);
            matrix.array[1][0] = Complex.create(3);
            matrix.array[1][1] = Complex.create(4);
            const expected = Math.sqrt((30 + Math.sqrt(884)) / 2);

            expect(realNumber(CoreFunctions.norm(matrix))).toBeCloseTo(expected, 10);
            expect(realNumber(CoreFunctions.norm(matrix, Complex.create(2)))).toBeCloseTo(expected, 10);
            expect(() => CoreFunctions.norm(matrix, Complex.create(3))).toThrow('Invalid call to norm.');
        });

        it('Should test structure fields by name or cell array of names.', () => {
            const structure = new Structure({ alpha: Complex.one(), beta: Complex.two() });
            const names = MultiArray.firstRow([new CharString('alpha'), new CharString('missing')], true);
            const result = CoreFunctions.isfield(structure, names) as MultiArray;

            expect(CoreFunctions.functions.isfield.func).toBe(CoreFunctions.isfield);
            expect(CoreFunctions.functions.isfield.signature).toBe(CoreFunctions.isfieldSignature);
            expect(realNumber(CoreFunctions.isfield(structure, new CharString('alpha')))).toBe(1);
            expect(realNumber(CoreFunctions.isfield(structure, new CharString('missing')))).toBe(0);
            expect(result).toBeInstanceOf(MultiArray);
            expect(result.dimension).toEqual([1, 2]);
            expect(result.array[0].map(realNumber)).toEqual([1, 0]);
        });

        it('Should build substruct descriptors for dot, paren, and brace subscripts.', () => {
            const dotDescriptor = CoreFunctions.substruct(new CharString('.'), new CharString('field')) as Structure;
            const parenSubs = MultiArray.firstRow([Complex.create(2), new CharString(':')], true);
            const braceSubs = MultiArray.firstRow([Complex.one()], true);
            const descriptorArray = CoreFunctions.substruct(new CharString('()'), parenSubs, new CharString('{}'), braceSubs) as MultiArray;

            expect(CoreFunctions.functions.substruct.func).toBe(CoreFunctions.substruct);
            expect(CoreFunctions.functions.substruct.signature).toBe(CoreFunctions.substructSignature);
            expect((dotDescriptor.field.type as CharString).str).toBe('.');
            expect((dotDescriptor.field.subs as CharString).str).toBe('field');
            expect(descriptorArray.dimension).toEqual([1, 2]);
            expect((descriptorArray.array[0][0] as Structure).field.type).toEqual(new CharString('()'));
            expect((descriptorArray.array[0][1] as Structure).field.type).toEqual(new CharString('{}'));
            expect(((descriptorArray.array[0][0] as Structure).field.subs as MultiArray).array[0].map((value) => value!.toString())).toEqual(['2', ':']);
            expect(((descriptorArray.array[0][1] as Structure).field.subs as MultiArray).array[0].map((value) => value!.toString())).toEqual(['1']);
        });
    });

    describe('Validation', () => {
        it('Should reject invalid arity for scalar predicates.', () => {
            expect(() => CoreFunctions.isempty(Complex.one(), Complex.two())).toThrow("Invalid call to isempty. Type 'help isempty' to see correct usage.");
            expect(() => CoreFunctions.isrow()).toThrow("Invalid call to isrow. Type 'help isrow' to see correct usage.");
        });

        it('Should report the correct built-in name for direct spacing helper arity errors.', () => {
            expect(() => CoreFunctions.linspace(Complex.one())).toThrow("Invalid call to linspace. Type 'help linspace' to see correct usage.");
            expect(() => CoreFunctions.logspace(Complex.one())).toThrow("Invalid call to logspace. Type 'help logspace' to see correct usage.");
        });

        it('Should reject cell arrays for functions that require numeric arrays.', () => {
            expect(() => CoreFunctions.throwErrorIfCellArray('sample', MultiArray.firstRow([Complex.one()], true))).toThrow("sample: wrong type argument 'cell'");
        });

        it('Should reject malformed substruct descriptor arguments.', () => {
            expect(() => CoreFunctions.substruct(new CharString('.'))).toThrow('substruct: arguments must occur as TYPE, SUBS pairs');
            expect(() => CoreFunctions.substruct(Complex.one(), new CharString('field'))).toThrow('substruct: arguments must occur as TYPE, SUBS pairs');
            expect(() => CoreFunctions.substruct(new CharString('bad'), MultiArray.firstRow([], true))).toThrow("substruct: TYPE must be '.', '()', or '{}'.");
            expect(() => CoreFunctions.substruct(new CharString('.'), Complex.one())).toThrow('substruct: dot subscripts must be character strings.');
            expect(() => CoreFunctions.substruct(new CharString('()'), Complex.one())).toThrow('substruct: () subscripts must be supplied as a cell array.');
            expect(() => CoreFunctions.substruct(new CharString('{}'), Complex.one())).toThrow('substruct: {} subscripts must be supplied as a cell array.');
        });
    });
});
