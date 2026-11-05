import test from 'node:test';
import assert from 'node:assert/strict';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { PlayerController } from '../src/game/PlayerController.js';
import { tileCenter } from '../src/game/map.js';
import { knownMap } from '../src/game/knownMap.js';
import { serializeOrder } from '../src/systems/GameStateSerializer.js';
import { t } from '../src/i18n/index.js';

const view=()=>({visible:true,setPosition(x,y){this.x=x;this.y=y;return this;},setDepth(d){this.depth=d;return this;},setVisible(v){this.visible=v;return this;},animate(){},setMounted(){}});
function world(walls=[]){
  const map=Array.from({length:100},()=>Array(100).fill(0));for(const [x,y]of walls)map[y][x]=1;
  const s={map,buildings:[],objectRegistry,resourceOccupancy:new Map(),statuses:[],marker:{visible:false,setVisible(v){this.visible=v;}},showMarker(){this.marker.visible=true;},setStatus(text){this.statuses.push(text);},updateBuildingUI(){}};
  s.player=view();Object.assign(s.player,tileCenter({x:5,y:20}));s.character=new PlayerController(s,s.player,{x:5,y:20});s.fog=new FogOfWarSystem(s.character,true);
  return s;
}
// Walk until the king stops, checking every tile he stands on; seen tiles enter the map memory as in the game (MapMemory).
function walk(s,frames=4000){const visited=[];for(let i=0;i<frames;i++){s.character.update(50);s.fog.update();for(const index of s.fog.visibleIndices)s.fog.explored[index]=1;visited.push({...s.character.tile});if(!s.character.order&&!s.character.nextTile&&!s.character.path.length)break;}return visited;}

test('the king can be sent to never-seen ground; the click reveals nothing about what lies there',()=>{
  const wall=world([[60,20]]),grass=world();
  for(const s of [wall,grass]){assert.equal(s.fog.isVisibleTile({x:60,y:20}),false);assert.equal(s.character.command({kind:'move',goal:{x:60,y:20},pickupKey:null,explore:true}),true);}
  assert.deepEqual(wall.statuses,grass.statuses);assert.deepEqual(wall.statuses,[t('status.toUnknown')]);
  assert.deepEqual(wall.character.path,grass.character.path,'the planned route ignores the hidden wall');
});

test('a hidden wall found on the way is walked around; the king never steps onto it',()=>{
  // A wall across the straight route at x=30 with a gap far to the south.
  const walls=[];for(let y=0;y<100;y++)if(y<34||y>36)walls.push([30,y]);
  const s=world(walls);s.character.command({kind:'move',goal:{x:50,y:20},pickupKey:null,explore:true});
  const visited=walk(s);
  assert.deepEqual(s.character.tile,{x:50,y:20});assert.ok(visited.every(tile=>s.map[tile.y][tile.x]===0),'never on a wall tile');
  assert.ok(visited.some(tile=>tile.x===30&&tile.y>=34&&tile.y<=36),'went through the real gap');
});

test('a destination that turns out to be enclosed stops the king with a clear status instead of a stuck order',()=>{
  const walls=[];for(let y=15;y<=25;y++)for(let x=55;x<=65;x++)if(x===55||x===65||y===15||y===25)walls.push([x,y]);
  const s=world(walls);s.character.command({kind:'move',goal:{x:60,y:20},pickupKey:null,explore:true});
  const visited=walk(s);
  assert.equal(s.character.order,null);assert.equal(s.character.path.length,0);assert.equal(s.marker.visible,false);
  assert.equal(s.statuses.at(-1),t('status.exploreBlocked'));assert.ok(visited.every(tile=>s.map[tile.y][tile.x]===0));
  assert.ok(Math.hypot(s.character.tile.x-60,s.character.tile.y-20)<12,'it went as far as it could see a way');
});

test('the known map keeps seen and remembered tiles, treats never-seen ones as open, and the order keeps its explore flag in saves',()=>{
  const s=world([[8,20],[60,20],[61,20]]);s.fog.explored[20*100+61]=1;const known=knownMap(s);
  assert.equal(known[20][8],1,'a wall in sight');assert.equal(known[20][60],0,'never seen');assert.equal(known[20][61],1,'remembered');
  s.fog.setEnabled(false);assert.equal(knownMap(s),s.map,'without Fog of War the real map is used');
  assert.equal(serializeOrder({kind:'move',goal:{x:60,y:20},explore:true}).explore,true);
  assert.equal(serializeOrder({kind:'move',goal:{x:6,y:20}}).explore,false);
});
