#!/usr/bin/env tsx
/**
 * copy-repo-config.ts
 *
 * Usage:
 *   tsx copy-repo-config.ts [copy | clean] [--dry-run|-d] [(--base-dir|-b) dir] [(--config|-c) copy.repo.config1.json copy.repo.config2.json ...]
 *
 * Example:
 *   tsx copy-repo-config.ts
 *   tsx copy-repo-config.ts clean
 *   tsx copy-repo-config.ts -c copy.repo.config1.json
 *   tsx copy-repo-config.ts -config copy.repo.config1.json copy.repo.config2.json copy.repo.config3.json
 *   tsx copy-repo-config.ts --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';

type TFileRecord = {
    src: string;
    dest?: string;
};

type TFilePath = string;

type TFile = TFileRecord | TFilePath;

interface Configuration {
    repository: string;
    files: TFile[];
}

/* Global options (set by command line). */
interface Options {
    dryRun: boolean;
    baseDir: string;
    config: string[];
    mode: 'clean' | 'copy';
}
const options: Options = {
    dryRun: false,
    baseDir: path.resolve('repo'),
    config: ['copy.repo.config.json'],
    mode: 'copy',
};

/* Processing command line arguments. */
const args = process.argv;
for (let i = 2; i < args.length; i++) {
    switch (args[i]) {
        case 'clean':
            options.mode = 'clean';
            break;
        case 'copy':
            options.mode = 'copy';
            break;
        case '--base-dir':
        case '-b':
            if (!args[i + 1].startsWith('--')) {
                options.baseDir = path.resolve(args[++i]);
            } else {
                throw new Error(`invalid command line argument: ${args[i + 1]}`);
            }
            break;
        case '--config':
        case '-c':
            while (args[i + 1] && !args[i + 1].startsWith('--')) {
                options.config.push(args[++i]);
            }
            break;
        case '--dry-run':
        case '-d':
            options.dryRun = true;
            break;
        default:
            throw new Error(`invalid command line argument: ${args[i]}`);
    }
}
console.log('🧩 Files to proccess:', options.config.join(', '));
if (options.dryRun) {
    console.log('🔍 Dry-run mode (no one file will be modified).');
}
for (const config of options.config) {
    const fullPath = path.resolve(config);
    try {
        fs.accessSync(fullPath, fs.constants.R_OK);
        if (fs.statSync(fullPath).isFile()) {
            const configParsed: Configuration = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            configParsed.files.forEach((file) => {
                let src: string, dest: string;
                if (typeof file === 'object') {
                    src = path.join(options.baseDir, configParsed.repository, file.src);
                    dest = typeof file.dest !== 'undefined' ? path.resolve(file.dest) : path.resolve(file.src);
                } else {
                    src = path.join(options.baseDir, configParsed.repository, file);
                    dest = path.resolve(file);
                }
                if (!options.dryRun) {
                    if (options.mode === 'copy') {
                        fs.copyFileSync(src, dest);
                        console.log(`copy file from: ${src}`);
                        console.log(`to: ${dest}`);
                    } else {
                        fs.unlinkSync(dest);
                        console.log(`file removed: ${dest}`);
                    }
                }
            });
        } else {
            throw new Error(`not a file: ${fullPath}`);
        }
    } catch {
        throw new Error(`cannot read: ${fullPath}`);
    }
}
const doneMessage = 'Copy repository files';
console.log(options.dryRun ? `🏁 ${doneMessage} ${options.mode} dry-run completed successfully.` : `🏁 ${doneMessage} ${options.mode} completed successfully.`);
