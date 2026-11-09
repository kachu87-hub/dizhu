// v7.6：結構物調高程 S1～S5、T1～T5
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());const fail=m=>errs.push('FAIL '+m);
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.6.html');await pg.waitForTimeout(1200);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(3000);
const snap0=await pg.evaluate(()=>JSON.stringify({s:stClean(),v:state.profile.vips}));
const types=await pg.evaluate(()=>{const o=[['dam',''],['sub',''],['sill','']];Object.keys(SLT).forEach(k=>{if(k!=='gen')o.push(['sill',k]);});return o;});
for(const [type,sty] of types){
 const r=await pg.evaluate(({type,sty,snap0})=>{
  const S0=JSON.parse(snap0);
  const reset=()=>{stLoad(JSON.parse(JSON.stringify(S0.s)));state.profile.vips=JSON.parse(JSON.stringify(S0.v));const st=state.structs[0];const d=stPreset(type);st.type=type;st.p=d.p;st.w=d.w;st.a=d.a;st.sty=sty||undefined;st.sp={};st.link=true;st.zB=null;try{if(sty)sltSync(st);}catch(e){}state.structSel=0;rebuildAlignmentAndSections();return st;};
  const info=st=>{const pl=stPlace(st);return {h2:+st.p.h2.toFixed(3),zB:+pl.zB.toFixed(3),zS:+pl.zS.toFixed(3),up:+getDesignZBefore(st.sta).toFixed(3),N:stzLayers(st)};};
  const out={};
  for(const kind of ['zS','zB','zSshift']){let st=reset();const a=info(st);const pl=stPlace(st);const k=kind==='zSshift'?'zS':kind;const hd={st,kind:k,zB0:pl.zB,shift:kind==='zSshift'};const z=(k==='zS'?pl.zS:pl.zB)+(sty==='g604'&&kind==='zSshift'?1.0:0.5);
   try{stApplyDrag(hd,z);stApplyDrag(hd,z);stRecalc(true);stCommitMove(st);st._it=0;rebuildAlignmentAndSections();}catch(e){out[kind]='ERR '+e.message;continue;}
   st=state.structs[0];const c=info(st);out[kind]={dh2:+(c.h2-a.h2).toFixed(3),dzB:+(c.zB-a.zB).toFixed(3),dzS:+(c.zS-a.zS).toFixed(3),dUp:+(c.up-a.up).toFixed(3),dN:a.N===null?null:c.N-a.N,blk:!!hd._blocked};}
  return {name:(sty?SLT[sty].label:stTypeLabel(type)),sty,out};},{type,sty,snap0});
 const o=r.out;
 for(const k of ['zS','zB']){const q=o[k];if(typeof q==='string'||Math.abs(q.dh2)>1e-6||Math.abs(q.dzB-0.5)>0.011||Math.abs(q.dzS-0.5)>0.011||Math.abs(q.dUp-0.5)>0.011)fail(r.name+' '+k+' '+JSON.stringify(q));}
 const q=o.zSshift;if(typeof q==='string')fail(r.name+' shift '+q);
 else if(!r.sty){if(Math.abs(q.dh2-0.5)>1e-6||Math.abs(q.dzB)>1e-6)fail(r.name+' shift '+JSON.stringify(q));}
 else if(r.sty==='g604'){if(!(q.dN>0)||Math.abs(q.dzB)>1e-6)fail(r.name+' shift '+JSON.stringify(q));}
 else {if(!q.blk||Math.abs(q.dh2)>1e-6||Math.abs(q.dzB)>1e-6)fail(r.name+' shift '+JSON.stringify(q));}
 console.log(JSON.stringify(r));
}
// T5：外包 h2 被改錯 → 重算復原
const t5=await pg.evaluate(({snap0})=>{const S0=JSON.parse(snap0);stLoad(JSON.parse(JSON.stringify(S0.s)));const st=state.structs[0];const d=stPreset('sill');st.type='sill';st.p=d.p;st.w=d.w;st.a=d.a;st.sty='r0607';st.sp={};sltSync(st);const h=st.p.h2;st.p.h2=h+0.49;stRecalc(true);return [h,st.p.h2];},{snap0});
if(Math.abs(t5[0]-t5[1])>1e-6)fail('T5 '+t5);console.log('T5',t5);
// 回原專案
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(2500);
// S1：卡片頂高程輸入、▲▼
const s1=await pg.evaluate(()=>{stSelect(0);const st=state.structs[0];const inp=document.getElementById('stzTop');if(!inp)return 'noinput';const a=stPlace(st).zS,h2=st.p.h2,up=getDesignZBefore(st.sta);inp.value=(a+0.3).toFixed(2);inp.dispatchEvent(new Event('change'));const s=state.structs[0],b=stPlace(s).zS;stzBtn({shiftKey:false},-1);const c=stPlace(state.structs[0]).zS;return {a,b,c,dh2:state.structs[0].p.h2-h2,dup:getDesignZBefore(st.sta)-up,hint:(document.getElementById('stzLinkHint')||{}).textContent};});
console.log('S1',JSON.stringify(s1));if(typeof s1==='string'||Math.abs(s1.b-s1.a-0.3)>0.011||Math.abs(s1.c-s1.b+0.05)>0.011||Math.abs(s1.dh2)>1e-6||Math.abs(s1.dup-0.25)>0.011||!/設計線/.test(s1.hint))fail('S1 '+JSON.stringify(s1));
// 縱斷面：實際滑鼠拖 ◆頂、Shift 拖、↑↓
await pg.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/縱斷/.test(x.textContent)&&x.getAttribute('onclick')&&/PROFILE/.test(x.getAttribute('onclick')));setViewMode('PROFILE');});await pg.waitForTimeout(800);
const vm=await pg.evaluate(()=>state.viewMode);if(vm!=='PROFILE')fail('view '+vm);
const hp=async(kind)=>pg.evaluate(kind=>{const h=ST_H.find(h=>h.view==='PROFILE'&&h.kind===kind&&h.st===state.structs[0]);if(!h)return null;const c=state.cams.PROFILE,T=state.textScale,r=cadCanvas.getBoundingClientRect();return {x:r.left+(h.x*c.k+c.tx)*T,y:r.top+(h.y*c.k+c.ty)*T,ppm:(h.zAtY(h.y)-h.zAtY(h.y+10))/10};},kind);
const st0=async()=>pg.evaluate(()=>{const s=state.structs[0],pl=stPlace(s);return {zS:pl.zS,zB:pl.zB,h2:s.p.h2};});
let h=await hp('zS');if(!h)fail('no zS handle');else{
 await pg.evaluate(()=>stSelect(0));await pg.waitForTimeout(300);h=await hp('zS');
 const a=await st0();const dy=0.5/h.ppm;await pg.mouse.move(h.x,h.y);await pg.mouse.down();await pg.mouse.move(h.x,h.y-dy/2,{steps:3});await pg.mouse.move(h.x,h.y-dy,{steps:3});
 const tip=await pg.evaluate(()=>{const t=document.getElementById('stzTip');return t&&t.style.display!=='none'?t.textContent:''});await pg.mouse.up();await pg.waitForTimeout(800);
 const c=await st0();console.log('drag',JSON.stringify({a,c,tip}));if(!(c.zS-a.zS>0.3)||Math.abs(c.h2-a.h2)>1e-6||!/整座移動/.test(tip))fail('drag '+JSON.stringify({a,c,tip}));
 h=await hp('zS');await pg.keyboard.down('Shift');await pg.mouse.move(h.x,h.y);await pg.mouse.down();await pg.mouse.move(h.x,h.y-dy,{steps:4});
 const tip2=await pg.evaluate(()=>document.getElementById('stzTip').textContent);await pg.mouse.up();await pg.keyboard.up('Shift');await pg.waitForTimeout(800);
 const hk=await pg.evaluate(()=>stzHeightKind(state.structs[0]));const d=await st0();console.log('shift',hk,JSON.stringify({d,tip2}));if((hk==='h2'?!(d.h2-c.h2>0.3):hk===null?Math.abs(d.h2-c.h2)>1e-6||!/卡片/.test(tip2):false)||Math.abs(d.zB-c.zB)>0.011)fail('shift '+JSON.stringify({c,d,tip2}));
 // S5 ↑↓
 h=await hp('zB');await pg.mouse.click(h.x,h.y);await pg.waitForTimeout(500);const e0=await st0();
 await pg.keyboard.press('ArrowUp');await pg.keyboard.press('ArrowUp');await pg.keyboard.down('Shift');await pg.keyboard.press('ArrowUp');await pg.keyboard.up('Shift');await pg.waitForTimeout(900);
 const e1=await st0();console.log('key',JSON.stringify({e0,e1,ae:await pg.evaluate(()=>document.activeElement&&document.activeElement.id)}));if(Math.abs(e1.zB-e0.zB-0.6)>0.011||Math.abs(e1.h2-e0.h2)>1e-6)fail('key '+JSON.stringify({e0,e1}));
 await pg.keyboard.press('Escape');await pg.keyboard.press('ArrowUp');await pg.waitForTimeout(600);const e2=await st0();if(Math.abs(e2.zB-e1.zB)>1e-6)fail('esc '+JSON.stringify({e1,e2}));
 // undo 一步回到 ↑↓ 之前
}
// S3：固定比例全圖
const s3=await pg.evaluate(()=>{state.pf.hScale=500;state.pf.vScale=100;requestRedraw();return true;});await pg.waitForTimeout(600);
const fit=await pg.evaluate(()=>{viewFit();const P=state.profileView,c=state.cams.PROFILE,dpr=window.devicePixelRatio||1,w=cadCanvas.width/dpr/state.textScale,h=cadCanvas.height/dpr/state.textScale;const W=(P.padL+P.graphW+45)*c.k,H=(P.padT+P.graphH+P.padB)*c.k;return {k:c.k,W,H,w,h,tx:c.tx,ty:c.ty,padB:P.padB};});
console.log('fit',JSON.stringify(fit));if(!(fit.padB>0)||fit.W>fit.w+1||fit.H>fit.h+1||fit.tx<-1)fail('fit '+JSON.stringify(fit));
const pan=await pg.evaluate(()=>{const c=state.cams.PROFILE;c.k=1;c.tx=0;c.ty=0;const i=state.structs.length-1;stSelect(i);const st=state.structs[i],P=state.profileView,bx=P.padL+(st.sta-P.minSta)/(P.maxSta-P.minSta)*P.graphW,dpr=window.devicePixelRatio||1,w=cadCanvas.width/dpr/state.textScale;return {sx:bx*c.k+c.tx,w};});
console.log('pan',JSON.stringify(pan));if(!(pan.sx>pan.w*0.15&&pan.sx<pan.w*0.85))fail('pan '+JSON.stringify(pan));
await pg.screenshot({path:'/home/claude/work/p12_prof.png'});
// S4：橫斷矩陣點到結構物格子 → 單一圖
await pg.evaluate(()=>{state.pf.hScale=0;state.pf.vScale=0;setViewMode('CROSS');setCrossDisplayMode('GRID');});await pg.waitForTimeout(800);
const cell=await pg.evaluate(()=>{const C=state._xcells||[];const c=C.find(c=>stAtSec(state.sections[c.idx]).length);if(!c)return null;const k=state.cams.CROSS,T=state.textScale,r=cadCanvas.getBoundingClientRect();return {x:r.left+((c.x+c.w/2)*k.k+k.tx)*T,y:r.top+((c.y+c.h/2)*k.k+k.ty)*T,n:C.length};});
if(!cell)console.log('S4 skip: no struct cell on page');else{await pg.mouse.click(cell.x,cell.y);await pg.waitForTimeout(800);const m=await pg.evaluate(()=>[state.crossDisplayMode,ST_H.filter(h=>h.view==='CROSS').length]);console.log('S4',m);if(m[0]!=='SINGLE'||!m[1])fail('S4 '+m);await pg.screenshot({path:'/home/claude/work/p12_cross.png'});}
console.log(errs.length?errs.join('\n'):'noerr');await b.close();})();
