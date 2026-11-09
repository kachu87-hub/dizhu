const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();await pg.goto('file:///home/claude/tcv4/DiZhu_v8.5.html');await pg.waitForTimeout(1000);
console.log(JSON.stringify(await pg.evaluate(()=>TC_ORDER.filter(id=>tcType(id).cat==='rev').map(id=>{const d=tcDefaults(id);return [id,tcType(id).label,Object.keys(d).filter(k=>/b|top|t_|wt|B/i.test(k)).map(k=>k+'='+d[k]).join(' ')]})),null,0));await b.close();})();
