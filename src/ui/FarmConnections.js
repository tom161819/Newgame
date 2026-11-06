import { gridToWorld,tilePolygon } from '../game/isometric.js';
import { buildingDefinition } from '../game/buildings.js';
export class FarmConnections {
  constructor(scene){this.scene=scene;this.graphics=scene.add.graphics().setDepth(9990);this.signature=null;this.links=[];this.orphans=[];}
  refresh(){
    if(!this.graphics)return;const s=this.scene,visible=b=>!b.unverified&&s.fog.isVisibleObject(b),panel=s.workplacePanel,farm=panel?.dialog.open&&panel.building?.type==='farmhouse'&&s.buildings.includes(panel.building)&&visible(panel.building)?panel.building:null;
    const plots=s.buildings.filter(b=>buildingDefinition(b).crop&&visible(b)),linked=farm?plots.filter(b=>b.farmId===farm.id):[],orphans=plots.filter(b=>b.farmId==null),signature=JSON.stringify([farm?.id,linked.map(b=>[b.id,b.x,b.y]),orphans.map(b=>[b.id,b.x,b.y])]);
    if(signature===this.signature)return;this.signature=signature;this.links=linked.map(b=>b.id);this.orphans=orphans.map(b=>b.id);const g=this.graphics.clear();
    g.lineStyle(2,0xe88a68,.85);for(const plot of orphans)for(const tile of plot.tiles)g.strokePoints(tilePolygon(tile),true);
    if(!farm)return;const point=b=>{const d=buildingDefinition(b);return gridToWorld(b.x+d.width/2,b.y+d.height/2);},a=point(farm);g.lineStyle(1.5,0xe6cf89,.85);for(const plot of linked){const b=point(plot);g.lineBetween(a.x,a.y,b.x,b.y);}
  }
  destroy(){this.graphics?.destroy();this.graphics=null;this.links=[];this.orphans=[];}
}
