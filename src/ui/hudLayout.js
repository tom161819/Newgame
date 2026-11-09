// m-prehled-kralovstvi-pozice (plan point 81, owner comments 9 Nov): pure layout helpers for the map's bottom corner.
// Rects are plain {left,top,right,bottom} in window pixels; nothing here touches the DOM, so tests check the layout at
// 1920×1080 and 1366×768 directly.
export const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height});
export const fromDom=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom});
// Touching edges do not count (1 px tolerance for rounding).
export const overlaps=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
const area=r=>Math.max(0,r.right-r.left)*Math.max(0,r.bottom-r.top);

// The Kingdom overview bar keeps the bottom-left corner of the map. It sits as low and as far left as it can without
// covering anything in `obstacles` (camera chips, Notices, minimap, the open building strip, the left side buttons, the
// HUD): first in the corner column, stacked above whatever is there; only if that column has no room below `minTop`
// does it try just right of an obstacle. Returns its rect in window pixels.
export function placeBottomLeft({view,size,obstacles=[],margin=8,gap=6,minTop=view.top+margin}){
  const solid=obstacles.filter(o=>area(o)>0),w=size.width,h=size.height;
  const xs=[...new Set([view.left+margin,...solid.map(o=>Math.round(o.right+gap))])].filter(x=>x>=view.left+margin&&x+w<=view.right-margin).sort((a,b)=>a-b);
  let best=null;
  for(const x of xs){
    let bottom=view.bottom-margin,box=null;
    for(let i=0;i<=solid.length;i++){
      box={left:x,right:x+w,top:bottom-h,bottom};const hit=solid.filter(o=>overlaps(box,o));if(!hit.length)break;
      bottom=Math.min(...hit.map(o=>o.top))-gap;box=null;
    }
    if(!box)continue;if(box.top>=minTop)return box;if(!best||box.top>best.top)best=box;
  }
  return best??{left:view.left+margin,right:view.left+margin+w,top:view.bottom-margin-h,bottom:view.bottom-margin};
}

// The open building strip spans the whole window width; the map's bottom-anchored items (camera chips, corner stack)
// are lifted by how far it reaches into the map. Zero when the strip opens downwards (buildings bar at the top).
// Since the bar floats over the map (owner 9 Nov 2026) a tall strip may reach above the middle of a low window, so the
// side is told by the strip's centre, not its top.
export function bottomLift(view,panel,gap=8){
  if(!panel||(panel.top+panel.bottom)/2<=view.top+(view.bottom-view.top)/2)return 0;
  return Math.max(0,Math.round(view.bottom-panel.top+gap));
}

// Collapsed overview bar: a browser preference, not part of the save.
export const KINGDOM_BAR=Object.freeze({storageKey:'newgame.kingdomBar.collapsed'});
export function readBarCollapsed(storage=globalThis.localStorage){try{return storage?.getItem(KINGDOM_BAR.storageKey)==='1';}catch{return false;}}
export function writeBarCollapsed(value,storage=globalThis.localStorage){try{storage?.setItem(KINGDOM_BAR.storageKey,value?'1':'0');return true;}catch{return false;}}

// Dragged Notices bar (owner comment 2). The position is kept relative to the nearest corner of the map, so a bar
// left near the bottom right stays there when the window grows; resolving clamps it fully on screen.
export const NOTICE_POSITION=Object.freeze({storageKey:'newgame.notices.position',threshold:4});
export function anchorPosition(box,view){
  const cx=(box.left+box.right)/2,cy=(box.top+box.bottom)/2,ax=cx<(view.left+view.right)/2?'left':'right',ay=cy<(view.top+view.bottom)/2?'top':'bottom';
  return {ax,ay,x:Math.round(ax==='left'?box.left-view.left:view.right-box.right),y:Math.round(ay==='top'?box.top-view.top:view.bottom-box.bottom)};
}
export function normalizePosition(p){
  if(!p||typeof p!=='object'||!['left','right'].includes(p.ax)||!['top','bottom'].includes(p.ay))return null;
  if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;
  return {ax:p.ax,ay:p.ay,x:Math.round(Math.max(0,Math.min(8000,p.x))),y:Math.round(Math.max(0,Math.min(8000,p.y)))};
}
export function resolvePosition(p,size,view){
  const w=Math.min(size.width,view.right-view.left),h=Math.min(size.height,view.bottom-view.top);
  const left=p.ax==='left'?view.left+p.x:view.right-p.x-size.width,top=p.ay==='top'?view.top+p.y:view.bottom-p.y-size.height;
  const l=Math.round(Math.max(view.left,Math.min(view.right-w,left))),t=Math.round(Math.max(view.top,Math.min(view.bottom-h,top)));
  return {left:l,top:t,right:l+size.width,bottom:t+size.height};
}
export function readPosition(storage=globalThis.localStorage){try{return normalizePosition(JSON.parse(storage?.getItem(NOTICE_POSITION.storageKey)??'null'));}catch{return null;}}
export function writePosition(p,storage=globalThis.localStorage){try{const v=normalizePosition(p);if(v)storage?.setItem(NOTICE_POSITION.storageKey,JSON.stringify(v));else storage?.removeItem(NOTICE_POSITION.storageKey);return !!v;}catch{return false;}}
export function clearPosition(storage=globalThis.localStorage){try{storage?.removeItem(NOTICE_POSITION.storageKey);}catch{/* nothing kept */}}
// Slid away, a moved bar folds to the nearer side edge of the map (its anchor). The tab's left in window pixels: at the
// edge, or just beside a side tab (Policy / Population / Employments, fixed at the window edge) at the same height.
export function edgeTabLeft(edge,view,{width,top,height},sides=[],gap=4){
  if(edge==='left'){let left=view.left;for(const r of [...sides].sort((a,b)=>a.right-b.right))if(r.top<top+height+gap&&r.bottom>top-gap&&r.right>left-gap&&r.left<left+width+gap)left=r.right+gap;return Math.round(left);}
  let right=view.right;for(const r of [...sides].sort((a,b)=>b.left-a.left))if(r.top<top+height+gap&&r.bottom>top-gap&&r.left<right+gap&&r.right>right-width-gap)right=r.left-gap;
  return Math.round(right-width);
}
