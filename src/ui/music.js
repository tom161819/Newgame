// Owner 19 Nov 2026 (79): a soundtrack with a volume slider (0 = off) in Settings. It is composed by code (Web Audio,
// no audio files): a quiet drone, a plucked lute-like line and now and then a recorder-like tune in D Dorian, generated
// phrase by phrase so it never loops exactly. Provisional, for the owner to decide (a real recording can replace it).
// The volume is stored in this browser only, never in a save.
export const MUSIC_KEY='newgame.music';
export const MUSIC_DEFAULT=35;
export const MUSIC=Object.freeze({
  tempo:76,lookahead:.6,tick:200,master:.22,
  // D Dorian, MIDI notes. Chords as scale degrees (0 = D): Dm, C, G, Am, F, Dm.
  scale:Object.freeze([62,64,65,67,69,71,72,74,76,77,79,81]),
  progression:Object.freeze([[0,2,4],[6,8,10],[3,5,7],[4,6,8],[2,4,6],[0,2,4]]),
});
export function clampMusicVolume(value){const n=Math.round(Number(value));return Number.isFinite(n)?Math.max(0,Math.min(100,n)):MUSIC_DEFAULT;}
export function musicVolume(storage=globalThis.localStorage){try{const v=storage?.getItem?.(MUSIC_KEY);return v==null?MUSIC_DEFAULT:clampMusicVolume(v);}catch{return MUSIC_DEFAULT;}}
export function setMusicVolume(value,storage=globalThis.localStorage){const v=clampMusicVolume(value);try{storage?.setItem?.(MUSIC_KEY,String(v));}catch{/* session only */}return v;}
const hz=midi=>440*2**((midi-69)/12);
// A small seeded generator, so one phrase is the same when replayed in tests.
export function musicRandom(seed=1){let s=seed>>>0||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
// One phrase (one bar per chord): which notes start when (in beats), for the lute and the recorder.
export function composePhrase(random=Math.random,bars=MUSIC.progression.length){
  const notes=[],scale=MUSIC.scale;let melodyAt=Math.floor(random()*scale.length);
  const tune=random()<.55;
  for(let bar=0;bar<bars;bar++){
    const chord=MUSIC.progression[bar%MUSIC.progression.length],root=scale[chord[0]%scale.length]-12;
    notes.push({voice:'drone',beat:bar*4,length:4,midi:root-12});
    const pattern=random()<.5?[0,1,2,1]:[0,2,1,2];
    for(let i=0;i<8;i++){if(random()<.15)continue;const degree=chord[pattern[i%4]]%scale.length;notes.push({voice:'lute',beat:bar*4+i/2,length:.5,midi:scale[degree]-12});}
    if(tune){for(let beat=0;beat<4;){const length=random()<.3?2:1;if(random()<.8){melodyAt=Math.max(0,Math.min(scale.length-1,melodyAt+Math.round((random()-.5)*4)));if(beat===0)melodyAt=chord[Math.floor(random()*3)]%scale.length;notes.push({voice:'recorder',beat:bar*4+beat,length,midi:scale[melodyAt]});}beat+=length;}}
  }
  return {notes,beats:bars*4};
}
export class MusicPlayer {
  constructor({storage=globalThis.localStorage,random=Math.random,doc=globalThis.document}={}){
    this.storage=storage;this.random=random;this.doc=doc;this.volume=musicVolume(storage);this.audio=null;this.timer=null;this.nextPhraseAt=0;this.queue=[];
  }
  // Browsers allow sound only after a click or a key, so the first one starts it.
  start(){
    if(this.volume<=0||this.timer)return false;
    try{const Ctx=globalThis.AudioContext??globalThis.webkitAudioContext;if(!Ctx)return false;
      if(!this.audio){this.audio=new Ctx();this.out=this.audio.createGain();this.out.connect(this.audio.destination);}
      this.out.gain.value=this.level();if(this.audio.state==='suspended')this.audio.resume?.();
      this.nextPhraseAt=this.audio.currentTime+.3;this.timer=setInterval(()=>this.schedule(),MUSIC.tick);this.schedule();return true;}catch{return false;}
  }
  stop(){if(this.timer){clearInterval(this.timer);this.timer=null;}try{this.out?.gain.setTargetAtTime(0,this.audio.currentTime,.2);}catch{/* closed */}}
  level(){return MUSIC.master*(this.volume/100)**1.5;}
  setVolume(value){this.volume=setMusicVolume(value,this.storage);if(this.volume<=0){this.stop();return;}if(this.out){try{this.out.gain.setTargetAtTime(this.level(),this.audio.currentTime,.15);}catch{/* closed */}}if(!this.timer)this.start();/* the slider is a click too, so it may start the music */}
  suspend(hidden){if(!this.audio)return;try{if(hidden)this.audio.suspend?.();else if(this.volume>0)this.audio.resume?.();}catch{/* closed */}}
  schedule(){
    const a=this.audio;if(!a)return;const until=a.currentTime+MUSIC.lookahead,beat=60/MUSIC.tempo;
    while(this.nextPhraseAt<until){const phrase=composePhrase(this.random);const start=this.nextPhraseAt;for(const n of phrase.notes)this.note(n,start+n.beat*beat,n.length*beat);
      // A breath between phrases, sometimes longer.
      this.nextPhraseAt=start+phrase.beats*beat+(this.random()<.35?beat*4:0);}
  }
  note(n,at,length){
    const a=this.audio,osc=a.createOscillator(),gain=a.createGain();let peak,decay;
    if(n.voice==='drone'){osc.type='sine';peak=.18;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(peak,at+length*.4);gain.gain.linearRampToValueAtTime(0,at+length+.3);decay=length+.4;}
    else if(n.voice==='lute'){osc.type='triangle';peak=.16;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(peak,at+.01);gain.gain.exponentialRampToValueAtTime(.001,at+.9);decay=1;}
    else{osc.type='sine';peak=.11;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(peak,at+.06);gain.gain.setValueAtTime(peak,at+Math.max(.07,length-.1));gain.gain.linearRampToValueAtTime(0,at+length);decay=length+.05;
      const lfo=a.createOscillator(),depth=a.createGain();lfo.frequency.value=5;depth.gain.value=hz(n.midi)*.006;lfo.connect(depth).connect(osc.frequency);lfo.start(at);lfo.stop(at+decay);}
    osc.frequency.value=hz(n.midi);osc.connect(gain).connect(this.out);osc.start(at);osc.stop(at+decay);
  }
  destroy(){this.stop();try{this.audio?.close?.();}catch{/* closed */}this.audio=null;}
}
// Settings row #settings-music (a range 0–100 with its output) and the first click or key that starts the music.
export function bindMusic(doc=globalThis.document,signal,player=new MusicPlayer({doc})){
  const input=doc?.querySelector?.('#settings-music'),output=doc?.querySelector?.('#settings-music-value');
  const show=()=>{if(input)input.value=String(player.volume);if(output)output.textContent=player.volume>0?`${player.volume} %`:'–';};show();
  input?.addEventListener('input',()=>{player.setVolume(input.value);show();},{signal});
  const first=()=>{player.start();};for(const type of ['pointerdown','keydown'])doc?.addEventListener?.(type,first,{signal,once:true});
  doc?.addEventListener?.('visibilitychange',()=>player.suspend(doc.hidden),{signal});
  signal?.addEventListener?.('abort',()=>player.destroy());
  return player;
}
