/// <reference types="jest" />
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
            handle.sourceName = '+pkg/sinwrap.m';
            handle.className = 'HandleOwner';
            const copy = handle.copy();

            expect(FunctionHandle.isInstanceOf(handle)).toBe(true);
            expect(FunctionHandle.isAnonymous(handle)).toBe(false);
            expect(handle.id).toBe('sin');
            expect(handle.parameter).toEqual([]);
            expect(handle.expression).toBeNull();
            expect(FunctionHandle.toString(handle)).toBe('@sin');
            expect(handle.toString()).toBe('@sin');
            expect(copy).not.toBe(handle);
            expect(copy.id).toBe('sin');
            expect(copy.sourceName).toBe('+pkg/sinwrap.m');
            expect(copy.className).toBe('HandleOwner');
            expect(Complex.realToNumber(handle.toLogical())).toBe(0);
        });
    });

    describe('Anonymous handles', () => {
        it('Should store lambda parameters, expression, and closure.', () => {
            const parameter = AST.nodeIdentifier('x');
            const expression = AST.nodeOperation('+', AST.nodeIdentifier('x'), AST.nodeIdentifier('x'));
            const closure = Scope.create();
            const handle = FunctionHandle.create(undefined, [parameter], expression, closure);

            expect(FunctionHandle.isAnonymous(handle)).toBe(true);
            expect(handle.id).toBeUndefined();
            expect(handle.parameter).toEqual([parameter]);
            expect(handle.expression).toBe(expression);
            expect(handle.closure).toBe(closure);
            expect(handle.toString()).toBe('@anonymous function handle');
        });

        it('Should deep-copy anonymous handle AST nodes and relink parents.', () => {
            const parameter = AST.nodeIdentifier('x');
            const expression = AST.nodeOperation('+', AST.nodeIdentifier('x'), AST.nodeIdentifier('x'));
            const handle = FunctionHandle.create(undefined, [parameter], expression, Scope.create());
            handle.sourceName = '+pkg/anon.m';
            handle.className = 'AnonOwner';
            const copy = handle.copy();

            expect(copy.parameter[0]).not.toBe(handle.parameter[0]);
            expect(copy.expression).not.toBe(handle.expression);
            expect(copy.parameter[0].parent).toBe(copy);
            expect(copy.expression?.parent).toBe(copy);
            expect(copy.sourceName).toBe('+pkg/anon.m');
            expect(copy.className).toBe('AnonOwner');
        });

        it('Should copy anonymous handle runtime-expression bodies through the opaque copy contract.', () => {
            const expression = Complex.one();
            const handle = FunctionHandle.create(undefined, [], expression, Scope.create());
            const copy = handle.copy();

            expect(copy.expression).not.toBe(expression);
            expect(Complex.isInstanceOf(copy.expression)).toBe(true);
            expect(copy.expression?.parent).toBe(copy);
        });
    });
});
