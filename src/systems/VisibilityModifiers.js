export function visibilityProfile(character){
  const base=character.definition.gameplay.baseSight;
  if(['onTower','onWall'].includes(character.state)&&character.currentTower){
    const tower=character.currentTower,d=tower.definition;
    const center=character.state==='onWall'?character.position:{x:tower.x+d.width/2,y:tower.y+d.height/2};
    const size=Math.round(base*(d.visibility?.multiplier??1));return {size,radius:size/2,center};
  }
  const size=Math.round(base*(character.mountedHorse?.definition.gameplay.visionMultiplier??1));return {size,radius:size/2,center:character.position};
}
// An ordinary subject sees a circle around the tile it stands on (diameter = baseSight, 15 = 75 % of the king's 20).
// Snapping to the tile keeps the circle unchanged while the subject walks within one tile.
export function subjectSight(worker){
  const size=worker.definition.gameplay.baseSight,center={x:Math.floor(worker.position.x)+.5,y:Math.floor(worker.position.y)+.5};
  return {id:worker.id,size,radius:size/2,center};
}
