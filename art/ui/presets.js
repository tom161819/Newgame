// The four starting styles of the UI Lab. Each is a whole config (look and layout); the owner tunes from there.
import olive from './presets/olive.json' with { type: 'json' };
import woodIron from './presets/wood-iron.json' with { type: 'json' };
import parchment from './presets/parchment.json' with { type: 'json' };
import stoneCastle from './presets/stone-castle.json' with { type: 'json' };

export const UI_PRESETS = Object.freeze([olive, woodIron, parchment, stoneCastle]);
