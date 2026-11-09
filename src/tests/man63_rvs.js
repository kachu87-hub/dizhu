const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:1000}});pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1200);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
await pg.evaluate(()=>{rvAdd('L',0,167,'bty');rvAdd('R',0,167,'rcb');});await pg.waitForTimeout(3000);
for(const i of [0,1]){await pg.evaluate(i=>rvStdOpen(i),i);await pg.waitForTimeout(1000);await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/man63'+'/09s_'+i+'.png'});await pg.evaluate(()=>stStdClose());}
await pg.evaluate(()=>{selectStationIndex(8);setViewMode('CROSS');setCrossDisplayMode('SINGLE')});await pg.waitForTimeout(1000);
await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/man63'+'/09x_cross.png',clip:{x:480,y:110,width:1120,height:740}});
await b.close()})();
