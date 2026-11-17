import { GROUND } from '../data/worldTerrain.js';
import { groupTiles } from './natureGroups.js';
import { zoneById } from '../data/scouting.js';

// Owner 16 Nov 2026 (m-mapa-kraje): what stands in a scouted land besides its nature – a bandit camp, crumbling ruins
// with a treasure, an abandoned mine with an entrance – and the inside of the mine (a dungeon map: tunnels and rooms
// cut in rock). shapeZoneWorld changes the generated world before it is drawn and returns where things go; GameScene
// keeps it as scene.zoneFeature and populateZone puts the chests and the guards there.
export const ZONE_FEATURES=Object.freeze({
  bandits:Object.freeze({radius:6,guards:[4,6],gold:[80,160]}),
  ruins:Object.freeze({width:13,height:11,gold:[150,300]}),
  mine:Object.freeze({radius:6}),
  dungeon:Object.freeze({rooms:7,roomRadius:[3,5],rats:[1,2],chests:2,gold:[100,250]}),
});
const between=(random,[a,b])=>a+Math.floor(random()*(b-a+1));
// The middle of the land, a little towards its far side (the party comes in on the near side).
export function featureCenter(zone,size){return {x:Math.round(size/2+zone.dx*10),y:Math.round(size/2+zone.dy*10)};}
function clearGroups(world,keys){world.natureGroups=(world.natureGroups??[]).filter(g=>!groupTiles(g).some(t=>keys.has(`${t.x},${t.y}`)));}
function setCell(world,x,y,rock,ground){const row=world.terrain[y];if(!row||x<1||y<1||x>=row.length-1||y>=world.terrain.length-1)return false;row[x]=rock;world.ground[y][x]=ground;world.bushes?.delete?.(`${x},${y}`);world.reeds?.delete?.(`${x},${y}`);return true;}
function clearDisc(world,c,r,ground,touched){for(let y=c.y-r;y<=c.y+r;y++)for(let x=c.x-r;x<=c.x+r;x++)if(Math.hypot(x-c.x,y-c.y)<=r+.3&&setCell(world,x,y,0,ground))touched.add(`${x},${y}`);}

// Owner 17 Nov 2026: a winding tunnel from one cavern to another, now narrow (one tile), now wide (four): the way
// wanders around the straight line, its width breathes along it.
export function tunnel(world,from,to,random,size){
  let x=from.x,y=from.y,drift=0,width=1+random()*1.2;const phase=random()*6;
  for(let step=0;step<600;step++){const dx=to.x-x,dy=to.y-y,dist=Math.hypot(dx,dy);if(dist<1.2)break;
    drift=Math.max(-1.05,Math.min(1.05,drift*.92+(random()-.5)*.55));const a=Math.atan2(dy,dx)+drift*Math.min(1,dist/6);
    x=Math.max(2,Math.min(size-3,x+Math.cos(a)*.7));y=Math.max(2,Math.min(size-3,y+Math.sin(a)*.7));
    width=Math.max(.75,Math.min(2.3,width+(random()-.5)*.35+Math.sin(step*.11+phase)*.06));
    const r=width;for(let yy=Math.floor(y-r);yy<=Math.ceil(y+r);yy++)for(let xx=Math.floor(x-r);xx<=Math.ceil(x+r);xx++)if(Math.hypot(xx-x,yy-y)<=r)setCell(world,xx,yy,0,GROUND.MUD);}
  // the last stretch straight, so every tunnel really arrives
  const n=Math.ceil(Math.hypot(to.x-x,to.y-y));for(let i=0;i<=n;i++){const px=Math.round(x+(to.x-x)*i/Math.max(1,n)),py=Math.round(y+(to.y-y)*i/Math.max(1,n));setCell(world,px,py,0,GROUND.MUD);setCell(world,px+1,py,0,GROUND.MUD);}
}

export function shapeZoneWorld(world,{type,id,dungeon=false},random){
  const zone=zoneById(id)??{dx:1,dy:0};
  const size=world.terrain.length,touched=new Set(),c=featureCenter(zone,size);let feature=null;
  if(dungeon){
    const R=ZONE_FEATURES.dungeon,entrance={x:Math.round(size/2),y:size-8};
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){world.terrain[y][x]=1;world.ground[y][x]=GROUND.MUD;}
    world.bushes=new Map();world.reeds=new Set();world.natureGroups=[];
    const rooms=[{...entrance,r:3}];
    for(let i=0,tries=0;i<R.rooms&&tries<400;tries++){const r=between(random,R.roomRadius),p={x:8+Math.floor(random()*(size-16)),y:8+Math.floor(random()*(size-24)),r};
      if(rooms.every(o=>Math.hypot(o.x-p.x,o.y-p.y)>o.r+p.r+6)){rooms.push(p);i++;}}
    // Corridors: each room joins the nearest one already joined (two tiles wide, L-shaped).
    const joined=[rooms[0]];
    for(const room of rooms.slice(1).sort((a,b)=>Math.hypot(a.x-entrance.x,a.y-entrance.y)-Math.hypot(b.x-entrance.x,b.y-entrance.y))){
      const to=joined.reduce((best,o)=>Math.hypot(o.x-room.x,o.y-room.y)<Math.hypot(best.x-room.x,best.y-room.y)?o:best,joined[0]);
      tunnel(world,room,to,random,size);
      joined.push(room);
    }
    // Owner 17 Nov 2026: rooms are uneven caverns (a few overlapping hollows), not round halls.
    for(const room of rooms){clearDisc(world,room,room.r,GROUND.MUD,touched);for(let k=0;k<3;k++){const a=random()*Math.PI*2,d=room.r*.7,r=Math.max(2,room.r-1-Math.floor(random()*2));clearDisc(world,{x:Math.round(room.x+Math.cos(a)*d),y:Math.round(room.y+Math.sin(a)*d)},r,GROUND.MUD,touched);}}
    // Owner 17 Nov 2026 (later): rock pillars and outcrops stand in the caverns – kept only where every cavern can
    // still be reached from the entrance and the middle of each cavern (chest, rats) stays free.
    const reachAll=()=>{const seen=new Set([`${entrance.x},${entrance.y}`]),q=[entrance];while(q.length){const p=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=`${x},${y}`;if(world.terrain[y]?.[x]===0&&!seen.has(k)){seen.add(k);q.push({x,y});}}}return rooms.every(r=>seen.has(`${r.x},${r.y}`));};
    const SHAPES=[[[0,0]],[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,1]]];
    for(const room of rooms.slice(1))for(let k=0,n=between(random,[1,3]);k<n;k++){
      const a=random()*Math.PI*2,d=2+random()*Math.max(.5,room.r-1.5),at={x:Math.round(room.x+Math.cos(a)*d),y:Math.round(room.y+Math.sin(a)*d)},shape=SHAPES[Math.floor(random()*SHAPES.length)];
      const cells=shape.map(([dx,dy])=>({x:at.x+dx,y:at.y+dy})).filter(c=>world.terrain[c.y]?.[c.x]===0&&Math.hypot(c.x-room.x,c.y-room.y)>=2.2);if(!cells.length)continue;
      for(const c of cells)world.terrain[c.y][c.x]=1;if(!reachAll())for(const c of cells)world.terrain[c.y][c.x]=0;}
    const far=[...rooms.slice(1)].sort((a,b)=>Math.hypot(b.x-entrance.x,b.y-entrance.y)-Math.hypot(a.x-entrance.x,a.y-entrance.y));
    feature={kind:'dungeon',entrance,rooms,chests:far.slice(0,R.chests).map((r,i)=>({key:`mine-${i}`,tile:{x:r.x,y:r.y},gold:between(random,R.gold)})),
      rats:rooms.slice(1).flatMap(r=>Array.from({length:between(random,R.rats)},(_,i)=>({x:r.x+((i%2)?1:-1),y:r.y+(i>1?1:0)})))};
    return feature;
  }
  if(type==='bandits'){
    const R=ZONE_FEATURES.bandits;clearDisc(world,c,R.radius,GROUND.MUD,touched);
    for(let y=c.y-1;y<=c.y+1;y++)for(let x=c.x-1;x<=c.x+1;x++)setCell(world,x,y,0,GROUND.SHORE_ROCKS);
    const n=between(random,R.guards);
    // Owner 17 Nov 2026: a lived-in camp – a fire with a cauldron in the middle, tents round it facing the fire (the
    // chief's one larger, with the chest before it), log seats, crates and barrels, a weapon rack, bedrolls.
    const turn=random()*Math.PI*2,tentCount=4,tents=Array.from({length:tentCount},(_,i)=>{const a=turn+i/tentCount*Math.PI*2+(random()-.5)*.35,d=4.3+random()*.5;return {x:c.x+Math.cos(a)*d,y:c.y+Math.sin(a)*d,angle:a+Math.PI,chief:i===0};});
    const at=(a,d)=>({x:c.x+Math.cos(a)*d,y:c.y+Math.sin(a)*d}),gap=i=>turn+(i+.5)/tentCount*Math.PI*2,chief=tents[0];
    const camp={fire:{...c},seats:[0,1,2].map(i=>({...at(turn+.4+i*2.1,1.55),angle:turn+.4+i*2.1+Math.PI/2})),crates:[{...at(gap(1),3.1),kind:'crate'},{...at(gap(1)+.25,3.4),kind:'barrel'},{...at(gap(1)-.22,3.5),kind:'barrel'},{...at(gap(1)+.1,2.8),kind:'sack'}],
      rack:{...at(gap(2),3.3),angle:gap(2)+Math.PI/2},bedrolls:[1,3].map(i=>({...at(Math.atan2(tents[i].y-c.y,tents[i].x-c.x)+.42,3.2),angle:Math.atan2(tents[i].y-c.y,tents[i].x-c.x)})),tents};
    const chestTile={x:Math.round(c.x+(chief.x-c.x)*.6),y:Math.round(c.y+(chief.y-c.y)*.6)};
    feature={kind:'bandits',center:c,camp,chests:[{key:'zone-0',tile:chestTile,gold:between(random,R.gold)}],guards:Array.from({length:n},(_,i)=>{const a=gap(i%tentCount)+(i>=tentCount?.5:0)+(random()-.5)*.3,d=2.3+random()*1.1;return {x:Math.round(c.x+Math.cos(a)*d),y:Math.round(c.y+Math.sin(a)*d)};})};
  }else if(type==='ruins'){
    const R=ZONE_FEATURES.ruins,x0=c.x-Math.floor(R.width/2),y0=c.y-Math.floor(R.height/2),x1=x0+R.width-1,y1=y0+R.height-1;
    clearDisc(world,c,Math.max(R.width,R.height)/2+3,GROUND.GRASS,touched);
    for(let y=y0+1;y<y1;y++)for(let x=x0+1;x<x1;x++)setCell(world,x,y,0,GROUND.SHORE_ROCKS);
    // Broken walls: the outline with gaps, two doorways and a few inner wall stubs.
    const door=new Set([`${c.x},${y1}`,`${c.x+1},${y1}`,`${x0},${c.y}`,`${x0},${c.y+1}`]);
    for(let x=x0;x<=x1;x++)for(const y of [y0,y1])if(!door.has(`${x},${y}`)&&random()>.28)setCell(world,x,y,1,GROUND.SHORE_ROCKS);
    for(let y=y0+1;y<y1;y++)for(const x of [x0,x1])if(!door.has(`${x},${y}`)&&random()>.28)setCell(world,x,y,1,GROUND.SHORE_ROCKS);
    for(let y=y0+2;y<=c.y-1;y++)if(random()>.35)setCell(world,c.x-3,y,1,GROUND.SHORE_ROCKS);
    for(let x=c.x+2;x<=x1-2;x++)if(random()>.35)setCell(world,x,c.y+2,1,GROUND.SHORE_ROCKS);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)touched.add(`${x},${y}`);
    feature={kind:'ruins',center:c,chests:[{key:'zone-0',tile:{...c},gold:between(random,R.gold)}]};
  }else if(type==='mine'){
    const R=ZONE_FEATURES.mine;clearDisc(world,c,R.radius+3,GROUND.SHORE_ROCKS,touched);
    for(let y=c.y-R.radius;y<=c.y+R.radius;y++)for(let x=c.x-R.radius;x<=c.x+R.radius;x++)if(Math.hypot(x-c.x,(y-c.y)*1.2)<=R.radius)setCell(world,x,y,1,GROUND.SHORE_ROCKS);
    // The entrance: a short cut into the hill on the side facing the party.
    const dx=-zone.dx,dy=-zone.dy,reach=Math.round((R.radius-1)/Math.hypot(dx,dy)),entrance={x:c.x+dx*reach,y:c.y+dy*reach};
    for(let k=-1;k<=4;k++){const x=entrance.x+dx*k,y=entrance.y+dy*k;setCell(world,x,y,0,GROUND.MUD);if(dx&&dy)setCell(world,x+dx,y,0,GROUND.MUD);}
    feature={kind:'mine',center:c,entrance,outside:{x:entrance.x+dx*4,y:entrance.y+dy*4},chests:[]};
  }
  if(feature)clearGroups(world,touched);
  return feature;
}
