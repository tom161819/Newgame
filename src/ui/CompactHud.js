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
    toggle.textContent = open ? 'Méně' : 'Více';
    toggle.title = open ? 'Skrýt podrobnosti' : 'Zobrazit podrobnosti';
    try { storage?.setItem(HUD_DETAILS_KEY, open ? '1' : '0'); } catch { /* optional preference */ }
  };
  let open = false;
  try { open = storage?.getItem(HUD_DETAILS_KEY) === '1'; } catch { /* default collapsed */ }
  set(open);
  toggle.addEventListener('click', () => set(panel.hidden));
  const warning = doc.querySelector('#wage-warning');
  const mark = () => toggle.classList.toggle('has-alert', !!warning && !warning.hidden);
  if (warning && typeof MutationObserver !== 'undefined') new MutationObserver(mark).observe(warning, { attributes: true, attributeFilter: ['hidden'] });
  mark();
  return { set, isOpen: () => !panel.hidden };
}

function safeStorage() { try { return globalThis.localStorage ?? null; } catch { return null; } }
