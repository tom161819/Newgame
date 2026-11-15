export const FORESTRY=Object.freeze({
  initialTrees:200,clusters:8,protectedRadius:7,refreshInterval:1000,
  stageDays:Object.freeze([1,3,4,Infinity]),
  // m-cesta-bez-stromku (owner, 12 Nov): on a worn path of this level or more (and on paving) stumps do not sprout and
  // young trees wither back to a stump; a grown tree stays.
  pathBlocksGrowthLevel:2,
  // m-parezy-na-ceste (owner 14 Nov 2026, point 33): a stump on such a path rots away after this many days (it is no
  // longer drawn). When the path fades again, the stump comes back and may sprout.
  stumpRotDays:3,
  seasonGrowth:Object.freeze({Spring:1.25,Summer:1.1,Autumn:.75,Winter:0}),
  // m-drevo-start (playtest 0.76.0 #2): the Lumberjack Hut +50 % – chopping takes 7 s instead of 15 s (the wood per tree
  // stays, so 3 Woodcutters × 6 still fit the 20-unit hut pile and saves keep their reservations).
  // Saves from before keep partial chopping up to the earlier 15 s (the tree then falls at the next work step).
  legacyChopDuration:15000,
  // m-drevorubci-stromy (playtest 0.83.0 #1): after felling, a Woodcutter plants a sapling on the stump with this chance
  // (it skips the stump day); young trees and stumps inside a finished Lumberjack Hut's radius grow this much faster.
  // Both are Dev tool values (Forest and wood); `surplusDays`: a Woodcutter without a tree to fell for this long leaves
  // a hut with more Woodcutters than mature trees (automatic employment on).
  saplingChance:.5,hutGrowthBoost:1.5,surplusDays:1,
  trees:Object.freeze({oak_tree:Object.freeze({wood:6,xp:15,chopDuration:7000}),pine_tree:Object.freeze({wood:5,xp:12,chopDuration:7000})}),
});
// m-duby (owner 15 Nov 2026): an old oak on 2 × 2. A grown oak (stage 3, one tile) that is `ageDays` old tries once a
// day to spread onto the three tiles beside it (x+1, y+1); where there is no room it stays the middle oak. A grand
// oak gives `wood`. World: `worldShare` of the grown oaks get a gap in the forest and start grand; `lone` small groups
// of 1–4 oaks per 1 000 land tiles stand outside the forests.
export const GRAND_OAK=Object.freeze({wood:10,ageDays:14,worldShare:.14,lonePer1000:1.2,loneGroup:Object.freeze([1,1,2,2,3,4])});
export const grandTiles=tile=>[{x:tile.x,y:tile.y},{x:tile.x+1,y:tile.y},{x:tile.x,y:tile.y+1},{x:tile.x+1,y:tile.y+1}];
// A fixed number per tile: which oaks can ever become grand (half of them, so forests keep both sizes) and which get
// a gap when the world is made.
export const tileHash=tile=>(Math.imul((tile?.x??0)+17,374761393)^Math.imul((tile?.y??0)+29,668265263))>>>0;
export const oakCanSpread=tile=>(tileHash(tile)>>>6)%2===0;
export const oakStartsGrand=tile=>(tileHash(tile)>>>9)%1000<GRAND_OAK.worldShare*1000;
export const isGrand=object=>object?.type==='oak_tree'&&object.natural?.stage===3&&object.natural.grand===true;
export const TREE_STAGES=Object.freeze(['Stump','Sapling','Young tree','Mature tree']);
export const stumpGone=natural=>!!natural&&natural.stage===0&&(natural.rot??0)>=FORESTRY.stumpRotDays;
export const treeBlocks=object=>!!object?.natural&&object.natural.stage===3;
export const emptyNaturalState=()=>({nextId:1,nextDepositId:1,growthClock:0,ageClock:0,refreshElapsed:0,kingTask:null,rockMining:{records:[]}});
export function treeState(id,{stage=3,growthDays=0,ageDays=8,cycle=0}={}){return{id,kind:'tree',stage,growthDays,ageDays,cycle,workDone:0,growthCheckpoint:0,ageCheckpoint:0};}
