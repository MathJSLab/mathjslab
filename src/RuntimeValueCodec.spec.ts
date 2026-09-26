import { CharString } from './CharString';
import { Complex } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { MultiArray } from './MultiArray';
import { RuntimeValueCodec, RuntimeValueCodecError } from './RuntimeValueCodec';
import { Structure } from './Structure';

describe('RuntimeValueCodec', () => {
    test('round-trips complex scalars, strings, arrays, cells, and structures', () => {
        const value = new MultiArray(
            [1, 4],
            [[Complex.create(2, 3), new CharString('text', "'"), new MultiArray([1, 1], [[Complex.create(7)]], true), new Structure({ answer: Complex.create(42) })]],
            true,
        );

        const decoded = RuntimeValueCodec.decode(RuntimeValueCodec.encode(value)) as MultiArray;

        expect(decoded).toBeInstanceOf(MultiArray);
        expect(decoded.dimension).toEqual([1, 4]);
        expect(decoded.isCell).toBe(true);
        expect(Complex.realToNumber(decoded.array[0][0] as never)).toBe(2);
        expect((decoded.array[0][1] as CharString).str).toBe('text');
        expect(decoded.array[0][3]).toBeInstanceOf(Structure);
    });

    test('rejects function handles explicitly', () => {
        expect(() => RuntimeValueCodec.encode(FunctionHandle.create('sin'))).toThrow(RuntimeValueCodecError);
    });

    test('packs dense numeric arrays into transferable buffers', () => {
        const value = new MultiArray([1, 3], [[Complex.create(1), Complex.create(2, 3), Complex.create(4)]]);
        const encoded = RuntimeValueCodec.encode(value);
        expect(encoded).toMatchObject({ type: 'array', packed: { real: new Float64Array([1, 2, 4]), imaginary: new Float64Array([0, 3, 0]) } });
        expect(RuntimeValueCodec.transferables(encoded)).toHaveLength(3);
        expect(RuntimeValueCodec.decode(encoded)).toBeInstanceOf(MultiArray);
    });
});
