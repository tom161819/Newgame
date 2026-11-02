import { AnimalController } from '../game/AnimalController.js';
import { generateResourcePositions } from '../game/stones.js';
import { tileCenter,isWalkable } from '../game/map.js';

export class AnimalSystem {
  constructor(scene,random=Math.random){this.scene=scene;this.random=random;this.animals=new Map();this.nextId=1;}
  spawn(start){
    const definitions=this.scene.objectRegistry.byCategory('animal'),total=definitions.reduce((n,d)=>n+d.gameplay.initialCount,0);
    const positions=generateResourcePositions(this.scene.map,start,total,this.random,this.scene.resourceOccupancy);
    for(const definition of definitions)for(let i=0;i<definition.gameplay.initialCount;i++){
      const tile=positions.pop();if(!tile)break;
      const id=`animal-${this.nextId++}`,view=this.scene.assets.createView(definition.id,{...tileCenter(tile),tile});
      const animal=new AnimalController(this.scene,definition,id,tile,view);
      view.setData('animal',animal);this.animals.set(id,animal);
    }
  }
  remove(animal){if(!animal.active)return;animal.active=false;animal.path=[];animal.nextTile=null;animal.view.destroy();this.animals.delete(animal.id);}
  reservedTiles(){return [...this.animals.values()].flatMap(a=>a.reservedTiles());}
  atPoint(x,y){return [...this.animals.values()].sort((a,b)=>b.view.depth-a.view.depth).find(a=>this.scene.assets.hitTest(a.view,x,y))??null;}
  update(delta){
    for(const animal of this.animals.values()){
      if(!animal.nextTile&&!animal.path.length){
        animal.wanderWait-=delta;
        if(animal.wanderWait<=0){
          const radius=animal.definition.gameplay.wanderRadius;
          const goal={x:animal.tile.x+Math.floor(this.random()*(radius*2+1))-radius,y:animal.tile.y+Math.floor(this.random()*(radius*2+1))-radius};
          if(isWalkable(this.scene.map,goal.x,goal.y))animal.moveTo([goal]);
          animal.wanderWait=1800+this.random()*4000;
        }
      }
      animal.update(delta);
    }
  }
  destroy(){for(const animal of this.animals.values())animal.view.destroy();this.animals.clear();}
}
