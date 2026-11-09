// v8.6：U3 平面膠囊工具列、U5 物件清單、K4 改中心線保持平面位置、控制點 C1–C3、DEM 卡片標題
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1600,height:1000}});pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
const fail=m=>errs.push('FAIL '+m);
await pg.addInitScript(()=>{try{localStorage.setItem('dizhu.demNet',JSON.stringify({on:false}));localStorage.removeItem('tc_v86');}catch(e){}});
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1500);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(3000);
const dxf0=await pg.evaluate(()=>buildFullDXF().length);
// U3
const u3=await pg.evaluate(()=>{const b=document.getElementById('v86PlanBar');const r=b.getBoundingClientRect();const o={vis:b.offsetParent!==null,h:r.height,has:['toolPan','toolDrawAxis','toolInsIP','toolExtEP','toolAddSta','toolAddStruct','toolAddRev','ipxRow','toolAddPt','toolFlip'].filter(id=>!b.contains(document.getElementById(id))),ph:!!document.querySelector('#planToolsGroup #v86PlanPh')};
 setViewMode('CROSS');o.hid=b.offsetParent===null;setViewMode('2D');o.back=b.offsetParent!==null;return o;});
if(!u3.vis||u3.h>42||u3.has.length||!u3.ph||!u3.hid||!u3.back)fail('U3 '+JSON.stringify(u3));
await pg.click('#toolDrawAxis');const t1=await pg.evaluate(()=>state.activeTool);await pg.click('#toolPan');const t2=await pg.evaluate(()=>state.activeTool);
if(t1!=='DRAW_AXIS'||t2!=='PAN')fail('U3 tools '+t1+' '+t2);
// U5
await pg.click('#uimBWork');await pg.waitForTimeout(400);
const u5=await pg.evaluate(()=>({open:V83D.open,pg:V83D.pg,rows:document.querySelectorAll('#v86Obj tr.v86-r').length,n:document.getElementById('v83N_obj').textContent}));
if(!u5.open||u5.pg!=='obj'||u5.rows!==5)fail('U5 '+JSON.stringify(u5));
await pg.evaluate(()=>{const i=document.querySelector('#v86Obj input[data-t="rv"][data-i="2"][data-k="s1"]');i.value='210';i.dispatchEvent(new Event('change'));});await pg.waitForTimeout(600);
const e1=await pg.evaluate(()=>state.revs[2].s1);if(e1!==210)fail('U5 edit '+e1);
await pg.evaluate(()=>undoLastAction());await pg.waitForTimeout(600);
const e2=await pg.evaluate(()=>state.revs[2].s1);if(e2!==220.25)fail('U5 undo '+e2);
await pg.evaluate(()=>v86ObjGo('st',0));
// K4
const k4=await pg.evaluate(async()=>{const W=t=>new Promise(r=>setTimeout(r,t));const S=()=>v86Ends().map(e=>+e.o[e.k]);const xy=()=>v86Ends().map(e=>{const g=getPointAndNormalAtStation(+e.o[e.k]);return [g.x,g.y]});
 const b0=S(),p0=xy();pushUndoSnapshot();state.axisNodes[2].x+=3;state.axisNodes[2].y+=2;rebuildAlignmentAndSections();await W(900);
 const b1=S(),p1=xy();let dm=0;p0.forEach((p,i)=>{dm=Math.max(dm,Math.hypot(p[0]-p1[i][0],p[1]-p1[i][1]))});
 const tie=state.revs[2].s1===state.structs[0].sta;
 undoLastAction();await W(900);const b2=S();
 // 關閉後不動
 v86SetK4(false);pushUndoSnapshot();state.axisNodes[2].x+=3;rebuildAlignmentAndSections();await W(900);const b3=S();undoLastAction();await W(600);v86SetK4(true);
 // 讀檔不觸發
 return {moved:b1.filter((v,i)=>Math.abs(v-b0[i])>0.005).length,dm,tie,undo:JSON.stringify(b2)===JSON.stringify(b0),off:JSON.stringify(b3)===JSON.stringify(b0),ck:!!document.getElementById('v86K4')};});
if(!(k4.moved>=5&&k4.dm<4&&k4.tie&&k4.undo&&k4.off&&k4.ck))fail('K4 '+JSON.stringify(k4));
const k4b=await pg.evaluate(async t=>{const W=t=>new Promise(r=>setTimeout(r,t));const o=JSON.parse(t);o.data.axisNodes[2].x+=3;const b0=JSON.stringify(o.data.structs.map(s=>s.sta));applyProject(o,'x.tcproj');await W(1500);return b0===JSON.stringify(state.structs.map(s=>s.sta));},fs.readFileSync('/home/claude/u.tcproj','utf8'));
if(!k4b)fail('K4 load should not move');
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(2500);
const dxf1=await pg.evaluate(()=>buildFullDXF().length);if(dxf1!==dxf0)fail('dxf '+dxf0+' '+dxf1);
// 控制點 C1–C3
const c=await pg.evaluate(()=>{state.dzBm.fix1=true;state.dzCtrl=[{px:243964.081,py:2687373.272,E:243968,N:2687381},{px:243614.533,py:2687346.188,E:243440,N:2687362},{px:243700,py:2687300,E:243545,N:2687310},{px:243900,py:2687290,E:243905,N:2687297}];
 CTL.key='';dzMapUI();const D=ctlDiag();const o={bad:D.bad,sus:document.querySelectorAll('.ctl-sus').length,note:!!document.getElementById('ctlNote'),diag:!!document.getElementById('ctlDiag')};ctlOffBad();o.rms=dzGeo().rms;o.off=state.dzCtrl.map(c=>!!c.off);
 ctlMapPick(0);o.raw=!document.getElementById('ctlRaw').disabled;document.getElementById('ctlRaw').click();o.map=!!CTL.map;document.getElementById('ctlCancel').click();return o;});
if(c.bad.join()!=='1,2'||c.sus!==2||!c.note||!c.diag||!(c.rms<10)||c.off.join()!=='false,true,true,false'||!c.raw||!c.map)fail('ctl '+JSON.stringify(c));
// DEM 卡片標題
const dt=await pg.evaluate(()=>{const g=()=>[...document.querySelectorAll('#dzMapBox .sec-title span')].map(s=>s.textContent).filter(t=>/DEM|DTM/.test(t)).join('|');const a=g();DNET.on=true;DNET.src='terr';dzMapUI();const b=g();DNET.src='moi';dzMapUI();const c=g();DNET.on=false;DNET.src='terr';dzMapUI();return [a,b,c];});
if(/20 m DEM/.test(dt[0])||!/SRTM/.test(dt[1])||!/內政部 20 m DTM/.test(dt[2]))fail('DEM title '+JSON.stringify(dt));
console.log(JSON.stringify({u3,u5,k4,c,dt}));
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
