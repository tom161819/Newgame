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

1. Vytvoř `art/assets/<kategorie>/<id>/asset.json`. Kategorie: `buildings`, `units`, `terrain`, `trees`, `nature`, `resources`, `decorations`. ID varianty musí začínat `<id>-`.
2. Pokud se tvar hodí k existujícímu generátoru (např. `watchtower`), jen změň parametry `spec`. Seznam parametrů ukazuje záložka **Spec & files**.
3. Pro nový druh objektu přidej `studio/src/generators/<nový>.js` (export `{ id, version, label, params, build }`) a zaregistruj ho v `studio/src/generators/index.js`. Používej jen materiály ze Style Guide a nech objekt uvnitř půdorysu.
4. Spusť `npm test`. Validace ohlásí neznámé materiály, přesah půdorysu nebo duplicitní ID.
5. Spusť `npm run studio:export` a commitni vzniklé soubory v `art/sprites/`. Test kontroluje, že každý export odpovídá aktuálnímu hashi specifikace.
6. Otevři studio a porovnej varianty.

Při jakékoli změně `spec` zvyš `version` varianty. Při změně kódu generátoru zvyš jeho `version`. Dřívější schválení se pak zobrazí jako **Outdated** a test vynutí nový export.

## Terén: tráva, cesty a zarůstání (2D recepty)

Povrch hry je plochá textura dlaždic 64 × 32 px, proto ho nekreslí 3D renderer, ale 2D recept `ground` (`studio/src/generators/ground.js`, `kind: 'surface'`, čisté výpočty v `studio/src/lib/surface.js`).

- **`grass-ground`**: sady zaměnitelných dlaždic trávy (úroveň opotřebení 0). Barevné pole je periodický šum sdílený všemi dlaždicemi sady, takže na sebe navazují bez švů v libovolné kombinaci; detaily dlaždice k okrajům slábnou. Parametry: odstíny, kontrast skvrn, hustota a výška stébel v trsech, kvítí.
- **`worn-path`**: stupně 1–3 vyšlapané cesty (`src/data/pathWear.js`). Každý stupeň má barvu, okraj, plochu, podíl zbylé trávy, šířku spojovacího pásu a měkkost okraje. Náhled ukazuje pás, který se vyšlape až na hlínu a pak zase zarůstá; hra už opotřebení i zarůstání počítá, mění se jen vzhled.
- Pravidla jsou ve Style Guide (`terrain`) a hlídá je validace: každý stupeň je tmavší než předchozí, barvy zůstávají tlumeně zelené až hnědé (chroma ≤ 0,24, žádný oranžový ani červený tón). Dnešní herní barvy cest (#a2a06c, #a78d5c, #a58353) tímto pravidlem neprojdou, proto je studio nabízí k nahrazení.
- Export: kromě náhledu `<varianta>.v<verze>.png` vznikne `<varianta>.v<verze>.tiles.png`, jeden řádek herních dlaždic 64 × 32. U trávy jde o zaměnitelné dlaždice, u cesty o úrovně 0–3. Metadata (`surface`) obsahují počet snímků a pro cesty `gameWear` = `color`, `edge`, `width` pro `wearSurfaces` v `src/data/objects/terrain.js`.
- Záložka **Scene & lighting** pokryje celou testovací mapu dlaždicemi variant (u trávy pruhy vedle sebe, u cest jeden pás na variantu).

**Příprava ve hře** (bez změny vzhledu, dokud se nic neschválí):
- terénní objekt smí mít `spriteVariants` (až 8 cest k obrázkům). `AssetManager` je načte jako vrstvy `variant-<i>` a `TerrainRenderer` vybere variantu podle hashe dlaždice;
- `visual.pathSoftness` u `wearSurfaces` přidá spojovacímu pásu měkký okraj (stejně jako náhled ve studiu).

Export ukládá každou dlaždici i zvlášť (`<varianta>.v<verze>.tile-<i>.png`), aby hra dostala bajtově shodné kopie. **Ve hře** od 4. 11. 2026 (schválil vývojář): `grass_normal` = `grass-ground-lush` (4 dlaždice ve `spriteVariants`), `grass_trampled_1..3` = dlaždice 1–3 z `worn-path-moss` a jeho `gameWear` s `pathSoftness: 2`. Hlídá to test v `tests/asset-studio.test.js`. TerrainRenderer ořezává dlaždici o 0,8 px za kosočtverec, aby mezi dlaždicemi nebyly světlé švy.

## Postavy podle profese

Recept `figure` (`studio/src/generators/figure.js`) skládá postavu z nízkopolygonových tvarů: boty, nohavice nebo dlouhá sukně, tunika, opasek, ruce, hlava, vlasy, vousy, pokrývka hlavy, zástěra a nástroj či náklad. Všechny barvy jsou látky a kůže ze Style Guide (`cloth_*`, `leather`, `skin*`, `hair_*`).

- `art/assets/units/<profese>/asset.json`: villager, woodcutter, miner, hunter, builder, farmer, miller, baker, hauler, soldier; každá má variantu muže a ženy.
- Profese se pozná podle tří znaků zároveň: pokrývka hlavy, nástroj nebo náklad, hlavní barva oděvu (pravidlo `units` ve Style Guide). Test hlídá, že žádné dvě profese nejsou jen přebarvený klon a že postavy mají lidské měřítko 1,2 jednotky v jedné dlaždici.
- Nové profese a barevné varianty vznikají jen úpravou `spec` (parametry ukazuje záložka **Spec & files**).
- Hra zatím kreslí jednu postavu poddaného (`peasant`). Návrhy jsou ve stavu Draft. Až budou schválené, bude potřeba převzít sprity a vybírat je podle profese a pohlaví pracovníka; animace chůze a práce zatím recept nemá.

## Stavba: lešení a prach

- Hra kreslí lešení až po první odpracované práci (`scaffoldStage` v `src/game/ConstructionDust.js`, `workDone > 0`), tedy když na stavbu dorazí stavitel a začne pracovat. Do té doby je vidět jen průhledný plán. Lešení pak roste se třemi fázemi postupu.
- Při aktivní práci (stavba v daném snímku postoupila) stoupá jemný prach (`DustEmitter`): nejvýš jeden obláček za 240–520 ms, nejvýš 6 na stavbu a 48 v celé hře. Obrázky se recyklují, skryté stavby žádné obláčky nemají a při `prefers-reduced-motion` je prach vypnutý.
- Podobu lešení navrhuje recept `scaffold` (`art/assets/buildings/scaffold`): fáze low/mid/high podle postupu stavby, kulatá vázaná nebo hranolová břevna, rozestavěné kamenné nebo trámové jádro, žebřík a materiál vedle stavby. Hra dál kreslí lešení čarami, dokud se varianta neschválí.

## Budovy s tematickými předměty

Recept `workshop` (`studio/src/generators/workshop.js`) postaví hlavní stavbu a kolem ní dvorek s předměty, podle kterých se pozná řemeslo. Hlavní stavba je jeden z druhů: `house` (recept domu), `raised` (sýpka na kamenných patkách), `windmill` (věžový mlýn s lopatkami natočenými k divákovi), `furnace` (pec s měchy a světlem) a `barn` (velká stodola s vraty). Umístí se mimo střed (`body.at`), aby zbylo místo na dvůr.

Předměty jsou katalog v `studio/src/generators/props.js`: pytle, sudy, bedny, seno, kmeny, palivové dříví, špalek se sekerou, mlýnský kámen, kolo, pracovní stůl, pec na chleba, skládaný kámen, ruda, uhlí, kovadlina, stojan s nářadím, rám s kůží, parohy, plot, vozík, koryto, přístřešek a plachta. Ve `spec` se zapisují jako seznam `{ type, at: [x, z], … }`, takže nová budova je hlavně data.

Koncepty (vždy dvě varianty, doporučená je ve stavu Review): statek, sýpka, pekárna, mlýn, tavírna, sklad, lovecká chata a dřevorubecká chata. Hra je nepoužívá, dokud je vývojář neschválí a nepřevezme podle postupu níže. Pravidlo pro předměty je ve Style Guide (`props`).

## Roční období (V01, návrhy)

- `season-ground`: tráva na jaře, v létě (základ), na podzim (olivová tráva a spadané listí), na začátku zimy (jinovatka a závěje) a v hluboké zimě (souvislý sníh). Sníh i listí jsou periodické, takže dlaždice dál navazují bez švů (`ground`: `snow`, `leaves`).
- `oak-seasons` a `pine-seasons`: stejný dospělý strom s parametrem `season`. Jarní dub má květy, podzimní okrové, zlaté a rezavé listí, zimní dub holé větve se sněhem. Zimní borovice má sněhové čepice. Léto je beze změny, takže dosavadní exporty si drží hash.
- **Náhled přechodu**: záložka *Scene & lighting* u `season-ground` ukazuje navržený postup. Globální průběh jde zleva doprava přes `transition.order` a každá dlaždice se prolne ve vlastní chvíli podle `seasonBlend` (`studio/src/lib/surface.js`): stabilní hash dlaždice a pomalý šum, žádná šachovnice, na konci okna je přechod u všech dlaždic hotový. Stejnou funkci může použít hra.
- Pravidla jsou ve Style Guide (`seasons`). Herní přechod (TerrainRenderer, stromy, Fog of War) přijde až po Codexově C01; viz `docs/art/VISUAL_PROGRESS.md`.

**Nakloněné válce:** `cylinder({ …, tilt: [x, z] })` nakloní válec kolem jeho základny (holé větve, později zbraně, žebříky a podobně). Bounds i validace půdorysu náklon počítají.

## Vojenské budovy, vybavení a vojáci (V02, V03, návrhy)

ID, půdorysy a výbava vycházejí z Codexova zadání C06–C08 (`docs/requests/CODEX_MASTER.md`). Budovy zatím ve hře nejsou, proto mají `plannedGameObjectId` místo `gameObjectId`. Až je Codex zavede a ustálí, návrhy se podle nich upraví.

- **Budovy** (recept `workshop`, vždy 3 varianty, doporučená je ve stavu Review):
  - `bowyer` (2×2): ohýbací forma, sušené pruty, stojan s luky;
  - `swordsmith` (2×2): výheň se žhavým uhlím a světlem, kovadlina, kád na kalení, stojan s meči;
  - `armorer` (2×2): stojany s brněním, pláty, stůl, kovadlina;
  - `armory` (3×3): železem pobitá vrata, stojany se zbraněmi, štíty, prapor;
  - `stables` (5×5): stáj, ohrada se skutečnou mezerou na branku, 3–4 koně, seno, koryto, stojan na sedla.
- **Vybavení** (kategorie Equipment): `equipment-bow`, `-sword`, `-armor`, `-horse`. Předměty stojí na stojanech, aby byly čitelné na mapě i ve zbrojnici. Slouží zároveň jako předloha pro ikony v rozhraní.
- **Vojáci** (recept `figure`, vždy 3 varianty včetně ženy):
  - `military-archer`: luk a toulec, bez štítu;
  - `military-soldier`: prošívanice, nosová přilba, meč, kulatý štít;
  - `military-swordsman`: kroužková zbroj, uzavřená přilba, štít ve tvaru kapky nebo obouruční meč;
  - `military-knight`: plátová zbroj, kbelcová přilba, kůň s čabrakou.
  Recept umí zbroj (`armor`), náprsní šat (`tabard`), přilby (`kettle`, `greathelm`, `bascinet`, `mailcoif`), meče, kopí, štíty a jízdu (`mount`). Kůň smí přesahovat dlaždici stejně jako koruny stromů.
- **Směry:** `military-directions` ukazuje stejného šermíře natočeného do 8 směrů (`facing` 0–7, `rotateParts`). Recepty tedy umí vyrenderovat všechny směry pohybu.
- **Animace** (chůze, boj, střelba, zranění, jízda) zatím nejsou. Postavy mají statický postoj a všechny tyto assety jsou Draft.

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

Takto se do hry dostala věž `watchtower-square` a pánev `torch-post-brazier`. Sezónní tráva: `grass_normal.seasonVariants` (jaro = `season-ground-spring`, podzim = `season-ground-autumn`, zima = `season-ground-snow`; léto je sada `grass-ground-lush`). TerrainRenderer kreslí sezónní dlaždici místo barevného nádechu a při přechodu sezón prolíná starou a novou dlaždici podle `seasonBlend`. Cesty si nádech ponechávají. Vesničané mají `APPROVED_VILLAGER_ART`: každý schválený vzhled se při exportu vyrenderuje v 8 směrech (`…facing-<k>.png`; 0 = k divákovi, herní SE). `HumanView` volí vzhled podle profese (`PROFESSION_LOOKS`) a pohlaví odvozeného od jména (`villagerSex`). Obrázky načte při prvním použití a chůzi i práci naznačí jemným pohupováním. Do té doby a pro profese bez vzhledu zůstává procedurální postava. Vojáci mají zatím jen mužský vzhled, slévači nosí vzhled havíře. Lešení má `APPROVED_SCAFFOLD_ART` (fáze low, mid, high a trámová varianta mid pro dřevěné budovy `TIMBER_SCAFFOLD_BUILDINGS`). `ConstructionView` obrázek načte při první stavbě, zvětší ho podle šířky staveniště (`width / 2`) a kotví ho v předním rohu; čárové lešení zůstává jako záloha. Stromy mají v tomtéž souboru `APPROVED_TREE_ART`: vzhledy mature, broad, young, spring, autumn a winter. `TreeView` z nich vybírá podle stupně růstu, ročního období a dlaždice; pařezy, sazenice a mladé duby na podzim a v zimě zůstávají procedurální. Výrobní budovy (statek, sýpka, pekárna, mlýn, sklad, lovecká chata, dřevorubecká chata, tavírna, lom) mají hodnoty z metadat v jednom souboru `src/data/objects/approvedArt.js`, který se v `src/data/objects/index.js` aplikuje na definice. Codexovy datové soubory tak zůstávají beze změny a procedurální renderer slouží jako záloha. Náhled lomu ve `SpriteBuildingView` dál zlatě zvýrazňuje primární ložisko.

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

- Generátory: `watchtower`, `torch-post`, `house`, `tree` (dub, borovice), `wall` (kamenná hradba, palisáda), `quarry`, 2D `ground` (tráva, cesty), `figure` (postavy), `scaffold` (lešení) a `workshop` (budovy s předměty); `tree` má roční období. Postavy jsou zatím statické, bez snímků animace.
- Animovaný je jen plamen, a to procedurálně v kompozitoru. Snímky animací se zatím neexportují.
- Export je deterministický v jednom prostředí. Jiný prohlížeč nebo GPU může dát drobně odlišné pixely, proto je autoritou commitnutý PNG.
- Schválení do repozitáře vyžaduje ruční krok přes GitHub (vložit JSON a otevřít PR). Studio nemá token a na GitHub nezapisuje.
- Současné herní sprity jsou v galerii jen pro porovnání. Některé objekty hra kreslí procedurálně a jejich obrázek je jen náhled z knihovny.
