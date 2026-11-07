// E3 tips (plan m-e3-tipy): one bubble the first time something happens, never during the tutorial. Seen tips and the
// on/off switch are remembered in the browser, not in a save. `target`: where the arrow points (selector or 'cat'/'dog').
export const TIPS=Object.freeze([
  {id:'night',target:'#day-part'},
  {id:'food',target:'#food-countdown'},
  {id:'unemployed',target:'#population-tab'},
  {id:'material',target:'#notices-panel'},
  {id:'cat',target:'cat'},
  {id:'dog',target:'dog'},
  {id:'caravan',target:null},
  {id:'winter',target:'#season-weather'},
  // m-wiki-napoveda (33): the first rats – get a cat; "More" opens the Wiki on Rats & Cats.
  {id:'rats',target:'#notices-panel',wiki:'rats'},
].map(tip=>Object.freeze(tip)));
