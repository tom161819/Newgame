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
  // A cat clears 25 rats a day in its building; one cat covers up to 120 food of capacity, a bigger store needs two.
  catch:25,capacityPerCat:120,homeHappiness:3,speed:1.1,wanderRadius:3,
  stray:Object.freeze({intervalDays:4,ratIntervalDays:2,stayDays:2,distance:Object.freeze([15,25]),leaveSpeed:1.3}),
  price:30,merchants:Object.freeze({food:[0,2],general:[0,1]}),merchantChance:.5,
  kitten:Object.freeze({everyDays:10,chance:.5,houseDistance:8}),
  names:Object.freeze(['Micka','Mourek','Líza','Bára','Tygr','Čiči','Pacinka','Kocour Jan','Šmudla','Mňau','Zrzek','Bělka','Rozárka','Sazka','Fousek','Pepř']),
});
export const ratLevel=population=>{let level='none';for(const [id,from]of RATS.levels)if(population>=from&&(id==='none'?population<=0:true))level=id;return population<=0?'none':level;};
