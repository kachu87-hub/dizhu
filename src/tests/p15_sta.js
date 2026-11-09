// v8.3 K1～K3：改樁號時端點、全部資料連動＋復原
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1600,height:1000}});pg.on('pageerror',e=>errs.push(e.message));
let dlg=[];pg.on('dialog',d=>{dlg.push(d.message());d.accept();});const fail=m=>errs.push('FAIL '+m);
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(3000);
const S=()=>pg.evaluate(()=>({st:state.structs.map(s=>s.sta),rv:state.revs.map(r=>[r.s0,r.s1]),cs:state.customStations.map(c=>c.s),g:state.grades.map(G=>[G.s0,G.s1,G.segs.map(q=>[q.a,q.b])]),vip:state.profile.vips.slice(0,3).map(v=>v.sta),
  cut:document.getElementById('barCutVol').textContent,fill:document.getElementById('barFillVol')?document.getElementById('barFillVol').textContent:'',ss:document.getElementById('startStationVal').value,n:state.sections.length,ext:Object.keys(state.secExt||{}).sort().join(','),sp:Object.keys(state.secParams||{}).sort().join(','),st0:state.alignment.startSta}));
const s0=await S();console.log('init',JSON.stringify(s0));
// ---- K2：固床工 220.25 → 225，右岸護岸2 迄點跟著
const ri=s0.rv.findIndex(r=>r[1]===220.25);if(ri<0)fail('找不到迄點 220.25 的護岸');
await pg.evaluate(()=>{const i=state.structs.findIndex(s=>Math.abs(s.sta-220.25)<0.01);stEditField(i,'sta',{value:'225'});});await pg.waitForTimeout(800);
let s=await S();if(s.st[0]!==225||s.rv[ri][1]!==225)fail('K2 '+JSON.stringify([s.st,s.rv]));
const ms=await pg.evaluate(()=>document.getElementById('statusText')?document.getElementById('statusText').textContent:'');console.log('K2 msg',ms);
await pg.evaluate(()=>undoLastAction());await pg.waitForTimeout(800);s=await S();if(s.st[0]!==220.25||s.rv[ri][1]!==220.25)fail('K2 undo '+JSON.stringify([s.st,s.rv]));
// 落差表改樁號
await pg.evaluate(()=>{stDropEdit(state.structs[0].id,'sta','218');});await pg.waitForTimeout(1200);s=await S();if(s.st[0]!==218||s.rv[ri][1]!==218)fail('K2 drop '+JSON.stringify([s.st,s.rv]));
await pg.evaluate(()=>undoLastAction());await pg.waitForTimeout(800);s=await S();if(s.st[0]!==220.25||s.rv[ri][1]!==220.25)fail('K2 drop undo '+JSON.stringify([s.st,s.rv]));
// ---- K1：把右岸護岸1 迄點、護岸2 起點接到加樁 170，移動加樁到 175
await pg.evaluate(()=>{const r=state.revs.filter(r=>r.side==='R');r[0].s1=170;r[1].s0=170;state.grades[0].s0=170;RV_SIG='';rebuildAlignmentAndSections();});await pg.waitForTimeout(800);
const before=await S();
await pg.evaluate(()=>{const i=state.customStations.findIndex(c=>Math.abs(c.s-170)<0.01);xpMoveCustom(i,175);});await pg.waitForTimeout(800);
s=await S();const R=s.rv.filter((r,i)=>before.rv[i][0]===170||before.rv[i][1]===170);
if(!(s.cs.includes(175)&&R.length===2&&R.every(r=>r.includes(175))&&s.g[0][0]===175))fail('K1 '+JSON.stringify([s.cs,s.rv,s.g[0]]));
await pg.evaluate(()=>undoLastAction());await pg.waitForTimeout(800);s=await S();
if(!(s.cs.includes(170)&&JSON.stringify(s.rv)===JSON.stringify(before.rv)&&s.g[0][0]===170))fail('K1 undo '+JSON.stringify([s.cs,s.rv,s.g[0]]));
// 撞到另一端不動
await pg.evaluate(()=>{const i=state.customStations.findIndex(c=>Math.abs(c.s-170)<0.01);xpMoveCustom(i,225);});await pg.waitForTimeout(800);s=await S();
const r2=s.rv[before.rv.findIndex(r=>r[0]===170)];if(r2[0]!==170)fail('K1 反轉應不動 '+JSON.stringify(s.rv));
await pg.evaluate(()=>undoLastAction());await pg.waitForTimeout(800);
// ---- K3：起點樁號 0 → 100
const b3=await S();dlg=[];
await pg.evaluate(()=>{const e=document.getElementById('startStationVal');e.value='100';e.dispatchEvent(new Event('change'));});await pg.waitForTimeout(1500);
s=await S();console.log('K3',JSON.stringify(s));
if(!dlg.length||!/一起平移/.test(dlg[0]))fail('K3 未詢問');
if(s.st0!==100||s.st[0]!==b3.st[0]+100||s.cs[0]!==b3.cs[0]+100||s.vip[1]!==+(b3.vip[1]+100).toFixed(3))fail('K3 平移 '+JSON.stringify([s.st,s.cs,s.vip]));
if(JSON.stringify(s.rv)!==JSON.stringify(b3.rv.map(r=>r.map(x=>x===null?null:+(x+100).toFixed(3)))))fail('K3 護岸 '+JSON.stringify(s.rv));
if(s.cut!==b3.cut||s.fill!==b3.fill)fail('K3 土方變了 '+[b3.cut,s.cut,b3.fill,s.fill]);
if(s.n!==b3.n)console.log('樁數',b3.n,s.n);
await pg.evaluate(()=>undoLastAction());await pg.waitForTimeout(1500);s=await S();
if(s.st0!==0||s.ss!=='0'&&s.ss!=='0.0'||JSON.stringify(s.st)!==JSON.stringify(b3.st)||JSON.stringify(s.rv)!==JSON.stringify(b3.rv)||s.cut!==b3.cut||s.ext!==b3.ext||s.sp!==b3.sp)fail('K3 undo '+JSON.stringify(s));
// 取消＝只改數字
await pg.evaluate(()=>{window.confirm=()=>false;const e=document.getElementById('startStationVal');e.value='50';e.dispatchEvent(new Event('change'));});await pg.waitForTimeout(1500);s=await S();
if(s.st0!==50||JSON.stringify(s.st)!==JSON.stringify(b3.st))fail('K3 取消 '+JSON.stringify([s.st0,s.st]));
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
