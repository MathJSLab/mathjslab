import path from 'node:path';
import fs from 'node:fs';
import ts from 'typescript';

/**
 * Creates an array of strings with the keys of the selected declaration.
 * @param inputFile Input file with declaration definition.
 * @param outputFile Output file with the array of strings containing the declaration keys.
 * @param declName Declaration name.
 */
export const buildKeyTable = (inputFile: string, outputFile: string, declName: string) => {
    console.log(`Building key list from ${inputFile} (declaration ${declName})`);
    /* Read source. */
    const source: ts.SourceFile = ts.createSourceFile(inputFile, fs.readFileSync(inputFile, 'utf-8'), ts.ScriptTarget.Latest, true);
    const keys: string[] = [];
    /**
     * Visit the nodes of `source` searching `interfacename`.
     * @param node Source node.
     */
    function visit(node: ts.Node) {
        /* Interface. */
        if (ts.isInterfaceDeclaration(node) && node.name.text === declName) {
            node.members.forEach((member) => {
                if (ts.isPropertySignature(member) || ts.isMethodSignature(member)) {
                    const name = member.name!.getText(source).replace(/['"]/g, '');
                    keys.push(name);
                }
            });
        }
        /* Type alias with literal object. */
        if (ts.isTypeAliasDeclaration(node) && node.name.text === declName && ts.isTypeLiteralNode(node.type)) {
            node.type.members.forEach((member) => {
                if (ts.isPropertySignature(member)) {
                    const name = member.name!.getText(source).replace(/['"]/g, '');
                    keys.push(name);
                }
            });
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
    /* Generate output */
    const fileContent = `import { ${declName}Key } from './${path.parse(inputFile).name}';\nexport const ${declName}KeyTable: ${declName}Key[] = ${JSON.stringify(keys, null, 4).replace(/\"/gm, "'")};\n`;
    fs.writeFileSync(outputFile, fileContent, 'utf-8');
    console.log(`Source file generated: ${outputFile}`);
};
export default { buildKeyTable };
