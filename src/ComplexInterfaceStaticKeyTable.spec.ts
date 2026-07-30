/// <reference types="jest" />
import { Complex } from './Complex';
import { ComplexInterfaceStaticKeyTable } from './ComplexInterfaceStaticKeyTable';

describe('ComplexInterfaceStaticKeyTable unit test.', () => {
    it('Should list static keys available on the Complex facade.', () => {
        expect(ComplexInterfaceStaticKeyTable).toEqual(expect.arrayContaining(['create', 'parse', 'add', 'mul', 'sin', 'gamma', 'mapFunction', 'twoArgFunction']));
        ComplexInterfaceStaticKeyTable.forEach((key) => expect(key in Complex).toBe(true));
    });
});
