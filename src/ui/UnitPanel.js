export class UnitPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#unit-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    document.querySelector('#close-unit').addEventListener('click',()=>this.close(),options);
    document.querySelector('#king-profile').addEventListener('click',()=>this.open(scene.character),options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restoreInput(),options);
  }
  open(unit){this.unit=unit;this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open||!this.unit)return;
    const s=this.scene,u=this.unit,view=u.view??u.sprite;
    if(!view?.scene||!s.fog.isVisibleObject(u)){this.close();return;}
    const e=s.experienceSystem.getLevelProgress(u),format=n=>String(Math.round(n*100)/100);
    document.querySelector('#unit-name').textContent=u.name??u.definition.name;
    document.querySelector('#unit-level').textContent=`Level ${e.level} / ${e.maxLevel}`;
    document.querySelector('#unit-xp').textContent=e.level===e.maxLevel?'XP MAX':`XP ${format(e.currentXP)} / ${e.xpToNextLevel}`;
    const bar=document.querySelector('#unit-xp-bar');bar.max=e.xpToNextLevel||1;bar.value=e.level===e.maxLevel?1:e.currentXP;
    const values={hp:`${format(u.currentHP)} / ${u.maxHP}`,dps:format(u.attackDPS),armor:`${format(u.armor)} %`,totalXP:format(e.totalXP)};
    for(const [key,value]of Object.entries(values))document.querySelector(`[data-unit-stat="${key}"]`).textContent=value;
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();}
  destroy(){this.close();this.controller.abort();}
}
