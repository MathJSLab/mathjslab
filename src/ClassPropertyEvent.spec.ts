/// <reference types="jest" />
import { CharString } from './CharString';
import { Complex } from './Complex';
import { ClassDefinition } from './ClassDefinition';
import { ClassEventData } from './ClassEventData';
import { ClassInstance } from './ClassInstance';
import { ClassMetaProperty } from './ClassMeta';
import { ClassPropertyEvent } from './ClassPropertyEvent';
import { Interpreter } from './Interpreter';

import { parseClassDefinition as parseClass } from './ParserTestUtils';

describe('ClassPropertyEvent', () => {
    describe('Behavior', () => {
        it('Should expose property event source, name, and affected object.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef PropertyEventSourceSpec < handle', '  properties (SetObservable)', '    Value = 0;', '  end', 'end'].join('\n')));
            const source = ClassInstance.instantiate(definition, () => Complex.create(0));
            const metaProperty = ClassMetaProperty.create(definition.properties[0]);
            const eventData = ClassPropertyEvent.create(source, 'Value', 'PostSet', metaProperty);

            expect(ClassPropertyEvent.isInstanceOf(eventData)).toBe(true);
            expect(ClassEventData.isInstanceOf(eventData)).toBe(true);
            expect(ClassPropertyEvent.getProperty(eventData, 'Source')).toBe(metaProperty);
            expect(ClassPropertyEvent.getProperty(eventData, 'AffectedObject')).toBe(source);
            expect((ClassPropertyEvent.getProperty(eventData, 'EventName') as CharString).str).toBe('PostSet');
            expect((ClassPropertyEvent.getProperty(eventData, 'PropertyName') as CharString).str).toBe('Value');
            expect(ClassPropertyEvent.getProperty(eventData, 'Missing')).toBeUndefined();
            expect(ClassPropertyEvent.unparse(eventData, Interpreter.Create())).toBe('event.PropertyEvent PropertyEventSourceSpec.Value');
        });
    });
});
