# Medieval Kingdom | Keře a křoviska
## Výběr souborů pro hru
- **puvodni_nazvy/** obsahuje 46 náhradních průhledných PNG. Zachovávají původní složky, názvy a pixelové rozměry dodané sady. Obrázek je do původního rámečku vepsaný bez deformace. Pro přiřazení nového kotevního bodu je v original_map.json uvedený replacement_origin_px relativně k levému hornímu rohu.
- **assets/** obsahuje kompletní sadu. Každý model má čtyři období a v každém čtyři pohledy (000, 090, 180, 270). Ve složkách 1x jsou herní verze pro políčko široké 64 px, vedle nich detailnější rendery. sprite.json udává společnou kotvu origin_px a rozměry jednotlivých směrů v 1x. Pro vyšší rozlišení je společná kotva pod origin. U houštin určuje footprint počet obsazených polí ve směrech os X a Y. Kotevní bod leží ve středu půdorysu na zemi.
- **original_map.json** propojuje každý z původních 46 obrázků s modelem, sezónou a směrem. Sezónní soubor druhu bez čísla varianty používá keř č. 2. Když hra uchovává číslo varianty, může se po celý rok držet stejného modelu č. 1, 2 nebo 3. Výchozí sezóna dekorací je léto. Samostatné podzimní a zimní názvy houštin odkazují na smíšenou variantu.
- **Houstiny_mrizka.png** ukazuje tři půdorysy ve všech směrech při společném herním měřítku. **Kere_obdobi.png** zvětšuje devět typů keřů pro kontrolu detailů. **Nahrady_46.png** porovnává původní obrázky s odpovídajícími náhradami.

## Modely
15 malých keřů je rozděleno do pěti druhů po třech variantách. Čtyři dekorace mají vlastní modely. Pro půdorysy 2 × 1, 2 × 2 a 3 × 2 existují houštiny ostružiníku, lísky a směsi s jalovcem. Celkem 28 modelů a 448 pohledů v každém výstupním rozlišení. Olistění, květy, plody a poprašek tvoří sezónní vrstvy nad stálým větvením. Zimní jalovec zůstává ojehlený a šípek si ponechává část plodů. Geometrie houštin je omezena hranicemi příslušného obdélníku.

## Opakované vykreslení
Ve složce balíčku použijte Blender a Python s Pillow. Základní scéna má 16 snímků: čtyři směry pro jaro, poté léto, podzim a zimu. Kamera je ortografická, azimut prvního pohledu −45°, elevace 35,264°. Každé další období používá stejné čtyři pozice kamery a stejné světlo.
```sh
blender -b assets/shrubs-hazel-2/model.blend --python-exit-code 1 -P render.py
python export.py
```
Kompletní přestavba ze zdrojů v prostředí Bash:
```sh
while read -r model; do
  blender -b --python-exit-code 1 -P build.py -- "$model" || exit 1
done < models.txt
for footprint in 2x1 2x2 3x2; do
  blender -b "assets/thicket-$footprint-hazel/model.blend" --python-exit-code 1 -P mixed.py || exit 1
done
python export.py
```
Modelové a sezónní jednotky zachovávají své souřadnice. Před použitím v herním enginu zvolte buď 46 verzí se zachovanými rozměry, nebo jednotné herní měřítko 1x s registračními údaji. Původní bitmapy neobsahovaly kotevní body herního enginu.
