// v8.2：3D 視圖（WebGL、平移縮放、預設視角、左側圖示、結構物／基樁／護岸）
const {chromium}=require('playwright');const fs=require('fs');const OUT='/home/claude/prev/shots/';try{fs.mkdirSync(OUT,{recursive:true});}catch(e){}
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1600,height:950}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
const fail=m=>errs.push('FAIL '+m);
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(3000);
const dxf0=await pg.evaluate(()=>buildFullDXF().length);
await pg.evaluate(()=>setViewMode('3D'));await pg.waitForTimeout(1200);
const r=await pg.evaluate(()=>{const o={};o.mode=V3D.mode;o.stat=V3D.mesh.stat;o.cnt=[V3D.mesh.terr.cnt,V3D.mesh.obj.st.cnt,V3D.mesh.obj.rv.cnt];
 o.tabs=[...document.querySelectorAll('.panel-tabs .panel-tab')].filter(t=>t.offsetParent).map(t=>t.textContent);
 o.vc=getComputedStyle(document.getElementById('viewCtl')).display;o.bar=getComputedStyle(document.getElementById('v3dBar')).display;
 o.hid=[...document.querySelectorAll('[data-v3dhide]')].map(c=>c.style.display);o.c3=document.getElementById('card3D').parentElement.id;
 const dpr=window.devicePixelRatio||1,w=cadCanvas.width/dpr,h=cadCanvas.height/dpr,C=v3dCam(w,h),M=v3dMatrix(C,V3D.mesh.O,w,h),O=V3D.mesh.O;
 const p=[state.sections[10].cx,state.sections[10].cy,state.sections[10].groundCenter],q=C.P(...p),v=[p[0]-O[0],p[1]-O[1],p[2]-O[2]];
 const X=M[0]*v[0]+M[4]*v[1]+M[8]*v[2]+M[12],Y=M[1]*v[0]+M[5]*v[1]+M[9]*v[2]+M[13],Z=M[2]*v[0]+M[6]*v[1]+M[10]*v[2]+M[14];
 o.mat=[Math.abs((X+1)/2*w-q.sx),Math.abs((1-Y)/2*h-q.sy),Math.abs(Z)<1];
 const mx=q.sx+50,my=q.sy-30;v3dZoomAt(1.6,mx,my);const C2=v3dCam(w,h);const pz=C2.P(...p);o.zoomFix=[Math.abs(pz.sx-mx-(q.sx-mx)*1.6),Math.abs(pz.sy-my-(q.sy-my)*1.6)];
 const a=C2.P(...p);v3dPan(40,-25);const b2=v3dCam(w,h).P(...p);o.pan=[b2.sx-a.sx,b2.sy-a.sy];
 v3dView('top');const T=v3dCam(w,h),n0=T.P(p[0],p[1],p[2]),n1=T.P(p[0],p[1]+10,p[2]),e1=T.P(p[0]+10,p[1],p[2]);o.top=[n1.sy<n0.sy,e1.sx>n0.sx,Math.abs(n1.sx-n0.sx)<1e-6];
 v3dView('dn');const g=getPointAndNormalAtStation(v3dMidSta()),dd=stDownDir(v3dMidSta());o.dn=Math.abs(Math.sin(state.cam3D.yaw)-g.tx*dd)<1e-6&&Math.abs(Math.cos(state.cam3D.yaw)-g.ty*dd)<1e-6;
 v3dView('lb');o.lb=Math.abs(Math.sin(state.cam3D.yaw)+g.nx)<1e-6;
 v3dPrev();v3dPrev();v3dFit();o.fit=state.cam3D.t===null&&state.cam3D.zoom===1;return o;});
console.log(JSON.stringify(r));
if(r.mode!=='gl')fail('mode '+r.mode);
if(!(r.stat.st>=1&&r.stat.rv>=3&&r.cnt.every(v=>v>0)))fail('mesh '+JSON.stringify(r.stat));
if(r.tabs.join()!=='顯示,視角,圖層,水力')fail('tabs '+r.tabs);
if(r.vc!=='flex'||r.bar!=='flex')fail('bars');
if(r.hid.length<2||r.hid.some(v=>v!=='none'))fail('hide2d '+r.hid);
if(r.c3!=='tab-3dv')fail('card3D '+r.c3);
if(!(r.mat[0]<0.01&&r.mat[1]<0.01&&r.mat[2]))fail('matrix '+r.mat);
if(!(r.zoomFix[0]<0.01&&r.zoomFix[1]<0.01))fail('zoomAt '+r.zoomFix);
if(!(Math.abs(r.pan[0]-40)<0.01&&Math.abs(r.pan[1]+25)<0.01))fail('pan '+r.pan);
if(!r.top.every(Boolean))fail('top '+r.top);if(!r.dn)fail('dn');if(!r.lb)fail('lb');if(!r.fit)fail('fit');
// 畫面：壩體位置有畫出（不是背景色）
await pg.evaluate(()=>{const st=state.structs[0];const w=stWorld(st,0,0);state.cam3D.t=[w[0],w[1],stPlace(st).zS];state.cam3D.zoom=9;state.cam3D.yaw=2.4;state.cam3D.pitch=0.45;requestRedraw();});await pg.waitForTimeout(700);
const px=await pg.evaluate(()=>{const c=V3D.glc,g=V3D.gl,dpr=window.devicePixelRatio||1,st=state.structs[0],w=stWorld(st,0,0),C=v3dCam(cadCanvas.width/dpr,cadCanvas.height/dpr),q=C.P(w[0],w[1],stPlace(st).zS-0.3);const a=new Uint8Array(4);g.readPixels(Math.round(q.sx*dpr),Math.round(c.height-q.sy*dpr),1,1,g.RGBA,g.UNSIGNED_BYTE,a);return [...a];});
if(px[0]<60&&px[1]<60&&px[2]<60)fail('dam pixel '+px);
await pg.screenshot({path:OUT+'v3d_dam.png'});
// 滑鼠：右鍵拖曳＝平移、左鍵＝旋轉、滾輪＝縮放；F 鍵留在 3D
const m0=await pg.evaluate(()=>JSON.stringify(state.cam3D));
await pg.mouse.move(1000,500);await pg.mouse.down({button:'right'});await pg.mouse.move(1060,520,{steps:4});await pg.mouse.up({button:'right'});
const m1=await pg.evaluate(()=>state.cam3D);
await pg.mouse.down();await pg.mouse.move(1100,560,{steps:4});await pg.mouse.up();
const m2=await pg.evaluate(()=>state.cam3D);
await pg.mouse.wheel(0,-200);await pg.waitForTimeout(200);const m3=await pg.evaluate(()=>state.cam3D);
const p0=JSON.parse(m0);if(JSON.stringify(m1.t)===JSON.stringify(p0.t)||m1.yaw!==p0.yaw)fail('rdrag');if(m2.yaw===m1.yaw||JSON.stringify(m2.t)!==JSON.stringify(m1.t))fail('ldrag');if(!(m3.zoom>m2.zoom))fail('wheel');
await pg.keyboard.press('f');await pg.waitForTimeout(200);if(await pg.evaluate(()=>state.viewMode)!=='3D')fail('F key left 3D');
if(await pg.evaluate(()=>buildFullDXF().length)!==dxf0)fail('dxf changed');
// B1／B2：設計後地形與切換
const dz=await pg.evaluate(()=>{const o={};o.def=V3D.tm;o.des=V3D.mesh.desA?V3D.mesh.desA.cnt:0;o.out=V3D.mesh.terrOut.cnt;o.all=V3D.mesh.terr.cnt;o.leg=document.getElementById('v3dLeg').textContent;
 const m=[];['orig','both','des'].forEach(k=>{v3dSetTm(k);v3dRender();m.push(v3dTerrSet(V3D.mesh).mode)});o.modes=m;
 const D=V3D.mesh.desA,cols=new Set();for(let i=0;i<D.c.length;i+=4)cols.add(D.c[i]+','+D.c[i+1]+','+D.c[i+2]);o.cut=cols.has(V3D_COL.cut.join());o.fill=cols.has(V3D_COL.fill.join());return o;});
console.log('design',JSON.stringify(dz));
if(!(dz.des>1000&&dz.out>0&&dz.out<dz.all))fail('design mesh '+JSON.stringify(dz));
if(dz.modes.join()!=='orig,both,des')fail('modes '+dz.modes);if(!dz.cut||!dz.fill)fail('cut/fill colour');
// A2：護岸外框高程異常的斷面略過並列出
const bad=await pg.evaluate(()=>{const f=rvGeomSec,s0=state.sections[20].sta;rvGeomSec=function(sec,sd){const g=f(sec,sd);if(g&&Math.abs(sec.sta-s0)<1e-6&&sd==='L'){const G=Object.assign({},g.G,{polys:g.G.polys.map(p=>Object.assign({},p,{pts:p.pts.map((q,i)=>i?q:[q[0],q[1]+500])}))});return Object.assign({},g,{G});}return g;};
 V3D.mesh.oSig='';v3dRender();const r=[V3D.mesh.stat.rvBad.slice(),document.getElementById('v3dStat').textContent.includes('略過')];rvGeomSec=f;V3D.mesh.oSig='';v3dRender();r.push(V3D.mesh.stat.rvBad.length);return r;});
console.log('bad',JSON.stringify(bad));if(bad[0].length!==1||!bad[1]||bad[2]!==0)fail('rvBad '+JSON.stringify(bad));
// A1：縱斷面設計點高程打錯（比地面高 300 m）→ 檢核清單列錯誤、3D 該段護岸與設計後地形略過、改回即恢復
const vip=await pg.evaluate(async()=>{const V=state.profile.vips,k=Math.floor(V.length/2),z0=V[k].z;V[k].z=z0+300;rebuildAlignmentAndSections();await new Promise(r=>setTimeout(r,300));V3D.mesh.oSig='';V3D.mesh.tSig='';v3dRender();
 const o={vb:v3dVipBad().length,chk:chkCollect().filter(x=>x.cat==='縱斷面'&&x.sev==='err').length,bad:V3D.mesh.stat.rvBad.length,txt:document.getElementById('v3dStat').textContent.includes('縱斷面設計點'),
 zmax:(()=>{const S=state.sections.filter(s=>!v3dSecBad(s));return S.length<state.sections.length;})()};
 V[k].z=z0;rebuildAlignmentAndSections();await new Promise(r=>setTimeout(r,300));V3D.mesh.oSig='';V3D.mesh.tSig='';v3dRender();o.after=[v3dVipBad().length,V3D.mesh.stat.rvBad.length];return o;});
console.log('vip',JSON.stringify(vip));if(vip.vb!==1||vip.chk!==1||!(vip.bad>0)||!vip.txt||!vip.zmax||vip.after.join()!=='0,0')fail('vipBad '+JSON.stringify(vip));
// 水面
await pg.evaluate(()=>{state.hy.Q=[{s0:null,s1:null,q25:300,q50:400}];hyRun();requestRedraw();});await pg.waitForTimeout(800);
const wc=await pg.evaluate(()=>V3D.mesh.water.cnt);if(!(wc>0))fail('water '+wc);
// 退回簡易繪圖
await pg.evaluate(()=>{V3D.fail=true;V3D.gl=null;requestRedraw();});await pg.waitForTimeout(800);
if(await pg.evaluate(()=>V3D.mode)!=='canvas')fail('fallback');
await pg.screenshot({path:OUT+'v3d_canvas.png'});
await pg.evaluate(()=>{V3D.fail=false;requestRedraw();});await pg.waitForTimeout(400);
// 回平面：圖層頁卡片恢復、控制列
await pg.evaluate(()=>setViewMode('2D'));await pg.waitForTimeout(500);
const back=await pg.evaluate(()=>[[...document.querySelectorAll('[data-v3dhide]')].map(c=>c.style.display).join(),getComputedStyle(document.getElementById('v3dBar')).display,[...document.querySelectorAll('.panel-tabs .panel-tab')].filter(t=>t.offsetParent).map(t=>t.textContent).includes('顯示')]);
if(back[0].replace(/,/g,'')!==''||back[1]!=='none'||back[2])fail('back2d '+back);
// 梳子壩、固床工＋基樁
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
await pg.evaluate(()=>{stAdd(80,'sill');});await pg.waitForTimeout(1200);
for(const sty of ['comb','gsp']){const q=await pg.evaluate(sty=>{state.structSel=0;sltSetType(sty);setViewMode('3D');v3dRender();return [V3D.mesh.stat.piles,(sltRun(state.structs[0]).P.piles||[]).length,V3D.mesh.obj.st.cnt];},sty);
 console.log(sty,q);if(q[0]!==q[1]||!(q[2]>100))fail(sty+' '+q);}
await pg.evaluate(()=>{const st=state.structs[0];const w=stWorld(st,0,0);state.cam3D.t=[w[0],w[1],stPlace(st).zS];state.cam3D.zoom=3;state.cam3D.yaw=2.4;state.cam3D.pitch=0.35;requestRedraw();});await pg.waitForTimeout(700);
await pg.screenshot({path:OUT+'v3d_gsp.png'});
console.log(errs.join('\n')||'noerr');await b.close();})();
