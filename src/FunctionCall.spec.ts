/// <reference types="jest" />
import path from 'node:path';
import { AST } from './AST';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';
import type { NameTable, NodeExpr, NodeFunctionDefinition } from './AST';
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
        return: AST.nodeList(returnNames.map((name) => (name === '~' ? AST.nodeIgnoredTarget() : AST.nodeIdentifier(name)))),
        parameter: AST.nodeList(parameterNames.map((name) => (name === '~' ? AST.nodeIgnoredTarget() : AST.nodeIdentifier(name)))),
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
            const repeatingOutput = functionDefinition(['x'], ['items']);

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
            expect(FunctionCall.returnLayout(repeatingOutput, 'items')).toMatchObject({
                hasVarargout: false,
                variableOutputName: 'items',
                fixedReturnCount: 0,
                names: ['items'],
            });
        });

        it('Should reject structurally invalid function call metadata instead of ignoring it.', () => {
            const invalidParameter = functionDefinition(['x'], ['y']);
            invalidParameter.parameter.list.push(AST.nodeReturn());
            const invalidReturn = functionDefinition(['x'], ['y']);
            invalidReturn.return.list.push(AST.nodeReturn());

            expect(() => FunctionCall.inputLayout(invalidParameter, new Set())).toThrow('internal AST error: function parameter 2 has invalid node type.');
            expect(() => FunctionCall.returnLayout(invalidReturn)).toThrow('internal AST error: function return 2 has invalid node type.');
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

        it('Should preserve colon default markers while expanding positional arguments.', () => {
            const func = functionDefinition(['x', 'y'], ['z']);
            const colon = AST.nodeColon();
            const expanded = Complex.create(3);
            const prepared = FunctionCall.prepareFunctionCall(func, [colon], 1, {
                nameValueParameters: () => new Set(),
                splitCallArguments: (_func, args) => ({ positional: args, named: new Map() }),
                expandPositionalArguments: (args) => (args[0] === colon ? [expanded] : args),
                inputDefaults: () =>
                    new Map([
                        ['x', Complex.create(1) as NodeExpr],
                        ['y', Complex.create(2) as NodeExpr],
                    ]),
                throwEvalError: (message) => {
                    throw new Error(message);
                },
            });

            expect(prepared.callArguments.positional).toEqual([colon]);
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

        it('Should bind Octave colon default markers for positional defaults.', () => {
            const func = functionDefinition(['x', 'y', 'varargin'], ['z']);
            const inputLayout = FunctionCall.inputLayout(func, new Set());
            const bound = new Map<string, unknown>();
            const x = Complex.create(2);
            const y = Complex.create(10);
            const marker = AST.nodeColon();
            const evaluated = FunctionCall.evaluateCallArguments(
                [x, marker],
                AST.nodeIndexExpr(AST.nodeIdentifier('f')),
                (expr) => expr,
                (message) => {
                    throw new Error(message);
                },
                0,
                true,
            );

            FunctionCall.bindPositionalInputs(
                func,
                inputLayout,
                evaluated,
                new Map([['y', y]]),
                (name, value) => bound.set(name, value),
                (_name, expression) => expression,
                (message) => {
                    throw new Error(message);
                },
            );

            expect(bound.get('x')).toBe(x);
            expect(bound.get('y')).toBe(y);
        });

        it('Should reject Octave colon default markers without matching defaults.', () => {
            const func = functionDefinition(['x', 'y'], ['z']);
            const inputLayout = FunctionCall.inputLayout(func, new Set());
            const evaluated = FunctionCall.evaluateCallArguments(
                [Complex.create(2), AST.nodeColon()],
                AST.nodeIndexExpr(AST.nodeIdentifier('f')),
                (expr) => expr,
                (message) => {
                    throw new Error(message);
                },
                0,
                true,
            );

            expect(() =>
                FunctionCall.bindPositionalInputs(
                    func,
                    inputLayout,
                    evaluated,
                    new Map(),
                    () => undefined,
                    (_name, expression) => expression,
                    (message) => {
                        throw new Error(message);
                    },
                ),
            ).toThrow("invalid use of default argument marker ':' in function f");
        });

        it('Should bind variadic input and output cells through callbacks.', () => {
            const func = functionDefinition(['x', 'varargin'], ['y', 'varargout']);
            const repeatingOutput = functionDefinition(['x'], ['items']);
            const inputLayout = FunctionCall.inputLayout(func, new Set());
            const returnLayout = FunctionCall.returnLayout(func);
            const repeatingReturnLayout = FunctionCall.returnLayout(repeatingOutput, 'items');
            const bound = new Map<string, unknown>();

            FunctionCall.bindVarargin(inputLayout, [Complex.create(1), Complex.create(2), Complex.create(3)], (name, value) => bound.set(name, value));
            FunctionCall.bindVarargout(returnLayout, 3, (name, value) => bound.set(name, value));
            FunctionCall.bindVarargout(repeatingReturnLayout, 2, (name, value) => bound.set(name, value));

            expect(bound.get('varargin')).toBeInstanceOf(MultiArray);
            expect((bound.get('varargin') as MultiArray).dimension).toEqual([1, 2]);
            expect(bound.get('varargout')).toBeInstanceOf(MultiArray);
            expect((bound.get('varargout') as MultiArray).dimension).toEqual([1, 2]);
            expect(bound.get('items')).toBeInstanceOf(MultiArray);
            expect((bound.get('items') as MultiArray).dimension).toEqual([1, 2]);
        });

        it('Should evaluate call arguments while preserving parent and indexes.', () => {
            const parent = AST.nodeIndexExpr(AST.nodeIdentifier('f'));
            const first = AST.nodeIdentifier('x');
            const second = AST.nodeIdentifier('y');

            const evaluated = FunctionCall.evaluateCallArguments(
                [first, second],
                parent,
                (expr) => expr,
                (message) => {
                    throw new Error(message);
                },
                3,
            );

            expect(evaluated).toEqual([first, second]);
            expect(first.parent).toBe(parent);
            expect(first.index).toBe(3);
            expect(second.parent).toBe(parent);
            expect(second.index).toBe(4);
        });

        it('Should bind lambda fixed inputs and varargin.', () => {
            const parent = AST.nodeIndexExpr(AST.nodeIdentifier('f'));
            const params = [AST.nodeIdentifier('x'), AST.nodeIdentifier('varargin')];
            const args = [AST.nodeIdentifier('a'), AST.nodeIdentifier('b'), AST.nodeIdentifier('c')];
            const bound = new Map<string, unknown>();

            FunctionCall.bindLambdaInputs(
                params,
                args,
                parent,
                true,
                1,
                (name, value) => bound.set(name, value),
                (expr) => expr,
                (message) => {
                    throw new Error(message);
                },
            );

            expect(bound.get('x')).toBe(args[0]);
            expect(bound.get('varargin')).toBeInstanceOf(MultiArray);
            expect((bound.get('varargin') as MultiArray).dimension).toEqual([1, 2]);
            expect(args[0].index).toBe(0);
            expect(args[1].index).toBe(1);
            expect(args[2].index).toBe(2);
        });

        it('Should reject non-expression values while evaluating function arguments.', () => {
            const parent = AST.nodeIndexExpr(AST.nodeIdentifier('f'));
            const arg = AST.nodeIdentifier('x');

            expect(() =>
                FunctionCall.evaluateCallArguments(
                    [arg],
                    parent,
                    () => AST.nodeReturn(),
                    (message) => {
                        throw new Error(message);
                    },
                ),
            ).toThrow("Argument value 'argument 1' is not an expression.");
        });

        it('Should reject non-expression values while building return lists.', () => {
            const returnLayout = FunctionCall.returnLayout(functionDefinition([], ['y']));
            const returnList = FunctionCall.createReturnList(returnLayout, { y: { node: AST.nodeReturn() } } as NameTable, (message) => {
                throw new Error(message);
            });

            expect(AST.isNodeReturnList(returnList)).toBe(true);
            expect(() => returnList.handler(1)).toThrow("Return variable 'y' is not an expression.");
        });

        it('Should materialize ignored function returns as empty arrays when requested.', () => {
            const returnLayout = FunctionCall.returnLayout(functionDefinition([], ['x', '~', 'z']));
            const returnList = FunctionCall.createReturnList(returnLayout, { x: { node: Complex.create(1) }, z: { node: Complex.create(3) } } as NameTable, (message) => {
                throw new Error(message);
            });

            const returned = returnList.handler(3);

            expect(Complex.realToNumber(returnList.selector(returned, 0) as NodeExpr)).toBe(1);
            expect(returnList.selector(returned, 1)).toEqual(MultiArray.emptyArray());
            expect(Complex.realToNumber(returnList.selector(returned, 2) as NodeExpr)).toBe(3);
        });

        it('Should build return lists from named repeating output cells.', () => {
            const returnLayout = FunctionCall.returnLayout(functionDefinition([], ['items']), 'items');
            const returnList = FunctionCall.createReturnList(
                returnLayout,
                { items: { node: MultiArray.firstRow([Complex.create(10), Complex.create(20)], true) } } as NameTable,
                (message) => {
                    throw new Error(message);
                },
            );

            const returned = returnList.handler(2);

            expect(returned.length).toBe(2);
            expect(Complex.realToNumber(returned.items0 as NodeExpr)).toBe(10);
            expect(Complex.realToNumber(returned.items1 as NodeExpr)).toBe(20);
        });
    });
});
