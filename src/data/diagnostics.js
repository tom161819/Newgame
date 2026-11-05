// Production and work diagnostics: how often to look, how long a problem must last before it is reported, and
// how often the same lasting problem may be repeated (all in game time).
export const DIAGNOSTICS=Object.freeze({checkInterval:2000,persistence:10000,reminder:30000});
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
