from PIL import Image, ImageOps
import numpy as np, base64, io, json
C = {'steel':(0.19,0.33,0.59,0.62),'rockc':(0.04,0.28,0.61,0.43),'stepgs':(0.07,0.17,0.23,0.27),'tgb':(0.18,0.33,0.41,0.51),
     'anim':(0.37,0.12,0.51,0.30),'rcbox':(0.11,0.535,0.235,0.79),'gvroad':(0.31,0.07,0.71,0.27),'rcroad':(0.16,0.30,0.84,0.40),
     'gs':(0.06,0.37,0.59,0.53),'comb':(0.06,0.41,0.43,0.55),'slope':(0.15,0.12,0.36,0.37)}
def light(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)/255
    a = 1-a  # invert
    # hue rotate 180: swap via HSV
    import colorsys
    h = Image.fromarray((a*255).astype('uint8')).convert('HSV'); hv = np.asarray(h).copy(); hv[...,0] = (hv[...,0].astype(int)+128)%256
    out = Image.fromarray(hv,'HSV').convert('RGB')
    # push background to #f8fafc
    o = np.asarray(out).astype(np.int16); bg = (o.min(axis=2)>225); o[bg]=[248,250,252]
    return Image.fromarray(o.astype('uint8'))
res = {}
for k,(x0,y0,x1,y1) in C.items():
    im = Image.open(k+'.png').convert('RGB'); W,H = im.size
    c = im.crop((int(x0*W),int(y0*H),int(x1*W),int(y1*H)))
    c = light(c); c.thumbnail((432,232), Image.LANCZOS)
    bg = Image.new('RGB',(440,240),(248,250,252)); bg.paste(c,((440-c.size[0])//2,(240-c.size[1])//2))
    bg.save('t_'+k+'.png'); b = io.BytesIO(); bg.save(b,'PNG',optimize=True); res[k]=len(b.getvalue())
print(res)
grid = Image.new('RGB',(440*4,240*3),'white')
for i,k in enumerate(C): grid.paste(Image.open('t_'+k+'.png'),((i%4)*440,(i//4)*240))
grid.save('tgrid.png')
