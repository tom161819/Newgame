export const TALENT_XP_BONUS=.20;
// Gold has no treasury limit any more (owner 7 Nov 2026, m-suroviny-sklady-zlato-zelezo; it was 500).
export const GOLD_LIMIT=Infinity;
export const TALENTS=Object.freeze({woodcutting:'Natural Woodcutter',mining:'Natural Miner',hunting:'Natural Hunter',construction:'Natural Builder',farming:'Natural Farmer',combat:'Natural Fighter',fishing:'Natural Fisher'});
export const STARTING_SKILLS=Object.freeze({talentMin:3,talentMax:8,secondaryMin:1,secondaryMax:4});
export const BASE_DAILY_WAGES=Object.freeze({idle:0,woodcutter:1,miner:1,hunter:1,fisher:1,builder:1,farmer:1,soldier:2,miller:1,baker:1,hauler:1,smelter_operator:1,bowyer:2,swordsmith:2,armorer:2,wheelwright:1,stablehand:1,pitch_maker:1});
export const WAGE_LEVEL_INTERVAL=10;
