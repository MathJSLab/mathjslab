/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('builtin-signature-introspection.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'builtin-signature-introspection.m'), 'complete_test_result_builtin_signature_introspection');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
