/// <reference types="jest" />
import type { NodeBuiltInFunction, NodeClassDef } from './AST';
import { AST, Complex } from './AST';
import { Callables } from './Callable';
import { CallFrame } from './CallFrame';
import { ClassDefinition } from './ClassDefinition';
import { Context } from './Context';
import { EvalError, ReferenceError, SyntaxError, UndefinedReferenceError, CircularReferenceError } from './InterpreterError';
import { Interpreter } from './Interpreter';
import { Scope } from './Scope';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;

describe('Context', () => {
    describe('Construction', () => {
        it('Should initialize a fresh global scope and frame.', () => {
            const context = Context.create();

            expect(context.globalScope).toBeDefined();
            expect(context.callStack).toHaveLength(1);
            expect(context.currentFrame?.scope).toBe(context.globalScope);
            expect(context.currentScope).toBe(context.globalScope);
            expect(context.allowForwardReference).toBe(true);
            expect(context.globalNameSet.size).toBe(0);
        });

        it('Should load a provided scope and call stack.', () => {
            const context = Context.create();
            const scope = Scope.create();
            const frame = new CallFrame(scope, undefined, undefined, 'caller');

            context.globalNameSet.add('x');
            context.loadContext(scope, [frame]);

            expect(context.globalScope).toBe(scope);
            expect(context.callStack).toEqual([frame]);
            expect(context.currentFrame).toBe(frame);
            expect(context.globalNameSet.size).toBe(0);
        });
    });

    describe('Behavior', () => {
        it('Should resolve names and functions from the current scope.', () => {
            const context = Context.create();
            const func = AST.nodeFunctionDefinition(AST.nodeIdentifier('f'), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]));

            context.assignName('x', Complex.create(4));
            context.assignFunction('f', func);

            expect(Complex.realToNumber(context.resolveName('x')?.node)).toBe(4);
            expect(context.resolveFunction('f')).toBe(func);
        });

        it('Should resolve aliases before built-in lookup.', () => {
            const context = Context.create();

            context.defineBuiltInFunction('cosine', () => Complex.create(1));
            context.setAliasNameTable({ cosine: /^cos$/ });

            expect(context.aliasNameFunction('cos')).toBe('cosine');
            expect(context.resolveFunction('cos')?.id).toBe('cosine');
            expect(context.builtInFunctionList).toEqual(['cosine']);

            context.setAliasNameTable();
            expect(context.aliasNameFunction('cos')).toBe('cos');
        });

        it('Should create child scopes with the current scope as default parent.', () => {
            const context = Context.create();
            const child = context.createChildScope();

            expect(child.parent).toBe(context.currentScope);
        });

        it('Should define and resolve class definitions.', () => {
            const context = Context.create();
            const definition = ClassDefinition.create(parseClass(['classdef ContextClass', 'end'].join('\n')));

            expect(context.resolveClassDefinition('ContextClass')).toBeUndefined();
            expect(context.defineClassDefinition(definition)).toBe(definition);
            context.assignName('notAClass', Complex.create(1));

            expect(context.resolveClassDefinition('ContextClass')).toBe(definition);
            expect(context.resolveClassDefinition('notAClass')).toBeUndefined();
        });

        it('Should push and pop requested output counts and forward-reference targets.', () => {
            const context = Context.create();

            expect(context.requestedOutputCount).toBe(1);

            context.pushRequestedOutputCount(2);
            context.pushRequestedOutputCount(3);

            expect(context.requestedOutputCount).toBe(3);
            expect(context.popRequestedOutputCount()).toBe(3);
            expect(context.requestedOutputCount).toBe(2);
            expect(context.popRequestedOutputCount()).toBe(2);
            expect(context.requestedOutputCount).toBe(1);

            context.pushForwardReferenceTargets(['A', 'B']);
            expect(context.popForwardReferenceTargets()).toEqual(['A', 'B']);
            expect(context.popForwardReferenceTargets()).toBeUndefined();
        });

        it('Should link pushed call frames to their caller.', () => {
            const context = Context.create();
            const caller = context.currentFrame;
            const callee = new CallFrame(Scope.create(), undefined, undefined, 'callee');

            context.pushCallStackFrame(callee);

            expect(callee.parentFrame).toBe(caller);
            expect(context.currentFrame).toBe(callee);
            expect(context.popCallStackFrame()).toBe(callee);
            expect(context.currentFrame).toBe(caller);
        });

        it('Should throw typed interpreter errors with stack snapshots.', () => {
            const context = Context.create();
            const builtin = { type: 'BUILTIN', id: 'boom', mapper: false, ev: [], func: () => undefined } as NodeBuiltInFunction;
            const callSite = AST.nodeIdentifier('boom');
            callSite.start = { line: 5, column: 9 } as typeof callSite.start;

            context.pushCallStackFrame(new CallFrame(context.currentScope, Callables.builtin(builtin), callSite));

            expect(() => context.throwEvalError('bad')).toThrow(EvalError);
            expect(() => context.throwReferenceError('missing')).toThrow(ReferenceError);
            expect(() => context.throwUndefinedReferenceError('x')).toThrow(UndefinedReferenceError);
            expect(() => context.throwCircularReferenceError(['A', 'B', 'A'])).toThrow(CircularReferenceError);
            expect(() => context.throwSyntaxError('syntax')).toThrow(SyntaxError);

            try {
                context.throwEvalError('bad');
            } catch (error: unknown) {
                /* eslint-disable-next-line   jest/no-conditional-expect */
                expect((error as EvalError).format()).toBe('Error: bad\nError in boom (line 5, column 9)');
            }
        });
    });
});
