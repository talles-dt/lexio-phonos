# Next ESLint directory glob adapter

`@next/eslint-plugin-next@16.3.8` imports `fast-glob` only in
`dist/utils/get-root-dirs.js`, calling `globSync(string, { onlyDirectories: true })`.
Its dependency chain includes `braces <=3.0.3`, affected by
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
with no patched release as checked on 2026-10-04.

The root package installs this local package under the `fast-glob` dependency
name and scopes an npm override to the Next plugin. This is a replacement,
not a patched or re-versioned copy of `fast-glob`. It uses
[tinyglobby](https://github.com/SuperchupuDev/tinyglobby) 0.2.17 and excludes
`micromatch` and `braces` from the dependency tree.

Tinyglobby is not a universal drop-in replacement: this adapter disables
implicit directory expansion, preserves absolute versus relative paths, and
removes trailing directory separators. Unsupported calls throw explicitly.
Do not reuse this adapter as a general-purpose fast-glob implementation.

`npm run test:lint-dependencies` tests the real Next root resolver with default,
absolute, relative, wildcard, brace, multiple, missing and Windows-style roots,
including nested directories and file exclusions. It also checks actual ESLint
diagnostics for page links, async client components, conditional hooks and
unused TypeScript variables. CI runs these checks and the complete npm audit.

When upgrading the Next ESLint plugin, review its imports and run these tests.
Remove the local dependency, scoped override, adapter and contract tests when
the official plugin can install without the vulnerable chain. Keep full audit
in CI and the application's lint configuration intact.
