// Draws the lab map: approved seasonal ground tiles, then the paths of the chosen renderer, clipped per tile the way
// the game's chunk painter does (TerrainRenderer.chunkTexture), so the comparison is fair. Browser only.
import { tileCenter } from '../../../src/game/isometric.js';
import { currentPathRenderer } from './current.js';

const hash = (x, y) => ((Math.imul(x + 17, 374761393) ^ Math.imul(y + 29, 668265263)) >>> 0);
const TILE_BLEED = 0.8;
export const WINTER_VEIL = 0.45;

export function sceneBounds(size) {
  const corners = [tileCenter({ x: 0, y: 0 }), tileCenter({ x: size - 1, y: 0 }), tileCenter({ x: 0, y: size - 1 }), tileCenter({ x: size - 1, y: size - 1 })];
  const left = Math.min(...corners.map(c => c.x)) - 40, top = Math.min(...corners.map(c => c.y)) - 24;
  return { left, top, width: Math.max(...corners.map(c => c.x)) + 40 - left, height: Math.max(...corners.map(c => c.y)) + 24 - top };
}

// images: {ground: {Summer:[img×4], …}, earth: [null, img, img, img]}; renderers: {current: factory, v2?: factory}
export function renderScene(canvas, { map, season = 'Summer', images, renderer = 'current', renderers = { current: currentPathRenderer } }) {
  const bounds = sceneBounds(map.size), context = canvas.getContext('2d');
  canvas.width = Math.ceil(bounds.width); canvas.height = Math.ceil(bounds.height);
  context.clearRect(0, 0, canvas.width, canvas.height);
  const paths = renderers[renderer]?.(map, { earth: images.earth });
  const veil = season === 'Winter' ? WINTER_VEIL : 0, tiles = images.ground[season] ?? images.ground.Summer ?? [];
  const diamond = (point, e = 0) => { context.beginPath(); context.moveTo(point.x - bounds.left - 32 - e, point.y - bounds.top); context.lineTo(point.x - bounds.left, point.y - bounds.top - 16 - e / 2); context.lineTo(point.x - bounds.left + 32 + e, point.y - bounds.top); context.lineTo(point.x - bounds.left, point.y - bounds.top + 16 + e / 2); context.closePath(); };
  const cells = [];
  for (let y = 0; y < map.size; y++) for (let x = 0; x < map.size; x++) {
    const point = tileCenter({ x, y }), image = tiles[hash(x, y) % Math.max(1, tiles.length)];
    context.save(); diamond(point, TILE_BLEED); context.clip();
    if (image) context.drawImage(image, point.x - bounds.left - 32, point.y - bounds.top - 16, 64, 32); else { context.fillStyle = '#74854b'; context.fill(); }
    context.restore(); cells.push({ x, y, point });
  }
  // Tracks second, so a neighbour's ground overlap never covers a track's edge (as in the game).
  if (paths) for (const { x, y, point } of cells) { context.save(); diamond(point, TILE_BLEED); context.clip(); paths.drawPaths(context, x, y, bounds.left, bounds.top, veil, () => { diamond(point); context.clip(); }); context.restore(); }
  return { bounds, paths };
}

// Diagnostics: grid, wear level numbers and (for the current renderer) its node/link/area geometry.
export function drawOverlay(context, { map, bounds, paths, grid = false, levels = false, centerline = false, scale = 1 }) {
  context.save(); context.lineWidth = 1 / scale;
  if (grid) { context.strokeStyle = 'rgba(255,255,255,.22)'; for (let y = 0; y < map.size; y++) for (let x = 0; x < map.size; x++) { const p = tileCenter({ x, y }); context.beginPath(); context.moveTo(p.x - bounds.left - 32, p.y - bounds.top); context.lineTo(p.x - bounds.left, p.y - bounds.top - 16); context.lineTo(p.x - bounds.left + 32, p.y - bounds.top); context.lineTo(p.x - bounds.left, p.y - bounds.top + 16); context.closePath(); context.stroke(); } }
  if (levels) { context.font = `${10 / scale}px system-ui`; context.textAlign = 'center'; context.textBaseline = 'middle'; for (let y = 0; y < map.size; y++) for (let x = 0; x < map.size; x++) { const level = map.get(x, y); if (!level) continue; const p = tileCenter({ x, y }); context.fillStyle = ['', '#fff6', '#ffd54acc', '#ff7a45'][level]; context.fillText(String(level), p.x - bounds.left, p.y - bounds.top); } }
  if (centerline && paths?.pathElements) {
    const seen = new Set();
    for (let y = 0; y < map.size; y++) for (let x = 0; x < map.size; x++) {
      if (!map.get(x, y)) continue; const { links, areas, nodes } = paths.pathElements(x, y);
      context.strokeStyle = '#38d6ff'; for (const l of links) { const key = `${l.start.x},${l.start.y}|${l.end.x},${l.end.y}`; if (seen.has(key)) continue; seen.add(key); context.beginPath(); context.moveTo(l.start.x - bounds.left, l.start.y / 2 - bounds.top); context.quadraticCurveTo(l.control.x - bounds.left, l.control.y / 2 - bounds.top, l.end.x - bounds.left, l.end.y / 2 - bounds.top); context.stroke(); }
      context.strokeStyle = '#ff5ad1'; for (const a of areas) { context.beginPath(); context.ellipse(a.center.x - bounds.left, a.center.y / 2 - bounds.top, a.radius, a.radius / 2, 0, 0, Math.PI * 2); context.stroke(); }
      context.fillStyle = '#38d6ff'; for (const n of nodes) { context.beginPath(); context.arc(n.start.x - bounds.left, n.start.y / 2 - bounds.top, 2 / scale, 0, Math.PI * 2); context.fill(); }
    }
  }
  context.restore();
}
