// Sdílený pohyb po logické cestě pro krále i ostatní jednotky.
export function advanceMovement(actor, delta) {
  actor.walking = false;
  let remaining = actor.speed * Math.max(0, delta) / 1000;
  while (remaining > 0) {
    if (!actor.nextTile) actor.nextTile = actor.path.shift();
    if (!actor.nextTile) break;
    const target = {x:actor.nextTile.x+0.5,y:actor.nextTile.y+0.5};
    const dx=target.x-actor.position.x,dy=target.y-actor.position.y,distance=Math.hypot(dx,dy);
    if(distance>0){actor.walking=true;actor.direction={x:dx/distance,y:dy/distance};}
    if(distance<=remaining){
      actor.position=target;remaining-=distance;actor.tile=actor.nextTile;actor.nextTile=null;
    }else{
      actor.position.x+=dx/distance*remaining;actor.position.y+=dy/distance*remaining;break;
    }
  }
}

export function movementReservations(actor) {
  const tiles=[actor.tile,actor.nextTile].filter(Boolean);
  if(actor.nextTile&&actor.nextTile.x!==actor.tile.x&&actor.nextTile.y!==actor.tile.y){
    tiles.push({x:actor.nextTile.x,y:actor.tile.y},{x:actor.tile.x,y:actor.nextTile.y});
  }
  return tiles;
}
