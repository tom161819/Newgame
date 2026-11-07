# Employment: emptiest buildings first, auto-assignment after a profession change, candidate order (0.30.0)

## What and why
Plan task m-zamestnavani-rozdeleni (owner points 10, 16, 17, 7 Nov). At the start of a game all new residents often went to one building (e.g. the Quarry) while food was needed too.

## Files and systems
- `src/systems/EmploymentSystem.js` – within one priority, the pairing key now starts with the building's current staff (fewer first), then the old strength rule (talent, skill level, XP, overall level) and building id. Staff count is re-read after each hire, so two buildings of the same priority fill in turns. Higher priorities still go first, and employed residents are never moved.
- `src/systems/WorkplaceSystem.js` – `assignFree(worker)` takes a free seat of the worker's profession: the emptiest building, then the nearest by straight distance, then id, and only reachable ones. `hasWorkplaces(profession)`.
- `src/ui/UnitPanel.js` – after a manual profession change it calls `assignFree`; the Workplace line says "No free workplace" for a profession that has buildings but no seat.
- `src/ui/workplaceCandidates.js` / `WorkplacePanel.js` – groups `profession` (this profession, no workplace) → `free` (no workplace, other or no profession) → `employed` (working in any building). Each group keeps the skill sort. Headings name the profession.
- `src/style.css` – partly staffed indicator yellow (`#d2a619`, dark icon), empty stays red; the highlighted candidate group is now `profession`.
- i18n en/cs: `workplace.group.profession|free|employed`, `unit.noFreeWorkplace`.
- Tests: `tests/auto-employment.test.js` (+2: fill in turns, priority wins, nobody moved; manual change → emptiest/nearest, none free → stays, Haulers untouched), `tests/workplace-candidates.test.js` (new groups). Smokes: new `scripts/employment-spread-smoke.mjs` (`--employment-spread`), `staffing-smoke.mjs` updated for the new group names.

## Implementation decisions
- "Nearest" for the manual change is the straight distance to the building centre, and each candidate must be reachable. A full path search for every building would be wasteful for a one-off click.
- The emptiest rule compares absolute staff counts, as the owner described (0 before 1, 1 before 2), not fill ratios. So a 2-seat lodge and a 3-seat quarry alternate.
- A same-profession worker in another building counts as "working in another building" (last group), so the top of the list is always people who can be taken without leaving another building short.

## Save/Load impact
None.

## Testing
`npm test` (942), smokes `--employment-spread --staffing --employment --castle-gathering`.

## Notes for the next agent
- The owner mentioned the icon "in the list" too; the Employments window has no per-building staffing icon today, so only the map indicator changed colour.
