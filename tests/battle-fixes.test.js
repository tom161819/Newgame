import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { workerScene } = await import('./helpers/workerScene.js');
const { spawnSandboxUnits } = await import('../src/game/sandboxMode.js');
const { placeBuilding } = await import('../src/game/buildings.js');
const { AlarmSystem,ALARM } = await import('../src/systems/AlarmSystem.js');
const { MILITARY_RULES,CATAPULT,WAGON_SUPPLY,DEFENSE_MOVES } = await import('../src/data/military.js');
const { markEnemyBuilding } = await import('../src/systems/SiegeSystem.js');
const { findPathToAny } = await import('../src/game/pathfinding.js');

// Owner 18 Nov 2026: "ok udělej všechny návrhy oprav z testu" (project document claude/test-bitev-0.146.md).
const scene=()=>workerScene(undefined,{foodProduction:true,workplaces:true});
const until=(s,p,max=120000)=>{let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;};
function build(s,type,x,y){const d=s.objectRegistry.require(type);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));result.building.progress=1;result.building.completed=true;s.foodStorage?.register?.(result.building);return result.building;}
const units=(s,id,at,n)=>{const before=new Set([...s.workerSystem.workers.keys(),...s.animalSystem.animals.keys()]);spawnSandboxUnits(s,id,at,n);return [...s.workerSystem.workers.values(),...s.animalSystem.animals.values()].filter(u=>!before.has(u.id));};
const foes=s=>[...s.animalSystem.animals.values()].filter(a=>a.isAlive&&a.definition?.gameplay?.hostile);
const far=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

test('point 1: a wounded soldier falls back to the Castle, not to the edge of the map; the enemy gives up the chase and walks back',()=>{
  const s=scene();s.character.away=true;const castle=build(s,'castle',20,48),[w]=units(s,'swordsman',{x:52,y:50},1),[knight]=units(s,'enemy_knight',{x:58,y:50},1),post={...knight.tile};
  w.currentHP=w.maxHP*.2;until(s,()=>w.retreating,20000);until(s,()=>!w.retreating&&!w.nextTile&&!w.path.length,90000);
  assert.ok(w.isAlive,'he got away');assert.ok(far(w.tile,{x:22,y:50})<=far({x:52,y:50},{x:22,y:50})-12&&w.tile.x>=castle.x&&Math.abs(w.tile.y-50)<=4,`${w.tile.x},${w.tile.y}: he ran towards the Castle and stopped when nobody followed`);
  until(s,()=>!knight.retaliationTarget&&!knight.returning,60000);assert.ok(far(knight.tile,post)<=4,`the enemy is back at his post (${knight.tile.x},${knight.tile.y})`);
});

test('point 1: with no refuge a retreating soldier runs at most retreatMax tiles and then stands and fights',()=>{
  const s=scene(),[w]=units(s,'soldier',{x:40,y:50},1),[knight]=units(s,'enemy_knight',{x:43,y:50},1);w.currentHP=w.maxHP*.2;const start={...w.tile};let most=0;
  for(let t=0;t<60000&&w.isAlive&&knight.isAlive;t+=50){s.tick(50);most=Math.max(most,far(w.tile,start));}
  assert.ok(most<=MILITARY_RULES.retreatMax+3,`ran ${most.toFixed(1)} tiles`);assert.ok(!w.isAlive||!knight.isAlive,'the fight was fought out');
});

test('point 7: the alarm – residents near enemy soldiers run into the Castle and hide; enemies leave people inside alone; they come out when it is quiet',()=>{
  const s=scene();s.character.away=true;s.alarm=new AlarmSystem(s);const castle=build(s,'castle',30,46),people=[];const said=[];s.eventFeed={push:(key,text)=>said.push(text)};
  for(let i=0;i<5;i++){const w=s.workerSystem.create({x:45+i,y:50});w.arriving=false;people.push(w);}
  const enemies=units(s,'enemy_soldier',{x:50,y:43},3);
  until(s,()=>people.every(w=>w.sleepingIn===castle.id),40000);assert.ok(people.every(w=>w.isAlive),'nobody was killed');assert.equal(people[0].workMessage,'Hiding in the Castle');
  assert.equal(said.filter(x=>/shelter/.test(x)).length,1,'one line in the event feed');
  s.simulate(4000);assert.ok(enemies.every(a=>!a.retaliationTarget),'nobody to hunt');
  for(const a of enemies)s.animalSystem.remove(a);s.simulate(ALARM.calm+2000);assert.ok(people.every(w=>w.sleepingIn==null&&!w.alarm),'they come out');
  // A soldier never hides.
  const t=scene();t.alarm=new AlarmSystem(t);build(t,'castle',30,46);const [guard]=units(t,'swordsman',{x:45,y:50},1);units(t,'enemy_soldier',{x:49,y:50},1);t.simulate(3000);assert.equal(guard.alarm,undefined);
});

test('point 4: a Catapult out of Stones tells the player once; an empty Wagon fetches Stones from a store and brings them',()=>{
  const s=workerScene(undefined,{foodProduction:true,workplaces:true,logistics:true});s.workerSystem.unsubscribe?.();s.inventory.add('stone',60);const store=[...s.foodStorage.locations.values()].find(l=>s.foodStorage.free(l.id,'stone')>0);assert.ok(store,'Stones lie in a store');
  const d=s.objectRegistry.require('wall'),target={id:900,type:'wall',definition:d,x:70,y:52,tiles:[{x:70,y:52}]};s.buildings.push(target);s.map[52][70]=1;s.towerViews.set(900,s.createBuildingView(d,target));markEnemyBuilding(s,target);
  const [crew]=units(s,'catapult',{x:60,y:52},1),[driver]=units(s,'military_wagon',{x:58,y:54},1),cat=s.military.engines.vehicleOf(crew),wagon=s.military.engines.vehicleOf(driver);
  cat.ammo=0;wagon.supplies={};const said=[];s.eventFeed={push:(key,text)=>said.push(text)};s.military.siege.order([crew,driver],target);
  until(s,()=>said.some(x=>/run out of Stones/.test(x)),20000);
  until(s,()=>(wagon.supplies.stone??0)>0,120000);assert.ok(far(driver.tile,store)<=WAGON_SUPPLY.loadRadius+3,'it loaded at the store');
  until(s,()=>cat.ammo>0,120000);assert.equal(said.filter(x=>/run out of Stones/.test(x)).length,1);assert.equal(CATAPULT.damage,100);
});

test('point 11: on the Test map nobody goes hungry',()=>{
  const s=scene();s.sandbox=true;const [w]=units(s,'soldier',{x:40,y:50},1);for(const id of ['bread','meat','apple','fish'])s.inventory.spend?.(id,s.inventory.count(id));
  assert.equal(s.foodSystem.eat(w),true);s.sandbox=false;
});

test('point 8: attack-move – soldiers fight the enemies they meet on the way and then walk on to where they were sent; a plain move walks past',()=>{
  const s=scene();s.character.away=true;const us=units(s,'swordsman',{x:30,y:50},5),enemies=units(s,'enemy_soldier',{x:45,y:51},3);
  assert.equal(s.workerSystem.commands.move(us,{x:62,y:50},{attack:true}),5);assert.ok(us.every(w=>w.attackMove));
  until(s,()=>enemies.every(e=>!e.isAlive),90000);assert.ok(us.some(w=>w.isAlive&&w.commandState.state==='MovingToHold'),'still on the way');
  until(s,()=>us.filter(w=>w.isAlive).every(w=>w.commandState.state==='Holding'),90000);for(const w of us.filter(w=>w.isAlive)){assert.ok(far(w.tile,{x:62,y:50})<=4);assert.equal(w.attackMove,undefined);}
  // A new plain order ends it.
  const t=scene();t.character.away=true;const [w]=units(t,'swordsman',{x:30,y:50},1);t.workerSystem.commands.move([w],{x:60,y:50},{attack:true});t.workerSystem.commands.move([w],{x:40,y:50});assert.equal(w.attackMove,undefined);
});

test('point 9: two shifts – at any time of the day at most half of the soldiers have their rest time',async()=>{
  const { isSoldierRestTime,soldierShift } = await import('../src/systems/DailyRest.js');const soldiers=Array.from({length:10},(_,i)=>({id:`worker-${i+1}`}));
  assert.deepEqual([...new Set(soldiers.map(soldierShift))].sort(),[0,1]);
  for(let f=0;f<1;f+=.02){const time={restStartFraction:()=>.75,day:3,elapsed:f*1000,dayDuration:1000},resting=soldiers.filter(w=>isSoldierRestTime(time,w)).length;assert.ok(resting<=5,`${resting} rest at ${f.toFixed(2)}`);if(f>=.68)assert.equal(resting,0,'everybody watches in the evening and at night');}
  assert.equal(isSoldierRestTime({restStartFraction:()=>.75,day:1,elapsed:100,dayDuration:1000},soldiers[1]),false,'not on day 1');
});

test('point 5: an enemy Gate is closed; it opens while a melee defender near it goes for our people (ours may walk in then) and closes after',async()=>{
  const { EnemyGates,ENEMY_GATE } = await import('../src/systems/EnemyGates.js');
  const s=scene();s.character.away=true;s.enemyGates=new EnemyGates(s);
  const put=(type,x,y)=>{const d=s.objectRegistry.require(type),tiles=[];for(let j=0;j<d.height;j++)for(let i=0;i<d.width;i++)tiles.push({x:x+i,y:y+j});const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x,y,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=d.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(d,b));markEnemyBuilding(s,b);return b;};
  for(let x=50;x<62;x++){if(x!==55&&x!==56){put('wall',x,48);put('wall',x,49);}put('wall',x,40);}for(let y=41;y<48;y++){put('wall',50,y);put('wall',61,y);}
  const gate=put('gate',55,48),closed=()=>gate.tiles.every(t=>s.map[t.y][t.x]===1),open=()=>gate.tiles.every(t=>s.map[t.y][t.x]===0);
  const way=()=>findPathToAny(s.map,{x:58,y:53},[{x:57,y:44}]);
  s.tick(400);assert.ok(closed()&&!s.enemyGates.isOpen(gate)&&!way(),'closed with nobody about: no way in');
  // Enemy archers alone do not open it.
  const archers=units(s,'enemy_archer',{x:53,y:44},2),[bait]=units(s,'swordsman',{x:55,y:53},1);bait.stance='hold';
  for(let i=0;i<60;i++)s.tick(50);assert.ok(closed(),'archers stay behind the closed Gate');for(const a of archers)s.animalSystem.remove(a);
  const guards=units(s,'enemy_soldier',{x:55,y:45},3);
  until(s,()=>open(),15000);assert.ok(s.enemyGates.isOpen(gate));
  until(s,()=>guards.some(g=>g.tile.y>=50),30000);assert.ok(true,'the defenders came out through the Gate');
  // Ours get in while it is open.
  assert.ok(way(),'a route through the open Gate');
  // With the defenders dead it closes, but never on somebody inside it.
  for(const g of guards)s.animalSystem.remove(g);const [stander]=units(s,'swordsman',{x:55,y:52},1);stander.stance='hold';stander.tile={x:55,y:48};stander.position={x:55.5,y:48.5};stander.path=[];stander.nextTile=null;
  for(let i=0;i<(ENEMY_GATE.stayOpen+2000)/50;i++)s.tick(50);assert.ok(open(),'not shut on a man in the Gate');
  stander.tile={x:55,y:52};stander.position={x:55.5,y:52.5};for(let i=0;i<40;i++)s.tick(50);assert.ok(closed()&&!way(),'closed again');
});

test('point 10: in a night battle the selected soldiers and everybody in a fight get a small glow; a light source can be scaled',async()=>{
  const { battleGlow,UNIT_GLOW } = await import('../src/game/battleGlow.js');const { resolveLights,defaultLightSettings } = await import('../src/render/lightLab.js');
  const s=scene();s.character.away=true;const us=units(s,'swordsman',{x:40,y:50},3),[foe]=units(s,'enemy_soldier',{x:70,y:50},1);
  assert.equal(battleGlow(s).length,0);s.unitSelection={ids:new Set([us[0].id])};assert.deepEqual(battleGlow(s),[us[0]]);
  s.combat.attacks.set(us[1],foe);assert.deepEqual(new Set(battleGlow(s)),new Set([us[0],us[1],foe]),'attacker and target, either side');s.combat.attacks.delete(us[1]);
  s.lightFuel={carries:w=>w===us[0]};assert.equal(battleGlow(s).length,0,'a torch bearer has his own light');
  const settings=defaultLightSettings(),at={darkness:1,seconds:0},[full]=resolveLights([{type:'lantern',x:0,y:0,seed:0}],settings,at),[glow]=resolveLights([{type:'lantern',x:0,y:0,seed:0,...UNIT_GLOW}],settings,at);
  assert.ok(glow.rx<full.rx*.7&&glow.strength<full.strength*.7,'smaller and weaker than a lantern');assert.notDeepEqual(glow.color,full.color);
});

test('point 3: archers lob a shot over a wall at short range for half the damage; hunters and far shots still need a clear line',async()=>{
  const { inAttackRange,shotFactor,LOB } = await import('../src/systems/CombatSystem.js');const { blockersBetween } = await import('../src/game/lineOfSight.js');
  const s=scene();s.character.away=true;for(let x=40;x<=60;x++)s.map[50][x]=1;
  assert.equal(blockersBetween(s.map,{x:50,y:48},{x:50,y:52}),1);assert.equal(blockersBetween(s.map,{x:50,y:48},{x:50,y:49}),0);
  const [archer]=units(s,'archer',{x:50,y:52},1),[foe]=units(s,'enemy_soldier',{x:50,y:48},1),at=(u,x,y)=>{u.tile={x,y};u.position={x:x+.5,y:y+.5};u.path=[];u.nextTile=null;};
  at(archer,50,52);at(foe,50,48);assert.equal(inAttackRange(archer,foe,s.map),true,'4 tiles, one wall between');assert.equal(shotFactor(archer,foe,s.map),LOB.damage);
  at(foe,50,44);assert.equal(inAttackRange(archer,foe,s.map),false,'8 tiles over a wall is too far');
  at(foe,50,48);s.map[49][50]=1;s.map[51][50]=1;assert.equal(inAttackRange(archer,foe,s.map),false,'three tiles thick is too much');s.map[49][50]=0;s.map[51][50]=0;
  assert.equal(inAttackRange({...archer,profession:'hunter',definition:{}},foe,s.map),false,'a Hunter does not lob');
  // An enemy archer lobs too, and the damage really is half.
  const [bow]=units(s,'enemy_archer',{x:53,y:48},1);at(bow,53,48);const [mark]=units(s,'swordsman',{x:53,y:52},1);at(mark,53,52);assert.equal(inAttackRange(bow,mark,s.map),true);
  const hp=foe.currentHP;s.combat.attacks.set(archer,foe);s.combat.update(1000);const over=hp-foe.currentHP;s.combat.attacks.delete(archer);
  for(let x=40;x<=60;x++)s.map[50][x]=0;foe.currentHP=hp;s.combat.attacks.set(archer,foe);s.combat.update(1000);const clear=hp-foe.currentHP;s.combat.attacks.delete(archer);
  assert.ok(over>0&&Math.abs(over-clear*LOB.damage)<1e-6,`${over} over the wall, ${clear} with a clear line`);
});

test('point 3: an archer whose enemy stands behind a wall walks to a place he can lob from and shoots',()=>{
  const s=scene();s.character.away=true;for(let x=30;x<=75;x++)for(const y of [44,50])s.map[y][x]=1;for(let y=44;y<=50;y++)for(const x of [30,75])s.map[y][x]=1;
  const [foe]=units(s,'enemy_soldier',{x:52,y:48},1),[archer]=units(s,'archer',{x:52,y:60},1);s.military.orderAttack([archer],foe);
  until(s,()=>s.combat.attacks.get(archer)===foe&&foe.currentHP<foe.maxHP,40000);assert.ok(archer.tile.y>50,'he stayed outside the wall');assert.ok(Math.max(Math.abs(archer.tile.x-foe.tile.x),Math.abs(archer.tile.y-foe.tile.y))<=6);
});

test('point 3: archers ordered at a wooden enemy building shoot fire arrows until it burns; at stone they do not shoot',async()=>{
  const { FIRE_ARROWS } = await import('../src/data/military.js');const { buildingHP } = await import('../src/game/buildingHealth.js');
  const s=scene();s.character.away=true;const lit=new Set();s.nightThreats=new Proxy({flammable:b=>b.type==='house',burning:b=>lit.has(b.id),ignite:b=>{lit.add(b.id);}},{get:(o,k)=>o[k]??(()=>false)});
  const put=(type,x,y)=>{const d=s.objectRegistry.require(type),tiles=[];for(let j=0;j<d.height;j++)for(let i=0;i<d.width;i++)tiles.push({x:x+i,y:y+j});const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x,y,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));markEnemyBuilding(s,b);return b;};
  const house=put('house',60,50),wall=put('wall',60,40),archers=units(s,'archer',{x:45,y:50},4);
  assert.equal(s.military.siege.order(archers,wall),0,'not at stone');assert.equal(s.military.siege.order(archers,house),4);assert.deepEqual(s.military.siege.lastOrder,{melee:0,archers:4,engines:0});
  until(s,()=>archers.every(a=>a.workMessage==='Shooting fire arrows'&&!a.nextTile&&!a.path.length)&&buildingHP(house).hp<buildingHP(house).max,40000);
  for(const a of archers)assert.ok(Math.max(house.x-a.tile.x,a.tile.x-house.x-1,house.y-a.tile.y,a.tile.y-house.y-1)>=2,'from a distance, not at its wall');
  until(s,()=>lit.has(house.id),FIRE_ARROWS.igniteAfter*1000);assert.ok(s.buildings.includes(house),'it burns before the arrows alone bring it down');
  until(s,()=>!s.buildings.includes(house),60000);assert.ok(archers.every(a=>a.siegeTargetId==null),'done');
});

test('unit roles: the Crossbowman ignores half the armour, the Halberdier hits riders harder, the Light Cavalry opens with a charge after a ride',async()=>{
  const { UNIT_TYPES } = await import('../src/data/military.js');const s=scene();s.character.away=true;
  const [xbow]=units(s,'crossbowman',{x:40,y:50},1),[bow]=units(s,'royal_archer',{x:40,y:52},1),[halb]=units(s,'halberdier',{x:40,y:54},1),[rider]=units(s,'light_cavalry',{x:30,y:60},1),[knight]=units(s,'enemy_knight',{x:44,y:50},1);
  assert.equal(s.combat.pierce(xbow),.5);assert.equal(s.combat.pierce(bow),0);/* point 7 (20 Nov): the rider dodges, the Knight parries a share of melee blows */assert.ok(Math.abs(s.combat.bonus(halb,rider)-UNIT_TYPES.halberdier.bonusVs.mounted*(1-DEFENSE_MOVES.dodge.chance))<1e-9);assert.ok(Math.abs(s.combat.bonus(halb,knight)-(1-DEFENSE_MOVES.parry.chance))<1e-9);assert.equal(s.combat.bonus(xbow,rider),1);
  assert.equal(knight.armor,30);assert.equal(halb.armor,30);
  const rate=u=>{const hp=knight.currentHP=knight.maxHP;s.combat.attacks.set(u,knight);s.combat.update(1000);s.combat.attacks.delete(u);return hp-knight.currentHP;};
  assert.ok(Math.abs(rate(xbow)-xbow.attackDPS*(xbow.damageFactor??1)*.85)<1e-6,'armour 30 counts as 15 against a bolt');assert.ok(Math.abs(rate(bow)-bow.attackDPS*(bow.damageFactor??1)*.7)<1e-6);
  // The charge: after a ride of `run` tiles the first blow lands at once; standing next to the next enemy gives none.
  for(const u of [xbow,bow,halb])s.workerSystem.removeWorker?.(u)??(u.isAlive=false);knight.currentHP=knight.maxHP;
  const blows=[],charge=s.military.charge.bind(s.military);s.military.charge=(w,t)=>{const d=charge(w,t);blows.push(d);return d;};
  s.military.orderAttack([rider],knight);until(s,()=>blows.length>0,40000);assert.ok(Math.abs(blows[0]-UNIT_TYPES.light_cavalry.charge.damage*.7)<1e-6,`a charge of ${blows[0]}`);
  const [next]=units(s,'enemy_soldier',{x:rider.tile.x+1,y:rider.tile.y},1);assert.equal(charge(rider,next),0,'no charge without a ride');
  rider.chargeFrom={x:rider.position.x-6,y:rider.position.y};assert.ok(charge(rider,next)>0,'a new ride gives a new charge');assert.equal(charge(halb,next),0,'only riders charge');
});

const armyScene=async()=>{const { EnemyArmy } = await import('../src/systems/EnemyArmy.js');const { EnemyGates } = await import('../src/systems/EnemyGates.js');const s=scene();s.character.away=true;s.enemyArmy=new EnemyArmy(s);s.enemyGates=new EnemyGates(s);return s;};
const ourWall=(s,type,x,y)=>{const d=s.objectRegistry.require(type),tiles=[];for(let j=0;j<d.height;j++)for(let i=0;i<d.width;i++)tiles.push({x:x+i,y:y+j});const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x,y,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=d.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(d,b));return b;};

test('point 2: the enemy army marches on the Castle, fights whom it meets there and attacks the buildings around it; the Castle holds',async()=>{
  const { ENEMY_ARMY } = await import('../src/systems/EnemyArmy.js');const { buildingHP } = await import('../src/game/buildingHealth.js');
  const s=await armyScene(),castle=build(s,'castle',30,48),house=build(s,'house',38,49),enemies=units(s,'enemy_swordsman',{x:75,y:50},5);
  assert.equal(s.enemyArmy.march(),5);assert.ok(enemies.every(e=>e.marching));
  until(s,()=>enemies.some(e=>Math.hypot(e.tile.x-castle.x,e.tile.y-castle.y)<10),60000);
  until(s,()=>buildingHP(house).hp<buildingHP(house).max||buildingHP(castle).hp<buildingHP(castle).max,60000);
  for(let i=0;i<3000;i++)s.tick(50);const c=buildingHP(castle);assert.ok(c.hp>=c.max*ENEMY_ARMY.castleFloor-1e-6,'the Castle holds');
  // Our soldiers coming out are fought, not ignored.
  const [guard]=units(s,'knight',{x:34,y:52},1);until(s,()=>enemies.some(e=>e.isAlive&&e.retaliationTarget===guard)||!guard.isAlive,30000);
});

test('point 2: our walls in the way are broken through; our Gate shuts while the enemy is near and opens again after',async()=>{
  const { buildingHP } = await import('../src/game/buildingHealth.js');
  const s=await armyScene();build(s,'castle',30,48);const walls=[];for(let y=0;y<s.map.length;y++)if(y!==50&&y!==51)walls.push(ourWall(s,'wall',45,y));const gate=ourWall(s,'gate',44,50);
  // the wall line is closed except for the Gate (a 2-wide gap at x=44..45, y=50..51)
  const open=()=>gate.tiles.every(p=>s.map[p.y][p.x]===0);s.tick(400);assert.ok(open(),'open with nobody about');
  const enemies=units(s,'enemy_soldier',{x:60,y:50},4);s.enemyArmy.march();
  until(s,()=>!open(),40000);assert.equal(findPathToAny(s.map,{x:60,y:50},[{x:35,y:50}]),null,'shut: no way in');
  until(s,()=>walls.some(w=>buildingHP(w)&&buildingHP(w).hp<buildingHP(w).max)||buildingHP(gate).hp<buildingHP(gate).max||!s.buildings.includes(gate),60000);
  for(const e of enemies)s.animalSystem.remove(e);for(let i=0;i<20;i++)s.tick(50);assert.ok(!s.buildings.includes(gate)||open(),'open again');
});

test('point 2: enemy archers put on an enemy wall stand on it and shoot; melee cannot reach them and break the wall, the archer falls',async()=>{
  const { spawnSandboxUnits } = await import('../src/game/sandboxMode.js');const { inAttackRange } = await import('../src/systems/CombatSystem.js');
  const s=await armyScene();for(let x=50;x<56;x++)markEnemyBuilding(s,ourWall(s,'wall',x,50));
  assert.equal(spawnSandboxUnits(s,'enemy_archer',{x:52,y:50},2),2);const archers=[...s.animalSystem.animals.values()].filter(a=>a.onWall);assert.equal(archers.length,2);
  for(const a of archers)assert.equal(a.tile.y,50);
  const [mark]=units(s,'archer',{x:52,y:57},1);mark.stance='hold';until(s,()=>mark.currentHP<mark.maxHP,10000);assert.ok(s.combat.attacks.get(archers[0])===mark||s.combat.attacks.get(archers[1])===mark,'they shoot from the wall (7 tiles: 2 tiles further from the height)');
  const [sword]=units(s,'swordsman',{x:52,y:52},1);const a0=archers[0];sword.position={x:a0.tile.x+.5,y:51.5};sword.tile={x:a0.tile.x,y:51};assert.equal(inAttackRange(sword,a0,s.map),false,'a blade does not reach up');
  s.military.orderAttack([sword,...units(s,'knight',{x:a0.tile.x,y:53},3)],a0);until(s,()=>!a0.onWall||!a0.isAlive,90000);assert.ok(!s.buildings.some(b=>b.tiles.some(p=>p.x===a0.tile.x&&p.y===50))||!a0.isAlive,'the wall under him fell');
});
