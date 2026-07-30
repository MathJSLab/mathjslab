lexer grammar MathJSLabLexer;

tokens { GLOBAL, PERSISTENT, IMPORT, IF, ENDIF, END, ENDRANGE, ELSEIF, ELSE, SWITCH, ENDSWITCH, CASE, OTHERWISE, WHILE, ENDWHILE, DO, UNTIL, FOR, ENDFOR, PARFOR, ENDPARFOR, SPMD, ENDSPMD,
BREAK, CONTINUE, RETURN, FUNCTION, ENDFUNCTION, TRY, CATCH, END_TRY_CATCH, UNWIND_PROTECT, UNWIND_PROTECT_CLEANUP, END_UNWIND_PROTECT, CLASSDEF, ENDCLASSDEF,
ENUMERATION, ENDENUMERATION, PROPERTIES, ENDPROPERTIES, EVENTS, ENDEVENTS, METHODS, ENDMETHODS, WSPACE, STRING, ARGUMENTS, ENDARGUMENTS }

@members {
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
            .filter((entry): entry is [string, number] => typeof entry !== 'undefined')
    );
    /**
     * Word-list commands.
     */
    public commandNames: Set<string> = new Set();
    /**
     * Command names that should remain ordinary identifiers when followed by an
     * assignment operator.
     */
    public assignmentSensitiveCommandNames: Set<string> = new Set();
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
        MathJSLabLexer.EPOW
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
    /* Tracks whether each curly brace opened a cell-literal or indexing context. */
    public curlyBraceIsMatrixContext: boolean[] = [];
    /* Open cell-indexing brace count. */
    public indexingBraceCount: number = 0;
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

    /**
     * Test whether the next non-space input starts an assignment expression.
     *
     * Command-form parsing is only valid when a command name is followed by
     * literal argument text. Names such as `run` and `source` are still legal
     * variables, so `source = 10` and `source += 1` must remain expressions
     * rather than entering the command-word lexer mode.
     */
    private commandIsFollowedByAssignment(offset: number): boolean {
        const first = this._input.LA(offset);
        if (first === 61) {
            return true;
        }
        const second = this._input.LA(offset + 1);
        if ([43, 45, 42, 47, 92, 94, 38, 124].includes(first) && second === 61) {
            return true;
        }
        return first === 46 && [42, 47, 92, 94].includes(second) && this._input.LA(offset + 2) === 61;
    }
}

/**
 * Operators.
 */
PLUS: '+' { this.previousTokenType = MathJSLabLexer.PLUS; };
MINUS: '-' { this.previousTokenType = MathJSLabLexer.MINUS; };
MUL: '*' { this.previousTokenType = MathJSLabLexer.MUL; };
DIV: '/' { this.previousTokenType = MathJSLabLexer.DIV; };
EQ: '=' { this.previousTokenType = MathJSLabLexer.EQ; };
COLON: ':' { this.previousTokenType = MathJSLabLexer.COLON; };
SEMICOLON: ';' { this.previousTokenType = MathJSLabLexer.SEMICOLON; };
COMMA: ',' { this.previousTokenType = MathJSLabLexer.COMMA; };
DOT: '.' { this.previousTokenType = MathJSLabLexer.DOT; };
TILDE: '~' { this.previousTokenType = MathJSLabLexer.TILDE; };
EXCLAMATION: '!' { this.previousTokenType = MathJSLabLexer.EXCLAMATION; };
COMMAT: '@' { this.previousTokenType = MathJSLabLexer.COMMAT; };
QUESTION: '?' { this.previousTokenType = MathJSLabLexer.QUESTION; };
LPAREN: '(' {
    if (this.matrixContext.length > 0) {
        this.matrixContext.push(MathJSLabLexer.LPAREN);
    }
    this.parenthesisCount++;
    this.previousTokenType = MathJSLabLexer.LPAREN;
};
RPAREN: ')' {
    if (this.matrixContext.length > 0) {
        this.matrixContext.pop();
    }
    this.parenthesisCount = Math.max(0, this.parenthesisCount - 1);
    this.previousTokenType = MathJSLabLexer.RPAREN;
};
LBRACKET: '[' {
    this.matrixContext.push(MathJSLabLexer.LBRACKET);
    this.previousTokenType = MathJSLabLexer.LBRACKET;
};
RBRACKET: ']' {
    this.matrixContext.pop();
    this.previousTokenType = MathJSLabLexer.RBRACKET;
};
LCURLYBR: '{' {
    const isIndexingBrace =
        this.previousTokenType === MathJSLabLexer.RPAREN ||
        this.previousTokenType === MathJSLabLexer.RBRACKET ||
        this.previousTokenType === MathJSLabLexer.RCURLYBR ||
        this.previousTokenType === MathJSLabLexer.IDENTIFIER ||
        this.previousTokenType === MathJSLabLexer.FLOAT_NUMBER ||
        this.previousTokenType === MathJSLabLexer.STRING ||
        this.previousTokenType === MathJSLabLexer.ENDRANGE;
    this.curlyBraceIsMatrixContext.push(!isIndexingBrace);
    if (isIndexingBrace) {
        this.indexingBraceCount++;
    } else {
        this.matrixContext.push(MathJSLabLexer.LCURLYBR);
    }
    this.previousTokenType = MathJSLabLexer.LCURLYBR;
};
RCURLYBR: '}' {
    if (this.curlyBraceIsMatrixContext.pop() ?? true) {
        this.matrixContext.pop();
    } else {
        this.indexingBraceCount = Math.max(0, this.indexingBraceCount - 1);
    }
    this.previousTokenType = MathJSLabLexer.RCURLYBR;
};
LEFTDIV: '\\' { this.previousTokenType = MathJSLabLexer.LEFTDIV; };
ADD_EQ: '+=' { this.previousTokenType = MathJSLabLexer.ADD_EQ; };
SUB_EQ: '-=' { this.previousTokenType = MathJSLabLexer.SUB_EQ; };
MUL_EQ: '*=' { this.previousTokenType = MathJSLabLexer.MUL_EQ; };
DIV_EQ: '/=' { this.previousTokenType = MathJSLabLexer.DIV_EQ; };
LEFTDIV_EQ: '\\=' { this.previousTokenType = MathJSLabLexer.LEFTDIV_EQ; };
POW_EQ: ('^=' | '**=') { this.previousTokenType = MathJSLabLexer.POW_EQ; };
EMUL_EQ: '.*=' { this.previousTokenType = MathJSLabLexer.EMUL_EQ; };
EDIV_EQ: './=' { this.previousTokenType = MathJSLabLexer.EDIV_EQ; };
ELEFTDIV_EQ: '.\\=' { this.previousTokenType = MathJSLabLexer.ELEFTDIV_EQ; };
EPOW_EQ: ('.^=' | '.**=') { this.previousTokenType = MathJSLabLexer.EPOW_EQ; };
AND_EQ: '&=' { this.previousTokenType = MathJSLabLexer.AND_EQ; };
OR_EQ: '|=' { this.previousTokenType = MathJSLabLexer.OR_EQ; };
EXPR_AND_AND: '&&' { this.previousTokenType = MathJSLabLexer.EXPR_AND_AND; };
EXPR_OR_OR: '||' { this.previousTokenType = MathJSLabLexer.EXPR_OR_OR; };
EXPR_AND: '&' { this.previousTokenType = MathJSLabLexer.EXPR_AND; };
EXPR_OR: '|' { this.previousTokenType = MathJSLabLexer.EXPR_OR; };
EXPR_LT: '<' { this.previousTokenType = MathJSLabLexer.EXPR_LT; };
EXPR_LE: '<=' { this.previousTokenType = MathJSLabLexer.EXPR_LE; };
EXPR_EQ: '==' { this.previousTokenType = MathJSLabLexer.EXPR_EQ; };
EXPR_NE: ('!=' | '~=') { this.previousTokenType = MathJSLabLexer.EXPR_NE; };
EXPR_GE: '>=' { this.previousTokenType = MathJSLabLexer.EXPR_GE; };
EXPR_GT: '>' { this.previousTokenType = MathJSLabLexer.EXPR_GT; };
EMUL: '.*' { this.previousTokenType = MathJSLabLexer.EMUL; };
EDIV: './' { this.previousTokenType = MathJSLabLexer.EDIV; };
ELEFTDIV: '.\\' { this.previousTokenType = MathJSLabLexer.ELEFTDIV; };
PLUS_PLUS: '++' { this.previousTokenType = MathJSLabLexer.PLUS_PLUS; };
MINUS_MINUS: '--' { this.previousTokenType = MathJSLabLexer.MINUS_MINUS; };
POW: ('^' | '**') { this.previousTokenType = MathJSLabLexer.POW; };
EPOW: ('.^' | '.**') { this.previousTokenType = MathJSLabLexer.EPOW; };
TRANSPOSE: '.\'' { this.previousTokenType = MathJSLabLexer.TRANSPOSE; };
HERMITIAN: '\'' {
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
};

DQSTRING
    : '"' {
        this.pushMode(MathJSLabLexer.DQ_STRING);
        this.quotedString = '';
        this.skip();
    }
    ;

IDENTIFIER
    : IDENT {
        if (this.previousTokenType === MathJSLabLexer.DOT) {
            this.previousTokenType = MathJSLabLexer.IDENTIFIER;
        } else {
            const keywordType = MathJSLabLexer.keywordTypeByName.get(this.text);
            if (typeof keywordType !== 'undefined') {
                switch (keywordType) {
                    case MathJSLabLexer.END:
                        this._type = this.previousTokenType = (this.parenthesisCount > 0 || this.matrixContext.length > 0 || this.indexingBraceCount > 0) ? MathJSLabLexer.ENDRANGE : MathJSLabLexer.END;
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
                const assignmentSensitive = this.assignmentSensitiveCommandNames.has(this.text) && this.commandIsFollowedByAssignment(offset);
                if (isCommandName && isCommandPosition && (next !== 40 || offset > 1) && !assignmentSensitive) {
                    this.pushMode(MathJSLabLexer.ANY_AS_STRING_UNTIL_END_OF_LINE);
                }
                this.previousTokenType = MathJSLabLexer.IDENTIFIER;
            }
        }
    }
    ;

FLOAT_NUMBER
    :  REAL_NUMBER [IiJj]?  {
        this.previousTokenType = MathJSLabLexer.FLOAT_NUMBER;
    }
    ;

// The following rule is for expressions that are just digits followed
// directly by an element-by-element operator, don't grab the '.'
// part of the operator as part of the constant (for example, in an
// expression like "13./x").

NUMBER_DOT_OP
    : INTEGER_DIGITS '.' [*/\\^'] {
        this._input.seek(this._input.index - 2); // Unput two characters.
        this._type = this.previousTokenType = MathJSLabLexer.FLOAT_NUMBER;
    }
    ;

LINE_CONTINUATION
    : '...' ~[\r\n]* NL {
        this.continuedTokenType = this.previousTokenType;
        this.skip();
    }
    ;

SPACE_OR_CONTINUATION
    : SPACE ( '...' ~[\r\n]* NL )? {
        if (this.text.includes('...')) {
            this.continuedTokenType = this.previousTokenType;
        }
        if (this.matrixContext.length > 0 &&
            this.previousTokenType !== MathJSLabLexer.LBRACKET &&
            this.previousTokenType !== MathJSLabLexer.COMMA &&
            this.previousTokenType !== MathJSLabLexer.SEMICOLON &&
            this.matrixContext[this.matrixContext.length-1] !== MathJSLabLexer.LPAREN &&
            !MathJSLabLexer.nonTerminalSign.has(this.previousTokenType)
        ) {
            this._type = this.previousTokenType = MathJSLabLexer.WSPACE;
        } else {
            this.skip();
        }
    }
    ;

NEWLINE
    : NL {
        if (this.continuedTokenType === this.previousTokenType) {
            this.skip();
        } else if (this.parenthesisCount > 0 || this.indexingBraceCount > 0) {
            this.skip();
        } else if (this.matrixContext.length > 0 &&
            (this.previousTokenType === MathJSLabLexer.LBRACKET ||
            this.previousTokenType === MathJSLabLexer.COMMA ||
            this.previousTokenType === MathJSLabLexer.SEMICOLON)
        ) {
            this.skip();
        } else {
            this.previousTokenType = MathJSLabLexer.NEWLINE;
        }
    }
    ;

BLOCK_COMMENT_START
    : SPACE? CCHAR '{' SPACE? NL {
        this.pushMode(MathJSLabLexer.BLOCK_COMMENT);
        if (this.continuedTokenType === this.previousTokenType || this.parenthesisCount > 0) {
            this.skip();
        } else {
            this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;
        }
    }
    ;

COMMENT_LINE
    : CCHAR ~[\r\n]* (NL {
        if (this.continuedTokenType === this.previousTokenType) {
            this.skip();
        } else if (this.parenthesisCount > 0) {
            this.skip();
        } else {
            this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;
        }
    } | EOF {
        this._type = this.previousTokenType = MathJSLabLexer.EOF;
    })
    ;

INVALID
    : .
    ;

mode SQ_STRING;

SINGLEQ_STRING
    : ~['\r\n]+ {
        this.quotedString += this.text;
        this.skip();
    }
    ;

SINGLEQ_NL
    : NL {
        this._type = this.previousTokenType = MathJSLabLexer.INVALID;
    }
    ;

SINGLEQ_SINGLEQ
    : '\'\'' {
        this.quotedString += '\'';
        this.skip();
    }
    ;

SINGLEQ_END
    : '\'' {
        this.text = `'${this.quotedString}'`;
        this.popMode();
        this._type = this.previousTokenType = MathJSLabLexer.STRING;
    }
    ;

mode DQ_STRING;

DOUBLEQ_STRING
    : ~[\\"\r\n]+ {
        this.quotedString += this.text;
        this.skip();
    }
    ;

DOUBLEQ_NL
    : NL {
        this._type = this.previousTokenType = MathJSLabLexer.INVALID;
    }
    ;

DOUBLEQ_DOUBLEQ
    : '""' {
        this.quotedString += '"';
        this.skip();
    }
    ;

DOUBLEQ_ESCAPE
    : '\\' [\\"'bfnrt] {
        this.quotedString += JSON.parse(`"\${ this.text }"`);
        this.skip();
    }
    ;

DOUBLEQ_ESCAPE_OTHER
    : '\\' . {
        this.quotedString += this.text.substring(1);
        this.skip();
    }
    ;

DOUBLEQ_ESCAPE_OCT
    : '\\' [0-7] [0-7]? [0-7]? {
        this.quotedString += JSON.parse(`"\\u${ parseInt(this.text.substring(1), 8).toString(16).padStart(4,'0') }"`);
        this.skip();
    }
    ;

DOUBLEQ_ESCAPE_HEX
    : '\\' 'x' [0-9A-Fa-f] [0-9A-Fa-f]? {
        this.quotedString += eval(`"\\x${ this.text.substring(2) }"`);
        this.skip();
    }
    ;

DOUBLEQ_ESCAPE_UNICODE
    : '\\' 'u' [0-9A-Fa-f] [0-9A-Fa-f]? [0-9A-Fa-f]? [0-9A-Fa-f]? {
        this.quotedString += JSON.parse(`"\\u${ this.text.substring(2).padStart(4,'0') }"`);
        this.skip();
    }
    ;

DOUBLEQ_END
    : '"' {
        this.text = `"${this.quotedString}"`;
        this.popMode();
        this._type = this.previousTokenType = MathJSLabLexer.STRING;
    }
    ;

mode BLOCK_COMMENT;

BLOCK_COMMENT_START_AGAIN
    : SPACE? CCHAR '{' SPACE? NL {
        this.pushMode(MathJSLabLexer.BLOCK_COMMENT);
        this.skip();
    }
    ;

BLOCK_COMMENT_END
    :  SPACE? CCHAR '}' SPACE? NL? {
        this.popMode();
        this.skip();
    }
    ;

BLOCK_COMMENT_LINE
    : .*? NL -> skip
    ;

BLOCK_COMMENT_EOF
    : ~[\r\n]* EOF { throw new SyntaxError('Block comment open at end of input.'); }
    ;

mode ANY_AS_STRING_UNTIL_END_OF_LINE;

COMMAND_LINE_CONTINUATION
    : '...' ~[\r\n]* NL {
        this.commandContinued = true;
        this.skip();
    }
    ;

COMMAND_CONTINUED_BLOCK_COMMENT_START
    : {this.commandContinued}? SPACE? CCHAR '{' SPACE? NL {
        this.pushMode(MathJSLabLexer.BLOCK_COMMENT);
        this.skip();
    }
    ;

COMMAND_CONTINUED_COMMENT_LINE
    : {this.commandContinued}? CCHAR ~[\r\n]* NL -> skip
    ;

COMMAND_CONTINUED_NEWLINE
    : {this.commandContinued}? NL -> skip
    ;

SKIP_SPACE
    : SPACE -> skip
    ;

COMMAND_LONE_DQUOTE
    : '"' { [Token.EOF, 9, 10, 13, 32].includes(this._input.LA(1)) }? {
        this.commandContinued = false;
        this.text = '"';
        this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;
        this._type = MathJSLabLexer.UNQUOTED_STRING;
    }
    ;

COMMAND_LONE_SQUOTE
    : '\'' { [Token.EOF, 9, 10, 13, 32].includes(this._input.LA(1)) }? {
        this.commandContinued = false;
        this.text = '\'';
        this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;
        this._type = MathJSLabLexer.UNQUOTED_STRING;
    }
    ;

COMMAND_UNCLOSED_DQUOTE
    : '"' { !this.commandQuoteIsClosed(34) }? ~[ \t\r\n]* {
        this.commandContinued = false;
        this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;
        this._type = MathJSLabLexer.UNQUOTED_STRING;
    }
    ;

COMMAND_UNCLOSED_SQUOTE
    : '\'' { !this.commandQuoteIsClosed(39) }? ~[ \t\r\n]* {
        this.commandContinued = false;
        this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;
        this._type = MathJSLabLexer.UNQUOTED_STRING;
    }
    ;

COMMAND_DQSTRING
    : '"' { this.commandQuoteIsClosed(34) }? {
        this.commandContinued = false;
        this.pushMode(MathJSLabLexer.DQ_STRING);
        this.quotedString = '';
        this.skip();
    }
    ;

COMMAND_SQSTRING
    : '\'' { this.commandQuoteIsClosed(39) }? {
        this.commandContinued = false;
        this.pushMode(MathJSLabLexer.SQ_STRING);
        this.quotedString = '';
        this.skip();
    }
    ;

SKIP_COMMENT_LINE
    : CCHAR ~[\r\n]* -> skip
    ;

COMMAND_SEPARATOR
    : [;,] {
        this.commandContinued = false;
        this.popMode();
        this._type = this.previousTokenType = this.text === ',' ? MathJSLabLexer.COMMA : MathJSLabLexer.SEMICOLON;
    }
    ;

EXIT_AT_NEWLINE
    : NL {
        this.commandContinued = false;
        this.popMode();
        this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;
    }
    ;

EXIT_AT_EOF
    : EOF {
        this.commandContinued = false;
        this.popMode();
        this._type = this.previousTokenType = MathJSLabLexer.EOF;
    }
    ;

UNQUOTED_STRING
    : ~[ \t\r\n"',;] ~[ \t\r\n,;]* {
        this.commandContinued = false;
        this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;
    }
    ;

fragment CCHAR
    : '#' | '%'
    ;

fragment NL
    : '\r' | '\r'? '\n'
    ;

fragment SPACE
    : (' ' | '\t')+
    ;

fragment IDENT
    : [_a-zA-Z] [_a-zA-Z0-9]*
    ;

fragment FQIDENT
    : IDENT (SPACE? '.' SPACE? IDENT)*
    ;

fragment REAL_NUMBER
    : ( (DECIMAL_DIGITS '.'?) | DECIMAL_DIGITS? '.' DECIMAL_DIGITS ) ( [DdEe] EXPONENT )?
    | '0' [bB] ( (BINARY_DIGITS '.'?) | BINARY_DIGITS? '.' BINARY_DIGITS ) ( [pP] EXPONENT )?
    | '0' [oO] ( (OCTAL_DIGITS '.'?) | OCTAL_DIGITS? '.' OCTAL_DIGITS ) ( [pP] EXPONENT )?
    | '0' [xX] ( (HEXADECIMAL_DIGITS '.'?) | HEXADECIMAL_DIGITS? '.' HEXADECIMAL_DIGITS ) ( [pP] EXPONENT )?
    ;

fragment INTEGER_NUMBER
    : INTEGER_DIGITS [su] ('8'|'16'|'32'|'64')
    ;

fragment INTEGER_DIGITS
    : DECIMAL_DIGITS | ('0' ([bB] BINARY_DIGITS | [oO] OCTAL_DIGITS | [xX] HEXADECIMAL_DIGITS))
    ;

fragment DECIMAL_DIGITS
    : [0-9] [0-9_]*
    ;

fragment BINARY_DIGITS
    : [01] [01_]*
    ;

fragment OCTAL_DIGITS
    : [0-7] [0-7_]*
    ;

fragment HEXADECIMAL_DIGITS
    : [0-9a-fA-F] [0-9a-fA-F_]*
    ;

fragment EXPONENT
    : ('+' | '-')? DECIMAL_DIGITS
    ;
