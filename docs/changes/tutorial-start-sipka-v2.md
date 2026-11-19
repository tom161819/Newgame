# Start guide: bigger arrow, glowing target, bigger bubble

## What and why
Owner 19 Nov 2026 (screenshot of step 1, the Wiki): the arrow was hidden in the light top bar next to the button, and the bubble sat in the top bar too. He asked for a bigger, more visible arrow, the place it points at lit with a colour that blinks together with the arrow, and the text more in sight.

## What changed
- **Big arrow** (the two start-guide steps, `.tutorial-arrow.big`): 120 × 76 px (was 84 × 54), a gold SVG arrow with a light halo and a dark outline, so it reads on the light top bar and on the dark map alike; same look in every pointer theme.
- **Glowing box** `#tutorial-spot` over the target (Wiki button, Getting started header): gold border, gold see-through fill and glow; `pointer-events:none`, the button stays clickable.
- **Blink together**: arrow and box use the same animation `tutorial-blink` (1.2 s, `BLINK_MS`); `syncBlink` gives both the same phase of the page clock whenever one appears.
- **Bubble** (`.tutorial-bubble.big`): 380 px wide, text 18 px semi-bold, bigger buttons, gold glow. It is placed like a tip: kept out of the top bar and the HUD, so it sits in the open map beside the arrow.
- Later tutorial steps and tips are unchanged.

## Files and systems
`src/ui/TutorialGuide.js`, `src/style.css`; test `tests/tutorial-start-arrow.test.js`.

## Implementation decisions
- A separate overlay box instead of restyling the target: it works for any element (button, panel header) without touching its own styles.
- Phase sync by negative `animation-delay` from `document.timeline.currentTime`, so the two never drift even when they appear at different moments.
- `prefers-reduced-motion`: no blinking.

## Save/Load impact
None – UI only, SAVE_VERSION unchanged.

## Testing
- `tests/tutorial-start-arrow.test.js` (same period for arrow and box, box never takes clicks, arrow size).
- Headless Chrome screenshots of both steps (1870 × 820): arrow under the Wiki button pointing up, Wiki lit; step 2 arrow at the Getting started header, header lit; bubble left of the panel below the top bar.
- `npm test`, `npm run build`.

## Notes for the next agent
- On the Wiki step the big arrow slightly covers the top right corner of the Getting started panel (there is no other free side next to the button); the bubble stays clear.
