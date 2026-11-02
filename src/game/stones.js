import { isWalkable, tileCenter } from './map.js';

export const STONE_COUNT = 15;
export const tileKey = ({ x, y }) => `${x},${y}`;

export function generateStones(map, start, count = STONE_COUNT, random = Math.random) {
  const candidates = [];
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (isWalkable(map, x, y) && (x !== start.x || y !== start.y)) {
        candidates.push({ x, y });
      }
    }
  }
  if (count > candidates.length) throw new RangeError('Na mapě není dost místa pro kameny.');

  // Fisher–Yates: promícháme volná políčka a vezmeme prvních 15 bez opakování.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, count);
}

export function drawStone(scene, tile) {
  const position = tileCenter(tile);
  const stone = scene.add.graphics({ x: position.x, y: position.y }).setDepth(1);
  // Stín a tři šedé plochy naznačují malý prostorový kámen bez obrázku.
  stone.fillStyle(0x08141c, 0.45);
  stone.fillEllipse(0, 8, 25, 9);
  stone.fillStyle(0x7d8c98);
  stone.fillPoints([{ x: -11, y: -1 }, { x: -3, y: 3 }, { x: -3, y: 10 }, { x: -10, y: 5 }], true);
  stone.fillStyle(0x586a79);
  stone.fillPoints([{ x: -3, y: 3 }, { x: 10, y: -2 }, { x: 9, y: 6 }, { x: -3, y: 10 }], true);
  stone.fillStyle(0xa9b5c0);
  stone.fillPoints([{ x: -11, y: -1 }, { x: -5, y: -9 }, { x: 3, y: -10 }, { x: 10, y: -2 }, { x: -3, y: 3 }], true);
  return stone;
}
