import { SpriteObjectView, SpriteCharacterView, SpriteBuildingView } from './SpriteViews.js';

export function assetURL(path, baseURL = '/') {
  return `${baseURL.endsWith('/')?baseURL:`${baseURL}/`}${path.replace(/^\//,'')}`;
}

export class AssetManager {
  constructor(scene, registry, { baseURL = import.meta.env?.BASE_URL ?? '/' } = {}) {
    this.scene=scene;this.registry=registry;this.baseURL=baseURL;
    this.renderers=new Map();this.queued=new Set();this.failures=new Set();this.previews=new Map();this.listeners=new Set();
    this.fallbackKey='asset:fallback';
    this.onError=file=>{if(file?.key?.startsWith('asset:'))this.failures.add(file.key);};
    scene.load.on('loaderror',this.onError);
  }

  key(id,layer='main') { return `asset:${id}:${layer}`; }
  animationKey(id,name) { return `asset:${id}:animation:${name}`; }
  hasTexture(id,layer='main') { return this.scene.textures.exists(this.key(id,layer)); }
  usesSprite(definition) { return definition.renderMode!=='procedural'&&this.hasTexture(definition.id); }
  textureKey(id,layer='main') { return this.hasTexture(id,layer)?this.key(id,layer):this.ensureFallback(); }
  textureFor(id,fallback) { const definition=this.registry.require(id);return this.usesSprite(definition)?this.key(id):fallback; }

  queue(definitions=this.registry.all()) {
    let count=0;
    for(const definition of definitions){
      for(const [layer,path]of [['main',definition.sprite],['front',definition.frontSprite],...(definition.spriteVariants??[]).map((p,i)=>[`variant-${i}`,p]),...Object.entries(definition.artSprites??{}).map(([key,art])=>[`art-${key}`,art.sprite]),...Object.entries(definition.seasonVariants??{}).flatMap(([season,list])=>list.map((p,i)=>[`season-${season}-${i}`,p]))]){
        if(!path)continue;
        const key=this.key(definition.id,layer);
        if(this.hasTexture(definition.id,layer)||this.queued.has(key))continue;
        this.queued.add(key);count++;
        if(layer==='main'&&definition.spritesheet)this.scene.load.spritesheet(key,assetURL(path,this.baseURL),definition.spritesheet);
        else this.scene.load.image(key,assetURL(path,this.baseURL));
      }
    }
    return count;
  }

  initialize() {
    this.ensureFallback();this.setupAnimations();
    this.unsubscribe=this.registry.subscribe(()=>{this.load();});
  }

  load(definitions=this.registry.all()) {
    if(!this.queue(definitions)){this.setupAnimations();return Promise.resolve();}
    return new Promise(resolve=>{
      this.scene.load.once('complete',()=>{this.previews.clear();this.setupAnimations();for(const listener of this.listeners)listener();resolve();});
      if(!this.scene.load.isLoading())this.scene.load.start();
    });
  }

  setupAnimations() {
    for(const definition of this.registry.all()){
      if(!this.hasTexture(definition.id)||definition.animations?.mode!=='spritesheet')continue;
      const texture=this.scene.textures.get(this.key(definition.id));
      for(const clip of definition.animations.clips){
        const key=this.animationKey(definition.id,clip.name);
        if(this.scene.anims.exists(key)||clip.frames.some(frame=>!texture.has(frame)))continue;
        this.scene.anims.create({key,frames:clip.frames.map(frame=>({key:this.key(definition.id),frame})),frameRate:clip.frameRate,repeat:clip.repeat??(clip.state==='walk'?-1:0)});
      }
    }
  }

  ensureFallback() {
    if(!this.scene.textures.exists(this.fallbackKey)){
      const g=this.scene.make.graphics({x:0,y:0,add:false});
      g.fillStyle(0x353a2b);g.fillRect(0,0,80,80);
      g.lineStyle(2,0xd7bd78);g.strokeRect(1,1,78,78);
      g.fillStyle(0x9a9476);g.fillPoints([{x:12,y:51},{x:40,y:37},{x:68,y:51},{x:40,y:65}],true);
      g.fillStyle(0xd7bd78);g.fillRect(36,18,8,19);g.fillCircle(40,44,4);
      g.generateTexture(this.fallbackKey,80,80);g.destroy();
    }
    return this.fallbackKey;
  }

  registerRenderer(name,factory) { this.renderers.set(name,factory);return this; }

  createView(id,context) {
    const definition=this.registry.require(id),factory=this.renderers.get(definition.renderer);
    if((definition.renderMode==='procedural'||!this.hasTexture(id))&&factory){
      const view=factory(definition,context);view.setData?.('objectId',id);view.setData?.('definition',definition);return view;
    }
    if(definition.category==='building')return new SpriteBuildingView(this,definition,context.building,context.preview);
    const View=definition.category==='character'?SpriteCharacterView:SpriteObjectView;
    const view=new View(this,definition,context.x,context.y);
    view.setDepth(context.y+(definition.depth?.offset??0));
    return view;
  }

  hitTest(view,x,y) {
    if(!view.visible)return false;
    if(view.containsPoint)return view.containsPoint(x,y);
    if(view instanceof SpriteObjectView)return view.getBounds().contains(x,y);
    const definition=this.registry.require(view.getData('objectId')),area=definition.visual?.hitArea;
    return area?x>=view.x+area.x&&x<=view.x+area.x+area.width&&y>=view.y+area.y&&y<=view.y+area.y+area.height:false;
  }

  previewURL(definition) {
    if(this.previews.has(definition.id))return this.previews.get(definition.id);
    const key=this.textureKey(definition.id),texture=this.scene.textures.get(key);
    const frame=texture.get(definition.spritesheet&&key!==this.fallbackKey?definition.visual?.previewFrame??0:undefined);
    const canvas=document.createElement('canvas');canvas.width=frame.cutWidth;canvas.height=frame.cutHeight;
    canvas.getContext('2d').drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,canvas.width,canvas.height);
    const url=canvas.toDataURL('image/png');this.previews.set(definition.id,url);return url;
  }

  subscribe(listener) { this.listeners.add(listener);return ()=>this.listeners.delete(listener); }
  destroy() { this.unsubscribe?.();this.scene.load.off('loaderror',this.onError);this.listeners.clear();this.previews.clear(); }
}
