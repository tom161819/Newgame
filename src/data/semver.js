// Stable MAJOR.MINOR.PATCH releases; the game remains in 0.x during alpha.
// #174: players see MAJOR.MINOR.PATCH with MINOR and PATCH padded to at least two digits (0.3.1 → 0.03.01, 0.3.100 → 0.03.100).
// This is formatting only: package.json, the lockfile, Git tags and catalog data keep canonical SemVer, which forbids leading zeros.
const pad2=number=>String(number).padStart(2,'0');
const shortBuild=build=>build.replace(/^((?:git|dev)\.)([a-f0-9]{40})$/,(_match,prefix,commit)=>prefix+commit.slice(0,7));
export function displayVersion(version){
  let parsed;try{parsed=semanticVersion(version);}catch{return String(version);}
  const [major,minor,patch]=parsed.parts;
  return `${major}.${pad2(minor)}.${pad2(patch)}${parsed.prerelease?`-${parsed.prerelease}`:''}${parsed.build?`+${shortBuild(parsed.build)}`:''}`;
}
// Historical name kept for the archive UI and catalog page; archive labels and commit suffixes keep their meaning.
export const displayBuildVersion=displayVersion;
export function semanticVersion(version){
  const match=typeof version==='string'&&version.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/);
  if(!match||!match.slice(1,4).map(Number).every(Number.isSafeInteger)||match[4]?.split('.').some(id=>/^\d+$/.test(id)&&id.length>1&&id.startsWith('0')))throw new Error(`Invalid semantic version: ${String(version)}.`);
  return {parts:match.slice(1,4).map(Number),prerelease:match[4]??null,build:match[5]??null};
}
export function versionParts(version) {
  if (typeof version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`Invalid semantic version: ${String(version)}. Expected MAJOR.MINOR.PATCH.`);
  }
  const parts = version.split('.').map(Number);
  if (!parts.every(Number.isSafeInteger)) throw new Error(`Version number is too large: ${version}.`);
  return parts;
}

export function compareVersions(a, b) {
  const left = versionParts(a), right = versionParts(b);
  for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return Math.sign(left[i] - right[i]);
  return 0;
}

export function nextVersion(version, type) {
  const [major, minor, patch] = versionParts(version);
  const result = { major: [major + 1, 0, 0], minor: [major, minor + 1, 0], patch: [major, minor, patch + 1] }[type];
  if (!result) throw new Error('Release type must be major, minor or patch.');
  const value = result.join('.');
  versionParts(value);
  return value;
}
