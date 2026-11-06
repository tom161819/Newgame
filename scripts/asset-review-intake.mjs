// #214: GitHub Actions intake for an `asset-review` issue. Validates the Studio payload against main, posts one
// summary comment, closes older reviews it supersedes and labels the issue for Claude. Never writes to the repo.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parsePayload, checkItems, summaryComment, supersededBy, loadCatalog, authorProblem } from './asset-review-lib.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
const repo = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN, issue = event.issue, dry = process.argv.includes('--dry-run');
const api = async (method, url, body) => { if (dry) { console.log(`DRY ${method} ${url}`, body ? JSON.stringify(body).slice(0, 300) : ''); return {}; } const r = await fetch(`https://api.github.com/repos/${repo}${url}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); if (!r.ok) throw new Error(`${method} ${url}: ${r.status} ${await r.text()}`); return r.status === 204 ? {} : r.json(); };
const marker = '<!-- asset-review-intake -->';
const { payload, error } = parsePayload(issue.body);
if (error) { await api('POST', `/issues/${issue.number}/comments`, { body: `${marker}\n${error}` }); console.log(error); process.exit(0); }
const items = checkItems(payload, loadCatalog(root)), author = issue.user?.login, problem = authorProblem(issue, { edited: event.action === 'edited' && !!event.changes?.body });
let superseded = [];
if (!problem) {
  const open = dry ? (event.openReviews ?? []) : (await api('GET', `/issues?labels=asset-review&state=open&per_page=100`)).filter(i => i.number !== issue.number).map(i => ({ issue: i.number, ...((p => p.payload ? { submissionId: p.payload.submissionId, items: p.payload.items } : { submissionId: null, items: [] })(parsePayload(i.body))) }));
  superseded = supersededBy(payload, open);
  for (const n of superseded) { await api('POST', `/issues/${n}/comments`, { body: `Superseded by #${issue.number} (${payload.submissionId}).` }); await api('PATCH', `/issues/${n}`, { state: 'closed', state_reason: 'not_planned' }); }
}
const body = `${marker}\n${summaryComment({ payload, items, author, problem, superseded })}`;
// One summary per issue: an edited issue updates the existing comment instead of adding another.
const existing = dry ? null : (await api('GET', `/issues/${issue.number}/comments?per_page=100`)).find(c => c.body?.startsWith(marker));
if (existing) await api('PATCH', `/issues/comments/${existing.id}`, { body }); else await api('POST', `/issues/${issue.number}/comments`, { body });
if (!problem && items.some(i => i.check === 'ok')) await api('POST', `/issues/${issue.number}/labels`, { labels: ['asset-review', 'agent:claude', 'status:ready'] });
console.log(body);
