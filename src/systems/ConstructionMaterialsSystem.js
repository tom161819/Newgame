import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';

// Site stock is part of the same physical storage ledger as warehouses. The
// requirement is a recipe, not another copy of the invested resources.
export class ConstructionMaterialsSystem {
  constructor(construction){this.construction=construction;this.scene=construction.scene;}
  get storage(){return this.scene.foodStorage;}
  get enabled(){return !!this.storage?.physicalMaterials;}
  site(id){return this.scene.buildings.find(b=>b.id===id&&!buildingIsComplete(b))??null;}
  owner(id){return `site-${id}`;}
  required(building){return Object.fromEntries(Object.entries(buildingDefinition(building).cost).filter(([id])=>this.storage.manages(id)));}
  location(building){
    const id=this.owner(building.id),d=buildingDefinition(building);let location=this.storage.locations.get(id);
    if(!location){location={id,kind:'site',buildingId:building.id,x:building.x,y:building.y,width:d.width,height:d.height,capacity:Object.values(building.materialSupply.required).reduce((n,v)=>n+v,0),allowed:Object.keys(building.materialSupply.required),stock:{},legacyOverflow:0};this.storage.locations.set(id,location);this.storage.changed();}return location;
  }
  prepare(building){
    if(!this.enabled)return false;
    const cost=buildingDefinition(building).cost;if(!this.scene.inventory.canAfford(cost))return false;
    building.materialSupply={version:1,required:this.required(building),legacyPaid:false};this.location(building);
    for(const [resource,needed]of Object.entries(building.materialSupply.required)){
      let remaining=needed;
      for(const location of this.storage.locations.values())if(this.storage.isStock(location)&&remaining){
        const amount=Math.min(remaining,this.storage.free(location.id,resource));if(!amount)continue;
        const id=this.storage.reserve('stock',location.id,resource,amount,this.owner(building.id));if(!id){this.discardPrepared(building);return false;}
        this.storage.reservations.get(id).siteId=building.id;remaining-=amount;
      }
      if(remaining){this.discardPrepared(building);return false;}
    }
    const currency=Object.fromEntries(Object.entries(cost).filter(([id])=>!this.storage.manages(id)));
    if(!this.scene.inventory.pay(currency)){this.discardPrepared(building);return false;}return true;
  }
  discardPrepared(building){
    for(const r of [...this.storage.reservations.values()])if(r.siteId===building.id)this.storage.release(r.id);
    this.storage.locations.delete(this.owner(building.id));delete building.materialSupply;this.storage.changed();
  }
  registerLegacy(building){
    if(!this.enabled||buildingIsComplete(building)||building.materialSupply)return;
    building.materialSupply={version:1,required:this.required(building),legacyPaid:true};const location=this.location(building);
    location.stock={...building.materialSupply.required};this.storage.changed();
  }
  importLegacySites(){if(this.enabled)for(const building of this.scene.buildings)this.registerLegacy(building);}
  ready(building){
    if(!this.enabled)return true;
    const supply=building.materialSupply;if(!supply)return false;const location=this.storage.locations.get(this.owner(building.id));
    return !!location&&Object.entries(supply.required).every(([id,n])=>(location.stock[id]??0)>=n);
  }
  candidates(siteId=null){
    if(!this.enabled)return [];
    const tasks=[];
    for(const r of this.storage.reservations.values())if(r.kind==='stock'&&r.siteId!=null&&r.owner===this.owner(r.siteId)&&this.site(r.siteId)&&(siteId==null||r.siteId===siteId))tasks.push({priority:0,siteId:r.siteId,allocationId:r.id,sourceId:r.locationId,destinationId:this.owner(r.siteId),resource:r.resource,amount:r.amount});
    for(const drop of this.scene.dropSystem.drops.values())if(drop.siteId!=null&&this.site(drop.siteId)&&(siteId==null||drop.siteId===siteId))tasks.push({priority:0,siteId:drop.siteId,sourceDropId:drop.id,destinationId:this.owner(drop.siteId),resource:drop.resource,amount:drop.amount});return tasks;
  }
  returnAllocation(id){
    const r=this.storage.reservations.get(id);if(!r)return;
    if(!this.site(r.siteId)){this.storage.release(id);return;}
    r.owner=this.owner(r.siteId);
    const merge=[...this.storage.reservations.values()].find(other=>other.id!==r.id&&other.kind==='stock'&&other.owner===r.owner&&other.locationId===r.locationId&&other.resource===r.resource);
    if(merge){merge.amount+=r.amount;this.storage.reservations.delete(r.id);}this.storage.changed();
  }
  restoreAllocation(siteId,locationId,resource,amount){
    if(!this.site(siteId))return;
    const id=this.storage.reserve('stock',locationId,resource,amount,this.owner(siteId));
    if(!id)throw new Error('Cannot restore returned construction materials.');this.storage.reservations.get(id).siteId=siteId;this.returnAllocation(id);
  }
  delivered(){this.construction.revision++;}
  complete(building){
    if(!this.enabled)return true;if(!this.ready(building))return false;
    this.storage.locations.delete(this.owner(building.id));delete building.materialSupply;this.storage.changed();return true;
  }
  cancel(building,refund){
    if(!this.enabled||!building.materialSupply)return false;
    for(const worker of this.scene.workerSystem.liveWorkers())if(worker.workTask?.siteId===building.id)this.scene.workerSystem.ai.cancel(worker);
    if(this.scene.kingLogistics?.task?.siteId===building.id||this.scene.kingLogistics?.workflowSiteId===building.id)this.scene.kingLogistics.cancel();
    for(const r of [...this.storage.reservations.values()])if(r.siteId===building.id)this.storage.release(r.id);
    for(const actor of [this.scene.character,...this.scene.workerSystem.liveWorkers()])if(actor.cargo?.siteId===building.id){delete actor.cargo.siteId;actor.cargo.transportCancelled=true;}
    for(const drop of [...this.scene.dropSystem.drops.values()])if(drop.siteId===building.id){
      this.scene.dropSystem.drops.delete(drop.id);drop.view.destroy();
      const replacement=this.scene.dropSystem.create(drop.resource,drop.tile,drop.amount,drop.id,{rewardRemaining:drop.rewardRemaining,rewardUnits:drop.rewardUnits,haulEligible:false});
      if(this.scene.character.order?.dropId===drop.id)this.scene.character.order.dropId=replacement.id;
      this.scene.dropSystem.refreshOccupancy(drop.tile);
    }
    const location=this.storage.locations.get(this.owner(building.id));
    if(location)for(const [resource,amount]of Object.entries(location.stock))this.storage.spill(resource,Math.min(amount,refund[resource]??0),{x:building.x,y:building.y});
    this.storage.locations.delete(this.owner(building.id));delete building.materialSupply;
    for(const [resource,amount]of Object.entries(refund))if(!this.storage.manages(resource))this.scene.inventory.add(resource,amount);
    this.storage.changed();return true;
  }
  summary(building){
    if(!this.enabled||!building.materialSupply)return [];
    const location=this.storage.locations.get(this.owner(building.id));return Object.entries(building.materialSupply.required).map(([resource,required])=>{
      const reserved=[...this.storage.reservations.values()].filter(r=>r.kind==='stock'&&r.siteId===building.id&&r.resource===resource).reduce((n,r)=>n+r.amount,0),delivered=location?.stock[resource]??0;
      const carried=[this.scene.character,...this.scene.workerSystem.liveWorkers()].reduce((n,a)=>n+(a.cargo?.siteId===building.id&&a.cargo.resource===resource?a.cargo.amount:0),0),ground=[...this.scene.dropSystem.drops.values()].filter(d=>d.siteId===building.id&&d.resource===resource).reduce((n,d)=>n+d.amount,0);
      return {resource,required,reserved,delivered,carried,ground,missing:Math.max(0,required-delivered)};
    });
  }
}
