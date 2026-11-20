import { t } from '../i18n/index.js';
import { DEFAULT_GAME_SETTINGS,gameSettings } from '../systems/GameSettings.js';
import { randomWorldCode } from '../data/worldCode.js';
import { placeBuilding,buildingDefinition } from './buildings.js';
import { replaceWalls } from './wallReplacement.js';
import { zoneWorldCode,populateFeature } from './zoneMode.js';
import { markEnemyBuilding,siegeable,canSiege } from '../systems/SiegeSystem.js';
import { Conquest,showConquestEnd } from './conquest.js';
import { captureScenario,applyScenario,storedScenarios,storeScenario,forgetScenario,normalizeScenario,scenarioFileName,SCENARIO_GOALS } from './scenario.js';

// Owner 16 Nov 2026: the Test map (main menu, under the World Editor) – a sandbox to try battles and buildings.
// A fresh world with the Castle and nobody else; every building is free and stands finished at once; no fog, no night
// threats, no King on the map, nobody settles, nobody strikes or leaves; no saving (the autosave of the real game is left alone).
// The Test panel puts our soldiers, enemies and animals on the map with a click.
// Owner 17 Nov 2026: the land of the Test map – the home map with the Castle, or one of the lands the scouts find
// (a dense forest, iron or stone hills, a bandit camp, ruins, an abandoned mine, the inside of a mine).
export const SANDBOX_LANDS=Object.freeze(['home','forest','iron','stone','bandits','ruins','mine','dungeon']);
export function sandboxLand(id){if(!SANDBOX_LANDS.includes(id)||id==='home')return null;return id==='dungeon'?{id:'sandbox',type:'mine',dungeon:true}:{id:'sandbox',type:id,dungeon:false};}
// (86a) a template brings its own world code back, so the same world comes again.
export function sandboxSettings(landId='home',{worldCode=null}={}){
  const land=sandboxLand(landId),seed=randomWorldCode();
  return gameSettings({...DEFAULT_GAME_SETTINGS,worldCode:worldCode??(land?zoneWorldCode(seed,`sandbox-${Date.now()}`,land.type,{dungeon:land.dungeon}):seed),...(land?{mapSize:100}:{}),fogOfWar:false,nightWolves:false,nightThieves:false,nightFires:false,startingGarrison:false,startingCastle:!land});
}
export const SANDBOX_UNITS=Object.freeze([
  {group:'ours',id:'soldier',unit:'soldier'},{group:'ours',id:'archer',unit:'archer'},{group:'ours',id:'swordsman',unit:'swordsman'},{group:'ours',id:'knight',unit:'knight'},{group:'ours',id:'halberdier',unit:'halberdier'},{group:'ours',id:'royal_archer',unit:'royal_archer'},{group:'ours',id:'crossbowman',unit:'crossbowman'},{group:'ours',id:'light_cavalry',unit:'light_cavalry'},{group:'ours',id:'catapult',unit:'catapult'},{group:'ours',id:'military_wagon',unit:'military_wagon'},
  {group:'foes',id:'enemy_soldier'},{group:'foes',id:'enemy_archer'},{group:'foes',id:'enemy_swordsman'},{group:'foes',id:'enemy_knight'},{group:'foes',id:'enemy_king'},{group:'foes',id:'raider'},{group:'foes',id:'bandit'},{group:'foes',id:'cave_rat'},{group:'foes',id:'wolf'},
  {group:'animals',id:'deer'},{group:'animals',id:'wild_boar'},{group:'animals',id:'rabbit'},{group:'animals',id:'horse'},
].map(u=>Object.freeze(u)));
export const SANDBOX_COUNTS=Object.freeze([1,5,10,25,50]);

export function setupSandbox(scene){
  const s=scene;s.fog?.setEnabled?.(false);s.inventory.canAfford=()=>true;
  // A scouts' land on the Test map has its camp, chests, guards or mine mouth too.
  if(s.sandboxLand)s.sandboxFeature=populateFeature(s,s.zoneFeature);
  if(s.sandboxLand){const f=s.zoneFeature,size=s.map.length,p=f?.entrance??f?.center??{x:Math.round(size/2),y:Math.round(size/2)};s.worldCamera?.lookAt?.(p);}
  // The King stays out of the test (hidden, out of every fight), so a test battle cannot end the game.
  const c=s.character;if(c){c.away=true;c.path=[];c.nextTile=null;s.player?.setVisible?.(false);}
  s.tutorial?.destroy?.();s.tutorial=null;if(s.gettingStarted){s.gettingStarted.show=()=>{};s.gettingStarted.update=()=>{};if(s.gettingStarted.dialog)s.gettingStarted.dialog.hidden=true;}
  // Units put down by the Test panel are not news: no "has joined" lines, no royal tasks.
  const feed=s.eventFeed;if(feed?.push){const push=feed.push.bind(feed);feed.push=(key,...rest)=>/^(arrived|royal|skill|death|died)/.test(String(key))?null:push(key,...rest);}
  document.body.classList.add('in-sandbox');
  // (86a) what the map started with stays out of a template; a template waiting to be loaded is put down now.
  s.sandboxLandId=s.sandboxLand?(s.sandboxLand.dungeon?'dungeon':s.sandboxLand.type):'home';s.sandboxStartIds=new Set(s.buildings.map(b=>b.id));
  const app=s.registry?.get?.('application'),pending=app?.pendingScenario;
  // (86b) the attacker of a Conquest has no Castle: the world is the template's (made with the Castle, so the same
  // trees and rocks come), and the Castle and the first store are taken away before the template is put down.
  if(app?.pendingConquest)removeStartBuildings(s);
  if(pending){app.pendingScenario=null;try{const r=applyScenario(s,pending);s.scenarioLoaded=r;}catch(e){console.error(e);}}
  // (86b) Conquest: the template's map without the Test panel, our supply wagons, the goal checked until the end.
  const conquest=app?.pendingConquest;if(conquest){app.pendingConquest=null;document.body.classList.add('in-conquest');s.conquest=new Conquest(s,conquest);s.conquest.start();
    s.onConquestOver=over=>showConquestEnd(document,over,{again:()=>app.startConquest(conquest.template,conquest.supplies),menu:()=>app.returnToMain()});
    s.events.once('shutdown',()=>{document.body.classList.remove('in-sandbox','in-conquest');document.querySelector('#conquest-end')?.close?.();});s.setStatus?.(t(`conquest.goalText.${s.conquest.goal}`));return;}
  s.sandboxPanel=new SandboxPanel(s);
  s.events.once('shutdown',()=>{s.sandboxPanel?.destroy();s.sandboxPanel=null;document.body.classList.remove('in-sandbox');});
  s.setStatus?.(t('sandbox.started'));
}
export function removeStartBuildings(scene){
  const s=scene;let n=0;for(const b of [...s.buildings]){if(!s.sandboxStartIds?.has(b.id))continue;
    for(const [id,l] of [...(s.foodStorage?.locations??new Map())])if(l.buildingId===b.id)s.foodStorage.locations.delete(id);
    s.buildings.splice(s.buildings.indexOf(b),1);for(const tile of b.tiles??[])s.map[tile.y][tile.x]=s.terrainGrid?.[tile.y]?.[tile.x]??0;
    s.towerViews?.get(b.id)?.destroy();s.towerViews?.delete(b.id);s.terrain?.invalidateArea?.(b.tiles??[]);n++;}
  s.sandboxStartIds=new Set();s.events?.emit?.('buildings:changed');return n;
}
// Placing a building on the Test map: free, finished at once. Returns true when it handled the click.
export function placeSandboxBuilding(scene,goal,fields,pointer){
  const s=scene,definition=s.selectedBuilding,free={pay:()=>true,canAfford:()=>true,storage:null};
  const result=placeBuilding({map:s.map,anchor:goal,resources:s.resourceOccupancy,reservedTiles:s.placementReserved(),inventory:free,buildings:s.buildings,definition,reserveMaterials:false,provisional:false,fields,replaceWalls:(walls,building)=>replaceWalls(s,walls,building)});
  if(result.error){s.previewKey=null;s.updateBuildingPreview();s.setStatus(result.error);return true;}
  const b=result.building;s.dropSystem?.clearSite?.(b);s.towerViews.set(b.id,s.createBuildingView(buildingDefinition(b),b));
  sandboxBuilt(s,b);
  s.refreshWallConnections?.();s.events?.emit('buildings:changed');s.updateInventory?.();
  const message=t(b.enemy?'sandbox.builtEnemy':'sandbox.built',{name:definition.name});
  if(definition.repeatPlacement||pointer?.event?.shiftKey){s.previewKey=null;s.updateBuildingPreview();s.updateBuildingUI?.();s.setStatus(message);}else s.cancelBuilding(message);
  return true;
}
// Owner 18 Nov 2026: the Test panel switches whom the buildings belong to – ours, or the enemy's (steel blue, closed
// Gates, broken by our melee soldiers).
export function sandboxBuilt(scene,building){if(scene.sandboxSide==='enemy')markEnemyBuilding(scene,building);}
// Free tiles around a point for `count` units (nearest first).
export function tilesAround(scene,center,count){
  const map=scene.map,out=[],taken=new Set(scene.workerSystem.liveWorkers().map(w=>`${w.tile.x},${w.tile.y}`));for(const a of scene.animalSystem.animals.values())taken.add(`${a.tile.x},${a.tile.y}`);
  for(let r=0;r<40&&out.length<count;r++)for(let y=center.y-r;y<=center.y+r&&out.length<count;y++)for(let x=center.x-r;x<=center.x+r&&out.length<count;x++)
    if(Math.max(Math.abs(x-center.x),Math.abs(y-center.y))===r&&map[y]?.[x]===0&&!scene.resourceOccupancy?.has(`${x},${y}`)&&!taken.has(`${x},${y}`)){out.push({x,y});taken.add(`${x},${y}`);}
  return out;
}
// Battle test, point 2: enemy archers put on an enemy wall, Tower or Gate stand up on it (nearest free places first).
const FORT=['wall','tower','gate','wall_gate'];
function wallPlaces(scene,center,count){
  const s=scene,at=s.buildings.find(b=>b.enemy&&FORT.includes(b.type)&&b.tiles?.some(p=>p.x===center.x&&p.y===center.y));if(!at)return null;
  const taken=new Set([...s.animalSystem.animals.values()].filter(a=>a.onWall&&a.isAlive).map(a=>`${a.tile.x},${a.tile.y}`)),out=[];
  for(const b of s.buildings)if(b.enemy&&FORT.includes(b.type))for(const p of b.tiles??[])if(!taken.has(`${p.x},${p.y}`))out.push({b,p});
  return out.sort((a,z)=>Math.hypot(a.p.x-center.x,a.p.y-center.y)-Math.hypot(z.p.x-center.x,z.p.y-center.y)).slice(0,count);
}
export function spawnSandboxUnits(scene,unitId,center,count){
  const s=scene,spec=SANDBOX_UNITS.find(u=>u.id===unitId);if(!spec)return 0;
  {const d=!spec.unit&&s.objectRegistry.get(spec.id),places=d&&(d.stats?.attackRange??1)>2&&d.gameplay?.hostile&&s.enemyArmy?wallPlaces(s,center,count):null;
    if(places){let n=0;for(const {b,p} of places){const ground=tilesAround(s,p,1)[0];if(!ground)break;const a=s.animalSystem.create(d,ground);a.sandbox=true;if(s.enemyArmy.mount(a,b,p))n++;}return n;}}
  const tiles=tilesAround(s,center,count);let n=0;
  for(const tile of tiles){
    if(spec.unit){const w=s.workerSystem.create(tile);if(s.military.enlist(w,spec.unit,{withoutHorse:true})){w.sandbox=true;s.military.engines?.sandboxCrew?.(w,spec.unit);n++;}else{w.isAlive=false;s.workerSystem.onDeath(w);}}
    else{const d=s.objectRegistry.get(spec.id);if(!d)break;const a=s.animalSystem.create(d,tile);a.sandbox=true;n++;}
  }
  s.workerSystem.updateUI?.();return n;
}
export function removeSandboxUnit(scene,unit){
  const s=scene;if(!unit)return false;s.combat?.stopAttack?.(unit);
  if(s.animalSystem.animals.has(unit.id)){s.animalSystem.remove(unit);s.combatFeedback?.remove?.(unit.id);return true;}
  if(s.workerSystem.workers.has(unit.id)&&unit.isAlive){const engine=s.military?.engines?.vehicleOf?.(unit);if(engine){s.vehicles.vehicles.delete(engine.id);s.vehicles.changed();}unit.isAlive=false;unit.currentHP=0;s.workerSystem.onDeath(unit);s.needs?.records?.delete?.(unit.id);s.combatFeedback?.remove?.(unit.id);s.workerSystem.updateUI?.();return true;}
  return false;
}
export function clearSandboxUnits(scene,group='all'){
  const s=scene;let n=0;
  if(group==='all'||group==='ours')for(const w of [...s.workerSystem.workers.values()])if(w.isAlive&&w.profession==='soldier'&&removeSandboxUnit(s,w))n++;
  if(group==='all'||group==='foes'||group==='animals')for(const a of [...s.animalSystem.animals.values()]){const foe=a.type==='wolf'||!!a.definition?.gameplay?.hostile;if(group==='all'||(group==='foes')===foe){if(removeSandboxUnit(s,a))n++;}}
  return n;
}
// The Test panel (left side): what to put down, how many, and tools.
class SandboxPanel {
  constructor(scene){
    this.scene=scene;this.tool=null;this.count=5;const doc=document,el=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
    const root=this.root=el('aside','sandbox-panel');root.id='sandbox-panel';root.setAttribute('aria-label',t('sandbox.title'));
    const head=el('div','sandbox-head');head.append(el('h2','',t('sandbox.title')));this.toggle=el('button','sandbox-fold','▾');this.toggle.type='button';this.toggle.addEventListener('click',()=>{root.classList.toggle('folded');});head.append(this.toggle);root.append(head);
    this.body=el('div','sandbox-body');root.append(this.body);
    this.buttons=new Map();
    for(const group of ['ours','foes','animals']){
      this.body.append(el('h3','',t(`sandbox.group.${group}`)));const row=el('div','sandbox-row');
      for(const u of SANDBOX_UNITS.filter(u=>u.group===group)){const b=el('button',`sandbox-unit sandbox-${group}`,this.unitName(u));b.type='button';b.dataset.sandboxUnit=u.id;b.addEventListener('click',()=>this.pick(u.id));row.append(b);this.buttons.set(u.id,b);}
      this.body.append(row);
    }
    // Owner 18 Nov 2026: build for us or for the enemy.
    const side=el('div','sandbox-row sandbox-side');side.append(el('span','',t('sandbox.side')));
    for(const id of ['ours','enemy']){const b=el('button',`sandbox-side-${id}`,t(`sandbox.side.${id}`));b.type='button';b.dataset.sandboxSide=id;b.addEventListener('click',()=>{this.scene.sandboxSide=id;this.render();this.say(t(`sandbox.sideHint.${id}`));});side.append(b);}
    this.body.append(el('h3','',t('sandbox.group.build')),side);
    const counts=el('div','sandbox-row sandbox-counts');counts.append(el('span','',t('sandbox.count')));
    for(const n of SANDBOX_COUNTS){const b=el('button','sandbox-count',String(n));b.type='button';b.dataset.sandboxCount=String(n);b.addEventListener('click',()=>{this.count=n;this.render();});counts.append(b);}
    this.body.append(counts);
    const tools=el('div','sandbox-row');
    const remove=el('button','sandbox-remove',t('sandbox.remove'));remove.type='button';remove.dataset.sandboxUnit='remove';remove.addEventListener('click',()=>this.pick('remove'));this.buttons.set('remove',remove);
    const clearFoes=el('button','',t('sandbox.clearFoes'));clearFoes.type='button';clearFoes.addEventListener('click',()=>this.say(t('sandbox.cleared',{count:clearSandboxUnits(this.scene,'foes')})));
    const clearOurs=el('button','',t('sandbox.clearOurs'));clearOurs.type='button';clearOurs.addEventListener('click',()=>this.say(t('sandbox.cleared',{count:clearSandboxUnits(this.scene,'ours')})));
    // Point 68: a torch for the chosen soldiers (free on the Test map; it shows its light at night and in the mine).
    const torch=el('button','sandbox-torch',t('sandbox.torch'));torch.type='button';torch.addEventListener('click',()=>{const n=this.scene.lightFuel?.giveFree(this.scene.unitSelection?.workers?.()??[])??0;this.say(n?t('sandbox.torchGiven',{count:n}):t('sandbox.torchNone'));});
    const clearAll=el('button','',t('sandbox.clearAll'));clearAll.type='button';clearAll.addEventListener('click',()=>this.say(t('sandbox.cleared',{count:clearSandboxUnits(this.scene,'all')})));
    const charge=el('button','sandbox-charge',t('sandbox.charge'));charge.type='button';charge.addEventListener('click',()=>this.charge());
    // Battle test, point 2: the enemy army marches on the Castle.
    const attack=el('button','sandbox-enemy-attack',t('sandbox.enemyAttack'));attack.type='button';attack.addEventListener('click',()=>{const n=this.scene.enemyArmy?.march()??0;this.say(n?t('army.attacking',{count:n}):t('sandbox.noArmy'));});
    tools.append(remove,clearFoes,clearOurs,clearAll,charge,attack,torch);this.body.append(tools);
    this.body.append(this.templateSection(el));
    this.hint=el('p','sandbox-hint',t('sandbox.hint'));this.body.append(this.hint);
    for(const e of ['pointerdown','mousedown','wheel'])root.addEventListener(e,ev=>ev.stopPropagation());
    document.body.append(root);this.render();
  }
  // Owner 20 Nov 2026 (86a): save what stands on the map as a template, load one, export and import files.
  templateSection(el){
    const box=el('div','sandbox-template');box.append(el('h3','',t('scenario.title')));
    const name=this.templateName=el('input','sandbox-template-name');name.type='text';name.maxLength=60;name.placeholder=t('scenario.namePlaceholder');name.value=this.scene.scenario?.name??'';
    const goal=this.templateGoal=el('select','sandbox-template-goal');for(const id of SCENARIO_GOALS){const o=el('option','',t(`scenario.goal.${id}`));o.value=id;goal.append(o);}goal.value=this.scene.scenario?.goal.type??'king';
    const days=this.templateDays=el('input','sandbox-template-days');days.type='number';days.min='1';days.max='30';days.value=String(this.scene.scenario?.goal.days??3);days.title=t('scenario.days');
    const showDays=()=>{days.hidden=goal.value!=='hold';};goal.addEventListener('change',showDays);showDays();
    const row1=el('div','sandbox-row');row1.append(name);const row2=el('div','sandbox-row');row2.append(el('span','',t('scenario.goal')),goal,days);
    const save=el('button','sandbox-template-save',t('scenario.save'));save.type='button';save.addEventListener('click',()=>this.saveTemplate());
    const exp=el('button','sandbox-template-export',t('scenario.export'));exp.type='button';exp.addEventListener('click',()=>this.exportTemplate());
    const imp=el('button','sandbox-template-import',t('scenario.import'));imp.type='button';const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
    imp.addEventListener('click',()=>file.click());file.addEventListener('change',()=>this.importTemplate(file));
    const row3=el('div','sandbox-row');row3.append(save,exp,imp,file);
    const list=this.templateList=el('select','sandbox-template-list');const load=el('button','sandbox-template-load',t('scenario.load'));load.type='button';load.addEventListener('click',()=>this.loadTemplate());
    const del=el('button','sandbox-template-delete',t('scenario.delete'));del.type='button';del.addEventListener('click',()=>{if(!list.value)return;forgetScenario(list.value);this.fillTemplates();this.say(t('scenario.deleted'));});
    const row4=el('div','sandbox-row');row4.append(list,load,del);box.append(row1,row2,row3,row4);this.fillTemplates();
    if(this.scene.scenarioLoaded){const r=this.scene.scenarioLoaded;setTimeout(()=>this.say(t('scenario.loaded',{name:this.scene.scenario?.name??'',built:r.built,units:r.units,skipped:r.skipped})),0);}
    return box;
  }
  fillTemplates(){const list=this.templateList;list.replaceChildren();const all=storedScenarios();if(!all.length){const o=document.createElement('option');o.value='';o.textContent=t('scenario.none');list.append(o);}
    for(const d of all){const o=document.createElement('option');o.value=d.id;o.textContent=d.name;list.append(o);}}
  current(){return captureScenario(this.scene,{name:this.templateName.value.trim()||t('scenario.untitled'),goal:this.templateGoal.value,holdDays:Math.max(1,Math.min(30,Math.round(Number(this.templateDays.value)||3)))});}
  saveTemplate(){try{const keep=this.scene.scenario,data=this.current();if(keep&&keep.name===data.name)data.id=keep.id;const saved=storeScenario(data);this.scene.scenario=saved;this.fillTemplates();this.templateList.value=saved.id;this.say(t('scenario.saved',{name:saved.name,buildings:saved.buildings.length,units:saved.units.length}));}catch(e){this.say(t('scenario.error',{message:e.message}));}}
  exportTemplate(){try{const data=this.current(),blob=new Blob([JSON.stringify(data,null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=scenarioFileName(data);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);this.say(t('scenario.exported',{file:a.download}));}catch(e){this.say(t('scenario.error',{message:e.message}));}}
  async importTemplate(input){const f=input.files?.[0];input.value='';if(!f)return;try{const saved=storeScenario(normalizeScenario(JSON.parse(await f.text())));this.fillTemplates();this.templateList.value=saved.id;this.say(t('scenario.imported',{name:saved.name}));}catch(e){this.say(t('scenario.error',{message:e.message}));}}
  loadTemplate(){const d=storedScenarios().find(x=>x.id===this.templateList.value);if(!d)return;const app=this.scene.registry?.get?.('application');if(!app?.startScenarioMap)return;app.startScenarioMap(d);}
  unitName(u){return u.unit?t(`unit.type.${u.unit}`):this.scene.objectRegistry.get(u.id)?.name??u.id;}
  pick(id){this.tool=this.tool===id?null:id;this.render();this.say(this.tool?t(this.tool==='remove'?'sandbox.removeHint':'sandbox.placeHint',{count:this.count}):t('sandbox.hint'));}
  say(text){this.hint.textContent=text;}
  render(){for(const [id,b] of this.buttons)b.classList.toggle('on',this.tool===id);for(const b of this.root.querySelectorAll('[data-sandbox-count]'))b.classList.toggle('on',Number(b.dataset.sandboxCount)===this.count);for(const b of this.root.querySelectorAll('[data-sandbox-side]'))b.classList.toggle('on',(this.scene.sandboxSide??'ours')===b.dataset.sandboxSide);document.body.classList.toggle('sandbox-enemy-side',this.scene.sandboxSide==='enemy');document.body.classList.toggle('sandbox-tool',!!this.tool);}
  // A left click on the map with a tool chosen puts units there (or removes one). Right click or Esc drops the tool.
  down(pointer){
    if(!this.tool)return false;const s=this.scene;
    if(pointer.rightButtonDown()){this.tool=null;this.render();this.say(t('sandbox.hint'));return true;}
    if(!pointer.leftButtonDown()||s.buildMode)return false;
    pointer.updateWorldPoint(s.cameras.main);const tile=s.pointerTile(pointer);if(!tile)return true;
    if(this.tool==='remove'){const a=s.animalSystem.atPoint(pointer.worldX,pointer.worldY),hit=a?null:s.pickInteraction(pointer.worldX,pointer.worldY,tile);const unit=a??(hit?.kind==='human'?hit.object:null);this.say(removeSandboxUnit(s,unit)?t('sandbox.removed'):t('sandbox.nothing'));return true;}
    const n=spawnSandboxUnits(s,this.tool,tile,this.count);this.say(t('sandbox.placed',{count:n}));return true;
  }
  // Our soldiers attack the nearest enemy group (a quick way to start a test fight).
  charge(){
    const s=this.scene,ours=s.workerSystem.liveWorkers().filter(w=>w.profession==='soldier'&&!w.away),foes=[...s.animalSystem.animals.values()].filter(a=>a.isAlive&&(a.type==='wolf'||a.definition?.gameplay?.hostile));
    // …and with no enemy soldiers left, the melee go at the nearest enemy building.
    if(ours.length&&!foes.length){const melee=ours.filter(canSiege),mid=melee.length&&{x:melee.reduce((n,w)=>n+w.position.x,0)/melee.length,y:melee.reduce((n,w)=>n+w.position.y,0)/melee.length},near=mid&&s.buildings.filter(siegeable).sort((a,b)=>Math.hypot(a.x-mid.x,a.y-mid.y)-Math.hypot(b.x-mid.x,b.y-mid.y))[0];
      if(near){const n=s.military.siege.order(melee,near);this.say(t('siege.order',{count:n,name:buildingDefinition(near).name}));return;}}
    if(!ours.length||!foes.length){this.say(t('sandbox.noFight'));return;}
    const mid={x:ours.reduce((n,w)=>n+w.position.x,0)/ours.length,y:ours.reduce((n,w)=>n+w.position.y,0)/ours.length},near=foes.sort((a,b)=>Math.hypot(a.position.x-mid.x,a.position.y-mid.y)-Math.hypot(b.position.x-mid.x,b.position.y-mid.y))[0];
    for(const w of ours){s.workerSystem.commands.resume(w);s.military?.wallPatrol?.set(w,false);}s.military.orderAttack(ours,near);this.say(t('sandbox.charging',{count:ours.length}));
  }
  destroy(){this.root.remove();document.body.classList.remove('sandbox-tool','sandbox-enemy-side');}
}
