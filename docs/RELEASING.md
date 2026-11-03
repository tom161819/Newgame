# Versioning and release workflow

`package.json.version` is the only authored source of the current game version. `CHANGELOG.md` is the only authored release history. The first baseline keeps the existing alpha version and records actual implemented behaviour on its real publication date. Historical Git builds retain their original commit identities; no fictional semantic versions are assigned to them.

## During development

Add a concise English, player-facing bullet under `## [Unreleased]` after completing and verifying a change. Use Added, Changed, Improved, Fixed, Balance or Removed, and omit categories with no entries. Describe what a player can do or what was fixed; do not record plans as completed work. Keep the package version unchanged until a numbered release is requested. Ordinary commits and queue deployments are not automatic numbered releases.

Unreleased does not appear in the game. `AGENTS.md` gives Codex the same rules. Game versioning is independent of the numeric Save Schema Version in GameStateSerializer; never change the latter just to release a feature.

## Prepare a numbered release

Only when a developer requests a release:

```bash
npm run release:prepare -- minor
npm run changelog:validate
npm test
npm run build -- --base=/Newgame/
git diff
```

Choose `major`, `minor` or `patch` explicitly. During alpha, normal new game features use minor and fixes use patch; the deliberate transition to the first stable release uses major. The script moves completed Unreleased entries into a new dated release, creates a fresh empty Unreleased section and updates package.json plus both root version fields in package-lock.json. Dependency versions remain unchanged. Empty or invalid releases are rejected before writing. The default date uses Europe/Prague (or TZ when provided); `--date YYYY-MM-DD` can set the actual release day explicitly.

Review and commit the prepared files, then create the matching annotated `vMAJOR.MINOR.PATCH` tag on that release commit. The preparation command prints the exact version. It never commits, creates tags, pushes or publishes. Push a release commit/tag or create a public GitHub Release only under the developer's explicit release instructions. The user's standing queue instruction separately authorizes normal verified commits and main-branch Pages deployments.

## Generated player data and cache

The Vite plugin in `vite.config.js` invokes `scripts/changelog-lib.mjs` to generate the `virtual:game-release` module directly from package.json and CHANGELOG.md. It contains the current version and released entries only. There is no second hand-maintained JSON file and no runtime API, database or fetch for release history. Development watches the source files and reloads the generated module; the production build validates them before bundling.

Generated version and history are embedded in the same content-hashed JavaScript bundle. Updating either changes its asset URL, so a new page load cannot mix the current menu version with an independently cached old changelog. No service worker caches an older release. Pages base URLs and historical archive prefixes continue to work.

Validation rejects malformed versions, package/lock/history mismatches, duplicates, invalid calendar dates, unsorted releases and empty released entries. `npm run changelog:validate` is an explicit check; every Vite build also performs it. `npm test` covers parsing, numeric SemVer, NEW tracking and the actual local release CLI, including failure without file changes.
