/**
 * MATLAB®/Octave like syntax parser/interpreter/compiler.
 */

import { CharStreams, CommonTokenStream, DiagnosticErrorListener, PredictionMode } from 'antlr4';
import MathJSLabLexer from './MathJSLabLexer';
import MathJSLabParser from './MathJSLabParser';
import LexerErrorListener from './LexerErrorListener';
import ParserErrorListener from './ParserErrorListener';
import * as AST from './AST';

import { substSymbol } from './substSymbol';
import { CharString } from './CharString';
import { ComplexDecimal } from './ComplexDecimal';
import { MultiArray } from './MultiArray';
import { CoreFunctions } from './CoreFunctions';
import { LinearAlgebra } from './LinearAlgebra';
import type { MathObject, MathOperationType, UnaryMathOperation, BinaryMathOperation } from './MathOperation';
import { MathOperation } from './MathOperation';
import { Configuration } from './Configuration';
import { Structure } from './Structure';
import { SymbolTable } from './SymbolTable';
import { FunctionHandle } from './FunctionHandle';
import * as MathML from './MathML';

/**
 * aliasNameTable and AliasFunction type.
 */
type AliasNameTable = Record<string, RegExp>;
type AliasFunction = (name: string) => string;

/**
 * builtInFunctionTable type.
 */
type BuiltInFunctionTableEntry = {
    type: 'BUILTIN';
    mapper: boolean;
    ev: boolean[];
    func: Function;
    unparserMathML?: (tree: AST.NodeInput) => string;
};
type BuiltInFunctionTable = Record<string, BuiltInFunctionTableEntry>;

/**
 * nameTable type.
 */
type NameTable = Record<string, AST.NodeExpr>;

/**
 * commandWordListTable type.
 */
type CommandWordListFunction = (...args: string[]) => any;
type CommandWordListTableEntry = {
    func: CommandWordListFunction;
};
type CommandWordListTable = Record<string, CommandWordListTableEntry>;

/**
 * EvaluatorConfig type.
 */
type EvaluatorConfig = {
    aliasNameTable?: AliasNameTable;
    externalFunctionTable?: BuiltInFunctionTable;
    externalCmdWListTable?: CommandWordListTable;
};

type IncDecOperator = (tree: AST.NodeIdentifier) => MathObject;

/**
 * Evaluator object.
 */
class Evaluator {
    /**
     * After run Evaluate method, the exitStatus property will contains
     * exit state of method.
     */
    public response = {
        EXTERNAL: -2,
        WARNING: -1,
        OK: 0,
        LEX_ERROR: 1,
        PARSER_ERROR: 2,
        EVAL_ERROR: 3,
    };

    /**
     * Debug flag.
     */
    public debug: boolean = false;

    /**
     * Native name table. It's inserted in nameTable when Evaluator constructor executed.
     */
    private readonly nativeNameTable: Record<string, ComplexDecimal> = {
        false: ComplexDecimal.false(),
        true: ComplexDecimal.true(),
        i: ComplexDecimal.onei(),
        I: ComplexDecimal.onei(),
        j: ComplexDecimal.onei(),
        J: ComplexDecimal.onei(),
        e: ComplexDecimal.e(),
        pi: ComplexDecimal.pi(),
        inf: ComplexDecimal.inf_0(),
        Inf: ComplexDecimal.inf_0(),
        nan: ComplexDecimal.NaN_0(),
        NaN: ComplexDecimal.NaN_0(),
    };

    public readonly nativeNameTableList = Object.keys(this.nativeNameTable);

    /**
     * Alias table.
     */
    private aliasNameTable: AliasNameTable;

    // public symbolTable: SymbolTable;

    /**
     * Name table.
     */
    public nameTable: NameTable = {};

    /**
     * Built-in function table.
     */
    public builtInFunctionTable: BuiltInFunctionTable = {};

    /**
     * Get a list of names of defined functions in builtInFunctionTable.
     */
    public get builtInFunctionList(): string[] {
        return Object.keys(this.builtInFunctionTable);
    }

    /**
     * Local table.
     */
    public localTable: Record<string, AST.NodeInput> = {};

    /**
     * Command word list table.
     */
    public commandWordListTable: CommandWordListTable = {
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
    public exitStatus: number;

    /**
     * Increment and decrement operator
     * @param pre `true` if prefixed. `false` if postfixed.
     * @param operation Operation (`'plus'` or `'minus'`).
     * @returns Operator function with signature `(tree: AST.NodeIdentifier) => MathObject`.
     */
    private incDecOp(pre: boolean, operation: 'plus' | 'minus'): IncDecOperator {
        if (pre) {
            return (tree: AST.NodeIdentifier): MathObject => {
                if (tree.type === 'IDENT') {
                    if (this.nameTable[tree.id]) {
                        this.nameTable[tree.id] = MathOperation[operation](this.nameTable[tree.id], ComplexDecimal.one());
                        return this.nameTable[tree.id];
                    } else {
                        throw new EvalError('in x++ or ++x, x must be defined first.');
                    }
                } else {
                    throw new SyntaxError(`invalid ${operation === 'plus' ? 'increment' : 'decrement'} variable.`);
                }
            };
        } else {
            return (tree: AST.NodeIdentifier): MathObject => {
                if (tree.type === 'IDENT') {
                    if (this.nameTable[tree.id]) {
                        const value = MathOperation.copy(this.nameTable[tree.id]);
                        this.nameTable[tree.id] = MathOperation[operation](this.nameTable[tree.id], ComplexDecimal.one());
                        return value;
                    } else {
                        throw new EvalError('in x++ or ++x, x must be defined first.');
                    }
                } else {
                    throw new SyntaxError(`invalid ${operation === 'plus' ? 'increment' : 'decrement'} variable.`);
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
        '++_': this.incDecOp(true, 'plus'),
        '--_': this.incDecOp(true, 'minus'),
        '_++': this.incDecOp(false, 'plus'),
        '_--': this.incDecOp(false, 'minus'),
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
    public readonly precedenceTable: { [key: string]: number };

    /**
     * Get tree node precedence.
     * @param tree Tree node.
     * @returns Node precedence.
     */
    private nodePrecedence(tree: AST.NodeInput): number {
        if (typeof tree.type === 'number') {
            /* If `typeof tree.type === 'number'` then tree is a literal number or singleton element.  */
            if (tree instanceof ComplexDecimal) {
                return ComplexDecimal.precedence(tree, this);
            } else {
                return this.precedenceTable.max;
            }
        } else if (tree.type === 'IDX') {
            const aliasTreeName = this.aliasName(tree.expr.id);
            return tree.expr.type === 'IDENT' &&
                aliasTreeName in this.builtInFunctionTable &&
                (!!this.builtInFunctionTable[aliasTreeName].unparserMathML || aliasTreeName in MathML.format)
                ? this.precedenceTable.max
                : this.precedenceTable.preMax;
        } else if (tree.type === 'RANGE') {
            return tree.start_ && tree.stop_ ? this.precedenceTable.min : this.precedenceTable.max;
        } else {
            return this.precedenceTable[tree.type] || 0;
        }
    }

    /**
     * User functions.
     */
    private readonly functions: Record<string, Function> = {
        unparse: (tree: AST.NodeInput): CharString => new CharString(this.Unparse(tree)),
    };

    /**
     * Local methods.
     */
    public readonly unparseString = CharString.unparse;
    public readonly unparseStringMathML = CharString.unparseMathML;
    public readonly newNumber = ComplexDecimal.newThis;
    public readonly unparseNumber = ComplexDecimal.unparse;
    public readonly unparseNumberMathML = ComplexDecimal.unparseMathML;
    public readonly isRowVector = MultiArray.isRowVector;
    public readonly unparseArray = MultiArray.unparse;
    public readonly unparseStructure = Structure.unparse;
    public readonly unparseStructureMathML = Structure.unparseMathML;
    public readonly newFunctionHandle = FunctionHandle.newThis;
    public readonly unparseFunctionHandle = FunctionHandle.unparse;
    public readonly unparseFunctionHandleMathML = FunctionHandle.unparseMathML;
    public readonly unparseArrayMathML = MultiArray.unparseMathML;
    public readonly evaluateArray = MultiArray.evaluate;
    public readonly mapArray = MultiArray.rawMap;
    public readonly getElements = MultiArray.getElements;
    public readonly getElementsLogical = MultiArray.getElementsLogical;
    public readonly setElements = MultiArray.setElements;
    public readonly setElementsLogical = MultiArray.setElementsLogical;
    public readonly expandRange = MultiArray.expandRange;
    public readonly expandColon = MultiArray.expandColon;
    public readonly array0x0 = MultiArray.emptyArray;
    public readonly linearize = MultiArray.linearize;
    public readonly scalarToArray = MultiArray.scalarToMultiArray;
    public readonly scalarOrCellToArray = MultiArray.scalarOrCellToMultiArray;
    public readonly arrayToScalar = MultiArray.MultiArrayToScalar;
    public readonly linearLength = MultiArray.linearLength;
    public readonly getDimension = MultiArray.getDimension;
    public readonly toLogical = MultiArray.toLogical;
    public readonly getFields = Structure.getFields;
    public readonly setNewField = Structure.setNewField;

    /**
     * Special functions MathML unparser.
     */
    private readonly unparseMathMLFunctions: Record<string, (tree: AST.NodeIndexExpr) => string> = {
        logb: (tree: AST.NodeIndexExpr): string => {
            let unparseArgument = this.unparserMathML(tree.args[1]);
            if (this.nodePrecedence(tree.args[1]) < this.precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['logb'](this.unparserMathML(tree.args[0]), unparseArgument);
        },
        log2: (tree: AST.NodeIndexExpr): string => {
            let unparseArgument = this.unparserMathML(tree.args[0]);
            if (this.nodePrecedence(tree.args[0]) < this.precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['log2'](unparseArgument);
        },
        log10: (tree: AST.NodeIndexExpr): string => {
            let unparseArgument = this.unparserMathML(tree.args[0]);
            if (this.nodePrecedence(tree.args[0]) < this.precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['log10'](unparseArgument);
        },
        factorial: (tree: AST.NodeIndexExpr): string => {
            let unparseArgument = this.unparserMathML(tree.args[0]);
            if (this.nodePrecedence(tree.args[0]) < this.precedenceTable.max) {
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
    public aliasName: AliasFunction = (name: string): string => name;

    /**
     * Evaluator object constructor
     */
    constructor(config?: EvaluatorConfig) {
        this.exitStatus = this.response.OK;
        this.precedenceTable = {};
        Evaluator.precedence.forEach((list, precedence) => {
            list.forEach((field) => {
                this.precedenceTable[field] = precedence + 1;
            });
        });
        /* Set opTable aliases */
        this.opTable['**'] = this.opTable['^'];
        this.precedenceTable['**'] = this.precedenceTable['^'];
        this.opTable['.**'] = this.opTable['.^'];
        this.precedenceTable['.**'] = this.precedenceTable['.^'];
        this.precedenceTable['_**'] = this.precedenceTable['_^'];
        this.precedenceTable['_.**'] = this.precedenceTable['_.^'];
        this.opTable['~='] = this.opTable['!='];
        this.precedenceTable['~='] = this.precedenceTable['!='];
        this.opTable['~'] = this.opTable['!'];
        this.precedenceTable['~'] = this.precedenceTable['!'];
        /* Load nativeNameTable */
        this.loadNativeTable();
        /* Define Evaluator functions */
        for (const func in this.functions) {
            this.defineFunction(func, this.functions[func]);
        }
        /* Define function operators */
        for (const func in MathOperation.leftAssociativeMultipleOperations) {
            this.defineLeftAssociativeMultipleOperationFunction(func, MathOperation.leftAssociativeMultipleOperations[func]);
        }
        for (const func in MathOperation.binaryOperations) {
            this.defineBinaryOperatorFunction(func, MathOperation.binaryOperations[func]);
        }
        for (const func in MathOperation.unaryOperations) {
            this.defineUnaryOperatorFunction(func, MathOperation.unaryOperations[func]);
        }
        /* Define function mappers */
        for (const func in ComplexDecimal.mapFunction) {
            this.defineFunction(func, ComplexDecimal.mapFunction[func], true);
        }
        /* Define other functions */
        for (const func in ComplexDecimal.twoArgFunction) {
            this.defineFunction(func, ComplexDecimal.twoArgFunction[func]);
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
            this.defineFunction(func, LinearAlgebra.functions[func]);
        }
        /* Load unparserMathML for special functions */
        for (const func in this.unparseMathMLFunctions) {
            this.builtInFunctionTable[func].unparserMathML = this.unparseMathMLFunctions[func];
        }
        if (config) {
            if (config.aliasNameTable) {
                this.aliasNameTable = config.aliasNameTable;
                this.aliasName = (name: string): string => {
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
                this.aliasName = (name: string): string => name;
            }
            if (config.externalFunctionTable) {
                Object.assign(this.builtInFunctionTable, config.externalFunctionTable);
            }
            if (config.externalCmdWListTable) {
                Object.assign(this.commandWordListTable, config.externalCmdWListTable);
            }
        } else {
            this.aliasName = (name: string): string => name;
        }
        // this.symbolTable = new SymbolTable(this.builtInFunctionTable, this.aliasName);
    }

    /**
     * Parse input string.
     * @param input String to parse.
     * @returns Abstract syntax tree of input.
     */
    public Parse(input: string): AST.NodeInput {
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
        if (this.debug) {
            // Add DiagnosticErrorListener to parser to notify when the parser
            // detects an ambiguity. Set prediction mode to report all ambiguities.
            // parser.addErrorListener(new DiagnosticErrorListener());
            // parser._interp.predictionMode = PredictionMode.LL_EXACT_AMBIG_DETECTION;
        }

        // Parse input and return AST.
        return parser.input().node;
    }

    /**
     * Load native name table in name table.
     */
    private loadNativeTable(): void {
        /* Insert nativeNameTable in nameTable */
        for (const name in this.nativeNameTable) {
            this.nameTable[name] = this.nativeNameTable[name];
        }
    }

    /**
     * Restart evaluator.
     */
    public Restart(): void {
        this.nameTable = {};
        this.localTable = {};
        this.loadNativeTable();
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
                delete this.nameTable[name];
                delete this.builtInFunctionTable[name];
                if (this.nativeNameTableList.includes(name)) {
                    this.nameTable[name] = this.nativeNameTable[name];
                }
            });
        }
    }

    /**
     * Throws error if left hand side length of multiple assignment greater
     * than maximum length (to be used in ReturnSelector functions).
     * @param maxLength Maximum length of return list.
     * @param currentLength Requested length of return list.
     */
    public static throwErrorIfGreaterThanReturnList(maxLength: number, currentLength: number): void {
        if (currentLength > maxLength) {
            throw new EvalError(`element number ${maxLength + 1} undefined in return list`);
        }
    }

    /**
     * Tests if it is a NodeReturnList and if so reduces it to its first
     * element.
     * @param value A node.
     * @returns Reduced node if `tree` is a NodeReturnList.
     */
    public reduceIfReturnList(tree: AST.NodeInput): AST.NodeInput {
        if (tree.type === 'RETLIST') {
            const result = tree.selector(1, 0);
            result.parent = tree.parent;
            return result;
        } else {
            return tree;
        }
    }

    /**
     * Validate left side of assignment node.
     * @param tree Left side of assignment node.
     * @param shallow True if tree is a left root of assignment.
     * @returns An object with four properties: `left`, `id`, `args` and `field`.
     */
    public validateAssignment(tree: AST.NodeExpr, shallow: boolean, local: boolean, fname: string): { id: string; index: AST.NodeExpr[]; field: string[] }[] {
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
            const field = tree.field.map((field: AST.NodeExpr) => {
                if (typeof field === 'string') {
                    return field;
                } else {
                    const result = this.reduceIfReturnList(this.Evaluator(field, local, fname));
                    if (result instanceof CharString) {
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
        } else if (shallow && this.isRowVector(tree)) {
            return tree.array[0].map((left: AST.NodeExpr) => this.validateAssignment(left, false, local, fname)[0]);
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
    private defineUnaryOperatorFunction(name: string, func: UnaryMathOperation): void {
        this.builtInFunctionTable[name] = {
            type: 'BUILTIN',
            mapper: false,
            ev: [],
            func: (...operand: AST.NodeExpr) => {
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
    private defineBinaryOperatorFunction(name: string, func: BinaryMathOperation): void {
        this.builtInFunctionTable[name] = {
            type: 'BUILTIN',
            mapper: false,
            ev: [],
            func: (left: AST.NodeExpr, ...right: AST.NodeExpr) => {
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
    private defineLeftAssociativeMultipleOperationFunction(name: string, func: BinaryMathOperation): void {
        this.builtInFunctionTable[name] = {
            type: 'BUILTIN',
            mapper: false,
            ev: [],
            func: (left: AST.NodeExpr, ...right: AST.NodeExpr) => {
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
    public toBoolean(tree: AST.NodeExpr): boolean {
        const value = tree instanceof MultiArray ? this.toLogical(tree) : tree;
        if (value instanceof ComplexDecimal) {
            return Boolean(value.re.toNumber() || value.im.toNumber());
        } else {
            return !!value.str;
        }
    }

    /**
     * Expression tree recursive evaluator.
     * @param tree Expression to evaluate.
     * @param local Set `true` if evaluating function.
     * @param fname Function name if evaluating function.
     * @returns Expression `tree` evaluated.
     */
    public Evaluator(tree: AST.NodeInput, local: boolean = false, fname: string = ''): AST.NodeInput {
        if (this.debug) {
            // eslint-disable-next-line no-console
            console.log(
                `Evaluator(\ntree:${JSON.stringify(
                    tree,
                    (key: string, value: AST.NodeInput) => (key !== 'parent' ? value : value === null ? 'root' : true),
                    2,
                )},\nlocal:${local},\nfname:${fname});`,
            );
        }
        if (tree) {
            if (tree instanceof ComplexDecimal || tree instanceof FunctionHandle || tree instanceof CharString || tree instanceof Structure) {
                return tree;
            } else if (tree instanceof MultiArray) {
                return this.evaluateArray(tree, this, local, fname);
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
                            this.reduceIfReturnList(this.Evaluator(tree.left, local, fname)),
                            this.reduceIfReturnList(this.Evaluator(tree.right, local, fname)),
                        );
                    case '()':
                        tree.right.parent = tree;
                        return this.reduceIfReturnList(this.Evaluator(tree.right, local, fname));
                    case '!':
                    case '~':
                    case '+_':
                    case '-_':
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as UnaryMathOperation)(this.reduceIfReturnList(this.Evaluator(tree.right, local, fname)));
                    case '++_':
                    case '--_':
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as IncDecOperator)(tree.right);
                    case ".'":
                    case "'":
                        tree.left.parent = tree;
                        return (this.opTable[tree.type] as UnaryMathOperation)(this.reduceIfReturnList(this.Evaluator(tree.left, local, fname)));
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
                        tree.left.parent = tree;
                        tree.right.parent = tree;
                        const assignment = this.validateAssignment(tree.left, true, local, fname);
                        const op: AST.TOperator | '' = tree.type.substring(0, tree.type.length - 1);
                        if (assignment.length > 1 && op.length > 0) {
                            throw new EvalError('computed multiple assignment not allowed.');
                        }
                        let right: AST.NodeExpr;
                        try {
                            right = this.Evaluator(tree.right, false, fname);
                        } catch {
                            right = tree.right;
                        }
                        if (right.type !== 'RETLIST') {
                            right = AST.nodeReturnList((length: number, index: number) => {
                                if (index === 0) {
                                    return tree.right;
                                } else {
                                    throw new EvalError(`element number ${index + 1} undefined in return list`);
                                }
                            });
                        }
                        const resultList = AST.nodeListFirst();
                        for (let n = 0; n < assignment.length; n++) {
                            const { id, index, field } = assignment[n];
                            if (id !== '~') {
                                if (index.length === 0) {
                                    /* Name definition. */
                                    if (right.type !== 'RETLIST') {
                                        right = this.Evaluator(right, false, fname);
                                    }
                                    const rightN = right.selector(assignment.length, n);
                                    rightN.parent = tree.right;
                                    const expr = op.length ? AST.nodeOp(op as AST.TOperator, AST.nodeIdentifier(id), rightN) : rightN;
                                    try {
                                        if (field.length > 0) {
                                            if (typeof this.nameTable[id] === 'undefined') {
                                                this.nameTable[id] = new Structure({});
                                            }
                                            if (this.nameTable[id] instanceof Structure) {
                                                this.setNewField(this.nameTable[id], field, this.reduceIfReturnList(this.Evaluator(expr)));
                                            } else {
                                                throw new EvalError('in indexed assignment.');
                                            }
                                            AST.appendNodeList(resultList, AST.nodeOp('=', AST.nodeIdentifier(id), this.nameTable[id]));
                                        } else {
                                            this.nameTable[id] = this.reduceIfReturnList(this.Evaluator(expr));
                                            AST.appendNodeList(resultList, AST.nodeOp('=', AST.nodeIdentifier(id), this.nameTable[id]));
                                        }
                                        continue;
                                    } catch (error) {
                                        this.nameTable[id] = expr;
                                        throw error;
                                    }
                                } else {
                                    /* Function definition or indexed matrix reference. */
                                    if (op) {
                                        if (typeof this.nameTable[id] !== 'undefined') {
                                            if (!(this.nameTable[id] instanceof FunctionHandle)) {
                                                /* Indexed matrix reference on left hand side with operator. */
                                                if (index.length === 1) {
                                                    /* Test logical indexing. */
                                                    const arg0 = this.reduceIfReturnList(this.Evaluator(index[0], local, fname));
                                                    if (arg0 instanceof MultiArray && arg0.type === ComplexDecimal.LOGICAL) {
                                                        /* Logical indexing. */
                                                        this.setElementsLogical(
                                                            this.nameTable,
                                                            id,
                                                            field,
                                                            this.linearize(arg0) as ComplexDecimal[],
                                                            this.scalarToArray(
                                                                this.reduceIfReturnList(
                                                                    this.Evaluator(
                                                                        AST.nodeOp(
                                                                            op,
                                                                            this.getElementsLogical(this.nameTable[id], id, field, arg0),
                                                                            this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                                        ),
                                                                        false,
                                                                        fname,
                                                                    ),
                                                                ),
                                                            ),
                                                        );
                                                    } else {
                                                        /* Not logical indexing. */
                                                        this.setElements(
                                                            this.nameTable,
                                                            id,
                                                            field,
                                                            [arg0],
                                                            this.scalarToArray(
                                                                this.reduceIfReturnList(
                                                                    this.Evaluator(
                                                                        AST.nodeOp(
                                                                            op,
                                                                            this.getElements(this.nameTable[id], id, field, [arg0]),
                                                                            this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                                        ),
                                                                        false,
                                                                        fname,
                                                                    ),
                                                                ),
                                                            ),
                                                        );
                                                    }
                                                } else {
                                                    this.setElements(
                                                        this.nameTable,
                                                        id,
                                                        field,
                                                        index.map((arg: AST.NodeExpr) => this.reduceIfReturnList(this.Evaluator(arg))),
                                                        this.scalarToArray(
                                                            this.reduceIfReturnList(
                                                                this.Evaluator(
                                                                    AST.nodeOp(
                                                                        op,
                                                                        this.getElements(this.nameTable[id], id, field, index),
                                                                        this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                                    ),
                                                                    false,
                                                                    fname,
                                                                ),
                                                            ),
                                                        ),
                                                    );
                                                }
                                                AST.appendNodeList(resultList, AST.nodeOp('=', AST.nodeIdentifier(id), this.nameTable[id]));
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
                                            const arg0 = this.reduceIfReturnList(this.Evaluator(index[0], local, fname));
                                            if (arg0 instanceof MultiArray && arg0.type === ComplexDecimal.LOGICAL) {
                                                /* Logical indexing. */
                                                this.setElementsLogical(
                                                    this.nameTable,
                                                    id,
                                                    field,
                                                    this.linearize(arg0) as ComplexDecimal[],
                                                    this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                );
                                            } else {
                                                /* Not logical indexing. */
                                                this.setElements(
                                                    this.nameTable,
                                                    id,
                                                    field,
                                                    [arg0],
                                                    this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                );
                                            }
                                        } else {
                                            this.setElements(
                                                this.nameTable,
                                                id,
                                                field,
                                                index.map((arg: AST.NodeExpr, i: number) => {
                                                    arg.parent = tree.left;
                                                    arg.index = i;
                                                    return this.reduceIfReturnList(this.Evaluator(arg));
                                                }),
                                                this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                            );
                                        }
                                        AST.appendNodeList(resultList, AST.nodeOp('=', AST.nodeIdentifier(id), this.nameTable[id]));
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
                            return (resultList.list[0] as AST.NodeExpr).right;
                        }
                    }
                    case 'IDENT':
                        if (local && this.localTable[fname] && this.localTable[fname][tree.id]) {
                            /* Defined in localTable. */
                            this.localTable[fname][tree.id].parent = tree;
                            return this.localTable[fname][tree.id];
                        } else if (tree.id in this.nameTable) {
                            /* Defined in nameTable. */
                            this.nameTable[tree.id].parent = tree;
                            return this.reduceIfReturnList(this.Evaluator(this.nameTable[tree.id]));
                        } else if (this.aliasName(tree.id) in this.builtInFunctionTable) {
                            /* Defined as built-in function */
                            return this.newFunctionHandle(tree.id);
                        } else {
                            throw new ReferenceError(`'${tree.id}' undefined.`);
                        }
                    case '.': {
                        const result = this.getFields(
                            this.reduceIfReturnList(this.Evaluator(tree.obj, local, fname)),
                            tree.field.map((field: AST.NodeExpr) => {
                                if (typeof field === 'string') {
                                    return field;
                                } else {
                                    const result = this.reduceIfReturnList(this.Evaluator(field, local, fname));
                                    if (result instanceof CharString) {
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
                                !(local && this.localTable[fname] && this.localTable[fname][tree.list[i].id]) &&
                                !(tree.list[i].id in this.nameTable) &&
                                Object.keys(this.commandWordListTable).indexOf(tree.list[i].id) >= 0
                            ) {
                                tree.list[i].type = 'CMDWLIST';
                                tree.list[i].omitAns = true;
                                tree.list[i]['args'] = [];
                            }
                            tree.list[i].parent = result;
                            tree.list[i].index = n;
                            const item = this.reduceIfReturnList(this.Evaluator(tree.list[i], local, fname));
                            if (item.type === 'LIST') {
                                for (let j = 0; j < item.list.length; j++, n++) {
                                    item.list[j].parent = result;
                                    item.list[j].index = n;
                                    result.list[n] = item.list[j];
                                    if (tree.parent === null && !result.list[n].omitAns) {
                                        this.nameTable['ans'] = result.list[n];
                                    }
                                }
                            } else {
                                result.list[n] = item;
                                if (tree.parent === null && !result.list[n].omitAns) {
                                    this.nameTable['ans'] = result.list[n];
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
                        return this.expandRange(
                            this.reduceIfReturnList(this.Evaluator(tree.start_, local, fname)),
                            this.reduceIfReturnList(this.Evaluator(tree.stop_, local, fname)),
                            tree.stride_ ? this.reduceIfReturnList(this.Evaluator(tree.stride_, local, fname)) : null,
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
                            const expr = this.reduceIfReturnList(this.Evaluator(parent.expr, local, fname));
                            if (expr instanceof MultiArray) {
                                return parent.args.length === 1 ? this.newNumber(this.linearLength(expr)) : this.newNumber(this.getDimension(expr, index));
                            } else {
                                return ComplexDecimal.one();
                            }
                        } else {
                            throw new SyntaxError("indeterminate end of range. The word 'end' to refer a value is valid only in indexing.");
                        }
                    }
                    case ':':
                        if (tree.parent.type === 'IDX') {
                            const expr = this.reduceIfReturnList(this.Evaluator(tree.parent.expr, local, fname));
                            if (expr instanceof MultiArray) {
                                return tree.parent.args.length === 1 ? this.expandColon(this.linearLength(expr)) : this.expandColon(this.getDimension(expr, tree.index));
                            } else {
                                return ComplexDecimal.one();
                            }
                        } else {
                            throw new SyntaxError('indeterminate colon. The colon to refer a range is valid only in indexing.');
                        }
                    case 'IDX': {
                        if (typeof tree.expr === 'undefined') {
                            // TODO: It's need?
                            throw new ReferenceError(`'${tree.id}' undefined.`);
                        }
                        tree.expr.parent = tree;
                        const expr = this.reduceIfReturnList(this.Evaluator(tree.expr, local, fname));
                        if (expr instanceof FunctionHandle) {
                            if (expr.id) {
                                const aliasTreeName = this.aliasName(expr.id as string);
                                const argumentsList = tree.args.map((arg: AST.NodeExpr, i: number) => {
                                    arg.parent = tree;
                                    arg.index = i;
                                    return this.builtInFunctionTable[aliasTreeName].ev.length > 0 &&
                                        i < this.builtInFunctionTable[aliasTreeName].ev.length &&
                                        !this.builtInFunctionTable[aliasTreeName].ev[i]
                                        ? arg
                                        : this.reduceIfReturnList(this.Evaluator(arg, local, fname));
                                });
                                /* Error if mapper and #arguments!==1 (Invalid call). */
                                if (this.builtInFunctionTable[aliasTreeName].mapper && argumentsList.length !== 1) {
                                    throw new EvalError(`Invalid call to ${aliasTreeName}. Type 'help ${expr.id}' to see correct usage.`);
                                }
                                /* If function is mapper and called with one parameter of type MultiArray, apply map to array. Else call function with argumentsList */
                                return this.builtInFunctionTable[aliasTreeName].mapper && argumentsList.length === 1 && argumentsList[0] instanceof MultiArray
                                    ? this.mapArray(argumentsList[0], this.builtInFunctionTable[aliasTreeName].func)
                                    : this.builtInFunctionTable[aliasTreeName].func(...argumentsList);
                            } else {
                                if (expr.parameter.length !== tree.args.length) {
                                    throw new EvalError(`invalid number of arguments in function ${tree.expr.id}.`);
                                }
                                /* Create localTable entry. */
                                const new_fname = tree.expr.id + '_' + globalThis.crypto.randomUUID();
                                this.localTable[new_fname] = {};
                                for (let i = 0; i < tree.args.length; i++) {
                                    /* Evaluate defined function arguments list. */
                                    tree.args[i].parent = tree;
                                    tree.args[i].index = i;
                                    this.localTable[new_fname][expr.parameter[i].id] = this.reduceIfReturnList(this.Evaluator(tree.args[i], true, fname));
                                }
                                const temp = this.reduceIfReturnList(this.Evaluator(expr.expression, true, new_fname));
                                /* Delete localTable entry. */
                                delete this.localTable[new_fname];
                                return temp;
                            }
                        } else {
                            /* Defined indexed matrix reference. */
                            if (tree.delim === '{}' && !(expr instanceof MultiArray && expr.isCell)) {
                                throw new EvalError('matrix cannot be indexed with {');
                            }
                            let result: MathObject;
                            const array = this.scalarOrCellToArray(expr);
                            if (tree.args.length === 1) {
                                /* Test logical indexing. */
                                tree.args[0].parent = tree;
                                tree.args[0].index = 0;
                                const arg0 = this.reduceIfReturnList(this.Evaluator(tree.args[0], local, fname));
                                if (arg0 instanceof MultiArray && arg0.type === ComplexDecimal.LOGICAL) {
                                    /* Logical indexing. */
                                    result = this.getElementsLogical(array, tree.expr.id, [], arg0);
                                } else {
                                    /* Not logical indexing. */
                                    result = this.getElements(array, tree.expr.id, [], [arg0]);
                                }
                            } else {
                                result = this.getElements(
                                    array,
                                    tree.expr.id,
                                    [],
                                    tree.args.map((arg: AST.NodeExpr, i: number) => {
                                        arg.parent = tree;
                                        arg.index = i;
                                        return this.reduceIfReturnList(this.Evaluator(arg, local, fname));
                                    }),
                                );
                            }
                            result!.parent = tree;
                            if (array.isCell && tree.delim === '()') {
                                (result as MultiArray).isCell = true;
                                return result;
                            } else {
                                return this.arrayToScalar(result);
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
                            if (this.toBoolean(this.reduceIfReturnList(this.Evaluator(tree.expression[ifTest], local, fname)))) {
                                tree.then[ifTest].parent = tree;
                                return this.reduceIfReturnList(this.Evaluator(tree.then[ifTest], local, fname));
                            }
                        }
                        // No one then clause.
                        if (tree.else) {
                            tree.else.parent = tree;
                            return this.reduceIfReturnList(this.Evaluator(tree.else, local, fname));
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
    public Evaluate(tree: AST.NodeInput): AST.NodeInput {
        try {
            this.exitStatus = this.response.OK;
            tree.parent = null;
            return this.Evaluator(tree);
        } catch (e) {
            this.exitStatus = this.response.EVAL_ERROR;
            throw e;
        }
    }

    /**
     * Unparse expression `tree`.
     * @param tree Expression to unparse.
     * @returns Expression `tree` unparsed.
     */
    public Unparse(tree: AST.NodeInput): string {
        try {
            if (tree) {
                if (tree === undefined) {
                    return '<UNDEFINED>';
                } else if (tree instanceof ComplexDecimal) {
                    return this.unparseNumber(tree);
                } else if (tree instanceof CharString) {
                    return this.unparseString(tree);
                } else if (tree instanceof MultiArray) {
                    return this.unparseArray(tree, this);
                } else if (tree instanceof Structure) {
                    return this.unparseStructure(tree, this);
                } else if (tree instanceof FunctionHandle) {
                    return this.unparseFunctionHandle(tree, this);
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
                        case '|=':
                            return this.Unparse(tree.left) + tree.type + this.Unparse(tree.right);
                        case '()':
                            return '(' + this.Unparse(tree.right) + ')';
                        case '!':
                        case '~':
                            return tree.type + this.Unparse(tree.right);
                        case '+_':
                            return '+' + this.Unparse(tree.right);
                        case '-_':
                            return '-' + this.Unparse(tree.right);
                        case '++_':
                            return '++' + this.Unparse(tree.right);
                        case '--_':
                            return '--' + this.Unparse(tree.right);
                        case ".'":
                        case "'":
                            return this.Unparse(tree.left) + tree.type;
                        case '_++':
                            return this.Unparse(tree.left) + '++';
                        case '_--':
                            return this.Unparse(tree.left) + '--';
                        case 'IDENT':
                            return tree.id.replace(/^[Ii]nf$/, '&infin;');
                        case '.':
                            return (
                                this.Unparse(tree.obj) +
                                '.' +
                                tree.field.map((value: string | AST.NodeExpr) => (typeof value === 'string' ? value : '(' + this.Unparse(value) + ')')).join('.')
                            );
                        case 'LIST':
                            return tree.list.map((value: AST.NodeInput) => this.Unparse(value)).join('\n') + '\n';
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
                            return this.Unparse(tree.expr) + tree.delim[0] + tree.args.map((value: AST.NodeExpr) => this.Unparse(value)).join(',') + tree.delim[1];
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
    public unparserMathML(tree: AST.NodeInput, parentPrecedence = 0): string {
        try {
            if (tree) {
                if (tree === undefined) {
                    return MathML.format['UNDEFINED']();
                } else if (tree instanceof ComplexDecimal) {
                    return this.unparseNumberMathML(tree, this, parentPrecedence);
                } else if (tree instanceof CharString) {
                    return this.unparseStringMathML(tree, parentPrecedence);
                } else if (tree instanceof MultiArray) {
                    return this.unparseArrayMathML(tree, this, parentPrecedence);
                } else if (tree instanceof Structure) {
                    return this.unparseStructureMathML(tree, this, parentPrecedence);
                } else if (tree instanceof FunctionHandle) {
                    return this.unparseFunctionHandleMathML(tree, this, parentPrecedence);
                } else {
                    switch (tree.type) {
                        case '()': {
                            const precedence = this.nodePrecedence(tree.right);
                            const rightUnparse = this.unparserMathML(tree.right, precedence);
                            return precedence < parentPrecedence ? MathML.format['()']('(', rightUnparse, ')') : rightUnparse;
                        }
                        case '+':
                        case '-':
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
                        case '~=':
                        case '*': {
                            const precedence = this.nodePrecedence(tree);
                            const leftUnparse = this.unparserMathML(tree.left, precedence);
                            const rightUnparse = this.unparserMathML(tree.right, precedence);
                            return MathML.format[tree.type](
                                this.nodePrecedence(tree.left) < precedence ? MathML.format['()']('(', leftUnparse, ')') : leftUnparse,
                                this.nodePrecedence(tree.right) < precedence ? MathML.format['()']('(', rightUnparse, ')') : rightUnparse,
                            );
                        }
                        case '/':
                            return MathML.format[tree.type](this.unparserMathML(tree.left), this.unparserMathML(tree.right));
                        case '**':
                        case '^':
                            return MathML.format[tree.type](this.unparserMathML(tree.left, this.precedenceTable['_' + tree.type]), this.unparserMathML(tree.right));
                        case '!':
                        case '~':
                        case '+_':
                        case '-_':
                        case '++_':
                        case '--_':
                            return MathML.format[tree.type](this.unparserMathML(tree.right));
                        case '_++':
                        case '_--':
                        case ".'":
                        case "'":
                            return MathML.format[tree.type](this.unparserMathML(tree.left, this.precedenceTable['_' + tree.type]));
                        case 'IDENT':
                            return MathML.format['IDENT'](substSymbol(tree.id));
                        case '.':
                            return MathML.format['.'](
                                this.unparserMathML(tree.obj),
                                tree.field.map((value: string | AST.NodeExpr) =>
                                    typeof value === 'string' ? MathML.format['IDENT'](value) : MathML.format['()']('(', this.unparserMathML(value), ')'),
                                ),
                            );
                        case 'LIST':
                            return MathML.format['LIST'](tree.list.map((value: AST.NodeInput) => this.unparserMathML(value)));
                        case 'RANGE':
                            if (tree.start_ && tree.stop_) {
                                if (tree.stride_) {
                                    return MathML.format['RANGE'](this.unparserMathML(tree.start_), this.unparserMathML(tree.stride_), this.unparserMathML(tree.stop_));
                                } else {
                                    return MathML.format['RANGE'](this.unparserMathML(tree.start_), this.unparserMathML(tree.stop_));
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
                                return MathML.format['IDX'](this.unparserMathML(tree.expr), tree.delim[0], [], tree.delim[1]);
                            } else {
                                let unparse;
                                if (tree.expr.type === 'IDENT') {
                                    const aliasTreeName = this.aliasName(tree.expr.id);
                                    if (aliasTreeName in this.builtInFunctionTable && this.builtInFunctionTable[aliasTreeName].unparserMathML) {
                                        unparse = this.builtInFunctionTable[aliasTreeName].unparserMathML(tree);
                                    } else if (aliasTreeName in this.builtInFunctionTable && aliasTreeName in MathML.format) {
                                        unparse = MathML.format[aliasTreeName](...tree.args.map((arg: AST.NodeExpr) => this.unparserMathML(arg)));
                                    } else {
                                        unparse = MathML.format['IDX'](
                                            MathML.format['IDENT'](substSymbol(tree.expr.id)),
                                            tree.delim[0],
                                            tree.args.map((arg: AST.NodeExpr) => this.unparserMathML(arg)),
                                            tree.delim[1],
                                        );
                                    }
                                } else {
                                    unparse = MathML.format['IDX'](
                                        this.unparserMathML(tree.expr, parentPrecedence),
                                        tree.delim[0],
                                        tree.args.map((arg: AST.NodeExpr) => this.unparserMathML(arg)),
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
                                tree.args.map((arg: CharString) => this.unparserMathML(arg)),
                            );
                        case 'IF':
                            const ifThenArray = tree.expression.map(
                                (expr: AST.NodeInput, i: number) =>
                                    `<mtr><mtd><mo>${i === 0 ? '<b>if</b>' : '<b>elseif</b>'}</mo></mtd><mtd>${this.unparserMathML(
                                        tree.expression[0],
                                    )}</mtd></mtr><mtr><mtd></mtd><mtd>${this.unparserMathML(tree.then[0])}</mtd></mtr>`,
                            );
                            const ifElse = tree.else ? `<mtr><mtd><mo><b>else</b></mo></mtd></mtr><mtr><mtd></mtd><mtd>${this.unparserMathML(tree.else)}</mtd></mtr>` : '';
                            return `<mtable>${ifThenArray.join('')}${ifElse}<mtr><mtd><mo><b>endif</b></mo></mtd></mtr></mtable>`;
                        default:
                            return MathML.format['INVALID']();
                    }
                }
            } else {
                return MathML.format['UNDEFINED']();
            }
        } catch (e) {
            if (this.debug) {
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
    public UnparseMathML(tree: AST.NodeInput, display: 'inline' | 'block' = 'block'): string {
        let result: string = this.unparserMathML(tree);
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
    public toMathML(input: string, display: 'inline' | 'block' = 'block'): string {
        return this.UnparseMathML(this.Parse(input), display);
    }
}
export type {
    AliasNameTable,
    AliasFunction,
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
export default Evaluator;
