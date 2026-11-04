@AGENTS.md

# Claude Code

`AGENTS.md` (imported above) holds the rules shared with Codex: collaboration through branches and pull requests, the project workflow and, once merged, the alpha save policy. Follow them exactly; this file only adds Claude-specific notes.

- Branches: `claude/<task>`, one per task, created from current `main` (or from the open pull request it depends on). Never push to `main`, `codex/*` or `backup/*`.
- Keep `docs/COORDINATION.md` current: add your task before editing, update its status when you open a pull request, and move it to Done after the developer merges.
- Use the GitHub MCP tools for pull requests. Pull requests target `main`; the developer merges.
- Historical builds in `public/versions/` are generated and immutable. Do not read minified snapshots to learn the architecture; use the source, catalog and manifests.
- The source is dense (many statements per line). Never reformat existing code; keep diffs minimal to avoid merge conflicts with Codex.
