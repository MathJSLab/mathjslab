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
    NodeList,
    NodeArgumentValidation,
    NodeArguments,
    NodeIf,
    NodeElseIf,
    NodeElse,
    NodeSwitch,
    NodeSwitchCase,
    StringQuoteCharacter,
} from './AST';
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
    public static readonly IF = 3;
    public static readonly ENDIF = 4;
    public static readonly END = 5;
    public static readonly ENDRANGE = 6;
    public static readonly ELSEIF = 7;
    public static readonly ELSE = 8;
    public static readonly SWITCH = 9;
    public static readonly ENDSWITCH = 10;
    public static readonly CASE = 11;
    public static readonly OTHERWISE = 12;
    public static readonly WHILE = 13;
    public static readonly ENDWHILE = 14;
    public static readonly DO = 15;
    public static readonly UNTIL = 16;
    public static readonly FOR = 17;
    public static readonly ENDFOR = 18;
    public static readonly PARFOR = 19;
    public static readonly ENDPARFOR = 20;
    public static readonly BREAK = 21;
    public static readonly CONTINUE = 22;
    public static readonly RETURN = 23;
    public static readonly FUNCTION = 24;
    public static readonly ENDFUNCTION = 25;
    public static readonly TRY = 26;
    public static readonly CATCH = 27;
    public static readonly END_TRY_CATCH = 28;
    public static readonly UNWIND_PROTECT = 29;
    public static readonly UNWIND_PROTECT_CLEANUP = 30;
    public static readonly END_UNWIND_PROTECT = 31;
    public static readonly CLASSDEF = 32;
    public static readonly ENDCLASSDEF = 33;
    public static readonly ENUMERATION = 34;
    public static readonly ENDENUMERATION = 35;
    public static readonly PROPERTIES = 36;
    public static readonly ENDPROPERTIES = 37;
    public static readonly EVENTS = 38;
    public static readonly ENDEVENTS = 39;
    public static readonly METHODS = 40;
    public static readonly ENDMETHODS = 41;
    public static readonly WSPACE = 42;
    public static readonly STRING = 43;
    public static readonly ARGUMENTS = 44;
    public static readonly PLUS = 45;
    public static readonly MINUS = 46;
    public static readonly MUL = 47;
    public static readonly DIV = 48;
    public static readonly EQ = 49;
    public static readonly COLON = 50;
    public static readonly SEMICOLON = 51;
    public static readonly COMMA = 52;
    public static readonly DOT = 53;
    public static readonly TILDE = 54;
    public static readonly EXCLAMATION = 55;
    public static readonly COMMAT = 56;
    public static readonly LPAREN = 57;
    public static readonly RPAREN = 58;
    public static readonly LBRACKET = 59;
    public static readonly RBRACKET = 60;
    public static readonly LCURLYBR = 61;
    public static readonly RCURLYBR = 62;
    public static readonly LEFTDIV = 63;
    public static readonly ADD_EQ = 64;
    public static readonly SUB_EQ = 65;
    public static readonly MUL_EQ = 66;
    public static readonly DIV_EQ = 67;
    public static readonly LEFTDIV_EQ = 68;
    public static readonly POW_EQ = 69;
    public static readonly EMUL_EQ = 70;
    public static readonly EDIV_EQ = 71;
    public static readonly ELEFTDIV_EQ = 72;
    public static readonly EPOW_EQ = 73;
    public static readonly AND_EQ = 74;
    public static readonly OR_EQ = 75;
    public static readonly EXPR_AND_AND = 76;
    public static readonly EXPR_OR_OR = 77;
    public static readonly EXPR_AND = 78;
    public static readonly EXPR_OR = 79;
    public static readonly EXPR_LT = 80;
    public static readonly EXPR_LE = 81;
    public static readonly EXPR_EQ = 82;
    public static readonly EXPR_NE = 83;
    public static readonly EXPR_GE = 84;
    public static readonly EXPR_GT = 85;
    public static readonly EMUL = 86;
    public static readonly EDIV = 87;
    public static readonly ELEFTDIV = 88;
    public static readonly PLUS_PLUS = 89;
    public static readonly MINUS_MINUS = 90;
    public static readonly POW = 91;
    public static readonly EPOW = 92;
    public static readonly TRANSPOSE = 93;
    public static readonly HERMITIAN = 94;
    public static readonly DQSTRING = 95;
    public static readonly IDENTIFIER = 96;
    public static readonly FLOAT_NUMBER = 97;
    public static readonly NUMBER_DOT_OP = 98;
    public static readonly SPACE_OR_CONTINUATION = 99;
    public static readonly NEWLINE = 100;
    public static readonly BLOCK_COMMENT_START = 101;
    public static readonly COMMENT_LINE = 102;
    public static readonly INVALID = 103;
    public static readonly SINGLEQ_STRING = 104;
    public static readonly SINGLEQ_NL = 105;
    public static readonly SINGLEQ_SINGLEQ = 106;
    public static readonly SINGLEQ_END = 107;
    public static readonly DOUBLEQ_STRING = 108;
    public static readonly DOUBLEQ_NL = 109;
    public static readonly DOUBLEQ_DOUBLEQ = 110;
    public static readonly DOUBLEQ_ESCAPE = 111;
    public static readonly DOUBLEQ_ESCAPE_OTHER = 112;
    public static readonly DOUBLEQ_ESCAPE_OCT = 113;
    public static readonly DOUBLEQ_ESCAPE_HEX = 114;
    public static readonly DOUBLEQ_ESCAPE_UNICODE = 115;
    public static readonly DOUBLEQ_END = 116;
    public static readonly BLOCK_COMMENT_START_AGAIN = 117;
    public static readonly BLOCK_COMMENT_END = 118;
    public static readonly BLOCK_COMMENT_LINE = 119;
    public static readonly BLOCK_COMMENT_EOF = 120;
    public static readonly SKIP_SPACE = 121;
    public static readonly SKIP_COMMENT_LINE = 122;
    public static readonly EXIT_AT_NEWLINE = 123;
    public static readonly EXIT_AT_EOF = 124;
    public static readonly UNQUOTED_STRING = 125;
    public static override readonly EOF = Token.EOF;
    public static readonly RULE_input = 0;
    public static readonly RULE_global_list = 1;
    public static readonly RULE_list = 2;
    public static readonly RULE_statement = 3;
    public static readonly RULE_word_list_cmd = 4;
    public static readonly RULE_identifier = 5;
    public static readonly RULE_string = 6;
    public static readonly RULE_number = 7;
    public static readonly RULE_end_range = 8;
    public static readonly RULE_constant = 9;
    public static readonly RULE_matrix = 10;
    public static readonly RULE_matrix_row = 11;
    public static readonly RULE_fcn_handle = 12;
    public static readonly RULE_anon_fcn_handle = 13;
    public static readonly RULE_primary_expr = 14;
    public static readonly RULE_magic_colon = 15;
    public static readonly RULE_magic_tilde = 16;
    public static readonly RULE_list_element = 17;
    public static readonly RULE_arg_list = 18;
    public static readonly RULE_oper_expr = 19;
    public static readonly RULE_power_expr = 20;
    public static readonly RULE_colon_expr = 21;
    public static readonly RULE_simple_expr = 22;
    public static readonly RULE_expression = 23;
    public static readonly RULE_command = 24;
    public static readonly RULE_declaration = 25;
    public static readonly RULE_declaration_element = 26;
    public static readonly RULE_select_command = 27;
    public static readonly RULE_if_command = 28;
    public static readonly RULE_elseif_clause = 29;
    public static readonly RULE_else_clause = 30;
    public static readonly RULE_switch_command = 31;
    public static readonly RULE_switch_case_list = 32;
    public static readonly RULE_switch_case = 33;
    public static readonly RULE_otherwise_case = 34;
    public static readonly RULE_param_list = 35;
    public static readonly RULE_param_list_elt = 36;
    public static readonly RULE_return_list = 37;
    public static readonly RULE_function = 38;
    public static readonly RULE_arguments_block_list = 39;
    public static readonly RULE_arguments_block = 40;
    public static readonly RULE_args_validation_list = 41;
    public static readonly RULE_arg_validation = 42;
    public static readonly RULE_arg_validation_name = 43;
    public static readonly RULE_sep_no_nl = 44;
    public static readonly RULE_nl = 45;
    public static readonly RULE_sep = 46;
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
        'SKIP_SPACE',
        'SKIP_COMMENT_LINE',
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
        'identifier',
        'string',
        'number',
        'end_range',
        'constant',
        'matrix',
        'matrix_row',
        'fcn_handle',
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
        'command',
        'declaration',
        'declaration_element',
        'select_command',
        'if_command',
        'elseif_clause',
        'else_clause',
        'switch_command',
        'switch_case_list',
        'switch_case',
        'otherwise_case',
        'param_list',
        'param_list_elt',
        'return_list',
        'function',
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
            this.state = 106;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 2, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 95;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 51 || _la === 52 || _la === 100) {
                            {
                                this.state = 94;
                                this.sep();
                            }
                        }

                        this.state = 97;
                        this.match(MathJSLabParser.EOF);

                        localctx.node = null;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 100;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 51 || _la === 52 || _la === 100) {
                            {
                                this.state = 99;
                                this.sep();
                            }
                        }

                        this.state = 102;
                        this.global_list();
                        this.state = 103;
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
                this.state = 108;
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

                this.state = 116;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 3, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 110;
                                this.sep();
                                this.state = 111;
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
                    this.state = 118;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 3, this._ctx);
                }
                this.state = 120;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 119;
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
                this.state = 124;
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

                this.state = 132;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 5, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 126;
                                this.sep();
                                this.state = 127;
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
                    this.state = 134;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 5, this._ctx);
                }
                this.state = 136;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 6, this._ctx)) {
                    case 1:
                        {
                            this.state = 135;
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
            this.state = 149;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 7, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 140;
                        this.expression();

                        localctx.node = localctx.expression().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 143;
                        this.command();

                        localctx.node = localctx.command().node;
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 146;
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
                this.state = 151;
                this.identifier();
                this.state = 157;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 43 || _la === 125) {
                    {
                        {
                            this.state = 152;
                            this.string_();

                            if (localctx.i === 0) {
                                localctx.node = AST.nodeListFirst(localctx.string_(localctx.i++).node);
                            } else {
                                AST.appendNodeList(localctx.node, localctx.string_(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 159;
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
    public identifier(): IdentifierContext {
        let localctx: IdentifierContext = new IdentifierContext(this, this._ctx, this.state);
        this.enterRule(localctx, 10, MathJSLabParser.RULE_identifier);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 162;
                this.match(MathJSLabParser.IDENTIFIER);

                localctx.node = AST.nodeIdentifier(localctx.IDENTIFIER().getText());
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
        this.enterRule(localctx, 12, MathJSLabParser.RULE_string);
        try {
            this.state = 169;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 43:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 165;
                        this.match(MathJSLabParser.STRING);

                        const str = localctx.STRING().getText();
                        localctx.node = AST.nodeString(str.substring(1, str.length - 1), str[0] as StringQuoteCharacter);
                    }
                    break;
                case 125:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 167;
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
        this.enterRule(localctx, 14, MathJSLabParser.RULE_number);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 171;
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
        this.enterRule(localctx, 16, MathJSLabParser.RULE_end_range);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 174;
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
        this.enterRule(localctx, 18, MathJSLabParser.RULE_constant);
        try {
            this.state = 186;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 97:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 177;
                        this.number_();

                        localctx.node = localctx.number_().node;
                    }
                    break;
                case 43:
                case 125:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 180;
                        this.string_();

                        localctx.node = localctx.string_().node;
                    }
                    break;
                case 6:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 183;
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
        this.enterRule(localctx, 20, MathJSLabParser.RULE_matrix);
        let _la: number;
        try {
            let _alt: number;
            this.state = 234;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 17, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 188;
                        this.match(MathJSLabParser.LBRACKET);
                        this.state = 189;
                        this.match(MathJSLabParser.RBRACKET);

                        localctx.node = AST.emptyArray();
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 191;
                        this.match(MathJSLabParser.LBRACKET);
                        this.state = 192;
                        this.matrix_row();

                        localctx.node = AST.nodeFirstRow(localctx.matrix_row(localctx.i++).node);

                        this.state = 203;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(this._input, 12, this._ctx);
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    {
                                        this.state = 196;
                                        this._errHandler.sync(this);
                                        switch (this._input.LA(1)) {
                                            case 51:
                                                {
                                                    this.state = 194;
                                                    this.match(MathJSLabParser.SEMICOLON);
                                                }
                                                break;
                                            case 100:
                                                {
                                                    this.state = 195;
                                                    this.nl();
                                                }
                                                break;
                                            default:
                                                throw new NoViableAltException(this);
                                        }
                                        this.state = 198;
                                        this.matrix_row();

                                        localctx.node = AST.nodeAppendRow(localctx.node, localctx.matrix_row(localctx.i++).node);
                                    }
                                }
                            }
                            this.state = 205;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(this._input, 12, this._ctx);
                        }
                        this.state = 207;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 100) {
                            {
                                this.state = 206;
                                this.nl();
                            }
                        }

                        this.state = 209;
                        this.match(MathJSLabParser.RBRACKET);
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 211;
                        this.match(MathJSLabParser.LCURLYBR);
                        this.state = 212;
                        this.match(MathJSLabParser.RCURLYBR);

                        localctx.node = AST.emptyArray(true);
                    }
                    break;
                case 4:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 214;
                        this.match(MathJSLabParser.LCURLYBR);
                        this.state = 215;
                        this.matrix_row();

                        localctx.node = AST.nodeFirstRow(localctx.matrix_row(localctx.i++).node, true);

                        this.state = 226;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(this._input, 15, this._ctx);
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    {
                                        this.state = 219;
                                        this._errHandler.sync(this);
                                        switch (this._input.LA(1)) {
                                            case 51:
                                                {
                                                    this.state = 217;
                                                    this.match(MathJSLabParser.SEMICOLON);
                                                }
                                                break;
                                            case 100:
                                                {
                                                    this.state = 218;
                                                    this.nl();
                                                }
                                                break;
                                            default:
                                                throw new NoViableAltException(this);
                                        }
                                        this.state = 221;
                                        this.matrix_row();

                                        localctx.node = AST.nodeAppendRow(localctx.node, localctx.matrix_row(localctx.i++).node);
                                    }
                                }
                            }
                            this.state = 228;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(this._input, 15, this._ctx);
                        }
                        this.state = 230;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 100) {
                            {
                                this.state = 229;
                                this.nl();
                            }
                        }

                        this.state = 232;
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
        this.enterRule(localctx, 22, MathJSLabParser.RULE_matrix_row);
        let _la: number;
        try {
            let _alt: number;
            this.state = 255;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 21, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 236;
                        _la = this._input.LA(1);
                        if (!(_la === 42 || _la === 52)) {
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
                        this.state = 239;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 42 || _la === 52) {
                            {
                                this.state = 238;
                                _la = this._input.LA(1);
                                if (!(_la === 42 || _la === 52)) {
                                    this._errHandler.recoverInline(this);
                                } else {
                                    this._errHandler.reportMatch(this);
                                    this.consume();
                                }
                            }
                        }

                        this.state = 241;
                        this.list_element();

                        localctx.node = AST.nodeListFirst(localctx.list_element(localctx.i++).node);

                        this.state = 249;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(this._input, 19, this._ctx);
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    {
                                        this.state = 243;
                                        _la = this._input.LA(1);
                                        if (!(_la === 42 || _la === 52)) {
                                            this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 244;
                                        this.list_element();

                                        localctx.node = AST.appendNodeList(localctx.node, localctx.list_element(localctx.i++).node);
                                    }
                                }
                            }
                            this.state = 251;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(this._input, 19, this._ctx);
                        }
                        this.state = 253;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 42 || _la === 52) {
                            {
                                this.state = 252;
                                _la = this._input.LA(1);
                                if (!(_la === 42 || _la === 52)) {
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
        this.enterRule(localctx, 24, MathJSLabParser.RULE_fcn_handle);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 257;
                this.match(MathJSLabParser.COMMAT);
                this.state = 258;
                this.identifier();

                localctx.node = AST.nodeFunctionHandle(localctx.identifier().node);
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
        this.enterRule(localctx, 26, MathJSLabParser.RULE_anon_fcn_handle);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 261;
                this.match(MathJSLabParser.COMMAT);
                this.state = 262;
                this.param_list();
                this.state = 263;
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
        this.enterRule(localctx, 28, MathJSLabParser.RULE_primary_expr);
        try {
            this.state = 283;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 96:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 266;
                        this.identifier();

                        localctx.node = localctx.identifier().node;
                    }
                    break;
                case 6:
                case 43:
                case 97:
                case 125:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 269;
                        this.constant();

                        localctx.node = localctx.constant().node;
                    }
                    break;
                case 56:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 272;
                        this.fcn_handle();

                        localctx.node = localctx.fcn_handle().node;
                    }
                    break;
                case 59:
                case 61:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 275;
                        this.matrix();

                        localctx.node = localctx.matrix().node;
                    }
                    break;
                case 57:
                    this.enterOuterAlt(localctx, 5);
                    {
                        this.state = 278;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 279;
                        this.expression();
                        this.state = 280;
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
        this.enterRule(localctx, 30, MathJSLabParser.RULE_magic_colon);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 285;
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
        this.enterRule(localctx, 32, MathJSLabParser.RULE_magic_tilde);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 288;
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
        this.enterRule(localctx, 34, MathJSLabParser.RULE_list_element);
        try {
            this.state = 300;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 23, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 291;
                        this.expression();

                        localctx.node = localctx.expression().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 294;
                        this.magic_colon();

                        localctx.node = localctx.magic_colon().node;
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 297;
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
        this.enterRule(localctx, 36, MathJSLabParser.RULE_arg_list);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 302;
                this.list_element();

                localctx.node = AST.nodeListFirst(localctx.list_element(localctx.i++).node);

                this.state = 310;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 52) {
                    {
                        {
                            this.state = 304;
                            this.match(MathJSLabParser.COMMA);
                            this.state = 305;
                            this.list_element();

                            localctx.node = AST.appendNodeList(localctx.node, localctx.list_element(localctx.i++).node);
                        }
                    }
                    this.state = 312;
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
        let _startState: number = 38;
        this.enterRecursionRule(localctx, 38, MathJSLabParser.RULE_oper_expr, _p);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 325;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                    case 6:
                    case 43:
                    case 56:
                    case 57:
                    case 59:
                    case 61:
                    case 96:
                    case 97:
                    case 125:
                        {
                            this.state = 314;
                            this.primary_expr();

                            localctx.node = localctx.primary_expr().node;
                        }
                        break;
                    case 45:
                    case 46:
                    case 89:
                    case 90:
                        {
                            this.state = 317;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 45 || _la === 46 || _la === 89 || _la === 90)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 318;
                            this.oper_expr(4);

                            localctx.node = AST.nodeOperation((localctx._op.text + '_') as OperatorType, localctx.oper_expr(0).node);
                        }
                        break;
                    case 54:
                    case 55:
                        {
                            this.state = 321;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 54 || _la === 55)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 322;
                            this.oper_expr(3);

                            localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node);
                        }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 375;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 29, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 373;
                            this._errHandler.sync(this);
                            switch (this._interp.adaptivePredict(this._input, 28, this._ctx)) {
                                case 1:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 327;
                                        if (!this.precpred(this._ctx, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 2)');
                                        }
                                        this.state = 328;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!((((_la - 47) & ~0x1f) === 0 && ((1 << (_la - 47)) & 65539) !== 0) || (((_la - 86) & ~0x1f) === 0 && ((1 << (_la - 86)) & 7) !== 0))) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 329;
                                        this.oper_expr(3);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.oper_expr(1).node);
                                    }
                                    break;
                                case 2:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 332;
                                        if (!this.precpred(this._ctx, 1)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 1)');
                                        }
                                        this.state = 333;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 45 || _la === 46)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 334;
                                        this.oper_expr(2);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.oper_expr(1).node);
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 337;
                                        if (!this.precpred(this._ctx, 11)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 11)');
                                        }
                                        this.state = 338;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 89 || _la === 90)) {
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
                                        this.state = 340;
                                        if (!this.precpred(this._ctx, 10)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 10)');
                                        }
                                        this.state = 341;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 343;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 6 ||
                                            (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358541) !== 0) ||
                                            (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                                            _la === 125
                                        ) {
                                            {
                                                this.state = 342;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 345;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndexExpr(localctx.oper_expr(0).node, localctx.arg_list() ? localctx.arg_list().node : null, '()');
                                    }
                                    break;
                                case 5:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 347;
                                        if (!this.precpred(this._ctx, 9)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 9)');
                                        }
                                        this.state = 348;
                                        this.match(MathJSLabParser.LCURLYBR);
                                        this.state = 350;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 6 ||
                                            (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358541) !== 0) ||
                                            (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                                            _la === 125
                                        ) {
                                            {
                                                this.state = 349;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 352;
                                        this.match(MathJSLabParser.RCURLYBR);

                                        localctx.node = AST.nodeIndexExpr(localctx.oper_expr(0).node, localctx.arg_list() ? localctx.arg_list().node : null, '{}');
                                    }
                                    break;
                                case 6:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 354;
                                        if (!this.precpred(this._ctx, 8)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 8)');
                                        }
                                        this.state = 355;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 93 || _la === 94)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node);
                                    }
                                    break;
                                case 7:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 357;
                                        if (!this.precpred(this._ctx, 7)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 7)');
                                        }
                                        this.state = 358;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 359;
                                        this.match(MathJSLabParser.IDENTIFIER);

                                        localctx.node = AST.nodeIndirectRef(localctx.oper_expr(0).node, localctx.IDENTIFIER().getText());
                                    }
                                    break;
                                case 8:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 361;
                                        if (!this.precpred(this._ctx, 6)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 6)');
                                        }
                                        this.state = 362;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 363;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 364;
                                        this.expression();
                                        this.state = 365;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndirectRef(localctx.oper_expr(0).node, localctx.expression().node);
                                    }
                                    break;
                                case 9:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 368;
                                        if (!this.precpred(this._ctx, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 5)');
                                        }
                                        this.state = 369;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 91 || _la === 92)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 370;
                                        this.power_expr(0);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.power_expr().node);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 377;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 29, this._ctx);
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
        let _startState: number = 40;
        this.enterRecursionRule(localctx, 40, MathJSLabParser.RULE_power_expr, _p);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 390;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                    case 6:
                    case 43:
                    case 56:
                    case 57:
                    case 59:
                    case 61:
                    case 96:
                    case 97:
                    case 125:
                        {
                            this.state = 379;
                            this.primary_expr();

                            localctx.node = localctx.primary_expr().node;
                        }
                        break;
                    case 45:
                    case 46:
                    case 89:
                    case 90:
                        {
                            this.state = 382;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 45 || _la === 46 || _la === 89 || _la === 90)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 383;
                            this.power_expr(2);

                            localctx.node = AST.nodeOperation((localctx._op.text + '_') as OperatorType, localctx.power_expr().node);
                        }
                        break;
                    case 54:
                    case 55:
                        {
                            this.state = 386;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 54 || _la === 55)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 387;
                            this.power_expr(1);

                            localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.power_expr().node);
                        }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 422;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 34, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 420;
                            this._errHandler.sync(this);
                            switch (this._interp.adaptivePredict(this._input, 33, this._ctx)) {
                                case 1:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 392;
                                        if (!this.precpred(this._ctx, 7)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 7)');
                                        }
                                        this.state = 393;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 89 || _la === 90)) {
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
                                        this.state = 395;
                                        if (!this.precpred(this._ctx, 6)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 6)');
                                        }
                                        this.state = 396;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 398;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 6 ||
                                            (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358541) !== 0) ||
                                            (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                                            _la === 125
                                        ) {
                                            {
                                                this.state = 397;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 400;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndexExpr(localctx.power_expr().node, localctx.arg_list() ? localctx.arg_list().node : null, '()');
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 402;
                                        if (!this.precpred(this._ctx, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 5)');
                                        }
                                        this.state = 403;
                                        this.match(MathJSLabParser.LCURLYBR);
                                        this.state = 405;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 6 ||
                                            (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358541) !== 0) ||
                                            (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                                            _la === 125
                                        ) {
                                            {
                                                this.state = 404;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 407;
                                        this.match(MathJSLabParser.RCURLYBR);

                                        localctx.node = AST.nodeIndexExpr(localctx.power_expr().node, localctx.arg_list() ? localctx.arg_list().node : null, '{}');
                                    }
                                    break;
                                case 4:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 409;
                                        if (!this.precpred(this._ctx, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 4)');
                                        }
                                        this.state = 410;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 411;
                                        this.match(MathJSLabParser.IDENTIFIER);

                                        localctx.node = AST.nodeIndirectRef(localctx.power_expr().node, localctx.IDENTIFIER().getText());
                                    }
                                    break;
                                case 5:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 413;
                                        if (!this.precpred(this._ctx, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 3)');
                                        }
                                        this.state = 414;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 415;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 416;
                                        this.expression();
                                        this.state = 417;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndirectRef(localctx.power_expr().node, localctx.expression().node);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 424;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 34, this._ctx);
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
        this.enterRule(localctx, 42, MathJSLabParser.RULE_colon_expr);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 425;
                this.oper_expr(0);
                this.state = 426;
                this.match(MathJSLabParser.COLON);
                this.state = 427;
                this.oper_expr(0);
                this.state = 430;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 35, this._ctx)) {
                    case 1:
                        {
                            this.state = 428;
                            this.match(MathJSLabParser.COLON);
                            this.state = 429;
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
        let _startState: number = 44;
        this.enterRecursionRule(localctx, 44, MathJSLabParser.RULE_simple_expr, _p);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 441;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 36, this._ctx)) {
                    case 1:
                        {
                            this.state = 435;
                            this.oper_expr(0);

                            localctx.node = localctx.oper_expr().node;
                        }
                        break;
                    case 2:
                        {
                            this.state = 438;
                            this.colon_expr();

                            localctx.node = localctx.colon_expr().node;
                        }
                        break;
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 470;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 38, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 468;
                            this._errHandler.sync(this);
                            switch (this._interp.adaptivePredict(this._input, 37, this._ctx)) {
                                case 1:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 443;
                                        if (!this.precpred(this._ctx, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 5)');
                                        }
                                        this.state = 444;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(((_la - 80) & ~0x1f) === 0 && ((1 << (_la - 80)) & 63) !== 0)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 445;
                                        this.simple_expr(6);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 2:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 448;
                                        if (!this.precpred(this._ctx, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 4)');
                                        }
                                        this.state = 449;
                                        localctx._op = this.match(MathJSLabParser.EXPR_AND);
                                        this.state = 450;
                                        this.simple_expr(5);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 453;
                                        if (!this.precpred(this._ctx, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 3)');
                                        }
                                        this.state = 454;
                                        localctx._op = this.match(MathJSLabParser.EXPR_OR);
                                        this.state = 455;
                                        this.simple_expr(4);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 4:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 458;
                                        if (!this.precpred(this._ctx, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 2)');
                                        }
                                        this.state = 459;
                                        localctx._op = this.match(MathJSLabParser.EXPR_AND_AND);
                                        this.state = 460;
                                        this.simple_expr(3);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 5:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 463;
                                        if (!this.precpred(this._ctx, 1)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 1)');
                                        }
                                        this.state = 464;
                                        localctx._op = this.match(MathJSLabParser.EXPR_OR_OR);
                                        this.state = 465;
                                        this.simple_expr(2);

                                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 472;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 38, this._ctx);
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
        this.enterRule(localctx, 46, MathJSLabParser.RULE_expression);
        let _la: number;
        try {
            this.state = 484;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 39, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 473;
                        this.simple_expr(0);

                        localctx.node = localctx.simple_expr().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 476;
                        this.simple_expr(0);
                        this.state = 477;
                        localctx._op = this._input.LT(1);
                        _la = this._input.LA(1);
                        if (!(((_la - 49) & ~0x1f) === 0 && ((1 << (_la - 49)) & 134184961) !== 0)) {
                            localctx._op = this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }
                        this.state = 478;
                        this.expression();

                        localctx.node = AST.nodeOperation(localctx._op.text as OperatorType, localctx.simple_expr().node, localctx.expression().node);
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 481;
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
    public command(): CommandContext {
        let localctx: CommandContext = new CommandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 48, MathJSLabParser.RULE_command);
        try {
            this.state = 497;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 1:
                case 2:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 486;
                        this.declaration();

                        localctx.node = localctx.declaration().node;
                    }
                    break;
                case 23:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 489;
                        this.match(MathJSLabParser.RETURN);

                        localctx.node = AST.nodeReturn();
                    }
                    break;
                case 3:
                case 9:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 491;
                        this.select_command();

                        localctx.node = localctx.select_command().node;
                    }
                    break;
                case 24:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 494;
                        this.function_();

                        localctx.node = localctx.function_().node;
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
        this.enterRule(localctx, 50, MathJSLabParser.RULE_declaration);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 503;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                    case 1:
                        {
                            this.state = 499;
                            this.match(MathJSLabParser.GLOBAL);

                            localctx.node = AST.nodeDeclarationFirst('GLOBAL');
                        }
                        break;
                    case 2:
                        {
                            this.state = 501;
                            this.match(MathJSLabParser.PERSISTENT);

                            localctx.node = AST.nodeDeclarationFirst('PERSIST');
                        }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this.state = 508;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                    {
                        {
                            this.state = 505;
                            this.declaration_element();

                            localctx.node = AST.nodeAppendDeclaration(localctx.node, localctx.declaration_element(localctx.i++).node);
                        }
                    }
                    this.state = 510;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                } while (_la === 96);
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
        this.enterRule(localctx, 52, MathJSLabParser.RULE_declaration_element);
        try {
            this.state = 520;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 43, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 512;
                        this.identifier();

                        localctx.node = localctx.identifier().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 515;
                        this.identifier();
                        this.state = 516;
                        this.match(MathJSLabParser.EQ);
                        this.state = 517;
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
    public select_command(): Select_commandContext {
        let localctx: Select_commandContext = new Select_commandContext(this, this._ctx, this.state);
        this.enterRule(localctx, 54, MathJSLabParser.RULE_select_command);
        try {
            this.state = 528;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 3:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 522;
                        this.if_command();

                        localctx.node = localctx.if_command().node;
                    }
                    break;
                case 9:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 525;
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
        this.enterRule(localctx, 56, MathJSLabParser.RULE_if_command);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 530;
                this.match(MathJSLabParser.IF);
                this.state = 531;
                this.expression();
                this.state = 533;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 532;
                        this.sep();
                    }
                }

                this.state = 536;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 25166414) !== 0) ||
                    (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358413) !== 0) ||
                    (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                    _la === 125
                ) {
                    {
                        this.state = 535;
                        this.list();
                    }
                }

                localctx.node = AST.nodeIfBegin(localctx.expression().node, localctx.list() ? localctx.list().node : AST.nodeListFirst());

                this.state = 544;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 7) {
                    {
                        {
                            this.state = 539;
                            this.elseif_clause();

                            localctx.node = AST.nodeIfAppendElseIf(localctx.node, localctx.elseif_clause(localctx.i++).node);
                        }
                    }
                    this.state = 546;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
                this.state = 548;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 8) {
                    {
                        this.state = 547;
                        this.else_clause();
                    }
                }

                if (localctx.else_clause()) {
                    localctx.node = AST.nodeIfAppendElse(localctx.node, localctx.else_clause().node);
                }

                this.state = 551;
                _la = this._input.LA(1);
                if (!(_la === 4 || _la === 5)) {
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
        this.enterRule(localctx, 58, MathJSLabParser.RULE_elseif_clause);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 553;
                this.match(MathJSLabParser.ELSEIF);
                this.state = 555;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 554;
                        this.sep();
                    }
                }

                this.state = 557;
                this.expression();
                this.state = 559;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 558;
                        this.sep();
                    }
                }

                this.state = 562;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 25166414) !== 0) ||
                    (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358413) !== 0) ||
                    (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                    _la === 125
                ) {
                    {
                        this.state = 561;
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
        this.enterRule(localctx, 60, MathJSLabParser.RULE_else_clause);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 566;
                this.match(MathJSLabParser.ELSE);
                this.state = 568;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 567;
                        this.sep();
                    }
                }

                this.state = 571;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 25166414) !== 0) ||
                    (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358413) !== 0) ||
                    (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                    _la === 125
                ) {
                    {
                        this.state = 570;
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
        this.enterRule(localctx, 62, MathJSLabParser.RULE_switch_command);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 575;
                this.match(MathJSLabParser.SWITCH);
                this.state = 576;
                this.expression();
                this.state = 578;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 577;
                        this.sep();
                    }
                }

                this.state = 581;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 11) {
                    {
                        this.state = 580;
                        this.switch_case_list();
                    }
                }

                this.state = 584;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 12) {
                    {
                        this.state = 583;
                        this.otherwise_case();
                    }
                }

                this.state = 586;
                _la = this._input.LA(1);
                if (!(_la === 5 || _la === 10)) {
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
        this.enterRule(localctx, 64, MathJSLabParser.RULE_switch_case_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 589;
                this.switch_case();

                localctx.node = AST.nodeListFirst(localctx.switch_case(localctx.i++).node);

                this.state = 599;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 58, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 592;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 51 || _la === 52 || _la === 100) {
                                    {
                                        this.state = 591;
                                        this.sep();
                                    }
                                }

                                this.state = 594;
                                this.switch_case();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.switch_case(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 601;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 58, this._ctx);
                }
                this.state = 603;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 602;
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
        this.enterRule(localctx, 66, MathJSLabParser.RULE_switch_case);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 605;
                this.match(MathJSLabParser.CASE);
                this.state = 607;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 606;
                        this.sep();
                    }
                }

                this.state = 609;
                this.expression();
                this.state = 611;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 61, this._ctx)) {
                    case 1:
                        {
                            this.state = 610;
                            this.sep();
                        }
                        break;
                }
                this.state = 614;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 25166414) !== 0) ||
                    (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358413) !== 0) ||
                    (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                    _la === 125
                ) {
                    {
                        this.state = 613;
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
        this.enterRule(localctx, 68, MathJSLabParser.RULE_otherwise_case);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 618;
                this.match(MathJSLabParser.OTHERWISE);
                this.state = 620;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 63, this._ctx)) {
                    case 1:
                        {
                            this.state = 619;
                            this.sep();
                        }
                        break;
                }
                this.state = 623;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 25166414) !== 0) ||
                    (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358413) !== 0) ||
                    (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                    _la === 125
                ) {
                    {
                        this.state = 622;
                        this.list();
                    }
                }

                this.state = 626;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 625;
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
    public param_list(): Param_listContext {
        let localctx: Param_listContext = new Param_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 70, MathJSLabParser.RULE_param_list);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 630;
                this.match(MathJSLabParser.LPAREN);

                localctx.node = AST.nodeListFirst();

                this.state = 643;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 54 || _la === 96) {
                    {
                        this.state = 632;
                        this.param_list_elt();

                        localctx.node = AST.appendNodeList(localctx.node, localctx.param_list_elt(localctx.i++).node);

                        this.state = 640;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        while (_la === 52) {
                            {
                                {
                                    this.state = 634;
                                    this.match(MathJSLabParser.COMMA);
                                    this.state = 635;
                                    this.param_list_elt();

                                    localctx.node = AST.appendNodeList(localctx.node, localctx.param_list_elt(localctx.i++).node);
                                }
                            }
                            this.state = 642;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                        }
                    }
                }

                this.state = 645;
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
        this.enterRule(localctx, 72, MathJSLabParser.RULE_param_list_elt);
        try {
            this.state = 653;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 96:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 647;
                        this.declaration_element();

                        localctx.node = localctx.declaration_element().node;
                    }
                    break;
                case 54:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 650;
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
        this.enterRule(localctx, 74, MathJSLabParser.RULE_return_list);
        let _la: number;
        try {
            this.state = 674;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 96:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 655;
                        this.identifier();

                        localctx.node = AST.nodeListFirst(localctx.identifier(0).node);
                    }
                    break;
                case 59:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 658;
                        this.match(MathJSLabParser.LBRACKET);

                        localctx.node = AST.nodeListFirst();

                        this.state = 671;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 96) {
                            {
                                this.state = 660;
                                this.identifier();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.identifier(localctx.i++).node);

                                this.state = 668;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                while (_la === 52) {
                                    {
                                        {
                                            this.state = 662;
                                            this.match(MathJSLabParser.COMMA);
                                            this.state = 663;
                                            this.identifier();

                                            localctx.node = AST.appendNodeList(localctx.node, localctx.identifier(localctx.i++).node);
                                        }
                                    }
                                    this.state = 670;
                                    this._errHandler.sync(this);
                                    _la = this._input.LA(1);
                                }
                            }
                        }

                        this.state = 673;
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
        this.enterRule(localctx, 76, MathJSLabParser.RULE_function);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 676;
                this.match(MathJSLabParser.FUNCTION);
                this.state = 680;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 72, this._ctx)) {
                    case 1:
                        {
                            this.state = 677;
                            this.return_list();
                            this.state = 678;
                            this.match(MathJSLabParser.EQ);
                        }
                        break;
                }
                this.state = 682;
                this.identifier();
                this.state = 684;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 73, this._ctx)) {
                    case 1:
                        {
                            this.state = 683;
                            this.param_list();
                        }
                        break;
                }
                this.state = 687;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 686;
                        this.sep();
                    }
                }

                this.state = 690;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 44) {
                    {
                        this.state = 689;
                        this.arguments_block_list();
                    }
                }

                this.state = 693;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 25166414) !== 0) ||
                    (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358413) !== 0) ||
                    (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                    _la === 125
                ) {
                    {
                        this.state = 692;
                        this.list();
                    }
                }

                this.state = 695;
                _la = this._input.LA(1);
                if (!(((_la - -1) & ~0x1f) === 0 && ((1 << (_la - -1)) & 67108929) !== 0)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeFunctionDefinition(
                    localctx.identifier().node,
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
    public arguments_block_list(): Arguments_block_listContext {
        let localctx: Arguments_block_listContext = new Arguments_block_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 78, MathJSLabParser.RULE_arguments_block_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 698;
                this.arguments_block();

                localctx.node = AST.nodeListFirst(localctx.arguments_block(localctx.i++).node);

                this.state = 708;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 78, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 701;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 51 || _la === 52 || _la === 100) {
                                    {
                                        this.state = 700;
                                        this.sep();
                                    }
                                }

                                this.state = 703;
                                this.arguments_block();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.arguments_block(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 710;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 78, this._ctx);
                }
                this.state = 712;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 711;
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
        this.enterRule(localctx, 80, MathJSLabParser.RULE_arguments_block);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 714;
                this.match(MathJSLabParser.ARGUMENTS);
                this.state = 716;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 715;
                        this.sep();
                    }
                }

                this.state = 724;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 57) {
                    {
                        this.state = 718;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 719;
                        this.identifier();
                        this.state = 720;
                        this.match(MathJSLabParser.RPAREN);
                        this.state = 722;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 51 || _la === 52 || _la === 100) {
                            {
                                this.state = 721;
                                this.sep();
                            }
                        }
                    }
                }

                this.state = 726;
                this.args_validation_list();
                this.state = 728;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 727;
                        this.sep();
                    }
                }

                this.state = 730;
                this.match(MathJSLabParser.END);

                localctx.node = AST.nodeArguments(localctx.identifier() ? localctx.identifier().node : null, localctx.args_validation_list().node);
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
        this.enterRule(localctx, 82, MathJSLabParser.RULE_args_validation_list);
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 733;
                this.arg_validation();

                localctx.node = AST.nodeListFirst(localctx.arg_validation(localctx.i++).node);

                this.state = 741;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 84, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 735;
                                this.sep();
                                this.state = 736;
                                this.arg_validation();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.arg_validation(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 743;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 84, this._ctx);
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
        this.enterRule(localctx, 84, MathJSLabParser.RULE_arg_validation);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 744;
                this.arg_validation_name();
                this.state = 749;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 57) {
                    {
                        this.state = 745;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 746;
                        this.arg_list();
                        this.state = 747;
                        this.match(MathJSLabParser.RPAREN);
                    }
                }

                this.state = 752;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 96) {
                    {
                        this.state = 751;
                        this.identifier();
                    }
                }

                this.state = 758;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 61) {
                    {
                        this.state = 754;
                        this.match(MathJSLabParser.LCURLYBR);
                        this.state = 755;
                        this.arg_list();
                        this.state = 756;
                        this.match(MathJSLabParser.RCURLYBR);
                    }
                }

                this.state = 762;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 49) {
                    {
                        this.state = 760;
                        this.match(MathJSLabParser.EQ);
                        this.state = 761;
                        this.expression();
                    }
                }

                localctx.node = AST.nodeArgumentValidation(
                    localctx.arg_validation_name().node,
                    localctx.LPAREN() ? localctx.arg_list(0).node : AST.nodeListFirst(),
                    localctx.identifier() ? localctx.identifier().node : AST.nodeListFirst(),
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
        this.enterRule(localctx, 86, MathJSLabParser.RULE_arg_validation_name);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 766;
                this.identifier();

                localctx.node = localctx.identifier(0).node;

                this.state = 774;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 53) {
                    {
                        {
                            this.state = 768;
                            this.match(MathJSLabParser.DOT);
                            this.state = 769;
                            this.identifier();

                            localctx.node = AST.nodeIndirectRef(localctx.node, localctx.identifier(localctx.i++).node.id);
                        }
                    }
                    this.state = 776;
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
        this.enterRule(localctx, 88, MathJSLabParser.RULE_sep_no_nl);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 778;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                    {
                        {
                            this.state = 777;
                            _la = this._input.LA(1);
                            if (!(_la === 51 || _la === 52)) {
                                this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                        }
                    }
                    this.state = 780;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                } while (_la === 51 || _la === 52);
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
        this.enterRule(localctx, 90, MathJSLabParser.RULE_nl);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 783;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                    {
                        {
                            this.state = 782;
                            this.match(MathJSLabParser.NEWLINE);
                        }
                    }
                    this.state = 785;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                } while (_la === 100);
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
        this.enterRule(localctx, 92, MathJSLabParser.RULE_sep);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 788;
                this._errHandler.sync(this);
                _alt = 1;
                do {
                    switch (_alt) {
                        case 1:
                            {
                                {
                                    this.state = 787;
                                    _la = this._input.LA(1);
                                    if (!(_la === 51 || _la === 52 || _la === 100)) {
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
                    this.state = 790;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 92, this._ctx);
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
            case 19:
                return this.oper_expr_sempred(localctx as Oper_exprContext, predIndex);
            case 20:
                return this.power_expr_sempred(localctx as Power_exprContext, predIndex);
            case 22:
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
                return this.precpred(this._ctx, 11);
            case 3:
                return this.precpred(this._ctx, 10);
            case 4:
                return this.precpred(this._ctx, 9);
            case 5:
                return this.precpred(this._ctx, 8);
            case 6:
                return this.precpred(this._ctx, 7);
            case 7:
                return this.precpred(this._ctx, 6);
            case 8:
                return this.precpred(this._ctx, 5);
        }
        return true;
    }
    private power_expr_sempred(localctx: Power_exprContext, predIndex: number): boolean {
        switch (predIndex) {
            case 9:
                return this.precpred(this._ctx, 7);
            case 10:
                return this.precpred(this._ctx, 6);
            case 11:
                return this.precpred(this._ctx, 5);
            case 12:
                return this.precpred(this._ctx, 4);
            case 13:
                return this.precpred(this._ctx, 3);
        }
        return true;
    }
    private simple_expr_sempred(localctx: Simple_exprContext, predIndex: number): boolean {
        switch (predIndex) {
            case 14:
                return this.precpred(this._ctx, 5);
            case 15:
                return this.precpred(this._ctx, 4);
            case 16:
                return this.precpred(this._ctx, 3);
            case 17:
                return this.precpred(this._ctx, 2);
            case 18:
                return this.precpred(this._ctx, 1);
        }
        return true;
    }

    public static readonly _serializedATN: number[] = [
        4, 1, 125, 793, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2,
        13, 7, 13, 2, 14, 7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20, 7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7, 23, 2, 24, 7, 24, 2, 25, 7, 25, 2,
        26, 7, 26, 2, 27, 7, 27, 2, 28, 7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7, 31, 2, 32, 7, 32, 2, 33, 7, 33, 2, 34, 7, 34, 2, 35, 7, 35, 2, 36, 7, 36, 2, 37, 7, 37, 2, 38, 7, 38, 2,
        39, 7, 39, 2, 40, 7, 40, 2, 41, 7, 41, 2, 42, 7, 42, 2, 43, 7, 43, 2, 44, 7, 44, 2, 45, 7, 45, 2, 46, 7, 46, 1, 0, 3, 0, 96, 8, 0, 1, 0, 1, 0, 1, 0, 3, 0, 101, 8, 0, 1, 0, 1, 0, 1,
        0, 1, 0, 3, 0, 107, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 115, 8, 1, 10, 1, 12, 1, 118, 9, 1, 1, 1, 3, 1, 121, 8, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 5, 2,
        131, 8, 2, 10, 2, 12, 2, 134, 9, 2, 1, 2, 3, 2, 137, 8, 2, 1, 2, 1, 2, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 3, 3, 150, 8, 3, 1, 4, 1, 4, 1, 4, 1, 4, 5, 4, 156, 8, 4,
        10, 4, 12, 4, 159, 9, 4, 1, 4, 1, 4, 1, 5, 1, 5, 1, 5, 1, 6, 1, 6, 1, 6, 1, 6, 3, 6, 170, 8, 6, 1, 7, 1, 7, 1, 7, 1, 8, 1, 8, 1, 8, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1,
        9, 3, 9, 187, 8, 9, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 3, 10, 197, 8, 10, 1, 10, 1, 10, 1, 10, 5, 10, 202, 8, 10, 10, 10, 12, 10, 205, 9, 10, 1, 10, 3, 10, 208,
        8, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 3, 10, 220, 8, 10, 1, 10, 1, 10, 1, 10, 5, 10, 225, 8, 10, 10, 10, 12, 10, 228, 9, 10, 1, 10, 3, 10, 231,
        8, 10, 1, 10, 1, 10, 3, 10, 235, 8, 10, 1, 11, 1, 11, 1, 11, 3, 11, 240, 8, 11, 1, 11, 1, 11, 1, 11, 1, 11, 1, 11, 1, 11, 5, 11, 248, 8, 11, 10, 11, 12, 11, 251, 9, 11, 1, 11, 3, 11,
        254, 8, 11, 3, 11, 256, 8, 11, 1, 12, 1, 12, 1, 12, 1, 12, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1,
        14, 1, 14, 1, 14, 1, 14, 1, 14, 3, 14, 284, 8, 14, 1, 15, 1, 15, 1, 15, 1, 16, 1, 16, 1, 16, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 3, 17, 301, 8, 17, 1, 18,
        1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 5, 18, 309, 8, 18, 10, 18, 12, 18, 312, 9, 18, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 3, 19, 326, 8,
        19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 3, 19, 344, 8, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 3, 19, 351,
        8, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 5, 19, 374, 8, 19, 10, 19,
        12, 19, 377, 9, 19, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 3, 20, 391, 8, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 3, 20, 399, 8,
        20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 3, 20, 406, 8, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 5, 20, 421, 8, 20, 10, 20, 12,
        20, 424, 9, 20, 1, 21, 1, 21, 1, 21, 1, 21, 1, 21, 3, 21, 431, 8, 21, 1, 21, 1, 21, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 3, 22, 442, 8, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1,
        22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 5, 22, 469, 8, 22, 10, 22, 12, 22,
        472, 9, 22, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 3, 23, 485, 8, 23, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1,
        24, 3, 24, 498, 8, 24, 1, 25, 1, 25, 1, 25, 1, 25, 3, 25, 504, 8, 25, 1, 25, 1, 25, 1, 25, 4, 25, 509, 8, 25, 11, 25, 12, 25, 510, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1,
        26, 3, 26, 521, 8, 26, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 3, 27, 529, 8, 27, 1, 28, 1, 28, 1, 28, 3, 28, 534, 8, 28, 1, 28, 3, 28, 537, 8, 28, 1, 28, 1, 28, 1, 28, 1, 28, 5,
        28, 543, 8, 28, 10, 28, 12, 28, 546, 9, 28, 1, 28, 3, 28, 549, 8, 28, 1, 28, 1, 28, 1, 28, 1, 29, 1, 29, 3, 29, 556, 8, 29, 1, 29, 1, 29, 3, 29, 560, 8, 29, 1, 29, 3, 29, 563, 8, 29,
        1, 29, 1, 29, 1, 30, 1, 30, 3, 30, 569, 8, 30, 1, 30, 3, 30, 572, 8, 30, 1, 30, 1, 30, 1, 31, 1, 31, 1, 31, 3, 31, 579, 8, 31, 1, 31, 3, 31, 582, 8, 31, 1, 31, 3, 31, 585, 8, 31, 1,
        31, 1, 31, 1, 31, 1, 32, 1, 32, 1, 32, 3, 32, 593, 8, 32, 1, 32, 1, 32, 1, 32, 5, 32, 598, 8, 32, 10, 32, 12, 32, 601, 9, 32, 1, 32, 3, 32, 604, 8, 32, 1, 33, 1, 33, 3, 33, 608, 8,
        33, 1, 33, 1, 33, 3, 33, 612, 8, 33, 1, 33, 3, 33, 615, 8, 33, 1, 33, 1, 33, 1, 34, 1, 34, 3, 34, 621, 8, 34, 1, 34, 3, 34, 624, 8, 34, 1, 34, 3, 34, 627, 8, 34, 1, 34, 1, 34, 1, 35,
        1, 35, 1, 35, 1, 35, 1, 35, 1, 35, 1, 35, 1, 35, 5, 35, 639, 8, 35, 10, 35, 12, 35, 642, 9, 35, 3, 35, 644, 8, 35, 1, 35, 1, 35, 1, 36, 1, 36, 1, 36, 1, 36, 1, 36, 1, 36, 3, 36, 654,
        8, 36, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 5, 37, 667, 8, 37, 10, 37, 12, 37, 670, 9, 37, 3, 37, 672, 8, 37, 1, 37, 3, 37, 675, 8, 37, 1, 38,
        1, 38, 1, 38, 1, 38, 3, 38, 681, 8, 38, 1, 38, 1, 38, 3, 38, 685, 8, 38, 1, 38, 3, 38, 688, 8, 38, 1, 38, 3, 38, 691, 8, 38, 1, 38, 3, 38, 694, 8, 38, 1, 38, 1, 38, 1, 38, 1, 39, 1,
        39, 1, 39, 3, 39, 702, 8, 39, 1, 39, 1, 39, 1, 39, 5, 39, 707, 8, 39, 10, 39, 12, 39, 710, 9, 39, 1, 39, 3, 39, 713, 8, 39, 1, 40, 1, 40, 3, 40, 717, 8, 40, 1, 40, 1, 40, 1, 40, 1,
        40, 3, 40, 723, 8, 40, 3, 40, 725, 8, 40, 1, 40, 1, 40, 3, 40, 729, 8, 40, 1, 40, 1, 40, 1, 40, 1, 41, 1, 41, 1, 41, 1, 41, 1, 41, 1, 41, 5, 41, 740, 8, 41, 10, 41, 12, 41, 743, 9,
        41, 1, 42, 1, 42, 1, 42, 1, 42, 1, 42, 3, 42, 750, 8, 42, 1, 42, 3, 42, 753, 8, 42, 1, 42, 1, 42, 1, 42, 1, 42, 3, 42, 759, 8, 42, 1, 42, 1, 42, 3, 42, 763, 8, 42, 1, 42, 1, 42, 1,
        43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 5, 43, 773, 8, 43, 10, 43, 12, 43, 776, 9, 43, 1, 44, 4, 44, 779, 8, 44, 11, 44, 12, 44, 780, 1, 45, 4, 45, 784, 8, 45, 11, 45, 12, 45, 785, 1,
        46, 4, 46, 789, 8, 46, 11, 46, 12, 46, 790, 1, 46, 0, 3, 38, 40, 44, 47, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54,
        56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 0, 15, 2, 0, 42, 42, 52, 52, 2, 0, 45, 46, 89, 90, 1, 0, 54, 55, 3, 0, 47, 48, 63, 63, 86, 88, 1, 0, 45,
        46, 1, 0, 89, 90, 1, 0, 93, 94, 1, 0, 91, 92, 1, 0, 80, 85, 2, 0, 49, 49, 64, 75, 1, 0, 4, 5, 2, 0, 5, 5, 10, 10, 2, 1, 5, 5, 25, 25, 1, 0, 51, 52, 2, 0, 51, 52, 100, 100, 864, 0,
        106, 1, 0, 0, 0, 2, 108, 1, 0, 0, 0, 4, 124, 1, 0, 0, 0, 6, 149, 1, 0, 0, 0, 8, 151, 1, 0, 0, 0, 10, 162, 1, 0, 0, 0, 12, 169, 1, 0, 0, 0, 14, 171, 1, 0, 0, 0, 16, 174, 1, 0, 0, 0,
        18, 186, 1, 0, 0, 0, 20, 234, 1, 0, 0, 0, 22, 255, 1, 0, 0, 0, 24, 257, 1, 0, 0, 0, 26, 261, 1, 0, 0, 0, 28, 283, 1, 0, 0, 0, 30, 285, 1, 0, 0, 0, 32, 288, 1, 0, 0, 0, 34, 300, 1, 0,
        0, 0, 36, 302, 1, 0, 0, 0, 38, 325, 1, 0, 0, 0, 40, 390, 1, 0, 0, 0, 42, 425, 1, 0, 0, 0, 44, 441, 1, 0, 0, 0, 46, 484, 1, 0, 0, 0, 48, 497, 1, 0, 0, 0, 50, 503, 1, 0, 0, 0, 52, 520,
        1, 0, 0, 0, 54, 528, 1, 0, 0, 0, 56, 530, 1, 0, 0, 0, 58, 553, 1, 0, 0, 0, 60, 566, 1, 0, 0, 0, 62, 575, 1, 0, 0, 0, 64, 589, 1, 0, 0, 0, 66, 605, 1, 0, 0, 0, 68, 618, 1, 0, 0, 0,
        70, 630, 1, 0, 0, 0, 72, 653, 1, 0, 0, 0, 74, 674, 1, 0, 0, 0, 76, 676, 1, 0, 0, 0, 78, 698, 1, 0, 0, 0, 80, 714, 1, 0, 0, 0, 82, 733, 1, 0, 0, 0, 84, 744, 1, 0, 0, 0, 86, 766, 1, 0,
        0, 0, 88, 778, 1, 0, 0, 0, 90, 783, 1, 0, 0, 0, 92, 788, 1, 0, 0, 0, 94, 96, 3, 92, 46, 0, 95, 94, 1, 0, 0, 0, 95, 96, 1, 0, 0, 0, 96, 97, 1, 0, 0, 0, 97, 98, 5, 0, 0, 1, 98, 107, 6,
        0, -1, 0, 99, 101, 3, 92, 46, 0, 100, 99, 1, 0, 0, 0, 100, 101, 1, 0, 0, 0, 101, 102, 1, 0, 0, 0, 102, 103, 3, 2, 1, 0, 103, 104, 5, 0, 0, 1, 104, 105, 6, 0, -1, 0, 105, 107, 1, 0,
        0, 0, 106, 95, 1, 0, 0, 0, 106, 100, 1, 0, 0, 0, 107, 1, 1, 0, 0, 0, 108, 109, 3, 6, 3, 0, 109, 116, 6, 1, -1, 0, 110, 111, 3, 92, 46, 0, 111, 112, 3, 6, 3, 0, 112, 113, 6, 1, -1, 0,
        113, 115, 1, 0, 0, 0, 114, 110, 1, 0, 0, 0, 115, 118, 1, 0, 0, 0, 116, 114, 1, 0, 0, 0, 116, 117, 1, 0, 0, 0, 117, 120, 1, 0, 0, 0, 118, 116, 1, 0, 0, 0, 119, 121, 3, 92, 46, 0, 120,
        119, 1, 0, 0, 0, 120, 121, 1, 0, 0, 0, 121, 122, 1, 0, 0, 0, 122, 123, 6, 1, -1, 0, 123, 3, 1, 0, 0, 0, 124, 125, 3, 6, 3, 0, 125, 132, 6, 2, -1, 0, 126, 127, 3, 92, 46, 0, 127, 128,
        3, 6, 3, 0, 128, 129, 6, 2, -1, 0, 129, 131, 1, 0, 0, 0, 130, 126, 1, 0, 0, 0, 131, 134, 1, 0, 0, 0, 132, 130, 1, 0, 0, 0, 132, 133, 1, 0, 0, 0, 133, 136, 1, 0, 0, 0, 134, 132, 1, 0,
        0, 0, 135, 137, 3, 92, 46, 0, 136, 135, 1, 0, 0, 0, 136, 137, 1, 0, 0, 0, 137, 138, 1, 0, 0, 0, 138, 139, 6, 2, -1, 0, 139, 5, 1, 0, 0, 0, 140, 141, 3, 46, 23, 0, 141, 142, 6, 3, -1,
        0, 142, 150, 1, 0, 0, 0, 143, 144, 3, 48, 24, 0, 144, 145, 6, 3, -1, 0, 145, 150, 1, 0, 0, 0, 146, 147, 3, 8, 4, 0, 147, 148, 6, 3, -1, 0, 148, 150, 1, 0, 0, 0, 149, 140, 1, 0, 0, 0,
        149, 143, 1, 0, 0, 0, 149, 146, 1, 0, 0, 0, 150, 7, 1, 0, 0, 0, 151, 157, 3, 10, 5, 0, 152, 153, 3, 12, 6, 0, 153, 154, 6, 4, -1, 0, 154, 156, 1, 0, 0, 0, 155, 152, 1, 0, 0, 0, 156,
        159, 1, 0, 0, 0, 157, 155, 1, 0, 0, 0, 157, 158, 1, 0, 0, 0, 158, 160, 1, 0, 0, 0, 159, 157, 1, 0, 0, 0, 160, 161, 6, 4, -1, 0, 161, 9, 1, 0, 0, 0, 162, 163, 5, 96, 0, 0, 163, 164,
        6, 5, -1, 0, 164, 11, 1, 0, 0, 0, 165, 166, 5, 43, 0, 0, 166, 170, 6, 6, -1, 0, 167, 168, 5, 125, 0, 0, 168, 170, 6, 6, -1, 0, 169, 165, 1, 0, 0, 0, 169, 167, 1, 0, 0, 0, 170, 13, 1,
        0, 0, 0, 171, 172, 5, 97, 0, 0, 172, 173, 6, 7, -1, 0, 173, 15, 1, 0, 0, 0, 174, 175, 5, 6, 0, 0, 175, 176, 6, 8, -1, 0, 176, 17, 1, 0, 0, 0, 177, 178, 3, 14, 7, 0, 178, 179, 6, 9,
        -1, 0, 179, 187, 1, 0, 0, 0, 180, 181, 3, 12, 6, 0, 181, 182, 6, 9, -1, 0, 182, 187, 1, 0, 0, 0, 183, 184, 3, 16, 8, 0, 184, 185, 6, 9, -1, 0, 185, 187, 1, 0, 0, 0, 186, 177, 1, 0,
        0, 0, 186, 180, 1, 0, 0, 0, 186, 183, 1, 0, 0, 0, 187, 19, 1, 0, 0, 0, 188, 189, 5, 59, 0, 0, 189, 190, 5, 60, 0, 0, 190, 235, 6, 10, -1, 0, 191, 192, 5, 59, 0, 0, 192, 193, 3, 22,
        11, 0, 193, 203, 6, 10, -1, 0, 194, 197, 5, 51, 0, 0, 195, 197, 3, 90, 45, 0, 196, 194, 1, 0, 0, 0, 196, 195, 1, 0, 0, 0, 197, 198, 1, 0, 0, 0, 198, 199, 3, 22, 11, 0, 199, 200, 6,
        10, -1, 0, 200, 202, 1, 0, 0, 0, 201, 196, 1, 0, 0, 0, 202, 205, 1, 0, 0, 0, 203, 201, 1, 0, 0, 0, 203, 204, 1, 0, 0, 0, 204, 207, 1, 0, 0, 0, 205, 203, 1, 0, 0, 0, 206, 208, 3, 90,
        45, 0, 207, 206, 1, 0, 0, 0, 207, 208, 1, 0, 0, 0, 208, 209, 1, 0, 0, 0, 209, 210, 5, 60, 0, 0, 210, 235, 1, 0, 0, 0, 211, 212, 5, 61, 0, 0, 212, 213, 5, 62, 0, 0, 213, 235, 6, 10,
        -1, 0, 214, 215, 5, 61, 0, 0, 215, 216, 3, 22, 11, 0, 216, 226, 6, 10, -1, 0, 217, 220, 5, 51, 0, 0, 218, 220, 3, 90, 45, 0, 219, 217, 1, 0, 0, 0, 219, 218, 1, 0, 0, 0, 220, 221, 1,
        0, 0, 0, 221, 222, 3, 22, 11, 0, 222, 223, 6, 10, -1, 0, 223, 225, 1, 0, 0, 0, 224, 219, 1, 0, 0, 0, 225, 228, 1, 0, 0, 0, 226, 224, 1, 0, 0, 0, 226, 227, 1, 0, 0, 0, 227, 230, 1, 0,
        0, 0, 228, 226, 1, 0, 0, 0, 229, 231, 3, 90, 45, 0, 230, 229, 1, 0, 0, 0, 230, 231, 1, 0, 0, 0, 231, 232, 1, 0, 0, 0, 232, 233, 5, 62, 0, 0, 233, 235, 1, 0, 0, 0, 234, 188, 1, 0, 0,
        0, 234, 191, 1, 0, 0, 0, 234, 211, 1, 0, 0, 0, 234, 214, 1, 0, 0, 0, 235, 21, 1, 0, 0, 0, 236, 237, 7, 0, 0, 0, 237, 256, 6, 11, -1, 0, 238, 240, 7, 0, 0, 0, 239, 238, 1, 0, 0, 0,
        239, 240, 1, 0, 0, 0, 240, 241, 1, 0, 0, 0, 241, 242, 3, 34, 17, 0, 242, 249, 6, 11, -1, 0, 243, 244, 7, 0, 0, 0, 244, 245, 3, 34, 17, 0, 245, 246, 6, 11, -1, 0, 246, 248, 1, 0, 0,
        0, 247, 243, 1, 0, 0, 0, 248, 251, 1, 0, 0, 0, 249, 247, 1, 0, 0, 0, 249, 250, 1, 0, 0, 0, 250, 253, 1, 0, 0, 0, 251, 249, 1, 0, 0, 0, 252, 254, 7, 0, 0, 0, 253, 252, 1, 0, 0, 0,
        253, 254, 1, 0, 0, 0, 254, 256, 1, 0, 0, 0, 255, 236, 1, 0, 0, 0, 255, 239, 1, 0, 0, 0, 256, 23, 1, 0, 0, 0, 257, 258, 5, 56, 0, 0, 258, 259, 3, 10, 5, 0, 259, 260, 6, 12, -1, 0,
        260, 25, 1, 0, 0, 0, 261, 262, 5, 56, 0, 0, 262, 263, 3, 70, 35, 0, 263, 264, 3, 46, 23, 0, 264, 265, 6, 13, -1, 0, 265, 27, 1, 0, 0, 0, 266, 267, 3, 10, 5, 0, 267, 268, 6, 14, -1,
        0, 268, 284, 1, 0, 0, 0, 269, 270, 3, 18, 9, 0, 270, 271, 6, 14, -1, 0, 271, 284, 1, 0, 0, 0, 272, 273, 3, 24, 12, 0, 273, 274, 6, 14, -1, 0, 274, 284, 1, 0, 0, 0, 275, 276, 3, 20,
        10, 0, 276, 277, 6, 14, -1, 0, 277, 284, 1, 0, 0, 0, 278, 279, 5, 57, 0, 0, 279, 280, 3, 46, 23, 0, 280, 281, 5, 58, 0, 0, 281, 282, 6, 14, -1, 0, 282, 284, 1, 0, 0, 0, 283, 266, 1,
        0, 0, 0, 283, 269, 1, 0, 0, 0, 283, 272, 1, 0, 0, 0, 283, 275, 1, 0, 0, 0, 283, 278, 1, 0, 0, 0, 284, 29, 1, 0, 0, 0, 285, 286, 5, 50, 0, 0, 286, 287, 6, 15, -1, 0, 287, 31, 1, 0, 0,
        0, 288, 289, 5, 54, 0, 0, 289, 290, 6, 16, -1, 0, 290, 33, 1, 0, 0, 0, 291, 292, 3, 46, 23, 0, 292, 293, 6, 17, -1, 0, 293, 301, 1, 0, 0, 0, 294, 295, 3, 30, 15, 0, 295, 296, 6, 17,
        -1, 0, 296, 301, 1, 0, 0, 0, 297, 298, 3, 32, 16, 0, 298, 299, 6, 17, -1, 0, 299, 301, 1, 0, 0, 0, 300, 291, 1, 0, 0, 0, 300, 294, 1, 0, 0, 0, 300, 297, 1, 0, 0, 0, 301, 35, 1, 0, 0,
        0, 302, 303, 3, 34, 17, 0, 303, 310, 6, 18, -1, 0, 304, 305, 5, 52, 0, 0, 305, 306, 3, 34, 17, 0, 306, 307, 6, 18, -1, 0, 307, 309, 1, 0, 0, 0, 308, 304, 1, 0, 0, 0, 309, 312, 1, 0,
        0, 0, 310, 308, 1, 0, 0, 0, 310, 311, 1, 0, 0, 0, 311, 37, 1, 0, 0, 0, 312, 310, 1, 0, 0, 0, 313, 314, 6, 19, -1, 0, 314, 315, 3, 28, 14, 0, 315, 316, 6, 19, -1, 0, 316, 326, 1, 0,
        0, 0, 317, 318, 7, 1, 0, 0, 318, 319, 3, 38, 19, 4, 319, 320, 6, 19, -1, 0, 320, 326, 1, 0, 0, 0, 321, 322, 7, 2, 0, 0, 322, 323, 3, 38, 19, 3, 323, 324, 6, 19, -1, 0, 324, 326, 1,
        0, 0, 0, 325, 313, 1, 0, 0, 0, 325, 317, 1, 0, 0, 0, 325, 321, 1, 0, 0, 0, 326, 375, 1, 0, 0, 0, 327, 328, 10, 2, 0, 0, 328, 329, 7, 3, 0, 0, 329, 330, 3, 38, 19, 3, 330, 331, 6, 19,
        -1, 0, 331, 374, 1, 0, 0, 0, 332, 333, 10, 1, 0, 0, 333, 334, 7, 4, 0, 0, 334, 335, 3, 38, 19, 2, 335, 336, 6, 19, -1, 0, 336, 374, 1, 0, 0, 0, 337, 338, 10, 11, 0, 0, 338, 339, 7,
        5, 0, 0, 339, 374, 6, 19, -1, 0, 340, 341, 10, 10, 0, 0, 341, 343, 5, 57, 0, 0, 342, 344, 3, 36, 18, 0, 343, 342, 1, 0, 0, 0, 343, 344, 1, 0, 0, 0, 344, 345, 1, 0, 0, 0, 345, 346, 5,
        58, 0, 0, 346, 374, 6, 19, -1, 0, 347, 348, 10, 9, 0, 0, 348, 350, 5, 61, 0, 0, 349, 351, 3, 36, 18, 0, 350, 349, 1, 0, 0, 0, 350, 351, 1, 0, 0, 0, 351, 352, 1, 0, 0, 0, 352, 353, 5,
        62, 0, 0, 353, 374, 6, 19, -1, 0, 354, 355, 10, 8, 0, 0, 355, 356, 7, 6, 0, 0, 356, 374, 6, 19, -1, 0, 357, 358, 10, 7, 0, 0, 358, 359, 5, 53, 0, 0, 359, 360, 5, 96, 0, 0, 360, 374,
        6, 19, -1, 0, 361, 362, 10, 6, 0, 0, 362, 363, 5, 53, 0, 0, 363, 364, 5, 57, 0, 0, 364, 365, 3, 46, 23, 0, 365, 366, 5, 58, 0, 0, 366, 367, 6, 19, -1, 0, 367, 374, 1, 0, 0, 0, 368,
        369, 10, 5, 0, 0, 369, 370, 7, 7, 0, 0, 370, 371, 3, 40, 20, 0, 371, 372, 6, 19, -1, 0, 372, 374, 1, 0, 0, 0, 373, 327, 1, 0, 0, 0, 373, 332, 1, 0, 0, 0, 373, 337, 1, 0, 0, 0, 373,
        340, 1, 0, 0, 0, 373, 347, 1, 0, 0, 0, 373, 354, 1, 0, 0, 0, 373, 357, 1, 0, 0, 0, 373, 361, 1, 0, 0, 0, 373, 368, 1, 0, 0, 0, 374, 377, 1, 0, 0, 0, 375, 373, 1, 0, 0, 0, 375, 376,
        1, 0, 0, 0, 376, 39, 1, 0, 0, 0, 377, 375, 1, 0, 0, 0, 378, 379, 6, 20, -1, 0, 379, 380, 3, 28, 14, 0, 380, 381, 6, 20, -1, 0, 381, 391, 1, 0, 0, 0, 382, 383, 7, 1, 0, 0, 383, 384,
        3, 40, 20, 2, 384, 385, 6, 20, -1, 0, 385, 391, 1, 0, 0, 0, 386, 387, 7, 2, 0, 0, 387, 388, 3, 40, 20, 1, 388, 389, 6, 20, -1, 0, 389, 391, 1, 0, 0, 0, 390, 378, 1, 0, 0, 0, 390,
        382, 1, 0, 0, 0, 390, 386, 1, 0, 0, 0, 391, 422, 1, 0, 0, 0, 392, 393, 10, 7, 0, 0, 393, 394, 7, 5, 0, 0, 394, 421, 6, 20, -1, 0, 395, 396, 10, 6, 0, 0, 396, 398, 5, 57, 0, 0, 397,
        399, 3, 36, 18, 0, 398, 397, 1, 0, 0, 0, 398, 399, 1, 0, 0, 0, 399, 400, 1, 0, 0, 0, 400, 401, 5, 58, 0, 0, 401, 421, 6, 20, -1, 0, 402, 403, 10, 5, 0, 0, 403, 405, 5, 61, 0, 0, 404,
        406, 3, 36, 18, 0, 405, 404, 1, 0, 0, 0, 405, 406, 1, 0, 0, 0, 406, 407, 1, 0, 0, 0, 407, 408, 5, 62, 0, 0, 408, 421, 6, 20, -1, 0, 409, 410, 10, 4, 0, 0, 410, 411, 5, 53, 0, 0, 411,
        412, 5, 96, 0, 0, 412, 421, 6, 20, -1, 0, 413, 414, 10, 3, 0, 0, 414, 415, 5, 53, 0, 0, 415, 416, 5, 57, 0, 0, 416, 417, 3, 46, 23, 0, 417, 418, 5, 58, 0, 0, 418, 419, 6, 20, -1, 0,
        419, 421, 1, 0, 0, 0, 420, 392, 1, 0, 0, 0, 420, 395, 1, 0, 0, 0, 420, 402, 1, 0, 0, 0, 420, 409, 1, 0, 0, 0, 420, 413, 1, 0, 0, 0, 421, 424, 1, 0, 0, 0, 422, 420, 1, 0, 0, 0, 422,
        423, 1, 0, 0, 0, 423, 41, 1, 0, 0, 0, 424, 422, 1, 0, 0, 0, 425, 426, 3, 38, 19, 0, 426, 427, 5, 50, 0, 0, 427, 430, 3, 38, 19, 0, 428, 429, 5, 50, 0, 0, 429, 431, 3, 38, 19, 0, 430,
        428, 1, 0, 0, 0, 430, 431, 1, 0, 0, 0, 431, 432, 1, 0, 0, 0, 432, 433, 6, 21, -1, 0, 433, 43, 1, 0, 0, 0, 434, 435, 6, 22, -1, 0, 435, 436, 3, 38, 19, 0, 436, 437, 6, 22, -1, 0, 437,
        442, 1, 0, 0, 0, 438, 439, 3, 42, 21, 0, 439, 440, 6, 22, -1, 0, 440, 442, 1, 0, 0, 0, 441, 434, 1, 0, 0, 0, 441, 438, 1, 0, 0, 0, 442, 470, 1, 0, 0, 0, 443, 444, 10, 5, 0, 0, 444,
        445, 7, 8, 0, 0, 445, 446, 3, 44, 22, 6, 446, 447, 6, 22, -1, 0, 447, 469, 1, 0, 0, 0, 448, 449, 10, 4, 0, 0, 449, 450, 5, 78, 0, 0, 450, 451, 3, 44, 22, 5, 451, 452, 6, 22, -1, 0,
        452, 469, 1, 0, 0, 0, 453, 454, 10, 3, 0, 0, 454, 455, 5, 79, 0, 0, 455, 456, 3, 44, 22, 4, 456, 457, 6, 22, -1, 0, 457, 469, 1, 0, 0, 0, 458, 459, 10, 2, 0, 0, 459, 460, 5, 76, 0,
        0, 460, 461, 3, 44, 22, 3, 461, 462, 6, 22, -1, 0, 462, 469, 1, 0, 0, 0, 463, 464, 10, 1, 0, 0, 464, 465, 5, 77, 0, 0, 465, 466, 3, 44, 22, 2, 466, 467, 6, 22, -1, 0, 467, 469, 1, 0,
        0, 0, 468, 443, 1, 0, 0, 0, 468, 448, 1, 0, 0, 0, 468, 453, 1, 0, 0, 0, 468, 458, 1, 0, 0, 0, 468, 463, 1, 0, 0, 0, 469, 472, 1, 0, 0, 0, 470, 468, 1, 0, 0, 0, 470, 471, 1, 0, 0, 0,
        471, 45, 1, 0, 0, 0, 472, 470, 1, 0, 0, 0, 473, 474, 3, 44, 22, 0, 474, 475, 6, 23, -1, 0, 475, 485, 1, 0, 0, 0, 476, 477, 3, 44, 22, 0, 477, 478, 7, 9, 0, 0, 478, 479, 3, 46, 23, 0,
        479, 480, 6, 23, -1, 0, 480, 485, 1, 0, 0, 0, 481, 482, 3, 26, 13, 0, 482, 483, 6, 23, -1, 0, 483, 485, 1, 0, 0, 0, 484, 473, 1, 0, 0, 0, 484, 476, 1, 0, 0, 0, 484, 481, 1, 0, 0, 0,
        485, 47, 1, 0, 0, 0, 486, 487, 3, 50, 25, 0, 487, 488, 6, 24, -1, 0, 488, 498, 1, 0, 0, 0, 489, 490, 5, 23, 0, 0, 490, 498, 6, 24, -1, 0, 491, 492, 3, 54, 27, 0, 492, 493, 6, 24, -1,
        0, 493, 498, 1, 0, 0, 0, 494, 495, 3, 76, 38, 0, 495, 496, 6, 24, -1, 0, 496, 498, 1, 0, 0, 0, 497, 486, 1, 0, 0, 0, 497, 489, 1, 0, 0, 0, 497, 491, 1, 0, 0, 0, 497, 494, 1, 0, 0, 0,
        498, 49, 1, 0, 0, 0, 499, 500, 5, 1, 0, 0, 500, 504, 6, 25, -1, 0, 501, 502, 5, 2, 0, 0, 502, 504, 6, 25, -1, 0, 503, 499, 1, 0, 0, 0, 503, 501, 1, 0, 0, 0, 504, 508, 1, 0, 0, 0,
        505, 506, 3, 52, 26, 0, 506, 507, 6, 25, -1, 0, 507, 509, 1, 0, 0, 0, 508, 505, 1, 0, 0, 0, 509, 510, 1, 0, 0, 0, 510, 508, 1, 0, 0, 0, 510, 511, 1, 0, 0, 0, 511, 51, 1, 0, 0, 0,
        512, 513, 3, 10, 5, 0, 513, 514, 6, 26, -1, 0, 514, 521, 1, 0, 0, 0, 515, 516, 3, 10, 5, 0, 516, 517, 5, 49, 0, 0, 517, 518, 3, 46, 23, 0, 518, 519, 6, 26, -1, 0, 519, 521, 1, 0, 0,
        0, 520, 512, 1, 0, 0, 0, 520, 515, 1, 0, 0, 0, 521, 53, 1, 0, 0, 0, 522, 523, 3, 56, 28, 0, 523, 524, 6, 27, -1, 0, 524, 529, 1, 0, 0, 0, 525, 526, 3, 62, 31, 0, 526, 527, 6, 27, -1,
        0, 527, 529, 1, 0, 0, 0, 528, 522, 1, 0, 0, 0, 528, 525, 1, 0, 0, 0, 529, 55, 1, 0, 0, 0, 530, 531, 5, 3, 0, 0, 531, 533, 3, 46, 23, 0, 532, 534, 3, 92, 46, 0, 533, 532, 1, 0, 0, 0,
        533, 534, 1, 0, 0, 0, 534, 536, 1, 0, 0, 0, 535, 537, 3, 4, 2, 0, 536, 535, 1, 0, 0, 0, 536, 537, 1, 0, 0, 0, 537, 538, 1, 0, 0, 0, 538, 544, 6, 28, -1, 0, 539, 540, 3, 58, 29, 0,
        540, 541, 6, 28, -1, 0, 541, 543, 1, 0, 0, 0, 542, 539, 1, 0, 0, 0, 543, 546, 1, 0, 0, 0, 544, 542, 1, 0, 0, 0, 544, 545, 1, 0, 0, 0, 545, 548, 1, 0, 0, 0, 546, 544, 1, 0, 0, 0, 547,
        549, 3, 60, 30, 0, 548, 547, 1, 0, 0, 0, 548, 549, 1, 0, 0, 0, 549, 550, 1, 0, 0, 0, 550, 551, 6, 28, -1, 0, 551, 552, 7, 10, 0, 0, 552, 57, 1, 0, 0, 0, 553, 555, 5, 7, 0, 0, 554,
        556, 3, 92, 46, 0, 555, 554, 1, 0, 0, 0, 555, 556, 1, 0, 0, 0, 556, 557, 1, 0, 0, 0, 557, 559, 3, 46, 23, 0, 558, 560, 3, 92, 46, 0, 559, 558, 1, 0, 0, 0, 559, 560, 1, 0, 0, 0, 560,
        562, 1, 0, 0, 0, 561, 563, 3, 4, 2, 0, 562, 561, 1, 0, 0, 0, 562, 563, 1, 0, 0, 0, 563, 564, 1, 0, 0, 0, 564, 565, 6, 29, -1, 0, 565, 59, 1, 0, 0, 0, 566, 568, 5, 8, 0, 0, 567, 569,
        3, 92, 46, 0, 568, 567, 1, 0, 0, 0, 568, 569, 1, 0, 0, 0, 569, 571, 1, 0, 0, 0, 570, 572, 3, 4, 2, 0, 571, 570, 1, 0, 0, 0, 571, 572, 1, 0, 0, 0, 572, 573, 1, 0, 0, 0, 573, 574, 6,
        30, -1, 0, 574, 61, 1, 0, 0, 0, 575, 576, 5, 9, 0, 0, 576, 578, 3, 46, 23, 0, 577, 579, 3, 92, 46, 0, 578, 577, 1, 0, 0, 0, 578, 579, 1, 0, 0, 0, 579, 581, 1, 0, 0, 0, 580, 582, 3,
        64, 32, 0, 581, 580, 1, 0, 0, 0, 581, 582, 1, 0, 0, 0, 582, 584, 1, 0, 0, 0, 583, 585, 3, 68, 34, 0, 584, 583, 1, 0, 0, 0, 584, 585, 1, 0, 0, 0, 585, 586, 1, 0, 0, 0, 586, 587, 7,
        11, 0, 0, 587, 588, 6, 31, -1, 0, 588, 63, 1, 0, 0, 0, 589, 590, 3, 66, 33, 0, 590, 599, 6, 32, -1, 0, 591, 593, 3, 92, 46, 0, 592, 591, 1, 0, 0, 0, 592, 593, 1, 0, 0, 0, 593, 594,
        1, 0, 0, 0, 594, 595, 3, 66, 33, 0, 595, 596, 6, 32, -1, 0, 596, 598, 1, 0, 0, 0, 597, 592, 1, 0, 0, 0, 598, 601, 1, 0, 0, 0, 599, 597, 1, 0, 0, 0, 599, 600, 1, 0, 0, 0, 600, 603, 1,
        0, 0, 0, 601, 599, 1, 0, 0, 0, 602, 604, 3, 92, 46, 0, 603, 602, 1, 0, 0, 0, 603, 604, 1, 0, 0, 0, 604, 65, 1, 0, 0, 0, 605, 607, 5, 11, 0, 0, 606, 608, 3, 92, 46, 0, 607, 606, 1, 0,
        0, 0, 607, 608, 1, 0, 0, 0, 608, 609, 1, 0, 0, 0, 609, 611, 3, 46, 23, 0, 610, 612, 3, 92, 46, 0, 611, 610, 1, 0, 0, 0, 611, 612, 1, 0, 0, 0, 612, 614, 1, 0, 0, 0, 613, 615, 3, 4, 2,
        0, 614, 613, 1, 0, 0, 0, 614, 615, 1, 0, 0, 0, 615, 616, 1, 0, 0, 0, 616, 617, 6, 33, -1, 0, 617, 67, 1, 0, 0, 0, 618, 620, 5, 12, 0, 0, 619, 621, 3, 92, 46, 0, 620, 619, 1, 0, 0, 0,
        620, 621, 1, 0, 0, 0, 621, 623, 1, 0, 0, 0, 622, 624, 3, 4, 2, 0, 623, 622, 1, 0, 0, 0, 623, 624, 1, 0, 0, 0, 624, 626, 1, 0, 0, 0, 625, 627, 3, 92, 46, 0, 626, 625, 1, 0, 0, 0, 626,
        627, 1, 0, 0, 0, 627, 628, 1, 0, 0, 0, 628, 629, 6, 34, -1, 0, 629, 69, 1, 0, 0, 0, 630, 631, 5, 57, 0, 0, 631, 643, 6, 35, -1, 0, 632, 633, 3, 72, 36, 0, 633, 640, 6, 35, -1, 0,
        634, 635, 5, 52, 0, 0, 635, 636, 3, 72, 36, 0, 636, 637, 6, 35, -1, 0, 637, 639, 1, 0, 0, 0, 638, 634, 1, 0, 0, 0, 639, 642, 1, 0, 0, 0, 640, 638, 1, 0, 0, 0, 640, 641, 1, 0, 0, 0,
        641, 644, 1, 0, 0, 0, 642, 640, 1, 0, 0, 0, 643, 632, 1, 0, 0, 0, 643, 644, 1, 0, 0, 0, 644, 645, 1, 0, 0, 0, 645, 646, 5, 58, 0, 0, 646, 71, 1, 0, 0, 0, 647, 648, 3, 52, 26, 0, 648,
        649, 6, 36, -1, 0, 649, 654, 1, 0, 0, 0, 650, 651, 3, 32, 16, 0, 651, 652, 6, 36, -1, 0, 652, 654, 1, 0, 0, 0, 653, 647, 1, 0, 0, 0, 653, 650, 1, 0, 0, 0, 654, 73, 1, 0, 0, 0, 655,
        656, 3, 10, 5, 0, 656, 657, 6, 37, -1, 0, 657, 675, 1, 0, 0, 0, 658, 659, 5, 59, 0, 0, 659, 671, 6, 37, -1, 0, 660, 661, 3, 10, 5, 0, 661, 668, 6, 37, -1, 0, 662, 663, 5, 52, 0, 0,
        663, 664, 3, 10, 5, 0, 664, 665, 6, 37, -1, 0, 665, 667, 1, 0, 0, 0, 666, 662, 1, 0, 0, 0, 667, 670, 1, 0, 0, 0, 668, 666, 1, 0, 0, 0, 668, 669, 1, 0, 0, 0, 669, 672, 1, 0, 0, 0,
        670, 668, 1, 0, 0, 0, 671, 660, 1, 0, 0, 0, 671, 672, 1, 0, 0, 0, 672, 673, 1, 0, 0, 0, 673, 675, 5, 60, 0, 0, 674, 655, 1, 0, 0, 0, 674, 658, 1, 0, 0, 0, 675, 75, 1, 0, 0, 0, 676,
        680, 5, 24, 0, 0, 677, 678, 3, 74, 37, 0, 678, 679, 5, 49, 0, 0, 679, 681, 1, 0, 0, 0, 680, 677, 1, 0, 0, 0, 680, 681, 1, 0, 0, 0, 681, 682, 1, 0, 0, 0, 682, 684, 3, 10, 5, 0, 683,
        685, 3, 70, 35, 0, 684, 683, 1, 0, 0, 0, 684, 685, 1, 0, 0, 0, 685, 687, 1, 0, 0, 0, 686, 688, 3, 92, 46, 0, 687, 686, 1, 0, 0, 0, 687, 688, 1, 0, 0, 0, 688, 690, 1, 0, 0, 0, 689,
        691, 3, 78, 39, 0, 690, 689, 1, 0, 0, 0, 690, 691, 1, 0, 0, 0, 691, 693, 1, 0, 0, 0, 692, 694, 3, 4, 2, 0, 693, 692, 1, 0, 0, 0, 693, 694, 1, 0, 0, 0, 694, 695, 1, 0, 0, 0, 695, 696,
        7, 12, 0, 0, 696, 697, 6, 38, -1, 0, 697, 77, 1, 0, 0, 0, 698, 699, 3, 80, 40, 0, 699, 708, 6, 39, -1, 0, 700, 702, 3, 92, 46, 0, 701, 700, 1, 0, 0, 0, 701, 702, 1, 0, 0, 0, 702,
        703, 1, 0, 0, 0, 703, 704, 3, 80, 40, 0, 704, 705, 6, 39, -1, 0, 705, 707, 1, 0, 0, 0, 706, 701, 1, 0, 0, 0, 707, 710, 1, 0, 0, 0, 708, 706, 1, 0, 0, 0, 708, 709, 1, 0, 0, 0, 709,
        712, 1, 0, 0, 0, 710, 708, 1, 0, 0, 0, 711, 713, 3, 92, 46, 0, 712, 711, 1, 0, 0, 0, 712, 713, 1, 0, 0, 0, 713, 79, 1, 0, 0, 0, 714, 716, 5, 44, 0, 0, 715, 717, 3, 92, 46, 0, 716,
        715, 1, 0, 0, 0, 716, 717, 1, 0, 0, 0, 717, 724, 1, 0, 0, 0, 718, 719, 5, 57, 0, 0, 719, 720, 3, 10, 5, 0, 720, 722, 5, 58, 0, 0, 721, 723, 3, 92, 46, 0, 722, 721, 1, 0, 0, 0, 722,
        723, 1, 0, 0, 0, 723, 725, 1, 0, 0, 0, 724, 718, 1, 0, 0, 0, 724, 725, 1, 0, 0, 0, 725, 726, 1, 0, 0, 0, 726, 728, 3, 82, 41, 0, 727, 729, 3, 92, 46, 0, 728, 727, 1, 0, 0, 0, 728,
        729, 1, 0, 0, 0, 729, 730, 1, 0, 0, 0, 730, 731, 5, 5, 0, 0, 731, 732, 6, 40, -1, 0, 732, 81, 1, 0, 0, 0, 733, 734, 3, 84, 42, 0, 734, 741, 6, 41, -1, 0, 735, 736, 3, 92, 46, 0, 736,
        737, 3, 84, 42, 0, 737, 738, 6, 41, -1, 0, 738, 740, 1, 0, 0, 0, 739, 735, 1, 0, 0, 0, 740, 743, 1, 0, 0, 0, 741, 739, 1, 0, 0, 0, 741, 742, 1, 0, 0, 0, 742, 83, 1, 0, 0, 0, 743,
        741, 1, 0, 0, 0, 744, 749, 3, 86, 43, 0, 745, 746, 5, 57, 0, 0, 746, 747, 3, 36, 18, 0, 747, 748, 5, 58, 0, 0, 748, 750, 1, 0, 0, 0, 749, 745, 1, 0, 0, 0, 749, 750, 1, 0, 0, 0, 750,
        752, 1, 0, 0, 0, 751, 753, 3, 10, 5, 0, 752, 751, 1, 0, 0, 0, 752, 753, 1, 0, 0, 0, 753, 758, 1, 0, 0, 0, 754, 755, 5, 61, 0, 0, 755, 756, 3, 36, 18, 0, 756, 757, 5, 62, 0, 0, 757,
        759, 1, 0, 0, 0, 758, 754, 1, 0, 0, 0, 758, 759, 1, 0, 0, 0, 759, 762, 1, 0, 0, 0, 760, 761, 5, 49, 0, 0, 761, 763, 3, 46, 23, 0, 762, 760, 1, 0, 0, 0, 762, 763, 1, 0, 0, 0, 763,
        764, 1, 0, 0, 0, 764, 765, 6, 42, -1, 0, 765, 85, 1, 0, 0, 0, 766, 767, 3, 10, 5, 0, 767, 774, 6, 43, -1, 0, 768, 769, 5, 53, 0, 0, 769, 770, 3, 10, 5, 0, 770, 771, 6, 43, -1, 0,
        771, 773, 1, 0, 0, 0, 772, 768, 1, 0, 0, 0, 773, 776, 1, 0, 0, 0, 774, 772, 1, 0, 0, 0, 774, 775, 1, 0, 0, 0, 775, 87, 1, 0, 0, 0, 776, 774, 1, 0, 0, 0, 777, 779, 7, 13, 0, 0, 778,
        777, 1, 0, 0, 0, 779, 780, 1, 0, 0, 0, 780, 778, 1, 0, 0, 0, 780, 781, 1, 0, 0, 0, 781, 89, 1, 0, 0, 0, 782, 784, 5, 100, 0, 0, 783, 782, 1, 0, 0, 0, 784, 785, 1, 0, 0, 0, 785, 783,
        1, 0, 0, 0, 785, 786, 1, 0, 0, 0, 786, 91, 1, 0, 0, 0, 787, 789, 7, 14, 0, 0, 788, 787, 1, 0, 0, 0, 789, 790, 1, 0, 0, 0, 790, 788, 1, 0, 0, 0, 790, 791, 1, 0, 0, 0, 791, 93, 1, 0,
        0, 0, 93, 95, 100, 106, 116, 120, 132, 136, 149, 157, 169, 186, 196, 203, 207, 219, 226, 230, 234, 239, 249, 253, 255, 283, 300, 310, 325, 343, 350, 373, 375, 390, 398, 405, 420,
        422, 430, 441, 468, 470, 484, 497, 503, 510, 520, 528, 533, 536, 544, 548, 555, 559, 562, 568, 571, 578, 581, 584, 592, 599, 603, 607, 611, 614, 620, 623, 626, 640, 643, 653, 668,
        671, 674, 680, 684, 687, 690, 693, 701, 708, 712, 716, 722, 724, 728, 741, 749, 752, 758, 762, 774, 780, 785, 790,
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
    public string__list(): StringContext[] {
        return this.getTypedRuleContexts(StringContext) as StringContext[];
    }
    public string_(i: number): StringContext {
        return this.getTypedRuleContext(StringContext, i) as StringContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_word_list_cmd;
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
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_identifier;
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
    public matrix_row_list(): Matrix_rowContext[] {
        return this.getTypedRuleContexts(Matrix_rowContext) as Matrix_rowContext[];
    }
    public matrix_row(i: number): Matrix_rowContext {
        return this.getTypedRuleContext(Matrix_rowContext, i) as Matrix_rowContext;
    }
    public nl_list(): NlContext[] {
        return this.getTypedRuleContexts(NlContext) as NlContext[];
    }
    public nl(i: number): NlContext {
        return this.getTypedRuleContext(NlContext, i) as NlContext;
    }
    public SEMICOLON_list(): TerminalNode[] {
        return this.getTokens(MathJSLabParser.SEMICOLON);
    }
    public SEMICOLON(i: number): TerminalNode {
        return this.getToken(MathJSLabParser.SEMICOLON, i);
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
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
    }
    public get ruleIndex(): number {
        return MathJSLabParser.RULE_fcn_handle;
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
    public TRANSPOSE(): TerminalNode {
        return this.getToken(MathJSLabParser.TRANSPOSE, 0);
    }
    public HERMITIAN(): TerminalNode {
        return this.getToken(MathJSLabParser.HERMITIAN, 0);
    }
    public DOT(): TerminalNode {
        return this.getToken(MathJSLabParser.DOT, 0);
    }
    public IDENTIFIER(): TerminalNode {
        return this.getToken(MathJSLabParser.IDENTIFIER, 0);
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
    public DOT(): TerminalNode {
        return this.getToken(MathJSLabParser.DOT, 0);
    }
    public IDENTIFIER(): TerminalNode {
        return this.getToken(MathJSLabParser.IDENTIFIER, 0);
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

export class CommandContext extends ParserRuleContext {
    public node: NodeInput;
    constructor(parser?: MathJSLabParser, parent?: ParserRuleContext, invokingState?: number) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public declaration(): DeclarationContext {
        return this.getTypedRuleContext(DeclarationContext, 0) as DeclarationContext;
    }
    public RETURN(): TerminalNode {
        return this.getToken(MathJSLabParser.RETURN, 0);
    }
    public select_command(): Select_commandContext {
        return this.getTypedRuleContext(Select_commandContext, 0) as Select_commandContext;
    }
    public function_(): FunctionContext {
        return this.getTypedRuleContext(FunctionContext, 0) as FunctionContext;
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
    public GLOBAL(): TerminalNode {
        return this.getToken(MathJSLabParser.GLOBAL, 0);
    }
    public PERSISTENT(): TerminalNode {
        return this.getToken(MathJSLabParser.PERSISTENT, 0);
    }
    public declaration_element_list(): Declaration_elementContext[] {
        return this.getTypedRuleContexts(Declaration_elementContext) as Declaration_elementContext[];
    }
    public declaration_element(i: number): Declaration_elementContext {
        return this.getTypedRuleContext(Declaration_elementContext, i) as Declaration_elementContext;
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

export class Return_listContext extends ParserRuleContext {
    public node: NodeExpr;
    public i: number = 0;
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
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
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
    public args_validation_list(): Args_validation_listContext {
        return this.getTypedRuleContext(Args_validation_listContext, 0) as Args_validation_listContext;
    }
    public END(): TerminalNode {
        return this.getToken(MathJSLabParser.END, 0);
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
    public identifier(): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, 0) as IdentifierContext;
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
