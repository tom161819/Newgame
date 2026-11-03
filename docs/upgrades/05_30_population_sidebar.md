# ETAPA 05/15 – původní krok 30: Population Sidebar & Skill Sorting

**Milník:** M1. **Důležitá úprava:** Při úmrtí ukazovat 3 herní dny v Recent Deaths se symbolem lebky, nikoliv jako aktivní obyvatele.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Population Sidebar, Villager Portraits & Skill Sorting

Rozšiř stávající izometrickou 2.5D strategii Medieval Kingdom o nový rozbalovací pravý panel, který bude sloužit jako přehled všech obyvatel království.

Hlavní cíl: Hráč musí mít možnost rychle zobrazit všechny poddané, zjistit jejich povolání, level, XP a individuální skilly, seřadit je podle libovolného skillu nebo profese a najít konkrétního obyvatele na mapě.

Každý obyvatel bude reprezentován malým portrétem s barevným pozadím podle aktuální profese.

Nezakládej nový projekt. Nejprve analyzuj existující UI, Population System, Worker AI, Job System, Experience System, Skill System, Character Registry, Map Camera, Asset Library a Save/Load.

Nevytvářej nové duplicitní systémy postav nebo zkušeností.

1. Nový pravý postranní panel

Na pravou stranu herní obrazovky přidej rozbalovací panel:

POPULATION

Panel musí být dostupný přímo během hraní.

Ve výchozím stavu bude sbalený, aby nezabíral místo na obrazovce.

Ve sbaleném stavu zobraz úzkou vertikální záložku s:

Ikonou obyvatel.

Nápisem Population.

Aktuálním počtem poddaných.

Kliknutím na záložku se panel vysune z pravého okraje obrazovky.

Opětovným kliknutím se zasune.

Animace vysunutí musí být plynulá.

Panel nesmí narušovat existující levý Settings panel, spodní nabídku Buildings ani ovládání kamery.

Po otevření panelu nesmí klikání a scrollování uvnitř panelu zároveň ovládat herní mapu.

2. Seznam všech poddaných

Zobraz všechny trvalé obyvatele království.

Každý záznam musí obsahovat:

Portrét postavy.

Jméno.

Aktuální povolání.

Celkový level.

Základní informaci o XP.

Barevné pozadí portrétu podle profese.

Nezobrazuj běžné procházející pocestné ani obchodní karavany, které nejsou trvalými obyvateli.

Král může být zobrazen v samostatné sekci King, ale nezapočítávej ho duplicitně do populace.

Pokud obyvatel zemře nebo opustí království, aktivní seznam se okamžitě aktualizuje. Nedávno zemřelé však zachovej dočasně v oddělené sekci Recent Deaths po 3 celé herní dny: přeškrtnutý portrét a malá lebka se zkříženými kostmi; tito lidé se nepočítají do populace, kapacity domů, zaměstnanosti ani do kandidátů na pracovní místo. Emigrovaní obyvatelé se ze seznamu odstraní po fyzickém opuštění mapy.

Pokud se někdo přistěhuje, musí se okamžitě objevit.

Doba zobrazení nedávno zemřelých: 3 celé herní dny; samostatná sekce Recent Deaths (nikoliv aktivní populace). 

3. Barevné portréty podle profese

Každá profese bude mít vlastní barevné pozadí portrétu.

Výchozí barevná paleta:

Unemployed: Grey

Builder: Orange / Brown

Miner: Blue / Steel

Woodcutter: Forest Green

Farmer: Yellow / Olive

Hunter: Dark Green

Soldier: Red

Hauler: Purple

Miller: Light Brown

Baker: Warm Orange

Všechny barvy definuj centrálně v konfiguraci profesí.

Pokud existují další profese, přidej jim odlišné vhodné barvy.

Zachovej dostatečný kontrast a čitelnost.

Barevně se mění především pozadí portrétu, nikoliv samotná postava.

Například:

Miner → portrét na modrém pozadí.

Farmer → portrét na žlutozeleném pozadí.

Soldier → portrét na červeném pozadí.

Při změně profese se barva automaticky změní.

Portréty musí používat skutečný vzhled postavy nebo odpovídající asset z Character/Asset Library.

Nepoužívej pro všechny postavy jeden identický emoji symbol jako finální řešení.

Pokud ještě nejsou dostupné individuální portréty, vytvoř kompatibilní fallback z existujících herních sprite nebo jednoduchý stylizovaný portrét.

4. Detail při najetí myší

Po najetí kurzoru na portrét nebo řádek poddaného zobraz přehledný tooltip.

Tooltip obsahuje:

Základní informace

Name

Profession

Overall Level

Current XP

XP required for next level

Current Job

Assigned Workplace

Skills

Woodcutting

Mining

Hunting

Construction

Farming

Combat

Logistics

Milling

Baking

Zobraz skutečně existující skilly podle současného Skill Systemu.

Pokud některý uvedený skill ještě neexistuje, nepřidávej jej pouze kvůli UI.

Každý skill zobraz jako:

Název

Level

XP progress

Progress bar nebo přehledná hodnota XP

Zvýrazni přirozený talent postavy, pokud existuje.

Příklad:

RADOVAN

Miner
Overall Level: 24
XP: 680 / 950

Skills:
Mining: 28
Construction: 6
Combat: 4
Woodcutting: 3

Natural Talent: Mining

Tooltip nesmí překrývat kritické ovládací prvky ani vystupovat mimo obrazovku.

Při přiblížení kurzoru k pravému okraji ho umísti vlevo od panelu.

U delšího seznamu skillů zajisti scrollování nebo kompaktní rozložení.

5. Řazení obyvatel

V horní části panelu přidej Sort By.

Podporuj:

Overall Level

Overall XP

Name

Profession

Individual Skills

U individuálních skillů musí být možné vybrat konkrétní skill.

Příklad:

Sort By → Mining

Výsledkem bude seznam obyvatel seřazených od nejvyššího Mining Levelu po nejnižší.

Pokud mají dvě postavy stejný skill level, rozhodne jejich XP v daném skillu.

Pokud mají stejné XP, rozhodne celkový level a potom jméno.

Přidej přepínač:

Descending

Ascending

Výchozí řazení:
Overall Level – Descending.

Pokud je zvolen konkrétní skill, zobraz jeho level také přímo v řádku postavy.

6. Filtrování podle profese

Přidej samostatný filtr:

Profession

Možnosti:

All

Unemployed

Builder

Miner

Woodcutter

Farmer

Hunter

Soldier

Hauler

Miller

Baker

Další skutečně dostupné profese

Filtr vytvoř dynamicky podle existujícího Job Registry, aby nebylo nutné při přidávání nové profese ručně přepisovat UI.

Příklad:

Profession: Miner
Sort By: Mining Level
Order: Descending

Zobrazí pouze horníky seřazené podle Mining Skill.

Filtrování a řazení musí fungovat současně.

7. Vyhledávání

Přidej jednoduché vyhledávací pole:

Search villagers...

Vyhledávání musí podporovat jména poddaných.

Nezáleží na velikosti písmen.

Vyhledávání musí fungovat současně s filtrem profese a řazením.

Při prázdném výsledku zobraz:

No villagers found.

8. Výběr poddaného

Kliknutím na řádek poddaného:

Vyber příslušnou postavu.

Zvýrazni ji na mapě.

Otevři existující detailní panel postavy, pokud je implementován.

Dvojklikem:

Vyber postavu.

Plynule přesuň kameru na její aktuální pozici.

Krátce ji vizuálně zvýrazni.

Přidej také malé tlačítko:

Locate

které přesune kameru na daného poddaného.

Pohyb kamery musí respektovat hranice izometrické mapy.

Výběr poddaného nesmí automaticky změnit jeho pracovní úkol, profesi ani trasu.

Fog of War musí být respektován.

Pokud je poddaný mimo aktuální dohled a nelze ho podle herních pravidel vidět, nesmí Locate automaticky odhalit okolí nebo obejít Exploration Mode.

Můžeš ukázat poslední známou pozici nebo oznámit, že pozice není viditelná, podle aktuálních pravidel hry.

9. Zobrazení informací o potřebách

Pokud již existuje Villager Needs System, zobraz v rozšířeném detailu také:

Happiness

Food

Rest

Housing

Safety

V základním řádku zobraz malou stavovou ikonu, pokud:

Postava hladoví.

Je velmi unavená.

Stávkuje.

Je bez práce.

Nemá bydlení.

Je ve vážném nebezpečí.

Při najetí na ikonu zobraz důvod upozornění.

Pokud Needs System zatím není dokončený, nezaváděj ho znovu pouze kvůli tomuto panelu.

10. Stavy postavy

U portrétu může být malá stavová ikona:

Working

Resting

Idle

Traveling

Striking

Leaving Kingdom

Stavy načítej ze skutečného Worker AI Systemu.

Nevytvářej nové paralelní stavy jen pro zobrazování v UI.

11. Souhrn v horní části panelu

V záhlaví Population zobraz:

Total Population

Employed

Unemployed

Pokud je implementován Happiness System:

Average Happiness

Příklad:

Population: 38
Employed: 32
Unemployed: 6
Happiness: 78 %

Souhrn se musí automaticky aktualizovat.

12. Layout a grafika

Zachovej současný vizuální styl Medieval Kingdom.

Panel má připomínat přehledné UI středověké strategické hry.

Doporučení:

Tmavé pozadí panelu.

Jemné zlaté nebo bronzové okraje.

Barevně rozlišené portréty.

Dobře čitelné písmo.

Přehledné selektory.

Jemné hover efekty.

Panel by měl mít šířku přibližně 280–340 px na desktopu.

Záznam jedné postavy přibližně 50–60 px na výšku.

Velikost portrétu přibližně 40–48 px.

Zajisti škálování pro menší obrazovky.

Panel nesmí zakrývat důležitá tlačítka a musí podporovat scrollování.

13. Výkon

Počítej s populací alespoň 200 obyvatel.

Panel nesmí při každém herním snímku kompletně překreslovat seznam.

Použij efektivní aktualizace:

Při přistěhování nebo odchodu.

Při změně profese.

Při změně levelu nebo XP.

Při změně relevantního AI stavu.

Při změně řazení nebo filtru.

Pokud počet obyvatel výrazně roste, použij virtualizaci seznamu nebo jiné efektivní renderování.

Při zavřeném panelu nesmí běžet zbytečné aktualizace všech portrétů a tooltipů.

14. Save / Load

Neukládej duplicitní informace o jednotlivých postavách.

Panel musí používat existující autoritativní data obyvatel.

Zachovej ukládání:

Jména.

Profese.

Celkového levelu.

XP.

Individuálních skillů.

Talentů.

Pracoviště.

Bydlení.

AI stavů.

Samostatně můžeš ukládat pouze preference rozhraní:

Open / Closed.

Sort By.

Sort Direction.

Profession Filter.

Po načtení uložené hry se seznam automaticky sestaví z aktuálních obyvatel.

Nesmí docházet k duplicitním portrétům nebo zastaralým informacím.

15. Integrace s novými profesemi

Systém musí být rozšiřitelný.

Pokud v budoucnu přidáme:

Blacksmith

Fisherman

Guard

Trader

Forester

musí být možné přidat jejich barvu a odpovídající data centrálně, bez přepisování celé komponenty.

Nové skilly se musí automaticky objevit v řazení a tooltipu, pokud jsou zaregistrované ve Skill Registry.

16. Testování

Před zahájením vytvoř bezpečný Git commit.

Ověř:

Na pravé straně je rozbalovací Population panel.

Panel se správně otevírá a zavírá.

Zobrazuje všechny skutečné poddané.

Nezobrazuje cizí pocestné jako vlastní obyvatele.

Každý poddaný má portrét.

Barva pozadí odpovídá profesi.

Změna profese okamžitě změní barvu.

Hover zobrazí správné informace.

Tooltip obsahuje level, XP a skilly.

Funguje řazení podle Overall Level.

Funguje řazení podle Overall XP.

Funguje řazení podle jednotlivých skillů.

Funguje filtrování podle profese.

Filtr a řazení fungují současně.

Funguje vyhledávání podle jména.

Kliknutí vybere správnou postavu.

Locate přesune kameru podle herních pravidel.

Panel respektuje Fog of War.

Noví přistěhovalci se automaticky objeví.

Odejití obyvatelé po opuštění mapy zmizí ze seznamu; zemřelí zůstávají 3 herní dny pouze v Recent Deaths.

Save/Load obnoví správná data.

UI zůstává plynulé při 200 obyvatelích.

Panel neblokuje ovládání kamery mimo svou oblast.

Existující levý panel a spodní Buildings panel fungují bez problémů.

17. Postup implementace

Rozděl upgrade do čtyř fází.

Phase A – Population Sidebar
Pravý rozbalovací panel, seznam postav a portréty.

Phase B – Villager Details
Hover tooltip, XP, skilly, statusy a barevné profese.

Phase C – Filtering & Navigation
Řazení, vyhledávání, filtry, výběr a Locate.

Phase D – Integration
Save/Load, Fog of War, optimalizace, UI testy a finální doladění grafiky.

Po každé dokončené a otestované fázi vytvoř Git commit.

Zapiš skutečně dokončené změny do sekce Unreleased v CHANGELOG.md.

Nevydávej automaticky novou verzi hry.

Prioritou je přehledný a rychlý panel, který hráči umožní spravovat i velké království se stovkami poddaných.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

