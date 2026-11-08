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
    this.state=null;this.touched=new Set();this.stats={full:0,partial:0};
  }
  // A chunk image the cache draws: Phaser no longer draws it itself.
  adopt(image){if(image&&image.renderCanvas!==skip)image.renderCanvas=skip;return image;}
  touch(key){this.touched.add(key);}
  shown(){
    const chunks=new Set();for(const image of this.terrain.chunks.values())if(image.visible)chunks.add(this.adopt(image));
    // The scene's own order (equal depth: insertion order), as Phaser drew them.
    return this.scene.children.list.filter(o=>chunks.has(o));
  }
  bounds(image){const f=image.frame;return {x:image.x,y:image.y,width:f.cutWidth,height:f.cutHeight};}
  // `clip`: only that world rectangle, cleared and drawn again from the parts of the chunks inside it (no clip path).
  draw(images,clip=null){
    const s=this.state,c=this.context,z=s.zoom;c.setTransform(z,0,0,z,-s.ox*z,-s.oy*z);if(clip)c.clearRect(clip.x,clip.y,clip.width,clip.height);
    for(const image of images){const b=this.bounds(image),f=image.frame;
      if(!clip){c.drawImage(f.source.image,f.cutX,f.cutY,f.cutWidth,f.cutHeight,b.x,b.y,b.width,b.height);continue;}
      const x=Math.max(b.x,clip.x),y=Math.max(b.y,clip.y),w=Math.min(b.x+b.width,clip.x+clip.width)-x,h=Math.min(b.y+b.height,clip.y+clip.height)-y;if(w<=0||h<=0)continue;
      c.drawImage(f.source.image,f.cutX+x-b.x,f.cutY+y-b.y,w,h,x,y,w,h);}
    c.setTransform(1,0,0,1,0,0);
  }
  sync(camera){
    if(!camera?.worldView)return;
    const z=camera.zoom,view=camera.worldView,pad=GROUND_COMPOSITE.pad,images=this.shown(),signature=images.map(i=>`${i.texture.key}@${i.x},${i.y}`).join(';'),s=this.state;
    const inside=s&&s.zoom===z&&s.width===camera.width&&s.height===camera.height&&view.x>=s.ox&&view.y>=s.oy&&view.right<=s.ox+s.w/z&&view.bottom<=s.oy+s.h/z;
    if(!inside||s.signature!==signature){
      // Whole world pixels at the cache origin: at zoom 1 the cache pixels are exactly the chunk pixels.
      const w=Math.ceil(camera.width+2*pad),h=Math.ceil(camera.height+2*pad);
      if(this.canvas.width!==w||this.canvas.height!==h){this.texture.setSize(w,h);this.image.setSizeToFrame();}else this.context.clearRect(0,0,w,h);
      this.state={zoom:z,width:camera.width,height:camera.height,ox:Math.floor(view.x-pad/z),oy:Math.floor(view.y-pad/z),w,h,signature};
      this.draw(images);this.touched.clear();this.stats.full++;
      this.image.setPosition(this.state.ox,this.state.oy).setScale(1/z).setVisible(images.length>0);
    }else if(this.touched.size){
      for(const key of this.touched){const image=this.terrain.chunks.get(key);if(image?.visible)this.draw(images,this.bounds(image));}
      this.touched.clear();this.stats.partial++;
    }else return;
    this.texture.refresh();
  }
  destroy(){this.image.destroy();if(this.scene.textures.exists(GROUND_COMPOSITE.key))this.scene.textures.remove(GROUND_COMPOSITE.key);}
}
