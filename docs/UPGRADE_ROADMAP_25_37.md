# Upgrade roadmap 25–37

Nejprve dokončit aktuální krok 24 (A–D) podle [fronty](TASK_QUEUE.md). Potom automaticky provést následující etapy v přesném pořadí; po M1–M5 testy a autorizovaný MINOR release, tag a neměnný archiv. Visual Polish & Art Pass byl2026-11-04 výslovně vyřazen z fronty Codexu; grafiku řeší Claude. Codex dokončuje pouze master etapy do15.

Úplný dodaný master: [originál](requests/master-25-37.md). Společná pravidla a závazná řešení konfliktů: [00_ORCHESTRATOR.md](upgrades/00_ORCHESTRATOR.md). Neimplementovat budoucí etapy před dokončením právě aktivní. Aktuální stav není plánem nahrazen: viz [UPGRADE_PROGRESS.md](UPGRADE_PROGRESS.md).

| Etapa | Původní krok | Zadání | Milník | Specifikace |
|---|---|---|---|---|
| 01 | 29A | Version Archive, Changelog & Release Foundation | M1 | [01_29A_version_archive_changelog.md](upgrades/01_29A_version_archive_changelog.md) |
| 02 | 36 | Building Categories & Unlock Requirements | M1 | [02_36_building_categories_unlocks.md](upgrades/02_36_building_categories_unlocks.md) |
| 03 | 33 | Seasons ON/OFF | M1 | [03_33_seasons_switch.md](upgrades/03_33_seasons_switch.md) |
| 04 | 28 | Circular Fog of War & Map Memory | M1 | [04_28_fog_of_war_map_memory.md](upgrades/04_28_fog_of_war_map_memory.md) |
| 05 | 30 | Population Sidebar & Skill Sorting | M1 | [05_30_population_sidebar.md](upgrades/05_30_population_sidebar.md) |
| 06 | 32 | Missing Workers Indicator | M1 | [06_32_missing_workers_indicators.md](upgrades/06_32_missing_workers_indicators.md) |
| 07 | 25 | Forestry & Natural Resources | M2 | [07_25_forestry_natural_resources.md](upgrades/07_25_forestry_natural_resources.md) |
| 08 | 31A | Extended Zoom Out | M2 | [08_31A_extended_zoom.md](upgrades/08_31A_extended_zoom.md) |
| 09 | 31B | Daily Resource Statistics & Ledger | M2 | [09_31B_daily_resource_statistics.md](upgrades/09_31B_daily_resource_statistics.md) |
| 10 | 35 | Quarry Placement & Iron Smelter | M2 | [10_35_quarry_iron_smelter.md](upgrades/10_35_quarry_iron_smelter.md) |
| 11 | 37 | Stone Pavement & Courtyards | M3 | [11_37_stone_pavement.md](upgrades/11_37_stone_pavement.md) |
| 12 | 34 | Wheelwright, Wagons, Stables & Housing | M3 | [12_34_wheelwright_stables_housing.md](upgrades/12_34_wheelwright_stables_housing.md) |
| 13 | 26 | Villager Needs & Happiness | M4 | [13_26_villager_needs_happiness.md](upgrades/13_26_villager_needs_happiness.md) |
| 14 | 27 | Merchants, Caravans & Trade | M4 | [14_27_merchants_trade.md](upgrades/14_27_merchants_trade.md) |
| 15 | 29B | Background Simulation & Catch-up | M5 | [15_29B_background_simulation.md](upgrades/15_29B_background_simulation.md) |

**ALPHA – ukládání her (od 2026-11-04, má přednost před všemi specifikacemi etap):** zpětná kompatibilita uložených her mezi verzemi se nevyžaduje. Žádné migrace starších savů; při změně datového modelu zvýšit `SAVE_VERSION`. Save jiného schématu se odmítne s upozorněním a nabídkou nové hry, nikdy se automaticky nemaže. Požadavky typu „zachovej kompatibilitu starších save souborů“ nebo „Save/Load včetně staršího formátu“ v etapách 09–15 se neuplatňují, dokud je vývojář výslovně znovu nevyžádá. Platí plná funkčnost a kontroly konzistence Save/Load v aktuálním schématu. Úplná pravidla: `AGENTS.md`, sekce Alpha save policy.

Po každé etapě: relevantní testy, opravy, build, Save/Load aktuálního schématu, Unreleased, vlastní commit, aktualizace progress a automaticky další etapa. Po 06/10/12/14/15 použít [release gate](RELEASE_CHECKLIST.md). Mezi etapami nevydávat svévolně nové číslo. Explicitní uživatelský pokyn z 2026-11-03 autorizuje automatické dokončení celé série i MINOR vydání M1–M5 včetně tagů a archivů bez dalšího potvrzení. Skutečný technický blocker nebo limit relace zaznamenat s přesným checkpointem; nepředstírat práci mimo běžící relaci.
