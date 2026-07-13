/// <reference types="jest" />
import type { NodeClassDef } from './AST';
import { CharString, Complex } from './AST';
import { ClassDefinition } from './ClassDefinition';
import { ClassEventData } from './ClassEventData';
import { ClassInstance } from './ClassInstance';
import { Interpreter } from './Interpreter';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;

describe('ClassEventData', () => {
    describe('Behavior', () => {
        it('Should expose event source and name.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef EventDataSourceSpec < handle', '  events', '    Changed', '  end', 'end'].join('\n')));
            const source = ClassInstance.instantiate(definition, () => Complex.create(0));
            const eventData = ClassEventData.create(source, 'Changed');

            expect(ClassEventData.isInstanceOf(eventData)).toBe(true);
            expect(ClassEventData.getProperty(eventData, 'Source')).toBe(source);
            expect((ClassEventData.getProperty(eventData, 'EventName') as CharString).str).toBe('Changed');
            expect(ClassEventData.getProperty(eventData, 'Missing')).toBeUndefined();
            expect(ClassEventData.unparse(eventData, Interpreter.Create())).toBe('event.EventData EventDataSourceSpec.Changed');
        });
    });
});
