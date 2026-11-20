// m-budovy-klik-mimo-dohled (owner, 12 Nov) and owner 19 Nov 2026 (80): the King always knows his own buildings, so an
// own building or blueprint opens in any fog (its window stays open too); an enemy one still needs explored ground.
export function buildingReachable(fog,building){
  if(!fog?.enabled||fog.isVisibleObject(building))return true;if(building.unverified||!building.enemy)return true;
  const w=fog.width;return !!fog.explored&&(building.tiles??[]).some(t=>fog.explored[t.y*w+t.x]);
}
