// v6.9 橫斷面偏角（輸入、平面點選、復原、存讀檔、防砂壩排除、DXF）＋護岸依起點樁號編號
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
const fail=m=>errs.push('FAIL '+m);
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(3000);
const dxf0=await pg.evaluate(()=>buildFullDXF().length);
// 選一個非壩位、非曲線點的樁號
const r0=await pg.evaluate(()=>{const S=state.sections;let k=S.findIndex((s,i)=>i>2&&!secRotBlocked(s.sta)&&!s.side&&s.readL>5);const s=S[k];selectStationIndex(k);
 return {k,n:S.length,sta:s.sta,cx:s.cx,cy:s.cy,d:[s.lx-s.cx,s.ly-s.cy],other:[S[k+2].lx,S[k+2].ly],box:!!document.getElementById('cv_ROT')};});
if(!r0.box)fail('沒有偏角輸入框');
const ang=(u,v)=>Math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1])*180/Math.PI;
// 1. 輸入 15°
await pg.evaluate(()=>{const el=document.getElementById('cv_ROT');el.value='15';el.dispatchEvent(new Event('change'));});await pg.waitForTimeout(500);
const r1=await pg.evaluate(k=>{const S=state.sections,s=S[k];return {n:S.length,sta:s.sta,cx:s.cx,cy:s.cy,rot:s.rot,d:[s.lx-s.cx,s.ly-s.cy],other:[S[k+2].lx,S[k+2].ly],lbl:document.getElementById('cv_ROT').value,ext:JSON.stringify(state.secExt)}},r0.k);
const a1=ang(r0.d,r1.d);
if(r1.n!==r0.n||Math.abs(r1.sta-r0.sta)>1e-9||Math.hypot(r1.cx-r0.cx,r1.cy-r0.cy)>1e-9)fail('樁號/中心點變了');
if(r1.rot!==15||Math.abs(a1-15)>0.01)fail('偏角 '+r1.rot+' '+a1);
if(Math.hypot(r1.other[0]-r0.other[0],r1.other[1]-r0.other[1])>1e-9)fail('其他斷面被改');
// 2. DXF：長度變、含斜交字樣
const dx=await pg.evaluate(()=>{const t=buildFullDXF();return {L:t.length,has:/斜交|\\U\+659C\\U\+4EA4/.test(t)}});
if(!dx.has)fail('DXF 無斜交標註');
// 3. 復原
await pg.evaluate(()=>undoLastAction());await pg.waitForTimeout(500);
const r3=await pg.evaluate(k=>state.sections[k].rot,r0.k);if(r3)fail('復原後偏角仍在 '+r3);
// 4. 平面點選方向 20°（游標在斜線上的點）
await pg.evaluate(()=>{state.dzSnap=false;});
await pg.evaluate(()=>{secRotTool();});await pg.waitForTimeout(400);
const tgt=await pg.evaluate(k=>{const s=state.sections[k],g=getPointAndNormalAtStation(s.sta),a=20*Math.PI/180,nx=g.nx*Math.cos(a)-g.ny*Math.sin(a),ny=g.nx*Math.sin(a)+g.ny*Math.cos(a);const q=worldToScreen2D(g.x+nx*6,g.y+ny*6),q0=worldToScreen2D(g.x,g.y),r=cadCanvas.getBoundingClientRect();return {x:r.left+q.x,y:r.top+q.y,tool:state.activeTool,rad:Math.hypot(q.x-q0.x,q.y-q0.y)}},r0.k);
if(tgt.tool!=='SEC_ROT')fail('工具 '+tgt.tool);
await pg.mouse.move(tgt.x,tgt.y);await pg.waitForTimeout(200);
await pg.screenshot({path:'/tmp/p8_tool.png'});
await pg.mouse.click(tgt.x,tgt.y);await pg.waitForTimeout(600);
const r4=await pg.evaluate(k=>state.sections[k].rot,r0.k);{const tol=0.3+Math.atan(1/tgt.rad)*180/Math.PI;/* 容許 1 像素點選誤差（視窗或介面倍率不同時，6 m 對應像素數不同） */if(!(Math.abs(r4-20)<tol))fail('點選偏角 '+r4+' 容許 '+tol.toFixed(2));}
await pg.keyboard.press('Escape');await pg.waitForTimeout(200);
const t4=await pg.evaluate(()=>state.activeTool);if(t4==='SEC_ROT')fail('Esc 未結束');
await pg.screenshot({path:'/tmp/p8_plan.png'});
// 5. 存讀檔
const r5=await pg.evaluate(k=>{const sta=state.sections[k].sta,o=collectProject();applyProject(JSON.parse(JSON.stringify(o)),'x.tcproj');return new Promise(res=>setTimeout(()=>{const s=state.sections.find(x=>Math.abs(x.sta-sta)<0.005);res(s&&s.rot)},2500))},r0.k);
if(!(Math.abs(r5-r4)<1e-9))fail('存讀檔 '+r5);
// 6. 上限 ±60、防砂壩樁號
const r6=await pg.evaluate(k=>{const s=state.sections[k];secRotSet(s.sta,80,true);const v=state.sections.find(x=>Math.abs(x.sta-s.sta)<0.005).rot;const st=state.structs[0];const okDam=st?secRotSet(st.sta,10,true):false;const sd=st?state.sections.find(x=>Math.abs(x.sta-st.sta)<0.03):null;return {v,okDam,dam:sd?sd.rot:0,hasSt:!!st}},r0.k);
if(r6.v!==60)fail('上限 '+r6.v);if(r6.hasSt&&(r6.okDam||r6.dam))fail('壩位套用偏角 '+JSON.stringify(r6));
// 7. 交叉提醒：相鄰斷面反向大角度
const r7=await pg.evaluate(k=>{const S=state.sections;secRotSet(S[k].sta,60,true);secRotSet(S[k+1].sta,-60,true);return secRotCross()},r0.k);
await pg.evaluate(()=>setViewMode('CROSS'));await pg.waitForTimeout(500);await pg.screenshot({path:'/tmp/p8_cross.png'});
// 8. 護岸編號：中間插入
const rv=await pg.evaluate(()=>{const R=state.revs.filter(r=>r.side==='R');if(!R.length)return null;const L=R.map(r=>[rvLim(r).a,rvShort(r)]);
 const a=R.map(r=>rvLim(r)).sort((u,v)=>u.a-v.a)[0];const nr=JSON.parse(JSON.stringify(R[0]));nr.s0=a.a+(a.b-a.a)/2;nr.s1=a.b;state.revs.push(nr);
 const L2=state.revs.filter(r=>r.side==='R').map(r=>[rvLim(r).a,rvShort(r)]).sort((u,v)=>u[0]-v[0]);state.revs.pop();return {L,L2};});
if(rv){const ok=rv.L2.every((x,i)=>x[1]==='右護'+(i+1));if(!ok)fail('編號 '+JSON.stringify(rv.L2));}
console.log(JSON.stringify({r0:[r0.k,r0.sta],a1,dxf:[dxf0,dx.L],r4,r5,r6,r7,rv}));
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
