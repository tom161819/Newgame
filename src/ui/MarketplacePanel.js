import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { priceTable,TRADE_RULES,PRICE_MODEL } from '../data/trade.js';
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
  goods(building){const stock=this.scene.trade?.market(building.id)?.stock??{};return Object.values(stock).reduce((n,v)=>n+v,0);}
  render(){
    const b=this.building,d=buildingDefinition(b),capacity=d.trade?.capacity??TRADE_RULES.marketplaceCapacity;
    const status=document.querySelector('#marketplace-status');status.replaceChildren(
      ...this.caravanLines(b),
      element('p','',t('market.space',{used:this.goods(b),capacity})),
      element('p','',t('market.loadingSpots',{count:d.trade?.loadingSpots??TRADE_RULES.loadingSpots})),
      ...this.orderLines(b));
    this.renderTrade(b);
    const rows=this.prices().map(row=>{const tr=element('tr');tr.dataset.marketResource=row.resource;tr.append(element('th','',row.name),this.priceCell(row,'buy'),this.priceCell(row,'sell'));return tr;});
    document.querySelector('#marketplace-prices tbody').replaceChildren(...rows);
    this.renderStats();
  }
  // Trade F2: live prices from the kingdom's and the caravan's stock.
  prices(){const trade=this.scene.trade;return priceTable(this.scene.objectRegistry,r=>trade?.marketContext(r)??{});}
  // A price with a ▲ (dearer) / ▼ (cheaper) marker; the tooltip names the reasons.
  priceCell(row,side){
    const mark=row.factor>1.005?'▲':row.factor<0.995?'▼':'',cell=element('td',`market-price${mark?mark==='▲'?' up':' down':''}`,`${row[side]}${mark?' '+mark:''}`);
    cell.dataset.priceFactor=String(Math.round(row.factor*100));
    cell.title=row.reasons?.length?row.reasons.map(r=>t(`market.reason.${r.id}`,{percent:Math.abs(r.percent)})).join('\n'):t('market.reason.normal');
    return cell;
  }
  // Trade F2: totals, the best goods, recent trades and a price history chart.
  renderStats(){
    const root=document.querySelector('#marketplace-stats');const trade=this.scene.trade;if(!root||!trade?.summary)return;
    const s=trade.summary(),name=id=>this.scene.objectRegistry.get(id)?.name??id;
    const parts=[element('h3','',t('market.stats.title')),element('p','market-stats-totals',t('market.stats.totals',{sold:s.sold,bought:s.bought,balance:(s.balance>0?'+':'')+s.balance,count:s.transactions}))];
    parts.push(element('p','market-stats-top',s.top.length?t('market.stats.top',{list:s.top.map(r=>`${name(r.resource)} (${r.value})`).join(', ')}):t('market.stats.none')));
    if(s.recent.length){const list=element('ul','market-recent');for(const r of s.recent.slice(0,6))list.append(element('li','',t(`market.stats.recent.${r.side}`,{day:r.day,quantity:r.quantity,good:name(r.resource),price:r.price})));parts.push(element('p','market-stats-sub',t('market.stats.recentTitle')),list);}
    const goods=Object.keys(trade.stats.history);
    if(goods.length){
      if(!goods.includes(this.chartResource))this.chartResource=goods[0];
      const select=element('select','market-chart-good');select.id='marketplace-chart-good';select.setAttribute('aria-label',t('market.stats.chartGood'));
      for(const id of goods){const o=element('option','',name(id));o.value=id;o.selected=id===this.chartResource;select.append(o);}
      select.addEventListener('change',()=>{this.chartResource=select.value;this.renderStats();});
      parts.push(element('p','market-stats-sub',t('market.stats.chart',{days:PRICE_MODEL.historyDays})),select,this.chart(trade.stats.history[this.chartResource]));
    }
    if(root.contains(document.activeElement))return;
    root.replaceChildren(...parts);
  }
  chart(rows){
    const ns='http://www.w3.org/2000/svg',w=260,h=90,pad=18,svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('class','market-chart');svg.setAttribute('role','img');
    const today=this.scene.gameTime?.day??1,first=today-PRICE_MODEL.historyDays+1,values=rows.flatMap(e=>[e.buy,e.sell]).filter(Number.isFinite),max=Math.max(1,...values),min=Math.min(max,...values);
    const x=day=>pad+(day-first)/(PRICE_MODEL.historyDays-1||1)*(w-pad-4),y=v=>h-12-(max===min?.5:(v-min)/(max-min))*(h-24);
    const add=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;svg.append(el);return el;};
    add('line',{x1:pad,y1:h-12,x2:w-4,y2:h-12,class:'axis'});add('text',{x:2,y:y(max)+4,class:'label'},String(max));if(min!==max)add('text',{x:2,y:y(min)+4,class:'label'},String(min));
    const labels=[];
    for(const side of ['buy','sell']){const pts=rows.filter(e=>Number.isFinite(e[side])).sort((a,b)=>a.day-b.day);if(!pts.length)continue;labels.push(t(`market.${side}`));
      if(pts.length>1)add('polyline',{points:pts.map(e=>`${x(e.day).toFixed(1)},${y(e[side]).toFixed(1)}`).join(' '),class:`line ${side}`});
      for(const e of pts)add('circle',{cx:x(e.day).toFixed(1),cy:y(e[side]).toFixed(1),r:2,class:`dot ${side}`});}
    ['buy','sell'].forEach((side,i)=>add('text',{x:w-110+i*55,y:9,class:`legend ${side}`},`● ${t(`market.${side}`)}`));
    svg.setAttribute('aria-label',t('market.stats.chartLabel',{lines:labels.join(', ')}));svg.dataset.points=String(rows.length);
    return svg;
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
  orderLines(b){
    const orders=(this.scene.trade?.orders??[]).filter(o=>o.marketplaceId===b.id).slice(-6).reverse();
    if(!orders.length)return [element('p','market-orders',t('market.noOrders'))];
    const list=element('ul','market-order-list');
    for(const o of orders){
      const item=element('li',`market-order status-${o.status}`,t(`market.order.${o.side}`,{quantity:o.quantity,good:this.scene.objectRegistry.get(o.resource)?.name??o.resource,price:o.price,delivered:o.delivered,status:t(`market.status.${o.status}`)}));item.dataset.tradeOrder=o.id;
      if(['Pending','Transporting'].includes(o.status)){const cancel=element('button','market-cancel',t('market.cancel'));cancel.type='button';cancel.dataset.tradeCancel=o.id;cancel.addEventListener('click',()=>{this.scene.trade.cancel(o.id);this.render();});item.append(' ',cancel);}
      list.append(item);
    }
    return [element('p','market-orders-title',t('market.orders')),list];
  }
  // The trade window: goods of the caravan and of the kingdom with prices; a quantity, Buy / Sell and the two Max buttons.
  renderTrade(b){
    const root=document.querySelector('#marketplace-trade');if(!root)return;
    const trade=this.scene.trade,c=this.scene.caravans?.active;
    // While trading, the trade table already shows the prices; the plain price list is hidden.
    this.dialog.classList.toggle('trading',!!(trade&&c&&c.phase==='trading'&&c.marketplaceId===b.id));
    if(!trade||!c||c.phase!=='trading'||c.marketplaceId!==b.id){root.hidden=true;root.replaceChildren();this.tradeKey=null;return;}
    root.hidden=false;
    // Keep what the player is typing: the table is rebuilt only when nothing in it has focus.
    if(root.contains(document.activeElement)&&this.tradeKey===c.id){this.renderQuote();return;}
    this.tradeKey=c.id;this.quantities??=new Map();
    const rows=this.prices().map(row=>{
      const tr=element('tr');tr.dataset.tradeResource=row.resource;
      const qty=element('input','market-qty');qty.type='number';qty.min='1';qty.step='1';qty.value=String(this.quantities.get(row.resource)??1);qty.dataset.tradeQty=row.resource;qty.setAttribute('aria-label',t('market.quantityOf',{good:row.name}));
      qty.addEventListener('input',()=>{this.quantities.set(row.resource,Number(qty.value));this.selected={resource:row.resource,side:this.selected?.resource===row.resource?this.selected.side:'buy'};this.renderQuote();});
      const button=(side,label)=>{const el=element('button',`market-${side}`,label);el.type='button';el.dataset.tradeSide=side;el.dataset.tradeResource=row.resource;
        el.addEventListener('click',()=>{this.selected={resource:row.resource,side};const result=trade.place(side,row.resource,Number(qty.value));this.lastResult=result;if(result.ok){this.quantities.set(row.resource,1);this.tradeKey=null;this.render();}else this.renderQuote();});return el;};
      const max=(side,label)=>{const el=element('button','market-max',label);el.type='button';el.dataset.tradeMax=side;el.dataset.tradeResource=row.resource;el.addEventListener('click',()=>{qty.value=String(this.maximum(side,row.resource));this.quantities.set(row.resource,Number(qty.value));this.selected={resource:row.resource,side};this.renderQuote();});return el;};
      const actions=element('td','market-actions');actions.append(button('buy',t('market.buy')),max('buy',t('market.maxBuy')),button('sell',t('market.sell')),max('sell',t('market.maxSell')));
      const amount=element('td');amount.append(qty);
      tr.append(element('th','',row.name),element('td','',String(c.stock[row.resource]??0)),element('td','',String(this.scene.foodStorage?.available(row.resource)??0)),this.priceCell(row,'buy'),this.priceCell(row,'sell'),amount,actions);
      return tr;
    });
    const table=element('table','market-trade');const head=element('thead');const hr=element('tr');
    for(const key of ['good','caravan','kingdom','buy','sell','quantity',''])hr.append(element('th','',key?t(`market.${key}`):''));head.append(hr);
    const body=element('tbody');body.append(...rows);table.append(head,body);
    const quote=element('p','market-quote');quote.id='marketplace-quote';quote.setAttribute('role','status');
    root.replaceChildren(element('h3','',t('market.trade',{gold:c.gold})),table,quote);this.renderQuote();
  }
  maximum(side,resource){
    const trade=this.scene.trade,c=this.scene.caravans.active,unit=trade.unitPrice(resource,side);if(!c||!unit)return 1;
    const market=trade.market(c.marketplaceId),room=market?market.capacity-trade.marketUsed(c.marketplaceId):0;
    const n=side==='buy'?Math.min(c.stock[resource]??0,Math.floor(trade.freeGold()/unit),trade.storeRoom(resource),room):Math.min(this.scene.foodStorage.available(resource),Math.floor(c.gold/unit),Math.floor(((this.scene.inventory.limit?.('gold')??500)-this.scene.inventory.count('gold')-trade.pendingSaleGold())/unit));
    return Math.max(1,n);
  }
  renderQuote(){
    const out=document.querySelector('#marketplace-quote');if(!out)return;const s=this.selected;
    if(!s){out.textContent=t('market.pick');out.classList.remove('error');return;}
    const q=this.scene.trade.quote(s.side,s.resource,Number(this.quantities?.get(s.resource)??1)),c=this.scene.caravans.status().active,name=this.scene.objectRegistry.get(s.resource)?.name??s.resource;
    const parts=[t(`market.quote.${s.side}`,{quantity:q.quantity,good:name,total:q.total,gold:Math.floor(this.scene.inventory.count('gold'))})];
    if(s.side==='buy')parts.push(t('market.quote.room',{room:this.scene.trade.storeRoom(s.resource)}));
    parts.push(t('market.quote.eta',{time:this.clock(q.eta)}));
    if(c&&q.eta>c.leavesIn+0.25*this.scene.gameTime.dayDuration)parts.push(t('market.quote.late'));
    const done=this.lastResult?.ok&&this.lastResult.order.resource===s.resource?t('market.placed'):'';
    out.textContent=[done,...parts,...q.errors.map(e=>t(`market.error.${e}`))].filter(Boolean).join(' · ');out.classList.toggle('error',q.errors.length>0);this.lastResult=null;
  }
  open(building){
    this.building=building;this.render();this.unsubscribe?.();this.unsubscribeTrade?.();this.unsubscribe=this.scene.caravans?.onChange(()=>{if(this.dialog.open)this.render();});this.unsubscribeTrade=this.scene.trade?.onChange(()=>{if(this.dialog.open)this.render();});
    if(!this.dialog.open){this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();clearInterval(this.timer);this.timer=setInterval(()=>{if(this.dialog.open)this.render();},1000);}
  }
  restore(){clearInterval(this.timer);this.timer=null;if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){if(this.dialog.open)this.dialog.close();this.restore();}
  relabel(){if(this.dialog.open)this.render();}
  destroy(){this.close();this.unsubscribe?.();this.unsubscribeTrade?.();this.controller.abort();}
}
