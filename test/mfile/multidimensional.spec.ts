/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('multidimensional.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'multidimensional.m'), 'complete_test_result_multidimensional');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
