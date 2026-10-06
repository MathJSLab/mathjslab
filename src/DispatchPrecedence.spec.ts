import { AST } from './AST';
import { ClassDefinition } from './ClassDefinition';
import { callDispatchPrecedence, Context, symbolResolutionPrecedence } from './Context';
import { Interpreter } from './Interpreter';
import { parseClassDefinition } from './ParserTestUtils';

describe('Explicit symbol and call dispatch precedence', () => {
    const functionDefinition = (name: string) => AST.nodeFunctionDefinition(AST.nodeIdentifier(name), AST.nodeListFirst(), AST.nodeListFirst(), AST.nodeListFirst(), AST.nodeListFirst());

    it('Should expose the complete symbol-resolution order.', () => {
        expect(symbolResolutionPrecedence).toEqual(['variable', 'registered-class', 'scoped-function', 'provider-function', 'provider-class', 'import', 'builtin']);
    });

    it('Should expose the call/index dispatch order.', () => {
        expect(callDispatchPrecedence).toEqual([
            'callable',
            'bound-method',
            'bound-method-array',
            'static-method',
            'empty-method',
            'constructor',
            'functional-class-method',
            'undefined-function',
            'indexing',
        ]);
    });

    it('Should report the winning tier across variable, class, function, import, and builtin collisions.', () => {
        const context = Context.create();
        const localFunction = functionDefinition('Target');
        const registeredClass = ClassDefinition.create(parseClassDefinition(['classdef Target', 'end'].join('\n')));
        const importedFunction = functionDefinition('pkg.Target');

        context.defineBuiltInFunction('Target', () => AST.nodeNumber('99'));
        expect(context.resolveSymbol('Target')?.tier).toBe('builtin');

        context.assignFunction('Target', localFunction);
        expect(context.resolveSymbol('Target')?.tier).toBe('scoped-function');

        context.defineClassDefinition(registeredClass);
        expect(context.resolveSymbol('Target')?.tier).toBe('registered-class');

        context.assignName('Target', AST.nodeNumber('7'));
        expect(context.resolveSymbol('Target')?.tier).toBe('variable');

        context.currentScope.removeName('Target');
        context.currentScope.removeFunction('Target');
        context.assignFunction('pkg.Target', importedFunction);
        context.defineImport('pkg.Target');
        const imported = context.resolveSymbol('Target', context.currentScope, { classes: false });
        expect(imported?.tier).toBe('import');
        expect(imported?.importKind).toBe('explicit');

        context.assignFunction('pkg.wild.Other', functionDefinition('pkg.wild.Other'));
        context.defineImport('pkg.wild.*');
        const wildcard = context.resolveSymbol('Other', context.currentScope, { classes: false });
        expect(wildcard?.tier).toBe('import');
        expect(wildcard?.importKind).toBe('wildcard');
    });

    it('Should distinguish source-provider functions and classes.', () => {
        const functionInterpreter = Interpreter.Create({
            functionSourceTable: {
                Provided: ['function y = Provided()', '  y = 1;', 'end'].join('\n'),
            },
            classSourceTable: {
                Provided: ['classdef Provided', 'end'].join('\n'),
            },
        });
        const classInterpreter = Interpreter.Create({
            classSourceTable: {
                ProvidedClass: ['classdef ProvidedClass', 'end'].join('\n'),
            },
        });

        expect(functionInterpreter.context.resolveSymbol('Provided')?.tier).toBe('provider-function');
        expect(classInterpreter.context.resolveSymbol('ProvidedClass')?.tier).toBe('provider-class');
    });
});
