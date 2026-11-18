import { t } from '../i18n/index.js';
import { buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { awayFrom } from '../game/combatSpacing.js';

// Owner 18 Nov 2026 (battle test, point 7: "three enemy Recruits killed six residents in 30 s; they went on standing and
// strolling"): the alarm. A resident who is not a soldier and has an enemy soldier (a hostile unit in sight) within
// `radius` tiles drops his work and runs to shelter – his House or the Castle, whichever is nearer – and hides inside
// until no enemy has been near for `calm` ms. With no shelter he runs away from the enemy. Enemies do not go for people
// inside. The event feed says where it is, at most once per `feedEvery`.
export const ALARM=Object.freeze({radius:9,check:500,calm:6000,feedEvery:60000});
export class AlarmSystem {
  constructor(scene){this.scene=scene;this.wait=0;this.lastFeed=-Infinity;}
  now(){return this.scene.gameTime?.totalElapsed??0;}
  hostiles(){const s=this.scene;return [...(s.animalSystem?.animals.values()??[])].filter(a=>a.isAlive&&a.active!==false&&a.definition?.gameplay?.hostile&&(!s.fog?.isVisibleObject||s.fog.isVisibleObject(a)));}
  civilians(){return (this.scene.workerSystem?.liveWorkers?.()??[]).filter(w=>w.isSubject!==false&&w.profession!=='soldier'&&!w.away&&!w.leaving&&!w.arriving);}
  update(delta){
    this.wait-=delta;if(this.wait>0)return;this.wait=ALARM.check;const s=this.scene,now=this.now(),foes=this.hostiles(),started=[];
    for(const w of this.civilians()){
      const near=foes.find(a=>Math.hypot(a.position.x-w.position.x,a.position.y-w.position.y)<=ALARM.radius);
      if(near){if(!w.alarm)started.push(w);w.alarm={...(w.alarm??{}),until:now+ALARM.calm,from:{x:near.tile.x,y:near.tile.y}};}
      else if(w.alarm&&now>=w.alarm.until)this.end(w);
    }
    if(started.length&&now-this.lastFeed>=ALARM.feedEvery){this.lastFeed=now;const at=started[0].tile,text=t('alarm.raised',{count:started.length});s.eventFeed?.push?.(`alarm:${Math.floor(now)}`,text,{important:true,target:{x:at.x,y:at.y}});s.setStatus?.(text);}
  }
  shelter(worker){
    const s=this.scene,home=s.needs?.homeOf?.(worker),house=home?.kind==='house'?s.buildings.find(b=>b.id===home.buildingId&&buildingIsComplete(b)):null,castle=s.buildings.find(b=>b.type==='castle'&&buildingIsComplete(b)&&!b.enemy)??null;
    const far=b=>b?Math.hypot(b.x-worker.tile.x,b.y-worker.tile.y):Infinity,burning=b=>!!b&&!!s.nightThreats?.burning?.(b);
    return [house,castle].filter(b=>b&&!burning(b)).sort((a,b)=>far(a)-far(b))[0]??null;
  }
  end(worker){delete worker.alarm;if(worker.restPhase!=='resting')worker.sleepingIn=null;}
  // WorkerAI: true while this resident runs to shelter or hides (his work waits).
  lead(worker){
    const a=worker.alarm;if(!a)return false;if(worker.profession==='soldier'){this.end(worker);return false;}
    if(!a.started){a.started=true;this.scene.workerSystem.ai?.cancel?.(worker);this.scene.workerSystem.rest?.stop?.(worker);worker.path=[];worker.aiCooldown=0;}
    const shelter=this.shelter(worker);
    if(shelter){const doors=towerNeighbors(shelter),inside=!worker.nextTile&&!worker.path.length&&doors.some(p=>p.x===worker.tile.x&&p.y===worker.tile.y);
      if(inside){worker.sleepingIn=shelter.id;worker.workState='Waiting';worker.workMessage=shelter.type==='castle'?'Hiding in the Castle':'Hiding at home';return true;}
      worker.sleepingIn=null;worker.workState='Traveling to Target';worker.workMessage='Running to shelter';
      if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=700;if(!worker.moveTo(doors))this.run(worker,a);}
      return true;}
    worker.workState='Traveling to Target';worker.workMessage='Running from the enemy';
    if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=700;this.run(worker,a);}
    return true;
  }
  run(worker,a){const to=awayFrom(this.scene,worker.tile,a.from,6);if(to.length)worker.moveTo(to);}
}
