import { t } from '../i18n/index.js';
import { tileKey } from '../game/stones.js';
import { tileCenter } from '../game/map.js';
import { carryCapacity } from '../data/logistics.js';

// Typ suroviny a množství patří do instance. Stejný typ na stejném políčku
// se slučuje; inventář se mění teprve při skutečném příchodu ke dropu.
export class DropSystem {
  constructor(scene){this.scene=scene;this.drops=new Map();this.nextId=1;}
  create(resource,tile,amount,savedId=null,{rewardRemaining=1,rewardUnits=resource==='stone'?amount:0,haulEligible=true,siteId=null}={}){
    if(!Number.isSafeInteger(amount)||amount<=0)throw new RangeError('Neplatné množství dropu.');
    const definition=this.scene.objectRegistry.require(resource);
    if(!definition.collectible)throw new TypeError('Drop musí být sběratelná surovina.');
    const existing=[...this.drops.values()].find(d=>d.resource===resource&&(d.siteId??null)===siteId&&tileKey(d.tile)===tileKey(tile));
    if(existing){existing.amount+=amount;existing.rewardRemaining=(existing.rewardRemaining??1)+rewardRemaining;existing.rewardUnits=(existing.rewardUnits??0)+rewardUnits;existing.haulEligible=existing.haulEligible!==false&&haulEligible;return existing;}
    const id=savedId??`drop-${this.nextId++}`,view=this.scene.assets.createView(resource,{...tileCenter(tile),tile});
    const drop={id,resource,tile:{...tile},amount,rewardRemaining,rewardUnits,haulEligible,...(siteId!=null?{siteId}:{}),view};view.setData('drop',drop);this.drops.set(id,drop);
    this.refreshOccupancy(tile);return drop;
  }
  // Point 45 (owner 14 Nov 2026): goods lying under a new blueprint are put on the nearest free tile beside it (same
  // drop, same id), from where Haulers take them to a store as usual.
  clearSite(site){
    const s=this.scene,d=site.definition??s.objectRegistry.get(site.type);if(!site.tiles||d?.pavement||d?.walkable)return 0;const inside=new Set(site.tiles.map(tileKey));let moved=0;
    for(const drop of [...this.drops.values()]){if(!inside.has(tileKey(drop.tile)))continue;let best=null;
      for(let r=1;r<12&&!best;r++)for(let dy=-r;dy<=r&&!best;dy++)for(let dx=-r;dx<=r&&!best;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const tile={x:drop.tile.x+dx,y:drop.tile.y+dy},key=tileKey(tile);
        if(!inside.has(key)&&s.map[tile.y]?.[tile.x]===0&&!s.resourceOccupancy.has(key))best=tile;}
      if(!best)continue;const old=drop.tile;drop.tile={...best};const p=tileCenter(best);drop.view.setPosition?.(p.x,p.y);drop.view.setData?.('tile',{...best});drop.view.setDepth?.(p.y);this.refreshOccupancy(old);this.refreshOccupancy(best);moved++;}
    return moved;
  }
  refreshOccupancy(tile){
    const key=tileKey(tile),drop=[...this.drops.values()].find(d=>tileKey(d.tile)===key);
    const resource=[...this.scene.resources.values()].find(view=>view.getData('object')?.tiles.some(p=>tileKey(p)===key));
    if(resource)this.scene.resourceOccupancy.set(key,tileKey(resource.getData('tile')));
    else if(drop)this.scene.resourceOccupancy.set(key,drop.id);
    else this.scene.resourceOccupancy.delete(key);
  }
  takeForTransport(id,amount){
    const drop=this.drops.get(id);if(!drop||!Number.isSafeInteger(amount)||amount<1||amount>drop.amount)return null;
    const cargo={resource:drop.resource,amount,...(drop.haulEligible===false?{transportCancelled:true}:{}),...(drop.siteId!=null?{siteId:drop.siteId}:{})},fraction=amount/drop.amount;
    drop.rewardRemaining*=1-fraction;drop.rewardUnits*=1-fraction;drop.amount-=amount;
    if(!drop.amount){this.drops.delete(id);drop.view.destroy();this.refreshOccupancy(drop.tile);}return cargo;
  }
  collect(id,standingTile,actor=this.scene.character){
    const drop=this.drops.get(id);
    if(!drop||actor.state!=='ground'||tileKey(standingTile)!==tileKey(drop.tile))return false;
    const cancelledTransport=drop.haulEligible===false,royal=actor===this.scene.character&&this.scene.foodStorage?.manages(drop.resource)&&this.scene.kingLogistics,capacity=royal?royal.room(drop.resource,drop.siteId):carryCapacity(actor,drop.resource);
    if(royal&&!capacity){this.scene.setStatus(t('status.cargoFull'));return false;}
    const limited=royal||this.scene.foodStorage?.manages(drop.resource)&&this.scene.workerSystem?.workers.has(actor.id),amount=limited?Math.min(capacity,drop.amount):drop.amount;
    const packageRatio=amount/drop.amount*(drop.rewardRemaining??1),units=amount/drop.amount*(drop.rewardUnits??(drop.resource==='stone'?drop.amount:0)),contributionRatio=drop.resource==='stone'?units/amount:packageRatio,event={type:drop.resource==='stone'?'resourceCollected':'dropCollected',objectType:drop.resource,quantity:amount,objectId:drop.id,contributionRatio};
    drop.rewardRemaining=(drop.rewardRemaining??1)-packageRatio;drop.rewardUnits=Math.max(0,(drop.rewardUnits??0)-units);drop.amount-=amount;
    if(!drop.amount){this.drops.delete(id);drop.view.destroy();this.refreshOccupancy(drop.tile);}
    if(royal)royal.receive({resource:drop.resource,amount,event,siteId:drop.siteId});
    else if(!this.scene.workplaceSystem?.carryCollection(actor,{resource:drop.resource,amount,event})){
      this.scene.inventory.add(drop.resource,amount,{track:false});this.scene.activities?.emit(event.type,{...event,actor});
    }
    if(actor.cargo&&cancelledTransport)actor.cargo.transportCancelled=true;
    this.scene.updateInventory();
    this.scene.setStatus(t('status.picked',{name:this.scene.objectRegistry.require(drop.resource).name,count:amount}));return true;
  }
  atPoint(x,y){return [...this.drops.values()].sort((a,b)=>b.view.depth-a.view.depth).find(d=>(!this.scene.fog||this.scene.fog.isVisibleTile(d.tile))&&this.scene.assets.hitTest(d.view,x,y))??null;}
  atTile(tile){return [...this.drops.values()].find(d=>tileKey(d.tile)===tileKey(tile)&&d.view.visible&&(!this.scene.fog||this.scene.fog.isVisibleTile(d.tile)))??null;}
  update(view,fog=null){for(const drop of this.drops.values()){const v=drop.view;v.setVisible((!fog||fog.isVisibleTile(drop.tile))&&v.x>view.x-40&&v.x<view.right+40&&v.y>view.y-40&&v.y<view.bottom+40);}}
  destroy(){for(const drop of this.drops.values())drop.view.destroy();this.drops.clear();}
}
