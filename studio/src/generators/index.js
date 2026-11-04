// Registry of asset recipes. A new kind of asset = one module here + one asset.json.
// Bump a generator's version when its output changes; approvals then show as outdated.
import watchtower from './watchtower.js';
import torchPost from './torch-post.js';

export const GENERATORS = Object.freeze({
  [watchtower.id]: watchtower,
  [torchPost.id]: torchPost,
});
