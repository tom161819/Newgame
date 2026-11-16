import { t } from '../i18n/index.js';
import { SCOUTING,zoneById,zoneEdge,scoutTypeById } from '../data/scouting.js';
import { encodeWorldCode,defaultWorldLevels,WORLD_SETTINGS,WORLD_SEED_MAX } from '../data/worldCode.js';
import { tileCenter } from './isometric.js';
const tileKey=t=>`${t.x},${t.y}`;

// Owner 16 Nov 2026 (m-mapa-kraje, step 2–3): playing a scouted zone with the party. The game holds one map at a time
// (the map size is global), so switching swaps maps: the home game is saved in memory (the same state as a save), the
// zone starts as its own game – no Castle, no residents, only the party's soldiers (the same ids, names, health,
// experience and equipment) – and going back loads home again with the party on its way back. While you are in the
// zone, home waits (its time stands still). The zone world comes from the home world code and the zone, so the same
// zone always looks the same; what changes in it is not kept yet (step 4). Saving in the zone saves home.
const hash=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
const level=key=>WORLD_SETTINGS.findIndex(s=>s.key===key);
// What the land is like, by what the party found there.
export const ZONE_LOOK=Object.freeze({
  forest:Object.freeze({levels:{forest:9,rocks:3,bushes:7,rivers:0,lakes:1},trees:4,clusters:5,deposits:{stone_deposit:.5,iron_deposit:.5}}),
  iron:Object.freeze({levels:{forest:3,rocks:8,rivers:0,lakes:0},trees:.6,deposits:{stone_deposit:1,iron_deposit:4}}),
  stone:Object.freeze({levels:{forest:3,rocks:9,rivers:0,lakes:0},trees:.6,deposits:{stone_deposit:4,iron_deposit:.5}}),
});
export function zoneWorldCode(homeCode,zoneId,type){
  const levels=defaultWorldLevels();for(const [key,value] of Object.entries(ZONE_LOOK[type]?.levels??{}))levels[level(key)]=value;
  return encodeWorldCode({levels,seed:hash(`${homeCode??''}|zone-map|${zoneId}`)%(WORLD_SEED_MAX+1)});
}
// What a zone game starts from: the home state, the zone and the party.
export function zoneStart(home){
  const party=home?.scouting?.party,found=party&&home.scouting.zones?.[party.zone];
  if(!party||party.phase!=='there'||!found)return null;
  const settings={...home.gameSettings,worldCode:zoneWorldCode(home.gameSettings?.worldCode,party.zone,found.type),mapSize:100,startingGold:0,startingGarrison:false};
  return {settings,zone:{home,id:party.zone,type:found.type,ids:[...party.ids],king:!!party.king,wagon:!!party.wagonId,cargo:structuredClone(party.cargo??{})}};
}
// Called at the end of GameScene.create for a zone game.
export function setupZone(scene){
  const z=scene.zone,home=z.home,ws=scene.workerSystem,map=scene.map;
  scene.seasons?.importState?.(home.seasons);
  // The party comes in at the edge facing home (the zone's opposite side).
  const zone=zoneById(z.id),edge=zoneEdge({dx:-zone.dx,dy:-zone.dy},map[0].length,map.length),inset=5,back={x:Math.min(map[0].length-1-inset,Math.max(inset,edge.x)),y:Math.min(map.length-1-inset,Math.max(inset,edge.y))},free=[];
  for(let r=0;r<=14&&free.length<z.ids.length*3;r++)for(let y=back.y-r;y<=back.y+r;y++)for(let x=back.x-r;x<=back.x+r;x++)if(Math.max(Math.abs(x-back.x),Math.abs(y-back.y))===r&&map[y]?.[x]===0&&!scene.resourceOccupancy?.has(tileKey({x,y})))free.push({x,y});
  const records=new Map((home.workers??[]).map(w=>[w.id,w])),units=new Map((home.military?.units??[]).map(u=>[u.workerId,u]));
  z.soldiers=[];
  for(const [i,id] of z.ids.entries()){
    const r=records.get(id),u=units.get(id),tile=free[i]??free[0]??back;if(!r)continue;
    const w=ws.create(tile,{id,name:r.name,identity:r.identity??null,randomize:false});
    if(!scene.military.enlist(w,u?.type??'militia')){w.destroy?.();continue;}
    const unit=scene.military.units.get(id);if(unit&&u?.equipment){unit.equipment={...u.equipment};delete unit.garrison;scene.military.apply?.(w);}
    if(Number.isFinite(r.maxHP))w.maxHP=r.maxHP;if(Number.isFinite(r.currentHP))w.currentHP=Math.min(w.maxHP,Math.max(1,r.currentHP));
    if(r.experience)w.experience=structuredClone(r.experience);
    z.soldiers.push(w);
  }
  ws.updateUI?.();
  // Owner 16 Nov 2026: the King is here only when he went with the party; otherwise he is not on this map at all.
  const c=scene.character;
  if(z.king){const k=free[z.ids.length]??back;c.tile={...k};c.position={x:k.x+.5,y:k.y+.5};c.nextTile=null;c.path=[];c.away=false;const p=tileCenter(k);scene.player?.setPosition?.(p.x,p.y);scene.worldCamera?.follow?.();}
  else{c.away=true;c.path=[];c.nextTile=null;scene.player?.setVisible?.(false);scene.worldCamera?.lookAt?.(z.soldiers[0]?.tile??back);}
  // The Horse Wagon with its load stands by the party (no horse work here yet: it only carries the goods).
  if(z.wagon){const g=free.find((t,i)=>i>z.ids.length&&scene.vehicles?.free(t))??back;z.wagonVehicle=scene.vehicles?.create('horse_wagon',g)??null;}
  // No wolves wait at the spot where the party comes in.
  for(const a of [...(scene.animalSystem?.animals.values()??[])])if(a.type==='wolf'&&Math.hypot(a.tile.x-back.x,a.tile.y-back.y)<30)scene.animalSystem.remove(a);
  // Home-only guides are not shown here.
  scene.tutorial?.destroy?.();scene.tutorial=null;if(scene.gettingStarted){scene.gettingStarted.show=()=>{};scene.gettingStarted.update=()=>{};if(scene.gettingStarted.dialog)scene.gettingStarted.dialog.hidden=true;}
  scene.scouting.zones=structuredClone(home.scouting.zones);scene.scouting.party=structuredClone(home.scouting.party);
  document.body.classList.add('in-zone');
  const banner=document.createElement('div');banner.id='zone-banner';banner.className='zone-banner';
  const type=scoutTypeById(z.type),label=document.createElement('span'),goods=Object.entries(z.cargo??{}).map(([id,n])=>`${n} ${scene.objectRegistry.get(id)?.name??id}`).join(', ');label.textContent=t('zone.banner',{zone:t(`scouting.zone.${z.id}`),found:`${type?.icon??''} ${t(`scouting.type.${z.type}`)}`,count:z.soldiers.length+(z.king?1:0)})+(z.wagon?` ${t('zone.wagon',{goods:goods||t('zone.wagonEmpty')})}`:'');
  const go=document.createElement('button');go.type='button';go.id='zone-home';go.textContent=t('zone.sendHome');go.addEventListener('click',()=>scene.game.registry.get('application')?.leaveZone());
  banner.append(label,go);document.body.append(banner);z.banner=banner;
  scene.events.once('shutdown',()=>{banner.remove();document.body.classList.remove('in-zone');});
  scene.setStatus?.(t('zone.arrived'));
}
// Checked every frame in a zone game: when the whole party has fallen, the zone ends.
export function updateZone(scene){
  const z=scene.zone;if(!z||z.leaving)return;
  if(!z.king&&z.soldiers.length&&z.soldiers.every(w=>!w.isAlive)){z.leaving=true;scene.eventFeed?.push?.('zone-lost',t('zone.lost'),{important:true});setTimeout(()=>scene.game.registry.get('application')?.leaveZone(),2500);}
}
// The home state with the party on its way back: their health and experience from the zone; the fallen are gone.
export function homeAfterZone(scene){
  const z=scene.zone,home=structuredClone(z.home),byId=new Map(z.soldiers.map(w=>[w.id,w]));
  const fallen=new Set(z.soldiers.filter(w=>!w.isAlive).map(w=>w.id));
  for(const r of home.workers??[]){const w=byId.get(r.id);if(!w||fallen.has(r.id))continue;r.currentHP=Math.max(1,Math.round(w.currentHP));if(w.experience)r.experience=structuredClone(w.experience);}
  const p=home.scouting.party;
  // The fallen die at home right after loading (the game's own death: records, wages, homes); here they leave the party.
  if(fallen.size)p.ids=p.ids.filter(id=>!fallen.has(id));
  if(p.king&&home.player&&Number.isFinite(scene.character?.currentHP))home.player.currentHP=Math.max(1,Math.round(scene.character.currentHP));
  if(!p.ids.length&&!p.king)home.scouting.party=null;
  else Object.assign(p,{phase:'returning',at:home.time.totalElapsed+SCOUTING.travelDays*home.gameSettings.dayLengthSeconds*1000});
  return {home,fallen:[...fallen]};
}
// After home is loaded: the soldiers who fell in the zone die there.
export function buryFallen(scene,ids){
  for(const id of ids??[]){const w=scene.workerSystem?.workers.get(id);if(!w?.isAlive)continue;w.away=false;delete w.scoutZone;w.currentHP=0;w.isAlive=false;scene.onUnitDeath?.(w,null);}
}
