// Functional placeholder explicitly authorized by #118; final art remains #119.
export const builderWorkshopDefinitions=[{
  id:'builder_workshop',name:"Builders' Workshop",category:'building',buildingCategory:'industry',sprite:'/assets/buildings/warehouse/warehouse.svg',
  width:2,height:2,walkable:false,collectible:false,buildable:true,cost:{stone:6,wood:8},constructionTime:25000,builderBase:true,
  interactions:[],renderMode:'procedural',renderer:'workplace',origin:{x:.5,y:.9},visualHeight:80,depth:{offset:0},
  description:'Optional shared base for Builders. A reachable completed workshop restores normal construction speed; without one Builders work at 50%. Movement, carrying, Farmers, the King and demolition are unchanged. Temporary placeholder appearance.',
  shadow:{baked:true,x:12,y:-15,width:118,height:42,color:0x30291c,alpha:.3},
}];
