/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('array-shape.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'array-shape.m'), 'complete_test_result_array_shape');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
