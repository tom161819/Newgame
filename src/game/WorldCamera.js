import { t } from '../i18n/index.js';
import { WORLD_BOUNDS, clampMapCenter, gridToWorld } from './isometric.js';
import { buildingDefinition } from './buildings.js';
import { MIN_ZOOM,MAX_ZOOM,DEFAULT_ZOOM,ZOOM_RESPONSE_MS,clampZoom } from '../data/camera.js';
export { MIN_ZOOM,MAX_ZOOM } from '../data/camera.js';

export class WorldCamera {
  constructor(scene, target) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.target = target;
    // Lišta může změnit výšku i bez změny okna (např. další surovina na mobilu).
    // Rozměry plátna a vstupní souřadnice musí odpovídat aktuálnímu layoutu.
    this.syncSize=()=>{
      const center={x:this.camera.scrollX+this.camera.width/2,y:this.camera.scrollY+this.camera.height/2};
      if(scene.scale.getParentBounds())scene.scale.refresh();
      else scene.scale.updateBounds();
      this.syncZoom();this.camera.centerOn(center.x,center.y);this.camera.preRender();
    };
    this.syncSize();
    this.resizeObserver=new ResizeObserver(this.syncSize);
    this.resizeObserver.observe(scene.scale.parent);
    this.following = true;
    this.keys = scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE');
    this.camera.setBounds(WORLD_BOUNDS.x, WORLD_BOUNDS.y, WORLD_BOUNDS.width, WORLD_BOUNDS.height);
    this.camera.setZoom(DEFAULT_ZOOM);this.zoomTarget=DEFAULT_ZOOM;this.lastZoom=DEFAULT_ZOOM;
    this.camera.centerOn(target.x, target.y - 25);
    this.camera.preRender();
    // m-staveni-zdi-studna (59): Shift+wheel turns a Gate being placed instead of zooming (one turn per 200 ms).
    this.wheel = (pointer, objects, dx, dy) => {
      if (pointer.event?.shiftKey && scene.buildMode && ['wall_gate','tower'].includes(scene.selectedBuilding?.id)) { const now = performance.now(); if (now - (this.lastGateTurn ?? -1e9) > 200) { this.lastGateTurn = now; scene.rotateGate(); } return; }
      this.zoom(dy);
    };
    this.recenter = () => this.follow();
    scene.input.on('wheel', this.wheel);
    scene.input.keyboard.on('keydown-SPACE', this.recenter);
    document.querySelector('#follow-king').addEventListener('click', this.recenter);
  }

  follow() {
    this.following = true;this.panTarget=null;
    document.querySelector('#camera-mode').textContent = t('hud.cameraKing');
  }

  // m-drevorubci-stromy / m-zelezny-dul-misto: a notice link pans the camera to a grid point (manual camera, like the minimap).
  lookAt(point){
    if(!point||this.scene.gameOver)return false;const p=gridToWorld(point.x,point.y);this.panTarget=clampMapCenter(p.x,p.y-25);this.following=false;
    const mode=document.querySelector('#camera-mode');if(mode)mode.textContent=t('hud.cameraManual');return true;
  }

  locate(unit){
    // m-obyvatele-jmena-spanek-pohyb (42): a resident asleep inside is found at his House (or the Castle).
    const shelter=unit.sleepingIn!=null?this.scene.buildings?.find(b=>b.id===unit.sleepingIn):null;
    if(shelter){const d=buildingDefinition(shelter);if(!unit.isAlive||!this.scene.fog.isVisibleObject(shelter))return false;
      const p=gridToWorld(shelter.x+d.width/2,shelter.y+d.height/2);this.panTarget=clampMapCenter(p.x,p.y-25);this.following=false;document.querySelector('#camera-mode').textContent=t('hud.cameraSleeping',{name:unit.name,building:d.name});return true;}
    const view=unit.view??unit.sprite;
    if(!unit.isAlive||!view||!this.scene.fog.isVisibleObject(unit))return false;
    // Capture an allowed, currently seen point. Never track a hidden actor.
    this.panTarget=clampMapCenter(view.x,view.y-25);this.following=false;
    document.querySelector('#camera-mode').textContent=t('hud.cameraUnit',{name:unit.name??unit.definition.name});
    return true;
  }

  zoom(delta) {
    if(!Number.isFinite(delta)||this.scene.gameTime?.paused||this.scene.gameOver)return;
    this.syncZoom();this.zoomTarget=Math.max(this.minimumZoom(),clampZoom(this.zoomTarget*Math.exp(-delta*.001)));
  }

  minimumZoom(){return Math.min(MAX_ZOOM,Math.max(MIN_ZOOM,this.camera.width/WORLD_BOUNDS.width,this.camera.height/WORLD_BOUNDS.height));}
  syncZoom(){
    // Restored games and explicitly positioned test/editor cameras set Phaser's
    // zoom directly. Adopt that value instead of pulling them back next frame.
    const minimum=this.minimumZoom();if(this.camera.zoom<minimum)this.camera.setZoom(minimum);
    if(this.lastZoom!==this.camera.zoom||!Number.isFinite(this.zoomTarget)){this.lastZoom=this.camera.zoom;this.zoomTarget=Math.max(minimum,clampZoom(this.camera.zoom));}
    this.zoomTarget=Math.max(minimum,this.zoomTarget);
  }

  update(delta) {
    this.syncZoom();const distance=this.zoomTarget-this.camera.zoom;
    if(Math.abs(distance)>0){const next=this.camera.zoom+distance*(1-Math.exp(-Math.max(0,delta)/ZOOM_RESPONSE_MS));this.camera.setZoom(Math.abs(next-this.zoomTarget)<1e-4?this.zoomTarget:next);this.lastZoom=this.camera.zoom;}
    const k = this.keys, camera = this.camera;
    let dx = Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown);
    let dy = Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown);
    let x = camera.scrollX + camera.width / 2, y = camera.scrollY + camera.height / 2;
    if (dx || dy) {
      if (this.following) document.querySelector('#camera-mode').textContent = t('hud.cameraManual');
      this.following = false;
      this.panTarget=null;
      const amount = 650 * delta / 1000 / camera.zoom / Math.hypot(dx, dy);
      x += dx * amount; y += dy * amount;
    } else if(this.panTarget){
      const ease=1-Math.exp(-delta/140);x+=(this.panTarget.x-x)*ease;y+=(this.panTarget.y-y)*ease;
      if(Math.hypot(x-this.panTarget.x,y-this.panTarget.y)<.5)this.panTarget=null;
    } else if (this.following) {
      const ease = 1 - Math.exp(-delta / 140);
      x += (this.target.x - x) * ease;
      y += (this.target.y - 25 - y) * ease;
    }
    const center = clampMapCenter(x, y);
    camera.centerOn(center.x, center.y);
    camera.preRender();
  }

  destroy() {
    this.resizeObserver.disconnect();
    this.scene.input.off('wheel', this.wheel);
    this.scene.input.keyboard.off('keydown-SPACE', this.recenter);
    document.querySelector('#follow-king').removeEventListener('click', this.recenter);
  }
}
