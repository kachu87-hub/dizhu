/* ============================================================================
   v6.7 中心線鎖點與插入 IP
   A. 鎖點設定移到「平面工具」卡片：🧲 鎖點（F3）、□ 端點、△ 中點、長度吸附；設定隨專案存檔
   B. 中點鎖點：DXF 線各段、中心線各段（含繪製中）、整治區／基準線／擋土牆／暫存線各段的中點
   C. 插入 IP：「➕ 插入 IP」工具或平移模式 Shift＋點中心線；IP 表每列「＋」＝在此 IP 與下一點中點插入
   D. 由 EP 接續延長：保留原 IP，從 EP 繼續點選，結束後只更新縱斷面末端 VIP
   ============================================================================ */
state.snapCfg = Object.assign({ end: true, mid: true }, state.snapCfg || {});
const IPX = { ext: false, hov: null };
function ipxNorm(o) { o = o || {}; return { end: o.end !== false, mid: o.mid !== false }; }

/* ---- B. 鎖點：端點＋中點（覆寫 dzSnapPt，回傳 {x,y,type}） ---- */
dzSnapPt = function (mx, my) {
  if (state.dzSnap === false || (AXOV_LAST && AXOV_LAST.alt)) return null;
  const cfg = state.snapCfg || {}, E = cfg.end !== false, M = cfg.mid !== false; if (!E && !M) return null;
  const w = screenToWorld2D(mx, my), tol = 10 / dzPxM(); let best = null, bd = tol * tol;
  const test = (x, y, t) => { const dx = x - w.x; if (dx > tol || dx < -tol) return; const dy = y - w.y; if (dy > tol || dy < -tol) return; const d = dx * dx + dy * dy; if (d < bd || (d === bd && t === 'end')) { bd = d; best = { x, y, type: t }; } };
  const seq = (P, gx, gy, skip) => { for (let i = 0; i < P.length; i++) { const p = P[i]; if (p === skip) continue; const x = gx(p), y = gy(p); if (E) test(x, y, 'end');
    if (M && i > 0 && P[i - 1] !== skip) { const q = P[i - 1], qx = gx(q), qy = gy(q); test((x + qx) / 2, (y + qy) / 2, 'mid'); } } };
  const ox = p => p.x, oy = p => p.y, ax = p => p[0], ay = p => p[1];
  (state.rawCadPolys || []).forEach(pl => seq(pl.pts || [], ox, oy));
  if (E) (state.points || []).forEach(p => test(p.x, p.y, 'end'));
  seq(state.axisNodes || [], ox, oy);
  seq(state.tempAxisNodes || [], ox, oy);
  const dg = state.dzDrag && state.dzDrag.pt;
  (state.dzCases || []).forEach(c => { const Z = c.zone || []; seq(Z, ax, ay, dg); if (M && Z.length > 2 && Z[0] !== dg && Z[Z.length - 1] !== dg) test((Z[0][0] + Z[Z.length - 1][0]) / 2, (Z[0][1] + Z[Z.length - 1][1]) / 2, 'mid');
    seq(c.bl || [], ax, ay, dg); (c.swalls || []).forEach(s => seq(s.pts || [], ax, ay, dg)); });
  seq(state.dzTmp || [], ax, ay);
  return best;
};
/* 鎖點符號：□ 端點、△ 中點（畫在原洋紅方框上，加文字） */
function ipxSnapMark(oc) {
  if (state.viewMode !== '2D' || !AXOV_LAST) return; const tl = state.activeTool;
  if (tl !== 'DRAW_AXIS' && !(typeof dzOvActive === 'function' && dzOvActive())) return;
  const sn = dzSnapPt(AXOV_LAST.x, AXOV_LAST.y); if (!sn) return; const s = worldToScreen2D(sn.x, sn.y);
  oc.save(); oc.lineWidth = 2;
  if (sn.type === 'mid') { oc.clearRect(s.x - 8, s.y - 8, 16, 16); oc.strokeStyle = '#22d3ee'; oc.beginPath(); oc.moveTo(s.x, s.y - 8); oc.lineTo(s.x + 7, s.y + 5); oc.lineTo(s.x - 7, s.y + 5); oc.closePath(); oc.stroke(); }
  oc.font = 'bold 11px "Noto Sans TC"'; oc.textAlign = 'right'; oc.textBaseline = 'bottom'; const t = sn.type === 'mid' ? '中點' : '端點';
  oc.lineWidth = 3; oc.strokeStyle = 'rgba(7,10,15,0.9)'; oc.strokeText(t, s.x - 9, s.y - 7); oc.fillStyle = sn.type === 'mid' ? '#22d3ee' : '#ff00ff'; oc.fillText(t, s.x - 9, s.y - 7); oc.restore();
}

/* ---- C. 插入 IP ---- */
function ipxNearSeg(wx, wy) {   // 最近的中心線切線段 → { i（插在 i 之前）, x, y, d }
  const N = state.axisNodes || []; let best = null;
  for (let i = 1; i < N.length; i++) { const a = N[i - 1], b = N[i], dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy; if (!L2) continue;
    const t = Math.max(0, Math.min(1, ((wx - a.x) * dx + (wy - a.y) * dy) / L2)), x = a.x + t * dx, y = a.y + t * dy, d = Math.hypot(wx - x, wy - y);
    if (!best || d < best.d) best = { i, x, y, d, t, L: Math.sqrt(L2) }; }
  return best;
}
function ipxPick(mx, my) {     // 游標附近（中心線或切線 12 px 內）可插入的位置
  const N = state.axisNodes || []; if (N.length < 2) return null;
  const w = screenToWorld2D(mx, my), tol = 12 / dzPxM(), pr = projectWorldPointToAlignment(w.x, w.y);
  let g = ipxNearSeg(w.x, w.y); if (!g) return null;
  if (g.d > tol) { if (!pr || pr.dist > tol) return null; g = ipxNearSeg(pr.x, pr.y); if (!g) return null; }
  const mn = 0.5 / g.L; if (g.t < mn || g.t > 1 - mn) return null;   // 太靠近既有 IP
  return g;
}
function ipxInsertAt(i, x, y) {
  const N = state.axisNodes; if (!N || i < 1 || i >= N.length) return;
  const a = N[i - 1], b = N[i]; if (Math.hypot(x - a.x, y - a.y) < 0.5 || Math.hypot(x - b.x, y - b.y) < 0.5) { updateStatus('⚠ 太靠近既有 IP（< 0.5 m），未插入。'); return; }
  const L = state.alignment.ipList || [], la = L[i - 1] || {}, lb = L[i] || {}, da = Math.hypot(x - a.x, y - a.y), db = Math.hypot(x - b.x, y - b.y);
  const inCurve = (i - 1 > 0 && da < (la.tl || 0) - 1e-6) || (i < N.length - 1 && db < (lb.tl || 0) - 1e-6);
  const defR = Math.max(0, parseFloat((document.getElementById('defaultIpRadius') || {}).value) || 0);
  pushUndoSnapshot(); N.splice(i, 0, { x: +x.toFixed(3), y: +y.toFixed(3), r: defR });
  rebuildAlignmentAndSections();
  const lab = (state.alignment.ipList[i] || {}).label || ('IP' + i);
  updateStatus(`➕ 已在 ${la.label || ''}～${lb.label || ''} 之間插入 ${lab}（${x.toFixed(3)}, ${y.toFixed(3)}），後面的 IP 依序重新編號。` + (inCurve ? '⚠ 插入點落在相鄰曲線的切線長範圍內，該曲線會被縮短，里程會改變。' : '新 IP 在原直線上，里程與結構物位置不變；可拖曳調整或雙擊改 R。'));
}
function ipxInsertMid(i) { const N = state.axisNodes; if (!N || i < 0 || i + 1 >= N.length) return; ipxInsertAt(i + 1, (N[i].x + N[i + 1].x) / 2, (N[i].y + N[i + 1].y) / 2); }
function ipxTool() { if (state.viewMode !== '2D') setViewMode('2D'); if ((state.axisNodes || []).length < 2) { alert('請先繪製中心線。'); return; } setTool('INS_IP'); }

/* ---- D. 由 EP 接續延長 ---- */
function ipxExtend() {
  const N = state.axisNodes || []; if (N.length < 2) { alert('請先繪製中心線。'); return; }
  if (state.viewMode !== '2D') setViewMode('2D');
  setTool('DRAW_AXIS'); const defR = Math.max(0, parseFloat((document.getElementById('defaultIpRadius') || {}).value) || 0);
  state.tempAxisNodes = N.map((p, k) => ({ x: p.x, y: p.y, r: k === N.length - 1 ? defR : p.r })); IPX.ext = N.length;
  updateStatus(`➡ 由 EP 接續延長「${typeof clName === 'function' ? clName() : '中心線'}」：從目前 EP 繼續點選新點，右鍵／Enter／雙擊結束；Backspace 退回；Esc 取消（原中心線不變）。`); requestRedraw(); axisOvDraw();
}
(function () {
  const _fin = finishAxisDrawing; finishAxisDrawing = function () {
    const n0 = IPX.ext; IPX.ext = false;
    if (!n0) return _fin.apply(this, arguments);
    const T = state.tempAxisNodes || [];
    if (T.length <= n0) { state.tempAxisNodes = []; setTool('PAN'); updateStatus('未新增延長點，中心線不變。'); return; }
    const C = T.slice(0, n0); for (let k = n0; k < T.length; k++) { const q = C[C.length - 1]; if (Math.hypot(T[k].x - q.x, T[k].y - q.y) > 0.05) C.push(T[k]); }
    if (C.length <= n0) { state.tempAxisNodes = []; setTool('PAN'); updateStatus('未新增延長點，中心線不變。'); return; }
    pushUndoSnapshot(); const L0 = state.alignment.endSta;
    state.axisNodes = C.map((p, k, A) => ({ x: p.x, y: p.y, r: k === 0 || k === A.length - 1 ? 0 : p.r })); state.tempAxisNodes = [];
    rebuildAlignmentAndSections();
    const P = state.profile, al = state.alignment, ep = state.axisNodes[state.axisNodes.length - 1], z = typeof sampleTINElevationRobust === 'function' ? sampleTINElevationRobust(ep.x, ep.y) : null;
    if (P.vips && P.vips.length >= 2) { P.vips.sort((a, b) => a.sta - b.sta); const l = P.vips[P.vips.length - 1]; l.sta = al.endSta;
      if (z !== null) { const dropSum = (P.drops || []).filter(d => d.sta > al.startSta && d.sta <= al.endSta).reduce((a, d) => a + d.dz, 0); l.z = +(z + dropSum).toFixed(2); } rebuildAlignmentAndSections(); }
    setTool('PAN');
    updateStatus(`✅ 已由 EP 延長中心線：新增 ${C.length - n0} 點，全長 ${formatStation(L0)} → ${formatStation(al.endSta)}（原 IP 與里程不變；縱斷面末端 VIP 移到新 EP${z !== null ? '並貼合地面' : ''}）。`);
  };
  const _st = setTool; setTool = function (tool) {
    if (tool !== 'DRAW_AXIS') IPX.ext = false; IPX.hov = null; if (tool === 'INS_IP') state.hoveredIPIdx = -1;
    _st.apply(this, arguments);
    const b = document.getElementById('toolInsIP'); if (b) b.classList.toggle('active', tool === 'INS_IP');
    const h = document.getElementById('hudToolTip');
    if (tool === 'INS_IP' && h) h.innerHTML = '➕【插入 IP】：移到中心線上（顯示黃色預覽）點一下即插入 IP，可連續插入；Esc 或按「✋ 平移/改IP」結束。新 IP 落在原直線上，里程不變。平移模式下 Shift＋點中心線也可插入。';
    if (tool === 'DRAW_AXIS' && h) h.innerHTML += '　<b>F3</b>＝鎖點開關；Alt＝暫時不鎖點。';
    if (tool === 'PAN' && h) h.innerHTML += '　<b>Shift＋點中心線</b>＝插入 IP。';
    ipxSyncUI();
  };
  // 延長時 Backspace 不退到原有的點
  const _un = dzAxisUndo; dzAxisUndo = function () { if (IPX.ext && state.tempAxisNodes.length <= IPX.ext) { updateStatus('↶ 已退到原 EP（原有 IP 不可退回）；繼續點選延長，或 Esc 取消。'); return; } return _un.apply(this, arguments); };
  // 插入 IP：工具模式點擊、平移模式 Shift＋點擊
  window.addEventListener('mousedown', e => {
    if (e.target && e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') return; if (e.button !== 0 || state.viewMode !== '2D') return;
    const tl = state.activeTool; if (!(tl === 'INS_IP' || (tl === 'PAN' && e.shiftKey && !(state.hoveredIPIdx >= 0)))) return;
    const r = cadCanvas.getBoundingClientRect(), g = ipxPick(e.clientX - r.left, e.clientY - r.top);
    if (!g) { if (tl === 'INS_IP') { e.preventDefault(); e.stopImmediatePropagation(); updateStatus('⚠ 游標附近沒有中心線（或太靠近既有 IP），請移到中心線上再點。'); } return; }
    e.preventDefault(); e.stopImmediatePropagation(); ipxInsertAt(g.i, g.x, g.y); IPX.hov = null; axisOvDraw();
  }, true);
  window.addEventListener('mousemove', e => { IPX.shiftDown = e.shiftKey; if (state.activeTool === 'INS_IP' || (state.activeTool === 'PAN' && e.shiftKey) || IPX.hov) axisOvDraw(); });
  window.addEventListener('keydown', e => {
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'F3') { e.preventDefault(); ipxSet('on', state.dzSnap === false); updateStatus(state.dzSnap !== false ? '🧲 鎖點：開（F3 關閉）' : '🧲 鎖點：關（F3 開啟）'); if (state.activeTool === 'DRAW_AXIS') axisOvDraw(); return; }
    if (e.key === 'Escape' && state.activeTool === 'INS_IP') { e.preventDefault(); setTool('PAN'); updateStatus('已結束插入 IP。'); }
  }, true);
  // 覆蓋層：插入 IP 預覽、鎖點符號
  const _ao = axisOvDraw; axisOvDraw = function () {
    const ins = state.viewMode === '2D' && AXOV_LAST && (state.activeTool === 'INS_IP' || (state.activeTool === 'PAN' && IPX.shiftDown));
    if (!ins) { if (IPX.hov) { IPX.hov = null; const ov = document.getElementById('axisOverlay'); if (ov) ov.getContext('2d').clearRect(0, 0, ov.width, ov.height); } _ao.apply(this, arguments); try { const ov = document.getElementById('axisOverlay'); if (ov && AXOV_ON) { const oc = ov.getContext('2d'), d = window.devicePixelRatio || 1; oc.setTransform(d, 0, 0, d, 0, 0); ipxSnapMark(oc); } } catch (er) { console.error('ipxMark', er); } return; }
    const ov = document.getElementById('axisOverlay'), cv = document.getElementById('cadCanvas'); if (!ov || !cv) return;
    const d = window.devicePixelRatio || 1, r = cv.getBoundingClientRect(), W = Math.round(r.width * d), H = Math.round(r.height * d); if (ov.width !== W || ov.height !== H) { ov.width = W; ov.height = H; }
    const oc = ov.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, ov.width, ov.height); AXOV_ON = true; oc.setTransform(d, 0, 0, d, 0, 0);
    const g = ipxPick(AXOV_LAST.x, AXOV_LAST.y); IPX.hov = g || true; if (!g) return;
    const N = state.axisNodes, a = worldToScreen2D(N[g.i - 1].x, N[g.i - 1].y), b = worldToScreen2D(N[g.i].x, N[g.i].y), s = worldToScreen2D(g.x, g.y);
    oc.strokeStyle = '#fde047'; oc.lineWidth = 2; oc.setLineDash([6, 4]); oc.beginPath(); oc.moveTo(a.x, a.y); oc.lineTo(s.x, s.y); oc.lineTo(b.x, b.y); oc.stroke(); oc.setLineDash([]);
    oc.fillStyle = '#fde047'; oc.beginPath(); oc.arc(s.x, s.y, 6, 0, Math.PI * 2); oc.fill(); oc.strokeStyle = '#0b1018'; oc.lineWidth = 1.5; oc.stroke();
    const L = state.alignment.ipList || [], pr = projectWorldPointToAlignment(g.x, g.y);
    cldBox(oc, s.x, s.y, [`插入 IP（${(L[g.i - 1] || {}).label || ''}～${(L[g.i] || {}).label || ''} 之間）`, `距前點 ${Math.hypot(g.x - N[g.i - 1].x, g.y - N[g.i - 1].y).toFixed(2)} m　距後點 ${Math.hypot(N[g.i].x - g.x, N[g.i].y - g.y).toFixed(2)} m`].concat(pr ? [`里程約 ${formatStation(pr.sta)}`] : []), '#fde047');
  };
  window.addEventListener('keydown', e => { if (e.key === 'Shift') { IPX.shiftDown = true; if (state.activeTool === 'PAN') axisOvDraw(); } }, true);
  window.addEventListener('keyup', e => { if (e.key === 'Shift') { IPX.shiftDown = false; if (IPX.hov) axisOvDraw(); } }, true);
  window.addEventListener('blur', () => { IPX.shiftDown = false; });
  // IP 表：每列加「＋」（在此 IP 與下一點的中點插入）
  const _re = renderIPEditor; renderIPEditor = function () {
    _re.apply(this, arguments);
    try { const body = document.getElementById('ipeBody'); if (!body || !body.children.length) return; const rows = [...body.children], n = rows.length;
      const hr = body.parentNode && body.parentNode.querySelector('thead tr'); if (hr && !hr.querySelector('.ipx-th')) { const th = document.createElement('th'); th.className = 'ipx-th'; hr.appendChild(th); }
      rows.forEach((tr, i) => { const td = document.createElement('td'); if (i < n - 1) { td.className = 'x-btn'; td.style.color = 'var(--cad-green)'; td.style.fontWeight = '700'; td.textContent = '＋'; td.title = `在 ${i === 0 ? 'BP' : 'IP' + i} 與下一點的中點插入 IP（里程不變）`; td.onclick = ev => { ev.stopPropagation(); ipxInsertMid(i); }; } tr.appendChild(td); });
    } catch (er) { console.error('ipxIPE', er); }
  };
  // 專案存檔
  const _cp = collectProject; collectProject = function () { const o = _cp.apply(this, arguments); try { o.data.snapCfg = ipxNorm(state.snapCfg); } catch (er) { } return o; };
  const _ap = applyProject; applyProject = function (obj) { state.snapCfg = ipxNorm(obj && obj.data && obj.data.snapCfg); IPX.ext = false; const r = _ap.apply(this, arguments); ipxSyncUI(); return r; };
  // 中心線卡片原「繪線鎖點」勾選改到平面工具卡片（避免兩處）
  const _cu = clUI; clUI = function () { const r = _cu.apply(this, arguments); try { const box = document.getElementById('clBox'); if (box) box.querySelectorAll('input[type=checkbox]').forEach(cb => { if (/state\.dzSnap/.test(cb.getAttribute('onchange') || '')) { const lb = cb.closest('label'); (lb || cb).style.display = 'none'; } }); } catch (er) { } return r; };
})();

/* ---- A. 平面工具卡片：鎖點列＋插入 IP／延長按鈕 ---- */
function ipxSet(k, v) {
  if (k === 'on') state.dzSnap = !!v; else if (k === 'end' || k === 'mid') { state.snapCfg[k] = !!v; if (v) state.dzSnap = true; }
  ipxSyncUI(); requestRedraw(); if (state.activeTool === 'DRAW_AXIS') axisOvDraw();
}
function ipxSyncUI() {
  const on = state.dzSnap !== false, c = state.snapCfg || {};
  const t = (id, a, txt) => { const b = document.getElementById(id); if (!b) return; b.classList.toggle('active', !!a); b.style.opacity = on || id === 'snapOn' ? '1' : '0.45'; if (txt) b.textContent = txt; };
  t('snapOn', on, on ? '🧲 鎖點 開' : '🧲 鎖點 關'); t('snapEnd', c.end !== false); t('snapMid', c.mid !== false);
}
function ipxInitUI() {
  const tools = document.getElementById('planToolsGroup'); if (!tools || document.getElementById('ipxRow')) return;
  if (!document.getElementById('ipxCss')) { const s = document.createElement('style'); s.id = 'ipxCss'; s.textContent = `
    #ipxRow, #ipxRow2 { grid-column: 1 / -1; display:flex; flex-wrap:wrap; align-items:center; gap:4px; padding:4px 6px; border:1px solid var(--border, #334155); border-radius:6px; }
    #ipxRow .lbl { font-size:11px; color:var(--text-muted); margin-right:2px; }
    #ipxRow .btn { padding:3px 7px; font-size:11.5px; }
    #ipxRow .btn.active { background:#0e7490; color:#fff; border-color:#22d3ee; }
    #ipxRow select { font-size:11.5px; padding:2px 4px; }
    #ipxRow2 { border:none; padding:0; display:grid; grid-template-columns:1fr 1fr; gap:6px; }
    #ipxRow2 .btn { justify-content:center; }`; document.head.appendChild(s); }
  const row = document.createElement('div'); row.id = 'ipxRow'; row.title = '繪中心線（及整治區、基準線等點繪工具）時的鎖點設定；F3＝鎖點開關，按住 Alt＝暫時不鎖點';
  row.innerHTML = `<span class="lbl">繪線鎖點</span>
    <button class="btn" id="snapOn" onclick="ipxSet('on', state.dzSnap === false)" title="鎖點總開關（快捷鍵 F3）">🧲 鎖點</button>
    <button class="btn" id="snapEnd" onclick="ipxSet('end', !(state.snapCfg.end !== false))" title="端點：DXF 線頂點、測點、IP、整治區／基準線頂點">□ 端點</button>
    <button class="btn" id="snapMid" onclick="ipxSet('mid', !(state.snapCfg.mid !== false))" title="中點：DXF 線、中心線、整治區／基準線各段的中點">△ 中點</button>
    <span class="lbl" style="margin-left:6px;" title="無物件鎖點時，段長取整到此間距（方向不變）；Shift＝不吸附">長度吸附</span>`;
  const old = document.getElementById('cldSnap');
  if (old) { const fr = old.closest('.form-row'); row.appendChild(old); if (fr && !fr.querySelector('select, input')) fr.remove(); }
  else { const s = document.createElement('select'); s.className = 'input-select'; s.id = 'cldSnap'; s.onchange = function () { cldSet('snap', this.value); }; s.innerHTML = '<option value="0">不吸附</option><option value="0.5">0.5 m</option><option value="1">1 m</option>'; row.appendChild(s); }
  const row2 = document.createElement('div'); row2.id = 'ipxRow2';
  row2.innerHTML = `<button class="btn amber" id="toolInsIP" onclick="ipxTool()" title="在既有中心線上點一下插入 IP（落在原直線上，里程不變），可連續插入；平移模式下 Shift＋點中心線也可插入">➕ 插入 IP</button>
    <button class="btn" id="toolExtEP" onclick="ipxExtend()" title="保留原 BP～IP，從 EP 繼續點選延長中心線；原里程不變，縱斷面末端 VIP 移到新 EP">➡ 由 EP 接續延長</button>`;
  const da = document.getElementById('toolDrawAxis'), host = tools;
  // 放在「繪中心線」那一列之後（兩欄格線：插在下一個按鈕之後）
  let anchor = da; if (da) { const sib = [...host.children], k = sib.indexOf(da); anchor = sib[k % 2 === 0 ? k + 1 : k] || da; }
  if (anchor && anchor.parentNode === host) { anchor.after(row); row.after(row2); } else { host.appendChild(row); host.appendChild(row2); }
  if (typeof cldUI === 'function') cldUI(); ipxSyncUI();
}
window.addEventListener('load', () => setTimeout(ipxInitUI, 30));
