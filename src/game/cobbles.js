// Procedural cobblestones for one isometric tile (64×32 diamond centred at cx, cy). Stones sit on a grid that runs across
// tile borders in world coordinates, so neighbouring paved tiles join into one surface without a repeated pattern;
// `edges` (N, E, S, W without paving) end in loose kerb stones that reach a little over the grass or the path dirt
// (owner 15 Nov 2026: the edge must not look cut with a ruler). Used by the terrain layer and by blueprints.
const hash=(x,y,s)=>{let h=(x*374761393+y*668265263+s*69069)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
const NORMAL=Object.freeze({N:[-.4472,-.8944],E:[.4472,-.8944],S:[.4472,.8944],W:[-.4472,.8944]});
// JOIN_BLEED: a side with paving behind it reaches a little over, so no hairline of ground shows between tiles drawn
// on different ground chunks.
const EDGE_INSET=2.5,EDGE_STONES=5,JOIN_BLEED=.8;
// Where two lines (point + direction) cross.
const cross=(p,d,q,e)=>{const k=d.x*e.y-d.y*e.x,t=((q.x-p.x)*e.y-(q.y-p.y)*e.x)/k;return {x:p.x+d.x*t,y:p.y+d.y*t};};
export function drawCobbles(context,cx,cy,{seed=0,tileX=0,tileY=0,edges={},tint=null,winter=false}={}){
  const top={x:cx,y:cy-16},right={x:cx+32,y:cy},bottom={x:cx,y:cy+16},left={x:cx-32,y:cy};
  // The four sides in order; an open side is pulled in a little so the mortar does not end in a straight line.
  const sides=[['N',left,top],['E',top,right],['S',right,bottom],['W',bottom,left]].map(([id,a,b])=>{const n=NORMAL[id],k=edges[id]?EDGE_INSET:-JOIN_BLEED;return {id,a,b,p:{x:a.x-n[0]*k,y:a.y-n[1]*k},d:{x:b.x-a.x,y:b.y-a.y}};});
  const corners=sides.map((side,i)=>{const before=sides[(i+3)%4];return cross(before.p,before.d,side.p,side.d);});
  context.save();
  context.beginPath();corners.forEach((c,i)=>i?context.lineTo(c.x,c.y):context.moveTo(c.x,c.y));context.closePath();context.clip();
  context.fillStyle=tint!=null?`#${tint.toString(16).padStart(6,'0')}`:winter?'#7d7b72':'#6f6a5d';context.fillRect(cx-35,cy-19,70,38);
  // Four rows by four columns of stones in tile space, slightly jittered, mapped to the diamond.
  const toScreen=(u,v)=>({x:cx+(u-v)*32,y:cy-16+(u+v)*16});
  const colour=(r,g)=>{const tone=Math.round(128+r*42),warm=Math.round((g-.5)*10),shade=winter?[200,198,190]:[tone+warm,tone+Math.round(warm/3),tone-8-Math.round(warm/2)];return `rgb(${shade.join(',')})`;};
  const stone=(x,y,w,h,r,g,turn=0)=>{
    // Muted grey stone with a slight warm or cool cast per stone, never a colour of its own.
    context.fillStyle=tint!=null?`rgba(255,255,255,.35)`:colour(r,g);
    context.beginPath();context.ellipse(x,y,w,h,turn,0,Math.PI*2);context.fill();
    context.strokeStyle='rgba(60,56,46,.55)';context.lineWidth=.8;context.stroke();
    context.fillStyle='rgba(255,255,255,.12)';context.beginPath();context.ellipse(x-1,y-1,w*.5,h*.4,turn,0,Math.PI*2);context.fill();
  };
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const gx=tileX*4+col,gy=tileY*4+row,r=hash(gx,gy,seed),g=hash(gy,gx,seed+3);
    const u=(col+.5+(r-.5)*.25)/4,v=(row+.5+(g-.5)*.25)/4,p=toScreen(u,v);stone(p.x,p.y,6.2+r*1.6,3.1+g*.9,r,g);
  }
  context.restore();
  // Loose kerb stones along every open side, not clipped: each sits a little in or out of the tile, has its own size
  // and a soft shadow on the ground, so the paving ends unevenly and overlaps the grass or the dirt by a few pixels.
  for(const [i,side] of sides.entries()){
    if(!edges[side.id])continue;const n=NORMAL[side.id];
    for(let k=0;k<EDGE_STONES;k++){
      const r=hash(tileX*8+k,tileY*8+i,seed+11),g=hash(tileY*8+k,tileX*8+i,seed+17),q=hash(tileX*8+i,tileY*8+k,seed+23);
      if(q>.86)continue;/* a gap now and then */const t=(k+.5+(r-.5)*.7)/EDGE_STONES,out=-2+g*g*6,x=side.a.x+side.d.x*t+n[0]*out,y=side.a.y+side.d.y*t+n[1]*out,w=4+q*3,h=2.5+r*1.4,turn=Math.atan2(side.d.y,side.d.x)*.18+(q-.5)*.3;
      context.fillStyle='rgba(30,28,22,.3)';context.beginPath();context.ellipse(x+.4,y+1.3,w,h,turn,0,Math.PI*2);context.fill();
      stone(x,y,w,h,r*.75,g,turn);
    }
  }
}
