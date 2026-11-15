// E3 tips (plan m-e3-tipy): one bubble the first time something happens, never during the tutorial. Seen tips and the
// on/off switch are remembered in the browser, not in a save. `target`: where the arrow points (selector or 'cat'/'dog').
// Owner 15 Nov 2026: the tips, their order and texts come from the guide data (src/data/guide.js, Asset Studio Guide
// page). kind 'sequence' = one after another after the start guide; 'event' = when its situation happens.
import { GUIDE } from './guide.js';
export const TIPS=GUIDE.tips;
export const TIP_GAP_SECONDS=GUIDE.tipGap;
// m-tipy-mimo-listu (report 0.83.0 point 2): a tip nobody reacts to folds into the Notices bar after this many game days.
export const TIP_PARK_DAYS=1;
