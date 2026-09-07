/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('logical.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'logical.m'), 'complete_test_result_logical');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
