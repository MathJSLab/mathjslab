/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('eig-02.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'eig-02.m'), 'complete_test_result_eig_02');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
