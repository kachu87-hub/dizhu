const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
await pg.evaluate(()=>{selectStationIndex(0);grdAdd('cl');switchSideTab('tab-earth',document.querySelector('[data-tab="tab-earth"]'));const sub=[...document.querySelectorAll('button,div')].find(e=>e.textContent.trim()==='整地'&&e.offsetParent);if(sub)sub.click();grdUI();setViewMode('2D');const q=getPointAndNormalAtStation(60);state.cam2D.cx=q.x;state.cam2D.cy=q.y;state.cam2D.scale=6;requestRedraw();});await pg.waitForTimeout(600);
const scr=async s=>pg.evaluate(s=>{const g=getPointAndNormalAtStation(s),p=worldToScreen2D(g.x,g.y),rc=cadCanvas.getBoundingClientRect();return {x:rc.left+p.x,y:rc.top+p.y}},s);
await pg.evaluate(()=>grdPick());let p=await scr(20);await pg.mouse.click(p.x,p.y);p=await scr(85);await pg.mouse.click(p.x,p.y);await pg.waitForTimeout(500);
let r=await pg.evaluate(()=>{const G=grdSel();return [G.s0,G.s1,state.activeTool,GRD_SHOWH(),document.getElementById('grdCard').className]});console.log('pick',JSON.stringify(r));
// drag end handle to 100
p=await scr(r[1]);const p2=await scr(100);await pg.mouse.move(p.x,p.y);await pg.mouse.down();await pg.mouse.move(p2.x,p2.y,{steps:6});await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/grd10_drag.png',clip:{x:480,y:110,width:1220,height:830}});await pg.mouse.up();await pg.waitForTimeout(500);
r=await pg.evaluate(()=>{const G=grdSel();return [G.s0,G.s1]});console.log('dragEnd',JSON.stringify(r));
// mid translate +10
const m=await scr((r[0]+r[1])/2),m2=await scr((r[0]+r[1])/2+10);await pg.mouse.move(m.x,m.y);await pg.mouse.down();await pg.mouse.move(m2.x,m2.y,{steps:6});await pg.mouse.up();await pg.waitForTimeout(500);
r=await pg.evaluate(()=>{const G=grdSel();return [G.s0,G.s1,state.undoStack.length]});console.log('mid',JSON.stringify(r));
await pg.keyboard.press('Control+z');await pg.waitForTimeout(400);
r=await pg.evaluate(()=>{const G=grdSel();return [G.s0,G.s1]});console.log('undo',JSON.stringify(r));
await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/grd10.png',clip:{x:480,y:110,width:1220,height:830}});
console.log(errs.join('\n')||'noerr');await b.close();})();
