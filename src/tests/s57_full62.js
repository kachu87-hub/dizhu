const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];
const pg=await b.newPage({viewport:{width:1600,height:1000}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
await pg.evaluate(()=>{rvAdd('L',0,167,'p405');rvAdd('R',0,167,'grav');stAdd(30,'sill');stAdd(70,'sill');stAdd(100,'dam');stAdd(130,'sill');stAdd(150,'sill');});await pg.waitForTimeout(3000);
await pg.evaluate(()=>{const ty={30:'r0607',70:'e606',130:'a0608',150:'g604'};state.structs.forEach((s,i)=>{if(ty[Math.round(s.sta)]){state.structSel=i;sltSetType(ty[Math.round(s.sta)])}});
 dzAddCase();const c=dzCase();const g=getPointAndNormalAtStation(80);c.zone=[[g.x+20,g.y-15],[g.x+45,g.y-10],[g.x+50,g.y+20],[g.x+25,g.y+28]];c.bl=[[g.x+18,g.y-20],[g.x+30,g.y-22],[g.x+55,g.y-12]];c.walls.push({name:'擋土牆1',s0:5,s1:30,side:'L',off:0,H:3});c.swalls.push({name:'坡面牆1',pts:[[g.x+22,g.y],[g.x+35,g.y+5]],H:2});c.secs.push({name:'剖面1',pts:[[g.x+30,g.y-30],[g.x+35,g.y+35]]});requestRedraw();});
await pg.waitForTimeout(3000);
const dxf=await pg.evaluate(()=>buildFullDXF());fs.writeFileSync('/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/s57'+'/full.dxf',dxf);
console.log(JSON.stringify(await pg.evaluate(()=>({ew:dzEwTot(),X:dzExclRanges().map(r=>r.name),book:stQtyBook().sheets.map(s=>s.name+':'+s.rows.length)}))).slice(0,600));
for(const m of ['PROFILE','CROSS']){await pg.evaluate(m=>{setViewMode(m);if(m==='CROSS')setCrossDisplayMode('MATRIX')},m);await pg.waitForTimeout(1200);await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/s57'+'/full_'+m+'.png'});}
console.log(errs.join('\n')||'noerr');await b.close()})();
