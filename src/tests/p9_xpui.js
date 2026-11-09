// v7.1b：自行加樁號區塊位置＋徽章
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());const fail=m=>errs.push('FAIL '+m);
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(3000);
const r=await pg.evaluate(()=>{const v=document.getElementById('customStaVal'),card=v.closest('.sec-card');const t=card&&card.querySelector('.sec-title').textContent;const btn=card.querySelector('.sec-title');return {t,in:!!btn,pos:btn?!!(btn.compareDocumentPosition(v)&Node.DOCUMENT_POSITION_FOLLOWING):false,dup:document.querySelectorAll('button[onclick="staPickAdd()"]').length,badge:document.getElementById('ipCountBadge').textContent,tbl:!!card.querySelector('#xpStaTbl')}});
if(!/中心線定線與圖面加樁工具/.test(r.t)||!r.in||!r.pos||!r.tbl||r.dup!==1)fail('位置 '+JSON.stringify(r));if(!/加樁 1/.test(r.badge))fail('徽章 '+r.badge);
await pg.evaluate(()=>{document.getElementById('customStaVal').value='250';document.getElementById('customStaName').value='測試';addCustomStation();});await pg.waitForTimeout(800);
const b2=await pg.evaluate(()=>[document.getElementById('ipCountBadge').textContent,document.querySelectorAll('#xpStaTbl tbody tr').length]);if(!/加樁 2/.test(b2[0])||b2[1]!==2)fail('加入後 '+b2);
await pg.evaluate(()=>{const c=document.getElementById('customStaVal').closest('.sec-card');c.scrollIntoView();});
await pg.evaluate(()=>{const tb=document.querySelector('.panel-tab[data-tab="tab-align"]');if(tb)tb.click();const c=document.getElementById('customStaVal').closest('.sec-card');if(c.classList.contains('collapsed'))c.querySelector('.sec-title').click();c.scrollIntoView();});await pg.waitForTimeout(300);
await pg.evaluate(()=>document.getElementById('customStaVal').closest('.sec-card').querySelector('.sec-title').click());await pg.waitForTimeout(400);await pg.screenshot({path:'/home/claude/work/p9_ui.png'});
console.log(JSON.stringify(r),b2);console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
