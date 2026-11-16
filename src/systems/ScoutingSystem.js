import { t } from '../i18n/index.js';
import { SCOUTING,zoneType,zoneById,zoneEdge,scoutTypeById } from '../data/scouting.js';
import { buildingIsComplete } from '../game/buildingState.js';
import { castleLevel } from '../data/castle.js';

// Owner 15 Nov 2026 (koncept v1): a scouting party. Phases: leaving (the soldiers walk to the map edge on the zone's
// side, at most `leaveHours`) → away (`travelDays` there; the zone's content is reported on arrival) → returning
// (`travelDays` back) → home (they step back in at the edge). One party at a time. Saved as `scouting`.
export class ScoutingSystem {
  constructor(scene){this.scene=scene;this.zones={};this.party=null;this.listeners=new Set();}
  onChange(f){this.listeners.add(f);return ()=>this.listeners.delete(f);}
  changed(){for(const f of this.listeners)f();}
  worldCode(){return this.scene.gameSettings?.worldCode??'';}
  // Why scouting is not possible yet (null = open).
  blocker(){
    const b=this.scene.buildings??[],castle=b.find(x=>x.type==='castle');
    if(!castle||castleLevel(castle)<SCOUTING.castleLevel)return 'castle';
    if(!b.some(x=>x.type===SCOUTING.building&&buildingIsComplete(x)))return 'barracks';
    return null;
  }
  soldiers(){return (this.scene.workerSystem?.liveWorkers()??[]).filter(w=>w.profession==='soldier'&&w.isAlive&&!w.away&&w.scoutZone==null&&w.expeditionGather==null);}
  partyWorkers(){const ids=new Set(this.party?.ids??[]);return [...(this.scene.workerSystem?.workers.values()??[])].filter(w=>ids.has(w.id));}
  edge(zoneId){const z=zoneById(zoneId),m=this.scene.map;return zoneEdge(z,m?.[0]?.length??100,m?.length??100);}
  // Free walkable tiles near the edge point, nearest first.
  edgeGoals(zoneId){const e=this.edge(zoneId),m=this.scene.map,out=[];for(let r=0;r<=8&&out.length<6;r++)for(let y=e.y-r;y<=e.y+r;y++)for(let x=e.x-r;x<=e.x+r;x++)if(Math.max(Math.abs(x-e.x),Math.abs(y-e.y))===r&&m[y]?.[x]===0)out.push({x,y});return out;}
  send(zoneId,ids){
    if(this.blocker())return {error:t(`scouting.locked.${this.blocker()}`)};if(this.party)return {error:t('scouting.busy')};if(!zoneById(zoneId))return {error:t('scouting.noZone')};
    const pick=this.soldiers().filter(w=>ids.includes(w.id));if(!pick.length)return {error:t('scouting.noSoldiers')};
    const now=this.scene.gameTime.totalElapsed;this.party={zone:zoneId,ids:pick.map(w=>w.id),phase:'leaving',since:now};
    for(const w of pick){this.scene.military?.wallPatrol?.set(w,false);delete w.huntWolfId;this.scene.combat?.stopAttack?.(w);w.scoutZone=zoneId;}
    this.scene.eventFeed?.push?.(`scouting-out:${now}`,t('scouting.left',{count:pick.length,zone:t(`scouting.zone.${zoneId}`)}),{important:true});this.changed();return {party:this.party};
  }
  // Soldier behaviour while leaving (MilitarySystem.updateSoldier): walk to the edge.
  updateSoldier(worker){
    if(worker.scoutZone==null||this.party?.phase!=='leaving')return false;
    worker.workState='Traveling to Target';worker.workMessage=t('scouting.leaving');
    if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0&&!this.atEdge(worker)){worker.aiCooldown=1500;worker.moveTo(this.edgeGoals(worker.scoutZone));}
    return true;
  }
  atEdge(w){const e=this.edge(this.party.zone);return Math.max(Math.abs(w.tile.x-e.x),Math.abs(w.tile.y-e.y))<=SCOUTING.edgeReach+6&&this.edgeDistance(w)<=SCOUTING.edgeReach;}
  edgeDistance(w){const m=this.scene.map,W=m?.[0]?.length??100,H=m?.length??100;return Math.min(w.tile.x,w.tile.y,W-1-w.tile.x,H-1-w.tile.y);}
  update(){
    const p=this.party;if(!p)return;const s=this.scene,now=s.gameTime.totalElapsed,day=s.gameTime.dayDuration,party=this.partyWorkers().filter(w=>w.isAlive);
    if(!party.length&&p.phase!=='returning'){this.party=null;this.changed();return;}
    if(p.phase==='leaving'&&(party.every(w=>this.atEdge(w))||now-p.since>=SCOUTING.leaveHours*day/24)){
      for(const w of party){w.away=true;w.path=[];w.nextTile=null;w.view?.setVisible?.(false);}
      Object.assign(p,{phase:'away',at:now+SCOUTING.travelDays*day});this.changed();return;
    }
    if(p.phase==='away'&&now>=p.at){
      const type=zoneType(this.worldCode(),p.zone);this.zones[p.zone]={type,day:s.gameTime.day};
      s.eventFeed?.push?.(`scouting-found:${p.since}`,t('scouting.found',{zone:t(`scouting.zone.${p.zone}`),found:`${scoutTypeById(type)?.icon??''} ${t(`scouting.type.${type}`)}`}),{important:true});
      // Owner 16 Nov 2026: the party stays there until it is sent home (or you switch to it and play the zone).
      Object.assign(p,{phase:'there',at:now});this.changed();return;
    }
    if(p.phase==='returning'&&now>=p.at)this.home();
  }
  // Send the party that is in a zone back home (half a day on the road).
  sendHome(){const p=this.party;if(p?.phase!=='there')return false;Object.assign(p,{phase:'returning',at:this.scene.gameTime.totalElapsed+SCOUTING.travelDays*this.scene.gameTime.dayDuration});this.scene.eventFeed?.push?.(`scouting-back:${p.since}`,t('scouting.sentHome'),{});this.changed();return true;}
  home(){
    const goals=this.edgeGoals(this.party.zone),at=goals[0]??this.scene.workerSystem?.origin?.()??{x:50,y:50};
    for(const [i,w] of this.partyWorkers().entries()){const g=goals[i%Math.max(1,goals.length)]??at;w.away=false;delete w.scoutZone;w.tile={...g};w.position={x:g.x+.5,y:g.y+.5};w.path=[];w.nextTile=null;w.view?.setVisible?.(true);}
    this.scene.eventFeed?.push?.(`scouting-home:${this.party.since}`,t('scouting.home',{zone:t(`scouting.zone.${this.party.zone}`)}),{important:true});
    this.party=null;this.changed();
  }
  exportState(){return {zones:structuredClone(this.zones),party:this.party?structuredClone(this.party):null};}
  importState(data){
    this.zones=structuredClone(data?.zones??{});this.party=data?.party?structuredClone(data.party):null;
    for(const w of this.partyWorkers()){w.scoutZone=this.party.zone;if(this.party.phase!=='leaving'){w.away=true;w.view?.setVisible?.(false);}}
  }
}
export function validScouting(v,{workerIds}){
  if(v===undefined)return true;if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join()!=='party,zones')return false;
  if(!v.zones||typeof v.zones!=='object'||Array.isArray(v.zones))return false;
  for(const [id,z] of Object.entries(v.zones))if(!zoneById(id)||!z||!scoutTypeById(z.type)||!Number.isSafeInteger(z.day)||Object.keys(z).sort().join()!=='day,type')return false;
  const p=v.party;if(p===null)return true;
  return !!p&&typeof p==='object'&&!!zoneById(p.zone)&&Array.isArray(p.ids)&&p.ids.length>0&&p.ids.every(id=>workerIds.has(id))&&new Set(p.ids).size===p.ids.length&&['leaving','away','there','returning'].includes(p.phase)&&Number.isFinite(p.since)&&(p.phase==='leaving'?p.at===undefined:Number.isFinite(p.at))
    &&Object.keys(p).every(k=>['zone','ids','phase','since','at'].includes(k));
}
