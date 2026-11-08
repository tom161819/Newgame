// E3 tutorial (plan m-e3-tutorial-sipka, report 0.48.0): one step at a time with a bubble and an arrow. A step is done by
// the state of the world, never by a click, so any way of doing it counts and a loaded game resumes at the right step.
// `planned` = a building of the type exists (blueprint, site or finished); `built` = one is finished; `job` = a resident
// has the profession. m-tutorial-v2 (0.50 playtest, points 1–9): a Hauler right after the Builder, the Hunting Lodge is
// the first food, then four optional food-chain steps (info + arrow, "Next" or building it moves on), the Miner after
// marking a rock. Optional steps are also done once the world has passed them (a later mandatory step is done), so a
// loaded game never falls back to them. The mandatory path is paid by the New Game start (NEW_GAME_DEFAULTS, test).
export const TUTORIAL_STEPS=Object.freeze([
  {id:'king',check:'seen',target:'king'},
  {id:'builder',check:'job',job:'builder'},
  {id:'hauler',check:'job',job:'hauler'},
  {id:'granary',check:'planned',buildingIds:['granary']},
  // m-drevo-start (playtest 0.76.0 #2): the Lumberjack Hut right after the Granary, so wood comes in from day 1.
  {id:'lumberjack_hut',check:'planned',buildingIds:['lumberjack_hut']},
  {id:'hunting_lodge',check:'planned',buildingIds:['hunting_lodge']},
  {id:'fisherman',check:'planned',optional:true,buildingIds:['fisherman_hut']},
  {id:'farm',check:'planned',optional:true,buildingIds:['farmhouse']},
  {id:'mill',check:'planned',optional:true,buildingIds:['mill']},
  {id:'bakery',check:'planned',optional:true,buildingIds:['bakery']},
  {id:'stone',check:'stone',target:'#mark-rocks',buildingIds:['quarry']},
  {id:'miner',check:'job',job:'miner'},
  {id:'house',check:'built',buildingIds:['house']},
  {id:'storage',check:'planned',buildingIds:['material_yard','builder_workshop']},
  {id:'speed',check:'speed',target:'#speed-controls [data-speed="2"]'},
].map(step=>Object.freeze(step)));
// The buildings the mandatory steps ask for: the New Game start must pay all of them (tests/tutorial.test.js).
export const TUTORIAL_PATH_BUILDINGS=Object.freeze(['granary','hunting_lodge','lumberjack_hut','house','material_yard','builder_workshop']);
// The king step ends by itself after this many real milliseconds (or "Next").
export const TUTORIAL_KING_MS=6000;
