// m-wiki-napoveda (owner 7 Nov 2026): the in-game Wiki. Pages for buildings, resources and professions are generated
// from the game's own data (src/systems/Wiki.js), so they never go out of date. The topic pages below are written by
// hand (texts `wiki.topic.<id>.title` / `.body` in i18n, EN and CS) and link to related pages.
// m-wiki-v2: hand-written parts of a page (i18n key wiki.text.<kind>.<id>.<part>) and the ends of a chain.
export const WIKI_TEXT_PARTS=Object.freeze(['why','how','tips']);
export const wikiTextKey=(pageId,part)=>`wiki.text.${String(pageId).replace(':','.')}.${part}`;
export const WIKI_SINKS=Object.freeze(['people','construction','haulers']);
export const WIKI_CATEGORIES=Object.freeze(['guides','chains','units','systems','buildings','resources','professions','animals','needs','policy','trade','seasons','events']);
export const WIKI_TOPICS=Object.freeze([
  Object.freeze({id:'rats',category:'animals',links:Object.freeze(['building:granary','building:farmhouse','topic:dogs','resource:bread'])}),
  Object.freeze({id:'dogs',category:'animals',links:Object.freeze(['building:hunting_lodge','profession:hunter','topic:rats'])}),
  Object.freeze({id:'fire',category:'events',links:Object.freeze(['building:well','building:house','topic:needs'])}),
  Object.freeze({id:'needs',category:'needs',links:Object.freeze(['building:house','topic:taxes','topic:rats'])}),
  Object.freeze({id:'taxes',category:'policy',links:Object.freeze(['topic:needs','resource:gold'])}),
  Object.freeze({id:'trade',category:'trade',links:Object.freeze(['building:marketplace','building:warehouse','resource:gold'])}),
  Object.freeze({id:'winter',category:'seasons',links:Object.freeze(['building:fisherman_hut','building:granary','topic:needs'])}),
  Object.freeze({id:'builders',category:'professions',links:Object.freeze(['building:builder_workshop','profession:builder','profession:hauler'])}),
]);
// Generated pages that also link to a topic.
export const WIKI_PAGE_LINKS=Object.freeze({
  'building:granary':['topic:rats','topic:winter'],'building:warehouse':['topic:trade'],'building:starter_stockpile':['topic:rats'],'building:farmhouse':['topic:rats'],
  'building:hunting_lodge':['topic:dogs'],'building:well':['topic:fire'],'building:house':['topic:needs','topic:fire','topic:rats'],
  'building:marketplace':['topic:trade'],'building:builder_workshop':['topic:builders'],'building:fisherman_hut':['topic:winter'],
  'profession:builder':['topic:builders'],'profession:hunter':['topic:dogs'],'resource:gold':['topic:taxes','topic:trade'],
});
// Event feed keys (by prefix) and Notices reasons with a Wiki topic: they show a small "i" that opens it.
export const WIKI_FEED_TOPICS=Object.freeze({rats:'rats',cat:'rats',dog:'dogs',caravan:'trade',trade:'trade',strike:'needs',leaving:'needs',emigration:'needs',fire:'fire',season:'winter'});
export const WIKI_NOTICE_TOPICS=Object.freeze({foodLow:'needs',food:'needs',noBuilder:'builders',waitingMaterial:'builders',noHauler:'builders',noWater:'fire',gold:'taxes'});
export const wikiTopicForFeed=key=>WIKI_FEED_TOPICS[String(key).split(':')[0]]??null;

// m-wiki-v2 part (c): hand-written pages beyond the data – units, animals, systems (how a part of the game works) and
// guides. Title wiki.title.<kind>.<id>, texts wiki.text.<kind>.<id>.<why|how|tips>; units and animals also get their
// numbers from the data (src/systems/Wiki.js). `links`: related pages.
const entry=(id,category,links=[])=>Object.freeze({id,category,links:Object.freeze(links)});
export const WIKI_ENTRIES=Object.freeze([
  entry('unit:resident','units',['building:house','topic:needs','system:work_speed','system:employment','system:children']),
  entry('unit:king','units',['building:castle','building:stables','building:tower','system:experience']),
  entry('unit:recruit','units',['building:barracks','unit:soldier','unit:archer','system:night']),
  entry('unit:soldier','units',['building:barracks','building:armory','resource:sword','unit:swordsman']),
  entry('unit:archer','units',['building:barracks','building:armory','resource:bow','building:bowyer']),
  entry('unit:swordsman','units',['building:barracks','building:armory','resource:sword','unit:knight']),
  entry('unit:knight','units',['building:barracks','building:armory','resource:armor','unit:light_cavalry']),
  entry('unit:halberdier','units',['building:barracks','building:swordsmith','resource:halberd','resource:armor']),
  entry('unit:royal_archer','units',['building:barracks','building:bowyer','resource:bow','unit:archer']),
  entry('unit:crossbowman','units',['building:barracks','building:bowyer','resource:crossbow','resource:light_armor']),
  entry('unit:light_cavalry','units',['building:barracks','building:stables','resource:sword','unit:knight']),
  entry('unit:catapult','units',['building:barracks','building:builder_workshop','resource:stone','unit:military_wagon']),
  entry('unit:military_wagon','units',['building:barracks','building:wheelwright_workshop','resource:horse_wagon','unit:catapult']),
  entry('unit:caravan','units',['building:marketplace','topic:trade','system:expedition']),
  entry('animal:rabbit','animals',['building:hunting_lodge','resource:meat']),
  entry('animal:deer','animals',['building:hunting_lodge','resource:meat']),
  entry('animal:wild_boar','animals',['building:hunting_lodge','resource:meat','topic:dogs']),
  entry('animal:wolf','animals',['system:night','building:brazier','building:barracks']),
  entry('animal:horse','animals',['building:stables','unit:light_cavalry','resource:horse_wagon']),
  entry('animal:cat','animals',['topic:rats','building:granary','building:house']),
  entry('system:night','systems',['animal:wolf','topic:fire','building:torch_post','building:brazier','building:tower','unit:recruit']),
  entry('system:heating','systems',['building:house','resource:wood','building:lumberjack_hut','guide:winter','system:seasons']),
  entry('system:seasons','systems',['topic:winter','building:wheat_field','building:fisherman_hut']),
  entry('system:work_speed','systems',['topic:needs','system:experience','building:builder_workshop']),
  entry('system:experience','systems',['unit:resident','unit:king']),
  entry('system:employment','systems',['building:castle','unit:resident']),
  entry('system:logistics','systems',['profession:hauler','building:material_yard','building:granary','building:warehouse','resource:wheelbarrow']),
  entry('system:paths','systems',['building:stone_pavement','system:forestry']),
  entry('system:forestry','systems',['building:lumberjack_hut','resource:wood','system:paths']),
  entry('system:deposits','systems',['building:quarry','building:iron_mine','resource:stone','resource:iron_ore']),
  entry('system:walls','systems',['building:wall','building:gate','building:tower','unit:recruit']),
  entry('system:expedition','systems',['building:marketplace','resource:horse_wagon','unit:caravan']),
  entry('system:children','systems',['building:village_green','building:swing_tree','building:haystack','building:house']),
  entry('system:fog','systems',['building:tower','system:night']),
  entry('system:map_size','systems',['system:deposits','system:forestry']),
  entry('guide:first_day','guides',['building:lumberjack_hut','building:house','building:granary','building:hunting_lodge','building:builder_workshop']),
  entry('guide:bread','guides',['topic:chains','building:farmhouse','building:wheat_field','building:mill','building:bakery']),
  entry('guide:army','guides',['building:barracks','building:armory','building:smelter','building:swordsmith','building:bowyer']),
  entry('guide:winter','guides',['system:seasons','topic:winter','building:granary']),
  entry('guide:night','guides',['system:night','building:torch_post','building:pitch_kiln','building:tower','unit:recruit']),
]);
