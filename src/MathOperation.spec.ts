/// <reference types="jest" />
import path from 'node:path';
import { Complex, type ComplexType } from './Complex';
import { MathOperation } from './MathOperation';
import { MultiArray } from './MultiArray';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const createRealMatrix = (values: number[][]): MultiArray => {
    const result = new MultiArray([values.length, values[0].length]);
    for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
            result.array[i][j] = Complex.create(values[i][j]);
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
    describe('Behavior', () => {
        it(`${unitName} and its generic methods should be defined.`, () => {
            expect(MathOperation).toBeDefined();
            expect(MathOperation.copy).toBeDefined();
            expect(MathOperation.mand).toBeDefined();
            expect(MathOperation.mor).toBeDefined();
        });

        it('MathOperation.unaryOperations and its methods should be defined', () => {
            expect(MathOperation.unaryOperations).toBeDefined();
            expect(MathOperation.uplus).toBeDefined();
            expect(MathOperation.uminus).toBeDefined();
            expect(MathOperation.not).toBeDefined();
            expect(MathOperation.transpose).toBeDefined();
            expect(MathOperation.ctranspose).toBeDefined();
        });

        it('MathOperation.binaryOperations and its methods should be defined', () => {
            expect(MathOperation.binaryOperations).toBeDefined();
            expect(MathOperation.minus).toBeDefined();
            expect(MathOperation.mod).toBeDefined();
            expect(MathOperation.rem).toBeDefined();
            expect(MathOperation.rdivide).toBeDefined();
            expect(MathOperation.mrdivide).toBeDefined();
            expect(MathOperation.ldivide).toBeDefined();
            expect(MathOperation.mldivide).toBeDefined();
            expect(MathOperation.power).toBeDefined();
            expect(MathOperation.mpower).toBeDefined();
            expect(MathOperation.le).toBeDefined();
            expect(MathOperation.ge).toBeDefined();
            expect(MathOperation.gt).toBeDefined();
            expect(MathOperation.eq).toBeDefined();
            expect(MathOperation.ne).toBeDefined();
        });

        it('MathOperation.leftAssociativeMultipleOperations and its methods should be defined', () => {
            expect(MathOperation.leftAssociativeMultipleOperations).toBeDefined();
            expect(MathOperation.plus).toBeDefined();
            expect(MathOperation.times).toBeDefined();
            expect(MathOperation.mtimes).toBeDefined();
            expect(MathOperation.and).toBeDefined();
            expect(MathOperation.or).toBeDefined();
            expect(MathOperation.xor).toBeDefined();
        });

        it('MathOperation.mrdivide should solve matrix right division through the linear algebra layer', () => {
            const left = createRealMatrix([
                [2, 4],
                [6, 8],
            ]);
            const right = createRealMatrix([
                [2, 0],
                [0, 4],
            ]);

            expectRealMatrix(MathOperation.mrdivide(left, right) as MultiArray, [
                [1, 1],
                [3, 2],
            ]);
        });

        it('MathOperation.mldivide should solve matrix left division through the linear algebra layer', () => {
            const left = createRealMatrix([
                [2, 0],
                [0, 4],
            ]);
            const right = createRealMatrix([
                [2, 8],
                [6, 16],
            ]);

            expectRealMatrix(MathOperation.mldivide(left, right) as MultiArray, [
                [1, 4],
                [1.5, 4],
            ]);
        });

        it('MathOperation matrix division should reject nonconformant matrix dimensions', () => {
            expect(() => MathOperation.mrdivide(createRealMatrix([[1, 2]]), createRealMatrix([[1, 2]]))).toThrow('operator /: nonconformant arguments');
            expect(() => MathOperation.mldivide(createRealMatrix([[1, 2, 3]]), createRealMatrix([[1], [2], [3]]))).toThrow('operator \\: nonconformant arguments');
        });

        it('MathOperation.mpower should accept numeric scalar values stored in 1x1 matrices', () => {
            const matrix = createRealMatrix([
                [1, 1],
                [0, 1],
            ]);

            expectRealMatrix(MathOperation.mpower(matrix, createRealMatrix([[3]])) as MultiArray, [
                [1, 3],
                [0, 1],
            ]);
            expect(Complex.realToNumber(MathOperation.mpower(createRealMatrix([[2]]), Complex.create(3)) as ComplexType)).toBeCloseTo(8, 10);
            expect(Complex.realToNumber(MathOperation.mpower(Complex.create(2), createRealMatrix([[3]])) as ComplexType)).toBeCloseTo(8, 10);
            expect(Complex.realToNumber(MathOperation.mpower(createRealMatrix([[2]]), createRealMatrix([[3]])) as ComplexType)).toBeCloseTo(8, 10);
        });

        it('MathOperation.mpower should reject nonscalar matrix exponents', () => {
            const matrix = createRealMatrix([
                [1, 1],
                [0, 1],
            ]);

            expect(() => MathOperation.mpower(matrix, createRealMatrix([[1, 2]]))).toThrow("invalid exponent in '^'.");
        });

        it('MathOperation.mpower should compute scalar base with Hermitian matrix exponent', () => {
            expectRealMatrix(
                MathOperation.mpower(
                    Complex.create(2),
                    createRealMatrix([
                        [0, 1],
                        [1, 0],
                    ]),
                ) as MultiArray,
                [
                    [1.25, 0.75],
                    [0.75, 1.25],
                ],
            );
        });

        it('MathOperation.mpower should compute Hermitian matrix base with noninteger scalar exponent', () => {
            const sqrt3 = Math.sqrt(3);

            expectRealMatrix(
                MathOperation.mpower(
                    createRealMatrix([
                        [2, 1],
                        [1, 2],
                    ]),
                    Complex.create(0.5),
                ) as MultiArray,
                [
                    [(1 + sqrt3) / 2, (sqrt3 - 1) / 2],
                    [(sqrt3 - 1) / 2, (1 + sqrt3) / 2],
                ],
            );
        });

        it('MathOperation.mpower should reject unsupported scalar base matrix exponents', () => {
            expect(() => MathOperation.mpower(Complex.create(2), createRealMatrix([[1, 2, 3]]))).toThrow('operator ^: matrix exponent must be square when base is scalar.');
            expect(() =>
                MathOperation.mpower(
                    Complex.create(2),
                    createRealMatrix([
                        [1, 2],
                        [3, 4],
                    ]),
                ),
            ).toThrow("invalid exponent in '^'.");
        });
    });
});
