// A minimal PNG reader/writer for the art scripts (8-bit greyscale/RGB/RGBA/palette, non-interlaced → RGBA).
import { inflateSync, deflateSync } from 'node:zlib';
const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const CRC=new Uint32Array(256).map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const crc32=buf=>{let c=0xffffffff;for(const b of buf)c=CRC[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
export function decodePng(file){
  if(!Buffer.from(file.subarray(0,8)).equals(SIGNATURE))throw new Error('not a PNG');
  let offset=8,width=0,height=0,depth=0,type=0,interlace=0,palette=null,alpha=null;const idat=[];
  while(offset<file.length){
    const length=file.readUInt32BE(offset),name=file.toString('ascii',offset+4,offset+8),data=file.subarray(offset+8,offset+8+length);offset+=12+length;
    if(name==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];type=data[9];interlace=data[12];}
    else if(name==='PLTE')palette=data;else if(name==='tRNS')alpha=data;else if(name==='IDAT')idat.push(data);else if(name==='IEND')break;
  }
  if(depth!==8||interlace)throw new Error(`unsupported PNG (depth ${depth}, interlace ${interlace})`);
  const channels={0:1,2:3,3:1,4:2,6:4}[type],stride=width*channels,raw=inflateSync(Buffer.concat(idat)),pixels=new Uint8Array(stride*height);
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)],line=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1)),out=pixels.subarray(y*stride,(y+1)*stride),prev=y?pixels.subarray((y-1)*stride,y*stride):null;
    for(let i=0;i<stride;i++){
      const a=i>=channels?out[i-channels]:0,b=prev?prev[i]:0,c=prev&&i>=channels?prev[i-channels]:0;let v=line[i];
      if(filter===1)v+=a;else if(filter===2)v+=b;else if(filter===3)v+=(a+b)>>1;else if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v+=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
      out[i]=v&255;
    }
  }
  const data=new Uint8Array(width*height*4);
  for(let i=0;i<width*height;i++){
    const s=i*channels,d=i*4;
    if(type===6){data[d]=pixels[s];data[d+1]=pixels[s+1];data[d+2]=pixels[s+2];data[d+3]=pixels[s+3];}
    else if(type===2){data[d]=pixels[s];data[d+1]=pixels[s+1];data[d+2]=pixels[s+2];data[d+3]=255;}
    else if(type===0){data[d]=data[d+1]=data[d+2]=pixels[s];data[d+3]=255;}
    else if(type===4){data[d]=data[d+1]=data[d+2]=pixels[s];data[d+3]=pixels[s+1];}
    else{const p=pixels[s];data[d]=palette[p*3];data[d+1]=palette[p*3+1];data[d+2]=palette[p*3+2];data[d+3]=alpha&&p<alpha.length?alpha[p]:255;}
  }
  return {width,height,data};
}
function chunk(name,data){const head=Buffer.alloc(8);head.writeUInt32BE(data.length,0);head.write(name,4,'ascii');const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4),data])),0);return Buffer.concat([head,data,crc]);}
export function encodePng({width,height,data}){
  const stride=width*4,raw=Buffer.alloc((stride+1)*height);
  for(let y=0;y<height;y++){ // filter 1 (sub) per line: compact for sprites, exact on decode
    const o=y*(stride+1);raw[o]=1;for(let i=0;i<stride;i++)raw[o+1+i]=(data[y*stride+i]-(i>=4?data[y*stride+i-4]:0))&255;
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([SIGNATURE,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
