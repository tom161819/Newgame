// One shared bundle per carrier, independent of the physical quantity ledger.
export class CargoBundleView {
  constructor(scene,parent){this.graphic=scene.add.graphics().setPosition(10,-19).setVisible(false);parent.add(this.graphic);this.resource=null;}
  update(cargo){
    this.graphic.setVisible(!!cargo);if(!cargo||this.resource===cargo.resource)return;this.resource=cargo.resource;
    const g=this.graphic.clear();
    if(cargo.resource==='stone'||cargo.resource==='iron'){g.fillStyle(cargo.resource==='stone'?0xa5a79a:0x7e9295);g.fillPoints([{x:-5,y:3},{x:-7,y:-5},{x:0,y:-10},{x:7,y:-5},{x:5,y:4}],true);g.lineStyle(1,0x53594c);g.lineBetween(-5,0,5,-5);}
    else if(cargo.resource==='wood'){g.lineStyle(4,0x927044);for(const y of [-7,-3,1])g.lineBetween(-7,y,7,y+2);g.lineStyle(2,0xc6b583);g.lineBetween(-2,-10,-2,4);}
    else{g.fillStyle(0xb9a174);g.fillEllipse(0,-2,14,17);g.lineStyle(2,0x6a5637);g.lineBetween(-5,-8,5,-8);}
  }
}
