// v6.6 參數合理範圍提示：超出範圍→檢核清單警告＋輸入框標黃；改回正常→消失；不阻擋計算
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());const fail=m=>errs.push('FAIL '+m);
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1200);
await pg.evaluate(()=>loadDemoTerrain());await pg.waitForTimeout(800);
const r0=await pg.evaluate(()=>{stAdd(100,'dam');rvAdd('L',0,80,'grav');state.dnPickType='rect';dnAdd('A');rebuildAlignmentAndSections();return chkRun().filter(x=>x.pr).length});
if(r0!==0)fail('預設參數不應有範圍警告 '+r0);
const r1=await pg.evaluate(()=>{const st=state.structs[0];st.p.h2=60;st.w.L.auto=false;st.w.L.r3=15;state.revs[0].p.b=4.5;state.dns[0].p.B=30;stRecalc&&stRecalc();rvRecalc();const L=chkRun();return {pr:L.filter(x=>x.pr).map(x=>x.sev+' '+x.cat+' '+x.msg),q:!!st._q}});
const want=[/有效壩高 h2 = 60 m/,/r3 = 15 m/,/頂寬 b = 4\.5 m/,/B = 3000 cm/];
want.forEach(re=>{if(!r1.pr.some(x=>re.test(x)&&/^warn/.test(x)))fail('缺範圍警告 '+re+' '+JSON.stringify(r1.pr))});
// 輸入框標黃
const y=await pg.evaluate(async()=>{stSelect(0);await new Promise(r=>setTimeout(r,200));const el=document.querySelector('input[data-path="p.h2"]');if(!el)return 'noinput';prMarkAll();const a=el.classList.contains('pr-out');el.value='6';el.dispatchEvent(new Event('input',{bubbles:true}));const b2=el.classList.contains('pr-out');el.value='60';el.dispatchEvent(new Event('input',{bubbles:true}));return [a,b2,el.classList.contains('pr-out'),el.title]});
if(!Array.isArray(y)||!y[0]||y[1]||!y[2])fail('輸入框標黃 '+JSON.stringify(y));
const dn=await pg.evaluate(async()=>{state.dnSel=0;dnPanelUI();switchSideTab&&switchSideTab('tab-dn');await new Promise(r=>setTimeout(r,200));prMarkAll();const el=[...document.querySelectorAll('input[onchange^="dnSet(\'p.B\'"]')][0];return el?[el.value,el.classList.contains('pr-out')]:'noinput'});
if(!Array.isArray(dn)||!dn[1])fail('排水溝 cm 欄標黃 '+JSON.stringify(dn));
const r2=await pg.evaluate(()=>{const st=state.structs[0];st.p.h2=6;st.w.L.r3=1.5;state.revs[0].p.b=0.45;state.dns[0].p.B=0.6;return chkRun().filter(x=>x.pr).length});
if(r2!==0)fail('改回後警告應消失 '+r2);
console.log(JSON.stringify({r1:r1.pr,y,dn}));console.log(errs.join('\n')||'noerr');await b.close();})();
