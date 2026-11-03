import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { compareVersions, versionParts, nextVersion,semanticVersion } from '../src/data/semver.js';
import { CHANGELOG_CATEGORIES } from '../src/data/changelogCategories.js';

export function validateDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid release date: ${value}. Expected an actual YYYY-MM-DD date.`);
  }
  return value;
}

export function parseChangelog(markdown, currentVersion) {
  versionParts(currentVersion);
  const releases = [], seen = new Set();
  let section = null, category = null, unreleased = null;
  const fail = (line, message) => { throw new Error(`CHANGELOG.md:${line + 1}: ${message}`); };
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || /^\[[^\]]+\]:\s+\S/.test(line)) continue;
    if (line.startsWith('## ')) {
      const header = line.match(/^## \[([^\]]+)\](?: - (\S+))?\s*$/);
      if (!header) fail(i, 'Expected ## [version] - YYYY-MM-DD or ## [Unreleased].');
      category = null;
      if (header[1] === 'Unreleased') {
        if (unreleased || releases.length || header[2]) fail(i, 'Unreleased must occur once, at the top, without a release date.');
        section = unreleased = { changes: {} };
      } else {
        semanticVersion(header[1]);
        if (seen.has(header[1])) fail(i, `Duplicate release ${header[1]}.`);
        seen.add(header[1]);
        section = { version: header[1], date: validateDate(header[2] ?? ''), changes: {} };
        releases.push(section);
      }
    } else if (section) {
      if(line.startsWith('<!-- version: ')){
        if(section===unreleased||section.metadata)fail(i,'Version metadata must occur once in a version entry.');
        let metadata;try{metadata=JSON.parse(line.slice(14).replace(/\s*-->\s*$/,''));}catch{fail(i,'Invalid version metadata JSON.');}
        if(!metadata||typeof metadata.title!=='string'||!metadata.title.trim()||metadata.title.length>160||typeof metadata.reconstructed!=='boolean'||!['initial','feature','fix','milestone'].includes(metadata.type))fail(i,'Invalid version title, type or reconstructed label.');
        if(metadata.commit!==undefined&&!/^[a-f0-9]{40}$/.test(metadata.commit))fail(i,'Expected a full actual Git commit SHA.');
        if(metadata.tag!==undefined&&metadata.tag!==`v${section.version}`)fail(i,'The release tag must match its version.');
        section.metadata=metadata;
      }else if (line.startsWith('### ')) {
        const label = line.slice(4).trim();
        category = Object.keys(CHANGELOG_CATEGORIES).find(key => CHANGELOG_CATEGORIES[key] === label);
        if (!category) fail(i, `Unknown category ${label}.`);
        if (section.changes[category]) fail(i, `Duplicate category ${label}.`);
        section.changes[category] = [];
      } else if (/^-\s+\S/.test(line)) {
        if (!category) fail(i, 'A change must belong to a category.');
        section.changes[category].push(line.replace(/^-\s+/, '').trim());
      } else if (/^\s{2,}\S/.test(line) && category && section.changes[category].length) {
        section.changes[category][section.changes[category].length - 1] += ` ${line.trim()}`;
      } else fail(i, 'Expected a category or a non-empty bullet describing a completed change.');
    }
  }
  if (!unreleased) throw new Error('CHANGELOG.md must contain an Unreleased section for ongoing development.');
  if (!releases.length) throw new Error('CHANGELOG.md has no released versions.');
  for (let i = 0; i < releases.length; i++) {
    const release = releases[i];
    for (const key of Object.keys(release.changes)) if (!release.changes[key].length) delete release.changes[key];
    if (!Object.keys(release.changes).length) throw new Error(`Release ${release.version} has no completed changes.`);
    if(release.metadata?.reconstructed){if(!release.metadata.commit||!/^\d+\.\d+\.\d+\+archive\.[1-9]\d*$/.test(release.version))throw new Error('Reconstructed versions require a commit and an explicit +archive label.');}
    else versionParts(release.version);
  }
  const official=releases.filter(r=>!r.metadata?.reconstructed);
  if(!official.length)throw new Error('CHANGELOG.md has no released versions.');
  for(let i=1;i<official.length;i++)if(compareVersions(official[i-1].version,official[i].version)<=0||official[i-1].date<official[i].date)throw new Error('CHANGELOG.md releases must be in descending version and date order.');
  if (official[0].version !== currentVersion) {
    throw new Error(`package.json version ${currentVersion} does not match latest CHANGELOG.md release ${official[0].version}.`);
  }
  return { version: currentVersion, releases, unreleased };
}

export async function readRelease(root) {
  const [packageText, markdown, lockText] = await Promise.all([
    readFile(path.join(root, 'package.json'), 'utf8'), readFile(path.join(root, 'CHANGELOG.md'), 'utf8'),
    readFile(path.join(root, 'package-lock.json'), 'utf8'),
  ]);
  const pkg = JSON.parse(packageText), lock = JSON.parse(lockText), data = parseChangelog(markdown, pkg.version);
  if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) throw new Error('package-lock.json root versions do not match package.json.');
  return { data, pkg, lock, markdown, packageText, lockText };
}

export function prepareRelease({ markdown, pkg, lock }, type, date) {
  const current = parseChangelog(markdown, pkg.version);
  if (!Object.values(current.unreleased.changes).some(changes => changes.length)) throw new Error('Unreleased has no completed changes to release.');
  const version = nextVersion(pkg.version, type);
  validateDate(date);
  if (date < current.releases.find(r=>!r.metadata?.reconstructed).date) throw new Error('The new release date precedes the latest release.');
  const nextMarkdown = markdown.replace(/^## \[Unreleased\]\s*$/m, `## [Unreleased]\n\n## [${version}] - ${date}`);
  const nextPackage = { ...pkg, version }, nextLock = structuredClone(lock);
  nextLock.version = version; nextLock.packages[''].version = version;
  parseChangelog(nextMarkdown, version);
  return { version, markdown: nextMarkdown, packageText: `${JSON.stringify(nextPackage, null, 2)}\n`, lockText: `${JSON.stringify(nextLock, null, 2)}\n` };
}
