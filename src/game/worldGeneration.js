import { COLUMNS, ROWS, PLAYER_START } from './config.js';
import { createMap } from './map.js';
import { GROUND, GROUND_CODES, WORLD_GENERATION as W, WATER_CELL, BUSH_TYPES, GRASS_BUSHES, isWaterGround } from '../data/worldTerrain.js';
import { settingsFromLevels } from '../data/worldCode.js';

// #100 New-game world: rock outcrops (createMap), then one meandering river with sandbar fords across the whole
// map, one lake, one desert and clusters of bushes. Pure and driven by the injected random(), so a seeded random
// gives the same world. The start area stays plain grass, so the castle, stockpile and first houses always fit.
const between=(random,[a,b])=>a+random()*(b-a);
const START={x:PLAYER_START.x+.5,y:PLAYER_START.y+.5};
const centre=(x,y)=>({x:x+.5,y:y+.5});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const inside=(x,y)=>x>=0&&y>=0&&x<COLUMNS&&y<ROWS;

export function emptyGround(){return Array.from({length:ROWS},()=>Array(COLUMNS).fill(GROUND.GRASS));}
// Map cell for one tile: rock 1, water WATER_CELL (blocked, see-through), otherwise open.
export function mapCell(rock,ground){return rock?1:isWaterGround(ground)?WATER_CELL:0;}
export function mapFromWorld(terrain,ground=null){return terrain.map((row,y)=>row.map((rock,x)=>mapCell(rock,ground?.[y]?.[x]??GROUND.GRASS)));}

// The river's centre line: a slow meander plus a ripple, as points every half tile along its axis. It must keep
// its distance from the start; a few tries pick another side, course or amplitude.
function riverLine(random,o){
  for(let attempt=0;attempt<24;attempt++){
    const vertical=random()<.5,side=random()<.5?-1:1,base=50+side*between(random,[17,31]);
    const amplitude=between(random,W.river.amplitude)*o.meanders*(attempt>12?.5:1),wavelength=between(random,W.river.wavelength),phase=random()*Math.PI*2;
    const ripple=between(random,W.river.ripple)*Math.min(1,o.meanders),rippleLength=between(random,W.river.rippleWavelength),ripplePhase=random()*Math.PI*2;
    const points=[];
    for(let t=-6;t<=(vertical?ROWS:COLUMNS)+6;t+=.5){const c=base+amplitude*Math.sin(t/wavelength*2*Math.PI+phase)+ripple*Math.sin(t/rippleLength*2*Math.PI+ripplePhase);points.push(vertical?{x:c,y:t,t}:{x:t,y:c,t});}
    if(Math.min(...points.map(p=>distance(p,START)))>W.startClear+4)return points;
  }
  return null;
}

function paintRiver(ground,random,o){
  const points=o.rivers?riverLine(random,o):null,near=Array.from({length:ROWS},()=>Array(COLUMNS).fill(Infinity));
  if(!points)return {near,fords:[]};
  const widthPhase=random()*Math.PI*2,beachPhase=random()*Math.PI*2;
  const half=t=>o.riverWidth*(W.river.width[0]+(W.river.width[1]-W.river.width[0])*(.5+.5*Math.sin(t/13+widthPhase)))/2;
  const beach=t=>o.sandyBanks*(W.river.beach[0]+(W.river.beach[1]-W.river.beach[0])*(.5+.5*Math.sin(t/9+beachPhase)));
  const fordAt=[];for(let t=between(random,[8,20]);t<Math.max(ROWS,COLUMNS)-7;t+=between(random,W.river.fordSpacing)*o.fordSpacing)fordAt.push(t);
  const fords=[];
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++){
    const c=centre(x,y);let best=Infinity,t=0;
    for(const p of points){const d=(p.x-c.x)**2+(p.y-c.y)**2;if(d<best){best=d;t=p.t;}}
    const d=Math.sqrt(best),h=half(t);near[y][x]=d;
    if(d<h+W.river.shallow){
      if(fordAt.some(f=>Math.abs(t-f)<=W.river.fordHalfWidth)){ground[y][x]=GROUND.BEACH;fords.push({x,y});}
      else ground[y][x]=d<h?GROUND.DEEP:GROUND.SHALLOW;
    }else if(d<h+W.river.shallow+beach(t))ground[y][x]=GROUND.BEACH;
  }
  return {near,fords};
}

// A blob with an uneven rim: ratio < 1 inside, 1 on the rim.
function blob(random,radius){
  const a=random()*Math.PI*2,b=random()*Math.PI*2,c=random()*Math.PI*2;
  return (dx,dy)=>{const angle=Math.atan2(dy,dx);return Math.hypot(dx,dy)/(radius*(1+.18*Math.sin(2*angle+a)+.11*Math.sin(3*angle+b)+.05*Math.sin(5*angle+c)));};
}
function pickCentre(random,test,margin){
  for(let attempt=0;attempt<400;attempt++){const p={x:margin+random()*(COLUMNS-2*margin),y:margin+random()*(ROWS-2*margin)};if(test(p))return p;}
  return null;
}

function paintLake(ground,near,random,o,others=[]){
  const radius=between(random,W.lake.radius);
  const at=pickCentre(random,p=>distance(p,START)>=W.lake.startDistance&&(near[Math.floor(p.y)]?.[Math.floor(p.x)]??Infinity)>=radius+W.lake.riverDistance&&others.every(l=>distance(p,l)>=radius+l.radius+6),radius+3);
  if(!at)return null;
  const shape=blob(random,radius),rim=1+1.7*o.sandyBanks/radius;
  for(let y=Math.floor(at.y-radius*2);y<=at.y+radius*2;y++)for(let x=Math.floor(at.x-radius*2);x<=at.x+radius*2;x++){
    if(!inside(x,y)||isWaterGround(ground[y][x]))continue;const c=centre(x,y),ratio=shape(c.x-at.x,c.y-at.y);
    if(ratio<.6)ground[y][x]=GROUND.DEEP;else if(ratio<1)ground[y][x]=GROUND.SHALLOW;else if(ratio<rim)ground[y][x]=GROUND.BEACH;
  }
  return {x:Math.floor(at.x),y:Math.floor(at.y),radius};
}

function paintDesert(ground,near,lakes,random,o){
  if(!o.desert)return null;
  const radius=between(random,W.desert.radius)*o.desert;
  const at=pickCentre(random,p=>distance(p,START)>=W.desert.startDistance+Math.max(0,radius-15)&&(near[Math.floor(p.y)]?.[Math.floor(p.x)]??Infinity)>=radius*.6+W.desert.riverDistance&&lakes.every(lake=>distance(p,lake)>=radius+lake.radius+4),6);
  if(!at)return null;
  const shape=blob(random,radius),tiles=[];
  for(let y=Math.floor(at.y-radius*1.6);y<=at.y+radius*1.6;y++)for(let x=Math.floor(at.x-radius*1.6);x<=at.x+radius*1.6;x++){
    if(!inside(x,y)||ground[y][x]!==GROUND.GRASS)continue;const c=centre(x,y),ratio=shape(c.x-at.x,c.y-at.y);
    // The rim is dithered, so sand thins out into the grass instead of ending on a hard line.
    if(ratio<1||ratio<1.2&&random()<(1.2-ratio)/.2&&distance(c,START)>W.startClear){ground[y][x]=GROUND.DESERT;tiles.push({x,y});}
  }
  return {x:Math.floor(at.x),y:Math.floor(at.y),radius,tiles};
}

function isNearWater(ground,x,y,r){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(isWaterGround(ground[y+dy]?.[x+dx]))return true;return false;}
function weighted(random,list){let r=random();for(const [value,weight]of list){if((r-=weight)<0)return value;}return list.at(-1)[0];}
function placeBushes(terrain,ground,desert,random,o,near){
  const bushes=new Map(),free=(x,y)=>inside(x,y)&&terrain[y][x]===0&&distance(centre(x,y),START)>W.bushClear;
  const grass=[];for(let y=2;y<ROWS-2;y++)for(let x=2;x<COLUMNS-2;x++)if(ground[y][x]===GROUND.GRASS&&free(x,y))grass.push({x,y});
  const clusters=Math.round(W.bushes.clusters*o.bushes);
  for(let cluster=0;cluster<clusters&&grass.length;cluster++){
    const at=grass[Math.floor(random()*grass.length)],count=Math.round(between(random,W.bushes.perCluster)),kind=weighted(random,GRASS_BUSHES);
    for(let attempt=0,placed=0;attempt<count*4&&placed<count;attempt++){
      const angle=random()*Math.PI*2,r=Math.sqrt(-2*Math.log(1-random()*.999))*W.bushes.spread*.6,x=Math.round(at.x+Math.cos(angle)*r),y=Math.round(at.y+Math.sin(angle)*r),key=`${x},${y}`;
      if(!free(x,y)||ground[y][x]!==GROUND.GRASS||bushes.has(key))continue;
      // Mostly one kind per cluster, with a few of the others mixed in.
      bushes.set(key,random()<.75?kind:weighted(random,GRASS_BUSHES));placed++;
    }
  }
  // Bank vegetation (level 5 = none extra, as in 0.14.0): extra clusters along the water above 5, fewer bushes by the water below.
  const bank=grass.filter(t=>(near?.[t.y]?.[t.x]??Infinity)<9||isNearWater(ground,t.x,t.y,3));
  if(o.bankVegetation<1)for(const [key]of [...bushes]){const [x,y]=key.split(',').map(Number);if(isNearWater(ground,x,y,3)&&random()>o.bankVegetation)bushes.delete(key);}
  for(let cluster=0;cluster<Math.round((o.bankVegetation-1)*8)&&bank.length;cluster++){
    const at=bank[Math.floor(random()*bank.length)],kind=weighted(random,GRASS_BUSHES);
    for(let i=0;i<6;i++){const x=at.x+Math.round((random()-.5)*4),y=at.y+Math.round((random()-.5)*4),key=`${x},${y}`;if(free(x,y)&&ground[y][x]===GROUND.GRASS&&!bushes.has(key))bushes.set(key,kind);}
  }
  const sand=(desert?.tiles??[]).filter(t=>free(t.x,t.y));
  for(let i=0;i<W.desert.scrub&&sand.length;i++){const [t]=sand.splice(Math.floor(random()*sand.length),1);bushes.set(`${t.x},${t.y}`,BUSH_TYPES.indexOf('bush_scrub'));}
  return bushes;
}

// options.levels: world code levels (default: today's world). options.streams: part → random (seeded worlds); without
// it every part draws from `random` in a fixed order, as in 0.14.0 tests.
export function generateWorld(random=Math.random,{levels,streams}={}){
  const o=settingsFromLevels(levels),rng=streams??(()=>random);
  const terrain=createMap(rng('rocks'),{outcrops:Math.round(65*o.rocks)}),ground=emptyGround();
  const {near,fords}=paintRiver(ground,rng('river'),o),lakes=[];
  for(let i=0;i<o.lakes;i++){const lake=paintLake(ground,near,rng(i?`lake${i+1}`:'lake'),o,lakes);if(lake)lakes.push(lake);}
  const desert=paintDesert(ground,near,lakes,rng('desert'),o);
  // No rock in water, and none on or right beside a ford, so every crossing stays open.
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++)if(isWaterGround(ground[y][x]))terrain[y][x]=0;
  for(const f of fords)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(inside(f.x+dx,f.y+dy)&&!isWaterGround(ground[f.y+dy][f.x+dx]))terrain[f.y+dy][f.x+dx]=0;
  const bushes=placeBushes(terrain,ground,desert,rng('bushes'),o,near);
  return {terrain,ground,bushes,summary:{fords:fords.length,lake:lakes[0]?{x:lakes[0].x,y:lakes[0].y}:null,lakes:lakes.length,desert:desert?{x:desert.x,y:desert.y}:null}};
}

// Save format: one string of ground digits per row; bushes as [x, y, type index].
export function exportGround(ground){return ground.map(row=>row.join(''));}
export function importGround(rows){return rows.map(row=>[...row].map(Number));}
export function validGroundRows(rows){return Array.isArray(rows)&&rows.length===ROWS&&rows.every(row=>typeof row==='string'&&row.length===COLUMNS&&[...row].every(c=>GROUND_CODES.includes(Number(c))));}
export function exportBushes(bushes){return [...bushes].map(([key,type])=>{const [x,y]=key.split(',').map(Number);return [x,y,type];}).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);}
export function importBushes(list){return new Map(list.map(([x,y,type])=>[`${x},${y}`,type]));}
