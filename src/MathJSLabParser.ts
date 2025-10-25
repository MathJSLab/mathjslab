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

import type { OperatorType, NodeInput, NodeExpr, NodeList, NodeArgumentValidation, NodeArguments, NodeIf, NodeElseIf, NodeElse, StringQuoteCharacter } from './AST';
import { AST } from './AST';

/**
 * # MathJSLabParser
 *
 * A parser that recognizes a language syntax like MATLAB®/Octave written in TypeScript.
 *
 * ## References
 * * [MATLAB Operator Precedence](https://www.mathworks.com/help/matlab/matlab_prog/operator-precedence.html)
 * * [Octave lexer](https://github.com/gnu-octave/octave/blob/default/libinterp/parse-tree/lex.ll)
 * * [Octave parser](https://github.com/gnu-octave/octave/blob/default/libinterp/parse-tree/oct-parse.yy)
 * * [An ANTLR4 grammar for MATLAB files.](https://github.com/antlr/grammars-v4/tree/master/matlab)
 * * [mparser](https://www.mathworks.com/matlabcentral/fileexchange/32769-mparser)
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
    public static readonly RULE_param_list = 31;
    public static readonly RULE_param_list_elt = 32;
    public static readonly RULE_return_list = 33;
    public static readonly RULE_function = 34;
    public static readonly RULE_arguments_block_list = 35;
    public static readonly RULE_arguments_block = 36;
    public static readonly RULE_args_validation_list = 37;
    public static readonly RULE_arg_validation = 38;
    public static readonly RULE_sep_no_nl = 39;
    public static readonly RULE_nl = 40;
    public static readonly RULE_sep = 41;
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
        'param_list',
        'param_list_elt',
        'return_list',
        'function',
        'arguments_block_list',
        'arguments_block',
        'args_validation_list',
        'arg_validation',
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
            this.state = 96;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 2, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 85;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 51 || _la === 52 || _la === 100) {
                            {
                                this.state = 84;
                                this.sep();
                            }
                        }

                        this.state = 87;
                        this.match(MathJSLabParser.EOF);

                        localctx.node = null;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 90;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 51 || _la === 52 || _la === 100) {
                            {
                                this.state = 89;
                                this.sep();
                            }
                        }

                        this.state = 92;
                        this.global_list();
                        this.state = 93;
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
                this.state = 98;
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

                this.state = 106;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 3, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 100;
                                this.sep();
                                this.state = 101;
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
                    this.state = 108;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 3, this._ctx);
                }
                this.state = 110;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 109;
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
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 114;
                this.statement();

                localctx.node = AST.nodeListFirst(localctx.statement(localctx.i++).node);

                this.state = 122;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 5, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 116;
                                this.sep();
                                this.state = 117;
                                this.statement();

                                if (localctx.sep(localctx.i - 1).getText()[0] === ';') {
                                    localctx.node.list[localctx.node.list.length - 1].omitOutput = true;
                                }
                                localctx.node = AST.appendNodeList(localctx.node, localctx.statement(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 124;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 5, this._ctx);
                }
                this.state = 126;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 125;
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
    public statement(): StatementContext {
        let localctx: StatementContext = new StatementContext(this, this._ctx, this.state);
        this.enterRule(localctx, 6, MathJSLabParser.RULE_statement);
        try {
            this.state = 139;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 7, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 130;
                        this.expression();

                        localctx.node = localctx.expression().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 133;
                        this.command();

                        localctx.node = localctx.command().node;
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 136;
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
                this.state = 141;
                this.identifier();
                this.state = 147;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 43 || _la === 125) {
                    {
                        {
                            this.state = 142;
                            this.string_();

                            if (localctx.i === 0) {
                                localctx.node = AST.nodeListFirst(localctx.string_(localctx.i++).node);
                            } else {
                                AST.appendNodeList(localctx.node, localctx.string_(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 149;
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
                this.state = 152;
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
            this.state = 159;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 43:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 155;
                        this.match(MathJSLabParser.STRING);

                        const str = localctx.STRING().getText();
                        // localctx.node = AST.nodeString(str.substring(1, str.length - 1), str.at(0));
                        localctx.node = AST.nodeString(str.substring(1, str.length - 1), str[0] as StringQuoteCharacter);
                    }
                    break;
                case 125:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 157;
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
                this.state = 161;
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
                this.state = 164;
                this.match(MathJSLabParser.ENDRANGE);

                localctx.node = AST.nodeLiteral('ENDRANGE');
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
            this.state = 176;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 97:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 167;
                        this.number_();

                        localctx.node = localctx.number_().node;
                    }
                    break;
                case 43:
                case 125:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 170;
                        this.string_();

                        localctx.node = localctx.string_().node;
                    }
                    break;
                case 6:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 173;
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
            this.state = 224;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 17, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 178;
                        this.match(MathJSLabParser.LBRACKET);
                        this.state = 179;
                        this.match(MathJSLabParser.RBRACKET);

                        localctx.node = AST.emptyArray();
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 181;
                        this.match(MathJSLabParser.LBRACKET);
                        this.state = 182;
                        this.matrix_row();

                        localctx.node = AST.nodeFirstRow(localctx.matrix_row(localctx.i++).node);

                        this.state = 193;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(this._input, 12, this._ctx);
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    {
                                        this.state = 186;
                                        this._errHandler.sync(this);
                                        switch (this._input.LA(1)) {
                                            case 51:
                                                {
                                                    this.state = 184;
                                                    this.match(MathJSLabParser.SEMICOLON);
                                                }
                                                break;
                                            case 100:
                                                {
                                                    this.state = 185;
                                                    this.nl();
                                                }
                                                break;
                                            default:
                                                throw new NoViableAltException(this);
                                        }
                                        this.state = 188;
                                        this.matrix_row();

                                        localctx.node = AST.nodeAppendRow(localctx.node, localctx.matrix_row(localctx.i++).node);
                                    }
                                }
                            }
                            this.state = 195;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(this._input, 12, this._ctx);
                        }
                        this.state = 197;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 100) {
                            {
                                this.state = 196;
                                this.nl();
                            }
                        }

                        this.state = 199;
                        this.match(MathJSLabParser.RBRACKET);
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 201;
                        this.match(MathJSLabParser.LCURLYBR);
                        this.state = 202;
                        this.match(MathJSLabParser.RCURLYBR);

                        localctx.node = AST.emptyArray(true);
                    }
                    break;
                case 4:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 204;
                        this.match(MathJSLabParser.LCURLYBR);
                        this.state = 205;
                        this.matrix_row();

                        localctx.node = AST.nodeFirstRow(localctx.matrix_row(localctx.i++).node, true);

                        this.state = 216;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(this._input, 15, this._ctx);
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    {
                                        this.state = 209;
                                        this._errHandler.sync(this);
                                        switch (this._input.LA(1)) {
                                            case 51:
                                                {
                                                    this.state = 207;
                                                    this.match(MathJSLabParser.SEMICOLON);
                                                }
                                                break;
                                            case 100:
                                                {
                                                    this.state = 208;
                                                    this.nl();
                                                }
                                                break;
                                            default:
                                                throw new NoViableAltException(this);
                                        }
                                        this.state = 211;
                                        this.matrix_row();

                                        localctx.node = AST.nodeAppendRow(localctx.node, localctx.matrix_row(localctx.i++).node);
                                    }
                                }
                            }
                            this.state = 218;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(this._input, 15, this._ctx);
                        }
                        this.state = 220;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 100) {
                            {
                                this.state = 219;
                                this.nl();
                            }
                        }

                        this.state = 222;
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
            this.state = 245;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 21, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 226;
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
                        this.state = 229;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 42 || _la === 52) {
                            {
                                this.state = 228;
                                _la = this._input.LA(1);
                                if (!(_la === 42 || _la === 52)) {
                                    this._errHandler.recoverInline(this);
                                } else {
                                    this._errHandler.reportMatch(this);
                                    this.consume();
                                }
                            }
                        }

                        this.state = 231;
                        this.list_element();

                        localctx.node = AST.nodeListFirst(localctx.list_element(localctx.i++).node);

                        this.state = 239;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(this._input, 19, this._ctx);
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    {
                                        this.state = 233;
                                        _la = this._input.LA(1);
                                        if (!(_la === 42 || _la === 52)) {
                                            this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 234;
                                        this.list_element();

                                        localctx.node = AST.appendNodeList(localctx.node, localctx.list_element(localctx.i++).node);
                                    }
                                }
                            }
                            this.state = 241;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(this._input, 19, this._ctx);
                        }
                        this.state = 243;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 42 || _la === 52) {
                            {
                                this.state = 242;
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
                this.state = 247;
                this.match(MathJSLabParser.COMMAT);
                this.state = 248;
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
                this.state = 251;
                this.match(MathJSLabParser.COMMAT);
                this.state = 252;
                this.param_list();
                this.state = 253;
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
            this.state = 273;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 96:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 256;
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
                        this.state = 259;
                        this.constant();

                        localctx.node = localctx.constant().node;
                    }
                    break;
                case 56:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 262;
                        this.fcn_handle();

                        localctx.node = localctx.fcn_handle().node;
                    }
                    break;
                case 59:
                case 61:
                    this.enterOuterAlt(localctx, 4);
                    {
                        this.state = 265;
                        this.matrix();

                        localctx.node = localctx.matrix().node;
                    }
                    break;
                case 57:
                    this.enterOuterAlt(localctx, 5);
                    {
                        this.state = 268;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 269;
                        this.expression();
                        this.state = 270;
                        this.match(MathJSLabParser.RPAREN);

                        localctx.node = AST.nodeOp('()', localctx.expression().node);
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
                this.state = 275;
                this.match(MathJSLabParser.COLON);

                localctx.node = AST.nodeLiteral(':');
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
                this.state = 278;
                this.match(MathJSLabParser.TILDE);

                localctx.node = AST.nodeLiteral('<~>');
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
            this.state = 290;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 23, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 281;
                        this.expression();

                        localctx.node = localctx.expression().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 284;
                        this.magic_colon();

                        localctx.node = localctx.magic_colon().node;
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 287;
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
                this.state = 292;
                this.list_element();

                localctx.node = AST.nodeListFirst(localctx.list_element(localctx.i++).node);

                this.state = 300;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 52) {
                    {
                        {
                            this.state = 294;
                            this.match(MathJSLabParser.COMMA);
                            this.state = 295;
                            this.list_element();

                            localctx.node = AST.appendNodeList(localctx.node, localctx.list_element(localctx.i++).node);
                        }
                    }
                    this.state = 302;
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
                this.state = 315;
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
                            this.state = 304;
                            this.primary_expr();

                            localctx.node = localctx.primary_expr().node;
                        }
                        break;
                    case 45:
                    case 46:
                    case 89:
                    case 90:
                        {
                            this.state = 307;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 45 || _la === 46 || _la === 89 || _la === 90)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 308;
                            this.oper_expr(4);

                            localctx.node = AST.nodeOp((localctx._op.text + '_') as OperatorType, localctx.oper_expr(0).node);
                        }
                        break;
                    case 54:
                    case 55:
                        {
                            this.state = 311;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 54 || _la === 55)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 312;
                            this.oper_expr(3);

                            localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.oper_expr(0).node);
                        }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 365;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 29, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 363;
                            this._errHandler.sync(this);
                            switch (this._interp.adaptivePredict(this._input, 28, this._ctx)) {
                                case 1:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 317;
                                        if (!this.precpred(this._ctx, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 2)');
                                        }
                                        this.state = 318;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!((((_la - 47) & ~0x1f) === 0 && ((1 << (_la - 47)) & 65539) !== 0) || (((_la - 86) & ~0x1f) === 0 && ((1 << (_la - 86)) & 7) !== 0))) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 319;
                                        this.oper_expr(3);

                                        localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.oper_expr(1).node);
                                    }
                                    break;
                                case 2:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 322;
                                        if (!this.precpred(this._ctx, 1)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 1)');
                                        }
                                        this.state = 323;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 45 || _la === 46)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 324;
                                        this.oper_expr(2);

                                        localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.oper_expr(1).node);
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 327;
                                        if (!this.precpred(this._ctx, 11)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 11)');
                                        }
                                        this.state = 328;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 89 || _la === 90)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }

                                        localctx.node = AST.nodeOp(('_' + localctx._op.text) as OperatorType, localctx.oper_expr(0).node);
                                    }
                                    break;
                                case 4:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 330;
                                        if (!this.precpred(this._ctx, 10)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 10)');
                                        }
                                        this.state = 331;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 333;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 6 ||
                                            (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358541) !== 0) ||
                                            (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                                            _la === 125
                                        ) {
                                            {
                                                this.state = 332;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 335;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndexExpr(localctx.oper_expr(0).node, localctx.arg_list() ? localctx.arg_list().node : null, '()');
                                    }
                                    break;
                                case 5:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 337;
                                        if (!this.precpred(this._ctx, 9)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 9)');
                                        }
                                        this.state = 338;
                                        this.match(MathJSLabParser.LCURLYBR);
                                        this.state = 340;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 6 ||
                                            (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358541) !== 0) ||
                                            (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                                            _la === 125
                                        ) {
                                            {
                                                this.state = 339;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 342;
                                        this.match(MathJSLabParser.RCURLYBR);

                                        localctx.node = AST.nodeIndexExpr(localctx.oper_expr(0).node, localctx.arg_list() ? localctx.arg_list().node : null, '{}');
                                    }
                                    break;
                                case 6:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 344;
                                        if (!this.precpred(this._ctx, 8)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 8)');
                                        }
                                        this.state = 345;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 93 || _la === 94)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }

                                        localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.oper_expr(0).node);
                                    }
                                    break;
                                case 7:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 347;
                                        if (!this.precpred(this._ctx, 7)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 7)');
                                        }
                                        this.state = 348;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 349;
                                        this.match(MathJSLabParser.IDENTIFIER);

                                        localctx.node = AST.nodeIndirectRef(localctx.oper_expr(0).node, localctx.IDENTIFIER().getText());
                                    }
                                    break;
                                case 8:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 351;
                                        if (!this.precpred(this._ctx, 6)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 6)');
                                        }
                                        this.state = 352;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 353;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 354;
                                        this.expression();
                                        this.state = 355;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndirectRef(localctx.oper_expr(0).node, localctx.expression().node);
                                    }
                                    break;
                                case 9:
                                    {
                                        localctx = new Oper_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_oper_expr);
                                        this.state = 358;
                                        if (!this.precpred(this._ctx, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 5)');
                                        }
                                        this.state = 359;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 91 || _la === 92)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 360;
                                        this.power_expr(0);

                                        localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.oper_expr(0).node, localctx.power_expr().node);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 367;
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
                this.state = 380;
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
                            this.state = 369;
                            this.primary_expr();

                            localctx.node = localctx.primary_expr().node;
                        }
                        break;
                    case 45:
                    case 46:
                    case 89:
                    case 90:
                        {
                            this.state = 372;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 45 || _la === 46 || _la === 89 || _la === 90)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 373;
                            this.power_expr(2);

                            localctx.node = AST.nodeOp((localctx._op.text + '_') as OperatorType, localctx.power_expr().node);
                        }
                        break;
                    case 54:
                    case 55:
                        {
                            this.state = 376;
                            localctx._op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 54 || _la === 55)) {
                                localctx._op = this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 377;
                            this.power_expr(1);

                            localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.power_expr().node);
                        }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 412;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 34, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 410;
                            this._errHandler.sync(this);
                            switch (this._interp.adaptivePredict(this._input, 33, this._ctx)) {
                                case 1:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 382;
                                        if (!this.precpred(this._ctx, 7)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 7)');
                                        }
                                        this.state = 383;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(_la === 89 || _la === 90)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }

                                        localctx.node = AST.nodeOp(('_' + localctx._op.text) as OperatorType, localctx.power_expr().node);
                                    }
                                    break;
                                case 2:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 385;
                                        if (!this.precpred(this._ctx, 6)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 6)');
                                        }
                                        this.state = 386;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 388;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 6 ||
                                            (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358541) !== 0) ||
                                            (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                                            _la === 125
                                        ) {
                                            {
                                                this.state = 387;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 390;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndexExpr(localctx.power_expr().node, localctx.arg_list() ? localctx.arg_list().node : null, '()');
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 392;
                                        if (!this.precpred(this._ctx, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 5)');
                                        }
                                        this.state = 393;
                                        this.match(MathJSLabParser.LCURLYBR);
                                        this.state = 395;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (
                                            _la === 6 ||
                                            (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358541) !== 0) ||
                                            (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                                            _la === 125
                                        ) {
                                            {
                                                this.state = 394;
                                                this.arg_list();
                                            }
                                        }

                                        this.state = 397;
                                        this.match(MathJSLabParser.RCURLYBR);

                                        localctx.node = AST.nodeIndexExpr(localctx.power_expr().node, localctx.arg_list() ? localctx.arg_list().node : null, '{}');
                                    }
                                    break;
                                case 4:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 399;
                                        if (!this.precpred(this._ctx, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 4)');
                                        }
                                        this.state = 400;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 401;
                                        this.match(MathJSLabParser.IDENTIFIER);

                                        localctx.node = AST.nodeIndirectRef(localctx.power_expr().node, localctx.IDENTIFIER().getText());
                                    }
                                    break;
                                case 5:
                                    {
                                        localctx = new Power_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_power_expr);
                                        this.state = 403;
                                        if (!this.precpred(this._ctx, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 3)');
                                        }
                                        this.state = 404;
                                        this.match(MathJSLabParser.DOT);
                                        this.state = 405;
                                        this.match(MathJSLabParser.LPAREN);
                                        this.state = 406;
                                        this.expression();
                                        this.state = 407;
                                        this.match(MathJSLabParser.RPAREN);

                                        localctx.node = AST.nodeIndirectRef(localctx.power_expr().node, localctx.expression().node);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 414;
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
                this.state = 415;
                this.oper_expr(0);
                this.state = 416;
                this.match(MathJSLabParser.COLON);
                this.state = 417;
                this.oper_expr(0);
                this.state = 420;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 35, this._ctx)) {
                    case 1:
                        {
                            this.state = 418;
                            this.match(MathJSLabParser.COLON);
                            this.state = 419;
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
                this.state = 431;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 36, this._ctx)) {
                    case 1:
                        {
                            this.state = 425;
                            this.oper_expr(0);

                            localctx.node = localctx.oper_expr().node;
                        }
                        break;
                    case 2:
                        {
                            this.state = 428;
                            this.colon_expr();

                            localctx.node = localctx.colon_expr().node;
                        }
                        break;
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 460;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 38, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 458;
                            this._errHandler.sync(this);
                            switch (this._interp.adaptivePredict(this._input, 37, this._ctx)) {
                                case 1:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 433;
                                        if (!this.precpred(this._ctx, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 5)');
                                        }
                                        this.state = 434;
                                        localctx._op = this._input.LT(1);
                                        _la = this._input.LA(1);
                                        if (!(((_la - 80) & ~0x1f) === 0 && ((1 << (_la - 80)) & 63) !== 0)) {
                                            localctx._op = this._errHandler.recoverInline(this);
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 435;
                                        this.simple_expr(6);

                                        localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 2:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 438;
                                        if (!this.precpred(this._ctx, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 4)');
                                        }
                                        this.state = 439;
                                        localctx._op = this.match(MathJSLabParser.EXPR_AND);
                                        this.state = 440;
                                        this.simple_expr(5);

                                        localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 443;
                                        if (!this.precpred(this._ctx, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 3)');
                                        }
                                        this.state = 444;
                                        localctx._op = this.match(MathJSLabParser.EXPR_OR);
                                        this.state = 445;
                                        this.simple_expr(4);

                                        localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 4:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 448;
                                        if (!this.precpred(this._ctx, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 2)');
                                        }
                                        this.state = 449;
                                        localctx._op = this.match(MathJSLabParser.EXPR_AND_AND);
                                        this.state = 450;
                                        this.simple_expr(3);

                                        localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                                case 5:
                                    {
                                        localctx = new Simple_exprContext(this, _parentctx, _parentState);
                                        this.pushNewRecursionContext(localctx, _startState, MathJSLabParser.RULE_simple_expr);
                                        this.state = 453;
                                        if (!this.precpred(this._ctx, 1)) {
                                            throw this.createFailedPredicateException('this.precpred(this._ctx, 1)');
                                        }
                                        this.state = 454;
                                        localctx._op = this.match(MathJSLabParser.EXPR_OR_OR);
                                        this.state = 455;
                                        this.simple_expr(2);

                                        localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 462;
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
            this.state = 474;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 39, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 463;
                        this.simple_expr(0);

                        localctx.node = localctx.simple_expr().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 466;
                        this.simple_expr(0);
                        this.state = 467;
                        localctx._op = this._input.LT(1);
                        _la = this._input.LA(1);
                        if (!(((_la - 49) & ~0x1f) === 0 && ((1 << (_la - 49)) & 134184961) !== 0)) {
                            localctx._op = this._errHandler.recoverInline(this);
                        } else {
                            this._errHandler.reportMatch(this);
                            this.consume();
                        }
                        this.state = 468;
                        this.expression();

                        localctx.node = AST.nodeOp(localctx._op.text as OperatorType, localctx.simple_expr().node, localctx.expression().node);
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 471;
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
            this.state = 485;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 1:
                case 2:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 476;
                        this.declaration();

                        localctx.node = localctx.declaration().node;
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 479;
                        this.select_command();

                        localctx.node = localctx.select_command().node;
                    }
                    break;
                case 24:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 482;
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
                this.state = 491;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                    case 1:
                        {
                            this.state = 487;
                            this.match(MathJSLabParser.GLOBAL);

                            localctx.node = AST.nodeDeclarationFirst('GLOBAL');
                        }
                        break;
                    case 2:
                        {
                            this.state = 489;
                            this.match(MathJSLabParser.PERSISTENT);

                            localctx.node = AST.nodeDeclarationFirst('PERSIST');
                        }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this.state = 496;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                    {
                        {
                            this.state = 493;
                            this.declaration_element();

                            localctx.node = AST.nodeAppendDeclaration(localctx.node, localctx.declaration_element(localctx.i++));
                        }
                    }
                    this.state = 498;
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
            this.state = 508;
            this._errHandler.sync(this);
            switch (this._interp.adaptivePredict(this._input, 43, this._ctx)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 500;
                        this.identifier();

                        localctx.node = localctx.identifier().node;
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 503;
                        this.identifier();
                        this.state = 504;
                        this.match(MathJSLabParser.EQ);
                        this.state = 505;
                        this.expression();

                        localctx.node = AST.nodeOp('=', localctx.identifier().node, localctx.expression().node);
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
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 510;
                this.if_command();

                localctx.node = localctx.if_command().node;
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
                this.state = 513;
                this.match(MathJSLabParser.IF);
                this.state = 514;
                this.expression();
                this.state = 516;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 515;
                        this.sep();
                    }
                }

                this.state = 519;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 16777294) !== 0) ||
                    (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358413) !== 0) ||
                    (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                    _la === 125
                ) {
                    {
                        this.state = 518;
                        this.list();
                    }
                }

                localctx.node = AST.nodeIfBegin(localctx.expression().node, localctx.list() ? localctx.list().node : AST.nodeListFirst());

                this.state = 527;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 7) {
                    {
                        {
                            this.state = 522;
                            this.elseif_clause();

                            localctx.node = AST.nodeIfAppendElseIf(localctx.node, localctx.elseif_clause(localctx.i++).node);
                        }
                    }
                    this.state = 529;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
                this.state = 531;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 8) {
                    {
                        this.state = 530;
                        this.else_clause();
                    }
                }

                if (localctx.else_clause()) {
                    localctx.node = AST.nodeIfAppendElse(localctx.node, localctx.else_clause().node);
                }

                this.state = 534;
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
                this.state = 536;
                this.match(MathJSLabParser.ELSEIF);
                this.state = 538;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 537;
                        this.sep();
                    }
                }

                this.state = 540;
                this.expression();
                this.state = 542;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 541;
                        this.sep();
                    }
                }

                this.state = 545;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 16777294) !== 0) ||
                    (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358413) !== 0) ||
                    (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                    _la === 125
                ) {
                    {
                        this.state = 544;
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
                this.state = 549;
                this.match(MathJSLabParser.ELSE);
                this.state = 551;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 550;
                        this.sep();
                    }
                }

                this.state = 554;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 16777294) !== 0) ||
                    (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358413) !== 0) ||
                    (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                    _la === 125
                ) {
                    {
                        this.state = 553;
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
    public param_list(): Param_listContext {
        let localctx: Param_listContext = new Param_listContext(this, this._ctx, this.state);
        this.enterRule(localctx, 62, MathJSLabParser.RULE_param_list);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 558;
                this.match(MathJSLabParser.LPAREN);

                localctx.node = AST.nodeListFirst();

                this.state = 571;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 54 || _la === 96) {
                    {
                        this.state = 560;
                        this.param_list_elt();

                        localctx.node = AST.appendNodeList(localctx.node, localctx.param_list_elt(localctx.i++).node);

                        this.state = 568;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        while (_la === 52) {
                            {
                                {
                                    this.state = 562;
                                    this.match(MathJSLabParser.COMMA);
                                    this.state = 563;
                                    this.param_list_elt();

                                    localctx.node = AST.appendNodeList(localctx.node, localctx.param_list_elt(localctx.i++).node);
                                }
                            }
                            this.state = 570;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                        }
                    }
                }

                this.state = 573;
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
        this.enterRule(localctx, 64, MathJSLabParser.RULE_param_list_elt);
        try {
            this.state = 581;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 96:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 575;
                        this.declaration_element();

                        localctx.node = localctx.declaration_element().node;
                    }
                    break;
                case 54:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 578;
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
        this.enterRule(localctx, 66, MathJSLabParser.RULE_return_list);
        let _la: number;
        try {
            this.state = 602;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 96:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 583;
                        this.identifier();

                        localctx.node = AST.nodeListFirst(localctx.identifier(0).node);
                    }
                    break;
                case 59:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 586;
                        this.match(MathJSLabParser.LBRACKET);

                        localctx.node = AST.nodeListFirst();

                        this.state = 599;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        if (_la === 96) {
                            {
                                this.state = 588;
                                this.identifier();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.identifier(localctx.i++).node);

                                this.state = 596;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                while (_la === 52) {
                                    {
                                        {
                                            this.state = 590;
                                            this.match(MathJSLabParser.COMMA);
                                            this.state = 591;
                                            this.identifier();

                                            localctx.node = AST.appendNodeList(localctx.node, localctx.identifier(localctx.i++).node);
                                        }
                                    }
                                    this.state = 598;
                                    this._errHandler.sync(this);
                                    _la = this._input.LA(1);
                                }
                            }
                        }

                        this.state = 601;
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
        this.enterRule(localctx, 68, MathJSLabParser.RULE_function);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 604;
                this.match(MathJSLabParser.FUNCTION);
                this.state = 608;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 59, this._ctx)) {
                    case 1:
                        {
                            this.state = 605;
                            this.return_list();
                            this.state = 606;
                            this.match(MathJSLabParser.EQ);
                        }
                        break;
                }
                this.state = 610;
                this.identifier();
                this.state = 612;
                this._errHandler.sync(this);
                switch (this._interp.adaptivePredict(this._input, 60, this._ctx)) {
                    case 1:
                        {
                            this.state = 611;
                            this.param_list();
                        }
                        break;
                }
                this.state = 615;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 614;
                        this.sep();
                    }
                }

                this.state = 618;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 44) {
                    {
                        this.state = 617;
                        this.arguments_block_list();
                    }
                }

                this.state = 621;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 16777294) !== 0) ||
                    (((_la - 43) & ~0x1f) === 0 && ((1 << (_la - 43)) & 358413) !== 0) ||
                    (((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 387) !== 0) ||
                    _la === 125
                ) {
                    {
                        this.state = 620;
                        this.list();
                    }
                }

                this.state = 623;
                _la = this._input.LA(1);
                if (!(((_la - -1) & ~0x1f) === 0 && ((1 << (_la - -1)) & 67108929) !== 0)) {
                    this._errHandler.recoverInline(this);
                } else {
                    this._errHandler.reportMatch(this);
                    this.consume();
                }

                localctx.node = AST.nodeFunction(
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
        this.enterRule(localctx, 70, MathJSLabParser.RULE_arguments_block_list);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 626;
                this.arguments_block();

                localctx.node = AST.nodeListFirst(localctx.arguments_block(localctx.i++).node);

                this.state = 636;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 65, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 629;
                                this._errHandler.sync(this);
                                _la = this._input.LA(1);
                                if (_la === 51 || _la === 52 || _la === 100) {
                                    {
                                        this.state = 628;
                                        this.sep();
                                    }
                                }

                                this.state = 631;
                                this.arguments_block();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.arguments_block(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 638;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 65, this._ctx);
                }
                this.state = 640;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 639;
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
        this.enterRule(localctx, 72, MathJSLabParser.RULE_arguments_block);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 642;
                this.match(MathJSLabParser.ARGUMENTS);
                this.state = 644;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 643;
                        this.sep();
                    }
                }

                this.state = 650;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 57) {
                    {
                        this.state = 646;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 647;
                        this.identifier();
                        this.state = 648;
                        this.match(MathJSLabParser.RPAREN);
                    }
                }

                this.state = 652;
                this.args_validation_list();
                this.state = 654;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 51 || _la === 52 || _la === 100) {
                    {
                        this.state = 653;
                        this.sep();
                    }
                }

                this.state = 656;
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
        this.enterRule(localctx, 74, MathJSLabParser.RULE_args_validation_list);
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 659;
                this.arg_validation();

                localctx.node = AST.nodeListFirst(localctx.arg_validation(localctx.i++).node);

                this.state = 667;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 70, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 661;
                                this.sep();
                                this.state = 662;
                                this.arg_validation();

                                localctx.node = AST.appendNodeList(localctx.node, localctx.arg_validation(localctx.i++).node);
                            }
                        }
                    }
                    this.state = 669;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(this._input, 70, this._ctx);
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
        this.enterRule(localctx, 76, MathJSLabParser.RULE_arg_validation);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 670;
                this.identifier();
                this.state = 675;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 57) {
                    {
                        this.state = 671;
                        this.match(MathJSLabParser.LPAREN);
                        this.state = 672;
                        this.arg_list();
                        this.state = 673;
                        this.match(MathJSLabParser.RPAREN);
                    }
                }

                this.state = 678;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 96) {
                    {
                        this.state = 677;
                        this.identifier();
                    }
                }

                this.state = 684;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 61) {
                    {
                        this.state = 680;
                        this.match(MathJSLabParser.LCURLYBR);
                        this.state = 681;
                        this.arg_list();
                        this.state = 682;
                        this.match(MathJSLabParser.RCURLYBR);
                    }
                }

                this.state = 688;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === 49) {
                    {
                        this.state = 686;
                        this.match(MathJSLabParser.EQ);
                        this.state = 687;
                        this.expression();
                    }
                }

                localctx.node = AST.nodeArgumentValidation(
                    localctx.identifier(0).node,
                    localctx.LPAREN() ? localctx.arg_list(0).node : AST.nodeListFirst(),
                    localctx.identifier(1) ? localctx.identifier(1).node : AST.nodeListFirst(),
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
    public sep_no_nl(): Sep_no_nlContext {
        let localctx: Sep_no_nlContext = new Sep_no_nlContext(this, this._ctx, this.state);
        this.enterRule(localctx, 78, MathJSLabParser.RULE_sep_no_nl);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 693;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                    {
                        {
                            this.state = 692;
                            _la = this._input.LA(1);
                            if (!(_la === 51 || _la === 52)) {
                                this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                        }
                    }
                    this.state = 695;
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
        this.enterRule(localctx, 80, MathJSLabParser.RULE_nl);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 698;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                    {
                        {
                            this.state = 697;
                            this.match(MathJSLabParser.NEWLINE);
                        }
                    }
                    this.state = 700;
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
        this.enterRule(localctx, 82, MathJSLabParser.RULE_sep);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 703;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                    {
                        {
                            this.state = 702;
                            _la = this._input.LA(1);
                            if (!(_la === 51 || _la === 52 || _la === 100)) {
                                this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                        }
                    }
                    this.state = 705;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                } while (_la === 51 || _la === 52 || _la === 100);
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
        4, 1, 125, 708, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2,
        13, 7, 13, 2, 14, 7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20, 7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7, 23, 2, 24, 7, 24, 2, 25, 7, 25, 2,
        26, 7, 26, 2, 27, 7, 27, 2, 28, 7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7, 31, 2, 32, 7, 32, 2, 33, 7, 33, 2, 34, 7, 34, 2, 35, 7, 35, 2, 36, 7, 36, 2, 37, 7, 37, 2, 38, 7, 38, 2,
        39, 7, 39, 2, 40, 7, 40, 2, 41, 7, 41, 1, 0, 3, 0, 86, 8, 0, 1, 0, 1, 0, 1, 0, 3, 0, 91, 8, 0, 1, 0, 1, 0, 1, 0, 1, 0, 3, 0, 97, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 105,
        8, 1, 10, 1, 12, 1, 108, 9, 1, 1, 1, 3, 1, 111, 8, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 5, 2, 121, 8, 2, 10, 2, 12, 2, 124, 9, 2, 1, 2, 3, 2, 127, 8, 2, 1, 2, 1, 2, 1,
        3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 3, 3, 140, 8, 3, 1, 4, 1, 4, 1, 4, 1, 4, 5, 4, 146, 8, 4, 10, 4, 12, 4, 149, 9, 4, 1, 4, 1, 4, 1, 5, 1, 5, 1, 5, 1, 6, 1, 6, 1, 6,
        1, 6, 3, 6, 160, 8, 6, 1, 7, 1, 7, 1, 7, 1, 8, 1, 8, 1, 8, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 3, 9, 177, 8, 9, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1,
        10, 3, 10, 187, 8, 10, 1, 10, 1, 10, 1, 10, 5, 10, 192, 8, 10, 10, 10, 12, 10, 195, 9, 10, 1, 10, 3, 10, 198, 8, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1,
        10, 3, 10, 210, 8, 10, 1, 10, 1, 10, 1, 10, 5, 10, 215, 8, 10, 10, 10, 12, 10, 218, 9, 10, 1, 10, 3, 10, 221, 8, 10, 1, 10, 1, 10, 3, 10, 225, 8, 10, 1, 11, 1, 11, 1, 11, 3, 11, 230,
        8, 11, 1, 11, 1, 11, 1, 11, 1, 11, 1, 11, 1, 11, 5, 11, 238, 8, 11, 10, 11, 12, 11, 241, 9, 11, 1, 11, 3, 11, 244, 8, 11, 3, 11, 246, 8, 11, 1, 12, 1, 12, 1, 12, 1, 12, 1, 13, 1, 13,
        1, 13, 1, 13, 1, 13, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 1, 14, 3, 14, 274, 8, 14, 1, 15, 1, 15, 1, 15, 1,
        16, 1, 16, 1, 16, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 3, 17, 291, 8, 17, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 5, 18, 299, 8, 18, 10, 18, 12, 18, 302,
        9, 18, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 3, 19, 316, 8, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1,
        19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 3, 19, 334, 8, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 3, 19, 341, 8, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19,
        1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 5, 19, 364, 8, 19, 10, 19, 12, 19, 367, 9, 19, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1,
        20, 1, 20, 1, 20, 1, 20, 3, 20, 381, 8, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 3, 20, 389, 8, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 3, 20, 396, 8, 20, 1, 20, 1, 20, 1, 20, 1,
        20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 5, 20, 411, 8, 20, 10, 20, 12, 20, 414, 9, 20, 1, 21, 1, 21, 1, 21, 1, 21, 1, 21, 3, 21, 421, 8, 21, 1, 21, 1, 21,
        1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 3, 22, 432, 8, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1,
        22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 5, 22, 459, 8, 22, 10, 22, 12, 22, 462, 9, 22, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1,
        23, 3, 23, 475, 8, 23, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 3, 24, 486, 8, 24, 1, 25, 1, 25, 1, 25, 1, 25, 3, 25, 492, 8, 25, 1, 25, 1, 25, 1, 25, 4, 25,
        497, 8, 25, 11, 25, 12, 25, 498, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 3, 26, 509, 8, 26, 1, 27, 1, 27, 1, 27, 1, 28, 1, 28, 1, 28, 3, 28, 517, 8, 28, 1, 28, 3, 28,
        520, 8, 28, 1, 28, 1, 28, 1, 28, 1, 28, 5, 28, 526, 8, 28, 10, 28, 12, 28, 529, 9, 28, 1, 28, 3, 28, 532, 8, 28, 1, 28, 1, 28, 1, 28, 1, 29, 1, 29, 3, 29, 539, 8, 29, 1, 29, 1, 29,
        3, 29, 543, 8, 29, 1, 29, 3, 29, 546, 8, 29, 1, 29, 1, 29, 1, 30, 1, 30, 3, 30, 552, 8, 30, 1, 30, 3, 30, 555, 8, 30, 1, 30, 1, 30, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31,
        1, 31, 5, 31, 567, 8, 31, 10, 31, 12, 31, 570, 9, 31, 3, 31, 572, 8, 31, 1, 31, 1, 31, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 582, 8, 32, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33,
        1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 5, 33, 595, 8, 33, 10, 33, 12, 33, 598, 9, 33, 3, 33, 600, 8, 33, 1, 33, 3, 33, 603, 8, 33, 1, 34, 1, 34, 1, 34, 1, 34, 3, 34, 609, 8, 34,
        1, 34, 1, 34, 3, 34, 613, 8, 34, 1, 34, 3, 34, 616, 8, 34, 1, 34, 3, 34, 619, 8, 34, 1, 34, 3, 34, 622, 8, 34, 1, 34, 1, 34, 1, 34, 1, 35, 1, 35, 1, 35, 3, 35, 630, 8, 35, 1, 35, 1,
        35, 1, 35, 5, 35, 635, 8, 35, 10, 35, 12, 35, 638, 9, 35, 1, 35, 3, 35, 641, 8, 35, 1, 36, 1, 36, 3, 36, 645, 8, 36, 1, 36, 1, 36, 1, 36, 1, 36, 3, 36, 651, 8, 36, 1, 36, 1, 36, 3,
        36, 655, 8, 36, 1, 36, 1, 36, 1, 36, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 5, 37, 666, 8, 37, 10, 37, 12, 37, 669, 9, 37, 1, 38, 1, 38, 1, 38, 1, 38, 1, 38, 3, 38, 676, 8, 38, 1,
        38, 3, 38, 679, 8, 38, 1, 38, 1, 38, 1, 38, 1, 38, 3, 38, 685, 8, 38, 1, 38, 1, 38, 3, 38, 689, 8, 38, 1, 38, 1, 38, 1, 39, 4, 39, 694, 8, 39, 11, 39, 12, 39, 695, 1, 40, 4, 40, 699,
        8, 40, 11, 40, 12, 40, 700, 1, 41, 4, 41, 704, 8, 41, 11, 41, 12, 41, 705, 1, 41, 0, 3, 38, 40, 44, 42, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40,
        42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 0, 14, 2, 0, 42, 42, 52, 52, 2, 0, 45, 46, 89, 90, 1, 0, 54, 55, 3, 0, 47, 48, 63, 63, 86, 88, 1,
        0, 45, 46, 1, 0, 89, 90, 1, 0, 93, 94, 1, 0, 91, 92, 1, 0, 80, 85, 2, 0, 49, 49, 64, 75, 1, 0, 4, 5, 2, 1, 5, 5, 25, 25, 1, 0, 51, 52, 2, 0, 51, 52, 100, 100, 768, 0, 96, 1, 0, 0, 0,
        2, 98, 1, 0, 0, 0, 4, 114, 1, 0, 0, 0, 6, 139, 1, 0, 0, 0, 8, 141, 1, 0, 0, 0, 10, 152, 1, 0, 0, 0, 12, 159, 1, 0, 0, 0, 14, 161, 1, 0, 0, 0, 16, 164, 1, 0, 0, 0, 18, 176, 1, 0, 0,
        0, 20, 224, 1, 0, 0, 0, 22, 245, 1, 0, 0, 0, 24, 247, 1, 0, 0, 0, 26, 251, 1, 0, 0, 0, 28, 273, 1, 0, 0, 0, 30, 275, 1, 0, 0, 0, 32, 278, 1, 0, 0, 0, 34, 290, 1, 0, 0, 0, 36, 292, 1,
        0, 0, 0, 38, 315, 1, 0, 0, 0, 40, 380, 1, 0, 0, 0, 42, 415, 1, 0, 0, 0, 44, 431, 1, 0, 0, 0, 46, 474, 1, 0, 0, 0, 48, 485, 1, 0, 0, 0, 50, 491, 1, 0, 0, 0, 52, 508, 1, 0, 0, 0, 54,
        510, 1, 0, 0, 0, 56, 513, 1, 0, 0, 0, 58, 536, 1, 0, 0, 0, 60, 549, 1, 0, 0, 0, 62, 558, 1, 0, 0, 0, 64, 581, 1, 0, 0, 0, 66, 602, 1, 0, 0, 0, 68, 604, 1, 0, 0, 0, 70, 626, 1, 0, 0,
        0, 72, 642, 1, 0, 0, 0, 74, 659, 1, 0, 0, 0, 76, 670, 1, 0, 0, 0, 78, 693, 1, 0, 0, 0, 80, 698, 1, 0, 0, 0, 82, 703, 1, 0, 0, 0, 84, 86, 3, 82, 41, 0, 85, 84, 1, 0, 0, 0, 85, 86, 1,
        0, 0, 0, 86, 87, 1, 0, 0, 0, 87, 88, 5, 0, 0, 1, 88, 97, 6, 0, -1, 0, 89, 91, 3, 82, 41, 0, 90, 89, 1, 0, 0, 0, 90, 91, 1, 0, 0, 0, 91, 92, 1, 0, 0, 0, 92, 93, 3, 2, 1, 0, 93, 94, 5,
        0, 0, 1, 94, 95, 6, 0, -1, 0, 95, 97, 1, 0, 0, 0, 96, 85, 1, 0, 0, 0, 96, 90, 1, 0, 0, 0, 97, 1, 1, 0, 0, 0, 98, 99, 3, 6, 3, 0, 99, 106, 6, 1, -1, 0, 100, 101, 3, 82, 41, 0, 101,
        102, 3, 6, 3, 0, 102, 103, 6, 1, -1, 0, 103, 105, 1, 0, 0, 0, 104, 100, 1, 0, 0, 0, 105, 108, 1, 0, 0, 0, 106, 104, 1, 0, 0, 0, 106, 107, 1, 0, 0, 0, 107, 110, 1, 0, 0, 0, 108, 106,
        1, 0, 0, 0, 109, 111, 3, 82, 41, 0, 110, 109, 1, 0, 0, 0, 110, 111, 1, 0, 0, 0, 111, 112, 1, 0, 0, 0, 112, 113, 6, 1, -1, 0, 113, 3, 1, 0, 0, 0, 114, 115, 3, 6, 3, 0, 115, 122, 6, 2,
        -1, 0, 116, 117, 3, 82, 41, 0, 117, 118, 3, 6, 3, 0, 118, 119, 6, 2, -1, 0, 119, 121, 1, 0, 0, 0, 120, 116, 1, 0, 0, 0, 121, 124, 1, 0, 0, 0, 122, 120, 1, 0, 0, 0, 122, 123, 1, 0, 0,
        0, 123, 126, 1, 0, 0, 0, 124, 122, 1, 0, 0, 0, 125, 127, 3, 82, 41, 0, 126, 125, 1, 0, 0, 0, 126, 127, 1, 0, 0, 0, 127, 128, 1, 0, 0, 0, 128, 129, 6, 2, -1, 0, 129, 5, 1, 0, 0, 0,
        130, 131, 3, 46, 23, 0, 131, 132, 6, 3, -1, 0, 132, 140, 1, 0, 0, 0, 133, 134, 3, 48, 24, 0, 134, 135, 6, 3, -1, 0, 135, 140, 1, 0, 0, 0, 136, 137, 3, 8, 4, 0, 137, 138, 6, 3, -1, 0,
        138, 140, 1, 0, 0, 0, 139, 130, 1, 0, 0, 0, 139, 133, 1, 0, 0, 0, 139, 136, 1, 0, 0, 0, 140, 7, 1, 0, 0, 0, 141, 147, 3, 10, 5, 0, 142, 143, 3, 12, 6, 0, 143, 144, 6, 4, -1, 0, 144,
        146, 1, 0, 0, 0, 145, 142, 1, 0, 0, 0, 146, 149, 1, 0, 0, 0, 147, 145, 1, 0, 0, 0, 147, 148, 1, 0, 0, 0, 148, 150, 1, 0, 0, 0, 149, 147, 1, 0, 0, 0, 150, 151, 6, 4, -1, 0, 151, 9, 1,
        0, 0, 0, 152, 153, 5, 96, 0, 0, 153, 154, 6, 5, -1, 0, 154, 11, 1, 0, 0, 0, 155, 156, 5, 43, 0, 0, 156, 160, 6, 6, -1, 0, 157, 158, 5, 125, 0, 0, 158, 160, 6, 6, -1, 0, 159, 155, 1,
        0, 0, 0, 159, 157, 1, 0, 0, 0, 160, 13, 1, 0, 0, 0, 161, 162, 5, 97, 0, 0, 162, 163, 6, 7, -1, 0, 163, 15, 1, 0, 0, 0, 164, 165, 5, 6, 0, 0, 165, 166, 6, 8, -1, 0, 166, 17, 1, 0, 0,
        0, 167, 168, 3, 14, 7, 0, 168, 169, 6, 9, -1, 0, 169, 177, 1, 0, 0, 0, 170, 171, 3, 12, 6, 0, 171, 172, 6, 9, -1, 0, 172, 177, 1, 0, 0, 0, 173, 174, 3, 16, 8, 0, 174, 175, 6, 9, -1,
        0, 175, 177, 1, 0, 0, 0, 176, 167, 1, 0, 0, 0, 176, 170, 1, 0, 0, 0, 176, 173, 1, 0, 0, 0, 177, 19, 1, 0, 0, 0, 178, 179, 5, 59, 0, 0, 179, 180, 5, 60, 0, 0, 180, 225, 6, 10, -1, 0,
        181, 182, 5, 59, 0, 0, 182, 183, 3, 22, 11, 0, 183, 193, 6, 10, -1, 0, 184, 187, 5, 51, 0, 0, 185, 187, 3, 80, 40, 0, 186, 184, 1, 0, 0, 0, 186, 185, 1, 0, 0, 0, 187, 188, 1, 0, 0,
        0, 188, 189, 3, 22, 11, 0, 189, 190, 6, 10, -1, 0, 190, 192, 1, 0, 0, 0, 191, 186, 1, 0, 0, 0, 192, 195, 1, 0, 0, 0, 193, 191, 1, 0, 0, 0, 193, 194, 1, 0, 0, 0, 194, 197, 1, 0, 0, 0,
        195, 193, 1, 0, 0, 0, 196, 198, 3, 80, 40, 0, 197, 196, 1, 0, 0, 0, 197, 198, 1, 0, 0, 0, 198, 199, 1, 0, 0, 0, 199, 200, 5, 60, 0, 0, 200, 225, 1, 0, 0, 0, 201, 202, 5, 61, 0, 0,
        202, 203, 5, 62, 0, 0, 203, 225, 6, 10, -1, 0, 204, 205, 5, 61, 0, 0, 205, 206, 3, 22, 11, 0, 206, 216, 6, 10, -1, 0, 207, 210, 5, 51, 0, 0, 208, 210, 3, 80, 40, 0, 209, 207, 1, 0,
        0, 0, 209, 208, 1, 0, 0, 0, 210, 211, 1, 0, 0, 0, 211, 212, 3, 22, 11, 0, 212, 213, 6, 10, -1, 0, 213, 215, 1, 0, 0, 0, 214, 209, 1, 0, 0, 0, 215, 218, 1, 0, 0, 0, 216, 214, 1, 0, 0,
        0, 216, 217, 1, 0, 0, 0, 217, 220, 1, 0, 0, 0, 218, 216, 1, 0, 0, 0, 219, 221, 3, 80, 40, 0, 220, 219, 1, 0, 0, 0, 220, 221, 1, 0, 0, 0, 221, 222, 1, 0, 0, 0, 222, 223, 5, 62, 0, 0,
        223, 225, 1, 0, 0, 0, 224, 178, 1, 0, 0, 0, 224, 181, 1, 0, 0, 0, 224, 201, 1, 0, 0, 0, 224, 204, 1, 0, 0, 0, 225, 21, 1, 0, 0, 0, 226, 227, 7, 0, 0, 0, 227, 246, 6, 11, -1, 0, 228,
        230, 7, 0, 0, 0, 229, 228, 1, 0, 0, 0, 229, 230, 1, 0, 0, 0, 230, 231, 1, 0, 0, 0, 231, 232, 3, 34, 17, 0, 232, 239, 6, 11, -1, 0, 233, 234, 7, 0, 0, 0, 234, 235, 3, 34, 17, 0, 235,
        236, 6, 11, -1, 0, 236, 238, 1, 0, 0, 0, 237, 233, 1, 0, 0, 0, 238, 241, 1, 0, 0, 0, 239, 237, 1, 0, 0, 0, 239, 240, 1, 0, 0, 0, 240, 243, 1, 0, 0, 0, 241, 239, 1, 0, 0, 0, 242, 244,
        7, 0, 0, 0, 243, 242, 1, 0, 0, 0, 243, 244, 1, 0, 0, 0, 244, 246, 1, 0, 0, 0, 245, 226, 1, 0, 0, 0, 245, 229, 1, 0, 0, 0, 246, 23, 1, 0, 0, 0, 247, 248, 5, 56, 0, 0, 248, 249, 3, 10,
        5, 0, 249, 250, 6, 12, -1, 0, 250, 25, 1, 0, 0, 0, 251, 252, 5, 56, 0, 0, 252, 253, 3, 62, 31, 0, 253, 254, 3, 46, 23, 0, 254, 255, 6, 13, -1, 0, 255, 27, 1, 0, 0, 0, 256, 257, 3,
        10, 5, 0, 257, 258, 6, 14, -1, 0, 258, 274, 1, 0, 0, 0, 259, 260, 3, 18, 9, 0, 260, 261, 6, 14, -1, 0, 261, 274, 1, 0, 0, 0, 262, 263, 3, 24, 12, 0, 263, 264, 6, 14, -1, 0, 264, 274,
        1, 0, 0, 0, 265, 266, 3, 20, 10, 0, 266, 267, 6, 14, -1, 0, 267, 274, 1, 0, 0, 0, 268, 269, 5, 57, 0, 0, 269, 270, 3, 46, 23, 0, 270, 271, 5, 58, 0, 0, 271, 272, 6, 14, -1, 0, 272,
        274, 1, 0, 0, 0, 273, 256, 1, 0, 0, 0, 273, 259, 1, 0, 0, 0, 273, 262, 1, 0, 0, 0, 273, 265, 1, 0, 0, 0, 273, 268, 1, 0, 0, 0, 274, 29, 1, 0, 0, 0, 275, 276, 5, 50, 0, 0, 276, 277,
        6, 15, -1, 0, 277, 31, 1, 0, 0, 0, 278, 279, 5, 54, 0, 0, 279, 280, 6, 16, -1, 0, 280, 33, 1, 0, 0, 0, 281, 282, 3, 46, 23, 0, 282, 283, 6, 17, -1, 0, 283, 291, 1, 0, 0, 0, 284, 285,
        3, 30, 15, 0, 285, 286, 6, 17, -1, 0, 286, 291, 1, 0, 0, 0, 287, 288, 3, 32, 16, 0, 288, 289, 6, 17, -1, 0, 289, 291, 1, 0, 0, 0, 290, 281, 1, 0, 0, 0, 290, 284, 1, 0, 0, 0, 290,
        287, 1, 0, 0, 0, 291, 35, 1, 0, 0, 0, 292, 293, 3, 34, 17, 0, 293, 300, 6, 18, -1, 0, 294, 295, 5, 52, 0, 0, 295, 296, 3, 34, 17, 0, 296, 297, 6, 18, -1, 0, 297, 299, 1, 0, 0, 0,
        298, 294, 1, 0, 0, 0, 299, 302, 1, 0, 0, 0, 300, 298, 1, 0, 0, 0, 300, 301, 1, 0, 0, 0, 301, 37, 1, 0, 0, 0, 302, 300, 1, 0, 0, 0, 303, 304, 6, 19, -1, 0, 304, 305, 3, 28, 14, 0,
        305, 306, 6, 19, -1, 0, 306, 316, 1, 0, 0, 0, 307, 308, 7, 1, 0, 0, 308, 309, 3, 38, 19, 4, 309, 310, 6, 19, -1, 0, 310, 316, 1, 0, 0, 0, 311, 312, 7, 2, 0, 0, 312, 313, 3, 38, 19,
        3, 313, 314, 6, 19, -1, 0, 314, 316, 1, 0, 0, 0, 315, 303, 1, 0, 0, 0, 315, 307, 1, 0, 0, 0, 315, 311, 1, 0, 0, 0, 316, 365, 1, 0, 0, 0, 317, 318, 10, 2, 0, 0, 318, 319, 7, 3, 0, 0,
        319, 320, 3, 38, 19, 3, 320, 321, 6, 19, -1, 0, 321, 364, 1, 0, 0, 0, 322, 323, 10, 1, 0, 0, 323, 324, 7, 4, 0, 0, 324, 325, 3, 38, 19, 2, 325, 326, 6, 19, -1, 0, 326, 364, 1, 0, 0,
        0, 327, 328, 10, 11, 0, 0, 328, 329, 7, 5, 0, 0, 329, 364, 6, 19, -1, 0, 330, 331, 10, 10, 0, 0, 331, 333, 5, 57, 0, 0, 332, 334, 3, 36, 18, 0, 333, 332, 1, 0, 0, 0, 333, 334, 1, 0,
        0, 0, 334, 335, 1, 0, 0, 0, 335, 336, 5, 58, 0, 0, 336, 364, 6, 19, -1, 0, 337, 338, 10, 9, 0, 0, 338, 340, 5, 61, 0, 0, 339, 341, 3, 36, 18, 0, 340, 339, 1, 0, 0, 0, 340, 341, 1, 0,
        0, 0, 341, 342, 1, 0, 0, 0, 342, 343, 5, 62, 0, 0, 343, 364, 6, 19, -1, 0, 344, 345, 10, 8, 0, 0, 345, 346, 7, 6, 0, 0, 346, 364, 6, 19, -1, 0, 347, 348, 10, 7, 0, 0, 348, 349, 5,
        53, 0, 0, 349, 350, 5, 96, 0, 0, 350, 364, 6, 19, -1, 0, 351, 352, 10, 6, 0, 0, 352, 353, 5, 53, 0, 0, 353, 354, 5, 57, 0, 0, 354, 355, 3, 46, 23, 0, 355, 356, 5, 58, 0, 0, 356, 357,
        6, 19, -1, 0, 357, 364, 1, 0, 0, 0, 358, 359, 10, 5, 0, 0, 359, 360, 7, 7, 0, 0, 360, 361, 3, 40, 20, 0, 361, 362, 6, 19, -1, 0, 362, 364, 1, 0, 0, 0, 363, 317, 1, 0, 0, 0, 363, 322,
        1, 0, 0, 0, 363, 327, 1, 0, 0, 0, 363, 330, 1, 0, 0, 0, 363, 337, 1, 0, 0, 0, 363, 344, 1, 0, 0, 0, 363, 347, 1, 0, 0, 0, 363, 351, 1, 0, 0, 0, 363, 358, 1, 0, 0, 0, 364, 367, 1, 0,
        0, 0, 365, 363, 1, 0, 0, 0, 365, 366, 1, 0, 0, 0, 366, 39, 1, 0, 0, 0, 367, 365, 1, 0, 0, 0, 368, 369, 6, 20, -1, 0, 369, 370, 3, 28, 14, 0, 370, 371, 6, 20, -1, 0, 371, 381, 1, 0,
        0, 0, 372, 373, 7, 1, 0, 0, 373, 374, 3, 40, 20, 2, 374, 375, 6, 20, -1, 0, 375, 381, 1, 0, 0, 0, 376, 377, 7, 2, 0, 0, 377, 378, 3, 40, 20, 1, 378, 379, 6, 20, -1, 0, 379, 381, 1,
        0, 0, 0, 380, 368, 1, 0, 0, 0, 380, 372, 1, 0, 0, 0, 380, 376, 1, 0, 0, 0, 381, 412, 1, 0, 0, 0, 382, 383, 10, 7, 0, 0, 383, 384, 7, 5, 0, 0, 384, 411, 6, 20, -1, 0, 385, 386, 10, 6,
        0, 0, 386, 388, 5, 57, 0, 0, 387, 389, 3, 36, 18, 0, 388, 387, 1, 0, 0, 0, 388, 389, 1, 0, 0, 0, 389, 390, 1, 0, 0, 0, 390, 391, 5, 58, 0, 0, 391, 411, 6, 20, -1, 0, 392, 393, 10, 5,
        0, 0, 393, 395, 5, 61, 0, 0, 394, 396, 3, 36, 18, 0, 395, 394, 1, 0, 0, 0, 395, 396, 1, 0, 0, 0, 396, 397, 1, 0, 0, 0, 397, 398, 5, 62, 0, 0, 398, 411, 6, 20, -1, 0, 399, 400, 10, 4,
        0, 0, 400, 401, 5, 53, 0, 0, 401, 402, 5, 96, 0, 0, 402, 411, 6, 20, -1, 0, 403, 404, 10, 3, 0, 0, 404, 405, 5, 53, 0, 0, 405, 406, 5, 57, 0, 0, 406, 407, 3, 46, 23, 0, 407, 408, 5,
        58, 0, 0, 408, 409, 6, 20, -1, 0, 409, 411, 1, 0, 0, 0, 410, 382, 1, 0, 0, 0, 410, 385, 1, 0, 0, 0, 410, 392, 1, 0, 0, 0, 410, 399, 1, 0, 0, 0, 410, 403, 1, 0, 0, 0, 411, 414, 1, 0,
        0, 0, 412, 410, 1, 0, 0, 0, 412, 413, 1, 0, 0, 0, 413, 41, 1, 0, 0, 0, 414, 412, 1, 0, 0, 0, 415, 416, 3, 38, 19, 0, 416, 417, 5, 50, 0, 0, 417, 420, 3, 38, 19, 0, 418, 419, 5, 50,
        0, 0, 419, 421, 3, 38, 19, 0, 420, 418, 1, 0, 0, 0, 420, 421, 1, 0, 0, 0, 421, 422, 1, 0, 0, 0, 422, 423, 6, 21, -1, 0, 423, 43, 1, 0, 0, 0, 424, 425, 6, 22, -1, 0, 425, 426, 3, 38,
        19, 0, 426, 427, 6, 22, -1, 0, 427, 432, 1, 0, 0, 0, 428, 429, 3, 42, 21, 0, 429, 430, 6, 22, -1, 0, 430, 432, 1, 0, 0, 0, 431, 424, 1, 0, 0, 0, 431, 428, 1, 0, 0, 0, 432, 460, 1, 0,
        0, 0, 433, 434, 10, 5, 0, 0, 434, 435, 7, 8, 0, 0, 435, 436, 3, 44, 22, 6, 436, 437, 6, 22, -1, 0, 437, 459, 1, 0, 0, 0, 438, 439, 10, 4, 0, 0, 439, 440, 5, 78, 0, 0, 440, 441, 3,
        44, 22, 5, 441, 442, 6, 22, -1, 0, 442, 459, 1, 0, 0, 0, 443, 444, 10, 3, 0, 0, 444, 445, 5, 79, 0, 0, 445, 446, 3, 44, 22, 4, 446, 447, 6, 22, -1, 0, 447, 459, 1, 0, 0, 0, 448, 449,
        10, 2, 0, 0, 449, 450, 5, 76, 0, 0, 450, 451, 3, 44, 22, 3, 451, 452, 6, 22, -1, 0, 452, 459, 1, 0, 0, 0, 453, 454, 10, 1, 0, 0, 454, 455, 5, 77, 0, 0, 455, 456, 3, 44, 22, 2, 456,
        457, 6, 22, -1, 0, 457, 459, 1, 0, 0, 0, 458, 433, 1, 0, 0, 0, 458, 438, 1, 0, 0, 0, 458, 443, 1, 0, 0, 0, 458, 448, 1, 0, 0, 0, 458, 453, 1, 0, 0, 0, 459, 462, 1, 0, 0, 0, 460, 458,
        1, 0, 0, 0, 460, 461, 1, 0, 0, 0, 461, 45, 1, 0, 0, 0, 462, 460, 1, 0, 0, 0, 463, 464, 3, 44, 22, 0, 464, 465, 6, 23, -1, 0, 465, 475, 1, 0, 0, 0, 466, 467, 3, 44, 22, 0, 467, 468,
        7, 9, 0, 0, 468, 469, 3, 46, 23, 0, 469, 470, 6, 23, -1, 0, 470, 475, 1, 0, 0, 0, 471, 472, 3, 26, 13, 0, 472, 473, 6, 23, -1, 0, 473, 475, 1, 0, 0, 0, 474, 463, 1, 0, 0, 0, 474,
        466, 1, 0, 0, 0, 474, 471, 1, 0, 0, 0, 475, 47, 1, 0, 0, 0, 476, 477, 3, 50, 25, 0, 477, 478, 6, 24, -1, 0, 478, 486, 1, 0, 0, 0, 479, 480, 3, 54, 27, 0, 480, 481, 6, 24, -1, 0, 481,
        486, 1, 0, 0, 0, 482, 483, 3, 68, 34, 0, 483, 484, 6, 24, -1, 0, 484, 486, 1, 0, 0, 0, 485, 476, 1, 0, 0, 0, 485, 479, 1, 0, 0, 0, 485, 482, 1, 0, 0, 0, 486, 49, 1, 0, 0, 0, 487,
        488, 5, 1, 0, 0, 488, 492, 6, 25, -1, 0, 489, 490, 5, 2, 0, 0, 490, 492, 6, 25, -1, 0, 491, 487, 1, 0, 0, 0, 491, 489, 1, 0, 0, 0, 492, 496, 1, 0, 0, 0, 493, 494, 3, 52, 26, 0, 494,
        495, 6, 25, -1, 0, 495, 497, 1, 0, 0, 0, 496, 493, 1, 0, 0, 0, 497, 498, 1, 0, 0, 0, 498, 496, 1, 0, 0, 0, 498, 499, 1, 0, 0, 0, 499, 51, 1, 0, 0, 0, 500, 501, 3, 10, 5, 0, 501, 502,
        6, 26, -1, 0, 502, 509, 1, 0, 0, 0, 503, 504, 3, 10, 5, 0, 504, 505, 5, 49, 0, 0, 505, 506, 3, 46, 23, 0, 506, 507, 6, 26, -1, 0, 507, 509, 1, 0, 0, 0, 508, 500, 1, 0, 0, 0, 508,
        503, 1, 0, 0, 0, 509, 53, 1, 0, 0, 0, 510, 511, 3, 56, 28, 0, 511, 512, 6, 27, -1, 0, 512, 55, 1, 0, 0, 0, 513, 514, 5, 3, 0, 0, 514, 516, 3, 46, 23, 0, 515, 517, 3, 82, 41, 0, 516,
        515, 1, 0, 0, 0, 516, 517, 1, 0, 0, 0, 517, 519, 1, 0, 0, 0, 518, 520, 3, 4, 2, 0, 519, 518, 1, 0, 0, 0, 519, 520, 1, 0, 0, 0, 520, 521, 1, 0, 0, 0, 521, 527, 6, 28, -1, 0, 522, 523,
        3, 58, 29, 0, 523, 524, 6, 28, -1, 0, 524, 526, 1, 0, 0, 0, 525, 522, 1, 0, 0, 0, 526, 529, 1, 0, 0, 0, 527, 525, 1, 0, 0, 0, 527, 528, 1, 0, 0, 0, 528, 531, 1, 0, 0, 0, 529, 527, 1,
        0, 0, 0, 530, 532, 3, 60, 30, 0, 531, 530, 1, 0, 0, 0, 531, 532, 1, 0, 0, 0, 532, 533, 1, 0, 0, 0, 533, 534, 6, 28, -1, 0, 534, 535, 7, 10, 0, 0, 535, 57, 1, 0, 0, 0, 536, 538, 5, 7,
        0, 0, 537, 539, 3, 82, 41, 0, 538, 537, 1, 0, 0, 0, 538, 539, 1, 0, 0, 0, 539, 540, 1, 0, 0, 0, 540, 542, 3, 46, 23, 0, 541, 543, 3, 82, 41, 0, 542, 541, 1, 0, 0, 0, 542, 543, 1, 0,
        0, 0, 543, 545, 1, 0, 0, 0, 544, 546, 3, 4, 2, 0, 545, 544, 1, 0, 0, 0, 545, 546, 1, 0, 0, 0, 546, 547, 1, 0, 0, 0, 547, 548, 6, 29, -1, 0, 548, 59, 1, 0, 0, 0, 549, 551, 5, 8, 0, 0,
        550, 552, 3, 82, 41, 0, 551, 550, 1, 0, 0, 0, 551, 552, 1, 0, 0, 0, 552, 554, 1, 0, 0, 0, 553, 555, 3, 4, 2, 0, 554, 553, 1, 0, 0, 0, 554, 555, 1, 0, 0, 0, 555, 556, 1, 0, 0, 0, 556,
        557, 6, 30, -1, 0, 557, 61, 1, 0, 0, 0, 558, 559, 5, 57, 0, 0, 559, 571, 6, 31, -1, 0, 560, 561, 3, 64, 32, 0, 561, 568, 6, 31, -1, 0, 562, 563, 5, 52, 0, 0, 563, 564, 3, 64, 32, 0,
        564, 565, 6, 31, -1, 0, 565, 567, 1, 0, 0, 0, 566, 562, 1, 0, 0, 0, 567, 570, 1, 0, 0, 0, 568, 566, 1, 0, 0, 0, 568, 569, 1, 0, 0, 0, 569, 572, 1, 0, 0, 0, 570, 568, 1, 0, 0, 0, 571,
        560, 1, 0, 0, 0, 571, 572, 1, 0, 0, 0, 572, 573, 1, 0, 0, 0, 573, 574, 5, 58, 0, 0, 574, 63, 1, 0, 0, 0, 575, 576, 3, 52, 26, 0, 576, 577, 6, 32, -1, 0, 577, 582, 1, 0, 0, 0, 578,
        579, 3, 32, 16, 0, 579, 580, 6, 32, -1, 0, 580, 582, 1, 0, 0, 0, 581, 575, 1, 0, 0, 0, 581, 578, 1, 0, 0, 0, 582, 65, 1, 0, 0, 0, 583, 584, 3, 10, 5, 0, 584, 585, 6, 33, -1, 0, 585,
        603, 1, 0, 0, 0, 586, 587, 5, 59, 0, 0, 587, 599, 6, 33, -1, 0, 588, 589, 3, 10, 5, 0, 589, 596, 6, 33, -1, 0, 590, 591, 5, 52, 0, 0, 591, 592, 3, 10, 5, 0, 592, 593, 6, 33, -1, 0,
        593, 595, 1, 0, 0, 0, 594, 590, 1, 0, 0, 0, 595, 598, 1, 0, 0, 0, 596, 594, 1, 0, 0, 0, 596, 597, 1, 0, 0, 0, 597, 600, 1, 0, 0, 0, 598, 596, 1, 0, 0, 0, 599, 588, 1, 0, 0, 0, 599,
        600, 1, 0, 0, 0, 600, 601, 1, 0, 0, 0, 601, 603, 5, 60, 0, 0, 602, 583, 1, 0, 0, 0, 602, 586, 1, 0, 0, 0, 603, 67, 1, 0, 0, 0, 604, 608, 5, 24, 0, 0, 605, 606, 3, 66, 33, 0, 606,
        607, 5, 49, 0, 0, 607, 609, 1, 0, 0, 0, 608, 605, 1, 0, 0, 0, 608, 609, 1, 0, 0, 0, 609, 610, 1, 0, 0, 0, 610, 612, 3, 10, 5, 0, 611, 613, 3, 62, 31, 0, 612, 611, 1, 0, 0, 0, 612,
        613, 1, 0, 0, 0, 613, 615, 1, 0, 0, 0, 614, 616, 3, 82, 41, 0, 615, 614, 1, 0, 0, 0, 615, 616, 1, 0, 0, 0, 616, 618, 1, 0, 0, 0, 617, 619, 3, 70, 35, 0, 618, 617, 1, 0, 0, 0, 618,
        619, 1, 0, 0, 0, 619, 621, 1, 0, 0, 0, 620, 622, 3, 4, 2, 0, 621, 620, 1, 0, 0, 0, 621, 622, 1, 0, 0, 0, 622, 623, 1, 0, 0, 0, 623, 624, 7, 11, 0, 0, 624, 625, 6, 34, -1, 0, 625, 69,
        1, 0, 0, 0, 626, 627, 3, 72, 36, 0, 627, 636, 6, 35, -1, 0, 628, 630, 3, 82, 41, 0, 629, 628, 1, 0, 0, 0, 629, 630, 1, 0, 0, 0, 630, 631, 1, 0, 0, 0, 631, 632, 3, 72, 36, 0, 632,
        633, 6, 35, -1, 0, 633, 635, 1, 0, 0, 0, 634, 629, 1, 0, 0, 0, 635, 638, 1, 0, 0, 0, 636, 634, 1, 0, 0, 0, 636, 637, 1, 0, 0, 0, 637, 640, 1, 0, 0, 0, 638, 636, 1, 0, 0, 0, 639, 641,
        3, 82, 41, 0, 640, 639, 1, 0, 0, 0, 640, 641, 1, 0, 0, 0, 641, 71, 1, 0, 0, 0, 642, 644, 5, 44, 0, 0, 643, 645, 3, 82, 41, 0, 644, 643, 1, 0, 0, 0, 644, 645, 1, 0, 0, 0, 645, 650, 1,
        0, 0, 0, 646, 647, 5, 57, 0, 0, 647, 648, 3, 10, 5, 0, 648, 649, 5, 58, 0, 0, 649, 651, 1, 0, 0, 0, 650, 646, 1, 0, 0, 0, 650, 651, 1, 0, 0, 0, 651, 652, 1, 0, 0, 0, 652, 654, 3, 74,
        37, 0, 653, 655, 3, 82, 41, 0, 654, 653, 1, 0, 0, 0, 654, 655, 1, 0, 0, 0, 655, 656, 1, 0, 0, 0, 656, 657, 5, 5, 0, 0, 657, 658, 6, 36, -1, 0, 658, 73, 1, 0, 0, 0, 659, 660, 3, 76,
        38, 0, 660, 667, 6, 37, -1, 0, 661, 662, 3, 82, 41, 0, 662, 663, 3, 76, 38, 0, 663, 664, 6, 37, -1, 0, 664, 666, 1, 0, 0, 0, 665, 661, 1, 0, 0, 0, 666, 669, 1, 0, 0, 0, 667, 665, 1,
        0, 0, 0, 667, 668, 1, 0, 0, 0, 668, 75, 1, 0, 0, 0, 669, 667, 1, 0, 0, 0, 670, 675, 3, 10, 5, 0, 671, 672, 5, 57, 0, 0, 672, 673, 3, 36, 18, 0, 673, 674, 5, 58, 0, 0, 674, 676, 1, 0,
        0, 0, 675, 671, 1, 0, 0, 0, 675, 676, 1, 0, 0, 0, 676, 678, 1, 0, 0, 0, 677, 679, 3, 10, 5, 0, 678, 677, 1, 0, 0, 0, 678, 679, 1, 0, 0, 0, 679, 684, 1, 0, 0, 0, 680, 681, 5, 61, 0,
        0, 681, 682, 3, 36, 18, 0, 682, 683, 5, 62, 0, 0, 683, 685, 1, 0, 0, 0, 684, 680, 1, 0, 0, 0, 684, 685, 1, 0, 0, 0, 685, 688, 1, 0, 0, 0, 686, 687, 5, 49, 0, 0, 687, 689, 3, 46, 23,
        0, 688, 686, 1, 0, 0, 0, 688, 689, 1, 0, 0, 0, 689, 690, 1, 0, 0, 0, 690, 691, 6, 38, -1, 0, 691, 77, 1, 0, 0, 0, 692, 694, 7, 12, 0, 0, 693, 692, 1, 0, 0, 0, 694, 695, 1, 0, 0, 0,
        695, 693, 1, 0, 0, 0, 695, 696, 1, 0, 0, 0, 696, 79, 1, 0, 0, 0, 697, 699, 5, 100, 0, 0, 698, 697, 1, 0, 0, 0, 699, 700, 1, 0, 0, 0, 700, 698, 1, 0, 0, 0, 700, 701, 1, 0, 0, 0, 701,
        81, 1, 0, 0, 0, 702, 704, 7, 13, 0, 0, 703, 702, 1, 0, 0, 0, 704, 705, 1, 0, 0, 0, 705, 703, 1, 0, 0, 0, 705, 706, 1, 0, 0, 0, 706, 83, 1, 0, 0, 0, 78, 85, 90, 96, 106, 110, 122,
        126, 139, 147, 159, 176, 186, 193, 197, 209, 216, 220, 224, 229, 239, 243, 245, 273, 290, 300, 315, 333, 340, 363, 365, 380, 388, 395, 410, 412, 420, 431, 458, 460, 474, 485, 491,
        498, 508, 516, 519, 527, 531, 538, 542, 545, 551, 554, 568, 571, 581, 596, 599, 602, 608, 612, 615, 618, 621, 629, 636, 640, 644, 650, 654, 667, 675, 678, 684, 688, 695, 700, 705,
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
    public identifier_list(): IdentifierContext[] {
        return this.getTypedRuleContexts(IdentifierContext) as IdentifierContext[];
    }
    public identifier(i: number): IdentifierContext {
        return this.getTypedRuleContext(IdentifierContext, i) as IdentifierContext;
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
