// #120: a docked panel (the unit detail) leaves the map usable; only other open dialogs block map input.
export const DOCKED_PANEL='docked-panel';
export const blockingDialog=(doc=globalThis.document)=>doc?.querySelector?.(`dialog[open]:not(.${DOCKED_PANEL})`)??null;
