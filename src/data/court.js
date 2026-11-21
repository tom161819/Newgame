// m-pribeh-vlci-ujezd, phase F1 (owner 21 Nov 2026): the royal court. The player holds his land from King Sigismund and
// is not trusted ("Wenceslas's man"). The court sends orders with a deadline, a reward and a penalty; the King's trust
// (0–100) follows how they are met. Deep displeasure ends in a punitive expedition: a large army attacks the Castle.
// Days are game days (a season has 5).
export const COURT=Object.freeze({
  startTrust:40,
  // Bands by the lowest trust: favour ≥ 70, calm ≥ 40, suspicion ≥ 25, displeasure ≥ 10, below: the expedition.
  bands:Object.freeze({favour:70,calm:40,suspicion:25,displeasure:10}),
  firstOrderDay:3,orderEveryDays:4,maxActive:2,
  deadlineDays:Object.freeze({tax:5,delivery:6,request:6}),
  deadlineFactor:Object.freeze({favour:1.4,calm:1,suspicion:.7,displeasure:.7}),
  graceShare:.5,                 // late but within this share of the deadline: a small loss only
  met:Object.freeze({tax:6,delivery:5,request:3}),
  late:-3,
  failed:Object.freeze({tax:-10,delivery:-8,request:0}),
  fineShare:.5,                  // of a failed order's gold value, added to the next levy
  goldValue:Object.freeze({wood:.5,stone:1,meat:1,fish:1,wheat:.6,bread:1.5,apple:.8,flour:1,iron:3}),
  // What a delivery may ask for, by Castle level (the first that the kingdom can make is preferred).
  delivery:Object.freeze({1:Object.freeze(['wood','meat','fish']),2:Object.freeze(['wheat','bread','apple','wood','stone']),3:Object.freeze(['bread','wheat','stone','iron','apple']),4:Object.freeze(['bread','iron','stone','wheat'])}),
  makers:Object.freeze({wood:'lumberjack_hut',stone:'quarry',meat:'hunting_lodge',fish:'fisherman_hut',wheat:'farmhouse',bread:'bakery',apple:'orchard',iron:'smelter'}),
  requestGold:8,                 // reward of an optional request, × Castle level
  giftEveryDays:5,giftGold:12,   // favour: a gift from the King, × Castle level
  confiscateShare:.2,            // suspicion: of the stock of a failed delivery's resource
  countdownDays:10,              // displeasure: days until the expedition unless trust recovers
  collectShare:.25,              // displeasure: collectors take this share of gold and food once
  atonementGold:60,              // × Castle level: stops the countdown, trust 25
  atonementTrust:25,
  expedition:Object.freeze({
    units:Object.freeze({1:Object.freeze({enemy_soldier:6,enemy_archer:3}),2:Object.freeze({enemy_soldier:10,enemy_archer:5,enemy_swordsman:3}),
      3:Object.freeze({enemy_soldier:14,enemy_archer:8,enemy_swordsman:6,enemy_knight:3}),4:Object.freeze({enemy_soldier:18,enemy_archer:10,enemy_swordsman:10,enemy_knight:6})}),
    perOurSoldier:.5,            // extra enemy soldiers for each of ours: always more than a common raid
    growth:1.5,                  // each further expedition is this much larger
    trustAfter:20,cooldownDays:20,plunderShare:.5,
  }),
});
export const COURT_BANDS=Object.freeze(['favour','calm','suspicion','displeasure','wrath']);
export function courtBand(trust){const b=COURT.bands;return trust>=b.favour?'favour':trust>=b.calm?'calm':trust>=b.suspicion?'suspicion':trust>=b.displeasure?'displeasure':'wrath';}
// The player's title by Castle level (he is no king: a younger son of a lord).
export const LORD_TITLES=Object.freeze({1:'squire',2:'landholder',3:'lord',4:'highLord'});
