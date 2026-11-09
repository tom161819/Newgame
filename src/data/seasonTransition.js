// m-plynule-prechody (owner point 78): the gradual change of the seasonal look, as data. The window runs `days` game days
// around the season boundary (`lead` of it before the boundary, the rest after), the picture moves in `steps` stepped
// blend levels (a chunk is repainted at most once per step), and the change comes in patches by a noise mask: `spread`
// is the share of the window over which places start (the rest is how long one place takes). `bias` is how much the
// terrain (shade, water) moves a place's start: snow first in shade and on stony ground, away from water; the thaw
// first by water and on open sunny meadows; autumn yellowing in islands (`islands` sharpens its noise). `noiseSd` is
// the spread of the raw noise, used to even out the starts (so every step changes about as much of the map).
// `layerChunks`: how many chunks keep their two season layers (old, new) for re-blending; others repaint them when needed.
// `days` and `steps` are also Dev tool values (Dev tool → World look), read through devFactor.
export const SEASON_TRANSITION=Object.freeze({days:3,lead:.5,steps:9,levels:12,spread:.7,seed:1,chunksPerFrame:10,layerChunks:36,bias:.4,islands:1.6,noiseSd:.17,
  // Shade per grass zone (0 meadow, 1 lush, 2 dry, 3 forest floor, 4 flowery, 5 stony) and other land (6 beach … 9 shore rocks).
  shade:Object.freeze([0,.3,0,1,0,.7,0,0,.2,.6]),waterReach:5,
  dev:Object.freeze({days:Object.freeze({min:1,max:5,step:.5}),steps:Object.freeze({min:4,max:16,step:1})})});
