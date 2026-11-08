import { FOOD_RESOURCE_IDS } from './foodProduction.js';

// Production and work diagnostics: how often to look and how long a problem must last before it is reported (game
// time). How often the same problem may come again is NOTICE_REPEAT below (in game days).
export const DIAGNOSTICS=Object.freeze({checkInterval:2000,persistence:10000,
  // Plan m-e1-stavitele-material: a site whose materials are in the stores but have not arrived for this long gets a
  // notice, and its Builders start carrying them themselves even while a Hauler is free (a quarter of a game day).
  materialWait:30000});
export const NOTICE_CATEGORIES=Object.freeze(['construction','production']);
// Where a production input comes from: the building that makes it, a field it needs, and the profession that works it.
export const INPUT_SOURCES=Object.freeze({
  wheat:Object.freeze({building:'farmhouse',field:'wheat_field',profession:'farmer'}),
  flour:Object.freeze({building:'mill',profession:'miller'}),
  iron_ore:Object.freeze({building:'iron_mine',profession:'miner'}),
  wood:Object.freeze({building:'lumberjack_hut',profession:'woodcutter'}),
});

// m-notice-bar-hlasky (owner request 72): the same notice (same reason + same building or resource) comes again at
// most once per this many game days – also when the problem goes away and comes back. While it lasts it stays as one
// row with a count. Danger (attacks, fire) is never held back. A reason not listed is a warning.
export const NOTICE_REPEAT_DAYS=Object.freeze({info:1,warning:.5,danger:0});
export const NOTICE_SEVERITY=Object.freeze({depleted:'info',noWater:'info',noInput:'info',noProducer:'info',noField:'info',missingChainSource:'info',chainNoConsumer:'info'});
// Request 70: advice about a missing link of a production chain (a Bakery without a Mill, wheat without a Mill). The
// links come from the recipes and crops (productionChains.js); `resources` picks the chains that get this advice.
export const CHAIN_ADVICE=Object.freeze({repeatDays:3,resources:FOOD_RESOURCE_IDS});
export const noticeSeverity=reason=>NOTICE_SEVERITY[reason]??'warning';
export const noticeRepeatDays=reason=>reason==='missingChainSource'||reason==='chainNoConsumer'?CHAIN_ADVICE.repeatDays:NOTICE_REPEAT_DAYS[noticeSeverity(reason)];

// Gathering workplaces: what they bring in, and what a depleted one should be rebuilt near (notice advice).
export const GATHER_OUTPUTS=Object.freeze({quarry:'stone',iron_mine:'iron_ore',lumberjack_hut:'wood',hunting_lodge:'meat',fisherman_hut:'fish'});
export const DEPLETION_SOURCES=Object.freeze({quarry:'stone_deposit',iron_mine:'iron_deposit',lumberjack_hut:'trees'});
// Work messages of a resident who holds goods (or would mine/chop) but finds no storage room for them.
export const STORAGE_WAIT_MESSAGES=Object.freeze(['Waiting for reachable storage capacity','Waiting for reachable timber storage capacity','rock.noStorage','Mined material preserved on the ground','Timber preserved on the ground','Output pile full']);
