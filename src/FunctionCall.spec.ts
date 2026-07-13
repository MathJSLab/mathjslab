/// <reference types="jest" />
import path from 'node:path';
import { AST, Complex, MultiArray } from './AST';
import type { NodeExpr, NodeFunctionDefinition } from './AST';
import { FunctionCall } from './FunctionCall';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const functionDefinition = (parameterNames: string[], returnNames: string[]): NodeFunctionDefinition =>
    ({
        type: 'FCNDEF',
        id: 'f',
        mapper: false,
        ev: [],
        func: () => undefined,
        return: AST.nodeList(returnNames.map((name) => AST.nodeIdentifier(name))),
        parameter: AST.nodeList(parameterNames.map((name) => AST.nodeIdentifier(name))),
        arguments: AST.nodeList([]),
        statements: AST.nodeList([]),
        omitAnswer: false,
        omitOutput: false,
    }) as NodeFunctionDefinition;

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        AST.reload();
    });

    describe('Behavior', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(FunctionCall).toBeDefined();
            expect(FunctionCall.inputLayout).toBeDefined();
            expect(FunctionCall.returnLayout).toBeDefined();
        });

        it('Should compute input and return layouts.', () => {
            const func = functionDefinition(['x', 'opts', 'varargin'], ['a', 'varargout']);

            expect(FunctionCall.inputLayout(func, new Set(['opts']))).toMatchObject({
                hasVarargin: true,
                fixedParamCount: 2,
                positionalParamCount: 1,
            });
            expect(FunctionCall.returnLayout(func)).toMatchObject({
                hasVarargout: true,
                fixedReturnCount: 1,
                names: ['a', 'varargout'],
            });
        });

        it('Should validate variadic and fixed arity.', () => {
            expect(() =>
                FunctionCall.validateLambdaInputArity(1, false, 2, (message) => {
                    throw new Error(message);
                }),
            ).toThrow('invalid number of arguments.');
            expect(() =>
                FunctionCall.validateLambdaInputArity(3, true, 2, (message) => {
                    throw new Error(message);
                }),
            ).not.toThrow();

            const func = functionDefinition(['x'], ['y']);
            expect(() =>
                FunctionCall.validateFunctionInputArity(func, 2, false, 1, 1, (message) => {
                    throw new Error(message);
                }),
            ).toThrow('invalid number of arguments in function f');
        });

        it('Should prepare function call layouts, defaults and split arguments.', () => {
            const func = functionDefinition(['x', 'opts', 'varargin'], ['y', 'varargout']);
            const namedValue = Complex.create(2);
            const args = [Complex.create(1), AST.nodeOperation('=', AST.nodeIdentifier('Scale'), namedValue)];
            const defaults = new Map<string, NodeExpr>();

            const prepared = FunctionCall.prepareFunctionCall(func, args, 2, {
                nameValueParameters: () => new Set(['opts']),
                splitCallArguments: () => ({ positional: [args[0]], named: new Map([['Scale', namedValue]]) }),
                inputDefaults: () => defaults,
                throwEvalError: (message) => {
                    throw new Error(message);
                },
            });

            expect(prepared.inputLayout.hasVarargin).toBe(true);
            expect(prepared.inputLayout.positionalParamCount).toBe(1);
            expect(prepared.returnLayout.hasVarargout).toBe(true);
            expect(prepared.callArguments.positional).toEqual([args[0]]);
            expect([...prepared.callArguments.named.keys()]).toEqual(['Scale']);
            expect(prepared.inputDefaults).toBe(defaults);
            expect(prepared.minFixedParamCount).toBe(1);
        });

        it('Should reject invalid calls while preparing function calls.', () => {
            const func = functionDefinition(['x'], ['y']);

            expect(() =>
                FunctionCall.prepareFunctionCall(func, [Complex.create(1), Complex.create(2)], 1, {
                    nameValueParameters: () => new Set(),
                    splitCallArguments: (_func, args) => ({ positional: args, named: new Map() }),
                    inputDefaults: () => new Map(),
                    throwEvalError: (message) => {
                        throw new Error(message);
                    },
                }),
            ).toThrow('invalid number of arguments in function f');
        });

        it('Should create varargin and varargout cells.', () => {
            const varargin = FunctionCall.vararginCell([Complex.create(1), Complex.create(2)]);
            const varargout = FunctionCall.emptyVarargoutCell(3, 1);

            expect(varargin).toBeInstanceOf(MultiArray);
            expect(varargin.isCell).toBe(true);
            expect(varargin.dimension).toEqual([1, 2]);
            expect(varargout).toBeInstanceOf(MultiArray);
            expect(varargout.isCell).toBe(true);
            expect(varargout.dimension).toEqual([1, 2]);
        });

        it('Should bind positional inputs and defaults through callbacks.', () => {
            const func = functionDefinition(['x', 'y', 'opts', 'varargin'], ['z']);
            const inputLayout = FunctionCall.inputLayout(func, new Set(['opts']));
            const bound = new Map<string, unknown>();
            const x = Complex.create(2);
            const y = Complex.create(10);
            const defaults = new Map([['y', y]]);

            FunctionCall.bindPositionalInputs(
                func,
                inputLayout,
                [x],
                defaults,
                (name, value) => bound.set(name, value),
                (_name, expression) => expression,
                (message) => {
                    throw new Error(message);
                },
            );

            expect(bound.get('x')).toBe(x);
            expect(bound.get('y')).toBe(y);
        });

        it('Should bind variadic input and output cells through callbacks.', () => {
            const func = functionDefinition(['x', 'varargin'], ['y', 'varargout']);
            const inputLayout = FunctionCall.inputLayout(func, new Set());
            const returnLayout = FunctionCall.returnLayout(func);
            const bound = new Map<string, unknown>();

            FunctionCall.bindVarargin(inputLayout, [Complex.create(1), Complex.create(2), Complex.create(3)], (name, value) => bound.set(name, value));
            FunctionCall.bindVarargout(returnLayout, 3, (name, value) => bound.set(name, value));

            expect(bound.get('varargin')).toBeInstanceOf(MultiArray);
            expect((bound.get('varargin') as MultiArray).dimension).toEqual([1, 2]);
            expect(bound.get('varargout')).toBeInstanceOf(MultiArray);
            expect((bound.get('varargout') as MultiArray).dimension).toEqual([1, 2]);
        });

        it('Should evaluate call arguments while preserving parent and indexes.', () => {
            const parent = AST.nodeIndexExpr(AST.nodeIdentifier('f'));
            const first = AST.nodeIdentifier('x');
            const second = AST.nodeIdentifier('y');

            const evaluated = FunctionCall.evaluateCallArguments([first, second], parent, (expr) => expr, 3);

            expect(evaluated).toEqual([first, second]);
            expect(first.parent).toBe(parent);
            expect(first.index).toBe(3);
            expect(second.parent).toBe(parent);
            expect(second.index).toBe(4);
        });

        it('Should bind lambda fixed inputs and varargin.', () => {
            const parent = AST.nodeIndexExpr(AST.nodeIdentifier('f'));
            const params = [AST.nodeIdentifier('x'), AST.nodeIdentifier('varargin')];
            const args: NodeExpr[] = [Complex.create(1), Complex.create(2), Complex.create(3)];
            const bound = new Map<string, unknown>();

            FunctionCall.bindLambdaInputs(
                params,
                args,
                parent,
                true,
                1,
                (name, value) => bound.set(name, value),
                (expr) => expr,
            );

            expect(bound.get('x')).toBe(args[0]);
            expect(bound.get('varargin')).toBeInstanceOf(MultiArray);
            expect((bound.get('varargin') as MultiArray).dimension).toEqual([1, 2]);
            expect(args[0].index).toBe(0);
            expect(args[1].index).toBe(1);
            expect(args[2].index).toBe(2);
        });
    });
});
