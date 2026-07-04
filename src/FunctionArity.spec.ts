import path from 'node:path';
import type { NodeBuiltInFunction, NodeFunctionDefinition } from './AST';
import { AST, CharString, Complex, MultiArray } from './AST';
import { Callables } from './Callable';
import { FunctionArity } from './FunctionArity';
import { FunctionHandle } from './FunctionHandle';

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
            expect(FunctionArity).toBeDefined();
            expect(FunctionArity.inputArity).toBeDefined();
            expect(FunctionArity.outputArity).toBeDefined();
            expect(FunctionArity.checkFunctionCount).toBeDefined();
        });

        it('Should compute lambda and user-defined function input arity.', () => {
            const fixedLambda = FunctionHandle.create(undefined, [AST.nodeIdentifier('x'), AST.nodeIdentifier('y')], AST.nodeIdentifier('x'));
            const variadicLambda = FunctionHandle.create(undefined, [AST.nodeIdentifier('x'), AST.nodeIdentifier('varargin')], AST.nodeIdentifier('x'));
            const fixedFunction = functionDefinition(['x', 'y'], ['z']);
            const variadicFunction = functionDefinition(['x', 'varargin'], ['z']);

            expect(FunctionArity.inputArity(Callables.lambda(fixedLambda as FunctionHandle & { id: undefined }))).toBe(2);
            expect(FunctionArity.inputArity(Callables.lambda(variadicLambda as FunctionHandle & { id: undefined }))).toBe(-2);
            expect(FunctionArity.inputArity(Callables.functionDefinition(fixedFunction))).toBe(2);
            expect(FunctionArity.inputArity(Callables.functionDefinition(variadicFunction))).toBe(-2);
        });

        it('Should compute output arity for lambdas, user functions and built-ins.', () => {
            const fixedFunction = functionDefinition(['x'], ['a', 'b']);
            const variadicFunction = functionDefinition(['x'], ['a', 'varargout']);
            const builtinFixed = {
                type: 'BUILTIN',
                id: 'fixed',
                mapper: false,
                ev: [],
                func: (x: unknown, y: unknown) => x ?? y,
                signature: { inputs: { arity: 2 }, outputs: { arity: 3 } },
            } as NodeBuiltInFunction;
            const builtinDefault = { type: 'BUILTIN', id: 'plain', mapper: false, ev: [], func: (x: unknown, y: unknown) => x ?? y } as NodeBuiltInFunction;

            expect(FunctionArity.outputArity(Callables.lambda(FunctionHandle.create(undefined, [], AST.nodeIdentifier('x')) as FunctionHandle & { id: undefined }))).toBe(1);
            expect(FunctionArity.outputArity(Callables.functionDefinition(fixedFunction))).toBe(2);
            expect(FunctionArity.outputArity(Callables.functionDefinition(variadicFunction))).toBe(-2);
            expect(FunctionArity.outputArity(Callables.builtin(builtinFixed))).toBe(3);
            expect(FunctionArity.inputArity(Callables.builtin(builtinDefault))).toBe(2);
            expect(FunctionArity.outputArity(Callables.builtin(builtinDefault))).toBe(1);
        });

        it('Should validate count bounds.', () => {
            const scalar = new MultiArray([1, 1], [[Complex.create(3)]]);

            expect(
                FunctionArity.countBound('narginchk', Complex.create(2), false, (message) => {
                    throw new Error(message);
                }),
            ).toBe(2);
            expect(
                FunctionArity.countBound('nargoutchk', scalar, false, (message) => {
                    throw new Error(message);
                }),
            ).toBe(3);
            expect(
                FunctionArity.countBound('nargoutchk', Complex.create(Infinity), true, (message) => {
                    throw new Error(message);
                }),
            ).toBe(Infinity);
            expect(() =>
                FunctionArity.countBound('narginchk', new CharString('x'), false, (message) => {
                    throw new Error(message);
                }),
            ).toThrow('narginchk: bounds must be real scalar numbers.');
            expect(() =>
                FunctionArity.countBound('narginchk', Complex.create(-1), false, (message) => {
                    throw new Error(message);
                }),
            ).toThrow('narginchk: bounds must be nonnegative integers.');
        });

        it('Should validate narginchk and nargoutchk ranges against a count.', () => {
            expect(() =>
                FunctionArity.checkFunctionCount(
                    'narginchk',
                    Complex.create(0),
                    Complex.create(2),
                    1,
                    (message) => {
                        throw new Error(message);
                    },
                    (message) => {
                        throw new Error(message);
                    },
                ),
            ).not.toThrow();

            expect(() =>
                FunctionArity.checkFunctionCount(
                    'nargoutchk',
                    Complex.create(2),
                    Complex.create(1),
                    1,
                    (message) => {
                        throw new Error(message);
                    },
                    (message) => {
                        throw new Error(message);
                    },
                ),
            ).toThrow('nargoutchk: maximum count must be greater than or equal to minimum count.');

            expect(() =>
                FunctionArity.checkFunctionCount(
                    'narginchk',
                    Complex.create(2),
                    Complex.create(3),
                    1,
                    (message) => {
                        throw new Error(message);
                    },
                    (message) => {
                        throw new Error(message);
                    },
                ),
            ).toThrow('narginchk: invalid number of input arguments.');
        });
    });
});
