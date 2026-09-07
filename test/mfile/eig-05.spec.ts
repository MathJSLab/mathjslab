/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('eig-05.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'eig-05.m'), 'complete_test_result_eig_05');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
