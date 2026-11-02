import { canInteractAdjacent } from '../game/interaction.js';

export class HuntingSystem {
  constructor(scene){this.scene=scene;this.target=null;this.repath=0;}
  command(animal){
    this.cancel();
    if(!animal.active||!animal.definition.gameplay.huntable)return false;
    this.target=animal;this.repath=0;
    if(!this.plan()){this.cancel();return false;}
    this.scene.setStatus(`Král pronásleduje ${animal.definition.name}. Kliknutím jinam lov zrušíš.`);return true;
  }
  cancel(){if(this.target)this.scene.character.stopForBuilding();this.target=null;}
  plan(){return this.scene.character.command({kind:'approachAnimal',animal:this.target,silent:true});}
  update(delta){
    const animal=this.target,king=this.scene.character;
    if(!animal)return;
    if(!animal.active){this.cancel();return;}
    if(king.state!=='ground')return;
    if(!king.nextTile&&canInteractAdjacent(this.scene.map,king,animal)){this.attack(animal);return;}
    this.repath-=delta;
    if(this.repath<=0){
      this.repath=350;
      if(!this.plan()){this.cancel();king.stopForBuilding();this.scene.setStatus('Zvíře není dostupné. Lov byl zrušen.');}
    }
  }
  attack(animal){
    const king=this.scene.character;
    if(!animal.active||king.state!=='ground'||!canInteractAdjacent(this.scene.map,king,animal))return false;
    const dx=animal.position.x-king.position.x,dy=animal.position.y-king.position.y,length=Math.hypot(dx,dy);
    if(length)king.direction={x:dx/length,y:dy/length};
    const tile={x:Math.floor(animal.position.x),y:Math.floor(animal.position.y)};
    this.scene.animalSystem.remove(animal);
    this.scene.dropSystem.create('meat',tile,animal.definition.gameplay.meatDrop);
    this.cancel();king.stopForBuilding();
    this.scene.setStatus(`${animal.definition.name} uloveno. Na zemi je Meat ×${animal.definition.gameplay.meatDrop}; seber ho kliknutím.`);return true;
  }
}
