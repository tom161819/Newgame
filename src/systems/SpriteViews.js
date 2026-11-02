import { directionName } from '../game/directions.js';
import { towerBase, buildingDepth } from '../game/buildings.js';
import { tilePolygon } from '../game/isometric.js';

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
  animate(_delta,moving,direction) {
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
    this.back=new SpriteObjectView(manager,definition,base.x,base.y);
    this.front=manager.hasTexture(definition.id,'front')
      ? new SpriteObjectView(manager,definition,base.x,base.y,{key:manager.textureKey(definition.id,'front'),origin:definition.frontOrigin??definition.origin,front:true})
      : manager.scene.add.graphics();
    this.footprint=manager.scene.add.graphics();
    this.paint(building);
    if(preview){this.back.setAlpha(0.5);this.front.setAlpha(0.5);}
  }
  paint(building,tint=null) {
    this.base=towerBase(building);
    const depth=buildingDepth(building);
    this.back.setPosition(this.base.x,this.base.y).setDepth(this.preview?10001:depth).setTint(tint);
    this.front.setPosition(this.base.x,this.base.y).setDepth(this.preview?10002:depth+0.3);
    if(this.front.setTint)this.front.setTint(tint);
    const floor=this.footprint.clear().setDepth(this.preview?10000:-90);
    floor.fillStyle(tint??0x777450,this.preview?0.3:0.25);floor.lineStyle(1,tint??0xb3a477,0.8);
    for(const tile of building.tiles){floor.fillPoints(tilePolygon(tile),true);floor.strokePoints(tilePolygon(tile),true);}
  }
  contains(x,y) { return this.back.getBounds().contains(x,y); }
  setVisible(value) { this.back.setVisible(value);this.front.setVisible(value);this.footprint.setVisible(value); }
  inView(view) { const b=this.back.getBounds();return b.right>=view.x&&b.x<=view.right&&b.bottom>=view.y&&b.y<=view.bottom; }
  destroy() { this.back.destroy();this.front.destroy();this.footprint.destroy(); }
}
