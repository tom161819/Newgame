import { WildlifeClearance,keepsWildlifeClearance } from './WildlifeClearance.js';
import { AnimalController } from '../game/AnimalController.js';
import { generateResourcePositions } from '../game/stones.js';
import { tileCenter,isWalkable } from '../game/map.js';
import { adjacentTiles } from '../game/interaction.js';
import { inAttackRange } from './CombatSystem.js';
import { animalInitialCount } from './GameSettings.js';

export class AnimalSystem {
  constructor(scene,random=Math.random){this.scene=scene;this.random=random;this.animals=new Map();this.nextId=1;this.clearance=new WildlifeClearance(scene);}
  spawn(start){
    const definitions=this.scene.objectRegistry.byCategory('animal');this.clearance.refresh();
    const positions=generateResourcePositions(this.scene.map,start,this.scene.map.length*this.scene.map[0].length,this.random,this.scene.resourceOccupancy);
    for(const definition of definitions)for(let i=0;i<animalInitialCount(definition,this.scene.gameSettings);i++){
      let tile=positions.pop();if(definition.gameplay.huntable)while(tile&&!this.clearance.isClear(tile))tile=positions.pop();if(!tile)break;
      this.create(definition,tile);
    }
  }
  create(definition,tile,id=`animal-${this.nextId++}`){
    const view=this.scene.assets.createView(definition.id,{...tileCenter(tile),tile});
    const animal=new AnimalController(this.scene,definition,id,tile,view);
    view.setData('animal',animal);this.animals.set(id,animal);return animal;
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
    this.clearance.refresh();
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
      const wild=keepsWildlifeClearance(animal);
      if(wild&&(animal.nextTile&&!this.clearance.isClear(animal.nextTile)||animal.path.some(tile=>!this.clearance.isClear(tile)))){animal.path=[];animal.wanderWait=0;}
      if(!animal.nextTile&&!animal.path.length){
        animal.wanderWait-=delta;
        if(animal.wanderWait<=0){
          const radius=animal.definition.gameplay.wanderRadius;
          const goal={x:animal.tile.x+Math.floor(this.random()*(radius*2+1))-radius,y:animal.tile.y+Math.floor(this.random()*(radius*2+1))-radius};
          if(wild){const route=this.clearance.isClear(animal.tile)?this.clearance.route(animal,goal):this.clearance.escape(animal);animal.path=route?.path??[];}
          else if(isWalkable(this.scene.map,goal.x,goal.y))animal.moveTo([goal]);
          animal.wanderWait=1800+this.random()*4000;
        }
      }
      animal.update(delta);
    }
  }
  destroy(){for(const animal of this.animals.values())animal.view.destroy();this.animals.clear();}
}
