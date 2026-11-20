import test from 'node:test';
import assert from 'node:assert/strict';
import { composePhrase,musicRandom,clampMusicVolume,musicVolume,setMusicVolume,MusicPlayer,MUSIC,MUSIC_DEFAULT } from '../src/ui/music.js';

// Owner 19 Nov 2026 (79): a code-made soundtrack with a volume slider; 0 turns it off.
const store=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))};};
test('phrases stay in D Dorian, in time and in range, and vary between seeds',()=>{
  const a=composePhrase(musicRandom(7)),b=composePhrase(musicRandom(7)),c=composePhrase(musicRandom(8));
  assert.deepEqual(a,b);assert.notDeepEqual(a.notes,c.notes);assert.equal(a.beats,MUSIC.progression.length*4);
  const dorian=new Set([2,4,5,7,9,11,0]);for(const n of a.notes){assert.ok(dorian.has(n.midi%12),`note ${n.midi}`);assert.ok(n.beat>=0&&n.beat+n.length<=a.beats+1e-9);assert.ok(['drone','lute','recorder'].includes(n.voice));}
  assert.ok(a.notes.some(n=>n.voice==='lute')&&a.notes.some(n=>n.voice==='drone'));
});
test('the volume is clamped, stored in the browser and 0 keeps the music off',()=>{
  const s=store();assert.equal(musicVolume(s),MUSIC_DEFAULT);assert.equal(setMusicVolume(140,s),100);assert.equal(musicVolume(s),100);assert.equal(clampMusicVolume('x'),MUSIC_DEFAULT);assert.equal(clampMusicVolume(-5),0);
  const p=new MusicPlayer({storage:s});p.setVolume(0);assert.equal(musicVolume(s),0);assert.equal(p.start(),false,'off: nothing starts');
});
