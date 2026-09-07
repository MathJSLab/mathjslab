/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('inputname.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'inputname.m'), 'complete_test_result_inputname');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
