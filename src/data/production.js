import { FOOD_RECIPES } from './foodProduction.js';

// Shared recipes: food and material workshops use the same physical pipeline.
export const PRODUCTION_RECIPES=Object.freeze({
  ...FOOD_RECIPES,
  // m-palivo-vyroba (38): all its Wood is fuel; owner 13 Nov: one more (3 Ore + 3 Wood → 1 Iron, was 2 Wood).
  smelter:Object.freeze({input:Object.freeze({iron_ore:3,wood:3}),fuel:Object.freeze({wood:3}),output:Object.freeze({iron:1}),duration:40000,skill:'smelting',xp:10,
    inputSources:Object.freeze({iron_ore:'Smelting',wood:'Smelting Fuel'}),outputSource:'Smelter Production'}),
  // Military workshops (C07): balance lives here and may change.
  // S12: a Wheelbarrow is a vehicle: the finished one leaves the output buffer as a real object beside the workshop.
  wheelwright_workshop:Object.freeze({input:Object.freeze({wood:10,iron:2}),output:Object.freeze({wheelbarrow:1}),duration:300000/* m-obchod-vylepseni (57): 10× slower, was 30 s */,skill:'crafting',xp:12,vehicle:true,inputSources:Object.freeze({wood:'Wheelwrighting',iron:'Wheelwrighting'}),outputSource:'Wheelwright Production'}),
  bowyer:Object.freeze({input:Object.freeze({wood:8}),output:Object.freeze({bow:1}),duration:30000,skill:'crafting',xp:10,inputSources:Object.freeze({wood:'Bowmaking'}),outputSource:'Bowyer Production'}),
  // m-palivo-vyroba: of the 2 Wood, 1 is the grip and 1 feeds the forge.
  swordsmith:Object.freeze({input:Object.freeze({iron:3,wood:2}),fuel:Object.freeze({wood:1}),output:Object.freeze({sword:1}),duration:45000,skill:'crafting',xp:12,inputSources:Object.freeze({iron:'Swordsmithing',wood:'Forge Fuel'}),outputSource:'Swordsmith Production'}),
  armorer:Object.freeze({input:Object.freeze({iron:5,wood:2}),fuel:Object.freeze({wood:1}),output:Object.freeze({armor:1}),duration:60000,skill:'crafting',xp:14,inputSources:Object.freeze({iron:'Armorsmithing',wood:'Forge Fuel'}),outputSource:'Armorer Production'}),
});
// S12: the Horse Wagon is the Wheelwright's second recipe. It also needs one tamed horse from the Stables, reserved when
// the batch starts and harnessed to the finished wagon; the horse is never consumed.
export const HORSE_WAGON_RECIPE=Object.freeze({input:Object.freeze({wood:30,iron:6}),output:Object.freeze({horse_wagon:1}),duration:90000,skill:'crafting',xp:30,vehicle:true,horse:true,
  inputSources:Object.freeze({wood:'Wheelwrighting',iron:'Wheelwrighting'}),outputSource:'Wheelwright Production'});
// Day and night N2: the Pitch Kiln burns Wood into Pitch, and dips Wood into Pitch for Torches. It makes Torches while
// the stores hold fewer than TORCHES.torchTarget and it has Pitch, otherwise Pitch (FoodProductionSystem picks).
export const PITCH_RECIPES=Object.freeze({
  // m-smolarna-rychlost (owner, 12 Nov): half the time and twice the batch – four times as much an hour (before: 2 Wood →
  // 1 Pitch in 30 s, 1 Wood + 1 Pitch → 3 Torches in 20 s).
  pitch:Object.freeze({input:Object.freeze({wood:4}),output:Object.freeze({pitch:2}),duration:15000,skill:'crafting',xp:8,inputSources:Object.freeze({wood:'Pitch Making'}),outputSource:'Pitch Kiln Production'}),
  torches:Object.freeze({input:Object.freeze({wood:2,pitch:2}),output:Object.freeze({torch:6}),duration:10000,skill:'crafting',xp:8,inputSources:Object.freeze({wood:'Torch Making',pitch:'Torch Making'}),outputSource:'Pitch Kiln Production'}),
});
// p70 (owner 17 Nov 2026): the three weapon and armour workshops switch production in the building window.
const recipe=(input,fuel,output,duration,xp,inputSources,outputSource)=>Object.freeze({input:Object.freeze(input),...(fuel?{fuel:Object.freeze(fuel)}:{}),output:Object.freeze(output),duration,skill:'crafting',xp,inputSources:Object.freeze(inputSources),outputSource});
export const SWORDSMITH_RECIPES=Object.freeze({sword:PRODUCTION_RECIPES.swordsmith,halberd:recipe({iron:4,wood:3},{wood:1},{halberd:1},55000,14,{iron:'Swordsmithing',wood:'Forge Fuel'},'Swordsmith Production')});
export const BOWYER_RECIPES=Object.freeze({bow:PRODUCTION_RECIPES.bowyer,crossbow:recipe({wood:6,iron:1},null,{crossbow:1},40000,12,{wood:'Bowmaking',iron:'Bowmaking'},'Bowyer Production')});
export const ARMORER_RECIPES=Object.freeze({armor:PRODUCTION_RECIPES.armorer,light_armor:recipe({iron:2,wood:1},{wood:1},{light_armor:1},40000,10,{iron:'Armorsmithing',wood:'Forge Fuel'},'Armorer Production')});
export const WHEELWRIGHT_RECIPES=Object.freeze({wheelbarrow:PRODUCTION_RECIPES.wheelwright_workshop,horse_wagon:HORSE_WAGON_RECIPE});
// m-ukladani-chyba (owner, 12 Nov): earlier balance of recipes that changed while the save schema stayed the same. A batch
// that was running (or finished and waiting) when the game was saved keeps the recipe it started with, so a save made
// before a balance change still loads and that batch finishes as started. Key: building type, or type:recipe key.
// Add the old recipe here whenever a recipe's input, output or duration changes without a save schema bump.
const past=(input,output,duration)=>Object.freeze({input:Object.freeze(input),output:Object.freeze(output),duration});
export const RECIPE_HISTORY=Object.freeze({
  mill:Object.freeze([past({wheat:4},{flour:3},30000)]),
  bakery:Object.freeze([past({flour:1},{bread:6},30000),past({flour:2},{bread:5},30000),past({flour:2},{bread:4},30000)]),
  smelter:Object.freeze([past({iron_ore:3,wood:2},{iron:1},40000)]),
  'pitch_kiln:pitch':Object.freeze([past({wood:2},{pitch:1},30000)]),
  'pitch_kiln:torches':Object.freeze([past({wood:1,pitch:1},{torch:3},20000)]),
});
// The current recipe first, then its earlier versions (input, output, duration only).
export const recipeVariants=(type,key,recipe)=>[recipe,...(RECIPE_HISTORY[key?`${type}:${key}`:type]??[])];
// A workshop with several recipes (definition.recipes) makes the one chosen in its production record; others use definition.recipe.
export const recipeFor=(definition,key)=>definition.recipes?.[key]??definition.recipe;
// m-palivo-vyroba: a recipe without its fuel (a world without physical materials keeps Wood out of the food stores).
export const withoutFuel=recipe=>{if(!recipe?.fuel)return recipe;const input={...recipe.input};for(const [id,n]of Object.entries(recipe.fuel)){input[id]=(input[id]??0)-n;if(input[id]<=0)delete input[id];}return {...recipe,input,fuel:undefined};};
export const defaultRecipeKey=definition=>definition.recipes?Object.keys(definition.recipes)[0]:undefined;
export const recipeResources=(definition,kind)=>[...new Set([definition.recipe,...Object.values(definition.recipes??{})].flatMap(r=>Object.keys(r[kind])))];
