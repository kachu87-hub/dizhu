// v8.3 U1 頂部圖示、U2 浮動列膠囊、U4 底部資料抽屜
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const fail=m=>errs.push('FAIL '+m);
for(const [W,H] of [[1920,1080],[1366,768],[1100,700]]){
const pg=await b.newPage({viewport:{width:W,height:H}});pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
await pg.addInitScript(()=>{try{localStorage.setItem('dizhu.demNet',JSON.stringify({on:false}));}catch(e){}});await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1200);
await pg.evaluate(()=>{try{localStorage.removeItem('tc_v83_dr')}catch(e){}});
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(2500);
// U1
const t=await pg.evaluate(()=>{const rb=document.querySelector('.top-ribbon');const ids=['btnView2D','btnViewProfile','btnViewCross','btnView3D','uimExportBtn','uimSetBtn','btnChk'];
 const ic=ids.map(id=>{const e=document.getElementById(id);return !!(e&&e.querySelector('.v83-i'))});const f=[...document.querySelectorAll('#uimFile button')].map(x=>!!x.querySelector('.v83-i'));
 const R=rb.getBoundingClientRect();const over=[...rb.querySelectorAll('button,select')].filter(x=>x.offsetParent).some(x=>{const r=x.getBoundingClientRect();return r.right>R.right+1||r.top>R.top+R.height/2});
 return {ic,f,over,h:R.height,cls:document.body.className,txt:document.getElementById('btnViewProfile').textContent}});
if(t.ic.includes(false)||t.f.includes(false))fail(W+' 頂部圖示 '+JSON.stringify(t));if(t.over)fail(W+' 頂部超出或換行 '+JSON.stringify(t));if(!/縱斷/.test(t.txt))fail('按鈕文字');
// U2
for(const v of ['CROSS','PROFILE','3D']){await pg.evaluate(v=>setViewMode(v),v);await pg.waitForTimeout(700);
 const r=await pg.evaluate(v=>{const id={CROSS:'crossFloatingBar',PROFILE:'profileFloatingBar','3D':'v3dBar'}[v],e=document.getElementById(id),R=e.getBoundingClientRect(),P=e.parentElement.getBoundingClientRect();
  const ks=[...e.children].filter(c=>c.offsetParent&&!c.classList.contains('hint'));const T=ks.map(c=>c.getBoundingClientRect().top);const tops={size:Math.max(...T)-Math.min(...T)<14?1:2};
  return {cap:e.classList.contains('v83-cap'),rows:tops.size,h:R.height,in:R.left>=P.left&&R.right<=P.right-60,more:!e.querySelector('.v83-more').classList.contains('v83-off'),sel:!!document.getElementById('stationSelect').offsetParent||v!=='CROSS'}},v);
 if(!r.cap||r.rows!==1||!r.in||!r.sel)fail(W+' '+v+' 浮動列 '+JSON.stringify(r));
 if(v==='CROSS'&&W===1100&&!r.more)fail('窄螢幕應有「更多」');
 if(v==='CROSS'&&r.more){await pg.evaluate(()=>document.querySelector('#crossFloatingBar .v83-more button').click());await pg.waitForTimeout(200);
  const m=await pg.evaluate(()=>{const p=document.querySelector('#crossFloatingBar .v83-mpop');return [p.classList.contains('on'),p.children.length,[...p.querySelectorAll('input,select')].map(x=>x.id).join()]});if(!m[0]||!m[1])fail('更多 '+m);}
}
// U4
await pg.evaluate(()=>setViewMode('PROFILE'));await pg.waitForTimeout(500);
const d0=await pg.evaluate(()=>({h:cadCanvas.height,in:!!document.querySelector('#v83Drawer #staTableBody')&&!!document.querySelector('#v83Drawer #ptTableBody')&&!!document.querySelector('#v83Drawer #ipEditor'),open:document.getElementById('v83Drawer').classList.contains('open'),n:document.getElementById('v83N_sta').textContent}));
if(!d0.in||d0.open||!/62/.test(d0.n))fail('抽屜初始 '+JSON.stringify(d0));
// 左側「樁號表」圖示 → 開抽屜
await pg.evaluate(()=>{const t=[...document.querySelectorAll('.panel-tab.uim-eg')].find(x=>x.textContent==='樁號表'&&x.offsetParent);t.click();});await pg.waitForTimeout(600);
const d1=await pg.evaluate(()=>({h:cadCanvas.height,open:document.getElementById('v83Drawer').classList.contains('open'),rows:document.querySelectorAll('#staTableBody tr').length,vis:document.getElementById('staTableBody').offsetParent!==null,
  wrapH:document.getElementById('viewportWrap').getBoundingClientRect().bottom,dTop:document.getElementById('v83Drawer').getBoundingClientRect().top}));
if(!d1.open||!d1.vis||d1.rows<60||!(d1.h<d0.h-100)||Math.abs(d1.wrapH-d1.dTop)>2)fail('樁號表抽屜 '+JSON.stringify([d0,d1]));
// 點列＝選該樁
await pg.evaluate(()=>document.querySelectorAll('#staTableBody tr')[5].click());await pg.waitForTimeout(400);if(await pg.evaluate(()=>state.selectedStaIdx)!==5)fail('點列選樁');
// IP 要素表
await pg.evaluate(()=>openIPEditor());await pg.waitForTimeout(500);
const d2=await pg.evaluate(()=>({pg:document.querySelector('#v83Drawer .v83-pg.on').dataset.pg,rows:document.querySelectorAll('#ipeBody tr').length,pos:getComputedStyle(document.getElementById('ipEditor')).position}));
if(d2.pg!=='ip'||d2.rows<3||d2.pos!=='static')fail('IP 表 '+JSON.stringify(d2));
// 展點表
await pg.evaluate(()=>document.querySelector('#v83Drawer .v83-tab[data-pg="pt"]').click());await pg.waitForTimeout(300);
if(await pg.evaluate(()=>document.querySelectorAll('#ptTableBody tr').length)<100)fail('展點表');
// 收合 → 畫布恢復
await pg.evaluate(()=>v83DrClose());await pg.waitForTimeout(500);const h3=await pg.evaluate(()=>cadCanvas.height);if(h3!==d0.h)fail('收合後畫布 '+[d0.h,h3]);
// 記住狀態
await pg.evaluate(()=>v83DrOpen('ip'));const ls=await pg.evaluate(()=>JSON.parse(localStorage.getItem('tc_v83_dr')));if(!ls.open||ls.pg!=='ip')fail('記住 '+JSON.stringify(ls));
await pg.evaluate(()=>v83DrClose());
if(W===1366){await pg.screenshot({path:'/home/claude/work/p15_ui.png'});const L=await pg.evaluate(()=>buildFullDXF().length);if(L!==9556658)fail('DXF '+L);}
await pg.close();}
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
