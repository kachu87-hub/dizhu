// v6.7 中心線鎖點（端點／中點、F3、平面工具卡片）與插入 IP（工具、Shift＋點、IP 表＋）、由 EP 接續延長
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
const fail=m=>errs.push('FAIL '+m);
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(3000);
// UI 位置：鎖點列在平面工具卡片內
const ui=await pg.evaluate(()=>({row:!!document.querySelector('#planToolsCard #ipxRow'),snap:!!document.querySelector('#ipxRow #cldSnap'),ins:!!document.querySelector('#planToolsCard #toolInsIP'),ext:!!document.querySelector('#planToolsCard #toolExtEP'),oldCk:[...document.querySelectorAll('#clBox input[type=checkbox]')].filter(c=>/dzSnap/.test(c.getAttribute('onchange')||'')&&c.offsetParent!==null).length}));
if(!ui.row||!ui.snap||!ui.ins||!ui.ext||ui.oldCk)fail('UI '+JSON.stringify(ui));
await pg.evaluate(()=>{switchSideTab('tab-align',document.querySelectorAll('.panel-tab')[1]);const c=document.getElementById('planToolsCard');c.classList.remove('folded');setViewMode('2D');});await pg.waitForTimeout(300);
await pg.screenshot({path:'/tmp/p7_ui.png',clip:{x:0,y:0,width:520,height:700}});
// 中點鎖點：中心線第 2 段中點
const r1=await pg.evaluate(()=>{state.dzSnap=true;const N=state.axisNodes,a=N[1],c=N[2],m={x:(a.x+c.x)/2,y:(a.y+c.y)/2};focusWorldPos(m.x,m.y);requestRedraw();
  const s=worldToScreen2D(m.x,m.y);AXOV_LAST={x:s.x+3,y:s.y-2,alt:false};const p=dzSnapPt(s.x+3,s.y-2);const v=worldToScreen2D(a.x,a.y),q=dzSnapPt(v.x+2,v.y+2);
  state.snapCfg.mid=false;const p2=dzSnapPt(s.x+3,s.y-2);state.snapCfg.mid=true;state.dzSnap=false;const p3=dzSnapPt(v.x,v.y);state.dzSnap=true;
  return {mid:p&&p.type,dm:p?Math.hypot(p.x-m.x,p.y-m.y):-1,end:q&&q.type,de:q?Math.hypot(q.x-a.x,q.y-a.y):-1,offMid:p2&&p2.type,off:p3}});
if(r1.mid!=='mid'||r1.dm>1e-6||r1.end!=='end'||r1.de>1e-6||r1.offMid==='mid'||r1.off)fail('鎖點 '+JSON.stringify(r1));
// F3
const f3=await pg.evaluate(()=>{const a=state.dzSnap;window.dispatchEvent(new KeyboardEvent('keydown',{key:'F3'}));const b=state.dzSnap;window.dispatchEvent(new KeyboardEvent('keydown',{key:'F3'}));return [a,b,state.dzSnap,document.getElementById('snapOn').textContent]});
if(!(f3[0]===true&&f3[1]===false&&f3[2]===true))fail('F3 '+f3);
// 繪中心線時中點鎖點點擊（DRAW_AXIS），截圖覆蓋層
await pg.evaluate(()=>setTool('DRAW_AXIS'));await pg.waitForTimeout(400);
const cv=await pg.$('#cadCanvas'),bb=await cv.boundingBox();
const mp=await pg.evaluate(()=>{const N=state.axisNodes,m={x:(N[1].x+N[2].x)/2,y:(N[1].y+N[2].y)/2},s=worldToScreen2D(m.x,m.y);return {s,m}});
await pg.mouse.move(bb.x+mp.s.x+60,bb.y+mp.s.y+60);await pg.waitForTimeout(400);Object.assign(mp,await pg.evaluate(()=>{const N=state.axisNodes,m={x:(N[1].x+N[2].x)/2,y:(N[1].y+N[2].y)/2};return {s:worldToScreen2D(m.x,m.y),m}}));await pg.mouse.click(bb.x+mp.s.x+60,bb.y+mp.s.y+60);await pg.waitForTimeout(400);Object.assign(mp,await pg.evaluate(()=>{const N=state.axisNodes,m={x:(N[1].x+N[2].x)/2,y:(N[1].y+N[2].y)/2};return {s:worldToScreen2D(m.x,m.y),m}}));
await pg.mouse.move(bb.x+mp.s.x+4,bb.y+mp.s.y+3);await pg.waitForTimeout(100);
await pg.screenshot({path:'/tmp/p7_mid.png',clip:{x:bb.x+mp.s.x-200,y:bb.y+mp.s.y-150,width:500,height:350}});
await pg.mouse.click(bb.x+mp.s.x+4,bb.y+mp.s.y+3);
const t2=await pg.evaluate(()=>state.tempAxisNodes.map(p=>[p.x,p.y]));
if(t2.length!==2||Math.hypot(t2[1][0]-mp.m.x,t2[1][1]-mp.m.y)>0.002)fail('繪線中點鎖點 '+JSON.stringify(t2)+' '+JSON.stringify(mp.m));
await pg.keyboard.press('Escape');await pg.evaluate(()=>setTool('PAN'));
// 插入 IP 工具：直線段上（IP2～IP3 之間，避開切線長）
const before=await pg.evaluate(()=>({n:state.axisNodes.length,L:state.alignment.totalLength,st:state.structs.map(s=>s.sta),lab:state.alignment.ipList.map(i=>[i.label,+i.tl.toFixed(2),+i.distFromPrev.toFixed(2)])}));
await pg.click('#toolInsIP');await pg.waitForTimeout(300);
const ip=await pg.evaluate(()=>{const N=state.axisNodes,a=N[2],c=N[3],m={x:a.x+(c.x-a.x)*0.5,y:a.y+(c.y-a.y)*0.5};focusWorldPos(m.x,m.y);const s=worldToScreen2D(m.x,m.y);return {s,m,tool:state.activeTool}});
await pg.mouse.move(bb.x+ip.s.x+3,bb.y+ip.s.y+4);await pg.waitForTimeout(100);
await pg.screenshot({path:'/tmp/p7_ins.png',clip:{x:bb.x+ip.s.x-250,y:bb.y+ip.s.y-150,width:600,height:350}});
await pg.mouse.click(bb.x+ip.s.x+3,bb.y+ip.s.y+4);await pg.waitForTimeout(200);
const a1=await pg.evaluate(()=>({n:state.axisNodes.length,L:state.alignment.totalLength,st:state.structs.map(s=>s.sta),tool:state.activeTool,p:state.axisNodes[3],undo:state.undoStack.length}));
if(ip.tool!=='INS_IP'||a1.n!==before.n+1||Math.abs(a1.L-before.L)>1e-3||Math.hypot(a1.p.x-ip.m.x,a1.p.y-ip.m.y)>0.5||a1.tool!=='INS_IP')fail('插入 IP '+JSON.stringify({before,a1,ip}));
// Esc 結束；Shift＋點（PAN）
await pg.keyboard.press('Escape');
const ip2=await pg.evaluate(()=>{const N=state.axisNodes,a=N[4],c=N[5],m={x:a.x+(c.x-a.x)*0.5,y:a.y+(c.y-a.y)*0.5};focusWorldPos(m.x,m.y);const s=worldToScreen2D(m.x,m.y);return {s,m,tool:state.activeTool}});
await pg.mouse.move(bb.x+ip2.s.x,bb.y+ip2.s.y);await pg.keyboard.down('Shift');await pg.mouse.click(bb.x+ip2.s.x,bb.y+ip2.s.y);await pg.keyboard.up('Shift');await pg.waitForTimeout(200);
const a2=await pg.evaluate(()=>({n:state.axisNodes.length,L:state.alignment.totalLength,cam:state.cam2D.cx}));
if(ip2.tool!=='PAN'||a2.n!==before.n+2||Math.abs(a2.L-before.L)>1e-3)fail('Shift 插入 '+JSON.stringify({ip2,a2}));
// IP 表 ＋
await pg.evaluate(()=>openIPEditor());await pg.waitForTimeout(200);
const plus=await pg.$$eval('#ipeBody tr',r=>r.map(tr=>tr.lastElementChild.textContent));
if(plus.filter(x=>x==='＋').length!==plus.length-1)fail('IP 表＋ '+plus);
await pg.click('#ipeBody tr:nth-child(1) td:last-child');await pg.waitForTimeout(200);
const a3=await pg.evaluate(()=>({n:state.axisNodes.length,rows:document.querySelectorAll('#ipeBody tr').length,p:state.axisNodes[1],L:state.alignment.totalLength}));
if(a3.n!==before.n+3||a3.rows!==a3.n)fail('IP 表插入 '+JSON.stringify(a3));
await pg.screenshot({path:'/tmp/p7_ipe.png'});
await pg.evaluate(()=>closeIPEditor());
// 復原
const u=await pg.evaluate(()=>{undoLastAction();undoLastAction();undoLastAction();return {n:state.axisNodes.length,L:state.alignment.totalLength}});
if(u.n!==before.n||Math.abs(u.L-before.L)>1e-6)fail('復原 '+JSON.stringify(u));
// EP 接續延長
const e0=await pg.evaluate(()=>({N:state.axisNodes.map(p=>({...p})),end:state.alignment.endSta,vips:state.profile.vips.map(v=>[v.sta,v.z])}));
await pg.click('#toolExtEP');
const ex=await pg.evaluate(()=>{const N=state.axisNodes,a=N[N.length-2],e=N[N.length-1],L=Math.hypot(e.x-a.x,e.y-a.y),p={x:e.x+(e.x-a.x)/L*20+5,y:e.y+(e.y-a.y)/L*20};focusWorldPos(p.x,p.y);requestRedraw();return {tool:state.activeTool,t:state.tempAxisNodes.length,s:worldToScreen2D(p.x,p.y)}});
await pg.waitForTimeout(100);
await pg.keyboard.press('Backspace');await pg.keyboard.press('Backspace');
const bk=await pg.evaluate(()=>state.tempAxisNodes.length);
await pg.mouse.move(bb.x+ex.s.x,bb.y+ex.s.y);await pg.mouse.click(bb.x+ex.s.x,bb.y+ex.s.y);await pg.waitForTimeout(100);
await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const e1=await pg.evaluate(()=>({N:state.axisNodes.map(p=>({...p})),end:state.alignment.endSta,tool:state.activeTool,vips:state.profile.vips.map(v=>[v.sta,v.z])}));
const same=e0.N.every((p,k)=>Math.abs(p.x-e1.N[k].x)<1e-9&&Math.abs(p.y-e1.N[k].y)<1e-9&&(k===e0.N.length-1||p.r===e1.N[k].r));
if(ex.tool!=='DRAW_AXIS'||ex.t!==e0.N.length||bk!==e0.N.length||e1.N.length!==e0.N.length+1||!same||!(e1.end>e0.end+15)||e1.tool!=='PAN')fail('延長 '+JSON.stringify({ex,bk,n0:e0.N.length,n1:e1.N.length,same,e0:e0.end,e1:e1.end,tool:e1.tool}));
if(e1.vips.length&&(e1.vips[0][0]!==e0.vips[0][0]||e1.vips[0][1]!==e0.vips[0][1]))fail('延長不應改 BP VIP');
// 存檔／讀檔保留鎖點設定
const sv=await pg.evaluate(()=>{state.snapCfg.mid=false;const o=collectProject();state.snapCfg.mid=true;applyProject(JSON.parse(JSON.stringify(o)),'x');return [o.data.snapCfg,state.snapCfg.mid,document.getElementById('snapMid').classList.contains('active')]});
if(sv[0].mid!==false||sv[1]!==false||sv[2])fail('存檔 '+JSON.stringify(sv));
// 舊專案（無 snapCfg）預設全開
const old=await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj');return state.snapCfg},fs.readFileSync('/home/claude/u.tcproj','utf8'));
if(!old.end||!old.mid)fail('舊專案預設 '+JSON.stringify(old));
console.log(JSON.stringify({ui,r1,f3,ins:[before.n,a1.n,a2.n,a3.n,u.n],len:[before.L,a1.L],ext:[e0.end,e1.end]}));
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
