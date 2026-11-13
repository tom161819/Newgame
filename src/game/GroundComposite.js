// performance-1 (m-vykon-fps): the Canvas renderer drew every shown terrain chunk (about 28 images of 640×320 px, half
// of each transparent) every frame: in a browser without GPU that blending was the largest single cost of a frame.
// Here the shown chunks are composed once into one cache for the view plus `pad` screen px, at the current zoom, and
// Phaser draws that one image (1:1 at the camera's zoom). The cache is redrawn only where a chunk was repainted (its
// rectangle, with the chunks overlapping it, in the same order), and in full when the zoom, the view size or the set of
// shown chunks changes or the view leaves the padding. The chunk images stay in the scene (visible, same textures) but
// draw nothing themselves. WebGL keeps drawing the chunks directly (one texture each, cheap on a GPU).
export const GROUND_COMPOSITE=Object.freeze({pad:160,depth:-101,key:'terrain:ground-composite'});
const skip=()=>{};

export class GroundComposite {
  // Only for the Canvas renderer in a browser.
  static supported(scene){return typeof document!=='undefined'&&!!scene?.sys?.game?.renderer&&!scene.sys.game.renderer.gl&&typeof scene.textures?.addCanvas==='function';}
  constructor(scene,terrain){
    this.scene=scene;this.terrain=terrain;this.canvas=document.createElement('canvas');this.canvas.width=this.canvas.height=1;this.context=this.canvas.getContext('2d');
    if(scene.textures.exists(GROUND_COMPOSITE.key))scene.textures.remove(GROUND_COMPOSITE.key);
    this.texture=scene.textures.addCanvas(GROUND_COMPOSITE.key,this.canvas);
    this.image=scene.add.image(0,0,GROUND_COMPOSITE.key).setOrigin(0,0).setDepth(GROUND_COMPOSITE.depth).setVisible(false);
    this.state=null;this.touched=new Map();this.stats={full:0,partial:0};
  }
  // A chunk image the cache draws: Phaser no longer draws it itself.
  adopt(image){if(image&&image.renderCanvas!==skip)image.renderCanvas=skip;return image;}
  // `rects`: only these world rectangles of the chunk changed (fog patches); none = the whole chunk.
  touch(key,rects=null){const had=this.touched.get(key);if(!rects||had===null){this.touched.set(key,null);return;}this.touched.set(key,[...(had??[]),...rects]);}
  shown(){
    const chunks=new Set();for(const image of this.terrain.chunks.values())if(image.visible)chunks.add(this.adopt(image));
    // The scene's own order (equal depth: insertion order), as Phaser drew them.
    // m-teren-vyska: lifted chunks overlap the ones behind them, so they are drawn back to front (by their top, then left).
    return this.scene.children.list.filter(o=>chunks.has(o)).sort((a,b)=>a.y-b.y||a.x-b.x);
  }
  // m-teren-vyska: a lifted chunk's picture is taller than what it holds; `image.tight` is the part with content.
  bounds(image){const f=image.frame;return image.tight??{x:image.x,y:image.y,width:f.cutWidth,height:f.cutHeight};}
  // `clip`: only that world rectangle, cleared and drawn again from the parts of the chunks inside it (no clip path).
  draw(images,clip=null){
    const s=this.state,c=this.context,z=s.zoom;c.setTransform(z,0,0,z,-s.ox*z,-s.oy*z);if(clip)c.clearRect(clip.x,clip.y,clip.width,clip.height);
    for(const image of images){const b=this.bounds(image),f=image.frame;
      if(!clip){c.drawImage(f.source.image,f.cutX+b.x-image.x,f.cutY+b.y-image.y,b.width,b.height,b.x,b.y,b.width,b.height);continue;}
      const x=Math.max(b.x,clip.x),y=Math.max(b.y,clip.y),w=Math.min(b.x+b.width,clip.x+clip.width)-x,h=Math.min(b.y+b.height,clip.y+clip.height)-y;if(w<=0||h<=0)continue;
      c.drawImage(f.source.image,f.cutX+x-image.x,f.cutY+y-image.y,w,h,x,y,w,h);}
    c.setTransform(1,0,0,1,0,0);
  }
  // performance-3 (owner 13 Nov 2026: zooming out lags): the cache is no longer redrawn in full every frame of a zoom or
  // for every chunk that comes into view. (1) While the zoom is moving, a cache of a lower resolution is kept (shown
  // stretched for those few frames); zooming out builds the cache once for the view the zoom is heading to. (2) A chunk
  // that joins the shown ones is drawn alone into the cache; a chunk that left stays as it is (it lies outside the view).
  sync(camera){
    if(!camera?.worldView)return;
    const z=camera.zoom,view=camera.worldView,pad=GROUND_COMPOSITE.pad,images=this.shown(),s=this.state;
    const target=this.scene.worldCamera?.zoomTarget??z,moving=Math.abs(target-z)>1e-4;
    const inside=s&&s.width===camera.width&&s.height===camera.height&&(s.zoom===z||moving&&s.zoom<z)&&view.x>=s.ox&&view.y>=s.oy&&view.right<=s.ox+s.w/s.zoom&&view.bottom<=s.oy+s.h/s.zoom;
    const names=new Map(images.map(i=>[`${i.texture.key}@${i.x},${i.y}`,i]));
    if(!inside){
      // Whole world pixels at the cache origin: at zoom 1 the cache pixels are exactly the chunk pixels.
      const w=Math.ceil(camera.width+2*pad),h=Math.ceil(camera.height+2*pad),cz=moving?Math.min(z,target):z,mx=view.x+view.width/2,my=view.y+view.height/2;
      if(this.canvas.width!==w||this.canvas.height!==h){this.texture.setSize(w,h);this.image.setSizeToFrame();}else this.context.clearRect(0,0,w,h);
      this.state={zoom:cz,width:camera.width,height:camera.height,ox:Math.floor(mx-w/2/cz),oy:Math.floor(my-h/2/cz),w,h,names:new Set(names.keys())};
      this.draw(images);this.touched.clear();this.stats.full++;
      this.image.setPosition(this.state.ox,this.state.oy).setScale(1/cz).setVisible(images.length>0);
    }else{
      let drawn=false;
      for(const [name,image] of names)if(!s.names.has(name)){this.draw(images,this.bounds(image));this.touched.delete(this.keyOf(image));drawn=true;}
      s.names=new Set(names.keys());
      for(const [key,rects] of this.touched){const image=this.terrain.chunks.get(key);if(!image?.visible)continue;drawn=true;if(rects)for(const r of rects)this.draw(images,r);else this.draw(images,this.bounds(image));}
      this.touched.clear();if(!drawn)return;this.stats.partial++;this.image.setVisible(images.length>0);
    }
    this.texture.refresh();
  }
  keyOf(image){for(const [key,value] of this.terrain.chunks)if(value===image)return key;return null;}
  destroy(){this.image.destroy();if(this.scene.textures.exists(GROUND_COMPOSITE.key))this.scene.textures.remove(GROUND_COMPOSITE.key);}
}
