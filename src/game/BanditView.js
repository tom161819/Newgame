import { ramTexture } from './VehicleViews.js';
import { DIRECTION_POSES } from './directions.js';
import { HumanView } from './HumanView.js';
const BANDIT=Object.freeze({tunic:0x34342e,sash:0x4f6b2e,hood:0x1f1f1c,legs:0x23231f,weapon:0x6d4c2c,mask:true,helmet:false});
// War (owner 16 Nov 2026): a soldier of an enemy army – steel-blue tabard over mail, an iron helmet, a spear.
const RAIDER=Object.freeze({tunic:0x2f4a66,sash:0xc9b26a,hood:0x8d9298,legs:0x2a2f36,weapon:0x9aa0a6,mask:false,helmet:true});

// Owner 16 Nov 2026: a bandit of a camp in a scouted land – a person in a charcoal hooded tunic with a black mask and
// a green sash (combat review: soldiers wear red, bandits must not), a club in the hand (a provisional procedural figure until approved art exists).
export class BanditView extends HumanView {
  updateLook(){}
  get palette(){return BANDIT;}
  paint(){const c=this.palette;
    const pose=DIRECTION_POSES[this.facing],g=this.body.clear(),width=pose.profile?4:6,hx=pose.screenX;
    g.fillStyle(c.tunic);g.fillPoints([{x:-width,y:-30},{x:width,y:-30},{x:width+2,y:-11},{x:-width-2,y:-11}],true);
    g.fillStyle(c.sash);g.fillRect(-width-1,-17,width*2+2,3);
    g.fillStyle(pose.back?c.hood:0xc49a78);g.fillEllipse(hx,-37,pose.profile?9:12,12);
    g.fillStyle(c.hood);g.fillEllipse(hx,-41,c.helmet?14:13,c.helmet?8:9);
    if(!pose.back&&c.mask){g.fillStyle(0x1d1410);g.fillRect(hx-6,-37,12,3);}
    g.lineStyle(3,c.weapon);g.lineBetween(7,-16,10+hx*4,-31);
    for(const a of this.arms??[])a.setFillStyle?.(c.tunic);this.leftLeg?.setFillStyle?.(c.legs);this.rightLeg?.setFillStyle?.(c.legs);
    if(this.art)this.applyArt();
  }
}

export class RaiderView extends BanditView { get palette(){return RAIDER;} }
// Owner 20 Nov 2026 (defence list, point 3): the enemy's Battering Ram (provisional, the same drawing as ours in the
// enemy's steel blue tint), facing the way it rolls.
export class RamView extends HumanView {
  updateLook(){}
  paint(){
    for(const p of [this.leftLeg,this.rightLeg,...(this.arms??[])])p?.setVisible(false);this.body?.clear();
    if(!this.ram){this.ram=this.scene.add.image(0,0,ramTexture(this.scene,0x3f6fb0)).setOrigin(.5,.85);this.add(this.ram);}
    const pose=DIRECTION_POSES[this.facing];this.ram.setFlipX((pose?.screenX??0)>0);this.shadow?.setVisible(false);if(this.art)this.art.setVisible(false);
  }
  applyArt(){}
  setAttackPose(){}
}

// Point 6: the enemy siege tower (provisional): a tall plank tower on wheels with a drawbridge at the top.
export class SiegeTowerView extends RamView {
  paint(){
    for(const p of [this.leftLeg,this.rightLeg,...(this.arms??[])])p?.setVisible(false);this.shadow?.setVisible(false);if(this.art)this.art.setVisible(false);
    const g=this.body.clear();g.fillStyle(0x2e241a,.3);g.fillEllipse(0,0,46,12);
    g.fillStyle(0x7a5233);g.fillRect(-16,-86,32,80);g.lineStyle(1.5,0x3b2616);g.strokeRect(-16,-86,32,80);
    g.lineStyle(1,0x4a3220,.8);for(let y=-78;y<-8;y+=8)g.lineBetween(-16,y,16,y);
    g.fillStyle(0x6a4528);g.fillRect(-19,-92,38,7);g.fillStyle(0x8a5e36);g.fillRect(-12,-84,24,16);g.lineStyle(1,0x3b2616);g.strokeRect(-12,-84,24,16);
    g.fillStyle(0x3f6fb0);g.fillTriangle(0,-104,10,-100,0,-96);g.lineStyle(1.5,0x3b2616);g.lineBetween(0,-92,0,-104);
    for(const x of [-12,12]){g.fillStyle(0x5a4a3a);g.fillCircle(x,-3,6);g.lineStyle(1.5,0x2e241a);g.strokeCircle(x,-3,6);}
  }
}
