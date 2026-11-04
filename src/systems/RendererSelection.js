// Renderer choice for the current page load. Canvas stays the default because it
// performs well without GPU acceleration; WebGL is opt-in through ?renderer=.
export const RENDERER_PREFERENCES=Object.freeze(['canvas','webgl','auto']);
export const DEFAULT_RENDERER_PREFERENCE='canvas';
const SOFTWARE_RENDERERS=/swiftshader|llvmpipe|softpipe|software|basic render driver/i;

export function parseRendererPreference(search=''){
  let value=null;try{value=new URLSearchParams(search).get('renderer');}catch{/* Invalid query keeps the default. */}
  value=value?.trim().toLowerCase();
  return RENDERER_PREFERENCES.includes(value)?value:DEFAULT_RENDERER_PREFERENCE;
}

// Creates a short-lived context. requireHardware asks the browser to refuse
// contexts with a major performance caveat (software rasterisers such as SwiftShader).
export function probeWebGL(doc=globalThis.document,{requireHardware=false}={}){
  let canvas,context;
  try{
    canvas=doc?.createElement?.('canvas');if(!canvas?.getContext)return {available:false,hardware:false,renderer:null,reason:'WebGL is not supported by this browser.'};
    const attributes={failIfMajorPerformanceCaveat:requireHardware};
    context=canvas.getContext('webgl2',attributes)??canvas.getContext('webgl',attributes)??canvas.getContext('experimental-webgl',attributes);
    if(!context)return {available:false,hardware:false,renderer:null,reason:requireHardware?'No hardware-accelerated WebGL is available.':'WebGL is not available.'};
    const debug=context.getExtension?.('WEBGL_debug_renderer_info');
    const renderer=String((debug&&context.getParameter?.(debug.UNMASKED_RENDERER_WEBGL))??context.getParameter?.(context.RENDERER)??'')||null;
    const hardware=!SOFTWARE_RENDERERS.test(renderer??'');
    return {available:true,hardware,renderer,reason:hardware?'':'WebGL uses a software rasteriser.'};
  }catch(error){return {available:false,hardware:false,renderer:null,reason:`WebGL probe failed: ${error?.message??error}`};}
  finally{try{context?.getExtension?.('WEBGL_lose_context')?.loseContext();}catch{/* Best effort cleanup. */}}
}

// Pure decision used by main.js and the tests. probe(requireHardware) returns probeWebGL's result.
export function chooseRenderer(preference,probe){
  if(preference==='webgl'){
    const result=probe(false);
    return result.available?{type:'webgl',preference,reason:result.hardware?'':result.reason,gpu:result.renderer}:{type:'canvas',preference,reason:`${result.reason} Using Canvas.`,gpu:null};
  }
  if(preference==='auto'){
    const result=probe(true);
    return result.available&&result.hardware?{type:'webgl',preference,reason:'',gpu:result.renderer}:{type:'canvas',preference,reason:`${result.reason||'No hardware-accelerated WebGL is available.'} Using Canvas.`,gpu:null};
  }
  return {type:'canvas',preference:DEFAULT_RENDERER_PREFERENCE,reason:'',gpu:null};
}

export function rendererLabel(choice){
  const name=choice.type==='webgl'?'WebGL':'Canvas';
  const mode=choice.preference==='canvas'?'default':choice.preference==='auto'?'auto':'requested';
  return `${name} (${mode})${choice.reason?` · ${choice.reason}`:''}`;
}
