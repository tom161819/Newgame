import { WORKPLACES } from '../workplaces.js';
import { FARMING_RULES } from '../farming.js';

export const farmingBuildings = [
  {
    id:'farmhouse',name:'Farmhouse',width:2,height:2,cost:{stone:10},constructionTime:25000,
    description:'A farmhouse with three Farmer workplaces. Farmers tend crops within 15 tiles.',
    walkable:false,workplace:WORKPLACES.farmhouse,workRadius:FARMING_RULES.workRadius,
    interactions:['manage_workers'],renderer:'workplace',visualHeight:110,
  },
  ...[
    {id:'wheat_field',name:'Wheat Field',cost:{stone:3},visualHeight:38,constructionTime:10000,
      description:'Wheat grows for two game days. A farmer must physically harvest the ripe crop for 8 Wheat.'},
    {id:'orchard',name:'Orchard',cost:{stone:6},visualHeight:83,constructionTime:15000,
      description:'Permanent fruit trees grow apples for three game days. A farmer harvests 6 Apple without replanting.'},
  ].map(d=>({...d,width:3,height:3,walkable:true,crop:FARMING_RULES.crops[d.id],interactions:['inspect_crop'],renderer:'crop'})),
].map(d=>({...d,category:'building',sprite:`/assets/buildings/${d.id}/${d.id}.svg`,collectible:false,buildable:true,
  renderMode:'procedural',origin:{x:.5,y:.9},depth:{offset:0},
  shadow:{baked:true,x:8,y:-8,width:d.width*57,height:d.height*20,color:0x30291c,alpha:.24}}));

export const farmingResources = [
  {id:'wheat',name:'Wheat',symbol:'🌾',inventoryOrder:30,edible:false,description:'Harvested wheat. It is not directly edible.'},
  {id:'apple',name:'Apple',symbol:'🍎',inventoryOrder:40,edible:true,description:'Freshly harvested edible apples.'},
].map(d=>({...d,inventoryLabel:d.name,quantityNames:[d.name,d.name,d.name],category:'resource',sprite:`/assets/resources/${d.id}/${d.id}.svg`,
  width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],renderMode:'sprite',
  origin:{x:.5,y:.75},visualHeight:28,visual:{displayWidth:28,displayHeight:28},depth:{offset:.08}}));
