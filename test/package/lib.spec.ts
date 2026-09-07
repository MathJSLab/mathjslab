/// <reference types="jest" />
import * as lib from '../../src/lib';

describe('lib unit test.', () => {
    it('Should re-export the browser/default public API surface.', () => {
        expect(lib.Interpreter).toBeDefined();
        expect(lib.Complex).toBeDefined();
        expect(lib.MultiArray).toBeDefined();
        expect(lib.CharString).toBeDefined();
    });
});
