/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('indexing-function.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'indexing-function.m'), 'complete_test_result_indexing_function');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
