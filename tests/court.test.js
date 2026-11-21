import test from 'node:test';
import assert from 'node:assert/strict';
import { CourtSystem,validCourtState } from '../src/systems/CourtSystem.js';
import { COURT,courtBand } from '../src/data/court.js';
import { Inventory } from '../src/game/inventory.js';
import { courtTrustLabel,courtTrustTip,orderStakes } from '../src/ui/CourtPanel.js';
import { setLanguage } from '../src/i18n/index.js';

const building=(type,extra={})=>({type,construction:{state:'complete'},...extra});
function world({gold=0,wood=0,level=1}={}){
  const inventory=new Inventory();inventory.add('gold',gold);inventory.add('wood',wood);const feed=[];
  const scene={kingdomRanks:true,inventory,gameTime:{day:1},buildings:[building('castle',{level}),building('lumberjack_hut')],workerSystem:{liveSubjects:()=>Array.from({length:10},()=>({profession:'farmer'}))},
    eventFeed:{push:(k,text)=>feed.push(text)},animalSystem:{animals:new Map(),remove(a){this.animals.delete(a.id);}}};
  let spawned=null;const court=new CourtSystem(scene,{spawn:units=>{spawned=units;let n=0;for(const [id,c] of Object.entries(units))for(let i=0;i<c;i++){const a={id:`${id}${i}`,type:id,isAlive:true,definition:{gameplay:{hostile:true}}};scene.animalSystem.animals.set(a.id,a);n++;}return n;}});
  const tick=day=>{scene.gameTime.day=day;court.wait=0;court.update(0);};
  return {scene,court,inventory,feed,tick,spawned:()=>spawned};
}
test('court: bands, the first order is a delivery on day 3, meeting it in time raises the trust', () => {
  assert.deepEqual([100,70,69,40,39,25,24,10,9,0].map(courtBand),['favour','favour','calm','calm','suspicion','suspicion','displeasure','displeasure','wrath','wrath']);
  const {court,inventory,tick}=world({wood:50});
  tick(2);assert.equal(court.orders.length,0);tick(3);assert.equal(court.orders.length,1);
  const o=court.orders[0];assert.deepEqual([o.kind,o.resource,o.amount,o.due,o.grace],['delivery','wood',11,9,12]);
  assert.equal(court.fulfil(o.id),true);assert.equal(inventory.count('wood'),39);assert.equal(court.trust,COURT.startTrust+COURT.met.delivery);assert.equal(court.orders.length,0);
  tick(7);assert.equal(court.orders[0].kind,'tax','then a levy in gold');assert.equal(court.canFulfil(court.orders[0]),false);assert.equal(court.fulfil(court.orders[0].id),false);
});
test('court: a late order costs a little, an unmet one costs trust and a fine on the next levy; suspicion seizes stock', () => {
  const {court,inventory,tick}=world({wood:100,gold:200});tick(3);const first=court.orders[0];
  tick(first.due+1);assert.equal(court.orderState(first),'late');assert.equal(court.fulfil(first.id),true);assert.equal(court.trust,COURT.startTrust+COURT.late);
  tick(court.nextOrderDay);const tax=court.orders.find(o=>o.kind==='tax');assert.ok(tax);court.nextOrderDay=1e6;tick(tax.grace+1);
  assert.equal(court.orders.includes(tax),false);assert.equal(court.trust,COURT.startTrust+COURT.late+COURT.failed.tax);assert.equal(court.fine,tax.amount*COURT.fineShare);assert.equal(court.band,'suspicion');
  // a delivery that fails in suspicion: a fifth of that stock is seized; the fine is in the next levy
  court.nextOrderDay=court.day;tick(court.day);const delivery=court.orders.find(o=>o.kind==='delivery');assert.ok(delivery);assert.equal(delivery.due-delivery.issued,4,'shorter deadline in suspicion');
  court.nextOrderDay=1e6;const before=inventory.count('wood');tick(delivery.grace+1);assert.equal(inventory.count('wood'),before-Math.floor(before*COURT.confiscateShare));
  const next=court.orders.find(o=>o.kind==='tax');assert.equal(next.amount,tax.amount+Math.round(tax.amount*COURT.fineShare),'the fine is in the next levy');
});
test('court: displeasure starts a countdown and the collectors; atonement stops it; else a large army comes and beating it brings peace', () => {
  const {court,inventory,tick,scene,spawned}=world({gold:400});tick(1);court.nextOrderDay=1e6;
  court.changeTrust(-20,'test');assert.equal(court.band,'displeasure');assert.equal(court.countdownDay,1+COURT.countdownDays);assert.equal(inventory.count('gold'),300,'collectors took a quarter');
  assert.equal(court.canAtone(),true);assert.equal(court.atone(),true);assert.equal(court.countdownDay,null);assert.equal(court.trust,COURT.atonementTrust);assert.equal(inventory.count('gold'),300-COURT.atonementGold);
  court.changeTrust(-10,'test');assert.equal(court.band,'displeasure');tick(court.countdownDay);
  assert.ok(court.expedition);assert.deepEqual(spawned(),{enemy_soldier:6,enemy_archer:3});assert.equal(court.expedition.count,9);
  tick(court.day+1);assert.ok(court.expedition,'still fighting');
  scene.animalSystem.animals.clear();tick(court.day+1);assert.equal(court.expedition,null);assert.equal(court.trust,COURT.expedition.trustAfter);assert.equal(court.cooldownUntil,court.day+COURT.expedition.cooldownDays);
  tick(court.day+5);assert.equal(court.expedition,null,'no new expedition during the cooldown');
  assert.equal(court.expeditionUnits().enemy_soldier,Math.ceil(6*COURT.expedition.growth),'the next one is larger');
});
test('court: favour brings gifts; the state is saved exactly; the HUD texts', () => {
  const {court,inventory,tick}=world({wood:40});tick(3);court.changeTrust(35,'test');assert.equal(court.band,'favour');
  tick(3+COURT.giftEveryDays);assert.equal(inventory.count('gold'),COURT.giftGold);
  const saved=JSON.parse(JSON.stringify(court.exportState()));assert.equal(validCourtState(saved),true);
  const other=world().court;other.importState(saved);assert.deepEqual(other.exportState(),saved);
  for(const bad of [s=>s.trust=101,s=>s.orders[0].kind='x',s=>s.orders[0].resource='gold',s=>s.extra=1,s=>s.fine=-1,s=>s.expedition={day:1}]){const c=structuredClone(saved);bad(c);assert.equal(validCourtState(c),false);}
  setLanguage('cs');assert.equal(courtTrustLabel(court),'Důvěra 75 · Přízeň');assert.match(courtTrustTip(court),/▶ Přízeň \(70–100\)\tDary zlata/);
  assert.equal(orderStakes(court.orders[0]),'důvěra +5 · nesplnění: důvěra -8 a pokuta');setLanguage('en');
  const off=world().court;off.scene.sandbox=true;off.scene.gameTime.day=9;off.update(0);assert.equal(off.orders.length,0,'never on the Test map');
});
