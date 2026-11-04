import { towerBase, buildingDepth, buildingDefinition } from './buildings.js';

// Same flicker formula as the Asset Studio (studio/src/lib/lighting.js).
export function flicker(seconds, { amplitude, speed }, seed = 0) {
  const t = seconds * speed + seed * 12.9898;
  return 1 + amplitude * (Math.sin(t) * 0.5 + Math.sin(t * 2.31 + 1.7) * 0.3 + Math.sin(t * 5.17 + 0.4) * 0.2);
}

const FIRE = { glow: 0xffa040, body: 0xffb347, core: 0xfff1b8 };

// A building view plus runtime flames at definition.lights (pixel offsets from
// the building base). Everything else is delegated to the wrapped view.
export class LitBuildingView {
  constructor(scene, inner, building, system, seed = 1) {
    this.inner = inner; this.system = system; this.definition = buildingDefinition(building);
    this.base = towerBase(building); this.visible = true;
    this.lights = this.definition.lights.map((light, index) => ({ ...light, seed: seed + index }));
    this.flames = scene.add.graphics().setDepth(buildingDepth(building) + 0.35);
    this.drawFlames(0);
  }
  worldLights() { return this.lights.map(light => ({ ...light, x: this.base.x + light.x, y: this.base.y + light.y })); }
  drawFlames(seconds) {
    const g = this.flames.clear();
    for (const light of this.worldLights()) {
      const f = flicker(seconds * 1.6, light.flicker, light.seed), size = 7 * light.flameSize, sway = Math.sin(seconds * 9 + light.seed) * size * 0.1;
      g.fillStyle(FIRE.glow, 0.28); g.fillCircle(light.x, light.y - size * 0.35, size * 1.25 * f);
      g.fillStyle(FIRE.body, 0.95); g.fillEllipse(light.x + sway * 0.5, light.y - size * 0.4 * f, size * 0.95, size * 1.7 * f);
      g.fillStyle(FIRE.core, 1); g.fillEllipse(light.x + sway, light.y - size * 0.25, size * 0.45, size * 0.85);
    }
  }
  paint(building, tint = null) { this.inner.paint(building, tint); this.base = towerBase(building); this.drawFlames(this.system?.seconds ?? 0); }
  contains(x, y) { return this.inner.contains(x, y); }
  inView(view) { return this.inner.inView(view); }
  setVisible(value) { this.visible = !!value; this.inner.setVisible(value); this.flames.setVisible(value); return this; }
  setAlpha(value) { this.inner.setAlpha?.(value); this.flames.setAlpha(value); return this; }
  destroy() { this.system?.remove(this); this.inner.destroy(); this.flames.destroy(); }
}
