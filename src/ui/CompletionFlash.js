import { playChime } from './sound.js';

// E4: a finished building gets a short golden burst over it and a chime (Settings → Sound). Drawing only; the event
// feed line for the finished building stays as before. Hidden in the fog like other effects.
export const FLASH=Object.freeze({durationMs:1200,maxEffects:6});
export class CompletionFlash {
  constructor(scene){this.scene=scene;this.effects=[];}
  flash(building){
    const view=this.scene.towerViews?.get(building.id);if(!view||!this.scene.add)return false;
    const g=this.scene.add.graphics();g.lineStyle(3,0xffe08a,1);g.strokeEllipse(0,0,70,30);
    for(let i=0;i<10;i++){const a=i*Math.PI/5;g.lineBetween(Math.cos(a)*30,Math.sin(a)*13,Math.cos(a)*46,Math.sin(a)*21);}
    g.setPosition(view.x,view.y-24).setDepth((view.depth??0)+1);
    this.effects.push({building,view,g,elapsed:0});while(this.effects.length>FLASH.maxEffects)this.effects.shift().g.destroy();
    if(this.visible(building))playChime('built');
    this.update(0);return true;
  }
  visible(building){return this.scene.fog?.isVisibleObject?.(building)??true;}
  update(delta){
    for(let i=this.effects.length-1;i>=0;i--){
      const e=this.effects[i];e.elapsed+=delta;const p=e.elapsed/FLASH.durationMs;
      if(p>=1||!e.g.scene){e.g.destroy();this.effects.splice(i,1);continue;}
      e.g.setScale(.6+p*.9).setAlpha(1-p).setVisible(this.visible(e.building));
    }
  }
  destroy(){for(const e of this.effects)e.g.destroy();this.effects=[];}
}
