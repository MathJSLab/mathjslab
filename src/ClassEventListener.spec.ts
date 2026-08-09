/// <reference types="jest" />
import { Complex } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { ClassDefinition } from './ClassDefinition';
import { ClassEventListener } from './ClassEventListener';
import { ClassInstance } from './ClassInstance';
import { Interpreter } from './Interpreter';

import { parseClassDefinition as parseClass } from './ParserTestUtils';

describe('ClassEventListener', () => {
    describe('Behavior', () => {
        it('Should create, disable, delete, and unparse event listeners.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef ListenerObjectSpec < handle', '  events', '    Changed', '  end', 'end'].join('\n')));
            const source = ClassInstance.instantiate(definition, () => Complex.create(0));
            const callback = FunctionHandle.create('listenerCallback');
            const listener = ClassEventListener.create(source, 'Changed', callback);

            expect(ClassEventListener.isInstanceOf(listener)).toBe(true);
            expect(ClassEventListener.isValid(listener)).toBe(true);
            expect(listener.enabled).toBe(true);
            expect(listener.recursive).toBe(false);
            expect(listener.notifying).toBe(false);
            expect(ClassEventListener.unparse(listener, Interpreter.Create())).toBe('event.listener ListenerObjectSpec.Changed');

            listener.enabled = false;
            expect(listener.enabled).toBe(false);
            listener.recursive = true;
            expect(listener.recursive).toBe(true);

            ClassEventListener.delete(listener);
            expect(listener.enabled).toBe(false);
            expect(ClassEventListener.isValid(listener)).toBe(false);
        });

        it('Should identify property listeners separately.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef PropListenerObjectSpec < handle', '  properties (SetObservable)', '    Value = 1;', '  end', 'end'].join('\n')));
            const source = ClassInstance.instantiate(definition, () => Complex.create(0));
            const callback = FunctionHandle.create('propertyListenerCallback');
            const listener = ClassEventListener.create(source, 'PostSet', callback, 'Value:PostSet', 'event.proplistener');

            expect(listener.kind).toBe('event.proplistener');
            expect(listener.eventName).toBe('PostSet');
            expect(listener.listenerKey).toBe('Value:PostSet');
            expect(ClassEventListener.unparse(listener, Interpreter.Create())).toBe('event.proplistener PropListenerObjectSpec.PostSet');
        });
    });
});
