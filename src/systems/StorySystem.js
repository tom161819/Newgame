import { STORY,STORY_EVENTS,FACTIONS,storyEnding,STORY_EXTRA_LETTERS } from '../data/story.js';
import { COURT } from '../data/court.js';
import { kingdomLevel } from '../data/kingdomRank.js';
import { FOOD_RESOURCE_IDS } from '../data/foodProduction.js';
import { t } from '../i18n/index.js';

// m-pribeh-vlci-ujezd F2–F5: chapters, letters with choices, the brother Smil as a rival, evidence against him, the
// choice of side and the endings (data/story.js). Works with CourtSystem (trust, orders, armies). Everything is
// counted in whole game days and saved.
const EVENT=new Map(STORY_EVENTS.map(ev=>[ev.id,ev]));
export class StorySystem {
  constructor(scene,court,{reinforce=null}={}){
    this.scene=scene;this.court=court;this.reinforce=reinforce;
    this.chapter=1;this.chapterDay=1;this.fired=[];this.inbox=[];this.read=[];this.evidence=0;this.faction=null;this.flags={};
    this.smilNext=STORY.smil.firstDay;this.smilStep=0;this.raid=null;this.nextRaidDay=0;this.incomeDay=1;this.ending=null;this.pending=null;
    this.wait=0;this.revision=0;this.listeners=new Set();
    // A thief caught by the guards talks (the first piece of evidence), from chapter 2 on.
    const threats=scene.nightThreats;if(threats?.caught&&!threats.storyHooked){const caught=threats.caught.bind(threats);threats.storyHooked=true;threats.caught=(...a)=>{const r=caught(...a);scene.story?.thiefCaught();return r;};}
  }
  get active(){return !!this.scene.kingdomRanks&&!this.scene.sandbox;}
  get day(){return this.scene.gameTime?.day??1;}
  get level(){return kingdomLevel(this.scene.buildings);}
  get smilFallen(){return !!this.flags.smilFallen;}
  get year(){const [a,b]=STORY.years[this.chapter]??STORY.years[8],span=this.chapter>=5&&this.chapter<=7?STORY.lateChapterDays:STORY.minChapterDays;
    return Math.round(a+(b-a)*Math.min(1,Math.max(0,(this.day-this.chapterDay)/span)));}
  on(l){this.listeners.add(l);return()=>this.listeners.delete(l);}
  emit(type,detail){this.revision++;for(const l of [...this.listeners])l(type,detail);}
  feed(key,text){this.scene.eventFeed?.push?.(`story:${key}:${this.day}`,text,{important:true});}
  // A letter goes to the inbox; the panel opens the first unread one.
  post(id){if(this.inbox.includes(id)||this.read.includes(id))return;this.inbox.push(id);this.emit('letter',id);}
  choicesOf(id){return EVENT.get(id)?.choices??null;}
  // Closing a letter: with choices one must be picked.
  close(id,choice=null){
    if(this.inbox[0]!==id)return false;const choices=this.choicesOf(id);
    if(choices){const picked=choices.find(c=>c.id===choice);if(!picked)return false;this.apply(picked.fx,`${id}:${choice}`);this.flags[`${id}.${choice}`]=true;}
    this.inbox.shift();this.read.push(id);this.emit('read',id);return true;
  }
  apply(fx={},key=''){
    const s=this.scene;
    if(fx.gold){if(fx.gold>0)s.inventory?.add?.('gold',fx.gold,{source:'Story',id:`story:${key}`});else{const have=Math.floor(s.inventory?.count?.('gold')??0),pay=Math.min(have,-fx.gold);if(pay>0)s.inventory.spend('gold',pay,{source:'Story',id:`story:${key}`});
      if(pay<-fx.gold&&this.court?.active)this.court.changeTrust(-5,'unpaid');}s.updateInventory?.();}
    if(fx.flag)this.flags[fx.flag]=true;
    if(fx.faction&&FACTIONS.includes(fx.faction)&&!this.faction){this.faction=fx.faction;this.nextRaidDay=this.day+STORY.raidEveryDays;this.incomeDay=this.day;
      // A new lord of the orders: trust starts again in the middle (the Crown keeps what was earned).
      if(this.court&&fx.faction!=='crown'){this.court.trust=50;this.court.countdownDay=null;this.court.collected=false;this.court.orders=[];this.court.fine=0;this.court.nextOrderDay=this.day+2;}
      this.emit('faction',fx.faction);}
    if(fx.trust&&this.court?.active)this.court.changeTrust(fx.trust,`story:${key}`);
    if(fx.evidence)this.addEvidence();
    if(fx.soldiers)this.reinforce?.(fx.soldiers);
    if(fx.raid)this.pending=fx.raid;
  }
  addEvidence(){if(this.evidence>=STORY.evidenceMax||this.smilFallen)return false;this.evidence++;this.post(`evidence${this.evidence}`);this.emit('evidence',this.evidence);return true;}
  thiefCaught(){if(this.active&&this.chapter>=2&&this.evidence===0)this.addEvidence();}
  canAccuse(){return this.evidence>=STORY.evidenceMax&&!this.smilFallen&&(this.faction===null||this.faction==='crown')&&!!this.court?.active;}
  accuse(){if(!this.canAccuse())return false;this.flags.smilFallen=true;this.court.changeTrust(STORY.accuseTrust,'accuse');this.post('accused');this.emit('accused');return true;}
  soldiers(){return (this.scene.workerSystem?.liveSubjects?.()??[]).filter(w=>w.profession==='soldier').length;}
  // An attack on the Castle: the units of a punitive expedition for this Castle level, scaled by the kind.
  startRaid(kind){
    if(this.raid||this.court?.expedition||this.court?.foes?.().length)return false;const factor=STORY.raid[kind]??1,base=COURT.expedition.units[this.level]??COURT.expedition.units[1],units={};
    for(const [id,n] of Object.entries(base))units[id]=Math.max(1,Math.round(n*factor));
    const count=this.court?.spawn?.(units)??0;if(!count)return false;this.raid={kind,day:this.day};this.feed(`raid:${kind}`,t(`story.raid.${kind}`,{count}));this.emit('raid',kind);return true;
  }
  updateRaid(){
    const court=this.court,foes=court.foes(),kind=this.raid.kind;
    if(foes.length&&court.castleFallen()){court.plunder(STORY.raid.plunderShare);for(const a of foes)this.scene.animalSystem?.remove?.(a);this.raid=null;this.post('raidLost');this.feed('raid-lost',t('story.raid.lost'));this.emit('raidEnd',{kind,won:false});return;}
    if(foes.length){const idle=foes.filter(a=>!a.marching&&!a.onWall);if(idle.length)this.scene.enemyArmy?.march?.(idle);return;}
    this.raid=null;this.feed('raid-won',t('story.raid.won'));
    // Smil's men: a prisoner talks. Evidence two needs chapter 3, three needs chapter 4.
    if(['smil','mercs','royal','tribute'].includes(kind)&&this.evidence>=1&&this.evidence<Math.min(STORY.evidenceMax,this.chapter-1))this.addEvidence();
    if(court.active&&kind!=='smil')court.changeTrust(4,'raid');
    this.emit('raidEnd',{kind,won:true});
  }
  // Smil's schemes, every few days until he falls: slander at court, a saboteur, hired raiders, mercenaries.
  smilActs(){
    const S=STORY.smil,step=this.smilStep++,s=this.scene;
    const raid=this.chapter>=4?'mercs':this.chapter===3?'smil':null;
    if(raid&&step%2===0&&this.startRaid(raid))return;
    if(this.chapter>=2&&step%2===1&&!this.faction){
      if(this.soldiers()>=S.guards){this.feed('saboteur',t('story.smil.caught'));if(this.evidence===0)this.addEvidence();return;}
      const lost=[];for(const id of ['wood',...FOOD_RESOURCE_IDS]){const n=Math.floor((s.inventory?.count?.(id)??0)*S.sabotageShare);if(n>0&&s.inventory.spend(id,n,{source:'Story',id:`story:sabotage:${this.day}:${id}`}))lost.push(`${n} ${t(`court.res.${id}`)}`);}
      s.updateInventory?.();this.feed('sabotage',t('story.smil.sabotage',{list:lost.join(', ')||'—'}));return;
    }
    if(this.court?.active&&(this.faction===null||this.faction==='crown')){this.feed('slander',t('story.smil.slander'));this.court.changeTrust(S.slander,'slander');}
  }
  advanceChapter(){
    const day=this.day,c=this.chapter,since=day-this.chapterDay;let next=null;
    if(c<4){if(this.level>=c+1&&since>=STORY.minChapterDays)next=c+1;}
    else if(c===4){if(this.faction)next=5;}
    else if(c<8){if(since>=STORY.lateChapterDays)next=c+1;}
    if(next){this.chapter=next;this.chapterDay=day;this.feed(`chapter:${next}`,t('story.chapterNews',{n:next,name:t(`story.chapter.${next}`)}));this.emit('chapter',next);}
  }
  update(delta=0){
    if(!this.active)return;this.wait-=delta;if(this.wait>0)return;this.wait=500;const day=this.day,s=this.scene;
    if(this.raid){this.updateRaid();return;}
    if(this.pending&&this.startRaid(this.pending))this.pending=null;
    this.advanceChapter();
    for(const ev of STORY_EVENTS){
      if(ev.ch!==this.chapter||this.fired.includes(ev.id)||day-this.chapterDay<ev.day)continue;if(ev.f&&ev.f!==this.faction)continue;
      this.fired.push(ev.id);if(ev.fx)this.apply(ev.fx,ev.id);this.post(ev.id);
    }
    if(this.chapter===8&&!this.ending&&this.fired.includes('epilogue')&&!this.inbox.includes('epilogue')){
      this.ending=storyEnding({faction:this.faction,flags:this.flags,evidence:this.evidence,trust:this.court?.trust??0,smilFallen:this.smilFallen});if(this.ending)this.post(`ending.${this.ending}`);this.emit('ending',this.ending);}
    if(!this.smilFallen&&this.chapter<8&&(this.faction===null||this.faction==='crown')&&day>=this.smilNext){this.smilNext=day+STORY.smil.everyDays;this.smilActs();}
    if(this.faction&&this.chapter<8){
      if(day>this.incomeDay){const gold=(STORY.income[this.faction]??0)*this.level*(day-this.incomeDay);this.incomeDay=day;if(gold>0){s.inventory?.add?.('gold',gold,{source:'Story',id:`story:income:${day}`});s.updateInventory?.();}}
      if(day>=this.nextRaidDay&&!this.pending){this.nextRaidDay=day+STORY.raidEveryDays;
        if(this.faction==='own'){this.inbox=this.inbox.filter(id=>id!=='tribute');this.read=this.read.filter(id=>id!=='tribute');this.post('tribute');}
        else this.startRaid(this.faction==='crown'?'hussite':'royal');}
    }
  }
  // The tribute letter (own lord) is not an event of a chapter: pay, or they come.
  closeTribute(pay){
    if(this.inbox[0]!=='tribute')return false;const cost=STORY.tributeGold*this.level;
    if(pay){if((this.scene.inventory?.count?.('gold')??0)<cost||!this.scene.inventory.spend('gold',cost,{source:'Story',id:`story:tribute:${this.day}`}))return false;this.scene.updateInventory?.();}
    else this.pending='tribute';
    this.inbox.shift();this.read.push('tribute');this.emit('read','tribute');return true;
  }
  exportState(){return {chapter:this.chapter,chapterDay:this.chapterDay,fired:[...this.fired],inbox:[...this.inbox],read:[...this.read],evidence:this.evidence,faction:this.faction,flags:{...this.flags},
    smilNext:this.smilNext,smilStep:this.smilStep,raid:this.raid?{...this.raid}:null,nextRaidDay:this.nextRaidDay,incomeDay:this.incomeDay,ending:this.ending,pending:this.pending};}
  importState(d){
    if(!d){
      // A save from before the story: no prologue in the middle of a game; the chapter follows the Castle at once.
      this.chapter=Math.min(4,this.level);this.chapterDay=this.day;this.fired=STORY_EVENTS.filter(ev=>ev.ch<this.chapter||ev.id==='prologue').map(ev=>ev.id);this.smilNext=this.day+STORY.smil.everyDays;this.incomeDay=this.day;this.emit('loaded');return;}
    Object.assign(this,{chapter:d.chapter,chapterDay:d.chapterDay,fired:[...d.fired],inbox:[...d.inbox],read:[...d.read],evidence:d.evidence,faction:d.faction,flags:{...d.flags},smilNext:d.smilNext,smilStep:d.smilStep,
      raid:d.raid?{...d.raid}:null,nextRaidDay:d.nextRaidDay,incomeDay:d.incomeDay,ending:d.ending,pending:d.pending});this.wait=0;this.emit('loaded');
  }
  destroy(){this.listeners.clear();}
}
const int=v=>Number.isSafeInteger(v)&&v>=0;
const LETTERS=new Set([...STORY_EVENTS.map(ev=>ev.id),...STORY_EXTRA_LETTERS]),RAIDS=new Set(Object.keys(STORY.raid).filter(k=>k!=='plunderShare'));
export function validStoryState(d){
  if(!d||typeof d!=='object'||Array.isArray(d))return false;
  if(Object.keys(d).sort().join()!=='chapter,chapterDay,ending,evidence,faction,fired,flags,inbox,incomeDay,nextRaidDay,pending,raid,read,smilNext,smilStep')return false;
  if(!int(d.chapter)||d.chapter<1||d.chapter>8||!int(d.chapterDay)||!int(d.evidence)||d.evidence>STORY.evidenceMax||!int(d.smilNext)||!int(d.smilStep)||!int(d.nextRaidDay)||!int(d.incomeDay))return false;
  if(!(d.faction===null||FACTIONS.includes(d.faction))||!(d.ending===null||STORY_EXTRA_LETTERS.includes(`ending.${d.ending}`))||!(d.pending===null||RAIDS.has(d.pending)))return false;
  if(!(d.raid===null||(d.raid&&RAIDS.has(d.raid.kind)&&int(d.raid.day)&&Object.keys(d.raid).length===2)))return false;
  for(const list of [d.fired,d.inbox,d.read])if(!Array.isArray(list)||new Set(list).size!==list.length)return false;
  if(!d.fired.every(id=>EVENT.has(id))||![...d.inbox,...d.read].every(id=>LETTERS.has(id)))return false;
  if(!d.flags||typeof d.flags!=='object'||Array.isArray(d.flags)||Object.keys(d.flags).length>60||!Object.entries(d.flags).every(([k,v])=>/^[\w.]{1,40}$/.test(k)&&v===true))return false;
  return true;
}
