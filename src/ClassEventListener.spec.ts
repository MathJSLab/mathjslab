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
            expect(ClassEventListener.unparse(listener, Interpreter.Create())).toBe('event.listener ListenerObjectSpec.Changed');

            listener.enabled = false;
            expect(listener.enabled).toBe(false);

            ClassEventListener.delete(listener);
            expect(listener.enabled).toBe(false);
            expect(ClassEventListener.isValid(listener)).toBe(false);
        });
    });
});
