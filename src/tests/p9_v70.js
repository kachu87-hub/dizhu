// v7.0：縱斷面預設 1:500/1:200、護岸頂/基礎線與左右側高預設不勾；出圖包依案例（標題欄、字型 chineset.shx、黑白線寬、封面圖目錄、位置圖 TWD97、縱斷面 X/Y 比例）
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const pg=await b.newPage({viewport:{width:1700,height:1100}});pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('dialog',d=>{errs.push('dialog '+d.message());d.accept()});
const fail=m=>errs.push('FAIL '+m);
await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1200);
const d0=await pg.evaluate(()=>({h:state.pf.hScale,v:state.pf.vScale,rows:state.pf.rows.slice(),hi:document.getElementById('pfHScale').value,vi:document.getElementById('pfVScale').value,
  rv:['pfRvTL','pfRvTR','pfRvBL','pfRvBR'].map(id=>document.getElementById(id).checked),ver:document.title}));
if(d0.h!==500||d0.v!==200||d0.hi!=='500'||d0.vi!=='200')fail('縱斷面預設比例 '+JSON.stringify(d0));
if(d0.rows.includes('lt')||d0.rows.includes('rt'))fail('左右側高預設應不勾 '+d0.rows);
if(d0.rv.some(x=>x))fail('護岸頂/基礎線預設應不勾 '+d0.rv);
if(!/v[78]\.[0-9]/.test(d0.ver))fail('版本 '+d0.ver);
await pg.evaluate(t=>{applyProject(JSON.parse(t),'u.tcproj')},fs.readFileSync('/home/claude/u.tcproj','utf8'));await pg.waitForTimeout(3000);
const r=await pg.evaluate(()=>{const R=pkgMake({proj:'測試工程',agency:'測試機構',company:'測試顧問有限公司',pre:'A-',date:'115.11.06',parts:{merged:false}});
  const dec=s=>s.replace(/\\U\+([0-9A-F]{4})/g,(m,h)=>String.fromCharCode(parseInt(h,16)));
  const F=n=>R.files.find(f=>f.name.startsWith(n));const S=k=>R.sheets.find(s=>s.kind===k);
  const f1=dec(F(S('prof').lay).data),fl=dec(F(S('loc').lay).data),fi=dec(F(S('index').lay).data);
  return {first:R.sheets[0].kind,last:R.sheets[R.sheets.length-1].kind,prof:S('prof').scale,loc:S('loc').scale,
    tb:['測試機構','工程名稱：測試工程','測試顧問有限公司','圖名：縱斷面圖','技師執業圖記','設計單位公司章','圖號〔'].filter(t=>!f1.includes(t)),
    shx:/chineset\.shx/.test(f1)&&/romans\.shx/.test(f1),cp:/\$DWGCODEPAGE\n3\nANSI_950/.test(f1),
    lw:/\n370\n35\n/.test(f1),col:[...f1.matchAll(/\nAcDbLayerTableRecord\n2\n(?!PKG_VPORT)[^\n]+\n70\n-?\d+\n62\n(-?\d+)/g)].map(m=>m[1]).filter(c=>c!=='7'&&c!=='-7').length,
    loc:['工程位置','TWD97'].filter(t=>!fl.includes(t)),idx:['圖目錄'].filter(t=>!fi.includes(t)),
    files:R.files.length}});
if(r.first!=='index'||r.last!=='qty')fail('首末張 '+r.first+' '+r.last);
if(r.prof!=='X=1/500 Y=1/200')fail('縱斷面比例 '+r.prof);
if(r.tb.length)fail('標題欄缺 '+r.tb);
if(!r.shx||!r.cp)fail('字型 chineset.shx/ANSI_950 '+r.shx+' '+r.cp);
if(!r.lw||r.col)fail('黑白線寬 lw='+r.lw+' 非7色層='+r.col);
if(r.loc.length)fail('位置圖缺 '+r.loc);if(r.idx.length)fail('封面缺 '+r.idx);
console.log(JSON.stringify({d0,r}));console.log(errs.join('\n')||'noerr');await b.close();})();
