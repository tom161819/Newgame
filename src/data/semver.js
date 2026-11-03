// Stable MAJOR.MINOR.PATCH releases; the game remains in 0.x during alpha.
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
