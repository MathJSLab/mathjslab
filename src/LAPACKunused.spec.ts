/// <reference types="jest" />
import { Complex, type ComplexType } from './Complex';
import { LAPACKConfigKeyTable, LAPACKunused } from './LAPACKunused';
import { MultiArray } from './MultiArray';

describe('LAPACKunused unit test.', () => {
    it('Should expose its configuration key table.', () => {
        expect(LAPACKConfigKeyTable).toEqual(['maxIterationFactor']);
    });

    it('Should swap rows in a MultiArray through the legacy helper.', () => {
        const matrix = new MultiArray([2, 2]);
        matrix.array = [
            [Complex.create(1), Complex.create(2)],
            [Complex.create(3), Complex.create(4)],
        ];

        LAPACKunused.laswp_rows(matrix, 0, 1);

        expect(Complex.realToNumber(matrix.array[0][0] as ComplexType)).toBe(3);
        expect(Complex.realToNumber(matrix.array[1][0] as ComplexType)).toBe(1);
    });
});
