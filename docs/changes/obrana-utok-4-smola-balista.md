# Defence and attack 4: boiling pitch and the Tower ballista

## What and why
Owner 20 Nov 2026: "zpracuj postupně všechny ty návrhy na obranu / útok. zatím udělej nějaký základní assety a modely
pak dodělám". Point 4 of the list in `claude/obrana-utok-plan.md`.

## Files and systems
- `src/data/military.js`: `BOILING_PITCH` (45, every 12 s, 1 Pitch; Gates and Towers) and `BALLISTA` (14 tiles, every
  6 s, 60, half the armour ignored; 20 Wood + 4 Iron).
- `src/systems/FortDefenses.js` (new), updated every frame from `GameScene`:
  - a finished Gate or Tower of ours with one of ours up on it (`onWall`) pours pitch on every enemy touching its
    footprint (`applyEffectiveDamage`, armour does not help) for one Pitch from the stores (ledger source
    "Boiling Pitch"); without Pitch the event feed says so once;
  - a Tower with `ballista` shoots the nearest enemy within 14 tiles – rams first, riders next.
  - Effects drawn in code: the pour, a black splash and steam; the bolt flying from the platform.
  - `mount(tower)`: pays `BALLISTA.cost` (free on the Test map) and sets `tower.ballista = true`.
- `src/ui/DemolitionUI.js`: the Tower's window offers "Mount a ballista (cost)" with a note.
- Save: `ballista: true` on a Tower (optional field; validated: only on a Tower).
- i18n `defense.*`; tests `tests/fort-defenses.test.js`.

## Implementation decisions
- No new art: the ballista is not drawn on the Tower yet (only its bolts) – provisional until the owner's model.
- Pitch is the Pitch Kiln's product, so the kiln now matters for defence too.

## Save/Load impact
Optional `ballista` on Tower records; older saves load unchanged. SAVE_VERSION unchanged (67).

## Testing
- `npm test` (new `tests/fort-defenses.test.js`).
- Browser, Test map: a Tower with the ballista bought in its window, an Archer posted on it, 3 enemy Recruits at its
  foot and an enemy ram 9 tiles away: one pot of pitch (Pitch 5 → 4), the Recruits fell, the ballista fired.

## Notes for the next agent
- Gates have no window action; boiling pitch works on them without one.
