// Owner 17 Nov 2026: soldiers can march into a formation. The places are tiles around the clicked one, turned to the
// facing the player drags out while he holds the button (the blueprint), front rank towards the facing.
// Pure helpers: no Phaser, no scene.
export const FORMATIONS=Object.freeze(['loose','line','block','wedge']);
export const FORMATION_ICONS=Object.freeze({loose:'∴',line:'═',block:'▦',wedge:'⋀'});
export const DEFAULT_FORMATION='block';

// Ranks × files for n men: a line is two deep, a block nearly square (a little wider than deep), a wedge grows one per rank.
export function formationShape(formation,n){
  if(n<=0)return [];
  if(formation==='wedge'){const ranks=[];let left=n,width=1;while(left>0){const w=Math.min(width,left);ranks.push(w);left-=w;width+=2;}return ranks;}
  const files=formation==='line'?Math.max(1,Math.ceil(n/2)):Math.max(1,Math.ceil(Math.sqrt(n*1.5)));
  const ranks=[];for(let left=n;left>0;left-=files)ranks.push(Math.min(files,left));return ranks;
}

// Offsets (in tiles, before rounding) of each place: rank 0 at the click, the next ranks behind it. facing is a vector in
// tile coordinates. Returned in order front rank first, left to right as seen along the facing.
export function formationOffsets(formation,n,facing){
  const f=unit(facing),right={x:-f.y,y:f.x},out=[];
  // Diagonal facings put neighbours √2 apart on the grid; one tile along a diagonal is the closest that stays distinct.
  const diagonal=Math.abs(Math.abs(f.x)-Math.abs(f.y))<.4,step=diagonal?Math.SQRT2:1;
  formationShape(formation,n).forEach((width,rank)=>{for(let file=0;file<width;file++){const side=(file-(width-1)/2)*step,back=rank*step;out.push({x:right.x*side-f.x*back,y:right.y*side-f.y*back,rank,file});}});
  return out;
}

// Tiles for the places, snapped to walkable, unused tiles (open(x,y) says whether a tile can be stood on), nearest first.
export function formationTiles(formation,n,target,facing,open){
  const used=new Set(),tiles=[];
  for(const o of formationOffsets(formation,n,facing)){
    const want={x:target.x+o.x,y:target.y+o.y},base={x:Math.round(want.x),y:Math.round(want.y)};let got=null;
    for(let r=0;r<=4&&!got;r++){const ring=[];for(let y=base.y-r;y<=base.y+r;y++)for(let x=base.x-r;x<=base.x+r;x++)if(Math.max(Math.abs(x-base.x),Math.abs(y-base.y))===r)ring.push({x,y});
      ring.sort((a,b)=>Math.hypot(a.x-want.x,a.y-want.y)-Math.hypot(b.x-want.x,b.y-want.y));got=ring.find(p=>!used.has(`${p.x},${p.y}`)&&open(p.x,p.y))??null;}
    if(got){used.add(`${got.x},${got.y}`);tiles.push({...got,rank:o.rank,file:o.file});}
  }
  return tiles;
}

// Who stands where: shields and armour in front, archers at the back; inside each rank the men keep their side
// (sorted across the facing), so nobody has to cross the others.
export function assignFormation(workers,tiles,facing){
  const f=unit(facing),right={x:-f.y,y:f.x},weight=w=>w.attackRange>1?2:(w.armor??0)>0?0:1;
  const men=[...workers].sort((a,b)=>weight(a)-weight(b)||String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
  const out=new Map();let i=0;const ranks=new Map();for(const t of tiles){if(!ranks.has(t.rank))ranks.set(t.rank,[]);ranks.get(t.rank).push(t);}
  for(const rank of [...ranks.keys()].sort((a,b)=>a-b)){const places=ranks.get(rank),group=men.slice(i,i+places.length);i+=places.length;
    const across=p=>p.x*right.x+p.y*right.y;group.sort((a,b)=>across(a.tile)-across(b.tile));places.sort((a,b)=>across(a)-across(b));group.forEach((w,j)=>out.set(w,places[j]));}
  return out;
}

// The facing name (directions.js) of a tile vector, for the men to look that way when they stand.
const NAMES=['E','SE','S','SW','W','NW','N','NE'];
export function facingName(v){const a=Math.atan2(v.y,v.x);return NAMES[(Math.round(a/(Math.PI/4))+8)%8];}
export function unit(v){const n=Math.hypot(v?.x??0,v?.y??0);return n?{x:v.x/n,y:v.y/n}:{x:1,y:0};}
