import { t,onLanguageChange } from '../i18n/index.js';
// Expands the secondary HUD row (population, equipment, storage, economy) on
// demand. The choice is remembered per browser; a warning inside the collapsed
// details (unpaid wages) marks the toggle so it is never missed.
export const HUD_DETAILS_KEY = 'newgame.hud.details';

export function initCompactHud(doc = document, storage = safeStorage()) {
  const toggle = doc.querySelector('#hud-details-toggle'), panel = doc.querySelector('#hud-details');
  if (!toggle || !panel) return null;
  const set = open => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = t(open ? 'hud.less' : 'hud.more');
    toggle.title = t(open ? 'hud.lessTitle' : 'hud.moreTitle');
    // m-drobnosti-076 (report 0.76.0 point 8): this runs before the language is read, so the label also carries its key
    // and applyTranslations() (initLanguage, setLanguage) relabels it ("Více" in Czech).
    toggle.setAttribute('data-i18n', open ? 'hud.less' : 'hud.more');
    toggle.setAttribute('data-i18n-attr', `title:${open ? 'hud.lessTitle' : 'hud.moreTitle'}`);
    try { storage?.setItem(HUD_DETAILS_KEY, open ? '1' : '0'); } catch { /* optional preference */ }
  };
  let open = false;
  try { open = storage?.getItem(HUD_DETAILS_KEY) === '1'; } catch { /* default collapsed */ }
  set(open);
  toggle.addEventListener('click', () => set(panel.hidden));
  onLanguageChange(() => set(!panel.hidden));
  const warning = doc.querySelector('#wage-warning');
  const mark = () => toggle.classList.toggle('has-alert', !!warning && !warning.hidden);
  if (warning && typeof MutationObserver !== 'undefined') new MutationObserver(mark).observe(warning, { attributes: true, attributeFilter: ['hidden'] });
  mark();
  return { set, isOpen: () => !panel.hidden };
}

function safeStorage() { try { return globalThis.localStorage ?? null; } catch { return null; } }
