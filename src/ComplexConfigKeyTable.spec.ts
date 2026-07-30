/// <reference types="jest" />
import { Complex } from './Complex';
import { ComplexConfigKeyTable } from './ComplexConfigKeyTable';

describe('ComplexConfigKeyTable unit test.', () => {
    it('Should list every Complex configuration key.', () => {
        expect([...ComplexConfigKeyTable].sort()).toEqual(Object.keys(Complex.defaultSettings).sort());
    });
});
