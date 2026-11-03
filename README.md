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
| Levý klik na kámen | Dojde ke kameni a přičte jej do inventáře. |
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

Data mají `saveVersion` a před nahrazením světa procházejí kontrolou. Poškozený save zobrazí chybu a ponechá současnou hru. Zápis do IndexedDB je atomický: při chybě zůstane předchozí save. Samotné ukládání a načítání již otevřené hry funguje i bez internetu; stažení hry při prvním otevření vyžaduje připojení.

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

Buildings nejprve umístí **blueprint**, nikoli hotovou budovu. Materiál se odečte jednou a celý půdorys je od této chvíle obsazený. Trvalý průhledný návrh a ukazatel na mapě ukazují, co se chystá postavit. Nedokončená budova neposkytuje příjem, pracoviště, vstup na plošinu ani chůzi po hradbě.

| Budova | Základní doba při Construction 1 |
|---|---:|
| Wall | 5 s za segment |
| Tower | 20 s |
| Castle | 45 s |
| Hunting Lodge | 25 s |
| Quarry | 30 s |
| Barracks | 40 s |

Poddanému přiřaď **Builder**. Vyhledá nejbližší dosažitelné staveniště, rezervuje si sousední pracovní místo a začne až po skutečném příchodu. Na jednom staveništi jsou nejvýše **tři místa včetně krále**. Rychlosti se sčítají a Construction přidává 1 % za každý level nad 1, nejvýše 149 %. Doba chůze se do postupu nezapočítává. Nedostupné staveniště čeká na změnu mapy a nevyvolává opakované hledání každým snímkem.

**Kliknutím na blueprint pošleš krále stavět** a otevřeš přehled postupu, fáze, pracovníků a zbývajícího času. Král případně sesedne z koně nebo sleze z hotové plošiny. Může stavět sám i pomáhat ostatním. Zavřením přehledu pokračuje v práci; **Stop King's work** nebo příkaz k jinému cíli práci přeruší a zachová postup. V panelu lze práci znovu zahájit.

**Cancel Construction** vrátí 100 % původního materiálu, pokud ještě nikdo nezačal skutečně pracovat. Po zahájení vrátí 50 % každé suroviny, zaokrouhleno dolů. Zrušená stavba neudělí XP a uvolní místa i půdorys. Hradby tažením vytvářejí jednotlivá staveniště; opakovaně naplánované segmenty se znovu neplatí. Teprve hotové segmenty se propojí a lze po nich chodit.

Fáze přecházejí od průhledného blueprintu přes základy, konstrukci a téměř hotovou budovu k plné grafice. Odměna se přidělí jednou až při dokončení. **Základní XP odměna** se rozdělí podle skutečného příspěvku každého stavitele; osobní talent následně přidá svému majiteli původních 20 % skillových XP. Celkový level nepřebírá tento osobní bonus. Pouhá rezervace, chůze, čekání ani zrušení XP nepřidávají.

Save/Load zachovává zaplacený materiál, postup, příspěvky, pracovní místa, rozpracované cesty i úkol krále. Starší uložené budovy zůstanou hotové; nic se znovu neplatí, nestaví ani neodměňuje.

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

Každých 60 sekund aktivní hry se spotřebuje jedno maso, nejvýše do nuly. Horní lišta ukazuje zbývající čas a nenápadné Out of food; hlad zatím nemá žádné další následky. Přehled knihovny nepozastavuje běžící hru.

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

Advanced Settings jsou standardně sbalené. Nová hra používá Fog of War ON (přednost před starou preferencí prohlížeče), volitelný hotový hrad 3 × 3 zdarma, den 60/120/240 sekund, obnovu zvěře Off/120/60/30 sekund a počáteční zlato 0–500 po 25. Reset to Defaults obnoví jen formulář; přehled pod ním ukazuje všech devět voleb. Hra ani uložené pozice se při nastavování nemění.

Denní příjem, poměrné mzdy, zarůstání cest i migrace používají zvolenou délku dne. Spotřeba masa po minutě a kameny po 20 sekundách zůstávají stejné. WildlifeRespawnSystem doplňuje jeden nejvíce chybějící druh na interval do cíle 3/9/24; hledá dosažitelné volné místo a přednostně místo mimo králův dohled. Pauza a Game Over jej zastaví. Koně nedoplňuje.

Save v2 zachovává konfiguraci odděleně od aktuálního nastavení dohledu, zbývající respawn a skutečný svět. Save v1 se bezpečně převádí bez opětovného vytvoření hradu, zlata, zvěře či truhel a bez změny uložených základních statistik.

### Verze hry a Changelog

Aktuální verzi určuje pouze `package.json.version`; hlavní menu a Settings ji zobrazují automaticky. `CHANGELOG.md` obsahuje jedinou autoritativní historii, kterou Vite při buildu převádí na hráčská data bez backendu. Changelog v hlavním menu podporuje Back/Escape, scrollování a lokální indikátor NEW při přechodu na novější vydání. Sekce Unreleased zůstává skrytá.

Dokončené změny zapisuj anglicky do Unreleased. Číslované vydání se připravuje jen na výslovný pokyn: `npm run release:prepare -- minor` (nebo patch/major), potom validace, testy, build a kontrola změn. Skript sám neprovádí commit, tag ani publikování. Podrobnosti jsou v [docs/RELEASING.md](docs/RELEASING.md); pravidla pro Codex v [AGENTS.md](AGENTS.md). Save Schema Version je samostatná a tento krok ji nemění.
