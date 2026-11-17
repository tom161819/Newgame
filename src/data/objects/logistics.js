import { FOOD_RESOURCE_IDS } from '../foodProduction.js';
import { LOGISTICS_RULES,YARD_RESOURCES } from '../logistics.js';
import { TRADE_RULES } from '../trade.js';
export const logisticsBuildings=[
  {id:'warehouse',name:'Warehouse',width:3,height:3,cost:{stone:10,wood:4},constructionTime:30000,visualHeight:125,buildable:true,
    storage:{capacity:200,resources:['pitch','torch','cloth'],accepts:'materials'},description:'A physical store for 200 crafted goods such as pitch, torches and cloth. Wood, stone, ore and iron go to a Material Yard.'},
  // m-sklady-materialu-koncept (21): an open yard only for raw building materials; its four fields show growing piles.
  {id:'material_yard',name:'Material Yard',width:4,height:2,cost:{wood:20},constructionTime:20000,visualHeight:40,buildable:true,
    storage:{capacity:LOGISTICS_RULES.yardCapacity,resources:[...YARD_RESOURCES],accepts:'yard'},renderer:'material_yard',
    description:`An open, fenced yard for ${LOGISTICS_RULES.yardCapacity} units of wood, stone, iron ore and iron. Haulers bring them here; the piles grow with the stock.`},
  {id:'starter_stockpile',name:'Starter Stockpile',width:2,height:2,cost:{},visualHeight:55,buildable:false,starter:true,
    storage:{capacity:LOGISTICS_RULES.starterCapacity,resources:['stone','wood','iron',...FOOD_RESOURCE_IDS],accepts:'all'},description:`A starting store with space for ${LOGISTICS_RULES.starterCapacity} materials and food units combined.`},
  // Trade F1.1 (#59): goods space and loading spots; caravans and orders follow in F1.2 and F1.3.
  {id:'marketplace',name:'Marketplace',width:4,height:4,legacyFootprint:{width:3,height:3}/* owner 13 Nov 2026: the GPT market square is 4 × 4; markets of older saves stay 3 × 3 */,cost:{stone:12,wood:8},constructionTime:30000,visualHeight:90,buildable:true,
    // m-trziste-bez-skladu (owner, 12 Nov): no longer needs a Warehouse; goods come from any store.
    trade:{capacity:TRADE_RULES.marketplaceCapacity,loadingSpots:TRADE_RULES.loadingSpots},
    // Provisional sprite (stalls on a paved square) scaled to the 3×3 footprint; the plate's front corner is the anchor.
    renderMode:'sprite',origin:{x:.5,y:.964},visual:{displayWidth:209,displayHeight:183},
    description:`A market square with stalls where merchant caravans will trade. Goods space for ${TRADE_RULES.marketplaceCapacity} units and ${TRADE_RULES.loadingSpots} loading spots.`},
].map(d=>({...d,category:'building',buildingCategory:'logistics',sprite:`/assets/buildings/${d.id}/${d.id}.svg`,walkable:false,collectible:false,
  interactions:[d.trade?'open_market':'inspect_storage'],renderMode:d.renderMode??'procedural',renderer:d.renderer??'food_building',origin:d.origin??{x:.5,y:.9},depth:{offset:0},
  shadow:{baked:true,x:10,y:-10,width:d.width*59,height:d.height*21,color:0x30291c,alpha:.3}}));
export const materialDefinitions=[
  {id:'wood',name:'Wood',symbol:'🪵',inventoryOrder:12,description:'Timber stored in a Material Yard or Starter Stockpile.'},
].map(d=>({...d,inventoryLabel:d.name,quantityNames:[d.name,d.name,d.name],category:'resource',sprite:`/assets/resources/${d.id}/${d.id}.svg`,
  width:1,height:1,walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],renderMode:'sprite',origin:{x:.5,y:.75},visualHeight:28,visual:{displayWidth:28,displayHeight:28},depth:{offset:.08}}));
