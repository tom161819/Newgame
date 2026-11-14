import { buildingIsComplete,buildingDefinition } from '../game/buildings.js';
import { isWall } from '../game/walls.js';
import { t,language } from '../i18n/index.js';
import { HAUL_PRIORITIES,HAULABLE_RESOURCES } from '../data/logistics.js';
import { haulPriorityFromValue,haulPriorityValue,setHaulPriority } from '../systems/haulPriority.js';
import { tileCenter } from '../game/isometric.js';
import { blockingDialog } from './dockedPanels.js';

// Screen-space drag rectangle; selected rings and order markers are projected
// from world positions each frame, so pan/zoom never change who was selected.
export class UnitSelection {
  constructor(scene){
    this.scene=scene;this.ids=new Set();this.graphics=scene.add.graphics().setDepth(1000000);this.overlay=scene.add.graphics().setScrollFactor(0).setDepth(1000001);
    this.panel=document.createElement('div');this.panel.id='unit-command-bar';this.panel.className='unit-command-bar';this.panel.hidden=true;this.panel.setAttribute('role','group');
    this.label=document.createElement('span');this.panel.append(this.label);this.buttons={};
    for(const action of ['hold','resume','inspect','clear']){const button=document.createElement('button');button.type='button';button.dataset.unitCommand=action;button.addEventListener('click',()=>this.act(action));this.panel.append(button);this.buttons[action]=button;}
    // m-nosic-priorita: with several Haulers chosen, one choice of what they carry first sets it for all of them.
    this.haul=document.createElement('select');this.haul.id='unit-haul-priority';this.haul.hidden=true;this.panel.append(this.haul);
    this.haul.addEventListener('change',()=>{const p=haulPriorityFromValue(this.haul.value);for(const w of this.workers())if(w.profession==='hauler')setHaulPriority(w,p);this.signature=null;this.draw();});
    document.querySelector('#game')?.append(this.panel);
    if(!this.panel.isConnected)scene.game.canvas.parentElement.append(this.panel);
  }
  workers(){return [...this.ids].map(id=>this.scene.workerSystem.workers.get(id)).filter(w=>this.scene.workerSystem.commands.selectable(w));}
  // m-kral-vyber (point 52): the King is selected like the others (click or drag) and ordered with the right button.
  set(workers){this.king=workers.includes(this.scene.character)&&this.scene.character.isAlive;this.ids=new Set(workers.filter(w=>this.scene.workerSystem.commands.selectable(w)).map(w=>w.id));this.draw();}
  clear(){this.ids.clear();this.king=false;this.anchor=null;this.draw();}
  act(action){
    const workers=this.workers(),s=this.scene;if(action==='clear'){this.clear();return;}
    if(action==='inspect'){if(workers.length===1)s.unitPanel.open(workers[0]);return;}
    if(s.gameOver||s.gameTime.paused)return;
    for(const worker of workers)s.workerSystem.commands[action](worker);this.draw();
  }
  down(pointer){
    const s=this.scene;if(s.gameOver||s.gameTime.paused||s.buildMode||blockingDialog(document))return false;
    if(pointer.rightButtonDown()){
      if(this.ids.size||this.king){
        // m-vojaci-na-hradby: a right click on a finished Stone Wall, Tower or Gate posts the selected soldiers on it.
        const tile=s.pointerTile(pointer),target=tile&&s.buildings.find(b=>buildingIsComplete(b)&&(isWall(b)||b.type==='tower'||b.type==='gate')&&b.tiles?.some(tl=>tl.x===tile.x&&tl.y===tile.y)),soldiers=this.workers().filter(w=>w.profession==='soldier');
        if(target&&soldiers.length){const posted=s.military?.wallPatrol?.post(soldiers,target)??0;if(posted){s.setStatus(t('army.posted',{count:posted,name:buildingDefinition(target).name}));this.draw();return true;}s.setStatus(t('army.postNoWay'));return true;}
        if(this.ids.size){const count=s.workerSystem.commands.move(this.workers(),s.pointerTile(pointer));s.setStatus(t(count?'command.moving':'command.noRoute',{count}));}
        if(this.king)s.kingOrder(pointer);return true;}
      return false;
    }
    if(!pointer.leftButtonDown())return false;
    this.anchor={x:pointer.x,y:pointer.y};this.dragging=false;return true;
  }
  move(pointer){if(!this.anchor)return;this.current={x:pointer.x,y:pointer.y};if(Math.hypot(pointer.x-this.anchor.x,pointer.y-this.anchor.y)>6)this.dragging=true;this.draw();}
  up(pointer){
    if(!this.anchor)return false;
    const anchor=this.anchor;this.anchor=null;
    if(this.dragging){
      const camera=this.scene.cameras.main,a=camera.getWorldPoint(anchor.x,anchor.y),b=camera.getWorldPoint(pointer.x,pointer.y);
      const inside=v=>v.x>=Math.min(a.x,b.x)&&v.x<=Math.max(a.x,b.x)&&v.y>=Math.min(a.y,b.y)&&v.y<=Math.max(a.y,b.y),s=this.scene;
      this.set([...(s.character.state==='ground'&&inside(s.player)?[s.character]:[]),...s.workerSystem.liveSubjects().filter(w=>inside(w.view))]);
    }else{
      const s=this.scene;pointer.updateWorldPoint(s.cameras.main);const hit=s.pickInteraction(pointer.worldX,pointer.worldY,s.pointerTile(pointer));
      // #120: one click on an own villager opens his detail at once; a click on another villager switches it.
      const onKing=s.player?.visible!==false&&s.fog?.isVisibleObject?.(s.character)!==false&&this.onKing(pointer.worldX,pointer.worldY)&&!(hit?.kind==='human'&&hit.depth>s.player.depth);
      if(onKing){this.set([s.character]);s.unitPanel?.open(s.character);}
      else if(hit?.kind==='human'&&s.workerSystem.commands.selectable(hit.object)){this.set([hit.object]);s.unitPanel?.open(hit.object);}
      else{this.clear();if(s.unitPanel?.dialog.open&&s.unitPanel.unit?.id!=null&&s.workerSystem.workers.get(s.unitPanel.unit.id)===s.unitPanel.unit)s.unitPanel.close();s.handleClick(pointer,true);}
    }
    this.dragging=false;this.draw();return true;
  }
  // The King's picture as a click target (his view is a container; a little room around it helps on small zoom).
  onKing(x,y){const b=this.scene.player?.getBounds?.();return !!b&&this.scene.character.state==='ground'&&x>=b.x-6&&x<=b.x+b.width+6&&y>=b.y-24&&y<=b.y+b.height+4;}
  cancelDrag(){this.anchor=null;this.dragging=false;this.overlay.clear();}
  draw(){
    const s=this.scene,workers=this.workers();this.ids=new Set(workers.map(w=>w.id));this.graphics.clear();this.overlay.clear();
    // The open detail of the one selected villager already carries his commands.
    const detail=workers.length===1&&!!s.unitPanel?.dialog.open&&s.unitPanel.unit===workers[0];
    const count=workers.length+(this.king?1:0);if(this.king&&!s.character.isAlive)this.king=false;
    const signature=JSON.stringify([this.king,workers.map(w=>w.id+':'+w.profession+':'+haulPriorityValue(w.haulPriority)),s.gameOver,s.gameTime.paused,language(),detail]);
    if(signature!==this.signature){
      this.signature=signature;this.panel.hidden=!count||!!s.gameOver||detail||(this.king&&!workers.length&&!!s.unitPanel?.dialog.open);this.panel.setAttribute('aria-label',t('command.title'));this.label.textContent=t('command.selected',{count});
      for(const [action,button]of Object.entries(this.buttons))button.textContent=t(`command.${action}`);
      this.buttons.inspect.disabled=workers.length!==1;
      const haulers=workers.filter(w=>w.profession==='hauler');this.haul.hidden=haulers.length<2;
      if(!this.haul.hidden){const option=(v,text)=>{const o=document.createElement('option');o.value=v;o.textContent=text;return o;};
        this.haul.setAttribute('aria-label',t('haul.priority'));this.haul.replaceChildren(option('',t('haul.priority')+'…'),...HAUL_PRIORITIES.filter(k=>k!=='resource').map(k=>option(k,t(`haul.priority.${k}`))),...HAULABLE_RESOURCES.map(r=>option(`resource:${r}`,t('haul.priority.only',{resource:s.objectRegistry.get(r)?.name??r}))));
        const values=new Set(haulers.map(w=>haulPriorityValue(w.haulPriority)));this.haul.value=values.size===1?[...values][0]:'';}this.buttons.hold.disabled=this.buttons.resume.disabled=!!s.gameTime.paused;
    }
    const zoom=s.cameras.main.zoom;
    if(this.king&&s.player)this.graphics.lineStyle(2/zoom,0xffd768,1).strokeEllipse(s.player.x,s.player.y,34,16);
    for(const w of workers){
      this.graphics.lineStyle(2/zoom,0xffd768,1).strokeEllipse(w.view.x,w.view.y,30,14);
      const goal=w.commandState?.goal;if(goal){const p=tileCenter(goal);this.graphics.lineStyle(2/zoom,0xffd768,.8).strokeEllipse(p.x,p.y,20,10);}
    }
    if(this.anchor&&this.dragging&&this.current){const a=this.anchor,b=this.current;this.overlay.lineStyle(1,0xffd768,1).fillStyle(0xffd768,.12).fillRect(a.x,a.y,b.x-a.x,b.y-a.y).strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);}
  }
  destroy(){this.graphics.destroy();this.overlay.destroy();this.panel.remove();}
}
