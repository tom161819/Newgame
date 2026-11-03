export class FoodEconomyPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#food-economy-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};
    document.querySelector('#open-food-economy').addEventListener('click',()=>{scene.setGalleryInput(false);this.dialog.showModal();this.refresh();},options);
    document.querySelector('#close-food-economy').addEventListener('click',()=>this.close(),options);this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>scene.setGalleryInput(true),options);
  }
  refresh(){
    if(!this.dialog.open)return;
    const s=this.scene,f=s.foodSystem.overview(),values={storage:String(f.storage),daily:String(f.daily),production:f.production.toFixed(2),days:f.days.toFixed(2),unfed:String(f.unfed),season:s.seasons.label,attractiveness:`${s.attractiveness.value} / 100`};
    for(const [key,value]of Object.entries(values)){const output=this.dialog.querySelector(`[data-food-economy="${key}"]`);if(output.textContent!==value)output.textContent=value;}
  }
  close(){this.dialog.close();this.scene.setGalleryInput(true);}
  destroy(){this.close();this.controller.abort();}
}
