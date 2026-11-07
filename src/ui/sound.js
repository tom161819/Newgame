// E4: short synthesized chimes (no audio files). Settings → Sound turns them off; stored in this browser only.
export const SOUND_KEY='newgame.sound';
export function soundEnabled(){try{return localStorage.getItem(SOUND_KEY)!=='off';}catch{return true;}}
export function setSoundEnabled(on){try{localStorage.setItem(SOUND_KEY,on?'on':'off');}catch{/* session only */}}
const CHIMES=Object.freeze({built:[[660,0],[880,.09]],goal:[[523,0],[659,.1],[784,.2],[1047,.3]]});
let audio=null,lastAt={};
// A row of wall pieces finishing together plays one chime, not one per piece.
export const CHIME_GAP_MS=400;
export function playChime(kind='built'){
  if(!soundEnabled())return false;
  const now0=globalThis.performance?.now?.()??Date.now();if(now0-(lastAt[kind]??-Infinity)<CHIME_GAP_MS)return false;lastAt[kind]=now0;
  try{
    const Ctx=globalThis.AudioContext??globalThis.webkitAudioContext;if(!Ctx)return false;
    audio??=new Ctx();if(audio.state==='suspended')audio.resume?.();
    const now=audio.currentTime;
    for(const [freq,at] of CHIMES[kind]??CHIMES.built){
      const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.value=freq;
      gain.gain.setValueAtTime(0,now+at);gain.gain.linearRampToValueAtTime(.07,now+at+.02);gain.gain.exponentialRampToValueAtTime(.001,now+at+.45);
      osc.connect(gain).connect(audio.destination);osc.start(now+at);osc.stop(now+at+.5);
    }
    return true;
  }catch{return false;}
}
// Settings row #settings-sound.
export function bindSoundSetting(doc=globalThis.document,signal){
  const input=doc?.querySelector?.('#settings-sound');if(!input)return;input.checked=soundEnabled();
  input.addEventListener('change',()=>{setSoundEnabled(input.checked);if(input.checked)playChime('built');},{signal});
}
