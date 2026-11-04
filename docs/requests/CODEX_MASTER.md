# Kompletní implementační zadání pro Codex — Medieval Kingdom

## Jak postupovat

Pracuj pouze na svých úkolech v uvedeném pořadí. Nejdřív ověř aktuální GitHub `main`, `AGENTS.md`, `CLAUDE.md`, `docs/COORDINATION.md`, `docs/TASK_QUEUE.md`, `docs/UPGRADE_PROGRESS.md` a otevřené PR. Pokud právě probíhá starší master prompt na stejné části, **nepřebírej ani neduplikuj jeho práci**; založ závislost, vyčkej na začlenění související etapy. Pokud už je některý požadavek skutečně splněný, místo druhé implementace proveď regresní audit a zdokumentuj výsledek.

Každý jednotlivý úkol = vlastní nová větev z aktuálního `main`, testování, commit, Pull Request, merge a ověřený deploy podle AGENTS.md. Pokračuj na další úkol automaticky, **jen pokud jsou předchozí závislosti bezpečně splněné a nemáš rozpracovaný konflikt**. Bez souhlasu uživatele neslučuj neschválené grafické návrhy do produkčních assetů. Používej aktuální alpha save policy.

Jako výsledek zapiš do repo progress co je hotovo a proč, commit/PR, všechny výsledky testů a zbývající překážky. Nezvyšuj číslo hry kvůli jednotlivým krokům, ale respektuj platné milestone release gate.

---

## Společná pravidla

# Medieval Kingdom — společná pravidla pro Codex a Claude

Repozitář: `tom161819/Newgame`. Tento dokument je zadání pro nové úkoly, **nenahrazuje aktuální** `AGENTS.md`, `CLAUDE.md`, `docs/COORDINATION.md`, roadmapu ani existující frontu. Před zahájením čti aktuální `main`, probíhající PR a aktivní úkoly. Jakékoli konflikty pravidel řeš podle aktuálního `AGENTS.md`.

## Pracovní režim

1. **Nevstupuj do `main` přímým pushem.** Každý úkol má vlastní čerstvou větev `codex/<popis>` nebo `claude/<popis>` a Pull Request. Nemanipuluj s historickými `backup/*` větvemi. Žádný force push.
2. **Než začneš:** `git fetch`, zkontroluj GitHub PR, `docs/COORDINATION.md`, aktuální milestone a související dříve implementované funkce. Zaregistruj task a soubory, které budeš upravovat. Pokud původní master roadmapa stále běží, nové úkoly čekají na své závislosti; nedělej duplicitně funkce z nedokončené etapy.
3. **Codex** je vlastníkem herních mechanik, centrálních definic, simulace, worker/AI, fyzických surovin, Save/Load, validace a testů. Může provádět minimální funkční UI nutné pro ovládání mechanik.
4. **Claude** je vlastníkem vizuálů, Asset Studia, spritů, návrhů nových objektů, animací, stylu a vizuální integrace. Nová/výrazně změněná grafika nejprve přes **Asset Studio** (`studio/`, `art/assets/`, `art/sprites/`, `art/approvals.json`); bez skutečného souhlasu uživatele do hry nenasazovat. Čistě kosmetické UI může změnit přímo, pokud nevznikne konflikt se soubory Codexu.
5. **Změny současné AI**: nezaváděj paralelní autonomní systémy, nezdvojuj rezervace, XP, mzdy, výrobní transakce ani logistiku. Využij existující entity a registry.
6. **Alpha saves**: podpora uložených her ze starších verzí není nutná. Aktuální Save/Load musí fungovat, správně validovat schéma, zachovávat jednotlivá ID, rezervace a stav rozpracovaných úkolů. Nedělej falešné úspěšné migrace; neslučitelná data odmítni bez tichého poškození.
7. **Před PR:** relevantní testy, `npm test`, `npm run changelog:validate`, `npm run build:pages` a relevantní browser smoke testy včetně zkušebního Save/Load aktuálního schématu. Pro Asset Studio navíc `npm run studio:build`, `npm run studio:export` (pouze pokud generuješ assety), `npm run studio:smoke`. Pokud ověření nelze spustit, transparentně popiš důvod.
8. Používej `CHANGELOG.md` -> `Unreleased` jen pro skutečné hráčské změny, pro čistě studiové návrhy dokumentaci/PR. Číselné verze/tags/releases vytvářej **jen podle platné projektové release policy a milestone gate**, ne po každém drobném kroku.
9. **Dokončení** = testy + dokumentovaný PR + žádný konflikt + ověřené Pages po merge podle projektu. Pozdější závislý úkol spustit až po úspěšném začlenění svého předchůdce. Jestli je task závislý na nehotovém master milníku, počkat na jeho integraci, nikoli ho obejít.
10. Úkoly nemusí čekat na individuální „pokračuj“, pokud jsou závislosti splněné a agent má možnost pokračovat, ale žádný agent nesmí slibovat běh po skončení své relace. Pokrok ukládej do repo docs a znovu začni posledním bezpečně dokončeným stavem.

## Praktické závislosti

- `C01 → C02 → C03 → C04 → C05 → C06 → C07 → C08` je doporučená pořadová osa pro Codex. C05 lze provést samostatně po C01, ale výchozí je držet pořadí.
- `V01` (sezónní přechody) může Claude začít po C01 kvůli stejným souborům Fog/renderer.
- `V02` (budovy/výbava ve Studiu) může začít po C06 a po uzamčení definic z C07; návrhy se nesmí potichu nasadit do hry.
- `V03` (vojáci ve Studiu) může začít, jakmile C08 stanoví stabilní registry jednotek a jejich vizuální kontrakt.
- Před přidáním něčeho ověř, zda již není implementováno původní master etapou (zejména stáje, automatické zaměstnávání, trakaře/vozy, tooltipy, infopanel, zbrojnice).


# ÚKOLY 



---

## Úkol 1: C01_FOW_POHYB_BLUEPRINTY.md

# C01 (Codex) — Fog of War, pohyb do neznáma, blueprinty a překážky

**Předpoklad:** aktuální `main`, koordinace dle `00_SPOLECNA_PRAVIDLA.md`. Větev `codex/fow-exploration-blueprints`.

## Problém

1. Král po odchodu nechává některá políčka **plně viditelná**, přestože už jsou mimo skutečný aktivní View Range.
2. Nelze kliknutím poslat krále do dosud neviděné oblasti.
3. Hráč má být schopen umístit blueprint do dosud neprozkoumané oblasti, ale není možné poctivě předstírat, že zná skryté překážky. Pokud se pracovníci na místě setkají s překážkou, stavební plán se zruší a hráč dostane informaci v pravém dolním infopanelu.

## A. FOW a map memory — oprava

Prozkoumej `FogOfWarSystem`, `MapMemory`, viditelnost objektů, bonusy z hradu/věží/hradeb, vidění jednotek, přepínače Seasons/Exploration a všechny cesty aktualizace. Odděl **`currentlyVisible`** od **`explored`**. Po opuštění políčka z něj zmizí aktuální informace; má zůstat jen tmavší poslední známý statický stav v Map Memory. Žádné „zaseknuté“ odhalené plošky; ale pokud je políčko stále viditelné jiným oprávněným zdrojem (poddaný / věž), viditelnost je správná. Nezasahuj do runtime šíření mlhy grafikou mimo nezbytnou opravu. Neprozrazuj skryté nové NPC ani změny budov.

## B. Navigace krále do neprozkoumané oblasti

Zachovej současný click-to-move, ale umožni zadat cíl na libovolném **existujícím políčku mapy**, i když ho král nevidí a nikdy ho nenavštívil. Nevyžaduj nově viditelný cíl. Kliknutí na neznámou zem nesmí odhalit objekt, sklad, deposit ani NPC. Trasu vypočítej způsobem slučitelným s aktuálním pathfindingem; při objevené překážce může král přepočítat trasu nebo zastavit s pochopitelným stavem, nikoli se zaseknout. Rozliš kliknutí na ground od kliknutí na viditelný interaktivní objekt; zachovej boj, koně, stavbu a volbu jednotek.

## C. Blueprint do neznámé oblasti

Umožni zakládat blueprinty i mimo View Range, ne mimo hranice mapy. V neprozkoumané části zobraz **provisional/unknown** validitu bez prozrazení skrytých překážek (žádné zelené/červené preview podle tajných objektů). Náklady a rezervace respektují autoritativní stavební systém. Jakmile příslušná jednotka fyzicky dojde na místo a skutečně zjistí překážku / neprůchodnost / konflikt umístění, zruš celou neproveditelnou stavební objednávku atomicky, korektně uvolni materiál, rezervace i úkoly a pošli právě jednu událost `Construction cancelled: obstacle found at site` do již existujícího GameActivityBus/pravého infopanelu (pokud existuje; jinak vytvoř stabilní událost pro navazující C04). Pokud je skutečnost známá už díky viditelnosti jednotky, validuj normálně a neskrývej známé překážky. Neodhaluj stav celého okolí jen kvůli stavební kontrole. Specializované validace (Quarry musí zasahovat skálu apod.) fungují i zde; skryté předpoklady kontroluj až po průzkumu.

## Testování a dokončení

- Přesun krále z viděné oblasti zanechá pouze explored memory, ne aktivní viditelnost; kombinace dvou zdrojů vidění je správná.
- Král dojde do úplně neznámého cíle; skryté entity zůstanou skryté.
- Blueprint lze zadat mimo dohled; při skutečné překážce se zruší bez ztráty/duplikace materiálu a s jediným upozorněním.
- Viditelné a neviditelné obsazení, Fog ON/OFF, diagonální pathfinding, Save/Load aktuálního schématu, scénář více Builderů a Haulerů.
- Relevantní testy a plný projektový gate, commit + PR do `main`, Changelog `Unreleased`, Pages dle pravidel.

**Neimplementuj:** nové grafické varianty, přepracování sezón ani novou minimapu; ty řeší jiné úkoly.



---

## Úkol 2: C02_ZAMESTNANCI_GRANARY.md

# C02 (Codex) — inteligentní seznam pracovníků a falešný Missing Workers u sýpky

**Větev:** `codex/staffing-picker-granary`. Po úspěšném začlenění C01.

## A. Assign Worker — přesně tři skupiny

Po kliknutí na budovu a `Assign Worker` zobraz všechny relevantní existující poddané, rozdělené do **tří skupin v tomto pevném pořadí**:

1. **Unemployed** — nezaměstnaní; jemně vizuálně odlišitelní (subtilní odstín podkladu / rámečku, ne křiklavá barva). Seřaď podle hlavního skillu požadované profese sestupně: nejdříve skill level, potom XP ve skillu. Přirozený talent do oboru použij jako další rozhodovací kritérium při shodě, pak celkový level a stabilní ID.
2. **Employed elsewhere** — pracující v **jiné profesi**; seřaď podle skillu, který potřebuje vybraná budova, nikoli podle aktuální profese. Zobraz současné zaměstnání a při přesunu bezpečné potvrzení.
3. **Already in this profession** — pracující ve **stejné profesi** (v jiné budově, případně už zde); řazení opět podle relevantního skillu. Zaměstnance již přidělené přímo této budově označ `Assigned here` a tlačítko pro opakované přiřazení deaktivuj. U pracujících jinde zachovej bezpečné ruční přeřazení.

V každé skupině počet, jméno, portrét, talent, relevantní Level/XP, aktuální pracoviště; prázdnou skupinu přehledně zobraz. Hledání/filtry podle současného UI, bez opětovného full rerenderu každým snímkem. Použij stávající `WorkplacePanel`, `WorkplaceSystem`, `JobSystem`, `PopulationSidebar` a personální definice. Nezaváděj nová nezávislá pravidla pracovních pozic.

## B. Granary — prověř Missing Workers

Uživatel hlásí `Granary` jako budovu bez zaměstnanců. **Nejdřív zjisti**, zda má sýpka podle aktuální definice skutečná pracovní místa / samostatné Haulery, nebo zda je pouze pasivním skladem. Pokud není v projektu samostatně obsazovaným pracovištěm, oprav indikátor tak, aby nehlásil chybějící zaměstnance. Pokud pracovní místa opravdu má, zachovej indikátor a oprav reálnou příčinu (chybně vypočtená kapacita / přiřazení / event). Nevyrob druhý systém Missing Workers.

## Testy

- Tři správně seřazené skupiny pro Mining, Farming, Hauler, Builder, Mill a případnou novou profesi.
- Rozlišení Unemployed je decentní a kontrast přístupný; current assignment nespouští duplicitu.
- Přeřazení nevytvoří dvojí mzdu, ztrátu nákladu ani dvojité zaměstnání.
- Granary nehlásí falešné chybějící pracovníky; skutečné neobsazené pracovní budovy hlášení zachovají.
- Plné testy/build/smoke/Save-Load, PR, Changelog podle společných pravidel.



---

## Úkol 3: C03_AUTO_PRIORITY_CASTLE.md

# C03 (Codex) — automatické zaměstnávání a priority profesí v Castle

**Větev:** `codex/auto-employment-castle-priorities`. Po C02.

## Cíl

Hráč klikne na **Castle** a v jeho panelu/sidebaru nastaví priority všech existujících profesí **1–5** a preferenci **Food / Production / Balanced**. Automatické zaměstnávání přiděluje pouze dostupné nezaměstnané, prioritizuje profese podle nastavení a v rámci dané profese upřednostňuje přirozené vlohy a následně skill.

## A. Ověř existující Auto Employment

Nejdřív analyzuj `JobSystem`, `WorkplaceSystem`, `WorkerSystem`, `NaturalTalentSystem` a aktuální nastavení levého panelu. Pokud Auto Employment už existuje, **rozšiř jej, nevytvářej druhý scheduler**. Zachovej existující ON/OFF přepínač; pokud chybí, přidej jej do levého Settings a nastav přiměřený výchozí stav nových her (ON, pokud neodporuje již definovaným projektovým pravidlům). V OFF režimu se nic automaticky nepřiřazuje.

## B. Priorita 1–5 v panelu Castle

Po kliknutí na dokončený Castle zobraz `Employment Priorities` jako seznam všech aktuálně definovaných profesí podle Job Registry. Každá profese má nastavitelné 1–5, kde **5 = nejvyšší priorita**, 1 = nejnižší. Nad seznamem přidej režimy `Balanced / Food First / Production First` jako předvolby hodnot; ruční změny vytvoří `Custom`. Food zahrnuje skutečně implementované food profese, Production výrobní/těžební, ale nic nehardcoduj pouze v UI. Výchozí Balanced. Vyhněte se druhým nezávislým prioritám jinde. Pokud ve hře není dokončený Castle, použij výchozí Balanced/centrální nastavení a neblokuj celou hru.

## C. Algoritmus

Po spuštění automatického plánování seskup volná pracovní místa podle profese a priority. Obsazuj v pořadí priorita 5 → 1. V rámci priority deterministické vyhodnocení míst a kandidátů. Výběr poddaného: nejprve relevantní **talent** (+ pokud již definovaný bonus), potom relevantní skill level, XP, celkový level a stabilní ID. Zvaž kandidáty globálně, aby pořadí iterace budov nerozhodovalo náhodně. **Nikdy automaticky nepřeřazuj již zaměstnané**. Respektuj stávku, emigraci, nedokončené budovy a obsazenost. Ruční příkaz má vždy přednost.

Spouštění při dokončení budovy, příchodu přistěhovalce, uvolnění pozice, zapnutí přepínače, změně priorit a načtení hry (jednou po obnově stavu, nikoli co frame). Chraň se před reentrantními eventy. Pokud je poslední nezaměstnaný a dvě budovy s různými prioritami, obsadí vyšší prioritu.

## Testování

- Priority, předvolby a ruční override; správně nejprve talent a potom skill.
- Když není talent, srovnání podle skillu; při stejném skilu stabilní deterministický tie-break.
- Změna priorit nevytáhne pracovníky z existující práce; ruční assignment nedělá automatický ping-pong.
- Nezpracuje nehotové blueprinty, stávkující či odcházející; Save/Load aktuálního schématu zachová nastavení.
- Build/browser tests, PR, Changelog a release policy dle společných pravidel.



---

## Úkol 4: C04_INFO_NOTIFIKACE_PRIKAZINY.md

# C04 (Codex) — upozornění na blokující problémy produkce a práce

**Větev:** `codex/production-diagnostics-notices`. Po C03.

## Zadání

Ve stávajícím **pravém dolním infopanelu** zobrazuj průběžně upozornění na dlouhodobě nesplněné důležité pracovní a výrobní požadavky. **Stejný přetrvávající problém připomeň nejvýše jednou za 30 sekund herního času** (respektuj existující Game Time; neklaď timer na každé NPC ani nevytvářej DOM spam). Při změně stavu problém vyřeš/odznač, znovu se připomene, jen když zůstává aktivní. Možné upozornění zavřít nebo filtrovat kategorii, bez duplicit při Load/Background Simulation.

## Co diagnostikovat

- Postavený blueprint čeká na Buildera a žádný aktivní/volný Builder nemůže práci vykonat: `Construction waiting: no Builder available`.
- Mlýn nemůže vyrábět kvůli chybějícímu Wheat: zjisti **skutečný dostupný a rezervovaný stock**, aktivní výrobu/haulery a relevantní možnou příčinu. Pokud opravdu nemá Wheat a současně chybí Farmer, Wheat Field nebo Farmhouse, ukaž konkrétní nejbližší ověřitelnou příčinu. **Neoznačuj automaticky chybějící Farmhouse jako příčinu**, pokud už má hráč funkční obchodní zásoby nebo jiné zdroje obilí.
- Produkční řetězec bez dostatku surovin, bez potřebné profese či bez přístupu ke skladu, pokud je taková podmínka skutečně blokující.
- Další významné skutečné blokace: např. žádné přístupné ložisko, chybí skladová kapacita, nereálná trasa. Nedělej falešný „bug alarm“ při záměrně vypnuté výrobě, čekání na sezónu nebo při prosté absenci zaměstnance v nepoužívané budově, pokud systém nemá instrukci vyrábět.

## Technický návrh

Re-use `GameActivityBus`, skutečné stavy Production/Construction/Logistics/Workplace, ResourceLedger a UI pravého dolního panelu. Centralizovaná identita problému `(entityId, reasonCode)` + `firstSeen/lastNotified/resolved`, maximálně jedna notifikace na jeden cyklus a jeden aktuální důvod. Diagnostiku vyhodnocuj event-driven nebo periodicky omezenou frekvencí, bez mnohonásobného procházení celé populace každým snímkem. Kliknutí na zprávu může přesunout kameru k viditelné vlastní budově nebo otevřít panel, ale respektuje Fog of War.

## Testy

- Žádný Builder → upozornění, po přidělení zmizí; po 30s stejné upozornění znovu jen při přetrvání.
- Nedostatek Wheat: odlišení skutečné příčiny (bez Farmer / bez Field / bez Farmhouse / bez zásob) a vypnutého mlýna.
- Stav se vyřeší před 30s → žádné další upozornění.
- Dvě stejné budovy mají své issue IDs; Save/Load, pozadí, sezóny, 100+ budov, nezahlcené UI.
- Testy/build/browser PR dle pravidel.



---

## Úkol 5: C05_OVLADANI_JEDNOTEK.md

# C05 (Codex) — výběr jednotek myší a příkaz Move / Hold Position

**Větev:** `codex/unit-selection-move-hold`. Po C04 (technicky lze po C01, pokud nejsou konflikty).

## Interakce

Hráč může **kliknutím vybrat vlastní jednotku** a **tažením myši vybrat více vlastních jednotek** (drag selection box). Je-li vybrána jedna či více jednotek, pravým kliknutím na průchozí políčko mapy jim přikáže **Move Here**. Po dosažení cíle **zůstanou stát** v režimu `Hold Position` a automaticky se nerozejdou vykonávat původní práci, dokud hráč nezruší Hold / nedá `Resume Job`. Umožni i explicitní `Hold Here` bez přesunu a `Resume Previous Job` v panelu jednotky / kontextové nabídce. Zvol klávesu Escape k odznačení, ne k nucenému rušení všech úkolů.

## Integrace s existující AI

Jednotky mají stabilní jedinečný command state `Working / MovingToHold / Holding / Resuming` nebo kompatibilní stavy. Při příkazu zachovej přidělenou profesi, domov, mzdu a skilly; **bezpečně uvolni či pozastav pracovní rezervace, náklady, výrobu a stavební úkol**. Nesmí dojít ke zmizení/duplikaci surovin. Při `Resume Job` se vrací do aktuálního pracovního systému podle skutečného stavu, ne do neplatného starého tasku.

Výběr pouze vlastních jednotek podle aktuální viditelnosti; nepřátelské / neobjevené NPC a zvířata mimo dohled nevybírej. Pravé kliknutí nesmí nechtěně vyvolat browser context menu v herním viewportu. Výběrový obdélník, pozice a dest marker správně přepočítej při zoomu/posunu izometrické kamery. Zabraň kolizím při skupinovém cíli (rozmístit jednotky na sousední průchozí místa, žádný stack). Původní ovládání krále a klikání na budovy zachovej; zda král patří do box selection přizpůsob existující interakční architektuře a zdokumentuj.

## Testy

Jednotka dojde a stojí; tři vybrané dojdou bez překrývání; explicitní resume obnoví práci; nové zaměstnání neruší command state bez pravidla; C01 neznámá pole a FOW; zoom; boční panel; Save/Load hold state; úmrtí/emigrace; přeprava cargo; 100 jednotek bez nekonečného re-pathfindingu. Build/tests/PR dle pravidel.



---

## Úkol 6: C06_AUDIT_STAJI_VYZBROJE.md

# C06 (Codex) — audit stájí, koní a návrh jednotného systému vojenské výbavy

**Větev:** `codex/stables-equipment-contract`. Po C05. **Nejprve audit, teprve pak oprava.**

## Proč

Uživatel hlásí, že **Stables** v nabídce nejsou, přestože v dřívějším master plánu měly vzniknout. Neznamená to automaticky, že jsou rozbité: mohou být stále plánované na pozdější etapu, zamčené, skryté filtrem nebo nenasazené. Stejně ověř stav koní, Wheelwright, Horse Wagon, Iron Bars, Barracks a existujícího Equipment Systemu.

## Audit požadavků

Přečti aktuální `docs/UPGRADE_PROGRESS.md`, `docs/TASK_QUEUE.md`, `docs/COORDINATION.md`, Building Registry, Asset Registry, Save Schema, UI Buildings kategorizaci a definice; zjisti, zda etapy obsahující Stables a Wheelwright již byly dokončeny a začleněny do `main`. Ověř možnost stavby v běžné nové hře. Rozliš `not implemented yet`, `implemented but locked`, `implemented but missing from menu`, `regression`. Nepředstírej, že něco „zmizelo“, pokud to ještě nebylo implementováno. Pokud čeká v dosavadním master promptu, **nepředbíhej tuto etapu**, pouze zaznamenej stav a závislost; po jejím dokončení proveď cílený audit a opravu. Pokud je to skutečná regrese, oprav ji v tomto úkolu.

## Sjednocení vojenské výbavy pro C07/C08

Definuj centrální, rozšiřitelný **Equipment Registry** / existující model inventáře pro:
- `bow` (luk; výroba z Wood)
- `sword` (meč; výroba z Iron Bar)
- `armor` (kovové brnění; výroba z Iron Bar)
- `horse` (ochočené skutečné zvíře / mount, nikoli spotřebovávaný item)

Zachovej už existující King Sword/Armor/Treasure a výzbroj, nevytvářej duplicity ani nepřeváděj questové předměty bez potřeby. Definuj způsob, jakým se fyzicky vyrobené zbraně bezpečně přenesou ze skladu na jednotku, rezervují, vrátí nebo odloží po úmrtí. Formálně zapiš integrační kontrakt (IDs, equip slots, stat modifiers, 1 weapon per relevant role, ownership, unit type registry, horse reservation), který následné C07/C08 převezmou. Nepřidávej zatím armádu ani všechny nové výrobní budovy. Specifikace pro výtvarníka Claude musí uvádět ID, půdorys a potřebné ikonky; **Claude nereviduje mechanické registry**.

## Testování

Stáje existence/status pro novou hru i uložení; žádná duplicita stájí; koně dostupnost a současná rezervace; King vybavení nepoškodit; manifest budoucích itemů kompatibilní se starým Equipment Systemem; aktuální Save/Load. Audit se musí opírat o soubory a skutečný build, nikoli o předchozí prompt. PR + report a relevantní testy dle společných pravidel.



---

## Úkol 7: C07_VYROBNI_BUDOVY_ZBROJNICE.md

# C07 (Codex) — lukovýroba, mečařství, výroba brnění a zbrojnice

**Větev:** `codex/weapon-production-armory`. Po C06 a po dokončení/začlenění master etap pro Wood, Smelter/Iron Bars, fyzickou logistiku a případné Stables. Claude připravuje assety samostatně ve Studiu; **nečekej na jeho vizuály pro funkčnost mechanik** (použij nezaměnitelné dočasné existující vizuály a registruj hook pro schválený sprite).

## Budovy

Na základě skutečného Building Registry přidej pracovní budovy (doporučené parametry jsou **počáteční balance, změnitelné v datové konfiguraci**):

1. **Bowyer / Lukovýroba** — 2×2, 2 pracovníci `Bowyer`, výroba `Bow` z **8 Wood / 30 s**; stavební cena např. 8 Stone + 10 Wood.
2. **Swordsmith / Mečařství** — 2×2, 2 pracovníci `Swordsmith`, výroba `Sword` z **3 Iron Bar + 2 Wood / 45 s**; stavba např. 10 Stone + 8 Wood.
3. **Armorer / Zbrojířství** — 2×2, 2 pracovníci `Armorer`, výroba **kovového Armor** z **5 Iron Bar + 2 Wood / 60 s**; stavba např. 12 Stone + 10 Wood. Uživatel v tabulce psal „pláteník“, ale explicitně chce kovové brnění ze železných prutů; nepřidávej plátno, tkalcovství ani druhý nezávislý textile profession. Interní název `armorer`, české zobrazení `Zbrojíř`. Tento výklad krátce uveď v PR.
4. **Armory / Zbrojnice** — např. 3×3, 10 Stone + 12 Wood, **kapacita 40 jednotlivých kusů vybavení** Bow/Sword/Armor; není výrobní budovou. Má vlastní přístupný výdejní bod, fyzickou logistiku a inventář výstroje, není totéž jako Granary ani obecný Warehouse. Nevyžaduj falešné pracovní pozice, pokud je zbrojnice pasivní sklad; pokud lze efektivně využít existující Haulery, nepřidávej fiktivní profesi.

Ceny, časy, sloty a kapacity jsou návrhy ke zbalancování; pokud projekt má centralizovaný Balance Editor, zajisti skutečné napojení na registry. Výrobní vstupy i hotové výrobky jsou **fyzické**, nepřičítají se zdarma do centrálního inventory. Rozpracované práce, rezervace, přeprava, skladový limit, výroba přerušena kvůli nedostatku vstupů či zaměstnance, XP a mzdy dle existujícího Production/Job/Logistics Systemu. Jeden cyklus musí transakce provést právě jednou. Zapoj Resource Ledger pro materiálové vstupy/výstupy, nepočítej interní přesun jako příjem/výdaj. Bow/Sword/Armor jsou vybavení s kusovým množstvím a vlastnictvím, ne zaměnitelné přírodní suroviny.

## UI a plánování

Zaregistruj budovy do správné kategorie (Industry / Military podle aktuálních pravidel) a případného Building Unlock Manageru. Každá budova: Required Inputs, Process/Progress, Workers, Storage, Auto Production ON/OFF, bezpečné Cancel. Zbrojnice: skladová kapacita, seznam výzbroje, počet dostupných a rezervovaných předmětů. Předpokládej, že nové assety zatím čekají ve Studiu na schválení; produkční vizuály nesmíš tiše přepsat neschváleným návrhem.

## Kontrola

Vyrob skutečně 1 luk/1 meč/1 brnění, prokaž spotřebu Wood/Iron Bars a fyzické doručení do zbrojnice. Neúplné vstupy, dva současné výrobní úkoly, přesun vyrobené výzbroje, úmrtí pracovníka během práce, plná zbrojnice, zrušení výroby, Save/Load a testy aktuálního schématu. Building Bar / Asset Library / Auto Employment bez duplicit. Build/tests/smoke/PR dle pravidel.



---

## Úkol 8: C08_VOJSKA_VYCVIK_BOJ.md

# C08 (Codex) — lučištník, voják, šermíř, rytíř

**Větev:** `codex/military-units-recruitment`. Po C07, po stájích a stabilním kontraktu vybavení z C06. Zde jde o **herní mechaniky**, ne výtvarnou tvorbu jednotek: Claude dodá grafické varianty přes Asset Studio a čeká na schválení.

## Nové typy

Rozšiř existující Barracks, Soldiers/WorkerCombatSystem, Equipment System, stávající útok a pathfinding. Přidej čtyři smysluplně rozlišitelné typy:

| Typ | Předepsaná výbava | Role / chování |
|---|---|---|
| Archer (Lučištník) | Bow | střelba z dálky, fyzický/logický projektil, omezení dosahu a LoS, slabší v boji zblízka |
| Soldier (Voják) | Sword | základní pěchota, univerzální staty a nižší náklady |
| Swordsman (Šermíř) | Sword | zkušenější pěchota s lepší obranou/útokem, vyšší cena či doba výcviku; rozdíl oproti Soldier musí být herně poznat |
| Knight (Rytíř) | Sword + Armor + tamed Horse | silnější obrněná jízdní jednotka, rychlejší pohyb, vyšší výcvik/mzda; kůň je konkrétní zvíře, ne duplicitní spawn ani spotřební předmět |

Pokud chceš základní voják bez výzbroje, dej mu samostatný dočasný militia profil, ale neodstraň uživatelské zadání `Soldier → Sword`.

### Balancování

Vytvoř **centrální konfigurovatelná data** pro HP, DPS, armor, movement speed, attack range, cooldown, recruitment time, wages, skill requirements a recruitment cost. Odvoď výchozí návrhy ze stávajících statistik a napiš je do definic, ne do hardcoded UI; neuváděj vygenerované přesné hodnoty jako historicky dané. Knight vyžaduje dokončené dostupné Stables a rezervovatelného ochočeného koně, který nesmí být zároveň králův mount či zapřažený do wagon. Pokud chybí kůň, výcvik nespustí; při storno zruš rezervaci. Vojáci jsou jednotlivé trvalé entity s vlastními HP, skilly, vybavením a stavem.

## Výroba → zbrojnice → výcvik → výzbroj

Rekrutování probíhá přes existující Barracks (pokud není postavená, nejdřív postavit). Přidat seznam čtyř jednotek s náklady/výbavou, výcvik podle herního času, jednotky nevybavovat zdarma. Když je nedostatek Bow/Sword/Armor, ukaž přesně, co chybí; používej kusové rezervace a fyzické dodání z Armory, ne dvojí odečty. Při úmrtí, demobilizaci a přeřazení bezpečně vyřeš equip return/drop a uvolnění slotu; neopakuj spotřebu mezd či výrobu v Save/Load. Vojáci podléhají příkazům výběru / Move / Hold z C05. Dle existující hry mohou hlídkovat či bránit oblast, ale nesmí napadat vlastní obyvatelstvo. Lučištník musí respektovat line-of-sight, stromy a hradby, dosah a Fog of War; nesmí střílet do neviditelných nepřátel. Jezdec fyzicky sleduje platnou průchodnost.

## UI

Military/Barracks panel se čtyřmi kartami, ikonou výbavy, cenou, časem, počtem dostupných kitů a jasnými důvody blokace. Nezaváděj nové finální grafické assety bez schválení uživatele z Asset Studia; dočasné jasně označené fallbacky. Zachovej stávající King combat, auto regen, potraviny a Population sidebar.

## Testy

Rekrutace všech 4 tříd, přesný počet itemů a koní, dva souběžné výcviky/rezervace, výstroj při Save/Load, umírání a vybavení, střelba + LoS + FOW, Swordsman jiný než Soldier, Knight bez koně není možné rekrutovat, ruční Hold pohyb, 100 jednotek bez výrazného propadu výkonu, běžná AI ostatních NPC. Plný gate, PR, changelog, release dle pravidel.

