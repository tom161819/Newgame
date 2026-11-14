// m-plynuly-prechod-dohledu (owner 14 Nov 2026): a finished building at the edge of the sight range no longer switches
// hard between lit and remembered (dark). (1) In space: within `reach` tiles of the sight range a building is lit in
// part (3/4, 1/2, 1/4), so a row of walls runs out softly. (2) In time: the change takes `ms` instead of one frame.
// 1 = fully lit, 0 = fully remembered. The lit building is drawn below and its dark copy over it with the rest.
export const SIGHT_FADE=Object.freeze({reach:3,ms:400});
const cache=new WeakMap();
export function edgeLight(fog,building,definition){
  const had=cache.get(building);if(had&&had.revision===fog.revision)return had.value;
  const R=SIGHT_FADE.reach,w=definition.width??1,h=definition.height??1;let best=Infinity;
  for(let y=-R;y<h+R&&best>1;y++)for(let x=-R;x<w+R&&best>1;x++){
    const d=Math.max(x<0?-x:x>=w?x-w+1:0,y<0?-y:y>=h?y-h+1:0);if(d===0||d>=best)continue;
    if(fog.isInSightTile({x:building.x+x,y:building.y+y}))best=d;
  }
  const value=best===Infinity?0:1-best/(R+1);cache.set(building,{revision:fog.revision,value});return value;
}
// One step of the fade towards `target` (0–1) after `delta` ms.
export const fadeStep=(now,target,delta)=>{const step=Math.max(0,delta)/SIGHT_FADE.ms;return Math.abs(target-now)<=step?target:now+Math.sign(target-now)*step;};
