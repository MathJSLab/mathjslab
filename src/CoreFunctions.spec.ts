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
            expect(Complex.realToNumber(CoreFunctions.issparse(matrix))).toBe(0);
            expect(Complex.realToNumber(CoreFunctions.ischar(new CharString('abc', "'")))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.ischar(new CharString('abc', '"')))).toBe(0);
            expect(Complex.realToNumber(CoreFunctions.ischar(new MultiArray([2, 1], [[new CharString('a', "'")], [new CharString('b', "'")]])))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isstring(new CharString('abc', '"')))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isstring(new CharString('abc', "'")))).toBe(0);
            expect(Complex.realToNumber(CoreFunctions.isstring(MultiArray.firstRow([new CharString('a', '"'), new CharString('b', '"')])))).toBe(1);
            expect(Complex.realToNumber(CoreFunctions.isstring(MultiArray.firstRow([new CharString('a', "'"), new CharString('b', "'")])))).toBe(0);
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
            expect((CoreFunctions.char(Complex.create(65)) as CharString).quote).toBe("'");
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
            expect(
                (CoreFunctions.char(MultiArray.firstRow([new CharString('ab', "'"), new CharString('cd', "'")], true)) as MultiArray).array.map((row) =>
                    row.map((value) => (value as CharString).str),
                ),
            ).toEqual([
                ['a', 'b'],
                ['c', 'd'],
            ]);
            expect(() => CoreFunctions.char(MultiArray.firstRow([new CharString('x')], true))).toThrow('char: invalid conversion input.');
        });

        it('Should convert and classify cell arrays of character vectors.', () => {
            const chars = MultiArray.firstRow([new CharString('alpha', "'"), new CharString('beta', "'")], true);
            const mixed = MultiArray.firstRow([new CharString('alpha', "'"), Complex.one()], true);
            const strings = MultiArray.firstRow([new CharString('alpha', '"'), new CharString('beta', '"')]);
            const convertedStrings = CoreFunctions.cellstr(strings);
            const convertedMatrix = CoreFunctions.cellstr(CoreFunctions.char(new CharString('ab', "'"), new CharString('cd', "'")) as MultiArray);

            expect(CoreFunctions.functions.iscellstr.func).toBe(CoreFunctions.iscellstr);
            expect(CoreFunctions.functions.cellstr.func).toBe(CoreFunctions.cellstr);
            expect(realNumber(CoreFunctions.iscellstr(chars))).toBe(1);
            expect(realNumber(CoreFunctions.iscellstr(mixed))).toBe(0);
            expect(realNumber(CoreFunctions.iscellstr(MultiArray.emptyArray(true)))).toBe(1);
            expect(realNumber(CoreFunctions.iscellstr(MultiArray.firstRow([new CharString('alpha', '"')], true)))).toBe(0);
            expect((CoreFunctions.cellstr(new CharString('alpha', "'")).array[0][0] as CharString).quote).toBe("'");
            expect(convertedStrings.isCell).toBe(true);
            expect(convertedStrings.array[0].map((value) => (value as CharString).quote)).toEqual(["'", "'"]);
            expect(convertedMatrix.dimension).toEqual([2, 1]);
            expect(convertedMatrix.array.map((row) => (row[0] as CharString).str)).toEqual(['ab', 'cd']);
            expect(() => CoreFunctions.cellstr(mixed)).toThrow('cellstr: C must be a cell array of character vectors.');
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

        it('Should expose sparse compatibility functions over dense storage.', () => {
            const matrix = new MultiArray([2, 3]);
            matrix.array[0][0] = Complex.create(1);
            matrix.array[0][1] = Complex.zero();
            matrix.array[0][2] = Complex.create(2);
            matrix.array[1][0] = Complex.zero();
            matrix.array[1][1] = Complex.create(3);
            matrix.array[1][2] = Complex.zero();
            const vector = CoreFunctions.nonzeros(matrix) as MultiArray;
            const sparseShape = CoreFunctions.sparse(Complex.create(2), Complex.create(3)) as MultiArray;
            const allocated = CoreFunctions.spalloc(Complex.create(2), Complex.create(3), Complex.create(5)) as MultiArray;
            const logicalAllocated = CoreFunctions.spalloc(Complex.create(1), Complex.create(2), Complex.zero(), CharString.create('logical')) as MultiArray;
            const triplet = CoreFunctions.sparse(
                MultiArray.firstRow([Complex.create(1), Complex.create(2), Complex.create(2)]),
                MultiArray.firstRow([Complex.create(1), Complex.create(2), Complex.create(2)]),
                MultiArray.firstRow([Complex.create(4), Complex.create(5), Complex.create(6)]),
                Complex.create(2),
                Complex.create(2),
            ) as MultiArray;
            const uniqueTriplet = CoreFunctions.sparse(
                MultiArray.firstRow([Complex.create(1), Complex.create(1)]),
                MultiArray.firstRow([Complex.create(2), Complex.create(2)]),
                MultiArray.firstRow([Complex.create(7), Complex.create(8)]),
                Complex.create(1),
                Complex.create(2),
                new CharString('unique'),
            ) as MultiArray;

            expect(CoreFunctions.functions.sparse.func).toBe(CoreFunctions.sparse);
            expect(CoreFunctions.functions.spalloc.func).toBe(CoreFunctions.spalloc);
            expect(CoreFunctions.functions.full.func).toBe(CoreFunctions.full);
            expect(CoreFunctions.functions.nnz.func).toBe(CoreFunctions.nnz);
            expect(realNumber(CoreFunctions.issparse(matrix))).toBe(0);
            expect(CoreFunctions.full(matrix)).not.toBe(matrix);
            expect(realNumber(CoreFunctions.nnz(matrix))).toBe(3);
            expect(realNumber(CoreFunctions.nzmax(matrix))).toBe(3);
            expect(vector.dimension).toEqual([3, 1]);
            expect(vector.array.map((row) => realNumber(row[0]))).toEqual([1, 3, 2]);
            expect(sparseShape.dimension).toEqual([2, 3]);
            expect(sparseShape.array.flat().map(realNumber)).toEqual([0, 0, 0, 0, 0, 0]);
            expect(allocated.dimension).toEqual([2, 3]);
            expect(allocated.array.flat().map(realNumber)).toEqual([0, 0, 0, 0, 0, 0]);
            expect(logicalAllocated.dimension).toEqual([1, 2]);
            expect(logicalAllocated.array[0].map((value) => (value as ComplexType).type)).toEqual([Complex.LOGICAL, Complex.LOGICAL]);
            expect(triplet.array.map((row) => row.map(realNumber))).toEqual([
                [4, 0],
                [0, 11],
            ]);
            expect(uniqueTriplet.array[0].map(realNumber)).toEqual([0, 8]);
            expect(() => CoreFunctions.sparse(Complex.create(0), Complex.one(), Complex.one())).toThrow('sparse: argument 1 must contain positive integer subscripts.');
            expect(() => CoreFunctions.sparse(Complex.create(1), Complex.create(1), Complex.one(), Complex.create(0), Complex.create(0))).toThrow('sparse: subscript indices out of range.');
            expect(() => CoreFunctions.spalloc(Complex.create(1), Complex.create(1), Complex.create(-1))).toThrow('spalloc: argument 3 must be a nonnegative integer scalar.');
            expect(() => CoreFunctions.spalloc(Complex.create(1), Complex.create(1), Complex.create(1), CharString.create('int32'))).toThrow(
                "spalloc: typename must be 'double', 'single', or 'logical'.",
            );
        });

        it('Should create cell arrays with MATLAB-compatible dimensions.', () => {
            const empty = CoreFunctions.cell();
            const square = CoreFunctions.cell(Complex.create(2));
            const row = CoreFunctions.cell(Complex.one(), Complex.create(3));
            const column = CoreFunctions.cell(MultiArray.firstRow([Complex.create(2), Complex.one()]));
            const scalar = CoreFunctions.cell(Complex.one(), Complex.one());

            expect(CoreFunctions.functions.cell.func).toBe(CoreFunctions.cell);
            expect(CoreFunctions.functions.cell.signature).toBe(CoreFunctions.cellSignature);
            expect(empty.isCell).toBe(true);
            expect(empty.dimension).toEqual([0, 0]);
            expect(square.isCell).toBe(true);
            expect(square.dimension).toEqual([2, 2]);
            expect(row.dimension).toEqual([1, 3]);
            expect(column.dimension).toEqual([2, 1]);
            expect(scalar.isCell).toBe(true);
            expect(scalar.dimension).toEqual([1, 1]);
            expect(scalar.array[0][0]).toEqual(MultiArray.emptyArray());
            expect(() => CoreFunctions.cell(new MultiArray([2, 2]))).toThrow('cell (A): use cell (size (A)) instead.');
            expect(() => CoreFunctions.cell(MultiArray.firstRow([Complex.one(), Complex.two()]), Complex.one())).toThrow('cell: dimensions must be scalars.');
        });

        it('Should convert arrays to cell arrays with optional grouped dimensions.', () => {
            const matrix = new MultiArray([2, 2]);
            matrix.array[0][0] = Complex.one();
            matrix.array[0][1] = Complex.create(3);
            matrix.array[1][0] = Complex.two();
            matrix.array[1][1] = Complex.create(4);
            const scalarCells = CoreFunctions.num2cell(matrix);
            const columnCells = CoreFunctions.num2cell(matrix, Complex.one());
            const rowCells = CoreFunctions.num2cell(matrix, Complex.create(2));
            const charCells = CoreFunctions.num2cell(new CharString('ab', "'"));
            const sourceCells = MultiArray.firstRow([Complex.one(), Complex.two()], true);
            const copiedCells = CoreFunctions.num2cell(sourceCells);

            expect(CoreFunctions.functions.num2cell.func).toBe(CoreFunctions.num2cell);
            expect(CoreFunctions.functions.num2cell.signature).toBe(CoreFunctions.num2cellSignature);
            expect(scalarCells.isCell).toBe(true);
            expect(scalarCells.dimension).toEqual([2, 2]);
            expect(scalarCells.array.map((row) => row.map(realNumber))).toEqual([
                [1, 3],
                [2, 4],
            ]);
            expect(columnCells.dimension).toEqual([1, 2]);
            expect((columnCells.array[0][0] as MultiArray).dimension).toEqual([2, 1]);
            expect((columnCells.array[0][0] as MultiArray).array.map((row) => realNumber(row[0]))).toEqual([1, 2]);
            expect(rowCells.dimension).toEqual([2, 1]);
            expect((rowCells.array[0][0] as MultiArray).dimension).toEqual([1, 2]);
            expect((rowCells.array[0][0] as MultiArray).array[0].map(realNumber)).toEqual([1, 3]);
            expect(charCells.array[0].map((value) => (value as CharString).str)).toEqual(['a', 'b']);
            expect(copiedCells.isCell).toBe(true);
            expect(copiedCells.dimension).toEqual([1, 2]);
            expect(copiedCells.array[0].map(realNumber)).toEqual([1, 2]);
            expect(() => CoreFunctions.num2cell(matrix, Complex.create(3))).toThrow('num2cell: DIM must be between 1 and ndims(A).');
        });

        it('Should concatenate ordinary cell contents with cell2mat.', () => {
            const row = MultiArray.firstRow([Complex.one(), Complex.two()], true);
            const blocks = new MultiArray(
                [2, 2],
                [
                    [MultiArray.firstRow([Complex.one(), Complex.two()]), MultiArray.firstRow([Complex.create(3), Complex.create(4)])],
                    [MultiArray.firstRow([Complex.create(5), Complex.create(6)]), MultiArray.firstRow([Complex.create(7), Complex.create(8)])],
                ],
                true,
            );
            const chars = MultiArray.toColumnVector([new CharString('ab', "'"), new CharString('cd', "'")]);
            chars.isCell = true;
            const nested = MultiArray.firstRow([row], true);
            const scalarPages = new MultiArray([1, 2, 2], undefined, true);
            const rowPages = new MultiArray([1, 2, 2], undefined, true);
            const mismatchedPages = new MultiArray([1, 2, 2], undefined, true);
            [Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)].forEach((value, index) => {
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(scalarPages.dimension[0], scalarPages.dimension[1], index);
                scalarPages.array[i][j] = value;
            });
            [
                MultiArray.firstRow([Complex.one(), Complex.two()]),
                MultiArray.firstRow([Complex.create(3), Complex.create(4)]),
                MultiArray.firstRow([Complex.create(5), Complex.create(6)]),
                MultiArray.firstRow([Complex.create(7), Complex.create(8)]),
            ].forEach((value, index) => {
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(rowPages.dimension[0], rowPages.dimension[1], index);
                rowPages.array[i][j] = value;
            });
            [
                MultiArray.firstRow([Complex.one(), Complex.two()]),
                MultiArray.firstRow([Complex.create(3), Complex.create(4)]),
                MultiArray.firstRow([Complex.create(5), Complex.create(6)]),
                MultiArray.toColumnVector([Complex.create(7), Complex.create(8)]),
            ].forEach((value, index) => {
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(mismatchedPages.dimension[0], mismatchedPages.dimension[1], index);
                mismatchedPages.array[i][j] = value;
            });

            expect(CoreFunctions.functions.cell2mat.func).toBe(CoreFunctions.cell2mat);
            expect(CoreFunctions.functions.cell2mat.signature).toBe(CoreFunctions.cell2matSignature);
            expect((CoreFunctions.cell2mat(row) as MultiArray).array[0].map(realNumber)).toEqual([1, 2]);
            expect((CoreFunctions.cell2mat(blocks) as MultiArray).array.map((line) => line.map(realNumber))).toEqual([
                [1, 2, 3, 4],
                [5, 6, 7, 8],
            ]);
            expect((CoreFunctions.cell2mat(chars) as MultiArray).array.map((line) => line.map((value) => (value as CharString).str))).toEqual([
                ['a', 'b'],
                ['c', 'd'],
            ]);
            expect((CoreFunctions.cell2mat(scalarPages) as MultiArray).dimension).toEqual([1, 2, 2]);
            expect(MultiArray.linearize(CoreFunctions.cell2mat(scalarPages) as MultiArray).map(realNumber)).toEqual([1, 2, 3, 4]);
            expect((CoreFunctions.cell2mat(rowPages) as MultiArray).dimension).toEqual([1, 4, 2]);
            expect(MultiArray.linearize(CoreFunctions.cell2mat(rowPages) as MultiArray).map(realNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
            expect(() => CoreFunctions.cell2mat(nested)).toThrow('cell2mat: nested cell contents are not supported.');
            expect(() => CoreFunctions.cell2mat(mismatchedPages)).toThrow('cell2mat: dimension mismatch');
            expect(() => CoreFunctions.cell2mat(Complex.one())).toThrow('Invalid call to cell2mat.');
        });

        it('Should partition ordinary arrays into cell blocks with mat2cell.', () => {
            const matrix = new MultiArray([2, 2]);
            matrix.array[0][0] = Complex.one();
            matrix.array[0][1] = Complex.create(3);
            matrix.array[1][0] = Complex.two();
            matrix.array[1][1] = Complex.create(4);
            const scalarBlocks = CoreFunctions.mat2cell(matrix, MultiArray.firstRow([Complex.one(), Complex.one()]), MultiArray.firstRow([Complex.one(), Complex.one()]));
            const columnBlocks = CoreFunctions.mat2cell(matrix, Complex.create(2), MultiArray.firstRow([Complex.one(), Complex.one()]));
            const rowBlocks = CoreFunctions.mat2cell(matrix, MultiArray.firstRow([Complex.one(), Complex.one()]), Complex.create(2));
            const charBlocks = CoreFunctions.mat2cell(new CharString('abcd', "'"), Complex.one(), MultiArray.firstRow([Complex.create(2), Complex.create(2)]));

            expect(CoreFunctions.functions.mat2cell.func).toBe(CoreFunctions.mat2cell);
            expect(CoreFunctions.functions.mat2cell.signature).toBe(CoreFunctions.mat2cellSignature);
            expect(scalarBlocks.isCell).toBe(true);
            expect(scalarBlocks.dimension).toEqual([2, 2]);
            expect(scalarBlocks.array.map((row) => row.map(realNumber))).toEqual([
                [1, 3],
                [2, 4],
            ]);
            expect(columnBlocks.dimension).toEqual([1, 2]);
            expect((columnBlocks.array[0][0] as MultiArray).dimension).toEqual([2, 1]);
            expect((columnBlocks.array[0][0] as MultiArray).array.map((row) => realNumber(row[0]))).toEqual([1, 2]);
            expect(rowBlocks.dimension).toEqual([2, 1]);
            expect((rowBlocks.array[0][0] as MultiArray).dimension).toEqual([1, 2]);
            expect((rowBlocks.array[0][0] as MultiArray).array[0].map(realNumber)).toEqual([1, 3]);
            expect((charBlocks.array[0][0] as MultiArray).array[0].map((value) => (value as CharString).str)).toEqual(['a', 'b']);
            expect(() => CoreFunctions.mat2cell(matrix, MultiArray.firstRow([Complex.one(), Complex.two()]), MultiArray.firstRow([Complex.one(), Complex.one()]))).toThrow(
                'mat2cell: argument 2 dimensions do not sum to input size.',
            );
            expect(() => CoreFunctions.mat2cell(matrix, MultiArray.firstRow([Complex.one(), Complex.one()]))).toThrow('mat2cell: number of dimension vectors must match ndims(A).');
            expect(() => CoreFunctions.mat2cell(matrix, MultiArray.firstRow([Complex.create(-1), Complex.create(3)]), MultiArray.firstRow([Complex.one(), Complex.one()]))).toThrow(
                'mat2cell: argument 2 must contain nonnegative integer sizes.',
            );
        });

        it('Should repeat cell arrays with repmat while preserving cell semantics.', () => {
            const row = MultiArray.firstRow([Complex.one(), Complex.two()], true);
            const matrix = new MultiArray(
                [2, 2],
                [
                    [Complex.one(), Complex.two()],
                    [Complex.create(3), Complex.create(4)],
                ],
            );
            matrix.isCell = true;
            const pages = MultiArray.reshape(MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)], true), [1, 2, 2]);

            const repeatedRow = CoreFunctions.repmat(row, Complex.create(2), Complex.one()) as MultiArray;
            const repeatedMatrix = CoreFunctions.repmat(matrix, Complex.one(), Complex.create(2)) as MultiArray;
            const repeatedPages = CoreFunctions.repmat(pages, Complex.one(), Complex.one(), Complex.create(2)) as MultiArray;

            expect(repeatedRow.isCell).toBe(true);
            expect(repeatedRow.dimension).toEqual([2, 2]);
            expect(repeatedRow.array.map((line) => line.map(realNumber))).toEqual([
                [1, 2],
                [1, 2],
            ]);
            expect(repeatedMatrix.isCell).toBe(true);
            expect(repeatedMatrix.dimension).toEqual([2, 4]);
            expect(repeatedMatrix.array.map((line) => line.map(realNumber))).toEqual([
                [1, 2, 1, 2],
                [3, 4, 3, 4],
            ]);
            expect(repeatedPages.isCell).toBe(true);
            expect(repeatedPages.dimension).toEqual([1, 2, 4]);
            expect(MultiArray.linearize(repeatedPages).map(realNumber)).toEqual([1, 2, 3, 4, 1, 2, 3, 4]);
        });

        it('Should squeeze cell arrays while preserving cell semantics.', () => {
            const vectorPages = MultiArray.reshape(MultiArray.firstRow([Complex.one(), Complex.two()], true), [1, 1, 2]);
            const matrixPages = MultiArray.reshape(MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)], true), [1, 2, 2]);
            const scalarPage = MultiArray.reshape(MultiArray.firstRow([Complex.one()], true), [1, 1, 1]);

            const squeezedVector = CoreFunctions.squeeze(vectorPages) as MultiArray;
            const squeezedMatrix = CoreFunctions.squeeze(matrixPages) as MultiArray;
            const squeezedScalar = CoreFunctions.squeeze(scalarPage) as MultiArray;

            expect(squeezedVector.isCell).toBe(true);
            expect(squeezedVector.dimension).toEqual([2, 1]);
            expect(squeezedVector.array.map((row) => realNumber(row[0]))).toEqual([1, 2]);
            expect(squeezedMatrix.isCell).toBe(true);
            expect(squeezedMatrix.dimension).toEqual([2, 2]);
            expect(squeezedMatrix.array.map((row) => row.map(realNumber))).toEqual([
                [1, 2],
                [3, 4],
            ]);
            expect(squeezedScalar.isCell).toBe(true);
            expect(squeezedScalar.dimension).toEqual([1, 1]);
            expect(realNumber(squeezedScalar.array[0][0])).toBe(1);
        });

        it('Should flip ordinary and cell arrays along MATLAB-compatible dimensions.', () => {
            const row = MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3)]);
            const matrix = new MultiArray(
                [2, 2],
                [
                    [Complex.one(), Complex.two()],
                    [Complex.create(3), Complex.create(4)],
                ],
            );
            const pages = MultiArray.reshape(MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)], true), [1, 2, 2]);

            const flippedRow = CoreFunctions.flip(row) as MultiArray;
            const flippedRows = CoreFunctions.flipud(matrix) as MultiArray;
            const flippedColumns = CoreFunctions.fliplr(matrix) as MultiArray;
            const flippedPages = CoreFunctions.flip(pages, Complex.create(3)) as MultiArray;

            expect(CoreFunctions.functions.flip.func).toBe(CoreFunctions.flip);
            expect(CoreFunctions.functions.flip.signature).toBe(CoreFunctions.flipSignature);
            expect(CoreFunctions.functions.fliplr.func).toBe(CoreFunctions.fliplr);
            expect(CoreFunctions.functions.flipud.func).toBe(CoreFunctions.flipud);
            expect(flippedRow.array[0].map(realNumber)).toEqual([3, 2, 1]);
            expect(flippedRows.array.map((line) => line.map(realNumber))).toEqual([
                [3, 4],
                [1, 2],
            ]);
            expect(flippedColumns.array.map((line) => line.map(realNumber))).toEqual([
                [2, 1],
                [4, 3],
            ]);
            expect(flippedPages.isCell).toBe(true);
            expect(flippedPages.dimension).toEqual([1, 2, 2]);
            expect(MultiArray.linearize(flippedPages).map(realNumber)).toEqual([3, 4, 1, 2]);
            expect(() => CoreFunctions.flip(row, Complex.create(1.5))).toThrow('flip: DIM must be an integer scalar.');
        });

        it('Should rotate ordinary and cell arrays in the first two dimensions.', () => {
            const matrix = new MultiArray(
                [2, 2],
                [
                    [Complex.one(), Complex.two()],
                    [Complex.create(3), Complex.create(4)],
                ],
            );
            const cellPages = MultiArray.reshape(MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)], true), [1, 2, 2]);

            const counterClockwise = CoreFunctions.rot90(matrix) as MultiArray;
            const clockwise = CoreFunctions.rot90(matrix, Complex.create(-1)) as MultiArray;
            const halfTurn = CoreFunctions.rot90(matrix, Complex.two()) as MultiArray;
            const cellRotated = CoreFunctions.rot90(cellPages) as MultiArray;

            expect(CoreFunctions.functions.rot90.func).toBe(CoreFunctions.rot90);
            expect(CoreFunctions.functions.rot90.signature).toBe(CoreFunctions.rot90Signature);
            expect(counterClockwise.array.map((line) => line.map(realNumber))).toEqual([
                [2, 4],
                [1, 3],
            ]);
            expect(clockwise.array.map((line) => line.map(realNumber))).toEqual([
                [3, 1],
                [4, 2],
            ]);
            expect(halfTurn.array.map((line) => line.map(realNumber))).toEqual([
                [4, 3],
                [2, 1],
            ]);
            expect(cellRotated.isCell).toBe(true);
            expect(cellRotated.dimension).toEqual([2, 1, 2]);
            expect(MultiArray.linearize(cellRotated).map(realNumber)).toEqual([2, 1, 4, 3]);
            expect(() => CoreFunctions.rot90(matrix, Complex.create(1.5))).toThrow('rot90: K must be an integer scalar.');
        });

        it('Should permute and inverse-permute ordinary and cell arrays.', () => {
            const numericPages = MultiArray.reshape(
                MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4), Complex.create(5), Complex.create(6)]),
                [1, 2, 3],
            );
            const cellPages = MultiArray.reshape(MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)], true), [1, 2, 2]);
            const order = MultiArray.firstRow([Complex.two(), Complex.one(), Complex.create(3)]);

            const numericPermuted = CoreFunctions.permute(numericPages, order) as MultiArray;
            const numericRestored = CoreFunctions.ipermute(numericPermuted, order) as MultiArray;
            const cellPermuted = CoreFunctions.permute(cellPages, order) as MultiArray;
            const cellRestored = CoreFunctions.ipermute(cellPermuted, order) as MultiArray;

            expect(CoreFunctions.functions.permute.func).toBe(CoreFunctions.permute);
            expect(CoreFunctions.functions.permute.signature).toBe(CoreFunctions.permuteSignature);
            expect(CoreFunctions.functions.ipermute.func).toBe(CoreFunctions.ipermute);
            expect(CoreFunctions.functions.ipermute.signature).toBe(CoreFunctions.ipermuteSignature);
            expect(numericPermuted.dimension).toEqual([2, 1, 3]);
            expect(MultiArray.linearize(numericPermuted).map(realNumber)).toEqual([1, 2, 3, 4, 5, 6]);
            expect(numericRestored.dimension).toEqual([1, 2, 3]);
            expect(MultiArray.linearize(numericRestored).map(realNumber)).toEqual([1, 2, 3, 4, 5, 6]);
            expect(cellPermuted.isCell).toBe(true);
            expect(cellPermuted.dimension).toEqual([2, 1, 2]);
            expect(MultiArray.linearize(cellPermuted).map(realNumber)).toEqual([1, 2, 3, 4]);
            expect(cellRestored.isCell).toBe(true);
            expect(cellRestored.dimension).toEqual([1, 2, 2]);
            expect(MultiArray.linearize(cellRestored).map(realNumber)).toEqual([1, 2, 3, 4]);
            expect(() => CoreFunctions.permute(numericPages, MultiArray.firstRow([Complex.one(), Complex.one(), Complex.create(3)]))).toThrow('permute: ORDER must be a permutation vector.');
            expect(() => CoreFunctions.ipermute(numericPages, MultiArray.firstRow([Complex.two(), Complex.one()]))).toThrow('ipermute: ORDER must be a permutation vector.');
        });

        it('Should circularly shift ordinary and cell arrays.', () => {
            const row = MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)]);
            const matrix = new MultiArray(
                [2, 2],
                [
                    [Complex.one(), Complex.two()],
                    [Complex.create(3), Complex.create(4)],
                ],
            );
            const cells = new MultiArray(
                [2, 2],
                [
                    [Complex.one(), Complex.two()],
                    [Complex.create(3), Complex.create(4)],
                ],
            );
            cells.isCell = true;

            const shiftedRow = CoreFunctions.circshift(row, Complex.one()) as MultiArray;
            const shiftedMatrix = CoreFunctions.circshift(matrix, MultiArray.firstRow([Complex.one(), Complex.create(-1)])) as MultiArray;
            const shiftedColumns = CoreFunctions.circshift(matrix, Complex.one(), Complex.create(2)) as MultiArray;
            const shiftedCells = CoreFunctions.circshift(cells, MultiArray.firstRow([Complex.one(), Complex.one()])) as MultiArray;

            expect(CoreFunctions.functions.circshift.func).toBe(CoreFunctions.circshift);
            expect(CoreFunctions.functions.circshift.signature).toBe(CoreFunctions.circshiftSignature);
            expect(shiftedRow.array[0].map(realNumber)).toEqual([4, 1, 2, 3]);
            expect(shiftedMatrix.array.map((line) => line.map(realNumber))).toEqual([
                [4, 3],
                [2, 1],
            ]);
            expect(shiftedColumns.array.map((line) => line.map(realNumber))).toEqual([
                [2, 1],
                [4, 3],
            ]);
            expect(shiftedCells.isCell).toBe(true);
            expect(shiftedCells.array.map((line) => line.map(realNumber))).toEqual([
                [4, 3],
                [2, 1],
            ]);
            expect(() => CoreFunctions.circshift(row, MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3)]))).toThrow(
                'circshift: SHIFTS vector must not be longer than ndims(A).',
            );
            expect(() => CoreFunctions.circshift(row, MultiArray.firstRow([Complex.one(), Complex.two()]), Complex.one())).toThrow(
                'circshift: SHIFT must be a scalar when DIM is specified.',
            );
        });

        it('Should shift dimensions of ordinary and cell arrays.', () => {
            const numericPages = MultiArray.reshape(MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)]), [1, 2, 2]);
            const cellPages = MultiArray.reshape(MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)], true), [1, 2, 2]);

            const numericLeft = CoreFunctions.shiftdim(numericPages, Complex.one()) as MultiArray;
            const numericRight = CoreFunctions.shiftdim(MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)]), Complex.create(-1)) as MultiArray;
            const cellLeft = CoreFunctions.shiftdim(cellPages, Complex.one()) as MultiArray;

            expect(CoreFunctions.functions.shiftdim.func).toBe(CoreFunctions.shiftdim);
            expect(CoreFunctions.functions.shiftdim.signature).toBe(CoreFunctions.shiftdimSignature);
            expect(numericLeft.dimension).toEqual([2, 2]);
            expect(numericLeft.array.map((line) => line.map(realNumber))).toEqual([
                [1, 2],
                [3, 4],
            ]);
            expect(numericRight.dimension).toEqual([1, 1, 4]);
            expect(MultiArray.linearize(numericRight).map(realNumber)).toEqual([1, 2, 3, 4]);
            expect(cellLeft.isCell).toBe(true);
            expect(cellLeft.dimension).toEqual([2, 2]);
            expect(cellLeft.array.map((line) => line.map(realNumber))).toEqual([
                [1, 2],
                [3, 4],
            ]);
            expect(() => CoreFunctions.shiftdim(numericPages, Complex.create(1.5))).toThrow('shiftdim: N must be an integer scalar.');
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
            const built = CoreFunctions.struct(new CharString('alpha'), Complex.one(), new CharString('beta'), MultiArray.emptyArray()) as Structure;

            expect(CoreFunctions.functions.isfield.func).toBe(CoreFunctions.isfield);
            expect(CoreFunctions.functions.isfield.signature).toBe(CoreFunctions.isfieldSignature);
            expect(realNumber(CoreFunctions.isfield(structure, new CharString('alpha')))).toBe(1);
            expect(realNumber(CoreFunctions.isfield(structure, new CharString('missing')))).toBe(0);
            expect(realNumber(built.field.alpha)).toBe(1);
            expect(built.field.beta).toEqual(MultiArray.emptyArray());
            expect(result).toBeInstanceOf(MultiArray);
            expect(result.dimension).toEqual([1, 2]);
            expect(result.array[0].map(realNumber)).toEqual([1, 0]);
        });

        it('Should manipulate structure fields through structural helpers.', () => {
            const structure = new Structure({ beta: Complex.two(), alpha: Complex.one() });
            const nested = CoreFunctions.setfield(new Structure({}), new CharString('outer'), new CharString('inner'), Complex.create(5)) as Structure;
            const removed = CoreFunctions.rmfield(structure, MultiArray.firstRow([new CharString('alpha')], true)) as Structure;
            const ordered = CoreFunctions.orderfields(structure) as Structure;

            expect(CoreFunctions.functions.getfield.func).toBe(CoreFunctions.getfield);
            expect(CoreFunctions.functions.setfield.func).toBe(CoreFunctions.setfield);
            expect(CoreFunctions.functions.rmfield.func).toBe(CoreFunctions.rmfield);
            expect(CoreFunctions.functions.orderfields.func).toBe(CoreFunctions.orderfields);
            expect(CoreFunctions.functions.numfields.func).toBe(CoreFunctions.numfields);
            expect(realNumber(CoreFunctions.getfield(structure, new CharString('alpha')))).toBe(1);
            expect(realNumber(CoreFunctions.getfield(nested, new CharString('outer'), new CharString('inner')))).toBe(5);
            expect(realNumber(nested.field.outer instanceof Structure ? nested.field.outer.field.inner : Complex.zero())).toBe(5);
            expect(Object.keys(removed.field)).toEqual(['beta']);
            expect(Object.keys(ordered.field)).toEqual(['alpha', 'beta']);
            expect(realNumber(CoreFunctions.numfields(structure))).toBe(2);
            expect(() => CoreFunctions.getfield(structure, Complex.one())).toThrow('getfield: argument 2 must be a string.');
            expect(() => CoreFunctions.rmfield(structure, Complex.one())).toThrow('rmfield: argument 2 must be a string or cell array of strings.');
        });

        it('Should convert between structures and cell arrays.', () => {
            const structure = new Structure({ alpha: Complex.one(), beta: Complex.two() });
            const values = CoreFunctions.struct2cell(structure);
            const columnValues = MultiArray.toColumnVector([Complex.one(), Complex.two()]);
            columnValues.isCell = true;
            const columnNames = MultiArray.toColumnVector([new CharString('alpha', "'"), new CharString('beta', "'")]);
            columnNames.isCell = true;
            const rebuiltFromRow = CoreFunctions.cell2struct(
                MultiArray.firstRow([Complex.one(), Complex.two()], true),
                MultiArray.firstRow([new CharString('alpha', "'"), new CharString('beta', "'")], true),
                Complex.create(2),
            ) as Structure;
            const rebuiltFromColumn = CoreFunctions.cell2struct(columnValues, columnNames, Complex.one()) as Structure;

            expect(CoreFunctions.functions.struct2cell.func).toBe(CoreFunctions.struct2cell);
            expect(CoreFunctions.functions.cell2struct.func).toBe(CoreFunctions.cell2struct);
            expect(values.isCell).toBe(true);
            expect(values.dimension).toEqual([2, 1]);
            expect(values.array.map((row) => realNumber(row[0]))).toEqual([1, 2]);
            expect(realNumber(rebuiltFromRow.field.alpha)).toBe(1);
            expect(realNumber(rebuiltFromRow.field.beta)).toBe(2);
            expect(realNumber(rebuiltFromColumn.field.alpha)).toBe(1);
            expect(realNumber(rebuiltFromColumn.field.beta)).toBe(2);
            expect(() => CoreFunctions.struct2cell(Complex.one())).toThrow('Invalid call to struct2cell.');
            expect(() =>
                CoreFunctions.cell2struct(
                    MultiArray.firstRow([Complex.one()], true),
                    MultiArray.firstRow([new CharString('alpha', "'"), new CharString('beta', "'")], true),
                    Complex.create(2),
                ),
            ).toThrow('cell2struct: number of fields does not match dimension.');
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
