// E3 tutorial (plan m-e3-tutorial-sipka, report 0.48.0): one step at a time with a bubble and an arrow. A step is done by
// the state of the world, never by a click, so any way of doing it counts and a loaded game resumes at the right step.
// `planned` = a building of the type exists (blueprint, site or finished); `built` = one is finished.
// Order fits the starting stores after E1 (60 Wood): Granary 12, Farmhouse 10, Hunting Lodge 8, Lumberjack Hut 6.
export const TUTORIAL_STEPS=Object.freeze([
  {id:'king',check:'seen',target:'king'},
  {id:'builder',check:'builder',target:'builder'},
  {id:'granary',check:'planned',buildingIds:['granary']},
  {id:'farm',check:'planned',buildingIds:['farmhouse','wheat_field']},
  {id:'hunting_lodge',check:'planned',buildingIds:['hunting_lodge']},
  {id:'lumberjack_hut',check:'planned',buildingIds:['lumberjack_hut']},
  {id:'stone',check:'stone',target:'#mark-rocks',buildingIds:['quarry']},
  {id:'house',check:'built',buildingIds:['house']},
  {id:'storage',check:'planned',buildingIds:['material_yard','builder_workshop']},
  {id:'speed',check:'speed',target:'#speed-controls [data-speed="2"]'},
].map(step=>Object.freeze(step)));
// The king step ends by itself after this many real milliseconds (or "Next").
export const TUTORIAL_KING_MS=6000;
