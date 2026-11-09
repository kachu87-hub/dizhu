// v6.6 自動存檔與當機復原：修改→備份→關閉→重開提示→還原→手動存檔清除；開著的分頁不算遺留
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const dir='/tmp/asv_prof_'+Date.now();const ctx=await chromium.launchPersistentContext(dir,{viewport:{width:1600,height:1000}});const errs=[];const fail=m=>errs.push('FAIL '+m);
const U='file:///home/claude/tcv4/DiZhu_v8.6.html';
const open=async()=>{const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());await pg.goto(U);await pg.waitForTimeout(1500);return pg};
let A=await open();
if(!await A.$('#asvBadge'))fail('無自動存檔標示');
if(await A.$('#asvDlg'))fail('乾淨啟動不應有復原提示');
await A.evaluate(t=>applyProject(JSON.parse(t),'u.tcproj'),fs.readFileSync('/home/claude/u.tcproj','utf8'));await A.waitForTimeout(3000);
const a1=await A.evaluate(async()=>{const d0=asvDirty();const s0=await asvSave(false);state.axisNodes[0].x+=1.234;const d1=asvDirty();const t=performance.now();const s1=await asvSave(false);const ms=performance.now()-t;const L=await asvAll();return {d0,s0,d1,s1,ms,n:L.length,name:L[0]&&L[0].name,x:state.axisNodes[0].x,badge:document.getElementById('asvBadge').textContent}});
if(a1.d0||a1.s0)fail('載入後不應判為修改 '+JSON.stringify(a1));
if(!a1.d1||!a1.s1||a1.n!==1)fail('修改後應備份 '+JSON.stringify(a1));
await A.close();
let B=await open();
const dlg=await B.$$eval('#asvDlg .asv-row',a=>a.map(x=>x.textContent.replace(/\s+/g,' ')));
if(dlg.length!==1)fail('重開應出現 1 筆復原 '+dlg);
await B.screenshot({path:'/tmp/p6_asv.png'});
await B.click('#asvDlg .asv-row button.green');await B.waitForTimeout(4500);
const b1=await B.evaluate(async()=>{const L=await asvAll();return {x:state.axisNodes[0].x,n:L.length,mine:L.length&&L[0].id===ASV.sid,dirty:asvDirty(),dlg:!!document.getElementById('asvDlg'),pn:projName}});
if(Math.abs(b1.x-a1.x)>1e-9)fail('還原內容不符 '+JSON.stringify(b1));
if(b1.n!==1||!b1.mine||!b1.dirty||b1.dlg)fail('還原後狀態 '+JSON.stringify(b1));
// 另一分頁開啟時，B 的備份不算遺留
let C=await open();if(await C.$('#asvDlg'))fail('開著的分頁不應被當成遺留');await C.close();
const b2=await B.evaluate(async()=>{updateStatus('💾 專案已下載為 u.tcproj。');await new Promise(r=>setTimeout(r,300));return {n:(await asvAll()).length,dirty:asvDirty()}});
if(b2.n!==0||b2.dirty)fail('手動存檔後應清除備份 '+JSON.stringify(b2));
await B.close();let D=await open();if(await D.$('#asvDlg'))fail('已存檔後重開不應提示');
console.log(JSON.stringify({a1,dlg,b1,b2}));
await ctx.close();fs.rmSync(dir,{recursive:true,force:true});console.log(errs.join('\n')||'noerr');})();
