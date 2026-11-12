export const ROCK_MINING=Object.freeze({yield:10,duration:15000,retryMs:1000});
// m-oznacovani-tezby (51, 56): marked bushes and saplings are cut without yield; wall, tower and gate plans may stand over
// rocks, trees and bushes, which they mark for removal. loanRetryMs: pause before another employed Miner is lent out.
export const CLEARING=Object.freeze({bushMs:3000,saplingMs:5000,types:Object.freeze(['wall','tower','wall_gate','gate']),loanRetryMs:10000});
export const clearsObstacles=definition=>CLEARING.types.includes(definition?.id);
