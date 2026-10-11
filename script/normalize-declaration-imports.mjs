/** Emit relative declaration specifiers accepted by NodeNext and bundler consumers. */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const directory = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'types');
function visit(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
        const filename = join(current, entry.name);
        if (entry.isDirectory()) visit(filename);
        else if (entry.name.endsWith('.d.ts')) {
            const original = readFileSync(filename, 'utf8');
            const source = ts.createSourceFile(filename, original, ts.ScriptTarget.Latest, true);
            const edits = [];
            const inspect = (node) => {
                let specifier;
                if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
                else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) specifier = node.argument.literal;
                if (specifier && ts.isStringLiteral(specifier) && /^\.{1,2}\//.test(specifier.text) && !/\.(?:js|mjs|cjs|json|ts)$/.test(specifier.text)) {
                    const text = specifier.text;
                    let suffix;
                    if (existsSync(resolve(dirname(filename), text + '.d.ts'))) suffix = '.js';
                    else if (existsSync(resolve(dirname(filename), text, 'index.d.ts'))) suffix = '/index.js';
                    else throw new Error('Unresolved declaration import: ' + filename + ' -> ' + text);
                    edits.push({ offset: specifier.getEnd() - 1, suffix });
                }
                ts.forEachChild(node, inspect);
            };
            inspect(source);
            let normalized = original;
            for (const edit of edits.sort((a, b) => b.offset - a.offset)) normalized = normalized.slice(0, edit.offset) + edit.suffix + normalized.slice(edit.offset);
            if (normalized !== original) writeFileSync(filename, normalized);
        }
    }
}
visit(directory);
