import { AnimalController } from '../game/AnimalController.js';
import { generateResourcePositions } from '../game/stones.js';
import { tileCenter,isWalkable } from '../game/map.js';
import { adjacentTiles } from '../game/interaction.js';
import { inAttackRange } from './CombatSystem.js';

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
  onAttacked(animal,attacker){
    if(!animal.active||!animal.isAlive||!attacker.isAlive||!animal.definition.gameplay.huntable)return;
    animal.retaliationTarget=attacker;animal.path=[];animal.retaliationRepath=0;
    this.scene.combat.startAttack(animal,attacker);
  }
  stopRetaliation(animal){
    if(animal.retaliationTarget){animal.path=[];animal.wanderWait=1500;}
    animal.retaliationTarget=null;
    this.scene.combat?.stopAttack(animal);
  }
  atPoint(x,y){return [...this.animals.values()].sort((a,b)=>b.view.depth-a.view.depth).find(a=>!a.mounted&&(!this.scene.fog||this.scene.fog.isVisibleObject(a))&&this.scene.assets.hitTest(a.view,x,y))??null;}
  update(delta){
    for(const animal of this.animals.values()){
      if(!animal.active||!animal.isAlive)continue;
      if(animal.mounted)continue;
      const target=animal.retaliationTarget;
      if(target){
        if(!target.isAlive){this.stopRetaliation(animal);}
        else{
          const combat=this.scene.combat;
          if(combat.canFight(target)&&inAttackRange(animal,target,this.scene.map)){
            animal.path=[];combat.startAttack(animal,target);
            const dx=target.position.x-animal.position.x,dy=target.position.y-animal.position.y,length=Math.hypot(dx,dy);
            if(length&&!animal.nextTile)animal.direction={x:dx/length,y:dy/length};
          }else{
            combat.stopAttack(animal);animal.retaliationRepath-=delta;
            if(animal.retaliationRepath<=0){animal.retaliationRepath=350;animal.moveTo(adjacentTiles(target,this.scene.map));}
          }
          animal.update(delta);continue;
        }
      }
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
