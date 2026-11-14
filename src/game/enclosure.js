import { buildingIsComplete,buildingDefinition } from './buildings.js';
import { isWall } from './walls.js';

// m-uzavreny-hrad (owner 14 Nov 2026, points 34 and 35): "inside the walls" = ground that cannot be reached from the edge
// of the map without crossing a finished Stone Wall, Tower or Gate. Other buildings, water and trees do not close a
// ring. Worked out once for each set of finished wall pieces.
export const ENCLOSURE=Object.freeze({safetyBonus:15,ruins:Object.freeze({each:5,max:25})});
const ring=b=>buildingIsComplete(b)&&(isWall(b)||b.type==='tower'||b.type==='gate');
const cache=new WeakMap();
export function enclosure(scene){
  const map=scene.map,buildings=scene.buildings??[],pieces=buildings.filter(ring),key=`${map.length}:${pieces.map(b=>b.id).join()}`,had=cache.get(scene);
  if(had?.key===key)return had;
  const h=map.length,w=map[0]?.length??0,open=new Uint8Array(w*h),wall=new Uint8Array(w*h);let any=false;
  if(pieces.length>=4){
    for(const b of pieces)for(const t of b.tiles??[{x:b.x,y:b.y}])if(t.x>=0&&t.y>=0&&t.x<w&&t.y<h)wall[t.y*w+t.x]=1;
    const queue=[];const push=(x,y)=>{const i=y*w+x;if(!wall[i]&&!open[i]){open[i]=1;queue.push(i);}};
    for(let x=0;x<w;x++){push(x,0);push(x,h-1);}for(let y=0;y<h;y++){push(0,y);push(w-1,y);}
    for(let n=0;n<queue.length;n++){const i=queue[n],x=i%w,y=(i-x)/w;if(x>0)push(x-1,y);if(x<w-1)push(x+1,y);if(y>0)push(x,y-1);if(y<h-1)push(x,y+1);}
    for(let i=0;i<open.length&&!any;i++)any=!open[i]&&!wall[i];
  }
  const inside=(x,y)=>{if(!any)return false;x=Math.floor(x);y=Math.floor(y);return x>=0&&y>=0&&x<w&&y<h&&!open[y*w+x]&&!wall[y*w+x];};
  // A building is inside when its middle is; a wall piece itself is not.
  const holds=b=>{if(!any||!b||ring(b))return false;const d=buildingDefinition(b);return inside(b.x+(d.width??1)/2,b.y+(d.height??1)/2);};
  const value={key,any,inside,holds};cache.set(scene,value);return value;
}
export const ruinsInside=scene=>{const e=enclosure(scene);return e.any?(scene.buildings??[]).filter(b=>b.type==='burnt_ruins'&&e.holds(b)).length:0;};
export const ruinsPenalty=scene=>Math.min(ENCLOSURE.ruins.max,ruinsInside(scene)*ENCLOSURE.ruins.each);
