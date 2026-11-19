// Owner 15 Nov 2026 (koncept v1, plan m-mapa-kraje): scouting the zones around the home map. Eight zones around the
// map; what each holds follows from the world code, so the same world always has the same zones. A party of soldiers
// leaves over the map edge, travels, reports what it found and comes back. Later steps: playing in a zone (40 × 40),
// mining, caves, ruins, bandit camps, other castles.
export const SCOUTING=Object.freeze({
  castleLevel:3,building:'barracks',
  travelDays:.5,leaveHours:3,edgeReach:2,
  // Owner 19 Nov 2026 (81): the party meets at the Barracks first (within gatherReach tiles), at most gatherHours.
  gatherHours:3,gatherReach:3,
  // Named by where they lie on screen (the grid's north-west corner is the top of the screen).
  zones:Object.freeze([
    {id:'n',dx:-1,dy:-1},{id:'ne',dx:0,dy:-1},{id:'e',dx:1,dy:-1},{id:'se',dx:1,dy:0},
    {id:'s',dx:1,dy:1},{id:'sw',dx:0,dy:1},{id:'w',dx:-1,dy:1},{id:'nw',dx:-1,dy:0},
  ].map(z=>Object.freeze(z))),
  types:Object.freeze([
    {id:'forest',icon:'🌲',weight:3},
    {id:'iron',icon:'⛏',weight:2},
    {id:'stone',icon:'🪨',weight:2},
    // Owner 16 Nov 2026: a bandit camp (bandits guard their loot), crumbling ruins with a treasure, an abandoned mine
    // (its entrance leads into a dungeon).
    {id:'bandits',icon:'🏕',weight:2},
    {id:'ruins',icon:'🏚',weight:2},
    {id:'mine',icon:'🕳',weight:2},
  ].map(z=>Object.freeze(z))),
});
const hash=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
// What a zone holds, from the world code (deterministic).
export function zoneType(worldCode,zoneId){
  const total=SCOUTING.types.reduce((n,t)=>n+t.weight,0);let roll=hash(`${worldCode??''}|zone|${zoneId}`)%total;
  for(const type of SCOUTING.types){if(roll<type.weight)return type.id;roll-=type.weight;}return SCOUTING.types[0].id;
}
export const zoneById=id=>SCOUTING.zones.find(z=>z.id===id)??null;
// Owner 19 Nov 2026 (83): the maps next to a zone (the next one each way round the home map: one side step in the 3 × 3 grid).
export const zoneNeighbours=id=>{const z=zoneById(id);return z?SCOUTING.zones.filter(o=>o.id!==z.id&&Math.abs(o.dx-z.dx)+Math.abs(o.dy-z.dy)===1).map(o=>o.id):[];};
export const scoutTypeById=id=>SCOUTING.types.find(t=>t.id===id)??null;
// The map-edge point a party leaves from towards a zone (grid tiles; the screen's top is the grid's north-west corner).
export function zoneEdge(zone,width,height){
  const at=(d,size)=>d<0?0:d>0?size-1:Math.floor(size/2);return {x:at(zone.dx,width),y:at(zone.dy,height)};
}
