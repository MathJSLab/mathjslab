/// <reference types="jest" />
import path from 'node:path';
import type { NodeArgumentValidation, NodeExpr, NodeFunctionDefinition, NodeInput } from './AST';
import { AST, CharString, Complex, MultiArray } from './AST';
import { FunctionArguments } from './FunctionArguments';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const throwSyntaxError = (message: string): never => {
    throw new Error(message);
};
const throwEvalError = (message: string): never => {
    throw new Error(message);
};

const argValidation = (overrides: Partial<NodeArgumentValidation>): NodeArgumentValidation =>
    ({
        type: 'ARGVALID',
        name: AST.nodeIdentifier('x'),
        size: [],
        class: null,
        functions: [],
        default: undefined,
        omitAnswer: false,
        omitOutput: false,
        ...overrides,
    }) as NodeArgumentValidation;

const functionDefinition = (parameterNames: string[], returnNames: string[], validations: NodeArgumentValidation[], attribute?: string): NodeFunctionDefinition =>
    ({
        type: 'FCNDEF',
        id: 'f',
        mapper: false,
        ev: [],
        func: () => undefined,
        return: AST.nodeList(returnNames.map((name) => AST.nodeIdentifier(name))),
        parameter: AST.nodeList(parameterNames.map((name) => AST.nodeIdentifier(name))),
        arguments: AST.nodeList([
            {
                type: 'ARGS',
                attribute: attribute ? AST.nodeIdentifier(attribute) : null,
                validation: validations,
                omitAnswer: false,
                omitOutput: false,
            },
        ]),
        statements: AST.nodeList([]),
        omitAnswer: false,
        omitOutput: false,
    }) as NodeFunctionDefinition;

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Behavior', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(FunctionArguments).toBeDefined();
            expect(FunctionArguments.validateBlocks).toBeDefined();
            expect(FunctionArguments.validateArgumentValidation).toBeDefined();
        });

        it('Should read identifiers and name-value declaration targets.', () => {
            const simple = argValidation({ name: AST.nodeIdentifier('x') });
            const named = argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Color') });

            expect(FunctionArguments.validationName(simple, throwSyntaxError)).toBe('x');
            expect(FunctionArguments.nameValueTarget(simple, throwSyntaxError)).toBeUndefined();
            expect(FunctionArguments.nameValueTarget(named, throwSyntaxError)).toEqual({ parameter: 'opts', field: 'Color' });
            expect(FunctionArguments.validationDisplayName(named, throwSyntaxError)).toBe('opts.Color');
        });

        it('Should parse literal and symbolic argument sizes.', () => {
            const validation = argValidation({ size: [Complex.create(1), AST.nodeIdentifier('n'), AST.nodeColon()] });

            const size = FunctionArguments.literalArgumentSize(validation, throwSyntaxError)!;

            expect(size).toEqual([1, { type: 'symbol', name: 'n' }, { type: 'any' }]);
            expect(FunctionArguments.argumentSizeDisplay(size)).toBe('(1,n,:)');
        });

        it('Should parse single and alternative argument classes.', () => {
            const single = argValidation({ class: AST.nodeIdentifier('double') });
            const alternatives = argValidation({ class: AST.nodeList([AST.nodeIdentifier('double'), AST.nodeIdentifier('char')]) });

            expect(FunctionArguments.argumentClassName(single, throwSyntaxError)).toBe('double');
            expect(FunctionArguments.argumentClassNames(single, throwSyntaxError)).toEqual(['double']);
            expect(FunctionArguments.argumentClassName(alternatives, throwSyntaxError)).toBeUndefined();
            expect(FunctionArguments.argumentClassNames(alternatives, throwSyntaxError)).toEqual(['double', 'char']);
            expect(FunctionArguments.argumentClassDisplay(['double', 'char'])).toBe('double or char');
        });

        it('Should parse class and function validators.', () => {
            const greaterThan = AST.nodeIndexExpr(AST.nodeIdentifier('mustBeGreaterThan'), AST.nodeList([AST.nodeIdentifier('x'), Complex.create(0)]));
            const inRange = AST.nodeIndexExpr(AST.nodeIdentifier('mustBeInRange'), AST.nodeList([AST.nodeIdentifier('x'), Complex.create(0), Complex.create(10)]));
            const member = AST.nodeIndexExpr(AST.nodeIdentifier('mustBeMember'), AST.nodeList([AST.nodeIdentifier('x'), AST.nodeIdentifier('allowed')]));
            const validation = argValidation({
                class: AST.nodeIdentifier('double'),
                functions: [
                    AST.nodeIdentifier('mustBeNumericOrLogical'),
                    AST.nodeIdentifier('mustBeTextScalar'),
                    AST.nodeIdentifier('mustBeMatrix'),
                    AST.nodeIdentifier('mustBeSquare'),
                    AST.nodeIdentifier('mustBeNonzero'),
                    AST.nodeIdentifier('mustBePositive'),
                    greaterThan,
                    inRange,
                    member,
                ],
            });

            expect(FunctionArguments.argumentClassName(validation, throwSyntaxError)).toBe('double');
            expect(FunctionArguments.argumentValidators(validation, throwSyntaxError).map((validator) => validator.name)).toEqual([
                'mustBeNumericOrLogical',
                'mustBeTextScalar',
                'mustBeMatrix',
                'mustBeSquare',
                'mustBeNonzero',
                'mustBePositive',
                'mustBeGreaterThan',
                'mustBeInRange',
                'mustBeMember',
            ]);
        });

        it('Should parse custom argument validators.', () => {
            const customCall = AST.nodeIndexExpr(AST.nodeIdentifier('mustBeAbove'), AST.nodeList([AST.nodeIdentifier('x'), AST.nodeIdentifier('limit')]));
            const validation = argValidation({ functions: [AST.nodeIdentifier('mustBeCustom'), customCall] });

            expect(FunctionArguments.argumentValidators(validation, throwSyntaxError)).toEqual([
                { name: 'mustBeCustom', custom: 'implicit' },
                { name: 'mustBeAbove', custom: 'explicit', expression: customCall },
            ]);
        });

        it('Should validate argument blocks against function parameters and outputs.', () => {
            const input = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('x') })]);
            const output = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('y') })], 'Output');
            const bad = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('z') })]);

            expect(() => FunctionArguments.validateBlocks(input, throwSyntaxError)).not.toThrow();
            expect(() => FunctionArguments.validateBlocks(output, throwSyntaxError)).not.toThrow();
            expect(() => FunctionArguments.validateBlocks(bad, throwSyntaxError)).toThrow("arguments block declaration 'z' does not match a function parameter in function f.");
        });

        it('Should validate values through resolver and evaluator callbacks.', () => {
            const value = new MultiArray([1, 2], [[Complex.create(2), Complex.create(3)]]);
            const validation = argValidation({ size: [Complex.create(1), Complex.create(2)], class: AST.nodeIdentifier('double'), functions: [AST.nodeIdentifier('mustBePositive')] });

            expect(() =>
                FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), {
                    resolveEntry: () => ({ node: value }),
                    evaluate: (expr: NodeExpr): NodeInput => expr,
                    throwEvalError,
                    throwSyntaxError,
                }),
            ).not.toThrow();
        });

        it('Should validate values against alternative argument classes.', () => {
            const validation = argValidation({ class: AST.nodeList([AST.nodeIdentifier('double'), AST.nodeIdentifier('char')]) });

            expect(() =>
                FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), {
                    resolveEntry: () => ({ node: new CharString('ok') }),
                    evaluate: (expr: NodeExpr): NodeInput => expr,
                    throwEvalError,
                    throwSyntaxError,
                }),
            ).not.toThrow();
            expect(() =>
                FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), {
                    resolveEntry: () => ({ node: new MultiArray([1, 1], [[Complex.create(1)]], true) }),
                    evaluate: (expr: NodeExpr): NodeInput => expr,
                    throwEvalError,
                    throwSyntaxError,
                }),
            ).toThrow("arguments block validation failed for 'x': expected class double or char, got cell.");
        });

        it('Should report value validation failures through callbacks.', () => {
            const value = new MultiArray([1, 2], [[Complex.create(2), Complex.create(-3)]]);
            const validation = argValidation({ size: [Complex.create(1), Complex.create(2)], class: AST.nodeIdentifier('double'), functions: [AST.nodeIdentifier('mustBePositive')] });

            expect(() =>
                FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), {
                    resolveEntry: () => ({ node: value }),
                    evaluate: (expr: NodeExpr): NodeInput => expr,
                    throwEvalError,
                    throwSyntaxError,
                }),
            ).toThrow("arguments block validation failed for 'x': mustBePositive.");
        });

        it('Should split positional and name-value call arguments.', () => {
            const options = argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Color'), default: Complex.create(1) });
            const func = functionDefinition(['x', 'opts'], ['y'], [options]);
            const result = FunctionArguments.splitCallNameValueArguments(func, [Complex.create(1), new CharString('col'), Complex.create(2)], throwEvalError, throwSyntaxError);

            expect(result.positional).toHaveLength(1);
            expect([...result.named.keys()]).toEqual(['Color']);
        });

        it('Should keep assignment expressions positional when no name-value declarations exist.', () => {
            const func = functionDefinition(['x'], ['y'], []);
            const assignment = AST.nodeOperation('=', AST.nodeIdentifier('x'), Complex.create(2));
            const result = FunctionArguments.splitCallNameValueArguments(func, [assignment], throwEvalError, throwSyntaxError);

            expect(result.positional).toEqual([assignment]);
            expect(result.named.size).toBe(0);
        });

        it('Should keep undeclared strings positional while optional positional parameters remain.', () => {
            const optional = argValidation({ name: AST.nodeIdentifier('label'), default: new CharString('default') });
            const options = argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Scale'), default: Complex.create(1) });
            const func = functionDefinition(['x', 'label', 'opts'], ['y'], [optional, options]);
            const result = FunctionArguments.splitCallNameValueArguments(func, [Complex.create(1), new CharString('hello')], throwEvalError, throwSyntaxError);

            expect(result.positional).toHaveLength(2);
            expect(result.positional[1]).toBeInstanceOf(CharString);
            expect(result.named.size).toBe(0);
        });

        it('Should classify declared strings as name-value arguments after optional positional parameters.', () => {
            const optional = argValidation({ name: AST.nodeIdentifier('label'), default: new CharString('default') });
            const options = argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Scale'), default: Complex.create(1) });
            const func = functionDefinition(['x', 'label', 'opts'], ['y'], [optional, options]);
            const result = FunctionArguments.splitCallNameValueArguments(func, [Complex.create(1), new CharString('Scale'), Complex.create(2)], throwEvalError, throwSyntaxError);

            expect(result.positional).toHaveLength(1);
            expect([...result.named.keys()]).toEqual(['Scale']);
        });

        it('Should compute output names requested for output arguments validation.', () => {
            const fixed = functionDefinition(['x'], ['a', 'b'], []);
            const variadicOnly = functionDefinition(['x'], ['varargout'], []);
            const mixed = functionDefinition(['x'], ['a', 'varargout'], []);

            expect(FunctionArguments.outputNamesToValidate(fixed, 1)).toEqual(new Set(['a']));
            expect(FunctionArguments.outputNamesToValidate(fixed, 2)).toEqual(new Set(['a', 'b']));
            expect(FunctionArguments.outputNamesToValidate(variadicOnly, 3)).toBeUndefined();
            expect(FunctionArguments.outputNamesToValidate(mixed, 3)).toEqual(new Set(['a']));
        });
    });
});
