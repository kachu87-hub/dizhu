/* ============================================================================
   v8.6：介面 U3（平面膠囊工具列）、U5（抽屜「物件清單」頁）、K4（修改中心線時物件保持平面位置）
         ＋ DEM 卡片標題依資料來源顯示
   U3 「平面工具」卡片的按鈕搬到平面圖正上方，與縱斷、橫斷、3D 同位置、同外觀（按鈕 id 與功能不變）
   U5 底部抽屜加「物件清單」：結構物、護岸、排水溝、整地、護坡基礎補強的起訖樁號，可直接改，點列跳到該物件；
      右下「工作內容」浮框改由此頁取代（畫面上的浮框預設不再畫，DXF 的工作內容表不受影響）
   K4 拖 IP、改 R、插入／刪除 IP 後，物件端點維持原本的平面座標，樁號依新中心線重算；
      縱斷面 VIP 與各樁手動資料維持里程；復原、讀檔、切換主流／支流、改起點樁號時不觸發；設定可關閉
   ============================================================================ */
const V86 = { k4: true, sup: 0, busy: false, cache: null, t: 0, hist: new Map(), hid: 0, tol: 15 };
try { const o = JSON.parse(localStorage.getItem('tc_v86') || 'null'); if (o && typeof o.k4 === 'boolean') V86.k4 = o.k4; } catch (e) { }
function v86Save() { try { localStorage.setItem('tc_v86', JSON.stringify({ k4: V86.k4 })); } catch (e) { } }
const v86El = id => document.getElementById(id);
const v86Fin = x => x !== null && x !== undefined && x !== '' && Number.isFinite(+x);
const v86Fs = s => { try { return formatStation(s); } catch (e) { return (+s).toFixed(2); } };

/* ---------------------------------------------------------------------------
   DEM 卡片標題：依資料來源（線上 Terrarium／內政部圖磚／匯入檔）
   --------------------------------------------------------------------------- */
function v86DemTitle() {
  const D = state.dzDem, on = typeof DNET !== 'undefined' && DNET.on, src = D && D.net ? D.src : (typeof DNET !== 'undefined' ? DNET.src : '');
  let t;
  if (D && !D.net) t = `${Number.isFinite(D.dx) ? Math.round(D.dx) + ' m ' : ''}DEM（匯入檔）`;
  else if (D || on) t = src === 'moi' ? `內政部 ${D && Number.isFinite(D.dx) ? Math.round(D.dx) : 20} m DTM（線上）` : 'SRTM 約 30 m DEM（線上 Terrarium）';
  else t = 'DEM（未載入）';
  return `⛰ ${t}・無實測處補注地形`;
}
function v86DemTitleUI() {
  document.querySelectorAll('#dzMapBox .sec-card > .sec-title > span:first-child').forEach(s => {
    if (!/DEM|DTM/.test(s.textContent) || /底圖/.test(s.textContent)) return;
    if (!s.dataset.v86dem && !/20 m DEM|無實測處補注地形/.test(s.textContent)) return;
    s.dataset.v86dem = 1; const t = v86DemTitle(); if (s.textContent !== t) s.textContent = t;
  });
}
if (typeof dzMapUI === 'function') { const _m = dzMapUI; dzMapUI = function () { const r = _m.apply(this, arguments); try { v86DemTitleUI(); } catch (e) { } return r; }; }
if (typeof dnetLoad === 'function') { const _l = dnetLoad; dnetLoad = async function () { const r = await _l.apply(this, arguments); try { v86DemTitleUI(); } catch (e) { } return r; }; }
if (typeof dnetSet === 'function') { const _s = dnetSet; dnetSet = function () { const r = _s.apply(this, arguments); try { v86DemTitleUI(); } catch (e) { } return r; }; }

/* ---------------------------------------------------------------------------
   K4：物件端點（以里程存的欄位）
   --------------------------------------------------------------------------- */
function v86ClId() { return ((state.cls && state.cls[state.clCur | 0]) || {}).id || 'C0'; }
function v86RvName(rv) { try { return rvName(rv); } catch (e) { return '護岸'; } }
function v86Ends() {   // [{o, k, name, pair}]：pair＝同一段另一端的欄位（檢查不可反轉）
  const E = [], cl = v86ClId();
  const add = (o, k, name, pk) => { if (o && v86Fin(o[k])) E.push({ o, k, name, pk }); };
  (state.structs || []).forEach(s => { if (!s.par) add(s, 'sta', s.name || '結構物'); });
  (state.revs || []).forEach(rv => {
    const nm = v86RvName(rv); add(rv, 's0', nm + ' 起', 's1'); add(rv, 's1', nm + ' 迄', 's0');
    (rv.raises || []).forEach(q => { add(q, 's0', nm + ' 加高段起', 's1'); add(q, 's1', nm + ' 加高段迄', 's0'); });
    (rv.wids || []).forEach(q => { add(q, 's0', nm + ' 變寬段起', 's1'); add(q, 's1', nm + ' 變寬段迄', 's0'); });
    (rv.cps || []).forEach(q => add(q, 's', nm + ' 曲線控制點'));
    (rv.bios || []).forEach(q => add(q, 'sta', nm + ' 生物通道'));
  });
  (state.dns || []).forEach(d => { if (d.mode === 'A' && d.cl === cl) { add(d, 's0', (d.name || '排水溝') + ' 起', 's1'); add(d, 's1', (d.name || '排水溝') + ' 迄', 's0'); } });
  (state.grades || []).forEach(G => { if (G.src !== 'cl') return; add(G, 's0', (G.name || '整地') + ' 起'); add(G, 's1', (G.name || '整地') + ' 迄');
    (G.segs || []).forEach(q => { add(q, 'a', (G.name || '整地') + ' 分段起', 'b'); add(q, 'b', (G.name || '整地') + ' 分段迄', 'a'); }); });
  (state.tfrs || []).forEach(t => { if (t.cl === cl) { add(t, 's0', (t.name || '護坡基礎補強') + ' 起', 's1'); add(t, 's1', (t.name || '護坡基礎補強') + ' 迄', 's0'); } });
  return E;
}
function v86Sig() { const al = state.alignment || {}; return JSON.stringify([v86ClId(), +al.startSta || 0, (state.axisNodes || []).map(p => [+(+p.x).toFixed(3), +(+p.y).toFixed(3), +(+(p.r || 0)).toFixed(3)])]); }
function v86Snap() {   // 建立快取：各端點目前的樁號與平面座標
  const al = state.alignment || {}; if (!al.segments || !al.segments.length) { V86.cache = { sig: v86Sig(), cl: v86ClId(), ends: [], s0: al.startSta, s1: al.endSta }; return; }
  const ends = v86Ends().map(e => { const v = +e.o[e.k], g = getPointAndNormalAtStation(v); return g ? Object.assign(e, { v, x: g.x, y: g.y }) : null; }).filter(Boolean);
  V86.cache = { sig: v86Sig(), cl: v86ClId(), ends, s0: al.startSta, s1: al.endSta };
}
function v86Proj(x, y) {   // 點投影到目前中心線：粗取樣＋局部細化
  const al = state.alignment; if (!al || !al.segments || !al.segments.length) return null;
  const L = al.totalLength, n = Math.max(200, Math.ceil(L * 2)), d = s => { const g = getPointAndNormalAtStation(s); return g ? Math.hypot(x - g.x, y - g.y) : Infinity; };
  let bs = al.startSta, bd = Infinity;
  for (let i = 0; i <= n; i++) { const s = al.startSta + L * i / n, q = d(s); if (q < bd) { bd = q; bs = s; } }
  let a = Math.max(al.startSta, bs - L / n), b = Math.min(al.endSta, bs + L / n);
  for (let k = 0; k < 40; k++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (d(m1) < d(m2)) b = m2; else a = m1; }
  const s = (a + b) / 2; return { sta: s, dist: d(s) };
}
function v86Busy() { return state.draggingIPIdx >= 0 || state.activeTool === 'DRAW_AXIS' || (typeof IPX !== 'undefined' && IPX.ext); }
function v86Apply() {
  V86.t = 0; const C = V86.cache; if (!C) { v86Snap(); return; }
  if (v86Busy()) { V86.t = setTimeout(v86Apply, 350); return; }
  if (!V86.k4 || C.cl !== v86ClId() || C.sig === v86Sig()) { v86Snap(); return; }
  const al = state.alignment || {}; if (!al.segments || !al.segments.length) return;   // 中心線清空中：保留舊快取，等畫好再比對
  const eq = (a, b) => Math.abs(a - b) < 0.005, plan = [], far = [];
  C.ends.forEach(e => {
    if (!v86Fin(e.o[e.k]) || !eq(+e.o[e.k], e.v)) return;   // 使用者已另外改過：不動
    let ns;
    if (eq(e.v, C.s0)) ns = al.startSta; else if (eq(e.v, C.s1)) ns = al.endSta;   // 接在 BP／EP 上：跟著端點
    else { const p = v86Proj(e.x, e.y); if (!p || p.dist > V86.tol) { far.push(e.name + (p ? `（離新中心線 ${p.dist.toFixed(1)} m）` : '')); return; } ns = p.sta; }
    ns = +ns.toFixed(2); if (!eq(ns, e.v)) plan.push({ e, ns });
  });
  // 同一段兩端不可反轉
  const nv = new Map(); plan.forEach(p => { if (!nv.has(p.e.o)) nv.set(p.e.o, {}); nv.get(p.e.o)[p.e.k] = p.ns; });
  const ok = plan.filter(p => { if (!p.e.pk) return true; const o = p.e.o, m = nv.get(o), a = p.ns, b = m[p.e.pk] !== undefined ? m[p.e.pk] : +o[p.e.pk]; if (!v86Fin(b)) return true;
    const lo = /0$|^a$/.test(p.e.k); if (lo ? a < b - 0.05 : a > b + 0.05) return true; far.push(p.e.name + '（移動後會超過另一端）'); return false; });
  if (!ok.length) { v86Snap(); if (far.length) updateStatus(`⚠ 中心線已修改；下列端點離新中心線太遠，樁號未動，請確認：${[...new Set(far)].join('、')}`); return; }
  // 復原：記在修改中心線前的那份快照上
  try { const n = state.undoStack.length - 1, top = n >= 0 ? JSON.parse(state.undoStack[n]) : null;
    if (top && JSON.stringify(top.axisNodes) !== JSON.stringify(state.axisNodes)) { const id = ++V86.hid; top.v86 = id; state.undoStack[n] = JSON.stringify(top); V86.hist.set(id, ok.map(p => [p.e.o, p.e.k, p.e.v])); if (V86.hist.size > 50) V86.hist.delete(V86.hist.keys().next().value); } } catch (e) { }
  ok.forEach(p => { p.e.o[p.e.k] = p.ns; });
  (state.structs || []).sort((a, b) => a.sta - b.sta);
  (state.revs || []).forEach(rv => { if (rv.cps) rv.cps.sort((a, b) => a.s - b.s); });
  if (typeof RV_SIG !== 'undefined') RV_SIG = ''; if (typeof ST_SIG !== 'undefined') ST_SIG = '';
  (state.grades || []).forEach(G => { G._r = null; });
  V86.busy = true; try { rebuildAlignmentAndSections(); } finally { V86.busy = false; }
  v86Snap(); v86SyncPanels();
  const msg = ok.slice(0, 8).map(p => `${p.e.name} ${v86Fs(p.e.v)}→${v86Fs(p.ns)}`).join('、') + (ok.length > 8 ? ` 等 ${ok.length} 處` : '');
  updateStatus(`🧭 中心線已修改，物件維持平面位置：${msg}。${far.length ? `⚠ 未動：${[...new Set(far)].join('、')}。` : ''}可 Ctrl＋Z 復原（設定 ▾ 可關閉）。`);
}
function v86SyncPanels() {
  ['updateCustomStationListUI', 'renderStationMileageTable', 'stRenderList', 'rvUI', 'dnUI', 'grdUI', 'tfrUI'].forEach(f => { try { if (typeof window[f] === 'function') window[f](); } catch (e) { } });
  v86ObjRender(); requestRedraw();
}
{ const _rb = rebuildAlignmentAndSections; rebuildAlignmentAndSections = function () {
    const r = _rb.apply(this, arguments);
    try {
      if (V86.busy) return r;
      const C = V86.cache, sig = v86Sig();
      if (V86.sup || !C || C.cl !== v86ClId()) { if (!V86.t) v86Snap(); }
      else if (C.sig !== sig) {
        const al = state.alignment || {}; if (Math.abs((+al.startSta || 0) - (+C.s0 || 0)) > 1e-6 && JSON.stringify(JSON.parse(C.sig)[2]) === JSON.stringify(JSON.parse(sig)[2])) { clearTimeout(V86.t); V86.t = 0; v86Snap(); }   // 只改起點樁號（K3 負責）
        else { clearTimeout(V86.t); V86.t = setTimeout(v86Apply, 350); }
      } else if (!V86.t) v86Snap();
      if (V83D && V83D.open && V83D.pg === 'obj') { clearTimeout(V86.rt); V86.rt = setTimeout(v86ObjRender, 120); }
    } catch (e) { console.warn('v86', e); }
    return r;
  };
}
function v86Quiet(fn) { return function () { V86.sup++; clearTimeout(V86.t); V86.t = 0; try { return fn.apply(this, arguments); } finally { V86.sup--; if (!V86.sup) { try { v86Snap(); } catch (e) { } } } }; }
if (typeof applyProject === 'function') applyProject = v86Quiet(applyProject);
if (typeof clSwitch === 'function') clSwitch = v86Quiet(clSwitch);
if (typeof clPut === 'function') clPut = v86Quiet(clPut);
if (typeof buildFullDXF === 'function') { const _bf = buildFullDXF; buildFullDXF = function () { V86.sup++; try { return _bf.apply(this, arguments); } finally { V86.sup--; } }; }
{ const _un = undoLastAction; undoLastAction = function () {
    let id = 0; try { const t = state.undoStack[state.undoStack.length - 1]; if (t) id = JSON.parse(t).v86 || 0; } catch (e) { }
    V86.sup++; clearTimeout(V86.t); V86.t = 0; let r;
    try { r = _un.apply(this, arguments);
      const H = id && V86.hist.get(id);
      if (H) { H.forEach(([o, k, v]) => { o[k] = v; }); V86.hist.delete(id); (state.structs || []).sort((a, b) => a.sta - b.sta); if (typeof RV_SIG !== 'undefined') RV_SIG = ''; if (typeof ST_SIG !== 'undefined') ST_SIG = ''; rebuildAlignmentAndSections(); v86SyncPanels(); }
    } finally { V86.sup--; v86Snap(); }
    return r;
  };
}
function v86SetK4(v) { V86.k4 = !!v; v86Save(); v86Snap(); updateStatus(V86.k4 ? '✔ 修改中心線時，物件維持平面位置（樁號自動重算）。' : '修改中心線時，物件維持原里程數字（不再自動重算樁號）。'); }

/* ---------------------------------------------------------------------------
   U3：平面視圖膠囊工具列
   --------------------------------------------------------------------------- */
Object.assign(V83_IC, {
  pan: '<path d="M12 3v18M3 12h18"/><path d="M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>',
  draw: '<path d="M4 19c4-1 5-8 9-9s4 4 7 3"/><circle cx="4" cy="19" r="1.5"/><circle cx="20" cy="13" r="1.5"/>',
  ins: '<path d="M3 18l7-12 7 9"/><circle cx="10" cy="6" r="1.6"/><path d="M19 3v6M16 6h6"/>',
  ext: '<path d="M3 16l6-6 4 3"/><path d="M13 13h8M18 10l3 3-3 3"/>',
  sta: '<path d="M12 3v18M8 7h8"/><circle cx="12" cy="7" r="1.3"/><path d="M4 21h16"/>',
  st: '<path d="M3 20h18M5 20V9h14v11M9 9V5h6v4"/>',
  rv: '<path d="M4 20l4-16M20 20l-4-16"/><path d="M8 4c2 5 6 5 8 0" stroke-dasharray="2 2"/>',
  pt: '<circle cx="12" cy="10" r="3"/><path d="M12 13v8M8 21h8"/>',
  flip: '<path d="M4 20L20 4"/><path d="M4 4h16v16H4z"/>',
  find: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/><path d="M8 13l2-3 2 2 2-3"/>',
  poly: '<path d="M3 18l6-10 6 7 6-11"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>'
});
(function () {
  const s = document.createElement('style');
  s.textContent = `
  #v86PlanBar { position:absolute; z-index:20; display:none; align-items:center; }
  #v86PlanBar.v83-cap { left:50% !important; right:auto !important; top:8px !important; transform:translateX(-50%) !important; flex-wrap:nowrap !important; gap:4px !important; padding:3px 5px !important; border-radius:18px; border:1px solid #3b4a63; background:rgba(11,16,24,.9); white-space:nowrap; }
  #v86PlanBar #ipxRow { display:inline-flex !important; flex-wrap:nowrap; border:none; padding:0 2px; gap:3px; }
  #v86PlanBar #ipxRow .lbl { white-space:nowrap; }
  #v86PlanBar .btn.active { background:#0e7490; color:#fff; border-color:#22d3ee; }
  .v83-mpop #ipxRow { display:flex !important; flex-wrap:wrap; border:none; padding:0; }
  .v86-ph { font-size:11px; color:var(--text-muted); padding:4px 2px; line-height:1.6; }
  /* U5 物件清單 */
  #v86Obj { padding:4px 8px 8px; }
  #v86Obj table { border-collapse:collapse; width:100%; font-size:11.5px; }
  #v86Obj th { position:sticky; top:0; background:#0f1722; color:#94a3b8; font-weight:600; text-align:left; padding:3px 6px; border-bottom:1px solid #3b4a63; white-space:nowrap; }
  #v86Obj td { padding:2px 6px; border-bottom:1px solid #1e293b; white-space:nowrap; }
  #v86Obj tr.v86-r { cursor:pointer; } #v86Obj tr.v86-r:hover td { background:rgba(0,240,255,.07); }
  #v86Obj tr.v86-g td { color:var(--cad-cyan); font-weight:700; background:#0b1018; padding-top:6px; }
  #v86Obj input { width:96px; font-size:11px; padding:1px 4px; background:#0b1018; color:#e2e8f0; border:1px solid #334155; border-radius:3px; }
  #v86Obj .v86-fs { color:#64748b; font-size:10.5px; }
  `;
  document.head.appendChild(s);
})();
const V86_PT = [['toolPan', 'pan', '平移／改 IP'], ['toolDrawAxis', 'draw', '繪中心線'], ['toolInsIP', 'ins', '插入 IP'], ['toolExtEP', 'ext', '由 EP 延長'], ['toolAddSta', 'sta', '加樁'],
  ['toolAddStruct', 'st', '結構物'], ['toolAddRev', 'rv', '護岸'], ['#ipxRow', null, null], ['toolAddPt', 'pt', '補高程點'], ['toolFlip', 'flip', '翻網格'], ['@focusMainCluster', 'find', '尋找地形'], ['@setAllIPRadius(0)', 'poly', '純折線']];
function v86PlanBar() {
  if (v86El('v86PlanBar')) return true;
  const grp = v86El('planToolsGroup'), cb = v86El('crossFloatingBar'); if (!grp || !cb || !v86El('ipxRow')) return false;
  const bar = document.createElement('div'); bar.id = 'v86PlanBar'; bar.className = 'view-floating-bar';
  bar.innerHTML = '<span class="v83-ttl">平面</span>';
  cb.parentElement.insertBefore(bar, cb);
  const card = grp.closest('.sec-card');
  const find = k => k[0] === '#' ? document.querySelector(k) : k[0] === '@' ? [...(card || grp).querySelectorAll('button')].find(b => (b.getAttribute('onclick') || '').includes(k.slice(1))) : v86El(k);
  V86_PT.forEach(([k, ic, lb]) => { const b = find(k); if (!b) return; if (ic) { const t = (b.title || '').trim(); v83SetBtn(b, ic, lb); b.title = t || lb; } bar.appendChild(b); });
  bar.querySelectorAll('#ipxRow2').forEach(x => x.remove());
  const r2 = v86El('ipxRow2'); if (r2 && !r2.children.length) r2.remove();
  const ph = document.createElement('div'); ph.className = 'v86-ph'; ph.id = 'v86PlanPh';
  ph.innerHTML = '平面工具按鈕已移到<b>平面圖上方的工具列</b>（與縱斷、橫斷、3D 同一位置）。放不下的按鈕收在工具列的「⋯ 更多」。';
  grp.prepend(ph);
  v83Cap1(bar, '平面', 'btnView2D');
  bar.title = '';
  v86PlanShow();
  return true;
}
function v86PlanShow() { const b = v86El('v86PlanBar'); if (!b) return; b.style.display = state.viewMode === '2D' ? 'flex' : 'none'; if (state.viewMode === '2D') v86FitPlan(); }
function v86FitPlan() {   // 與 v83Fit 相同做法，但右側要讓出「圖例／工作內容／雷達」按鈕
  const bar = v86El('v86PlanBar'); if (!bar || getComputedStyle(bar).display === 'none') return;
  const m = bar.querySelector(':scope > .v83-more'); if (!m) return; const pop = m.lastElementChild;
  [...pop.children].sort((a, b) => a.dataset.v83o - b.dataset.v83o).forEach(c => bar.insertBefore(c, m));
  const P = bar.parentElement.getBoundingClientRect(), cn = v86El('uimCorner'), cr = cn && cn.offsetParent ? cn.getBoundingClientRect() : null;
  const right = cr && cr.width ? cr.left - 8 : P.right - 70;
  const ts = uimTs(); bar.style.setProperty('left', ((right - P.left) / 2 + 2) / ts + 'px', 'important');   // 置中在畫布左緣與右上角按鈕之間
  bar.style.maxWidth = Math.max(200, (right - P.left - 12) / ts) + 'px';
  m.classList.add('v83-off');
  const lim = () => { const r = bar.getBoundingClientRect(); return r.right > right || r.left < P.left + 4 || bar.scrollWidth > bar.clientWidth + 1; };
  if (!lim()) return;
  m.classList.remove('v83-off');
  const L = [...bar.children].filter(c => c !== m && !c.classList.contains('v83-ttl') && !c.classList.contains('v83-hide') && c.dataset.v83o !== undefined);
  while (lim() && L.length > 1) { const c = L.pop(); pop.insertBefore(c, pop.firstChild); }
}
{ const _f = v83FitBars; v83FitBars = function () { const r = _f.apply(this, arguments); try { v86FitPlan(); } catch (e) { } return r; }; }
{ const _f = setViewMode; setViewMode = function () { const r = _f.apply(this, arguments); try { v86PlanShow(); } catch (e) { } return r; }; }

/* ---------------------------------------------------------------------------
   U5：抽屜「物件清單」頁
   --------------------------------------------------------------------------- */
V83_PG.push(['obj', 'list', '物件清單', null]);
function v86ObjRows() {
  const cl = v86ClId(), G = [];
  const st = (state.structs || []).map((s, i) => ({ t: 'st', i, name: s.name || '結構物', s0: s.sta, one: true, ro: !!s.par }));
  if (st.length) G.push(['結構物', st]);
  const rv = (state.revs || []).map((r, i) => ({ t: 'rv', i, name: v86RvName(r), s0: r.s0, s1: r.s1, all: r.s0 === null || r.s1 === null }));
  if (rv.length) G.push(['護岸', rv]);
  const dn = (state.dns || []).map((d, i) => ({ d, i })).filter(o => o.d.mode === 'A' && o.d.cl === cl).map(({ d, i }) => ({ t: 'dn', i, name: d.name || '排水溝', s0: d.s0, s1: d.s1 }));
  if (dn.length) G.push(['排水溝（沿中心線）', dn]);
  const gr = (state.grades || []).map((g, i) => ({ g, i })).filter(o => o.g.src === 'cl').map(({ g, i }) => ({ t: 'gr', i, name: g.name || '整地', s0: g.s0, s1: g.s1 }));
  if (gr.length) G.push(['整地', gr]);
  const tf = (state.tfrs || []).map((t, i) => ({ t0: t, i })).filter(o => o.t0.cl === cl).map(({ t0, i }) => ({ t: 'tf', i, name: t0.name || '護坡基礎補強', s0: t0.s0, s1: t0.s1 }));
  if (tf.length) G.push(['護坡基礎補強', tf]);
  return G;
}
function v86ObjRender() {
  const pg = document.querySelector('#v83Drawer .v83-pg[data-pg="obj"]'); if (!pg) return;
  const n = v86El('v83N_obj'), G = v86ObjRows(), tot = G.reduce((a, g) => a + g[1].length, 0); if (n) n.textContent = tot + ' 項';
  if (!(V83D.open && V83D.pg === 'obj')) return;
  if (pg.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  const al = state.alignment || {}, inp = (r, k, v, ph) => `<input type="number" step="0.01" data-t="${r.t}" data-i="${r.i}" data-k="${k}" value="${v86Fin(v) ? (+v).toFixed(2) : ''}" placeholder="${ph || ''}" ${r.ro ? 'disabled title="附屬結構物，樁號隨主結構物"' : ''} onclick="event.stopPropagation()" onchange="v86ObjSet(this)">`;
  const L = (a, b) => v86Fin(a) && v86Fin(b) ? Math.abs(b - a).toFixed(2) + ' m' : '';
  const body = G.map(([g, rows]) => `<tr class="v86-g"><td colspan="5">${g}（${rows.length}）</td></tr>` + rows.map(r => {
    const a = r.s0 === null ? al.startSta : r.s0, b = r.s1 === null ? al.endSta : r.s1;
    return `<tr class="v86-r" data-t="${r.t}" data-i="${r.i}" onclick="v86ObjGo('${r.t}',${r.i})" title="點一下跳到該物件"><td>${escAttr(r.name)}</td>`
      + (r.one ? `<td>${inp(r, 'sta', r.s0)} <span class="v86-fs">${v86Fin(r.s0) ? v86Fs(r.s0) : ''}</span></td><td></td><td></td>`
        : `<td>${inp(r, 's0', r.s0, r.s0 === null ? '全線起點' : '')} <span class="v86-fs">${v86Fin(a) ? v86Fs(a) : ''}</span></td><td>${inp(r, 's1', r.s1, r.s1 === null ? '全線終點' : '')} <span class="v86-fs">${v86Fin(b) ? v86Fs(b) : ''}</span></td><td>${L(a, b)}</td>`)
      + `<td><button class="btn" style="padding:0 6px;" onclick="event.stopPropagation();v86ObjGo('${r.t}',${r.i})">跳到</button></td></tr>`; }).join('')).join('');
  pg.innerHTML = `<div id="v86Obj">${tot ? `<table><thead><tr><th>物件</th><th>起點樁號（m）</th><th>迄點樁號（m）</th><th>長度</th><th></th></tr></thead><tbody>${body}</tbody></table>
    <div class="v86-fs" style="margin-top:6px;">直接改樁號即可（同各物件卡片上的欄位）；點一列跳到該物件。接在加樁、結構物上的端點會一起移動（K1、K2）。</div>` : '<div class="v86-fs" style="padding:8px;">目前中心線上還沒有結構物、護岸、排水溝、整地或護坡基礎補強。</div>'}</div>`;
}
function v86ObjSet(el) {
  const t = el.dataset.t, i = +el.dataset.i, k = el.dataset.k, v = parseFloat(el.value); if (!Number.isFinite(v)) { v86ObjRender(); return; }
  try {
    if (t === 'st') stEditField(i, 'sta', { value: String(v) });
    else if (t === 'rv') { const rv = state.revs[i]; if (rv) { V83.att = true; try { rvSetEnd(rv, k, v); } finally { V83.att = false; } } }
    else if (t === 'dn') { state.dnSel = i; dnSet(k, v); }
    else if (t === 'gr') { const G = state.grades[i]; if (G) { GRD_SEL = G.id; grdSet(k, v); } }
    else if (t === 'tf') { const T = state.tfrs[i]; if (T) { TFR_SEL = T.id; tfrSet(k, v); } }
  } catch (e) { console.warn(e); }
  setTimeout(() => { if (document.activeElement === el) el.blur(); v86ObjRender(); }, 0);
}
function v86ObjGo(t, i) {
  let s = null; const al = state.alignment || {};
  if (t === 'st') { const o = state.structs[i]; if (o) { s = o.sta; state.structSel = i; } }
  else { const o = { rv: state.revs, dn: state.dns, gr: state.grades, tf: state.tfrs }[t][i]; if (o) { const a = o.s0 === null ? al.startSta : +o.s0, b = o.s1 === null ? al.endSta : +o.s1; s = (a + b) / 2; if (t === 'rv') state.rvSel = i; if (t === 'dn') state.dnSel = i; } }
  if (!v86Fin(s)) return;
  const g = getPointAndNormalAtStation(+s); if (!g) return;
  if (state.viewMode === '2D') { try { saveViewHistory(); } catch (e) { } if (typeof focusWorldPos === 'function') focusWorldPos(g.x, g.y); else { state.cam2D.cx = g.x; state.cam2D.cy = g.y; } }
  else { let k = 0, bd = Infinity; (state.sections || []).forEach((q, j) => { const d = Math.abs(q.sta - s); if (d < bd) { bd = d; k = j; } }); state.selectedStaIdx = k; const ss = v86El('stationSelect'); if (ss) ss.value = k; }
  document.querySelectorAll('#v86Obj tr.v86-r').forEach(r => r.style.outline = (r.dataset.t === t && +r.dataset.i === i) ? '1px solid var(--cad-cyan)' : '');
  requestRedraw(); updateStatus(`➜ 已跳到 ${v86Fs(+s)}。`);
}
{ const _a = v83DrApply; v83DrApply = function () { const r = _a.apply(this, arguments); try { v86ObjRender(); } catch (e) { console.warn(e); } return r; }; }
// 右下「工作內容」浮框改由抽屜「物件清單」取代：角落按鈕改成開啟該頁；畫面浮框不再畫（DXF 工作內容表不受影響）
if (typeof ttDrawPlan === 'function') { ttDrawPlan = function () { }; }
function v86WorkBtn() {
  const b = v86El('uimBWork'); if (!b || b.dataset.v86) return; b.dataset.v86 = 1;
  b.setAttribute('onclick', "v83DrOpen('obj')"); b.textContent = '📋 物件清單'; b.title = '開啟畫面下方資料表的「物件清單」：各工作項目的起訖樁號，可直接修改、點列跳到物件（DXF 的工作內容表由圖層頁控制）';
  b.classList.remove('on');
}
if (typeof uimApplyF === 'function') { const _u = uimApplyF; uimApplyF = function () { const r = _u.apply(this, arguments); const b = v86El('uimBWork'); if (b && b.dataset.v86) b.classList.toggle('on', !!(V83D.open && V83D.pg === 'obj')); return r; }; }

/* ---------------------------------------------------------------------------
   設定 ▾：K4 開關
   --------------------------------------------------------------------------- */
function v86SetUI() {
  const p = v86El('uimSetPop'); if (!p || v86El('v86K4')) return !!p;
  const d = document.createElement('label'); d.className = 'uim-row'; d.style.cssText = 'font-size:12px;color:#1e293b;padding:2px 4px;cursor:pointer;';
  d.title = '拖 IP、改 R、插入或刪除 IP 後，護岸、結構物、排水溝、整地、護坡基礎補強的端點維持原本的平面位置，樁號依新中心線重算';
  d.innerHTML = `<input type="checkbox" id="v86K4" ${V86.k4 ? 'checked' : ''} onchange="v86SetK4(this.checked)"> 改中心線時物件保持平面位置`;
  p.appendChild(d); return true;
}

function v86Init(n) {
  const a = v86PlanBar(), b = v86SetUI(); v86WorkBtn(); v86DemTitleUI();
  if (v86El('v83Drawer')) { v83DrCount(); v86ObjRender(); }
  if ((!a || !b || !v86El('v83Drawer')) && (n || 0) < 40) { setTimeout(() => v86Init((n || 0) + 1), 150); return; }
  if (!V86.cache) v86Snap();
  requestAnimationFrame(() => { try { v86FitPlan(); } catch (e) { } });
}
window.addEventListener('load', () => setTimeout(() => v86Init(0), 250));
