import { towerBase,buildingDefinition } from './buildings.js';

// Owner points 14–15: a small warning sign over a building whose source is used up or whose output has nowhere to go
// (the same issue as the notice and the line in its panel). Redrawn only when the diagnostics change.
const REASONS=new Set(['depleted','outputFull','noWater']);
export class IssueIcons {
  constructor(scene){this.scene=scene;this.icons=new Map();this.revision=-1;}
  update(){
    const s=this.scene,d=s.diagnostics;if(!d)return;
    if(d.revision!==this.revision){
      this.revision=d.revision;const keep=new Set();
      for(const issue of d.issues.values()){
        if(!REASONS.has(issue.reason)||issue.lastNotified==null)continue;const b=s.buildings.find(x=>x.id===issue.entityId);if(!b||keep.has(b.id))continue;keep.add(b.id);
        let g=this.icons.get(b.id);if(!g){g=s.add.graphics();this.icons.set(b.id,g);}
        const base=towerBase(b),h=buildingDefinition(b).visualHeight??60;g.clear();g.setPosition(base.x,base.y-h-26).setDepth(base.y+10000);
        g.fillStyle(issue.reason==='outputFull'?0xc8551f:0xd9a21b,1);g.fillTriangle(0,-11,-11,8,11,8);g.lineStyle(1.5,0x2a2108,1);g.strokeTriangle(0,-11,-11,8,11,8);
        g.fillStyle(0x2a2108,1);g.fillRect(-1.2,-5,2.4,7);g.fillRect(-1.2,4,2.4,2.2);g.buildingId=b.id;
      }
      for(const [id,g]of this.icons)if(!keep.has(id)){g.destroy();this.icons.delete(id);}
    }
    for(const [id,g]of this.icons){const b=s.buildings.find(x=>x.id===id);g.setVisible(!!b&&(!s.fog||s.fog.isVisibleObject(b)));}
  }
  destroy(){for(const g of this.icons.values())g.destroy();this.icons.clear();}
}
