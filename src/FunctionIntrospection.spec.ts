/// <reference types="jest" />
import path from 'node:path';
import type { FunctionTable, NameEntry, NameTable, NodeFunctionDefinition, NodeInput } from './AST';
import { AST } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { Structure } from './Structure';
import type { ComplexType } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { FunctionIntrospection, type IntrospectionFrame, type IntrospectionScope } from './FunctionIntrospection';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const functionDefinition = (id: string): NodeFunctionDefinition =>
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
        omitAnswer: false,
        omitOutput: false,
    }) as NodeFunctionDefinition;

class TestScope implements IntrospectionScope {
    public nameTable: NameTable = Object.create(null);
    public functionTable: FunctionTable = Object.create(null);

    public constructor(public parent?: IntrospectionScope) {}

    public defineName(name: string, node: NodeInput): NameEntry {
        return (this.nameTable[name] = { node });
    }
}

const frame = (type: string | undefined, scope: TestScope, name = '', parentFrame?: IntrospectionFrame, id = name): IntrospectionFrame => ({
    scope,
    func: type ? { type, node: { id } } : undefined,
    name,
    parentFrame,
});

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        AST.reload();
    });

    describe('Behavior', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(FunctionIntrospection).toBeDefined();
            expect(FunctionIntrospection.localFunctionHandles).toBeDefined();
            expect(FunctionIntrospection.frameName).toBeDefined();
            expect(FunctionIntrospection.dbstackResult).toBeDefined();
        });

        it('Should resolve frame names from explicit names and callable metadata.', () => {
            const scope = new TestScope();

            expect(FunctionIntrospection.frameName(frame('FCNDEF', scope, 'explicit'))).toBe('explicit');
            expect(FunctionIntrospection.frameName(frame('FCNDEF', scope, '', undefined, 'f'))).toBe('f');
            expect(FunctionIntrospection.frameName(frame('BUILTIN', scope, '', undefined, 'sum'))).toBe('sum');
            expect(FunctionIntrospection.frameName(frame('LAMBDA', scope, ''))).toBe('<anonymous>');
            expect(FunctionIntrospection.frameName(frame(undefined, scope))).toBe('');
        });

        it('Should list local function handles from the nearest function frame scope.', () => {
            const globalScope = new TestScope();
            const functionScope = new TestScope();
            const globalFrame = frame(undefined, globalScope);
            const functionFrame = frame('FCNDEF', functionScope, 'outer', globalFrame);
            const builtinFrame = frame('BUILTIN', functionScope, 'builtin', functionFrame);
            functionScope.functionTable.b = functionDefinition('b');
            functionScope.functionTable.a = functionDefinition('a');

            const result = FunctionIntrospection.localFunctionHandles(builtinFrame, globalScope);

            expect(result.isCell).toBe(true);
            expect(result.dimension).toEqual([2, 1]);
            expect(FunctionHandle.isInstanceOf(result.array[0][0])).toBe(true);
            expect((result.array[0][0] as FunctionHandle).id).toBe('a');
            expect((result.array[1][0] as FunctionHandle).id).toBe('b');
        });

        it('Should list function-file local handles from a parent definition scope.', () => {
            const fileScope = new TestScope();
            const callScope = new TestScope(fileScope);
            const globalFrame = frame(undefined, new TestScope());
            const functionFrame = frame('FCNDEF', callScope, 'primary', globalFrame);
            fileScope.functionTable.primary = functionDefinition('primary');
            fileScope.functionTable.helper = functionDefinition('helper');
            fileScope.functionTable.other = functionDefinition('other');

            const result = FunctionIntrospection.localFunctionHandles(functionFrame, new TestScope());

            expect(result.dimension).toEqual([2, 1]);
            expect((result.array[0][0] as FunctionHandle).id).toBe('helper');
            expect((result.array[1][0] as FunctionHandle).id).toBe('other');
            expect((result.array[0][0] as FunctionHandle).closure).toBe(fileScope);
        });

        it('Should build dbstack structure results for callable frames.', () => {
            const scope = new TestScope();
            const globalFrame = frame(undefined, scope);
            const outerFrame = frame('FCNDEF', scope, 'outer', globalFrame);
            const innerFrame = frame('LAMBDA', scope, '@(x)x', outerFrame);
            outerFrame.callSite = { type: 'IDENT', id: 'outer', start: { line: 10, column: 1 } };
            innerFrame.callSite = { type: 'IDENT', id: 'anon', start: { line: 12, column: 3 } };

            const result = FunctionIntrospection.dbstackResult([Complex.create(1), new CharString('-completenames')], [globalFrame, outerFrame, innerFrame], (message) => {
                throw new Error(message);
            });
            const first = result.array[0][0] as Structure;

            expect(result.dimension).toEqual([1, 1]);
            expect((first.field.name as CharString).str).toBe('outer');
            expect(Complex.realToNumber(first.field.line as ComplexType)).toBe(10);
        });

        it('Should reject invalid dbstack arguments.', () => {
            const scope = new TestScope();

            expect(() =>
                FunctionIntrospection.dbstackResult([Complex.create(-1)], [frame('FCNDEF', scope, 'f')], (message) => {
                    throw new Error(message);
                }),
            ).toThrow('dbstack: omitted frame count must be a nonnegative integer.');

            expect(() =>
                FunctionIntrospection.dbstackResult([new CharString('-bad')], [frame('FCNDEF', scope, 'f')], (message) => {
                    throw new Error(message);
                }),
            ).toThrow("dbstack: unsupported option '-bad'.");
        });
    });
});
