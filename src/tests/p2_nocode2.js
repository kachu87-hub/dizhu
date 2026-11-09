const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{loadDemoTerrain()});await pg.waitForTimeout(800);
const re=/\b0[1-9]0[0-9]-[0-9]\b|\b6-0[0-9]\b|圖號|水保標準圖 \d/;
const out=[];
for(const id of await pg.evaluate(()=>TC_ORDER.filter(i=>TC_TYPES[i].cat==='rev'))){
 const r=await pg.evaluate(([id,src])=>{const re=new RegExp(src);state.revs=[];rvAdd('L',0,120,id);const rv=state.revs[0];let tx=[];try{const D={lines:[],text:(x,y,h,s)=>tx.push(s),line(){},poly(){},lwpoly(){},circle(){},arc(){},add(){},solid(){}};const P=[];const y=rvDxfStdAll(new Proxy(D,{get:(t,k)=>t[k]||(()=>{})}),0,0);}catch(e){tx.push('ERR '+e.message)}return [id,tx.filter(s=>re.test(s)||/^ERR/.test(s)).slice(0,3)]},[id,re.source]);
 out.push(r);}
console.log(JSON.stringify(out));
// UI panel check: rv panel note + slt panel title
const u=await pg.evaluate((src)=>{const re=new RegExp(src);rvRenderUI();const a=document.getElementById('rvBox').innerText;stAdd(60,'sill');sltSetType('r0607');stRenderUI();const s=(document.getElementById('stBox')||document.body).innerText;return [(a.match(new RegExp(src,'g'))||[]).slice(0,5),(s.match(new RegExp(src,'g'))||[]).slice(0,5)]},re.source);
console.log(JSON.stringify(u));
console.log(errs.join('\n')||'noerr');await b.close();})();
