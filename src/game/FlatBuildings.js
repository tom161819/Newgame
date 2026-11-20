import { tilePolygon } from './isometric.js';
import { buildingIsComplete } from './buildingState.js';
import { FLAT_VIEW } from './buildings.js';
import { buildingReachable } from './fogReach.js';

// Owner 19 Nov 2026 (84): Space flattens the buildings – their pictures hide and only their ground plans (footprints)
// show, so what stands behind a building can be clicked and placing new ones is clearer. Space again brings them back.
// A click on a flattened building goes by its plan (GameScene.towerAtPoint). Only a look: nothing is saved.
export const FLAT_LOOK=Object.freeze({
  depth:-55,// over the ground and the fog layer (-60), under units and objects
  complete:Object.freeze({fill:0xb98a4e,alpha:.5,line:0xf0d79a}),
  site:Object.freeze({fill:0xe3c57a,alpha:.25,line:0xffe7a6}),
  enemy:Object.freeze({fill:0xa8443a,alpha:.45,line:0xf0a090}),
});
export function flatLook(building){return building.enemy?FLAT_LOOK.enemy:buildingIsComplete(building)?FLAT_LOOK.complete:FLAT_LOOK.site;}
export class FlatBuildings {
  constructor(scene){this.scene=scene;this.on=false;this.graphics=null;this.signature=null;}
  toggle(on=!this.on){
    this.on=!!on;FLAT_VIEW.on=this.on;this.signature=null;this.scene.towerDoors?.refresh?.();if(this.scene.issueIcons)this.scene.issueIcons.revision=-1;
    if(this.on&&!this.graphics)this.graphics=this.scene.add.graphics().setDepth(FLAT_LOOK.depth);
    this.graphics?.setVisible(this.on);if(!this.on)this.graphics?.clear();
    this.scene.setStatus?.(this.scene.flatStatus?.(this.on));return this.on;
  }
  // Redrawn only when the buildings (their number, places, states or sight) change.
  update(){
    if(!this.on||!this.graphics)return;const s=this.scene,shown=s.buildings.filter(b=>buildingReachable(s.fog,b));
    const signature=shown.map(b=>`${b.id}:${b.x},${b.y}:${buildingIsComplete(b)?1:0}:${b.enemy?1:0}`).join('|');if(signature===this.signature)return;this.signature=signature;
    const g=this.graphics;g.clear();
    for(const b of shown){const look=flatLook(b);g.fillStyle(look.fill,look.alpha);g.lineStyle(1.5,look.line,.9);
      for(const tile of b.tiles??[]){const poly=tilePolygon(tile);g.fillPoints(poly,true);g.strokePoints(poly,true);}}
  }
  destroy(){FLAT_VIEW.on=false;this.graphics?.destroy();this.graphics=null;}
}
