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
    public static readonly SPMD = 21;
    public static readonly ENDSPMD = 22;
    public static readonly BREAK = 23;
    public static readonly CONTINUE = 24;
    public static readonly RETURN = 25;
    public static readonly FUNCTION = 26;
    public static readonly ENDFUNCTION = 27;
    public static readonly TRY = 28;
    public static readonly CATCH = 29;
    public static readonly END_TRY_CATCH = 30;
    public static readonly UNWIND_PROTECT = 31;
    public static readonly UNWIND_PROTECT_CLEANUP = 32;
    public static readonly END_UNWIND_PROTECT = 33;
    public static readonly CLASSDEF = 34;
    public static readonly ENDCLASSDEF = 35;
    public static readonly ENUMERATION = 36;
    public static readonly ENDENUMERATION = 37;
    public static readonly PROPERTIES = 38;
    public static readonly ENDPROPERTIES = 39;
    public static readonly EVENTS = 40;
    public static readonly ENDEVENTS = 41;
    public static readonly METHODS = 42;
    public static readonly ENDMETHODS = 43;
    public static readonly WSPACE = 44;
    public static readonly STRING = 45;
    public static readonly ARGUMENTS = 46;
    public static readonly PLUS = 47;
    public static readonly MINUS = 48;
    public static readonly MUL = 49;
    public static readonly DIV = 50;
    public static readonly EQ = 51;
    public static readonly COLON = 52;
    public static readonly SEMICOLON = 53;
    public static readonly COMMA = 54;
    public static readonly DOT = 55;
    public static readonly TILDE = 56;
    public static readonly EXCLAMATION = 57;
    public static readonly COMMAT = 58;
    public static readonly QUESTION = 59;
    public static readonly LPAREN = 60;
    public static readonly RPAREN = 61;
    public static readonly LBRACKET = 62;
    public static readonly RBRACKET = 63;
    public static readonly LCURLYBR = 64;
    public static readonly RCURLYBR = 65;
    public static readonly LEFTDIV = 66;
    public static readonly ADD_EQ = 67;
    public static readonly SUB_EQ = 68;
    public static readonly MUL_EQ = 69;
    public static readonly DIV_EQ = 70;
    public static readonly LEFTDIV_EQ = 71;
    public static readonly POW_EQ = 72;
    public static readonly EMUL_EQ = 73;
    public static readonly EDIV_EQ = 74;
    public static readonly ELEFTDIV_EQ = 75;
    public static readonly EPOW_EQ = 76;
    public static readonly AND_EQ = 77;
    public static readonly OR_EQ = 78;
    public static readonly EXPR_AND_AND = 79;
    public static readonly EXPR_OR_OR = 80;
    public static readonly EXPR_AND = 81;
    public static readonly EXPR_OR = 82;
    public static readonly EXPR_LT = 83;
    public static readonly EXPR_LE = 84;
    public static readonly EXPR_EQ = 85;
    public static readonly EXPR_NE = 86;
    public static readonly EXPR_GE = 87;
    public static readonly EXPR_GT = 88;
    public static readonly EMUL = 89;
    public static readonly EDIV = 90;
    public static readonly ELEFTDIV = 91;
    public static readonly PLUS_PLUS = 92;
    public static readonly MINUS_MINUS = 93;
    public static readonly POW = 94;
    public static readonly EPOW = 95;
    public static readonly TRANSPOSE = 96;
    public static readonly HERMITIAN = 97;
    public static readonly DQSTRING = 98;
    public static readonly IDENTIFIER = 99;
    public static readonly FLOAT_NUMBER = 100;
    public static readonly NUMBER_DOT_OP = 101;
    public static readonly LINE_CONTINUATION = 102;
    public static readonly SPACE_OR_CONTINUATION = 103;
    public static readonly NEWLINE = 104;
    public static readonly BLOCK_COMMENT_START = 105;
    public static readonly COMMENT_LINE = 106;
    public static readonly INVALID = 107;
    public static readonly SINGLEQ_STRING = 108;
    public static readonly SINGLEQ_NL = 109;
    public static readonly SINGLEQ_SINGLEQ = 110;
    public static readonly SINGLEQ_END = 111;
    public static readonly DOUBLEQ_STRING = 112;
    public static readonly DOUBLEQ_NL = 113;
    public static readonly DOUBLEQ_DOUBLEQ = 114;
    public static readonly DOUBLEQ_ESCAPE = 115;
    public static readonly DOUBLEQ_ESCAPE_OTHER = 116;
    public static readonly DOUBLEQ_ESCAPE_OCT = 117;
    public static readonly DOUBLEQ_ESCAPE_HEX = 118;
    public static readonly DOUBLEQ_ESCAPE_UNICODE = 119;
    public static readonly DOUBLEQ_END = 120;
    public static readonly BLOCK_COMMENT_START_AGAIN = 121;
    public static readonly BLOCK_COMMENT_END = 122;
    public static readonly BLOCK_COMMENT_LINE = 123;
    public static readonly BLOCK_COMMENT_EOF = 124;
    public static readonly COMMAND_LINE_CONTINUATION = 125;
    public static readonly COMMAND_CONTINUED_BLOCK_COMMENT_START = 126;
    public static readonly COMMAND_CONTINUED_COMMENT_LINE = 127;
    public static readonly COMMAND_CONTINUED_NEWLINE = 128;
    public static readonly SKIP_SPACE = 129;
    public static readonly COMMAND_DQSTRING = 130;
    public static readonly COMMAND_SQSTRING = 131;
    public static readonly SKIP_COMMENT_LINE = 132;
    public static readonly EXIT_AT_NEWLINE = 133;
    public static readonly EXIT_AT_EOF = 134;
    public static readonly UNQUOTED_STRING = 135;
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
        'COMMAND_DQSTRING',
        'COMMAND_SQSTRING',
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
        'COMMAND_DQSTRING',
        'COMMAND_SQSTRING',
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
    public static readonly keywordNames: (string | null)[] = [
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
        'spmd',
        'endspmd',
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
    public static readonly keywordTypes: number[] = [
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
        MathJSLabLexer.SPMD,
        MathJSLabLexer.ENDSPMD,
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
    public static readonly keywordTypeByName: Map<string, number> = new Map(
        MathJSLabLexer.keywordNames
            .map((name, index): [string, number] | undefined => (name ? [name, MathJSLabLexer.keywordTypes[index]] : undefined))
            .filter((entry): entry is [string, number] => typeof entry !== 'undefined'),
    );
    /**
     * Word-list commands.
     */
    public commandNames: Set<string> = new Set();
    /**
     * Expression marks that indicate non-termination.
     */
    public static readonly nonTerminalSign: Set<number> = new Set([
        MathJSLabLexer.PLUS,
        MathJSLabLexer.MINUS,
        MathJSLabLexer.MUL,
        MathJSLabLexer.DIV,
        MathJSLabLexer.EQ,
        MathJSLabLexer.DOT,
        MathJSLabLexer.TILDE,
        MathJSLabLexer.EXCLAMATION,
        MathJSLabLexer.COMMAT,
        MathJSLabLexer.QUESTION,
        MathJSLabLexer.LPAREN,
        MathJSLabLexer.LBRACKET,
        MathJSLabLexer.LCURLYBR,
        MathJSLabLexer.LEFTDIV,
        MathJSLabLexer.ADD_EQ,
        MathJSLabLexer.SUB_EQ,
        MathJSLabLexer.MUL_EQ,
        MathJSLabLexer.DIV_EQ,
        MathJSLabLexer.LEFTDIV_EQ,
        MathJSLabLexer.POW_EQ,
        MathJSLabLexer.EMUL_EQ,
        MathJSLabLexer.EDIV_EQ,
        MathJSLabLexer.ELEFTDIV_EQ,
        MathJSLabLexer.EPOW_EQ,
        MathJSLabLexer.AND_EQ,
        MathJSLabLexer.OR_EQ,
        MathJSLabLexer.EXPR_AND_AND,
        MathJSLabLexer.EXPR_OR_OR,
        MathJSLabLexer.EXPR_AND,
        MathJSLabLexer.EXPR_OR,
        MathJSLabLexer.EXPR_LT,
        MathJSLabLexer.EXPR_LE,
        MathJSLabLexer.EXPR_EQ,
        MathJSLabLexer.EXPR_NE,
        MathJSLabLexer.EXPR_GE,
        MathJSLabLexer.EXPR_GT,
        MathJSLabLexer.EMUL,
        MathJSLabLexer.EDIV,
        MathJSLabLexer.ELEFTDIV,
        MathJSLabLexer.PLUS_PLUS,
        MathJSLabLexer.MINUS_MINUS,
        MathJSLabLexer.POW,
        MathJSLabLexer.EPOW,
    ]);
    /**
     * Lexer context.
     */
    /* Type of previous token. */
    public previousTokenType: number = Token.EOF;
    /* Open parenthesis count. */
    public parenthesisCount: number = 0;
    /* Token that is waiting for a logical-line continuation. */
    public continuedTokenType: number | null = null;
    /* Whether command-style arguments are waiting after an ellipsis. */
    public commandContinued: boolean = false;
    /* Matrix reading context stack. */
    public matrixContext: number[] = [];
    /* String accumulator. */
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
                this.QUESTION_action(localctx, actionIndex);
                break;
            case 13:
                this.LPAREN_action(localctx, actionIndex);
                break;
            case 14:
                this.RPAREN_action(localctx, actionIndex);
                break;
            case 15:
                this.LBRACKET_action(localctx, actionIndex);
                break;
            case 16:
                this.RBRACKET_action(localctx, actionIndex);
                break;
            case 17:
                this.LCURLYBR_action(localctx, actionIndex);
                break;
            case 18:
                this.RCURLYBR_action(localctx, actionIndex);
                break;
            case 19:
                this.LEFTDIV_action(localctx, actionIndex);
                break;
            case 20:
                this.ADD_EQ_action(localctx, actionIndex);
                break;
            case 21:
                this.SUB_EQ_action(localctx, actionIndex);
                break;
            case 22:
                this.MUL_EQ_action(localctx, actionIndex);
                break;
            case 23:
                this.DIV_EQ_action(localctx, actionIndex);
                break;
            case 24:
                this.LEFTDIV_EQ_action(localctx, actionIndex);
                break;
            case 25:
                this.POW_EQ_action(localctx, actionIndex);
                break;
            case 26:
                this.EMUL_EQ_action(localctx, actionIndex);
                break;
            case 27:
                this.EDIV_EQ_action(localctx, actionIndex);
                break;
            case 28:
                this.ELEFTDIV_EQ_action(localctx, actionIndex);
                break;
            case 29:
                this.EPOW_EQ_action(localctx, actionIndex);
                break;
            case 30:
                this.AND_EQ_action(localctx, actionIndex);
                break;
            case 31:
                this.OR_EQ_action(localctx, actionIndex);
                break;
            case 32:
                this.EXPR_AND_AND_action(localctx, actionIndex);
                break;
            case 33:
                this.EXPR_OR_OR_action(localctx, actionIndex);
                break;
            case 34:
                this.EXPR_AND_action(localctx, actionIndex);
                break;
            case 35:
                this.EXPR_OR_action(localctx, actionIndex);
                break;
            case 36:
                this.EXPR_LT_action(localctx, actionIndex);
                break;
            case 37:
                this.EXPR_LE_action(localctx, actionIndex);
                break;
            case 38:
                this.EXPR_EQ_action(localctx, actionIndex);
                break;
            case 39:
                this.EXPR_NE_action(localctx, actionIndex);
                break;
            case 40:
                this.EXPR_GE_action(localctx, actionIndex);
                break;
            case 41:
                this.EXPR_GT_action(localctx, actionIndex);
                break;
            case 42:
                this.EMUL_action(localctx, actionIndex);
                break;
            case 43:
                this.EDIV_action(localctx, actionIndex);
                break;
            case 44:
                this.ELEFTDIV_action(localctx, actionIndex);
                break;
            case 45:
                this.PLUS_PLUS_action(localctx, actionIndex);
                break;
            case 46:
                this.MINUS_MINUS_action(localctx, actionIndex);
                break;
            case 47:
                this.POW_action(localctx, actionIndex);
                break;
            case 48:
                this.EPOW_action(localctx, actionIndex);
                break;
            case 49:
                this.TRANSPOSE_action(localctx, actionIndex);
                break;
            case 50:
                this.HERMITIAN_action(localctx, actionIndex);
                break;
            case 51:
                this.DQSTRING_action(localctx, actionIndex);
                break;
            case 52:
                this.IDENTIFIER_action(localctx, actionIndex);
                break;
            case 53:
                this.FLOAT_NUMBER_action(localctx, actionIndex);
                break;
            case 54:
                this.NUMBER_DOT_OP_action(localctx, actionIndex);
                break;
            case 55:
                this.LINE_CONTINUATION_action(localctx, actionIndex);
                break;
            case 56:
                this.SPACE_OR_CONTINUATION_action(localctx, actionIndex);
                break;
            case 57:
                this.NEWLINE_action(localctx, actionIndex);
                break;
            case 58:
                this.BLOCK_COMMENT_START_action(localctx, actionIndex);
                break;
            case 59:
                this.COMMENT_LINE_action(localctx, actionIndex);
                break;
            case 61:
                this.SINGLEQ_STRING_action(localctx, actionIndex);
                break;
            case 62:
                this.SINGLEQ_NL_action(localctx, actionIndex);
                break;
            case 63:
                this.SINGLEQ_SINGLEQ_action(localctx, actionIndex);
                break;
            case 64:
                this.SINGLEQ_END_action(localctx, actionIndex);
                break;
            case 65:
                this.DOUBLEQ_STRING_action(localctx, actionIndex);
                break;
            case 66:
                this.DOUBLEQ_NL_action(localctx, actionIndex);
                break;
            case 67:
                this.DOUBLEQ_DOUBLEQ_action(localctx, actionIndex);
                break;
            case 68:
                this.DOUBLEQ_ESCAPE_action(localctx, actionIndex);
                break;
            case 69:
                this.DOUBLEQ_ESCAPE_OTHER_action(localctx, actionIndex);
                break;
            case 70:
                this.DOUBLEQ_ESCAPE_OCT_action(localctx, actionIndex);
                break;
            case 71:
                this.DOUBLEQ_ESCAPE_HEX_action(localctx, actionIndex);
                break;
            case 72:
                this.DOUBLEQ_ESCAPE_UNICODE_action(localctx, actionIndex);
                break;
            case 73:
                this.DOUBLEQ_END_action(localctx, actionIndex);
                break;
            case 74:
                this.BLOCK_COMMENT_START_AGAIN_action(localctx, actionIndex);
                break;
            case 75:
                this.BLOCK_COMMENT_END_action(localctx, actionIndex);
                break;
            case 77:
                this.BLOCK_COMMENT_EOF_action(localctx, actionIndex);
                break;
            case 78:
                this.COMMAND_LINE_CONTINUATION_action(localctx, actionIndex);
                break;
            case 79:
                this.COMMAND_CONTINUED_BLOCK_COMMENT_START_action(localctx, actionIndex);
                break;
            case 83:
                this.COMMAND_DQSTRING_action(localctx, actionIndex);
                break;
            case 84:
                this.COMMAND_SQSTRING_action(localctx, actionIndex);
                break;
            case 86:
                this.EXIT_AT_NEWLINE_action(localctx, actionIndex);
                break;
            case 87:
                this.EXIT_AT_EOF_action(localctx, actionIndex);
                break;
            case 88:
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
    private QUESTION_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 12:
                this.previousTokenType = MathJSLabLexer.QUESTION;
                break;
        }
    }
    private LPAREN_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 13:
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
            case 14:
                if (this.matrixContext.length > 0) {
                    this.matrixContext.pop();
                }
                this.parenthesisCount = Math.max(0, this.parenthesisCount - 1);
                this.previousTokenType = MathJSLabLexer.RPAREN;

                break;
        }
    }
    private LBRACKET_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 15:
                this.matrixContext.push(MathJSLabLexer.LBRACKET);
                this.previousTokenType = MathJSLabLexer.LBRACKET;

                break;
        }
    }
    private RBRACKET_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 16:
                this.matrixContext.pop();
                this.previousTokenType = MathJSLabLexer.RBRACKET;

                break;
        }
    }
    private LCURLYBR_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 17:
                this.matrixContext.push(MathJSLabLexer.LCURLYBR);
                this.previousTokenType = MathJSLabLexer.LCURLYBR;

                break;
        }
    }
    private RCURLYBR_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 18:
                this.matrixContext.pop();
                this.previousTokenType = MathJSLabLexer.RCURLYBR;

                break;
        }
    }
    private LEFTDIV_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 19:
                this.previousTokenType = MathJSLabLexer.LEFTDIV;
                break;
        }
    }
    private ADD_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 20:
                this.previousTokenType = MathJSLabLexer.ADD_EQ;
                break;
        }
    }
    private SUB_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 21:
                this.previousTokenType = MathJSLabLexer.SUB_EQ;
                break;
        }
    }
    private MUL_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 22:
                this.previousTokenType = MathJSLabLexer.MUL_EQ;
                break;
        }
    }
    private DIV_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 23:
                this.previousTokenType = MathJSLabLexer.DIV_EQ;
                break;
        }
    }
    private LEFTDIV_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 24:
                this.previousTokenType = MathJSLabLexer.LEFTDIV_EQ;
                break;
        }
    }
    private POW_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 25:
                this.previousTokenType = MathJSLabLexer.POW_EQ;
                break;
        }
    }
    private EMUL_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 26:
                this.previousTokenType = MathJSLabLexer.EMUL_EQ;
                break;
        }
    }
    private EDIV_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 27:
                this.previousTokenType = MathJSLabLexer.EDIV_EQ;
                break;
        }
    }
    private ELEFTDIV_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 28:
                this.previousTokenType = MathJSLabLexer.ELEFTDIV_EQ;
                break;
        }
    }
    private EPOW_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 29:
                this.previousTokenType = MathJSLabLexer.EPOW_EQ;
                break;
        }
    }
    private AND_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 30:
                this.previousTokenType = MathJSLabLexer.AND_EQ;
                break;
        }
    }
    private OR_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 31:
                this.previousTokenType = MathJSLabLexer.OR_EQ;
                break;
        }
    }
    private EXPR_AND_AND_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 32:
                this.previousTokenType = MathJSLabLexer.EXPR_AND_AND;
                break;
        }
    }
    private EXPR_OR_OR_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 33:
                this.previousTokenType = MathJSLabLexer.EXPR_OR_OR;
                break;
        }
    }
    private EXPR_AND_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 34:
                this.previousTokenType = MathJSLabLexer.EXPR_AND;
                break;
        }
    }
    private EXPR_OR_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 35:
                this.previousTokenType = MathJSLabLexer.EXPR_OR;
                break;
        }
    }
    private EXPR_LT_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 36:
                this.previousTokenType = MathJSLabLexer.EXPR_LT;
                break;
        }
    }
    private EXPR_LE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 37:
                this.previousTokenType = MathJSLabLexer.EXPR_LE;
                break;
        }
    }
    private EXPR_EQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 38:
                this.previousTokenType = MathJSLabLexer.EXPR_EQ;
                break;
        }
    }
    private EXPR_NE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 39:
                this.previousTokenType = MathJSLabLexer.EXPR_NE;
                break;
        }
    }
    private EXPR_GE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 40:
                this.previousTokenType = MathJSLabLexer.EXPR_GE;
                break;
        }
    }
    private EXPR_GT_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 41:
                this.previousTokenType = MathJSLabLexer.EXPR_GT;
                break;
        }
    }
    private EMUL_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 42:
                this.previousTokenType = MathJSLabLexer.EMUL;
                break;
        }
    }
    private EDIV_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 43:
                this.previousTokenType = MathJSLabLexer.EDIV;
                break;
        }
    }
    private ELEFTDIV_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 44:
                this.previousTokenType = MathJSLabLexer.ELEFTDIV;
                break;
        }
    }
    private PLUS_PLUS_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 45:
                this.previousTokenType = MathJSLabLexer.PLUS_PLUS;
                break;
        }
    }
    private MINUS_MINUS_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 46:
                this.previousTokenType = MathJSLabLexer.MINUS_MINUS;
                break;
        }
    }
    private POW_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 47:
                this.previousTokenType = MathJSLabLexer.POW;
                break;
        }
    }
    private EPOW_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 48:
                this.previousTokenType = MathJSLabLexer.EPOW;
                break;
        }
    }
    private TRANSPOSE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 49:
                this.previousTokenType = MathJSLabLexer.TRANSPOSE;
                break;
        }
    }
    private HERMITIAN_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 50:
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
            case 51:
                this.pushMode(MathJSLabLexer.DQ_STRING);
                this.quotedString = '';
                this.skip();

                break;
        }
    }
    private IDENTIFIER_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 52:
                if (this.previousTokenType === MathJSLabLexer.DOT) {
                    this.previousTokenType = MathJSLabLexer.IDENTIFIER;
                } else {
                    const keywordType = MathJSLabLexer.keywordTypeByName.get(this.text);
                    if (typeof keywordType !== 'undefined') {
                        switch (keywordType) {
                            case MathJSLabLexer.END:
                                this._type = this.previousTokenType = this.parenthesisCount > 0 || this.matrixContext.length > 0 ? MathJSLabLexer.ENDRANGE : MathJSLabLexer.END;
                                break;
                            default:
                                this._type = this.previousTokenType = keywordType;
                        }
                    } else {
                        const isCommandName = this.commandNames.has(this.text);
                        const isCommandPosition =
                            this.previousTokenType === Token.EOF || this.previousTokenType === MathJSLabLexer.NEWLINE || this.previousTokenType === MathJSLabLexer.SEMICOLON;
                        let offset = 1;
                        let next = this._input.LA(offset);
                        while (next === 9 || next === 32) {
                            next = this._input.LA(++offset);
                        }
                        if (isCommandName && isCommandPosition && next !== 40) {
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
            case 53:
                this.previousTokenType = MathJSLabLexer.FLOAT_NUMBER;

                break;
        }
    }
    private NUMBER_DOT_OP_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 54:
                this._input.seek(this._input.index - 2); // Unput two characters.
                this._type = this.previousTokenType = MathJSLabLexer.FLOAT_NUMBER;

                break;
        }
    }
    private LINE_CONTINUATION_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 55:
                this.continuedTokenType = this.previousTokenType;
                this.skip();

                break;
        }
    }
    private SPACE_OR_CONTINUATION_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 56:
                if (this.text.includes('...')) {
                    this.continuedTokenType = this.previousTokenType;
                }
                if (
                    this.matrixContext.length > 0 &&
                    this.previousTokenType !== MathJSLabLexer.LBRACKET &&
                    this.previousTokenType !== MathJSLabLexer.COMMA &&
                    this.previousTokenType !== MathJSLabLexer.SEMICOLON &&
                    this.matrixContext[this.matrixContext.length - 1] !== MathJSLabLexer.LPAREN &&
                    !MathJSLabLexer.nonTerminalSign.has(this.previousTokenType)
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
            case 57:
                if (this.continuedTokenType === this.previousTokenType) {
                    this.skip();
                } else if (this.parenthesisCount > 0) {
                    this.skip();
                } else if (
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
            case 58:
                this.pushMode(MathJSLabLexer.BLOCK_COMMENT);
                if (this.continuedTokenType === this.previousTokenType || this.parenthesisCount > 0) {
                    this.skip();
                } else {
                    this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;
                }

                break;
        }
    }
    private COMMENT_LINE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 59:
                if (this.continuedTokenType === this.previousTokenType) {
                    this.skip();
                } else if (this.parenthesisCount > 0) {
                    this.skip();
                } else {
                    this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;
                }

                break;
            case 60:
                this._type = this.previousTokenType = MathJSLabLexer.EOF;

                break;
        }
    }
    private SINGLEQ_STRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 61:
                this.quotedString += this.text;
                this.skip();

                break;
        }
    }
    private SINGLEQ_NL_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 62:
                this._type = this.previousTokenType = MathJSLabLexer.INVALID;

                break;
        }
    }
    private SINGLEQ_SINGLEQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 63:
                this.quotedString += "'";
                this.skip();

                break;
        }
    }
    private SINGLEQ_END_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 64:
                this.text = `'${this.quotedString}'`;
                this.popMode();
                this._type = this.previousTokenType = MathJSLabLexer.STRING;

                break;
        }
    }
    private DOUBLEQ_STRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 65:
                this.quotedString += this.text;
                this.skip();

                break;
        }
    }
    private DOUBLEQ_NL_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 66:
                this._type = this.previousTokenType = MathJSLabLexer.INVALID;

                break;
        }
    }
    private DOUBLEQ_DOUBLEQ_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 67:
                this.quotedString += '"';
                this.skip();

                break;
        }
    }
    private DOUBLEQ_ESCAPE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 68:
                this.quotedString += JSON.parse(`"${this.text}"`);
                this.skip();

                break;
        }
    }
    private DOUBLEQ_ESCAPE_OTHER_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 69:
                this.quotedString += this.text.substring(1);
                this.skip();

                break;
        }
    }
    private DOUBLEQ_ESCAPE_OCT_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 70:
                this.quotedString += JSON.parse(`"\\u${parseInt(this.text.substring(1), 8).toString(16).padStart(4, '0')}"`);
                this.skip();

                break;
        }
    }
    private DOUBLEQ_ESCAPE_HEX_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 71:
                this.quotedString += eval(`"\\x${this.text.substring(2)}"`);
                this.skip();

                break;
        }
    }
    private DOUBLEQ_ESCAPE_UNICODE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 72:
                this.quotedString += JSON.parse(`"\\u${this.text.substring(2).padStart(4, '0')}"`);
                this.skip();

                break;
        }
    }
    private DOUBLEQ_END_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 73:
                this.text = `"${this.quotedString}"`;
                this.popMode();
                this._type = this.previousTokenType = MathJSLabLexer.STRING;

                break;
        }
    }
    private BLOCK_COMMENT_START_AGAIN_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 74:
                this.pushMode(MathJSLabLexer.BLOCK_COMMENT);
                this.skip();

                break;
        }
    }
    private BLOCK_COMMENT_END_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 75:
                this.popMode();
                this.skip();

                break;
        }
    }
    private BLOCK_COMMENT_EOF_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 76:
                throw new SyntaxError('Block comment open at end of input.');
                break;
        }
    }
    private COMMAND_LINE_CONTINUATION_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 77:
                this.commandContinued = true;
                this.skip();

                break;
        }
    }
    private COMMAND_CONTINUED_BLOCK_COMMENT_START_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 78:
                this.pushMode(MathJSLabLexer.BLOCK_COMMENT);
                this.skip();

                break;
        }
    }
    private COMMAND_DQSTRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 79:
                this.commandContinued = false;
                this.pushMode(MathJSLabLexer.DQ_STRING);
                this.quotedString = '';
                this.skip();

                break;
        }
    }
    private COMMAND_SQSTRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 80:
                this.commandContinued = false;
                this.pushMode(MathJSLabLexer.SQ_STRING);
                this.quotedString = '';
                this.skip();

                break;
        }
    }
    private EXIT_AT_NEWLINE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 81:
                this.commandContinued = false;
                this.popMode();
                this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;

                break;
        }
    }
    private EXIT_AT_EOF_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 82:
                this.commandContinued = false;
                this.popMode();
                this._type = this.previousTokenType = MathJSLabLexer.EOF;

                break;
        }
    }
    private UNQUOTED_STRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 83:
                this.commandContinued = false;
                this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;

                break;
        }
    }
    // @Override
    public sempred(localctx: RuleContext, ruleIndex: number, predIndex: number): boolean {
        switch (ruleIndex) {
            case 79:
                return this.COMMAND_CONTINUED_BLOCK_COMMENT_START_sempred(localctx, predIndex);
            case 80:
                return this.COMMAND_CONTINUED_COMMENT_LINE_sempred(localctx, predIndex);
            case 81:
                return this.COMMAND_CONTINUED_NEWLINE_sempred(localctx, predIndex);
        }
        return true;
    }
    private COMMAND_CONTINUED_BLOCK_COMMENT_START_sempred(localctx: RuleContext, predIndex: number): boolean {
        switch (predIndex) {
            case 0:
                return this.commandContinued;
        }
        return true;
    }
    private COMMAND_CONTINUED_COMMENT_LINE_sempred(localctx: RuleContext, predIndex: number): boolean {
        switch (predIndex) {
            case 1:
                return this.commandContinued;
        }
        return true;
    }
    private COMMAND_CONTINUED_NEWLINE_sempred(localctx: RuleContext, predIndex: number): boolean {
        switch (predIndex) {
            case 2:
                return this.commandContinued;
        }
        return true;
    }

    public static readonly _serializedATN: number[] = [
        4, 0, 135, 864, 6, -1, 6, -1, 6, -1, 6, -1, 6, -1, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7,
        10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13, 2, 14, 7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20, 7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7,
        23, 2, 24, 7, 24, 2, 25, 7, 25, 2, 26, 7, 26, 2, 27, 7, 27, 2, 28, 7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7, 31, 2, 32, 7, 32, 2, 33, 7, 33, 2, 34, 7, 34, 2, 35, 7, 35, 2, 36, 7,
        36, 2, 37, 7, 37, 2, 38, 7, 38, 2, 39, 7, 39, 2, 40, 7, 40, 2, 41, 7, 41, 2, 42, 7, 42, 2, 43, 7, 43, 2, 44, 7, 44, 2, 45, 7, 45, 2, 46, 7, 46, 2, 47, 7, 47, 2, 48, 7, 48, 2, 49, 7,
        49, 2, 50, 7, 50, 2, 51, 7, 51, 2, 52, 7, 52, 2, 53, 7, 53, 2, 54, 7, 54, 2, 55, 7, 55, 2, 56, 7, 56, 2, 57, 7, 57, 2, 58, 7, 58, 2, 59, 7, 59, 2, 60, 7, 60, 2, 61, 7, 61, 2, 62, 7,
        62, 2, 63, 7, 63, 2, 64, 7, 64, 2, 65, 7, 65, 2, 66, 7, 66, 2, 67, 7, 67, 2, 68, 7, 68, 2, 69, 7, 69, 2, 70, 7, 70, 2, 71, 7, 71, 2, 72, 7, 72, 2, 73, 7, 73, 2, 74, 7, 74, 2, 75, 7,
        75, 2, 76, 7, 76, 2, 77, 7, 77, 2, 78, 7, 78, 2, 79, 7, 79, 2, 80, 7, 80, 2, 81, 7, 81, 2, 82, 7, 82, 2, 83, 7, 83, 2, 84, 7, 84, 2, 85, 7, 85, 2, 86, 7, 86, 2, 87, 7, 87, 2, 88, 7,
        88, 2, 89, 7, 89, 2, 90, 7, 90, 2, 91, 7, 91, 2, 92, 7, 92, 2, 93, 7, 93, 2, 94, 7, 94, 2, 95, 7, 95, 2, 96, 7, 96, 2, 97, 7, 97, 2, 98, 7, 98, 2, 99, 7, 99, 2, 100, 7, 100, 2, 101,
        7, 101, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 3, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4, 1, 5, 1, 5, 1, 5, 1, 6, 1, 6, 1, 6, 1, 7, 1, 7, 1, 7, 1, 8, 1, 8, 1, 8, 1, 9, 1, 9,
        1, 9, 1, 10, 1, 10, 1, 10, 1, 11, 1, 11, 1, 11, 1, 12, 1, 12, 1, 12, 1, 13, 1, 13, 1, 13, 1, 14, 1, 14, 1, 14, 1, 15, 1, 15, 1, 15, 1, 16, 1, 16, 1, 16, 1, 17, 1, 17, 1, 17, 1, 18,
        1, 18, 1, 18, 1, 19, 1, 19, 1, 19, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 21, 1, 21, 1, 21, 1, 21, 1, 21, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 24,
        1, 24, 1, 24, 1, 24, 1, 24, 1, 25, 1, 25, 1, 25, 1, 25, 1, 25, 3, 25, 300, 8, 25, 1, 25, 1, 25, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1,
        28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 3, 29, 329, 8, 29, 1, 29, 1, 29, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 31, 1, 31, 1, 31, 1,
        31, 1, 31, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1, 34, 1, 34, 1, 34, 1, 35, 1, 35, 1, 35, 1, 36, 1, 36, 1, 36, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1,
        38, 1, 38, 1, 38, 1, 38, 1, 38, 1, 39, 1, 39, 1, 39, 1, 39, 3, 39, 376, 8, 39, 1, 39, 1, 39, 1, 40, 1, 40, 1, 40, 1, 40, 1, 40, 1, 41, 1, 41, 1, 41, 1, 42, 1, 42, 1, 42, 1, 42, 1,
        42, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 44, 1, 44, 1, 44, 1, 44, 1, 44, 1, 45, 1, 45, 1, 45, 1, 45, 1, 45, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 47, 1, 47, 1, 47, 3, 47, 416, 8,
        47, 1, 47, 1, 47, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 3, 48, 425, 8, 48, 1, 48, 1, 48, 1, 49, 1, 49, 1, 49, 1, 49, 1, 49, 1, 50, 1, 50, 1, 50, 1, 51, 1, 51, 1, 51, 1, 52, 1, 52, 1,
        52, 1, 53, 1, 53, 3, 53, 445, 8, 53, 1, 53, 1, 53, 1, 54, 1, 54, 1, 54, 1, 54, 1, 54, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 5, 55, 459, 8, 55, 10, 55, 12, 55, 462, 9, 55, 1, 55, 1, 55,
        1, 55, 1, 56, 1, 56, 1, 56, 1, 56, 1, 56, 1, 56, 5, 56, 473, 8, 56, 10, 56, 12, 56, 476, 9, 56, 1, 56, 3, 56, 479, 8, 56, 1, 56, 1, 56, 1, 57, 1, 57, 1, 57, 1, 58, 3, 58, 487, 8, 58,
        1, 58, 1, 58, 1, 58, 3, 58, 492, 8, 58, 1, 58, 1, 58, 1, 58, 1, 59, 1, 59, 5, 59, 499, 8, 59, 10, 59, 12, 59, 502, 9, 59, 1, 59, 1, 59, 1, 59, 1, 59, 1, 59, 3, 59, 509, 8, 59, 1, 60,
        1, 60, 1, 61, 4, 61, 514, 8, 61, 11, 61, 12, 61, 515, 1, 61, 1, 61, 1, 62, 1, 62, 1, 62, 1, 63, 1, 63, 1, 63, 1, 63, 1, 63, 1, 64, 1, 64, 1, 64, 1, 65, 4, 65, 532, 8, 65, 11, 65, 12,
        65, 533, 1, 65, 1, 65, 1, 66, 1, 66, 1, 66, 1, 67, 1, 67, 1, 67, 1, 67, 1, 67, 1, 68, 1, 68, 1, 68, 1, 68, 1, 69, 1, 69, 1, 69, 1, 69, 1, 70, 1, 70, 1, 70, 3, 70, 557, 8, 70, 1, 70,
        3, 70, 560, 8, 70, 1, 70, 1, 70, 1, 71, 1, 71, 1, 71, 1, 71, 3, 71, 568, 8, 71, 1, 71, 1, 71, 1, 72, 1, 72, 1, 72, 1, 72, 3, 72, 576, 8, 72, 1, 72, 3, 72, 579, 8, 72, 1, 72, 3, 72,
        582, 8, 72, 1, 72, 1, 72, 1, 73, 1, 73, 1, 73, 1, 74, 3, 74, 590, 8, 74, 1, 74, 1, 74, 1, 74, 3, 74, 595, 8, 74, 1, 74, 1, 74, 1, 74, 1, 75, 3, 75, 601, 8, 75, 1, 75, 1, 75, 1, 75,
        3, 75, 606, 8, 75, 1, 75, 3, 75, 609, 8, 75, 1, 75, 1, 75, 1, 76, 5, 76, 614, 8, 76, 10, 76, 12, 76, 617, 9, 76, 1, 76, 1, 76, 1, 76, 1, 76, 1, 77, 5, 77, 624, 8, 77, 10, 77, 12, 77,
        627, 9, 77, 1, 77, 1, 77, 1, 77, 1, 78, 1, 78, 1, 78, 1, 78, 1, 78, 5, 78, 637, 8, 78, 10, 78, 12, 78, 640, 9, 78, 1, 78, 1, 78, 1, 78, 1, 79, 1, 79, 3, 79, 647, 8, 79, 1, 79, 1, 79,
        1, 79, 3, 79, 652, 8, 79, 1, 79, 1, 79, 1, 79, 1, 80, 1, 80, 1, 80, 5, 80, 660, 8, 80, 10, 80, 12, 80, 663, 9, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1,
        82, 1, 82, 1, 82, 1, 82, 1, 83, 1, 83, 1, 83, 1, 84, 1, 84, 1, 84, 1, 85, 1, 85, 5, 85, 686, 8, 85, 10, 85, 12, 85, 689, 9, 85, 1, 85, 1, 85, 1, 86, 1, 86, 1, 86, 1, 87, 1, 87, 1,
        87, 1, 88, 4, 88, 700, 8, 88, 11, 88, 12, 88, 701, 1, 88, 1, 88, 1, 89, 1, 89, 1, 90, 1, 90, 3, 90, 710, 8, 90, 1, 90, 3, 90, 713, 8, 90, 1, 91, 4, 91, 716, 8, 91, 11, 91, 12, 91,
        717, 1, 92, 1, 92, 5, 92, 722, 8, 92, 10, 92, 12, 92, 725, 9, 92, 1, 93, 1, 93, 3, 93, 729, 8, 93, 1, 93, 1, 93, 3, 93, 733, 8, 93, 1, 93, 5, 93, 736, 8, 93, 10, 93, 12, 93, 739, 9,
        93, 1, 94, 1, 94, 3, 94, 743, 8, 94, 1, 94, 3, 94, 746, 8, 94, 1, 94, 1, 94, 3, 94, 750, 8, 94, 1, 94, 1, 94, 3, 94, 754, 8, 94, 1, 94, 1, 94, 1, 94, 1, 94, 3, 94, 760, 8, 94, 1, 94,
        3, 94, 763, 8, 94, 1, 94, 1, 94, 3, 94, 767, 8, 94, 1, 94, 1, 94, 3, 94, 771, 8, 94, 1, 94, 1, 94, 1, 94, 1, 94, 3, 94, 777, 8, 94, 1, 94, 3, 94, 780, 8, 94, 1, 94, 1, 94, 3, 94,
        784, 8, 94, 1, 94, 1, 94, 3, 94, 788, 8, 94, 1, 94, 1, 94, 1, 94, 1, 94, 3, 94, 794, 8, 94, 1, 94, 3, 94, 797, 8, 94, 1, 94, 1, 94, 3, 94, 801, 8, 94, 1, 94, 1, 94, 3, 94, 805, 8,
        94, 3, 94, 807, 8, 94, 1, 95, 1, 95, 1, 95, 1, 95, 1, 95, 1, 95, 1, 95, 1, 95, 1, 95, 3, 95, 818, 8, 95, 1, 96, 1, 96, 1, 96, 1, 96, 1, 96, 1, 96, 1, 96, 1, 96, 3, 96, 828, 8, 96, 3,
        96, 830, 8, 96, 1, 97, 1, 97, 5, 97, 834, 8, 97, 10, 97, 12, 97, 837, 9, 97, 1, 98, 1, 98, 5, 98, 841, 8, 98, 10, 98, 12, 98, 844, 9, 98, 1, 99, 1, 99, 5, 99, 848, 8, 99, 10, 99, 12,
        99, 851, 9, 99, 1, 100, 1, 100, 5, 100, 855, 8, 100, 10, 100, 12, 100, 858, 9, 100, 1, 101, 3, 101, 861, 8, 101, 1, 101, 1, 101, 1, 615, 0, 102, 5, 47, 7, 48, 9, 49, 11, 50, 13, 51,
        15, 52, 17, 53, 19, 54, 21, 55, 23, 56, 25, 57, 27, 58, 29, 59, 31, 60, 33, 61, 35, 62, 37, 63, 39, 64, 41, 65, 43, 66, 45, 67, 47, 68, 49, 69, 51, 70, 53, 71, 55, 72, 57, 73, 59,
        74, 61, 75, 63, 76, 65, 77, 67, 78, 69, 79, 71, 80, 73, 81, 75, 82, 77, 83, 79, 84, 81, 85, 83, 86, 85, 87, 87, 88, 89, 89, 91, 90, 93, 91, 95, 92, 97, 93, 99, 94, 101, 95, 103, 96,
        105, 97, 107, 98, 109, 99, 111, 100, 113, 101, 115, 102, 117, 103, 119, 104, 121, 105, 123, 106, 125, 107, 127, 108, 129, 109, 131, 110, 133, 111, 135, 112, 137, 113, 139, 114, 141,
        115, 143, 116, 145, 117, 147, 118, 149, 119, 151, 120, 153, 121, 155, 122, 157, 123, 159, 124, 161, 125, 163, 126, 165, 127, 167, 128, 169, 129, 171, 130, 173, 131, 175, 132, 177,
        133, 179, 134, 181, 135, 183, 0, 185, 0, 187, 0, 189, 0, 191, 0, 193, 0, 195, 0, 197, 0, 199, 0, 201, 0, 203, 0, 205, 0, 207, 0, 5, 0, 1, 2, 3, 4, 26, 2, 0, 73, 74, 105, 106, 5, 0,
        39, 39, 42, 42, 47, 47, 92, 92, 94, 94, 2, 0, 10, 10, 13, 13, 3, 0, 10, 10, 13, 13, 39, 39, 4, 0, 10, 10, 13, 13, 34, 34, 92, 92, 8, 0, 34, 34, 39, 39, 92, 92, 98, 98, 102, 102, 110,
        110, 114, 114, 116, 116, 1, 0, 48, 55, 3, 0, 48, 57, 65, 70, 97, 102, 5, 0, 9, 10, 13, 13, 32, 32, 34, 34, 39, 39, 2, 0, 35, 35, 37, 37, 2, 0, 9, 9, 32, 32, 3, 0, 65, 90, 95, 95, 97,
        122, 4, 0, 48, 57, 65, 90, 95, 95, 97, 122, 2, 0, 68, 69, 100, 101, 2, 0, 66, 66, 98, 98, 2, 0, 80, 80, 112, 112, 2, 0, 79, 79, 111, 111, 2, 0, 88, 88, 120, 120, 2, 0, 115, 115, 117,
        117, 1, 0, 48, 57, 2, 0, 48, 57, 95, 95, 1, 0, 48, 49, 2, 0, 48, 49, 95, 95, 2, 0, 48, 55, 95, 95, 4, 0, 48, 57, 65, 70, 95, 95, 97, 102, 2, 0, 43, 43, 45, 45, 917, 0, 5, 1, 0, 0, 0,
        0, 7, 1, 0, 0, 0, 0, 9, 1, 0, 0, 0, 0, 11, 1, 0, 0, 0, 0, 13, 1, 0, 0, 0, 0, 15, 1, 0, 0, 0, 0, 17, 1, 0, 0, 0, 0, 19, 1, 0, 0, 0, 0, 21, 1, 0, 0, 0, 0, 23, 1, 0, 0, 0, 0, 25, 1, 0,
        0, 0, 0, 27, 1, 0, 0, 0, 0, 29, 1, 0, 0, 0, 0, 31, 1, 0, 0, 0, 0, 33, 1, 0, 0, 0, 0, 35, 1, 0, 0, 0, 0, 37, 1, 0, 0, 0, 0, 39, 1, 0, 0, 0, 0, 41, 1, 0, 0, 0, 0, 43, 1, 0, 0, 0, 0,
        45, 1, 0, 0, 0, 0, 47, 1, 0, 0, 0, 0, 49, 1, 0, 0, 0, 0, 51, 1, 0, 0, 0, 0, 53, 1, 0, 0, 0, 0, 55, 1, 0, 0, 0, 0, 57, 1, 0, 0, 0, 0, 59, 1, 0, 0, 0, 0, 61, 1, 0, 0, 0, 0, 63, 1, 0,
        0, 0, 0, 65, 1, 0, 0, 0, 0, 67, 1, 0, 0, 0, 0, 69, 1, 0, 0, 0, 0, 71, 1, 0, 0, 0, 0, 73, 1, 0, 0, 0, 0, 75, 1, 0, 0, 0, 0, 77, 1, 0, 0, 0, 0, 79, 1, 0, 0, 0, 0, 81, 1, 0, 0, 0, 0,
        83, 1, 0, 0, 0, 0, 85, 1, 0, 0, 0, 0, 87, 1, 0, 0, 0, 0, 89, 1, 0, 0, 0, 0, 91, 1, 0, 0, 0, 0, 93, 1, 0, 0, 0, 0, 95, 1, 0, 0, 0, 0, 97, 1, 0, 0, 0, 0, 99, 1, 0, 0, 0, 0, 101, 1, 0,
        0, 0, 0, 103, 1, 0, 0, 0, 0, 105, 1, 0, 0, 0, 0, 107, 1, 0, 0, 0, 0, 109, 1, 0, 0, 0, 0, 111, 1, 0, 0, 0, 0, 113, 1, 0, 0, 0, 0, 115, 1, 0, 0, 0, 0, 117, 1, 0, 0, 0, 0, 119, 1, 0, 0,
        0, 0, 121, 1, 0, 0, 0, 0, 123, 1, 0, 0, 0, 0, 125, 1, 0, 0, 0, 1, 127, 1, 0, 0, 0, 1, 129, 1, 0, 0, 0, 1, 131, 1, 0, 0, 0, 1, 133, 1, 0, 0, 0, 2, 135, 1, 0, 0, 0, 2, 137, 1, 0, 0, 0,
        2, 139, 1, 0, 0, 0, 2, 141, 1, 0, 0, 0, 2, 143, 1, 0, 0, 0, 2, 145, 1, 0, 0, 0, 2, 147, 1, 0, 0, 0, 2, 149, 1, 0, 0, 0, 2, 151, 1, 0, 0, 0, 3, 153, 1, 0, 0, 0, 3, 155, 1, 0, 0, 0, 3,
        157, 1, 0, 0, 0, 3, 159, 1, 0, 0, 0, 4, 161, 1, 0, 0, 0, 4, 163, 1, 0, 0, 0, 4, 165, 1, 0, 0, 0, 4, 167, 1, 0, 0, 0, 4, 169, 1, 0, 0, 0, 4, 171, 1, 0, 0, 0, 4, 173, 1, 0, 0, 0, 4,
        175, 1, 0, 0, 0, 4, 177, 1, 0, 0, 0, 4, 179, 1, 0, 0, 0, 4, 181, 1, 0, 0, 0, 5, 209, 1, 0, 0, 0, 7, 212, 1, 0, 0, 0, 9, 215, 1, 0, 0, 0, 11, 218, 1, 0, 0, 0, 13, 221, 1, 0, 0, 0, 15,
        224, 1, 0, 0, 0, 17, 227, 1, 0, 0, 0, 19, 230, 1, 0, 0, 0, 21, 233, 1, 0, 0, 0, 23, 236, 1, 0, 0, 0, 25, 239, 1, 0, 0, 0, 27, 242, 1, 0, 0, 0, 29, 245, 1, 0, 0, 0, 31, 248, 1, 0, 0,
        0, 33, 251, 1, 0, 0, 0, 35, 254, 1, 0, 0, 0, 37, 257, 1, 0, 0, 0, 39, 260, 1, 0, 0, 0, 41, 263, 1, 0, 0, 0, 43, 266, 1, 0, 0, 0, 45, 269, 1, 0, 0, 0, 47, 274, 1, 0, 0, 0, 49, 279, 1,
        0, 0, 0, 51, 284, 1, 0, 0, 0, 53, 289, 1, 0, 0, 0, 55, 299, 1, 0, 0, 0, 57, 303, 1, 0, 0, 0, 59, 309, 1, 0, 0, 0, 61, 315, 1, 0, 0, 0, 63, 328, 1, 0, 0, 0, 65, 332, 1, 0, 0, 0, 67,
        337, 1, 0, 0, 0, 69, 342, 1, 0, 0, 0, 71, 347, 1, 0, 0, 0, 73, 352, 1, 0, 0, 0, 75, 355, 1, 0, 0, 0, 77, 358, 1, 0, 0, 0, 79, 361, 1, 0, 0, 0, 81, 366, 1, 0, 0, 0, 83, 375, 1, 0, 0,
        0, 85, 379, 1, 0, 0, 0, 87, 384, 1, 0, 0, 0, 89, 387, 1, 0, 0, 0, 91, 392, 1, 0, 0, 0, 93, 397, 1, 0, 0, 0, 95, 402, 1, 0, 0, 0, 97, 407, 1, 0, 0, 0, 99, 415, 1, 0, 0, 0, 101, 424,
        1, 0, 0, 0, 103, 428, 1, 0, 0, 0, 105, 433, 1, 0, 0, 0, 107, 436, 1, 0, 0, 0, 109, 439, 1, 0, 0, 0, 111, 442, 1, 0, 0, 0, 113, 448, 1, 0, 0, 0, 115, 453, 1, 0, 0, 0, 117, 466, 1, 0,
        0, 0, 119, 482, 1, 0, 0, 0, 121, 486, 1, 0, 0, 0, 123, 496, 1, 0, 0, 0, 125, 510, 1, 0, 0, 0, 127, 513, 1, 0, 0, 0, 129, 519, 1, 0, 0, 0, 131, 522, 1, 0, 0, 0, 133, 527, 1, 0, 0, 0,
        135, 531, 1, 0, 0, 0, 137, 537, 1, 0, 0, 0, 139, 540, 1, 0, 0, 0, 141, 545, 1, 0, 0, 0, 143, 549, 1, 0, 0, 0, 145, 553, 1, 0, 0, 0, 147, 563, 1, 0, 0, 0, 149, 571, 1, 0, 0, 0, 151,
        585, 1, 0, 0, 0, 153, 589, 1, 0, 0, 0, 155, 600, 1, 0, 0, 0, 157, 615, 1, 0, 0, 0, 159, 625, 1, 0, 0, 0, 161, 631, 1, 0, 0, 0, 163, 644, 1, 0, 0, 0, 165, 656, 1, 0, 0, 0, 167, 668,
        1, 0, 0, 0, 169, 673, 1, 0, 0, 0, 171, 677, 1, 0, 0, 0, 173, 680, 1, 0, 0, 0, 175, 683, 1, 0, 0, 0, 177, 692, 1, 0, 0, 0, 179, 695, 1, 0, 0, 0, 181, 699, 1, 0, 0, 0, 183, 705, 1, 0,
        0, 0, 185, 712, 1, 0, 0, 0, 187, 715, 1, 0, 0, 0, 189, 719, 1, 0, 0, 0, 191, 726, 1, 0, 0, 0, 193, 806, 1, 0, 0, 0, 195, 808, 1, 0, 0, 0, 197, 829, 1, 0, 0, 0, 199, 831, 1, 0, 0, 0,
        201, 838, 1, 0, 0, 0, 203, 845, 1, 0, 0, 0, 205, 852, 1, 0, 0, 0, 207, 860, 1, 0, 0, 0, 209, 210, 5, 43, 0, 0, 210, 211, 6, 0, 0, 0, 211, 6, 1, 0, 0, 0, 212, 213, 5, 45, 0, 0, 213,
        214, 6, 1, 1, 0, 214, 8, 1, 0, 0, 0, 215, 216, 5, 42, 0, 0, 216, 217, 6, 2, 2, 0, 217, 10, 1, 0, 0, 0, 218, 219, 5, 47, 0, 0, 219, 220, 6, 3, 3, 0, 220, 12, 1, 0, 0, 0, 221, 222, 5,
        61, 0, 0, 222, 223, 6, 4, 4, 0, 223, 14, 1, 0, 0, 0, 224, 225, 5, 58, 0, 0, 225, 226, 6, 5, 5, 0, 226, 16, 1, 0, 0, 0, 227, 228, 5, 59, 0, 0, 228, 229, 6, 6, 6, 0, 229, 18, 1, 0, 0,
        0, 230, 231, 5, 44, 0, 0, 231, 232, 6, 7, 7, 0, 232, 20, 1, 0, 0, 0, 233, 234, 5, 46, 0, 0, 234, 235, 6, 8, 8, 0, 235, 22, 1, 0, 0, 0, 236, 237, 5, 126, 0, 0, 237, 238, 6, 9, 9, 0,
        238, 24, 1, 0, 0, 0, 239, 240, 5, 33, 0, 0, 240, 241, 6, 10, 10, 0, 241, 26, 1, 0, 0, 0, 242, 243, 5, 64, 0, 0, 243, 244, 6, 11, 11, 0, 244, 28, 1, 0, 0, 0, 245, 246, 5, 63, 0, 0,
        246, 247, 6, 12, 12, 0, 247, 30, 1, 0, 0, 0, 248, 249, 5, 40, 0, 0, 249, 250, 6, 13, 13, 0, 250, 32, 1, 0, 0, 0, 251, 252, 5, 41, 0, 0, 252, 253, 6, 14, 14, 0, 253, 34, 1, 0, 0, 0,
        254, 255, 5, 91, 0, 0, 255, 256, 6, 15, 15, 0, 256, 36, 1, 0, 0, 0, 257, 258, 5, 93, 0, 0, 258, 259, 6, 16, 16, 0, 259, 38, 1, 0, 0, 0, 260, 261, 5, 123, 0, 0, 261, 262, 6, 17, 17,
        0, 262, 40, 1, 0, 0, 0, 263, 264, 5, 125, 0, 0, 264, 265, 6, 18, 18, 0, 265, 42, 1, 0, 0, 0, 266, 267, 5, 92, 0, 0, 267, 268, 6, 19, 19, 0, 268, 44, 1, 0, 0, 0, 269, 270, 5, 43, 0,
        0, 270, 271, 5, 61, 0, 0, 271, 272, 1, 0, 0, 0, 272, 273, 6, 20, 20, 0, 273, 46, 1, 0, 0, 0, 274, 275, 5, 45, 0, 0, 275, 276, 5, 61, 0, 0, 276, 277, 1, 0, 0, 0, 277, 278, 6, 21, 21,
        0, 278, 48, 1, 0, 0, 0, 279, 280, 5, 42, 0, 0, 280, 281, 5, 61, 0, 0, 281, 282, 1, 0, 0, 0, 282, 283, 6, 22, 22, 0, 283, 50, 1, 0, 0, 0, 284, 285, 5, 47, 0, 0, 285, 286, 5, 61, 0, 0,
        286, 287, 1, 0, 0, 0, 287, 288, 6, 23, 23, 0, 288, 52, 1, 0, 0, 0, 289, 290, 5, 92, 0, 0, 290, 291, 5, 61, 0, 0, 291, 292, 1, 0, 0, 0, 292, 293, 6, 24, 24, 0, 293, 54, 1, 0, 0, 0,
        294, 295, 5, 94, 0, 0, 295, 300, 5, 61, 0, 0, 296, 297, 5, 42, 0, 0, 297, 298, 5, 42, 0, 0, 298, 300, 5, 61, 0, 0, 299, 294, 1, 0, 0, 0, 299, 296, 1, 0, 0, 0, 300, 301, 1, 0, 0, 0,
        301, 302, 6, 25, 25, 0, 302, 56, 1, 0, 0, 0, 303, 304, 5, 46, 0, 0, 304, 305, 5, 42, 0, 0, 305, 306, 5, 61, 0, 0, 306, 307, 1, 0, 0, 0, 307, 308, 6, 26, 26, 0, 308, 58, 1, 0, 0, 0,
        309, 310, 5, 46, 0, 0, 310, 311, 5, 47, 0, 0, 311, 312, 5, 61, 0, 0, 312, 313, 1, 0, 0, 0, 313, 314, 6, 27, 27, 0, 314, 60, 1, 0, 0, 0, 315, 316, 5, 46, 0, 0, 316, 317, 5, 92, 0, 0,
        317, 318, 5, 61, 0, 0, 318, 319, 1, 0, 0, 0, 319, 320, 6, 28, 28, 0, 320, 62, 1, 0, 0, 0, 321, 322, 5, 46, 0, 0, 322, 323, 5, 94, 0, 0, 323, 329, 5, 61, 0, 0, 324, 325, 5, 46, 0, 0,
        325, 326, 5, 42, 0, 0, 326, 327, 5, 42, 0, 0, 327, 329, 5, 61, 0, 0, 328, 321, 1, 0, 0, 0, 328, 324, 1, 0, 0, 0, 329, 330, 1, 0, 0, 0, 330, 331, 6, 29, 29, 0, 331, 64, 1, 0, 0, 0,
        332, 333, 5, 38, 0, 0, 333, 334, 5, 61, 0, 0, 334, 335, 1, 0, 0, 0, 335, 336, 6, 30, 30, 0, 336, 66, 1, 0, 0, 0, 337, 338, 5, 124, 0, 0, 338, 339, 5, 61, 0, 0, 339, 340, 1, 0, 0, 0,
        340, 341, 6, 31, 31, 0, 341, 68, 1, 0, 0, 0, 342, 343, 5, 38, 0, 0, 343, 344, 5, 38, 0, 0, 344, 345, 1, 0, 0, 0, 345, 346, 6, 32, 32, 0, 346, 70, 1, 0, 0, 0, 347, 348, 5, 124, 0, 0,
        348, 349, 5, 124, 0, 0, 349, 350, 1, 0, 0, 0, 350, 351, 6, 33, 33, 0, 351, 72, 1, 0, 0, 0, 352, 353, 5, 38, 0, 0, 353, 354, 6, 34, 34, 0, 354, 74, 1, 0, 0, 0, 355, 356, 5, 124, 0, 0,
        356, 357, 6, 35, 35, 0, 357, 76, 1, 0, 0, 0, 358, 359, 5, 60, 0, 0, 359, 360, 6, 36, 36, 0, 360, 78, 1, 0, 0, 0, 361, 362, 5, 60, 0, 0, 362, 363, 5, 61, 0, 0, 363, 364, 1, 0, 0, 0,
        364, 365, 6, 37, 37, 0, 365, 80, 1, 0, 0, 0, 366, 367, 5, 61, 0, 0, 367, 368, 5, 61, 0, 0, 368, 369, 1, 0, 0, 0, 369, 370, 6, 38, 38, 0, 370, 82, 1, 0, 0, 0, 371, 372, 5, 33, 0, 0,
        372, 376, 5, 61, 0, 0, 373, 374, 5, 126, 0, 0, 374, 376, 5, 61, 0, 0, 375, 371, 1, 0, 0, 0, 375, 373, 1, 0, 0, 0, 376, 377, 1, 0, 0, 0, 377, 378, 6, 39, 39, 0, 378, 84, 1, 0, 0, 0,
        379, 380, 5, 62, 0, 0, 380, 381, 5, 61, 0, 0, 381, 382, 1, 0, 0, 0, 382, 383, 6, 40, 40, 0, 383, 86, 1, 0, 0, 0, 384, 385, 5, 62, 0, 0, 385, 386, 6, 41, 41, 0, 386, 88, 1, 0, 0, 0,
        387, 388, 5, 46, 0, 0, 388, 389, 5, 42, 0, 0, 389, 390, 1, 0, 0, 0, 390, 391, 6, 42, 42, 0, 391, 90, 1, 0, 0, 0, 392, 393, 5, 46, 0, 0, 393, 394, 5, 47, 0, 0, 394, 395, 1, 0, 0, 0,
        395, 396, 6, 43, 43, 0, 396, 92, 1, 0, 0, 0, 397, 398, 5, 46, 0, 0, 398, 399, 5, 92, 0, 0, 399, 400, 1, 0, 0, 0, 400, 401, 6, 44, 44, 0, 401, 94, 1, 0, 0, 0, 402, 403, 5, 43, 0, 0,
        403, 404, 5, 43, 0, 0, 404, 405, 1, 0, 0, 0, 405, 406, 6, 45, 45, 0, 406, 96, 1, 0, 0, 0, 407, 408, 5, 45, 0, 0, 408, 409, 5, 45, 0, 0, 409, 410, 1, 0, 0, 0, 410, 411, 6, 46, 46, 0,
        411, 98, 1, 0, 0, 0, 412, 416, 5, 94, 0, 0, 413, 414, 5, 42, 0, 0, 414, 416, 5, 42, 0, 0, 415, 412, 1, 0, 0, 0, 415, 413, 1, 0, 0, 0, 416, 417, 1, 0, 0, 0, 417, 418, 6, 47, 47, 0,
        418, 100, 1, 0, 0, 0, 419, 420, 5, 46, 0, 0, 420, 425, 5, 94, 0, 0, 421, 422, 5, 46, 0, 0, 422, 423, 5, 42, 0, 0, 423, 425, 5, 42, 0, 0, 424, 419, 1, 0, 0, 0, 424, 421, 1, 0, 0, 0,
        425, 426, 1, 0, 0, 0, 426, 427, 6, 48, 48, 0, 427, 102, 1, 0, 0, 0, 428, 429, 5, 46, 0, 0, 429, 430, 5, 39, 0, 0, 430, 431, 1, 0, 0, 0, 431, 432, 6, 49, 49, 0, 432, 104, 1, 0, 0, 0,
        433, 434, 5, 39, 0, 0, 434, 435, 6, 50, 50, 0, 435, 106, 1, 0, 0, 0, 436, 437, 5, 34, 0, 0, 437, 438, 6, 51, 51, 0, 438, 108, 1, 0, 0, 0, 439, 440, 3, 189, 92, 0, 440, 441, 6, 52,
        52, 0, 441, 110, 1, 0, 0, 0, 442, 444, 3, 193, 94, 0, 443, 445, 7, 0, 0, 0, 444, 443, 1, 0, 0, 0, 444, 445, 1, 0, 0, 0, 445, 446, 1, 0, 0, 0, 446, 447, 6, 53, 53, 0, 447, 112, 1, 0,
        0, 0, 448, 449, 3, 197, 96, 0, 449, 450, 5, 46, 0, 0, 450, 451, 7, 1, 0, 0, 451, 452, 6, 54, 54, 0, 452, 114, 1, 0, 0, 0, 453, 454, 5, 46, 0, 0, 454, 455, 5, 46, 0, 0, 455, 456, 5,
        46, 0, 0, 456, 460, 1, 0, 0, 0, 457, 459, 8, 2, 0, 0, 458, 457, 1, 0, 0, 0, 459, 462, 1, 0, 0, 0, 460, 458, 1, 0, 0, 0, 460, 461, 1, 0, 0, 0, 461, 463, 1, 0, 0, 0, 462, 460, 1, 0, 0,
        0, 463, 464, 3, 185, 90, 0, 464, 465, 6, 55, 55, 0, 465, 116, 1, 0, 0, 0, 466, 478, 3, 187, 91, 0, 467, 468, 5, 46, 0, 0, 468, 469, 5, 46, 0, 0, 469, 470, 5, 46, 0, 0, 470, 474, 1,
        0, 0, 0, 471, 473, 8, 2, 0, 0, 472, 471, 1, 0, 0, 0, 473, 476, 1, 0, 0, 0, 474, 472, 1, 0, 0, 0, 474, 475, 1, 0, 0, 0, 475, 477, 1, 0, 0, 0, 476, 474, 1, 0, 0, 0, 477, 479, 3, 185,
        90, 0, 478, 467, 1, 0, 0, 0, 478, 479, 1, 0, 0, 0, 479, 480, 1, 0, 0, 0, 480, 481, 6, 56, 56, 0, 481, 118, 1, 0, 0, 0, 482, 483, 3, 185, 90, 0, 483, 484, 6, 57, 57, 0, 484, 120, 1,
        0, 0, 0, 485, 487, 3, 187, 91, 0, 486, 485, 1, 0, 0, 0, 486, 487, 1, 0, 0, 0, 487, 488, 1, 0, 0, 0, 488, 489, 3, 183, 89, 0, 489, 491, 5, 123, 0, 0, 490, 492, 3, 187, 91, 0, 491,
        490, 1, 0, 0, 0, 491, 492, 1, 0, 0, 0, 492, 493, 1, 0, 0, 0, 493, 494, 3, 185, 90, 0, 494, 495, 6, 58, 58, 0, 495, 122, 1, 0, 0, 0, 496, 500, 3, 183, 89, 0, 497, 499, 8, 2, 0, 0,
        498, 497, 1, 0, 0, 0, 499, 502, 1, 0, 0, 0, 500, 498, 1, 0, 0, 0, 500, 501, 1, 0, 0, 0, 501, 508, 1, 0, 0, 0, 502, 500, 1, 0, 0, 0, 503, 504, 3, 185, 90, 0, 504, 505, 6, 59, 59, 0,
        505, 509, 1, 0, 0, 0, 506, 507, 5, 0, 0, 1, 507, 509, 6, 59, 60, 0, 508, 503, 1, 0, 0, 0, 508, 506, 1, 0, 0, 0, 509, 124, 1, 0, 0, 0, 510, 511, 9, 0, 0, 0, 511, 126, 1, 0, 0, 0, 512,
        514, 8, 3, 0, 0, 513, 512, 1, 0, 0, 0, 514, 515, 1, 0, 0, 0, 515, 513, 1, 0, 0, 0, 515, 516, 1, 0, 0, 0, 516, 517, 1, 0, 0, 0, 517, 518, 6, 61, 61, 0, 518, 128, 1, 0, 0, 0, 519, 520,
        3, 185, 90, 0, 520, 521, 6, 62, 62, 0, 521, 130, 1, 0, 0, 0, 522, 523, 5, 39, 0, 0, 523, 524, 5, 39, 0, 0, 524, 525, 1, 0, 0, 0, 525, 526, 6, 63, 63, 0, 526, 132, 1, 0, 0, 0, 527,
        528, 5, 39, 0, 0, 528, 529, 6, 64, 64, 0, 529, 134, 1, 0, 0, 0, 530, 532, 8, 4, 0, 0, 531, 530, 1, 0, 0, 0, 532, 533, 1, 0, 0, 0, 533, 531, 1, 0, 0, 0, 533, 534, 1, 0, 0, 0, 534,
        535, 1, 0, 0, 0, 535, 536, 6, 65, 65, 0, 536, 136, 1, 0, 0, 0, 537, 538, 3, 185, 90, 0, 538, 539, 6, 66, 66, 0, 539, 138, 1, 0, 0, 0, 540, 541, 5, 34, 0, 0, 541, 542, 5, 34, 0, 0,
        542, 543, 1, 0, 0, 0, 543, 544, 6, 67, 67, 0, 544, 140, 1, 0, 0, 0, 545, 546, 5, 92, 0, 0, 546, 547, 7, 5, 0, 0, 547, 548, 6, 68, 68, 0, 548, 142, 1, 0, 0, 0, 549, 550, 5, 92, 0, 0,
        550, 551, 9, 0, 0, 0, 551, 552, 6, 69, 69, 0, 552, 144, 1, 0, 0, 0, 553, 554, 5, 92, 0, 0, 554, 556, 7, 6, 0, 0, 555, 557, 7, 6, 0, 0, 556, 555, 1, 0, 0, 0, 556, 557, 1, 0, 0, 0,
        557, 559, 1, 0, 0, 0, 558, 560, 7, 6, 0, 0, 559, 558, 1, 0, 0, 0, 559, 560, 1, 0, 0, 0, 560, 561, 1, 0, 0, 0, 561, 562, 6, 70, 70, 0, 562, 146, 1, 0, 0, 0, 563, 564, 5, 92, 0, 0,
        564, 565, 5, 120, 0, 0, 565, 567, 7, 7, 0, 0, 566, 568, 7, 7, 0, 0, 567, 566, 1, 0, 0, 0, 567, 568, 1, 0, 0, 0, 568, 569, 1, 0, 0, 0, 569, 570, 6, 71, 71, 0, 570, 148, 1, 0, 0, 0,
        571, 572, 5, 92, 0, 0, 572, 573, 5, 117, 0, 0, 573, 575, 7, 7, 0, 0, 574, 576, 7, 7, 0, 0, 575, 574, 1, 0, 0, 0, 575, 576, 1, 0, 0, 0, 576, 578, 1, 0, 0, 0, 577, 579, 7, 7, 0, 0,
        578, 577, 1, 0, 0, 0, 578, 579, 1, 0, 0, 0, 579, 581, 1, 0, 0, 0, 580, 582, 7, 7, 0, 0, 581, 580, 1, 0, 0, 0, 581, 582, 1, 0, 0, 0, 582, 583, 1, 0, 0, 0, 583, 584, 6, 72, 72, 0, 584,
        150, 1, 0, 0, 0, 585, 586, 5, 34, 0, 0, 586, 587, 6, 73, 73, 0, 587, 152, 1, 0, 0, 0, 588, 590, 3, 187, 91, 0, 589, 588, 1, 0, 0, 0, 589, 590, 1, 0, 0, 0, 590, 591, 1, 0, 0, 0, 591,
        592, 3, 183, 89, 0, 592, 594, 5, 123, 0, 0, 593, 595, 3, 187, 91, 0, 594, 593, 1, 0, 0, 0, 594, 595, 1, 0, 0, 0, 595, 596, 1, 0, 0, 0, 596, 597, 3, 185, 90, 0, 597, 598, 6, 74, 74,
        0, 598, 154, 1, 0, 0, 0, 599, 601, 3, 187, 91, 0, 600, 599, 1, 0, 0, 0, 600, 601, 1, 0, 0, 0, 601, 602, 1, 0, 0, 0, 602, 603, 3, 183, 89, 0, 603, 605, 5, 125, 0, 0, 604, 606, 3, 187,
        91, 0, 605, 604, 1, 0, 0, 0, 605, 606, 1, 0, 0, 0, 606, 608, 1, 0, 0, 0, 607, 609, 3, 185, 90, 0, 608, 607, 1, 0, 0, 0, 608, 609, 1, 0, 0, 0, 609, 610, 1, 0, 0, 0, 610, 611, 6, 75,
        75, 0, 611, 156, 1, 0, 0, 0, 612, 614, 9, 0, 0, 0, 613, 612, 1, 0, 0, 0, 614, 617, 1, 0, 0, 0, 615, 616, 1, 0, 0, 0, 615, 613, 1, 0, 0, 0, 616, 618, 1, 0, 0, 0, 617, 615, 1, 0, 0, 0,
        618, 619, 3, 185, 90, 0, 619, 620, 1, 0, 0, 0, 620, 621, 6, 76, 76, 0, 621, 158, 1, 0, 0, 0, 622, 624, 8, 2, 0, 0, 623, 622, 1, 0, 0, 0, 624, 627, 1, 0, 0, 0, 625, 623, 1, 0, 0, 0,
        625, 626, 1, 0, 0, 0, 626, 628, 1, 0, 0, 0, 627, 625, 1, 0, 0, 0, 628, 629, 5, 0, 0, 1, 629, 630, 6, 77, 77, 0, 630, 160, 1, 0, 0, 0, 631, 632, 5, 46, 0, 0, 632, 633, 5, 46, 0, 0,
        633, 634, 5, 46, 0, 0, 634, 638, 1, 0, 0, 0, 635, 637, 8, 2, 0, 0, 636, 635, 1, 0, 0, 0, 637, 640, 1, 0, 0, 0, 638, 636, 1, 0, 0, 0, 638, 639, 1, 0, 0, 0, 639, 641, 1, 0, 0, 0, 640,
        638, 1, 0, 0, 0, 641, 642, 3, 185, 90, 0, 642, 643, 6, 78, 78, 0, 643, 162, 1, 0, 0, 0, 644, 646, 4, 79, 0, 0, 645, 647, 3, 187, 91, 0, 646, 645, 1, 0, 0, 0, 646, 647, 1, 0, 0, 0,
        647, 648, 1, 0, 0, 0, 648, 649, 3, 183, 89, 0, 649, 651, 5, 123, 0, 0, 650, 652, 3, 187, 91, 0, 651, 650, 1, 0, 0, 0, 651, 652, 1, 0, 0, 0, 652, 653, 1, 0, 0, 0, 653, 654, 3, 185,
        90, 0, 654, 655, 6, 79, 79, 0, 655, 164, 1, 0, 0, 0, 656, 657, 4, 80, 1, 0, 657, 661, 3, 183, 89, 0, 658, 660, 8, 2, 0, 0, 659, 658, 1, 0, 0, 0, 660, 663, 1, 0, 0, 0, 661, 659, 1, 0,
        0, 0, 661, 662, 1, 0, 0, 0, 662, 664, 1, 0, 0, 0, 663, 661, 1, 0, 0, 0, 664, 665, 3, 185, 90, 0, 665, 666, 1, 0, 0, 0, 666, 667, 6, 80, 76, 0, 667, 166, 1, 0, 0, 0, 668, 669, 4, 81,
        2, 0, 669, 670, 3, 185, 90, 0, 670, 671, 1, 0, 0, 0, 671, 672, 6, 81, 76, 0, 672, 168, 1, 0, 0, 0, 673, 674, 3, 187, 91, 0, 674, 675, 1, 0, 0, 0, 675, 676, 6, 82, 76, 0, 676, 170, 1,
        0, 0, 0, 677, 678, 5, 34, 0, 0, 678, 679, 6, 83, 80, 0, 679, 172, 1, 0, 0, 0, 680, 681, 5, 39, 0, 0, 681, 682, 6, 84, 81, 0, 682, 174, 1, 0, 0, 0, 683, 687, 3, 183, 89, 0, 684, 686,
        8, 2, 0, 0, 685, 684, 1, 0, 0, 0, 686, 689, 1, 0, 0, 0, 687, 685, 1, 0, 0, 0, 687, 688, 1, 0, 0, 0, 688, 690, 1, 0, 0, 0, 689, 687, 1, 0, 0, 0, 690, 691, 6, 85, 76, 0, 691, 176, 1,
        0, 0, 0, 692, 693, 3, 185, 90, 0, 693, 694, 6, 86, 82, 0, 694, 178, 1, 0, 0, 0, 695, 696, 5, 0, 0, 1, 696, 697, 6, 87, 83, 0, 697, 180, 1, 0, 0, 0, 698, 700, 8, 8, 0, 0, 699, 698, 1,
        0, 0, 0, 700, 701, 1, 0, 0, 0, 701, 699, 1, 0, 0, 0, 701, 702, 1, 0, 0, 0, 702, 703, 1, 0, 0, 0, 703, 704, 6, 88, 84, 0, 704, 182, 1, 0, 0, 0, 705, 706, 7, 9, 0, 0, 706, 184, 1, 0,
        0, 0, 707, 713, 5, 13, 0, 0, 708, 710, 5, 13, 0, 0, 709, 708, 1, 0, 0, 0, 709, 710, 1, 0, 0, 0, 710, 711, 1, 0, 0, 0, 711, 713, 5, 10, 0, 0, 712, 707, 1, 0, 0, 0, 712, 709, 1, 0, 0,
        0, 713, 186, 1, 0, 0, 0, 714, 716, 7, 10, 0, 0, 715, 714, 1, 0, 0, 0, 716, 717, 1, 0, 0, 0, 717, 715, 1, 0, 0, 0, 717, 718, 1, 0, 0, 0, 718, 188, 1, 0, 0, 0, 719, 723, 7, 11, 0, 0,
        720, 722, 7, 12, 0, 0, 721, 720, 1, 0, 0, 0, 722, 725, 1, 0, 0, 0, 723, 721, 1, 0, 0, 0, 723, 724, 1, 0, 0, 0, 724, 190, 1, 0, 0, 0, 725, 723, 1, 0, 0, 0, 726, 737, 3, 189, 92, 0,
        727, 729, 3, 187, 91, 0, 728, 727, 1, 0, 0, 0, 728, 729, 1, 0, 0, 0, 729, 730, 1, 0, 0, 0, 730, 732, 5, 46, 0, 0, 731, 733, 3, 187, 91, 0, 732, 731, 1, 0, 0, 0, 732, 733, 1, 0, 0, 0,
        733, 734, 1, 0, 0, 0, 734, 736, 3, 189, 92, 0, 735, 728, 1, 0, 0, 0, 736, 739, 1, 0, 0, 0, 737, 735, 1, 0, 0, 0, 737, 738, 1, 0, 0, 0, 738, 192, 1, 0, 0, 0, 739, 737, 1, 0, 0, 0,
        740, 742, 3, 199, 97, 0, 741, 743, 5, 46, 0, 0, 742, 741, 1, 0, 0, 0, 742, 743, 1, 0, 0, 0, 743, 750, 1, 0, 0, 0, 744, 746, 3, 199, 97, 0, 745, 744, 1, 0, 0, 0, 745, 746, 1, 0, 0, 0,
        746, 747, 1, 0, 0, 0, 747, 748, 5, 46, 0, 0, 748, 750, 3, 199, 97, 0, 749, 740, 1, 0, 0, 0, 749, 745, 1, 0, 0, 0, 750, 753, 1, 0, 0, 0, 751, 752, 7, 13, 0, 0, 752, 754, 3, 207, 101,
        0, 753, 751, 1, 0, 0, 0, 753, 754, 1, 0, 0, 0, 754, 807, 1, 0, 0, 0, 755, 756, 5, 48, 0, 0, 756, 766, 7, 14, 0, 0, 757, 759, 3, 201, 98, 0, 758, 760, 5, 46, 0, 0, 759, 758, 1, 0, 0,
        0, 759, 760, 1, 0, 0, 0, 760, 767, 1, 0, 0, 0, 761, 763, 3, 201, 98, 0, 762, 761, 1, 0, 0, 0, 762, 763, 1, 0, 0, 0, 763, 764, 1, 0, 0, 0, 764, 765, 5, 46, 0, 0, 765, 767, 3, 201, 98,
        0, 766, 757, 1, 0, 0, 0, 766, 762, 1, 0, 0, 0, 767, 770, 1, 0, 0, 0, 768, 769, 7, 15, 0, 0, 769, 771, 3, 207, 101, 0, 770, 768, 1, 0, 0, 0, 770, 771, 1, 0, 0, 0, 771, 807, 1, 0, 0,
        0, 772, 773, 5, 48, 0, 0, 773, 783, 7, 16, 0, 0, 774, 776, 3, 203, 99, 0, 775, 777, 5, 46, 0, 0, 776, 775, 1, 0, 0, 0, 776, 777, 1, 0, 0, 0, 777, 784, 1, 0, 0, 0, 778, 780, 3, 203,
        99, 0, 779, 778, 1, 0, 0, 0, 779, 780, 1, 0, 0, 0, 780, 781, 1, 0, 0, 0, 781, 782, 5, 46, 0, 0, 782, 784, 3, 203, 99, 0, 783, 774, 1, 0, 0, 0, 783, 779, 1, 0, 0, 0, 784, 787, 1, 0,
        0, 0, 785, 786, 7, 15, 0, 0, 786, 788, 3, 207, 101, 0, 787, 785, 1, 0, 0, 0, 787, 788, 1, 0, 0, 0, 788, 807, 1, 0, 0, 0, 789, 790, 5, 48, 0, 0, 790, 800, 7, 17, 0, 0, 791, 793, 3,
        205, 100, 0, 792, 794, 5, 46, 0, 0, 793, 792, 1, 0, 0, 0, 793, 794, 1, 0, 0, 0, 794, 801, 1, 0, 0, 0, 795, 797, 3, 205, 100, 0, 796, 795, 1, 0, 0, 0, 796, 797, 1, 0, 0, 0, 797, 798,
        1, 0, 0, 0, 798, 799, 5, 46, 0, 0, 799, 801, 3, 205, 100, 0, 800, 791, 1, 0, 0, 0, 800, 796, 1, 0, 0, 0, 801, 804, 1, 0, 0, 0, 802, 803, 7, 15, 0, 0, 803, 805, 3, 207, 101, 0, 804,
        802, 1, 0, 0, 0, 804, 805, 1, 0, 0, 0, 805, 807, 1, 0, 0, 0, 806, 749, 1, 0, 0, 0, 806, 755, 1, 0, 0, 0, 806, 772, 1, 0, 0, 0, 806, 789, 1, 0, 0, 0, 807, 194, 1, 0, 0, 0, 808, 809,
        3, 197, 96, 0, 809, 817, 7, 18, 0, 0, 810, 818, 5, 56, 0, 0, 811, 812, 5, 49, 0, 0, 812, 818, 5, 54, 0, 0, 813, 814, 5, 51, 0, 0, 814, 818, 5, 50, 0, 0, 815, 816, 5, 54, 0, 0, 816,
        818, 5, 52, 0, 0, 817, 810, 1, 0, 0, 0, 817, 811, 1, 0, 0, 0, 817, 813, 1, 0, 0, 0, 817, 815, 1, 0, 0, 0, 818, 196, 1, 0, 0, 0, 819, 830, 3, 199, 97, 0, 820, 827, 5, 48, 0, 0, 821,
        822, 7, 14, 0, 0, 822, 828, 3, 201, 98, 0, 823, 824, 7, 16, 0, 0, 824, 828, 3, 203, 99, 0, 825, 826, 7, 17, 0, 0, 826, 828, 3, 205, 100, 0, 827, 821, 1, 0, 0, 0, 827, 823, 1, 0, 0,
        0, 827, 825, 1, 0, 0, 0, 828, 830, 1, 0, 0, 0, 829, 819, 1, 0, 0, 0, 829, 820, 1, 0, 0, 0, 830, 198, 1, 0, 0, 0, 831, 835, 7, 19, 0, 0, 832, 834, 7, 20, 0, 0, 833, 832, 1, 0, 0, 0,
        834, 837, 1, 0, 0, 0, 835, 833, 1, 0, 0, 0, 835, 836, 1, 0, 0, 0, 836, 200, 1, 0, 0, 0, 837, 835, 1, 0, 0, 0, 838, 842, 7, 21, 0, 0, 839, 841, 7, 22, 0, 0, 840, 839, 1, 0, 0, 0, 841,
        844, 1, 0, 0, 0, 842, 840, 1, 0, 0, 0, 842, 843, 1, 0, 0, 0, 843, 202, 1, 0, 0, 0, 844, 842, 1, 0, 0, 0, 845, 849, 7, 6, 0, 0, 846, 848, 7, 23, 0, 0, 847, 846, 1, 0, 0, 0, 848, 851,
        1, 0, 0, 0, 849, 847, 1, 0, 0, 0, 849, 850, 1, 0, 0, 0, 850, 204, 1, 0, 0, 0, 851, 849, 1, 0, 0, 0, 852, 856, 7, 7, 0, 0, 853, 855, 7, 24, 0, 0, 854, 853, 1, 0, 0, 0, 855, 858, 1, 0,
        0, 0, 856, 854, 1, 0, 0, 0, 856, 857, 1, 0, 0, 0, 857, 206, 1, 0, 0, 0, 858, 856, 1, 0, 0, 0, 859, 861, 7, 25, 0, 0, 860, 859, 1, 0, 0, 0, 860, 861, 1, 0, 0, 0, 861, 862, 1, 0, 0, 0,
        862, 863, 3, 199, 97, 0, 863, 208, 1, 0, 0, 0, 71, 0, 1, 2, 3, 4, 299, 328, 375, 415, 424, 444, 460, 474, 478, 486, 491, 500, 508, 515, 533, 556, 559, 567, 575, 578, 581, 589, 594,
        600, 605, 608, 615, 625, 638, 646, 651, 661, 687, 701, 709, 712, 717, 723, 728, 732, 737, 742, 745, 749, 753, 759, 762, 766, 770, 776, 779, 783, 787, 793, 796, 800, 804, 806, 817,
        827, 829, 835, 842, 849, 856, 860, 85, 1, 0, 0, 1, 1, 1, 1, 2, 2, 1, 3, 3, 1, 4, 4, 1, 5, 5, 1, 6, 6, 1, 7, 7, 1, 8, 8, 1, 9, 9, 1, 10, 10, 1, 11, 11, 1, 12, 12, 1, 13, 13, 1, 14,
        14, 1, 15, 15, 1, 16, 16, 1, 17, 17, 1, 18, 18, 1, 19, 19, 1, 20, 20, 1, 21, 21, 1, 22, 22, 1, 23, 23, 1, 24, 24, 1, 25, 25, 1, 26, 26, 1, 27, 27, 1, 28, 28, 1, 29, 29, 1, 30, 30, 1,
        31, 31, 1, 32, 32, 1, 33, 33, 1, 34, 34, 1, 35, 35, 1, 36, 36, 1, 37, 37, 1, 38, 38, 1, 39, 39, 1, 40, 40, 1, 41, 41, 1, 42, 42, 1, 43, 43, 1, 44, 44, 1, 45, 45, 1, 46, 46, 1, 47,
        47, 1, 48, 48, 1, 49, 49, 1, 50, 50, 1, 51, 51, 1, 52, 52, 1, 53, 53, 1, 54, 54, 1, 55, 55, 1, 56, 56, 1, 57, 57, 1, 58, 58, 1, 59, 59, 1, 59, 60, 1, 61, 61, 1, 62, 62, 1, 63, 63, 1,
        64, 64, 1, 65, 65, 1, 66, 66, 1, 67, 67, 1, 68, 68, 1, 69, 69, 1, 70, 70, 1, 71, 71, 1, 72, 72, 1, 73, 73, 1, 74, 74, 1, 75, 75, 6, 0, 0, 1, 77, 76, 1, 78, 77, 1, 79, 78, 1, 83, 79,
        1, 84, 80, 1, 86, 81, 1, 87, 82, 1, 88, 83,
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
