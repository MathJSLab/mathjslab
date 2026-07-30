/// <reference types="jest" />
import { Complex } from './Complex';
import { LAPACKtest } from './LAPACKtest';
import { MultiArray } from './MultiArray';

describe('LAPACKtest unit test.', () => {
    it('Should merge default test options with caller overrides.', () => {
        const options = LAPACKtest.setTestOptions({ print: false, Aid: 'M' });

        expect(options.print).toBe(false);
        expect(options.Aid).toBe('M');
        expect(options.maxIter).toBeDefined();
    });

    it('Should adapt raw matrix arrays to MultiArray values.', () => {
        const value = LAPACKtest.array_to_multiarray([
            [Complex.one(), Complex.zero()],
            [Complex.zero(), Complex.one()],
        ]);

        expect(value).toBeInstanceOf(MultiArray);
        expect(value.dimension).toEqual([2, 2]);
    });
});
