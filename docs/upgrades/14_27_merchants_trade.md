# ETAPA 14/15 – původní krok 27: Merchants, Caravans & Trade

**Milník:** M4. **Důležitá úprava:** Obchodní karavany mají vlastní cizí koně/povozy, nepřebírají zvířata hráčových stájí.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade 7: Merchants, Caravans & Dynamic Trade

Rozšiř stávající izometrickou 2.5D středověkou strategii o obchodní karavany, tržiště, nákup a prodej surovin, dynamické ceny a fyzickou přepravu obchodovaného zboží.

Hlavní cíl: Vytvoř funkční obchodní ekonomiku, ve které zahraniční obchodníci pravidelně přijíždějí do království, nabízejí vlastní zboží, vykupují suroviny a po určité době odjíždějí. Veškeré zboží musí respektovat existující logistiku, sklady a fyzickou přepravu.

Nezakládej nový projekt.

Nejdříve prozkoumej aktuální implementaci a navazuj na existující systémy. Pokud některý systém z předchozího návrhu ještě není implementován, přizpůsob rozsah skutečnému kódu a nepřidávej nefunkční závislosti.

Zachovej zejména:

Isometric World 100×100

Existing NPC Travelers and Merchants

LogisticsTaskManager

Hauler AI

Warehouse and Granary

Physical Resources

Kingdom Inventory and Gold

Construction and Blueprint System

Kingdom Attractiveness

Worker Jobs and Skills

Game Time

Pathfinding and Path Wear

Fog of War

Asset Library

Save/Load

1. Nová budova – Marketplace

Přidej budovu:

ID: marketplace

Name: Marketplace

Size: 3×3 tiles

Cost: 12 Stone + 8 Wood

Temporary Cargo Capacity: 80 units

Loading Points: 2

Allowed Haulers: 2

Budova se staví standardním blueprint systémem.

Tržiště začne fungovat pouze po dokončení stavby.

Jeho funkce:

Přijímání obchodních karavan.

Nákup a prodej surovin.

Dočasné skladování obchodovaného zboží.

Organizace nakládky a vykládky.

Zobrazení aktuálních cen a nabídek.

Správa obchodních objednávek.

Tržiště nemusí mít vlastní novou profesi. Zpočátku ho mohou obsluhovat existující Haulers.

Pokud je postaveno více tržišť, každé má vlastní nakládací prostor a skladovou kapacitu.

Karavana si vybere jedno dostupné tržiště jako cíl své návštěvy.

2. Obchodní karavany

Implementuj nezávislé obchodní karavany.

Každá karavana obsahuje:

Merchant NPC

Horse-drawn Cart (vlastní obchodníkův povoz a kůň, nikoli majetek hráčova Wheelwright/Stables; využij stejnou cestovní/kolizní infrastrukturu)

Jedinečné ID

Vlastní zásoby zboží

Vlastní množství zlata

Aktuální trasu

Cílové tržiště

Stav návštěvy

Čas zbývající do odjezdu

Karavana se musí fyzicky objevit na vhodném okraji mapy.

Poté:

Vybere dostupné dokončené tržiště.

Vypočítá průchozí cestu.

Přijíždí po mapě.

Zastaví u tržiště.

Otevře možnost obchodování.

Setrvá na tržišti po omezenou dobu.

Po skončení obchodu odjede k okraji mapy.

Po opuštění mapy se bezpečně odstraní.

Karavana nesmí teleportovat přes mapu.

Při pohybu používej existující Pathfinding a Path Wear System.

Povozy musí respektovat překážky a nesmí procházet budovami ani stromy.

Pokud nelze najít cestu, vyber jiný dostupný vstup nebo tržiště. Zabraň nekonečným pokusům o pathfinding.

3. Frekvence příjezdu

Výchozí nastavení:

Nová karavana každé 2–4 herní dny.

Doba pobytu na tržišti: 90 sekund při výchozí délce dne 120 sekund; při jiné délce dne zachovej ekvivalent 0,75 herního dne.

Maximálně 1 aktivní obchodní karavana najednou.

Další karavanu plánuj až podle herního času.

Existující náhodní pocestní a obchodníci, kteří procházejí mapou, musí fungovat dál.

Nevytvářej duplicitní migraci.

Obyčejný Merchant Traveler nemusí být automaticky obchodní karavanou.

Karavany se nikdy neusazují jako trvalí obyvatelé.

Pokud není postavené tržiště, karavany zatím nemusí přijíždět. Existující pocestní se ale objevují dál.

4. Vlastní zásoby obchodníků

Každá karavana přiváží omezené množství surovin.

Podporované obchodní komodity:

Stone

Wood

Iron Ore

Wheat

Apple

Meat

Flour

Bread

Základní příklad náhodného inventáře karavany:

20–50 Wood

10–30 Stone

10–25 Iron Ore

10–40 Wheat

5–25 Bread

10–30 Apple

Nemusí převážet všechny suroviny současně.

Některé karavany mohou být specializované:

Food Merchant

Building Materials Merchant

Ore Merchant

General Merchant

Každá karavana má také omezenou zásobu zlata, například 100–300 Gold.

Pokud obchodník nemá dostatek zlata, nemůže vykupovat další zboží.

Pokud nemá dostatečné zásoby konkrétní suroviny, nemůže ji dále prodávat.

Karavana nesmí vytvářet neomezené množství zlata ani surovin.

5. Dynamické ceny

Implementuj centrální TradePricingSystem.

Výchozí referenční ceny za jednotku:

Wheat: 2 Gold

Apple: 3 Gold

Stone: 3 Gold

Wood: 4 Gold

Meat: 5 Gold

Flour: 5 Gold

Bread: 7 Gold

Iron Ore: 9 Gold

Ceny musí být definované centrálně, nikoliv natvrdo na více místech.

Aktuální cena bude záviset na:

Základní ceně komodity.

Dostupnosti komodity v království.

Zásobách obchodní karavany.

Nabídce a poptávce.

Bezpečnosti obchodních cest.

Počítej samostatně:

Buy Price: kolik zlata zaplatí hráč za jednu jednotku.

Sell Price: kolik zlata obdrží hráč za jednu jednotku.

Obchodní marže musí zajistit, že nákupní cena pro hráče je vždy vyšší než jeho prodejní cena.

Počáteční návrh:

Hráč nakupuje za 115 % referenční tržní ceny.

Hráč prodává za 80 % referenční tržní ceny.

Ceny zaokrouhluj na celé jednotky zlata.

Zajisti:

Minimální cenu 1 Gold.

Maximální rozumný cenový multiplikátor.

Ochranu před obchodní arbitráží, kdy by hráč mohl opakovaným nákupem a prodejem okamžitě vytvářet zisk bez reálné změny ekonomických podmínek.

6. Nabídka a poptávka

Cena komodity se mění podle dostupnosti.

Pokud má království málo určité suroviny, cena při nákupu může růst.

Pokud má velký přebytek, cena může klesat.

Zohledni také zásoby samotné karavany.

Příklad:

Království má nadbytek obilí.

Obchodník má také hodně obilí.

Výkupní cena obilí je nízká.

Jiný příklad:

Království má velmi málo železné rudy.

Obchodník jí přivezl jen malé množství.

Nákupní cena je vysoká.

Použij jednoduchý, předvídatelný a konfigurovatelný cenový model.

Doporučené omezení základního koeficientu poptávky: 0.75–1.35.

Ceny aktualizuj při změně relevantních zásob nebo při příjezdu karavany, nikoliv každým vykresleným snímkem.

Zobraz hráči důvod zvýšené nebo snížené ceny.

7. Bezpečnost obchodních cest

Připrav systém Route Safety v rozsahu 0–100.

Bezpečnost může ovlivňovat:

Přítomnost vlastních hlídek.

Blízkost obranných věží.

Existující nebezpečné oblasti.

Zaznamenané útoky banditů.

Přítomnost nepřátel, pokud jsou již implementováni.

Bezpečnější obchodní cesta může poskytovat výhodnější ceny.

Nebezpečnější cesta znamená vyšší obchodní přirážku.

Pro první verzi použij omezený cenový vliv bezpečnosti, například maximálně ±15 %.

Pokud neexistuje systém banditů nebo skutečných nebezpečných oblastí, použij neutrální výchozí bezpečnost a bonusy z již funkčních obranných prvků.

Nevytvářej falešné útoky nebo náhodné ztráty nákladu, které nelze sledovat ve skutečné herní simulaci.

Později bude možné přidat loupežná přepadení karavan.

8. Obchodní rozhraní

Po kliknutí na karavanu stojící u tržiště otevři Trade Window.

Zobraz:

Jméno nebo typ obchodníka.

Aktuální množství zlata obchodníka.

Čas do odjezdu.

Bezpečnost obchodní cesty.

Seznam dostupných surovin.

Zásoby karavany.

Dostupné zásoby království.

Buy Price.

Sell Price.

U každé suroviny přidej:

Buy

Sell

Výběr množství

Buy Max / Sell Max

Před potvrzením zobraz:

Množství surovin.

Celkovou cenu.

Dostupné zlato.

Stav skladových zásob.

Potřebnou přepravu.

Zobraz také aktivní objednávky a jejich stav.

Přidej přehledné chybové zprávy:

Not enough gold

Not enough available resources

Merchant out of stock

Merchant has insufficient gold

Insufficient storage capacity

Caravan is leaving

9. Fyzická přeprava prodávaného zboží

Suroviny se nesmí teleportovat ze skladu do karavany.

Příklad prodeje:

Hráč chce prodat 30 Stone.

Systém ověří dostupné zásoby a peníze obchodníka.

Zarezervuje 30 Stone pro obchod.

Vytvoří Logistics Tasks.

Nosiči vyzvednou kameny z Warehouse.

Fyzicky je přenesou na Marketplace.

Zboží se naloží do karavany.

Teprve při skutečném předání zboží hráč dostane zlato.

Obchodníkovi se zvýší zásoby Stone a sníží zásoba Gold.

Obchod je možné rozdělit na více fyzických dodávek.

Každou dodávku zpracuj právě jednou.

Pokud karavana odjede před dokončením objednávky, neprovedená část obchodu se zruší a neprodané suroviny zůstanou hráči.

Suroviny již převezené na Marketplace se vrátí do dostupného skladu prostřednictvím Logistics Systemu.

Žádná surovina nesmí zmizet při zrušení objednávky.

10. Fyzická přeprava nakoupeného zboží

Příklad nákupu:

Hráč chce koupit 20 Iron Ore.

Ověř dostatek Gold.

Rezervuj požadované množství zlata.

Rezervuj skutečné zásoby karavany.

Karavana vyloží zboží na Marketplace.

Při předání proběhne platba a převod vlastnictví.

Vznikne Logistics Task.

Nosič odnese Iron Ore do Warehouse.

Teprve po doručení se zboží objeví jako uložené v daném skladu.

Dokud není náklad doručen do Warehouse, musí být evidován jako zboží na Marketplace nebo jako nesený náklad.

Objednávku neumožni dokončit, pokud není dostupné bezpečné místo pro vyložení zboží.

Peníze i suroviny převeď pouze jednou.

11. Rezervace a transakční integrita

Použij existující systém rezervací surovin a přepravních úkolů.

Každá obchodní objednávka má:

Unique Trade Order ID

Merchant ID

Marketplace ID

Resource Type

Quantity

Agreed Unit Price

Reserved Resources or Gold

Delivered Quantity

Completed Quantity

Order Status

Stavy:

Pending

Transporting

Partially Completed

Completed

Cancelled

Failed

Při potvrzení objednávky zafixuj dohodnutou cenu.

Pozdější změny tržních cen nesmí zpětně měnit již potvrzené obchody.

Všechny transakce musí být bezpečné proti opakovanému provedení.

Zabraň:

Duplicitnímu vyplacení zlata.

Duplicitnímu odečtení surovin.

Ztrátě zboží při odjezdu obchodníka.

Duplicitním rezervacím.

Obchodování s nákladem, který již vlastní jiný úkol.

Záporným zásobám nebo zápornému zlatu.

12. Automatický obchod

Přidej do Marketplace volitelný Auto Trade System.

Výchozí nastavení: OFF.

Hráč může pro každou komoditu nastavit:

Auto Sell

Prodat množství nad nastavenou rezervu.

Minimální přijatelná prodejní cena.

Příklad:

Udržuj minimálně 100 Stone.

Přebytečné Stone prodávej, pokud cena dosahuje alespoň 3 Gold.

Auto Buy

Nakup, pokud zásoba klesne pod určenou hodnotu.

Maximální nákupní cena.

Maximální celkový rozpočet.

Příklad:

Pokud Wood klesne pod 30, nakup do zásoby 80.

Maximální nákupní cena 6 Gold za jednotku.

Automatické obchodní příkazy se vyhodnocují pouze při dostupné karavaně.

Respektuj:

Skutečné skladové zásoby.

Rezervované materiály na stavby.

Rezervy potravin.

Dostupné zlato.

Kapacitu Marketplace.

Kapacitu karavany.

Dostatek času do odjezdu.

Nevytvářej nekonečné nákupní a prodejní cykly.

Pro jednu komoditu nedovol současně konfliktní automatický nákup a prodej.

13. Obchod a potřeby obyvatel

Integruj Trade System s existujícím Food Economy a Villager Needs.

Auto Sell nesmí prodávat potraviny pod minimální rezervu určenou hráčem.

Zobraz upozornění, pokud by prodej potravin ohrozil zásobování království.

Obchod může být důležitý například během zimy:

Vlastní pole neprodukují obilí.

Království spotřebovává skladované jídlo.

Přijede obchodník s chlebem.

Hráč může potraviny nakoupit.

Nakoupené potraviny musí být fyzicky uložené ve skladu, než je lze spotřebovat.

Nevytvářej druhý Food Consumption System.

14. Obchodní statistiky

Přidej panel Trade Statistics.

Zobraz:

Celkovou hodnotu prodaného zboží.

Celkovou hodnotu nakoupeného zboží.

Obchodní bilanci.

Počet uskutečněných obchodů.

Nejobchodovanější komodity.

Poslední obchodní transakce.

Historii cen jednotlivých surovin.

Historii cen ukládej v omezeném rozsahu, například za posledních 20 herních dnů.

Přidej jednoduchý graf cen vybrané komodity.

Cenové statistiky musí vycházet ze skutečně dokončených obchodů nebo zaznamenaných tržních nabídek, ne z vymyšlených hodnot.

15. Grafika a animace

Zachovej stávající izometrický 2.5D grafický styl.

Vytvoř:

Marketplace s obchodními stánky.

Merchant NPC.

Obchodní povoz.

Naložený a prázdný povoz.

Jednoduchou animaci zastavení karavany.

Jednoduché vizuální znázornění nakládky a vykládky.

Povoz musí viditelně cestovat po mapě.

Nemusíš vytvářet detailní fyzikální simulaci kol.

Pokud nejsou dostupné finální assety, vytvoř kvalitní dočasnou grafiku připravenou k výměně v Asset Library.

16. Interakce s existujícími NPC

Zachovej současný systém náhodných pocestných.

Obchodní karavany budou samostatným typem události a NPC.

Merchant Traveler může:

Projít mapou jako dosud.

Později fungovat jako obchodník na cestách.

V první verzi nemusí obyčejný Merchant Traveler prodávat zboží bez tržiště.

Zachovej pravidlo, že obchodníci se trvale neusazují.

17. Save / Load

Ukládej:

Marketplace a jeho stav.

Aktivní obchodní karavany.

Pozice povozů.

Zásoby a zlato jednotlivých obchodníků.

Čas příštího příjezdu.

Čas do odjezdu aktuální karavany.

Aktuální ceny.

Historii cen.

Všechny obchodní objednávky.

Rezervované zlato a suroviny.

Rozpracované přepravy.

Automatická obchodní pravidla.

Obchodní statistiky.

Po načtení musí obchod pokračovat bez duplicit.

Pokud byla objednávka částečně dokončena, obnov pouze její zbývající část.

Nepřidávej při načtení nové zásoby karavaně.

Nesnižuj hráčovo zlato opakovaně.

Starší uložené hry bez Trade Systemu musí zůstat načitatelné.

18. Optimalizace

Systém musí fungovat stabilně na mapě 100×100.

Nepočítej ceny a nové cesty každý snímek.

Používej:

Centrální Game Time.

Event-driven Trade Orders.

Existující LogisticsTaskManager.

Omezenou frekvenci plánování karavan.

Efektivní pathfinding.

Jednoznačná ID transakcí.

Oddělení obchodní simulace od vykreslování.

Simulace obchodních objednávek musí fungovat i mimo viditelnou část mapy.

Fog of War nesmí zastavit fungování obchodního systému.

19. Testování

Před implementací vytvoř Git commit funkční verze.

Ověř:

Marketplace lze postavit.

Nedokončené tržiště není funkční.

Karavana přijede z okraje mapy.

Karavana fyzicky dojde na tržiště.

Obchodník má vlastní zlato a zásoby.

Hráč může nakupovat suroviny.

Hráč může prodávat suroviny.

Nosiči skutečně přepravují prodávané zboží.

Nakoupené zboží je fyzicky dopravováno do skladů.

Transakce nemůže proběhnout dvakrát.

Nelze prodat rezervované stavební materiály.

Nelze nakoupit za nedostupné zlato.

Nelze prodat více surovin, než obchodník dokáže zaplatit.

Ceny reagují na nabídku a poptávku.

Rozdíl mezi nákupní a prodejní cenou brání jednoduchému zneužití obchodování.

Auto Trade respektuje minimální zásoby.

Karavana po návštěvě odjede.

Při předčasném odjezdu nedojde ke ztrátě surovin.

Save/Load zachovává rozpracované obchodní objednávky.

Dosavadní systémy ekonomiky, obyvatel a výstavby fungují beze změn.

20. Implementační fáze

Rozděl upgrade na čtyři fáze.

Fáze A – Marketplace & Caravans
Budova tržiště, fyzický příjezd karavan a inventář obchodníků.

Fáze B – Manual Trading
Nákup, prodej, potvrzování objednávek, fyzická doprava a bezpečné transakce.

Fáze C – Dynamic Economy
Dynamické ceny, nabídka a poptávka, Route Safety a automatický obchod.

Fáze D – Integration
Statistiky, grafika, Save/Load, optimalizace a automatizované testy.

Po každé dokončené fázi vytvoř Git commit a ověř funkční build.

Zatím NEIMPLEMENTUJ:

Bandits / Caravan Attacks, pokud ještě neexistuje funkční bojový systém banditů.

Mezinárodní diplomacii.

Obchodní smlouvy s jinými královstvími.

Obchodní flotily.

Daně nebo clo.

Vlastní obchodní karavany hráče.

Prioritou je stabilní obchodní systém propojený s fyzickou logistikou a existující ekonomikou hry.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

