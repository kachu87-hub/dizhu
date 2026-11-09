// v6.6 數量來源欄：工程總表（畫面、Excel）與數量明細標示 幾何計算／kg/m³ 估算／計數／地形
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1600,height:1000}});pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());const fail=m=>errs.push('FAIL '+m);
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
await pg.evaluate(()=>{rvAdd('L',0,167,'grav');stAdd(30,'sill');stAdd(90,'dam');});await pg.waitForTimeout(2500);
const r=await pg.evaluate(()=>{state.structSel=0;sltSetType('f0605');stRecalc&&stRecalc();rvRecalc();
 const B=ttBuild();const reb=B.M.find(m=>m.k===undefined&&/鋼筋/.test(m.it));const conc=B.M.find(m=>/混凝土/.test(m.it));
 const sh=ttSheet();const hdr=sh.rows.filter(r=>Array.isArray(r)&&r.some(c=>c&&c.v==='數量來源')).length;
 const book=stQtyBook();const M=book.sheets.find(s=>s.name==='數量明細');const mh=M.rows[3].map(c=>c&&c.v);const mk=[...new Set(M.rows.slice(4).map(r=>r[6]&&r[6].v).filter(Boolean))];
 ttOpen();TT_TAB=1;ttRender();const ui=document.getElementById('ttDlg').innerText;ttClose();
 return {reb:reb&&ttKindsEst(reb),conc:conc&&ttKindsEst(conc),earth:B.E.map(e=>e.it+':'+ttKinds(e)),hdr,mh,mk,ui:/數量來源/.test(ui)&&/kg\/m³ 估算/.test(ui)}});
if(!r.reb||!/kg\/m³ 估算/.test(r.reb))fail('鋼筋應標 kg/m³ 估算 '+r.reb);
if(!r.conc||!/幾何計算/.test(r.conc))fail('混凝土應標幾何計算 '+r.conc);
if(!r.earth.length||r.earth.some(x=>!/地形/.test(x)))fail('土方應標地形 '+r.earth);
if(r.hdr!==3)fail('Excel 三個表頭應有數量來源 '+r.hdr);
if(r.mh[6]!=='數量來源')fail('數量明細表頭 '+r.mh);
if(!r.ui)fail('畫面總表無數量來源');
console.log(JSON.stringify(r));console.log(errs.join('\n')||'noerr');await b.close();})();
