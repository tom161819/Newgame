krok 7	"Upgrade hry – Fog of War, nastavení a jízda na koni

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o systém Fog of War, zasouvací panel nastavení a možnost jízdy na koni.

DŮLEŽITÉ: Zachovej současnou mapu 100 × 100, osmisměrný pohyb krále, lov zvířat, sbírání surovin, inventář, stavění věží, vstup na věže a Asset Library.

Nezakládej nový projekt a zachovej existující architekturu.

1. Levá zasouvací lišta – Settings

Na levý okraj obrazovky přidej zasouvací panel nastavení.

Požadavky:

Panel se otevírá kliknutím na ikonu ozubeného kola.

Panel lze opět zasunout.

Otevírání a zavírání bude plynule animované.

Panel se zobrazuje nad hrou a nepohybuje se společně s kamerou.

Při kliknutí na panel se nesmí aktivovat pohyb krále nebo interakce s mapou.

Zatím bude obsahovat pouze jedno nastavení:

Fog of War: ON / OFF

Použij vizuální přepínač (toggle switch).

Výchozí stav: OFF.

Volbu ukládej do localStorage, aby zůstala zachovaná po obnovení stránky.

Strukturu panelu připrav pro budoucí další nastavení.

2. Fog of War – viditelnost objektů

Implementuj systém omezeného zorného pole krále.

Při zapnutém Fog of War:

Celý terén mapy zůstává viditelný.

Nezakrývej travnaté ani jiné terénní dlaždice černou mlhou.

Skryj všechny herní objekty mimo aktuální zorné pole krále.

Platí to pro zvířata, kameny, maso, budovy, dekorace a ostatní objekty.

Král je vždy viditelný.

Uživatelské rozhraní a inventář zůstávají vždy viditelné.

Objekty se okamžitě zobrazí po vstupu do zorného pole a skryjí při jeho opuštění.

Skryté objekty nelze kliknutím vybrat ani s nimi zahájit novou interakci.

Skrytí nesmí ovlivňovat skutečný stav objektů. Zvířata se nadále pohybují, suroviny se generují a herní logika běží.

Při vypnutí Fog of War jsou opět viditelné všechny objekty.

Viditelnost vyhodnocuj podle skutečných logických souřadnic mapy, nikoliv podle pixelových souřadnic obrazovky.

Zorné pole nesmí být závislé na pozici kamery ani nastavení zoomu.

3. Zorné pole krále

Základní viditelná oblast krále je 20 × 20 políček, přibližně centrovaná na jeho pozici.

Prozatím používej čtvercovou oblast viditelnosti. Není potřeba implementovat skutečné zastínění výhledu budovami nebo terénem.

Viditelnost se musí aktualizovat při:

Pohybu krále.

Nasednutí nebo sesednutí z koně.

Výstupu na věž a sestupu z věže.

Zapnutí nebo vypnutí Fog of War.

Vzniku nových objektů.

4. Rozhled z věže

Pokud král vyleze na věž, jeho dohled se zvýší o 100 %.

Běžný dohled: 20 × 20 políček.

Dohled z věže: 40 × 40 políček.

Zvýšený dohled platí pouze při zapnutém Fog of War.

Po sestupu z věže se dohled okamžitě vrátí na základní hodnotu.

Věž nemá vlastní trvalé zorné pole. Rozhled poskytuje pouze tehdy, když na ní stojí král.

5. Nové zvíře – Kůň (Horse)

Na mapu přidej jednoho volně žijícího koně.

Kůň se objeví na náhodném volném průchozím políčku.

Bude se samostatně pohybovat po mapě podobně jako ostatní zvířata.

Bude mít vlastní izometrickou grafiku odpovídající stylu hry.

Přidej ho do Asset Library jako horse.

Kůň zatím nebude lovitelný a nebude dropovat maso.

Nesmí procházet budovami ani překážkami.

Pokud je aktivní Fog of War, kůň bude viditelný pouze v zorném poli krále.

6. Nasednutí na koně

Při kliknutí na koně:

Král dostane příkaz dojít ke koni.

Pokud se kůň pohybuje, král bude průběžně aktualizovat cestu k jeho aktuální pozici.

Když se dostane dostatečně blízko, automaticky na koně nasedne.

Král se zobrazí sedící na koni.

Kůň přestane vykonávat vlastní náhodný pohyb.

Kůň a král se budou pohybovat společně jako jedna ovládaná jednotka.

Při neúspěšném nalezení cesty se nasednutí neprovede.

Při kliknutí jinam se dosud nedokončený příkaz k nasednutí zruší.

Zatím není potřeba animovat samotné nasedání. Stačí jednoduchý přechod do stavu jízdy.

7. Jízda na koni

Po nasednutí:

Rychlost pohybu krále se zvýší o 100 % (na dvojnásobek).

Zachovej plynulý osmisměrný pohyb.

Zachovej klikání myší a stávající pathfinding.

Král musí zůstat správně vizuálně umístěn na hřbetě koně.

Připrav možnost pozdějších animací koně a jezdce.

Zatím zachovej možnost sbírání surovin a lovu, aby nebylo nutné měnit další herní systémy.

8. Rozhled při jízdě

Když král jede na koni, jeho zorné pole se zvýší o 50 %.

Pěšky: 20 × 20 políček.

Na koni: 30 × 30 políček.

Na věži: 40 × 40 políček.

Bonusy se prozatím nekombinují, protože král nemůže být současně na koni a na věži.

Při vypnutém Fog of War nemá bonus k viditelnosti žádný vizuální efekt.

9. Sesednutí z koně

Přidej jednoduchou možnost sesednutí:

Při jízdě zobraz v rozhraní tlačítko Dismount.

Přidej také klávesovou zkratku H.

Po sesednutí zůstane kůň stát na nejbližším vhodném volném políčku.

Král se vrátí do běžného režimu pohybu.

Rychlost i dohled se vrátí na základní hodnoty.

Na stejného koně lze později znovu nasednout.

Kůň po sesednutí pokračuje ve svém náhodném pohybu.

Pokud král na koni klikne na věž a chce na ni vylézt, musí nejdříve automaticky sesednout a následně pokračovat standardní interakcí s věží.

Zabraň vzniku duplicitního koně při nasedání a sesedání.

10. Architektura

Přidej nebo rozšiř odpovídající systémy:

FogOfWarSystem – výpočet viditelnosti objektů.

MountSystem – nasedání, jízda a sesedání.

SettingsPanel – levá zasouvací lišta.

VisibilityModifiers – výpočet bonusů dohledu.

Přizpůsob názvy existující struktuře projektu.

Nepřepisuj zbytečně funkční systémy.

Pro dohled používej centrální hodnotu a modifikátory, ne natvrdo zapsané hodnoty rozmístěné v různých souborech.

Optimalizuj Fog of War pro mapu 100 × 100. Není potřeba při každém snímku procházet všech 10 000 políček. Aktualizuj viditelnost při relevantních změnách a efektivně spravuj viditelnost dynamických objektů.

11. Testování

Před úpravami vytvoř Git commit.

Po dokončení ověř:

Levý panel funguje a lze ho zasunout.

Fog of War lze zapnout a vypnout.

Při zapnutém FoW je vidět terén, ale vzdálené objekty jsou skryté.

Král má dohled 20 × 20 políček.

Z věže vidí 40 × 40 políček.

Na koni vidí 30 × 30 políček.

Kůň se pohybuje po mapě a lze na něj nasednout.

Při jízdě je rychlost přesně dvojnásobná.

Sesednutí obnoví normální rychlost i dohled.

Kůň neprochází překážkami.

Stávající sbírání surovin, lov zvěře, věže a inventář zůstávají funkční.

Fog of War nezpůsobuje výrazné zpomalení hry.

Nepřidávej zatím další zvířata, soubojový systém ani nové budovy."
