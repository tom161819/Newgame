import { t } from '../i18n/index.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { BUILDER_WORKSHOP } from '../data/builderWorkshop.js';

// #118: which Builder belongs to which finished Builder's Workshop. Derived, never saved: recomputed whenever the set of
// finished workshops or of living Builders changes. Builders are taken in id order and each gets the nearest workshop
// that still has a free place, so the assignment stays stable while nothing changes.
export class BuilderWorkshopSystem {
  constructor(scene){this.scene=scene;this.key=null;this.byWorker=new Map();this.byWorkshop=new Map();this.noticeShown=false;}
  capacity(building){return buildingDefinition(building).builderWorkshop?.capacity??BUILDER_WORKSHOP.capacity;}
  workshops(){return (this.scene.buildings??[]).filter(b=>buildingDefinition(b).builderWorkshop&&buildingIsComplete(b));}
  builders(){return [...(this.scene.workerSystem?.workers.values()??[])].filter(w=>w.isAlive&&w.profession==='builder').sort((a,b)=>String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));}
  refresh(){
    const shops=this.workshops(),builders=this.builders(),key=`${shops.map(b=>b.id).join(',')}|${builders.map(w=>w.id).join(',')}`;
    if(key===this.key)return;this.key=key;this.byWorker=new Map();this.byWorkshop=new Map(shops.map(b=>[b.id,[]]));
    for(const worker of builders){
      let best=null,distance=Infinity;
      for(const shop of shops){
        if(this.byWorkshop.get(shop.id).length>=this.capacity(shop))continue;
        const d=Math.hypot(shop.x+buildingDefinition(shop).width/2-worker.tile.x-.5,shop.y+buildingDefinition(shop).height/2-worker.tile.y-.5);
        if(d<distance){distance=d;best=shop;}
      }
      if(best){this.byWorkshop.get(best.id).push(worker);this.byWorker.set(worker.id,best);}
    }
  }
  workshopFor(worker){this.refresh();return this.byWorker.get(worker?.id)??null;}
  served(building){this.refresh();return this.byWorkshop.get(building.id)??[];}
  // Construction and demolition speed factor for one actor; only Builders are affected.
  factor(actor){
    if(actor?.profession!=='builder')return 1;
    if(this.workshopFor(actor))return 1;
    this.notice();return BUILDER_WORKSHOP.unservedSpeed;
  }
  // Once per session, when a Builder actually works without a workshop place.
  notice(){if(this.noticeShown)return;this.noticeShown=true;this.scene.eventFeed?.push?.('builder-workshop-missing',t('builderWorkshop.notice',{percent:Math.round((1-BUILDER_WORKSHOP.unservedSpeed)*100)}));}
  summary(){this.refresh();const builders=this.builders();return {builders:builders.length,served:this.byWorker.size,workshops:this.byWorkshop.size};}
}
