// v8.0：梳子壩、固床工＋基樁（固床工型式）
const {chromium}=require('playwright');const fs=require('fs');const OUT='/home/claude/prev/shots/';try{fs.mkdirSync(OUT,{recursive:true});}catch(e){}
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
await pg.evaluate(()=>{stAdd(80,'sill');});await pg.waitForTimeout(1500);
const fail=m=>errs.push('FAIL '+m);
for(const sty of ['comb','gsp']){
 const r=await pg.evaluate(sty=>{const o={};state.structSel=0;sltSetType(sty);const st=state.structs[0];const R=sltRun(st);
  o.rows=R.rows.map(x=>[x.name,x.unit,x.qty]);o.checks=R.checks.map(c=>c.ok);
  const q=stQty(st);o.qrows=q.rows.length;o.V=+q.V.toFixed(2);
  const V=sltViews(st);o.views=[V.plan.length,V.sect.length,V.elev.length];
  const sp=sltStdPrims(st);o.std=sp.P.length;
  o.env=[st.p.w,st.p.h2,st.p.h3,st.p.d1,st.w.L.wh,st.w.R.wh];
  sltFitW();o.fit=JSON.stringify(Object.keys(st.sp).filter(k=>/ovf|weir/.test(k)).map(k=>[k,st.sp[k]]));
  o.html=sltParamHTML(st).length;
  const ex=stExcav(st);o.ex=[ex.ok,+ex.V.toFixed(1)];
  o.dxf=buildFullDXF().length;
  return o;},sty);
 console.log(sty,JSON.stringify(r));
 if(!(r.rows.length>=4&&r.views.every(v=>v>0)&&r.std>100&&r.dxf>1000))fail(sty+' basic');
 await pg.evaluate(()=>{setViewMode('2D');const q=getPointAndNormalAtStation(80);state.cam2D.cx=q.x;state.cam2D.cy=q.y;state.cam2D.scale=6;requestRedraw();});await pg.waitForTimeout(800);
 await pg.screenshot({path:OUT+sty+'_plan.png'});
}
// 預設值數量（與原工具差異對照用）
const d=await pg.evaluate(()=>['comb','gsp'].map(k=>TCO_S[k].run({}).rows.map(r=>[r.name,r.qty])));
console.log(JSON.stringify(d));
const c0=d[0],g0=d[1];
if(Math.abs(c0[0][1]-4984.77)>0.05)fail('comb conc '+c0[0][1]);
if(g0[3][1]!==22)fail('gsp piles '+g0[3][1]);
// 存檔／讀檔保留型式與自訂清單
const rt=await pg.evaluate(()=>{const st=state.structs[0];st.sp=Object.assign({},st.sp,{__pu:[0,500],__pd:[250]});sltSync(st);const a=stClean();stLoad(JSON.parse(JSON.stringify(a)));const s2=state.structs[0];return [s2.sty,sltRun(s2).P.piles.length];});
if(rt[0]!=='gsp'||rt[1]!==3)fail('roundtrip '+rt);
console.log(errs.join('\n')||'noerr');await b.close();})();
