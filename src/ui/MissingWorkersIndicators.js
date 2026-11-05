import { t } from '../i18n/index.js';
import { StaffingStatus } from '../systems/StaffingStatus.js';
import { towerBase,buildingDefinition } from '../game/buildings.js';
import { element } from './objectLabels.js';

const workersIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M3 21v-5a6 6 0 0 1 12 0v5H3Zm13 0v-6a7 7 0 0 0-1-3 5 5 0 0 1 7 5v4h-6Z"/></svg>';
export class MissingWorkersIndicators {
  constructor(scene){
    this.scene=scene;this.model=new StaffingStatus(scene);this.buttons=new Map();this.controller=new AbortController();this.layer=element('div','worker-indicators');this.layer.setAttribute('aria-label',t('staffing.layer'));this.tooltip=element('div','staffing-tooltip');this.tooltip.id='staffing-tooltip';this.tooltip.setAttribute('role','tooltip');this.tooltip.hidden=true;document.body.append(this.layer,this.tooltip);
    const options={signal:this.controller.signal};for(const event of ['pointerdown','mousedown','mouseup','click','wheel','keydown','keyup'])this.layer.addEventListener(event,e=>e.stopPropagation(),options);
    this.layer.addEventListener('focusin',()=>{for(const key of Object.values(scene.worldCamera?.keys??{}))key.reset();},options);
    this.unsubscribe=this.model.subscribe(()=>this.update());
  }
  create(id){
    const controller=new AbortController(),options={signal:controller.signal},button=element('button','missing-workers');button.type='button';button.dataset.staffingBuilding=id;button.innerHTML=workersIcon;button.style.animationDelay=`-${performance.now()%1500}ms`;
    const show=()=>{this.hoveredId=id;this.refreshTooltip();},hide=()=>{if(this.hoveredId===id)this.hideTooltip();};button.addEventListener('pointerenter',show,options);button.addEventListener('focus',show,options);button.addEventListener('pointerleave',hide,options);button.addEventListener('blur',hide,options);
    button.addEventListener('click',event=>{event.stopPropagation();const record=this.model.records.get(id);if(!record||!this.scene.fog.isVisibleObject(record.building)||!this.scene.buildings.includes(record.building))return;this.hideTooltip();this.scene.workplacePanel.open(record.building);},options);
    button.addEventListener('keydown',event=>{if(event.code==='Escape'){event.preventDefault();this.hideTooltip();button.blur();}},options);
    this.layer.append(button);const item={button,controller};this.buttons.set(id,item);return item;
  }
  update(){
    const s=this.scene,c=s.cameras.main,rect=s.game.canvas.getBoundingClientRect(),signature=[this.model.revision,s.fog.signature,c.scrollX,c.scrollY,c.zoom,c.width,c.height,rect.x,rect.y,rect.width,rect.height].join('|');
    if(signature===this.signature)return;this.signature=signature;
    const bounds=[rect.x,rect.y,rect.width,rect.height].join('|');if(bounds!==this.bounds){this.bounds=bounds;Object.assign(this.layer.style,{left:`${rect.x}px`,top:`${rect.y}px`,width:`${rect.width}px`,height:`${rect.height}px`});}
    const keep=new Set(),occupied=[],scaleX=rect.width/c.width,scaleY=rect.height/c.height,size=Math.max(16,Math.min(24,22*Math.sqrt(c.zoom))),center={x:c.scrollX+c.width/2,y:c.scrollY+c.height/2};
    for(const [id,status]of this.model.records){
      const b=status.building;if(!s.fog.isVisibleObject(b))continue;const base=towerBase(b),definition=buildingDefinition(b),x=((base.x-center.x)*c.zoom+c.width/2)*scaleX,y=((base.y-definition.visualHeight-12-center.y)*c.zoom+c.height/2)*scaleY;
      if(x<size/2||x>rect.width-size/2||y<size/2||y>rect.height-size/2)continue;
      let left=x-size/2,top=y-size/2;
      for(let attempt=0;attempt<8&&occupied.some(p=>Math.abs(p.left-left)<size+3&&Math.abs(p.top-top)<size+3);attempt++){left=Math.max(0,Math.min(rect.width-size,x-size/2+(attempt%2?-1:1)*Math.ceil((attempt+1)/2)*(size+3)));top=Math.max(0,y-size/2-Math.floor(attempt/4)*(size+3));}
      occupied.push({left,top});keep.add(id);const item=this.buttons.get(id)??this.create(id),{button}=item,label=[definition.name,status.count,status.capacity].join('|');
      if(label!==item.label){item.label=label;button.dataset.staffingTone=status.tone;button.dataset.workers=status.count;button.dataset.capacity=status.capacity;button.setAttribute('aria-label',`${t('staffing.title')} · ${definition.name} · ${t('workplace.workers',{count:status.count,capacity:status.capacity})} · ${t('staffing.missing',{count:status.missing})}`);}
      if(size!==item.size){item.size=size;button.style.width=`${size}px`;button.style.height=`${size}px`;}button.style.transform=`translate3d(${left}px,${top}px,0)`;
    }
    for(const [id,item]of this.buttons)if(!keep.has(id)){if(this.hoveredId===id)this.hideTooltip();item.controller.abort();item.button.remove();this.buttons.delete(id);}
    this.refreshTooltip();
  }
  refreshTooltip(){
    const status=this.model.records.get(this.hoveredId),button=this.buttons.get(this.hoveredId)?.button;if(!status||!button||!this.scene.fog.isVisibleObject(status.building)){this.hideTooltip();return;}
    const name=buildingDefinition(status.building).name;this.tooltip.replaceChildren(element('strong','',t('staffing.title')),element('span','',name),element('span','',t('workplace.workers',{count:status.count,capacity:status.capacity})),element('span','',t('staffing.missing',{count:status.missing})));this.tooltip.hidden=false;button.setAttribute('aria-describedby',this.tooltip.id);
    const rect=button.getBoundingClientRect();this.tooltip.style.left=`${Math.max(6,Math.min(innerWidth-this.tooltip.offsetWidth-6,rect.x+rect.width/2-this.tooltip.offsetWidth/2))}px`;this.tooltip.style.top=`${Math.max(6,rect.top-this.tooltip.offsetHeight-8)}px`;
  }
  hideTooltip(){this.buttons.get(this.hoveredId)?.button.removeAttribute('aria-describedby');this.hoveredId=null;this.tooltip.hidden=true;this.tooltip.replaceChildren();}
  destroy(){this.hideTooltip();this.controller.abort();this.unsubscribe();this.model.destroy();for(const item of this.buttons.values())item.controller.abort();this.buttons.clear();this.layer.remove();this.tooltip.remove();}
}
