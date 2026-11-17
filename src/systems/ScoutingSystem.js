import { t } from '../i18n/index.js';
import { SCOUTING,zoneType,zoneById,zoneEdge,scoutTypeById } from '../data/scouting.js';
import { buildingIsComplete } from '../game/buildingState.js';
import { castleLevel } from '../data/castle.js';
import { loadWeight } from '../data/logistics.js';
import { wagonLoad } from './Expedition.js';

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
  // Owner 16 Nov 2026: the King may go with the party; a Horse Wagon may go too, loaded with goods from the stores.
  kingFree(){const c=this.scene.character;return !!c?.isAlive&&!c.away&&!c.mounted&&!this.scene.gameOver;}
  freeWagon(){const v=this.scene.vehicles;if(!v)return null;return [...v.vehicles.values()].find(x=>x.type==='horse_wagon'&&x.state==='parked'&&v.usable(x)&&!this.holds(x)&&this.scene.trade?.expedition?.state?.wagonId!==x.id)??null;}
  holds(vehicle){return !!this.party?.wagonId&&this.party.wagonId===vehicle?.id;}
  wagonAway(vehicle){return !this.scene.zone&&this.holds(vehicle)&&this.party.phase!=='leaving';}
  available(resource){return this.scene.foodStorage?.available?.(resource)??0;}
  goods(){return (this.scene.objectRegistry?.byCategory?.('resource')??[]).filter(d=>!d.spawn&&d.resourceCategory!=='vehicle'&&this.available(d.id)>0).map(d=>({resource:d.id,name:d.name,available:this.available(d.id),weight:loadWeight(d.id)}));}
  load(cargo){return Object.entries(cargo??{}).reduce((n,[id,q])=>n+q*loadWeight(id),0);}
  capacity(){return wagonLoad();}
  send(zoneId,ids,{king=false,wagon=false,cargo={}}={}){
    if(this.blocker())return {error:t(`scouting.locked.${this.blocker()}`)};if(this.party)return {error:t('scouting.busy')};if(!zoneById(zoneId))return {error:t('scouting.noZone')};
    const pick=this.soldiers().filter(w=>ids.includes(w.id));king=!!king&&this.kingFree();if(!pick.length&&!king)return {error:t('scouting.noSoldiers')};
    const cart=wagon?this.freeWagon():null;if(wagon&&!cart)return {error:t('scouting.noWagon')};
    const goods=cart?Object.fromEntries(Object.entries(cargo??{}).filter(([id,q])=>Number.isInteger(q)&&q>0&&q<=this.available(id))):{};
    if(this.load(goods)>this.capacity())return {error:t('scouting.heavy')};
    const now=this.scene.gameTime.totalElapsed;this.party={zone:zoneId,ids:pick.map(w=>w.id),phase:'leaving',since:now,...(king?{king:true}:{}),...(cart?{wagonId:cart.id,cargo:goods}:{})};
    if(king)this.scene.character.command({kind:'move',goal:this.edgeGoals(zoneId)[0]??this.edge(zoneId),pickupKey:null});
    for(const w of pick){this.scene.military?.wallPatrol?.set(w,false);delete w.huntWolfId;this.scene.combat?.stopAttack?.(w);w.scoutZone=zoneId;}
    this.scene.eventFeed?.push?.(`scouting-out:${now}`,t('scouting.left',{count:pick.length+(king?1:0),zone:t(`scouting.zone.${zoneId}`)}),{important:true});this.changed();return {party:this.party};
  }
  // Soldier behaviour while leaving (MilitarySystem.updateSoldier): walk to the edge.
  updateSoldier(worker){
    if(worker.scoutZone==null||this.party?.phase!=='leaving')return false;
    worker.workState='Traveling to Target';worker.workMessage=t('scouting.leaving');
    if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0&&!this.atEdge(worker)){worker.aiCooldown=1500;worker.moveTo(this.edgeGoals(worker.scoutZone));}
    return true;
  }
  // While the party is away the King is not on the map: hidden, out of fights, not selectable.
  setKingAway(away){const s=this.scene,c=s.character;if(!c)return;c.away=away;if(away){c.path=[];c.nextTile=null;c.walking=false;c.order=null;s.player?.setVisible?.(false);if(s.unitSelection?.king){s.unitSelection.king=false;s.unitSelection.signature=null;}s.worldCamera?.lookAt?.(s.workerSystem?.origin?.()??c.tile);}else s.player?.setVisible?.(true);}
  atEdge(w){const e=this.edge(this.party.zone);return Math.max(Math.abs(w.tile.x-e.x),Math.abs(w.tile.y-e.y))<=SCOUTING.edgeReach+6&&this.edgeDistance(w)<=SCOUTING.edgeReach;}
  edgeDistance(w){const m=this.scene.map,W=m?.[0]?.length??100,H=m?.length??100;return Math.min(w.tile.x,w.tile.y,W-1-w.tile.x,H-1-w.tile.y);}
  update(){
    const p=this.party;if(!p)return;const s=this.scene,now=s.gameTime.totalElapsed,day=s.gameTime.dayDuration,party=this.partyWorkers().filter(w=>w.isAlive);
    if(!party.length&&!p.king&&p.phase!=='returning'){this.party=null;this.changed();return;}
    if(p.king&&!s.character?.isAlive)return;
    if(p.king&&p.phase==='leaving'&&!s.character.walking&&!s.character.path?.length&&!this.atEdge(s.character)&&now-(this.kingOrderAt??-1e9)>1500){this.kingOrderAt=now;s.character.command({kind:'move',goal:this.edgeGoals(p.zone)[0]??this.edge(p.zone),pickupKey:null});}
    if(p.phase==='leaving'&&(party.every(w=>this.atEdge(w))&&(!p.king||this.atEdge(s.character))||now-p.since>=SCOUTING.leaveHours*day/24)){
      for(const w of party){w.away=true;w.path=[];w.nextTile=null;w.view?.setVisible?.(false);}
      if(p.king)this.setKingAway(true);
      if(p.wagonId){const taken=this.takeCargo(p.cargo);p.cargo=taken;s.vehicles?.changed?.();}
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
  // The goods leave the stores when the party sets off (like the own caravan).
  takeCargo(cargo){
    const s=this.scene,storage=s.foodStorage,taken={};if(!storage)return taken;
    for(const [id,q] of Object.entries(cargo??{})){let left=Math.min(q,this.available(id));for(const l of [...storage.locations.values()].filter(l=>storage.isStock(l))){if(left<=0)break;const n=Math.min(left,storage.free(l.id,id));if(n>0&&storage.withdraw(l.id,id,n)){left-=n;taken[id]=(taken[id]??0)+n;s.resourceLedger?.expense?.(id,n,'Scouting party',{id:`scouting:${this.party.since}:${id}:${l.id}`});}}}
    s.updateInventory?.();return taken;
  }
  // What comes back goes into the stores; what does not fit is put down by the edge.
  returnCargo(cargo,tile){
    const s=this.scene,storage=s.foodStorage;
    for(const [id,q] of Object.entries(cargo??{})){let left=q;for(const l of [...(storage?.locations.values()??[])].filter(l=>storage.isStock(l))){if(left<=0)break;const n=Math.min(left,storage.room(l.id,id));if(n>0&&storage.deposit(l.id,id,n)){left-=n;s.resourceLedger?.income?.(id,n,'Scouting party',{id:`scouting-back:${this.party.since}:${id}:${l.id}`});}}
      if(left>0&&s.dropSystem?.create?.(id,tile,left))s.resourceLedger?.income?.(id,left,'Scouting party',{id:`scouting-drop:${this.party.since}:${id}`});}
    s.updateInventory?.();
  }
  home(){
    const goals=this.edgeGoals(this.party.zone),at=goals[0]??this.scene.workerSystem?.origin?.()??{x:50,y:50};
    if(this.party.king){const c=this.scene.character,g=goals[goals.length-1]??at;c.tile={...g};c.position={x:g.x+.5,y:g.y+.5};c.path=[];c.nextTile=null;this.setKingAway(false);this.scene.worldCamera?.lookAt?.(g);}
    // Gold the party brought from the land (chests, a bandit camp).
    if(this.party.loot?.gold>0){this.scene.inventory.add('gold',this.party.loot.gold,{source:'Scouting party',id:`scouting-loot:${this.party.since}`});this.scene.eventFeed?.push?.(`scouting-loot:${this.party.since}`,t('scouting.loot',{gold:this.party.loot.gold}),{important:true});}
    if(this.party.wagonId){const v=this.scene.vehicles?.vehicles.get(this.party.wagonId),g=goals[1]??at;if(v&&this.scene.vehicles.free(g)){v.x=g.x;v.y=g.y;}this.returnCargo(this.party.cargo,g);}
    // Point 67: pets the party took in are strays at home until the player gives them a home.
    for(const [i,pet] of (this.party.pets??[]).entries())this.scene.domestic?.addHomeStray(pet,goals[(i+2)%Math.max(1,goals.length)]??at);
    for(const [i,w] of this.partyWorkers().entries()){const g=goals[i%Math.max(1,goals.length)]??at;w.away=false;delete w.scoutZone;w.tile={...g};w.position={x:g.x+.5,y:g.y+.5};w.path=[];w.nextTile=null;w.view?.setVisible?.(true);}
    this.scene.eventFeed?.push?.(`scouting-home:${this.party.since}`,t('scouting.home',{zone:t(`scouting.zone.${this.party.zone}`)}),{important:true});
    this.party=null;this.scene.vehicles?.changed?.();this.changed();
  }
  exportState(){return {zones:structuredClone(this.zones),party:this.party?structuredClone(this.party):null};}
  importState(data){
    this.zones=structuredClone(data?.zones??{});this.party=data?.party?structuredClone(data.party):null;
    for(const w of this.partyWorkers()){w.scoutZone=this.party.zone;if(this.party.phase!=='leaving'){w.away=true;w.view?.setVisible?.(false);}}
    if(this.party?.king&&this.party.phase!=='leaving'&&!this.scene.zone)this.setKingAway(true);
  }
}
export function validScouting(v,{workerIds,vehicleIds=new Set(),registry=null}){
  if(v===undefined)return true;if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join()!=='party,zones')return false;
  if(!v.zones||typeof v.zones!=='object'||Array.isArray(v.zones))return false;
  for(const [id,z] of Object.entries(v.zones))if(!zoneById(id)||!z||!scoutTypeById(z.type)||!Number.isSafeInteger(z.day)||!Object.keys(z).every(k=>['day','type','taken','cleared'].includes(k))
    ||z.taken!==undefined&&!(Array.isArray(z.taken)&&z.taken.length&&z.taken.length<=8&&new Set(z.taken).size===z.taken.length&&z.taken.every(k=>/^(zone|mine)-\d$/.test(k)))||z.cleared!==undefined&&z.cleared!==true)return false;
  const p=v.party;if(p===null)return true;
  return !!p&&typeof p==='object'&&!!zoneById(p.zone)&&Array.isArray(p.ids)&&(p.ids.length>0||p.king===true)&&(p.king===undefined||p.king===true)
    &&(p.wagonId===undefined?p.cargo===undefined:vehicleIds.has(p.wagonId)&&!!p.cargo&&typeof p.cargo==='object'&&!Array.isArray(p.cargo)&&Object.entries(p.cargo).every(([id,q])=>(registry?registry.get(id)?.category==='resource':/^[a-z_]{1,40}$/.test(id))&&Number.isSafeInteger(q)&&q>0))&&p.ids.every(id=>workerIds.has(id))&&new Set(p.ids).size===p.ids.length&&['leaving','away','there','returning'].includes(p.phase)&&Number.isFinite(p.since)&&(p.phase==='leaving'?p.at===undefined:Number.isFinite(p.at))
    &&(p.loot===undefined||!!p.loot&&Object.keys(p.loot).join()==='gold'&&Number.isSafeInteger(p.loot.gold)&&p.loot.gold>0)
    &&(p.pets===undefined||Array.isArray(p.pets)&&p.pets.length<=4&&p.pets.every(x=>x&&Object.keys(x).sort().join()==='kind,name'&&['cat','dog'].includes(x.kind)&&typeof x.name==='string'&&x.name.length>0&&x.name.length<=40))
    &&Object.keys(p).every(k=>['zone','ids','phase','since','at','king','wagonId','cargo','loot','pets'].includes(k));
}
