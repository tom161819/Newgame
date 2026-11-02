krok 17	"Upgrade hry – Blueprinty a skutečná výstavba budov

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o systém postupné výstavby budov.

Cílem je, aby se budovy po umístění nepostavily okamžitě. Nejprve vznikne průhledný blueprint a stavitelé musí fyzicky dojít na staveniště a dokončit výstavbu.

Pokud není k dispozici žádný stavitel, může budovy stavět král.

Zachovej všechny existující funkce, zejména mapu 100 × 100, osmisměrný pohyb, inventář, ekonomiku, profese, individuální skilly, pracovní AI, Fog of War, vyšlapávání cest a Save/Load.

Nezakládej nový projekt. Nejdříve prozkoumej existující architekturu a přizpůsob jí implementaci.

1. Blueprint – umístění budovy

Uprav současný systém stavění.

Po výběru budovy v nabídce Buildings:

Hráč zvolí místo na mapě.

Zobrazí se průhledný náhled budovy.

Zeleně se označí platné umístění.

Červeně se označí neplatné umístění.

Po potvrzení vznikne trvalý blueprint na mapě.

Budova ještě není funkční.

Blueprint musí:

Zachovat skutečný půdorys budovy.

Respektovat izometrickou mřížku.

Obsazovat příslušná políčka mapy.

Blokovat stavění dalších budov na stejném místě.

Být zobrazený například s průhledností 40 %.

Mít viditelný ukazatel postupu stavby.

Blueprint je samostatná instance staveniště s vlastním ID.

2. Stavební materiál

Cena budovy se odečte při vytvoření blueprintu.

Pokud hráč nemá dostatek surovin, blueprint nelze umístit.

Například:

Castle: 10 Stone.

Tower: 10 Stone.

Wall: 1 Stone za segment.

House: 5 Stone.

Quarry: 15 Stone.

Hunting Lodge: 10 Stone.

Barracks: 20 Stone.

Používej ceny z Object Registry. Nevytvářej duplicitní ceník.

Materiál je po vytvoření blueprintu rezervován pro stavbu.

Pokud je blueprint zrušen před zahájením stavby, vrať všechny vložené suroviny.

Pokud už stavba začala, zatím vracej 50 % původní ceny, zaokrouhleno dolů.

3. Průběh stavby

Každá budova bude mít:

constructionTime – základní dobu výstavby.

constructionProgress – aktuální postup 0–100 %.

constructionState – plánovaná, rozestavěná, dokončená.

assignedBuilders – seznam pracujících stavitelů.

Základní doby výstavby pro Construction Level 1:

Wall: 5 sekund.

House: 15 sekund.

Tower: 20 sekund.

Castle: 45 sekund.

Hunting Lodge: 25 sekund.

Quarry: 30 sekund.

Barracks: 40 sekund.

U ostatních již existujících budov použij rozumné výchozí hodnoty.

Doby stavby musí být definované v Object Registry.

Při dokončení stavby:

Blueprint se změní na hotovou budovu.

Aktivují se její herní funkce.

Aktualizuje se pathfinding.

Aktualizuje se grafika.

Stavitelé uvolní pracovní úkol.

Přidělí se Construction XP.

Nedokončené budovy nesmí poskytovat své funkce. Například nedokončený hrad negeneruje Gold a nedokončený dům neposkytuje bydlení.

4. Automatická práce stavitelů

Poddaní s profesí Builder automaticky vyhledávají dostupná staveniště.

Postup:

Stavitel vyhledá nejbližší dostupný blueprint.

Rezervuje si pracovní místo na staveništi.

Dojde k dostupnému sousednímu políčku.

Začne stavět.

Postupně zvyšuje constructionProgress.

Po dokončení získá Construction XP.

Vyhledá další staveniště.

Stavitel musí skutečně fyzicky dojít na místo.

Pokud není možné staveniště dosáhnout, označ ho jako nedostupné a nevytvářej nekonečné pokusy o cestu.

Staveniště mohou mít maximálně 3 současně pracující stavitele.

Jednoho stavitele nelze přiřadit k více staveništím současně.

5. Rychlost stavění podle skillu

Použij existující Construction skill.

Rychlost stavění:

BuildSpeed = BaseBuildSpeed × (1 + (ConstructionLevel - 1) × 0.01)

Příklady:

Level 1: 100 % rychlosti.

Level 10: 109 % rychlosti.

Level 25: 124 % rychlosti.

Level 50: 149 % rychlosti.

Při práci více stavitelů se jejich rychlosti sčítají.

Příklad:

Budova má základní dobu výstavby 30 sekund.

Jeden stavitel Level 1 ji postaví za 30 sekund.

Dva stavitelé Level 1 ji dokončí přibližně za 15 sekund.

Tři stavitelé Level 1 přibližně za 10 sekund.

Započítávej pouze skutečnou dobu práce na staveništi, nikoliv dobu chůze k němu.

Výpočet musí být nezávislý na FPS.

6. Stavění králem

Král může stavět budovy stejně jako poddaní.

Chování:

Pokud je staveniště bez dostupného stavitele, král ho může postavit.

Kliknutím na blueprint král dostane příkaz dojít ke staveništi.

Pokud je na koni, automaticky sesedne.

Po dosažení staveniště začne stavět.

Použije svůj vlastní Construction skill.

Získává Construction XP za skutečně vykonanou práci.

Pokud hráč klikne na jiný cíl, král přestane stavět.

Rozpracovaný postup stavby zůstane zachovaný.

Později může král pokračovat.

Pokud už na staveništi pracují stavitelé a je volná kapacita, může se král přidat a pomoci.

Pokud je kapacita plná, zobraz informaci, že na staveništi není volné pracovní místo.

Král nesmí stavět vzdáleně ani automaticky teleportovat na staveniště.

7. Stavění hradeb tažením

Zachovej současný systém tažení hradeb myší.

Po potvrzení celé linie:

Vznikne blueprint každého segmentu.

Materiál se odečte podle počtu segmentů.

Každý segment má vlastní postup stavby.

Stavitelé mohou postupně stavět jednotlivé segmenty.

Král může stavět jednotlivé segmenty kliknutím.

Hotové segmenty se automaticky graficky propojují se sousedními.

Zabraň duplicitnímu účtování stavebního materiálu.

Nedokončené segmenty nesmí poskytovat bonus výhledu ani možnost chůze po hradbách.

8. Vizuální postup stavby

Každé staveniště bude mít několik vizuálních fází:

0 % – průhledný blueprint.

1–33 % – základy budovy.

34–66 % – částečně postavená konstrukce.

67–99 % – téměř hotová budova.

100 % – hotová budova.

Použij jednoduchou procedurální grafiku nebo existující sprity s vrstvami.

Pokud nejsou dostupné odpovídající obrázky, vytvoř provizorní vizuální fáze.

Zachovej správné izometrické vykreslování a pořadí překrývání objektů.

9. Informační panel staveniště

Po kliknutí na blueprint zobraz:

Název budovy.

Procento dokončení.

Aktuální stavební fázi.

Počet pracujících stavitelů.

Odhad zbývajícího času podle aktuální rychlosti.

Tlačítko Cancel Construction.

Pokud je vybrán král, umožni zahájit práci na staveništi.

Pokud král právě staví, zobraz jeho aktuální pracovní úkol.

10. XP za stavění

Použij existující Experience System.

Construction XP přiděluj podle skutečně vykonané práce.

Pokud na budově pracují dva stavitelé a král, XP rozděl podle jejich skutečného příspěvku k constructionProgress.

Celkový součet udělených Construction XP za dokončenou budovu musí odpovídat existující XP odměně za daný typ stavby.

Zamez tomu, aby jedna budova poskytovala opakovaně XP při každém obnovení pracovní akce.

Při zrušení nedokončené stavby se zatím nepřidělují XP.

11. Save / Load

Rozšiř existující systém ukládání.

U každého staveniště ukládej:

ID a typ budovy.

Pozici a rozměry.

ConstructionProgress.

ConstructionState.

Vložené suroviny.

Příspěvky jednotlivých stavitelů.

Potřebné informace pro pokračování výstavby.

Po načtení:

Obnov všechny blueprinty.

Obnov průběh stavby.

Bezpečně znovu přiřaď dostupné pracovníky.

Zachovej vložený materiál.

Nevytvářej duplicitní budovy.

Neodečítej materiál opakovaně.

Starší uložené hry musí zůstat kompatibilní.

12. Architektura

Vytvoř nebo rozšiř:

ConstructionSystem

ConstructionSite

BuilderAI

ConstructionProgress

ConstructionUI

Přizpůsob názvy současnému projektu.

Důsledně odděl:

Umístění blueprintu.

Rezervaci materiálu.

Fyzickou práci stavitelů.

Dokončení stavby.

Aktivaci funkcí budovy.

Zabraň vzniku duplicitního systému staveb nebo pathfindingu.

13. Testování

Před většími úpravami vytvoř Git commit.

Ověř:

Budova po umístění vznikne jako průhledný blueprint.

Materiál se odečte pouze jednou.

Stavitelé automaticky vyhledávají dostupné staveniště.

Stavitel musí fyzicky dojít na místo.

Král může stavět, pokud nejsou stavitelé.

Král může pomáhat dostupným stavitelům.

Rychlost stavění odpovídá Construction skillu.

Více stavitelů urychluje stavbu.

Rozestavěné budovy neprodukují suroviny ani jiné bonusy.

Po dokončení se aktivují všechny funkce budovy.

Hradby lze stavět tažením jako jednotlivé segmenty.

Rozestavěnou stavbu lze zrušit.

XP se správně rozdělí podle skutečné práce.

Save/Load obnovuje nedokončené stavby.

Stávající herní mechaniky zůstávají funkční.

Prioritou je stabilní, univerzální a rozšiřitelný systém výstavby, který budou moci v budoucnu využívat další typy budov."