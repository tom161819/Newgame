import { gridToWorld, worldToGrid } from './isometric.js';
import { COLUMNS, ROWS } from './config.js';
import { GROUND } from '../data/worldTerrain.js';
import { makeWaterField, duckSites, ducklingsFor, drawDuck } from '../render/continuousGround.js';
import groundStyle from '../data/groundStyle.json' with { type: 'json' };

// g-kachny-proud-hra (owner 8 Nov 2026, from the World Lab round 8): short bright streaks drift with the current over
// visible river water, and three duck families paddle slow loops; in spring and summer ducklings follow in a line.
// Purely visual, nothing under the fog, nothing saved. Fish stay the game's own FishShadows.
const DEPTH = { [GROUND.FORD]: 0.15, [GROUND.SHALLOW]: 0.5, [GROUND.DEEP]: 1 }, CHUNK = 16, DIRS = 16;
const DUCK = 'water:duck', FRAME = 30, SEASON_YEAR = { Winter: 0.02, Spring: 0.3, Summer: 0.5, Autumn: 0.76 };
const FLOW = groundStyle.settings?.flow ?? 0.6;

export class RiverLife {
  constructor(scene) {
    this.scene = scene; this.fields = new Map(); this.streaks = []; this.time = 0;
    this.graphics = scene.add.graphics().setDepth(-66);
    this.reduce = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.ensureTexture();
    const g = scene.groundGrid, water = (x, y) => (g?.[y]?.[x] === GROUND.SHALLOW || g?.[y]?.[x] === GROUND.DEEP);
    this.sites = g ? duckSites({ ground: g }, 3, water) : [];
    this.ducks = this.sites.map(() => Array.from({ length: 7 }, (_, n) => scene.add.image(0, 0, DUCK, 0).setDepth(-63).setVisible(false).setScale(n ? 0.55 : 1)));
  }
  // One sheet: adult row, duckling row; DIRS headings drawn with the World Lab's drawDuck.
  ensureTexture() {
    const textures = this.scene.textures; if (textures.exists(DUCK)) return;
    const canvas = document.createElement('canvas'); canvas.width = FRAME * DIRS; canvas.height = FRAME * 2; const ctx = canvas.getContext('2d');
    for (let row = 0; row < 2; row++) for (let k = 0; k < DIRS; k++) drawDuck(ctx, k * FRAME + FRAME / 2, row * FRAME + FRAME * 0.62, k / DIRS * Math.PI * 2, 1.7, false, row === 1);
    const texture = textures.addCanvas(DUCK, canvas); for (let row = 0; row < 2; row++) for (let k = 0; k < DIRS; k++) texture.add(row * DIRS + k, 0, k * FRAME, row * FRAME, FRAME, FRAME);
  }
  depthAt(x, y) { const g = this.scene.groundGrid?.[Math.max(0, Math.min(ROWS - 1, y))]?.[Math.max(0, Math.min(COLUMNS - 1, x))]; return DEPTH[g] ?? -1; }
  field(x, y) {
    const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK), key = `${cx},${cy}`;
    let f = this.fields.get(key); if (!f) { f = makeWaterField({ x0: cx * CHUNK, y0: cy * CHUNK, span: CHUNK, depthAt: (a, b) => this.depthAt(a, b), settings: groundStyle.settings }); this.fields.set(key, f); }
    return f;
  }
  visible(x, y) { const fog = this.scene.fog; return !fog || fog.isVisibleTile({ x: Math.floor(x), y: Math.floor(y) }); }
  update(delta) {
    const s = this.scene, g = this.graphics; g.clear();
    if (this.reduce || !s.groundGrid) return;
    const step = Math.min(delta, 50) / 16.7; this.time += delta / 1000;
    const v = s.cameras.main.worldView, c = [worldToGrid(v.x, v.y), worldToGrid(v.right, v.y), worldToGrid(v.x, v.bottom), worldToGrid(v.right, v.bottom)];
    const minX = Math.max(0, Math.min(...c.map(p => p.x))), maxX = Math.min(COLUMNS, Math.max(...c.map(p => p.x))), minY = Math.max(0, Math.min(...c.map(p => p.y))), maxY = Math.min(ROWS, Math.max(...c.map(p => p.y)));
    // Streaks: spawn on visible, not too shallow water in view; drift along the field's flow direction.
    const target = Math.round(160 * FLOW);
    for (let tries = 0; this.streaks.length < target && tries < 60; tries++) {
      const x = minX + Math.random() * (maxX - minX), y = minY + Math.random() * (maxY - minY);
      if (this.depthAt(Math.floor(x), Math.floor(y)) < 0.3 || !this.visible(x, y)) continue;
      const p = gridToWorld(x, y); if (p.x < v.x || p.x > v.right || p.y < v.y || p.y > v.bottom) continue;
      this.streaks.push({ x, y, age: 0, life: 40 + Math.random() * 60 });
    }
    for (const st of this.streaks) {
      const [tx, ty] = this.field(st.x, st.y).flow(st.x, st.y); st.x += tx * 0.012 * step; st.y += ty * 0.012 * step; st.age += step;
      const a = Math.sin(Math.PI * Math.min(1, st.age / st.life)) * 0.35 * FLOW, p = gridToWorld(st.x, st.y), q = gridToWorld(st.x - tx * 0.22, st.y - ty * 0.22);
      g.lineStyle(1, 0xebf0ec, a); g.lineBetween(p.x, p.y, q.x, q.y);
    }
    this.streaks = this.streaks.filter(st => st.age < st.life && this.depthAt(Math.floor(st.x), Math.floor(st.y)) >= 0.15 && this.visible(st.x, st.y));
    // Ducks: none in winter; ducklings from ducklingsFor (spring and summer).
    const year = SEASON_YEAR[s.seasons?.season ?? s.terrain?.season] ?? 0.5, winter = year < 0.12, little = ducklingsFor(year);
    for (const [i, d] of this.sites.entries()) {
      const path = t => { const a = t * 0.12 + i * 2.1, r = 1.1 + Math.sin(t * 0.07 + i) * 0.3; return [d.x + 0.5 + Math.cos(a) * r, d.y + 0.5 + Math.sin(a) * r * 0.8]; };
      for (const [n, img] of this.ducks[i].entries()) {
        const show = !winter && n <= little && (n === 0 || little > 0);
        if (!show) { img.setVisible(false); continue; }
        const t = this.time - n * 2.2, [fx, fy] = path(t), [ax, ay] = path(t + 0.2);
        if (!this.visible(fx, fy) || this.depthAt(Math.floor(fx), Math.floor(fy)) < 0) { img.setVisible(false); continue; }
        const p = gridToWorld(fx, fy), q = gridToWorld(ax, ay), dir = ((Math.atan2(q.y - p.y, q.x - p.x) / (Math.PI * 2)) % 1 + 1) % 1;
        img.setFrame((n ? DIRS : 0) + Math.round(dir * DIRS) % DIRS).setPosition(p.x, p.y - 4).setVisible(true);
      }
    }
  }
}
