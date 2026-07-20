import { AST, type NodeClassDef, type NodeInput, type NodeList } from './AST';
import { Interpreter } from './Interpreter';

/**
 * Typed parser and execution helpers for compatibility fixtures.
 *
 * These helpers keep tests from reaching into broad `NodeInput` shapes with
 * unchecked casts. A failing fixture should fail with an explicit structural
 * expectation, not with an accidental property read on the wrong AST node.
 */

/**
 * Require a value to be a top-level node list.
 *
 * @param value Value to validate.
 * @param message Error text used when the value is not a list.
 * @returns Validated AST list.
 */
const requireNodeList = (value: NodeInput, message = 'Expected value to be a top-level list.'): NodeList => {
    if (!AST.isNodeList(value)) {
        throw new Error(message);
    }
    return value;
};

/**
 * Parse source text and require the parser result to be a top-level list.
 *
 * @param source Source text to parse.
 * @returns Parsed top-level AST list.
 */
const parseList = (source: string): NodeList => {
    return requireNodeList(Interpreter.Create().Parse(source), 'Expected parser result to be a top-level list.');
};

/**
 * Execute source text and require the result to be a top-level list.
 *
 * @param interpreter Interpreter instance used for execution.
 * @param source Source text to execute.
 * @returns Evaluated top-level result list.
 */
const executeList = (interpreter: Interpreter, source: string): NodeList => {
    return requireNodeList(interpreter.Execute(source), 'Expected execution result to be a top-level list.');
};

/**
 * Parse a class definition fixture and return its first classdef node.
 *
 * @param source Classdef source text.
 * @returns Parsed class definition node.
 */
const parseClassDefinition = (source: string): NodeClassDef => {
    const node = parseList(source).list[0];
    if (!AST.isNodeClassDef(node)) {
        throw new Error('Expected first parsed node to be a classdef.');
    }
    return node;
};

export { executeList, parseClassDefinition, parseList, requireNodeList };
