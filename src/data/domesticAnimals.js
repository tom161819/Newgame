// Domestic animals Z1 (brief zadani-domaci-zvirata.md, approved by the owner on 7 Nov 2026): rats in buildings with
// food stocks and the cats that keep them down. Rates are per game day.
// Rats grow by `base + growth × fill` (fill = food stored / capacity): a full new Granary without a cat reaches
// Many (34) in about 5 days and an Infestation (67) in about 10. Without food they slowly leave.
export const RATS=Object.freeze({max:100,base:1.5,growth:5.3,emptyDecay:6,
  levels:Object.freeze([['none',0],['few',1],['many',34],['infestation',67]]),
  loss:Object.freeze({none:0,few:.01,many:.03,infestation:.06}),
  // Rats eat grain first, then the rest.
  lossOrder:Object.freeze(['wheat','flour','apple','bread','meat','fish']),
  views:Object.freeze({none:0,few:1,many:3,infestation:5}),ledgerSource:'Rats'});
export const CATS=Object.freeze({
  // A cat clears 25 rats a day in its building; one cat covers up to 600 food of capacity, a bigger store needs more.
  // (600 since 0.51: the Granary grew from 200 + 200 to 1000 + 1000, so it still needs the same number of cats.)
  catch:25,capacityPerCat:600,homeHappiness:3,speed:1.1,wanderRadius:3,
  stray:Object.freeze({intervalDays:4,ratIntervalDays:2,stayDays:2,distance:Object.freeze([15,25]),leaveSpeed:1.3}),
  price:30,merchants:Object.freeze({food:[0,2],general:[0,1]}),merchantChance:.5,
  kitten:Object.freeze({everyDays:10,chance:.5,houseDistance:8}),
  names:Object.freeze(['Micka','Mourek','Líza','Bára','Tygr','Čiči','Pacinka','Kocour Jan','Šmudla','Mňau','Zrzek','Bělka','Rozárka','Sazka','Fousek','Pepř']),
});
export const ratLevel=population=>{let level='none';for(const [id,from]of RATS.levels)if(population>=from&&(id==='none'?population<=0:true))level=id;return population<=0?'none':level;};
// Domestic animals Z2: the hunting dog. One dog per Hunter; it never eats from the stores and never dies.
// tame: 20 % + 8 % per hunting level, at most 90 %, one try per stray. Hunting with the dog: the Hunter moves 30 %
// faster and deals 50 % more damage while the dog is close (about +30 % meat a day, see the change record); game within 8 tiles of the dog can be chosen as a target
// (and shows as a faint outline under Fog of War). A dog at 0 HP is injured: it goes home and heals in a day.
export const DOGS=Object.freeze({
  maxHP:60,healDays:1,speed:2.2,followDistance:1.4,
  // Around its Hunter the dog roams irregularly within a small circle; at the hunting lodge it sits and now and then
  // runs a quick round before sitting down again.
  roam:{radius:2.2,retarget:[.8,3],catchUp:3.4,pause:[0,1.2]},atLodge:{radius:2.5,sit:[6,14],runRadius:2.6,runSpeed:1.7,rounds:[2,4]},closeEnough:3,trackRadius:8,huntSpeed:1.3,huntDamage:1.5,
  tame:Object.freeze({base:.2,perLevel:.08,max:.9,xp:20,meetDistance:1.5}),
  stray:Object.freeze({intervalDays:6,stayDays:Object.freeze([2,3]),distance:Object.freeze([5,10])}),
  caravanChance:1/3,price:120,
  names:Object.freeze(['Alík','Rek','Bety','Ferda','Hektor','Žeryk','Brok','Lesan','Dina','Sultán','Bodlák','Vlasta']),
});
export const tameChance=level=>Math.min(DOGS.tame.max,DOGS.tame.base+DOGS.tame.perLevel*Math.max(1,level??1));
