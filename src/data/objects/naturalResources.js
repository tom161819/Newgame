import { FORESTRY,TREE_STAGES } from '../naturalResources.js';
import { WORKPLACES } from '../workplaces.js';
export const naturalDefinitions=[['oak_tree','Oak'],['pine_tree','Pine']].map(([id,name])=>({
  id,name,category:'resource',sprite:`/assets/resources/${id}/${id}.svg`,width:1,height:1,walkable:false,collectible:false,buildable:false,cost:{},interactions:['chop_tree'],
  description:`A renewable ${name.toLowerCase()} tree. Mature trees provide ${FORESTRY.trees[id].wood} Wood after physical chopping; stumps regrow over 1 + 3 + 4 game days before seasonal modifiers.`,
  tree:{...FORESTRY.trees[id],stages:TREE_STAGES},renderMode:'procedural',renderer:'tree',origin:{x:.5,y:.94},visualHeight:id==='pine_tree'?104:88,depth:{offset:.12},
  visual:{hitArea:{x:-27,y:id==='pine_tree'?-104:-88,width:54,height:id==='pine_tree'?112:96}},
}));
export const forestryBuildings=[{id:'lumberjack_hut',name:'Lumberjack Hut',category:'building',buildingCategory:'industry',sprite:'/assets/buildings/lumberjack_hut/lumberjack_hut.svg',width:2,height:2,walkable:false,collectible:false,buildable:true,cost:{wood:6},constructionTime:25000,workplace:WORKPLACES.lumberjack_hut,workRadius:18,
  description:'A Woodcutter reserves mature trees within 18 tiles, physically chops them and carries timber to existing storage.',interactions:['manage_workers'],renderMode:'procedural',renderer:'workplace',origin:{x:.5,y:.9},visualHeight:110,depth:{offset:0},shadow:{baked:true,x:12,y:-15,width:118,height:42,color:0x30291c,alpha:.3}}];
