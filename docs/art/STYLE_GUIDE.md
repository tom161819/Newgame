# Style Guide — Medieval Kingdom

Strojově čitelný zdroj pravdy je [`art/style-guide.json`](../../art/style-guide.json). Tento text vysvětluje jeho pravidla. Asset Studio ho zobrazuje v záložce **Style guide** a všechny generátory z něj berou barvy, materiály, světlo i měřítko. Číselnou hodnotu měň v JSON, ne tady.

## Vizuální styl

Malovaná izometrie ve stylu předrenderovaných 3D strategií: zvětralý kámen, teplé dřevo, tlumené zemité barvy, jedno slunce zleva zepředu. Nejdřív čitelná silueta, potom textura. Žádné černé obrysy; objekty od sebe odděluje kontrast osvětlených stěn.

## Kamera a projekce

| Pravidlo | Hodnota |
|---|---|
| Projekce | dimetrická 2:1, shodná s `src/game/isometric.js` |
| Políčko | kosočtverec 64 × 32 px |
| Výška kamery | 30° (čtverec políčka se promítne přesně na 2:1) |
| Azimut | 45°; mřížka x vede doprava dolů, mřížka y doleva dolů |
| Jednotka | 1 jednotka = hrana jednoho políčka |
| Pixely | 45,255 px na jednotku po zemi, 39,192 px na jednotku výšky |
| Kotva | střed půdorysu na zemi; v Phaseru `setOrigin(anchor.x / width, anchor.y / height)` |

Shodu studia s hrou kontroluje test `tests/asset-studio.test.js`.

## Měřítko

| Objekt | Výška (jednotky) | Pixely při 1× |
|---|---|---|
| Člověk | 1,2 | 47 |
| Dveře | 0,95 | 37 |
| Patro | 1,0 | 39 |
| Věž | 3,2–4,8 | 125–188 |
| Dům | 1,6–2,8 | 63–110 |
| Hradba | 1,4–2,0 | 55–78 |
| Strom | 1,6–3,6 | 63–141 |
| Surovina | 0,15–0,6 | 6–24 |

Půdorys budovy nechává od okraje políček rezervu 0,08 jednotky. Kromě stínu nesmí půdorys nic přesahovat; výjimkou jsou koruny stromů, které smějí přesáhnout až o 0,3 jednotky (`scale.canopyOverhang`). Kmeny přesahovat nesmějí. Úseky hradeb vyplňují celé políčko ve směru zdi, aby na sebe navazovaly. Generátory to hlídají a validace to testuje.

## Paleta a materiály

Používej jen barvy z palety. Novou barvu nejdřív přidej do `palette`, teprve potom ji použij v materiálu.

| Materiál | Použití | Textura |
|---|---|---|
| `stone`, `stone_light`, `stone_dark` | zdi, obklady, sokly | cihly ~0,3 × 0,15 jednotky |
| `plaster` | výplň hrázdění | jemný šum |
| `rock` | skály, stěny lomů | šum |
| `bark`, `foliage`, `foliage_light`, `foliage_dark`, `pine_needles` | kmeny a koruny; světlejší listí na slunné straně | šum / prkna |
| `wood`, `wood_dark` | ochozy, dveře, trámy, sloupy | prkna ~0,17 jednotky |
| `roof_shingle`, `roof_tile`, `thatch` | střechy | šindele / došky |
| `iron` | kování, koše, pánve | bez textury |
| `opening` | střílny, okna | tmavá výplň |
| `banner` | korouhve | bez textury |

Textury jsou šedotónové a násobí se barvou materiálu, takže všechny kameny ve hře mají stejné měřítko detailu.

## Světlo, stín a detail

- Jedno slunce zleva zepředu. Levá přední stěna je nejsvětlejší, pravá přední polotónová, střechy chytají nejvíc světla.
- Stín padá dozadu doprava a je zapečený ve spritu s krytím 32 %.
- Nejmenší čitelný detail má při 1× aspoň 3 px. Raději dvě až tři výrazné hmoty než mnoho drobností.

## Den, soumrak a noc

Sprity nesou jen denní osvětlení. Denní doba se aplikuje za běhu pomocí světelné mapy:

1. Mapa se vyplní okolní barvou (den `#ffffff`, soumrak `#d79f7d`, noc `#34406b`).
2. Každý zdroj světla se přičte jako barevný radiální přechod (`lighter` / `BlendModes.ADD`).
3. Mapa se vynásobí přes scénu (`multiply` / `BlendModes.MULTIPLY`).
4. Plameny se kreslí až potom, aby zůstaly jasné.

Pro žádný asset se proto nekreslí zvláštní noční verze. Zdroje světla (`torch`, `brazier`) mají barvu, poloměr v políčkách, intenzitu a mihotání. Pozice světel vrací generátor a exportují se v metadatech spritu.

## Animace

- 8 snímků za sekundu, smyčky 4–12 snímků bez skoku.
- Animované části (plamen, kouř, korouhev) jsou samostatné vrstvy se stejnou kotvou. Budovy jsou statické.
- Jednotky mají osm směrů se stejnou projekcí a světlem jako budovy.
