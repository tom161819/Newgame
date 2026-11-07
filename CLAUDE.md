@AGENTS.md

# Claude

`AGENTS.md` (imported above) holds the rules for every Claude chat working without GitHub: the shared store instead of a remote, the plan page instead of Issues, releases, change records and the alpha save policy. This file only adds Claude-specific notes.

- The owner writes in Czech; answer in Czech. Game UI texts are English with a Czech translation (`src/i18n/`).
- Start of a chat: pull the store, `npm ci`, `npm test`, read the plan page and pick your area's next task (priority, then order). After a release or a finished task start the next one; if blocked, record why on the task (`ceka` + comment) and take another.
- Keep `docs/COORDINATION.md` short: who works on what now and a dated Done line per release.
- Historical builds in `public/versions/` are generated and immutable. Do not read minified snapshots to learn the architecture; use the source, catalog and manifests.
- The source is dense (many statements per line). Never reformat existing code; keep diffs minimal so chats merge cleanly.
- Versions and releases follow *Versions, releases and change records* in AGENTS.md: a game change ships as the next PATCH (MINOR for a new `SAVE_VERSION`) through `npm run release:prepare`, every commit outside `docs/` adds `docs/changes/<slug>.md` with a "Notes for the next agent" section, and `npm run version:check -- --base=HEAD^1` passes before the commit is pushed.
