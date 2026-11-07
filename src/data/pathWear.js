// Všechny prahy a bonusy pěšin se mění zde, nezávisle na grafice.
export const PATH_WEAR=Object.freeze({
  // #116: level 1 is trampled grass (a dark green track, no soil, no speed bonus), reached at about half the traffic of
  // the first soil path; levels 2–4 are the former soil levels 1–3 with their thresholds and bonuses.
  thresholds:Object.freeze([0,3,5,15,30]),speedMultipliers:Object.freeze([1,1,1.05,1.1,1.15]),
  recoveryDelayDays:3,recoveryPerDay:5,
  terrainIds:Object.freeze(['grass_normal','grass_trodden','grass_trampled_1','grass_trampled_2','grass_trampled_3']),
});
export function wearLevel(score){let level=0;for(let i=1;i<PATH_WEAR.thresholds.length;i++)if(score>=PATH_WEAR.thresholds[i])level=i;return level;}
