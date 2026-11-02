krok 18	"Upgrade hry – New Game Setup, obtížnost a parametrizace mapy

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o nastavování parametrů při vytváření nové hry.

V hlavním menu po kliknutí na New Game nejprve otevři obrazovku Game Setup. Teprve po potvrzení nastavení vytvoř nový herní svět.

Zachovej všechny dosavadní herní mechaniky, včetně Save/Load, inventáře, soubojů, zvířat, budov, pokladů a generování kamenů.

1. Obrazovka Game Setup

Vytvoř přehledné menu ve středověkém stylu obsahující:

Difficulty: Easy / Normal / Hard.

Wildlife Population: Ojediněle / Normal / Hojně.

Treasure Chests: slider 0–10.

Initial Stones: slider 0–100, krok 5.

Výchozí hodnoty:

Difficulty: Normal.

Wildlife Population: Normal.

Treasure Chests: 1.

Initial Stones: 30.

Tlačítka:

Start Game – vytvoří a spustí svět.

Back – vrátí se do hlavního menu.

Dokud hráč nestiskne Start Game, negeneruj mapu ani nespouštěj herní časovače.

2. Obtížnost – Difficulty

Obtížnost bude upravovat maximální HP a DPS krále a lovitelných zvířat.

Použij násobitele základních hodnot:

Statistika

Easy

Normal

Hard

King HP

150 %

100 %

80 %

King DPS

125 %

100 %

85 %

Animal HP

75 %

100 %

130 %

Animal DPS

75 %

100 %

130 %

Příklad pro krále se základními 100 HP a 15 DPS:

Easy: 150 HP, 18.75 DPS.

Normal: 100 HP, 15 DPS.

Hard: 80 HP, 12.75 DPS.

Obtížnost aplikuj také na zajíce, srny a divočáky.

Koně prozatím ponech se stávajícími statistikami, protože slouží jako jezdecké zvíře.

Pravidla:

Upravuj základní statistiky, ne přímo aktuální HP během souboje.

Násobitele aplikuj právě jednou při vytvoření jednotky.

Vybavení, skilly a další bonusy se počítají až nad statistikami upravenými obtížností.

Armor se obtížností zatím nemění.

Regenerace HP zůstává stejná.

Zabraň opakovanému násobení statistik při Save/Load.

Nastavení ukládej centrálně jako GameSettings.

3. Množství zvěře – Wildlife Population

Přidej třípolohový slider.

Ojediněle (Rare)

1 zajíc.

1 srna.

1 divočák.

Celkem 3 zvířata.

Normal

3 zajíci.

3 srny.

3 divočáci.

Celkem 9 zvířat.

Hojně (Abundant)

8 zajíců.

8 srn.

8 divočáků.

Celkem 24 zvířat.

Zvířata náhodně rozmísti po průchozích políčkách mapy 100 × 100.

Zachovej jejich současné AI, pohyb, boj a dropování masa.

Pokud už existuje automatický respawn zvěře, přizpůsob jeho cílové počty vybranému režimu. Pokud neexistuje, zatím ho nepřidávej.

Kůň se do množství lovitelné zvěře nepočítá.

4. Množství pokladů – Treasure Chests

Přidej číselný slider:

Minimum: 0.

Maximum: 10.

Krok: 1.

Výchozí hodnota: 1.

Podle zvolené hodnoty vygeneruj odpovídající počet truhel na náhodných dostupných políčkách mapy.

Každá truhla:

Má vlastní unikátní ID.

Má individuálně náhodný obsah.

Obsahuje 50–100 Gold.

Obsahuje Sword a Armor podle dosavadního systému.

Lze ji otevřít pouze jednou.

Respektuje Fog of War.

Truhly nesmí vznikat na stejném políčku ani překrývat budovy, jiné objekty nebo startovní pozici krále.

Při hodnotě 0 se žádná truhla nevygeneruje.

5. Počet kamenů – Initial Stones

Přidej číselný slider:

Minimum: 0.

Maximum: 100.

Krok: 5.

Výchozí hodnota: 30.

Tato hodnota určuje počet kamenů vygenerovaných při zahájení nové hry.

Kameny rozmísti náhodně na volná průchozí políčka.

Zachovej dosavadní pravidla:

Maximálně jeden kámen na políčku.

Kameny se nesmí překrývat s budovami nebo jinými objekty.

Král je může sbírat.

Po sebrání se připíšou do inventáře.

Každých 20 sekund se nadále generuje nový kámen.

Uprav existující limit současně ležících kamenů tak, aby byl alespoň roven zvolenému počátečnímu množství. Výchozí kapacitu 80 kamenů zachovej pro standardní hru.

Pokud je na mapě aktuální limit kamenů, respawn se pozastaví a pokračuje po uvolnění místa.

6. Centrální konfigurace

Vytvoř strukturu GameSettings obsahující například:

{
  difficulty: ""normal"",
  wildlifePopulation: ""normal"",
  treasureCount: 1,
  initialStoneCount: 30
}

Konfiguraci předej při vytváření nové hry do příslušných systémů.

Nepoužívej hodnoty pevně zapsané na více místech kódu.

Připrav možnost budoucího přidání dalších parametrů, například:

Velikost mapy.

Frekvence respawnu zvířat.

Rychlost herního času.

Množství počátečního zlata.

Zatím tyto nové parametry neimplementuj.

7. Save / Load

Každá uložená hra musí obsahovat konfiguraci, se kterou byla vytvořena.

Při Load Game:

Nezobrazuj znovu Game Setup.

Obnov nastavení obtížnosti a populace.

Zachovej skutečný počet a stav existujících zvířat, kamenů a truhel.

Nevytvářej znovu počáteční objekty.

Neaplikuj opakovaně násobitele HP a DPS.

Zachovej současné časovače respawnu.

Starší uložené hry bez GameSettings načítej s výchozím nastavením Normal a zachovej jejich již uložený herní stav.

8. Testování

Před úpravami vytvoř Git commit.

Ověř:

New Game otevře Game Setup.

Back se vrátí do hlavního menu.

Easy / Normal / Hard správně upravují HP a DPS.

Obtížnost nepoškozuje vybavení ani Combat System.

Wildlife Population vytvoří 3 / 9 / 24 zvířat.

Počet truhel odpovídá nastavení 0–10.

Každá truhla má nezávislý obsah.

Počet kamenů odpovídá zvolenému nastavení.

Respawn kamenů funguje i nad původním limitem 80.

Všechny objekty vznikají na platných políčkách.

Save/Load zachovává nastavení i herní stav.

Při načtení se neduplikují objekty ani statistické bonusy.

Stávající funkce hry zůstávají zachovány.

Zaměř se na přehledné uživatelské rozhraní a univerzální správu nastavení nové hry."