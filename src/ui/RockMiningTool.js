import { t } from '../i18n/index.js';
import { tileCenter } from '../game/isometric.js';
import { blockingDialog } from './dockedPanels.js';
export class RockMiningTool {
  constructor(scene){
    this.scene=scene;this.enabled=false;this.remove=false;this.graphics=scene.add.graphics().setDepth(999998);this.controller=new AbortController();const options={signal:this.controller.signal};
    this.toggle=document.querySelector('#mark-rocks');this.erase=document.querySelector('#unmark-rocks');this.cancel=document.querySelector('#cancel-rock-marking');
    this.toggle.addEventListener('click',()=>this.activate(false),options);this.erase.addEventListener('click',()=>this.activate(true),options);this.cancel.addEventListener('click',()=>this.close(),options);
    this.refresh();
  }
  activate(remove){const s=this.scene;if(s.gameOver||s.gameTime.paused)return;s.cancelBuilding();s.unitSelection.clear();this.enabled=true;this.remove=remove;this.anchor=null;s.game.canvas.style.cursor='crosshair';s.setStatus(t(remove?'rock.removeHint':'rock.markHint'));this.refresh();}
  close(){this.enabled=false;this.anchor=null;if(!this.scene.buildMode)this.scene.game.canvas.style.cursor='';this.refresh();}
  down(pointer){
    const s=this.scene;if(!this.enabled)return false;if(s.gameOver||s.gameTime.paused||blockingDialog(document)){this.anchor=null;return true;}
    if(pointer.rightButtonDown()){this.close();return true;}if(pointer.leftButtonDown()){this.anchor=s.pointerTile(pointer);this.end=this.anchor;}return true;
  }
  move(pointer){if(this.anchor)this.end=this.scene.pointerTile(pointer);}
  up(pointer){
    if(!this.enabled||!this.anchor)return false;const s=this.scene,start=this.anchor,end=s.pointerTile(pointer);this.anchor=null;
    if(!s.gameOver&&!s.gameTime.paused&&!blockingDialog(document)){
      let count=0;for(let y=Math.max(0,Math.min(start.y,end.y));y<=Math.min(99,Math.max(start.y,end.y));y++)for(let x=Math.max(0,Math.min(start.x,end.x));x<=Math.min(99,Math.max(start.x,end.x));x++)if(s.naturalResources.miningWork.rocks.mark({x,y},!this.remove))count++;
      s.setStatus(t(this.remove?'rock.unmarked':'rock.marked',{count}));
    }return true;
  }
  cancelDrag(){this.anchor=null;}
  refresh(){
    if(!this.graphics)return;this.toggle.textContent=t('rock.mark');this.erase.textContent=t('rock.unmark');this.cancel.textContent=t('rock.cancel');this.cancel.hidden=!this.enabled;
    this.toggle.setAttribute('aria-pressed',String(this.enabled&&!this.remove));this.erase.setAttribute('aria-pressed',String(this.enabled&&this.remove));
    this.graphics.clear();const s=this.scene,zoom=s.cameras.main.zoom;
    const diamond=(tile,color,alpha=1)=>{const p=tileCenter(tile);this.graphics.lineStyle(2/zoom,color,alpha).strokePoints([{x:p.x,y:p.y-13},{x:p.x+26,y:p.y},{x:p.x,y:p.y+13},{x:p.x-26,y:p.y}],true);};
    for(const r of s.naturalResources.miningWork.rocks.records.values())if(r.marked&&r.produced<10&&s.fog.isVisibleTile(r.tile))diamond(r.tile,0xffd768);
    if(this.enabled&&this.anchor&&this.end)for(let y=Math.max(0,Math.min(this.anchor.y,this.end.y));y<=Math.min(99,Math.max(this.anchor.y,this.end.y));y++)for(let x=Math.max(0,Math.min(this.anchor.x,this.end.x));x<=Math.min(99,Math.max(this.anchor.x,this.end.x));x++)if(s.fog.isVisibleTile({x,y})&&s.terrainGrid[y][x]===1)diamond({x,y},this.remove?0xf27777:0xffd768,.65);
  }
  destroy(){this.close();this.controller.abort();this.graphics.destroy();}
}
