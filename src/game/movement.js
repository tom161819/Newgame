// Každá skutečně překročená buňka; společný diagonální roh navštíví jen
// diagonální cíl, nikoliv obě boční buňky. Funguje i pro dlouhé úseky.
export function enteredTiles(from,to){
  let x=Math.floor(from.x),y=Math.floor(from.y);const endX=Math.floor(to.x),endY=Math.floor(to.y),result=[];
  const dx=to.x-from.x,dy=to.y-from.y,sx=Math.sign(dx),sy=Math.sign(dy);
  let tx=sx?((sx>0?x+1:x)-from.x)/dx:Infinity,ty=sy?((sy>0?y+1:y)-from.y)/dy:Infinity;
  const stepX=sx?Math.abs(1/dx):Infinity,stepY=sy?Math.abs(1/dy):Infinity;
  while(x!==endX||y!==endY){
    if(x===endX){y+=sy;ty+=stepY;}
    else if(y===endY){x+=sx;tx+=stepX;}
    else if(Math.abs(tx-ty)<1e-9){x+=sx;y+=sy;tx+=stepX;ty+=stepY;}
    else if(tx<ty){x+=sx;tx+=stepX;}else{y+=sy;ty+=stepY;}
    result.push({x,y});
  }
  return result;
}

// Sdílený pohyb po logické cestě pro krále i ostatní jednotky. Čas se dělí
// na hranicích buněk, aby bonus povrchu platil jen v právě procházené buňce.
export function advanceMovement(actor, delta) {
  actor.walking = false;
  let remaining = Number.isFinite(delta)?Math.max(0,delta)/1000:0;
  const wear=actor.scene?.pathWear;
  while (remaining > 1e-12 && actor.speed>0) {
    if (!actor.nextTile&&actor.path.length&&actor.canEnterTile&&!actor.canEnterTile(actor.path[0]))break;
    if (!actor.nextTile) actor.nextTile = actor.path.shift();
    if (!actor.nextTile) break;
    const target = {x:actor.nextTile.x+0.5,y:actor.nextTile.y+0.5};
    const dx=target.x-actor.position.x,dy=target.y-actor.position.y,distance=Math.hypot(dx,dy);
    if(distance<1e-12){actor.position=target;actor.tile=actor.nextTile;actor.nextTile=null;continue;}
    actor.walking=true;actor.direction={x:dx/distance,y:dy/distance};
    const from={...actor.position},tile={x:Math.floor(from.x),y:Math.floor(from.y)};
    const speed=actor.speed*(wear?.speedMultiplier(actor,tile)??1),ux=dx/distance,uy=dy/distance;
    const boundary=(p,d)=>Math.abs(d)<1e-12?Infinity:Math.max(0,((d>0?Math.floor(p)+1:Math.floor(p))-p)/d);
    const limit=Math.min(distance,boundary(from.x,ux)+1e-10,boundary(from.y,uy)+1e-10);
    const amount=Math.min(limit,speed*remaining);
    actor.position={x:from.x+ux*amount,y:from.y+uy*amount};remaining=Math.max(0,remaining-amount/speed);
    if(distance-amount<1e-10){actor.position=target;actor.tile=actor.nextTile;actor.nextTile=null;}
    if(wear)for(const entered of enteredTiles(from,actor.position))wear.enter(actor,entered);
  }
}

export function movementReservations(actor) {
  const tiles=[actor.tile,actor.nextTile].filter(Boolean);
  if(actor.nextTile&&actor.nextTile.x!==actor.tile.x&&actor.nextTile.y!==actor.tile.y){
    tiles.push({x:actor.nextTile.x,y:actor.tile.y},{x:actor.tile.x,y:actor.nextTile.y});
  }
  return tiles;
}
