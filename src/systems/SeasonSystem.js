import { t } from '../i18n/index.js';
import { calendar,SEASON_GROWTH,WEATHER_GROWTH,WEATHER_PROBABILITIES } from '../data/seasons.js';
export class SeasonSystem {
  constructor(time,{random=Math.random,enabled=true,initialWeather}={}){
    if(typeof enabled!=='boolean')throw new Error('Invalid Seasons setting.');
    Object.assign(this,{time,random,enabled});this.lastProcessedDay=time.day;
    this.cycleDay=time.day;this.cycleElapsed=time.elapsed;this.cycleCompensation=0;
    this.beforeListeners=new Set();this.listeners=new Set();this.weather=initialWeather??this.rollWeather();
    this.unsubscribe=time.onNewDay(day=>this.processDay(day));
    this.unsubscribeAdvance=time.onAfterAdvance(delta=>this.advance(delta));
    this.unsubscribeBoundary=time.addBoundary(()=>this.enabled?this.time.dayDuration-this.cycleElapsed:Infinity);
  }
  get calendar(){return calendar(this.cycleDay);}
  get season(){return this.enabled?this.calendar.season:'Summer';}
  get label(){const c=this.calendar,weather=t(`weather.${this.weather}`);return this.enabled?t('hud.season',{season:t(`season.${c.season}`),day:c.dayInSeason,year:c.year,weather}):t('hud.seasonsOff',{weather});}
  rollWeather(){let value=this.random();for(const [weather,probability]of Object.entries(WEATHER_PROBABILITIES[this.season])){value-=probability;if(value<0)return weather;}return'Frost';}
  growthMultiplier(){return Math.max(0,SEASON_GROWTH[this.season]*WEATHER_GROWTH[this.weather]);}
  canHarvest(type){return type!=='orchard'||['Summer','Autumn'].includes(this.season);}
  onBeforeChange(listener){this.beforeListeners.add(listener);return()=>this.beforeListeners.delete(listener);}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  beforeChange(){for(const listener of this.beforeListeners)listener();}
  changed(){for(const listener of this.listeners)listener();}
  setEnabled(value){
    if(typeof value!=='boolean')throw new Error('Invalid Seasons setting.');if(this.enabled===value)return false;
    this.beforeChange();this.enabled=value;this.changed();return true;
  }
  advance(delta){
    let day=this.cycleDay,elapsed=this.cycleElapsed,compensation=this.cycleCompensation;
    if(this.enabled){const corrected=delta-compensation,total=elapsed+corrected;compensation=(total-elapsed)-corrected;elapsed=total;if(elapsed>=this.time.dayDuration-1e-7){elapsed=0;compensation=0;day++;}}
    const newWeather=this.time.day>this.lastProcessedDay,changed=day!==this.cycleDay||newWeather;
    if(changed)this.beforeChange();
    this.cycleDay=day;this.cycleElapsed=elapsed;this.cycleCompensation=compensation;
    if(newWeather){this.lastProcessedDay=this.time.day;this.weather=this.rollWeather();}
    if(changed)this.changed();
  }
  processDay(day){if(day<=this.lastProcessedDay)return;this.beforeChange();this.lastProcessedDay=day;this.weather=this.rollWeather();this.changed();}
  exportState(){return {lastProcessedDay:this.lastProcessedDay,...this.calendar,season:this.season,rememberedSeason:this.calendar.season,weather:this.weather,enabled:this.enabled,cycleDay:this.cycleDay,cycleElapsed:this.cycleElapsed,cycleCompensation:this.cycleCompensation};}
  importState(data){
    this.lastProcessedDay=data?.lastProcessedDay??this.time.day;this.enabled=data?.enabled??this.enabled;
    this.cycleDay=data?.cycleDay??this.lastProcessedDay;this.cycleElapsed=data?.cycleElapsed??this.time.elapsed;this.cycleCompensation=data?.cycleCompensation??0;
    this.weather=data?.weather??'Sunny';this.changed();
  }
  destroy(){this.unsubscribe();this.unsubscribeAdvance();this.unsubscribeBoundary();this.beforeListeners.clear();this.listeners.clear();}
}
