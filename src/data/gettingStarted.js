// Getting started (owner request, 7 Nov 2026): the first buildings of a new game as a checklist behind the HUD "?" button.
// Each step is done when at least one building of `buildingId` is completed (a construction site is not enough).
// Texts are i18n keys `help.step.<id>` (title) and `help.step.<id>.why` (one sentence why). Only buildings that exist in
// the game; the order must be achievable (a step never needs a building that a later step builds).
export const GETTING_STARTED_STEPS=Object.freeze([
  {id:'warehouse',buildingId:'warehouse'},
  {id:'granary',buildingId:'granary'},
  {id:'farmhouse',buildingId:'farmhouse'},
  {id:'hunting_lodge',buildingId:'hunting_lodge'},
  {id:'wheat_field',buildingId:'wheat_field'},
  {id:'house',buildingId:'house'},
  {id:'lumberjack_hut',buildingId:'lumberjack_hut'},
].map(step=>Object.freeze(step)));
