import { WORLD_BOUNDS, clampMapCenter } from './isometric.js';

export const MIN_ZOOM = 0.45;
export const MAX_ZOOM = 1.8;

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
      this.camera.centerOn(center.x,center.y);this.camera.preRender();
    };
    this.syncSize();
    this.resizeObserver=new ResizeObserver(this.syncSize);
    this.resizeObserver.observe(scene.scale.parent);
    this.following = true;
    this.keys = scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE');
    this.camera.setBounds(WORLD_BOUNDS.x, WORLD_BOUNDS.y, WORLD_BOUNDS.width, WORLD_BOUNDS.height);
    this.camera.setZoom(1);
    this.camera.centerOn(target.x, target.y - 25);
    this.camera.preRender();
    this.wheel = (pointer, objects, dx, dy) => this.zoom(dy);
    this.recenter = () => this.follow();
    scene.input.on('wheel', this.wheel);
    scene.input.keyboard.on('keydown-SPACE', this.recenter);
    document.querySelector('#follow-king').addEventListener('click', this.recenter);
  }

  follow() {
    this.following = true;
    document.querySelector('#camera-mode').textContent = 'Kamera sleduje krále';
  }

  zoom(delta) {
    this.camera.setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.camera.zoom * Math.exp(-delta * 0.001))));
    this.camera.preRender();
  }

  update(delta) {
    const k = this.keys, camera = this.camera;
    let dx = Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown);
    let dy = Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown);
    let x = camera.scrollX + camera.width / 2, y = camera.scrollY + camera.height / 2;
    if (dx || dy) {
      if (this.following) document.querySelector('#camera-mode').textContent = 'Ruční posun · mezerník vrátí krále';
      this.following = false;
      const amount = 650 * delta / 1000 / camera.zoom / Math.hypot(dx, dy);
      x += dx * amount; y += dy * amount;
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
