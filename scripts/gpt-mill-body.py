import numpy as np,cv2
from PIL import Image
from scipy import ndimage as ndi
exec(open('sails.py').read().split("rm=cv2.dilate")[0].replace("m,_,_=armmask(e,23,8,10)","m,_,_=armmask(e,27,8,24)"))
rm=cv2.dilate(rm.astype(np.uint8),np.ones((3,3),np.uint8))>0
n=np.asarray(Image.open('p-90.png')).astype(np.float32)
sh=np.zeros_like(a)
dx,dy=-3,-9
Hn,Wn=n.shape[:2]
for y in range(H):
    sy=y-dy
    if 0<=sy<Hn:
        x0=max(0,dx);x1=min(W,Wn+dx);sh[y,x0:x1]=n[sy,x0-dx:x1-dx]
srgb=sh[...,:3];smx=srgb.max(2);smn=srgb.min(2);ssat=(smx-smn)/np.maximum(smx,1);slum=srgb@np.array([.299,.587,.114],np.float32)
sail90=(xx<125)&(((ssat>0.4)&(slum<160))|(xx<103))
ok=(sh[...,3]>128)&~sail90
out=a.copy()
w=np.clip(ndi.gaussian_filter(rm.astype(np.float32),1.5)*1.6,0,1)[...,None]*(ok[...,None]|rm[...,None])
w=np.where((rm&ok)[...,None],np.maximum(w,0.85),np.where(ok[...,None]&(a[...,3:4]>128),w,0))
out[...,:3]=a[...,:3]*(1-w)+srgb*w
out[...,3]=np.where(rm,np.where(ok,255,0),a[...,3])
# remaining holes inside the silhouette: rm & ~ok but surrounded by body -> inpaint
gap=rm&~ok&(xx>=100)&(yy>100)
img=out.clip(0,255).astype(np.uint8)
m8=gap.astype(np.uint8)*255
rgb_in=cv2.inpaint(np.ascontiguousarray(img[...,:3]),m8,5,cv2.INPAINT_TELEA)
fill=ndi.binary_fill_holes(img[...,3]>128)
img[...,:3]=np.where(gap[...,None],rgb_in,img[...,:3]);img[...,3]=np.where(gap&fill,255,img[...,3])
zone=ndi.binary_dilation(rm,iterations=4)
A=img[...,3]>128;Ao=ndi.binary_closing(ndi.binary_opening(A,structure=np.ones((7,7))),structure=np.ones((9,9)))
newA=np.where(zone,Ao,A)
img[...,:3]=np.where((newA&~A)[...,None],cv2.inpaint(np.ascontiguousarray(img[...,:3]),((newA&~A)*255).astype(np.uint8),4,cv2.INPAINT_TELEA),img[...,:3])
img[...,3]=np.where(zone,newA*255,img[...,3]).astype(np.uint8)
# keep only the main body
lab,nn=ndi.label(img[...,3]>40);s=ndi.sum(img[...,3]>40,lab,range(1,nn+1));big=int(np.argmax(s))+1
img[...,3][lab!=big]=0
Image.fromarray(img).save('body.png');print('ok')
