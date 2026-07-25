/// <reference types="jest" />
import path from 'node:path';
import type { NodeBuiltInFunction, NodeFunctionDefinition } from './AST';
import { AST } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';
import { Callables } from './Callable';
import { FunctionArity } from './FunctionArity';
import { FunctionHandle, type AnonymousFunctionHandle } from './FunctionHandle';

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

const anonymousHandle = (...args: Parameters<typeof FunctionHandle.create>): AnonymousFunctionHandle => {
    const handle = FunctionHandle.create(...args);
    if (!FunctionHandle.isAnonymous(handle)) {
        throw new Error('expected anonymous function handle fixture.');
    }
    return handle;
};

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

            expect(FunctionArity.inputArity(Callables.lambda(anonymousHandle(undefined, fixedLambda.parameter, fixedLambda.expression)))).toBe(2);
            expect(FunctionArity.inputArity(Callables.lambda(anonymousHandle(undefined, variadicLambda.parameter, variadicLambda.expression)))).toBe(-2);
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

            expect(FunctionArity.outputArity(Callables.lambda(anonymousHandle(undefined, [], AST.nodeIdentifier('x'))))).toBe(1);
            expect(FunctionArity.outputArity(Callables.functionDefinition(fixedFunction))).toBe(2);
            expect(FunctionArity.outputArity(Callables.functionDefinition(variadicFunction))).toBe(-2);
            expect(FunctionArity.outputArity(Callables.builtin(builtinFixed))).toBe(3);
            expect(FunctionArity.inputArity(Callables.builtin(builtinDefault))).toBe(2);
            expect(FunctionArity.outputArity(Callables.builtin(builtinDefault))).toBe(1);
        });

        it('Should reject structurally invalid arity metadata instead of ignoring it.', () => {
            const invalidLambda = FunctionHandle.create(undefined, [AST.nodeIdentifier('x'), AST.nodeReturn()], AST.nodeIdentifier('x'));
            const invalidParameter = functionDefinition(['x'], ['y']);
            invalidParameter.parameter.list.push(AST.nodeReturn());
            const invalidReturn = functionDefinition(['x'], ['y']);
            invalidReturn.return.list.push(AST.nodeReturn());

            expect(() => FunctionArity.inputArity(Callables.lambda(anonymousHandle(undefined, invalidLambda.parameter, invalidLambda.expression)))).toThrow(
                'internal AST error: function handle parameter 2 has invalid node type.',
            );
            expect(() => FunctionArity.inputArity(Callables.functionDefinition(invalidParameter))).toThrow('internal AST error: function parameter 2 has invalid node type.');
            expect(() => FunctionArity.outputArity(Callables.functionDefinition(invalidReturn))).toThrow('internal AST error: function return 2 has invalid node type.');
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
