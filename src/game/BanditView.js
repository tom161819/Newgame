import { DIRECTION_POSES } from './directions.js';
import { HumanView } from './HumanView.js';

// Owner 16 Nov 2026: a bandit of a camp in a scouted land – a person in a charcoal hooded tunic with a black mask and
// a green sash (combat review: soldiers wear red, bandits must not), a club in the hand (a provisional procedural figure until approved art exists).
export class BanditView extends HumanView {
  updateLook(){}
  paint(){
    const pose=DIRECTION_POSES[this.facing],g=this.body.clear(),width=pose.profile?4:6,hx=pose.screenX;
    g.fillStyle(0x34342e);g.fillPoints([{x:-width,y:-30},{x:width,y:-30},{x:width+2,y:-11},{x:-width-2,y:-11}],true);
    g.fillStyle(0x4f6b2e);g.fillRect(-width-1,-17,width*2+2,3);
    g.fillStyle(pose.back?0x1f1f1c:0xc49a78);g.fillEllipse(hx,-37,pose.profile?9:12,12);
    g.fillStyle(0x1f1f1c);g.fillEllipse(hx,-41,13,9);
    if(!pose.back){g.fillStyle(0x1d1410);g.fillRect(hx-6,-37,12,3);}
    g.lineStyle(3,0x6d4c2c);g.lineBetween(7,-16,10+hx*4,-31);
    for(const a of this.arms??[])a.setFillStyle?.(0x34342e);this.leftLeg?.setFillStyle?.(0x23231f);this.rightLeg?.setFillStyle?.(0x23231f);
    if(this.art)this.applyArt();
  }
}
