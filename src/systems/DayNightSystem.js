import { DAY_NIGHT,nightStartFor,dayPart,darknessAt,moonLight } from '../data/dayNight.js';
import { worldToGrid } from '../game/isometric.js';
import { buildingDefinition,buildingIsComplete,towerBase } from '../game/buildings.js';
import { hashOf } from '../data/children.js';
import { SEASON_DAYS,SEASONS } from '../data/seasons.js';

// Day and night N1: the part of the day, darkness for the light map, the moon, sleep from the start of the night,
// night sight (a third outside light) and the night speed-up. Everything follows from the game time and the calendar,
// so nothing is saved (the moon follows the day).
export class DayNightSystem {
  constructor(scene){
    this.scene=scene;this.skipping=false;
    // Daily rest (sleep) starts with the night (DailyRest reads this through the game time).
    if(scene.gameTime)scene.gameTime.restStartFraction=()=>this.nightStart();
  }
  get time(){return this.scene.gameTime;}
  fraction(){const g=this.time;return g?g.elapsed/g.dayDuration:0;}
  dayOfYear(){const g=this.time;if(!g)return 1;return ((g.day-1)%(SEASON_DAYS*SEASONS.length))+1+this.fraction();}
  nightStart(){return nightStartFor(this.dayOfYear(),this.scene.seasons?.enabled!==false);}
  part(){return dayPart(this.fraction(),this.nightStart());}
  isNight(){return this.part()==='night';}
  darkness(){return darknessAt(this.fraction(),this.nightStart());}
  moon(){return moonLight(this.time?.day??1);}
  // Ambient darkness of the light map (0 by day … night alpha, a full moon a little lighter).
  ambientAlpha(){const d=this.darkness();return d*(DAY_NIGHT.ambient.night-DAY_NIGHT.ambient.fullMoon*this.moon());}
  // Lights that let people see at night (torches, braziers, campfires), in tile coordinates.
  lights(){
    const out=[];for(const l of this.scene.lightSources?.lights?.()??[]){if(!DAY_NIGHT.litTypes.includes(l.type))continue;const p=worldToGrid(l.x,l.y);out.push({x:p.x,y:p.y,radius:l.radius/DAY_NIGHT.pxPerTile});}
    for(const extra of this.extraLights?.()??[])out.push(extra);
    return out;
  }
  inLight(point,lights=this.lights()){return lights.some(l=>Math.hypot(l.x-point.x,l.y-point.y)<=l.radius);}
  // Sight multiplier at a point: 1 by day or in light, 1/3 at night outside light, in between at dusk and dawn
  // (in sixths, so the fog is repainted only a few times while it darkens).
  sightFactor(point,lights){
    const d=this.darkness();if(d<=0)return 1;if(this.inLight(point,lights))return 1;
    const f=1-(1-DAY_NIGHT.nightSight)*d;return Math.max(DAY_NIGHT.nightSight,Math.round(f*6)/6);
  }
  // Night speed-up: steps of simulation per frame. Skip to dawn runs faster and stops by itself at dawn; anything
  // that needs attention (a fight) stops both.
  speed(nightSpeed=DAY_NIGHT.defaultNightSpeed){
    if(!this.isNight()){this.skipping=false;return 1;}
    if(this.attention?.()){this.skipping=false;return 1;}
    return this.skipping?DAY_NIGHT.skipSpeed:Math.max(1,nightSpeed);
  }
  // House windows (world px): lit from dusk while the family is still up; each lived-in house goes to bed a little
  // after night starts (spread by its id). Empty houses stay dark.
  houseWindows(){
    const part=this.part();if(part==='day'||part==='dawn')return [];
    const s=this.scene,homes=s.needs?.homes?.()??new Map(),occupied=new Set([...homes.values()].filter(h=>h?.kind==='house').map(h=>h.buildingId));
    const f=this.fraction(),start=this.nightStart(),w=DAY_NIGHT.houseWindows,out=[];
    for(const b of s.buildings??[]){
      if(!occupied.has(b.id)||!buildingIsComplete(b)||!s.objectRegistry?.get?.(b.type)?.housing)continue;
      if(f>=start+w.bedtimeSpread*((hashOf('bed',b.id)%1000)/1000))continue;
      const base=towerBase(b),d=buildingDefinition(b);out.push({buildingId:b.id,x:base.x,y:base.y-(d.visualHeight??80)*.35,radius:w.radius,type:'window'});
    }
    return out;
  }
  skipToDawn(){if(this.isNight())this.skipping=true;return this.skipping;}
}
