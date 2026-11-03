# ETAPA 11/15 – původní krok 37: Stone Pavement & Courtyards

**Milník:** M3. **Důležitá úprava:** Infrastructure → Stone Pavement, cestovní bonus +25 %, 1 Stone na 2 nové tiles za stavební objednávku.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

# Medieval Kingdom – Upgrade: Stone Pavement, Roads & Courtyards

Rozšiř stávající izometrickou 2.5D strategii Medieval Kingdom o možnost stavět trvalé dlážděné cesty a zpevněné plochy.

**Hlavní cíl:** Hráč může pomocí kamene vytvářet dlážděné cesty, nádvoří a náměstí. Dláždění zvyšuje rychlost pohybu jednotek a zlepšuje logistiku království.

Nezakládej nový projekt. Nejprve analyzuj existující Buildings Menu, Building Registry, Blueprint System, Construction System, Logistics, Pathfinding, Path Wear System, Isometric Renderer a Save/Load.

Zachovej současné herní mechaniky.

## 1. Nová stavba – Stone Pavement

Přidej:

- ID: `stone_pavement`
- Name: Stone Pavement
- Czech Name: Dlážděná cesta
- Category: Infrastructure
- Size: 1×1 tile
- Construction Cost: 1 Stone za každá 2 nově dlážděná políčka, zaokrouhleno nahoru na úroveň jedné stavební objednávky
- Movement Speed Bonus: +25 %
- Durability: Permanent

Stone Pavement není klasická neprůchozí budova.

Jedná se o speciální povrchovou vrstvu terénu.

Dlážděná políčka musí zůstat průchozí pro pěší jednotky, koně, trakaře a povozy, pokud je dané místo jinak průchozí.

## 2. Nová kategorie Infrastructure

Do Buildings Menu přidej kategorii:

`Infrastructure`

Ikona: cesta nebo kamenná dlažba.

Zařaď sem Stone Pavement.

Do budoucna připrav možnost přidat:
- Dirt Road
- Stone Road
- Bridge
- Town Square

Tyto další typy zatím neimplementuj.

Záložka All musí obsahovat také Stone Pavement.

## 3. Tři způsoby stavění

Implementuj tři režimy pokládání dlažby.

### Single Tile

Kliknutím umísti jedno dlážděné políčko.

### Line Mode

Klikni na počáteční políčko a tažením myši vytvoř souvislou cestu.

Cesta se zobrazuje jako náhled během tažení.

Po uvolnění tlačítka myši se vytvoří stavební plán celé cesty.

Podporuj vodorovné, svislé i diagonální linie v souřadnicích herní mřížky.

### Area Mode

Klikni a tažením označ obdélníkovou oblast.

Po uvolnění tlačítka myši vytvoř stavební plán všech platných políček ve výběru.

Tento režim slouží zejména pro:
- Hradní nádvoří.
- Náměstí.
- Prostory kolem skladů.
- Prostory mezi budovami.
- Větší logistické plochy.

V panelu stavby přidej přepínače:

`Single | Line | Area`

Výchozí režim: Line.

## 4. Stavební náhled

Před potvrzením umístění zobraz průhledný náhled dlažby.

Barvy:
- Zelená – platné nové políčko.
- Červená – neplatné políčko.
- Neutrální – políčko je již vydlážděné.

V průběhu výběru zobraz:
- Počet nových políček.
- Potřebné množství Stone.
- Počet neplatných políček.

Cena se počítá pouze z nových platných políček.

Při výběru 20 nových políček:

`Cost: 10 Stone`

Při výběru 25 nových políček:

`Cost: 13 Stone`

Pokud není dostatek dostupného kamene, nedovol potvrdit celou objednávku a zobraz důvod.

Po dokončení výběru vytvoř jeden stavební projekt s individuálními políčky, aby bylo možné správně evidovat cenu, průběh výstavby a případné zrušení.

## 5. Pravidla umístění

Dlažbu lze pokládat na:
- Travnatý terén.
- Přirozeně vyšlapané cesty.
- Další vhodný průchozí terén.

Nelze ji pokládat na:
- Neprůchozí skály.
- Stromy.
- Vodní plochy.
- Stávající neprůchozí budovy.
- Železná a kamenná ložiska.
- Jiná neplatná stavební místa.

Dlažba nesmí blokovat vstupy do budov.

Pokud se přes vydlážděné políčko později postaví jiná budova, nesmí se dlažba vykreslovat přes její podlahu nebo konstrukci.

Zachovej původní terénní informace, aby odstranění budovy nebo dlažby nepoškodilo mapu.

## 6. Stavba pomocí Builderů

Napoj Stone Pavement na existující Blueprint a Construction System.

Po umístění:
1. Vytvoř stavební plán.
2. Rezervuj potřebný Stone.
3. Nosiči fyzicky doručí materiál na staveniště.
4. Stavitelé přicházejí k jednotlivým políčkům.
5. Postupně dokončují dlažbu.
6. Hotová políčka získají finální texturu a rychlostní bonus.

Základní čas výstavby:
- 2 sekundy aktivní práce na jedno políčko.

Construction Skill ovlivňuje rychlost práce podle současných pravidel.

Král může stavět dlažbu ručně podle existující mechaniky stavění.

Pokud je celá dlažba zadána jako jeden dlouhý projekt, umožni více stavitelům pracovat na různých políčkách současně, aniž by vytvářeli duplicitní stavbu.

Nedovol automaticky dokončit všechna políčka okamžitě po zadání.

Pokud současná architektura podporuje jen jednotlivé blueprinty, vytvoř nad nimi společnou stavební objednávku.

Dodrž stávající pravidla vracení materiálu při zrušení stavby.

## 7. Rychlost pohybu

Stone Pavement poskytuje:

`Movement Speed +25 %`

Bonus platí pro:
- King
- Villagers
- Workers
- Soldiers
- Hunters
- Haulers
- Horses
- Wheelbarrows
- Horse Wagons

Pokud má některý typ jednotky vlastní rychlostní pravidla, zachovej je a použij bonus jako násobič rychlosti pohybu po dlážděném terénu.

Příklad:

Základní rychlost jednotky = 100 %

Pohyb po Stone Pavement = 125 %

Dlážděná cesta musí mít vyšší dopravní výhodu než přirozeně vyšlapaná cesta třetí úrovně, která má nyní bonus +15 %.

## 8. Integrace s vyšlapanými cestami

Zachovej existující Path Wear System.

Přirozené cesty mají dosavadní bonusy:
- Level 0: +0 %
- Level 1: +5 %
- Level 2: +10 %
- Level 3: +15 %

Stone Pavement:
- +25 %
- Trvalý povrch.
- Nezarůstá.
- Nevyžaduje opakované vyšlapávání.

Pokud je na políčku dlažba, bonus Path Wear a Stone Pavement se nesčítá.

Použij bonus dlažby.

Původní hodnotu Path Wear můžeš zachovat pod dlažbou pro případ jejího odstranění, ale nesmí to vytvářet další rychlostní bonus.

## 9. Inteligentní Pathfinding

Uprav existující A* Pathfinding tak, aby zohledňoval rychlost jednotlivých typů povrchu.

Jednotky mají při výběru trasy preferovat rychlejší cestu, ne vždy pouze geometricky nejkratší.

Příklad:

Trasa A:
- 20 políček po trávě.

Trasa B:
- 22 políček po dlážděné cestě.

Jednotka může upřednostnit trasu B, pokud skutečný odhad doby přesunu vychází lépe.

Použij časovou cenu pohybu:

`Movement Cost = Distance / Effective Movement Speed`

Zachovej:
- Osmisměrný pohyb.
- Diagonální náklady.
- Zákaz procházení neprůchozími rohy.
- Kolize budov.
- Specifické požadavky pro povozy.

Dlažba nesmí způsobovat nekonečné přepočítávání tras.

Pokud se cesta dostaví během pohybu jednotky, novou trasu vyhodnoť až při vhodné aktualizaci, ne každý snímek.

## 10. Grafické provedení

Vytvoř kvalitní izometrickou texturu kamenné dlažby odpovídající středověkému prostředí.

Požadavky:
- Nepravidelné kamenné kostky.
- Jemné spáry.
- Tlumené šedé a přírodní barvy.
- Vzhled odpovídající ostatním herním assetům.
- Bez výrazných mezer mezi jednotlivými dlaždicemi.

Dláždění musí tvořit souvislou plochu.

Při spojení několika políček nesmí být vidět rušivé opakování identické textury.

Zohledni:
- Rovné úseky cest.
- Zatáčky.
- Křižovatky.
- Okraje dlážděné plochy.
- Velká nádvoří.

Použij autotiling nebo jiný vhodný systém pro plynulé spojování textur.

Při dokončení sousedního políčka aktualizuj potřebné okrajové textury.

Dlažba musí být vykreslena nad terénem, ale pod postavami, budovami a objekty.

## 11. Odstranění dlažby

Po kliknutí na hotové dlážděné políčko umožni:

`Remove Pavement`

Přidej také režim odstranění větší vybrané oblasti.

Po odstranění:
- Obnov původní viditelný povrch terénu.
- Zruš bonus rychlosti.
- Aktualizuj Pathfinding.
- Zachovej ostatní objekty.

Za odstranění hotové dlažby se materiál automaticky nevrací.

U nedokončených blueprintů používej existující pravidla storna a refundace.

## 12. Fog of War

Stone Pavement musí respektovat aktuální:
- Circular Fog of War.
- Exploration Mode.
- Map Memory.

V aktuálně viditelné oblasti zobraz skutečný stav dlažby.

V prozkoumané, ale momentálně neviditelné oblasti zobraz poslední známý stav.

Pokud je dlažba postavena nebo odstraněna mimo dohled, nesmí se tato změna zobrazit, dokud hráč oblast znovu neuvidí.

Neprozkoumaná oblast zůstává černá.

## 13. Asset Library

Přidej Stone Pavement do centrální Asset Library.

Definuj:
- ID
- Category
- Construction Cost
- Movement Speed Bonus
- Tile Type
- Texture Variants
- Construction State

Dláždění musí být snadno rozšiřitelné o jiné typy povrchů.

Nevytvářej samostatnou nezávislou databázi terénu, pokud už vhodný systém existuje.

## 14. Save / Load

Ukládej:
- Všechna vydlážděná políčka.
- Jejich pozice.
- Rozpracované stavební projekty.
- Rezervovaný a doručený materiál.
- Stavební progress jednotlivých políček.
- Informace potřebné pro správné obnovení terénu.

Po načtení:
- Dlažba zůstane na stejných místech.
- Rychlostní bonus funguje.
- Pathfinding používá správné náklady.
- Nedokončené projekty pokračují.
- Nedojde k duplicitní spotřebě kamene.
- Map Memory zachová poslední známý stav.

Zachovej kompatibilitu starších save souborů.

## 15. Výkon

Hra používá mapu 100×100 políček.

Stone Pavement implementuj jako efektivní terénní vrstvu, nikoliv jako tisíce samostatných plnohodnotných budov s vlastní AI a časovači.

Optimalizuj:
- Renderování dlažby.
- Aktualizaci sousedních textur.
- Hromadné stavební objednávky.
- Přepočítávání Pathfindingu.
- Fog of War.
- Save/Load.

Počítej s možností vydláždit stovky až tisíce políček bez výrazného poklesu FPS.

## 16. Testování

Ověř:

1. Stone Pavement je dostupné v Buildings → Infrastructure.
2. Funguje stavba jednoho políčka.
3. Funguje stavba cesty tažením myši.
4. Funguje označení celé obdélníkové plochy.
5. Cena se správně vypočítává.
6. Již vydlážděná políčka se neplatí znovu.
7. Dlažba nezablokuje pohyb.
8. Stavitelé fyzicky dokončují dlažbu.
9. Nosiči doručují materiál.
10. Král může dlažbu stavět.
11. Rychlost pohybu se zvýší o 25 %.
12. Bonus se nesčítá s Path Wear.
13. Pathfinding preferuje rychlejší dlážděné trasy.
14. Povozy a trakaře mohou používat dlažbu.
15. Textury se správně spojují.
16. Dláždění nádvoří funguje i pro velké plochy.
17. Dlažbu lze odstranit.
18. Fog of War zachovává poslední známý stav dlažby.
19. Save/Load správně obnovuje hotové i rozestavěné plochy.
20. Hra zůstává plynulá při velkém Zoom Out.

## 17. Implementace

Rozděl upgrade do čtyř fází:

**Phase A – Pavement Terrain Layer**
Nový typ terénu, grafika a průchodnost.

**Phase B – Construction Tools**
Single, Line a Area režimy, stavební projekty a logistika.

**Phase C – Movement & Pathfinding**
Rychlostní bonusy, integrace s vyšlapanými cestami a optimalizace tras.

**Phase D – Integration**
Fog of War, Save/Load, Asset Library, odstranění dlažby a testování.

Před úpravami vytvoř bezpečný Git commit.

Po dokončení přidej skutečně implementované změny do sekce Unreleased v CHANGELOG.md.

Nevydávej automaticky novou verzi hry.

Prioritou je pohodlné budování dlouhých cest a větších dlážděných ploch, které budou skutečně zlepšovat rychlost pohybu a logistiku království.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

