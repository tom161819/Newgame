import { POPULATION } from '../jobs.js';
import { VILLAGE_GREEN,HOUSE_DECORATIONS } from '../children.js';
// Each completed House raises the resident capacity by POPULATION.houseCapacity (5).
export const housingBuildings=[
  {id:'house',name:'House',width:2,height:2,cost:{wood:10},constructionTime:20000,visualHeight:129,buildable:true,
    housing:{capacity:POPULATION.houseCapacity},description:`A family home. Each completed House gives room for ${POPULATION.houseCapacity} more residents.`},
].map(d=>({...d,category:'building',buildingCategory:'housing',sprite:`/assets/buildings/${d.id}/${d.id}.svg`,walkable:false,collectible:false,
  interactions:[],renderMode:'procedural',renderer:'food_building',origin:{x:.5,y:.9},depth:{offset:0},
  shadow:{baked:true,x:10,y:-10,width:d.width*59,height:d.height*21,color:0x30291c,alpha:.3}}));
// Children and the Village Green D1: a 3×3 grass square in the middle of the houses. People walk across it (it is not
// a path and nothing can be built on it). Houses within 10 tiles get +4 happiness, family houses +2 more; children
// play there and a few residents sit there in the evening. Provisional drawing until the Studio art is approved.
housingBuildings.push({id:'village_green',name:'Village Green',width:3,height:3,cost:{wood:6},constructionTime:15000,visualHeight:70,buildable:true,
  requiresCompletedBuildings:['house'],unlockDescription:'Requires a completed House before placing a Village Green.',
  villageGreen:{range:VILLAGE_GREEN.range,happiness:VILLAGE_GREEN.happiness,familyBonus:VILLAGE_GREEN.familyBonus},
  description:`A grass square with a linden tree where children play and neighbours meet in the evening. Houses within ${VILLAGE_GREEN.range} tiles: +${VILLAGE_GREEN.happiness} happiness, family houses +${VILLAGE_GREEN.familyBonus} more.`,
  category:'building',buildingCategory:'housing',sprite:'/assets/buildings/village_green/village_green.svg',walkable:true,collectible:false,interactions:[],
  renderMode:'procedural',renderer:'village_green',origin:{x:.5,y:.9},depth:{offset:0}});
// Children and the Village Green D2: decorations by the houses (1×1, Housing menu). Provisional drawings until the
// Studio art (g-deti-naves-grafika) is approved. Not on water, a ford, a worn path or paving; the Haystack only near a farm.
// m-staveni-zdi-studna (61): the Well is the exception: anywhere buildable (paths and paving too).
const W=HOUSE_DECORATIONS;
housingBuildings.push(...[
  {id:'swing_tree',name:'Swing Tree',cost:{wood:4},constructionTime:6000,visualHeight:90,requiresCompletedBuildings:['house'],
    unlockDescription:'Requires a completed House before placing a Swing Tree.',decoration:{kind:'swing_tree',range:W.swing_tree.range,happiness:W.swing_tree.happiness},
    description:`An old tree with a swing. Houses within ${W.swing_tree.range} tiles: +${W.swing_tree.happiness} happiness; children swing on it.`},
  {id:'haystack',name:'Haystack',cost:{wood:2},constructionTime:4000,visualHeight:44,requiresCompletedBuildings:['farmhouse'],
    unlockDescription:'Requires a completed Farmhouse before placing a Haystack.',decoration:{kind:'haystack',farmRange:W.haystack.farmRange},
    description:`A stack of hay by a farm (within ${W.haystack.farmRange} tiles of a Farmhouse or Wheat Field). Children jump into it.`},
  {id:'well',name:'Well',cost:{stone:6,wood:2},constructionTime:10000,visualHeight:60,requiresCompletedBuildings:['house'],
    unlockDescription:'Requires a completed House before placing a Well.',decoration:{kind:'well',range:W.well.range,happiness:W.well.happiness},
    description:`A stone well. Houses within ${W.well.range} tiles: +${W.well.happiness} happiness.`},
].map(d=>({...d,width:1,height:1,buildable:true,category:'building',buildingCategory:'housing',sprite:`/assets/buildings/${d.id}/${d.id}.svg`,walkable:false,
  collectible:false,interactions:[],renderMode:'procedural',renderer:'decoration',origin:{x:.5,y:.9},depth:{offset:0}})));
