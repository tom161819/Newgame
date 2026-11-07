import { element } from './objectLabels.js';
import { resourceGroup, groupedResources, STORE_PREVIEW_DELAY_MS } from '../data/resourceGroups.js';

// m-ui-prehled-surovin (24): resting the pointer on a store on the map (Starter Stockpile, Warehouse, Granary, Armory…)
// or on the store gauge in the top bar shows, after STORE_PREVIEW_DELAY_MS, a small preview: used / capacity on the
// first line, then icon + count for each stored good, sorted and tinted by resource group. It goes away at once when
// the pointer leaves. A quick pass shows nothing.
export function storeContents(scene,locations){
  const stock={};let used=0,capacity=0;
  for(const l of locations){capacity+=l.capacity??0;for(const [id,n] of Object.entries(l.stock??{}))if(n>0){stock[id]=(stock[id]??0)+n;used+=n;}}
  const registry=scene.objectRegistry,items=groupedResources(Object.keys(stock).map(id=>registry.get(id)).filter(Boolean),registry).map(d=>({id:d.id,count:stock[d.id],group:resourceGroup(d,registry),definition:d}));
  return {used,capacity,items};
}
export class StorePreview {
  constructor(scene,{document:doc=globalThis.document,delay=STORE_PREVIEW_DELAY_MS}={}){
    this.scene=scene;this.delay=delay;this.root=doc.createElement('div');this.root.id='store-preview';this.root.className='store-preview';this.root.setAttribute('role','tooltip');this.root.hidden=true;doc.body.append(this.root);
    this.key=null;this.timer=null;
  }
  locationsOf(building){return [...(this.scene.foodStorage?.locations?.values()??[])].filter(l=>l.buildingId===building.id&&['fallback','storage'].includes(l.kind));}
  // target: {key, locations:()=>[...], x, y} or null.
  hover(target){
    if(!target){this.hide();return;}
    if(target.key===this.key){this.position(target.x,target.y,target.below);if(!this.root.hidden)this.render(target);return;}
    this.hide();this.key=target.key;this.pending=target;
    this.timer=setTimeout(()=>{if(this.key===target.key){this.render(this.pending);this.root.hidden=false;this.position(this.pending.x,this.pending.y,this.pending.below);}},this.delay);
  }
  hoverBuilding(building,x,y){
    if(!building){this.hover(null);return;}
    const locations=this.locationsOf(building);if(!locations.length){this.hover(null);return;}
    this.hover({key:`building:${building.id}`,locations:()=>this.locationsOf(building),x,y});
  }
  render(target){
    const {used,capacity,items}=storeContents(this.scene,target.locations()),assets=this.scene.assets;
    const grid=element('div','store-preview-grid');
    for(const item of items){const cell=element('span','store-preview-item');cell.dataset.resourceGroup=item.group;cell.title=item.definition.name;const img=element('img','');img.alt='';img.src=assets?.previewURL?.(item.definition)??'';cell.append(img,element('b','',String(item.count)));grid.append(cell);}
    this.root.replaceChildren(element('strong','store-preview-usage',`${used} / ${capacity}`),grid);
  }
  position(x,y,below=false){if(this.root.hidden)return;const w=this.root.offsetWidth||160,h=this.root.offsetHeight||60;this.root.style.left=`${Math.round(Math.max(6,Math.min(innerWidth-w-6,x+14)))}px`;this.root.style.top=`${Math.round(Math.max(6,Math.min(innerHeight-h-6,below?y+18:y-h-10)))}px`;}
  hide(){clearTimeout(this.timer);this.timer=null;this.key=null;this.pending=null;this.root.hidden=true;}
  destroy(){this.hide();this.root.remove();}
}
