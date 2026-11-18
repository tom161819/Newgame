# Fixes from the full test of battles and sieges (0.146.2)

## What and why
Owner 18 Nov 2026: "udělej celej test bitev a dobývání hradu a combatu a zjistit co funguje špatně". The test (headless battles with the test helpers, and the Test map in the browser) found four plain faults that are fixed here; the design proposals are in the project document `claude/test-bitev-0.146.md`.

1. **Soldiers stood below a fort while its defenders were inside.** An enemy within the engage radius was always the target, even with no way to him, so a siege order was never carried out, an attack order on a defender did nothing, and the automatic siege never started. Now an enemy with no way on the ground to him is "cut off": a melee soldier keeps hitting the wall he was sent at, or breaks through the enemy building most on his way (`SiegeSystem.breachTarget`); the attack order stays and he goes on through the gap. Archers wait ("Enemy out of reach").
2. **Soldiers standing after a move order hardly fought.** `Holding` skipped the soldier behaviour, so only the man being hit struck back (eight Swordsmen lost five men to eight enemy Recruits). Now a standing soldier fights like his stance says, does not follow farther than `holdLeash` (9 tiles) from his place and walks back to it. The stance Hold position still does not move.
3. **The Military Wagon stayed behind.** A Wagon that is not told to stand somewhere drives after the nearest Catapult that is down to half its Stones and out of the Wagon's reach; a siege order frees the Wagons sent along.
4. **No free place at a wall.** A soldier who could not get a place at an enemy building leaves it alone for 8 s and takes another one; the "cannot get to" message shows only for the player's own order with no ground beside the building.

## Files and systems
- `MilitarySystem`: `updateSoldier(worker,delta,{held})`, `reachable`, `cutOff`, `holding` (fight, leash, walk back; runtime fields `cutOff`, `holdAway`, `holdReturn`, `holdTries`).
- `SiegeSystem`: `breachTarget`, `breach`, `siegeOrdered`, `siegeSkip`, `SIEGE_RULES.skipFor/breachRadius`; `destroy` clears `cutOff` of everyone (the way may be open).
- `SiegeEngines.wagon`: follows a Catapult short of Stones (`WAGON_SUPPLY.followRadius`), message "Bringing Stones to the Catapult".
- `MILITARY_RULES.holdLeash`, `cutOffFor`.

## Implementation decisions
Reachability is tested on the plain map (other units aside) only after the normal route search failed, and again every 5 s. A breach keeps `huntWolfId` / `attackArea` (unlike a siege order), so the fight goes on by itself after the wall falls.

## Save/Load impact
None – only runtime fields.

## Testing
`tests/siege.test.js`: siege order with defenders inside; attack order on an enemy behind closed walls; standing soldiers fight and return, Hold position stays. `tests/siege-engines.test.js`: the Wagon follows. Headless scenarios before/after (closed fort 12 × 10, six enemy Recruits and four Archers inside, ten Swordsmen, six Archers and a Catapult): before, the melee stood 30 s until the Catapult made a hole, and with no Catapult for good; after, they hit the wall at once. Browser: the same on the Test map with a Gate.

## Notes for the next agent
Enemy soldiers walk through their own closed Gate (the animals' map treats a Gate as open) – they come out at us; ours cannot go in until it is broken. Left as it is (a sortie), see the proposals.
