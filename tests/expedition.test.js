import test from 'node:test';
import assert from 'node:assert/strict';
import { Expedition,wagonLoad,validExpedition } from '../src/systems/Expedition.js';
import { expeditionRisk,EXPEDITION } from '../src/data/trade.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
globalThis.document??={querySelector:()=>({textContent:''})};
// A small fake world: one store, one Marketplace, soldiers, a Horse Wagon.
function world({wagon=true,rand=()=>.99}={}){
  const store={id:'warehouse-1',kind:'storage',stock:{wood:100,sword:2},allowed:['wood','sword']};
  const storage={locations:new Map([[store.id,store]]),isStock:l=>l.kind==='storage',free:(id,r)=>store.stock[r]??0,available:r=>store.stock[r]??0,withdraw:(id,r,n)=>{if((store.stock[r]??0)<n)return false;store.stock[r]-=n;return true;}};
  const soldiers=[0,1].map(i=>({id:`worker-${i+1}`,profession:'soldier',isAlive:true,tile:{x:50,y:50},currentHP:100,maxHP:100,path:[],view:{setVisible(){}}}));
  const gold={n:0},events=[];
  const scene={objectRegistry,buildings:[{id:9,type:'marketplace',x:50,y:50}],gameTime:{totalElapsed:0,dayDuration:1000},inventory:{add:(r,n)=>{if(r==='gold')gold.n+=n;}},
    vehicles:{vehicles:new Map(wagon?[['vehicle-1',{id:'vehicle-1',type:'horse_wagon',state:'parked'}]]:[]),usable:()=>true},
    workerSystem:{liveWorkers:()=>soldiers,workers:new Map(soldiers.map(w=>[w.id,w]))},nightThreats:{random:rand},eventFeed:{push:(k,text)=>events.push(text)},military:{unit:()=>null}};
  const trade={scene,storage,marketContext:()=>({}),changed(){}};const x=new Expedition(trade);return {x,scene,store,soldiers,gold,events};
}
test('m-karavana-vyslat: no free Horse Wagon – the caravan cannot be sent; risk falls with escort to at least 3 %',()=>{
  const {x}=world({wagon:false});assert.equal(x.blocker(),'wagon');assert.equal(x.send(9,{wood:10},[]).ok,false);
  assert.equal(expeditionRisk([]),.3);assert.ok(Math.abs(expeditionRisk(['recruit','soldier'])-.17)<1e-9);assert.equal(expeditionRisk(Array(9).fill('knight')),EXPEDITION.minRisk);
});
test('m-karavana-vyslat: gather → leave with the goods → home after 2–4 days with gold; nothing doubled; a save mid-way is valid',()=>{
  const {x,scene,store,soldiers,gold}=world();assert.equal(x.blocker(),null);
  assert.equal(x.send(9,{wood:wagonLoad()},[]).ok,false,'too heavy');
  assert.ok(x.send(9,{wood:40,sword:1},['worker-1']).ok);assert.equal(x.state.phase,'gathering');assert.equal(x.blocker(),'away');
  x.update();assert.equal(x.state.phase,'away','the escort was already there');assert.equal(store.stock.wood,60);assert.equal(store.stock.sword,1);assert.equal(soldiers[0].away,true);assert.ok(!soldiers[1].away);
  const ids={workerIds:new Set(soldiers.map(w=>w.id)),buildingIds:new Set([9]),vehicleIds:new Set(['vehicle-1']),registry:objectRegistry};assert.ok(validExpedition(x.exportState(),ids));
  scene.gameTime.totalElapsed=x.state.returnAt-1;x.update();assert.equal(x.state.phase,'away');const days=(x.state.returnAt)/1000;assert.ok(days>=2&&days<=4);
  scene.gameTime.totalElapsed=x.state.returnAt;x.update();assert.equal(x.state,null);assert.ok(gold.n>0,'gold paid');assert.equal(soldiers[0].away,false);assert.equal(soldiers[0].currentHP,100,'no ambush, no wounds');
});
test('m-karavana-vyslat: an ambush takes part of the goods and hurts the escort, who never dies',()=>{
  const {x,scene,soldiers,gold}=world({rand:()=>0});assert.ok(x.send(9,{wood:40},['worker-1','worker-2']).ok);x.update();assert.equal(x.state.ambush,true);
  scene.gameTime.totalElapsed=x.state.returnAt;x.update();assert.ok(soldiers.every(w=>w.currentHP>=1&&w.currentHP<100));assert.ok(gold.n<40*4,'less gold than the full load');
});
test('caravan home with the real ledger: the gold is booked as a sale and the game goes on (day-98 freeze)',async()=>{
  const {ResourceTransactionLedger}=await import('../src/systems/ResourceTransactionLedger.js');
  const {x,scene,gold}=world();Object.assign(scene.gameTime,{day:1,elapsed:0,onDayClosed:()=>()=>{}});scene.activities={on:()=>()=>{}};
  scene.resourceLedger=new ResourceTransactionLedger(scene);
  assert.ok(x.send(9,{wood:40},[]).ok);x.update();scene.gameTime.totalElapsed=x.state.returnAt;
  assert.doesNotThrow(()=>x.update());assert.equal(x.state,null);const once=gold.n;assert.ok(once>0);x.update();assert.equal(gold.n,once,'paid once');
  const tx=scene.resourceLedger.current.transactions.at(-1);assert.equal(tx.type,'sale');assert.equal(tx.source,'Own Caravan');assert.equal(tx.quantity,once);
});
