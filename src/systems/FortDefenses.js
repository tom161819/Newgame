import { t } from '../i18n/index.js';
import { BOILING_PITCH,BALLISTA,PORTCULLIS } from '../data/military.js';
import { buildingDefinition,buildingIsComplete,towerTop } from '../game/buildings.js';
import { gridToWorld,tileCenter } from '../game/isometric.js';
import { clampArmor } from './UnitStats.js';
import { touchesBuilding } from './SiegeSystem.js';

// Owner 20 Nov 2026 ("zpracuj postupně všechny ty návrhy na obranu / útok", point 4): boiling pitch from our Gates and
// Towers, and the Tower's ballista. Both need one of ours up on the building. Drawn in code (no art yet).
const enemies=s=>[...(s.animalSystem?.animals?.values?.()??[])].filter(a=>a.isAlive&&a.active!==false&&a.definition?.gameplay?.hostile);
export class FortDefenses{
  constructor(scene){this.scene=scene;this.ready=new Map();}
  manned(b){return (this.scene.workerSystem?.liveWorkers?.()??[]).some(w=>w.isAlive&&w.onWall===b&&!w.wallDescent);}
  forts(){return this.scene.buildings.filter(b=>!b.enemy&&buildingIsComplete(b)&&(BOILING_PITCH.fortTypes.includes(b.type)));}
  update(delta){
    const s=this.scene,now=s.gameTime?.totalElapsed??0,foes=enemies(s);if(!foes.length)return;
    for(const b of this.forts()){if(!this.manned(b))continue;
      // Boiling pitch on whoever stands at its foot.
      const below=foes.filter(a=>touchesBuilding(a.tile,b));
      if(below.length&&now>=(this.ready.get(`pitch:${b.id}`)??0)){
        if((s.inventory?.count?.('pitch')??0)>=BOILING_PITCH.pitch&&s.inventory.spend('pitch',BOILING_PITCH.pitch,{source:'Boiling Pitch',id:`pitch:${b.id}:${Math.floor(now)}`})){
          this.ready.set(`pitch:${b.id}`,now+BOILING_PITCH.reload);for(const a of below)s.combat?.applyEffectiveDamage?.(a,BOILING_PITCH.damage,false,null);this.splash(b,below);
        }else if(!this.noPitchTold){this.noPitchTold=true;s.eventFeed?.push?.(`no-pitch:${Math.floor(now/60000)}`,t('defense.noPitch'),{important:true,target:{x:b.x,y:b.y}});}
      }
      // The ballista.
      if(b.type==='tower'&&b.ballista&&now>=(this.ready.get(`ballista:${b.id}`)??0)){
        const c={x:b.x+1,y:b.y+1},inRange=foes.filter(a=>Math.hypot(a.position.x-c.x,a.position.y-c.y)<=BALLISTA.range);
        const rank=a=>(a.definition.gameplay.ram?0:a.definition.gameplay.mounted?1:2)*100+Math.hypot(a.position.x-c.x,a.position.y-c.y);
        const target=inRange.sort((x,y)=>rank(x)-rank(y))[0];
        if(target){this.ready.set(`ballista:${b.id}`,now+BALLISTA.reload);s.combat?.applyEffectiveDamage?.(target,BALLISTA.damage*(1-clampArmor(target.armor)*(1-BALLISTA.pierce)/100),false,null);this.bolt(b,target);}
      }
    }
  }
  splash(b,below){
    const s=this.scene;if(!s.add?.graphics||!s.tweens?.add)return;
    for(const a of below){const p=gridToWorld(a.position.x,a.position.y),top=towerTop(b),g=s.add.graphics().setDepth(p.y+30);
      g.fillStyle(0x1e140b,.85);g.fillEllipse(0,0,26,9);g.fillStyle(0x3b2a18,.6);g.fillEllipse(-4,-2,14,5);g.setPosition(p.x,p.y);
      const pour=s.add.graphics().setDepth(p.y+31);pour.lineStyle(4,0x2a1c10,.9);pour.lineBetween(top.x,top.y+10,p.x,p.y-18);
      const steam=s.add.graphics().setDepth(p.y+32);steam.fillStyle(0xd8d2c4,.45);steam.fillCircle(p.x-6,p.y-20,6);steam.fillCircle(p.x+5,p.y-26,7);steam.fillCircle(p.x,p.y-34,5);
      s.tweens.add({targets:[g,steam],alpha:0,duration:1600,onComplete:()=>{g.destroy();steam.destroy();}});s.tweens.add({targets:pour,alpha:0,duration:500,onComplete:()=>pour.destroy()});}
  }
  bolt(b,target){
    const s=this.scene;if(!s.add?.graphics||!s.tweens?.add)return;const from=towerTop(b),to=gridToWorld(target.position.x,target.position.y),g=s.add.graphics().setDepth(20001);
    const dx=to.x-from.x,dy=to.y-30-from.y,n=Math.hypot(dx,dy)||1;g.lineStyle(3,0x5a3c22,1);g.lineBetween(-dx/n*10,-dy/n*10,dx/n*10,dy/n*10);g.fillStyle(0x8d9096,1);g.fillTriangle(dx/n*13,dy/n*13,dx/n*8-dy/n*3,dy/n*8+dx/n*3,dx/n*8+dy/n*3,dy/n*8-dx/n*3);
    g.setPosition(from.x,from.y-20);s.tweens.add({targets:g,x:to.x,y:to.y-30,duration:Math.max(150,n*.9),onComplete:()=>g.destroy()});
  }
  // The Tower's window: mount a ballista for BALLISTA.cost.
  mount(tower){
    const s=this.scene;if(tower?.type!=='tower'||tower.enemy||!buildingIsComplete(tower))return {error:t('defense.noTower')};if(tower.ballista)return {error:t('defense.ballistaThere')};
    if(!s.sandbox&&!s.inventory.pay(BALLISTA.cost,{source:'Ballista'}))return {error:t('status.noFunds')};tower.ballista=true;return {ok:true};
  }
  // Point 6: the Gate's window – a portcullis.
  portcullis(gate){
    const s=this.scene;if(!['gate','wall_gate'].includes(gate?.type)||gate.enemy||!buildingIsComplete(gate))return {error:t('defense.noGate')};if(gate.portcullis)return {error:t('defense.portcullisThere')};
    if(!s.sandbox&&!s.inventory.pay(PORTCULLIS.cost,{source:'Portcullis'}))return {error:t('status.noFunds')};gate.portcullis=true;return {ok:true};
  }
}
