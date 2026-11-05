# Medieval Kingdom — Královská hlídka

Izometrická 2.5D strategická hra v JavaScriptu s **Phaser 4.2.1** a **Vite 8.3.5**. Vlastní procedurální středověká grafika: písčitá krajina, kamenné překážky, korunovaný král s červeným pláštěm a strážní věže. Bez backendu; uložené hry používají místní IndexedDB v prohlížeči. Vlastní PNG/WebP grafika a náhledy jsou součástí projektu.

**[Hrát v prohlížeči](https://tom161819.github.io/Newgame/)** — bez instalace a přihlášení.

## Ovládání

| Ovládání | Akce |
|---|---|
| New Game / Load Game | Úvodní menu se zobrazí při každém otevření či obnovení stránky. Nová hra nepřepisuje uložené pozice. |
| Esc mimo stavění a dialogy | Pozastaví hru a otevře Game Menu. Resume Game nebo Esc pokračuje bez časového skoku. |
| Settings → Save Game / Load Game / Main Menu | Správa uložených her nebo návrat do úvodní nabídky. Settings i herní menu pozastaví simulaci. |
| Levý klik na průchozí políčko | Král k němu dojde po nejkratší cestě. Další klik změní cíl. |
| Levý klik na koně | Dojde k pohybujícímu se koni a nasedne. Rychlost vzroste přesně na dvojnásobek. |
| Dismount nebo H | Sesedne na volné sousední místo; stejný kůň se vrátí k putování. |
| ⚙ Settings | Zasouvací panel s přepínačem Fog of War. Volba se pamatuje mezi obnoveními stránky. |
| Settings → Show Path Wear Debug | Barevně označí úrovně pěšin a ukáže skóre políčka pod myší. Funguje i s posunutou kamerou a zoomem. |
| King / LVL / XP v horní liště | Otevře přehled krále: level, XP, HP, DPS a Armor. Samotné otevření přehledu nemění cíl pohybu. |
| Levý klik na poddaného → Assign Job | Otevře jeho skilly a pracovní stav a umožní přiřadit právě jednu profesi. |
| Levý klik na zvíře | Pronásleduje cíl a ze sousedního políčka zahájí souboj. Napadené zvíře se brání. |
| Levý klik na maso | Dojde k balíčku a přidá jeho skutečné množství. Najeď myší pro údaj Meat ×N. |
| Levý klik na truhlu | Dojde k sousednímu políčku a otevře ji. Take All převezme obsah a automaticky vybaví meč a brnění. |
| Weapon / Armor v inventáři | Otevře dvě místa vybavení a přehled základních a konečných statistik. Předměty lze odložit a znovu vybavit. |
| Levý klik na kámen | Dojde ke kameni, naloží jej a odnese do dostupného skladu; zásoby a XP se přičtou po doručení. |
| Levý klik na věž nebo její střechu | Dojde k dostupnému sousednímu políčku a vyleze na plošinu. |
| Klik na mapu z věže | Nejprve sleze, potom dojde k cíli. Kámen sebere až po sestupu. |
| WASD nebo šipky | Ručně posouvají kameru a pozastaví její sledování krále. |
| Mezerník nebo „Na krále“ | Znovu zapne plynulé sledování krále. Nový platný příkaz k pohybu ho také obnoví. |
| Kolečko myši nad mapou | Zoom od 0,45× do 1,8×. |
| Asset Library | Otevře prohlížeč definic objektů s kategoriemi, náhledy a podrobnými údaji. |
| Buildings → Castle | Náhled hradu 3 × 3 políčka za 10 kamenů; vstup a sestup fungují jako u věže. |
| Buildings → Stone Wall | Kliknutím postaví jeden segment, tažením rovnou řadu v dominantní logické ose. Platí se 1 kámen za nový segment. |
| Buildings → Tower | Zapne náhled stavby 2 × 2 políčka za 10 kamenů. |
| Levý klik v režimu stavění | Postaví věž na platném místě. Zelená = lze stavět, červená = neplatné místo nebo málo surovin. |
| Esc, pravý klik nebo Zrušit | Zruší režim stavění bez platby. |

Horní inventář a spodní Buildings jsou mimo herní kameru a při pohybu nebo zoomu mapy zůstávají na obrazovce. Informace o věži lze otevřít i s prázdným inventářem.

## Mapa, kameny a stavby

- Logická mapa má **100 × 100 políček**. Každé se kreslí jako kosočtverec **64 × 32 px**. Král začíná na `(50, 50)`.
- Při načtení vznikne **30 náhodných kamenů** na různých dosažitelných průchozích políčkách mimo start krále.
- Každých **20 sekund herního času** vznikne jeden nový kámen. Na mapě může současně ležet nejvýše **80 nesebraných kamenů**, včetně těch mimo aktuální obraz kamery.
- Generátor vždy znovu ověří dosažitelnost po změnách mapy. Vynechá budovy, překážky, existující kameny a aktuální i právě procházené políčko krále. Pokud není dostupné místo, daný pokus přeskočí. Po uvolnění limitu pokračuje při dalším dvacetisekundovém intervalu.
- Kameny neblokují pohyb. Sbírá se pouze kámen vybraný kliknutím. Nový levý klik zruší původní požadavek i při neplatném cíli; pravý klik mimo stavění ho nemění.
- Král chodí v **osmi logických směrech**. Diagonála je plynulý přímý úsek, nikoli střídání vodorovných a svislých kroků. Rychlost 3,5 políčka/s se vztahuje k logické délce pohybu: diagonální krok délky √2 trvá odpovídajícím způsobem déle než přímý krok délky 1.
- Cestu hledá **A*** s osmi sousedy a heuristikou octile. Diagonála je povolená pouze tehdy, když jsou průchozí cíl i obě sousední boční políčka. Mezi rohy zdí ani věží proto nelze projít.
- Věž stojí přesně **10 kamenů**, obsadí přesně **2 × 2 logická políčka** a vytvoří neprůchozí překážku pro A*. Nesmí překrývat kameny, budovy, překážky ani krále a jeho probíhající krok; u diagonály se chrání také obě boční políčka.
- Lze naplánovat a postupně postavit více věží, hradů i řad hradeb. Výběr stavby zruší zbývající cestu a sběr; už rozběhnutý krok se dokončí plynule. Po umístění jednoho blueprintu režim umisťování skončí.
- Ke vstupu se vybírá sousední políčko s nejkratší dosažitelnou cestou. Následuje animace lezení, ne přesun z dálky. Král nahoře nechodí po mapě ani nesbírá. Sestup vybere sousední políčko s dostupnou cestou k cíli; pokud takové není, král zůstane nahoře.
- Během animace výstupu a sestupu se nové příkazy nepřijímají. Vstup/výstup lze opakovat, včetně přechodu z jedné věže do druhé.
- Po obnovení stránky se zobrazí hlavní menu. New Game vytvoří novou náhodnou mapu, vynuluje inventář i vybavení, nastaví Day 1 a 100 HP. Nastavení zůstává zachované. Load Game obnoví vybranou rozehranou pozici.

## Starší verze hry

**Starší verze** v hlavním menu nebo spodní liště otevřou [archiv verzí](https://tom161819.github.io/Newgame/versions/). Obsahuje všechny předchozí ověřené commity včetně kontrolních bodů, název, datum, popis a odkaz na spuštění. Každá hra se otevírá v nové záložce, aktuální adresa hry zůstává stejná.

Historické verze jsou skutečná sestavení příslušného Git commitu, nikoli přepnuté nastavení současné hry. Jejich soubory a URL se při dalších aktualizacích nepřepisují. Každý commit má oddělené uložené pozice a nastavení, takže starší Save/Load neovlivní aktuální pozice. Podrobnosti sestavení a přidávání verzí jsou v [docs/ARCHIVE.md](docs/ARCHIVE.md).

## Ukládání a načítání

Settings nebo Game Menu → **Save Game** otevře seznam místních pozic. Lze vytvořit nový save s vlastním názvem, přepsat existující nebo jej odstranit; přepsání i smazání vyžadují potvrzení. Počet slotů není omezen na pět. Každá pozice ukazuje datum vytvoření a posledního uložení, den a aktivní dobu hraní. Úložiště je samostatné pro každý prohlížeč a adresu webu; smazání dat webu smaže také místní savy.

Save/Load zachovává logickou mapu, překážky, budovy a spojení hradeb, kameny, množství dropů, zvířata a jejich HP, obsah a vybrání truhly, inventář a vybavení. Obnovuje i probíhající krok, natočení, cíl, souboj, stejný osedlaný kůň, pobyt na plošině či rozpracované lezení, kameru, zoom, Fog of War, herní čas a zbytky časovačů. Načtení znovu negeneruje objekty ani příjem zlata za dokončený den. Doba se zavřenou hrou se nezapočítává.

**ALPHA:** hra načítá pouze savy aktuálního schématu (`SAVE_VERSION`, nezávislé na verzi hry). Save jiného schématu zobrazí v Load Game upozornění „Incompatible save“ a nabídne novou hru; nic se nepřevádí ani automaticky nemaže a odstranění vyžaduje potvrzení. Zmínky o převodu starších savů v dalších sekcích popisují dřívější vývoj a v ALPHA neplatí. Pravidla jsou v [AGENTS.md](AGENTS.md).

Data mají `saveVersion` a před nahrazením světa procházejí kontrolou. Poškozený save zobrazí chybu a ponechá současnou hru. Zápis do IndexedDB je atomický: při chybě zůstane předchozí save. Samotné ukládání a načítání již otevřené hry funguje i bez internetu; stažení hry při prvním otevření vyžaduje připojení.

**Přenos pozic mezi zařízeními:** v menu Save/Load stáhne **Download Save** vybranou pozici jako soubor JSON (formát `medieval-kingdom-save`, schéma, verze hry, datum a celý snapshot). **Import Save File** soubor načte jen pomocí `JSON.parse`, ověří velikost (max. 16 MB), formát, schéma a stejnou validaci jako Load a uloží ho do nového slotu. Pokud na zařízení existuje slot se stejným ID, nabídne **Replace** nebo **Keep both**. Poškozený soubor nebo jiné schéma se odmítne beze změny hry i ostatních slotů. Žádný server ani placená služba se nepoužívá.

**Autosave:** hra se sama ukládá do samostatného slotu **Autosave** (ruční pozice nepřepisuje). Výchozí interval je 5 minut skutečné aktivní hry; v Settings lze autosave vypnout nebo zvolit 1, 2, 5 či 10 minut (nastavení si pamatuje prohlížeč). Pozastavená hra ani skrytá karta se nepočítají, dvě ukládání nikdy neběží současně a neúspěšný zápis ponechá předchozí autosave. Settings ukazuje čas posledního úspěšného autosave; chybu oznámí jednou. Zavření prohlížeče uložení nezaručuje. Autosave se načte z Load Game jako každá jiná pozice.

**Jazyk:** čeština a angličtina se přepínají v hlavním menu nebo v Settings; volbu si pamatuje prohlížeč (výchozí podle jazyka prohlížeče). Všechny texty jdou přes jeden překladový systém `src/i18n/` (`t(klíč, parametry)`, množná čísla přes `Intl.PluralRules`, chybějící klíč spadne na angličtinu a pak na samotný klíč). Další jazyk = další slovník se stejnými klíči; test hlídá, že oba slovníky mají totožné klíče a parametry a že každý použitý klíč existuje.

## Zkušenosti a levely

Král začíná na **levelu 1 s 0 XP**. Odměnu získá až po dokončení činnosti: kámen **3 XP**, sebraný balíček masa **2 XP** bez ohledu na jeho množství, zajíc **10 XP**, srna **20 XP**, divočák **35 XP**, nový segment hradby **2 XP**, věž **15 XP**, hrad **30 XP**, kamenolom **15 XP**, lovecká chata **10 XP** a kasárna **20 XP**. Řada hradeb odmění jen skutečně nové segmenty. Neúspěšná nebo zrušená akce nic nepřidá; chůze, čekání, regenerace ani produkce zlata XP nevytvářejí.

Další úroveň vyžaduje `100 + 35 × (level − 1) + 4 × (level − 1)²` XP. Přebytek se přenáší, takže větší odměna může přidat více levelů. Strop je **level 50**; další postup se zastaví a lišta ukáže MAX. Level sám nemění HP, DPS, Armor ani rychlost. Po odměně se nad postavou objeví XP; zvýšení levelu doprovází zlatý efekt a oznámení.

Zkušenosti patří konkrétní postavě a ukládají se společně se zpracovanými událostmi. Načtení nerozdává staré odměny znovu. Savy vytvořené před tímto rozšířením začnou na levelu 1 a zachovají ostatní herní stav.

## Poddaní, skilly a profese

Nová hra začíná se **třemi poddanými**. Každý další herní den může z dosažitelného okraje mapy přijít jeden nový obyvatel, dokud populace nedosáhne **20**. Příchozí fyzicky dojde do osady. Poddaní mají vlastní jména, HP, celkový level a šest nezávislých skillů: Woodcutting, Mining, Hunting, Construction, Farming a Combat. Nový poddaný má jeden trvalý přirozený talent: příslušný skill začíná na levelu 3–8, jeden další náhodný skill na 1–4 a ostatní na 1. Celkový level začíná nezávisle na 1. Talent přidává pouze **20 % XP** do odpovídajícího skillu; změna profese talent ani zkušenosti nemaže.

Klikni na postavu a použij **Assign Job**, nebo ji přiřaď přímo v panelu pracovní budovy. Nezaměstnaní se procházejí po osadě. **Miner** pracuje v kamenolomu a **Hunter** v lovecké chatě; bez přiřazeného pracoviště čekají. Nejprve dojdou k budově, potom k reálnému cíli a se surovinou se fyzicky vrátí. Inventář a pracovní XP se připíší až při návratu. Lovec používá skutečný boj a původní množství masa. Pracovníci si rezervují cíle, takže dva nesbírají tentýž předmět. Při změně práce se rozpracovaný úkol bezpečně zruší bez odměny. Lovec pod 30 % HP přeruší útok, vrátí se domů a zotavuje se alespoň na 80 % HP.

Woodcutter a Farmer zatím ukazují **Waiting for workplace**. Builder automaticky vyhledává skutečná staveniště a fyzicky je staví. Pokud nejsou dostupná, čeká bez fiktivní práce. Soldier přiřazený do kasáren hlídkuje v jejich okolí a brání se při napadení; sám nenapadá neutrální zvěř.

Každý skill level nad 1 zvyšuje efektivitu příslušné činnosti o **1 %**, nejvýše na **149 %**. Mining zrychluje pracovní dobu 1500 ms; Hunting zrychluje příslušné DPS a krátké sbírání masa (700 ms), Combat bojové DPS. Nemění základní statistiky, pohyb ani množství surovin. Dokončená činnost přidá stejné základní XP do příslušného skillu i celkového postupu. Skutečné poškození rozvíjí Combat, nejvýše 40 základních XP na protivníka; tento přírůstek neduplikuje celkovou odměnu za lov.

Pracovní AI funguje i mimo záběr kamery a pod Fog of War; skryté jednotky nemají viditelné panely ani efekty. Save/Load uchovává skilly, profese, pohyb, rozpracovanou práci a rezervace. Starší save zachová původní svět a XP. Existujícím poddaným ponechá dosažené skilly a přidělí stabilní talent bez nového losování. Save bez poddaných jednou přidá tři nové obyvatele; královy nové skilly začnou na 1.

## Blueprinty a výstavba

Buildings nejprve umístí **blueprint**, nikoli hotovou budovu. Materiál se rezervuje pro konkrétní staveniště a fyzicky zůstává ve skladu až do vyzvednutí; přestane být dostupný pro jiné zakázky. Nosič nebo král jej skutečně dopraví na místo. Stavitelé začnou až po dodání celé ceny a při dokončení se doručený materiál spotřebuje bez dalšího odečtu ze skladu. Půdorys je od umístění obsazený. Nedokončená budova neposkytuje příjem, pracoviště, vstup na plošinu ani chůzi po hradbě.

| Budova | Základní doba při Construction 1 |
|---|---:|
| Wall | 5 s za segment |
| Tower | 20 s |
| Castle | 45 s |
| Hunting Lodge | 25 s |
| Quarry | 30 s |
| Barracks | 40 s |

Poddanému přiřaď **Builder**. Vyhledá nejbližší dosažitelné staveniště, rezervuje si sousední pracovní místo a začne až po skutečném příchodu. Na jednom staveništi jsou nejvýše **tři místa včetně krále**. Rychlosti se sčítají a Construction přidává 1 % za každý level nad 1, nejvýše 149 %. Doba chůze se do postupu nezapočítává. Nedostupné staveniště čeká na změnu mapy a nevyvolává opakované hledání každým snímkem.

**Kliknutím na blueprint otevřeš přehled materiálu a postupu.** Materiál na staveniště vozí automaticky Haulers; když žádný není volný, donese si ho Builder sám. **Build with King** u nezásobeného blueprintu pošle krále, aby rezervované suroviny dopravil v nákladech do 20 jednotek a potom rovnou stavěl. Změna příkazu zachová náklad i jeho závazek vůči původní stavbě. Kliknutí na již zásobený blueprint pošle krále stavět. Král případně sesedne z koně nebo sleze z hotové plošiny. Může stavět sám i pomáhat ostatním. Zavřením přehledu pokračuje v práci; **Stop King's work** nebo příkaz k jinému cíli práci přeruší a zachová postup.

**Cancel Construction** uvolní dosud nevyzvednuté rezervace a zachová skutečný materiál v nákladech či na zemi. Doručené zásoby z nezasahované stavby zanechá na zemi v plném množství; po zahájení práce vrátí 50 % každé suroviny, zaokrouhleno dolů. Refundace se nepřičte vzdáleně do inventáře ani znovu neudělí Mining XP. Zrušená stavba neudělí Construction XP a uvolní místa i půdorys. Hradby tažením rezervují celou řadu atomicky a vytvářejí jednotlivá staveniště. Teprve hotové segmenty se propojí a lze po nich chodit.

Fáze přecházejí od průhledného blueprintu přes základy, konstrukci a téměř hotovou budovu k plné grafice. Odměna se přidělí jednou až při dokončení. **Základní XP odměna** se rozdělí podle skutečného příspěvku každého stavitele; osobní talent následně přidá svému majiteli původních 20 % skillových XP. Celkový level nepřebírá tento osobní bonus. Pouhá rezervace, chůze, čekání ani zrušení XP nepřidávají.

Save Schema 7 zachovává zdrojové rezervace, doručené zásoby, závazky neseného i odloženého materiálu, postup, příspěvky, pracovní místa, cesty i vícecestnou přepravu krále. Starší rozestavěné budovy dostanou už zaplacený materiál jako doručený; ze skladu se znovu nic neodečte. Starší hotové budovy zůstanou hotové.

## Pracovní budovy a zaměstnanci

| Budova | Půdorys | Cena | Místa | Profese |
|---|---|---|---|---|
| Quarry | 3 × 3 | 15 Stone | 3 | Miner |
| Hunting Lodge | 2 × 2 | 10 Stone | 2 | Hunter |
| Barracks | 3 × 3 | 20 Stone | 5 | Soldier |

Kliknutím na pracovní budovu otevřeš obrázek, obsazená a volná místa, pracovní stavy, skilly, průměrný skill, celkové denní mzdy a dosud přinesené suroviny. **Assign Worker** nabídne živé poddané včetně současné profese, vhodného skillu, talentu a budoucí sazby. Přiřazení změní profesi stejné postavy; nevytváří jednotku. Jeden poddaný patří nejvýše jednomu pracovišti a kapacitu nelze překročit. **Remove Worker** ho vrátí do Idle. Klikání v panelu nepřikazuje králi pohyb.

Kamenolom nevytváří kameny a lovecká chata neobnovuje zvěř. Pracovníci používají skutečné objekty, sdílené rezervace a osmisměrné cesty kolem překážek, budov i rezervovaných polí ostatních postav. Když není dosažitelný cíl, čekají a zkoušejí ho znovu. Nedostupná cesta zpět ponechá náklad u pracovníka. Při odebrání, změně práce nebo smrti se nedoručený náklad bezpečně položí jako existující typ dropu; nezíská za něj odměnu. Jiný horník nebo lovec ho může jednou přinést.

Lovec s nízkým HP se vrací k vlastní chatě, ihned odevzdá případný náklad a léčí se. Vojáci pouze hlídkují a brání sebe. Žádná pracovní budova nevytváří obyvatele a neposkytuje pasivní suroviny. Save/Load obnoví místa, výrobu, cesty, náklad, rezervace i dosud nepřipsané pracovní odměny bez opakovaného přičtení. Starší save bez pracovišť převede zaměstnané nepřiřazené poddané do Idle, zachová jejich profily a již naběhlé mzdy.

## Talenty a ekonomika mezd

Horní přehled Economy ukazuje Gold, příjmy hradů, očekávané denní mzdy, bilanci a nezaplacené mzdy. Detail poddaného zvýrazňuje talentovaný skill a ukazuje talent, bonus XP, sazbu a dluh.

Nezaměstnaní mají sazbu 0, běžné profese 1 Gold/den a Soldier 2 Gold/den. Každých deset dokončených levelů příslušného pracovního skillu přidá 1: levely 1–10 mají základ, 11–20 základ +1 až po 41–50 základ +4. Talent sazbu přímo nemění. Zaměstnanec dostává mzdu i při čekání na práci; smrt zastaví nové náklady, ale nesmaže již vydělanou mzdu.

Den trvá 120 aktivních sekund. Mzdové náklady se počítají poměrně podle skutečného času v profesi a při dané sazbě. Na přelomu dne se nejdříve přičte příjem hradů a poté zaplatí nejstarší dluhy a nové mzdy. Nedostatek Gold zanechá dluh konkrétním poddaným a upozornění; Gold nikdy neklesne pod nulu. Částky jsou interně bez zaokrouhlování a UI zobrazuje dvě desetinná místa. Pauza a zavřená hra nové mzdy nevytvářejí.

Save/Load uchovává talenty, původní i aktuální skilly, poměrné náklady rozehraného dne, dluhy a poslední výplatu. Starší save neúčtuje zpětné mzdy. Zatím nejsou stávky, morálka ani odchody kvůli dluhu.

## Přirozené pěšiny

Každý skutečný vstup lidské postavy na travnaté políčko přidá jeden bod vyšlapání, král na koni přidá dva. Stání ani samotná zvířata skóre nemění; na střechách, překážkách a pod budovami se pěšiny nevytvářejí. Sdílený pohyb zaznamená i více překročených buněk za snímek a plynulé diagonály.

| Průchody | Povrch | Bonus rychlosti |
|---|---|---|
| 0–4 | Původní tráva | 0 % |
| 5–14 | Sešlapaná tráva | +5 % |
| 15–29 | Travnatohlinitá pěšina | +10 % |
| 30+ | Hlinitá cesta | +15 % |

Úseky se propojují se sousedy. Bonus platí pouze v právě procházeném políčku a násobí běžnou rychlost; kůň si zachová základní dvojnásobnou rychlost. Třetí herní den bez použití začne skóre klesat o pět a potom klesá o pět každý další den. Nový průchod tuto lhůtu odloží. Save/Load zachovává skóre, úroveň i den posledního průchodu; za zavřenou hru tráva navíc nedorůstá. Starší savy začnou s nevyšlapanou trávou.

## Hrad a hradby

Castle obsadí **3 × 3** neprůchozí políčka a stojí **10 kamenů**. Král k němu přijde po zemi, vystoupí na viditelnou horní plošinu a může z ní znovu sestoupit. Před vstupem z koně automaticky sesedne.

Stone Wall zabírá **1 × 1** a stojí **1 kámen za nový segment**. Držení a tažení levého tlačítka vytvoří náhled rovné řady podle dominantní osy logické mapy. Stavba se potvrdí až uvolněním tlačítka: všechny nové segmenty musí být platné a hráč musí mít na celou řadu. Jinak nevznikne nic a nic se nezaplatí. Existující segmenty hradeb v řadě se použijí bez opakované platby. Po úspěšné řadě režim stavění skončí, stejně jako u ostatních budov.

Sousední segmenty sdílející hranu se vizuálně spojí; cimbuří se vykreslí po vnějším obvodu a změna aktualizuje i sousedy. Fungují konce, rovné úseky, rohy, T i křížení. Zemní navigace přes hradby neprochází.

Kliknutím na hradbu král dojde k dostupnému sousednímu políčku a vyleze. Pak lze klikat na propojené segmenty a chodit po jejich vrcholu. Navigace po hradbách má vlastní síť sdílených hran: diagonálně se dotýkající segmenty ani mezery nelze přejít vzduchem. Klik na nespojenou hradbu vyžaduje sestup a běžnou cestu. Pro návrat na zem se hledá dostupný výstup i na dalších propojených segmentech, takže král nezůstane uvězněný uprostřed velké souvislé konstrukce.

## Souboje a životy

| Jednotka | Max HP | DPS | Armor | Dosah |
|---|---:|---:|---:|---:|
| King | 100 | 15 | 0 % | 1 |
| Rabbit | 15 | 1 | 0 % | 1 |
| Deer | 40 | 4 | 0 % | 1 |
| Wild Boar | 70 | 12 | 0 % | 1 |
| Horse | 90 | 0 | 0 % | 1 |

Statistiky jsou centrálně v definicích, ale každá instance má vlastní HP. Poškození je `DPS × (1 − armor / 100) × čas v sekundách`, nezávislé na FPS. Armor se při výpočtu omezí na 0–90 %. Zajíc tak vydrží jednu sekundu nepřerušeného útoku, srna přibližně 2,67 a divočák 4,67 sekundy. HP nikdy neklesne pod nulu.

Král pronásleduje jeden vybraný cíl a při změně polohy obnoví cestu. Dosah zahrnuje i diagonální sousedy, ovšem nelze útočit přes blokující roh. Také poslední políčko přístupové cesty musí umožňovat skutečný útok. Zvěř nezaútočí první; po napadení se brání a může se bezpečnou cestou přiblížit. Kůň zůstává nelovitelný a jízda nemění DPS krále.

Horní lišta zobrazuje HP krále. Nad poškozenými nebo bojujícími zvířaty se ukáže malý health bar, který se skryje spolu se zvířetem podle Fog of War. Útok krále doprovází pohyb zbraně a zásah krátké bliknutí. Zvíře po smrti zmizí a zanechá ručně sběratelné maso. Ze zvýšených plošin král po mapě nebojuje.

Po smrti krále se zastaví ovládání, pohyb a herní časovače a objeví se Game Over. Restart Game vytvoří čistou hru s plnými HP, nulovým inventářem a novými objekty. Volba Fog of War zůstává nastavením hráče. Král během aktivní hry regeneruje 0,2 HP/s (1 HP za 5 sekund), včetně chůze, souboje, jízdy a pobytu nahoře. Regenerace nepřekročí maximum a mrtvou postavu neoživí.

## Herní čas, zlato, poklad a vybavení

Hra začíná **Day 1**. Jeden den trvá **120 sekund aktivní hry** a horní lišta ukazuje zbývající čas. Událost přechodu dne se spustí právě jednou pro každý překročený den, včetně většího časového kroku. Game Over nebo pozastavení čas zastaví; katalog objektů a přehled vybavení zůstávají běžícím prohlížečem nad hrou.

Inventář začíná na nule v pořadí **Gold → Stone → Meat**. Každý hotový Castle při nejbližším dalším přechodu dne přidá **5 Gold**; tři hrady tedy 15. Nezáleží na kameře, dohledu ani poloze krále. Příjem doprovází krátké oznámení. Nově postavený hrad nedostane příjem za předchozí dny. Zlato se používá na denní mzdy poddaných.

Při nové hře vznikne **jedna neprůchozí dostupná truhla** mimo krále, suroviny a ostatní objekty. Obsah se vylosuje jednou: **50–100 Gold**, **1 Sword** a **1 Armor**. Po dojití vedle truhly se víko animovaně otevře a zobrazí obsah. Teprve tlačítko **Take All** přidá věci do původního inventáře. Prázdná otevřená truhla zůstane na mapě a další vyzvednutí nic nepřidá. Respektuje Fog of War.

Sword přidává **+100 % základního DPS**, tedy z 15 na 30. Armor přidává **30 procentních bodů Armor**, takže příchozích 12 DPS divočáka sníží na 8,4 DPS před regenerací. Předměty se po získání automaticky vybaví do slotů Weapon a Armor. Opakované vybavení bonus nesčítá, odložení vrátí příslušnou základní hodnotu. Detail ukazuje Base/Final DPS, Base/Final Armor, HP a regeneraci. Základní definice zůstávají neměnné.

## Zvěř, lov a potrava

Při nové hře vzniknou tři zajíci, tři srny a tři divočáci na různých volných dosažitelných políčkách. Pomalu putují k náhodným blízkým cílům a mezi cestami odpočívají. Sdílí s králem osmisměrné A* i normalizovaný pohyb bez průchodu rohy; nová stavba nesmí překrýt zvíře nebo jeho probíhající krok.

Kliknutí na zvíře zahájí pronásledování se změnami cesty podle pohybu cíle. Souboj začne až ze sousedství, bez teleportace. Cíl postupně ztrácí HP a při napadení útočí zpět. Jiný klik lov i odvetný útok daného zvířete zruší. Zajíc zanechá balíček 5 masa, srna 10 a divočák 15. Odměna se nepřipíše automaticky: balíček zůstane ležet až do ručního sběru. Stejné suroviny na jednom políčku se sloučí.

Jediný centrální Food System průběžně spotřebovává dvě porce za den pro krále a jednu pro každého živého poddaného. Nejprve používá Apple, pak Bread a Meat ze skutečně dostupných skladových zásob. Horní lišta ukazuje denní spotřebu a Food shortage s počtem nenasycených obyvatel. Přehled knihovny nepozastavuje běžící hru.

## Dohled a kůň

Fog of War je ve výchozím stavu **OFF**. Zapíná se v levém panelu Settings. Terén mapy zůstává celý viditelný; mimo aktuální logický dohled se skrývají pouze objekty, včetně skal, budov, surovin a zvěře. Skryté objekty nelze nově vybrat. Jejich pohyb, časovače a ostatní logika pokračují. Posun a zoom kamery dohled nemění.

Dohled pěšího krále je **20 × 20 políček**, na koni **30 × 30**, na horní plošině věže **40 × 40**, na hradě a hradbě **35 × 35**. Bonusy se nesčítají. Král na koni automaticky sesedne před příkazem ke vstupu do věže; pokud pro koně není vhodné sousední políčko, vstup se neprovede. Při nedostatku místa nelze ani ručně sesednout.

Při nové hře vznikne jeden nelovitelný kůň. Kliknutí zahájí pronásledování, nasednutí nastane až zblízka. Jezdec a kůň pak používají králův původní osmisměrný pohyb s rychlostí **7 místo 3,5 políčka/s**; lze dále lovit a sbírat. Nasedání nepřidává další instanci koně. Po sesednutí se obnoví původní rychlost a dohled a na stejného koně lze znovu nasednout.

## Knihovna objektů

Sedmnáct současných typů (grass, dirt, stone, meat, gold, tower, castle, wall, king, rock_outcrop, rabbit, deer, wild_boar, horse, basic_sword, basic_armor, treasure_chest) má centrální definice v `src/data/objects/`. Registr kontroluje unikátní ID a platné parametry; stejná cena a půdorys budovy řídí galerii, nabídku Buildings, platbu i kolize. Galerie je pouze prohlížeč a nemění mapu nebo inventář.

`AssetManager` načítá sdílené PNG/WebP textury a spritesheety se správným základem URL pro GitHub Pages. Chybějící obrázek použije procedurální kresbu nebo společný náhradní obrázek. Nová surovina či budova používající stávající mechanismy se přidává definicí a obrázkem; inventář i nabídka se přizpůsobí automaticky. Podrobný postup, origin, vrstvy věže a animace postavy popisuje **[ASSET_GUIDE.md](ASSET_GUIDE.md)**.

## Instalace a spuštění pro vývoj

Potřebuješ **Node.js 22.12+**, doporučeno Node.js 24 LTS, a npm.

```sh
npm ci
npm run dev
```

Otevři adresu vypsanou Vite. V cloudovém prostředí lze použít `npm run dev -- --host 0.0.0.0`.

```sh
npm test                         # souřadnice, A*, směry, generování, inventář, stavby a stavy krále
npm run build                    # produkční soubory do dist/
npm run build -- --base=/Newgame/ # sestavení pro projektovou cestu GitHub Pages
npm run preview                  # místní kontrola produkčního buildu
```

Upozornění Vite na velikost balíčku souvisí s přibaleným Phaserem a nebrání sestavení.

## Struktura projektu

| Soubor | Odpovědnost |
|---|---|
| `src/main.js` | Phaser, velikost plátna podle dostupného místa a spuštění scény. |
| `src/game/config.js` | Velikost mapy, rozměry kosočtverce a start krále. |
| `src/game/map.js` | Logická mapa, původní překážky a průchodnost. Budovy se zapisují jen do kopie mapy konkrétní hry. |
| `src/game/isometric.js` | Projekce, inverze, středy/polygony políček a hranice světa. |
| `src/game/TerrainRenderer.js` | Sdílené textury terénu, cache bloků 10 × 10 a fond viditelných bloků/překážek kolem kamery. |
| `src/game/WorldCamera.js` | Plynulé sledování, WASD/šipky, zoom a omezení hranic. |
| `src/game/pathfinding.js` | Osmisměrné A* s minimální haldou, cenami 1/√2 a zákazem průchodu rohy; také hledání dosažitelné oblasti pro generátor. |
| `src/game/PlayerController.js` | Logická desetinná poloha, cesta a stavy `ground`, `enteringTower`, `onTower`, `onWall`, `exitingTower`. |
| `src/game/directions.js` | Osm názvů logických směrů a jejich převod na izometrické pózy. |
| `src/game/KingView.js` | Koruna, plášť, končetiny a osm odlišných natočení s chůzí a klidem. Lze nahradit profesionálním spritem bez změny herní logiky. |
| `src/game/stones.js` | Náhodné dosažitelné pozice, dvacetisekundový generátor, limit a vlastní kresba kamene se stínem. |
| `src/game/inventory.js` | Počty surovin podle názvu a bezpečná platba; připraveno i pro další suroviny. |
| `src/game/buildings.js` | Cena, půdorys, validace, blokování mapy a plánování vstupu/výstupu. |
| `src/game/walls.js` | Atomická stavba řad, propojení podle sousedů a samostatná navigace/výstupy po vrcholu hradeb. |
| `src/game/FortificationView.js` | Parametrická geometrie hradu a spojených hradeb s předním/zadním cimbuřím. |
| `src/game/TowerView.js` | Izometrické stěny, plošina, cimbuří, stín, zásah myší a průhledný náhled. |
| `src/game/GameScene.js` | Propojení vstupu, kamery, krále, sběru, generátoru, stavby a UI. |
| `src/data/objects/` | Datové definice terénu, surovin, budov, postav, dekorací a zvířat, včetně jediné ceny věže. |
| `src/systems/ObjectRegistry.js` | Validace a vyhledávání neměnných definic. |
| `src/systems/AssetManager.js`, `SpriteViews.js` | Sdílené obrázky/animace, fallback, origin a obecné sprite pohledy. |
| `src/ui/BuildingBar.js`, `InventoryBar.js` | Nabídka a inventář sestavené z registru objektů. |
| `src/systems/AnimalSystem.js`, `HuntingSystem.js` | Spawn a pohyb zvěře, zaměření, pronásledování a samostatná funkce lovu. |
| `src/systems/DropSystem.js`, `FoodSystem.js` | Obecné balíčky s množstvím, slučování, ruční sběr a pravidelná spotřeba potravy. |
| `src/game/movement.js` | Společný krok pohybu pro krále i zvěř. |
| `src/systems/FogOfWarSystem.js`, `VisibilityModifiers.js` | Logický čtverec dohledu a nesčítané bonusy koně a budov. |
| `src/systems/MountSystem.js`, `src/ui/SettingsPanel.js` | Nasedání/sesedání bez duplicit, levé nastavení s bezpečným localStorage. |
| `src/systems/CombatSystem.js` | Společné DPS, dosah, Armor, souběžné útoky a jedinečná událost smrti. |
| `src/ui/CombatFeedback.js` | HP krále, health bary zvířat a krátké bliknutí při zásahu. |
| `src/systems/GameTimeSystem.js`, `ProductionSystem.js` | Aktivní čas, denní událost a produkce podle definic budov. |
| `src/systems/UnitStats.js`, `RegenerationSystem.js`, `EquipmentSystem.js` | Základní/odvozené statistiky, regenerace a dva sloty vybavení bez opakovaného násobení. |
| `src/systems/TreasureSystem.js`, `src/game/ChestView.js` | Unikátní truhly s pevným obsahem, animace, přístup a jednorázové vyzvednutí. |
| `src/ui/EquipmentPanel.js`, `TreasurePanel.js` | Přehled vybavení/statistik a okno Take All. |
| `src/ui/AssetGallery.js` | Prohlížeč knihovny s filtry a detailem. |
| `index.html`, `src/style.css` | Pevné rozhraní kolem mapy. Žádné CSS otáčení herního světa. |
| `tests/` | Testy souřadnic, navigace, generování, časování, limitů, inventáře, stavby a vstupu/výstupu. |

## Souřadnice a pořadí kreslení

Logické rohy políček používají jednotky mřížky; středy jsou `(x + 0.5, y + 0.5)`. Projekce do herního světa je:

```text
worldX = originX + (gridX - gridY) * 32
worldY = originY + (gridX + gridY) * 16
```

Při kliknutí se nejprve odstraní posun a zoom kamery pomocí `camera.getWorldPoint` / `pointer.updateWorldPoint`. Inverzní projekce vrátí logickou polohu, ze které se vezme příslušné políčko. Stejná projekce určuje pohyb, kameny, půdorys i náhled věže. Rychlost krále je **3,5 logického políčka za sekundu** a na zoomu nezávisí.

Natočení se určuje z posledního skutečného logického vektoru pohybu. Například logické `NE` se na obrazovce promítá doprava, `SE` dolů a `NW` nahoru. Vzhled nabízí čelní, zadní, profilové i částečně otočené pózy; končetiny se při chůzi pohybují ve směru jejich projekce. Při zastavení zůstane poslední natočení zachované. Nový příkaz uprostřed úseku nejprve dokončí tento úsek a další cestu naplánuje z jeho konce, bez poskočení.

Výběr vstupu a výstupu věže porovnává skutečnou délku cesty s diagonálami, nikoli pouhý počet políček. Testy kontrolují i shodu A* s nezávislou Dijkstrou, všechny čtyři rohy věže, normalizovanou rychlost a ochranu rohů během stavění.

Objekty se řadí podle promítnuté polohy nohou či přední části základny. Věž má zvlášť zadní část a přední parapet; král na plošině je mezi nimi. Výška objektu proto nemění jeho logickou polohu nebo obsazená políčka.

## Výkon

Existuje celá logická mapa a pathfinding na všech 10 000 políčkách. Šest procedurálních textur země se jednou skládá do bloků **10 × 10 políček**. Vykreslují se jen viditelné bloky s rezervou pro okraje; obrazy bloků i překážek se skrývají a znovu používají. Statický výřez se nepřestavuje každý snímek. Kameny a věže mimo kameru se také nekreslí.

Výchozí renderer lze pro testování přepnout parametrem adresy: `?renderer=canvas` (výchozí), `?renderer=webgl` (WebGL, je-li dostupné, jinak Canvas) nebo `?renderer=auto` (WebGL jen s hardwarovou akcelerací). Aktivní renderer ukazuje Settings. Volba platí pro dané načtení stránky a neukládá se.

Pro tento procedurální prototyp je vybraný renderer **Phaser Canvas**, který s cache terénu dobře funguje také na strojích bez hardwarové akcelerace WebGL. Místo tisíců objektů země tak scéna kreslí desítky obrazových bloků. Logické kolize a cesta nadále rozlišují každé jednotlivé políčko.

Kamera je omezená obdélníkovými hranicemi promítnutého světa; její střed se navíc drží uvnitř kosočtverce mapy. U okrajů tak lze vidět obrys světa, ale kamerou nelze odjet do nekonečného prázdna. Inventář a Buildings patří do HTML, nikoli do posouvané kamery.

## Zveřejnění a návrat k původní verzi

GitHub Pages je nastavené na **GitHub Actions**. Push do `main` spustí `.github/workflows/pages.yml`: instalaci z lockfilu, testy, build se správnou základní cestou a nasazení. Web je nezávislý na publikování cloudového prostředí Codexu.

Před převodem na izometrii byl vytvořen checkpoint commit **`bf049d5`**. Obsahuje původní funkční verzi se sběrem, inventářem a věžemi; lze jej použít pro porovnání nebo návrat.

Před zavedením Asset Library vznikl checkpoint **`4d3d63f`** s funkčním osmisměrným pohybem.

Fronta dalších zadaných úkolů a jejich původní znění jsou v **[docs/TASK_QUEUE.md](docs/TASK_QUEUE.md)**.

### Nastavení nové hry

New Game otevře Game Setup: obtížnost Easy/Normal/Hard, 3/9/24 lovitelných zvířat, 0–10 pokladů a 0–100 počátečních kamenů. Mapa a časovače vznikají až tlačítkem Start Game. Obtížnost mění základní HP/DPS krále a zvěře, kůň zůstává beze změny; vybavení a skilly se přidávají poté. Kameny zachovávají 20sekundový interval a kapacitu max(80, počáteční počet). Save/Load obnovuje konfiguraci, skutečné objekty a časovače; starší hry používají Normal bez nového generování.

### Pokročilé nastavení světa

Advanced Settings jsou standardně sbalené. Nová hra používá Fog of War ON (přednost před starou preferencí prohlížeče), volitelný hotový hrad 3 × 3 zdarma, den 60/120/240 sekund, obnovu zvěře Off/120/60/30 sekund a počáteční zlato 0–500 po 25. Pod zlatem lze nastavit počáteční Stone, Wood, Iron Ore a Bread po 5 kusech; dohromady nejvýš 40, tedy kapacitu počátečního skladiště, kam se při startu fyzicky uloží. Initial Stones dál určuje jen volně ležící kameny na mapě. Reset to Defaults obnoví jen formulář; přehled pod ním ukazuje všech devět voleb. Hra ani uložené pozice se při nastavování nemění.

Denní příjem, poměrné mzdy, zarůstání cest i migrace používají zvolenou délku dne. Spotřeba masa po minutě a kameny po 20 sekundách zůstávají stejné. WildlifeRespawnSystem doplňuje jeden nejvíce chybějící druh na interval do cíle 3/9/24; hledá dosažitelné volné místo a přednostně místo mimo králův dohled. Pauza a Game Over jej zastaví. Koně nedoplňuje.

Save v2 zachovává konfiguraci odděleně od aktuálního nastavení dohledu, zbývající respawn a skutečný svět. Save v1 se bezpečně převádí bez opětovného vytvoření hradu, zlata, zvěře či truhel a bez změny uložených základních statistik.

### Verze hry a Changelog

Aktuální verzi určuje pouze `package.json.version`; hlavní menu a Settings ji zobrazují automaticky. `CHANGELOG.md` obsahuje jedinou autoritativní historii, kterou Vite při buildu převádí na hráčská data bez backendu. Changelog v hlavním menu podporuje Back/Escape, scrollování a lokální indikátor NEW při přechodu na novější vydání. Sekce Unreleased zůstává skrytá.

Dokončené změny zapisuj anglicky do Unreleased. Číslované vydání se připravuje jen na výslovný pokyn: `npm run release:prepare -- minor` (nebo patch/major), potom validace, testy, build a kontrola změn. Skript sám neprovádí commit, tag ani publikování. Podrobnosti jsou v [docs/RELEASING.md](docs/RELEASING.md); pravidla pro Codex v [AGENTS.md](AGENTS.md). Save Schema Version je samostatná a tento krok ji nemění.

### Zemědělství a sady

Farmhouse (2 × 2, 10 Stone) zaměstná tři existující Farmáře v rádiusu 15 políček. Wheat Field (3 × 3, 3 Stone) roste dva herní dny a poskytuje 8 Wheat; Orchard (3 × 3, 6 Stone) roste tři dny a poskytuje 6 Apple. Všechny objekty se staví původními blueprinty. Dokončenými pozemky lze procházet; rozestavěné pozemky blokují pohyb a nerostou.

Rostliny rostou i bez obsluhy, ale sklizeň vyžaduje rezervovaný pozemek, fyzický příchod farmáře a aktivní práci. Farming zrychluje pouze tuto práci, nikoli biologický růst. XP a suroviny vznikají jednou za sklizeň. Růstové fáze a rozpracovaná sklizeň se obnovují Save/Load. Verze hry zůstává nezávisle určená package.json. Apple je jedlé, Wheat se přímo nekonzumuje. Základní délku růstu dále upravují roční období a počasí.

## Výroba a skladování potravin

Mill (2 × 2, 12 Stone) a Bakery (2 × 2, 10 Stone) mají po dvou pracovních místech. Mlynář dopraví 4 Wheat do mlýna a za 30 sekund aktivní práce vzniknou 3 Flour. Pekař dopraví 2 Flour do pekárny a stejným množstvím práce vyrobí 4 Bread. Dva pracovníci se na práci podílejí; Milling/Baking zrychlují aktivní výrobu stejným vzorcem jako ostatní skilly. Profese využívají původní XP i mzdy. Auto Production lze v panelu vypnout a rozpracovanou dávku později dokončit.

Granary (3 × 3, 10 Stone) ukládá nejvýše 200 jednotek Meat, Wheat, Flour, Bread a Apple dohromady. Další sýpky přidávají kapacitu. Nová hra má poblíž krále dostupný hotový Starter Stockpile (2 × 2) pro 40 jednotek materiálů a potravin. Starší hry zachovávají původní tábor pro 30 potravin a dostanou fyzické místo pro dosavadní materiály; nadlimitní zásoby se neztrácejí a nové dodávky počkají na volné místo.

Warehouse (3 × 3, 10 Stone) po fyzickém dokončení poskytuje 200 míst pro Stone, Wood, Iron a budoucí stavební materiály. Každý sklad má vlastní obsah a polohu; existující zásoby se do nové budovy nepřenesou samy. Král unese 20 jednotek jedné suroviny a vyloží je až po skutečném příchodu. Nový příkaz přeruší cestu a zachová nesený náklad; Resources & Storage umožňuje doručení znovu nařídit. Zlato zůstává centrální měnou. Save Schema 7 ukládá králův náklad, zdroj, cíl, staveniště a rezervace; načtení nevytváří další počáteční skladiště.

Farmáři odnášejí sklizeň do skladu; mlynáři, pekaři a nosiči fyzicky převážejí vstupy i výstupy. Běžný pracovník unese nejvýše 20 jednotek. Sklad, země, náklad a omezené výrobní zásobníky jsou různé stavy stejných surovin. Horní inventář ukazuje odvozené dostupné skladové zásoby po odečtení rezervací; Resources & Storage a kliknutí na sýpku ukazují fyzický obsah a kapacitu. Suroviny v nákladu nebo výrobním zásobníku se zde znovu nezapočítávají.

Hauler nepotřebuje pracovní místo: profesi nastavíš v panelu obyvatele a nosič pak obsluhuje všechny sklady v království. Nosiči rezervují skutečné zásoby a cílovou kapacitu, obsluhují výrobní zásobníky, sbírají náklady na zemi a jednosměrně uvolňují počáteční skladiště do dokončených skladů. Suroviny nepřevážejí pořád dokola mezi sklady. Jídlo potřebné obyvateli má přednost před vstupy pro výrobu, hotovými výrobky a vyrovnáváním skladů. Základní mzda je 1 Gold/den se stejnými úrovňovými pásmy jako u ostatních profesí.

Logistics používá původní XP křivku a levely 1–50. Nosnost činí `20 + floor((level − 1) / 5) × 2`, nejvýše 38; základní rychlost chůze se nemění. Odměnu získá až dokončená přeprava podle množství a skutečně ušlé naložené vzdálenosti s horní mezí bonusu. Zrušený nebo vrácený náklad neposkytuje další XP. Překážka zachová náklad a vyvolá nové hledání cesty; změna profese a smrt zanechají skutečné suroviny na zemi. Save/Load zachovává rezervace, náklad, odměny a roznesenou vzdálenost; starší hry dostanou Logistics na levelu 1 bez přelosování talentu.

Resources & Storage obsahuje rozbalovací **Resource locations & reservations**. Dostupné a rezervované zásoby ve skladu, nesené náklady, doručený stavební materiál, výrobní zásobníky a suroviny na zemi jsou oddělené kategorie; rezervace volné kapacity nepřidává další suroviny. Profil nosiče ukazuje náklad, kapacitu, Logistics XP a cíl; skutečný náklad je vidět i u postavy na mapě. Sklady ukazují zaměstnance a probíhající dodávky. Starší zásoby mají na mapě viditelné označení Legacy Stockpile / Camp Storage.

U jednotlivé suroviny ve skladu lze použít **Collect with King**. Král rezervuje nejvýše 20 volných jednotek, fyzicky je vyzvedne a ponechá v nákladu. **Deposit King Cargo** je znovu doručí, **Set Down King Cargo** je zachová na zemi. Tak lze uvolnit plné počáteční skladiště před stavbou prvního Warehouse; rezervované stavební zásoby tím nelze přivlastnit jiné zakázce. Vyzvednutí již uloženého materiálu nevytváří nové Mining ani Logistics XP.

Král i pracovníci při hledání cesty zohledňují skutečné rychlosti na pěšinách včetně přechodu mezi povrchy. Kratší čas může ospravedlnit mírně delší trasu; s maximálním bonusem 15 % nevznikají velké zajížďky ani diagonální průchody rohy. Obnova staršího neplatného přepravního pokynu uvolní pouze jeho rezervace nebo je vrátí staveništi, zachová skutečný náklad a znovu naplánuje dostupnou cestu. Poškozené fyzické zásoby se nadále odmítnou před nahrazením současné hry.

Blueprinty musejí být fyzicky dokončené před zaměstnáváním, skladováním nebo výrobou. Plný sklad zastaví nové sklizně a výrobní dávky. Přerušené dodávky zachovají náklad; změna profese či úmrtí zanechá skutečný drop. Save/Load zachovává sklady, rezervace, náklady i jednou spotřebované vstupy rozpracovaných dávek. Starší hry se migrují bez opakovaného převodu zásob, změny talentů či XP; nové skilly začínají na levelu 1. Bread a Apple jsou jedlé, Wheat a Flour jedlé nejsou.

## Sezóny, počasí a jídlo

Spring, Summer, Autumn a Winter trvají po pěti herních dnech; rok má 20 dnů. Délku dne určuje Game Setup (60/120/240 sekund). Denní počasí se losuje z rozdílných sezónních pravděpodobností. Sezónní růst 1,20 / 1,30 / 1,00 / 0,00 se násobí počasím Sunny 1,10, Rainy 1,15, Drought 0,65 a Frost 0,30. V zimě zůstává růst nulový a rozpracované obilí pokračuje na jaře. Sady na jaře dosáhnou kvetení, ovoce dozrává a sklízí se pouze v létě a na podzim; zima zachová postup a zobrazí bezlisté stromy. Zásoby se při změně sezóny nemažou.

Král jí dvakrát a každý živý poddaný jednou během herního dne. Porce jsou celé jednotky Apple → Bread → Meat. Náklad, potraviny na zemi, výrobní zásobníky ani rezervované zásoby se současně nekonzumují. Nově příchozí poddaný začíná vlastní průběžnou jídelní fázi. Starý minutový časovač masa již neběží.

Nevyřízené jídlo označí obyvatele za nenasyceného. Nenasycení poddaní pracují s 80 % své běžné pracovní efektivity; bojové statistiky, rychlost chůze a regenerace krále se nemění. Doplněné jídlo nejprve nasytí hladové obyvatele, bez hromadění neomezeného dluhu jídla. Nedostatečné zásoby snižují atraktivitu království ze 100 na 60 a snižují šanci usazení v původní denní migrační smyčce. Hlad nikoho automaticky nezabije ani nevyžene.

Food Economy ukazuje dostupné porce, denní spotřebu, skutečnou produkci jedlých potravin za posledních pět dnů, počet nenasycených, sezónu, počasí a atraktivitu. Odhad dnů zásob používá pouze současné dostupné skladové jídlo. Save Schema 5 obnovuje počasí, kalendář, jídelní fáze, hlad, statistiky i růst bez nového losování, duplicitní spotřeby nebo další sklizně. Schémata 1–4 dostanou bezpečné sezónní výchozí hodnoty a zachovají dosavadní zásoby i fázi starého potravinového cyklu bez okamžitého stržení porcí.
