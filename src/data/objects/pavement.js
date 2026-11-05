import { PAVEMENT } from '../pavement.js';
// Stone Pavement blueprints: every order alternates a paid tile (1 Stone) and a joint tile (free), so an order of N new
// tiles costs ceil(N/2) Stone through the ordinary site logistics. A finished tile becomes the pavement terrain layer
// (PathWearSystem.paved) and its site record is removed, so thousands of tiles are not thousands of buildings.
const base={category:'building',buildingCategory:'infrastructure',width:1,height:1,walkable:true,collectible:false,constructionTime:PAVEMENT.workPerTile,
  interactions:[],renderMode:'procedural',renderer:'pavement',origin:{x:.5,y:.5},visualHeight:0,depth:{offset:-1},pavement:true,construction:{mode:'pavement'},
  sprite:'/assets/buildings/stone_pavement/stone_pavement.svg'};
export const pavementDefinitions=[
  {...base,id:'stone_pavement',name:'Stone Pavement',buildable:true,cost:{stone:1},description:'A permanent cobbled surface: +25 % movement speed. 1 Stone for every 2 new tiles. Build single tiles, lines or whole courtyards.'},
  {...base,id:'stone_pavement_joint',name:'Stone Pavement',buildable:false,cost:{},description:'The free second tile of a Stone Pavement pair.'},
];
