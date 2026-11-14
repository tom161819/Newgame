// m-plynuly-prechod-dohledu (owner 14 Nov 2026): a finished building at the edge of the sight range no longer switches
// hard between lit and remembered (dark).
// (1) In space: the change is spread over `reach` tiles on BOTH sides of the border. A building just inside the range
//     is already a little dark, one just outside still a little lit; from piece to piece of a wall the step is about
//     1/8, so a row of walls runs out like the soft edge on the ground. (The first version lit only the 3 tiles
//     outside in quarters; the owner still saw a hard edge.)
// (2) In time: every change takes `ms` instead of one frame.
// 1 = fully lit, 0 = fully remembered. The lit building is drawn below and its dark copy over it with the rest.
export const SIGHT_FADE=Object.freeze({reach:4.5,ms:400});
const cache=new WeakMap();
export function edgeLight(fog,building,definition){
  const had=cache.get(building);if(had&&had.revision===fog.revision)return had.value;
  const R=SIGHT_FADE.reach,span=Math.ceil(R),cx=Math.floor(building.x+(definition.width??1)/2-1e-6),cy=Math.floor(building.y+(definition.height??1)/2-1e-6),seen=fog.isInSightTile({x:cx,y:cy});
  let best=Infinity;
  for(let y=-span;y<=span;y++)for(let x=-span;x<=span;x++){const d=Math.hypot(x,y);if(!d||d>=best||d>R)continue;if(fog.isInSightTile({x:cx+x,y:cy+y})!==seen)best=d;}
  // The border lies half a tile before the nearest tile of the other kind.
  const value=best===Infinity?(seen?1:0):Math.max(0,Math.min(1,.5+(seen?1:-1)*(best-.5)/(2*R-1)*1));
  cache.set(building,{revision:fog.revision,value});return value;
}
// One step of the fade towards `target` (0–1) after `delta` ms.
export const fadeStep=(now,target,delta)=>{const step=Math.max(0,delta)/SIGHT_FADE.ms;return Math.abs(target-now)<=step?target:now+Math.sign(target-now)*step;};
