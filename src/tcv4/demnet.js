/* ============================================================================
   demnet.js：內政部 20 m DTM 線上圖磚（免選檔）
   - 圖磚由 dem_tiles.py 從內政部全台 20 m DTM 切成 2 km × 2 km（DZT1 格式，gzip），
     放在公開 GitHub Pages（預設 https://kachu87-hub.github.io/dizhu-dem/）。
   - 有中心線時自動下載需要的圖磚，只保留「中心線兩側各 R m」（預設 50 m）。
   - 使用者自己選檔匯入的 DEM 優先，不會被線上 DEM 蓋掉。
   ============================================================================ */
const DNET = { base: 'https://kachu87-hub.github.io/dizhu-dem/', src: 'terr', on: true, R: 50, busy: false, key: '', fail: '', meta: null, cache: new Map(), t: 0, msg: '' };
try { const o = JSON.parse(localStorage.getItem('dizhu.demNet') || 'null'); if (o) ['base', 'src', 'on', 'R'].forEach(k => { if (o[k] !== undefined) DNET[k] = o[k]; }); } catch (e) { }
function dnetSave() { try { localStorage.setItem('dizhu.demNet', JSON.stringify({ base: DNET.base, src: DNET.src, on: DNET.on, R: DNET.R })); } catch (e) { } }
const dnetUrl = p => DNET.base.replace(/\/*$/, '/') + p;

/* 中心線（TWD97）折線：斷面中心依樁號排序；沒有斷面時用中心線節點 */
function dnetLine() {
  const G = dzGeo(), P = [];
  const S = (state.sections || []).filter(s => Number.isFinite(s.cx)).slice().sort((a, b) => a.sta - b.sta);
  (S.length >= 2 ? S.map(s => [s.cx, s.cy]) : (state.axisNodes || []).map(p => [p.x, p.y])).forEach(([x, y]) => { const t = G.f(x, y); if (Number.isFinite(t.E)) P.push([t.E, t.N]); });
  return P.length >= 2 ? P : null;
}
function dnetDist(P, x, y) { let m = Infinity; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2)) : 0, d = Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); if (d < m) m = d; } return m; }
function dnetKey(P) { return DNET.src + '|' + DNET.base + '|' + DNET.R + '|' + P.length + '|' + P.filter((p, i) => i % Math.max(1, Math.floor(P.length / 8)) === 0 || i === P.length - 1).map(p => Math.round(p[0]) + ',' + Math.round(p[1])).join(';'); }

async function dnetGz(buf) {   // 圖磚可能已被伺服器解壓（開頭就是 DZT1）
  const u = new Uint8Array(buf, 0, 4); if (u[0] === 68 && u[1] === 90 && u[2] === 84 && u[3] === 49) return buf;
  return await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
async function dnetTile(ix, iy) {
  const k = DNET.base + ix + '_' + iy; if (DNET.cache.has(k)) return DNET.cache.get(k);
  let T = null;
  const r = await fetch(dnetUrl(`t/${ix}_${iy}.dzt`), { cache: 'force-cache' });
  if (r.ok) { const b = await dnetGz(await r.arrayBuffer()), dv = new DataView(b); if (dv.getUint32(0, false) !== 0x445A5431) throw new Error('圖磚格式不符');
    T = { x0: dv.getFloat64(4, true), y0: dv.getFloat64(12, true), dx: dv.getFloat64(20, true), dy: dv.getFloat64(28, true), nx: dv.getUint32(36, true), ny: dv.getUint32(40, true), v: new Uint16Array(b.slice(44)) }; }
  else if (r.status !== 404) throw new Error(`下載圖磚失敗（HTTP ${r.status}）`);
  if (DNET.cache.size > 400) DNET.cache.clear(); DNET.cache.set(k, T); return T;
}
async function dnetMeta() {
  if (DNET.meta && DNET.meta.base === DNET.base) return DNET.meta;
  const r = await fetch(dnetUrl('meta.json'), { cache: 'no-cache' }); if (!r.ok) throw new Error(`連不到線上 DEM（${r.status}）：${DNET.base}`);
  const m = await r.json(); m.base = DNET.base; DNET.meta = m; return m;
}
/* Terrarium（AWS 公開高程圖磚，Web Mercator；台灣為 SRTM 約 30 m，表面高程）→ TWD97 規則格網 */
const DNET_TERR = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/';
async function dnetTerrTile(z, x, y) {
  const k = 'terr|' + z + '/' + x + '/' + y; if (DNET.cache.has(k)) return DNET.cache.get(k);
  const r = await fetch(`${DNET_TERR}${z}/${x}/${y}.png`, { cache: 'force-cache' }); let T = null;
  if (r.ok) { const bm = await createImageBitmap(await r.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }), cv = document.createElement('canvas'); cv.width = bm.width; cv.height = bm.height;
    const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(bm, 0, 0); const d = c.getImageData(0, 0, bm.width, bm.height).data, n = bm.width * bm.height, v = new Float32Array(n);
    for (let q = 0; q < n; q++) v[q] = d[q * 4] * 256 + d[q * 4 + 1] + d[q * 4 + 2] / 256 - 32768; T = { w: bm.width, h: bm.height, v }; }
  else if (r.status !== 404 && r.status !== 403) throw new Error(`下載 Terrarium 圖磚失敗（HTTP ${r.status}）`);
  if (DNET.cache.size > 400) DNET.cache.clear(); DNET.cache.set(k, T); return T;
}
async function dnetTerrGrid(box) {
  const Z = 13, n = 2 ** Z, dx = 15, gx0 = Math.floor(box.x0 / dx) * dx, gy0 = Math.floor(box.y0 / dx) * dx, nx = Math.floor((box.x1 - gx0) / dx) + 1, ny = Math.floor((box.y1 - gy0) / dx) + 1;
  if (nx * ny > 4e6) throw new Error('擷取範圍太大');
  const px = (E, N) => { const g = DZ_TM.inv(E, N), r = g.lat * Math.PI / 180; return [(g.lon + 180) / 360 * n * 256, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n * 256]; };
  const P = new Float64Array(nx * ny * 2), need = new Set();
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { if (!box.inside(gx0 + i * dx, gy0 + j * dx)) { P[(j * nx + i) * 2] = NaN; continue; } const [u, v] = px(gx0 + i * dx, gy0 + j * dx); P[(j * nx + i) * 2] = u; P[(j * nx + i) * 2 + 1] = v;
    for (const a of [-1, 1]) for (const b of [-1, 1]) need.add(Math.floor((u + a) / 256) + ',' + Math.floor((v + b) / 256)); }
  if (need.size > 60) throw new Error('中心線範圍太大（超過 60 塊圖磚）');
  updateStatus(`⏳ 下載 Terrarium 高程圖磚 ${need.size} 塊…`);
  const TT = new Map(); await Promise.all([...need].map(async k => { const [x, y] = k.split(',').map(Number); TT.set(k, await dnetTerrTile(Z, x, y)); }));
  const at = (u, v) => { const tx = Math.floor(u / 256), ty = Math.floor(v / 256), T = TT.get(tx + ',' + ty); if (!T) return NaN; return T.v[Math.min(T.h - 1, Math.floor(v - ty * 256)) * T.w + Math.min(T.w - 1, Math.floor(u - tx * 256))]; };
  const z = new Float32Array(nx * ny).fill(NaN);
  for (let q = 0; q < nx * ny; q++) { const u = P[q * 2] - 0.5, v = P[q * 2 + 1] - 0.5; if (!Number.isFinite(u)) continue; const i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
    const z00 = at(i, j), z10 = at(i + 1, j), z01 = at(i, j + 1), z11 = at(i + 1, j + 1); if (![z00, z10, z01, z11].every(Number.isFinite)) continue;
    const w = (z00 * (1 - a) + z10 * a) * (1 - b) + (z01 * (1 - a) + z11 * a) * b; if (w > -500) z[q] = w; }
  return { x0: gx0, y0: gy0, dx, dy: dx, nx, ny, z, tiles: TT.size, src: 'terr' };
}
async function dnetMoiGrid(box) {
  const M = await dnetMeta(), T = M.tile || 2000, { x0, y0, x1, y1 } = box;
  const need = []; for (let ix = Math.floor(x0 / T); ix <= Math.floor(x1 / T); ix++) for (let iy = Math.floor(y0 / T); iy <= Math.floor(y1 / T); iy++) need.push([ix, iy]);
  if (need.length > 120) throw new Error('中心線範圍太大（超過 120 塊圖磚）');
  updateStatus(`⏳ 下載內政部 20 m DTM 圖磚 ${need.length} 塊…`);
  const tiles = (await Promise.all(need.map(([ix, iy]) => dnetTile(ix, iy)))).filter(Boolean);
  if (!tiles.length) throw new Error('這個位置沒有線上 DEM 資料（座標須為 TWD97 TM2，或先設好控制點）');
  const dx = tiles[0].dx, dy = tiles[0].dy, ax = tiles[0].x0, ay = tiles[0].y0, gx0 = ax + Math.ceil((x0 - ax) / dx) * dx, gy0 = ay + Math.ceil((y0 - ay) / dy) * dy;
  const nx = Math.floor((x1 - gx0) / dx) + 1, ny = Math.floor((y1 - gy0) / dy) + 1; if (nx < 2 || ny < 2) throw new Error('範圍太小');
  if (nx * ny > 4e6) throw new Error('擷取範圍太大');
  const z = new Float32Array(nx * ny).fill(NaN);
  tiles.forEach(t => { for (let j = 0; j < t.ny; j++) { const gj = Math.round((t.y0 + j * t.dy - gy0) / dy); if (gj < 0 || gj >= ny) continue; for (let i = 0; i < t.nx; i++) { const gi = Math.round((t.x0 + i * t.dx - gx0) / dx); if (gi < 0 || gi >= nx) continue; const v = t.v[j * t.nx + i]; if (v) z[gj * nx + gi] = (v - 5000) / 10; } } });
  return { x0: gx0, y0: gy0, dx, dy, nx, ny, z, tiles: tiles.length, src: 'moi' };
}
const dnetSrcName = (src, dx) => src === 'terr' ? 'SRTM 約 30 m（AWS Terrarium，表面高程）' : `內政部 ${Math.round(dx)} m DTM`;
async function dnetLoad(force) {   // 依中心線兩側 R m 取得線上 DEM
  if (DNET.busy) return; const P = dnetLine(); if (!P) { if (force) updateStatus('⚠ 先畫中心線，才知道要取哪一段的 DEM。'); return; }
  const key = dnetKey(P); if (!force && (key === DNET.key || key === DNET.fail)) return;
  DNET.busy = true; DNET.msg = '下載中…'; demUI();
  try {
    const R = Math.max(5, +DNET.R || 50);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; P.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    const m = R + 60, box = { x0: x0 - m, y0: y0 - m, x1: x1 + m, y1: y1 + m, inside: (x, y) => dnetDist(P, x, y) <= R + 45 };
    const g = DNET.src === 'moi' ? await dnetMoiGrid(box) : await dnetTerrGrid(box), { dx, dy, nx, ny, z } = g, keep = R + Math.hypot(dx, dy);
    let n = 0; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (!Number.isFinite(z[k])) continue; if (dnetDist(P, g.x0 + i * dx, g.y0 + j * dy) > keep) z[k] = NaN; else n++; }
    if (n < 4) throw new Error('中心線兩側範圍內沒有 DEM 資料（座標須為 TWD97 TM2，或先設好控制點）');
    if (state.dzDem && !state.dzDem.net) throw new Error('已有自己匯入的 DEM，未套用線上 DEM');
    if (!DNET.on || dnetKey(dnetLine() || P) !== key) { DNET.msg = ''; return; }   // 下載期間已關閉或中心線已變
    const nm = dnetSrcName(g.src, dx);
    state.dzDem = { x0: g.x0, y0: g.y0, dx, dy, nx, ny, z, name: `${nm}（線上，中心線兩側 ${R} m）`, net: true, R, src: g.src };
    state.dzDemOn = true; DNET.key = key; DNET.fail = ''; DNET.msg = `✔ 已取得 ${n} 格（${g.tiles} 塊圖磚）`;
    dzPanelUI(); rebuildAlignmentAndSections(); requestRedraw();
    updateStatus(`✅ 已取得 ${nm}：中心線兩側 ${R} m，共 ${n} 格。實測三角網以外的位置以 DEM 補注地面高程。`);
  } catch (e) { console.warn(e); if (e instanceof TypeError) e = new Error(DNET.src === 'moi' ? `連不到線上 DEM（請確認網路，或資料來源網址 ${DNET.base} 是否正確）` : '連不到 Terrarium 高程圖磚（請確認網路）'); DNET.fail = key; DNET.msg = '⚠ ' + e.message; updateStatus('⚠ 線上 DEM：' + e.message); }
  finally { DNET.busy = false; demUI(); }
}
function dnetAuto() {   // 中心線變了就重取（使用者自己匯入的 DEM 優先）
  if (!DNET.on) return; const D = state.dzDem; if (D && !D.net) return; if (state.dzDemOn === false && D) return;
  clearTimeout(DNET.t); DNET.t = setTimeout(() => { const P = dnetLine(); if (P && dnetKey(P) !== DNET.key) dnetLoad(false); }, 1500);
}
{ const _rb = rebuildAlignmentAndSections; rebuildAlignmentAndSections = function () { const r = _rb.apply(this, arguments); try { dnetAuto(); } catch (e) { } return r; }; }
{ const _a = demAutoCheck; demAutoCheck = function () { if (DNET.on) return; return _a.apply(this, arguments); }; }   // 線上 DEM 開啟時，不用記住的檔
{ const _c = dzDemClear; dzDemClear = function () { const net = state.dzDem && state.dzDem.net; const r = _c.apply(this, arguments); if (net) { DNET.on = false; dnetSave(); DNET.key = ''; demUI(); } return r; }; }
function dnetSet(k, v) {
  if (k === 'on') { DNET.on = !!v; if (DNET.on && state.dzDem && !state.dzDem.net) { if (!confirm('目前已有自己匯入的 DEM，改用線上內政部 DEM 會取代它，確定？')) { DNET.on = false; demUI(); return; } state.dzDem = null; } }
  if (k === 'R') DNET.R = Math.max(5, Math.min(500, parseFloat(v) || 50));
  if (k === 'src') { DNET.src = v === 'moi' ? 'moi' : 'terr'; if (state.dzDem && state.dzDem.net) state.dzDem = null; }
  if (k === 'base') { DNET.base = String(v || '').trim() || 'https://kachu87-hub.github.io/dizhu-dem/'; DNET.meta = null; DNET.cache.clear(); }
  dnetSave(); DNET.key = ''; DNET.fail = ''; demUI(); if (DNET.on) dnetLoad(true);
}
{ const _u = demUI; demUI = function () {
    const r = _u.apply(this, arguments);
    const card = [...document.querySelectorAll('#dzMapBox > .sec-card.demfold')].find(c => /DEM/.test(c.querySelector('.sec-title').textContent)); if (!card) return r;
    let b = card.querySelector('#demNetBox'); if (!b) { b = document.createElement('div'); b.id = 'demNetBox'; b.style.cssText = 'font-size:11px;line-height:1.6;margin:4px 0 6px;padding:6px;border:1px solid var(--border-dim);border-radius:4px;'; const t = card.querySelector('.sec-title'); t.after(b); }
    const D = state.dzDem;
    b.innerHTML = `<label class="chk-item" style="font-weight:700;"><input type="checkbox" ${DNET.on ? 'checked' : ''} onchange="dnetSet('on',this.checked)"> 🌐 自動取得線上 DEM（免選檔）</label>
      <div style="display:flex;gap:6px;align-items:center;">來源 <select class="input-select" style="flex:1;" onchange="dnetSet('src',this.value)"><option value="terr"${DNET.src !== 'moi' ? ' selected' : ''}>SRTM 約 30 m（AWS Terrarium，可直接用）</option><option value="moi"${DNET.src === 'moi' ? ' selected' : ''}>內政部 20 m DTM（自架圖磚）</option></select></div>
      ${DNET.src !== 'moi' ? '<div style="color:#b45309;">注意：SRTM 是表面高程，森林區會量到樹頂、地面線偏高；高程只到整數公尺。僅供無實測時參考。</div>' : ''}
      <div style="display:flex;gap:6px;align-items:center;">範圍：中心線兩側 <input type="number" class="input-num" style="width:60px;" min="5" max="500" step="5" value="${DNET.R}" onchange="dnetSet('R',this.value)"> m <button class="btn" ${DNET.on ? '' : 'disabled'} onclick="dnetLoad(true)">⟳ 重新取得</button></div>
      <div style="color:var(--text-muted);">${DNET.busy ? '下載中…' : escAttr(DNET.msg || (D && D.net ? '✔ ' + D.name : DNET.on ? '畫好中心線後自動下載' : '已關閉'))}</div>
      ${DNET.src === 'moi' ? '' : '<!--'}<details style="margin-top:2px;"><summary style="cursor:pointer;color:var(--text-muted);">資料來源網址</summary><input class="input-text" style="width:100%;font-size:10.5px;" value="${escAttr(DNET.base)}" onchange="dnetSet('base',this.value)"><div style="color:var(--text-muted);">資料：內政部 20 公尺網格數值地形模型（政府資料開放授權條款第 1 版），TWD97 TM2、TWVD2001。</div></details>${DNET.src === 'moi' ? '' : '-->'}`;
    return r; }; }
setTimeout(() => { try { demUI(); } catch (e) { } }, 0);
