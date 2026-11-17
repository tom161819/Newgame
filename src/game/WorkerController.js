import { advanceMovement } from './movement.js';
import { workingCommand,commanded } from '../systems/UnitCommands.js';
import { AnimalController } from './AnimalController.js';
import { createExperience } from '../data/experience.js';
import { findPathToAny,canStep } from './pathfinding.js';
import { language } from '../i18n/index.js';
import { shortName,fullName } from '../data/names.js';
import { fishingInfo } from './fishingAnim.js';

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
  moveTo(goals){
    // Owner 17 Nov 2026: one walking down from the walls plans from the foot of his way down and goes on after it.
    if(this.wallDescent){const route=findPathToAny(this.scene.workerSystem?.navigationMap(this)??this.scene.map,this.wallDescent.ground,goals,this.scene.pathWear?.routingOptions(this));this.wallDescent.then=route?.path??[];return !!route;}
    const route=findPathToAny(this.scene.workerSystem?.navigationMap(this)??this.scene.map,this.nextTile??this.tile,goals,this.scene.pathWear?.routingOptions(this));this.path=route?.path??[];return !!route;}
  canEnterTile(tile){
    /* Point 45: a resident standing under a new blueprint may always step off it. */if(this.steppingAside!=null){const site=this.scene.buildings?.find(b=>b.id===this.steppingAside),inside=t=>!!site?.tiles?.some(p=>p.x===t.x&&p.y===t.y);if(site&&inside(this.tile)&&!this.scene.buildings.some(b=>b!==site&&b.tiles?.some(p=>p.x===tile.x&&p.y===tile.y)))return true;if(!site||!inside(this.tile))this.steppingAside=null;}
    if(this.onWall)return true;/* m-hlidka-hradby: on the wall walk the route is already a chain of joined walls */
    if(commanded(this))return this.scene.workerSystem.commands.canStep(this,tile);
    if(!this.scene.workplaceSystem)return true;
    if(canStep(this.scene.workerSystem.navigationMap(this),this.tile,tile))return true;
    // m-obyvatele-jmena-spanek-pohyb (43): a random short wait, so two residents blocking each other never mirror
    // each other's detours forever (a livelock the slower walk exposed).
    this.path=[];this.aiCooldown=100+Math.floor(Math.random()*400);return false;
  }
  stop(){this.path=[];}
  update(delta){
    // Anything else taking over (rest at night, a new job, death) brings him down from the wall first.
    if(this.onWall&&(!this.isAlive||!this.wallDescent&&(!this.wallPatrol||(this.scene.gameTime?.totalElapsed??0)-(this.wallPatrol.lastTick??0)>1500)))this.scene.military?.wallPatrol?.leave(this);
    if(this.onWall&&this.isAlive){this.availableWorkMs=0;advanceMovement(this,delta);if(this.wallDescent&&!this.nextTile&&!this.path.length)this.scene.military?.wallPatrol?.land(this);if(this.onWall){this.scene.military?.wallPatrol?.place(this);this.view.animate?.(delta,this.walking,this.direction);return;}}
    super.update(delta);this.view.setWorkPose?.(delta,this.profession==='farmer'&&this.workState==='Working'&&!this.walking);this.view.setSeated?.(!!this.seated&&!this.walking);
    if(this.profession==='fisher'||this.fishingView)this.fishingView=!!this.view.setFishing?.(delta,fishingInfo(this,this.scene));}
}
