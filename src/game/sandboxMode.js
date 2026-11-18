import { t } from '../i18n/index.js';
import { DEFAULT_GAME_SETTINGS,gameSettings } from '../systems/GameSettings.js';
import { randomWorldCode } from '../data/worldCode.js';
import { placeBuilding,buildingDefinition } from './buildings.js';
import { replaceWalls } from './wallReplacement.js';
import { zoneWorldCode,populateFeature } from './zoneMode.js';
import { markEnemyBuilding,siegeable,canSiege } from '../systems/SiegeSystem.js';

// Owner 16 Nov 2026: the Test map (main menu, under the World Editor) – a sandbox to try battles and buildings.
// A fresh world with the Castle and nobody else; every building is free and stands finished at once; no fog, no night
// threats, no King on the map, nobody settles, nobody strikes or leaves; no saving (the autosave of the real game is left alone).
// The Test panel puts our soldiers, enemies and animals on the map with a click.
// Owner 17 Nov 2026: the land of the Test map – the home map with the Castle, or one of the lands the scouts find
// (a dense forest, iron or stone hills, a bandit camp, ruins, an abandoned mine, the inside of a mine).
export const SANDBOX_LANDS=Object.freeze(['home','forest','iron','stone','bandits','ruins','mine','dungeon']);
export function sandboxLand(id){if(!SANDBOX_LANDS.includes(id)||id==='home')return null;return id==='dungeon'?{id:'sandbox',type:'mine',dungeon:true}:{id:'sandbox',type:id,dungeon:false};}
export function sandboxSettings(landId='home'){
  const land=sandboxLand(landId),seed=randomWorldCode();
  return gameSettings({...DEFAULT_GAME_SETTINGS,worldCode:land?zoneWorldCode(seed,`sandbox-${Date.now()}`,land.type,{dungeon:land.dungeon}):seed,...(land?{mapSize:100}:{}),fogOfWar:false,nightWolves:false,nightThieves:false,nightFires:false,startingGarrison:false,startingCastle:!land});
}
export const SANDBOX_UNITS=Object.freeze([
  {group:'ours',id:'soldier',unit:'soldier'},{group:'ours',id:'archer',unit:'archer'},{group:'ours',id:'swordsman',unit:'swordsman'},{group:'ours',id:'knight',unit:'knight'},{group:'ours',id:'halberdier',unit:'halberdier'},{group:'ours',id:'royal_archer',unit:'royal_archer'},{group:'ours',id:'crossbowman',unit:'crossbowman'},{group:'ours',id:'light_cavalry',unit:'light_cavalry'},{group:'ours',id:'catapult',unit:'catapult'},{group:'ours',id:'military_wagon',unit:'military_wagon'},
  {group:'foes',id:'enemy_soldier'},{group:'foes',id:'enemy_archer'},{group:'foes',id:'enemy_swordsman'},{group:'foes',id:'enemy_knight'},{group:'foes',id:'raider'},{group:'foes',id:'bandit'},{group:'foes',id:'cave_rat'},{group:'foes',id:'wolf'},
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
  s.sandboxPanel=new SandboxPanel(s);
  s.events.once('shutdown',()=>{s.sandboxPanel?.destroy();s.sandboxPanel=null;document.body.classList.remove('in-sandbox');});
  s.setStatus?.(t('sandbox.started'));
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
export function spawnSandboxUnits(scene,unitId,center,count){
  const s=scene,spec=SANDBOX_UNITS.find(u=>u.id===unitId);if(!spec)return 0;const tiles=tilesAround(s,center,count);let n=0;
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
    tools.append(remove,clearFoes,clearOurs,clearAll,charge,torch);this.body.append(tools);
    this.hint=el('p','sandbox-hint',t('sandbox.hint'));this.body.append(this.hint);
    for(const e of ['pointerdown','mousedown','wheel'])root.addEventListener(e,ev=>ev.stopPropagation());
    document.body.append(root);this.render();
  }
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
