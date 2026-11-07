// Production and work diagnostics: how often to look, how long a problem must last before it is reported, and
// how often the same lasting problem may be repeated (all in game time).
export const DIAGNOSTICS=Object.freeze({checkInterval:2000,persistence:10000,reminder:30000,
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

// Structural advice on completion, independent of current input stock or staffing.
export const COMPLETION_SOURCES=Object.freeze({mill:'wheat_field',bakery:'mill'});

// Gathering workplaces: what they bring in, and what a depleted one should be rebuilt near (notice advice).
export const GATHER_OUTPUTS=Object.freeze({quarry:'stone',iron_mine:'iron_ore',lumberjack_hut:'wood',hunting_lodge:'meat',fisherman_hut:'fish'});
export const DEPLETION_SOURCES=Object.freeze({quarry:'stone_deposit',iron_mine:'iron_deposit',lumberjack_hut:'trees'});
// Work messages of a resident who holds goods (or would mine/chop) but finds no storage room for them.
export const STORAGE_WAIT_MESSAGES=Object.freeze(['Waiting for reachable storage capacity','Waiting for reachable timber storage capacity','rock.noStorage','Mined material preserved on the ground','Timber preserved on the ground']);
