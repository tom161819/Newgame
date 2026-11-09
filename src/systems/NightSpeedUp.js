import { DAY_NIGHT } from '../data/dayNight.js';
import { SEASON_DAYS,SEASONS } from '../data/seasons.js';
import { readNightSpeed,saveNightSpeed } from '../ui/NightControls.js';
import { NightSpeedTip } from '../ui/NightSpeedTip.js';

// m-noc-zrychleni (owner point 82): "Auto speed-up at night" (Settings, off by default). With it on, the game speed
// itself goes up to the chosen step (×3, or ×2) when the night starts, so the speed indicator shows it (with a moon),
// and returns to the speed before the night at dawn. A speed the player sets during the night wins and the automatic
// keeps out until the morning; the pause always wins (it is separate from the speed); a player already at that speed
// or faster sees no change. While Skip to dawn runs or something needs attention (a fight, wolves, a fire) the speed
// goes back to the one before the night. Nothing of this is saved except "the tip was shown" (optional save field).
export const NIGHT_SPEED_TIP_DAY=DAY_NIGHT.speedTipYears*SEASON_DAYS*SEASONS.length+1;
export class NightSpeedUp {
  constructor(scene,{read=()=>readNightSpeed(),save=v=>saveNightSpeed(v),tip}={}){
    this.scene=scene;this.read=read;this.save=save;
    // engaged: the automatic holds the speed now; before: the speed it replaced; manual: the player changed the speed tonight.
    this.engaged=false;this.before=null;this.manual=false;this.tipShown=false;
    this.tip=tip!==undefined?tip:globalThis.document?.createElement?new NightSpeedTip(scene,{onEnable:()=>this.enable()}):null;
  }
  get night(){return !!this.scene.dayNight?.isNight?.();}
  apply(speed){const s=this.scene;if(s.speedControls?.applyAuto)s.speedControls.applyAuto(speed);else s.gameSpeed=speed;}
  update(){
    const s=this.scene,dn=s.dayNight;this.checkTip();
    if(!this.night){this.release();this.manual=false;return;}
    if(this.manual)return;
    const factor=this.read(),want=factor>1&&!dn.skipping&&!dn.attention?.();
    if(want&&!this.engaged){const current=s.gameSpeed??1;if(current>=factor)return;this.before=current;this.engaged=true;this.apply(factor);}
    else if(want&&this.engaged&&(s.gameSpeed??1)!==factor)this.apply(factor);
    else if(!want)this.release();
  }
  release(){if(this.engaged){this.engaged=false;this.apply(this.before??1);}this.before=null;}
  // SpeedControls.setSpeed (buttons, keys 1–3, the tutorial) calls this before it sets the player's speed.
  manualChange(){if(!this.night)return;this.manual=true;this.engaged=false;this.before=null;}
  // The tip comes once per game after the first year; it is marked shown at that check even when the option is already
  // on (then there is nothing to offer). Not during the tutorial, and not while a tip bubble is open (m-tipy-mimo-listu:
  // one tip at a time – it waits until the bubble is gone).
  checkTip(){
    const s=this.scene;if(this.tipShown||(s.gameTime?.day??1)<NIGHT_SPEED_TIP_DAY||s.gameOver||s.tutorial?.active||s.tutorial?.tip)return false;
    this.tipShown=true;if(this.read()>1)return false;this.tip?.show();return true;
  }
  enable(){this.save(3);this.scene.nightControls?.syncSpeed?.();}
  exportState(){return this.tipShown?true:undefined;}
  importState(value){this.tipShown=value===true;if(this.tipShown)this.tip?.hide();}
  destroy(){this.tip?.destroy();}
}
