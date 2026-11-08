import { workingCommand,commanded } from '../systems/UnitCommands.js';
import { AnimalController } from './AnimalController.js';
import { createExperience } from '../data/experience.js';
import { findPathToAny,canStep } from './pathfinding.js';
import { language } from '../i18n/index.js';
import { shortName,fullName } from '../data/names.js';

export class WorkerController extends AnimalController {
  constructor(scene,definition,id,tile,view,name){
    super(scene,definition,id,tile,view);
    Object.assign(this,{name,identity:null,sleepingIn:null,isSubject:true,diedAt:null,state:'ground',profession:'idle',displayProfession:'idle',manualRockId:null,workState:'Idle',workTask:null,assignedWorkplaceId:null,
      commandState:workingCommand(),experience:createExperience(definition),arriving:false,aiCooldown:0,workplaceReached:false,cargo:null,pendingWorkRewards:[],restPhase:null});
    scene.skillSystem.initialize(this);
  }
  // m-obyvatele-jmena-spanek-pohyb (31): `identity` (language-neutral indices) names the resident in the current
  // language; a resident without one (a thief, an old fixture) keeps the plain name he was given.
  get name(){return this.identity?shortName(this.identity,language()):this.fixedName;}
  set name(value){this.fixedName=value;}
  get fullName(){return this.identity?fullName(this.identity,language()):this.fixedName;}
  // (42): a resident sleeping inside his House or the Castle neither blocks a tile nor shows.
  reservedTiles(){return this.isAlive&&this.sleepingIn==null?super.reservedTiles():[];}
  moveTo(goals){const route=findPathToAny(this.scene.workerSystem?.navigationMap(this)??this.scene.map,this.nextTile??this.tile,goals,this.scene.pathWear?.routingOptions(this));this.path=route?.path??[];return !!route;}
  canEnterTile(tile){
    if(commanded(this))return this.scene.workerSystem.commands.canStep(this,tile);
    if(!this.scene.workplaceSystem)return true;
    if(canStep(this.scene.workerSystem.navigationMap(this),this.tile,tile))return true;
    // m-obyvatele-jmena-spanek-pohyb (43): a random short wait, so two residents blocking each other never mirror
    // each other's detours forever (a livelock the slower walk exposed).
    this.path=[];this.aiCooldown=100+Math.floor(Math.random()*400);return false;
  }
  stop(){this.path=[];}
  update(delta){super.update(delta);this.view.setWorkPose?.(delta,this.profession==='farmer'&&this.workState==='Working'&&!this.walking);this.view.setSeated?.(!!this.seated&&!this.walking);}
}
