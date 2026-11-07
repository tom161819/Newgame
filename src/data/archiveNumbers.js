// Archive renumbering (plan item m-verzovani-archivu, owner request 7 Nov 2026). Every archived development snapshot
// gets its own number that follows the released versions in time:
// - an official release keeps its number, and a snapshot of exactly that commit shows it too;
// - snapshots after release X.Y.Z (until the next release) become X.Y.(Z+1), X.Y.(Z+2)… in commit order;
// - when one of those would equal an official release, the whole interval uses a fourth place: X.Y.Z.1, X.Y.Z.2…;
// - snapshots before the first release (0.1.0) become 0.0.1, 0.0.2…, so numbers always grow with time.
// Archive folders and URLs keep their commit IDs; only the shown number changes. The old label stays as legacyLabel.
const parts=version=>String(version).split('.').map(Number);
const compare=(a,b)=>{const x=parts(a),y=parts(b);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]??0)-(y[i]??0);if(d)return Math.sign(d);}return 0;};
export const archiveNumberParts=parts;
// releases: official versions [{version:'X.Y.Z',commit,date}]; snapshots: [{commit,date,order}] (order breaks date ties).
// Returns Map commit → number (string). Throws when the result would not be unique or not chronological.
export function archiveNumbers({releases,snapshots}){
  const official=releases.filter(r=>/^\d+\.\d+\.\d+$/.test(r.version)).map(r=>({...r,time:Date.parse(r.date)})).sort((a,b)=>a.time-b.time||compare(a.version,b.version));
  const versions=new Set(official.map(r=>r.version)),byCommit=new Map(official.filter(r=>r.commit).map(r=>[r.commit,r.version])),numbers=new Map();
  const seen=new Set(),list=snapshots.filter(s=>{if(seen.has(s.commit))return false;seen.add(s.commit);return true;}).map(s=>({...s,time:Date.parse(s.date)})).sort((a,b)=>a.time-b.time||(a.order??0)-(b.order??0));
  const groups=new Map();
  for(const s of list){
    if(byCommit.has(s.commit)){numbers.set(s.commit,byCommit.get(s.commit));continue;}
    let base='0.0.0';for(const r of official)if(r.time<=s.time)base=r.version;else break;
    if(!groups.has(base))groups.set(base,[]);groups.get(base).push(s);
  }
  for(const [base,items]of groups){
    const [major,minor,patch]=parts(base),simple=items.map((_,i)=>`${major}.${minor}.${patch+i+1}`);
    const next=official.find(r=>compare(r.version,base)>0)?.version??null;
    const clash=simple.some(v=>versions.has(v)||(next&&compare(v,next)>=0));
    items.forEach((s,i)=>numbers.set(s.commit,clash?`${base}.${i+1}`:simple[i]));
  }
  const used=new Map();for(const [commit,number]of numbers){if(used.has(number)&&!byCommit.has(commit))throw new Error(`Archive number ${number} is used twice.`);used.set(number,commit);}
  return numbers;
}
// Shown like other versions (#174: minor and later places padded to two digits): 0.3.0.1 → 0.03.00.01.
export function displayArchiveNumber(number){const [major,...rest]=parts(number);return [major,...rest.map(n=>String(n).padStart(2,'0'))].join('.');}
export { compare as compareArchiveNumbers };
