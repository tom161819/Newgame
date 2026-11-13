# rim2.py in out [iterations] — removes the light outer band of a painted ground patch (warm, pale), keeping darker ground
import sys,numpy as np
from PIL import Image
from scipy import ndimage as ndi
src,dst=sys.argv[1],sys.argv[2];IT=int(sys.argv[3]) if len(sys.argv)>3 else 14
a=np.asarray(Image.open(src)).astype(np.float32);H,W,_=a.shape;rgb=a[...,:3];al=a[...,3]
mx=rgb.max(2);mn=rgb.min(2);sat=(mx-mn)/np.maximum(mx,1);lum=rgb@np.array([.299,.587,.114],np.float32)
rows=np.arange(H)[:,None]*np.ones((1,W))
cand=(al>=40)&(lum>118)&(sat<0.42)&(rows>0.6*H)
grow=al<40;ground=np.zeros_like(grow)
for _ in range(IT):
    nxt=ndi.binary_dilation(grow)&cand&~ground
    if not nxt.any():break
    ground|=nxt;grow|=nxt
a[...,3][ground]=np.minimum(al[ground],np.clip((150-lum[ground])/60,0,1)*120)
a[...,:3][ground]=0
Image.fromarray(a.clip(0,255).astype(np.uint8)).save(dst);print(dst,int(ground.sum()))
