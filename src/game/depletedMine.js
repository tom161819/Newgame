import { t } from '../i18n/index.js';
import { buildingDefinition } from './buildings.js';

// m-vytezeny-dul-ctverecky (64): an Iron Mine, or a Quarry bound to a finite deposit, whose deposit is used up becomes
// a depleted mine (`building.depleted`): no seats, no production, a darker look, its own name. Its output pile stays
// until the Haulers empty it; it can be demolished like any building.
export const DEPLETED_TINT=0x8a8278;
export const depletableMine=b=>b?.type==='iron_mine'||b?.type==='quarry'&&b.quarryMode==='finite';
export const buildingName=b=>b?.depleted&&depletableMine(b)?t(`building.depleted.${b.type}`):buildingDefinition(b).name;
