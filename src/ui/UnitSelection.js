import { t,language } from '../i18n/index.js';
import { tileCenter } from '../game/isometric.js';

// Screen-space drag rectangle; selected rings and order markers are projected
// from world positions each frame, so pan/zoom never change who was selected.
export class UnitSelection {
  constructor(scene){
    this.scene=scene;this.ids=new Set();this.graphics=scene.add.graphics().setDepth(1000000);this.overlay=scene.add.graphics().setScrollFactor(0).setDepth(1000001);
    this.panel=document.createElement('div');this.panel.id='unit-command-bar';this.panel.className='unit-command-bar';this.panel.hidden=true;this.panel.setAttribute('role','group');
    this.label=document.createElement('span');this.panel.append(this.label);this.buttons={};
    for(const action of ['hold','resume','inspect','clear']){const button=document.createElement('button');button.type='button';button.dataset.unitCommand=action;button.addEventListener('click',()=>this.act(action));this.panel.append(button);this.buttons[action]=button;}
    document.querySelector('#game')?.append(this.panel);
    if(!this.panel.isConnected)scene.game.canvas.parentElement.append(this.panel);
  }
  workers(){return [...this.ids].map(id=>this.scene.workerSystem.workers.get(id)).filter(w=>this.scene.workerSystem.commands.selectable(w));}
  set(workers){this.ids=new Set(workers.filter(w=>this.scene.workerSystem.commands.selectable(w)).map(w=>w.id));this.draw();}
  clear(){this.ids.clear();this.anchor=null;this.draw();}
  act(action){
    const workers=this.workers(),s=this.scene;if(action==='clear'){this.clear();return;}
    if(action==='inspect'){if(workers.length===1)s.unitPanel.open(workers[0]);return;}
    if(s.gameOver||s.gameTime.paused)return;
    for(const worker of workers)s.workerSystem.commands[action](worker);this.draw();
  }
  down(pointer){
    const s=this.scene;if(s.gameOver||s.gameTime.paused||s.buildMode||document.querySelector('dialog[open]'))return false;
    if(pointer.rightButtonDown()){
      if(this.ids.size){const count=s.workerSystem.commands.move(this.workers(),s.pointerTile(pointer));s.setStatus(t(count?'command.moving':'command.noRoute',{count}));return true;}
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
      this.set(this.scene.workerSystem.liveSubjects().filter(w=>{const v=w.view;return v.x>=Math.min(a.x,b.x)&&v.x<=Math.max(a.x,b.x)&&v.y>=Math.min(a.y,b.y)&&v.y<=Math.max(a.y,b.y);}));
    }else{
      const s=this.scene;pointer.updateWorldPoint(s.cameras.main);const hit=s.pickInteraction(pointer.worldX,pointer.worldY,s.pointerTile(pointer));
      if(hit?.kind==='human'&&s.workerSystem.commands.selectable(hit.object))this.set([hit.object]);
      else{this.clear();s.handleClick(pointer,true);}
    }
    this.dragging=false;this.draw();return true;
  }
  cancelDrag(){this.anchor=null;this.dragging=false;this.overlay.clear();}
  draw(){
    const s=this.scene,workers=this.workers();this.ids=new Set(workers.map(w=>w.id));this.graphics.clear();this.overlay.clear();
    const signature=JSON.stringify([workers.length,s.gameOver,s.gameTime.paused,language()]);
    if(signature!==this.signature){
      this.signature=signature;this.panel.hidden=!workers.length||!!s.gameOver;this.panel.setAttribute('aria-label',t('command.title'));this.label.textContent=t('command.selected',{count:workers.length});
      for(const [action,button]of Object.entries(this.buttons))button.textContent=t(`command.${action}`);
      this.buttons.inspect.disabled=workers.length!==1;this.buttons.hold.disabled=this.buttons.resume.disabled=!!s.gameTime.paused;
    }
    const zoom=s.cameras.main.zoom;
    for(const w of workers){
      this.graphics.lineStyle(2/zoom,0xffd768,1).strokeEllipse(w.view.x,w.view.y,30,14);
      const goal=w.commandState?.goal;if(goal){const p=tileCenter(goal);this.graphics.lineStyle(2/zoom,0xffd768,.8).strokeEllipse(p.x,p.y,20,10);}
    }
    if(this.anchor&&this.dragging&&this.current){const a=this.anchor,b=this.current;this.overlay.lineStyle(1,0xffd768,1).fillStyle(0xffd768,.12).fillRect(a.x,a.y,b.x-a.x,b.y-a.y).strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);}
  }
  destroy(){this.graphics.destroy();this.overlay.destroy();this.panel.remove();}
}
