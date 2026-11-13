export const FOOD_RESOURCE_IDS=Object.freeze(['meat','wheat','flour','bread','apple','fish']);
export const FOOD_RULES=Object.freeze({fallbackCapacity:30,carryCapacity:20,bufferCapacity:20,searchInterval:500});
export const FOOD_RECIPES=Object.freeze({
  mill:Object.freeze({input:Object.freeze({wheat:4}),output:Object.freeze({flour:2}),duration:30000,skill:'milling',xp:8}),
  // tabulka-budov-1 (owner table 9 Nov 2026): Mill 4 Wheat → 2 Flour, Bakery 1 Flour → 6 Bread (4 Wheat → 12 Bread; was 7.5).
  // m-palivo-vyroba (38): the oven burns 1 Wood a batch (`fuel` lists the inputs that are burnt, not built in).
  bakery:Object.freeze({input:Object.freeze({flour:1,wood:1}),fuel:Object.freeze({wood:1}),output:Object.freeze({bread:6}),duration:30000,skill:'baking',xp:10,inputSources:Object.freeze({wood:'Baking Fuel'})}),
});
// Earlier recipe balance for saves with a running batch: RECIPE_HISTORY in production.js.
