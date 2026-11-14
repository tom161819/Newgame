// Children and the Village Green D1 (brief zadani-deti-naves.md). Children only liven the village up: they are not
// residents, need nothing, eat nothing and never work. Distances are in tiles, times in seconds of game time unless
// the name says days.
export const CHILDREN=Object.freeze({
  familyMin:2,
  // Residents of a family house -> how many children it may have [min, max]; chosen from the house id and resident count.
  counts:Object.freeze({2:[0,1],3:[1,2],4:[1,2],5:[1,3]}),
  max:40,
  homeRadius:6,greenReach:15,
  speed:1.7,runSpeed:2.6,
  activitySeconds:Object.freeze([7,16]),
  greenChance:.55,
  // Winter: only about half the children go out; summer: some play by the water when it is close.
  winterOutside:.5,waterRange:12,shoreChance:.35,
  danger:Object.freeze({radius:10,hideDays:.25,checkMs:500}),
  snowman:Object.freeze({chance:.3,max:6}),
  // A child comes out a little after the morning (stagger), not all at once.
  emergeSeconds:Object.freeze([0,8]),
  syncMs:1000,
  // m-obyvatele-jmena-spanek-pohyb (31): first names live in src/data/names.*.js (children), surname from the family.
  ages:Object.freeze([5,12]),
  activities:Object.freeze({
    house:Object.freeze(['tag','hoop','ball']),green:Object.freeze(['tag','hoop','ball','swing']),
    shore:Object.freeze(['shore']),snow:Object.freeze(['snowball','snowman']),
  }),
});

// Children and the Village Green D2: small 1×1 decorations by the houses. A Swing Tree gives houses within 4 tiles +1
// and children swing on it; a Well gives houses within 6 tiles +1 (later maybe water for the Bakery or fire fighting:
// `well` is kept as its own block so a function can be added); a Haystack stands only within 6 tiles of a farm
// (Farmhouse or Wheat Field) and children jump into it, no happiness. More of one kind never adds more. All
// "around the house" bonuses together (green, family, swing, well) are capped at +8.
export const HOUSE_DECORATIONS=Object.freeze({
  swing_tree:Object.freeze({range:4,happiness:1,play:'swing'}),
  well:Object.freeze({range:6,happiness:1}),
  // Owner 14 Nov 2026: a Fountain (2×2) gives houses within 8 tiles +2 and water for fighting fires like a Well.
  fountain:Object.freeze({range:8,happiness:2}),
  haystack:Object.freeze({farmRange:6,farms:Object.freeze(['farmhouse','wheat_field']),play:'hay'}),
  // Children of a house within this many tiles may go to play at a swing tree or a haystack.
  playReach:8,playChance:.35,
  // Decorations are not built on a worn path (level 2 and up) or on paving.
  pathLevel:2,
});
export const SURROUNDINGS_CAP=8;

export const VILLAGE_GREEN=Object.freeze({
  range:10,happiness:4,familyBonus:2,
  // Evening: in the first part of rest time a few residents living in range sit on the green, then go home.
  eveningSeats:4,eveningFraction:.45,
});

// A small deterministic hash (FNV-1a) so the same house gives the same children.
export function hashOf(...parts){let h=2166136261;for(const c of parts.join('|')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function seeded(seed){let s=seed>>>0||1;return()=>{s=Math.imul(s^(s>>>15),2246822507)>>>0;s=Math.imul(s^(s>>>13),3266489909)>>>0;s^=s>>>16;return (s>>>0)/4294967296;};}
export function childCount(houseId,residents){
  if(residents<CHILDREN.familyMin)return 0;const [lo,hi]=CHILDREN.counts[Math.min(5,residents)]??CHILDREN.counts[5];
  return lo+Math.floor(seeded(hashOf('children',houseId,residents))()*(hi-lo+1));
}
// Spread the cap evenly: every family first gets its first child, then the second, and so on.
export function allocateChildren(families,max=CHILDREN.max){
  const out=new Map(families.map(f=>[f.houseId,0]));let total=0;
  for(let round=0;total<max;round++){let any=false;for(const f of families){if(f.count>round&&total<max){out.set(f.houseId,round+1);total++;any=true;}}if(!any)break;}
  return out;
}
