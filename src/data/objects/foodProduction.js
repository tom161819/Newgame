import { GRANARY_GROUP_CAPACITY } from '../granaryCapacity.js';
import { WORKPLACES } from '../workplaces.js';
import { FOOD_RECIPES,FOOD_RULES,FOOD_RESOURCE_IDS } from '../foodProduction.js';
import { FARMHOUSE_STORE } from '../farming.js';

export const foodBuildings=[
  {id:'mill',name:'Mill',menuOrder:60,recommendsCompletedBuildings:['wheat_field'],width:2,height:2,cost:{stone:4,wood:20},constructionTime:25000,visualHeight:150,
    workplace:WORKPLACES.mill,recipe:FOOD_RECIPES.mill,description:'Two Millers grind 4 Wheat into 3 Flour with 30 seconds of active work. Inputs and outputs are physically carried.'},
  {id:'bakery',name:'Bakery',menuOrder:70,recommendsCompletedBuildings:['mill'],width:3,height:2,cost:{stone:10,wood:10},constructionTime:25000,visualHeight:110,
    workplace:WORKPLACES.bakery,recipe:FOOD_RECIPES.bakery,description:'Two Bakers turn 2 Flour into 4 Bread with 30 seconds of active work and physical deliveries.'},
  {id:'granary',name:'Granary',menuOrder:10,width:3,height:3,cost:{wood:12},constructionTime:30000,visualHeight:125,
    // farmhouse-store (owner 8 Nov 2026): Wheat and Flour live in Farmhouse stores; the Granary keeps the edible food.
    storage:{capacity:GRANARY_GROUP_CAPACITY.food,resources:FOOD_RESOURCE_IDS.filter(id=>!FARMHOUSE_STORE.resources.includes(id))},description:'A physical store for 1000 units of food (meat, fish, apples, bread). Wheat and Flour are kept in Farmhouses. Haulers serve every store in the kingdom.'},
].map(d=>({...d,category:'building',buildingCategory:'food',sprite:`/assets/buildings/${d.id}/${d.id}.svg`,walkable:false,collectible:false,buildable:true,
  interactions:d.storage?['inspect_storage']:['manage_workers'],renderMode:'procedural',renderer:'food_building',origin:{x:.5,y:.9},depth:{offset:0},
  bufferCapacity:d.recipe?FOOD_RULES.bufferCapacity:undefined,
  shadow:{baked:true,x:10,y:-10,width:d.width*59,height:d.height*21,color:0x30291c,alpha:.3}}));

export const processedFoodResources=[
  {id:'flour',name:'Flour',symbol:'▱',inventoryOrder:35,edible:false,description:'Milled wheat. Flour must be baked before it can be eaten.'},
  {id:'bread',name:'Bread',symbol:'🍞',inventoryOrder:37,edible:true,description:'Edible bread baked from flour.'},
].map(d=>({...d,inventoryLabel:d.name,quantityNames:[d.name,d.name,d.name],category:'resource',sprite:`/assets/resources/${d.id}/${d.id}.svg`,
  width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],renderMode:'sprite',
  origin:{x:.5,y:.75},visualHeight:28,visual:{displayWidth:28,displayHeight:28},depth:{offset:.08}}));
