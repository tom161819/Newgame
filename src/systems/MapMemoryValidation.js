import { COLUMNS,ROWS } from '../game/config.js';

export function validateMapMemory(data,registry,{check,number,integer,array}){
  check(data&&data.version===1);const size=COLUMNS*ROWS;
  check(Object.keys(data).every(key=>['version','explored','terrain','objects'].includes(key)));
  array(data.explored,size);const explored=new Set(data.explored);check(explored.size===data.explored.length);
  for(const index of explored)integer(index,0,size-1);
  array(data.terrain,size);check(data.terrain.length===explored.size);const tiles=new Set();
  for(const pair of data.terrain){
    array(pair,2);check(pair.length===2);const [index,value]=pair;integer(index,0,size-1);check(explored.has(index)&&!tiles.has(index));tiles.add(index);
    array(value,5);check(value.length===5);integer(value[0],0,1);integer(value[1],0,3);check(['Spring','Summer','Autumn','Winter'].includes(value[2]));integer(value[3],0,255);integer(value[4],0,1);
  }
  array(data.objects,30000);const keys=new Set();
  for(const entry of data.objects){
    check(entry&&['building','resource','chest','drop','stockpile'].includes(entry.kind));
    check(Object.keys(entry).every(key=>['key','kind','type','x','y','width','height','visual'].includes(key)));
    check(typeof entry.key==='string'&&entry.key.startsWith(entry.kind+':')&&entry.key.length<=256&&!keys.has(entry.key));keys.add(entry.key);
    const d=registry.get(entry.type);check(d&&!['character','animal'].includes(d.category));
    if(entry.kind==='building')check(d.category==='building');
    if(['resource','drop'].includes(entry.kind))check(d.category==='resource');
    if(entry.kind==='chest')check(!!d.treasure);
    if(entry.kind==='drop')check(d.collectible);
    if(entry.kind==='stockpile')check(entry.type==='starter_stockpile');
    integer(entry.width,1,COLUMNS);integer(entry.height,1,ROWS);
    check(entry.width===(entry.kind==='stockpile'?1:d.width)&&entry.height===(entry.kind==='stockpile'?1:d.height));
    integer(entry.x,0,COLUMNS-entry.width);integer(entry.y,0,ROWS-entry.height);
    let discovered=false;for(let y=0;y<entry.height;y++)for(let x=0;x<entry.width;x++)if(explored.has((entry.y+y)*COLUMNS+entry.x+x))discovered=true;check(discovered);
    const v=entry.visual;check(v&&typeof v==='object'&&!Array.isArray(v));
    const allowed=entry.kind==='building'?['construction','connections','stage','season']:entry.kind==='chest'?['opened','lid']:entry.kind==='stockpile'?['id']:d.tree?['stage','season']:d.deposit?['depleted']:[];
    check(Object.keys(v).every(key=>allowed.includes(key)));
    if(v.construction){const c=v.construction;check(entry.kind==='building'&&['planned','building','complete'].includes(c.state));number(c.progress,0,100);number(c.workDone);check(Object.keys(c).every(key=>['state','progress','workDone'].includes(key)));}
    if(v.connections){check(d.id==='wall'&&typeof v.connections==='object'&&!Array.isArray(v.connections));for(const [key,value]of Object.entries(v.connections))check(['N','E','S','W'].includes(key)&&typeof value==='boolean');}
    if(d.crop||d.tree){integer(v.stage,0,3);check(['Spring','Summer','Autumn','Winter'].includes(v.season));}else check(v.stage===undefined&&v.season===undefined);
    if(d.deposit)check(typeof v.depleted==='boolean');
    if(entry.kind==='chest'){check(typeof v.opened==='boolean');if(v.lid){number(v.lid.y,-100,100);number(v.lid.rotation,-Math.PI,Math.PI);check(Object.keys(v.lid).every(key=>['y','rotation'].includes(key)));}}
    if(entry.kind==='stockpile')check(typeof v.id==='string'&&v.id.length>0&&v.id.length<=256);
  }
}
