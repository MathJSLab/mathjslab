/**
 * MathML.ts - Utilities for MathML formatting.
 * ============================================
 *
 * This file is part of
 * [MathJSLab package](https://www.npmjs.com/package/mathjslab)
 * ([repository](https://github.com/MathJSLab/mathjslab)) -
 * [MIT License](https://opensource.org/license/mit).
 *
 * Copyright © 2016-2025 [Sergio Lindau](mailto:sergiolindau@gmail.com)
 *
 * homepage: [mathjslab.com](https://mathjslab.com/)
 *
 * [ISBN 978-65-00-82338-7](https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7)
 */

/**
 * Generic MathML formatting function.
 */
type FormatFunctionGeneric<T extends (string | string[])[] = (string | string[])[]> = (...args: T) => string;
/**
 * Generic type for FormatRegistry.
 */
type FormatRegistryGeneric<T = any> = { [K in keyof T]: T[K] };
/**
 * Format registry function signatures.
 */
interface FormatRegistry<T extends string = string> {
    '+': (left: T, right: T) => string;
    '-': (left: T, right: T) => string;
    '.*': (left: T, right: T) => string;
    './': (left: T, right: T) => string;
    '.\\': (left: T, right: T) => string;
    '\\': (left: T, right: T) => string;
    '.^': (left: T, right: T) => string;
    '.**': (left: T, right: T) => string;
    '<': (left: T, right: T) => string;
    '<=': (left: T, right: T) => string;
    '>': (left: T, right: T) => string;
    '>=': (left: T, right: T) => string;
    '==': (left: T, right: T) => string;
    '!=': (left: T, right: T) => string;
    '~=': (left: T, right: T) => string;
    '&': (left: T, right: T) => string;
    '|': (left: T, right: T) => string;
    '&&': (left: T, right: T) => string;
    '||': (left: T, right: T) => string;
    '=': (left: T, right: T) => string;
    '+=': (left: T, right: T) => string;
    '-=': (left: T, right: T) => string;
    '*=': (left: T, right: T) => string;
    '/=': (left: T, right: T) => string;
    '\\=': (left: T, right: T) => string;
    '^=': (left: T, right: T) => string;
    '**=': (left: T, right: T) => string;
    '.*=': (left: T, right: T) => string;
    './=': (left: T, right: T) => string;
    '.\\=': (left: T, right: T) => string;
    '.^=': (left: T, right: T) => string;
    '.**=': (left: T, right: T) => string;
    '&=': (left: T, right: T) => string;
    '|=': (left: T, right: T) => string;
    '*': (left: T, right: T) => string;
    '+_': (right: T) => string;
    '-_': (right: T) => string;
    '++_': (right: T) => string;
    '--_': (right: T) => string;
    '_++': (left: T) => string;
    '_--': (left: T) => string;
    '/': (left: T, right: T) => string;
    '^': (left: T, right: T) => string;
    '**': (left: T, right: T) => string;
    ".'": (left: T) => string;
    "'": (left: T) => string;
    '()': (left: T, inner: T, right: T) => string;
    IDENT: (id: T) => string;
    '.': (name: T, fields: T[]) => string;
    LIST: (list: T[]) => string;
    RANGE: (...args: T[]) => string;
    ENDRANGE: () => string;
    ':': () => string;
    '<~>': () => string;
    IDX: (expr: T, left: T, list: T[], right: T) => string;
    RETLIST: () => string;
    CMDWLIST: (cmd: T, list: T[]) => string;
    INVALID: () => string;
    UNDEFINED: () => string;
    ERROR: () => string;
    math: (inner: T, display: T) => string;
    errorReplace: (expr: T) => string;
    abs: (...args: T[]) => string;
    conj: (...args: T[]) => string;
    sqrt: (...args: T[]) => string;
    root: (...args: T[]) => string;
    exp: (...args: T[]) => string;
    logb: (...args: T[]) => string;
    log2: (...args: T[]) => string;
    log10: (...args: T[]) => string;
    gamma: (...args: T[]) => string;
    factorial: (...args: T[]) => string;
}
/**
 * Format registry function names (keys).
 */
type KeyOfFormatRegistry<T extends string = string> = keyof FormatRegistry<T>;
/**
 * Union of all function signatures and generic MathML formatting function signature.
 */
type FormatFunctionUnion<T extends string = string> = FormatRegistry<T>[KeyOfFormatRegistry<T>] | FormatFunctionGeneric<(T | T[])[]>;
/**
 * Union of format functions registry and generic format functions registry.
 */
type FormatRegistryUnion<T extends string = string, K = any> = FormatRegistry<T> & FormatRegistryGeneric<K>;
/**
 * Keys of union of format functions registry and generic format functions registry.
 */
type KeyOfFormatRegistryUnion<T extends string = string, K = any> = keyof FormatRegistryUnion<T, K>;
/**
 * # `MathML` - Utilities for MathML formatting.
 *
 * This is an `abstract class` with only one `static` property: `format`.
 *
 * The `MathML.format` object is a record where the keys represent operations,
 * functions or simply nodes of the abstract syntax tree (AST). The values ​​are
 * MathML formatting functions where the arguments are of type `string` or
 * `string[]` and the return is of type `string`. The functions insert the
 * arguments into structures formatted in MathML language.
 *
 * The way the types were defined allows you to specify the signature of the
 * functions and at the same time allows a generic reference to a formatting
 * function to be used, such as `Math.format['key-name' as any]`.
 *
 * The `MathML` class is an abstract class that was not designed to be
 * instantiated or inherited, but extensions with dynamic properties and
 * methods can be created. The types needed for this are exported by the
 * `MathML` module.
 *
 * This file is part of
 * [MathJSLab package](https://www.npmjs.com/package/mathjslab)
 * ([repository](https://github.com/MathJSLab/mathjslab)) -
 * [MIT License](https://opensource.org/license/mit).
 *
 * Copyright © 2016-2025 [Sergio Lindau](mailto:sergiolindau@gmail.com)
 *
 * homepage: [mathjslab.com](https://mathjslab.com/)
 *
 * [ISBN 978-65-00-82338-7](https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7)
 *
 * ### References
 *
 * Here are some references used to create this code:
 *
 * - [W3C Math Home](https://www.w3.org/Math/)
 *     - [Mathematical Markup Language (MathML) (Latest MathML Recommendation)](https://www.w3.org/TR/MathML/)
 *     - [Mathematical Markup Language (MathML) Version 4.0 (Working Draft)](https://www.w3.org/TR/mathml4/) - [Editor's Draft](https://w3c.github.io/mathml/)
 *     - [MathML Core (Working Draft)](https://www.w3.org/TR/mathml-core/) - [Editor's Draft](https://w3c.github.io/mathml-core/)
 *     - [Mathematical Markup Language (MathML) Version 3.0 2nd Edition](https://www.w3.org/TR/MathML3/)
 *     - [Mathematical Markup Language (MathML) Version 2.0 (Second Edition) - Latest MathML 2 version (Superseded Recommendation)](https://www.w3.org/TR/MathML2/)
 *     - [The MathML Document Object Model](https://www.w3.org/Math/DOM/)
 *     - [Notes on MathML (Group Draft Note)](https://w3c.github.io/mathml-docs/notes-on-mathml/)
 * - [MDN Web Docs - MathML](https://developer.mozilla.org/en-US/docs/Web/MathML)
 *     - [MathML element reference](https://developer.mozilla.org/en-US/docs/Web/MathML/Element)
 *     - [Attributes](https://developer.mozilla.org/en-US/docs/Web/MathML/Attribute)
 *     - [Global attributes](https://developer.mozilla.org/en-US/docs/Web/MathML/Global_attributes)
 * - [Wolfram Research, Inc. - MathML Central](https://www.mathmlcentral.com/)
 *     - [Online MathML conversion tool](https://www.mathmlcentral.com/Tools/ToMathML.jsp)
 * - [Wikipedia - MathML](https://en.wikipedia.org/wiki/MathML)
 * - [m@th IT - Brief Tutorial on MathML](https://www.math-it.org/Publikationen/MathML.html)
 * - [iMathEQ - Online Mathematics Formula Editor](https://www.imatheq.com/)
 * - [MathJax - Beautiful and accessible math in all browsers](https://www.mathjax.org/)
 *
 */
abstract class MathML {
    /**
     * AST nodes, built-in functions and other MathML formatting functions.
     * The keys of `format` object is the AST node `type` property (symbols
     * and uppercase characters), or the name of a built-in function
     * (lowercase characters).
     */
    public static readonly format: FormatRegistryUnion = {
        '+': (left, right) => left + '<mo form="infix" stretchy="true">+</mo>' + right,
        '-': (left, right) => left + '<mo form="infix" stretchy="true">-</mo>' + right,
        '.*': (left, right) => left + '<mo form="infix" stretchy="true">.*</mo>' + right,
        './': (left, right) => left + '<mo form="infix" stretchy="true">./</mo>' + right,
        '.\\': (left, right) => left + '<mo form="infix" stretchy="true">.\\</mo>' + right,
        '\\': (left, right) => left + '<mo form="infix" stretchy="true">\\</mo>' + right,
        '.^': (left, right) => left + '<mo form="infix" stretchy="true">.^</mo>' + right,
        '.**': (left, right) => left + '<mo form="infix" stretchy="true">.**</mo>' + right,
        '<': (left, right) => left + '<mo form="infix" stretchy="true">&lt;</mo>' + right,
        '<=': (left, right) => left + '<mo form="infix" stretchy="true">&le;</mo>' + right,
        '>': (left, right) => left + '<mo form="infix" stretchy="true">&gt;</mo>' + right,
        '>=': (left, right) => left + '<mo form="infix" stretchy="true">&ge;</mo>' + right,
        '==': (left, right) => left + '<mo form="infix" stretchy="true">==</mo>' + right,
        '!=': (left, right) => left + '<mo form="infix" stretchy="true">&ne;</mo>' + right,
        '~=': (left, right) => left + '<mo form="infix" stretchy="true">&ne;</mo>' + right,
        '&': (left, right) => left + '<mo form="infix" stretchy="true">&amp;</mo>' + right,
        '|': (left, right) => left + '<mo form="infix" stretchy="true">|</mo>' + right,
        '&&': (left, right) => left + '<mo form="infix" stretchy="true">&amp;&amp;</mo>' + right,
        '||': (left, right) => left + '<mo form="infix" stretchy="true">||</mo>' + right,
        '=': (left, right) => left + '<mo form="infix" stretchy="true">=</mo>' + right,
        '+=': (left, right) => left + '<mo form="infix" stretchy="true">+=</mo>' + right,
        '-=': (left, right) => left + '<mo form="infix" stretchy="true">-=</mo>' + right,
        '*=': (left, right) => left + '<mo form="infix" stretchy="true">*=</mo>' + right,
        '/=': (left, right) => left + '<mo form="infix" stretchy="true">/=</mo>' + right,
        '\\=': (left, right) => left + '<mo form="infix" stretchy="true">\\=</mo>' + right,
        '^=': (left, right) => left + '<mo form="infix" stretchy="true">^=</mo>' + right,
        '**=': (left, right) => left + '<mo form="infix" stretchy="true">**=</mo>' + right,
        '.*=': (left, right) => left + '<mo form="infix" stretchy="true">.*=</mo>' + right,
        './=': (left, right) => left + '<mo form="infix" stretchy="true">./=</mo>' + right,
        '.\\=': (left, right) => left + '<mo form="infix" stretchy="true">.\\=</mo>' + right,
        '.^=': (left, right) => left + '<mo form="infix" stretchy="true">.^=</mo>' + right,
        '.**=': (left, right) => left + '<mo form="infix" stretchy="true">.**=</mo>' + right,
        '&=': (left, right) => left + '<mo form="infix" stretchy="true">&amp;=</mo>' + right,
        '|=': (left, right) => left + '<mo form="infix" stretchy="true">|=</mo>' + right,
        '*': (left, right) => left + '<mo form="infix" stretchy="true">&times;</mo>' + right,
        '+_': (right) => '<mo form="prefix" stretchy="true">+</mo>' + right,
        '-_': (right) => '<mo form="prefix" stretchy="true">-</mo>' + right,
        '++_': (right) => '<mo form="prefix" stretchy="true">++</mo>' + right,
        '--_': (right) => '<mo form="prefix" stretchy="true">--</mo>' + right,
        '_++': (left) => left + '<mo form="postfix" stretchy="true">++</mo>',
        '_--': (left) => left + '<mo form="postfix" stretchy="true">--</mo>',
        '/': (left, right) => '<mfrac><mrow>' + left + '</mrow><mrow>' + right + '</mrow></mfrac>',
        '^': (left, right) => '<msup><mrow>' + left + '</mrow><mrow>' + right + '</mrow></msup>',
        '**': (left, right) => '<msup><mrow>' + left + '</mrow><mrow>' + right + '</mrow></msup>',
        ".'": (left) => '<msup><mrow>' + left + '</mrow><mrow><mi>T</mi></mrow></msup>',
        "'": (left) => '<msup><mrow>' + left + '</mrow><mrow><mi>H</mi></mrow></msup>',
        '()': (left, inner, right) => '<mo fence="true" stretchy="true">' + left + '</mo>' + inner + '<mo fence="true" stretchy="true">' + right + '</mo>',
        IDENT: (id) => '<mi>' + id + '</mi>',
        '.': (name, fields) => name + '<mo>.</mo>' + fields.join('<mo>.</mo>'),
        LIST: (list) => '<mtable>' + list.map((value) => '<mtr><mtd>' + value + '</mtd></mtr>').join('') + '</mtable>',
        RANGE: (...args) => (args.length ? args.join('<mo>:</mo>') : '<mo>:</mo>'),
        ENDRANGE: () => '<mi>end</mi>',
        ':': () => '<mo>:</mo>',
        '<~>': () => '<mo>~</mo>',
        IDX: (expr, left, list, right) =>
            expr + '<mrow><mo fence="true" stretchy="true">' + left + '</mo>' + list.join('<mo>,</mo>') + '<mo fence="true" stretchy="true">' + right + '</mo></mrow>',
        RETLIST: () => '<mi>RETLIST</mi>',
        CMDWLIST: (cmd, list) => '<mtext>' + cmd + ' ' + list.join(' ') + '</mtext>',
        INVALID: () => '<mi>invalid</mi>',
        UNDEFINED: () => '<mi>undefined tree</mi>',
        ERROR: () => '<mi>error</mi>',
        math: (inner, display) => '<math xmlns = "http://www.w3.org/1998/Math/MathML" display="' + display + '">' + inner + '</math>',
        errorReplace: (expr) => expr.replace(/\<mo\>\(\<\/mo\>\<mi\>error\<\/mi\><\mi\>error\<\/mi\>\<mi\>i\<\/mi\>\<mo\>\)\<\/mo\>/gi, '<mi>error</mi>'),
        abs: (...args) => '<mrow><mo fence="true" stretchy="true">|</mo>' + args[0] + '<mo fence="true" stretchy="true">|</mo></mrow>',
        conj: (...args) => '<mover accent="true"><mrow>' + args[0] + '</mrow><mo stretchy="true">‾</mo></mover>',
        sqrt: (...args) => '<msqrt><mrow>' + args[0] + '</mrow></msqrt>',
        root: (...args) => '<mroot><mrow>' + args[0] + '</mrow><mrow>' + args[1] + '</mrow></mroot>',
        exp: (...args) => '<msup><mi>e</mi><mrow>' + args[0] + '</mrow></msup>',
        logb: (...args) => '<mrow><msub><mi>log</mi><mrow>' + args[0] + '</mrow></msub><mrow>' + args[1] + '</mrow></mrow>',
        log2: (...args) => '<mrow><msub><mi>log</mi><mrow><mn>2</mn></mrow></msub><mrow>' + args[0] + '</mrow></mrow>',
        log10: (...args) => '<mrow><msub><mi>log</mi><mrow><mn>10</mn></mrow></msub><mrow>' + args[0] + '</mrow></mrow>',
        gamma: (...args) => '<mi>&Gamma;</mi><mrow><mo fence="true" stretchy="true">(</mo>' + args[0] + '<mo fence="true" stretchy="true">)</mo></mrow>',
        factorial: (...args) => '<mrow>' + args[0] + '</mrow><mo format="postfix" stretchy="true">!</mo>',
    };
}
/**
 * Exports.
 */
export type { FormatFunctionUnion as FormatFunction, FormatRegistryUnion as FormatRegistry, KeyOfFormatRegistryUnion as KeyOfFormatRegistry };
const format = MathML.format;
export { format, MathML };
/**
 * Default export.
 */
export default { format, MathML };
