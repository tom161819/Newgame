import { devProduction } from '../data/devBalance.js';
import { TORCHES } from '../data/torches.js';
export const TORCH_TARGET_MAX=60;
import { dataName } from '../i18n/names.js';
import { FOOD_RULES,FOOD_RESOURCE_IDS } from '../data/foodProduction.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { advanceConstruction } from './ConstructionProgress.js';
import { tileKey } from '../game/stones.js';
import { carryCapacity,VEHICLES } from '../data/logistics.js';
import { recipeFor,defaultRecipeKey ,withoutFuel} from '../data/production.js';

const first=object=>Object.entries(object)[0];
export class FoodProductionSystem {
  constructor(scene){this.scene=scene;this.records=new Map();this.nextTransfer=1;this.nextEmployment=0;for(const b of scene.buildings)this.register(b);}
  get storage(){return this.scene.foodStorage;}
  // S12: the recipe the next batch uses (a workshop with choices keeps the player's choice in its record).
  recipe(building){return this.fuelled(recipeFor(buildingDefinition(building),this.records.get(building.id)?.recipe));}
  // A running batch keeps the inputs it started with (a batch from before a recipe gained fuel finishes without it).
  cycleRecipe(record,building){const recipe=this.fuelled(recipeFor(buildingDefinition(building),record.cycle?.recipe??record.recipe));const inputs=record.cycle?.inputs;
    if(!inputs||JSON.stringify(Object.keys(inputs).sort())===JSON.stringify(Object.keys(recipe.input).sort())&&Object.entries(inputs).every(([k,v])=>recipe.input[k]===v))return recipe;
    return {...recipe,input:{...inputs}};}
  fuelled(recipe){return this.storage?.physicalMaterials?recipe:withoutFuel(recipe);}
  // m-smolar-pochodne (owner, 12 Nov): at a workshop that picks its recipe itself (Pitch Kiln) the player's choice now
  // holds – `recipeMode` is 'auto' (the workshop picks, as before) or the chosen recipe. Other workshops are unchanged.
  setRecipe(buildingId,key){
    const record=this.records.get(buildingId),b=record&&this.building(buildingId),d=b&&buildingDefinition(b);if(!d?.recipes)return false;
    if(key==='auto'){if(!d.recipeChoice)return false;record.recipeMode='auto';this.chooseRecipes();this.scene.logisticsTasks?.invalidate?.();return true;}
    if(!Object.hasOwn(d.recipes,key)||d.recipes[key].retired)return false;record.recipe=key;if(d.recipeChoice)record.recipeMode=key;this.scene.logisticsTasks?.invalidate?.();return true;
  }
  recipeMode(building){const record=this.records.get(building.id),d=buildingDefinition(building);return d.recipeChoice?record?.recipeMode??'auto':record?.recipe;}
  // How many Torches the stores should hold before an automatic Pitch Kiln goes back to Pitch (per kiln, 0–torchTargetMax).
  torchTarget(building){const v=this.records.get(building?.id)?.torchTarget;return Number.isInteger(v)?v:TORCHES.torchTarget;}
  setTorchTarget(buildingId,value){const record=this.records.get(buildingId),v=Math.round(Number(value));if(!record||!Number.isFinite(v)||v<0||v>TORCH_TARGET_MAX)return false;record.torchTarget=v;this.chooseRecipes();return true;}
  // m-nosici-trakar-pracoviste (62): how much of one input a carrier tops the input buffer up to. A Hauler with a
  // Wheelbarrow or Horse Wagon fills a food workshop (Mill, Bakery) for as many whole batches as the buffer holds, also
  // while a batch runs, so one trip is a full load; everyone else (and every non-food workshop) brings one batch
  // between batches, as before. `bulk` true asks for the vehicle target (the Hauler catalog, which has no worker yet).
  inputTarget(building,resource,{bulk=false}={}){
    const recipe=this.recipe(building),need=recipe.input[resource]??0,record=this.records.get(building.id);if(!need)return 0;
    if(!bulk||!Object.keys(recipe.input).every(id=>FOOD_RESOURCE_IDS.includes(id)||recipe.fuel?.[id]))return record?.cycle?0:need;
    const batch=Object.values(recipe.input).reduce((a,b)=>a+b,0);return need*Math.max(1,Math.floor((buildingDefinition(building).bufferCapacity??batch)/batch));
  }
  bulkCarrier(worker){return worker?.profession==='hauler'&&!!VEHICLES[worker.vehicleType];}
  inputShortage(building){const recipe=this.recipe(building);if(Object.keys(recipe.input).length<2)return null;const input=this.storage.locations.get(`input-${building.id}`);return Object.entries(recipe.input).find(([resource,amount])=>(input?.stock[resource]??0)+this.storage.incoming(input?.id,resource)+this.storage.available(resource)<amount)?.[0]??null;}
  building(id){return this.scene.buildings.find(b=>b.id===id&&buildingIsComplete(b)&&buildingDefinition(b).recipe)??null;}
  register(building){
    if(!buildingIsComplete(building)||!buildingDefinition(building).recipe)return;
    this.storage.register(building);
    if(!this.records.has(building.id)){const key=defaultRecipeKey(buildingDefinition(building));this.records.set(building.id,{buildingId:building.id,auto:true,nextCycle:1,cycle:null,outputReservation:null,completed:0,...(key?{recipe:key}:{})});}
  }
  cancelWorker(worker){
    const task=worker.workTask;if(!['foodPickup','foodDeliver','produce','harvest'].includes(task?.kind))return;
    if(task.hauling&&task.kind==='foodDeliver'&&worker.cargo)worker.cargo.transportCancelled=true;
    if(task.stockReservation){if(task.siteId!=null)this.scene.constructionSystem.materials.returnAllocation(task.stockReservation);else this.storage.release(task.stockReservation);}
    const capacity=this.storage.reservations.get(task.capacityReservation);
    if(capacity?.owner===task.transferId||task.kind==='harvest')this.storage.release(task.capacityReservation);
  }
  setTask(worker,kind,route,data={}){
    const id=data.transferId??`food-transfer-${this.nextTransfer++}`,reservation=kind==='produce'?`production-slot:${tileKey(route.destination)}`:`food-task:${id}`;
    if(!this.scene.workerSystem.reservations.reserve(reservation,worker.id))return false;
    worker.workTask={...data,kind,goal:{...route.destination},progressMs:0,reservation,transferId:id};worker.path=route.path;
    worker.workState=kind==='produce'?'Working':'Traveling to Target';worker.workMessage=kind==='produce'?'Producing resources':'Transporting resources';return true;
  }
  // m-pracovnici-odnaseji-vyrobky (owner, 12 Nov): when a producer's own pile is full, one of its workers carries a load
  // to the nearest store that takes it and then works on. Not while a Hauler already has the pile's goods reserved, and
  // only one worker of the building at a time.
  // Resources lying free in a production output buffer, `first` (the current recipe's product) leading.
  outputResources(outputId,first){
    const location=this.storage.locations.get(outputId);if(!location)return [];
    return [...new Set([first,...Object.keys(location.stock??{})])].filter(resource=>this.storage.free(outputId,resource)>0);
  }
  carryOwnOutput(worker,building){
    const pile=this.storage.pileFor?.(building);if(!pile||worker.cargo||worker.workTask)return false;
    const resource=pile.allowed[0],free=this.storage.free(pile.id,resource);if(free<=0)return false;
    if(this.scene.workerSystem.liveWorkers().some(w=>w!==worker&&w.assignedWorkplaceId===building.id&&(w.workTask?.sourceId===pile.id)))return false;
    const amount=Math.min(free,carryCapacity(worker,resource)),route=this.storage.findDestination(worker,resource,amount);
    if(!route||route.location.id===pile.id||route.location.kind==='pile')return false;
    return this.move(worker,pile.id,route.location.id,resource,amount);
  }
  move(worker,sourceId,destinationId,resource,amount,{capacityReservation=null,outputBuildingId=null,hauling=false,siteId=null,allocationId=null}={}){
    const source=this.storage.locations.get(sourceId),destination=this.storage.locations.get(destinationId);if(!source||!destination)return false;
    if(sourceId===destinationId||amount>carryCapacity(worker,resource))return false;
    const route=this.storage.route(worker,[source]);if(!route)return false;
    const transferId=`food-transfer-${this.nextTransfer++}`;
    const allocation=allocationId&&this.storage.reservations.get(allocationId);if(allocationId&&(!allocation||allocation.owner!==`site-${siteId}`||allocation.siteId!==siteId||allocation.locationId!==sourceId||allocation.resource!==resource))return false;
    const stockReservation=allocationId?this.storage.splitStock(allocationId,amount,transferId):this.storage.reserve('stock',sourceId,resource,amount,transferId);if(!stockReservation)return false;
    const capacity=capacityReservation??this.storage.reserve('capacity',destinationId,resource,amount,transferId);
    if(!capacity){if(allocationId)this.scene.constructionSystem.materials.returnAllocation(stockReservation);else this.storage.release(stockReservation);return false;}
    if(siteId!=null)this.storage.reservations.get(capacity).siteId=siteId;
    if(!this.setTask(worker,'foodPickup',route,{transferId,sourceId,destinationId,resource,amount,stockReservation,capacityReservation:capacity,outputBuildingId,...(hauling?{hauling:true}: {}),...(siteId!=null?{siteId}:{})})){
      if(allocationId)this.scene.constructionSystem.materials.returnAllocation(stockReservation);else this.storage.release(stockReservation);if(!capacityReservation)this.storage.release(capacity);return false;
    }
    return true;
  }
  source(task){
    if(!task.sourceDropId)return this.storage.locations.get(task.sourceId);
    const drop=this.scene.dropSystem.drops.get(task.sourceDropId);return drop?{id:drop.id,kind:'ground',...drop.tile,width:1,height:1}:null;
  }
  moveGround(worker,drop,destinationId,amount,{hauling=true,siteId=drop.siteId??null}={}){
    if(amount>carryCapacity(worker,drop.resource)||amount>drop.amount||this.scene.character.order?.dropId===drop.id)return false;
    const source=this.source({sourceDropId:drop.id}),route=source&&this.storage.route(worker,[source]);if(!route)return false;
    const reservation=`drop:${drop.id}`;if(!this.scene.workerSystem.reservations.reserve(reservation,worker.id))return false;
    const transferId=`food-transfer-${this.nextTransfer++}`,capacityReservation=this.storage.reserve('capacity',destinationId,drop.resource,amount,transferId);
    if(capacityReservation&&siteId!=null)this.storage.reservations.get(capacityReservation).siteId=siteId;
    if(!capacityReservation||!this.setTask(worker,'foodPickup',route,{transferId,sourceDropId:drop.id,destinationId,resource:drop.resource,amount,capacityReservation,...(hauling?{hauling:true}:{}),...(siteId!=null?{siteId}:{})})){
      this.storage.release(capacityReservation);this.scene.workerSystem.reservations.release(reservation,worker.id);return false;
    }
    return true;
  }
  prepareHarvest(worker,building,task){
    const crop=buildingDefinition(building).crop,route=this.storage.findDestination(worker,crop.resource,crop.yield);if(!route)return false;
    const transferId=`food-transfer-${this.nextTransfer++}`,capacityReservation=this.storage.reserve('capacity',route.location.id,crop.resource,crop.yield,transferId);if(!capacityReservation)return false;
    task.destinationId=route.location.id;task.capacityReservation=capacityReservation;task.transferId=transferId;return true;
  }
  harvest({worker,resource,amount}){
    worker.cargo={resource,amount};this.startDelivery(worker);
  }
  startDelivery(worker){
    const cargo=worker.cargo;if(!cargo)return false;
    const site=cargo.siteId!=null&&this.scene.constructionSystem?.materials.site(cargo.siteId),siteLocation=site&&this.storage.locations.get(`site-${site.id}`);
    if(cargo.siteId!=null&&!site)delete cargo.siteId;
    const route=siteLocation?this.storage.route(worker,[siteLocation]):this.storage.findDestination(worker,cargo.resource,cargo.amount,{partial:true});if(!route){worker.workState='Waiting';worker.workMessage='Waiting for reachable storage capacity';worker.aiCooldown=FOOD_RULES.searchInterval;return false;}
    const amount=Math.min(cargo.amount,this.storage.room(route.location.id,cargo.resource),carryCapacity(worker,cargo.resource)),transferId=`food-transfer-${this.nextTransfer++}`;
    const capacityReservation=this.storage.reserve('capacity',route.location.id,cargo.resource,amount,transferId);if(!capacityReservation)return false;
    if(site)this.storage.reservations.get(capacityReservation).siteId=site.id;
    if(!this.setTask(worker,'foodDeliver',route,{transferId,destinationId:route.location.id,resource:cargo.resource,amount,capacityReservation,...(site?{siteId:site.id}:{}),...(cargo.rockId!=null&&worker.profession==='miner'&&(worker.assignedWorkplaceId==null||worker.clearingLoan)?{manualMining:true,rockId:cargo.rockId}:{})})){this.storage.release(capacityReservation);return false;}
    return true;
  }
  handles(worker){return ['foodPickup','foodDeliver'].includes(worker.workTask?.kind)||!!worker.cargo&&this.storage.manages(worker.cargo.resource);}
  handleTransport(worker){
    if(!this.handles(worker))return false;
    const task=worker.workTask;
    if(!['foodPickup','foodDeliver'].includes(task?.kind)){
      if(worker.aiCooldown<=0)this.startDelivery(worker);return true;
    }
    const id=task.kind==='foodPickup'?task.sourceId:task.destinationId,location=task.kind==='foodPickup'?this.source(task):this.storage.locations.get(id);
    if(!location||!this.storage.locations.has(task.destinationId)||!this.storage.reservations.has(task.capacityReservation)||task.kind==='foodPickup'&&task.stockReservation&&!this.storage.reservations.has(task.stockReservation)){
      this.scene.workerSystem.ai.cancel(worker);return true;
    }
    worker.workState=task.kind==='foodPickup'?'Traveling to Target':'Returning';worker.workMessage=`${task.kind==='foodPickup'?'Collecting':'Carrying'} ${worker.cargo?.amount??task.amount} ${task.resource}`;
    const atSource=task.sourceDropId&&task.kind==='foodPickup'?this.scene.workerSystem.ai.atGoal(worker,location):this.storage.atLocation(worker,id);
    if(!atSource&&!worker.nextTile&&!worker.path.length&&worker.aiCooldown<=0){
      worker.aiCooldown=FOOD_RULES.searchInterval;const route=this.storage.route(worker,[location]);if(route){task.goal={...route.destination};worker.path=route.path;}
      else{worker.workState='Waiting';worker.workMessage='Transport route is blocked';}
    }
    return true;
  }
  updateWorker(worker){
    const building=this.scene.workplaceSystem.building(worker),record=building&&this.records.get(building.id);
    if(!record){worker.workState='Waiting';worker.workMessage='Waiting for production workplace';return;}
    const recipe=record.cycle?this.cycleRecipe(record,building):this.recipe(building),outputId=`output-${building.id}`,inputId=`input-${building.id}`;
    if(worker.workTask?.kind==='produce'){
      if(!record.auto){this.scene.workerSystem.ai.cancel(worker);worker.workState='Waiting';worker.workMessage='Auto Production OFF';return;}
      // A worker waiting at the bench for a batch that cannot start because the output buffer is still full goes to
      // carry it out (the Pitch Kiln stalled here after switching recipe).
      if(!record.cycle&&this.outputResources(outputId,first(recipe.output)[0]).length&&!this.scene.workerSystem.liveWorkers().some(w=>w!==worker&&w.assignedWorkplaceId===building.id&&w.workTask?.sourceId===outputId)){this.scene.workerSystem.ai.cancel(worker);worker.aiCooldown=0;}
      else{
      if(!this.scene.workplaceSystem.atWorkplace(worker)&&!worker.nextTile&&!worker.path.length)worker.moveTo(this.scene.workplaceSystem.goals(worker));
      worker.workState='Working';worker.workMessage=`Producing ${first(recipe.output)[0]}`;return;}
    }
    if(worker.workTask||worker.aiCooldown>0)return;
    worker.aiCooldown=FOOD_RULES.searchInterval;
    const [outputResource,outputAmount]=first(recipe.output);
    // Fix (owner 13 Nov, Pitch Kiln stops after its first batch): the output buffer can still hold the product of the
    // other recipe (Pitch after the kiln switched to Torches). A new batch waits for an empty buffer, so the workers
    // carry out whatever lies there, the current recipe's product first.
    for(const resource of this.outputResources(outputId,outputResource)){
      const outputAvailable=this.storage.free(outputId,resource),own=resource===outputResource;
      let cap=this.storage.reservations.get(record.outputReservation);if(cap?.resource!==resource)cap=null;let destination=cap&&this.storage.locations.get(cap.locationId);
      if(!destination){const route=this.storage.findDestination(worker,resource,Math.min(outputAvailable,carryCapacity(worker,resource)));if(route)destination=route.location;}
      if(destination&&!this.scene.logisticsTasks?.waitForHauler(building,'output')&&this.move(worker,outputId,destination.id,resource,Math.min(outputAvailable,carryCapacity(worker,resource)),{capacityReservation:cap?.id,outputBuildingId:building.id}))return;
    }
    if(!record.auto){worker.workState='Waiting';worker.workMessage='Auto Production OFF';return;}
    const input=this.storage.locations.get(inputId),missing=Object.entries(recipe.input).find(([resource,needed])=>(input.stock[resource]??0)+this.storage.incoming(inputId,resource)<needed);
    if(!record.cycle&&missing){
      const shortage=this.inputShortage(building);if(shortage){worker.workState='Waiting';worker.workMessage=`Waiting for ${shortage}`;return;}
      const [resource,needed]=missing,incoming=this.storage.incoming(inputId,resource);
      if(this.scene.logisticsTasks?.waitForHauler(building,'input')){worker.workState='Waiting';worker.workMessage=`Waiting for Hauler delivery of ${resource}`;return;}
      const source=this.storage.findSource(worker,resource),destinationRoute=this.storage.route(worker,[input]);
      if(source&&destinationRoute){const amount=Math.min(needed-(input.stock[resource]??0)-incoming,this.storage.free(source.location.id,resource),carryCapacity(worker,resource));
        if(amount>0&&this.move(worker,source.location.id,inputId,resource,amount))return;}
      worker.workState='Waiting';worker.workMessage=`Waiting for ${resource}`;return;
    }
    const undelivered=Object.entries(recipe.input).find(([resource,needed])=>(input.stock[resource]??0)<needed);
    if(!record.cycle&&undelivered){worker.workState='Waiting';worker.workMessage=`Waiting for delivered ${undelivered[0]}`;return;}
    if(!record.cycle&&recipe.horse&&!this.scene.stables?.freeHorse()){worker.workState='Waiting';worker.workMessage='Waiting for a tamed horse in the Stables';return;}
    if(!record.cycle&&!recipe.vehicle&&!this.storage.findDestination(worker,outputResource,outputAmount)){worker.workState='Waiting';worker.workMessage='Storage is full or unreachable';return;}
    const route=this.storage.route(worker,[input]);
    if(route&&this.setTask(worker,'produce',route,{targetId:building.id})){worker.workState='Working';worker.workMessage=`Producing ${outputResource}`;}
  }
  transfer(worker){
    const task=worker.workTask;if(!['foodPickup','foodDeliver'].includes(task?.kind))return;
    if(task.kind==='foodPickup'){
      const source=this.source(task),atSource=task.sourceDropId?source&&this.scene.workerSystem.ai.atGoal(worker,source):this.storage.atLocation(worker,task.sourceId);
      if(!atSource)return;
      if(task.waitingRoute&&worker.aiCooldown>0)return;
      const destination=this.storage.locations.get(task.destinationId),route=destination&&this.storage.route(worker,[destination]);
      if(!route){task.waitingRoute=true;worker.aiCooldown=FOOD_RULES.searchInterval;worker.workState='Waiting';worker.workMessage='Destination is unreachable; input remains reserved at source';return;}
      task.waitingRoute=false;
      const capacityBefore=this.storage.reservations.get(task.capacityReservation);if(!capacityBefore){this.scene.workerSystem.ai.cancel(worker);return;}
      const drop=task.sourceDropId&&this.scene.dropSystem.drops.get(task.sourceDropId);
      if(task.sourceDropId&&(!this.scene.workerSystem.reservations.available(`drop:${task.sourceDropId}`,worker.id)||this.scene.character.order?.dropId===task.sourceDropId)){this.scene.workerSystem.ai.cancel(worker);return;}
      const cargo=drop?this.scene.dropSystem.takeForTransport(drop.id,task.amount):this.storage.take(task.stockReservation);if(!cargo){this.scene.workerSystem.ai.cancel(worker);return;}
      if(task.sourceDropId)this.scene.workerSystem.reservations.release(`drop:${task.sourceDropId}`,worker.id);
      worker.cargo=cargo;if(task.manualMining)cargo.rockId=task.rockId;const capacity=this.storage.reservations.get(task.capacityReservation);if(capacity)capacity.owner=task.transferId;
      if(task.outputBuildingId){const record=this.records.get(task.outputBuildingId);if(record?.outputReservation===task.capacityReservation)record.outputReservation=null;}
      task.kind='foodDeliver';task.goal={...route.destination};worker.path=route.path;
      if(task.hauling){task.loadedDistance=0;task.loadedPosition={...worker.position};}return;
    }
    if(!worker.cargo){this.scene.workerSystem.ai.cancel(worker);return;}
    if(!this.storage.atLocation(worker,task.destinationId))return;
    const capacity=this.storage.reservations.get(task.capacityReservation),destination=this.storage.locations.get(task.destinationId);
    if(!capacity||!destination){this.scene.workerSystem.ai.cancel(worker);return;}
    const amount=Math.min(worker.cargo.amount,capacity.amount);
    if(!this.storage.put(task.capacityReservation,amount,{transportCancelled:worker.cargo.transportCancelled})){worker.workState='Waiting';worker.workMessage='Waiting for storage capacity';return;}
    if(destination.kind==='site')this.scene.constructionSystem.materials.delivered();
    const resource=worker.cargo.resource,haulReward=task.hauling&&worker.profession==='hauler'&&!worker.cargo.transportCancelled&&Number.isFinite(task.loadedDistance);worker.cargo.amount-=amount;
    // m-sklady-materialu-koncept (49): a producer's own pile counts as its delivery (stats and deferred rewards).
    const handedOver=this.storage.isStock(destination)||destination.kind==='pile'&&destination.buildingId===worker.assignedWorkplaceId;
    if(handedOver){
      const workplace=this.scene.workplaceSystem.records.get(worker.assignedWorkplaceId);if(workplace)workplace.delivered[resource]=(workplace.delivered[resource]??0)+amount;
    }
    if(!worker.cargo.amount){
      worker.cargo=null;const rewards=worker.pendingWorkRewards??[];worker.pendingWorkRewards=[];
      if(handedOver)for(const event of rewards){const {type,...data}=event;this.scene.activities.emit(type,{...data,actor:worker});}
    }
    if(haulReward)this.scene.activities.emit('transportDelivered',{actor:worker,objectType:'hauler',quantity:amount,distance:task.loadedDistance},`haul-receipt-${task.transferId}`);
    this.scene.workerSystem.ai.cancel(worker);worker.workState='Searching for Work';this.scene.updateInventory();
  }
  // Day and night N2: the Pitch Kiln makes Torches while the stores hold fewer than the target and Pitch is at hand
  // (in its input or in a store), otherwise Pitch. A running batch keeps its own recipe.
  chooseRecipes(){
    for(const record of this.records.values()){
      const building=this.building(record.buildingId),d=building&&buildingDefinition(building);if(!d?.recipeChoice)continue;
      if(record.recipeMode&&record.recipeMode!=='auto'){if(Object.hasOwn(d.recipes,record.recipeMode)&&record.recipe!==record.recipeMode){record.recipe=record.recipeMode;this.scene.logisticsTasks?.invalidate?.();}continue;}
      const input=this.storage.locations.get(`input-${building.id}`),pitch=(input?.stock.pitch??0)+this.storage.incoming(input?.id,'pitch')+this.storage.available('pitch');
      const key=this.storage.available('torch')<this.torchTarget(building)&&pitch>0?d.recipeChoice:defaultRecipeKey(d);
      if(record.recipe!==key){record.recipe=key;this.scene.logisticsTasks?.invalidate?.();}
    }
  }
  update(delta){
    if(this.scene.gameOver||this.scene.gameTime.paused)return;
    this.chooseRecipes();
    if(this.scene.gameTime.totalElapsed>=this.nextEmployment){this.nextEmployment=this.scene.gameTime.totalElapsed+FOOD_RULES.searchInterval;
      for(const record of this.records.values()){const building=this.building(record.buildingId);if(record.auto&&building&&buildingDefinition(building).autoEmployment){if(this.scene.employment)this.scene.employment.request();else this.scene.workplaceSystem.autoEmploy(building);}}}
    for(const worker of this.scene.workerSystem.liveWorkers()){
      const task=worker.workTask;if(task?.hauling&&task.kind==='foodDeliver'&&task.loadedPosition){task.loadedDistance+=Math.hypot(worker.position.x-task.loadedPosition.x,worker.position.y-task.loadedPosition.y);task.loadedPosition={...worker.position};}
      this.transfer(worker);
    }
    for(const record of [...this.records.values()]){
      const building=this.building(record.buildingId);if(!building){this.remove(record);continue;}
      if(!record.auto)continue;
      const recipe=record.cycle?this.cycleRecipe(record,building):this.recipe(building),workers=this.scene.workplaceSystem.employees(building).filter(w=>w.workTask?.kind==='produce'&&this.scene.workplaceSystem.atWorkplace(w));
      if(!workers.length)continue;
      if(!record.cycle){
        const [outputResource,outputAmount]=first(recipe.output),inputId=`input-${building.id}`;
        if(Object.entries(recipe.input).some(([resource,amount])=>this.storage.free(inputId,resource)<amount)||this.storage.used(this.storage.locations.get(`output-${building.id}`)))continue;
        // S12: a vehicle (Wheelbarrow) is not stored; VehicleSystem rolls it out of the output buffer onto the map.
        const destination=recipe.vehicle?null:this.storage.findDestination(workers[0],outputResource,outputAmount);if(!recipe.vehicle&&!destination)continue;
        const id=`food-cycle-${building.id}-${record.nextCycle}`,capacity=recipe.vehicle?null:this.storage.reserve('capacity',destination.location.id,outputResource,outputAmount,id);if(!recipe.vehicle&&!capacity)continue;
        // S12 Horse Wagon: a tamed horse is reserved for this batch before anything is consumed.
        const horseId=recipe.horse?this.scene.stables?.freeHorse()??null:undefined;if(recipe.horse&&!horseId)continue;
        if(!this.storage.withdrawBatch(inputId,recipe.input)){if(capacity)this.storage.release(capacity);continue;}
        if(recipe.horse)this.scene.stables.reserveForWorkshop(horseId,building.id);
        record.nextCycle++;record.cycle={id,requiredWork:recipe.duration,workDone:0,progress:0,state:'building',contributions:{},inputs:{...recipe.input},outputReservation:capacity,startedAt:this.scene.gameTime.totalElapsed,...(record.recipe?{recipe:record.recipe}:{}),...(recipe.horse?{horseId}:{})};
      }
      const cycle=record.cycle,participants=workers.map(w=>({id:w.id,speed:this.scene.skillSystem.workEfficiency(w,recipe.skill)*(this.scene.workplaceSystem.workFactor?.(w)??1)*devProduction(building.type),available:Math.min(delta,w.availableWorkMs??0,Math.max(0,this.scene.gameTime.totalElapsed-cycle.startedAt))}));
      if(advanceConstruction({construction:cycle},participants,delta))this.finish(record,building);
    }
    for(const location of [...this.storage.locations.values()])if(location.buildingId!=null&&!this.scene.buildings.some(b=>b.id===location.buildingId)){
      for(const worker of this.scene.workerSystem.liveWorkers())if(worker.assignedWorkplaceId===location.buildingId)this.scene.workplaceSystem.remove(worker);
      this.scene.workplaceSystem.records.delete(location.buildingId);
      this.storage.removeBuilding({id:location.buildingId,x:location.x,y:location.y});
      for(const record of this.records.values()){
        if(record.cycle&&!this.storage.reservations.has(record.cycle.outputReservation))record.cycle.outputReservation=null;
        if(record.outputReservation&&!this.storage.reservations.has(record.outputReservation))record.outputReservation=null;
      }
      for(const w of this.scene.workerSystem.liveWorkers())if(['foodPickup','foodDeliver','harvest'].includes(w.workTask?.kind)&&!this.storage.reservations.has(w.workTask.capacityReservation))this.scene.workerSystem.ai.cancel(w);
    }
  }
  finish(record,building){
    const cycle=record.cycle;if(!cycle||cycle.workDone<cycle.requiredWork)return false;
    // m-jidlo-balanc: the batch yields what it reserved (a batch saved before the Bakery's +1 Bread finishes with 4).
    const recipe=this.cycleRecipe(record,building),[resource,planned]=first(recipe.output),amount=this.storage.reservations.get(cycle.outputReservation)?.amount??planned;
    if(!this.storage.deposit(`output-${building.id}`,resource,amount))return false;
    record.cycle=null;record.outputReservation=cycle.outputReservation;record.completed++;
    for(const [input,quantity]of Object.entries(cycle.inputs))this.scene.resourceLedger?.expense(input,quantity,recipe.inputSources?.[input]??`${dataName(buildingDefinition(building))} Processing`,{id:`processing:${cycle.id}:${input}`,entityId:building.id});
    this.scene.resourceLedger?.income(resource,amount,recipe.outputSource??`${dataName(buildingDefinition(building))} Production`,{id:`production:${cycle.id}:${resource}`,entityId:building.id,type:'production'});
    this.scene.foodSystem?.recordProduction(resource,amount,cycle.id);
    const contributors=Object.entries(cycle.contributions),total=contributors.reduce((n,[,work])=>n+work,0);let allocated=0;
    for(let i=0;i<contributors.length;i++){const[id,work]=contributors[i],ratio=i===contributors.length-1?1-allocated:work/total;allocated+=ratio;const worker=this.scene.workerSystem.workers.get(id);
      if(worker?.isAlive)this.scene.activities.emit('foodProduced',{actor:worker,objectType:building.type,contributionRatio:ratio,quantity:1},`${cycle.id}-${id}`);}
    for(const worker of this.scene.workplaceSystem.employees(building))if(worker.workTask?.kind==='produce')this.scene.workerSystem.ai.cancel(worker);
    this.scene.updateInventory();return true;
  }
  remove(record){
    for(const worker of this.scene.workerSystem.liveWorkers())if(worker.assignedWorkplaceId===record.buildingId)this.scene.workplaceSystem.remove(worker);
    this.scene.workplaceSystem.records.delete(record.buildingId);
    const cycle=record.cycle;if(cycle){const input=this.storage.locations.get(`input-${record.buildingId}`);if(input)for(const [resource,amount]of Object.entries(cycle.inputs))this.storage.spill(resource,amount,{x:input.x-1,y:input.y});this.storage.release(cycle.outputReservation);}
    this.storage.release(record.outputReservation);this.records.delete(record.buildingId);
  }
  toggle(buildingId,value){const record=this.records.get(buildingId);if(record)record.auto=!!value;}
  exportState(){return {records:structuredClone([...this.records.values()]),nextTransfer:this.nextTransfer};}
  importState(data){if(data){this.records=new Map(data.records.map(r=>[r.buildingId,structuredClone(r)]));for(const r of this.records.values()){const b=this.scene.buildings.find(b=>b.id===r.buildingId),d=b&&buildingDefinition(b);if(d?.recipes){r.recipe??=defaultRecipeKey(d);if(r.cycle)r.cycle.recipe??=r.recipe;if(d.recipes[r.recipe]?.retired)r.recipe=defaultRecipeKey(d);}}this.nextTransfer=data.nextTransfer;}else for(const b of this.scene.buildings)this.register(b);}
  destroy(){this.records.clear();}
}
