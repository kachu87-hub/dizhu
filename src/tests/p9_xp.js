// v7.1 平面圖斷面微調（C1/C2/A5）＋加樁管理（B1/B2/B4）
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
const fail=m=>errs.push('FAIL '+m);const W=t=>pg.waitForTimeout(t);
await pg.addInitScript(()=>{try{localStorage.setItem('dizhu.demNet',JSON.stringify({on:false}));}catch(e){}});await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await W(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await W(3000);
const dxf0=await pg.evaluate(()=>buildFullDXF().length);if(dxf0!==9556658)fail('DXF 長度 '+dxf0);
// B1 表格
const t1=await pg.evaluate(()=>({rows:document.querySelectorAll('#xpStaTbl tbody tr').length,cs:JSON.stringify(state.customStations)}));if(t1.rows!==1)fail('加樁表列數 '+t1.rows);
await pg.evaluate(()=>{state.dzSnap=false;setViewMode('2D');});
// 選 0K+170 加樁：點樁號文字
const k170=await pg.evaluate(()=>state.sections.findIndex(s=>Math.abs(s.sta-170)<0.005));
await pg.evaluate(k=>{const s=state.sections[k];state.cam2D.cx=s.cx;state.cam2D.cy=s.cy;state.cam2D.scale=Math.max(state.cam2D.scale,12);requestRedraw();},k170);await W(400);
const lp=await pg.evaluate(k=>{const L=XP.lbl.find(l=>l.sec===state.sections[k]);if(!L)return null;const xs=L.box.map(p=>worldToScreen2D(p.x,p.y));const r=cadCanvas.getBoundingClientRect();return {x:r.left+xs.reduce((a,p)=>a+p.x,0)/4,y:r.top+xs.reduce((a,p)=>a+p.y,0)/4}},k170);
if(!lp)fail('找不到樁號文字框');else{await pg.mouse.click(lp.x,lp.y);await W(500);}
const s1=await pg.evaluate(()=>({sel:state.selectedStaIdx,on:XP.on,box:document.getElementById('xpBox').style.display,ttl:document.getElementById('xpTitle').textContent,del:document.getElementById('xpDelBtn').style.display}));
if(s1.sel!==k170||!s1.on||s1.box!=='block')fail('點選樁號未開啟視窗 '+JSON.stringify(s1));if(s1.del==='none')fail('加樁沒有刪除鈕');
// C2 預覽有內容
const px=await pg.evaluate(()=>{const c=document.getElementById('xpCv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=16)if(d[i]+d[i+1]+d[i+2]>120)n++;return n});if(px<200)fail('預覽空白 '+px);
await pg.screenshot({path:'/home/claude/work/p9_open.png'});
// C1 拖曳端點到 10°
const dr=await pg.evaluate(k=>{const s=state.sections[k],g=getPointAndNormalAtStation(s.sta),a=10*Math.PI/180,nx=g.nx*Math.cos(a)-g.ny*Math.sin(a),ny=g.nx*Math.sin(a)+g.ny*Math.cos(a),r=cadCanvas.getBoundingClientRect(),p=xpHandles(s)[0],L=Math.hypot(s.lx-s.cx,s.ly-s.cy)*0.5,q=worldToScreen2D(g.x+nx*L,g.y+ny*L);return {a:{x:r.left+p.x,y:r.top+p.y},b:{x:r.left+q.x,y:r.top+q.y}}},k170);
await pg.mouse.move(dr.a.x,dr.a.y);await pg.mouse.down();await pg.mouse.move((dr.a.x+dr.b.x)/2,(dr.a.y+dr.b.y)/2);await pg.mouse.move(dr.b.x,dr.b.y);await W(150);
await pg.screenshot({path:'/home/claude/work/p9_drag.png'});
await pg.mouse.up();await W(700);
let rot=await pg.evaluate(()=>secRotRaw(170));if(!(Math.abs(rot-10)<0.3))fail('拖曳偏角 '+rot);
// 方向鍵
await pg.keyboard.press('ArrowLeft');await pg.keyboard.press('ArrowLeft');await W(1100);
const rot2=await pg.evaluate(()=>secRotRaw(170));if(Math.abs(rot2-(rot+1))>0.011)fail('← 兩次 '+rot+'→'+rot2);
await pg.keyboard.down('Shift');await pg.keyboard.press('ArrowRight');await pg.keyboard.up('Shift');await W(1100);
const rot3=await pg.evaluate(()=>secRotRaw(170));if(Math.abs(rot3-(rot2-0.1))>0.011)fail('Shift→ '+rot3);
const un=await pg.evaluate(()=>state.undoStack.length);
// ↓ 換樁
await pg.keyboard.press('ArrowDown');await W(400);const s2=await pg.evaluate(()=>state.selectedStaIdx);if(s2!==k170+1)fail('↓ 換樁 '+s2);
await pg.keyboard.press('ArrowUp');await W(400);
// A5：設大偏角讓與下一樁交叉 → xpDraw 不出錯；secRotCross 有值
await pg.evaluate(()=>secRotSet(170,55));await W(400);
const cr=await pg.evaluate(()=>secRotCross().length);await pg.screenshot({path:'/home/claude/work/p9_cross.png'});
await pg.evaluate(()=>secRotSet(170,8));await W(400);
// B2：先給 170 手動河寬，表格改樁號到 175
await pg.evaluate(()=>{const k=state.sections.findIndex(s=>Math.abs(s.sta-170)<0.005);selectStationIndex(k);const el=document.getElementById('cv_W');el.value='9.5';el.dispatchEvent(new Event('change'));});await W(600);
await pg.evaluate(()=>{const el=document.querySelector('#xpStaTbl .xp-s');el.value='175';el.dispatchEvent(new Event('change'));});await W(800);
const m1=await pg.evaluate(()=>({cs:state.customStations.map(c=>c.s),ext:state.secExt['175.00'],ext0:state.secExt['170.00'],sp:state.secParams['175.00'],sp0:state.secParams['170.00'],sec:state.sections.some(s=>Math.abs(s.sta-175)<0.005),old:state.sections.some(s=>Math.abs(s.sta-170)<0.005),sel:state.sections[state.selectedStaIdx].sta}));
if(m1.cs[0]!==175||!m1.sec||m1.old)fail('改樁號 '+JSON.stringify(m1));
if(!m1.ext||m1.ext.rot!==8||m1.ext0)fail('偏角未搬 '+JSON.stringify(m1));
if(!m1.sp||m1.sp.W!==9.5||m1.sp0)fail('河寬未搬 '+JSON.stringify(m1));
// 撞號：改到 180（等距樁）應被擋
await pg.evaluate(()=>{const el=document.querySelector('#xpStaTbl .xp-s');el.value='180';el.dispatchEvent(new Event('change'));});await W(500);
if(await pg.evaluate(()=>state.customStations[0].s)!==175)fail('撞號未擋');
// 改點名
await pg.evaluate(()=>{const el=document.querySelector('#xpStaTbl .xp-n');el.value='既有涵管';el.dispatchEvent(new Event('change'));});await W(600);
if(!(await pg.evaluate(()=>state.sections.some(s=>s.ptName==='既有涵管'))))fail('改點名');
// B4：拖曳 ◆ 到 ~186
await pg.evaluate(()=>{const k=state.sections.findIndex(s=>Math.abs(s.sta-175)<0.005);selectStationIndex(k);xpOpen(true);const s=state.sections[k];state.cam2D.cx=s.cx;state.cam2D.cy=s.cy;requestRedraw();});await W(400);
const mv=await pg.evaluate(()=>{const s=state.sections[state.selectedStaIdx],g=getPointAndNormalAtStation(186),r=cadCanvas.getBoundingClientRect(),a=worldToScreen2D(s.cx,s.cy),q=worldToScreen2D(g.x,g.y);return {a:{x:r.left+a.x,y:r.top+a.y},b:{x:r.left+q.x,y:r.top+q.y}}});
await pg.mouse.move(mv.a.x,mv.a.y);await pg.mouse.down();await pg.mouse.move((mv.a.x+mv.b.x)/2,(mv.a.y+mv.b.y)/2);await pg.mouse.move(mv.b.x,mv.b.y);await W(150);
await pg.screenshot({path:'/home/claude/work/p9_mv.png'});await pg.mouse.up();await W(900);
const m2=await pg.evaluate(()=>({s:state.customStations[0].s,ext:state.secExt[state.customStations[0].s.toFixed(2)]}));
if(!(Math.abs(m2.s-186)<0.1)||!m2.ext||m2.ext.rot!==8)fail('拖曳加樁 '+JSON.stringify(m2));
// Delete 刪除＋復原
await pg.keyboard.press('Delete');await W(800);
const d1=await pg.evaluate(s=>({n:state.customStations.length,ext:state.secExt[s.toFixed(2)],sp:state.secParams[s.toFixed(2)],rows:document.querySelectorAll('#xpStaTbl tbody tr').length}),m2.s);
if(d1.n!==0||d1.ext||d1.sp)fail('Delete '+JSON.stringify(d1));
await pg.evaluate(()=>undoLastAction());await W(800);
const d2=await pg.evaluate(s=>({n:state.customStations.length,ext:state.secExt[s.toFixed(2)],rows:document.querySelectorAll('#xpStaTbl tbody tr').length}),m2.s);
if(d2.n!==1||!d2.ext||d2.rows!==1)fail('復原 '+JSON.stringify(d2));
// Esc 關閉
await pg.mouse.move(300,300);await pg.keyboard.press('Escape');await W(200);if(await pg.evaluate(()=>XP.on))fail('Esc 未關閉');
// 存讀檔
const r5=await pg.evaluate(()=>{const o=collectProject();applyProject(JSON.parse(JSON.stringify(o)),'x.tcproj');return new Promise(res=>setTimeout(()=>res({cs:state.customStations.map(c=>[c.s,c.name]),rows:document.querySelectorAll('#xpStaTbl tbody tr').length}),2500))});
if(r5.rows!==1||r5.cs[0][1]!=='既有涵管')fail('存讀檔 '+JSON.stringify(r5));
// 切到橫斷面不顯示視窗
await pg.evaluate(()=>{xpOpen(true);setViewMode('CROSS')});await W(300);if(await pg.evaluate(()=>document.getElementById('xpBox').style.display)!=='none')fail('橫斷面圖仍顯示視窗');
await pg.screenshot({path:'/home/claude/work/p9_crossview.png'});
console.log(JSON.stringify({rot,rot2,rot3,cr,m1,m2}));
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
