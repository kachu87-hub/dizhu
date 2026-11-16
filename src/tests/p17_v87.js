// v8.7：八種原工具移植（路面 2、橫向結構物 4、護岸型式 1、生物通道開口式 1）＋控制點 C4 專案座標換算 TWD97
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1600,height:1000}});pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
const fail=m=>errs.push('FAIL '+m);
await pg.addInitScript(()=>{try{localStorage.setItem('dizhu.demNet',JSON.stringify({on:false}));}catch(e){}});
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.7.1.html');await pg.waitForTimeout(1200);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
const r=await pg.evaluate(()=>{const o={},near=(a,b,t)=>Math.abs(a-b)<=(t||0.01),R=x=>+(+x).toFixed(2),E=[];
 // 一、路面
 dnAdd('A','rcrd');const d=state.dns[state.dns.length-1];d.s0=10;d.s1=60;d._k=null;const r1=dnRows(d);if(r1[0].it!=='路面長度'||!near(r1[1].v,25))E.push('rcrd '+JSON.stringify(r1.slice(0,2)));
 dnSet('type','gvrd');const d2=state.dns[state.dnSel],r2=dnRows(d2),tie=r2.find(x=>x.u==='塊');if(!tie||tie.v!==7||!near(r2[1].v,23.694,0.002))E.push('gvrd '+JSON.stringify(r2.slice(0,2))+(tie&&tie.v));
 if(!dn2StdPrims(d2).P.length)E.push('road std');
 // 二、橫向結構物
 const X={tgb:[4.37,28.22,116.48,4,9.09,2.44],rockc:[54.6,84.51,685.98,8370,278.11,30],steel:[391.3,299.71,62.22,10059.84,227.33],stepgs:[83.87,80.83,82.81,2478.24,640,18.52,16.49]};
 Object.keys(X).forEach((k,i)=>{stAdd(40+i*30,'sill');sltSetType(k);const s=state.structs[state.structSel],q=stQty(s),v=q.rows.slice(0,X[k].length).map(r=>R(r.v));
  if(s.sty!==k||v.some((x,j)=>!near(x,X[k][j])))E.push(k+' '+JSON.stringify(v));const V=sltViews(s);if(!V||!V.plan.length||!V.sect.length)E.push(k+' views');if(!stStdPrims(s).P.length)E.push(k+' std');
  if(k==='tgb'&&q.rows.some(r=>/^結構物開挖/.test(r.it)))E.push('tgb ownEx');if(k!=='tgb'&&!q.rows.some(r=>/^結構物開挖/.test(r.it)))E.push(k+' terrain ex');});
 if([...q2i(catItems())].length!==6)E.push('catalog '+JSON.stringify(q2i(catItems())));function q2i(A){return A.filter(it=>/^(sl:(tgb|rockc|steel|stepgs)|dn:(rcrd|gvrd))$/.test(it.id)).map(it=>it.id+':'+it.g);}
 if(!q2i(catItems()).includes('dn:rcrd:29')||!CAT_GROUPS.some(g=>g.k==='29'))E.push('catalog 29');
 // 三、植生塊護岸
 rvAdd('L',20,80,'rcbox');const rv=state.revs[state.revs.length-1];rebuildAlignmentAndSections();const qb=rv._q.rows,bx=qb.find(x=>x.k==='box'),bv=qb.find(x=>x.k==='boxV');
 if(rv.type!=='rcbox'||!bx||bx.v%4!==0||!near(bv.v,bx.v*0.354,0.01))E.push('rcbox '+JSON.stringify(qb.slice(0,3)));const m=TCO_T.rcbox.model({});if(!near(m.d.V_rc,0.35)||!near(m.d.A_form,4.91)||!near(m.d.W_rebar_total,18.06)||!near(m.d.areaFndM2,1.701,0.001))E.push('rcbox box '+JSON.stringify(m.d));
 // 四、開口式動物通道（不刪除護岸、另列扣除）
 rvAdd('R',20,80);const rv2=state.revs[state.revs.length-1];rebuildAlignmentAndSections();const q0=JSON.stringify(rv2._q.rows.map(r=>R(r.v)));bioAdd('R');bioSet('kind','gap');const f=bioFind(BIO_SEL),g=bioGeo(f.rv,f.b);
 if(f.b.kind!=='gap'||JSON.stringify(rv2._q.rows.map(r=>R(r.v)))!==q0)E.push('gap cut');const a0=TCO_B.anim.model({});if(!near(a0.d.sideWallConc,3.07)||a0.d.bagCount!==34||!near(a0.d.rebarTotalWt,111.6))E.push('anim '+JSON.stringify(a0.d));
 if(!bioStdPrims(f.rv,f.b).P.length)E.push('gap std');const tw=ttWorks().filter(w=>w.cat==='生物通道');if(!tw.length||tw[0].rows.length!==9)E.push('gap tt');
 const cl=rvCleanArr(state.revs).find(x=>x.bios&&x.bios.length);if(!cl||cl.bios[0].kind!=='gap')E.push('gap save');
 // 總表類別
 const cats=[...new Set(ttBuild().types.map(t=>t.cat))];['路面','橫向截水溝','攔石工','潛壩','固床工','護岸','生物通道'].forEach(c=>{if(!cats.includes(c))E.push('cat '+c);});
 o.dxf=buildFullDXF().length;
 // 五、C4
 const L0=state.alignment.totalLength,p0=[state.points[5].x,state.points[5].y],th=25*Math.PI/180,F=(x,y)=>({E:240000+Math.cos(th)*x-Math.sin(th)*y,N:2660000+Math.sin(th)*x+Math.cos(th)*y});
 const A=state.points[0],B=state.points[state.points.length-1];state.dzCtrl=[{px:A.x,py:A.y,mode:'tw',E:F(A.x,A.y).E,N:F(A.x,A.y).N},{px:B.x,py:B.y,mode:'tw',E:F(B.x,B.y).E,N:F(B.x,B.y).N}];state.dzBm.fix1=true;
 const sq=JSON.stringify(state.structs.map(s=>s._q.rows.map(r=>R(r.v))));v87C4Go();const t=F(p0[0],p0[1]);
 if(Math.hypot(state.points[5].x-t.E,state.points[5].y-t.N)>1e-6||!near(state.alignment.totalLength,L0,1e-6)||JSON.stringify(state.structs.map(s=>s._q.rows.map(r=>R(r.v))))!==sq)E.push('C4');
 const G=dzGeo();if(!G.ok||Math.abs(G.rot)>1e-6||G.rms>1e-6)E.push('C4 fit');v87C4Undo();if(Math.hypot(state.points[5].x-p0[0],state.points[5].y-p0[1])>1e-6)E.push('C4 undo');
 o.E=E;return o;});
r.E.forEach(fail);console.log(JSON.stringify(r));
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
