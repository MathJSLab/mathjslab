# Release preparation for 2.10.0

Prepared on 2026-11-02 without committing or publishing. The candidate adds
public functionality to 2.9.0, so its package and lockfile metadata use the
next minor version, 2.10.0. Dependency updates and a fresh complete validation
remain the next step before publication.

## Review and documentation

The review covered the working-tree changes, package exports and release
scripts, numeric session configuration and migration, retained execution
contracts, educational math, reproducible random streams and existing tests. No
additional behavioral change was introduced during this preparation. The
explicitly bounded capabilities in [the support matrix](capabilities.md) remain
development milestones, including general non-Hermitian eig, true sparse
storage and indivisible numerical kernels.

The package README now describes current retained execution, numeric sessions,
randomness, educational functions and the Hermitian-only eig domain. Public
runtime and execution contracts and previously undocumented declarations in the
generated reference received JSDoc. New numerical helpers received comments
about validation, state ownership and accumulation. Reference generation now
applies the repository Markdown formatter, so `npm run format` and `docs:check`
agree. The generated reference is a declaration inventory, not exhaustive
documentation of every private method. The
[2.9.0 architecture review](architecture-review.md) is historical; its test
counts do not certify this candidate.

## Organization mirror audit

All 11 mappings in `copy.repo.config.json` were compared with the sibling
`../mathjslab-github` checkout of `MathJSLab/.github`, normalizing line
endings. They match, including `resource/mathjslab/.prettierrc` and the shared
build and commit helpers. No organization-owned file needs mirroring for these
changes, and this preparation introduces no requirement to publish that
repository first. This comparison describes the local checkout; it does not
verify remote HEAD.

The new candidate, benchmark and consumer validation scripts, numerical
modules, package README and `doc` guides are package-specific. They are not
part of the organization copy map. No sibling repository was modified.

## Validation and remaining publication work

General TypeScript checking, generated-reference freshness, all 124 local
documentation links, package/lock version consistency and whitespace checks
passed. Lint completed with zero errors and 54 existing warnings, mainly unused
bindings in numerical code and an import-group warning in Interpreter. The
earlier complete candidate run at `test-results/candidate-jXBVdv/report.json`
passed before this metadata and documentation update; it is historical
evidence, not a final 2.10.0 gate.

Update dependencies, regenerate the reference with `npm run docs`, and run
`npm run test:candidate` against rebuilt 2.10.0 artifacts. The gate includes
installed Node/browser Workers and application/Markdown consumers; see
[consumer contracts](consumer-contracts.md) and
[handoff](development-handoff.md). Review consumer dependency ranges and
application tests against the exact artifact before publishing.

`package-lock.json` and `git-commit.config.json` are ignored by the existing
repository rules. Their local contents were updated as requested; changing the
tracking policy is outside this preparation. No commit, publication or
dependency update was performed.
