#!/usr/bin/env tsx
/**
 * mark-crono.ts - Build chronometer utility.
 *
 * Usage:
 *   tsx mark-crono.ts [start | mark | stop] [(--config|-c) mark.crono1.json]
 *
 * Example:
 *   tsx mark-crono.ts
 *   tsx mark-crono.ts start
 *   tsx mark-crono.ts mark
 *   tsx mark-crono.ts stop
 *   tsx mark-crono.ts -c mark.crono1.json
 */
import fs from 'node:fs';
import path from 'node:path';

interface Options {
    config: string[];
    mode: 'start' | 'mark' | 'stop';
}
const options: Options = {
    config: ['mark.crono.json'],
    mode: 'start',
};
interface ChronometerData {
    start: string;
    mark?: string[];
    stop?: string;
    duration?: number;
}
const FILE_PATH = path.resolve(process.cwd(), 'mark.crono.json');
const timestamp = new Date().toISOString();
const args = process.argv;
let Chronometer: ChronometerData = {
    start: '',
};
for (let i = 2; i < args.length; i++) {
    switch (args[i]) {
        case 'start':
            options.mode = 'start';
            break;
        case 'mark':
            options.mode = 'mark';
            break;
        case 'stop':
            options.mode = 'stop';
            break;
        case '--config':
        case '-c':
            options.config.push(args[++i]);
            break;
        default:
            throw new Error(`invalid command line argument: ${args[i]}`);
    }
}
try {
    fs.accessSync(FILE_PATH, fs.constants.R_OK);
    Chronometer = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
} catch {
    Chronometer = {
        start: timestamp,
    };
}
switch (options.mode) {
    case 'start':
        Chronometer.start = timestamp;
        delete Chronometer.mark;
        delete Chronometer.stop;
        delete Chronometer.duration;
        break;
    case 'mark':
        if (Array.isArray(Chronometer.mark)) {
            Chronometer.mark.push(timestamp);
        } else {
            Chronometer.mark = [timestamp];
        }
        delete Chronometer.stop;
        delete Chronometer.duration;
        break;
    case 'stop':
        Chronometer.stop = timestamp;
        Chronometer.duration = Date.parse(Chronometer.stop) - Date.parse(Chronometer.start);
        break;
}
try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(Chronometer, null, 4), 'utf-8');
} catch {
    throw new Error(`cannot write: ${FILE_PATH}`);
}
switch (options.mode) {
    case 'start':
        console.log(`🧩 start time: ${timestamp}`);
        break;
    case 'mark':
        console.log(`🧩 mark(${Chronometer.mark!.length}) time: ${timestamp}`);
        break;
    case 'stop':
        console.log(`🧩 stop time: ${timestamp}`);
        const duration = Math.round(Chronometer.duration! / 1e3);
        const durationMinutes = Math.floor(duration / 60);
        const durationSeconds = duration - durationMinutes * 60;
        console.log(`   duration: ${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`);
        break;
}
