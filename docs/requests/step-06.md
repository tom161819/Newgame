krok 6	"Upgrade hry – Lov zvěře, maso a spotřeba potravy

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o divoká zvířata, systém lovu, dropování masa a pravidelnou spotřebu potravy.

DŮLEŽITÉ: Zachovej všechny stávající funkce hry, zejména pohyb krále v 8 směrech, sbírání kamenů, stavění věží, inventář, kameru, izometrickou mapu 100 × 100 a Asset Library.

Nezakládej nový projekt.

1. Nová zvířata na mapě

Při spuštění hry náhodně rozmísti:

3× zajíc (Rabbit)

3× srna (Deer)

3× divočák (Wild Boar)

Celkem tedy 9 zvířat.

Každé zvíře:

Má vlastní grafický sprite v izometrickém 2.5D stylu.

Je registrované v Asset Library jako kategorie animal.

Spawnuje se pouze na volných průchozích políčkách.

Nesmí vzniknout na budovách, překážkách nebo na pozici krále.

Má vlastní ID instance a definici typu zvířete.

Pokud zatím nejsou dostupné obrázky, vytvoř jednoduchou rozpoznatelnou náhradní grafiku.

2. Pohyb zvířat

Zvířata se budou samostatně pomalu pohybovat po mapě.

V náhodných intervalech si vyberou nedaleký cíl.

K pohybu použij existující osmisměrný systém navigace.

Zvířata nesmí procházet budovami ani překážkami.

Mezi pohyby se budou náhodně zastavovat.

Zatím neimplementuj útěk před králem ani agresivní chování.

Zvířata se mohou pohybovat i mimo aktuálně viditelnou oblast mapy, ale aktualizace musí být výkonově efektivní.

3. Lov zvířat

Po kliknutí levým tlačítkem na zvíře:

Král dostane příkaz zvíře ulovit.

Automaticky se k němu vydá.

Pokud se zvíře mezitím přesune, král aktualizuje cestu k jeho aktuální pozici.

Jakmile je král na sousedním políčku zvířete v dosahu útoku, provede útok.

Útok je zatím okamžitě smrtící (instant kill).

Zvíře zmizí z mapy.

Na místě smrti vznikne předmět – maso.

Zatím nepřidávej HP, poškození, brnění, zbraně ani skutečný soubojový systém.

Připrav ale samostatnou funkci pro útok, aby bylo možné později snadno doplnit bojové statistiky.

Pokud hráč klikne na jiné místo, aktuální příkaz k lovu se zruší.

Pokud zvíře není dostupné, král se k němu nesmí teleportovat ani procházet překážkami.

4. Odměna za lov

Za každé ulovené zvíře vznikne na zemi jeden sebratelný balíček masa.

Zvíře

Množství masa

Zajíc

5

Srna

10

Divočák

15

Příklad: po ulovení divočáka se na zemi objeví balíček masa s hodnotou 15.

Maso se nesmí automaticky přičíst do inventáře po zabití zvířete.

5. Sbírání masa

Maso se zobrazí jako malý balíček nebo kus masa na zemi.

Při najetí myší zobraz informaci, například Meat ×15.

Kliknutím na maso král automaticky dojde k balíčku.

Po dosažení cíle maso sebere.

Balíček zmizí z mapy.

Do inventáře se přičte jeho skutečné množství.

Maso může zůstat ležet na zemi neomezeně dlouho.

Pokud na jednom místě vznikne více balíčků, umožni jejich sloučení do jednoho s odpovídajícím množstvím.

Použij obecný systém dropů, který bude možné později využít také pro dřevo, zlato nebo jiné suroviny.

6. Inventář – maso

Do horní lišty přidej novou surovinu:

Meat: 0

Zobraz malou ikonu masa a aktuální množství.

Inventář musí stále obsahovat kameny.

Kameny a maso musí být evidovány jako samostatné typy surovin ve stávajícím inventářovém systému.

7. Spotřeba potravy

Implementuj jednoduchý systém spotřeby masa.

Každých 60 sekund herního času se z inventáře odečte 1 maso.

Časovač začne běžet při spuštění hry.

Spotřeba probíhá bez ohledu na pohyb krále.

Pokud je v inventáři 0 masa, množství zůstane na nule.

Inventář nesmí nikdy obsahovat záporný počet masa.

Na horní liště zobraz jednoduchý odpočet do další spotřeby, například Food: 00:42.

Když maso dojde, zobraz nenápadné upozornění Out of food.

Nedostatek masa zatím nezpůsobuje smrt, ztrátu HP ani jiné penalizace.

Časovač nesmí být závislý na FPS a při poklesu výkonu se nesmí spouštět vícekrát omylem.

8. Integrace do Asset Library

Do centrálního Object Registry přidej nové definice:

rabbit

deer

wild_boar

meat

U zvířat eviduj mimo jiné:

ID a název.

Kategorii animal.

Cestu ke grafice.

Rychlost pohybu.

Typ chování wander.

Množství dropovaného masa.

Možnost lovu.

U masa eviduj:

ID a název.

Kategorii resource.

Ikonu a sprite.

Možnost sebrání.

Množství uložené v konkrétní instanci dropu.

Galerie Asset Library musí nové objekty automaticky zobrazovat.

9. Architektura pro budoucí bojový systém

Odděl následující funkcionality:

AnimalSystem – spawn a chování zvířat.

HuntingSystem – zaměření zvířete, pronásledování a útok.

DropSystem – vznik a sbírání předmětů na zemi.

FoodSystem – pravidelná spotřeba masa.

Přizpůsob názvy existující architektuře projektu a nevytvářej duplicitní systémy.

Do budoucna počítej s možností přidat HP, útok, obranu, různé druhy nepřátel a agresivní chování.

Zatím tyto mechaniky neimplementuj.

10. Testování

Před většími úpravami vytvoř Git commit funkční verze.

Ověř:

Na začátku vzniknou přesně 3 zajíci, 3 srny a 3 divočáci.

Zvířata se pohybují po mapě bez průchodu překážkami.

Král může kliknutím zvíře pronásledovat a ulovit.

Zajíc dropuje 5 masa, srna 10 a divočák 15.

Maso se přičte až po skutečném sebrání ze země.

Každých 60 sekund se odečte přesně 1 maso.

Množství masa nikdy neklesne pod nulu.

Lov, sbírání kamenů, stavění věží i vstup do věží fungují současně.

Nové objekty se správně zobrazují v Asset Library.

Hra zůstává plynulá na mapě 100 × 100.

Zachovej stávající funkční mechaniky a neopravuj nebo nepřepisuj části projektu, kterých se tento upgrade netýká."
