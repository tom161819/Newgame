import { buildingIsComplete,buildingDefinition } from '../game/buildings.js';
import { isWall } from '../game/walls.js';
import { t,language } from '../i18n/index.js';
import { HAUL_PRIORITIES,HAULABLE_RESOURCES } from '../data/logistics.js';
import { haulPriorityFromValue,haulPriorityValue,setHaulPriority } from '../systems/haulPriority.js';
import { tileCenter } from '../game/isometric.js';
import { blockingDialog } from './dockedPanels.js';

export const isEnemy=animal=>animal?.type==='wolf'||!!animal?.definition?.gameplay?.hostile;
const ATTACK_CURSOR=`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g stroke="#1b1a14" stroke-width="1.2" stroke-linejoin="round"><path d="M4 3l3 0 14 14-3 3L4 6z" fill="#dfe3e6"/><path d="M28 3l-3 0-14 14 3 3L28 6z" fill="#c9ced2"/><path d="M15 21l5-5 3 3-5 5z" fill="#b8892f"/><path d="M17 21l-5-5-3 3 5 5z" fill="#b8892f"/><path d="M21 22l3-3 5 6-3 3z" fill="#6b4a2a"/><path d="M11 22l-3-3-5 6 3 3z" fill="#6b4a2a"/></g></svg>')}") 16 16, crosshair`;
// Screen-space drag rectangle; selected rings and order markers are projected
// from world positions each frame, so pan/zoom never change who was selected.
export class UnitSelection {
  constructor(scene){
    this.scene=scene;this.ids=new Set();this.graphics=scene.add.graphics().setDepth(1000000);this.overlay=scene.add.graphics().setDepth(1000001);
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
  set(workers){this.king=workers.includes(this.scene.character)&&this.scene.character.isAlive&&!this.scene.character.away;this.ids=new Set(workers.filter(w=>this.scene.workerSystem.commands.selectable(w)).map(w=>w.id));this.draw();}
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
        // m-vojaci-utok (point 39): a right click on an enemy (a wolf now, other enemies later) sends the selected soldiers at it.
        {const enemy=this.enemyAt(pointer),fighters=this.workers().filter(w=>w.profession==='soldier');
          if(enemy&&fighters.length){for(const w of fighters){s.workerSystem.commands.resume(w);s.military?.wallPatrol?.set(w,false);w.huntWolfId=enemy.id;w.militaryRetarget=0;}s.setStatus(t('army.attack',{count:fighters.length,name:enemy.definition.name}));if(this.king)s.kingOrder(pointer);this.draw();return true;}}
        const tile=s.pointerTile(pointer),target=tile&&s.buildings.find(b=>buildingIsComplete(b)&&(isWall(b)||['tower','gate','wall_gate'].includes(b.type))&&b.tiles?.some(tl=>tl.x===tile.x&&tl.y===tile.y)),soldiers=this.workers().filter(w=>w.profession==='soldier');
        if(target&&soldiers.length){const posted=s.military?.wallPatrol?.post(soldiers,target)??0;if(posted){s.setStatus(t('army.posted',{count:posted,name:buildingDefinition(target).name}));this.draw();return true;}s.setStatus(t('army.postNoWay'));return true;}
        if(this.ids.size){const count=s.workerSystem.commands.move(this.workers(),s.pointerTile(pointer));s.setStatus(t(count?'command.moving':'command.noRoute',{count}));}
        if(this.king)s.kingOrder(pointer);return true;}
      return false;
    }
    if(!pointer.leftButtonDown())return false;
    this.anchor={x:pointer.x,y:pointer.y};this.dragging=false;return true;
  }
  move(pointer){this.hover(pointer);if(!this.anchor)return;this.current={x:pointer.x,y:pointer.y};if(Math.hypot(pointer.x-this.anchor.x,pointer.y-this.anchor.y)>6)this.dragging=true;this.draw();}
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
  // An enemy under the pointer that soldiers may be sent at.
  enemyAt(pointer){const s=this.scene;pointer.updateWorldPoint(s.cameras.main);const a=s.animalSystem?.atPoint(pointer.worldX,pointer.worldY);return a&&a.isAlive&&isEnemy(a)&&s.fog.isVisibleObject(a)?a:null;}
  // The pointer turns into crossed swords over an enemy while soldiers are selected.
  hover(pointer){const s=this.scene,canvas=s.game.canvas;if(s.buildMode||s.rockMiningTool?.enabled)return;const attack=this.ids.size>0&&this.workers().some(w=>w.profession==='soldier')&&!!this.enemyAt(pointer);
    if(attack!==this.attackCursor){this.attackCursor=attack;canvas.style.cursor=attack?ATTACK_CURSOR:'';}}
  // Owner 16 Nov 2026: the bar sits above the build bar at the bottom of the screen, never behind it.
  placeAboveBar(doc=globalThis.document){
    const host=this.panel.offsetParent;if(!host||!doc?.querySelectorAll)return;const h=host.getBoundingClientRect();
    // The build bar and the status line above it, when they sit in the lower half of the screen.
    const tops=[...doc.querySelectorAll('.buildings-bar,.status-row')].map(e=>e.getBoundingClientRect()).filter(r=>r.height&&r.top>h.top+h.height/2).map(r=>r.top);
    this.panel.style.bottom=tops.length?`${Math.max(16,Math.round(h.bottom-Math.min(...tops)+8))}px`:'';
  }
  cancelDrag(){this.anchor=null;this.dragging=false;this.overlay.clear();}
  draw(){
    const s=this.scene,workers=this.workers();this.ids=new Set(workers.map(w=>w.id));this.graphics.clear();this.overlay.clear();
    // The open detail of the one selected villager already carries his commands.
    const detail=workers.length===1&&!!s.unitPanel?.dialog.open&&s.unitPanel.unit===workers[0];
    const count=workers.length+(this.king?1:0);if(this.king&&(!s.character.isAlive||s.character.away))this.king=false;
    const signature=JSON.stringify([this.king,workers.map(w=>w.id+':'+w.profession+':'+haulPriorityValue(w.haulPriority)),s.gameOver,s.gameTime.paused,language(),detail]);
    if(!this.panel.hidden&&signature===this.signature){const now=globalThis.performance?.now?.()??0;if(now-(this.placedAt??0)>700){this.placedAt=now;this.placeAboveBar();}}
    if(signature!==this.signature){
      this.signature=signature;this.panel.hidden=!count||!!s.gameOver||detail||(this.king&&!workers.length&&!!s.unitPanel?.dialog.open);this.panel.setAttribute('aria-label',t('command.title'));this.label.textContent=t('command.selected',{count});
      for(const [action,button]of Object.entries(this.buttons))button.textContent=t(`command.${action}`);
      this.buttons.inspect.disabled=workers.length!==1;if(!this.panel.hidden)this.placeAboveBar();
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
    // Owner 16 Nov 2026: drawn in the world from the same camera points the selection uses, so the box stays under the
    // pointer at every zoom (a scroll-free overlay is still zoomed around the screen middle).
    if(this.anchor&&this.dragging&&this.current){const cam=s.cameras.main,a=cam.getWorldPoint(this.anchor.x,this.anchor.y),b=cam.getWorldPoint(this.current.x,this.current.y);this.overlay.lineStyle(1/(cam.zoom||1),0xffd768,1).fillStyle(0xffd768,.12).fillRect(a.x,a.y,b.x-a.x,b.y-a.y).strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);}
  }
  destroy(){this.graphics.destroy();this.overlay.destroy();this.panel.remove();}
}
