/// <reference types="jest" />
import * as lib from './lib.es2015';

describe('lib.es2015 unit test.', () => {
    it('Should re-export the ES2015 public API surface.', () => {
        expect(lib.Interpreter).toBeDefined();
        expect(lib.Complex).toBeDefined();
        expect(lib.MultiArray).toBeDefined();
        expect(lib.CharString).toBeDefined();
    });
});
