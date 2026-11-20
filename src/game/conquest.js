import { t } from '../i18n/index.js';
import { normalizeScenario } from './scenario.js';
import { tilesAround } from './sandboxMode.js';

// Owner 20 Nov 2026 (86b): Conquest – start on a template's map with my army and take the enemy Castle: kill the enemy
// King unless the template sets another goal. The attacker has no economy; at the start he picks his supplies: horse
// wagons with food, with stones for the Catapults and with torches. The enemy defends and counter-attacks: when our
// army comes close, and then in waves, its free soldiers (not the King, not those on the walls) march on our army.
export const CONQUEST=Object.freeze({
  check:500,
  supplies:Object.freeze({food:Object.freeze({bread:40}),stone:Object.freeze({stone:60}),torch:Object.freeze({torch:30})}),
  maxWagons:5,
  alarmRadius:18,// our soldiers this near an enemy building raise the alarm: the first counter-attack
  alarmShare:.5,// that part of the free enemy soldiers goes
  waveEvery:3,// game hours between later waves
  waveShare:.34,
});
export const CONQUEST_GOALS=Object.freeze(['king','castle','army','defend']);
// Only the template's enemies count (wolves or bandits of the world itself do not).
const hostile=a=>a.isAlive&&a.active!==false&&!!a.definition?.gameplay?.hostile&&!!a.sandbox;
const isKing=a=>a.type==='enemy_king';
const FORT=new Set(['wall','wall_gate']);
// The goal the game checks: a template asking for the King without one on the map is played as "the whole army".
export function conquestGoal(template){const t=normalizeScenario(template),king=t.units.some(u=>u.side==='enemy'&&u.id==='enemy_king');
  return t.goal.type==='king'&&!king?'army':t.goal.type;}
export function clampSupplies(s={}){const n=v=>Math.max(0,Math.min(CONQUEST.maxWagons,Math.round(Number(v)||0)));return {food:n(s.food),stone:n(s.stone),torch:n(s.torch)};}
// A tile by the map edge (a Defence template without attack points).
export function edgePoint(scene,r){const n=scene.map.length,k=Math.floor(r*4*(n-8)),side=Math.floor(k/(n-8)),i=4+k%(n-8);return [{x:i,y:3},{x:n-4,y:i},{x:i,y:n-4},{x:3,y:i}][side];}
// Which way a point lies from the middle of the map, for "the wave comes from the north-west".
// As seen on the screen (the map is a diamond: grid x−y runs across, x+y down).
export function sideOf(scene,p){const n=scene.map.length/2,dx=p.x-n,dy=p.y-n;if(Math.hypot(dx,dy)<n*.25)return 'center';const a=Math.atan2(dx+dy,dx-dy)/Math.PI*4,i=((Math.round(a)%8)+8)%8;return ['e','se','s','sw','w','nw','n','ne'][i];}
// What stands: won, lost or still on.
export function conquestState(scene,goal){
  const s=scene,foes=[...s.animalSystem.animals.values()].filter(hostile),ours=s.workerSystem.liveWorkers().filter(w=>w.profession==='soldier'&&!w.away&&s.military?.unit?.(w)?.type!=='military_wagon');
  const enemyBuildings=s.buildings.filter(b=>b.enemy&&!FORT.has(b.type));
  if(goal==='defend')return s.character?.state==='dead'||(s.character?.currentHP??1)<=0?'lost':'on';
  const won=goal==='king'?!foes.some(isKing):goal==='castle'?enemyBuildings.length===0:foes.length===0;
  if(won)return 'won';if(!ours.length)return 'lost';return 'on';
}
export class Conquest {
  constructor(scene,{template,supplies}){
    this.scene=scene;this.template=normalizeScenario(template);this.goal=conquestGoal(this.template);this.supplies=clampSupplies(supplies);
    this.wait=0;this.alarm=false;this.nextWave=null;this.over=null;this.startedAt=scene.gameTime?.totalElapsed??0;this.lostSoldiers=0;
    // (86c) Defence: the waves in order, each after its minutes from the one before.
    this.wave=0;this.waveAt=this.goal==='defend'&&this.template.waves.length?this.startedAt+this.template.waves[0].after*60000:null;this.statusAt=0;
  }
  defending(){return this.goal==='defend';}
  // Our King stands where the template put him (else at the start of our army) and must not fall.
  placeKing(){const s=this.scene,c=s.character;if(!c)return null;const k=this.template.king??this.template.start??{x:Math.round(s.map.length/2),y:Math.round(s.map.length/2)},tile=tilesAround(s,k,1)[0]??k;
    c.tile={...tile};c.position={x:tile.x+.5,y:tile.y+.5};c.nextTile=null;c.path=[];c.away=false;s.player?.setVisible?.(true);s.worldCamera?.lookAt?.(tile);return tile;}
  spawnWave(i){
    const s=this.scene,w=this.template.waves[i],points=this.template.spawns.length?this.template.spawns:[edgePoint(s,s.random?.()??Math.random())],from=points[Math.floor((s.random?.()??Math.random())*points.length)];
    const list=[];for(const [id,n] of Object.entries(w.units)){const d=s.objectRegistry.get(id);if(!d)continue;for(const tile of tilesAround(s,from,n)){const a=s.animalSystem.create(d,tile);a.sandbox=true;a.wave=i+1;list.push(a);}}
    this.lastSpawn={from,tiles:list.map(a=>a.tile)};s.enemyArmy?.march(list);const king=s.character?.tile;if(king)for(const a of list)if(a.marching)a.marching.tiles=[{...king}];
    s.eventFeed?.push?.(`defence-wave:${i}:${s.gameTime?.totalElapsed??0}`,t('defence.waveComing',{wave:i+1,waves:this.template.waves.length,count:list.length,side:t(`defence.side.${sideOf(s,from)}`)}),{important:true,target:from});
    s.dangerMarks?.mark?.(from);return list.length;
  }
  defend(now){
    const s=this.scene,waves=this.template.waves;
    while(this.waveAt!=null&&now>=this.waveAt){this.spawnWave(this.wave);this.wave++;this.waveAt=this.wave<waves.length?this.waveAt+waves[this.wave].after*60000:null;}
    if(now>=this.statusAt){this.statusAt=now+5000;s.setStatus?.(this.waveAt!=null?t('defence.next',{wave:this.wave+1,waves:waves.length,minutes:Math.max(1,Math.ceil((this.waveAt-now)/60000))}):t('defence.last'));}
    const state=conquestState(s,'defend');if(state==='lost')return this.finish('lost');
    if(this.waveAt==null&&![...s.animalSystem.animals.values()].some(hostile))return this.finish('won');
  }
  // Supply wagons next to the start of our army.
  start(){
    const s=this.scene,king=this.defending()?this.placeKing():null,at=king??this.template.start??{x:Math.round(s.map.length/2),y:Math.round(s.map.length/2)};let n=0;
    const kinds=Object.entries(this.supplies).flatMap(([kind,count])=>Array.from({length:count},()=>kind));
    const tiles=tilesAround(s,at,kinds.length);
    kinds.forEach((kind,i)=>{const tile=tiles[i];if(!tile)return;const w=s.workerSystem.create(tile);if(!s.military.enlist(w,'military_wagon',{withoutHorse:true})){w.isAlive=false;s.workerSystem.onDeath(w);return;}
      w.sandbox=true;const v=s.military.engines?.sandboxCrew?.(w,'military_wagon');if(v){v.supplies={...CONQUEST.supplies[kind]};}n++;});
    s.vehicles?.changed?.();this.soldiers=this.ourSoldiers().length;
    s.eventFeed?.push?.(`conquest-start:${this.startedAt}`,t(`conquest.goalText.${this.goal}`,{waves:this.template.waves.length}),{important:true,target:at});s.setStatus?.(t(`conquest.goalText.${this.goal}`,{waves:this.template.waves.length}));
    return n;
  }
  ourSoldiers(){return this.scene.workerSystem.liveWorkers().filter(w=>w.profession==='soldier'&&!w.away);}
  free(){return [...this.scene.animalSystem.animals.values()].filter(a=>hostile(a)&&!isKing(a)&&!a.onWall&&!a.marching);}
  attack(share){const list=this.free(),n=Math.ceil(list.length*share);if(!n)return 0;return this.scene.enemyArmy?.march(list.slice(0,n))??0;}// march() goes for our army's middle: the attacker has no Castle or buildings
  update(delta){
    if(this.over)return;this.wait-=delta;if(this.wait>0)return;this.wait=CONQUEST.check;const s=this.scene,now=s.gameTime?.totalElapsed??0;
    if(this.defending())return this.defend(now);
    const ours=this.ourSoldiers();
    if(!this.alarm&&ours.some(w=>s.buildings.some(b=>b.enemy&&Math.hypot(b.x-w.tile.x,b.y-w.tile.y)<=CONQUEST.alarmRadius))){this.alarm=true;this.attack(CONQUEST.alarmShare);this.nextWave=now+CONQUEST.waveEvery*s.gameTime.dayDuration/24;
      s.eventFeed?.push?.(`conquest-alarm:${now}`,t('conquest.alarm'),{important:true});}
    else if(this.alarm&&now>=this.nextWave){this.attack(CONQUEST.waveShare);this.nextWave=now+CONQUEST.waveEvery*s.gameTime.dayDuration/24;}
    const state=conquestState(s,this.goal);if(state!=='on')this.finish(state);
  }
  finish(state){
    const s=this.scene;this.over={state,time:(s.gameTime?.totalElapsed??0)-this.startedAt,left:this.ourSoldiers().filter(w=>s.military?.unit?.(w)?.type!=='military_wagon').length,at:this.soldiers??0};
    s.pauseManager?.set?.('conquest',true);s.onConquestOver?.(this.over);return this.over;
  }
}
// The end window: won or lost, how long it took, who is left; play again or go to the main menu.
export function showConquestEnd(doc,over,{again,menu}){
  let d=doc.querySelector('#conquest-end');if(!d){d=doc.createElement('dialog');d.id='conquest-end';d.className='conquest-end';doc.body.append(d);}
  const h=doc.createElement('h2');h.textContent=t(over.state==='won'?'conquest.won':'conquest.lost');
  const minutes=Math.max(1,Math.round(over.time/60000)),p=doc.createElement('p');p.textContent=t('conquest.summary',{minutes,left:over.left});
  const row=doc.createElement('div');row.className='conquest-end-actions';
  const a=doc.createElement('button');a.type='button';a.textContent=t('conquest.again');a.addEventListener('click',()=>{d.close();again();});
  const m=doc.createElement('button');m.type='button';m.textContent=t('conquest.menu');m.addEventListener('click',()=>{d.close();menu();});
  row.append(a,m);d.replaceChildren(h,p,row);d.showModal?.();return d;
}
