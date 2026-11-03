import { visibilityProfile } from './VisibilityModifiers.js';
import { COLUMNS, ROWS } from '../game/config.js';

const contains = (source, position) => (position.x-source.center.x)**2+(position.y-source.center.y)**2<=source.radius**2;
export const VISIBILITY=Object.freeze({UNEXPLORED:0,EXPLORED:1,VISIBLE:2});
export const FOG_STYLE=Object.freeze({brightness:.3,saturation:.15,edgeWidth:1,edgeBrightness:.08});

// Sight always uses logical grid coordinates. Rendering overrides do not change
// this ordinary sight calculation; exploration can safely consume it separately.
export class FogOfWarSystem {
  constructor(character,enabled=false,{width=COLUMNS,height=ROWS,explorationEnabled=true}={}){
    Object.assign(this,{character,enabled,width,height,explorationEnabled});
    this.explored=new Uint8Array(width*height);
    this.providers=new Map();this.visibleIndices=new Set();this.revision=0;this.update();
  }
  registerSource(id,provider){
    if(typeof provider!=='function')throw new TypeError('A vision source requires a profile provider.');
    this.providers.set(id,provider);this.update();
    return ()=>{this.providers.delete(id);this.update();};
  }
  update(){
    const profile=visibilityProfile(this.character);
    this.size=profile.size;this.radius=profile.radius;
    const sources=[profile,...[...this.providers.values()].map(provider=>provider()).filter(Boolean)];
    for(const source of sources)if(!Number.isFinite(source.radius)||source.radius<0||!Number.isFinite(source.center?.x)||!Number.isFinite(source.center?.y))throw new TypeError('Invalid logical vision source.');
    const key=sources.map(s=>`${s.center.x},${s.center.y},${s.radius}`).join(';');
    if(key!==this.sourceKey){
      this.sourceKey=key;this.sources=sources.map(s=>({center:{...s.center},radius:s.radius}));
      this.left=Math.ceil(Math.min(...sources.map(s=>s.center.x-s.radius))-.5);
      this.top=Math.ceil(Math.min(...sources.map(s=>s.center.y-s.radius))-.5);
      this.right=Math.floor(Math.max(...sources.map(s=>s.center.x+s.radius))-.5)+1;
      this.bottom=Math.floor(Math.max(...sources.map(s=>s.center.y+s.radius))-.5)+1;
      const next=new Set();
      for(const source of this.sources){
        const minX=Math.max(0,Math.ceil(source.center.x-source.radius-.5)),maxX=Math.min(this.width-1,Math.floor(source.center.x+source.radius-.5));
        const minY=Math.max(0,Math.ceil(source.center.y-source.radius-.5)),maxY=Math.min(this.height-1,Math.floor(source.center.y+source.radius-.5));
        for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(contains(source,{x:x+.5,y:y+.5}))next.add(y*this.width+x);
      }
      this.added=[...next].filter(index=>!this.visibleIndices.has(index));
      this.removed=[...this.visibleIndices].filter(index=>!next.has(index));
      this.visibleIndices=next;for(const index of next)this.explored[index]=1;this.revision++;
    }
    this.signature=`${this.enabled?'on':'off'}:${this.explorationEnabled}:${this.revision}`;
  }
  setEnabled(value){this.enabled=!!value;this.update();}
  setExplorationEnabled(value){this.explorationEnabled=!!value;this.update();}
  state(tile){
    if(tile.x<0||tile.x>=this.width||tile.y<0||tile.y>=this.height)return VISIBILITY.UNEXPLORED;
    return this.isInSightTile(tile)?VISIBILITY.VISIBLE:this.explored[tile.y*this.width+tile.x]?VISIBILITY.EXPLORED:VISIBILITY.UNEXPLORED;
  }
  displayState(tile){return !this.enabled?VISIBILITY.VISIBLE:this.state(tile)===VISIBILITY.UNEXPLORED&&!this.explorationEnabled?VISIBILITY.EXPLORED:this.state(tile);}
  brightness(tile){
    if(this.displayState(tile)===VISIBILITY.VISIBLE)return 1;
    const distance=Math.min(...this.sources.map(s=>Math.hypot(tile.x+.5-s.center.x,tile.y+.5-s.center.y)-s.radius));
    return FOG_STYLE.brightness+FOG_STYLE.edgeBrightness*Math.max(0,1-distance/FOG_STYLE.edgeWidth);
  }
  isInSightPosition(position){return this.sources.some(source=>contains(source,position));}
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
