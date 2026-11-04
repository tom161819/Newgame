import { JOBS } from '../data/jobs.js';
import { HUMAN_APPEARANCE } from '../data/humanAppearance.js';

export const POPULATION_ROW_HEIGHT=60;
export function populationSummary(workers){
  const residents=[...workers].filter(worker=>worker.isAlive&&worker.isSubject!==false),employed=residents.filter(worker=>worker.profession!=='idle').length;
  return {residents,total:residents.length,employed,unemployed:residents.length-employed};
}
export function populationWindow(total,scroll,height,overscan=3){
  scroll=Math.max(0,Math.min(scroll,Math.max(0,total*POPULATION_ROW_HEIGHT-height)));
  const start=Math.max(0,Math.floor(scroll/POPULATION_ROW_HEIGHT)-overscan),end=Math.min(total,Math.ceil((scroll+height)/POPULATION_ROW_HEIGHT)+overscan);
  return {start:Math.min(start,total),end};
}
export const professionColor=profession=>JOBS[profession]?.portraitColor??JOBS.idle.portraitColor;
export function humanPortrait(){
  const colors=Object.fromEntries(Object.entries(HUMAN_APPEARANCE).map(([key,value])=>[key,`#${value.toString(16).padStart(6,'0')}`]));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="${colors.tunic}" d="M5 48v-9q3-8 19-8t19 8v9z"/><path fill="${colors.belt}" d="M5 44h38v4H5z"/><path fill="${colors.skin}" d="M20 27h8v9h-8z"/><ellipse cx="24" cy="20" rx="11" ry="13" fill="${colors.skin}"/><path fill="${colors.hair}" d="M12 20V11q3-8 12-8t12 8v9l-5-8-4 3-9-3z"/><g fill="${colors.eyes}"><circle cx="20" cy="20" r="1.3"/><circle cx="28" cy="20" r="1.3"/></g><path d="M21 27q3 2 6 0" fill="none" stroke="${colors.belt}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
