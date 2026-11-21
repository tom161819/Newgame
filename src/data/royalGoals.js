// E4 (report from playing 0.48.0): Royal tasks. Three of these are active at a time, in this order; a finished one
// pays its reward once and the next one takes its place. kind: buildings (completed buildings of one type),
// population (living residents), produced (finished production cycles of one building type), gold (gold in stock).
// skillPoints (m-kral-odmeny-xp): points for the King's skills, 1–3 by difficulty (src/systems/KingSkills.js).
export const ROYAL_GOALS=Object.freeze([
  Object.freeze({id:'houses3',kind:'buildings',building:'house',target:3,reward:Object.freeze({gold:20}),skillPoints:1}),
  Object.freeze({id:'pop10',kind:'population',target:10,reward:Object.freeze({wood:20}),skillPoints:1}),
  Object.freeze({id:'bread',kind:'produced',building:'bakery',target:1,reward:Object.freeze({gold:30}),skillPoints:1}),
  Object.freeze({id:'pop20',kind:'population',target:20,reward:Object.freeze({gold:40}),skillPoints:2}),
  Object.freeze({id:'gold100',kind:'gold',target:100,reward:Object.freeze({wood:30}),skillPoints:2}),
  Object.freeze({id:'material_yard',kind:'buildings',building:'material_yard',target:1,reward:Object.freeze({stone:10}),skillPoints:2})
]);
// m-uroven-kralovstvi (owner 21 Nov 2026): the Wall and Barracks tasks are dropped (they need Castle level 3). A save that
// finished them still loads; the ids are skipped on import.
export const RETIRED_ROYAL_GOALS=Object.freeze(['wall','barracks']);
// Owner 21 Nov 2026 ("proč mi nejde načíst hra? [kingSkills]"): the retired tasks gave 2 + 3 King skill points. A save
// keeps those points but no longer lists the tasks as done (they are skipped on import, so the next save drops them), so
// the King skill check allows these points on top of what the listed tasks earned.
export const RETIRED_ROYAL_GOAL_POINTS=5;
export const ROYAL_GOALS_ACTIVE=3;
// How often the goals are checked (game milliseconds); a finished goal never needs to be faster than this.
export const ROYAL_GOALS_CHECK_MS=500;
