import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

type ApiItem = {
    name: string;
    kind: string;
    source: string;
    documentation: string;
};

type PublicSource = {
    fileName: string;
    names?: Set<string>;
};

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'src');
const outputFile = path.join(rootDir, 'doc', 'api-reference.md');
const publicModules = ['lib-core.ts', 'lib.ts'];

/**
 * Converts a source file path into a stable repository-relative path.
 */
function relativeSource(fileName: string): string {
    return path.relative(rootDir, fileName).replace(/\\/g, '/');
}

/**
 * Returns the source file targeted by a local export declaration.
 */
function resolveExportModule(moduleSpecifier: string): string | undefined {
    if (!moduleSpecifier.startsWith('./')) return undefined;
    const candidate = path.join(sourceDir, `${moduleSpecifier.slice(2)}.ts`);
    return fs.existsSync(candidate) ? candidate : undefined;
}

/**
 * Reads the first JSDoc block attached to a declaration.
 */
function getDocumentation(node: ts.Node, sourceFile: ts.SourceFile): string {
    const jsDocs = (node as ts.Node & { jsDoc?: ts.JSDoc[] }).jsDoc;
    const comment = jsDocs?.at(-1)?.comment;
    if (typeof comment === 'string' && comment.trim().length > 0) return comment.trim();

    const ranges = ts.getLeadingCommentRanges(sourceFile.getFullText(), node.getFullStart())?.filter((range) => sourceFile.getFullText().slice(range.pos, range.pos + 3) === '/**');
    if (!ranges || ranges.length === 0) return 'No JSDoc documentation is available yet.';
    const block = sourceFile.getFullText().slice(ranges.at(-1)!.pos, ranges.at(-1)!.end);
    const documentation = block
        .replace(/^\/\*\*|\*\/$/g, '')
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
        .filter((line) => line.length > 0 && !line.startsWith('@'))
        .join('\n')
        .trim();
    return documentation.length > 0 ? documentation : 'No JSDoc documentation is available yet.';
}

/**
 * Returns a readable TypeScript declaration kind.
 */
function getKind(node: ts.Node): string {
    if (ts.isClassDeclaration(node)) return 'class';
    if (ts.isFunctionDeclaration(node)) return 'function';
    if (ts.isInterfaceDeclaration(node)) return 'interface';
    if (ts.isTypeAliasDeclaration(node)) return 'type';
    if (ts.isEnumDeclaration(node)) return 'enum';
    if (ts.isVariableStatement(node)) return 'constant';
    return ts.SyntaxKind[node.kind];
}

/**
 * Returns exported declaration names from a source file.
 */
function getLocalExportNames(sourceFile: ts.SourceFile): Set<string> {
    const names = new Set<string>();
    sourceFile.forEachChild((node) => {
        if (!ts.isExportDeclaration(node) || node.moduleSpecifier || !node.exportClause || !ts.isNamedExports(node.exportClause)) return;
        for (const element of node.exportClause.elements) {
            names.add(element.propertyName?.text ?? element.name.text);
        }
    });
    return names;
}

/**
 * Returns exported declaration names from a source file.
 */
function collectExportedDeclarations(publicSource: PublicSource): ApiItem[] {
    const fileName = publicSource.fileName;
    const sourceText = fs.readFileSync(fileName, 'utf8');
    const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
    const localExportNames = getLocalExportNames(sourceFile);
    const items: ApiItem[] = [];

    sourceFile.forEachChild((node) => {
        const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
        const isExported = modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;

        if (ts.isVariableStatement(node)) {
            for (const declaration of node.declarationList.declarations) {
                if (
                    ts.isIdentifier(declaration.name) &&
                    (isExported ||
                        localExportNames.has(declaration.name.text) ||
                        publicSource.names?.has(declaration.name.text) ||
                        (!publicSource.names && localExportNames.has(declaration.name.text)))
                ) {
                    items.push({
                        name: declaration.name.text,
                        kind: getKind(node),
                        source: relativeSource(fileName),
                        documentation: getDocumentation(node, sourceFile),
                    });
                }
            }
            return;
        }

        const namedNode = node as ts.Declaration & { name?: ts.PropertyName };
        if (
            namedNode.name &&
            ts.isIdentifier(namedNode.name) &&
            (isExported || localExportNames.has(namedNode.name.text) || publicSource.names?.has(namedNode.name.text) || (!publicSource.names && localExportNames.has(namedNode.name.text)))
        ) {
            items.push({
                name: namedNode.name.text,
                kind: getKind(node),
                source: relativeSource(fileName),
                documentation: getDocumentation(node, sourceFile),
            });
        }
    });

    return items;
}

/**
 * Resolves modules exported by the public package entry points.
 */
function collectPublicSourceFiles(): PublicSource[] {
    const files = new Map<string, Set<string> | undefined>();
    const addFile = (fileName: string, names?: Set<string>): void => {
        if (!files.has(fileName)) {
            files.set(fileName, names);
            return;
        }
        const existing = files.get(fileName);
        if (!existing) return;
        if (!names) {
            files.set(fileName);
            return;
        }
        for (const name of names) existing.add(name);
    };

    for (const moduleFile of publicModules) {
        const fileName = path.join(sourceDir, moduleFile);
        addFile(fileName);
        const sourceText = fs.readFileSync(fileName, 'utf8');
        const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
        sourceFile.forEachChild((node) => {
            if (!ts.isExportDeclaration(node) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return;
            const resolved = resolveExportModule(node.moduleSpecifier.text);
            if (!resolved) return;
            if (!node.exportClause) {
                addFile(resolved);
                return;
            }
            if (ts.isNamedExports(node.exportClause)) {
                addFile(resolved, new Set(node.exportClause.elements.map((element) => element.propertyName?.text ?? element.name.text)));
            }
        });
    }
    return [...files.entries()].map(([fileName, names]) => ({ fileName, names })).sort((a, b) => relativeSource(a.fileName).localeCompare(relativeSource(b.fileName)));
}

const items = collectPublicSourceFiles()
    .flatMap(collectExportedDeclarations)
    .sort((a, b) => a.name.localeCompare(b.name));
const generated = [
    '# API Reference',
    '',
    '<!-- This file is generated by `npm run docs:api`. Do not edit it manually. -->',
    '',
    'This reference is generated from exported TypeScript declarations and their JSDoc comments.',
    '',
    ...items.flatMap((item) => [`## ${item.name}`, '', `- Kind: \`${item.kind}\``, `- Source: \`${item.source}\``, '', item.documentation, '']),
].join('\n');

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${generated.trimEnd()}\n`);
