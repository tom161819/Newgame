// Registry of asset recipes. A new kind of asset = one module here + one asset.json.
// Bump a generator's version when its output changes; approvals then show as outdated.
import watchtower from './watchtower.js';
import torchPost from './torch-post.js';
import house from './house.js';
import tree from './tree.js';
import wall from './wall.js';
import quarry from './quarry.js';

export const GENERATORS = Object.freeze({
  [watchtower.id]: watchtower,
  [torchPost.id]: torchPost,
  [house.id]: house,
  [tree.id]: tree,
  [wall.id]: wall,
  [quarry.id]: quarry,
});
