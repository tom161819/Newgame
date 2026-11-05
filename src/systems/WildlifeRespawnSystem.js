import { WILDLIFE_COUNTS,WILDLIFE_INTERVALS } from './GameSettings.js';
import { resourceCandidates } from '../game/stones.js';
import { FogOfWarSystem } from './FogOfWarSystem.js';

export class WildlifeRespawnSystem {
  constructor(scene,animals,random=Math.random){Object.assign(this,{scene,animals,random});this.elapsed=0;}
  get interval(){return WILDLIFE_INTERVALS[this.scene.gameSettings.wildlifeRespawn];}
  spawnOne(){
    const definitions=this.scene.objectRegistry.byCategory('animal').filter(d=>d.gameplay.huntable),target=WILDLIFE_COUNTS[this.scene.gameSettings.wildlifePopulation];
    const counts=new Map(definitions.map(d=>[d.id,0]));for(const animal of this.animals.animals.values())if(animal.isAlive&&counts.has(animal.type))counts.set(animal.type,counts.get(animal.type)+1);
    if([...counts.values()].reduce((a,b)=>a+b,0)>=target*definitions.length)return false;
    const missing=Math.max(...definitions.map(d=>target-counts.get(d.id))),choices=definitions.filter(d=>target-counts.get(d.id)===missing),definition=choices[Math.floor(this.random()*choices.length)];
    const origins=this.scene.resourceOrigins?.()??[this.scene.character.tile];
    this.animals.clearance.refresh();
    const candidates=resourceCandidates(this.scene.map,origins,this.scene.reservedTiles(),this.scene.resourceOccupancy,definition).filter(tile=>this.animals.clearance.isClear(tile));if(!candidates.length)return false;
    const sight=new FogOfWarSystem(this.scene.character,true),hidden=candidates.filter(t=>!sight.isVisibleTile(t)),safe=hidden.length?hidden:candidates;
    const tile=safe[Math.floor(this.random()*safe.length)];this.animals.create(definition,tile);return true;
  }
  update(delta){
    if(this.scene.gameOver||this.scene.gameTime.paused||!Number.isFinite(delta)||delta<=0||!this.interval)return;
    this.elapsed+=delta;
    while(this.elapsed>=this.interval){this.elapsed-=this.interval;this.spawnOne();}
  }
  exportState(){return {elapsed:this.elapsed};}
  importState(data){this.elapsed=data?.elapsed??0;}
}
