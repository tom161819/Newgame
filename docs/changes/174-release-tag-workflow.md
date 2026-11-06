# #174 – Release tags are created by GitHub Actions

## What and why
Under #174 every release is tagged `v<version>`. The agents' cloud sessions can push branches but not tags: the push of `v0.4.0` for the M3 release was cut off by the Git proxy, and the GitHub MCP tools cannot create refs. A small workflow now creates the tag on GitHub's side after each push to `main`.

## Files and systems
- `.github/workflows/tag-release.yml`: on push to `main` (and manually), `contents: write`. It runs `scripts/release-tag.mjs`, then creates an annotated tag and pushes it with the workflow token.
- `scripts/release-tag-lib.mjs` `releaseTagTarget()`: picks the first commit on main's first-parent history that carries the current version. `scripts/release-tag.mjs` prints `<tag> <commit>`, or nothing when the tag exists.
- `AGENTS.md` rule 9 of *Versions, releases and change records*; `CLAUDE.md`.

## Implementation decisions
- The tag points at the merge commit of the release PR (the first main commit with the new version), not at later docs-only merges, so it is deterministic whenever the workflow runs.
- An existing tag is never moved or recreated. The workflow only adds missing tags, so historical tags stay immutable.
- For M3 this tags `375f1aa` (merge of PR187, whose content is the gated source `d5e9931` plus the release files). The `0.4.0` archive snapshot is built from that commit.

## Save/Load impact
None.

## Testing
- `tests/release-tag.test.js`: first commit of a version, a new patch release, empty history and an invalid version.
- Dry run on `main` after removing an unpushed local tag: `v0.4.0 375f1aa83b97e6ab8661a14b1a4c7fa1fa365011`.
- `npm test`, `npm run version:check`.

## Notes for the next agent
- After this merges, check the *Tag released version* run and `git ls-remote origin refs/tags/v0.4.0`.
- Then build the archive with `npm run archive:build -- --through=375f1aa83b97e6ab8661a14b1a4c7fa1fa365011 --base=/Newgame/` and open the archive PR.
