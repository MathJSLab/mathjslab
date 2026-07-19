/// <reference types="jest" />
import type { NodeClassDef } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { ClassDefinition } from './ClassDefinition';
import { ClassEventData } from './ClassEventData';
import { ClassInstance } from './ClassInstance';
import { ClassPropertyEvent } from './ClassPropertyEvent';
import { Interpreter } from './Interpreter';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;

describe('ClassPropertyEvent', () => {
    describe('Behavior', () => {
        it('Should expose property event source, name, and affected object.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef PropertyEventSourceSpec < handle', '  properties (SetObservable)', '    Value = 0;', '  end', 'end'].join('\n')));
            const source = ClassInstance.instantiate(definition, () => Complex.create(0));
            const eventData = ClassPropertyEvent.create(source, 'Value');

            expect(ClassPropertyEvent.isInstanceOf(eventData)).toBe(true);
            expect(ClassEventData.isInstanceOf(eventData)).toBe(true);
            expect(ClassPropertyEvent.getProperty(eventData, 'Source')).toBe(source);
            expect(ClassPropertyEvent.getProperty(eventData, 'AffectedObject')).toBe(source);
            expect((ClassPropertyEvent.getProperty(eventData, 'EventName') as CharString).str).toBe('Value');
            expect((ClassPropertyEvent.getProperty(eventData, 'PropertyName') as CharString).str).toBe('Value');
            expect(ClassPropertyEvent.getProperty(eventData, 'Missing')).toBeUndefined();
            expect(ClassPropertyEvent.unparse(eventData, Interpreter.Create())).toBe('event.PropertyEvent PropertyEventSourceSpec.Value');
        });
    });
});
