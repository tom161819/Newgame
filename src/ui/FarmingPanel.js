import { buildingDefinition } from '../game/buildings.js';

export class FarmingPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#farming-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    document.querySelector('#close-farming').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>this.restoreInput(),options);
  }
  open(building){this.building=building;this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open||!this.building)return;
    const scene=this.scene,building=this.building;if(!scene.buildings.includes(building)||!scene.fog.isVisibleObject(building)){this.close();return;}
    const record=scene.farmingSystem.sync(building),spec=buildingDefinition(building).crop,worker=scene.workerSystem.workers.get(record.reservedBy);
    document.querySelector('#farming-title').textContent=buildingDefinition(building).name;
    document.querySelector('#farming-stage').textContent=`Stage ${record.stage}: ${spec.stages[record.stage]}`;
    document.querySelector('#farming-growth').value=record.growthDays/spec.growthDays*100;
    document.querySelector('#farming-time').textContent=scene.seasons?.season==='Winter'?`Winter dormancy · ${record.growthDays.toFixed(2)} / ${spec.growthDays} growth days preserved`:building.type==='orchard'&&scene.seasons?.season==='Spring'?'Spring blossom · Fruit develops in Summer':scene.farmingSystem.ripe(building)?'Ready for harvest':`${record.growthDays.toFixed(2)} / ${spec.growthDays} growth days`;
    document.querySelector('#farming-yield').textContent=`Harvest: ${spec.yield} ${scene.objectRegistry.require(spec.resource).name}`;
    document.querySelector('#farming-worker').textContent=worker?`${worker.name}: ${worker.workState}${worker.workTask?` · ${(Math.min(1,worker.workTask.progressMs/spec.workDuration)*100).toFixed(0)}%`:''}`:'Waiting for a Farmer from a Farmhouse within 15 tiles.';
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();}
  destroy(){this.close();this.controller.abort();}
}
