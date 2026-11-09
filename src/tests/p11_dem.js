// v7.3：內政部 DEM（A 大檔串流＋記住檔案自動擷取、C 地面線分實測／DEM、G 卡片收合、H 地形線透明度移入底圖卡片）
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>{errs.push('dialog '+d.message());d.accept();});
const fail=m=>errs.push('FAIL '+m);const W=t=>pg.waitForTimeout(t);const OUT=process.env.OUT||'/tmp';
await pg.addInitScript(()=>{try{localStorage.setItem('dizhu.demNet',JSON.stringify({on:false}));}catch(e){}});
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await W(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await W(3000);
const dxf0=await pg.evaluate(()=>buildFullDXF().length);if(dxf0!==9556658)fail('DXF 長度（無 DEM）'+dxf0);
// G＋H
const g=await pg.evaluate(()=>{setViewMode('2D');const tb=document.getElementById('dzMapBox').closest('.tab-content, [id^=tab-]');switchSideTab(tb.id,document.querySelector(`.panel-tab[data-tab="${tb.id}"]`));dzMapUI();const c=[...document.querySelectorAll('#dzMapBox > .sec-card.demfold')];return {n:c.length,fold:c.map(x=>x.classList.contains('folded')),terrIn:!!(c[0]&&c[0].contains(document.getElementById('terrOp'))),fade:!!(c[0]&&c[0].contains(document.getElementById('terrFade')))};});
if(g.n!==2||g.fold.some(f=>!f))fail('卡片收合 '+JSON.stringify(g));if(!g.terrIn||!g.fade)fail('地形線透明度未移入底圖卡片');
await pg.evaluate(()=>document.querySelectorAll('#dzMapBox > .sec-card.demfold > .sec-title')[0].click());
const g2=await pg.evaluate(()=>{const c=document.querySelectorAll('#dzMapBox > .sec-card.demfold')[0];const op=document.getElementById('terrOp');return {open:!c.classList.contains('folded'),vis:op.offsetParent!==null};});
if(!g2.open||!g2.vis)fail('展開底圖卡片 '+JSON.stringify(g2));
await pg.evaluate(()=>{dzMapUI();dzMapUI();});const g3=await pg.evaluate(()=>({n:document.querySelectorAll('#terrOp').length,in:document.querySelectorAll('#dzMapBox > .sec-card.demfold')[0].contains(document.getElementById('terrOp')),open:!document.querySelectorAll('#dzMapBox > .sec-card.demfold')[0].classList.contains('folded')}));
if(g3.n!==1||!g3.in||!g3.open)fail('重畫後透明度 '+JSON.stringify(g3));
await pg.evaluate(()=>{const o=document.getElementById('terrOp');o.value=0.4;o.dispatchEvent(new Event('input'));});if(await pg.evaluate(()=>state.dzBm.tOp)!==0.4)fail('透明度滑桿無作用');
await pg.screenshot({path:OUT+'/dem_card.png',clip:{x:0,y:0,width:520,height:1100}});
// A：ASC 串流（範圍大於專案；z＝TIN 外延趨勢）
const asc=await pg.evaluate(()=>{const B=dzDemBBox();const cs=20,x0=Math.floor((B.x0-3000)/cs)*cs,y0=Math.floor((B.y0-3000)/cs)*cs,nc=Math.ceil((B.x1-B.x0+6000)/cs),nr=Math.ceil((B.y1-B.y0+6000)/cs);
  const L=[`ncols ${nc}`,`nrows ${nr}`,`xllcorner ${x0}`,`yllcorner ${y0}`,`cellsize ${cs}`,'NODATA_value -9999'];const P=state.points,zc=P.reduce((a,p)=>a+p.z,0)/P.length;
  for(let r=0;r<nr;r++){const y=y0+(nr-1-r+0.5)*cs,a=[];for(let c=0;c<nc;c++){const x=x0+(c+0.5)*cs;a.push((zc+0.01*(x-B.x0)+0.02*(y-B.y0)).toFixed(2));}L.push(a.join(' '));}
  window.__asc=L.join('\n');return {nc,nr,len:window.__asc.length};});
await pg.evaluate(async()=>{await dzDemLoad(new File([window.__asc],'dem_test.asc'));});await W(1500);
const a1=await pg.evaluate(()=>{const D=state.dzDem;const B=demNeedBox();return D&&{nx:D.nx,ny:D.ny,dx:D.dx,cov:demCovers(D,B),demSecs:state.sections.filter(s=>s.demN>0).length,secs:state.sections.length,tinOnly:state.sections.filter(s=>s.demN===0).length};});
if(!a1||a1.dx!==20||!a1.cov)fail('ASC 匯入 '+JSON.stringify(a1));
// 需要較寬的斷面才會跑出 TIN：加寬顯示範圍
const sk=await pg.evaluate(()=>{let k=state.sections.findIndex(s=>s.demN>0);return k;});
// XYZ／CSV 串流（含標頭行、N/E 互換）
await pg.evaluate(async()=>{const B=dzDemBBox(),L=['N,E,Z'];for(let y=Math.floor(B.y0/20)*20;y<=B.y1;y+=20)for(let x=Math.floor(B.x0/20)*20;x<=B.x1;x+=20)L.push(`${y},${x},${(100+0.01*x/100).toFixed(2)}`);await dzDemLoad(new File([L.join('\n')],'dem_test.csv'));});await W(800);
const a2=await pg.evaluate(()=>state.dzDem&&{nx:state.dzDem.nx,dx:state.dzDem.dx,name:state.dzDem.name});if(!a2||a2.name!=='dem_test.csv'||a2.dx!==20)fail('CSV 匯入 '+JSON.stringify(a2));
// 記住檔案：模擬 FileSystemFileHandle，清除 DEM 後專案範圍變動時自動擷取
await pg.evaluate(()=>{const f=new File([window.__asc],'dem_test.asc');DEM.handle={name:'dem_test.asc',kind:'file',queryPermission:async()=>'granted',requestPermission:async()=>'granted',getFile:async()=>f};DEM.hname='dem_test.asc';DEM.perm='granted';state.dzDem=null;DEM.skip=false;DEM.failKey='';rebuildAlignmentAndSections();});
await W(3500);
const a3=await pg.evaluate(()=>state.dzDem&&{name:state.dzDem.name,demSecs:state.sections.filter(s=>s.demN>0).length});if(!a3||a3.name!=='dem_test.asc')fail('記住檔案自動擷取 '+JSON.stringify(a3));
// 使用者移除 DEM 後不再自動載入
await pg.evaluate(()=>{dzDemClear();rebuildAlignmentAndSections();});await W(2500);if(await pg.evaluate(()=>!!state.dzDem))fail('移除後又自動載入');
await pg.evaluate(()=>demUseRemembered(true));await W(1500);if(!(await pg.evaluate(()=>!!state.dzDem)))fail('按讀取記住的檔失敗');
const ui=await pg.evaluate(()=>{dzMapUI();const b=document.getElementById('demRemBox');return b?b.textContent:'';});if(!/dem_test\.asc/.test(ui)&&!/Chrome/.test(ui))fail('記住檔案 UI '+ui);
// C：加寬斷面讓斷面兩端超出 TIN，比對 gsrc
const c1=await pg.evaluate(()=>{const S=state.sections;const k=S.findIndex(s=>s.demN>0);if(k<0)return {k};const s=S[k];return {k,n:s.samples.length,dem:s.demN,first:s.samples[0].gsrc,mid:s.samples[Math.floor(s.samples.length/2)].gsrc};});
if(c1.k<0)fail('沒有斷面用到 DEM（可能 TIN 已覆蓋全部斷面）');
// 畫面：橫斷面大圖
if(c1.k>=0){await pg.evaluate(k=>{setViewMode('CROSS');state.selectedStaIdx=k;requestRedraw();},c1.k);await W(800);await pg.screenshot({path:OUT+'/dem_cross.png'});}
// DXF：出圖包橫斷面有 SEC_GROUND_DEM 與說明
const p=await pg.evaluate(async()=>{const R=await pkgMake();const sec=R.sheets.filter(s=>s.kind==='sec'),fs=R.files.map(f=>f.data).join('\n');return {sec:sec.length,demLy:(fs.match(/SEC_GROUND_DEM/g)||[]).length,note:/\\U\+5167\\U\+653F\\U\+90E8/.test(fs)};});
if(!p.demLy||!p.note)fail('出圖包 DEM 標示 '+JSON.stringify(p));
const fd=await pg.evaluate(()=>{const s=buildFullDXF();return {len:s.length,dem:(s.match(/SEC_GROUND_DEM/g)||[]).length};});if(!fd.dem)fail('全圖 DXF 無 SEC_GROUND_DEM');
// 關掉 DEM 補注 → 回到無 DEM 長度
await pg.evaluate(()=>{dzDemToggle(false);});await W(800);const dxf1=await pg.evaluate(()=>buildFullDXF().length);if(dxf1!==9556658)fail('關閉 DEM 後 DXF 長度 '+dxf1);
console.log(JSON.stringify({g,g2,asc,a1,a2,a3,c1,p,fd}));
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
