import { localized } from '../i18n/names.js';
import { t } from '../i18n/index.js';
// Object category stays "building"; this is its construction-menu grouping.
export const BUILDING_CATEGORIES=Object.freeze({
  defense:{name:'Castle & Defense',icon:'🏰'},housing:{name:'Housing',icon:'⌂'},
  food:{name:'Food & Farming',icon:'🌾'},industry:{name:'Mining & Industry',icon:'⚒'},
  logistics:{name:'Logistics & Trade',icon:'▣'},infrastructure:{name:'Infrastructure',icon:'▦'},
});
export const buildingCategoryLabel=definition=>BUILDING_CATEGORIES[definition.buildingCategory]?localized(`buildingCategory.${definition.buildingCategory}`,BUILDING_CATEGORIES[definition.buildingCategory].name):t('buildingCategory.all');
// #132: optional menuOrder sorts buildings within their own category (lower first, unordered ones keep registry order
// after the ordered ones). In All, each category keeps its slots, so only the order inside a category changes.
const byMenuOrder=(a,b)=>(a.menuOrder??Number.MAX_SAFE_INTEGER)-(b.menuOrder??Number.MAX_SAFE_INTEGER);
export function buildingsInCategory(registry,category){
  const list=registry.buildables().filter(d=>category==='all'||d.buildingCategory===category),slots=new Map(),out=list.slice();
  list.forEach((d,i)=>{const key=d.buildingCategory??'';if(!slots.has(key))slots.set(key,[]);slots.get(key).push(i);});
  for(const indices of slots.values()){const sorted=indices.map(i=>list[i]).sort(byMenuOrder);indices.forEach((i,j)=>{out[i]=sorted[j];});}
  return out;
}
