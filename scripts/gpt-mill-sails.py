import numpy as np,cv2,json
from PIL import Image
a=np.asarray(Image.open('p-0.png')).astype(np.float32);H,W,_=a.shape
rgb=a[...,:3];al=a[...,3]
hub=np.array([120.,159.])
ends=[(35,47),(215,45),(37,250),(225,267)]
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def armmask(end,hw,r0=0,extra=6):
    d=np.array(end,np.float32)-hub;L=np.linalg.norm(d);u=d/L
    px,py=xx-hub[0],yy-hub[1];t=px*u[0]+py*u[1];n=np.abs(-px*u[1]+py*u[0])
    return (t>r0)&(t<L+extra)&(n<hw),t,n
mx=rgb.max(2);mn=rgb.min(2);sat=(mx-mn)/np.maximum(mx,1);lum=rgb@np.array([.299,.587,.114],np.float32)
wood=(sat>0.42)&(lum<150)&(rgb[...,0]>rgb[...,1]*1.12)
hubm=((xx-hub[0])**2+(yy-hub[1])**2)<18**2
# --- body without sails
rm=np.zeros((H,W),bool)
for e in ends:
    m,_,_=armmask(e,23,8,10);rm|=m
rm|=hubm
rm=cv2.dilate(rm.astype(np.uint8),np.ones((3,3),np.uint8))>0
img=a.astype(np.uint8)
mask=rm.astype(np.uint8)*255
rgb_in=cv2.inpaint(np.ascontiguousarray(img[...,:3]),mask,9,cv2.INPAINT_TELEA)
al_in=cv2.inpaint(np.ascontiguousarray(img[...,3]),mask,9,cv2.INPAINT_TELEA)
al_in=np.where(rm,np.where(al_in>110,255,0),img[...,3]).astype(np.uint8)
body=np.dstack([rgb_in,al_in]);Image.fromarray(body).save('body.png')
# --- one arm (upper-left), as a layer
m,t,n=armmask(ends[0],15,14,4)
armpix=m&(al>128)&(wood|(t>45))
arm=np.zeros_like(img);arm[armpix]=img[armpix]
# hub disc
hubpix=hubm&(al>128);hubimg=np.zeros_like(img);hubimg[hubpix]=img[hubpix]
L=int(np.linalg.norm(np.array(ends[0])-hub))+8;S=2*L+4;c=S//2
canvas=np.zeros((S,S,4),np.uint8)
def place(layer):
    out=np.zeros((S,S,4),np.uint8);x0=int(hub[0])-c;y0=int(hub[1])-c
    for y in range(S):
        sy=y+y0
        if 0<=sy<H:
            xs=slice(max(0,-x0),min(S,W-x0));out[y,xs]=layer[sy,xs.start+x0:xs.stop+x0]
    return out
armc=place(arm)
rot=np.zeros((S,S,4),np.float32)
for k in range(4):
    M=cv2.getRotationMatrix2D((c,c),90*k,1.0)
    r=cv2.warpAffine(armc,M,(S,S),flags=cv2.INTER_LINEAR)
    al_r=r[...,3:4]/255.0;rot[...,:3]=rot[...,:3]*(1-al_r)+r[...,:3]*al_r;rot[...,3]=np.maximum(rot[...,3],r[...,3])
h=place(hubimg).astype(np.float32);ah=h[...,3:4]/255;rot[...,:3]=rot[...,:3]*(1-ah)+h[...,:3]*ah;rot[...,3]=np.maximum(rot[...,3],h[...,3])
Image.fromarray(rot.clip(0,255).astype(np.uint8)).save('rotor.png')
json.dump({'hub':hub.tolist(),'size':S},open('rotor.json','w'));print(S)
