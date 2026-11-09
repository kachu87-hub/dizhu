/* ============================================================================
   v6.9 橫斷面線偏角（單獨調整特定樁號的橫斷面方向）
   - 偏角 θ（度）：0＝垂直中心線（預設）；平面上逆時針為正；上限 ±60°
   - 存在 state.secExt[樁號 toFixed(2)].rot（同樁號的上／下斷面共用），隨專案、復原、多中心線一起保存
   - 樁號與中心線不動：斷面線以與中心線交點為軸旋轉；地形取樣、平面斷面線、DXF CROSS_STATIONS 都依新方向
   - 防砂壩（結構物）所在樁號不套用偏角
   - 設定：左側「橫斷面編輯」卡輸入，或「↻ 平面點選方向」工具（可用鎖點對準岸邊特徵點）
   ============================================================================ */
const SECROT_MAX = 60;
function secRotKey(s) { return (+s).toFixed(2); }
function secRotBlocked(s) { return (state.structs || []).some(st => Math.abs(st.sta - s) < 0.03); }
function secRotRaw(s) { const o = (state.secExt || {})[secRotKey(s)]; const v = o ? +o.rot : 0; return Number.isFinite(v) ? v : 0; }
function secRotOf(s) { const v = secRotRaw(s); return v && !secRotBlocked(s) ? Math.max(-SECROT_MAX, Math.min(SECROT_MAX, v)) : 0; }
function secRotGeom(g, s) {
  const th = secRotOf(s); if (!g || !th) return g;
  const a = th * Math.PI / 180, c = Math.cos(a), si = Math.sin(a), nx = g.nx * c - g.ny * si, ny = g.nx * si + g.ny * c;
  return Object.assign({}, g, { nx, ny, normalAz: ((g.normalAz - th) % 360 + 360) % 360 });
}
function secRotTxt(sec) { return sec && sec.rot ? `　斜交 ${secRotFmt(sec.rot)}` : ''; }
function secRotFmt(v) { return (v > 0 ? '+' : '') + (+v.toFixed(2)) + '°'; }
function secRotSet(s, v, quiet) {
  const k = secRotKey(s), E = state.secExt || (state.secExt = {});
  if (secRotBlocked(s) && v) { updateStatus('⚠ 此樁號有防砂壩（結構物），斷面依壩軸繪製，不套用偏角。'); secRotSync(); return false; }
  v = Number.isFinite(v) ? Math.max(-SECROT_MAX, Math.min(SECROT_MAX, Math.round(v * 100) / 100)) : 0;
  if (!quiet) pushUndoSnapshot();
  const o = E[k] || (E[k] = {});
  if (!v) { delete o.rot; if (!Object.keys(o).length) delete E[k]; } else o.rot = v;
  rebuildAlignmentAndSections();
  const n = secRotCross(); updateStatus(`${formatStation(s)} 橫斷面偏角＝${v ? secRotFmt(v) : '0°（垂直中心線）'}` + (n.length ? `；⚠ 與相鄰斷面交叉：${n.join('、')}` : ''));
  return true;
}
/* 偏過的斷面線在讀取範圍內與相鄰斷面交叉 → 回傳樁號清單 */
function secRotCross() {
  const S = state.sections || [], out = [];
  const X = (a, b) => { const d = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); const p1 = [a.lx, a.ly], p2 = [a.rx, a.ry], q1 = [b.lx, b.ly], q2 = [b.rx, b.ry];
    return d(p1, p2, q1) * d(p1, p2, q2) < 0 && d(q1, q2, p1) * d(q1, q2, p2) < 0; };
  for (let i = 0; i + 1 < S.length; i++) { const a = S[i], b = S[i + 1]; if (!(a.rot || b.rot) || Math.abs(b.sta - a.sta) < 0.02) continue; if (X(a, b)) out.push(`${a.shortStaLabel}／${b.shortStaLabel}`); }
  return out;
}
function secRotEdit(el) {
  const sec = (state.sections || [])[state.selectedStaIdx]; if (!sec) return;
  const t = el.value.trim(), v = t === '' ? 0 : parseFloat(t); if (t !== '' && !Number.isFinite(v)) { secRotSync(); return; }
  secRotSet(sec.sta, v);
}
function secRotSync() {
  const el = document.getElementById('cv_ROT'), info = document.getElementById('cv_ROTinfo'), sec = (state.sections || [])[state.selectedStaIdx]; if (!el) return;
  const bl = sec && secRotBlocked(sec.sta), v = sec ? secRotRaw(sec.sta) : 0;
  if (el !== document.activeElement) { el.value = v ? +v.toFixed(2) : ''; el.placeholder = bl ? '壩位' : '0'; el.style.color = v ? 'var(--cad-amber)' : '#8b9bb4'; }
  el.disabled = !sec || bl;
  if (info) { const n = secRotCross(); info.innerHTML = (bl ? '此樁號有防砂壩，不套用偏角。' : '') + (n.length ? `<b style="color:#f59e0b;">⚠ 斷面交叉：${n.join('、')}</b>` : ''); }
}
function secRotUI() {
  if (document.getElementById('cv_ROT')) return;
  const rr = document.getElementById('cv_RR'); if (!rr) return; const grid = rr.parentElement.parentElement;
  const d = document.createElement('div'); d.id = 'secRotBox'; d.style.cssText = 'margin-top:6px;';
  d.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;align-items:end;">
    <div><div style="font-size:10.5px;color:var(--text-muted);text-align:center;">斷面偏角 θ (°)</div><input class="vip-in" id="cv_ROT" type="text" inputmode="decimal" style="text-align:center;" title="0＝垂直中心線；平面上逆時針為正，上限 ±${SECROT_MAX}°。樁號與中心線不動，斷面線以中心點為軸旋轉。清空＝回到垂直" onchange="secRotEdit(this)"></div>
    <button class="btn" id="toolSecRot" style="justify-content:center;" onclick="secRotTool()" title="切到平面圖，移動游標決定目前樁號斷面線的方向（可鎖點對準岸邊特徵點），點一下設定；Esc 結束">↻ 平面點選方向</button>
    <button class="btn" style="justify-content:center;" onclick="(s=>s&&secRotSet(s.sta,0))((state.sections||[])[state.selectedStaIdx])" title="本樁斷面回到垂直中心線">偏角歸零</button></div>
    <div id="cv_ROTinfo" style="font-size:10.5px;color:var(--text-muted);margin-top:3px;"></div>`;
  grid.after(d); secRotSync();
}
function secRotTool() {
  const sec = (state.sections || [])[state.selectedStaIdx]; if (!sec) { alert('請先產生斷面並選定樁號。'); return; }
  if (secRotBlocked(sec.sta)) { updateStatus('⚠ 此樁號有防砂壩（結構物），不套用偏角。'); return; }
  if (state.viewMode !== '2D') setViewMode('2D'); setTool('SEC_ROT');
  try {   // 斷面不在畫面內或太小 → 置中、放大
    const c = state.cam2D, r = cadCanvas.getBoundingClientRect(), q = worldToScreen2D(sec.cx, sec.cy), L = Math.max(sec.readL, sec.readR, 5), need = r.width * 0.35 / (2 * L);
    if (c && (q.x < 0 || q.y < 0 || q.x > r.width || q.y > r.height || c.scale < need)) { c.cx = sec.cx; c.cy = sec.cy; if (c.scale < need) c.scale = need; requestRedraw(); }
  } catch (e) { }
}
/* 游標（含鎖點）→ 偏角 */
function secRotPick(mx, my) {
  const sec = (state.sections || [])[state.selectedStaIdx]; if (!sec) return null;
  const g = getPointAndNormalAtStation(sec.sta); if (!g) return null;
  const sn = typeof dzSnapPt === 'function' ? dzSnapPt(mx, my) : null, w = sn || screenToWorld2D(mx, my);
  const vx = w.x - g.x, vy = w.y - g.y; if (Math.hypot(vx, vy) < 0.05) return null;
  let th = Math.atan2(g.nx * vy - g.ny * vx, g.nx * vx + g.ny * vy) * 180 / Math.PI;
  if (th > 90) th -= 180; else if (th < -90) th += 180;
  const over = Math.abs(th) > SECROT_MAX; th = Math.max(-SECROT_MAX, Math.min(SECROT_MAX, th));
  return { sec, g, th: Math.round(th * 100) / 100, over, sn, w };
}
(function () {
  const _st = setTool; setTool = function (tool) {
    _st.apply(this, arguments);
    const b = document.getElementById('toolSecRot'); if (b) b.classList.toggle('active', tool === 'SEC_ROT');
    const h = document.getElementById('hudToolTip');
    if (tool === 'SEC_ROT' && h) { const s = (state.sections || [])[state.selectedStaIdx]; h.innerHTML = `↻【斷面方向】${s ? s.shortStaLabel : ''}：移動游標決定斷面線方向（虛線＝垂直中心線），點一下設定；可用鎖點（F3）對準岸邊特徵點；Esc 或「✋ 平移」結束。`; }
    if (tool !== 'SEC_ROT') { const ov = document.getElementById('axisOverlay'); if (ov && AXOV_ON) { ov.getContext('2d').clearRect(0, 0, ov.width, ov.height); } }
  };
  window.addEventListener('mousedown', e => {
    if (state.activeTool !== 'SEC_ROT' || e.button !== 0 || state.viewMode !== '2D') return;
    if (e.target && e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const r = cadCanvas.getBoundingClientRect(), p = secRotPick(e.clientX - r.left, e.clientY - r.top); if (!p) return;
    secRotSet(p.sec.sta, p.th); axisOvDraw();
  }, true);
  window.addEventListener('mousemove', () => { if (state.activeTool === 'SEC_ROT') axisOvDraw(); });
  window.addEventListener('keydown', e => {
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'Escape' && state.activeTool === 'SEC_ROT') { e.preventDefault(); setTool('PAN'); updateStatus('已結束斷面方向設定。'); }
  }, true);
  const _ao = axisOvDraw; axisOvDraw = function () {
    if (!(state.activeTool === 'SEC_ROT' && state.viewMode === '2D' && AXOV_LAST)) return _ao.apply(this, arguments);
    const ov = document.getElementById('axisOverlay'), cv = document.getElementById('cadCanvas'); if (!ov || !cv) return;
    const d = window.devicePixelRatio || 1, r = cv.getBoundingClientRect(), W = Math.round(r.width * d), H = Math.round(r.height * d); if (ov.width !== W || ov.height !== H) { ov.width = W; ov.height = H; }
    const oc = ov.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, ov.width, ov.height); AXOV_ON = true; oc.setTransform(d, 0, 0, d, 0, 0);
    const p = secRotPick(AXOV_LAST.x, AXOV_LAST.y); if (!p) return;
    const { sec, g } = p, L = Math.max(sec.readL, sec.readR), c = worldToScreen2D(g.x, g.y);
    const ln = (nx, ny, col, dash, wd) => { const a = worldToScreen2D(g.x + nx * L, g.y + ny * L), b = worldToScreen2D(g.x - nx * L, g.y - ny * L); oc.strokeStyle = col; oc.lineWidth = wd; oc.setLineDash(dash); oc.beginPath(); oc.moveTo(a.x, a.y); oc.lineTo(b.x, b.y); oc.stroke(); oc.setLineDash([]); };
    ln(g.nx, g.ny, 'rgba(148,163,184,0.8)', [5, 4], 1.2);
    const a = p.th * Math.PI / 180, nx = g.nx * Math.cos(a) - g.ny * Math.sin(a), ny = g.nx * Math.sin(a) + g.ny * Math.cos(a);
    ln(nx, ny, p.over ? '#f87171' : '#fb923c', [], 2.2);
    oc.fillStyle = '#fb923c'; oc.beginPath(); oc.arc(c.x, c.y, 4, 0, Math.PI * 2); oc.fill();
    if (p.sn) { const s = worldToScreen2D(p.sn.x, p.sn.y); oc.strokeStyle = p.sn.type === 'mid' ? '#22d3ee' : '#ff00ff'; oc.lineWidth = 2; oc.strokeRect(s.x - 6, s.y - 6, 12, 12); }
    const t = [`${sec.shortStaLabel} 偏角 ${secRotFmt(p.th)}` + (p.th ? '' : '（垂直）'), p.over ? `已達上限 ±${SECROT_MAX}°` : '點一下設定；Esc 結束'];
    if (typeof cldBox === 'function') cldBox(oc, AXOV_LAST.x, AXOV_LAST.y, t, '#fb923c');
  };
  const _sc = syncCrossEdit; syncCrossEdit = function () { const r = _sc.apply(this, arguments); try { secRotUI(); secRotSync(); } catch (er) { } return r; };
})();
window.addEventListener('load', () => setTimeout(() => { try { secRotUI(); } catch (e) { } }, 40));
