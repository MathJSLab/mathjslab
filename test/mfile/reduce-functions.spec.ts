/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('reduce-functions.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'reduce-functions.m'), 'complete_test_result_reduce_functions');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
