Upgrade hry – Univerzální knihovna objektů (Asset Library)

Rozšiř stávající izometrickou 2.5D hru vytvořenou ve Phaseru o univerzální systém správy herních objektů.

Hlavní cíl: Vytvořit přehlednou a rozšiřitelnou strukturu, do které bude možné jednoduše přidávat nové budovy, suroviny, postavy, dekorace a typy terénu.

Nezakládej nový projekt. Zachovej všechny existující herní mechaniky, včetně pohybu krále v 8 směrech, sbírání kamenů, inventáře, stavění věží, vstupu do věží a izometrické mapy 100 × 100.

1. Struktura grafických souborů

Vytvoř následující adresářovou strukturu:

public/
└── assets/
    ├── terrain/
    │   ├── grass/
    │   ├── dirt/
    │   └── water/
    ├── resources/
    │   ├── stone/
    │   ├── wood/
    │   └── iron/
    ├── buildings/
    │   └── tower/
    ├── characters/
    │   └── king/
    └── decorations/
        ├── trees/
        └── bushes/

src/
├── data/
│   └── objects/
│       ├── terrain.js
│       ├── resources.js
│       ├── buildings.js
│       ├── characters.js
│       └── decorations.js
├── systems/
│   ├── AssetManager.js
│   └── ObjectRegistry.js
└── ui/
    └── AssetGallery.js

Přizpůsob strukturu existujícímu projektu tak, aby nevznikaly duplicitní systémy.

2. Univerzální definice objektů

Každý objekt musí mít vlastní definici s následujícími vlastnostmi:

id – unikátní identifikátor objektu.

name – název zobrazovaný hráči.

category – terrain, resource, building, character nebo decoration.

sprite – cesta k obrázku.

width a height – rozměry objektu v políčkách mapy.

walkable – zda je objekt průchozí.

collectible – zda lze objekt sebrat.

buildable – zda může hráč objekt postavit.

cost – cena v surovinách.

interactions – seznam dostupných interakcí.

description – krátký popis objektu.

Umožni také volitelné parametry pro animace, kotvicí body sprite, vizuální výšku, stíny a pořadí vykreslování.

Příklad definice věže:

{
  id: "tower",
  name: "Stone Tower",
  category: "building",
  sprite: "/assets/buildings/tower/tower.png",
  width: 2,
  height: 2,
  walkable: false,
  collectible: false,
  buildable: true,
  cost: {
    stone: 10
  },
  interactions: ["enter", "exit"],
  description: "Kamenná strážní věž"
}

3. Object Registry

Vytvoř centrální registr všech herních objektů.

Musí umožňovat:

Registraci objektů podle jejich ID.

Získání definice objektu podle ID.

Filtrování objektů podle kategorií.

Automatické sestavení seznamu dostupných budov.

Načtení informací pro galerii objektů.

Kontrolu duplicitních ID a neplatných definic.

Herní systémy budou používat definice objektů namísto natvrdo zapsaných parametrů.

Například cena věže 10 kamenů se bude načítat z její definice, nikoliv z několika různých míst v kódu.

4. Asset Manager

Vytvoř systém správy grafických souborů.

Požadavky:

Načítání obrázků podle definic objektů.

Podpora PNG, WebP a spritesheetů.

Správné nastavení origin bodu izometrických objektů.

Podpora animací postav.

Zobrazení náhradní grafiky, pokud obrázek chybí.

Chybějící asset nesmí způsobit pád hry.

Možnost pozdější výměny obrázků bez změny herní logiky.

Zachovej efektivní načítání a nevytvářej samostatnou texturu pro každou instanci stejného objektu.

5. Vizuální galerie objektů

Přidej do hry nové tlačítko Asset Library.

Po kliknutí se otevře přehledná galerie všech registrovaných objektů.

Galerie bude obsahovat:

Kategorie: Terrain, Resources, Buildings, Characters, Decorations.

Náhled obrázku každého objektu.

Název objektu.

Rozměry v políčkách mapy.

Informaci, zda je průchozí, sběratelný nebo postavitelný.

Cenu, pokud jde o budovu.

Popis a dostupné interakce.

Po kliknutí na objekt zobraz jeho detailní informace.

Galerie bude zatím pouze pro prohlížení, nebude umožňovat upravování objektů ani jejich libovolné vkládání do hry.

6. Napojení na současnou hru

Převeď současné objekty do nové struktury:

Král – Character.

Kámen – Resource.

Kamenná věž – Building.

Tráva a ostatní existující terén – Terrain.

Existující překážky a dekorace – odpovídající kategorie.

Zachovej:

Sbírání kamenů a jejich respawn každých 20 sekund.

Inventář na horní liště.

Stavění věží přes spodní nabídku Buildings.

Cenu věže 10 kamenů.

Rozměr věže 2 × 2 políčka.

Vstup a výstup krále z věže.

Osmisměrný pohyb a pathfinding.

Správné izometrické vykreslování a kameru.

Nabídka Buildings musí automaticky zobrazovat objekty z registru, které mají buildable: true.

7. Příprava na rozšíření

Navrhni strukturu tak, aby bylo později možné přidat novou budovu nebo surovinu vytvořením její definice a vložením grafického souboru.

Nepřidávej zatím nové herní mechaniky, inventářové systémy ani editor mapy.

Připrav dokumentaci ASSET_GUIDE.md, která vysvětlí:

Jak přidat nový objekt.

Kam vložit jeho obrázek.

Jak nastavit rozměry a vlastnosti.

Jak přidat budovu do nabídky Buildings.

Jak přidat animovanou postavu.

Jak správně nastavit izometrický sprite a jeho kotvicí bod.

8. Testování a dokončení

Před úpravami vytvoř Git commit současného funkčního stavu.

Po implementaci ověř, že:

Všechny stávající objekty fungují.

Galerie zobrazuje registrované objekty.

Chybějící obrázek nezpůsobí pád hry.

Cena věže se načítá z registru.

Nové definice objektů jsou snadno rozšiřitelné.

Hra si zachovala původní výkon a funkčnost.