import { tileCenter } from './isometric.js';

export class LegacyStockpileMarkers {
  constructor(scene){this.scene=scene;this.markers=new Map();}
  update(view,fog){
    const locations=[...this.scene.foodStorage.locations.values()].filter(l=>l.kind==='fallback'&&l.buildingId==null),ids=new Set(locations.map(l=>l.id));
    for(const [id,marker]of this.markers)if(!ids.has(id)){marker.destroy();this.markers.delete(id);}
    for(const location of locations){
      let marker=this.markers.get(location.id);if(!marker){
        const g=this.scene.add.graphics();g.fillStyle(0x25291f,.3);g.fillEllipse(3,0,43,15);g.fillStyle(0x816440);g.fillRect(-16,-29,29,25);g.lineStyle(2,0xb69a64);g.strokeRect(-16,-29,29,25);g.lineBetween(-15,-28,12,-5);g.fillStyle(location.id==='legacy-materials'?0x929786:0xc5ac73);g.fillEllipse(12,-5,17,11);
        const label=this.scene.add.text(0,-40,location.id==='legacy-materials'?'Legacy Stockpile':'Camp Storage',{fontSize:'10px',color:'#eee1b7',backgroundColor:'#333927'}).setOrigin(.5,1);
        marker=this.scene.add.container(0,0,[g,label]);this.markers.set(location.id,marker);
      }
      const point=tileCenter(location);marker.setPosition(point.x,point.y).setDepth(point.y+.12);marker.location=location;
      marker.setVisible(fog.isVisibleTile(location)&&point.x>view.x-65&&point.x<view.right+65&&point.y>view.y-10&&point.y<view.bottom+55);
    }
  }
  atPoint(x,y){return [...this.markers.values()].filter(m=>m.visible&&Math.abs(x-m.x)<24&&y>=m.y-35&&y<=m.y+5).sort((a,b)=>b.depth-a.depth)[0]??null;}
  destroy(){for(const marker of this.markers.values())marker.destroy();this.markers.clear();}
}
