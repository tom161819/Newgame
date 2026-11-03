import { buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { findPathToAny,octileDistance } from '../game/pathfinding.js';
import { tileKey } from '../game/stones.js';
import { CONSTRUCTION_RULES } from '../data/construction.js';
import { initializeConstructionSite } from './ConstructionSite.js';
import { advanceConstruction } from './ConstructionProgress.js';
import { BuilderAI } from './BuilderAI.js';
import { ConstructionMaterialsSystem } from './ConstructionMaterialsSystem.js';

export class ConstructionSystem {
  constructor(scene,{onProgress=()=>{},onComplete=()=>{},onCancel=()=>{}}={}){
    Object.assign(this,{scene,onProgress,onComplete,onCancel});this.sites=new Map();this.assignments=new Map();this.nextId=Math.max(0,...scene.buildings.map(b=>b.id))+1;this.revision=0;
    this.builderAI=new BuilderAI(this);scene.workerSystem.jobs.setConstructionProvider(this.builderAI);
    this.kingWorking=false;
    this.materials=new ConstructionMaterialsSystem(this);
  }
  plan(building){
    if(building.construction)return building;
    building.id=Math.max(building.id,this.nextId);this.nextId=building.id+1;initializeConstructionSite(building);this.materials.registerLegacy(building);for(const tile of building.tiles)this.scene.map[tile.y][tile.x]=1;this.sites.set(building.id,building);this.revision++;return building;
  }
  actor(id){return id==='king'?this.scene.character:this.scene.workerSystem.workers.get(id);}
  slotKey(goal){return `construction-slot:${tileKey(goal)}`;}
  goals(site,actor){return towerNeighbors(site).filter(t=>this.scene.map[t.y]?.[t.x]===0&&this.scene.workerSystem.reservations.available(this.slotKey(t),actor.id));}
  reserve(site,actor,goal){
    if(!this.sites.has(site.id)||!this.materials.ready(site)||!actor.isAlive||this.assignments.has(actor.id)||site.construction.assignedBuilders.length>=CONSTRUCTION_RULES.maximumBuilders)return false;
    if(!this.scene.workerSystem.reservations.reserve(this.slotKey(goal),actor.id))return false;
    this.assignments.set(actor.id,{siteId:site.id,goal:{...goal}});site.construction.assignedBuilders.push(actor.id);
    if(actor.id!=='king')actor.workTask={kind:'build',targetId:site.id,reservation:this.slotKey(goal),goal:{...goal},progressMs:0};
    return true;
  }
  release(actor){
    const assigned=this.assignments.get(actor.id);if(!assigned)return;
    const site=this.sites.get(assigned.siteId);if(site)site.construction.assignedBuilders=site.construction.assignedBuilders.filter(id=>id!==actor.id);
    this.scene.workerSystem.reservations.release(this.slotKey(assigned.goal),actor.id);this.assignments.delete(actor.id);
  }
  atSite(actor,assignment){return actor.isAlive&&actor.state==='ground'&&!actor.nextTile&&!actor.path.length&&tileKey(actor.tile)===tileKey(assignment.goal);}
  activeBuilders(site){return site.construction.assignedBuilders.map(id=>({actor:this.actor(id),assignment:this.assignments.get(id)})).filter(p=>p.actor&&p.assignment&&this.atSite(p.actor,p.assignment));}
  commandKing(site){
    this.stopKing();const king=this.scene.character;
    this.scene.huntingSystem.cancel?.();this.scene.mountSystem.cancel?.();this.scene.treasureSystem.cancelRequest?.();
    if(!this.sites.has(site.id)||this.scene.gameOver||king.transitioning)return false;
    if(!this.materials.ready(site)){this.scene.setStatus('Waiting for construction materials. Use Deliver Materials.');return false;}
    this.scene.kingLogistics?.cancel();
    if(site.construction.assignedBuilders.length>=CONSTRUCTION_RULES.maximumBuilders){this.scene.setStatus('Na staveništi není volné pracovní místo (3 / 3).');return false;}
    if(king.mountedHorse&&!this.scene.mountSystem.dismount())return false;
    const goals=this.goals(site,king).sort((a,b)=>octileDistance(king.tile,a)-octileDistance(king.tile,b));
    const groundRoute=king.state==='ground'?findPathToAny(this.scene.map,king.nextTile??king.tile,goals):null;
    const candidates=groundRoute?[groundRoute.destination]:king.state==='ground'?[]:goals;
    for(const goal of candidates)if(this.reserve(site,king,goal)){
      if(king.command({kind:'move',goal,silent:true})){this.scene.worldCamera?.follow?.();site.unreachableReason='';this.scene.setStatus('Král jde na staveniště. Stavět začne až po příchodu.');return true;}
      this.release(king);
    }
    site.unreachableReason='K tomuto staveništi nevede dostupná cesta.';this.scene.setStatus(site.unreachableReason);return false;
  }
  stopKing(){
    const king=this.scene.character;if(!this.assignments.has('king'))return false;this.release(king);this.kingWorking=false;king.stopForBuilding();this.scene.setStatus('Král přerušil stavbu. Postup zůstává zachovaný.');return true;
  }
  update(delta){
    for(const site of [...this.sites.values()]){
      if(!this.materials.ready(site))continue;
      const participants=[];
      for(const id of [...site.construction.assignedBuilders]){
        const actor=this.actor(id),assignment=this.assignments.get(id);
        if(!actor?.isAlive||(id!=='king'&&actor.profession!=='builder')){if(actor)this.release(actor);continue;}
        if(assignment&&this.atSite(actor,assignment)){
          participants.push({id,speed:this.scene.skillSystem.workEfficiency(actor,'construction'),available:Math.min(delta,actor.availableWorkMs??0)});
          if(id==='king'&&!this.kingWorking){this.kingWorking=true;this.scene.setStatus(`Král staví ${buildingDefinition(site).name}. Jiným příkazem práci přerušíš.`);}
          if(id!=='king'){actor.workState='Working';actor.workMessage=`Building ${buildingDefinition(site).name}`;}
        }
      }
      const before=site.construction.workDone,complete=advanceConstruction(site,participants,delta);
      if(complete)this.finish(site);else if(before!==site.construction.workDone)this.onProgress(site);
    }
  }
  finish(site){
    const c=site.construction;if(!this.sites.has(site.id)||c.rewardsGranted||c.workDone<c.requiredWork)return false;
    if(!this.materials.complete(site))return false;
    c.state='complete';c.progress=100;c.rewardsGranted=true;
    if(buildingDefinition(site).walkable)for(const tile of site.tiles)this.scene.map[tile.y][tile.x]=0;
    for(const id of [...c.assignedBuilders]){const actor=this.actor(id);if(!actor)continue;if(id==='king')this.stopKing();else{this.scene.workerSystem.ai.cancel(actor);actor.workState='Searching for Work';actor.aiCooldown=0;}}
    c.assignedBuilders=[];this.sites.delete(site.id);this.revision++;
    const contributors=Object.entries(c.contributions).filter(([,work])=>work>0),total=contributors.reduce((sum,[,work])=>sum+work,0);let allocated=0;
    for(let i=0;i<contributors.length;i++){
      const [id,work]=contributors[i],ratio=i===contributors.length-1?1-allocated:work/total;allocated+=ratio;const actor=this.actor(id);
      if(actor?.isAlive)this.scene.activities.emit('buildingCompleted',{actor,objectType:site.type,quantity:1,contributionRatio:ratio,objectIds:[site.id]});
    }
    this.onComplete(site);return true;
  }
  cancel(site){
    if(!this.sites.has(site.id))return false;
    const c=site.construction,refund=Object.fromEntries(Object.entries(c.investedMaterials).map(([id,n])=>[id,c.workDone>0?Math.floor(n*.5):n]));
    for(const id of [...c.assignedBuilders]){const actor=this.actor(id);if(!actor)continue;if(id==='king')this.stopKing();else this.scene.workerSystem.ai.cancel(actor);}
    this.sites.delete(site.id);this.scene.buildings.splice(this.scene.buildings.indexOf(site),1);
    for(const tile of site.tiles)this.scene.map[tile.y][tile.x]=this.scene.terrainGrid[tile.y][tile.x];
    if(!this.materials.cancel(site,refund))for(const [id,n]of Object.entries(refund))this.scene.inventory.add(id,n);this.revision++;this.onCancel(site,refund);return true;
  }
  estimatedSeconds(site){const rate=this.activeBuilders(site).reduce((sum,p)=>sum+this.scene.skillSystem.workEfficiency(p.actor,'construction'),0);return rate?(site.construction.requiredWork-site.construction.workDone)/rate/1000:null;}
  exportState(){const king=this.assignments.get('king');return {nextId:Math.max(this.nextId,Math.max(0,...this.scene.buildings.map(b=>b.id))+1),kingSiteId:king?.siteId??null,kingGoal:king?.goal?{...king.goal}:null};}
  importState(data){
    this.sites=new Map(this.scene.buildings.filter(b=>!buildingIsComplete(b)).map(b=>[b.id,b]));this.assignments.clear();this.nextId=data?.nextId??Math.max(0,...this.scene.buildings.map(b=>b.id))+1;
    for(const worker of this.scene.workerSystem.workers.values())if(worker.workTask?.kind==='build')this.assignments.set(worker.id,{siteId:worker.workTask.targetId,goal:{...worker.workTask.goal}});
    if(data?.kingSiteId){const goal={...data.kingGoal};this.assignments.set('king',{siteId:data.kingSiteId,goal});this.scene.workerSystem.reservations.reserve(this.slotKey(goal),'king');}this.revision++;
  }
  destroy(){this.scene.workerSystem.jobs.setConstructionProvider(null);this.assignments.clear();this.sites.clear();}
}
