const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const f of ['comb','slope']) {
    const pg = await b.newPage({ viewport: { width: 2400, height: 1500 } });
    await pg.goto('file:///home/claude/tcv4/orig_st3/' + f + '.html'); await pg.waitForTimeout(1500);
    await pg.evaluate(() => { const c = document.querySelector('canvas'), d = c.parentElement; d.style.cssText = 'position:fixed;left:0;top:0;width:2000px;height:1400px;z-index:99999;background:#0d1117'; window.dispatchEvent(new Event('resize')); });
    await pg.waitForTimeout(500);
    await pg.evaluate(() => { try { zoomToFit(); } catch (e) {} });
    await pg.waitForTimeout(800);
    const c = await pg.$('canvas'); const bb = await c.boundingBox(); console.log(f, bb);
    await c.screenshot({ path: 'oc/' + f + '.png' });
    await pg.close();
  }
  await b.close();
})();
