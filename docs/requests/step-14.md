krok 14	"Upgrade hry – Individuální skilly a profese poddaných

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o systém individuálních dovedností a přiřazování práce obyvatelům.

Cílem je, aby každá lidská postava měla vlastní skilly s levely 1–50, ale současně vykonávala maximálně jednu přiřazenou práci.

Navazuj na existující systém celkových XP a levelů postav. Zachovej všechny dosavadní herní mechaniky včetně migrace, populace, inventáře, budov, herního času, Fog of War a Save/Load.

1. Individuální dovednosti postav

Každá lidská postava bude mít následující skilly:

Woodcutting

Mining

Hunting

Construction

Farming

Combat

Každý skill má vlastní:

level (1–50)

currentXP

totalXP

xpToNextLevel

Všechny skilly začínají na levelu 1 s 0 XP.

Použij stejný vzorec pro požadované XP jako u existujícího celkového levelování.

Zachovej samostatný celkový level postavy.

XP získané za vykonanou práci se připisují do příslušného skillu i do celkových XP postavy.

Při změně profese se již získané zkušenosti nemažou.

2. Systém profesí

Každý poddaný může mít právě jednu aktivní profesi.

Možné stavy:

idle – bez přiřazené práce.

woodcutter

miner

hunter

builder

farmer

soldier

Postava nesmí současně vykonávat dvě různé práce.

Při změně profese:

Ukonči aktuální pracovní úkol.

Bezpečně zruš jeho rezervace a cíle.

Přiřaď novou profesi.

Zachovej všechny získané skilly a XP.

Zahaj chování odpovídající nové profesi.

Změna profese je prozatím okamžitá a bez poplatku.

Pokud je postava mrtvá, nelze jí práci přiřazovat.

3. Pracovní chování

Implementuj skutečné vykonávání práce pouze u profesí, pro které již existují potřebné herní objekty a mechaniky.

Miner

Vyhledává dostupné kameny v okolí osady.

Automaticky k nim dojde.

Sebere kámen.

Surovina se přidá do společného inventáře království.

Za úspěšné sebrání získá Mining XP a celkové XP.

Nesmí rezervovat kámen, který už sbírá jiný pracovník.

Hunter

Vyhledává dostupná lovitelná zvířata.

Používá existující Combat System.

Zvíře pronásleduje a útočí na něj.

Po zabití sebere dropované maso.

Maso přidá do společného inventáře.

Získá Hunting XP a celkové XP.

Respektuje vlastní HP, DPS a Armor.

Pokud má málo HP, přeruší lov a vrátí se do bezpečí.

Builder

Připrav systém pracovních úkolů pro stavění.

Pokud současná hra staví budovy okamžitě, zachovej tuto mechaniku a nevytvářej nefunkční pracovní úkoly.

Připrav rozhraní pro pozdější systém výstavby, ve kterém stavitelé skutečně docházejí na staveniště a postupně budovu dokončují.

XP za stavbu přiděluj pouze skutečnému vykonavateli, pokud jej systém dokáže určit.

Woodcutter a Farmer

Připrav jejich definice, statistiky a pracovní stavy.

Pokud ve hře zatím nejsou stromy určené k těžbě nebo farmy, nespouštěj fiktivní produkci surovin.

Zobraz stav Waiting for workplace.

Soldier

Připrav profesi vojáka.

Využívej stávající Combat System.

Zatím neimplementuj automatické napadání neutrálních zvířat ani nepřátelské armády.

Bojové XP získává pouze za skutečné souboje.

4. Vliv skillů na efektivitu

Zaveď jednoduchý bonus podle úrovně dovednosti.

Každý level nad 1 zvýší efektivitu dané činnosti o 1 %.

Vzorec:

SkillEfficiency = 1 + (SkillLevel - 1) × 0.01

Příklady:

Level 1: 100 % efektivity.

Level 10: 109 % efektivity.

Level 25: 124 % efektivity.

Level 50: 149 % efektivity.

U těžby a stavění bonus použij na rychlost práce, pokud je daná činnost časově simulovaná.

U lovu a boje použij odpovídající bonus na DPS, nikoliv na rychlost pohybu.

Nezvyšuj automaticky množství získaných surovin za jednu akci.

Bonus aplikuj pouze na příslušnou pracovní činnost a nepřepisuj základní statistiky postavy.

5. Přiřazování práce

Po kliknutí na vlastního poddaného otevři jeho informační panel.

Panel bude obsahovat:

Jméno postavy.

Celkový level a XP.

HP, DPS a Armor.

Aktuální profesi.

Seznam všech skillů a jejich levelů.

Aktuální pracovní úkol.

Rozbalovací nabídku Assign Job.

V nabídce bude možné zvolit:

Unemployed

Woodcutter

Miner

Hunter

Builder

Farmer

Soldier

Po změně profese se aktualizuje chování postavy.

Zajisti, aby kliknutí na panel neovlivňovalo pohyb krále.

6. Automatické vykonávání úkolů

Každý pracující poddaný má vlastní pracovní AI.

Základní stavový automat:

Idle

Searching for Work

Moving to Target

Working

Returning

Waiting

Fleeing / Recovering

Pracovní AI musí:

Respektovat existující pathfinding a překážky.

Zabraňovat více pracovníkům rezervovat stejný cíl.

Zrušit úkol při změně profese.

Neprovádět práci na zaniklém objektu.

Nevytvářet duplicity surovin ani XP.

Zohledňovat smrt postavy.

Každý pracovník musí zůstávat fyzickou postavou na mapě.

7. Příprava na pracovní budovy

Navrhni rozšiřitelný systém, aby některé profese v budoucnu vyžadovaly pracovní budovy.

Například:

Woodcutter → Lumberjack Hut.

Miner → Quarry.

Hunter → Hunting Lodge.

Farmer → Farm.

Soldier → Barracks.

Zatím pro Miner a Hunter umožni práci bez samostatné pracovní budovy, aby bylo možné nové funkce otestovat.

Později bude možné tyto profese navázat na konkrétní pracoviště.

8. Skill XP

Použij stávající centrální Experience System.

Při dokončení činnosti přidej zkušenosti příslušnému skillu.

Počáteční XP:

Sebrání kamene: +3 Mining XP.

Ulovení zajíce: +10 Hunting XP.

Ulovení srny: +20 Hunting XP.

Ulovení divočáka: +35 Hunting XP.

Dokončení stavby: Construction XP podle typu budovy.

Úspěšný bojový zásah: Combat XP podle skutečně způsobeného poškození, s rozumným limitem.

Zabraň duplicitnímu přidělování XP mezi Combat, Hunting a celkovým levelem.

Celkové XP se za jednu činnost připisují pouze jednou, i když se zvýší více skillů.

XP za pouhé čekání nebo pohyb neuděluj.

9. Save / Load

Rozšiř existující systém ukládání.

U každého poddaného ukládej:

Všechny skilly a jejich XP.

Celkový level.

Aktuální profesi.

Aktuální pracovní stav.

Přiřazené pracoviště.

Potřebné informace pro obnovení pracovního úkolu.

Po načtení obnov pracovní AI bez duplicitních úkolů, surovin nebo XP.

Zachovej kompatibilitu starších uložených her pomocí bezpečných výchozích hodnot.

10. Asset Library a architektura

Rozšiř definice lidských postav o:

Dostupné profese.

Individuální skilly.

Pracovní efektivitu.

Příslušné pracovní chování.

Vytvoř nebo rozšiř:

SkillSystem

JobSystem

WorkerAI

TaskReservationSystem

Nevytvářej duplicitní inventáře nebo další systém levelování.

Všechny hodnoty musí být centrálně konfigurovatelné.

11. Testování

Před úpravami vytvoř Git commit.

Ověř:

Každá lidská postava má vlastní skilly 1–50.

Každý poddaný má maximálně jednu aktivní profesi.

Změna profese zachovává XP.

Horník automaticky sbírá dostupné kameny.

Lovec dokáže ulovit zvíře a sebrat maso.

Dva pracovníci nesbírají stejný objekt.

Skill level správně ovlivňuje efektivitu.

Celkové XP se nepočítají duplicitně.

Pracovní AI funguje při Fog of War.

Save/Load zachovává skilly, profese a pracovní stavy.

Původní herní funkce zůstávají funkční.

Nepřidávej další budovy ani nové suroviny. Zaměř se na spolehlivou správu profesí, individuální rozvoj postav a funkční pracovní AI."