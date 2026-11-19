// World v2 step 1: deterministic random streams. Each part of the start-of-game world draws from its own stream,
// derived from the world seed and the part's name, so adding a new part never shifts the others.
// cyrb53-style string hash → four 32-bit words for sfc32 (small, fast, good enough for map generation).
function hash32(text,seed){let h=seed>>>0;for(let i=0;i<text.length;i++){h=Math.imul(h^text.charCodeAt(i),2654435761);h=(h<<13|h>>>19)>>>0;}return Math.imul(h^h>>>16,2246822507)>>>0;}
export function sfc32(a,b,c,d){
  return function(){a>>>=0;b>>>=0;c>>>=0;d>>>=0;let t=(a+b|0)+d|0;d=d+1|0;a=b^b>>>9;b=c+(c<<3)|0;c=c<<21|c>>>11;c=c+t|0;return (t>>>0)/4294967296;};
}
// A stream for one part of the world: same (seed, part) → same sequence.
export function worldRandom(seed,part){
  const key=`${seed}:${part}`,random=sfc32(hash32(key,1),hash32(key,2),hash32(key,3),hash32(key,4));
  for(let i=0;i<12;i++)random();// mix the start state
  return random;
}
// A factory of named streams for one world: streams('river'), streams('trees')…
export function worldStreams(seed){const cache=new Map(),streams=part=>{if(!cache.has(part))cache.set(part,worldRandom(seed,part));return cache.get(part);};streams.seed=seed;return streams;}
