import crypto from 'node:crypto';
(globalThis as any).crypto = crypto;
export * from './lib-core';
