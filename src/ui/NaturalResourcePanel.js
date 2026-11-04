import { TREE_STAGES } from '../data/naturalResources.js';
export class NaturalResourcePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#natural-resource-dialog');this.controller=new AbortController();this.restored=true;const options={signal:this.controller.signal};
    document.querySelector('#close-natural-resource').addEventListener('click',()=>this.close(),options);document.querySelector('#chop-tree').addEventListener('click',()=>{if(scene.naturalResources.beginKingChop(this.object))this.close();else this.refresh();},options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restore(),options);
  }
  open(object){if(!this.scene.fog.isVisibleObject(object))return;this.object=object;this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){if(!this.dialog.open)return;const object=this.object;if(!object||!this.scene.fog.isVisibleObject(object)){this.close();return;}const rule=object.definition.tree,state=object.natural;document.querySelector('#natural-resource-title').textContent=object.definition.name;document.querySelector('#natural-resource-info').textContent=`${TREE_STAGES[state.stage]} · ${rule.wood} Wood · ${rule.chopDuration/1000} seconds of active work · Woodcutting XP ${rule.xp}`;document.querySelector('#chop-tree').disabled=state.stage!==3;}
  restore(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restore();}
  destroy(){this.close();this.controller.abort();}
}
