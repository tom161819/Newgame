import { WORKPLACES } from '../workplaces.js';
import { PRODUCTION_RECIPES,SWORDSMITH_RECIPES,BOWYER_RECIPES,ARMORER_RECIPES } from '../production.js';
import { FOOD_RULES } from '../foodProduction.js';

// C07: weapon and armour workshops and the Armory. Workshops run on the shared physical recipe pipeline (as the
// Smelter): workers, input and output buffers, Haulers and the ledger. Their goods are stored items that only an
// Armory accepts. Approved Asset Studio art comes from approvedArt.js; its approved sprites replace these paths.
// Approved Asset Studio variants used until the developer's preferred pick (still in review) is approved; the
// Swordsmith's preferred art is approved and comes from approvedArt.js.
const ART={bowyer:{sprite:'/assets/buildings/bowyer/bowyer-stone.v1.png',origin:{x:0.49618,y:0.98473}},armorer:{sprite:'/assets/buildings/armorer/armorer-forge.v1.png',origin:{x:0.49618,y:0.98473}},armory:{sprite:'/assets/buildings/armory/armory-fortified.v1.png',origin:{x:0.49744,y:0.98758}}};
const RECIPES={swordsmith:SWORDSMITH_RECIPES,bowyer:BOWYER_RECIPES,armorer:ARMORER_RECIPES};
const workshop=(id,name,cost,time,description)=>({id,name,category:'building',buildingCategory:'defense',sprite:ART[id]?.sprite??`/assets/buildings/${id}/${id}.png`,
  width:2,height:2,walkable:false,collectible:false,buildable:true,cost,constructionTime:time,
  workplace:WORKPLACES[id],recipe:PRODUCTION_RECIPES[id],recipes:RECIPES[id],autoEmployment:true,bufferCapacity:FOOD_RULES.bufferCapacity,
  interactions:['manage_workers'],description,renderMode:'sprite',origin:ART[id]?.origin??{x:.5,y:.98},visualHeight:129,depth:{offset:0}});
// p70: the new items show their nearest existing picture (Halberd: Sword, Crossbow: Bow, Light Armor: Armor) until
// their own art is approved.
const item=(id,name,plural,order,description,picture=id)=>({id,name,inventoryLabel:plural,quantityNames:[name,plural,plural],inventoryOrder:order,category:'resource',resourceCategory:'equipment',loadUnits:5,
  sprite:`/assets/resources/${picture}/${picture}.png`,width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],
  description,renderMode:'sprite',origin:{x:.5,y:.6},visualHeight:30,visual:{displayWidth:40,displayHeight:28},depth:{offset:.08}});

export const militaryDefinitions=[
  workshop('bowyer','Bowyer',{stone:5,wood:10},30000,'A Bowyer turns 8 physically delivered Wood into 1 Bow with 30 seconds of active work. Bows are carried to an Armory.'),
  workshop('swordsmith','Swordsmith',{stone:5,wood:10},35000,'A Swordsmith turns 3 Iron and 2 Wood into 1 Sword with 45 seconds of active work. Swords are carried to an Armory.'),
  workshop('armorer','Armorer',{stone:5,wood:10},40000,'An Armorer forges 5 Iron and 2 Wood into 1 metal Armor with 60 seconds of active work. Armor is carried to an Armory.'),
  {id:'armory',name:'Armory',category:'building',buildingCategory:'defense',sprite:ART.armory.sprite,width:3,height:3,walkable:false,collectible:false,buildable:true,
    cost:{stone:10,wood:12},constructionTime:40000,storage:{capacity:40,resources:['bow','sword','armor','halberd','crossbow','light_armor'],accepts:'equipment'},interactions:['open_storage'],
    description:'A guarded store for 40 weapons and armour (Bows, Crossbows, Swords, Halberds, Armor and Light Armor). Haulers bring finished equipment here; it takes nothing else.',renderMode:'sprite',origin:ART.armory.origin,visualHeight:159,depth:{offset:0}},
  item('bow','Bow','Bows',16,'A wooden war bow made by a Bowyer from 8 Wood. Kept in an Armory.'),
  item('sword','Sword','Swords',17,'An iron sword forged by a Swordsmith from 3 Iron and 2 Wood. Kept in an Armory.'),
  item('armor','Armor','Armor',18,'Metal armour forged by an Armorer from 5 Iron and 2 Wood. Kept in an Armory.'),
  item('halberd','Halberd','Halberds',19,'A pole weapon forged by a Swordsmith from 4 Iron and 3 Wood. A Halberdier strikes with it from 2 tiles. Kept in an Armory.','sword'),
  item('crossbow','Crossbow','Crossbows',20,'A crossbow made by a Bowyer from 6 Wood and 1 Iron. Kept in an Armory.','bow'),
  item('light_armor','Light Armor','Light Armor',21,'A padded linen jacket sewn by a Tailor from 3 Cloth. Kept in an Armory.','armor'),
];
