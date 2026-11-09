const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100},deviceScaleFactor:4});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
await pg.evaluate(()=>{stAdd(80,'sill');});await pg.waitForTimeout(1500);
const r=await pg.evaluate(()=>{const o={};state.structSel=0;sltSetType('cdam');const st=state.structs[0];let R=sltRun(st);const P=R.P;
 o.P=[P.Bwt,P.Bwb,P.Btop,P.R,P.U,+(P.theta*180/Math.PI).toFixed(2),P.dS0L,P.dS1L,P.WeL];
 o.q=[P.__q.Vcorner/1e6,P.__q.Vwing/1e6,P.__q.Vconc].map(v=>+v.toFixed(3));
 o.rows=R.rows.slice(0,6).map(x=>[x.name,x.qty]); o.checks=R.checks.map(c=>[c.ok,c.text]);
 // continuity check of frame
 const F=TCO_S.cdam.geo.frame(P);let mx=0;for(let i=1;i<F.length;i++)mx=Math.max(mx,Math.hypot(F[i][0]-F[i-1][0],F[i][1]-F[i-1][1]));o.frameMaxStep=+mx.toFixed(1);o.frameN=F.length;
 // inverse check
 const g=TCO_S.cdam.geo;let e=0;[[-3000,0],[-2900,200],[0,-100],[1500,50],[2950,-150],[3200,100],[3400,-40]].forEach(([s,d])=>{const [x,u]=g.plan(P,s,d),q=g.inv(P,x,u);e=Math.max(e,Math.abs(q.s-s),Math.abs(q.d-d));});o.invErr=+e.toFixed(3);
 const th0=P.U/P.R; sltFitW(); R=sltRun(st); o.fit=[R.P.R,R.P.U,+(R.P.U/R.P.R).toFixed(4),+th0.toFixed(4)];
 const ex=stExcav(st); o.ex=[ex.ok,+ex.V.toFixed(2),ex.cuts.length];
 o.dxf=buildFullDXF().length;
 setViewMode('2D');const q=getPointAndNormalAtStation(80);state.cam2D.cx=q.x;state.cam2D.cy=q.y;state.cam2D.scale=14;requestRedraw();return o});
console.log(JSON.stringify(r,null,0));await pg.waitForTimeout(800);
await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/cdam3_plan.png',clip:{x:480,y:110,width:1220,height:830}});
await pg.evaluate(()=>{state.structSel=0;stStdOpen(0)});await pg.waitForTimeout(1500);
await pg.screenshot({path:'/tmp/claude-0/-home-claude/99069836-f851-593c-92ab-abb13bf9a61c/scratchpad/p2'+'/cdam3_stdz.png',clip:{x:150,y:230,width:240,height:130}});
console.log(errs.join('\n')||'noerr');await b.close();})();
