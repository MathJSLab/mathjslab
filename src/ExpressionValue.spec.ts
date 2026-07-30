/// <reference types="jest" />
import { AST, type NodeInput } from './AST';
import { Complex } from './Complex';
import { expressionValue, expressionValues, optionalRuntimeExpressionValue, runtimeExpressionValue, runtimeExpressionValues } from './ExpressionValue';

describe('ExpressionValue', () => {
    describe('Behavior', () => {
        it('Should accept strict expression values and explicit node-list carriers.', () => {
            const scalar = Complex.one();
            const nodeList = AST.nodeListFirst(Complex.one() as unknown as NodeInput);
            const throwError = jest.fn((message: string) => {
                throw new Error(message);
            });

            expect(expressionValue(scalar, 'x', 'Value', throwError)).toBe(scalar);
            expect(expressionValue(nodeList, 'result', 'Value', throwError)).toBe(nodeList);
            expect(throwError).not.toHaveBeenCalled();
        });

        it('Should reject non-expression AST nodes with caller-owned diagnostics.', () => {
            const throwError = jest.fn((message: string) => {
                throw new Error(message);
            });

            expect(() => expressionValue(AST.nodeReturn(), 'x', 'Value', throwError)).toThrow("Value 'x' is not an expression.");
            expect(() => expressionValues([AST.nodeReturn()], 'arg', 'Argument value', throwError)).toThrow("Argument value 'arg1' is not an expression.");
        });

        it('Should require runtime values at runtime expression boundaries.', () => {
            const scalar = Complex.one();
            const nodeList = AST.nodeListFirst(scalar as unknown as NodeInput);
            const throwError = jest.fn((message: string) => {
                throw new Error(message);
            });

            expect(runtimeExpressionValue(scalar, 'x', 'Value', throwError)).toBe(scalar);
            expect(runtimeExpressionValues([scalar], 'arg', 'Argument value', throwError)).toEqual([scalar]);
            expect(() => runtimeExpressionValue(nodeList, 'result', 'Value', throwError)).toThrow("Value 'result' is not a runtime value.");
        });

        it('Should optionally narrow candidates to runtime expression values.', () => {
            const scalar = Complex.one();
            const nodeList = AST.nodeListFirst(scalar as unknown as NodeInput);

            expect(optionalRuntimeExpressionValue(scalar)).toBe(scalar);
            expect(optionalRuntimeExpressionValue(nodeList)).toBeUndefined();
            expect(optionalRuntimeExpressionValue(AST.nodeReturn())).toBeUndefined();
        });
    });
});
