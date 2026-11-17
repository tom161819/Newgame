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
  const height=(vx,vy)=>floor(vx-1,vy-1)?LOW+hash(vx,vy,3)*4:TALL+(hash(vx,vy,1)-.5)*12;
  const tiles=[];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){if(!wall(x,y))continue;
    tiles.push({x,y,edge:near(x,y),faces:[floor(x+1,y)?'east':null,floor(x,y+1)?'south':null].filter(Boolean),lip:[floor(x-1,y)?'west':null,floor(x,y-1)?'north':null].filter(Boolean),border:x===size-1||y===size-1});}
  return {tiles,height};
}

function poly(g,pts,color,alpha=1){g.fillStyle(color,alpha);g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))g.lineTo(p.x,p.y);g.closePath();g.fillPath();}

export function createDungeonView(scene,isWall){
  const size=scene.map.length,{tiles,height}=dungeonShapes((x,y)=>x<0||y<0||x>=size||y>=size||isWall(x,y),size);
  const v=(x,y,h=0)=>{const p=gridToWorld(x,y);return {x:p.x,y:p.y-h};},objects=[];
  // The cave floor under everything that stands on it.
  const floorG=scene.add.graphics().setDepth(-60);objects.push(floorG);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){if(isWall(x,y))continue;
    let dark=0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(x+dx<0||y+dy<0||x+dx>=size||y+dy>=size||isWall(x+dx,y+dy))dark+=.12;
    const base=mix(mix(0x463f37,0x3e3832,hash(x,y,5)),0x1c1915,Math.min(.45,dark));poly(floorG,[v(x,y),v(x+1,y),v(x+1,y+1),v(x,y+1)],base);
    for(let i=0;i<3;i++){const r=hash(x,y,10+i);if(r<.45)continue;const p=v(x+.15+hash(x,y,20+i)*.7,y+.15+hash(x,y,30+i)*.7);floorG.fillStyle(r>.8?0x6b6258:0x2a2520,.8).fillEllipse(p.x,p.y,2+r*4,1.5+r*2);}}
  // Rock, row by row (x + y), back to front.
  const rows=new Map();for(const t of tiles){const r=t.x+t.y;if(!rows.has(r))rows.set(r,[]);rows.get(r).push(t);}
  for(const [r,list] of [...rows].sort((a,b)=>a[0]-b[0])){
    const g=scene.add.graphics().setDepth(gridToWorld(r/2+.5,r/2+.5).y);objects.push(g);
    for(const t of list){const {x,y}=t,h=height;
      const top=[v(x,y,h(x,y)),v(x+1,y,h(x+1,y)),v(x+1,y+1,h(x+1,y+1)),v(x,y+1,h(x,y+1))];
      // the faces towards the passages: rough rock, lit from the upper left
      for(const face of t.faces){const [a,b]=face==='east'?[[x+1,y],[x+1,y+1]]:[[x,y+1],[x+1,y+1]],ha=h(...a),hb=h(...b);
        const light=face==='south'?1:.7,A=v(...a),B=v(...b),at=(t,k)=>({x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t-(ha+(hb-ha)*t)*k});
        // the face is a few rough slabs of rock with dark cracks between them, darker towards the foot
        poly(g,[at(0,1),at(1,1),at(1,0),at(0,0)],0x1b1814);// a dark base under the slabs, so no seam lets the ground show
        const cuts=[0,.3+hash(x,y,face==='east'?11:12)*.15,.62+hash(x,y,face==='east'?13:14)*.15,1];
        for(let i=0;i<3;i++){const t0=cuts[i],t1=cuts[i+1],tone=mix(mix(0x5d554b,0x463f37,hash(x,y,90+i+(face==='east'?3:0))),0x000000,1-light);
          const bend=(hash(x,y,100+i)-.5)*.08;poly(g,[at(t0,1),at(t1,1),at(t1+bend,.55),at(t1,0),at(t0,0),at(t0-bend,.5)],tone);
          poly(g,[at(t0,.3),at(t1,.3),at(t1,0),at(t0,0)],mix(tone,0x000000,.28));
          poly(g,[at(t0,1),at(t1,1),at(t1,.86),at(t0,.9)],mix(tone,0xffffff,.1*light));
          if(i){g.lineStyle(1.2,0x16130f,.85);let p=at(t0,0);for(const k of [.25,.5,.75,1]){const q=at(t0+(hash(x,y,110+i*7+k*4)-.5)*.07,k);g.lineBetween(p.x,p.y,q.x,q.y);p=q;}}}
        for(let i=0;i<5;i++){const t0=hash(x,y,50+i),k=.15+hash(x,y,60+i)*.75,P=at(t0,k);
          if(i<2){g.lineStyle(1,0x1a1612,.6).lineBetween(P.x,P.y,P.x+(hash(x,y,70+i)-.5)*8,P.y+2+hash(x,y,80+i)*3);}else g.fillStyle(mix(0x6f665b,0xffffff,.12*light),.55).fillEllipse(P.x,P.y,2+hash(x,y,120+i)*3,1.5+hash(x,y,130+i)*2);}
        const pts=[v(...a,ha),v(...b,hb),B,A];
        // a dark foot where the wall meets the floor
        g.lineStyle(2,0x15120f,.55).lineBetween(pts[3].x,pts[3].y,pts[2].x,pts[2].y);}
      // the borders of the map close in black
      if(t.border&&!t.faces.length){poly(g,[v(x+1,y,TALL),v(x+1,y+1,TALL),v(x+1,y+1),v(x+1,y)],0x050505);poly(g,[v(x,y+1,TALL),v(x+1,y+1,TALL),v(x+1,y+1),v(x,y+1)],0x050505);}
      poly(g,top,0x060606);
      // a thin rocky lip along the top where it overhangs a passage
      if(t.edge){g.lineStyle(1.5,0x3d3731,.9);for(const side of [...t.faces,...t.lip]){const [a,b]=side==='east'?[1,2]:side==='south'?[3,2]:side==='west'?[0,3]:[0,1];g.lineBetween(top[a].x,top[a].y,top[b].x,top[b].y);}}
    }
  }
  return objects;
}
