/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('basic-operation-function.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'basic-operation-function.m'), 'complete_test_result_basic_operation_function');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
