import { workingCommand,commanded } from '../systems/UnitCommands.js';
import { AnimalController } from './AnimalController.js';
import { createExperience } from '../data/experience.js';
import { findPathToAny,canStep } from './pathfinding.js';

export class WorkerController extends AnimalController {
  constructor(scene,definition,id,tile,view,name){
    super(scene,definition,id,tile,view);
    Object.assign(this,{name,isSubject:true,diedAt:null,state:'ground',profession:'idle',displayProfession:'idle',manualRockId:null,workState:'Idle',workTask:null,assignedWorkplaceId:null,
      commandState:workingCommand(),experience:createExperience(definition),arriving:false,aiCooldown:0,workplaceReached:false,cargo:null,pendingWorkRewards:[],restPhase:null});
    scene.skillSystem.initialize(this);
  }
  reservedTiles(){return this.isAlive?super.reservedTiles():[];}
  moveTo(goals){const route=findPathToAny(this.scene.workerSystem?.navigationMap(this)??this.scene.map,this.nextTile??this.tile,goals,this.scene.pathWear?.routingOptions(this));this.path=route?.path??[];return !!route;}
  canEnterTile(tile){
    if(commanded(this))return this.scene.workerSystem.commands.canStep(this,tile);
    if(!this.scene.workplaceSystem)return true;
    if(canStep(this.scene.workerSystem.navigationMap(this),this.tile,tile))return true;
    this.path=[];this.aiCooldown=Math.min(this.aiCooldown,100);return false;
  }
  stop(){this.path=[];}
  update(delta){super.update(delta);this.view.setWorkPose?.(delta,this.profession==='farmer'&&this.workState==='Working'&&!this.walking);}
}
