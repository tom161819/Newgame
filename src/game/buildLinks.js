import { buildingDefinition,buildingIsComplete } from './buildings.js';
import { OUTPUT_PILES } from '../data/logistics.js';
import { gridToWorld } from './isometric.js';

// m-navaznosti (point 44, owner 14 Nov 2026): "Show links" in the Buildings panel. While a blueprint is being placed,
// thin lines run from it to the buildings it will work with: where its workers take what they need (orange) and
// where what they make is carried (blue). The nearest store or producer of each good is shown.
export const LINK_COLORS=Object.freeze({input:0xf2a24a,output:0x6fb7ff});
const KEY='newgame.buildLinks';
export const linksEnabled=(storage=globalThis.localStorage)=>{try{return storage?.getItem(KEY)==='1';}catch{return false;}};
export const setLinksEnabled=(value,storage=globalThis.localStorage)=>{try{storage?.setItem(KEY,value?'1':'0');}catch{}};
const centre=(b,d)=>({x:b.x+d.width/2,y:b.y+d.height/2});
export function goodsOf(definition){
  const recipes=[definition.recipe,...Object.values(definition.recipes??{})].filter(Boolean),input=new Set(),output=new Set();
  for(const r of recipes){for(const id of Object.keys(r.input??{}))input.add(id);for(const id of Object.keys(r.output??{}))output.add(id);}
  if(OUTPUT_PILES[definition.id])output.add(OUTPUT_PILES[definition.id]);
  for(const id of definition.produces??[])output.add(id);
  return {input:[...input],output:[...output]};
}
// Links of a blueprint at `anchor`: [{kind:'input'|'output', resource, from:{x,y}, to:{x,y}, buildingId}] in tile units.
export function buildLinks(scene,definition,anchor){
  if(!definition||!anchor)return [];const goods=goodsOf(definition),here=centre(anchor,definition),links=[],storage=scene.foodStorage;
  const done=(scene.buildings??[]).filter(b=>buildingIsComplete(b)),near=list=>list.map(b=>({b,c:centre(b,buildingDefinition(b))})).sort((p,q)=>Math.hypot(p.c.x-here.x,p.c.y-here.y)-Math.hypot(q.c.x-here.x,q.c.y-here.y))[0];
  const stores=resource=>done.filter(b=>[...(storage?.locations.values()??[])].some(l=>l.buildingId===b.id&&storage.isStock(l)&&l.allowed.includes(resource)));
  const makers=resource=>done.filter(b=>goodsOf(buildingDefinition(b)).output.includes(resource));
  const users=resource=>done.filter(b=>goodsOf(buildingDefinition(b)).input.includes(resource));
  const add=(kind,resource,hit)=>{if(hit&&!links.some(l=>l.kind===kind&&l.buildingId===hit.b.id))links.push({kind,resource,from:here,to:hit.c,buildingId:hit.b.id});};
  for(const resource of goods.input){add('input',resource,near(stores(resource)));add('input',resource,near(makers(resource)));}
  for(const resource of goods.output){add('output',resource,near(stores(resource)));add('output',resource,near(users(resource)));}
  return links;
}
export function drawBuildLinks(graphics,links,zoom=1){
  graphics.clear();
  for(const l of links){const a=gridToWorld(l.from.x,l.from.y),b=gridToWorld(l.to.x,l.to.y);graphics.lineStyle(2/zoom,LINK_COLORS[l.kind],.9).lineBetween(a.x,a.y,b.x,b.y);graphics.fillStyle(LINK_COLORS[l.kind],.95).fillCircle(b.x,b.y,4/zoom);}
}
