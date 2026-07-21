/// <reference types="jest" />
import path from 'node:path';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Definition', () => {
        it(`${unitName} should be defined.`, () => {
            expect(Structure).toBeDefined();
            expect(Structure.isInstanceOf(new Structure({}))).toBe(true);
        });
    });

    describe('Fields', () => {
        it('Should create nested field branches from a field path.', () => {
            const structure = new Structure(['outer', 'inner']);

            expect(Structure.getField(structure, ['outer', 'inner'])).toEqual(MultiArray.emptyArray());
            expect(() => Structure.getField(structure, ['outer', 'missing'])).toThrow('value cannot be indexed with .');
        });

        it('Should set and retrieve nested fields.', () => {
            const structure = new Structure({});
            const value = Complex.create(42);

            Structure.setField(structure, ['a', 'b'], value);

            expect(Structure.getField(structure, ['a', 'b'])).toEqual(value);
        });

        it('Should set nested fields through intermediate structure arrays.', () => {
            const structure = new Structure({
                branch: new MultiArray([1, 2], (row, column) => new Structure({ id: Complex.create(row + column + 1) })),
            });
            const value = Complex.create(42);

            Structure.setNewField(structure, ['branch', 'leaf'], value);

            const branch = structure.field.branch as MultiArray;
            expect(Structure.getField(branch.array[0][0], ['leaf'])).toEqual(value);
            expect(Structure.getField(branch.array[0][1], ['leaf'])).toEqual(value);
            expect(Structure.fieldNames(branch)).toEqual(['id', 'leaf']);
        });

        it('Should reject nested field assignment through non-structure intermediates.', () => {
            const structure = new Structure({ branch: Complex.one() });

            expect(() => Structure.setNewField(structure, ['branch', 'leaf'], Complex.two())).toThrow('value cannot be indexed with .');
        });

        it('Should add empty fields to every structure element in a structure array.', () => {
            const array = new MultiArray([2, 1], (row) => new Structure({ id: Complex.create(row + 1) }));

            Structure.setEmptyField(array, 'name');

            expect(Structure.getField(array.array[0][0], ['name'])).toEqual(MultiArray.emptyArray());
            expect(Structure.getField(array.array[1][0], ['name'])).toEqual(MultiArray.emptyArray());
        });

        it('Should expose structure array elements, field names, and field tests.', () => {
            const scalar = new Structure({ z: Complex.one(), a: Complex.two() });
            const array = new MultiArray([1, 2], (row, column) => new Structure({ a: Complex.create(row + column), z: Complex.create(row + column + 1) }));
            const mixed = MultiArray.firstRow([new Structure({ a: Complex.one() }), Complex.one()]);

            expect(Structure.structureElements(scalar)).toEqual([scalar]);
            expect(Structure.structureElements(array)).toHaveLength(2);
            expect(Structure.structureElements(mixed)).toEqual([]);
            expect(Structure.isStructure(array)).toBe(true);
            expect(Structure.isStructure(mixed)).toBe(false);
            expect(Structure.fieldNames(scalar)).toEqual(['a', 'z']);
            expect(Structure.fieldNames(array)).toEqual(['a', 'z']);
            expect(Structure.hasField(array, 'a')).toBe(true);
            expect(Structure.hasField(array, 'missing')).toBe(false);
        });
    });

    describe('Copying and logical conversion', () => {
        it('Should deep-copy fields.', () => {
            const source = new Structure({ value: Complex.create(1) });
            const constructed = new Structure({ value: source.field.value });
            const copy = source.copy();

            expect(constructed.field.value).not.toBe(source.field.value);
            expect(copy).not.toBe(source);
            expect(copy.field.value).not.toBe(source.field.value);
            expect((source.field.value as ReturnType<typeof Complex.create>).re.toString()).toBe('1');
        });

        it('Should treat empty structures as false and structures with fields as true.', () => {
            expect(Structure.toLogical(new Structure({})).re.toString()).toBe('0');
            expect(Structure.toLogical(new Structure({ value: Complex.create(1) })).re.toString()).toBe('1');
        });
    });
});
