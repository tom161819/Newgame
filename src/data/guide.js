// Owner 15 Nov 2026: the start guide that replaced the step-by-step tutorial, the Getting started tasks and the tips.
// The owner edits these texts and their order in the Asset Studio (Guide page) and sends them for processing; Claude
// copies the result here (cs as written by the owner, en translated). Order in each list = order in the game.
//
// intro: arrows shown once per browser at the start of the first game. `check`: 'wiki' ends when the Wiki opens,
//   'ack' with the "Got it" button.
// tasks: the Getting started panel. kind 'build' = a finished building of `building`; 'job' = a resident has the
//   profession `job`; 'king' = the king was selected; 'water' = a river or pond tile is explored. When all are done
//   the panel goes away.
// tips: after the intro. kind 'sequence' = shown one after another, `gap` seconds of play after the previous one was
//   closed; kind 'event' = shown the first time its situation happens (the game decides when; only the text is edited).
export const GUIDE=Object.freeze({
  intro:Object.freeze([
    {id:'wiki',check:'wiki',target:'#wiki-toggle',text:{cs:'Tady je Wiki: informace o hře a jejích mechanikách. Otevři ji.',en:'This is the Wiki: information about the game and its mechanics. Open it.'}},
    {id:'tasks',check:'ack',target:'#help-dialog summary',text:{cs:'Panel Začínáme: kliknutím na úkol se otevře místo, kde ho splníš (např. Obyvatelé → Zaměstnání → Stavitel).',en:'Getting started: click a task to open the place where you do it (e.g. Population → Job → Builder).'}},
  ].map(step=>Object.freeze(step))),
  tasks:Object.freeze([
    {id:'granary',kind:'build',building:'granary',title:{cs:'Postav sýpku',en:'Build a Granary'},why:{cs:'Skladuje jídlo a odemkne další budovy jídla.',en:'It stores food and unlocks more food buildings.'}},
    {id:'builder',kind:'job',job:'builder',title:{cs:'Změň zaměstnání poddaného na stavitele',en:'Make a resident a Builder'},why:{cs:'Stavitelé stavějí budovy. Obyvatelé → Zaměstnání → Stavitel.',en:'Builders put up buildings. Population → Job → Builder.'}},
    {id:'hunting_lodge',kind:'build',building:'hunting_lodge',title:{cs:'Postav zdroj jídla – loveckou chatu',en:'Build a food source – a Hunting Lodge'},why:{cs:'Lovci nosí maso z divočiny.',en:'Hunters bring meat from the wild.'}},
    {id:'lumberjack_hut',kind:'build',building:'lumberjack_hut',title:{cs:'Postav dřevorubeckou chatu',en:'Build a Lumberjack Hut'},why:{cs:'Dřevorubci kácí stromy a nosí dřevo.',en:'Lumberjacks fell trees and bring wood.'}},
    {id:'material_yard',kind:'build',building:'material_yard',title:{cs:'Postav skladiště materiálu',en:'Build a Material Yard'},why:{cs:'Nosiči do něj nosí dřevo, kámen a rudu.',en:'Haulers bring wood, stone and ore to it.'}},
    {id:'king',kind:'king',title:{cs:'Vyber krále levým tlačítkem myši a prozkoumej okolí',en:'Select the king with the left mouse button and explore'},why:{cs:'Klikni na krále (nebo stiskni K), pak pravým tlačítkem ukaž, kam má jít.',en:'Click the king (or press K), then right-click where he should go.'}},
    {id:'water',kind:'water',title:{cs:'Najdi vodu – řeku nebo rybník',en:'Find water – a river or a pond'},why:{cs:'U vody postavíš rybářskou chatu.',en:'A Fisherman\'s Hut is built by the water.'}},
    {id:'fisherman_hut',kind:'build',building:'fisherman_hut',title:{cs:'Postav rybářskou chatu',en:'Build a Fisherman\'s Hut'},why:{cs:'Rybáři loví ryby, další zdroj jídla.',en:'Fishermen catch fish, another source of food.'}},
  ].map(task=>Object.freeze(task))),
  tips:Object.freeze([
    {id:'fullscreen',kind:'sequence',text:{cs:'Alt + Enter přepne hru na celou obrazovku.',en:'Alt + Enter switches the game to full screen.'}},
    {id:'king_key',kind:'sequence',text:{cs:'Klávesa K označí krále, mezerník na něj vrátí kameru.',en:'K selects the king, Space brings the camera back to him.'}},
    {id:'shift_build',kind:'sequence',text:{cs:'Když při stavění držíš Shift, postavíš víc budov stejného druhu za sebou.',en:'Hold Shift while building to place several buildings of the same kind in a row.'}},
    {id:'speed',kind:'sequence',target:'#speed-controls',text:{cs:'Tlačítky vpravo nahoře (nebo klávesami 1–3) zrychlíš čas.',en:'The buttons at the top right (or keys 1–3) speed up time.'}},
    {id:'night',kind:'event',target:'#day-part',text:null},
    {id:'food',kind:'event',target:'#food-countdown',text:null},
    {id:'unemployed',kind:'event',target:'#population-tab',text:null},
    {id:'material',kind:'event',target:'#notices-panel',text:null},
    {id:'cat',kind:'event',target:'cat',text:null},
    {id:'dog',kind:'event',target:'dog',text:null},
    {id:'caravan',kind:'event',target:null,text:null},
    {id:'winter',kind:'event',target:'#season-weather',text:null},
    {id:'rats',kind:'event',target:'#notices-panel',wiki:'rats',text:null},
  ].map(tip=>Object.freeze(tip))),
  tipGap:90,
});
export const GUIDE_TASK_KINDS=Object.freeze(['build','job','king','water']);
// A text of the guide in the language of the game (cs or en, the other one as fallback); null when none is written.
export function guideText(text,lang='cs'){if(!text)return null;return text[lang]||text.cs||text.en||null;}
