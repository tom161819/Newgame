import { compareVersions, versionParts } from '../data/semver.js';
import { CHANGELOG_CATEGORIES } from '../data/changelogCategories.js';

const STORAGE_KEY = 'newgame.changelog.lastSeen';
export function seenVersionState(version, stored) {
  try { versionParts(stored); return { seen: stored, isNew: compareVersions(version, stored) > 0 }; }
  catch { return { seen: version, isNew: false }; }
}

export class ChangelogPanel {
  constructor({ version, releases }) {
    this.version = version;
    this.dialog = document.querySelector('#changelog-dialog');
    this.button = document.querySelector('#main-changelog');
    this.badge = document.querySelector('#changelog-new');
    try { this.storage = window.localStorage; } catch { /* Storage can be disabled. */ }
    let stored;
    try { stored = this.storage?.getItem(STORAGE_KEY); } catch { /* Keep an in-memory baseline. */ }
    const initial = seenVersionState(version, stored);
    this.seen = initial.seen;
    if (stored !== this.seen) this.persistSeen();
    this.badge.hidden = !initial.isNew;
    for (const label of document.querySelectorAll('[data-game-version]')) label.textContent = `v${version}`;
    document.title = `Medieval Kingdom · v${version}`;
    this.render(releases);
    this.button.addEventListener('click', () => this.open());
    document.querySelector('#changelog-back').addEventListener('click', () => this.close());
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
  }

  persistSeen() { try { this.storage?.setItem(STORAGE_KEY, this.seen); } catch { /* Never affect game saving. */ } }

  render(releases) {
    const element = (tag, text, className) => {
      const node = document.createElement(tag);
      if (text) node.textContent = text;
      if (className) node.className = className;
      return node;
    };
    const entries = releases.map(release => {
      const entry = element('article', '', 'changelog-release');
      entry.dataset.release = release.version;
      const heading = element('h3', `v${release.version} `), date = element('time', release.date);
      date.dateTime = release.date; heading.append(date); entry.append(heading);
      for (const [key, label] of Object.entries(CHANGELOG_CATEGORIES)) {
        const changes = release.changes[key];
        if (!changes?.length) continue;
        const section = element('section'), list = element('ul');
        section.dataset.category = key;
        list.append(...changes.map(change => element('li', change)));
        section.append(element('h4', label), list); entry.append(section);
      }
      return entry;
    });
    document.querySelector('#changelog-releases').replaceChildren(...entries);
  }

  open() {
    if (compareVersions(this.version, this.seen) > 0) this.seen = this.version;
    this.persistSeen(); this.badge.hidden = true;
    if (!this.dialog.open) this.dialog.showModal();
    document.querySelector('#changelog-releases').scrollTop = 0;
    document.querySelector('#changelog-back').focus();
  }

  close(focus = true) {
    if (!this.dialog.open) return;
    this.dialog.close(); if (focus) this.button.focus();
  }
}
