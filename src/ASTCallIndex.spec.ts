import { AST, type ExpressionBoundaryValue, type StrictNodeExpr } from './AST';

describe('Typed call, indexing, and operator AST boundaries', () => {
    const listCarrier = (): ExpressionBoundaryValue => AST.nodeListFirst(AST.nodeIdentifier('value'));
    const invalidExpression = (): StrictNodeExpr => listCarrier() as unknown as StrictNodeExpr;

    it('Should retain strict receivers, arguments, delimiters, and parent/index links.', () => {
        const receiver = AST.nodeIdentifier('values');
        const first = AST.nodeIdentifier('firstIndex');
        const second = AST.nodeIdentifier('index');
        const index = AST.nodeIndexExpr(receiver, AST.nodeList([first, second]), '{}');

        expect(index.expr).toBe(receiver);
        expect(index.args).toEqual([first, second]);
        expect(index.delim).toBe('{}');
        expect(receiver.parent).toBe(index);
        expect(first.parent).toBe(index);
        expect(first.index).toBe(0);
        expect(second.parent).toBe(index);
        expect(second.index).toBe(1);
        expect(index.omitOutput).toBe(false);
    });

    it('Should retain strict superclass, range, and indirect-reference expressions.', () => {
        const instance = AST.nodeIdentifier('object');
        const superclass = AST.nodeIdentifier('Base');
        const argument = AST.nodeIdentifier('value');
        const constructor = AST.nodeSuperclassConstructor(instance, superclass, AST.nodeListFirst(argument));
        const range = AST.nodeRange(AST.nodeNumber('1'), AST.nodeNumber('10'), AST.nodeNumber('2'));
        const dynamicField = AST.nodeIdentifier('fieldName');
        const reference = AST.nodeIndirectRef(AST.nodeIdentifier('record'), dynamicField);

        expect(instance.parent).toBe(constructor);
        expect(superclass.parent).toBe(constructor);
        expect(argument.parent).toBe(constructor);
        expect(range.start_.parent).toBe(range);
        expect(range.stop_.parent).toBe(range);
        expect(range.stride_?.parent).toBe(range);
        expect(reference.field).toEqual([dynamicField]);
        expect(dynamicField.parent).toBe(reference);
    });

    it('Should reject NodeList carriers in strict call and indexing positions.', () => {
        expect(() => AST.nodeIndexExpr(invalidExpression())).toThrow('indexed expression is not an expression node.');
        expect(() => AST.nodeSuperclassConstructor(invalidExpression(), AST.nodeIdentifier('Base'))).toThrow('superclass constructor instance is not an expression node.');
        expect(() => AST.nodeRange(invalidExpression(), AST.nodeNumber('2'))).toThrow('range start is not an expression node.');
        expect(() => AST.nodeRange(AST.nodeNumber('1'), invalidExpression())).toThrow('range stop is not an expression node.');
        expect(() => AST.nodeRange(AST.nodeNumber('1'), AST.nodeNumber('2'), invalidExpression())).toThrow('range stride is not an expression node.');
        expect(() => AST.nodeIndirectRef(invalidExpression(), 'field')).toThrow('indirect reference object is not an expression node.');
        expect(() => AST.nodeIndirectRef(AST.nodeIdentifier('object'), invalidExpression())).toThrow('indirect reference field is not an expression node.');
    });

    it('Should distinguish regular binary expressions from assignments.', () => {
        const addition = AST.nodeOperation('+', AST.nodeIdentifier('left'), AST.nodeIdentifier('right'));
        const assignment = AST.nodeOperation('=', AST.nodeIdentifier('target'), listCarrier());

        expect(AST.isNodeBinaryExpressionOperation(addition)).toBe(true);
        expect(AST.isNodeAssignmentOperation(addition)).toBe(false);
        expect(AST.isNodeAssignmentOperation(assignment)).toBe(true);
        expect(AST.isNodeBinaryExpressionOperation(assignment)).toBe(false);
        expect(() => AST.nodeOperation('+', AST.nodeIdentifier('left'), invalidExpression())).toThrow('right operand for + is not an expression node.');
    });

    it('Should reject statements in unary and binary operand positions.', () => {
        const statement = AST.nodeReturn() as unknown as StrictNodeExpr;

        expect(() => AST.nodeOperation('~', statement)).toThrow('operand for ~ is not an expression node.');
        expect(() => AST.nodeOperation('+', statement, AST.nodeNumber('1'))).toThrow('left operand for + is not an expression node.');
        expect(() => AST.nodeOperation('+', AST.nodeNumber('1'), statement)).toThrow('right operand for + is not an expression node.');
    });
});
