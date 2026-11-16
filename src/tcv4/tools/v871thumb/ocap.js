const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const L = [['/home/claude/tcv4/orig87/','anim','gvroad','rcbox','rcroad','rockc','steel','stepgs','tgb'],['/home/claude/tcv4/orig_st3/','comb','gs','slope']];
  for (const [dir, ...fs] of L) for (const f of fs) {
    const big = !['comb','slope'].includes(f);
    const pg = await b.newPage({ viewport: big ? { width: 2400, height: 1500 } : { width: 1600, height: 1000 }, deviceScaleFactor: big ? 1 : 2 });
    await pg.goto('file://' + dir + f + '.html'); await pg.waitForTimeout(1500);
    await pg.evaluate(() => { try { if (typeof toggleLayer === 'function') ['DIM','TEXT'].forEach(k => { if (document.getElementById('lyr_' + k)) toggleLayer(k); }); } catch (e) {}
      const d = document.getElementById('chkShowDim'); if (d && d.checked) { d.click(); } });
    await pg.waitForTimeout(600);
    const c = await pg.$('canvas'); const bb = await c.boundingBox(); console.log(f, bb.width, bb.height);
    await c.screenshot({ path: 'oc/' + f + '.png' });
    await pg.close();
  }
  await b.close();
})();
