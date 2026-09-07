/// <reference types="jest" />
import * as libNode from '../../src/lib-node.es2015';

describe('lib-node.es2015 unit test.', () => {
    it('Should re-export the Node ES2015 public API surface and install crypto.', () => {
        expect(libNode.Interpreter).toBeDefined();
        expect(libNode.Complex).toBeDefined();
        expect(globalThis.crypto).toBeDefined();
    });
});
