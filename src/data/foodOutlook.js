// Plan m-e1-jidlo-vydrz (report 0.48.0): how many days the edible stores last, the warning threshold, and when
// newcomers stop coming (less than 2 days of food or more than 3 unemployed residents).
export const FOOD_OUTLOOK=Object.freeze({warnDays:3,settleMinDays:2,settleMaxUnemployed:3});
export const foodDays=foodSystem=>{const daily=foodSystem?.dailyConsumption??0;return daily>0?(foodSystem.availablePortions??0)/daily:Infinity;};
