krok 9 	"Upgrade hry – Soubojový systém HP, DPS a Armor

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o univerzální systém životů, útoků a obrany.

Nahraď dosavadní instant kill systém skutečným soubojem, při kterém jednotky postupně ztrácejí HP.

Zachovej současné funkce hry, zejména pohyb krále, lov zvěře, dropování masa, jízdu na koni, stavění budov, Fog of War a Asset Library.

1. Základní statistiky jednotek

Každá živá jednotka bude mít:

maxHP – maximální počet životů.

currentHP – aktuální počet životů.

attackDPS – způsobené poškození za sekundu.

armor – procentuální snížení příchozího poškození.

attackRange – dosah útoku v políčkách.

isAlive – zda je jednotka naživu.

Nastav tyto hodnoty:

Jednotka

Max HP

DPS

Armor

King

100

15

0

Rabbit

15

1

0

Deer

40

4

0

Wild Boar

70

12

0

Horse

90

0

0

Všechny statistiky definuj centrálně v Object Registry / Asset Library.

Každá instance jednotky musí mít vlastní aktuální HP.

2. Výpočet poškození

Útok bude založený na DPS (damage per second).

Příklad:

Král má 15 DPS.

Za 1 sekundu útoku způsobí 15 damage.

Za 2 sekundy 30 damage.

Divočák se 70 HP tak zemře přibližně po 4,67 sekundách nepřerušovaného útoku krále.

Výpočet musí být nezávislý na FPS.

Používej uplynulý čas mezi aktualizacemi hry (deltaTime).

Implementuj brnění jako procentuální redukci poškození:

effectiveDPS = attackDPS × (1 - armor / 100)

damage = effectiveDPS × deltaTimeSeconds

Hodnotu armor omez na rozsah 0 až 90 %.

Aktuálně mají všechny jednotky armor = 0, tedy žádnou redukci poškození.

HP nikdy nesmí klesnout pod 0.

3. Útok krále

Po kliknutí na lovitelné zvíře:

Král se vydá směrem ke zvířeti.

Pokud se zvíře pohybuje, král aktualizuje cestu.

Po přiblížení na dosah útoku začne útočit.

Zvíře začne postupně ztrácet HP podle DPS krále.

Pokud se zvíře vzdálí z dosahu, král ho začne znovu pronásledovat.

Pokud HP zvířete dosáhne 0, zvíře zemře.

Král přestane útočit a zvíře dropne maso.

Král může útočit pouze na jedno zvíře současně.

Útočný dosah je prozatím sousední políčko, včetně diagonálních sousedů.

Zachovej možnost útoku při jízdě na koni. Jízda zatím nemění DPS krále.

4. Obrana zvířat

Zvířata budou mít jednoduchou obrannou AI.

Zajíc, srna a divočák se běžně pohybují po mapě jako dosud.

Pokud je král napadne, zvíře začne útočit zpět.

Zvíře má vlastní DPS podle statistik.

Prozatím se zvířata nepokoušejí utéct.

Pokud je král v dosahu, zvíře mu způsobuje poškození.

Pokud se král vzdálí, zvíře se může pokusit přiblížit, ale nesmí procházet překážkami.

Po zrušení souboje se zvíře může vrátit k běžnému pohybu.

Zatím žádné zvíře nezaútočí jako první.

Kůň má HP, ale není lovitelný a neútočí. Kliknutí na koně musí nadále fungovat jako příkaz k nasednutí.

5. Ukazatele HP

Přidej ukazatele životů (health bars).

Král:

V horní části obrazovky zobraz aktuální HP a maximální HP.

Například HP: 85 / 100.

Použij grafický ukazatel s procentuálním vyplněním.

Při ztrátě HP se okamžitě aktualizuje.

Zvířata:

Nad každým zvířetem zobraz malý health bar.

Health bar se zobrazí, pokud je zvíře poškozené nebo právě bojuje.

Při plném HP a bez boje může být skrytý.

Ukazatel musí správně sledovat pohyb zvířete v izometrickém prostoru.

Pokud je zvíře skryté systémem Fog of War, musí být skrytý také jeho health bar.

6. Smrt jednotek

Pokud HP zvířete klesne na 0:

Zastav jeho pohyb a útok.

Odstraň jednotku z aktivních zvířat.

Vytvoř drop masa na místě smrti.

Zachovej existující množství dropů:

Rabbit: 5 masa.

Deer: 10 masa.

Wild Boar: 15 masa.

Maso se musí stále ručně sebrat.

Pokud HP krále klesne na 0:

Zastav ovládání krále.

Zastav běžící herní časovače.

Zobraz obrazovku Game Over.

Přidej tlačítko Restart Game.

Restart uvede hru do počátečního stavu.

Prozatím neimplementuj respawn ani automatické léčení.

7. Animace a vizuální efekty

Přidej jednoduchou vizuální odezvu při útoku:

Král se při útoku natočí směrem k cíli.

Útok může být zobrazen krátkou animací nebo jednoduchým pohybem zbraně.

Zasažená jednotka na okamžik vizuálně blikne.

Poškození se projeví na health baru.

Po smrti zvíře zmizí a objeví se drop masa.

Zatím nepotřebuji realistické animace boje ani krev.

8. Univerzální Combat System

Vytvoř samostatný systém CombatSystem, případně rozšiř existující systém boje.

Systém musí řešit:

Zahájení útoku.

Kontrolu vzdálenosti mezi jednotkami.

Výpočet DPS.

Aplikaci brnění.

Odečítání HP.

Přerušení útoku.

Smrt jednotky.

Událost smrti pro ostatní herní systémy.

Vytvoř obecné funkce například:

startAttack(attacker, target)

stopAttack(attacker)

applyDamage(target, amount)

handleDeath(unit)

Nedělej samostatný soubojový systém pro každé zvíře.

Připrav architekturu na budoucí rozšíření o zbraně, brnění, léčení, nepřátelské vojáky a další statistiky.

9. Asset Library

Rozšiř definice všech živých jednotek o bojové statistiky.

V Asset Library zobraz:

Maximální HP.

DPS.

Armor.

Attack Range.

Zatím nebude potřeba tyto statistiky měnit prostřednictvím grafického editoru.

10. Testování

Před úpravami vytvoř Git commit.

Ověř:

Král má 100 HP a 15 DPS.

Zajíc má 15 HP a vydrží přibližně 1 sekundu útoku krále.

Srna má 40 HP a vydrží přibližně 2,67 sekundy.

Divočák má 70 HP a vydrží přibližně 4,67 sekundy.

Zvířata při napadení způsobují poškození králi.

Poškození je nezávislé na FPS.

Health bary správně zobrazují HP.

Zvířata po smrti dropují správné množství masa.

Kůň zůstává ovladatelný a nelovitelný.

Král může zemřít a zobrazí se Game Over.

Fog of War správně skrývá zvířata a health bary.

Stávající mechaniky hry fungují beze změn.

Prioritou je spolehlivý univerzální soubojový systém, nikoliv pokročilá grafika nebo animace."