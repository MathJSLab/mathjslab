/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('min-max.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'min-max.m'), 'complete_test_result_min_max');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
