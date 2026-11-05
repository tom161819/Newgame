import { t } from '../i18n/index.js';
import { adjacentTiles,canInteractAdjacent } from '../game/interaction.js';
import { canStep } from '../game/pathfinding.js';
import { tileKey } from '../game/stones.js';
import { tileCenter } from '../game/map.js';

export class MountSystem {
  constructor(scene){this.scene=scene;this.target=null;this.repath=0;}
  cancel(){if(this.target)this.scene.character.stopForBuilding();this.target=null;}
  command(horse){
    this.cancel();
    if(this.scene.stables?.tamed(horse)){this.scene.setStatus(t('stables.inStable'));return false;}
    if(this.scene.character.mountedHorse||!horse.active||!horse.isAlive||horse.mounted||!horse.definition.interactions.includes('mount'))return false;
    this.target=horse;this.repath=0;
    if(!this.plan()){this.cancel();return false;}
    this.scene.setStatus(t('status.kingToHorse'));return true;
  }
  plan(){return this.scene.character.command({kind:'approachAnimal',animal:this.target,silent:true});}
  mount(horse){
    const king=this.scene.character;
    if(!king.isAlive||king.mountedHorse||king.state!=='ground'||!horse.active||!horse.isAlive||horse.mounted||!horse.definition.interactions.includes('mount')||king.nextTile||!canInteractAdjacent(this.scene.map,king,horse))return false;
    king.stopForBuilding();this.target=null;
    horse.mounted=true;horse.path=[];horse.nextTile=null;horse.walking=false;horse.view.setVisible(false);
    king.mountedHorse=horse;king.speed=king.definition.gameplay.movementSpeed*horse.definition.gameplay.mountedSpeedMultiplier;
    this.scene.player.setMounted?.(horse.definition);this.scene.fog?.update();this.scene.updateMountUI?.();
    this.scene.setStatus(t('status.kingRiding'));return true;
  }
  dismount(){
    const king=this.scene.character,horse=king.mountedHorse;if(!horse)return false;
    const origin=king.nextTile??king.tile,reserved=new Set([
      ...king.reservedTiles(),...this.scene.animalSystem.reservedTiles(),...(this.scene.workerSystem?.reservedTiles()??[]),
    ].map(tileKey));
    const exits=adjacentTiles({tile:origin}).filter(tile=>canStep(this.scene.map,origin,tile)
      &&!reserved.has(tileKey(tile))&&!this.scene.resourceOccupancy.has(tileKey(tile)));
    exits.sort((a,b)=>Math.hypot(a.x+.5-king.position.x,a.y+.5-king.position.y)-Math.hypot(b.x+.5-king.position.x,b.y+.5-king.position.y)||a.y-b.y||a.x-b.x);
    if(!exits.length){this.scene.setStatus(t('status.noDismountTile'));return false;}
    const tile=exits[0];horse.mounted=false;horse.tile={...tile};horse.position={x:tile.x+.5,y:tile.y+.5};
    horse.path=[];horse.nextTile=null;horse.wanderWait=2000;
    const point=tileCenter(tile);horse.view.setPosition(point.x,point.y).setDepth(point.y+(horse.definition.depth?.offset??0)).setVisible(true);
    king.mountedHorse=null;king.speed=king.definition.gameplay.movementSpeed;
    this.scene.player.setMounted?.(null);this.scene.fog?.update();this.scene.updateMountUI?.();
    if(this.scene.stables?.onDismount(horse))this.scene.setStatus(t('stables.kingStabled'));else this.scene.setStatus(t('status.kingDismounted'));return true;
  }
  update(delta){
    const king=this.scene.character,horse=king.mountedHorse;
    if(horse){horse.position={...king.position};horse.tile={...king.tile};horse.view.setVisible(false);}
    const target=this.target;if(!target)return;
    if(!target.active||!target.isAlive||target.mounted){this.cancel();return;}
    if(king.state!=='ground')return;
    if(!king.nextTile&&canInteractAdjacent(this.scene.map,king,target)){this.mount(target);return;}
    this.repath-=delta;
    if(this.repath<=0){this.repath=350;if(!this.plan()){this.cancel();this.scene.setStatus(t('status.noPathHorse'));}}
  }
  onDeath(horse){
    if(this.target===horse)this.cancel();
    const king=this.scene.character;if(king.mountedHorse!==horse)return;
    king.mountedHorse=null;king.speed=king.definition.gameplay.movementSpeed;this.scene.player.setMounted?.(null);
    this.scene.updateMountUI?.();
  }
}
