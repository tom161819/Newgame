# ETAPA 07/15 – původní krok 25: Forestry & Natural Resources

**Milník:** M2. **Důležitá úprava:** Jednotné konečné ložisko Stone a Quarry MUSÍ překrývat skálu alespoň 1 tile a mít dostupný vstup; těžba volných kamenů je samostatná mechanika.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade 3: Forestry & Natural Resources

Rozšiř stávající izometrickou 2.5D strategii ve Phaseru o komplexní, ale výkonný systém přírodních zdrojů, růstu stromů, lesnictví, kamenolomů a těžby železné rudy.

Hlavní cíl: Přírodní zdroje budou existovat fyzicky na mapě. Stromy budou růst a obnovovat se, zatímco kamenná a železná ložiska budou mít omezené zásoby.

Navazuj na stávající systémy:

Object Registry a Asset Library

Profese a individuální skilly 1–50

Worker AI a osmisměrný pathfinding

Logistics System a fyzickou přepravu surovin

Warehouse a Starter Stockpile

Construction System a blueprinty

Fog of War

Game Time, Seasons a Weather

Path Wear System

Save/Load

Nezakládej nový projekt. Nejdříve ověř, které systémy jsou skutečně implementované, a nevytvářej duplicity. Pokud některá závislost zatím neexistuje, navrhni jednoduchou kompatibilní integraci.

1. Generování lesů na mapě

Při vytváření nové hry generuj přírodní lesní oblasti.

Pro mapu 100 × 100 použij přibližně 150–250 stromů.

Stromy rozmísťuj především do nepravidelných skupin, aby vznikaly přirozené lesy, nikoliv rovnoměrně rozházené jednotlivé stromy.

Podporuj dva druhy:

Oak – dub

Pine – borovice

Každý strom má vlastní ID, pozici, typ, stáří a růstový stav.

Stromy nesmějí blokovat počáteční pozici krále, dostupnost jeho počátečního skladiště ani nezbytné průchody mapou.

Respektuj existující terén a budovy.

Novou hru generuj s již existujícími mladými i dospělými stromy, aby bylo možné dřevo těžit okamžitě.

2. Růst stromů

Každý strom bude mít následující fáze:

Stage 0 – pařez po pokácení

Stage 1 – malý semenáček

Stage 2 – mladý strom

Stage 3 – dospělý strom

Po pokácení stromu zůstane pařez.

Výchozí doby růstu:

Pařez → semenáček: 1 herní den

Semenáček → mladý strom: 3 herní dny

Mladý strom → dospělý strom: 4 herní dny

Celková doba obnovy dospělého stromu tedy bude přibližně 8 herních dnů.

Použij existující Game Time System.

Růst nesmí být závislý na FPS.

Pokud existuje systém Seasons a Weather, aplikuj jednoduché modifikátory:

Spring: +25 % rychlosti růstu

Summer: +10 %

Autumn: -25 %

Winter: růst pozastaven

Tyto modifikátory musí být konfigurovatelné.

Na políčku, které bylo mezitím zastavěno nebo jinak trvale obsazeno, strom znovu nevyroste.

V první verzi nemusíš simulovat samovolné šíření lesa na nová políčka. Stromy se obnovují především na původních místech.

3. Těžba dřeva

Dospělý strom lze pokácet.

Výchozí parametry:

Oak: 6 Wood

Pine: 5 Wood

Základní doba kácení: 15 sekund

Kácení provádí skutečná jednotka.

Postup:

Dřevorubec vybere dospělý strom.

Zarezervuje jej.

Fyzicky k němu dojde.

Začne kácet.

Postupně roste ukazatel vykonané práce.

Po dokončení strom přejde do stavu pařezu.

Na zemi vznikne odpovídající množství Wood.

Dřevorubec dřevo vyzvedne.

Odnese jej do dostupného skladu.

Získá Woodcutting XP.

Dřevo se nesmí okamžitě teleportovat do inventáře.

Pokud už existuje Logistics System, použij jeho systém nákladů, rezervací a fyzického doručení.

Pokud pracovník nemůže odnést celé množství najednou, zbytek zůstane na místě.

Dva pracovníci nesmějí současně dokončit kácení stejného stromu.

4. Lumberjack Hut – Dřevorubecká chata

Přidej novou budovu:

ID: lumberjack_hut

Velikost: 2 × 2

Cena: 8 Stone

Pracovní místa: 3

Profese: Woodcutter

Pracovní rádius: 18 políček

Budova se staví pomocí existujícího blueprint systému.

Po dokončení umožní přiřadit až tři dřevorubce.

Dřevorubci automaticky vyhledávají dospělé stromy v pracovním rádiusu.

Pokud nejsou dostupné stromy, čekají.

Pokud je sklad plný, přeruší těžbu a nesmějí vytvářet suroviny, které nelze bezpečně uložit nebo ponechat na zemi.

Do panelu budovy přidej:

Počet pracovníků

Počet dostupných dospělých stromů v okolí

Aktuální úkoly

Množství dosud vytěženého dřeva

Denní produkci dřeva

5. Woodcutting Skill

Použij existující Woodcutting skill s levely 1–50.

Vyšší skill zrychluje kácení podle stávajícího vzorce:

Efficiency = 1 + (SkillLevel - 1) × 0.01

Příklady:

Level 1: 100 %

Level 25: 124 %

Level 50: 149 %

Nezvyšuj automaticky množství dřeva získaného z jednoho stromu.

Za dokončené kácení:

Oak: 15 Woodcutting XP

Pine: 12 Woodcutting XP

Celkové XP postavy připisuj podle existujícího Experience Systemu, bez duplicit.

Přirozený talent Woodcutting musí nadále poskytovat svůj existující bonus k XP.

6. Ruční kácení králem

Král musí mít také možnost kácet stromy.

Kliknutím na dospělý strom:

Zobraz interakci Chop Tree.

Král automaticky dojde ke stromu.

Pokud jede na koni, nejprve sesedne.

Použije svůj Woodcutting skill.

Po dokončení vznikne dřevo na zemi.

Král jej může sebrat a odnést do skladu.

Král získává odpovídající XP.

Kácení krále lze přerušit jiným příkazem.

Rozpracovaný postup kácení může zůstat zachovaný, ale nesmí být započítán vícekrát.

7. Přírodní kamenná ložiska

Rozšiř současný systém získávání kamene.

Zachovej existující volně ležící kameny a jejich respawn podle nastavení New Game Setup.

Navíc přidej přírodní kamenná ložiska:

ID: stone_deposit

Kategorie: Natural Resource Deposit

Rozměr: přibližně 2 × 2 políčka

Počet na mapě 100 × 100: 5

Zásoba: náhodně 80–160 Stone

Ložiska budou vypadat jako skalní útvary.

Množství dostupného kamene musí být individuálně evidováno pro každé ložisko.

Ložiska generuj pouze na vhodném terénu a nesmějí blokovat nezbytné cesty.

Po vytěžení zásoby se ložisko změní na vyčerpaný skalní útvar.

Kamenná ložiska se zatím automaticky neobnovují.

8. Rozšíření existujícího Quarry – finální pravidlo platí již od této etapy

Nedělej druhý typ kamenolomu.

Quarry 3×3 lze NOVĚ umístit pouze tak, aby alespoň jedno políčko půdorysu překrývalo skutečný objekt skalní překážky / stone_deposit s konečnou zásobou Stone; přístup pro dělníky ze skutečně průchozí oblasti mapy musí zůstat zachován. Při placingu povol pro Quarry tuto specifickou výjimku z kolize se skálou, nikoliv s jinými objekty nebo budovami. Preview musí rozlišit chybějící skálu a blokovaný přístup. Skála má unikátní ID, zásobu a je navázána na Quarry; stejný kámen nelze vytěžit dvakrát.

Quarry těží pouze z platně překrytého/přiřazeného skalního ložiska. Volně ležící kameny zůstávají samostatně sběratelné existující mechanikou King/Collector, ale NESLOUŽÍ jako alternativní nekonečný zdroj automatické produkce Quarry. Neskenuj automaticky vzdálená ložiska v okolí 12 políček. Při vyčerpání přiřazeného ložiska se produkce zastaví a zobrazí Deposit Depleted; případné znovupřipojení vyžaduje explicitní platné pravidlo, ne neviditelné přeskakování ložisek.

Pracovníci musí fyzicky dojít na přístupné pracovní místo u Quarry, nesmějí stát uvnitř neprůchozí skály. Základní těžba: 1 Stone / 12 sekund aktivní práce, 5 Mining XP. Materiál je fyzicky doručen do skladu podle Logistics Systemu. Zachovej existující Quarry ve starých savech i bez překryvu (legacy výjimka pouze pro již postavené budovy, bez přidávání skály pod ně); nová pravidla se vztahují na nové stavby.

Krok 35 později toto pravidlo pouze dořeší a otestuje společně se Smelter, nemá jej změnit zpět na těžbu z okolí.

9. Železná ložiska – Iron Deposits

Přidej nový přírodní zdroj:

ID: iron_deposit

Rozměr: 2 × 2 políčka

Počet na mapě 100 × 100: 4

Zásoba: náhodně 60–120 Iron Ore

Graficky musí být rozpoznatelný od kamenného ložiska.

Například tmavší skály s načervenalými rudnými žílami.

Ložiska mají omezenou zásobu.

Po vytěžení se označí jako Depleted.

Zatím se automaticky neobnovují.

10. Iron Mine – Železný důl

Přidej novou budovu:

ID: iron_mine

Velikost: 3 × 3

Cena: 12 Stone + 8 Wood

Pracovní místa: 3

Profese: Miner

Potřebuje dostupné Iron Deposit

Důl lze postavit pouze v dosahu železného ložiska.

Umístění musí být platné na izometrické mřížce a nesmí překrývat samotný přírodní objekt.

Maximální vzdálenost dolu od ložiska: 4 políčka.

Po dokončení dolu mohou přiřazení horníci začít těžit.

Výchozí těžba:

Jedna operace: 1 Iron Ore

Základní čas: 20 sekund

Odměna: 8 Mining XP

Rychlost těžby ovlivňuje existující Mining Skill.

Horníci musí fyzicky dojít na dostupné pracovní místo u ložiska.

Vytěžená ruda musí být fyzicky přepravena do Warehouse.

Pokud je sklad plný, těžba se pozastaví nebo se bezpečně zachová vytěžený materiál na místě.

11. Nové suroviny

Zaregistruj:

Wood

Iron Ore

Wood je stavební materiál.

Iron Ore je zatím surová ruda, nikoliv hotové železo.

Nepřidávej zatím hutě, tavicí pece ani výrobu ingotů.

Zachovej Gold, Stone, Meat, Wheat, Apple, Flour a Bread.

12. Využití dřeva při stavění

Rozšiř stavební náklady u vybraných budov.

Nové ceny:

Lumberjack Hut: 8 Stone

Iron Mine: 12 Stone + 8 Wood

U ostatních současných budov zatím zachovej jejich existující ceny.

Systém výstavby ale musí nyní správně podporovat budovy s více druhy vstupních surovin.

Doprava stavebního materiálu musí respektovat existující Logistics System.

Pokud není dostatek Wood, stavbu Iron Mine nelze zahájit.

13. Vliv na Pathfinding a terén

Dospělé stromy a velké skalní útvary představují překážky pro pohyb.

Po pokácení stromu se políčko stane průchozím, pokud na něm není jiná překážka.

Pařez může zůstat jako nízká dekorace.

Při opětovném růstu stromu se aktualizuje průchodnost odpovídající růstové fáze.

Strom nesmí vyrůst přímo pod stojící nebo procházející jednotkou. Pokud je políčko obsazeno, růst do neprůchozí fáze odlož.

Zachovej osmisměrný pohyb a ochranu proti diagonálnímu procházení rohy překážek.

Dřevorubci a horníci přispívají ke stávajícímu systému vyšlapávání cest.

14. Fog of War

Stromy, skalní útvary a ložiska musí respektovat aktuální Fog of War.

Při zapnutém FoW a Exploration platí tři stavy: UNEXPLORED černá oblast, EXPLORED šedá naposledy známá mapa, VISIBLE skutečný aktuální stav. Nikdy bezdůvodně nezobrazuj celý terén.

V prozkoumaných oblastech mimo dohled se zobrazí pouze poslední známý statický stav stromů a ložisek z Persistent Map Memory; živý stav zůstane skrytý.

Skryté objekty nelze nově vybrat kliknutím.

AI pracovníků nadále pracuje i mimo zorné pole krále.

Zajisti, aby skrývání grafiky neovlivňovalo skutečnou simulaci.

15. Asset Library

Přidej definice:

oak_tree

pine_tree

lumberjack_hut

wood

stone_deposit

iron_deposit

iron_mine

iron_ore

U stromů přidej růstové fáze a těžební výnos.

U ložisek přidej aktuální a maximální zásobu.

U budov přidej pracovní kapacity a náklady.

Připrav možnost pozdějšího nahrazení grafiky profesionálními izometrickými sprity.

16. Save / Load

Rozšiř stávající ukládání hry.

Ukládej:

Typ, ID, pozici a fázi růstu stromu.

Jeho dosavadní postup růstu.

Stav pařezu.

Aktuální zásobu každého ložiska.

Stav vyčerpaných ložisek.

Postavené dřevorubecké chaty a doly.

Přiřazené pracovníky.

Rozpracovanou těžbu.

Rezervace těžebních úkolů.

Fyzické náklady dřeva a železné rudy.

Skladové zásoby.

Odpovídající nové skilly a statistiky.

Po načtení se nesmí znovu generovat původní stromy a ložiska.

Nesmí dojít k opakovanému přidání vytěžených surovin.

Zachovej kompatibilitu starších save souborů.

Pokud starší save neobsahuje lesy ani ložiska, zvol bezpečnou migraci, která nepoškodí existující stav světa.

17. Optimalizace

Mapa má 100 × 100 políček.

Stromy a ložiska reprezentuj především jednoduchými datovými objekty.

Růst rostlin nepočítej každý snímek.

Používej centrální herní čas.

Nevytvářej samostatné časovače pro každý strom.

Grafiku mimo viditelnou oblast kamery nevykresluj zbytečně.

AI pracovníků nemusí vyhledávat nové úkoly každý snímek.

Opakované pathfinding výpočty omezuj pomocí rezervací a plánování úkolů.

18. Testování

Před úpravami vytvoř Git commit.

Ověř:

Lesy se generují v přirozených skupinách.

Stromy mají různé fáze růstu.

Dřevorubci dokážou samostatně kácet stromy.

Dřevo se fyzicky přepravuje do skladu.

Král může pokácet strom.

Po pokácení vznikne pařez.

Strom postupně znovu vyroste.

Růst respektuje roční období, pokud je systém implementován.

Kamenná ložiska obsahují omezené zásoby.

Nově umístěné Quarry těží pouze z platně překrytého skalního ložiska a má přístupné pracovní místo.

Iron Mine lze postavit pouze v dosahu železného ložiska.

Horníci získávají Iron Ore.

Železná ruda se fyzicky dopravuje do skladu.

Ložisko se nemůže vytěžit do záporných hodnot.

Woodcutting a Mining XP se správně přičítají.

Stromy a ložiska správně ovlivňují pathfinding.

Fog of War funguje.

Save/Load obnovuje všechny přírodní zdroje a rozpracované úkoly.

Nedochází k duplicitnímu vytváření surovin.

Hra zůstává plynulá na mapě 100 × 100.

19. Postup implementace

Rozděl práci na čtyři fáze:

Fáze A – Forestry
Generování lesů, růst stromů, kácení a Woodcutting.

Fáze B – Lumberjack Hut
Pracovní budova, automatická práce dřevorubců a doprava dřeva.

Fáze C – Natural Mining
Kamenná a železná ložiska, těžba a Iron Mine.

Fáze D – Integration
Stavební náklady, logistika, Save/Load, Fog of War, optimalizace a testování.

Po každé dokončené a otestované fázi vytvoř samostatný Git commit.

Neimplementuj zatím zpracování železné rudy, těžbu uhlí ani složitý průmysl.

Prioritou je propojení obnovitelných lesů s konečnými nerostnými ložisky a spolehlivý fyzický pohyb vytěžených surovin.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

