lexer grammar MathJSLabLexer;

tokens { GLOBAL, PERSISTENT, IF, ENDIF, END, ENDRANGE, ELSEIF, ELSE, SWITCH, ENDSWITCH, CASE, OTHERWISE, WHILE, ENDWHILE, DO, UNTIL, FOR, ENDFOR, PARFOR, ENDPARFOR,
BREAK, CONTINUE, RETURN, FUNCTION, ENDFUNCTION, TRY, CATCH, END_TRY_CATCH, UNWIND_PROTECT, UNWIND_PROTECT_CLEANUP, END_UNWIND_PROTECT, CLASSDEF, ENDCLASSDEF,
ENUMERATION, ENDENUMERATION, PROPERTIES, ENDPROPERTIES, EVENTS, ENDEVENTS, METHODS, ENDMETHODS, WSPACE, STRING }

@members {
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
	    'endmethods'
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
        MathJSLabLexer.ENDMETHODS
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
TILDE: '~' { this.previousTokenType = MathJSLabLexer.TILDE; };
EXCLAMATION: '!' { this.previousTokenType = MathJSLabLexer.EXCLAMATION; };
COMMAT: '@' { this.previousTokenType = MathJSLabLexer.COMMAT; };
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
    this.parenthesisCount--;
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
    this.matrixContext.push(MathJSLabLexer.LCURLYBR);
    this.previousTokenType = MathJSLabLexer.LCURLYBR;
};
RCURLYBR: '}' {
    this.matrixContext.pop();
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
        this.previousTokenType === MathJSLabLexer.DECIMAL_NUMBER
    ) {
        this.previousTokenType = MathJSLabLexer.HERMITIAN;
    } else {
        this.pushMode(MathJSLabLexer.SQ_STRING);
        this.quotedString = '';
        this.skip();
    }
};

DQSTRING
    : '"'{
        this.pushMode(MathJSLabLexer.DQ_STRING);
        this.quotedString = '';
        this.skip();
    }
    ;

IDENTIFIER
    : IDENT (SPACE? '.' SPACE? IDENT)* {
        const ident = this.text.replace(/[ \t]/, '');
        let i = MathJSLabLexer.keywordNames.indexOf(ident);
        if (i >= 0) {
            switch (MathJSLabLexer.keywordTypes[i]) {
                case MathJSLabLexer.END:
                    this._type = this.previousTokenType = this.parenthesisCount > 0 ? MathJSLabLexer.ENDRANGE : MathJSLabLexer.END;
                    break;
                default:
                    this._type = this.previousTokenType = MathJSLabLexer.keywordTypes[i];
            }
        } else {
            i = this.commandNames.indexOf(ident);
            if (i >= 0) {
                this.pushMode(MathJSLabLexer.ANY_AS_STRING_UNTIL_END_OF_LINE);
            }
            this.previousTokenType = MathJSLabLexer.IDENTIFIER;
        }
    }
    ;

DECIMAL_NUMBER
    :  REAL_DECIMAL [IiJj]?  { this.previousTokenType = MathJSLabLexer.DECIMAL_NUMBER; }
    ;

SPACE_OR_CONTINUATION
    : SPACE ( '...' ~[\r\n]* NL )? {
        if (this.matrixContext.length > 0 &&
            this.previousTokenType !== MathJSLabLexer.LBRACKET &&
            this.previousTokenType !== MathJSLabLexer.COMMA &&
            this.previousTokenType !== MathJSLabLexer.SEMICOLON &&
            this.matrixContext[this.matrixContext.length-1] !== MathJSLabLexer.LPAREN
        ) {
            this._type = this.previousTokenType = MathJSLabLexer.WSPACE;
        } else {
            this.skip();
        }
    }
    ;

NEWLINE
    : NL {
        if (this.matrixContext.length > 0 &&
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
        this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;
    }
    ;

COMMENT_LINE
    : CCHAR ~[\r\n]* (NL {
        this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;
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
    : SPACE? CCHAR '{' SPACE? NL { this.pushMode(MathJSLabLexer.BLOCK_COMMENT); this.skip(); }
    ;

BLOCK_COMMENT_END
    :  SPACE? CCHAR '}' SPACE? NL? { this.popMode(); this.skip(); }
    ;

BLOCK_COMMENT_LINE
    : .*? NL -> skip
    ;

BLOCK_COMMENT_EOF
    : ~[\r\n]* EOF { throw new SyntaxError('Block comment open at end of input.'); }
    ;

mode ANY_AS_STRING_UNTIL_END_OF_LINE;

SKIP_SPACE
    : SPACE -> skip
    ;

SKIP_COMMENT_LINE
    : CCHAR ~[\r\n]* {
        this.popMode();
        this.skip();
    }
    ;

EXIT_AT_NEWLINE
    : NL {
        this.popMode();
        this._type = this.previousTokenType = MathJSLabLexer.NEWLINE;
    }
    ;

EXIT_AT_EOF
    : EOF {
        this.popMode();
        this.previousTokenType = MathJSLabLexer.EOF;
    }
    ;

UNQUOTED_STRING
    : ~[ \t\r\n]+ {
        this.previousTokenType = MathJSLabLexer.UNQUOTED_STRING;
    }
    ;

fragment CCHAR
    : ('#' | '%')
    ;

fragment NL
    : '\r' | '\r'? '\n'
    ;

fragment SPACE
    : (' ' | '\t')+
    ;

fragment IDENT
    : [_a-zA-Z][_a-zA-Z0-9]*
    ;

fragment DECIMAL_DIGITS
    : [0-9][0-9_]*
    ;

fragment EXPONENT
    : [DdEe] ('+' | '-')? DECIMAL_DIGITS
    ;

fragment REAL_DECIMAL
    : ( (DECIMAL_DIGITS '.'?) | DECIMAL_DIGITS? '.' DECIMAL_DIGITS ) EXPONENT?
    ;
