import { WORKPLACES } from '../workplaces.js';
import { PRODUCTION_RECIPES } from '../production.js';
import { FOOD_RULES } from '../foodProduction.js';

// p71 (owner 17 Nov 2026): the cloth chain. A Flax Field (Farmhouse) gives Flax, the Weaver weaves it into Cloth (kept
// in a Warehouse), the Tailor sews Cloth into Light Armor for the Armory. Residents wear Cloth out (ClothingSystem).
// Both workshops are drawn procedurally until their Studio art is approved.
const workshop=(id,name,cost,time,description,{czechName,buildingCategory})=>({id,name,czechName,category:'building',buildingCategory,sprite:`/assets/buildings/${id}/${id}.svg`,
  width:2,height:2,walkable:false,collectible:false,buildable:true,cost,constructionTime:time,recommendsCompletedBuildings:id==='weaver'?['flax_field']:['weaver'],
  workplace:WORKPLACES[id],recipe:PRODUCTION_RECIPES[id],autoEmployment:true,bufferCapacity:FOOD_RULES.bufferCapacity,
  interactions:['manage_workers'],description,renderMode:'procedural',renderer:'food_building',origin:{x:.5,y:.9},visualHeight:96,depth:{offset:0},
  shadow:{baked:true,x:8,y:-12,width:100,height:36,color:0x30291c,alpha:.3}});

export const textileDefinitions=[
  workshop('weaver','Weaver',{wood:12,stone:2},30000,'Two Weavers weave 3 Flax into 2 Cloth with 40 seconds of active work. Cloth goes to a Warehouse; residents wear it out.',{czechName:'Tkalcovna',buildingCategory:'industry'}),
  workshop('tailor','Tailor',{wood:10,stone:4},30000,'A Tailor sews 3 Cloth into 1 Light Armor (a padded jacket) with 45 seconds of active work. Light Armor goes to an Armory.',{czechName:'Krejčovství',buildingCategory:'defense'}),
  {id:'cloth',name:'Cloth',inventoryLabel:'Cloth',inventoryHideZero:true,symbol:'▤',inventoryOrder:18,quantityNames:['Cloth','Cloth','Cloth'],category:'resource',resourceCategory:'processed_material',loadUnits:2,
    sprite:'/assets/resources/cloth/cloth.svg',width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],
    description:'Linen cloth woven from Flax. Residents need it for clothes; the Tailor sews Light Armor from it. Kept in a Warehouse.',
    renderMode:'sprite',origin:{x:.5,y:.75},visualHeight:28,visual:{displayWidth:32,displayHeight:28},depth:{offset:.08}},
];
