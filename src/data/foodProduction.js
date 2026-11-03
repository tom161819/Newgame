export const FOOD_RESOURCE_IDS=Object.freeze(['meat','wheat','flour','bread','apple']);
export const FOOD_RULES=Object.freeze({fallbackCapacity:30,carryCapacity:20,bufferCapacity:20,searchInterval:500});
export const FOOD_RECIPES=Object.freeze({
  mill:Object.freeze({input:Object.freeze({wheat:4}),output:Object.freeze({flour:3}),duration:30000,skill:'milling',xp:8}),
  bakery:Object.freeze({input:Object.freeze({flour:2}),output:Object.freeze({bread:4}),duration:30000,skill:'baking',xp:10}),
});
