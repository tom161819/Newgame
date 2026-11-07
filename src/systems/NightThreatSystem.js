import { NIGHT_THREATS } from '../data/nightThreats.js';
import { buildingDefinition,buildingIsComplete,buildingTiles,placementError,campfireWood } from '../game/buildings.js';
import { removeBuildingShell } from '../game/buildingRemoval.js';

// Day and night N3: the switches of the night threats (wolves, thieves, fires; from the New Game setup, changeable in
// Settings) and the campfire. A campfire is built from local wood (a tree or a bush within 6 tiles) and costs nothing
// from the stores; it burns one night (at once if it is finished at night), then lies as ashes for a day and goes.
export const hasLocalWood=(scene,tile,range=NIGHT_THREATS.campfire.woodRange)=>campfireWood(scene,tile,range);
export class NightThreatSystem {
  constructor(scene,settings=scene.gameSettings){
    this.scene=scene;this.enabled={wolves:settings?.nightWolves!==false,thieves:settings?.nightThieves!==false,fires:settings?.nightFires!==false};
    this.campfires=new Map();this.listeners=new Set();
  }
  onChange(l){this.listeners.add(l);return()=>this.listeners.delete(l);}
  changed(){for(const l of this.listeners)l();}
  setEnabled(id,value){if(!NIGHT_THREATS.ids.includes(id))return;this.enabled[id]=!!value;this.changed();}
  get dayNight(){return this.scene.dayNight;}
  dark(){const p=this.dayNight?.part();return p==='dusk'||p==='night';}
  // --- campfires --------------------------------------------------------------------------------------------------
  campfireState(b){return this.campfires.get(b.id)??null;}
  campfireBurning(b){const c=this.campfireState(b);return !!c&&c.litDay!=null&&c.ashesDay==null;}
  campfireAshes(b){return this.campfireState(b)?.ashesDay!=null;}
  updateCampfires(){
    const day=this.scene.gameTime?.day??1,part=this.dayNight?.part();
    for(const b of [...(this.scene.buildings??[])]){
      if(!buildingDefinition(b).campfire||!buildingIsComplete(b))continue;
      let c=this.campfires.get(b.id);if(!c){c={litDay:null,ashesDay:null};this.campfires.set(b.id,c);}
      if(c.litDay==null&&this.dark()){c.litDay=day;this.changed();}
      else if(c.litDay!=null&&c.ashesDay==null&&part==='day'){c.ashesDay=day;this.changed();}
      else if(c.ashesDay!=null&&day>c.ashesDay+NIGHT_THREATS.campfire.ashesDays-1&&part==='day'&&day>c.ashesDay){this.campfires.delete(b.id);removeBuildingShell(this.scene,b);this.scene.events?.emit?.('buildings:changed');this.changed();}
    }
    for(const id of this.campfires.keys())if(!this.scene.buildings.some(b=>b.id===id))this.campfires.delete(id);
  }
  // A soldier (or the King) makes a campfire on a free tile next to him with local wood; it is finished at once.
  makeCampfire(actor){
    const s=this.scene,d=s.objectRegistry.require('campfire'),origin=actor.tile;
    for(let r=1;r<=2;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      const anchor={x:origin.x+dx,y:origin.y+dy};if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
      if(placementError(s.map,anchor,{has:k=>s.resourceOccupancy.has(k),naturalContext:{mining:{placementError:()=>null,accessError:()=>null,canBuildOver:()=>false},scene:s}},s.reservedTiles(),d,s.buildings))continue;
      const building={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:d.id,definition:d,...anchor,tiles:buildingTiles(anchor,d)};
      for(const t of building.tiles)s.map[t.y][t.x]=1;s.buildings.push(building);s.towerViews?.set(building.id,s.createBuildingView(d,building));s.events?.emit?.('buildings:changed');
      this.updateCampfires();return building;
    }
    return null;
  }
  update(){this.updateCampfires();}
  exportState(){return {enabled:{...this.enabled},campfires:[...this.campfires].map(([id,c])=>({id,litDay:c.litDay,ashesDay:c.ashesDay})).sort((a,b)=>a.id-b.id)};}
  importState(data){if(!data)return;this.enabled={...this.enabled,...data.enabled};this.campfires=new Map((data.campfires??[]).map(c=>[c.id,{litDay:c.litDay,ashesDay:c.ashesDay}]));}
  destroy(){this.listeners.clear();}
}
export function validNightThreatState(data,buildingIds){
  const n=v=>v===null||Number.isSafeInteger(v)&&v>=1;
  return !!data&&typeof data==='object'&&!!data.enabled&&NIGHT_THREATS.ids.every(id=>typeof data.enabled[id]==='boolean')&&Object.keys(data.enabled).length===NIGHT_THREATS.ids.length
    &&Array.isArray(data.campfires)&&data.campfires.every(c=>c&&buildingIds.has(c.id)&&n(c.litDay)&&n(c.ashesDay));
}
