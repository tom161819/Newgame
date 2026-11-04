import { WORKPLACES } from '../workplaces.js';
import { PRODUCTION_RECIPES } from '../production.js';
import { FOOD_RULES } from '../foodProduction.js';

export const smeltingDefinitions=[
  {id:'smelter',name:'Smelter',czechName:'Slévárna',category:'building',buildingCategory:'industry',sprite:'/assets/buildings/smelter/smelter.svg',
    width:3,height:3,walkable:false,collectible:false,buildable:true,cost:{stone:12,wood:10},constructionTime:35000,
    workplace:WORKPLACES.smelter,recipe:PRODUCTION_RECIPES.smelter,autoEmployment:true,bufferCapacity:FOOD_RULES.bufferCapacity,
    interactions:['manage_workers'],description:'Two Smelter Operators turn 3 physically delivered Iron Ore and 2 Wood into 1 Iron Bar with 40 seconds of active work. Auto Production hires available unemployed residents by Smelting skill.',
    renderMode:'sprite',origin:{x:.5,y:238/242},visualHeight:230,visual:{displayWidth:212,displayHeight:242},depth:{offset:0},
    shadow:{baked:true,x:10,y:-20,width:177,height:63,color:0x30291c,alpha:.3}},
  {id:'iron_bar',name:'Iron Bar',inventoryLabel:'Iron Bars',symbol:'▰',inventoryOrder:15,quantityNames:['Iron Bar','Iron Bars','Iron Bars'],category:'resource',resourceCategory:'processed_material',loadUnits:5,
    sprite:'/assets/resources/iron_bar/iron_bar.svg',width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],
    description:'Finished iron smelted from 3 Iron Ore and 2 Wood. Stored in Warehouses; distinct from raw ore. Prepared for advanced manufacturing.',
    renderMode:'sprite',origin:{x:.5,y:.75},visualHeight:28,visual:{displayWidth:32,displayHeight:28},depth:{offset:.08}},
];
