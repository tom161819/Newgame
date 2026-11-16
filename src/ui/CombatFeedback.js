import { t } from '../i18n/index.js';
import { inAttackRange } from '../systems/CombatSystem.js';

// Enemies: wolves and the hostile animals of the scouted lands (bandits, rats).
const isEnemyUnit=u=>u?.type==='wolf'||!!u?.definition?.gameplay?.hostile;
const BATTLE_QUIET=5000;
export class CombatFeedback {
  constructor(scene){this.scene=scene;this.bars=new Map();this.damage=new Map();this.rings=scene.add?.graphics?.().setDepth?.(5)??null;this.battle=null;}
  hit(unit){if(!(unit.hitCooldown>0)){unit.hitFlash=110;unit.hitCooldown=350;}}
  // Combat 16 Nov 2026: damage numbers – what a unit lost, added up and shown about twice a second over its head.
  damaged(unit,amount){if(!(amount>0))return;const d=this.damage.get(unit)??{sum:0,wait:0};d.sum+=amount;this.damage.set(unit,d);}
  floatDamage(delta){
    const s=this.scene;if(!s.add?.text)return;
    for(const [unit,d] of this.damage){d.wait-=delta;if(d.wait>0)continue;if(d.sum<1){if(!unit.isAlive)this.damage.delete(unit);continue;}
      const view=unit===s.character?s.player:unit.view;const shown=view?.visible&&(!s.fog?.enabled||s.fog.isVisibleObject?.(unit)!==false);
      // Big battles: numbers only on screen and at most 40 at a time.
      const cam=s.cameras?.main?.worldView,onScreen=!cam||cam.contains?.(view?.x??0,view?.y??0)!==false;
      if(shown&&onScreen&&(this.floating??0)<40){this.floating=(this.floating??0)+1;const enemy=isEnemyUnit(unit),y=view.y-(unit.definition?.visual?.healthBarOffset??40)-10,text=s.add.text(view.x+(Math.random()*10-5),y,`-${Math.round(d.sum)}`,{fontSize:'12px',fontStyle:'bold',color:enemy?'#ffe07a':'#ff7b6b',stroke:'#1b140e',strokeThickness:3}).setOrigin(.5).setDepth(view.depth+2);
        s.tweens?.add?.({targets:text,y:y-22,alpha:0,duration:800,onComplete:()=>{text.destroy();this.floating--;}});}
      d.sum=0;d.wait=550;if(!unit.isAlive)this.damage.delete(unit);}
  }
  // Arrows: an archer who is shooting sends a visible arrow about once a second.
  arrows(delta){
    const s=this.scene;if(!s.add?.graphics)return;
    for(const [a,target] of s.combat.attacks){if(!(a.attackRange>1)||!a.isAlive||!target?.isAlive||!inAttackRange(a,target,s.map))continue;a.arrowWait=(a.arrowWait??Math.random()*900)-delta;if(a.arrowWait>0)continue;a.arrowWait=900;
      const from=a===s.character?s.player:a.view,to=target===s.character?s.player:target.view;if(!from?.visible||!to)continue;
      const g=s.add.graphics().setDepth(Math.max(from.depth,to.depth)+1),start={x:from.x,y:from.y-24},end={x:to.x,y:to.y-18},angle=Math.atan2(end.y-start.y,end.x-start.x);
      g.lineStyle(2,0x3b2a1a,1).lineBetween(-7,0,7,0).fillStyle(0xd9d4c4,1).fillTriangle(7,-2,7,2,11,0);g.setPosition(start.x,start.y).setRotation(angle);
      s.tweens?.add?.({targets:g,x:end.x,y:end.y,duration:Math.min(450,Math.hypot(end.x-start.x,end.y-start.y)*2),onComplete:()=>g.destroy()});}
  }
  // A summary of the fight going on: who took part, who still stands, and a report when it is over.
  trackBattle(delta){
    const s=this.scene,ours=new Set(),foes=new Set();
    for(const [a,b] of s.combat.attacks){const ea=isEnemyUnit(a),eb=isEnemyUnit(b);if(ea===eb||!a?.isAlive&&!b?.isAlive)continue;foes.add(ea?a:b);ours.add(ea?b:a);}
    let battle=this.battle;
    if(ours.size&&foes.size){if(!battle)battle=this.battle={ours:new Set(),foes:new Set(),quiet:0,start:s.gameTime?.totalElapsed??0};for(const u of ours)battle.ours.add(u);for(const u of foes)battle.foes.add(u);battle.quiet=0;}
    else if(battle){battle.quiet+=delta;if(battle.quiet>=BATTLE_QUIET){this.endBattle(battle);this.battle=battle=null;}}
    this.showBattle(battle);
  }
  endBattle(b){
    const fallen=[...b.ours].filter(u=>!u.isAlive).length,beaten=[...b.foes].filter(u=>!u.isAlive).length,foesLeft=[...b.foes].filter(u=>u.isAlive).length,oursLeft=[...b.ours].filter(u=>u.isAlive).length;
    if(b.ours.size+b.foes.size<3)return;
    const key=!foesLeft?'battle.won':!oursLeft?'battle.lost':'battle.over';
    this.scene.eventFeed?.push?.(`battle:${b.start}`,t(key,{fallen,beaten,ours:b.ours.size,foes:b.foes.size}),{important:true});
  }
  showBattle(b){
    if(!this.panel&&globalThis.document?.createElement){this.panel=document.createElement('div');this.panel.id='battle-panel';this.panel.className='battle-panel';this.panel.hidden=true;this.panel.setAttribute('role','status');document.body.append(this.panel);}
    if(!this.panel)return;const show=!!b&&b.ours.size+b.foes.size>=3;this.panel.hidden=!show;if(!show)return;
    const alive=set=>[...set].filter(u=>u.isAlive).length,text=t('battle.panel',{ours:alive(b.ours),oursAll:b.ours.size,foes:alive(b.foes),foesAll:b.foes.size});if(this.panel.textContent!==text)this.panel.textContent=text;
  }
  drawRings(){
    const s=this.scene,g=this.rings;if(!g)return;g.clear();const zoom=s.cameras?.main?.zoom||1;
    for(const a of s.animalSystem.animals.values()){if(!a.isAlive||!isEnemyUnit(a)||!a.view?.visible||s.fog?.enabled&&s.fog.isVisibleObject?.(a)===false)continue;
      g.lineStyle(2/zoom,0xe04a32,.95).strokeEllipse(a.view.x,a.view.y,26,12).fillStyle(0xe04a32,.18).fillEllipse(a.view.x,a.view.y,26,12);}
  }
  update(delta){
    const s=this.scene,king=s.character;this.floatDamage(delta);this.arrows(delta);this.trackBattle(delta);
    for(const unit of [king,...s.animalSystem.animals.values(),...(s.workerSystem?.liveWorkers()??[])]){
      unit.hitFlash=Math.max(0,(unit.hitFlash??0)-delta);unit.hitCooldown=Math.max(0,(unit.hitCooldown??0)-delta);
      (unit===king?s.player:unit.view).setAlpha(unit.hitFlash>0?0.45:1);
    }
    const target=s.combat.attacks.get(king),attacking=!!target&&s.combat.canFight(king)&&inAttackRange(king,target,s.map);
    const direction=target?{x:target.position.x-king.position.x,y:target.position.y-king.position.y}:king.direction;
    s.player.setAttackPose?.(delta,attacking,direction);
    for(const worker of s.workerSystem?.liveWorkers()??[]){const target=s.combat.attacks.get(worker),active=!!target&&s.combat.canFight(worker)&&inAttackRange(worker,target,s.map);worker.view.setAttackPose?.(delta,active,target?{x:target.position.x-worker.position.x,y:target.position.y-worker.position.y}:worker.direction);}
  }
  refresh(){
    const s=this.scene,king=s.character,output=document.querySelector('#king-health');
    const hp=king.currentHP>0?Math.max(.01,Math.round(king.currentHP*100)/100):0;
    const text=t('hud.hp',{hp,max:king.maxHP});if(output.textContent!==text)output.textContent=text;
    const progress=document.querySelector('#king-health-bar');progress.max=king.maxHP;progress.value=king.currentHP;
    // m-kral-vyber (point 52): the King has a health bar over his head too – when hurt, fighting or selected.
    this.drawRings();const targets=new Set(s.combat.attacks.values());
    for(const animal of [king,...s.animalSystem.animals.values(),...(s.workerSystem?.liveWorkers()??[])]){
      const view=animal===king?s.player:animal.view;
      const fighting=s.combat.attacks.has(animal)||targets.has(animal);
      const visible=animal.isAlive&&!animal.mounted&&view.visible&&(animal.currentHP<animal.maxHP-1e-9||fighting||animal===king&&!!s.unitSelection?.king);
      let bar=this.bars.get(animal.id);
      if(!visible){bar?.setVisible(false);continue;}
      if(!bar){bar=s.add.graphics();this.bars.set(animal.id,bar);}
      const offset=animal.definition.visual?.healthBarOffset??(30*(animal.definition.visual?.bodyScale??1)+14);
      bar.clear().setPosition(view.x,view.y-offset).setDepth(view.depth+.5).setVisible(true);
      bar.fillStyle(0x231f18,.9);bar.fillRect(-18,-2,36,7);
      bar.fillStyle(0x4a3a30);bar.fillRect(-17,-1,34,5);
      // Combat test 16 Nov 2026: enemies (wolves, bandits, rats) have a red bar, our people a green one.
      const enemy=animal.type==='wolf'||!!animal.definition?.gameplay?.hostile;
      bar.fillStyle(enemy?0xd8503a:0x85aa64);bar.fillRect(-17,-1,34*animal.currentHP/animal.maxHP,5);
    }
  }
  remove(id){this.bars.get(id)?.destroy();this.bars.delete(id);}
  destroy(){for(const bar of this.bars.values())bar.destroy();this.bars.clear();this.rings?.destroy?.();this.panel?.remove();this.damage.clear();}
}
