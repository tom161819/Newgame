// Night light map (plan m-osvetleni-noc, step 1 in the Studio; step 2 brings the same algorithm into the game).
// The screen is multiplied by a light map: the map is filled with a bluish ambient colour that deepens with the night,
// and every light source adds a warm, soft, flickering area to it (canvas 'lighter'). Where a light reaches, ground,
// buildings, people and objects keep their own colours, warmly tinted; elsewhere they sink into the night colour.
// Nothing here touches the DOM, the Studio or Phaser at import time, so the game (and Node tests) can import it:
// - settings: defaults, per-type values and validation of untrusted data (normalizeLightSettings);
// - time: ambient colour for a darkness, lights switching on one by one (switchOn), flicker;
// - resolveLights: sources → screen-independent light descriptors (ground ellipse + height up the walls);
// - LightMap: renders the map at reduced resolution into an offscreen canvas, drawing only lights in view;
// - directionalShade / cornerTints / shadowFor: which side of a sprite faces the light, and a faint shadow.
// Coordinates are world pixels of the game's isometric projection (tile 64 × 32); a light stands on its ground point.

export const LIGHT_SCHEMA = 1;
// A ground circle of one tile radius seen in the 2:1 isometric projection is an ellipse 45 × 23 px.
export const TILE_RX = 32 * Math.SQRT2, TILE_RY = 16 * Math.SQRT2;

export const LIGHT_TYPES = Object.freeze(['torch', 'lantern', 'campfire', 'brazier', 'forge', 'window']);
export const TYPE_LABELS = Object.freeze({ torch: 'Torch', lantern: 'Lantern', campfire: 'Campfire', brazier: 'Brazier', forge: 'Forge', window: 'House window' });
// `speed` (flicker tempo) and `lamp` (height of the flame above the ground point, for a newly placed source) are not
// tuned in the Lab but travel with the settings so the game reads one table.
export const DEFAULT_TYPES = Object.freeze({
  torch: Object.freeze({ color: '#ffb25a', radius: 4, strength: 1, flicker: 0.12, height: 56, speed: 7, lamp: 60 }),
  lantern: Object.freeze({ color: '#ffd58c', radius: 2.4, strength: 0.8, flicker: 0.05, height: 30, speed: 3, lamp: 26 }),
  campfire: Object.freeze({ color: '#ff9a3c', radius: 5, strength: 1.1, flicker: 0.2, height: 40, speed: 6, lamp: 8 }),
  brazier: Object.freeze({ color: '#ff9d4a', radius: 5, strength: 1, flicker: 0.16, height: 50, speed: 5.5, lamp: 52 }),
  forge: Object.freeze({ color: '#ff7a2e', radius: 3.4, strength: 1, flicker: 0.1, height: 34, speed: 4, lamp: 16 }),
  window: Object.freeze({ color: '#ffcf7a', radius: 1.6, strength: 0.7, flicker: 0.03, height: 26, speed: 1.5, lamp: 30 }),
});
export const DEFAULT_GLOBAL = Object.freeze({
  nightColor: '#1c2a5c', duskColor: '#d9a27e', nightStrength: 0.78,
  directional: 0.6, shadows: true, shadowStrength: 0.35, quality: 'full', resolution: 0.5,
  // Lights switch on one by one: each starts somewhere between `switchFrom` and `switchFrom + switchSpread` of the
  // darkness and takes `switchRamp` of darkness to reach full strength.
  switchFrom: 0.15, switchSpread: 0.3, switchRamp: 0.2,
});

// Tuning ranges (also the Lab's sliders). Values outside are clamped, invalid ones fall back to the default.
export const TYPE_PARAMS = Object.freeze([
  { key: 'color', label: 'Colour', kind: 'color' },
  { key: 'radius', label: 'Radius', min: 0.5, max: 10, step: 0.1, unit: 'tiles' },
  { key: 'strength', label: 'Strength', min: 0, max: 2, step: 0.05 },
  { key: 'flicker', label: 'Flicker', min: 0, max: 0.5, step: 0.01 },
  { key: 'height', label: 'Height (reach up the walls)', min: 0, max: 160, step: 2, unit: 'px' },
  { key: 'speed', label: 'Flicker tempo', min: 0.2, max: 12, step: 0.1, hidden: true },
  { key: 'lamp', label: 'Flame height', min: 0, max: 200, step: 1, unit: 'px', hidden: true },
]);
export const GLOBAL_PARAMS = Object.freeze([
  { key: 'nightColor', label: 'Night colour', kind: 'color' },
  { key: 'duskColor', label: 'Dusk colour', kind: 'color' },
  { key: 'nightStrength', label: 'Night strength', min: 0, max: 1, step: 0.01 },
  { key: 'directional', label: 'Directional lighting', min: 0, max: 1, step: 0.01, hint: 'Side of buildings and people facing a light is lighter, the far side darker (Full quality).' },
  { key: 'shadows', label: 'Shadows of people', kind: 'bool' },
  { key: 'shadowStrength', label: 'Shadow strength', min: 0, max: 1, step: 0.01 },
  { key: 'quality', label: 'Quality', kind: 'enum', values: ['simple', 'full'] },
  { key: 'resolution', label: 'Light map resolution', kind: 'enum', values: [0.25, 0.5, 1] },
  { key: 'switchFrom', label: 'Lights start at darkness', min: 0, max: 0.9, step: 0.01 },
  { key: 'switchSpread', label: 'Spread of switching on', min: 0, max: 0.6, step: 0.01 },
  { key: 'switchRamp', label: 'Switch-on fade', min: 0.02, max: 0.6, step: 0.01 },
]);

export const defaultLightSettings = () => ({ schema: LIGHT_SCHEMA, types: Object.fromEntries(LIGHT_TYPES.map(t => [t, { ...DEFAULT_TYPES[t] }])), global: { ...DEFAULT_GLOBAL } });

const HEX = /^#[0-9a-f]{6}$/i;
function readValue(param, value, fallback, problems, where) {
  if (value === undefined) return fallback;
  if (param.kind === 'color') { if (typeof value === 'string' && HEX.test(value)) return value.toLowerCase(); problems.push(`${where}: not a #rrggbb colour`); return fallback; }
  if (param.kind === 'bool') { if (typeof value === 'boolean') return value; problems.push(`${where}: not true/false`); return fallback; }
  if (param.kind === 'enum') { if (param.values.includes(value)) return value; problems.push(`${where}: not one of ${param.values.join(', ')}`); return fallback; }
  if (typeof value !== 'number' || !Number.isFinite(value)) { problems.push(`${where}: not a number`); return fallback; }
  const clamped = Math.min(param.max, Math.max(param.min, value));
  if (clamped !== value) problems.push(`${where}: clamped to ${clamped}`);
  return clamped;
}
// Untrusted settings (page database, a JSON file) → complete, valid settings plus the list of what was fixed.
export function readLightSettings(raw) {
  const problems = [], settings = defaultLightSettings();
  const source = raw?.settings && typeof raw.settings === 'object' ? raw.settings : raw;
  if (!source || typeof source !== 'object' || Array.isArray(source)) return { ok: false, settings, problems: ['not a settings object'] };
  if (source.schema !== undefined && source.schema !== LIGHT_SCHEMA) return { ok: false, settings, problems: [`schema ${source.schema} is not ${LIGHT_SCHEMA}`] };
  for (const [type, values] of Object.entries(source.types ?? {})) {
    if (!LIGHT_TYPES.includes(type)) { problems.push(`unknown light type ${type}`); continue; }
    if (!values || typeof values !== 'object') { problems.push(`${type}: not an object`); continue; }
    for (const p of TYPE_PARAMS) settings.types[type][p.key] = readValue(p, values[p.key], settings.types[type][p.key], problems, `${type}.${p.key}`);
  }
  for (const p of GLOBAL_PARAMS) settings.global[p.key] = readValue(p, source.global?.[p.key], settings.global[p.key], problems, `global.${p.key}`);
  return { ok: true, settings, problems };
}
export const normalizeLightSettings = raw => readLightSettings(raw).settings;

// ---------- small maths ----------
export const clamp01 = v => Math.max(0, Math.min(1, v));
export const smoothstep = (a, b, v) => { const t = clamp01((v - a) / (b - a || 1e-9)); return t * t * (3 - 2 * t); };
export function hexToRgb(hex) { const n = Number.parseInt(String(hex).slice(1), 16); return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255 }; }
const mix = (a, b, t) => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
const css = ({ r, g, b }, a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${+a.toFixed(4)})`;
export function hash01(seed) { let h = Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
// Same smooth flicker as the game's LitBuildingView and the Studio style guide, in [1 - amount, 1 + amount].
export function flicker(seconds, amount, speed, seed = 0) {
  const t = seconds * speed + seed * 12.9898;
  return 1 + amount * (Math.sin(t) * 0.5 + Math.sin(t * 2.31 + 1.7) * 0.3 + Math.sin(t * 5.17 + 0.4) * 0.2);
}
// Brightness profile of one light from its centre (0) to its edge (1); the canvas gradient uses the same stops.
export const PROFILE = Object.freeze([[0, 1], [0.3, 0.68], [0.62, 0.26], [1, 0]]);
export function profile(n) {
  if (n <= 0) return 1; if (n >= 1) return 0;
  for (let i = 1; i < PROFILE.length; i++) if (n <= PROFILE[i][0]) { const [a, va] = PROFILE[i - 1], [b, vb] = PROFILE[i]; return va + (vb - va) * (n - a) / (b - a); }
  return 0;
}

// ---------- time of day ----------
// Ambient multiplier at a darkness (0 day … 1 night): white by day, the dusk colour while it darkens, the night colour
// at night, mixed in by the night strength.
export function ambientColor(darkness, global) {
  const d = clamp01(darkness), white = { r: 255, g: 255, b: 255 };
  const tone = mix(hexToRgb(global.duskColor), hexToRgb(global.nightColor), smoothstep(0.25, 1, d));
  return mix(white, tone, d * global.nightStrength);
}
// 0 … 1: how far a light with this seed has switched on at this darkness.
export function switchOn(darkness, seed, global) {
  const start = global.switchFrom + global.switchSpread * hash01(seed);
  return smoothstep(start, start + global.switchRamp, darkness);
}

// ---------- lights ----------
// sources: [{ type, x, y, seed, on? (0…1, e.g. a house window: someone home and awake) }] in world px.
// Returns light descriptors: ground ellipse rx × ry, reach `up` px above the ground point, colour and strength.
export function resolveLights(sources, settings, { darkness, seconds = 0 }) {
  const out = [];
  for (const s of sources) {
    const t = settings.types[s.type]; if (!t) continue;
    const on = (s.on ?? 1) * switchOn(darkness, s.seed ?? 0, settings.global);
    const strength = t.strength * on * flicker(seconds, t.flicker, t.speed, s.seed ?? 0);
    if (strength <= 0.005) continue;
    // A source may be a smaller or differently coloured light of its type (`scale`, `color`): the glow around units in a night battle.
    const k = s.scale ?? 1;
    out.push({ type: s.type, x: s.x, y: s.y, rx: t.radius * k * TILE_RX, ry: t.radius * k * TILE_RY, up: t.height * k, color: hexToRgb(s.color ?? t.color), strength, seed: s.seed ?? 0 });
  }
  return out;
}
// Screen-space-free bounds test: does the light reach into the world rectangle {x0, y0, x1, y1}?
export const lightInView = (l, r) => l.x + l.rx >= r.x0 && l.x - l.rx <= r.x1 && l.y + l.ry >= r.y0 && l.y - l.ry - l.up <= r.y1;
export const visibleLights = (lights, rect) => lights.filter(l => lightInView(l, rect));
// Brightness a light adds at a point (world px). Above its ground point the ellipse stretches up by `up` (walls).
export function lightAt(light, x, y) {
  const dx = (x - light.x) / light.rx, ry = y < light.y ? light.ry + light.up : light.ry, dy = (y - light.y) / ry;
  return light.strength * profile(Math.hypot(dx, dy));
}

// Directional lighting of a sprite standing at ground point (x, y), `height` px tall: the summed pull of the lights
// on it. Returns null when nothing meaningful lights it (or Simple quality). `x`, `y` of the result is the unit
// direction towards the light on screen, `amount` 0 … 1, `color` the lights' mixed colour.
export function directionalShade(x, y, height, lights, global, darkness) {
  if (global.quality !== 'full' || global.directional <= 0 || darkness <= 0) return null;
  let vx = 0, vy = 0, total = 0, r = 0, g = 0, b = 0;
  const my = y - height * 0.5;
  for (const l of lights) {
    const w = Math.min(1.5, lightAt(l, x, my)); if (w <= 0.01) continue;
    // Direction on the ground plane (iso y is halved), back to screen space for the gradient.
    let dx = l.x - x, dy = (l.y - y) * 2; const len = Math.hypot(dx, dy);
    if (len < 4) continue; dx /= len; dy /= len;
    vx += dx * w; vy += dy * 0.5 * w; total += w; r += l.color.r * w; g += l.color.g * w; b += l.color.b * w;
  }
  const pull = Math.hypot(vx, vy); if (total <= 0 || pull < 0.02) return null;
  const amount = clamp01(pull) * global.directional * clamp01(darkness * 1.4);
  if (amount < 0.02) return null;
  return { x: vx / pull, y: vy / pull, amount, color: { r: r / total, g: g / total, b: b / total } };
}
// The same shade as four corner multipliers (top-left, top-right, bottom-left, bottom-right) for a renderer with
// per-vertex tint (Phaser's setTint(tl, tr, bl, br)); 1 = unchanged, above 1 means "lighter" (clamp to white there).
export function cornerTints(shade, lighter = 0.35, darker = 0.5) {
  if (!shade) return { tl: 1, tr: 1, bl: 1, br: 1 };
  const k = (cx, cy) => { const d = (cx * shade.x + cy * shade.y) / Math.SQRT2; return 1 + (d > 0 ? lighter : darker) * d * shade.amount; };
  return { tl: k(-1, -1), tr: k(1, -1), bl: k(-1, 1), br: k(1, 1) };
}
// A faint shadow of a person from the strongest nearby light: direction away from it on screen, length, opacity.
export function shadowFor(x, y, height, lights, global, darkness) {
  if (!global.shadows || global.shadowStrength <= 0 || darkness <= 0.2) return null;
  let best = null;
  for (const l of lights) { const w = lightAt(l, x, y); if (w > 0.05 && (!best || w > best.w)) best = { l, w }; }
  if (!best) return null;
  let dx = x - best.l.x, dy = (y - best.l.y) * 2; const dist = Math.hypot(dx, dy); if (dist < 3) return null;
  dx /= dist; dy /= dist;
  const length = height * Math.max(0.35, Math.min(2.4, dist / Math.max(10, best.l.up))) * 0.55;
  return { x: dx, y: dy * 0.5, angle: Math.atan2(dy, dx), length, alpha: clamp01(best.w) * global.shadowStrength * clamp01((darkness - 0.2) * 2) };
}

// ---------- the light map ----------
const defaultCanvas = (w, h) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
};
export class LightMap {
  constructor({ createCanvas = defaultCanvas } = {}) { this.createCanvas = createCanvas; this.canvas = null; this.stats = { drawn: 0, culled: 0, width: 0, height: 0 }; }
  // width × height: the screen in px; view: the world point at the screen's top-left and the zoom (screen px per
  // world px); lights: from resolveLights. The map is drawn at settings.global.resolution of the screen size.
  render({ width, height, view, lights, darkness, settings }) {
    const g = settings.global, s = g.resolution, w = Math.max(1, Math.ceil(width * s)), h = Math.max(1, Math.ceil(height * s));
    if (!this.canvas || this.canvas.width !== w || this.canvas.height !== h) this.canvas = this.createCanvas(w, h);
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = css(ambientColor(darkness, g)); ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    const k = view.zoom * s, rect = { x0: view.x, y0: view.y, x1: view.x + width / view.zoom, y1: view.y + height / view.zoom };
    let drawn = 0, culled = 0;
    for (const l of lights) {
      if (!lightInView(l, rect)) { culled++; continue; }
      drawn++;
      const sx = (l.x - view.x) * k, sy = (l.y - view.y) * k, rx = l.rx * k, ry = l.ry * k, up = l.up * k;
      this.half(ctx, l, sx, sy, rx, ry, false);
      this.half(ctx, l, sx, sy, rx, ry + up, true);
    }
    ctx.globalCompositeOperation = 'source-over';
    this.stats = { drawn, culled, width: w, height: h };
    return this.canvas;
  }
  // One half of the light's ellipse: below its ground point (ground) or above it, stretched up the walls.
  half(ctx, l, sx, sy, rx, ry, upper) {
    if (rx < 0.5 || ry < 0.5) return;
    ctx.save(); ctx.beginPath(); ctx.rect(sx - rx, upper ? sy - ry : sy, rx * 2, ry); ctx.clip();
    ctx.translate(sx, sy); ctx.scale(1, ry / rx);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    for (const [at, v] of PROFILE) grad.addColorStop(at, css(l.color, Math.min(1, l.strength * v)));
    ctx.fillStyle = grad; ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
  }
  // Multiply the map over the finished scene (sprites drawn, flames not yet).
  drawTo(ctx, width, height) {
    if (!this.canvas) return;
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.imageSmoothingEnabled = true; ctx.drawImage(this.canvas, 0, 0, width, height); ctx.restore();
  }
}

// Canvas helper: draw an image with a directional shade (lighter towards the light, darker away). `scratch` is a
// reusable canvas. Renderers with per-vertex tint use cornerTints instead.
export function drawShadedImage(ctx, img, dx, dy, dw, dh, shade, scratch, smooth = false) {
  if (!shade) { ctx.drawImage(img, dx, dy, dw, dh); return; }
  const w = Math.max(1, Math.ceil(dw)), h = Math.max(1, Math.ceil(dh));
  if (scratch.width < w) scratch.width = w; if (scratch.height < h) scratch.height = h;
  const s = scratch.getContext('2d');
  s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, w, h); s.imageSmoothingEnabled = smooth;
  s.drawImage(img, 0, 0, w, h);
  s.globalCompositeOperation = 'source-atop';
  const ext = (Math.abs(shade.x) * w + Math.abs(shade.y) * h) / 2, cx = w / 2, cy = h / 2;
  const grad = s.createLinearGradient(cx + shade.x * ext, cy + shade.y * ext, cx - shade.x * ext, cy - shade.y * ext);
  grad.addColorStop(0, css(shade.color, 0.4 * shade.amount)); grad.addColorStop(0.42, css(shade.color, 0));
  grad.addColorStop(0.55, 'rgba(0,0,0,0)'); grad.addColorStop(1, `rgba(8,10,24,${+(0.55 * shade.amount).toFixed(4)})`);
  s.fillStyle = grad; s.fillRect(0, 0, w, h);
  s.globalCompositeOperation = 'source-over';
  ctx.drawImage(scratch, 0, 0, w, h, dx, dy, dw, dh);
}
// Canvas helper: a soft ground shadow (from shadowFor) at the feet (sx, sy) in screen px.
export function drawShadow(ctx, shadow, sx, sy, zoom = 1) {
  if (!shadow || shadow.alpha < 0.01) return;
  const len = shadow.length * zoom;
  ctx.save(); ctx.translate(sx, sy); ctx.scale(1, 0.5); ctx.rotate(shadow.angle);
  const grad = ctx.createLinearGradient(0, 0, len, 0);
  grad.addColorStop(0, `rgba(6,8,18,${+(shadow.alpha).toFixed(4)})`); grad.addColorStop(1, 'rgba(6,8,18,0)');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(len * 0.45, 0, len * 0.55, 7 * zoom, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// The file Mechaniky takes into src/data/lighting.js (art/lighting/light-lab-default.json).
export function lightingFile(settings, { by = null, at = new Date().toISOString(), note = '' } = {}) {
  const s = normalizeLightSettings(settings);
  return { kind: 'light-lab', schema: LIGHT_SCHEMA, by, at, note, types: s.types, global: s.global };
}
