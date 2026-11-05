# Military equipment contract (C06)

Status: audited on main `185f9e5`. This contract is what C07 (weapon and armor production) and C08 (units,
recruitment, combat) build on, and what Stage 12 (Stables) completes. The machine-readable form is
`src/data/militaryEquipment.js`; `tests/military-equipment-contract.test.js` keeps both honest.

## Audit

| Feature | State | Where |
|---|---|---|
| Stables | **Not implemented yet** (Stage 12, `docs/UPGRADE_PROGRESS.md`: PENDING). Not a regression: it was never in a build. Approved concept art exists (`stables-shelter`, 5×5). | — |
| Wheelwright, Horse Wagon | **Not implemented yet** (Stage 12). | — |
| Iron Bars | Implemented: the Smelter turns Iron Ore and Wood into Iron Bars. | `src/data/objects/smelting.js` |
| Barracks | Implemented: up to five Soldiers patrol; they carry no equipment yet. | `src/data/objects/buildings.js`, `WorkerAI.patrol` |
| Horses | Implemented as wild animals; only the king can ride one (`MountSystem`). No taming, no ownership. | `src/data/objects/animals.js`, `src/systems/MountSystem.js` |
| Equipment | Implemented for the king: `weapon` and `armor` slots, Sword and Armor from treasure chests, saved as `equipment`. | `src/systems/EquipmentSystem.js`, `src/data/objects/equipment.js` |

Nothing is missing from the Buildings menu: Stables cannot appear because they do not exist yet. They are not
added early here (the order override in #53 keeps Stage 12 after C08).

## Items (implemented by C07)

| Item id | Slot | Recipe | Workshop |
|---|---|---|---|
| `bow` | weapon | 8 Wood, 30 s | Bowyer |
| `sword` | weapon | 3 Iron Bars + 2 Wood, 45 s | Swordsmith |
| `armor` | armor | 5 Iron Bars + 2 Wood, 60 s | Armorer |

They are stored goods (`category: resource`, `resourceCategory: equipment`) so the existing physical logistics carries
them; only an Armory (capacity 40) stores them, never a Warehouse or the Starter Stockpile. The king's treasure Sword
and Armor (`basic_sword`, `basic_armor`) remain separate equipment; C08 gives units the same modifiers as those items
(`modifiersFrom`). This replaces the C06 proposal to reuse the king items, which could not travel through storage.

## Unit roles (C08)

| Role | From | Weapon | Armor | Mount |
|---|---|---|---|---|
| Swordsman | Soldier | `sword` | optional | — |
| Archer | Soldier | `bow` | optional | — |
| Knight | Soldier | `sword` | required | Horse from Stables (**locked until Stage 12**) |

One weapon per role. Stat modifiers come from the item definition (`equipment.modifiers`), exactly as for the king
(`UnitStats.recalculateStats`); a unit's stats are its base stats plus its items.

## Moving items

1. C07 workshops put finished items into their output buffer; Haulers carry them to an Armory (physical goods, no teleporting).
2. Equipping a unit reserves one item in a store: reservation key `equipment:<workerId>:<slot>`.
3. The unit or a Hauler carries it; only then does it leave the stock and fill the slot.
4. Unequipping or death drops the item where the unit stands as a collectible drop; Haulers return it to storage.
5. Saves keep every unit's slots by item id (`worker.equipment`).

## Horses (Stage 12)

Only tamed horses kept by Stables can be reserved for a Knight (`horse.reservedBy = workerId`). Wild horses stay
free for the king to ride and are never assigned to units.

## Art for C07/C08/Stage 12 (Claude)

Approved concepts already exist in `art/approvals.json`; the game will use these ids and footprints.

| Asset | Approved variant | Footprint | Icons needed |
|---|---|---|---|
| Bowyer | `bowyer-stone` | 2×2 | Bow item (`equipment-bow-quiver`) |
| Swordsmith | `swordsmith-stone` | 2×2 | Sword item (`equipment-sword-steel`) |
| Armorer | `armorer-forge` | 2×2 | Armor item (`equipment-armor-steel`) |
| Armory | `armory-fortified` | 3×3 | — |
| Stables (Stage 12) | `stables-shelter` | 5×5 | Horse (`equipment-horse-bay`, `equipment-horse-grey`) |
| Units | `military-swordsman-*`, `military-archer-*`, `military-knight-*`, `military-soldier-*` | 1×1 | Role badges for the unit panel |
