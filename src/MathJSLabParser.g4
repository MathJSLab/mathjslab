parser grammar MathJSLabParser;

options { tokenVocab = MathJSLabLexer; }

@header {

import type {
    OperatorType,
    ExpressionBoundaryValue,
    NodeInput,
    NodeIdentifier,
    NodeEndRange,
    NodeMetaClass,
    NodeColon,
    NodeIgnoredTarget,
    NodeOperation,
    NodeIndexExpr,
    NodeSuperclassConstructor,
    NodeIndirectRef,
    NodeRange,
    NodeFunctionDefinition,
    NodeFunctionParameter,
    NodeFunctionReturn,
    NodeDeclarationElement,
    NodeList,
    NodeArgumentValidation,
    NodeArguments,
    NodeImport,
    NodeIf,
    NodeElseIf,
    NodeElse,
    NodeSwitch,
    NodeSwitchCase,
    NodeWhile,
    NodeDoUntil,
    NodeFor,
    NodeSpmd,
    NodeTry,
    NodeUnwindProtect,
    NodeClassDef,
    NodeClassSection,
    NodeClassProperty,
    NodeClassEvent,
    NodeClassEnumeration,
    NodeClassAttribute,
} from './AST';
import type { ComplexType } from './Complex';
import type { FunctionHandle } from './FunctionHandle';
import type { MultiArray } from './MultiArray';
import type { CharString, StringQuoteCharacter } from './CharString';
import { AST } from './AST';

type ParserConstantNode = ComplexType | CharString | NodeEndRange;
type ParserPrimaryExpressionNode = NodeIdentifier | ParserConstantNode | FunctionHandle | NodeMetaClass | MultiArray<ExpressionBoundaryValue> | NodeOperation | NodeImport;
type ParserOperatorExpressionNode = ParserPrimaryExpressionNode | NodeOperation | NodeIndexExpr | NodeSuperclassConstructor | NodeIndirectRef;
type ParserSimpleExpressionNode = ParserOperatorExpressionNode | NodeRange;
type ParserExpressionNode = ParserSimpleExpressionNode | FunctionHandle | NodeOperation;
type ParserAssignmentTargetNode = ParserSimpleExpressionNode | MultiArray<ExpressionBoundaryValue>;
type ParserArgumentValidationNameNode = NodeIdentifier | NodeIndirectRef;

/**
 * # MathJSLabParser
 *
 * A parser that recognizes a language syntax like MATLAB®/Octave written in TypeScript.
 *
 * ## References
 * - [MATLAB Operator Precedence](https://www.mathworks.com/help/matlab/matlab_prog/operator-precedence.html)
 * - [Octave lexer](https://github.com/gnu-octave/octave/blob/default/libinterp/parse-tree/lex.ll)
 * - [Octave parser](https://github.com/gnu-octave/octave/blob/default/libinterp/parse-tree/oct-parse.yy)
 * - [An ANTLR4 grammar for MATLAB files.](https://github.com/antlr/grammars-v4/tree/master/matlab)
 * - [mparser](https://www.mathworks.com/matlabcentral/fileexchange/32769-mparser)
 */

}

@members {

    /**
     * Attach source coordinates to one parsed statement node.
     *
     * ANTLR exposes the start token through each rule context, while the next
     * token after a completed statement identifies the last consumed position
     * used by the existing parser diagnostics.
     */
    private markStatementRange(node: NodeInput, statementStart: Token): void {
        node.start = {
            line: statementStart.line,
            column: statementStart.column,
        };
        node.stop = {
            line: this._input.LT(1).column > 0 ? this._input.LT(1).line : this._input.LT(1).line - 1,
            column: this._input.LT(1).column > 0 ? this._input.LT(1).column - 1 : Infinity,
        };
    }

    /**
     * Apply MATLAB/Octave semicolon output suppression to the previous list item.
     */
    private markPreviousStatementOmitOutput(list: NodeList, separatorText?: string): void {
        if (separatorText?.[0] === ';') {
            list.list[list.list.length - 1].omitOutput = true;
        }
    }

}

/**
 * Input (start non-terminal symbol).
 */

input returns [node: NodeInput | null]
    : sep? EOF {
        localctx.node = null;
    }
    | sep? global_list EOF {
        localctx.node = localctx.global_list().node;
    }
    ;

/**
 * Statements and statement lists.
 */

global_list returns [node: NodeList]
    locals [i: number = 0]
    : statement {
        this.markStatementRange(localctx.statement(localctx.i).node, localctx.statement(localctx.i).start);
        localctx.node = AST.nodeListFirst(localctx.statement(localctx.i++).node);
    } (sep statement {
        this.markStatementRange(localctx.statement(localctx.i).node, localctx.statement(localctx.i).start);
        this.markPreviousStatementOmitOutput(localctx.node, localctx.sep(localctx.i - 1).getText());
        localctx.node = AST.appendNodeList(localctx.node, localctx.statement(localctx.i++).node);
    } )* sep? {
        this.markPreviousStatementOmitOutput(localctx.node, localctx.sep(localctx.i - 1)?.getText());
    }
    ;

list returns [node: NodeList]
    locals [i: number = 0]
    : statement {
        this.markStatementRange(localctx.statement(localctx.i).node, localctx.statement(localctx.i).start);
        localctx.node = AST.nodeListFirst(localctx.statement(localctx.i++).node);
    } (sep statement {
        this.markStatementRange(localctx.statement(localctx.i).node, localctx.statement(localctx.i).start);
        this.markPreviousStatementOmitOutput(localctx.node, localctx.sep(localctx.i - 1).getText());
        localctx.node = AST.appendNodeList(localctx.node, localctx.statement(localctx.i++).node);
    } )* sep? {
        this.markPreviousStatementOmitOutput(localctx.node, localctx.sep(localctx.i - 1)?.getText());
    }
    ;

statement returns [node: NodeInput]
    : command {
        localctx.node = localctx.command().node;
    }
    | word_list_cmd {
        localctx.node = localctx.word_list_cmd().node;
    }
    | expression {
        localctx.node = localctx.expression().node;
    }
    ;

/**
 * Word-list command
 * These are not really like expressions since they can't appear on
 * the RHS of an assignment. But they are also not like commands (IF,
 * WHILE, etc.
 */

word_list_cmd returns [node: NodeInput]
    locals [i: number = 0]
    : identifier command_word {
        localctx.node = AST.nodeListFirst(localctx.command_word(localctx.i++).node);
    } (command_word {
        AST.appendNodeList(localctx.node, localctx.command_word(localctx.i++).node);
    } )* {
        localctx.node = AST.nodeCmdWList(localctx.identifier().node, localctx.node);
    }
    ;

command_word returns [node: CharString]
    : string {
        localctx.node = localctx.string_().node;
    }
    ;

/**
 * Expressions
 */

identifier returns [node: NodeIdentifier]
    : IDENTIFIER {
        localctx.node = AST.nodeIdentifier(localctx.IDENTIFIER().getText());
    }
    | PROPERTIES {
        localctx.node = AST.nodeIdentifier('properties');
    }
    | METHODS {
        localctx.node = AST.nodeIdentifier('methods');
    }
    | EVENTS {
        localctx.node = AST.nodeIdentifier('events');
    }
    | ENUMERATION {
        localctx.node = AST.nodeIdentifier('enumeration');
    }
    ;

qualified_identifier_part returns [text: string]
    : identifier {
        localctx.text = localctx.identifier().node.id;
    }
    | END {
        localctx.text = 'end';
    }
    ;

qualified_identifier returns [node: NodeIdentifier]
    locals [i: number = 1]
    : qualified_identifier_part {
        localctx.node = AST.nodeIdentifier(localctx.qualified_identifier_part(0).text);
    } (DOT qualified_identifier_part {
        localctx.node = AST.nodeIdentifier(localctx.node.id + '.' + localctx.qualified_identifier_part(localctx.i++).text);
    })*
    ;

string returns [node: CharString]
    : STRING {
        const str = localctx.STRING().getText();
        localctx.node = AST.nodeString(str.substring(1, str.length - 1), str[0] as StringQuoteCharacter);
    }
    | UNQUOTED_STRING {
        localctx.node = AST.nodeString(localctx.UNQUOTED_STRING().getText());
    }
    ;

number returns [node: ComplexType]
    : FLOAT_NUMBER {
        localctx.node = AST.nodeNumber(localctx.FLOAT_NUMBER().getText());
    }
    ;

end_range returns [node: NodeEndRange]
    : ENDRANGE {
        localctx.node = AST.nodeEndRange();
    }
    ;

constant returns [node: ParserConstantNode]
    : number {
        localctx.node = localctx.number_().node;
    }
    | string {
        localctx.node = localctx.string_().node;
    }
    | end_range {
        localctx.node = localctx.end_range().node;
    }
    ;

matrix returns [node: MultiArray<ExpressionBoundaryValue>]
    locals [i: number = 0]
    : LBRACKET RBRACKET {
        localctx.node = AST.emptyArray();
    }
    | LBRACKET (SEMICOLON | nl)* matrix_row? {
        localctx.node = AST.nodeFirstRow(localctx.matrix_row(localctx.i) ? localctx.matrix_row(localctx.i++).node : null);
    } ( (SEMICOLON | nl)+ matrix_row? {
        localctx.node = AST.nodeAppendRow(localctx.node, localctx.matrix_row(localctx.i) ? localctx.matrix_row(localctx.i++).node : null);
    } )* RBRACKET
    | LCURLYBR RCURLYBR {
        localctx.node = AST.emptyArray(true);
    }
    | LCURLYBR (SEMICOLON | nl)* matrix_row? {
        localctx.node = AST.nodeFirstRow(localctx.matrix_row(localctx.i) ? localctx.matrix_row(localctx.i++).node : null, true);
    } ( (SEMICOLON | nl)+ matrix_row? {
        localctx.node = AST.nodeAppendRow(localctx.node, localctx.matrix_row(localctx.i) ? localctx.matrix_row(localctx.i++).node : null);
    } )* RCURLYBR
    ;

matrix_row returns [node: NodeList | null]
    locals [i: number = 0]
    : (COMMA | WSPACE) {
        localctx.node = null;
    }
    | (COMMA | WSPACE)? list_element {
        localctx.node = AST.nodeListFirst(localctx.list_element(localctx.i++).node);
    } ( (COMMA | WSPACE) list_element {
        localctx.node = AST.appendNodeList(localctx.node, localctx.list_element(localctx.i++).node);
    } )* (COMMA | WSPACE)?
    ;

fcn_handle returns [node: FunctionHandle]
    : COMMAT qualified_identifier {
        localctx.node = AST.nodeFunctionHandle(localctx.qualified_identifier().node);
    }
    ;

meta_class returns [node: NodeMetaClass]
    : QUESTION qualified_identifier {
        localctx.node = AST.nodeMetaClass(localctx.qualified_identifier().node);
    }
    ;

anon_fcn_handle returns [node: FunctionHandle]
    : COMMAT param_list expression {
        localctx.node = AST.nodeFunctionHandle(null, localctx.param_list().node, localctx.expression().node);
    }
    ;

primary_expr returns [node: ParserPrimaryExpressionNode]
    : identifier {
        localctx.node = localctx.identifier().node;
    }
    | IMPORT {
        localctx.node = AST.nodeImport();
    }
    | constant {
        localctx.node = localctx.constant().node;
    }
    | fcn_handle {
        localctx.node = localctx.fcn_handle().node;
    }
    | meta_class {
        localctx.node = localctx.meta_class().node;
    }
    | matrix {
        localctx.node = localctx.matrix().node;
    }
    | LPAREN expression RPAREN {
        localctx.node = AST.nodeOperation('()', localctx.expression().node);
    }
    ;

magic_colon returns [node: NodeColon]
    : COLON {
        localctx.node = AST.nodeColon();
    }
    ;

magic_tilde returns [node: NodeIgnoredTarget]
    : TILDE {
        localctx.node = AST.nodeIgnoredTarget();
    }
    ;

list_element returns [node: ParserExpressionNode | NodeColon | NodeIgnoredTarget]
    : expression {
        localctx.node = localctx.expression().node;
    }
    | magic_colon {
        localctx.node = localctx.magic_colon().node;
    }
    | magic_tilde {
        localctx.node = localctx.magic_tilde().node;
    }
    ;

arg_list returns [node: NodeList]
    locals [i: number = 0]
    : list_element {
        localctx.node = AST.nodeListFirst(localctx.list_element(localctx.i++).node);
    } ( COMMA list_element {
        localctx.node = AST.appendNodeList(localctx.node, localctx.list_element(localctx.i++).node);
    } )*
    ;

oper_expr returns [node: ParserOperatorExpressionNode]
    : primary_expr {
        localctx.node = localctx.primary_expr().node;
    }
    | oper_expr op = (PLUS_PLUS | MINUS_MINUS) {
        localctx.node = AST.nodeOperation('_' + localctx._op.text as OperatorType, localctx.oper_expr(0).node);
    }
    | oper_expr LPAREN arg_list? RPAREN {
        localctx.node = AST.nodeIndexExpr(localctx.oper_expr(0).node, localctx.arg_list() ? localctx.arg_list().node : null, '()');
    }
    | oper_expr LCURLYBR arg_list? RCURLYBR {
        localctx.node = AST.nodeIndexExpr(localctx.oper_expr(0).node, localctx.arg_list() ? localctx.arg_list().node : null, '{}');
    }
    | oper_expr COMMAT qualified_identifier LPAREN arg_list? RPAREN {
        localctx.node = AST.nodeSuperclassConstructor(localctx.oper_expr(0).node, localctx.qualified_identifier().node, localctx.arg_list() ? localctx.arg_list().node : null);
    }
    | oper_expr op = (TRANSPOSE | HERMITIAN) {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node);
    }
    | oper_expr DOT qualified_identifier_part {
        localctx.node = AST.nodeIndirectRef(localctx.oper_expr(0).node, localctx.qualified_identifier_part().text);
    }
    | oper_expr DOT LPAREN expression RPAREN {
        localctx.node = AST.nodeIndirectRef(localctx.oper_expr(0).node, localctx.expression().node);
    }
    | oper_expr op = (POW | EPOW) power_expr {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.power_expr().node);
    }
    | op = (PLUS_PLUS | MINUS_MINUS | PLUS | MINUS) oper_expr {
        localctx.node = AST.nodeOperation(localctx._op.text + '_' as OperatorType, localctx.oper_expr(0).node);
    }
    | op = (TILDE | EXCLAMATION) oper_expr {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node);
    }
    | oper_expr op = (MUL | DIV | LEFTDIV | EMUL | EDIV | ELEFTDIV) oper_expr {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.oper_expr(1).node);
    }
    | oper_expr op = (PLUS | MINUS) oper_expr {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.oper_expr(1).node);
    }
    ;

power_expr returns [node: ParserOperatorExpressionNode]
    : primary_expr {
        localctx.node = localctx.primary_expr().node;
    }
    | power_expr op = (PLUS_PLUS | MINUS_MINUS) {
        localctx.node = AST.nodeOperation('_' + localctx._op.text as OperatorType, localctx.power_expr().node);
    }
    | power_expr LPAREN arg_list? RPAREN {
        localctx.node = AST.nodeIndexExpr(localctx.power_expr().node, localctx.arg_list() ? localctx.arg_list().node : null, '()');
    }
    | power_expr LCURLYBR arg_list? RCURLYBR {
        localctx.node = AST.nodeIndexExpr(localctx.power_expr().node, localctx.arg_list() ? localctx.arg_list().node : null, '{}');
    }
    | power_expr COMMAT qualified_identifier LPAREN arg_list? RPAREN {
        localctx.node = AST.nodeSuperclassConstructor(localctx.power_expr().node, localctx.qualified_identifier().node, localctx.arg_list() ? localctx.arg_list().node : null);
    }
    | power_expr DOT qualified_identifier_part {
        localctx.node = AST.nodeIndirectRef(localctx.power_expr().node, localctx.qualified_identifier_part().text);
    }
    | power_expr DOT LPAREN expression RPAREN {
        localctx.node = AST.nodeIndirectRef(localctx.power_expr().node, localctx.expression().node);
    }
    | op = (PLUS_PLUS | MINUS_MINUS | PLUS | MINUS) power_expr {
        localctx.node = AST.nodeOperation(localctx._op.text + '_' as OperatorType, localctx.power_expr().node);
    }
    | op = (TILDE | EXCLAMATION) power_expr {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.power_expr().node);
    }
    ;

colon_expr returns [node: NodeRange]
    : oper_expr COLON oper_expr (COLON oper_expr)? {
        if (localctx.oper_expr(2)) {
            localctx.node = AST.nodeRange(localctx.oper_expr(0).node, localctx.oper_expr(2).node, localctx.oper_expr(1).node);
        } else {
            localctx.node = AST.nodeRange(localctx.oper_expr(0).node, localctx.oper_expr(1).node);
        }
    }
    ;

simple_expr returns [node: ParserSimpleExpressionNode]
    : oper_expr {
        localctx.node = localctx.oper_expr().node;
    }
    | colon_expr {
        localctx.node = localctx.colon_expr().node;
    }
    | simple_expr op = (EXPR_LT | EXPR_LE | EXPR_GT | EXPR_GE | EXPR_EQ | EXPR_NE) simple_expr {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
    }
    | simple_expr op = EXPR_AND simple_expr {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
    }
    | simple_expr op = EXPR_OR simple_expr {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
    }
    | simple_expr op = EXPR_AND_AND simple_expr {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
    }
    | simple_expr op = EXPR_OR_OR simple_expr {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
    }
    ;

expression returns [node: ParserExpressionNode]
    : simple_expr {
        localctx.node = localctx.simple_expr().node;
    }
    | simple_expr op = (EQ | ADD_EQ | SUB_EQ | MUL_EQ | EMUL_EQ | DIV_EQ | EDIV_EQ | LEFTDIV_EQ | ELEFTDIV_EQ | POW_EQ | EPOW_EQ | AND_EQ | OR_EQ) expression {
        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr().node, localctx.expression().node);
    }
    | anon_fcn_handle {
        localctx.node = localctx.anon_fcn_handle().node;
    }
    ;

assign_lhs returns [node: ParserAssignmentTargetNode]
    : simple_expr {
        localctx.node = localctx.simple_expr().node;
    }
    | LBRACKET assign_list? RBRACKET {
        localctx.node = AST.nodeFirstRow(localctx.assign_list() ? localctx.assign_list().node : AST.nodeListFirst());
    }
    ;

assign_list returns [node: NodeList]
    locals [i: number = 0]
    : list_element {
        localctx.node = AST.nodeListFirst(localctx.list_element(localctx.i++).node);
    } ( (COMMA | WSPACE) list_element {
        localctx.node = AST.appendNodeList(localctx.node, localctx.list_element(localctx.i++).node);
    } )* (COMMA | WSPACE)?
    ;

/**
 * Commands, declarations, and function definitions.
 */

command returns [node: NodeInput]
    : declaration {
        localctx.node = localctx.declaration().node;
    }
    | import_command {
        localctx.node = localctx.import_command().node;
    }
    | select_command {
        localctx.node = localctx.select_command().node;
    }
    | loop_command {
        localctx.node = localctx.loop_command().node;
    }
    | jump_command {
        localctx.node = localctx.jump_command().node;
    }
    | except_command {
        localctx.node = localctx.except_command().node;
    }
    | function {
        localctx.node = localctx.function_().node;
    }
    | classdef_command {
        localctx.node = localctx.classdef_command().node;
    }
    ;

/**
 * Declaration statements.
 */

declaration returns [node: NodeInput]
    locals [i: number = 0]
    : (GLOBAL {
        localctx.node = AST.nodeDeclarationFirst('GLOBAL');
    } | PERSISTENT {
        localctx.node = AST.nodeDeclarationFirst('PERSIST');
    }) declaration_element {
        localctx.node = AST.nodeAppendDeclaration(localctx.node, localctx.declaration_element(localctx.i++).node);
    } (COMMA? declaration_element {
        localctx.node = AST.nodeAppendDeclaration(localctx.node, localctx.declaration_element(localctx.i++).node);
    })*
    ;

declaration_element returns [node: NodeDeclarationElement]
    : identifier {
        localctx.node = localctx.identifier().node;
    }
    | identifier '=' expression {
        localctx.node = AST.nodeDefaultedParameter(localctx.identifier().node, localctx.expression().node);
    }
    ;

/**
 * Import declarations.
 */

import_command returns [node: NodeImport]
    locals [i: number = 0]
    : IMPORT {
        localctx.node = AST.nodeImport();
    } (import_name {
        localctx.node = AST.nodeImportFirst(localctx.import_name(localctx.i++).node);
    } (COMMA? import_name {
        localctx.node = AST.nodeAppendImport(localctx.node, localctx.import_name(localctx.i++).node);
    })*)?
    ;

import_name returns [node: NodeIdentifier]
    : qualified_identifier {
        localctx.node = localctx.qualified_identifier().node;
    }
    | qualified_identifier (DOT MUL | EMUL) {
        localctx.node = AST.nodeIdentifier(localctx.qualified_identifier().node.id + '.*');
    }
    ;

/**
 * Selection statements.
 */

select_command returns [node: NodeInput]
    : if_command {
        localctx.node = localctx.if_command().node;
    }
    | switch_command {
        localctx.node = localctx.switch_command().node;
    }
    ;

/**
 * If statement.
 */

if_command returns [node: NodeIf]
    locals [i: number = 0]
    : IF expression sep? list? {
        localctx.node = AST.nodeIfBegin(localctx.expression().node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
    } (elseif_clause {
        localctx.node = AST.nodeIfAppendElseIf(localctx.node, localctx.elseif_clause(localctx.i++).node);
    })* else_clause? {
        if (localctx.else_clause()) {
            localctx.node = AST.nodeIfAppendElse(localctx.node, localctx.else_clause().node);
        }
    } (END | ENDIF)
    ;

elseif_clause returns [node: NodeElseIf]
    : ELSEIF sep? expression sep? list? {
        localctx.node = AST.nodeElseIf(localctx.expression().node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
    }
    ;

else_clause returns [node: NodeElse]
    : ELSE sep? list? {
        localctx.node = AST.nodeElse(localctx.list() ? localctx.list().node : AST.nodeListFirst());
    }
    ;

/**
 * Switch statement.
 */

switch_command returns [node: NodeSwitch]
    : SWITCH expression sep? switch_case_list? otherwise_case? (END | ENDSWITCH) {
        localctx.node = AST.nodeSwitch(
            localctx.expression().node,
            localctx.switch_case_list() ? localctx.switch_case_list().node : AST.nodeListFirst(),
            localctx.otherwise_case() ? localctx.otherwise_case().node : null,
        );
    }
    ;

switch_case_list returns [node: NodeList]
    locals [i: number = 0]
    : switch_case {
        localctx.node = AST.nodeListFirst(localctx.switch_case(localctx.i++).node);
    } (sep? switch_case {
        localctx.node = AST.appendNodeList(localctx.node, localctx.switch_case(localctx.i++).node);
    })* sep?
    ;

switch_case returns [node: NodeSwitchCase]
    : CASE sep? expression sep? list? {
        localctx.node = AST.nodeSwitchCase(localctx.expression().node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
    }
    ;

otherwise_case returns [node: NodeList]
    : OTHERWISE sep? list? sep? {
        localctx.node = localctx.list() ? localctx.list().node : AST.nodeListFirst();
    }
    ;

/**
 * Loop statements.
 */

loop_command returns [node: NodeInput]
    : while_command {
        localctx.node = localctx.while_command().node;
    }
    | do_until_command {
        localctx.node = localctx.do_until_command().node;
    }
    | for_command {
        localctx.node = localctx.for_command().node;
    }
    | spmd_command {
        localctx.node = localctx.spmd_command().node;
    }
    ;

while_command returns [node: NodeWhile]
    : WHILE expression sep? list? (END | ENDWHILE) {
        localctx.node = AST.nodeWhile(localctx.expression().node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
    }
    ;

do_until_command returns [node: NodeDoUntil]
    : DO sep? list? UNTIL expression {
        localctx.node = AST.nodeDoUntil(localctx.list() ? localctx.list().node : AST.nodeListFirst(), localctx.expression().node);
    }
    ;

for_command returns [node: NodeFor]
    : FOR assign_lhs EQ expression sep? list? (END | ENDFOR) {
        localctx.node = AST.nodeFor(localctx.assign_lhs().node, localctx.expression(0).node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
    }
    | FOR LPAREN assign_lhs EQ expression RPAREN sep? list? (END | ENDFOR) {
        localctx.node = AST.nodeFor(localctx.assign_lhs().node, localctx.expression(0).node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
    }
    | PARFOR assign_lhs EQ expression sep? list? (END | ENDPARFOR) {
        localctx.node = AST.nodeFor(localctx.assign_lhs().node, localctx.expression(0).node, localctx.list() ? localctx.list().node : AST.nodeListFirst(), true);
    }
    | PARFOR LPAREN assign_lhs EQ expression (COMMA expression)? RPAREN sep? list? (END | ENDPARFOR) {
        localctx.node = AST.nodeFor(
            localctx.assign_lhs().node,
            localctx.expression(0).node,
            localctx.list() ? localctx.list().node : AST.nodeListFirst(),
            true,
            localctx.expression(1) ? localctx.expression(1).node : null,
        );
    }
    ;

spmd_command returns [node: NodeSpmd]
    : SPMD spmd_worker_spec? sep? list? (END | ENDSPMD) {
        localctx.node = AST.nodeSpmd(
            localctx.list() ? localctx.list().node : AST.nodeListFirst(),
            localctx.spmd_worker_spec() ? localctx.spmd_worker_spec().node : null,
        );
    }
    ;

spmd_worker_spec returns [node: NodeList]
    locals [i: number = 0]
    : LPAREN expression {
        localctx.node = AST.nodeListFirst(localctx.expression(localctx.i++).node);
    } (COMMA expression {
        localctx.node = AST.appendNodeList(localctx.node, localctx.expression(localctx.i++).node);
    })? RPAREN
    ;

/**
 * Jump statements.
 */

jump_command returns [node: NodeInput]
    : BREAK {
        localctx.node = AST.nodeBreak();
    }
    | CONTINUE {
        localctx.node = AST.nodeContinue();
    }
    | RETURN {
        localctx.node = AST.nodeReturn();
    }
    ;

/**
 * Exception statements.
 */

except_command returns [node: NodeInput]
    : try_command {
        localctx.node = localctx.try_command().node;
    }
    | unwind_command {
        localctx.node = localctx.unwind_command().node;
    }
    ;

try_command returns [node: NodeTry]
    : TRY sep? list? catch_clause (END | END_TRY_CATCH) {
        localctx.node = AST.nodeTry(
            localctx.list() ? localctx.list().node : AST.nodeListFirst(),
            localctx.catch_clause().body,
            localctx.catch_clause().identifierNode,
        );
    }
    | TRY sep? list? (END | END_TRY_CATCH) {
        localctx.node = AST.nodeTry(localctx.list() ? localctx.list().node : AST.nodeListFirst());
    }
    ;

catch_clause returns [body: NodeList, identifierNode: NodeIdentifier | null]
    : CATCH sep? list? {
        localctx.identifierNode = null;
        localctx.body = localctx.list() ? localctx.list().node : AST.nodeListFirst();
        if (!localctx.sep() && localctx.body.list.length > 0 && AST.isNodeIdentifier(localctx.body.list[0])) {
            localctx.identifierNode = localctx.body.list.shift() as NodeIdentifier;
            localctx.body.list.forEach((node, index) => {
                node.index = index;
            });
        }
    }
    ;

unwind_command returns [node: NodeUnwindProtect]
    : UNWIND_PROTECT sep? list? unwind_cleanup_clause (END | END_UNWIND_PROTECT) {
        localctx.node = AST.nodeUnwindProtect(localctx.list() ? localctx.list().node : AST.nodeListFirst(), localctx.unwind_cleanup_clause().node);
    }
    ;

unwind_cleanup_clause returns [node: NodeList]
    : UNWIND_PROTECT_CLEANUP sep? list? {
        localctx.node = localctx.list() ? localctx.list().node : AST.nodeListFirst();
    }
    ;

/**
 * List of function parameters.
 */

param_list returns [node: NodeList]
    locals [i: number = 0]
    : LPAREN {
        localctx.node = AST.nodeListFirst();
    } (param_list_elt {
        localctx.node = AST.appendNodeList(localctx.node, localctx.param_list_elt(localctx.i++).node);
    } (COMMA param_list_elt {
        localctx.node = AST.appendNodeList(localctx.node, localctx.param_list_elt(localctx.i++).node);
    })*)? RPAREN
    ;

param_list_elt returns [node: NodeFunctionParameter]
    : declaration_element {
        localctx.node = localctx.declaration_element().node;
    }
    | magic_tilde {
        localctx.node = localctx.magic_tilde().node;
    }
    ;

/**
 * List of function return value names.
 */

return_list_elt returns [node: NodeFunctionReturn]
    : identifier {
        localctx.node = localctx.identifier().node;
    }
    | magic_tilde {
        localctx.node = localctx.magic_tilde().node;
    }
    ;

return_list returns [node: NodeList]
    locals [i: number = 0]
    : return_list_elt {
        localctx.node = AST.nodeListFirst(localctx.return_list_elt(0).node);
    }
    | LBRACKET {
        localctx.node = AST.nodeListFirst();
    } (return_list_elt {
        localctx.node = AST.appendNodeList(localctx.node, localctx.return_list_elt(localctx.i++).node);
    } ((COMMA | WSPACE) return_list_elt {
        localctx.node = AST.appendNodeList(localctx.node, localctx.return_list_elt(localctx.i++).node);
    })*)? RBRACKET
    ;

/**
 * Function definition.
 */

function returns [node: NodeFunctionDefinition]
    : FUNCTION (return_list EQ)? function_name param_list? sep? arguments_block_list? list? (END | ENDFUNCTION | EOF) {
        localctx.node = AST.nodeFunctionDefinition(
            localctx.function_name().node,
            localctx.return_list() ? localctx.return_list().node : AST.nodeListFirst(),
            localctx.param_list() ? localctx.param_list().node : AST.nodeListFirst(),
            localctx.arguments_block_list() ? localctx.arguments_block_list().node : AST.nodeListFirst(),
            localctx.list() ? localctx.list().node : AST.nodeListFirst(),
        );
    }
    ;

function_name returns [node: NodeIdentifier]
    : qualified_identifier {
        localctx.node = localctx.qualified_identifier().node;
    }
    ;

/**
 * Class definitions.
 */

classdef_command returns [node: NodeClassDef]
    : CLASSDEF class_attribute_list? qualified_identifier class_superclass_list? sep? class_section_list? (END | ENDCLASSDEF | EOF) {
        localctx.node = AST.nodeClassDef(
            localctx.qualified_identifier().node,
            localctx.class_section_list() ? localctx.class_section_list().node : AST.nodeListFirst(),
            localctx.class_attribute_list() ? localctx.class_attribute_list().node : AST.nodeListFirst(),
            localctx.class_superclass_list() ? localctx.class_superclass_list().node : AST.nodeListFirst(),
        );
    }
    ;

class_attribute_list returns [node: NodeList]
    locals [i: number = 0]
    : LPAREN {
        localctx.node = AST.nodeListFirst();
    } (class_attribute {
        localctx.node = AST.appendNodeList(localctx.node, localctx.class_attribute(localctx.i++).node);
    } (COMMA class_attribute {
        localctx.node = AST.appendNodeList(localctx.node, localctx.class_attribute(localctx.i++).node);
    })*)? RPAREN sep?
    ;

class_attribute returns [node: NodeClassAttribute]
    : identifier (EQ expression)? {
        localctx.node = AST.nodeClassAttribute(localctx.identifier().node, localctx.expression() ? localctx.expression().node : null);
    }
    | op = (TILDE | EXCLAMATION) identifier {
        localctx.node = AST.nodeClassAttribute(localctx.identifier().node, AST.nodeOperation(localctx._op.text as OperatorType, localctx.identifier().node));
    }
    ;

class_method_name returns [node: NodeIdentifier]
    locals [i: number = 1]
    : identifier {
        localctx.node = AST.nodeIdentifier(localctx.identifier(0).node.id);
    } (DOT identifier {
        localctx.node = AST.nodeIdentifier(localctx.node.id + '.' + localctx.identifier(localctx.i++).node.id);
    })*
    ;

class_superclass_list returns [node: NodeList]
    locals [i: number = 0]
    : EXPR_LT qualified_identifier {
        localctx.node = AST.nodeListFirst(localctx.qualified_identifier(localctx.i++).node);
    } ((EXPR_AND | COMMA) qualified_identifier {
        localctx.node = AST.appendNodeList(localctx.node, localctx.qualified_identifier(localctx.i++).node);
    })*
    ;

class_section_list returns [node: NodeList]
    locals [i: number = 0]
    : class_section {
        localctx.node = AST.nodeListFirst(localctx.class_section(localctx.i++).node);
    } (sep? class_section {
        localctx.node = AST.appendNodeList(localctx.node, localctx.class_section(localctx.i++).node);
    })* sep?
    ;

class_section returns [node: NodeClassSection]
    : properties_section {
        localctx.node = localctx.properties_section().node;
    }
    | methods_section {
        localctx.node = localctx.methods_section().node;
    }
    | events_section {
        localctx.node = localctx.events_section().node;
    }
    | enumeration_section {
        localctx.node = localctx.enumeration_section().node;
    }
    ;

properties_section returns [node: NodeClassSection]
    : PROPERTIES class_attribute_list? sep? class_property_list? (END | ENDPROPERTIES) {
        localctx.node = AST.nodeClassSection(
            'PROPERTIES',
            localctx.class_property_list() ? localctx.class_property_list().node : AST.nodeListFirst(),
            localctx.class_attribute_list() ? localctx.class_attribute_list().node : AST.nodeListFirst(),
        );
    }
    ;

class_property_list returns [node: NodeList]
    locals [i: number = 0]
    : class_property {
        localctx.node = AST.nodeListFirst(localctx.class_property(localctx.i++).node);
    } (sep class_property {
        localctx.node = AST.appendNodeList(localctx.node, localctx.class_property(localctx.i++).node);
    })* sep?
    ;

class_property returns [node: NodeClassProperty]
    : identifier (LPAREN arg_list RPAREN)? qualified_identifier? (LCURLYBR arg_list RCURLYBR)? (EQ expression)? {
        localctx.node = AST.nodeClassProperty(
            localctx.identifier().node,
            localctx.LPAREN() ? localctx.arg_list(0).node : AST.nodeListFirst(),
            localctx.qualified_identifier() ? localctx.qualified_identifier().node : null,
            localctx.LCURLYBR() ? localctx.arg_list(localctx.LPAREN() ? 1 : 0).node : AST.nodeListFirst(),
            localctx.expression() ? localctx.expression().node : null,
        );
    }
    ;

methods_section returns [node: NodeClassSection]
    : METHODS class_attribute_list? sep? class_method_list? (END | ENDMETHODS) {
        localctx.node = AST.nodeClassSection(
            'METHODS',
            localctx.class_method_list() ? localctx.class_method_list().node : AST.nodeListFirst(),
            localctx.class_attribute_list() ? localctx.class_attribute_list().node : AST.nodeListFirst(),
        );
    }
    ;

class_method returns [node: NodeFunctionDefinition]
    : function {
        localctx.node = localctx.function_().node;
    }
    | class_method_name param_list? {
        localctx.node = AST.nodeFunctionDefinition(
            localctx.class_method_name().node,
            AST.nodeListFirst(),
            localctx.param_list() ? localctx.param_list().node : AST.nodeListFirst(),
            AST.nodeListFirst(),
            AST.nodeListFirst(),
        );
        localctx.node.attributes = { ...(localctx.node.attributes ?? {}), prototype: true };
    }
    | return_list EQ class_method_name param_list? {
        localctx.node = AST.nodeFunctionDefinition(
            localctx.class_method_name().node,
            localctx.return_list().node,
            localctx.param_list() ? localctx.param_list().node : AST.nodeListFirst(),
            AST.nodeListFirst(),
            AST.nodeListFirst(),
        );
        localctx.node.attributes = { ...(localctx.node.attributes ?? {}), prototype: true };
    }
    ;

class_method_list returns [node: NodeList]
    locals [i: number = 0]
    : class_method {
        localctx.node = AST.nodeListFirst(localctx.class_method(localctx.i++).node);
    } (sep? class_method {
        localctx.node = AST.appendNodeList(localctx.node, localctx.class_method(localctx.i++).node);
    })* sep?
    ;

events_section returns [node: NodeClassSection]
    : EVENTS class_attribute_list? sep? class_event_list? (END | ENDEVENTS) {
        localctx.node = AST.nodeClassSection(
            'EVENTS',
            localctx.class_event_list() ? localctx.class_event_list().node : AST.nodeListFirst(),
            localctx.class_attribute_list() ? localctx.class_attribute_list().node : AST.nodeListFirst(),
        );
    }
    ;

class_event_list returns [node: NodeList]
    locals [i: number = 0]
    : class_event {
        localctx.node = AST.nodeListFirst(localctx.class_event(localctx.i++).node);
    } (sep? class_event {
        localctx.node = AST.appendNodeList(localctx.node, localctx.class_event(localctx.i++).node);
    })* sep?
    ;

class_event returns [node: NodeClassEvent]
    : identifier {
        localctx.node = AST.nodeClassEvent(localctx.identifier().node);
    }
    ;

enumeration_section returns [node: NodeClassSection]
    : ENUMERATION class_attribute_list? sep? class_enumeration_list? (END | ENDENUMERATION) {
        localctx.node = AST.nodeClassSection(
            'ENUMERATION',
            localctx.class_enumeration_list() ? localctx.class_enumeration_list().node : AST.nodeListFirst(),
            localctx.class_attribute_list() ? localctx.class_attribute_list().node : AST.nodeListFirst(),
        );
    }
    ;

class_enumeration_list returns [node: NodeList]
    locals [i: number = 0]
    : class_enumeration {
        localctx.node = AST.nodeListFirst(localctx.class_enumeration(localctx.i++).node);
    } (sep? class_enumeration {
        localctx.node = AST.appendNodeList(localctx.node, localctx.class_enumeration(localctx.i++).node);
    })* sep?
    ;

class_enumeration returns [node: NodeClassEnumeration]
    : identifier (LPAREN arg_list? RPAREN)? {
        localctx.node = AST.nodeClassEnumeration(localctx.identifier().node, localctx.arg_list() ? localctx.arg_list().node : AST.nodeListFirst());
    }
    ;

arguments_block_list returns [node: NodeList]
    locals [i: number = 0]
    : arguments_block {
        localctx.node = AST.nodeListFirst(localctx.arguments_block(localctx.i++).node);
    } (sep? arguments_block {
        localctx.node = AST.appendNodeList(localctx.node, localctx.arguments_block(localctx.i++).node);
    })* sep?
    ;

arguments_block returns [node: NodeArguments]
    : ARGUMENTS sep? (LPAREN arguments_attribute_list RPAREN sep?)? args_validation_list? sep? (END | ENDARGUMENTS) {
        localctx.node = AST.nodeArguments(
            localctx.arguments_attribute_list() ? localctx.arguments_attribute_list().node : null,
            localctx.args_validation_list() ? localctx.args_validation_list().node : AST.nodeListFirst(),
        );
    }
    ;

arguments_attribute_list returns [node: NodeList]
    locals [i: number = 0]
    : identifier {
        localctx.node = AST.nodeListFirst(localctx.identifier(localctx.i++).node);
    } (COMMA identifier {
        localctx.node = AST.appendNodeList(localctx.node, localctx.identifier(localctx.i++).node);
    })*
    ;

args_validation_list returns [node: NodeList]
    locals [i: number = 0]
    : arg_validation {
        localctx.node = AST.nodeListFirst(localctx.arg_validation(localctx.i++).node);
    } (sep arg_validation {
        localctx.node = AST.appendNodeList(localctx.node, localctx.arg_validation(localctx.i++).node);
    })*
    ;

arg_validation returns [node: NodeArgumentValidation]
    : arg_validation_name (LPAREN arg_list RPAREN)? qualified_identifier? (LCURLYBR arg_list RCURLYBR)? (EQ expression)? {
        localctx.node = AST.nodeArgumentValidation(
            localctx.arg_validation_name().node,
            localctx.LPAREN() ? localctx.arg_list(0).node : AST.nodeListFirst(),
            localctx.qualified_identifier() ? localctx.qualified_identifier().node : AST.nodeListFirst(),
            localctx.LCURLYBR() ? (localctx.LPAREN() ? localctx.arg_list(1).node : localctx.arg_list(0).node) : AST.nodeListFirst(),
            localctx.expression() ? localctx.expression().node : null,
        );
    }
    ;

arg_validation_name returns [node: ParserArgumentValidationNameNode]
    locals [i: number = 1]
    : identifier {
        localctx.node = localctx.identifier(0).node;
    } (DOT identifier {
        localctx.node = AST.nodeIndirectRef(localctx.node, localctx.identifier(localctx.i++).node.id);
    })*
    ;

/**
 * Separators and others.
 */

sep_no_nl
    : (COMMA | SEMICOLON)+
    ;

nl
    : NEWLINE+
    ;

sep
    : (COMMA | SEMICOLON | NEWLINE)+
    ;
