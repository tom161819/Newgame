import { compareVersions, versionParts, displayVersion } from '../data/semver.js';
import { CHANGELOG_CATEGORIES } from '../data/changelogCategories.js';
import { t } from '../i18n/index.js';

const STORAGE_KEY = 'newgame.changelog.lastSeen';
export function seenVersionState(version, stored) {
  try { versionParts(stored); return { seen: stored, isNew: compareVersions(version, stored) > 0 }; }
  catch { return { seen: version, isNew: false }; }
}

export class ChangelogPanel {
  constructor({ version, releases,catalog=null }) {
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
    // #174: shown as MAJOR.MINOR.PATCH with two-digit MINOR and PATCH; the canonical value stays in data attributes.
    for (const label of document.querySelectorAll('[data-game-version]')) { label.textContent = `v${displayVersion(version)}`; label.dataset.canonicalVersion = version; }
    document.title = `Medieval Kingdom · v${displayVersion(version)}`;
    this.releases=catalog?.versions??releases;this.render(this.releases);
    this.button.addEventListener('click', () => this.open());
    document.querySelector('#changelog-back').addEventListener('click', () => this.close());
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
  }

  persistSeen() { try { this.storage?.setItem(STORAGE_KEY, this.seen); } catch { /* Never affect game saving. */ } }

  // Release notes stay as authored (English history); only the panel chrome is translated.
  relabel() { this.render(this.releases); }

  render(releases) {
    const element = (tag, text, className) => {
      const node = document.createElement(tag);
      if (text) node.textContent = text;
      if (className) node.className = className;
      return node;
    };
    const entries = releases.map(release => {
      const entry = element('details', '', 'changelog-release');
      entry.dataset.release = release.version;
      const summary=element('summary'),heading = element('h3', `v${displayVersion(release.version)}${release.title?` — ${release.title}`:''} `), date = element('time', release.date);
      date.dateTime = release.date; heading.append(date);summary.append(heading);entry.append(summary);
      if(release.historical)entry.append(element('p',t('changelog.reconstructed'),'archive-version-label'));
      if(release.saveImpact)entry.append(element('p',t(`changelog.save.${release.saveImpact}`,{schema:release.saveVersion}),'changelog-save-impact'));
      if(release.available&&release.archiveURL){const play=element('a',t('changelog.playArchived'),'archive-play');play.href=release.archiveURL;play.target='_blank';play.rel='noopener noreferrer';entry.append(play);}
      for (const key of Object.keys(CHANGELOG_CATEGORIES)) {
        const changes = release.changes[key];
        if (!changes?.length) continue;
        const section = element('section'), list = element('ul');
        section.dataset.category = key;
        list.append(...changes.map(change => element('li', change)));
        section.append(element('h4', t(`changelog.category.${key}`)), list); entry.append(section);
      }
      return entry;
    });
    document.querySelector('#changelog-releases').replaceChildren(...entries);
  }

  open(version=null) {
    if (compareVersions(this.version, this.seen) > 0) this.seen = this.version;
    this.persistSeen(); this.badge.hidden = true;
    if (!this.dialog.open) this.dialog.showModal();
    document.querySelector('#changelog-releases').scrollTop = 0;
    const entries=[...document.querySelectorAll('.changelog-release')],entry=entries.find(e=>e.dataset.release===version)??entries[0];if(entry){entry.open=true;if(version)entry.scrollIntoView({block:'start'});}
    document.querySelector('#changelog-back').focus();
  }

  close(focus = true) {
    if (!this.dialog.open) return;
    this.dialog.close(); if (focus) this.button.focus();
  }
}
