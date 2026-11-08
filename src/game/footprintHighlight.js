// m-vytezeny-dul-ctverecky (63): the light squares (footprint tiles) every building view draws on the ground below
// itself. They help while placing a building and show what a selected building covers, but under every finished
// building in normal play they only cluttered the map. Shown: a placement preview or a tinted (validity) paint, a
// construction site or blueprint (its plan), any building while a building is being placed, and the selected one.
export function footprintShown({complete=true,preview=false,tinted=false,selected=false,buildMode=false}={}){
  return preview||tinted||!complete||selected||buildMode;
}
// The footprint layer of a view (Lit/Construction wrappers keep it on the inner view); null for views without one.
export const footprintLayer=view=>view?.footprint??view?.inner?.footprint??null;
export function applyFootprint(view,shown){
  const layer=footprintLayer(view);if(!layer?.setVisible)return false;
  if(layer.visible!==shown)layer.setVisible(shown);return true;
}
// Ids of the buildings the player has selected: the one clicked last and the one whose panel is open.
export function selectedBuildingIds(scene){
  const ids=new Set(),d=scene.demolitionUI;
  if(d?.selectedId!=null)ids.add(d.selectedId);
  if(d?.buildingId!=null&&d.host?.open)ids.add(d.buildingId);
  return ids;
}
