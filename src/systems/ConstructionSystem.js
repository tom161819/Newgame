import { t } from '../i18n/index.js';
import { dataName } from '../i18n/names.js';
import { buildingDefinition,buildingIsComplete,towerNeighbors,placementError } from '../game/buildings.js';
import { findPathToAny,octileDistance } from '../game/pathfinding.js';
import { tileKey } from '../game/stones.js';
import { CONSTRUCTION_RULES } from '../data/construction.js';
import { initializeConstructionSite } from './ConstructionSite.js';
import { advanceConstruction } from './ConstructionProgress.js';
import { devFactor } from '../data/devBalance.js';
import { BuilderAI } from './BuilderAI.js';
import { ConstructionMaterialsSystem } from './ConstructionMaterialsSystem.js';
import { siteObstacle } from '../game/siteObstacles.js';

export class ConstructionSystem {
  constructor(scene,{onProgress=()=>{},onComplete=()=>{},onCancel=()=>{}}={}){
    Object.assign(this,{scene,onProgress,onComplete,onCancel});this.sites=new Map();this.assignments=new Map();this.nextId=Math.max(0,...scene.buildings.map(b=>b.id))+1;this.revision=0;
    this.builderAI=new BuilderAI(this);scene.workerSystem.jobs.setConstructionProvider(this.builderAI);
    this.kingWorking=false;
    this.materials=new ConstructionMaterialsSystem(this);
  }
  plan(building){
    if(building.construction)return building;
    building.id=Math.max(building.id,this.nextId);this.nextId=building.id+1;if(building.type==='quarry'&&!building.depositId)building.quarryMode='unbound';initializeConstructionSite(building);this.materials.registerLegacy(building);// S11: a pavement blueprint never blocks the way; people keep walking over it while it is laid.
    if(!building.unverified&&!buildingDefinition(building).pavement)for(const tile of building.tiles)this.scene.map[tile.y][tile.x]=1;this.sites.set(building.id,building);this.clearing()?.markPlan(building);this.revision++;this.scene.events?.emit('buildings:changed');return building;
  }
  // m-drevorubci-stromy: 0 for the first Granary / Lumberjack Hut site while none of its type is finished (1 for the
  // second type…), otherwise firstPriority.length. Builders take the lowest rank they can reach; Haulers supply it first.
  priorityRank(site){
    const rules=CONSTRUCTION_RULES.firstPriority,rank=rules.indexOf(site?.type);if(rank<0||site.demolition||site.repair||site.unverified)return rules.length;
    const s=this.scene;if(s.buildings.some(b=>b.type===site.type&&buildingIsComplete(b)))return rules.length;
    const first=[...this.sites.values()].filter(b=>b.type===site.type&&!b.unverified&&!b.demolition).reduce((a,b)=>!a||b.id<a.id?b:a,null);return first===site?rank:rules.length;
  }
  getSite(id){return this.sites.get(id)??this.scene.demolition?.site(id)??this.scene.repairs?.site(id)??null;}
  workSites(){return [...this.sites.values(),...(this.scene.demolition?.sites()??[]),...(this.scene.repairs?.sites()??[])];}
  // m-oznacovani-tezby (56): a wall, tower or gate is built only once its rocks and trees are gone (bushes do not block).
  clearing(){return this.scene.naturalResources?.miningWork.rocks??null;}
  obstructed(site){return !!this.clearing()?.obstructed(site)||this.occupied(site);}
  // Point 45 (owner 14 Nov 2026): a blueprint may lie under people, animals or goods; building waits until they are
  // gone. An idle resident standing there is sent beside the site.
  occupied(site){
    const s=this.scene,d=buildingDefinition(site);if(site.demolition===true||site.repair===true||d.pavement||d.walkable||!site.tiles)return false;
    const inside=new Set(site.tiles.map(t=>`${t.x},${t.y}`)),on=u=>!!u?.isAlive&&u.tile&&inside.has(`${u.tile.x},${u.tile.y}`);let found=false;
    if(s.character?.state==='ground'&&on(s.character))found=true;
    for(const a of s.animalSystem?.animals.values()??[])if(!a.mounted&&on(a)){found=true;break;}
    for(const w of s.workerSystem?.liveWorkers()??[])if(on(w)){found=true;if(!w.nextTile&&!w.path?.length&&w.commandState?.state!=='Holding'&&(w.stepAside??0)<=(s.gameTime?.totalElapsed??0)){w.stepAside=(s.gameTime?.totalElapsed??0)+3000;this.stepAside(w,site);}}
    if(!found)for(const drop of s.dropSystem?.drops.values()??[])if(inside.has(`${drop.tile.x},${drop.tile.y}`)){found=true;s.dropSystem.clearSite?.(site);break;}
    return found;
  }
  ready(site){return site.demolition===true||site.repair===true||this.materials.ready(site)&&!this.obstructed(site);}
  // The site's tiles are already closed, so the way out is searched with the resident's own tile opened.
  stepAside(worker,site){
    const s=this.scene,base=s.workerSystem?.navigationMap?.(worker)??s.map,map=base.map(row=>[...row]);for(const t of site.tiles)map[t.y][t.x]=0;
    const goals=towerNeighbors(site).filter(t=>base[t.y]?.[t.x]===0),route=goals.length?findPathToAny(map,worker.tile,goals,s.pathWear?.routingOptions(worker)):null;
    if(route?.path?.length){worker.path=route.path;worker.steppingAside=site.id;return true;}return false;
  }
  actor(id){return id==='king'?this.scene.character:this.scene.workerSystem.workers.get(id);}
  slotKey(goal){return `construction-slot:${tileKey(goal)}`;}
  goals(site,actor){const area=buildingDefinition(site).pavement?this.materials.area(site):null;return towerNeighbors(area?.host??site).filter(t=>this.scene.map[t.y]?.[t.x]===0&&this.scene.workerSystem.reservations.available(this.slotKey(t),actor.id));}
  canWork(site,actor){
    if(site?.demolition===true)return this.scene.demolition?.canWork(site,actor)??false;
    if(site?.repair===true)return this.scene.repairs?.canWork(site,actor)??false;
    if(!site||!actor||actor.commandState&&actor.commandState.state!=='Working')return false;
    return buildingDefinition(site).crop?actor.id!=='king'&&actor.profession==='farmer'&&!!this.scene.farmingSystem?.inRange(actor,site):actor.id==='king'||actor.profession==='builder';
  }
  workSkill(site){return !site.demolition&&buildingDefinition(site).crop?'farming':'construction';}
  // m-91 Dev tool: the Construction speed coefficient (also demolition and the time estimate).
  workSpeed(site,actor){return devFactor('construction')*this.scene.skillSystem.workEfficiency(actor,this.workSkill(site))*(!site.demolition&&buildingDefinition(site).crop?(this.scene.workplaceSystem?.workFactor?.(actor)??1):1)*(this.scene.builderWorkshops?.factor(actor)??1);}
  reserve(site,actor,goal){
    if(!this.getSite(site.id)||!this.canWork(site,actor)||!this.ready(site)||!actor.isAlive||this.assignments.has(actor.id)||site.construction.assignedBuilders.length>=CONSTRUCTION_RULES.maximumBuilders)return false;
    if(!this.scene.workerSystem.reservations.reserve(this.slotKey(goal),actor.id))return false;
    this.scene.workerSystem.gather?.release(actor);
    this.assignments.set(actor.id,{siteId:site.id,goal:{...goal}});site.construction.assignedBuilders.push(actor.id);
    if(actor.id!=='king')actor.workTask={kind:site.demolition?'dismantle':site.repair?'repair':'build',targetId:site.id,reservation:this.slotKey(goal),goal:{...goal},progressMs:0};
    return true;
  }
  release(actor){
    const assigned=this.assignments.get(actor.id);if(!assigned)return;
    const site=this.getSite(assigned.siteId);if(site)site.construction.assignedBuilders=site.construction.assignedBuilders.filter(id=>id!==actor.id);
    this.scene.workerSystem.reservations.release(this.slotKey(assigned.goal),actor.id);this.assignments.delete(actor.id);
  }
  atSite(actor,assignment){return actor.isAlive&&actor.state==='ground'&&!actor.nextTile&&!actor.path.length&&tileKey(actor.tile)===tileKey(assignment.goal);}
  activeBuilders(site){return site.construction.assignedBuilders.map(id=>({actor:this.actor(id),assignment:this.assignments.get(id)})).filter(p=>p.actor&&p.assignment&&this.canWork(site,p.actor)&&this.atSite(p.actor,p.assignment));}
  // fetch: the King first carries the missing materials himself, then builds.
  commandKing(site,{fetch=false}={}){
    if(buildingDefinition(site).crop){this.scene.setStatus(t('construction.farmerOnly'));return false;}
    this.stopKing();const king=this.scene.character;
    this.scene.huntingSystem.cancel?.();this.scene.mountSystem.cancel?.();this.scene.treasureSystem.cancelRequest?.();
    if(!this.sites.has(site.id)||this.scene.gameOver||king.transitioning)return false;
    if(this.obstructed(site)){this.scene.setStatus(t('construction.obstructed'));return false;}
    if(!this.materials.ready(site)){
      if(fetch&&this.scene.kingLogistics?.startMaterials(site,{build:true})){this.scene.setStatus(t('status.kingFetches'));return true;}
      this.scene.setStatus(t('status.waitMaterials'));return false;
    }
    this.scene.kingLogistics?.cancel();
    if(site.construction.assignedBuilders.length>=CONSTRUCTION_RULES.maximumBuilders){this.scene.setStatus(t('status.siteFull'));return false;}
    if(king.mountedHorse&&!this.scene.mountSystem.dismount())return false;
    const goals=this.goals(site,king).sort((a,b)=>octileDistance(king.tile,a)-octileDistance(king.tile,b));
    const groundRoute=king.state==='ground'?findPathToAny(this.scene.map,king.nextTile??king.tile,goals,this.scene.pathWear?.routingOptions(king)):null;
    const candidates=groundRoute?[groundRoute.destination]:king.state==='ground'?[]:goals;
    for(const goal of candidates)if(this.reserve(site,king,goal)){
      if(king.command({kind:'move',goal,silent:true})){this.scene.worldCamera?.follow?.();site.unreachableReason='';this.scene.setStatus(t('status.kingToSite'));return true;}
      this.release(king);
    }
    site.unreachableReason=t('status.noSitePath');this.scene.setStatus(site.unreachableReason);return false;
  }
  stopKing(){
    const king=this.scene.character;if(!this.assignments.has('king'))return false;this.release(king);this.kingWorking=false;king.stopForBuilding();this.scene.setStatus(t('status.kingStopped'));return true;
  }
  // A provisional blueprint (placed outside sight) is checked once its whole site is seen. A hidden obstacle cancels the
  // whole order at once; otherwise the site claims its tiles and building may start. Units standing on it are waited for.
  verifyProvisional(site){
    const fog=this.scene.fog;if(fog?.enabled&&!site.tiles.every(tile=>fog.isInSightTile(tile)))return false;
    const d=buildingDefinition(site),others=this.scene.buildings.filter(b=>b!==site);
    // m-zelezny-dul-misto: the cancelled order names its reason (Rock, Tree, Out of deposit range…) in Notices.
    if(placementError(this.scene.map,site,this.scene.resourceOccupancy,[],d,others,{status:()=>({unlocked:true})})){this.cancel(site,{obstacle:true,reason:siteObstacle(this.scene,{x:site.x,y:site.y},d,{ignore:site})});return false;}
    // reservedTiles() also lists building footprints (this site included); only units standing on the site make it wait.
    const footprints=new Set(this.scene.buildings.flatMap(b=>b.tiles).map(tileKey)),occupied=new Set((this.scene.reservedTiles?.()??[]).map(tileKey).filter(key=>!footprints.has(key)));
    if(site.tiles.some(tile=>occupied.has(tileKey(tile))))return false;
    delete site.unverified;for(const tile of site.tiles)this.scene.map[tile.y][tile.x]=1;this.clearing()?.markPlan(site);
    const natural=this.scene.resourceOccupancy?.naturalContext;if(natural){natural.mining.bind(site);natural.topologyRevision++;}
    this.scene.terrain?.invalidateArea(site.tiles);this.revision++;this.scene.events?.emit('buildings:changed');return true;
  }
  update(delta){
    this.materials.syncAreas();
    for(const site of [...this.sites.values()])if(site.unverified)this.verifyProvisional(site);
    // Point 45: people under a blueprint are asked to step off even before its materials arrive (twice a second).
    this.asideTick=(this.asideTick??0)+delta;if(this.asideTick>=500){this.asideTick=0;for(const site of this.sites.values())if(!site.unverified)this.occupied(site);}
    for(const site of [...this.sites.values()]){
      if(site.unverified||!this.materials.ready(site)||this.obstructed(site))continue;
      const participants=[];
      for(const id of [...site.construction.assignedBuilders]){
        const actor=this.actor(id),assignment=this.assignments.get(id);
        if(!actor?.isAlive||!this.canWork(site,actor)){if(actor){if(id==='king')this.stopKing();else this.scene.workerSystem.ai.cancel(actor);}continue;}
        if(assignment&&this.atSite(actor,assignment)){
          participants.push({id,speed:this.workSpeed(site,actor),available:Math.min(delta,actor.availableWorkMs??0)});
          if(id==='king'&&!this.kingWorking){this.kingWorking=true;this.scene.setStatus(t('status.kingBuilds',{name:buildingDefinition(site).name}));}
          if(id!=='king'){actor.workState='Working';actor.workMessage=`${buildingDefinition(site).crop?'Establishing':'Building'} ${dataName(buildingDefinition(site))}`;}
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
    // #150: pavement laid under a finished building leaves that building's tiles blocked.
    if(buildingDefinition(site).walkable&&!(buildingDefinition(site).pavement&&this.materials.area(site).host))for(const tile of site.tiles)this.scene.map[tile.y][tile.x]=0;
    for(const id of [...c.assignedBuilders]){const actor=this.actor(id);if(!actor)continue;if(id==='king')this.stopKing();else{this.scene.workerSystem.ai.cancel(actor);actor.workState='Searching for Work';actor.aiCooldown=0;}}
    c.assignedBuilders=[];this.sites.delete(site.id);this.revision++;
    const contributors=Object.entries(c.contributions).filter(([,work])=>work>0),total=contributors.reduce((sum,[,work])=>sum+work,0);let allocated=0;
    for(let i=0;i<contributors.length;i++){
      const [id,work]=contributors[i],ratio=i===contributors.length-1?1-allocated:work/total;allocated+=ratio;const actor=this.actor(id);
      if(actor?.isAlive)this.scene.activities.emit('buildingCompleted',{actor,objectType:site.type,quantity:1,contributionRatio:ratio,objectIds:[site.id]});
    }
    // S11: a finished pavement tile becomes the terrain surface layer; its site record goes away.
    if(buildingDefinition(site).pavement){const i=this.scene.buildings.indexOf(site);if(i>=0)this.scene.buildings.splice(i,1);this.scene.pathWear?.setPaved(site,true);}
    this.clearing()?.planFinished(site);
    this.scene.events?.emit('buildings:changed');this.onComplete(site);return true;
  }
  // obstacle: a provisional site found blocked; reported once as constructionCancelled (reason obstacle).
  cancel(site,{obstacle=false,reason=null}={}){
    if(!this.sites.has(site.id))return false;
    const c=site.construction,refund=Object.fromEntries(Object.entries(c.investedMaterials).map(([id,n])=>[id,c.workDone>0?Math.floor(n*.5):n]));
    for(const id of [...c.assignedBuilders]){const actor=this.actor(id);if(!actor)continue;if(id==='king')this.stopKing();else this.scene.workerSystem.ai.cancel(actor);}
    this.sites.delete(site.id);this.scene.buildings.splice(this.scene.buildings.indexOf(site),1);this.clearing()?.clearPlan(site.id);
    // A provisional site never claimed its tiles, so the map under it is left exactly as it is.
    if(!site.unverified){for(const tile of site.tiles)this.scene.map[tile.y][tile.x]=this.scene.terrainGrid[tile.y][tile.x];this.scene.naturalResources?.mining.restoreTiles(site.tiles);}
    if(!this.materials.cancel(site,refund))for(const [id,n]of Object.entries(refund))this.scene.inventory.add(id,n,{source:'Construction Refund',type:'refund',id:`construction-refund:${site.id}:${id}`,entityId:site.id});this.revision++;this.scene.events?.emit('buildings:changed');this.onCancel(site,refund);
    if(obstacle){this.scene.activities?.emit('constructionCancelled',{reason:'obstacle',obstacle:reason,objectType:site.type,objectIds:[site.id],tile:{x:site.x,y:site.y}});this.scene.setStatus?.(t('status.obstacleFound',{name:buildingDefinition(site).name}));}
    return true;
  }
  estimatedSeconds(site){const rate=this.activeBuilders(site).reduce((sum,p)=>sum+this.workSpeed(site,p.actor),0);return rate?(site.construction.requiredWork-site.construction.workDone)/rate/1000:null;}
  exportState(){const king=this.assignments.get('king');return {nextId:Math.max(this.nextId,Math.max(0,...this.scene.buildings.map(b=>b.id))+1),kingSiteId:king?.siteId??null,kingGoal:king?.goal?{...king.goal}:null};}
  importState(data){
    this.sites=new Map(this.scene.buildings.filter(b=>!buildingIsComplete(b)).map(b=>[b.id,b]));this.assignments.clear();this.nextId=data?.nextId??Math.max(0,...this.scene.buildings.map(b=>b.id))+1;
    for(const worker of this.scene.workerSystem.workers.values())if(['build','dismantle','repair'].includes(worker.workTask?.kind))this.assignments.set(worker.id,{siteId:worker.workTask.targetId,goal:{...worker.workTask.goal}});
    if(data?.kingSiteId){const goal={...data.kingGoal};this.assignments.set('king',{siteId:data.kingSiteId,goal});this.scene.workerSystem.reservations.reserve(this.slotKey(goal),'king');}this.revision++;
  }
  destroy(){this.scene.workerSystem.jobs.setConstructionProvider(null);this.assignments.clear();this.sites.clear();}
}
