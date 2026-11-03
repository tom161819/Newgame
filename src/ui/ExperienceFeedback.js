const format=value=>String(Math.round(value*100)/100);
export class ExperienceFeedback {
  constructor(scene){this.scene=scene;this.effects=[];this.unsubscribe=scene.experienceSystem.on('xp',(actor,amount,detail)=>this.onGain(actor,amount,detail));this.refresh();}
  refresh(){
    const e=this.scene.experienceSystem.getLevelProgress(this.scene.character);if(!e)return;
    document.querySelector('#king-level').textContent=`King | LVL ${e.level}`;
    document.querySelector('#king-profile').title=`Král — Level ${e.level}`;
    document.querySelector('#king-xp').textContent=e.level===e.maxLevel?'XP MAX':`XP ${format(e.currentXP)} / ${e.xpToNextLevel}`;
    const bar=document.querySelector('#king-xp-bar');bar.max=e.xpToNextLevel||1;bar.value=e.level===e.maxLevel?1:e.currentXP;
  }
  onGain(actor,amount,{levelsGained}){
    const view=actor.view??actor.sprite;if(!view)return;
    const level=actor.experience.level,text=`+${format(amount)} XP${levelsGained?`\nLEVEL UP! Level ${level}`:''}`;
    const label=this.scene.add.text(view.x,view.y-65,text,{fontFamily:'Georgia,serif',fontSize:levelsGained?'18px':'14px',color:levelsGained?'#ffe09a':'#d0e9bd',stroke:'#172319',strokeThickness:3,align:'center'}).setOrigin(.5,1);
    let ring=null;
    if(levelsGained){
      ring=this.scene.add.graphics();ring.lineStyle(2,0xf0d174,.9);ring.strokeEllipse(0,-6,52,22);
      for(let i=0;i<8;i++){const angle=i*Math.PI/4;ring.lineBetween(Math.cos(angle)*22,Math.sin(angle)*10-10,Math.cos(angle)*31,Math.sin(angle)*17-10);}
    }
    this.effects.push({actor,label,ring,elapsed:0,duration:levelsGained?1800:1100});this.refresh();this.refreshVisibility();
  }
  refreshVisibility(){for(const effect of this.effects){const view=effect.actor.view??effect.actor.sprite,visible=!!view?.visible&&this.scene.fog.isVisibleObject(effect.actor);effect.label.setVisible(visible);effect.ring?.setVisible(visible);}}
  update(delta){
    for(let i=this.effects.length-1;i>=0;i--){
      const e=this.effects[i];e.elapsed+=delta;const view=e.actor.view??e.actor.sprite,progress=e.elapsed/e.duration;
      if(progress>=1||!view?.scene){e.label.destroy();e.ring?.destroy();this.effects.splice(i,1);continue;}
      e.label.setPosition(view.x,view.y-65-progress*28).setDepth(view.depth+.8).setAlpha(Math.min(1,(1-progress)*3));
      e.ring?.setPosition(view.x,view.y).setDepth(view.depth+.5).setAlpha(1-progress);
    }
    this.refreshVisibility();
  }
  destroy(){this.unsubscribe();for(const e of this.effects){e.label.destroy();e.ring?.destroy();}this.effects=[];}
}
