/// <reference types="jest" />
import { Complex } from './Complex';
import { ComplexInterfaceKeyTable } from './ComplexInterfaceKeyTable';

describe('ComplexInterfaceKeyTable unit test.', () => {
    it('Should list the runtime keys available on Complex values.', () => {
        const value = Complex.create(1, 2);

        expect(ComplexInterfaceKeyTable).toEqual(['re', 'im', 'type', 'parent', 'copy', 'toString', 'toLogical']);
        ComplexInterfaceKeyTable.forEach((key) => expect(key in value).toBe(true));
    });
});
