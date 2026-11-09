const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1000);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p3'+'/u.tcproj','utf8'));await pg.waitForTimeout(3000);
const info=await pg.evaluate(()=>{const G=state.grades[0];const R=grdRes(G).R;return R.map(r=>[r.st.lab,(r.sides.L&&r.sides.L.benches.length)||0,(r.sides.R&&r.sides.R.benches.length)||0])});console.log(JSON.stringify(info));
const lab=await pg.evaluate(()=>{const G=state.grades[0];const R=grdRes(G).R;const r=R.find(r=>(r.sides.L&&r.sides.L.benches.length)||(r.sides.R&&r.sides.R.benches.length))||R[1];const k=state.sections.findIndex(s=>Math.abs(s.sta-r.st.sta)<0.01);selectStationIndex(k);setViewMode('CROSS');setCrossDisplayMode('SINGLE');return r.st.lab});
await pg.waitForTimeout(1200);
const hs=await pg.evaluate(()=>{const a=camInv(0,0),bx=camInv(1,0),by=camInv(0,1),rc=cadCanvas.getBoundingClientRect();return GRD_XH.map(h=>({t:h.t,ti:h.ti,x:rc.left+(h.x-a.x)/(bx.x-a.x),y:rc.top+(h.y-a.y)/(by.y-a.y),key:h.key}))});
console.log(lab,JSON.stringify(hs.map(h=>[h.t,h.ti])), await pg.evaluate(()=>dzSecCFtxt(state.sections[state.selectedStaIdx],'m²')));
await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p3'+'/g10a.png',clip:{x:480,y:110,width:1220,height:830}});
const th=hs.find(h=>h.t==='th');
if(th){await pg.mouse.move(th.x,th.y);await pg.mouse.down();await pg.mouse.move(th.x,th.y-25,{steps:5});await pg.mouse.up();await pg.waitForTimeout(800);
 console.log('after',await pg.evaluate(k=>JSON.stringify(state.grades[0].ov[k]),th.key));
 await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p3'+'/g10b.png',clip:{x:480,y:110,width:1220,height:830}});}
const zb=hs.find(h=>h.t==='zb');await pg.mouse.move(zb.x,zb.y);await pg.mouse.down();await pg.mouse.move(zb.x,zb.y-20,{steps:4});await pg.mouse.up();await pg.waitForTimeout(600);
console.log('zb',await pg.evaluate(k=>JSON.stringify(state.grades[0].ov[k]),zb.key));
console.log(errs.join('\n')||'noerr');await b.close();})();
