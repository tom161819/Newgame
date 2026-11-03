import { tileKey } from '../game/stones.js';
import { tileCenter } from '../game/map.js';

// Typ suroviny a množství patří do instance. Stejný typ na stejném políčku
// se slučuje; inventář se mění teprve při skutečném příchodu ke dropu.
export class DropSystem {
  constructor(scene){this.scene=scene;this.drops=new Map();this.nextId=1;}
  create(resource,tile,amount,savedId=null){
    if(!Number.isSafeInteger(amount)||amount<=0)throw new RangeError('Neplatné množství dropu.');
    const definition=this.scene.objectRegistry.require(resource);
    if(!definition.collectible)throw new TypeError('Drop musí být sběratelná surovina.');
    const existing=[...this.drops.values()].find(d=>d.resource===resource&&tileKey(d.tile)===tileKey(tile));
    if(existing){existing.amount+=amount;return existing;}
    const id=savedId??`drop-${this.nextId++}`,view=this.scene.assets.createView(resource,{...tileCenter(tile),tile});
    const drop={id,resource,tile:{...tile},amount,view};view.setData('drop',drop);this.drops.set(id,drop);
    this.refreshOccupancy(tile);return drop;
  }
  refreshOccupancy(tile){
    const key=tileKey(tile),drop=[...this.drops.values()].find(d=>tileKey(d.tile)===key);
    const resource=[...this.scene.resources.values()].find(view=>view.getData('object')?.tiles.some(p=>tileKey(p)===key));
    if(resource)this.scene.resourceOccupancy.set(key,tileKey(resource.getData('tile')));
    else if(drop)this.scene.resourceOccupancy.set(key,drop.id);
    else this.scene.resourceOccupancy.delete(key);
  }
  collect(id,standingTile){
    const drop=this.drops.get(id);
    if(!drop||this.scene.character.state!=='ground'||tileKey(standingTile)!==tileKey(drop.tile))return false;
    this.drops.delete(id);drop.view.destroy();this.refreshOccupancy(drop.tile);
    this.scene.inventory.add(drop.resource,drop.amount);this.scene.updateInventory();
    this.scene.setStatus(`${this.scene.objectRegistry.require(drop.resource).name} ×${drop.amount} sebráno.`);return true;
  }
  atPoint(x,y){return [...this.drops.values()].sort((a,b)=>b.view.depth-a.view.depth).find(d=>(!this.scene.fog||this.scene.fog.isVisibleTile(d.tile))&&this.scene.assets.hitTest(d.view,x,y))??null;}
  atTile(tile){return [...this.drops.values()].find(d=>tileKey(d.tile)===tileKey(tile)&&d.view.visible&&(!this.scene.fog||this.scene.fog.isVisibleTile(d.tile)))??null;}
  update(view,fog=null){for(const drop of this.drops.values()){const v=drop.view;v.setVisible((!fog||fog.isVisibleTile(drop.tile))&&v.x>view.x-40&&v.x<view.right+40&&v.y>view.y-40&&v.y<view.bottom+40);}}
  destroy(){for(const drop of this.drops.values())drop.view.destroy();this.drops.clear();}
}
