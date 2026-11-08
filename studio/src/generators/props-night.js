// Night props (plan g-noc-grafika): torch brackets for the town wall and the towers. Each holder is an iron arm with a
// cup and a burning torch (light type 'torch', flame added at runtime like the torch post), shown on a short piece of
// wall or the corner of a tower so it reads in the Studio; the game puts the bracket on its own walls.
import { box, cylinder, sphere, prism } from './shapes.js';
import { PROPS } from './props.js';

const place = (parts, x, z, r = 0) => parts.map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] }));
// Bracket fixed to a wall face at local x = 0 pointing +z, cup at height y. style: 'arm' (plain iron arm and a ring),
// 'scroll' (forged scroll with a drip tray), 'cage' (iron cage, for windy towers).
function bracket(y, style) {
  const parts = [box([0.1, 0.12, 0.02], [0, y - 0.04, 0.01], 'iron'), ...[-0.03, 0.03].map(dx => sphere([0.012, 0.012, 0.01], [dx, y + 0.02, 0.022], 'steel_dark', 0))];
  parts.push(box([0.025, 0.025, 0.16], [0, y, 0.09], 'iron'), box([0.02, 0.1, 0.02], [0, y - 0.1, 0.05], 'iron', { tilt: [-0.7, 0] }));
  if (style === 'scroll') parts.push(sphere([0.03, 0.03, 0.012], [0, y - 0.07, 0.03], 'iron', 0), cylinder({ radiusBottom: 0.05, radiusTop: 0.06, height: 0.015, segments: 10 }, [0, y - 0.05, 0.17], 'iron'));
  const cup = [0, y, 0.17];
  if (style === 'cage') for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; parts.push(box([0.012, 0.16, 0.012], [cup[0] + Math.cos(a) * 0.045, y, cup[2] + Math.sin(a) * 0.045], 'iron')); }
  parts.push(cylinder({ radiusBottom: 0.03, radiusTop: 0.045, height: 0.05, segments: 8 }, cup, 'iron'));
  parts.push(cylinder({ radiusBottom: 0.018, radiusTop: 0.022, height: 0.2, segments: 6 }, [cup[0], y + 0.02, cup[2]], 'wood_dark'), cylinder({ radiusBottom: 0.03, radiusTop: 0.032, height: 0.06, segments: 7 }, [cup[0], y + 0.2, cup[2]], 'cloth_linen'));
  return { parts, light: [cup[0], y + 0.3, cup[2]] };
}
Object.assign(PROPS, {
  // A piece of the town wall (stone, crenellated) with a torch bracket on its outer face.
  wallTorch: (x, z, { style = 'arm', wall = 'stone' } = {}) => {
    const parts = [box([0.9, 0.9, 0.3], [0, 0, -0.15], wall), box([0.9, 0.04, 0.32], [0, 0.9, -0.15], 'stone_dark')];
    for (const dx of [-0.36, -0.12, 0.12, 0.36]) parts.push(box([0.16, 0.14, 0.3], [dx, 0.94, -0.15], wall));
    parts.push(box([0.9, 0.05, 0.04], [0, 0.0, 0.02], 'stone_dark'));
    const b = bracket(0.55, style);
    parts.push(...b.parts);
    parts.push(box([0.12, 0.25, 0.006], [0, 0.72, 0.002], 'soot')); // soot on the wall above the flame
    return Object.assign(place(parts, x, z), { lights: [{ type: 'torch', at: [x + b.light[0], b.light[1], z + b.light[2]] }] });
  },
  // The corner of a round tower with a bracket by the door or high on the wall.
  towerTorch: (x, z, { style = 'cage', high = true } = {}) => {
    const parts = [cylinder({ radiusBottom: 0.36, radiusTop: 0.34, height: 1.4, segments: 14 }, [0, 0, -0.36], 'stone'), cylinder({ radiusBottom: 0.38, radiusTop: 0.38, height: 0.06, segments: 14 }, [0, 1.4, -0.36], 'stone_dark')];
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; parts.push(box([0.11, 0.14, 0.11], [Math.cos(a) * 0.31, 1.46, -0.36 + Math.sin(a) * 0.31], 'stone', { rotation: -a })); }
    parts.push(box([0.24, 0.42, 0.04], [0.18, 0, -0.03], 'wood_dark'), box([0.26, 0.04, 0.05], [0.18, 0.42, -0.03], 'stone_dark'));
    const b = bracket(high ? 0.95 : 0.6, style), shift = high ? -0.12 : -0.15;
    parts.push(...b.parts.map(p => ({ ...p, at: [p.at[0] + shift, p.at[1], p.at[2]] })));
    return Object.assign(place(parts, x, z), { lights: [{ type: 'torch', at: [x + b.light[0] + shift, b.light[1], z + b.light[2]] }] });
  },
  // Fire on a roof (N3 fires): a small timber cottage with a thatch or shingle roof in three stages. Flames are runtime
  // lights (type 'brazier', flickering) along the ridge; smoke is a column of grey puffs leaning downwind; burnt
  // patches of the roof turn to soot. stage: 'smoke' (smouldering), 'burning', 'blaze'.
  roofFire: (x, z, { stage = 'burning', roof = 'thatch' } = {}) => {
    const W = 0.7, D = 0.56, H = 0.42, parts = [box([W, H, D], [0, 0, 0], 'plaster')];
    for (const dx of [-W / 2 + 0.02, 0, W / 2 - 0.02]) parts.push(box([0.04, H, 0.04], [dx, 0, D / 2], 'wood_dark'));
    parts.push(box([W, 0.04, 0.04], [0, H - 0.04, D / 2], 'wood_dark'), box([0.14, 0.26, 0.02], [0.12, 0, D / 2 + 0.01], 'wood_dark'), box([0.12, 0.1, 0.02], [-0.18, 0.2, D / 2 + 0.01], stage === 'smoke' ? 'soot' : 'coals'));
    parts.push(prism([W + 0.12, 0.36, D + 0.14], [0, H, 0], roof));
    const burnt = stage === 'smoke' ? 1 : stage === 'burning' ? 2 : 4;
    for (let i = 0; i < burnt; i++) parts.push(box([0.18, 0.012, 0.2], [-0.2 + i * 0.14, H + 0.2 - (i % 2) * 0.06, 0.15 - (i % 2) * 0.05], 'soot', { tilt: [0.75, 0] }));
    const puffs = stage === 'smoke' ? 4 : stage === 'burning' ? 6 : 8;
    for (let i = 0; i < puffs; i++) { const t = i / puffs, r = 0.07 + t * 0.12; parts.push(sphere([r, r * 0.8, r], [-0.05 + t * 0.35, H + 0.38 + t * 0.9, -0.05 - t * 0.1], i % 3 === 2 ? 'stone_dark' : i % 2 ? 'stone' : 'stone_light', 1)); }
    const flames = stage === 'smoke' ? [] : stage === 'burning' ? [[-0.15, 0.3], [0.05, 0.36], [-0.25, 0.22]] : [[-0.28, 0.25], [-0.12, 0.34], [0.05, 0.36], [0.2, 0.3], [0.3, 0.22], [-0.18, 0.12, 0.2]];
    for (const [fx, fy, fz = 0.06] of flames) parts.push(sphere([0.06, 0.03, 0.06], [fx, H + fy - 0.02, fz], 'coals', 1));
    return Object.assign(place(parts, x, z), { lights: [...flames.map(([fx, fy, fz = 0.06]) => ({ type: 'brazier', at: [x + fx, H + fy + 0.04, z + fz] })), ...(stage === 'smoke' ? [{ type: 'window', at: [x - 0.18, 0.25, z + D / 2 + 0.03] }] : [])] });
  },
});
