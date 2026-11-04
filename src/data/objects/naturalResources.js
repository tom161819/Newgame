import { FORESTRY,TREE_STAGES } from '../naturalResources.js';
export const naturalDefinitions=[['oak_tree','Oak'],['pine_tree','Pine']].map(([id,name])=>({
  id,name,category:'resource',sprite:`/assets/resources/${id}/${id}.svg`,width:1,height:1,walkable:false,collectible:false,buildable:false,cost:{},interactions:['chop_tree'],
  description:`A renewable ${name.toLowerCase()} tree. Mature trees provide ${FORESTRY.trees[id].wood} Wood after physical chopping; stumps regrow over 1 + 3 + 4 game days before seasonal modifiers.`,
  tree:{...FORESTRY.trees[id],stages:TREE_STAGES},renderMode:'procedural',renderer:'tree',origin:{x:.5,y:.94},visualHeight:id==='pine_tree'?104:88,depth:{offset:.12},
  visual:{hitArea:{x:-27,y:id==='pine_tree'?-104:-88,width:54,height:id==='pine_tree'?112:96}},
}));
