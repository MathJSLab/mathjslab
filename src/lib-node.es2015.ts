import crypto from 'node:crypto';
import 'globalthis/polyfill';
(globalThis as any).crypto = crypto;
export * from './lib-core';
