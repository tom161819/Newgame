// 2D compositing for previews: backgrounds, the tile grid, footprint and scale
// overlays, a small test map, and time of day. Lighting is a light map: filled
// with the ambient colour, lights added as radial gradients ('lighter'), then
// multiplied over the scene. Flames are drawn afterwards so they stay bright.
// Phaser reproduces this with a RenderTexture (fill + ADD stamps) shown with
// BlendModes.MULTIPLY; see src/demo/phaser-demo.js.
import { TILE_WIDTH, TILE_HEIGHT, footprintDiamond, heightInPixels } from '../lib/projection.js';
import { flicker, hexToRgb, lightStrength } from '../lib/lighting.js';

export const BACKGROUNDS = Object.freeze([
  { id: 'grass', label: 'Grass' }, { id: 'dirt', label: 'Dirt' }, { id: 'checker', label: 'Checker' },
  { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' },
]);

const tileColours = {
  grass: ['#6e8d45', '#688843', '#73924a'],
  dirt: ['#8b7150', '#866c4c', '#907655'],
};

function diamond(ctx, x, y, zoom) {
  const w = TILE_WIDTH / 2 * zoom, h = TILE_HEIGHT / 2 * zoom;
  ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w, y); ctx.lineTo(x, y + h); ctx.lineTo(x - w, y); ctx.closePath();
}

// Tile centres on a grid aligned with a footprint centred at (ox, oy).
function* tileCentres(width, height, ox, oy, zoom, footprint) {
  const shiftX = footprint.width % 2 ? 0 : 0.5, shiftY = footprint.height % 2 ? 0 : 0.5;
  const reach = Math.ceil(Math.max(width / (TILE_WIDTH * zoom), height / (TILE_HEIGHT * zoom))) + 2;
  for (let i = -reach; i <= reach; i++) for (let j = -reach; j <= reach; j++) {
    const gx = i + shiftX, gy = j + shiftY;
    yield { i, j, x: ox + (gx - gy) * TILE_WIDTH / 2 * zoom, y: oy + (gx + gy) * TILE_HEIGHT / 2 * zoom };
  }
}

export function drawBackground(ctx, kind, { width, height, origin, zoom, footprint }) {
  ctx.save();
  if (kind === 'checker') {
    const size = 12;
    for (let y = 0; y < height; y += size) for (let x = 0; x < width; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 ? '#c9ccc4' : '#e2e4de'; ctx.fillRect(x, y, size, size);
    }
  } else if (kind === 'light' || kind === 'dark') {
    ctx.fillStyle = kind === 'light' ? '#e9ebe6' : '#1c2023'; ctx.fillRect(0, 0, width, height);
  } else {
    const colours = tileColours[kind] ?? tileColours.grass;
    ctx.fillStyle = colours[0]; ctx.fillRect(0, 0, width, height);
    for (const tile of tileCentres(width, height, origin.x, origin.y, zoom, footprint)) {
      diamond(ctx, tile.x, tile.y, zoom);
      ctx.fillStyle = colours[Math.abs(tile.i * 7 + tile.j * 13) % 3]; ctx.fill();
    }
  }
  ctx.restore();
}

export function drawGrid(ctx, { width, height, origin, zoom, footprint, dark = false }) {
  ctx.save();
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(20,28,16,0.22)'; ctx.lineWidth = 1;
  for (const tile of tileCentres(width, height, origin.x, origin.y, zoom, footprint)) { diamond(ctx, tile.x, tile.y, zoom); ctx.stroke(); }
  ctx.restore();
}

export function drawFootprint(ctx, { origin, zoom, footprint, colour = '#e7b542' }) {
  const corners = footprintDiamond(footprint.width, footprint.height, zoom);
  ctx.save();
  ctx.beginPath(); corners.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](origin.x + p.x, origin.y + p.y)); ctx.closePath();
  ctx.fillStyle = `${colour}2e`; ctx.fill();
  ctx.setLineDash([5, 4]); ctx.strokeStyle = colour; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

// Human silhouette 1.2 units tall, the style guide's reference for scale.
export function drawHuman(ctx, x, y, zoom, style, colour = '#2b2f2c') {
  const h = heightInPixels(style.scale.humanHeight, zoom);
  ctx.save(); ctx.fillStyle = colour;
  ctx.beginPath(); ctx.ellipse(x, y, h * 0.16, h * 0.06, 0, 0, Math.PI * 2); ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillRect(x - h * 0.09, y - h * 0.78, h * 0.18, h * 0.78);
  ctx.beginPath(); ctx.arc(x, y - h * 0.88, h * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return h;
}

export function drawBounds(ctx, { x, y, width, height, label, dark = false }) {
  ctx.save();
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(30,40,60,0.55)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(width), Math.round(height));
  if (label) {
    ctx.setLineDash([]); ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    const text = ctx.measureText(label).width + 8;
    ctx.fillStyle = dark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)'; ctx.fillRect(Math.round(x), Math.round(y) - 17, text, 16);
    ctx.fillStyle = dark ? '#f2f2ee' : '#1d2320'; ctx.fillText(label, Math.round(x) + 4, Math.round(y) - 5);
  }
  ctx.restore();
}

export function drawSprite(ctx, sprite, x, y, displayScale, smooth = true) {
  ctx.save();
  ctx.imageSmoothingEnabled = smooth;
  ctx.drawImage(sprite.canvas, Math.round(x - sprite.anchor.x * displayScale), Math.round(y - sprite.anchor.y * displayScale), sprite.width * displayScale, sprite.height * displayScale);
  ctx.restore();
}

// Lights in screen space: [{ x, y, radius, color, intensity, flicker, flameSize, seed }].
export function applyTimeOfDay(ctx, { width, height, preset, lights, seconds, animate }) {
  if (preset.lightScale <= 0 && preset.ambient.toLowerCase() === '#ffffff') return;
  const map = applyTimeOfDay.canvas ??= document.createElement('canvas');
  if (map.width !== width || map.height !== height) { map.width = width; map.height = height; }
  const lctx = map.getContext('2d');
  lctx.globalCompositeOperation = 'source-over';
  lctx.fillStyle = preset.ambient; lctx.fillRect(0, 0, width, height);
  lctx.globalCompositeOperation = 'lighter';
  for (const light of lights) {
    const strength = Math.min(1, lightStrength(light, preset, seconds, light.seed, animate));
    const { r, g, b } = hexToRgb(light.color), radius = light.radius;
    const gradient = lctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, radius);
    gradient.addColorStop(0, `rgba(${r},${g},${b},${strength})`);
    gradient.addColorStop(0.45, `rgba(${r},${g},${b},${strength * 0.45})`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    lctx.fillStyle = gradient; lctx.fillRect(light.x - radius, light.y - radius, radius * 2, radius * 2);
  }
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(map, 0, 0); ctx.restore();
}

// Emissive flame layer, drawn after the light map. Size follows zoom.
export function drawFlames(ctx, { lights, zoom, seconds, animate, style }) {
  ctx.save();
  for (const light of lights) {
    const f = animate ? flicker(seconds * 1.6, light.flicker, light.seed) : 1;
    const size = 9 * (light.flameSize ?? 1) * zoom, x = light.x, y = light.y;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 1.6);
    glow.addColorStop(0, 'rgba(255,190,90,0.55)'); glow.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = glow; ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
    ctx.globalCompositeOperation = 'source-over';
    const sway = animate ? Math.sin(seconds * 9 + light.seed) * size * 0.12 : 0, tall = size * 1.35 * f;
    const body = ctx.createLinearGradient(x, y + size * 0.4, x, y - tall);
    body.addColorStop(0, style.palette.fire_edge); body.addColorStop(0.35, style.palette.fire); body.addColorStop(1, style.palette.fire_core);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.45);
    ctx.bezierCurveTo(x - size * 0.55, y + size * 0.2, x - size * 0.4, y - tall * 0.45, x + sway, y - tall);
    ctx.bezierCurveTo(x + size * 0.4, y - tall * 0.45, x + size * 0.55, y + size * 0.2, x, y + size * 0.45);
    ctx.fill();
  }
  ctx.restore();
}

// Test map: sprites placed on grid tiles, painter-sorted by their front corner.
export function drawTestMap(ctx, { width, height, items, zoom, origin, background = 'grass', size = 12 }) {
  const colours = tileColours[background] ?? tileColours.grass;
  ctx.save();
  ctx.fillStyle = '#20251f'; ctx.fillRect(0, 0, width, height);
  for (let gx = 0; gx < size; gx++) for (let gy = 0; gy < size; gy++) {
    const x = origin.x + (gx - gy) * TILE_WIDTH / 2 * zoom, y = origin.y + (gx + gy + 1) * TILE_HEIGHT / 2 * zoom;
    diamond(ctx, x, y, zoom);
    const path = gy === Math.floor(size / 2) + 1;
    ctx.fillStyle = path ? tileColours.dirt[(gx * 3) % 3] : colours[(gx * 7 + gy * 13) % 3];
    ctx.fill();
  }
  ctx.restore();
  const placed = items.map(item => {
    const cx = item.gx + item.footprint.width / 2, cy = item.gy + item.footprint.height / 2;
    return { ...item, x: origin.x + (cx - cy) * TILE_WIDTH / 2 * zoom, y: origin.y + (cx + cy) * TILE_HEIGHT / 2 * zoom, depth: item.gx + item.gy + item.footprint.width + item.footprint.height };
  }).sort((a, b) => a.depth - b.depth);
  for (const item of placed) {
    if (item.sprite) drawSprite(ctx, item.sprite, item.x, item.y, zoom / item.sprite.scale);
    else if (item.human) drawHuman(ctx, item.x, item.y, zoom, item.style);
  }
  return placed;
}
