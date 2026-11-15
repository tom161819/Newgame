import { FOOD_RESOURCE_IDS } from './foodProduction.js';

// Production and work diagnostics: how often to look and how long a problem must last before it is reported (game
// time). How often the same problem may come again is NOTICE_REPEAT below (in game days).
export const DIAGNOSTICS=Object.freeze({checkInterval:2000,persistence:10000,
  // Plan m-e1-stavitele-material: a site whose materials are in the stores but have not arrived for this long gets a
  // notice, and its Builders start carrying them themselves even while a Hauler is free (a quarter of a game day).
  materialWait:30000,
  // Owner 15 Nov 2026 (64): the "nobody brings material" notice only after a whole game day of waiting (materialWait
  // still lets a Builder carry for himself after 30 s).
  materialNoticeDays:1,
  // m-zelezny-dul-misto: how long (game days) the notice of a blueprint cancelled for an obstacle stays in Notices.
  cancelledDays:2});
export const NOTICE_CATEGORIES=Object.freeze(['construction','production']);
// Where a production input comes from: the building that makes it, a field it needs, and the profession that works it.
export const INPUT_SOURCES=Object.freeze({
  wheat:Object.freeze({building:'farmhouse',field:'wheat_field',profession:'farmer'}),
  flour:Object.freeze({building:'mill',profession:'miller'}),
  iron_ore:Object.freeze({building:'iron_mine',profession:'miner'}),
  wood:Object.freeze({building:'lumberjack_hut',profession:'woodcutter'}),
});

// m-hlasky-jednou (owner point 79, replaces the 0.68 intervals of request 72): the same notice (same reason + same
// building or resource) is in Notices only once. While it is open, a repeat only updates it quietly (count, time).
// Once the player closes it, it comes back at the earliest this many game days after the close – also when the
// problem goes away and comes back. A notice that went away on its own and comes back within the same time returns
// quietly to its one row. Danger (attack, fire, disease, a death) is never held back (0). A reason not listed is a
// warning.
export const NOTICE_REPEAT_DAYS=Object.freeze({info:4,warning:4,danger:0});
export const NOTICE_SEVERITY=Object.freeze({depleted:'info',noWater:'info',noInput:'info',noProducer:'info',noField:'info',missingChainSource:'info',chainNoConsumer:'info'});
// Request 70: advice about a missing link of a production chain (a Bakery without a Mill, wheat without a Mill). The
// links come from the recipes and crops (productionChains.js); `resources` picks the chains that get this advice. It
// follows the same once-only rule as every notice (point 79; it had its own 3 days before).
export const CHAIN_ADVICE=Object.freeze({resources:FOOD_RESOURCE_IDS});
export const noticeSeverity=reason=>NOTICE_SEVERITY[reason]??'warning';
export const noticeRepeatDays=(reason,severity=noticeSeverity(reason))=>NOTICE_REPEAT_DAYS[severity]??NOTICE_REPEAT_DAYS.warning;
export const NOTICE_REPEAT_MAX_DAYS=Math.max(...Object.values(NOTICE_REPEAT_DAYS));

// Save limits of the close times (save field `notices`, schema 60, optional; checked by GameStateSerializer).
export const NOTICE_CLOSED_LIMIT=500;
const NOTICE_KEY=/^[A-Za-z0-9_:.-]{1,200}$/;
export function validNoticeState(state,totalElapsed){
  if(!state||typeof state!=='object'||Array.isArray(state)||Object.keys(state).join()!=='closed'||!Array.isArray(state.closed)||state.closed.length>NOTICE_CLOSED_LIMIT)return false;
  const keys=new Set();
  for(const entry of state.closed){
    if(!Array.isArray(entry)||entry.length!==2)return false;const [key,at]=entry;
    if(typeof key!=='string'||!NOTICE_KEY.test(key)||keys.has(key)||!Number.isFinite(at)||at<0||at>totalElapsed)return false;keys.add(key);
  }
  return true;
}

// Gathering workplaces: what they bring in, and what a depleted one should be rebuilt near (notice advice).
export const GATHER_OUTPUTS=Object.freeze({quarry:'stone',iron_mine:'iron_ore',lumberjack_hut:'wood',hunting_lodge:'meat',fisherman_hut:'fish'});
export const DEPLETION_SOURCES=Object.freeze({quarry:'stone_deposit',iron_mine:'iron_deposit',lumberjack_hut:'trees'});
// Work messages of a resident who holds goods (or would mine/chop) but finds no storage room for them.
export const STORAGE_WAIT_MESSAGES=Object.freeze(['Waiting for reachable storage capacity','Waiting for reachable timber storage capacity','rock.noStorage','Mined material preserved on the ground','Timber preserved on the ground','Output pile full']);
