# Side cards: Kingdom Policy and Employments beside Population (0.37.0)

## What and why
Plan task m-leve-karty-politika-zamestnani (owner points 5 and 6, 7 Nov; after the UI Lab and the policy sliders). Next to the Population pop-out tab there are now two more cards: Kingdom Policy above it and Employments below it.

## Files and systems
- `index.html`:
  - `#policy-tab` before the Population tab and `#employment-tab` after it. Both use the `population-tab` class, so every UI style docks them on the same edge and styles them the same.
  - `#policy-card` aside (`employment-panel side-card policy-card` classes, so the UI Lab frame and colours apply).
  - The Castle's policy elements got `data-policy` roles next to their ids.
- `src/ui/PolicyPanel.js` – works on a `root` section and finds its parts by `data-policy` role, so the same code renders both places. Only the Castle copy keeps the old element ids (`#policy-tax`, …).
- `src/ui/SideCards.js`:
  - Copies the Castle's Kingdom policy section into the card (ids and `for` removed) and runs a second `PolicyPanel` on it. Both use the same `createPolicySlider` and re-render on every policy change.
  - The Employments card is the Castle's `EmploymentPanel` itself; the Castle click still opens it.
  - Only one of Policy / Population / Employments is open at a time: it wraps `PopulationSidebar.setOpen` and `EmploymentPanel.open/close`.
  - `place()` puts the Policy tab just above and the Employments tab just below the Population tab. It runs again on resize, on UI style or layout changes (an observer on the `<html>` attributes) and when the Population tab changes size.
- `src/style.css` – the card's z-index; with Population docked left, the cards open on the left too.
- i18n: `policy.card`, `employment.card`.
- Smoke `scripts/side-cards-smoke.mjs` (`--side-cards`, part of `--full`):
  - in all five styles: the order Policy, Population, Employments on one edge, and one card open at a time;
  - a tax change in the card shows in the Castle slider;
  - a priority change in the Employments card is the window's own.

  `policy-smoke.mjs` scopes its icon locators (the card has a second slider).

## Implementation decisions
- The Castle panel keeps both parts as before (Employment priorities and Kingdom policy), as the owner wanted the original places to stay. Employments is not duplicated: its card *is* that window.
- Which card is open is kept in the page only (not in a save, not in localStorage); a new page starts with all cards closed, like Population.

## Save/Load impact
None.

## Testing
`npm test`, smokes `--side-cards --policy --employment --population --ui-theme --needs`.

## Notes for the next agent
- The cards share the `population-tab` class; a style rule that targets `.population-tab` alone now also moves the two new tabs (on purpose). Use `#population-tab` for rules meant only for Population.
