import { findPathToAny,canStep } from './pathfinding.js';
import { advanceMovement,movementReservations } from './movement.js';
import { gridToWorld } from './isometric.js';

export class AnimalController {
  constructor(scene,definition,id,tile,view){
    Object.assign(this,{scene,definition,id,type:definition.id,tile:{...tile},view,active:true,
      position:{x:tile.x+.5,y:tile.y+.5},path:[],nextTile:null,direction:{x:0,y:1},
      speed:definition.gameplay.movementSpeed,walking:false,wanderWait:1000+Math.random()*3000});
  }
  moveTo(goals){
    const route=findPathToAny(this.scene.map,this.nextTile??this.tile,goals);
    this.path=route?.path??[];return !!route;
  }
  reservedTiles(){return this.mounted?[]:movementReservations(this);}
  update(delta){
    if(!this.active||this.mounted)return;
    // Nová budova může zneplatnit vzdálenější část staré cesty.
    if(this.path.length){
      let previous=this.nextTile??this.tile;
      for(const tile of this.path){if(!canStep(this.scene.map,previous,tile)){this.path=[];break;}previous=tile;}
    }
    advanceMovement(this,delta);
    const p=gridToWorld(this.position.x,this.position.y);
    this.view.setPosition(p.x,p.y).setDepth(p.y+(this.definition.depth?.offset??0));
    this.view.animate?.(delta,this.walking,this.direction);
  }
}
