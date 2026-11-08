// Path Lab (#115 D/E): the tuning parameters and presets. "current" is the production N12 renderer and has no
// tunable geometry; every parameter drives the Experimental V2 renderer of #116.
export const PARAMS = Object.freeze([
  { key: 'meanderStrength', label: 'Meander strength', min: 0, max: 1, step: 0.01, default: 0.35, unit: '', tip: 'How far a long path drifts from a straight line (low-frequency bends).' },
  { key: 'meanderFrequency', label: 'Meander frequency', min: 0.05, max: 0.6, step: 0.01, default: 0.18, unit: '/tile', tip: 'How often the drift changes direction along the path.' },
  { key: 'meanderSmoothness', label: 'Meander smoothness', min: 0, max: 1, step: 0.01, default: 0.7, unit: '', tip: 'Higher keeps the bends long and calm; lower adds small local wobble.' },
  { key: 'cornerRounding', label: 'Corner rounding', min: 0, max: 1, step: 0.01, default: 0.6, unit: '', tip: 'How much a 90° turn is rounded.' },
  { key: 'minCurveRadius', label: 'Minimum curve radius', min: 0.2, max: 1.5, step: 0.05, default: 0.6, unit: 'tiles', tip: 'The tightest allowed radius at a corner, kept inside the trodden tiles.' },
  { key: 'widthGrass', label: 'Path width, level 1 (grass)', min: 2, max: 20, step: 1, default: 9, unit: 'px', tip: 'Width of a track of trampled grass (no soil yet).' },
  { key: 'width1', label: 'Path width, level 2', min: 2, max: 20, step: 1, default: 6, unit: 'px', tip: 'Width of a lightly trodden soil path (the game\'s wear 1).' },
  { key: 'width2', label: 'Path width, level 3', min: 4, max: 26, step: 1, default: 10, unit: 'px', tip: 'Width of a trodden path (the game\'s wear 2).' },
  { key: 'width3', label: 'Path width, level 4', min: 6, max: 32, step: 1, default: 14, unit: 'px', tip: 'Width of a well-worn path (the game\'s wear 3).' },
  { key: 'levelBlend', label: 'Level transition', min: 0, max: 1, step: 0.01, default: 0.6, unit: '', tip: 'How gradually one wear level fades into the next (0 = at the tile edge, 1 = over about a tile).' },
  { key: 'edgeIrregularity', label: 'Edge irregularity', min: 0, max: 1, step: 0.01, default: 0.35, unit: '', tip: 'Ragged, grass-broken edges.' },
  { key: 'edgeSoftness', label: 'Edge softness', min: 0, max: 1, step: 0.01, default: 0.5, unit: '', tip: 'Width of the soft fade into the grass.' },
  { key: 'noiseScale', label: 'Noise scale', min: 0.2, max: 4, step: 0.05, default: 1.2, unit: 'tiles', tip: 'Size of the world-space noise features on the edges.' },
  { key: 'areaExpansion', label: 'Area expansion', min: 0, max: 1, step: 0.01, default: 0.4, unit: '', tip: 'How far a trodden area spreads beyond its tiles.' },
  { key: 'areaSmoothness', label: 'Area smoothness', min: 0, max: 1, step: 0.01, default: 0.6, unit: '', tip: 'Round, soft outline versus a more irregular one.' },
  { key: 'blendDistance', label: 'Path-to-area blend distance', min: 0, max: 3, step: 0.05, default: 1.2, unit: 'tiles', tip: 'Length over which a narrow path widens into an area (no circle stuck on a line).' },
]);
export const PARAM_KEYS = PARAMS.map(p => p.key);
export const defaultConfig = () => Object.fromEntries(PARAMS.map(p => [p.key, p.default]));
const v2 = values => ({ ...defaultConfig(), ...values });
// Current = the unchanged reference; the V2 presets are proposals for the owner to compare and pick (#116).
export const PRESETS = Object.freeze([
  { id: 'current', name: 'Current (N12)', renderer: 'current', note: 'The production renderer, unchanged: reference for every comparison.' },
  { id: 'natural-subtle', name: 'V2 Natural subtle', renderer: 'v2', note: 'Gentle bends, narrow paths.', config: v2({ meanderStrength: 0.25, meanderFrequency: 0.14, cornerRounding: 0.55, edgeIrregularity: 0.25, areaExpansion: 0.3, blendDistance: 1.2 }) },
  { id: 'organic', name: 'V2 Organic', renderer: 'v2', note: 'A little more meander, soft natural transitions.', config: v2({ meanderStrength: 0.45, meanderFrequency: 0.2, cornerRounding: 0.7, edgeIrregularity: 0.4, areaExpansion: 0.45, blendDistance: 1.6, width2: 11 }) },
  { id: 'wild', name: 'V2 Wild', renderer: 'v2', note: 'Experimental, clearly irregular.', config: v2({ meanderStrength: 0.8, meanderFrequency: 0.3, meanderSmoothness: 0.45, cornerRounding: 0.85, edgeIrregularity: 0.75, noiseScale: 0.8, areaExpansion: 0.7, areaSmoothness: 0.4, blendDistance: 2.2 }) },
  // The owner's pick (2026-11-07), also committed with its test map as art/path-lab/pesinav2.json.
  { id: 'pesinav2', name: 'V2 pesinav2 (owner)', renderer: 'v2', note: 'The owner\'s chosen settings (7 Nov 2026): strong meander, wide soft curves, smooth level transitions.', config: v2({ meanderStrength: 0.96, meanderFrequency: 0.2, meanderSmoothness: 0.7, cornerRounding: 0.77, minCurveRadius: 1.25, widthGrass: 6, width1: 7, width2: 12, width3: 16, levelBlend: 0.54, edgeIrregularity: 0.47, edgeSoftness: 0.61, noiseScale: 1.75, areaExpansion: 0.32, areaSmoothness: 0.92, blendDistance: 2.2 }) },
  { id: 'custom', name: 'Custom (V2)', renderer: 'v2', note: 'Your own V2 settings: save them as a variant or export JSON.' },
]);
// Which renderers exist in this build: 'v2' is the Experimental renderer of #116 (studio/src/path-lab/v2.js).
export const RENDERERS = { current: true, v2: true, v3: true };
export const clampParam = (key, value) => { const p = PARAMS.find(x => x.key === key); return p ? Math.min(p.max, Math.max(p.min, Number(value))) : value; };
