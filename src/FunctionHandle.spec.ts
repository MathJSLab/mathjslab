import path from 'node:path';
import { AST } from './AST';
import { Complex } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { Scope } from './Scope';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Definition', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(FunctionHandle).toBeDefined();
            expect(FunctionHandle.create).toBeDefined();
            expect(FunctionHandle.copy).toBeDefined();
            expect(FunctionHandle.toLogical).toBeDefined();
        });
    });

    describe('Named handles', () => {
        it('Should create, format, copy, and logically convert named handles.', () => {
            const handle = FunctionHandle.create('sin');
            const copy = handle.copy();

            expect(FunctionHandle.isInstanceOf(handle)).toBe(true);
            expect(handle.id).toBe('sin');
            expect(handle.parameter).toEqual([]);
            expect(handle.expression).toBeNull();
            expect(FunctionHandle.toString(handle)).toBe('@sin');
            expect(handle.toString()).toBe('@sin');
            expect(copy).not.toBe(handle);
            expect(copy.id).toBe('sin');
            expect(Complex.realToNumber(handle.toLogical())).toBe(0);
        });
    });

    describe('Anonymous handles', () => {
        it('Should store lambda parameters, expression, and closure.', () => {
            const parameter = AST.nodeIdentifier('x');
            const expression = AST.nodeOperation('+', AST.nodeIdentifier('x'), AST.nodeIdentifier('x'));
            const closure = Scope.create();
            const handle = FunctionHandle.create(undefined, [parameter], expression, closure);

            expect(handle.id).toBeUndefined();
            expect(handle.parameter).toEqual([parameter]);
            expect(handle.expression).toBe(expression);
            expect(handle.closure).toBe(closure);
            expect(handle.toString()).toBe('@anonymous function handle');
        });
    });
});
