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
      ...this.caravanLines(b),
      element('p','',t('market.space',{used:this.goods(b),capacity})),
      element('p','',t('market.loadingSpots',{count:d.trade?.loadingSpots??TRADE_RULES.loadingSpots})),
      element('p','market-orders',t('market.noOrders')));
    const rows=priceTable(this.scene.objectRegistry).map(row=>{const tr=element('tr');tr.dataset.marketResource=row.resource;tr.append(element('th','',row.name),element('td','',String(row.buy)),element('td','',String(row.sell)));return tr;});
    document.querySelector('#marketplace-prices tbody').replaceChildren(...rows);
  }
  // Real time left (mm:ss) for short waits, game days for the next visit.
  clock(ms){const s=Math.ceil(ms/1000);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
  days(ms){const day=this.scene.gameTime.dayDuration,d=ms/day;return d>=1?t('market.days',{count:Math.round(d*10)/10}):this.clock(ms);}
  caravanLines(b){
    const status=this.scene.caravans?.status();if(!status)return [element('p','market-caravan',t('market.noCaravan'))];
    const c=status.active;
    if(c&&c.marketplaceId===b.id){
      const type=t(`caravan.type.${c.type}`),lines=[element('p','market-caravan',c.phase==='arriving'?t('market.caravanArriving',{type}):c.phase==='leaving'?t('market.caravanLeaving',{type}):t(c.waiting?'market.caravanWaiting':'market.caravanTrading',{type,time:this.clock(c.leavesIn)}))];
      const list=Object.entries(c.stock).filter(([,n])=>n>0).map(([id,n])=>`${n} ${this.scene.objectRegistry.get(id)?.name??id}`).join(', ');
      lines.push(element('p','market-goods',t('market.caravanGoods',{list,gold:c.gold})));return lines;
    }
    if(c)return [element('p','market-caravan',t('market.caravanElsewhere'))];
    return [element('p','market-caravan',status.nextIn===null?t('market.waitingForMarket'):t('market.nextCaravan',{time:this.days(status.nextIn)}))];
  }
  open(building){
    this.building=building;this.render();this.unsubscribe?.();this.unsubscribe=this.scene.caravans?.onChange(()=>{if(this.dialog.open)this.render();});
    if(!this.dialog.open){this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();clearInterval(this.timer);this.timer=setInterval(()=>{if(this.dialog.open)this.render();},1000);}
  }
  restore(){clearInterval(this.timer);this.timer=null;if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){if(this.dialog.open)this.dialog.close();this.restore();}
  relabel(){if(this.dialog.open)this.render();}
  destroy(){this.close();this.unsubscribe?.();this.controller.abort();}
}
