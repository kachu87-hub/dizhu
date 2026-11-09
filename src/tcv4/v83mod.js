/* ============================================================================
   v8.3：改樁號連動（K1～K3）＋介面（U1 頂部圖示、U2 浮動列膠囊、U4 底部資料抽屜）
   K1 移動加樁：起訖點在該加樁 0.01 m 內的護岸、排水溝（沿中心線型）、整地、護坡基礎補強端點一起移動
   K2 移動結構物（改樁號欄、落差表改樁號）：接在結構物（含附屬副壩、固床工）上的端點一起移動
   K3 改起點樁號：確認後，所有以里程存的資料一起平移差值
   結構物、護岸原本不在 Ctrl＋Z 快照內 → 這三種動作另外記錄其樁號欄位，復原時一併還原
   ============================================================================ */
const V83 = { att: false, eps: 0.01 };
const v83El = id => document.getElementById(id);
const v83Fin = x => x !== null && x !== undefined && x !== '' && Number.isFinite(+x);
function v83ClId() { return ((state.cls && state.cls[state.clCur | 0]) || {}).id || 'C0'; }
function v83RvName(rv) { try { return rvName(rv); } catch (e) { return '護岸'; } }

/* ---- 復原：結構物、護岸的樁號欄位、起點樁號、縱斷面標示區段 ---- */
function v83Cap() {
  return {
    st: (state.structs || []).map(s => [s.id, s.sta]),
    rv: (state.revs || []).map(r => [r.id, JSON.stringify({ s0: r.s0, s1: r.s1, raises: r.raises || [], wids: r.wids || [], cps: r.cps || [], bios: (r.bios || []).map(b => b.sta) })]),
    ss: (v83El('startStationVal') || {}).value, pr: (v83El('pfRanges') || {}).value
  };
}
function v83Restore(x) {
  const S = new Map((state.structs || []).map(s => [s.id, s])), R = new Map((state.revs || []).map(r => [r.id, r]));
  (x.st || []).forEach(([id, v]) => { const s = S.get(id); if (s) s.sta = v; });
  (state.structs || []).sort((a, b) => a.sta - b.sta);
  (x.rv || []).forEach(([id, j]) => { const r = R.get(id); if (!r) return; const o = JSON.parse(j); r.s0 = o.s0; r.s1 = o.s1; r.raises = o.raises; r.wids = o.wids; r.cps = o.cps; (r.bios || []).forEach((b, i) => { if (o.bios[i] !== undefined) b.sta = o.bios[i]; }); });
  if (typeof RV_SIG !== 'undefined') RV_SIG = ''; if (typeof ST_SIG !== 'undefined') ST_SIG = '';
  const ss = v83El('startStationVal'); if (ss && x.ss !== undefined) ss.value = x.ss;
  const pr = v83El('pfRanges'); if (pr && x.pr !== undefined && pr.value !== x.pr) { pr.value = x.pr; try { pfRead(); } catch (e) { } }
}
{ const _pu = pushUndoSnapshot; pushUndoSnapshot = function () {
    const r = _pu.apply(this, arguments);
    if (V83.att) { V83.att = false; try { const n = state.undoStack.length - 1, o = JSON.parse(state.undoStack[n]); o.v83 = v83Cap(); state.undoStack[n] = JSON.stringify(o); } catch (e) { } }
    return r;
  };
  const _un = undoLastAction; undoLastAction = function () {
    let x = null; try { const t = state.undoStack[state.undoStack.length - 1]; if (t) x = JSON.parse(t).v83 || null; } catch (e) { }
    const r = _un.apply(this, arguments);
    if (x) { v83Restore(x); rebuildAlignmentAndSections(); v83SyncPanels(); }
    return r;
  };
}
function v83SyncPanels() {
  ['updateCustomStationListUI', 'renderStationMileageTable'].forEach(f => { try { if (typeof window[f] === 'function') window[f](); } catch (e) { } });
  requestRedraw();
}

/* ---- K1／K2：把落在 a（±0.01 m）的端點移到 b ---- */
function v83MoveEnds(a, b) {
  const hit = x => v83Fin(x) && Math.abs(+x - a) < V83.eps, moved = [], skip = [], al = state.alignment || {};
  b = +(+b).toFixed(2);
  const pair = (o, k0, k1, name, lo, hi) => {   // o[k0]~o[k1] 一段；端點落在 a 才動，不可讓區段反轉
    [k0, k1].forEach(k => {
      if (!hit(o[k])) return;
      const other = k === k0 ? (v83Fin(o[k1]) ? +o[k1] : hi) : (v83Fin(o[k0]) ? +o[k0] : lo);
      const okDir = !v83Fin(other) || (k === k0 ? b < other - 0.05 : b > other + 0.05);
      if (okDir) { o[k] = b; moved.push(name); } else skip.push(name);
    });
  };
  (state.revs || []).forEach(rv => {
    const nm = v83RvName(rv);
    pair(rv, 's0', 's1', nm, al.startSta, al.endSta);
    (rv.raises || []).forEach(q => pair(q, 's0', 's1', nm + ' 加高段'));
    (rv.wids || []).forEach(q => pair(q, 's0', 's1', nm + ' 變寬段'));
  });
  const cl = v83ClId();
  (state.dns || []).forEach(d => { if (d.mode === 'A' && d.cl === cl) pair(d, 's0', 's1', d.name || '排水溝'); });
  (state.grades || []).forEach(G => {   // 整地 s0／s1 可前後顛倒（計算時取 min/max）
    if (G.src !== 'cl') return; ['s0', 's1'].forEach(k => { if (hit(G[k])) { G[k] = b; moved.push(G.name || '整地'); } });
    (G.segs || []).forEach(q => pair(q, 'a', 'b', (G.name || '整地') + ' 分段'));
  });
  (state.tfrs || []).forEach(t => { if (t.cl === cl) pair(t, 's0', 's1', t.name || '護坡基礎補強'); });
  if (moved.length && typeof RV_SIG !== 'undefined') RV_SIG = '';
  return { moved: [...new Set(moved)], skip: [...new Set(skip)] };
}
function v83EndsMsg(R) {
  let m = R.moved.length ? `；端點一起移動：${R.moved.join('、')}` : '';
  if (R.skip.length) m += `；${R.skip.join('、')} 端點未動（移動後會超過另一端）`;
  return m;
}
// K1 移動加樁
{ const _mc = xpMoveCustom; xpMoveCustom = function (i, v) {
    const c = (state.customStations || [])[i], old = c ? c.s : null;
    V83.att = true; let ok; try { ok = _mc.apply(this, arguments); } finally { V83.att = false; }
    if (ok && c && v83Fin(old) && Math.abs(c.s - old) >= V83.eps) {
      const R = v83MoveEnds(old, c.s);
      if (R.moved.length) { rebuildAlignmentAndSections(); v83SyncPanels(); }
      if (R.moved.length || R.skip.length) updateStatus(`📍 加樁「${c.name}」${formatStation(old)} → ${formatStation(c.s)}${v83EndsMsg(R)}。可 Ctrl＋Z 復原。`);
    }
    return ok;
  };
}
// K2 移動結構物
function v83StAfter(before, name) {
  const R = { moved: [], skip: [] };
  (state.structs || []).forEach(s => { const o = before.get(s.id); if (!v83Fin(o) || Math.abs(s.sta - o) < V83.eps) return; const r = v83MoveEnds(o, s.sta); R.moved.push(...r.moved); R.skip.push(...r.skip); });
  R.moved = [...new Set(R.moved)]; R.skip = [...new Set(R.skip)];
  if (R.moved.length) { rebuildAlignmentAndSections(); v83SyncPanels(); }
  if (R.moved.length || R.skip.length) updateStatus(`🏗 ${name} 樁號已修改${v83EndsMsg(R)}。可 Ctrl＋Z 復原。`);
  return R;
}
{ const _ef = stEditField; stEditField = function (i, f, el) {
    if (f !== 'sta') return _ef.apply(this, arguments);
    const st = state.structs[i], before = new Map((state.structs || []).map(s => [s.id, s.sta]));
    V83.att = true; try { _ef.apply(this, arguments); } finally { V83.att = false; }
    if (st) v83StAfter(before, st.name);
  };
  const _de = stDropEdit; stDropEdit = function (sid, field, val) {
    if (field !== 'sta') return _de.apply(this, arguments);
    const st = (state.structs || []).find(s => s.id === sid), before = new Map((state.structs || []).map(s => [s.id, s.sta]));
    V83.att = true; try { _de.apply(this, arguments); } finally { V83.att = false; }
    if (st) setTimeout(() => v83StAfter(before, st.name), 0);   // 原函式延後重建（附屬副壩樁號在重建時才更新）
  };
}

/* ---- K3：改起點樁號 → 全部平移 ---- */
function v83ShiftKeys(M, d) {
  if (!M) return 0; const E = Object.entries(M); let n = 0;
  E.forEach(([k]) => delete M[k]);
  E.forEach(([k, v]) => { const m = /^(-?[\d.]+)(.*)$/.exec(k); if (m && Number.isFinite(+m[1])) { M[(+m[1] + d).toFixed(2) + m[2]] = v; n++; } else M[k] = v; });
  return n;
}
function v83ShiftAll(d) {
  const sh = x => +(+x + d).toFixed(3), shN = (o, k) => { if (o && v83Fin(o[k])) { o[k] = sh(o[k]); return 1; } return 0; }, cnt = {};
  const add = (k, n) => { if (n) cnt[k] = (cnt[k] || 0) + n; };
  (state.structs || []).forEach(s => add('結構物', shN(s, 'sta')));
  (state.revs || []).forEach(r => {
    let n = shN(r, 's0') + shN(r, 's1'); (r.raises || []).concat(r.wids || []).forEach(q => { n += shN(q, 's0') + shN(q, 's1'); });
    (r.cps || []).forEach(c => { n += shN(c, 's'); }); add('護岸', n ? 1 : 0); (r.bios || []).forEach(b => add('生物通道', shN(b, 'sta')));
  });
  const cl = v83ClId();
  (state.dns || []).forEach(x => { if (x.mode === 'A' && x.cl === cl) add('排水溝', shN(x, 's0') + shN(x, 's1') ? 1 : 0); });
  (state.grades || []).forEach(G => { if (G.src !== 'cl') return; let n = shN(G, 's0') + shN(G, 's1'); (G.segs || []).forEach(q => { n += shN(q, 'a') + shN(q, 'b'); }); v83ShiftKeys(G.ov, d); add('整地', n ? 1 : 0); });
  (state.tfrs || []).forEach(t => { if (t.cl === cl) add('護坡基礎補強', shN(t, 's0') + shN(t, 's1') ? 1 : 0); });
  (state.customStations || []).forEach(c => add('加樁', shN(c, 's')));
  const P = state.profile || {}; (P.vips || []).forEach(v => add('縱斷面 VIP', shN(v, 'sta'))); (P.drops || []).forEach(v => { if (!v.sid) add('縱斷面落差', shN(v, 'sta')); });
  if (state.hy) { (state.hy.Q || []).forEach(q => { shN(q, 's0'); shN(q, 's1'); }); (state.hy.nseg || []).forEach(q => { shN(q, 's0'); shN(q, 's1'); }); }
  let k = 0; [state.secParams, state.secExt, state.secGround, state.pf && state.pf.sideData].forEach(M => { k += v83ShiftKeys(M, d); });
  if (state.splits) { k += v83ShiftKeys(state.splits, d); Object.values(state.splits).forEach(v => { if (v && v83Fin(v.sta)) v.sta = sh(v.sta); }); }
  add('各樁手動資料', k);
  const pr = v83El('pfRanges'); if (pr && pr.value.trim()) {
    pr.value = pr.value.split('\n').map(l => l.replace(/^(\s*)([-\d.]+)(\s*[,，\s]\s*)([-\d.]+)(?=\s*[,，\s])/, (m, a, x, s, y) => Number.isFinite(+x) && Number.isFinite(+y) ? a + sh(x) + s + sh(y) : m)).join('\n');
    try { pfRead(); } catch (e) { }
  }
  if (typeof RV_SIG !== 'undefined') RV_SIG = ''; if (typeof ST_SIG !== 'undefined') ST_SIG = '';
  return cnt;
}
function v83HasData() {
  const cl = v83ClId();
  return !!((state.structs || []).length || (state.revs || []).some(r => v83Fin(r.s0) || v83Fin(r.s1) || (r.raises || []).length || (r.wids || []).length || (r.cps || []).length || (r.bios || []).length)
    || (state.dns || []).some(x => x.mode === 'A' && x.cl === cl) || (state.grades || []).some(G => G.src === 'cl') || (state.tfrs || []).some(t => t.cl === cl)
    || (state.customStations || []).length || ((state.profile || {}).vips || []).length || Object.keys(state.secParams || {}).length || Object.keys(state.secExt || {}).length);
}
document.addEventListener('change', e => {   // 捕獲階段：在輸入欄自己的 onchange（重建）之前
  const el = e.target; if (!el || el.id !== 'startStationVal') return;
  const al = state.alignment || {}, old = +al.startSta || 0, nv = parseFloat(el.value) || 0, d = +(nv - old).toFixed(3);
  if (!d || !v83HasData()) return;
  const sg = d > 0 ? '+' : '';
  const ok = confirm(`起點樁號 ${formatStation(old)} → ${formatStation(nv)}（差 ${sg}${d} m）。\n\n按「確定」＝一起平移：結構物、護岸、排水溝、整地、護坡基礎補強、加樁、縱斷面 VIP、各樁手動資料全部加上 ${sg}${d} m，圖上位置不變。\n按「取消」＝只改數字：物件維持原本的里程數字（圖上位置會跟著移動）。`);
  if (!ok) { setTimeout(() => updateStatus(`起點樁號改為 ${formatStation(nv)}，物件維持原里程數字。`), 0); return; }
  // 快照記錄改之前的起點樁號
  const cur = el.value; el.value = String(old); V83.att = true; try { pushUndoSnapshot(); } finally { V83.att = false; } el.value = cur;
  const cnt = v83ShiftAll(d);
  setTimeout(() => { v83SyncPanels(); updateStatus(`📐 起點樁號 ${formatStation(old)} → ${formatStation(nv)}，已一起平移 ${sg}${d} m：${Object.entries(cnt).map(([k, n]) => `${k} ${n}`).join('、') || '無'}。可 Ctrl＋Z 復原。`); }, 0);
}, true);

/* ============================================================================
   U1 頂部按鈕加線條圖示（同左側圖示欄）；寬度不夠時依序只留圖示
   ============================================================================ */
const V83_IC = {
  btnView2D: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  btnViewProfile: '<path d="M3 17l5-6 4 3 9-9"/><circle cx="8" cy="11" r="1.4"/><circle cx="12" cy="14" r="1.4"/><path d="M3 21h18"/>',
  btnViewCross: '<path d="M2 7l5 2.5 3 6.5h4l3-6.5L22 7"/><path d="M12 3v18" stroke-dasharray="2 2"/>',
  btnView3D: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  open: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1"/><path d="M3 7v11a2 2 0 0 0 2 2h12.5l3.5-9H7.5L4 20"/>',
  save: '<path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  load: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  chk: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  exp: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  set: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  cl: '<path d="M3 19c5 0 4-14 9-14s4 14 9 14"/>',
  // 浮動列
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M8 10.5h5M10.5 8v5"/>',
  prev: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><circle cx="12" cy="17" r=".6" fill="black"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  top: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 8v8M8 12h8"/>',
  iso: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5"/>',
  dn: '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M15 9l3 3-3 3"/>',
  // 抽屜
  table: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 9v11"/>',
  pts: '<circle cx="6" cy="16" r="1.4"/><circle cx="11" cy="9" r="1.4"/><circle cx="17" cy="14" r="1.4"/><circle cx="19" cy="6" r="1.4"/><path d="M3 21h18"/>',
  ip: '<path d="M3 19l6-12 6 9 6-11"/><circle cx="9" cy="7" r="1.6"/><circle cx="15" cy="16" r="1.6"/>',
  up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>'
};
const v83Ic = k => `<i class="v83-i" style="--ti:${UIM_SVG(V83_IC[k]).replace(/"/g, '&quot;')}"></i>`;
(function () {
  const s = document.createElement('style');
  s.textContent = `
  .v83-i { display:inline-block; flex:0 0 auto; width:15px; height:15px; background:currentColor; -webkit-mask:var(--ti) center/contain no-repeat; mask:var(--ti) center/contain no-repeat; vertical-align:-3px; }
  .top-ribbon.uim .btn.v83-b { display:inline-flex; align-items:center; gap:5px; }
  .top-ribbon.uim .v83-cl { display:inline-flex; align-items:center; gap:4px; }
  body.v83-t1 .top-ribbon.uim #uimFile .v83-lb, body.v83-t1 .top-ribbon.uim #uimSetBtn .v83-lb, body.v83-t1 .top-ribbon.uim .v83-cl .v83-lb { display:none; }
  body.v83-t2 .top-ribbon.uim #uimViews .v83-lb, body.v83-t2 .top-ribbon.uim #uimExportBtn .v83-lb, body.v83-t2 #btnChk .v83-lb { display:none; }
  body.v83-t1 .top-ribbon.uim .btn.v83-b { padding-left:8px; padding-right:8px; }
  /* ---- U2 浮動列：單排膠囊 ---- */
  #crossFloatingBar.v83-cap, #profileFloatingBar.v83-cap, #v3dBar.v83-cap { left:50% !important; right:auto !important; top:8px !important; transform:translateX(-50%) !important; flex-wrap:nowrap !important; gap:4px !important; padding:3px 5px !important; border-radius:18px; border:1px solid #3b4a63; background:rgba(11,16,24,.9); white-space:nowrap; }
  .v83-cap > * { flex:0 0 auto; }
  .v83-cap .btn { display:inline-flex; align-items:center; gap:4px; border-radius:14px; padding:3px 9px; font-size:11.5px; white-space:nowrap; margin:0; }
  .v83-cap .v83-ttl { display:inline-flex; align-items:center; gap:5px; font-weight:700; color:var(--cad-cyan); padding:0 6px 0 4px; }
  .v83-cap .v83-ttl.amber { color:var(--cad-amber); }
  .v83-cap .v83-hide { display:none !important; }
  .v83-cap select { border-radius:12px; }
  .v83-cap > .hint { display:none !important; }
  .v83-cap.show-hint > .hint { display:block !important; position:absolute; top:calc(100% + 4px); left:0; width:max-content; max-width:min(760px, 80vw); white-space:normal; line-height:1.6; background:rgba(11,16,24,.96); border:1px solid #3b4a63; border-radius:8px; padding:6px 10px; }
  .v83-more { position:relative; }
  .v83-mpop { position:absolute; top:calc(100% + 4px); right:0; display:none; flex-direction:column; align-items:flex-start; gap:6px; padding:8px 10px; background:rgba(11,16,24,.97); border:1px solid #3b4a63; border-radius:8px; white-space:nowrap; z-index:30; }
  .v83-mpop.on { display:flex; }
  .v83-cap .v83-more.v83-off { display:none; }
  /* ---- U4 底部資料抽屜 ---- */
  #v83Drawer { flex:0 0 auto; box-sizing:border-box; display:flex; flex-direction:column; background:#0b1018; border-top:1px solid #3b4a63; position:relative; zoom:var(--ts); color:#cbd5e1; font-size:12px; }
  #v83Drawer .v83-dh { display:flex; align-items:center; gap:2px; height:26px; box-sizing:border-box; padding:0 6px; background:#0f1722; flex:0 0 auto; }
  #v83Drawer .v83-tab { display:inline-flex; align-items:center; gap:5px; height:22px; padding:0 10px; border:1px solid transparent; border-radius:5px 5px 0 0; background:none; color:#94a3b8; cursor:pointer; font-size:11.5px; white-space:nowrap; }
  #v83Drawer .v83-tab:hover { color:#e2e8f0; }
  #v83Drawer.open .v83-tab.on { color:var(--cad-cyan); background:#0b1018; border-color:#3b4a63; border-bottom-color:#0b1018; }
  #v83Drawer .v83-tab .v83-n { font-size:10px; color:#64748b; }
  #v83Drawer .v83-dsp { flex:1 1 auto; }
  #v83Drawer .v83-tg { width:26px; height:20px; display:inline-flex; align-items:center; justify-content:center; background:none; border:1px solid #3b4a63; border-radius:4px; color:#94a3b8; cursor:pointer; }
  #v83Drawer .v83-tg:hover { color:var(--cad-cyan); border-color:var(--cad-cyan); }
  #v83Drawer .v83-db { flex:1 1 auto; min-height:0; display:none; overflow:hidden; }
  #v83Drawer.open .v83-db { display:flex; }
  #v83Drawer .v83-pg { flex:1 1 auto; min-width:0; overflow:auto; display:none; }
  #v83Drawer .v83-pg.on { display:block; }
  #v83Drawer .v83-pg > .pt-table-wrap { max-height:none !important; height:100%; overflow:auto; border:none; margin:0; }
  #v83Drawer .v83-grip { position:absolute; left:0; right:0; top:-3px; height:6px; cursor:ns-resize; z-index:5; display:none; }
  #v83Drawer.open .v83-grip { display:block; }
  #v83Drawer .v83-grip:hover, #v83Drawer .v83-grip.on { background:rgba(0,240,255,.35); }
  #v83Drawer #ipEditor { position:static !important; left:auto !important; right:auto !important; bottom:auto !important; max-height:none !important; height:100%; border:none; box-shadow:none; zoom:1 !important; }
  #v83Drawer #ipEditor .ipe-head button[onclick*="closeIPEditor"] { display:none; }
  .v83-ph { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-muted); padding:4px 0; }
  .v83-ph .btn { padding:2px 8px; }
  `;
  document.head.appendChild(s);
})();
function v83SetBtn(b, ic, label, tail) {
  if (!b || b.dataset.v83) return; b.dataset.v83 = 1; b.classList.add('v83-b');
  if (!b.title) b.title = label;
  b.innerHTML = v83Ic(ic) + `<span class="v83-lb">${label}</span>` + (tail || '');
}
function v83Top() {
  const rb = document.querySelector('.top-ribbon.uim'); if (!rb) return false;
  ['btnView2D', 'btnViewProfile', 'btnViewCross', 'btnView3D'].forEach(id => { const b = v83El(id); if (b) v83SetBtn(b, id, b.textContent.trim()); });
  const F = v83El('uimFile'); if (F) { const bs = [...F.querySelectorAll('button')]; const by = f => bs.find(b => (b.getAttribute('onclick') || '').includes(f));
    v83SetBtn(by('triggerFileSelect'), 'open', '開啟 DXF'); v83SetBtn(by('saveProject(true)'), 'save', '另存專案'); v83SetBtn(by("projInput').click"), 'load', '載入'); }
  v83SetBtn(v83El('uimExportBtn'), 'exp', '匯出', ' ▾'); v83SetBtn(v83El('uimSetBtn'), 'set', '設定', ' ▾');
  const cg = v83El('clGroup'), cs = cg && cg.querySelector('span'); if (cs && !cs.classList.contains('v83-cl')) { cs.classList.add('v83-cl'); cs.innerHTML = v83Ic('cl') + '<span class="v83-lb">中心線</span>'; cs.title = '中心線'; }
  V83.topOk = true; try { chkBadge(); } catch (e) { }
  v83Tight();
  return true;
}
if (typeof chkBadge === 'function') { const _cb = chkBadge; chkBadge = function () {
  const r = _cb.apply(this, arguments), b = v83El('btnChk');
  if (b && /✔ 檢核/.test(b.innerHTML)) { b.innerHTML = b.innerHTML.replace('✔ 檢核', v83Ic('chk') + '<span class="v83-lb">檢核</span>'); b.classList.add('v83-b'); b.style.display = 'inline-flex'; b.style.alignItems = 'center'; b.style.gap = '4px'; }
  if (V83.topOk) { clearTimeout(V83.tt); V83.tt = setTimeout(v83Tight, 30); }
  return r; }; }
function v83Tight() {   // 依序：先藏檔案／設定／中心線文字，再藏視圖、匯出、檢核文字
  const rb = document.querySelector('.top-ribbon.uim'); if (!rb) return; const B = document.body;
  const over = () => rb.scrollWidth > rb.clientWidth + 1 || [...rb.children].some(c => c.getBoundingClientRect().right > rb.getBoundingClientRect().right + 1);
  B.classList.remove('v83-t1', 'v83-t2');
  if (over()) { B.classList.add('v83-t1'); if (over()) B.classList.add('v83-t2'); }
}
window.addEventListener('resize', () => { clearTimeout(V83.rt); V83.rt = setTimeout(() => { v83Tight(); v83FitBars(); }, 80); });
if (typeof applyUIScale === 'function') { const _a = applyUIScale; applyUIScale = function () { const r = _a.apply(this, arguments); setTimeout(() => { v83Tight(); v83FitBars(); if (v83El('v83Drawer')) v83DrApply(); }, 0); return r; }; }

/* ============================================================================
   U2 縱斷、橫斷、3D 浮動列：單排膠囊，放不下的收進「更多」
   ============================================================================ */
function v83Cap1(bar, title, ic, amber) {
  if (!bar || bar.classList.contains('v83-cap')) return;
  bar.classList.add('v83-cap');
  const t = bar.firstElementChild; if (t && t.tagName === 'SPAN' && !t.classList.contains('hint')) { t.className = 'v83-ttl' + (amber ? ' amber' : ''); t.removeAttribute('style'); t.innerHTML = v83Ic(ic) + title; }
  [...bar.children].forEach(c => {
    const oc = c.getAttribute('onclick') || '', tx = c.textContent.trim();
    if (c.tagName === 'SPAN' && /^\|$/.test(tx)) c.classList.add('v83-hide');
    if (c.tagName === 'SPAN' && /^選擇樁號/.test(tx)) c.classList.add('v83-hide');
    if (c.tagName !== 'BUTTON' || c.dataset.v83) return;
    let k = null, lb = tx.replace(/^[^\w一-鿿]+/, '').trim();
    if (c.id === 'btnCrossGridMode') { k = 'grid'; lb = '矩陣總覽'; c.title = '全線斷面矩陣總覽（一頁多圖）'; }
    else if (c.id === 'btnCrossSingleMode') { k = 'zoom'; lb = '單樁放大'; c.title = '單一樁號精細放大圖（含標尺）'; }
    else if (/stepStation\(-1\)/.test(oc)) { k = 'prev'; lb = '上一樁'; }
    else if (/stepStation\(1\)/.test(oc)) { k = 'next'; lb = '下一樁'; }
    else if (/show-hint/.test(oc)) { k = 'help'; lb = '說明'; }
    else if (/v3dView\('top'\)/.test(oc)) k = 'top'; else if (/v3dView\('iso'\)/.test(oc)) k = 'iso'; else if (/v3dView\('dn'\)/.test(oc)) k = 'dn';
    if (k) { c.dataset.v83 = 1; c.innerHTML = v83Ic(k) + `<span class="v83-lb">${lb}</span>`; }
  });
  [...bar.querySelectorAll('select')].forEach(s => { if (!s.title) s.title = '選擇樁號'; });
  [...bar.children].forEach((c, i) => { c.dataset.v83o = i; });
  // 「矩陣：單擊選取、雙擊放大」這類純說明文字改成滑過提示
  [...bar.children].forEach(c => { if (c.tagName === 'SPAN' && !c.classList.contains('hint') && !c.classList.contains('v83-ttl') && /單擊|雙擊/.test(c.textContent)) { bar.title = c.textContent.trim(); c.classList.add('v83-hide'); } });
  const m = document.createElement('div'); m.className = 'v83-more v83-off';
  m.innerHTML = `<button class="btn" title="更多選項">${v83Ic('more')}<span class="v83-lb">更多</span></button><div class="v83-mpop"></div>`;
  m.firstElementChild.addEventListener('click', e => { e.stopPropagation(); m.lastElementChild.classList.toggle('on'); });
  const hint = bar.querySelector(':scope > .hint'); bar.insertBefore(m, hint || null);
}
document.addEventListener('mousedown', e => { if (!e.target.closest('.v83-more')) document.querySelectorAll('.v83-mpop.on').forEach(p => p.classList.remove('on')); });
function v83Fit(bar) {
  if (!bar || !bar.classList.contains('v83-cap') || getComputedStyle(bar).display === 'none') return;
  const m = bar.querySelector(':scope > .v83-more'), pop = m.lastElementChild, hint = bar.querySelector(':scope > .hint');
  [...pop.children].sort((a, b) => a.dataset.v83o - b.dataset.v83o).forEach(c => bar.insertBefore(c, m));
  bar.style.maxWidth = Math.max(200, (bar.parentElement.getBoundingClientRect().width - 150) / uimTs()) + 'px';   // zoom 下百分比會被縮小，改用實際寬度
  m.classList.add('v83-off');
  const lim = () => { const p = bar.parentElement.getBoundingClientRect(), r = bar.getBoundingClientRect(); return r.right > p.right - 70 || r.left < p.left + 4 || bar.scrollWidth > bar.clientWidth + 1; };
  if (!lim()) return;
  m.classList.remove('v83-off');
  const movable = () => [...bar.children].filter(c => c !== m && c !== hint && !c.classList.contains('v83-ttl') && !c.classList.contains('v83-hide') && c.dataset.v83o !== undefined && !/btnCross(Grid|Single)Mode|stationSelect/.test(c.id || (c.querySelector && c.querySelector('#stationSelect') ? 'stationSelect' : '')));
  let L = movable();
  while (lim() && L.length > 1) { const c = L.pop(); pop.insertBefore(c, pop.firstChild); }
}
function v83FitBars() { ['crossFloatingBar', 'profileFloatingBar', 'v3dBar'].forEach(id => v83Fit(v83El(id))); }
function v83Bars() {
  v83Cap1(v83El('crossFloatingBar'), '橫斷面', 'btnViewCross', true);
  v83Cap1(v83El('profileFloatingBar'), '縱斷面', 'btnViewProfile');
  v83Cap1(v83El('v3dBar'), '3D', 'btnView3D');
  v83FitBars();
}
{ const _f = setViewMode; setViewMode = function () { const r = _f.apply(this, arguments); setTimeout(v83FitBars, 0); return r; }; }

/* ============================================================================
   U4 底部資料抽屜：樁號表、實測展點表、IP 要素表
   ============================================================================ */
const V83D = { open: false, h: 240, pg: 'sta' };
try { Object.assign(V83D, JSON.parse(localStorage.getItem('tc_v83_dr') || '{}')); } catch (e) { }
function v83DrSave() { try { localStorage.setItem('tc_v83_dr', JSON.stringify(V83D)); } catch (e) { } }
const V83_PG = [['sta', 'table', '樁號表', 'staCountBadge'], ['pt', 'pts', '實測展點表', 'ptCountBadge'], ['ip', 'ip', 'IP 要素表', null]];
function v83Drawer() {
  if (v83El('v83Drawer')) return true;
  const vw = v83El('viewportWrap'), stb = v83El('staTableBody'), ptb = v83El('ptTableBody'), ipe = v83El('ipEditor'); if (!vw || !stb || !ptb) return false;
  const d = document.createElement('div'); d.id = 'v83Drawer';
  d.innerHTML = '<div class="v83-grip" title="拖拉調整高度"></div><div class="v83-dh">' + V83_PG.map(([k, ic, t]) => `<button class="v83-tab" data-pg="${k}" title="${t}">${v83Ic(ic)}${t}<span class="v83-n" id="v83N_${k}"></span></button>`).join('')
    + '<span class="v83-dsp"></span><button class="v83-tg" id="v83DrTg" title="展開／收合資料表"></button></div><div class="v83-db">' + V83_PG.map(([k]) => `<div class="v83-pg" data-pg="${k}"></div>`).join('') + '</div>';
  vw.after(d);
  const pg = k => d.querySelector(`.v83-pg[data-pg="${k}"]`);
  const mv = (tb, k, card) => {
    const w = tb.closest('.pt-table-wrap'); if (!w) return; const host = w.parentElement;
    const ph = document.createElement('div'); ph.className = 'v83-ph'; ph.innerHTML = `表格已移到畫面下方的資料表。<button class="btn" onclick="v83DrOpen('${k}')">開啟</button>`;
    host.insertBefore(ph, w); pg(k).appendChild(w);
  };
  mv(stb, 'sta'); mv(ptb, 'pt');
  if (ipe) { ipe.style.display = 'flex'; pg('ip').appendChild(ipe); }
  d.querySelectorAll('.v83-tab').forEach(b => b.addEventListener('click', () => { const k = b.dataset.pg; if (V83D.open && V83D.pg === k) v83DrClose(); else v83DrOpen(k); }));
  v83El('v83DrTg').addEventListener('click', () => V83D.open ? v83DrClose() : v83DrOpen(V83D.pg));
  // 拖拉高度
  const g = d.querySelector('.v83-grip'); let D = null;
  g.addEventListener('mousedown', e => { D = { y: e.clientY, h: V83D.h }; g.classList.add('on'); e.preventDefault(); });
  window.addEventListener('mousemove', e => { if (!D) return; const ts = uimTs(), cs = d.parentElement.getBoundingClientRect().height / ts; V83D.h = Math.round(Math.max(110, Math.min(cs * 0.75, D.h - (e.clientY - D.y) / ts))); v83DrApply(); });
  window.addEventListener('mouseup', () => { if (!D) return; D = null; g.classList.remove('on'); v83DrSave(); resizeCanvases(); });
  ['staCountBadge', 'ptCountBadge'].forEach(id => { const b = v83El(id); if (b) new MutationObserver(v83DrCount).observe(b, { childList: true, characterData: true, subtree: true }); });
  v83DrApply(true);
  return true;
}
function v83DrApply(noResize) {
  const d = v83El('v83Drawer'); if (!d) return;
  d.classList.toggle('open', !!V83D.open); { const ts = uimTs(), hh = V83D.open ? V83D.h : 27; d.style.height = (Math.round(hh * ts) / ts) + 'px'; }   // 縮放後取整數像素（畫布尺寸與版面一致）
  d.querySelectorAll('.v83-tab').forEach(b => b.classList.toggle('on', b.dataset.pg === V83D.pg));
  d.querySelectorAll('.v83-pg').forEach(p => p.classList.toggle('on', p.dataset.pg === V83D.pg));
  const tg = v83El('v83DrTg'); tg.innerHTML = v83Ic(V83D.open ? 'down' : 'up');
  v83DrCount();
  if (V83D.open && V83D.pg === 'ip') try { renderIPEditor(); } catch (e) { }
  if (!noResize) { resizeCanvases(); setTimeout(v83FitBars, 0); }
}
function v83DrCount() {
  V83_PG.forEach(([k, , , bid]) => { const n = v83El('v83N_' + k), b = bid && v83El(bid); if (n) n.textContent = b ? b.textContent : (k === 'ip' ? (((state.alignment || {}).ipList || []).length + ' 點') : ''); });
}
{ const _rb = rebuildAlignmentAndSections; rebuildAlignmentAndSections = function () { const r = _rb.apply(this, arguments); try { v83DrCount(); } catch (e) { } return r; }; }
function v83DrOpen(k) { if (k) V83D.pg = k; V83D.open = true; v83DrSave(); v83DrApply(); }
function v83DrClose() { V83D.open = false; v83DrSave(); v83DrApply(); }
openIPEditor = function () { if (!v83El('v83Drawer')) { const e = v83El('ipEditor'); if (e) e.style.display = 'flex'; renderIPEditor(); return; } v83DrOpen('ip'); };
closeIPEditor = function () { if (!v83El('v83Drawer')) { const e = v83El('ipEditor'); if (e) e.style.display = 'none'; return; } if (V83D.pg === 'ip') v83DrClose(); };
if (typeof renderStationMileageTable === 'function') { const _r = renderStationMileageTable; renderStationMileageTable = function () { const r = _r.apply(this, arguments); const n = v83El('v83N_sta'), b = v83El('staCountBadge'); if (n && b) n.textContent = b.textContent; return r; }; }
// 縱斷、橫斷左側「樁號表」圖示 → 同時打開抽屜的樁號表
if (typeof earthShowGroup === 'function') { const _e = earthShowGroup; earthShowGroup = function (i) { const r = _e.apply(this, arguments); try { if (EARTH_GROUPS[i] && EARTH_GROUPS[i].name === '樁號表' && v83El('v83Drawer') && !(V83D.open && V83D.pg === 'sta')) v83DrOpen('sta'); } catch (e) { } return r; }; }

function v83UiInit(n) {
  const ok = v83Top();
  if (!ok && (n || 0) < 30) { setTimeout(() => v83UiInit((n || 0) + 1), 200); return; }
  v83Bars(); v83Drawer();
  requestAnimationFrame(() => { resizeCanvases(); v83Tight(); v83FitBars(); });
}
window.addEventListener('load', () => setTimeout(() => v83UiInit(0), 60));
