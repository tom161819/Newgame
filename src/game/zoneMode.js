import { createBanditCamp } from './BanditCamp.js';
import { t } from '../i18n/index.js';
import { SCOUTING,zoneById,zoneEdge,scoutTypeById } from '../data/scouting.js';
import { encodeWorldCode,defaultWorldLevels,WORLD_SETTINGS,WORLD_SEED_MAX } from '../data/worldCode.js';
import { tileCenter } from './isometric.js';
const tileKey=t=>`${t.x},${t.y}`;

// Owner 16 Nov 2026 (m-mapa-kraje, step 2–3): playing a scouted zone with the party. The game holds one map at a time
// (the map size is global), so switching swaps maps: the home game is saved in memory (the same state as a save), the
// zone starts as its own game – no Castle, no residents, only the party (the same ids, names, health, experience and
// equipment) – and going back loads home again with the party on its way back. While you are in the zone, home waits
// (its time stands still). The zone world comes from the home world code and the zone, so the same zone always looks
// the same. Saving in the zone saves home. An abandoned mine has a second map, its inside (a dungeon): entering it and
// coming out swap maps the same way; the party (z.records), its loot and the zone's clock go along.
const hash=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
const level=key=>WORLD_SETTINGS.findIndex(s=>s.key===key);
// What the land is like, by what the party found there.
export const ZONE_LOOK=Object.freeze({
  forest:Object.freeze({levels:{forest:9,rocks:3,bushes:7,rivers:0,lakes:1},trees:4,clusters:5,deposits:{stone_deposit:.5,iron_deposit:.5}}),
  iron:Object.freeze({levels:{forest:3,rocks:8,rivers:0,lakes:0},trees:.6,deposits:{stone_deposit:1,iron_deposit:4}}),
  stone:Object.freeze({levels:{forest:3,rocks:9,rivers:0,lakes:0},trees:.6,deposits:{stone_deposit:4,iron_deposit:.5}}),
  bandits:Object.freeze({levels:{forest:6,rocks:4,rivers:0,lakes:1},trees:1.5,deposits:{stone_deposit:.5,iron_deposit:.5}}),
  ruins:Object.freeze({levels:{forest:5,rocks:5,rivers:0,lakes:0},trees:1,deposits:{stone_deposit:1,iron_deposit:.5}}),
  mine:Object.freeze({levels:{forest:4,rocks:8,rivers:0,lakes:0},trees:.8,deposits:{stone_deposit:1.5,iron_deposit:1.5}}),
  dungeon:Object.freeze({levels:{forest:0,rocks:0,bushes:0,rivers:0,lakes:0,desert:0},trees:0,deposits:{stone_deposit:1,iron_deposit:3}}),
});
export const zoneLook=zone=>ZONE_LOOK[zone?.dungeon?'dungeon':zone?.type]??null;
export function zoneWorldCode(homeCode,zoneId,type,{dungeon=false}={}){
  const levels=defaultWorldLevels();for(const [key,value] of Object.entries(ZONE_LOOK[dungeon?'dungeon':type]?.levels??{}))levels[level(key)]=value;
  return encodeWorldCode({levels,seed:hash(`${homeCode??''}|zone-map|${zoneId}${dungeon?'|mine':''}`)%(WORLD_SEED_MAX+1)});
}
// The party as it goes from map to map: soldiers by id (from the home state at first, then from the last map).
function homeRecords(home,ids){
  const workers=new Map((home.workers??[]).map(w=>[w.id,w])),units=new Map((home.military?.units??[]).map(u=>[u.workerId,u])),out={};
  for(const id of ids){const r=workers.get(id),u=units.get(id);if(!r)continue;out[id]={name:r.name,identity:r.identity??null,type:u?.type??'militia',equipment:u?.equipment?{...u.equipment}:null,currentHP:r.currentHP,maxHP:r.maxHP,experience:r.experience?structuredClone(r.experience):null,stance:r.stance??null};}
  return out;
}
function zoneSettings(home,zone,{dungeon=false}={}){
  return {...home.gameSettings,worldCode:zoneWorldCode(home.gameSettings?.worldCode,zone.id,zone.type,{dungeon}),mapSize:100,startingGold:0,startingGarrison:false,
    ...(dungeon?{nightWolves:false,nightThieves:false,nightFires:false}:{})};
}
// What a zone game starts from: the home state, the zone and the party.
export function zoneStart(home){
  const party=home?.scouting?.party,found=party&&home.scouting.zones?.[party.zone];
  if(!party||party.phase!=='there'||!found)return null;
  const zone={home,id:party.zone,type:found.type,ids:[...party.ids],records:homeRecords(home,party.ids),fallen:[],king:!!party.king,kingHP:party.king?home.player?.currentHP??null:null,
    wagon:!!party.wagonId,cargo:structuredClone(party.cargo??{}),pets:[],strayRolled:false,loot:{gold:0},taken:[...(found.taken??[])],cleared:!!found.cleared,time:null,seasons:null,dungeon:false,from:null};
  return {settings:zoneSettings(home,zone),zone};
}
// The party leaves this map: health, experience and the fallen go into the records; gold picked up goes into the loot.
export function collectParty(scene){
  const z=scene.zone;
  for(const w of z.soldiers){const r=z.records[w.id];if(!r)continue;if(!w.isAlive){delete z.records[w.id];if(!z.fallen.includes(w.id))z.fallen.push(w.id);continue;}
    r.currentHP=Math.max(1,Math.round(w.currentHP));r.maxHP=w.maxHP;if(w.experience)r.experience=structuredClone(w.experience);r.stance=w.stance??null;}
  if(z.king&&Number.isFinite(scene.character?.currentHP))z.kingHP=Math.max(1,Math.round(scene.character.currentHP));
  const gold=Math.floor(scene.inventory?.count?.('gold')??0);if(gold>0)z.loot.gold+=gold;
  if(z.feature?.kind==='bandits'&&z.guards?.length&&z.guards.every(a=>!a.isAlive))z.cleared=true;
  // Point 67: pets taken in go on with the party.
  if(scene.domestic)z.pets=scene.domestic.partyPets().slice(0,4);
  z.time=scene.gameTime.exportState();z.seasons=scene.seasons?.exportState?.()??null;
  return z;
}
// The next map of the same trip (into the mine or back out of it).
export function nextMap(scene,{dungeon}){
  const z=collectParty(scene),next={...z,dungeon,from:dungeon?'outside':'mine',soldiers:undefined,banner:undefined,feature:undefined,guards:undefined,chests:undefined,leaving:false};
  return {settings:zoneSettings(z.home,next,{dungeon}),zone:next};
}
// The edge facing home, or the mine (its entrance outside, the way in inside).
function arrival(scene,z,map){
  const f=scene.zoneFeature;
  if(z.dungeon&&f?.entrance)return {...f.entrance};
  if(!z.dungeon&&z.from==='mine'&&f?.outside)return {...f.outside};
  const zone=zoneById(z.id),edge=zoneEdge({dx:-zone.dx,dy:-zone.dy},map[0].length,map.length),inset=5;
  return {x:Math.min(map[0].length-1-inset,Math.max(inset,edge.x)),y:Math.min(map.length-1-inset,Math.max(inset,edge.y))};
}
// Called at the end of GameScene.create for a zone game.
export function setupZone(scene){
  const z=scene.zone,home=z.home,ws=scene.workerSystem,map=scene.map;
  if(z.seasons)scene.seasons?.importState?.(z.seasons);else scene.seasons?.importState?.(home.seasons);
  const back=arrival(scene,z,map),free=[],count=Object.keys(z.records).length+3;
  for(let r=0;r<=14&&free.length<count*3;r++)for(let y=back.y-r;y<=back.y+r;y++)for(let x=back.x-r;x<=back.x+r;x++)if(Math.max(Math.abs(x-back.x),Math.abs(y-back.y))===r&&map[y]?.[x]===0&&!scene.resourceOccupancy?.has(tileKey({x,y})))free.push({x,y});
  z.soldiers=[];
  for(const [i,[id,r]] of Object.entries(z.records).entries()){
    const tile=free[i]??free[0]??back,w=ws.create(tile,{id,name:r.name,identity:r.identity??null,randomize:false});
    if(!scene.military.enlist(w,r.type??'militia')){w.destroy?.();continue;}
    // The unit stays a garrison soldier (no Barracks here), or MilitarySystem would dismiss him to Unemployed.
    const unit=scene.military.units.get(id);if(unit){unit.garrison=true;if(r.equipment){unit.equipment={...r.equipment};scene.military.apply?.(w);}}
    if(Number.isFinite(r.maxHP))w.maxHP=r.maxHP;if(Number.isFinite(r.currentHP))w.currentHP=Math.min(w.maxHP,Math.max(1,r.currentHP));
    if(r.experience)w.experience=structuredClone(r.experience);if(r.stance)w.stance=r.stance;
    z.soldiers.push(w);
  }
  ws.updateUI?.();
  // Owner 16 Nov 2026: the King is here only when he went with the party; otherwise he is not on this map at all.
  const c=scene.character,n=z.soldiers.length;
  if(z.king){const k=free[n]??back;c.tile={...k};c.position={x:k.x+.5,y:k.y+.5};c.nextTile=null;c.path=[];c.away=false;if(Number.isFinite(z.kingHP))c.currentHP=Math.min(c.maxHP,Math.max(1,z.kingHP));const p=tileCenter(k);scene.player?.setPosition?.(p.x,p.y);scene.worldCamera?.follow?.();}
  else{c.away=true;c.path=[];c.nextTile=null;scene.player?.setVisible?.(false);scene.worldCamera?.lookAt?.(z.soldiers[0]?.tile??back);}
  // Point 67: the party's pets come along; outside, now and then a stray cat or dog lives in the land (60 %).
  for(const [i,pet] of (z.pets??[]).entries())scene.domestic?.addPartyPet(pet,free[n+2+i]??back);
  if(!z.dungeon&&!z.strayRolled&&scene.domestic){z.strayRolled=true;if(Math.random()<.6){const kind=Math.random()<.5?'cat':'dog',spot=free.filter(t=>Math.hypot(t.x-back.x,t.y-back.y)>=8).at(-1)??free.at(-1);
    if(spot){const d=scene.domestic,now=d.now(),fields={x:spot.x+.5,y:spot.y+.5,home:{x:spot.x+.5,y:spot.y+.5},state:'stray',leaveAt:now+3*d.day};const a=kind==='dog'?d.newDog(fields):d.newCat(fields);
      d.feed(`pet:land:${a.id}`,t(kind==='dog'?'pets.dog.feed.landStray':'pets.feed.landStray',{name:a.name}),false,()=>(kind==='dog'?d.dogs:d.cats).get(a.id)??a);}}}
  // The Horse Wagon with its load stands by the party outside (it does not go into the mine).
  if(z.wagon&&!z.dungeon){const g=free.find((t,i)=>i>n&&scene.vehicles?.free(t))??back;z.wagonVehicle=scene.vehicles?.create('horse_wagon',g)??null;}
  // No wolves wait at the spot where the party comes in.
  for(const a of [...(scene.animalSystem?.animals.values()??[])])if(a.type==='wolf'&&Math.hypot(a.tile.x-back.x,a.tile.y-back.y)<30)scene.animalSystem.remove(a);
  populateZone(scene);
  // Home-only guides are not shown here.
  scene.tutorial?.destroy?.();scene.tutorial=null;if(scene.gettingStarted){scene.gettingStarted.show=()=>{};scene.gettingStarted.update=()=>{};if(scene.gettingStarted.dialog)scene.gettingStarted.dialog.hidden=true;}
  scene.scouting.zones=structuredClone(home.scouting.zones);scene.scouting.party=structuredClone(home.scouting.party);
  document.body.classList.add('in-zone');
  const banner=document.createElement('div');banner.id='zone-banner';banner.className='zone-banner';
  const label=document.createElement('span'),actions=document.createElement('span');actions.className='zone-actions';
  const button=(id,text,fn)=>{const b=document.createElement('button');b.type='button';b.id=id;b.textContent=text;b.addEventListener('click',fn);return b;},app=()=>scene.game.registry.get('application');
  if(scene.zoneFeature?.kind==='mine'){z.enterButton=button('zone-enter',t('zone.enterMine'),()=>app()?.enterMine());z.enterButton.disabled=true;actions.append(z.enterButton);}
  if(z.dungeon)actions.append(button('zone-exit',t('zone.leaveMine'),()=>app()?.leaveMine()));
  actions.append(button('zone-home',t('zone.sendHome'),()=>app()?.leaveZone()));
  banner.append(label,actions);document.body.append(banner);z.banner=banner;z.label=label;refreshBanner(scene);
  scene.events.once('shutdown',()=>{banner.remove();document.body.classList.remove('in-zone');});
  scene.setStatus?.(t(z.dungeon?'zone.inMine':'zone.arrived'));
}
// Chests, bandits and rats where the land's feature put them (taken chests and a beaten camp stay so).
function populateZone(scene){
  const z=scene.zone,made=populateFeature(scene,scene.zoneFeature,{taken:z.taken,cleared:z.cleared});z.chests=made.chests;z.guards=made.guards;if(made.mouth)z.mouth=made.mouth;
}
// The chests, guards and the mine mouth of a shaped land (also the Test map's lands, owner 17 Nov 2026).
export function populateFeature(scene,f,{taken=[],cleared=false}={}){
  const out={chests:[],guards:[],mouth:null};if(!f)return out;
  for(const chest of f.chests??[]){if(taken.includes(chest.key))continue;const free=nearFree(scene,chest.tile);if(!free)continue;
    const made=scene.treasureSystem?.create(free,{id:`zone-${chest.key}`,contents:{gold:chest.gold,equipment:[]},opened:false,looted:false});if(made){made.zoneKey=chest.key;out.chests.push(made);}}
  const spawn=(type,tiles)=>{const d=scene.objectRegistry.get(type);if(!d)return;for(const tile of tiles){const at=nearFree(scene,tile);if(at)out.guards.push(scene.animalSystem.create(d,at));}};
  if(f.kind==='bandits'){out.camp=createBanditCamp(scene,f.camp);if(!cleared)spawn('bandit',f.guards);}
  if(f.kind==='dungeon')spawn('cave_rat',f.rats);
  if(f.kind==='mine'||f.kind==='dungeon'){const p=tileCenter(f.entrance),g=scene.add.graphics().setDepth(p.y-1);g.fillStyle(0x0d0b09,.85);g.fillEllipse(p.x,p.y-4,40,20);g.lineStyle(2,0x5b4a36,.9);g.strokeEllipse(p.x,p.y-4,40,20);out.mouth=g;}
  return out;
}
function nearFree(scene,tile){const map=scene.map;for(let r=0;r<=4;r++)for(let y=tile.y-r;y<=tile.y+r;y++)for(let x=tile.x-r;x<=tile.x+r;x++)if(Math.max(Math.abs(x-tile.x),Math.abs(y-tile.y))===r&&map[y]?.[x]===0&&!scene.resourceOccupancy?.has(tileKey({x,y}))&&![...(scene.animalSystem?.animals.values()??[])].some(a=>a.tile.x===x&&a.tile.y===y))return {x,y};return null;}
function refreshBanner(scene){
  const z=scene.zone;if(!z.label)return;const type=scoutTypeById(z.type),goods=Object.entries(z.cargo??{}).map(([id,n])=>`${n} ${scene.objectRegistry.get(id)?.name??id}`).join(', '),gold=z.loot.gold+Math.floor(scene.inventory?.count?.('gold')??0);
  z.label.textContent=t(z.dungeon?'zone.bannerMine':'zone.banner',{zone:t(`scouting.zone.${z.id}`),found:`${type?.icon??''} ${t(`scouting.type.${z.type}`)}`,count:z.soldiers.filter(w=>w.isAlive).length+(z.king?1:0)})
    +(z.wagon?` ${t('zone.wagon',{goods:goods||t('zone.wagonEmpty')})}`:'')+(gold>0?` ${t('zone.loot',{gold})}`:'');
}
const partyUnits=scene=>[...scene.zone.soldiers.filter(w=>w.isAlive),...(scene.zone.king&&scene.character?.isAlive?[scene.character]:[])];
// Checked every frame in a zone game: loot, the mine entrance, and the end when the whole party has fallen.
export function updateZone(scene){
  const z=scene.zone;if(!z||z.leaving)return;const units=partyUnits(scene);
  // A party member next to a chest takes what is in it (the gold goes home with the party).
  for(const chest of z.chests??[]){if(chest.looted)continue;if(units.some(u=>Math.max(Math.abs(u.tile.x-chest.x),Math.abs(u.tile.y-chest.y))<=1)){
    chest.looted=true;chest.opened=true;chest.view?.setOpened?.(true);z.loot.gold+=chest.contents.gold;if(!z.taken.includes(chest.zoneKey))z.taken.push(chest.zoneKey);
    scene.eventFeed?.push?.(`zone-chest:${chest.id}`,t('zone.chest',{gold:chest.contents.gold}),{important:true});refreshBanner(scene);}}
  if(chestTakenByKing(scene))refreshBanner(scene);
  // Owner 18 Nov 2026: a stray dog or cat near the party tries to join it (chance by the best Hunting level).
  scene.domestic?.partyStrays?.(units);
  if(z.guards?.length&&!z.clearedSaid&&z.guards.every(a=>!a.isAlive)){z.clearedSaid=true;if(scene.zoneFeature?.kind==='bandits'){z.cleared=true;scene.eventFeed?.push?.('zone-cleared',t('zone.cleared'),{important:true});}}
  if(z.enterButton){const e=scene.zoneFeature.entrance,near=units.some(u=>Math.max(Math.abs(u.tile.x-e.x),Math.abs(u.tile.y-e.y))<=2);if(z.enterButton.disabled===near){z.enterButton.disabled=!near;z.enterButton.title=near?'':t('zone.enterMineFar');}}
  if(!units.length&&(z.soldiers.length||z.king)&&!(z.king&&!scene.character?.isAlive)){z.leaving=true;scene.eventFeed?.push?.('zone-lost',t('zone.lost'),{important:true});setTimeout(()=>scene.game.registry.get('application')?.leaveZone(),2500);}
}
function chestTakenByKing(scene){const g=Math.floor(scene.inventory?.count?.('gold')??0);if(g===scene.zone.lastGold)return false;scene.zone.lastGold=g;for(const chest of scene.zone.chests??[])if(chest.looted&&!scene.zone.taken.includes(chest.zoneKey))scene.zone.taken.push(chest.zoneKey);return true;}
// The home state with the party on its way back: their health and experience, the loot and what the land remembers.
export function homeAfterZone(scene){
  const z=collectParty(scene),home=structuredClone(z.home),fallen=new Set(z.fallen);
  for(const r of home.workers??[]){const rec=z.records[r.id];if(!rec)continue;r.currentHP=rec.currentHP;if(rec.experience)r.experience=structuredClone(rec.experience);if(rec.stance)r.stance=rec.stance;else delete r.stance;}
  const p=home.scouting.party,place=home.scouting.zones[p.zone];
  if(place){if(z.taken.length)place.taken=[...new Set(z.taken)].sort();if(z.cleared)place.cleared=true;}
  // The fallen die at home right after loading (the game's own death: records, wages, homes); here they leave the party.
  if(fallen.size)p.ids=p.ids.filter(id=>!fallen.has(id));
  if(p.king&&home.player&&Number.isFinite(z.kingHP))home.player.currentHP=z.kingHP;
  if(z.loot.gold>0)p.loot={gold:(p.loot?.gold??0)+z.loot.gold};
  if(z.pets?.length)p.pets=structuredClone(z.pets.slice(0,4));
  // Point 68: what the wagon still carries comes home (torches burnt on the way are gone).
  if(p.wagonId!=null&&z.cargo)p.cargo=structuredClone(z.cargo);
  if(!p.ids.length&&!p.king)home.scouting.party=null;
  else Object.assign(p,{phase:'returning',at:home.time.totalElapsed+SCOUTING.travelDays*home.gameSettings.dayLengthSeconds*1000});
  return {home,fallen:[...fallen]};
}
// After home is loaded: the soldiers who fell in the zone die there.
export function buryFallen(scene,ids){
  for(const id of ids??[]){const w=scene.workerSystem?.workers.get(id);if(!w?.isAlive)continue;w.away=false;delete w.scoutZone;w.currentHP=0;w.isAlive=false;scene.onUnitDeath?.(w,null);}
}
