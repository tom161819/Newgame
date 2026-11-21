import { t } from '../i18n/index.js';
import { foodDays } from '../data/foodOutlook.js';
import { kingdomRank,KINGDOM_RANKS } from '../data/kingdomRank.js';

// m-uroven-kralovstvi: the live numbers the rank conditions read – the residents' average Happiness (as in the
// Kingdom overview) and how many days the food lasts.
export function kingdomRankStats(scene){
  const residents=scene.workerSystem?.liveSubjects?.()??[],homes=scene.needs?.homes?.()??new Map();
  const values=residents.map(w=>scene.needs?.status?.(w,homes)?.happiness).filter(v=>Number.isFinite(v));
  return {population:residents.length,happiness:values.length?Math.round(values.reduce((n,v)=>n+v,0)/values.length):null,foodDays:scene.foodSystem?foodDays(scene.foodSystem):0};
}
export const sceneKingdomRank=scene=>kingdomRank(scene.buildings,kingdomRankStats(scene));
export const rankName=rank=>t(`kingdom.rank.${rank}`);
// One line per condition: "✓ Granary" / "✗ Happiness 54 / 70 %".
export function rankRequirementLine(item){
  const mark=item.ok?'✓':'✗',params={current:item.current??'—',target:item.target,name:item.building?t(`object.${item.building}.name`):''};
  return `${mark} ${t(`kingdom.req.${item.kind}`,params)}`;
}
export function rankBlockedText(rank){return t('castle.rankBlocked',{rank:rankName(KINGDOM_RANKS[rank.next]),missing:rank.items.filter(i=>!i.ok).map(rankRequirementLine).join(' · ')});}
