# ETAPA 04/15 – původní krok 28: Circular Fog of War & Map Memory

**Milník:** M1. **Důležitá úprava:** Jediná autoritativní viditelnost: unexplored/explored visible; poslední známé statické objekty, ne live informace.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Circular Fog of War, Exploration & Persistent Map Memory

Uprav stávající systém Fog of War v izometrické 2.5D hře Medieval Kingdom.

Cílem je nahradit současný čtvercový dohled kruhovým, vytvořit výraznější tmavě šedou mlhu a přidat skutečné prozkoumávání mapy s pamětí naposledy viděných objektů.

Nezakládej nový projekt. Nejprve analyzuj aktuální implementaci Fog of War, renderování izometrické mapy, objektů, kameru, UI nastavení, New Game Setup a Save/Load.

Zachovej všechny ostatní herní mechaniky.

1. Kruhový Fog of War

Současný čtvercový dohled změň na kruhový.

Viditelnost vyhodnocuj podle skutečné vzdálenosti od zdroje vidění:

distance² = dx² + dy²

Políčko je viditelné, pokud:

distance² <= radius²

Používej souřadnice herní mřížky, nikoliv obdélníkovou oblast na obrazovce.

Kruh musí zůstat geometricky správný také v izometrickém zobrazení.

Kruhový dohled musí fungovat při pohybu krále a všech změnách jeho View Range.

Zachovej existující bonusy dohledu:

King: základní dohled.

Mounted King: +50 %.

Tower: +100 %.

Castle: +75 %.

Walls: +75 % při odpovídajícím využití.

Respektuj stávající pravidla aktivace výhledu z budov.

Pokud nyní král vidí 20×20 políček, převeď hodnotu na přibližně 10 políček poloměru a odpovídajícím způsobem použij existující násobiče.

Nesmí dojít k nechtěnému výraznému zvýšení nebo snížení dosahu.

2. Tři stavy viditelnosti

Každé políčko mapy musí podporovat tři stavy:

UNEXPLORED

Hráč políčko nikdy neviděl.

Pokud je Exploration ON, oblast je úplně černá.

Terén a objekty nejsou viditelné.

Nejsou vidět žádné jednotky ani efekty.

Hráč nezná obsah této oblasti.

EXPLORED

Hráč již políčko viděl, ale momentálně není v dohledu žádného aktivního zdroje vidění.

Terén je viditelný ve výrazně tmavším, zašedlém provedení.

Pevné objekty zůstávají zobrazené v posledním známém stavu.

Pohybující se jednotky nejsou viditelné.

Informace se neaktualizují, dokud se oblast znovu nedostane do dohledu.

VISIBLE

Políčko je aktuálně v dohledu.

Terén má normální barvy.

Objekty jsou vykreslovány normálně.

Jednotky a zvířata jsou viditelné.

Hráč vidí aktuální stav světa.

Paměť prozkoumané oblasti se aktualizuje.

Odděl trvalý stav explored od dočasného stavu currentlyVisible.

Nevytvářej pouze jednu boolean hodnotu, která by nedokázala rozlišit prozkoumané a aktuálně viditelné oblasti.

3. Tmavší a výraznější mlha

Současnou mlhu uprav tak, aby byla výrazně tmavší.

Pro EXPLORED oblasti použij například:

Tmavě šedé až černošedé zabarvení.

Přibližně 65–75% ztmavení.

Výrazné snížení saturace.

Zachování rozpoznatelnosti terénu a budov.

Hodnoty implementuj jako konfigurovatelné parametry.

V oblasti VISIBLE musí být grafika normální, bez ztmavení.

Mezi viditelnou a prozkoumanou oblastí vytvoř jemný přechod, aby hranice nebyla nepříjemně ostrá.

Přechod může být vizuálně změkčený přibližně přes okraj jednoho políčka.

Samotná herní viditelnost ale musí respektovat přesný kruhový radius.

Vizuální přechod nesmí prozrazovat skryté objekty mimo skutečný dohled.

4. Paměť pevných objektů – Persistent Object Memory

Toto je zásadní část úpravy.

Pevné objekty, které hráč již jednou objevil, NESMÍ po opuštění View Range zmizet.

Podporuj zejména:

Trees

Stumps

Stones

Stone Deposits

Iron Deposits

Rocks

Buildings

Walls

Farms

Orchards

Fields

Other static world objects

Jakmile je objekt poprvé spatřen, uloží se jeho poslední viditelný stav do paměti mapy.

Pokud objekt následně opustí dohled hráče:

Zůstane vykreslený.

Bude výrazně zašedlý.

Jeho vzhled se přestane aktualizovat.

Zůstane na poslední známé pozici.

Příklad:

Král objeví dospělý dub.

Potom odejde a dub se dostane mimo View Range.

Dub zůstane viditelný jako zašedlý dospělý strom.

Mezitím jej dřevorubec pokácí.

V herní simulaci strom skutečně zmizí a vznikne pařez, ale na prozkoumané mapě hráč stále vidí poslední známý dospělý dub.

Teprve když se král vrátí do oblasti, zjistí, že strom byl pokácen, a paměť se aktualizuje na pařez.

Stejné pravidlo platí pro:

Nově postavené budovy.

Zbourané budovy.

Vytěžená ložiska.

Rostoucí stromy.

Změněné fáze obilných polí.

Ostatní statické objekty.

Pokud byla budova postavena v prozkoumané oblasti mimo aktuální dohled, nesmí se její nový vzhled automaticky objevit v paměti mapy.

5. Oddělení skutečného světa a paměti hráče

Vytvoř samostatný systém Map Memory.

Skutečný herní svět pokračuje v simulaci nezávisle na Fog of War.

Paměť hráče je pouze vizuální reprezentace posledního známého stavu.

Navrhovaná struktura:

WorldState: skutečný aktuální stav světa.

VisibilityState: aktuálně viditelné oblasti.

ExploredState: již objevené oblasti.

MapMemory: poslední známý stav terénu a pevných objektů.

Při přechodu objektu z VISIBLE do EXPLORED zachovej jeho poslední viditelný vzhled.

Nepoužívej živý stav objektu pro vykreslování v EXPLORED oblasti.

Uložený snapshot může obsahovat:

Object ID

Object Type

Tile Position

Sprite/Asset ID

Visual State

Growth Stage

Construction Stage

Orientation

Other visually relevant properties

Zvol datově úspornou strukturu.

Pokud hráč znovu vstoupí do oblasti, porovnej paměť se skutečným stavem a aktualizuj ji.

Pokud objekt již neexistuje, odstraň jeho starý obraz z mapové paměti až po jeho opětovném spatření.

Aktuální herní logika, pathfinding a kolize musí vždy používat skutečný WorldState, ne zastaralou paměť.

6. Pohybující se objekty

Dynamické objekty se v EXPLORED oblasti nezachovávají.

Platí pro:

Wildlife

Villagers

Travelers

Merchants

Caravans

Enemies

Other moving units

Jakmile opustí View Range, přestanou být viditelné.

Nadále však pokračují ve své skutečné simulaci.

Po opětovném vstupu do dohledu se zobrazí na aktuální pozici.

Nepoužívej pro ně poslední známou statickou kopii.

7. Nový Exploration Mode

Přidej nový režim:

Exploration Mode

Výchozí nastavení při zahájení nové hry: ON.

Pokud je Exploration Mode zapnutý:

Celá mapa začíná jako UNEXPLORED.

Mimo počáteční View Range je úplně černá.

Viditelná je pouze kruhová oblast kolem krále.

Při pohybu krále se postupně odkrývá nová část mapy.

Jednou objevená oblast zůstane prozkoumaná.

Když král odejde, změní se na tmavě šedou EXPLORED oblast.

Při opětovném příchodu se vrátí do plně viditelného stavu.

Prozkoumávání je trvalé v rámci dané uložené hry.

Při nové hře se mapa znovu začíná jako neprozkoumaná.

Exploration Mode nesmí ovlivňovat skutečnou AI, ekonomiku ani simulaci světa.

8. Přepínání Exploration Mode v levém menu

Do existujícího levého Settings panelu přidej dva samostatné přepínače:

Fog of War: ON / OFF

Exploration: ON / OFF

Oba přepínače musí skutečně fungovat za běhu hry, především pro testovací účely.

Chování:

Fog of War ON + Exploration ON

Standardní herní režim.

Neprozkoumaná mapa je černá.

Prozkoumaná oblast je tmavě zašedlá.

Aktuálně viditelná oblast je normálně barevná.

Fog of War ON + Exploration OFF

Testovací režim bez černého zakrytí mapy.

Terén celé mapy je viditelný.

Mimo View Range je tmavě zašedlý.

Pevné objekty, které hráč nikdy neviděl, zůstávají skryté.

Objevené pevné objekty se zobrazují podle Map Memory.

Dynamické objekty mimo View Range zůstávají skryté.

Fog of War OFF

Úplné testovací zobrazení mapy.

Celá mapa je viditelná.

Objekty mají normální barvy.

Zobrazuje se aktuální skutečný WorldState.

Černá ani šedá mlha se nevykresluje.

Exploration přepínač nemá při vypnutém Fog of War žádný vizuální efekt.

Přepínání musí okamžitě aktualizovat zobrazení.

DŮLEŽITÉ:
Vypnutí Fog of War pro testování nesmí automaticky označit všechna políčka jako prozkoumaná.

Po opětovném zapnutí Fog of War se musí obnovit původní paměť a skutečně objevené oblasti.

Totéž platí při přepnutí Exploration OFF/ON.

Testovací přepínače mění způsob zobrazení, nikoliv automaticky trvalou historii průzkumu.

9. New Game Setup

Přidej Exploration Mode také do existujícího New Game Setup, pokud obsahuje pokročilá nastavení.

Výchozí hodnoty:

Fog of War: ON

Exploration: ON

Pokud již existuje nastavení Fog of War, zachovej jej.

Nevytvářej duplicitní volby.

Při vytvoření nové hry inicializuj prozkoumanou mapu podle skutečného počátečního dohledu.

V průběhu nové hry musí fungovat i přepínače v levém Settings panelu.

10. Více zdrojů vidění

Navrhni Visibility System tak, aby mohl kombinovat více aktivních zdrojů dohledu.

Aktuálně podporuj existující pravidla hry:

King

Mounted King

King on Tower

King on Castle

King on Walls

Pokud již hra obsahuje další funkční zdroje vidění, zachovej je.

Do budoucna připrav možnost, aby vidění poskytovali také průzkumníci, vojáci nebo hlídkové věže, ale nepřidávej jim nové schopnosti bez existujícího herního pravidla.

Výsledná viditelná oblast je sjednocením kruhů aktivních zdrojů.

Zdroje vidění nesmějí automaticky odhalovat celou mapu.

11. Aktualizace mapové paměti

Paměť aktualizuj pouze pro políčka, která jsou skutečně VISIBLE v běžné herní viditelnosti.

Při změně viditelnosti:

Vypočítej aktuální kruhovou oblast dohledu.

Označ její políčka jako prozkoumaná.

Aktualizuj jejich poslední známý stav.

Pro políčka mimo dohled použij uložené snapshoty.

Nikdy nevykresluj nové živé objekty v EXPLORED oblasti.

Po opětovném odkrytí obnov aktuální stav.

Nedovol únik informací přes:

Selektování skrytých objektů.

Tooltipy a panely.

Zvýraznění při hoveru.

Stíny objektů.

Animace.

Zvuky vázané na vizuálně skryté události, pokud prozrazují přesnou polohu.

Efekty těžby nebo výstavby mimo dohled.

Pokud jsou skryté objekty stále fyzicky přítomné, jejich existence nesmí být zjistitelná pouze náhodným klikáním do mlhy.

U vlastních budov a jednotek zachovej dosavadní logiku správy, ale odděl informační UI od vizuálního odhalování okolí.

12. Grafická vrstva Fog of War

Implementuj efektivní renderovací systém pro izometrickou mapu.

Požadavky:

Kruhová viditelnost.

Výrazně šedé EXPLORED oblasti.

Černé UNEXPLORED oblasti.

Korektní překrytí objektů.

Správné vykreslování statických snapshotů.

Žádné problikávání při pohybu kamery.

Správná funkce při zoomování.

Správná funkce při pohybu krále.

Mlha musí respektovat také výšku grafických sprite objektů, například stromů a věží. Nesmí nastat situace, kdy je terén zašedlý, ale koruna stromu zůstane plně barevná.

Nepoužívej zbytečně nákladné překreslování všech objektů v každém snímku.

13. Save / Load

Rozšiř existující Save/Load.

Ukládej:

Stav Exploration Mode.

Stav Fog of War.

Prozkoumaná políčka.

Poslední známý stav statických objektů.

Poslední známý vizuální stav terénu, pokud se může měnit.

Potřebné informace pro obnovení viditelnosti.

Prozkoumaná mapa musí po načtení zůstat prozkoumaná.

Nesmí se automaticky odkrýt celá mapa.

Nesmí dojít ke ztrátě paměti statických objektů.

Nesmí se obnovit zastaralé objekty jako skutečné herní objekty.

Pro starší save soubory, které neobsahují Exploration data, použij bezpečnou migraci.

Zachovej oddělení Save Schema Version a Game Version.

14. Výkon

Mapa má 100×100 políček.

Systém musí být připraven na větší množství objektů a stovky NPC.

Optimalizuj:

Výpočet kruhové viditelnosti.

Aktualizace pouze změněných políček.

Ukládání prozkoumaných políček.

Snapshoty statických objektů.

Renderování mlhy.

Práci s Phaser objekty.

Nepočítej kompletní viditelnost celé mapy každý snímek, pokud se žádný relevantní zdroj vidění nezměnil.

Při pohybu krále aktualizuj viditelnost podle potřeby, aby mlha reagovala plynule.

Využij cache a datově úsporné reprezentace, pokud jsou kompatibilní se současnou architekturou.

15. Testování

Před implementací vytvoř Git commit funkční verze.

Ověř:

View Range má kruhový, nikoliv čtvercový tvar.

Kruh je správný v izometrickém zobrazení.

Mount a budovy zachovávají bonusy dohledu.

Prozkoumané oblasti jsou výrazně zašedlé.

Neprozkoumané oblasti jsou černé.

Král postupně odkrývá mapu.

Jednou prozkoumané oblasti zůstávají v paměti.

Strom mimo dohled nezmizí.

Pokácený strom mimo dohled zůstane v paměti v posledním známém stavu.

Po opětovném spatření se zobrazí aktuální pařez.

Nová budova postavená mimo dohled se nezobrazí před opětovným průzkumem.

Zbouraná budova zůstává ve staré paměti až do dalšího spatření.

Pohybující se NPC mimo dohled nejsou viditelné.

Skryté objekty nelze odhalit hoverem nebo kliknutím.

Exploration ON/OFF funguje okamžitě.

Fog of War ON/OFF funguje okamžitě.

Testovací odkrytí mapy nezmění trvalý průzkum.

Save/Load zachovává prozkoumané oblasti i jejich paměť.

Správně funguje zoom a pohyb kamery.

Hra zůstává plynulá na mapě 100×100.

16. Implementační postup

Rozděl upgrade do čtyř fází:

Fáze A – Circular Visibility
Převod čtvercového View Range na kruhový a sjednocení zdrojů vidění.

Fáze B – Exploration & Rendering
Černá neprozkoumaná mapa, šedé prozkoumané oblasti a přepínače.

Fáze C – Persistent Map Memory
Snapshoty statických objektů, zastaralé informace a aktualizace při opětovném spatření.

Fáze D – Integration
Save/Load, kompatibilita, výkon, UI a automatizované testy.

Po každé dokončené a otestované fázi vytvoř Git commit.

Zapiš skutečně dokončené změny do sekce Unreleased v CHANGELOG.md podle zavedeného verzovacího systému. Nevydávej automaticky novou verzi.

Prioritou je skutečný kruhový Fog of War a správná paměť prozkoumané mapy, nikoliv pouze kosmetické ztmavení současného systému.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

