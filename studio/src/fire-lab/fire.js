// Fire Lab simulation (owner, 7 Nov 2026: "fire and smoke need a full rework; a Studio section where I put a building,
// start a fire and tune the parameters; it must look more realistic"). A small particle system in canvas 2D, written
// so the game can reuse it: flames are additive soft blobs that cool from white-yellow through orange to deep red
// while they rise and narrow, smoke is soft grey puffs that grow, darken with the fire and drift downwind, embers are
// sparks thrown up and blown away, glow lights the walls and ground with a flicker. Deterministic random per seed.
export const PARAMS = [
  { key: 'intensity', label: 'Fire intensity', min: 0, max: 1, step: 0.01, value: 0.7, hint: 'How fast flames are born at each spot and how big they are.' },
  { key: 'flameHeight', label: 'Flame height', min: 10, max: 140, step: 1, value: 55, unit: 'px', hint: 'How high a flame rises before it dies (at 1×).' },
  { key: 'flameWidth', label: 'Flame width', min: 4, max: 40, step: 1, value: 14, unit: 'px' },
  { key: 'turbulence', label: 'Flicker / turbulence', min: 0, max: 1, step: 0.01, value: 0.55 },
  { key: 'heat', label: 'Heat (colour)', min: 0, max: 1, step: 0.01, value: 0.6, hint: 'Hotter = more white-yellow core, cooler = deeper orange and red.' },
  { key: 'spots', label: 'Fire spots on the roof', min: 1, max: 14, step: 1, value: 6 },
  { key: 'spread', label: 'Spread speed', min: 0, max: 1, step: 0.01, value: 0.35, hint: 'How fast the fire grows from the first spot to all of them after Ignite.' },
  { key: 'wind', label: 'Wind', min: -1, max: 1, step: 0.01, value: 0.25 },
  { key: 'smoke', label: 'Smoke amount', min: 0, max: 1, step: 0.01, value: 0.6 },
  { key: 'smokeDark', label: 'Smoke darkness', min: 0, max: 1, step: 0.01, value: 0.55 },
  { key: 'smokeRise', label: 'Smoke rise', min: 10, max: 120, step: 1, value: 45, unit: 'px/s' },
  { key: 'smokeSize', label: 'Smoke puff size', min: 6, max: 60, step: 1, value: 22, unit: 'px' },
  { key: 'embers', label: 'Embers', min: 0, max: 1, step: 0.01, value: 0.4 },
  { key: 'glow', label: 'Glow on walls and ground', min: 0, max: 1, step: 0.01, value: 0.7 },
  { key: 'char', label: 'Charring of the building', min: 0, max: 1, step: 0.01, value: 0.35, hint: 'How dark the burnt parts get while the fire burns.' },
];
export const DEFAULTS = Object.fromEntries(PARAMS.map(p => [p.key, p.value]));
export const PRESETS = {
  Smouldering: { intensity: 0.12, flameHeight: 18, flameWidth: 8, heat: 0.25, spots: 2, smoke: 0.85, smokeDark: 0.35, smokeRise: 28, smokeSize: 26, embers: 0.1, glow: 0.25, char: 0.15, turbulence: 0.4 },
  Burning: { ...DEFAULTS },
  Blaze: { intensity: 1, flameHeight: 105, flameWidth: 24, heat: 0.75, spots: 11, smoke: 0.9, smokeDark: 0.8, smokeRise: 70, smokeSize: 38, embers: 0.8, glow: 1, char: 0.7, turbulence: 0.7, spread: 0.6 },
  'Dying out': { intensity: 0.25, flameHeight: 24, flameWidth: 10, heat: 0.3, spots: 4, smoke: 1, smokeDark: 0.9, smokeRise: 35, smokeSize: 34, embers: 0.2, glow: 0.35, char: 0.95, turbulence: 0.35 },
};

const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const lerp = (a, b, t) => a + (b - a) * t;
// Colour of a flame particle over its life (0 = just born, 1 = dead) for a given heat.
export function flameColour(life, heat) {
  const stops = [[0, [255, 250, 225]], [0.12 + 0.12 * heat, [255, 214, 120]], [0.35 + 0.15 * heat, [255, 140, 40]], [0.7, [214, 66, 18]], [1, [90, 20, 8]]];
  for (let i = 1; i < stops.length; i++) if (life <= stops[i][0]) { const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (life - a) / (b - a); return ca.map((c, k) => Math.round(lerp(c, cb[k], t))); }
  return stops.at(-1)[1];
}

export class Fire {
  constructor(params = DEFAULTS, seed = 7) { this.p = { ...DEFAULTS, ...params }; this.rand = mulberry(seed); this.flames = []; this.smoke = []; this.embers = []; this.spots = []; this.age = 0; this.lit = false; this.dying = 0; this.time = 0; }
  // Spots in sprite pixels; `roof` is the list of auto points along the top of the building.
  setSpots(spots) { this.spots = spots; }
  ignite() { this.lit = true; this.age = 0; this.dying = 0; }
  douse() { this.dying = 0.0001; }
  activeSpots() {
    const n = this.spots.length; if (!n) return [];
    const grown = this.p.spread <= 0 ? n : Math.min(n, 1 + Math.floor(this.age * this.p.spread * 1.2));
    return this.spots.slice(0, grown);
  }
  strength() { return this.lit ? Math.max(0, 1 - this.dying) : 0; }
  step(dt) {
    const p = this.p, r = this.rand; this.time += dt;
    if (this.lit) { this.age += dt; if (this.dying) { this.dying += dt * 0.25; if (this.dying >= 1) { this.lit = false; this.dying = 0; } } }
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
    // Smoke keeps rising for a while after the fire is out.
    if (!s && this.age > 0 && this.age < 1e9) { this.age += dt; }
    const turb = p.turbulence;
    for (const f of this.flames) { f.life += dt / f.span; f.vx += (Math.sin(this.time * 9 + f.phase) * 60 * turb + wind * 1.4 - f.vx * 2) * dt; f.x += f.vx * dt; f.y += f.vy * dt * (1 - f.life * 0.4); }
    for (const m of this.smoke) { m.life += dt / m.span; m.vx += (wind * 1.2 + Math.sin(this.time * 1.3 + m.rot) * 8 - m.vx * 0.4) * dt; m.x += m.vx * dt; m.y += m.vy * dt * (1 - m.life * 0.5); m.rot += dt * 0.3; }
    for (const e of this.embers) { e.life += dt / e.span; e.vx += (wind * 2 + (Math.sin(this.time * 17 + e.span * 9) * 50)) * dt; e.vy += 30 * dt; e.x += e.vx * dt; e.y += e.vy * dt; }
    this.flames = this.flames.filter(f => f.life < 1); this.smoke = this.smoke.filter(m => m.life < 1); this.embers = this.embers.filter(e => e.life < 1);
    if (this.flames.length > 1500) this.flames.splice(0, this.flames.length - 1500);
  }
  // Light from the fire right now (0–1.3) with a flicker.
  light() { const s = this.strength(), n = this.activeSpots().length; return s * (0.55 + 0.45 * Math.min(1, n / 6)) * this.p.glow * (0.85 + 0.15 * Math.sin(this.time * 13) * Math.sin(this.time * 7.3)); }
}

// Soft round brush, cached per colour step.
const brushes = new Map();
function brush(rgb, soft = 0.55) {
  const key = rgb.join(',') + soft; if (brushes.has(key)) return brushes.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(soft, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); brushes.set(key, c); return c;
}
// Draw the fire layers around a building drawn at (ox, oy) with scale k. `back` = smoke (behind the flames).
export function drawSmoke(ctx, fire, ox, oy, k) {
  const p = fire.p;
  for (const m of fire.smoke) {
    const a = Math.sin(Math.PI * Math.min(1, m.life * 1.1)) * 0.32 * (0.45 + 0.55 * p.smoke), grey = Math.round(lerp(150, 40, p.smokeDark * (0.6 + 0.4 * m.shade)) + m.life * 40);
    const size = m.size * (0.45 + m.life * 1.5) * k;
    ctx.globalAlpha = a; ctx.drawImage(brush([grey, grey - 4, grey - 8], 0.35), ox + m.x * k - size, oy + m.y * k - size, size * 2, size * 2);
  }
  ctx.globalAlpha = 1;
}
export function drawFlames(ctx, fire, ox, oy, k) {
  const p = fire.p; ctx.globalCompositeOperation = 'lighter';
  for (const f of fire.flames) {
    const rgb = flameColour(f.life, p.heat), w = f.w * (1 - f.life * 0.75) * k, h = w * (1.5 + 0.8 * (1 - f.life));
    ctx.globalAlpha = Math.min(1, (1 - f.life) * 1.6) * 0.4 * (1 - 0.5 * p.intensity); // additive: many overlapping flames build the hot core without blowing out to white
    ctx.drawImage(brush(rgb), ox + f.x * k - w, oy + f.y * k - h, w * 2, h * 2);
  }
  for (const e of fire.embers) { const rgb = flameColour(0.2 + e.life * 0.6, p.heat); ctx.globalAlpha = 1 - e.life; ctx.fillStyle = `rgb(${rgb})`; ctx.fillRect(ox + e.x * k - k, oy + e.y * k - k, 1.6 * k, 1.6 * k); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
export function drawGlow(ctx, fire, ox, oy, k, radius) {
  const L = fire.light(); if (L <= 0) return;
  const spots = fire.activeSpots(), cx = spots.reduce((s, q) => s + q.x, 0) / spots.length, cy = spots.reduce((s, q) => s + q.y, 0) / spots.length;
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(ox + cx * k, oy + cy * k, 0, ox + cx * k, oy + cy * k, radius * k);
  g.addColorStop(0, `rgba(255,150,60,${0.3 * L})`); g.addColorStop(0.4, `rgba(255,110,40,${0.12 * L})`); g.addColorStop(1, 'rgba(255,90,30,0)');
  ctx.fillStyle = g; ctx.fillRect(ox + (cx - radius) * k, oy + (cy - radius) * k, radius * 2 * k, radius * 2 * k);
  ctx.globalCompositeOperation = 'source-over';
}
