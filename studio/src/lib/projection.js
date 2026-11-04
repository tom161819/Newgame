// Isometric projection shared by the 3D sprite renderer, the 2D compositor and
// the Phaser demo. It matches src/game/isometric.js: one tile edge (1 world unit)
// spans 64 × 32 screen pixels, grid x runs right-down and grid y left-down.
//
// 3D model space: X = grid x, Z = grid y, Y = height. The model origin is the
// centre of the footprint at ground level; that point becomes the sprite anchor.

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const ELEVATION = Math.PI / 6; // 30°: makes a square tile a 2:1 diamond
export const PIXELS_PER_UNIT = TILE_WIDTH / Math.SQRT2; // 45.2548…
export const VERTICAL_PIXELS_PER_UNIT = PIXELS_PER_UNIT * Math.cos(ELEVATION); // 39.19…

// Screen offset in pixels (y down) of a model-space point relative to the origin.
export function projectPoint([x, y, z], scale = 1) {
  const ppu = PIXELS_PER_UNIT * scale;
  return {
    x: (x - z) / Math.SQRT2 * ppu,
    y: ((x + z) / Math.SQRT2 * Math.sin(ELEVATION) - y * Math.cos(ELEVATION)) * ppu,
  };
}

// Same mapping as gridToWorld in the game, relative to a grid origin.
export function gridToScreen(gx, gy) {
  return { x: (gx - gy) * TILE_WIDTH / 2, y: (gx + gy) * TILE_HEIGHT / 2 };
}

// Unit vector from the scene towards the camera (for the Three.js camera).
export function cameraDirection() {
  const horizontal = Math.cos(ELEVATION) / Math.SQRT2;
  return [horizontal, Math.sin(ELEVATION), horizontal];
}

// Projected 2D bounds of an axis-aligned 3D box given by min/max corners.
export function projectBox(min, max, scale = 1) {
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
    const p = projectPoint([x, y, z], scale);
    left = Math.min(left, p.x); right = Math.max(right, p.x);
    top = Math.min(top, p.y); bottom = Math.max(bottom, p.y);
  }
  return { left, right, top, bottom };
}

// Diamond corners (screen pixels relative to the anchor) of a footprint centred on the anchor.
export function footprintDiamond(width, height, scale = 1) {
  const w = width / 2, h = height / 2;
  return [[-w, 0, -h], [w, 0, -h], [w, 0, h], [-w, 0, h]].map(p => projectPoint(p, scale));
}

// Pixel height a model of the given world height occupies above its anchor.
export function heightInPixels(units, scale = 1) {
  return units * VERTICAL_PIXELS_PER_UNIT * scale;
}
