/// <reference types="jest" />
import path from 'node:path';
import { ComplexNumber } from './ComplexNumber';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Definition', () => {
        it(`${unitName} should be defined.`, () => {
            expect(ComplexNumber).toBeDefined();
            expect(ComplexNumber.create).toBeDefined();
            expect(ComplexNumber.add).toBeDefined();
        });
    });

    describe('Construction and classification', () => {
        it('Should create real, complex, and logical values with the expected tags.', () => {
            const real = ComplexNumber.create(2);
            const complex = ComplexNumber.create(2, 3);
            const logical = ComplexNumber.create(1, 0, ComplexNumber.LOGICAL);

            expect(ComplexNumber.isInstanceOf(real)).toBe(true);
            expect(real.type).toBe(ComplexNumber.REAL);
            expect(complex.type).toBe(ComplexNumber.COMPLEX);
            expect(logical.type).toBe(ComplexNumber.LOGICAL);
            expect(ComplexNumber.toBoolean(logical)).toBe(true);
        });

        it('Should detect negative real and imaginary parts.', () => {
            const value = ComplexNumber.create(-2, -3);

            expect(ComplexNumber.realIsNegative(value)).toBe(true);
            expect(ComplexNumber.imagIsNegative(value)).toBe(true);
            expect(ComplexNumber.realIsPositive(value)).toBe(false);
            expect(ComplexNumber.imagIsPositive(value)).toBe(false);
        });

        it('Should preserve NaN values during construction.', () => {
            const direct = ComplexNumber.create(Number.NaN);
            const literal = ComplexNumber.NaN_0();

            expect(ComplexNumber.realIsNaN(direct)).toBe(true);
            expect(ComplexNumber.realIsNaN(literal)).toBe(true);
            expect(ComplexNumber.imagIsZero(literal)).toBe(true);
            expect(Number.isNaN(ComplexNumber.realToNumber(literal))).toBe(true);
        });
    });

    describe('Arithmetic', () => {
        it('Should add, multiply, divide, and conjugate complex values.', () => {
            const left = ComplexNumber.create(2, 3);
            const right = ComplexNumber.create(4, -5);

            expect(ComplexNumber.add(left, right)).toMatchObject({ re: 6, im: -2 });
            expect(ComplexNumber.mul(left, right)).toMatchObject({ re: 23, im: 2 });
            expect(ComplexNumber.rdiv(left, right)).toMatchObject({ re: -7 / 41, im: 22 / 41 });
            expect(ComplexNumber.conj(left)).toMatchObject({ re: 2, im: -3 });
        });

        it('Should evaluate Euler identity within native-number precision.', () => {
            const value = ComplexNumber.exp(ComplexNumber.mul(ComplexNumber.onei(), ComplexNumber.pi()));

            expect(value.re).toBeCloseTo(-1, 12);
            expect(value.im).toBeCloseTo(0, 12);
        });
    });
});
