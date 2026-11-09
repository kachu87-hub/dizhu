const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage();pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1200);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
const r=await pg.evaluate(()=>{rvAdd('L',0,80,'grav');stAdd(100,'dam');grdAdd('cl');rebuildAlignmentAndSections();rvRecalc();const B=stQtyBook();const by=xlBook(B.sheets);return [B.sheets.map(s=>s.name).join(','),by.length,Array.from(by.slice(0,4))]});
console.log(JSON.stringify(r));console.log(errs.join('\n')||'noerr');await b.close();})();
