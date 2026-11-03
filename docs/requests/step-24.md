krok 24	"Medieval Kingdom – Upgrade: Logistics, Warehouses & Physical Resource Transportation

Rozšiř stávající izometrickou 2.5D strategii ve Phaseru o kompletní systém fyzické přepravy surovin, skladování, nosičů a zásobování stavenišť a výrobních budov.

Hlavní cíl: Suroviny se už nesmějí okamžitě teleportovat do společného inventáře. Každá surovina musí být fyzicky dostupná na určitém místě a pracovníci ji musejí přepravit do skladu, výrobní budovy nebo na staveniště.

Navazuj na existující systémy pracovních profesí, XP, skillů, zemědělství, výroby potravin, blueprintů, fyzické výstavby, pathfindingu, vyšlapávání cest a Save/Load.

Nezakládej nový projekt.

Před implementací analyzuj stávající architekturu a zachovej již funkční systémy.

1. Nová budova – Warehouse

Přidej do nabídky Buildings a Asset Library:

ID: warehouse

Name: Warehouse

Size: 3×3

Cost: 10 Stone

Storage Capacity: 200 jednotek

Worker Slots: 3

Allowed Job: Hauler

Sklad uchovává:

Stone

Wood

Iron

Ostatní budoucí stavební a výrobní materiály.

Sklad může být postaven vícekrát.

Každý sklad má vlastní fyzickou pozici, kapacitu a obsah.

Hotový sklad začne fungovat až po dokončení blueprintu.

Sklady nesmějí získávat suroviny automaticky bez skutečného doručení.

2. Sýpka – Granary

Použij existující Granary ze zemědělského systému.

Pokud neexistuje, vytvoř ji podle dosavadní specifikace.

Kapacita: 200 jednotek

Skladování: Meat, Wheat, Flour, Bread, Apple

Worker Slots: 2

Allowed Job: Hauler

Sýpky a sklady mají vlastní zásoby.

Horní lišta inventáře zobrazuje součet dostupných surovin ve všech příslušných skladech.

Nesmí docházet ke zdvojování inventáře.

Zlato prozatím ponech jako centrální měnu království. Fyzická přeprava mincí zatím není potřeba.

3. Počáteční skladiště

Při vytvoření nové hry automaticky umísti jednoduché počáteční skladiště poblíž krále.

ID: starter_stockpile

Size: 2×2

Cost: 0

Capacity: 40

Storage: Stone, Wood, Iron a základní potraviny

Toto skladiště je okamžitě funkční.

Slouží k rozjezdu ekonomiky, než hráč postaví první Warehouse nebo Granary.

Při zapnutém Starting Castle musí být skladiště umístěno na dostupném místě poblíž hradu.

Při Load Game nevytvářej skladiště znovu.

4. Fyzické suroviny

Každá surovina může být v jednom ze stavů:

Leží na zemi.

Je nesena jednotkou.

Je uložená ve skladu.

Je rezervovaná pro přepravu nebo výrobu.

Byla doručena na staveniště.

Je spotřebovaná.

Jedna konkrétní jednotka suroviny se nesmí současně nacházet ve dvou místech.

Například:

Horník sebere kámen ze země → kámen zmizí z mapy → objeví se v jeho neseném nákladu → horník jej odnese do skladu → po předání se přičte ke skladovým zásobám.

Do společného inventáře nesmí být kámen přičten před jeho skutečným doručením.

U všech přesunů zajisti jednoznačnou změnu vlastnictví suroviny.

5. Nová profese – Hauler

Přidej profesi:

ID: hauler

Name: Hauler

Skill: Logistics

Max Skill Level: 50

Base Carry Capacity: 20 jednotek

Base Daily Wage: 1 Gold

Nosič bude automaticky vyhledávat přepravní úkoly.

Může být přiřazen ke konkrétnímu Warehouse nebo Granary.

Jedna postava může mít stále pouze jednu aktivní profesi a jedno aktivní pracoviště.

Nosič nepřechází automaticky do profese Builder, Miner ani Farmer.

6. Pracovní AI nosičů

Nosič bude používat následující postup:

Vyhledá dostupný přepravní úkol.

Zarezervuje surovinu a cílové místo.

Fyzicky dojde ke zdroji.

Naloží dostupné množství.

Vyhledá cestu k cíli.

Přenese náklad.

Vyloží ho.

Získá Logistics XP.

Vybere další přepravní úkol.

Nosič nesmí teleportovat suroviny.

Pokud se změní cílová budova, cesta je zablokovaná nebo je úkol zrušen, musí bezpečně přepočítat trasu nebo vrátit náklad.

Dva nosiči nesmí převážet stejnou rezervovanou surovinu.

7. Prioritizace přepravních úkolů

Vytvoř centrální LogisticsTaskManager.

Podporované úkoly:

Přeprava materiálu na staveniště.

Doplňování surovin do mlýna a pekárny.

Odvoz hotových výrobků do skladů.

Přesun surovin mezi sklady.

Přeprava potravin.

Počáteční priority:

Materiál pro aktivně stavěnou budovu.

Potraviny potřebné pro aktuální zásobování obyvatel.

Vstupy pro výrobní budovy.

Odvoz hotové produkce.

Přesuny mezi sklady.

Při výběru úkolu zohledňuj také vzdálenost a dostupnost cesty.

Úkoly nesmí způsobovat nekonečné převážení surovin mezi dvěma sklady.

Přepravní úkol může být rozdělen na více cest, pokud jeho objem překračuje nosnost pracovníka.

8. Zásobování stavenišť

Uprav existující Construction System.

Po umístění blueprintu:

Ověř, že je ve skladech nebo jiných povolených zdrojích dostupné dostatečné množství stavebních materiálů.

Materiál rezervuj pro konkrétní stavbu.

Vytvoř přepravní úkoly.

Nosiči fyzicky dopraví materiál na staveniště.

Materiál se eviduje jako doručený.

Jakmile jsou dodané všechny požadované suroviny, mohou stavitelé zahájit výstavbu.

Příklad:

Castle potřebuje 10 Stone.

Sklad obsahuje 30 Stone.

Hráč umístí blueprint hradu.

10 Stone se rezervuje pro stavbu.

Nosič je vyzvedne ze skladu.

Přenese je na staveniště.

Stavitel začne pracovat.

Po dokončení vznikne hotový Castle.

Rezervovaný materiál nesmí být dostupný jiným stavebním nebo výrobním úkolům.

Materiál odečítej ze skutečného skladu při fyzickém vyzvednutí, nikoliv znovu při dokončení stavby.

Pokud už stávající Construction System materiály odečítá při umístění blueprintu, uprav jej na model rezervací bez dvojité spotřeby.

Při zrušení stavby správně uvolni rezervace a fyzicky vrať nebo zachovej materiál podle jeho aktuálního umístění a dosavadních pravidel refundace.

9. Stavění bez nosičů

Pokud není dostupný žádný Hauler, musí být možné pokračovat v rozvoji království.

Král bude mít vlastní kapacitu nákladu 20 jednotek.

Může:

Sebrat kameny nebo jiné suroviny.

Odnést je do skladiště.

Vyzvednout materiál ze skladu.

Doručit jej na staveniště.

Následně stavět podle existujícího Construction Skill.

Kliknutím na staveniště s chybějícím materiálem nabídni možnost Deliver Materials.

Král automaticky dojde k dostupnému skladu, vyzvedne potřebný materiál a odnese jej na staveniště.

Pokud stavba potřebuje více materiálu, než král unese, provede více cest.

Po doručení může hráč králi nařídit stavbu.

Automatická přeprava a stavění králem musí respektovat dosavadní pravidla ovládání.

10. Integrace horníků a lovců

Uprav stávající pracovní AI.

Miner

Vyhledá kámen.

Dojde k němu.

Sebere jej.

Nese náklad.

Vrátí se do Warehouse nebo Starter Stockpile.

Vyloží náklad.

Získá Mining XP.

Pokračuje v práci.

Hunter

Uloví zvíře.

Sebere dropované maso.

Odnese maso do Granary nebo dostupného Starter Stockpile.

Vyloží náklad.

Získá Hunting XP.

Pokračuje v lovu.

Pokud není volné místo ve skladu, pracovník se nesmí zbavit nákladu bez jeho fyzického zachování.

Může čekat, vybrat jiný sklad nebo bezpečně odložit náklad na vhodné místo na zemi.

11. Integrace zemědělství a výroby

Zachovej existující zemědělské a výrobní systémy.

Farmář:

Sklidí obilí nebo ovoce.

Odnese úrodu do Granary.

Mlynář:

Pracuje pouze s materiálem fyzicky doručeným do mlýna.

Pekař:

Pracuje pouze s moukou fyzicky doručenou do pekárny.

Nosiči zajišťují zásobování a odvoz výrobků.

Výrobní budovy musí mít vlastní omezené vstupní a výstupní zásobníky.

Zabraň tomu, aby jeden výrobek vznikl současně ve skladu i ve výrobní budově.

Používej existující recepty a pracovní časy.

12. Logistics Skill

Přidej nový skill Logistics s levely 1–50.

Nosiči získávají XP za úspěšně dokončené přepravní úkoly.

XP přiděluj podle skutečně doručeného množství a přiměřeně délce přepravy.

Neuděluj XP za zrušené úkoly ani za pouhé opakované vyzvedávání a vracení stejného nákladu.

Vyšší level zvyšuje kapacitu nákladu.

Počáteční vzorec:

CarryCapacity = 20 + floor((LogisticsLevel - 1) / 5) × 2

Příklady:

Level 1: 20 jednotek.

Level 11: 24 jednotek.

Level 26: 30 jednotek.

Level 50: 38 jednotek.

Nosičům zatím nezvyšuj základní rychlost chůze podle Logistics Skill.

Bonusy za cesty zachovej.

13. Vyšlapané cesty a přeprava

Napoj systém přepravy na existující Path Wear System.

Každý nosič při pohybu přispívá k vyšlapávání cest.

Zachovej stávající bonusy:

Level 0: +0 % movement speed.

Level 1: +5 %.

Level 2: +10 %.

Level 3: +15 %.

Pathfinding musí zohledňovat rychlost na vyšlapaných cestách a může preferovat rychlejší trasu i v případě, že je mírně delší.

Nesmí ale vytvářet zbytečně dlouhé objížďky jen kvůli bonusu rychlosti.

Vytvoř základ pro budoucí povozy a silnice.

14. Uživatelské rozhraní

Po kliknutí na Warehouse nebo Granary zobraz:

Obsah skladu.

Celkovou a volnou kapacitu.

Rezervované suroviny.

Přiřazené nosiče.

Probíhající přepravní úkoly.

Po kliknutí na nosiče zobraz:

Jeho aktuální náklad.

Kapacitu.

Logistics Level a XP.

Aktuální úkol.

Cíl cesty.

Stav přepravy.

Po kliknutí na staveniště zobraz:

Požadované materiály.

Rezervované materiály.

Doručené materiály.

Chybějící materiály.

Stav výstavby.

Do horní lišty inventáře přidej možnost zobrazit rozpis, kolik surovin je volně dostupných, rezervovaných, právě přepravovaných a uložených na staveništích.

Nezapočítávej stejnou surovinu do více kategorií jako fyzickou duplicitu.

15. Save / Load

Rozšiř existující Save/Load.

Ukládej:

Obsah jednotlivých skladů.

Skladové kapacity.

Nesený náklad jednotek.

Rezervace surovin.

Aktivní přepravní úkoly.

Doručený stavební materiál.

Vstupní a výstupní zásoby výrobních budov.

Logistics Skill a XP nosičů.

Aktuální pozice přepravovaných surovin.

Po načtení musí všechny suroviny zůstat ve svém skutečném stavu.

Nepřidávej žádné suroviny znovu do společného inventáře.

Pokud během načítání nelze bezpečně obnovit aktivní přepravní úkol, zruš pouze jeho rezervaci a vytvoř nový úkol. Fyzický náklad jednotky musí zůstat zachován.

Starší uložené hry s globálním inventářem migruj tak, že jejich existující suroviny převedeš do dostupného skladiště nebo jiného bezpečného skladového stavu, bez jejich ztráty nebo zdvojení.

16. Výkon a architektura

Implementuj centrální logistický systém využívající existující pathfinding.

Nepočítej nové cesty pro všechny nosiče každý snímek.

Systém musí být připraven na desítky až stovky NPC.

Používej:

Event-driven aktualizace skladových zásob.

Rezervace úkolů.

Jednoznačná ID přeprav.

Dávkové plánování přepravních úkolů.

Oddělení herní logiky od grafiky.

Nevytvářej zbytečné nové Phaser objekty pro jednotlivé kusy materiálu uvnitř skladů.

Graficky zobrazuj hlavně skutečně nesené náklady a náklady ležící na mapě.

17. Testování

Před úpravami vytvoř Git commit funkční verze hry.

Ověř následující scénáře:

Horník sebere kámen a odnese ho do skladu.

Kámen se nepřičte do skladových zásob před doručením.

Nosič vyzvedne materiál a odnese ho na staveniště.

Stavitel nezačne stavět bez doručeného materiálu.

Po doručení může stavba pokračovat.

Více nosičů nepřeváží stejnou surovinu.

Nedojde k duplicitnímu odečítání nebo přičítání surovin.

Král může přepravovat materiály i bez nosičů.

Sklad má správnou kapacitu.

Zemědělské produkty se fyzicky přepravují do Granary.

Mlýn i pekárna spotřebovávají skutečně doručené suroviny.

Vyšlapané cesty ovlivňují logistiku.

Nosiči získávají Logistics XP.

Save/Load zachovává sklady, náklady a rezervace.

Při přerušení cesty nebo smrti pracovníka nezmizí suroviny.

Celý systém funguje stabilně na mapě 100×100.

Implementaci rozděl do samostatných fází:

Fáze A: Fyzické suroviny, sklady a migrace inventáře.

Fáze B: Profese Hauler, přepravní AI a rezervace.

Fáze C: Zásobování stavenišť, zemědělství a výroby.

Fáze D: UI, Save/Load, optimalizace a integrační testy.

Po každé dokončené a otestované fázi vytvoř Git commit.

Neimplementuj zatím povozy, obchodní karavany ani pokročilou dopravní infrastrukturu.

Prioritou je spolehlivý systém fyzických surovin bez teleportace a bez duplicit."