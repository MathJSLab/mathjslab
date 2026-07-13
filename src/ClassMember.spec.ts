/// <reference types="jest" />
import { AST, CharString } from './AST';
import { ClassMember } from './ClassMember';

describe('ClassMember', () => {
    describe('Behavior', () => {
        it('Should read class member attributes.', () => {
            const attributes = [
                AST.nodeClassAttribute(AST.nodeIdentifier('Static')),
                AST.nodeClassAttribute(AST.nodeIdentifier('Access'), AST.nodeIdentifier('private')),
                AST.nodeClassAttribute(AST.nodeIdentifier('Name'), new CharString('value')),
            ];
            const table = (AST as any).nodeClassAttributeTable(attributes);

            expect(ClassMember.hasAttribute(table, 'Static')).toBe(true);
            expect(ClassMember.hasAttribute(table, 'Constant')).toBe(false);
            expect(ClassMember.accessFromAttributes(table)).toBe('private');
            expect(ClassMember.attributeValue(table.Name[0])).toBe('value');
        });

        it('Should default access to public.', () => {
            const table = (AST as any).nodeClassAttributeTable([]);

            expect(ClassMember.accessFromAttributes(table)).toBe('public');
        });
    });
});
