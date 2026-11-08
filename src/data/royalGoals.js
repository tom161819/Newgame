// E4 (report from playing 0.48.0): Royal tasks. Three of these are active at a time, in this order; a finished one
// pays its reward once and the next one takes its place. kind: buildings (completed buildings of one type),
// population (living residents), produced (finished production cycles of one building type), gold (gold in stock).
export const ROYAL_GOALS=Object.freeze([
  Object.freeze({id:'houses3',kind:'buildings',building:'house',target:3,reward:Object.freeze({gold:20})}),
  Object.freeze({id:'pop10',kind:'population',target:10,reward:Object.freeze({wood:20})}),
  Object.freeze({id:'bread',kind:'produced',building:'bakery',target:1,reward:Object.freeze({gold:30})}),
  Object.freeze({id:'pop20',kind:'population',target:20,reward:Object.freeze({gold:40})}),
  Object.freeze({id:'wall',kind:'buildings',building:'wall',target:1,reward:Object.freeze({stone:15})}),
  Object.freeze({id:'gold100',kind:'gold',target:100,reward:Object.freeze({wood:30})}),
  Object.freeze({id:'material_yard',kind:'buildings',building:'material_yard',target:1,reward:Object.freeze({stone:10})}),
  Object.freeze({id:'barracks',kind:'buildings',building:'barracks',target:1,reward:Object.freeze({gold:50})})
]);
export const ROYAL_GOALS_ACTIVE=3;
// How often the goals are checked (game milliseconds); a finished goal never needs to be faster than this.
export const ROYAL_GOALS_CHECK_MS=500;
