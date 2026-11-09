// m-budovy-tooltip (owner point 86): a small tooltip after resting the pointer on a building on the map. One system
// with the store preview of 0.54.0 (src/ui/StorePreview.js): the same element, now for every building. The delay can
// be tried in the developer Balance panel (Dev mode only, 0.2–2 s, kept in this browser like the other dev values).
export const BUILDING_TOOLTIP=Object.freeze({
  delayMs:800,
  // At most 4 lines: the name with status icons, then up to 3 lines of detail.
  maxLines:4,
  // Store contents: the largest goods first, at most 4 of them on one line.
  maxItems:4,
  devDelay:Object.freeze({min:.2,max:2,step:.1}),
  storageKey:'newgame.buildingTooltips',
});
// Status icons after the name (the icon is the text, the meaning goes to its title).
export const BUILDING_TOOLTIP_ICONS=Object.freeze({notWorking:'⛔',missingInput:'⏳',fire:'🔥',rats:'🐀'});
// Happiness of a house's residents (needs.moods ids).
export const BUILDING_TOOLTIP_MOODS=Object.freeze({happy:'☺',neutral:'😐',unhappy:'☹',critical:'⚠'});
// Store locations shown as contents (the store preview's kinds plus the Marketplace's goods space).
export const BUILDING_TOOLTIP_STORE_KINDS=Object.freeze(['fallback','storage','pile','market']);

// The on/off switch in Settings (default on), kept in this browser.
export function buildingTooltipsEnabled(storage=globalThis.localStorage){try{return storage?.getItem(BUILDING_TOOLTIP.storageKey)!=='off';}catch{return true;}}
export function setBuildingTooltipsEnabled(on,storage=globalThis.localStorage){try{storage?.setItem(BUILDING_TOOLTIP.storageKey,on?'on':'off');}catch{/* the choice still applies this session */}return on===true;}

// When the tooltip may show at all: never in build mode, while dragging (a drag rectangle or a held button), for the
// selected building (its info panel is open), on touch input, or with the setting off.
export function buildingTooltipAllowed({enabled=true,buildMode=false,dragging=false,selected=false,touch=false}={}){
  return !!enabled&&!buildMode&&!dragging&&!selected&&!touch;
}
