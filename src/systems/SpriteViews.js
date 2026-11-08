import { directionName } from '../game/directions.js';
import { towerBase, buildingDepth } from '../game/buildings.js';
import { tilePolygon } from '../game/isometric.js';
import { DEPLETED_TINT } from '../game/depletedMine.js';

// Stejné rozhraní jako procedurální pohledy: pozice, hloubka, viditelnost a animace.
export class SpriteObjectView {
  constructor(manager, definition, x, y, options = {}) {
    this.manager = manager; this.definition = definition;
    const scene = manager.scene;
    this.container = scene.add.container(x, y);
    const shadow = definition.shadow;
    if (shadow && !shadow.baked && !options.front) {
      this.container.add(scene.add.ellipse(shadow.x,shadow.y,shadow.width,shadow.height,shadow.color??0x30291c,shadow.alpha));
    }
    const key = options.key ?? manager.textureKey(definition.id);
    this.sprite = scene.add.sprite(0, 0, key, definition.spritesheet ? definition.visual?.previewFrame ?? 0 : undefined);
    const origin = options.origin ?? definition.origin ?? { x: 0.5, y: 1 };
    this.sprite.setOrigin(origin.x, origin.y);
    if (definition.visual?.displayWidth && definition.visual?.displayHeight) {
      this.sprite.setDisplaySize(definition.visual.displayWidth,definition.visual.displayHeight);
    } else if (key === manager.fallbackKey) {
      this.sprite.setDisplaySize(Math.max(48,(definition.width+definition.height)*32),Math.max(48,definition.visualHeight??64));
    }
    this.container.add(this.sprite);
    this.container.setData('objectId',definition.id);
    this.container.setData('definition',definition);
  }
  get x() { return this.container.x; } set x(value) { this.container.x=value; }
  get y() { return this.container.y; } set y(value) { this.container.y=value; }
  get depth() { return this.container.depth; }
  get visible() { return this.container.visible; }
  get active() { return this.container.active; }
  setPosition(x,y) { this.container.setPosition(x,y); return this; }
  setDepth(value) { this.container.setDepth(value); return this; }
  setVisible(value) { this.container.setVisible(value); return this; }
  setAlpha(value) { this.container.setAlpha(value); return this; }
  setData(key,value) { this.container.setData(key,value); return this; }
  getData(key) { return this.container.getData(key); }
  getBounds() { return this.container.getBounds(); }
  setTint(value) { if(value===null)this.sprite.clearTint();else this.sprite.setTint(value);return this; }
  destroy() { this.container.destroy(true); }
}

export class SpriteCharacterView extends SpriteObjectView {
  constructor(...args) { super(...args); this.facing='S'; this.isWalking=false; }
  setMounted(definition){
    this.mount?.destroy();this.mount=null;
    if(definition){this.mount=this.manager.createView(definition.id,{x:0,y:0});this.container.addAt(this.mount.container??this.mount,0);}
    this.sprite.y=definition?-19:0;
  }
  setAttackPose(_delta,active,direction){
    if(!active)return;
    const facing=directionName(direction);if(facing)this.facing=facing;
    const clip=this.definition.animations?.clips?.find(c=>c.state==='attack'&&c.direction===this.facing);
    if(clip&&this.manager.scene.anims.exists(this.manager.animationKey(this.definition.id,clip.name)))this.sprite.play(this.manager.animationKey(this.definition.id,clip.name),true);
  }
  animate(_delta,moving,direction) {
    this.mount?.animate?.(_delta,moving,direction);
    const facing=directionName(direction),changed=facing&&facing!==this.facing;
    if(facing)this.facing=facing;
    this.isWalking=moving;
    const clips=this.definition.animations?.clips??[];
    const clip=clips.find(c=>c.direction===this.facing&&c.state===(moving?'walk':'idle'));
    if(clip&&this.manager.scene.anims.exists(this.manager.animationKey(this.definition.id,clip.name))) {
      this.sprite.play(this.manager.animationKey(this.definition.id,clip.name),true);
    } else {
      this.sprite.anims.stop();
      if(changed){const frame=clips.find(c=>c.direction===this.facing)?.frames[0];if(frame!==undefined&&this.sprite.texture.has(frame))this.sprite.setFrame(frame);}
    }
  }
}

export class SpriteBuildingView {
  constructor(manager,definition,building,preview=false) {
    this.manager=manager;this.definition=definition;this.preview=preview;
    const base=towerBase(building);
    // #99: a building with a rotor (the Mill) shows its still body and turns the sails alone (see game/MillSails.js).
    const rotor=definition.rotor&&manager.hasTexture(definition.id,'still')&&manager.hasTexture(definition.id,'rotor');
    this.back=new SpriteObjectView(manager,definition,base.x,base.y,rotor?{key:manager.textureKey(definition.id,'still')}:{});
    this.rotor=rotor?manager.scene.add.image(base.x+definition.rotor.pivot.x,base.y+definition.rotor.pivot.y,manager.textureKey(definition.id,'rotor')).setOrigin(definition.rotor.origin.x,definition.rotor.origin.y):null;
    this.front=manager.hasTexture(definition.id,'front')
      ? new SpriteObjectView(manager,definition,base.x,base.y,{key:manager.textureKey(definition.id,'front'),origin:definition.frontOrigin??definition.origin,front:true})
      : manager.scene.add.graphics();
    this.footprint=manager.scene.add.graphics();
    this.paint(building);
    if(preview){this.back.setAlpha(0.5);this.front.setAlpha(0.5);this.rotor?.setAlpha(0.5);}
  }
  paint(building,tint=null) {
    this.base=towerBase(building);
    const depth=buildingDepth(building);
    // m-vytezeny-dul-ctverecky (64): a depleted mine is drawn darker (provisional; final art may come from Grafika).
    const look=tint??(building.depleted?DEPLETED_TINT:null);
    this.back.setPosition(this.base.x,this.base.y).setDepth(this.preview?10001:depth).setTint(look);
    this.front.setPosition(this.base.x,this.base.y).setDepth(this.preview?10002:depth+0.3);
    this.rotor?.setPosition(this.base.x+this.definition.rotor.pivot.x,this.base.y+this.definition.rotor.pivot.y).setDepth(this.preview?10001.5:depth+0.2);if(this.rotor){if(look)this.rotor.setTint(look);else this.rotor.clearTint();}
    if(this.front.setTint)this.front.setTint(look);
    const floor=this.footprint.clear().setDepth(this.preview?10000:-90);
    floor.fillStyle(tint??0x777450,this.preview?0.3:0.25);floor.lineStyle(1,tint??0xb3a477,0.8);
    for(const tile of building.tiles){floor.fillPoints(tilePolygon(tile),true);floor.strokePoints(tilePolygon(tile),true);}
    // A valid Quarry preview outlines its primary deposit in gold (same as WorkplaceView).
    if(this.preview&&this.definition.id==='quarry'&&tint===0x71dba6){const deposit=this.manager.scene.naturalResources?.mining.select(this.definition,building);if(deposit){floor.fillStyle(0xe6c36b,.35);floor.lineStyle(3,0xf6d786,1);for(const tile of deposit.tiles){floor.fillPoints(tilePolygon(tile),true);floor.strokePoints(tilePolygon(tile),true);}}}
  }
  // Opaque pixels only: transparent padding and the baked ground shadow (≈32 % alpha) are not part of the building.
  contains(x,y) {
    const bounds=this.back.getBounds();if(!bounds.contains(x,y))return false;
    const sprite=this.back.sprite,frame=sprite?.frame;if(!frame||!bounds.width||!bounds.height)return true;
    const alpha=this.manager.scene.textures.getPixelAlpha(Math.floor((x-bounds.x)/bounds.width*frame.width),Math.floor((y-bounds.y)/bounds.height*frame.height),sprite.texture.key,frame.name);
    return alpha==null||alpha>=160;
  }
  setAlpha(value) { this.back.setAlpha(value);this.front.setAlpha(value);this.rotor?.setAlpha(value);this.footprint.setAlpha(value);return this; }
  setVisible(value) { this.back.setVisible(value);this.front.setVisible(value);this.rotor?.setVisible(value);this.footprint.setVisible(value); }
  inView(view) { const b=this.back.getBounds();return b.right>=view.x&&b.x<=view.right&&b.bottom>=view.y&&b.y<=view.bottom; }
  destroy() { this.back.destroy();this.front.destroy();this.rotor?.destroy();this.footprint.destroy(); }
}
