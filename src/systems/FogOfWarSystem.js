import { visibilityProfile } from './VisibilityModifiers.js';
import { COLUMNS, ROWS } from '../game/config.js';

const contains = (source, position) => (position.x-source.center.x)**2+(position.y-source.center.y)**2<=source.radius**2;
export const VISIBILITY=Object.freeze({UNEXPLORED:0,EXPLORED:1,VISIBLE:2});
export const FOG_STYLE=Object.freeze({brightness:.3,saturation:.15,edgeWidth:1,edgeBrightness:.08});
// #129 player preference: brightness of explored ground outside current sight (never of unexplored ground).
export const MEMORY_BRIGHTNESS=Object.freeze({min:.15,max:.9,step:.05,default:FOG_STYLE.brightness});
export const clampMemoryBrightness=value=>{const n=Number(value);if(!Number.isFinite(n))return MEMORY_BRIGHTNESS.default;return Math.round(Math.min(MEMORY_BRIGHTNESS.max,Math.max(MEMORY_BRIGHTNESS.min,n))*100)/100;};
export const OUTSIDE_SIGHT='Outside current sight. Explore this area first.';
export const visibilityPlacementError=(fog,tiles)=>fog?.enabled&&tiles.some(tile=>!fog.isInSightTile(tile))?OUTSIDE_SIGHT:null;

// Sight always uses logical grid coordinates. Rendering overrides do not change
// this ordinary sight calculation; exploration can safely consume it separately.
export class FogOfWarSystem {
  constructor(character,enabled=false,{width=COLUMNS,height=ROWS,explorationEnabled=true}={}){
    Object.assign(this,{character,enabled,width,height,explorationEnabled});this.memoryBrightness=MEMORY_BRIGHTNESS.default;
    this.explored=new Uint8Array(width*height);this.coverage=new Uint16Array(width*height);this.stamps=new Uint32Array(width*height);this.stamp=0;this.painted=new Map();
    this.providers=new Map();this.visibleIndices=new Set();this.added=[];this.removed=[];this.revision=0;this.update();
  }
  // A provider returns one logical source or a list of them ({id, center, radius}); a list lets many units share one registration.
  registerSource(id,provider){
    if(typeof provider!=='function')throw new TypeError('A vision source requires a profile provider.');
    this.providers.set(id,provider);this.update();
    return ()=>{this.providers.delete(id);this.update();};
  }
  circle(source){
    // Sources standing on a tile centre (subjects) reuse one precomputed disc shape per radius.
    if((source.center.x-.5)%1===0&&(source.center.y-.5)%1===0){
      this.discs??=new Map();let disc=this.discs.get(source.radius);
      if(!disc){disc=[];const r=Math.ceil(source.radius);for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=source.radius**2)disc.push(dx,dy);this.discs.set(source.radius,disc);}
      const tiles=[],cx=source.center.x-.5,cy=source.center.y-.5;
      for(let i=0;i<disc.length;i+=2){const x=cx+disc[i],y=cy+disc[i+1];if(x>=0&&x<this.width&&y>=0&&y<this.height)tiles.push(y*this.width+x);}
      return tiles;
    }
    const tiles=[],minX=Math.max(0,Math.ceil(source.center.x-source.radius-.5)),maxX=Math.min(this.width-1,Math.floor(source.center.x+source.radius-.5));
    const minY=Math.max(0,Math.ceil(source.center.y-source.radius-.5)),maxY=Math.min(this.height-1,Math.floor(source.center.y+source.radius-.5));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(contains(source,{x:x+.5,y:y+.5}))tiles.push(y*this.width+x);
    return tiles;
  }
  update(){
    const profile=visibilityProfile(this.character);
    this.size=profile.size;this.radius=profile.radius;
    const sources=[{id:'character',center:profile.center,radius:profile.radius}];
    for(const [id,provider]of this.providers){const value=provider();if(!value)continue;const list=Array.isArray(value)?value:[value];list.forEach((source,i)=>{if(source)sources.push({id:Array.isArray(value)?`${id}:${source.id??i}`:id,center:source.center,radius:source.radius});});}
    // Day and night N1: at night sight shrinks to a third outside light (`sightScale` returns a function, or null by day).
    const scale=this.sightScale?.();if(scale)for(const source of sources)source.radius=source.radius*scale(source.center);
    // m-teren-vyska: a source on a hilltop sees further (whole tiles, so subjects keep sharing disc shapes).
    const bonus=this.sightBonus;if(bonus)for(const source of sources)source.radius+=bonus(source.center);
    for(const source of sources)if(!Number.isFinite(source.radius)||source.radius<0||!Number.isFinite(source.center?.x)||!Number.isFinite(source.center?.y))throw new TypeError('Invalid logical vision source.');
    // Incremental coverage: only a source that moved, appeared or left touches the map; the others keep their counted circles.
    const next=new Map(),touched=[],was=[],stamp=++this.stamp,coverage=this.coverage,stamps=this.stamps;
    const touch=(tiles,step)=>{for(let i=0;i<tiles.length;i++){const index=tiles[i];if(stamps[index]!==stamp){stamps[index]=stamp;touched.push(index);was.push(coverage[index]>0);}coverage[index]+=step;}};
    let changed=sources.length!==this.painted.size;
    for(const source of sources){
      const key=`${source.center.x},${source.center.y},${source.radius}`,old=this.painted.get(source.id);
      if(old?.key===key){next.set(source.id,old);continue;}
      changed=true;if(old)touch(old.tiles,-1);const tiles=this.circle(source);touch(tiles,1);next.set(source.id,{key,tiles});
    }
    for(const [id,old]of this.painted)if(!next.has(id)){changed=true;touch(old.tiles,-1);}
    this.painted=next;
    if(changed){
      this.sources=sources.map(s=>({center:{...s.center},radius:s.radius}));
      this.left=Math.ceil(Math.min(...sources.map(s=>s.center.x-s.radius))-.5);
      this.top=Math.ceil(Math.min(...sources.map(s=>s.center.y-s.radius))-.5);
      this.right=Math.floor(Math.max(...sources.map(s=>s.center.x+s.radius))-.5)+1;
      this.bottom=Math.floor(Math.max(...sources.map(s=>s.center.y+s.radius))-.5)+1;
      this.added=[];this.removed=[];
      for(let i=0;i<touched.length;i++){const index=touched[i],now=coverage[index]>0;if(now&&!was[i]){this.visibleIndices.add(index);this.added.push(index);}else if(!now&&was[i]){this.visibleIndices.delete(index);this.removed.push(index);}}
      this.revision++;
    }
    this.signature=`${this.enabled?'on':'off'}:${this.explorationEnabled}:${this.revision}:${this.memoryBrightness}`;
  }
  setEnabled(value){this.enabled=!!value;this.update();}
  setExplorationEnabled(value){this.explorationEnabled=!!value;this.update();}
  setMemoryBrightness(value){const b=clampMemoryBrightness(value);if(b===this.memoryBrightness)return false;this.memoryBrightness=b;this.update();return true;}
  state(tile){
    if(tile.x<0||tile.x>=this.width||tile.y<0||tile.y>=this.height)return VISIBILITY.UNEXPLORED;
    return this.isInSightTile(tile)?VISIBILITY.VISIBLE:this.explored[tile.y*this.width+tile.x]?VISIBILITY.EXPLORED:VISIBILITY.UNEXPLORED;
  }
  displayState(tile){return !this.enabled?VISIBILITY.VISIBLE:this.state(tile)===VISIBILITY.UNEXPLORED&&!this.explorationEnabled?VISIBILITY.EXPLORED:this.state(tile);}
  brightness(tile){
    if(this.displayState(tile)===VISIBILITY.VISIBLE)return 1;
    const distance=Math.min(...this.sources.map(s=>Math.hypot(tile.x+.5-s.center.x,tile.y+.5-s.center.y)-s.radius));
    return Math.min(1,this.memoryBrightness+FOG_STYLE.edgeBrightness*Math.max(0,1-distance/FOG_STYLE.edgeWidth));
  }
  isInSightPosition(position){return this.sources.some(source=>contains(source,position));}
  isInMap(tile){return Number.isInteger(tile.x)&&Number.isInteger(tile.y)&&tile.x>=0&&tile.x<this.width&&tile.y>=0&&tile.y<this.height;}
  isInSightTile(tile){return tile.x>=0&&tile.x<this.width&&tile.y>=0&&tile.y<this.height&&this.visibleIndices.has(tile.y*this.width+tile.x);}
  isVisiblePosition(position){return !this.enabled||this.isInSightPosition(position);}
  isVisibleTile(tile){return !this.enabled||this.isInSightTile(tile);}
  isVisibleObject(object){
    return !this.enabled||this.isInSightObject(object);
  }
  isInSightObject(object){
    if(object.position)return this.isInSightPosition(object.position);
    const d=object.definition??object;
    for(let y=0;y<(d.height??1);y++)for(let x=0;x<(d.width??1);x++)if(this.isInSightTile({x:object.x+x,y:object.y+y}))return true;
    return false;
  }
}
