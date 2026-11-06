// #147: the wall kit bakes its shadows in as near-black, semi-transparent pixels.
export const isShadowPixel=(r,g,b,a)=>a>0&&a<160&&Math.max(r,g,b)<48;
// Moves shadow pixels out of RGBA `data` (in place) and returns them as a separate RGBA layer.
export function splitPixels(data){const shadow=new Uint8ClampedArray(data.length);for(let i=0;i<data.length;i+=4)if(isShadowPixel(data[i],data[i+1],data[i+2],data[i+3])){shadow.set(data.subarray(i,i+4),i);data[i+3]=0;}return shadow;}
