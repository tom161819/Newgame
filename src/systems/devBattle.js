import { t } from '../i18n/index.js';
import { setSquad } from '../ui/armySquads.js';

// War (owner 16 Nov 2026: "bitva 100 na 100 – je to reálné?"): the Dev tool's test battle. Our soldiers (a mix of
// Soldiers, Archers and Swordsmen; group 9) and as many Enemy Soldiers face each other on open ground away from the
// Castle; our side gets the attack order at once. The FPS meter is switched on to see what the computer manages.
// "Clear the test battle" removes whoever of both sides is left.
const MIX=['soldier','soldier','archer','swordsman'];
function openArea(scene,around,size){
  const map=scene.map,W=map[0].length,H=map.length,free=(x,y)=>map[y]?.[x]===0&&!scene.resourceOccupancy?.has(`${x},${y}`);
  let best=null,bestFree=-1;
  for(let r=18;r<=Math.max(W,H);r+=6)for(let k=0;k<12;k++){const a=k/12*Math.PI*2,c={x:Math.round(around.x+Math.cos(a)*r),y:Math.round(around.y+Math.sin(a)*r)};
    if(c.x-size<2||c.y-size<2||c.x+size>=W-2||c.y+size>=H-2)continue;let n=0;for(let y=c.y-size;y<=c.y+size;y+=2)for(let x=c.x-size;x<=c.x+size;x+=2)if(free(x,y))n++;
    if(n>bestFree){bestFree=n;best=c;}if(bestFree>=((size+1)**2)*.85)return best;}
  return best;
}
function block(scene,center,count){
  const map=scene.map,out=[],taken=new Set(scene.workerSystem.liveWorkers().map(w=>`${w.tile.x},${w.tile.y}`));for(const a of scene.animalSystem.animals.values())taken.add(`${a.tile.x},${a.tile.y}`);
  for(let r=0;r<40&&out.length<count;r++)for(let y=center.y-r;y<=center.y+r&&out.length<count;y++)for(let x=center.x-r;x<=center.x+r&&out.length<count;x++)
    if(Math.max(Math.abs(x-center.x),Math.abs(y-center.y))===r&&map[y]?.[x]===0&&!scene.resourceOccupancy?.has(`${x},${y}`)&&!taken.has(`${x},${y}`)){out.push({x,y});taken.add(`${x},${y}`);}
  return out;
}
export function startDevBattle(scene,count=100){
  const s=scene;if(!s?.workerSystem||!s.military||!s.animalSystem)return null;clearDevBattle(s);
  const castle=s.buildings.find(b=>b.type==='castle'),home=castle?{x:castle.x,y:castle.y}:s.workerSystem.origin(),side=Math.ceil(Math.sqrt(count)),area=openArea(s,home,side+8);if(!area)return null;
  const ours=block(s,{x:area.x-Math.ceil(side/2)-3,y:area.y+Math.ceil(side/2)+3},count),theirs=block(s,{x:area.x+Math.ceil(side/2)+3,y:area.y-Math.ceil(side/2)-3},count);
  const army=[];for(const [i,tile] of ours.entries()){const w=s.workerSystem.create(tile);if(!s.military.enlist(w,MIX[i%MIX.length])){w.isAlive=false;continue;}w.devBattle=true;army.push(w);}
  const d=s.objectRegistry.get('raider'),foes=d?theirs.map(tile=>{const a=s.animalSystem.create(d,tile);a.devBattle=true;return a;}):[];
  s.workerSystem.updateUI?.();setSquad(s,army,9);
  if(foes.length&&army.length)s.military.orderAttack(army,foes[0]);
  s.unitSelection?.set?.(army);s.worldCamera?.lookAt?.(area);s.fpsOverlay?.setEnabled?.(true,false);
  s.eventFeed?.push?.(`dev-battle:${s.gameTime?.totalElapsed??0}`,t('dev.battle.started',{ours:army.length,theirs:foes.length}),{important:true});
  return {ours:army.length,theirs:foes.length};
}
export function clearDevBattle(scene){
  const s=scene;let n=0;
  for(const w of [...(s.workerSystem?.workers.values()??[])])if(w.devBattle&&w.isAlive){s.combat?.stopAttack?.(w);w.isAlive=false;w.currentHP=0;s.workerSystem.onDeath(w);s.needs?.records?.delete?.(w.id);n++;}
  for(const a of [...(s.animalSystem?.animals.values()??[])])if(a.devBattle){s.combat?.stopAttack?.(a);s.animalSystem.remove(a);s.combatFeedback?.remove?.(a.id);n++;}
  s.workerSystem?.updateUI?.();return n;
}
