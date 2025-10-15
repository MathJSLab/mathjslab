/**
 * build-key.ts: This script generate Arrays of key definitions from types and objects.
 */
import path from 'node:path';
import { fileURLToPath } from 'url';

import { buildKeyTable } from './helper/buildKeyTable';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let interfaceFileName = 'ComplexInterface';
let interfaceName = 'ComplexConfig';
buildKeyTable(path.resolve(__dirname, '..', 'src', `${interfaceFileName}.ts`), path.resolve(__dirname, '..', 'src', `${interfaceName}KeyTable.ts`), interfaceName);

interfaceName = 'ComplexInterface';
buildKeyTable(path.resolve(__dirname, '..', 'src', `${interfaceFileName}.ts`), path.resolve(__dirname, '..', 'src', `${interfaceName}KeyTable.ts`), interfaceName);

interfaceName = 'ComplexInterfaceStatic';
buildKeyTable(path.resolve(__dirname, '..', 'src', `${interfaceFileName}.ts`), path.resolve(__dirname, '..', 'src', `${interfaceName}KeyTable.ts`), interfaceName);
