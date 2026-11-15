import { definitionFor } from '../game/buildings.js';
import { t,onLanguageChange } from '../i18n/index.js';
import { VISIBILITY } from '../systems/FogOfWarSystem.js';
import { gridToWorldFlat as gridToWorld, worldToGridFlat as worldToGrid, clampMapCenter } from '../game/isometric.js'; // flat: painted into the ground picture before it is lifted

// #104: a small map of the 100 × 100 grid in the bottom-right corner. It shows only what the player knows:
// unexplored ground is grey, remembered ground and objects come from Map Memory (muted), the area in sight is live.
// The square canvas is turned and squashed by CSS into the same diamond the isometric map uses.
export const MINIMAP=Object.freeze({scale:2,refreshMs:250,overlayMs:100,cssSize:150});
export const MINIMAP_COLORS=Object.freeze({
  unknown:[66,68,64],rock:[128,124,112],paved:[178,168,146],wear:[150,124,84],building:[182,112,56],tree:[36,80,38],deposit:[160,160,170],stockpile:[200,160,90],chest:[226,190,80],
  ground:{Spring:[92,140,64],Summer:[104,146,58],Autumn:[150,130,62],Winter:[206,210,212]},
  // #100 ground types (index = ground code; grass uses the seasonal colours above).
  groundType:{1:[214,196,140],2:[204,170,104],3:[98,160,190],4:[52,104,150],5:[132,168,176],6:[122,98,68],7:[150,148,138]},
});
// Request 55: + / − buttons change the minimap's on-screen size in a few steps (the content has no zoom of its own).
// The step is remembered in this browser only (localStorage), never in a save.
// m-minimapa-loziska (owner, 12 Nov): toggles that mark the found Stone and Iron deposits on the minimap – free ones
// bright, ones with a Quarry or Mine dim. Only explored deposits (or all with the fog off); the choice is remembered.
export const DEPOSIT_MARKS=Object.freeze({stone:Object.freeze({family:'stone_deposit',icon:'⛰',free:'#d9d4c4',bound:'rgba(160,156,146,.55)'}),iron:Object.freeze({family:'iron_deposit',icon:'◈',free:'#d9824a',bound:'rgba(160,100,70,.55)'})});
const DEPOSIT_KEY='newgame.minimap.deposits';
export function minimapDeposits(scene,kind){
  const rule=DEPOSIT_MARKS[kind],f=scene.fog,mining=scene.naturalResources?.mining;if(!rule||!mining)return [];
  const known=d=>!f?.enabled||[...Array(d.definition.width*d.definition.height).keys()].some(i=>f.explored?.[(d.y+Math.floor(i/d.definition.width))*f.width+d.x+i%d.definition.width]||f.isInSightTile?.({x:d.x+i%d.definition.width,y:d.y+Math.floor(i/d.definition.width)}));
  return mining.deposits().filter(d=>(d.type===rule.family||d.type.startsWith(rule.family))&&d.natural.remaining>0&&known(d)).map(d=>({id:d.natural.id,x:d.x+d.definition.width/2,y:d.y+d.definition.height/2,free:d.natural.boundBuildingId==null}));
}
export const MINIMAP_SIZES=Object.freeze([.75,1,1.35,1.7]);
export const MINIMAP_SIZE_DEFAULT=1;
export const MINIMAP_SIZE_KEY='newgame.minimap.size';
export const clampMinimapStep=step=>Number.isInteger(step)?Math.max(0,Math.min(MINIMAP_SIZES.length-1,step)):MINIMAP_SIZE_DEFAULT;
export function readMinimapStep(storage=globalThis.localStorage){
  try{const raw=storage?.getItem(MINIMAP_SIZE_KEY);return raw==null?MINIMAP_SIZE_DEFAULT:clampMinimapStep(Number(raw));}catch{return MINIMAP_SIZE_DEFAULT;}
}
export function writeMinimapStep(step,storage=globalThis.localStorage){try{storage?.setItem(MINIMAP_SIZE_KEY,String(clampMinimapStep(step)));}catch{/* works without storage */}}
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
  const relief=scene.relief,shade=relief&&relief.width===width&&relief.height===height?relief.shade:null;
  const pixels=out??new Uint8ClampedArray(width*height*4),states=new Uint8Array(width*height),live=new Uint8Array(width*height),remembered=new Uint8Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)states[y*width+x]=fog.displayState({x,y});
  // Live objects only where they are in sight; remembered copies only where they are not.
  for(const building of scene.buildings??[])stamp(live,width,{x:building.x,y:building.y,width:building.definition?.width??1,height:building.definition?.height??1},objectKind(scene,{kind:'building',type:building.type}));
  for(const view of scene.resources?.values?.()??[]){const o=view.getData?.('object');if(!o)continue;const d=definitionFor(o,scene.objectRegistry);stamp(live,width,{x:o.x??o.tile?.x,y:o.y??o.tile?.y,width:d.width,height:d.height},d.tree?KIND.tree:KIND.deposit);}
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
        color=kind?KIND_COLOR[kind]:rock?MINIMAP_COLORS.rock:paved?MINIMAP_COLORS.paved:level>2?MINIMAP_COLORS.wear:MINIMAP_COLORS.groundType[groundGrid?.[y]?.[x]]??MINIMAP_COLORS.ground[knownSeason]??MINIMAP_COLORS.ground.Spring;
        if(!visible&&fog.enabled)color=mute(color);
      }
    }
    // m-teren-vyska: slopes are shaded on known ground (light from the upper left of the screen).
    if(shade&&state!==VISIBILITY.UNEXPLORED&&color!==MINIMAP_COLORS.unknown){const k=1+Math.max(-.3,Math.min(.3,shade[y*(width+1)+x]*1.8));color=[color[0]*k,color[1]*k,color[2]*k];}
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
  constructor(scene,{document:doc=globalThis.document,now=()=>performance.now(),storage=globalThis.localStorage}={}){
    this.storage=storage;
    this.scene=scene;this.now=now;this.signature=null;this.nextRefresh=0;this.nextOverlay=0;this.redraws=0;
    const fog=scene.fog;this.size={width:fog.width,height:fog.height};
    this.root=doc.createElement('div');this.root.id='minimap';this.root.className='minimap';this.root.setAttribute('role','group');
    this.canvas=doc.createElement('canvas');this.canvas.className='minimap-canvas';this.canvas.setAttribute('role','img');this.canvas.width=fog.width*MINIMAP.scale;this.canvas.height=fog.height*MINIMAP.scale;this.root.append(this.canvas);
    this.base=doc.createElement('canvas');this.base.width=fog.width;this.base.height=fog.height;
    this.context=this.canvas.getContext('2d');this.baseContext=this.base.getContext('2d');this.image=this.baseContext?.createImageData(fog.width,fog.height);
    this.controller=new AbortController();const options={signal:this.controller.signal};
    // Navigation: a click centres the camera on that known or unknown spot; it reveals nothing.
    this.sizeControls=doc.createElement('div');this.sizeControls.className='minimap-size';
    const sizeButton=(delta,text)=>{const b=doc.createElement('button');b.type='button';b.textContent=text;b.setAttribute('data-minimap-size',delta>0?'bigger':'smaller');b.addEventListener('click',e=>{e.stopPropagation();this.resize(delta);},{signal:this.controller.signal});return b;};
    this.biggerButton=sizeButton(1,'+');this.smallerButton=sizeButton(-1,'−');this.sizeControls.append(this.biggerButton,this.smallerButton);
    // m-mapa-kraje: the World window (scouting the zones around the map).
    this.worldButton=doc.createElement('button');this.worldButton.type='button';this.worldButton.className='minimap-world';this.worldButton.textContent='🌍';this.worldButton.setAttribute('data-minimap-world','');this.worldButton.addEventListener('click',e=>{e.stopPropagation();scene.worldPanel?.open();},{signal:this.controller.signal});this.sizeControls.append(this.worldButton);this.root.append(this.sizeControls);
    try{this.depositMarks=JSON.parse(storage?.getItem?.(DEPOSIT_KEY)??'{}')??{};}catch{this.depositMarks={};}
    this.depositButtons={};for(const kind of Object.keys(DEPOSIT_MARKS)){const b=doc.createElement('button');b.type='button';b.className='minimap-deposit';b.textContent=DEPOSIT_MARKS[kind].icon;b.setAttribute('data-minimap-deposit',kind);
      b.addEventListener('click',e=>{e.stopPropagation();this.depositMarks[kind]=!this.depositMarks[kind];try{storage?.setItem?.(DEPOSIT_KEY,JSON.stringify(this.depositMarks));}catch{/* works without storage */}this.markButtons();this.nextOverlay=0;},{signal:this.controller.signal});this.depositButtons[kind]=b;this.sizeControls.append(b);}
    this.markButtons();
    this.root.addEventListener('pointerdown',e=>{if(e.target?.closest?.('.minimap-size')){e.stopPropagation();return;}e.preventDefault();e.stopPropagation();this.panTo(minimapPointToGrid(this.root.getBoundingClientRect(),{x:e.clientX,y:e.clientY},{size:fog.width,cssSize:this.canvas.offsetWidth||MINIMAP.cssSize}));},options);
    for(const type of ['click','mousedown','mouseup','wheel','contextmenu'])this.root.addEventListener(type,e=>e.stopPropagation(),options);
    (doc.querySelector('#corner-stack')??doc.querySelector('#game')??scene.game?.canvas?.parentElement)?.append(this.root);this.setSizeStep(readMinimapStep(storage),{save:false});this.label();this.offLanguage=onLanguageChange(()=>this.label());
  }
  markButtons(){for(const [kind,b] of Object.entries(this.depositButtons??{})){const on=!!this.depositMarks?.[kind];b.setAttribute('aria-pressed',String(on));b.classList?.toggle?.('on',on);}}
  resize(delta){this.setSizeStep(this.sizeStep+delta);}
  setSizeStep(step,{save=true}={}){
    this.sizeStep=clampMinimapStep(step);this.root.style?.setProperty?.('--minimap-scale',String(MINIMAP_SIZES[this.sizeStep]));this.root.setAttribute('data-size',String(this.sizeStep));
    if(this.biggerButton){this.biggerButton.disabled=this.sizeStep>=MINIMAP_SIZES.length-1;this.smallerButton.disabled=this.sizeStep<=0;}
    if(save)writeMinimapStep(this.sizeStep,this.storage);
  }
  label(){this.root.setAttribute('aria-label',t('minimap.label'));if(this.worldButton){this.worldButton.title=t('scouting.button');this.worldButton.setAttribute('aria-label',t('scouting.button'));}this.canvas.setAttribute('aria-label',t('minimap.label'));this.root.title=t('minimap.hint');
    for(const [b,key] of [[this.biggerButton,'minimap.bigger'],[this.smallerButton,'minimap.smaller'],[this.depositButtons?.stone,'minimap.depositsStone'],[this.depositButtons?.iron,'minimap.depositsIron']])if(b){b.title=t(key);b.setAttribute('aria-label',t(key));}}
  panTo(point){
    // A click near a shown deposit mark goes to that deposit.
    for(const kind of Object.keys(DEPOSIT_MARKS))if(this.depositMarks?.[kind])for(const d of minimapDeposits(this.scene,kind))if(Math.hypot(d.x-point.x,d.y-point.y)<=3){point={x:d.x,y:d.y};break;}
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
    for(const kind of Object.keys(DEPOSIT_MARKS))if(this.depositMarks?.[kind])for(const d of minimapDeposits(s,kind)){const r=DEPOSIT_MARKS[kind];c.fillStyle=d.free?r.free:r.bound;c.strokeStyle='#1c140a';c.lineWidth=1;c.beginPath();c.moveTo(d.x*k,d.y*k-4);c.lineTo(d.x*k+4,d.y*k);c.lineTo(d.x*k,d.y*k+4);c.lineTo(d.x*k-4,d.y*k);c.closePath();c.fill();c.stroke();}
    const king=s.character?.position??s.character?.tile;if(king){c.fillStyle='#ffd34d';c.strokeStyle='#2a1c08';c.lineWidth=1;c.beginPath();c.arc(king.x*k,king.y*k,3,0,Math.PI*2);c.fill();c.stroke();}
  }
  destroy(){this.controller.abort();this.offLanguage?.();this.root.remove();}
}
