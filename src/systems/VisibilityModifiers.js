export function visibilityProfile(character){
  const base=character.definition.gameplay.baseSight;
  if(character.state==='onTower'&&character.currentTower){
    const tower=character.currentTower,d=tower.definition;
    return {size:Math.round(base*(d.visibility?.multiplier??1)),center:{x:tower.x+d.width/2,y:tower.y+d.height/2}};
  }
  return {size:Math.round(base*(character.mountedHorse?.definition.gameplay.visionMultiplier??1)),center:character.position};
}
