import { generateResourcePositions,tileKey } from '../game/stones.js';
import { tileCenter } from '../game/map.js';
import { towerNeighbors } from '../game/buildings.js';

export class TreasureSystem {
  constructor(scene,{random=Math.random,onReady=()=>{},canShow=()=>true,onChange=()=>{}}={}){
    Object.assign(this,{scene,random,onReady,canShow,onChange});this.chests=new Map();this.nextId=1;this.pending=null;
    this.definition=scene.objectRegistry.require('treasure_chest');
  }
  spawn(start,count=this.scene.gameSettings?.treasureCount??this.definition.treasure.initial){
    const occupied=new Map(this.scene.resourceOccupancy);
    for(const tile of this.scene.reservedTiles())occupied.set(tileKey(tile),'reserved');
    const positions=generateResourcePositions(this.scene.map,start,count,this.random,occupied);
    for(const tile of positions)this.create(tile);
  }
  create(tile,saved=null){
    const definition=this.definition,data=definition.treasure,id=saved?.id??`treasure-${this.nextId++}`;
    const view=this.scene.assets.createView(definition.id,{...tileCenter(tile),tile});
    const chest={id,type:definition.id,definition,x:tile.x,y:tile.y,tile:{...tile},view,opened:false,opening:false,looted:false,
      contents:saved?structuredClone(saved.contents):{gold:data.goldMin+Math.floor(this.random()*(data.goldMax-data.goldMin+1)),equipment:[...data.equipment]}};
    if(saved){chest.opened=saved.opened;chest.looted=saved.looted;view.setOpened?.(saved.opened);}
    view.setData('chest',chest);this.scene.map[tile.y][tile.x]=1;this.chests.set(id,chest);return chest;
  }
  adjacent(chest){return this.scene.character.state==='ground'&&towerNeighbors(chest).some(tile=>tileKey(tile)===tileKey(this.scene.character.tile));}
  requestOpen(chest){
    if(!this.adjacent(chest)||!this.scene.character.isAlive)return false;
    this.pending=chest.id;
    if(!chest.opened&&!chest.opening){
      const done=()=>{
        chest.opening=false;chest.opened=true;
        const frame=this.definition.visual?.openFrame;
        if(frame!==undefined&&chest.view.sprite?.texture.has(frame))chest.view.sprite.setFrame(frame);
      };
      chest.opening=true;
      if(chest.view.open)chest.view.open(done);
      else{chest.view.setAlpha(.7);this.scene.tweens.add({targets:chest.view.container??chest.view,alpha:1,duration:350,onComplete:done});}
    }
    return true;
  }
  cancelRequest(){this.pending=null;}
  takeAll(id){
    const chest=this.chests.get(id);
    if(!chest||!chest.opened||chest.looted||!this.adjacent(chest)||!this.scene.character.isAlive)return false;
    chest.looted=true;
    this.scene.inventory.add('gold',chest.contents.gold,{source:'Treasure',id:`treasure:${chest.id}:gold`,entityId:chest.id});
    for(const item of chest.contents.equipment){this.scene.inventory.add(item);this.scene.equipment.equip(item);}
    this.onChange();return true;
  }
  atPoint(x,y,tile){return [...this.chests.values()].sort((a,b)=>b.view.depth-a.view.depth).find(chest=>(!this.scene.fog||this.scene.fog.isVisibleObject(chest))
    &&(this.scene.assets.hitTest(chest.view,x,y)||tileKey(chest.tile)===tileKey(tile)))??null;}
  update(view,fog){
    for(const chest of this.chests.values()){
      const v=chest.view;v.setVisible((!fog||fog.isVisibleObject(chest))&&v.x>view.x-50&&v.x<view.right+50&&v.y>view.y-30&&v.y<view.bottom+this.definition.visualHeight);
    }
    const chest=this.chests.get(this.pending);
    if(chest?.opened&&this.adjacent(chest)&&this.canShow()){this.pending=null;this.onReady(chest);}
  }
  destroy(){for(const chest of this.chests.values())chest.view.destroy();this.chests.clear();}
}
