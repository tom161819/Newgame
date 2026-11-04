// Runtime light sources of completed buildings (definition.lights). Today it
// animates their flames; it already exposes every light in world space so the
// future day/night cycle only has to draw them into a light map (ambient fill +
// additive gradients, multiplied over the world; see docs/art/ASSET_STUDIO.md).
import { LitBuildingView, flicker } from '../game/LitBuildingView.js';

export { flicker };

export class LightSourceSystem {
  constructor(scene) { this.scene = scene; this.views = new Set(); this.seconds = 0; this.nextSeed = 1; }
  // Wraps a completed building's view; preview and construction views are never lit.
  attach(view, building) {
    const lit = new LitBuildingView(this.scene, view, building, this, this.nextSeed);
    this.nextSeed += lit.lights.length;
    this.views.add(lit);
    return lit;
  }
  remove(view) { this.views.delete(view); }
  // Active game time only: the scene does not call update while paused.
  update(delta) {
    this.seconds += Math.max(0, delta) / 1000;
    const camera = this.scene.cameras?.main?.worldView;
    for (const view of this.views) if (view.visible && (!camera || view.inView(camera))) view.drawFlames(this.seconds);
  }
  // World-space light descriptors for the future light map.
  lights() {
    return [...this.views].flatMap(view => view.worldLights().map(light => ({ ...light, strength: flicker(this.seconds, light.flicker, light.seed) * light.intensity })));
  }
  destroy() { this.views.clear(); }
}
