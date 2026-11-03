import { calendar,SEASON_GROWTH,WEATHER_GROWTH,WEATHER_PROBABILITIES } from '../data/seasons.js';
export class SeasonSystem {
  constructor(time,{random=Math.random}={}){
    this.time=time;this.random=random;this.lastProcessedDay=time.day;this.beforeListeners=new Set();this.listeners=new Set();this.weather=this.rollWeather();
    this.unsubscribe=time.onNewDay(day=>this.processDay(day));
  }
  get calendar(){return calendar(this.lastProcessedDay);}
  get season(){return this.calendar.season;}
  get label(){const c=this.calendar;return`${c.season} · Day ${c.dayInSeason} / 5 · Year ${c.year} · ${this.weather}`;}
  rollWeather(){let value=this.random();for(const [weather,probability]of Object.entries(WEATHER_PROBABILITIES[this.season])){value-=probability;if(value<0)return weather;}return'Frost';}
  growthMultiplier(){return Math.max(0,SEASON_GROWTH[this.season]*WEATHER_GROWTH[this.weather]);}
  canHarvest(type){return type!=='orchard'||['Summer','Autumn'].includes(this.season);}
  onBeforeChange(listener){this.beforeListeners.add(listener);return()=>this.beforeListeners.delete(listener);}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  processDay(day){if(day<=this.lastProcessedDay)return;for(const listener of this.beforeListeners)listener();this.lastProcessedDay=day;this.weather=this.rollWeather();for(const listener of this.listeners)listener();}
  exportState(){return{lastProcessedDay:this.lastProcessedDay,...this.calendar,weather:this.weather};}
  importState(data){this.lastProcessedDay=data?.lastProcessedDay??this.time.day;this.weather=data?.weather??'Sunny';for(const listener of this.listeners)listener();}
  destroy(){this.unsubscribe();this.beforeListeners.clear();this.listeners.clear();}
}
