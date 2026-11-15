import { t } from '../i18n/index.js';
import { TREE_STAGES } from '../data/naturalResources.js';
import { GRAND_OAK } from '../data/naturalResources.js';
export class NaturalResourcePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#natural-resource-dialog');this.controller=new AbortController();this.restored=true;const options={signal:this.controller.signal};
    document.querySelector('#close-natural-resource').addEventListener('click',()=>this.close(),options);document.querySelector('#chop-tree').addEventListener('click',()=>{if(scene.naturalResources.beginKingChop(this.object))this.close();else this.refresh();},options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restore(),options);
  }
  open(object){if(!this.scene.fog.isVisibleObject(object))return;this.object=object;this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open)return;const object=this.object;if(!object||!this.scene.fog.isVisibleObject(object)){this.close();return;}
    const state=object.natural,button=document.querySelector('#chop-tree');document.querySelector('#natural-resource-title').textContent=object.definition.name;button.hidden=!object.definition.tree;
    document.querySelector('#natural-resource-info').textContent=object.definition.tree?t('tree.info',{stage:t(`tree.stage.${state.stage}`),wood:object.natural?.grand?GRAND_OAK.wood:object.definition.tree.wood,seconds:object.definition.tree.chopDuration/1000,xp:object.definition.tree.xp}):t('deposit.info',{remaining:state.remaining,max:state.max,resource:this.scene.objectRegistry.require(object.definition.deposit.resource).name,state:t(state.remaining===0?'deposit.depleted':state.boundBuildingId!=null?'deposit.assigned':'deposit.available')});
    button.disabled=state.stage!==3;
  }
  restore(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restore();}
  destroy(){this.close();this.controller.abort();}
}
