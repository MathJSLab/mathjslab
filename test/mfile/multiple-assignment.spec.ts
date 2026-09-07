/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('multiple-assignment.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'multiple-assignment.m'), 'complete_test_result_multiple_assignment');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
