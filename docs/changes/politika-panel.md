# Kingdom Policy: closing, analog rations, changes at once, overview, Castle click (owner point 87)

## What and why
Owner, 20 Nov 2026 (his five points 84):
1. The Kingdom Policy card should close with a right click into the game like the other panels.
2. Food rations should have a smooth slider like taxes, and the card should be clearer: the value above the slider explained in a tooltip; under the slider only what it brings a day and its Happiness +/−.
3. A change of taxes or food holds at once: no "from tomorrow" line and no Cancel button.
4. The Kingdom overview: Gold a day with the total first (highlighted), the income and expenses below, each on its line, foldable with an arrow; the same for Food and Happiness.
5. A click on the Castle opens only the window in the middle, not also the card on the right.

## Files and systems
- `src/data/policy.js` — `RATION_RANGE` (0.4–1.2 portions a day, step 0.05), `normalizeRations`, `validRations`, `rationLevel` (nearest anchor for the name and icon), `rationFoodBase` (the Food need base, linear between 30/60/80); `foodNeedTarget` takes a number; `DEFAULT_POLICY.rations` 0.8.
- `src/systems/PolicySystem.js` — `set` holds at once (no `pending`, `apply`, `cancel`); `taxDay` {sum, ms} averages the day's tax rate, and the morning taxes use it, so switching to high taxes just before dawn does not pay; the balance has no "tomorrow" figures.
- `src/systems/GameStateSerializer.js` — SAVE_VERSION 67: `policy.rations` a number, `policy.pending` gone, `policy.taxDay` checked.
- `src/systems/NeedsSystem.js` — the Food tooltip names the nearest rations level.
- `src/ui/PolicySliders.js` — one analog slider for taxes and rations; the value ("Normal · 0.80") carries a tooltip; the old tax-only slider is gone.
- `src/ui/PolicyPanel.js`, `index.html` — under the sliders "Collected a day: X Gold · Happiness ±Y" and "Eaten a day: X portions · Happiness ±Y" (rations Happiness = the Food need change × its weight); the overview as three `<details>` blocks (total in the summary, parts as rows with colours); the pending line and Cancel removed.
- `src/game/GameScene.js` — the side cards (Policy, Employments) close with a right click on the map; the Castle click no longer opens the Employments card.
- `src/i18n/en.js`, `cs.js` — new texts; rations level names without the old portion counts. `src/style.css` — the blocks.
- `scripts/policy-smoke.mjs` — follows the new behaviour.

## Implementation decisions
- Changes at once plus the averaged tax keep the old protection against dodging taxes at dawn.
- The Happiness effect of taxes still moves 5 points a day, so a quick switch cannot jump Happiness either.
- The Employments card closes on a right click too (it is the same kind of side card).

## Save/Load impact
SAVE_VERSION 66 → 67 (MINOR release). Older saves are refused as the alpha policy says; the test fixture `village-0.91.0.json.gz` is converted (rations 0.8, `taxDay` {0, 0}, no `pending`).

## Testing
`tests/policy.test.js` updated (no pending; dawn switch pays about the day's average; analog rations test); SAVE_VERSION asserts in four tests. Browser: `policy-smoke` passes; the card screenshot shows the new layout; a right click into the game closed the card.

## Notes for the next agent
The fold of an overview block is kept while the game runs (not saved).
