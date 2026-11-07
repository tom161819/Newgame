import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { EmploymentSystem } from '../src/systems/EmploymentSystem.js';
import { jobChoices,freeSeats,changeProfession } from '../src/ui/jobChange.js';

globalThis.document??={querySelector:()=>({textContent:''})};
function fixture(){const s=workerScene(undefined,{workplaces:true});s.events=new EventEmitter();s.employment=new EmploymentSystem(s);s.employment.setEnabled?.(false);return s;}
function build(s,type,x,y){const d=s.objectRegistry.require(type);for(const[id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.events.emit('buildings:changed');return r.building;}
const resident=(s,x)=>s.workerSystem.create({x,y:50});
const choice=(s,w,id)=>jobChoices(s,w).find(c=>c.id===id);

test('the quick job menu lists every profession but Unemployed with free seats, full workplaces and the current job',()=>{
  const s=fixture(),quarry=build(s,'quarry',55,50),w=resident(s,52);
  const cap=quarry.definition.workplace.capacity;assert.equal(freeSeats(s).get('miner'),cap);
  assert.equal(jobChoices(s,w).some(c=>c.id==='idle'),false);
  assert.deepEqual({free:choice(s,w,'miner').free,full:choice(s,w,'miner').full},{free:cap,full:false});
  assert.equal(choice(s,w,'hauler').free,null,'a profession without buildings needs no seat');assert.equal(choice(s,w,'hauler').full,false);
  assert.equal(choice(s,w,'woodcutter').full,true,'no Lumberjack Hut: the job is full but still offered');
});

test('choosing a job from the menu: the unemployed get the job and a free seat, a full job leaves them without a workplace, Unemploy holds them',()=>{
  const s=fixture(),quarry=build(s,'quarry',55,50),cap=quarry.definition.workplace.capacity,w=resident(s,52);
  assert.equal(changeProfession(s,w,'miner'),true);assert.equal(w.profession,'miner');assert.equal(w.assignedWorkplaceId,quarry.id);
  assert.equal(choice(s,w,'miner').current,true);assert.equal(choice(s,w,'miner').free,cap-1);
  const others=Array.from({length:cap-1},(_,i)=>resident(s,40+i));for(const o of others)changeProfession(s,o,'miner');assert.equal(choice(s,w,'miner').full,true);
  const late=resident(s,48);changeProfession(s,late,'miner');assert.equal(late.profession,'miner');assert.equal(late.assignedWorkplaceId,null,'No free workplace');
  changeProfession(s,w,'idle');assert.equal(w.profession,'idle');assert.equal(w.assignedWorkplaceId,null);assert.equal(choice(s,late,'miner').free,1,'the freed seat is offered again');
  assert.equal(changeProfession(s,w,'nonsense'),false);
});
