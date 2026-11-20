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
