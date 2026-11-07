import { COLUMNS, ROWS, PLAYER_START } from './config.js';
import { GROUND, GROUND_CODES, WORLD_GENERATION as W, WATER_CELL, BUSH_TYPES, GRASS_BUSHES, GRASS_ZONE, GRASS_ZONE_CODES, isWaterGround, isRiverGround } from '../data/worldTerrain.js';
import { settingsFromLevels } from '../data/worldCode.js';

// World generator 2 (World v2 step 2a, zadani-svet-v2.md). Everything is drawn from named random streams (see
// seededRandom.js), so the same world code gives the same world:
// - a river 3.5–5 tiles wide that narrows at stony fords (FORD, walkable at ×0.6) and widens into pools, with an
//   optional narrower tributary;
// - banks that change by stretch: sandy beach (more on the inner side of bends), grass with reeds, mud, pebbles;
// - lakes, a desert, rock outcrops mostly in stony country and at the desert's edge;
// - grass zones (meadow, lush, dry, forest floor, flowers, stony) and weights for where forests and stones grow;
// - a fair start: grass and water near the castle (trees and stones are checked where they are placed).
// Without `streams`, every part draws from the one `random` (tests).
const between=(random,[a,b])=>a+random()*(b-a);
const START={x:PLAYER_START.x+.5,y:PLAYER_START.y+.5};
const centre=(x,y)=>({x:x+.5,y:y+.5});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const inside=(x,y)=>x>=0&&y>=0&&x<COLUMNS&&y<ROWS;
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
const index=(x,y)=>y*COLUMNS+x;

export function emptyGround(){return Array.from({length:ROWS},()=>Array(COLUMNS).fill(GROUND.GRASS));}
export function emptyZones(){return Array.from({length:ROWS},()=>Array(COLUMNS).fill(GRASS_ZONE.MEADOW));}
// Map cell for one tile: rock 1, water WATER_CELL (blocked, see-through), otherwise open (fords included).
export function mapCell(rock,ground){return rock?1:isWaterGround(ground)?WATER_CELL:0;}
export function mapFromWorld(terrain,ground=null){return terrain.map((row,y)=>row.map((rock,x)=>mapCell(rock,ground?.[y]?.[x]??GROUND.GRASS)));}

// Smooth value noise in [0,1] with two octaves; `scale` is the feature size in tiles.
export function valueNoise(random,scale){
  const size=Math.ceil(Math.max(COLUMNS,ROWS)/scale)+3,fine=size*2,grid=[Array.from({length:size*size},()=>random()),Array.from({length:fine*fine},()=>random())];
  const sample=(g,n,x,y)=>{const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),v=(i,j)=>g[(((y0+j)%n+n)%n)*n+(((x0+i)%n+n)%n)];
    return (v(0,0)*(1-sx)+v(1,0)*sx)*(1-sy)+(v(0,1)*(1-sx)+v(1,1)*sx)*sy;};
  return (x,y)=>sample(grid[0],size,x/scale,y/scale)*.7+sample(grid[1],fine,x/scale*2,y/scale*2)*.3;
}

// A meandering centre line, as points every half tile with their position `t` along the axis.
function riverLine(random,o,{base=null,vertical=null,amplitudeRange=W.river.amplitude}={}){
  for(let attempt=0;attempt<24;attempt++){
    const v=vertical??random()<.5,side=random()<.5?-1:1,at=base??50+side*between(random,[17,31]);
    const amplitude=between(random,amplitudeRange)*o.meanders*(attempt>12?.5:1),wavelength=between(random,W.river.wavelength),phase=random()*Math.PI*2;
    const ripple=between(random,W.river.ripple)*Math.min(1,o.meanders),rippleLength=between(random,W.river.rippleWavelength),ripplePhase=random()*Math.PI*2;
    const points=[];
    for(let t=-6;t<=(v?ROWS:COLUMNS)+6;t+=.5){const c=at+amplitude*Math.sin(t/wavelength*2*Math.PI+phase)+ripple*Math.sin(t/rippleLength*2*Math.PI+ripplePhase);points.push(v?{x:c,y:t,t}:{x:t,y:c,t});}
    if(Math.min(...points.map(p=>distance(p,START)))>W.startClear+4)return {points,vertical:v};
  }
  return null;
}
// Bank stretches along t, separately for each side: a roll decides the bank type, `width` its width.
function bankStretches(random,length){
  const out=[];
  for(const side of [-1,1])for(let t=-8;t<length+8;){const len=between(random,W.banks.segment);out.push({side,from:t,to:t+len,roll:random(),width:random()});t+=len;}
  return out;
}
function bankType(stretch,innerBend,o){
  const beach=Math.min(.9,W.banks.beachShare*o.sandyBanks+(innerBend?W.banks.innerBendBonus*o.sandyBanks:0));
  if(stretch.roll<beach)return GROUND.BEACH;
  const rest=(stretch.roll-beach)/(1-beach),w=W.banks.weights;
  return rest<w.grass?GROUND.GRASS:rest<w.grass+w.mud?GROUND.MUD:GROUND.SHORE_ROCKS;
}
const bankWidth=(type,f)=>{const r=type===GROUND.BEACH?W.banks.beach:type===GROUND.MUD?W.banks.mud:type===GROUND.SHORE_ROCKS?W.banks.rocks:[0,0];return r[0]+(r[1]-r[0])*f;};

// Paints one river (main or tributary). Fills per-tile distance, position along it and side into the fields.
function paintRiver(ground,random,o,line,{width,fordSpacing,fordHalfWidth,pools,fields,reeds,offset=0}){
  const {points}=line,length=points.at(-1).t;
  const widthPhase=random()*Math.PI*2,poolPhase=random()*Math.PI*2,poolLength=between(random,[16,28]);
  const lo=Math.min(points[0].t,length),hi=Math.max(points[0].t,length),fordAt=[];for(let t=lo+between(random,[8,20]);t<hi-4;t+=between(random,fordSpacing)*o.fordSpacing)fordAt.push(t);
  const nearFord=t=>fordAt.some(f=>Math.abs(t-f)<=fordHalfWidth+2.5);
  const half=t=>{let w=o.riverWidth*(width[0]+(width[1]-width[0])*(.5+.5*Math.sin(t/W.river2.widthWavelength+widthPhase)));
    if(nearFord(t))w=Math.min(w,W.river2.fordWidth*Math.max(.8,o.riverWidth));
    else if(pools){const p=.5+.5*Math.sin(t/poolLength*2*Math.PI+poolPhase),edge=1-W.river2.poolShare;if(p>edge)w+=W.river2.pool[0]+(W.river2.pool[1]-W.river2.pool[0])*(p-edge)/W.river2.poolShare;}
    return w/2;};
  const stretches=bankStretches(random,length),fords=[];
  const curvature=i=>{i=Math.max(1,Math.min(points.length-2,i));const a=points[i-1],b=points[i],c=points[i+1];return (b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);};
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++){
    const c=centre(x,y);let best=Infinity,bi=0;
    for(let i=0;i<points.length;i++){const p=points[i],d=(p.x-c.x)**2+(p.y-c.y)**2;if(d<best){best=d;bi=i;}}
    const p=points[bi],t=p.t,d=Math.sqrt(best),q=points[Math.min(points.length-1,bi+1)],r=points[Math.max(0,bi-1)];
    const side=Math.sign((q.x-r.x)*(c.y-p.y)-(q.y-r.y)*(c.x-p.x))||1,i=index(x,y);
    if(d<fields.near[i]){fields.near[i]=d;fields.t[i]=t+offset;fields.side[i]=side;}
    const h=half(t);
    if(d<h){
      if(fordAt.some(f=>Math.abs(t-f)<=fordHalfWidth)){if(ground[y][x]!==GROUND.DEEP){ground[y][x]=GROUND.FORD;fords.push({x,y});}}
      else if(ground[y][x]!==GROUND.DEEP)ground[y][x]=d<h-W.river2.shallowRim?GROUND.DEEP:GROUND.SHALLOW;
      continue;
    }
    if(isRiverGround(ground[y][x])||ground[y][x]!==GROUND.GRASS)continue;
    const stretch=stretches.find(s=>s.side===side&&t>=s.from&&t<s.to)??stretches[0],inner=Math.sign(curvature(bi))===side;
    const type=bankType(stretch,inner,o),w=bankWidth(type,stretch.width);
    if(type!==GROUND.GRASS&&d<h+w)ground[y][x]=type;
    else if(type===GROUND.GRASS&&d<h+1.1)reeds.push({x,y,roll:stretch.width});
  }
  // Reeds stand in the shallow edge next to grassy banks: the shallow tiles beside the marked bank tiles.
  return {fords};
}

function blob(random,radius){
  const a=random()*Math.PI*2,b=random()*Math.PI*2,c=random()*Math.PI*2;
  return (dx,dy)=>{const angle=Math.atan2(dy,dx);return Math.hypot(dx,dy)/(radius*(1+.18*Math.sin(2*angle+a)+.11*Math.sin(3*angle+b)+.05*Math.sin(5*angle+c)));};
}
function pickCentre(random,test,margin){
  for(let attempt=0;attempt<400;attempt++){const p={x:margin+random()*(COLUMNS-2*margin),y:margin+random()*(ROWS-2*margin)};if(test(p))return p;}
  return null;
}
const nearAt=(near,p)=>near[index(Math.max(0,Math.min(COLUMNS-1,Math.floor(p.x))),Math.max(0,Math.min(ROWS-1,Math.floor(p.y))))];
function paintLake(ground,near,random,o,others=[]){
  const radius=between(random,W.lake.radius);
  const at=pickCentre(random,p=>distance(p,START)>=W.lake.startDistance&&nearAt(near,p)>=radius+W.lake.riverDistance&&others.every(l=>distance(p,l)>=radius+l.radius+6),radius+3);
  if(!at)return null;
  const shape=blob(random,radius),rim=1+1.7*Math.max(.3,o.sandyBanks)/radius;
  for(let y=Math.floor(at.y-radius*2);y<=at.y+radius*2;y++)for(let x=Math.floor(at.x-radius*2);x<=at.x+radius*2;x++){
    if(!inside(x,y)||isRiverGround(ground[y][x]))continue;const c=centre(x,y),ratio=shape(c.x-at.x,c.y-at.y);
    if(ratio<.6)ground[y][x]=GROUND.DEEP;else if(ratio<1)ground[y][x]=GROUND.SHALLOW;else if(ratio<rim)ground[y][x]=GROUND.BEACH;
  }
  return {x:Math.floor(at.x),y:Math.floor(at.y),radius};
}
function paintDesert(ground,near,lakes,random,o){
  if(!o.desert)return null;
  const radius=between(random,W.desert.radius)*o.desert;
  const at=pickCentre(random,p=>distance(p,START)>=W.desert.startDistance+Math.max(0,radius-15)&&nearAt(near,p)>=radius*.6+W.desert.riverDistance&&lakes.every(lake=>distance(p,lake)>=radius+lake.radius+4),6);
  if(!at)return null;
  const shape=blob(random,radius),tiles=[];
  for(let y=Math.floor(at.y-radius*1.6);y<=at.y+radius*1.6;y++)for(let x=Math.floor(at.x-radius*1.6);x<=at.x+radius*1.6;x++){
    if(!inside(x,y)||ground[y][x]!==GROUND.GRASS)continue;const c=centre(x,y),ratio=shape(c.x-at.x,c.y-at.y);
    if(ratio<1||ratio<1.2&&random()<(1.2-ratio)/.2&&distance(c,START)>W.startClear){ground[y][x]=GROUND.DESERT;tiles.push({x,y});}
  }
  return {x:Math.floor(at.x),y:Math.floor(at.y),radius,tiles};
}

// Distance (tiles, 8-neighbour) to the nearest tile that matches `test`, capped at `cap`.
function distanceField(grid,test,cap=40){
  const d=new Float32Array(COLUMNS*ROWS).fill(cap),queue=[];
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++)if(test(grid[y][x])){d[index(x,y)]=0;queue.push(index(x,y));}
  for(let head=0;head<queue.length;head++){const i=queue[head],x=i%COLUMNS,y=Math.floor(i/COLUMNS);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(!inside(nx,ny))continue;const j=index(nx,ny),step=d[i]+(dx&&dy?1.41:1);if(step<d[j]&&step<cap){d[j]=step;queue.push(j);}}}
  return d;
}

// Rock outcrops (2×2 or 3×2) weighted towards stony country and the desert's edge, never in water or near the start.
function placeRocks(terrain,ground,random,o,stony,desertDistance){
  const count=Math.round(65*o.rocks);let placed=0;
  for(let attempt=0;attempt<count*40&&placed<count;attempt++){
    const x=2+Math.floor(random()*94),y=2+Math.floor(random()*94),dd=desertDistance[index(x,y)],weight=.2+.8*Math.max(stony(x,y),dd>0&&dd<W.rocks.desertRim?.9:0);
    if(random()>weight)continue;
    const w=2+placed%2,tiles=[];for(let dy=0;dy<2;dy++)for(let dx=0;dx<w;dx++)tiles.push({x:x+dx,y:y+dy});
    if(tiles.some(t=>!inside(t.x,t.y)||Math.abs(t.x-PLAYER_START.x)<5&&Math.abs(t.y-PLAYER_START.y)<5||![GROUND.GRASS,GROUND.DESERT,GROUND.SHORE_ROCKS].includes(ground[t.y][t.x])))continue;
    for(const t of tiles)terrain[t.y][t.x]=1;placed++;
  }
  // The original walls near the start show pathfinding around obstacles (kept from the first prototype).
  for(let y=44;y<=52;y++)if(y!==50)terrain[y][46]=1;
  for(let x=52;x<=58;x++)terrain[47][x]=1;
}

function weighted(random,list){let r=random();for(const [value,weight]of list){if((r-=weight)<0)return value;}return list.at(-1)[0];}
function placeBushes(terrain,ground,desert,random,o,lane,bankDensity,waterDistance){
  const bushes=new Map(),free=(x,y)=>inside(x,y)&&terrain[y][x]===0&&distance(centre(x,y),START)>W.bushClear&&!lane(x,y);
  const grass=[];for(let y=2;y<ROWS-2;y++)for(let x=2;x<COLUMNS-2;x++)if(ground[y][x]===GROUND.GRASS&&free(x,y))grass.push({x,y});
  const clusters=Math.round(W.bushes.clusters*o.bushes);
  for(let cluster=0;cluster<clusters&&grass.length;cluster++){
    const at=grass[Math.floor(random()*grass.length)],count=Math.round(between(random,W.bushes.perCluster)),kind=weighted(random,GRASS_BUSHES);
    for(let attempt=0,placed=0;attempt<count*4&&placed<count;attempt++){
      const angle=random()*Math.PI*2,r=Math.sqrt(-2*Math.log(1-random()*.999))*W.bushes.spread*.6,x=Math.round(at.x+Math.cos(angle)*r),y=Math.round(at.y+Math.sin(angle)*r),key=`${x},${y}`;
      if(!free(x,y)||ground[y][x]!==GROUND.GRASS||bushes.has(key))continue;
      bushes.set(key,random()<.75?kind:weighted(random,GRASS_BUSHES));placed++;
    }
  }
  // Bank vegetation: thickets along the water where the stretch is dense, almost nothing elsewhere.
  for(const t of grass){const d=waterDistance[index(t.x,t.y)];if(d<1||d>3.5)continue;const key=`${t.x},${t.y}`;if(bushes.has(key))continue;
    if(random()<W.bankVegetation.bushes*o.bankVegetation*bankDensity(t.x,t.y)*2)bushes.set(key,weighted(random,GRASS_BUSHES));}
  const sand=(desert?.tiles??[]).filter(t=>free(t.x,t.y));
  for(let i=0;i<W.desert.scrub&&sand.length;i++){const [t]=sand.splice(Math.floor(random()*sand.length),1);bushes.set(`${t.x},${t.y}`,BUSH_TYPES.indexOf('bush_scrub'));}
  return bushes;
}

function generateOnce(rng,o){
  const ground=emptyGround(),terrain=Array.from({length:ROWS},()=>Array(COLUMNS).fill(0)),reedMarks=[];
  const fields={near:new Float32Array(COLUMNS*ROWS).fill(Infinity),t:new Float32Array(COLUMNS*ROWS),side:new Int8Array(COLUMNS*ROWS)};
  let fords=[],main=null,tributary=null;
  if(o.rivers){
    const random=rng('river');main=riverLine(random,o);
    if(main)fords=paintRiver(ground,random,o,main,{width:W.river2.width,fordSpacing:W.river.fordSpacing,fordHalfWidth:W.river2.fordHalfWidth,pools:true,fields,reeds:reedMarks}).fords;
  }
  if(o.rivers>=2&&main){
    // A narrower river from the map edge across the main river's course, until it flows into it.
    const random=rng('tributary'),line=riverLine(random,o,{vertical:!main.vertical,base:50+(random()<.5?-1:1)*between(random,[14,30]),amplitudeRange:W.tributary.amplitude});
    if(line){
      const fromEnd=random()<.5,points=fromEnd?[...line.points].reverse():line.points,join=points.findIndex(p=>nearAt(fields.near,p)<1);
      if(join>16){
        const part={points:points.slice(0,join+3),vertical:line.vertical};
        const r=paintRiver(ground,random,o,part,{width:W.tributary.width,fordSpacing:W.tributary.fordSpacing,fordHalfWidth:W.tributary.fordHalfWidth,pools:false,fields,reeds:reedMarks,offset:1000});
        fords=fords.concat(r.fords);tributary={length:Math.round(part.points.length/2),fords:r.fords.length};
      }
    }
  }
  const lakes=[];
  for(let i=0;i<o.lakes;i++){const lake=paintLake(ground,fields.near,rng(i?`lake${i+1}`:'lake'),o,lakes);if(lake)lakes.push(lake);}
  const desert=paintDesert(ground,fields.near,lakes,rng('desert'),o);
  // Noise maps for the landscape (separate streams: they never shift the water or the desert).
  const zoneScale=Math.max(.4,o.grassScale);
  const moistNoise=valueNoise(rng('moisture'),W.grass.noiseScale*zoneScale),variation=valueNoise(rng('variation'),W.grass.variationScale*zoneScale);
  const forestNoise=valueNoise(rng('forest'),W.forest.scale),stony=valueNoise(rng('stony'),W.rocks.scale),bankNoise=valueNoise(rng('banks'),9);
  const waterDistance=distanceField(ground,isRiverGround),desertDistance=distanceField(ground,g=>g===GROUND.DESERT);
  placeRocks(terrain,ground,rng('rocks'),o,(x,y)=>smooth(.5,.78,stony(x,y)),desertDistance);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++)if(isRiverGround(ground[y][x]))terrain[y][x]=0;
  for(const f of fords)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(inside(f.x+dx,f.y+dy))terrain[f.y+dy][f.x+dx]=0;
  const rockDistance=distanceField(terrain,v=>v===1,10);
  // A path to the water every few tiles along each bank: no bushes or trees there.
  const A=W.bankVegetation;
  const lane=(x,y)=>{const i=index(x,y);if(fields.near[i]>8)return false;const m=((fields.t[i]%A.access)+A.access)%A.access;return Math.abs(m-A.access/2)<A.accessHalfWidth;};
  const bankDensity=(x,y)=>{const i=index(x,y),n=bankNoise(fields.t[i]*.9,fields.side[i]*25+50);return n>1-A.dense?1:n<.4?.05:.4;};
  const zones=emptyZones(),forestWeight=new Float32Array(COLUMNS*ROWS),stoneWeight=new Float32Array(COLUMNS*ROWS);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++){
    const i=index(x,y),g=ground[y][x],wet=Math.max(0,1-waterDistance[i]/W.grass.moistureReach),dry=desertDistance[i]<8?1-desertDistance[i]/8:0;
    const m=Math.max(0,Math.min(1,wet*.55+moistNoise(x,y)*.6-dry*.6));
    const forest=smooth(W.forest.threshold-.08,W.forest.threshold+.12,forestNoise(x,y))*(m<W.forest.dryCut?m/W.forest.dryCut:1);
    const bank=waterDistance[i]>=1&&waterDistance[i]<=4?bankDensity(x,y)*o.bankVegetation*.9:0;
    forestWeight[i]=g===GROUND.GRASS&&!lane(x,y)?Math.min(1,forest+bank):0;
    stoneWeight[i]=Math.max(smooth(.5,.8,stony(x,y)),rockDistance[i]<3?.6:0,desertDistance[i]>0&&desertDistance[i]<W.rocks.desertRim?.6:0);
    if(g!==GROUND.GRASS)continue;
    zones[y][x]=rockDistance[i]<=1||stoneWeight[i]>.995?GRASS_ZONE.STONY:forest>.85?GRASS_ZONE.FOREST_FLOOR:m<.2||dry>.3?GRASS_ZONE.DRY:m>.66?GRASS_ZONE.LUSH:variation(x,y)>.64?GRASS_ZONE.FLOWERS:GRASS_ZONE.MEADOW;
  }
  const bushes=placeBushes(terrain,ground,desert,rng('bushes'),o,lane,bankDensity,waterDistance);
  // Reeds: shallow tiles beside grassy banks, thinned by chance.
  const reeds=new Set(),random=rng('reeds');
  for(const r of reedMarks)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=r.x+dx,y=r.y+dy,key=`${x},${y}`;if(!inside(x,y)||ground[y][x]!==GROUND.SHALLOW||reeds.has(key))continue;if(random()<W.banks.reeds*(.5+r.roll))reeds.add(key);}
  return {terrain,ground,bushes,zones,reeds,forestWeight,stoneWeight,
    summary:{fords:fords.length,lake:lakes[0]?{x:lakes[0].x,y:lakes[0].y}:null,lakes:lakes.length,desert:desert?{x:desert.x,y:desert.y}:null,tributary}};
}

// The parts of the fair start the generator controls: grass around the castle and water within reach.
export function fairStartReport(world,{expectWater=true}={}){
  const F=W.fairStart;let grass=0,water=Infinity;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++){const d=distance(centre(x,y),START),g=world.ground[y][x];
    if(d<=F.radius&&g===GROUND.GRASS&&world.terrain[y][x]===0)grass++;if(isRiverGround(g)&&d<water)water=d;}
  return {grass,water,ok:grass>=F.grass&&(water<=F.waterDistance||!expectWater)};
}

// options.levels: world code levels (default: the default world). options.streams: part → random (seeded worlds).
// A world whose start is unfair is generated again from the streams with the attempt number (river#2…), so the
// result is still reproducible from the code.
export function generateWorld(random=Math.random,{levels,streams}={}){
  const o=settingsFromLevels(levels);let world=null;
  for(let attempt=1;attempt<=W.fairStart.attempts;attempt++){
    const rng=streams?part=>streams(attempt>1?`${part}#${attempt}`:part):()=>random;
    world=generateOnce(rng,o);const report=fairStartReport(world,{expectWater:o.rivers>0||o.lakes>0});world.summary.fairStart={...report,attempt};
    if(report.ok)break;
  }
  return world;
}

// Save format: one string of digits per row (ground, grass zones); bushes as [x, y, type index]; reeds as [x, y].
export function exportGround(ground){return ground.map(row=>row.join(''));}
export function importGround(rows){return rows.map(row=>[...row].map(Number));}
export function validGroundRows(rows){return Array.isArray(rows)&&rows.length===ROWS&&rows.every(row=>typeof row==='string'&&row.length===COLUMNS&&[...row].every(c=>GROUND_CODES.includes(Number(c))));}
export const exportZones=exportGround,importZones=importGround;
export function validZoneRows(rows){return Array.isArray(rows)&&rows.length===ROWS&&rows.every(row=>typeof row==='string'&&row.length===COLUMNS&&[...row].every(c=>GRASS_ZONE_CODES.includes(Number(c))));}
export function exportBushes(bushes){return [...bushes].map(([key,type])=>{const [x,y]=key.split(',').map(Number);return [x,y,type];}).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);}
export function importBushes(list){return new Map(list.map(([x,y,type])=>[`${x},${y}`,type]));}
export function exportReeds(reeds){return [...reeds].map(key=>key.split(',').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);}
export function importReeds(list){return new Set((list??[]).map(([x,y])=>`${x},${y}`));}
