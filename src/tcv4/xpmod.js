/* ============================================================================
   v7.1 平面圖斷面微調（C1／C2／A5）＋加樁管理（B1／B2／B4）
   C1 平面圖點樁號文字或斷面線＝選取該樁並開啟「斷面微調」視窗；
      拖曳選取斷面線兩端橘色圓點＝改偏角 θ（可 F3 鎖點）；← ／ → 每次 ±0.5°（Shift ±0.1°），← 逆時針（＋）
      ↑ ／ ↓ 換上一樁／下一樁；Esc 關閉視窗
   C2 平面圖上浮動小視窗顯示選取樁號的橫斷面（與介面 3 同一畫法），θ 改變後自動重畫；可拖曳標題列移動、切大小
   A5 視窗開啟時，前後相鄰斷面線以淡灰虛線顯示；與目前斷面交叉時改紅色並標交點
   B1 「自行加樁號」清單改為表格：樁號（可改）、點名（可改）、看、✕ 刪除；多中心線匯流樁唯讀
   B2 改樁號／刪除時，該樁手動資料（河寬／護岸控制值、讀取長度、偏角、上下斷面、左右側高、地形折點）一起搬或一起清；皆可 Ctrl＋Z 復原
   B4 選取的加樁在平面圖中心點顯示 ◆，沿中心線拖曳改里程（可 F3 鎖點）；Delete 刪除
   ============================================================================ */
const XP = { on: false, sz: 'M', drag: null, pend: null, pendT: 0, gen: 0, key: '', lbl: [], cap: false };
const XP_SZ = { S: [320, 220], M: [430, 290], L: [580, 390] };
try { const o = JSON.parse(localStorage.getItem('dz_xp') || '{}'); if (XP_SZ[o.sz]) XP.sz = o.sz; XP.pos = o.pos; } catch (e) { }
function xpSave() { try { localStorage.setItem('dz_xp', JSON.stringify({ sz: XP.sz, pos: XP.pos })); } catch (e) { } }
function xpSec() { return (state.sections || [])[state.selectedStaIdx] || null; }
const XP_EPS = 0.005;
/* ---------- 加樁資料 ---------- */
function xpCustIdx(sec) { if (!sec) return -1; return (state.customStations || []).findIndex(c => !c.cf && Math.abs(c.s - sec.sta) < XP_EPS); }
function xpSecIdxAt(s) { const S = state.sections || []; let k = S.findIndex(x => Math.abs(x.sta - s) < XP_EPS && !x.side); if (k < 0) k = S.findIndex(x => Math.abs(x.sta - s) < XP_EPS); return k; }
// 樁號 old 仍有其他（非上下複製）斷面？
function xpStillAt(s) { return (state.sections || []).some(x => Math.abs(x.sta - s) < XP_EPS && x.side !== 'up' && x.side !== 'dn'); }
// 以樁號為鍵的手動資料：搬移（to 為數值）或刪除（to＝null）
function xpMoveKeys(from, to) {
  const k0 = (+from).toFixed(2), k1 = to == null ? null : (+to).toFixed(2); let n = 0;
  const mv = M => { if (!M) return; Object.keys(M).forEach(k => { if (k !== k0 && k.indexOf(k0 + '|') !== 0) return; const v = M[k]; delete M[k]; n++; if (k1 !== null) M[k1 + k.slice(k0.length)] = v; }); };
  [state.secParams, state.secExt, state.secGround, state.pf && state.pf.sideData].forEach(mv);
  const sp = state.splits || {}; if (sp[k0]) { const v = sp[k0]; delete sp[k0]; n++; if (k1 !== null) { v.sta = +to; sp[k1] = v; } }
  return n;
}
function xpRefresh(selS) {
  updateCustomStationListUI();
  if (typeof renderStationMileageTable === 'function') try { renderStationMileageTable(); } catch (e) { }
  if (selS != null) { const k = xpSecIdxAt(selS); if (k >= 0) selectStationIndex(k); }
  requestRedraw();
}
function xpMoveCustom(i, v) {
  const C = state.customStations || [], c = C[i], al = state.alignment; if (!c || c.cf) { xpRefresh(); return false; }
  v = Math.round(parseFloat(v) * 100) / 100;
  if (!Number.isFinite(v)) { updateStatus('⚠ 請輸入有效的里程（m）。'); xpRefresh(); return false; }
  if (!(v > al.startSta + 0.005 && v < al.endSta - 0.005)) { alert(`樁號需介於 ${formatStation(al.startSta)} ～ ${formatStation(al.endSta)} 之間。`); xpRefresh(); return false; }
  const old = c.s; if (Math.abs(v - old) < XP_EPS) { xpRefresh(); return false; }
  const hit = (state.sections || []).find(x => Math.abs(x.sta - v) < 0.01 && Math.abs(x.sta - old) >= XP_EPS);
  if (hit) { alert(`${formatStation(v)} 與既有樁號「${hit.staLabel}」重疊（0.01 m 內），請換一個里程。`); xpRefresh(); return false; }
  pushUndoSnapshot();
  c.s = v; rebuildAlignmentAndSections();
  let msg;
  if (xpStillAt(old)) msg = `；原樁號 ${formatStation(old)} 仍有其他樁，手動資料留在原樁號`;
  else { const n = xpMoveKeys(old, v); if (n) { rebuildAlignmentAndSections(); msg = `；該樁手動資料（${n} 筆）一起搬移`; } else msg = ''; }
  xpRefresh(v);
  updateStatus(`📍 加樁「${c.name}」${formatStation(old)} → ${formatStation(v)}${msg}。可 Ctrl＋Z 復原。`);
  return true;
}
function xpRenameCustom(i, name) {
  const c = (state.customStations || [])[i]; if (!c || c.cf) return;
  name = String(name || '').trim() || '加樁'; if (name === c.name) return;
  pushUndoSnapshot(); c.name = name; rebuildAlignmentAndSections(); xpRefresh();
  updateStatus(`📍 ${formatStation(c.s)} 點名改為「${name}」。`);
}
function xpDelCustom(i) {
  const C = state.customStations || [], c = C[i]; if (!c || c.cf) return false;
  const sel = xpSec(), wasSel = sel && Math.abs(sel.sta - c.s) < XP_EPS;
  pushUndoSnapshot(); C.splice(i, 1); rebuildAlignmentAndSections();
  let msg = '';
  if (!xpStillAt(c.s)) { const n = xpMoveKeys(c.s, null); if (n) { rebuildAlignmentAndSections(); msg = `，並清除該樁手動資料 ${n} 筆`; } }
  else msg = '（該處仍有其他樁，手動資料保留）';
  if (wasSel) { const S = state.sections; let k = S.findIndex(x => x.sta > c.s); if (k < 0) k = S.length - 1; if (k > 0 && Math.abs(S[k - 1].sta - c.s) < Math.abs(S[k].sta - c.s)) k--; xpRefresh(); if (k >= 0) selectStationIndex(k); }
  else xpRefresh();
  updateStatus(`🗑 已刪除加樁 ${formatStation(c.s)}（${c.name}）${msg}。可 Ctrl＋Z 復原。`);
  return true;
}
function xpLook(i) {
  const c = (state.customStations || [])[i]; if (!c) return; const k = xpSecIdxAt(c.s); if (k < 0) { updateStatus('⚠ 此加樁不在目前中心線範圍內。'); return; }
  selectStationIndex(k);
  if (state.viewMode === '2D') { xpOpen(true); xpCenter(true); }
}
/* B1：加樁表（取代「已加樁：…」一行文字） */
updateCustomStationListUI = function () {
  const el = document.getElementById('customStaListText'); if (!el) return;
  const C = state.customStations || [];
  if (!C.length) { el.innerHTML = '<span style="color:var(--text-muted);">目前無自訂加樁（可點上方「📍 圖面點擊加樁」在圖面點選新增）</span>'; return; }
  const al = state.alignment || {}, ord = C.map((c, i) => i).sort((a, b) => C[a].s - C[b].s);
  const td = 'padding:2px 3px;border-bottom:1px solid var(--border-dim);';
  el.innerHTML = `<div style="font-size:10.5px;color:var(--text-muted);margin-bottom:3px;">加樁表（${C.length}）：直接修改樁號或點名；改樁號時該樁手動資料一起搬移；平面圖上選取加樁可沿中心線拖曳 ◆、Delete 刪除。</div>
  <table id="xpStaTbl" style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="color:var(--text-muted);text-align:left;"><th style="${td}">樁號 (m)</th><th style="${td}">點名</th><th style="${td}"></th></tr></thead><tbody>` +
    ord.map(i => {
      const c = C[i], out = al.segments && al.segments.length && (c.s < al.startSta || c.s > al.endSta), ro = !!c.cf;
      return `<tr data-i="${i}" style="${ro ? 'opacity:0.6;' : ''}${out ? 'color:#f87171;' : ''}">
      <td style="${td}"><input class="vip-in xp-s" type="text" inputmode="decimal" value="${(+c.s).toFixed(2)}" style="width:72px;text-align:right;" ${ro ? 'disabled title="多中心線匯流點自動產生，無法手改"' : 'title="輸入新里程 (m)，Enter 確定"'} onchange="xpMoveCustom(${i},this.value)"><div style="font-size:9.5px;color:var(--text-muted);">${formatStation(c.s)}${out ? ' 超出中心線' : ''}</div></td>
      <td style="${td}"><input class="vip-in xp-n" type="text" value="${String(c.name || '').replace(/"/g, '&quot;')}" style="width:100%;min-width:60px;text-align:left;" ${ro ? 'disabled' : ''} onchange="xpRenameCustom(${i},this.value)"></td>
      <td style="${td}white-space:nowrap;"><button class="btn xp-look" style="padding:1px 6px;" onclick="xpLook(${i})" title="選取此樁（在平面圖時開啟斷面微調視窗）">看</button>${ro ? '' : ` <button class="btn xp-del" style="padding:1px 6px;color:#f87171;" onclick="xpDelCustom(${i})" title="刪除此加樁（可 Ctrl＋Z 復原）">✕</button>`}</td></tr>`;
    }).join('') + '</tbody></table>';
};
(function () {   // 「清空」加確認；加入時改用表格
  const _cl = clearCustomStations; clearCustomStations = function () {
    const n = (state.customStations || []).filter(c => !c.cf).length; if (!n) return;
    if (!confirm(`確定清空全部 ${n} 個自訂加樁？（可 Ctrl＋Z 復原）`)) return;
    pushUndoSnapshot(); const cf = state.customStations.filter(c => c.cf); _cl.apply(this, arguments); state.customStations = cf; updateCustomStationListUI(); rebuildAlignmentAndSections();
  };
  const _ad = addCustomStation; addCustomStation = function () {
    const v = parseFloat((document.getElementById('customStaVal') || {}).value);
    if (Number.isFinite(v) && (state.sections || []).some(x => Math.abs(x.sta - v) < 0.01)) { alert(`${formatStation(v)} 已有樁號。`); return; }
    if (Number.isFinite(v)) pushUndoSnapshot();
    return _ad.apply(this, arguments);
  };
})();
/* ---------- C2 斷面預覽視窗 ---------- */
function xpBox() {
  let d = document.getElementById('xpBox'); if (d) return d;
  const wrap = document.getElementById('viewportWrap'); if (!wrap) return null;
  d = document.createElement('div'); d.id = 'xpBox';
  d.style.cssText = 'position:absolute;z-index:30;display:none;background:rgba(9,12,16,0.96);border:1px solid #fb923c;border-radius:6px;box-shadow:0 4px 18px rgba(0,0,0,0.6);font-size:11.5px;color:#cbd5e1;user-select:none;';
  d.innerHTML = `<div id="xpHead" style="display:flex;align-items:center;gap:6px;padding:4px 6px;cursor:move;background:rgba(251,146,60,0.14);border-bottom:1px solid rgba(251,146,60,0.4);">
    <b style="color:#fb923c;">斷面微調</b><span id="xpTitle" style="font-family:var(--font-mono);color:#e2e8f0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></span>
    <select id="xpSz" class="input-select" style="padding:0 2px;font-size:11px;" title="視窗大小" onchange="XP.sz=this.value;xpSave();xpLayout();requestRedraw();"><option value="S">小</option><option value="M">中</option><option value="L">大</option></select>
    <button class="btn" style="padding:0 7px;" onclick="xpClose()" title="關閉（Esc）">✕</button></div>
  <canvas id="xpCv" style="display:block;"></canvas>
  <div style="display:flex;align-items:center;gap:4px;padding:4px 6px;flex-wrap:wrap;">
    <button class="btn" style="padding:1px 6px;" onclick="xpStep(-1)" title="上一樁（↑）">◀</button>
    <span style="color:var(--text-muted);font-family:'Noto Sans TC',sans-serif;">偏角</span><input id="xpTh" class="vip-in" type="text" inputmode="decimal" style="width:58px;text-align:center;" title="斷面偏角 (°)：0＝垂直中心線，逆時針為正，上限 ±60°；清空＝歸零" onchange="xpThEdit(this)">
    <button class="btn" style="padding:1px 6px;" onclick="xpNudge(0.5)" title="逆時針 0.5°（←；Shift＋← 0.1°）">↺ +0.5°</button>
    <button class="btn" style="padding:1px 6px;" onclick="xpNudge(-0.5)" title="順時針 0.5°（→；Shift＋→ 0.1°）">↻ −0.5°</button>
    <button class="btn" style="padding:1px 6px;" onclick="(s=>s&&secRotSet(s.sta,0))(xpSec())" title="本樁斷面回到垂直中心線">歸零</button>
    <button class="btn" style="padding:1px 6px;" onclick="xpStep(1)" title="下一樁（↓）">▶</button>
    <button class="btn" id="xpDelBtn" style="padding:1px 6px;color:#f87171;display:none;" onclick="xpDelSel()" title="刪除此加樁（Delete）">✕ 刪加樁</button>
    <span id="xpMsg" style="flex-basis:100%;font-size:10.5px;color:var(--text-muted);"></span></div>`;
  wrap.appendChild(d);
  const h = d.querySelector('#xpHead');
  h.addEventListener('mousedown', e => {
    if (e.target.closest('select,button')) return; e.preventDefault();
    const r = d.getBoundingClientRect(), W = wrap.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
    const mv = ev => { const x = Math.max(0, Math.min(W.width - r.width, ev.clientX - W.left - ox)), y = Math.max(0, Math.min(W.height - 30, ev.clientY - W.top - oy)); d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.right = 'auto'; d.style.bottom = 'auto'; XP.pos = [x, y]; };
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); xpSave(); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  });
  d.addEventListener('mousedown', e => e.stopPropagation());
  d.addEventListener('wheel', e => e.stopPropagation());
  xpLayout(); return d;
}
function xpLayout() {
  const d = document.getElementById('xpBox'); if (!d) return; const [w, h] = XP_SZ[XP.sz] || XP_SZ.M, cv = d.querySelector('#xpCv'), dpr = window.devicePixelRatio || 1;
  cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); d.style.width = (w + 2) + 'px';
  const s = d.querySelector('#xpSz'); if (s) s.value = XP.sz;
  const wrap = document.getElementById('viewportWrap'), W = wrap ? wrap.getBoundingClientRect() : { width: 1200, height: 800 };
  if (XP.pos && XP.pos[0] + 100 < W.width && XP.pos[1] + 30 < W.height) { d.style.left = XP.pos[0] + 'px'; d.style.top = XP.pos[1] + 'px'; d.style.right = 'auto'; d.style.bottom = 'auto'; }
  else { d.style.left = 'auto'; d.style.top = 'auto'; d.style.right = '72px'; d.style.bottom = '12px'; }
  XP.key = '';
}
function xpOpen(quiet) {
  if (!xpSec()) { if (!quiet) alert('請先產生斷面並選定樁號。'); return; }
  XP.on = true; if (state.viewMode !== '2D') setViewMode('2D'); const d = xpBox(); if (d) d.style.display = 'block'; XP.key = ''; xpSync(); requestRedraw();
  if (!quiet) xpCenter(false);
}
function xpClose() { XP.on = false; XP.drag = null; XP.pend = null; const d = document.getElementById('xpBox'); if (d) d.style.display = 'none'; requestRedraw(); try { axisOvDraw(); } catch (e) { } }
function xpCenter(force) {   // 選取斷面不在畫面內（或 force）→ 平移置中；太小則放大
  const sec = xpSec(), c = state.cam2D; if (!sec || !c) return;
  const r = cadCanvas.getBoundingClientRect(), q = worldToScreen2D(sec.cx, sec.cy), L = Math.max(sec.readL || 5, sec.readR || 5, 5), need = r.width * 0.25 / (2 * L);
  const off = q.x < 40 || q.y < 40 || q.x > r.width - 40 || q.y > r.height - 40;
  if (force || off) { c.cx = sec.cx; c.cy = sec.cy; } if (c.scale < need) c.scale = need; requestRedraw();
}
function xpStep(d) { stepStation(d); if (XP.on) xpCenter(false); }
function xpNudge(d) {
  const sec = xpSec(); if (!sec) return; if (secRotBlocked(sec.sta)) { updateStatus('⚠ 此樁號有防砂壩（結構物），不套用偏角。'); return; }
  const base = XP.pend != null && XP.pend.sta === sec.sta ? XP.pend.th : secRotRaw(sec.sta);
  const th = Math.max(-SECROT_MAX, Math.min(SECROT_MAX, Math.round((base + d) * 100) / 100));
  XP.pend = { sta: sec.sta, th }; xpSync(); try { axisOvDraw(); } catch (e) { }
  clearTimeout(XP.pendT); XP.pendT = setTimeout(xpCommit, 450);
}
function xpCommit() { clearTimeout(XP.pendT); const p = XP.pend; XP.pend = null; if (!p) return; const sec = xpSec(); if (sec && Math.abs(sec.sta - p.sta) < XP_EPS) secRotSet(p.sta, p.th); else secRotSet(p.sta, p.th); try { axisOvDraw(); } catch (e) { } }
function xpThEdit(el) { const sec = xpSec(); if (!sec) return; const t = el.value.trim(), v = t === '' ? 0 : parseFloat(t); if (t !== '' && !Number.isFinite(v)) { xpSync(); return; } XP.pend = null; secRotSet(sec.sta, v); }
function xpDelSel() { const i = xpCustIdx(xpSec()); if (i >= 0) xpDelCustom(i); }
function xpSync() {
  const d = document.getElementById('xpBox'); if (!d || !XP.on) return; const sec = xpSec(); if (!sec) { xpClose(); return; }
  const bl = secRotBlocked(sec.sta), th = XP.pend && XP.pend.sta === sec.sta ? XP.pend.th : secRotRaw(sec.sta), ci = xpCustIdx(sec);
  d.querySelector('#xpTitle').textContent = sec.staLabel + (th ? `　θ ${secRotFmt(th)}` : '');
  const ti = d.querySelector('#xpTh'); if (ti !== document.activeElement) ti.value = th ? +th.toFixed(2) : ''; ti.disabled = bl; ti.placeholder = bl ? '壩位' : '0';
  d.querySelector('#xpDelBtn').style.display = ci >= 0 ? '' : 'none';
  const n = secRotCross();
  d.querySelector('#xpMsg').innerHTML = (bl ? '此樁號有防砂壩，不套用偏角。' : '拖曳<b style="color:#fb923c;">●</b>端點轉方向（F3 鎖點）；←→ 0.5°（Shift 0.1°）；↑↓ 換樁') + (ci >= 0 ? '；拖曳<b style="color:#e879f9;">◆</b>改里程、Delete 刪除' : '') + '；Esc 關閉' + (n.length ? `<br><b style="color:#f87171;">⚠ 斷面交叉：${n.join('、')}</b>` : '');
}
/* 把選取樁號的橫斷面畫到預覽畫布（借用主畫布繪製再複製；資料不變時不重畫） */
function xpPreview() {
  const d = document.getElementById('xpBox'), sec = xpSec(); if (!d || !sec || d.style.display === 'none') return;
  const cv = d.querySelector('#xpCv'), dpr = window.devicePixelRatio || 1, [w, h] = XP_SZ[XP.sz] || XP_SZ.M;
  const key = [XP.gen, state.selectedStaIdx, sec.sta, sec.side, sec.rot, w, h, dpr, cadCanvas.width, cadCanvas.height].join('|'); if (key === XP.key) return;
  if (cadCanvas.width < w * dpr || cadCanvas.height < h * dpr) return;
  const fm = state.fontMul, pkN = ST_PK.length, npk = ST_NOPK, xc = state._xcells, sp = state._strip; ST_NOPK = true;
  try {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr); ctx.fillStyle = '#070a0f'; ctx.fillRect(0, 0, w, h); state.fontMul = 1;
    drawSingleCrossSectionBox(sec, 2, 2, w - 4, h - 4, false, true, state.selectedStaIdx);
    ctx.restore();
    const c2 = cv.getContext('2d'); c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, cv.width, cv.height); c2.drawImage(cadCanvas, 0, 0, Math.round(w * dpr), Math.round(h * dpr), 0, 0, cv.width, cv.height);
    XP.key = key;
  } catch (e) { try { ctx.restore(); } catch (e2) { } }
  state.fontMul = fm; ST_PK.length = Math.min(ST_PK.length, pkN); ST_NOPK = npk; state._xcells = xc; state._strip = sp;
}
/* ---------- 平面圖：命中測試與繪製 ---------- */
function xpSegD(p, a, b) { const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2)) : 0; return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy); }
function xpInPoly(p, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }
function xpEnds(sec) { return [worldToScreen2D(sec.lx, sec.ly), worldToScreen2D(sec.rx, sec.ry)]; }
// 旋轉把手：端點在畫面內就放端點，否則放在離中心約 0.4 倍畫面短邊處（拖曳方向才是重點，不必拖到端點）
function xpHandles(sec) {
  const r = cadCanvas.getBoundingClientRect(), c = worldToScreen2D(sec.cx, sec.cy), m = 0.4 * Math.min(r.width, r.height);
  return xpEnds(sec).map(e => { const dx = e.x - c.x, dy = e.y - c.y, L = Math.hypot(dx, dy) || 1, inV = e.x > 12 && e.y > 12 && e.x < r.width - 12 && e.y < r.height - 12, d = inV ? L : Math.min(L, m); return { x: c.x + dx / L * d, y: c.y + dy / L * d }; });
}
function xpHit(mx, my) {
  const S = state.sections || [], m = { x: mx, y: my }, sec = xpSec();
  if (XP.on && sec) {
    if (!secRotBlocked(sec.sta)) { const E = xpHandles(sec); for (let k = 0; k < 2; k++) if (Math.hypot(E[k].x - mx, E[k].y - my) <= 9) return { t: 'rot', sec }; }
    const ci = xpCustIdx(sec); if (ci >= 0) { const c = worldToScreen2D(sec.cx, sec.cy); if (Math.hypot(c.x - mx, c.y - my) <= 9) return { t: 'mv', sec, ci }; }
  }
  const w = screenToWorld2D(mx, my);
  for (const L of XP.lbl) if (L.box && xpInPoly(w, L.box)) { const k = S.indexOf(L.sec); if (k >= 0) return { t: 'sel', k }; }
  if (typeof staTickEnds === 'function') {
    let best = null; S.forEach((s, k) => { const isSel = k === state.selectedStaIdx; if (!isSel && s.isCurveTick && !document.getElementById('lyrCurveCentipede').checked) return; if (!isSel && !s.isCurveTick && !document.getElementById('lyrCentipede').checked) return; const e = staTickEnds(s, isSel), a = worldToScreen2D(e[0], e[1]), b = worldToScreen2D(e[2], e[3]), dd = xpSegD(m, a, b); if (dd <= 4 && (!best || dd < best.d)) best = { d: dd, k }; });
    if (best) return { t: 'sel', k: best.k };
  }
  return null;
}
// 游標 → 中心線里程（粗取樣後局部細化，可鎖點）
function xpProj(mx, my) {
  const sn = typeof dzSnapPt === 'function' ? dzSnapPt(mx, my) : null, w = sn || screenToWorld2D(mx, my);
  const p = projectWorldPointToAlignment(w.x, w.y); if (!p) return null; const al = state.alignment;
  let a = Math.max(al.startSta, p.sta - 0.6), b = Math.min(al.endSta, p.sta + 0.6);
  const f = s => { const g = getPointAndNormalAtStation(s); return g ? Math.hypot(g.x - w.x, g.y - w.y) : 1e9; };
  for (let i = 0; i < 40; i++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (f(m1) < f(m2)) b = m2; else a = m1; }
  return { sta: Math.round((a + b) / 2 * 100) / 100, sn, w };
}
function xpDraw() {   // 主畫布（render2DCAD 之後）：相鄰斷面、端點把手、加樁 ◆
  const sec = xpSec(); if (!XP.on || !sec || state.viewMode !== '2D') return;
  const S = state.sections, i = state.selectedStaIdx, dpr = window.devicePixelRatio || 1;
  let a = i - 1; while (a >= 0 && Math.abs(S[a].sta - sec.sta) < XP_EPS) a--; let b = i + 1; while (b < S.length && Math.abs(S[b].sta - sec.sta) < XP_EPS) b++;
  const X = (p1, p2, q1, q2) => { const d1x = p2.x - p1.x, d1y = p2.y - p1.y, d2x = q2.x - q1.x, d2y = q2.y - q1.y, den = d1x * d2y - d1y * d2x; if (Math.abs(den) < 1e-12) return null; const t = ((q1.x - p1.x) * d2y - (q1.y - p1.y) * d2x) / den, u = ((q1.x - p1.x) * d1y - (q1.y - p1.y) * d1x) / den; return t > 0 && t < 1 && u > 0 && u < 1 ? { x: p1.x + t * d1x, y: p1.y + t * d1y } : null; };
  ctx.save(); ctx.scale(dpr, dpr);
  const E = xpEnds(sec);
  [a, b].forEach(k => { const n = S[k]; if (!n) return; const N = xpEnds(n), c = X(E[0], E[1], N[0], N[1]);
    ctx.strokeStyle = c ? '#f87171' : 'rgba(148,163,184,0.6)'; ctx.lineWidth = c ? 2 : 1.2; ctx.setLineDash(c ? [] : [6, 4]); ctx.beginPath(); ctx.moveTo(N[0].x, N[0].y); ctx.lineTo(N[1].x, N[1].y); ctx.stroke(); ctx.setLineDash([]);
    if (c) { ctx.fillStyle = '#f87171'; ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.font = 'bold 11px "Noto Sans TC"'; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,12,18,0.9)'; ctx.strokeText('交叉 ' + n.shortStaLabel, c.x + 8, c.y - 6); ctx.fillText('交叉 ' + n.shortStaLabel, c.x + 8, c.y - 6); } });
  if (!secRotBlocked(sec.sta)) xpHandles(sec).forEach(p => { ctx.fillStyle = '#fb923c'; ctx.strokeStyle = '#0b1018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
  if (xpCustIdx(sec) >= 0) { const c = worldToScreen2D(sec.cx, sec.cy); ctx.fillStyle = '#e879f9'; ctx.strokeStyle = '#0b1018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x, c.y - 8); ctx.lineTo(c.x + 8, c.y); ctx.lineTo(c.x, c.y + 8); ctx.lineTo(c.x - 8, c.y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
/* 覆蓋層：拖曳／鍵盤微調中的預覽 */
function xpOvDraw(oc) {
  const sec = xpSec(); if (!sec) return;
  if (XP.drag && XP.drag.t === 'mv') {
    const p = XP.drag.p; if (!p) return; const g = getPointAndNormalAtStation(p.sta); if (!g) return; const L = Math.max(sec.readL, sec.readR, 5);
    const a = worldToScreen2D(g.x + g.nx * L, g.y + g.ny * L), b = worldToScreen2D(g.x - g.nx * L, g.y - g.ny * L), c = worldToScreen2D(g.x, g.y);
    const bad = (state.sections || []).some(x => Math.abs(x.sta - p.sta) < 0.01 && Math.abs(x.sta - sec.sta) >= XP_EPS);
    oc.strokeStyle = bad ? '#f87171' : '#e879f9'; oc.lineWidth = 2; oc.setLineDash([6, 4]); oc.beginPath(); oc.moveTo(a.x, a.y); oc.lineTo(b.x, b.y); oc.stroke(); oc.setLineDash([]);
    oc.fillStyle = '#e879f9'; oc.beginPath(); oc.moveTo(c.x, c.y - 8); oc.lineTo(c.x + 8, c.y); oc.lineTo(c.x, c.y + 8); oc.lineTo(c.x - 8, c.y); oc.closePath(); oc.fill();
    if (p.sn) { const s = worldToScreen2D(p.sn.x, p.sn.y); oc.strokeStyle = '#ff00ff'; oc.lineWidth = 2; oc.strokeRect(s.x - 6, s.y - 6, 12, 12); }
    if (typeof cldBox === 'function' && AXOV_LAST) cldBox(oc, AXOV_LAST.x, AXOV_LAST.y, [`${formatStation(sec.sta)} → ${formatStation(p.sta)}`, bad ? '與既有樁號重疊' : '放開設定；Esc 取消'], bad ? '#f87171' : '#e879f9');
    return;
  }
  let th, over = false, sn = null;
  if (XP.drag && XP.drag.t === 'rot') { const p = XP.drag.p; if (!p) return; th = p.th; over = p.over; sn = p.sn; }
  else if (XP.pend && Math.abs(XP.pend.sta - sec.sta) < XP_EPS) th = XP.pend.th; else return;
  const g = getPointAndNormalAtStation(sec.sta); if (!g) return; const L = Math.max(sec.readL, sec.readR), c = worldToScreen2D(g.x, g.y);
  const ln = (nx, ny, col, dash, wd) => { const a = worldToScreen2D(g.x + nx * L, g.y + ny * L), b = worldToScreen2D(g.x - nx * L, g.y - ny * L); oc.strokeStyle = col; oc.lineWidth = wd; oc.setLineDash(dash); oc.beginPath(); oc.moveTo(a.x, a.y); oc.lineTo(b.x, b.y); oc.stroke(); oc.setLineDash([]); };
  ln(g.nx, g.ny, 'rgba(148,163,184,0.8)', [5, 4], 1.2);
  const r = th * Math.PI / 180, nx = g.nx * Math.cos(r) - g.ny * Math.sin(r), ny = g.nx * Math.sin(r) + g.ny * Math.cos(r);
  ln(nx, ny, over ? '#f87171' : '#fb923c', [], 2.4);
  oc.fillStyle = '#fb923c'; oc.beginPath(); oc.arc(c.x, c.y, 4, 0, Math.PI * 2); oc.fill();
  if (sn) { const s = worldToScreen2D(sn.x, sn.y); oc.strokeStyle = sn.type === 'mid' ? '#22d3ee' : '#ff00ff'; oc.lineWidth = 2; oc.strokeRect(s.x - 6, s.y - 6, 12, 12); }
  const pt = XP.drag && AXOV_LAST ? AXOV_LAST : worldToScreen2D(g.x + nx * L, g.y + ny * L);
  if (typeof cldBox === 'function') cldBox(oc, pt.x, pt.y, [`${sec.shortStaLabel} 偏角 ${secRotFmt(th)}` + (th ? '' : '（垂直）'), over ? `已達上限 ±${SECROT_MAX}°` : (XP.drag ? '放開設定；Esc 取消' : '')].filter(Boolean), '#fb923c');
}
(function () {
  const _rb = rebuildAlignmentAndSections; rebuildAlignmentAndSections = function () { XP.gen++; const r = _rb.apply(this, arguments); if (XP.on) setTimeout(xpSync, 0); return r; };
  const _ds = drawStationLabels; drawStationLabels = function () { XP.cap = true; XP.lbl = []; try { return _ds.apply(this, arguments); } finally { XP.cap = false; } };
  const _ly = layoutStationLabelsWorld; layoutStationLabelsWorld = function () { const r = _ly.apply(this, arguments); if (XP.cap && Array.isArray(r)) XP.lbl = XP.lbl.concat(r); return r; };
  const _r2 = render2DCAD; render2DCAD = function () {
    if (XP.on) { const d = document.getElementById('xpBox'); if (d && d.style.display === 'none') d.style.display = 'block'; xpPreview(); }
    const r = _r2.apply(this, arguments); try { xpDraw(); } catch (e) { } return r;
  };
  const _sv = setViewMode; setViewMode = function (m) { const r = _sv.apply(this, arguments); const d = document.getElementById('xpBox'); if (d) d.style.display = XP.on && m === '2D' ? 'block' : 'none'; if (m !== '2D') { XP.drag = null; } return r; };
  const _ss = selectStationIndex; selectStationIndex = function () { const r = _ss.apply(this, arguments); if (XP.pend) xpCommit(); if (XP.on) xpSync(); return r; };
  const _ao = axisOvDraw; axisOvDraw = function () {
    const mine = state.viewMode === '2D' && XP.on && (XP.drag || XP.pend);
    if (!mine) return _ao.apply(this, arguments);
    const ov = document.getElementById('axisOverlay'), cv = document.getElementById('cadCanvas'); if (!ov || !cv) return;
    const d = window.devicePixelRatio || 1, r = cv.getBoundingClientRect(), W = Math.round(r.width * d), H = Math.round(r.height * d); if (ov.width !== W || ov.height !== H) { ov.width = W; ov.height = H; }
    const oc = ov.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, ov.width, ov.height); AXOV_ON = true; oc.setTransform(d, 0, 0, d, 0, 0);
    xpOvDraw(oc);
  };
  const _au = undoLastAction; undoLastAction = function () { XP.pend = null; clearTimeout(XP.pendT); const r = _au.apply(this, arguments); if (XP.on) xpSync(); return r; };
  const _ap = applyProject; applyProject = function () { XP.pend = null; XP.drag = null; const r = _ap.apply(this, arguments); setTimeout(() => { updateCustomStationListUI(); if (XP.on) xpSync(); }, 0); return r; };
  const _sc = syncCrossEdit; syncCrossEdit = function () {
    const r = _sc.apply(this, arguments);
    try { const bx = document.getElementById('secRotBox'); if (bx && !document.getElementById('xpOpenBtn')) { const b = document.createElement('button'); b.id = 'xpOpenBtn'; b.className = 'btn'; b.style.cssText = 'justify-content:center;width:100%;margin-top:4px;'; b.textContent = '🔍 平面圖微調斷面（附斷面預覽）'; b.title = '切到平面圖並開啟斷面微調視窗：拖曳端點或用方向鍵調偏角，同時看斷面'; b.onclick = () => xpOpen(); bx.appendChild(b); } } catch (e) { }
    return r;
  };
  window.addEventListener('mousedown', e => {
    if (state.viewMode !== '2D' || state.activeTool !== 'PAN' || e.button !== 0) return;
    if (!e.target || (e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay')) return;
    if (state.hoveredIPIdx >= 0 || state.draggingIPIdx >= 0) return;
    const r = cadCanvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, h = xpHit(mx, my); if (!h) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (h.t === 'sel') { if (XP.pend) xpCommit(); selectStationIndex(h.k); if (!XP.on) xpOpen(true); else xpSync(); updateStatus(`已選取 ${state.sections[h.k].staLabel}：拖曳橘色端點或用 ← → 調整斷面方向；↑ ↓ 換樁。`); return; }
    if (XP.pend) xpCommit();
    XP.drag = { t: h.t, sta: h.sec.sta, ci: h.ci, p: null }; AXOV_LAST = { x: mx, y: my };
    cadCanvas.style.cursor = h.t === 'rot' ? 'crosshair' : 'ew-resize';
  }, true);
  window.addEventListener('mousemove', e => {
    if (state.viewMode !== '2D') return;
    const r = cadCanvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    if (XP.drag) {
      e.stopImmediatePropagation();
      if (XP.drag.t === 'rot') XP.drag.p = secRotPick(mx, my); else XP.drag.p = xpProj(mx, my);
      axisOvDraw(); return;
    }
    if (state.activeTool === 'PAN' && e.target && (e.target.id === 'cadCanvas' || e.target.id === 'axisOverlay') && !e.buttons) {
      const h = XP.on || XP.lbl.length ? xpHit(mx, my) : null, cur = h ? (h.t === 'rot' ? 'crosshair' : h.t === 'mv' ? 'ew-resize' : 'pointer') : '';
      if (cur) { cadCanvas.style.cursor = cur; XP.cur = true; } else if (XP.cur) { cadCanvas.style.cursor = ''; XP.cur = false; }
    }
  }, true);
  window.addEventListener('mouseup', e => {
    const D = XP.drag; if (!D) return; XP.drag = null; cadCanvas.style.cursor = '';
    e.stopImmediatePropagation();
    if (D.t === 'rot' && D.p) secRotSet(D.sta, D.p.th);
    else if (D.t === 'mv' && D.p && Math.abs(D.p.sta - D.sta) >= XP_EPS) { const ci = (state.customStations || []).findIndex(c => !c.cf && Math.abs(c.s - D.sta) < XP_EPS); if (ci >= 0) xpMoveCustom(ci, D.p.sta); }
    axisOvDraw(); requestRedraw();
  }, true);
  window.addEventListener('keydown', e => {
    if (!XP.on || state.viewMode !== '2D') return;
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (XP.drag) { XP.drag = null; cadCanvas.style.cursor = ''; axisOvDraw(); updateStatus('已取消拖曳。'); } else if (state.activeTool === 'PAN') { if (XP.pend) xpCommit(); xpClose(); updateStatus('已關閉斷面微調。'); } return; }
    if (state.activeTool !== 'PAN') return;
    if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); xpNudge((k === 'ArrowLeft' ? 1 : -1) * (e.shiftKey ? 0.1 : 0.5)); return; }
    if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); e.stopImmediatePropagation(); xpStep(k === 'ArrowUp' ? -1 : 1); return; }
    if (k === 'Delete') { const i = xpCustIdx(xpSec()); if (i >= 0) { e.preventDefault(); e.stopImmediatePropagation(); xpDelCustom(i); } }
  }, true);
  window.addEventListener('resize', () => { if (XP.on) xpLayout(); });
})();
window.addEventListener('load', () => setTimeout(() => { try { updateCustomStationListUI(); } catch (e) { } }, 60));
/* v7.1b：「自行加樁號」整區（輸入、加入、清空、圖面點擊加樁、加樁表）移到「中心線定線與圖面加樁工具」卡片最上方；徽章加上加樁數 */
function xpMoveStaBlock() {
  const v = document.getElementById('customStaVal'); if (!v || v.dataset.xpMoved) return;
  let blk = v.parentElement; while (blk && !/border-top/.test(blk.getAttribute('style') || '')) blk = blk.parentElement;
  const bd = document.getElementById('ipCountBadge'), ttl = bd && bd.closest('.sec-title');
  if (!blk || !ttl) return;
  ttl.after(blk); v.dataset.xpMoved = '1';
  blk.style.borderTop = 'none'; blk.style.marginTop = '2px'; blk.style.paddingTop = '2px'; blk.style.marginBottom = '8px'; blk.style.paddingBottom = '8px'; blk.style.borderBottom = '1px solid var(--border-dim)';
  const hd = blk.firstElementChild; if (hd && /自行加樁號/.test(hd.textContent)) hd.textContent = '📍 自行加樁號（輸入里程加入，或按「📍 圖面點擊加樁」在圖上點選）：';
  xpBadge();
}
function xpBadge() {
  const b = document.getElementById('ipCountBadge'); if (!b) return;
  const n = ((state.alignment && state.alignment.ipList) || []).length, m = (state.customStations || []).filter(c => !c.cf).length;
  b.textContent = n + ' 點' + (m ? `・加樁 ${m}` : '');
}
(function () {
  const _u = updateCustomStationListUI; updateCustomStationListUI = function () { const r = _u.apply(this, arguments); xpBadge(); return r; };
  const _rb = rebuildAlignmentAndSections; rebuildAlignmentAndSections = function () { const r = _rb.apply(this, arguments); xpBadge(); return r; };
})();
window.addEventListener('load', () => setTimeout(() => { try { xpMoveStaBlock(); } catch (e) { } }, 50));
