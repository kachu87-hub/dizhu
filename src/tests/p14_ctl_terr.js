// v8.4：控制點多點最小平方（P1）、地圖點選（P2）、比例固定 1（P3）、警告（P4）；線上 DEM 預設 Terrarium（以本機產生的假圖磚模擬 AWS）
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>{errs.push('dialog '+d.message());d.accept();});
const fail=m=>errs.push('FAIL '+m);const W=t=>pg.waitForTimeout(t);
const gen=await b.newPage();await gen.setContent('<canvas id=c width=256 height=256></canvas>');let hits=0;
// 假 Terrarium：高程＝500＋0.01×全球像素 Y（z13），每列固定
await pg.route('https://s3.amazonaws.com/elevation-tiles-prod/terrarium/**',async r=>{hits++;const m=r.request().url().match(/terrarium\/(\d+)\/(\d+)\/(\d+)\.png/);const [z,x,y]=m.slice(1).map(Number);
  const b64=await gen.evaluate(([z,x,y])=>{const c=document.getElementById('c'),g=c.getContext('2d'),im=g.createImageData(256,256);for(let j=0;j<256;j++){const v=500+0.01*(y*256+j+0.5)+32768,R=Math.floor(v/256),G=Math.floor(v%256),B=Math.round((v-Math.floor(v))*256);for(let i=0;i<256;i++){const k=(j*256+i)*4;im.data[k]=R;im.data[k+1]=G;im.data[k+2]=Math.min(255,B);im.data[k+3]=255;}}g.putImageData(im,0,0);return c.toDataURL('image/png').split(',')[1];},[z,x,y]);
  r.fulfill({status:200,body:Buffer.from(b64,'base64'),headers:{'Access-Control-Allow-Origin':'*','Content-Type':'image/png'}});});
await pg.route('https://wmts.nlsc.gov.tw/**',r=>r.fulfill({status:404,body:'',headers:{'Access-Control-Allow-Origin':'*'}}));
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await W(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await W(6000);
// Terrarium 自動取得
const t1=await pg.evaluate(()=>{const D=state.dzDem;if(!D)return {msg:DNET.msg};const P=dnetLine(),p=P[Math.floor(P.length/2)],E=p[0]+20,N=p[1]+10,z=dzDemZ(E,N);const g=DZ_TM.inv(E,N),r=g.lat*Math.PI/180,Y=(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*256*8192;return {src:D.src,net:D.net,name:D.name,dx:D.dx,z,exp:500+0.01*Y,info:demInfo()};});
if(!t1.src||t1.src!=='terr')fail('Terrarium 未自動取得 '+JSON.stringify(t1));else{if(Math.abs(t1.z-t1.exp)>0.05)fail('Terrarium 高程 '+t1.z+' vs '+t1.exp);if(!/SRTM/.test(t1.info))fail('來源說明 '+t1.info);}
const ui1=await pg.evaluate(()=>{dzMapUI();const b=document.getElementById('demNetBox');return b?b.textContent:'';});if(!/SRTM/.test(ui1)||!/表面高程/.test(ui1))fail('DEM 卡片 '+ui1.slice(0,200));
// 出圖包來源說明為 SRTM
const pk=await pg.evaluate(async()=>{const R=await pkgMake();const fs=R.files.map(f=>f.data).join('\n');return {srtm:/SRTM/.test(fs),moi:/\\U\+5167\\U\+653F\\U\+90E8 /.test(fs)};});if(!pk.srtm)fail('出圖包未標 SRTM '+JSON.stringify(pk));
// 存檔再載入：保留 net/src
const rt0=await pg.evaluate(()=>{const o=collectProject();window.__rtz=!!(o.data.dz.dem&&o.data.dz.dem.z);applyProject(JSON.parse(JSON.stringify(o)),'rt.tcproj');return window.__rtz;});if(rt0)fail('線上 DEM 不應存格網');await W(3500);const rt=await pg.evaluate(()=>state.dzDem&&{net:state.dzDem.net,src:state.dzDem.src});if(!rt||!rt.net||rt.src!=='terr')fail('存檔載入 DEM 來源 '+JSON.stringify(rt));
// P1：三點相似轉換（比例 1.0005、旋轉 1.5°）＋一點錯 30 m
const c1=await pg.evaluate(()=>{const s=1.0005,a=1.5*Math.PI/180,cr=s*Math.cos(a),ci=s*Math.sin(a),T=(x,y)=>({E:250000+cr*(x-243500)-ci*(y-2687000),N:2687100+ci*(x-243500)+cr*(y-2687000)});
  const P=[[243400,2686900],[243900,2687000],[243600,2687400]];state.dzBm.fix1=false;state.dzCtrl=P.map(([x,y])=>{const t=T(x,y);return {px:x,py:y,mode:'tw',E:t.E,N:t.N};});const G=dzGeo();
  const t=G.f(243700,2687100),e=T(243700,2687100);const r0={ok:G.ok,n:G.n,s:G.s,rot:G.rot,rms:G.rms,err:Math.hypot(t.E-e.E,t.N-e.N),warn:G.warn.slice()};
  state.dzCtrl.push({px:243800,py:2686800,mode:'tw',E:T(243800,2686800).E+30,N:T(243800,2686800).N});const G2=dzGeo();const r1={n:G2.n,res3:G2.res[3],warn:G2.warn.slice()};
  state.dzCtrl[3].off=true;const G3=dzGeo();return {r0,r1,r2:{n:G3.n,rms:G3.rms,warn:G3.warn.slice()}};});
if(!c1.r0.ok||c1.r0.err>1e-6||Math.abs(c1.r0.s-1.0005)>1e-9||Math.abs(c1.r0.rot-1.5)>1e-9)fail('三點套合 '+JSON.stringify(c1.r0));
if(!(c1.r1.res3>15)||!c1.r1.warn.some(w=>/點4/.test(w)))fail('錯點未警告 '+JSON.stringify(c1.r1));if(c1.r2.n!==3||c1.r2.rms>1e-6||c1.r2.warn.length)fail('停用錯點 '+JSON.stringify(c1.r2));
// P1 UI：表格列數、新增、刪除
const u1=await pg.evaluate(()=>{dzMapUI();const n0=document.querySelectorAll('#dzMapBox table.pt-table tbody tr').length;ctlAdd();const n1=document.querySelectorAll('#dzMapBox table.pt-table tbody tr').length;ctlDel(4);const n2=document.querySelectorAll('#dzMapBox table.pt-table tbody tr').length;return {n0,n1,n2,sum:document.getElementById('ctlSum').textContent};});
if(u1.n0!==4||u1.n1!==5||u1.n2!==4||!/最小平方|已定位/.test(u1.sum))fail('控制點表格 '+JSON.stringify(u1));
// P3＋P4：使用者回報的兩點（點2 填錯）
const c2=await pg.evaluate(()=>{state.dzCtrl=[{px:243964.081,py:2687373.27,mode:'tw',E:243968,N:2687381},{px:243614.533,py:2687346.18,mode:'tw',E:243462,N:2687362}];delete state.dzBm.fix1;const G=dzGeo();const a={fix:G.fix,s:G.s,warn:G.warn.slice()};state.dzBm.fix1=false;const G2=dzGeo();const r={a,b:{s:G2.s,warn:G2.warn.slice()}};delete state.dzBm.fix1;return r;});
if(!c2.a.fix||Math.abs(c2.a.s-1)>1e-9)fail('比例固定 1 預設 '+JSON.stringify(c2.a));if(!c2.b.warn.some(w=>/比例/.test(w)))fail('比例異常未警告 '+JSON.stringify(c2.b));
// P3：比例固定 1、只有 1 點＝平移
const c3=await pg.evaluate(()=>{state.dzCtrl=[{px:243000,py:2687000,mode:'tw',E:243003,N:2686996},{}];state.dzBm.fix1=true;const G=dzGeo(),t=G.f(243100,2687100);return {ok:G.ok,E:t.E,N:t.N};});
if(!c3.ok||Math.abs(c3.E-243103)>1e-6||Math.abs(c3.N-2687096)>1e-6)fail('單點平移 '+JSON.stringify(c3));
// P2：地圖小視窗點選
await pg.evaluate(()=>{state.dzCtrl=[{px:243700,py:2687300},{}];delete state.dzBm.fix1;setViewMode('2D');ctlMapPick(0);});await W(500);
const box=await pg.evaluate(()=>{const r=document.getElementById('ctlMapCv').getBoundingClientRect();return {x:r.left+r.width/2+40,y:r.top+r.height/2-30};});
await pg.mouse.move(box.x,box.y);await pg.mouse.down();await pg.mouse.up();await W(200);
const exp=await pg.evaluate(([x,y])=>{const r=document.getElementById('ctlMapCv').getBoundingClientRect(),ll=CTL.map.toLL(x-r.left,y-r.top);return DZ_TM.fwd(ll.lat,ll.lon);},[box.x,box.y]);
await pg.screenshot({path:(process.env.OUT||'/tmp')+'/ctl_map.png'});
await pg.click('#ctlOk');await W(300);
const p2=await pg.evaluate(()=>({c:state.dzCtrl[0],open:!!document.getElementById('ctlMapOv')}));if(p2.open||Math.abs(p2.c.E-exp.E)>0.02||Math.abs(p2.c.N-exp.N)>0.02||p2.c.mode!=='tw')fail('地圖點選 '+JSON.stringify(p2)+' '+JSON.stringify(exp));
// 存檔再載入：3 點以上
const rt2=await pg.evaluate(()=>{state.dzCtrl=[{px:1,py:2,E:3,N:4,mode:'tw'},{px:5,py:6,E:7,N:8,mode:'tw'},{px:9,py:10,E:11,N:12,mode:'tw',off:true}];state.dzBm.fix1=false;const o=collectProject();applyProject(JSON.parse(JSON.stringify(o)),'rt2.tcproj');return {n:state.dzCtrl.length,off:state.dzCtrl[2].off,fix:state.dzBm.fix1};});
if(rt2.n!==3||!rt2.off||rt2.fix!==false)fail('控制點存檔 '+JSON.stringify(rt2));
console.log(JSON.stringify({hits,t1,c1,c2,c3,p2:{E:p2.c.E,N:p2.c.N},rt2}));
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
