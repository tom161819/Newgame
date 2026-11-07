import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { priceTable,TRADE_RULES } from '../data/trade.js';
import { buildingDefinition } from '../game/buildings.js';

// Trade F1.1 (#59): the Marketplace panel. Caravans (F1.2) and orders (F1.3) are not in the game yet, so the panel shows
// the goods space, the loading spots and the price list caravans will use.
export class MarketplacePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#marketplace-dialog');this.controller=new AbortController();this.restored=true;
    const options={signal:this.controller.signal};
    document.querySelector('#close-marketplace').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>this.restore(),options);
    this.dialog.addEventListener('click',event=>{if(event.target===this.dialog)this.close();},options);
  }
  get isOpen(){return this.dialog.open;}
  goods(building){const stock=building.market?.stock??{};return Object.values(stock).reduce((n,v)=>n+v,0);}
  render(){
    const b=this.building,d=buildingDefinition(b),capacity=d.trade?.capacity??TRADE_RULES.marketplaceCapacity;
    const status=document.querySelector('#marketplace-status');status.replaceChildren(
      element('p','market-caravan',t('market.noCaravan')),
      element('p','',t('market.space',{used:this.goods(b),capacity})),
      element('p','',t('market.loadingSpots',{count:d.trade?.loadingSpots??TRADE_RULES.loadingSpots})),
      element('p','market-orders',t('market.noOrders')));
    const rows=priceTable(this.scene.objectRegistry).map(row=>{const tr=element('tr');tr.dataset.marketResource=row.resource;tr.append(element('th','',row.name),element('td','',String(row.buy)),element('td','',String(row.sell)));return tr;});
    document.querySelector('#marketplace-prices tbody').replaceChildren(...rows);
  }
  open(building){
    this.building=building;this.render();
    if(!this.dialog.open){this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();}
  }
  restore(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){if(this.dialog.open)this.dialog.close();this.restore();}
  relabel(){if(this.dialog.open)this.render();}
  destroy(){this.close();this.controller.abort();}
}
