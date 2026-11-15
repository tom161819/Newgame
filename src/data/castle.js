// m-hrad-urovne (owner 15 Nov 2026): the Castle in four levels. Level 1 is built at the start (when chosen in the game
// setup) or for 40 Wood; the upgrades cost 70 Wood, 50 Stone and 100 Stone. Footprints 4 × 4, 4 × 4, 5 × 5 and 6 × 6.
// From level 2 (it has a tower) the Castle sees around itself without the King climbing it. Each level gives more hit
// points, room for residents, Safety and daily income. A Castle of an older save (no level) stays the stone keep 3 × 3
// the King can climb; it counts as level 1 and can be upgraded to level 2.
// Later the upgrades are to be tied to the kingdom's rank (Settlement → Village → Small town → Town); for now free.
export const CASTLE_LEVELS=Object.freeze({
  1:Object.freeze({size:4,cost:Object.freeze({wood:40}),hp:800,residents:0,safety:0,income:5,sight:0}),
  2:Object.freeze({size:4,cost:Object.freeze({wood:70}),hp:1100,residents:2,safety:5,income:7,sight:9}),
  3:Object.freeze({size:5,cost:Object.freeze({stone:50}),hp:1600,residents:4,safety:10,income:10,sight:11}),
  4:Object.freeze({size:6,cost:Object.freeze({stone:100}),hp:2200,residents:6,safety:15,income:14,sight:13}),
});
export const CASTLE_MAX_LEVEL=4;
export const castleLevel=building=>building?.type==='castle'?Math.min(CASTLE_MAX_LEVEL,Math.max(1,building.level??1)):0;
export const castleRules=building=>CASTLE_LEVELS[castleLevel(building)]??null;
export const CASTLE_ART=Object.freeze({"l1":{"sprite":"/assets/buildings/castle/castle-l1-0.v2.png","artSource":"art/sprites/castle/castle-l1-0.v2.json","origin":{"x":0.5,"y":0.98477},"visualHeight":194},"l2":{"sprite":"/assets/buildings/castle/castle-l2-0.v3.png","artSource":"art/sprites/castle/castle-l2-0.v3.json","origin":{"x":0.5,"y":0.98624},"visualHeight":215},"l3":{"sprite":"/assets/buildings/castle/castle-l3-0.v2.png","artSource":"art/sprites/castle/castle-l3-0.v2.json","origin":{"x":0.5,"y":0.98901},"visualHeight":270},"l4":{"sprite":"/assets/buildings/castle/castle-l4-0.v2.png","artSource":"art/sprites/castle/castle-l4-0.v2.json","origin":{"x":0.5,"y":0.98917},"visualHeight":274}});
