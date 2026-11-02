// Názvy směrů vycházejí z logické mřížky: N = y-1, E = x+1.
const OCTANTS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

export function directionName(vector) {
  if (!vector || Math.hypot(vector.x, vector.y) < 1e-8) return null;
  const octant = Math.round(Math.atan2(vector.y, vector.x) / (Math.PI / 4));
  return OCTANTS[(octant + 8) % 8];
}

// Samostatná vazba logického směru na izometrický vzhled postavy.
export const DIRECTION_POSES = Object.freeze({
  N:  { screenX: 1, screenY: -0.5, back: true, profile: false },
  NE: { screenX: 1, screenY: 0, back: false, profile: true },
  E:  { screenX: 1, screenY: 0.5, back: false, profile: false },
  SE: { screenX: 0, screenY: 1, back: false, profile: false },
  S:  { screenX: -1, screenY: 0.5, back: false, profile: false },
  SW: { screenX: -1, screenY: 0, back: false, profile: true },
  W:  { screenX: -1, screenY: -0.5, back: true, profile: false },
  NW: { screenX: 0, screenY: -1, back: true, profile: false },
});
