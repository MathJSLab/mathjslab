/// <reference types="jest" />
import type { NodeBuiltInFunction, NodeInput, NodeReturnList } from './AST';
import { AST } from './AST';
import { Complex } from './Complex';
import { Callables } from './Callable';
import { CallFrame } from './CallFrame';
import { ClassDefinition } from './ClassDefinition';
import { ClassInstance } from './ClassInstance';
import { Context } from './Context';
import { EvalError, ReferenceError, SyntaxError, UndefinedReferenceError, CircularReferenceError } from './InterpreterError';
import { FunctionHandle } from './FunctionHandle';
import { MultiArray } from './MultiArray';
import { Scope } from './Scope';

import { parseClassDefinition as parseClass } from './ParserTestUtils';

type ContextReturnListHarness = {
    classMethodReceiverArgument(_instance: ClassInstance): NodeInput;
    expressionValues(_values: NodeInput[], _namePrefix: string): NodeInput[];
    returnExpressions(_values: unknown[], _namePrefix: string): NodeInput[];
    scalarArrayReturnExpression(_value: MultiArray, _name: string): NodeInput;
    unresolvedCallTargetExpression(_tree: unknown): NodeInput;
    valueReturnList(_values: NodeInput[]): NodeReturnList;
};

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

        it('Should expose structured MATLAB/Octave name precedence.', () => {
            const context = Context.create();
            const localFunction = AST.nodeFunctionDefinition(AST.nodeIdentifier('target'), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]));
            const importedFunction = AST.nodeFunctionDefinition(AST.nodeIdentifier('pkg.target'), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]));
            const wildcardFunction = AST.nodeFunctionDefinition(AST.nodeIdentifier('pkg.wild.wildonly'), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]));
            const importedClass = ClassDefinition.create(parseClass(['classdef pkg.ImportedTarget', 'end'].join('\n')));

            context.assignFunction('target', localFunction);
            context.assignFunction('pkg.target', importedFunction);
            context.assignFunction('pkg.wild.wildonly', wildcardFunction);
            context.defineClassDefinition(importedClass);
            context.defineBuiltInFunction('target', () => Complex.create(99));

            expect(context.resolveSymbol('target')?.kind).toBe('function');
            expect(context.resolveSymbol('target')?.source).toBe('local');

            context.assignName('target', Complex.create(7));
            const variable = context.resolveSymbol('target');
            expect(variable?.kind).toBe('variable');
            expect(Complex.realToNumber(variable?.entry?.node)).toBe(7);

            context.currentScope.removeName('target');
            context.currentScope.removeFunction('target');
            context.defineImport('pkg.ImportedTarget');
            expect(context.resolveSymbol('ImportedTarget')?.kind).toBe('class');
            expect(context.resolveSymbol('ImportedTarget')?.resolvedName).toBe('pkg.ImportedTarget');

            context.defineImport('pkg.target');
            expect(context.resolveSymbol('target')?.kind).toBe('function');
            expect(context.resolveSymbol('target')?.resolvedName).toBe('pkg.target');

            context.defineImport('pkg.wild.*');
            expect(context.resolveSymbol('wildonly')?.resolvedName).toBe('pkg.wild.wildonly');
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

        it('Should classify call dispatch before applying calls or indexing.', () => {
            const context = Context.create();
            const parent = AST.nodeIndexExpr(AST.nodeIdentifier('target'), AST.nodeList([]), '()');
            const classDefinition = ClassDefinition.create(parseClass(['classdef DispatchContextClass', 'end'].join('\n')));
            const receiver = new ClassInstance(classDefinition);

            context.defineBuiltInFunction('sin', () => Complex.create(0));

            expect(context.resolveCallDispatch(FunctionHandle.create('sin'), parent).kind).toBe('callable');
            expect(context.resolveCallDispatch(classDefinition, parent).kind).toBe('constructor');
            expect(context.resolveCallDispatch(AST.nodeIdentifier('read'), parent, [receiver]).kind).toBe('functional-class-method');
            expect(context.resolveCallDispatch(AST.nodeIdentifier('missing'), parent, [Complex.create(1)]).kind).toBe('undefined-function');
            expect(context.resolveCallDispatch(Complex.create(1), parent).kind).toBe('indexing');
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

        it('Should reject non-expression values in lazy return lists.', () => {
            const context = Context.create();
            const returnList = (context as unknown as ContextReturnListHarness).valueReturnList([AST.nodeReturn()]);

            expect(AST.isNodeReturnList(returnList)).toBe(true);
            expect(() => returnList.handler(1)).toThrow("Return value 'out1' is not an expression.");
        });

        it('Should reject non-expression values in expanded return arrays.', () => {
            const context = Context.create() as unknown as ContextReturnListHarness;

            expect(() => context.returnExpressions([undefined], 'out')).toThrow("Return value 'out1' is not an expression.");
        });

        it('Should reject non-expression values when reducing scalar return arrays.', () => {
            const context = Context.create() as unknown as ContextReturnListHarness;
            const result = new MultiArray([1, 1]);
            result.array[0][0] = AST.nodeReturn() as unknown as (typeof result.array)[0][0];

            expect(() => context.scalarArrayReturnExpression(result, 'ans')).toThrow("Return value 'ans' is not an expression.");
        });

        it('Should reject non-expression values in expanded argument lists.', () => {
            const context = Context.create() as unknown as ContextReturnListHarness;

            expect(() => context.expressionValues([AST.nodeReturn()], 'arg')).toThrow("Argument value 'arg1' is not an expression.");
        });

        it('Should reject non-expression values resolved from identifiers.', () => {
            const context = Context.create();
            context.assignName('bad', AST.nodeReturn());

            expect(() => context.resolveIdentifier(AST.nodeIdentifier('bad'), context.currentScope)).toThrow("Identifier value 'bad' is not an expression.");
        });

        it('Should preserve unresolved identifiers as call targets only.', () => {
            const context = Context.create();
            const harness = context as unknown as ContextReturnListHarness;
            const callTarget = AST.nodeIdentifier('missingCallTarget');
            const parent = AST.nodeIndexExpr(callTarget, AST.nodeListFirst(), '()');
            callTarget.parent = parent;

            expect(harness.unresolvedCallTargetExpression(callTarget)).toBe(callTarget);
            expect(context.resolveIdentifier(callTarget, context.currentScope)).toBe(callTarget);
            expect(() => harness.unresolvedCallTargetExpression(AST.nodeReturn())).toThrow('invalid unresolved call target.');
        });

        it('Should validate implicit class method receiver arguments.', () => {
            const context = Context.create() as unknown as ContextReturnListHarness;
            const definition = ClassDefinition.create(parseClass(['classdef ContextReceiverValue', 'end'].join('\n')));
            const instance = new ClassInstance(definition);

            expect(ClassInstance.isInstanceOf(context.classMethodReceiverArgument(instance))).toBe(true);
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
