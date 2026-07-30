/// <reference types="jest" />
import type { RuntimeDisplay, RuntimeEvaluationContext } from './RuntimeDisplay';

describe('RuntimeDisplay unit test.', () => {
    it('Should describe the minimal display contract used by runtime values.', () => {
        const display: RuntimeDisplay = {
            precedenceTable: { '+': 10 },
            Unparse: (value: unknown): string => String(value),
            UnparserMathML: (value: unknown): string => `<mn>${String(value)}</mn>`,
        };

        expect(display.precedenceTable['+']).toBe(10);
        expect(display.Unparse(42)).toBe('42');
        expect(display.UnparserMathML(42)).toBe('<mn>42</mn>');
    });

    it('Should describe the minimal evaluation context contract.', () => {
        const expanded: unknown[] = [];
        const context: RuntimeEvaluationContext = {
            precedenceTable: {},
            Unparse: (value: unknown): string => String(value),
            UnparserMathML: (value: unknown): string => String(value),
            Evaluator: (value: unknown): unknown => value,
            context: {
                pushCommaListExpansion: jest.fn(),
                popCommaListExpansion: jest.fn(),
                expandCommaSeparatedList: (value: unknown): unknown[] => {
                    expanded.push(value);
                    return [value];
                },
            },
        };

        expect(context.Evaluator('x')).toBe('x');
        expect(context.context.expandCommaSeparatedList('a')).toEqual(['a']);
        expect(expanded).toEqual(['a']);
    });
});
