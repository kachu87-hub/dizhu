/* ============================================================================
   demmod.js（v7.3）：內政部 DEM 整合
   A. 大檔讀取＋記住 DEM 檔：GeoTIFF 只讀專案範圍（fromBlob 視窗讀取）、
      XYZ／CSV／ASC 逐段串流讀取；選過的 DEM 檔記在瀏覽器（IndexedDB 檔案代號），
      之後專案範圍沒有 DEM 或超出已擷取範圍時自動重新擷取。
   C. 斷面地面線區分實測／DEM：取樣點標 gsrc（'tin'｜'dem'｜'man'）；
      畫面 DEM 段橘色虛線、DXF DEM 段放 SEC_GROUND_DEM 圖層（DASHED2），
      出圖包橫斷面、縱斷面圖加註地形資料來源。
   G. 「國土測繪中心底圖・控制點」「DEM」卡片可收合，預設收起。
   H. 「地形線透明度」滑桿移到「國土測繪中心底圖・控制點」卡片。
   ============================================================================ */
const DEM = { handle: null, hname: '', perm: '', busy: false, skip: false, failKey: '', open: { bm: false, dem: false }, t: 0, lastSS: null };
try { const o = JSON.parse(localStorage.getItem('dizhu.demOpen') || 'null'); if (o) Object.assign(DEM.open, o); } catch (e) { }

/* ---------- A-1：記住 DEM 檔（File System Access API＋IndexedDB） ---------- */
function demIdb(mode, fn) {
  return new Promise((ok, no) => {
    let rq; try { rq = indexedDB.open('dizhu-dem', 1); } catch (e) { return no(e); }
    rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
    rq.onerror = () => no(rq.error);
    rq.onsuccess = () => { try { const tx = rq.result.transaction('kv', mode), st = tx.objectStore('kv'), r = fn(st); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => no(tx.error); } catch (e) { no(e); } };
  });
}
async function demHandleLoad() {
  try { const h = await demIdb('readonly', st => st.get('file')); if (h && h.getFile) { DEM.handle = h; DEM.hname = h.name; DEM.perm = await h.queryPermission({ mode: 'read' }); } } catch (e) { }
  demUI();
}
async function demHandleSave(h) { DEM.handle = h; DEM.hname = h ? h.name : ''; try { await demIdb('readwrite', st => h ? st.put(h, 'file') : st.delete('file')); } catch (e) { } }
const demCanPick = () => typeof window.showOpenFilePicker === 'function';
async function demPick() {   // 選 DEM 檔並記住（不支援時退回一般選檔）
  if (!demCanPick()) { const i = document.getElementById('demFileIn'); if (i) i.click(); return; }
  let h; try { [h] = await window.showOpenFilePicker({ types: [{ description: 'DEM（GeoTIFF／ASC／GRD／XYZ／CSV）', accept: { 'application/octet-stream': ['.tif', '.tiff', '.asc', '.grd', '.xyz', '.txt', '.csv'] } }] }); } catch (e) { return; }
  await demHandleSave(h); DEM.perm = 'granted'; DEM.skip = false; DEM.failKey = '';
  await dzDemLoad(await h.getFile());
}
async function demUseRemembered(gesture) {   // 用記住的檔重新擷取專案範圍
  const h = DEM.handle; if (!h || DEM.busy) return false;
  try {
    let p = await h.queryPermission({ mode: 'read' });
    if (p !== 'granted' && gesture) p = await h.requestPermission({ mode: 'read' });
    DEM.perm = p; if (p !== 'granted') { demUI(); return false; }
    DEM.skip = false; await dzDemLoad(await h.getFile(), !gesture); return !!state.dzDem;
  } catch (e) { updateStatus('⚠ 讀取記住的 DEM 檔失敗：' + e.message + '（檔案可能已移動，請重新選擇）'); return false; }
}
async function demForget() { await demHandleSave(null); DEM.perm = ''; demUI(); updateStatus('已不再記住 DEM 檔。'); }

/* 專案範圍（TWD97，不含外加 1 km）；沒有測點與中心線時回傳 null */
function demNeedBox() {
  const G = dzGeo(); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
  const add = (x, y) => { const t = G.f(x, y); if (!Number.isFinite(t.E)) return; n++; x0 = Math.min(x0, t.E); x1 = Math.max(x1, t.E); y0 = Math.min(y0, t.N); y1 = Math.max(y1, t.N); };
  (state.points || []).forEach(p => add(p.x, p.y)); (state.axisNodes || []).forEach(p => add(p.x, p.y)); (state.dzCases || []).forEach(c => (c.zone || []).concat(c.bl || []).forEach(p => add(p[0], p[1])));
  if (!n) return null;
  if (x0 < 140000 || x1 > 360000 || y0 < 2400000 || y1 > 2820000) return null;   // 不像 TWD97 TM2（台灣本島）就不自動擷取
  return { x0, y0, x1, y1 };
}
function demCovers(D, B) { if (!D || !B) return false; const e = 1; return D.x0 <= B.x0 + e && D.y0 <= B.y0 + e && D.x0 + D.dx * (D.nx - 1) >= B.x1 - e && D.y0 + D.dy * (D.ny - 1) >= B.y1 - e; }
function demAutoCheck() {   // 專案範圍沒有 DEM，或超出已擷取範圍 → 用記住的檔自動擷取
  clearTimeout(DEM.t);
  DEM.t = setTimeout(async () => {
    if (!DEM.handle || DEM.busy || DEM.skip || state.dzDemOn === false) return;
    const B = demNeedBox(); if (!B) return; if (state.dzDem && (state.dzDem.name !== DEM.hname || demCovers(state.dzDem, B))) return;
    const key = DEM.hname + '|' + [B.x0, B.y0, B.x1, B.y1].map(v => Math.round(v / 50)).join(','); if (key === DEM.failKey) return;
    if (DEM.perm !== 'granted') { try { DEM.perm = await DEM.handle.queryPermission({ mode: 'read' }); } catch (e) { } }
    if (DEM.perm !== 'granted') { demUI(); updateStatus(`ℹ 專案範圍需要 DEM：到「整治／底圖」的 DEM 卡片按「讀取 ${DEM.hname}」（瀏覽器要求每次開啟確認一次）。`); return; }
    DEM.failKey = key; const ok = await demUseRemembered(false); if (ok && state.dzDem && demCovers(state.dzDem, B)) DEM.failKey = '';
  }, 1200);
}
{ const _rb = rebuildAlignmentAndSections; rebuildAlignmentAndSections = function () { const r = _rb.apply(this, arguments); try { demMarkSources(); } catch (e) { console.warn(e); } if (DEM.handle) demAutoCheck(); return r; }; }
{ const _c = dzDemClear; dzDemClear = function () { DEM.skip = true; return _c.apply(this, arguments); }; }

/* ---------- A-2：大檔讀取 ---------- */
async function demEachLine(file, fn) {   // 逐行串流（不把整個檔讀進記憶體）
  const rd = file.stream().pipeThrough(new TextDecoderStream()).getReader(); let rest = '', n = 0, t0 = Date.now();
  for (; ;) {
    const { value, done } = await rd.read(); if (done) break;
    const L = (rest + value).split(/\r?\n/); rest = L.pop();
    for (const l of L) { if (fn(l) === false) { try { rd.cancel(); } catch (e) { } return; } }
    n += value.length; if (Date.now() - t0 > 400) { t0 = Date.now(); updateStatus(`⏳ 讀取 DEM「${file.name}」… ${Math.round(n / 1048576)} MB`); await new Promise(r => setTimeout(r, 0)); }
  }
  if (rest) fn(rest);
}
async function demXyzStream(file, BB) {
  const P = []; let sw = null;
  await demEachLine(file, l => {
    const a = l.trim().split(/[\s,;]+/); if (a.length < 3) return; let x = +a[0], y = +a[1]; const z = +a[2]; if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
    if (sw === null) sw = x > 1e6 && y < 1e6; if (sw) { const t = x; x = y; y = t; }   // N、E 順序互換
    if (x >= BB.x0 && x <= BB.x1 && y >= BB.y0 && y <= BB.y1 && z > -9000) P.push([x, y, z]);
  });
  return dzDemFrom(P, BB);
}
async function demAscStream(file, BB) {
  const H = {}; let hdr = true, nc = 0, nr = 0, cs = 0, xc = 0, yc = 0, nd = -9999, k = 0; const P = [];
  await demEachLine(file, l => {
    if (hdr) { const m = l.trim().match(/^([A-Za-z_]+)\s+(\S+)/); if (m && /^(ncols|nrows|xllcorner|yllcorner|xllcenter|yllcenter|cellsize|nodata_value|dx|dy)$/i.test(m[1])) { H[m[1].toLowerCase()] = parseFloat(m[2]); return; }
      hdr = false; nc = H.ncols; nr = H.nrows; cs = H.cellsize || H.dx; xc = H.xllcenter ?? (H.xllcorner + cs / 2); yc = H.yllcenter ?? (H.yllcorner + cs / 2); nd = H.nodata_value ?? -9999; }
    const t = l.trim(); if (!t) return;
    const tk = t.split(/\s+/);
    for (let i = 0; i < tk.length; i++, k++) { const r = Math.floor(k / nc), c = k - r * nc, y = yc + (nr - 1 - r) * cs; if (y < BB.y0 || y > BB.y1) continue; const x = xc + c * cs; if (x < BB.x0 || x > BB.x1) continue; const v = +tk[i]; if (Number.isFinite(v) && v !== nd) P.push([x, y, v]); }
    if (yc + (nr - 1 - Math.floor(k / nc)) * cs < BB.y0 - cs) return false;   // 往南已超出範圍，提早結束
  });
  return dzDemFrom(P, BB);
}
dzDemTiff = async function (file, BB) {   // 只讀範圍內的區塊（fromBlob），全台圖檔也可
  await dzLoadScript('https://cdn.jsdelivr.net/npm/geotiff@2.0.5');
  const tif = await GeoTIFF.fromBlob(file), img = await tif.getImage(), [ox, oy] = img.getOrigin(), [rx, ry] = img.getResolution(), W = img.getWidth(), H = img.getHeight(), nd = img.getGDALNoData();
  const c0 = Math.max(0, Math.floor((BB.x0 - ox) / rx)), c1 = Math.min(W, Math.ceil((BB.x1 - ox) / rx) + 1), r0 = Math.max(0, Math.floor((BB.y1 - oy) / ry)), r1 = Math.min(H, Math.ceil((BB.y0 - oy) / ry) + 1);
  if (c1 - c0 < 2 || r1 - r0 < 2) return null;
  if ((c1 - c0) * (r1 - r0) > 4e6) throw new Error('擷取範圍太大（超過 400 萬格）');
  const [band] = await img.readRasters({ window: [c0, r0, c1, r1], samples: [0] }), nx = c1 - c0, ny = r1 - r0, dx = Math.abs(rx), dy = Math.abs(ry), z = new Float32Array(nx * ny);
  for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) { const v = band[r * nx + c]; z[(ny - 1 - r) * nx + c] = (nd !== null && v === nd) || v < -9000 || !Number.isFinite(v) ? NaN : v; }
  return { x0: ox + (c0 + 0.5) * rx, y0: oy + (r1 - 0.5) * ry, dx, dy, nx, ny, z };
};
dzDemLoad = async function (file, quiet) {
  if (!file || DEM.busy) return; const nm = file.name, ext = (nm.split('.').pop() || '').toLowerCase(), BB = dzDemBBox();
  DEM.busy = true; updateStatus(`⏳ 讀取 DEM「${nm}」（只擷取專案範圍外加 1 km）…`);
  try {
    let D = null;
    if (ext === 'tif' || ext === 'tiff') D = await dzDemTiff(file, BB);
    else {
      const head = await file.slice(0, 256).text();
      if (/^\s*DSAA/.test(head)) D = dzDemGrd(await file.text(), BB);
      else if (/^\s*ncols/i.test(head)) D = await demAscStream(file, BB);
      else D = await demXyzStream(file, BB);
    }
    if (!D || D.nx < 2 || D.ny < 2) throw new Error('擷取範圍內沒有 DEM 資料（請確認座標系統為 TWD97 TM2，或先設好控制點）');
    D.name = nm; state.dzDem = D; state.dzDemOn = true; DEM.skip = false; dzPanelUI(); rebuildAlignmentAndSections(); requestRedraw();
    updateStatus(`✅ 已匯入 DEM「${nm}」：${D.nx}×${D.ny} 格、格距 ${dzF(D.dx, 1)} m，範圍 E ${dzF(D.x0, 0)}～${dzF(D.x0 + D.dx * (D.nx - 1), 0)}、N ${dzF(D.y0, 0)}～${dzF(D.y0 + D.dy * (D.ny - 1), 0)}。實測三角網以外的位置以 DEM 補注地面高程。`);
  } catch (e) { console.error(e); updateStatus('⚠ DEM 匯入失敗：' + e.message); if (!quiet) alert('DEM 匯入失敗：' + e.message); }
  finally { DEM.busy = false; }
};

/* ---------- C：斷面地面線來源 ---------- */
function demSrcAt(x, y) {   // 'tin'＝實測三角網內、'dem'＝DEM 補注、''＝其他（最近點內插等）
  if (!(state.dzDem && state.dzDemOn)) return 'tin';
  const X = dzTinIndex(), Pp = state.points; if (!X.B) return dzDemZ(x, y) !== null ? 'dem' : '';
  const L = X.B.get(Math.floor((y - X.y0) / X.cs) * X.nx + Math.floor((x - X.x0) / X.cs));
  if (L) for (const k of L) { const t = X.T[k], a = Pp[t.a], b = Pp[t.b], c = Pp[t.c]; if (!a || !b || !c) continue; const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y); if (Math.abs(det) < 1e-12) continue;
    const l1 = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / det, l2 = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / det; if (l1 >= -1e-4 && l2 >= -1e-4 && 1 - l1 - l2 >= -1e-4) return 'tin'; }
  return dzDemZ(x, y) !== null ? 'dem' : '';
}
function demMarkSources() {   // 每個取樣點標 gsrc；sec.demN＝DEM 取樣點數
  const on = !!(state.dzDem && state.dzDemOn);
  (state.sections || []).forEach(sec => {
    const S = sec.samples || []; sec.demN = 0;
    if (!on || sec.gvEdited || !Number.isFinite(sec.lx)) { S.forEach(s => { s.gsrc = sec.gvEdited ? 'man' : 'tin'; }); return; }
    const W = Math.hypot(sec.rx - sec.lx, sec.ry - sec.ly) || 1, ux = (sec.rx - sec.lx) / W, uy = (sec.ry - sec.ly) / W;
    S.forEach(s => { s.gsrc = demSrcAt(sec.cx + ux * s.offset, sec.cy + uy * s.offset); if (s.gsrc === 'dem') sec.demN++; });
    sec.demC = demSrcAt(sec.cx, sec.cy) === 'dem';
  });
}
function demRuns(S) {   // 依來源切段：[{dem, a, b}]（索引區間，相鄰兩點都是 DEM 才算 DEM 段）
  const R = []; for (let i = 0; i < S.length - 1; i++) { const d = S[i].gsrc === 'dem' && S[i + 1].gsrc === 'dem', L = R[R.length - 1]; if (L && L.dem === d) L.b = i + 1; else R.push({ dem: d, a: i, b: i + 1 }); } return R;
}
const demAnyOn = () => !!(state.dzDem && state.dzDemOn) && (state.sections || []).some(s => s.demN > 0);
const demInfo = () => { const D = state.dzDem; return !D ? '' : D.src === 'terr' ? 'SRTM 約 30 m 數值高程（AWS Terrarium，表面高程）' : `內政部 ${dzF(D.dx, 0)} m 數值地形模型（TWVD2001）`; };
function demStrokeGround(ctx, S, sx, sy) {   // 畫面：實測段沿用目前筆型；DEM 段橘色虛線
  const R = demRuns(S); if (!R.some(r => r.dem)) { S.forEach((s, i) => { i ? ctx.lineTo(sx(s.offset), sy(s.groundZ)) : ctx.moveTo(sx(s.offset), sy(s.groundZ)); }); ctx.stroke(); return; }
  const path = dem => { ctx.beginPath(); R.filter(r => r.dem === dem).forEach(r => { for (let i = r.a; i <= r.b; i++) { const s = S[i]; i === r.a ? ctx.moveTo(sx(s.offset), sy(s.groundZ)) : ctx.lineTo(sx(s.offset), sy(s.groundZ)); } }); ctx.stroke(); };
  path(false); ctx.save(); ctx.strokeStyle = 'rgba(251,146,60,0.95)'; ctx.setLineDash([5, 3]); path(true); ctx.restore();
}
/* 畫面橫斷面：右下角說明 */
{ const _d = drawSingleCrossSectionBox; drawSingleCrossSectionBox = function (sec, bx, by, bw, bh, isLarge) { const r = _d.apply(this, arguments);
    if (isLarge && sec && sec.demN > 0) { ctx.save(); ctx.font = '11px "Noto Sans TC"'; ctx.fillStyle = 'rgba(251,146,60,0.95)'; ctx.textAlign = 'right'; ctx.fillText(`橘色虛線＝無實測處取自 ${demInfo()}`, bx + bw - 10, by + bh - 10); ctx.restore(); }
    return r; }; }
/* DXF：地面線 DEM 段改放 SEC_GROUND_DEM（DASHED2） */
{ const _cs = secCropSamples; secCropSamples = function () { const r = _cs.apply(this, arguments); DEM.lastSS = r; return r; }; }
{ const _mk = makeDXFWriter; makeDXFWriter = function () {
    const D = _mk.apply(this, arguments), _p = D.poly.bind(D);
    D.poly = function (pts, layer, color, elev, closed, ltype) {
      const S = DEM.lastSS;
      if (layer === 'SEC_GROUND' && !closed && S && S.length === pts.length && S.some(s => s.gsrc === 'dem')) {
        const R = demRuns(S); if (R.some(r => r.dem)) { R.forEach(r => { const q = pts.slice(r.a, r.b + 1); if (r.dem) _p(q, 'SEC_GROUND_DEM', 8, elev, false, 'DASHED2'); else _p(q, layer, color, elev, false, ltype); }); return; }
      }
      return _p(pts, layer, color, elev, closed, ltype);
    };
    return D; }; }
/* 出圖包：橫斷面、縱斷面圖加註地形資料來源 */
function demNoteExtra(prev, txt, dy) {
  return (FD, FF) => { if (prev) prev(FD, FF); const q = lyPM(FD, FF), x = PKG_U.x0 + 4, y = PKG_U.y1 - 5 - (dy || 0); q.L(x, y + 1.2, x + 14, y + 1.2, 'SEC_GROUND_DEM', 'DASHED2'); q.T(x + 16, y, 2.8, txt, {}, 'PKG_LEGEND'); };
}
if (typeof lySecSheets === 'function') { const _s = lySecSheets; lySecSheets = function () { const r = _s.apply(this, arguments); if (demAnyOn()) r.forEach(s => { s.extra = demNoteExtra(s.extra, `地面線短虛線段：無實測處取自${demInfo()}；其餘為實測地形`, s.extra ? 15 : 0); }); return r; }; }
if (typeof lyProfSheets === 'function') { const _s = lyProfSheets; lyProfSheets = function () { const r = _s.apply(this, arguments); if (demAnyOn() && (state.sections || []).some(s => s.demC)) r.forEach(s => { const p = s.extra; s.extra = (FD, FF) => { if (p) p(FD, FF); lyPM(FD, FF).T(PKG_U.x0 + 4, PKG_U.y1 - 5, 2.8, `地面高程：無實測處取自${demInfo()}；其餘為實測地形`, {}, 'PKG_LEGEND'); }; }); return r; }; }

/* ---------- G＋H：卡片收合、地形線透明度移入底圖卡片、記住 DEM 檔的按鈕 ---------- */
function demSaveOpen() { try { localStorage.setItem('dizhu.demOpen', JSON.stringify(DEM.open)); } catch (e) { } }
function demUI() {
  const box = document.getElementById('dzMapBox'); if (!box) return;
  const cards = [...box.querySelectorAll(':scope > .sec-card')];
  cards.forEach(c => {
    const t = c.querySelector('.sec-title'); if (!t) return; const k = /DEM/.test(t.textContent) ? 'dem' : /底圖/.test(t.textContent) ? 'bm' : ''; if (!k) return;
    c.classList.add('demfold'); c.classList.toggle('folded', !DEM.open[k]);
    if (!t.dataset.demk) { t.dataset.demk = k; t.onclick = () => { DEM.open[k] = !DEM.open[k]; demSaveOpen(); c.classList.toggle('folded', !DEM.open[k]); }; }
    if (k === 'bm') {   // H：地形線透明度
      if (!DEM.terrRow) { const op = document.getElementById('terrOp'), row = op && op.closest('.chk-item'); if (row) { row.className = ''; row.style.cssText = 'display:flex;gap:6px;align-items:center;margin-top:4px;font-size:11px;'; op.style.width = ''; op.style.flex = '1'; DEM.terrRow = row; } }
      const row = DEM.terrRow; if (row && !c.contains(row)) { const rng = c.querySelector('input[type=range]'), at = rng && rng.parentElement; if (at) at.after(row); else c.appendChild(row); }
    }
    if (k === 'dem' && !c.querySelector('#demRemBox')) {   // A：記住 DEM 檔
      const fi = c.querySelector('input[type=file]'); if (fi) { fi.id = 'demFileIn'; if (demCanPick()) fi.style.display = 'none'; }
      const d = document.createElement('div'); d.id = 'demRemBox'; d.style.cssText = 'font-size:11px;margin-top:5px;line-height:1.6;';
      d.innerHTML = demCanPick()
        ? `<button class="btn" onclick="demPick()">📂 選擇 DEM 檔（記住，之後自動擷取）</button>${DEM.hname ? `<div>記住的檔：<b>${escAttr(DEM.hname)}</b>${DEM.perm === 'granted' ? '' : '（瀏覽器需確認一次）'}<br><button class="btn" onclick="demUseRemembered(true)">⟳ 讀取 ${escAttr(DEM.hname)}（重新擷取專案範圍）</button> <button class="btn" onclick="demForget()">不再記住</button></div>` : '<div style="color:var(--text-muted);">建議下載內政部全台 20 m DTM（data.gov.tw），選一次即可，之後各專案自動切出範圍。</div>'}`
        : '<div style="color:var(--text-muted);">此瀏覽器無法記住檔案（需 Chrome／Edge），每次請重新選檔；大檔仍只讀專案範圍。</div>';
      if (fi) fi.after(d); else c.appendChild(d);
    }
  });
}
{ const _m = dzMapUI; dzMapUI = function () {
    const row = DEM.terrRow; if (row && row.parentNode) row.remove();   // 先拿出來，避免重畫時被清掉
    const r = _m.apply(this, arguments); try { demUI(); } catch (e) { console.warn(e); } return r; }; }
(function () {
  const st = document.createElement('style');
  st.textContent = '#dzMapBox > .sec-card.demfold > .sec-title { cursor:pointer; user-select:none; } #dzMapBox > .sec-card.demfold > .sec-title > span:first-child::before { content:"▾ "; color:var(--text-muted); } #dzMapBox > .sec-card.demfold.folded > .sec-title > span:first-child::before { content:"▸ "; } #dzMapBox > .sec-card.demfold.folded > .sec-title { margin-bottom:0; } #dzMapBox > .sec-card.demfold.folded > :not(.sec-title) { display:none !important; }';
  document.head.appendChild(st);
  setTimeout(() => { try { demUI(); demHandleLoad(); } catch (e) { } }, 0);
})();
