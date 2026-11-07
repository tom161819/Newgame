import { FOOD_RESOURCE_IDS } from '../foodProduction.js';
import { LOGISTICS_RULES } from '../logistics.js';
export const logisticsBuildings=[
  {id:'warehouse',name:'Warehouse',width:3,height:3,cost:{stone:10},constructionTime:30000,visualHeight:125,buildable:true,
    storage:{capacity:200,resources:['stone','wood','iron'],accepts:'materials'},description:'A physical store for 200 building materials. Haulers serve every store in the kingdom.'},
  {id:'starter_stockpile',name:'Starter Stockpile',width:2,height:2,cost:{},visualHeight:55,buildable:false,starter:true,
    storage:{capacity:LOGISTICS_RULES.starterCapacity,resources:['stone','wood','iron',...FOOD_RESOURCE_IDS],accepts:'all'},description:`A starting store with space for ${LOGISTICS_RULES.starterCapacity} materials and food units combined.`},
].map(d=>({...d,category:'building',buildingCategory:'logistics',sprite:`/assets/buildings/${d.id}/${d.id}.svg`,walkable:false,collectible:false,
  interactions:['inspect_storage'],renderMode:'procedural',renderer:'food_building',origin:{x:.5,y:.9},depth:{offset:0},
  shadow:{baked:true,x:10,y:-10,width:d.width*59,height:d.height*21,color:0x30291c,alpha:.3}}));
export const materialDefinitions=[
  {id:'wood',name:'Wood',symbol:'🪵',inventoryOrder:12,description:'Timber stored in a Warehouse or Starter Stockpile.'},
  {id:'iron',name:'Iron',symbol:'▰',inventoryOrder:14,description:'Iron stored in a Warehouse or Starter Stockpile.'},
].map(d=>({...d,inventoryLabel:d.name,quantityNames:[d.name,d.name,d.name],category:'resource',sprite:`/assets/resources/${d.id}/${d.id}.svg`,
  width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],renderMode:'sprite',origin:{x:.5,y:.75},visualHeight:28,visual:{displayWidth:28,displayHeight:28},depth:{offset:.08}}));
