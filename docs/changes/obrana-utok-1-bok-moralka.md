# Defence and attack 1: flank attacks and morale

## What and why
Owner 20 Nov 2026: "zpracuj postupně všechny ty návrhy na obranu / útok. zatím udělej nějaký základní assety a modely
pak dodělám". This is point 1 of 7 (the list is in the project document `claude/obrana-utok-plan.md`).

## Files and systems
- `src/data/military.js`: `FLANK` (side ×1.25, rear ×1.5) and `MORALE` (all numbers below).
- `src/systems/MoraleSystem.js` (new):
  - `flankFactor` / `facingOf`: a fighter faces the one he fights (or the way he walks); the angle of the attacker
    to that facing gives front / side / rear. Standing still and not fighting he has no back.
  - `MoraleSystem`: our soldiers (profession `soldier`, Recruits included) and enemy soldiers (hostile animals that
    are not wolves). 0–100. A comrade dying within 6 tiles −14; fighting under half HP −4/s; more than twice as
    many enemies as friends within 5 tiles −3/s. A leader within 6 (our Knight or the King; the enemy Knight)
    halves the losses; Hold stance halves them too. No enemy within 6: +5/s; beside a leader +1.5/s even in a
    fight. Under 20 he is routed, from 55 he rallies (floating text "Flees!" / "Rallies").
  - `leadRouted`: a routed enemy stops fighting and runs from the nearest of ours; a marching one gets his march
    order back when he rallies.
- `src/systems/CombatSystem.js`: the damage rate is also multiplied by `this.flank(attacker, target)`.
- `src/systems/MilitarySystem.js`: a routed soldier falls back like a badly wounded one (to his comrades, the
  Barracks or the Castle) and keeps doing so until he rallies.
- `src/systems/AnimalSystem.js`: routed enemies are led by `MoraleSystem.leadRouted`.
- `src/game/GameScene.js`: creates and updates `this.morale`.
- `src/ui/CombatFeedback.js`: a thin gold morale line under the health bar once morale drops; a white flag beside
  the bar of a routed soldier. i18n: `combat.routed`, `combat.rallied`, `unit.morale`.
- `tests/morale.test.js`.

## Implementation decisions
- Morale is runtime only (not saved): after Load every soldier starts at 100. No SAVE_VERSION change.
- The flag and the morale line are drawn in code (no art needed).
- Flank damage applies to every attack, ranged too; the charge and siege damage paths are unchanged.

## Save/Load impact
None.

## Testing
- `npm test` (new `tests/morale.test.js`).
- Browser, Test map: 6 Swordsmen against 10 enemy Soldiers. The enemies broke after losing 5–6 men; the routed ones ran
  with white flags; ours kept their morale.

## Notes for the next agent
- A routed enemy that stays close to our soldiers can hover under the rally mark; if battles drag on because of it,
  let routed enemies walk back to their post after a while.
