// #60 (S15 / 29B): Run in Background. Browsers stop drawing hidden tabs, so the game does not pretend to run there;
// when the tab comes back, the missed time is simulated with the same authoritative step as normal frames.
// maxAbsenceMs: at most this much real time is caught up per absence (the rest is reported, never faked).
// stepMs: one simulation step (normal frames may be this long too). frameBudgetMs: work per drawn frame during the
// catch-up, so the page stays responsive. fogEverySteps: how often sight and the map memory are refreshed.
export const BACKGROUND_SIMULATION=Object.freeze({maxAbsenceMs:15*60*1000,stepMs:100,frameBudgetMs:25,fogEverySteps:5,minReportMs:1000,maxEvents:6});
