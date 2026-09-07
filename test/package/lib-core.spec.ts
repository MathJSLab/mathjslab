/// <reference types="jest" />
import * as libCore from '../../src/lib-core';

describe('lib-core unit test.', () => {
    it('Should expose the core public API surface.', () => {
        expect(libCore.Decimal).toBeDefined();
        expect(libCore.CharString).toBeDefined();
        expect(libCore.Complex).toBeDefined();
        expect(libCore.MultiArray).toBeDefined();
        expect(libCore.Structure).toBeDefined();
        expect(libCore.FunctionHandle).toBeDefined();
        expect(libCore.ClassDefinition).toBeDefined();
        expect(libCore.MathML).toBeDefined();
        expect(libCore.AST).toBeDefined();
        expect(libCore.Interpreter).toBeDefined();
    });
});
