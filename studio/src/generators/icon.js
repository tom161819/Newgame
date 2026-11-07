// UI icon sets (plan g-ikony-dane-jidlo): small flat icons for the Kingdom Policy sliders. Each set is a row of levels
// with a clearly growing amount: taxes (5 levels of gold) and rations (3 levels of food).
// An icon is a list of vector shapes on a 40 × 40 grid, the size of the game's resource icons (shown at 22 px in the
// resource bar). The same shapes give the SVG file and the canvas preview, so both always match.
// Colours are style-guide palette names; a dark outline keeps the icons readable on light and dark UI styles.

export const ICON_SIZE = 40;
export const SETS = Object.freeze({
  tax: { label: 'Taxes', levels: ['none', 'low', 'normal', 'high', 'very-high'], names: ['None', 'Low', 'Normal', 'High', 'Very high'] },
  ration: { label: 'Rations', levels: ['small', 'normal', 'generous'], names: ['Small', 'Normal', 'Generous'] },
  // Domestic animals (g-domaci-zvirata-grafika): the cat and the hunting dog in the trade window and the panels.
  pets: { label: 'Domestic animals', levels: ['cat', 'dog'], names: ['Cat', 'Hunting dog'] },
  // Day and night (g-noc-grafika): pitch and torch goods, the "No torch" warning and the night-threat alerts for the HUD.
  night: { label: 'Night', levels: ['pitch', 'torch', 'no-torch', 'wolves', 'thief', 'fire'], names: ['Pitch', 'Torch', 'No torch', 'Wolves', 'Thief', 'Fire'] },
});
const OUT = 'outline', W = 1.4;

// ---------- shapes ----------
const ellipse = (cx, cy, rx, ry, fill, stroke = OUT, width = W) => ({ t: 'ellipse', cx, cy, rx, ry, fill, stroke, width });
const circle = (cx, cy, r, fill, stroke = OUT, width = W) => ({ t: 'ellipse', cx, cy, rx: r, ry: r, fill, stroke, width });
const path = (d, fill, stroke = OUT, width = W) => ({ t: 'path', d, fill, stroke, width });
const line = (d, stroke, width = W) => ({ t: 'path', d, fill: null, stroke, width });
const r1 = n => Math.round(n * 100) / 100;
const d = (strings, ...values) => strings.reduce((out, s, i) => out + s + (i < values.length ? r1(values[i]) : ''), '');

// ---------- parts ----------
// A coin lying flat: rim, face and a light ring.
const coin = (cx, cy, r = 5) => [ellipse(cx, cy + 1.3, r, r * 0.55, 'gold_dark'), ellipse(cx, cy, r, r * 0.55, 'gold'), ellipse(cx - 0.3, cy - 0.2, r * 0.58, r * 0.28, null, 'gold_light', 0.9)];
// A stack of coins: a gold cylinder with a line at each coin, and the top coin's face.
function stack(cx, baseY, n, r = 5.4) {
  const top = baseY - (n - 1) * 2.5, bottom = baseY + 1.3, out = [path(d`M${cx - r} ${top} L${cx - r} ${bottom} Q${cx} ${bottom + r * 1.1} ${cx + r} ${bottom} L${cx + r} ${top} Z`, 'gold_dark')];
  for (let i = 0; i < n - 1; i++) { const y = baseY - i * 2.5 - 1.2; out.push(line(d`M${cx - r + 0.6} ${y} Q${cx} ${y + r * 1.1} ${cx + r - 0.6} ${y}`, 'gold', 0.9)); }
  return [...out, ellipse(cx, top, r, r * 0.55, 'gold'), ellipse(cx - 0.3, top - 0.2, r * 0.58, r * 0.28, null, 'gold_light', 0.9)];
}
// A mound of gold with coin edges glinting on it.
function heap(cx, baseY, w, h) {
  const out = [path(d`M${cx - w} ${baseY} Q${cx - w * 0.5} ${baseY - h * 1.08} ${cx} ${baseY - h} Q${cx + w * 0.5} ${baseY - h * 1.08} ${cx + w} ${baseY} Q${cx} ${baseY + 2.4} ${cx - w} ${baseY} Z`, 'gold'),
    path(d`M${cx + w * 0.15} ${baseY - h * 0.98} Q${cx + w * 0.6} ${baseY - h * 0.95} ${cx + w} ${baseY} Q${cx + w * 0.55} ${baseY + 1.6} ${cx + w * 0.25} ${baseY + 1.2} Q${cx + w * 0.45} ${baseY - h * 0.45} ${cx + w * 0.15} ${baseY - h * 0.98} Z`, 'gold_dark', null)];
  const glints = [[-0.55, 0.35], [-0.15, 0.62], [0.3, 0.4], [-0.35, 0.1], [0.1, 0.15], [0.55, 0.12], [-0.05, 0.85]];
  for (const [gx, gy] of glints) if (gy * h > 2.4) out.push(line(d`M${cx + gx * w - 1.8} ${baseY - gy * h} q1.8 -1.1 3.6 0`, 'gold_light', 1));
  return out;
}
// An empty money pouch: slumped, its mouth open and dark, the drawstring hanging loose.
function purseEmpty(cx, baseY) {
  return [path(d`M${cx - 11} ${baseY} Q${cx - 13.5} ${baseY - 8} ${cx - 6} ${baseY - 11} Q${cx - 4} ${baseY - 12.5} ${cx - 6} ${baseY - 16.5} L${cx + 6} ${baseY - 16.5} Q${cx + 4} ${baseY - 12.5} ${cx + 6} ${baseY - 11} Q${cx + 13.5} ${baseY - 8} ${cx + 11} ${baseY} Q${cx} ${baseY + 2.4} ${cx - 11} ${baseY} Z`, 'leather_light'),
    ellipse(cx, baseY - 16.5, 6.2, 2.1, 'soot'),
    line(d`M${cx - 3} ${baseY - 13} Q${cx - 5} ${baseY - 6} ${cx - 8} ${baseY - 2} M${cx + 2} ${baseY - 12.5} Q${cx + 3} ${baseY - 6} ${cx + 1} ${baseY - 1} M${cx - 6.5} ${baseY - 7} Q${cx} ${baseY - 5} ${cx + 8} ${baseY - 7.5}`, 'leather', 1),
    line(d`M${cx - 5.5} ${baseY - 13.5} Q${cx} ${baseY - 12} ${cx + 5.5} ${baseY - 13.5}`, 'wool', 1.4),
    line(d`M${cx + 5.2} ${baseY - 13.4} Q${cx + 12} ${baseY - 14} ${cx + 13.5} ${baseY - 4}`, 'wool', 1.4)];
}
function chest(cx, baseY) {
  const top = baseY - 13;
  return [path(d`M${cx - 13} ${top} L${cx - 11} ${top - 13} L${cx + 11} ${top - 13} L${cx + 13} ${top} Z`, 'wood_dark'),
    line(d`M${cx - 10} ${top - 10.5} L${cx + 10} ${top - 10.5}`, 'iron', 1.6),
    ...heap(cx, top + 0.5, 15.5, 15),
    ...coin(cx - 7, top - 4.5, 3.3), ...coin(cx + 5.5, top - 7.5, 3.1),
    path(d`M${cx - 14} ${baseY} L${cx + 14} ${baseY} L${cx + 14} ${top} L${cx - 14} ${top} Z`, 'wood'),
    line(d`M${cx - 14} ${baseY - 6.5} L${cx + 14} ${baseY - 6.5}`, 'wood_dark', 1),
    line(d`M${cx - 8.5} ${baseY - 0.7} L${cx - 8.5} ${top + 0.7}`, 'iron', 2.2), line(d`M${cx + 8.5} ${baseY - 0.7} L${cx + 8.5} ${top + 0.7}`, 'iron', 2.2),
    path(d`M${cx - 2.4} ${top} L${cx + 2.4} ${top} L${cx + 2.4} ${top + 6} L${cx - 2.4} ${top + 6} Z`, 'gold_trim', OUT, 1),
    ...coin(cx + 15, baseY + 0.2, 3.6), ...coin(cx - 15.5, baseY - 0.4, 3.2), ...coin(cx + 6, baseY + 1.6, 3.2), ...coin(cx - 7, baseY + 1.8, 3)];
}
function bowl(cx, baseY, w, fill) {
  const rim = baseY - 9;
  const out = [ellipse(cx, baseY, 5.5, 1.7, 'wood_dark'),
    path(d`M${cx - w} ${rim} C${cx - w} ${baseY - 2} ${cx - 6} ${baseY} ${cx} ${baseY} C${cx + 6} ${baseY} ${cx + w} ${baseY - 2} ${cx + w} ${rim} Z`, 'wood'),
    line(d`M${cx - w + 2.5} ${rim + 2.5} Q${cx - w + 4} ${baseY - 3} ${cx - 5} ${baseY - 1.8}`, 'thatch', 1),
    ellipse(cx, rim, w, 3.4, 'wood_dark')];
  if (fill === 'low') out.push(ellipse(cx, rim + 1.7, w - 6.5, 1.15, 'porridge', null));
  if (fill === 'full') out.push(ellipse(cx, rim - 0.2, w - 1.4, 2.6, 'porridge', null));
  if (fill === 'heap') out.push(path(d`M${cx - w + 0.8} ${rim} Q${cx - w * 0.4} ${rim - 7.5} ${cx} ${rim - 7} Q${cx + w * 0.45} ${rim - 7.5} ${cx + w - 0.8} ${rim} Q${cx} ${rim + 3} ${cx - w + 0.8} ${rim} Z`, 'porridge'),
    line(d`M${cx - w * 0.45} ${rim - 3} Q${cx - w * 0.2} ${rim - 5.5} ${cx + 1} ${rim - 5}`, 'linen', 1));
  return out;
}
const spoon = (x, y) => [line(d`M${x} ${y} L${x + 8} ${y - 9}`, 'wood_dark', 2.2), ellipse(x - 0.6, y + 0.8, 2.4, 1.5, 'wood')];
const loaf = (cx, cy, s = 1) => [path(d`M${cx - 8 * s} ${cy + 3 * s} Q${cx - 9 * s} ${cy - 5 * s} ${cx} ${cy - 5.5 * s} Q${cx + 9 * s} ${cy - 5 * s} ${cx + 8 * s} ${cy + 3 * s} Q${cx} ${cy + 4.6 * s} ${cx - 8 * s} ${cy + 3 * s} Z`, 'bread'),
  line(d`M${cx - 4 * s} ${cy - 3.5 * s} l${-1.5 * s} ${3 * s} M${cx} ${cy - 4.2 * s} l${-1.5 * s} ${3 * s} M${cx + 4 * s} ${cy - 3.5 * s} l${-1.5 * s} ${3 * s}`, 'bread_crust', 1.1)];
const crust = (cx, cy) => [path(d`M${cx - 7} ${cy + 3} Q${cx - 8} ${cy - 4.5} ${cx - 1} ${cy - 5} L${cx + 3} ${cy - 4.6} L${cx + 3} ${cy + 3} Z`, 'bread'),
  path(d`M${cx + 3} ${cy - 4.6} L${cx + 6.5} ${cy - 3.8} L${cx + 6.5} ${cy + 3.4} L${cx + 3} ${cy + 3} Z`, 'porridge'),
  line(d`M${cx - 4} ${cy - 3} l-1.2 2.6`, 'bread_crust', 1)];
const apple = (cx, cy, r = 4.3) => [circle(cx, cy, r, 'apple'), ellipse(cx - r * 0.38, cy - r * 0.38, r * 0.32, r * 0.22, 'linen', null), line(d`M${cx} ${cy - r} L${cx + 0.8} ${cy - r - 2.4}`, 'wood_dark', 1.2), ellipse(cx + 2.4, cy - r - 1.6, 1.9, 0.9, 'leaf', OUT, 0.8)];
const meat = (cx, cy) => [line(d`M${cx + 1} ${cy - 0.5} L${cx + 7} ${cy - 4.5}`, 'outline', 4), line(d`M${cx + 1} ${cy - 0.5} L${cx + 7} ${cy - 4.5}`, 'plaster', 2.2),
  circle(cx + 7.6, cy - 5.6, 1.5, 'plaster', OUT, 1), circle(cx + 8.4, cy - 3.8, 1.5, 'plaster', OUT, 1),
  path(d`M${cx - 6} ${cy + 2.5} Q${cx - 8.5} ${cy - 5} ${cx - 1.5} ${cy - 5.4} Q${cx + 4} ${cy - 5} ${cx + 3} ${cy} Q${cx + 1.5} ${cy + 4.5} ${cx - 6} ${cy + 2.5} Z`, 'meat'),
  line(d`M${cx - 4.5} ${cy - 2.5} Q${cx - 2} ${cy - 4} ${cx + 0.5} ${cy - 3.5}`, 'linen', 1)];
const fish = (cx, cy) => [path(d`M${cx + 4} ${cy} L${cx + 9} ${cy - 4} L${cx + 9} ${cy + 4} Z`, 'steel_dark'),
  path(d`M${cx - 8} ${cy} Q${cx - 2} ${cy - 5.5} ${cx + 5} ${cy} Q${cx - 2} ${cy + 5.5} ${cx - 8} ${cy} Z`, 'steel'),
  line(d`M${cx - 4} ${cy + 1.2} Q${cx} ${cy + 2.8} ${cx + 3} ${cy + 0.8}`, 'steel_dark', 0.9), circle(cx - 5, cy - 0.8, 0.9, 'soot', null)];
const plate = (cx, baseY, w) => [ellipse(cx, baseY - 2.6, w, w * 0.33, 'stone_light'), ellipse(cx, baseY - 2.9, w - 3, w * 0.33 - 1.6, null, 'stone', 1)];
const cloth = (cx, baseY) => [path(d`M${cx - 14} ${baseY - 1} L${cx - 6} ${baseY - 7} L${cx + 14} ${baseY - 6} L${cx + 9} ${baseY + 0.5} Z`, 'linen'), line(d`M${cx - 10} ${baseY - 3.6} L${cx + 11.5} ${baseY - 2.7}`, 'cloth_red', 1)];
function basket(cx, baseY, contents) {
  const rim = baseY - 11;
  return [line(d`M${cx - 11.5} ${rim} Q${cx} ${rim - 22} ${cx + 11.5} ${rim}`, 'outline', 3.6), line(d`M${cx - 11.5} ${rim} Q${cx} ${rim - 22} ${cx + 11.5} ${rim}`, 'wood', 1.8),
    ...contents,
    path(d`M${cx - 13.5} ${rim} L${cx + 13.5} ${rim} L${cx + 10} ${baseY} L${cx - 10} ${baseY} Z`, 'thatch'),
    line(d`M${cx - 12.4} ${rim + 3.6} L${cx + 12.4} ${rim + 3.6} M${cx - 11.3} ${rim + 7.2} L${cx + 11.3} ${rim + 7.2}`, 'wood', 1),
    line(d`M${cx - 6} ${rim} L${cx - 5} ${baseY} M${cx} ${rim} L${cx} ${baseY} M${cx + 6} ${rim} L${cx + 5} ${baseY}`, 'wood', 0.9),
    path(d`M${cx - 14} ${rim - 1.4} L${cx + 14} ${rim - 1.4} L${cx + 14} ${rim + 1.4} L${cx - 14} ${rim + 1.4} Z`, 'wood')];
}

// ---------- the sets ----------
// Each look returns one shape list per level, from the least to the most.
// ---------- domestic animals ----------
// A tabby cat sitting in profile, tail curled round its paws.
function catSitting() {
  return [line('M15 35.5 Q5.5 36.5 6.5 29.5', OUT, 4.6), line('M15 35.5 Q5.5 36.5 6.5 29.5', 'horse_grey', 2.6),
    path('M12.5 36.5 Q9.5 26 15 19.5 Q19.5 15.5 24.5 18.5 Q28.5 25 27.5 36.5 Z', 'horse_grey'),
    line('M14 25 q2.5 1 4.5 0', 'stone_dark', 1.3), line('M13.2 29.5 q3 1.1 5.5 0', 'stone_dark', 1.3), line('M13.5 33.5 q3 1 5.5 0', 'stone_dark', 1.3),
    path('M22.5 25 L23 36.5 L26.6 36.5 L26.2 24.5 Z', 'horse_grey'),
    path('M18.6 11.5 L19.4 4.5 L24 9.6 Z', 'horse_grey'), path('M24.6 9.6 L29.6 5 L29.8 11.8 Z', 'horse_grey'),
    circle(24.5, 14.5, 6.2, 'horse_grey'), line('M21.5 9.5 l1.5 2.6 M24.5 8.5 l0 2.8 M27.2 9.4 l-1.2 2.6', 'stone_dark', 1.1),
    ellipse(27, 14, 1, 1.3, 'soot', null), path('M30.3 15.6 l-1.5 1.1 l-0.3 -1.5 Z', 'blossom', null), line('M29 17.5 l4.5 -0.6 M29 18.4 l4.3 0.8', OUT, 0.6)];
}
// A tan hound sitting in profile, with a brown ear and a red collar.
function dogSitting() {
  return [line('M10.5 33 Q4 30.5 5 23.5', OUT, 4.4), line('M10.5 33 Q4 30.5 5 23.5', 'wool', 2.4),
    path('M8.5 37.5 Q7 28 13.5 23 Q19.5 19 25 21.5 L27.5 37.5 Z', 'wool'),
    path('M21.5 24.5 Q21.5 15.5 26 11.5 L31.5 15.5 Q28.5 21.5 27.5 27 Z', 'wool'),
    path('M22.5 25.5 L23 37.5 L26.8 37.5 L26.4 24.5 Z', 'wool'),
    ellipse(28, 12.5, 6.2, 5.6, 'wool'), path('M31 10.5 L37.5 12.6 Q38.5 16.8 33.5 17.6 L30 17 Z', 'wool'),
    ellipse(37.3, 13.4, 1.4, 1.2, 'soot', null), ellipse(29.6, 10.9, 1, 1.2, 'soot', null),
    path('M24.3 9 Q21.8 15.5 24.2 20.5 Q27.6 17.5 27.8 9.6 Z', 'horse_dark'),
    line('M22.3 20.2 Q26 22.6 30.2 18.6', OUT, 3.2), line('M22.3 20.2 Q26 22.6 30.2 18.6', 'cloth_red', 1.8), circle(26.2, 22.8, 1.2, 'gold')];
}
// Heads seen from the front: a ginger cat and a hound.
function catHead() {
  return [path('M10 18 L8.5 4.5 L18.5 11.5 Z', 'cloth_ochre'), path('M21.5 11.5 L31.5 4.5 L30 18 Z', 'cloth_ochre'),
    path('M11.3 14.5 L10.6 8 L15.6 11.6 Z', 'blossom', null), path('M24.4 11.6 L29.4 8 L28.7 14.5 Z', 'blossom', null),
    ellipse(20, 22, 11.5, 10.5, 'cloth_ochre'), line('M17 13 l1 3 M20 12 l0 3.2 M23 13 l-1 3', 'horse_chestnut', 1.3),
    ellipse(20, 27.5, 5.6, 3.8, 'linen', null), ellipse(15.3, 20.5, 1.7, 2.4, 'soot', null), ellipse(24.7, 20.5, 1.7, 2.4, 'soot', null),
    path('M18.4 24.6 L21.6 24.6 L20 26.4 Z', 'blossom', null), line('M14.5 27 l-7 -1 M14.5 28.5 l-7 1 M25.5 27 l7 -1 M25.5 28.5 l7 1', OUT, 0.6)];
}
function dogHead() {
  return [ellipse(20, 20.5, 9.8, 11, 'wool'),
    path('M12 12.5 Q4 17 6.5 30.5 Q10.8 31.5 13.2 24 Z', 'horse_dark'), path('M28 12.5 Q36 17 33.5 30.5 Q29.2 31.5 26.8 24 Z', 'horse_dark'),
    ellipse(20, 27.5, 6.4, 5.2, 'linen'), ellipse(20, 24.8, 2.8, 1.9, 'soot', null), line('M20 26.5 l0 2.2 M17.5 29.5 q2.5 1.4 5 0', OUT, 0.8),
    ellipse(16, 18.5, 1.4, 1.7, 'soot', null), ellipse(24, 18.5, 1.4, 1.7, 'soot', null),
    path('M11.5 33 Q20 38 28.5 33 L28.5 36.2 Q20 41.2 11.5 36.2 Z', 'cloth_red'), circle(20, 38.8, 1.6, 'gold')];
}

const LOOKS = {
  tax: {
    heaps: () => [purseEmpty(20, 30),
      [...coin(12.5, 26.5, 6.2), ...coin(27, 29, 6.2), ...coin(19, 33, 6.2)],
      [...coin(11, 31, 5.6), ...coin(29, 31.5, 5.6), ...coin(20, 33, 5.6), ...coin(15, 25.5, 5.6), ...coin(25.5, 25.5, 5.6), ...coin(20, 19.5, 5.6)],
      [...heap(20, 32, 14.5, 16.5), ...coin(7.5, 34, 4), ...coin(32.5, 34.5, 4)],
      chest(20, 35)],
    stacks: () => [purseEmpty(20, 30),
      [...stack(15, 31, 2, 6.2), ...coin(27, 32, 6.2)],
      [...stack(13, 33, 5, 6), ...stack(27, 33, 4, 6), ...coin(20, 35.2, 4.4)],
      [...stack(9.5, 33, 5), ...stack(30.5, 33, 6), ...stack(20, 30, 8), ...coin(15, 35.5, 4.2), ...coin(26, 35.5, 4.2)],
      chest(20, 35)],
  },
  ration: {
    bowls: () => [bowl(20, 32, 13, 'low'),
      [...bowl(20, 33, 14, 'heap'), ...spoon(26, 17)],
      [...plate(20, 37, 19), ...loaf(13.5, 24.5, 1.2), ...meat(25.5, 24.5), ...fish(15, 32), ...apple(29, 30.5, 4.8)]],
    basket: () => [[...cloth(20, 33), ...crust(19.5, 26)],
      [...bowl(17, 33, 13, 'heap'), ...crust(30.5, 30)],
      basket(20, 36, [...loaf(13, 19.5, 1.05), ...fish(26, 20.5), ...meat(18.5, 21.5), ...apple(27.5, 15.5, 4.4), ...apple(8.5, 21, 3.8)])],
  },
  pets: {
    seated: () => [catSitting(), dogSitting()],
    heads: () => [catHead(), dogHead()],
  },
  night: {
    plain: () => [pitchBarrel(20, 36), torch(20, 38), [...torch(20, 38, false), ...noSign(20, 21, 15)], wolfHead(20, 20), thief(20, 37), roofFire(20, 37)],
    badges: () => [badge(pitchBarrel(20, 32), 'wood'), badge(torch(20, 37), 'gold'), badge([...torch(20, 38, false), ...noSign(20, 20, 13)], 'banner_red'), badge(wolfHead(20, 20), 'banner_red'), badge(thief(20, 35), 'banner_red'), badge(roofFire(20, 36), 'banner_red')],
  },
};

// ---------- night (g-noc-grafika) ----------
const flame = (cx, baseY, h, w = h * 0.55) => [path(d`M${cx} ${baseY - h} Q${cx + w * 0.4} ${baseY - h * 0.6} ${cx + w * 0.55} ${baseY - h * 0.35} Q${cx + w * 0.6} ${baseY} ${cx} ${baseY} Q${cx - w * 0.6} ${baseY} ${cx - w * 0.55} ${baseY - h * 0.35} Q${cx - w * 0.5} ${baseY - h * 0.55} ${cx - w * 0.15} ${baseY - h * 0.75} Q${cx - w * 0.05} ${baseY - h * 0.55} ${cx} ${baseY - h} Z`, 'fire_edge'),
  path(d`M${cx} ${baseY - h * 0.72} Q${cx + w * 0.35} ${baseY - h * 0.35} ${cx + w * 0.3} ${baseY - h * 0.15} Q${cx} ${baseY + 1} ${cx - w * 0.3} ${baseY - h * 0.15} Q${cx - w * 0.3} ${baseY - h * 0.4} ${cx} ${baseY - h * 0.72} Z`, 'fire', null),
  ellipse(cx, baseY - h * 0.2, w * 0.17, h * 0.17, 'fire_core', null)];
function pitchBarrel(cx, baseY) {
  const top = baseY - 22;
  return [path(d`M${cx - 10} ${top} Q${cx - 13} ${baseY - 11} ${cx - 10} ${baseY} L${cx + 10} ${baseY} Q${cx + 13} ${baseY - 11} ${cx + 10} ${top} Z`, 'wood'),
    line(d`M${cx - 11.3} ${top + 5} Q${cx} ${top + 7.5} ${cx + 11.3} ${top + 5} M${cx - 11.3} ${baseY - 5} Q${cx} ${baseY - 2.5} ${cx + 11.3} ${baseY - 5}`, 'iron', 2),
    line(d`M${cx - 4} ${top + 1} L${cx - 4.5} ${baseY - 0.5} M${cx + 4} ${top + 1} L${cx + 4.5} ${baseY - 0.5}`, 'wood_dark', 0.9),
    ellipse(cx, top, 10, 3.2, 'soot'), ellipse(cx - 2, top - 0.5, 4, 1.1, null, 'charcoal', 1),
    path(d`M${cx + 5} ${top + 1} Q${cx + 9} ${top + 6} ${cx + 8} ${top + 11} Q${cx + 6.5} ${top + 12} ${cx + 6} ${top + 9} Q${cx + 5} ${top + 5} ${cx + 3} ${top + 2} Z`, 'soot', null)];
}
function torch(cx, baseY, lit = true) {
  const out = [path(d`M${cx - 2} ${baseY} L${cx - 3} ${baseY - 18} L${cx + 3} ${baseY - 18} L${cx + 2} ${baseY} Z`, 'wood_dark'),
    path(d`M${cx - 4.5} ${baseY - 17} L${cx + 4.5} ${baseY - 17} L${cx + 4} ${baseY - 23} L${cx - 4} ${baseY - 23} Z`, 'linen'),
    line(d`M${cx - 4.3} ${baseY - 19} L${cx + 4.3} ${baseY - 19} M${cx - 4.1} ${baseY - 21} L${cx + 4.1} ${baseY - 21}`, 'soot', 0.8)];
  if (lit) out.push(...flame(cx, baseY - 22, 14, 10));
  else out.push(line(d`M${cx - 1} ${baseY - 24} Q${cx - 4} ${baseY - 28} ${cx} ${baseY - 31} Q${cx + 3} ${baseY - 34} ${cx - 1} ${baseY - 37}`, 'stone', 1.6));
  return out;
}
const noSign = (cx, cy, r) => [circle(cx, cy, r, null, 'outline', 5), circle(cx, cy, r, null, 'banner_red', 3), line(d`M${cx - r * 0.7} ${cy + r * 0.7} L${cx + r * 0.7} ${cy - r * 0.7}`, 'outline', 5), line(d`M${cx - r * 0.7} ${cy + r * 0.7} L${cx + r * 0.7} ${cy - r * 0.7}`, 'banner_red', 3)];
function wolfHead(cx, cy, fill = 'stone') {
  return [path(d`M${cx - 11} ${cy - 2} L${cx - 9} ${cy - 15} L${cx - 3.5} ${cy - 8} L${cx + 3.5} ${cy - 8} L${cx + 9} ${cy - 15} L${cx + 11} ${cy - 2} Q${cx + 9} ${cy + 6} ${cx} ${cy + 13} Q${cx - 9} ${cy + 6} ${cx - 11} ${cy - 2} Z`, fill),
    path(d`M${cx - 4.5} ${cy + 2} Q${cx} ${cy - 1} ${cx + 4.5} ${cy + 2} L${cx + 2.5} ${cy + 10} Q${cx} ${cy + 13} ${cx - 2.5} ${cy + 10} Z`, 'stone_light', null),
    path(d`M${cx - 7} ${cy - 3} L${cx - 2} ${cy - 1.5} L${cx - 3.5} ${cy + 0.5} Z`, 'gold'), path(d`M${cx + 7} ${cy - 3} L${cx + 2} ${cy - 1.5} L${cx + 3.5} ${cy + 0.5} Z`, 'gold'),
    ellipse(cx, cy + 10, 2.4, 1.6, 'soot', null), path(d`M${cx - 8.2} ${cy - 12} L${cx - 6} ${cy - 6} L${cx - 8} ${cy - 6} Z`, 'soot', null), path(d`M${cx + 8.2} ${cy - 12} L${cx + 6} ${cy - 6} L${cx + 8} ${cy - 6} Z`, 'soot', null)];
}
function thief(cx, baseY) {
  return [path(d`M${cx + 4} ${baseY - 18} Q${cx + 15} ${baseY - 20} ${cx + 14} ${baseY - 8} Q${cx + 13} ${baseY - 2} ${cx + 5} ${baseY - 4} Z`, 'linen'),
    line(d`M${cx + 5} ${baseY - 17} L${cx + 7} ${baseY - 20}`, 'wool', 1.4),
    path(d`M${cx - 9} ${baseY} L${cx - 7} ${baseY - 16} Q${cx - 6} ${baseY - 27} ${cx} ${baseY - 29} Q${cx + 7} ${baseY - 27} ${cx + 7} ${baseY - 17} L${cx + 9} ${baseY} Z`, 'charcoal'),
    path(d`M${cx - 4.5} ${baseY - 23} Q${cx} ${baseY - 26} ${cx + 4.5} ${baseY - 23} L${cx + 4} ${baseY - 18} Q${cx} ${baseY - 16} ${cx - 4} ${baseY - 18} Z`, 'soot', null),
    line(d`M${cx - 2.6} ${baseY - 21} L${cx - 0.8} ${baseY - 20.6} M${cx + 0.8} ${baseY - 20.6} L${cx + 2.6} ${baseY - 21}`, 'gold_light', 1.3),
    ...coin(cx - 12, baseY + 0.5, 3.2)];
}
function roofFire(cx, baseY) {
  return [path(d`M${cx - 16} ${baseY - 10} L${cx} ${baseY - 22} L${cx + 16} ${baseY - 10} Z`, 'thatch'),
    path(d`M${cx - 13} ${baseY - 10} L${cx + 13} ${baseY - 10} L${cx + 13} ${baseY} L${cx - 13} ${baseY} Z`, 'plaster'),
    path(d`M${cx - 3} ${baseY} L${cx - 3} ${baseY - 7} L${cx + 3} ${baseY - 7} L${cx + 3} ${baseY} Z`, 'wood_dark'),
    ...flame(cx - 6, baseY - 14, 16, 11), ...flame(cx + 6, baseY - 12, 13, 9),
    ellipse(cx + 10, baseY - 32, 5, 3, 'stone', null), ellipse(cx + 4, baseY - 35, 3.5, 2.2, 'stone_light', null)];
}
const badge = (shapes, ring = 'banner_red') => [circle(20, 20, 18.5, 'charcoal', ring, 2.4), ...shapes];

// ---------- fitting a set into the icon ----------
// Bounds of a shape list (paths: every point, control points included), with half the stroke.
export function bounds(shapes) {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }, add = (x, y, pad) => { b.x0 = Math.min(b.x0, x - pad); b.y0 = Math.min(b.y0, y - pad); b.x1 = Math.max(b.x1, x + pad); b.y1 = Math.max(b.y1, y + pad); };
  for (const s of shapes) {
    const pad = s.stroke ? s.width / 2 : 0;
    if (s.t === 'ellipse') { add(s.cx - s.rx, s.cy - s.ry, pad); add(s.cx + s.rx, s.cy + s.ry, pad); continue; }
    const tokens = s.d.match(/[MLQCZmlqcz]|-?\d*\.?\d+/g), counts = { m: 2, l: 2, q: 4, c: 6, z: 0 };
    let i = 0, x = 0, y = 0, cmd = 'M';
    while (i < tokens.length) {
      if (/[a-z]/i.test(tokens[i])) cmd = tokens[i++];
      const n = counts[cmd.toLowerCase()], rel = cmd === cmd.toLowerCase();
      if (!n) continue;
      const nums = tokens.slice(i, i + n).map(Number); i += n;
      for (let k = 0; k < n; k += 2) add(rel ? x + nums[k] : nums[k], rel ? y + nums[k + 1] : nums[k + 1], pad);
      x = rel ? x + nums[n - 2] : nums[n - 2]; y = rel ? y + nums[n - 1] : nums[n - 1];
    }
  }
  return b;
}
// One scale for the whole set, so the amounts keep growing from level to level: the largest icon fills the 40 × 40 box
// (2 px margin), every icon stands on the same baseline.
export function fitSet(levels) {
  const all = bounds(levels.flat()), margin = 2, room = ICON_SIZE - margin * 2;
  const s = Math.floor(Math.min(1.6, room / (all.x1 - all.x0), room / (all.y1 - all.y0)) * 100) / 100;
  return { s, tx: r1(ICON_SIZE / 2 - s * (all.x0 + all.x1) / 2), ty: r1(ICON_SIZE - margin - s * all.y1) };
}

// ---------- recipe interface ----------
export const params = [
  { key: 'set', description: 'Which slider the icons are for', values: Object.keys(SETS) },
  { key: 'look', description: 'Drawing style of the set', values: [...new Set(Object.values(LOOKS).flatMap(Object.keys))] },
];
export function validate(spec) {
  const problems = [];
  if (!SETS[spec?.set]) problems.push(`set must be one of ${Object.keys(SETS).join(', ')}.`);
  else if (!LOOKS[spec.set][spec.look]) problems.push(`look must be one of ${Object.keys(LOOKS[spec.set]).join(', ')}.`);
  return problems;
}
// The shape lists of a recipe, one per level, with the level ids.
export function icons(spec) {
  const set = SETS[spec.set], drawn = LOOKS[spec.set][spec.look]();
  if (drawn.length !== set.levels.length) throw new Error(`${spec.set}/${spec.look} draws ${drawn.length} icons for ${set.levels.length} levels`);
  const fit = fitSet(drawn);
  return drawn.map((shapes, i) => ({ level: set.levels[i], name: set.names[i], shapes, fit }));
}
export function colour(style, name) {
  if (name == null) return null;
  const hex = style.palette?.[name];
  if (!hex) throw new RangeError(`"${name}" is not a style-guide palette colour`);
  return hex;
}
export function toSvg(shapes, style, fit = { s: 1, tx: 0, ty: 0 }) {
  const attrs = s => `${s.fill ? ` fill="${colour(style, s.fill)}"` : ' fill="none"'}${s.stroke ? ` stroke="${colour(style, s.stroke)}" stroke-width="${s.width}"` : ''}`;
  const body = shapes.map(s => s.t === 'ellipse' ? `<ellipse cx="${r1(s.cx)}" cy="${r1(s.cy)}" rx="${r1(s.rx)}" ry="${r1(s.ry)}"${attrs(s)}/>` : `<path d="${s.d}"${attrs(s)}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}" stroke-linejoin="round" stroke-linecap="round"><g transform="translate(${fit.tx} ${fit.ty}) scale(${fit.s})">${body}</g></svg>`;
}
export function drawIcon(ctx, shapes, style, size = ICON_SIZE, fit = { s: 1, tx: 0, ty: 0 }) {
  ctx.save(); ctx.scale(size / ICON_SIZE, size / ICON_SIZE); ctx.translate(fit.tx, fit.ty); ctx.scale(fit.s, fit.s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const s of shapes) {
    const p = new Path2D();
    if (s.t === 'ellipse') p.ellipse(s.cx, s.cy, s.rx, s.ry, 0, 0, Math.PI * 2); else p.addPath(new Path2D(s.d));
    if (s.fill) { ctx.fillStyle = colour(style, s.fill); ctx.fill(p); }
    if (s.stroke) { ctx.strokeStyle = colour(style, s.stroke); ctx.lineWidth = s.width; ctx.stroke(p); }
  }
  ctx.restore();
}
export const GAP = 8;
// The preview sprite is the whole set in a row; each icon is also kept on its own (`icons`) for the export.
export function paint(spec, { style, scale = 1 }) {
  const list = icons(spec), size = ICON_SIZE * scale, gap = GAP * scale;
  const canvas = document.createElement('canvas');
  canvas.width = list.length * size + (list.length - 1) * gap; canvas.height = size;
  const one = list.map(({ shapes, fit }) => { const c = document.createElement('canvas'); c.width = c.height = size; drawIcon(c.getContext('2d'), shapes, style, size, fit); return c; });
  one.forEach((c, i) => canvas.getContext('2d').drawImage(c, i * (size + gap), 0));
  return { canvas, front: null, width: canvas.width, height: canvas.height, anchor: { x: Math.round(canvas.width / 2), y: canvas.height }, lights: [], scale, modelHeight: 0, icons: list.map(({ level, name }, i) => ({ level, name, canvas: one[i] })), iconSet: true };
}

export default { id: 'icon', version: 1, label: 'UI icons (2D)', kind: 'icon', params, validate, paint, icons, toSvg, drawIcon };
