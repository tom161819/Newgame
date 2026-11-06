import { FOOD_RECIPES } from './foodProduction.js';

// Shared recipes: food and material workshops use the same physical pipeline.
export const PRODUCTION_RECIPES=Object.freeze({
  ...FOOD_RECIPES,
  smelter:Object.freeze({input:Object.freeze({iron_ore:3,wood:2}),output:Object.freeze({iron_bar:1}),duration:40000,skill:'smelting',xp:10,
    inputSources:Object.freeze({iron_ore:'Smelting',wood:'Smelting Fuel'}),outputSource:'Smelter Production'}),
  // Military workshops (C07): balance lives here and may change.
  // S12: a Wheelbarrow is a vehicle: the finished one leaves the output buffer as a real object beside the workshop.
  wheelwright_workshop:Object.freeze({input:Object.freeze({wood:10,iron_bar:2}),output:Object.freeze({wheelbarrow:1}),duration:30000,skill:'crafting',xp:12,vehicle:true,inputSources:Object.freeze({wood:'Wheelwrighting',iron_bar:'Wheelwrighting'}),outputSource:'Wheelwright Production'}),
  bowyer:Object.freeze({input:Object.freeze({wood:8}),output:Object.freeze({bow:1}),duration:30000,skill:'crafting',xp:10,inputSources:Object.freeze({wood:'Bowmaking'}),outputSource:'Bowyer Production'}),
  swordsmith:Object.freeze({input:Object.freeze({iron_bar:3,wood:2}),output:Object.freeze({sword:1}),duration:45000,skill:'crafting',xp:12,inputSources:Object.freeze({iron_bar:'Swordsmithing',wood:'Forge Fuel'}),outputSource:'Swordsmith Production'}),
  armorer:Object.freeze({input:Object.freeze({iron_bar:5,wood:2}),output:Object.freeze({armor:1}),duration:60000,skill:'crafting',xp:14,inputSources:Object.freeze({iron_bar:'Armorsmithing',wood:'Forge Fuel'}),outputSource:'Armorer Production'}),
});
// S12: the Horse Wagon is the Wheelwright's second recipe. It also needs one tamed horse from the Stables, reserved when
// the batch starts and harnessed to the finished wagon; the horse is never consumed.
export const HORSE_WAGON_RECIPE=Object.freeze({input:Object.freeze({wood:30,iron_bar:6}),output:Object.freeze({horse_wagon:1}),duration:90000,skill:'crafting',xp:30,vehicle:true,horse:true,
  inputSources:Object.freeze({wood:'Wheelwrighting',iron_bar:'Wheelwrighting'}),outputSource:'Wheelwright Production'});
export const WHEELWRIGHT_RECIPES=Object.freeze({wheelbarrow:PRODUCTION_RECIPES.wheelwright_workshop,horse_wagon:HORSE_WAGON_RECIPE});
// A workshop with several recipes (definition.recipes) makes the one chosen in its production record; others use definition.recipe.
export const recipeFor=(definition,key)=>definition.recipes?.[key]??definition.recipe;
export const defaultRecipeKey=definition=>definition.recipes?Object.keys(definition.recipes)[0]:undefined;
export const recipeResources=(definition,kind)=>[...new Set([definition.recipe,...Object.values(definition.recipes??{})].flatMap(r=>Object.keys(r[kind])))];
