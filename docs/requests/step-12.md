krok 12	"Upgrade hry – Dynamické vyšlapávání cest v trávě

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o dynamický systém vyšlapávání pěšin podle skutečného pohybu postav.

Cílem je, aby se na travnaté mapě přirozeně vytvářely cesty v místech, kudy často chodí král, poddaní, pocestní a další lidské jednotky.

Zachovej všechny existující mechaniky hry včetně mapy 100 × 100, pathfindingu, Fog of War, migrace NPC, budov, inventáře a Save/Load.

1. Tři úrovně vyšlapání

Každé travnaté políčko může mít čtyři stavy:

Level 0 – původní vysoká tráva.

Level 1 – lehce sešlapaná tráva.

Level 2 – zřetelná travnatá pěšina s odkrytou hlínou.

Level 3 – výrazně vyšlapaná hlinitá cesta.

Každé políčko má vlastní hodnotu trampleScore, určující míru sešlapání.

Počáteční hodnota všech políček je 0.

Pro první verzi nastav:

Level 0: 0–4 průchody.

Level 1: 5–14 průchodů.

Level 2: 15–29 průchodů.

Level 3: 30 a více průchodů.

Prahy musí být centrálně konfigurovatelné.

2. Započítávání průchodů

Při každém skutečném vstupu postavy na nové travnaté políčko zvyš jeho trampleScore o 1.

Pravidla:

Král pěšky: +1.

Poddaný: +1.

Pocestný: +1.

Voják, pokud již existuje: +1.

Král na koni: +2.

Samostatný kůň a divoká zvířata zatím cesty nevytvářejí.

Započítej pouze skutečný pohyb mezi políčky.

Nesmí se zvyšovat při každém snímku hry, při stání na místě ani při opakované aktualizaci stejného políčka bez jeho opuštění.

Při diagonálním pohybu správně zaznamenej všechna políčka, kterými postava skutečně prošla. Zabraň přeskočení políček při vyšší rychlosti pohybu.

Na neprostupných políčkách, pod budovami a na vodě se pěšiny nevytvářejí.

3. Grafické zobrazení

Vytvoř tři vizuálně odlišné úrovně vyšlapané trávy.

Grafický styl musí odpovídat stávající izometrické 2.5D hře.

Level 1: mírně světlejší a nižší tráva.

Level 2: nepravidelná travnatohlinitá pěšina.

Level 3: převážně hnědá hlinitá cesta.

Přechody mezi úrovněmi musí působit přirozeně.

Nepoužívej jen jednolitě barevné čtverce. Přidej jemné textury a nepravidelné okraje.

Připrav systém automatického propojování cest podle sousedních políček, aby na sebe navazující úseky vytvářely vizuálně souvislé pěšiny.

Při vzniku nebo zániku pěšiny aktualizuj i potřebná sousední políčka.

Grafiku implementuj jako součást terénního systému, nikoliv jako samostatné budovy.

4. Postupné zarůstání cest

Pokud se pěšina přestane používat, tráva bude postupně dorůstat.

Pro první verzi nastav:

Po 3 herních dnech bez průchodu začne políčku klesat trampleScore.

Každý další herní den bez průchodu se sníží o 5 bodů.

Nový průchod znovu odloží začátek zarůstání.

Při poklesu skóre pod hranici úrovně se změní vzhled políčka.

Při dosažení hodnoty 0 se obnoví původní tráva.

Použij existující Game Time System, kde jeden herní den trvá 120 sekund.

Zarůstání nepočítej každý snímek. Vyhodnocuj ho při změně herního dne nebo jiným efektivním způsobem.

5. Vliv na pohyb postav

Vyšlapané cesty budou mít malý vliv na rychlost pohybu.

Navrhované bonusy:

Level 0: +0 %.

Level 1: +5 %.

Level 2: +10 %.

Level 3: +15 %.

Bonus se vztahuje na skutečnou rychlost pohybu dané jednotky při průchodu políčkem.

Pathfinding může preferovat existující cesty, ale pouze tehdy, pokud je výsledná cesta skutečně výhodná vzhledem k délce a rychlosti pohybu.

Zachovej funkční osmisměrný pohyb a zákaz diagonálního procházení rohy překážek.

Bonus musí správně fungovat i při jízdě na koni a nesmí rušit existující bonus +100 % movement speed.

6. Asset Library

Do Asset Library přidej terénní varianty:

grass_normal

grass_trampled_1

grass_trampled_2

grass_trampled_3

Tyto varianty nejsou samostatně stavitelné budovy.

Systém musí umožnit jejich pozdější výměnu za vlastní grafické textury bez změny herní logiky.

7. Save / Load

Rozšiř existující systém ukládání.

U každého travnatého políčka ukládej:

trampleScore

Aktuální úroveň vyšlapání.

Poslední herní den, kdy po něm někdo prošel.

Po načtení hry se musí zachovat všechny vyšlapané cesty.

Neprováděj dodatečné zarůstání za dobu, kdy byla hra zavřená.

Zabraň tomu, aby se při načtení znovu započítávaly průchody postav stojících na políčkách.

8. Optimalizace

Mapa má 100 × 100 políček, tedy 10 000 polí.

Systém musí být výkonný i při větším počtu NPC.

Používej jednoduché číselné hodnoty pro každé políčko.

Změny zaznamenávej pouze při skutečném přechodu mezi políčky.

Při změně úrovně aktualizuj pouze dotčené políčko a jeho potřebné sousedy.

Nevytvářej samostatný časovač pro každé políčko.

Nepřekresluj celou mapu při každém průchodu.

Vykreslování terénu optimalizuj podle aktuálně viditelné oblasti kamery.

9. Debug režim

Do Settings přidej přepínač:

Show Path Wear Debug

Při zapnutí zobraz nad travnatými políčky barevné označení nebo číselné hodnoty trampleScore.

Debug zobrazení musí fungovat při posouvání i zoomování izometrické kamery.

Po vypnutí musí být viditelná pouze běžná grafika terénu.

10. Testování

Před úpravami vytvoř Git commit.

Ověř:

Průchody krále skutečně zvyšují míru sešlapání.

Stání na místě nezvyšuje skóre.

Po 5 průchodech vznikne Level 1.

Po 15 průchodech vznikne Level 2.

Po 30 průchodech vznikne Level 3.

NPC také vytvářejí pěšiny.

Král na koni vyšlapává cestu rychleji.

Jednotlivé úseky se graficky propojují.

Nepoužívané cesty postupně zarůstají.

Vyšlapané cesty poskytují správné bonusy rychlosti.

Save/Load zachovává vyšlapané pěšiny.

Systém funguje správně na celé mapě 100 × 100.

Stávající herní mechaniky zůstávají funkční.

Nepřidávej zatím ručně stavěné kamenné nebo dlážděné cesty. Zaměř se pouze na přirozeně vznikající pěšiny."