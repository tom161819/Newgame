export const FORESTRY=Object.freeze({
  initialTrees:200,clusters:8,protectedRadius:7,refreshInterval:1000,
  stageDays:Object.freeze([1,3,4,Infinity]),
  seasonGrowth:Object.freeze({Spring:1.25,Summer:1.1,Autumn:.75,Winter:0}),
  // m-drevo-start (playtest 0.76.0 #2): the Lumberjack Hut +50 % – chopping takes 7 s instead of 15 s (the wood per tree
  // stays, so 3 Woodcutters × 6 still fit the 20-unit hut pile and saves keep their reservations).
  // Saves from before keep partial chopping up to the earlier 15 s (the tree then falls at the next work step).
  legacyChopDuration:15000,
  trees:Object.freeze({oak_tree:Object.freeze({wood:6,xp:15,chopDuration:7000}),pine_tree:Object.freeze({wood:5,xp:12,chopDuration:7000})}),
});
export const TREE_STAGES=Object.freeze(['Stump','Sapling','Young tree','Mature tree']);
export const treeBlocks=object=>!!object?.natural&&object.natural.stage===3;
export const emptyNaturalState=()=>({nextId:1,nextDepositId:1,growthClock:0,ageClock:0,refreshElapsed:0,kingTask:null,rockMining:{records:[]}});
export function treeState(id,{stage=3,growthDays=0,ageDays=8,cycle=0}={}){return{id,kind:'tree',stage,growthDays,ageDays,cycle,workDone:0,growthCheckpoint:0,ageCheckpoint:0};}
