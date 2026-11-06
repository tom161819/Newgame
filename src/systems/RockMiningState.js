import { ROCK_MINING as RULES } from '../data/rockMining.js';
export function validateRockMining(s,registry,{check,integer,number,array}){
  const state=s.naturalResources.rockMining;check(state&&Object.keys(state).join()==='records');array(state.records,10000);const records=new Map(),slots=new Set(),owners=new Set();
  for(const r of state.records){
    check(r&&Object.keys(r).sort().join()==='dropId,id,marked,outputTile,produced,tile,workDone');integer(r.tile.x,0,99);integer(r.tile.y,0,99);check(r.id===`${r.tile.x},${r.tile.y}`&&!records.has(r.id));records.set(r.id,r);
    check(typeof r.marked==='boolean');integer(r.produced,0,RULES.yield);number(r.workDone,0,RULES.duration);check(r.workDone<RULES.duration);check(s.terrain[r.tile.y][r.tile.x]===(r.produced===RULES.yield?0:1));
    if(r.outputTile){integer(r.outputTile.x,0,99);integer(r.outputTile.y,0,99);check(Math.abs(r.outputTile.x-r.tile.x)+Math.abs(r.outputTile.y-r.tile.y)===1);}else check(r.produced===0&&r.dropId==null);
    if(r.dropId!=null){check(typeof r.dropId==='string'&&/^drop-\d+$/.test(r.dropId));const d=s.drops.find(d=>d.id===r.dropId);if(d)check(d.resource==='stone'&&d.siteId==null&&d.tile.x===r.outputTile.x&&d.tile.y===r.outputTile.y);}
    if(r.produced===RULES.yield)check(r.workDone===0);
  }
  for(const w of s.workers??[]){
    check(w.manualRockId===null||typeof w.manualRockId==='string'&&records.has(w.manualRockId));
    if(w.manualRockId!=null){check(w.isAlive&&w.profession==='miner'&&w.assignedWorkplaceId==null&&records.get(w.manualRockId).marked&&!owners.has(w.manualRockId));owners.add(w.manualRockId);}
    if(w.cargo?.rockId!=null)check(w.profession==='miner'&&w.assignedWorkplaceId==null&&w.cargo.resource==='stone'&&records.get(w.cargo.rockId)?.produced===RULES.yield);
    const t=w.workTask;if(t?.kind==='mineRock'){
      const r=records.get(t.targetId),slot=`${t.goal.x},${t.goal.y}`;check(r?.marked&&r.produced<RULES.yield&&w.manualRockId===r.id&&w.commandState.state==='Working'&&Math.abs(r.tile.x-t.goal.x)+Math.abs(r.tile.y-t.goal.y)===1&&!slots.has(slot));slots.add(slot);
      check(t.progressMs===0&&s.terrain[t.goal.y][t.goal.x]===0&&!s.buildings.some(b=>t.goal.x>=b.x&&t.goal.x<b.x+registry.require(b.type).width&&t.goal.y>=b.y&&t.goal.y<b.y+registry.require(b.type).height));
    }
  }
}
