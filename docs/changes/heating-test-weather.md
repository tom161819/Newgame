# Heating test: fixed weather (after 0.143.9)

## What and why
GitHub Pages publishing of 0.143.9 failed: `tests/heating.test.js` "Haulers fill woodpiles only in autumn and winter" expected `warm` but got `cold`. The scene's weather is random; with Frost a winter day burns ⌈3 × 1.5⌉ = 5 logs and the test's pile of 4 does not last.

## Files and systems
`tests/heating.test.js`: sets `s.seasons.weather='Sunny'` before the winter day, as the test above it already does.

## Implementation decisions
The game is right; only the test depended on chance. No game change, no release.

## Save/Load impact
None.

## Testing
The test 20× locally with random weather settings; npm test; the Pages workflow on GitHub.

## Notes for the next agent
Tests that run a heating day should fix `s.seasons.weather`.
