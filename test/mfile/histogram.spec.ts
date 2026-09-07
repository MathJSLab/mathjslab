/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('histogram.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'histogram.m'), 'complete_test_result_histogram');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
