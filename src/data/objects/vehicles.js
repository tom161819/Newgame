import { WORKPLACES } from '../workplaces.js';
import { PRODUCTION_RECIPES,WHEELWRIGHT_RECIPES } from '../production.js';
import { FOOD_RULES } from '../foodProduction.js';

// S12 phase B: the Wheelwright's Workshop makes Wheelbarrows on the shared physical recipe pipeline. A finished
// Wheelbarrow becomes a vehicle object on the map (VehicleSystem); Haulers take one and carry five times as much.
// No Asset Studio art is approved yet: the workshop uses the procedural workplace renderer as a marked fallback.
import { STABLE_RULES } from '../stables.js';
export const vehicleDefinitions=[
  {id:'stables',name:'Stables',category:'building',buildingCategory:'logistics',sprite:'/assets/buildings/stables/stables-shelter.v1.png',
    width:5,height:5,walkable:false,collectible:false,buildable:true,cost:{wood:15,stone:10},constructionTime:45000,
    workplace:WORKPLACES.stables,horseCapacity:STABLE_RULES.horseCapacity,autoEmployment:true,interactions:['manage_workers'],
    renderMode:'sprite',origin:{x:0.49845,y:0.99065},visualHeight:212,depth:{offset:0},
    description:'A stable with a fenced paddock for 4 tamed horses. Two Stablehands tame wild horses and lead them in.'},
  {id:'wheelwright_workshop',name:"Wheelwright's Workshop",category:'building',buildingCategory:'industry',sprite:'/assets/buildings/wheelwright_workshop/wheelwright_workshop.svg',
    width:3,height:3,walkable:false,collectible:false,buildable:true,cost:{stone:12,wood:15},constructionTime:40000,
    workplace:WORKPLACES.wheelwright_workshop,recipe:PRODUCTION_RECIPES.wheelwright_workshop,recipes:WHEELWRIGHT_RECIPES,autoEmployment:true,bufferCapacity:40,
    interactions:['manage_workers'],renderMode:'procedural',renderer:'workplace',origin:{x:.5,y:.9},visualHeight:110,depth:{offset:0},
    description:"Two Wheelwrights build a Wheelbarrow (10 Wood, 2 Iron Bars, 30 s) or a Horse Wagon (30 Wood, 6 Iron Bars and a tamed horse from the Stables, 90 s). It is left beside the workshop for a Hauler to take."},
  {id:'wheelbarrow',name:'Wheelbarrow',inventoryLabel:'Wheelbarrows',quantityNames:['Wheelbarrow','Wheelbarrows','Wheelbarrows'],inventoryOrder:19,category:'resource',resourceCategory:'vehicle',
    sprite:'/assets/resources/wheelbarrow/wheelbarrow.svg',width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:[],
    renderMode:'procedural',origin:{x:.5,y:.6},visualHeight:30,depth:{offset:.08},
    description:'A wooden Wheelbarrow with an iron-shod wheel. A Hauler pushing it carries five times as much.'},
  {id:'horse_wagon',name:'Horse Wagon',inventoryLabel:'Horse Wagons',quantityNames:['Horse Wagon','Horse Wagons','Horse Wagons'],inventoryOrder:20,category:'resource',resourceCategory:'vehicle',
    sprite:'/assets/resources/horse_wagon/horse_wagon.svg',width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:[],
    renderMode:'procedural',origin:{x:.5,y:.7},visualHeight:40,depth:{offset:.08},
    description:'A four-wheeled wagon drawn by a tamed horse. A Hauler driving it carries ten times as much.'},
];
