const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
// no revetment: pick
const r0=await pg.evaluate(()=>{catOpen('add');CAT.q='動物通道';catRender();const h=document.getElementById('catDlg').innerText;const o=[h.includes('生物通道（動物通道'),h.includes('尚未建置')];catPick('bio:1');o.push(bioAll().length,document.getElementById('statusBar')?.innerText||'');return o});
console.log('noRV',JSON.stringify(r0));
await pg.evaluate(()=>{rvAdd('L',0,167,'grav');});await pg.waitForTimeout(2000);
const r1=await pg.evaluate(()=>{catOpen('add');catPick('bio:1');return [bioAll().length,!!document.getElementById('bioBox'),document.querySelector('.panel-tab.active')?.dataset.tab]});
console.log('withRV',JSON.stringify(r1));
// pending list no longer shows 動物通道 in unfiltered
const r2=await pg.evaluate(()=>{catOpen('add');CAT.q='';catRender();const h=document.getElementById('catDlg').innerText;catClose();return [h.includes('動物通道'),(h.match(/動物通道/g)||[]).length]});
console.log('pend',JSON.stringify(r2));
await pg.waitForTimeout(500);await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/cat_bio.png'});
console.log(errs.join('\n')||'noerr');await b.close();})();
