/// <reference types="jest" />
import { Complex, type ComplexType, type RealType } from './Complex';
import { ComplexConfigKeyTable as directConfigKeys } from './ComplexConfigKeyTable';
import { ComplexInterfaceKeyTable as directValueKeys } from './ComplexInterfaceKeyTable';
import { ComplexInterfaceStaticKeyTable as directStaticKeys } from './ComplexInterfaceStaticKeyTable';
import {
    applyFunctionFactory,
    ComplexConfigKeyTable,
    ComplexInterfaceKeyTable,
    ComplexInterfaceStaticKeyTable,
    mapFunctionFactory,
    moduloName,
    numberClass,
    roundingMode,
    roundingName,
    twoArgFunctionFactory,
    type ComplexInterfaceStatic,
} from './ComplexInterface';

describe('ComplexInterface unit test.', () => {
    it('Should re-export generated key tables from the interface module.', () => {
        expect(ComplexConfigKeyTable).toBe(directConfigKeys);
        expect(ComplexInterfaceKeyTable).toBe(directValueKeys);
        expect(ComplexInterfaceStaticKeyTable).toBe(directStaticKeys);
    });

    it('Should expose numeric configuration lookup tables.', () => {
        expect(roundingMode.ROUND_HALF_EVEN).toBe(6);
        expect(roundingName[roundingMode.ROUND_FLOOR as number]).toBe('floor');
        expect(moduloName[roundingMode.EUCLID as number]).toBe('euclid');
        expect(numberClass.LOGICAL).toBe(Complex.LOGICAL);
        expect(numberClass.REAL).toBe(Complex.REAL);
        expect(numberClass.COMPLEX).toBe(Complex.COMPLEX);
    });

    it('Should create reusable real-number handlers.', () => {
        const real = {
            trunc: Math.trunc,
            ceil: Math.ceil,
            floor: Math.floor,
            round: Math.round,
            sign: Math.sign,
            create: (value: number): number => value,
        };
        const handlers = applyFunctionFactory<number>(real);

        expect(handlers.fix(-1.8)).toBe(-1);
        expect(handlers.ceil(1.2)).toBe(2);
        expect(handlers.floor(1.8)).toBe(1);
        expect(handlers.sign(-5)).toBe(-1);
    });

    it('Should create mapper and two-argument handler tables for Complex.', () => {
        const complexCtor = Complex as unknown as ComplexInterfaceStatic<RealType, ComplexType>;
        const map = mapFunctionFactory(complexCtor);
        const twoArg = twoArgFunctionFactory(complexCtor);

        expect(Complex.realToNumber(map.real(Complex.create(2, 3)))).toBe(2);
        expect(Complex.realToNumber(map.abs(Complex.create(3, 4)))).toBe(5);
        expect(Complex.realToNumber(twoArg.power(Complex.create(2), Complex.create(3)))).toBe(8);
        expect(Complex.realToNumber(twoArg.hypot(Complex.create(3), Complex.create(4)))).toBe(5);
    });
});
