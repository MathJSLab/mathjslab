/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('array-concatenation-01.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'array-concatenation-01.m'), 'complete_test_result_array_concatenation_01');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
