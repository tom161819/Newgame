import { COURT,courtBand } from '../data/court.js';
import { kingdomLevel } from '../data/kingdomRank.js';
import { buildingIsComplete } from '../game/buildingState.js';
import { FOOD_RESOURCE_IDS } from '../data/foodProduction.js';
import { buildingHP } from '../game/buildingHealth.js';
import { ENEMY_ARMY } from './EnemyArmy.js';
import { t } from '../i18n/index.js';

// m-pribeh-vlci-ujezd F1: the King's trust, the orders from court and what follows from them (data/court.js).
// Everything is counted in whole game days, so a save holds it all. The system runs only in a story game
// (GameScene sets scene.kingdomRanks; never in the Test map).
const clamp=v=>Math.max(0,Math.min(100,Math.round(v)));
const typeOf=b=>b.type??b.definition?.id;
export class CourtSystem {
  constructor(scene,{spawn=null}={}){
    this.scene=scene;this.spawn=spawn;this.trust=COURT.startTrust;this.orders=[];this.seq=0;this.nextOrderDay=COURT.firstOrderDay;this.fine=0;
    this.countdownDay=null;this.collected=false;this.expedition=null;this.expeditions=0;this.cooldownUntil=0;this.lastGiftDay=0;this.wait=0;this.revision=0;this.listeners=new Set();
  }
  // `enabled`: a story game. `active`: somebody sends orders (not for the player's own lordship, nor after the epilogue).
  // On when the game was started with the story (settings), or a save carries the court's state.
  get enabled(){return !!this.scene.kingdomRanks&&!this.scene.sandbox&&(!!this.scene.gameSettings?.story||!!this.forced);}
  get active(){const story=this.scene.story;return this.enabled&&story?.faction!=='own'&&!(story?.chapter>=8);}
  // Who sends the orders: the King (also for the Crown's side), the Prague union or Tábor.
  get patron(){const f=this.scene.story?.faction;return f==='prague'||f==='tabor'?f:'king';}
  plunder(share){const inv=this.scene.inventory;for(const id of ['gold','wood','stone',...FOOD_RESOURCE_IDS]){const n=Math.floor((inv?.count?.(id)??0)*share);if(n>0)inv.spend(id,n,{source:'Court',id:`court:plunder:${this.day}:${id}`});}this.scene.updateInventory?.();}
  get day(){return this.scene.gameTime?.day??1;}
  get level(){return kingdomLevel(this.scene.buildings);}
  get band(){return courtBand(this.trust);}
  on(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  emit(type,detail){this.revision++;for(const l of [...this.listeners])l(type,detail);}
  say(key,text,target=null){this.scene.eventFeed?.push?.(`court:${key}:${this.day}`,text,{important:true,target});this.scene.setStatus?.(text);}
  changeTrust(delta,reason){
    if(!delta)return this.trust;const before=this.band;this.trust=clamp(this.trust+delta);const after=this.band;
    if(after!==before){this.say(`band:${after}`,t(`court.band.${after}.news`,this.who()));this.bandChanged(before,after);}
    this.emit('trust',{delta,reason});return this.trust;
  }
  bandChanged(before,after){
    if(after==='displeasure'&&this.countdownDay==null&&!this.expedition){this.countdownDay=this.day+COURT.countdownDays;this.collect();}
    if((after==='favour'||after==='calm'||after==='suspicion')&&this.countdownDay!=null){this.countdownDay=null;this.collected=false;}
    if(after==='favour')this.lastGiftDay=this.day;
  }
  // Displeasure: the King's collectors take a share of the gold and of every food, once per fall into displeasure.
  collect(){
    if(this.collected)return;this.collected=true;const inv=this.scene.inventory,taken=[];
    for(const id of ['gold',...FOOD_RESOURCE_IDS]){const n=Math.floor((inv?.count?.(id)??0)*COURT.collectShare);if(n>0&&inv.spend(id,n,{source:'Court',id:`court:collect:${this.day}:${id}`}))taken.push(`${n} ${t(`court.res.${id}`)}`);}
    if(taken.length)this.say('collect',t('court.collected',{list:taken.join(', '),...this.who()}));this.scene.updateInventory?.();
  }
  who(){return {lord:t(`court.lord.${this.patron}`),from:t(`court.from.${this.patron}`)};}
  population(){return this.scene.workerSystem?.liveSubjects?.()?.length??0;}
  deliveryResource(){
    const list=COURT.delivery[this.level]??COURT.delivery[1],built=new Set((this.scene.buildings??[]).filter(buildingIsComplete).map(typeOf));
    const can=list.filter(id=>built.has(COURT.makers[id])),pool=can.length?can:[list.find(id=>(this.scene.inventory?.count?.(id)??0)>0)??'wood'];
    return pool[(this.seq+this.day)%pool.length];
  }
  // The next order: levy, delivery, levy, delivery, request … (the first one is always a delivery: no gold yet).
  issue(){
    const n=this.seq++,level=this.level,pop=Math.max(4,this.population()),kind=n%5===4?'request':n%2===1?'tax':'delivery',band=this.band;
    const order={id:n+1,kind,issued:this.day};
    if(kind==='tax'){order.resource='gold';order.amount=Math.max(8,Math.round(pop*1.2*level))+Math.round(this.fine);this.fine=0;}
    else{order.resource=this.deliveryResource();order.amount=Math.max(6,Math.round((pop*.7+4*level)*(kind==='request'?.6:1)));}
    const days=Math.max(2,Math.round(COURT.deadlineDays[kind]*(COURT.deadlineFactor[band]??1)));order.due=this.day+days;order.grace=order.due+Math.max(1,Math.round(days*COURT.graceShare));
    if(kind==='request')order.reward=COURT.requestGold*level;
    this.orders.push(order);this.say(`order:${order.id}`,t('court.order.new',{text:this.orderText(order),days,...this.who()}));this.emit('order',order);return order;
  }
  orderText(order){return t(`court.order.${order.kind}`,{amount:order.amount,resource:t(`court.res.${order.resource}`)});}
  orderState(order){return this.day>order.due?'late':'open';}
  canFulfil(order){return (this.scene.inventory?.count?.(order.resource)??0)>=order.amount;}
  fulfil(id){
    const order=this.orders.find(o=>o.id===id);if(!order||!this.canFulfil(order))return false;
    if(!this.scene.inventory.spend(order.resource,order.amount,{source:'Court',id:`court:order:${order.id}`}))return false;
    this.orders=this.orders.filter(o=>o!==order);const late=this.day>order.due;
    if(order.reward&&!late)this.scene.inventory.add('gold',order.reward,{source:'Court',id:`court:reward:${order.id}`});
    this.scene.updateInventory?.();this.say(`met:${order.id}`,t(late?'court.order.metLate':'court.order.met',{text:this.orderText(order)}));
    this.changeTrust(late?COURT.late:COURT.met[order.kind],late?'late':'met');this.emit('fulfilled',order);return true;
  }
  fail(order){
    this.orders=this.orders.filter(o=>o!==order);const loss=COURT.failed[order.kind];
    if(order.kind==='request'){this.emit('expired',order);return;}
    const value=order.resource==='gold'?order.amount:order.amount*(COURT.goldValue[order.resource]??1);this.fine+=value*COURT.fineShare;
    let text=t('court.order.failed',{text:this.orderText(order)});
    if(this.band!=='favour'&&this.band!=='calm'&&order.resource!=='gold'){const inv=this.scene.inventory,n=Math.floor((inv?.count?.(order.resource)??0)*COURT.confiscateShare);
      if(n>0&&inv.spend(order.resource,n,{source:'Court',id:`court:confiscate:${order.id}`})){text+=' '+t('court.confiscated',{amount:n,resource:t(`court.res.${order.resource}`)});this.scene.updateInventory?.();}}
    this.say(`failed:${order.id}`,text);this.changeTrust(loss,'failed');this.emit('failed',order);
  }
  atonementCost(){return COURT.atonementGold*this.level;}
  canAtone(){return this.countdownDay!=null&&!this.expedition&&(this.scene.inventory?.count?.('gold')??0)>=this.atonementCost();}
  atone(){
    if(!this.canAtone()||!this.scene.inventory.spend('gold',this.atonementCost(),{source:'Court',id:`court:atone:${this.day}`}))return false;
    this.countdownDay=null;this.collected=false;this.trust=Math.max(this.trust,COURT.atonementTrust);this.scene.updateInventory?.();this.say('atone',t('court.atoned',this.who()));this.emit('trust',{reason:'atone'});return true;
  }
  expeditionUnits(){
    const base=COURT.expedition.units[this.level]??COURT.expedition.units[1],factor=COURT.expedition.growth**this.expeditions,units={};
    for(const [id,n] of Object.entries(base))units[id]=Math.ceil(n*factor);
    const ours=(this.scene.workerSystem?.liveSubjects?.()??[]).filter(w=>w.profession==='soldier').length;units.enemy_soldier=(units.enemy_soldier??0)+Math.ceil(ours*COURT.expedition.perOurSoldier);
    return units;
  }
  foes(){return [...(this.scene.animalSystem?.animals?.values?.()??[])].filter(a=>a.isAlive&&a.active!==false&&a.definition?.gameplay?.hostile&&String(a.type??a.definition?.id).startsWith('enemy_'));}
  startExpedition(){
    const units=this.expeditionUnits(),count=this.spawn?this.spawn(units):0;this.countdownDay=null;this.collected=false;
    this.expedition={day:this.day,count};this.expeditions++;this.say('expedition',t('court.expedition.start',{count,...this.who()}));this.emit('expedition',{count});return count;
  }
  castle(){return (this.scene.buildings??[]).find(b=>typeOf(b)==='castle'&&buildingIsComplete(b)&&!b.enemy)??null;}
  castleFallen(){const c=this.castle();if(!c)return true;const hp=buildingHP(c);return !!hp&&hp.hp<=hp.max*(ENEMY_ARMY.castleFloor+.01);}
  updateExpedition(){
    const foes=this.foes(),e=COURT.expedition;
    if(foes.length&&this.castleFallen()){
      // The Castle is beaten: the army plunders the stores and leaves.
      this.plunder(e.plunderShare);for(const a of foes)this.scene.animalSystem?.remove?.(a);this.endExpedition('court.expedition.lost');return;
    }
    if(!foes.length){this.endExpedition('court.expedition.won');return;}
    const idle=foes.filter(a=>!a.marching&&!a.onWall);if(idle.length)this.scene.enemyArmy?.march?.(idle);
  }
  endExpedition(key){this.expedition=null;this.cooldownUntil=this.day+COURT.expedition.cooldownDays;this.trust=Math.max(this.trust,COURT.expedition.trustAfter);this.say('expedition-end',t(key,this.who()));this.emit('expeditionEnd',{key});}
  update(delta=0){
    if(!this.active)return;this.wait-=delta;if(this.wait>0)return;this.wait=500;const day=this.day;
    if(this.expedition){this.updateExpedition();return;}
    if(this.scene.story?.raid)return;
    for(const order of [...this.orders])if(day>order.grace)this.fail(order);
    if(day>=this.nextOrderDay&&this.orders.length<COURT.maxActive&&this.castle()){this.issue();this.nextOrderDay=day+COURT.orderEveryDays;}
    const band=this.band;
    if(band==='favour'&&day-this.lastGiftDay>=COURT.giftEveryDays){this.lastGiftDay=day;const gold=COURT.giftGold*this.level;this.scene.inventory?.add?.('gold',gold,{source:'Court',id:`court:gift:${day}`});this.scene.updateInventory?.();this.say('gift',t('court.gift',{gold,...this.who()}));}
    if(day>=this.cooldownUntil){
      if(band==='displeasure'&&this.countdownDay==null){this.countdownDay=day+COURT.countdownDays;this.collect();}
      if(band==='wrath'||(this.countdownDay!=null&&day>=this.countdownDay))this.startExpedition();
    }
  }
  exportState(){return {trust:this.trust,orders:this.orders.map(o=>({...o})),seq:this.seq,nextOrderDay:this.nextOrderDay,fine:Math.round(this.fine*100)/100,countdownDay:this.countdownDay,collected:this.collected,
    expedition:this.expedition?{...this.expedition}:null,expeditions:this.expeditions,cooldownUntil:this.cooldownUntil,lastGiftDay:this.lastGiftDay};}
  importState(data){
    if(!data){this.forced=false;this.nextOrderDay=Math.max(COURT.firstOrderDay,this.day+1);this.emit('loaded');return;}
    this.forced=true;Object.assign(this,{trust:data.trust,orders:data.orders.map(o=>({...o})),seq:data.seq,nextOrderDay:data.nextOrderDay,fine:data.fine,countdownDay:data.countdownDay,collected:data.collected,
      expedition:data.expedition?{...data.expedition}:null,expeditions:data.expeditions,cooldownUntil:data.cooldownUntil,lastGiftDay:data.lastGiftDay});this.wait=0;this.emit('loaded');
  }
  destroy(){this.listeners.clear();}
}
const int=v=>Number.isSafeInteger(v)&&v>=0;
export function validCourtState(d){
  if(!d||typeof d!=='object'||Array.isArray(d))return false;
  if(Object.keys(d).sort().join()!=='collected,cooldownUntil,countdownDay,expedition,expeditions,fine,lastGiftDay,nextOrderDay,orders,seq,trust')return false;
  if(!int(d.trust)||d.trust>100||!int(d.seq)||!int(d.nextOrderDay)||!int(d.expeditions)||!int(d.cooldownUntil)||!int(d.lastGiftDay)||typeof d.collected!=='boolean')return false;
  if(!Number.isFinite(d.fine)||d.fine<0||!(d.countdownDay===null||int(d.countdownDay)))return false;
  if(!(d.expedition===null||(d.expedition&&int(d.expedition.day)&&int(d.expedition.count)&&Object.keys(d.expedition).length===2)))return false;
  if(!Array.isArray(d.orders)||d.orders.length>8)return false;const ids=new Set();
  for(const o of d.orders){
    if(!o||typeof o!=='object'||!int(o.id)||ids.has(o.id)||o.id>d.seq||!['tax','delivery','request'].includes(o.kind)||!int(o.amount)||!o.amount||!int(o.issued)||!int(o.due)||!int(o.grace)||o.grace<o.due)return false;
    if(typeof o.resource!=='string'||(o.resource!=='gold'&&!(o.resource in COURT.goldValue))||(o.kind==='tax')!==(o.resource==='gold'))return false;
    if(o.reward!==undefined&&!int(o.reward))return false;if(Object.keys(o).some(k=>!['id','kind','issued','resource','amount','due','grace','reward'].includes(k)))return false;ids.add(o.id);
  }
  return true;
}
