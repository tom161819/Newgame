import { TUTORIAL_STEPS } from '../data/tutorial.js';
import { buildingIsComplete } from '../game/buildingState.js';

// Rocks marked to clear (or already mined). m-tutorial-v2 bug 6: the marks live in naturalResources.miningWork.rocks
// (RockMiningWork); the old lookup read naturalResources.mining (the Mineral System, which has no rocks), so marking a
// rock never ended the stone step and the House step behind it looked stuck too (bug 7).
export const markedRocks=scene=>[...(scene.naturalResources?.miningWork?.rocks?.records?.values?.()??[])].filter(r=>r.marked||r.produced>0);

// Which steps are done, from the world and the player's settings. `seen` holds the UI-only steps finished this session
// (the king step and optional steps closed with "Next") or remembered in the browser (the speed step); a world with any
// building has passed the king step. An optional step is also done once a later mandatory step is done, so a loaded game
// (or a save from before the m-tutorial-v2 order) resumes at the first mandatory step it has not done.
export function tutorialProgress(scene,{seen=new Set(),skipped=new Set()}={}){
  const buildings=scene.buildings??[],types=new Set(buildings.map(b=>b.type)),built=new Set(buildings.filter(b=>buildingIsComplete(b)).map(b=>b.type));
  const people=scene.workerSystem?.liveSubjects?.()??[];
  const marked=markedRocks(scene).length>0;
  const player=buildings.some(b=>!['castle','starter_stockpile'].includes(b.type));
  const world=step=>{
    switch(step.check){
      case 'seen':return seen.has(step.id)||player;
      case 'job':return people.some(w=>w.profession===step.job);
      case 'planned':return step.buildingIds.every(id=>types.has(id));
      case 'built':return step.buildingIds.every(id=>built.has(id));
      case 'stone':return marked||step.buildingIds.some(id=>types.has(id));
      case 'speed':return seen.has(step.id)||(scene.gameSpeed??1)>1;
      default:return false;
    }
  };
  const base=TUTORIAL_STEPS.map(step=>skipped.has(step.id)||(step.optional&&seen.has(step.id))||world(step));
  // "Passed by the world": a later mandatory building step done by the world itself (not skipped; a profession can come
  // from auto-employment early, so it does not count).
  const passed=i=>TUTORIAL_STEPS.some((s,j)=>j>i&&!s.optional&&['planned','built','stone'].includes(s.check)&&world(s));
  const steps=TUTORIAL_STEPS.map((step,i)=>({...step,done:base[i]||(!!step.optional&&passed(i))})),current=steps.find(s=>!s.done)??null;
  return {steps,current,doneCount:steps.filter(s=>s.done).length,total:steps.length,allDone:!current};
}

// The rock tile to mark in the stone step: the visible, unmarked rock nearest to `origin` (the Castle), or null.
export function nearestRock(terrainGrid,origin,{visible=()=>true,skip=()=>false}={}){
  let best=null,bestD=Infinity;
  for(let y=0;y<(terrainGrid?.length??0);y++)for(let x=0;x<terrainGrid[y].length;x++){
    if(terrainGrid[y][x]!==1)continue;const d=(x-origin.x)**2+(y-origin.y)**2;if(d>=bestD)continue;
    const tile={x,y};if(!visible(tile)||skip(tile))continue;best=tile;bestD=d;
  }
  return best;
}

const overlaps=(a,b)=>!!a&&!!b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const contains=(outer,inner)=>!!outer&&!!inner&&inner.left>=outer.left&&inner.right<=outer.right&&inner.top>=outer.top&&inner.bottom<=outer.bottom;
const shared=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
// m-ui-prekryvy-076: the top-left corner for a w×h bubble that covers none of `blocked` (screen boxes), nearest to
// `anchor`; (x,y) is kept when it is already free. With no free spot on screen, the spot covering the least. Pure.
export function freeBubbleSpot({x,y,w,h,vw,vh,blocked=[],anchor={x:vw/2,y:vh/2},margin=12,top=70,step=16}){
  const cost=(px,py)=>{const b={left:px,right:px+w,top:py,bottom:py+h};return blocked.reduce((n,r)=>n+shared(b,r),0);};
  if(!cost(x,y))return {x,y};
  const xs=[vw-w-margin],ys=[vh-h-margin];for(let px=margin;px<=vw-w-margin;px+=step)xs.push(px);for(let py=top;py<=vh-h-margin;py+=step)ys.push(py);
  for(const r of blocked){xs.push(r.left-w-6,r.right+6,r.left);ys.push(r.top-h-6,r.bottom+6,r.top);}
  let best=null;
  for(const px0 of xs)for(const py0 of ys){
    const px=clamp(px0,margin,vw-w-margin),py=clamp(py0,top,vh-h-margin),c=cost(px,py),d=Math.hypot(px+w/2-anchor.x,py+h/2-anchor.y);
    if(!best||c<best.c-1e-6||Math.abs(c-best.c)<=1e-6&&d<best.d)best={x:px,y:py,c,d};
  }
  return {x:best.x,y:best.y};
}
// m-drobnosti-076 (report 0.76.0 point 9): once the game has run faster than ×1 the Speed step stays done, also after
// slowing down again (and in the browser, like "Next" on it). Returns true when it was remembered just now.
export function rememberSpeed(scene,seen){if((scene?.gameSpeed??1)>1&&!seen.has('speed')){seen.add('speed');return true;}return false;}
export const ARROW_LENGTH=34;
// m-tutorial-v2 point 2: where the arrow and the bubble go so neither covers the target. Pure (unit tested).
// point: the target's centre on screen; rect: its box (null for a world point); avoid: a larger box that must stay
// visible too (the whole Population panel when the arrow points at one row); from:'above' forces the arrow above.
// Returns the arrow centre and angle (radians, the direction it points) and the bubble's top-left corner.
// m-ui-prekryvy-076 (report 0.76.0 point 4): `windows` – the boxes of the open windows (the Build menu, Population, a side
// card, a dialog). The bubble never covers one of them: when its place by the arrow is taken it goes to the free spot
// nearest to the arrow; a target inside a window gets the arrow from above, so it does not cover the next button either.
// m-tutorial-v3 (owner point 74): `arrowLength` is the drawn length of the pointer (the UI-design pointers are 56 px and
// pulse to 112 %), not the old 34 px constant, and a target is "off screen" only when no part of it is on screen. Before,
// a target whose centre lay within 28 px of the screen edge (the Population tab on the right edge) counted as off screen
// and the arrow was put on the clamped point – right over the tab.
export function tutorialPlacement({point,rect=null,avoid=null,from=null,vw,vh,bubble:{w,h},margin=12,top=70,windows=[],arrowLength=ARROW_LENGTH}){
  const m=28,visibleRect=rect&&rect.right>0&&rect.left<vw&&rect.bottom>0&&rect.top<vh;
  const on=visibleRect||!rect&&point.x>=0&&point.x<=vw&&point.y>=0&&point.y<=vh,off=!on;
  const cx=on?clamp(point.x,0,vw):clamp(point.x,m,vw-m),cy=on?clamp(point.y,0,vh):clamp(point.y,m,vh-m);
  const r=rect?(visibleRect?{left:Math.max(0,rect.left),right:Math.min(vw,rect.right),top:Math.max(0,rect.top),bottom:Math.min(vh,rect.bottom)}:rect):{left:point.x-4,right:point.x+4,top:point.y-4,bottom:point.y+4};
  const box=avoid?{left:Math.min(r.left,avoid.left),right:Math.max(r.right,avoid.right),top:Math.min(r.top,avoid.top),bottom:Math.max(r.bottom,avoid.bottom)}:r;
  const half=Math.max(ARROW_LENGTH,arrowLength)/2,gap=6,ARROW=half*2;
  let arrow,bubbleAt;
  if(off){
    // Off screen: the arrow sits at the edge and points towards the target; the bubble beside it, inside the screen.
    const angle=Math.atan2(point.y-cy,point.x-cx);arrow={x:cx,y:cy,angle,off:true};
    bubbleAt={x:cx-Math.cos(angle)*(w/2+half+gap)-w/2,y:cy-Math.sin(angle)*(h/2+half+gap)-h/2};
  }else{
    const roomLeft=box.left,roomRight=vw-box.right,roomAbove=box.top-top,roomBelow=vh-box.bottom,need=w+ARROW+gap*2+margin;
    const ay=clamp(cy,box.top+8,box.bottom-8);
    let side=from;
    if(!side&&!avoid&&windows.some(win=>contains(win,r)))side=r.top-top>=ARROW+gap*2?'above':'below';
    if(!side)side=!avoid&&r.bottom>vh-170?'above':roomLeft>=need||roomRight>=need?(roomLeft>=roomRight?'left':'right'):roomAbove>=roomBelow?'above':'below';
    if(side==='left'){arrow={x:box.left-gap-half,y:ay,angle:0};bubbleAt={x:arrow.x-half-gap-w,y:ay-h/2};}
    else if(side==='right'){arrow={x:box.right+gap+half,y:ay,angle:Math.PI};bubbleAt={x:arrow.x+half+gap,y:ay-h/2};}
    else if(side==='below'){const ax=clamp(cx,m,vw-m);arrow={x:ax,y:box.bottom+gap+half,angle:-Math.PI/2};bubbleAt={x:ax-w/2,y:arrow.y+half+gap};}
    else{const ax=clamp(cx,m,vw-m);arrow={x:ax,y:box.top-gap-half,angle:Math.PI/2};bubbleAt={x:ax-w/2,y:arrow.y-half-gap-h};}
    arrow.off=false;
  }
  let x=clamp(bubbleAt.x,margin,vw-w-margin),y=clamp(bubbleAt.y,top,vh-h-margin);
  // The screen edge may have pushed the bubble back over the target: move it above or below the box instead.
  const covers=()=>{const b={left:x,right:x+w,top:y,bottom:y+h};return overlaps(b,r)||!off&&overlaps(b,box);};
  if(covers()){
    const below=box.bottom+ARROW+gap*2,above=box.top-ARROW-gap*2-h;
    if(below+h<=vh-margin)y=below;else if(above>=top)y=above;else if(box.left-w-margin>=0)x=box.left-w-gap;else if(box.right+w+margin<=vw)x=box.right+gap;
  }
  if(windows.length){
    const near=12,blocked=[r,...(off?[]:[box]),{left:arrow.x-near,right:arrow.x+near,top:arrow.y-near,bottom:arrow.y+near},...windows];
    ({x,y}=freeBubbleSpot({x,y,w,h,vw,vh,blocked,anchor:arrow,margin,top}));
  }
  return {arrow,bubble:{x:Math.round(x),y:Math.round(y)}};
}
