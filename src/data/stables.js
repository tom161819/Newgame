// S12 phase C: Stables and horse taming. One tunable place.
export const STABLE_RULES=Object.freeze({
  horseCapacity:4,          // per Stables
  stablehandTameMs:20000,   // active work of a Stablehand, faster with Hunting skill
  kingTameMs:25000,         // riding a wild horse this long tames it
  searchRadius:30,          // tiles from the Stables a Stablehand looks for wild horses
  kingStableReach:3,        // the King dismounting this close to Stables puts a tamed horse inside
  wildHorses:6,             // wild horses at a new game
});
