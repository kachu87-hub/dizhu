/* ============================================================================
   ctlmod.js：底圖控制點改良
   P1 三點以上最小平方套合（相似轉換），每點顯示誤差，可停用、刪除
   P2 在國土測繪中心地圖小視窗點選真實座標（疊上目前套合後的中心線、測點）
   P3 比例固定 1（只平移＋旋轉）；專案座標像 TWD97 時預設勾選
   P4 比例偏離 1 超過 2%、旋轉超過 5°、單點誤差超過 2 m 時警告
   另：線上 DEM 存專案時保留來源欄位（net、R、src）
   v8.6：C1 自動找出可能點錯的控制點、C2 地圖標出專案原位置（紫色◇）、C3 說明「地形不動、動的是底圖與 DEM」
   ============================================================================ */
const CTL = { key: '', G: null, RES: 2, map: null };
const ctlLooksTW = (x, y) => x > 140000 && x < 360000 && y > 2400000 && y < 2820000;
function ctlFix() {
  const b = state.dzBm || {}; if (b.fix1 !== undefined) return !!b.fix1;
  const c = (state.dzCtrl || []).find(c => c && Number.isFinite(c.px) && Number.isFinite(c.py)); if (c) return ctlLooksTW(c.px, c.py);
  const p = (state.points || [])[0]; return p ? ctlLooksTW(p.x, p.y) : false;
}
function ctlKeyNow() { let s = ctlFix() ? 'F' : 'S'; for (const c of state.dzCtrl || []) s += '|' + (c ? [c.px, c.py, c.mode, c.E, c.N, c.lat, c.lon, c.off ? 1 : 0].join(',') : ''); return s; }
dzGeo = function () {   // 專案座標 → TWD97：多點最小平方（相似或剛體）；未設定＝視為已是 TWD97
  const key = ctlKeyNow(); if (key === CTL.key && CTL.G) return CTL.G;
  const fix = ctlFix(), all = (state.dzCtrl || []).map((c, k) => ({ c, k, T: c && Number.isFinite(c.px) && Number.isFinite(c.py) ? dzCtrlTW(c) : null })).filter(o => o.T && Number.isFinite(o.T.E) && Number.isFinite(o.T.N));
  const use = all.filter(o => !o.c.off);
  let G;
  if (!use.length || (use.length < 2 && !fix)) G = { ok: false, fix, n: use.length, all, f: (x, y) => ({ E: x, N: y }), g: (E, N) => ({ x: E, y: N }) };
  else {
    const m = use.length, px = use.reduce((a, o) => a + o.c.px, 0) / m, py = use.reduce((a, o) => a + o.c.py, 0) / m, PE = use.reduce((a, o) => a + o.T.E, 0) / m, PN = use.reduce((a, o) => a + o.T.N, 0) / m;
    let sr = 0, si = 0, S = 0; use.forEach(o => { const ux = o.c.px - px, uy = o.c.py - py, X = o.T.E - PE, Y = o.T.N - PN; sr += ux * X + uy * Y; si += ux * Y - uy * X; S += ux * ux + uy * uy; });
    let cr = 1, ci = 0;
    if (S > 1e-9) { if (fix) { const h = Math.hypot(sr, si); if (h > 1e-12) { cr = sr / h; ci = si / h; } } else { cr = sr / S; ci = si / S; } }
    if (!fix && !(S > 1e-9)) G = { ok: false, fix, n: m, all, f: (x, y) => ({ E: x, N: y }), g: (E, N) => ({ x: E, y: N }) };
    else {
      const m2 = cr * cr + ci * ci;
      G = { ok: true, fix, n: m, all, s: Math.sqrt(m2), rot: Math.atan2(ci, cr) * 180 / Math.PI,
        f: (x, y) => { const u = x - px, v = y - py; return { E: PE + cr * u - ci * v, N: PN + ci * u + cr * v }; },
        g: (E, N) => { const u = E - PE, v = N - PN; return { x: px + (cr * u + ci * v) / m2, y: py + (-ci * u + cr * v) / m2 }; } };
    }
  }
  G.res = {}; let ss = 0, ns = 0;
  if (G.ok) all.forEach(o => { const t = G.f(o.c.px, o.c.py), d = Math.hypot(t.E - o.T.E, t.N - o.T.N); G.res[o.k] = d; if (!o.c.off) { ss += d * d; ns++; } });
  G.rms = ns ? Math.sqrt(ss / ns) : 0;
  G.warn = [];
  if (G.ok && !fix && Math.abs(G.s - 1) > 0.02) G.warn.push(`比例 ${G.s.toFixed(4)} 偏離 1 超過 2%（實測 DXF 多半已是 TWD97，可能有控制點填錯）`);
  if (G.ok && Math.abs(G.rot) > 5) G.warn.push(`旋轉 ${G.rot.toFixed(2)}° 超過 5°`);
  if (G.ok) all.forEach(o => { if (!o.c.off && G.res[o.k] > CTL.RES && G.n >= (fix ? 2 : 3)) G.warn.push(`點${o.k + 1} 誤差 ${G.res[o.k].toFixed(2)} m`); });
  CTL.key = key; CTL.G = G; return G;
};
function ctlAdd() { state.dzCtrl.push({}); dzMapUI(); }
function ctlDel(k) { state.dzCtrl.splice(k, 1); while (state.dzCtrl.length < 2) state.dzCtrl.push({}); ctlChanged(); }
function ctlOff(k, v) { const c = state.dzCtrl[k] || (state.dzCtrl[k] = {}); c.off = !!v; ctlChanged(); }
function ctlSetFix(v) { state.dzBm.fix1 = !!v; ctlChanged(); }
function ctlChanged() { DZ_TILE_KEY = ''; dzMapUI(); requestRedraw(); if (state.dzDem && state.dzDemOn) rebuildAlignmentAndSections(); }

/* ---------- v8.6 C1：誤差大時自動找出可能點錯的控制點 ----------
   1) 兩兩比對：真實座標距離 vs 專案座標距離（比例固定 1 時應相等）；找出彼此一致的最大點群，群外的點列為可疑
   2) 專案座標像 TWD97 時：真實座標落在測量範圍外多遠 */
function ctlBox() {
  const P = state.points || []; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { if (!Number.isFinite(x) || !Number.isFinite(y)) return; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
  P.forEach(p => add(p.x, p.y)); if (!(x1 > x0)) (state.axisNodes || []).forEach(p => add(p.x, p.y));
  return x1 > x0 ? { x0, y0, x1, y1 } : null;
}
function ctlOutDist(B, E, N) { if (!B) return 0; const dx = Math.max(B.x0 - E, 0, E - B.x1), dy = Math.max(B.y0 - N, 0, N - B.y1); return Math.hypot(dx, dy); }
function ctlDiag(G) {
  G = G || dzGeo(); const R = { bad: [], msg: [], out: {} };
  const use = (G.all || []).filter(o => !o.c.off); if (!G.ok || use.length < 2) return R;
  const big = use.some(o => (G.res[o.k] || 0) > CTL.RES); if (!big) return R;
  const B = ctlBox(), tw = B && ctlLooksTW((B.x0 + B.x1) / 2, (B.y0 + B.y1) / 2);
  if (tw) use.forEach(o => { const d = ctlOutDist(B, o.T.E, o.T.N); if (d > 30) R.out[o.k] = d; });
  const s = G.fix ? 1 : (G.s || 1), ok = (a, b) => { const dP = Math.hypot(a.c.px - b.c.px, a.c.py - b.c.py), dT = Math.hypot(a.T.E - b.T.E, a.T.N - b.T.N); return Math.abs(dT - s * dP) <= Math.max(CTL.RES, 0.02 * dT); };
  const n = use.length; let best = null;
  if (n <= 10) for (let m = 1; m < (1 << n); m++) {   // 最大一致點群（點數少，直接窮舉）
    const S = use.filter((o, i) => m & (1 << i)); if (S.length < 2) continue;
    let good = true; for (let i = 0; i < S.length && good; i++) for (let j = i + 1; j < S.length; j++) if (!ok(S[i], S[j])) { good = false; break; }
    if (!good) continue; const outN = S.filter(o => R.out[o.k]).length, sc = S.length * 100 - outN;
    if (!best || sc > best.sc) best = { S, sc };
  }
  const inBest = new Set(best ? best.S.map(o => o.k) : []);
  let bad = best && best.S.length >= 2 && best.S.length < n ? use.filter(o => !inBest.has(o.k)).map(o => o.k) : [];
  if (!bad.length) bad = Object.keys(R.out).map(Number);   // 點群判斷不出來時，以超出測量範圍者為準
  if (!bad.length && n === 2 && !ok(use[0], use[1])) { const [a, b] = use, dP = Math.hypot(a.c.px - b.c.px, a.c.py - b.c.py), dT = Math.hypot(a.T.E - b.T.E, a.T.N - b.T.N);
    R.msg.push(`點${a.k + 1}、點${b.k + 1} 的真實距離 ${dT.toFixed(1)} m，專案座標距離 ${dP.toFixed(1)} m，差 ${Math.abs(dT - s * dP).toFixed(1)} m：其中至少一點點錯`); }
  R.bad = bad.sort((a, b) => a - b);
  if (R.bad.length) R.msg.unshift(`可能點錯：${R.bad.map(k => '點' + (k + 1)).join('、')}${best && best.S.length >= 2 && best.S.length < n ? `（其餘 ${best.S.map(o => '點' + (o.k + 1)).join('、')} 彼此距離一致）` : ''}`);
  Object.entries(R.out).forEach(([k, d]) => R.msg.push(`點${+k + 1} 的真實座標在測量範圍外約 ${d.toFixed(0)} m`));
  if (R.bad.length) R.msg.push('建議：按 🗺 重新點選這幾點（地圖上的紫色◇是該點在專案中的原位置），或先停用再看誤差');
  return R;
}
function ctlOffBad() { const R = ctlDiag(); if (!R.bad.length) return; R.bad.forEach(k => { (state.dzCtrl[k] || (state.dzCtrl[k] = {})).off = true; }); ctlChanged(); updateStatus(`已停用可疑控制點：${R.bad.map(k => '點' + (k + 1)).join('、')}（取消勾選「停用」即可恢復）`); }

/* ---------- 控制點表格（取代原本兩點表格） ---------- */
function ctlTableHTML() {
  const G = dzGeo(), f = v => (Number.isFinite(v) ? v : '');
  const inp = (k, fld, v, st, ph) => `<input type="number" class="input-num" style="width:100%;" step="${st}" placeholder="${ph}" value="${f(v)}" onchange="dzSetCtrl(${k},'${fld}',this.value)">`;
  const DG = ctlDiag(G), rows = state.dzCtrl.map((c, k) => { c = c || {}; const ll = c.mode === 'll', r = G.res[k], bad = Number.isFinite(r) && r > CTL.RES && !c.off, sus = DG.bad.includes(k);
    return `<tr style="${c.off ? 'opacity:.45;' : ''}"><td style="white-space:nowrap;">點${k + 1}<br><button class="btn" style="padding:1px 5px;" onclick="dzPickCtrl(${k})" title="在平面圖點選專案座標">📍</button></td>
      <td>${inp(k, 'px', c.px, 0.001, '專案 X')}<br>${inp(k, 'py', c.py, 0.001, '專案 Y')}</td>
      <td><div style="display:flex;gap:3px;"><select class="input-select" style="flex:1;" onchange="dzSetCtrl(${k},'mode',this.value)"><option value="tw"${ll ? '' : ' selected'}>TWD97</option><option value="ll"${ll ? ' selected' : ''}>經緯度</option></select><button class="btn" style="padding:1px 5px;" onclick="ctlMapPick(${k})" title="在國土測繪中心地圖上點選真實座標">🗺</button></div>
        ${ll ? inp(k, 'lat', c.lat, 0.000001, '緯度') + '<br>' + inp(k, 'lon', c.lon, 0.000001, '經度') : inp(k, 'E', c.E, 0.001, 'E (TWD97)') + '<br>' + inp(k, 'N', c.N, 0.001, 'N (TWD97)')}</td>
      <td style="text-align:center;white-space:nowrap;font-size:10.5px;"><span style="color:${bad ? '#dc2626' : 'inherit'};font-weight:${bad ? 700 : 400};">${Number.isFinite(r) ? r.toFixed(2) + ' m' : '－'}</span>${sus ? '<br><span class="ctl-sus" style="color:#fff;background:#dc2626;border-radius:3px;padding:0 3px;" title="與其他控制點距離對不上，可能點錯">可能點錯</span>' : ''}<br>
        <label title="停用（不參與套合）"><input type="checkbox" ${c.off ? 'checked' : ''} onchange="ctlOff(${k},this.checked)">停用</label><br><button class="btn" style="padding:0 5px;" onclick="ctlDel(${k})" title="刪除這個控制點">✕</button></td></tr>`; }).join('');
  return `<thead><tr><th></th><th>專案 X／Y</th><th>真實座標</th><th>誤差</th></tr></thead><tbody>${rows}</tbody>`;
}
function ctlSummaryHTML() {
  const G = dzGeo(), fix = ctlFix(), DG = ctlDiag(G);
  const msg = G.ok ? `✔ 已定位（${G.n} 點${fix ? '，比例固定 1' : ''}）：比例 ${dzF(G.s, 6)}、旋轉 ${dzF(G.rot, 4)}°、均方根誤差 ${G.rms.toFixed(2)} m。` : `未設定控制點時，專案座標視為 TWD97 TM2（實測 DXF 多已是 TWD97）。${fix ? '比例固定 1 時，1 點即可平移；2 點以上可再求旋轉。' : '至少 2 點；3 點以上用最小平方套合並算出各點誤差。'}`;
  return `<div style="display:flex;gap:6px;align-items:center;margin-top:4px;font-size:11px;"><button class="btn" onclick="ctlAdd()">＋ 新增控制點</button><label class="chk-item" title="只平移＋旋轉，不縮放；實測 DXF 已是 TWD97 時建議勾選"><input type="checkbox" ${fix ? 'checked' : ''} onchange="ctlSetFix(this.checked)"> 比例固定 1</label></div>
    <div style="font-size:10.5px;line-height:1.55;margin-top:4px;color:${G.ok ? '#047857' : 'var(--text-muted)'};">${msg}由控制點計算旋轉${fix ? '' : '＋縮放'}＋平移，底圖與 DEM 依此套合。</div>
    ${G.warn.length ? `<div style="font-size:10.5px;line-height:1.55;margin-top:3px;color:#b45309;font-weight:700;">⚠ ${G.warn.map(escAttr).join('<br>⚠ ')}</div>` : ''}
    ${DG.msg.length ? `<div id="ctlDiag" style="font-size:10.5px;line-height:1.55;margin-top:3px;color:#dc2626;font-weight:700;">🔍 ${DG.msg.map(escAttr).join('<br>🔍 ')}${DG.bad.length ? ' <button class="btn" style="padding:0 6px;font-weight:400;" onclick="ctlOffBad()">停用可疑點</button>' : ''}</div>` : ''}
    <div id="ctlNote" style="font-size:10.5px;line-height:1.55;margin-top:4px;padding:4px 6px;border-left:3px solid #0891b2;background:rgba(8,145,178,.08);">ℹ 地形、測點、中心線與所有設計都留在原座標，<b>不會移動</b>；控制點只決定<b>底圖（地圖影像）與線上 DEM</b> 要怎麼平移、旋轉才能疊到地形上。所以套合後，畫面上會動的是底圖與 DEM。</div>`;
}
function ctlUI() {
  const box = document.getElementById('dzMapBox'); if (!box) return;
  const card = [...box.querySelectorAll(':scope > .sec-card')].find(c => /底圖/.test((c.querySelector('.sec-title') || {}).textContent || '')); if (!card) return;
  const tb = card.querySelector('table.pt-table'); if (!tb) return;
  if (tb.contains(document.activeElement)) return;
  tb.innerHTML = ctlTableHTML();
  let n = tb.nextElementSibling; if (n && !n.id && /TWD97|定位/.test(n.textContent)) n.remove();
  let s = card.querySelector('#ctlSum'); if (!s) { s = document.createElement('div'); s.id = 'ctlSum'; tb.after(s); }
  s.innerHTML = ctlSummaryHTML();
}
{ const _m = dzMapUI; dzMapUI = function () { const r = _m.apply(this, arguments); try { ctlUI(); } catch (e) { console.warn(e); } return r; }; }

/* ---------- P2：地圖小視窗點選真實座標 ---------- */
function ctlRawOK() { const B = ctlBox(); return !!B && ctlLooksTW((B.x0 + B.x1) / 2, (B.y0 + B.y1) / 2); }   // 專案座標本身像 TWD97，原位置才有意義
const CTL_LAYERS = [['EMAP', '臺灣通用電子地圖'], ['PHOTO2', '正射影像'], ['EMAP5', '電子地圖（等高線）']];
function ctlMercator(lat, lon, z) { const n = 256 * 2 ** z, r = lat * Math.PI / 180; return { X: (lon + 180) / 360 * n, Y: (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n }; }
function ctlUnMercator(X, Y, z) { const n = 256 * 2 ** z; return { lon: X / n * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * Y / n))) * 180 / Math.PI }; }
function ctlMapPick(k) {
  const c = state.dzCtrl[k] || (state.dzCtrl[k] = {}), G = dzGeo();
  let E, N; const T = dzCtrlTW(c);
  if (T && Number.isFinite(T.E)) { E = T.E; N = T.N; }
  else if (Number.isFinite(c.px)) { const t = ctlRawOK() ? { E: c.px, N: c.py } : G.f(c.px, c.py); E = t.E; N = t.N; }
  else { const B = dzDemBBox(); E = (B.x0 + B.x1) / 2; N = (B.y0 + B.y1) / 2; }
  if (!ctlLooksTW(E, N)) { E = 250000; N = 2650000; }
  const ov = document.createElement('div'); ov.id = 'ctlMapOv';
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;';
  ov.innerHTML = `<div style="background:var(--bg-panel,#fff);color:var(--text,#111);width:min(1100px,94vw);height:min(760px,90vh);display:flex;flex-direction:column;border-radius:6px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.4);">
    <div style="display:flex;gap:8px;align-items:center;padding:6px 10px;font-size:12px;flex-wrap:wrap;border-bottom:1px solid var(--border-dim,#ccc);">
      <b>🗺 控制點 ${k + 1}：在地圖上點選真實位置</b>
      <select id="ctlMapLy" class="input-select">${CTL_LAYERS.map(([a, b]) => `<option value="${a}">${b}</option>`).join('')}</select>
      <span>前往 E <input id="ctlGoE" class="input-num" style="width:90px;" type="number"> N <input id="ctlGoN" class="input-num" style="width:100px;" type="number"> <button class="btn" id="ctlGo">前往</button></span>
      <button class="btn" id="ctlZi">＋</button><button class="btn" id="ctlZo">－</button>
      <button class="btn" id="ctlRaw" title="移到此控制點在專案中的原位置（專案座標直接當 TWD97）">◇ 原位置</button>
      <label class="chk-item" title="以紫色顯示測點、中心線在專案座標的原位置（不經套合）"><input type="checkbox" id="ctlRawOv" checked> 疊原座標</label>
      <span id="ctlRead" style="font-family:monospace;margin-left:auto;"></span></div>
    <div style="position:relative;flex:1;"><canvas id="ctlMapCv" style="position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;"></canvas></div>
    <div style="display:flex;gap:8px;align-items:center;padding:6px 10px;font-size:12px;border-top:1px solid var(--border-dim,#ccc);">
      <span id="ctlPick" style="flex:1;">拖曳平移、滾輪縮放；點一下選取位置。<span style="color:#0891b2;">青色</span>＝目前套合後的中心線／測點，<span style="color:#a855f7;">紫色◇</span>＝在專案中的原位置（請點到同一個地物），<span style="color:#dc2626;">紅色</span>＝各控制點的真實座標。</span>
      <button class="btn" id="ctlCancel">取消</button><button class="btn magenta" id="ctlOk" disabled>✔ 套用這個位置</button></div></div>`;
  document.body.appendChild(ov);
  const cv = ov.querySelector('#ctlMapCv'), ctx2 = cv.getContext('2d'), M = { k, z: 18, lat: 0, lon: 0, pick: null, tiles: new Map(), drag: null };
  { const g = DZ_TM.inv(E, N); M.lat = g.lat; M.lon = g.lon; }
  CTL.map = M;
  const size = () => { const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); M.w = r.width; M.h = r.height; M.d = d; };
  const toScr = (lat, lon) => { const a = ctlMercator(M.lat, M.lon, M.z), b = ctlMercator(lat, lon, M.z); return { x: M.w / 2 + b.X - a.X, y: M.h / 2 + b.Y - a.Y }; };
  const toLL = (x, y) => { const a = ctlMercator(M.lat, M.lon, M.z); return ctlUnMercator(a.X + x - M.w / 2, a.Y + y - M.h / 2, M.z); };
  const twScr = (E, N) => { const g = DZ_TM.inv(E, N); return toScr(g.lat, g.lon); };
  const tile = (z, x, y, L) => { const u = `https://wmts.nlsc.gov.tw/wmts/${L}/default/GoogleMapsCompatible/${z}/${y}/${x}`; let t = M.tiles.get(u); if (t) return t; const im = new Image(); t = { im, ok: false }; im.crossOrigin = 'anonymous'; im.onload = () => { t.ok = true; draw(); }; im.onerror = () => { t.bad = true; }; im.src = u; M.tiles.set(u, t); return t; };
  function draw() {
    if (!document.body.contains(cv)) return; ctx2.setTransform(M.d, 0, 0, M.d, 0, 0); ctx2.fillStyle = '#e5e7eb'; ctx2.fillRect(0, 0, M.w, M.h);
    const L = ov.querySelector('#ctlMapLy').value, a = ctlMercator(M.lat, M.lon, M.z), x0 = Math.floor((a.X - M.w / 2) / 256), x1 = Math.floor((a.X + M.w / 2) / 256), y0 = Math.floor((a.Y - M.h / 2) / 256), y1 = Math.floor((a.Y + M.h / 2) / 256);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) { const t = tile(M.z, x, y, L), sx = M.w / 2 + x * 256 - a.X, sy = M.h / 2 + y * 256 - a.Y; if (t.ok) ctx2.drawImage(t.im, sx, sy, 256, 256); else { ctx2.strokeStyle = '#cbd5e1'; ctx2.strokeRect(sx, sy, 256, 256); } }
    const Gc = dzGeo(), P = p => { const t = Gc.f(p[0], p[1]); return twScr(t.E, t.N); };
    ctx2.save(); ctx2.strokeStyle = 'rgba(8,145,178,0.95)'; ctx2.fillStyle = 'rgba(8,145,178,0.9)'; ctx2.lineWidth = 2;
    const S = (state.sections || []).filter(s => Number.isFinite(s.cx)).slice().sort((p, q) => p.sta - q.sta);
    const line = S.length >= 2 ? S.map(s => [s.cx, s.cy]) : (state.axisNodes || []).map(p => [p.x, p.y]);
    if (line.length >= 2) { ctx2.beginPath(); line.forEach((p, i) => { const s = P(p); i ? ctx2.lineTo(s.x, s.y) : ctx2.moveTo(s.x, s.y); }); ctx2.stroke(); }
    const pts = state.points || [], st = Math.max(1, Math.floor(pts.length / 1500)); for (let i = 0; i < pts.length; i += st) { const s = P([pts[i].x, pts[i].y]); if (s.x < -5 || s.y < -5 || s.x > M.w + 5 || s.y > M.h + 5) continue; ctx2.fillRect(s.x - 1, s.y - 1, 2, 2); }
    ctx2.restore();
    const rawTW = ctlRawOK(), rawOv = ov.querySelector('#ctlRawOv');
    if (rawTW && rawOv && rawOv.checked) {   // v8.6 C2：原座標（不經套合）疊圖，紫色
      ctx2.save(); ctx2.strokeStyle = 'rgba(168,85,247,0.85)'; ctx2.fillStyle = 'rgba(168,85,247,0.8)'; ctx2.lineWidth = 1.6; ctx2.setLineDash([6, 4]);
      if (line.length >= 2) { ctx2.beginPath(); line.forEach((p, i) => { const s = twScr(p[0], p[1]); i ? ctx2.lineTo(s.x, s.y) : ctx2.moveTo(s.x, s.y); }); ctx2.stroke(); }
      ctx2.setLineDash([]); for (let i = 0; i < pts.length; i += st) { const s = twScr(pts[i].x, pts[i].y); if (s.x < -5 || s.y < -5 || s.x > M.w + 5 || s.y > M.h + 5) continue; ctx2.fillRect(s.x - 1, s.y - 1, 2, 2); }
      ctx2.restore(); }
    if (rawTW) (state.dzCtrl || []).forEach((c, j) => { if (!c || !Number.isFinite(c.px)) return; const s = twScr(c.px, c.py), cur = j === M.k, r = cur ? 10 : 7;
      ctx2.save(); ctx2.strokeStyle = '#a855f7'; ctx2.fillStyle = cur ? 'rgba(168,85,247,0.25)' : 'transparent'; ctx2.lineWidth = cur ? 3 : 2; ctx2.beginPath(); ctx2.moveTo(s.x, s.y - r); ctx2.lineTo(s.x + r, s.y); ctx2.lineTo(s.x, s.y + r); ctx2.lineTo(s.x - r, s.y); ctx2.closePath(); ctx2.fill(); ctx2.stroke();
      ctx2.font = 'bold 12px "Noto Sans TC"'; ctx2.fillStyle = '#a855f7'; ctx2.fillText(`${j + 1}${cur ? ' 原位置' : ''}`, s.x + r + 3, s.y + 4); ctx2.restore(); });
    (state.dzCtrl || []).forEach((c, j) => { if (!c) return; const T = dzCtrlTW(c); ctx2.save(); ctx2.font = 'bold 12px "Noto Sans TC"';
      if (Number.isFinite(c.px)) { const s = P([c.px, c.py]); ctx2.strokeStyle = '#0891b2'; ctx2.lineWidth = 2; ctx2.beginPath(); ctx2.arc(s.x, s.y, 6, 0, 7); ctx2.stroke(); ctx2.fillStyle = '#0891b2'; ctx2.fillText(`${j + 1}`, s.x + 8, s.y + 12);
        if (T && Number.isFinite(T.E)) { const r = twScr(T.E, T.N); ctx2.setLineDash([4, 3]); ctx2.beginPath(); ctx2.moveTo(s.x, s.y); ctx2.lineTo(r.x, r.y); ctx2.stroke(); ctx2.setLineDash([]); } }
      if (T && Number.isFinite(T.E)) { const r = twScr(T.E, T.N); ctx2.strokeStyle = '#dc2626'; ctx2.lineWidth = 2; ctx2.beginPath(); ctx2.moveTo(r.x - 7, r.y); ctx2.lineTo(r.x + 7, r.y); ctx2.moveTo(r.x, r.y - 7); ctx2.lineTo(r.x, r.y + 7); ctx2.stroke(); ctx2.fillStyle = '#dc2626'; ctx2.fillText(`${j + 1}`, r.x + 8, r.y - 6); }
      ctx2.restore(); });
    if (M.pick) { const s = twScr(M.pick.E, M.pick.N); ctx2.save(); ctx2.strokeStyle = '#f59e0b'; ctx2.lineWidth = 3; ctx2.beginPath(); ctx2.arc(s.x, s.y, 9, 0, 7); ctx2.moveTo(s.x - 14, s.y); ctx2.lineTo(s.x + 14, s.y); ctx2.moveTo(s.x, s.y - 14); ctx2.lineTo(s.x, s.y + 14); ctx2.stroke(); ctx2.restore(); }
    ctx2.save(); ctx2.font = '10px sans-serif'; ctx2.fillStyle = 'rgba(0,0,0,.7)'; ctx2.fillText('底圖：國土測繪中心', 6, M.h - 6); ctx2.restore();
  }
  const close = () => { ov.remove(); CTL.map = null; window.removeEventListener('resize', onRs); };
  const onRs = () => { size(); draw(); }; window.addEventListener('resize', onRs);
  cv.addEventListener('pointerdown', e => { M.drag = { x: e.clientX, y: e.clientY, a: ctlMercator(M.lat, M.lon, M.z), moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(), ll = toLL(e.clientX - r.left, e.clientY - r.top), t = DZ_TM.fwd(ll.lat, ll.lon); ov.querySelector('#ctlRead').textContent = `E ${t.E.toFixed(2)}  N ${t.N.toFixed(2)}`;
    if (!M.drag) return; const dx = e.clientX - M.drag.x, dy = e.clientY - M.drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) M.drag.moved = true; if (M.drag.moved) { const g = ctlUnMercator(M.drag.a.X - dx, M.drag.a.Y - dy, M.z); M.lat = g.lat; M.lon = g.lon; draw(); } });
  cv.addEventListener('pointerup', e => { const d = M.drag; M.drag = null; if (d && !d.moved) { const r = cv.getBoundingClientRect(), ll = toLL(e.clientX - r.left, e.clientY - r.top), t = DZ_TM.fwd(ll.lat, ll.lon); M.pick = { E: +t.E.toFixed(2), N: +t.N.toFixed(2) };
    ov.querySelector('#ctlPick').textContent = `已選：E ${M.pick.E.toFixed(2)}、N ${M.pick.N.toFixed(2)}（可再點一次修正）`; ov.querySelector('#ctlOk').disabled = false; draw(); } });
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, ll = toLL(mx, my), nz = Math.max(8, Math.min(20, M.z + (e.deltaY < 0 ? 1 : -1))); if (nz === M.z) return; M.z = nz;
    const b = ctlMercator(ll.lat, ll.lon, M.z), g = ctlUnMercator(b.X - mx + M.w / 2, b.Y - my + M.h / 2, M.z); M.lat = g.lat; M.lon = g.lon; draw(); }, { passive: false });
  ov.querySelector('#ctlZi').onclick = () => { M.z = Math.min(20, M.z + 1); draw(); };
  ov.querySelector('#ctlZo').onclick = () => { M.z = Math.max(8, M.z - 1); draw(); };
  ov.querySelector('#ctlMapLy').onchange = draw;
  ov.querySelector('#ctlRawOv').onchange = draw;
  { const rb = ov.querySelector('#ctlRaw'); if (!ctlRawOK() || !Number.isFinite(c.px)) rb.disabled = true;
    rb.onclick = () => { if (!Number.isFinite(c.px)) return; const g = DZ_TM.inv(c.px, c.py); M.lat = g.lat; M.lon = g.lon; M.z = Math.max(M.z, 18); draw(); }; }
  ov.querySelector('#ctlGo').onclick = () => { const e1 = parseFloat(ov.querySelector('#ctlGoE').value), n1 = parseFloat(ov.querySelector('#ctlGoN').value); if (!ctlLooksTW(e1, n1)) { alert('請輸入台灣本島範圍的 TWD97 座標'); return; } const g = DZ_TM.inv(e1, n1); M.lat = g.lat; M.lon = g.lon; M.pick = { E: e1, N: n1 }; ov.querySelector('#ctlOk').disabled = false; draw(); };
  ov.querySelector('#ctlCancel').onclick = close;
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  ov.querySelector('#ctlOk').onclick = () => { if (!M.pick) return; const c2 = state.dzCtrl[k] || (state.dzCtrl[k] = {}); c2.mode = 'tw'; c2.E = M.pick.E; c2.N = M.pick.N; close(); ctlChanged(); updateStatus(`✔ 控制點 ${k + 1} 真實座標：E ${M.pick.E.toFixed(2)}、N ${M.pick.N.toFixed(2)}（地圖點選）`); };
  M.draw = draw; M.toScr = toScr; M.toLL = toLL;
  setTimeout(() => { size(); draw(); }, 0);
}

/* ---------- 存檔／載入：多點控制點、線上 DEM 來源 ---------- */
{ const _cp = collectProject; collectProject = function () { const o = _cp.apply(this, arguments); try { const D = state.dzDem, Z = o && o.data && o.data.dz; if (Z) { Z.ctrl = state.dzCtrl; if (D && D.net) Z.dem = null; /* 線上 DEM 不存格網，載入後依線上設定自動重抓（檔案小、載入不判為修改） */ } } catch (e) { } return o; }; }
{ const _ap = applyProject; applyProject = function (obj) {
    const r = _ap.apply(this, arguments);
    try { const Z = (obj && obj.data && obj.data.dz) || {};
      if (Array.isArray(Z.ctrl) && Z.ctrl.length > 2) { state.dzCtrl = Z.ctrl; DZ_TILE_KEY = ''; }
      if (state.dzDem && Z.dem) ['net', 'R', 'src'].forEach(k => { if (Z.dem[k] !== undefined) state.dzDem[k] = Z.dem[k]; });
      if (typeof DNET !== 'undefined') { DNET.key = ''; if (!state.dzDem) dnetAuto(); }
      dzMapUI(); } catch (e) { console.warn(e); }
    return r; }; }

/* v8.4：線上 DEM 是在載入後才抓到的參考資料，抓到前若內容與存檔相同，抓到後仍視為「未修改」 */
{ const _dl = dnetLoad; dnetLoad = async function () {
    let pre = null; try { if (typeof ASV !== 'undefined' && ASV.base && !asvEmpty() && asvJson().sig === ASV.base) pre = ASV.base; } catch (e) { }
    const r = await _dl.apply(this, arguments);
    if (pre) setTimeout(() => { try { if (ASV.base === pre) asvMarkClean(); } catch (e) { } }, 300);
    return r; }; }
