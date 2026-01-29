/**
 * MATLAB®/Octave like syntax parser/interpreter/compiler.
 */

import { CharStreams, CommonTokenStream, DiagnosticErrorListener, PredictionMode } from 'antlr4';

import MathJSLabLexer from './MathJSLabLexer';
import MathJSLabParser from './MathJSLabParser';
import { LexerErrorListener } from './LexerErrorListener';
import { ParserErrorListener } from './ParserErrorListener';
import type { OperatorType, NodeInput, NodeExpr, NodeIdentifier, NodeIndexExpr, ReturnHandlerResult, NodeReturnList, NodeType } from './AST';
import { AST, CharString, Complex, ComplexType, MultiArray, Structure, FunctionHandle } from './AST';
import type { MathObject, MathOperationType, UnaryMathOperation, BinaryMathOperation, KeyOfTypeOfMathOperation } from './MathOperation';
import { MathOperation } from './MathOperation';
import { substSymbol } from './substSymbol';
import { CoreFunctions } from './CoreFunctions';
import { LinearAlgebra } from './LinearAlgebra';
import { Configuration } from './Configuration';
import { SymbolTable } from './SymbolTable';
import { MathML } from './MathML';

/**
 * `aliasNameTable` type.
 */
type AliasNameTable = Record<string, RegExp>;

/**
 * `aliasNameFunction` type.
 */
type AliasNameFunction = (name: string) => string;

/**
 * `builtInFunctionTable` entry type.
 */
type BuiltInFunctionTableEntry = {
    type: 'BUILTIN';
    mapper: boolean;
    ev: boolean[];
    func: Function;
    UnparserMathML?: (tree: NodeInput) => string;
};

/**
 * `builtInFunctionTable` type.
 */
type BuiltInFunctionTable = Record<string, BuiltInFunctionTableEntry>;

/**
 * `localTable` type.
 */
type LocalTable = Record<string, NodeInput>;

/**
 * `nameTable` entry type.
 */
type NameTableEntry = {
    undefined?: string;
    node: NodeExpr;
};

/**
 * `nameTable` type.
 */
type NameTable = Record<string, NameTableEntry>;

/**
 * `undefinedReferenceTable` type.
 */
type UndefinedReferenceTable = Record<string, string[]>;

/**
 * `commandWordListTable` function type.
 */
type CommandWordListFunction = (...args: string[]) => any;

/**
 * `commandWordListTable` entry type.
 */
type CommandWordListTableEntry = {
    func: CommandWordListFunction;
};

/**
 * `commandWordListTable` type.
 */
type CommandWordListTable = Record<string, CommandWordListTableEntry>;

/**
 * `response` type
 */
type ExitStatus = number;
type ExitStatusValues = Record<string, ExitStatus>;

/**
 * EvaluatorConfig type.
 */
type EvaluatorConfig = {
    aliasNameTable?: AliasNameTable;
    externalFunctionTable?: BuiltInFunctionTable;
    externalCmdWListTable?: CommandWordListTable;
};

/**
 * Increment and decrement operator handler type.
 */
type IncDecOperator = (tree: NodeIdentifier) => MathObject;

/**
 * Evaluator instance interface.
 */
interface EvaluatorInterface {
    debug: boolean;
    nativeNameTableList: string[];
    nameTable: NameTable;
    builtInFunctionList: string[];
    localTable: LocalTable;
    exitStatus: ExitStatus;
    precedenceTable: { [key: string]: number };
    aliasNameFunction: AliasNameFunction;
    Parse(input: string): NodeInput;
    Restart(): void;
    Clear(...names: string[]): void;
    Evaluator(tree: NodeInput, local?: boolean, fname?: string): NodeInput;
    Evaluate(tree: NodeInput): NodeInput;
    Unparse(tree: NodeInput, parentPrecedence?: number): string;
    UnparserMathML(tree: NodeInput, parentPrecedence: number): string;
    UnparseMathML(tree: NodeInput, display: 'inline' | 'block'): string;
    ToMathML(input: string, display: 'inline' | 'block'): string;
}

/**
 * `Evaluator` object.
 */
class Evaluator implements EvaluatorInterface {
    /**
     * After run `Evaluate` method, the `exitStatus` property will contains
     * exit state of evaluation.
     */
    public static readonly response: ExitStatusValues = {
        EXTERNAL: -2,
        WARNING: -1,
        OK: 0,
        LEX_ERROR: 1,
        PARSER_ERROR: 2,
        EVAL_ERROR: 3,
    };

    /**
     * Private debug flag.
     */
    private _debug: boolean = false;
    /**
     * `debug` getter.
     */
    public get debug(): boolean {
        return this._debug;
    }
    /**
     * `debug` setter.
     */
    public set debug(value: boolean) {
        this._debug = value;
    }

    /**
     * Native name table. It's inserted in nameTable when Evaluator constructor executed.
     */
    private nativeNameTable: Record<string, ComplexType>;

    /**
     * Native name table list.
     */
    private _nativeNameTableList: string[];

    /**
     * Native name table list getter.
     */
    public get nativeNameTableList(): string[] {
        return this._nativeNameTableList;
    }

    /**
     * Alias name table.
     */
    private aliasNameTable: AliasNameTable;

    // /**
    //  * Symbol table.
    //  */
    // private _symbolTable: SymbolTable;

    // /**
    //  * Symbol table getter.
    //  */
    // public get symbolTable(): SymbolTable {
    //     return this._symbolTable;
    // }

    /**
     * Name table.
     */
    private _nameTable: NameTable = {};

    /**
     * Name table getter.
     */
    public get nameTable(): NameTable {
        return this._nameTable;
    }

    /**
     * Undefined Reference table.
     */
    private undefinedReferenceTable: UndefinedReferenceTable = {};

    /**
     * Built-in function table.
     */
    private builtInFunctionTable: BuiltInFunctionTable = {};

    /**
     * Get a list of names of defined functions in builtInFunctionTable.
     */
    public get builtInFunctionList(): string[] {
        return Object.keys(this.builtInFunctionTable);
    }

    /**
     * Local table.
     */
    private _localTable: LocalTable = {};

    /**
     * Local table getter.
     */
    public get localTable(): LocalTable {
        return this._localTable;
    }

    /**
     * Command word list table.
     */
    private commandWordListTable: CommandWordListTable = {
        clear: {
            func: (...args: string[]): void => this.Clear(...args),
        },
        /* Debug purpose commands */
        __operators__: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                const operators = Object.keys(this.opTable).sort();
                const result = new MultiArray([operators.length, 1], null, true);
                result.array = operators.map((operator) => [new CharString(operator)]);
                return result;
            },
        },
        __keywords__: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                const keywords = MathJSLabLexer.keywordNames.slice(1).sort() as string[];
                const result = new MultiArray([keywords.length, 1], null, true);
                result.array = keywords.map((keyword) => [new CharString(keyword)]);
                return result;
            },
        },
        __builtins__: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                const result = new MultiArray([this.builtInFunctionList.length, 1], null, true);
                result.array = this.builtInFunctionList.sort().map((name) => [new CharString(name)]);
                return result;
            },
        },
        __list_functions__: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                return MultiArray.emptyArray(true);
            },
        },
        localfunctions: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                return MultiArray.emptyArray(true);
            },
        },
        __dump_symtab_info__: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                return MultiArray.emptyArray(true);
            },
        },
    };

    /**
     * Evaluator exit status.
     */
    private _exitStatus: ExitStatus;

    /**
     * Evaluator exit status getter.
     */
    public get exitStatus(): ExitStatus {
        return this._exitStatus;
    }

    /**
     * Increment and decrement operator
     * @param pre `true` if prefixed. `false` if postfixed.
     * @param operation Operation (`'plus'` or `'minus'`).
     * @returns Operator function with signature `(tree: NodeIdentifier) => MathObject`.
     */
    private incDecOpFactory(pre: boolean, operation: 'plus' | 'minus'): IncDecOperator {
        if (pre) {
            return (tree: NodeIdentifier): MathObject => {
                if (tree.type === 'IDENT') {
                    if (typeof this._nameTable[tree.id] !== 'undefined') {
                        this._nameTable[tree.id].node = MathOperation[operation](this._nameTable[tree.id].node, Complex.one());
                        return this._nameTable[tree.id].node;
                    } else {
                        throw new EvalError(`in ${operation === 'plus' ? '++' : '--'}${tree.id}, ${tree.id} must be defined first.`);
                    }
                } else {
                    throw new SyntaxError(`invalid prefixed ${operation === 'plus' ? 'increment' : 'decrement'} variable.`);
                }
            };
        } else {
            return (tree: NodeIdentifier): MathObject => {
                if (tree.type === 'IDENT') {
                    if (typeof this._nameTable[tree.id] !== 'undefined') {
                        const value = MathOperation.copy(this._nameTable[tree.id].node);
                        this._nameTable[tree.id].node = MathOperation[operation](this._nameTable[tree.id].node, Complex.one());
                        return value;
                    } else {
                        throw new EvalError(`in ${tree.id}${operation === 'plus' ? '++' : '--'}, ${tree.id} must be defined first.`);
                    }
                } else {
                    throw new SyntaxError(`invalid postfixed ${operation === 'plus' ? 'increment' : 'decrement'} variable.`);
                }
            };
        }
    }

    /**
     * Operator table.
     */
    private readonly opTable: Record<string, MathOperationType | IncDecOperator> = {
        '+': MathOperation.plus,
        '-': MathOperation.minus,
        '.*': MathOperation.times,
        '*': MathOperation.mtimes,
        './': MathOperation.rdivide,
        '/': MathOperation.mrdivide,
        '.\\': MathOperation.ldivide,
        '\\': MathOperation.mldivide,
        '.^': MathOperation.power,
        '^': MathOperation.mpower,
        '+_': MathOperation.uplus,
        '-_': MathOperation.uminus,
        ".'": MathOperation.transpose,
        "'": MathOperation.ctranspose,
        '<': MathOperation.lt,
        '<=': MathOperation.le,
        '==': MathOperation.eq,
        '>=': MathOperation.ge,
        '>': MathOperation.gt,
        '!=': MathOperation.ne,
        '&': MathOperation.and,
        '|': MathOperation.or,
        '!': MathOperation.not,
        '&&': MathOperation.mand,
        '||': MathOperation.mor,
        '++_': this.incDecOpFactory(true, 'plus'),
        '--_': this.incDecOpFactory(true, 'minus'),
        '_++': this.incDecOpFactory(false, 'plus'),
        '_--': this.incDecOpFactory(false, 'minus'),
    };

    private static readonly precedence: string[][] = [
        ['min', '=', '+=', '-=', '*=', '/=', '\\='],
        ['||'],
        ['&&'],
        ['|'],
        ['&'],
        ['!=', '<', '>', '<=', '>='],
        ['+', '-'],
        ['.*', '*', './', '/', '.\\', '\\'],
        ['^', '.**', '**', ".'", "'"],
        ['!', '~', '-_', '+_'],
        ['preMax', '_.^', '_.**', '_^', '_**', "__.'", "__'", '__++'],
        ['max', '()', 'IDENT', 'ENDRANGE', ':', '<~>', '.'],
    ];

    /**
     * Operator precedence table.
     */
    private _precedenceTable: { [key: string]: number };

    /**
     * Operator precedence table getter.
     */
    public get precedenceTable(): { [key: string]: number } {
        return this._precedenceTable;
    }

    /**
     * Load precedence table.
     */
    private loadPrecedenceTable() {
        this._precedenceTable = {};
        Evaluator.precedence.forEach((list, precedence) => {
            list.forEach((field) => {
                this._precedenceTable[field] = precedence + 1;
            });
        });
        /* Set precedenceTable aliases */
        this._precedenceTable['**'] = this._precedenceTable['^'];
        this._precedenceTable['.**'] = this._precedenceTable['.^'];
        this._precedenceTable['_**'] = this._precedenceTable['_^'];
        this._precedenceTable['_.**'] = this._precedenceTable['_.^'];
        this._precedenceTable['~='] = this._precedenceTable['!='];
        this._precedenceTable['~'] = this._precedenceTable['!'];
    }

    /**
     * Get tree node precedence.
     * @param tree Tree node.
     * @returns Node precedence.
     */
    private nodePrecedence(tree: NodeInput): number {
        if (typeof tree.type === 'number') {
            /* If `typeof tree.type === 'number'` then tree is a literal number or singleton element.  */
            if (Complex.isInstanceOf(tree)) {
                return Complex.precedence(tree, this);
            } else {
                return this._precedenceTable.max;
            }
        } else if (tree.type === 'IDX') {
            const aliasTreeName = this._aliasNameFunction(tree.expr.id);
            return tree.expr.type === 'IDENT' && aliasTreeName in this.builtInFunctionTable && (!!this.builtInFunctionTable[aliasTreeName].UnparserMathML || aliasTreeName in MathML.format)
                ? this._precedenceTable.max
                : this._precedenceTable.preMax;
        } else if (tree.type === 'RANGE') {
            return tree.start_ && tree.stop_ ? this._precedenceTable.min : this._precedenceTable.max;
        } else {
            return this._precedenceTable[tree.type] || 0;
        }
    }

    /**
     * User functions.
     */
    private readonly functions: Record<string, Function> = {
        unparse: (tree: NodeInput): CharString => new CharString(this.Unparse(tree)),
    };

    /**
     * Special functions MathML unparser.
     */
    private readonly unparseMathMLFunctions: Record<string, (tree: NodeIndexExpr) => string> = {
        logb: (tree: NodeIndexExpr): string => {
            let unparseArgument = this.UnparserMathML(tree.args[1]);
            if (this.nodePrecedence(tree.args[1]) < this._precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['logb'](this.UnparserMathML(tree.args[0]), unparseArgument);
        },
        log2: (tree: NodeIndexExpr): string => {
            let unparseArgument = this.UnparserMathML(tree.args[0]);
            if (this.nodePrecedence(tree.args[0]) < this._precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['log2'](unparseArgument);
        },
        log10: (tree: NodeIndexExpr): string => {
            let unparseArgument = this.UnparserMathML(tree.args[0]);
            if (this.nodePrecedence(tree.args[0]) < this._precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['log10'](unparseArgument);
        },
        factorial: (tree: NodeIndexExpr): string => {
            let unparseArgument = this.UnparserMathML(tree.args[0]);
            if (this.nodePrecedence(tree.args[0]) < this._precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['factorial'](unparseArgument);
        },
    };

    /**
     * Alias name function. This property is set at Evaluator instantiation.
     * @param name Alias name.
     * @returns Canonical name.
     */
    private _aliasNameFunction: AliasNameFunction = (name: string): string => name;

    /**
     * Alias name function setter.
     */
    public set aliasNameFunction(func: AliasNameFunction) {
        this._aliasNameFunction = func;
    }

    /**
     * Alias name function getter.
     */
    public get aliasNameFunction(): AliasNameFunction {
        return this._aliasNameFunction;
    }

    /**
     * Load the `Evaluator`.
     * @param config
     */
    private loadEvaluator(config?: EvaluatorConfig) {
        this._exitStatus = Evaluator.response.OK;
        this._nameTable = {};
        this.undefinedReferenceTable = {};
        this._localTable = {};
        this.loadNativeNameTable();
        AST.reload();
        /* Define Evaluator functions */
        for (const func in this.functions) {
            this.defineFunction(func, this.functions[func]);
        }
        /* Define function operators */
        for (const func in MathOperation.leftAssociativeMultipleOperations) {
            this.defineLeftAssociativeMultipleOperationFunction(func as KeyOfTypeOfMathOperation, MathOperation.leftAssociativeMultipleOperations[func as KeyOfTypeOfMathOperation]!);
        }
        for (const func in MathOperation.binaryOperations) {
            this.defineBinaryOperatorFunction(func as KeyOfTypeOfMathOperation, MathOperation.binaryOperations[func as KeyOfTypeOfMathOperation]!);
        }
        for (const func in MathOperation.unaryOperations) {
            this.defineUnaryOperatorFunction(func as KeyOfTypeOfMathOperation, MathOperation.unaryOperations[func as KeyOfTypeOfMathOperation]!);
        }
        /* Define function mappers */
        for (const func in Complex.mapFunction) {
            this.defineFunction(func, Complex.mapFunction[func], true);
        }
        /* Define other functions */
        for (const func in Complex.twoArgFunction) {
            this.defineFunction(func, Complex.twoArgFunction[func]);
        }
        /* Define Configuration functions */
        for (const func in Configuration.functions) {
            this.defineFunction(func, Configuration.functions[func]);
        }
        /* Define CoreFunctions functions */
        for (const func in CoreFunctions.functions) {
            this.defineFunction(func, CoreFunctions.functions[func]);
        }
        /* Define LinearAlgebra functions */
        for (const func in LinearAlgebra.functions) {
            this.defineFunction(func, LinearAlgebra.functions[func as keyof LinearAlgebra]);
        }
        /* Load UnparserMathML for special functions */
        for (const func in this.unparseMathMLFunctions) {
            this.builtInFunctionTable[func].UnparserMathML = this.unparseMathMLFunctions[func];
        }
        if (config) {
            if (config.aliasNameTable) {
                this.aliasNameTable = config.aliasNameTable;
                this._aliasNameFunction = (name: string): string => {
                    let result = false;
                    let aliasname = '';
                    for (const i in this.aliasNameTable) {
                        if (this.aliasNameTable[i].test(name)) {
                            result = true;
                            aliasname = i;
                            break;
                        }
                    }
                    if (result) {
                        return aliasname;
                    } else {
                        return name;
                    }
                };
            } else {
                this._aliasNameFunction = (name: string): string => name;
            }
            if (config.externalFunctionTable) {
                Object.assign(this.builtInFunctionTable, config.externalFunctionTable);
            }
            if (config.externalCmdWListTable) {
                Object.assign(this.commandWordListTable, config.externalCmdWListTable);
            }
        } else {
            this._aliasNameFunction = (name: string): string => name;
        }
        // this.symbolTable = new SymbolTable(this.builtInFunctionTable, this._aliasNameFunction);
    }

    /**
     * `Evaluator` object private constructor
     */
    private constructor(config?: EvaluatorConfig) {
        /* Set opTable aliases */
        this.opTable['**'] = this.opTable['^'];
        this.opTable['.**'] = this.opTable['.^'];
        this.opTable['~='] = this.opTable['!='];
        this.opTable['~'] = this.opTable['!'];
        this.loadPrecedenceTable();
        this.loadEvaluator(config);
    }

    /**
     * Creates an instance of the `Evaluator` object.
     * @param config
     * @returns
     */
    public static readonly Create = (config?: EvaluatorConfig): Evaluator => new Evaluator(config);

    /**
     * Parse input string.
     * @param input String to parse.
     * @returns Abstract syntax tree of input.
     */
    public Parse(input: string): NodeInput {
        // Give the lexer the input as a stream of characters.
        const inputStream = CharStreams.fromString(input);
        const lexer = new MathJSLabLexer(inputStream);

        // Set word-list commands in lexer.
        lexer.commandNames = Object.keys(this.commandWordListTable);

        // Create a stream of tokens and give it to the parser. Set parser to construct a parse tree.
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new MathJSLabParser(tokenStream);
        parser.buildParseTrees = true;

        // Remove error listeners and add LexerErrorListener and ParserErrorListener.
        lexer.removeErrorListeners();
        lexer.addErrorListener(new LexerErrorListener());
        parser.removeErrorListeners();
        parser.addErrorListener(new ParserErrorListener());
        if (this._debug) {
            // Add DiagnosticErrorListener to parser to notify when the parser
            // detects an ambiguity. Set prediction mode to report all ambiguities.
            // parser.addErrorListener(new DiagnosticErrorListener());
            // parser._interp.predictionMode = PredictionMode.LL_EXACT_AMBIG_DETECTION;
        }

        // Parse input and return AST.
        return parser.input().node;
    }

    /**
     * Load native name table in the name table.
     */
    private loadNativeNameTable(): void {
        this.nativeNameTable = {
            false: Complex.false(),
            true: Complex.true(),
            i: Complex.onei(),
            I: Complex.onei(),
            j: Complex.onei(),
            J: Complex.onei(),
            e: Complex.e(),
            pi: Complex.pi(),
            inf: Complex.inf_0(),
            Inf: Complex.inf_0(),
            nan: Complex.NaN_0(),
            NaN: Complex.NaN_0(),
        };
        this._nativeNameTableList = Object.keys(this.nativeNameTable);
        /* Insert nativeNameTable in nameTable */
        for (const name in this.nativeNameTable) {
            this._nameTable[name] = {
                node: this.nativeNameTable[name],
            };
        }
    }

    /**
     * Restart evaluator.
     */
    public Restart(): void {
        this.loadEvaluator();
    }

    /**
     * Clear variables. If names is 0 lenght restart evaluator.
     * @param names Variable names to clear in nameTable and builtInFunctionTable.
     */
    public Clear(...names: string[]): void {
        if (names.length === 0) {
            this.Restart();
        } else {
            names.forEach((name) => {
                delete this._nameTable[name];
                delete this.builtInFunctionTable[name];
                if (this._nativeNameTableList.includes(name)) {
                    this._nameTable[name] = {
                        node: this.nativeNameTable[name],
                    };
                }
            });
        }
    }

    /**
     * Validate left side of assignment node.
     * @param tree Left side of assignment node.
     * @param shallow True if tree is a left root of assignment.
     * @returns An object with four properties: `left`, `id`, `args` and `field`.
     */
    private validateAssignment(tree: NodeExpr, shallow: boolean, local: boolean, fname: string): { id: string; index: NodeExpr[]; field: string[] }[] {
        const invalidLeftAssignmentMessage = 'invalid left hand side of assignment';
        if (tree.type === 'IDENT') {
            return [
                {
                    id: tree.id,
                    index: [],
                    field: [],
                },
            ];
        } else if (tree.type === 'IDX' && tree.expr.type === 'IDENT') {
            return [
                {
                    id: tree.expr.id,
                    index: tree.args,
                    field: [],
                },
            ];
        } else if (tree.type === '.') {
            const field = tree.field.map((field: NodeExpr) => {
                if (typeof field === 'string') {
                    return field;
                } else {
                    const result = AST.reduceToFirstIfReturnList(this.Evaluator(field, local, fname));
                    if (CharString.isInstanceOf(result)) {
                        return result.str;
                    } else {
                        throw new EvalError(`${invalidLeftAssignmentMessage}: dynamic structure field names must be strings.`);
                    }
                }
            });
            if (tree.obj.type === 'IDENT') {
                return [
                    {
                        id: tree.obj.id,
                        index: [],
                        field,
                    },
                ];
            } else if (tree.obj.type === 'IDX' && tree.obj.expr.type === 'IDENT') {
                return [
                    {
                        id: tree.obj.expr.id,
                        index: tree.obj.args,
                        field,
                    },
                ];
            } else {
                throw new EvalError(`${invalidLeftAssignmentMessage}.`);
            }
        } else if (tree.type === '<~>') {
            return [
                {
                    id: '~',
                    index: [],
                    field: [],
                },
            ];
        } else if (shallow && MultiArray.isRowVector(tree)) {
            return tree.array[0].map((left: NodeExpr) => this.validateAssignment(left, false, local, fname)[0]);
        } else {
            throw new EvalError(`${invalidLeftAssignmentMessage}.`);
        }
    }

    /**
     * Define function in builtInFunctionTable.
     * @param name Name of function.
     * @param func Function body.
     * @param map `true` if function is a mapper function.
     * @param ev A `boolean` array indicating which function argument should
     * be evaluated before executing the function. If array is zero-length all
     * arguments are evaluated.
     */
    private defineFunction(name: string, func: Function, mapper: boolean = false, ev: boolean[] = []): void {
        this.builtInFunctionTable[name] = { type: 'BUILTIN', mapper, ev, func };
    }

    /**
     * Define unary operator function in builtInFunctionTable.
     * @param name Name of function.
     * @param func Function body.
     */
    private defineUnaryOperatorFunction(name: KeyOfTypeOfMathOperation, func: UnaryMathOperation): void {
        this.builtInFunctionTable[name] = {
            type: 'BUILTIN',
            mapper: false,
            ev: [],
            func: (...operand: NodeExpr) => {
                if (operand.length === 1) {
                    return func(operand[0]);
                } else {
                    throw new EvalError(`Invalid call to ${name}. Type 'help ${name}' to see correct usage.`);
                }
            },
        };
    }

    /**
     * Define binary operator function in builtInFunctionTable.
     * @param name Name of function.
     * @param func Function body.
     */
    private defineBinaryOperatorFunction(name: KeyOfTypeOfMathOperation, func: BinaryMathOperation): void {
        this.builtInFunctionTable[name] = {
            type: 'BUILTIN',
            mapper: false,
            ev: [],
            func: (left: NodeExpr, ...right: NodeExpr) => {
                if (right.length === 1) {
                    return func(left, right[0]);
                } else {
                    throw new EvalError(`Invalid call to ${name}. Type 'help ${name}' to see correct usage.`);
                }
            },
        };
    }

    /**
     * Define define two-or-more operand function in builtInFunctionTable.
     * @param name
     * @param func
     */
    private defineLeftAssociativeMultipleOperationFunction(name: KeyOfTypeOfMathOperation, func: BinaryMathOperation): void {
        this.builtInFunctionTable[name] = {
            type: 'BUILTIN',
            mapper: false,
            ev: [],
            func: (left: NodeExpr, ...right: NodeExpr) => {
                if (right.length === 1) {
                    return func(left, right[0]);
                } else if (right.length > 1) {
                    let result = func(left, right[0]);
                    for (let i = 1; i < right.length; i++) {
                        result = func(result, right[i]);
                    }
                    return result;
                } else {
                    throw new EvalError(`Invalid call to ${name}. Type 'help ${name}' to see correct usage.`);
                }
            },
        };
    }

    /**
     *
     * @param tree
     * @returns
     */
    private toBoolean(tree: NodeExpr): boolean {
        const value = MultiArray.isInstanceOf(tree) ? MultiArray.toLogical(tree) : tree;
        if (Complex.isInstanceOf(tree)) {
            return Boolean(Complex.realToNumber(value) || Complex.imagToNumber(value));
        } else {
            return !!value.str;
        }
    }

    /**
     *
     * @param id
     */
    private solveUndefined(id: string): void {
        if (typeof this.undefinedReferenceTable[id] !== 'undefined') {
            /* Remove duplicates and undefined. */
            this.undefinedReferenceTable[id] = this.undefinedReferenceTable[id].filter((value, index, self) => value && self.indexOf(value) === index);
            /* Create a copy. */
            let undefinedReferenceEntry = this.undefinedReferenceTable[id].slice();
            /* Stores resolved references. */
            const solvedReference: string[] = [];
            this.undefinedReferenceTable[id].forEach((ref, index) => {
                if (typeof this._nameTable[ref] !== 'undefined') {
                    try {
                        this._nameTable[ref].node = AST.reduceToFirstIfReturnList(this.Evaluator(this._nameTable[ref].node));
                        delete this._nameTable[ref].undefined;
                        undefinedReferenceEntry[index] = undefined as unknown as string;
                        solvedReference.push(ref);
                    } catch (e: unknown) {
                        if (e instanceof ReferenceError) {
                            const match = e.message.match(/^'([^']+)'\s+undefined\.?$/);
                            if (match) {
                                undefinedReferenceEntry[index] = match[1];
                                this._nameTable[ref].undefined = match[1];
                            }
                        }
                    }
                } else {
                    undefinedReferenceEntry[index] = undefined as unknown as string;
                }
            });
            this.undefinedReferenceTable[id] = undefinedReferenceEntry.filter((value) => value);
            solvedReference.forEach((ref) => this.solveUndefined(ref));
        }
    }

    /**
     * Expression tree recursive evaluator.
     * @param tree Expression to evaluate.
     * @param local Set `true` if evaluating function.
     * @param fname Function name if evaluating function.
     * @returns Expression `tree` evaluated.
     */
    public Evaluator(tree: NodeInput, local: boolean = false, fname: string = ''): NodeInput {
        if (this._debug) {
            console.log(
                `Evaluator(\ntree:${JSON.stringify(
                    tree,
                    (key: string, value: NodeInput) => (key !== 'parent' ? value : value === null ? 'root' : true),
                    2,
                )},\nlocal:${local},\nfname:${fname});`,
            );
        }
        if (tree) {
            if (Complex.isInstanceOf(tree) || FunctionHandle.isInstanceOf(tree) || CharString.isInstanceOf(tree) || Structure.isInstanceOf(tree)) {
                return tree;
            } else if (MultiArray.isInstanceOf(tree)) {
                return MultiArray.evaluate(tree, this, local, fname);
            } else {
                switch (tree.type) {
                    case '+':
                    case '-':
                    case '.*':
                    case '*':
                    case './':
                    case '/':
                    case '.\\':
                    case '\\':
                    case '.^':
                    case '^':
                    case '.**':
                    case '**':
                    case '<':
                    case '<=':
                    case '==':
                    case '>=':
                    case '>':
                    case '!=':
                    case '~=':
                    case '&':
                    case '|':
                    case '&&':
                    case '||':
                        tree.left.parent = tree;
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as BinaryMathOperation)(
                            AST.reduceToFirstIfReturnList(this.Evaluator(tree.left, local, fname)),
                            AST.reduceToFirstIfReturnList(this.Evaluator(tree.right, local, fname)),
                        );
                    case '()':
                        tree.right.parent = tree;
                        return AST.reduceToFirstIfReturnList(this.Evaluator(tree.right, local, fname));
                    case '!':
                    case '~':
                    case '+_':
                    case '-_':
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as UnaryMathOperation)(AST.reduceToFirstIfReturnList(this.Evaluator(tree.right, local, fname)));
                    case '++_':
                    case '--_':
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as IncDecOperator)(tree.right);
                    case ".'":
                    case "'":
                        tree.left.parent = tree;
                        return (this.opTable[tree.type] as UnaryMathOperation)(AST.reduceToFirstIfReturnList(this.Evaluator(tree.left, local, fname)));
                    case '_++':
                    case '_--':
                        tree.left.parent = tree;
                        return (this.opTable[tree.type] as IncDecOperator)(tree.left);
                    case '=':
                    case '+=':
                    case '-=':
                    case '*=':
                    case '/=':
                    case '\\=':
                    case '^=':
                    case '**=':
                    case '.*=':
                    case './=':
                    case '.\\=':
                    case '.^=':
                    case '.**=':
                    case '&=':
                    case '|=': {
                        /* `tree` is an assignment */
                        tree.left.parent = tree;
                        tree.right.parent = tree;
                        const assignment = this.validateAssignment(tree.left, true, local, fname);
                        const op: OperatorType | '' = tree.type.substring(0, tree.type.length - 1);
                        if (assignment.length > 1 && op.length > 0) {
                            throw new EvalError('computed multiple assignment not allowed.');
                        }
                        let right: NodeExpr;
                        let undefinedReference: string | undefined;
                        let error: Error | undefined;
                        try {
                            right = this.Evaluator(tree.right, false, fname);
                        } catch (e: unknown) {
                            error = e as Error;
                            right = tree.right;
                            if (e instanceof ReferenceError) {
                                const match = e.message.match(/^'([^']+)'\s+undefined\.?$/);
                                if (match) {
                                    undefinedReference = match[1];
                                }
                            }

                            /* Convert `right` to `'RETLIST'` if the node is not already of that type. */
                        }
                        if (right.type !== 'RETLIST') {
                            const result = right;
                            right = AST.nodeReturnList((evaluated: ReturnHandlerResult, index: number) => {
                                if (index === 0) {
                                    return result;
                                } else {
                                    AST.throwErrorIfGreaterThanReturnList(evaluated.length, index);
                                }
                            });
                        }
                        const resultList = AST.nodeListFirst();
                        const evaluated = (right as NodeReturnList).handler(assignment.length);
                        for (let n = 0; n < assignment.length; n++) {
                            const { id, index, field } = assignment[n];
                            if (id !== '~') {
                                /* Do assignment */
                                if (index.length === 0) {
                                    /* Name definition. */
                                    const rightN = (right as NodeReturnList).selector(evaluated, n);
                                    rightN.parent = tree.right;
                                    const expr = op.length
                                        ? typeof error !== 'undefined'
                                            ? AST.nodeOp(op as OperatorType, AST.nodeIdentifier(id), rightN)
                                            : this.Evaluator(AST.nodeOp(op as OperatorType, AST.nodeIdentifier(id), rightN))
                                        : rightN;
                                    try {
                                        if (field.length > 0) {
                                            if (typeof this._nameTable[id] === 'undefined') {
                                                this._nameTable[id] = {
                                                    node: new Structure({}),
                                                };
                                            }
                                            if (Structure.isInstanceOf(this._nameTable[id].node)) {
                                                Structure.setNewField(this._nameTable[id].node, field, AST.reduceToFirstIfReturnList(expr));
                                            } else {
                                                throw new EvalError('in indexed assignment.');
                                            }
                                            AST.appendNodeList(resultList, AST.nodeOp('=', AST.nodeIdentifier(id), this._nameTable[id].node));
                                        } else {
                                            if (undefinedReference) {
                                                if (typeof this.undefinedReferenceTable[undefinedReference] !== 'undefined') {
                                                    this.undefinedReferenceTable[undefinedReference].push(id);
                                                } else {
                                                    this.undefinedReferenceTable[undefinedReference] = [id];
                                                }
                                                this._nameTable[id] = {
                                                    undefined: undefinedReference,
                                                    node: AST.reduceToFirstIfReturnList(expr),
                                                };
                                            } else {
                                                this._nameTable[id] = {
                                                    node: AST.reduceToFirstIfReturnList(expr),
                                                };
                                            }
                                            this.solveUndefined(id);
                                            AST.appendNodeList(resultList, AST.nodeOp('=', AST.nodeIdentifier(id), this._nameTable[id].node));
                                            if (error) throw error;
                                        }
                                    } catch (e: unknown) {
                                        this._nameTable[id] = {
                                            node: expr,
                                        };
                                        throw e as Error;
                                    }
                                } else {
                                    /* Function definition or indexed matrix reference. */
                                    if (op) {
                                        if (typeof this._nameTable[id] !== 'undefined') {
                                            if (!FunctionHandle.isInstanceOf(this._nameTable[id].node)) {
                                                /* Indexed matrix reference on left hand side with operator. */
                                                if (index.length === 1) {
                                                    /* Test logical indexing. */
                                                    const arg0 = AST.reduceToFirstIfReturnList(this.Evaluator(index[0], local, fname));
                                                    if (MultiArray.isInstanceOf(arg0) && arg0.type === Complex.LOGICAL) {
                                                        /* Logical indexing. */
                                                        MultiArray.setElementsLogical(
                                                            this._nameTable,
                                                            id,
                                                            field,
                                                            MultiArray.linearize(arg0) as ComplexType[],
                                                            MultiArray.scalarToMultiArray(
                                                                AST.reduceToFirstIfReturnList(
                                                                    this.Evaluator(
                                                                        AST.nodeOp(
                                                                            op,
                                                                            MultiArray.getElementsLogical(this._nameTable[id].node, id, field, arg0),
                                                                            MultiArray.scalarToMultiArray(
                                                                                AST.reduceToFirstIfReturnList(this.Evaluator((right as NodeReturnList).selector(evaluated, n))),
                                                                            ),
                                                                        ),
                                                                        false,
                                                                        fname,
                                                                    ),
                                                                ),
                                                            ),
                                                        );
                                                    } else {
                                                        /* Not logical indexing. */
                                                        MultiArray.setElements(
                                                            this._nameTable,
                                                            id,
                                                            field,
                                                            [arg0],
                                                            MultiArray.scalarToMultiArray(
                                                                AST.reduceToFirstIfReturnList(
                                                                    this.Evaluator(
                                                                        AST.nodeOp(
                                                                            op,
                                                                            MultiArray.getElements(this._nameTable[id].node, id, field, [arg0]),
                                                                            MultiArray.scalarToMultiArray(
                                                                                AST.reduceToFirstIfReturnList(this.Evaluator((right as NodeReturnList).selector(evaluated, n))),
                                                                            ),
                                                                        ),
                                                                        false,
                                                                        fname,
                                                                    ),
                                                                ),
                                                            ),
                                                        );
                                                    }
                                                } else {
                                                    MultiArray.setElements(
                                                        this._nameTable,
                                                        id,
                                                        field,
                                                        index.map((arg: NodeExpr) => AST.reduceToFirstIfReturnList(this.Evaluator(arg))),
                                                        MultiArray.scalarToMultiArray(
                                                            AST.reduceToFirstIfReturnList(
                                                                this.Evaluator(
                                                                    AST.nodeOp(
                                                                        op,
                                                                        MultiArray.getElements(this._nameTable[id].node, id, field, index),
                                                                        MultiArray.scalarToMultiArray(
                                                                            AST.reduceToFirstIfReturnList(this.Evaluator((right as NodeReturnList).selector(evaluated, n))),
                                                                        ),
                                                                    ),
                                                                    false,
                                                                    fname,
                                                                ),
                                                            ),
                                                        ),
                                                    );
                                                }
                                                AST.appendNodeList(resultList, AST.nodeOp('=', AST.nodeIdentifier(id), this._nameTable[id].node));
                                                continue;
                                            } else {
                                                throw new EvalError(`can't perform indexed assignment for function handle type.`);
                                            }
                                        } else {
                                            throw new EvalError(`in computed assignment ${id}(index) OP= X, ${id} must be defined first.`);
                                        }
                                    } else {
                                        /* Indexed matrix reference on left hand side. */
                                        if (index.length === 1) {
                                            /* Test logical indexing. */
                                            index[0].parent = tree.left;
                                            index[0].index = 0;
                                            const arg0 = AST.reduceToFirstIfReturnList(this.Evaluator(index[0], local, fname));
                                            if (MultiArray.isInstanceOf(arg0) && arg0.type === Complex.LOGICAL) {
                                                /* Logical indexing. */
                                                MultiArray.setElementsLogical(
                                                    this._nameTable,
                                                    id,
                                                    field,
                                                    MultiArray.linearize(arg0) as ComplexType[],
                                                    MultiArray.scalarToMultiArray(AST.reduceToFirstIfReturnList(this.Evaluator((right as NodeReturnList).selector(evaluated, n)))),
                                                );
                                            } else {
                                                /* Not logical indexing. */
                                                MultiArray.setElements(
                                                    this._nameTable,
                                                    id,
                                                    field,
                                                    [arg0],
                                                    MultiArray.scalarToMultiArray(AST.reduceToFirstIfReturnList(this.Evaluator((right as NodeReturnList).selector(evaluated, n)))),
                                                );
                                            }
                                        } else {
                                            MultiArray.setElements(
                                                this._nameTable,
                                                id,
                                                field,
                                                index.map((arg: NodeExpr, i: number) => {
                                                    arg.parent = tree.left;
                                                    arg.index = i;
                                                    return AST.reduceToFirstIfReturnList(this.Evaluator(arg));
                                                }),
                                                MultiArray.scalarToMultiArray(AST.reduceToFirstIfReturnList(this.Evaluator((right as NodeReturnList).selector(evaluated, n)))),
                                            );
                                        }
                                        AST.appendNodeList(resultList, AST.nodeOp('=', AST.nodeIdentifier(id), this._nameTable[id].node));
                                    }
                                }
                            }
                        }
                        if (tree.parent === null || tree.parent.parent === null) {
                            /* assignment at root expression */
                            if (resultList.list.length === 1) {
                                /* single assignment */
                                return resultList.list[0];
                            } else {
                                /* multiple assignment */
                                return resultList;
                            }
                        } else {
                            /* assignment at right side */
                            return (resultList.list[0] as NodeExpr).right;
                        }
                    }
                    case 'IDENT':
                        if (local && this._localTable[fname] && this._localTable[fname][tree.id]) {
                            /* Defined in _localTable. */
                            this._localTable[fname][tree.id].parent = tree;
                            return this._localTable[fname][tree.id];
                        } else if (typeof this._nameTable[tree.id] !== 'undefined') {
                            /* Defined in nameTable. */
                            this._nameTable[tree.id].node.parent = tree;
                            return this._nameTable[tree.id].node;
                        } else if (this._aliasNameFunction(tree.id) in this.builtInFunctionTable) {
                            /* Defined as built-in function */
                            const func = FunctionHandle.create(tree.id);
                            func.parent = tree;
                            return func;
                        } else {
                            throw new ReferenceError(`'${tree.id}' undefined.`);
                        }
                    case '.': {
                        const result = Structure.getFields(
                            AST.reduceToFirstIfReturnList(this.Evaluator(tree.obj, local, fname)),
                            tree.field.map((field: NodeExpr) => {
                                if (typeof field === 'string') {
                                    return field;
                                } else {
                                    const result = AST.reduceToFirstIfReturnList(this.Evaluator(field, local, fname));
                                    if (CharString.isInstanceOf(result)) {
                                        return result.str;
                                    } else {
                                        throw new EvalError(`Dynamic structure field names must be strings.`);
                                    }
                                }
                            }),
                        );
                        if (result.length === 1) {
                            return result[0];
                        } else {
                            return AST.nodeList(result);
                        }
                    }
                    case 'LIST': {
                        const result = {
                            type: 'LIST',
                            list: new Array(tree.list.length),
                            parent: tree.parent === null ? null : tree,
                        };
                        for (let i = 0, n = 0; i < tree.list.length; i++, n++) {
                            /* Convert undefined name, defined in word-list command, to word-list command.
                             * (Null length word-list command) */
                            if (
                                tree.list[i].type === 'IDENT' &&
                                !(local && this._localTable[fname] && this._localTable[fname][tree.list[i].id]) &&
                                !(tree.list[i].id in this._nameTable) &&
                                Object.keys(this.commandWordListTable).indexOf(tree.list[i].id) >= 0
                            ) {
                                tree.list[i].type = 'CMDWLIST';
                                tree.list[i]['args'] = [];
                            }
                            tree.list[i].parent = result;
                            tree.list[i].index = n;
                            const item = AST.reduceToFirstIfReturnList(this.Evaluator(tree.list[i], local, fname));
                            // const item = AST.reduceToFirstIfReturnList(tree.list[i]);
                            if (item.type === 'LIST') {
                                for (let j = 0; j < item.list.length; j++, n++) {
                                    item.list[j].parent = result;
                                    item.list[j].index = n;
                                    result.list[n] = item.list[j];
                                    if (tree.parent === null && !AST.omitAnswer(result.list[n])) {
                                        this._nameTable['ans'] = {
                                            node: result.list[n],
                                        };
                                    }
                                }
                            } else {
                                result.list[n] = item;
                                if (tree.parent === null && !AST.omitAnswer(result.list[n])) {
                                    this._nameTable['ans'] = {
                                        node: result.list[n],
                                    };
                                }
                            }
                        }
                        return result;
                    }
                    case 'RANGE':
                        tree.start_.parent = tree;
                        tree.stop_.parent = tree;
                        if (tree.stride_) {
                            tree.stride_.parent = tree;
                        }
                        return MultiArray.expandRange(
                            AST.reduceToFirstIfReturnList(this.Evaluator(tree.start_, local, fname)),
                            AST.reduceToFirstIfReturnList(this.Evaluator(tree.stop_, local, fname)),
                            tree.stride_ ? AST.reduceToFirstIfReturnList(this.Evaluator(tree.stride_, local, fname)) : null,
                        );
                    case 'ENDRANGE': {
                        let parent = tree.parent;
                        let index = tree.index;
                        /* Search for 'IDX' node until reach 'IDX' or root node */
                        while (parent !== null && parent.type !== 'IDX') {
                            index = parent.index;
                            parent = parent.parent;
                        }
                        if (parent && parent.type === 'IDX') {
                            const expr = AST.reduceToFirstIfReturnList(this.Evaluator(parent.expr, local, fname));
                            if (MultiArray.isInstanceOf(expr)) {
                                return parent.args.length === 1 ? Complex.create(MultiArray.linearLength(expr)) : Complex.create(MultiArray.getDimension(expr, index));
                            } else {
                                return Complex.one();
                            }
                        } else {
                            throw new SyntaxError("indeterminate end of range. The word 'end' to refer a value is valid only in indexing.");
                        }
                    }
                    case ':':
                        if (tree.parent.type === 'IDX') {
                            const expr = AST.reduceToFirstIfReturnList(this.Evaluator(tree.parent.expr, local, fname));
                            if (MultiArray.isInstanceOf(expr)) {
                                return tree.parent.args.length === 1
                                    ? MultiArray.expandColon(MultiArray.linearLength(expr))
                                    : MultiArray.expandColon(MultiArray.getDimension(expr, tree.index));
                            } else {
                                return Complex.one();
                            }
                        } else {
                            throw new SyntaxError('indeterminate colon. The colon to refer a range is valid only in indexing.');
                        }
                    case 'IDX': {
                        if (typeof tree.expr === 'undefined') {
                            // TODO: It's needed?
                            throw new ReferenceError(`'${tree.id}' undefined.`);
                        }
                        tree.expr.parent = tree;
                        const expr = AST.reduceToFirstIfReturnList(this.Evaluator(tree.expr, local, fname));
                        if (FunctionHandle.isInstanceOf(expr)) {
                            if (expr.id) {
                                const aliasTreeName = this._aliasNameFunction(expr.id as string);
                                const argumentsList = tree.args.map((arg: NodeExpr, i: number) => {
                                    arg.parent = tree;
                                    arg.index = i;
                                    return this.builtInFunctionTable[aliasTreeName].ev.length > 0 &&
                                        i < this.builtInFunctionTable[aliasTreeName].ev.length &&
                                        !this.builtInFunctionTable[aliasTreeName].ev[i]
                                        ? arg
                                        : AST.reduceToFirstIfReturnList(this.Evaluator(arg, local, fname));
                                });
                                /* Error if mapper and #arguments!==1 (Invalid call). */
                                if (this.builtInFunctionTable[aliasTreeName].mapper && argumentsList.length !== 1) {
                                    throw new EvalError(`Invalid call to ${aliasTreeName}. Type 'help ${expr.id}' to see correct usage.`);
                                }
                                /* If function is mapper and called with one parameter of type MultiArray, apply map to array. Else call function with argumentsList */
                                return this.builtInFunctionTable[aliasTreeName].mapper && argumentsList.length === 1 && MultiArray.isInstanceOf(argumentsList[0])
                                    ? MultiArray.rawMap(argumentsList[0], this.builtInFunctionTable[aliasTreeName].func)
                                    : this.builtInFunctionTable[aliasTreeName].func(...argumentsList);
                            } else {
                                if (expr.parameter.length !== tree.args.length) {
                                    throw new EvalError(`invalid number of arguments in function ${tree.expr.id}.`);
                                }
                                /* Create _localTable entry. */
                                const new_fname = tree.expr.id + '_' + globalThis.crypto.randomUUID();
                                this._localTable[new_fname] = {};
                                for (let i = 0; i < tree.args.length; i++) {
                                    /* Evaluate defined function arguments list. */
                                    tree.args[i].parent = tree;
                                    tree.args[i].index = i;
                                    this._localTable[new_fname][expr.parameter[i].id] = AST.reduceToFirstIfReturnList(this.Evaluator(tree.args[i], true, fname));
                                }
                                const temp = AST.reduceToFirstIfReturnList(this.Evaluator(expr.expression, true, new_fname));
                                /* Delete _localTable entry. */
                                delete this._localTable[new_fname];
                                return temp;
                            }
                        } else {
                            /* Defined indexed matrix reference. */
                            if (tree.delim === '{}' && !(MultiArray.isInstanceOf(expr) && expr.isCell)) {
                                throw new EvalError('matrix cannot be indexed with {');
                            }
                            let result: MathObject;
                            const array = MultiArray.scalarOrCellToMultiArray(expr);
                            if (tree.args.length === 1) {
                                /* Test logical indexing. */
                                tree.args[0].parent = tree;
                                tree.args[0].index = 0;
                                const arg0 = AST.reduceToFirstIfReturnList(this.Evaluator(tree.args[0], local, fname));
                                if (MultiArray.isInstanceOf(arg0) && arg0.type === Complex.LOGICAL) {
                                    /* Logical indexing. */
                                    result = MultiArray.getElementsLogical(array, tree.expr.id, [], arg0);
                                } else {
                                    /* Not logical indexing. */
                                    result = MultiArray.getElements(array, tree.expr.id, [], [arg0]);
                                }
                            } else {
                                result = MultiArray.getElements(
                                    array,
                                    tree.expr.id,
                                    [],
                                    tree.args.map((arg: NodeExpr, i: number) => {
                                        arg.parent = tree;
                                        arg.index = i;
                                        return AST.reduceToFirstIfReturnList(this.Evaluator(arg, local, fname));
                                    }),
                                );
                            }
                            result!.parent = tree;
                            if (array.isCell && tree.delim === '()') {
                                (result as MultiArray).isCell = true;
                                return result;
                            } else {
                                return MultiArray.MultiArrayToScalar(result);
                            }
                        }
                    }
                    case 'CMDWLIST': {
                        const result = this.commandWordListTable[tree.id].func(...tree.args.map((word: CharString) => word.str));
                        return typeof result !== 'undefined' ? result : tree;
                    }
                    case 'IF': {
                        for (let ifTest = 0; ifTest < tree.expression.length; ifTest++) {
                            tree.expression[ifTest].parent = tree;
                            if (this.toBoolean(AST.reduceToFirstIfReturnList(this.Evaluator(tree.expression[ifTest], local, fname)))) {
                                tree.then[ifTest].parent = tree;
                                return AST.reduceToFirstIfReturnList(this.Evaluator(tree.then[ifTest], local, fname));
                            }
                        }
                        // No one then clause.
                        if (tree.else) {
                            tree.else.parent = tree;
                            return AST.reduceToFirstIfReturnList(this.Evaluator(tree.else, local, fname));
                        }
                        // Return null NodeList.
                        return {
                            type: 'LIST',
                            list: [],
                            parent: tree,
                        };
                    }
                    default:
                        throw new EvalError(`evaluating undefined type '${tree.type}'.`);
                }
            }
        } else {
            return null;
        }
    }

    /**
     * Evaluate expression `tree`.
     * @param tree Expression to evaluate.
     * @returns Expression `tree` evaluated.
     */
    public Evaluate(tree: NodeInput): NodeInput {
        try {
            this._exitStatus = Evaluator.response.OK;
            tree.parent = null;
            return this.Evaluator(tree);
        } catch (e) {
            this._exitStatus = Evaluator.response.EVAL_ERROR;
            throw e;
        }
    }

    /**
     * Executes the `Parse` and `Evaluate` methods on an input string, returning the computed result.
     * @param input String to parse and evaluate.
     * @returns Computed result of input.
     */
    public Execute(input: string): NodeInput {
        return this.Evaluate(this.Parse(input));
    }

    /**
     * Unparse expression `tree`.
     * @param tree Expression to unparse.
     * @returns Expression `tree` unparsed.
     */
    public Unparse(tree: NodeInput, parentPrecedence = 0): string {
        const leftUnparse = (type: NodeType | number, tree: NodeInput) => {
            const precedence = this.nodePrecedence(tree);
            const leftUnparse = this.Unparse(tree.left, precedence);
            return (this.nodePrecedence(tree.right) < precedence ? '(' + leftUnparse + ')' : leftUnparse) + type;
        };
        const rightUnparse = (type: NodeType | number, tree: NodeInput) => {
            const precedence = this.nodePrecedence(tree);
            const rightUnparse = this.Unparse(tree.right, precedence);
            return type + (this.nodePrecedence(tree.right) < precedence ? '(' + rightUnparse + ')' : rightUnparse);
        };
        try {
            if (tree) {
                if (tree === undefined) {
                    return '<UNDEFINED>';
                } else if (Complex.isInstanceOf(tree)) {
                    return Complex.unparse(tree, this, parentPrecedence);
                } else if (CharString.isInstanceOf(tree)) {
                    return CharString.unparse(tree, parentPrecedence);
                } else if (MultiArray.isInstanceOf(tree)) {
                    return MultiArray.unparse(tree, this, parentPrecedence);
                } else if (Structure.isInstanceOf(tree)) {
                    return Structure.unparse(tree, this, parentPrecedence);
                } else if (FunctionHandle.isInstanceOf(tree)) {
                    return FunctionHandle.unparse(tree, this, parentPrecedence);
                } else {
                    switch (tree.type) {
                        case '+':
                        case '-':
                        case '.*':
                        case '*':
                        case './':
                        case '/':
                        case '.\\':
                        case '\\':
                        case '.^':
                        case '^':
                        case '.**':
                        case '**':
                        case '<':
                        case '<=':
                        case '==':
                        case '>=':
                        case '>':
                        case '!=':
                        case '~=':
                        case '&':
                        case '|':
                        case '&&':
                        case '||':
                        case '=':
                        case '+=':
                        case '-=':
                        case '*=':
                        case '/=':
                        case '\\=':
                        case '^=':
                        case '**=':
                        case '.*=':
                        case './=':
                        case '.\\=':
                        case '.^=':
                        case '.**=':
                        case '&=':
                        case '|=': {
                            const precedence = this.nodePrecedence(tree);
                            const leftUnparse = this.Unparse(tree.left, precedence);
                            const rightUnparse = this.Unparse(tree.right, precedence);
                            return (
                                (this.nodePrecedence(tree.left) < precedence ? '(' + leftUnparse + ')' : leftUnparse) +
                                tree.type +
                                (this.nodePrecedence(tree.right) < precedence ? '(' + rightUnparse + ')' : rightUnparse)
                            );
                        }
                        case '()': {
                            const precedence = this.nodePrecedence(tree.right);
                            const rightUnparse = this.Unparse(tree.right, precedence);
                            return precedence < parentPrecedence ? '(' + rightUnparse + ')' : rightUnparse;
                        }
                        case '!':
                        case '~':
                            return rightUnparse(tree.type, tree);
                        case '+_':
                            return rightUnparse('+', tree);
                        case '-_':
                            return rightUnparse('-', tree);
                        case '++_':
                            return rightUnparse('++' as NodeType, tree);
                        case '--_':
                            return rightUnparse('--' as NodeType, tree);
                        case ".'":
                        case "'":
                            return leftUnparse(tree.type, tree);
                        case '_++':
                            return leftUnparse('++' as NodeType, tree);
                        case '_--':
                            return leftUnparse('--' as NodeType, tree);
                        case 'IDENT':
                            return tree.id;
                        case '.':
                            return (
                                this.Unparse(tree.obj) + '.' + tree.field.map((value: string | NodeExpr) => (typeof value === 'string' ? value : '(' + this.Unparse(value) + ')')).join('.')
                            );
                        case 'LIST':
                            return tree.list.map((value: NodeInput) => this.Unparse(value)).join('\n') + '\n';
                        case 'RANGE':
                            if (tree.start_ && tree.stop_) {
                                if (tree.stride_) {
                                    return this.Unparse(tree.start_) + ':' + this.Unparse(tree.stride_) + ':' + this.Unparse(tree.stop_);
                                } else {
                                    return this.Unparse(tree.start_) + ':' + this.Unparse(tree.stop_);
                                }
                            } else {
                                return ':';
                            }
                        case 'ENDRANGE':
                            return 'end';
                        case ':':
                            return ':';
                        case '<~>':
                            return '~';
                        case 'IDX':
                            return this.Unparse(tree.expr) + tree.delim[0] + tree.args.map((value: NodeExpr) => this.Unparse(value)).join(',') + tree.delim[1];
                        case 'RETLIST':
                            return '<RETLIST>';
                        case 'CMDWLIST':
                            return (tree.id + ' ' + tree.args.map((arg: CharString) => this.Unparse(arg)).join(' ')).trimEnd();
                        case 'IF':
                            let ifstr = 'IF ' + this.Unparse(tree.expression[0]) + '\n';
                            ifstr += this.Unparse(tree.then[0]) + '\n';
                            for (let i = 1; i < tree.expression.length; i++) {
                                ifstr += 'ELSEIF ' + this.Unparse(tree.expression[i]) + '\n';
                                ifstr += this.Unparse(tree.then[i]) + '\n';
                            }
                            if (tree.else) {
                                ifstr += 'ELSE' + '\n' + this.Unparse(tree.else) + '\n';
                            }
                            ifstr += 'ENDIF';
                            return ifstr;
                        default:
                            return '<INVALID>';
                    }
                }
            } else {
                return '';
            }
        } catch (e) {
            return '<ERROR>';
        }
    }

    /**
     * Unparse recursively expression tree generating MathML representation.
     * @param tree Expression tree.
     * @returns String of expression `tree` unparsed as MathML language.
     */
    public UnparserMathML(tree: NodeInput, parentPrecedence = 0): string {
        try {
            if (tree) {
                if (tree === undefined) {
                    return MathML.format['UNDEFINED']();
                } else if (Complex.isInstanceOf(tree)) {
                    return Complex.unparseMathML(tree, this, parentPrecedence);
                } else if (CharString.isInstanceOf(tree)) {
                    return CharString.unparseMathML(tree, parentPrecedence);
                } else if (MultiArray.isInstanceOf(tree)) {
                    return MultiArray.unparseMathML(tree, this, parentPrecedence);
                } else if (Structure.isInstanceOf(tree)) {
                    return Structure.unparseMathML(tree, this, parentPrecedence);
                } else if (FunctionHandle.isInstanceOf(tree)) {
                    return FunctionHandle.unparseMathML(tree, this, parentPrecedence);
                } else {
                    switch (tree.type) {
                        case '()': {
                            const precedence = this.nodePrecedence(tree.right);
                            const rightUnparse = this.UnparserMathML(tree.right, precedence);
                            return precedence < parentPrecedence ? MathML.format['()']('(', rightUnparse, ')') : rightUnparse;
                        }
                        case '+':
                        case '-':
                        case '*':
                        case '.*':
                        case './':
                        case '.\\':
                        case '\\':
                        case '.^':
                        case '.**':
                        case '<':
                        case '>':
                        case '==':
                        case '&':
                        case '|':
                        case '&&':
                        case '||':
                        case '=':
                        case '+=':
                        case '-=':
                        case '*=':
                        case '/=':
                        case '\\=':
                        case '^=':
                        case '**=':
                        case '.*=':
                        case './=':
                        case '.\\=':
                        case '.^=':
                        case '.**=':
                        case '&=':
                        case '|=':
                        case '<=':
                        case '>=':
                        case '!=':
                        case '~=': {
                            const precedence = this.nodePrecedence(tree);
                            const leftUnparse = this.UnparserMathML(tree.left, precedence);
                            const rightUnparse = this.UnparserMathML(tree.right, precedence);
                            return MathML.format[tree.type](
                                this.nodePrecedence(tree.left) < precedence ? MathML.format['()']('(', leftUnparse, ')') : leftUnparse,
                                this.nodePrecedence(tree.right) < precedence ? MathML.format['()']('(', rightUnparse, ')') : rightUnparse,
                            );
                        }
                        case '/':
                            return MathML.format[tree.type](this.UnparserMathML(tree.left), this.UnparserMathML(tree.right));
                        case '**':
                        case '^':
                            return MathML.format[tree.type](this.UnparserMathML(tree.left, this._precedenceTable['_' + tree.type]), this.UnparserMathML(tree.right));
                        case '!':
                        case '~':
                        case '+_':
                        case '-_':
                        case '++_':
                        case '--_':
                            return MathML.format[tree.type](this.UnparserMathML(tree.right));
                        case '_++':
                        case '_--':
                        case ".'":
                        case "'":
                            return MathML.format[tree.type](this.UnparserMathML(tree.left, this._precedenceTable['_' + tree.type]));
                        case 'IDENT':
                            return MathML.format['IDENT'](substSymbol(tree.id));
                        case '.':
                            return MathML.format['.'](
                                this.UnparserMathML(tree.obj),
                                tree.field.map((value: string | NodeExpr) =>
                                    typeof value === 'string' ? MathML.format['IDENT'](value) : MathML.format['()']('(', this.UnparserMathML(value), ')'),
                                ),
                            );
                        case 'LIST':
                            return MathML.format['LIST'](tree.list.map((value: NodeInput) => this.UnparserMathML(value)));
                        case 'RANGE':
                            if (tree.start_ && tree.stop_) {
                                if (tree.stride_) {
                                    return MathML.format['RANGE'](this.UnparserMathML(tree.start_), this.UnparserMathML(tree.stride_), this.UnparserMathML(tree.stop_));
                                } else {
                                    return MathML.format['RANGE'](this.UnparserMathML(tree.start_), this.UnparserMathML(tree.stop_));
                                }
                            } else {
                                return MathML.format['RANGE']();
                            }
                        case 'ENDRANGE':
                        case ':':
                        case '<~>':
                            return MathML.format[tree.type]();
                        case 'IDX':
                            if (tree.args.length === 0) {
                                return MathML.format['IDX'](this.UnparserMathML(tree.expr), tree.delim[0], [], tree.delim[1]);
                            } else {
                                let unparse;
                                if (tree.expr.type === 'IDENT') {
                                    const aliasTreeName = this._aliasNameFunction(tree.expr.id);
                                    if (aliasTreeName in this.builtInFunctionTable && this.builtInFunctionTable[aliasTreeName].UnparserMathML) {
                                        unparse = this.builtInFunctionTable[aliasTreeName].UnparserMathML(tree);
                                    } else if (aliasTreeName in this.builtInFunctionTable && aliasTreeName in MathML.format) {
                                        unparse = MathML.format[aliasTreeName](...tree.args.map((arg: NodeExpr) => this.UnparserMathML(arg)));
                                    } else {
                                        unparse = MathML.format['IDX'](
                                            MathML.format['IDENT'](substSymbol(tree.expr.id)),
                                            tree.delim[0],
                                            tree.args.map((arg: NodeExpr) => this.UnparserMathML(arg)),
                                            tree.delim[1],
                                        );
                                    }
                                } else {
                                    unparse = MathML.format['IDX'](
                                        this.UnparserMathML(tree.expr, parentPrecedence),
                                        tree.delim[0],
                                        tree.args.map((arg: NodeExpr) => this.UnparserMathML(arg)),
                                        tree.delim[1],
                                    );
                                }
                                return this.nodePrecedence(tree) > parentPrecedence ? unparse : MathML.format['()']('(', unparse, ')');
                            }
                        case 'RETLIST':
                            return MathML.format['RETLIST']();
                        case 'CMDWLIST':
                            return MathML.format['CMDWLIST'](
                                tree.id,
                                tree.args.map((arg: CharString) => this.UnparserMathML(arg)),
                            );
                        case 'IF':
                            const ifThenArray = tree.expression.map(
                                (expr: NodeInput, i: number) =>
                                    `<mtr><mtd><mo>${i === 0 ? '<b>if</b>' : '<b>elseif</b>'}</mo></mtd><mtd>${this.UnparserMathML(
                                        tree.expression[0],
                                    )}</mtd></mtr><mtr><mtd></mtd><mtd>${this.UnparserMathML(tree.then[0])}</mtd></mtr>`,
                            );
                            const ifElse = tree.else ? `<mtr><mtd><mo><b>else</b></mo></mtd></mtr><mtr><mtd></mtd><mtd>${this.UnparserMathML(tree.else)}</mtd></mtr>` : '';
                            return `<mtable>${ifThenArray.join('')}${ifElse}<mtr><mtd><mo><b>endif</b></mo></mtd></mtr></mtable>`;
                        default:
                            return MathML.format['INVALID']();
                    }
                }
            } else {
                return MathML.format['UNDEFINED']();
            }
        } catch (e) {
            if (this._debug) {
                throw e;
            } else {
                return MathML.format['ERROR']();
            }
        }
    }

    /**
     * Unparse Expression tree in MathML.
     * @param tree Expression tree.
     * @returns String of expression unparsed as MathML language.
     */
    public UnparseMathML(tree: NodeInput, display: 'inline' | 'block' = 'block'): string {
        let result: string = this.UnparserMathML(tree);
        if (result) {
            return MathML.format.math(MathML.format.errorReplace(result), display);
        } else {
            return '<b>Unparse error.</b>';
        }
    }

    /**
     * Generates MathML representation of input without evaluation.
     * @param input Input to parse and generate MathML representation.
     * @param display `'inline'` or `'block'`.
     * @returns MathML representation of input.
     */
    public ToMathML(input: string, display: 'inline' | 'block' = 'block'): string {
        return this.UnparseMathML(this.Parse(input), display);
    }
}

export type {
    AliasNameTable,
    AliasNameFunction,
    BuiltInFunctionTableEntry,
    BuiltInFunctionTable,
    NameTable,
    CommandWordListFunction,
    CommandWordListTableEntry,
    CommandWordListTable,
    EvaluatorConfig,
    IncDecOperator,
};
export { Evaluator };
export default { Evaluator };
