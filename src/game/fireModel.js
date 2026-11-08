// Plan m-nasadit-schvalenou-grafiku: the Fire Lab's particle model (studio/src/fire-lab/fire.js, owner 7 Nov 2026),
// copied into the game like pathV2.js (game code never imports Studio code). Flames are additive soft blobs that cool
// from white-yellow through orange to deep red while they rise, smoke is grey puffs that grow and drift downwind,
// embers are sparks. The parameters come from the approved art/effects/fire.json (APPROVED_DEPLOY_ART.fire.params).
// Keep in step with the Studio file when the Fire Lab model changes.
const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const lerp = (a, b, t) => a + (b - a) * t;
export function flameColour(life, heat) {
  const stops = [[0, [255, 250, 225]], [0.12 + 0.12 * heat, [255, 214, 120]], [0.35 + 0.15 * heat, [255, 140, 40]], [0.7, [214, 66, 18]], [1, [90, 20, 8]]];
  for (let i = 1; i < stops.length; i++) if (life <= stops[i][0]) { const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (life - a) / (b - a); return ca.map((c, k) => Math.round(lerp(c, cb[k], t))); }
  return stops.at(-1)[1];
}
export class Fire {
  constructor(params, seed = 7) { this.p = { ...params }; this.rand = mulberry(seed); this.flames = []; this.smoke = []; this.embers = []; this.spots = []; this.age = 0; this.lit = false; this.dying = 0; this.time = 0; this.scale = 1; }
  setSpots(spots) { this.spots = spots; }
  ignite() { this.lit = true; this.age = 0; this.dying = 0; }
  activeSpots() {
    const n = this.spots.length; if (!n) return [];
    const grown = this.p.spread <= 0 ? n : Math.min(n, 1 + Math.floor(this.age * this.p.spread * 1.2));
    return this.spots.slice(0, grown);
  }
  // The game's fire intensity (0–1) scales how many flames are born; the Lab's own strength stays 1 while lit.
  strength() { return this.lit ? Math.max(0, 1 - this.dying) * this.scale : 0; }
  step(dt) {
    const p = this.p, r = this.rand; this.time += dt; if (this.lit) this.age += dt;
    const s = this.strength(), spots = this.activeSpots(), wind = p.wind * 40;
    if (s > 0) for (const spot of spots) {
      const born = (4 + 14 * p.intensity) * s * dt * (spot.w ?? 1);
      for (let k = 0; k < born + (r() < born % 1 ? 1 : 0) - (born % 1); k++) {
        const w = p.flameWidth * (0.5 + 0.7 * r()) * (0.55 + 0.45 * p.intensity);
        this.flames.push({ x: spot.x + (r() - 0.5) * p.flameWidth * 0.9, y: spot.y + (r() - 0.5) * 3, vx: (r() - 0.5) * 6, vy: -(p.flameHeight * (0.9 + 0.5 * r())) * 1.1, life: 0, span: 0.55 + 0.45 * r(), w, phase: r() * 6.28 });
      }
      const puffs = p.smoke * (8 + 14 * p.intensity) * dt * Math.max(0.35, s);
      for (let q = 0; q < Math.floor(puffs) + (r() < puffs % 1 ? 1 : 0); q++) this.smoke.push({ x: spot.x + (r() - 0.5) * 8, y: spot.y - p.flameHeight * 0.55, vx: (r() - 0.5) * 6, vy: -p.smokeRise * (0.7 + 0.5 * r()), life: 0, span: 3.2 + 2.5 * r(), size: p.smokeSize * (0.6 + 0.5 * r()), shade: r(), rot: r() * 6.28 });
      if (r() < p.embers * 6 * dt * s) this.embers.push({ x: spot.x + (r() - 0.5) * 10, y: spot.y - p.flameHeight * 0.3, vx: (r() - 0.5) * 40, vy: -60 - 90 * r(), life: 0, span: 1 + 1.5 * r() });
    }
    const turb = p.turbulence;
    for (const f of this.flames) { f.life += dt / f.span; f.vx += (Math.sin(this.time * 9 + f.phase) * 60 * turb + wind * 1.4 - f.vx * 2) * dt; f.x += f.vx * dt; f.y += f.vy * dt * (1 - f.life * 0.4); }
    for (const m of this.smoke) { m.life += dt / m.span; m.vx += (wind * 1.2 + Math.sin(this.time * 1.3 + m.rot) * 8 - m.vx * 0.4) * dt; m.x += m.vx * dt; m.y += m.vy * dt * (1 - m.life * 0.5); m.rot += dt * 0.3; }
    for (const e of this.embers) { e.life += dt / e.span; e.vx += (wind * 2 + (Math.sin(this.time * 17 + e.span * 9) * 50)) * dt; e.vy += 30 * dt; e.x += e.vx * dt; e.y += e.vy * dt; }
    this.flames = this.flames.filter(f => f.life < 1); this.smoke = this.smoke.filter(m => m.life < 1); this.embers = this.embers.filter(e => e.life < 1);
    if (this.flames.length > 1500) this.flames.splice(0, this.flames.length - 1500);
  }
  light() { const s = this.strength(), n = this.activeSpots().length; return s * (0.55 + 0.45 * Math.min(1, n / 6)) * this.p.glow * (0.85 + 0.15 * Math.sin(this.time * 13) * Math.sin(this.time * 7.3)); }
}
const brushes = new Map();
function brush(rgb, soft = 0.55) {
  const key = rgb.join(',') + soft; if (brushes.has(key)) return brushes.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(soft, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); brushes.set(key, c); return c;
}
export function drawSmoke(ctx, fire, ox, oy, k = 1) {
  const p = fire.p;
  for (const m of fire.smoke) {
    const a = Math.sin(Math.PI * Math.min(1, m.life * 1.1)) * 0.32 * (0.45 + 0.55 * p.smoke), grey = Math.round(lerp(150, 40, p.smokeDark * (0.6 + 0.4 * m.shade)) + m.life * 40);
    const size = m.size * (0.45 + m.life * 1.5) * k;
    ctx.globalAlpha = a; ctx.drawImage(brush([grey, grey - 4, grey - 8], 0.35), ox + m.x * k - size, oy + m.y * k - size, size * 2, size * 2);
  }
  ctx.globalAlpha = 1;
}
export function drawFlames(ctx, fire, ox, oy, k = 1) {
  const p = fire.p; ctx.globalCompositeOperation = 'lighter';
  for (const f of fire.flames) {
    const rgb = flameColour(f.life, p.heat), w = f.w * (1 - f.life * 0.75) * k, h = w * (1.5 + 0.8 * (1 - f.life));
    ctx.globalAlpha = Math.min(1, (1 - f.life) * 1.6) * 0.4 * (1 - 0.5 * p.intensity);
    ctx.drawImage(brush(rgb), ox + f.x * k - w, oy + f.y * k - h, w * 2, h * 2);
  }
  for (const e of fire.embers) { const rgb = flameColour(0.2 + e.life * 0.6, p.heat); ctx.globalAlpha = 1 - e.life; ctx.fillStyle = `rgb(${rgb})`; ctx.fillRect(ox + e.x * k - k, oy + e.y * k - k, 1.6 * k, 1.6 * k); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
// Spots along the roof of a building of the given screen width (px), at the roof line (y = 0), seeded per building.
export function roofSpots(count, width, seed) {
  const r = mulberry(seed), out = [];
  for (let i = 0; i < count; i++) { const t = count === 1 ? 0.5 : i / (count - 1); out.push({ x: (t - 0.5) * width * 0.8 + (r() - 0.5) * 6, y: (r() - 0.5) * 10 - Math.sin(t * Math.PI) * 12, w: 0.8 + 0.4 * r() }); }
  // Spread starts from a middle spot and moves outwards.
  return out.sort((a, b) => Math.abs(a.x) - Math.abs(b.x));
}
