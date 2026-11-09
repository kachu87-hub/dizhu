const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
const r=await pg.evaluate(()=>{const i=state.sections.findIndex(s=>s.sta>=40);selectStationIndex(i);grdAdd('cl');const G=grdSel();grdSet('s1','110');grdSet('P0.zb','-2');grdSet('P1.zb','-2');grdSet('P0.eL','2');grdSet('P1.eL','2');
 const o={};const sum=()=>{const R=grdRes(G);return {Vc:+R.Vc.toFixed(1),Vf:+R.Vf.toFixed(1),n:R.R.length,bench:R.R.map(r=>(r.sides.L?r.sides.L.benches.length:'-')+'/'+(r.sides.R?r.sides.R.benches.length:'-')).join(' '),over:R.R.filter(r=>(r.sides.L&&r.sides.L.clamp)||(r.sides.R&&r.sides.R.clamp)).length,types:[...new Set(R.R.map(r=>r.p.typ.name))]}};
 o.a=sum();
 // type B: 3 tiers
 GRD_TSEL=G.tp;grdTypOp('new');const B=grdTyp(GRD_TSEL);B.name='型式B（3階）';B.rep=false;B.tiers=[{ncL:1,ncR:1,nfL:1.5,nfR:1.5,h:3,w:2},{ncL:1.2,ncR:1.2,nfL:1.5,nfR:1.5,h:4,w:3},{ncL:1.5,ncR:1.5,nfL:1.5,nfR:1.5,h:5,w:2}];G._r=null;
 o.bTypeCount=state.grdTypes.length;
 G.segs=[{a:70,b:110,t:B.id}];o.b=sum();
 const k=state.sections.find(s=>s.sta>=60).sta.toFixed(2);GRD_SECK=k;grdSecCustom(true);const ov=G.ov[k];o.custom=!!ov.tiers;ov.tiers[0].h=2;G._r=null;o.c=sum();
 const W=grdWarn(G);o.warn=[W.over.length,W.jump.length];
 const P=grdPlanLines(G);o.caps=P.segs.filter(s=>s.k==='cap').length;o.overs=P.overs.length;
 const pj=collectProject();o.saved=[pj.data.grdTypes.length,pj.data.grades[0].segs.length];
 applyProject(JSON.parse(JSON.stringify(pj)),'x.json');o.reload=[state.grdTypes.length,state.grades[0].segs.length,!!state.grades[0].ov[k].tiers];
 GRD_SEL=state.grades[0].id;
 setViewMode('2D');state.cam2D.cx=250085;state.cam2D.cy=2680060;state.cam2D.scale=6;requestRedraw();return o});
console.log(JSON.stringify(r));await pg.waitForTimeout(1000);
await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/grd7_plan.png',clip:{x:480,y:110,width:1220,height:830}});
await pg.evaluate(()=>{const k=state.sections.findIndex(s=>s.sta>=75);selectStationIndex(k);setViewMode('CROSS');setCrossDisplayMode('SINGLE')});await pg.waitForTimeout(1200);
await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/grd7_cross.png',clip:{x:480,y:110,width:1220,height:830}});
// drag zb handle in cross view
const hd=await pg.evaluate(()=>{const h=GRD_XH.find(q=>q.t==='zb');const cv=document.getElementById('cadCanvas').getBoundingClientRect();if(!h)return null;const a=camInv(0,0),bx=camInv(1,0),by=camInv(0,1),sx=bx.x-a.x,sy=by.y-a.y;return {x:(h.x-a.x)/sx,y:(h.y-a.y)/sy,l:cv.left,t:cv.top,n:GRD_XH.length,key:h.key}});
console.log(JSON.stringify(hd));
if(hd){const before=await pg.evaluate(()=>JSON.stringify(grdSel().ov));
 await pg.mouse.move(hd.l+hd.x,hd.t+hd.y);await pg.mouse.down();await pg.mouse.move(hd.l+hd.x,hd.t+hd.y-30,{steps:5});await pg.mouse.up();await pg.waitForTimeout(500);
 const after=await pg.evaluate((k)=>JSON.stringify(grdSel().ov[k]),hd.key);console.log('drag',before.length,after);
 await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/grd7_cross2.png',clip:{x:480,y:110,width:1220,height:830}});}
await pg.evaluate(()=>{setViewMode('2D');rvRenderUI();const sub=[...document.querySelectorAll('button,div')].find(e=>e.textContent.trim()==='護岸'&&e.offsetParent);if(sub)sub.click();GRD_OPEN=true;grdUI();document.getElementById('grdBox').scrollIntoView()});await pg.waitForTimeout(700);
await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/grd7_ui.png',clip:{x:0,y:60,width:480,height:1040}});
console.log(errs.join('\n')||'noerr');await b.close();})();
