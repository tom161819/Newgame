import { WORKPLACES } from '../workplaces.js';
import { PRODUCTION_RECIPES } from '../production.js';
import { FOOD_RULES } from '../foodProduction.js';

// S12 phase B: the Wheelwright's Workshop makes Wheelbarrows on the shared physical recipe pipeline. A finished
// Wheelbarrow becomes a vehicle object on the map (VehicleSystem); Haulers take one and carry five times as much.
// No Asset Studio art is approved yet: the workshop uses the procedural workplace renderer as a marked fallback.
export const vehicleDefinitions=[
  {id:'wheelwright_workshop',name:"Wheelwright's Workshop",category:'building',buildingCategory:'industry',sprite:'/assets/buildings/wheelwright_workshop/wheelwright_workshop.svg',
    width:3,height:3,walkable:false,collectible:false,buildable:true,cost:{stone:12,wood:15},constructionTime:40000,
    workplace:WORKPLACES.wheelwright_workshop,recipe:PRODUCTION_RECIPES.wheelwright_workshop,autoEmployment:true,bufferCapacity:FOOD_RULES.bufferCapacity,
    interactions:['manage_workers'],renderMode:'procedural',renderer:'workplace',origin:{x:.5,y:.9},visualHeight:110,depth:{offset:0},
    description:"Two Wheelwrights build a Wheelbarrow from 10 Wood and 2 Iron Bars in 30 seconds of work. It is left beside the workshop for a Hauler to take."},
  {id:'wheelbarrow',name:'Wheelbarrow',inventoryLabel:'Wheelbarrows',quantityNames:['Wheelbarrow','Wheelbarrows','Wheelbarrows'],inventoryOrder:19,category:'resource',resourceCategory:'vehicle',
    sprite:'/assets/resources/wheelbarrow/wheelbarrow.svg',width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:[],
    renderMode:'procedural',origin:{x:.5,y:.6},visualHeight:30,depth:{offset:.08},
    description:'A wooden Wheelbarrow with an iron-shod wheel. A Hauler pushing it carries five times as much.'},
];
