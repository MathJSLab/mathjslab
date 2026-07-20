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
const normalizeEntry = (name: string, entry: string | SourceEntry | undefined): SourceEntry | undefined => {
    if (typeof entry === 'undefined') {
        return undefined;
    }
    return typeof entry === 'string' ? { name, source: entry } : { name: entry.name ?? name, source: entry.source };
};

/**
 * Remove a trailing `.m` suffix and browser/path prefixes from script names.
 */
const normalizeScriptName = (name: string): string => name.replace(/\\/g, '/').split('/').pop()?.replace(/\.m$/i, '') ?? name;

/**
 * Normalize MATLAB package/class folder syntax to canonical dotted names.
 *
 * Ordinary folders are path containers and are ignored. Only `+pkg` package
 * folders and `@Class` class folders contribute namespace parts, followed by
 * the final function/method filename when it is not the class constructor file.
 */
const canonicalNameFromPath = (path: string): string => {
    const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\.m$/i, '');
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
            return normalizeEntry(entryName(key), entry);
        }
    }
    return undefined;
};

/**
 * Join a base URL and manifest path without assuming Node filesystem APIs.
 */
const joinUrl = (baseUrl: string | undefined, path: string): string => {
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
        for (const [name, entry] of Object.entries(entries)) {
            for (const candidate of canonicalSourceNameCandidates(name)) {
                sources.function[candidate] = entry;
                sources.class[candidate] = entry;
            }
            for (const candidate of scriptSourceNameCandidates(name)) {
                sources.script[candidate] = entry;
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
            const canonicalName = entry.name ?? canonicalNameFromPath(entry.path);
            const sourceEntry: SourceEntry = { name: canonicalName, source: await response.text() };
            const kinds: SourceKind[] = entry.kind ? [entry.kind] : ['function', 'script', 'class'];
            for (const kind of kinds) {
                const candidates =
                    kind === 'script'
                        ? [...scriptSourceNameCandidates(entry.path), ...scriptSourceNameCandidates(canonicalName)]
                        : [...canonicalSourceNameCandidates(entry.path), ...canonicalSourceNameCandidates(canonicalName)];
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
            return normalizeEntry(normalizeScriptName(name), this.sources.script[name] ?? this.sources.script[normalizeScriptName(name)]);
        }
        return normalizeEntry(name, this.sources[kind][name]);
    }
}

export type { MFileManifest, MFileManifestEntry, SourceEntry, SourceFetch, SourceKind, SourceProvider, SourceResolver, SourceResolverConfig, SourceTable };
export { ManifestSourceResolver, TableSourceResolver };
export default { ManifestSourceResolver, TableSourceResolver };
