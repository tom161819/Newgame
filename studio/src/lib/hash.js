// Stable JSON (sorted keys) and a short FNV-1a hash. An approval stores the hash
// of the exact recipe it saw, so any later change to the spec or generator
// version shows the approval as outdated.

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().filter(key => value[key] !== undefined)
      .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function specHash({ generator, generatorVersion, styleVersion, variant }) {
  return fnv1a(stableStringify({ generator, generatorVersion, styleVersion, version: variant.version, spec: variant.spec }));
}
