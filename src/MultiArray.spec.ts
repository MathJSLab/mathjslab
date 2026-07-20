/// <reference types="jest" />
import path from 'node:path';
import { ComplexDecimal } from './ComplexDecimal';
import { Interpreter } from './Interpreter';
import { MultiArray } from './MultiArray';
import { Complex } from './Complex';
import { executeList } from './ParserTestUtils';

let interpreter: Interpreter;

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

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

        it('Array-local shape predicates should remain limited to MultiArray values.', () => {
            expect(MultiArray.isScalar(Complex.one())).toBe(true);
            expect(MultiArray.isVector(Complex.one())).toBe(false);
            expect(MultiArray.isMatrix(Complex.one())).toBe(true);
            expect(MultiArray.isRowVector(MultiArray.firstRow([Complex.one(), Complex.two()]))).toBe(true);
            expect(MultiArray.isVector(MultiArray.firstRow([Complex.one(), Complex.two()]))).toBe(true);
            expect(MultiArray.isColumnVector(MultiArray.toColumnVector([Complex.one(), Complex.two()]))).toBe(true);
            expect(MultiArray.isEmpty(MultiArray.emptyArray())).toBe(true);
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

        it('The determinant must be correctly calculated', () => {
            expect(executeList(interpreter, 'det([1:3;4:6;7:9])').list[0].re.toNumber()).toBe(-0);
            expect(executeList(interpreter, 'det([2,1,-3; 3,2,4; 2,5,-2])').list[0].re.toNumber()).toBe(-67);
            expect(executeList(interpreter, 'det([-7,6,3,1; -9,1,6,4; -8,-4,3,6; -5,5,9,2])').list[0].re.toNumber()).toBe(-444);
        }, 1000);
    });
});
