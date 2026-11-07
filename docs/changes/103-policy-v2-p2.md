# Policy v2 P2: rations through the Food need, situation penalties (7 Nov 2026)

## What and why
Plan item `m-politika-v2-p2` (`zadani-politika-v2.md` part P2). Rations used to give a fixed Happiness bonus or penalty (Small −15, Generous +10) without touching hunger, and no penalty depended on the resident's situation.

## Files and systems
- `src/data/policy.js`:
  - `RATIONS` gains `foodCap`: Small 60, Normal 100, Generous 100.
  - The rations' Happiness is now 0 / 0 / **+5** ("well fed", Generous only). It is part of the policy target, so it moves 5 points a day like the tax effect (P1).
  - `POLICY_RULES.context`: taxed but unpaid 10, promised food missing 10, taxes while hungry 5 (at High and Very high taxes).
- `src/systems/NeedsSystem.js`:
  - **Food cap.** A fed resident's Food need rises only to the cap. Above the cap it falls back at the hunger rate (50 a day); hungry residents decline as before.
  - **Situation penalties.** `status()` adds the penalties from `policy.contextPenalties()` at once (not gradually) and returns them as `policyContext`, together with `foodCap`.
  - **Main problem.** `mainProblem` can now name `policy` when the policy (its negative effect plus the situation penalties) is the biggest loss.
- `src/systems/PolicySystem.js`: `foodCap()` and `contextPenalties(worker,{hungry})`. The three penalties are:
  1. **Taxed but unpaid:** taxes above None while the resident has unpaid wages: −10, on top of the existing unpaid-wage penalty.
  2. **Promised food that isn't there:** Generous rations, but the resident's last meal failed: −10, and the well-fed bonus does not count (−15 in total while the full bonus is in effect).
  3. **Taxes while hungry:** the Food need is below 20 and taxes are High or Very high: −5.
- `src/ui/NeedsDisplay.js` and `PolicyPanel.js`:
  - Every situation penalty gets its own line with its reason.
  - The Food tooltip says "Capped at 60 by Small rations."
  - The rations line shows the cap.
- i18n en/cs.
- Save: `SAVE_VERSION` 46, because the range of the saved policy effect changed with the new rations values.
- Tests: `tests/policy.test.js` (a new P2 test; the P1 numbers were updated).
- Smoke: `--policy` checks the cap of 60 under Small rations.

## Implementation decisions
- **Small rations cost about as much as before.** A fed resident under Small rations sits at Food 60, which is 0.35 × 40 = 14 Happiness below Normal (the brief asked for about the old −15). The test checks the 14.
- **"Did not get food" uses the existing meal record.** It is the FoodSystem's `hungry` flag of the resident's last meal, so nothing new is saved.
- **Strikes are unchanged.** Strikes and emigration (0.13.0) read the same Happiness, so their tests stay valid.

## Save/Load impact
`SAVE_VERSION` 46. Nothing new is stored, but the range of the saved policy effect changed (−20 … +15). Saves from 0.17.0 cannot be loaded.

## Testing
- `npm test` passes: 871 tests.
- Smokes pass: `--policy` and `--needs`.

## Notes for the next agent
- P3 (meal variety and the Feast) adds its bonuses outside `policy.effect` (immediate, like the situation penalties) or as new `contextPenalties`-style entries with positive values.
