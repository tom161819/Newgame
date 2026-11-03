import { AnimalController } from './AnimalController.js';
import { createExperience } from '../data/experience.js';

export class WorkerController extends AnimalController {
  constructor(scene,definition,id,tile,view,name){
    super(scene,definition,id,tile,view);
    Object.assign(this,{name,state:'ground',profession:'idle',workState:'Idle',workTask:null,assignedWorkplaceId:null,
      experience:createExperience(definition),arriving:false,aiCooldown:0});
    scene.skillSystem.initialize(this);
  }
  reservedTiles(){return this.isAlive?super.reservedTiles():[];}
  stop(){this.path=[];}
}
