// Procedural cobblestones for one isometric tile (64×32 diamond centred at cx, cy). Stones sit on a grid that runs across
// tile borders in world coordinates, so neighbouring paved tiles join into one surface without a repeated pattern;
// `edges` (N, E, S, W without paving) get a darker kerb of stones. Used by the terrain layer and by blueprints.
const hash=(x,y,s)=>{let h=(x*374761393+y*668265263+s*69069)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
export function drawCobbles(context,cx,cy,{seed=0,tileX=0,tileY=0,edges={},tint=null,winter=false}={}){
  context.save();
  context.beginPath();context.moveTo(cx-32,cy);context.lineTo(cx,cy-16);context.lineTo(cx+32,cy);context.lineTo(cx,cy+16);context.closePath();context.clip();
  context.fillStyle=tint!=null?`#${tint.toString(16).padStart(6,'0')}`:winter?'#7d7b72':'#6f6a5d';context.fillRect(cx-33,cy-17,66,34);
  // Four rows by four columns of stones in tile space, slightly jittered, mapped to the diamond.
  const toScreen=(u,v)=>({x:cx+(u-v)*32,y:cy-16+(u+v)*16});
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const gx=tileX*4+col,gy=tileY*4+row,r=hash(gx,gy,seed),g=hash(gy,gx,seed+3);
    const u=(col+.5+(r-.5)*.25)/4,v=(row+.5+(g-.5)*.25)/4,p=toScreen(u,v),w=6.2+r*1.6,h=3.1+g*.9;
    // Muted grey stone with a slight warm or cool cast per stone, never a colour of its own.
    const tone=Math.round(128+r*42),warm=Math.round((g-.5)*10),shade=winter?[200,198,190]:[tone+warm,tone+Math.round(warm/3),tone-8-Math.round(warm/2)];
    context.fillStyle=tint!=null?`rgba(255,255,255,.35)`:`rgb(${shade.join(',')})`;
    context.beginPath();context.ellipse(p.x,p.y,w,h,0,0,Math.PI*2);context.fill();
    context.strokeStyle='rgba(60,56,46,.55)';context.lineWidth=.8;context.stroke();
    context.fillStyle='rgba(255,255,255,.12)';context.beginPath();context.ellipse(p.x-1,p.y-1,w*.5,h*.4,0,0,Math.PI*2);context.fill();
  }
  // Kerb along open edges: a dark line of stones on that side of the diamond.
  context.strokeStyle='rgba(52,48,40,.85)';context.lineWidth=2.2;
  const side=(a,b)=>{context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);context.stroke();};
  const top={x:cx,y:cy-16},right={x:cx+32,y:cy},bottom={x:cx,y:cy+16},left={x:cx-32,y:cy};
  if(edges.N)side(left,top);if(edges.E)side(top,right);if(edges.S)side(right,bottom);if(edges.W)side(bottom,left);
  context.restore();
}
