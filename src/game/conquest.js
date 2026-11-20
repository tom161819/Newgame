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
export const CONQUEST_GOALS=Object.freeze(['king','castle','army']);
// Only the template's enemies count (wolves or bandits of the world itself do not).
const hostile=a=>a.isAlive&&a.active!==false&&!!a.definition?.gameplay?.hostile&&!!a.sandbox;
const isKing=a=>a.type==='enemy_king';
const FORT=new Set(['wall','wall_gate']);
// The goal the game checks: a template asking for the King without one on the map is played as "the whole army".
export function conquestGoal(template){const t=normalizeScenario(template),king=t.units.some(u=>u.side==='enemy'&&u.id==='enemy_king');
  return t.goal.type==='king'&&!king?'army':t.goal.type==='hold'?'army':t.goal.type;}
export function clampSupplies(s={}){const n=v=>Math.max(0,Math.min(CONQUEST.maxWagons,Math.round(Number(v)||0)));return {food:n(s.food),stone:n(s.stone),torch:n(s.torch)};}
// What stands: won, lost or still on.
export function conquestState(scene,goal){
  const s=scene,foes=[...s.animalSystem.animals.values()].filter(hostile),ours=s.workerSystem.liveWorkers().filter(w=>w.profession==='soldier'&&!w.away&&s.military?.unit?.(w)?.type!=='military_wagon');
  const enemyBuildings=s.buildings.filter(b=>b.enemy&&!FORT.has(b.type));
  const won=goal==='king'?!foes.some(isKing):goal==='castle'?enemyBuildings.length===0:foes.length===0;
  if(won)return 'won';if(!ours.length)return 'lost';return 'on';
}
export class Conquest {
  constructor(scene,{template,supplies}){
    this.scene=scene;this.template=normalizeScenario(template);this.goal=conquestGoal(this.template);this.supplies=clampSupplies(supplies);
    this.wait=0;this.alarm=false;this.nextWave=null;this.over=null;this.startedAt=scene.gameTime?.totalElapsed??0;this.lostSoldiers=0;
  }
  // Supply wagons next to the start of our army.
  start(){
    const s=this.scene,at=this.template.start??{x:Math.round(s.map.length/2),y:Math.round(s.map.length/2)};let n=0;
    const kinds=Object.entries(this.supplies).flatMap(([kind,count])=>Array.from({length:count},()=>kind));
    const tiles=tilesAround(s,at,kinds.length);
    kinds.forEach((kind,i)=>{const tile=tiles[i];if(!tile)return;const w=s.workerSystem.create(tile);if(!s.military.enlist(w,'military_wagon',{withoutHorse:true})){w.isAlive=false;s.workerSystem.onDeath(w);return;}
      w.sandbox=true;const v=s.military.engines?.sandboxCrew?.(w,'military_wagon');if(v){v.supplies={...CONQUEST.supplies[kind]};}n++;});
    s.vehicles?.changed?.();this.soldiers=this.ourSoldiers().length;
    s.eventFeed?.push?.(`conquest-start:${this.startedAt}`,t(`conquest.goalText.${this.goal}`),{important:true,target:at});s.setStatus?.(t(`conquest.goalText.${this.goal}`));
    return n;
  }
  ourSoldiers(){return this.scene.workerSystem.liveWorkers().filter(w=>w.profession==='soldier'&&!w.away);}
  free(){return [...this.scene.animalSystem.animals.values()].filter(a=>hostile(a)&&!isKing(a)&&!a.onWall&&!a.marching);}
  attack(share){const list=this.free(),n=Math.ceil(list.length*share);if(!n)return 0;return this.scene.enemyArmy?.march(list.slice(0,n))??0;}// march() goes for our army's middle: the attacker has no Castle or buildings
  update(delta){
    if(this.over)return;this.wait-=delta;if(this.wait>0)return;this.wait=CONQUEST.check;const s=this.scene,now=s.gameTime?.totalElapsed??0;
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
