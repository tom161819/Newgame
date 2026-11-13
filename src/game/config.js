// m-velikost-mapy (34): the map is square, MAP_SIZES tiles a side; 100 is the default and the size of every save
// made before 0.108. COLUMNS / ROWS are live bindings: setMapSize changes them for the whole game (a new game takes
// the size from its settings, a loaded one from its saved terrain). Modules that keep something derived from the
// size at load time register a listener with onMapSize.
export const MAP_SIZES = Object.freeze([100, 150, 200, 250, 300]);
export const DEFAULT_MAP_SIZE = 100;
export let COLUMNS = 100;
export let ROWS = 100;
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const MAP_HEADROOM = 128;
// The castle stands in the middle of the map; the object is kept and changed in place by setMapSize.
export const PLAYER_START = { x: 50, y: 50 };
const listeners = [];
export function onMapSize(listener) { listeners.push(listener); listener(COLUMNS, ROWS); }
export function validMapSize(size) { return MAP_SIZES.includes(size); }
export function setMapSize(size = DEFAULT_MAP_SIZE) {
  if (!validMapSize(size)) throw new Error(`Neplatná velikost mapy: ${size}`);
  if (size === COLUMNS && size === ROWS) return false;
  COLUMNS = size; ROWS = size; PLAYER_START.x = size / 2; PLAYER_START.y = size / 2;
  for (const listener of listeners) listener(COLUMNS, ROWS);
  return true;
}
// How many 100 × 100 maps fit in this one (counts of trees, stones and animals grow with it).
export function mapArea() { return COLUMNS * ROWS / 10000; }
// Runs fn with the map at `size` and puts the previous size back (save checks of a save of another size).
export function withMapSize(size, fn) {
  const before = COLUMNS; if (!validMapSize(size) || size === before) return fn();
  setMapSize(size); try { return fn(); } finally { setMapSize(before); }
}
