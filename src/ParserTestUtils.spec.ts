/// <reference types="jest" />
import { AST } from './AST';
import { Interpreter } from './Interpreter';
import { executeList, parseClassDefinition, parseList, requireNodeList } from './ParserTestUtils';

describe('ParserTestUtils unit test.', () => {
    it('Should require NodeList values with useful diagnostics.', () => {
        expect(requireNodeList(AST.nodeListFirst()).type).toBe('LIST');
        expect(() => requireNodeList(AST.nodeIdentifier('x'), 'custom message')).toThrow('custom message');
    });

    it('Should parse top-level statements as a NodeList.', () => {
        const list = parseList('x = 1; y = 2;');

        expect(list.type).toBe('LIST');
        expect(list.list).toHaveLength(2);
    });

    it('Should execute snippets and return the top-level NodeList.', () => {
        const list = executeList(Interpreter.Create(), 'x = 1;');

        expect(list.type).toBe('LIST');
        expect(list.list).toHaveLength(1);
    });

    it('Should parse classdef snippets and return the class node.', () => {
        const node = parseClassDefinition('classdef ParserTestUtilsExample\nend');

        expect(node.type).toBe('CLASSDEF');
        expect(node.id).toBe('ParserTestUtilsExample');
    });
});
