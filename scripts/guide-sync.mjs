// "Převzít průvodce" (owner 15 Nov 2026): writes the Studio Guide page's draft (the `guide/draft` document saved to a
// JSON file) into src/data/guide.js. Usage: npm run guide:sync -- <draft.json> [--dry-run]
// Missing English texts stay empty (the game shows the Czech text); Claude translates them in the file before the run.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { draftProblems } from '../studio/src/lib/guideDraft.js';
import { JOBS } from '../src/data/jobs.js';
import { objectDefinitions } from '../src/data/objects/index.js';

export function guideSource(draft, header) {
  const js = value => JSON.stringify(value).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:');
  const text = t => t && (t.cs || t.en) ? `{cs:${JSON.stringify(t.cs ?? '')},en:${JSON.stringify(t.en || t.cs || '')}}` : 'null';
  const intro = draft.intro.map(s => `    {id:${JSON.stringify(s.id)},check:${JSON.stringify(s.check)},target:${JSON.stringify(s.target)},text:${text(s.text)}},`);
  const tasks = draft.tasks.map(t => `    {id:${JSON.stringify(t.id)},kind:${JSON.stringify(t.kind)},${t.kind === 'build' ? `building:${JSON.stringify(t.building)},` : ''}${t.kind === 'job' ? `job:${JSON.stringify(t.job)},` : ''}title:${text(t.title)},why:${text(t.why)}},`);
  const tips = draft.tips.map(t => `    {id:${JSON.stringify(t.id)},kind:${JSON.stringify(t.kind)},${t.target !== undefined ? `target:${js(t.target)},` : ''}${t.wiki ? `wiki:${JSON.stringify(t.wiki)},` : ''}text:${text(t.text)}},`);
  return `${header}export const GUIDE=Object.freeze({\n  intro:Object.freeze([\n${intro.join('\n')}\n  ].map(step=>Object.freeze(step))),\n  tasks:Object.freeze([\n${tasks.join('\n')}\n  ].map(task=>Object.freeze(task))),\n  tips:Object.freeze([\n${tips.join('\n')}\n  ].map(tip=>Object.freeze(tip))),\n  tipGap:${Number(draft.tipGap)},\n});\nexport const GUIDE_TASK_KINDS=Object.freeze(['build','job','king','water']);\n// A text of the guide in the language of the game (cs or en, the other one as fallback); null when none is written.\nexport function guideText(text,lang='cs'){if(!text)return null;return text[lang]||text.cs||text.en||null;}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2), file = args.find(a => !a.startsWith('--')), dry = args.includes('--dry-run');
  if (!file) { console.error('Usage: npm run guide:sync -- <draft.json> [--dry-run]'); process.exit(2); }
  const raw = JSON.parse(await readFile(file, 'utf8')), draft = raw.data ?? raw;
  const problems = draftProblems(draft, { buildings: new Set(objectDefinitions.filter(d => d.category === 'building').map(d => d.id)), jobs: new Set(Object.keys(JOBS)) });
  if (problems.length) { for (const p of problems) console.error(`- ${p}`); process.exit(1); }
  const target = fileURLToPath(new URL('../src/data/guide.js', import.meta.url)), current = await readFile(target, 'utf8');
  const header = current.slice(0, current.indexOf('export const GUIDE=Object.freeze({'));
  const next = guideSource(draft, header);
  console.log(`Guide: ${draft.intro.length} start arrows, ${draft.tasks.length} tasks, ${draft.tips.length} tips, gap ${draft.tipGap} s.${next === current ? ' No change.' : ''}`);
  if (!dry && next !== current) await writeFile(target, next);
}
