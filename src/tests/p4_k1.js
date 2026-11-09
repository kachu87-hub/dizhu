const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1600,height:1000}});pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
console.log(await pg.evaluate(()=>{const bs=[...document.querySelectorAll('button')].filter(b=>/staPickAdd/.test(b.getAttribute('onclick')||''));const o={btn:bs.length};bs[0].click();o.tool=state.activeTool;
 state.grades=[];grdAdd('cl');o.rv=state.grades[0].rv;const P=collectProject();o.g=P.data.grades?P.data.grades[0].rv:JSON.stringify(Object.keys(P.data)).slice(0,300);o.cld=JSON.stringify(P.data.clDraw);
 state.dzBm.layer2='LUIMAP';const P2=collectProject();o.bm=JSON.stringify(P2.data.dz.bm);return JSON.stringify(o)}));
console.log(errs.join('\n')||'noerr');await b.close()})();
