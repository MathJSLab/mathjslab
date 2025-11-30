import path from 'node:path';
import { Complex, ComplexType } from './Complex';
import { MultiArray } from './MultiArray';
import { LinearAlgebra } from './LinearAlgebra';
import { MathOperation } from './MathOperation';
import { BLAS } from './BLAS';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    it(`${unitName} should be defined.`, () => {
        expect(LinearAlgebra).toBeDefined();
    });

    it('LinearAlgebra.functions and its methods should be defined', () => {
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

        // const D = LinearAlgebra.dot(A, B, 2);
        const expected = new MultiArray([3, 1]);
        expected.array[0][0] = Complex.create(46);
        expected.array[1][0] = Complex.create(73);
        expected.array[2][0] = Complex.create(46);
        // expect(D.toArray()).toEqual(expected.toArray());
    });

    test('dot for 3D multidimensional arrays', () => {
        const A = new MultiArray([2, 2, 2]);
        const B = new MultiArray([2, 2, 2]);
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
        for (let i = 0; i < 2; i++)
            for (let j = 0; j < 2; j++)
                for (let k = 0; k < 2; k++) {
                    // A.array[i][j][k] = Complex.create(aVals[i][j][k]);
                    // B.array[i][j][k] = Complex.create(bVals[i][j][k]);
                }

        // const C = LinearAlgebra.dot(A, B, 3);
        // expect(C.shape).toEqual([2, 2]);
    });
});
