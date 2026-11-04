import { FOOD_RECIPES } from './foodProduction.js';

// Shared recipes: food and material workshops use the same physical pipeline.
export const PRODUCTION_RECIPES=Object.freeze({
  ...FOOD_RECIPES,
  smelter:Object.freeze({input:Object.freeze({iron_ore:3,wood:2}),output:Object.freeze({iron_bar:1}),duration:40000,skill:'smelting',xp:10,
    inputSources:Object.freeze({iron_ore:'Smelting',wood:'Smelting Fuel'}),outputSource:'Smelter Production'}),
});
