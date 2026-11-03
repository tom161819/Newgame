import { SKILL_IDS,JOBS,POPULATION,WORK_RULES } from '../jobs.js';
export const characters = [
  {
    id: 'king', name: 'Král', category: 'character', sprite: '/assets/characters/king/king.png',
    width: 1, height: 1, walkable: false, collectible: false, buildable: false, cost: {}, interactions: ['move', 'collect', 'enter', 'exit'],
    description: 'Korunovaný vládce s červeným pláštěm. Chodí v osmi směrech, sbírá suroviny a vstupuje do věží.',
    renderMode: 'procedural', renderer: 'king', origin: { x: 0.5, y: 0.875 }, visualHeight: 55,
    shadow: { baked: true, x: 0, y: 1, width: 27, height: 12, color: 0x30291c, alpha: 0.32 }, depth: { offset: 0.1 },
    gameplay: { movementSpeed: 3.5, baseSight: 20 },
    experience:{initialLevel:1,maxLevel:50,enabled:true,gainMultiplier:1},
    skills:SKILL_IDS,workEfficiencyPerLevel:WORK_RULES.efficiencyPerLevel,
    stats: { maxHP: 100, attackDPS: 15, armor: 0, attackRange: 1, hpRegenPerSecond: 0.2 },
    animations: { mode: 'procedural', states: ['idle', 'walk'], directions: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] },
  },
  {
    id:'peasant',name:'Poddaný',category:'character',sprite:'/assets/characters/peasant/peasant.svg',
    width:1,height:1,walkable:false,collectible:false,buildable:false,cost:{},interactions:['inspect','assign_job'],
    description:'Obyvatel království s vlastními zkušenostmi, šesti skilly a jednou přiřazenou profesí.',
    renderMode:'procedural',renderer:'human',origin:{x:.5,y:.92},visualHeight:48,
    visual:{hitArea:{x:-13,y:-44,width:26,height:39},healthBarOffset:48},depth:{offset:.1},
    gameplay:{movementSpeed:3,initialCount:POPULATION.initial,behavior:'worker'},
    stats:{maxHP:60,attackDPS:6,armor:0,attackRange:1,hpRegenPerSecond:.2},
    experience:{initialLevel:1,maxLevel:50,enabled:true,gainMultiplier:1},
    skills:SKILL_IDS,availableJobs:Object.keys(JOBS),workEfficiencyPerLevel:WORK_RULES.efficiencyPerLevel,
    animations:{mode:'procedural',states:['idle','walk'],directions:['N','NE','E','SE','S','SW','W','NW']},
  },
];
