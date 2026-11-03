// Capture only visual data, never production contents, worker lists or loot.
export function staticMemoryEntries(scene){
  const entries=[],fog=scene.fog;
  const add=(kind,key,type,object,visual)=>{
    const definition=scene.objectRegistry.require(type),entry={key:`${kind}:${key}`,kind,type,x:object.x??object.tile.x,y:object.y??object.tile.y,width:definition.width,height:definition.height};
    if(kind==='stockpile')entry.width=entry.height=1;
    if(fog.isInSightObject(entry))entry.visual=visual?.()??{};
    entries.push(entry);
  };
  for(const [key,view]of scene.resources){const object=view.getData('object');add('resource',key,object.type,object,()=>view.getMemoryState?.()??{});}
  for(const building of scene.buildings)add('building',building.id,building.type,building,()=>({
    ...(building.construction?{construction:{state:building.construction.state,progress:building.construction.progress,workDone:building.construction.workDone}}:{}),
    ...(building.connections?{connections:{...building.connections}}:{}),
    ...(building.definition.crop?{stage:scene.farmingSystem?.records.get(building.id)?.stage??0,season:scene.seasons.season}:{}),
  }));
  for(const chest of scene.treasureSystem?.chests.values()??[])add('chest',chest.id,chest.type,chest,()=>({opened:chest.opened,lid:chest.view.lid?{y:chest.view.lid.y,rotation:chest.view.lid.rotation}:null}));
  for(const drop of scene.dropSystem.drops.values())add('drop',drop.id,drop.resource,drop);
  for(const location of scene.foodStorage.locations.values())if(location.kind==='fallback'&&location.buildingId==null)add('stockpile',location.id,'starter_stockpile',location,()=>({id:location.id}));
  return entries;
}
