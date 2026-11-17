// Owner 17 Nov 2026: inside the mine the rock looks like rock. What cannot be walked stays black from above; only the
// tunnel walls facing the passages show, as rough rock faces, and the floor is cave stone. Drawn once (provisional art
// until a Studio texture is approved); one graphics per screen row so a wall in front hides a man behind it.
import { gridToWorld } from './isometric.js';

const TALL=34,LOW=9;
const hash=(x,y,k=0)=>{let h=(x*374761393+y*668265263+k*2246822519)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const mix=(a,b,t)=>{const r=(a>>16&255)+((b>>16&255)-(a>>16&255))*t,g=(a>>8&255)+((b>>8&255)-(a>>8&255))*t,bb=(a&255)+((b&255)-(a&255))*t;return (Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(bb);};

// wall(x,y): true for rock (and outside the map). Pure description of what to draw, for tests and the view.
export function dungeonShapes(wall,size){
  const floor=(x,y)=>!wall(x,y),near=(x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(floor(x+dx,y+dy))return true;return false;};
  // Height of a corner: low where a passage lies just above it on screen (the wall stands in front of the floor and
  // must not hide it), tall elsewhere, a little ragged.
  // Rock islands (pillars and outcrops standing free in a cavern) show their rocky top; the main rock stays black.
  const island=new Set();{const seen=new Set();for(let y=0;y<size;y++)for(let x=0;x<size;x++){const k=`${x},${y}`;if(!wall(x,y)||seen.has(k))continue;
    const part=[],q=[{x,y}];seen.add(k);let border=false;while(q.length){const p=q.pop();part.push(p);if(p.x<=0||p.y<=0||p.x>=size-1||p.y>=size-1)border=true;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=p.x+dx,ny=p.y+dy,nk=`${nx},${ny}`;if(nx>=0&&ny>=0&&nx<size&&ny<size&&wall(nx,ny)&&!seen.has(nk)){seen.add(nk);q.push({x:nx,y:ny});}}}
    if(!border&&part.length<=16)for(const p of part)island.add(`${p.x},${p.y}`);}}
  const isIsland=(x,y)=>island.has(`${x},${y}`);
  const height=(vx,vy)=>{const around=[[vx-1,vy-1],[vx,vy-1],[vx-1,vy],[vx,vy]].filter(([x,y])=>wall(x,y));
    if(around.length&&around.every(([x,y])=>isIsland(x,y)))return 22+hash(vx,vy,4)*10;
    return floor(vx-1,vy-1)?LOW+hash(vx,vy,3)*4:TALL+(hash(vx,vy,1)-.5)*8;};
  // Owner 17 Nov 2026 (later): no grid corners everywhere – a corner where rock juts into a passage is shaved, a
  // corner of a pocket is filled, straight stretches waver; now and then a corner keeps its edge.
  const shift=(vx,vy)=>{const quad=[[vx-1,vy-1],[vx,vy-1],[vx-1,vy],[vx,vy]],rock=quad.map(([x,y])=>wall(x,y)),n=rock.filter(Boolean).length;
    if(n===0||n===4)return {x:vx,y:vy};const r=hash(vx,vy,200);
    if(n===1||n===3){if(r<.14)return {x:vx,y:vy};const i=rock.indexOf(n===1),[tx,ty]=quad[i],k=(n===1&&isIsland(tx,ty)?.25:.55)+hash(vx,vy,201)*(n===1&&isIsland(tx,ty)?.15:.5);return {x:vx+(tx+.5-vx)*k,y:vy+(ty+.5-vy)*k};}
    if(rock[0]===rock[3])return {x:vx,y:vy};// the two diagonal tiles: a narrow neck stays as it is
    const nx=(rock[1]?1:0)+(rock[3]?1:0)-(rock[0]?1:0)-(rock[2]?1:0),ny=(rock[2]?1:0)+(rock[3]?1:0)-(rock[0]?1:0)-(rock[1]?1:0),j=(r-.5)*.36;
    return {x:vx+Math.sign(nx)*j*.5,y:vy+Math.sign(ny)*j*.5};};
  const tiles=[];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){if(!wall(x,y))continue;
    tiles.push({x,y,edge:near(x,y),island:isIsland(x,y),faces:[floor(x+1,y)?'east':null,floor(x,y+1)?'south':null].filter(Boolean),lip:[floor(x-1,y)?'west':null,floor(x,y-1)?'north':null].filter(Boolean),border:x===size-1||y===size-1});}
  return {tiles,height,shift,isIsland};
}

function poly(g,pts,color,alpha=1){g.fillStyle(color,alpha);g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))g.lineTo(p.x,p.y);g.closePath();g.fillPath();}

export function createDungeonView(scene,isWall,options={}){
  const size=scene.map.length,{tiles,height,shift}=dungeonShapes((x,y)=>x<0||y<0||x>=size||y>=size||isWall(x,y),size);
  const v=(x,y,h=0)=>{const q=Number.isInteger(x)&&Number.isInteger(y)?shift(x,y):{x,y},p=gridToWorld(q.x,q.y);return {x:p.x,y:p.y-h};},objects=[];
  // The cave floor under everything that stands on it.
  const floorG=scene.add.graphics().setDepth(-70);objects.push(floorG);// under the fog layer (-60), over the ground (-100)
  const deep=scene.add.graphics().setDepth(-70);objects.push(deep);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){if(isWall(x,y)){poly(deep,[v(x,y),v(x+1,y),v(x+1,y+1),v(x,y+1)],0x050505);continue;}
    let dark=0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(x+dx<0||y+dy<0||x+dx>=size||y+dy>=size||isWall(x+dx,y+dy))dark+=.12;
    const base=mix(mix(0x463f37,0x3e3832,hash(x,y,5)),0x1c1915,Math.min(.45,dark));poly(floorG,[v(x,y),v(x+1,y),v(x+1,y+1),v(x,y+1)],base);
    for(let i=0;i<3;i++){const r=hash(x,y,10+i);if(r<.45)continue;const p=v(x+.15+hash(x,y,20+i)*.7,y+.15+hash(x,y,30+i)*.7);floorG.fillStyle(r>.8?0x6b6258:0x2a2520,.8).fillEllipse(p.x,p.y,2+r*4,1.5+r*2);}}
  // Rock, row by row (x + y), back to front.
  // Only rock by a passage stands up; the deep rock is the flat black under the fog. The standing rock is drawn in
  // pieces (one screen row, eight tiles along it) so the fog of war can hide what was never seen and dim what is
  // only remembered.
  const GROUP=8,groups=new Map();for(const t of tiles){if(!t.edge&&!t.island&&!t.border)continue;const r=t.x+t.y,key=`${r}:${Math.floor((t.x-t.y+size)/GROUP)}`;if(!groups.has(key))groups.set(key,{r,tiles:[]});groups.get(key).tiles.push(t);}
  const pieces=[];
  for(const {r,tiles:list} of [...groups.values()].sort((a,b)=>a.r-b.r)){
    const depth=gridToWorld(r/2+.5,r/2+.5).y,g=scene.add.graphics().setDepth(depth),shadeG=scene.add.graphics().setDepth(depth+.01).setVisible(false);objects.push(g,shadeG);
    pieces.push({g,shade:shadeG,tiles:list.map(t=>({x:t.x,y:t.y})),state:-1});
    for(const t of list){const {x,y}=t,h=height;
      const top=[v(x,y,h(x,y)),v(x+1,y,h(x+1,y)),v(x+1,y+1,h(x+1,y+1)),v(x,y+1,h(x,y+1))];
      // the faces towards the passages: rough rock, lit from the upper left
      for(const face of t.faces){const [a,b]=face==='east'?[[x+1,y],[x+1,y+1]]:[[x,y+1],[x+1,y+1]],ha=h(...a),hb=h(...b);
        const light=face==='south'?1:.7,A=v(...a),B=v(...b),at=(t,k)=>({x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t-(ha+(hb-ha)*t)*k});
        // the face is a few rough slabs of rock with dark cracks between them, darker towards the foot
        poly(g,[at(0,1),at(1,1),at(1,0),at(0,0)],0x1b1814);// a dark base under the slabs, so no seam lets the ground show
        const split=.3+hash(x,y,face==='east'?11:12)*.4,cuts=hash(x,y,face==='east'?13:14)<.45?[0,1]:[0,split,1];
        for(let i=0;i<cuts.length-1;i++){const t0=cuts[i],t1=cuts[i+1],tone=mix(mix(0x5d554b,0x463f37,hash(x,y,90+i+(face==='east'?3:0))),0x000000,1-light);
          const bend=(hash(x,y,100+i)-.5)*.08;poly(g,[at(t0,1),at(t1,1),at(t1+bend,.55),at(t1,0),at(t0,0),at(t0-bend,.5)],tone);
          poly(g,[at(t0,.3),at(t1,.3),at(t1,0),at(t0,0)],mix(tone,0x000000,.28));
          poly(g,[at(t0,1),at(t1,1),at(t1,.86),at(t0,.9)],mix(tone,0xffffff,.1*light));
          if(i){g.lineStyle(1.1,0x16130f,.7);let p=at(t0,0);for(const k of [.25,.5,.75,1]){const q=at(t0+(hash(x,y,110+i*7+k*4)-.5)*.07,k);g.lineBetween(p.x,p.y,q.x,q.y);p=q;}}}
        for(let i=0;i<5;i++){const t0=hash(x,y,50+i),k=.15+hash(x,y,60+i)*.75,P=at(t0,k);
          if(i<2){g.lineStyle(1,0x1a1612,.6).lineBetween(P.x,P.y,P.x+(hash(x,y,70+i)-.5)*8,P.y+2+hash(x,y,80+i)*3);}else g.fillStyle(mix(0x6f665b,0xffffff,.12*light),.55).fillEllipse(P.x,P.y,2+hash(x,y,120+i)*3,1.5+hash(x,y,130+i)*2);}
        const pts=[v(...a,ha),v(...b,hb),B,A];
        // a dark foot where the wall meets the floor
        g.lineStyle(2,0x15120f,.55).lineBetween(pts[3].x,pts[3].y,pts[2].x,pts[2].y);}
      // the borders of the map close in black
      if(t.border&&!t.faces.length){poly(g,[v(x+1,y,TALL),v(x+1,y+1,TALL),v(x+1,y+1),v(x+1,y)],0x050505);poly(g,[v(x,y+1,TALL),v(x+1,y+1,TALL),v(x+1,y+1),v(x,y+1)],0x050505);}
      if(t.island){// a free-standing rock: its rough top shows, lighter on the lit side
        poly(g,top,0x4a433b);poly(g,[top[0],top[1],{x:(top[0].x+top[2].x)/2,y:(top[0].y+top[2].y)/2},top[3]],0x5d554b);
        for(let i=0;i<3;i++){const P=v(x+.2+hash(x,y,140+i)*.6,y+.2+hash(x,y,150+i)*.6,height(x,y)*.9);g.fillStyle(i?0x2b2620:0x786e62,.7).fillEllipse(P.x,P.y,3+hash(x,y,160+i)*4,2+hash(x,y,170+i)*2);}}
      else poly(g,top,0x060606);
      // the remembered look: the same shapes darkened
      for(const face of t.faces){const [a,b]=face==='east'?[[x+1,y],[x+1,y+1]]:[[x,y+1],[x+1,y+1]];poly(shadeG,[v(...a,h(...a)),v(...b,h(...b)),v(...b),v(...a)],0x000000,.55);}
      if(t.island)poly(shadeG,top,0x000000,.55);
      // a thin rocky lip along the top where it overhangs a passage
      if(t.edge&&!t.island){g.lineStyle(1.5,0x3d3731,.9);for(const side of [...t.faces,...t.lip]){const [a,b]=side==='east'?[1,2]:side==='south'?[3,2]:side==='west'?[0,3]:[0,1];g.lineBetween(top[a].x,top[a].y,top[b].x,top[b].y);}}
    }
  }
  const decor=caveDecor(scene,isWall,size,options.keep??[]);objects.push(...decor.map(d=>d.g));
  let seen=-1;
  // Fog of war: unexplored rock and stones stay hidden, remembered ones are dimmed, those in sight show as they are.
  const update=()=>{const fog=scene.fog,rev=fog?`${fog.enabled}:${fog.revision}:${fog.explorationEnabled}`:'none';if(rev===seen)return;seen=rev;
    const state=tile=>fog?.displayState?.(tile)??2,best=list=>list.reduce((m,t)=>Math.max(m,state(t)),0);
    for(const p of pieces){const s=best(p.tiles);if(s===p.state)continue;p.state=s;p.g.setVisible(s>0);p.shade.setVisible(s===1);}
    for(const d of decor){const s=state(d.tile);d.g.setVisible(s>0).setAlpha(s===1?.5:1);}};
  update();
  return {objects,update,destroy:()=>objects.forEach(o=>o.destroy?.())};
}

// Loose rocks on the cave floor that do not block the way: boulders, stalagmites, rubble, a puddle now and then.
function caveDecor(scene,isWall,size,keep){
  const out=[],free=(x,y)=>!isWall(x,y)&&keep.every(k=>Math.max(Math.abs(k.x-x),Math.abs(k.y-y))>1);
  for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){const r=hash(x,y,300);if(r>.085||!free(x,y))continue;
    const kind=hash(x,y,301),p=gridToWorld(x+.25+hash(x,y,302)*.5,y+.25+hash(x,y,303)*.5),g=scene.add.graphics();out.push({g,tile:{x,y}});
    const wallBy=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>isWall(x+dx,y+dy));
    if(kind<.32){// a boulder: a few rounded lumps
      const w=10+hash(x,y,304)*10;g.fillStyle(0x000000,.22).fillEllipse(p.x+3,p.y+1,w*1.5,w*.55);
      g.fillStyle(0x4e473f,1).fillEllipse(p.x,p.y-w*.42,w*1.3,w*.95).fillStyle(0x625a50,1).fillEllipse(p.x-w*.2,p.y-w*.58,w*.85,w*.6).fillStyle(0x3a352f,1).fillEllipse(p.x+w*.35,p.y-w*.3,w*.6,w*.5);
      g.lineStyle(1,0x1d1a16,.7).lineBetween(p.x-w*.1,p.y-w*.7,p.x+w*.05,p.y-w*.35);}
    else if(kind<.6||wallBy&&kind<.75){// stalagmites, one tall with a smaller beside it
      const tall=16+hash(x,y,305)*20;g.fillStyle(0x000000,.2).fillEllipse(p.x+3,p.y,16,6);
      for(const [dx,h,w] of [[0,tall,7],[7,tall*.55,5],[-6,tall*.4,4]]){g.fillStyle(0x534b42,1).fillTriangle(p.x+dx-w,p.y,p.x+dx+w,p.y,p.x+dx+w*.15,p.y-h);g.fillStyle(0x6c6357,1).fillTriangle(p.x+dx-w,p.y,p.x+dx,p.y,p.x+dx+w*.15,p.y-h);g.fillStyle(0x3b352f,1).fillEllipse(p.x+dx,p.y,w*2,w*.7);}}
    else if(kind<.88){// rubble
      for(let i=0;i<6;i++){const ox=(hash(x,y,310+i)-.5)*22,oy=(hash(x,y,320+i)-.5)*9,w=3+hash(x,y,330+i)*5;g.fillStyle(i%2?0x5b534a:0x433d36,1).fillEllipse(p.x+ox,p.y+oy-w*.3,w*1.3,w*.9);}}
    else{// a still puddle
      g.fillStyle(0x1d2a30,.85).fillEllipse(p.x,p.y,26,10).fillStyle(0x4f6b78,.35).fillEllipse(p.x-4,p.y-1,10,3);}
    g.setDepth(p.y-2);}
  return out;
}
