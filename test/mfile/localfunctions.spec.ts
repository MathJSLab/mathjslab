/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('localfunctions.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'localfunctions.m'), 'complete_test_result_localfunctions');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
