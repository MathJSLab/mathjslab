// Generated from ./src/MathJSLabLexer.g4 by ANTLR 4.13.2
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols
import { ATN, ATNDeserializer, CharStream, DecisionState, DFA, Lexer, LexerATNSimulator, RuleContext, PredictionContextCache, Token } from 'antlr4';
export default class MathJSLabLexer extends Lexer {
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
    public static readonly EOF = Token.EOF;
    public static readonly SQ_STRING = 1;
    public static readonly DQ_STRING = 2;
    public static readonly BLOCK_COMMENT = 3;
    public static readonly ANY_AS_STRING_UNTIL_END_OF_LINE = 4;

    public static readonly channelNames: string[] = ['DEFAULT_TOKEN_CHANNEL', 'HIDDEN'];
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
    public static readonly modeNames: string[] = ['DEFAULT_MODE', 'SQ_STRING', 'DQ_STRING', 'BLOCK_COMMENT', 'ANY_AS_STRING_UNTIL_END_OF_LINE'];

    public static readonly ruleNames: string[] = [
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
        'CCHAR',
        'NL',
        'SPACE',
        'IDENT',
        'FQIDENT',
        'REAL_NUMBER',
        'INTEGER_NUMBER',
        'INTEGER_DIGITS',
        'DECIMAL_DIGITS',
        'BINARY_DIGITS',
        'OCTAL_DIGITS',
        'HEXADECIMAL_DIGITS',
        'EXPONENT',
    ];

    /**
     * Reserved keywords.
     */
    public static keywordNames: (string | null)[] = [
        null,
        'global',
        'persistent',
        'if',
        'endif',
        'end',
        'elseif',
        'else',
        'switch',
        'endswitch',
        'case',
        'otherwise',
        'while',
        'endwhile',
        'do',
        'until',
        'for',
        'endfor',
        'parfor',
        'endparfor',
        'break',
        'continue',
        'return',
        'function',
        'endfunction',
        'try',
        'catch',
        'end_try_catch',
        'unwind_protect',
        'unwind_protect_cleanup',
        'end_unwind_protect',
        'classdef',
        'endclassdef',
        'enumeration',
        'endenumeration',
        'properties',
        'endproperties',
        'events',
        'endevents',
        'methods',
        'endmethods',
        'arguments',
    ];
    /**
     * Reserved keywords token types.
     */
    public static keywordTypes: number[] = [
        NaN,
        MathJSLabLexer.GLOBAL,
        MathJSLabLexer.PERSISTENT,
        MathJSLabLexer.IF,
        MathJSLabLexer.ENDIF,
        MathJSLabLexer.END,
        MathJSLabLexer.ELSEIF,
        MathJSLabLexer.ELSE,
        MathJSLabLexer.SWITCH,
        MathJSLabLexer.ENDSWITCH,
        MathJSLabLexer.CASE,
        MathJSLabLexer.OTHERWISE,
        MathJSLabLexer.WHILE,
        MathJSLabLexer.ENDWHILE,
        MathJSLabLexer.DO,
        MathJSLabLexer.UNTIL,
        MathJSLabLexer.FOR,
        MathJSLabLexer.ENDFOR,
        MathJSLabLexer.PARFOR,
        MathJSLabLexer.ENDPARFOR,
        MathJSLabLexer.BREAK,
        MathJSLabLexer.CONTINUE,
        MathJSLabLexer.RETURN,
        MathJSLabLexer.FUNCTION,
        MathJSLabLexer.ENDFUNCTION,
        MathJSLabLexer.TRY,
        MathJSLabLexer.CATCH,
        MathJSLabLexer.END_TRY_CATCH,
        MathJSLabLexer.UNWIND_PROTECT,
        MathJSLabLexer.UNWIND_PROTECT_CLEANUP,
        MathJSLabLexer.END_UNWIND_PROTECT,
        MathJSLabLexer.CLASSDEF,
        MathJSLabLexer.ENDCLASSDEF,
        MathJSLabLexer.ENUMERATION,
        MathJSLabLexer.ENDENUMERATION,
        MathJSLabLexer.PROPERTIES,
        MathJSLabLexer.ENDPROPERTIES,
        MathJSLabLexer.EVENTS,
        MathJSLabLexer.ENDEVENTS,
        MathJSLabLexer.METHODS,
        MathJSLabLexer.ENDMETHODS,
        MathJSLabLexer.ARGUMENTS,
    ];
    /**
     * Word-list commands
     */
    public commandNames: string[] = [];
    /**
     * Lexer context.
     */
    public previousTokenType: number = Token.EOF;
    public parenthesisCount: number = 0;
    public matrixContext: number[] = [];
    public quotedString: string = '';

    constructor(input: CharStream) {
        super(input);
        this._interp = new LexerATNSimulator(this, MathJSLabLexer._ATN, MathJSLabLexer.DecisionsToDFA, new PredictionContextCache());
    }

    public get grammarFileName(): string {
        return 'MathJSLabLexer.g4';
    }

    public get literalNames(): (string | null)[] {
        return MathJSLabLexer.literalNames;
    }
    public get symbolicNames(): (string | null)[] {
        return MathJSLabLexer.symbolicNames;
    }
    public get ruleNames(): string[] {
        return MathJSLabLexer.ruleNames;
    }

    public get serializedATN(): number[] {
        return MathJSLabLexer._serializedATN;
    }

    public get channelNames(): string[] {
        return MathJSLabLexer.channelNames;
    }

    public get modeNames(): string[] {
        return MathJSLabLexer.modeNames;
    }

    // @Override
    public action(localctx: RuleContext, ruleIndex: number, actionIndex: number): void {
        switch (ruleIndex) {
            case 0:
                this.PLUS_action(localctx, actionIndex);
                break;
            case 1:
                this.MINUS_action(localctx, actionIndex);
                break;
            case 2:
                this.MUL_action(localctx, actionIndex);
                break;
            case 3:
                this.DIV_action(localctx, actionIndex);
                break;
            case 4:
                this.EQ_action(localctx, actionIndex);
                break;
            case 5:
                this.COLON_action(localctx, actionIndex);
                break;
            case 6:
                this.SEMICOLON_action(localctx, actionIndex);
                break;
            case 7:
                this.COMMA_action(localctx, actionIndex);
                break;
            case 8:
                this.DOT_action(localctx, actionIndex);
                break;
            case 9:
                this.TILDE_action(localctx, actionIndex);
                break;
            case 10:
                this.EXCLAMATION_action(localctx, actionIndex);
                break;
            case 11:
                this.COMMAT_action(localctx, actionIndex);
                break;
            case 12:
                this.LPAREN_action(localctx, actionIndex);
                break;
            case 13:
                this.RPAREN_action(localctx, actionIndex);
                break;
            case 14:
                this.LBRACKET_action(localctx, actionIndex);
                break;
            case 15:
                this.RBRACKET_action(localctx, actionIndex);
                break;
            case 16:
                this.LCURLYBR_action(localctx, actionIndex);
                break;
            case 17:
                this.RCURLYBR_action(localctx, actionIndex);
                break;
            case 18:
                this.LEFTDIV_action(localctx, actionIndex);
                break;
            case 19:
                this.ADD_EQ_action(localctx, actionIndex);
                break;
            case 20:
                this.SUB_EQ_action(localctx, actionIndex);
                break;
            case 21:
                this.MUL_EQ_action(localctx, actionIndex);
                break;
            case 22:
                this.DIV_EQ_action(localctx, actionIndex);
                break;
            case 23:
                this.LEFTDIV_EQ_action(localctx, actionIndex);
                break;
            case 24:
                this.POW_EQ_action(localctx, actionIndex);
                break;
            case 25:
                this.EMUL_EQ_action(localctx, actionIndex);
                break;
            case 26:
                this.EDIV_EQ_action(localctx, actionIndex);
                break;
            case 27:
                this.ELEFTDIV_EQ_action(localctx, actionIndex);
                break;
            case 28:
                this.EPOW_EQ_action(localctx, actionIndex);
                break;
            case 29:
                this.AND_EQ_action(localctx, actionIndex);
                break;
            case 30:
                this.OR_EQ_action(localctx, actionIndex);
                break;
            case 31:
                this.EXPR_AND_AND_action(localctx, actionIndex);
                break;
            case 32:
                this.EXPR_OR_OR_action(localctx, actionIndex);
                break;
            case 33:
                this.EXPR_AND_action(localctx, actionIndex);
                break;
            case 34:
                this.EXPR_OR_action(localctx, actionIndex);
                break;
            case 35:
                this.EXPR_LT_action(localctx, actionIndex);
                break;
            case 36:
                this.EXPR_LE_action(localctx, actionIndex);
                break;
            case 37:
                this.EXPR_EQ_action(localctx, actionIndex);
                break;
            case 38:
                this.EXPR_NE_action(localctx, actionIndex);
                break;
            case 39:
                this.EXPR_GE_action(localctx, actionIndex);
                break;
            case 40:
                this.EXPR_GT_action(localctx, actionIndex);
                break;
            case 41:
                this.EMUL_action(localctx, actionIndex);
                break;
            case 42:
                this.EDIV_action(localctx, actionIndex);
                break;
            case 43:
                this.ELEFTDIV_action(localctx, actionIndex);
                break;
            case 44:
                this.PLUS_PLUS_action(localctx, actionIndex);
                break;
            case 45:
                this.MINUS_MINUS_action(localctx, actionIndex);
                break;
            case 46:
                this.POW_action(localctx, actionIndex);
                break;
            case 47:
                this.EPOW_action(localctx, actionIndex);
                break;
            case 48:
                this.TRANSPOSE_action(localctx, actionIndex);
                break;
            case 49:
                this.HERMITIAN_action(localctx, actionIndex);
                break;
            case 50:
                this.DQSTRING_action(localctx, actionIndex);
                break;
            case 51:
                this.IDENTIFIER_action(localctx, actionIndex);
                break;
            case 52:
                this.FLOAT_NUMBER_action(localctx, actionIndex);
                break;
            case 53:
                this.NUMBER_DOT_OP_action(localctx, actionIndex);
                break;
            case 54:
                this.SPACE_OR_CONTINUATION_action(localctx, actionIndex);
                break;
            case 55:
                this.NEWLINE_action(localctx, actionIndex);
                break;
            case 56:
                this.BLOCK_COMMENT_START_action(localctx, actionIndex);
                break;
            case 57:
                this.COMMENT_LINE_action(localctx, actionIndex);
                break;
            case 59:
                this.SINGLEQ_STRING_action(localctx, actionIndex);
                break;
            case 60:
                this.SINGLEQ_NL_action(localctx, actionIndex);
                break;
            case 61:
                this.SINGLEQ_SINGLEQ_action(localctx, actionIndex);
                break;
            case 62:
                this.SINGLEQ_END_action(localctx, actionIndex);
                break;
            case 63:
                this.DOUBLEQ_STRING_action(localctx, actionIndex);
                break;
            case 64:
                this.DOUBLEQ_NL_action(localctx, actionIndex);
                break;
            case 65:
                this.DOUBLEQ_DOUBLEQ_action(localctx, actionIndex);
                break;
            case 66:
                this.DOUBLEQ_ESCAPE_action(localctx, actionIndex);
                break;
            case 67:
                this.DOUBLEQ_ESCAPE_OTHER_action(localctx, actionIndex);
                break;
            case 68:
                this.DOUBLEQ_ESCAPE_OCT_action(localctx, actionIndex);
                break;
            case 69:
                this.DOUBLEQ_ESCAPE_HEX_action(localctx, actionIndex);
                break;
            case 70:
                this.DOUBLEQ_ESCAPE_UNICODE_action(localctx, actionIndex);
                break;
            case 71:
                this.DOUBLEQ_END_action(localctx, actionIndex);
                break;
            case 72:
                this.BLOCK_COMMENT_START_AGAIN_action(localctx, actionIndex);
                break;
            case 73:
                this.BLOCK_COMMENT_END_action(localctx, actionIndex);
                break;
            case 75:
                this.BLOCK_COMMENT_EOF_action(localctx, actionIndex);
                break;
            case 78:
                this.EXIT_AT_NEWLINE_action(localctx, actionIndex);
                break;
            case 79:
                this.EXIT_AT_EOF_action(localctx, actionIndex);
                break;
            case 80:
                this.UNQUOTED_STRING_action(localctx, actionIndex);
                break;
        }
    }
    private PLUS_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 0:
                this.previousTokenType = MathJSLabLexer.PLUS;
                break;
        }
    }
    private MINUS_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 1:
                this.previousTokenType = MathJSLabLexer.MINUS;
                break;
        }
    }
    private MUL_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 2:
                this.previousTokenType = MathJSLabLexer.MUL;
                break;
        }
    }
    private DIV_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 3:
                this.previousTokenType = MathJSLabLexer.DIV;
                break;
        }
    }
    private EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 4:
                this.previousTokenType = MathJSLabLexer.EQ;
                break;
        }
    }
    private COLON_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 5:
                this.previousTokenType = MathJSLabLexer.COLON;
                break;
        }
    }
    private SEMICOLON_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 6:
                this.previousTokenType = MathJSLabLexer.SEMICOLON;
                break;
        }
    }
    private COMMA_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 7:
                this.previousTokenType = MathJSLabLexer.COMMA;
                break;
        }
    }
    private DOT_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 8:
                this.previousTokenType = MathJSLabLexer.DOT;
                break;
        }
    }
    private TILDE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 9:
                this.previousTokenType = MathJSLabLexer.TILDE;
                break;
        }
    }
    private EXCLAMATION_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 10:
                this.previousTokenType = MathJSLabLexer.EXCLAMATION;
                break;
        }
    }
    private COMMAT_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 11:
                this.previousTokenType = MathJSLabLexer.COMMAT;
                break;
        }
    }
    private LPAREN_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 12:
                if (this.matrixContext.length > 0) {
                    this.matrixContext.push(MathJSLabLexer.LPAREN);
                }
                this.parenthesisCount++;
                this.previousTokenType = MathJSLabLexer.LPAREN;

                break;
        }
    }
    private RPAREN_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 13:
                if (this.matrixContext.length > 0) {
                    this.matrixContext.pop();
                }
                this.parenthesisCount--;
                this.previousTokenType = MathJSLabLexer.RPAREN;

                break;
        }
    }
    private LBRACKET_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 14:
                this.matrixContext.push(MathJSLabLexer.LBRACKET);
                this.previousTokenType = MathJSLabLexer.LBRACKET;

                break;
        }
    }
    private RBRACKET_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 15:
                this.matrixContext.pop();
                this.previousTokenType = MathJSLabLexer.RBRACKET;

                break;
        }
    }
    private LCURLYBR_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 16:
                this.matrixContext.push(MathJSLabLexer.LCURLYBR);
                this.previousTokenType = MathJSLabLexer.LCURLYBR;

                break;
        }
    }
    private RCURLYBR_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 17:
                this.matrixContext.pop();
                this.previousTokenType = MathJSLabLexer.RCURLYBR;

                break;
        }
    }
    private LEFTDIV_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 18:
                this.previousTokenType = MathJSLabLexer.LEFTDIV;
                break;
        }
    }
    private ADD_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 19:
                this.previousTokenType = MathJSLabLexer.ADD_EQ;
                break;
        }
    }
    private SUB_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 20:
                this.previousTokenType = MathJSLabLexer.SUB_EQ;
                break;
        }
    }
    private MUL_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 21:
                this.previousTokenType = MathJSLabLexer.MUL_EQ;
                break;
        }
    }
    private DIV_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 22:
                this.previousTokenType = MathJSLabLexer.DIV_EQ;
                break;
        }
    }
    private LEFTDIV_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 23:
                this.previousTokenType = MathJSLabLexer.LEFTDIV_EQ;
                break;
        }
    }
    private POW_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 24:
                this.previousTokenType = MathJSLabLexer.POW_EQ;
                break;
        }
    }
    private EMUL_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 25:
                this.previousTokenType = MathJSLabLexer.EMUL_EQ;
                break;
        }
    }
    private EDIV_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 26:
                this.previousTokenType = MathJSLabLexer.EDIV_EQ;
                break;
        }
    }
    private ELEFTDIV_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 27:
                this.previousTokenType = MathJSLabLexer.ELEFTDIV_EQ;
                break;
        }
    }
    private EPOW_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 28:
                this.previousTokenType = MathJSLabLexer.EPOW_EQ;
                break;
        }
    }
    private AND_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 29:
                this.previousTokenType = MathJSLabLexer.AND_EQ;
                break;
        }
    }
    private OR_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 30:
                this.previousTokenType = MathJSLabLexer.OR_EQ;
                break;
        }
    }
    private EXPR_AND_AND_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 31:
                this.previousTokenType = MathJSLabLexer.EXPR_AND_AND;
                break;
        }
    }
    private EXPR_OR_OR_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 32:
                this.previousTokenType = MathJSLabLexer.EXPR_OR_OR;
                break;
        }
    }
    private EXPR_AND_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 33:
                this.previousTokenType = MathJSLabLexer.EXPR_AND;
                break;
        }
    }
    private EXPR_OR_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 34:
                this.previousTokenType = MathJSLabLexer.EXPR_OR;
                break;
        }
    }
    private EXPR_LT_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 35:
                this.previousTokenType = MathJSLabLexer.EXPR_LT;
                break;
        }
    }
    private EXPR_LE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 36:
                this.previousTokenType = MathJSLabLexer.EXPR_LE;
                break;
        }
    }
    private EXPR_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 37:
                this.previousTokenType = MathJSLabLexer.EXPR_EQ;
                break;
        }
    }
    private EXPR_NE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 38:
                this.previousTokenType = MathJSLabLexer.EXPR_NE;
                break;
        }
    }
    private EXPR_GE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 39:
                this.previousTokenType = MathJSLabLexer.EXPR_GE;
                break;
        }
    }
    private EXPR_GT_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 40:
                this.previousTokenType = MathJSLabLexer.EXPR_GT;
                break;
        }
    }
    private EMUL_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 41:
                this.previousTokenType = MathJSLabLexer.EMUL;
                break;
        }
    }
    private EDIV_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 42:
                this.previousTokenType = MathJSLabLexer.EDIV;
                break;
        }
    }
    private ELEFTDIV_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 43:
                this.previousTokenType = MathJSLabLexer.ELEFTDIV;
                break;
        }
    }
    private PLUS_PLUS_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 44:
                this.previousTokenType = MathJSLabLexer.PLUS_PLUS;
                break;
        }
    }
    private MINUS_MINUS_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 45:
                this.previousTokenType = MathJSLabLexer.MINUS_MINUS;
                break;
        }
    }
    private POW_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 46:
                this.previousTokenType = MathJSLabLexer.POW;
                break;
        }
    }
    private EPOW_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 47:
                this.previousTokenType = MathJSLabLexer.EPOW;
                break;
        }
    }
    private TRANSPOSE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 48:
                this.previousTokenType = MathJSLabLexer.TRANSPOSE;
                break;
        }
    }
    private HERMITIAN_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 49:
                if (
                    this.previousTokenType === MathJSLabLexer.RPAREN ||
                    this.previousTokenType === MathJSLabLexer.RBRACKET ||
                    this.previousTokenType === MathJSLabLexer.RCURLYBR ||
                    this.previousTokenType === MathJSLabLexer.IDENTIFIER ||
                    this.previousTokenType === MathJSLabLexer.FLOAT_NUMBER
                ) {
                    this.previousTokenType = MathJSLabLexer.HERMITIAN;
                } else {
                    this.pushMode(MathJSLabLexer.SQ_STRING);
                    this.quotedString = '';
                    this.skip();
                }

                break;
        }
    }
    private DQSTRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 50:
                this.pushMode(MathJSLabLexer.DQ_STRING);
                this.quotedString = '';
                this.skip();

                break;
        }
    }
    private IDENTIFIER_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 51:
                if (this.previousTokenType === MathJSLabLexer.DOT) {
                    this.previousTokenType = MathJSLabLexer.IDENTIFIER;
                } else {
                    let i = MathJSLabLexer.keywordNames.indexOf(this.text);
                    if (i >= 0) {
                        switch (MathJSLabLexer.keywordTypes[i]) {
                            case MathJSLabLexer.END:
                                this._type = this.previousTokenType = this.parenthesisCount > 0 || this.matrixContext.length > 0 ? MathJSLabLexer.ENDRANGE : MathJSLabLexer.END;
                                break;
                            default:
                                this._type = this.previousTokenType = MathJSLabLexer.keywordTypes[i];
                        }
                    } else {
                        i = this.commandNames.indexOf(this.text);
                        if (i >= 0) {
                            this.pushMode(MathJSLabLexer.ANY_AS_STRING_UNTIL_END_OF_LINE);
                        }
                        this.previousTokenType = MathJSLabLexer.IDENTIFIER;
                    }
                }

                break;
        }
    }
    private FLOAT_NUMBER_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 52:
                this.previousTokenType = MathJSLabLexer.FLOAT_NUMBER;

                break;
        }
    }
    private NUMBER_DOT_OP_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 53:
                this._input.seek(this._input.index - 2); // Unput two characters.
                this._type = this.previousTokenType = MathJSLabLexer.FLOAT_NUMBER;

                break;
        }
    }
    private SPACE_OR_CONTINUATION_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 54:
                if (
                    this.matrixContext.length > 0 &&
                    this.previousTokenType !== MathJSLabLexer.LBRACKET &&
                    this.previousTokenType !== MathJSLabLexer.COMMA &&
                    this.previousTokenType !== MathJSLabLexer.SEMICOLON &&
                    this.matrixContext[this.matrixContext.length - 1] !== MathJSLabLexer.LPAREN
                ) {
                    this._type = this.previousTokenType = MathJSLabLexer.WSPACE;
                } else {
                    this.skip();
                }

                break;
        }
    }
    private NEWLINE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 55:
                if (
                    this.matrixContext.length > 0 &&
                    (this.previousTokenType === MathJSLabLexer.LBRACKET || this.previousTokenType === MathJSLabLexer.COMMA || this.previousTokenType === MathJSLabLexer.SEMICOLON)
                ) {
                    this.skip();
                } else {
                    this.previousTokenType = MathJSLabLexer.NEWLINE;
                }

                break;
        }
    }
    private BLOCK_COMMENT_START_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 56:
                this.pushMode(MathJSLabLexer.BLOCK_COMMENT);
                this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;

                break;
        }
    }
    private COMMENT_LINE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 57:
                this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;

                break;
            case 58:
                this._type = this.previousTokenType = MathJSLabLexer.EOF;

                break;
        }
    }
    private SINGLEQ_STRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 59:
                this.quotedString += this.text;
                this.skip();

                break;
        }
    }
    private SINGLEQ_NL_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 60:
                this._type = this.previousTokenType = MathJSLabLexer.INVALID;

                break;
        }
    }
    private SINGLEQ_SINGLEQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 61:
                this.quotedString += "'";
                this.skip();

                break;
        }
    }
    private SINGLEQ_END_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 62:
                this.text = `'${this.quotedString}'`;
                this.popMode();
                this._type = this.previousTokenType = MathJSLabLexer.STRING;

                break;
        }
    }
    private DOUBLEQ_STRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 63:
                this.quotedString += this.text;
                this.skip();

                break;
        }
    }
    private DOUBLEQ_NL_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 64:
                this._type = this.previousTokenType = MathJSLabLexer.INVALID;

                break;
        }
    }
    private DOUBLEQ_DOUBLEQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 65:
                this.quotedString += '"';
                this.skip();

                break;
        }
    }
    private DOUBLEQ_ESCAPE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 66:
                this.quotedString += JSON.parse(`"${this.text}"`);
                this.skip();

                break;
        }
    }
    private DOUBLEQ_ESCAPE_OTHER_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 67:
                this.quotedString += this.text.substring(1);
                this.skip();

                break;
        }
    }
    private DOUBLEQ_ESCAPE_OCT_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 68:
                this.quotedString += JSON.parse(`"\\u${parseInt(this.text.substring(1), 8).toString(16).padStart(4, '0')}"`);
                this.skip();

                break;
        }
    }
    private DOUBLEQ_ESCAPE_HEX_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 69:
                this.quotedString += eval(`"\\x${this.text.substring(2)}"`);
                this.skip();

                break;
        }
    }
    private DOUBLEQ_ESCAPE_UNICODE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 70:
                this.quotedString += JSON.parse(`"\\u${this.text.substring(2).padStart(4, '0')}"`);
                this.skip();

                break;
        }
    }
    private DOUBLEQ_END_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 71:
                this.text = `"${this.quotedString}"`;
                this.popMode();
                this._type = this.previousTokenType = MathJSLabLexer.STRING;

                break;
        }
    }
    private BLOCK_COMMENT_START_AGAIN_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 72:
                this.pushMode(MathJSLabLexer.BLOCK_COMMENT);
                this.skip();

                break;
        }
    }
    private BLOCK_COMMENT_END_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 73:
                this.popMode();
                this.skip();

                break;
        }
    }
    private BLOCK_COMMENT_EOF_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 74:
                throw new SyntaxError('Block comment open at end of input.');
                break;
        }
    }
    private EXIT_AT_NEWLINE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 75:
                this.popMode();
                this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;

                break;
        }
    }
    private EXIT_AT_EOF_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 76:
                this.popMode();
                this._type = this.previousTokenType = MathJSLabLexer.EOF;

                break;
        }
    }
    private UNQUOTED_STRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 77:
                this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;

                break;
        }
    }

    public static readonly _serializedATN: number[] = [
        4, 0, 125, 784, 6, -1, 6, -1, 6, -1, 6, -1, 6, -1, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7,
        10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13, 2, 14, 7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20, 7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7,
        23, 2, 24, 7, 24, 2, 25, 7, 25, 2, 26, 7, 26, 2, 27, 7, 27, 2, 28, 7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7, 31, 2, 32, 7, 32, 2, 33, 7, 33, 2, 34, 7, 34, 2, 35, 7, 35, 2, 36, 7,
        36, 2, 37, 7, 37, 2, 38, 7, 38, 2, 39, 7, 39, 2, 40, 7, 40, 2, 41, 7, 41, 2, 42, 7, 42, 2, 43, 7, 43, 2, 44, 7, 44, 2, 45, 7, 45, 2, 46, 7, 46, 2, 47, 7, 47, 2, 48, 7, 48, 2, 49, 7,
        49, 2, 50, 7, 50, 2, 51, 7, 51, 2, 52, 7, 52, 2, 53, 7, 53, 2, 54, 7, 54, 2, 55, 7, 55, 2, 56, 7, 56, 2, 57, 7, 57, 2, 58, 7, 58, 2, 59, 7, 59, 2, 60, 7, 60, 2, 61, 7, 61, 2, 62, 7,
        62, 2, 63, 7, 63, 2, 64, 7, 64, 2, 65, 7, 65, 2, 66, 7, 66, 2, 67, 7, 67, 2, 68, 7, 68, 2, 69, 7, 69, 2, 70, 7, 70, 2, 71, 7, 71, 2, 72, 7, 72, 2, 73, 7, 73, 2, 74, 7, 74, 2, 75, 7,
        75, 2, 76, 7, 76, 2, 77, 7, 77, 2, 78, 7, 78, 2, 79, 7, 79, 2, 80, 7, 80, 2, 81, 7, 81, 2, 82, 7, 82, 2, 83, 7, 83, 2, 84, 7, 84, 2, 85, 7, 85, 2, 86, 7, 86, 2, 87, 7, 87, 2, 88, 7,
        88, 2, 89, 7, 89, 2, 90, 7, 90, 2, 91, 7, 91, 2, 92, 7, 92, 2, 93, 7, 93, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 3, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4, 1, 5, 1, 5, 1, 5,
        1, 6, 1, 6, 1, 6, 1, 7, 1, 7, 1, 7, 1, 8, 1, 8, 1, 8, 1, 9, 1, 9, 1, 9, 1, 10, 1, 10, 1, 10, 1, 11, 1, 11, 1, 11, 1, 12, 1, 12, 1, 12, 1, 13, 1, 13, 1, 13, 1, 14, 1, 14, 1, 14, 1,
        15, 1, 15, 1, 15, 1, 16, 1, 16, 1, 16, 1, 17, 1, 17, 1, 17, 1, 18, 1, 18, 1, 18, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 21, 1, 21, 1, 21, 1, 21, 1,
        21, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 3, 24, 281, 8, 24, 1, 24, 1, 24, 1, 25, 1, 25, 1, 25, 1, 25, 1, 25, 1,
        25, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 3, 28, 310, 8, 28, 1, 28, 1, 28, 1, 29, 1,
        29, 1, 29, 1, 29, 1, 29, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 33, 1, 33, 1, 33, 1, 34, 1, 34, 1, 34, 1, 35, 1,
        35, 1, 35, 1, 36, 1, 36, 1, 36, 1, 36, 1, 36, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1, 38, 1, 38, 1, 38, 1, 38, 3, 38, 357, 8, 38, 1, 38, 1, 38, 1, 39, 1, 39, 1, 39, 1, 39, 1, 39, 1,
        40, 1, 40, 1, 40, 1, 41, 1, 41, 1, 41, 1, 41, 1, 41, 1, 42, 1, 42, 1, 42, 1, 42, 1, 42, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 44, 1, 44, 1, 44, 1, 44, 1, 44, 1, 45, 1, 45, 1, 45, 1,
        45, 1, 45, 1, 46, 1, 46, 1, 46, 3, 46, 397, 8, 46, 1, 46, 1, 46, 1, 47, 1, 47, 1, 47, 1, 47, 1, 47, 3, 47, 406, 8, 47, 1, 47, 1, 47, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 49, 1, 49,
        1, 49, 1, 50, 1, 50, 1, 50, 1, 51, 1, 51, 1, 51, 1, 52, 1, 52, 3, 52, 426, 8, 52, 1, 52, 1, 52, 1, 53, 1, 53, 1, 53, 1, 53, 1, 53, 1, 54, 1, 54, 1, 54, 1, 54, 1, 54, 1, 54, 5, 54,
        441, 8, 54, 10, 54, 12, 54, 444, 9, 54, 1, 54, 3, 54, 447, 8, 54, 1, 54, 1, 54, 1, 55, 1, 55, 1, 55, 1, 56, 3, 56, 455, 8, 56, 1, 56, 1, 56, 1, 56, 3, 56, 460, 8, 56, 1, 56, 1, 56,
        1, 56, 1, 57, 1, 57, 5, 57, 467, 8, 57, 10, 57, 12, 57, 470, 9, 57, 1, 57, 1, 57, 1, 57, 1, 57, 1, 57, 3, 57, 477, 8, 57, 1, 58, 1, 58, 1, 59, 4, 59, 482, 8, 59, 11, 59, 12, 59, 483,
        1, 59, 1, 59, 1, 60, 1, 60, 1, 60, 1, 61, 1, 61, 1, 61, 1, 61, 1, 61, 1, 62, 1, 62, 1, 62, 1, 63, 4, 63, 500, 8, 63, 11, 63, 12, 63, 501, 1, 63, 1, 63, 1, 64, 1, 64, 1, 64, 1, 65, 1,
        65, 1, 65, 1, 65, 1, 65, 1, 66, 1, 66, 1, 66, 1, 66, 1, 67, 1, 67, 1, 67, 1, 67, 1, 68, 1, 68, 1, 68, 3, 68, 525, 8, 68, 1, 68, 3, 68, 528, 8, 68, 1, 68, 1, 68, 1, 69, 1, 69, 1, 69,
        1, 69, 3, 69, 536, 8, 69, 1, 69, 1, 69, 1, 70, 1, 70, 1, 70, 1, 70, 3, 70, 544, 8, 70, 1, 70, 3, 70, 547, 8, 70, 1, 70, 3, 70, 550, 8, 70, 1, 70, 1, 70, 1, 71, 1, 71, 1, 71, 1, 72,
        3, 72, 558, 8, 72, 1, 72, 1, 72, 1, 72, 3, 72, 563, 8, 72, 1, 72, 1, 72, 1, 72, 1, 73, 3, 73, 569, 8, 73, 1, 73, 1, 73, 1, 73, 3, 73, 574, 8, 73, 1, 73, 3, 73, 577, 8, 73, 1, 73, 1,
        73, 1, 74, 5, 74, 582, 8, 74, 10, 74, 12, 74, 585, 9, 74, 1, 74, 1, 74, 1, 74, 1, 74, 1, 75, 5, 75, 592, 8, 75, 10, 75, 12, 75, 595, 9, 75, 1, 75, 1, 75, 1, 75, 1, 76, 1, 76, 1, 76,
        1, 76, 1, 77, 1, 77, 5, 77, 606, 8, 77, 10, 77, 12, 77, 609, 9, 77, 1, 77, 1, 77, 1, 78, 1, 78, 1, 78, 1, 79, 1, 79, 1, 79, 1, 80, 4, 80, 620, 8, 80, 11, 80, 12, 80, 621, 1, 80, 1,
        80, 1, 81, 1, 81, 1, 82, 1, 82, 3, 82, 630, 8, 82, 1, 82, 3, 82, 633, 8, 82, 1, 83, 4, 83, 636, 8, 83, 11, 83, 12, 83, 637, 1, 84, 1, 84, 5, 84, 642, 8, 84, 10, 84, 12, 84, 645, 9,
        84, 1, 85, 1, 85, 3, 85, 649, 8, 85, 1, 85, 1, 85, 3, 85, 653, 8, 85, 1, 85, 5, 85, 656, 8, 85, 10, 85, 12, 85, 659, 9, 85, 1, 86, 1, 86, 3, 86, 663, 8, 86, 1, 86, 3, 86, 666, 8, 86,
        1, 86, 1, 86, 3, 86, 670, 8, 86, 1, 86, 1, 86, 3, 86, 674, 8, 86, 1, 86, 1, 86, 1, 86, 1, 86, 3, 86, 680, 8, 86, 1, 86, 3, 86, 683, 8, 86, 1, 86, 1, 86, 3, 86, 687, 8, 86, 1, 86, 1,
        86, 3, 86, 691, 8, 86, 1, 86, 1, 86, 1, 86, 1, 86, 3, 86, 697, 8, 86, 1, 86, 3, 86, 700, 8, 86, 1, 86, 1, 86, 3, 86, 704, 8, 86, 1, 86, 1, 86, 3, 86, 708, 8, 86, 1, 86, 1, 86, 1, 86,
        1, 86, 3, 86, 714, 8, 86, 1, 86, 3, 86, 717, 8, 86, 1, 86, 1, 86, 3, 86, 721, 8, 86, 1, 86, 1, 86, 3, 86, 725, 8, 86, 3, 86, 727, 8, 86, 1, 87, 1, 87, 1, 87, 1, 87, 1, 87, 1, 87, 1,
        87, 1, 87, 1, 87, 3, 87, 738, 8, 87, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 3, 88, 748, 8, 88, 3, 88, 750, 8, 88, 1, 89, 1, 89, 5, 89, 754, 8, 89, 10, 89, 12, 89,
        757, 9, 89, 1, 90, 1, 90, 5, 90, 761, 8, 90, 10, 90, 12, 90, 764, 9, 90, 1, 91, 1, 91, 5, 91, 768, 8, 91, 10, 91, 12, 91, 771, 9, 91, 1, 92, 1, 92, 5, 92, 775, 8, 92, 10, 92, 12, 92,
        778, 9, 92, 1, 93, 3, 93, 781, 8, 93, 1, 93, 1, 93, 1, 583, 0, 94, 5, 45, 7, 46, 9, 47, 11, 48, 13, 49, 15, 50, 17, 51, 19, 52, 21, 53, 23, 54, 25, 55, 27, 56, 29, 57, 31, 58, 33,
        59, 35, 60, 37, 61, 39, 62, 41, 63, 43, 64, 45, 65, 47, 66, 49, 67, 51, 68, 53, 69, 55, 70, 57, 71, 59, 72, 61, 73, 63, 74, 65, 75, 67, 76, 69, 77, 71, 78, 73, 79, 75, 80, 77, 81,
        79, 82, 81, 83, 83, 84, 85, 85, 87, 86, 89, 87, 91, 88, 93, 89, 95, 90, 97, 91, 99, 92, 101, 93, 103, 94, 105, 95, 107, 96, 109, 97, 111, 98, 113, 99, 115, 100, 117, 101, 119, 102,
        121, 103, 123, 104, 125, 105, 127, 106, 129, 107, 131, 108, 133, 109, 135, 110, 137, 111, 139, 112, 141, 113, 143, 114, 145, 115, 147, 116, 149, 117, 151, 118, 153, 119, 155, 120,
        157, 121, 159, 122, 161, 123, 163, 124, 165, 125, 167, 0, 169, 0, 171, 0, 173, 0, 175, 0, 177, 0, 179, 0, 181, 0, 183, 0, 185, 0, 187, 0, 189, 0, 191, 0, 5, 0, 1, 2, 3, 4, 26, 2, 0,
        73, 74, 105, 106, 5, 0, 39, 39, 42, 42, 47, 47, 92, 92, 94, 94, 2, 0, 10, 10, 13, 13, 3, 0, 10, 10, 13, 13, 39, 39, 4, 0, 10, 10, 13, 13, 34, 34, 92, 92, 8, 0, 34, 34, 39, 39, 92,
        92, 98, 98, 102, 102, 110, 110, 114, 114, 116, 116, 1, 0, 48, 55, 3, 0, 48, 57, 65, 70, 97, 102, 3, 0, 9, 10, 13, 13, 32, 32, 2, 0, 35, 35, 37, 37, 2, 0, 9, 9, 32, 32, 3, 0, 65, 90,
        95, 95, 97, 122, 4, 0, 48, 57, 65, 90, 95, 95, 97, 122, 2, 0, 68, 69, 100, 101, 2, 0, 66, 66, 98, 98, 2, 0, 80, 80, 112, 112, 2, 0, 79, 79, 111, 111, 2, 0, 88, 88, 120, 120, 2, 0,
        115, 115, 117, 117, 1, 0, 48, 57, 2, 0, 48, 57, 95, 95, 1, 0, 48, 49, 2, 0, 48, 49, 95, 95, 2, 0, 48, 55, 95, 95, 4, 0, 48, 57, 65, 70, 95, 95, 97, 102, 2, 0, 43, 43, 45, 45, 832, 0,
        5, 1, 0, 0, 0, 0, 7, 1, 0, 0, 0, 0, 9, 1, 0, 0, 0, 0, 11, 1, 0, 0, 0, 0, 13, 1, 0, 0, 0, 0, 15, 1, 0, 0, 0, 0, 17, 1, 0, 0, 0, 0, 19, 1, 0, 0, 0, 0, 21, 1, 0, 0, 0, 0, 23, 1, 0, 0,
        0, 0, 25, 1, 0, 0, 0, 0, 27, 1, 0, 0, 0, 0, 29, 1, 0, 0, 0, 0, 31, 1, 0, 0, 0, 0, 33, 1, 0, 0, 0, 0, 35, 1, 0, 0, 0, 0, 37, 1, 0, 0, 0, 0, 39, 1, 0, 0, 0, 0, 41, 1, 0, 0, 0, 0, 43,
        1, 0, 0, 0, 0, 45, 1, 0, 0, 0, 0, 47, 1, 0, 0, 0, 0, 49, 1, 0, 0, 0, 0, 51, 1, 0, 0, 0, 0, 53, 1, 0, 0, 0, 0, 55, 1, 0, 0, 0, 0, 57, 1, 0, 0, 0, 0, 59, 1, 0, 0, 0, 0, 61, 1, 0, 0, 0,
        0, 63, 1, 0, 0, 0, 0, 65, 1, 0, 0, 0, 0, 67, 1, 0, 0, 0, 0, 69, 1, 0, 0, 0, 0, 71, 1, 0, 0, 0, 0, 73, 1, 0, 0, 0, 0, 75, 1, 0, 0, 0, 0, 77, 1, 0, 0, 0, 0, 79, 1, 0, 0, 0, 0, 81, 1,
        0, 0, 0, 0, 83, 1, 0, 0, 0, 0, 85, 1, 0, 0, 0, 0, 87, 1, 0, 0, 0, 0, 89, 1, 0, 0, 0, 0, 91, 1, 0, 0, 0, 0, 93, 1, 0, 0, 0, 0, 95, 1, 0, 0, 0, 0, 97, 1, 0, 0, 0, 0, 99, 1, 0, 0, 0, 0,
        101, 1, 0, 0, 0, 0, 103, 1, 0, 0, 0, 0, 105, 1, 0, 0, 0, 0, 107, 1, 0, 0, 0, 0, 109, 1, 0, 0, 0, 0, 111, 1, 0, 0, 0, 0, 113, 1, 0, 0, 0, 0, 115, 1, 0, 0, 0, 0, 117, 1, 0, 0, 0, 0,
        119, 1, 0, 0, 0, 0, 121, 1, 0, 0, 0, 1, 123, 1, 0, 0, 0, 1, 125, 1, 0, 0, 0, 1, 127, 1, 0, 0, 0, 1, 129, 1, 0, 0, 0, 2, 131, 1, 0, 0, 0, 2, 133, 1, 0, 0, 0, 2, 135, 1, 0, 0, 0, 2,
        137, 1, 0, 0, 0, 2, 139, 1, 0, 0, 0, 2, 141, 1, 0, 0, 0, 2, 143, 1, 0, 0, 0, 2, 145, 1, 0, 0, 0, 2, 147, 1, 0, 0, 0, 3, 149, 1, 0, 0, 0, 3, 151, 1, 0, 0, 0, 3, 153, 1, 0, 0, 0, 3,
        155, 1, 0, 0, 0, 4, 157, 1, 0, 0, 0, 4, 159, 1, 0, 0, 0, 4, 161, 1, 0, 0, 0, 4, 163, 1, 0, 0, 0, 4, 165, 1, 0, 0, 0, 5, 193, 1, 0, 0, 0, 7, 196, 1, 0, 0, 0, 9, 199, 1, 0, 0, 0, 11,
        202, 1, 0, 0, 0, 13, 205, 1, 0, 0, 0, 15, 208, 1, 0, 0, 0, 17, 211, 1, 0, 0, 0, 19, 214, 1, 0, 0, 0, 21, 217, 1, 0, 0, 0, 23, 220, 1, 0, 0, 0, 25, 223, 1, 0, 0, 0, 27, 226, 1, 0, 0,
        0, 29, 229, 1, 0, 0, 0, 31, 232, 1, 0, 0, 0, 33, 235, 1, 0, 0, 0, 35, 238, 1, 0, 0, 0, 37, 241, 1, 0, 0, 0, 39, 244, 1, 0, 0, 0, 41, 247, 1, 0, 0, 0, 43, 250, 1, 0, 0, 0, 45, 255, 1,
        0, 0, 0, 47, 260, 1, 0, 0, 0, 49, 265, 1, 0, 0, 0, 51, 270, 1, 0, 0, 0, 53, 280, 1, 0, 0, 0, 55, 284, 1, 0, 0, 0, 57, 290, 1, 0, 0, 0, 59, 296, 1, 0, 0, 0, 61, 309, 1, 0, 0, 0, 63,
        313, 1, 0, 0, 0, 65, 318, 1, 0, 0, 0, 67, 323, 1, 0, 0, 0, 69, 328, 1, 0, 0, 0, 71, 333, 1, 0, 0, 0, 73, 336, 1, 0, 0, 0, 75, 339, 1, 0, 0, 0, 77, 342, 1, 0, 0, 0, 79, 347, 1, 0, 0,
        0, 81, 356, 1, 0, 0, 0, 83, 360, 1, 0, 0, 0, 85, 365, 1, 0, 0, 0, 87, 368, 1, 0, 0, 0, 89, 373, 1, 0, 0, 0, 91, 378, 1, 0, 0, 0, 93, 383, 1, 0, 0, 0, 95, 388, 1, 0, 0, 0, 97, 396, 1,
        0, 0, 0, 99, 405, 1, 0, 0, 0, 101, 409, 1, 0, 0, 0, 103, 414, 1, 0, 0, 0, 105, 417, 1, 0, 0, 0, 107, 420, 1, 0, 0, 0, 109, 423, 1, 0, 0, 0, 111, 429, 1, 0, 0, 0, 113, 434, 1, 0, 0,
        0, 115, 450, 1, 0, 0, 0, 117, 454, 1, 0, 0, 0, 119, 464, 1, 0, 0, 0, 121, 478, 1, 0, 0, 0, 123, 481, 1, 0, 0, 0, 125, 487, 1, 0, 0, 0, 127, 490, 1, 0, 0, 0, 129, 495, 1, 0, 0, 0,
        131, 499, 1, 0, 0, 0, 133, 505, 1, 0, 0, 0, 135, 508, 1, 0, 0, 0, 137, 513, 1, 0, 0, 0, 139, 517, 1, 0, 0, 0, 141, 521, 1, 0, 0, 0, 143, 531, 1, 0, 0, 0, 145, 539, 1, 0, 0, 0, 147,
        553, 1, 0, 0, 0, 149, 557, 1, 0, 0, 0, 151, 568, 1, 0, 0, 0, 153, 583, 1, 0, 0, 0, 155, 593, 1, 0, 0, 0, 157, 599, 1, 0, 0, 0, 159, 603, 1, 0, 0, 0, 161, 612, 1, 0, 0, 0, 163, 615,
        1, 0, 0, 0, 165, 619, 1, 0, 0, 0, 167, 625, 1, 0, 0, 0, 169, 632, 1, 0, 0, 0, 171, 635, 1, 0, 0, 0, 173, 639, 1, 0, 0, 0, 175, 646, 1, 0, 0, 0, 177, 726, 1, 0, 0, 0, 179, 728, 1, 0,
        0, 0, 181, 749, 1, 0, 0, 0, 183, 751, 1, 0, 0, 0, 185, 758, 1, 0, 0, 0, 187, 765, 1, 0, 0, 0, 189, 772, 1, 0, 0, 0, 191, 780, 1, 0, 0, 0, 193, 194, 5, 43, 0, 0, 194, 195, 6, 0, 0, 0,
        195, 6, 1, 0, 0, 0, 196, 197, 5, 45, 0, 0, 197, 198, 6, 1, 1, 0, 198, 8, 1, 0, 0, 0, 199, 200, 5, 42, 0, 0, 200, 201, 6, 2, 2, 0, 201, 10, 1, 0, 0, 0, 202, 203, 5, 47, 0, 0, 203,
        204, 6, 3, 3, 0, 204, 12, 1, 0, 0, 0, 205, 206, 5, 61, 0, 0, 206, 207, 6, 4, 4, 0, 207, 14, 1, 0, 0, 0, 208, 209, 5, 58, 0, 0, 209, 210, 6, 5, 5, 0, 210, 16, 1, 0, 0, 0, 211, 212, 5,
        59, 0, 0, 212, 213, 6, 6, 6, 0, 213, 18, 1, 0, 0, 0, 214, 215, 5, 44, 0, 0, 215, 216, 6, 7, 7, 0, 216, 20, 1, 0, 0, 0, 217, 218, 5, 46, 0, 0, 218, 219, 6, 8, 8, 0, 219, 22, 1, 0, 0,
        0, 220, 221, 5, 126, 0, 0, 221, 222, 6, 9, 9, 0, 222, 24, 1, 0, 0, 0, 223, 224, 5, 33, 0, 0, 224, 225, 6, 10, 10, 0, 225, 26, 1, 0, 0, 0, 226, 227, 5, 64, 0, 0, 227, 228, 6, 11, 11,
        0, 228, 28, 1, 0, 0, 0, 229, 230, 5, 40, 0, 0, 230, 231, 6, 12, 12, 0, 231, 30, 1, 0, 0, 0, 232, 233, 5, 41, 0, 0, 233, 234, 6, 13, 13, 0, 234, 32, 1, 0, 0, 0, 235, 236, 5, 91, 0, 0,
        236, 237, 6, 14, 14, 0, 237, 34, 1, 0, 0, 0, 238, 239, 5, 93, 0, 0, 239, 240, 6, 15, 15, 0, 240, 36, 1, 0, 0, 0, 241, 242, 5, 123, 0, 0, 242, 243, 6, 16, 16, 0, 243, 38, 1, 0, 0, 0,
        244, 245, 5, 125, 0, 0, 245, 246, 6, 17, 17, 0, 246, 40, 1, 0, 0, 0, 247, 248, 5, 92, 0, 0, 248, 249, 6, 18, 18, 0, 249, 42, 1, 0, 0, 0, 250, 251, 5, 43, 0, 0, 251, 252, 5, 61, 0, 0,
        252, 253, 1, 0, 0, 0, 253, 254, 6, 19, 19, 0, 254, 44, 1, 0, 0, 0, 255, 256, 5, 45, 0, 0, 256, 257, 5, 61, 0, 0, 257, 258, 1, 0, 0, 0, 258, 259, 6, 20, 20, 0, 259, 46, 1, 0, 0, 0,
        260, 261, 5, 42, 0, 0, 261, 262, 5, 61, 0, 0, 262, 263, 1, 0, 0, 0, 263, 264, 6, 21, 21, 0, 264, 48, 1, 0, 0, 0, 265, 266, 5, 47, 0, 0, 266, 267, 5, 61, 0, 0, 267, 268, 1, 0, 0, 0,
        268, 269, 6, 22, 22, 0, 269, 50, 1, 0, 0, 0, 270, 271, 5, 92, 0, 0, 271, 272, 5, 61, 0, 0, 272, 273, 1, 0, 0, 0, 273, 274, 6, 23, 23, 0, 274, 52, 1, 0, 0, 0, 275, 276, 5, 94, 0, 0,
        276, 281, 5, 61, 0, 0, 277, 278, 5, 42, 0, 0, 278, 279, 5, 42, 0, 0, 279, 281, 5, 61, 0, 0, 280, 275, 1, 0, 0, 0, 280, 277, 1, 0, 0, 0, 281, 282, 1, 0, 0, 0, 282, 283, 6, 24, 24, 0,
        283, 54, 1, 0, 0, 0, 284, 285, 5, 46, 0, 0, 285, 286, 5, 42, 0, 0, 286, 287, 5, 61, 0, 0, 287, 288, 1, 0, 0, 0, 288, 289, 6, 25, 25, 0, 289, 56, 1, 0, 0, 0, 290, 291, 5, 46, 0, 0,
        291, 292, 5, 47, 0, 0, 292, 293, 5, 61, 0, 0, 293, 294, 1, 0, 0, 0, 294, 295, 6, 26, 26, 0, 295, 58, 1, 0, 0, 0, 296, 297, 5, 46, 0, 0, 297, 298, 5, 92, 0, 0, 298, 299, 5, 61, 0, 0,
        299, 300, 1, 0, 0, 0, 300, 301, 6, 27, 27, 0, 301, 60, 1, 0, 0, 0, 302, 303, 5, 46, 0, 0, 303, 304, 5, 94, 0, 0, 304, 310, 5, 61, 0, 0, 305, 306, 5, 46, 0, 0, 306, 307, 5, 42, 0, 0,
        307, 308, 5, 42, 0, 0, 308, 310, 5, 61, 0, 0, 309, 302, 1, 0, 0, 0, 309, 305, 1, 0, 0, 0, 310, 311, 1, 0, 0, 0, 311, 312, 6, 28, 28, 0, 312, 62, 1, 0, 0, 0, 313, 314, 5, 38, 0, 0,
        314, 315, 5, 61, 0, 0, 315, 316, 1, 0, 0, 0, 316, 317, 6, 29, 29, 0, 317, 64, 1, 0, 0, 0, 318, 319, 5, 124, 0, 0, 319, 320, 5, 61, 0, 0, 320, 321, 1, 0, 0, 0, 321, 322, 6, 30, 30, 0,
        322, 66, 1, 0, 0, 0, 323, 324, 5, 38, 0, 0, 324, 325, 5, 38, 0, 0, 325, 326, 1, 0, 0, 0, 326, 327, 6, 31, 31, 0, 327, 68, 1, 0, 0, 0, 328, 329, 5, 124, 0, 0, 329, 330, 5, 124, 0, 0,
        330, 331, 1, 0, 0, 0, 331, 332, 6, 32, 32, 0, 332, 70, 1, 0, 0, 0, 333, 334, 5, 38, 0, 0, 334, 335, 6, 33, 33, 0, 335, 72, 1, 0, 0, 0, 336, 337, 5, 124, 0, 0, 337, 338, 6, 34, 34, 0,
        338, 74, 1, 0, 0, 0, 339, 340, 5, 60, 0, 0, 340, 341, 6, 35, 35, 0, 341, 76, 1, 0, 0, 0, 342, 343, 5, 60, 0, 0, 343, 344, 5, 61, 0, 0, 344, 345, 1, 0, 0, 0, 345, 346, 6, 36, 36, 0,
        346, 78, 1, 0, 0, 0, 347, 348, 5, 61, 0, 0, 348, 349, 5, 61, 0, 0, 349, 350, 1, 0, 0, 0, 350, 351, 6, 37, 37, 0, 351, 80, 1, 0, 0, 0, 352, 353, 5, 33, 0, 0, 353, 357, 5, 61, 0, 0,
        354, 355, 5, 126, 0, 0, 355, 357, 5, 61, 0, 0, 356, 352, 1, 0, 0, 0, 356, 354, 1, 0, 0, 0, 357, 358, 1, 0, 0, 0, 358, 359, 6, 38, 38, 0, 359, 82, 1, 0, 0, 0, 360, 361, 5, 62, 0, 0,
        361, 362, 5, 61, 0, 0, 362, 363, 1, 0, 0, 0, 363, 364, 6, 39, 39, 0, 364, 84, 1, 0, 0, 0, 365, 366, 5, 62, 0, 0, 366, 367, 6, 40, 40, 0, 367, 86, 1, 0, 0, 0, 368, 369, 5, 46, 0, 0,
        369, 370, 5, 42, 0, 0, 370, 371, 1, 0, 0, 0, 371, 372, 6, 41, 41, 0, 372, 88, 1, 0, 0, 0, 373, 374, 5, 46, 0, 0, 374, 375, 5, 47, 0, 0, 375, 376, 1, 0, 0, 0, 376, 377, 6, 42, 42, 0,
        377, 90, 1, 0, 0, 0, 378, 379, 5, 46, 0, 0, 379, 380, 5, 92, 0, 0, 380, 381, 1, 0, 0, 0, 381, 382, 6, 43, 43, 0, 382, 92, 1, 0, 0, 0, 383, 384, 5, 43, 0, 0, 384, 385, 5, 43, 0, 0,
        385, 386, 1, 0, 0, 0, 386, 387, 6, 44, 44, 0, 387, 94, 1, 0, 0, 0, 388, 389, 5, 45, 0, 0, 389, 390, 5, 45, 0, 0, 390, 391, 1, 0, 0, 0, 391, 392, 6, 45, 45, 0, 392, 96, 1, 0, 0, 0,
        393, 397, 5, 94, 0, 0, 394, 395, 5, 42, 0, 0, 395, 397, 5, 42, 0, 0, 396, 393, 1, 0, 0, 0, 396, 394, 1, 0, 0, 0, 397, 398, 1, 0, 0, 0, 398, 399, 6, 46, 46, 0, 399, 98, 1, 0, 0, 0,
        400, 401, 5, 46, 0, 0, 401, 406, 5, 94, 0, 0, 402, 403, 5, 46, 0, 0, 403, 404, 5, 42, 0, 0, 404, 406, 5, 42, 0, 0, 405, 400, 1, 0, 0, 0, 405, 402, 1, 0, 0, 0, 406, 407, 1, 0, 0, 0,
        407, 408, 6, 47, 47, 0, 408, 100, 1, 0, 0, 0, 409, 410, 5, 46, 0, 0, 410, 411, 5, 39, 0, 0, 411, 412, 1, 0, 0, 0, 412, 413, 6, 48, 48, 0, 413, 102, 1, 0, 0, 0, 414, 415, 5, 39, 0, 0,
        415, 416, 6, 49, 49, 0, 416, 104, 1, 0, 0, 0, 417, 418, 5, 34, 0, 0, 418, 419, 6, 50, 50, 0, 419, 106, 1, 0, 0, 0, 420, 421, 3, 173, 84, 0, 421, 422, 6, 51, 51, 0, 422, 108, 1, 0, 0,
        0, 423, 425, 3, 177, 86, 0, 424, 426, 7, 0, 0, 0, 425, 424, 1, 0, 0, 0, 425, 426, 1, 0, 0, 0, 426, 427, 1, 0, 0, 0, 427, 428, 6, 52, 52, 0, 428, 110, 1, 0, 0, 0, 429, 430, 3, 181,
        88, 0, 430, 431, 5, 46, 0, 0, 431, 432, 7, 1, 0, 0, 432, 433, 6, 53, 53, 0, 433, 112, 1, 0, 0, 0, 434, 446, 3, 171, 83, 0, 435, 436, 5, 46, 0, 0, 436, 437, 5, 46, 0, 0, 437, 438, 5,
        46, 0, 0, 438, 442, 1, 0, 0, 0, 439, 441, 8, 2, 0, 0, 440, 439, 1, 0, 0, 0, 441, 444, 1, 0, 0, 0, 442, 440, 1, 0, 0, 0, 442, 443, 1, 0, 0, 0, 443, 445, 1, 0, 0, 0, 444, 442, 1, 0, 0,
        0, 445, 447, 3, 169, 82, 0, 446, 435, 1, 0, 0, 0, 446, 447, 1, 0, 0, 0, 447, 448, 1, 0, 0, 0, 448, 449, 6, 54, 54, 0, 449, 114, 1, 0, 0, 0, 450, 451, 3, 169, 82, 0, 451, 452, 6, 55,
        55, 0, 452, 116, 1, 0, 0, 0, 453, 455, 3, 171, 83, 0, 454, 453, 1, 0, 0, 0, 454, 455, 1, 0, 0, 0, 455, 456, 1, 0, 0, 0, 456, 457, 3, 167, 81, 0, 457, 459, 5, 123, 0, 0, 458, 460, 3,
        171, 83, 0, 459, 458, 1, 0, 0, 0, 459, 460, 1, 0, 0, 0, 460, 461, 1, 0, 0, 0, 461, 462, 3, 169, 82, 0, 462, 463, 6, 56, 56, 0, 463, 118, 1, 0, 0, 0, 464, 468, 3, 167, 81, 0, 465,
        467, 8, 2, 0, 0, 466, 465, 1, 0, 0, 0, 467, 470, 1, 0, 0, 0, 468, 466, 1, 0, 0, 0, 468, 469, 1, 0, 0, 0, 469, 476, 1, 0, 0, 0, 470, 468, 1, 0, 0, 0, 471, 472, 3, 169, 82, 0, 472,
        473, 6, 57, 57, 0, 473, 477, 1, 0, 0, 0, 474, 475, 5, 0, 0, 1, 475, 477, 6, 57, 58, 0, 476, 471, 1, 0, 0, 0, 476, 474, 1, 0, 0, 0, 477, 120, 1, 0, 0, 0, 478, 479, 9, 0, 0, 0, 479,
        122, 1, 0, 0, 0, 480, 482, 8, 3, 0, 0, 481, 480, 1, 0, 0, 0, 482, 483, 1, 0, 0, 0, 483, 481, 1, 0, 0, 0, 483, 484, 1, 0, 0, 0, 484, 485, 1, 0, 0, 0, 485, 486, 6, 59, 59, 0, 486, 124,
        1, 0, 0, 0, 487, 488, 3, 169, 82, 0, 488, 489, 6, 60, 60, 0, 489, 126, 1, 0, 0, 0, 490, 491, 5, 39, 0, 0, 491, 492, 5, 39, 0, 0, 492, 493, 1, 0, 0, 0, 493, 494, 6, 61, 61, 0, 494,
        128, 1, 0, 0, 0, 495, 496, 5, 39, 0, 0, 496, 497, 6, 62, 62, 0, 497, 130, 1, 0, 0, 0, 498, 500, 8, 4, 0, 0, 499, 498, 1, 0, 0, 0, 500, 501, 1, 0, 0, 0, 501, 499, 1, 0, 0, 0, 501,
        502, 1, 0, 0, 0, 502, 503, 1, 0, 0, 0, 503, 504, 6, 63, 63, 0, 504, 132, 1, 0, 0, 0, 505, 506, 3, 169, 82, 0, 506, 507, 6, 64, 64, 0, 507, 134, 1, 0, 0, 0, 508, 509, 5, 34, 0, 0,
        509, 510, 5, 34, 0, 0, 510, 511, 1, 0, 0, 0, 511, 512, 6, 65, 65, 0, 512, 136, 1, 0, 0, 0, 513, 514, 5, 92, 0, 0, 514, 515, 7, 5, 0, 0, 515, 516, 6, 66, 66, 0, 516, 138, 1, 0, 0, 0,
        517, 518, 5, 92, 0, 0, 518, 519, 9, 0, 0, 0, 519, 520, 6, 67, 67, 0, 520, 140, 1, 0, 0, 0, 521, 522, 5, 92, 0, 0, 522, 524, 7, 6, 0, 0, 523, 525, 7, 6, 0, 0, 524, 523, 1, 0, 0, 0,
        524, 525, 1, 0, 0, 0, 525, 527, 1, 0, 0, 0, 526, 528, 7, 6, 0, 0, 527, 526, 1, 0, 0, 0, 527, 528, 1, 0, 0, 0, 528, 529, 1, 0, 0, 0, 529, 530, 6, 68, 68, 0, 530, 142, 1, 0, 0, 0, 531,
        532, 5, 92, 0, 0, 532, 533, 5, 120, 0, 0, 533, 535, 7, 7, 0, 0, 534, 536, 7, 7, 0, 0, 535, 534, 1, 0, 0, 0, 535, 536, 1, 0, 0, 0, 536, 537, 1, 0, 0, 0, 537, 538, 6, 69, 69, 0, 538,
        144, 1, 0, 0, 0, 539, 540, 5, 92, 0, 0, 540, 541, 5, 117, 0, 0, 541, 543, 7, 7, 0, 0, 542, 544, 7, 7, 0, 0, 543, 542, 1, 0, 0, 0, 543, 544, 1, 0, 0, 0, 544, 546, 1, 0, 0, 0, 545,
        547, 7, 7, 0, 0, 546, 545, 1, 0, 0, 0, 546, 547, 1, 0, 0, 0, 547, 549, 1, 0, 0, 0, 548, 550, 7, 7, 0, 0, 549, 548, 1, 0, 0, 0, 549, 550, 1, 0, 0, 0, 550, 551, 1, 0, 0, 0, 551, 552,
        6, 70, 70, 0, 552, 146, 1, 0, 0, 0, 553, 554, 5, 34, 0, 0, 554, 555, 6, 71, 71, 0, 555, 148, 1, 0, 0, 0, 556, 558, 3, 171, 83, 0, 557, 556, 1, 0, 0, 0, 557, 558, 1, 0, 0, 0, 558,
        559, 1, 0, 0, 0, 559, 560, 3, 167, 81, 0, 560, 562, 5, 123, 0, 0, 561, 563, 3, 171, 83, 0, 562, 561, 1, 0, 0, 0, 562, 563, 1, 0, 0, 0, 563, 564, 1, 0, 0, 0, 564, 565, 3, 169, 82, 0,
        565, 566, 6, 72, 72, 0, 566, 150, 1, 0, 0, 0, 567, 569, 3, 171, 83, 0, 568, 567, 1, 0, 0, 0, 568, 569, 1, 0, 0, 0, 569, 570, 1, 0, 0, 0, 570, 571, 3, 167, 81, 0, 571, 573, 5, 125, 0,
        0, 572, 574, 3, 171, 83, 0, 573, 572, 1, 0, 0, 0, 573, 574, 1, 0, 0, 0, 574, 576, 1, 0, 0, 0, 575, 577, 3, 169, 82, 0, 576, 575, 1, 0, 0, 0, 576, 577, 1, 0, 0, 0, 577, 578, 1, 0, 0,
        0, 578, 579, 6, 73, 73, 0, 579, 152, 1, 0, 0, 0, 580, 582, 9, 0, 0, 0, 581, 580, 1, 0, 0, 0, 582, 585, 1, 0, 0, 0, 583, 584, 1, 0, 0, 0, 583, 581, 1, 0, 0, 0, 584, 586, 1, 0, 0, 0,
        585, 583, 1, 0, 0, 0, 586, 587, 3, 169, 82, 0, 587, 588, 1, 0, 0, 0, 588, 589, 6, 74, 74, 0, 589, 154, 1, 0, 0, 0, 590, 592, 8, 2, 0, 0, 591, 590, 1, 0, 0, 0, 592, 595, 1, 0, 0, 0,
        593, 591, 1, 0, 0, 0, 593, 594, 1, 0, 0, 0, 594, 596, 1, 0, 0, 0, 595, 593, 1, 0, 0, 0, 596, 597, 5, 0, 0, 1, 597, 598, 6, 75, 75, 0, 598, 156, 1, 0, 0, 0, 599, 600, 3, 171, 83, 0,
        600, 601, 1, 0, 0, 0, 601, 602, 6, 76, 74, 0, 602, 158, 1, 0, 0, 0, 603, 607, 3, 167, 81, 0, 604, 606, 8, 2, 0, 0, 605, 604, 1, 0, 0, 0, 606, 609, 1, 0, 0, 0, 607, 605, 1, 0, 0, 0,
        607, 608, 1, 0, 0, 0, 608, 610, 1, 0, 0, 0, 609, 607, 1, 0, 0, 0, 610, 611, 6, 77, 74, 0, 611, 160, 1, 0, 0, 0, 612, 613, 3, 169, 82, 0, 613, 614, 6, 78, 76, 0, 614, 162, 1, 0, 0, 0,
        615, 616, 5, 0, 0, 1, 616, 617, 6, 79, 77, 0, 617, 164, 1, 0, 0, 0, 618, 620, 8, 8, 0, 0, 619, 618, 1, 0, 0, 0, 620, 621, 1, 0, 0, 0, 621, 619, 1, 0, 0, 0, 621, 622, 1, 0, 0, 0, 622,
        623, 1, 0, 0, 0, 623, 624, 6, 80, 78, 0, 624, 166, 1, 0, 0, 0, 625, 626, 7, 9, 0, 0, 626, 168, 1, 0, 0, 0, 627, 633, 5, 13, 0, 0, 628, 630, 5, 13, 0, 0, 629, 628, 1, 0, 0, 0, 629,
        630, 1, 0, 0, 0, 630, 631, 1, 0, 0, 0, 631, 633, 5, 10, 0, 0, 632, 627, 1, 0, 0, 0, 632, 629, 1, 0, 0, 0, 633, 170, 1, 0, 0, 0, 634, 636, 7, 10, 0, 0, 635, 634, 1, 0, 0, 0, 636, 637,
        1, 0, 0, 0, 637, 635, 1, 0, 0, 0, 637, 638, 1, 0, 0, 0, 638, 172, 1, 0, 0, 0, 639, 643, 7, 11, 0, 0, 640, 642, 7, 12, 0, 0, 641, 640, 1, 0, 0, 0, 642, 645, 1, 0, 0, 0, 643, 641, 1,
        0, 0, 0, 643, 644, 1, 0, 0, 0, 644, 174, 1, 0, 0, 0, 645, 643, 1, 0, 0, 0, 646, 657, 3, 173, 84, 0, 647, 649, 3, 171, 83, 0, 648, 647, 1, 0, 0, 0, 648, 649, 1, 0, 0, 0, 649, 650, 1,
        0, 0, 0, 650, 652, 5, 46, 0, 0, 651, 653, 3, 171, 83, 0, 652, 651, 1, 0, 0, 0, 652, 653, 1, 0, 0, 0, 653, 654, 1, 0, 0, 0, 654, 656, 3, 173, 84, 0, 655, 648, 1, 0, 0, 0, 656, 659, 1,
        0, 0, 0, 657, 655, 1, 0, 0, 0, 657, 658, 1, 0, 0, 0, 658, 176, 1, 0, 0, 0, 659, 657, 1, 0, 0, 0, 660, 662, 3, 183, 89, 0, 661, 663, 5, 46, 0, 0, 662, 661, 1, 0, 0, 0, 662, 663, 1, 0,
        0, 0, 663, 670, 1, 0, 0, 0, 664, 666, 3, 183, 89, 0, 665, 664, 1, 0, 0, 0, 665, 666, 1, 0, 0, 0, 666, 667, 1, 0, 0, 0, 667, 668, 5, 46, 0, 0, 668, 670, 3, 183, 89, 0, 669, 660, 1, 0,
        0, 0, 669, 665, 1, 0, 0, 0, 670, 673, 1, 0, 0, 0, 671, 672, 7, 13, 0, 0, 672, 674, 3, 191, 93, 0, 673, 671, 1, 0, 0, 0, 673, 674, 1, 0, 0, 0, 674, 727, 1, 0, 0, 0, 675, 676, 5, 48,
        0, 0, 676, 686, 7, 14, 0, 0, 677, 679, 3, 185, 90, 0, 678, 680, 5, 46, 0, 0, 679, 678, 1, 0, 0, 0, 679, 680, 1, 0, 0, 0, 680, 687, 1, 0, 0, 0, 681, 683, 3, 185, 90, 0, 682, 681, 1,
        0, 0, 0, 682, 683, 1, 0, 0, 0, 683, 684, 1, 0, 0, 0, 684, 685, 5, 46, 0, 0, 685, 687, 3, 185, 90, 0, 686, 677, 1, 0, 0, 0, 686, 682, 1, 0, 0, 0, 687, 690, 1, 0, 0, 0, 688, 689, 7,
        15, 0, 0, 689, 691, 3, 191, 93, 0, 690, 688, 1, 0, 0, 0, 690, 691, 1, 0, 0, 0, 691, 727, 1, 0, 0, 0, 692, 693, 5, 48, 0, 0, 693, 703, 7, 16, 0, 0, 694, 696, 3, 187, 91, 0, 695, 697,
        5, 46, 0, 0, 696, 695, 1, 0, 0, 0, 696, 697, 1, 0, 0, 0, 697, 704, 1, 0, 0, 0, 698, 700, 3, 187, 91, 0, 699, 698, 1, 0, 0, 0, 699, 700, 1, 0, 0, 0, 700, 701, 1, 0, 0, 0, 701, 702, 5,
        46, 0, 0, 702, 704, 3, 187, 91, 0, 703, 694, 1, 0, 0, 0, 703, 699, 1, 0, 0, 0, 704, 707, 1, 0, 0, 0, 705, 706, 7, 15, 0, 0, 706, 708, 3, 191, 93, 0, 707, 705, 1, 0, 0, 0, 707, 708,
        1, 0, 0, 0, 708, 727, 1, 0, 0, 0, 709, 710, 5, 48, 0, 0, 710, 720, 7, 17, 0, 0, 711, 713, 3, 189, 92, 0, 712, 714, 5, 46, 0, 0, 713, 712, 1, 0, 0, 0, 713, 714, 1, 0, 0, 0, 714, 721,
        1, 0, 0, 0, 715, 717, 3, 189, 92, 0, 716, 715, 1, 0, 0, 0, 716, 717, 1, 0, 0, 0, 717, 718, 1, 0, 0, 0, 718, 719, 5, 46, 0, 0, 719, 721, 3, 189, 92, 0, 720, 711, 1, 0, 0, 0, 720, 716,
        1, 0, 0, 0, 721, 724, 1, 0, 0, 0, 722, 723, 7, 15, 0, 0, 723, 725, 3, 191, 93, 0, 724, 722, 1, 0, 0, 0, 724, 725, 1, 0, 0, 0, 725, 727, 1, 0, 0, 0, 726, 669, 1, 0, 0, 0, 726, 675, 1,
        0, 0, 0, 726, 692, 1, 0, 0, 0, 726, 709, 1, 0, 0, 0, 727, 178, 1, 0, 0, 0, 728, 729, 3, 181, 88, 0, 729, 737, 7, 18, 0, 0, 730, 738, 5, 56, 0, 0, 731, 732, 5, 49, 0, 0, 732, 738, 5,
        54, 0, 0, 733, 734, 5, 51, 0, 0, 734, 738, 5, 50, 0, 0, 735, 736, 5, 54, 0, 0, 736, 738, 5, 52, 0, 0, 737, 730, 1, 0, 0, 0, 737, 731, 1, 0, 0, 0, 737, 733, 1, 0, 0, 0, 737, 735, 1,
        0, 0, 0, 738, 180, 1, 0, 0, 0, 739, 750, 3, 183, 89, 0, 740, 747, 5, 48, 0, 0, 741, 742, 7, 14, 0, 0, 742, 748, 3, 185, 90, 0, 743, 744, 7, 16, 0, 0, 744, 748, 3, 187, 91, 0, 745,
        746, 7, 17, 0, 0, 746, 748, 3, 189, 92, 0, 747, 741, 1, 0, 0, 0, 747, 743, 1, 0, 0, 0, 747, 745, 1, 0, 0, 0, 748, 750, 1, 0, 0, 0, 749, 739, 1, 0, 0, 0, 749, 740, 1, 0, 0, 0, 750,
        182, 1, 0, 0, 0, 751, 755, 7, 19, 0, 0, 752, 754, 7, 20, 0, 0, 753, 752, 1, 0, 0, 0, 754, 757, 1, 0, 0, 0, 755, 753, 1, 0, 0, 0, 755, 756, 1, 0, 0, 0, 756, 184, 1, 0, 0, 0, 757, 755,
        1, 0, 0, 0, 758, 762, 7, 21, 0, 0, 759, 761, 7, 22, 0, 0, 760, 759, 1, 0, 0, 0, 761, 764, 1, 0, 0, 0, 762, 760, 1, 0, 0, 0, 762, 763, 1, 0, 0, 0, 763, 186, 1, 0, 0, 0, 764, 762, 1,
        0, 0, 0, 765, 769, 7, 6, 0, 0, 766, 768, 7, 23, 0, 0, 767, 766, 1, 0, 0, 0, 768, 771, 1, 0, 0, 0, 769, 767, 1, 0, 0, 0, 769, 770, 1, 0, 0, 0, 770, 188, 1, 0, 0, 0, 771, 769, 1, 0, 0,
        0, 772, 776, 7, 7, 0, 0, 773, 775, 7, 24, 0, 0, 774, 773, 1, 0, 0, 0, 775, 778, 1, 0, 0, 0, 776, 774, 1, 0, 0, 0, 776, 777, 1, 0, 0, 0, 777, 190, 1, 0, 0, 0, 778, 776, 1, 0, 0, 0,
        779, 781, 7, 25, 0, 0, 780, 779, 1, 0, 0, 0, 780, 781, 1, 0, 0, 0, 781, 782, 1, 0, 0, 0, 782, 783, 3, 183, 89, 0, 783, 192, 1, 0, 0, 0, 66, 0, 1, 2, 3, 4, 280, 309, 356, 396, 405,
        425, 442, 446, 454, 459, 468, 476, 483, 501, 524, 527, 535, 543, 546, 549, 557, 562, 568, 573, 576, 583, 593, 607, 621, 629, 632, 637, 643, 648, 652, 657, 662, 665, 669, 673, 679,
        682, 686, 690, 696, 699, 703, 707, 713, 716, 720, 724, 726, 737, 747, 749, 755, 762, 769, 776, 780, 79, 1, 0, 0, 1, 1, 1, 1, 2, 2, 1, 3, 3, 1, 4, 4, 1, 5, 5, 1, 6, 6, 1, 7, 7, 1, 8,
        8, 1, 9, 9, 1, 10, 10, 1, 11, 11, 1, 12, 12, 1, 13, 13, 1, 14, 14, 1, 15, 15, 1, 16, 16, 1, 17, 17, 1, 18, 18, 1, 19, 19, 1, 20, 20, 1, 21, 21, 1, 22, 22, 1, 23, 23, 1, 24, 24, 1,
        25, 25, 1, 26, 26, 1, 27, 27, 1, 28, 28, 1, 29, 29, 1, 30, 30, 1, 31, 31, 1, 32, 32, 1, 33, 33, 1, 34, 34, 1, 35, 35, 1, 36, 36, 1, 37, 37, 1, 38, 38, 1, 39, 39, 1, 40, 40, 1, 41,
        41, 1, 42, 42, 1, 43, 43, 1, 44, 44, 1, 45, 45, 1, 46, 46, 1, 47, 47, 1, 48, 48, 1, 49, 49, 1, 50, 50, 1, 51, 51, 1, 52, 52, 1, 53, 53, 1, 54, 54, 1, 55, 55, 1, 56, 56, 1, 57, 57, 1,
        57, 58, 1, 59, 59, 1, 60, 60, 1, 61, 61, 1, 62, 62, 1, 63, 63, 1, 64, 64, 1, 65, 65, 1, 66, 66, 1, 67, 67, 1, 68, 68, 1, 69, 69, 1, 70, 70, 1, 71, 71, 1, 72, 72, 1, 73, 73, 6, 0, 0,
        1, 75, 74, 1, 78, 75, 1, 79, 76, 1, 80, 77,
    ];

    private static __ATN: ATN;
    public static get _ATN(): ATN {
        if (!MathJSLabLexer.__ATN) {
            MathJSLabLexer.__ATN = new ATNDeserializer().deserialize(MathJSLabLexer._serializedATN);
        }

        return MathJSLabLexer.__ATN;
    }

    static DecisionsToDFA = MathJSLabLexer._ATN.decisionToState.map((ds: DecisionState, index: number) => new DFA(ds, index));
}
