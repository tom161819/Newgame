import { canInteractAdjacent } from '../game/interaction.js';

export class HuntingSystem {
  constructor(scene){this.scene=scene;this.target=null;this.repath=0;}
  command(animal){
    this.cancel();
    if(!this.scene.character.isAlive||!animal.active||!animal.isAlive||!animal.definition.gameplay.huntable)return false;
    this.target=animal;this.repath=0;
    if(!this.plan()){this.cancel();return false;}
    this.scene.setStatus(`Král pronásleduje ${animal.definition.name}. Kliknutím jinam lov zrušíš.`);return true;
  }
  cancel(){
    if(this.target){this.scene.character.stopForBuilding();this.scene.animalSystem.stopRetaliation(this.target);}
    this.scene.combat?.stopAttack(this.scene.character);this.target=null;
  }
  plan(){return this.scene.character.command({kind:'approachAnimal',animal:this.target,silent:true});}
  update(delta){
    const animal=this.target,king=this.scene.character;
    if(!animal)return;
    if(!animal.active||!animal.isAlive||!king.isAlive){this.cancel();return;}
    if(king.state!=='ground')return;
    if(!king.nextTile&&canInteractAdjacent(this.scene.map,king,animal)){this.attack(animal);return;}
    this.scene.combat.stopAttack(king);
    this.repath-=delta;
    if(this.repath<=0){
      this.repath=350;
      if(!this.plan()){this.cancel();king.stopForBuilding();this.scene.setStatus('Zvíře není dostupné. Lov byl zrušen.');}
    }
  }
  attack(animal){
    const king=this.scene.character;
    if(!king.isAlive||!animal.active||!animal.isAlive||!animal.definition.gameplay.huntable||king.state!=='ground'||!canInteractAdjacent(this.scene.map,king,animal))return false;
    const dx=animal.position.x-king.position.x,dy=animal.position.y-king.position.y,length=Math.hypot(dx,dy);
    if(length)king.direction={x:dx/length,y:dy/length};
    king.stopForBuilding();this.scene.combat.startAttack(king,animal);
    this.scene.setStatus(`Král bojuje s ${animal.definition.name}. Kliknutím jinam souboj zrušíš.`);return true;
  }
}
