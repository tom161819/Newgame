import { t,onLanguageChange } from '../i18n/index.js';
import { VISIBILITY } from '../systems/FogOfWarSystem.js';
import { gridToWorld,worldToGrid,clampMapCenter } from '../game/isometric.js';

// #104: a small map of the 100 × 100 grid in the bottom-right corner. It shows only what the player knows:
// unexplored ground is grey, remembered ground and objects come from Map Memory (muted), the area in sight is live.
// The square canvas is turned and squashed by CSS into the same diamond the isometric map uses.
export const MINIMAP=Object.freeze({scale:2,refreshMs:250,overlayMs:100,cssSize:150});
export const MINIMAP_COLORS=Object.freeze({
  unknown:[66,68,64],rock:[128,124,112],paved:[178,168,146],wear:[150,124,84],building:[182,112,56],tree:[36,80,38],deposit:[160,160,170],stockpile:[200,160,90],chest:[226,190,80],
  ground:{Spring:[92,140,64],Summer:[104,146,58],Autumn:[150,130,62],Winter:[206,210,212]},
  // #100 ground types (index = ground code; grass uses the seasonal colours above).
  groundType:{1:[214,196,140],2:[204,170,104],3:[98,160,190],4:[52,104,150]},
});
const KIND={none:0,building:1,tree:2,deposit:3,stockpile:4,chest:5};
const KIND_COLOR=[null,MINIMAP_COLORS.building,MINIMAP_COLORS.tree,MINIMAP_COLORS.deposit,MINIMAP_COLORS.stockpile,MINIMAP_COLORS.chest];
const mute=c=>c.map(v=>Math.round(v*.5+28));

function objectKind(scene,entry){
  if(entry.kind==='building')return String(entry.type).startsWith('stone_pavement')?KIND.none:KIND.building;
  if(entry.kind==='stockpile')return KIND.stockpile;
  if(entry.kind==='chest')return KIND.chest;
  const d=scene.objectRegistry?.get?.(entry.type)??scene.objectRegistry?.require?.(entry.type);
  return d?.tree?KIND.tree:KIND.deposit;
}
function stamp(kinds,width,entry,kind){if(!kind)return;for(let dy=0;dy<(entry.height??1);dy++)for(let dx=0;dx<(entry.width??1);dx++){const x=entry.x+dx,y=entry.y+dy;if(x>=0&&y>=0&&x<width&&y<kinds.length/width)kinds[y*width+x]=kind;}}

// Pure: RGBA pixels (one per tile) for the player's current knowledge. Never reads hidden live state.
export function minimapPixels(scene,out){
  const fog=scene.fog,width=fog.width,height=fog.height,season=scene.seasons?.season??'Spring',memory=scene.mapMemory,wear=scene.pathWear,grid=scene.terrainGrid,groundGrid=scene.groundGrid;
  const pixels=out??new Uint8ClampedArray(width*height*4),states=new Uint8Array(width*height),live=new Uint8Array(width*height),remembered=new Uint8Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)states[y*width+x]=fog.displayState({x,y});
  // Live objects only where they are in sight; remembered copies only where they are not.
  for(const building of scene.buildings??[])stamp(live,width,{x:building.x,y:building.y,width:building.definition?.width??1,height:building.definition?.height??1},objectKind(scene,{kind:'building',type:building.type}));
  for(const view of scene.resources?.values?.()??[]){const o=view.getData?.('object');if(!o)continue;const d=scene.objectRegistry.require(o.type);stamp(live,width,{x:o.x??o.tile?.x,y:o.y??o.tile?.y,width:d.width,height:d.height},d.tree?KIND.tree:KIND.deposit);}
  if(fog.enabled&&memory)for(const entry of memory.objects.values())stamp(remembered,width,entry,objectKind(scene,entry));
  for(let i=0;i<width*height;i++){
    const state=states[i],x=i%width,y=(i-x)/width;let color;
    if(state===VISIBILITY.UNEXPLORED)color=MINIMAP_COLORS.unknown;
    else{
      const visible=state===VISIBILITY.VISIBLE,liveTile=[grid?.[y]?.[x]??0,wear?.level?.({x,y})??0,season,0,wear?.isPaved?.({x,y})?1:0];
      // Exploration OFF shows all terrain as known (grey), exactly like the map itself.
      const known=!visible&&fog.enabled?memory?.terrain.get(i)??(fog.explorationEnabled?null:liveTile):null;
      if(!visible&&fog.enabled&&!known&&!remembered[i])color=MINIMAP_COLORS.unknown;
      else{
        const [rock,level,knownSeason,,paved]=visible||!fog.enabled?liveTile:known??[0,0,season,0,0];
        const kind=visible||!fog.enabled?live[i]:remembered[i];
        color=kind?KIND_COLOR[kind]:rock?MINIMAP_COLORS.rock:paved?MINIMAP_COLORS.paved:level>1?MINIMAP_COLORS.wear:MINIMAP_COLORS.groundType[groundGrid?.[y]?.[x]]??MINIMAP_COLORS.ground[knownSeason]??MINIMAP_COLORS.ground.Spring;
        if(!visible&&fog.enabled)color=mute(color);
      }
    }
    pixels[i*4]=color[0];pixels[i*4+1]=color[1];pixels[i*4+2]=color[2];pixels[i*4+3]=255;
  }
  return pixels;
}

// Point on the (turned, squashed) minimap element → fractional grid position; inverse of the CSS transform.
export function minimapPointToGrid(rect,point,{size=100,cssSize=MINIMAP.cssSize}={}){
  const dx=point.x-(rect.left+rect.width/2),dy=(point.y-(rect.top+rect.height/2))*2,k=cssSize/size;
  return {x:(dx+dy)/Math.SQRT2/k+size/2,y:(dy-dx)/Math.SQRT2/k+size/2};
}

export class Minimap {
  constructor(scene,{document:doc=globalThis.document,now=()=>performance.now()}={}){
    this.scene=scene;this.now=now;this.signature=null;this.nextRefresh=0;this.nextOverlay=0;this.redraws=0;
    const fog=scene.fog;this.size={width:fog.width,height:fog.height};
    this.root=doc.createElement('div');this.root.id='minimap';this.root.className='minimap';this.root.setAttribute('role','img');
    this.canvas=doc.createElement('canvas');this.canvas.className='minimap-canvas';this.canvas.width=fog.width*MINIMAP.scale;this.canvas.height=fog.height*MINIMAP.scale;this.root.append(this.canvas);
    this.base=doc.createElement('canvas');this.base.width=fog.width;this.base.height=fog.height;
    this.context=this.canvas.getContext('2d');this.baseContext=this.base.getContext('2d');this.image=this.baseContext?.createImageData(fog.width,fog.height);
    this.controller=new AbortController();const options={signal:this.controller.signal};
    // Navigation: a click centres the camera on that known or unknown spot; it reveals nothing.
    this.root.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();this.panTo(minimapPointToGrid(this.root.getBoundingClientRect(),{x:e.clientX,y:e.clientY},{size:fog.width,cssSize:this.canvas.offsetWidth||MINIMAP.cssSize}));},options);
    for(const type of ['click','mousedown','mouseup','wheel','contextmenu'])this.root.addEventListener(type,e=>e.stopPropagation(),options);
    (doc.querySelector('#corner-stack')??doc.querySelector('#game')??scene.game?.canvas?.parentElement)?.append(this.root);this.label();this.offLanguage=onLanguageChange(()=>this.label());
  }
  label(){this.root.setAttribute('aria-label',t('minimap.label'));this.root.title=t('minimap.hint');}
  panTo(point){
    const s=this.scene,camera=s.worldCamera;if(!camera||s.gameOver)return;
    const x=Math.max(0,Math.min(this.size.width,point.x)),y=Math.max(0,Math.min(this.size.height,point.y)),world=gridToWorld(x,y);
    camera.panTarget=clampMapCenter(world.x,world.y);camera.following=false;const mode=document.querySelector('#camera-mode');if(mode)mode.textContent=t('hud.cameraManual');
    this.nextOverlay=0;
  }
  knowledgeSignature(){
    const s=this.scene,f=s.fog;
    return [f.enabled,f.explorationEnabled,f.revision,s.mapMemory?.revision??0,s.buildings?.length??0,s.constructionSystem?.revision??0,s.resources?.size??0,s.pathWear?.levelRevision??0,s.pathWear?.revision??0,s.seasons?.season].join('|');
  }
  update(){
    if(!this.context||!this.image)return;const now=this.now();
    if(now>=this.nextRefresh){const signature=this.knowledgeSignature();if(signature!==this.signature){this.signature=signature;minimapPixels(this.scene,this.image.data);this.baseContext.putImageData(this.image,0,0);this.redraws++;this.nextOverlay=0;}this.nextRefresh=now+MINIMAP.refreshMs;}
    if(now>=this.nextOverlay){this.nextOverlay=now+MINIMAP.overlayMs;this.drawOverlay();}
  }
  drawOverlay(){
    const s=this.scene,c=this.context,k=MINIMAP.scale,view=s.cameras?.main?.worldView;
    c.imageSmoothingEnabled=false;c.clearRect(0,0,this.canvas.width,this.canvas.height);c.drawImage(this.base,0,0,this.canvas.width,this.canvas.height);
    if(view){const corners=[[view.x,view.y],[view.right,view.y],[view.right,view.bottom],[view.x,view.bottom]].map(([x,y])=>worldToGrid(x,y));
      c.strokeStyle='#f6e7b0';c.lineWidth=1.5;c.beginPath();corners.forEach((p,i)=>i?c.lineTo(p.x*k,p.y*k):c.moveTo(p.x*k,p.y*k));c.closePath();c.stroke();}
    const king=s.character?.position??s.character?.tile;if(king){c.fillStyle='#ffd34d';c.strokeStyle='#2a1c08';c.lineWidth=1;c.beginPath();c.arc(king.x*k,king.y*k,3,0,Math.PI*2);c.fill();c.stroke();}
  }
  destroy(){this.controller.abort();this.offLanguage?.();this.root.remove();}
}
