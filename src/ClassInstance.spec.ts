/// <reference types="jest" />
import { Complex, type ComplexType } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { ClassDefinition } from './ClassDefinition';
import { ClassInstance } from './ClassInstance';
import { CharString } from './CharString';
import { MultiArray } from './MultiArray';
import { AST } from './AST';

import { parseClassDefinition as parseClass } from './ParserTestUtils';

const realNumber = (value: unknown): number => {
    if (!Complex.isInstanceOf(value)) {
        throw new Error('expected a Complex scalar.');
    }
    return Complex.realToNumber(value as ComplexType);
};

describe('ClassInstance', () => {
    describe('Behavior', () => {
        it('Should instantiate stored properties and skip dependent properties.', () => {
            const definition = ClassDefinition.create(
                parseClass(['classdef InstanceSpec', '  properties', '    x = 3;', '  end', '  properties (Dependent)', '    y', '  end', 'end'].join('\n')),
            );
            const instance = ClassInstance.instantiate(definition, () => Complex.create(3));

            expect(ClassInstance.isInstanceOf(instance)).toBe(true);
            expect(ClassInstance.hasProperty(instance, 'x')).toBe(true);
            expect(ClassInstance.hasProperty(instance, 'y')).toBe(false);
            expect(Complex.isInstanceOf(ClassInstance.getProperty(instance, 'x'))).toBe(true);
        });

        it('Should set declared properties and reject unknown properties.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef MutableSpec', '  properties', '    x = 0;', '  end', 'end'].join('\n')));
            const instance = ClassInstance.instantiate(definition, () => Complex.create(0));

            ClassInstance.setProperty(instance, 'x', Complex.create(10));
            Object.setPrototypeOf(instance.properties, { inherited: Complex.one() });

            expect(realNumber(ClassInstance.getProperty(instance, 'x'))).toBe(10);
            expect(ClassInstance.hasProperty(instance, 'inherited')).toBe(false);
            expect(() => ClassInstance.setProperty(instance, 'missing', Complex.create(1))).toThrow("unknown property 'missing' for class MutableSpec.");
        });

        it('Should reject non-runtime property values.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef RuntimePropertySpec', '  properties', '    x = 0;', '  end', 'end'].join('\n')));
            const instance = ClassInstance.instantiate(definition, () => Complex.create(0));

            expect(() => new ClassInstance(definition, { x: AST.nodeIdentifier('notRuntime') } as never)).toThrow("property 'x' is not a runtime value.");
            expect(() => ClassInstance.setProperty(instance, 'x', AST.nodeIdentifier('notRuntime') as never)).toThrow("property 'x' is not a runtime value.");
        });

        it('Should create type-compatible implicit property defaults.', () => {
            const definition = ClassDefinition.create(
                parseClass(['classdef TypedDefaultSpec', '  properties', '    name string', '    text char', '    items cell', '    values double', '  end', 'end'].join('\n')),
            );
            const instance = ClassInstance.instantiate(definition, () => Complex.create(0));

            expect(ClassInstance.getProperty(instance, 'name')).toEqual(CharString.create('', '"'));
            expect(ClassInstance.getProperty(instance, 'text')).toEqual(CharString.create('', "'"));
            expect(MultiArray.isInstanceOf(ClassInstance.getProperty(instance, 'items'))).toBe(true);
            expect((ClassInstance.getProperty(instance, 'items') as MultiArray).isCell).toBe(true);
            expect(MultiArray.isInstanceOf(ClassInstance.getProperty(instance, 'values'))).toBe(true);
            expect((ClassInstance.getProperty(instance, 'values') as MultiArray).isCell).toBe(false);
        });

        it('Should copy instance property tables.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef CopySpec', '  properties', '    x = 0;', '  end', 'end'].join('\n')));
            const instance = ClassInstance.instantiate(definition, () => Complex.create(0));
            const copy = ClassInstance.copy(instance);

            ClassInstance.setProperty(copy, 'x', Complex.create(5));

            expect(copy).not.toBe(instance);
            expect(realNumber(ClassInstance.getProperty(instance, 'x'))).toBe(0);
            expect(realNumber(ClassInstance.getProperty(copy, 'x'))).toBe(5);
        });

        it('Should pass handle class instances by reference to methods.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef HandleInstanceSpec < handle', '  properties', '    x = 0;', '  end', 'end'].join('\n')));
            const instance = ClassInstance.instantiate(definition, () => Complex.create(0));

            expect(ClassInstance.methodArgument(instance)).toBe(instance);
            expect(ClassInstance.copy(instance)).toBe(instance);
        });

        it('Should mark handle class instances as deleted.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef DeletedHandleSpec < handle', '  properties', '    x = 0;', '  end', 'end'].join('\n')));
            const instance = ClassInstance.instantiate(definition, () => Complex.create(0));

            expect(ClassInstance.isValid(instance)).toBe(true);
            ClassInstance.delete(instance);

            expect(instance.deleted).toBe(true);
            expect(ClassInstance.isValid(instance)).toBe(false);
            expect(() => ClassInstance.getProperty(instance, 'x')).toThrow('invalid or deleted object for class DeletedHandleSpec.');
            expect(() => ClassInstance.methodArgument(instance)).toThrow('invalid or deleted object for class DeletedHandleSpec.');
        });

        it('Should register class event listeners by event name.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef ListenerHandleSpec < handle', '  events', '    Changed', '  end', 'end'].join('\n')));
            const instance = ClassInstance.instantiate(definition, () => Complex.create(0));
            const callback = FunctionHandle.create('listenerCallback');

            const listener = ClassInstance.addListener(instance, 'Changed', callback);

            expect(listener.eventName).toBe('Changed');
            expect(listener.callback).toBe(callback);
            expect(ClassInstance.listenersFor(instance, 'Changed')).toEqual([listener]);
            expect(ClassInstance.listenersFor(instance, 'Missing')).toEqual([]);
        });
    });
});
