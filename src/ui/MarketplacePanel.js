import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { priceTable,price,TRADE_RULES,PRICE_MODEL,AUTO_TRADE } from '../data/trade.js';
import { CATS,DOGS } from '../data/domesticAnimals.js';
import { buildingDefinition } from '../game/buildings.js';
import { resourceGroup,RESOURCE_GROUPS } from '../data/resourceGroups.js';

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
    // m-trziste-auto-blikani (owner, 12 Nov): parts are rebuilt only when what they show changed, so nothing flickers or
    // jumps on the periodic refresh (the panel refreshes every second and on every trade change).
    const status=document.querySelector('#marketplace-status'),lines=[...this.caravanLines(b),element('p','',t('market.space',{used:this.goods(b),capacity})),element('p','',t('market.loadingSpots',{count:d.trade?.loadingSpots??TRADE_RULES.loadingSpots})),...this.orderLines(b)];
    const statusKey=lines.map(l=>l.outerHTML??l.textContent).join('|');if(statusKey!==this.statusKey||!status.children.length){this.statusKey=statusKey;status.replaceChildren(...lines);}
    this.renderTrade(b);
    const prices=this.prices(),pricesKey=JSON.stringify(prices.map(r=>[r.resource,r.name,r.buy,r.sell,r.stock,r.caravan]));
    if(pricesKey!==this.pricesKey){this.pricesKey=pricesKey;const rows=prices.map(row=>{const tr=element('tr');tr.dataset.marketResource=row.resource;tr.append(element('th','',row.name),this.priceCell(row,'buy'),this.priceCell(row,'sell'));return tr;});
      document.querySelector('#marketplace-prices tbody').replaceChildren(...rows);this.decorate(document.querySelector('#marketplace-prices'));}
    this.renderAuto();
    this.renderStats();
  }
  // Trade F2: live prices from the kingdom's and the caravan's stock.
  // m-ui-prehled-surovin (26): goods sorted by resource group, each row with the good's icon and the group's tint.
  prices(){const trade=this.scene.trade,reg=this.scene.objectRegistry,rank=r=>RESOURCE_GROUPS.indexOf(resourceGroup(reg.get(r.resource),reg));return priceTable(reg,r=>trade?.marketContext(r)??{}).map((r,i)=>({r,i})).sort((a,b)=>rank(a.r)-rank(b.r)||a.i-b.i).map(x=>x.r);}
  decorate(root){
    const reg=this.scene.objectRegistry;
    for(const tr of root?.querySelectorAll?.('tr[data-market-resource],tr[data-auto-resource],tr[data-trade-resource]')??[]){
      const id=tr.dataset.marketResource??tr.dataset.autoResource??tr.dataset.tradeResource,d=reg.get(id);if(!d)continue;tr.dataset.resourceGroup=resourceGroup(d,reg);
      const cell=tr.firstElementChild;if(cell&&!cell.querySelector('.market-good-icon')){const img=element('img','market-good-icon');img.alt='';img.src=this.scene.assets?.previewURL?.(d)??'';cell.prepend(img);}
    }
  }
  // A price with a ▲ (dearer) / ▼ (cheaper) marker; the tooltip names the reasons.
  priceCell(row,side){
    const mark=row.factor>1.005?'▲':row.factor<0.995?'▼':'',cell=element('td',`market-price${mark?mark==='▲'?' up':' down':''}`,`${row[side]}${mark?' '+mark:''}`);
    cell.dataset.priceFactor=String(Math.round(row.factor*100));
    cell.title=row.reasons?.length?row.reasons.map(r=>t(`market.reason.${r.id}`,{percent:Math.abs(r.percent)})).join('\n'):t('market.reason.normal');
    return cell;
  }
  // Trade F3: automatic trade. One rule per good: Sell above a reserve at a minimum price, or Buy below a level up to a
  // target at a maximum price. Changes apply at once; the section is not rebuilt while the player edits it.
  renderAuto({force=false}={}){
    const root=document.querySelector('#marketplace-auto-body'),summary=document.querySelector('#marketplace-auto-summary'),trade=this.scene.trade;if(!root||!trade?.auto)return;
    const a=trade.auto,count=Object.keys(a.rules).length;
    {const text=t('market.auto.summary',{state:t(a.enabled?'market.auto.on':'market.auto.off'),count});if(summary.textContent!==text)summary.textContent=text;}
    if(!force&&root.contains(document.activeElement))return;
    // Same rules and goods: only the price hints and notes change – update them in place instead of rebuilding.
    const structure=JSON.stringify([a.enabled,a.budget,a.rules,this.prices().map(r=>r.resource),document.documentElement.lang]);
    if(!force&&structure===this.autoStructure&&root.children.length){for(const row of this.prices()){const hint=root.querySelector(`[data-auto-resource="${row.resource}"] .market-auto-hint`),text=t('market.auto.price',{buy:row.buy,sell:row.sell});if(hint&&hint.textContent!==text)hint.textContent=text;}for(const id of Object.keys(a.rules))this.renderAutoNote(id);return;}
    this.autoStructure=structure;
    const enabled=element('label','market-auto-enabled'),box=element('input');box.type='checkbox';box.id='auto-trade-enabled';box.checked=a.enabled;
    box.addEventListener('change',()=>{trade.setAutoEnabled(box.checked);this.renderAuto({force:true});document.querySelector('#auto-trade-enabled')?.focus();});enabled.append(box,' ',t('market.auto.enable'));
    const budgetLabel=element('label','market-auto-budget',t('market.auto.budget')+' '),budget=this.number('auto-trade-budget',a.budget,0,AUTO_TRADE.maxBudget);
    budget.addEventListener('change',()=>{if(!trade.setAutoBudget(Number(budget.value)))budget.value=String(trade.auto.budget);});budgetLabel.append(budget);
    const table=element('table','market-auto-table'),head=element('tr');for(const key of ['good','mode','settings'])head.append(element('th','',t(`market.auto.${key}`)));const thead=element('thead');thead.append(head);
    const body=element('tbody');
    for(const row of this.prices()){
      const rule=a.rules[row.resource],tr=element('tr');tr.dataset.autoResource=row.resource;
      const mode=element('select','market-auto-mode');mode.dataset.autoMode=row.resource;mode.setAttribute('aria-label',t('market.auto.modeOf',{good:row.name}));
      for(const m of ['off','sell','buy','between']){const o=element('option','',t(`market.auto.mode.${m}`));o.value=m;o.selected=(rule?.mode??'off')===m;mode.append(o);}
      mode.addEventListener('change',()=>{const m=mode.value;trade.setAutoRule(row.resource,m==='off'?null:{mode:m,...this.autoDefaults(row,m)});this.renderAuto({force:true});document.querySelector(`[data-auto-mode="${row.resource}"]`)?.focus();});
      const settings=element('td','market-auto-settings');
      if(rule){
        const fields={sell:['keep','minPrice'],buy:['below','upTo','maxPrice'],between:['below','above','maxPrice','minPrice']}[rule.mode];
        for(const key of fields){const label=element('label','',t(`market.auto.${key}`)+' '),input=this.number(`auto-${row.resource}-${key}`,rule[key],key.endsWith('rice')?1:0,key.endsWith('rice')?AUTO_TRADE.maxPrice:AUTO_TRADE.maxAmount);input.dataset.autoField=key;input.dataset.autoResource=row.resource;
          input.addEventListener('change',()=>{const result=trade.setAutoRule(row.resource,{...trade.auto.rules[row.resource],[key]:Number(input.value)});input.classList.toggle('invalid',!result.ok);if(!result.ok)input.title=t(`market.auto.error.${result.error}`);else{input.title='';this.renderAutoNote(row.resource);}});
          label.append(input);settings.append(label,' ');}
        settings.append(element('span','market-auto-note'));
      }else settings.append(element('span','market-auto-hint',t('market.auto.price',{buy:row.buy,sell:row.sell})));
      const td=element('td');td.append(mode);tr.append(element('th','',row.name),td,settings);body.append(tr);
    }
    table.append(thead,body);
    root.replaceChildren(element('p','market-help',t('market.auto.help')),enabled,' ',budgetLabel,table);this.decorate(root);
    for(const id of Object.keys(a.rules))this.renderAutoNote(id);
  }
  number(id,value,min,max){const el=element('input','market-qty');el.type='number';el.id=id;el.min=String(min);el.max=String(max);el.step='1';el.value=String(value);return el;}
  // Starting values for a new rule: sell what is above the price-model reference; buy up to it at about 10 % over today's price.
  autoDefaults(row,mode){
    const reference=PRICE_MODEL.referenceStock[row.resource]??PRICE_MODEL.defaultReference;
    if(mode==='sell')return {keep:reference,minPrice:Math.max(1,price(row.resource,'sell')??1)};
    // Keep between (owner example: below 50 buy, above 300 sell).
    if(mode==='between')return {below:50,above:300,maxPrice:Math.max(row.buy,Math.round((price(row.resource,'buy')??1)*1.1)),minPrice:Math.max(1,price(row.resource,'sell')??1)};
    return {below:Math.max(1,Math.round(reference/2)),upTo:reference,maxPrice:Math.max(row.buy,Math.round((price(row.resource,'buy')??1)*1.1))};
  }
  renderAutoNote(resource){
    const note=document.querySelector(`[data-auto-resource="${resource}"] .market-auto-note`);if(!note)return;const trade=this.scene.trade,w=trade.autoWarning(resource);
    const row=this.prices().find(r=>r.resource===resource),parts=[t('market.auto.price',{buy:row?.buy??'–',sell:row?.sell??'–'})];
    if(trade.auto.visit&&trade.auto.visit.caravanId===this.scene.caravans?.active?.id&&trade.auto.visit.done.includes(resource))parts.push(t('market.auto.doneThisVisit'));
    const text=parts.join(' · ')+(w?' · '+t('market.auto.foodWarning',{left:w.left,reserve:w.reserve,days:AUTO_TRADE.foodReserveDays}):'');if(note.textContent!==text)note.textContent=text;note.classList.toggle('warning',!!w);
  }
  // Trade F2: totals, the best goods, recent trades and a price history chart.
  renderStats(){
    const root=document.querySelector('#marketplace-stats');const trade=this.scene.trade;if(!root||!trade?.summary)return;
    const s=trade.summary(),name=id=>this.scene.objectRegistry.get(id)?.name??id;
    {const key=JSON.stringify([trade.summary(),trade.stats.history,this.chartResource,document.documentElement.lang]);if(key===this.statsKey&&root.children.length&&!root.contains(document.activeElement))return;if(root.contains(document.activeElement))return;this.statsKey=key;}
    const parts=[element('h3','',t('market.stats.title')),element('p','market-stats-totals',t('market.stats.totals',{sold:s.sold,bought:s.bought,balance:(s.balance>0?'+':'')+s.balance,count:s.transactions}))];
    parts.push(element('p','market-stats-top',s.top.length?t('market.stats.top',{list:s.top.map(r=>`${name(r.resource)} (${r.value})`).join(', ')}):t('market.stats.none')));
    if(s.recent.length){const list=element('ul','market-recent');for(const r of s.recent.slice(0,6))list.append(element('li','',t(`market.stats.recent.${r.side}`,{day:r.day,quantity:r.quantity,good:name(r.resource),price:r.price})));parts.push(element('p','market-stats-sub',t('market.stats.recentTitle')),list);}
    const goods=Object.keys(trade.stats.history);
    if(goods.length){
      if(!goods.includes(this.chartResource))this.chartResource=goods[0];
      const select=element('select','market-chart-good');select.id='marketplace-chart-good';select.setAttribute('aria-label',t('market.stats.chartGood'));
      for(const id of goods){const o=element('option','',name(id));o.value=id;o.selected=id===this.chartResource;select.append(o);}
      select.addEventListener('change',()=>{this.chartResource=select.value;this.statsKey=null;select.blur();this.renderStats();});
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
    // Domestic animals Z1: Food and General merchants sometimes sell a cat (30 Gold); the buyer picks its home.
    const cats=this.scene.domestic?.catsForSale?.()??0,extra=[];
    if(cats){const buy=element('button','market-buy-cat',t('pets.buyButton',{price:CATS.price,count:cats}));buy.type='button';buy.id='market-buy-cat';buy.addEventListener('click',()=>this.scene.catPanel?.open(null,'buy'));extra.push(buy);}
    // m-obchod-vylepseni (57): parked Wheelbarrows and Horse Wagons can be sold to the merchant.
    const vehicles=trade.vehiclesForSale?.()??[];
    if(vehicles.length){const box=element('p','market-vehicles');box.id='market-vehicles';box.append(element('strong','',t('market.vehicles')+' '));
      for(const v of vehicles){const sell=element('button','market-sell-vehicle',t('market.sellVehicle',{good:this.scene.objectRegistry.get(v.type)?.name??v.type,price:v.price}));sell.type='button';sell.dataset.sellVehicle=v.id;
        sell.addEventListener('click',()=>{trade.sellVehicle(v.id);this.lastResult=null;this.tradeKey=null;this.render();});box.append(sell,' ');}
      extra.push(box);}
    const dog=this.scene.domestic?.dogForSale?.();
    if(dog){const buy=element('button','market-buy-dog',t('pets.dog.buyButton',{price:DOGS.price,name:dog.name}));buy.type='button';buy.id='market-buy-dog';buy.addEventListener('click',()=>this.scene.catPanel?.openDog(dog,'buyDog'));extra.push(buy);}
    root.replaceChildren(element('h3','',t('market.trade',{gold:c.gold})),table,quote,...extra);this.decorate(root);this.renderQuote();
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
    this.building=building;this.statusKey=this.pricesKey=this.autoStructure=this.statsKey=null;this.render();this.unsubscribe?.();this.unsubscribeTrade?.();this.unsubscribe=this.scene.caravans?.onChange(()=>{if(this.dialog.open)this.render();});this.unsubscribeTrade=this.scene.trade?.onChange(()=>{if(this.dialog.open)this.render();});
    if(!this.dialog.open){this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();clearInterval(this.timer);this.timer=setInterval(()=>{if(this.dialog.open)this.render();},1000);}
  }
  restore(){clearInterval(this.timer);this.timer=null;if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){if(this.dialog.open)this.dialog.close();this.restore();}
  relabel(){this.statusKey=this.pricesKey=this.autoStructure=this.statsKey=null;if(this.dialog.open)this.render();}
  destroy(){this.close();this.unsubscribe?.();this.unsubscribeTrade?.();this.controller.abort();}
}
