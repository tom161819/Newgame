import { t } from '../i18n/index.js';
import { MIN_ZOOM } from '../data/camera.js';
import { gridToWorld,tilePolygon } from '../game/isometric.js';
import { buildingDefinition } from '../game/buildings.js';
export class FarmConnections {
  constructor(scene){this.scene=scene;this.graphics=scene.add.graphics().setDepth(9990);this.signature=null;this.links=[];this.orphans=[];}
  focus(farm,panel){
    const s=this.scene,camera=s.cameras?.main,canvas=s.game?.canvas;if(!camera||!canvas||!panel?.open)return;
    s.worldCamera?.syncSize();const box=canvas.getBoundingClientRect(),dialog=panel.getBoundingClientRect();if(!box.width||!box.height)return;
    const scaleX=camera.width/box.width,scaleY=camera.height/box.height,left=(dialog.left-box.left-16)*scaleX,above=(dialog.top-box.top-16)*scaleY;
    const area=left>camera.width*.4?{x:8,y:8,width:left-8,height:camera.height-16}:{x:8,y:8,width:camera.width-16,height:Math.max(80,above-8)};
    const objects=[farm,...s.farmingSystem.plots(farm).filter(b=>!b.unverified&&s.fog.isVisibleObject(b))],points=[];
    for(const b of objects){const d=buildingDefinition(b);for(const [x,y]of [[b.x,b.y],[b.x+d.width,b.y],[b.x,b.y+d.height],[b.x+d.width,b.y+d.height]])points.push(gridToWorld(x,y));const top=gridToWorld(b.x+d.width/2,b.y+d.height/2);points.push({x:top.x,y:top.y-(d.visualHeight??0)});}
    const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),zoom=Math.max(s.worldCamera?.minimumZoom()??MIN_ZOOM,Math.min(camera.zoom,(area.width-48)/Math.max(1,maxX-minX),(area.height-48)/Math.max(1,maxY-minY)));
    camera.setZoom(zoom);camera.centerOn((minX+maxX)/2+(camera.width/2-area.x-area.width/2)/zoom,(minY+maxY)/2+(camera.height/2-area.y-area.height/2)/zoom);camera.preRender();
    if(s.worldCamera){s.worldCamera.following=false;s.worldCamera.panTarget=null;s.worldCamera.syncZoom();}const mode=document.querySelector('#camera-mode');if(mode)mode.textContent=t('hud.cameraManual');s.refreshVisibility();
  }
  refresh(){
    if(!this.graphics)return;const s=this.scene,visible=b=>!b.unverified&&s.fog.isVisibleObject(b),panel=s.workplacePanel,farm=panel?.dialog.open&&panel.building?.type==='farmhouse'&&s.buildings.includes(panel.building)&&visible(panel.building)?panel.building:null;
    const plots=s.buildings.filter(b=>buildingDefinition(b).crop&&visible(b)),linked=farm?plots.filter(b=>b.farmId===farm.id):[],orphans=plots.filter(b=>b.farmId==null),signature=JSON.stringify([farm?.id,linked.map(b=>[b.id,b.x,b.y]),orphans.map(b=>[b.id,b.x,b.y])]);
    if(signature===this.signature)return;this.signature=signature;this.links=linked.map(b=>b.id);this.orphans=orphans.map(b=>b.id);const g=this.graphics.clear();
    g.lineStyle(2,0xe88a68,.85);for(const plot of orphans)for(const tile of plot.tiles)g.strokePoints(tilePolygon(tile),true);
    if(!farm)return;const point=b=>{const d=buildingDefinition(b);return gridToWorld(b.x+d.width/2,b.y+d.height/2);},a=point(farm);g.lineStyle(1.5,0xe6cf89,.85);for(const plot of linked){const b=point(plot);g.lineBetween(a.x,a.y,b.x,b.y);}
  }
  destroy(){this.graphics?.destroy();this.graphics=null;this.links=[];this.orphans=[];}
}
