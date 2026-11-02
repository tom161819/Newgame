import { visibilityProfile } from './VisibilityModifiers.js';

// Pouze logická oblast viditelnosti, žádná černá vrstva nad terénem.
export class FogOfWarSystem {
  constructor(character,enabled=false){this.character=character;this.enabled=enabled;this.update();}
  update(){
    const {size,center}=visibilityProfile(this.character);
    this.size=size;this.left=Math.ceil(center.x-size/2-.5);this.top=Math.ceil(center.y-size/2-.5);
    this.right=this.left+size;this.bottom=this.top+size;
    this.signature=this.enabled?`on:${size}:${this.left},${this.top}`:'off';
  }
  setEnabled(value){this.enabled=!!value;this.update();}
  isVisiblePosition(position){return !this.enabled||(position.x>=this.left&&position.x<this.right&&position.y>=this.top&&position.y<this.bottom);}
  isVisibleTile(tile){return this.isVisiblePosition({x:tile.x+.5,y:tile.y+.5});}
  isVisibleObject(object){
    if(!this.enabled)return true;
    if(object.position)return this.isVisiblePosition(object.position);
    const d=object.definition??{width:1,height:1};
    return object.x+.5<this.right&&object.x+d.width-.5>=this.left&&object.y+.5<this.bottom&&object.y+d.height-.5>=this.top;
  }
}
