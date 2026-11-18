import { buildingIsComplete,buildingDefinition } from '../game/buildings.js';
import { isWall } from '../game/walls.js';
import { t,language } from '../i18n/index.js';
import { HAUL_PRIORITIES,HAULABLE_RESOURCES } from '../data/logistics.js';
import { haulPriorityFromValue,haulPriorityValue,setHaulPriority } from '../systems/haulPriority.js';
import { tileCenter,worldToGrid } from '../game/isometric.js';
import { FORMATIONS,FORMATION_ICONS,DEFAULT_FORMATION,formationTiles } from '../game/formations.js';
import { knownMap } from '../game/knownMap.js';
import { blockingDialog } from './dockedPanels.js';
import { setSquad,squadMembers } from './armySquads.js';
import { JOBS } from '../data/jobs.js';
import { GEAR_ICONS,gearOf } from './gearIcons.js';

const DOUBLE_CLICK_MS=400;
import { APPROVED_VILLAGER_ART,walkKey } from '../data/objects/approvedArt.js';
import { SOLDIER_ANIM_ART } from '../data/soldierAnimArt.js';
import { FISHER_WALK_ART } from '../data/fisherWalkArt.js';
// Owner 17 Nov 2026: the orders are icons; hovering shows the name and what it does.
const COMMAND_ICONS=Object.freeze({hold:'📍',resume:'↩️',inspect:'🔍',clear:'✖'}),STANCE_ICONS=Object.freeze({aggressive:'⚔️',defensive:'🛡️',hold:'✋'});
const lookArt=look=>APPROVED_VILLAGER_ART[look]??SOLDIER_ANIM_ART[look]??FISHER_WALK_ART[look]??null;
function iconButton(button,icon,name,tip){if(button.textContent!==icon)button.textContent=icon;button.dataset.tipTitle=name;button.dataset.tip=tip??'';button.setAttribute('aria-label',tip?`${name}: ${tip}`:name);button.classList.add('unit-icon-command');button.removeAttribute?.('title');}
const KIND_ICONS=Object.freeze({king:'👑','soldier:soldier':'🛡️','soldier:swordsman':'⚔️','soldier:archer':'🏹','soldier:knight':'🛡️','soldier:light_cavalry':'🐎','soldier:catapult':'🪨','soldier:military_wagon':'🛒','soldier:halberdier':'🔱','soldier:royal_archer':'🏹','soldier:crossbowman':'🎯','soldier:recruit':'🪖',hauler:'📦',builder:'🔨',woodcutter:'🪓',miner:'⛏️',hunter:'🦌',fisher:'🎣',farmer:'🌾',idle:'💤'});
export const isEnemy=animal=>animal?.type==='wolf'||!!animal?.definition?.gameplay?.hostile;
const ATTACK_CURSOR=`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g stroke="#1b1a14" stroke-width="1.2" stroke-linejoin="round"><path d="M4 3l3 0 14 14-3 3L4 6z" fill="#dfe3e6"/><path d="M28 3l-3 0-14 14 3 3L28 6z" fill="#c9ced2"/><path d="M15 21l5-5 3 3-5 5z" fill="#b8892f"/><path d="M17 21l-5-5-3 3 5 5z" fill="#b8892f"/><path d="M21 22l3-3 5 6-3 3z" fill="#6b4a2a"/><path d="M11 22l-3-3-5 6 3 3z" fill="#6b4a2a"/></g></svg>')}") 16 16, crosshair`;
// Screen-space drag rectangle; selected rings and order markers are projected
// from world positions each frame, so pan/zoom never change who was selected.
export class UnitSelection {
  constructor(scene){
    this.scene=scene;this.ids=new Set();this.graphics=scene.add.graphics().setDepth(1000000);this.overlay=scene.add.graphics().setDepth(1000001);
    this.panel=document.createElement('div');this.panel.id='unit-command-bar';this.panel.className='unit-command-bar';this.panel.hidden=true;this.panel.setAttribute('role','group');
    this.label=document.createElement('span');this.panel.append(this.label);this.buttons={};
    // Owner 16 Nov 2026: what is chosen, by kind – an icon and a count for each kind (a click keeps only that kind).
    this.kinds=document.createElement('span');this.kinds.className='unit-kinds';this.panel.append(this.kinds);
    for(const action of ['hold','resume','inspect','clear']){const button=document.createElement('button');button.type='button';button.dataset.unitCommand=action;button.addEventListener('click',()=>this.act(action));this.panel.append(button);this.buttons[action]=button;}
    // m-nosic-priorita: with several Haulers chosen, one choice of what they carry first sets it for all of them.
    this.haul=document.createElement('select');this.haul.id='unit-haul-priority';this.haul.hidden=true;this.panel.append(this.haul);
    this.haul.addEventListener('change',()=>{const p=haulPriorityFromValue(this.haul.value);for(const w of this.workers())if(w.profession==='hauler')setHaulPriority(w,p);this.signature=null;this.draw();});
    // Combat 16 Nov 2026: the stance of the chosen soldiers (aggressive, defensive, hold).
    this.stance=document.createElement('span');this.stance.className='unit-stance';this.stance.hidden=true;this.stanceButtons={};
    for(const id of ['aggressive','defensive','hold']){const b=document.createElement('button');b.type='button';b.dataset.stance=id;b.addEventListener('click',()=>{for(const w of this.workers())if(w.profession==='soldier'){if(id==='aggressive')delete w.stance;else w.stance=id;if(id==='hold'){w.path=[];delete w.huntWolfId;}}this.signature=null;this.draw();});this.stance.append(b);this.stanceButtons[id]=b;}
    // Battle test 18 Nov 2026, point 8: attack-move – armed with this button (or Ctrl held with the right click), the next
    // move order makes the soldiers fight every enemy they meet on the way and then go on.
    this.attackMove=false;this.attackButton=document.createElement('button');this.attackButton.type='button';this.attackButton.dataset.unitCommand='attackMove';this.attackButton.addEventListener('click',()=>{this.attackMove=!this.attackMove;this.signature=null;this.draw();});this.stance.append(this.attackButton);
    this.panel.append(this.stance);
    // Owner 17 Nov 2026: the formation the chosen men take when sent somewhere (holding the right button shows it and
    // turns it with the mouse).
    this.formation=DEFAULT_FORMATION;this.formationBar=document.createElement('span');this.formationBar.className='unit-formation';this.formationBar.hidden=true;this.formationButtons={};
    for(const id of FORMATIONS){const b=document.createElement('button');b.type='button';b.dataset.formation=id;b.addEventListener('click',()=>{this.formation=id;this.signature=null;this.draw();});this.formationBar.append(b);this.formationButtons[id]=b;}
    this.panel.append(this.formationBar);this.blueprint=scene.add.graphics().setDepth(1000001);
    // Combat 16 Nov 2026: groups on the number keys – Shift + 1–9 makes the chosen soldiers group N, 1–9 chooses it
    // (twice quickly: the camera goes to it). Ctrl + number belongs to the browser (tabs). Without such a group the keys
    // 1–3 keep setting the speed.
    this.keys=new AbortController();
    globalThis.addEventListener?.('keydown',event=>this.groupKey(event),{capture:true,signal:this.keys.signal});
    document.querySelector('#game')?.append(this.panel);
    if(!this.panel.isConnected)scene.game.canvas.parentElement.append(this.panel);
  }
  groupKey(event){
    const n=/^Digit([1-9])$/.exec(event.code)?.[1];if(!n||event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;
    if(document.querySelector('dialog[open]')||/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName??''))return;
    const s=this.scene,id=Number(n);if(s.gameOver||s.buildMode)return;
    if(event.shiftKey){const chosen=this.workers().filter(w=>w.profession==='soldier');if(!chosen.length)return;event.preventDefault();event.stopImmediatePropagation();
      setSquad(s,chosen,id);s.setStatus?.(t('army.groupSaved',{number:id,count:chosen.length}));this.signature=null;this.draw();return;}
    const members=squadMembers(s,id).filter(w=>w.isAlive&&!w.away);if(!members.length)return;
    event.preventDefault();event.stopImmediatePropagation();
    const now=globalThis.performance?.now?.()??Date.now(),again=this.lastGroup===id&&now-(this.lastGroupAt??0)<450;this.lastGroup=id;this.lastGroupAt=now;
    this.set(members);if(again){const c=members.reduce((a,w)=>({x:a.x+w.tile.x/members.length,y:a.y+w.tile.y/members.length}),{x:0,y:0});s.worldCamera?.lookAt?.({x:Math.round(c.x),y:Math.round(c.y)});}
    s.setStatus?.(t('army.groupChosen',{number:id,count:members.length}));
  }
  kindIcon(kind){return KIND_ICONS[kind]??KIND_ICONS[kind.split(':')[0]]??'👤';}
  kindName(kind){if(kind==='king')return t('command.king');const [p,type]=kind.split(':');if(p==='soldier')return type==='recruit'?t('unit.recruit'):t(`unit.type.${type}`);return JOBS[p]?.name??p;}
  drawKinds(workers){
    this.missingPicture=false;if(this.kindsFor!==workers.length){this.kindsFor=workers.length;this.pictureTries=0;}const counts=new Map();if(this.king)counts.set('king',1);for(const w of workers){const k=this.kindOf(w);counts.set(k,(counts.get(k)??0)+1);}
    const order=[...counts].sort((a,b)=>(a[0]==='king'?-1:b[0]==='king'?1:0)||(a[0].startsWith('soldier')===b[0].startsWith('soldier')?b[1]-a[1]:a[0].startsWith('soldier')?-1:1));
    this.kinds.replaceChildren(...order.map(([kind,n])=>{const b=document.createElement('button');b.type='button';b.className='unit-kind';b.dataset.kind=kind;iconButton(b,'',`${this.kindName(kind)}: ${n}`,t('command.kindTip'));b.textContent='';
      // Owner 17 Nov 2026: a box with the unit's picture and the count (the emoji when there is no picture yet).
      const pic=this.kindPicture(kind,workers);if(!pic&&kind!=='king')this.missingPicture=true;const i=document.createElement('span');i.className='unit-kind-icon';if(pic){const img=document.createElement('img');img.src=pic;img.alt='';i.append(img);}else i.textContent=this.kindIcon(kind);
      const c=document.createElement('b');c.textContent=String(n);b.append(i,c);
      {const gear=this.kindGear(kind,workers);if(gear.length){const g=document.createElement('span');g.className='unit-kind-gear';for(const id of gear){const e=document.createElement('i');e.className=`gear-${id}`;e.innerHTML=GEAR_ICONS[id];g.append(e);}b.append(g);const names=gear.map(id=>t(`object.${id}.name`)).join(' · ');b.dataset.tipTitle=`${b.dataset.tipTitle} · ${names}`;b.setAttribute('aria-label',`${b.getAttribute('aria-label')} · ${names}`);}}
      b.addEventListener('click',()=>{if(kind==='king')this.set([this.scene.character]);else this.set(this.workers().filter(w=>this.kindOf(w)===kind));});
      // Owner 18 Nov 2026: a right click on a box takes that kind out of the selection.
      b.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();this.dropKind(kind);});return b;}));
    this.kinds.hidden=counts.size===0;
  }
  // The standing picture of a kind (its first chosen man's look, facing the viewer), cut from the loaded sheet.
  kindPicture(kind,workers){
    const s=this.scene,w=kind==='king'?null:workers.find(u=>this.kindOf(u)===kind),look=w?.view?.look,art=look?lookArt(look):null,key=look?walkKey(look):null;
    if(!art?.walk||!s?.textures?.exists?.(key))return null;const cache=this.pictures??=new Map();if(cache.has(look))return cache.get(look);
    try{const frame=s.textures.getFrame(key,0),src=frame?.source?.image;if(!src)return null;const W=36,H=50,ax=Math.round(art.walk.origin.x*art.walk.frameWidth),ay=Math.round(art.walk.origin.y*art.walk.frameHeight);
      const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
      const z=1/(art.walk.scale??1);ctx.imageSmoothingEnabled=z>1;ctx.drawImage(src,frame.cutX+ax-W*z/2,frame.cutY+ay-(H-3)*z,W*z,H*z,0,0,W,H);const url=canvas.toDataURL();cache.set(look,url);return url;}catch{return null;}
  }
  // The weapon and armour of a kind (from one of its men).
  kindGear(kind,workers){if(!kind.startsWith('soldier:'))return [];const w=workers.find(u=>this.kindOf(u)===kind);return gearOf(this.scene.military?.unit?.(w)?.equipment);}
  kindOf(w){return w.profession==='soldier'?`soldier:${this.scene.military?.unit?.(w)?.type??'recruit'}`:w.profession;}
  workers(){return [...this.ids].map(id=>this.scene.workerSystem.workers.get(id)).filter(w=>this.scene.workerSystem.commands.selectable(w));}
  // m-kral-vyber (point 52): the King is selected like the others (click or drag) and ordered with the right button.
  set(workers){this.king=workers.includes(this.scene.character)&&this.scene.character.isAlive&&!this.scene.character.away;this.ids=new Set(workers.filter(w=>this.scene.workerSystem.commands.selectable(w)).map(w=>w.id));this.draw();}
  // Takes one kind (or the King) out of the selection.
  dropKind(kind){if(kind==='king'){this.king=false;this.draw();return;}const rest=this.workers().filter(w=>this.kindOf(w)!==kind);if(!rest.length&&!this.king){this.clear();return;}this.ids=new Set(rest.map(w=>w.id));this.draw();}
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
          if(enemy&&fighters.length){for(const w of fighters){s.workerSystem.commands.resume(w);s.military?.wallPatrol?.set(w,false);}if(s.military?.orderAttack)s.military.orderAttack(fighters,enemy);else for(const w of fighters){w.huntWolfId=enemy.id;w.militaryRetarget=0;}s.setStatus(t('army.attack',{count:fighters.length,name:enemy.definition.name}));if(this.king)s.kingOrder(pointer);this.draw();return true;}}
        // Owner 18 Nov 2026: a right click on an enemy building (a wall, Tower, Gate or house of the enemy) sends the selected
        // melee soldiers to break it; archers stay where they are.
        {const siege=this.siegeAt(pointer),fighters=this.workers().filter(w=>w.profession==='soldier');
          if(siege&&fighters.length){const n=s.military?.siege?.order(fighters,siege)??0,last=s.military?.siege?.lastOrder,fire=n&&last?.archers&&!last.melee&&!last.engines;s.setStatus(t(fire?'siege.orderFire':n?'siege.order':'siege.noMelee',{count:fire?last.archers:n,name:buildingDefinition(siege).name}));if(this.king)s.kingOrder(pointer);this.draw();return true;}}
        // Owner 17 Nov 2026 ("I click the Tower and the soldier goes to the meadow behind it"): a Tower or a Gate stands
        // high over its tiles, so the click is matched to the building's picture (as for the King), not only to the
        // tile under the pointer.
        const tile=s.pointerTile(pointer);pointer.updateWorldPoint?.(s.cameras.main);const postable=b=>!!b&&buildingIsComplete(b)&&(isWall(b)||['tower','gate','wall_gate'].includes(b.type));
        const picked=s.towerAtPoint?.(pointer.worldX,pointer.worldY,tile),target=postable(picked)?picked:tile&&s.buildings.find(b=>postable(b)&&b.tiles?.some(tl=>tl.x===tile.x&&tl.y===tile.y)),soldiers=this.workers().filter(w=>w.profession==='soldier');
        if(target&&(soldiers.length||this.king)){if(this.king)s.kingOrder(pointer);if(!soldiers.length){this.draw();return true;}
          const posted=s.military?.wallPatrol?.post(soldiers,target)??0;if(posted){s.setStatus(t('army.posted',{count:posted,name:buildingDefinition(target).name}));this.draw();return true;}s.setStatus(t('army.postNoWay'));return true;}
        // Owner 17 Nov 2026: the order is given when the button goes up; while it is held the blueprint shows the places
        // and dragging turns it.
        if(this.ids.size){const tile=s.pointerTile(pointer);pointer.updateWorldPoint(s.cameras.main);this.order={tile,x:pointer.x,y:pointer.y,world:{x:pointer.worldX,y:pointer.worldY},facing:null,attack:!!pointer.event?.ctrlKey};this.drawOrder();}
        if(this.king)s.kingOrder(pointer);return true;}
      return false;
    }
    if(!pointer.leftButtonDown())return false;
    this.anchor={x:pointer.x,y:pointer.y};this.dragging=false;return true;
  }
  move(pointer){this.hover(pointer);
    if(this.order){if(!pointer.rightButtonDown()){this.giveOrder();}else if(Math.hypot(pointer.x-this.order.x,pointer.y-this.order.y)>14){pointer.updateWorldPoint(this.scene.cameras.main);
      const a=worldToGrid(this.order.world.x,this.order.world.y),b=worldToGrid(pointer.worldX,pointer.worldY);this.order.facing={x:b.x-a.x,y:b.y-a.y};this.drawOrder();}}
    if(!this.anchor)return;this.current={x:pointer.x,y:pointer.y};if(Math.hypot(pointer.x-this.anchor.x,pointer.y-this.anchor.y)>6)this.dragging=true;this.draw();}
  up(pointer){
    if(this.order&&!pointer.rightButtonDown()){this.giveOrder();return true;}
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
      else if(hit?.kind==='human'&&s.workerSystem.commands.selectable(hit.object)){
        // Owner 16 Nov 2026: a double click chooses every unit of the same kind on screen (soldiers by unit type).
        const now=globalThis.performance?.now?.()??Date.now(),same=this.lastClick&&now-this.lastClick.at<DOUBLE_CLICK_MS&&this.lastClick.id===hit.object.id;this.lastClick={at:now,id:hit.object.id};
        if(same){const kind=this.kindOf(hit.object),view=s.cameras.main.worldView,all=s.workerSystem.liveSubjects().filter(w=>!w.away&&s.workerSystem.commands.selectable(w)&&this.kindOf(w)===kind&&view.contains(w.view.x,w.view.y));
          this.set(all);if(s.unitPanel?.dialog?.open)s.unitPanel.close();s.setStatus?.(t('command.sameKind',{count:all.length}));}
        else{this.set([hit.object]);s.unitPanel?.open(hit.object);}}
      else{this.clear();if(s.unitPanel?.dialog.open&&s.unitPanel.unit?.id!=null&&s.workerSystem.workers.get(s.unitPanel.unit.id)===s.unitPanel.unit)s.unitPanel.close();s.handleClick(pointer,true);}
    }
    this.dragging=false;this.draw();return true;
  }
  // The facing a plain click gives: from the group's middle to the clicked tile.
  orderFacing(){const o=this.order,w=this.workers();if(o.facing)return o.facing;if(!w.length)return {x:1,y:0};const m={x:w.reduce((n,u)=>n+u.tile.x,0)/w.length,y:w.reduce((n,u)=>n+u.tile.y,0)/w.length};return {x:o.tile.x-m.x,y:o.tile.y-m.y};}
  giveOrder(){
    const o=this.order,s=this.scene;this.order=null;this.blueprint.clear();if(!o?.tile||!this.ids.size)return;
    const attack=!!(this.attackMove||o.attack)&&this.workers().some(w=>w.profession==='soldier'),count=s.workerSystem.commands.move(this.workers(),o.tile,{formation:this.formation,facing:o.facing??null,attack});s.setStatus(t(count?(attack?'command.attackMoving':'command.moving'):'command.noRoute',{count}));if(this.attackMove){this.attackMove=false;this.signature=null;}this.draw();
  }
  // The blueprint: a ring for each place of the formation and an arrow the way the men will face.
  drawOrder(){
    const o=this.order,s=this.scene,g=this.blueprint,z=s.cameras.main.zoom||1;g.clear();if(!o?.tile)return;const n=this.workers().length;
    const base=knownMap(s),open=(x,y)=>base[y]?.[x]===0,facing=this.orderFacing();
    const tiles=this.formation==='loose'||n<2?[o.tile]:formationTiles(this.formation,n,o.tile,facing,open);
    for(const tile of tiles){const p=tileCenter(tile);g.fillStyle(0xffd768,.18).fillEllipse(p.x,p.y,22,11).lineStyle(1.2/z,0xffd768,.8).strokeEllipse(p.x,p.y,22,11);}
    if(this.formation!=='loose'&&n>1){const len=Math.hypot(facing.x,facing.y)||1,c=tileCenter(o.tile),tip=tileCenter({x:o.tile.x+facing.x/len*2.2,y:o.tile.y+facing.y/len*2.2}),dx=tip.x-c.x,dy=tip.y-c.y,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l;
      g.lineStyle(2/z,0xffd768,.9).lineBetween(c.x,c.y,tip.x,tip.y).fillStyle(0xffd768,.9).fillTriangle(tip.x+ux*6,tip.y+uy*6,tip.x-uy*5,tip.y+ux*5,tip.x+uy*5,tip.y-ux*5);}
  }
  // The King's picture as a click target (his view is a container; a little room around it helps on small zoom).
  onKing(x,y){const b=this.scene.player?.getBounds?.();return !!b&&this.scene.character.state==='ground'&&x>=b.x-6&&x<=b.x+b.width+6&&y>=b.y-24&&y<=b.y+b.height+4;}
  // An enemy under the pointer that soldiers may be sent at.
  siegeAt(pointer){const s=this.scene;if(!s.military?.siege)return null;pointer.updateWorldPoint(s.cameras.main);return s.military.siege.at(pointer.worldX,pointer.worldY,s.pointerTile(pointer));}
  enemyAt(pointer){const s=this.scene;pointer.updateWorldPoint(s.cameras.main);const a=s.animalSystem?.atPoint(pointer.worldX,pointer.worldY);return a&&a.isAlive&&isEnemy(a)&&s.fog.isVisibleObject(a)?a:null;}
  // The pointer turns into crossed swords over an enemy while soldiers are selected.
  hover(pointer){const s=this.scene,canvas=s.game.canvas;if(s.buildMode||s.rockMiningTool?.enabled)return;const attack=this.ids.size>0&&this.workers().some(w=>w.profession==='soldier')&&(!!this.enemyAt(pointer)||!!this.siegeAt(pointer));
    if(attack!==this.attackCursor){this.attackCursor=attack;canvas.style.cursor=attack?ATTACK_CURSOR:'';}}
  // Owner 16 Nov 2026: the bar sits above the build bar at the bottom of the screen, never behind it.
  placeAboveBar(doc=globalThis.document){
    const host=this.panel.offsetParent;if(!host||!doc?.querySelectorAll)return;const h=host.getBoundingClientRect();
    // Owner 17 Nov 2026: with soldiers chosen the bar opens out of the Army tab – from the left edge to the tab, joined
    // to it like an open tab.
    const tab=doc.querySelector?.('#army-tab'),r=tab&&!tab.hidden&&this.workers?.().some(w=>w.profession==='soldier')?tab.getBoundingClientRect():null,width=r?Math.round(r.right-h.left-8):0;
    if(r&&r.height&&width>=320&&r.top>h.top+h.height/2){this.panel.classList?.add('docked');tab.classList.add('joined');Object.assign(this.panel.style,{left:'8px',width:`${width}px`,bottom:`${Math.round(h.bottom-r.top)}px`});this.panel.style.setProperty?.('--neck',`${Math.round(r.width)}px`);this.dockedTab=tab;return;}
    this.undock?.();
    // The build bar and the status line above it, when they sit in the lower half of the screen.
    const tops=[...doc.querySelectorAll('.buildings-bar,.status-row')].map(e=>e.getBoundingClientRect()).filter(r=>r.height&&r.top>h.top+h.height/2).map(r=>r.top);
    this.panel.style.bottom=tops.length?`${Math.max(16,Math.round(h.bottom-Math.min(...tops)+8))}px`:'';
  }
  undock(){this.panel.classList?.remove('docked');this.dockedTab?.classList.remove('joined');this.dockedTab=null;if(this.panel.style){this.panel.style.left='';this.panel.style.width='';}}
  cancelDrag(){this.anchor=null;this.dragging=false;this.overlay.clear();}
  draw(){
    const s=this.scene,workers=this.workers();this.ids=new Set(workers.map(w=>w.id));this.graphics.clear();this.overlay.clear();
    // The open detail of the one selected villager already carries his commands.
    const detail=workers.length===1&&!!s.unitPanel?.dialog.open&&s.unitPanel.unit===workers[0];
    const count=workers.length+(this.king?1:0);if(this.king&&(!s.character.isAlive||s.character.away))this.king=false;
    const signature=JSON.stringify([this.formation,this.king,workers.map(w=>w.id+':'+w.profession+':'+haulPriorityValue(w.haulPriority)+':'+(w.stance??'')),s.gameOver,s.gameTime.paused,language(),detail]);
    // A picture missing (the sheet or the man's look not ready yet) is tried again shortly.
    if(this.missingPicture&&signature===this.signature){const now=globalThis.performance?.now?.()??0;if(now-(this.pictureTry??0)>600&&(this.pictureTries=(this.pictureTries??0)+1)<=10){this.pictureTry=now;this.signature=null;}}
    if(!this.panel.hidden&&signature===this.signature){const now=globalThis.performance?.now?.()??0;if(now-(this.placedAt??0)>700){this.placedAt=now;this.placeAboveBar();}}
    if(signature!==this.signature){
      this.signature=signature;this.panel.hidden=!count||!!s.gameOver||detail||(this.king&&!workers.length&&!!s.unitPanel?.dialog.open);if(this.panel.hidden)this.undock();this.panel.setAttribute('aria-label',t('command.title'));this.label.textContent=t('command.selected',{count});this.drawKinds(workers);
      for(const [action,button]of Object.entries(this.buttons))iconButton(button,COMMAND_ICONS[action],t(`command.${action}`),t(`command.${action}Tip`));
      this.buttons.inspect.disabled=workers.length!==1;
      {const soldiers=workers.filter(w=>w.profession==='soldier');this.stance.hidden=!soldiers.length;if(soldiers.length){const now=new Set(soldiers.map(w=>w.stance??'aggressive'));
        for(const [id,b] of Object.entries(this.stanceButtons)){iconButton(b,STANCE_ICONS[id],t(`army.stance.${id}`),t(`army.stance.${id}Tip`));b.classList.toggle('on',now.size===1&&now.has(id));}
        iconButton(this.attackButton,'🏹➜',t('command.attackMove'),t('command.attackMoveTip'));this.attackButton.classList.toggle('on',this.attackMove);}
        this.formationBar.hidden=workers.length<2;for(const [id,b] of Object.entries(this.formationButtons)){iconButton(b,FORMATION_ICONS[id],t(`army.formation.${id}`),`${t(`army.formation.${id}Tip`)} ${t('command.formationHint')}`);b.classList.toggle('on',this.formation===id);}}if(!this.panel.hidden)this.placeAboveBar();
      const haulers=workers.filter(w=>w.profession==='hauler');this.haul.hidden=haulers.length<2;
      if(!this.haul.hidden){const option=(v,text)=>{const o=document.createElement('option');o.value=v;o.textContent=text;return o;};
        this.haul.setAttribute('aria-label',t('haul.priority'));this.haul.replaceChildren(option('',t('haul.priority')+'…'),...HAUL_PRIORITIES.filter(k=>k!=='resource').map(k=>option(k,t(`haul.priority.${k}`))),...HAULABLE_RESOURCES.map(r=>option(`resource:${r}`,t('haul.priority.only',{resource:s.objectRegistry.get(r)?.name??r}))));
        const values=new Set(haulers.map(w=>haulPriorityValue(w.haulPriority)));this.haul.value=values.size===1?[...values][0]:'';}this.buttons.hold.disabled=this.buttons.resume.disabled=!!s.gameTime.paused;
    }
    const zoom=s.cameras.main.zoom;
    // Owner 16 Nov 2026: the ring was too strong; a thin, half-transparent ring at the feet is enough.
    if(this.king&&s.player)this.graphics.lineStyle(1.25/zoom,0xffd768,.6).strokeEllipse(s.player.x,s.player.y,28,12);
    for(const w of workers){
      this.graphics.lineStyle(1.25/zoom,0xffd768,.55).strokeEllipse(w.view.x,w.view.y,24,10);
      const goal=w.commandState?.goal;if(goal){const p=tileCenter(goal);this.graphics.lineStyle(1/zoom,0xffd768,.35).strokeEllipse(p.x,p.y,16,8);}
      // Owner 17 Nov 2026: a soldier sent to a wall, Tower or Gate shows where he goes up there, like on the ground.
      const post=s.military?.wallPatrol?.postPoint?.(w);if(post)this.graphics.lineStyle(1/zoom,0xffd768,.5).strokeEllipse(post.x,post.y,16,8);
    }
    // Owner 16 Nov 2026: drawn in the world from the same camera points the selection uses, so the box stays under the
    // pointer at every zoom (a scroll-free overlay is still zoomed around the screen middle).
    if(this.anchor&&this.dragging&&this.current){const cam=s.cameras.main,a=cam.getWorldPoint(this.anchor.x,this.anchor.y),b=cam.getWorldPoint(this.current.x,this.current.y);this.overlay.lineStyle(1/(cam.zoom||1),0xffd768,1).fillStyle(0xffd768,.12).fillRect(a.x,a.y,b.x-a.x,b.y-a.y).strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);}
  }
  destroy(){this.keys?.abort();this.graphics.destroy();this.overlay.destroy();this.blueprint?.destroy();this.panel.remove();}
}
