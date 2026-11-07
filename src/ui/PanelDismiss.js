// #121: a right click on the map closes the ordinary open panels (one central place, not a handler per panel).
// Confirmations, the pause and Save/Load menus and Game Over are never closed this way; while one of them is open a
// right click does nothing. The click that closes panels is consumed: it never also orders a Move.
export const DISMISSIBLE_PANELS=Object.freeze(['building-detail-dialog','workplace-dialog','unit-dialog','storage-dialog','construction-dialog','farming-dialog','equipment-dialog','treasure-dialog','food-economy-dialog','natural-resource-dialog','asset-gallery','help-dialog']);
const dismissible=dialog=>DISMISSIBLE_PANELS.includes(dialog.id);
// Closes like Escape does (each panel's own `cancel` handler restores input); a panel without one is closed directly.
export function dismissPanel(dialog){
  if(!dialog?.open||!dismissible(dialog))return false;
  dialog.dispatchEvent(new Event('cancel',{cancelable:true}));if(dialog.open)dialog.close();return true;
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
export function installPanelDismiss(doc,{panels=()=>[],signal}={}){
  // A modal panel covers the map with its backdrop: the right click lands on the <dialog> itself, outside its box.
  doc.addEventListener('contextmenu',event=>{
    const dialog=event.target?.closest?.('dialog');
    if(dialog&&event.target===dialog&&dismissible(dialog)){event.preventDefault();closeOpenPanels(doc,{panels:panels()});}
    // The game canvas: Phaser ignores pointers while Settings pauses the game, but the context menu event still arrives.
    else if(event.target?.tagName==='CANVAS'&&closeOpenPanels(doc,{panels:panels()}))event.preventDefault();
  },{capture:true,signal});
}
