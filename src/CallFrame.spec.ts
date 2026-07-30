/// <reference types="jest" />
import { AST } from './AST';
import { CallFrame } from './CallFrame';
import { Complex } from './Complex';
import { Scope } from './Scope';

describe('CallFrame', () => {
    describe('Construction', () => {
        it('Should initialize optional metadata with safe defaults.', () => {
            const scope = Scope.create();
            const frame = new CallFrame(scope);

            expect(frame.scope).toBe(scope);
            expect(frame.func).toBeUndefined();
            expect(frame.callSite).toBeUndefined();
            expect(frame.name).toBeUndefined();
            expect(frame.nargin).toBe(0);
            expect(frame.nargout).toBe(0);
            expect(frame.inputArgs).toEqual([]);
            expect(frame.parentFrame).toBeUndefined();
        });

        it('Should store call metadata.', () => {
            const scope = Scope.create();
            const callSite = AST.nodeIdentifier('f');
            const identifierArg = AST.nodeIdentifier('x');
            const runtimeArg = Complex.create(2);
            const frame = new CallFrame(scope, undefined, callSite, 'f', 2, 2, [identifierArg, runtimeArg]);

            expect(frame.scope).toBe(scope);
            expect(frame.callSite).toBe(callSite);
            expect(frame.name).toBe('f');
            expect(frame.nargin).toBe(2);
            expect(frame.nargout).toBe(2);
            expect(frame.inputArgs).toEqual([identifierArg, runtimeArg]);
        });

        it('Should link to its caller frame.', () => {
            const caller = new CallFrame(Scope.create(), undefined, undefined, 'caller');
            const callee = new CallFrame(Scope.create(), undefined, undefined, 'callee', 0, 1, [], caller);

            expect(callee.parentFrame).toBe(caller);
            expect(callee.parentFrame?.name).toBe('caller');
        });
    });
});
