# C05 — manual subject orders (#52)

Base: `57b62d676eaafae8f01de2f45c927ec5b1ea6f16` (C03). Issue52 explicitly
allows C05 alongside Claude's C04; no dependency was silently bypassed.

## Controls and ownership

- Click a visible own subject, or drag a screen-space box around several.
- Right-click terrain to move the selection to distinct nearby tiles, then hold.
- The selection bar and existing Unit Details offer Hold Here and Resume
  Previous Job. Unit Details is available from the bar and Population sidebar.
- Escape deselects without cancelling orders; with no selection, existing pause
  and panel controls keep their behaviour. The king stays outside box selection
  and retains his click-to-move, exploration, mounting and building controls.
- Selection and markers use logical/world positions, reprojected by the camera.
  Visitors, animals, dead/leaving residents and hidden units cannot be selected.

`UnitCommands` runs before the worker's normal AI. A command cancels the existing
work task through `WorkerAI.cancel`, releasing construction, farm, natural
resource, combat, stock and capacity bookings through their existing owners.
Cargo and pending rewards stay with the worker. A production cycle already paid
for remains at the building; no held worker contributes work. Employment and
free-Hauler checks exclude commanded residents. Manual job changes preserve the
command; Resume requests fresh work instead of restoring a stale task.

Hold finishes an already reserved half-step without teleporting. Movement
checks the next real physical step (including diagonal corners and unit
reservations). New unknown routes use the known map and never consult hidden
obstacles to colour a target or accept/reject it. Nearby formation slots are
chosen deterministically; departing group members are not treated as permanent
walls. Newly blocked routes are retried at most three times without progress,
one second apart, then stop with a translated message. A held unit does not
replan each frame. The last chosen goal stays as its destination marker on
arrival; an explicit Hold Here clears the old marker.

## Saves and tests

SAVE_VERSION 21 stores `{state, goal}` per worker. Moving paths and existing
half-steps use the standard actor serialization; selection is transient. Current
schema validation rejects malformed orders and commands attached to dead or
foreign workers, or workers with concurrent work tasks. Older alpha saves are
rejected through the existing incompatibility flow; no migrations were added.

`tests/unit-commands.test.js` covers arrival/hold/resume, three non-overlapping
units, pickup cancellation and loaded cargo, manual/automatic jobs, death,
exact moving/holding/cargo Save/Load and invalid input, non-revealing unknown
commands, held/commanded groups of 100, construction slot release and production
input preservation. `scripts/unit-command-smoke.mjs` drives actual mouse clicks,
box selection at two zooms, right-click Move, details buttons, Escape, holding
and Resume. It restores the original world before the other smokes run.

Final gate/PR/deployment evidence is recorded in Issue52 and the PR. A local
build or green test alone does not mean this work is merged or deployed.
