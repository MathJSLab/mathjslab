import path from 'node:path';
import type { NodeBuiltInFunction, NodeFunctionDefinition } from './AST';
import { AST, CharString, Complex } from './AST';
import type { ComplexType } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { FunctionLookup } from './FunctionLookup';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const functionDefinition = (id: string, nested = false): NodeFunctionDefinition =>
    ({
        type: 'FCNDEF',
        id,
        mapper: false,
        ev: [],
        func: () => undefined,
        return: AST.nodeList([]),
        parameter: AST.nodeList([]),
        arguments: AST.nodeList([]),
        statements: AST.nodeList([]),
        attributes: nested ? { nested: true } : {},
        omitAnswer: false,
        omitOutput: false,
    }) as NodeFunctionDefinition;

const builtInFunction = (id: string): NodeBuiltInFunction =>
    ({
        type: 'BUILTIN',
        id,
        mapper: false,
        ev: [],
        func: () => undefined,
    }) as NodeBuiltInFunction;

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        AST.reload();
    });

    describe('Behavior', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(FunctionLookup).toBeDefined();
            expect(FunctionLookup.existCode).toBeDefined();
            expect(FunctionLookup.whichResult).toBeDefined();
            expect(FunctionLookup.str2func).toBeDefined();
        });

        it('Should compute exist codes for variables, functions, built-ins and classes.', () => {
            expect(FunctionLookup.existCode('x', undefined, { node: Complex.create(1) }, undefined)).toBe(1);
            expect(FunctionLookup.existCode('f', undefined, undefined, functionDefinition('f'))).toBe(2);
            expect(FunctionLookup.existCode('sum', undefined, undefined, builtInFunction('sum'))).toBe(5);
            expect(FunctionLookup.existCode('double', 'class', undefined, undefined)).toBe(8);
            expect(FunctionLookup.existCode('sum', 'builtin', undefined, builtInFunction('sum'))).toBe(5);
            expect(FunctionLookup.existCode('x', 'function', { node: Complex.create(1) }, undefined)).toBe(0);
        });

        it('Should format which results.', () => {
            const anonymous = FunctionHandle.create(undefined, [AST.nodeIdentifier('x')], AST.nodeIdentifier('x'));

            expect(FunctionLookup.whichResult('x', { node: Complex.create(1) }, undefined, undefined, () => '')).toEqual(new CharString('x is a variable'));
            expect(FunctionLookup.whichResult('f', undefined, functionDefinition('f'), undefined, () => '')).toEqual(new CharString('f is a user-defined function'));
            expect(FunctionLookup.whichResult('nested', undefined, functionDefinition('nested', true), undefined, () => '')).toEqual(new CharString('nested is a nested function'));
            expect(FunctionLookup.whichResult('sum', undefined, builtInFunction('sum'), undefined, () => '')).toEqual(new CharString('sum is a built-in function'));
            expect(FunctionLookup.whichResult('@(x)x', undefined, undefined, anonymous, () => '@(x) x')).toEqual(new CharString('@(x) x is an anonymous function'));
            expect(FunctionLookup.whichResult('missing', undefined, undefined, undefined, () => '')).toEqual(new CharString('missing not found'));
        });

        it('Should convert function handles to and from strings.', () => {
            const named = FunctionLookup.str2func(
                '  sin  ',
                () => {
                    throw new Error('should not evaluate named handles');
                },
                (message) => {
                    throw new Error(message);
                },
            );
            const anonymous = FunctionHandle.create(undefined, [AST.nodeIdentifier('x')], AST.nodeIdentifier('x'));

            expect(named.id).toBe('sin');
            expect(
                FunctionLookup.str2func(
                    '@(x) x',
                    () => anonymous,
                    (message) => {
                        throw new Error(message);
                    },
                ),
            ).toBe(anonymous);
            expect(() =>
                FunctionLookup.str2func(
                    '@bad',
                    () => Complex.create(1),
                    (message) => {
                        throw new Error(message);
                    },
                ),
            ).toThrow('str2func: invalid function handle string.');
            expect(FunctionLookup.func2str(named, () => 'unused')).toEqual(new CharString('sin'));
            expect(FunctionLookup.func2str(anonymous, () => '@(x) x')).toEqual(new CharString('@(x) x'));
        });

        it('Should describe function handles for functions().', () => {
            const simple = FunctionHandle.create('f');
            const nested = FunctionHandle.create('nested');
            nested.closure = {
                resolveFunction: () => functionDefinition('nested', true),
            } as any;
            const anonymous = FunctionHandle.create(undefined, [AST.nodeIdentifier('x')], AST.nodeIdentifier('x'));
            const simpleInfo = FunctionLookup.functionsInfo(
                simple,
                (name) => name,
                () => functionDefinition('f'),
                () => 'unused',
            );
            const nestedInfo = FunctionLookup.functionsInfo(
                nested,
                (name) => name,
                () => undefined,
                () => 'unused',
            );
            const anonymousInfo = FunctionLookup.functionsInfo(
                anonymous,
                (name) => name,
                () => undefined,
                () => '@(x) x',
            );

            expect((simpleInfo.field.function as CharString).str).toBe('f');
            expect((simpleInfo.field.type as CharString).str).toBe('simple');
            expect((nestedInfo.field.type as CharString).str).toBe('nested');
            expect(Complex.realToNumber(nestedInfo.field.workspace as ComplexType)).toBe(1);
            expect((anonymousInfo.field.function as CharString).str).toBe('@(x) x');
            expect((anonymousInfo.field.type as CharString).str).toBe('anonymous');
        });
    });
});
