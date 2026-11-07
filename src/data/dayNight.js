import { SEASONS,SEASON_DAYS } from './seasons.js';

// Day and night N1 (brief zadani-den-noc.md, approved 7 Nov). Parts of a day as fractions of the day: dawn 0–5 %, day,
// dusk (10 % of the day before night), night from 82 % (summer), 75 % (spring, autumn) or 62 % (winter) to the end of
// the day. Rest (sleep) starts with the night. The night start moves smoothly through the year (linear between the
// middles of the seasons), so there is no jump at a season boundary.
export const DAY_NIGHT=Object.freeze({
  dawnEnd:.05,duskLength:.10,
  nightStart:Object.freeze({Spring:.75,Summer:.82,Autumn:.75,Winter:.62}),
  // Soldiers keep the night watch and rest in the first third of the day instead.
  soldierRest:Object.freeze({from:0,to:1/3}),
  // Without light everybody (soldiers too) sees a third of the normal sight at night.
  nightSight:1/3,
  // Light radius in pixels → tiles (an isometric tile is 64×32, a light's radius is measured on screen).
  pxPerTile:32,litTypes:Object.freeze(['torch','brazier','campfire']),
  // Look: bluish ambient darkness at night; a full moon lightens it a little. The moon goes round in 8 days.
  ambient:Object.freeze({color:0x0b1433,night:.66,dusk:.25,fullMoon:.12}),moonDays:8,
  // House windows glow from dusk until the family goes to bed (each house within 8 % of a day after night starts).
  houseWindows:Object.freeze({bedtimeSpread:.08,color:0xffcf7a,radius:30}),
  // Speed up nights: off (1), ×2 or ×3 (default); Skip to dawn runs ×8 until dawn.
  nightSpeeds:Object.freeze([1,2,3]),defaultNightSpeed:3,skipSpeed:8,
});

// Night start (fraction of the day) for a day of the year (1-based, may be fractional); seasons off = summer.
export function nightStartFor(dayOfYear,seasonsEnabled=true){
  const table=DAY_NIGHT.nightStart;if(!seasonsEnabled)return table.Summer;
  const year=SEASON_DAYS*SEASONS.length,mids=SEASONS.map((s,i)=>({at:i*SEASON_DAYS+SEASON_DAYS/2,value:table[s]}));
  const d=((dayOfYear-1)%year+year)%year;
  for(let i=0;i<mids.length;i++){const a=mids[i],b=mids[(i+1)%mids.length],to=b.at+(b.at<a.at?year:0),at=d<a.at&&i===mids.length-1?d+year:d;
    if(at>=a.at&&at<=to)return a.value+(b.value-a.value)*(at-a.at)/(to-a.at);}
  // Before the first middle: between Winter (last) and Spring.
  const a=mids[mids.length-1],b=mids[0],at=d+year;return a.value+(b.value-a.value)*(at-a.at)/(b.at+year-a.at);
}
export function dayPart(fraction,nightStart){
  if(fraction>=nightStart)return 'night';if(fraction>=nightStart-DAY_NIGHT.duskLength)return 'dusk';if(fraction<DAY_NIGHT.dawnEnd)return 'dawn';return 'day';
}
// 0 by day … 1 at night; dusk darkens and dawn brightens linearly.
export function darknessAt(fraction,nightStart){
  const part=dayPart(fraction,nightStart);
  if(part==='night')return 1;if(part==='dusk')return (fraction-(nightStart-DAY_NIGHT.duskLength))/DAY_NIGHT.duskLength;if(part==='dawn')return 1-fraction/DAY_NIGHT.dawnEnd;return 0;
}
// Moon: 0 new … 1 full, a cosine over 8 days (day 1 = new moon).
export const moonLight=day=>(1-Math.cos(2*Math.PI*(((day-1)%DAY_NIGHT.moonDays)/DAY_NIGHT.moonDays)))/2;
