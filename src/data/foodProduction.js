export const FOOD_RESOURCE_IDS=Object.freeze(['meat','wheat','flour','bread','apple','fish']);
export const FOOD_RULES=Object.freeze({fallbackCapacity:30,carryCapacity:20,bufferCapacity:20,searchInterval:500});
export const FOOD_RECIPES=Object.freeze({
  mill:Object.freeze({input:Object.freeze({wheat:4}),output:Object.freeze({flour:2}),duration:30000,skill:'milling',xp:8}),
  // m-jidlo-balanc: +1 Bread a batch (2 Flour → 5 Bread; 4 Wheat → 3 Flour → 7.5 Bread).
  bakery:Object.freeze({input:Object.freeze({flour:1}),output:Object.freeze({bread:6}),duration:30000,skill:'baking',xp:10}),
});
// A batch started before m-jidlo-balanc (saved with this output reserved) finishes with its reserved amount; only the save
// check uses it, so older saves with a running Bakery batch still load.
export const LEGACY_RECIPE_OUTPUTS=Object.freeze({bakery:Object.freeze({bread:4})});
