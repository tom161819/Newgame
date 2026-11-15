// #121 / owner request 28: the one central place where a right click closes windows (not a handler per window).
// - A right click on the map (or on a modal panel's backdrop) closes the ordinary open panels, as before.
// - A right click INSIDE a window or side card closes (collapses) just that window.
// - In a text input, textarea or select the browser context menu stays and nothing closes.
// Confirmations, the pause and Save/Load menus, Game Over and the progress/summary dialogs are never closed this way;
// while one of them is open a map right click does nothing. The click that closes panels is consumed: no Move order.
export const DISMISSIBLE_PANELS=Object.freeze(['building-detail-dialog','report-dialog','workplace-dialog','unit-dialog','storage-dialog','construction-dialog','farming-dialog','equipment-dialog','treasure-dialog','food-economy-dialog','natural-resource-dialog','asset-gallery','marketplace-dialog','wiki-dialog','village-dialog','cat-dialog','builder-workshop-dialog']);
// Dialogs a right click deliberately leaves alone (they ask for a decision, block the game or belong to the menus).
export const NEVER_DISMISSED=Object.freeze(['game-over','pause-menu','save-load-dialog','save-confirm','demolition-confirm-dialog','catch-up-dialog','away-summary','changelog-dialog','version-archive-dialog']);
// Non-dialog windows (side cards, folding cards): root id → how to close it. `scene` is the GameScene.
export const SIDE_WINDOWS=Object.freeze({
  'settings-panel':scene=>scene?.settingsPanel?.setOpen(false),
  'population-panel':scene=>scene?.populationSidebar?.setOpen(false),
  'policy-card':(scene,root)=>{if(scene?.sideCards)scene.sideCards.close('policy');else root.hidden=true;},
  'employment-panel':(scene,root)=>{if(scene?.employmentPanel)scene.employmentPanel.close();else root.hidden=true;},
  'notices-panel':(scene,root)=>{if(scene?.noticesPanel?.setCollapsed)scene.noticesPanel.setCollapsed(true);else root.classList.add('collapsed');},
  'royal-goals':(scene,root)=>{root.open=false;},
});
export const WINDOW_SELECTOR=[...DISMISSIBLE_PANELS,...NEVER_DISMISSED,...Object.keys(SIDE_WINDOWS)].map(id=>`#${id}`).join(',');
const dismissible=dialog=>DISMISSIBLE_PANELS.includes(dialog.id);
// Closes like Escape does (each panel's own `cancel` handler restores input); a panel without one is closed directly.
export function dismissPanel(dialog){
  if(!dialog?.open||!dismissible(dialog))return false;
  dialog.dispatchEvent(new Event('cancel',{cancelable:true}));if(dialog.open)dialog.close();return true;
}
// Is a side window showing (not hidden, not collapsed)?
export function sideWindowOpen(root){
  if(!root||root.hidden||root.getAttribute?.('aria-hidden')==='true')return false;
  if(root.tagName==='DETAILS')return !!root.open;
  return !root.classList?.contains?.('collapsed');
}
// Closes one window (a dialog or a side window) the right click landed in; true when something closed.
export function dismissWindow(root,scene){
  if(!root)return false;
  if(root.tagName==='DIALOG')return dismissPanel(root);
  const close=SIDE_WINDOWS[root.id];if(!close||!sideWindowOpen(root))return false;
  close(scene,root);return true;
}
// Returns true when the right click was used to close something (and must not do anything else).
// `panels` are the non-modal side panels (Settings, Population) with `open` and `setOpen`.
export function closeOpenPanels(doc,{panels=[]}={}){
  const open=[...doc.querySelectorAll('dialog[open]')];
  if(open.some(d=>!dismissible(d)))return false;
  let closed=0;for(const dialog of open)if(dismissPanel(dialog))closed++;
  for(const panel of panels)if(panel?.open){panel.setOpen(false);closed++;}
  return closed>0;
}
const TEXT_TYPES=new Set(['','text','search','number','email','password','url','tel','date','time','datetime-local','month','week']);
// Text fields keep the browser context menu (copy / paste).
export function keepsContextMenu(target){
  const field=target?.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"]');if(!field)return false;
  return field.tagName!=='INPUT'||TEXT_TYPES.has(String(field.getAttribute?.('type')??'').toLowerCase());
}
export function installPanelDismiss(doc,{panels=()=>[],scene=null,signal}={}){
  doc.addEventListener('contextmenu',event=>{
    const target=event.target;if(keepsContextMenu(target))return;
    // A modal panel covers the map with its backdrop: the right click lands on the <dialog> itself, outside its box.
    if(target?.tagName==='DIALOG'&&dismissible(target)){event.preventDefault();closeOpenPanels(doc,{panels:panels()});return;}
    // Inside a window: close the nearest one (a Wiki opened over a building panel closes alone).
    const root=target?.closest?.(WINDOW_SELECTOR);
    if(root){event.preventDefault();dismissWindow(root,typeof scene==='function'?scene():scene);return;}
    // The game canvas: Phaser ignores pointers while Settings pauses the game, but the context menu event still arrives.
    if(target?.tagName==='CANVAS'&&closeOpenPanels(doc,{panels:panels()}))event.preventDefault();
  },{capture:true,signal});
}
