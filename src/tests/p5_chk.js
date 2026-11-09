// v6.5 B5 全專案檢核清單：空白專案、示範地形（護岸＋結構物＋排水＋水力）、參考專案 u.tcproj；點列跳位置
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
const fail=m=>errs.push('FAIL '+m);
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1200);
const e0=await pg.evaluate(()=>chkRun().map(x=>x.sev+':'+x.cat));
if(e0.filter(x=>x.startsWith('err:基本資料')).length!==2)fail('空白專案應有 2 個基本資料錯誤 '+e0);
if(!/檢核/.test(await pg.textContent('#btnChk')))fail('無檢核按鈕');
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
const r1=await pg.evaluate(()=>{rvAdd('L',0,80,'grav');rvAdd('L',60,120,'grav');stAdd(100,'dam');state.dnPickType='dry';dnAdd('A');const d=state.dns[state.dns.length-1];Object.assign(d,{s0:20,s1:80,side:'R',e:9});d.type='dry';d.p=Object.assign({},DN_TYPES.dry.p);d._k=null;d.q=50;
  rebuildAlignmentAndSections();rvRecalc();state.hy.Q=[{s0:null,s1:null,q25:300,q50:400}];hyRun();return chkRun().map(x=>[x.sev,x.cat,x.obj,x.msg,!!x.go])});
const has=(c,re)=>r1.some(x=>x[1]===c&&re.test(x[3]));
if(!has('護岸',/重疊/))fail('應偵測左岸護岸重疊');
if(!has('排水',/通水檢核/))fail('應偵測排水溝通水能力不足（Q=50）');
if(!has('水力',/出水高不足/))fail('Q50=400 應有出水高不足');
const st=await pg.evaluate(()=>{state.hy.Q[0].q50=450;hyCheckStale();return chkRun().some(x=>x.cat==='水力'&&/過期/.test(x.msg))});
// 開清單、點第一個有樁號的項目
if(!st)fail('改 Q 後應提示水面線過期');
await pg.click('#btnChk');await pg.waitForTimeout(300);
const nRow=await pg.$$eval('#chkPanel .chk-row',a=>a.length);if(nRow<3)fail('清單列數 '+nRow);
const k=await pg.evaluate(()=>CHK.items.findIndex(x=>x.cat==='護岸'&&/重疊/.test(x.msg)));
await pg.click(`#chkPanel .chk-row[onclick="chkGo(${k})"]`);await pg.waitForTimeout(400);
const g=await pg.evaluate(()=>({vm:state.viewMode,fl:!!CHK.flash,sel:state.rvSel,cam:[state.cam2D.cx,state.cam2D.cy],tab:document.getElementById('tab-earth').style.display}));
if(g.vm!=='2D'||!g.fl||g.tab==='none')fail('跳位置失敗 '+JSON.stringify(g));
await pg.screenshot({path:'/tmp/p5_chk.png'});
// 參考專案
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(3000);
const r3=await pg.evaluate(()=>{const t=performance.now();const L=chkRun();return {ms:performance.now()-t,n:chkCount(),L:L.map(x=>x.sev+' '+x.cat+' '+x.obj)}});
if(r3.n.err!==1||r3.n.warn!==1)fail('u.tcproj 檢核數變了 '+JSON.stringify(r3));
console.log(JSON.stringify({demo:r1.map(x=>x.slice(0,3).join(' ')),stale:st,rows:nRow,go:g.vm,u:r3.L,ms:+r3.ms.toFixed(1)}));
console.log(errs.join('\n')||'noerr');await b.close();})();
