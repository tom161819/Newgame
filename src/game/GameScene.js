import Phaser from 'phaser';
import { COLUMNS, ROWS, PLAYER_START, grid, isWalkable, tileCenter } from './map.js';
import { tilePolygon, worldToTile, gridToWorld } from './isometric.js';
import { TerrainRenderer } from './TerrainRenderer.js';
import { WorldCamera } from './WorldCamera.js';
import { Inventory } from './inventory.js';
import { drawStone, generateResourcePositions, resourceTiles, tileKey, ResourceSpawner } from './stones.js';
import { placeBuilding, placementError, buildingTiles, towerBase, towerNeighbors, buildingDefinition } from './buildings.js';
import { TowerView } from './TowerView.js';
import { KingView } from './KingView.js';
import { PlayerController, PLAYER_STATE } from './PlayerController.js';
import { BuildingBar } from '../ui/BuildingBar.js';
import { InventoryBar } from '../ui/InventoryBar.js';
import { AssetGallery } from '../ui/AssetGallery.js';
import { formatCost } from '../ui/objectLabels.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { AssetManager } from '../systems/AssetManager.js';
import { AnimalView } from './AnimalView.js';
import { AnimalSystem } from '../systems/AnimalSystem.js';
import { HuntingSystem } from '../systems/HuntingSystem.js';
import { DropSystem } from '../systems/DropSystem.js';
import { FoodSystem } from '../systems/FoodSystem.js';
import { FogOfWarSystem } from '../systems/FogOfWarSystem.js';
import { MountSystem } from '../systems/MountSystem.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  preload() {
    this.objectRegistry=objectRegistry;
    this.assets=new AssetManager(this,this.objectRegistry);
    this.assets.queue();
  }

  create() {
    this.assets.initialize();
    this.assets.registerRenderer('stone',(definition,context)=>drawStone(this,context.tile,definition));
    this.assets.registerRenderer('king',(definition,context)=>new KingView(this,context.x,context.y,definition));
    this.assets.registerRenderer('tower',(_definition,context)=>new TowerView(this,context.building,context.preview));
    this.assets.registerRenderer('animal',(definition,context)=>new AnimalView(this,context.x,context.y,definition));
    const base=this.objectRegistry.require('grass'),obstacle=this.objectRegistry.require('rock_outcrop');
    this.map=grid.map(row=>row.map(value=>(value?obstacle:base).walkable?0:1));
    this.terrain=new TerrainRenderer(this,grid,this.objectRegistry,this.assets);
    this.inventory=new Inventory();
    this.resources=new Map();this.stones=this.resources; // Kompatibilní označení původního seznamu kamenů.
    this.resourceOccupancy=new Map();
    this.buildings=[];this.towerViews=new Map();
    this.buildMode=false;this.selectedBuilding=null;this.previewAnchor=null;this.previewTracking=false;this.previewKey=null;
    this.preview=this.createBuildingView(this.objectRegistry.require('tower'),{x:0,y:0},true);this.preview.setVisible(false);
    this.marker=this.add.graphics().setDepth(9998).setVisible(false);
    const position=tileCenter(PLAYER_START);
    this.player=this.assets.createView('king',position);
    this.character=new PlayerController(this,this.player,PLAYER_START);
    this.resourceSpawners=[];
    for(const definition of this.objectRegistry.byCategory('resource').filter(d=>d.spawn)){
      const spawner=new ResourceSpawner({
        map:this.map,resources:this.resourceOccupancy,definition,
        getOrigins:()=>this.resourceOrigins(),getReserved:()=>this.reservedTiles(),
        getCount:()=>this.resourceCount(definition.id),spawn:tile=>this.addResource(definition,tile),
      });
      this.resourceSpawners.push(spawner);
      if(definition.walkable){
        const candidates=generateResourcePositions(this.map,PLAYER_START,definition.spawn.initial,Math.random,this.resourceOccupancy,definition);
        for(const tile of candidates)if(resourceTiles(tile,definition).every(p=>!this.resourceOccupancy.has(tileKey(p))))this.addResource(definition,tile);
      }
      while(this.resourceCount(definition.id)<definition.spawn.initial&&spawner.spawnOne()){}
    }
    this.spawner=this.resourceSpawners.find(s=>s.definition.id==='stone');
    this.dropSystem=new DropSystem(this);
    this.animalSystem=new AnimalSystem(this);this.animalSystem.spawn(PLAYER_START);
    this.huntingSystem=new HuntingSystem(this);
    this.mountSystem=new MountSystem(this);this.fog=new FogOfWarSystem(this.character);
    this.settingsPanel=new SettingsPanel(settings=>{this.fog.setEnabled(settings.fogOfWar);this.refreshVisibility();});
    this.fog.setEnabled(this.settingsPanel.settings.fogOfWar);
    this.foodSystem=new FoodSystem(this.inventory,this.objectRegistry.require('meat'),()=>this.updateInventory());
    this.inventoryBar=new InventoryBar(this.objectRegistry,this.assets,this.inventory);
    this.buildingBar=new BuildingBar({registry:this.objectRegistry,assets:this.assets,onSelect:definition=>this.startBuilding(definition),onCancel:()=>this.cancelBuilding()});
    this.assetGallery=new AssetGallery({registry:this.objectRegistry,assets:this.assets,onOpen:()=>this.setGalleryInput(false),onClose:()=>this.setGalleryInput(true)});
    this.buildingBar.close();this.updateInventory();
    this.setStatus('Vyber surovinu, volné políčko, Buildings nebo Asset Library.');
    this.worldCamera=new WorldCamera(this,this.player);
    this.controls=new AbortController();
    const dismount=()=>this.mountSystem.dismount();
    document.querySelector('#dismount').addEventListener('click',dismount,{signal:this.controls.signal});
    const onDismount=event=>{if(!event.repeat&&!this.assetGallery.isOpen)dismount();};
    this.input.keyboard.on('keydown-H',onDismount);this.updateMountUI();
    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown',pointer=>this.handleClick(pointer));
    this.input.on('pointermove',pointer=>{this.updateHover(pointer);if(this.buildMode&&!this.assetGallery.isOpen){this.previewTracking=true;this.previewAnchor=this.pointerTile(pointer);this.updateBuildingPreview();}});
    this.input.on('gameout',()=>{this.previewAnchor=null;this.previewTracking=false;this.preview.setVisible(false);this.previewKey=null;document.querySelector('#object-tooltip').hidden=true;});
    const onEscape=()=>{if(this.buildMode&&!this.assetGallery.isOpen)this.cancelBuilding();};
    this.input.keyboard.on('keydown-ESC',onEscape);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.assetGallery.destroy();this.inventoryBar.destroy();this.buildingBar.destroy();this.worldCamera.destroy();this.assets.destroy();
      this.animalSystem.destroy();this.dropSystem.destroy();document.querySelector('#object-tooltip').hidden=true;
      this.settingsPanel.destroy();this.controls.abort();this.input.keyboard.off('keydown-H',onDismount);
      this.input.keyboard.off('keydown-ESC',onEscape);this.game.canvas.style.cursor='';
    });
  }

  setGalleryInput(enabled) {
    this.input.enabled=enabled;this.input.keyboard.enabled=enabled;
    for(const key of Object.values(this.worldCamera.keys))key.reset();
    this.previewTracking=false;this.preview.setVisible(false);
    document.querySelector('#object-tooltip').hidden=true;
  }

  reservedTiles(){return [...this.character.reservedTiles(),...(this.animalSystem?.reservedTiles()??[])];}
  updateHover(pointer){
    const tooltip=document.querySelector('#object-tooltip');
    if(this.buildMode||this.assetGallery.isOpen){tooltip.hidden=true;return;}
    pointer.updateWorldPoint(this.cameras.main);
    const drop=this.dropSystem.atPoint(pointer.worldX,pointer.worldY);
    tooltip.hidden=!drop;
    if(drop){
      tooltip.textContent=`${this.objectRegistry.require(drop.resource).name} ×${drop.amount}`;
      const rect=this.game.canvas.getBoundingClientRect();
      tooltip.style.left=`${Math.min(window.innerWidth-110,rect.left+pointer.x*rect.width/this.scale.width+14)}px`;
      tooltip.style.top=`${Math.max(4,rect.top+pointer.y*rect.height/this.scale.height-32)}px`;
    }
  }

  resourceOrigins() {
    const c=this.character;
    if(c.exitTile)return [c.exitTile];
    return c.currentTower?towerNeighbors(c.currentTower):[c.nextTile??c.tile];
  }
  resourceCount(id) { let count=0;for(const view of this.resources.values())if(view.getData('objectId')===id)count++;return count; }
  addResource(definition,tile) {
    const point=gridToWorld(tile.x+definition.width/2,tile.y+definition.height/2),key=tileKey(tile);
    const view=this.assets.createView(definition.id,{...point,tile});
    const object={x:tile.x,y:tile.y,type:definition.id,definition,tiles:resourceTiles(tile,definition)};
    view.setData('tile',{...tile});view.setData('object',object);
    this.resources.set(key,view);
    for(const part of object.tiles){this.resourceOccupancy.set(tileKey(part),key);if(!definition.walkable)this.map[part.y][part.x]=1;}
    this.updateWorldCount();
  }

  pointerTile(pointer) { pointer.updateWorldPoint(this.cameras.main);return worldToTile(pointer.worldX,pointer.worldY); }
  handleClick(pointer) {
    if(this.assetGallery.isOpen)return;
    if(pointer.rightButtonDown()){if(this.buildMode)this.cancelBuilding();return;}
    if(!pointer.leftButtonDown())return;
    let goal=this.pointerTile(pointer);
    if(this.buildMode){
      this.previewAnchor=goal;
      const result=placeBuilding({map:this.map,anchor:goal,resources:this.resourceOccupancy,reservedTiles:this.reservedTiles(),inventory:this.inventory,buildings:this.buildings,definition:this.selectedBuilding});
      if(result.error){this.previewKey=null;this.updateBuildingPreview();this.setStatus(result.error);}
      else{
        this.towerViews.set(result.building.id,this.createBuildingView(this.selectedBuilding,result.building));
        this.updateInventory();this.cancelBuilding(`${this.selectedBuilding.name} postavena. Cena: ${formatCost(this.selectedBuilding.cost,this.objectRegistry)}.`);
      }
      return;
    }
    if(this.character.transitioning){this.setStatus('Počkej, až král dokončí výstup nebo sestup.');return;}
    this.character.order=null;
    this.huntingSystem.cancel();this.mountSystem.cancel();
    const building=this.towerAtPoint(pointer.worldX,pointer.worldY,goal);
    const animal=!building&&this.animalSystem.atPoint(pointer.worldX,pointer.worldY);
    const drop=!building&&!animal&&(this.dropSystem.atPoint(pointer.worldX,pointer.worldY)??this.dropSystem.atTile(goal));
    let accepted=false;
    if(building){
      if(buildingDefinition(building).interactions.includes('enter')){
        if(this.character.mountedHorse&&!this.mountSystem.dismount())return;
        accepted=this.character.command({kind:'enter',tower:building});
      }
      else this.setStatus(buildingDefinition(building).description);
    }else if(animal){
      accepted=animal.definition.interactions.includes('mount')?this.mountSystem.command(animal):this.huntingSystem.command(animal);
    }else if(drop){
      accepted=this.character.command({kind:'drop',goal:drop.tile,dropId:drop.id});
    }else{
      const hit=[...this.resources.values()].sort((a,b)=>b.depth-a.depth).find(view=>this.fog.isVisibleObject(view.getData('object'))&&this.assets.hitTest(view,pointer.worldX,pointer.worldY));
      let resource=hit??this.resources.get(this.resourceOccupancy.get(tileKey(goal)));
      if(resource&&!this.fog.isVisibleObject(resource.getData('object')))resource=null;
      if(resource){
        const object=resource.getData('object'),definition=object.definition;
        if(!definition.collectible){this.setStatus(definition.description);return;}
        goal=resource.getData('tile');
        if(!definition.walkable)accepted=this.character.command({kind:'collect',resource:object,pickupKey:tileKey(goal)});
        else accepted=this.character.command({kind:'move',goal,pickupKey:tileKey(goal)});
      }else if(!isWalkable(this.map,goal.x,goal.y))this.setStatus('Tady je překážka nebo okraj mapy. Vyber volné políčko.');
      else accepted=this.character.command({kind:'move',goal,pickupKey:null});
    }
    if(accepted)this.worldCamera.follow();
  }

  createBuildingView(definition,building,preview=false) {
    const object={...building,type:definition.id,definition,tiles:building.tiles??buildingTiles(building,definition)};
    return this.assets.createView(definition.id,{building:object,preview});
  }
  towerAtPoint(x,y,tile) {
    return [...this.buildings].filter(building=>this.fog.isVisibleObject(building)).sort((a,b)=>towerBase(b).y-towerBase(a).y).find(building=>this.towerViews.get(building.id).contains(x,y)||building.tiles.some(part=>tileKey(part)===tileKey(tile)));
  }
  startBuilding(definition=this.objectRegistry.require('tower')) {
    if(this.character.transitioning){this.setStatus('Nejdřív dokonči výstup nebo sestup z věže.');return false;}
    if(!definition.buildable)return false;
    this.huntingSystem.cancel();this.mountSystem.cancel();
    this.character.stopForBuilding();this.selectedBuilding=definition;
    this.preview.destroy();this.preview=this.createBuildingView(definition,{x:0,y:0},true);this.preview.setVisible(false);
    this.buildMode=true;this.previewKey=null;this.previewAnchor=null;this.previewTracking=false;this.game.canvas.style.cursor='crosshair';
    this.updateBuildingUI();this.setStatus(`${definition.name}: ${definition.width} × ${definition.height} políčka. Cena: ${formatCost(definition.cost,this.objectRegistry)}. Esc nebo pravý klik stavbu zruší.`);
    return true;
  }
  cancelBuilding(message='Režim stavění zrušen. Můžeš se znovu pohybovat a sbírat suroviny.') {
    this.buildMode=false;this.selectedBuilding=null;this.previewAnchor=null;this.previewTracking=false;this.previewKey=null;
    this.preview.setVisible(false);this.game.canvas.style.cursor='';this.updateBuildingUI();this.setStatus(message);
  }
  updateBuildingPreview() {
    const anchor=this.previewAnchor,definition=this.selectedBuilding;
    if(!this.buildMode||!anchor||anchor.x<0||anchor.y<0||anchor.x>=COLUMNS||anchor.y>=ROWS){this.preview.setVisible(false);return;}
    const error=placementError(this.map,anchor,this.resourceOccupancy,this.reservedTiles(),definition,this.buildings)
      ??(!this.inventory.canAfford(definition.cost)?'Na tuto budovu nemáš dostatek surovin.':null);
    const key=`${tileKey(anchor)}:${error}`;
    if(key!==this.previewKey){
      this.preview.paint({x:anchor.x,y:anchor.y,type:definition.id,definition,tiles:buildingTiles(anchor,definition)},error?0xf27777:0x71dba6);
      this.previewKey=key;this.setStatus(error??`Platné místo: levým kliknutím postavíš ${definition.name}. Cena: ${formatCost(definition.cost,this.objectRegistry)}.`);
    }
    this.preview.setVisible(true);
  }
  showMarker(tile) { this.marker.clear().lineStyle(2,0xe3c879,1).strokePoints(tilePolygon(tile),true).setVisible(true); }

  collectResource(key,standingTile) {
    if(this.character.state!==PLAYER_STATE.GROUND)return false;
    const view=this.resources.get(key);if(!view)return false;
    const object=view.getData('object'),definition=object.definition;
    if(!definition.collectible)return false;
    const reachable=definition.walkable?key===tileKey(standingTile):towerNeighbors(object).some(p=>tileKey(p)===tileKey(standingTile));
    if(!reachable)return false;
    view.destroy();this.resources.delete(key);
    for(const tile of object.tiles){this.dropSystem.refreshOccupancy(tile);if(!definition.walkable)this.map[tile.y][tile.x]=0;}
    this.inventory.add(definition.id);this.updateInventory();return true;
  }
  collectStone(tile) { return this.collectResource(tileKey(tile),this.character.tile); }
  updateInventory() { this.inventoryBar.update();this.updateBuildingUI();this.updateWorldCount();this.updateFoodDisplay(); }
  updateFoodDisplay(){
    const seconds=this.foodSystem.remainingSeconds,text=`Food: ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    const output=document.querySelector('#food-countdown');if(output.textContent!==text)output.textContent=text;
    document.querySelector('#food-warning').hidden=this.inventory.count('meat')>0;
  }
  updateBuildingUI() { this.buildingBar.update(this.inventory,this.buildMode?this.selectedBuilding:null); }
  updateWorldCount() {
    const definition=this.objectRegistry.require('stone');
    document.querySelector('#world-stones').textContent=`Mapa ${COLUMNS} × ${ROWS} · kameny ${this.resourceCount('stone')} / ${definition.spawn.max}`;
  }
  setStatus(message) { document.querySelector('#status').textContent=message; }
  updateMountUI(){
    document.querySelector('#dismount').hidden=!this.character.mountedHorse;
    const text=this.fog.enabled?`Dohled ${this.fog.size} × ${this.fog.size}`:'Fog of War: OFF';
    const output=document.querySelector('#vision-status');if(output.textContent!==text)output.textContent=text;
  }
  update(_time,delta) {
    this.character.update(delta);this.player.animate(delta,this.character.walking&&this.character.state===PLAYER_STATE.GROUND,this.character.direction);
    this.animalSystem.update(delta);this.huntingSystem.update(delta);this.mountSystem.update(delta);this.foodSystem.update(delta);this.updateFoodDisplay();
    for(const spawner of this.resourceSpawners)spawner.update(delta);
    this.worldCamera.update(delta);this.refreshVisibility();
    if(this.buildMode&&!this.assetGallery.isOpen){if(this.previewTracking)this.previewAnchor=this.pointerTile(this.input.activePointer);this.updateBuildingPreview();}
  }
  refreshVisibility(){
    this.fog.update();this.updateMountUI();this.terrain.update(this.cameras.main,this.fog);
    const view=this.cameras.main.worldView;
    this.dropSystem.update(view,this.fog);
    if(this.input.manager.isOver)this.updateHover(this.input.activePointer);
    for(const animal of this.animalSystem.animals.values())animal.view.setVisible(!animal.mounted&&this.fog.isVisibleObject(animal)&&animal.view.x>view.x-60&&animal.view.x<view.right+60&&animal.view.y>view.y-40&&animal.view.y<view.bottom+70);
    for(const resource of this.resources.values()){
      const definition=this.objectRegistry.require(resource.getData('objectId'));
      resource.setVisible(this.fog.isVisibleObject(resource.getData('object'))&&resource.x>view.x-64&&resource.x<view.right+64&&resource.y>view.y-40&&resource.y<view.bottom+(definition.visualHeight??40));
    }
    for(const building of this.buildings){const visual=this.towerViews.get(building.id);visual.setVisible(this.fog.isVisibleObject(building)&&visual.inView(view));}
    this.player.setVisible(this.player.x>view.x-40&&this.player.x<view.right+40&&this.player.y>view.y-20&&this.player.y<view.bottom+70);
  }
}
