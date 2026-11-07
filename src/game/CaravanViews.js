import { gridToWorld } from './isometric.js';
import { APPROVED_CARAVAN_ART } from '../data/objects/approvedArt.js';
import { assetURL } from '../systems/AssetManager.js';

// The approved Studio wagon loads on first use; until then (or if it fails) the procedural wagon below is drawn.
const artKey=kind=>`caravan-art:${kind}`;
function ensureArt(scene){
  if(scene.__caravanArt||!scene.load)return;scene.__caravanArt=true;let queued=0;
  for(const [kind,art]of Object.entries(APPROVED_CARAVAN_ART))if(!scene.textures.exists(artKey(kind))){scene.load.image(artKey(kind),assetURL(art.sprite,scene.assets?.baseURL??import.meta.env?.BASE_URL??'/'));queued++;}
  if(queued&&!scene.load.isLoading())scene.load.start();
}

// Trade F1.2: provisional procedural merchant caravan (horse, wagon with a red canvas cover, merchant on the box) until the
// Grafika task g-obchod-trziste-povoz delivers sprites. Full = goods on board (cover up), empty = bare wagon bed.
const FULL='caravan-wagon-full',EMPTY='caravan-wagon-empty';
function wagon(scene,keyName,full){
  if(scene.textures.exists(keyName))return keyName;
  const g=scene.make.graphics({x:0,y:0,add:false});
  g.fillStyle(0x2e241a,.3);g.fillEllipse(40,46,70,9);
  // horse
  g.fillStyle(0x6b4a2e);g.fillPoints([{x:4,y:24},{x:9,y:19},{x:14,y:20},{x:22,y:22},{x:28,y:21},{x:31,y:25},{x:31,y:34},{x:28,y:34},{x:27,y:29},{x:15,y:29},{x:14,y:40},{x:11,y:40},{x:11,y:34},{x:6,y:30}],true);
  g.lineStyle(1.2,0x3b2616);g.strokePoints([{x:4,y:24},{x:9,y:19},{x:14,y:20},{x:22,y:22},{x:28,y:21},{x:31,y:25},{x:31,y:34},{x:28,y:34},{x:27,y:29},{x:15,y:29},{x:14,y:40},{x:11,y:40},{x:11,y:34},{x:6,y:30}],true);
  g.lineStyle(2,0x4a3220);g.lineBetween(30,28,40,28);
  // wagon bed and wheels
  g.fillStyle(0x8a5e34);g.fillPoints([{x:38,y:22},{x:74,y:22},{x:72,y:36},{x:40,y:36}],true);g.lineStyle(1.5,0x4a3220);g.strokePoints([{x:38,y:22},{x:74,y:22},{x:72,y:36},{x:40,y:36}],true);
  if(full){
    g.fillStyle(0xb8432f);g.fillPoints([{x:44,y:22},{x:46,y:8},{x:70,y:8},{x:72,y:22}],true);g.lineStyle(1.2,0x6e2418);g.strokePoints([{x:44,y:22},{x:46,y:8},{x:70,y:8},{x:72,y:22}],true);
    g.lineStyle(1,0xe9d7b0,.8);g.lineBetween(52,9,51,22);g.lineBetween(62,9,63,22);
  }else{g.fillStyle(0x6a4a2c);for(const x of [46,56,66])g.fillRect(x,18,6,4);}
  // merchant on the box: green travel cloak and a brimmed hat
  g.fillStyle(0x2f5a3a);g.fillPoints([{x:36,y:24},{x:39,y:13},{x:44,y:13},{x:45,y:24}],true);
  g.fillStyle(0xe2b48c);g.fillCircle(41.5,11,3.2);g.fillStyle(0x3a2a1c);g.fillEllipse(41.5,8.5,11,3);g.fillRect(39,5,5,4);
  for(const x of [48,66]){g.fillStyle(0x5a4a3a);g.fillCircle(x,39,6);g.lineStyle(1.5,0x2e241a);g.strokeCircle(x,39,6);}
  g.generateTexture(keyName,80,50);g.destroy();return keyName;
}
// m-obchod-vylepseni (48): the escort – porters carrying goods between the wagon and the Marketplace while trading, and
// guards (spear and shield) walking with the wagon and standing around it. Provisional drawings like the wagon above.
function figure(scene,keyName,kind){
  if(scene.textures.exists(keyName))return keyName;
  const g=scene.make.graphics({x:0,y:0,add:false});g.fillStyle(0x2e241a,.3);g.fillEllipse(12,33,16,5);
  const coat=kind==='guard'?0x5b6470:0x8a6a44;g.fillStyle(0x3a3026);g.fillRect(8,24,3,9);g.fillRect(13,24,3,9);
  g.fillStyle(coat);g.fillRect(7,13,10,12);g.fillStyle(0xe2b48c);g.fillCircle(12,9,3.4);
  if(kind==='guard'){g.fillStyle(0x7d8790);g.fillEllipse(12,6.5,8,4);g.lineStyle(1.5,0x6b4a2e);g.lineBetween(20,2,20,30);g.fillStyle(0xc9ced4);g.fillTriangle(18.5,3,21.5,3,20,-1);g.fillStyle(0x8e2f24);g.fillEllipse(6,19,6,9);}
  else{g.fillStyle(0xcdb488);g.fillEllipse(17,12,9,8);g.lineStyle(1,0x8a7450);g.strokeEllipse(17,12,9,8);}
  g.generateTexture(keyName,26,36);g.destroy();return keyName;
}
export class CaravanViews {
  constructor(scene){this.scene=scene;this.view=null;this.id=null;}
  update(){
    const s=this.scene,c=s.caravans?.active;
    if(!c){this.clear();return;}
    ensureArt(s);const full=Object.values(c.stock).some(n=>n>0),kind=full?'full':'empty',art=s.textures?.exists?.(artKey(kind))?APPROVED_CARAVAN_ART[kind]:null;
    const texture=art?artKey(kind):wagon(s,full?FULL:EMPTY,full);
    if(!this.view||this.id!==c.id){this.clear();this.view=s.add.image(0,0,texture);this.view.caravanId=c.id;this.id=c.id;}
    if(this.view.texture.key!==texture)this.view.setTexture(texture);
    if(art)this.view.setOrigin(art.origin.x,art.origin.y);else this.view.setOrigin(.5,.82);
    const w=gridToWorld(c.position.x,c.position.y),dir=c.direction??{x:0,y:0};
    this.view.setPosition(w.x,w.y).setDepth(w.y+.02).setVisible(!s.fog?.enabled||s.fog.isVisibleTile(c.tile));
    if(dir.x||dir.y)this.view.setFlipX(dir.x-dir.y<0);
    this.escort(c,true);
  }
  escort(c,visible){
    const s=this.scene,e=c.escort??{porters:0,guards:0};this.people??=[];const want=[...Array(e.guards).fill('guard'),...Array(e.porters).fill('porter')];
    while(this.people.length>want.length)this.people.pop().destroy();
    want.forEach((kind,i)=>{if(!this.people[i]||this.people[i].kind!==kind){this.people[i]?.destroy();const img=s.add.image(0,0,figure(s,`caravan-${kind}`,kind)).setOrigin(.5,.92);img.kind=kind;this.people[i]=img;}});
    const now=s.gameTime?.totalElapsed??0,market=s.buildings?.find(b=>b.id===c.marketplaceId),center=market?{x:market.x+(market.definition?.width??3)/2,y:market.y+(market.definition?.height??3)/2}:null;
    let g=0,p=0;
    for(const img of this.people){let x,y;
      if(img.kind==='guard'){const a=(g++/Math.max(1,e.guards))*Math.PI*2+.4,r=c.phase==='trading'?1.6:1.1;x=c.position.x+Math.cos(a)*r;y=c.position.y+Math.sin(a)*r;}
      else{const i=p++;if(c.phase==='trading'&&center){const k=((now/2600+i*.5)%1),f=k<.5?k*2:2-k*2;x=c.position.x+(center.x-c.position.x)*f;y=c.position.y+(center.y-c.position.y)*f;}else{x=c.position.x+.6+i*.5;y=c.position.y-.6;}}
      const w=gridToWorld(x,y);img.setPosition(w.x,w.y).setDepth(w.y+.01).setVisible(visible&&(!s.fog?.enabled||s.fog.isVisibleTile({x:Math.floor(x),y:Math.floor(y)})));}
  }
  clear(){this.view?.destroy();this.view=null;this.id=null;for(const p of this.people??[])p.destroy();this.people=[];}
  destroy(){this.clear();}
}
