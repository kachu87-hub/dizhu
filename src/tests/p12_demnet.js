// v7.x：線上內政部 20 m DTM 圖磚（免選檔、中心線兩側 R m）；以 tests/demtiles_syn 模擬 GitHub Pages
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>{errs.push('dialog '+d.message());d.accept();});
const fail=m=>errs.push('FAIL '+m);const W=t=>pg.waitForTimeout(t);const DIR=path.join(__dirname,'demtiles_syn');let hits=0;
await pg.route('https://dem.test/**',r=>{const u=new URL(r.request().url()),f=path.join(DIR,u.pathname.replace(/^\/+/,''));hits++;if(fs.existsSync(f))r.fulfill({status:200,body:fs.readFileSync(f),headers:{'Access-Control-Allow-Origin':'*','Content-Type':f.endsWith('.json')?'application/json':'application/octet-stream'}});else r.fulfill({status:404,body:'nf',headers:{'Access-Control-Allow-Origin':'*'}});});
await pg.addInitScript(()=>{try{localStorage.setItem('dizhu.demNet',JSON.stringify({base:'https://dem.test/',src:'moi',on:true,R:50}));}catch(e){}});
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await W(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await W(5000);
const a=await pg.evaluate(()=>{const D=state.dzDem;if(!D)return null;const P=dnetLine();let far=0,near=0;for(let j=0;j<D.ny;j++)for(let i=0;i<D.nx;i++){const v=D.z[j*D.nx+i];if(!Number.isFinite(v))continue;const d=dnetDist(P,D.x0+i*D.dx,D.y0+j*D.dy);if(d>50+29)far++;else near++;}
  const s=state.sections.find(s=>s.demN>0);const k=s?s.samples.findIndex(q=>q.gsrc==='dem'):-1;let ok=null;if(k>=0){const q=s.samples[k],W=Math.hypot(s.rx-s.lx,s.ry-s.ly),x=s.cx+(s.rx-s.lx)/W*q.offset,y=s.cy+(s.ry-s.ly)/W*q.offset;ok=Math.abs(dzDemZ(x,y)-(600+0.01*(x-242570)+0.02*(y-2686270)));}
  return {net:D.net,name:D.name,dx:D.dx,nx:D.nx,ny:D.ny,near,far,demSecs:state.sections.filter(s=>s.demN>0).length,err:ok};});
if(!a||!a.net)fail('沒有自動取得線上 DEM '+JSON.stringify(a));else{if(a.far)fail('超出中心線兩側範圍的格數 '+a.far);if(!(a.err<0.06))fail('DEM 高程不符 '+a.err);}
// UI
const ui=await pg.evaluate(()=>{dzMapUI();const b=document.getElementById('demNetBox');return b?b.textContent:'';});if(!/中心線兩側/.test(ui))fail('UI '+ui);
// 改範圍 R=20 → 重取，格數變少
await pg.evaluate(()=>dnetSet('R',20));await W(2500);const a2=await pg.evaluate(()=>state.dzDem&&{R:state.dzDem.R,name:state.dzDem.name});if(!a2||a2.R!==20)fail('改範圍 '+JSON.stringify(a2));
// 使用者自己匯入的 DEM 優先：載入 ASC 後，中心線變動也不被覆蓋
await pg.evaluate(async()=>{const D0=state.dzDem;const L=[`ncols 3`,`nrows 3`,`xllcorner ${D0.x0}`,`yllcorner ${D0.y0}`,'cellsize 20','1 2 3','4 5 6','7 8 9'];await dzDemLoad(new File([L.join('\n')],'mine.asc'));});await W(500);
await pg.evaluate(()=>{rebuildAlignmentAndSections();});await W(2500);if(await pg.evaluate(()=>state.dzDem&&state.dzDem.name)!=='mine.asc')fail('自己匯入的 DEM 被覆蓋');
// 移除 DEM → 關閉線上自動
await pg.evaluate(()=>{dzDemClear();dnetSet('on',true);});await W(2500);if(!(await pg.evaluate(()=>state.dzDem&&state.dzDem.net)))fail('重新開啟線上 DEM 失敗');
await pg.evaluate(()=>{dzDemClear();rebuildAlignmentAndSections();});await W(2500);const off=await pg.evaluate(()=>({on:DNET.on,d:!!state.dzDem}));if(off.on||off.d)fail('移除線上 DEM 後又自動取得 '+JSON.stringify(off));
// 連不到伺服器：不出錯、不跳警告
await pg.evaluate(()=>{dnetSet('src','moi');dnetSet('base','https://nowhere.invalid/');dnetSet('on',true);});await W(3000);const m=await pg.evaluate(()=>DNET.msg);if(!/⚠/.test(m))fail('連線失敗訊息 '+m);
console.log(JSON.stringify({hits,a,a2,off,m}));
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
