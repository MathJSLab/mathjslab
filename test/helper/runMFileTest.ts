import fs from 'node:fs';
import path from 'node:path';
import { AST, type CommandWordListTable, type NodeInput } from '../../src/AST';
import { Complex } from '../../src/Complex';
import { Interpreter, type InterpreterConfig } from '../../src/Interpreter';
import { MultiArray } from '../../src/MultiArray';

type MFileExecutionIssue = {
    line: number | undefined;
    source: string;
    message: string;
};

type MFileTestResult = {
    passed: boolean;
    resultVariableName: string;
    resultSource: string;
    expectedErrors: number;
    unexpectedSuccesses: MFileExecutionIssue[];
    unexpectedErrors: MFileExecutionIssue[];
    interpreter: Interpreter;
};

const defaultCommandWordListTable: CommandWordListTable = {
    help: {
        func: (): void => undefined,
    },
};

function sourceLines(source: string): string[] {
    return source.split(/\r\n|\n|\r/);
}

function stripLineComment(line: string): string {
    let quote: '"' | "'" | null = null;
    for (let i = 0; i < line.length; i++) {
        const current = line[i];
        const next = line[i + 1];
        if (quote) {
            if (current === quote) {
                if (next === quote) {
                    i++;
                } else {
                    quote = null;
                }
            }
        } else if (current === '"' || current === "'") {
            quote = current;
        } else if (current === '%') {
            return line.slice(0, i);
        }
    }
    return line;
}

function stripCommentsPreservingLines(source: string): string {
    let inBlockComment = false;
    return sourceLines(source)
        .map((line) => {
            const trimmed = line.trim();
            if (trimmed === '%{') {
                inBlockComment = true;
                return '';
            }
            if (trimmed === '%}') {
                inBlockComment = false;
                return '';
            }
            if (inBlockComment) {
                return '';
            }
            return stripLineComment(line);
        })
        .join('\n');
}

function nodeSource(lines: string[], node: NodeInput): string {
    const startLine = node.start?.line;
    const stopLine = node.stop?.line ?? startLine;
    if (typeof startLine !== 'number' || typeof stopLine !== 'number') {
        return '';
    }
    return lines
        .slice(startLine - 1, stopLine)
        .join('\n')
        .trim();
}

function nodeHasExpectedErrorComment(lines: string[], node: NodeInput): boolean {
    const startLine = node.start?.line;
    const stopLine = node.stop?.line ?? startLine;
    if (typeof startLine !== 'number' || typeof stopLine !== 'number') {
        return false;
    }
    return lines.slice(startLine - 1, stopLine).some((line) => /%+\s*error\b/i.test(line));
}

function runtimeValueToBoolean(value: NodeInput): boolean {
    const reduced = AST.reduceToFirstIfReturnList(value);
    if (reduced.type === 'LIST' && reduced.list.length === 1) {
        return runtimeValueToBoolean(reduced.list[0]);
    }
    if (Complex.isInstanceOf(reduced)) {
        return Boolean(Complex.toBoolean(reduced));
    }
    if (MultiArray.isInstanceOf(reduced)) {
        return Boolean(Complex.toBoolean(MultiArray.toLogical(reduced)));
    }
    throw new TypeError(`result variable did not evaluate to a logical or numeric value: ${String(reduced.type)}`);
}

function createMFileTestInterpreter(config: InterpreterConfig = {}): Interpreter {
    return Interpreter.Create({
        ...config,
        externalCmdWListTable: {
            ...defaultCommandWordListTable,
            ...config.externalCmdWListTable,
        },
    });
}

function runMFileTest(filePath: string, resultVariableName: string, config: InterpreterConfig = {}): MFileTestResult {
    const absolutePath = path.resolve(filePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    const lines = sourceLines(source);
    const executableSource = stripCommentsPreservingLines(source);
    const executableLines = sourceLines(executableSource);
    const interpreter = createMFileTestInterpreter(config);
    const tree = interpreter.Parse(executableSource);
    const statements = tree.type === 'LIST' ? tree.list : [tree];
    const unexpectedSuccesses: MFileExecutionIssue[] = [];
    const unexpectedErrors: MFileExecutionIssue[] = [];
    let expectedErrors = 0;

    for (const statement of statements) {
        const expectedError = nodeHasExpectedErrorComment(lines, statement);
        if (expectedError) {
            expectedErrors++;
        }
        try {
            interpreter.Evaluate(AST.nodeListFirst(statement));
            if (expectedError) {
                unexpectedSuccesses.push({
                    line: statement.start?.line,
                    source: nodeSource(executableLines, statement),
                    message: 'Expected this statement to throw because it is marked with "% error", but it completed successfully.',
                });
            }
        } catch (error: unknown) {
            if (!expectedError) {
                unexpectedErrors.push({
                    line: statement.start?.line,
                    source: nodeSource(executableLines, statement),
                    message: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }

    try {
        const result = interpreter.Execute(resultVariableName);
        const resultSource = interpreter.Unparse(result).trim();
        return {
            passed: runtimeValueToBoolean(result),
            resultVariableName,
            resultSource,
            expectedErrors,
            unexpectedSuccesses,
            unexpectedErrors,
            interpreter,
        };
    } catch (error: unknown) {
        unexpectedErrors.push({
            line: undefined,
            source: resultVariableName,
            message: error instanceof Error ? error.message : String(error),
        });
        return {
            passed: false,
            resultVariableName,
            resultSource: '',
            expectedErrors,
            unexpectedSuccesses,
            unexpectedErrors,
            interpreter,
        };
    }
}

export type { MFileExecutionIssue, MFileTestResult };
export { createMFileTestInterpreter, runMFileTest };
