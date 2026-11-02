krok 8 	"Upgrade hry – Hrad a systém stavění hradeb

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o dvě nové budovy: Castle a Wall.

Zachovej všechny dosavadní herní mechaniky, zejména Fog of War, Asset Library, inventář, pohyb krále, koně, lov zvířat a stavění věží.

1. Hrad (Castle)

Přidej novou budovu do záložky Buildings.

Parametry:

Název: Castle

ID: castle

Rozměry: 3 × 3 políčka

Cena: 10 kamenů

Typ: Building

Možnost vstupu na horní plošinu: Ano

Bonus k dohledu: +75 %

Hrad bude připomínat středověkou kamennou pevnost s vysokými zdmi a horní pochozí plošinou s cimbuřím.

Stavění:

Použij stávající systém umisťování budov.

Zobraz průhledný náhled 3 × 3.

Zeleně označ platné umístění.

Červeně označ neplatné umístění.

Nelze stavět přes existující objekty nebo překážky.

Po postavení odečti 10 kamenů z inventáře.

Interakce:

Kliknutím na postavený hrad král automaticky dojde k dostupnému vstupu.

Následně vyleze na horní plošinu hradu.

Na plošině musí být král vizuálně viditelný.

Při aktivním Fog of War se dohled zvýší z 20 × 20 na 35 × 35 políček.

Po sestupu se dohled vrátí na základní hodnotu.

Pokud je král na koni, před vstupem automaticky sesedne.

Král musí mít možnost z hradu opět slézt.

Při běžném pohybu po zemi hrad představuje neprůchozí překážku.

2. Hradby (Wall)

Přidej novou budovu:

Název: Stone Wall

ID: wall

Rozměry: 1 × 1 políčko

Cena: 1 kámen za jeden segment

Bonus k dohledu při pobytu na hradbě: +75 %

Kategorie: Building

Hradby musí být možné stavět jednotlivě i jako souvislou řadu.

3. Stavění hradeb tažením myší

Po výběru Stone Wall aktivuj režim stavění hradeb.

Ovládání:

Hráč stiskne levé tlačítko myši na počátečním políčku.

Se stisknutým tlačítkem táhne myší po mapě.

Zobrazuje se průhledný náhled celé řady hradeb.

Po uvolnění tlačítka se vytvoří všechny segmenty.

Cena odpovídá počtu nově postavených segmentů.

Příklady:

Zeď dlouhá 5 políček stojí 5 kamenů.

Zeď dlouhá 12 políček stojí 12 kamenů.

Pravidla:

Pro první verzi umožni stavět rovné zdi ve dvou osách logické mapy.

Automaticky zarovnávej linii na izometrickou mřížku.

Každý segment zabírá přesně jedno políčko.

Není možné stavět přes neprůchozí objekty, krále, zvířata ani sběratelné suroviny.

Pokud není dostatek kamenů na celou řadu, zobraz nedostatek surovin a nepostav žádný segment.

Cena se odečte až při úspěšném dokončení celé stavby.

Kliknutím bez tažení lze postavit jediný segment.

ESC nebo pravé tlačítko zruší režim stavění.

4. Automatické propojování hradeb

Jednotlivé segmenty se musí automaticky vizuálně spojovat.

Podporuj:

Rovné úseky.

Koncové segmenty.

Rohy.

Napojení ve tvaru T.

Křížení čtyř segmentů.

Podobu každého segmentu určuj podle sousedních políček.

Při přidání nového segmentu aktualizuj vzhled sousedních segmentů.

Zabraň tomu, aby mezi navazujícími hradbami vznikaly vizuální mezery.

Připrav podporu pro budoucí připojování hradních bran a věží.

5. Pohyb krále po hradbách

Král musí mít možnost vylézt na hradby.

Chování:

Kliknutím na hradbu vydá král příkaz ke vstupu.

Dojde k nejbližšímu dostupnému vstupnímu místu u daného segmentu.

Vyleze na horní pochozí část hradby.

Na hradbě stojí ve správné izometrické výšce.

Může se pohybovat po navazujících segmentech hradeb.

Nesmí přecházet přes mezery mezi nespojenými hradbami.

Po kliknutí na průchozí políčko země nejprve sleze a pokračuje k cíli.

Pro první verzi stačí jednoduchá animace výstupu a sestupu.

Odděl pozemní navigaci od navigace po vyvýšených konstrukcích, aby král neprocházel zdmi nebo se neteleportoval na jejich vrchol.

Počet kamenů potřebných ke stavbě není nijak ovlivněn možností výstupu na hradby.

6. Fog of War a výška

Zachovej současný systém viditelnosti.

Nastav dohled podle pozice krále:

Král pěšky: 20 × 20 políček.

Král na koni: 30 × 30 políček.

Král na stávající věži: 40 × 40 políček.

Král na hradě: 35 × 35 políček.

Král na hradbách: 35 × 35 políček.

Bonus se uplatní pouze tehdy, když král skutečně stojí na horní plošině příslušné stavby.

Při vypnutém Fog of War jsou všechny objekty viditelné bez omezení.

Bonusy se nesčítají.

7. Asset Library

Přidej nové definice objektů:

castle

wall

Oba objekty musí být dostupné v Asset Library i v nabídce Buildings.

Používej centrální definice ceny, rozměrů, grafiky a interakcí.

Připrav grafické soubory tak, aby bylo možné později snadno nahradit náhradní grafiku profesionálními izometrickými sprity.

8. Testování

Před úpravami vytvoř Git commit.

Ověř:

Hrad stojí 10 kamenů a zabírá 3 × 3 políčka.

Král může na hrad vylézt a slézt.

Na hradě má správný bonus dohledu.

Tažením myší lze vytvořit rovnou zeď.

Cena zdi odpovídá počtu postavených segmentů.

Hradby se správně graficky propojují.

Král může chodit po souvislé řadě hradeb.

Při pobytu na hradbách získává +75 % dohledu.

Pozemní pathfinding respektuje všechny nově postavené překážky.

Stavění funguje správně i při změně zoomu a pozice kamery.

Stávající systémy hry fungují beze změn.

Dbej na správné izometrické vykreslování, pořadí překryvů a oddělení herní logiky od grafiky.

Nepřidávej zatím další typy budov ani bojový systém."