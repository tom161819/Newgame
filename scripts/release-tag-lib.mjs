import { versionParts } from '../src/data/semver.js';

// #174: every release is tagged v<version> on the first commit of main's first-parent history that carries that
// version (the merge of the release PR). history: [{commit, version}] newest first, along the first-parent line.
export function releaseTagTarget(history){
  if(!history.length)throw new Error('No main history to tag.');
  const version=history[0].version;versionParts(version);
  let target=history[0].commit;
  for(const entry of history){if(entry.version!==version)break;target=entry.commit;}
  return {tag:`v${version}`,version,commit:target};
}
