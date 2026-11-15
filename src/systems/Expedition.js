import { EXPEDITION,expeditionRisk,tradeableResources,price } from '../data/trade.js';
import { LOGISTICS_RULES,VEHICLES,loadWeight } from '../data/logistics.js';
import { t } from '../i18n/index.js';

// m-karavana-vyslat (owner, 12 Nov): the kingdom sends its own caravan from a Marketplace.
// Phases: gathering (escorts walk to the Marketplace, up to 2 game hours) → away (2–4 days; the goods are taken from
// the stores when it leaves) → home (gold paid, wagon free, escorts back, hurt after an ambush but alive).
export const wagonLoad=()=>LOGISTICS_RULES.loadUnits*(VEHICLES.horse_wagon?.multiplier??10);
export class Expedition {
  constructor(trade){this.trade=trade;this.state=null;}
  get scene(){return this.trade.scene;}
  freeWagon(){const v=this.scene.vehicles;if(!v)return null;return [...v.vehicles.values()].find(x=>x.type==='horse_wagon'&&x.state==='parked'&&v.usable(x))??null;}
  // Why the button is grey (null = it may be sent).
  blocker(){if(this.state)return 'away';if(!this.freeWagon())return 'wagon';return null;}
  escorts(){const m=this.scene.military;return this.scene.workerSystem.liveWorkers().filter(w=>w.profession==='soldier'&&!w.away&&!w.restPhase&&!this.scene.combat?.attacks?.get?.(w));}
  escortType(w){return this.scene.military?.unit?.(w)?.type??'recruit';}
  available(resource){return this.trade.storage?.available?.(resource)??0;}
  goods(){return tradeableResources(this.scene.objectRegistry).map(d=>({resource:d.id,name:d.name,available:this.available(d.id),weight:loadWeight(d.id),unit:price(d.id,'sell',this.trade.marketContext(d.id,null))??0})).filter(g=>g.available>0);}
  load(goods){return Object.entries(goods).reduce((n,[id,q])=>n+q*loadWeight(id),0);}
  estimate(goods){return Object.entries(goods).reduce((n,[id,q])=>n+q*(price(id,'sell',this.trade.marketContext(id,null))??0),0);}
  send(marketId,goods,escortIds){
    const reason=this.blocker();if(reason)return {ok:false,error:reason};
    const clean=Object.fromEntries(Object.entries(goods).filter(([id,q])=>Number.isInteger(q)&&q>0&&q<=this.available(id)));
    if(!Object.keys(clean).length)return {ok:false,error:'empty'};if(this.load(clean)>wagonLoad())return {ok:false,error:'heavy'};
    const escorts=this.escorts().filter(w=>escortIds.includes(w.id));const wagon=this.freeWagon(),now=this.scene.gameTime.totalElapsed;
    this.state={phase:'gathering',marketId,goods:clean,escort:escorts.map(w=>w.id),wagonId:wagon.id,since:now};
    for(const w of escorts){this.scene.military?.wallPatrol?.set(w,false);delete w.huntWolfId;w.expeditionGather=marketId;}
    this.trade.changed?.();return {ok:true};
  }
  cancel(){if(this.state?.phase!=='gathering')return false;for(const w of this.escortWorkers())delete w.expeditionGather;this.state=null;this.trade.changed?.();return true;}
  escortWorkers(){const ids=new Set(this.state?.escort??[]);return [...this.scene.workerSystem.workers.values()].filter(w=>ids.has(w.id));}
  market(){return this.scene.buildings.find(b=>b.id===this.state?.marketId)??null;}
  update(){
    const s=this.scene,st=this.state;if(!st)return;const now=s.gameTime.totalElapsed,day=s.gameTime.dayDuration;
    if(st.phase==='gathering'){
      const market=this.market();if(!market||!s.vehicles?.vehicles.has(st.wagonId)){this.cancel();return;}
      const near=w=>!w.isAlive||Math.max(Math.abs(w.tile.x-(market.x+1)),Math.abs(w.tile.y-(market.y+1)))<=4;
      if(this.escortWorkers().every(near)||now-st.since>=EXPEDITION.gatherHours*day/24)this.depart();return;}
    if(st.phase==='away'&&now>=st.returnAt)this.home();
  }
  depart(){
    const s=this.scene,st=this.state,storage=this.trade.storage;const taken={};
    for(const [id,q]of Object.entries(st.goods)){let left=Math.min(q,this.available(id));for(const l of [...storage.locations.values()].filter(l=>storage.isStock(l))){if(left<=0)break;const n=Math.min(left,storage.free(l.id,id));if(n>0&&storage.withdraw(l.id,id,n)){left-=n;taken[id]=(taken[id]??0)+n;s.resourceLedger?.expense?.(id,n,'Own Caravan',{id:`expedition:${st.since}:${id}:${l.id}`});}}}
    const r=this.random(),escorts=this.escortWorkers().filter(w=>w.isAlive),risk=expeditionRisk(escorts.map(w=>this.escortType(w))),days=EXPEDITION.days[0]+r()*(EXPEDITION.days[1]-EXPEDITION.days[0]);
    Object.assign(st,{phase:'away',goods:taken,returnAt:s.gameTime.totalElapsed+days*s.gameTime.dayDuration,risk,ambush:r()<risk,lossShare:EXPEDITION.loss[1]-(EXPEDITION.loss[1]-EXPEDITION.loss[0])*Math.min(1,escorts.length/4),spread:r()});
    for(const w of escorts){delete w.expeditionGather;w.away=true;w.path=[];w.nextTile=null;w.view?.setVisible?.(false);}
    s.updateInventory?.();s.eventFeed?.push?.(`expedition-out:${st.since}`,t('expedition.left',{days:Math.round(days*10)/10}),{important:true});this.trade.changed?.();
  }
  home(){
    const s=this.scene,st=this.state;let gold=0;const lost={};
    for(const [id,q]of Object.entries(st.goods)){const gone=st.ambush?Math.round(q*st.lossShare):0;if(gone)lost[id]=gone;gold+=(q-gone)*(price(id,'sell',this.trade.marketContext(id,null))??0);}
    gold=Math.round(gold*(1-EXPEDITION.spread+2*EXPEDITION.spread*(st.spread??.5)));if(gold>0){s.inventory.add('gold',gold);s.resourceLedger?.income?.('gold',gold,'Own Caravan',{id:`expedition-gold:${st.since}`,type:'sale'});}
    for(const w of this.escortWorkers()){w.away=false;w.view?.setVisible?.(true);if(st.ambush&&w.isAlive)w.currentHP=Math.max(1,Math.round(w.currentHP*EXPEDITION.hurt));}
    const lostText=Object.entries(lost).map(([id,n])=>`${n} ${s.objectRegistry.get(id)?.name??id}`).join(', ');
    s.eventFeed?.push?.(`expedition-home:${st.since}`,st.ambush?t('expedition.homeAmbush',{gold,lost:lostText}):t('expedition.home',{gold}),{important:true});
    this.state=null;s.updateInventory?.();this.trade.changed?.();
  }
  random(){const f=this.scene.nightThreats?.random;return typeof f==='function'?f.bind(this.scene.nightThreats):Math.random;}
  exportState(){return this.state?structuredClone(this.state):null;}
  importState(data){this.state=data?structuredClone(data):null;for(const w of this.escortWorkers()){if(this.state?.phase==='away')w.away=true;else if(this.state?.phase==='gathering')w.expeditionGather=this.state.marketId;}}
}
export function validExpedition(e,{workerIds,buildingIds,vehicleIds,registry}){
  if(e===null||e===undefined)return true;
  const goods=e.goods&&typeof e.goods==='object'&&Object.entries(e.goods).every(([id,q])=>registry.get(id)?.category==='resource'&&Number.isInteger(q)&&q>0);
  return !!e&&['gathering','away'].includes(e.phase)&&buildingIds.has(e.marketId)&&vehicleIds.has(e.wagonId)&&goods&&Array.isArray(e.escort)&&e.escort.every(id=>workerIds.has(id))&&Number.isFinite(e.since)
    &&(e.phase==='gathering'||Number.isFinite(e.returnAt)&&typeof e.ambush==='boolean'&&Number.isFinite(e.risk)&&Number.isFinite(e.lossShare));
}
