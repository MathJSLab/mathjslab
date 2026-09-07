/// <reference types="jest" />
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

describe('map-dimension-functions.m m-file test.', () => {
    it('Should complete the m-file test script.', () => {
        const result = runMFileTest(path.join(__dirname, 'map-dimension-functions.m'), 'complete_test_result_map_dimension_functions');

        expect(result.resultSource).toBe('true');
        expect(result.passed).toBe(true);
    });
});
