/// <reference types="jest" />
import path from 'node:path';
import { ComplexDecimal } from './ComplexDecimal';
import { Interpreter } from './Interpreter';
import { MultiArray } from './MultiArray';
import { Complex, type ComplexType } from './Complex';
import { CharString } from './CharString';
import { executeList } from './ParserTestUtils';

let interpreter: Interpreter;

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const realLine = (line: unknown): number[] => {
    expect(Array.isArray(line)).toBe(true);
    return (line as unknown[]).map((value) => {
        if (!Complex.isInstanceOf(value)) {
            throw new TypeError('Expected reduced line element to be a complex scalar.');
        }
        return Complex.realToNumber(value);
    });
};

const realScalar = (value: unknown): number => {
    if (!Complex.isInstanceOf(value)) {
        throw new TypeError('Expected complex scalar.');
    }
    return Complex.realToNumber(value);
};

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeEach(async () => {
        interpreter = Interpreter.Create();
    });

    describe('Behavior', () => {
        it('ComplexDecimal should be defined', () => {
            expect(ComplexDecimal).toBeDefined();
        });

        it('MultiArray should be defined', () => {
            expect(MultiArray).toBeDefined();
        }, 100);

        it('Empty arrays should be false in logical conditions.', () => {
            expect(Complex.realEquals(MultiArray.toLogical(MultiArray.emptyArray()), 0)).toBe(true);
            expect(Complex.realEquals(MultiArray.emptyArray().toLogical(), 0)).toBe(true);
        });

        it('Numeric array operations should reject malformed nonnumeric elements.', () => {
            const malformed = new MultiArray([1, 1], CharString.create('x'));

            expect(() => MultiArray.toLogical(malformed)).toThrow('toLogical: expected numeric array element.');
            expect(() => malformed.toLogical()).toThrow('toLogical: expected numeric array element.');
            expect(() => MultiArray.isComplexMultiArray(malformed)).toThrow('isComplexMultiArray: expected numeric array element.');
            expect(() => MultiArray.haveAnyComplex(malformed)).toThrow('haveAnyComplex: expected numeric array element.');
            expect(() => MultiArray.pageSlice(malformed, 0)).toThrow('pageSlice: expected numeric array element.');
            expect(() => MultiArray.toFlatArray(malformed)).toThrow('toFlatArray: expected numeric array element.');
        });

        it('Array-local shape predicates should remain limited to MultiArray values.', () => {
            expect(MultiArray.isScalar(Complex.one())).toBe(true);
            expect(MultiArray.isVector(Complex.one())).toBe(false);
            expect(MultiArray.isMatrix(Complex.one())).toBe(true);
            expect(MultiArray.isRowVector(MultiArray.firstRow([Complex.one(), Complex.two()]))).toBe(true);
            expect(MultiArray.isVector(MultiArray.firstRow([Complex.one(), Complex.two()]))).toBe(true);
            expect(MultiArray.isColumnVector(MultiArray.toColumnVector([Complex.one(), Complex.two()]))).toBe(true);
            expect(MultiArray.isEmpty(MultiArray.emptyArray())).toBe(true);
        });

        it('Copy should preserve empty structure-array field schemas.', () => {
            const emptyStruct = MultiArray.emptyArray();
            emptyStruct.type = MultiArray.STRUCTURE;
            emptyStruct.emptyStructureFields = ['a', 'b'];

            const staticCopy = MultiArray.copy(emptyStruct);
            const instanceCopy = emptyStruct.copy();
            emptyStruct.emptyStructureFields.push('c');

            expect(staticCopy.emptyStructureFields).toEqual(['a', 'b']);
            expect(instanceCopy.emptyStructureFields).toEqual(['a', 'b']);
        });

        it('Indexing should preserve empty structure-array field schemas.', () => {
            const emptyStruct = MultiArray.emptyArray();
            emptyStruct.type = MultiArray.STRUCTURE;
            emptyStruct.emptyStructureFields = ['a', 'b'];

            const colonSelected = MultiArray.getElements(emptyStruct, 'emptyStruct', [], [MultiArray.toColumnVector([])]) as MultiArray;
            const logicalSelected = MultiArray.getElements(emptyStruct, 'emptyStruct', [], [MultiArray.emptyArray()]) as MultiArray;

            expect(colonSelected.dimension).toEqual([0, 1]);
            expect(colonSelected.emptyStructureFields).toEqual(['a', 'b']);
            expect(logicalSelected.emptyStructureFields).toEqual(['a', 'b']);
        });

        it('Interpreter should be defined', () => {
            expect(Interpreter).toBeDefined();
        }, 100);

        it('MultiArray.haveAnyComplex — complex matrix detection', () => {
            const A = interpreter.Execute('[1,2,3;4,5,6;7,8,9]').list[0] as MultiArray;
            expect(MultiArray.haveAnyComplex(A)).toBe(false);
            const B = interpreter.Execute(`[ 1+2i,   2,        3;
                                              4,   5- i,     6;
                                              7,   8,    10+3i ]`).list[0] as MultiArray;
            expect(MultiArray.haveAnyComplex(B)).toBe(true);
        });

        it('reduceToArray should collect reduced dimension values without changing source elements.', () => {
            const A = interpreter.Execute('[1, 2; 3, 4]').list[0] as MultiArray;
            const byColumn = MultiArray.reduceToArray(0, A);
            const byRow = MultiArray.reduceToArray(1, A);
            const unchangedRank = MultiArray.reduceToArray(2, A);

            expect(byColumn.dimension).toEqual([1, 2]);
            expect(byColumn.array[0].map(realLine)).toEqual([
                [1, 3],
                [2, 4],
            ]);
            expect(byRow.dimension).toEqual([2, 1]);
            expect(byRow.array.map((row) => realLine(row[0]))).toEqual([
                [1, 2],
                [3, 4],
            ]);
            expect(unchangedRank.dimension).toEqual([2, 2]);
            expect(unchangedRank.array.map((row) => row.map(realLine))).toEqual([
                [[1], [2]],
                [[3], [4]],
            ]);
        });

        it('logical indexing should reject malformed logical masks before selection.', () => {
            const A = interpreter.Execute('[1, 2; 3, 4]').list[0] as MultiArray;
            const mask = new MultiArray([1, 1]);
            mask.type = Complex.LOGICAL;
            mask.array[0][0] = undefined;

            expect(() => MultiArray.getElements(A, 'A', [], [mask])).toThrow('A: invalid logical index.');
        });

        it('linearize should preserve column-major order across pages.', () => {
            const array = new MultiArray([2, 2, 2], (row, column, page) => Complex.create(row * 100 + column * 10 + page));

            expect(MultiArray.linearize(array).map(realScalar)).toEqual([111, 211, 121, 221, 112, 212, 122, 222]);
        });

        it('linearize should match the canonical physical row/column translator.', () => {
            for (const dimension of [
                [2, 3],
                [2, 2, 2],
                [2, 3, 2, 2],
            ]) {
                const array = new MultiArray(dimension, (...subscript) => Complex.create(MultiArray.subscriptToLinearIndex(dimension, subscript) + 1));

                const expected = Array.from({ length: MultiArray.linearLength(array) }, (_, index) => {
                    const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(dimension[0], dimension[1], index);
                    return realScalar(array.array[row][column]);
                });

                expect(MultiArray.linearize(array).map(realScalar)).toEqual(expected);
            }
        });

        it('mapBroadcasted should preserve N-D singleton expansion in logical linear order.', () => {
            const left = new MultiArray([2, 1, 2], (...subscript) => Complex.create(100 * subscript[0] + 10 * subscript[1] + subscript[2]));
            const right = new MultiArray([1, 3, 1], (...subscript) => Complex.create(subscript[0] + 10 * subscript[1] + 100 * subscript[2]));
            const result = MultiArray.mapBroadcasted(left, right, 'test', (leftValue, rightValue) => Complex.add(leftValue as ComplexType, rightValue as ComplexType));

            expect(result.dimension).toEqual([2, 3, 2]);
            expect(MultiArray.linearize(result).map(realScalar)).toEqual([222, 322, 232, 332, 242, 342, 223, 323, 233, 333, 243, 343]);
            expect(() => MultiArray.mapBroadcasted(new MultiArray([2, 2]), new MultiArray([3, 2]), 'test', () => Complex.zero())).toThrow(
                'test: nonconformant arguments (op1 is 2x2, op2 is 3x2).',
            );
        });

        it('subscript indexing should preserve selected N-D slices in page storage.', () => {
            const array = new MultiArray([2, 2, 2], (...subscript) => Complex.create(MultiArray.subscriptToLinearIndex([2, 2, 2], subscript) + 1));
            const colon = MultiArray.toColumnVector([Complex.one(), Complex.two()]);
            const firstPage = MultiArray.getElements(array, 'array', [], [colon, colon, Complex.one()]);
            const secondPage = MultiArray.getElements(array, 'array', [], [colon, colon, Complex.create(2)]);

            expect(firstPage).toBeInstanceOf(MultiArray);
            expect(secondPage).toBeInstanceOf(MultiArray);
            expect((firstPage as MultiArray).dimension).toEqual([2, 2]);
            expect((secondPage as MultiArray).dimension).toEqual([2, 2]);
            expect(MultiArray.linearize(firstPage as MultiArray).map(realScalar)).toEqual([1, 2, 3, 4]);
            expect(MultiArray.linearize(secondPage as MultiArray).map(realScalar)).toEqual([5, 6, 7, 8]);
        });

        it('subscript deletion should preserve N-D storage after removing one dimension slice.', () => {
            const array = new MultiArray([2, 2, 3], (...subscript) => Complex.create(MultiArray.subscriptToLinearIndex([2, 2, 3], subscript) + 1));
            const colon = MultiArray.toColumnVector([Complex.one(), Complex.two()]);

            MultiArray.deleteElements(array, [colon, colon, Complex.create(2)]);

            expect(array.dimension).toEqual([2, 2, 2]);
            expect(MultiArray.linearize(array).map(realScalar)).toEqual([1, 2, 3, 4, 9, 10, 11, 12]);
        });

        it('N-D expansion should preserve existing elements in logical column-major order.', () => {
            const array = new MultiArray([2, 2, 2], (...subscript) => Complex.create(MultiArray.subscriptToLinearIndex([2, 2, 2], subscript) + 1));

            MultiArray.expand(array, [2, 2, 3]);

            expect(array.dimension).toEqual([2, 2, 3]);
            expect(MultiArray.linearize(array).map(realScalar)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0, 0]);
        });

        it('reshape should preserve cell-array semantics when rebuilding storage.', () => {
            const cells = MultiArray.firstRow([Complex.one(), Complex.two(), Complex.create(3), Complex.create(4)], true);
            const reshaped = MultiArray.reshape(cells, [1, 2, 2]);

            expect(reshaped.isCell).toBe(true);
            expect(reshaped.dimension).toEqual([1, 2, 2]);
            expect(MultiArray.linearize(reshaped).map(realScalar)).toEqual([1, 2, 3, 4]);
        });

        it('The determinant must be correctly calculated', () => {
            expect(executeList(interpreter, 'det([1:3;4:6;7:9])').list[0].re.toNumber()).toBe(-0);
            expect(executeList(interpreter, 'det([2,1,-3; 3,2,4; 2,5,-2])').list[0].re.toNumber()).toBe(-67);
            expect(executeList(interpreter, 'det([-7,6,3,1; -9,1,6,4; -8,-4,3,6; -5,5,9,2])').list[0].re.toNumber()).toBe(-444);
        }, 1000);
    });
});
