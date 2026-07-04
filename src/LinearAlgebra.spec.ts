import path from 'node:path';
import { Complex, ComplexType } from './Complex';
import { MultiArray } from './MultiArray';
import { LinearAlgebra } from './LinearAlgebra';
import { MathOperation } from './MathOperation';
import { BLAS } from './BLAS';
import { Interpreter } from './Interpreter';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

let interpreter: Interpreter;

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
            expect(BLAS.gemm).toBeDefined();
            expect(LinearAlgebra.det).toBeDefined();
            expect(LinearAlgebra.inv).toBeDefined();
            expect(LinearAlgebra.gauss).toBeDefined();
            expect(LinearAlgebra.lu).toBeDefined();
            expect(LinearAlgebra.dot).toBeDefined();
        });

        it('Interpreter should be instatiated and should parse, evaluate and unparse a simple real expression (interpreter test).', () => {
            expect(interpreter).toBeInstanceOf(Interpreter);
            const tree = interpreter.Parse('1+2*3');
            const value = interpreter.Evaluate(tree);
            const unparsed = interpreter.Unparse(tree);
            expect(Complex.realToNumber(value.list[0])).toBe(7);
            expect(unparsed === '1+2*3\n').toBe(true);
        }, 1000);

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
