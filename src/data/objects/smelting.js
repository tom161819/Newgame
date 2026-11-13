import { WORKPLACES } from '../workplaces.js';
import { PRODUCTION_RECIPES,PITCH_RECIPES } from '../production.js';
import { TORCHES } from '../torches.js';
import { FOOD_RULES } from '../foodProduction.js';

export const smeltingDefinitions=[
  {id:'smelter',name:'Smelter',czechName:'Slévárna',category:'building',buildingCategory:'industry',sprite:'/assets/buildings/smelter/smelter.svg',
    width:3,height:3,walkable:false,collectible:false,buildable:true,cost:{stone:12,wood:10},constructionTime:35000,
    workplace:WORKPLACES.smelter,recipe:PRODUCTION_RECIPES.smelter,autoEmployment:true,bufferCapacity:FOOD_RULES.bufferCapacity,
    interactions:['manage_workers'],description:'Two Smelter Operators turn 3 physically delivered Iron Ore and 3 Wood (furnace fuel) into 1 Iron with 40 seconds of active work. Auto Production hires available unemployed residents by Smelting skill.',
    renderMode:'sprite',origin:{x:.5,y:238/242},visualHeight:230,visual:{displayWidth:212,displayHeight:242},depth:{offset:0},
    shadow:{baked:true,x:10,y:-20,width:177,height:63,color:0x30291c,alpha:.3}},
  {id:'iron',name:'Iron',inventoryLabel:'Iron',symbol:'▰',inventoryOrder:14,quantityNames:['Iron','Iron','Iron'],category:'resource',resourceCategory:'processed_material',loadUnits:5,
    sprite:'/assets/resources/iron_bar/iron_bar.svg',width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],
    description:'Finished iron smelted from 3 Iron Ore and 3 Wood. Stored in Material Yards; distinct from raw ore. Prepared for advanced manufacturing.',
    renderMode:'sprite',origin:{x:.5,y:.75},visualHeight:28,visual:{displayWidth:32,displayHeight:28},depth:{offset:.08}},
  // Day and night N2: Pitch and Torches, made in the Pitch Kiln. Provisional icons and drawing until the Studio art.
  {id:'pitch',name:'Pitch',inventoryLabel:'Pitch',inventoryHideZero:true,symbol:'●',inventoryOrder:16,quantityNames:['Pitch','Pitch','Pitch'],category:'resource',resourceCategory:'processed_material',loadUnits:2,
    sprite:'/assets/resources/pitch/pitch.svg',width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],
    description:'Sticky pitch burnt out of 2 Wood in a Pitch Kiln. Needed for Torches.',renderMode:'sprite',origin:{x:.5,y:.75},visualHeight:28,visual:{displayWidth:32,displayHeight:28},depth:{offset:.08}},
  {id:'torch',name:'Torch',inventoryLabel:'Torches',inventoryHideZero:true,symbol:'¡',inventoryOrder:17,quantityNames:['Torch','Torches','Torches'],category:'resource',resourceCategory:'processed_material',loadUnits:1,
    sprite:'/assets/resources/torch/torch.svg',width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],
    description:'A pitch-dipped torch. Burns for one night in a Torch Post or a tower holder, or in a soldier\'s hand.',renderMode:'sprite',origin:{x:.5,y:.75},visualHeight:28,visual:{displayWidth:32,displayHeight:28},depth:{offset:.08}},
  {id:'pitch_kiln',selfSupplied:true/* m-smolar-nosi-vyrobky (owner, 12 Nov): the Pitch Maker fetches Wood and carries Pitch and Torches himself; Haulers get no jobs here */,name:'Pitch Kiln',czechName:'Smolárna',category:'building',buildingCategory:'industry',sprite:'/assets/buildings/pitch_kiln/pitch_kiln.svg',
    width:3,height:3,legacyFootprint:{width:2,height:2}/* owner 13 Nov 2026: the GPT pitch works is 3 × 3; kilns of older saves stay 2 × 2 */,walkable:false,collectible:false,buildable:true,cost:{wood:8,stone:4},constructionTime:25000,
    workplace:WORKPLACES.pitch_kiln,recipe:PITCH_RECIPES.pitch,recipes:PITCH_RECIPES,recipeChoice:'torches',autoEmployment:true,bufferCapacity:FOOD_RULES.bufferCapacity,
    interactions:['manage_workers'],description:`A Pitch Maker burns 2 Wood into 1 Pitch, and dips 1 Wood in 1 Pitch for 3 Torches. He keeps ${TORCHES.torchTarget} Torches in the stores first.`,
    renderMode:'procedural',renderer:'food_building',origin:{x:.5,y:.9},visualHeight:96,depth:{offset:0},
    shadow:{baked:true,x:8,y:-12,width:118,height:42,color:0x30291c,alpha:.3}},
];
