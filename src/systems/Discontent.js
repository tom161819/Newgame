import { DISCONTENT } from '../data/needs.js';
import { edgeTiles } from './CaravanSystem.js';
import { WORK_RULES } from '../data/jobs.js';

// #58 phase C2 (S13 §8–9). The day counters live in the needs records (NeedsSystem.closeDay):
// - Strike: Happiness below 25 for two whole days. A striker finishes the task in hand, then goes home and does no work
//   (no goods, no XP, no wages accrue); he keeps profession and workplace and returns to work at Happiness 45.
// - Emigration: Happiness below 15 for three days. The resident finishes what he carries, gives up his workplace, walks to a
//   map edge and leaves the kingdom ("Left Kingdom", kept like the dead for wage records; never counted as a death).
export const DISCONTENT_STATES=Object.freeze(['On Strike','Leaving Kingdom']);
export class Discontent {
  constructor(system){this.system=system;this.scene=system.scene;}
  record(worker){return this.scene.needs?.records.get(worker.id)??null;}
  busy(worker){return !!(worker.workTask||worker.cargo||this.scene.stables?.jobs?.has(worker.id));}
  // Returns true while the resident strikes or leaves; WorkerAI then skips his job for this frame.
  update(worker){
    const r=this.record(worker),manual=worker.commandState&&worker.commandState.state!=='Working';
    const active=!!r&&!manual&&worker.isSubject!==false&&(r.leaving||r.strike);
    worker.view?.setDiscontent?.(!!r&&(r.leaving||r.strike));
    if(!active){if(DISCONTENT_STATES.includes(worker.workState)){worker.workState=worker.profession==='idle'?'Idle':'Searching for Target';worker.workMessage='';}return false;}
    if(this.busy(worker))return false;
    return r.leaving?this.leave(worker):this.strike(worker);
  }
  strike(worker){
    if(worker.workState!=='On Strike'){this.system.gather?.release(worker,{stop:true});worker.path=[];worker.aiCooldown=0;}
    worker.workState='On Strike';worker.workMessage='On strike: too unhappy to work';
    if(worker.nextTile||worker.path.length||worker.aiCooldown>0)return true;
    const goals=this.system.rest?.goals(this.scene.needs.homeOf(worker)?.kind??'homeless',worker)??[];
    if(goals.length&&!goals.some(t=>t.x===worker.tile.x&&t.y===worker.tile.y)){worker.aiCooldown=WORK_RULES.searchInterval;worker.moveTo(goals);}
    return true;
  }
  leave(worker){
    if(worker.workState!=='Leaving Kingdom'){
      this.system.gather?.release(worker,{stop:true});this.scene.workplaceSystem?.detach(worker);
      if(worker.profession!=='idle')this.system.jobs.assign(worker,'idle');
      worker.path=[];worker.aiCooldown=0;worker.workState='Leaving Kingdom';worker.workMessage='Leaving the kingdom';
    }
    worker.workState='Leaving Kingdom';
    const edge=p=>p.x===0||p.y===0||p.x===this.scene.map[0].length-1||p.y===this.scene.map.length-1;
    if(edge(worker.tile)&&!worker.nextTile&&!worker.path.length){this.depart(worker);return true;}
    if(worker.nextTile||worker.path.length||worker.aiCooldown>0)return true;
    // No way out: wait and try again later, never search every frame.
    worker.aiCooldown=DISCONTENT.retryMs;const edges=edgeTiles(this.scene.map);if(edges.length)worker.moveTo(edges);
    return true;
  }
  depart(worker){
    // Like a death for bookkeeping (onDeath releases the workplace, tasks and view), but recorded as having left.
    const s=this.scene;worker.isAlive=false;worker.currentHP=0;this.system.onDeath(worker);worker.workState='Left Kingdom';worker.workMessage='';
    s.eventFeed?.push(`emigration:${worker.id}`,`${worker.name??'A villager'}: A villager has left your kingdom due to poor living conditions.`,{important:true});
    s.needs?.records.delete(worker.id);s.needs?.refresh?.();
  }
}
