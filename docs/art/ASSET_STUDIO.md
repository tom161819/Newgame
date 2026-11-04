# Asset Studio

Samostatná webová aplikace pro tvorbu, porovnání a schvalování izometrické grafiky. Běží celá v prohlížeči bez backendu a hru nijak nemění: má vlastní Vite konfiguraci (`studio/vite.config.js`), vlastní výstup `dist-studio/` a hra z ní nic neimportuje (hlídá test).

| Příkaz | Účel |
|---|---|
| `npm run studio` | vývojový server studia |
| `npm run studio:build` | produkční build do `dist-studio/` s relativními cestami |
| `npm run studio:export` | vyrenderuje všechny varianty do `art/sprites/` (PNG + JSON) |
| `npm run studio:smoke` | build a prohlížečový test celého studia včetně Phaser dema |

Studio má tři pohledy: **Assets** (galerie, porovnání variant, scéna, specifikace), **Style guide** a **Phaser demo**.

## Jak grafika vzniká

1. **Specifikace** `art/assets/<kategorie>/<id>/asset.json`: ID, název, kategorie, půdorys, generátor a varianty. Každá varianta má `id`, `name`, `version`, poznámky a `spec`, tedy parametry vzhledu.
2. **Generátor** `studio/src/generators/<generátor>.js`: čistá funkce, která ze `spec` sestaví jednoduché 3D tvary (kvádry, válce, jehlany) s materiály ze Style Guide a body světel.
3. **Renderer** `studio/src/render/spriteRenderer.js`: Three.js s ortografickou kamerou v přesné herní projekci. Zapeče denní světlo a stín, ořízne sprite a spočítá kotvu i pozice světel.
4. **Kompozitor** `studio/src/render/compositor.js`: mřížka, půdorys, člověk pro měřítko, testovací mapa a světelná mapa pro soumrak a noc.

Volba: předrenderované 3D místo ručního SVG. Projekce, světlo i měřítko pak vycházejí z jedné definice a sto assetů vypadá jako jedna hra. Three.js je jen nástroj studia a do hry se nedostává.

## Nový asset

1. Vytvoř `art/assets/<kategorie>/<id>/asset.json`. Kategorie: `buildings`, `units`, `trees`, `nature`, `resources`, `decorations`. ID varianty musí začínat `<id>-`.
2. Pokud se tvar hodí k existujícímu generátoru (např. `watchtower`), jen změň parametry `spec`. Seznam parametrů ukazuje záložka **Spec & files**.
3. Pro nový druh objektu přidej `studio/src/generators/<nový>.js` (export `{ id, version, label, params, build }`) a zaregistruj ho v `studio/src/generators/index.js`. Používej jen materiály ze Style Guide a nech objekt uvnitř půdorysu.
4. Spusť `npm test`. Validace ohlásí neznámé materiály, přesah půdorysu nebo duplicitní ID.
5. Spusť `npm run studio:export` a commitni vzniklé soubory v `art/sprites/`. Test kontroluje, že každý export odpovídá aktuálnímu hashi specifikace.
6. Otevři studio a porovnej varianty.

Při jakékoli změně `spec` zvyš `version` varianty. Při změně kódu generátoru zvyš jeho `version`. Dřívější schválení se pak zobrazí jako **Outdated** a test vynutí nový export.

## Výběr a schválení varianty

1. V záložce **Compare variants** porovnej varianty vedle sebe: zoom 0,5–4×, pozadí, mřížka, půdorys, ohraničení s rozměry v pixelech, člověk 1,2 jednotky, přepínač *Game pixels* (přesně 1×) a denní doba.
2. V záložce **Scene & lighting** zkontroluj varianty na testovací mapě s pochodněmi ve dne, za soumraku a v noci.
3. U zvolené varianty klikni na **Approved**. Studio zapíše stav, verzi, hash specifikace a čas schválení a variantu označí jako **Preferred**. Hvězdičkou lze preferovanou variantu změnit.
4. Toto rozhodnutí je zatím **jen lokální**, uložené v tomto prohlížeči (localStorage). Studio ho označuje „Local, not committed“ a do GitHubu nic neposílá.
5. Trvalé schválení: **Export review** → *Copy JSON* nebo *Download approvals.json* → na GitHubu otevři `art/approvals.json`, vlož obsah, ulož do nové větve a otevři pull request. Po merge studio i Phaser demo zobrazí schválení z repozitáře.

Stavy: **Draft** (rozpracováno), **Review** (k posouzení), **Approved** (schváleno pro hru). *Discard local review* (dvě kliknutí) zahodí jen lokální rozhodnutí.

## Použití schváleného spritu ve Phaseru

Ukázka je v `studio/src/demo/phaser-demo.js` (stránka **Phaser demo**). Herní objekty nemění.

```js
// preload
this.load.image('watchtower-round@v1', 'assets/generated/watchtower/watchtower-round.v1.png');
// create: meta = obsah watchtower-round.v1.json
const centre = gridToWorld(x + meta.footprint.width / 2, y + meta.footprint.height / 2);
this.add.image(centre.x, centre.y, 'watchtower-round@v1')
  .setOrigin(meta.origin.x, meta.origin.y)   // kotva = střed půdorysu na zemi
  .setDepth(centre.y);                       // stejné řazení jako dnešní budovy
// světla: centre + (light.x - meta.anchor.x, light.y - meta.anchor.y)
```

### Převzetí schváleného assetu do hry

Takto se do hry dostala věž `watchtower-square` a pánev `torch-post-brazier`:

1. Zapsat schválení do `art/approvals.json` (stav `approved`, `preferred`, `specHash`).
2. Zkopírovat `art/sprites/<asset>/<varianta>.v<verze>.png` a případnou `.front.png` beze změny do `public/assets/buildings/<objekt>/`.
3. V definici objektu (`src/data/objects/`) nastavit hodnoty z metadat exportu:
   - `sprite` a `frontSprite`, `renderMode: 'sprite'`;
   - `origin` (a `frontOrigin`) = `baseOrigin`, protože hra kotví budovy v předním rohu půdorysu, ne ve středu;
   - `visualHeight`, `platform` (u budov s plošinou) a `lights` = `gameLights`;
   - `artSource` = cesta k JSON metadatům.
4. Test `tests/asset-studio.test.js` hlídá, že soubory ve hře jsou bajtově shodné se schváleným exportem a hodnoty odpovídají metadatům. Změna ve studiu bez nového převzetí tak neprojde.

**Přední vrstva** (`.front.png`): části označené v receptu `layer: 'front'` (např. přední cimbuří) se exportují zvlášť. Hra je kreslí nad jednotkou na plošině, takže král stojí uvnitř hradeb.

**Světla:**
- Budova s `lights` má za běhu plamen (`src/game/LitBuildingView.js`).
- Všechna světla jsou dostupná přes `scene.lightSources.lights()` (`src/systems/LightSourceSystem.js`).
- Až hra dostane noc, stačí je vykreslit do světelné mapy podle postupu níže.

### Den/noc ve hře

- **WebGL:** `RenderTexture` vyplněná okolní barvou, `stamp()` světelných textur s `BlendModes.ADD`, `render()` a zobrazení s `BlendModes.MULTIPLY`.
- **Canvas** (výchozí renderer hry): Phaser 4.2.1 zjišťuje podporu `multiply` asynchronně, ale tabulku režimů prolnutí sestaví hned při startu. `BlendModes.MULTIPLY` proto v Canvasu tiše funguje jako normální kreslení. Demo to opravuje synchronním testem (`enableCanvasMultiply`) a světelnou mapu kreslí do `CanvasTexture`. Stejnou opravu bude potřebovat i hra, až dostane noc.

## Náhled a nasazení

- Build používá relativní cesty a funguje z libovolné podcesty, například `/Newgame/studio/`. Smoke test ho servíruje právě tam a blokuje všechny požadavky mimo vlastní soubory.
- Studio je na GitHub Pages na adrese **https://tom161819.github.io/Newgame/studio/** (Phaser demo na `.../studio/phaser-demo.html`).
- Workflow `.github/workflows/pages.yml` ho nasazuje takto:
  1. Až po všech kontrolách hry ho sestaví (`npm run studio:build`).
  2. Otestuje ho (`scripts/studio-smoke.mjs`).
  3. Zkopíruje ho do `dist/studio/`.

  Když smoke studia selže, nenasadí se nic. Hra ani archivy se tím nemění.

## Omezení MVP

- Generátory: `watchtower`, `torch-post`, `house`, `tree` (dub, borovice), `wall` (kamenná hradba, palisáda), `quarry`. Jednotky a animace postav zatím nemají recept.
- Animovaný je jen plamen, a to procedurálně v kompozitoru. Snímky animací se zatím neexportují.
- Export je deterministický v jednom prostředí. Jiný prohlížeč nebo GPU může dát drobně odlišné pixely, proto je autoritou commitnutý PNG.
- Schválení do repozitáře vyžaduje ruční krok přes GitHub (vložit JSON a otevřít PR). Studio nemá token a na GitHub nezapisuje.
- Současné herní sprity jsou v galerii jen pro porovnání. Některé objekty hra kreslí procedurálně a jejich obrázek je jen náhled z knihovny.
