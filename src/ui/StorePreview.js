import { element } from './objectLabels.js';
import { resourceGroup, groupedResources, STORE_PREVIEW_DELAY_MS } from '../data/resourceGroups.js';
import { buildingTooltipsEnabled,setBuildingTooltipsEnabled } from '../data/buildingTooltip.js';
import { buildingTooltipDelayMs } from '../data/devBalance.js';
import { buildingTooltipContent } from './buildingTooltipContent.js';
import { blockingDialog } from './dockedPanels.js';

// m-ui-prehled-surovin (24): resting the pointer on the store gauge in the top bar shows, after STORE_PREVIEW_DELAY_MS,
// a small preview: used / capacity on the first line, then icon + count for each stored good, sorted and tinted by
// resource group. It goes away at once when the pointer leaves. A quick pass shows nothing.
// m-budovy-tooltip (86): the same element is the one building tooltip on the map – every building (name, status,
// workers, production, residents, construction, and a store's contents like the preview above), after
// buildingTooltipDelayMs() (0.8 s, or the Dev value). Switched off in Settings ("Building tooltips").
export function storeContents(scene,locations){
  const stock={};let used=0,capacity=0;
  for(const l of locations){capacity+=l.capacity??0;for(const [id,n] of Object.entries(l.stock??{}))if(n>0){stock[id]=(stock[id]??0)+n;used+=n;}}
  const registry=scene.objectRegistry,items=groupedResources(Object.keys(stock).map(id=>registry.get(id)).filter(Boolean),registry).map(d=>({id:d.id,count:stock[d.id],group:resourceGroup(d,registry),definition:d}));
  return {used,capacity,items};
}
export class StorePreview {
  constructor(scene,{document:doc=globalThis.document,delay=STORE_PREVIEW_DELAY_MS,buildingDelay=null,storage=globalThis.localStorage}={}){
    this.scene=scene;this.doc=doc;this.delay=delay;this.buildingDelay=buildingDelay;this.root=doc.createElement('div');this.root.id='store-preview';this.root.className='store-preview';this.root.setAttribute('role','tooltip');this.root.hidden=true;doc.body.append(this.root);
    this.key=null;this.timer=null;this.signature=null;this.controller=new AbortController();
    this.enabled=buildingTooltipsEnabled(storage);this.setting=doc.querySelector?.('#settings-building-tooltips')??null;
    if(this.setting){this.setting.checked=this.enabled;this.setting.addEventListener('change',()=>{this.enabled=setBuildingTooltipsEnabled(this.setting.checked,storage);if(!this.enabled&&this.key?.startsWith('building:'))this.hide();},{signal:this.controller.signal});}
  }
  locationsOf(building){return [...(this.scene.foodStorage?.locations?.values()??[])].filter(l=>l.buildingId===building.id&&['fallback','storage','pile'].includes(l.kind));}
  // target: {key, locations:()=>[...], x, y} (store gauge) or {key, building, x, y, delay} (map building), or null.
  hover(target){
    if(!target){this.hide();return;}
    if(target.key===this.key){this.pending=target;if(!this.root.hidden)this.render(target);this.position(target.x,target.y,target.below);return;}
    this.hide();this.key=target.key;this.pending=target;
    // A map building tooltip never opens over a dialog that opened meanwhile (Escape → Game Menu).
    this.timer=setTimeout(()=>{if(this.key===target.key&&!(this.pending?.building&&blockingDialog(this.doc))){this.render(this.pending);this.root.hidden=false;this.position(this.pending.x,this.pending.y,this.pending.below);}},target.delay??this.delay);
  }
  // allowed: false in build mode, while dragging, for the selected building and on touch (GameScene decides).
  hoverBuilding(building,x,y,{allowed=true}={}){
    if(!building||!allowed||!this.enabled){if(this.key?.startsWith?.('building:')||this.key==null)this.hover(null);return;}
    this.hover({key:`building:${building.id}`,building,x,y,delay:this.buildingDelay??buildingTooltipDelayMs()});
  }
  render(target){
    if(target.building){this.renderBuilding(target.building);return;}
    this.root.classList.remove('building-tooltip');this.signature=null;
    const {used,capacity,items}=storeContents(this.scene,target.locations()),assets=this.scene.assets;
    const grid=element('div','store-preview-grid');
    for(const item of items){const cell=element('span','store-preview-item');cell.dataset.resourceGroup=item.group;cell.title=item.definition.name;const img=element('img','');img.alt='';img.src=assets?.previewURL?.(item.definition)??'';cell.append(img,element('b','',String(item.count)));grid.append(cell);}
    this.root.replaceChildren(element('strong','store-preview-usage',`${used} / ${capacity}`),grid);
  }
  renderBuilding(building){
    const content=buildingTooltipContent(this.scene,building),signature=JSON.stringify([content.title,content.icons,content.lines.map(l=>l.kind==='stock'?[l.used,l.capacity,l.items.map(i=>[i.id,i.count])]:[l.text,l.icon])]);
    this.root.classList.add('building-tooltip');if(signature===this.signature)return;this.signature=signature;
    const assets=this.scene.assets,title=element('strong','building-tooltip-title',content.title);
    for(const i of content.icons){const icon=element('span','building-tooltip-icon',i.icon);icon.dataset.status=i.id;icon.title=i.label;icon.setAttribute('aria-label',i.label);title.append(' ',icon);}
    const rows=content.lines.map(line=>{
      if(line.kind!=='stock'){const row=element('div','building-tooltip-line',line.text);if(line.icon){const mood=element('span','building-tooltip-mood',line.icon);mood.dataset.mood=line.mood;mood.title=`${line.moodLabel} (${line.happiness} %)`;row.append(' ',mood);}return row;}
      const row=element('div','building-tooltip-line building-tooltip-stock');
      for(const item of line.items){const cell=element('span','store-preview-item');cell.dataset.resourceGroup=item.group;cell.title=item.definition.name;const img=element('img','');img.alt='';img.src=assets?.previewURL?.(item.definition)??'';cell.append(img,element('b','',String(item.count)));row.append(cell);}
      row.append(element('span','store-preview-usage',`${line.used} / ${line.capacity}`));return row;
    });
    this.root.replaceChildren(title,...rows);
  }
  position(x,y,below=false){if(this.root.hidden)return;const w=this.root.offsetWidth||160,h=this.root.offsetHeight||60;this.root.style.left=`${Math.round(Math.max(6,Math.min(innerWidth-w-6,x+14)))}px`;this.root.style.top=`${Math.round(Math.max(6,Math.min(innerHeight-h-6,below?y+18:y-h-10)))}px`;}
  hide(){clearTimeout(this.timer);this.timer=null;this.key=null;this.pending=null;this.signature=null;this.root.hidden=true;}
  destroy(){this.hide();this.controller.abort();this.root.remove();}
}
