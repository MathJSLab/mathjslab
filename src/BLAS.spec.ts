/// <reference types="jest" />
import path from 'node:path';
import { Complex, ComplexType, toNumber } from './Complex';
import { MathOperation } from './MathOperation';
import { BLAS } from './BLAS';
import { LAPACKtest, EXPECT_TOL } from './LAPACKtest';
import { Interpreter } from './Interpreter';
import { MultiArray } from './MultiArray';
import { LinearAlgebra } from './LinearAlgebra';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

let interpreter: Interpreter;

const matrixSample: Record<string, string> = {
    trsm_lower_2x2_01: '[1, 0; 2, 1]',

    trsm_lower_3x3_01: `[ 2+0i, 0,     0;
                          1+1i, 3+0i,  0;
                          4-1i, 2+0i,  1+0i]`,

    trsm_upper_2x2_01: '[1, 2-i; 0, 1]',

    trsm_upper_3x3_01: `[ 2+0i, 1-1i, 4+1i;
                          0,    3+0i, 2+0i;
                          0,    0,    1+0i]`,

    trsm_rhs_3x2_01: `[ 1+0i, 2-1i;
                        3+1i, 4+0i;
                        5+0i, 6+2i]`,
};

function expectComplexCloseTo(A: ComplexType, B: ComplexType, tol: number = EXPECT_TOL) {
    expect(Math.abs(Complex.realToNumber(Complex.sub(B, A)))).toBeLessThan(tol);
    expect(Math.abs(Complex.imagToNumber(Complex.sub(B, A)))).toBeLessThan(tol);
}

function expectMatrixClose(A: MultiArray | ComplexType[][], B: MultiArray | ComplexType[][], tol = EXPECT_TOL) {
    A = LAPACKtest.array_to_multiarray(A);
    B = LAPACKtest.array_to_multiarray(B);
    expect(A.dimension[0]).toBe(B.dimension[0]);
    expect(A.dimension[1]).toBe(B.dimension[1]);
    for (let i = 0; i < A.dimension[0]; i++) {
        for (let j = 0; j < A.dimension[1]; j++) {
            const ar = toNumber((A.array[i][j] as ComplexType).re);
            const ai = toNumber((A.array[i][j] as ComplexType).im);
            const br = toNumber((B.array[i][j] as ComplexType).re);
            const bi = toNumber((B.array[i][j] as ComplexType).im);
            expect(Math.abs(ar - br)).toBeLessThan(tol);
            expect(Math.abs(ai - bi)).toBeLessThan(tol);
        }
    }
}

function opA(A: MultiArray, trans: 'N' | 'T' | 'C'): MultiArray {
    if (trans === 'N') return A;
    if (trans === 'T') return LinearAlgebra.transpose(A);
    return LinearAlgebra.ctranspose(A);
}

function materializeUnitDiagonal(A: MultiArray): MultiArray {
    const R = MultiArray.copy(A);
    for (let i = 0; i < R.dimension[0]; i++) {
        R.array[i][i] = Complex.one();
    }
    return R;
}

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        interpreter = Interpreter.Create();
    });

    describe('Behavior', () => {
        it(`${unitName} should be defined.`, () => {
            expect(BLAS).toBeDefined();
            expect(BLAS.functions).toBeDefined();
        });

        describe('BLAS.axpy — Y ← alpha * X + Y', () => {
            it('axpy — real matrices, alpha = 2', () => {
                const X = interpreter.Execute('[1 2; 3 4]').list[0] as MultiArray;
                const Y = interpreter.Execute('[5 6; 7 8]').list[0] as MultiArray;
                BLAS.axpy(interpreter.Execute('2').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
                const expected = interpreter.Execute('[7 10; 13 16]').list[0] as MultiArray;
                expectMatrixClose(Y, expected);
            });

            it('axpy — complex matrices, alpha complex', () => {
                const X = interpreter.Execute('[1+i 2; 3 4-i]').list[0] as MultiArray;
                const Y = interpreter.Execute('[5 6+i; 7 8]').list[0] as MultiArray;
                BLAS.axpy(Complex.create(2, -1), X.array as ComplexType[][], Y.array as ComplexType[][]);
                const expected = interpreter.Execute('[8+i 10-i; 13-3i 15-6i]').list[0] as MultiArray;
                expectMatrixClose(Y, expected);
            });

            it('axpy — alpha = 0 leaves Y unchanged', () => {
                const X = interpreter.Execute('[1 2; 3 4]').list[0] as MultiArray;
                const Y = interpreter.Execute('[5 6; 7 8]').list[0] as MultiArray;
                const Ycopy = interpreter.Execute('[5 6; 7 8]').list[0] as MultiArray;
                BLAS.axpy(interpreter.Execute('0').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
                expectMatrixClose(Y, Ycopy);
            });

            it('axpy — alpha = 1', () => {
                const X = interpreter.Execute('[1 2; 3 4]').list[0] as MultiArray;
                const Y = interpreter.Execute('[5 6; 7 8]').list[0] as MultiArray;
                BLAS.axpy(interpreter.Execute('1').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
                const expected = interpreter.Execute('[6 8; 10 12]').list[0] as MultiArray;
                expectMatrixClose(Y, expected);
            });

            it('axpy — alpha = -1 (Y ← Y − X)', () => {
                const X = interpreter.Execute('[1 2; 3 4]').list[0] as MultiArray;
                const Y = interpreter.Execute('[5 6; 7 8]').list[0] as MultiArray;
                BLAS.axpy(interpreter.Execute('-1').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
                const expected = interpreter.Execute('[4 4; 4 4]').list[0] as MultiArray;
                expectMatrixClose(Y, expected);
            });

            it('axpy — rectangular matrices (3x2)', () => {
                const X = interpreter.Execute('[1 2; 3 4; 5 6]').list[0] as MultiArray;
                const Y = interpreter.Execute('[6 5; 4 3; 2 1]').list[0] as MultiArray;
                BLAS.axpy(interpreter.Execute('2').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
                const expected = interpreter.Execute('[8 9; 10 11; 12 13]').list[0] as MultiArray;
                expectMatrixClose(Y, expected);
            });

            it('axpy — zero X leaves Y unchanged', () => {
                const X = interpreter.Execute('[0 0; 0 0]').list[0] as MultiArray;
                const Y = interpreter.Execute('[1 2; 3 4]').list[0] as MultiArray;
                const Ycopy = interpreter.Execute('[1 2; 3 4]').list[0] as MultiArray;
                BLAS.axpy(interpreter.Execute('5').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
                expectMatrixClose(Y, Ycopy);
            });
        });

        describe('BLAS.scal — scale a vector by a scalar (in-place)', () => {
            it('scal — real vector, alpha real', () => {
                const A = interpreter.Execute('[1; 2; 3]').list[0] as MultiArray;
                const Avec = MultiArray.fromColumnVector(A) as ComplexType[];
                BLAS.scal(Complex.create(2), Avec, 0, 3);
                const expected = interpreter.Execute('[2; 4; 6]').list[0] as MultiArray;
                expectMatrixClose(MultiArray.toColumnVector(Avec), expected);
            });

            it('scal — complex vector, alpha complex', () => {
                const A = interpreter.Execute('[1+i; 2; 3-i]').list[0] as MultiArray;
                const Avec = MultiArray.fromColumnVector(A) as ComplexType[];
                BLAS.scal(Complex.create(2, -1), Avec, 0, 3);
                const expected = interpreter.Execute('[3+i; 4-2i; 5-5i]').list[0] as MultiArray;
                expectMatrixClose(MultiArray.toColumnVector(Avec), expected);
            });

            it('scal — sliced vector (startRow)', () => {
                const A = interpreter.Execute('[1; 2; 3; 4]').list[0] as MultiArray;
                const Avec = MultiArray.fromColumnVector(A) as ComplexType[];
                BLAS.scal(Complex.create(10), Avec, 1, 3);
                const expected = interpreter.Execute('[1; 20; 30; 4]').list[0] as MultiArray;
                expectMatrixClose(MultiArray.toColumnVector(Avec), expected);
            });

            it('scal — alpha = 0 zeros the vector slice', () => {
                const A = interpreter.Execute('[1; 2; 3]').list[0] as MultiArray;
                const Avec = MultiArray.fromColumnVector(A) as ComplexType[];
                BLAS.scal(Complex.zero(), Avec, 0, 3);
                const expected = interpreter.Execute('[0; 0; 0]').list[0] as MultiArray;
                expectMatrixClose(MultiArray.toColumnVector(Avec), expected);
            });

            it('scal — alpha = 1 leaves vector unchanged', () => {
                const A = interpreter.Execute('[1+i; 2; 3-i]').list[0] as MultiArray;
                const Avec = MultiArray.fromColumnVector(A) as ComplexType[];
                BLAS.scal(Complex.one(), Avec, 0, 3);
                expectMatrixClose(MultiArray.toColumnVector(Avec), A);
            });
        });

        describe('BLAS.dotu / BLAS.dotc', () => {
            it('dotu — real vectors', () => {
                const x = interpreter.Execute('[1; 2; 3]').list[0] as MultiArray;
                const y = interpreter.Execute('[4; 5; 6]').list[0] as MultiArray;
                const result = BLAS.dotu(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
                const expected = interpreter.Execute('32').list[0] as any;
                const diff = Complex.sub(result, expected);
                expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
            });

            it('dotc — real vectors (same as dotu)', () => {
                const x = interpreter.Execute('[1; 2; 3]').list[0] as MultiArray;
                const y = interpreter.Execute('[4; 5; 6]').list[0] as MultiArray;
                const result = BLAS.dotc(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
                const expected = interpreter.Execute('32').list[0] as any;
                const diff = Complex.sub(result, expected);
                expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
            });

            it('dotu — complex vectors', () => {
                const x = interpreter.Execute('[1+i; 2; 3-i]').list[0] as MultiArray;
                const y = interpreter.Execute('[4; 5+i; 6]').list[0] as MultiArray;
                const result = BLAS.dotu(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
                const expected = interpreter.Execute('32 + 0i').list[0] as ComplexType;
                const diff = Complex.sub(result, expected);
                expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
            });

            it('dotc — complex vectors (Hermitian dot product)', () => {
                const x = interpreter.Execute('[1+i; 2; 3-i]').list[0] as MultiArray;
                const y = interpreter.Execute('[4; 5+i; 6]').list[0] as MultiArray;
                const result = BLAS.dotc(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
                const expected = interpreter.Execute('32 + 4i').list[0] as ComplexType;
                const diff = Complex.sub(result, expected);
                expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
            });

            it('dotu vs dotc — difference for complex vectors', () => {
                const x = interpreter.Execute('[1+i; 2]').list[0] as MultiArray;
                const y = interpreter.Execute('[3; 4+i]').list[0] as MultiArray;
                const dotu = BLAS.dotu(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
                const dotc = BLAS.dotc(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
                const expectedDotu = interpreter.Execute('11 + 5i').list[0] as any;
                const expectedDotc = interpreter.Execute('11 - i').list[0] as any;
                const diffDotu = Complex.sub(dotu, expectedDotu);
                expect(Math.abs(Complex.realToNumber(diffDotu))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(diffDotu))).toBeLessThan(EXPECT_TOL);
                const diffDotc = Complex.sub(dotc, expectedDotc);
                expect(Math.abs(Complex.realToNumber(diffDotc))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(diffDotc))).toBeLessThan(EXPECT_TOL);
            });

            it('dotu — zero vector', () => {
                const x = interpreter.Execute('[0; 0; 0]').list[0] as MultiArray;
                const y = interpreter.Execute('[1+i; 2; 3]').list[0] as MultiArray;
                const result = BLAS.dotu(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
                const expected = interpreter.Execute('0').list[0] as any;
                const diff = Complex.sub(result, expected);
                expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
            });

            it('dotc — single element vectors', () => {
                const x = interpreter.Execute('[1+i]').list[0] as MultiArray;
                const y = interpreter.Execute('[2-i]').list[0] as MultiArray;
                const result = BLAS.dotc(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
                const expected = interpreter.Execute('1 - 3i').list[0] as any;
                const diff = Complex.sub(result, expected);
                expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
            });
        });

        describe('BLAS.dot', () => {
            it('dot — real column vectors', () => {
                const xMat = interpreter.Execute('[1; 2; 3]').list[0] as MultiArray;
                const yMat = interpreter.Execute('[4; 5; 6]').list[0] as MultiArray;
                const x = MultiArray.fromColumnVector(xMat) as ComplexType[];
                const y = MultiArray.fromColumnVector(yMat) as ComplexType[];
                const result = BLAS.dot(x, y);
                expect(Complex.realToNumber(result)).toBeCloseTo(32);
            });

            it('dot — real row vectors', () => {
                const xMat = interpreter.Execute('[1, 2, 3]').list[0] as MultiArray;
                const yMat = interpreter.Execute('[4, 5, 6]').list[0] as MultiArray;
                const x = MultiArray.fromRowVector(xMat) as ComplexType[];
                const y = MultiArray.fromRowVector(yMat) as ComplexType[];
                const result = BLAS.dot(x, y);
                expect(Complex.realToNumber(result)).toBeCloseTo(32);
            });

            it('dot — complex vectors (unconjugated)', () => {
                const xMat = interpreter.Execute('[1+2i; 3-1i]').list[0] as MultiArray;
                const yMat = interpreter.Execute('[-2+i; 4]').list[0] as MultiArray;
                const x = MultiArray.fromColumnVector(xMat) as ComplexType[];
                const y = MultiArray.fromColumnVector(yMat) as ComplexType[];
                const result = BLAS.dot(x, y);
                // referência algébrica explícita:
                // (1+2i)*(-2+i) + (3-1i)*4
                const expected = Complex.add(Complex.mul(x[0], y[0]), Complex.mul(x[1], y[1]));

                expectComplexCloseTo(result, expected, EXPECT_TOL);
            });

            it('dot — differs from conjugated inner product (dotc)', () => {
                const xMat = interpreter.Execute('[1+2i; 3-1i]').list[0] as MultiArray;
                const yMat = interpreter.Execute('[-2+i; 4]').list[0] as MultiArray;
                const x = MultiArray.fromColumnVector(xMat) as ComplexType[];
                const y = MultiArray.fromColumnVector(yMat) as ComplexType[];
                const dot = BLAS.dot(x, y);
                const dotc = BLAS.dotc(x, y);
                expect(Complex.toBoolean(Complex.eq(dot, dotc))).toBe(false);
            });
        });

        describe('BLAS.trsm — Solves a triangular system with multiple right-hand sides', () => {
            it('trsm — left lower unit N', () => {
                const A_lower = interpreter.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'lower', unitDiagonal: true, transA: 'N' });
                expectMatrixClose(MathOperation.mtimes(opA(materializeUnitDiagonal(A_lower), 'N'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
            });

            it('trsm — left lower non-unit N', () => {
                const A_lower = interpreter.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'lower', unitDiagonal: false, transA: 'N' });
                expectMatrixClose(MathOperation.mtimes(opA(A_lower, 'N'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
            });

            it('trsm — left lower unit T', () => {
                const A_lower = interpreter.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'lower', unitDiagonal: true, transA: 'T' });
                expectMatrixClose(MathOperation.mtimes(opA(materializeUnitDiagonal(A_lower), 'T'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
            });

            it('trsm — left lower non-unit T', () => {
                const A_lower = interpreter.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'lower', unitDiagonal: false, transA: 'T' });
                expectMatrixClose(MathOperation.mtimes(opA(A_lower, 'T'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
            });

            it('trsm — left upper unit N', () => {
                const A_upper = interpreter.Execute(`${matrixSample['trsm_upper_3x3_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'upper', unitDiagonal: true, transA: 'N' });
                const M = MathOperation.mtimes(opA(materializeUnitDiagonal(A_upper), 'N'), new MultiArray([X.length, X[0].length], X)) as MultiArray;
                expectMatrixClose(M, B);
            });

            it('trsm — left upper non-unit T', () => {
                const A_upper = interpreter.Execute(`${matrixSample['trsm_upper_3x3_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'upper', unitDiagonal: false, transA: 'T' });
                expectMatrixClose(MathOperation.mtimes(opA(A_upper, 'T'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
            });

            it('trsm — right lower unit N', () => {
                const A_lower = interpreter.Execute(`${matrixSample['trsm_lower_2x2_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'lower', unitDiagonal: true, transA: 'N' });
                expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'N')) as MultiArray, B);
            });

            it('trsm — right lower non-unit N', () => {
                const A_lower = interpreter.Execute(`${matrixSample['trsm_lower_2x2_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'lower', unitDiagonal: false, transA: 'N' });
                expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'N')) as MultiArray, B);
            });

            it('trsm — right lower unit T', () => {
                const A_lower = interpreter.Execute(`${matrixSample['trsm_lower_2x2_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'lower', unitDiagonal: true, transA: 'T' });
                expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'T')) as MultiArray, B);
            });

            it('trsm — right lower non-unit T', () => {
                const A_lower = interpreter.Execute(`${matrixSample['trsm_lower_2x2_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'lower', unitDiagonal: false, transA: 'T' });
                expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'T')) as MultiArray, B);
            });

            it('trsm — right upper unit N', () => {
                const A_upper = interpreter.Execute(`${matrixSample['trsm_upper_2x2_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'upper', unitDiagonal: true, transA: 'N' });
                expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_upper, 'N')) as MultiArray, B);
            });

            it('trsm — right upper non-unit T', () => {
                const A_upper = interpreter.Execute(`${matrixSample['trsm_upper_2x2_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'upper', unitDiagonal: false, transA: 'T' });
                expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_upper, 'T')) as MultiArray, B);
            });

            it('trsm — left lower non-unit C', () => {
                const A_lower = interpreter.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], {
                    side: 'left',
                    uplo: 'lower',
                    unitDiagonal: false,
                    transA: 'C',
                });
                expectMatrixClose(MathOperation.mtimes(opA(A_lower, 'C'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
            });

            it('trsm — left upper non-unit C', () => {
                const A_upper = interpreter.Execute(`${matrixSample['trsm_upper_3x3_01']}`).list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], {
                    side: 'left',
                    uplo: 'upper',
                    unitDiagonal: false,
                    transA: 'C',
                });
                expectMatrixClose(MathOperation.mtimes(opA(A_upper, 'C'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
            });

            it('trsm — left lower unit C with conformant unit-diagonal fixture', () => {
                const A_lower = interpreter.Execute('[1,0,0; 2+i,1,0; 3-i,4,1]').list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], {
                    side: 'left',
                    uplo: 'lower',
                    unitDiagonal: true,
                    transA: 'C',
                });
                expectMatrixClose(MathOperation.mtimes(opA(A_lower, 'C'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
            });

            it('trsm — left upper unit C with conformant unit-diagonal fixture', () => {
                const A_upper = interpreter.Execute('[1,2-i,3; 0,1,4+i; 0,0,1]').list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], {
                    side: 'left',
                    uplo: 'upper',
                    unitDiagonal: true,
                    transA: 'C',
                });
                expectMatrixClose(MathOperation.mtimes(opA(A_upper, 'C'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
            });

            it('trsm — right lower non-unit C with conformant fixture', () => {
                const A_lower = interpreter.Execute('[2,0; 1+i,3]').list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], {
                    side: 'right',
                    uplo: 'lower',
                    unitDiagonal: false,
                    transA: 'C',
                });
                expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'C')) as MultiArray, B);
            });

            it('trsm — right upper non-unit C with conformant fixture', () => {
                const A_upper = interpreter.Execute('[2,1-i; 0,3]').list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], {
                    side: 'right',
                    uplo: 'upper',
                    unitDiagonal: false,
                    transA: 'C',
                });
                expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_upper, 'C')) as MultiArray, B);
            });

            it('trsm — right lower unit C with conformant unit-diagonal fixture', () => {
                const A_lower = interpreter.Execute('[1,0; 1+i,1]').list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], {
                    side: 'right',
                    uplo: 'lower',
                    unitDiagonal: true,
                    transA: 'C',
                });
                expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'C')) as MultiArray, B);
            });

            it('trsm — right upper unit C with conformant unit-diagonal fixture', () => {
                const A_upper = interpreter.Execute('[1,1-i; 0,1]').list[0] as MultiArray;
                const B = interpreter.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
                const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], {
                    side: 'right',
                    uplo: 'upper',
                    unitDiagonal: true,
                    transA: 'C',
                });
                expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_upper, 'C')) as MultiArray, B);
            });
        });

        describe('BLAS.nrm2sq and BLAS.nmr2 — squared Euclidean norm and Euclidean norm (sqrt of sum |x_i|^2)', () => {
            it('nrm2 — real vector', () => {
                interpreter.Execute('R = [3; 4]');
                const R = interpreter.Execute('R').list[0];
                const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
                expect(Complex.imagToNumber(n)).toBeCloseTo(0);
                expect(Complex.realToNumber(n)).toBeCloseTo(5);
            });

            it('nrm2 — complex vector', () => {
                interpreter.Execute('R = [1+i; 2-i]');
                const R = interpreter.Execute('R').list[0];
                const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
                expect(Complex.imagToNumber(n)).toBeCloseTo(0);
                expect(Complex.realToNumber(n)).toBeCloseTo(Math.sqrt(7));
            });

            it('nrm2 — zero vector', () => {
                interpreter.Execute('R = [0; 0; 0]');
                const R = interpreter.Execute('R').list[0];
                const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
                expect(Complex.imagToNumber(n)).toBeCloseTo(0);
                expect(Complex.realToNumber(n)).toBeCloseTo(0);
            });

            it('nrm2sq — real vector', () => {
                interpreter.Execute('R = [3; 4]');
                const R = interpreter.Execute('R').list[0];
                const s = BLAS.nrm2sq(R, 0, 0, 2);
                expect(Complex.imagToNumber(s)).toBeCloseTo(0);
                expect(Complex.realToNumber(s)).toBeCloseTo(25);
            });

            it('nrm2sq — complex vector', () => {
                interpreter.Execute('R = [1+i; 2-i]');
                const R = interpreter.Execute('R').list[0];
                const s = BLAS.nrm2sq(R, 0, 0, 2);
                expect(Complex.imagToNumber(s)).toBeCloseTo(0);
                expect(Complex.realToNumber(s)).toBeCloseTo(7);
            });

            it('nrm2sq — sliced vector (startRow)', () => {
                interpreter.Execute('R = [10; 3; 4]');
                const R = interpreter.Execute('R').list[0];
                const s = BLAS.nrm2sq(R, 0, 1, 3);
                expect(Complex.imagToNumber(s)).toBeCloseTo(0);
                expect(Complex.realToNumber(s)).toBeCloseTo(25);
            });
        });

        describe('BLAS.nrm2 — scaled Euclidean norm (extended tests)', () => {
            it('nrm2 — vector with interleaved zeros', () => {
                const R = interpreter.Execute('[0; 3; 0; 4]').list[0] as MultiArray;
                const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
                expect(Complex.realToNumber(n)).toBeCloseTo(5);
                expect(Complex.imagToNumber(n)).toBeCloseTo(0);
            });

            it('nrm2 — purely imaginary vector', () => {
                const R = interpreter.Execute('[2i; -3i]').list[0] as MultiArray;
                const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
                expect(Complex.realToNumber(n)).toBeCloseTo(Math.sqrt(13));
                expect(Complex.imagToNumber(n)).toBeCloseTo(0);
            });

            it('nrm2 — mixed magnitude vector (scaling robustness)', () => {
                const R = interpreter.Execute('[1e-20; 1e20]').list[0] as MultiArray;
                const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
                expect(Complex.realToNumber(n)).toBeCloseTo(1e20);
            });

            it('nrm2 — unit vector', () => {
                const R = interpreter.Execute('[1; 0; 0]').list[0] as MultiArray;
                const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
                expect(Complex.realToNumber(n)).toBeCloseTo(1);
            });
        });

        describe('BLAS.trsv — Solve a triangular system A * x = b, A^T * x = b or A^H * x = b, where A is triangular and x is a vector', () => {
            it('trsv — lower unit N', () => {
                const A = interpreter.Execute(matrixSample['trsm_lower_3x3_01']).list[0] as MultiArray;
                const B = interpreter.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
                const x = BLAS.trsv(
                    A.array as ComplexType[][],
                    B.array.map((row: any[]) => row[0]),
                    {
                        uplo: 'lower',
                        transA: 'N',
                        unitDiagonal: true,
                    },
                );
                expectMatrixClose(MathOperation.mtimes(materializeUnitDiagonal(A), MultiArray.toColumnVector(x)) as MultiArray, B);
            });

            it('trsv — lower non-unit N', () => {
                const A = interpreter.Execute(matrixSample['trsm_lower_3x3_01']).list[0] as MultiArray;
                const B = interpreter.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
                const x = BLAS.trsv(
                    A.array as ComplexType[][],
                    B.array.map((row: any[]) => row[0]),
                    {
                        uplo: 'lower',
                        transA: 'N',
                        unitDiagonal: false,
                    },
                );
                expectMatrixClose(MathOperation.mtimes(A, MultiArray.toColumnVector(x)) as MultiArray, B);
            });

            it('trsv — lower unit T', () => {
                const A = interpreter.Execute(matrixSample['trsm_lower_3x3_01']).list[0] as MultiArray;
                const B = interpreter.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
                const x = BLAS.trsv(
                    A.array as ComplexType[][],
                    B.array.map((row: any[]) => row[0]),
                    {
                        uplo: 'lower',
                        transA: 'T',
                        unitDiagonal: true,
                    },
                );
                expectMatrixClose(MathOperation.mtimes(opA(materializeUnitDiagonal(A), 'T'), MultiArray.toColumnVector(x)) as MultiArray, B);
            });

            it('trsv — lower non-unit T', () => {
                const A = interpreter.Execute(matrixSample['trsm_lower_3x3_01']).list[0] as MultiArray;
                const B = interpreter.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
                const x = BLAS.trsv(
                    A.array as ComplexType[][],
                    B.array.map((row: any[]) => row[0]),
                    {
                        uplo: 'lower',
                        transA: 'T',
                        unitDiagonal: false,
                    },
                );
                expectMatrixClose(MathOperation.mtimes(opA(A, 'T'), MultiArray.toColumnVector(x)) as MultiArray, B);
            });

            it('trsv — upper unit N', () => {
                const A = interpreter.Execute(matrixSample['trsm_upper_3x3_01']).list[0] as MultiArray;
                const B = interpreter.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
                const x = BLAS.trsv(
                    A.array as ComplexType[][],
                    B.array.map((row: any[]) => row[0]),
                    {
                        uplo: 'upper',
                        transA: 'N',
                        unitDiagonal: true,
                    },
                );
                expectMatrixClose(MathOperation.mtimes(materializeUnitDiagonal(A), MultiArray.toColumnVector(x)) as MultiArray, B);
            });

            it('trsv — upper non-unit T', () => {
                const A = interpreter.Execute(matrixSample['trsm_upper_3x3_01']).list[0] as MultiArray;
                const B = interpreter.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
                const x = BLAS.trsv(
                    A.array as ComplexType[][],
                    B.array.map((row: any[]) => row[0]),
                    {
                        uplo: 'upper',
                        transA: 'T',
                        unitDiagonal: false,
                    },
                );
                expectMatrixClose(MathOperation.mtimes(opA(A, 'T'), MultiArray.toColumnVector(x)) as MultiArray, B);
            });
        });

        describe('BLAS.gemv', () => {
            it('gemv — real matrix and vectors', () => {
                const A = interpreter.Execute('[1,2; 3,4]').list[0] as MultiArray;
                const x = interpreter.Execute('[1; 1]').list[0] as MultiArray;
                const y = interpreter.Execute('[0; 0]').list[0] as MultiArray;
                const xvec = x.array.map((row: any[]) => row[0]) as ComplexType[];
                const yvec = y.array.map((row: any[]) => row[0]) as ComplexType[];
                BLAS.gemv(A.array as ComplexType[][], 2, 2, 0, 0, xvec, 0, yvec, 0, Complex.one(), Complex.zero());
                y.array[0][0] = yvec[0];
                y.array[1][0] = yvec[1];
                expect(Complex.realToNumber(y.array[0][0] as ComplexType)).toBeCloseTo(3);
                expect(Complex.realToNumber(y.array[1][0] as ComplexType)).toBeCloseTo(7);
            });

            it('gemv — complex matrix and vectors', () => {
                const A = interpreter.Execute('[1+i, 2; 3, 4-i]').list[0] as MultiArray;
                const x = interpreter.Execute('[1; i]').list[0] as MultiArray;
                const y = interpreter.Execute('[0; 0]').list[0] as MultiArray;
                const xvec = x.array.map((row: any[]) => row[0]) as ComplexType[];
                const yvec = y.array.map((row: any[]) => row[0]) as ComplexType[];
                BLAS.gemv(A.array as ComplexType[][], 2, 2, 0, 0, xvec, 0, yvec, 0, Complex.one(), Complex.zero());
                y.array[0][0] = yvec[0];
                y.array[1][0] = yvec[1];
                const y0 = y.array[0][0] as ComplexType;
                const y1 = y.array[1][0] as ComplexType;
                expect(Math.abs(Complex.realToNumber(y0) - 1)).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(y0) - 3)).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.realToNumber(y1) - 4)).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(y1) - 4)).toBeLessThan(EXPECT_TOL);
            });

            it('gemv — beta = 0 overwrites y', () => {
                const A = interpreter.Execute('[1,0; 0,1]').list[0] as MultiArray;
                const x = interpreter.Execute('[2; 3]').list[0] as MultiArray;
                const y = interpreter.Execute('[5; 6]').list[0] as MultiArray;
                const xvec = x.array.map((row: any[]) => row[0]) as ComplexType[];
                const yvec = y.array.map((row: any[]) => row[0]) as ComplexType[];
                BLAS.gemv(A.array as ComplexType[][], 2, 2, 0, 0, xvec, 0, yvec, 0, Complex.one(), Complex.zero());
                y.array[0][0] = yvec[0];
                y.array[1][0] = yvec[1];
                expect(Complex.realToNumber(y.array[0][0] as ComplexType)).toBeCloseTo(2);
                expect(Complex.realToNumber(y.array[1][0] as ComplexType)).toBeCloseTo(3);
            });

            it('gemv — submatrix with offsets', () => {
                const A = interpreter.Execute('[1,2,3; 4,5,6; 7,8,9]').list[0] as MultiArray;
                const x = interpreter.Execute('[1; 1]').list[0] as MultiArray;
                const y = interpreter.Execute('[0; 0]').list[0] as MultiArray;
                const xvec = x.array.map((row: any[]) => row[0]) as ComplexType[];
                const yvec = y.array.map((row: any[]) => row[0]) as ComplexType[];
                BLAS.gemv(A.array as ComplexType[][], 2, 2, 1, 1, xvec, 0, yvec, 0, Complex.one(), Complex.zero());
                y.array[0][0] = yvec[0];
                y.array[1][0] = yvec[1];
                expect(Complex.realToNumber(y.array[0][0] as ComplexType)).toBeCloseTo(11);
                expect(Complex.realToNumber(y.array[1][0] as ComplexType)).toBeCloseTo(17);
            });

            it('gemv — alpha = 0 leaves y scaled by beta', () => {
                const A = interpreter.Execute('[1,2; 3,4]').list[0] as MultiArray;
                const x = interpreter.Execute('[1; 1]').list[0] as MultiArray;
                const y = interpreter.Execute('[2; 3]').list[0] as MultiArray;
                BLAS.gemv(
                    A.array as ComplexType[][],
                    2,
                    2,
                    0,
                    0,
                    x.array.map((row: any[]) => row[0]) as ComplexType[],
                    0,
                    y.array.map((row: any[]) => row[0]) as ComplexType[],
                    0,
                    Complex.zero(),
                    Complex.one(),
                );
                expect(Complex.realToNumber(y.array[0][0] as ComplexType)).toBeCloseTo(2);
                expect(Complex.realToNumber(y.array[1][0] as ComplexType)).toBeCloseTo(3);
            });
        });

        describe('BLAS.ger', () => {
            it('ger — real vectors and matrix', () => {
                const A = interpreter.Execute('[1,2; 3,4]').list[0] as MultiArray;
                const x = interpreter.Execute('[1; 1]').list[0] as MultiArray;
                const y = interpreter.Execute('[1; 2]').list[0] as MultiArray;
                // A := A + x * yᵀ
                BLAS.ger(A.array as ComplexType[][], 0, 0, 2, 2, Complex.one(), x.array as ComplexType[][], 0, 0, y.array as ComplexType[][], 0, 0);
                // Expected:
                // [1+1*1, 2+1*2] = [2,4]
                // [3+1*1, 4+1*2] = [4,6]
                expect(Complex.realToNumber(A.array[0][0] as ComplexType)).toBeCloseTo(2);
                expect(Complex.realToNumber(A.array[0][1] as ComplexType)).toBeCloseTo(4);
                expect(Complex.realToNumber(A.array[1][0] as ComplexType)).toBeCloseTo(4);
                expect(Complex.realToNumber(A.array[1][1] as ComplexType)).toBeCloseTo(6);
            });

            it('ger — complex vectors (conjugate on y)', () => {
                const A = interpreter.Execute('[0,0; 0,0]').list[0] as MultiArray;
                const x = interpreter.Execute('[1+i; 2]').list[0] as MultiArray;
                const y = interpreter.Execute('[1-i; i]').list[0] as MultiArray;
                BLAS.ger(A.array as ComplexType[][], 0, 0, 2, 2, Complex.one(), x.array as ComplexType[][], 0, 0, y.array as ComplexType[][], 0, 0);
                // A[0,0] = (1+i)*conj(1-i) = (1+i)*(1+i) = 2i
                const a00 = A.array[0][0] as ComplexType;
                expect(Math.abs(Complex.realToNumber(a00))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(a00) - 2)).toBeLessThan(EXPECT_TOL);
                // A[0,1] = (1+i)*conj(i) = (1+i)*(-i) = 1 - i
                const a01 = A.array[0][1] as ComplexType;
                expect(Math.abs(Complex.realToNumber(a01) - 1)).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(a01) + 1)).toBeLessThan(EXPECT_TOL);
            });

            it('ger — alpha = 0 leaves matrix unchanged', () => {
                const A = interpreter.Execute('[1,2; 3,4]').list[0] as MultiArray;
                const x = interpreter.Execute('[5; 6]').list[0] as MultiArray;
                const y = interpreter.Execute('[7; 8]').list[0] as MultiArray;
                BLAS.ger(A.array as ComplexType[][], 0, 0, 2, 2, Complex.zero(), x.array as ComplexType[][], 0, 0, y.array as ComplexType[][], 0, 0);
                expect(Complex.realToNumber(A.array[0][0] as ComplexType)).toBeCloseTo(1);
                expect(Complex.realToNumber(A.array[0][1] as ComplexType)).toBeCloseTo(2);
                expect(Complex.realToNumber(A.array[1][0] as ComplexType)).toBeCloseTo(3);
                expect(Complex.realToNumber(A.array[1][1] as ComplexType)).toBeCloseTo(4);
            });

            it('ger — submatrix with offsets', () => {
                const A = interpreter.Execute('[1,2,3; 4,5,6; 7,8,9]').list[0] as MultiArray;
                const x = interpreter.Execute('[1; 1]').list[0] as MultiArray;
                const y = interpreter.Execute('[2; 3]').list[0] as MultiArray;
                // Atualiza bloco A[1:3, 1:3]
                BLAS.ger(A.array as ComplexType[][], 1, 1, 2, 2, Complex.one(), x.array as ComplexType[][], 0, 0, y.array as ComplexType[][], 0, 0);
                // Submatriz original [[5,6],[8,9]]
                // + [[2,3],[2,3]] → [[7,9],[10,12]]
                expect(Complex.realToNumber(A.array[1][1] as ComplexType)).toBeCloseTo(7);
                expect(Complex.realToNumber(A.array[1][2] as ComplexType)).toBeCloseTo(9);
                expect(Complex.realToNumber(A.array[2][1] as ComplexType)).toBeCloseTo(10);
                expect(Complex.realToNumber(A.array[2][2] as ComplexType)).toBeCloseTo(12);
            });
        });

        describe('BLAS.geru', () => {
            it('geru — real vectors', () => {
                const C = interpreter.Execute('[1,2; 3,4]').list[0].array as ComplexType[][];
                const x = interpreter.Execute('[1; 1]').list[0].array.map((row: any[]) => row[0]) as ComplexType[];
                const y = interpreter.Execute('[2; 3]').list[0].array.map((row: any[]) => row[0]) as ComplexType[];
                BLAS.geru(x, y, Complex.one(), C, 0, 0);
                // C + x*yᵀ = [[1,2],[3,4]] + [[2,3],[2,3]]
                expect(Complex.realToNumber(C[0][0])).toBeCloseTo(3);
                expect(Complex.realToNumber(C[0][1])).toBeCloseTo(5);
                expect(Complex.realToNumber(C[1][0])).toBeCloseTo(5);
                expect(Complex.realToNumber(C[1][1])).toBeCloseTo(7);
            });

            it('geru — complex vectors (no conjugation)', () => {
                const C = interpreter.Execute('[0,0; 0,0]').list[0].array as ComplexType[][];
                const x = interpreter.Execute('[1+i; 2]').list[0].array.map((row: any[]) => row[0]) as ComplexType[];
                const y = interpreter.Execute('[i; 1]').list[0].array.map((row: any[]) => row[0]) as ComplexType[];
                BLAS.geru(x, y, Complex.one(), C, 0, 0);
                // C[0,0] = (1+i)*i = -1 + i
                const c00 = C[0][0];
                expect(Math.abs(Complex.realToNumber(c00) + 1)).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(c00) - 1)).toBeLessThan(EXPECT_TOL);
            });
        });

        describe('BLAS.gemm', () => {
            it('gemm — small real matrices, alpha=1, beta=0', () => {
                const A = interpreter.Execute('[1,2;3,4]').list[0] as MultiArray;
                const B = interpreter.Execute('[5,6;7,8]').list[0] as MultiArray;
                const C = interpreter.Execute('[0,0;0,0]').list[0] as MultiArray;
                BLAS.gemm(Complex.one(), A.array as ComplexType[][], 2, 2, B.array as ComplexType[][], 2, Complex.zero(), C.array as ComplexType[][]);
                expect(Complex.realToNumber(C.array[0][0] as ComplexType)).toBeCloseTo(19);
                expect(Complex.realToNumber(C.array[0][1] as ComplexType)).toBeCloseTo(22);
                expect(Complex.realToNumber(C.array[1][0] as ComplexType)).toBeCloseTo(43);
                expect(Complex.realToNumber(C.array[1][1] as ComplexType)).toBeCloseTo(50);
            });

            it('gemm — small complex matrices, alpha=1, beta=0', () => {
                const A = interpreter.Execute('[1+i,2;3,4-i]').list[0] as MultiArray;
                const B = interpreter.Execute('[i,1;1,i]').list[0] as MultiArray;
                const C = interpreter.Execute('[0,0;0,0]').list[0] as MultiArray;
                BLAS.gemm(Complex.one(), A.array as ComplexType[][], 2, 2, B.array as ComplexType[][], 2, Complex.zero(), C.array as ComplexType[][]);
                // expected: [ (1+i)*i + 2*1 , (1+i)*1 + 2*i ; 3*i + (4-i)*1 , 3*1 + (4-i)*i ]
                const y00 = Complex.add(Complex.mul(A.array[0][0] as ComplexType, B.array[0][0] as ComplexType), Complex.mul(A.array[0][1] as ComplexType, B.array[1][0] as ComplexType));
                const y01 = Complex.add(Complex.mul(A.array[0][0] as ComplexType, B.array[0][1] as ComplexType), Complex.mul(A.array[0][1] as ComplexType, B.array[1][1] as ComplexType));
                const y10 = Complex.add(Complex.mul(A.array[1][0] as ComplexType, B.array[0][0] as ComplexType), Complex.mul(A.array[1][1] as ComplexType, B.array[1][0] as ComplexType));
                const y11 = Complex.add(Complex.mul(A.array[1][0] as ComplexType, B.array[0][1] as ComplexType), Complex.mul(A.array[1][1] as ComplexType, B.array[1][1] as ComplexType));
                expect(Math.abs(Complex.realToNumber(C.array[0][0] as ComplexType) - Complex.realToNumber(y00))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(C.array[0][0] as ComplexType) - Complex.imagToNumber(y00))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.realToNumber(C.array[0][1] as ComplexType) - Complex.realToNumber(y01))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(C.array[0][1] as ComplexType) - Complex.imagToNumber(y01))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.realToNumber(C.array[1][0] as ComplexType) - Complex.realToNumber(y10))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(C.array[1][0] as ComplexType) - Complex.imagToNumber(y10))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.realToNumber(C.array[1][1] as ComplexType) - Complex.realToNumber(y11))).toBeLessThan(EXPECT_TOL);
                expect(Math.abs(Complex.imagToNumber(C.array[1][1] as ComplexType) - Complex.imagToNumber(y11))).toBeLessThan(EXPECT_TOL);
            });

            it('gemm — alpha=0 scales C by beta', () => {
                // matriz C de entrada
                const C = interpreter.Execute('[1,2;3,4]').list[0] as MultiArray;
                // chama gemm com alpha = 0
                // A e B não serão usados, então podem ser matrizes vazias
                BLAS.gemm(
                    Complex.zero(),
                    [], // A
                    C.dimension[0], // m
                    0, // k (não usado)
                    [], // B
                    C.dimension[1], // n
                    Complex.create(2, 0), // beta
                    C.array as ComplexType[][], // C
                );
                // verifica se todos os elementos de C foram escalados por beta=2
                expect(Complex.realToNumber(C.array[0][0] as ComplexType)).toBeCloseTo(2);
                expect(Complex.realToNumber(C.array[0][1] as ComplexType)).toBeCloseTo(4);
                expect(Complex.realToNumber(C.array[1][0] as ComplexType)).toBeCloseTo(6);
                expect(Complex.realToNumber(C.array[1][1] as ComplexType)).toBeCloseTo(8);
            });

            it('gemm — blocked vs simple produce same results', () => {
                const A = interpreter.Execute('[1,2,3;4,5,6;7,8,9]').list[0] as MultiArray;
                const B = interpreter.Execute('[1,0,0;0,1,0;0,0,1]').list[0] as MultiArray;
                const C1 = interpreter.Execute('[0,0,0;0,0,0;0,0,0]').list[0] as MultiArray;
                const C2 = interpreter.Execute('[0,0,0;0,0,0;0,0,0]').list[0] as MultiArray;
                // force blocked
                BLAS.settings.blockThreshold = 1;
                BLAS.gemm(Complex.one(), A.array as ComplexType[][], 3, 3, B.array as ComplexType[][], 3, Complex.zero(), C1.array as ComplexType[][], 2);
                // simple
                BLAS.settings.blockThreshold = 1e6;
                BLAS.gemm(Complex.one(), A.array as ComplexType[][], 3, 3, B.array as ComplexType[][], 3, Complex.zero(), C2.array as ComplexType[][]);
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        expect(Complex.realToNumber(C1.array[i][j] as ComplexType)).toBeCloseTo(Complex.realToNumber(C2.array[i][j] as ComplexType));
                    }
                }
            });
        });
    });
});
