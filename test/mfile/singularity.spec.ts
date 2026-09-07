/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('singularity.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'singularity.m'), 'complete_test_result_singularity');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
