import crypto from 'crypto';
import 'globalthis/polyfill';
(globalThis as any).crypto = crypto;
export * from './lib-core';
