/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('indexing.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'indexing.m'), 'complete_test_result_indexing');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
