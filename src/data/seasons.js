import { cropStage } from './farming.js';
export const SEASONS=Object.freeze(['Spring','Summer','Autumn','Winter']);
export const SEASON_DAYS=5;
export const SEASON_GROWTH=Object.freeze({Spring:1.2,Summer:1.3,Autumn:1,Winter:0});
export const WEATHER_GROWTH=Object.freeze({Sunny:1.1,Rainy:1.15,Drought:.65,Frost:.3});
export const WEATHER_PROBABILITIES=Object.freeze({
  Spring:Object.freeze({Sunny:.5,Rainy:.4,Drought:.05,Frost:.05}),Summer:Object.freeze({Sunny:.6,Rainy:.2,Drought:.2,Frost:0}),
  Autumn:Object.freeze({Sunny:.4,Rainy:.4,Drought:.1,Frost:.1}),Winter:Object.freeze({Sunny:.35,Rainy:.1,Drought:0,Frost:.55}),
});
export function calendar(day){const n=day-1;return{season:SEASONS[Math.floor(n/SEASON_DAYS)%4],year:Math.floor(n/(SEASON_DAYS*4))+1,dayOfYear:n%(SEASON_DAYS*4)+1,dayInSeason:n%SEASON_DAYS+1};}
export function seasonalCropStage(type,growth,required,season){const stage=cropStage(growth,required);return type==='orchard'&&season==='Winter'?0:type==='orchard'&&season==='Spring'?Math.min(1,stage):stage;}
export const EDIBLE_RESOURCES=Object.freeze(['apple','bread','meat','fish']);
export const FOOD_ECONOMY_DAYS=5;
export const HUNGRY_WORK_MULTIPLIER=.8;
