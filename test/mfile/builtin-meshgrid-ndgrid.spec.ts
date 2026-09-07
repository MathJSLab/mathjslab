/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('builtin-meshgrid-ndgrid.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'builtin-meshgrid-ndgrid.m'), 'complete_test_result_builtin_meshgrid_ndgrid');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
