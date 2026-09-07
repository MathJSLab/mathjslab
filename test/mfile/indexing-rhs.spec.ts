/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('indexing-rhs.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'indexing-rhs.m'), 'complete_test_result_index_rhs');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
