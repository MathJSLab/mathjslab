import { CharString } from './CharString';
import { Complex, type ComplexType } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { MultiArray, type ElementType } from './MultiArray';
import { Structure, type StructureFieldValue } from './Structure';

export const runtimeValueCodecVersion = 1 as const;

export type EncodedRuntimeValue =
    | { readonly type: 'complex'; readonly real: string; readonly imaginary: string; readonly numericType: number }
    | { readonly type: 'char'; readonly value: string; readonly quote: "'" | '"' }
    | {
          readonly type: 'array';
          readonly dimensions: readonly number[];
          readonly cell: boolean;
          readonly values?: readonly EncodedRuntimeValue[];
          readonly packed?: {
              readonly real: Float64Array;
              readonly imaginary: Float64Array;
              readonly numericType: Uint8Array;
          };
          readonly emptyStructureFields?: readonly string[];
      }
    | { readonly type: 'structure'; readonly fields: Readonly<Record<string, EncodedRuntimeValue>> };

export class RuntimeValueCodecError extends TypeError {
    public readonly code = 'MATHJSLAB_VALUE_NOT_SERIALIZABLE';

    public constructor(message: string) {
        super(message);
        this.name = 'RuntimeValueCodecError';
    }
}

const numericPart = (value: unknown): string => {
    if (value && typeof value === 'object' && typeof Reflect.get(value, 'toString') === 'function') return String(Reflect.apply(Reflect.get(value, 'toString'), value, []));
    return String(value);
};

const encodeValue = (value: ElementType, active: Set<object>): EncodedRuntimeValue => {
    if (Complex.isInstanceOf(value)) {
        const candidate = value as ComplexType & { re: unknown; im: unknown; type: number };
        return { type: 'complex', real: numericPart(candidate.re), imaginary: numericPart(candidate.im), numericType: candidate.type };
    }
    if (CharString.isInstanceOf(value)) return { type: 'char', value: value.str, quote: value.quote };
    if (FunctionHandle.isInstanceOf(value)) throw new RuntimeValueCodecError('Function handles cannot cross a runtime boundary.');
    if (Structure.isInstanceOf(value)) {
        if (active.has(value)) throw new RuntimeValueCodecError('Cyclic structures cannot cross a runtime boundary.');
        active.add(value);
        const fields = Object.fromEntries(Object.entries(value.field).map(([name, fieldValue]) => [name, encodeValue(fieldValue, active)]));
        active.delete(value);
        return { type: 'structure', fields };
    }
    if (MultiArray.isInstanceOf(value)) {
        if (active.has(value)) throw new RuntimeValueCodecError('Cyclic arrays cannot cross a runtime boundary.');
        active.add(value);
        const flat = value.array.flat();
        const numeric = !value.isCell && flat.every(Complex.isInstanceOf);
        const packed = numeric
            ? {
                  real: Float64Array.from(flat as ComplexType[], (item) => Complex.realToNumber(item)),
                  imaginary: Float64Array.from(flat as ComplexType[], (item) => Complex.imagToNumber(item)),
                  numericType: Uint8Array.from(flat as Array<ComplexType & { type: number }>, (item) => item.type),
              }
            : undefined;
        const values = numeric ? undefined : flat.map((item) => encodeValue(item, active));
        active.delete(value);
        return {
            type: 'array',
            dimensions: value.dimension.slice(),
            cell: value.isCell,
            ...(packed ? { packed } : { values: values! }),
            ...(value.emptyStructureFields ? { emptyStructureFields: value.emptyStructureFields.slice() } : {}),
        };
    }
    throw new RuntimeValueCodecError(`Unsupported runtime value: ${Object.prototype.toString.call(value)}`);
};

const decodeValue = (value: EncodedRuntimeValue): ElementType => {
    switch (value.type) {
        case 'complex':
            return Complex.create(value.real, value.imaginary, value.numericType);
        case 'char':
            return new CharString(value.value, value.quote);
        case 'structure':
            return new Structure(Object.fromEntries(Object.entries(value.fields).map(([name, fieldValue]) => [name, decodeValue(fieldValue)])) as Record<string, StructureFieldValue>);
        case 'array': {
            const rows = value.dimensions[0] ?? 0;
            const columns = value.dimensions[1] ?? 0;
            let index = 0;
            const physicalRows = rows * value.dimensions.slice(2).reduce((product, dimension) => product * dimension, 1);
            const data = Array.from({ length: physicalRows }, () =>
                Array.from({ length: columns }, () => {
                    if (value.packed) {
                        const item = Complex.create(value.packed.real[index]!, value.packed.imaginary[index]!, value.packed.numericType[index]!);
                        index++;
                        return item;
                    }
                    return decodeValue(value.values![index++]!);
                }),
            );
            const result = new MultiArray(value.dimensions.slice() as number[], data, value.cell);
            if (value.emptyStructureFields) result.emptyStructureFields = value.emptyStructureFields.slice();
            return result;
        }
    }
};

export const RuntimeValueCodec = {
    encode: (value: ElementType): EncodedRuntimeValue => encodeValue(value, new Set()),
    decode: (value: EncodedRuntimeValue): ElementType => decodeValue(value),
    transferables: (value: EncodedRuntimeValue): ArrayBuffer[] => {
        const result: ArrayBuffer[] = [];
        const visit = (item: EncodedRuntimeValue): void => {
            if (item.type === 'array') {
                if (item.packed) result.push(item.packed.real.buffer as ArrayBuffer, item.packed.imaginary.buffer as ArrayBuffer, item.packed.numericType.buffer as ArrayBuffer);
                item.values?.forEach(visit);
            } else if (item.type === 'structure') Object.values(item.fields).forEach(visit);
        };
        visit(value);
        return result;
    },
};
