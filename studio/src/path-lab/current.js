// The "Current (N12)" reference in the Path Lab draws with the production path code itself: the methods of
// src/game/TerrainRenderer.js are called on a small stand-in object that reads the lab's wear map instead of the
// game world. TerrainRenderer.js is not changed or copied, so the reference is exactly what the game shows.
import { TerrainRenderer } from '../../../src/game/TerrainRenderer.js';
import { objectRegistry } from '../../../src/systems/ObjectRegistry.js';

// map: WearMap; earth: [null, img1, img2, img3] approved Earth track tiles (optional; without them the plain path colour).
export function currentPathRenderer(map, { earth = [], registry = objectRegistry } = {}) {
  const r = Object.create(TerrainRenderer.prototype);
  r.registry = registry; r.fog = null; r.memory = null; r.wear = { level: tile => map.get(tile.x, tile.y) };
  // The lab has no buildings or rocks: every pair of worn neighbours may link (the game asks the pathfinder).
  r.pathLinked = () => true;
  r.wearTextures = [0, 1, 2, 3].map(level => ({ key: `lab-earth-${level}` })); r.groundTextures = [{ key: 'lab-ground' }];
  r.scene = { textures: { exists: key => !!earth[Number(String(key).split('-').pop())] && key.startsWith('lab-earth'), get: key => ({ getSourceImage: () => earth[Number(String(key).split('-').pop())] }) } };
  return r;
}
