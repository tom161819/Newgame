@AGENTS.md

# Claude Code

`AGENTS.md` (imported above) holds the rules shared with Codex: collaboration through branches and pull requests, the project workflow and, once merged, the alpha save policy. Follow them exactly; this file only adds Claude-specific notes.

- Branches: `claude/<task>`, one per task, created from current `main` (or from the open pull request it depends on). Never push commits directly to `main`, and never push to `codex/*` or `backup/*`.
- Keep `docs/COORDINATION.md` current: add your task before editing, update its status when you open a pull request, and move it to Done after the merge.
- Use the GitHub MCP tools for pull requests. Pull requests target `main`; merge your own verified pull request with a merge commit (rule 3 in AGENTS.md) and confirm the GitHub Pages run succeeded.
- Historical builds in `public/versions/` are generated and immutable. Do not read minified snapshots to learn the architecture; use the source, catalog and manifests.
- The source is dense (many statements per line). Never reformat existing code; keep diffs minimal to avoid merge conflicts with Codex.
- Versions and releases follow *Versions, releases and change records* in AGENTS.md (#174): a game change ships as the next PATCH (MINOR for a new `SAVE_VERSION`) through `npm run release:prepare`, every pull request outside `docs/` adds `docs/changes/<issue>-<slug>.md`, run `npm run version:check` before opening the PR, and confirm that the tag-release workflow tagged `v<version>` after the merge.
