# Playable version archives

`CHANGELOG.md` is the only authored player history. Its source-verified metadata and real Git commits generate the menu, Changelog, static index and catalog. `public/versions/versions.json` is derived snapshot metadata, not a second hand-maintained history.

Official game numbers come only from package.json. Reconstructed historical milestones use explicit `+archive.N` labels and preserve original package numbers. Technical builds use `+git.FULL_SHA`; this does not turn every commit into an official release. Their titles come from actual Git subjects. Existing canonical `/Newgame/versions/FULL_SHA/` URLs and save namespaces are immutable.

## Ordinary development

- `npm test` discovers tests only under tests/, without walking generated historical games.
- `npm run build -- --base=/Newgame/` builds the current application, current graphics and small version metadata/index. It neither discovers nor copies historical bundles through Vite's public directory. The full catalog is fetched by the client only on an explicit Archive opening; technical rows exist only while expanded.
- `npm run dev -- --base=/Newgame/` still serves the original public archive paths. Snapshot directories are excluded from watching and normal ripgrep searches. Inspect metadata explicitly or use original Git source when working on history.
- `npm run preview -- --base=/Newgame/` automatically composes the existing immutable archives before serving the production output. Preview composition never changes the originals.

## Complete publication

`npm run build:pages` builds the current application and then composes the full archive. The equivalent separate commands are build and `npm run archive:stage`. Staging uses independent copy-on-write copies when supported and safe ordinary copies otherwise; it deliberately avoids hard links so a generated-preview edit cannot damage an original snapshot. Conflicting destination snapshots are rejected, never replaced.

GitHub Pages replaces the site with each deployment. Its final upload must therefore still contain the unchanged historical files to preserve every old URL. This remaining artifact transfer is required by the hosting model. Moving that transfer to another storage service would require a separately proven migration and is not part of this non-destructive optimization. Existing source-history objects remain in Git; no history rewriting or archive deletion is used to claim a smaller clone.

The workflow keeps full SHA-256 integrity validation: measured about0.7–0.9 seconds for65 snapshots, cheaper and safer than introducing a remote verification cache. Ordinary unrelated changes run the current-game browser smoke without opening historical games. Archive/tooling/history changes run archive UI and genuine old-save checks; gameplay, persistence or release changes run full integration. Milestone release gates always run all checks, staged artifact/HTTP verification and full browser integration.

## Creating snapshots

Use `npm run archive:build -- --through=FULL_SOURCE_SHA --commit=ANOTHER_SOURCE_SHA --base=/Newgame/`. Both `--option=value` and separate argument forms are supported; unknown/missing options fail. The default selects real historical milestones, tags and the requested source. It avoids unrelated documentation checkpoints. `--all-commits` explicitly requests every commit in the selected history. Existing snapshots outside that selected range remain preserved.

The source exporter selects the actual commit's code, metadata and current assets **before** creating a tar, excluding nested playable archives. It supplies only thin original snapshot metadata and proven package versions to the exported build. Each new snapshot runs its own tests, production build and real Chromium launch, then receives the same commit-based save-isolation wrapper and SHA-256 manifest. No snapshot is built from uncommitted current code under an older label.

## Verification

- `npm run changelog:validate` and `npm run versions:validate`: real versions, original package numbers, dates, source evidence and no fake Play actions. Git provenance uses bounded batch queries rather than hundreds of subprocesses.
- `npm run archive:verify`: all source snapshots match manifests and existing Git snapshot paths were not edited or deleted.
- `npm run archive:verify-site`: every composed snapshot equals its original; all canonical directory URLs and manifest files return HTTP200 with original bytes and expected MIME through the local production server.
- `npm run smoke -- --base=/Newgame/ --current-only`: ordinary game start, movement, collection/delivery, exact IndexedDB restore and zero historical/catalog requests.
- `npm run smoke -- --base=/Newgame/`: linked archive/Changelog, expandable numbered snapshots, mobile UI, actual original games, isolated databases/settings, genuine old-save migrations and a delayed archive request canceled by game start.
- `npm run smoke -- --base=/Newgame/ --full`: additional live seasons and full physical construction/cancellation. Required at M1–M5 gates.

The public Pages domain is restricted from this execution environment. Local production HTTP checks and the actual successful GitHub Pages run are separate evidence; do not claim a direct public-domain request which did not occur.

Release proof reads the public GitHub Actions run with curl so the managed runtime HTTPS proxy/CA settings are honored. Raw Node fetch can fail DNS in that environment; do not bypass its network policy or claim unverified public access.
