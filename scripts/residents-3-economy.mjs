// m-obyvatele-jmena-spanek-pohyb (43): headless economy measurement for the walking speed change.
// A fixed seeded scene: a Lumberjack Hut with 3 Woodcutters and 40 mature trees 3–16 tiles away, a Hunting Lodge
// with 2 Hunters and 20 rabbits 5–17 tiles away. Prints wood and meat delivered per game day over 3 game days (rest
// at night included). Run: node scripts/residents-3-economy.mjs (TREES=n RABBITS=n change the scene).
import { workerScene,ensureBuildingPrerequisites } from '../tests/helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { treeState } from '../src/data/naturalResources.js';

globalThis.document??={querySelector:()=>({textContent:''})};
let seed=12345;Math.random=()=>{seed=(Math.imul(seed,1103515245)+12345)>>>0;return seed/4294967296;};
const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true,starter:true});s.workerSystem.unsubscribe();
function build(type,x,y){
  const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [r,k]of Object.entries(d.cost))s.inventory.add(r,k);
  const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});
  if(r.error)throw new Error(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;
}
const hut=build('lumberjack_hut',44,43),lodge=build('hunting_lodge',30,40);
const free=(x,y)=>s.map[y]?.[x]===0&&!s.resourceOccupancy.has(`${x},${y}`)&&!s.reservedTiles().some(t=>t.x===x&&t.y===y);
let trees=0;for(let i=0;i<400&&trees<(+process.env.TREES||40);i++){const a=Math.random()*Math.PI*2,r=3+Math.random()*13,x=Math.round(45+Math.cos(a)*r),y=Math.round(44+Math.sin(a)*r);
  if(!free(x,y))continue;const n=treeState(`tree-${s.naturalResources.nextId++}`);n.ageCheckpoint=s.naturalResources.ageClock;n.growthCheckpoint=s.naturalResources.growthClock;s.addResource(s.objectRegistry.require('oak_tree'),{x,y},n);trees++;}
let rabbits=0;for(let i=0;i<400&&rabbits<(+process.env.RABBITS||20);i++){const a=Math.random()*Math.PI*2,r=5+Math.random()*12,x=Math.round(31+Math.cos(a)*r),y=Math.round(41+Math.sin(a)*r);if(!free(x,y))continue;s.animalSystem.create(s.objectRegistry.require('rabbit'),{x,y});rabbits++;}
const workers=[];for(let y=46;y<60&&workers.length<5;y++)for(let x=36;x<44&&workers.length<5;x++)if(free(x,y)){const w=s.workerSystem.create({x,y});s.workplaceSystem.assign(workers.length<3?hut:lodge,w);workers.push(w);}
const count=r=>s.inventory.count(r);const days=3,day=s.gameTime.dayDuration,rows=[];let wood=count('wood'),meat=count('meat');
const firstAt={};for(let d=1;d<=days;d++){for(let t=0;t<day;t+=1000){s.simulate(1000);for(const [k,goal]of [['wood120',120],['meat50',50]]){const r=k.startsWith('wood')?'wood':'meat';if(firstAt[k]==null&&count(r)>=goal)firstAt[k]=+(((d-1)*day+t+1000)/day).toFixed(3);}}rows.push({day:d,wood:count('wood')-wood,meat:count('meat')-meat});wood=count('wood');meat=count('meat');}
const total=rows.reduce((a,r)=>({wood:a.wood+r.wood,meat:a.meat+r.meat}),{wood:0,meat:0});
console.log(JSON.stringify({trees,rabbits,dayMs:day,rows,reachedOnDay:firstAt,total,perDay:{wood:+(total.wood/days).toFixed(2),meat:+(total.meat/days).toFixed(2)}}));
