// E3 tutorial (plan m-e3-tutorial-sipka, report 0.48.0): one step at a time with a bubble and an arrow. A step is done by
// the state of the world, never by a click, so any way of doing it counts and a loaded game resumes at the right step.
// `planned` = a building of the type exists (blueprint, site or finished); `built` = one is finished; `job` = a resident
// has the profession. m-tutorial-v2 (0.50 playtest, points 1–9): a Hauler right after the Builder, the Hunting Lodge is
// the first food, then four optional food-chain steps (info + arrow, "Next" or building it moves on), the Miner after
// marking a rock. Optional steps are also done once the world has passed them (a later mandatory step is done), so a
// loaded game never falls back to them. The mandatory path is paid by the New Game start (NEW_GAME_DEFAULTS, test).
// Owner 15 Nov 2026 ("zruš tutoriál"): the step-by-step tutorial is replaced by a short start guide – an arrow at the
// Wiki, then one at the Getting started panel – whose steps and texts come from src/data/guide.js (Asset Studio, Guide).
// The step machinery above stays: 'wiki' ends when the Wiki opens, 'ack' with the "Got it" button.
import { GUIDE } from './guide.js';
export const TUTORIAL_STEPS=Object.freeze(GUIDE.intro.map(step=>Object.freeze({id:step.id,check:step.check,target:step.target})));
// The buildings the mandatory steps ask for: the New Game start must pay all of them (tests/tutorial.test.js).
// Owner 15 Nov 2026: the buildings of the Getting started tasks.
export const TUTORIAL_PATH_BUILDINGS=Object.freeze(GUIDE.tasks.filter(task=>task.kind==='build').map(task=>task.building));
// The king step ends by itself after this many real milliseconds (or "Next").
export const TUTORIAL_KING_MS=6000;
