import { localized } from '../i18n/names.js';
import { t } from '../i18n/index.js';
import { buildingDefinition } from '../game/buildings.js';

export class FarmingPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#farming-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    this.ownership=document.createElement('p');this.ownership.id='farming-ownership';this.dialog.append(this.ownership);
    document.querySelector('#close-farming').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>this.restoreInput(),options);
  }
  open(building){this.building=building;this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open||!this.building)return;
    const scene=this.scene,building=this.building;if(!scene.buildings.includes(building)||!scene.fog.isVisibleObject(building)){this.close();return;}
    const record=scene.farmingSystem.sync(building),spec=buildingDefinition(building).crop,worker=scene.workerSystem.workers.get(record.reservedBy);
    const farm=scene.buildings.find(b=>b.id===building.farmId);this.ownership.textContent=farm?t('farmPlots.owner',{name:buildingDefinition(farm).name,id:farm.id}):t('farmPlots.orphan');
    document.querySelector('#farming-title').textContent=buildingDefinition(building).name;
    document.querySelector('#farming-stage').textContent=t('farming.stage',{stage:record.stage,name:localized(`crop.${building.type}.stage.${record.stage}`,spec.stages[record.stage])});
    document.querySelector('#farming-growth').value=record.growthDays/spec.growthDays*100;
    document.querySelector('#farming-time').textContent=scene.seasons?.season==='Winter'?t('farming.dormancy',{done:record.growthDays.toFixed(2),total:spec.growthDays}):building.type==='orchard'&&scene.seasons?.season==='Spring'?t('farming.blossom'):scene.farmingSystem.ripe(building)?t('farming.ready'):t('farming.growth',{done:record.growthDays.toFixed(2),total:spec.growthDays});
    document.querySelector('#farming-yield').textContent=t('farming.harvest',{count:spec.yield,resource:scene.objectRegistry.require(spec.resource).name});
    document.querySelector('#farming-worker').textContent=worker?`${worker.name}: ${worker.workState}${worker.workTask?` · ${(Math.min(1,worker.workTask.progressMs/spec.workDuration)*100).toFixed(0)}%`:''}`:t('farming.waiting');
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();}
  destroy(){this.close();this.controller.abort();this.ownership.remove();}
}
