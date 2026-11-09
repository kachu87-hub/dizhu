const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
await pg.evaluate(()=>{rvAdd('L',0,167,'grav');rvAdd('R',0,167,'grav');});await pg.waitForTimeout(2500);
await pg.evaluate(()=>{switchSideTab('tab-earth',document.querySelector('[data-tab="tab-earth"]'));const sub=[...document.querySelectorAll('button,div')].find(e=>e.textContent.trim()==='護岸'&&e.offsetParent);if(sub)sub.click();rvRenderUI();const c=document.getElementById('rvCard');if(c&&c.classList.contains('folded')&&typeof earthShowCard==='function')earthShowCard(c);
 setViewMode('2D');const q=getPointAndNormalAtStation(60);state.cam2D.cx=q.x;state.cam2D.cy=q.y;state.cam2D.scale=9;requestRedraw();bioPick('new');});await pg.waitForTimeout(500);
// click near right bank top at sta 60
const pt=await pg.evaluate(()=>{const rv=state.revs.find(r=>r.side==='R');const p=bioRvTop(rv,60);const s=worldToScreen2D(p[0]+0.3,p[1]+0.3),rc=cadCanvas.getBoundingClientRect();return {x:rc.left+s.x,y:rc.top+s.y}});
await pg.mouse.click(pt.x,pt.y);await pg.waitForTimeout(1500);
let r=await pg.evaluate(()=>bioAll().map(x=>[x.rv.side,x.b.sta,x.b.name,bioGeo(x.rv,x.b).tw,bioGeo(x.rv,x.b).twAuto]));console.log('new',JSON.stringify(r),await pg.evaluate(()=>!!(document.getElementById('bioBox')||{}).offsetParent));
// drag box +10 m
const dd=await pg.evaluate(()=>{const f=bioAll()[0];const Q=bioPlanPolys(f.rv,f.b);const c=Q.box.reduce((a,p)=>[a[0]+p[0]/4,a[1]+p[1]/4],[0,0]);const g=getPointAndNormalAtStation(f.b.sta+12),off=[c[0]-getPointAndNormalAtStation(f.b.sta+2).x,c[1]-getPointAndNormalAtStation(f.b.sta+2).y];const s=worldToScreen2D(c[0],c[1]),s2=worldToScreen2D(g.x+off[0],g.y+off[1]),rc=cadCanvas.getBoundingClientRect();return {a:{x:rc.left+s.x,y:rc.top+s.y},b:{x:rc.left+s2.x,y:rc.top+s2.y}}});
await pg.mouse.move(dd.a.x,dd.a.y);await pg.mouse.down();await pg.mouse.move(dd.b.x,dd.b.y,{steps:8});await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/bio3_drag.png',clip:{x:480,y:110,width:1220,height:830}});await pg.mouse.up();await pg.waitForTimeout(1500);
r=await pg.evaluate(()=>bioAll().map(x=>[x.rv.side,x.b.sta]));console.log('drag',JSON.stringify(r));
// cross pick: move to left bank at sta 100
await pg.evaluate(()=>{const k=state.sections.findIndex(s=>s.sta>=100);selectStationIndex(k);setViewMode('CROSS');setCrossDisplayMode('SINGLE');bioPick('move');});await pg.waitForTimeout(1200);
await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/bio3_cross.png',clip:{x:480,y:110,width:1220,height:830}});
const cp=await pg.evaluate(()=>{const a=camInv(0,0),bx=camInv(1,0),rc=cadCanvas.getBoundingClientRect();const x=(BIO_XC.k0-60-a.x)/(bx.x-a.x);return {x:rc.left+x,y:rc.top+400}});
await pg.mouse.click(cp.x,cp.y);await pg.waitForTimeout(1500);
r=await pg.evaluate(()=>bioAll().map(x=>[x.rv.side,x.b.sta]));console.log('cross',JSON.stringify(r));
// set tAuto false
r=await pg.evaluate(()=>{bioSet('tAuto',false);const f=bioAll()[0];const g=bioGeo(f.rv,f.b);const o=[g.tw,g.twAuto];bioSet('tAuto',true);return o.concat([bioGeo(f.rv,f.b).tw, buildFullDXF().length>0])});console.log('tw',JSON.stringify(r));
console.log(errs.join('\n')||'noerr');await b.close();})();
