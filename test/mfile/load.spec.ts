/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('load.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'load.m'), 'complete_test_result_load');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
