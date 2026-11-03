# Milestone release gate

Automatická vydání M1–M5 jsou uživatelem výslovně zadaná. Běžné pracovní commity jsou Unreleased. Skript `release:prepare` nadále pouze připravuje soubory; autorizovaný orchestrátor pak provede skutečný Git/publikaci samostatně.

1. Ověřit všechny etapy daného milníku v progress, reálné commity, čistotu rozsahu změn a aktuální verzi/tagy. Nevydávat historická či duplicitní čísla.
2. Spustit plné automatické testy, relevantní integrační scénáře, dostupný browser smoke, New Game, současné i skutečné starší Save/Load, logistiku, rušení staveb, více NPC, FoW a výkon. Zapsat skutečné výsledky a neověřené části.
3. Ověřit `npm run changelog:validate`, `npm run archive:verify` a produkční `npm run build -- --base=/Newgame/`. Před milníkovým vydáním potvrdit funkční Pages deploy dokončeného kódu.
4. Připravit MINOR podle skutečné aktuální verze (`0.MINOR.0`), přesunout dokončené Unreleased pomocí existujícího workflow, datum podle Europe/Prague. GameVersion a SaveSchema zůstávají oddělené.
5. Znovu ověřit metadata, UI, změny a build. Commitnout konkrétní release zdroj a z něj skutečný neměnný hratelný archiv, bez přepisu předchozích snapshotů.
6. Publikovat na main a ověřit skutečné Pages Success pro přesný SHA; nový nezaměnitelný tag směřuje na odpovídající commit vydané verze. Zkontrolovat jeho skutečné nahrání a odkazy archivu, nic nevymýšlet.
7. Teprve potom zapsat RELEASED do progress včetně verze, SHA, tagu, archivu a run ID a automaticky pokračovat další etapou. Opravit selhání; při neřešitelném oprávnění/limitaci přesně zaznamenat release kandidáta a blocker, neprohlašovat nevydanou verzi za vydanou.
