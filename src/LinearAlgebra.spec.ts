/// <reference types="jest" />
import path from 'node:path';
import { Complex, ComplexType } from './Complex';
import { CharString } from './CharString';
import { MultiArray } from './MultiArray';
import { LinearAlgebra } from './LinearAlgebra';
import { MathOperation } from './MathOperation';
import { BLAS } from './BLAS';
import { Interpreter } from './Interpreter';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

let interpreter: Interpreter;

const createRealMatrix = (values: number[][]): MultiArray => {
    const result = new MultiArray([values.length, values[0].length]);
    for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
            result.array[i][j] = Complex.create(values[i][j]);
        }
    }
    return result;
};

const createComplexMatrix = (values: [number, number][][]): MultiArray => {
    const result = new MultiArray([values.length, values[0].length]);
    for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
            result.array[i][j] = Complex.create(values[i][j][0], values[i][j][1]);
        }
    }
    return result;
};

const expectRealMatrix = (actual: MultiArray, expected: number[][]): void => {
    expect(actual.dimension).toEqual([expected.length, expected[0].length]);
    for (let i = 0; i < expected.length; i++) {
        for (let j = 0; j < expected[i].length; j++) {
            expect(Complex.realToNumber(actual.array[i][j] as ComplexType)).toBeCloseTo(expected[i][j], 10);
            expect(Complex.imagToNumber(actual.array[i][j] as ComplexType)).toBeCloseTo(0, 10);
        }
    }
};

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        interpreter = Interpreter.Create();
    });

    describe('Behavior', () => {
        it("LinearAlgebra and it's functions should be defined", () => {
            expect(LinearAlgebra).toBeDefined();
            expect(LinearAlgebra.functions).toBeDefined();
            expect(LinearAlgebra.trace).toBeDefined();
            expect(LinearAlgebra.transpose).toBeDefined();
            expect(LinearAlgebra.ctranspose).toBeDefined();
            expect(LinearAlgebra.functions.transpose.func).toBe(LinearAlgebra.transpose);
            expect(LinearAlgebra.functions.ctranspose.func).toBe(LinearAlgebra.ctranspose);
            expect(BLAS.gemm).toBeDefined();
            expect(LinearAlgebra.det).toBeDefined();
            expect(LinearAlgebra.inv).toBeDefined();
            expect(LinearAlgebra.gauss).toBeDefined();
            expect(LinearAlgebra.lu).toBeDefined();
            expect(LinearAlgebra.dot).toBeDefined();
        });

        it('LinearAlgebra.transpose and ctranspose should accept scalars, matrices, and character vectors.', () => {
            const matrix = createRealMatrix([
                [1, 2],
                [3, 4],
            ]);
            const complex = Complex.create(1, 2);
            const charVector = new CharString('ab', "'");

            expectRealMatrix(LinearAlgebra.transpose(matrix), [
                [1, 3],
                [2, 4],
            ]);
            expect(Complex.realToNumber(LinearAlgebra.transpose(complex) as ComplexType)).toBe(1);
            expect(Complex.imagToNumber(LinearAlgebra.transpose(complex) as ComplexType)).toBe(2);
            expect(Complex.realToNumber(LinearAlgebra.ctranspose(complex) as ComplexType)).toBe(1);
            expect(Complex.imagToNumber(LinearAlgebra.ctranspose(complex) as ComplexType)).toBe(-2);
            expect((LinearAlgebra.transpose(charVector) as MultiArray).array.map((row) => (row[0] as CharString).str)).toEqual(['a', 'b']);
            expect((LinearAlgebra.ctranspose(charVector) as MultiArray).array.map((row) => (row[0] as CharString).str)).toEqual(['a', 'b']);
        });

        it('LinearAlgebra.transpose and ctranspose should preserve cell arrays without conjugating cell contents.', () => {
            const cells = new MultiArray(
                [2, 2],
                [
                    [Complex.create(1, 2), Complex.create(2)],
                    [Complex.create(3), Complex.create(4, -5)],
                ],
                true,
            );

            const transposed = LinearAlgebra.transpose(cells) as MultiArray;
            const conjugateTransposed = LinearAlgebra.ctranspose(cells) as MultiArray;

            expect(transposed.isCell).toBe(true);
            expect(conjugateTransposed.isCell).toBe(true);
            expect(transposed.dimension).toEqual([2, 2]);
            expect(conjugateTransposed.dimension).toEqual([2, 2]);
            expect(Complex.imagToNumber(transposed.array[0][0] as ComplexType)).toBe(2);
            expect(Complex.imagToNumber(conjugateTransposed.array[0][0] as ComplexType)).toBe(2);
            expect(Complex.realToNumber(conjugateTransposed.array[0][1] as ComplexType)).toBe(3);
        });

        it('Interpreter should be instatiated and should parse, evaluate and unparse a simple real expression (interpreter test).', () => {
            expect(interpreter).toBeInstanceOf(Interpreter);
            const tree = interpreter.Parse('1+2*3');
            const value = interpreter.Evaluate(tree);
            const unparsed = interpreter.Unparse(tree);
            expect(Complex.realToNumber(value.list[0])).toBe(7);
            expect(unparsed === '1+2*3\n').toBe(true);
        }, 1000);

        it('LinearAlgebra.power should compute positive, zero, and negative integer matrix powers', () => {
            const matrix = createRealMatrix([
                [1, 1],
                [0, 1],
            ]);

            expectRealMatrix(LinearAlgebra.power(matrix, Complex.create(3)), [
                [1, 3],
                [0, 1],
            ]);
            expectRealMatrix(LinearAlgebra.power(matrix, Complex.create(0)), [
                [1, 0],
                [0, 1],
            ]);
            expectRealMatrix(LinearAlgebra.power(matrix, Complex.create(-2)), [
                [1, -2],
                [0, 1],
            ]);
        });

        it('LinearAlgebra.power should reject nonsquare matrix bases', () => {
            const matrix = createRealMatrix([
                [1, 2, 3],
                [4, 5, 6],
            ]);

            expect(() => LinearAlgebra.power(matrix, Complex.create(2))).toThrow('operator ^: only square matrices can be raised to scalar powers.');
        });

        it('LinearAlgebra.power should compute Hermitian matrix noninteger scalar powers', () => {
            const matrix = createRealMatrix([
                [2, 1],
                [1, 2],
            ]);
            const sqrt3 = Math.sqrt(3);

            expectRealMatrix(LinearAlgebra.power(matrix, Complex.create(0.5)), [
                [(1 + sqrt3) / 2, (sqrt3 - 1) / 2],
                [(sqrt3 - 1) / 2, (1 + sqrt3) / 2],
            ]);
        });

        it('LinearAlgebra.power should reject non-Hermitian noninteger scalar powers until general matrix powers are supported', () => {
            const matrix = createRealMatrix([
                [1, 2],
                [3, 4],
            ]);

            expect(() => LinearAlgebra.power(matrix, Complex.create(0.5))).toThrow("invalid exponent in '^'.");
        });

        it('LinearAlgebra.cond should compute supported matrix condition numbers', () => {
            const matrix = createRealMatrix([
                [1, 2],
                [3, 4],
            ]);
            const singular = createRealMatrix([
                [1, 2],
                [2, 4],
            ]);
            const rowVector = createRealMatrix([[1, 0]]);

            expect(Complex.realToNumber(LinearAlgebra.cond(matrix))).toBeCloseTo(14.933034373659265, 10);
            expect(Complex.realToNumber(LinearAlgebra.cond(matrix, Complex.create(2)))).toBeCloseTo(14.933034373659265, 10);
            expect(Complex.realToNumber(LinearAlgebra.cond(matrix, Complex.create(1)))).toBeCloseTo(21, 10);
            expect(Complex.realToNumber(LinearAlgebra.cond(matrix, Complex.inf_0()))).toBeCloseTo(21, 10);
            expect(Complex.realToNumber(LinearAlgebra.cond(matrix, new CharString('fro')))).toBeCloseTo(15, 10);
            expect(Complex.realToNumber(LinearAlgebra.cond(singular))).toBe(Infinity);
            expect(Complex.realToNumber(LinearAlgebra.cond(rowVector))).toBeCloseTo(1, 10);
            expect(() => LinearAlgebra.cond(rowVector, Complex.create(1))).toThrow('Invalid call to cond.');
            expect(() => LinearAlgebra.cond(matrix, Complex.create(-Infinity))).toThrow('Invalid call to cond.');
        });

        it('LinearAlgebra.rcond should compute reciprocal 1-norm condition estimates for square matrices', () => {
            const matrix = createRealMatrix([
                [1, 2],
                [3, 4],
            ]);
            const diagonal = createRealMatrix([
                [2, 0],
                [0, 4],
            ]);
            const singular = createRealMatrix([
                [1, 2],
                [2, 4],
            ]);
            const rowVector = createRealMatrix([[1, 0]]);

            expect(Complex.realToNumber(LinearAlgebra.rcond(matrix))).toBeCloseTo(1 / 21, 12);
            expect(Complex.realToNumber(LinearAlgebra.rcond(diagonal))).toBeCloseTo(0.5, 12);
            expect(Complex.realToNumber(LinearAlgebra.rcond(singular))).toBe(0);
            expect(() => LinearAlgebra.rcond(rowVector)).toThrow('Invalid call to rcond.');
        });

        it('LinearAlgebra.mldivide and mrdivide should handle rectangular least-squares systems', () => {
            const overdetermined = createRealMatrix([
                [1, 0],
                [0, 1],
                [1, 1],
            ]);
            const overdeterminedRightHandSide = createRealMatrix([[1], [2], [3]]);
            const underdetermined = createRealMatrix([
                [1, 0, 0],
                [0, 1, 0],
            ]);
            const underdeterminedRightHandSide = createRealMatrix([[4], [5]]);

            expectRealMatrix(LinearAlgebra.mldivide(overdetermined, overdeterminedRightHandSide), [[1], [2]]);
            expectRealMatrix(LinearAlgebra.mldivide(underdetermined, underdeterminedRightHandSide), [[4], [5], [0]]);
            expectRealMatrix(LinearAlgebra.mrdivide(LinearAlgebra.ctranspose(overdeterminedRightHandSide) as MultiArray, LinearAlgebra.ctranspose(overdetermined) as MultiArray), [[1, 2]]);
        });

        it('LinearAlgebra.mldivide should solve rectangular systems with multiple RHS and complex coefficients', () => {
            const overdetermined = createRealMatrix([
                [1, 0],
                [0, 1],
                [1, 1],
            ]);
            const multipleRightHandSides = createRealMatrix([
                [1, 4],
                [2, 5],
                [3, 9],
            ]);
            const complexOverdetermined = createComplexMatrix([
                [
                    [1, 0],
                    [0, 0],
                ],
                [
                    [0, 0],
                    [0, 1],
                ],
                [
                    [1, 0],
                    [0, 1],
                ],
            ]);
            const complexRightHandSide = createComplexMatrix([[[1, 1]], [[-2, 2]], [[-1, 3]]]);

            expectRealMatrix(LinearAlgebra.mldivide(overdetermined, multipleRightHandSides), [
                [1, 4],
                [2, 5],
            ]);
            const complexSolution = LinearAlgebra.mldivide(complexOverdetermined, complexRightHandSide);
            expect(complexSolution.dimension).toEqual([2, 1]);
            expect(Complex.realToNumber(complexSolution.array[0][0] as ComplexType)).toBeCloseTo(1, 10);
            expect(Complex.imagToNumber(complexSolution.array[0][0] as ComplexType)).toBeCloseTo(1, 10);
            expect(Complex.realToNumber(complexSolution.array[1][0] as ComplexType)).toBeCloseTo(2, 10);
            expect(Complex.imagToNumber(complexSolution.array[1][0] as ComplexType)).toBeCloseTo(2, 10);
        });

        it('LinearAlgebra.rank should compute SVD-based numerical rank', () => {
            const rankDeficient = createRealMatrix([
                [3, 2, 4],
                [-1, 1, 2],
                [9, 5, 10],
            ]);
            const diagonal = createRealMatrix([
                [10, 0, 0, 0],
                [0, 25, 0, 0],
                [0, 0, 34, 0],
                [0, 0, 0, 1e-15],
            ]);
            const rowVector = createRealMatrix([[1, 0, 0]]);
            const zero = createRealMatrix([[0]]);

            expect(Complex.realToNumber(LinearAlgebra.rank(rankDeficient))).toBe(2);
            expect(Complex.realToNumber(LinearAlgebra.rank(diagonal))).toBe(3);
            expect(Complex.realToNumber(LinearAlgebra.rank(diagonal, Complex.create(1e-16)))).toBe(4);
            expect(Complex.realToNumber(LinearAlgebra.rank(rowVector))).toBe(1);
            expect(Complex.realToNumber(LinearAlgebra.rank(zero))).toBe(0);
            expect(() => LinearAlgebra.rank(rankDeficient, Complex.create(-1))).toThrow('Invalid call to rank.');
        });

        it('LinearAlgebra.dot of simple real vectors', () => {
            const A = new MultiArray([1, 3]);
            A.array[0][0] = Complex.create(4);
            A.array[0][1] = Complex.create(-1);
            A.array[0][2] = Complex.create(2);
            const B = new MultiArray([1, 3]);
            B.array[0][0] = Complex.create(2);
            B.array[0][1] = Complex.create(-2);
            B.array[0][2] = Complex.create(-1);
            const C = Complex.realToNumber(LinearAlgebra.dot(A, B) as ComplexType);
            expect(C.valueOf()).toBeCloseTo(4 * 2 + -1 * -2 + 2 * -1);
        });

        it('LinearAlgebra.dot of complex vectors', () => {
            const A = new MultiArray([1, 4]);
            A.array[0][0] = Complex.create(1, 1);
            A.array[0][1] = Complex.create(1, -1);
            A.array[0][2] = Complex.create(-1, 1);
            A.array[0][3] = Complex.create(-1, -1);
            const B = new MultiArray([1, 4]);
            B.array[0][0] = Complex.create(3, -4);
            B.array[0][1] = Complex.create(6, -2);
            B.array[0][2] = Complex.create(1, 2);
            B.array[0][3] = Complex.create(4, 3);
            const C = LinearAlgebra.dot(A, B) as ComplexType;
            expect(Complex.realToNumber(C)).toBeCloseTo(1);
            expect(Complex.imagToNumber(C)).toBeCloseTo(-5);
        });

        test('dot product of simple real vectors', () => {
            const A = new MultiArray([1, 3]);
            const B = new MultiArray([1, 3]);
            A.array[0][0] = Complex.create(4);
            A.array[0][1] = Complex.create(-1);
            A.array[0][2] = Complex.create(2);
            B.array[0][0] = Complex.create(2);
            B.array[0][1] = Complex.create(-2);
            B.array[0][2] = Complex.create(-1);

            const C = LinearAlgebra.dot(A, B) as ComplexType;
            const expected = 4 * 2 + -1 * -2 + 2 * -1;
            expect(Complex.realToNumber(C)).toBeCloseTo(expected, 10);
            expect(Complex.imagToNumber(C)).toBeCloseTo(0, 10);
        });

        test('dot(A, A) (auto dot product)', () => {
            const A = new MultiArray([1, 2]);
            A.array[0][0] = Complex.create(1, 2);
            A.array[0][1] = Complex.create(3, 4);

            const D = LinearAlgebra.dot(A, A) as ComplexType;
            expect(Complex.realToNumber(D)).toBeCloseTo(30);
            expect(Complex.imagToNumber(D)).toBeCloseTo(0);
        });

        test('dot of 2D matrices along first non-singleton dimension', () => {
            const A = new MultiArray([3, 3]);
            const B = new MultiArray([3, 3]);
            const aVals = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ];
            const bVals = [
                [9, 8, 7],
                [6, 5, 4],
                [3, 2, 1],
            ];
            for (let i = 0; i < 3; i++)
                for (let j = 0; j < 3; j++) {
                    A.array[i][j] = Complex.create(aVals[i][j]);
                    B.array[i][j] = Complex.create(bVals[i][j]);
                }

            const C = LinearAlgebra.dot(A, B);
            const expected = new MultiArray([1, 3]);
            expected.array[0][0] = Complex.create(46);
            expected.array[0][1] = Complex.create(52);
            expected.array[0][2] = Complex.create(58);
            expect(MultiArray.toLogical(MathOperation.eq(C, expected) as MultiArray).re !== 0).toBe(true);
        });

        test('dot(A,B,2) - operate along dimension 2', () => {
            const A = new MultiArray([3, 3]);
            const B = new MultiArray([3, 3]);
            const aVals = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ];
            const bVals = [
                [9, 8, 7],
                [6, 5, 4],
                [3, 2, 1],
            ];
            for (let i = 0; i < 3; i++)
                for (let j = 0; j < 3; j++) {
                    A.array[i][j] = Complex.create(aVals[i][j]);
                    B.array[i][j] = Complex.create(bVals[i][j]);
                }

            const D = LinearAlgebra.dot(A, B, Complex.create(2));
            const expected = new MultiArray([3, 1]);
            expected.array[0][0] = Complex.create(46);
            expected.array[1][0] = Complex.create(73);
            expected.array[2][0] = Complex.create(46);
            expect(MultiArray.toLogical(MathOperation.eq(D, expected) as MultiArray).re !== 0).toBe(true);
        });

        test('dot for 3D multidimensional arrays', () => {
            const aVals = [
                [
                    [1, 2],
                    [3, 4],
                ],
                [
                    [5, 6],
                    [7, 8],
                ],
            ];
            const bVals = [
                [
                    [2, 1],
                    [4, 3],
                ],
                [
                    [6, 5],
                    [8, 7],
                ],
            ];
            const A = new MultiArray([2, 2, 2], (row, column, page) => Complex.create(aVals[row - 1][column - 1][page - 1]));
            const B = new MultiArray([2, 2, 2], (row, column, page) => Complex.create(bVals[row - 1][column - 1][page - 1]));

            const C = LinearAlgebra.dot(A, B, Complex.create(3));
            const expected = new MultiArray([2, 2]);
            expected.array[0][0] = Complex.create(4);
            expected.array[0][1] = Complex.create(24);
            expected.array[1][0] = Complex.create(60);
            expected.array[1][1] = Complex.create(112);
            expect(MultiArray.toLogical(MathOperation.eq(C, expected) as MultiArray).re !== 0).toBe(true);
        });
    });

    describe('Public contract validation', () => {
        it('Should reject dot operands with different shapes.', () => {
            expect(() => LinearAlgebra.dot(new MultiArray([1, 2]), new MultiArray([2, 1]))).toThrow('dot: A and B must have the same size.');
        });

        it('Should reject dot dimensions outside the input rank.', () => {
            const A = new MultiArray([2, 2]);
            const B = new MultiArray([2, 2]);

            expect(() => LinearAlgebra.dot(A, B, Complex.create(3))).toThrow('dot: dimension argument out of range.');
        });

        it('Should reject nonconformant matrix multiplication.', () => {
            expect(() => LinearAlgebra.mul(new MultiArray([2, 3]), new MultiArray([2, 2]))).toThrow('operator *: nonconformant arguments');
        });

        it('Should reject trace on non-2D arrays.', () => {
            expect(() => LinearAlgebra.trace(new MultiArray([2, 2, 2]))).toThrow('trace: only valid on 2-D objects');
        });
    });
});
