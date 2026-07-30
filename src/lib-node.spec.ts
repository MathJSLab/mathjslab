/// <reference types="jest" />
import * as libNode from './lib-node';

describe('lib-node unit test.', () => {
    it('Should re-export the Node public API surface and install crypto.', () => {
        expect(libNode.Interpreter).toBeDefined();
        expect(libNode.Complex).toBeDefined();
        expect(globalThis.crypto).toBeDefined();
    });
});
