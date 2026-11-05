import { t } from '../i18n/index.js';
import { tileKey } from './stones.js';
import { PAVEMENT } from '../data/pavement.js';
import { pavementTiles,pavementPlan,placePavement,isPavementSite } from './pavement.js';

// S11 Stone Pavement tool: Single | Line | Area | Remove. Press marks the start, dragging previews (green new, red
// invalid, grey already paved), release places one order. Only ground in sight can be ordered or cleared.
export class PavementTool {
  constructor(scene){
    this.scene=scene;this.mode=PAVEMENT.defaultMode;this.anchor=null;this.views=new Map();this.key=null;
    this.bar=document.createElement('div');this.bar.id='pavement-modes';this.bar.className='pavement-modes';this.bar.setAttribute('role','radiogroup');this.bar.hidden=true;
    this.bar.setAttribute('aria-label',t('pavement.modes'));
    for(const mode of PAVEMENT.modes){const b=document.createElement('button');b.type='button';b.dataset.pavementMode=mode;b.setAttribute('role','radio');b.textContent=t(`pavement.mode.${mode}`);this.bar.append(b);}
    this.onClick=e=>{const b=e.target.closest('[data-pavement-mode]');if(b){this.setMode(b.dataset.pavementMode);e.stopPropagation();}};this.bar.addEventListener('click',this.onClick);
    (document.querySelector('#building-selection')?.parentElement??document.body).append(this.bar);this.refreshBar();
  }
  active(){return this.scene.buildMode&&this.scene.selectedBuilding?.construction?.mode==='pavement';}
  setMode(mode){if(!PAVEMENT.modes.includes(mode))return;this.mode=mode;this.anchor=null;this.key=null;this.refreshBar();if(this.scene.previewAnchor)this.preview(this.scene.previewAnchor);}
  refreshBar(){this.bar.hidden=!this.active();for(const b of this.bar.children)b.setAttribute('aria-checked',String(b.dataset.pavementMode===this.mode));}
  inSight(tile){return !this.scene.fog?.enabled||this.scene.fog.isVisibleTile(tile);}
  tiles(end){return pavementTiles(this.mode,this.anchor??end,this.anchor?end:end).slice(0,PAVEMENT.maxOrderTiles+1);}
  plan(tiles){
    const s=this.scene,visible=tiles.filter(tile=>this.inSight(tile)),hidden=tiles.filter(tile=>!this.inSight(tile));
    const plan=pavementPlan({map:s.map,tiles:visible,resources:s.resourceOccupancy,buildings:s.buildings,pathWear:s.pathWear,inventory:s.inventory,registry:s.objectRegistry});
    return {...plan,invalid:[...plan.invalid,...hidden]};
  }
  removable(tiles){const s=this.scene,sites=new Map(s.buildings.filter(isPavementSite).map(b=>[tileKey(b),b]));return tiles.filter(tile=>this.inSight(tile)&&(s.pathWear?.isPaved(tile)||sites.has(tileKey(tile))));}
  begin(tile){this.anchor={...tile};this.key=null;this.preview(tile);}
  preview(end){
    const s=this.scene;s.preview.setVisible(false);const tiles=this.tiles(end),key=`${this.mode}:${tiles.map(tileKey).join(';')}:${s.inventory.count('stone')}`;
    if(key===this.key){for(const v of this.views.values())v.setVisible(true);return;}this.key=key;
    const paint=new Map();let status;
    if(this.mode==='remove'){const remove=this.removable(tiles);for(const tile of remove)paint.set(tileKey(tile),[tile,0xf27777]);status=t('pavement.removePlan',{count:remove.length});}
    else{const plan=this.plan(tiles);for(const tile of plan.fresh)paint.set(tileKey(tile),[tile,0x71dba6]);for(const tile of plan.invalid)paint.set(tileKey(tile),[tile,0xf27777]);for(const tile of plan.paved)paint.set(tileKey(tile),[tile,0xb8b4a6]);
      status=plan.error&&!plan.fresh.length?plan.error:`${t('pavement.plan',{count:plan.fresh.length,cost:plan.cost.stone??0,invalid:plan.invalid.length,paved:plan.paved.length})}${plan.error?` · ${plan.error}`:''}`;}
    for(const [id,[tile,tint]]of paint){const object={...tile,type:'stone_pavement',definition:s.objectRegistry.require('stone_pavement'),tiles:[tile]};let view=this.views.get(id);
      if(!view){view=s.createBuildingView(object.definition,object,true);this.views.set(id,view);}view.paint(object,tint);view.setVisible(true);}
    for(const [id,view]of this.views)if(!paint.has(id)){view.destroy();this.views.delete(id);}
    s.setStatus(status);
  }
  confirm(end){
    const s=this.scene,tiles=this.tiles(end);this.anchor=null;this.key=null;
    if(this.mode==='remove'){const count=this.remove(this.removable(tiles));s.setStatus(t('pavement.removed',{count}));this.preview(end);return count;}
    const plan=this.plan(tiles);if(plan.error){s.setStatus(plan.error);this.preview(end);return 0;}
    const result=placePavement({map:s.map,tiles:plan.fresh,resources:s.resourceOccupancy,buildings:s.buildings,pathWear:s.pathWear,inventory:s.inventory,registry:s.objectRegistry});
    if(result.error){s.setStatus(result.error);this.preview(end);return 0;}
    for(const building of result.buildings){s.constructionSystem.plan(building);s.towerViews.set(building.id,s.createBuildingView(building.definition,building));}
    s.events?.emit('buildings:changed');s.updateInventory();this.clearViews();
    s.setStatus(t('pavement.ordered',{count:result.buildings.length,cost:result.cost.stone}));return result.buildings.length;
  }
  // Finished pavement is removed without a refund; an unfinished blueprint is cancelled by the ordinary refund rules.
  remove(tiles){
    const s=this.scene,sites=new Map(s.buildings.filter(isPavementSite).map(b=>[tileKey(b),b]));let count=0;
    for(const tile of tiles){const site=sites.get(tileKey(tile));if(site){s.constructionSystem.cancel(site);s.towerViews.get(site.id)?.destroy();s.towerViews.delete(site.id);count++;}else if(s.pathWear.setPaved(tile,false))count++;}
    if(count){s.terrain?.invalidateArea(tiles);s.updateInventory();}return count;
  }
  clearViews(){for(const v of this.views.values())v.destroy();this.views.clear();this.key=null;}
  clear(){this.anchor=null;this.clearViews();this.refreshBar();}
  destroy(){this.clear();this.bar.removeEventListener('click',this.onClick);this.bar.remove();}
}
