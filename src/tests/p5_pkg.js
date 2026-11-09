// v7.0：圖號 n/N、配置名稱＝前綴＋序號、依案例排序 index→loc→plan→detail→prof→sec→std→qty；全圖 DXF 因 chineset.shx 字型 9556658
// v6.6：R2000＋A3 配置（每檔一個配置、合併檔每張一個配置、視埠）、R12 舊格式、標準圖 cm
// v6.5 A1 一鍵出圖包：u.tcproj 產生各張 DXF（圖框＋標題欄）、圖目錄、合併檔、xlsx；全圖 DXF 不變；設定存入專案
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100},acceptDownloads:true});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>{errs.push('dialog '+d.message());d.accept()});
const fail=m=>errs.push('FAIL '+m);
await pg.addInitScript(()=>{try{localStorage.setItem('dizhu.demNet',JSON.stringify({on:false}));}catch(e){}});await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(3000);
const full0=await pg.evaluate(()=>buildFullDXF().length);
const r=await pg.evaluate(()=>{const R=pkgMake({proj:'測試計畫',org:'測試單位',pre:'T-',start:1,date:'115.11.04'});
  const bad=[];R.files.filter(f=>/\.dxf$/.test(f.name)&&!/全圖/.test(f.name)).forEach(f=>{const s=f.data;const ns=(s.match(/\n0\nSECTION\n/g)||[]).length+(s.startsWith('0\nSECTION')?1:0),ne=(s.match(/\n0\nENDSEC/g)||[]).length;
    if(ns!==5||ne!==5||!/\n0\nEOF\n$/.test(s)||!/\$ACADVER\n1\nAC1015/.test(s))bad.push(f.name+' sec '+ns+'/'+ne);
    const nl=(s.match(/\n0\nLAYOUT\n/g)||[]).length-1;if(/全部圖紙/.test(f.name)?nl!==R.sheets.length:nl!==1)bad.push(f.name+' 配置數 '+nl);
    if(!/全部圖紙/.test(f.name)&&!/\n0\nVIEWPORT\n[\s\S]*\n69\n2\n/.test(s))bad.push(f.name+' 無視埠');
    if(!/圖目錄|全部圖紙/.test(f.name)&&!/\nPKG_TB\n/.test(s))bad.push(f.name+' 無標題欄');
    const ins=[...s.matchAll(/\nAcDbBlockReference\n2\n([^\n]+)/g)].map(m=>m[1]);ins.forEach(n=>{if(!s.includes('\nAcDbBlockBegin\n2\n'+n+'\n'))bad.push(f.name+' 缺圖塊 '+n)});});
  const R12=pkgMake({proj:'測試計畫',pre:'T-',fmt:'r12'});R12.files.filter(f=>/\.dxf$/.test(f.name)).forEach(f=>{const s=f.data;const ns=(s.match(/\n0\nSECTION\n/g)||[]).length+(s.startsWith('0\nSECTION')?1:0);if(ns!==4||!/AC1009/.test(s))bad.push('R12 '+f.name);
    const ins=[...s.matchAll(/\n0\nINSERT\n8\n[^\n]*\n2\n([^\n]+)/g)].map(m=>m[1]);ins.forEach(n=>{if(!s.includes('\n0\nBLOCK\n8\n0\n2\n'+n+'\n'))bad.push('R12 '+f.name+' 缺圖塊 '+n)});});
  const sd=R.files.find(f=>/^T-\d+_.*曲型副壩/.test(f.name));if(!sd||!/\$INSUNITS\n70\n5\n/.test(sd.data))bad.push('標準圖單位應為 cm');
  return {n:R.sheets.length,kinds:[...new Set(R.sheets.map(s=>s.kind))],first:R.sheets[0],plan:R.sheets.find(s=>s.kind==='plan'),files:R.files.map(f=>f.name),bad,
    nos:R.sheets.map(s=>s.no),lays:R.sheets.map(s=>s.lay),order:R.sheets.map(s=>s.kind).filter((k,i,a)=>k!==a[i-1]),pages:R.sheets.map(s=>s.page),std:R.sheets.filter(s=>s.kind==='std').map(s=>[s.title,s.scale])}});
if(r.n<40)fail('張數 '+r.n);['index','plan','prof','sec','qty','std'].forEach(k=>{if(!r.kinds.includes(k))fail('缺 '+k)});
if(r.bad.length)fail(r.bad.slice(0,5).join(';'));
const dam=r.std.filter(x=>/曲型副壩/.test(x[0]));if(dam.length<2||dam.some(x=>+x[1].split(':')[1]>250))fail('曲型副壩標準圖應拆張且比例不小於 1:250 '+JSON.stringify(dam));
if(r.std.some(x=>+x[1].split(':')[1]>250))fail('標準圖比例過小 '+JSON.stringify(r.std));
if(r.lays[0]!=='T-01'||r.lays[r.n-1]!==`T-${String(r.n).padStart(2,'0')}`)fail('配置名稱 '+r.lays[0]+' '+r.lays[r.n-1]);
if(r.nos[0]!==`1/${r.n}`||r.nos[r.n-1]!==`${r.n}/${r.n}`)fail('圖號 '+r.nos[0]+' '+r.nos[r.n-1]);
if(r.order.join()!=='index,loc,plan,detail,prof,sec,std,qty')fail('排序 '+r.order);
if(r.pages[r.n-1]!==`${r.n}/${r.n}`)fail('張次');
['圖目錄.csv','出圖說明.txt','u_數量表.xlsx','T-全部圖紙（合併）.dxf'].forEach(f=>{if(!r.files.includes(f))fail('缺檔 '+f)});
const full1=await pg.evaluate(()=>buildFullDXF().length);if(full0!==full1||full1!==9556658)fail('全圖 DXF 長度變了 '+full0+' '+full1);
// 對話框 → 下載
if(await pg.$('#uimExportBtn'))await pg.click('#uimExportBtn');await pg.click('#btnPkg');await pg.waitForTimeout(300);await pg.fill('#pkgProj','測試計畫');await pg.screenshot({path:'/tmp/p5_pkg_dlg.png'});
const [dl]=await Promise.all([pg.waitForEvent('download'),pg.click('#pkgGo')]);const zp='/tmp/p5_pkg.zip';await dl.saveAs(zp);const z=fs.readFileSync(zp);
if(z.readUInt32LE(0)!==0x04034b50||z.length<200000)fail('zip '+z.length);
// 設定存入專案
const sv=await pg.evaluate(()=>{const o=collectProject();state.pkg.proj='x';applyProject(o,'re.tcproj');return [o.data.pkg&&o.data.pkg.proj,state.pkg.proj]});
if(sv[0]!=='測試計畫'||sv[1]!=='測試計畫')fail('pkg 設定未存入專案 '+sv);
// 空白頁不報錯
const e=await pg.evaluate(()=>{state.alignment.segments=[];return pkgMake().files.length});
console.log(JSON.stringify({n:r.n,kinds:r.kinds,plan:r.plan&&[r.plan.no,r.plan.scale],zip:z.length,files:r.files.length,empty:e}));
console.log(errs.join('\n')||'noerr');await b.close();})();
