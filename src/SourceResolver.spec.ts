/// <reference types="jest" />
import { ManifestSourceResolver, TableSourceResolver } from './SourceResolver';

describe('SourceResolver', () => {
    describe('TableSourceResolver', () => {
        it('Should resolve legacy source tables and providers by kind.', () => {
            const resolver = TableSourceResolver.create({
                functionSourceTable: {
                    'pkg.f': 'function y = f(x), y = x + 1; end',
                },
                scriptSourceProvider: (name) => (name === 'runme' ? { source: 'x = 1;' } : undefined),
                classSourceProvider: (name) => (name === 'pkg.Box' ? 'classdef Box, end' : undefined),
            });

            expect(resolver.resolve('function', 'pkg.f')?.name).toBe('pkg.f');
            expect(resolver.resolve('script', 'runme.m')?.name).toBe('runme');
            expect(resolver.resolve('class', 'pkg.Box')?.name).toBe('pkg.Box');
            expect(resolver.resolve('function', 'missing')).toBeUndefined();
        });
    });

    describe('ManifestSourceResolver', () => {
        it('Should prefetch manifest files and resolve package names.', async () => {
            const responses: Record<string, string> = {
                '/m-files/+pkg/addone.m': 'function y = addone(x), y = x + 1; end',
                '/m-files/+pkg/Box.m': 'classdef Box, end',
                '/m-files/startup.m': 'x = 1;',
            };
            const fetcher = jest.fn(async (url: string) => ({
                ok: true,
                text: async () => responses[url],
            }));

            const resolver = await ManifestSourceResolver.fromManifest(
                {
                    baseUrl: '/m-files',
                    files: [
                        { path: '+pkg/addone.m', kind: 'function' },
                        { path: '+pkg/Box.m', kind: 'class' },
                        { path: 'startup.m', kind: 'script' },
                    ],
                },
                fetcher,
            );

            expect(fetcher).toHaveBeenCalledWith('/m-files/+pkg/addone.m');
            expect(resolver.resolve('function', 'pkg.addone')?.source).toContain('addone');
            expect(resolver.resolve('class', 'pkg.Box')?.source).toContain('classdef');
            expect(resolver.resolve('script', 'startup.m')?.name).toBe('startup');
        });

        it('Should report failed manifest fetches.', async () => {
            await expect(
                ManifestSourceResolver.fromManifest({ files: ['missing.m'] }, async () => ({
                    ok: false,
                    status: 404,
                    statusText: 'Not Found',
                    text: async () => '',
                })),
            ).rejects.toThrow('failed to fetch missing.m: 404 Not Found');
        });
    });
});
