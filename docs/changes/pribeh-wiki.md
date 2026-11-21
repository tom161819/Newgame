# Wiki pages for the story

## What and why
The story (0.150.0–0.151.1) had no explanation in the game beyond Captain Purkart's letter. Two hand-written Wiki topics explain the rules: the orders and the trust bands, and the story as a whole (chapters, Smil, proofs, the choice of side).

## Files and systems
- `src/data/wiki.js`: topics `court` (category policy) and `story` (category events), with links.
- `src/i18n/en.js`, `cs.js`: `wiki.topic.court.*`, `wiki.topic.story.*`.

## Implementation decisions
- The numbers in the text (70, 40, 25, 10; 10 and 20 days; a quarter, a half) repeat `src/data/court.js`. If those change, change the text.

## Save/Load impact
None.

## Testing
- `npm test` (wiki: every topic has a title and a body in both languages).

## Notes for the next agent
None.
