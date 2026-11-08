import { ROCK_MINING as RULES,clearsObstacles } from '../data/rockMining.js';
export function validateRockMining(s,registry,{check,integer,number,array}){
  const state=s.naturalResources.rockMining;check(state&&Object.keys(state).every(key=>['records','marks'].includes(key)));array(state.records,10000);const records=new Map(),slots=new Set(),owners=new Set();
  // m-oznacovani-tezby (56): planId names an unfinished wall, tower or gate whose footprint holds the marked object.
  const plans=new Map(s.buildings.filter(b=>!b.unverified&&b.construction&&b.construction.state!=='complete'&&clearsObstacles(registry.require(b.type))).map(b=>[b.id,b])),footprint=new Map();
  for(const b of plans.values()){const d=registry.require(b.type);for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)footprint.set(`${b.x+dx},${b.y+dy}`,b.id);}
  const plan=(m,key)=>{if(m.planId===undefined)return;integer(m.planId,1);check(plans.has(m.planId)&&footprint.get(key)===m.planId);};
  for(const r of state.records){
    check(r&&Object.keys(r).filter(k=>k!=='planId').sort().join()==='dropId,id,marked,outputTile,produced,tile,workDone');integer(r.tile.x,0,99);integer(r.tile.y,0,99);check(r.id===`${r.tile.x},${r.tile.y}`&&!records.has(r.id));records.set(r.id,r);
    check(typeof r.marked==='boolean');integer(r.produced,0,RULES.yield);number(r.workDone,0,RULES.duration);check(r.workDone<RULES.duration);check(s.terrain[r.tile.y][r.tile.x]===(r.produced===RULES.yield?0:1));
    if(r.outputTile){integer(r.outputTile.x,0,99);integer(r.outputTile.y,0,99);check(Math.abs(r.outputTile.x-r.tile.x)+Math.abs(r.outputTile.y-r.tile.y)===1);}else check(r.produced===0&&r.dropId==null);
    if(r.dropId!=null){check(typeof r.dropId==='string'&&/^drop-\d+$/.test(r.dropId));const d=s.drops.find(d=>d.id===r.dropId);if(d)check(d.resource==='stone'&&d.siteId==null&&d.tile.x===r.outputTile.x&&d.tile.y===r.outputTile.y);}
    if(r.produced===RULES.yield)check(r.workDone===0);
    if(r.planId!==undefined){check(r.marked);plan(r,r.id);}
  }
  // A plan over a rock keeps an order on it until the rock is mined.
  for(const [key]of footprint){const [x,y]=key.split(',').map(Number);if(s.terrain[y]?.[x]===1)check(records.get(key)?.marked===true);}
  // m-oznacovani-tezby (51): marked trees (not stumps) and bushes, each once.
  const trees=new Map(),bushes=new Map(),bushTiles=new Set((s.bushes??[]).map(b=>`${b[0]},${b[1]}`));
  if(state.marks!==undefined){
    const m=state.marks;check(m&&Object.keys(m).sort().join()==='bushes,trees');array(m.trees,10000);array(m.bushes,10000);
    for(const e of m.trees){check(e&&Object.keys(e).every(k=>['id','planId'].includes(k))&&typeof e.id==='string'&&!trees.has(e.id));const r=s.resources.find(r=>r.natural?.kind==='tree'&&r.natural.id===e.id);check(r&&r.natural.stage>0);plan(e,`${r.tile.x},${r.tile.y}`);trees.set(e.id,e);}
    for(const e of m.bushes){check(e&&Object.keys(e).every(k=>['id','planId'].includes(k))&&typeof e.id==='string'&&bushTiles.has(e.id)&&!bushes.has(e.id));plan(e,e.id);bushes.set(e.id,e);}
  }
  let lent=0;
  for(const w of s.workers??[]){
    const free=w.assignedWorkplaceId==null||w.clearingLoan===true;if(w.clearingLoan)lent++;
    check(w.manualRockId===null||typeof w.manualRockId==='string'&&records.has(w.manualRockId));
    if(w.manualRockId!=null){check(w.isAlive&&w.profession==='miner'&&free&&records.get(w.manualRockId).marked&&!owners.has(w.manualRockId));owners.add(w.manualRockId);}
    if(w.cargo?.rockId!=null)check(w.profession==='miner'&&free&&w.cargo.resource==='stone'&&records.get(w.cargo.rockId)?.produced===RULES.yield);
    const t=w.workTask;if(t?.kind==='mineRock'){
      const r=records.get(t.targetId),slot=`${t.goal.x},${t.goal.y}`;check(r?.marked&&r.produced<RULES.yield&&w.manualRockId===r.id&&w.commandState.state==='Working'&&Math.abs(r.tile.x-t.goal.x)+Math.abs(r.tile.y-t.goal.y)===1&&!slots.has(slot));slots.add(slot);
      check(t.progressMs===0&&s.terrain[t.goal.y][t.goal.x]===0&&!s.buildings.some(b=>t.goal.x>=b.x&&t.goal.x<b.x+registry.require(b.type).width&&t.goal.y>=b.y&&t.goal.y<b.y+registry.require(b.type).height));
    }
    if(t?.kind==='clearMark'){
      const split=t.targetId.indexOf(':'),kind=t.targetId.slice(0,split),id=t.targetId.slice(split+1);
      if(kind==='tree'){check(trees.has(id));const r=s.resources.find(r=>r.natural?.kind==='tree'&&r.natural.id===id);check(r.natural.stage>0&&r.natural.stage<3&&Math.abs(r.tile.x-t.goal.x)+Math.abs(r.tile.y-t.goal.y)===1);}
      else{check(kind==='bush'&&bushes.has(id));const [x,y]=id.split(',').map(Number);check(Math.abs(x-t.goal.x)+Math.abs(y-t.goal.y)<=1);}
    }
  }
  check(lent<=1);
}
