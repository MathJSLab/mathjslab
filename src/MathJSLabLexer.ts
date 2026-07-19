// Generated from ./src/MathJSLabLexer.g4 by ANTLR 4.13.2
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols
import { ATN, ATNDeserializer, CharStream, DecisionState, DFA, Lexer, LexerATNSimulator, RuleContext, PredictionContextCache, Token } from 'antlr4';
export default class MathJSLabLexer extends Lexer {
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
        'import',
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
        'endarguments',
    ];
    /**
     * Reserved keywords token types.
     */
    public static readonly keywordTypes: number[] = [
        NaN,
        MathJSLabLexer.GLOBAL,
        MathJSLabLexer.PERSISTENT,
        MathJSLabLexer.IMPORT,
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
        MathJSLabLexer.ENDARGUMENTS,
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

    /**
     * Test whether a command-form quoted argument is closed on this logical line.
     *
     * Word-list commands accept raw words, but quoted arguments are useful for
     * preserving spaces. A lone or unclosed quote should remain a raw command
     * argument instead of becoming a syntax error.
     */
    private commandQuoteIsClosed(quoteCode: number): boolean {
        let offset = 1;
        let current = this._input.LA(offset);
        while (current !== Token.EOF && current !== 10 && current !== 13) {
            if (current === quoteCode) {
                const next = this._input.LA(offset + 1);
                if (next === quoteCode) {
                    offset += 2;
                    current = this._input.LA(offset);
                    continue;
                }
                return true;
            }
            offset++;
            current = this._input.LA(offset);
        }
        return false;
    }

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
                this.COMMAND_LONE_DQUOTE_action(localctx, actionIndex);
                break;
            case 84:
                this.COMMAND_LONE_SQUOTE_action(localctx, actionIndex);
                break;
            case 85:
                this.COMMAND_UNCLOSED_DQUOTE_action(localctx, actionIndex);
                break;
            case 86:
                this.COMMAND_UNCLOSED_SQUOTE_action(localctx, actionIndex);
                break;
            case 87:
                this.COMMAND_DQSTRING_action(localctx, actionIndex);
                break;
            case 88:
                this.COMMAND_SQSTRING_action(localctx, actionIndex);
                break;
            case 90:
                this.COMMAND_SEPARATOR_action(localctx, actionIndex);
                break;
            case 91:
                this.EXIT_AT_NEWLINE_action(localctx, actionIndex);
                break;
            case 92:
                this.EXIT_AT_EOF_action(localctx, actionIndex);
                break;
            case 93:
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
                            this.previousTokenType === Token.EOF ||
                            this.previousTokenType === MathJSLabLexer.NEWLINE ||
                            this.previousTokenType === MathJSLabLexer.SEMICOLON ||
                            (this.previousTokenType === MathJSLabLexer.COMMA && this.parenthesisCount === 0 && this.matrixContext.length === 0);
                        let offset = 1;
                        let next = this._input.LA(offset);
                        while (next === 9 || next === 32) {
                            next = this._input.LA(++offset);
                        }
                        if (isCommandName && isCommandPosition && (next !== 40 || offset > 1)) {
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
    private COMMAND_LONE_DQUOTE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 79:
                this.commandContinued = false;
                this.text = '"';
                this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;
                this._type = MathJSLabLexer.UNQUOTED_STRING;

                break;
        }
    }
    private COMMAND_LONE_SQUOTE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 80:
                this.commandContinued = false;
                this.text = "'";
                this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;
                this._type = MathJSLabLexer.UNQUOTED_STRING;

                break;
        }
    }
    private COMMAND_UNCLOSED_DQUOTE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 81:
                this.commandContinued = false;
                this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;
                this._type = MathJSLabLexer.UNQUOTED_STRING;

                break;
        }
    }
    private COMMAND_UNCLOSED_SQUOTE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 82:
                this.commandContinued = false;
                this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;
                this._type = MathJSLabLexer.UNQUOTED_STRING;

                break;
        }
    }
    private COMMAND_DQSTRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 83:
                this.commandContinued = false;
                this.pushMode(MathJSLabLexer.DQ_STRING);
                this.quotedString = '';
                this.skip();

                break;
        }
    }
    private COMMAND_SQSTRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 84:
                this.commandContinued = false;
                this.pushMode(MathJSLabLexer.SQ_STRING);
                this.quotedString = '';
                this.skip();

                break;
        }
    }
    private COMMAND_SEPARATOR_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 85:
                this.commandContinued = false;
                this.popMode();
                this._type = this.previousTokenType = this.text === ',' ? MathJSLabLexer.COMMA : MathJSLabLexer.SEMICOLON;

                break;
        }
    }
    private EXIT_AT_NEWLINE_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 86:
                this.commandContinued = false;
                this.popMode();
                this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;

                break;
        }
    }
    private EXIT_AT_EOF_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 87:
                this.commandContinued = false;
                this.popMode();
                this._type = this.previousTokenType = MathJSLabLexer.EOF;

                break;
        }
    }
    private UNQUOTED_STRING_action(localctx: RuleContext, actionIndex: number): void {
        switch (actionIndex) {
            case 88:
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
            case 83:
                return this.COMMAND_LONE_DQUOTE_sempred(localctx, predIndex);
            case 84:
                return this.COMMAND_LONE_SQUOTE_sempred(localctx, predIndex);
            case 85:
                return this.COMMAND_UNCLOSED_DQUOTE_sempred(localctx, predIndex);
            case 86:
                return this.COMMAND_UNCLOSED_SQUOTE_sempred(localctx, predIndex);
            case 87:
                return this.COMMAND_DQSTRING_sempred(localctx, predIndex);
            case 88:
                return this.COMMAND_SQSTRING_sempred(localctx, predIndex);
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
    private COMMAND_LONE_DQUOTE_sempred(localctx: RuleContext, predIndex: number): boolean {
        switch (predIndex) {
            case 3:
                return [Token.EOF, 9, 10, 13, 32].includes(this._input.LA(1));
        }
        return true;
    }
    private COMMAND_LONE_SQUOTE_sempred(localctx: RuleContext, predIndex: number): boolean {
        switch (predIndex) {
            case 4:
                return [Token.EOF, 9, 10, 13, 32].includes(this._input.LA(1));
        }
        return true;
    }
    private COMMAND_UNCLOSED_DQUOTE_sempred(localctx: RuleContext, predIndex: number): boolean {
        switch (predIndex) {
            case 5:
                return !this.commandQuoteIsClosed(34);
        }
        return true;
    }
    private COMMAND_UNCLOSED_SQUOTE_sempred(localctx: RuleContext, predIndex: number): boolean {
        switch (predIndex) {
            case 6:
                return !this.commandQuoteIsClosed(39);
        }
        return true;
    }
    private COMMAND_DQSTRING_sempred(localctx: RuleContext, predIndex: number): boolean {
        switch (predIndex) {
            case 7:
                return this.commandQuoteIsClosed(34);
        }
        return true;
    }
    private COMMAND_SQSTRING_sempred(localctx: RuleContext, predIndex: number): boolean {
        switch (predIndex) {
            case 8:
                return this.commandQuoteIsClosed(39);
        }
        return true;
    }

    public static readonly _serializedATN: number[] = [
        4, 0, 142, 909, 6, -1, 6, -1, 6, -1, 6, -1, 6, -1, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7,
        10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13, 2, 14, 7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20, 7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7,
        23, 2, 24, 7, 24, 2, 25, 7, 25, 2, 26, 7, 26, 2, 27, 7, 27, 2, 28, 7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7, 31, 2, 32, 7, 32, 2, 33, 7, 33, 2, 34, 7, 34, 2, 35, 7, 35, 2, 36, 7,
        36, 2, 37, 7, 37, 2, 38, 7, 38, 2, 39, 7, 39, 2, 40, 7, 40, 2, 41, 7, 41, 2, 42, 7, 42, 2, 43, 7, 43, 2, 44, 7, 44, 2, 45, 7, 45, 2, 46, 7, 46, 2, 47, 7, 47, 2, 48, 7, 48, 2, 49, 7,
        49, 2, 50, 7, 50, 2, 51, 7, 51, 2, 52, 7, 52, 2, 53, 7, 53, 2, 54, 7, 54, 2, 55, 7, 55, 2, 56, 7, 56, 2, 57, 7, 57, 2, 58, 7, 58, 2, 59, 7, 59, 2, 60, 7, 60, 2, 61, 7, 61, 2, 62, 7,
        62, 2, 63, 7, 63, 2, 64, 7, 64, 2, 65, 7, 65, 2, 66, 7, 66, 2, 67, 7, 67, 2, 68, 7, 68, 2, 69, 7, 69, 2, 70, 7, 70, 2, 71, 7, 71, 2, 72, 7, 72, 2, 73, 7, 73, 2, 74, 7, 74, 2, 75, 7,
        75, 2, 76, 7, 76, 2, 77, 7, 77, 2, 78, 7, 78, 2, 79, 7, 79, 2, 80, 7, 80, 2, 81, 7, 81, 2, 82, 7, 82, 2, 83, 7, 83, 2, 84, 7, 84, 2, 85, 7, 85, 2, 86, 7, 86, 2, 87, 7, 87, 2, 88, 7,
        88, 2, 89, 7, 89, 2, 90, 7, 90, 2, 91, 7, 91, 2, 92, 7, 92, 2, 93, 7, 93, 2, 94, 7, 94, 2, 95, 7, 95, 2, 96, 7, 96, 2, 97, 7, 97, 2, 98, 7, 98, 2, 99, 7, 99, 2, 100, 7, 100, 2, 101,
        7, 101, 2, 102, 7, 102, 2, 103, 7, 103, 2, 104, 7, 104, 2, 105, 7, 105, 2, 106, 7, 106, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 3, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4, 1,
        5, 1, 5, 1, 5, 1, 6, 1, 6, 1, 6, 1, 7, 1, 7, 1, 7, 1, 8, 1, 8, 1, 8, 1, 9, 1, 9, 1, 9, 1, 10, 1, 10, 1, 10, 1, 11, 1, 11, 1, 11, 1, 12, 1, 12, 1, 12, 1, 13, 1, 13, 1, 13, 1, 14, 1,
        14, 1, 14, 1, 15, 1, 15, 1, 15, 1, 16, 1, 16, 1, 16, 1, 17, 1, 17, 1, 17, 1, 18, 1, 18, 1, 18, 1, 19, 1, 19, 1, 19, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 21, 1, 21, 1, 21, 1, 21, 1,
        21, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 25, 1, 25, 1, 25, 1, 25, 1, 25, 3, 25, 310, 8, 25, 1, 25, 1, 25, 1,
        26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 3, 29,
        339, 8, 29, 1, 29, 1, 29, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1, 34, 1, 34, 1,
        34, 1, 35, 1, 35, 1, 35, 1, 36, 1, 36, 1, 36, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1, 38, 1, 38, 1, 38, 1, 38, 1, 38, 1, 39, 1, 39, 1, 39, 1, 39, 3, 39, 386, 8, 39, 1, 39, 1, 39, 1,
        40, 1, 40, 1, 40, 1, 40, 1, 40, 1, 41, 1, 41, 1, 41, 1, 42, 1, 42, 1, 42, 1, 42, 1, 42, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 44, 1, 44, 1, 44, 1, 44, 1, 44, 1, 45, 1, 45, 1, 45, 1,
        45, 1, 45, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 47, 1, 47, 1, 47, 3, 47, 426, 8, 47, 1, 47, 1, 47, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 3, 48, 435, 8, 48, 1, 48, 1, 48, 1, 49, 1, 49,
        1, 49, 1, 49, 1, 49, 1, 50, 1, 50, 1, 50, 1, 51, 1, 51, 1, 51, 1, 52, 1, 52, 1, 52, 1, 53, 1, 53, 3, 53, 455, 8, 53, 1, 53, 1, 53, 1, 54, 1, 54, 1, 54, 1, 54, 1, 54, 1, 55, 1, 55, 1,
        55, 1, 55, 1, 55, 5, 55, 469, 8, 55, 10, 55, 12, 55, 472, 9, 55, 1, 55, 1, 55, 1, 55, 1, 56, 1, 56, 1, 56, 1, 56, 1, 56, 1, 56, 5, 56, 483, 8, 56, 10, 56, 12, 56, 486, 9, 56, 1, 56,
        3, 56, 489, 8, 56, 1, 56, 1, 56, 1, 57, 1, 57, 1, 57, 1, 58, 3, 58, 497, 8, 58, 1, 58, 1, 58, 1, 58, 3, 58, 502, 8, 58, 1, 58, 1, 58, 1, 58, 1, 59, 1, 59, 5, 59, 509, 8, 59, 10, 59,
        12, 59, 512, 9, 59, 1, 59, 1, 59, 1, 59, 1, 59, 1, 59, 3, 59, 519, 8, 59, 1, 60, 1, 60, 1, 61, 4, 61, 524, 8, 61, 11, 61, 12, 61, 525, 1, 61, 1, 61, 1, 62, 1, 62, 1, 62, 1, 63, 1,
        63, 1, 63, 1, 63, 1, 63, 1, 64, 1, 64, 1, 64, 1, 65, 4, 65, 542, 8, 65, 11, 65, 12, 65, 543, 1, 65, 1, 65, 1, 66, 1, 66, 1, 66, 1, 67, 1, 67, 1, 67, 1, 67, 1, 67, 1, 68, 1, 68, 1,
        68, 1, 68, 1, 69, 1, 69, 1, 69, 1, 69, 1, 70, 1, 70, 1, 70, 3, 70, 567, 8, 70, 1, 70, 3, 70, 570, 8, 70, 1, 70, 1, 70, 1, 71, 1, 71, 1, 71, 1, 71, 3, 71, 578, 8, 71, 1, 71, 1, 71, 1,
        72, 1, 72, 1, 72, 1, 72, 3, 72, 586, 8, 72, 1, 72, 3, 72, 589, 8, 72, 1, 72, 3, 72, 592, 8, 72, 1, 72, 1, 72, 1, 73, 1, 73, 1, 73, 1, 74, 3, 74, 600, 8, 74, 1, 74, 1, 74, 1, 74, 3,
        74, 605, 8, 74, 1, 74, 1, 74, 1, 74, 1, 75, 3, 75, 611, 8, 75, 1, 75, 1, 75, 1, 75, 3, 75, 616, 8, 75, 1, 75, 3, 75, 619, 8, 75, 1, 75, 1, 75, 1, 76, 5, 76, 624, 8, 76, 10, 76, 12,
        76, 627, 9, 76, 1, 76, 1, 76, 1, 76, 1, 76, 1, 77, 5, 77, 634, 8, 77, 10, 77, 12, 77, 637, 9, 77, 1, 77, 1, 77, 1, 77, 1, 78, 1, 78, 1, 78, 1, 78, 1, 78, 5, 78, 647, 8, 78, 10, 78,
        12, 78, 650, 9, 78, 1, 78, 1, 78, 1, 78, 1, 79, 1, 79, 3, 79, 657, 8, 79, 1, 79, 1, 79, 1, 79, 3, 79, 662, 8, 79, 1, 79, 1, 79, 1, 79, 1, 80, 1, 80, 1, 80, 5, 80, 670, 8, 80, 10, 80,
        12, 80, 673, 9, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 82, 1, 82, 1, 82, 1, 82, 1, 83, 1, 83, 1, 83, 1, 83, 1, 84, 1, 84, 1, 84, 1, 84, 1, 85, 1, 85,
        1, 85, 5, 85, 699, 8, 85, 10, 85, 12, 85, 702, 9, 85, 1, 85, 1, 85, 1, 86, 1, 86, 1, 86, 5, 86, 709, 8, 86, 10, 86, 12, 86, 712, 9, 86, 1, 86, 1, 86, 1, 87, 1, 87, 1, 87, 1, 87, 1,
        88, 1, 88, 1, 88, 1, 88, 1, 89, 1, 89, 5, 89, 726, 8, 89, 10, 89, 12, 89, 729, 9, 89, 1, 89, 1, 89, 1, 90, 1, 90, 1, 90, 1, 91, 1, 91, 1, 91, 1, 92, 1, 92, 1, 92, 1, 93, 1, 93, 5,
        93, 744, 8, 93, 10, 93, 12, 93, 747, 9, 93, 1, 93, 1, 93, 1, 94, 1, 94, 1, 95, 1, 95, 3, 95, 755, 8, 95, 1, 95, 3, 95, 758, 8, 95, 1, 96, 4, 96, 761, 8, 96, 11, 96, 12, 96, 762, 1,
        97, 1, 97, 5, 97, 767, 8, 97, 10, 97, 12, 97, 770, 9, 97, 1, 98, 1, 98, 3, 98, 774, 8, 98, 1, 98, 1, 98, 3, 98, 778, 8, 98, 1, 98, 5, 98, 781, 8, 98, 10, 98, 12, 98, 784, 9, 98, 1,
        99, 1, 99, 3, 99, 788, 8, 99, 1, 99, 3, 99, 791, 8, 99, 1, 99, 1, 99, 3, 99, 795, 8, 99, 1, 99, 1, 99, 3, 99, 799, 8, 99, 1, 99, 1, 99, 1, 99, 1, 99, 3, 99, 805, 8, 99, 1, 99, 3, 99,
        808, 8, 99, 1, 99, 1, 99, 3, 99, 812, 8, 99, 1, 99, 1, 99, 3, 99, 816, 8, 99, 1, 99, 1, 99, 1, 99, 1, 99, 3, 99, 822, 8, 99, 1, 99, 3, 99, 825, 8, 99, 1, 99, 1, 99, 3, 99, 829, 8,
        99, 1, 99, 1, 99, 3, 99, 833, 8, 99, 1, 99, 1, 99, 1, 99, 1, 99, 3, 99, 839, 8, 99, 1, 99, 3, 99, 842, 8, 99, 1, 99, 1, 99, 3, 99, 846, 8, 99, 1, 99, 1, 99, 3, 99, 850, 8, 99, 3, 99,
        852, 8, 99, 1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 3, 100, 863, 8, 100, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 3, 101, 873,
        8, 101, 3, 101, 875, 8, 101, 1, 102, 1, 102, 5, 102, 879, 8, 102, 10, 102, 12, 102, 882, 9, 102, 1, 103, 1, 103, 5, 103, 886, 8, 103, 10, 103, 12, 103, 889, 9, 103, 1, 104, 1, 104,
        5, 104, 893, 8, 104, 10, 104, 12, 104, 896, 9, 104, 1, 105, 1, 105, 5, 105, 900, 8, 105, 10, 105, 12, 105, 903, 9, 105, 1, 106, 3, 106, 906, 8, 106, 1, 106, 1, 106, 1, 625, 0, 107,
        5, 49, 7, 50, 9, 51, 11, 52, 13, 53, 15, 54, 17, 55, 19, 56, 21, 57, 23, 58, 25, 59, 27, 60, 29, 61, 31, 62, 33, 63, 35, 64, 37, 65, 39, 66, 41, 67, 43, 68, 45, 69, 47, 70, 49, 71,
        51, 72, 53, 73, 55, 74, 57, 75, 59, 76, 61, 77, 63, 78, 65, 79, 67, 80, 69, 81, 71, 82, 73, 83, 75, 84, 77, 85, 79, 86, 81, 87, 83, 88, 85, 89, 87, 90, 89, 91, 91, 92, 93, 93, 95,
        94, 97, 95, 99, 96, 101, 97, 103, 98, 105, 99, 107, 100, 109, 101, 111, 102, 113, 103, 115, 104, 117, 105, 119, 106, 121, 107, 123, 108, 125, 109, 127, 110, 129, 111, 131, 112, 133,
        113, 135, 114, 137, 115, 139, 116, 141, 117, 143, 118, 145, 119, 147, 120, 149, 121, 151, 122, 153, 123, 155, 124, 157, 125, 159, 126, 161, 127, 163, 128, 165, 129, 167, 130, 169,
        131, 171, 132, 173, 133, 175, 134, 177, 135, 179, 136, 181, 137, 183, 138, 185, 139, 187, 140, 189, 141, 191, 142, 193, 0, 195, 0, 197, 0, 199, 0, 201, 0, 203, 0, 205, 0, 207, 0,
        209, 0, 211, 0, 213, 0, 215, 0, 217, 0, 5, 0, 1, 2, 3, 4, 29, 2, 0, 73, 74, 105, 106, 5, 0, 39, 39, 42, 42, 47, 47, 92, 92, 94, 94, 2, 0, 10, 10, 13, 13, 3, 0, 10, 10, 13, 13, 39,
        39, 4, 0, 10, 10, 13, 13, 34, 34, 92, 92, 8, 0, 34, 34, 39, 39, 92, 92, 98, 98, 102, 102, 110, 110, 114, 114, 116, 116, 1, 0, 48, 55, 3, 0, 48, 57, 65, 70, 97, 102, 3, 0, 9, 10, 13,
        13, 32, 32, 2, 0, 44, 44, 59, 59, 7, 0, 9, 10, 13, 13, 32, 32, 34, 34, 39, 39, 44, 44, 59, 59, 5, 0, 9, 10, 13, 13, 32, 32, 44, 44, 59, 59, 2, 0, 35, 35, 37, 37, 2, 0, 9, 9, 32, 32,
        3, 0, 65, 90, 95, 95, 97, 122, 4, 0, 48, 57, 65, 90, 95, 95, 97, 122, 2, 0, 68, 69, 100, 101, 2, 0, 66, 66, 98, 98, 2, 0, 80, 80, 112, 112, 2, 0, 79, 79, 111, 111, 2, 0, 88, 88, 120,
        120, 2, 0, 115, 115, 117, 117, 1, 0, 48, 57, 2, 0, 48, 57, 95, 95, 1, 0, 48, 49, 2, 0, 48, 49, 95, 95, 2, 0, 48, 55, 95, 95, 4, 0, 48, 57, 65, 70, 95, 95, 97, 102, 2, 0, 43, 43, 45,
        45, 964, 0, 5, 1, 0, 0, 0, 0, 7, 1, 0, 0, 0, 0, 9, 1, 0, 0, 0, 0, 11, 1, 0, 0, 0, 0, 13, 1, 0, 0, 0, 0, 15, 1, 0, 0, 0, 0, 17, 1, 0, 0, 0, 0, 19, 1, 0, 0, 0, 0, 21, 1, 0, 0, 0, 0,
        23, 1, 0, 0, 0, 0, 25, 1, 0, 0, 0, 0, 27, 1, 0, 0, 0, 0, 29, 1, 0, 0, 0, 0, 31, 1, 0, 0, 0, 0, 33, 1, 0, 0, 0, 0, 35, 1, 0, 0, 0, 0, 37, 1, 0, 0, 0, 0, 39, 1, 0, 0, 0, 0, 41, 1, 0,
        0, 0, 0, 43, 1, 0, 0, 0, 0, 45, 1, 0, 0, 0, 0, 47, 1, 0, 0, 0, 0, 49, 1, 0, 0, 0, 0, 51, 1, 0, 0, 0, 0, 53, 1, 0, 0, 0, 0, 55, 1, 0, 0, 0, 0, 57, 1, 0, 0, 0, 0, 59, 1, 0, 0, 0, 0,
        61, 1, 0, 0, 0, 0, 63, 1, 0, 0, 0, 0, 65, 1, 0, 0, 0, 0, 67, 1, 0, 0, 0, 0, 69, 1, 0, 0, 0, 0, 71, 1, 0, 0, 0, 0, 73, 1, 0, 0, 0, 0, 75, 1, 0, 0, 0, 0, 77, 1, 0, 0, 0, 0, 79, 1, 0,
        0, 0, 0, 81, 1, 0, 0, 0, 0, 83, 1, 0, 0, 0, 0, 85, 1, 0, 0, 0, 0, 87, 1, 0, 0, 0, 0, 89, 1, 0, 0, 0, 0, 91, 1, 0, 0, 0, 0, 93, 1, 0, 0, 0, 0, 95, 1, 0, 0, 0, 0, 97, 1, 0, 0, 0, 0,
        99, 1, 0, 0, 0, 0, 101, 1, 0, 0, 0, 0, 103, 1, 0, 0, 0, 0, 105, 1, 0, 0, 0, 0, 107, 1, 0, 0, 0, 0, 109, 1, 0, 0, 0, 0, 111, 1, 0, 0, 0, 0, 113, 1, 0, 0, 0, 0, 115, 1, 0, 0, 0, 0,
        117, 1, 0, 0, 0, 0, 119, 1, 0, 0, 0, 0, 121, 1, 0, 0, 0, 0, 123, 1, 0, 0, 0, 0, 125, 1, 0, 0, 0, 1, 127, 1, 0, 0, 0, 1, 129, 1, 0, 0, 0, 1, 131, 1, 0, 0, 0, 1, 133, 1, 0, 0, 0, 2,
        135, 1, 0, 0, 0, 2, 137, 1, 0, 0, 0, 2, 139, 1, 0, 0, 0, 2, 141, 1, 0, 0, 0, 2, 143, 1, 0, 0, 0, 2, 145, 1, 0, 0, 0, 2, 147, 1, 0, 0, 0, 2, 149, 1, 0, 0, 0, 2, 151, 1, 0, 0, 0, 3,
        153, 1, 0, 0, 0, 3, 155, 1, 0, 0, 0, 3, 157, 1, 0, 0, 0, 3, 159, 1, 0, 0, 0, 4, 161, 1, 0, 0, 0, 4, 163, 1, 0, 0, 0, 4, 165, 1, 0, 0, 0, 4, 167, 1, 0, 0, 0, 4, 169, 1, 0, 0, 0, 4,
        171, 1, 0, 0, 0, 4, 173, 1, 0, 0, 0, 4, 175, 1, 0, 0, 0, 4, 177, 1, 0, 0, 0, 4, 179, 1, 0, 0, 0, 4, 181, 1, 0, 0, 0, 4, 183, 1, 0, 0, 0, 4, 185, 1, 0, 0, 0, 4, 187, 1, 0, 0, 0, 4,
        189, 1, 0, 0, 0, 4, 191, 1, 0, 0, 0, 5, 219, 1, 0, 0, 0, 7, 222, 1, 0, 0, 0, 9, 225, 1, 0, 0, 0, 11, 228, 1, 0, 0, 0, 13, 231, 1, 0, 0, 0, 15, 234, 1, 0, 0, 0, 17, 237, 1, 0, 0, 0,
        19, 240, 1, 0, 0, 0, 21, 243, 1, 0, 0, 0, 23, 246, 1, 0, 0, 0, 25, 249, 1, 0, 0, 0, 27, 252, 1, 0, 0, 0, 29, 255, 1, 0, 0, 0, 31, 258, 1, 0, 0, 0, 33, 261, 1, 0, 0, 0, 35, 264, 1, 0,
        0, 0, 37, 267, 1, 0, 0, 0, 39, 270, 1, 0, 0, 0, 41, 273, 1, 0, 0, 0, 43, 276, 1, 0, 0, 0, 45, 279, 1, 0, 0, 0, 47, 284, 1, 0, 0, 0, 49, 289, 1, 0, 0, 0, 51, 294, 1, 0, 0, 0, 53, 299,
        1, 0, 0, 0, 55, 309, 1, 0, 0, 0, 57, 313, 1, 0, 0, 0, 59, 319, 1, 0, 0, 0, 61, 325, 1, 0, 0, 0, 63, 338, 1, 0, 0, 0, 65, 342, 1, 0, 0, 0, 67, 347, 1, 0, 0, 0, 69, 352, 1, 0, 0, 0,
        71, 357, 1, 0, 0, 0, 73, 362, 1, 0, 0, 0, 75, 365, 1, 0, 0, 0, 77, 368, 1, 0, 0, 0, 79, 371, 1, 0, 0, 0, 81, 376, 1, 0, 0, 0, 83, 385, 1, 0, 0, 0, 85, 389, 1, 0, 0, 0, 87, 394, 1, 0,
        0, 0, 89, 397, 1, 0, 0, 0, 91, 402, 1, 0, 0, 0, 93, 407, 1, 0, 0, 0, 95, 412, 1, 0, 0, 0, 97, 417, 1, 0, 0, 0, 99, 425, 1, 0, 0, 0, 101, 434, 1, 0, 0, 0, 103, 438, 1, 0, 0, 0, 105,
        443, 1, 0, 0, 0, 107, 446, 1, 0, 0, 0, 109, 449, 1, 0, 0, 0, 111, 452, 1, 0, 0, 0, 113, 458, 1, 0, 0, 0, 115, 463, 1, 0, 0, 0, 117, 476, 1, 0, 0, 0, 119, 492, 1, 0, 0, 0, 121, 496,
        1, 0, 0, 0, 123, 506, 1, 0, 0, 0, 125, 520, 1, 0, 0, 0, 127, 523, 1, 0, 0, 0, 129, 529, 1, 0, 0, 0, 131, 532, 1, 0, 0, 0, 133, 537, 1, 0, 0, 0, 135, 541, 1, 0, 0, 0, 137, 547, 1, 0,
        0, 0, 139, 550, 1, 0, 0, 0, 141, 555, 1, 0, 0, 0, 143, 559, 1, 0, 0, 0, 145, 563, 1, 0, 0, 0, 147, 573, 1, 0, 0, 0, 149, 581, 1, 0, 0, 0, 151, 595, 1, 0, 0, 0, 153, 599, 1, 0, 0, 0,
        155, 610, 1, 0, 0, 0, 157, 625, 1, 0, 0, 0, 159, 635, 1, 0, 0, 0, 161, 641, 1, 0, 0, 0, 163, 654, 1, 0, 0, 0, 165, 666, 1, 0, 0, 0, 167, 678, 1, 0, 0, 0, 169, 683, 1, 0, 0, 0, 171,
        687, 1, 0, 0, 0, 173, 691, 1, 0, 0, 0, 175, 695, 1, 0, 0, 0, 177, 705, 1, 0, 0, 0, 179, 715, 1, 0, 0, 0, 181, 719, 1, 0, 0, 0, 183, 723, 1, 0, 0, 0, 185, 732, 1, 0, 0, 0, 187, 735,
        1, 0, 0, 0, 189, 738, 1, 0, 0, 0, 191, 741, 1, 0, 0, 0, 193, 750, 1, 0, 0, 0, 195, 757, 1, 0, 0, 0, 197, 760, 1, 0, 0, 0, 199, 764, 1, 0, 0, 0, 201, 771, 1, 0, 0, 0, 203, 851, 1, 0,
        0, 0, 205, 853, 1, 0, 0, 0, 207, 874, 1, 0, 0, 0, 209, 876, 1, 0, 0, 0, 211, 883, 1, 0, 0, 0, 213, 890, 1, 0, 0, 0, 215, 897, 1, 0, 0, 0, 217, 905, 1, 0, 0, 0, 219, 220, 5, 43, 0, 0,
        220, 221, 6, 0, 0, 0, 221, 6, 1, 0, 0, 0, 222, 223, 5, 45, 0, 0, 223, 224, 6, 1, 1, 0, 224, 8, 1, 0, 0, 0, 225, 226, 5, 42, 0, 0, 226, 227, 6, 2, 2, 0, 227, 10, 1, 0, 0, 0, 228, 229,
        5, 47, 0, 0, 229, 230, 6, 3, 3, 0, 230, 12, 1, 0, 0, 0, 231, 232, 5, 61, 0, 0, 232, 233, 6, 4, 4, 0, 233, 14, 1, 0, 0, 0, 234, 235, 5, 58, 0, 0, 235, 236, 6, 5, 5, 0, 236, 16, 1, 0,
        0, 0, 237, 238, 5, 59, 0, 0, 238, 239, 6, 6, 6, 0, 239, 18, 1, 0, 0, 0, 240, 241, 5, 44, 0, 0, 241, 242, 6, 7, 7, 0, 242, 20, 1, 0, 0, 0, 243, 244, 5, 46, 0, 0, 244, 245, 6, 8, 8, 0,
        245, 22, 1, 0, 0, 0, 246, 247, 5, 126, 0, 0, 247, 248, 6, 9, 9, 0, 248, 24, 1, 0, 0, 0, 249, 250, 5, 33, 0, 0, 250, 251, 6, 10, 10, 0, 251, 26, 1, 0, 0, 0, 252, 253, 5, 64, 0, 0,
        253, 254, 6, 11, 11, 0, 254, 28, 1, 0, 0, 0, 255, 256, 5, 63, 0, 0, 256, 257, 6, 12, 12, 0, 257, 30, 1, 0, 0, 0, 258, 259, 5, 40, 0, 0, 259, 260, 6, 13, 13, 0, 260, 32, 1, 0, 0, 0,
        261, 262, 5, 41, 0, 0, 262, 263, 6, 14, 14, 0, 263, 34, 1, 0, 0, 0, 264, 265, 5, 91, 0, 0, 265, 266, 6, 15, 15, 0, 266, 36, 1, 0, 0, 0, 267, 268, 5, 93, 0, 0, 268, 269, 6, 16, 16, 0,
        269, 38, 1, 0, 0, 0, 270, 271, 5, 123, 0, 0, 271, 272, 6, 17, 17, 0, 272, 40, 1, 0, 0, 0, 273, 274, 5, 125, 0, 0, 274, 275, 6, 18, 18, 0, 275, 42, 1, 0, 0, 0, 276, 277, 5, 92, 0, 0,
        277, 278, 6, 19, 19, 0, 278, 44, 1, 0, 0, 0, 279, 280, 5, 43, 0, 0, 280, 281, 5, 61, 0, 0, 281, 282, 1, 0, 0, 0, 282, 283, 6, 20, 20, 0, 283, 46, 1, 0, 0, 0, 284, 285, 5, 45, 0, 0,
        285, 286, 5, 61, 0, 0, 286, 287, 1, 0, 0, 0, 287, 288, 6, 21, 21, 0, 288, 48, 1, 0, 0, 0, 289, 290, 5, 42, 0, 0, 290, 291, 5, 61, 0, 0, 291, 292, 1, 0, 0, 0, 292, 293, 6, 22, 22, 0,
        293, 50, 1, 0, 0, 0, 294, 295, 5, 47, 0, 0, 295, 296, 5, 61, 0, 0, 296, 297, 1, 0, 0, 0, 297, 298, 6, 23, 23, 0, 298, 52, 1, 0, 0, 0, 299, 300, 5, 92, 0, 0, 300, 301, 5, 61, 0, 0,
        301, 302, 1, 0, 0, 0, 302, 303, 6, 24, 24, 0, 303, 54, 1, 0, 0, 0, 304, 305, 5, 94, 0, 0, 305, 310, 5, 61, 0, 0, 306, 307, 5, 42, 0, 0, 307, 308, 5, 42, 0, 0, 308, 310, 5, 61, 0, 0,
        309, 304, 1, 0, 0, 0, 309, 306, 1, 0, 0, 0, 310, 311, 1, 0, 0, 0, 311, 312, 6, 25, 25, 0, 312, 56, 1, 0, 0, 0, 313, 314, 5, 46, 0, 0, 314, 315, 5, 42, 0, 0, 315, 316, 5, 61, 0, 0,
        316, 317, 1, 0, 0, 0, 317, 318, 6, 26, 26, 0, 318, 58, 1, 0, 0, 0, 319, 320, 5, 46, 0, 0, 320, 321, 5, 47, 0, 0, 321, 322, 5, 61, 0, 0, 322, 323, 1, 0, 0, 0, 323, 324, 6, 27, 27, 0,
        324, 60, 1, 0, 0, 0, 325, 326, 5, 46, 0, 0, 326, 327, 5, 92, 0, 0, 327, 328, 5, 61, 0, 0, 328, 329, 1, 0, 0, 0, 329, 330, 6, 28, 28, 0, 330, 62, 1, 0, 0, 0, 331, 332, 5, 46, 0, 0,
        332, 333, 5, 94, 0, 0, 333, 339, 5, 61, 0, 0, 334, 335, 5, 46, 0, 0, 335, 336, 5, 42, 0, 0, 336, 337, 5, 42, 0, 0, 337, 339, 5, 61, 0, 0, 338, 331, 1, 0, 0, 0, 338, 334, 1, 0, 0, 0,
        339, 340, 1, 0, 0, 0, 340, 341, 6, 29, 29, 0, 341, 64, 1, 0, 0, 0, 342, 343, 5, 38, 0, 0, 343, 344, 5, 61, 0, 0, 344, 345, 1, 0, 0, 0, 345, 346, 6, 30, 30, 0, 346, 66, 1, 0, 0, 0,
        347, 348, 5, 124, 0, 0, 348, 349, 5, 61, 0, 0, 349, 350, 1, 0, 0, 0, 350, 351, 6, 31, 31, 0, 351, 68, 1, 0, 0, 0, 352, 353, 5, 38, 0, 0, 353, 354, 5, 38, 0, 0, 354, 355, 1, 0, 0, 0,
        355, 356, 6, 32, 32, 0, 356, 70, 1, 0, 0, 0, 357, 358, 5, 124, 0, 0, 358, 359, 5, 124, 0, 0, 359, 360, 1, 0, 0, 0, 360, 361, 6, 33, 33, 0, 361, 72, 1, 0, 0, 0, 362, 363, 5, 38, 0, 0,
        363, 364, 6, 34, 34, 0, 364, 74, 1, 0, 0, 0, 365, 366, 5, 124, 0, 0, 366, 367, 6, 35, 35, 0, 367, 76, 1, 0, 0, 0, 368, 369, 5, 60, 0, 0, 369, 370, 6, 36, 36, 0, 370, 78, 1, 0, 0, 0,
        371, 372, 5, 60, 0, 0, 372, 373, 5, 61, 0, 0, 373, 374, 1, 0, 0, 0, 374, 375, 6, 37, 37, 0, 375, 80, 1, 0, 0, 0, 376, 377, 5, 61, 0, 0, 377, 378, 5, 61, 0, 0, 378, 379, 1, 0, 0, 0,
        379, 380, 6, 38, 38, 0, 380, 82, 1, 0, 0, 0, 381, 382, 5, 33, 0, 0, 382, 386, 5, 61, 0, 0, 383, 384, 5, 126, 0, 0, 384, 386, 5, 61, 0, 0, 385, 381, 1, 0, 0, 0, 385, 383, 1, 0, 0, 0,
        386, 387, 1, 0, 0, 0, 387, 388, 6, 39, 39, 0, 388, 84, 1, 0, 0, 0, 389, 390, 5, 62, 0, 0, 390, 391, 5, 61, 0, 0, 391, 392, 1, 0, 0, 0, 392, 393, 6, 40, 40, 0, 393, 86, 1, 0, 0, 0,
        394, 395, 5, 62, 0, 0, 395, 396, 6, 41, 41, 0, 396, 88, 1, 0, 0, 0, 397, 398, 5, 46, 0, 0, 398, 399, 5, 42, 0, 0, 399, 400, 1, 0, 0, 0, 400, 401, 6, 42, 42, 0, 401, 90, 1, 0, 0, 0,
        402, 403, 5, 46, 0, 0, 403, 404, 5, 47, 0, 0, 404, 405, 1, 0, 0, 0, 405, 406, 6, 43, 43, 0, 406, 92, 1, 0, 0, 0, 407, 408, 5, 46, 0, 0, 408, 409, 5, 92, 0, 0, 409, 410, 1, 0, 0, 0,
        410, 411, 6, 44, 44, 0, 411, 94, 1, 0, 0, 0, 412, 413, 5, 43, 0, 0, 413, 414, 5, 43, 0, 0, 414, 415, 1, 0, 0, 0, 415, 416, 6, 45, 45, 0, 416, 96, 1, 0, 0, 0, 417, 418, 5, 45, 0, 0,
        418, 419, 5, 45, 0, 0, 419, 420, 1, 0, 0, 0, 420, 421, 6, 46, 46, 0, 421, 98, 1, 0, 0, 0, 422, 426, 5, 94, 0, 0, 423, 424, 5, 42, 0, 0, 424, 426, 5, 42, 0, 0, 425, 422, 1, 0, 0, 0,
        425, 423, 1, 0, 0, 0, 426, 427, 1, 0, 0, 0, 427, 428, 6, 47, 47, 0, 428, 100, 1, 0, 0, 0, 429, 430, 5, 46, 0, 0, 430, 435, 5, 94, 0, 0, 431, 432, 5, 46, 0, 0, 432, 433, 5, 42, 0, 0,
        433, 435, 5, 42, 0, 0, 434, 429, 1, 0, 0, 0, 434, 431, 1, 0, 0, 0, 435, 436, 1, 0, 0, 0, 436, 437, 6, 48, 48, 0, 437, 102, 1, 0, 0, 0, 438, 439, 5, 46, 0, 0, 439, 440, 5, 39, 0, 0,
        440, 441, 1, 0, 0, 0, 441, 442, 6, 49, 49, 0, 442, 104, 1, 0, 0, 0, 443, 444, 5, 39, 0, 0, 444, 445, 6, 50, 50, 0, 445, 106, 1, 0, 0, 0, 446, 447, 5, 34, 0, 0, 447, 448, 6, 51, 51,
        0, 448, 108, 1, 0, 0, 0, 449, 450, 3, 199, 97, 0, 450, 451, 6, 52, 52, 0, 451, 110, 1, 0, 0, 0, 452, 454, 3, 203, 99, 0, 453, 455, 7, 0, 0, 0, 454, 453, 1, 0, 0, 0, 454, 455, 1, 0,
        0, 0, 455, 456, 1, 0, 0, 0, 456, 457, 6, 53, 53, 0, 457, 112, 1, 0, 0, 0, 458, 459, 3, 207, 101, 0, 459, 460, 5, 46, 0, 0, 460, 461, 7, 1, 0, 0, 461, 462, 6, 54, 54, 0, 462, 114, 1,
        0, 0, 0, 463, 464, 5, 46, 0, 0, 464, 465, 5, 46, 0, 0, 465, 466, 5, 46, 0, 0, 466, 470, 1, 0, 0, 0, 467, 469, 8, 2, 0, 0, 468, 467, 1, 0, 0, 0, 469, 472, 1, 0, 0, 0, 470, 468, 1, 0,
        0, 0, 470, 471, 1, 0, 0, 0, 471, 473, 1, 0, 0, 0, 472, 470, 1, 0, 0, 0, 473, 474, 3, 195, 95, 0, 474, 475, 6, 55, 55, 0, 475, 116, 1, 0, 0, 0, 476, 488, 3, 197, 96, 0, 477, 478, 5,
        46, 0, 0, 478, 479, 5, 46, 0, 0, 479, 480, 5, 46, 0, 0, 480, 484, 1, 0, 0, 0, 481, 483, 8, 2, 0, 0, 482, 481, 1, 0, 0, 0, 483, 486, 1, 0, 0, 0, 484, 482, 1, 0, 0, 0, 484, 485, 1, 0,
        0, 0, 485, 487, 1, 0, 0, 0, 486, 484, 1, 0, 0, 0, 487, 489, 3, 195, 95, 0, 488, 477, 1, 0, 0, 0, 488, 489, 1, 0, 0, 0, 489, 490, 1, 0, 0, 0, 490, 491, 6, 56, 56, 0, 491, 118, 1, 0,
        0, 0, 492, 493, 3, 195, 95, 0, 493, 494, 6, 57, 57, 0, 494, 120, 1, 0, 0, 0, 495, 497, 3, 197, 96, 0, 496, 495, 1, 0, 0, 0, 496, 497, 1, 0, 0, 0, 497, 498, 1, 0, 0, 0, 498, 499, 3,
        193, 94, 0, 499, 501, 5, 123, 0, 0, 500, 502, 3, 197, 96, 0, 501, 500, 1, 0, 0, 0, 501, 502, 1, 0, 0, 0, 502, 503, 1, 0, 0, 0, 503, 504, 3, 195, 95, 0, 504, 505, 6, 58, 58, 0, 505,
        122, 1, 0, 0, 0, 506, 510, 3, 193, 94, 0, 507, 509, 8, 2, 0, 0, 508, 507, 1, 0, 0, 0, 509, 512, 1, 0, 0, 0, 510, 508, 1, 0, 0, 0, 510, 511, 1, 0, 0, 0, 511, 518, 1, 0, 0, 0, 512,
        510, 1, 0, 0, 0, 513, 514, 3, 195, 95, 0, 514, 515, 6, 59, 59, 0, 515, 519, 1, 0, 0, 0, 516, 517, 5, 0, 0, 1, 517, 519, 6, 59, 60, 0, 518, 513, 1, 0, 0, 0, 518, 516, 1, 0, 0, 0, 519,
        124, 1, 0, 0, 0, 520, 521, 9, 0, 0, 0, 521, 126, 1, 0, 0, 0, 522, 524, 8, 3, 0, 0, 523, 522, 1, 0, 0, 0, 524, 525, 1, 0, 0, 0, 525, 523, 1, 0, 0, 0, 525, 526, 1, 0, 0, 0, 526, 527,
        1, 0, 0, 0, 527, 528, 6, 61, 61, 0, 528, 128, 1, 0, 0, 0, 529, 530, 3, 195, 95, 0, 530, 531, 6, 62, 62, 0, 531, 130, 1, 0, 0, 0, 532, 533, 5, 39, 0, 0, 533, 534, 5, 39, 0, 0, 534,
        535, 1, 0, 0, 0, 535, 536, 6, 63, 63, 0, 536, 132, 1, 0, 0, 0, 537, 538, 5, 39, 0, 0, 538, 539, 6, 64, 64, 0, 539, 134, 1, 0, 0, 0, 540, 542, 8, 4, 0, 0, 541, 540, 1, 0, 0, 0, 542,
        543, 1, 0, 0, 0, 543, 541, 1, 0, 0, 0, 543, 544, 1, 0, 0, 0, 544, 545, 1, 0, 0, 0, 545, 546, 6, 65, 65, 0, 546, 136, 1, 0, 0, 0, 547, 548, 3, 195, 95, 0, 548, 549, 6, 66, 66, 0, 549,
        138, 1, 0, 0, 0, 550, 551, 5, 34, 0, 0, 551, 552, 5, 34, 0, 0, 552, 553, 1, 0, 0, 0, 553, 554, 6, 67, 67, 0, 554, 140, 1, 0, 0, 0, 555, 556, 5, 92, 0, 0, 556, 557, 7, 5, 0, 0, 557,
        558, 6, 68, 68, 0, 558, 142, 1, 0, 0, 0, 559, 560, 5, 92, 0, 0, 560, 561, 9, 0, 0, 0, 561, 562, 6, 69, 69, 0, 562, 144, 1, 0, 0, 0, 563, 564, 5, 92, 0, 0, 564, 566, 7, 6, 0, 0, 565,
        567, 7, 6, 0, 0, 566, 565, 1, 0, 0, 0, 566, 567, 1, 0, 0, 0, 567, 569, 1, 0, 0, 0, 568, 570, 7, 6, 0, 0, 569, 568, 1, 0, 0, 0, 569, 570, 1, 0, 0, 0, 570, 571, 1, 0, 0, 0, 571, 572,
        6, 70, 70, 0, 572, 146, 1, 0, 0, 0, 573, 574, 5, 92, 0, 0, 574, 575, 5, 120, 0, 0, 575, 577, 7, 7, 0, 0, 576, 578, 7, 7, 0, 0, 577, 576, 1, 0, 0, 0, 577, 578, 1, 0, 0, 0, 578, 579,
        1, 0, 0, 0, 579, 580, 6, 71, 71, 0, 580, 148, 1, 0, 0, 0, 581, 582, 5, 92, 0, 0, 582, 583, 5, 117, 0, 0, 583, 585, 7, 7, 0, 0, 584, 586, 7, 7, 0, 0, 585, 584, 1, 0, 0, 0, 585, 586,
        1, 0, 0, 0, 586, 588, 1, 0, 0, 0, 587, 589, 7, 7, 0, 0, 588, 587, 1, 0, 0, 0, 588, 589, 1, 0, 0, 0, 589, 591, 1, 0, 0, 0, 590, 592, 7, 7, 0, 0, 591, 590, 1, 0, 0, 0, 591, 592, 1, 0,
        0, 0, 592, 593, 1, 0, 0, 0, 593, 594, 6, 72, 72, 0, 594, 150, 1, 0, 0, 0, 595, 596, 5, 34, 0, 0, 596, 597, 6, 73, 73, 0, 597, 152, 1, 0, 0, 0, 598, 600, 3, 197, 96, 0, 599, 598, 1,
        0, 0, 0, 599, 600, 1, 0, 0, 0, 600, 601, 1, 0, 0, 0, 601, 602, 3, 193, 94, 0, 602, 604, 5, 123, 0, 0, 603, 605, 3, 197, 96, 0, 604, 603, 1, 0, 0, 0, 604, 605, 1, 0, 0, 0, 605, 606,
        1, 0, 0, 0, 606, 607, 3, 195, 95, 0, 607, 608, 6, 74, 74, 0, 608, 154, 1, 0, 0, 0, 609, 611, 3, 197, 96, 0, 610, 609, 1, 0, 0, 0, 610, 611, 1, 0, 0, 0, 611, 612, 1, 0, 0, 0, 612,
        613, 3, 193, 94, 0, 613, 615, 5, 125, 0, 0, 614, 616, 3, 197, 96, 0, 615, 614, 1, 0, 0, 0, 615, 616, 1, 0, 0, 0, 616, 618, 1, 0, 0, 0, 617, 619, 3, 195, 95, 0, 618, 617, 1, 0, 0, 0,
        618, 619, 1, 0, 0, 0, 619, 620, 1, 0, 0, 0, 620, 621, 6, 75, 75, 0, 621, 156, 1, 0, 0, 0, 622, 624, 9, 0, 0, 0, 623, 622, 1, 0, 0, 0, 624, 627, 1, 0, 0, 0, 625, 626, 1, 0, 0, 0, 625,
        623, 1, 0, 0, 0, 626, 628, 1, 0, 0, 0, 627, 625, 1, 0, 0, 0, 628, 629, 3, 195, 95, 0, 629, 630, 1, 0, 0, 0, 630, 631, 6, 76, 76, 0, 631, 158, 1, 0, 0, 0, 632, 634, 8, 2, 0, 0, 633,
        632, 1, 0, 0, 0, 634, 637, 1, 0, 0, 0, 635, 633, 1, 0, 0, 0, 635, 636, 1, 0, 0, 0, 636, 638, 1, 0, 0, 0, 637, 635, 1, 0, 0, 0, 638, 639, 5, 0, 0, 1, 639, 640, 6, 77, 77, 0, 640, 160,
        1, 0, 0, 0, 641, 642, 5, 46, 0, 0, 642, 643, 5, 46, 0, 0, 643, 644, 5, 46, 0, 0, 644, 648, 1, 0, 0, 0, 645, 647, 8, 2, 0, 0, 646, 645, 1, 0, 0, 0, 647, 650, 1, 0, 0, 0, 648, 646, 1,
        0, 0, 0, 648, 649, 1, 0, 0, 0, 649, 651, 1, 0, 0, 0, 650, 648, 1, 0, 0, 0, 651, 652, 3, 195, 95, 0, 652, 653, 6, 78, 78, 0, 653, 162, 1, 0, 0, 0, 654, 656, 4, 79, 0, 0, 655, 657, 3,
        197, 96, 0, 656, 655, 1, 0, 0, 0, 656, 657, 1, 0, 0, 0, 657, 658, 1, 0, 0, 0, 658, 659, 3, 193, 94, 0, 659, 661, 5, 123, 0, 0, 660, 662, 3, 197, 96, 0, 661, 660, 1, 0, 0, 0, 661,
        662, 1, 0, 0, 0, 662, 663, 1, 0, 0, 0, 663, 664, 3, 195, 95, 0, 664, 665, 6, 79, 79, 0, 665, 164, 1, 0, 0, 0, 666, 667, 4, 80, 1, 0, 667, 671, 3, 193, 94, 0, 668, 670, 8, 2, 0, 0,
        669, 668, 1, 0, 0, 0, 670, 673, 1, 0, 0, 0, 671, 669, 1, 0, 0, 0, 671, 672, 1, 0, 0, 0, 672, 674, 1, 0, 0, 0, 673, 671, 1, 0, 0, 0, 674, 675, 3, 195, 95, 0, 675, 676, 1, 0, 0, 0,
        676, 677, 6, 80, 76, 0, 677, 166, 1, 0, 0, 0, 678, 679, 4, 81, 2, 0, 679, 680, 3, 195, 95, 0, 680, 681, 1, 0, 0, 0, 681, 682, 6, 81, 76, 0, 682, 168, 1, 0, 0, 0, 683, 684, 3, 197,
        96, 0, 684, 685, 1, 0, 0, 0, 685, 686, 6, 82, 76, 0, 686, 170, 1, 0, 0, 0, 687, 688, 5, 34, 0, 0, 688, 689, 4, 83, 3, 0, 689, 690, 6, 83, 80, 0, 690, 172, 1, 0, 0, 0, 691, 692, 5,
        39, 0, 0, 692, 693, 4, 84, 4, 0, 693, 694, 6, 84, 81, 0, 694, 174, 1, 0, 0, 0, 695, 696, 5, 34, 0, 0, 696, 700, 4, 85, 5, 0, 697, 699, 8, 8, 0, 0, 698, 697, 1, 0, 0, 0, 699, 702, 1,
        0, 0, 0, 700, 698, 1, 0, 0, 0, 700, 701, 1, 0, 0, 0, 701, 703, 1, 0, 0, 0, 702, 700, 1, 0, 0, 0, 703, 704, 6, 85, 82, 0, 704, 176, 1, 0, 0, 0, 705, 706, 5, 39, 0, 0, 706, 710, 4, 86,
        6, 0, 707, 709, 8, 8, 0, 0, 708, 707, 1, 0, 0, 0, 709, 712, 1, 0, 0, 0, 710, 708, 1, 0, 0, 0, 710, 711, 1, 0, 0, 0, 711, 713, 1, 0, 0, 0, 712, 710, 1, 0, 0, 0, 713, 714, 6, 86, 83,
        0, 714, 178, 1, 0, 0, 0, 715, 716, 5, 34, 0, 0, 716, 717, 4, 87, 7, 0, 717, 718, 6, 87, 84, 0, 718, 180, 1, 0, 0, 0, 719, 720, 5, 39, 0, 0, 720, 721, 4, 88, 8, 0, 721, 722, 6, 88,
        85, 0, 722, 182, 1, 0, 0, 0, 723, 727, 3, 193, 94, 0, 724, 726, 8, 2, 0, 0, 725, 724, 1, 0, 0, 0, 726, 729, 1, 0, 0, 0, 727, 725, 1, 0, 0, 0, 727, 728, 1, 0, 0, 0, 728, 730, 1, 0, 0,
        0, 729, 727, 1, 0, 0, 0, 730, 731, 6, 89, 76, 0, 731, 184, 1, 0, 0, 0, 732, 733, 7, 9, 0, 0, 733, 734, 6, 90, 86, 0, 734, 186, 1, 0, 0, 0, 735, 736, 3, 195, 95, 0, 736, 737, 6, 91,
        87, 0, 737, 188, 1, 0, 0, 0, 738, 739, 5, 0, 0, 1, 739, 740, 6, 92, 88, 0, 740, 190, 1, 0, 0, 0, 741, 745, 8, 10, 0, 0, 742, 744, 8, 11, 0, 0, 743, 742, 1, 0, 0, 0, 744, 747, 1, 0,
        0, 0, 745, 743, 1, 0, 0, 0, 745, 746, 1, 0, 0, 0, 746, 748, 1, 0, 0, 0, 747, 745, 1, 0, 0, 0, 748, 749, 6, 93, 89, 0, 749, 192, 1, 0, 0, 0, 750, 751, 7, 12, 0, 0, 751, 194, 1, 0, 0,
        0, 752, 758, 5, 13, 0, 0, 753, 755, 5, 13, 0, 0, 754, 753, 1, 0, 0, 0, 754, 755, 1, 0, 0, 0, 755, 756, 1, 0, 0, 0, 756, 758, 5, 10, 0, 0, 757, 752, 1, 0, 0, 0, 757, 754, 1, 0, 0, 0,
        758, 196, 1, 0, 0, 0, 759, 761, 7, 13, 0, 0, 760, 759, 1, 0, 0, 0, 761, 762, 1, 0, 0, 0, 762, 760, 1, 0, 0, 0, 762, 763, 1, 0, 0, 0, 763, 198, 1, 0, 0, 0, 764, 768, 7, 14, 0, 0, 765,
        767, 7, 15, 0, 0, 766, 765, 1, 0, 0, 0, 767, 770, 1, 0, 0, 0, 768, 766, 1, 0, 0, 0, 768, 769, 1, 0, 0, 0, 769, 200, 1, 0, 0, 0, 770, 768, 1, 0, 0, 0, 771, 782, 3, 199, 97, 0, 772,
        774, 3, 197, 96, 0, 773, 772, 1, 0, 0, 0, 773, 774, 1, 0, 0, 0, 774, 775, 1, 0, 0, 0, 775, 777, 5, 46, 0, 0, 776, 778, 3, 197, 96, 0, 777, 776, 1, 0, 0, 0, 777, 778, 1, 0, 0, 0, 778,
        779, 1, 0, 0, 0, 779, 781, 3, 199, 97, 0, 780, 773, 1, 0, 0, 0, 781, 784, 1, 0, 0, 0, 782, 780, 1, 0, 0, 0, 782, 783, 1, 0, 0, 0, 783, 202, 1, 0, 0, 0, 784, 782, 1, 0, 0, 0, 785,
        787, 3, 209, 102, 0, 786, 788, 5, 46, 0, 0, 787, 786, 1, 0, 0, 0, 787, 788, 1, 0, 0, 0, 788, 795, 1, 0, 0, 0, 789, 791, 3, 209, 102, 0, 790, 789, 1, 0, 0, 0, 790, 791, 1, 0, 0, 0,
        791, 792, 1, 0, 0, 0, 792, 793, 5, 46, 0, 0, 793, 795, 3, 209, 102, 0, 794, 785, 1, 0, 0, 0, 794, 790, 1, 0, 0, 0, 795, 798, 1, 0, 0, 0, 796, 797, 7, 16, 0, 0, 797, 799, 3, 217, 106,
        0, 798, 796, 1, 0, 0, 0, 798, 799, 1, 0, 0, 0, 799, 852, 1, 0, 0, 0, 800, 801, 5, 48, 0, 0, 801, 811, 7, 17, 0, 0, 802, 804, 3, 211, 103, 0, 803, 805, 5, 46, 0, 0, 804, 803, 1, 0, 0,
        0, 804, 805, 1, 0, 0, 0, 805, 812, 1, 0, 0, 0, 806, 808, 3, 211, 103, 0, 807, 806, 1, 0, 0, 0, 807, 808, 1, 0, 0, 0, 808, 809, 1, 0, 0, 0, 809, 810, 5, 46, 0, 0, 810, 812, 3, 211,
        103, 0, 811, 802, 1, 0, 0, 0, 811, 807, 1, 0, 0, 0, 812, 815, 1, 0, 0, 0, 813, 814, 7, 18, 0, 0, 814, 816, 3, 217, 106, 0, 815, 813, 1, 0, 0, 0, 815, 816, 1, 0, 0, 0, 816, 852, 1, 0,
        0, 0, 817, 818, 5, 48, 0, 0, 818, 828, 7, 19, 0, 0, 819, 821, 3, 213, 104, 0, 820, 822, 5, 46, 0, 0, 821, 820, 1, 0, 0, 0, 821, 822, 1, 0, 0, 0, 822, 829, 1, 0, 0, 0, 823, 825, 3,
        213, 104, 0, 824, 823, 1, 0, 0, 0, 824, 825, 1, 0, 0, 0, 825, 826, 1, 0, 0, 0, 826, 827, 5, 46, 0, 0, 827, 829, 3, 213, 104, 0, 828, 819, 1, 0, 0, 0, 828, 824, 1, 0, 0, 0, 829, 832,
        1, 0, 0, 0, 830, 831, 7, 18, 0, 0, 831, 833, 3, 217, 106, 0, 832, 830, 1, 0, 0, 0, 832, 833, 1, 0, 0, 0, 833, 852, 1, 0, 0, 0, 834, 835, 5, 48, 0, 0, 835, 845, 7, 20, 0, 0, 836, 838,
        3, 215, 105, 0, 837, 839, 5, 46, 0, 0, 838, 837, 1, 0, 0, 0, 838, 839, 1, 0, 0, 0, 839, 846, 1, 0, 0, 0, 840, 842, 3, 215, 105, 0, 841, 840, 1, 0, 0, 0, 841, 842, 1, 0, 0, 0, 842,
        843, 1, 0, 0, 0, 843, 844, 5, 46, 0, 0, 844, 846, 3, 215, 105, 0, 845, 836, 1, 0, 0, 0, 845, 841, 1, 0, 0, 0, 846, 849, 1, 0, 0, 0, 847, 848, 7, 18, 0, 0, 848, 850, 3, 217, 106, 0,
        849, 847, 1, 0, 0, 0, 849, 850, 1, 0, 0, 0, 850, 852, 1, 0, 0, 0, 851, 794, 1, 0, 0, 0, 851, 800, 1, 0, 0, 0, 851, 817, 1, 0, 0, 0, 851, 834, 1, 0, 0, 0, 852, 204, 1, 0, 0, 0, 853,
        854, 3, 207, 101, 0, 854, 862, 7, 21, 0, 0, 855, 863, 5, 56, 0, 0, 856, 857, 5, 49, 0, 0, 857, 863, 5, 54, 0, 0, 858, 859, 5, 51, 0, 0, 859, 863, 5, 50, 0, 0, 860, 861, 5, 54, 0, 0,
        861, 863, 5, 52, 0, 0, 862, 855, 1, 0, 0, 0, 862, 856, 1, 0, 0, 0, 862, 858, 1, 0, 0, 0, 862, 860, 1, 0, 0, 0, 863, 206, 1, 0, 0, 0, 864, 875, 3, 209, 102, 0, 865, 872, 5, 48, 0, 0,
        866, 867, 7, 17, 0, 0, 867, 873, 3, 211, 103, 0, 868, 869, 7, 19, 0, 0, 869, 873, 3, 213, 104, 0, 870, 871, 7, 20, 0, 0, 871, 873, 3, 215, 105, 0, 872, 866, 1, 0, 0, 0, 872, 868, 1,
        0, 0, 0, 872, 870, 1, 0, 0, 0, 873, 875, 1, 0, 0, 0, 874, 864, 1, 0, 0, 0, 874, 865, 1, 0, 0, 0, 875, 208, 1, 0, 0, 0, 876, 880, 7, 22, 0, 0, 877, 879, 7, 23, 0, 0, 878, 877, 1, 0,
        0, 0, 879, 882, 1, 0, 0, 0, 880, 878, 1, 0, 0, 0, 880, 881, 1, 0, 0, 0, 881, 210, 1, 0, 0, 0, 882, 880, 1, 0, 0, 0, 883, 887, 7, 24, 0, 0, 884, 886, 7, 25, 0, 0, 885, 884, 1, 0, 0,
        0, 886, 889, 1, 0, 0, 0, 887, 885, 1, 0, 0, 0, 887, 888, 1, 0, 0, 0, 888, 212, 1, 0, 0, 0, 889, 887, 1, 0, 0, 0, 890, 894, 7, 6, 0, 0, 891, 893, 7, 26, 0, 0, 892, 891, 1, 0, 0, 0,
        893, 896, 1, 0, 0, 0, 894, 892, 1, 0, 0, 0, 894, 895, 1, 0, 0, 0, 895, 214, 1, 0, 0, 0, 896, 894, 1, 0, 0, 0, 897, 901, 7, 7, 0, 0, 898, 900, 7, 27, 0, 0, 899, 898, 1, 0, 0, 0, 900,
        903, 1, 0, 0, 0, 901, 899, 1, 0, 0, 0, 901, 902, 1, 0, 0, 0, 902, 216, 1, 0, 0, 0, 903, 901, 1, 0, 0, 0, 904, 906, 7, 28, 0, 0, 905, 904, 1, 0, 0, 0, 905, 906, 1, 0, 0, 0, 906, 907,
        1, 0, 0, 0, 907, 908, 3, 209, 102, 0, 908, 218, 1, 0, 0, 0, 73, 0, 1, 2, 3, 4, 309, 338, 385, 425, 434, 454, 470, 484, 488, 496, 501, 510, 518, 525, 543, 566, 569, 577, 585, 588,
        591, 599, 604, 610, 615, 618, 625, 635, 648, 656, 661, 671, 700, 710, 727, 745, 754, 757, 762, 768, 773, 777, 782, 787, 790, 794, 798, 804, 807, 811, 815, 821, 824, 828, 832, 838,
        841, 845, 849, 851, 862, 872, 874, 880, 887, 894, 901, 905, 90, 1, 0, 0, 1, 1, 1, 1, 2, 2, 1, 3, 3, 1, 4, 4, 1, 5, 5, 1, 6, 6, 1, 7, 7, 1, 8, 8, 1, 9, 9, 1, 10, 10, 1, 11, 11, 1, 12,
        12, 1, 13, 13, 1, 14, 14, 1, 15, 15, 1, 16, 16, 1, 17, 17, 1, 18, 18, 1, 19, 19, 1, 20, 20, 1, 21, 21, 1, 22, 22, 1, 23, 23, 1, 24, 24, 1, 25, 25, 1, 26, 26, 1, 27, 27, 1, 28, 28, 1,
        29, 29, 1, 30, 30, 1, 31, 31, 1, 32, 32, 1, 33, 33, 1, 34, 34, 1, 35, 35, 1, 36, 36, 1, 37, 37, 1, 38, 38, 1, 39, 39, 1, 40, 40, 1, 41, 41, 1, 42, 42, 1, 43, 43, 1, 44, 44, 1, 45,
        45, 1, 46, 46, 1, 47, 47, 1, 48, 48, 1, 49, 49, 1, 50, 50, 1, 51, 51, 1, 52, 52, 1, 53, 53, 1, 54, 54, 1, 55, 55, 1, 56, 56, 1, 57, 57, 1, 58, 58, 1, 59, 59, 1, 59, 60, 1, 61, 61, 1,
        62, 62, 1, 63, 63, 1, 64, 64, 1, 65, 65, 1, 66, 66, 1, 67, 67, 1, 68, 68, 1, 69, 69, 1, 70, 70, 1, 71, 71, 1, 72, 72, 1, 73, 73, 1, 74, 74, 1, 75, 75, 6, 0, 0, 1, 77, 76, 1, 78, 77,
        1, 79, 78, 1, 83, 79, 1, 84, 80, 1, 85, 81, 1, 86, 82, 1, 87, 83, 1, 88, 84, 1, 90, 85, 1, 91, 86, 1, 92, 87, 1, 93, 88,
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
