import { TOWER_COST } from '../game/buildings.js';

export class BuildingBar {
  constructor({ onSelect, onCancel }) {
    this.controller = new AbortController();
    this.tab = document.querySelector('#buildings-tab');
    this.panel = document.querySelector('#buildings-panel');
    this.choice = document.querySelector('#tower-choice');
    this.cancel = document.querySelector('#cancel-building');
    const options = { signal: this.controller.signal };
    this.tab.addEventListener('click', () => this.toggle(), options);
    this.choice.addEventListener('click', () => {
      if (onSelect()) this.close();
    }, options);
    this.cancel.addEventListener('click', onCancel, options);
  }

  toggle() {
    this.panel.hidden = !this.panel.hidden;
    this.tab.setAttribute('aria-expanded', String(!this.panel.hidden));
  }

  close() {
    this.panel.hidden = true;
    this.tab.setAttribute('aria-expanded', 'false');
  }

  update(count, selected) {
    const available = count >= TOWER_COST;
    const missing = TOWER_COST - count;
    const noun = missing === 1 ? 'kámen' : missing >= 2 && missing <= 4 ? 'kameny' : 'kamenů';
    const label = document.querySelector('#tower-availability');
    label.textContent = available ? 'Dostatek kamenů pro stavbu.' : `Chybí ${missing} ${noun}.`;
    label.classList.toggle('shortage', !available);
    this.choice.setAttribute('aria-pressed', String(selected));
    this.cancel.hidden = !selected;
    document.querySelector('#building-selection').textContent = selected ? 'Tower · 2 × 2 · 🪨 10' : '';
  }

  destroy() {
    this.controller.abort();
  }
}
