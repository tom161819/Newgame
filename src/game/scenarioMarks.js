import { tileCenter } from './isometric.js';
import { SCENARIO_LIMITS } from './scenario.js';

// Owner 20 Nov 2026 (86c): marks a template author puts on the Test map – attack points (red flags, the waves of a
// Defence come from a random one) and our King's place (a gold crown). Shown on the Test map only; saved in the template.
export class ScenarioMarks {
  constructor(scene,{spawns=[],king=null}={}){this.scene=scene;this.spawns=spawns.map(p=>({x:p.x,y:p.y}));this.king=king?{...king}:null;this.graphics=null;this.draw();}
  addSpawn(tile){if(this.spawns.length>=SCENARIO_LIMITS.spawns)return false;if(this.spawns.some(p=>p.x===tile.x&&p.y===tile.y))return false;this.spawns.push({x:tile.x,y:tile.y});this.draw();return true;}
  setKing(tile){this.king={x:tile.x,y:tile.y};this.draw();return true;}
  // Removes a mark within one tile of the click; true when one went.
  removeAt(tile){const near=p=>Math.max(Math.abs(p.x-tile.x),Math.abs(p.y-tile.y))<=1;const n=this.spawns.length;this.spawns=this.spawns.filter(p=>!near(p));if(this.king&&near(this.king)){this.king=null;this.draw();return true;}if(this.spawns.length!==n){this.draw();return true;}return false;}
  draw(){
    const s=this.scene;if(!s.add)return;this.graphics??=s.add.graphics().setDepth(900000);const g=this.graphics;g.clear();
    for(const p of this.spawns){const c=tileCenter(p);g.lineStyle(3,0x3b2a18,1).lineBetween(c.x,c.y,c.x,c.y-46);g.fillStyle(0xc8352b,1).fillTriangle(c.x,c.y-46,c.x+26,c.y-38,c.x,c.y-30);g.lineStyle(2,0xffffff,.8).strokeEllipse(c.x,c.y,34,16);}
    if(this.king){const c=tileCenter(this.king),pts=[{x:c.x-14,y:c.y-20},{x:c.x-14,y:c.y-36},{x:c.x-7,y:c.y-28},{x:c.x,y:c.y-42},{x:c.x+7,y:c.y-28},{x:c.x+14,y:c.y-36},{x:c.x+14,y:c.y-20}];g.fillStyle(0xf0c53a,1).fillPoints(pts,true);g.lineStyle(2,0x6b4a10,1).strokePoints(pts,true);g.lineStyle(2,0xf0c53a,.9).strokeEllipse(c.x,c.y,34,16);}
  }
  destroy(){this.graphics?.destroy();this.graphics=null;}
}
