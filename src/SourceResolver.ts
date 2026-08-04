/**
 * Browser-friendly virtual source resolution for MATLAB/Octave-like `.m`
 * files.
 *
 * The interpreter remains synchronous, so network-backed resolvers prefetch
 * their manifest entries and then expose a synchronous lookup interface.
 */

/**
 * Kind of MATLAB/Octave-like source requested by the interpreter.
 */
type SourceKind = 'function' | 'script' | 'class';

/**
 * Host-provided source entry.
 */
type SourceEntry = {
    /** Optional canonical function, script, or class name. */
    name?: string;
    /**
     * Optional virtual source identity used by introspection.
     *
     * Browser hosts can set this to a manifest path or URL-like name. It is
     * intentionally separate from `name`, which remains the canonical language
     * lookup symbol.
     */
    sourceName?: string;
    /** Source text containing the `.m` file contents. */
    source: string;
};

/**
 * Callback used to provide source for a canonical name.
 */
type SourceProvider = (name: string) => string | SourceEntry | undefined;

/**
 * Source table keyed by canonical name.
 */
type SourceTable = Record<string, string | SourceEntry>;

/**
 * Resolver used by the interpreter for all external `.m` source kinds.
 */
interface SourceResolver {
    /**
     * Resolve one source entry by language kind and canonical name.
     *
     * @param kind Requested source kind.
     * @param name Canonical function, script, or class name.
     * @returns Source entry, if available.
     */
    resolve(kind: SourceKind, name: string): SourceEntry | undefined;

    /**
     * Test whether a virtual source directory is known.
     *
     * Browser hosts cannot expose arbitrary filesystem traversal, but source
     * tables and prefetched manifests still define stable virtual directories
     * such as `+pkg`, `scripts`, or URL-like folders.
     *
     * @param name Directory name or package-style path.
     * @returns `true` when a known source path is contained by that directory.
     */
    hasDirectory(name: string): boolean;
}

/**
 * Per-kind source tables/providers accepted by the default resolver.
 */
type SourceResolverConfig = {
    /** Host-provided function-file source strings. */
    functionSourceTable?: SourceTable;
    /** Lazy host-provided function-file source callback. */
    functionSourceProvider?: SourceProvider;
    /** Host-provided script-file source strings. */
    scriptSourceTable?: SourceTable;
    /** Lazy host-provided script-file source callback. */
    scriptSourceProvider?: SourceProvider;
    /** Host-provided class source strings. */
    classSourceTable?: SourceTable;
    /** Lazy host-provided class source callback. */
    classSourceProvider?: SourceProvider;
};

/**
 * Manifest entry describing one fetchable `.m` source file.
 */
type MFileManifestEntry =
    | string
    | {
          /** Path relative to the resolver base URL. */
          path: string;
          /** Optional canonical function, script, or class name. */
          name?: string;
          /** Optional virtual `.m` identity used for lookup metadata. */
          sourceName?: string;
          /** Optional language kind. When omitted, the source is indexed for all kinds. */
          kind?: SourceKind;
      };

/**
 * Manifest accepted by the fetch-backed resolver factory.
 */
type MFileManifest = {
    /** Base URL used for relative manifest paths. */
    baseUrl?: string;
    /** Fetchable `.m` file entries. */
    files: MFileManifestEntry[];
};

/**
 * Minimal fetch function shape used to keep this module independent from DOM
 * lib declarations in Node-oriented type builds.
 */
type SourceFetch = (input: string) => Promise<{ ok?: boolean; status?: number; statusText?: string; text(): Promise<string> }>;

/**
 * Normalize source table/provider outputs into a stable entry.
 */
const normalizeEntry = (name: string, entry: string | SourceEntry | undefined, sourceName?: string): SourceEntry | undefined => {
    if (typeof entry === 'undefined') {
        return undefined;
    }
    return typeof entry === 'string' ? { name, sourceName, source: entry } : { name: entry.name ?? name, sourceName: entry.sourceName ?? sourceName, source: entry.source };
};

/**
 * Return a virtual source identity for table/provider keys that look like `.m`
 * paths rather than canonical language names.
 */
const sourceNameFromKey = (key: string): string | undefined => (/[\\/]/.test(key) || /\.m(?:[?#].*)?$/i.test(key) ? key.replace(/\\/g, '/') : undefined);

/**
 * Normalize source paths for lookup while preserving full `sourceName` metadata
 * elsewhere for `mfilename("fullpath")` and stack introspection.
 */
const sourceLookupPath = (name: string): string => name.replace(/\\/g, '/').split(/[?#]/, 1)[0];

/**
 * Remove a trailing `.m` suffix and browser/path prefixes from script names.
 */
const normalizeScriptName = (name: string): string => sourceLookupPath(name).split('/').pop()?.replace(/\.m$/i, '') ?? name;

/**
 * Normalize MATLAB package/class folder syntax to canonical dotted names.
 *
 * Ordinary folders are path containers and are ignored. Only `+pkg` package
 * folders and `@Class` class folders contribute namespace parts, followed by
 * the final function/method filename when it is not the class constructor file.
 */
const canonicalNameFromPath = (path: string): string => {
    const normalized = sourceLookupPath(path).replace(/^\.\//, '').replace(/\.m$/i, '');
    const parts = normalized.split('/').filter(Boolean);
    const canonical: string[] = [];
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith('+')) {
            canonical.push(part.slice(1));
        } else if (part.startsWith('@')) {
            const className = part.slice(1);
            canonical.push(className);
            if (i === parts.length - 2 && parts[i + 1] === className) {
                i++;
            }
        } else if (i === parts.length - 1) {
            canonical.push(part);
        }
    }
    return canonical.join('.');
};

/**
 * Normalize a virtual directory path for prefix matching.
 */
const virtualDirectoryPath = (name: string): string => sourceLookupPath(name).replace(/^\.\//, '').replace(/\/+$/g, '');

/**
 * Candidate virtual directory spellings for a MATLAB/Octave directory query.
 */
const virtualDirectoryCandidates = (name: string): string[] => {
    const normalized = virtualDirectoryPath(name);
    const candidates = [normalized];
    if (!/[\\/]/.test(normalized) && !normalized.startsWith('+') && !normalized.startsWith('@')) {
        const packagePath = normalized
            .split('.')
            .filter(Boolean)
            .map((part) => `+${part}`)
            .join('/');
        if (packagePath) {
            candidates.push(packagePath);
        }
    }
    return [...new Set(candidates)];
};

/**
 * Approximate a source path from a canonical dotted language name.
 */
const sourcePathFromCanonicalName = (name: string): string | undefined => {
    if (!name.includes('.') || /[\\/]/.test(name)) {
        return undefined;
    }
    const parts = name.split('.').filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) {
        return undefined;
    }
    return `${parts.map((part) => `+${part}`).join('/')}/${fileName}.m`;
};

/**
 * Source-like path candidates exposed by one table entry.
 */
const sourcePathCandidates = (key: string, entry: string | SourceEntry): string[] => {
    const candidates = [key];
    const keyCanonicalPath = sourcePathFromCanonicalName(key);
    if (keyCanonicalPath) {
        candidates.push(keyCanonicalPath);
    }
    if (typeof entry !== 'string') {
        if (entry.name) {
            candidates.push(entry.name);
            const namedPath = sourcePathFromCanonicalName(entry.name);
            if (namedPath) {
                candidates.push(namedPath);
            }
        }
        if (entry.sourceName) {
            candidates.push(entry.sourceName);
        }
    }
    return candidates.map(virtualDirectoryPath);
};

/**
 * Test directory membership against one or more virtual source tables.
 */
const sourceTablesHaveDirectory = (name: string, tables: (SourceTable | undefined)[]): boolean => {
    const directories = virtualDirectoryCandidates(name);
    return tables.some((table) =>
        Boolean(
            table &&
            Object.entries(table).some(([key, entry]) =>
                sourcePathCandidates(key, entry).some((path) => directories.some((directory) => path !== directory && path.startsWith(`${directory}/`))),
            ),
        ),
    );
};

/**
 * Candidate table/provider keys for function and class sources.
 */
const canonicalSourceNameCandidates = (name: string): string[] => {
    const canonical = canonicalNameFromPath(name);
    return [...new Set([name, canonical])];
};

/**
 * Candidate table/provider keys for script sources.
 */
const scriptSourceNameCandidates = (name: string): string[] => {
    const canonical = canonicalNameFromPath(name);
    return [...new Set([name, normalizeScriptName(name), canonical, normalizeScriptName(canonical)])];
};

/**
 * Resolve a source entry from a table/provider using normalized candidates.
 */
const resolveFromCandidates = (candidates: string[], table?: SourceTable, provider?: SourceProvider): SourceEntry | undefined => {
    for (const candidate of candidates) {
        const entry = table?.[candidate] ?? provider?.(candidate);
        if (typeof entry !== 'undefined') {
            return normalizeEntry(candidate, entry, sourceNameFromKey(candidate));
        }
    }
    return undefined;
};

/**
 * Resolve an already normalized manifest table by any equivalent candidate.
 */
const resolveManifestEntry = (candidates: string[], table: SourceTable): SourceEntry | undefined => {
    for (const candidate of candidates) {
        const entry = table[candidate];
        if (entry) {
            return normalizeEntry(candidate, entry);
        }
    }
    return undefined;
};

/**
 * Resolve a table entry whose key normalizes to one of the requested names.
 */
const resolveNormalizedTableEntry = (
    candidates: string[],
    table: SourceTable | undefined,
    normalize: (name: string) => string,
    entryName: (key: string) => string = (key) => key,
): SourceEntry | undefined => {
    if (!table) {
        return undefined;
    }
    const normalizedCandidates = new Set(candidates.map(normalize));
    for (const [key, entry] of Object.entries(table)) {
        if (normalizedCandidates.has(normalize(key))) {
            return normalizeEntry(entryName(key), entry, sourceNameFromKey(key));
        }
        if (typeof entry !== 'string' && entry.name && normalizedCandidates.has(normalize(entry.name))) {
            return normalizeEntry(entryName(entry.name), entry, sourceNameFromKey(entry.name));
        }
        if (typeof entry !== 'string' && entry.sourceName && normalizedCandidates.has(normalize(entry.sourceName))) {
            return normalizeEntry(entryName(entry.sourceName), entry, sourceNameFromKey(entry.sourceName));
        }
    }
    return undefined;
};

/**
 * Join a base URL and manifest path without assuming Node filesystem APIs.
 */
const joinUrl = (baseUrl: string | undefined, path: string): string => {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) {
        return path;
    }
    if (!baseUrl) {
        return path;
    }
    return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

/**
 * Default synchronous resolver that preserves the existing table/provider
 * contract while making the interpreter depend on one common source API.
 */
class TableSourceResolver implements SourceResolver {
    /**
     * Create a table/provider resolver.
     *
     * @param config Source tables and providers grouped by source kind.
     */
    private constructor(private readonly config: SourceResolverConfig) {}

    /**
     * Create a resolver from source tables and providers.
     *
     * @param config Source resolver configuration.
     * @returns Resolver instance.
     */
    public static readonly create = (config: SourceResolverConfig = {}): TableSourceResolver => new TableSourceResolver(config);

    /**
     * Resolve one source entry.
     *
     * @param kind Requested source kind.
     * @param name Canonical name.
     * @returns Source entry, if available.
     */
    public resolve(kind: SourceKind, name: string): SourceEntry | undefined {
        switch (kind) {
            case 'function': {
                const candidates = canonicalSourceNameCandidates(name);
                return (
                    resolveFromCandidates(candidates, this.config.functionSourceTable, this.config.functionSourceProvider) ??
                    resolveNormalizedTableEntry(candidates, this.config.functionSourceTable, canonicalNameFromPath, canonicalNameFromPath)
                );
            }
            case 'script':
                return (
                    resolveFromCandidates(scriptSourceNameCandidates(name), this.config.scriptSourceTable, this.config.scriptSourceProvider) ??
                    resolveNormalizedTableEntry(scriptSourceNameCandidates(name), this.config.scriptSourceTable, normalizeScriptName)
                );
            case 'class': {
                const candidates = canonicalSourceNameCandidates(name);
                return (
                    resolveFromCandidates(candidates, this.config.classSourceTable, this.config.classSourceProvider) ??
                    resolveNormalizedTableEntry(candidates, this.config.classSourceTable, canonicalNameFromPath, canonicalNameFromPath)
                );
            }
        }
    }

    /**
     * Test whether any configured source table contains a virtual directory.
     *
     * Lazy providers cannot be enumerated synchronously, so only eager table
     * entries participate in directory discovery.
     */
    public hasDirectory(name: string): boolean {
        return sourceTablesHaveDirectory(name, [this.config.functionSourceTable, this.config.scriptSourceTable, this.config.classSourceTable]);
    }
}

/**
 * In-memory resolver built from fetchable manifest entries.
 */
class ManifestSourceResolver implements SourceResolver {
    /**
     * Create a manifest-backed resolver.
     *
     * @param sources Prefetched source entries grouped by kind.
     */
    private constructor(private readonly sources: Record<SourceKind, SourceTable>) {}

    /**
     * Create a resolver from an already loaded source table.
     *
     * This is useful for tests and hosts that bundle source text eagerly. The
     * table is indexed for all source kinds because a `.m` file can represent a
     * function, script, or class until the parser inspects its contents.
     *
     * @param entries Loaded source entries keyed by canonical name.
     * @returns Resolver instance.
     */
    public static readonly fromTable = (entries: SourceTable): ManifestSourceResolver => {
        const sources: Record<SourceKind, SourceTable> = { function: Object.create(null), script: Object.create(null), class: Object.create(null) };
        for (const [key, entry] of Object.entries(entries)) {
            const sourceKeys = typeof entry === 'string' ? [key] : [key, ...(entry.sourceName ? [entry.sourceName] : []), ...(entry.name ? [entry.name] : [])];
            for (const sourceKey of sourceKeys) {
                const canonicalName = canonicalNameFromPath(sourceKey);
                const scriptName = normalizeScriptName(sourceKey);
                const virtualSourceName = sourceNameFromKey(sourceKey);
                const functionOrClassEntry = normalizeEntry(canonicalName, entry, virtualSourceName)!;
                const scriptEntry = normalizeEntry(scriptName, entry, virtualSourceName)!;
                for (const candidate of canonicalSourceNameCandidates(sourceKey)) {
                    sources.function[candidate] = functionOrClassEntry;
                    sources.class[candidate] = functionOrClassEntry;
                }
                for (const candidate of scriptSourceNameCandidates(sourceKey)) {
                    sources.script[candidate] = scriptEntry;
                }
            }
        }
        return new ManifestSourceResolver(sources);
    };

    /**
     * Load a browser manifest with `fetch` and return a synchronous resolver.
     *
     * @param manifest Manifest listing fetchable `.m` files.
     * @param fetcher Fetch implementation. Defaults to `globalThis.fetch`.
     * @returns Prefetched resolver.
     */
    public static readonly fromManifest = async (
        manifest: MFileManifest,
        fetcher: SourceFetch = (globalThis as unknown as { fetch: SourceFetch }).fetch,
    ): Promise<ManifestSourceResolver> => {
        if (!fetcher) {
            throw new Error('ManifestSourceResolver.fromManifest requires a fetch implementation.');
        }
        const sources: Record<SourceKind, SourceTable> = { function: Object.create(null), script: Object.create(null), class: Object.create(null) };
        for (const rawEntry of manifest.files) {
            const entry = typeof rawEntry === 'string' ? { path: rawEntry } : rawEntry;
            const url = joinUrl(manifest.baseUrl, entry.path);
            const response = await fetcher(url);
            if (response.ok === false) {
                throw new Error(`failed to fetch ${url}: ${response.status ?? ''} ${response.statusText ?? ''}`.trim());
            }
            const virtualSourceName = entry.sourceName ?? entry.path;
            const canonicalName = entry.name ?? canonicalNameFromPath(virtualSourceName);
            const sourceEntry: SourceEntry = { name: canonicalName, sourceName: virtualSourceName, source: await response.text() };
            const kinds: SourceKind[] = entry.kind ? [entry.kind] : ['function', 'script', 'class'];
            for (const kind of kinds) {
                const candidates =
                    kind === 'script'
                        ? [...scriptSourceNameCandidates(entry.path), ...scriptSourceNameCandidates(virtualSourceName), ...scriptSourceNameCandidates(canonicalName)]
                        : [...canonicalSourceNameCandidates(entry.path), ...canonicalSourceNameCandidates(virtualSourceName), ...canonicalSourceNameCandidates(canonicalName)];
                for (const candidate of candidates) {
                    sources[kind][candidate] = sourceEntry;
                }
                if (kind === 'script') {
                    sources.script[normalizeScriptName(canonicalName)] = sourceEntry;
                }
            }
        }
        return new ManifestSourceResolver(sources);
    };

    /**
     * Resolve one prefetched manifest entry.
     *
     * @param kind Requested source kind.
     * @param name Canonical name.
     * @returns Source entry, if available.
     */
    public resolve(kind: SourceKind, name: string): SourceEntry | undefined {
        if (kind === 'script') {
            return resolveManifestEntry(scriptSourceNameCandidates(name), this.sources.script);
        }
        return resolveManifestEntry(canonicalSourceNameCandidates(name), this.sources[kind]);
    }

    /** Test whether the prefetched manifest contains a virtual directory. */
    public hasDirectory(name: string): boolean {
        return sourceTablesHaveDirectory(name, [this.sources.function, this.sources.script, this.sources.class]);
    }
}

export type { MFileManifest, MFileManifestEntry, SourceEntry, SourceFetch, SourceKind, SourceProvider, SourceResolver, SourceResolverConfig, SourceTable };
export { ManifestSourceResolver, TableSourceResolver };
export default { ManifestSourceResolver, TableSourceResolver };
