import { t } from '../i18n/index.js';
import { inAttackRange } from '../systems/CombatSystem.js';

export class CombatFeedback {
  constructor(scene){this.scene=scene;this.bars=new Map();}
  hit(unit){if(!(unit.hitCooldown>0)){unit.hitFlash=110;unit.hitCooldown=350;}}
  update(delta){
    const s=this.scene,king=s.character;
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
    for(const animal of [...s.animalSystem.animals.values(),...(s.workerSystem?.liveWorkers()??[])]){
      const fighting=s.combat.attacks.has(animal)||[...s.combat.attacks.values()].includes(animal);
      const visible=animal.isAlive&&!animal.mounted&&animal.view.visible&&(animal.currentHP<animal.maxHP-1e-9||fighting);
      let bar=this.bars.get(animal.id);
      if(!visible){bar?.setVisible(false);continue;}
      if(!bar){bar=s.add.graphics();this.bars.set(animal.id,bar);}
      const offset=animal.definition.visual?.healthBarOffset??(30*(animal.definition.visual?.bodyScale??1)+14);
      bar.clear().setPosition(animal.view.x,animal.view.y-offset).setDepth(animal.view.depth+.5).setVisible(true);
      bar.fillStyle(0x231f18,.9);bar.fillRect(-18,-2,36,7);
      bar.fillStyle(0x743c30);bar.fillRect(-17,-1,34,5);
      bar.fillStyle(0x85aa64);bar.fillRect(-17,-1,34*animal.currentHP/animal.maxHP,5);
    }
  }
  remove(id){this.bars.get(id)?.destroy();this.bars.delete(id);}
  destroy(){for(const bar of this.bars.values())bar.destroy();this.bars.clear();}
}
