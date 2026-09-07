/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('linear-algebra.m m-file test.', () => {
    it('Should complete the linear algebra m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'linear-algebra.m'), 'complete_test_result');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
