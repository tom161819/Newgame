// Owner 18 Nov 2026: the selection panel shows over each unit's picture the weapon and the armour that kind uses.
// Small line icons drawn as SVG (provisional UI icons, not approved art): one per military item, so a Halberd and a
// Sword, a Crossbow and a Bow, Armour and Light Armour look different.
import { MILITARY_ITEMS } from '../data/militaryEquipment.js';
const svg=body=>`<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
export const GEAR_ICONS=Object.freeze({
  sword:svg('<path d="M3 13l8.5-8.5L13 3l-1.5 1.5"/><path d="M11.5 4.5L13 3"/><path d="M4.5 9.5l2 2"/><path d="M2.5 13.5l1-1"/>'),
  halberd:svg('<path d="M3.5 14.5L12 6"/><path d="M10 4.5l2-3 1.5 1.5-1 1.5 2 1-2.5 1.5"/><path d="M10 4.5l1.5 3"/>'),
  bow:svg('<path d="M4 2.5c6 1.5 8 5.5 9.5 11.5"/><path d="M4 2.5l9.5 11.5"/><path d="M6 12l7-7"/><path d="M11 4.5l2 .5.5 2"/>'),
  crossbow:svg('<path d="M2.5 7c3-3.5 8-3.5 11 0"/><path d="M8 4.5v10"/><path d="M2.5 7L8 9.5 13.5 7"/><path d="M6.5 13h3"/>'),
  armor:svg('<path d="M5 2.5l3 1.5 3-1.5 2.5 2-1 3v6.5h-9V7.5l-1-3z"/><path d="M8 4v9.5"/><path d="M4.5 9.5h7"/>'),
  light_armor:svg('<path d="M5.5 2.5h5l3 3-1.5 2-1-1v7h-6v-7l-1 1-1.5-2z"/><path d="M8 3v10.5" stroke-dasharray="1.2 1.2"/>'),
});
// Weapon first, then armour, of what the unit really carries (an older unit may lack its Light Armour).
export function gearOf(equipment){
  const items=Object.values(equipment??{}).filter(id=>MILITARY_ITEMS[id]&&GEAR_ICONS[id]),slot=id=>MILITARY_ITEMS[id].slot==='weapon'?0:1;
  return [...new Set(items)].sort((a,b)=>slot(a)-slot(b));
}
