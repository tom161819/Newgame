import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { StaffingStatus,staffingStatus } from '../src/systems/StaffingStatus.js';
import { CANDIDATE_GROUPS,candidateGroups } from '../src/ui/workplaceCandidates.js';
import { WORKPLACES } from '../src/data/workplaces.js';

globalThis.document??={querySelector:()=>({textContent:''})};

function fixture(){const s=workerScene(undefined,{workplaces:true});s.events=new EventEmitter();s.workerSystem.unsubscribe();return s;}
function build(s,type,x,y){const d=s.objectRegistry.require(type);for(const[id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.events.emit('buildings:changed');return r.building;}
const person=(id,profession,skill,level,totalXP,talent='hunting',overall=1)=>({id,profession,naturalTalent:talent,skills:{[skill]:{level,totalXP}},experience:{level:overall}});

test('three groups in a fixed order: this profession without a workplace, others without one, working elsewhere; each sorted by the needed skill',()=>{
  assert.deepEqual(CANDIDATE_GROUPS,['profession','free','employed']);
  const at=(w,id)=>({...w,assignedWorkplaceId:id});
  const people=[
    person('worker-9','idle','mining',3,500),person('worker-2','idle','mining',5,900),person('worker-3','idle','mining',3,500,'mining'),
    person('worker-4','idle','mining',3,500,'hunting',4),person('worker-1','idle','mining',3,500),at(person('worker-5','woodcutter','mining',2,100),7),
    person('worker-6','hauler','mining',6,10),person('worker-7','miner','mining',1,0),person('worker-8','miner','mining',4,0),at(person('worker-10','miner','mining',9,0),3)];
  const groups=candidateGroups(people,WORKPLACES.quarry);
  assert.deepEqual(groups.profession.map(w=>w.id),['worker-8','worker-7'],'Miners without a workplace first');
  assert.deepEqual(groups.free.map(w=>w.id),['worker-6','worker-2','worker-3','worker-4','worker-1','worker-9'],'everyone else without a workplace: level, XP, talent, overall level, id');
  assert.deepEqual(groups.employed.map(w=>w.id),['worker-10','worker-5'],'already working in a building – last, even a Miner from another quarry');
  // XP in the skill decides between equal levels.
  assert.deepEqual(candidateGroups([person('worker-1','idle','farming',2,10),person('worker-2','idle','farming',2,40)],WORKPLACES.farmhouse).free.map(w=>w.id),['worker-2','worker-1']);
});

test('every workplace profession sorts by its own skill',()=>{
  for(const spec of Object.values(WORKPLACES)){
    const low=person('worker-1','idle',spec.skill,1,0),high=person('worker-2','idle',spec.skill,7,0);
    assert.deepEqual(candidateGroups([low,high],spec).free.map(w=>w.id),['worker-2','worker-1'],spec.profession);
  }
});

test('moving a worker from another workplace keeps one job and one wage; the Granary never reports missing workers',()=>{
  const s=fixture(),quarry=build(s,'quarry',55,50),mine=build(s,'lumberjack_hut',62,50),granary=build(s,'granary',70,50),model=new StaffingStatus(s);
  const w=s.workerSystem.create({x:50,y:50});assert.equal(s.workplaceSystem.assign(mine,w),true);assert.equal(w.profession,'woodcutter');
  assert.equal(s.workplaceSystem.assign(quarry,w),true);
  assert.equal(w.assignedWorkplaceId,quarry.id);assert.equal(w.profession,'miner');
  assert.deepEqual(s.workplaceSystem.records.get(mine.id).workerIds,[]);assert.deepEqual(s.workplaceSystem.records.get(quarry.id).workerIds,[w.id]);
  assert.equal(s.workplaceSystem.summary(quarry).count+s.workplaceSystem.summary(mine).count,1);
  assert.equal(s.workplaceSystem.assign(quarry,w),true,'assigning again here changes nothing');assert.deepEqual(s.workplaceSystem.records.get(quarry.id).workerIds,[w.id]);
  // The Granary is a store served by global Haulers, not a staffed workplace.
  assert.equal(staffingStatus(s,granary),null);assert.equal(model.records.has(granary.id),false);
  assert.equal(model.records.has(mine.id),true,'a real empty workplace still reports missing workers');model.destroy();
});
