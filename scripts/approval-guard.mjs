// #214: CI guard. A pull request that approves a Studio variant (art/approvals.json) must point at the owner's own
// Submit review issue that approves exactly that variant, version and hash. So Claude cannot approve its own art.
//   node scripts/approval-guard.mjs --base=HEAD^1   (CI; reads issues with GITHUB_TOKEN)
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { approvalsNeedingProof, proofProblem } from './asset-review-lib.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), args = process.argv.slice(2), option = name => args.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const git = (...p) => execFileSync('git', p, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const base = option('base') ?? 'origin/main', repo = process.env.GITHUB_REPOSITORY ?? 'tom161819/Newgame', token = process.env.GITHUB_TOKEN;
let before; try { before = JSON.parse(git('show', `${base}:art/approvals.json`)); } catch { before = { assets: {} }; }
const after = JSON.parse(await readFile(path.join(root, 'art/approvals.json'), 'utf8'));
const needs = approvalsNeedingProof(before, after);
if (!needs.length) { console.log('Approval guard: no new approvals. PASS.'); process.exit(0); }
const problems = [];
for (const need of needs) {
  let issue = null;
  if (need.review) {
    const r = await fetch(`https://api.github.com/repos/${repo}/issues/${need.review.issue}`, { headers: { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).catch(e => ({ ok: false, status: 0, error: e }));
    if (r.ok) issue = await r.json(); else if (r.status !== 404) { problems.push(`${need.variantId}: could not read review issue #${need.review.issue} (${r.status || r.error?.message}).`); continue; }
  }
  const problem = proofProblem(need, issue); if (problem) problems.push(problem);
}
for (const p of problems) console.error(`- ${p}`);
console.log(`Approval guard: ${needs.length} new approval(s), ${problems.length} without an owner review. ${problems.length ? 'FAILED' : 'PASS'}.`);
process.exitCode = problems.length ? 1 : 0;
