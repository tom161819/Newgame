# build:artifact – the game as a page in Claude

## What and why
GitHub Pages is unavailable while the account is suspended. The playable game is now published as a page in Claude ("Medieval Kingdom 0.8.1", slug `9a0bd808-d4cb-4fde-ae38-f65e92f8067e`). The first build used a wrapper config outside the repository. This makes it permanent as `npm run build:artifact`.

## Files and systems
- `scripts/artifact.vite.config.mjs`: wraps `vite.config.js` with `base: './'`, `outDir: dist-artifact/` and `emptyOutDir`. The `game-release-data` plugin's `configResolved` is shown `base: '/'`, because `projectBase()` in `scripts/archive-lib.mjs` only accepts absolute bases for the version catalog.
- `package.json`: script `build:artifact`. `.gitignore`: `dist-artifact/`.
- `tests/artifact-build.test.js`: checks the wrapped config.

## Implementation decisions
- `vite.config.js` and `projectBase()` are not changed: Pages builds (`build:pages`) and archive verification keep their absolute-base rules.
- The historical version archive is not part of the page (2,741 files, 119 MiB). "Older versions" still shows the catalog, but archived builds cannot be started from the page.

## Save/Load impact
None.

## Testing
- `npm test` passes, including the new test.
- `npm run build:artifact` gives 282 files with relative URLs. The same output served from a nested path loaded and started a new game in headless Chrome on 6 Nov (0.8.1).

## Notes for the next agent
Publishing: the build has about 277 files without `.gitkeep`, and `publish_files` takes at most 256 per call. Publish in batches (`index.html` first, then patch mode) to the same slug. With a new build, use mode `replace` in the last call, or `remove`, so old hashed bundles do not pile up.
