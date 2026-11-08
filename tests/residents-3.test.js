import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding,towerNeighbors } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { DAILY_REST } from '../src/data/needs.js';
import { NAME_LISTS,NAME_SIZES,czechFemale,shortName,fullName,identityKey,validIdentity,pickIdentity } from '../src/data/names.js';
import { MOVEMENT_SPEED_SCALE } from '../src/data/movement.js';
import { advanceMovement } from '../src/game/movement.js';
import { NightThreatSystem } from '../src/systems/NightThreatSystem.js';
import { ChildrenSystem } from '../src/systems/ChildrenSystem.js';
import { WorldCamera } from '../src/game/WorldCamera.js';
import { setLanguage,language } from '../src/i18n/index.js';
import { seeded } from '../src/data/children.js';
import { walkFrame } from '../src/data/objects/approvedArt.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// m-obyvatele-jmena-spanek-pohyb (31, 42, 43): names with surname and origin, sleeping inside, 25 % slower walking.
const day=s=>s.gameTime.dayDuration;
function place(s,type,x,y){const d=s.objectRegistry.require(type);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));return result.building;}
function resident(s,tile){const w=s.workerSystem.create(tile);w.arriving=false;w.workState='Idle';return w;}
function until(s,p,max=150000){let n=0;while(!p()&&n<max){s.tick(50);n+=50;}assert.ok(p(),`not reached after ${n} ms`);return n;}
const toEvening=(s,before=500)=>s.simulate(Math.max(0,day(s)*DAILY_REST.startFraction-before-s.gameTime.elapsed));
const threats=burning=>({burning,firefight:()=>false,pursue(){}});
const inLanguage=(lang,fn)=>{const old=language();setLanguage(lang,{persist:false});try{return fn();}finally{setLanguage(old,{persist:false});}};

test('name lists: Czech and English are index-aligned, unique, big enough and Czech female surnames are formed correctly',()=>{
  for(const key of ['male','female','surnames','origins'])for(const lang of ['cs','en']){const list=NAME_LISTS[lang][key];assert.equal(list.length,NAME_SIZES[key],`${lang} ${key} aligned`);assert.equal(new Set(list).size,list.length,`${lang} ${key} unique`);}
  assert.ok(NAME_SIZES.surnames>=120&&NAME_SIZES.origins>=80);
  assert.ok(NAME_LISTS.cs.origins.every(o=>/^ze? \p{Lu}/u.test(o)),'z/ze + genitive');assert.ok(NAME_LISTS.en.origins.every(o=>/^of \p{Lu}/u.test(o)));
  assert.ok(NAME_LISTS.cs.origins.includes('z Pičína')&&NAME_LISTS.cs.origins.includes('z Horažďovic')&&NAME_LISTS.cs.origins.includes('z Prašivky'));
  assert.ok(NAME_LISTS.en.origins.includes('of Little Snoring')&&NAME_LISTS.en.surnames.includes('Ploughwright'));
  for(const [male,female]of [['Flaška','Flašková'],['Knírek','Knírková'],['Drška','Dršková'],['Hořčice','Hořčicová'],['Zelenáč','Zelenáčová'],['Veselý','Veselá'],['Krejčí','Krejčí'],['Vrabec','Vrabcová'],['Kozel','Kozlová'],['Šnek','Šneková'],['Kuřátko','Kuřátková'],['Podkova','Podkovová']])
    assert.equal(czechFemale(male),female);
  const females=NAME_LISTS.cs.surnames.map(czechFemale);assert.equal(new Set(females).size,females.length,'female forms stay unique');
  assert.ok(females.every(f=>/(ová|á|í)$/.test(f)),'every female form ends like a Czech female surname');
  const i={sex:'m',first:0,surname:0,origin:0};assert.equal(shortName(i,'cs'),'Jaroslav Flaška');assert.equal(fullName(i,'cs'),'Jaroslav Flaška z Pičína');
  assert.equal(fullName({...i,sex:'f'},'cs'),'Anna Flašková z Pičína');assert.equal(fullName(i,'en'),'John Thatcher of Little Snoring');
});

test('residents get unique surnamed names that follow the game language; no numbering; seeded by world and id',()=>{
  const s=workerScene();const people=[];for(let y=5;y<95&&people.length<400;y+=2)for(let x=5;x<95&&people.length<400;x+=2)if(s.map[y][x]===0)people.push(s.workerSystem.create({x,y}));
  for(const lang of ['en','cs'])inLanguage(lang,()=>{
    const names=people.map(w=>w.name);assert.equal(new Set(names).size,names.length,`${lang}: no name repeats`);
    assert.ok(names.every(n=>n.split(' ').length>=2&&!/\d/.test(n)),'first name + surname, never "Pavel 2"');
    assert.ok(people.every(w=>w.fullName.startsWith(w.name)&&w.fullName.length>w.name.length+3));
    assert.ok(people.every(w=>w.fullName.includes(lang==='cs'?' z':' of ')));
  });
  const woman=people.find(w=>w.identity.sex==='f'),man=people.find(w=>w.identity.sex==='m');
  inLanguage('cs',()=>{assert.equal(woman.name.split(' ').slice(1).join(' '),czechFemale(NAME_LISTS.cs.surnames[woman.identity.surname]));assert.equal(man.name.split(' ')[1],NAME_LISTS.cs.surnames[man.identity.surname]);});
  inLanguage('en',()=>assert.ok(NAME_LISTS.en.female.includes(woman.name.split(' ')[0])));
  const a=workerScene(),b=workerScene();assert.deepEqual(a.workerSystem.create({x:10,y:10}).identity,b.workerSystem.create({x:10,y:10}).identity,'same world + id = same name');
  const taken=new Set(),r=seeded(7);for(let i=0;i<NAME_SIZES.male*3;i++){const id=pickIdentity(r,taken,{sex:'m',surname:5});assert.equal(id.surname,5);if(i<NAME_SIZES.male){assert.ok(!taken.has(identityKey(id)),'a free name is always found while one exists');}taken.add(identityKey(id));}
  const thief=s.workerSystem.create({x:1,y:1},{isSubject:false,name:'Thief'});assert.equal(thief.identity,null);assert.equal(thief.name,'Thief');
});

test('Save/Load keeps the name identity and the deceased record; corrupt or duplicate identities are rejected',()=>{
  const s=workerScene(),a=resident(s,{x:40,y:42}),b=resident(s,{x:42,y:42}),dead=resident(s,{x:44,y:42});
  dead.currentHP=0;dead.isAlive=false;s.workerSystem.recordDeath(dead,'wounds');s.workerSystem.onDeath(dead);
  const data=validateGameState(serializeGameState(s));const saved=data.workers.find(w=>w.id===a.id);
  assert.deepEqual(saved.identity,a.identity);assert.equal(saved.name,a.name);assert.deepEqual(data.population.deceased[0].identity,dead.identity);
  const r=workerScene();loadGameState(r,structuredClone(data));
  assert.deepEqual(r.workerSystem.workers.get(a.id).identity,a.identity);assert.equal(r.workerSystem.workers.get(b.id).fullName,b.fullName);assert.deepEqual(serializeGameState(r).workers,serializeGameState(s).workers);
  const fresh=r.workerSystem.create({x:50,y:50});assert.ok(![a,b,dead].some(w=>identityKey(w.identity)===identityKey(fresh.identity)),'a loaded game never repeats a name');
  for(const corrupt of [w=>w.identity.surname=NAME_SIZES.surnames,w=>w.identity.sex='x',w=>w.identity.extra=1,w=>w.identity.first=-1,w=>w.identity=null]){const bad=structuredClone(data);corrupt(bad.workers.find(w=>w.id===a.id));assert.throws(()=>validateGameState(bad));}
  const dup=structuredClone(data);dup.workers.find(w=>w.id===b.id).identity=structuredClone(dup.workers.find(w=>w.id===a.id).identity);assert.throws(()=>validateGameState(dup),'two residents with one name');
  const plain=structuredClone(data);delete plain.workers.find(w=>w.id===a.id).identity;validateGameState(plain);
  assert.equal(validIdentity({sex:'f',first:NAME_SIZES.female-1,surname:0,origin:NAME_SIZES.origins-1}),true);
});

test('children take the family surname (female form for a girl) and origin',()=>{
  const s=workerScene();for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);s.childrenSystem=new ChildrenSystem(s);
  const houses=[];for(let i=0;i<8;i++)houses.push(place(s,'house',20+(i%4)*8,20+Math.floor(i/4)*8));
  for(let i=0;i<40;i++)s.workerSystem.create({x:10+i,y:70});s.childrenSystem.sync();
  const kids=[...s.childrenSystem.children.values()];assert.ok(kids.length>=4,'families have children');
  inLanguage('cs',()=>{for(const k of kids){const family=s.childrenSystem.family(k.houseId),surname=NAME_LISTS.cs.surnames[family.surname],name=s.childrenSystem.nameOf(k);
    assert.equal(name.split(' ').slice(1).join(' '),k.sex==='girl'?czechFemale(surname):surname);assert.equal(s.childrenSystem.nameOf(k,{full:true}),`${name} ${NAME_LISTS.cs.origins[family.origin]}`);}
    const names=kids.map(k=>s.childrenSystem.nameOf(k));assert.equal(new Set(names).size,names.length,'no two children share a name');});
  inLanguage('en',()=>assert.ok(kids.every(k=>NAME_LISTS.en.children[k.sex].includes(s.childrenSystem.nameOf(k).split(' ')[0]))));
});

test('at night a resident with a House sleeps inside (hidden, not blocking, no prey) and comes out at the door in the morning',()=>{
  const s=workerScene(),h=place(s,'house',60,60),w=resident(s,{x:45,y:45});s.nightThreats=threats(()=>false);
  toEvening(s);until(s,()=>w.sleepingIn!=null);
  assert.equal(w.sleepingIn,h.id);assert.equal(w.workMessage,'Sleeping at home');assert.ok(towerNeighbors(h).some(t=>t.x===w.tile.x&&t.y===w.tile.y),'he walked to the door');
  assert.deepEqual(w.reservedTiles(),[],'a sleeper blocks no tile');assert.equal(s.workerSystem.commands.selectable(w),false,'and cannot be selected');
  assert.deepEqual(s.workerSystem.sleepersIn(h.id),[w]);
  assert.equal(NightThreatSystem.prototype.prey.call({scene:s,lit:()=>false},[]).includes(w),false,'wolves never hunt a sleeper');
  const door={...w.tile};until(s,()=>w.sleepingIn==null&&w.restPhase==null,day(s));assert.ok(s.gameTime.elapsed<day(s)*DAILY_REST.startFraction,'he wakes in the morning');
  assert.deepEqual(w.tile,door,'he comes out of the door he went in');assert.equal(s.workerSystem.commands.selectable(w),true);
});

test('residents without a House sleep in the Castle; a burning house wakes its sleepers; a soldier on guard stays out',()=>{
  const s=workerScene(undefined,{workplaces:true}),castle=place(s,'castle',30,30),w=resident(s,{x:45,y:45});s.fires=new Set();s.nightThreats=threats(b=>s.fires.has(b.id));
  assert.equal(s.needs.homeOf(w).kind,'settlement');toEvening(s);until(s,()=>w.sleepingIn!=null);assert.equal(w.sleepingIn,castle.id);assert.equal(w.workMessage,'Sleeping in the Castle');
  const t=workerScene(),h=place(t,'house',60,60),v=resident(t,{x:45,y:45}),guard=resident(t,{x:47,y:45});guard.profession='soldier';t.fires=new Set();t.nightThreats=threats(b=>t.fires.has(b.id));
  toEvening(t);until(t,()=>v.sleepingIn===h.id);t.simulate(500);assert.equal(guard.sleepingIn,null);assert.equal(guard.restPhase,null,'soldiers keep the guard');
  NightThreatSystem.prototype.ignite.call({scene:t,fires:new Map(),changed(){}},h);t.fires.add(h.id);assert.equal(v.restPhase,null,'woken');t.simulate(100);assert.equal(v.sleepingIn,null,'out of the burning house');assert.equal(t.workerSystem.sleepersIn(h.id).length,0);
});

test('Locate on a sleeping resident focuses his House; Save/Load restores him inside',()=>{
  const s=workerScene(),h=place(s,'house',60,60),w=resident(s,{x:45,y:45});toEvening(s);until(s,()=>w.sleepingIn===h.id);
  const camera=Object.create(WorldCamera.prototype);camera.scene={buildings:s.buildings,fog:{isVisibleObject:()=>true},towerViews:s.towerViews};globalThis.document={querySelector:()=>({textContent:''})};
  assert.equal(camera.locate(w),true);assert.ok(camera.panTarget,'the camera moves to the House');camera.scene.fog={isVisibleObject:()=>false};assert.equal(camera.locate(w),false,'never through the fog');
  const r=workerScene();loadGameState(r,validateGameState(serializeGameState(s)));const back=r.workerSystem.workers.get(w.id);r.tick(50);assert.equal(back.sleepingIn,h.id,'derived again from rest and position');
});

test('walking speed is 0.75 of the listed speed for every walker and walk animations slow down equally',()=>{
  assert.equal(MOVEMENT_SPEED_SCALE,.75);
  const actor={tile:{x:1,y:1},position:{x:1.5,y:1.5},path:[{x:2,y:1},{x:3,y:1},{x:4,y:1}],nextTile:null,speed:2,scene:{}};advanceMovement(actor,1000);
  assert.ok(Math.abs(actor.position.x-1.5-2*MOVEMENT_SPEED_SCALE)<1e-9,'2 tiles/s listed → 1.5 tiles/s');
  const s=workerScene(),w=s.workerSystem.create({x:40,y:40});w.moveTo([{x:50,y:40}]);w.update(1000);assert.ok(Math.abs(w.position.x-40.5-w.speed*MOVEMENT_SPEED_SCALE)<1e-6,'a resident too');
  const deer=s.animalSystem.create(s.objectRegistry.require('deer'),{x:20,y:20});deer.moveTo([{x:30,y:20}]);deer.update(1000);assert.ok(Math.abs(deer.position.x-20.5-deer.speed*MOVEMENT_SPEED_SCALE)<1e-6,'and an animal');
  const c=new ChildrenSystem(s),child={x:5.5,y:5.5,path:[{x:6,y:5},{x:7,y:5},{x:8,y:5},{x:9,y:5}],facing:{x:1,y:0}};c.walk(child,1,2);assert.ok(Math.abs(child.x-5.5-2*MOVEMENT_SPEED_SCALE)<1e-6,'and a child');
  // walk sheets: the frame advances with walked time × the same share (see HumanView / animalArt).
  assert.equal(walkFrame(0,1000*MOVEMENT_SPEED_SCALE,6,true),walkFrame(0,750,6,true));
});
