// Procedural grey-scale detail textures. They are multiplied by the material's
// palette colour, so one brick texture serves every stone in the game and the
// palette stays the single source of colour. Deterministic (seeded) output.

function random(seed) {
  let state = seed >>> 0;
  return () => { state = Math.imul(state ^ state >>> 15, 0x2c1b3c6d) + 0x297a2d39 >>> 0; return (state >>> 8) / 0x1000000; };
}
const shade = value => `rgb(${value},${value},${value})`;

function canvas(size) {
  const element = document.createElement('canvas');
  element.width = element.height = size;
  return [element, element.getContext('2d')];
}

export function bricks(seed = 1, variation = 0.1) {
  const [element, ctx] = canvas(128), rand = random(seed);
  ctx.fillStyle = shade(150); ctx.fillRect(0, 0, 128, 128); // mortar
  const rows = 8, rowHeight = 128 / rows;
  for (let row = 0; row < rows; row++) {
    const bricksPerRow = 4, brickWidth = 128 / bricksPerRow, shift = row % 2 ? brickWidth / 2 : 0;
    for (let i = -1; i <= bricksPerRow; i++) {
      const value = Math.round(238 - rand() * 255 * variation * 1.6);
      ctx.fillStyle = shade(value);
      const x = i * brickWidth + shift + 1.5, y = row * rowHeight + 1.5;
      ctx.fillRect(x, y, brickWidth - 3, rowHeight - 3);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, brickWidth - 3, 1.5); // worn top edge
    }
  }
  return element;
}

export function planks(seed = 2, variation = 0.12) {
  const [element, ctx] = canvas(128), rand = random(seed);
  const boards = 6, width = 128 / boards;
  for (let i = 0; i < boards; i++) {
    const base = 225 - rand() * 255 * variation;
    ctx.fillStyle = shade(Math.round(base)); ctx.fillRect(i * width, 0, width, 128);
    for (let g = 0; g < 7; g++) { // grain
      ctx.fillStyle = `rgba(0,0,0,${0.05 + rand() * 0.06})`;
      ctx.fillRect(i * width + rand() * width, 0, 1, 128);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(i * width, 0, 1.5, 128); // gap
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(i * width + width / 2 - 1, 20 + rand() * 80, 2, 2); // nail
  }
  return element;
}

export function shingles(seed = 3, variation = 0.12) {
  const [element, ctx] = canvas(128), rand = random(seed);
  ctx.fillStyle = shade(120); ctx.fillRect(0, 0, 128, 128);
  const rows = 8, rowHeight = 128 / rows, perRow = 6, width = 128 / perRow;
  for (let row = 0; row < rows; row++) {
    const shift = row % 2 ? width / 2 : 0;
    for (let i = -1; i <= perRow; i++) {
      ctx.fillStyle = shade(Math.round(230 - rand() * 255 * variation * 1.4));
      ctx.fillRect(i * width + shift + 1, row * rowHeight, width - 2, rowHeight - 1);
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(i * width + shift + 1, row * rowHeight + rowHeight - 3, width - 2, 2);
    }
  }
  return element;
}

export function noise(seed = 4, variation = 0.14) {
  const [element, ctx] = canvas(64), rand = random(seed), image = ctx.createImageData(64, 64);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 235 - rand() * 255 * variation * 1.8;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value; image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return element;
}

export const TEXTURES = Object.freeze({ bricks, planks, shingles, noise });
