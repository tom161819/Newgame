import { POPULATION } from '../jobs.js';
// Each completed House raises the resident capacity by POPULATION.houseCapacity (5).
export const housingBuildings=[
  {id:'house',name:'House',width:2,height:2,cost:{wood:10,stone:4},constructionTime:20000,visualHeight:129,buildable:true,
    housing:{capacity:POPULATION.houseCapacity},description:`A family home. Each completed House gives room for ${POPULATION.houseCapacity} more residents.`},
].map(d=>({...d,category:'building',buildingCategory:'housing',sprite:`/assets/buildings/${d.id}/${d.id}.svg`,walkable:false,collectible:false,
  interactions:[],renderMode:'procedural',renderer:'food_building',origin:{x:.5,y:.9},depth:{offset:0},
  shadow:{baked:true,x:10,y:-10,width:d.width*59,height:d.height*21,color:0x30291c,alpha:.3}}));
