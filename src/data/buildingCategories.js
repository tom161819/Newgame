import { localized } from '../i18n/names.js';
import { t } from '../i18n/index.js';
// Object category stays "building"; this is its construction-menu grouping.
export const BUILDING_CATEGORIES=Object.freeze({
  defense:{name:'Castle & Defense',icon:'🏰'},housing:{name:'Housing',icon:'⌂'},
  food:{name:'Food & Farming',icon:'🌾'},industry:{name:'Mining & Industry',icon:'⚒'},
  logistics:{name:'Logistics & Trade',icon:'▣'},infrastructure:{name:'Infrastructure',icon:'▦'},
});
export const buildingCategoryLabel=definition=>BUILDING_CATEGORIES[definition.buildingCategory]?localized(`buildingCategory.${definition.buildingCategory}`,BUILDING_CATEGORIES[definition.buildingCategory].name):t('buildingCategory.all');
// Food starts with its prerequisite chain; all other entries keep registry order.
const foodPriority=id=>id==='granary'?0:id==='farmhouse'?1:2;
export function buildingsInCategory(registry,category){
  const buildings=registry.buildables().filter(d=>category==='all'||d.buildingCategory===category);
  return category==='food'?buildings.sort((a,b)=>foodPriority(a.id)-foodPriority(b.id)):buildings;
}
