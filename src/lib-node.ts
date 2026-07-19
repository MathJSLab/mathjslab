import crypto from 'crypto';
type NodeCryptoGlobal = Omit<typeof globalThis, 'crypto'> & { crypto: typeof crypto };
(globalThis as unknown as NodeCryptoGlobal).crypto = crypto;
export * from './lib-core';
