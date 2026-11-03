import { JOBS } from '../data/jobs.js';

export class JobSystem {
  constructor(system){this.system=system;this.listeners=new Set();this.constructionProvider=null;}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  assign(worker,profession){
    if(!worker?.isAlive||!this.system.workers.has(worker.id)||!Object.hasOwn(JOBS,profession)||this.system.scene.gameOver)return false;
    if(worker.profession===profession)return true;
    const previous=worker.profession;this.system.scene.workplaceSystem?.detach(worker);this.system.ai.cancel(worker);worker.profession=profession;worker.assignedWorkplaceId=null;
    worker.arriving=false;worker.workState=profession==='idle'?'Idle':'Searching for Work';worker.aiCooldown=0;
    for(const listener of this.listeners)listener(worker,previous,profession);return true;
  }
  setConstructionProvider(provider){this.constructionProvider=provider;}
  destroy(){this.listeners.clear();}
}
