import { calendar,WEATHER_GROWTH } from '../data/seasons.js';
export function validateSeasonFoodState(s,{check,number,integer,array}){
  if(s.seasons){
    const data=s.seasons;integer(data.lastProcessedDay,1,s.time.day);check(data.lastProcessedDay===s.time.day&&Object.hasOwn(WEATHER_GROWTH,data.weather));
    check(typeof data.enabled==='boolean'&&data.enabled===s.gameSettings.seasonsEnabled);integer(data.cycleDay,1,s.time.day);number(data.cycleElapsed,0,s.gameSettings.dayLengthSeconds*1000-1e-7);number(data.cycleCompensation,-1e-6,1e-6);
    check((data.cycleDay-1)*s.gameSettings.dayLengthSeconds*1000+data.cycleElapsed<=s.time.totalElapsed+1e-5);
    const real=calendar(data.cycleDay);check(data.rememberedSeason===real.season);
    for(const [key,value]of Object.entries(real))check(data[key]===(key==='season'&&!data.enabled?'Summer':value));
  }else check(s.gameSettings.seasonsEnabled);
  const food=s.food;if(!food.residents)return;
  array(food.residents,20001);const ids=new Set();
  for(const r of food.residents){check(!ids.has(r.id)&&(r.id==='king'||s.workers?.some(w=>w.id===r.id)));ids.add(r.id);number(r.progress,0,1);check(r.progress<1);number(r.compensation,-1e-6,1e-6);check(typeof r.hungry==='boolean');}
  check(ids.has('king'));check(Math.abs(food.elapsed-food.residents.find(r=>r.id==='king').progress*s.gameSettings.dayLengthSeconds*500)<1e-6);
  integer(food.lastProcessedDay,1,s.time.day);check(food.lastProcessedDay===s.time.day);array(food.history,5);const days=new Set();
  for(const r of food.history){integer(r.day,1,s.time.day);check(!days.has(r.day));days.add(r.day);integer(r.produced);integer(r.consumed);}
  array(food.productionEvents,1000000);check(new Set(food.productionEvents).size===food.productionEvents.length);for(const id of food.productionEvents)check(typeof id==='string'&&id.length>0&&id.length<=128);
}
