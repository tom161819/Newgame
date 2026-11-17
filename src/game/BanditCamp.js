// Owner 17 Nov 2026: the bandit camp is a lived-in place – tents round a fire with a cauldron on a tripod, log seats,
// crates and barrels, a weapon rack, bedrolls, the chief's tent with a banner. Drawn here (provisional art until the
// owner approves Studio art); the layout comes from shapeZoneWorld (feature.camp). Nothing here blocks the way.
import { gridToWorld } from './isometric.js';

const shade=(color,f)=>{const r=Math.min(255,Math.round(((color>>16)&255)*f)),g=Math.min(255,Math.round(((color>>8)&255)*f)),b=Math.min(255,Math.round((color&255)*f));return (r<<16)|(g<<8)|b;};
const pt=(x,y,lift=0)=>{const p=gridToWorld(x,y);return {x:p.x,y:p.y-lift};};
const LIGHT={x:-.8,y:-.6};// grid direction the light comes from (screen upper left)

function poly(g,points,color,alpha=1){g.fillStyle(color,alpha);g.beginPath();g.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))g.lineTo(p.x,p.y);g.closePath();g.fillPath();}

export function drawTent(scene,tent){
  const big=tent.chief,L=big?1.9:1.5,W=big?1.45:1.1,H=big?44:34,u={x:Math.cos(tent.angle),y:Math.sin(tent.angle)},v={x:-u.y,y:u.x};
  const at=(a,b,lift=0)=>pt(tent.x+u.x*a+v.x*b,tent.y+u.y*a+v.y*b,lift);
  const fl=at(L/2,W/2),fr=at(L/2,-W/2),bl=at(-L/2,W/2),br=at(-L/2,-W/2),rf=at(L/2+.06,0,H),rb=at(-L/2-.06,0,H);
  const base=big?0x8a4a34:0xb7a07a,g=scene.add.graphics();
  const lit=n=>.68+.42*Math.max(0,-(n.x*LIGHT.x+n.y*LIGHT.y));
  // shadow
  const sh=[at(L/2+.1,W/2+.25),at(L/2+.1,-W/2-.25),at(-L/2-.1,-W/2-.25),at(-L/2-.1,W/2+.25)].map(p=>({x:p.x+6,y:p.y+3}));poly(g,sh,0x000000,.18);
  const faces=[
    {pts:[fl,bl,rb,rf],color:shade(base,lit(v)),stripe:true},
    {pts:[fr,br,rb,rf],color:shade(base,lit({x:-v.x,y:-v.y})),stripe:true},
    {pts:[fl,fr,rf],color:shade(base,lit(u)*.95),door:true},
    {pts:[bl,br,rb],color:shade(base,lit({x:-u.x,y:-u.y})*.95)}];
  faces.sort((a,b)=>a.pts.reduce((n,p)=>n+p.y,0)/a.pts.length-b.pts.reduce((n,p)=>n+p.y,0)/b.pts.length);
  for(const f of faces){poly(g,f.pts,f.color);
    if(f.stripe){const [a,b,c,d]=f.pts;g.lineStyle(1,shade(f.color,.78),.8);for(const t of big?[.2,.4,.6,.8]:[.33,.66]){const p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},q={x:d.x+(c.x-d.x)*t,y:d.y+(c.y-d.y)*t};g.lineBetween(p.x,p.y,q.x,q.y);}
      // a sewn patch
      const m=(x,y)=>({x:a.x+(b.x-a.x)*x+(d.x-a.x)*y,y:a.y+(b.y-a.y)*x+(d.y-a.y)*y});poly(g,[m(.55,.3),m(.72,.32),m(.7,.52),m(.54,.5)],shade(f.color,.86));}
    if(f.door){const [a,b,c]=f.pts,mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};poly(g,[{x:mid.x+(a.x-mid.x)*.55,y:mid.y+(a.y-mid.y)*.55},{x:mid.x+(b.x-mid.x)*.55,y:mid.y+(b.y-mid.y)*.55},{x:mid.x+(c.x-mid.x)*.62,y:mid.y+(c.y-mid.y)*.62}],0x1d140e,.92);
      g.lineStyle(1.2,shade(f.color,.7),1).lineBetween(mid.x+(c.x-mid.x)*.62,mid.y+(c.y-mid.y)*.62,mid.x+(a.x-mid.x)*.75,mid.y+(a.y-mid.y)*.75);}
    g.lineStyle(1,shade(base,.45),.9);g.strokePoints([...f.pts,f.pts[0]]);}
  // ridge pole ends, guy ropes and pegs
  g.lineStyle(2,0x4a3220,1).lineBetween(rf.x,rf.y,rf.x,rf.y-4).lineBetween(rb.x,rb.y,rb.x,rb.y-4);
  for(const [r,a] of [[rf,L/2+.55],[rb,-L/2-.55]]){const peg=at(a,0);g.lineStyle(1,0xd9cfb0,.7).lineBetween(r.x,r.y,peg.x,peg.y);g.fillStyle(0x3b2a1a,1).fillRect(peg.x-1,peg.y-2,2,3);}
  if(big){const top={x:rb.x,y:rb.y-30};g.lineStyle(2,0x3b2a1a,1).lineBetween(rb.x,rb.y,top.x,top.y);poly(g,[top,{x:top.x+18,y:top.y+3},{x:top.x+15,y:top.y+8},{x:top.x+18,y:top.y+13},{x:top.x,y:top.y+12}],0x7a1c18);
    g.lineStyle(1.5,0x161616,1).lineBetween(top.x+3,top.y+4,top.x+12,top.y+9).lineBetween(top.x+12,top.y+4,top.x+3,top.y+9);}
  return g.setDepth(Math.max(fl.y,fr.y,bl.y,br.y)-2);
}

function drawLog(scene,s){const a=pt(s.x+Math.cos(s.angle)*.42,s.y+Math.sin(s.angle)*.42),b=pt(s.x-Math.cos(s.angle)*.42,s.y-Math.sin(s.angle)*.42),g=scene.add.graphics();
  g.fillStyle(0x000000,.16).fillEllipse((a.x+b.x)/2+3,(a.y+b.y)/2+3,Math.abs(a.x-b.x)+16,10);
  g.lineStyle(9,0x5c3d22,1).lineBetween(a.x,a.y-4,b.x,b.y-4).lineStyle(3,0x7a5532,1).lineBetween(a.x,a.y-7,b.x,b.y-7);
  for(const e of [a,b])g.fillStyle(0xb48a5a,1).fillEllipse(e.x,e.y-4,7,9).fillStyle(0x8a6440,1).fillEllipse(e.x,e.y-4,3,4);
  return g.setDepth(Math.max(a.y,b.y));}

function drawCrate(scene,c){const g=scene.add.graphics(),p=pt(c.x,c.y);
  g.fillStyle(0x000000,.18).fillEllipse(p.x+4,p.y+2,24,10);
  if(c.kind==='crate'){const h=14,w=11,d=6;poly(g,[{x:p.x-w,y:p.y-d/2},{x:p.x,y:p.y+d/2},{x:p.x,y:p.y+d/2-h},{x:p.x-w,y:p.y-d/2-h}],0x8a6036);poly(g,[{x:p.x,y:p.y+d/2},{x:p.x+w,y:p.y-d/2},{x:p.x+w,y:p.y-d/2-h},{x:p.x,y:p.y+d/2-h}],0x6e4b2a);
    poly(g,[{x:p.x-w,y:p.y-d/2-h},{x:p.x,y:p.y+d/2-h},{x:p.x+w,y:p.y-d/2-h},{x:p.x,y:p.y-d*1.5-h}],0xa77a48);g.lineStyle(1,0x3e2a17,.9).lineBetween(p.x-w,p.y-d/2-h/2,p.x,p.y+d/2-h/2).lineBetween(p.x,p.y+d/2-h/2,p.x+w,p.y-d/2-h/2);}
  else if(c.kind==='barrel'){g.fillStyle(0x6b4628,1).fillRect(p.x-7,p.y-17,14,15).fillEllipse(p.x,p.y-2,14,6);g.fillStyle(0x8a5e36,1).fillEllipse(p.x,p.y-17,14,6);g.lineStyle(1.5,0x2e2a26,1).lineBetween(p.x-7,p.y-13,p.x+7,p.y-13).lineBetween(p.x-7,p.y-6,p.x+7,p.y-6);}
  else{g.fillStyle(0xc2ad7c,1).fillEllipse(p.x,p.y-6,16,14).fillEllipse(p.x,p.y-13,9,6);g.lineStyle(1,0x7c6a45,1).lineBetween(p.x-3,p.y-15,p.x+3,p.y-15);}
  return g.setDepth(p.y);}

function drawRack(scene,r){const g=scene.add.graphics(),u={x:Math.cos(r.angle)*.45,y:Math.sin(r.angle)*.45},a=pt(r.x+u.x,r.y+u.y),b=pt(r.x-u.x,r.y-u.y);
  g.fillStyle(0x000000,.15).fillEllipse((a.x+b.x)/2+4,(a.y+b.y)/2+2,Math.abs(a.x-b.x)+14,8);
  g.lineStyle(3,0x4f3520,1).lineBetween(a.x,a.y,a.x,a.y-24).lineBetween(b.x,b.y,b.x,b.y-24).lineBetween(a.x,a.y-20,b.x,b.y-20);
  for(const t of [.2,.45,.7]){const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;g.lineStyle(1.5,0x6b4a2a,1).lineBetween(x-4,y+1,x+3,y-34);g.fillStyle(0xb9bec4,1).fillTriangle(x+3,y-34,x+1,y-41,x+5,y-38);}
  g.fillStyle(0x8f9499,1).fillEllipse(b.x+(a.x-b.x)*.88,b.y+(a.y-b.y)*.88-8,9,12);// a round shield hung on the post
  return g.setDepth(Math.max(a.y,b.y));}

function drawBedroll(scene,b){const g=scene.add.graphics(),u={x:Math.cos(b.angle),y:Math.sin(b.angle)},v={x:-u.y,y:u.x},at=(x,y)=>pt(b.x+u.x*x+v.x*y,b.y+u.y*x+v.y*y);
  poly(g,[at(.55,.22),at(.55,-.22),at(-.55,-.22),at(-.55,.22)],0x5e2f2a);poly(g,[at(.55,.22),at(.55,-.22),at(.3,-.22),at(.3,.22)],0xc9b98f);
  g.lineStyle(1,0x3a1c18,.8).strokePoints([at(.55,.22),at(.55,-.22),at(-.55,-.22),at(-.55,.22),at(.55,.22)]);return g.setDepth(at(0,0).y-6);}

// The fire: a ring of stones, crossed logs, a flickering flame and glow, a tripod with a cauldron, smoke and steam.
function drawFire(scene,f,random){
  const p=pt(f.x,f.y),ground=scene.add.graphics().setDepth(p.y-8);
  ground.fillStyle(0x2a2420,.55).fillEllipse(p.x,p.y,40,20);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;ground.fillStyle(i%3?0x7d7a74:0x6a6762,1).fillEllipse(p.x+Math.cos(a)*19,p.y+Math.sin(a)*9.5,8,5.5);}
  ground.lineStyle(5,0x3d2717,1).lineBetween(p.x-11,p.y+3,p.x+10,p.y-4).lineBetween(p.x-9,p.y-4,p.x+11,p.y+3);
  const glow=scene.add.graphics().setDepth(p.y-7).setBlendMode?.(1)??null;const flame=scene.add.graphics().setDepth(p.y+1);
  const pot=scene.add.graphics().setDepth(p.y+2);
  // tripod and cauldron
  const apex={x:p.x,y:p.y-50};pot.lineStyle(2.5,0x2c2118,1);for(const [dx,dy] of [[-22,4],[20,6],[2,-12]])pot.lineBetween(p.x+dx,p.y+dy,apex.x,apex.y);
  pot.lineStyle(1,0x1a1a1a,1).lineBetween(apex.x,apex.y,apex.x,apex.y+20);pot.fillStyle(0x1c1c1e,1).fillEllipse(p.x,p.y-20,22,17);pot.fillStyle(0x2e2e30,1).fillEllipse(p.x,p.y-27,20,6);pot.fillStyle(0x6b5a2e,1).fillEllipse(p.x,p.y-27,15,4);
  pot.lineStyle(1,0x5b5b60,.9).strokeEllipse(p.x-3,p.y-19,8,6);
  const draw=()=>{if(!flame.active)return;flame.clear();glow?.clear?.();const k=.8+random()*.4;
    glow?.fillStyle?.(0xffa040,.05+.04*random()).fillEllipse(p.x,p.y-6,96*k,46*k).fillStyle?.(0xffb050,.07+.05*random()).fillEllipse(p.x,p.y-4,50*k,24*k);
    for(const [w,h,c,o] of [[16,22,0xd9451c,0],[11,17,0xf28a22,2],[6,11,0xffd25a,4]]){const hh=h*k,sx=(random()-.5)*3;flame.fillStyle(c,.95).fillTriangle(p.x-w/2+sx,p.y-o,p.x+w/2+sx,p.y-o,p.x+sx*2,p.y-o-hh).fillEllipse(p.x+sx,p.y-o,w,w*.55);}};
  draw();
  const puff=(x,y,color,alpha,rise)=>{const c=scene.add.circle?.(x,y,3,color,alpha);if(!c)return;c.setDepth(p.y+3);scene.tweens?.add?.({targets:c,y:y-rise,x:x+(random()-.5)*14,scale:3,alpha:0,duration:2400+random()*900,onComplete:()=>c.destroy()});};
  let n=0;const timer=scene.time?.addEvent?.({delay:100,loop:true,callback:()=>{draw();n++;if(n%5===0)puff(p.x+(random()-.5)*6,p.y-34,0x8c8c8c,.35,46);if(n%9===0)puff(p.x+(random()-.5)*8,p.y-30,0xf2f2f2,.3,28);}});
  return [ground,glow,flame,pot,timer].filter(Boolean);
}

export function createBanditCamp(scene,camp,random=Math.random){
  if(!camp||!scene?.add)return [];
  const out=[...drawFire(scene,camp.fire,random)];
  for(const tent of camp.tents??[])out.push(drawTent(scene,tent));
  for(const s of camp.seats??[])out.push(drawLog(scene,s));
  for(const c of camp.crates??[])out.push(drawCrate(scene,c));
  if(camp.rack)out.push(drawRack(scene,camp.rack));
  for(const b of camp.bedrolls??[])out.push(drawBedroll(scene,b));
  return out;
}
