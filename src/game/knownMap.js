// The map as the player knows it: seen or remembered tiles keep their real value, never-seen tiles count as open ground.
// Routes into the unknown are planned on this, so a click never reveals what lies hidden there.
export function knownMap(scene){
  const map=scene.map,fog=scene.fog;
  if(!fog?.enabled)return map;
  return map.map((row,y)=>row.map((value,x)=>fog.isInSightTile({x,y})||fog.explored[y*fog.width+x]?value:0));
}
