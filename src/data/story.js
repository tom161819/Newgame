// m-pribeh-vlci-ujezd, phases F2–F5 (owner 21 Nov 2026): the story "Vlčí újezd", Bohemia 1419–1437, as data.
// Historically inspired fiction: the kings, battles and dates are real; the house of Kamenný Brod (father Bohuslav,
// brother Smil, the player Hynek), Mikeš, Anežka, Purkart and the places Kamenný Brod and Vlčí újezd are invented.
// Chapters 1–4 follow the Castle level (and a minimum time); chapter 4 ends with a lasting choice of side; chapters
// 5–7 then run by time through the real events to the epilogue (chapter 8) and an ending. Days are game days.
export const STORY=Object.freeze({
  minChapterDays:10,             // chapters 2–4: at least this long after the previous one began
  lateChapterDays:20,            // chapters 5–7 last this long
  years:Object.freeze({1:[1420,1420],2:[1420,1420],3:[1420,1421],4:[1421,1421],5:[1421,1424],6:[1426,1431],7:[1434,1436],8:[1437,1437]}),
  smil:Object.freeze({firstDay:6,everyDays:7,slander:-4,sabotageShare:.1,guards:2}),
  accuseTrust:30,
  raid:Object.freeze({smil:.5,mercs:.8,hussite:.7,royal:1,tribute:.6,lastStand:2,plunderShare:.3}),
  raidEveryDays:16,              // after the choice: Hussite raids (crown), royal armies (Prague, Tábor), tribute (own)
  income:Object.freeze({crown:4,prague:6,tabor:0,own:8}),   // gold a day × Castle level after the choice
  tributeGold:35,                // × Castle level
  reinforcements:6,              // Tábor: brothers who join at the choice
  evidenceMax:3,
});
export const FACTIONS=Object.freeze(['crown','prague','tabor','own']);
// Events: `ch` chapter, `day` days after the chapter began, `f` only for that side, `flag`/`not` conditions,
// `fx` effects, `choices` [{id, fx}]. Texts: story.<id>.title / .from / .body, choices story.<id>.<choice>.
// Effects: trust, gold, evidence, flag, faction, raid (kind), soldiers.
const e=(id,ch,day,extra={})=>Object.freeze({id,ch,day,...extra});
export const STORY_EVENTS=Object.freeze([
  e('prologue',1,0),e('purkart',1,1),e('smilLetter',1,4),
  e('crusade',2,0),e('sudomer',2,3),e('tabor',2,6),e('vitkov',2,9),
  e('aid',3,0,{choices:[{id:'send',fx:{gold:-40,trust:10,flag:'aidSent'}},{id:'refuse',fx:{trust:-15}}]}),e('vysehrad',3,4),e('anezka',3,7),
  e('caslav',4,0),e('choice',4,2,{choices:[{id:'crown',fx:{faction:'crown',trust:15}},{id:'prague',fx:{faction:'prague'}},{id:'tabor',fx:{faction:'tabor',soldiers:STORY.reinforcements}},{id:'own',fx:{faction:'own'}}]}),
  e('crown5',5,0,{f:'crown'}),e('prague5',5,0,{f:'prague'}),e('tabor5',5,0,{f:'tabor'}),e('own5',5,0,{f:'own'}),
  e('pragueDispute',5,5,{f:'prague',choices:[{id:'help',fx:{gold:-30,trust:8}},{id:'aside',fx:{trust:-5}}]}),
  e('taborBrother',5,5,{f:'tabor',fx:{raid:'royal'}}),
  e('landfryd',5,5,{f:'own',choices:[{id:'found',fx:{gold:-50,flag:'landfryd'}},{id:'alone',fx:{}}]}),
  e('zizka',5,12),
  e('usti',6,0),e('ustiCrown',6,1,{f:'crown',choices:[{id:'send',fx:{gold:-50,trust:8}},{id:'home',fx:{trust:-10}}]}),
  e('negotiator',6,6,{f:'prague',choices:[{id:'ransom',fx:{gold:-40,trust:8,flag:'negotiator'}},{id:'no',fx:{}}]}),
  e('rides',6,6,{f:'tabor',choices:[{id:'ride',fx:{gold:80,trust:6,flag:'ride'}},{id:'home',fx:{trust:-4}}]}),
  e('island',6,6,{f:'own',fx:{gold:60}}),e('islandSmil',6,10,{f:'own',fx:{raid:'mercs'}}),
  e('domazlice',6,12),e('domazliceCrown',6,13,{f:'crown',fx:{trust:-5}}),
  e('lipanyCrown',7,0,{f:'crown',fx:{trust:5}}),
  e('lipanyPrague',7,0,{f:'prague',choices:[{id:'fight',fx:{trust:10,flag:'lipanyFought'}},{id:'aside',fx:{}},{id:'warn',fx:{trust:-30,flag:'traitor'}}]}),
  e('lipanyTabor',7,0,{f:'tabor',choices:[{id:'stand',fx:{flag:'lastStand',raid:'lastStand'}},{id:'leave',fx:{trust:-20,flag:'left'}},{id:'turn',fx:{flag:'turncoat'}}]}),
  e('lipanyOwn',7,0,{f:'own'}),
  e('jihlava',7,10),
  e('epilogue',8,0),
]);
// The ending by side, flags, evidence and trust.
export function storyEnding({faction,flags={},evidence=0,trust=0,smilFallen=false}){
  const proof=smilFallen||evidence>=STORY.evidenceMax;
  if(faction==='crown')return proof?'crownBrod':trust<25?'crownFall':'crownSecond';
  if(faction==='prague')return flags.traitor?'pragueTraitor':proof?'pragueBrod':'pragueLord';
  if(faction==='tabor')return flags.lastStand?'taborLast':flags.turncoat?'taborTurncoat':'taborSurvivor';
  if(faction==='own')return proof&&flags.landfryd?'ownBrod':flags.landfryd?'ownFree':'ownIsland';
  return null;
}
export const STORY_ENDINGS=Object.freeze(['crownBrod','crownFall','crownSecond','pragueTraitor','pragueBrod','pragueLord','taborLast','taborTurncoat','taborSurvivor','ownBrod','ownFree','ownIsland']);
// Letters that are not events of a chapter (they come from what happens in the game).
export const STORY_EXTRA_LETTERS=Object.freeze(['evidence1','evidence2','evidence3','accused','tribute','raidLost',...STORY_ENDINGS.map(id=>`ending.${id}`)]);
