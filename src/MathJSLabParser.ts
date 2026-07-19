// Generated from ./src/MathJSLabParser.g4 by ANTLR 4.13.2
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import {
    ATN,
    ATNDeserializer,
    DecisionState,
    DFA,
    FailedPredicateException,
    RecognitionException,
    NoViableAltException,
    BailErrorStrategy,
    Parser,
    ParserATNSimulator,
    RuleContext,
    ParserRuleContext,
    PredictionMode,
    PredictionContextCache,
    TerminalNode,
    RuleNode,
    Token,
    TokenStream,
    Interval,
    IntervalSet,
} from 'antlr4';
// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;

import type {
    OperatorType,
    NodeInput,
    NodeExpr,
    NodeIdentifier,
    NodeFunctionDefinition,
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
import type { StringQuoteCharacter } from './CharString';
import { AST } from './AST';

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

export default class MathJSLabParser extends Parser {
    public static readonly GLOBAL = 1;
    public static readonly PERSISTENT = 2;
    public static readonly IMPORT = 3;
    public static readonly IF = 4;
    public static readonly ENDIF = 5;
    public static readonly END = 6;
    public static readonly ENDRANGE = 7;
    public static readonly ELSEIF = 8;
    public static readonly ELSE = 9;
    public static readonly SWITCH = 10;
    public static readonly ENDSWITCH = 11;
    public static readonly CASE = 12;
    public static readonly OTHERWISE = 13;
    public static readonly WHILE = 14;
    public static readonly ENDWHILE = 15;
    public static readonly DO = 16;
    public static readonly UNTIL = 17;
    public static readonly FOR = 18;
    public static readonly ENDFOR = 19;
    public static readonly PARFOR = 20;
    public static readonly ENDPARFOR = 21;
    public static readonly SPMD = 22;
    public static readonly ENDSPMD = 23;
    public static readonly BREAK = 24;
    public static readonly CONTINUE = 25;
    public static readonly RETURN = 26;
    public static readonly FUNCTION = 27;
    public static readonly ENDFUNCTION = 28;
    public static readonly TRY = 29;
    public static readonly CATCH = 30;
    public static readonly END_TRY_CATCH = 31;
    public static readonly UNWIND_PROTECT = 32;
    public static readonly UNWIND_PROTECT_CLEANUP = 33;
    public static readonly END_UNWIND_PROTECT = 34;
    public static readonly CLASSDEF = 35;
    public static readonly ENDCLASSDEF = 36;
    public static readonly ENUMERATION = 37;
    public static readonly ENDENUMERATION = 38;
    public static readonly PROPERTIES = 39;
    public static readonly ENDPROPERTIES = 40;
    public static readonly EVENTS = 41;
    public static readonly ENDEVENTS = 42;
    public static readonly METHODS = 43;
    public static readonly ENDMETHODS = 44;
    public static readonly WSPACE = 45;
    public static readonly STRING = 46;
    public static readonly ARGUMENTS = 47;
    public static readonly ENDARGUMENTS = 48;
    public static readonly PLUS = 49;
    public static readonly MINUS = 50;
    public static readonly MUL = 51;
    public static readonly DIV = 52;
    public static readonly EQ = 53;
    public static readonly COLON = 54;
    public static readonly SEMICOLON = 55;
    public static readonly COMMA = 56;
    public static readonly DOT = 57;
    public static readonly TILDE = 58;
    public static readonly EXCLAMATION = 59;
    public static readonly COMMAT = 60;
    public static readonly QUESTION = 61;
    public static readonly LPAREN = 62;
    public static readonly RPAREN = 63;
    public static readonly LBRACKET = 64;
    public static readonly RBRACKET = 65;
    public static readonly LCURLYBR = 66;
    public static readonly RCURLYBR = 67;
    public static readonly LEFTDIV = 68;
    public static readonly ADD_EQ = 69;
    public static readonly SUB_EQ = 70;
    public static readonly MUL_EQ = 71;
    public static readonly DIV_EQ = 72;
    public static readonly LEFTDIV_EQ = 73;
    public static readonly POW_EQ = 74;
    public static readonly EMUL_EQ = 75;
    public static readonly EDIV_EQ = 76;
    public static readonly ELEFTDIV_EQ = 77;
    public static readonly EPOW_EQ = 78;
    public static readonly AND_EQ = 79;
    public static readonly OR_EQ = 80;
    public static readonly EXPR_AND_AND = 81;
    public static readonly EXPR_OR_OR = 82;
    public static readonly EXPR_AND = 83;
    public static readonly EXPR_OR = 84;
    public static readonly EXPR_LT = 85;
    public static readonly EXPR_LE = 86;
    public static readonly EXPR_EQ = 87;
    public static readonly EXPR_NE = 88;
    public static readonly EXPR_GE = 89;
    public static readonly EXPR_GT = 90;
    public static readonly EMUL = 91;
    public static readonly EDIV = 92;
    public static readonly ELEFTDIV = 93;
    public static readonly PLUS_PLUS = 94;
    public static readonly MINUS_MINUS = 95;
    public static readonly POW = 96;
    public static readonly EPOW = 97;
    public static readonly TRANSPOSE = 98;
    public static readonly HERMITIAN = 99;
    public static readonly DQSTRING = 100;
    public static readonly IDENTIFIER = 101;
    public static readonly FLOAT_NUMBER = 102;
    public static readonly NUMBER_DOT_OP = 103;
    public static readonly LINE_CONTINUATION = 104;
    public static readonly SPACE_OR_CONTINUATION = 105;
    public static readonly NEWLINE = 106;
    public static readonly BLOCK_COMMENT_START = 107;
    public static readonly COMMENT_LINE = 108;
    public static readonly INVALID = 109;
    public static readonly SINGLEQ_STRING = 110;
    public static readonly SINGLEQ_NL = 111;
    public static readonly SINGLEQ_SINGLEQ = 112;
    public static readonly SINGLEQ_END = 113;
    public static readonly DOUBLEQ_STRING = 114;
    public static readonly DOUBLEQ_NL = 115;
    public static readonly DOUBLEQ_DOUBLEQ = 116;
    public static readonly DOUBLEQ_ESCAPE = 117;
    public static readonly DOUBLEQ_ESCAPE_OTHER = 118;
    public static readonly DOUBLEQ_ESCAPE_OCT = 119;
    public static readonly DOUBLEQ_ESCAPE_HEX = 120;
    public static readonly DOUBLEQ_ESCAPE_UNICODE = 121;
    public static readonly DOUBLEQ_END = 122;
    public static readonly BLOCK_COMMENT_START_AGAIN = 123;
    public static readonly BLOCK_COMMENT_END = 124;
    public static readonly BLOCK_COMMENT_LINE = 125;
    public static readonly BLOCK_COMMENT_EOF = 126;
    public static readonly COMMAND_LINE_CONTINUATION = 127;
    public static readonly COMMAND_CONTINUED_BLOCK_COMMENT_START = 128;
    public static readonly COMMAND_CONTINUED_COMMENT_LINE = 129;
    public static readonly COMMAND_CONTINUED_NEWLINE = 130;
    public static readonly SKIP_SPACE = 131;
    public static readonly COMMAND_LONE_DQUOTE = 132;
    public static readonly COMMAND_LONE_SQUOTE = 133;
    public static readonly COMMAND_UNCLOSED_DQUOTE = 134;
    public static readonly COMMAND_UNCLOSED_SQUOTE = 135;
    public static readonly COMMAND_DQSTRING = 136;
    public static readonly COMMAND_SQSTRING = 137;
    public static readonly SKIP_COMMENT_LINE = 138;
    public static readonly COMMAND_SEPARATOR = 139;
    public static readonly EXIT_AT_NEWLINE = 140;
    public static readonly EXIT_AT_EOF = 141;
    public static readonly UNQUOTED_STRING = 142;
    public static override readonly EOF = Token.EOF;
    public static readonly RULE_input = 0;
    public static readonly RULE_global_list = 1;
    public static readonly RULE_list = 2;
    public static readonly RULE_statement = 3;
    public static readonly RULE_word_list_cmd = 4;
    public static readonly RULE_command_word = 5;
    public static readonly RULE_identifier = 6;
    public static readonly RULE_qualified_identifier_part = 7;
    public static readonly RULE_qualified_identifier = 8;
    public static readonly RULE_string = 9;
    public static readonly RULE_number = 10;
    public static readonly RULE_end_range = 11;
    public static readonly RULE_constant = 12;
    public static readonly RULE_matrix = 13;
    public static readonly RULE_matrix_row = 14;
    public static readonly RULE_fcn_handle = 15;
    public static readonly RULE_meta_class = 16;
    public static readonly RULE_anon_fcn_handle = 17;
    public static readonly RULE_primary_expr = 18;
    public static readonly RULE_magic_colon = 19;
    public static readonly RULE_magic_tilde = 20;
    public static readonly RULE_list_element = 21;
    public static readonly RULE_arg_list = 22;
    public static readonly RULE_oper_expr = 23;
    public static readonly RULE_power_expr = 24;
    public static readonly RULE_colon_expr = 25;
    public static readonly RULE_simple_expr = 26;
    public static readonly RULE_expression = 27;
    public static readonly RULE_assign_lhs = 28;
    public static readonly RULE_assign_list = 29;
    public static readonly RULE_command = 30;
    public static readonly RULE_declaration = 31;
    public static readonly RULE_declaration_element = 32;
    public static readonly RULE_import_command = 33;
    public static readonly RULE_import_name = 34;
    public static readonly RULE_select_command = 35;
    public static readonly RULE_if_command = 36;
    public static readonly RULE_elseif_clause = 37;
    public static readonly RULE_else_clause = 38;
    public static readonly RULE_switch_command = 39;
    public static readonly RULE_switch_case_list = 40;
    public static readonly RULE_switch_case = 41;
    public static readonly RULE_otherwise_case = 42;
    public static readonly RULE_loop_command = 43;
    public static readonly RULE_while_command = 44;
    public static readonly RULE_do_until_command = 45;
    public static readonly RULE_for_command = 46;
    public static readonly RULE_spmd_command = 47;
    public static readonly RULE_spmd_worker_spec = 48;
    public static readonly RULE_jump_command = 49;
    public static readonly RULE_except_command = 50;
    public static readonly RULE_try_command = 51;
    public static readonly RULE_catch_clause = 52;
    public static readonly RULE_unwind_command = 53;
    public static readonly RULE_unwind_cleanup_clause = 54;
    public static readonly RULE_param_list = 55;
    public static readonly RULE_param_list_elt = 56;
    public static readonly RULE_return_list_elt = 57;
    public static readonly RULE_return_list = 58;
    public static readonly RULE_function = 59;
    public static readonly RULE_function_name = 60;
    public static readonly RULE_classdef_command = 61;
    public static readonly RULE_class_attribute_list = 62;
    public static readonly RULE_class_attribute = 63;
    public static readonly RULE_class_method_name = 64;
    public static readonly RULE_class_superclass_list = 65;
    public static readonly RULE_class_section_list = 66;
    public static readonly RULE_class_section = 67;
    public static readonly RULE_properties_section = 68;
    public static readonly RULE_class_property_list = 69;
    public static readonly RULE_class_property = 70;
    public static readonly RULE_methods_section = 71;
    public static readonly RULE_class_method = 72;
    public static readonly RULE_class_method_list = 73;
    public static readonly RULE_events_section = 74;
    public static readonly RULE_class_event_list = 75;
    public static readonly RULE_class_event = 76;
    public static readonly RULE_enumeration_section = 77;
    public static readonly RULE_class_enumeration_list = 78;
    public static readonly RULE_class_enumeration = 79;
    public static readonly RULE_arguments_block_list = 80;
    public static readonly RULE_arguments_block = 81;
    public static readonly RULE_args_validation_list = 82;
    public static readonly RULE_arg_validation = 83;
    public static readonly RULE_arg_validation_name = 84;
    public static readonly RULE_sep_no_nl = 85;
    public static readonly RULE_nl = 86;
    public static readonly RULE_sep = 87;
    public static readonly literalNames: (string | null)[] = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        "'+'",
        "'-'",
        "'*'",
        "'/'",
        "'='",
        "':'",
        "';'",
        "','",
        "'.'",
        "'~'",
        "'!'",
        "'@'",
        "'?'",
        "'('",
        "')'",
        "'['",
        "']'",
        "'{'",
        "'}'",
        "'\\'",
        "'+='",
        "'-='",
        "'*='",
        "'/='",
        "'\\='",
        null,
        "'.*='",
        "'./='",
        "'.\\='",
        null,
        "'&='",
        "'|='",
        "'&&'",
        "'||'",
        "'&'",
        "'|'",
        "'<'",
        "'<='",
        "'=='",
        null,
        "'>='",
        "'>'",
        "'.*'",
        "'./'",
        "'.\\'",
        "'++'",
        "'--'",
        null,
        null,
        "'.''",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        "''''",
        null,
        null,
        null,
        '\'""\'',
    ];
    public static readonly symbolicNames: (string | null)[] = [
        null,
        'GLOBAL',
        'PERSISTENT',
        'IMPORT',
        'IF',
        'ENDIF',
        'END',
        'ENDRANGE',
        'ELSEIF',
        'ELSE',
        'SWITCH',
        'ENDSWITCH',
        'CASE',
        'OTHERWISE',
        'WHILE',
        'ENDWHILE',
        'DO',
        'UNTIL',
        'FOR',
        'ENDFOR',
        'PARFOR',
        'ENDPARFOR',
        'SPMD',
        'ENDSPMD',
        'BREAK',
        'CONTINUE',
        'RETURN',
        'FUNCTION',
        'ENDFUNCTION',
        'TRY',
        'CATCH',
        'END_TRY_CATCH',
        'UNWIND_PROTECT',
        'UNWIND_PROTECT_CLEANUP',
        'END_UNWIND_PROTECT',
        'CLASSDEF',
        'ENDCLASSDEF',
        'ENUMERATION',
        'ENDENUMERATION',
        'PROPERTIES',
        'ENDPROPERTIES',
        'EVENTS',
        'ENDEVENTS',
        'METHODS',
        'ENDMETHODS',
        'WSPACE',
        'STRING',
        'ARGUMENTS',
        'ENDARGUMENTS',
        'PLUS',
        'MINUS',
        'MUL',
        'DIV',
        'EQ',
        'COLON',
        'SEMICOLON',
        'COMMA',
        'DOT',
        'TILDE',
        'EXCLAMATION',
        'COMMAT',
        'QUESTION',
        'LPAREN',
        'RPAREN',
        'LBRACKET',
        'RBRACKET',
        'LCURLYBR',
        'RCURLYBR',
        'LEFTDIV',
        'ADD_EQ',
        'SUB_EQ',
        'MUL_EQ',
        'DIV_EQ',
        'LEFTDIV_EQ',
        'POW_EQ',
        'EMUL_EQ',
        'EDIV_EQ',
        'ELEFTDIV_EQ',
        'EPOW_EQ',
        'AND_EQ',
        'OR_EQ',
        'EXPR_AND_AND',
        'EXPR_OR_OR',
        'EXPR_AND',
        'EXPR_OR',
        'EXPR_LT',
        'EXPR_LE',
        'EXPR_EQ',
        'EXPR_NE',
        'EXPR_GE',
        'EXPR_GT',
        'EMUL',
        'EDIV',
        'ELEFTDIV',
        'PLUS_PLUS',
        'MINUS_MINUS',
        'POW',
        'EPOW',
        'TRANSPOSE',
        'HERMITIAN',
        'DQSTRING',
        'IDENTIFIER',
        'FLOAT_NUMBER',
        'NUMBER_DOT_OP',
        'LINE_CONTINUATION',
        'SPACE_OR_CONTINUATION',
        'NEWLINE',
        'BLOCK_COMMENT_START',
        'COMMENT_LINE',
        'INVALID',
        'SINGLEQ_STRING',
        'SINGLEQ_NL',
        'SINGLEQ_SINGLEQ',
        'SINGLEQ_END',
        'DOUBLEQ_STRING',
        'DOUBLEQ_NL',
        'DOUBLEQ_DOUBLEQ',
        'DOUBLEQ_ESCAPE',
        'DOUBLEQ_ESCAPE_OTHER',
        'DOUBLEQ_ESCAPE_OCT',
        'DOUBLEQ_ESCAPE_HEX',
        'DOUBLEQ_ESCAPE_UNICODE',
        'DOUBLEQ_END',
        'BLOCK_COMMENT_START_AGAIN',
        'BLOCK_COMMENT_END',
        'BLOCK_COMMENT_LINE',
        'BLOCK_COMMENT_EOF',
        'COMMAND_LINE_CONTINUATION',
        'COMMAND_CONTINUED_BLOCK_COMMENT_START',
        'COMMAND_CONTINUED_COMMENT_LINE',
        'COMMAND_CONTINUED_NEWLINE',
        'SKIP_SPACE',
        'COMMAND_LONE_DQUOTE',
        'COMMAND_LONE_SQUOTE',
        'COMMAND_UNCLOSED_DQUOTE',
        'COMMAND_UNCLOSED_SQUOTE',
        'COMMAND_DQSTRING',
        'COMMAND_SQSTRING',
        'SKIP_COMMENT_LINE',
        'COMMAND_SEPARATOR',
        'EXIT_AT_NEWLINE',
        'EXIT_AT_EOF',
        'UNQUOTED_STRING',
    ];
    // tslint:disable:no-trailing-whitespace
    public static readonly ruleNames: string[] = [
        'input',
        'global_list',
        'list',
        'statement',
        'word_list_cmd',
        'command_word',
        'identifier',
        'qualified_identifier_part',
        'qualified_identifier',
        'string',
        'number',
        'end_range',
        'constant',
        'matrix',
        'matrix_row',
        'fcn_handle',
        'meta_class',
        'anon_fcn_handle',
        'primary_expr',
        'magic_colon',
        'magic_tilde',
        'list_element',
        'arg_list',
        'oper_expr',
        'power_expr',
        'colon_expr',
        'simple_expr',
        'expression',
        'assign_lhs',
        'assign_list',
        'command',
        'declaration',
        'declaration_element',
        'import_command',
        'import_name',
        'select_command',
        'if_command',
        'elseif_clause',
        'else_clause',
        'switch_command',
        'switch_case_list',
        'switch_case',
        'otherwise_case',
        'loop_command',
        'while_command',
        'do_until_command',
        'for_command',
        'spmd_command',
        'spmd_worker_spec',
        'jump_command',
        'except_command',
        'try_command',
        'catch_clause',
        'unwind_command',
        'unwind_cleanup_clause',
        'param_list',
        'param_list_elt',
        'return_list_elt',
        'return_list',
        'function',
        'function_name',
        'classdef_command',
        'class_attribute_list',
        'class_attribute',
        'class_method_name',
        'class_superclass_list',
        'class_section_list',
        'class_section',
        'properties_section',
        'class_property_list',
        'class_property',
        'methods_section',
        'class_method',
        'class_method_list',
        'events_section',
        'class_event_list',
        'class_event',
        'enumeration_section',
        'class_enumeration_list',
        'class_enumeration',
        'arguments_block_list',
        'arguments_block',
        'args_validation_list',
        'arg_validation',
        'arg_validation_name',
        'sep_no_nl',
        'nl',
        'sep',
    ];
    public get grammarFileName(): string {
        return 'MathJSLabParser.g4';
    }
    public get literalNames(): (string | null)[] {
        return MathJSLabParser.literalNames;
    }
    public get symbolicNames(): (string | null)[] {
        return MathJSLabParser.symbolicNames;
    }
    public get ruleNames(): string[] {
        return MathJSLabParser.ruleNames;
    }
    public get serializedATN(): number[] {
        return MathJSLabParser._serializedATN;
    }

    protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
        return new FailedPredicateException(this, predicate, message);
    }

    constructor(input: TokenStream) {
        super(input);
        this._interp = new ParserATNSimulator(this, MathJSLabParser._ATN, MathJSLabParser.DecisionsToDFA, new PredictionContextCache());
    }
    // @RuleVersion(0)
    public input(): InputContext {
        let localctx: InputContext = new InputContext(this, this._ctx, this.state);
        this.enterRule(localctx, 0, MathJSLabParser.RULE_input);
        let _la: number;
        try {
            this.state = 188;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 2, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 177;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 55 || _la === 56 || _la === 106) {
                            {
                                this.state = 176;
                                this.sep();
                            }
                        }

                        this.state = 179;
                        this.match(MathJSLabParser.EOF);

                        localctx.node = null;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 182;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 55 || _la === 56 || _la === 106) {
                            {
                                this.state = 181;
                                this.sep();
                            }
                        }

                        this.state = 184;
                        this.global_list();
                        this.state = 185;
                        this.match(MathJSLabParser.EOF);

                        localctx.node = localctx.global_list().node;
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public global_list(): Global_listContext {
        let localctx: Global_listContext = new Global_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 2, MathJSLabParser.RULE_global_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 190;
                this.statement();

                localctx.statement(localctx.i).node.start = {
                    line: localctx.statement(localctx.i).start.line,
                    column: localctx.statement(localctx.i).start.column,
                };
                localctx.statement(localctx.i).node.stop = {
                    line: this._input.LT(1).column > 0 ? this._input.LT(1).line : this._input.LT(1).line - 1,
                    column: this._input.LT(1).column > 0 ? this._input.LT(1).column - 1 : Infinity,
                };
                localctx.node = AST.nodeListFirst(localctx.statement(localctx.i++).node);

                this.state = 198;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 3, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 192;
                                this.sep();
                                this.state = 193;
                                this.statement();

                                localctx.statement(localctx.i).node.start = {
                                    line: localctx.statement(localctx.i).start.line,
                                    column: localctx.statement(localctx.i).start.column,
                                };
                                localctx.statement(localctx.i).node.stop = {
                                    line: this._input.LT(1).column > 0 ? this._input.LT(1).line : this._input.LT(1).line - 1,
                                    column: this._input.LT(1).column > 0 ? this._input.LT(1).column - 1 : Infinity,
                                };
                                if (localctx.sep(localctx.i - 1).getText()[0] === ';') {
                                    localctx.node.list[localctx.node.list.length - 1].omitOutput = true;
                                }
                                localctx.node = AST.appendNodeList(localctx.node, localctx.statement(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 200;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 3, this._ctx);
                }
                this.state = 202;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 201;
                        this.sep();
                    }
                }

                if (localctx.sep(localctx.i - 1) && localctx.sep(localctx.i - 1).getText()[0] === ';') {
                    localctx.node.list[localctx.node.list.length - 1].omitOutput = true;
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public list(): ListContext {
        let localctx: ListContext = new ListContext(this, this._ctx, this.state);
        this.enterRule(localctx, 4, MathJSLabParser.RULE_list);
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 206;
                this.statement();

                localctx.statement(localctx.i).node.start = {
                    line: localctx.statement(localctx.i).start.line,
                    column: localctx.statement(localctx.i).start.column,
                };
                localctx.statement(localctx.i).node.stop = {
                    line: this._input.LT(1).column > 0 ? this._input.LT(1).line : this._input.LT(1).line - 1,
                    column: this._input.LT(1).column > 0 ? this._input.LT(1).column - 1 : Infinity,
                };
                localctx.node = AST.nodeListFirst(localctx.statement(localctx.i++).node);

                this.state = 214;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 5, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 208;
                                this.sep();
                                this.state = 209;
                                this.statement();

                                localctx.statement(localctx.i).node.start = {
                                    line: localctx.statement(localctx.i).start.line,
                                    column: localctx.statement(localctx.i).start.column,
                                };
                                localctx.statement(localctx.i).node.stop = {
                                    line: this._input.LT(1).column > 0 ? this._input.LT(1).line : this._input.LT(1).line - 1,
                                    column: this._input.LT(1).column > 0 ? this._input.LT(1).column - 1 : Infinity,
                                };
                                if (localctx.sep(localctx.i - 1).getText()[0] === ';') {
                                    localctx.node.list[localctx.node.list.length - 1].omitOutput = true;
                                }
                                localctx.node = AST.appendNodeList(localctx.node, localctx.statement(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 216;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 5, this._ctx);
                }
                this.state = 218;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 6, this._ctx)) {
                    case 1:
                        {
                            this.state = 217;
                            this.sep();
                        }
                        break;
                }

                if (localctx.sep(localctx.i - 1) && localctx.sep(localctx.i - 1).getText()[0] === ';') {
                    localctx.node.list[localctx.node.list.length - 1].omitOutput = true;
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public statement(): StatementContext {
        let localctx: StatementContext = new StatementContext(this, this._ctx, this.state);
        this.enterRule(localctx, 6, MathJSLabParser.RULE_statement);
        try {
            this.state = 231;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 7, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 222;
                        this.expression();

                        localctx.node = localctx.expression().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 225;
                        this.command();

                        localctx.node = localctx.command().node;
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 228;
                        this.word_list_cmd();

                        localctx.node = localctx.word_list_cmd().node;
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public word_list_cmd(): Word_list_cmdContext {
        let localctx: Word_list_cmdContext = new Word_list_cmdContext(this, this._ctx, this.state);
        this.enterRule(localctx, 8, MathJSLabParser.RULE_word_list_cmd);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 233;
                this.identifier();
                this.state = 234;
                this.command_word();

                localctx.node = AST.nodeListFirst(localctx.command_word(localctx.i++).node);

                this.state = 241;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 46 || _la === 142) {
                    {
                        {
                            this.state = 236;
                            this.command_word();

                            AST.appendNodeList(localctx.node, localctx.command_word(localctx.i++).node);
                        }
                    }
                    this.state = 243;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }

                localctx.node = AST.nodeCmdWList(localctx.identifier().node, localctx.node);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public command_word(): Command_wordContext {
        let localctx: Command_wordContext = new Command_wordContext(this, this._ctx, this.state);
        this.enterRule(localctx, 10, MathJSLabParser.RULE_command_word);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 246;
                this.string_();

                localctx.node = localctx.string_().node;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public identifier(): IdentifierContext {
        let localctx: IdentifierContext = new IdentifierContext(this, this._ctx, this.state);
        this.enterRule(localctx, 12, MathJSLabParser.RULE_identifier);
        try {
            this.state = 259;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 101:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 249;
                        this.match(MathJSLabParser.IDENTIFIER);

                        localctx.node = AST.nodeIdentifier(localctx.IDENTIFIER().getText());
                    }
                    break;
                case 39:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 251;
                        this.match(MathJSLabParser.PROPERTIES);

                        localctx.node = AST.nodeIdentifier('properties');
                    }
                    break;
                case 43:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 253;
                        this.match(MathJSLabParser.METHODS);

                        localctx.node = AST.nodeIdentifier('methods');
                    }
                    break;
                case 41:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 255;
                        this.match(MathJSLabParser.EVENTS);

                        localctx.node = AST.nodeIdentifier('events');
                    }
                    break;
                case 37:
                    this.enterOuterAlt(localctx, 5);
                    {
                        this.state = 257;
                        this.match(MathJSLabParser.ENUMERATION);

                        localctx.node = AST.nodeIdentifier('enumeration');
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public qualified_identifier_part(): Qualified_identifier_partContext {
        let localctx: Qualified_identifier_partContext = new Qualified_identifier_partContext(this, this._ctx, this.state);
        this.enterRule(localctx, 14, MathJSLabParser.RULE_qualified_identifier_part);
        try {
            this.state = 266;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 37:
                case 39:
                case 41:
                case 43:
                case 101:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 261;
                        this.identifier();

                        localctx.text = localctx.identifier().node.id;
                    }
                    break;
                case 6:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 264;
                        this.match(MathJSLabParser.END);

                        localctx.text = 'end';
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public qualified_identifier(): Qualified_identifierContext {
        let localctx: Qualified_identifierContext = new Qualified_identifierContext(this, this._ctx, this.state);
        this.enterRule(localctx, 16, MathJSLabParser.RULE_qualified_identifier);
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 268;
                this.qualified_identifier_part();

                localctx.node = AST.nodeIdentifier(localctx.qualified_identifier_part(0).text);

                this.state = 276;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 11, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 270;
                                this.match(MathJSLabParser.DOT);
                                this.state = 271;
                                this.qualified_identifier_part();

                                localctx.node = AST.nodeIdentifier(localctx.node.id + '.' + localctx.qualified_identifier_part(localctx.i++).text);
                            }
                        }
                    }
                    this.state = 278;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 11, this._ctx);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public string_(): StringContext {
        let localctx: StringContext = new StringContext(this, this._ctx, this.state);
        this.enterRule(localctx, 18, MathJSLabParser.RULE_string);
        try {
            this.state = 283;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 46:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 279;
                        this.match(MathJSLabParser.STRING);

                        const str = localctx.STRING().getText();
                        localctx.node = AST.nodeString(str.substring(1, str.length - 1), str[0] as StringQuoteCharacter);
                    }
                    break;
                case 142:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 281;
                        this.match(MathJSLabParser.UNQUOTED_STRING);

                        localctx.node = AST.nodeString(localctx.UNQUOTED_STRING().getText());
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public number_(): NumberContext {
        let localctx: NumberContext = new NumberContext(this, this._ctx, this.state);
        this.enterRule(localctx, 20, MathJSLabParser.RULE_number);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 285;
                this.match(MathJSLabParser.FLOAT_NUMBER);

                localctx.node = AST.nodeNumber(localctx.FLOAT_NUMBER().getText());
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public end_range(): End_rangeContext {
        let localctx: End_rangeContext = new End_rangeContext(this, this._ctx, this.state);
        this.enterRule(localctx, 22, MathJSLabParser.RULE_end_range);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 288;
                this.match(MathJSLabParser.ENDRANGE);

                localctx.node = AST.nodeEndRange();
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public constant(): ConstantContext {
        let localctx: ConstantContext = new ConstantContext(this, this._ctx, this.state);
        this.enterRule(localctx, 24, MathJSLabParser.RULE_constant);
        try {
            this.state = 300;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 102:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 291;
                        this.number_();

                        localctx.node = localctx.number_().node;
                    }
                    break;
                case 46:
                case 142:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 294;
                        this.string_();

                        localctx.node = localctx.string_().node;
                    }
                    break;
                case 7:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 297;
                        this.end_range();

                        localctx.node = localctx.end_range().node;
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public matrix(): MatrixContext {
        let localctx: MatrixContext = new MatrixContext(this, this._ctx, this.state);
        this.enterRule(localctx, 26, MathJSLabParser.RULE_matrix);
        let _la: number;
        try {
            let _alt: number;
            this.state = 364;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 28, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 302;
                        this.match(MathJSLabParser.LBRACKET);
                        this.state = 303;
                        this.match(MathJSLabParser.RBRACKET);

                        localctx.node = AST.emptyArray();
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 305;
                        this.match(MathJSLabParser.LBRACKET);
                        this.state = 310;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(this._input, 15, this._ctx);
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    this.state = 308;
                                    this._errHandler.sync(this);
                                    switch (this._input.LA(1)) {
                                        case 55:
                                            {
                                                this.state = 306;
                                                this.match(MathJSLabParser.SEMICOLON);
                                            }
                                            break;
                                        case 106:
                                            {
                                                this.state = 307;
                                                this.nl();
                                            }
                                            break;
                                        default:
                                            throw new NoViableAltException(this);
                                    }
                                }
                            }
                            this.state = 312;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(this._input, 15, this._ctx);
                        }
                        this.state = 314;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            _la === 7 ||
                            (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736768853) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 313;
                                this.matrix_row();
                            }
                        }

                        localctx.node = AST.nodeFirstRow(localctx.matrix_row(localctx.i) ? localctx.matrix_row(localctx.i++).node : null);

                        this.state = 329;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        while (_la === 55 || _la === 106) {
                            {
                                {
                                    this.state = 319;
                                    this._errHandler.sync(this);
                                    _alt = 1;
                                    do {
                                        switch (_alt) {
                                            case 1:
                                                {
                                                    this.state = 319;
                                                    this._errHandler.sync(this);
                                                    switch (this._input.LA(1)) {
                                                        case 55:
                                                            {
                                                                this.state = 317;
                                                                this.match(MathJSLabParser.SEMICOLON);
                                                            }
                                                            break;
                                                        case 106:
                                                            {
                                                                this.state = 318;
                                                                this.nl();
                                                            }
                                                            break;
                                                        default:
                                                            throw new NoViableAltException(this);
                                                    }
                                                }
                                                break;
                                            default:
                                                throw new NoViableAltException(this);
                                        }
                                        this.state = 321;
                                        this._errHandler.sync(this);
                                        _alt = this._interp.adaptivePredict(this._input, 18, this._ctx);
                                    } while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER);
                                    this.state = 324;
                                    this._errHandler.sync(this);
                                    _la = this._input.LA(1);
                                    if (
                                        _la === 7 ||
                                        (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736768853) !== 0) ||
                                        (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                                        _la === 142
                                    ) {
                                        {
                                            this.state = 323;
                                            this.matrix_row();
                                        }
                                    }

                                    localctx.node = AST.nodeAppendRow(localctx.node, localctx.matrix_row(localctx.i) ? localctx.matrix_row(localctx.i++).node : null);
                                }
                            }
                            this.state = 331;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                        }
                        this.state = 332;
                        this.match(MathJSLabParser.RBRACKET);
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 333;
                        this.match(MathJSLabParser.LCURLYBR);
                        this.state = 334;
                        this.match(MathJSLabParser.RCURLYBR);

                        localctx.node = AST.emptyArray(true);
                    }
                    break;
                case 4:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 336;
                        this.match(MathJSLabParser.LCURLYBR);
                        this.state = 341;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(this._input, 22, this._ctx);
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    this.state = 339;
                                    this._errHandler.sync(this);
                                    switch (this._input.LA(1)) {
                                        case 55:
                                            {
                                                this.state = 337;
                                                this.match(MathJSLabParser.SEMICOLON);
                                            }
                                            break;
                                        case 106:
                                            {
                                                this.state = 338;
                                                this.nl();
                                            }
                                            break;
                                        default:
                                            throw new NoViableAltException(this);
                                    }
                                }
                            }
                            this.state = 343;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(this._input, 22, this._ctx);
                        }
                        this.state = 345;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            _la === 7 ||
                            (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736768853) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 344;
                                this.matrix_row();
                            }
                        }

                        localctx.node = AST.nodeFirstRow(localctx.matrix_row(localctx.i) ? localctx.matrix_row(localctx.i++).node : null, true);

                        this.state = 360;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        while (_la === 55 || _la === 106) {
                            {
                                {
                                    this.state = 350;
                                    this._errHandler.sync(this);
                                    _alt = 1;
                                    do {
                                        switch (_alt) {
                                            case 1:
                                                {
                                                    this.state = 350;
                                                    this._errHandler.sync(this);
                                                    switch (this._input.LA(1)) {
                                                        case 55:
                                                            {
                                                                this.state = 348;
                                                                this.match(MathJSLabParser.SEMICOLON);
                                                            }
                                                            break;
                                                        case 106:
                                                            {
                                                                this.state = 349;
                                                                this.nl();
                                                            }
                                                            break;
                                                        default:
                                                            throw new NoViableAltException(this);
                                                    }
                                                }
                                                break;
                                            default:
                                                throw new NoViableAltException(this);
                                        }
                                        this.state = 352;
                                        this._errHandler.sync(this);
                                        _alt = this._interp.adaptivePredict(this._input, 25, this._ctx);
                                    } while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER);
                                    this.state = 355;
                                    this._errHandler.sync(this);
                                    _la = this._input.LA(1);
                                    if (
                                        _la === 7 ||
                                        (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736768853) !== 0) ||
                                        (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                                        _la === 142
                                    ) {
                                        {
                                            this.state = 354;
                                            this.matrix_row();
                                        }
                                    }

                                    localctx.node = AST.nodeAppendRow(localctx.node, localctx.matrix_row(localctx.i) ? localctx.matrix_row(localctx.i++).node : null);
                                }
                            }
                            this.state = 362;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                        }
                        this.state = 363;
                        this.match(MathJSLabParser.RCURLYBR);
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public matrix_row(): Matrix_rowContext {
        let localctx: Matrix_rowContext = new Matrix_rowContext(this, this._ctx, this.state);
        this.enterRule(localctx, 28, MathJSLabParser.RULE_matrix_row);
        let _la: number;
        try {
            let _alt: number;
            this.state = 385;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 32, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 366;
                        _la = this._input.LA(1);
                        if (!(_la === 45 || _la === 56)) {
                            this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }

                        localctx.node = null;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 369;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 45 || _la === 56) {
                            {
                                this.state = 368;
                                _la = this._input.LA(1);
                                if (!(_la === 45 || _la === 56)) {
                                    this._errHandler.recoverInline(this);
                                } else {
                                    this._errHandler.reportMatch(this);
                                    this.consume();
                                }
                            }
                        }

                        this.state = 371;
                        this.list_element();

                        localctx.node = AST.nodeListFirst(localctx.list_element(localctx.i++).node);

                        this.state = 379;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(this._input, 30, this._ctx);
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    {
                                        this.state = 373;
                                        _la = this._input.LA(1);
                                        if (!(_la === 45 || _la === 56)) {
                                            this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 374;
                                        this.list_element();

                                        localctx.node = AST.appendNodeList(localctx.node, localctx.list_element(localctx.i++).node);
                                    }
                                }
                            }
                            this.state = 381;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(this._input, 30, this._ctx);
                        }
                        this.state = 383;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 45 || _la === 56) {
                            {
                                this.state = 382;
                                _la = this._input.LA(1);
                                if (!(_la === 45 || _la === 56)) {
                                    this._errHandler.recoverInline(this);
                                } else {
                                    this._errHandler.reportMatch(this);
                                    this.consume();
                                }
                            }
                        }
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public fcn_handle(): Fcn_handleContext {
        let localctx: Fcn_handleContext = new Fcn_handleContext(this, this._ctx, this.state);
        this.enterRule(localctx, 30, MathJSLabParser.RULE_fcn_handle);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 387;
                this.match(MathJSLabParser.COMMAT);
                this.state = 388;
                this.qualified_identifier();

                localctx.node = AST.nodeFunctionHandle(localctx.qualified_identifier().node);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public meta_class(): Meta_classContext {
        let localctx: Meta_classContext = new Meta_classContext(this, this._ctx, this.state);
        this.enterRule(localctx, 32, MathJSLabParser.RULE_meta_class);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 391;
                this.match(MathJSLabParser.QUESTION);
                this.state = 392;
                this.qualified_identifier();

                localctx.node = AST.nodeMetaClass(localctx.qualified_identifier().node);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public anon_fcn_handle(): Anon_fcn_handleContext {
        let localctx: Anon_fcn_handleContext = new Anon_fcn_handleContext(this, this._ctx, this.state);
        this.enterRule(localctx, 34, MathJSLabParser.RULE_anon_fcn_handle);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 395;
                this.match(MathJSLabParser.COMMAT);
                this.state = 396;
                this.param_list();
                this.state = 397;
                this.expression();

                localctx.node = AST.nodeFunctionHandle(null, localctx.param_list().node, localctx.expression().node);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public primary_expr(): Primary_exprContext {
        let localctx: Primary_exprContext = new Primary_exprContext(this, this._ctx, this.state);
        this.enterRule(localctx, 36, MathJSLabParser.RULE_primary_expr);
        try {
            this.state = 420;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 37:
                case 39:
                case 41:
                case 43:
                case 101:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 400;
                        this.identifier();

                        localctx.node = localctx.identifier().node;
                    }
                    break;
                case 7:
                case 46:
                case 102:
                case 142:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 403;
                        this.constant();

                        localctx.node = localctx.constant().node;
                    }
                    break;
                case 60:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 406;
                        this.fcn_handle();

                        localctx.node = localctx.fcn_handle().node;
                    }
                    break;
                case 61:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 409;
                        this.meta_class();

                        localctx.node = localctx.meta_class().node;
                    }
                    break;
                case 64:
                case 66:
                    this.enterOuterAlt(localctx, 5);
                    {
                        this.state = 412;
                        this.matrix();

                        localctx.node = localctx.matrix().node;
                    }
                    break;
                case 62:
                    this.enterOuterAlt(localctx, 6);
                    {
                        this.state = 415;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 416;
                        this.expression();
                        this.state = 417;
                        this.match(MathJSLabParser.RPAREN);

                        localctx.node = AST.nodeOperation('()', localctx.expression().node);
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public magic_colon(): Magic_colonContext {
        let localctx: Magic_colonContext = new Magic_colonContext(this, this._ctx, this.state);
        this.enterRule(localctx, 38, MathJSLabParser.RULE_magic_colon);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 422;
                this.match(MathJSLabParser.COLON);

                localctx.node = AST.nodeColon();
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public magic_tilde(): Magic_tildeContext {
        let localctx: Magic_tildeContext = new Magic_tildeContext(this, this._ctx, this.state);
        this.enterRule(localctx, 40, MathJSLabParser.RULE_magic_tilde);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 425;
                this.match(MathJSLabParser.TILDE);

                localctx.node = AST.nodeIgnoredTarget();
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public list_element(): List_elementContext {
        let localctx: List_elementContext = new List_elementContext(this, this._ctx, this.state);
        this.enterRule(localctx, 42, MathJSLabParser.RULE_list_element);
        try {
            this.state = 437;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 34, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 428;
                        this.expression();

                        localctx.node = localctx.expression().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 431;
                        this.magic_colon();

                        localctx.node = localctx.magic_colon().node;
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 434;
                        this.magic_tilde();

                        localctx.node = localctx.magic_tilde().node;
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public arg_list(): Arg_listContext {
        let localctx: Arg_listContext = new Arg_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 44, MathJSLabParser.RULE_arg_list);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 439;
                this.list_element();

                localctx.node = AST.nodeListFirst(localctx.list_element(localctx.i++).node);

                this.state = 447;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 56) {
                    {
                        {
                            this.state = 441;
                            this.match(MathJSLabParser.COMMA);
                            this.state = 442;
                            this.list_element();

                            localctx.node = AST.appendNodeList(localctx.node, localctx.list_element(localctx.i++).node);
                        }
                    }
                    this.state = 449;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }

    public oper_expr(): Oper_exprContext;
    public oper_expr(_p: number): Oper_exprContext;
    // @RuleVersion(0)
    public oper_expr(_p?: number): Oper_exprContext {
        if (_p === undefined) {
            _p = 0;
        }

        let _parentctx: ParserRuleContext = this._ctx;
        let _parentState: number = this.state;
        let localctx: Oper_exprContext = new Oper_exprContext(this, this._ctx, _parentState);
        let _prevctx: Oper_exprContext = localctx;
        let _startState: number = 46;
        this.enterRecursionRule(localctx, 46, MathJSLabParser.RULE_oper_expr, _p);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 462;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                    case 7:
                    case 37:
                    case 39:
                    case 41:
                    case 43:
                    case 46:
                    case 60:
                    case 61:
                    case 62:
                    case 64:
                    case 66:
                    case 101:
                    case 102:
                    case 142:
                        {
                            this.state = 451;
                            this.primary_expr();

                            localctx.node = localctx.primary_expr().node;
                        }
                        break;
                    case 49:
                    case 50:
                    case 94:
                    case 95:
                        {
                            this.state = 454;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 49 || _la === 50 || _la === 94 || _la === 95)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 455;
                            this.oper_expr(4);

                            localctx.node = AST.nodeOperation((localctx._op.text + '_') as OperatorType, localctx.oper_expr(0).node);
                        }
                        break;
                    case 58:
                    case 59:
                        {
                            this.state = 458;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 58 || _la === 59)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 459;
                            this.oper_expr(3);

                            localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node);
                        }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 523;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 41, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 521;
                            this._errHandler.sync(this);
                            switch (this._interp.adaptivePredict(this._input, 40, this._ctx)) {
                                case 1:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 464;
                                        if (!this.precpred(this._ctx, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 2)');
                                        }
                                        this.state = 465;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!((((_la - 51) & ~0x1f) === 0 && ((1 << (_la - 51)) & 131075) !== 0) || (((_la - 91) & ~0x1f) === 0 && ((1 << (_la - 91)) & 7) !== 0))) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 466;
                                        this.oper_expr(3);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.oper_expr(1).node);
                                    }
                                    break;
                                case 2:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 469;
                                        if (!this.precpred(this._ctx, 1)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 1)');
                                        }
                                        this.state = 470;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 49 || _la === 50)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 471;
                                        this.oper_expr(2);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.oper_expr(1).node);
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 474;
                                        if (!this.precpred(this._ctx, 12)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 12)');
                                        }
                                        this.state = 475;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 94 || _la === 95)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }

                                        localctx.node = AST.nodeOperation(('_' + localctx._op.text) as OperatorType, localctx.oper_expr(0).node);
                                    }
                                    break;
                                case 4:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 477;
                                        if (!this.precpred(this._ctx, 11)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 11)');
                                        }
                                        this.state = 478;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 480;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 7 ||
                                            (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736244309) !== 0) ||
                                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                                            _la === 142
                                        ) {
                                            {
                                                this.state = 479;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 482;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndexExpr(localctx.oper_expr(0).node, localctx.arg_list() ? localctx.arg_list().node : null, '()');
                                    }
                                    break;
                                case 5:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 484;
                                        if (!this.precpred(this._ctx, 10)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 10)');
                                        }
                                        this.state = 485;
                                        this.match(MathJSLabParser.LCURLYBR);
                                        this.state = 487;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 7 ||
                                            (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736244309) !== 0) ||
                                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                                            _la === 142
                                        ) {
                                            {
                                                this.state = 486;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 489;
                                        this.match(MathJSLabParser.RCURLYBR);

                                        localctx.node = AST.nodeIndexExpr(localctx.oper_expr(0).node, localctx.arg_list() ? localctx.arg_list().node : null, '{}');
                                    }
                                    break;
                                case 6:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 491;
                                        if (!this.precpred(this._ctx, 9)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 9)');
                                        }
                                        this.state = 492;
                                        this.match(MathJSLabParser.COMMAT);
                                        this.state = 493;
                                        this.qualified_identifier();
                                        this.state = 494;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 496;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 7 ||
                                            (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736244309) !== 0) ||
                                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                                            _la === 142
                                        ) {
                                            {
                                                this.state = 495;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 498;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeSuperclassConstructor(
                                            localctx.oper_expr(0).node,
                                            localctx.qualified_identifier().node,
                                            localctx.arg_list() ? localctx.arg_list().node : null,
                                        );
                                    }
                                    break;
                                case 7:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 501;
                                        if (!this.precpred(this._ctx, 8)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 8)');
                                        }
                                        this.state = 502;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 98 || _la === 99)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node);
                                    }
                                    break;
                                case 8:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 504;
                                        if (!this.precpred(this._ctx, 7)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 7)');
                                        }
                                        this.state = 505;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 506;
                                        this.qualified_identifier_part();

                                        localctx.node = AST.nodeIndirectRef(localctx.oper_expr(0).node, localctx.qualified_identifier_part().text);
                                    }
                                    break;
                                case 9:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 509;
                                        if (!this.precpred(this._ctx, 6)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 6)');
                                        }
                                        this.state = 510;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 511;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 512;
                                        this.expression();
                                        this.state = 513;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndirectRef(localctx.oper_expr(0).node, localctx.expression().node);
                                    }
                                    break;
                                case 10:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 516;
                                        if (!this.precpred(this._ctx, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 5)');
                                        }
                                        this.state = 517;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 96 || _la === 97)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 518;
                                        this.power_expr(0);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.power_expr().node);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 525;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 41, this._ctx);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.unrollRecursionContexts(_parentctx);
        }
        return localctx;
    }

    public power_expr(): Power_exprContext;
    public power_expr(_p: number): Power_exprContext;
    // @RuleVersion(0)
    public power_expr(_p?: number): Power_exprContext {
        if (_p === undefined) {
            _p = 0;
        }

        let _parentctx: ParserRuleContext = this._ctx;
        let _parentState: number = this.state;
        let localctx: Power_exprContext = new Power_exprContext(this, this._ctx, _parentState);
        let _prevctx: Power_exprContext = localctx;
        let _startState: number = 48;
        this.enterRecursionRule(localctx, 48, MathJSLabParser.RULE_power_expr, _p);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 538;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                    case 7:
                    case 37:
                    case 39:
                    case 41:
                    case 43:
                    case 46:
                    case 60:
                    case 61:
                    case 62:
                    case 64:
                    case 66:
                    case 101:
                    case 102:
                    case 142:
                        {
                            this.state = 527;
                            this.primary_expr();

                            localctx.node = localctx.primary_expr().node;
                        }
                        break;
                    case 49:
                    case 50:
                    case 94:
                    case 95:
                        {
                            this.state = 530;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 49 || _la === 50 || _la === 94 || _la === 95)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 531;
                            this.power_expr(2);

                            localctx.node = AST.nodeOperation((localctx._op.text + '_') as OperatorType, localctx.power_expr().node);
                        }
                        break;
                    case 58:
                    case 59:
                        {
                            this.state = 534;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 58 || _la === 59)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 535;
                            this.power_expr(1);

                            localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.power_expr().node);
                        }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 581;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 47, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 579;
                            this._errHandler.sync(this);
                            switch (this._interp.adaptivePredict(this._input, 46, this._ctx)) {
                                case 1:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 540;
                                        if (!this.precpred(this._ctx, 8)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 8)');
                                        }
                                        this.state = 541;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 94 || _la === 95)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }

                                        localctx.node = AST.nodeOperation(('_' + localctx._op.text) as OperatorType, localctx.power_expr().node);
                                    }
                                    break;
                                case 2:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 543;
                                        if (!this.precpred(this._ctx, 7)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 7)');
                                        }
                                        this.state = 544;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 546;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 7 ||
                                            (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736244309) !== 0) ||
                                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                                            _la === 142
                                        ) {
                                            {
                                                this.state = 545;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 548;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndexExpr(localctx.power_expr().node, localctx.arg_list() ? localctx.arg_list().node : null, '()');
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 550;
                                        if (!this.precpred(this._ctx, 6)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 6)');
                                        }
                                        this.state = 551;
                                        this.match(MathJSLabParser.LCURLYBR);
                                        this.state = 553;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 7 ||
                                            (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736244309) !== 0) ||
                                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                                            _la === 142
                                        ) {
                                            {
                                                this.state = 552;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 555;
                                        this.match(MathJSLabParser.RCURLYBR);

                                        localctx.node = AST.nodeIndexExpr(localctx.power_expr().node, localctx.arg_list() ? localctx.arg_list().node : null, '{}');
                                    }
                                    break;
                                case 4:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 557;
                                        if (!this.precpred(this._ctx, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 5)');
                                        }
                                        this.state = 558;
                                        this.match(MathJSLabParser.COMMAT);
                                        this.state = 559;
                                        this.qualified_identifier();
                                        this.state = 560;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 562;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 7 ||
                                            (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736244309) !== 0) ||
                                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                                            _la === 142
                                        ) {
                                            {
                                                this.state = 561;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 564;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeSuperclassConstructor(
                                            localctx.power_expr().node,
                                            localctx.qualified_identifier().node,
                                            localctx.arg_list() ? localctx.arg_list().node : null,
                                        );
                                    }
                                    break;
                                case 5:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 567;
                                        if (!this.precpred(this._ctx, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 4)');
                                        }
                                        this.state = 568;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 569;
                                        this.qualified_identifier_part();

                                        localctx.node = AST.nodeIndirectRef(localctx.power_expr().node, localctx.qualified_identifier_part().text);
                                    }
                                    break;
                                case 6:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 572;
                                        if (!this.precpred(this._ctx, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 3)');
                                        }
                                        this.state = 573;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 574;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 575;
                                        this.expression();
                                        this.state = 576;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndirectRef(localctx.power_expr().node, localctx.expression().node);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 583;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 47, this._ctx);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.unrollRecursionContexts(_parentctx);
        }
        return localctx;
    }
    // @RuleVersion(0)
    public colon_expr(): Colon_exprContext {
        let localctx: Colon_exprContext = new Colon_exprContext(this, this._ctx, this.state);
        this.enterRule(localctx, 50, MathJSLabParser.RULE_colon_expr);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 584;
                this.oper_expr(0);
                this.state = 585;
                this.match(MathJSLabParser.COLON);
                this.state = 586;
                this.oper_expr(0);
                this.state = 589;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 48, this._ctx)) {
                    case 1:
                        {
                            this.state = 587;
                            this.match(MathJSLabParser.COLON);
                            this.state = 588;
                            this.oper_expr(0);
                        }
                        break;
                }

                if (localctx.oper_expr(2)) {
                    localctx.node = AST.nodeRange(localctx.oper_expr(0).node, localctx.oper_expr(2).node, localctx.oper_expr(1).node);
                } else {
                    localctx.node = AST.nodeRange(localctx.oper_expr(0).node, localctx.oper_expr(1).node);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }

    public simple_expr(): Simple_exprContext;
    public simple_expr(_p: number): Simple_exprContext;
    // @RuleVersion(0)
    public simple_expr(_p?: number): Simple_exprContext {
        if (_p === undefined) {
            _p = 0;
        }

        let _parentctx: ParserRuleContext = this._ctx;
        let _parentState: number = this.state;
        let localctx: Simple_exprContext = new Simple_exprContext(this, this._ctx, _parentState);
        let _prevctx: Simple_exprContext = localctx;
        let _startState: number = 52;
        this.enterRecursionRule(localctx, 52, MathJSLabParser.RULE_simple_expr, _p);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 600;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 49, this._ctx)) {
                    case 1:
                        {
                            this.state = 594;
                            this.oper_expr(0);

                            localctx.node = localctx.oper_expr().node;
                        }
                        break;
                    case 2:
                        {
                            this.state = 597;
                            this.colon_expr();

                            localctx.node = localctx.colon_expr().node;
                        }
                        break;
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 629;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 51, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 627;
                            this._errHandler.sync(this);
                            switch (this._interp.adaptivePredict(this._input, 50, this._ctx)) {
                                case 1:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 602;
                                        if (!this.precpred(this._ctx, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 5)');
                                        }
                                        this.state = 603;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(((_la - 85) & ~0x1f) === 0 && ((1 << (_la - 85)) & 63) !== 0)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 604;
                                        this.simple_expr(6);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 2:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 607;
                                        if (!this.precpred(this._ctx, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 4)');
                                        }
                                        this.state = 608;
                                        localctx._op = this.match(MathJSLabParser.EXPR_AND);
                                        this.state = 609;
                                        this.simple_expr(5);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 612;
                                        if (!this.precpred(this._ctx, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 3)');
                                        }
                                        this.state = 613;
                                        localctx._op = this.match(MathJSLabParser.EXPR_OR);
                                        this.state = 614;
                                        this.simple_expr(4);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 4:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 617;
                                        if (!this.precpred(this._ctx, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 2)');
                                        }
                                        this.state = 618;
                                        localctx._op = this.match(MathJSLabParser.EXPR_AND_AND);
                                        this.state = 619;
                                        this.simple_expr(3);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 5:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 622;
                                        if (!this.precpred(this._ctx, 1)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 1)');
                                        }
                                        this.state = 623;
                                        localctx._op = this.match(MathJSLabParser.EXPR_OR_OR);
                                        this.state = 624;
                                        this.simple_expr(2);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 631;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 51, this._ctx);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.unrollRecursionContexts(_parentctx);
        }
        return localctx;
    }
    // @RuleVersion(0)
    public expression(): ExpressionContext {
        let localctx: ExpressionContext = new ExpressionContext(this, this._ctx, this.state);
        this.enterRule(localctx, 54, MathJSLabParser.RULE_expression);
        let _la: number;
        try {
            this.state = 643;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 52, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 632;
                        this.simple_expr(0);

                        localctx.node = localctx.simple_expr().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 635;
                        this.simple_expr(0);
                        this.state = 636;
                        localctx._op = this._input.LT(1);
                        _la = this._input.LA(1);
                        if (!(((_la - 53) & ~0x1f) === 0 && ((1 << (_la - 53)) & 268369921) !== 0)) {
                            localctx._op = this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }
                        this.state = 637;
                        this.expression();

                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr().node, localctx.expression().node);
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 640;
                        this.anon_fcn_handle();

                        localctx.node = localctx.anon_fcn_handle().node;
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public assign_lhs(): Assign_lhsContext {
        let localctx: Assign_lhsContext = new Assign_lhsContext(this, this._ctx, this.state);
        this.enterRule(localctx, 56, MathJSLabParser.RULE_assign_lhs);
        let _la: number;
        try {
            this.state = 654;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 54, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 645;
                        this.simple_expr(0);

                        localctx.node = localctx.simple_expr().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 648;
                        this.match(MathJSLabParser.LBRACKET);
                        this.state = 650;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            _la === 7 ||
                            (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736244309) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 649;
                                this.assign_list();
                            }
                        }

                        this.state = 652;
                        this.match(MathJSLabParser.RBRACKET);

                        localctx.node = AST.nodeFirstRow(localctx.assign_list() ? localctx.assign_list().node : AST.nodeListFirst());
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public assign_list(): Assign_listContext {
        let localctx: Assign_listContext = new Assign_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 58, MathJSLabParser.RULE_assign_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 656;
                this.list_element();

                localctx.node = AST.nodeListFirst(localctx.list_element(localctx.i++).node);

                this.state = 664;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 55, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 658;
                                _la = this._input.LA(1);
                                if (!(_la === 45 || _la === 56)) {
                                    this._errHandler.recoverInline(this);
                                } else {
                                    this._errHandler.reportMatch(this);
                                    this.consume();
                                }
                                this.state = 659;
                                this.list_element();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.list_element(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 666;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 55, this._ctx);
                }
                this.state = 668;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 45 || _la === 56) {
                    {
                        this.state = 667;
                        _la = this._input.LA(1);
                        if (!(_la === 45 || _la === 56)) {
                            this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }
                    }
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public command(): CommandContext {
        let localctx: CommandContext = new CommandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 60, MathJSLabParser.RULE_command);
        try {
            this.state = 694;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 1:
                case 2:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 670;
                        this.declaration();

                        localctx.node = localctx.declaration().node;
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 673;
                        this.import_command();

                        localctx.node = localctx.import_command().node;
                    }
                    break;
                case 4:
                case 10:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 676;
                        this.select_command();

                        localctx.node = localctx.select_command().node;
                    }
                    break;
                case 14:
                case 16:
                case 18:
                case 20:
                case 22:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 679;
                        this.loop_command();

                        localctx.node = localctx.loop_command().node;
                    }
                    break;
                case 24:
                case 25:
                case 26:
                    this.enterOuterAlt(localctx, 5);
                    {
                        this.state = 682;
                        this.jump_command();

                        localctx.node = localctx.jump_command().node;
                    }
                    break;
                case 29:
                case 32:
                    this.enterOuterAlt(localctx, 6);
                    {
                        this.state = 685;
                        this.except_command();

                        localctx.node = localctx.except_command().node;
                    }
                    break;
                case 27:
                    this.enterOuterAlt(localctx, 7);
                    {
                        this.state = 688;
                        this.function_();

                        localctx.node = localctx.function_().node;
                    }
                    break;
                case 35:
                    this.enterOuterAlt(localctx, 8);
                    {
                        this.state = 691;
                        this.classdef_command();

                        localctx.node = localctx.classdef_command().node;
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public declaration(): DeclarationContext {
        let localctx: DeclarationContext = new DeclarationContext(this, this._ctx, this.state);
        this.enterRule(localctx, 62, MathJSLabParser.RULE_declaration);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 700;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                    case 1:
                        {
                            this.state = 696;
                            this.match(MathJSLabParser.GLOBAL);

                            localctx.node = AST.nodeDeclarationFirst('GLOBAL');
                        }
                        break;
                    case 2:
                        {
                            this.state = 698;
                            this.match(MathJSLabParser.PERSISTENT);

                            localctx.node = AST.nodeDeclarationFirst('PERSIST');
                        }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this.state = 702;
                this.declaration_element();

                localctx.node = AST.nodeAppendDeclaration(localctx.node, localctx.declaration_element(localctx.i++).node);

                this.state = 712;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 60, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 705;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 56) {
                                    {
                                        this.state = 704;
                                        this.match(MathJSLabParser.COMMA);
                                    }
                                }

                                this.state = 707;
                                this.declaration_element();

                                localctx.node = AST.nodeAppendDeclaration(localctx.node, localctx.declaration_element(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 714;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 60, this._ctx);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public declaration_element(): Declaration_elementContext {
        let localctx: Declaration_elementContext = new Declaration_elementContext(this, this._ctx, this.state);
        this.enterRule(localctx, 64, MathJSLabParser.RULE_declaration_element);
        try {
            this.state = 723;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 61, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 715;
                        this.identifier();

                        localctx.node = localctx.identifier().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 718;
                        this.identifier();
                        this.state = 719;
                        this.match(MathJSLabParser.EQ);
                        this.state = 720;
                        this.expression();

                        localctx.node = AST.nodeOperation('=', localctx.identifier().node, localctx.expression().node);
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public import_command(): Import_commandContext {
        let localctx: Import_commandContext = new Import_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 66, MathJSLabParser.RULE_import_command);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 725;
                this.match(MathJSLabParser.IMPORT);
                this.state = 726;
                this.import_name();

                localctx.node = AST.nodeImportFirst(localctx.import_name(localctx.i++).node);

                this.state = 736;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 63, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 729;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 56) {
                                    {
                                        this.state = 728;
                                        this.match(MathJSLabParser.COMMA);
                                    }
                                }

                                this.state = 731;
                                this.import_name();

                                localctx.node = AST.nodeAppendImport(localctx.node, localctx.import_name(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 738;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 63, this._ctx);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public import_name(): Import_nameContext {
        let localctx: Import_nameContext = new Import_nameContext(this, this._ctx, this.state);
        this.enterRule(localctx, 68, MathJSLabParser.RULE_import_name);
        try {
            this.state = 750;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 65, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 739;
                        this.qualified_identifier();

                        localctx.node = localctx.qualified_identifier().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 742;
                        this.qualified_identifier();
                        this.state = 746;
                        this._errHandler.sync(this);
                        switch (this._input.LA(1)) {
                            case 57:
                                {
                                    this.state = 743;
                                    this.match(MathJSLabParser.DOT);
                                    this.state = 744;
                                    this.match(MathJSLabParser.MUL);
                                }
                                break;
                            case 91:
                                {
                                    this.state = 745;
                                    this.match(MathJSLabParser.EMUL);
                                }
                                break;
                            default:
                                throw new NoViableAltException(this);
                        }

                        localctx.node = AST.nodeIdentifier(localctx.qualified_identifier().node.id + '.*');
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public select_command(): Select_commandContext {
        let localctx: Select_commandContext = new Select_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 70, MathJSLabParser.RULE_select_command);
        try {
            this.state = 758;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 4:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 752;
                        this.if_command();

                        localctx.node = localctx.if_command().node;
                    }
                    break;
                case 10:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 755;
                        this.switch_command();

                        localctx.node = localctx.switch_command().node;
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public if_command(): If_commandContext {
        let localctx: If_commandContext = new If_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 72, MathJSLabParser.RULE_if_command);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 760;
                this.match(MathJSLabParser.IF);
                this.state = 761;
                this.expression();
                this.state = 763;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 762;
                        this.sep();
                    }
                }

                this.state = 766;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 765;
                        this.list();
                    }
                }

                localctx.node = AST.nodeIfBegin(localctx.expression().node, localctx.list() ? localctx.list().node : AST.nodeListFirst());

                this.state = 774;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 8) {
                    {
                        {
                            this.state = 769;
                            this.elseif_clause();

                            localctx.node = AST.nodeIfAppendElseIf(localctx.node, localctx.elseif_clause(localctx.i++).node);
                        }
                    }
                    this.state = 776;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
                this.state = 778;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 9) {
                    {
                        this.state = 777;
                        this.else_clause();
                    }
                }

                if (localctx.else_clause()) {
                    localctx.node = AST.nodeIfAppendElse(localctx.node, localctx.else_clause().node);
                }

                this.state = 781;
                _la = this._input.LA(1);
                if (!(_la === 5 || _la === 6)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public elseif_clause(): Elseif_clauseContext {
        let localctx: Elseif_clauseContext = new Elseif_clauseContext(this, this._ctx, this.state);
        this.enterRule(localctx, 74, MathJSLabParser.RULE_elseif_clause);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 783;
                this.match(MathJSLabParser.ELSEIF);
                this.state = 785;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 784;
                        this.sep();
                    }
                }

                this.state = 787;
                this.expression();
                this.state = 789;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 788;
                        this.sep();
                    }
                }

                this.state = 792;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 791;
                        this.list();
                    }
                }

                localctx.node = AST.nodeElseIf(localctx.expression().node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public else_clause(): Else_clauseContext {
        let localctx: Else_clauseContext = new Else_clauseContext(this, this._ctx, this.state);
        this.enterRule(localctx, 76, MathJSLabParser.RULE_else_clause);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 796;
                this.match(MathJSLabParser.ELSE);
                this.state = 798;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 797;
                        this.sep();
                    }
                }

                this.state = 801;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 800;
                        this.list();
                    }
                }

                localctx.node = AST.nodeElse(localctx.list() ? localctx.list().node : AST.nodeListFirst());
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public switch_command(): Switch_commandContext {
        let localctx: Switch_commandContext = new Switch_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 78, MathJSLabParser.RULE_switch_command);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 805;
                this.match(MathJSLabParser.SWITCH);
                this.state = 806;
                this.expression();
                this.state = 808;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 807;
                        this.sep();
                    }
                }

                this.state = 811;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 12) {
                    {
                        this.state = 810;
                        this.switch_case_list();
                    }
                }

                this.state = 814;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 13) {
                    {
                        this.state = 813;
                        this.otherwise_case();
                    }
                }

                this.state = 816;
                _la = this._input.LA(1);
                if (!(_la === 6 || _la === 11)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeSwitch(
                    localctx.expression().node,
                    localctx.switch_case_list() ? localctx.switch_case_list().node : AST.nodeListFirst(),
                    localctx.otherwise_case() ? localctx.otherwise_case().node : null,
                );
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public switch_case_list(): Switch_case_listContext {
        let localctx: Switch_case_listContext = new Switch_case_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 80, MathJSLabParser.RULE_switch_case_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 819;
                this.switch_case();

                localctx.node = AST.nodeListFirst(localctx.switch_case(localctx.i++).node);

                this.state = 829;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 80, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 822;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 55 || _la === 56 || _la === 106) {
                                    {
                                        this.state = 821;
                                        this.sep();
                                    }
                                }

                                this.state = 824;
                                this.switch_case();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.switch_case(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 831;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 80, this._ctx);
                }
                this.state = 833;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 832;
                        this.sep();
                    }
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public switch_case(): Switch_caseContext {
        let localctx: Switch_caseContext = new Switch_caseContext(this, this._ctx, this.state);
        this.enterRule(localctx, 82, MathJSLabParser.RULE_switch_case);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 835;
                this.match(MathJSLabParser.CASE);
                this.state = 837;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 836;
                        this.sep();
                    }
                }

                this.state = 839;
                this.expression();
                this.state = 841;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 83, this._ctx)) {
                    case 1:
                        {
                            this.state = 840;
                            this.sep();
                        }
                        break;
                }
                this.state = 844;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 843;
                        this.list();
                    }
                }

                localctx.node = AST.nodeSwitchCase(localctx.expression().node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public otherwise_case(): Otherwise_caseContext {
        let localctx: Otherwise_caseContext = new Otherwise_caseContext(this, this._ctx, this.state);
        this.enterRule(localctx, 84, MathJSLabParser.RULE_otherwise_case);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 848;
                this.match(MathJSLabParser.OTHERWISE);
                this.state = 850;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 85, this._ctx)) {
                    case 1:
                        {
                            this.state = 849;
                            this.sep();
                        }
                        break;
                }
                this.state = 853;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 852;
                        this.list();
                    }
                }

                this.state = 856;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 855;
                        this.sep();
                    }
                }

                localctx.node = localctx.list() ? localctx.list().node : AST.nodeListFirst();
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public loop_command(): Loop_commandContext {
        let localctx: Loop_commandContext = new Loop_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 86, MathJSLabParser.RULE_loop_command);
        try {
            this.state = 872;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 14:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 860;
                        this.while_command();

                        localctx.node = localctx.while_command().node;
                    }
                    break;
                case 16:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 863;
                        this.do_until_command();

                        localctx.node = localctx.do_until_command().node;
                    }
                    break;
                case 18:
                case 20:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 866;
                        this.for_command();

                        localctx.node = localctx.for_command().node;
                    }
                    break;
                case 22:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 869;
                        this.spmd_command();

                        localctx.node = localctx.spmd_command().node;
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public while_command(): While_commandContext {
        let localctx: While_commandContext = new While_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 88, MathJSLabParser.RULE_while_command);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 874;
                this.match(MathJSLabParser.WHILE);
                this.state = 875;
                this.expression();
                this.state = 877;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 876;
                        this.sep();
                    }
                }

                this.state = 880;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 879;
                        this.list();
                    }
                }

                this.state = 882;
                _la = this._input.LA(1);
                if (!(_la === 6 || _la === 15)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeWhile(localctx.expression().node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public do_until_command(): Do_until_commandContext {
        let localctx: Do_until_commandContext = new Do_until_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 90, MathJSLabParser.RULE_do_until_command);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 885;
                this.match(MathJSLabParser.DO);
                this.state = 887;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 886;
                        this.sep();
                    }
                }

                this.state = 890;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 889;
                        this.list();
                    }
                }

                this.state = 892;
                this.match(MathJSLabParser.UNTIL);
                this.state = 893;
                this.expression();

                localctx.node = AST.nodeDoUntil(localctx.list() ? localctx.list().node : AST.nodeListFirst(), localctx.expression().node);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public for_command(): For_commandContext {
        let localctx: For_commandContext = new For_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 92, MathJSLabParser.RULE_for_command);
        let _la: number;
        try {
            this.state = 956;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 102, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 896;
                        this.match(MathJSLabParser.FOR);
                        this.state = 897;
                        this.assign_lhs();
                        this.state = 898;
                        this.match(MathJSLabParser.EQ);
                        this.state = 899;
                        this.expression();
                        this.state = 901;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 55 || _la === 56 || _la === 106) {
                            {
                                this.state = 900;
                                this.sep();
                            }
                        }

                        this.state = 904;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                            (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 903;
                                this.list();
                            }
                        }

                        this.state = 906;
                        _la = this._input.LA(1);
                        if (!(_la === 6 || _la === 19)) {
                            this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }

                        localctx.node = AST.nodeFor(localctx.assign_lhs().node, localctx.expression(0).node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 909;
                        this.match(MathJSLabParser.FOR);
                        this.state = 910;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 911;
                        this.assign_lhs();
                        this.state = 912;
                        this.match(MathJSLabParser.EQ);
                        this.state = 913;
                        this.expression();
                        this.state = 914;
                        this.match(MathJSLabParser.RPAREN);
                        this.state = 916;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 55 || _la === 56 || _la === 106) {
                            {
                                this.state = 915;
                                this.sep();
                            }
                        }

                        this.state = 919;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                            (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 918;
                                this.list();
                            }
                        }

                        this.state = 921;
                        _la = this._input.LA(1);
                        if (!(_la === 6 || _la === 19)) {
                            this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }

                        localctx.node = AST.nodeFor(localctx.assign_lhs().node, localctx.expression(0).node, localctx.list() ? localctx.list().node : AST.nodeListFirst());
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 924;
                        this.match(MathJSLabParser.PARFOR);
                        this.state = 925;
                        this.assign_lhs();
                        this.state = 926;
                        this.match(MathJSLabParser.EQ);
                        this.state = 927;
                        this.expression();
                        this.state = 929;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 55 || _la === 56 || _la === 106) {
                            {
                                this.state = 928;
                                this.sep();
                            }
                        }

                        this.state = 932;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                            (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 931;
                                this.list();
                            }
                        }

                        this.state = 934;
                        _la = this._input.LA(1);
                        if (!(_la === 6 || _la === 21)) {
                            this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }

                        localctx.node = AST.nodeFor(localctx.assign_lhs().node, localctx.expression(0).node, localctx.list() ? localctx.list().node : AST.nodeListFirst(), true);
                    }
                    break;
                case 4:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 937;
                        this.match(MathJSLabParser.PARFOR);
                        this.state = 938;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 939;
                        this.assign_lhs();
                        this.state = 940;
                        this.match(MathJSLabParser.EQ);
                        this.state = 941;
                        this.expression();
                        this.state = 944;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 56) {
                            {
                                this.state = 942;
                                this.match(MathJSLabParser.COMMA);
                                this.state = 943;
                                this.expression();
                            }
                        }

                        this.state = 946;
                        this.match(MathJSLabParser.RPAREN);
                        this.state = 948;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 55 || _la === 56 || _la === 106) {
                            {
                                this.state = 947;
                                this.sep();
                            }
                        }

                        this.state = 951;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                            (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 950;
                                this.list();
                            }
                        }

                        this.state = 953;
                        _la = this._input.LA(1);
                        if (!(_la === 6 || _la === 21)) {
                            this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }

                        localctx.node = AST.nodeFor(
                            localctx.assign_lhs().node,
                            localctx.expression(0).node,
                            localctx.list() ? localctx.list().node : AST.nodeListFirst(),
                            true,
                            localctx.expression(1) ? localctx.expression(1).node : null,
                        );
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public spmd_command(): Spmd_commandContext {
        let localctx: Spmd_commandContext = new Spmd_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 94, MathJSLabParser.RULE_spmd_command);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 958;
                this.match(MathJSLabParser.SPMD);
                this.state = 960;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 103, this._ctx)) {
                    case 1:
                        {
                            this.state = 959;
                            this.spmd_worker_spec();
                        }
                        break;
                }
                this.state = 963;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 962;
                        this.sep();
                    }
                }

                this.state = 966;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 965;
                        this.list();
                    }
                }

                this.state = 968;
                _la = this._input.LA(1);
                if (!(_la === 6 || _la === 23)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeSpmd(localctx.list() ? localctx.list().node : AST.nodeListFirst(), localctx.spmd_worker_spec() ? localctx.spmd_worker_spec().node : null);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public spmd_worker_spec(): Spmd_worker_specContext {
        let localctx: Spmd_worker_specContext = new Spmd_worker_specContext(this, this._ctx, this.state);
        this.enterRule(localctx, 96, MathJSLabParser.RULE_spmd_worker_spec);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 971;
                this.match(MathJSLabParser.LPAREN);
                this.state = 972;
                this.expression();

                localctx.node = AST.nodeListFirst(localctx.expression(localctx.i++).node);

                this.state = 978;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 56) {
                    {
                        this.state = 974;
                        this.match(MathJSLabParser.COMMA);
                        this.state = 975;
                        this.expression();

                        localctx.node = AST.appendNodeList(localctx.node, localctx.expression(localctx.i++).node);
                    }
                }

                this.state = 980;
                this.match(MathJSLabParser.RPAREN);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public jump_command(): Jump_commandContext {
        let localctx: Jump_commandContext = new Jump_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 98, MathJSLabParser.RULE_jump_command);
        try {
            this.state = 988;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 24:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 982;
                        this.match(MathJSLabParser.BREAK);

                        localctx.node = AST.nodeBreak();
                    }
                    break;
                case 25:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 984;
                        this.match(MathJSLabParser.CONTINUE);

                        localctx.node = AST.nodeContinue();
                    }
                    break;
                case 26:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 986;
                        this.match(MathJSLabParser.RETURN);

                        localctx.node = AST.nodeReturn();
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public except_command(): Except_commandContext {
        let localctx: Except_commandContext = new Except_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 100, MathJSLabParser.RULE_except_command);
        try {
            this.state = 996;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 29:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 990;
                        this.try_command();

                        localctx.node = localctx.try_command().node;
                    }
                    break;
                case 32:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 993;
                        this.unwind_command();

                        localctx.node = localctx.unwind_command().node;
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public try_command(): Try_commandContext {
        let localctx: Try_commandContext = new Try_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 102, MathJSLabParser.RULE_try_command);
        let _la: number;
        try {
            this.state = 1018;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 113, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 998;
                        this.match(MathJSLabParser.TRY);
                        this.state = 1000;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 55 || _la === 56 || _la === 106) {
                            {
                                this.state = 999;
                                this.sep();
                            }
                        }

                        this.state = 1003;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                            (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 1002;
                                this.list();
                            }
                        }

                        this.state = 1005;
                        this.catch_clause();
                        this.state = 1006;
                        _la = this._input.LA(1);
                        if (!(_la === 6 || _la === 31)) {
                            this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }

                        localctx.node = AST.nodeTry(localctx.list() ? localctx.list().node : AST.nodeListFirst(), localctx.catch_clause().body, localctx.catch_clause().identifierNode);
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 1009;
                        this.match(MathJSLabParser.TRY);
                        this.state = 1011;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 55 || _la === 56 || _la === 106) {
                            {
                                this.state = 1010;
                                this.sep();
                            }
                        }

                        this.state = 1014;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                            (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 1013;
                                this.list();
                            }
                        }

                        this.state = 1016;
                        _la = this._input.LA(1);
                        if (!(_la === 6 || _la === 31)) {
                            this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }

                        localctx.node = AST.nodeTry(localctx.list() ? localctx.list().node : AST.nodeListFirst());
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public catch_clause(): Catch_clauseContext {
        let localctx: Catch_clauseContext = new Catch_clauseContext(this, this._ctx, this.state);
        this.enterRule(localctx, 104, MathJSLabParser.RULE_catch_clause);
        let _la: number;
        try {
            this.state = 1038;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 118, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 1020;
                        this.match(MathJSLabParser.CATCH);
                        this.state = 1021;
                        this.identifier();
                        this.state = 1023;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 55 || _la === 56 || _la === 106) {
                            {
                                this.state = 1022;
                                this.sep();
                            }
                        }

                        this.state = 1026;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                            (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 1025;
                                this.list();
                            }
                        }

                        localctx.identifierNode = localctx.identifier().node;
                        localctx.body = localctx.list() ? localctx.list().node : AST.nodeListFirst();
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 1030;
                        this.match(MathJSLabParser.CATCH);
                        this.state = 1032;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 55 || _la === 56 || _la === 106) {
                            {
                                this.state = 1031;
                                this.sep();
                            }
                        }

                        this.state = 1035;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                            (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 1034;
                                this.list();
                            }
                        }

                        localctx.identifierNode = null;
                        localctx.body = localctx.list() ? localctx.list().node : AST.nodeListFirst();
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public unwind_command(): Unwind_commandContext {
        let localctx: Unwind_commandContext = new Unwind_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 106, MathJSLabParser.RULE_unwind_command);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1040;
                this.match(MathJSLabParser.UNWIND_PROTECT);
                this.state = 1042;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1041;
                        this.sep();
                    }
                }

                this.state = 1045;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 1044;
                        this.list();
                    }
                }

                this.state = 1047;
                this.unwind_cleanup_clause();
                this.state = 1048;
                _la = this._input.LA(1);
                if (!(_la === 6 || _la === 34)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeUnwindProtect(localctx.list() ? localctx.list().node : AST.nodeListFirst(), localctx.unwind_cleanup_clause().node);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public unwind_cleanup_clause(): Unwind_cleanup_clauseContext {
        let localctx: Unwind_cleanup_clauseContext = new Unwind_cleanup_clauseContext(this, this._ctx, this.state);
        this.enterRule(localctx, 108, MathJSLabParser.RULE_unwind_cleanup_clause);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1051;
                this.match(MathJSLabParser.UNWIND_PROTECT_CLEANUP);
                this.state = 1053;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1052;
                        this.sep();
                    }
                }

                this.state = 1056;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 1055;
                        this.list();
                    }
                }

                localctx.node = localctx.list() ? localctx.list().node : AST.nodeListFirst();
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public param_list(): Param_listContext {
        let localctx: Param_listContext = new Param_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 110, MathJSLabParser.RULE_param_list);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1060;
                this.match(MathJSLabParser.LPAREN);

                localctx.node = AST.nodeListFirst();

                this.state = 1073;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if ((((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 2097237) !== 0) || _la === 101) {
                    {
                        this.state = 1062;
                        this.param_list_elt();

                        localctx.node = AST.appendNodeList(localctx.node, localctx.param_list_elt(localctx.i++).node);

                        this.state = 1070;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        while (_la === 56) {
                            {
                                {
                                    this.state = 1064;
                                    this.match(MathJSLabParser.COMMA);
                                    this.state = 1065;
                                    this.param_list_elt();

                                    localctx.node = AST.appendNodeList(localctx.node, localctx.param_list_elt(localctx.i++).node);
                                }
                            }
                            this.state = 1072;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                        }
                    }
                }

                this.state = 1075;
                this.match(MathJSLabParser.RPAREN);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public param_list_elt(): Param_list_eltContext {
        let localctx: Param_list_eltContext = new Param_list_eltContext(this, this._ctx, this.state);
        this.enterRule(localctx, 112, MathJSLabParser.RULE_param_list_elt);
        try {
            this.state = 1083;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 37:
                case 39:
                case 41:
                case 43:
                case 101:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 1077;
                        this.declaration_element();

                        localctx.node = localctx.declaration_element().node;
                    }
                    break;
                case 58:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 1080;
                        this.magic_tilde();

                        localctx.node = localctx.magic_tilde().node;
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public return_list_elt(): Return_list_eltContext {
        let localctx: Return_list_eltContext = new Return_list_eltContext(this, this._ctx, this.state);
        this.enterRule(localctx, 114, MathJSLabParser.RULE_return_list_elt);
        try {
            this.state = 1091;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 37:
                case 39:
                case 41:
                case 43:
                case 101:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 1085;
                        this.identifier();

                        localctx.node = localctx.identifier().node;
                    }
                    break;
                case 58:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 1088;
                        this.magic_tilde();

                        localctx.node = localctx.magic_tilde().node;
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public return_list(): Return_listContext {
        let localctx: Return_listContext = new Return_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 116, MathJSLabParser.RULE_return_list);
        let _la: number;
        try {
            this.state = 1112;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 37:
                case 39:
                case 41:
                case 43:
                case 58:
                case 101:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 1093;
                        this.return_list_elt();

                        localctx.node = AST.nodeListFirst(localctx.return_list_elt(0).node);
                    }
                    break;
                case 64:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 1096;
                        this.match(MathJSLabParser.LBRACKET);

                        localctx.node = AST.nodeListFirst();

                        this.state = 1109;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if ((((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 2097237) !== 0) || _la === 101) {
                            {
                                this.state = 1098;
                                this.return_list_elt();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.return_list_elt(localctx.i++).node);

                                this.state = 1106;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                while (_la === 45 || _la === 56) {
                                    {
                                        {
                                            this.state = 1100;
                                            _la = this._input.LA(1);
                                            if (!(_la === 45 || _la === 56)) {
                                                this._errHandler.recoverInline(this);
                                            } else {
                                                this._errHandler.reportMatch(this);
                                                this.consume();
                                            }
                                            this.state = 1101;
                                            this.return_list_elt();

                                            localctx.node = AST.appendNodeList(localctx.node, localctx.return_list_elt(localctx.i++).node);
                                        }
                                    }
                                    this.state = 1108;
                                    this._errHandler.sync(this);
                                    _la = this._input.LA(1);
                                }
                            }
                        }

                        this.state = 1111;
                        this.match(MathJSLabParser.RBRACKET);
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public function_(): FunctionContext {
        let localctx: FunctionContext = new FunctionContext(this, this._ctx, this.state);
        this.enterRule(localctx, 118, MathJSLabParser.RULE_function);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1114;
                this.match(MathJSLabParser.FUNCTION);
                this.state = 1118;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 130, this._ctx)) {
                    case 1:
                        {
                            this.state = 1115;
                            this.return_list();
                            this.state = 1116;
                            this.match(MathJSLabParser.EQ);
                        }
                        break;
                }
                this.state = 1120;
                this.function_name();
                this.state = 1122;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 131, this._ctx)) {
                    case 1:
                        {
                            this.state = 1121;
                            this.param_list();
                        }
                        break;
                }
                this.state = 1125;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1124;
                        this.sep();
                    }
                }

                this.state = 1128;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 47) {
                    {
                        this.state = 1127;
                        this.arguments_block_list();
                    }
                }

                this.state = 1131;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    (((_la - 1) & ~0x1f) === 0 && ((1 << (_la - 1)) & 2544542287) !== 0) ||
                    (((_la - 35) & ~0x1f) === 0 && ((1 << (_la - 35)) & 2944452949) !== 0) ||
                    (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                    _la === 142
                ) {
                    {
                        this.state = 1130;
                        this.list();
                    }
                }

                this.state = 1133;
                _la = this._input.LA(1);
                if (!(((_la - -1) & ~0x1f) === 0 && ((1 << (_la - -1)) & 536871041) !== 0)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeFunctionDefinition(
                    localctx.function_name().node,
                    localctx.return_list() ? localctx.return_list().node : AST.nodeListFirst(),
                    localctx.param_list() ? localctx.param_list().node : AST.nodeListFirst(),
                    localctx.arguments_block_list() ? localctx.arguments_block_list().node : AST.nodeListFirst(),
                    localctx.list() ? localctx.list().node : AST.nodeListFirst(),
                );
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public function_name(): Function_nameContext {
        let localctx: Function_nameContext = new Function_nameContext(this, this._ctx, this.state);
        this.enterRule(localctx, 120, MathJSLabParser.RULE_function_name);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1136;
                this.qualified_identifier();

                localctx.node = localctx.qualified_identifier().node;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public classdef_command(): Classdef_commandContext {
        let localctx: Classdef_commandContext = new Classdef_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 122, MathJSLabParser.RULE_classdef_command);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1139;
                this.match(MathJSLabParser.CLASSDEF);
                this.state = 1141;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 62) {
                    {
                        this.state = 1140;
                        this.class_attribute_list();
                    }
                }

                this.state = 1143;
                this.qualified_identifier();
                this.state = 1145;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 85) {
                    {
                        this.state = 1144;
                        this.class_superclass_list();
                    }
                }

                this.state = 1148;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1147;
                        this.sep();
                    }
                }

                this.state = 1151;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 85) !== 0) {
                    {
                        this.state = 1150;
                        this.class_section_list();
                    }
                }

                this.state = 1153;
                _la = this._input.LA(1);
                if (!(_la === -1 || _la === 6 || _la === 36)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeClassDef(
                    localctx.qualified_identifier().node,
                    localctx.class_section_list() ? localctx.class_section_list().node : AST.nodeListFirst(),
                    localctx.class_attribute_list() ? localctx.class_attribute_list().node : AST.nodeListFirst(),
                    localctx.class_superclass_list() ? localctx.class_superclass_list().node : AST.nodeListFirst(),
                );
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_attribute_list(): Class_attribute_listContext {
        let localctx: Class_attribute_listContext = new Class_attribute_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 124, MathJSLabParser.RULE_class_attribute_list);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1156;
                this.match(MathJSLabParser.LPAREN);

                localctx.node = AST.nodeListFirst();

                this.state = 1169;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if ((((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 6291541) !== 0) || _la === 101) {
                    {
                        this.state = 1158;
                        this.class_attribute();

                        localctx.node = AST.appendNodeList(localctx.node, localctx.class_attribute(localctx.i++).node);

                        this.state = 1166;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        while (_la === 56) {
                            {
                                {
                                    this.state = 1160;
                                    this.match(MathJSLabParser.COMMA);
                                    this.state = 1161;
                                    this.class_attribute();

                                    localctx.node = AST.appendNodeList(localctx.node, localctx.class_attribute(localctx.i++).node);
                                }
                            }
                            this.state = 1168;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                        }
                    }
                }

                this.state = 1171;
                this.match(MathJSLabParser.RPAREN);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_attribute(): Class_attributeContext {
        let localctx: Class_attributeContext = new Class_attributeContext(this, this._ctx, this.state);
        this.enterRule(localctx, 126, MathJSLabParser.RULE_class_attribute);
        let _la: number;
        try {
            this.state = 1184;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 37:
                case 39:
                case 41:
                case 43:
                case 101:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 1173;
                        this.identifier();
                        this.state = 1176;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 53) {
                            {
                                this.state = 1174;
                                this.match(MathJSLabParser.EQ);
                                this.state = 1175;
                                this.expression();
                            }
                        }

                        localctx.node = AST.nodeClassAttribute(localctx.identifier().node, localctx.expression() ? localctx.expression().node : null);
                    }
                    break;
                case 58:
                case 59:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 1180;
                        localctx._op = this._input.LT(1);
                        _la = this._input.LA(1);
                        if (!(_la === 58 || _la === 59)) {
                            localctx._op = this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }
                        this.state = 1181;
                        this.identifier();

                        localctx.node = AST.nodeClassAttribute(localctx.identifier().node, AST.nodeOperation(localctx._op.text as OperatorType, localctx.identifier().node));
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_method_name(): Class_method_nameContext {
        let localctx: Class_method_nameContext = new Class_method_nameContext(this, this._ctx, this.state);
        this.enterRule(localctx, 128, MathJSLabParser.RULE_class_method_name);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1186;
                this.identifier();

                localctx.node = AST.nodeIdentifier(localctx.identifier(0).node.id);

                this.state = 1194;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 57) {
                    {
                        {
                            this.state = 1188;
                            this.match(MathJSLabParser.DOT);
                            this.state = 1189;
                            this.identifier();

                            localctx.node = AST.nodeIdentifier(localctx.node.id + '.' + localctx.identifier(localctx.i++).node.id);
                        }
                    }
                    this.state = 1196;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_superclass_list(): Class_superclass_listContext {
        let localctx: Class_superclass_listContext = new Class_superclass_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 130, MathJSLabParser.RULE_class_superclass_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1197;
                this.match(MathJSLabParser.EXPR_LT);
                this.state = 1198;
                this.qualified_identifier();

                localctx.node = AST.nodeListFirst(localctx.qualified_identifier(localctx.i++).node);

                this.state = 1206;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 144, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 1200;
                                _la = this._input.LA(1);
                                if (!(_la === 56 || _la === 83)) {
                                    this._errHandler.recoverInline(this);
                                } else {
                                    this._errHandler.reportMatch(this);
                                    this.consume();
                                }
                                this.state = 1201;
                                this.qualified_identifier();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.qualified_identifier(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 1208;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 144, this._ctx);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_section_list(): Class_section_listContext {
        let localctx: Class_section_listContext = new Class_section_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 132, MathJSLabParser.RULE_class_section_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1209;
                this.class_section();

                localctx.node = AST.nodeListFirst(localctx.class_section(localctx.i++).node);

                this.state = 1219;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 146, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 1212;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 55 || _la === 56 || _la === 106) {
                                    {
                                        this.state = 1211;
                                        this.sep();
                                    }
                                }

                                this.state = 1214;
                                this.class_section();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.class_section(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 1221;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 146, this._ctx);
                }
                this.state = 1223;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1222;
                        this.sep();
                    }
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_section(): Class_sectionContext {
        let localctx: Class_sectionContext = new Class_sectionContext(this, this._ctx, this.state);
        this.enterRule(localctx, 134, MathJSLabParser.RULE_class_section);
        try {
            this.state = 1237;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 39:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 1225;
                        this.properties_section();

                        localctx.node = localctx.properties_section().node;
                    }
                    break;
                case 43:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 1228;
                        this.methods_section();

                        localctx.node = localctx.methods_section().node;
                    }
                    break;
                case 41:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 1231;
                        this.events_section();

                        localctx.node = localctx.events_section().node;
                    }
                    break;
                case 37:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 1234;
                        this.enumeration_section();

                        localctx.node = localctx.enumeration_section().node;
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public properties_section(): Properties_sectionContext {
        let localctx: Properties_sectionContext = new Properties_sectionContext(this, this._ctx, this.state);
        this.enterRule(localctx, 136, MathJSLabParser.RULE_properties_section);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1239;
                this.match(MathJSLabParser.PROPERTIES);
                this.state = 1241;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 62) {
                    {
                        this.state = 1240;
                        this.class_attribute_list();
                    }
                }

                this.state = 1244;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1243;
                        this.sep();
                    }
                }

                this.state = 1247;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if ((((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 85) !== 0) || _la === 101) {
                    {
                        this.state = 1246;
                        this.class_property_list();
                    }
                }

                this.state = 1249;
                _la = this._input.LA(1);
                if (!(_la === 6 || _la === 40)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeClassSection(
                    'PROPERTIES',
                    localctx.class_property_list() ? localctx.class_property_list().node : AST.nodeListFirst(),
                    localctx.class_attribute_list() ? localctx.class_attribute_list().node : AST.nodeListFirst(),
                );
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_property_list(): Class_property_listContext {
        let localctx: Class_property_listContext = new Class_property_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 138, MathJSLabParser.RULE_class_property_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1252;
                this.class_property();

                localctx.node = AST.nodeListFirst(localctx.class_property(localctx.i++).node);

                this.state = 1260;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 152, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 1254;
                                this.sep();
                                this.state = 1255;
                                this.class_property();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.class_property(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 1262;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 152, this._ctx);
                }
                this.state = 1264;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1263;
                        this.sep();
                    }
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_property(): Class_propertyContext {
        let localctx: Class_propertyContext = new Class_propertyContext(this, this._ctx, this.state);
        this.enterRule(localctx, 140, MathJSLabParser.RULE_class_property);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1266;
                this.identifier();
                this.state = 1271;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 62) {
                    {
                        this.state = 1267;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 1268;
                        this.arg_list();
                        this.state = 1269;
                        this.match(MathJSLabParser.RPAREN);
                    }
                }

                this.state = 1274;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 155, this._ctx)) {
                    case 1:
                        {
                            this.state = 1273;
                            this.qualified_identifier();
                        }
                        break;
                }
                this.state = 1280;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 66) {
                    {
                        this.state = 1276;
                        this.match(MathJSLabParser.LCURLYBR);
                        this.state = 1277;
                        this.arg_list();
                        this.state = 1278;
                        this.match(MathJSLabParser.RCURLYBR);
                    }
                }

                this.state = 1284;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 53) {
                    {
                        this.state = 1282;
                        this.match(MathJSLabParser.EQ);
                        this.state = 1283;
                        this.expression();
                    }
                }

                localctx.node = AST.nodeClassProperty(
                    localctx.identifier().node,
                    localctx.LPAREN() ? localctx.arg_list(0).node : AST.nodeListFirst(),
                    localctx.qualified_identifier() ? localctx.qualified_identifier().node : null,
                    localctx.LCURLYBR() ? localctx.arg_list(localctx.LPAREN() ? 1 : 0).node : AST.nodeListFirst(),
                    localctx.expression() ? localctx.expression().node : null,
                );
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public methods_section(): Methods_sectionContext {
        let localctx: Methods_sectionContext = new Methods_sectionContext(this, this._ctx, this.state);
        this.enterRule(localctx, 142, MathJSLabParser.RULE_methods_section);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1288;
                this.match(MathJSLabParser.METHODS);
                this.state = 1290;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 62) {
                    {
                        this.state = 1289;
                        this.class_attribute_list();
                    }
                }

                this.state = 1293;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1292;
                        this.sep();
                    }
                }

                this.state = 1296;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 27 || (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 136314965) !== 0) || _la === 101) {
                    {
                        this.state = 1295;
                        this.class_method_list();
                    }
                }

                this.state = 1298;
                _la = this._input.LA(1);
                if (!(_la === 6 || _la === 44)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeClassSection(
                    'METHODS',
                    localctx.class_method_list() ? localctx.class_method_list().node : AST.nodeListFirst(),
                    localctx.class_attribute_list() ? localctx.class_attribute_list().node : AST.nodeListFirst(),
                );
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_method(): Class_methodContext {
        let localctx: Class_methodContext = new Class_methodContext(this, this._ctx, this.state);
        this.enterRule(localctx, 144, MathJSLabParser.RULE_class_method);
        let _la: number;
        try {
            this.state = 1318;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 163, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 1301;
                        this.function_();

                        localctx.node = localctx.function_().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 1304;
                        this.class_method_name();
                        this.state = 1306;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 62) {
                            {
                                this.state = 1305;
                                this.param_list();
                            }
                        }

                        localctx.node = AST.nodeFunctionDefinition(
                            localctx.class_method_name().node,
                            AST.nodeListFirst(),
                            localctx.param_list() ? localctx.param_list().node : AST.nodeListFirst(),
                            AST.nodeListFirst(),
                            AST.nodeListFirst(),
                        );
                        localctx.node.attributes = { ...(localctx.node.attributes ?? {}), prototype: true };
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 1310;
                        this.return_list();
                        this.state = 1311;
                        this.match(MathJSLabParser.EQ);
                        this.state = 1312;
                        this.class_method_name();
                        this.state = 1314;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 62) {
                            {
                                this.state = 1313;
                                this.param_list();
                            }
                        }

                        localctx.node = AST.nodeFunctionDefinition(
                            localctx.class_method_name().node,
                            localctx.return_list().node,
                            localctx.param_list() ? localctx.param_list().node : AST.nodeListFirst(),
                            AST.nodeListFirst(),
                            AST.nodeListFirst(),
                        );
                        localctx.node.attributes = { ...(localctx.node.attributes ?? {}), prototype: true };
                    }
                    break;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_method_list(): Class_method_listContext {
        let localctx: Class_method_listContext = new Class_method_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 146, MathJSLabParser.RULE_class_method_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1320;
                this.class_method();

                localctx.node = AST.nodeListFirst(localctx.class_method(localctx.i++).node);

                this.state = 1330;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 165, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 1323;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 55 || _la === 56 || _la === 106) {
                                    {
                                        this.state = 1322;
                                        this.sep();
                                    }
                                }

                                this.state = 1325;
                                this.class_method();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.class_method(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 1332;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 165, this._ctx);
                }
                this.state = 1334;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1333;
                        this.sep();
                    }
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public events_section(): Events_sectionContext {
        let localctx: Events_sectionContext = new Events_sectionContext(this, this._ctx, this.state);
        this.enterRule(localctx, 148, MathJSLabParser.RULE_events_section);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1336;
                this.match(MathJSLabParser.EVENTS);
                this.state = 1338;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 62) {
                    {
                        this.state = 1337;
                        this.class_attribute_list();
                    }
                }

                this.state = 1341;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1340;
                        this.sep();
                    }
                }

                this.state = 1344;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if ((((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 85) !== 0) || _la === 101) {
                    {
                        this.state = 1343;
                        this.class_event_list();
                    }
                }

                this.state = 1346;
                _la = this._input.LA(1);
                if (!(_la === 6 || _la === 42)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeClassSection(
                    'EVENTS',
                    localctx.class_event_list() ? localctx.class_event_list().node : AST.nodeListFirst(),
                    localctx.class_attribute_list() ? localctx.class_attribute_list().node : AST.nodeListFirst(),
                );
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_event_list(): Class_event_listContext {
        let localctx: Class_event_listContext = new Class_event_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 150, MathJSLabParser.RULE_class_event_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1349;
                this.class_event();

                localctx.node = AST.nodeListFirst(localctx.class_event(localctx.i++).node);

                this.state = 1359;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 171, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 1352;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 55 || _la === 56 || _la === 106) {
                                    {
                                        this.state = 1351;
                                        this.sep();
                                    }
                                }

                                this.state = 1354;
                                this.class_event();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.class_event(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 1361;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 171, this._ctx);
                }
                this.state = 1363;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1362;
                        this.sep();
                    }
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_event(): Class_eventContext {
        let localctx: Class_eventContext = new Class_eventContext(this, this._ctx, this.state);
        this.enterRule(localctx, 152, MathJSLabParser.RULE_class_event);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1365;
                this.identifier();

                localctx.node = AST.nodeClassEvent(localctx.identifier().node);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public enumeration_section(): Enumeration_sectionContext {
        let localctx: Enumeration_sectionContext = new Enumeration_sectionContext(this, this._ctx, this.state);
        this.enterRule(localctx, 154, MathJSLabParser.RULE_enumeration_section);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1368;
                this.match(MathJSLabParser.ENUMERATION);
                this.state = 1370;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 62) {
                    {
                        this.state = 1369;
                        this.class_attribute_list();
                    }
                }

                this.state = 1373;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1372;
                        this.sep();
                    }
                }

                this.state = 1376;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if ((((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 85) !== 0) || _la === 101) {
                    {
                        this.state = 1375;
                        this.class_enumeration_list();
                    }
                }

                this.state = 1378;
                _la = this._input.LA(1);
                if (!(_la === 6 || _la === 38)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeClassSection(
                    'ENUMERATION',
                    localctx.class_enumeration_list() ? localctx.class_enumeration_list().node : AST.nodeListFirst(),
                    localctx.class_attribute_list() ? localctx.class_attribute_list().node : AST.nodeListFirst(),
                );
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_enumeration_list(): Class_enumeration_listContext {
        let localctx: Class_enumeration_listContext = new Class_enumeration_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 156, MathJSLabParser.RULE_class_enumeration_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1381;
                this.class_enumeration();

                localctx.node = AST.nodeListFirst(localctx.class_enumeration(localctx.i++).node);

                this.state = 1391;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 177, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 1384;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 55 || _la === 56 || _la === 106) {
                                    {
                                        this.state = 1383;
                                        this.sep();
                                    }
                                }

                                this.state = 1386;
                                this.class_enumeration();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.class_enumeration(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 1393;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 177, this._ctx);
                }
                this.state = 1395;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1394;
                        this.sep();
                    }
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public class_enumeration(): Class_enumerationContext {
        let localctx: Class_enumerationContext = new Class_enumerationContext(this, this._ctx, this.state);
        this.enterRule(localctx, 158, MathJSLabParser.RULE_class_enumeration);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1397;
                this.identifier();
                this.state = 1403;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 62) {
                    {
                        this.state = 1398;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 1400;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (
                            _la === 7 ||
                            (((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 736244309) !== 0) ||
                            (((_la - 94) & ~0x1f) === 0 && ((1 << (_la - 94)) & 387) !== 0) ||
                            _la === 142
                        ) {
                            {
                                this.state = 1399;
                                this.arg_list();
                            }
                        }

                        this.state = 1402;
                        this.match(MathJSLabParser.RPAREN);
                    }
                }

                localctx.node = AST.nodeClassEnumeration(localctx.identifier().node, localctx.arg_list() ? localctx.arg_list().node : AST.nodeListFirst());
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public arguments_block_list(): Arguments_block_listContext {
        let localctx: Arguments_block_listContext = new Arguments_block_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 160, MathJSLabParser.RULE_arguments_block_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1407;
                this.arguments_block();

                localctx.node = AST.nodeListFirst(localctx.arguments_block(localctx.i++).node);

                this.state = 1417;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 182, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 1410;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 55 || _la === 56 || _la === 106) {
                                    {
                                        this.state = 1409;
                                        this.sep();
                                    }
                                }

                                this.state = 1412;
                                this.arguments_block();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.arguments_block(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 1419;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 182, this._ctx);
                }
                this.state = 1421;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1420;
                        this.sep();
                    }
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public arguments_block(): Arguments_blockContext {
        let localctx: Arguments_blockContext = new Arguments_blockContext(this, this._ctx, this.state);
        this.enterRule(localctx, 162, MathJSLabParser.RULE_arguments_block);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1423;
                this.match(MathJSLabParser.ARGUMENTS);
                this.state = 1425;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 184, this._ctx)) {
                    case 1:
                        {
                            this.state = 1424;
                            this.sep();
                        }
                        break;
                }
                this.state = 1433;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 62) {
                    {
                        this.state = 1427;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 1428;
                        this.identifier();
                        this.state = 1429;
                        this.match(MathJSLabParser.RPAREN);
                        this.state = 1431;
                        this._errHandler.sync(this);
                        switch (this._interp.adaptivePredict(this._input, 185, this._ctx)) {
                            case 1:
                                {
                                    this.state = 1430;
                                    this.sep();
                                }
                                break;
                        }
                    }
                }

                this.state = 1436;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if ((((_la - 37) & ~0x1f) === 0 && ((1 << (_la - 37)) & 85) !== 0) || _la === 101) {
                    {
                        this.state = 1435;
                        this.args_validation_list();
                    }
                }

                this.state = 1439;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 55 || _la === 56 || _la === 106) {
                    {
                        this.state = 1438;
                        this.sep();
                    }
                }

                this.state = 1441;
                _la = this._input.LA(1);
                if (!(_la === 6 || _la === 48)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeArguments(
                    localctx.identifier() ? localctx.identifier().node : null,
                    localctx.args_validation_list() ? localctx.args_validation_list().node : AST.nodeListFirst(),
                );
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public args_validation_list(): Args_validation_listContext {
        let localctx: Args_validation_listContext = new Args_validation_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 164, MathJSLabParser.RULE_args_validation_list);
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1444;
                this.arg_validation();

                localctx.node = AST.nodeListFirst(localctx.arg_validation(localctx.i++).node);

                this.state = 1452;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 189, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 1446;
                                this.sep();
                                this.state = 1447;
                                this.arg_validation();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.arg_validation(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 1454;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 189, this._ctx);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public arg_validation(): Arg_validationContext {
        let localctx: Arg_validationContext = new Arg_validationContext(this, this._ctx, this.state);
        this.enterRule(localctx, 166, MathJSLabParser.RULE_arg_validation);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1455;
                this.arg_validation_name();
                this.state = 1460;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 62) {
                    {
                        this.state = 1456;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 1457;
                        this.arg_list();
                        this.state = 1458;
                        this.match(MathJSLabParser.RPAREN);
                    }
                }

                this.state = 1463;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 191, this._ctx)) {
                    case 1:
                        {
                            this.state = 1462;
                            this.qualified_identifier();
                        }
                        break;
                }
                this.state = 1469;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 66) {
                    {
                        this.state = 1465;
                        this.match(MathJSLabParser.LCURLYBR);
                        this.state = 1466;
                        this.arg_list();
                        this.state = 1467;
                        this.match(MathJSLabParser.RCURLYBR);
                    }
                }

                this.state = 1473;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 53) {
                    {
                        this.state = 1471;
                        this.match(MathJSLabParser.EQ);
                        this.state = 1472;
                        this.expression();
                    }
                }

                localctx.node = AST.nodeArgumentValidation(
                    localctx.arg_validation_name().node,
                    localctx.LPAREN() ? localctx.arg_list(0).node : AST.nodeListFirst(),
                    localctx.qualified_identifier() ? localctx.qualified_identifier().node : AST.nodeListFirst(),
                    localctx.LCURLYBR() ? (localctx.LPAREN() ? localctx.arg_list(1).node : localctx.arg_list(0).node) : AST.nodeListFirst(),
                    localctx.expression() ? localctx.expression().node : null,
                );
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public arg_validation_name(): Arg_validation_nameContext {
        let localctx: Arg_validation_nameContext = new Arg_validation_nameContext(this, this._ctx, this.state);
        this.enterRule(localctx, 168, MathJSLabParser.RULE_arg_validation_name);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1477;
                this.identifier();

                localctx.node = localctx.identifier(0).node;

                this.state = 1485;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 57) {
                    {
                        {
                            this.state = 1479;
                            this.match(MathJSLabParser.DOT);
                            this.state = 1480;
                            this.identifier();

                            localctx.node = AST.nodeIndirectRef(localctx.node, localctx.identifier(localctx.i++).node.id);
                        }
                    }
                    this.state = 1487;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public sep_no_nl(): Sep_no_nlContext {
        let localctx: Sep_no_nlContext = new Sep_no_nlContext(this, this._ctx, this.state);
        this.enterRule(localctx, 170, MathJSLabParser.RULE_sep_no_nl);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1489;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                    {
                        {
                            this.state = 1488;
                            _la = this._input.LA(1);
                            if (!(_la === 55 || _la === 56)) {
                                this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                        }
                    }
                    this.state = 1491;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                } while (_la === 55 || _la === 56);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public nl(): NlContext {
        let localctx: NlContext = new NlContext(this, this._ctx, this.state);
        this.enterRule(localctx, 172, MathJSLabParser.RULE_nl);
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1494;
                this._errHandler.sync(this);
                _alt = 1;
                do {
                    switch (_alt) {
                        case 1:
                            {
                                {
                                    this.state = 1493;
                                    this.match(MathJSLabParser.NEWLINE);
                                }
                            }
                            break;
                        default:
                            throw new NoViableAltException(this);
                    }
                    this.state = 1496;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 196, this._ctx);
                } while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public sep(): SepContext {
        let localctx: SepContext = new SepContext(this, this._ctx, this.state);
        this.enterRule(localctx, 174, MathJSLabParser.RULE_sep);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 1499;
                this._errHandler.sync(this);
                _alt = 1;
                do {
                    switch (_alt) {
                        case 1:
                            {
                                {
                                    this.state = 1498;
                                    _la = this._input.LA(1);
                                    if (!(_la === 55 || _la === 56 || _la === 106)) {
                                        this._errHandler.recoverInline(this);
                                    } else {
                                        this._errHandler.reportMatch(this);
                                        this.consume();
                                    }
                                }
                            }
                            break;
                        default:
                            throw new NoViableAltException(this);
                    }
                    this.state = 1501;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 197, this._ctx);
                } while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }

    public sempred(localctx: RuleContext, ruleIndex: number, predIndex: number): boolean {
        switch (ruleIndex) {
            case 23:
                return this.oper_expr_sempred(localctx as Oper_exprContext, predIndex);
            case 24:
                return this.power_expr_sempred(localctx as Power_exprContext, predIndex);
            case 26:
                return this.simple_expr_sempred(localctx as Simple_exprContext, predIndex);
        }
        return true;
    }
    private oper_expr_sempred(localctx: Oper_exprContext, predIndex: number): boolean {
        switch (predIndex) {
            case 0:
                return this.precpred(this._ctx, 2);
            case 1:
                return this.precpred(this._ctx, 1);
            case 2:
                return this.precpred(this._ctx, 12);
            case 3:
                return this.precpred(this._ctx, 11);
            case 4:
                return this.precpred(this._ctx, 10);
            case 5:
                return this.precpred(this._ctx, 9);
            case 6:
                return this.precpred(this._ctx, 8);
            case 7:
                return this.precpred(this._ctx, 7);
            case 8:
                return this.precpred(this._ctx, 6);
            case 9:
                return this.precpred(this._ctx, 5);
        }
        return true;
    }
    private power_expr_sempred(localctx: Power_exprContext, predIndex: number): boolean {
        switch (predIndex) {
            case 10:
                return this.precpred(this._ctx, 8);
            case 11:
                return this.precpred(this._ctx, 7);
            case 12:
                return this.precpred(this._ctx, 6);
            case 13:
                return this.precpred(this._ctx, 5);
            case 14:
                return this.precpred(this._ctx, 4);
            case 15:
                return this.precpred(this._ctx, 3);
        }
        return true;
    }
    private simple_expr_sempred(localctx: Simple_exprContext, predIndex: number): boolean {
        switch (predIndex) {
            case 16:
                return this.precpred(this._ctx, 5);
            case 17:
                return this.precpred(this._ctx, 4);
            case 18:
                return this.precpred(this._ctx, 3);
            case 19:
                return this.precpred(this._ctx, 2);
            case 20:
                return this.precpred(this._ctx, 1);
        }
        return true;
    }

    public static readonly _serializedATN: number[] = [
        4, 1, 142, 1504, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2,
        13, 7, 13, 2, 14, 7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20, 7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7, 23, 2, 24, 7, 24, 2, 25, 7, 25, 2,
        26, 7, 26, 2, 27, 7, 27, 2, 28, 7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7, 31, 2, 32, 7, 32, 2, 33, 7, 33, 2, 34, 7, 34, 2, 35, 7, 35, 2, 36, 7, 36, 2, 37, 7, 37, 2, 38, 7, 38, 2,
        39, 7, 39, 2, 40, 7, 40, 2, 41, 7, 41, 2, 42, 7, 42, 2, 43, 7, 43, 2, 44, 7, 44, 2, 45, 7, 45, 2, 46, 7, 46, 2, 47, 7, 47, 2, 48, 7, 48, 2, 49, 7, 49, 2, 50, 7, 50, 2, 51, 7, 51, 2,
        52, 7, 52, 2, 53, 7, 53, 2, 54, 7, 54, 2, 55, 7, 55, 2, 56, 7, 56, 2, 57, 7, 57, 2, 58, 7, 58, 2, 59, 7, 59, 2, 60, 7, 60, 2, 61, 7, 61, 2, 62, 7, 62, 2, 63, 7, 63, 2, 64, 7, 64, 2,
        65, 7, 65, 2, 66, 7, 66, 2, 67, 7, 67, 2, 68, 7, 68, 2, 69, 7, 69, 2, 70, 7, 70, 2, 71, 7, 71, 2, 72, 7, 72, 2, 73, 7, 73, 2, 74, 7, 74, 2, 75, 7, 75, 2, 76, 7, 76, 2, 77, 7, 77, 2,
        78, 7, 78, 2, 79, 7, 79, 2, 80, 7, 80, 2, 81, 7, 81, 2, 82, 7, 82, 2, 83, 7, 83, 2, 84, 7, 84, 2, 85, 7, 85, 2, 86, 7, 86, 2, 87, 7, 87, 1, 0, 3, 0, 178, 8, 0, 1, 0, 1, 0, 1, 0, 3,
        0, 183, 8, 0, 1, 0, 1, 0, 1, 0, 1, 0, 3, 0, 189, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 197, 8, 1, 10, 1, 12, 1, 200, 9, 1, 1, 1, 3, 1, 203, 8, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1,
        2, 1, 2, 1, 2, 1, 2, 5, 2, 213, 8, 2, 10, 2, 12, 2, 216, 9, 2, 1, 2, 3, 2, 219, 8, 2, 1, 2, 1, 2, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 3, 3, 232, 8, 3, 1, 4, 1, 4,
        1, 4, 1, 4, 1, 4, 1, 4, 5, 4, 240, 8, 4, 10, 4, 12, 4, 243, 9, 4, 1, 4, 1, 4, 1, 5, 1, 5, 1, 5, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 3, 6, 260, 8, 6, 1, 7, 1,
        7, 1, 7, 1, 7, 1, 7, 3, 7, 267, 8, 7, 1, 8, 1, 8, 1, 8, 1, 8, 1, 8, 1, 8, 5, 8, 275, 8, 8, 10, 8, 12, 8, 278, 9, 8, 1, 9, 1, 9, 1, 9, 1, 9, 3, 9, 284, 8, 9, 1, 10, 1, 10, 1, 10, 1,
        11, 1, 11, 1, 11, 1, 12, 1, 12, 1, 12, 1, 12, 1, 12, 1, 12, 1, 12, 1, 12, 1, 12, 3, 12, 301, 8, 12, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 5, 13, 309, 8, 13, 10, 13, 12, 13, 312,
        9, 13, 1, 13, 3, 13, 315, 8, 13, 1, 13, 1, 13, 1, 13, 4, 13, 320, 8, 13, 11, 13, 12, 13, 321, 1, 13, 3, 13, 325, 8, 13, 1, 13, 5, 13, 328, 8, 13, 10, 13, 12, 13, 331, 9, 13, 1, 13,
        1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 5, 13, 340, 8, 13, 10, 13, 12, 13, 343, 9, 13, 1, 13, 3, 13, 346, 8, 13, 1, 13, 1, 13, 1, 13, 4, 13, 351, 8, 13, 11, 13, 12, 13, 352, 1, 13,
        3, 13, 356, 8, 13, 1, 13, 5, 13, 359, 8, 13, 10, 13, 12, 13, 362, 9, 13, 1, 13, 3, 13, 365, 8, 13, 1, 14, 1, 14, 1, 14, 3, 14, 370, 8, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14,
        5, 14, 378, 8, 14, 10, 14, 12, 14, 381, 9, 14, 1, 14, 3, 14, 384, 8, 14, 3, 14, 386, 8, 14, 1, 15, 1, 15, 1, 15, 1, 15, 1, 16, 1, 16, 1, 16, 1, 16, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17,
        1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 3, 18, 421, 8, 18, 1, 19, 1, 19, 1, 19, 1,
        20, 1, 20, 1, 20, 1, 21, 1, 21, 1, 21, 1, 21, 1, 21, 1, 21, 1, 21, 1, 21, 1, 21, 3, 21, 438, 8, 21, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 5, 22, 446, 8, 22, 10, 22, 12, 22, 449,
        9, 22, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 3, 23, 463, 8, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1,
        23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 3, 23, 481, 8, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 3, 23, 488, 8, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 3, 23, 497, 8, 23, 1,
        23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 5, 23, 522, 8, 23, 10,
        23, 12, 23, 525, 9, 23, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 3, 24, 539, 8, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 3, 24, 547,
        8, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 3, 24, 554, 8, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 3, 24, 563, 8, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1,
        24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 5, 24, 580, 8, 24, 10, 24, 12, 24, 583, 9, 24, 1, 25, 1, 25, 1, 25, 1, 25, 1, 25, 3, 25, 590, 8, 25, 1, 25, 1, 25, 1, 26, 1, 26,
        1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 3, 26, 601, 8, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1,
        26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 5, 26, 628, 8, 26, 10, 26, 12, 26, 631, 9, 26, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 3, 27, 644,
        8, 27, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 3, 28, 651, 8, 28, 1, 28, 1, 28, 3, 28, 655, 8, 28, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 5, 29, 663, 8, 29, 10, 29, 12, 29, 666, 9, 29,
        1, 29, 3, 29, 669, 8, 29, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1,
        30, 1, 30, 3, 30, 695, 8, 30, 1, 31, 1, 31, 1, 31, 1, 31, 3, 31, 701, 8, 31, 1, 31, 1, 31, 1, 31, 3, 31, 706, 8, 31, 1, 31, 1, 31, 1, 31, 5, 31, 711, 8, 31, 10, 31, 12, 31, 714, 9,
        31, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 724, 8, 32, 1, 33, 1, 33, 1, 33, 1, 33, 3, 33, 730, 8, 33, 1, 33, 1, 33, 1, 33, 5, 33, 735, 8, 33, 10, 33, 12, 33,
        738, 9, 33, 1, 34, 1, 34, 1, 34, 1, 34, 1, 34, 1, 34, 1, 34, 3, 34, 747, 8, 34, 1, 34, 1, 34, 3, 34, 751, 8, 34, 1, 35, 1, 35, 1, 35, 1, 35, 1, 35, 1, 35, 3, 35, 759, 8, 35, 1, 36,
        1, 36, 1, 36, 3, 36, 764, 8, 36, 1, 36, 3, 36, 767, 8, 36, 1, 36, 1, 36, 1, 36, 1, 36, 5, 36, 773, 8, 36, 10, 36, 12, 36, 776, 9, 36, 1, 36, 3, 36, 779, 8, 36, 1, 36, 1, 36, 1, 36,
        1, 37, 1, 37, 3, 37, 786, 8, 37, 1, 37, 1, 37, 3, 37, 790, 8, 37, 1, 37, 3, 37, 793, 8, 37, 1, 37, 1, 37, 1, 38, 1, 38, 3, 38, 799, 8, 38, 1, 38, 3, 38, 802, 8, 38, 1, 38, 1, 38, 1,
        39, 1, 39, 1, 39, 3, 39, 809, 8, 39, 1, 39, 3, 39, 812, 8, 39, 1, 39, 3, 39, 815, 8, 39, 1, 39, 1, 39, 1, 39, 1, 40, 1, 40, 1, 40, 3, 40, 823, 8, 40, 1, 40, 1, 40, 1, 40, 5, 40, 828,
        8, 40, 10, 40, 12, 40, 831, 9, 40, 1, 40, 3, 40, 834, 8, 40, 1, 41, 1, 41, 3, 41, 838, 8, 41, 1, 41, 1, 41, 3, 41, 842, 8, 41, 1, 41, 3, 41, 845, 8, 41, 1, 41, 1, 41, 1, 42, 1, 42,
        3, 42, 851, 8, 42, 1, 42, 3, 42, 854, 8, 42, 1, 42, 3, 42, 857, 8, 42, 1, 42, 1, 42, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 3, 43, 873,
        8, 43, 1, 44, 1, 44, 1, 44, 3, 44, 878, 8, 44, 1, 44, 3, 44, 881, 8, 44, 1, 44, 1, 44, 1, 44, 1, 45, 1, 45, 3, 45, 888, 8, 45, 1, 45, 3, 45, 891, 8, 45, 1, 45, 1, 45, 1, 45, 1, 45,
        1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 3, 46, 902, 8, 46, 1, 46, 3, 46, 905, 8, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 3, 46, 917, 8, 46, 1, 46, 3, 46,
        920, 8, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 3, 46, 930, 8, 46, 1, 46, 3, 46, 933, 8, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46,
        3, 46, 945, 8, 46, 1, 46, 1, 46, 3, 46, 949, 8, 46, 1, 46, 3, 46, 952, 8, 46, 1, 46, 1, 46, 1, 46, 3, 46, 957, 8, 46, 1, 47, 1, 47, 3, 47, 961, 8, 47, 1, 47, 3, 47, 964, 8, 47, 1,
        47, 3, 47, 967, 8, 47, 1, 47, 1, 47, 1, 47, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 3, 48, 979, 8, 48, 1, 48, 1, 48, 1, 49, 1, 49, 1, 49, 1, 49, 1, 49, 1, 49, 3, 49, 989, 8,
        49, 1, 50, 1, 50, 1, 50, 1, 50, 1, 50, 1, 50, 3, 50, 997, 8, 50, 1, 51, 1, 51, 3, 51, 1001, 8, 51, 1, 51, 3, 51, 1004, 8, 51, 1, 51, 1, 51, 1, 51, 1, 51, 1, 51, 1, 51, 3, 51, 1012,
        8, 51, 1, 51, 3, 51, 1015, 8, 51, 1, 51, 1, 51, 3, 51, 1019, 8, 51, 1, 52, 1, 52, 1, 52, 3, 52, 1024, 8, 52, 1, 52, 3, 52, 1027, 8, 52, 1, 52, 1, 52, 1, 52, 1, 52, 3, 52, 1033, 8,
        52, 1, 52, 3, 52, 1036, 8, 52, 1, 52, 3, 52, 1039, 8, 52, 1, 53, 1, 53, 3, 53, 1043, 8, 53, 1, 53, 3, 53, 1046, 8, 53, 1, 53, 1, 53, 1, 53, 1, 53, 1, 54, 1, 54, 3, 54, 1054, 8, 54,
        1, 54, 3, 54, 1057, 8, 54, 1, 54, 1, 54, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 5, 55, 1069, 8, 55, 10, 55, 12, 55, 1072, 9, 55, 3, 55, 1074, 8, 55, 1, 55, 1, 55, 1,
        56, 1, 56, 1, 56, 1, 56, 1, 56, 1, 56, 3, 56, 1084, 8, 56, 1, 57, 1, 57, 1, 57, 1, 57, 1, 57, 1, 57, 3, 57, 1092, 8, 57, 1, 58, 1, 58, 1, 58, 1, 58, 1, 58, 1, 58, 1, 58, 1, 58, 1,
        58, 1, 58, 1, 58, 5, 58, 1105, 8, 58, 10, 58, 12, 58, 1108, 9, 58, 3, 58, 1110, 8, 58, 1, 58, 3, 58, 1113, 8, 58, 1, 59, 1, 59, 1, 59, 1, 59, 3, 59, 1119, 8, 59, 1, 59, 1, 59, 3, 59,
        1123, 8, 59, 1, 59, 3, 59, 1126, 8, 59, 1, 59, 3, 59, 1129, 8, 59, 1, 59, 3, 59, 1132, 8, 59, 1, 59, 1, 59, 1, 59, 1, 60, 1, 60, 1, 60, 1, 61, 1, 61, 3, 61, 1142, 8, 61, 1, 61, 1,
        61, 3, 61, 1146, 8, 61, 1, 61, 3, 61, 1149, 8, 61, 1, 61, 3, 61, 1152, 8, 61, 1, 61, 1, 61, 1, 61, 1, 62, 1, 62, 1, 62, 1, 62, 1, 62, 1, 62, 1, 62, 1, 62, 5, 62, 1165, 8, 62, 10, 62,
        12, 62, 1168, 9, 62, 3, 62, 1170, 8, 62, 1, 62, 1, 62, 1, 63, 1, 63, 1, 63, 3, 63, 1177, 8, 63, 1, 63, 1, 63, 1, 63, 1, 63, 1, 63, 1, 63, 3, 63, 1185, 8, 63, 1, 64, 1, 64, 1, 64, 1,
        64, 1, 64, 1, 64, 5, 64, 1193, 8, 64, 10, 64, 12, 64, 1196, 9, 64, 1, 65, 1, 65, 1, 65, 1, 65, 1, 65, 1, 65, 1, 65, 5, 65, 1205, 8, 65, 10, 65, 12, 65, 1208, 9, 65, 1, 66, 1, 66, 1,
        66, 3, 66, 1213, 8, 66, 1, 66, 1, 66, 1, 66, 5, 66, 1218, 8, 66, 10, 66, 12, 66, 1221, 9, 66, 1, 66, 3, 66, 1224, 8, 66, 1, 67, 1, 67, 1, 67, 1, 67, 1, 67, 1, 67, 1, 67, 1, 67, 1,
        67, 1, 67, 1, 67, 1, 67, 3, 67, 1238, 8, 67, 1, 68, 1, 68, 3, 68, 1242, 8, 68, 1, 68, 3, 68, 1245, 8, 68, 1, 68, 3, 68, 1248, 8, 68, 1, 68, 1, 68, 1, 68, 1, 69, 1, 69, 1, 69, 1, 69,
        1, 69, 1, 69, 5, 69, 1259, 8, 69, 10, 69, 12, 69, 1262, 9, 69, 1, 69, 3, 69, 1265, 8, 69, 1, 70, 1, 70, 1, 70, 1, 70, 1, 70, 3, 70, 1272, 8, 70, 1, 70, 3, 70, 1275, 8, 70, 1, 70, 1,
        70, 1, 70, 1, 70, 3, 70, 1281, 8, 70, 1, 70, 1, 70, 3, 70, 1285, 8, 70, 1, 70, 1, 70, 1, 71, 1, 71, 3, 71, 1291, 8, 71, 1, 71, 3, 71, 1294, 8, 71, 1, 71, 3, 71, 1297, 8, 71, 1, 71,
        1, 71, 1, 71, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 3, 72, 1307, 8, 72, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 3, 72, 1315, 8, 72, 1, 72, 1, 72, 3, 72, 1319, 8, 72, 1, 73, 1, 73, 1,
        73, 3, 73, 1324, 8, 73, 1, 73, 1, 73, 1, 73, 5, 73, 1329, 8, 73, 10, 73, 12, 73, 1332, 9, 73, 1, 73, 3, 73, 1335, 8, 73, 1, 74, 1, 74, 3, 74, 1339, 8, 74, 1, 74, 3, 74, 1342, 8, 74,
        1, 74, 3, 74, 1345, 8, 74, 1, 74, 1, 74, 1, 74, 1, 75, 1, 75, 1, 75, 3, 75, 1353, 8, 75, 1, 75, 1, 75, 1, 75, 5, 75, 1358, 8, 75, 10, 75, 12, 75, 1361, 9, 75, 1, 75, 3, 75, 1364, 8,
        75, 1, 76, 1, 76, 1, 76, 1, 77, 1, 77, 3, 77, 1371, 8, 77, 1, 77, 3, 77, 1374, 8, 77, 1, 77, 3, 77, 1377, 8, 77, 1, 77, 1, 77, 1, 77, 1, 78, 1, 78, 1, 78, 3, 78, 1385, 8, 78, 1, 78,
        1, 78, 1, 78, 5, 78, 1390, 8, 78, 10, 78, 12, 78, 1393, 9, 78, 1, 78, 3, 78, 1396, 8, 78, 1, 79, 1, 79, 1, 79, 3, 79, 1401, 8, 79, 1, 79, 3, 79, 1404, 8, 79, 1, 79, 1, 79, 1, 80, 1,
        80, 1, 80, 3, 80, 1411, 8, 80, 1, 80, 1, 80, 1, 80, 5, 80, 1416, 8, 80, 10, 80, 12, 80, 1419, 9, 80, 1, 80, 3, 80, 1422, 8, 80, 1, 81, 1, 81, 3, 81, 1426, 8, 81, 1, 81, 1, 81, 1, 81,
        1, 81, 3, 81, 1432, 8, 81, 3, 81, 1434, 8, 81, 1, 81, 3, 81, 1437, 8, 81, 1, 81, 3, 81, 1440, 8, 81, 1, 81, 1, 81, 1, 81, 1, 82, 1, 82, 1, 82, 1, 82, 1, 82, 1, 82, 5, 82, 1451, 8,
        82, 10, 82, 12, 82, 1454, 9, 82, 1, 83, 1, 83, 1, 83, 1, 83, 1, 83, 3, 83, 1461, 8, 83, 1, 83, 3, 83, 1464, 8, 83, 1, 83, 1, 83, 1, 83, 1, 83, 3, 83, 1470, 8, 83, 1, 83, 1, 83, 3,
        83, 1474, 8, 83, 1, 83, 1, 83, 1, 84, 1, 84, 1, 84, 1, 84, 1, 84, 1, 84, 5, 84, 1484, 8, 84, 10, 84, 12, 84, 1487, 9, 84, 1, 85, 4, 85, 1490, 8, 85, 11, 85, 12, 85, 1491, 1, 86, 4,
        86, 1495, 8, 86, 11, 86, 12, 86, 1496, 1, 87, 4, 87, 1500, 8, 87, 11, 87, 12, 87, 1501, 1, 87, 0, 3, 46, 48, 52, 88, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32,
        34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118,
        120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 174, 0, 28, 2, 0, 45, 45, 56, 56, 2, 0, 49, 50,
        94, 95, 1, 0, 58, 59, 3, 0, 51, 52, 68, 68, 91, 93, 1, 0, 49, 50, 1, 0, 94, 95, 1, 0, 98, 99, 1, 0, 96, 97, 1, 0, 85, 90, 2, 0, 53, 53, 69, 80, 1, 0, 5, 6, 2, 0, 6, 6, 11, 11, 2, 0,
        6, 6, 15, 15, 2, 0, 6, 6, 19, 19, 2, 0, 6, 6, 21, 21, 2, 0, 6, 6, 23, 23, 2, 0, 6, 6, 31, 31, 2, 0, 6, 6, 34, 34, 2, 1, 6, 6, 28, 28, 2, 1, 6, 6, 36, 36, 2, 0, 56, 56, 83, 83, 2, 0,
        6, 6, 40, 40, 2, 0, 6, 6, 44, 44, 2, 0, 6, 6, 42, 42, 2, 0, 6, 6, 38, 38, 2, 0, 6, 6, 48, 48, 1, 0, 55, 56, 2, 0, 55, 56, 106, 106, 1657, 0, 188, 1, 0, 0, 0, 2, 190, 1, 0, 0, 0, 4,
        206, 1, 0, 0, 0, 6, 231, 1, 0, 0, 0, 8, 233, 1, 0, 0, 0, 10, 246, 1, 0, 0, 0, 12, 259, 1, 0, 0, 0, 14, 266, 1, 0, 0, 0, 16, 268, 1, 0, 0, 0, 18, 283, 1, 0, 0, 0, 20, 285, 1, 0, 0, 0,
        22, 288, 1, 0, 0, 0, 24, 300, 1, 0, 0, 0, 26, 364, 1, 0, 0, 0, 28, 385, 1, 0, 0, 0, 30, 387, 1, 0, 0, 0, 32, 391, 1, 0, 0, 0, 34, 395, 1, 0, 0, 0, 36, 420, 1, 0, 0, 0, 38, 422, 1, 0,
        0, 0, 40, 425, 1, 0, 0, 0, 42, 437, 1, 0, 0, 0, 44, 439, 1, 0, 0, 0, 46, 462, 1, 0, 0, 0, 48, 538, 1, 0, 0, 0, 50, 584, 1, 0, 0, 0, 52, 600, 1, 0, 0, 0, 54, 643, 1, 0, 0, 0, 56, 654,
        1, 0, 0, 0, 58, 656, 1, 0, 0, 0, 60, 694, 1, 0, 0, 0, 62, 700, 1, 0, 0, 0, 64, 723, 1, 0, 0, 0, 66, 725, 1, 0, 0, 0, 68, 750, 1, 0, 0, 0, 70, 758, 1, 0, 0, 0, 72, 760, 1, 0, 0, 0,
        74, 783, 1, 0, 0, 0, 76, 796, 1, 0, 0, 0, 78, 805, 1, 0, 0, 0, 80, 819, 1, 0, 0, 0, 82, 835, 1, 0, 0, 0, 84, 848, 1, 0, 0, 0, 86, 872, 1, 0, 0, 0, 88, 874, 1, 0, 0, 0, 90, 885, 1, 0,
        0, 0, 92, 956, 1, 0, 0, 0, 94, 958, 1, 0, 0, 0, 96, 971, 1, 0, 0, 0, 98, 988, 1, 0, 0, 0, 100, 996, 1, 0, 0, 0, 102, 1018, 1, 0, 0, 0, 104, 1038, 1, 0, 0, 0, 106, 1040, 1, 0, 0, 0,
        108, 1051, 1, 0, 0, 0, 110, 1060, 1, 0, 0, 0, 112, 1083, 1, 0, 0, 0, 114, 1091, 1, 0, 0, 0, 116, 1112, 1, 0, 0, 0, 118, 1114, 1, 0, 0, 0, 120, 1136, 1, 0, 0, 0, 122, 1139, 1, 0, 0,
        0, 124, 1156, 1, 0, 0, 0, 126, 1184, 1, 0, 0, 0, 128, 1186, 1, 0, 0, 0, 130, 1197, 1, 0, 0, 0, 132, 1209, 1, 0, 0, 0, 134, 1237, 1, 0, 0, 0, 136, 1239, 1, 0, 0, 0, 138, 1252, 1, 0,
        0, 0, 140, 1266, 1, 0, 0, 0, 142, 1288, 1, 0, 0, 0, 144, 1318, 1, 0, 0, 0, 146, 1320, 1, 0, 0, 0, 148, 1336, 1, 0, 0, 0, 150, 1349, 1, 0, 0, 0, 152, 1365, 1, 0, 0, 0, 154, 1368, 1,
        0, 0, 0, 156, 1381, 1, 0, 0, 0, 158, 1397, 1, 0, 0, 0, 160, 1407, 1, 0, 0, 0, 162, 1423, 1, 0, 0, 0, 164, 1444, 1, 0, 0, 0, 166, 1455, 1, 0, 0, 0, 168, 1477, 1, 0, 0, 0, 170, 1489,
        1, 0, 0, 0, 172, 1494, 1, 0, 0, 0, 174, 1499, 1, 0, 0, 0, 176, 178, 3, 174, 87, 0, 177, 176, 1, 0, 0, 0, 177, 178, 1, 0, 0, 0, 178, 179, 1, 0, 0, 0, 179, 180, 5, 0, 0, 1, 180, 189,
        6, 0, -1, 0, 181, 183, 3, 174, 87, 0, 182, 181, 1, 0, 0, 0, 182, 183, 1, 0, 0, 0, 183, 184, 1, 0, 0, 0, 184, 185, 3, 2, 1, 0, 185, 186, 5, 0, 0, 1, 186, 187, 6, 0, -1, 0, 187, 189,
        1, 0, 0, 0, 188, 177, 1, 0, 0, 0, 188, 182, 1, 0, 0, 0, 189, 1, 1, 0, 0, 0, 190, 191, 3, 6, 3, 0, 191, 198, 6, 1, -1, 0, 192, 193, 3, 174, 87, 0, 193, 194, 3, 6, 3, 0, 194, 195, 6,
        1, -1, 0, 195, 197, 1, 0, 0, 0, 196, 192, 1, 0, 0, 0, 197, 200, 1, 0, 0, 0, 198, 196, 1, 0, 0, 0, 198, 199, 1, 0, 0, 0, 199, 202, 1, 0, 0, 0, 200, 198, 1, 0, 0, 0, 201, 203, 3, 174,
        87, 0, 202, 201, 1, 0, 0, 0, 202, 203, 1, 0, 0, 0, 203, 204, 1, 0, 0, 0, 204, 205, 6, 1, -1, 0, 205, 3, 1, 0, 0, 0, 206, 207, 3, 6, 3, 0, 207, 214, 6, 2, -1, 0, 208, 209, 3, 174, 87,
        0, 209, 210, 3, 6, 3, 0, 210, 211, 6, 2, -1, 0, 211, 213, 1, 0, 0, 0, 212, 208, 1, 0, 0, 0, 213, 216, 1, 0, 0, 0, 214, 212, 1, 0, 0, 0, 214, 215, 1, 0, 0, 0, 215, 218, 1, 0, 0, 0,
        216, 214, 1, 0, 0, 0, 217, 219, 3, 174, 87, 0, 218, 217, 1, 0, 0, 0, 218, 219, 1, 0, 0, 0, 219, 220, 1, 0, 0, 0, 220, 221, 6, 2, -1, 0, 221, 5, 1, 0, 0, 0, 222, 223, 3, 54, 27, 0,
        223, 224, 6, 3, -1, 0, 224, 232, 1, 0, 0, 0, 225, 226, 3, 60, 30, 0, 226, 227, 6, 3, -1, 0, 227, 232, 1, 0, 0, 0, 228, 229, 3, 8, 4, 0, 229, 230, 6, 3, -1, 0, 230, 232, 1, 0, 0, 0,
        231, 222, 1, 0, 0, 0, 231, 225, 1, 0, 0, 0, 231, 228, 1, 0, 0, 0, 232, 7, 1, 0, 0, 0, 233, 234, 3, 12, 6, 0, 234, 235, 3, 10, 5, 0, 235, 241, 6, 4, -1, 0, 236, 237, 3, 10, 5, 0, 237,
        238, 6, 4, -1, 0, 238, 240, 1, 0, 0, 0, 239, 236, 1, 0, 0, 0, 240, 243, 1, 0, 0, 0, 241, 239, 1, 0, 0, 0, 241, 242, 1, 0, 0, 0, 242, 244, 1, 0, 0, 0, 243, 241, 1, 0, 0, 0, 244, 245,
        6, 4, -1, 0, 245, 9, 1, 0, 0, 0, 246, 247, 3, 18, 9, 0, 247, 248, 6, 5, -1, 0, 248, 11, 1, 0, 0, 0, 249, 250, 5, 101, 0, 0, 250, 260, 6, 6, -1, 0, 251, 252, 5, 39, 0, 0, 252, 260, 6,
        6, -1, 0, 253, 254, 5, 43, 0, 0, 254, 260, 6, 6, -1, 0, 255, 256, 5, 41, 0, 0, 256, 260, 6, 6, -1, 0, 257, 258, 5, 37, 0, 0, 258, 260, 6, 6, -1, 0, 259, 249, 1, 0, 0, 0, 259, 251, 1,
        0, 0, 0, 259, 253, 1, 0, 0, 0, 259, 255, 1, 0, 0, 0, 259, 257, 1, 0, 0, 0, 260, 13, 1, 0, 0, 0, 261, 262, 3, 12, 6, 0, 262, 263, 6, 7, -1, 0, 263, 267, 1, 0, 0, 0, 264, 265, 5, 6, 0,
        0, 265, 267, 6, 7, -1, 0, 266, 261, 1, 0, 0, 0, 266, 264, 1, 0, 0, 0, 267, 15, 1, 0, 0, 0, 268, 269, 3, 14, 7, 0, 269, 276, 6, 8, -1, 0, 270, 271, 5, 57, 0, 0, 271, 272, 3, 14, 7, 0,
        272, 273, 6, 8, -1, 0, 273, 275, 1, 0, 0, 0, 274, 270, 1, 0, 0, 0, 275, 278, 1, 0, 0, 0, 276, 274, 1, 0, 0, 0, 276, 277, 1, 0, 0, 0, 277, 17, 1, 0, 0, 0, 278, 276, 1, 0, 0, 0, 279,
        280, 5, 46, 0, 0, 280, 284, 6, 9, -1, 0, 281, 282, 5, 142, 0, 0, 282, 284, 6, 9, -1, 0, 283, 279, 1, 0, 0, 0, 283, 281, 1, 0, 0, 0, 284, 19, 1, 0, 0, 0, 285, 286, 5, 102, 0, 0, 286,
        287, 6, 10, -1, 0, 287, 21, 1, 0, 0, 0, 288, 289, 5, 7, 0, 0, 289, 290, 6, 11, -1, 0, 290, 23, 1, 0, 0, 0, 291, 292, 3, 20, 10, 0, 292, 293, 6, 12, -1, 0, 293, 301, 1, 0, 0, 0, 294,
        295, 3, 18, 9, 0, 295, 296, 6, 12, -1, 0, 296, 301, 1, 0, 0, 0, 297, 298, 3, 22, 11, 0, 298, 299, 6, 12, -1, 0, 299, 301, 1, 0, 0, 0, 300, 291, 1, 0, 0, 0, 300, 294, 1, 0, 0, 0, 300,
        297, 1, 0, 0, 0, 301, 25, 1, 0, 0, 0, 302, 303, 5, 64, 0, 0, 303, 304, 5, 65, 0, 0, 304, 365, 6, 13, -1, 0, 305, 310, 5, 64, 0, 0, 306, 309, 5, 55, 0, 0, 307, 309, 3, 172, 86, 0,
        308, 306, 1, 0, 0, 0, 308, 307, 1, 0, 0, 0, 309, 312, 1, 0, 0, 0, 310, 308, 1, 0, 0, 0, 310, 311, 1, 0, 0, 0, 311, 314, 1, 0, 0, 0, 312, 310, 1, 0, 0, 0, 313, 315, 3, 28, 14, 0, 314,
        313, 1, 0, 0, 0, 314, 315, 1, 0, 0, 0, 315, 316, 1, 0, 0, 0, 316, 329, 6, 13, -1, 0, 317, 320, 5, 55, 0, 0, 318, 320, 3, 172, 86, 0, 319, 317, 1, 0, 0, 0, 319, 318, 1, 0, 0, 0, 320,
        321, 1, 0, 0, 0, 321, 319, 1, 0, 0, 0, 321, 322, 1, 0, 0, 0, 322, 324, 1, 0, 0, 0, 323, 325, 3, 28, 14, 0, 324, 323, 1, 0, 0, 0, 324, 325, 1, 0, 0, 0, 325, 326, 1, 0, 0, 0, 326, 328,
        6, 13, -1, 0, 327, 319, 1, 0, 0, 0, 328, 331, 1, 0, 0, 0, 329, 327, 1, 0, 0, 0, 329, 330, 1, 0, 0, 0, 330, 332, 1, 0, 0, 0, 331, 329, 1, 0, 0, 0, 332, 365, 5, 65, 0, 0, 333, 334, 5,
        66, 0, 0, 334, 335, 5, 67, 0, 0, 335, 365, 6, 13, -1, 0, 336, 341, 5, 66, 0, 0, 337, 340, 5, 55, 0, 0, 338, 340, 3, 172, 86, 0, 339, 337, 1, 0, 0, 0, 339, 338, 1, 0, 0, 0, 340, 343,
        1, 0, 0, 0, 341, 339, 1, 0, 0, 0, 341, 342, 1, 0, 0, 0, 342, 345, 1, 0, 0, 0, 343, 341, 1, 0, 0, 0, 344, 346, 3, 28, 14, 0, 345, 344, 1, 0, 0, 0, 345, 346, 1, 0, 0, 0, 346, 347, 1,
        0, 0, 0, 347, 360, 6, 13, -1, 0, 348, 351, 5, 55, 0, 0, 349, 351, 3, 172, 86, 0, 350, 348, 1, 0, 0, 0, 350, 349, 1, 0, 0, 0, 351, 352, 1, 0, 0, 0, 352, 350, 1, 0, 0, 0, 352, 353, 1,
        0, 0, 0, 353, 355, 1, 0, 0, 0, 354, 356, 3, 28, 14, 0, 355, 354, 1, 0, 0, 0, 355, 356, 1, 0, 0, 0, 356, 357, 1, 0, 0, 0, 357, 359, 6, 13, -1, 0, 358, 350, 1, 0, 0, 0, 359, 362, 1, 0,
        0, 0, 360, 358, 1, 0, 0, 0, 360, 361, 1, 0, 0, 0, 361, 363, 1, 0, 0, 0, 362, 360, 1, 0, 0, 0, 363, 365, 5, 67, 0, 0, 364, 302, 1, 0, 0, 0, 364, 305, 1, 0, 0, 0, 364, 333, 1, 0, 0, 0,
        364, 336, 1, 0, 0, 0, 365, 27, 1, 0, 0, 0, 366, 367, 7, 0, 0, 0, 367, 386, 6, 14, -1, 0, 368, 370, 7, 0, 0, 0, 369, 368, 1, 0, 0, 0, 369, 370, 1, 0, 0, 0, 370, 371, 1, 0, 0, 0, 371,
        372, 3, 42, 21, 0, 372, 379, 6, 14, -1, 0, 373, 374, 7, 0, 0, 0, 374, 375, 3, 42, 21, 0, 375, 376, 6, 14, -1, 0, 376, 378, 1, 0, 0, 0, 377, 373, 1, 0, 0, 0, 378, 381, 1, 0, 0, 0,
        379, 377, 1, 0, 0, 0, 379, 380, 1, 0, 0, 0, 380, 383, 1, 0, 0, 0, 381, 379, 1, 0, 0, 0, 382, 384, 7, 0, 0, 0, 383, 382, 1, 0, 0, 0, 383, 384, 1, 0, 0, 0, 384, 386, 1, 0, 0, 0, 385,
        366, 1, 0, 0, 0, 385, 369, 1, 0, 0, 0, 386, 29, 1, 0, 0, 0, 387, 388, 5, 60, 0, 0, 388, 389, 3, 16, 8, 0, 389, 390, 6, 15, -1, 0, 390, 31, 1, 0, 0, 0, 391, 392, 5, 61, 0, 0, 392,
        393, 3, 16, 8, 0, 393, 394, 6, 16, -1, 0, 394, 33, 1, 0, 0, 0, 395, 396, 5, 60, 0, 0, 396, 397, 3, 110, 55, 0, 397, 398, 3, 54, 27, 0, 398, 399, 6, 17, -1, 0, 399, 35, 1, 0, 0, 0,
        400, 401, 3, 12, 6, 0, 401, 402, 6, 18, -1, 0, 402, 421, 1, 0, 0, 0, 403, 404, 3, 24, 12, 0, 404, 405, 6, 18, -1, 0, 405, 421, 1, 0, 0, 0, 406, 407, 3, 30, 15, 0, 407, 408, 6, 18,
        -1, 0, 408, 421, 1, 0, 0, 0, 409, 410, 3, 32, 16, 0, 410, 411, 6, 18, -1, 0, 411, 421, 1, 0, 0, 0, 412, 413, 3, 26, 13, 0, 413, 414, 6, 18, -1, 0, 414, 421, 1, 0, 0, 0, 415, 416, 5,
        62, 0, 0, 416, 417, 3, 54, 27, 0, 417, 418, 5, 63, 0, 0, 418, 419, 6, 18, -1, 0, 419, 421, 1, 0, 0, 0, 420, 400, 1, 0, 0, 0, 420, 403, 1, 0, 0, 0, 420, 406, 1, 0, 0, 0, 420, 409, 1,
        0, 0, 0, 420, 412, 1, 0, 0, 0, 420, 415, 1, 0, 0, 0, 421, 37, 1, 0, 0, 0, 422, 423, 5, 54, 0, 0, 423, 424, 6, 19, -1, 0, 424, 39, 1, 0, 0, 0, 425, 426, 5, 58, 0, 0, 426, 427, 6, 20,
        -1, 0, 427, 41, 1, 0, 0, 0, 428, 429, 3, 54, 27, 0, 429, 430, 6, 21, -1, 0, 430, 438, 1, 0, 0, 0, 431, 432, 3, 38, 19, 0, 432, 433, 6, 21, -1, 0, 433, 438, 1, 0, 0, 0, 434, 435, 3,
        40, 20, 0, 435, 436, 6, 21, -1, 0, 436, 438, 1, 0, 0, 0, 437, 428, 1, 0, 0, 0, 437, 431, 1, 0, 0, 0, 437, 434, 1, 0, 0, 0, 438, 43, 1, 0, 0, 0, 439, 440, 3, 42, 21, 0, 440, 447, 6,
        22, -1, 0, 441, 442, 5, 56, 0, 0, 442, 443, 3, 42, 21, 0, 443, 444, 6, 22, -1, 0, 444, 446, 1, 0, 0, 0, 445, 441, 1, 0, 0, 0, 446, 449, 1, 0, 0, 0, 447, 445, 1, 0, 0, 0, 447, 448, 1,
        0, 0, 0, 448, 45, 1, 0, 0, 0, 449, 447, 1, 0, 0, 0, 450, 451, 6, 23, -1, 0, 451, 452, 3, 36, 18, 0, 452, 453, 6, 23, -1, 0, 453, 463, 1, 0, 0, 0, 454, 455, 7, 1, 0, 0, 455, 456, 3,
        46, 23, 4, 456, 457, 6, 23, -1, 0, 457, 463, 1, 0, 0, 0, 458, 459, 7, 2, 0, 0, 459, 460, 3, 46, 23, 3, 460, 461, 6, 23, -1, 0, 461, 463, 1, 0, 0, 0, 462, 450, 1, 0, 0, 0, 462, 454,
        1, 0, 0, 0, 462, 458, 1, 0, 0, 0, 463, 523, 1, 0, 0, 0, 464, 465, 10, 2, 0, 0, 465, 466, 7, 3, 0, 0, 466, 467, 3, 46, 23, 3, 467, 468, 6, 23, -1, 0, 468, 522, 1, 0, 0, 0, 469, 470,
        10, 1, 0, 0, 470, 471, 7, 4, 0, 0, 471, 472, 3, 46, 23, 2, 472, 473, 6, 23, -1, 0, 473, 522, 1, 0, 0, 0, 474, 475, 10, 12, 0, 0, 475, 476, 7, 5, 0, 0, 476, 522, 6, 23, -1, 0, 477,
        478, 10, 11, 0, 0, 478, 480, 5, 62, 0, 0, 479, 481, 3, 44, 22, 0, 480, 479, 1, 0, 0, 0, 480, 481, 1, 0, 0, 0, 481, 482, 1, 0, 0, 0, 482, 483, 5, 63, 0, 0, 483, 522, 6, 23, -1, 0,
        484, 485, 10, 10, 0, 0, 485, 487, 5, 66, 0, 0, 486, 488, 3, 44, 22, 0, 487, 486, 1, 0, 0, 0, 487, 488, 1, 0, 0, 0, 488, 489, 1, 0, 0, 0, 489, 490, 5, 67, 0, 0, 490, 522, 6, 23, -1,
        0, 491, 492, 10, 9, 0, 0, 492, 493, 5, 60, 0, 0, 493, 494, 3, 16, 8, 0, 494, 496, 5, 62, 0, 0, 495, 497, 3, 44, 22, 0, 496, 495, 1, 0, 0, 0, 496, 497, 1, 0, 0, 0, 497, 498, 1, 0, 0,
        0, 498, 499, 5, 63, 0, 0, 499, 500, 6, 23, -1, 0, 500, 522, 1, 0, 0, 0, 501, 502, 10, 8, 0, 0, 502, 503, 7, 6, 0, 0, 503, 522, 6, 23, -1, 0, 504, 505, 10, 7, 0, 0, 505, 506, 5, 57,
        0, 0, 506, 507, 3, 14, 7, 0, 507, 508, 6, 23, -1, 0, 508, 522, 1, 0, 0, 0, 509, 510, 10, 6, 0, 0, 510, 511, 5, 57, 0, 0, 511, 512, 5, 62, 0, 0, 512, 513, 3, 54, 27, 0, 513, 514, 5,
        63, 0, 0, 514, 515, 6, 23, -1, 0, 515, 522, 1, 0, 0, 0, 516, 517, 10, 5, 0, 0, 517, 518, 7, 7, 0, 0, 518, 519, 3, 48, 24, 0, 519, 520, 6, 23, -1, 0, 520, 522, 1, 0, 0, 0, 521, 464,
        1, 0, 0, 0, 521, 469, 1, 0, 0, 0, 521, 474, 1, 0, 0, 0, 521, 477, 1, 0, 0, 0, 521, 484, 1, 0, 0, 0, 521, 491, 1, 0, 0, 0, 521, 501, 1, 0, 0, 0, 521, 504, 1, 0, 0, 0, 521, 509, 1, 0,
        0, 0, 521, 516, 1, 0, 0, 0, 522, 525, 1, 0, 0, 0, 523, 521, 1, 0, 0, 0, 523, 524, 1, 0, 0, 0, 524, 47, 1, 0, 0, 0, 525, 523, 1, 0, 0, 0, 526, 527, 6, 24, -1, 0, 527, 528, 3, 36, 18,
        0, 528, 529, 6, 24, -1, 0, 529, 539, 1, 0, 0, 0, 530, 531, 7, 1, 0, 0, 531, 532, 3, 48, 24, 2, 532, 533, 6, 24, -1, 0, 533, 539, 1, 0, 0, 0, 534, 535, 7, 2, 0, 0, 535, 536, 3, 48,
        24, 1, 536, 537, 6, 24, -1, 0, 537, 539, 1, 0, 0, 0, 538, 526, 1, 0, 0, 0, 538, 530, 1, 0, 0, 0, 538, 534, 1, 0, 0, 0, 539, 581, 1, 0, 0, 0, 540, 541, 10, 8, 0, 0, 541, 542, 7, 5, 0,
        0, 542, 580, 6, 24, -1, 0, 543, 544, 10, 7, 0, 0, 544, 546, 5, 62, 0, 0, 545, 547, 3, 44, 22, 0, 546, 545, 1, 0, 0, 0, 546, 547, 1, 0, 0, 0, 547, 548, 1, 0, 0, 0, 548, 549, 5, 63, 0,
        0, 549, 580, 6, 24, -1, 0, 550, 551, 10, 6, 0, 0, 551, 553, 5, 66, 0, 0, 552, 554, 3, 44, 22, 0, 553, 552, 1, 0, 0, 0, 553, 554, 1, 0, 0, 0, 554, 555, 1, 0, 0, 0, 555, 556, 5, 67, 0,
        0, 556, 580, 6, 24, -1, 0, 557, 558, 10, 5, 0, 0, 558, 559, 5, 60, 0, 0, 559, 560, 3, 16, 8, 0, 560, 562, 5, 62, 0, 0, 561, 563, 3, 44, 22, 0, 562, 561, 1, 0, 0, 0, 562, 563, 1, 0,
        0, 0, 563, 564, 1, 0, 0, 0, 564, 565, 5, 63, 0, 0, 565, 566, 6, 24, -1, 0, 566, 580, 1, 0, 0, 0, 567, 568, 10, 4, 0, 0, 568, 569, 5, 57, 0, 0, 569, 570, 3, 14, 7, 0, 570, 571, 6, 24,
        -1, 0, 571, 580, 1, 0, 0, 0, 572, 573, 10, 3, 0, 0, 573, 574, 5, 57, 0, 0, 574, 575, 5, 62, 0, 0, 575, 576, 3, 54, 27, 0, 576, 577, 5, 63, 0, 0, 577, 578, 6, 24, -1, 0, 578, 580, 1,
        0, 0, 0, 579, 540, 1, 0, 0, 0, 579, 543, 1, 0, 0, 0, 579, 550, 1, 0, 0, 0, 579, 557, 1, 0, 0, 0, 579, 567, 1, 0, 0, 0, 579, 572, 1, 0, 0, 0, 580, 583, 1, 0, 0, 0, 581, 579, 1, 0, 0,
        0, 581, 582, 1, 0, 0, 0, 582, 49, 1, 0, 0, 0, 583, 581, 1, 0, 0, 0, 584, 585, 3, 46, 23, 0, 585, 586, 5, 54, 0, 0, 586, 589, 3, 46, 23, 0, 587, 588, 5, 54, 0, 0, 588, 590, 3, 46, 23,
        0, 589, 587, 1, 0, 0, 0, 589, 590, 1, 0, 0, 0, 590, 591, 1, 0, 0, 0, 591, 592, 6, 25, -1, 0, 592, 51, 1, 0, 0, 0, 593, 594, 6, 26, -1, 0, 594, 595, 3, 46, 23, 0, 595, 596, 6, 26, -1,
        0, 596, 601, 1, 0, 0, 0, 597, 598, 3, 50, 25, 0, 598, 599, 6, 26, -1, 0, 599, 601, 1, 0, 0, 0, 600, 593, 1, 0, 0, 0, 600, 597, 1, 0, 0, 0, 601, 629, 1, 0, 0, 0, 602, 603, 10, 5, 0,
        0, 603, 604, 7, 8, 0, 0, 604, 605, 3, 52, 26, 6, 605, 606, 6, 26, -1, 0, 606, 628, 1, 0, 0, 0, 607, 608, 10, 4, 0, 0, 608, 609, 5, 83, 0, 0, 609, 610, 3, 52, 26, 5, 610, 611, 6, 26,
        -1, 0, 611, 628, 1, 0, 0, 0, 612, 613, 10, 3, 0, 0, 613, 614, 5, 84, 0, 0, 614, 615, 3, 52, 26, 4, 615, 616, 6, 26, -1, 0, 616, 628, 1, 0, 0, 0, 617, 618, 10, 2, 0, 0, 618, 619, 5,
        81, 0, 0, 619, 620, 3, 52, 26, 3, 620, 621, 6, 26, -1, 0, 621, 628, 1, 0, 0, 0, 622, 623, 10, 1, 0, 0, 623, 624, 5, 82, 0, 0, 624, 625, 3, 52, 26, 2, 625, 626, 6, 26, -1, 0, 626,
        628, 1, 0, 0, 0, 627, 602, 1, 0, 0, 0, 627, 607, 1, 0, 0, 0, 627, 612, 1, 0, 0, 0, 627, 617, 1, 0, 0, 0, 627, 622, 1, 0, 0, 0, 628, 631, 1, 0, 0, 0, 629, 627, 1, 0, 0, 0, 629, 630,
        1, 0, 0, 0, 630, 53, 1, 0, 0, 0, 631, 629, 1, 0, 0, 0, 632, 633, 3, 52, 26, 0, 633, 634, 6, 27, -1, 0, 634, 644, 1, 0, 0, 0, 635, 636, 3, 52, 26, 0, 636, 637, 7, 9, 0, 0, 637, 638,
        3, 54, 27, 0, 638, 639, 6, 27, -1, 0, 639, 644, 1, 0, 0, 0, 640, 641, 3, 34, 17, 0, 641, 642, 6, 27, -1, 0, 642, 644, 1, 0, 0, 0, 643, 632, 1, 0, 0, 0, 643, 635, 1, 0, 0, 0, 643,
        640, 1, 0, 0, 0, 644, 55, 1, 0, 0, 0, 645, 646, 3, 52, 26, 0, 646, 647, 6, 28, -1, 0, 647, 655, 1, 0, 0, 0, 648, 650, 5, 64, 0, 0, 649, 651, 3, 58, 29, 0, 650, 649, 1, 0, 0, 0, 650,
        651, 1, 0, 0, 0, 651, 652, 1, 0, 0, 0, 652, 653, 5, 65, 0, 0, 653, 655, 6, 28, -1, 0, 654, 645, 1, 0, 0, 0, 654, 648, 1, 0, 0, 0, 655, 57, 1, 0, 0, 0, 656, 657, 3, 42, 21, 0, 657,
        664, 6, 29, -1, 0, 658, 659, 7, 0, 0, 0, 659, 660, 3, 42, 21, 0, 660, 661, 6, 29, -1, 0, 661, 663, 1, 0, 0, 0, 662, 658, 1, 0, 0, 0, 663, 666, 1, 0, 0, 0, 664, 662, 1, 0, 0, 0, 664,
        665, 1, 0, 0, 0, 665, 668, 1, 0, 0, 0, 666, 664, 1, 0, 0, 0, 667, 669, 7, 0, 0, 0, 668, 667, 1, 0, 0, 0, 668, 669, 1, 0, 0, 0, 669, 59, 1, 0, 0, 0, 670, 671, 3, 62, 31, 0, 671, 672,
        6, 30, -1, 0, 672, 695, 1, 0, 0, 0, 673, 674, 3, 66, 33, 0, 674, 675, 6, 30, -1, 0, 675, 695, 1, 0, 0, 0, 676, 677, 3, 70, 35, 0, 677, 678, 6, 30, -1, 0, 678, 695, 1, 0, 0, 0, 679,
        680, 3, 86, 43, 0, 680, 681, 6, 30, -1, 0, 681, 695, 1, 0, 0, 0, 682, 683, 3, 98, 49, 0, 683, 684, 6, 30, -1, 0, 684, 695, 1, 0, 0, 0, 685, 686, 3, 100, 50, 0, 686, 687, 6, 30, -1,
        0, 687, 695, 1, 0, 0, 0, 688, 689, 3, 118, 59, 0, 689, 690, 6, 30, -1, 0, 690, 695, 1, 0, 0, 0, 691, 692, 3, 122, 61, 0, 692, 693, 6, 30, -1, 0, 693, 695, 1, 0, 0, 0, 694, 670, 1, 0,
        0, 0, 694, 673, 1, 0, 0, 0, 694, 676, 1, 0, 0, 0, 694, 679, 1, 0, 0, 0, 694, 682, 1, 0, 0, 0, 694, 685, 1, 0, 0, 0, 694, 688, 1, 0, 0, 0, 694, 691, 1, 0, 0, 0, 695, 61, 1, 0, 0, 0,
        696, 697, 5, 1, 0, 0, 697, 701, 6, 31, -1, 0, 698, 699, 5, 2, 0, 0, 699, 701, 6, 31, -1, 0, 700, 696, 1, 0, 0, 0, 700, 698, 1, 0, 0, 0, 701, 702, 1, 0, 0, 0, 702, 703, 3, 64, 32, 0,
        703, 712, 6, 31, -1, 0, 704, 706, 5, 56, 0, 0, 705, 704, 1, 0, 0, 0, 705, 706, 1, 0, 0, 0, 706, 707, 1, 0, 0, 0, 707, 708, 3, 64, 32, 0, 708, 709, 6, 31, -1, 0, 709, 711, 1, 0, 0, 0,
        710, 705, 1, 0, 0, 0, 711, 714, 1, 0, 0, 0, 712, 710, 1, 0, 0, 0, 712, 713, 1, 0, 0, 0, 713, 63, 1, 0, 0, 0, 714, 712, 1, 0, 0, 0, 715, 716, 3, 12, 6, 0, 716, 717, 6, 32, -1, 0, 717,
        724, 1, 0, 0, 0, 718, 719, 3, 12, 6, 0, 719, 720, 5, 53, 0, 0, 720, 721, 3, 54, 27, 0, 721, 722, 6, 32, -1, 0, 722, 724, 1, 0, 0, 0, 723, 715, 1, 0, 0, 0, 723, 718, 1, 0, 0, 0, 724,
        65, 1, 0, 0, 0, 725, 726, 5, 3, 0, 0, 726, 727, 3, 68, 34, 0, 727, 736, 6, 33, -1, 0, 728, 730, 5, 56, 0, 0, 729, 728, 1, 0, 0, 0, 729, 730, 1, 0, 0, 0, 730, 731, 1, 0, 0, 0, 731,
        732, 3, 68, 34, 0, 732, 733, 6, 33, -1, 0, 733, 735, 1, 0, 0, 0, 734, 729, 1, 0, 0, 0, 735, 738, 1, 0, 0, 0, 736, 734, 1, 0, 0, 0, 736, 737, 1, 0, 0, 0, 737, 67, 1, 0, 0, 0, 738,
        736, 1, 0, 0, 0, 739, 740, 3, 16, 8, 0, 740, 741, 6, 34, -1, 0, 741, 751, 1, 0, 0, 0, 742, 746, 3, 16, 8, 0, 743, 744, 5, 57, 0, 0, 744, 747, 5, 51, 0, 0, 745, 747, 5, 91, 0, 0, 746,
        743, 1, 0, 0, 0, 746, 745, 1, 0, 0, 0, 747, 748, 1, 0, 0, 0, 748, 749, 6, 34, -1, 0, 749, 751, 1, 0, 0, 0, 750, 739, 1, 0, 0, 0, 750, 742, 1, 0, 0, 0, 751, 69, 1, 0, 0, 0, 752, 753,
        3, 72, 36, 0, 753, 754, 6, 35, -1, 0, 754, 759, 1, 0, 0, 0, 755, 756, 3, 78, 39, 0, 756, 757, 6, 35, -1, 0, 757, 759, 1, 0, 0, 0, 758, 752, 1, 0, 0, 0, 758, 755, 1, 0, 0, 0, 759, 71,
        1, 0, 0, 0, 760, 761, 5, 4, 0, 0, 761, 763, 3, 54, 27, 0, 762, 764, 3, 174, 87, 0, 763, 762, 1, 0, 0, 0, 763, 764, 1, 0, 0, 0, 764, 766, 1, 0, 0, 0, 765, 767, 3, 4, 2, 0, 766, 765,
        1, 0, 0, 0, 766, 767, 1, 0, 0, 0, 767, 768, 1, 0, 0, 0, 768, 774, 6, 36, -1, 0, 769, 770, 3, 74, 37, 0, 770, 771, 6, 36, -1, 0, 771, 773, 1, 0, 0, 0, 772, 769, 1, 0, 0, 0, 773, 776,
        1, 0, 0, 0, 774, 772, 1, 0, 0, 0, 774, 775, 1, 0, 0, 0, 775, 778, 1, 0, 0, 0, 776, 774, 1, 0, 0, 0, 777, 779, 3, 76, 38, 0, 778, 777, 1, 0, 0, 0, 778, 779, 1, 0, 0, 0, 779, 780, 1,
        0, 0, 0, 780, 781, 6, 36, -1, 0, 781, 782, 7, 10, 0, 0, 782, 73, 1, 0, 0, 0, 783, 785, 5, 8, 0, 0, 784, 786, 3, 174, 87, 0, 785, 784, 1, 0, 0, 0, 785, 786, 1, 0, 0, 0, 786, 787, 1,
        0, 0, 0, 787, 789, 3, 54, 27, 0, 788, 790, 3, 174, 87, 0, 789, 788, 1, 0, 0, 0, 789, 790, 1, 0, 0, 0, 790, 792, 1, 0, 0, 0, 791, 793, 3, 4, 2, 0, 792, 791, 1, 0, 0, 0, 792, 793, 1,
        0, 0, 0, 793, 794, 1, 0, 0, 0, 794, 795, 6, 37, -1, 0, 795, 75, 1, 0, 0, 0, 796, 798, 5, 9, 0, 0, 797, 799, 3, 174, 87, 0, 798, 797, 1, 0, 0, 0, 798, 799, 1, 0, 0, 0, 799, 801, 1, 0,
        0, 0, 800, 802, 3, 4, 2, 0, 801, 800, 1, 0, 0, 0, 801, 802, 1, 0, 0, 0, 802, 803, 1, 0, 0, 0, 803, 804, 6, 38, -1, 0, 804, 77, 1, 0, 0, 0, 805, 806, 5, 10, 0, 0, 806, 808, 3, 54, 27,
        0, 807, 809, 3, 174, 87, 0, 808, 807, 1, 0, 0, 0, 808, 809, 1, 0, 0, 0, 809, 811, 1, 0, 0, 0, 810, 812, 3, 80, 40, 0, 811, 810, 1, 0, 0, 0, 811, 812, 1, 0, 0, 0, 812, 814, 1, 0, 0,
        0, 813, 815, 3, 84, 42, 0, 814, 813, 1, 0, 0, 0, 814, 815, 1, 0, 0, 0, 815, 816, 1, 0, 0, 0, 816, 817, 7, 11, 0, 0, 817, 818, 6, 39, -1, 0, 818, 79, 1, 0, 0, 0, 819, 820, 3, 82, 41,
        0, 820, 829, 6, 40, -1, 0, 821, 823, 3, 174, 87, 0, 822, 821, 1, 0, 0, 0, 822, 823, 1, 0, 0, 0, 823, 824, 1, 0, 0, 0, 824, 825, 3, 82, 41, 0, 825, 826, 6, 40, -1, 0, 826, 828, 1, 0,
        0, 0, 827, 822, 1, 0, 0, 0, 828, 831, 1, 0, 0, 0, 829, 827, 1, 0, 0, 0, 829, 830, 1, 0, 0, 0, 830, 833, 1, 0, 0, 0, 831, 829, 1, 0, 0, 0, 832, 834, 3, 174, 87, 0, 833, 832, 1, 0, 0,
        0, 833, 834, 1, 0, 0, 0, 834, 81, 1, 0, 0, 0, 835, 837, 5, 12, 0, 0, 836, 838, 3, 174, 87, 0, 837, 836, 1, 0, 0, 0, 837, 838, 1, 0, 0, 0, 838, 839, 1, 0, 0, 0, 839, 841, 3, 54, 27,
        0, 840, 842, 3, 174, 87, 0, 841, 840, 1, 0, 0, 0, 841, 842, 1, 0, 0, 0, 842, 844, 1, 0, 0, 0, 843, 845, 3, 4, 2, 0, 844, 843, 1, 0, 0, 0, 844, 845, 1, 0, 0, 0, 845, 846, 1, 0, 0, 0,
        846, 847, 6, 41, -1, 0, 847, 83, 1, 0, 0, 0, 848, 850, 5, 13, 0, 0, 849, 851, 3, 174, 87, 0, 850, 849, 1, 0, 0, 0, 850, 851, 1, 0, 0, 0, 851, 853, 1, 0, 0, 0, 852, 854, 3, 4, 2, 0,
        853, 852, 1, 0, 0, 0, 853, 854, 1, 0, 0, 0, 854, 856, 1, 0, 0, 0, 855, 857, 3, 174, 87, 0, 856, 855, 1, 0, 0, 0, 856, 857, 1, 0, 0, 0, 857, 858, 1, 0, 0, 0, 858, 859, 6, 42, -1, 0,
        859, 85, 1, 0, 0, 0, 860, 861, 3, 88, 44, 0, 861, 862, 6, 43, -1, 0, 862, 873, 1, 0, 0, 0, 863, 864, 3, 90, 45, 0, 864, 865, 6, 43, -1, 0, 865, 873, 1, 0, 0, 0, 866, 867, 3, 92, 46,
        0, 867, 868, 6, 43, -1, 0, 868, 873, 1, 0, 0, 0, 869, 870, 3, 94, 47, 0, 870, 871, 6, 43, -1, 0, 871, 873, 1, 0, 0, 0, 872, 860, 1, 0, 0, 0, 872, 863, 1, 0, 0, 0, 872, 866, 1, 0, 0,
        0, 872, 869, 1, 0, 0, 0, 873, 87, 1, 0, 0, 0, 874, 875, 5, 14, 0, 0, 875, 877, 3, 54, 27, 0, 876, 878, 3, 174, 87, 0, 877, 876, 1, 0, 0, 0, 877, 878, 1, 0, 0, 0, 878, 880, 1, 0, 0,
        0, 879, 881, 3, 4, 2, 0, 880, 879, 1, 0, 0, 0, 880, 881, 1, 0, 0, 0, 881, 882, 1, 0, 0, 0, 882, 883, 7, 12, 0, 0, 883, 884, 6, 44, -1, 0, 884, 89, 1, 0, 0, 0, 885, 887, 5, 16, 0, 0,
        886, 888, 3, 174, 87, 0, 887, 886, 1, 0, 0, 0, 887, 888, 1, 0, 0, 0, 888, 890, 1, 0, 0, 0, 889, 891, 3, 4, 2, 0, 890, 889, 1, 0, 0, 0, 890, 891, 1, 0, 0, 0, 891, 892, 1, 0, 0, 0,
        892, 893, 5, 17, 0, 0, 893, 894, 3, 54, 27, 0, 894, 895, 6, 45, -1, 0, 895, 91, 1, 0, 0, 0, 896, 897, 5, 18, 0, 0, 897, 898, 3, 56, 28, 0, 898, 899, 5, 53, 0, 0, 899, 901, 3, 54, 27,
        0, 900, 902, 3, 174, 87, 0, 901, 900, 1, 0, 0, 0, 901, 902, 1, 0, 0, 0, 902, 904, 1, 0, 0, 0, 903, 905, 3, 4, 2, 0, 904, 903, 1, 0, 0, 0, 904, 905, 1, 0, 0, 0, 905, 906, 1, 0, 0, 0,
        906, 907, 7, 13, 0, 0, 907, 908, 6, 46, -1, 0, 908, 957, 1, 0, 0, 0, 909, 910, 5, 18, 0, 0, 910, 911, 5, 62, 0, 0, 911, 912, 3, 56, 28, 0, 912, 913, 5, 53, 0, 0, 913, 914, 3, 54, 27,
        0, 914, 916, 5, 63, 0, 0, 915, 917, 3, 174, 87, 0, 916, 915, 1, 0, 0, 0, 916, 917, 1, 0, 0, 0, 917, 919, 1, 0, 0, 0, 918, 920, 3, 4, 2, 0, 919, 918, 1, 0, 0, 0, 919, 920, 1, 0, 0, 0,
        920, 921, 1, 0, 0, 0, 921, 922, 7, 13, 0, 0, 922, 923, 6, 46, -1, 0, 923, 957, 1, 0, 0, 0, 924, 925, 5, 20, 0, 0, 925, 926, 3, 56, 28, 0, 926, 927, 5, 53, 0, 0, 927, 929, 3, 54, 27,
        0, 928, 930, 3, 174, 87, 0, 929, 928, 1, 0, 0, 0, 929, 930, 1, 0, 0, 0, 930, 932, 1, 0, 0, 0, 931, 933, 3, 4, 2, 0, 932, 931, 1, 0, 0, 0, 932, 933, 1, 0, 0, 0, 933, 934, 1, 0, 0, 0,
        934, 935, 7, 14, 0, 0, 935, 936, 6, 46, -1, 0, 936, 957, 1, 0, 0, 0, 937, 938, 5, 20, 0, 0, 938, 939, 5, 62, 0, 0, 939, 940, 3, 56, 28, 0, 940, 941, 5, 53, 0, 0, 941, 944, 3, 54, 27,
        0, 942, 943, 5, 56, 0, 0, 943, 945, 3, 54, 27, 0, 944, 942, 1, 0, 0, 0, 944, 945, 1, 0, 0, 0, 945, 946, 1, 0, 0, 0, 946, 948, 5, 63, 0, 0, 947, 949, 3, 174, 87, 0, 948, 947, 1, 0, 0,
        0, 948, 949, 1, 0, 0, 0, 949, 951, 1, 0, 0, 0, 950, 952, 3, 4, 2, 0, 951, 950, 1, 0, 0, 0, 951, 952, 1, 0, 0, 0, 952, 953, 1, 0, 0, 0, 953, 954, 7, 14, 0, 0, 954, 955, 6, 46, -1, 0,
        955, 957, 1, 0, 0, 0, 956, 896, 1, 0, 0, 0, 956, 909, 1, 0, 0, 0, 956, 924, 1, 0, 0, 0, 956, 937, 1, 0, 0, 0, 957, 93, 1, 0, 0, 0, 958, 960, 5, 22, 0, 0, 959, 961, 3, 96, 48, 0, 960,
        959, 1, 0, 0, 0, 960, 961, 1, 0, 0, 0, 961, 963, 1, 0, 0, 0, 962, 964, 3, 174, 87, 0, 963, 962, 1, 0, 0, 0, 963, 964, 1, 0, 0, 0, 964, 966, 1, 0, 0, 0, 965, 967, 3, 4, 2, 0, 966,
        965, 1, 0, 0, 0, 966, 967, 1, 0, 0, 0, 967, 968, 1, 0, 0, 0, 968, 969, 7, 15, 0, 0, 969, 970, 6, 47, -1, 0, 970, 95, 1, 0, 0, 0, 971, 972, 5, 62, 0, 0, 972, 973, 3, 54, 27, 0, 973,
        978, 6, 48, -1, 0, 974, 975, 5, 56, 0, 0, 975, 976, 3, 54, 27, 0, 976, 977, 6, 48, -1, 0, 977, 979, 1, 0, 0, 0, 978, 974, 1, 0, 0, 0, 978, 979, 1, 0, 0, 0, 979, 980, 1, 0, 0, 0, 980,
        981, 5, 63, 0, 0, 981, 97, 1, 0, 0, 0, 982, 983, 5, 24, 0, 0, 983, 989, 6, 49, -1, 0, 984, 985, 5, 25, 0, 0, 985, 989, 6, 49, -1, 0, 986, 987, 5, 26, 0, 0, 987, 989, 6, 49, -1, 0,
        988, 982, 1, 0, 0, 0, 988, 984, 1, 0, 0, 0, 988, 986, 1, 0, 0, 0, 989, 99, 1, 0, 0, 0, 990, 991, 3, 102, 51, 0, 991, 992, 6, 50, -1, 0, 992, 997, 1, 0, 0, 0, 993, 994, 3, 106, 53, 0,
        994, 995, 6, 50, -1, 0, 995, 997, 1, 0, 0, 0, 996, 990, 1, 0, 0, 0, 996, 993, 1, 0, 0, 0, 997, 101, 1, 0, 0, 0, 998, 1000, 5, 29, 0, 0, 999, 1001, 3, 174, 87, 0, 1000, 999, 1, 0, 0,
        0, 1000, 1001, 1, 0, 0, 0, 1001, 1003, 1, 0, 0, 0, 1002, 1004, 3, 4, 2, 0, 1003, 1002, 1, 0, 0, 0, 1003, 1004, 1, 0, 0, 0, 1004, 1005, 1, 0, 0, 0, 1005, 1006, 3, 104, 52, 0, 1006,
        1007, 7, 16, 0, 0, 1007, 1008, 6, 51, -1, 0, 1008, 1019, 1, 0, 0, 0, 1009, 1011, 5, 29, 0, 0, 1010, 1012, 3, 174, 87, 0, 1011, 1010, 1, 0, 0, 0, 1011, 1012, 1, 0, 0, 0, 1012, 1014,
        1, 0, 0, 0, 1013, 1015, 3, 4, 2, 0, 1014, 1013, 1, 0, 0, 0, 1014, 1015, 1, 0, 0, 0, 1015, 1016, 1, 0, 0, 0, 1016, 1017, 7, 16, 0, 0, 1017, 1019, 6, 51, -1, 0, 1018, 998, 1, 0, 0, 0,
        1018, 1009, 1, 0, 0, 0, 1019, 103, 1, 0, 0, 0, 1020, 1021, 5, 30, 0, 0, 1021, 1023, 3, 12, 6, 0, 1022, 1024, 3, 174, 87, 0, 1023, 1022, 1, 0, 0, 0, 1023, 1024, 1, 0, 0, 0, 1024,
        1026, 1, 0, 0, 0, 1025, 1027, 3, 4, 2, 0, 1026, 1025, 1, 0, 0, 0, 1026, 1027, 1, 0, 0, 0, 1027, 1028, 1, 0, 0, 0, 1028, 1029, 6, 52, -1, 0, 1029, 1039, 1, 0, 0, 0, 1030, 1032, 5, 30,
        0, 0, 1031, 1033, 3, 174, 87, 0, 1032, 1031, 1, 0, 0, 0, 1032, 1033, 1, 0, 0, 0, 1033, 1035, 1, 0, 0, 0, 1034, 1036, 3, 4, 2, 0, 1035, 1034, 1, 0, 0, 0, 1035, 1036, 1, 0, 0, 0, 1036,
        1037, 1, 0, 0, 0, 1037, 1039, 6, 52, -1, 0, 1038, 1020, 1, 0, 0, 0, 1038, 1030, 1, 0, 0, 0, 1039, 105, 1, 0, 0, 0, 1040, 1042, 5, 32, 0, 0, 1041, 1043, 3, 174, 87, 0, 1042, 1041, 1,
        0, 0, 0, 1042, 1043, 1, 0, 0, 0, 1043, 1045, 1, 0, 0, 0, 1044, 1046, 3, 4, 2, 0, 1045, 1044, 1, 0, 0, 0, 1045, 1046, 1, 0, 0, 0, 1046, 1047, 1, 0, 0, 0, 1047, 1048, 3, 108, 54, 0,
        1048, 1049, 7, 17, 0, 0, 1049, 1050, 6, 53, -1, 0, 1050, 107, 1, 0, 0, 0, 1051, 1053, 5, 33, 0, 0, 1052, 1054, 3, 174, 87, 0, 1053, 1052, 1, 0, 0, 0, 1053, 1054, 1, 0, 0, 0, 1054,
        1056, 1, 0, 0, 0, 1055, 1057, 3, 4, 2, 0, 1056, 1055, 1, 0, 0, 0, 1056, 1057, 1, 0, 0, 0, 1057, 1058, 1, 0, 0, 0, 1058, 1059, 6, 54, -1, 0, 1059, 109, 1, 0, 0, 0, 1060, 1061, 5, 62,
        0, 0, 1061, 1073, 6, 55, -1, 0, 1062, 1063, 3, 112, 56, 0, 1063, 1070, 6, 55, -1, 0, 1064, 1065, 5, 56, 0, 0, 1065, 1066, 3, 112, 56, 0, 1066, 1067, 6, 55, -1, 0, 1067, 1069, 1, 0,
        0, 0, 1068, 1064, 1, 0, 0, 0, 1069, 1072, 1, 0, 0, 0, 1070, 1068, 1, 0, 0, 0, 1070, 1071, 1, 0, 0, 0, 1071, 1074, 1, 0, 0, 0, 1072, 1070, 1, 0, 0, 0, 1073, 1062, 1, 0, 0, 0, 1073,
        1074, 1, 0, 0, 0, 1074, 1075, 1, 0, 0, 0, 1075, 1076, 5, 63, 0, 0, 1076, 111, 1, 0, 0, 0, 1077, 1078, 3, 64, 32, 0, 1078, 1079, 6, 56, -1, 0, 1079, 1084, 1, 0, 0, 0, 1080, 1081, 3,
        40, 20, 0, 1081, 1082, 6, 56, -1, 0, 1082, 1084, 1, 0, 0, 0, 1083, 1077, 1, 0, 0, 0, 1083, 1080, 1, 0, 0, 0, 1084, 113, 1, 0, 0, 0, 1085, 1086, 3, 12, 6, 0, 1086, 1087, 6, 57, -1, 0,
        1087, 1092, 1, 0, 0, 0, 1088, 1089, 3, 40, 20, 0, 1089, 1090, 6, 57, -1, 0, 1090, 1092, 1, 0, 0, 0, 1091, 1085, 1, 0, 0, 0, 1091, 1088, 1, 0, 0, 0, 1092, 115, 1, 0, 0, 0, 1093, 1094,
        3, 114, 57, 0, 1094, 1095, 6, 58, -1, 0, 1095, 1113, 1, 0, 0, 0, 1096, 1097, 5, 64, 0, 0, 1097, 1109, 6, 58, -1, 0, 1098, 1099, 3, 114, 57, 0, 1099, 1106, 6, 58, -1, 0, 1100, 1101,
        7, 0, 0, 0, 1101, 1102, 3, 114, 57, 0, 1102, 1103, 6, 58, -1, 0, 1103, 1105, 1, 0, 0, 0, 1104, 1100, 1, 0, 0, 0, 1105, 1108, 1, 0, 0, 0, 1106, 1104, 1, 0, 0, 0, 1106, 1107, 1, 0, 0,
        0, 1107, 1110, 1, 0, 0, 0, 1108, 1106, 1, 0, 0, 0, 1109, 1098, 1, 0, 0, 0, 1109, 1110, 1, 0, 0, 0, 1110, 1111, 1, 0, 0, 0, 1111, 1113, 5, 65, 0, 0, 1112, 1093, 1, 0, 0, 0, 1112,
        1096, 1, 0, 0, 0, 1113, 117, 1, 0, 0, 0, 1114, 1118, 5, 27, 0, 0, 1115, 1116, 3, 116, 58, 0, 1116, 1117, 5, 53, 0, 0, 1117, 1119, 1, 0, 0, 0, 1118, 1115, 1, 0, 0, 0, 1118, 1119, 1,
        0, 0, 0, 1119, 1120, 1, 0, 0, 0, 1120, 1122, 3, 120, 60, 0, 1121, 1123, 3, 110, 55, 0, 1122, 1121, 1, 0, 0, 0, 1122, 1123, 1, 0, 0, 0, 1123, 1125, 1, 0, 0, 0, 1124, 1126, 3, 174, 87,
        0, 1125, 1124, 1, 0, 0, 0, 1125, 1126, 1, 0, 0, 0, 1126, 1128, 1, 0, 0, 0, 1127, 1129, 3, 160, 80, 0, 1128, 1127, 1, 0, 0, 0, 1128, 1129, 1, 0, 0, 0, 1129, 1131, 1, 0, 0, 0, 1130,
        1132, 3, 4, 2, 0, 1131, 1130, 1, 0, 0, 0, 1131, 1132, 1, 0, 0, 0, 1132, 1133, 1, 0, 0, 0, 1133, 1134, 7, 18, 0, 0, 1134, 1135, 6, 59, -1, 0, 1135, 119, 1, 0, 0, 0, 1136, 1137, 3, 16,
        8, 0, 1137, 1138, 6, 60, -1, 0, 1138, 121, 1, 0, 0, 0, 1139, 1141, 5, 35, 0, 0, 1140, 1142, 3, 124, 62, 0, 1141, 1140, 1, 0, 0, 0, 1141, 1142, 1, 0, 0, 0, 1142, 1143, 1, 0, 0, 0,
        1143, 1145, 3, 16, 8, 0, 1144, 1146, 3, 130, 65, 0, 1145, 1144, 1, 0, 0, 0, 1145, 1146, 1, 0, 0, 0, 1146, 1148, 1, 0, 0, 0, 1147, 1149, 3, 174, 87, 0, 1148, 1147, 1, 0, 0, 0, 1148,
        1149, 1, 0, 0, 0, 1149, 1151, 1, 0, 0, 0, 1150, 1152, 3, 132, 66, 0, 1151, 1150, 1, 0, 0, 0, 1151, 1152, 1, 0, 0, 0, 1152, 1153, 1, 0, 0, 0, 1153, 1154, 7, 19, 0, 0, 1154, 1155, 6,
        61, -1, 0, 1155, 123, 1, 0, 0, 0, 1156, 1157, 5, 62, 0, 0, 1157, 1169, 6, 62, -1, 0, 1158, 1159, 3, 126, 63, 0, 1159, 1166, 6, 62, -1, 0, 1160, 1161, 5, 56, 0, 0, 1161, 1162, 3, 126,
        63, 0, 1162, 1163, 6, 62, -1, 0, 1163, 1165, 1, 0, 0, 0, 1164, 1160, 1, 0, 0, 0, 1165, 1168, 1, 0, 0, 0, 1166, 1164, 1, 0, 0, 0, 1166, 1167, 1, 0, 0, 0, 1167, 1170, 1, 0, 0, 0, 1168,
        1166, 1, 0, 0, 0, 1169, 1158, 1, 0, 0, 0, 1169, 1170, 1, 0, 0, 0, 1170, 1171, 1, 0, 0, 0, 1171, 1172, 5, 63, 0, 0, 1172, 125, 1, 0, 0, 0, 1173, 1176, 3, 12, 6, 0, 1174, 1175, 5, 53,
        0, 0, 1175, 1177, 3, 54, 27, 0, 1176, 1174, 1, 0, 0, 0, 1176, 1177, 1, 0, 0, 0, 1177, 1178, 1, 0, 0, 0, 1178, 1179, 6, 63, -1, 0, 1179, 1185, 1, 0, 0, 0, 1180, 1181, 7, 2, 0, 0,
        1181, 1182, 3, 12, 6, 0, 1182, 1183, 6, 63, -1, 0, 1183, 1185, 1, 0, 0, 0, 1184, 1173, 1, 0, 0, 0, 1184, 1180, 1, 0, 0, 0, 1185, 127, 1, 0, 0, 0, 1186, 1187, 3, 12, 6, 0, 1187, 1194,
        6, 64, -1, 0, 1188, 1189, 5, 57, 0, 0, 1189, 1190, 3, 12, 6, 0, 1190, 1191, 6, 64, -1, 0, 1191, 1193, 1, 0, 0, 0, 1192, 1188, 1, 0, 0, 0, 1193, 1196, 1, 0, 0, 0, 1194, 1192, 1, 0, 0,
        0, 1194, 1195, 1, 0, 0, 0, 1195, 129, 1, 0, 0, 0, 1196, 1194, 1, 0, 0, 0, 1197, 1198, 5, 85, 0, 0, 1198, 1199, 3, 16, 8, 0, 1199, 1206, 6, 65, -1, 0, 1200, 1201, 7, 20, 0, 0, 1201,
        1202, 3, 16, 8, 0, 1202, 1203, 6, 65, -1, 0, 1203, 1205, 1, 0, 0, 0, 1204, 1200, 1, 0, 0, 0, 1205, 1208, 1, 0, 0, 0, 1206, 1204, 1, 0, 0, 0, 1206, 1207, 1, 0, 0, 0, 1207, 131, 1, 0,
        0, 0, 1208, 1206, 1, 0, 0, 0, 1209, 1210, 3, 134, 67, 0, 1210, 1219, 6, 66, -1, 0, 1211, 1213, 3, 174, 87, 0, 1212, 1211, 1, 0, 0, 0, 1212, 1213, 1, 0, 0, 0, 1213, 1214, 1, 0, 0, 0,
        1214, 1215, 3, 134, 67, 0, 1215, 1216, 6, 66, -1, 0, 1216, 1218, 1, 0, 0, 0, 1217, 1212, 1, 0, 0, 0, 1218, 1221, 1, 0, 0, 0, 1219, 1217, 1, 0, 0, 0, 1219, 1220, 1, 0, 0, 0, 1220,
        1223, 1, 0, 0, 0, 1221, 1219, 1, 0, 0, 0, 1222, 1224, 3, 174, 87, 0, 1223, 1222, 1, 0, 0, 0, 1223, 1224, 1, 0, 0, 0, 1224, 133, 1, 0, 0, 0, 1225, 1226, 3, 136, 68, 0, 1226, 1227, 6,
        67, -1, 0, 1227, 1238, 1, 0, 0, 0, 1228, 1229, 3, 142, 71, 0, 1229, 1230, 6, 67, -1, 0, 1230, 1238, 1, 0, 0, 0, 1231, 1232, 3, 148, 74, 0, 1232, 1233, 6, 67, -1, 0, 1233, 1238, 1, 0,
        0, 0, 1234, 1235, 3, 154, 77, 0, 1235, 1236, 6, 67, -1, 0, 1236, 1238, 1, 0, 0, 0, 1237, 1225, 1, 0, 0, 0, 1237, 1228, 1, 0, 0, 0, 1237, 1231, 1, 0, 0, 0, 1237, 1234, 1, 0, 0, 0,
        1238, 135, 1, 0, 0, 0, 1239, 1241, 5, 39, 0, 0, 1240, 1242, 3, 124, 62, 0, 1241, 1240, 1, 0, 0, 0, 1241, 1242, 1, 0, 0, 0, 1242, 1244, 1, 0, 0, 0, 1243, 1245, 3, 174, 87, 0, 1244,
        1243, 1, 0, 0, 0, 1244, 1245, 1, 0, 0, 0, 1245, 1247, 1, 0, 0, 0, 1246, 1248, 3, 138, 69, 0, 1247, 1246, 1, 0, 0, 0, 1247, 1248, 1, 0, 0, 0, 1248, 1249, 1, 0, 0, 0, 1249, 1250, 7,
        21, 0, 0, 1250, 1251, 6, 68, -1, 0, 1251, 137, 1, 0, 0, 0, 1252, 1253, 3, 140, 70, 0, 1253, 1260, 6, 69, -1, 0, 1254, 1255, 3, 174, 87, 0, 1255, 1256, 3, 140, 70, 0, 1256, 1257, 6,
        69, -1, 0, 1257, 1259, 1, 0, 0, 0, 1258, 1254, 1, 0, 0, 0, 1259, 1262, 1, 0, 0, 0, 1260, 1258, 1, 0, 0, 0, 1260, 1261, 1, 0, 0, 0, 1261, 1264, 1, 0, 0, 0, 1262, 1260, 1, 0, 0, 0,
        1263, 1265, 3, 174, 87, 0, 1264, 1263, 1, 0, 0, 0, 1264, 1265, 1, 0, 0, 0, 1265, 139, 1, 0, 0, 0, 1266, 1271, 3, 12, 6, 0, 1267, 1268, 5, 62, 0, 0, 1268, 1269, 3, 44, 22, 0, 1269,
        1270, 5, 63, 0, 0, 1270, 1272, 1, 0, 0, 0, 1271, 1267, 1, 0, 0, 0, 1271, 1272, 1, 0, 0, 0, 1272, 1274, 1, 0, 0, 0, 1273, 1275, 3, 16, 8, 0, 1274, 1273, 1, 0, 0, 0, 1274, 1275, 1, 0,
        0, 0, 1275, 1280, 1, 0, 0, 0, 1276, 1277, 5, 66, 0, 0, 1277, 1278, 3, 44, 22, 0, 1278, 1279, 5, 67, 0, 0, 1279, 1281, 1, 0, 0, 0, 1280, 1276, 1, 0, 0, 0, 1280, 1281, 1, 0, 0, 0,
        1281, 1284, 1, 0, 0, 0, 1282, 1283, 5, 53, 0, 0, 1283, 1285, 3, 54, 27, 0, 1284, 1282, 1, 0, 0, 0, 1284, 1285, 1, 0, 0, 0, 1285, 1286, 1, 0, 0, 0, 1286, 1287, 6, 70, -1, 0, 1287,
        141, 1, 0, 0, 0, 1288, 1290, 5, 43, 0, 0, 1289, 1291, 3, 124, 62, 0, 1290, 1289, 1, 0, 0, 0, 1290, 1291, 1, 0, 0, 0, 1291, 1293, 1, 0, 0, 0, 1292, 1294, 3, 174, 87, 0, 1293, 1292, 1,
        0, 0, 0, 1293, 1294, 1, 0, 0, 0, 1294, 1296, 1, 0, 0, 0, 1295, 1297, 3, 146, 73, 0, 1296, 1295, 1, 0, 0, 0, 1296, 1297, 1, 0, 0, 0, 1297, 1298, 1, 0, 0, 0, 1298, 1299, 7, 22, 0, 0,
        1299, 1300, 6, 71, -1, 0, 1300, 143, 1, 0, 0, 0, 1301, 1302, 3, 118, 59, 0, 1302, 1303, 6, 72, -1, 0, 1303, 1319, 1, 0, 0, 0, 1304, 1306, 3, 128, 64, 0, 1305, 1307, 3, 110, 55, 0,
        1306, 1305, 1, 0, 0, 0, 1306, 1307, 1, 0, 0, 0, 1307, 1308, 1, 0, 0, 0, 1308, 1309, 6, 72, -1, 0, 1309, 1319, 1, 0, 0, 0, 1310, 1311, 3, 116, 58, 0, 1311, 1312, 5, 53, 0, 0, 1312,
        1314, 3, 128, 64, 0, 1313, 1315, 3, 110, 55, 0, 1314, 1313, 1, 0, 0, 0, 1314, 1315, 1, 0, 0, 0, 1315, 1316, 1, 0, 0, 0, 1316, 1317, 6, 72, -1, 0, 1317, 1319, 1, 0, 0, 0, 1318, 1301,
        1, 0, 0, 0, 1318, 1304, 1, 0, 0, 0, 1318, 1310, 1, 0, 0, 0, 1319, 145, 1, 0, 0, 0, 1320, 1321, 3, 144, 72, 0, 1321, 1330, 6, 73, -1, 0, 1322, 1324, 3, 174, 87, 0, 1323, 1322, 1, 0,
        0, 0, 1323, 1324, 1, 0, 0, 0, 1324, 1325, 1, 0, 0, 0, 1325, 1326, 3, 144, 72, 0, 1326, 1327, 6, 73, -1, 0, 1327, 1329, 1, 0, 0, 0, 1328, 1323, 1, 0, 0, 0, 1329, 1332, 1, 0, 0, 0,
        1330, 1328, 1, 0, 0, 0, 1330, 1331, 1, 0, 0, 0, 1331, 1334, 1, 0, 0, 0, 1332, 1330, 1, 0, 0, 0, 1333, 1335, 3, 174, 87, 0, 1334, 1333, 1, 0, 0, 0, 1334, 1335, 1, 0, 0, 0, 1335, 147,
        1, 0, 0, 0, 1336, 1338, 5, 41, 0, 0, 1337, 1339, 3, 124, 62, 0, 1338, 1337, 1, 0, 0, 0, 1338, 1339, 1, 0, 0, 0, 1339, 1341, 1, 0, 0, 0, 1340, 1342, 3, 174, 87, 0, 1341, 1340, 1, 0,
        0, 0, 1341, 1342, 1, 0, 0, 0, 1342, 1344, 1, 0, 0, 0, 1343, 1345, 3, 150, 75, 0, 1344, 1343, 1, 0, 0, 0, 1344, 1345, 1, 0, 0, 0, 1345, 1346, 1, 0, 0, 0, 1346, 1347, 7, 23, 0, 0,
        1347, 1348, 6, 74, -1, 0, 1348, 149, 1, 0, 0, 0, 1349, 1350, 3, 152, 76, 0, 1350, 1359, 6, 75, -1, 0, 1351, 1353, 3, 174, 87, 0, 1352, 1351, 1, 0, 0, 0, 1352, 1353, 1, 0, 0, 0, 1353,
        1354, 1, 0, 0, 0, 1354, 1355, 3, 152, 76, 0, 1355, 1356, 6, 75, -1, 0, 1356, 1358, 1, 0, 0, 0, 1357, 1352, 1, 0, 0, 0, 1358, 1361, 1, 0, 0, 0, 1359, 1357, 1, 0, 0, 0, 1359, 1360, 1,
        0, 0, 0, 1360, 1363, 1, 0, 0, 0, 1361, 1359, 1, 0, 0, 0, 1362, 1364, 3, 174, 87, 0, 1363, 1362, 1, 0, 0, 0, 1363, 1364, 1, 0, 0, 0, 1364, 151, 1, 0, 0, 0, 1365, 1366, 3, 12, 6, 0,
        1366, 1367, 6, 76, -1, 0, 1367, 153, 1, 0, 0, 0, 1368, 1370, 5, 37, 0, 0, 1369, 1371, 3, 124, 62, 0, 1370, 1369, 1, 0, 0, 0, 1370, 1371, 1, 0, 0, 0, 1371, 1373, 1, 0, 0, 0, 1372,
        1374, 3, 174, 87, 0, 1373, 1372, 1, 0, 0, 0, 1373, 1374, 1, 0, 0, 0, 1374, 1376, 1, 0, 0, 0, 1375, 1377, 3, 156, 78, 0, 1376, 1375, 1, 0, 0, 0, 1376, 1377, 1, 0, 0, 0, 1377, 1378, 1,
        0, 0, 0, 1378, 1379, 7, 24, 0, 0, 1379, 1380, 6, 77, -1, 0, 1380, 155, 1, 0, 0, 0, 1381, 1382, 3, 158, 79, 0, 1382, 1391, 6, 78, -1, 0, 1383, 1385, 3, 174, 87, 0, 1384, 1383, 1, 0,
        0, 0, 1384, 1385, 1, 0, 0, 0, 1385, 1386, 1, 0, 0, 0, 1386, 1387, 3, 158, 79, 0, 1387, 1388, 6, 78, -1, 0, 1388, 1390, 1, 0, 0, 0, 1389, 1384, 1, 0, 0, 0, 1390, 1393, 1, 0, 0, 0,
        1391, 1389, 1, 0, 0, 0, 1391, 1392, 1, 0, 0, 0, 1392, 1395, 1, 0, 0, 0, 1393, 1391, 1, 0, 0, 0, 1394, 1396, 3, 174, 87, 0, 1395, 1394, 1, 0, 0, 0, 1395, 1396, 1, 0, 0, 0, 1396, 157,
        1, 0, 0, 0, 1397, 1403, 3, 12, 6, 0, 1398, 1400, 5, 62, 0, 0, 1399, 1401, 3, 44, 22, 0, 1400, 1399, 1, 0, 0, 0, 1400, 1401, 1, 0, 0, 0, 1401, 1402, 1, 0, 0, 0, 1402, 1404, 5, 63, 0,
        0, 1403, 1398, 1, 0, 0, 0, 1403, 1404, 1, 0, 0, 0, 1404, 1405, 1, 0, 0, 0, 1405, 1406, 6, 79, -1, 0, 1406, 159, 1, 0, 0, 0, 1407, 1408, 3, 162, 81, 0, 1408, 1417, 6, 80, -1, 0, 1409,
        1411, 3, 174, 87, 0, 1410, 1409, 1, 0, 0, 0, 1410, 1411, 1, 0, 0, 0, 1411, 1412, 1, 0, 0, 0, 1412, 1413, 3, 162, 81, 0, 1413, 1414, 6, 80, -1, 0, 1414, 1416, 1, 0, 0, 0, 1415, 1410,
        1, 0, 0, 0, 1416, 1419, 1, 0, 0, 0, 1417, 1415, 1, 0, 0, 0, 1417, 1418, 1, 0, 0, 0, 1418, 1421, 1, 0, 0, 0, 1419, 1417, 1, 0, 0, 0, 1420, 1422, 3, 174, 87, 0, 1421, 1420, 1, 0, 0, 0,
        1421, 1422, 1, 0, 0, 0, 1422, 161, 1, 0, 0, 0, 1423, 1425, 5, 47, 0, 0, 1424, 1426, 3, 174, 87, 0, 1425, 1424, 1, 0, 0, 0, 1425, 1426, 1, 0, 0, 0, 1426, 1433, 1, 0, 0, 0, 1427, 1428,
        5, 62, 0, 0, 1428, 1429, 3, 12, 6, 0, 1429, 1431, 5, 63, 0, 0, 1430, 1432, 3, 174, 87, 0, 1431, 1430, 1, 0, 0, 0, 1431, 1432, 1, 0, 0, 0, 1432, 1434, 1, 0, 0, 0, 1433, 1427, 1, 0, 0,
        0, 1433, 1434, 1, 0, 0, 0, 1434, 1436, 1, 0, 0, 0, 1435, 1437, 3, 164, 82, 0, 1436, 1435, 1, 0, 0, 0, 1436, 1437, 1, 0, 0, 0, 1437, 1439, 1, 0, 0, 0, 1438, 1440, 3, 174, 87, 0, 1439,
        1438, 1, 0, 0, 0, 1439, 1440, 1, 0, 0, 0, 1440, 1441, 1, 0, 0, 0, 1441, 1442, 7, 25, 0, 0, 1442, 1443, 6, 81, -1, 0, 1443, 163, 1, 0, 0, 0, 1444, 1445, 3, 166, 83, 0, 1445, 1452, 6,
        82, -1, 0, 1446, 1447, 3, 174, 87, 0, 1447, 1448, 3, 166, 83, 0, 1448, 1449, 6, 82, -1, 0, 1449, 1451, 1, 0, 0, 0, 1450, 1446, 1, 0, 0, 0, 1451, 1454, 1, 0, 0, 0, 1452, 1450, 1, 0,
        0, 0, 1452, 1453, 1, 0, 0, 0, 1453, 165, 1, 0, 0, 0, 1454, 1452, 1, 0, 0, 0, 1455, 1460, 3, 168, 84, 0, 1456, 1457, 5, 62, 0, 0, 1457, 1458, 3, 44, 22, 0, 1458, 1459, 5, 63, 0, 0,
        1459, 1461, 1, 0, 0, 0, 1460, 1456, 1, 0, 0, 0, 1460, 1461, 1, 0, 0, 0, 1461, 1463, 1, 0, 0, 0, 1462, 1464, 3, 16, 8, 0, 1463, 1462, 1, 0, 0, 0, 1463, 1464, 1, 0, 0, 0, 1464, 1469,
        1, 0, 0, 0, 1465, 1466, 5, 66, 0, 0, 1466, 1467, 3, 44, 22, 0, 1467, 1468, 5, 67, 0, 0, 1468, 1470, 1, 0, 0, 0, 1469, 1465, 1, 0, 0, 0, 1469, 1470, 1, 0, 0, 0, 1470, 1473, 1, 0, 0,
        0, 1471, 1472, 5, 53, 0, 0, 1472, 1474, 3, 54, 27, 0, 1473, 1471, 1, 0, 0, 0, 1473, 1474, 1, 0, 0, 0, 1474, 1475, 1, 0, 0, 0, 1475, 1476, 6, 83, -1, 0, 1476, 167, 1, 0, 0, 0, 1477,
        1478, 3, 12, 6, 0, 1478, 1485, 6, 84, -1, 0, 1479, 1480, 5, 57, 0, 0, 1480, 1481, 3, 12, 6, 0, 1481, 1482, 6, 84, -1, 0, 1482, 1484, 1, 0, 0, 0, 1483, 1479, 1, 0, 0, 0, 1484, 1487,
        1, 0, 0, 0, 1485, 1483, 1, 0, 0, 0, 1485, 1486, 1, 0, 0, 0, 1486, 169, 1, 0, 0, 0, 1487, 1485, 1, 0, 0, 0, 1488, 1490, 7, 26, 0, 0, 1489, 1488, 1, 0, 0, 0, 1490, 1491, 1, 0, 0, 0,
        1491, 1489, 1, 0, 0, 0, 1491, 1492, 1, 0, 0, 0, 1492, 171, 1, 0, 0, 0, 1493, 1495, 5, 106, 0, 0, 1494, 1493, 1, 0, 0, 0, 1495, 1496, 1, 0, 0, 0, 1496, 1494, 1, 0, 0, 0, 1496, 1497,
        1, 0, 0, 0, 1497, 173, 1, 0, 0, 0, 1498, 1500, 7, 27, 0, 0, 1499, 1498, 1, 0, 0, 0, 1500, 1501, 1, 0, 0, 0, 1501, 1499, 1, 0, 0, 0, 1501, 1502, 1, 0, 0, 0, 1502, 175, 1, 0, 0, 0,
        198, 177, 182, 188, 198, 202, 214, 218, 231, 241, 259, 266, 276, 283, 300, 308, 310, 314, 319, 321, 324, 329, 339, 341, 345, 350, 352, 355, 360, 364, 369, 379, 383, 385, 420, 437,
        447, 462, 480, 487, 496, 521, 523, 538, 546, 553, 562, 579, 581, 589, 600, 627, 629, 643, 650, 654, 664, 668, 694, 700, 705, 712, 723, 729, 736, 746, 750, 758, 763, 766, 774, 778,
        785, 789, 792, 798, 801, 808, 811, 814, 822, 829, 833, 837, 841, 844, 850, 853, 856, 872, 877, 880, 887, 890, 901, 904, 916, 919, 929, 932, 944, 948, 951, 956, 960, 963, 966, 978,
        988, 996, 1000, 1003, 1011, 1014, 1018, 1023, 1026, 1032, 1035, 1038, 1042, 1045, 1053, 1056, 1070, 1073, 1083, 1091, 1106, 1109, 1112, 1118, 1122, 1125, 1128, 1131, 1141, 1145,
        1148, 1151, 1166, 1169, 1176, 1184, 1194, 1206, 1212, 1219, 1223, 1237, 1241, 1244, 1247, 1260, 1264, 1271, 1274, 1280, 1284, 1290, 1293, 1296, 1306, 1314, 1318, 1323, 1330, 1334,
        1338, 1341, 1344, 1352, 1359, 1363, 1370, 1373, 1376, 1384, 1391, 1395, 1400, 1403, 1410, 1417, 1421, 1425, 1431, 1433, 1436, 1439, 1452, 1460, 1463, 1469, 1473, 1485, 1491, 1496,
        1501,
    ];

    private static __ATN: ATN;
    public static get _ATN(): ATN {
        if (!MathJSLabParser.__ATN) {
            MathJSLabParser.__ATN = new ATNDeserializer().deserialize(MathJSLabParser._serializedATN);
        }

        return MathJSLabParser.__ATN;
    }

    static DecisionsToDFA = MathJSLabParser._ATN.decisionToState.map((ds: DecisionState, index: number) => new DFA(ds, index));
}

export class InputContext extends ParserRuleContext {
    public node: NodeInput;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public EOF(): TerminalNode {
        return this.getToken(MathJSLabParser.EOF, 0);
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public global_list(): Global_listContext {
        return this.getTypedRuleContext(Global_listContext, 0) as Global_listContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_input;
    }
}

export class Global_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public statement_list(): StatementContext[] {
        return this.getTypedRuleContexts(StatementContext) as StatementContext[];
    }
    public statement(i: number): StatementContext {
        return this.getTypedRuleContext(StatementContext, i) as StatementContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_global_list;
    }
}

export class ListContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public statement_list(): StatementContext[] {
        return this.getTypedRuleContexts(StatementContext) as StatementContext[];
    }
    public statement(i: number): StatementContext {
        return this.getTypedRuleContext(StatementContext, i) as StatementContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_list;
    }
}

export class StatementContext extends ParserRuleContext {
    public node: NodeInput;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public command(): CommandContext {
        return this.getTypedRuleContext(CommandContext, 0) as CommandContext;
    }
    public word_list_cmd(): Word_list_cmdContext {
        return this.getTypedRuleContext(Word_list_cmdContext, 0) as Word_list_cmdContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_statement;
    }
}

export class Word_list_cmdContext extends ParserRuleContext {
    public node: NodeInput;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public command_word_list(): Command_wordContext[] {
        return this.getTypedRuleContexts(Command_wordContext) as Command_wordContext[];
    }
    public command_word(i: number): Command_wordContext {
        return this.getTypedRuleContext(Command_wordContext, i) as Command_wordContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_word_list_cmd;
    }
}

export class Command_wordContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public string_(): StringContext {
        return this.getTypedRuleContext(StringContext, 0) as StringContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_command_word;
    }
}

export class IdentifierContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public IDENTIFIER(): TerminalNode {
        return this.getToken(MathJSLabParser.IDENTIFIER, 0);
    }
    public PROPERTIES(): TerminalNode {
        return this.getToken(MathJSLabParser.PROPERTIES, 0);
    }
    public METHODS(): TerminalNode {
        return this.getToken(MathJSLabParser.METHODS, 0);
    }
    public EVENTS(): TerminalNode {
        return this.getToken(MathJSLabParser.EVENTS, 0);
    }
    public ENUMERATION(): TerminalNode {
        return this.getToken(MathJSLabParser.ENUMERATION, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_identifier;
    }
}

export class Qualified_identifier_partContext extends ParserRuleContext {
    public text: string;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_qualified_identifier_part;
    }
}

export class Qualified_identifierContext extends ParserRuleContext {
    public node: NodeIdentifier;
    public i: number = 1;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public qualified_identifier_part_list(): Qualified_identifier_partContext[] {
        return this.getTypedRuleContexts(Qualified_identifier_partContext) as Qualified_identifier_partContext[];
    }
    public qualified_identifier_part(i: number): Qualified_identifier_partContext {
        return this.getTypedRuleContext(Qualified_identifier_partContext, i) as Qualified_identifier_partContext;
    }
    public DOT_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.DOT);
    }
    public DOT(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.DOT, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_qualified_identifier;
    }
}

export class StringContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public STRING(): TerminalNode {
        return this.getToken(MathJSLabParser.STRING, 0);
    }
    public UNQUOTED_STRING(): TerminalNode {
        return this.getToken(MathJSLabParser.UNQUOTED_STRING, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_string;
    }
}

export class NumberContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public FLOAT_NUMBER(): TerminalNode {
        return this.getToken(MathJSLabParser.FLOAT_NUMBER, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_number;
    }
}

export class End_rangeContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public ENDRANGE(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDRANGE, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_end_range;
    }
}

export class ConstantContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public number_(): NumberContext {
        return this.getTypedRuleContext(NumberContext, 0) as NumberContext;
    }
    public string_(): StringContext {
        return this.getTypedRuleContext(StringContext, 0) as StringContext;
    }
    public end_range(): End_rangeContext {
        return this.getTypedRuleContext(End_rangeContext, 0) as End_rangeContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_constant;
    }
}

export class MatrixContext extends ParserRuleContext {
    public node: NodeExpr;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public LBRACKET(): TerminalNode {
        return this.getToken(MathJSLabParser.LBRACKET, 0);
    }
    public RBRACKET(): TerminalNode {
        return this.getToken(MathJSLabParser.RBRACKET, 0);
    }
    public SEMICOLON_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.SEMICOLON);
    }
    public SEMICOLON(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.SEMICOLON, i);
    }
    public nl_list(): NlContext[] {
        return this.getTypedRuleContexts(NlContext) as NlContext[];
    }
    public nl(i: number): NlContext {
        return this.getTypedRuleContext(NlContext, i) as NlContext;
    }
    public matrix_row_list(): Matrix_rowContext[] {
        return this.getTypedRuleContexts(Matrix_rowContext) as Matrix_rowContext[];
    }
    public matrix_row(i: number): Matrix_rowContext {
        return this.getTypedRuleContext(Matrix_rowContext, i) as Matrix_rowContext;
    }
    public LCURLYBR(): TerminalNode {
        return this.getToken(MathJSLabParser.LCURLYBR, 0);
    }
    public RCURLYBR(): TerminalNode {
        return this.getToken(MathJSLabParser.RCURLYBR, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_matrix;
    }
}

export class Matrix_rowContext extends ParserRuleContext {
    public node: NodeList | null;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public WSPACE_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.WSPACE);
    }
    public WSPACE(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.WSPACE, i);
    }
    public list_element_list(): List_elementContext[] {
        return this.getTypedRuleContexts(List_elementContext) as List_elementContext[];
    }
    public list_element(i: number): List_elementContext {
        return this.getTypedRuleContext(List_elementContext, i) as List_elementContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_matrix_row;
    }
}

export class Fcn_handleContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public COMMAT(): TerminalNode {
        return this.getToken(MathJSLabParser.COMMAT, 0);
    }
    public qualified_identifier(): Qualified_identifierContext {
        return this.getTypedRuleContext(Qualified_identifierContext, 0) as Qualified_identifierContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_fcn_handle;
    }
}

export class Meta_classContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public QUESTION(): TerminalNode {
        return this.getToken(MathJSLabParser.QUESTION, 0);
    }
    public qualified_identifier(): Qualified_identifierContext {
        return this.getTypedRuleContext(Qualified_identifierContext, 0) as Qualified_identifierContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_meta_class;
    }
}

export class Anon_fcn_handleContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public COMMAT(): TerminalNode {
        return this.getToken(MathJSLabParser.COMMAT, 0);
    }
    public param_list(): Param_listContext {
        return this.getTypedRuleContext(Param_listContext, 0) as Param_listContext;
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_anon_fcn_handle;
    }
}

export class Primary_exprContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public constant(): ConstantContext {
        return this.getTypedRuleContext(ConstantContext, 0) as ConstantContext;
    }
    public fcn_handle(): Fcn_handleContext {
        return this.getTypedRuleContext(Fcn_handleContext, 0) as Fcn_handleContext;
    }
    public meta_class(): Meta_classContext {
        return this.getTypedRuleContext(Meta_classContext, 0) as Meta_classContext;
    }
    public matrix(): MatrixContext {
        return this.getTypedRuleContext(MatrixContext, 0) as MatrixContext;
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_primary_expr;
    }
}

export class Magic_colonContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public COLON(): TerminalNode {
        return this.getToken(MathJSLabParser.COLON, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_magic_colon;
    }
}

export class Magic_tildeContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public TILDE(): TerminalNode {
        return this.getToken(MathJSLabParser.TILDE, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_magic_tilde;
    }
}

export class List_elementContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public magic_colon(): Magic_colonContext {
        return this.getTypedRuleContext(Magic_colonContext, 0) as Magic_colonContext;
    }
    public magic_tilde(): Magic_tildeContext {
        return this.getTypedRuleContext(Magic_tildeContext, 0) as Magic_tildeContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_list_element;
    }
}

export class Arg_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public list_element_list(): List_elementContext[] {
        return this.getTypedRuleContexts(List_elementContext) as List_elementContext[];
    }
    public list_element(i: number): List_elementContext {
        return this.getTypedRuleContext(List_elementContext, i) as List_elementContext;
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_arg_list;
    }
}

export class Oper_exprContext extends ParserRuleContext {
    public node: NodeExpr;
    public _op!: Token;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public primary_expr(): Primary_exprContext {
        return this.getTypedRuleContext(Primary_exprContext, 0) as Primary_exprContext;
    }
    public oper_expr_list(): Oper_exprContext[] {
        return this.getTypedRuleContexts(Oper_exprContext) as Oper_exprContext[];
    }
    public oper_expr(i: number): Oper_exprContext {
        return this.getTypedRuleContext(Oper_exprContext, i) as Oper_exprContext;
    }
    public PLUS_PLUS(): TerminalNode {
        return this.getToken(MathJSLabParser.PLUS_PLUS, 0);
    }
    public MINUS_MINUS(): TerminalNode {
        return this.getToken(MathJSLabParser.MINUS_MINUS, 0);
    }
    public PLUS(): TerminalNode {
        return this.getToken(MathJSLabParser.PLUS, 0);
    }
    public MINUS(): TerminalNode {
        return this.getToken(MathJSLabParser.MINUS, 0);
    }
    public TILDE(): TerminalNode {
        return this.getToken(MathJSLabParser.TILDE, 0);
    }
    public EXCLAMATION(): TerminalNode {
        return this.getToken(MathJSLabParser.EXCLAMATION, 0);
    }
    public MUL(): TerminalNode {
        return this.getToken(MathJSLabParser.MUL, 0);
    }
    public DIV(): TerminalNode {
        return this.getToken(MathJSLabParser.DIV, 0);
    }
    public LEFTDIV(): TerminalNode {
        return this.getToken(MathJSLabParser.LEFTDIV, 0);
    }
    public EMUL(): TerminalNode {
        return this.getToken(MathJSLabParser.EMUL, 0);
    }
    public EDIV(): TerminalNode {
        return this.getToken(MathJSLabParser.EDIV, 0);
    }
    public ELEFTDIV(): TerminalNode {
        return this.getToken(MathJSLabParser.ELEFTDIV, 0);
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public arg_list(): Arg_listContext {
        return this.getTypedRuleContext(Arg_listContext, 0) as Arg_listContext;
    }
    public LCURLYBR(): TerminalNode {
        return this.getToken(MathJSLabParser.LCURLYBR, 0);
    }
    public RCURLYBR(): TerminalNode {
        return this.getToken(MathJSLabParser.RCURLYBR, 0);
    }
    public COMMAT(): TerminalNode {
        return this.getToken(MathJSLabParser.COMMAT, 0);
    }
    public qualified_identifier(): Qualified_identifierContext {
        return this.getTypedRuleContext(Qualified_identifierContext, 0) as Qualified_identifierContext;
    }
    public TRANSPOSE(): TerminalNode {
        return this.getToken(MathJSLabParser.TRANSPOSE, 0);
    }
    public HERMITIAN(): TerminalNode {
        return this.getToken(MathJSLabParser.HERMITIAN, 0);
    }
    public DOT(): TerminalNode {
        return this.getToken(MathJSLabParser.DOT, 0);
    }
    public qualified_identifier_part(): Qualified_identifier_partContext {
        return this.getTypedRuleContext(Qualified_identifier_partContext, 0) as Qualified_identifier_partContext;
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public power_expr(): Power_exprContext {
        return this.getTypedRuleContext(Power_exprContext, 0) as Power_exprContext;
    }
    public POW(): TerminalNode {
        return this.getToken(MathJSLabParser.POW, 0);
    }
    public EPOW(): TerminalNode {
        return this.getToken(MathJSLabParser.EPOW, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_oper_expr;
    }
}

export class Power_exprContext extends ParserRuleContext {
    public node: NodeExpr;
    public _op!: Token;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public primary_expr(): Primary_exprContext {
        return this.getTypedRuleContext(Primary_exprContext, 0) as Primary_exprContext;
    }
    public power_expr(): Power_exprContext {
        return this.getTypedRuleContext(Power_exprContext, 0) as Power_exprContext;
    }
    public PLUS_PLUS(): TerminalNode {
        return this.getToken(MathJSLabParser.PLUS_PLUS, 0);
    }
    public MINUS_MINUS(): TerminalNode {
        return this.getToken(MathJSLabParser.MINUS_MINUS, 0);
    }
    public PLUS(): TerminalNode {
        return this.getToken(MathJSLabParser.PLUS, 0);
    }
    public MINUS(): TerminalNode {
        return this.getToken(MathJSLabParser.MINUS, 0);
    }
    public TILDE(): TerminalNode {
        return this.getToken(MathJSLabParser.TILDE, 0);
    }
    public EXCLAMATION(): TerminalNode {
        return this.getToken(MathJSLabParser.EXCLAMATION, 0);
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public arg_list(): Arg_listContext {
        return this.getTypedRuleContext(Arg_listContext, 0) as Arg_listContext;
    }
    public LCURLYBR(): TerminalNode {
        return this.getToken(MathJSLabParser.LCURLYBR, 0);
    }
    public RCURLYBR(): TerminalNode {
        return this.getToken(MathJSLabParser.RCURLYBR, 0);
    }
    public COMMAT(): TerminalNode {
        return this.getToken(MathJSLabParser.COMMAT, 0);
    }
    public qualified_identifier(): Qualified_identifierContext {
        return this.getTypedRuleContext(Qualified_identifierContext, 0) as Qualified_identifierContext;
    }
    public DOT(): TerminalNode {
        return this.getToken(MathJSLabParser.DOT, 0);
    }
    public qualified_identifier_part(): Qualified_identifier_partContext {
        return this.getTypedRuleContext(Qualified_identifier_partContext, 0) as Qualified_identifier_partContext;
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_power_expr;
    }
}

export class Colon_exprContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public oper_expr_list(): Oper_exprContext[] {
        return this.getTypedRuleContexts(Oper_exprContext) as Oper_exprContext[];
    }
    public oper_expr(i: number): Oper_exprContext {
        return this.getTypedRuleContext(Oper_exprContext, i) as Oper_exprContext;
    }
    public COLON_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COLON);
    }
    public COLON(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COLON, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_colon_expr;
    }
}

export class Simple_exprContext extends ParserRuleContext {
    public node: NodeExpr;
    public _op!: Token;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public oper_expr(): Oper_exprContext {
        return this.getTypedRuleContext(Oper_exprContext, 0) as Oper_exprContext;
    }
    public colon_expr(): Colon_exprContext {
        return this.getTypedRuleContext(Colon_exprContext, 0) as Colon_exprContext;
    }
    public simple_expr_list(): Simple_exprContext[] {
        return this.getTypedRuleContexts(Simple_exprContext) as Simple_exprContext[];
    }
    public simple_expr(i: number): Simple_exprContext {
        return this.getTypedRuleContext(Simple_exprContext, i) as Simple_exprContext;
    }
    public EXPR_LT(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_LT, 0);
    }
    public EXPR_LE(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_LE, 0);
    }
    public EXPR_GT(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_GT, 0);
    }
    public EXPR_GE(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_GE, 0);
    }
    public EXPR_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_EQ, 0);
    }
    public EXPR_NE(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_NE, 0);
    }
    public EXPR_AND(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_AND, 0);
    }
    public EXPR_OR(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_OR, 0);
    }
    public EXPR_AND_AND(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_AND_AND, 0);
    }
    public EXPR_OR_OR(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_OR_OR, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_simple_expr;
    }
}

export class ExpressionContext extends ParserRuleContext {
    public node: NodeExpr;
    public _op!: Token;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public simple_expr(): Simple_exprContext {
        return this.getTypedRuleContext(Simple_exprContext, 0) as Simple_exprContext;
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EQ, 0);
    }
    public ADD_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.ADD_EQ, 0);
    }
    public SUB_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.SUB_EQ, 0);
    }
    public MUL_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.MUL_EQ, 0);
    }
    public EMUL_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EMUL_EQ, 0);
    }
    public DIV_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.DIV_EQ, 0);
    }
    public EDIV_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EDIV_EQ, 0);
    }
    public LEFTDIV_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.LEFTDIV_EQ, 0);
    }
    public ELEFTDIV_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.ELEFTDIV_EQ, 0);
    }
    public POW_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.POW_EQ, 0);
    }
    public EPOW_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EPOW_EQ, 0);
    }
    public AND_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.AND_EQ, 0);
    }
    public OR_EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.OR_EQ, 0);
    }
    public anon_fcn_handle(): Anon_fcn_handleContext {
        return this.getTypedRuleContext(Anon_fcn_handleContext, 0) as Anon_fcn_handleContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_expression;
    }
}

export class Assign_lhsContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public simple_expr(): Simple_exprContext {
        return this.getTypedRuleContext(Simple_exprContext, 0) as Simple_exprContext;
    }
    public LBRACKET(): TerminalNode {
        return this.getToken(MathJSLabParser.LBRACKET, 0);
    }
    public RBRACKET(): TerminalNode {
        return this.getToken(MathJSLabParser.RBRACKET, 0);
    }
    public assign_list(): Assign_listContext {
        return this.getTypedRuleContext(Assign_listContext, 0) as Assign_listContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_assign_lhs;
    }
}

export class Assign_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public list_element_list(): List_elementContext[] {
        return this.getTypedRuleContexts(List_elementContext) as List_elementContext[];
    }
    public list_element(i: number): List_elementContext {
        return this.getTypedRuleContext(List_elementContext, i) as List_elementContext;
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public WSPACE_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.WSPACE);
    }
    public WSPACE(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.WSPACE, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_assign_list;
    }
}

export class CommandContext extends ParserRuleContext {
    public node: NodeInput;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public declaration(): DeclarationContext {
        return this.getTypedRuleContext(DeclarationContext, 0) as DeclarationContext;
    }
    public import_command(): Import_commandContext {
        return this.getTypedRuleContext(Import_commandContext, 0) as Import_commandContext;
    }
    public select_command(): Select_commandContext {
        return this.getTypedRuleContext(Select_commandContext, 0) as Select_commandContext;
    }
    public loop_command(): Loop_commandContext {
        return this.getTypedRuleContext(Loop_commandContext, 0) as Loop_commandContext;
    }
    public jump_command(): Jump_commandContext {
        return this.getTypedRuleContext(Jump_commandContext, 0) as Jump_commandContext;
    }
    public except_command(): Except_commandContext {
        return this.getTypedRuleContext(Except_commandContext, 0) as Except_commandContext;
    }
    public function_(): FunctionContext {
        return this.getTypedRuleContext(FunctionContext, 0) as FunctionContext;
    }
    public classdef_command(): Classdef_commandContext {
        return this.getTypedRuleContext(Classdef_commandContext, 0) as Classdef_commandContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_command;
    }
}

export class DeclarationContext extends ParserRuleContext {
    public node: NodeInput;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public declaration_element_list(): Declaration_elementContext[] {
        return this.getTypedRuleContexts(Declaration_elementContext) as Declaration_elementContext[];
    }
    public declaration_element(i: number): Declaration_elementContext {
        return this.getTypedRuleContext(Declaration_elementContext, i) as Declaration_elementContext;
    }
    public GLOBAL(): TerminalNode {
        return this.getToken(MathJSLabParser.GLOBAL, 0);
    }
    public PERSISTENT(): TerminalNode {
        return this.getToken(MathJSLabParser.PERSISTENT, 0);
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_declaration;
    }
}

export class Declaration_elementContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EQ, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_declaration_element;
    }
}

export class Import_commandContext extends ParserRuleContext {
    public node: NodeImport;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public IMPORT(): TerminalNode {
        return this.getToken(MathJSLabParser.IMPORT, 0);
    }
    public import_name_list(): Import_nameContext[] {
        return this.getTypedRuleContexts(Import_nameContext) as Import_nameContext[];
    }
    public import_name(i: number): Import_nameContext {
        return this.getTypedRuleContext(Import_nameContext, i) as Import_nameContext;
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_import_command;
    }
}

export class Import_nameContext extends ParserRuleContext {
    public node: NodeIdentifier;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public qualified_identifier(): Qualified_identifierContext {
        return this.getTypedRuleContext(Qualified_identifierContext, 0) as Qualified_identifierContext;
    }
    public DOT(): TerminalNode {
        return this.getToken(MathJSLabParser.DOT, 0);
    }
    public MUL(): TerminalNode {
        return this.getToken(MathJSLabParser.MUL, 0);
    }
    public EMUL(): TerminalNode {
        return this.getToken(MathJSLabParser.EMUL, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_import_name;
    }
}

export class Select_commandContext extends ParserRuleContext {
    public node: NodeInput;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public if_command(): If_commandContext {
        return this.getTypedRuleContext(If_commandContext, 0) as If_commandContext;
    }
    public switch_command(): Switch_commandContext {
        return this.getTypedRuleContext(Switch_commandContext, 0) as Switch_commandContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_select_command;
    }
}

export class If_commandContext extends ParserRuleContext {
    public node: NodeIf;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public IF(): TerminalNode {
        return this.getToken(MathJSLabParser.IF, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDIF(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDIF, 0);
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public elseif_clause_list(): Elseif_clauseContext[] {
        return this.getTypedRuleContexts(Elseif_clauseContext) as Elseif_clauseContext[];
    }
    public elseif_clause(i: number): Elseif_clauseContext {
        return this.getTypedRuleContext(Elseif_clauseContext, i) as Elseif_clauseContext;
    }
    public else_clause(): Else_clauseContext {
        return this.getTypedRuleContext(Else_clauseContext, 0) as Else_clauseContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_if_command;
    }
}

export class Elseif_clauseContext extends ParserRuleContext {
    public node: NodeElseIf;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public ELSEIF(): TerminalNode {
        return this.getToken(MathJSLabParser.ELSEIF, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_elseif_clause;
    }
}

export class Else_clauseContext extends ParserRuleContext {
    public node: NodeElse;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public ELSE(): TerminalNode {
        return this.getToken(MathJSLabParser.ELSE, 0);
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_else_clause;
    }
}

export class Switch_commandContext extends ParserRuleContext {
    public node: NodeSwitch;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public SWITCH(): TerminalNode {
        return this.getToken(MathJSLabParser.SWITCH, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDSWITCH(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDSWITCH, 0);
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public switch_case_list(): Switch_case_listContext {
        return this.getTypedRuleContext(Switch_case_listContext, 0) as Switch_case_listContext;
    }
    public otherwise_case(): Otherwise_caseContext {
        return this.getTypedRuleContext(Otherwise_caseContext, 0) as Otherwise_caseContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_switch_command;
    }
}

export class Switch_case_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public switch_case_list(): Switch_caseContext[] {
        return this.getTypedRuleContexts(Switch_caseContext) as Switch_caseContext[];
    }
    public switch_case(i: number): Switch_caseContext {
        return this.getTypedRuleContext(Switch_caseContext, i) as Switch_caseContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_switch_case_list;
    }
}

export class Switch_caseContext extends ParserRuleContext {
    public node: NodeSwitchCase;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public CASE(): TerminalNode {
        return this.getToken(MathJSLabParser.CASE, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_switch_case;
    }
}

export class Otherwise_caseContext extends ParserRuleContext {
    public node: NodeList;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public OTHERWISE(): TerminalNode {
        return this.getToken(MathJSLabParser.OTHERWISE, 0);
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_otherwise_case;
    }
}

export class Loop_commandContext extends ParserRuleContext {
    public node: NodeInput;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public while_command(): While_commandContext {
        return this.getTypedRuleContext(While_commandContext, 0) as While_commandContext;
    }
    public do_until_command(): Do_until_commandContext {
        return this.getTypedRuleContext(Do_until_commandContext, 0) as Do_until_commandContext;
    }
    public for_command(): For_commandContext {
        return this.getTypedRuleContext(For_commandContext, 0) as For_commandContext;
    }
    public spmd_command(): Spmd_commandContext {
        return this.getTypedRuleContext(Spmd_commandContext, 0) as Spmd_commandContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_loop_command;
    }
}

export class While_commandContext extends ParserRuleContext {
    public node: NodeWhile;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public WHILE(): TerminalNode {
        return this.getToken(MathJSLabParser.WHILE, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDWHILE(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDWHILE, 0);
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_while_command;
    }
}

export class Do_until_commandContext extends ParserRuleContext {
    public node: NodeDoUntil;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public DO(): TerminalNode {
        return this.getToken(MathJSLabParser.DO, 0);
    }
    public UNTIL(): TerminalNode {
        return this.getToken(MathJSLabParser.UNTIL, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_do_until_command;
    }
}

export class For_commandContext extends ParserRuleContext {
    public node: NodeFor;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public FOR(): TerminalNode {
        return this.getToken(MathJSLabParser.FOR, 0);
    }
    public assign_lhs(): Assign_lhsContext {
        return this.getTypedRuleContext(Assign_lhsContext, 0) as Assign_lhsContext;
    }
    public EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EQ, 0);
    }
    public expression_list(): ExpressionContext[] {
        return this.getTypedRuleContexts(ExpressionContext) as ExpressionContext[];
    }
    public expression(i: number): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, i) as ExpressionContext;
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDFOR(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDFOR, 0);
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public PARFOR(): TerminalNode {
        return this.getToken(MathJSLabParser.PARFOR, 0);
    }
    public ENDPARFOR(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDPARFOR, 0);
    }
    public COMMA(): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_for_command;
    }
}

export class Spmd_commandContext extends ParserRuleContext {
    public node: NodeSpmd;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public SPMD(): TerminalNode {
        return this.getToken(MathJSLabParser.SPMD, 0);
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDSPMD(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDSPMD, 0);
    }
    public spmd_worker_spec(): Spmd_worker_specContext {
        return this.getTypedRuleContext(Spmd_worker_specContext, 0) as Spmd_worker_specContext;
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_spmd_command;
    }
}

export class Spmd_worker_specContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public expression_list(): ExpressionContext[] {
        return this.getTypedRuleContexts(ExpressionContext) as ExpressionContext[];
    }
    public expression(i: number): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, i) as ExpressionContext;
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public COMMA(): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_spmd_worker_spec;
    }
}

export class Jump_commandContext extends ParserRuleContext {
    public node: NodeInput;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public BREAK(): TerminalNode {
        return this.getToken(MathJSLabParser.BREAK, 0);
    }
    public CONTINUE(): TerminalNode {
        return this.getToken(MathJSLabParser.CONTINUE, 0);
    }
    public RETURN(): TerminalNode {
        return this.getToken(MathJSLabParser.RETURN, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_jump_command;
    }
}

export class Except_commandContext extends ParserRuleContext {
    public node: NodeInput;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public try_command(): Try_commandContext {
        return this.getTypedRuleContext(Try_commandContext, 0) as Try_commandContext;
    }
    public unwind_command(): Unwind_commandContext {
        return this.getTypedRuleContext(Unwind_commandContext, 0) as Unwind_commandContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_except_command;
    }
}

export class Try_commandContext extends ParserRuleContext {
    public node: NodeTry;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public TRY(): TerminalNode {
        return this.getToken(MathJSLabParser.TRY, 0);
    }
    public catch_clause(): Catch_clauseContext {
        return this.getTypedRuleContext(Catch_clauseContext, 0) as Catch_clauseContext;
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public END_TRY_CATCH(): TerminalNode {
        return this.getToken(MathJSLabParser.END_TRY_CATCH, 0);
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_try_command;
    }
}

export class Catch_clauseContext extends ParserRuleContext {
    public body: NodeList;
    public identifierNode: NodeIdentifier | null;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public CATCH(): TerminalNode {
        return this.getToken(MathJSLabParser.CATCH, 0);
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_catch_clause;
    }
}

export class Unwind_commandContext extends ParserRuleContext {
    public node: NodeUnwindProtect;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public UNWIND_PROTECT(): TerminalNode {
        return this.getToken(MathJSLabParser.UNWIND_PROTECT, 0);
    }
    public unwind_cleanup_clause(): Unwind_cleanup_clauseContext {
        return this.getTypedRuleContext(Unwind_cleanup_clauseContext, 0) as Unwind_cleanup_clauseContext;
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public END_UNWIND_PROTECT(): TerminalNode {
        return this.getToken(MathJSLabParser.END_UNWIND_PROTECT, 0);
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_unwind_command;
    }
}

export class Unwind_cleanup_clauseContext extends ParserRuleContext {
    public node: NodeList;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public UNWIND_PROTECT_CLEANUP(): TerminalNode {
        return this.getToken(MathJSLabParser.UNWIND_PROTECT_CLEANUP, 0);
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_unwind_cleanup_clause;
    }
}

export class Param_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public param_list_elt_list(): Param_list_eltContext[] {
        return this.getTypedRuleContexts(Param_list_eltContext) as Param_list_eltContext[];
    }
    public param_list_elt(i: number): Param_list_eltContext {
        return this.getTypedRuleContext(Param_list_eltContext, i) as Param_list_eltContext;
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_param_list;
    }
}

export class Param_list_eltContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public declaration_element(): Declaration_elementContext {
        return this.getTypedRuleContext(Declaration_elementContext, 0) as Declaration_elementContext;
    }
    public magic_tilde(): Magic_tildeContext {
        return this.getTypedRuleContext(Magic_tildeContext, 0) as Magic_tildeContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_param_list_elt;
    }
}

export class Return_list_eltContext extends ParserRuleContext {
    public node: NodeExpr;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public magic_tilde(): Magic_tildeContext {
        return this.getTypedRuleContext(Magic_tildeContext, 0) as Magic_tildeContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_return_list_elt;
    }
}

export class Return_listContext extends ParserRuleContext {
    public node: NodeExpr;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public return_list_elt_list(): Return_list_eltContext[] {
        return this.getTypedRuleContexts(Return_list_eltContext) as Return_list_eltContext[];
    }
    public return_list_elt(i: number): Return_list_eltContext {
        return this.getTypedRuleContext(Return_list_eltContext, i) as Return_list_eltContext;
    }
    public LBRACKET(): TerminalNode {
        return this.getToken(MathJSLabParser.LBRACKET, 0);
    }
    public RBRACKET(): TerminalNode {
        return this.getToken(MathJSLabParser.RBRACKET, 0);
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public WSPACE_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.WSPACE);
    }
    public WSPACE(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.WSPACE, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_return_list;
    }
}

export class FunctionContext extends ParserRuleContext {
    public node: NodeInput;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public FUNCTION(): TerminalNode {
        return this.getToken(MathJSLabParser.FUNCTION, 0);
    }
    public function_name(): Function_nameContext {
        return this.getTypedRuleContext(Function_nameContext, 0) as Function_nameContext;
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDFUNCTION(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDFUNCTION, 0);
    }
    public EOF(): TerminalNode {
        return this.getToken(MathJSLabParser.EOF, 0);
    }
    public return_list(): Return_listContext {
        return this.getTypedRuleContext(Return_listContext, 0) as Return_listContext;
    }
    public EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EQ, 0);
    }
    public param_list(): Param_listContext {
        return this.getTypedRuleContext(Param_listContext, 0) as Param_listContext;
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public arguments_block_list(): Arguments_block_listContext {
        return this.getTypedRuleContext(Arguments_block_listContext, 0) as Arguments_block_listContext;
    }
    public list(): ListContext {
        return this.getTypedRuleContext(ListContext, 0) as ListContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_function;
    }
}

export class Function_nameContext extends ParserRuleContext {
    public node: NodeIdentifier;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public qualified_identifier(): Qualified_identifierContext {
        return this.getTypedRuleContext(Qualified_identifierContext, 0) as Qualified_identifierContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_function_name;
    }
}

export class Classdef_commandContext extends ParserRuleContext {
    public node: NodeClassDef;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public CLASSDEF(): TerminalNode {
        return this.getToken(MathJSLabParser.CLASSDEF, 0);
    }
    public qualified_identifier(): Qualified_identifierContext {
        return this.getTypedRuleContext(Qualified_identifierContext, 0) as Qualified_identifierContext;
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDCLASSDEF(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDCLASSDEF, 0);
    }
    public EOF(): TerminalNode {
        return this.getToken(MathJSLabParser.EOF, 0);
    }
    public class_attribute_list(): Class_attribute_listContext {
        return this.getTypedRuleContext(Class_attribute_listContext, 0) as Class_attribute_listContext;
    }
    public class_superclass_list(): Class_superclass_listContext {
        return this.getTypedRuleContext(Class_superclass_listContext, 0) as Class_superclass_listContext;
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public class_section_list(): Class_section_listContext {
        return this.getTypedRuleContext(Class_section_listContext, 0) as Class_section_listContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_classdef_command;
    }
}

export class Class_attribute_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public class_attribute_list(): Class_attributeContext[] {
        return this.getTypedRuleContexts(Class_attributeContext) as Class_attributeContext[];
    }
    public class_attribute(i: number): Class_attributeContext {
        return this.getTypedRuleContext(Class_attributeContext, i) as Class_attributeContext;
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_attribute_list;
    }
}

export class Class_attributeContext extends ParserRuleContext {
    public node: NodeClassAttribute;
    public _op!: Token;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EQ, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public TILDE(): TerminalNode {
        return this.getToken(MathJSLabParser.TILDE, 0);
    }
    public EXCLAMATION(): TerminalNode {
        return this.getToken(MathJSLabParser.EXCLAMATION, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_attribute;
    }
}

export class Class_method_nameContext extends ParserRuleContext {
    public node: NodeIdentifier;
    public i: number = 1;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier_list(): IdentifierContext[] {
        return this.getTypedRuleContexts(IdentifierContext) as IdentifierContext[];
    }
    public identifier(i: number): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, i) as IdentifierContext;
    }
    public DOT_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.DOT);
    }
    public DOT(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.DOT, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_method_name;
    }
}

export class Class_superclass_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public EXPR_LT(): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_LT, 0);
    }
    public qualified_identifier_list(): Qualified_identifierContext[] {
        return this.getTypedRuleContexts(Qualified_identifierContext) as Qualified_identifierContext[];
    }
    public qualified_identifier(i: number): Qualified_identifierContext {
        return this.getTypedRuleContext(Qualified_identifierContext, i) as Qualified_identifierContext;
    }
    public EXPR_AND_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.EXPR_AND);
    }
    public EXPR_AND(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.EXPR_AND, i);
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_superclass_list;
    }
}

export class Class_section_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public class_section_list(): Class_sectionContext[] {
        return this.getTypedRuleContexts(Class_sectionContext) as Class_sectionContext[];
    }
    public class_section(i: number): Class_sectionContext {
        return this.getTypedRuleContext(Class_sectionContext, i) as Class_sectionContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_section_list;
    }
}

export class Class_sectionContext extends ParserRuleContext {
    public node: NodeClassSection;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public properties_section(): Properties_sectionContext {
        return this.getTypedRuleContext(Properties_sectionContext, 0) as Properties_sectionContext;
    }
    public methods_section(): Methods_sectionContext {
        return this.getTypedRuleContext(Methods_sectionContext, 0) as Methods_sectionContext;
    }
    public events_section(): Events_sectionContext {
        return this.getTypedRuleContext(Events_sectionContext, 0) as Events_sectionContext;
    }
    public enumeration_section(): Enumeration_sectionContext {
        return this.getTypedRuleContext(Enumeration_sectionContext, 0) as Enumeration_sectionContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_section;
    }
}

export class Properties_sectionContext extends ParserRuleContext {
    public node: NodeClassSection;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public PROPERTIES(): TerminalNode {
        return this.getToken(MathJSLabParser.PROPERTIES, 0);
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDPROPERTIES(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDPROPERTIES, 0);
    }
    public class_attribute_list(): Class_attribute_listContext {
        return this.getTypedRuleContext(Class_attribute_listContext, 0) as Class_attribute_listContext;
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public class_property_list(): Class_property_listContext {
        return this.getTypedRuleContext(Class_property_listContext, 0) as Class_property_listContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_properties_section;
    }
}

export class Class_property_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public class_property_list(): Class_propertyContext[] {
        return this.getTypedRuleContexts(Class_propertyContext) as Class_propertyContext[];
    }
    public class_property(i: number): Class_propertyContext {
        return this.getTypedRuleContext(Class_propertyContext, i) as Class_propertyContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_property_list;
    }
}

export class Class_propertyContext extends ParserRuleContext {
    public node: NodeClassProperty;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public arg_list_list(): Arg_listContext[] {
        return this.getTypedRuleContexts(Arg_listContext) as Arg_listContext[];
    }
    public arg_list(i: number): Arg_listContext {
        return this.getTypedRuleContext(Arg_listContext, i) as Arg_listContext;
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public qualified_identifier(): Qualified_identifierContext {
        return this.getTypedRuleContext(Qualified_identifierContext, 0) as Qualified_identifierContext;
    }
    public LCURLYBR(): TerminalNode {
        return this.getToken(MathJSLabParser.LCURLYBR, 0);
    }
    public RCURLYBR(): TerminalNode {
        return this.getToken(MathJSLabParser.RCURLYBR, 0);
    }
    public EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EQ, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_property;
    }
}

export class Methods_sectionContext extends ParserRuleContext {
    public node: NodeClassSection;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public METHODS(): TerminalNode {
        return this.getToken(MathJSLabParser.METHODS, 0);
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDMETHODS(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDMETHODS, 0);
    }
    public class_attribute_list(): Class_attribute_listContext {
        return this.getTypedRuleContext(Class_attribute_listContext, 0) as Class_attribute_listContext;
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public class_method_list(): Class_method_listContext {
        return this.getTypedRuleContext(Class_method_listContext, 0) as Class_method_listContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_methods_section;
    }
}

export class Class_methodContext extends ParserRuleContext {
    public node: NodeFunctionDefinition;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public function_(): FunctionContext {
        return this.getTypedRuleContext(FunctionContext, 0) as FunctionContext;
    }
    public class_method_name(): Class_method_nameContext {
        return this.getTypedRuleContext(Class_method_nameContext, 0) as Class_method_nameContext;
    }
    public param_list(): Param_listContext {
        return this.getTypedRuleContext(Param_listContext, 0) as Param_listContext;
    }
    public return_list(): Return_listContext {
        return this.getTypedRuleContext(Return_listContext, 0) as Return_listContext;
    }
    public EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EQ, 0);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_method;
    }
}

export class Class_method_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public class_method_list(): Class_methodContext[] {
        return this.getTypedRuleContexts(Class_methodContext) as Class_methodContext[];
    }
    public class_method(i: number): Class_methodContext {
        return this.getTypedRuleContext(Class_methodContext, i) as Class_methodContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_method_list;
    }
}

export class Events_sectionContext extends ParserRuleContext {
    public node: NodeClassSection;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public EVENTS(): TerminalNode {
        return this.getToken(MathJSLabParser.EVENTS, 0);
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDEVENTS(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDEVENTS, 0);
    }
    public class_attribute_list(): Class_attribute_listContext {
        return this.getTypedRuleContext(Class_attribute_listContext, 0) as Class_attribute_listContext;
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public class_event_list(): Class_event_listContext {
        return this.getTypedRuleContext(Class_event_listContext, 0) as Class_event_listContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_events_section;
    }
}

export class Class_event_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public class_event_list(): Class_eventContext[] {
        return this.getTypedRuleContexts(Class_eventContext) as Class_eventContext[];
    }
    public class_event(i: number): Class_eventContext {
        return this.getTypedRuleContext(Class_eventContext, i) as Class_eventContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_event_list;
    }
}

export class Class_eventContext extends ParserRuleContext {
    public node: NodeClassEvent;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_event;
    }
}

export class Enumeration_sectionContext extends ParserRuleContext {
    public node: NodeClassSection;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public ENUMERATION(): TerminalNode {
        return this.getToken(MathJSLabParser.ENUMERATION, 0);
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDENUMERATION(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDENUMERATION, 0);
    }
    public class_attribute_list(): Class_attribute_listContext {
        return this.getTypedRuleContext(Class_attribute_listContext, 0) as Class_attribute_listContext;
    }
    public sep(): SepContext {
        return this.getTypedRuleContext(SepContext, 0) as SepContext;
    }
    public class_enumeration_list(): Class_enumeration_listContext {
        return this.getTypedRuleContext(Class_enumeration_listContext, 0) as Class_enumeration_listContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_enumeration_section;
    }
}

export class Class_enumeration_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public class_enumeration_list(): Class_enumerationContext[] {
        return this.getTypedRuleContexts(Class_enumerationContext) as Class_enumerationContext[];
    }
    public class_enumeration(i: number): Class_enumerationContext {
        return this.getTypedRuleContext(Class_enumerationContext, i) as Class_enumerationContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_enumeration_list;
    }
}

export class Class_enumerationContext extends ParserRuleContext {
    public node: NodeClassEnumeration;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public arg_list(): Arg_listContext {
        return this.getTypedRuleContext(Arg_listContext, 0) as Arg_listContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_class_enumeration;
    }
}

export class Arguments_block_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public arguments_block_list(): Arguments_blockContext[] {
        return this.getTypedRuleContexts(Arguments_blockContext) as Arguments_blockContext[];
    }
    public arguments_block(i: number): Arguments_blockContext {
        return this.getTypedRuleContext(Arguments_blockContext, i) as Arguments_blockContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_arguments_block_list;
    }
}

export class Arguments_blockContext extends ParserRuleContext {
    public node: NodeArguments;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public ARGUMENTS(): TerminalNode {
        return this.getToken(MathJSLabParser.ARGUMENTS, 0);
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
    }
    public ENDARGUMENTS(): TerminalNode {
        return this.getToken(MathJSLabParser.ENDARGUMENTS, 0);
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public args_validation_list(): Args_validation_listContext {
        return this.getTypedRuleContext(Args_validation_listContext, 0) as Args_validation_listContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_arguments_block;
    }
}

export class Args_validation_listContext extends ParserRuleContext {
    public node: NodeList;
    public i: number = 0;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public arg_validation_list(): Arg_validationContext[] {
        return this.getTypedRuleContexts(Arg_validationContext) as Arg_validationContext[];
    }
    public arg_validation(i: number): Arg_validationContext {
        return this.getTypedRuleContext(Arg_validationContext, i) as Arg_validationContext;
    }
    public sep_list(): SepContext[] {
        return this.getTypedRuleContexts(SepContext) as SepContext[];
    }
    public sep(i: number): SepContext {
        return this.getTypedRuleContext(SepContext, i) as SepContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_args_validation_list;
    }
}

export class Arg_validationContext extends ParserRuleContext {
    public node: NodeArgumentValidation;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public arg_validation_name(): Arg_validation_nameContext {
        return this.getTypedRuleContext(Arg_validation_nameContext, 0) as Arg_validation_nameContext;
    }
    public LPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.LPAREN, 0);
    }
    public arg_list_list(): Arg_listContext[] {
        return this.getTypedRuleContexts(Arg_listContext) as Arg_listContext[];
    }
    public arg_list(i: number): Arg_listContext {
        return this.getTypedRuleContext(Arg_listContext, i) as Arg_listContext;
    }
    public RPAREN(): TerminalNode {
        return this.getToken(MathJSLabParser.RPAREN, 0);
    }
    public qualified_identifier(): Qualified_identifierContext {
        return this.getTypedRuleContext(Qualified_identifierContext, 0) as Qualified_identifierContext;
    }
    public LCURLYBR(): TerminalNode {
        return this.getToken(MathJSLabParser.LCURLYBR, 0);
    }
    public RCURLYBR(): TerminalNode {
        return this.getToken(MathJSLabParser.RCURLYBR, 0);
    }
    public EQ(): TerminalNode {
        return this.getToken(MathJSLabParser.EQ, 0);
    }
    public expression(): ExpressionContext {
        return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_arg_validation;
    }
}

export class Arg_validation_nameContext extends ParserRuleContext {
    public node: NodeExpr;
    public i: number = 1;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public identifier_list(): IdentifierContext[] {
        return this.getTypedRuleContexts(IdentifierContext) as IdentifierContext[];
    }
    public identifier(i: number): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, i) as IdentifierContext;
    }
    public DOT_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.DOT);
    }
    public DOT(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.DOT, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_arg_validation_name;
    }
}

export class Sep_no_nlContext extends ParserRuleContext {
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public SEMICOLON_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.SEMICOLON);
    }
    public SEMICOLON(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.SEMICOLON, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_sep_no_nl;
    }
}

export class NlContext extends ParserRuleContext {
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public NEWLINE_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.NEWLINE);
    }
    public NEWLINE(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.NEWLINE, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_nl;
    }
}

export class SepContext extends ParserRuleContext {
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.COMMA, i);
    }
    public SEMICOLON_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.SEMICOLON);
    }
    public SEMICOLON(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.SEMICOLON, i);
    }
    public NEWLINE_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.NEWLINE);
    }
    public NEWLINE(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.NEWLINE, i);
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_sep;
    }
}
