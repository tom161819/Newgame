import { PORCH_ART,porchId } from '../porches.js';
export const decorations = [
  {
    id: 'rock_outcrop', name: 'Skalní překážka', category: 'decoration', sprite: '/assets/decorations/rocks/rock-outcrop.webp',
    width: 1, height: 1, walkable: false, collectible: false, buildable: false, cost: {}, interactions: [],
    description: 'Pevná skalní překážka, kterou král musí obejít. Není určena ke sběru.',
    renderMode: 'sprite', renderer: 'outcrop', origin: { x: 0.5, y: 0.72 }, visualHeight: 38, depth: { offset: 0.05 },
    shadow: { baked: true, x: 1, y: 1, width: 52, height: 17, color: 0x302d20, alpha: 0.3 },
  },

  // #100 Bushes approved in the Studio (art/sprites/bush, 7 Nov; v2 = the owner's Blender renders, approved 20 Nov): walkable decoration drawn on open ground,
  // hidden under buildings, paving, resources and well-trodden paths.
  {
    id: 'bush_meadow', name: 'Luční keř', category: 'decoration', sprite: '/assets/decorations/bushes/bush-meadow.v2.png', artSource: 'art/sprites/bush/bush-meadow.v2.json',
    width: 1, height: 1, walkable: true, collectible: false, buildable: false, cost: {}, interactions: [],
    description: 'Hustý zelený keř na louce.', renderMode: 'sprite', origin: { x: 0.40426, y: 0.81818 }, visualHeight: 33, depth: { offset: 0.04 },
  },
  {
    id: 'bush_berry', name: 'Keř s bobulemi', category: 'decoration', sprite: '/assets/decorations/bushes/bush-berry.v2.png', artSource: 'art/sprites/bush/bush-berry.v2.json',
    width: 1, height: 1, walkable: true, collectible: false, buildable: false, cost: {}, interactions: [],
    description: 'Keř s červenými bobulemi.', renderMode: 'sprite', origin: { x: 0.46341, y: 0.93548 }, visualHeight: 31, depth: { offset: 0.04 },
  },
  {
    id: 'bush_flowering', name: 'Kvetoucí keř', category: 'decoration', sprite: '/assets/decorations/bushes/bush-flowering.v2.png', artSource: 'art/sprites/bush/bush-flowering.v2.json',
    width: 1, height: 1, walkable: true, collectible: false, buildable: false, cost: {}, interactions: [],
    description: 'Keř s drobnými květy.', renderMode: 'sprite', origin: { x: 0.45833, y: 0.77143 }, visualHeight: 35, depth: { offset: 0.04 },
  },
  {
    id: 'bush_scrub', name: 'Suchý křovinatý keř', category: 'decoration', sprite: '/assets/decorations/bushes/bush-scrub.v2.png', artSource: 'art/sprites/bush/bush-scrub.v2.json',
    width: 1, height: 1, walkable: true, collectible: false, buildable: false, cost: {}, interactions: [],
    description: 'Suchá křovina na poušti.', renderMode: 'sprite', origin: { x: 0.5, y: 0.93333 }, visualHeight: 30, depth: { offset: 0.04 },
  },
];
// #98 Workplace porches: walkable decorations drawn in front of workplaces by PorchSystem (never placed by the player).
decorations.push(...Object.entries(PORCH_ART).map(([variant,art])=>({
  id:porchId(variant),name:'Porch',category:'decoration',sprite:art.sprite,artSource:art.artSource,width:2,height:1,walkable:true,collectible:false,buildable:false,
  cost:{},interactions:[],description:'Seats in front of a workplace where idle workers sit.',renderMode:'sprite',origin:art.origin,visualHeight:art.visualHeight,depth:{offset:0},porch:{variant},
})));
