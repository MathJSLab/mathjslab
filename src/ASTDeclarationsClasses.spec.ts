import { AST, type NodeArgumentValidationName, type NodeDeclarationElement, type StrictNodeExpr } from './AST';

describe('Typed declaration and class AST boundaries', () => {
    const invalidExpression = (): StrictNodeExpr => AST.nodeListFirst(AST.nodeIdentifier('value')) as unknown as StrictNodeExpr;

    it('Should retain typed argument-validation children and parent links.', () => {
        const name = AST.nodeIndirectRef(AST.nodeIdentifier('options'), 'Mode');
        const size = AST.nodeIdentifier('n');
        const className = AST.nodeIdentifier('string');
        const validator = AST.nodeIdentifier('mustBeMember');
        const defaultValue = AST.nodeString('auto');
        const validation = AST.nodeArgumentValidation(name, AST.nodeListFirst(size), className, AST.nodeListFirst(validator), defaultValue);

        expect(validation.name).toBe(name);
        expect(validation.class).toBe(className);
        expect(validation.default).toBe(defaultValue);
        expect(name.parent).toBe(validation);
        expect(size.parent).toBe(validation);
        expect(className.parent).toBe(validation);
        expect(validator.parent).toBe(validation);
        expect(defaultValue.parent).toBe(validation);
    });

    it('Should reject invalid argument names, classes, validators, and defaults.', () => {
        const invalidName = AST.nodeNumber('1') as unknown as NodeArgumentValidationName;
        const statement = AST.nodeReturn() as unknown as StrictNodeExpr;

        expect(() => AST.nodeArgumentValidation(invalidName, AST.nodeListFirst(), null, AST.nodeListFirst())).toThrow('argument validation name is not an expression node.');
        expect(() => AST.nodeArgumentValidation(AST.nodeIdentifier('value'), AST.nodeListFirst(), AST.nodeReturn(), AST.nodeListFirst())).toThrow(
            'argument validation class has invalid node type.',
        );
        expect(() => AST.nodeArgumentValidation(AST.nodeIdentifier('value'), AST.nodeListFirst(), null, AST.nodeListFirst(AST.nodeReturn()))).toThrow(
            'argument validation function 1 is not an expression node.',
        );
        expect(() => AST.nodeArgumentValidation(AST.nodeIdentifier('value'), AST.nodeListFirst(), null, AST.nodeListFirst(), statement)).toThrow(
            'argument validation default is not an expression node.',
        );
    });

    it('Should retain only declaration elements in global and persistent lists.', () => {
        const declaration = AST.nodeDeclarationFirst('PERSIST');
        const identifier = AST.nodeIdentifier('count');
        const defaulted = AST.nodeDefaultedParameter(AST.nodeIdentifier('step'), AST.nodeNumber('1'));

        AST.nodeAppendDeclaration(declaration, identifier);
        AST.nodeAppendDeclaration(declaration, { node: defaulted });

        expect(declaration.list).toEqual([identifier, defaulted]);
        expect(identifier.parent).toBe(declaration);
        expect(defaulted.parent).toBe(declaration);
        expect(() => AST.nodeAppendDeclaration(declaration, AST.nodeReturn() as unknown as NodeDeclarationElement)).toThrow('declaration entry has invalid node type.');
    });

    it('Should enforce strict class attributes and property defaults.', () => {
        const attributeValue = AST.nodeIdentifier('private');
        const attribute = AST.nodeClassAttribute(AST.nodeIdentifier('Access'), attributeValue);
        const defaultValue = AST.nodeNumber('3');
        const property = AST.nodeClassProperty(
            AST.nodeIdentifier('value'),
            AST.nodeListFirst(AST.nodeNumber('1')),
            AST.nodeIdentifier('double'),
            AST.nodeListFirst(AST.nodeIdentifier('mustBeFinite')),
            defaultValue,
        );

        expect(attribute.value).toBe(attributeValue);
        expect(attributeValue.parent).toBe(attribute);
        expect(property.defaultValue).toBe(defaultValue);
        expect(property.validation.default).toBe(defaultValue);
        expect(defaultValue.parent).toBe(property.validation);
        expect(() => AST.nodeClassAttribute(AST.nodeIdentifier('Access'), invalidExpression())).toThrow('class attribute value is not an expression node.');
        expect(() => AST.nodeClassProperty(AST.nodeIdentifier('value'), AST.nodeListFirst(), null, AST.nodeListFirst(), invalidExpression())).toThrow(
            'argument validation default is not an expression node.',
        );
    });

    it('Should enforce strict anonymous-function bodies.', () => {
        const parameter = AST.nodeIdentifier('x');
        const body = AST.nodeOperation('+', AST.nodeIdentifier('x'), AST.nodeNumber('1'));
        const handle = AST.nodeFunctionHandle(null, AST.nodeListFirst(parameter), body);

        expect(handle.expression).toBe(body);
        expect(parameter.parent).toBe(handle);
        expect(body.parent).toBe(handle);
        expect(() => AST.nodeFunctionHandle(null, AST.nodeListFirst(), invalidExpression())).toThrow('function handle expression is not an expression node.');
    });
});
