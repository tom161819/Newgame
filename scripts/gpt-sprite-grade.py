# post.py in.png out.png bglum  — ground halo -> soft shadow, then grade to the game's palette
import sys,numpy as np
from PIL import Image
from scipy import ndimage as ndi
src,dst,bgl=sys.argv[1],sys.argv[2],float(sys.argv[3])
a=np.asarray(Image.open(src).convert('RGBA')).astype(np.float32);H,W,_=a.shape
rgb=a[...,:3];al=a[...,3]
mx=rgb.max(2);mn=rgb.min(2);sat=(mx-mn)/np.maximum(mx,1);lum=rgb@np.array([.299,.587,.114],np.float32)
wt=(al>200).astype(np.float32);ww=np.maximum(ndi.uniform_filter(wt,5),1e-3);lm=ndi.uniform_filter(lum*wt,5)/ww;sd=np.sqrt(np.maximum(ndi.uniform_filter(lum*lum*wt,5)/ww-lm*lm,0))
rows=np.arange(H)[:,None]*np.ones((1,W))
outside=al<128
cand=(al>=128)&(sat<0.14)&(lum>135)&(lum<bgl-3)&(sd<11)&(rows>0.55*H)
ground=np.zeros_like(outside)
grow=outside.copy()
for _ in range(36):
    nxt=ndi.binary_dilation(grow)&cand&~ground
    if not nxt.any():break
    ground|=nxt;grow|=nxt
# also the soft anti-aliased rim: semi-opaque pale pixels next to the outside
rim=(al>8)&(al<250)&(sat<0.14)&(lum>150)&(rows>0.5*H)
ground|=rim
shade=np.clip((bgl-lum)/90,0,1)*170
out=a.copy()
out[...,:3][ground]=0
out[...,3][ground]=np.minimum(shade[ground],170)
# grade: darker, slightly compressed highlights, a touch less saturated (matches the Studio-rendered game art)
c=out[...,:3]/255.0
c=np.power(np.clip(c,0,1),1.1)*0.86
g=(c@np.array([.299,.587,.114],np.float32))[...,None]
c=g+(c-g)*0.93
out[...,:3]=np.where(ground[...,None],0,c*255)
Image.fromarray(out.clip(0,255).astype(np.uint8),'RGBA').save(dst)
print(dst,int(ground.sum()))
