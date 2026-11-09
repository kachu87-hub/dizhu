/* ============================================================================
   v5.6 砥柱 DiZhu 擴充：
   A. 中心線：繪線鎖點、退回上一點、由 DXF 聚合線轉中心線、反轉方向
   B. 全線橫斷面法土方計算表（設計線＝縱斷面設計線；斷面站＝等距整樁＋結構物等加樁；平均斷面法）
   C. 崩塌地整治案件：整治區（多邊形，平面積／斜面積）＋基準線（BP→IP→EP）＋沿基準線放置擋土牆
   D. 國土測繪中心 WMTS 底圖＋兩點控制點（TWD97 TM2／經緯度）
   E. 20 m DEM 匯入：無實測地形處補注地面高程
   ============================================================================ */
state.dzSnap = true; state.dzCases = []; state.dzSel = -1; state.dzTmp = []; state.dzTool = null;
state.dzCtrl = [{}, {}]; state.dzBm = { on: false, layer: 'PHOTO2', op: 0.75, layer2: '', op2: 0.6 }; state.dzDem = null; state.dzDemOn = true;
const DZ_TOOLS = ['DZ_ZONE', 'DZ_BL', 'DZ_WALL', 'DZ_CTRL', 'PICK_AXIS', 'DZ_SWALL', 'DZ_PROF', 'DN_BL'];
const dzF = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');
const dzPxM = () => (state.cam2D && state.cam2D.scale) || 1;

/* ===================== A. 中心線輔助 ===================== */
function dzSnapPt(mx, my) {   // 游標 10 px 內的頂點：DXF 線頂點、測點、IP、整治區／基準線頂點
  if (state.dzSnap === false || (AXOV_LAST && AXOV_LAST.alt)) return null;
  const w = screenToWorld2D(mx, my), tol = 10 / dzPxM(); let best = null, bd = tol * tol;
  const test = (x, y) => { const dx = x - w.x; if (dx > tol || dx < -tol) return; const dy = y - w.y; if (dy > tol || dy < -tol) return; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = { x, y }; } };
  (state.rawCadPolys || []).forEach(pl => pl.pts.forEach(p => test(p.x, p.y)));
  (state.points || []).forEach(p => test(p.x, p.y));
  (state.axisNodes || []).forEach(p => test(p.x, p.y));
  (state.tempAxisNodes || []).forEach(p => test(p.x, p.y));
  const dg = state.dzDrag && state.dzDrag.pt; state.dzCases.forEach(c => { [c.zone || [], c.bl || []].concat((c.swalls || []).map(w => w.pts || [])).forEach(A => A.forEach(p => { if (p !== dg) test(p[0], p[1]); })); });
  (state.dzTmp || []).forEach(p => test(p[0], p[1]));
  return best;
}
function dzAxisUndo() {
  if (!state.tempAxisNodes.length) return; state.tempAxisNodes.pop();
  updateStatus(state.tempAxisNodes.length ? `↶ 已退回上一點，目前 ${state.tempAxisNodes.length} 點（BP${state.tempAxisNodes.length > 1 ? '＋IP' + (state.tempAxisNodes.length - 1) : ''}）；繼續點選，右鍵／Enter／雙擊結束。` : '↶ 已退回到沒有任何點；請重新點選 BP。');
  requestRedraw(); axisOvDraw();
}
function dzPickAxis() {
  if (!(state.rawCadPolys || []).some(p => p.pts.length >= 2)) { alert('目前沒有已匯入的 DXF 線。請先在「匯入資料」開啟 AutoCAD DXF（中心線可在 AutoCAD 先畫成 LWPOLYLINE／POLYLINE，高程設 0 即可）。'); return; }
  if (state.viewMode !== '2D') setViewMode('2D');
  setTool('PICK_AXIS');
  document.getElementById('hudToolTip').innerHTML = '📐【由 DXF 線轉中心線】：移到要當中心線的 DXF 聚合線上（變洋紅色）點一下；頂點依序轉成 BP→IP…→EP（曲線半徑先設 0）。Esc 取消。';
  updateStatus(`📐 請在平面圖點選要當「${clName()}」中心線的 DXF 線。線的 Z 值（高程 0）不影響分析：地面高程一律取自測點三角網。`);
}
function dzNearPoly(mx, my) {   // 游標 8 px 內最近的 DXF 聚合線
  const w = screenToWorld2D(mx, my), tol = 8 / dzPxM(); let best = null, bd = tol;
  (state.rawCadPolys || []).forEach(pl => { const P = pl.pts; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1];
    if (Math.max(a.x, b.x) < w.x - tol || Math.min(a.x, b.x) > w.x + tol || Math.max(a.y, b.y) < w.y - tol || Math.min(a.y, b.y) > w.y + tol) continue;
    const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((w.x - a.x) * dx + (w.y - a.y) * dy) / L2)) : 0, d = Math.hypot(a.x + t * dx - w.x, a.y + t * dy - w.y);
    if (d < bd) { bd = d; best = pl; } } });
  return best;
}
function dzAxisFromPoly(pl) {
  let P = pl.pts.map(p => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3), r: 0 })), Q = [];
  P.forEach(p => { const q = Q[Q.length - 1]; if (!q || Math.hypot(p.x - q.x, p.y - q.y) > 0.01) Q.push(p); });
  if (Q.length > 2 && Math.hypot(Q[0].x - Q[Q.length - 1].x, Q[0].y - Q[Q.length - 1].y) < 0.01) Q.pop();
  // 共線點合併（直線上多餘的頂點不當 IP）
  const R = [Q[0]]; for (let i = 1; i + 1 < Q.length; i++) { const a = R[R.length - 1], b = Q[i], c = Q[i + 1], cr = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x), L = Math.hypot(b.x - a.x, b.y - a.y) * Math.hypot(c.x - b.x, c.y - b.y); if (L > 0 && Math.abs(cr) / L > 1e-4) R.push(b); } R.push(Q[Q.length - 1]);
  if (R.length < 2) { alert('這條線少於 2 個頂點，無法轉成中心線。'); return; }
  setTool('DRAW_AXIS'); state.tempAxisNodes = R; finishAxisDrawing();
  updateStatus(`✅ 已由 DXF 線（圖層 ${pl.layer || '0'}）轉成「${clName()}」中心線：BP＋${R.length - 2} 個 IP＋EP，曲線半徑皆為 0（可於 IP 表逐點修改）。方向相反時按「⇄ 反轉中心線方向」。`);
}
function dzAxisReverse() {
  if (!state.axisNodes || state.axisNodes.length < 2) return;
  if (((state.structs || []).length || (state.revs || []).length) && !confirm('反轉方向後樁號由另一端起算，已放置的結構物、護岸樁號不會跟著換算。確定反轉？')) return;
  pushUndoSnapshot(); state.axisNodes = state.axisNodes.slice().reverse().map((n, i, a) => ({ ...n, r: (i === 0 || i === a.length - 1) ? 0 : n.r }));
  rebuildAlignmentAndSections(); requestRedraw(); updateStatus('⇄ 已反轉中心線方向（BP、EP 對調）。');
}

/* ===================== B. 全線橫斷面法土方計算表 ===================== */
function dzExName(st) { const m = String(st.name || '').match(/^(.*?)(\d+)\s*$/); return m ? `${m[2]}號${m[1]}` : String(st.name || '結構物'); }
function dzExclRanges() {   // v5.7：防砂壩、副壩、固床工（含護坦／側牆／尾檻）開挖另計的樁號範圍；附屬者併入主壩
  const R = [];
  (state.structs || []).forEach(st => {
    const own = (st.par && state.structs.find(q => q.id === st.par)) || st; let a = null, b = null;
    try {
      const ex = st._ex, pts = ex && ex.ok && ex.outl ? ex.outl.flat() : [];
      if (pts.length) { const us = pts.map(p => p[0]); a = st.sta + st.dir * Math.min(...us); b = st.sta + st.dir * Math.max(...us); }
      else { const g = stGeo(st), u0 = g.uUpB, u1 = Math.max(g.uDnB, (g.acc && g.acc.any && g.acc.uMax) || g.uDnB); a = st.sta + st.dir * u0; b = st.sta + st.dir * u1; }
    } catch (e) { a = st.sta - 1; b = st.sta + 1; }
    if (!Number.isFinite(a) || !Number.isFinite(b)) return; if (a > b) [a, b] = [b, a];
    const r = R.find(q => q.st === own); if (r) { r.a = Math.min(r.a, a); r.b = Math.max(r.b, b); } else R.push({ st: own, a, b, name: dzExName(own) });
  });
  return R;
}
function dzExclAt(s, R) { return (R || dzExclRanges()).find(r => s >= r.a - 1e-6 && s <= r.b + 1e-6) || null; }
function dzExclLen(a, b, R) { let L = 0; (R || dzExclRanges()).forEach(r => { L += Math.max(0, Math.min(b, r.b) - Math.max(a, r.a)); }); return Math.min(L, b - a); }
function dzSecSplit(sec) {   // 每斷面四項面積：河道挖（設計線以上地面，含岸坡整坡）、河道填（河床範圍）、護岸基礎開挖、護岸背填回填
  if (sec._ew) return sec._ew;
  let c = 0, f = 0, x = 0, k = 0; const S = sec.samples || [];
  const edge = sd => { const B = sec.bkInfo && sec.bkInfo[sd]; if (!B || B.mode === 'nat') return Infinity; return B.face ? Math.min(B.e, B.face[0][0]) : B.e; }, eL = edge('L'), eR = edge('R');
  for (let i = 0; i < S.length - 1; i++) {
    const p1 = S[i], p2 = S[i + 1]; if (!p1.valid && !p2.valid) continue;
    const w = p2.offset - p1.offset, m = (p1.offset + p2.offset) / 2, bank = m < 0 ? -m > eL + 1e-9 : m > eR + 1e-9, d1 = p1.groundZ - p1.desZ, d2 = p2.groundZ - p2.desZ;
    let ca = 0, fa = 0;
    if (d1 >= 0 && d2 >= 0) ca = 0.5 * (d1 + d2) * w; else if (d1 <= 0 && d2 <= 0) fa = 0.5 * Math.abs(d1 + d2) * w;
    else { const r = Math.abs(d1) / (Math.abs(d1) + Math.abs(d2)), w1 = w * r, w2 = w * (1 - r); if (d1 > 0) { ca = 0.5 * d1 * w1; fa = 0.5 * Math.abs(d2) * w2; } else { fa = 0.5 * Math.abs(d1) * w1; ca = 0.5 * d2 * w2; } }
    c += ca; if (!bank) f += fa;   // 護岸側的填方（結構體＋背填）由護岸背填欄計（已扣結構體），不重複
  }
  const xs = { L: 0, R: 0 }, ks = { L: 0, R: 0 }, bio = {}, inB = {};
  ['L', 'R'].forEach(sd => {
    const B = sec.bkInfo && sec.bkInfo[sd]; if (!B || B.mode === 'nat' || !B.R || !B.G) return;
    try { const sg = sd === 'L' ? -1 : 1, hS = sg < 0 ? sec.readL : sec.readR, g = a => secInterp(sec, sg * a, 'groundZ'), dz = a => secInterp(sec, sg * a, 'desZ'), fe = rvFillEx(B.G, B.R, sec.desCenterZ, g, dz, hS); xs[sd] = fe.ex; ks[sd] = fe.bf; } catch (e) { }
    if (typeof bioIn === 'function') try {   // v6.3 生物通道：範圍內護岸開挖／背填為 0，通道開挖／回填另計
      const H = bioIn(sd, sec.sta, false); if (H.length) { const E = bioSecEx(sec, H[0].rv, H[0].b); if (E) bio[sd] = E; }
      if (bioIn(sd, sec.sta, true).length) inB[sd] = bio[sd] ? bio[sd].name : 1;
    } catch (e) { console.error('bioSecEx', e); }
  });
  ['L', 'R'].forEach(sd => { if (!inB[sd]) { x += xs[sd]; k += ks[sd]; } });
  return (sec._ew = { c, f, x, k, xs, ks, bio, inB });
}
function dzSecCF(sec, R) { const q = dzSecSplit(sec), e = dzExclAt(sec.sta, R); return { cut: q.c + q.x, fill: q.f + q.k, ex: e }; }
function dzSecCFtxt(sec, u) { const q = dzSecCF(sec), w = dzSecSplit(sec), bn = Object.values(w.inB || {}).filter(v => typeof v === 'string'), bt = bn.length ? `（${bn.join('、')}開挖另計）` : ''; return q.ex ? `挖填：${q.ex.name}開挖另計` : `挖:${q.cut.toFixed(1)}${u}  填:${q.fill.toFixed(1)}${u}${bt}`; }
let BIO_EW = {};
function dzEwRows() {
  BIO_EW = {};   // 目前中心線：各斷面四項面積＋平均斷面法；結構物（壩、副壩、固床工及附屬）開挖範圍另計，區間長度扣除
  const XR = dzExclRanges(), GX = typeof grdExclRanges === 'function' ? grdExclRanges() : [], S = (state.sections || []).filter(s => Number.isFinite(s.cutArea) && Number.isFinite(s.fillArea)), R = [];
  let cc = 0, cf = 0, cx = 0, ck = 0;
  S.forEach((s, i) => {
    const q = dzSecSplit(s), p = S[i - 1], pq = p ? dzSecSplit(p) : null, Lr = p ? s.sta - p.sta : 0, Lx = p ? dzExclLen(p.sta, s.sta, XR) : 0, L = Math.max(0, Lr - Lx);
    const Lg = p && GX.length ? Math.min(L, dzExclLen(p.sta, s.sta, GX)) : 0, av = k => (p ? (pq[k] + q[k]) / 2 : 0), vc = av('c') * (L - Lg), vf = av('f') * (L - Lg);  /* v6.3：兩側整地範圍內河道挖填由整地另計 */ let vx = 0, vk = 0;
    if (p) ['L', 'R'].forEach(sd => {   // v6.3：區間位於生物通道內 → 該岸護岸開挖／背填為 0，通道開挖／回填另計
      const m = (p.sta + s.sta) / 2, H = typeof bioIn === 'function' ? bioIn(sd, m, true) : [];
      if (H.length) { const a = pq.bio && pq.bio[sd], b = q.bio && q.bio[sd], nm = H[0].b.name; if (a && b) { const o = BIO_EW[nm] = BIO_EW[nm] || { x: 0, k: 0, rows: [] }, X = (a.x + b.x) / 2 * L, K = (a.k + b.k) / 2 * L; o.x += X; o.k += K; o.rows.push({ a: p.sta, b: s.sta, L, x1: a.x, x2: b.x, k1: a.k, k2: b.k, X, K }); } return; }
      vx += (pq.xs[sd] + q.xs[sd]) / 2 * L; vk += (pq.ks[sd] + q.ks[sd]) / 2 * L; });
    cc += vc; cf += vf; cx += vx; ck += vk;
    const e = dzExclAt(s.sta, XR), bn = Object.values(q.inB || {}).filter(v => typeof v === 'string');
    R.push({ sta: s.sta, lbl: formatStation(s.sta), pt: s.ptName || '', gz: s.groundCenter, dz: s.desCenterZ, c: q.c, f: q.f, x: q.x, k: q.k, Lr, Lx, L, vc, vf, vx, vk, cc, cf, cx, ck, ex: e ? e.name + '開挖另計' : (bn.length ? bn.join('、') + '開挖另計' : '') });
  });
  return R;
}
function dzEwTot() { const R = dzEwRows(), T = R[R.length - 1]; return T ? { c: T.cc + T.cx, f: T.cf + T.ck, T } : { c: 0, f: 0, T: null }; }
function dzEwUI() {
  const box = document.getElementById('dzEwBox'); if (!box) return;
  const R = dzEwRows(), T = R.length ? R[R.length - 1] : null, iv = (document.getElementById('regularStaInterval') || {}).value || 20, XR = dzExclRanges();
  const open = box.querySelector('details') ? box.querySelector('details').open : false;
  box.innerHTML = `<div style="margin-top:8px;border-top:1px dashed var(--border-dim);padding-top:6px;">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;"><b style="font-size:12px;">📋 全線橫斷面法土方計算表</b>
      <label style="font-size:11px;display:flex;gap:4px;align-items:center;" title="等距整樁間距（與「里程樁號與路寬/河寬設定」同一欄）；結構物、曲線點、變坡點等另有加樁斷面">等距斷面 <input type="number" class="input-num" style="width:56px;" min="2" step="5" value="${iv}" onchange="dzSetInterval(this.value)"> m</label></div>
    <div style="font-size:10.5px;color:var(--text-muted);line-height:1.55;margin-top:3px;">設計線＝縱斷面設計線（含護岸斷面）。每站分四項：河道挖方（設計線以上的地面，含岸坡整坡）、河道填方（河床範圍設計線以下）、護岸基礎開挖、護岸背填回填（扣除結構體）；相鄰兩站平均斷面法 V＝(A1＋A2)/2×L。防砂壩、副壩、固床工及護坦／側牆／尾檻的開挖另計，其範圍自區間長度扣除。橫斷面圖只標四項加總的挖、填。</div>
    ${XR.length ? `<div style="font-size:10.5px;color:#b45309;margin-top:3px;">另計：${XR.map(r => `${escAttr(r.name)}（${formatStation(r.a)}～${formatStation(r.b)}）`).join('、')}</div>` : ''}
    ${T ? `<div style="font-size:11.5px;margin-top:4px;line-height:1.6;">${R.length} 站｜河道挖方 <b>${dzF(T.cc)}</b>｜河道填方 <b>${dzF(T.cf)}</b>｜護岸基礎開挖 <b>${dzF(T.cx)}</b>｜護岸背填回填 <b>${dzF(T.ck)}</b> m³<br>合計挖方 <b style="color:#b45309;">${dzF(T.cc + T.cx)}</b> m³｜合計填方 <b style="color:#be123c;">${dzF(T.cf + T.ck)}</b> m³｜淨（挖−填）<b>${dzF(T.cc + T.cx - T.cf - T.ck)}</b> m³</div>` : '<div style="font-size:11px;color:var(--text-muted);">尚無橫斷面資料。</div>'}
    <details ${open ? 'open' : ''} style="margin-top:4px;"><summary style="cursor:pointer;font-size:11px;color:#0369a1;">展開逐站計算表</summary>
      <div class="pt-table-wrap" style="max-height:280px;margin-top:4px;"><table class="pt-table"><thead><tr><th>樁號</th><th>點名</th><th>地面高</th><th>設計高</th><th>河道挖 m²</th><th>河道填 m²</th><th>護岸基礎開挖 m²</th><th>護岸背填 m²</th><th>距離 m</th><th>另計扣除 m</th><th>河道挖方 m³</th><th>河道填方 m³</th><th>護岸基礎開挖 m³</th><th>護岸背填 m³</th><th>備註</th></tr></thead><tbody>
      ${R.map(r => `<tr><td>${r.lbl}</td><td style="color:var(--cad-magenta)">${escAttr(r.pt)}</td><td>${dzF(r.gz)}</td><td>${dzF(r.dz)}</td><td>${dzF(r.c)}</td><td>${dzF(r.f)}</td><td>${dzF(r.x)}</td><td>${dzF(r.k)}</td><td>${r.Lr ? dzF(r.Lr) : ''}</td><td>${r.Lx ? dzF(r.Lx) : ''}</td><td>${r.Lr ? dzF(r.vc) : ''}</td><td>${r.Lr ? dzF(r.vf) : ''}</td><td>${r.Lr ? dzF(r.vx) : ''}</td><td>${r.Lr ? dzF(r.vk) : ''}</td><td style="color:#b45309;">${escAttr(r.ex)}</td></tr>`).join('')}
      </tbody></table></div></details>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;"><button class="btn green" onclick="dzEwExport('xlsx')">📥 土方計算表 Excel</button><button class="btn" onclick="dzEwExport('csv')">📥 土方計算表 CSV</button></div></div>`;
}
function dzSetInterval(v) { const el = document.getElementById('regularStaInterval'); if (!el) return; el.value = Math.max(2, parseFloat(v) || 20); rebuildAlignmentAndSections(); }
function dzEwSheet() {   // 全部中心線 → 工作表
  const lines = []; clEach(i => lines.push({ name: clName(i), R: dzEwRows(), X: dzExclRanges() }));
  if (!lines.some(L => L.R.length)) return null;
  const H = a => a.map(v => ({ v, s: 1 })), r2 = v => Math.round(v * 1000) / 1000, multi = lines.length > 1;
  const stamp = `專案：${(typeof projName !== 'undefined' && projName) ? projName.replace(/\.tcproj$/i, '') : '（未存檔）'}　匯出：${new Date().toLocaleString()}　設計線＝縱斷面設計線；V＝(A1＋A2)/2×L（L＝距離－另計扣除）`;
  const rows = [[{ v: '全線橫斷面法土方計算表（平均斷面法）', s: 5 }], [stamp], [], H(['中心線', '樁號', '里程 (m)', '點名', '地面高 (m)', '設計高 (m)', '河道挖方面積 (m²)', '河道填方面積 (m²)', '護岸基礎開挖面積 (m²)', '護岸背填回填面積 (m²)', '距離 (m)', '另計扣除 (m)', '計算長度 (m)', '河道挖方 (m³)', '河道填方 (m³)', '護岸基礎開挖 (m³)', '護岸背填回填 (m³)', '備註'])];
  const tot = [], E = v => ({ v, s: 3 });
  lines.forEach(L => { if (!L.R.length) return; const r0 = rows.length + 1;
    L.R.forEach((r, k) => { const n = rows.length + 1, first = k === 0, av = c => ({ f: `(${c}${n - 1}+${c}${n})/2*M${n}`, s: 3 });
      rows.push([{ v: L.name, s: 2 }, { v: r.lbl, s: 2 }, E(r2(r.sta)), { v: r.pt, s: 2 }, E(r2(r.gz)), E(r2(r.dz)), E(r2(r.c)), E(r2(r.f)), E(r2(r.x)), E(r2(r.k)),
        first ? E('') : { f: `C${n}-C${n - 1}`, v: r2(r.Lr), s: 3 }, first ? E('') : E(r2(r.Lx)), first ? E('') : { f: `MAX(0,K${n}-L${n})`, v: r2(r.L), s: 3 },
        first ? E(0) : Object.assign(av('G'), { v: r2(r.vc) }), first ? E(0) : Object.assign(av('H'), { v: r2(r.vf) }), first ? E(0) : Object.assign(av('I'), { v: r2(r.vx) }), first ? E(0) : Object.assign(av('J'), { v: r2(r.vk) }), { v: r.ex, s: 2 }]); });
    const r1 = rows.length, n = r1 + 1, T = L.R[L.R.length - 1], b = { v: '', s: 6 }; tot.push(n);
    rows.push([{ v: L.name + (multi ? ' 小計' : ' 合計'), s: 6 }, b, b, b, b, b, b, b, b, b, { f: `C${r1}-C${r0}`, v: r2(T.sta - L.R[0].sta), s: 7 }, { f: `SUM(L${r0}:L${r1})`, v: 0, s: 7 }, { f: `SUM(M${r0}:M${r1})`, v: 0, s: 7 },
      { f: `SUM(N${r0}:N${r1})`, v: r2(T.cc), s: 7 }, { f: `SUM(O${r0}:O${r1})`, v: r2(T.cf), s: 7 }, { f: `SUM(P${r0}:P${r1})`, v: r2(T.cx), s: 7 }, { f: `SUM(Q${r0}:Q${r1})`, v: r2(T.ck), s: 7 }, b]);
    rows.push([{ v: '　合計挖方（河道挖方＋護岸基礎開挖）', s: 6 }, b, b, b, b, b, b, b, b, b, b, b, b, { f: `N${n}+P${n}`, v: r2(T.cc + T.cx), s: 7 }, { v: '合計填方（河道填方＋護岸背填）', s: 6 }, b, { f: `O${n}+Q${n}`, v: r2(T.cf + T.ck), s: 7 }, b]);
    if (L.X.length) rows.push([{ v: '　另計（不列入本表）：' + L.X.map(r => `${r.name}（${formatStation(r.a)}～${formatStation(r.b)}）`).join('、'), s: 6 }]);
  });
  if (multi) { const n = rows.length + 1, b = { v: '', s: 8 }; rows.push([{ v: '全部中心線合計', s: 8 }, b, b, b, b, b, b, b, b, b, b, b, b,
    { f: tot.map(r => `N${r}`).join('+'), v: 0, s: 9 }, { f: tot.map(r => `O${r}`).join('+'), v: 0, s: 9 }, { f: tot.map(r => `P${r}`).join('+'), v: 0, s: 9 }, { f: tot.map(r => `Q${r}`).join('+'), v: 0, s: 9 }, b]); }
  rows.push([], [{ v: '註：河道挖方＝橫斷面上地面線高於設計線部分（含護岸頂以上岸坡整坡）；河道填方＝河床範圍內地面線低於設計線部分；護岸基礎開挖＝設計面以下、開挖線（基礎底前後緣、1:ec）以內；護岸背填回填＝開挖空間及設計面高於地形者回填至設計面，已扣除護岸結構體。防砂壩、副壩、固床工及其護坦／側牆／尾檻之開挖另計（見各結構物數量表），其範圍自計算長度扣除。' }]);
  return { name: '全線土方', cols: [10, 12, 10, 12, 10, 10, 12, 12, 13, 13, 9, 9, 10, 12, 12, 13, 13, 22], rows, freeze: 4, merges: ['A1:R1'] };
}
function dzEwExport(kind) {
  const base = (typeof projName !== 'undefined' && projName) ? projName.replace(/\.tcproj$/i, '') : 'DiZhu';
  if (kind === 'xlsx') { const sh = dzEwSheet(); if (!sh) { alert('尚無橫斷面資料。'); return; } const blob = new Blob([xlBook([sh])], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); downloadBlob(blob, `${base}_全線土方計算表.xlsx`); return; }
  let csv = '﻿中心線,樁號,點名,地面高(m),設計高(m),河道挖方面積(m2),河道填方面積(m2),護岸基礎開挖面積(m2),護岸背填回填面積(m2),距離(m),另計扣除(m),計算長度(m),河道挖方(m3),河道填方(m3),護岸基礎開挖(m3),護岸背填回填(m3),備註\n';
  clEach(i => dzEwRows().forEach(r => { csv += [clName(i), r.lbl, r.pt, dzF(r.gz), dzF(r.dz), dzF(r.c, 3), dzF(r.f, 3), dzF(r.x, 3), dzF(r.k, 3), r.Lr ? dzF(r.Lr, 3) : '', r.Lx ? dzF(r.Lx, 3) : '', r.Lr ? dzF(r.L, 3) : '', dzF(r.vc, 3), dzF(r.vf, 3), dzF(r.vx, 3), dzF(r.vk, 3), r.ex].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n'; }));
  downloadBlob(csv, `${base}_全線土方計算表.csv`, 'text/csv;charset=utf-8;');
}
/* ---- v5.7：橫斷面「開挖另計」引線（畫面與 DXF） ---- */
function dzExLeader(sec, sx, sy, dxf, TH) {
  const e = dzExclAt(sec.sta); if (!e) return;
  const x0 = sx(0), y0 = sy(sec.desCenterZ), txt = `${e.name}開挖另計`;
  if (dxf) { const D = dxf, h = TH || 0.35, x1 = x0 + h * 4, y1 = y0 + h * 5; D.line(x0, y0, 0, x1, y1, 0, 'DZ_EXCL', 1); D.line(x1, y1, 0, x1 + txt.length * h * 0.95, y1, 0, 'DZ_EXCL', 1); D.text(x1 + h * 0.2, y1 + h * 0.25, h, txt, 'DZ_EXCL', 1); return; }
  const x1 = x0 + 34, y1 = y0 - 46; ctx.save(); ctx.strokeStyle = '#fb923c'; ctx.fillStyle = '#fb923c'; ctx.lineWidth = 1.2; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.beginPath(); ctx.arc(x0, y0, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.font = 'bold 12px "Microsoft JhengHei", sans-serif'; const w = ctx.measureText(txt).width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + w + 8, y1); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(txt, x1 + 4, y1 - 2); ctx.restore();
}

/* ===================== D. 座標：TWD97 TM2 ↔ 經緯度、控制點（兩點相似轉換） ===================== */
const DZ_TM = (() => { const a = 6378137, f = 1 / 298.257222101, e2 = f * (2 - f), ep2 = e2 / (1 - e2), k0 = 0.9999, L0 = 121 * Math.PI / 180, FE = 250000;
  const e4 = e2 * e2, e6 = e4 * e2, M = p => a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * p - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * p) + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * p) - (35 * e6 / 3072) * Math.sin(6 * p));
  return {
    fwd(lat, lon) { const p = lat * Math.PI / 180, l = lon * Math.PI / 180, s = Math.sin(p), c = Math.cos(p), t = Math.tan(p), N = a / Math.sqrt(1 - e2 * s * s), T = t * t, C = ep2 * c * c, A = c * (l - L0);
      return { E: FE + k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120),
        N: k0 * (M(p) + N * t * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720)) }; },
    inv(E, Nn) { const mu = (Nn / k0) / (a * (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256)), e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
      const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
      const s = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1), N1 = a / Math.sqrt(1 - e2 * s * s), T1 = t * t, C1 = ep2 * c * c, R1 = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5), D = (E - FE) / (N1 * k0);
      const lat = p1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
      const lon = L0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c;
      return { lat: lat * 180 / Math.PI, lon: lon * 180 / Math.PI }; } };
})();
function dzCtrlTW(c) {   // 控制點的 TWD97 座標（輸入 TWD97 或經緯度）
  if (!c) return null;
  if (c.mode === 'll') { if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) return null; const t = DZ_TM.fwd(c.lat, c.lon); return { E: t.E, N: t.N }; }
  return Number.isFinite(c.E) && Number.isFinite(c.N) ? { E: c.E, N: c.N } : null;
}
function dzGeo() {   // 專案座標 → TWD97：兩點相似轉換（旋轉＋縮放＋平移）；未設定＝視為已是 TWD97
  const [a, b] = state.dzCtrl, A = dzCtrlTW(a), B = dzCtrlTW(b);
  const ok = A && B && [a.px, a.py, b.px, b.py].every(Number.isFinite) && Math.hypot(b.px - a.px, b.py - a.py) > 1e-6;
  if (!ok) return { ok: false, f: (x, y) => ({ E: x, N: y }), g: (E, N) => ({ x: E, y: N }) };
  const dpx = b.px - a.px, dpy = b.py - a.py, dE = B.E - A.E, dN = B.N - A.N, d2 = dpx * dpx + dpy * dpy, cr = (dE * dpx + dN * dpy) / d2, ci = (dN * dpx - dE * dpy) / d2;   // (dE+idN)/(dpx+idpy)
  const m2 = cr * cr + ci * ci;
  return { ok: true, s: Math.sqrt(m2), rot: Math.atan2(ci, cr) * 180 / Math.PI,
    f: (x, y) => { const u = x - a.px, v = y - a.py; return { E: A.E + cr * u - ci * v, N: A.N + ci * u + cr * v }; },
    g: (E, N) => { const u = E - A.E, v = N - A.N; return { x: a.px + (cr * u + ci * v) / m2, y: a.py + (-ci * u + cr * v) / m2 }; } };
}
function dzSetCtrl(k, f, v) {
  const c = state.dzCtrl[k] || (state.dzCtrl[k] = {});
  if (f === 'mode') c.mode = v; else { const x = parseFloat(v); c[f] = Number.isFinite(x) ? x : undefined; }
  DZ_TILE_KEY = ''; dzPanelUI(); requestRedraw(); if (state.dzDemOn && state.dzDem) rebuildAlignmentAndSections();
}
function dzPickCtrl(k) { if (state.viewMode !== '2D') setViewMode('2D'); setTool('DZ_CTRL'); state.dzTool = { k }; document.getElementById('hudToolTip').innerHTML = `📍【控制點 ${k + 1}】在平面圖點選該點位置（可鎖點到 DXF 頂點、測點），取得專案座標；再到左側輸入它的 TWD97 或經緯度。Esc 取消。`; }

/* ---- 國土測繪中心 WMTS 底圖（GoogleMapsCompatible：Web Mercator XYZ 圖磚） ---- */
const DZ_BM_LAYERS = [['PHOTO2', '正射影像'], ['EMAP', '臺灣通用電子地圖'], ['EMAP5', '通用電子地圖（套疊等高線）'], ['LUIMAP', '國土利用現況調查成果圖']];
const DZ_TILES = new Map(); let DZ_TILE_KEY = '';
function dzTile(z, x, y, LL) {
  const L = LL || state.dzBm.layer || 'PHOTO2', url = `https://wmts.nlsc.gov.tw/wmts/${encodeURIComponent(L)}/default/GoogleMapsCompatible/${z}/${y}/${x}`;
  let t = DZ_TILES.get(url); if (t) return t;
  if (DZ_TILES.size > 600) DZ_TILES.clear();
  const img = new Image(); t = { img, ok: false, bad: false }; DZ_TILES.set(url, t);
  img.crossOrigin = 'anonymous';
  img.onload = () => { t.ok = true; requestRedraw(); };
  img.onerror = () => { if (!t.retry) { t.retry = true; const i2 = new Image(); i2.onload = () => { t.img = i2; t.ok = true; t.taint = true; requestRedraw(); }; i2.onerror = () => { t.bad = true; }; i2.src = url; } else t.bad = true; };
  img.src = url; return t;
}
function dzDrawBasemap(w, h) {
  if (!state.dzBm.on || state.viewMode !== '2D') return;
  const G = dzGeo(), corners = [[0, 0], [w, 0], [0, h], [w, h]].map(([sx, sy]) => { const p = screenToWorld2D(sx, sy), t = G.f(p.x, p.y); return DZ_TM.inv(t.E, t.N); });
  const msg = t => { ctx.save(); ctx.font = '11px "Noto Sans TC"'; ctx.fillStyle = 'rgba(253,186,116,0.95)'; ctx.textAlign = 'left'; ctx.fillText(t, 230, h - 10); ctx.restore(); };
  if (corners.some(c => !Number.isFinite(c.lat) || c.lat < 20.5 || c.lat > 27 || c.lon < 117.5 || c.lon > 123.5)) { msg(G.ok ? '底圖：控制點換算後不在台灣範圍，請檢查控制點座標' : '底圖：專案座標不是 TWD97 TM2，請在「整治/底圖」設定兩個控制點'); return; }
  const lat0 = corners.reduce((a, c) => a + c.lat, 0) / 4, mpp = 1 / dzPxM() * (G.ok ? G.s : 1), z = Math.max(5, Math.min(19, Math.round(Math.log2(40075016 * Math.cos(lat0 * Math.PI / 180) / (256 * mpp)))));
  const n = 2 ** z, tx = lon => (lon + 180) / 360 * n, ty = lat => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n; };
  const X0 = Math.floor(Math.min(...corners.map(c => tx(c.lon)))), X1 = Math.floor(Math.max(...corners.map(c => tx(c.lon)))), Y0 = Math.floor(Math.min(...corners.map(c => ty(c.lat)))), Y1 = Math.floor(Math.max(...corners.map(c => ty(c.lat))));
  if ((X1 - X0 + 1) * (Y1 - Y0 + 1) > 160) return;
  const ll = (X, Y) => { const lon = X / n * 360 - 180, lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * Y / n))) * 180 / Math.PI; const t = DZ_TM.fwd(lat, lon), p = G.g(t.E, t.N); return worldToScreen2D(p.x, p.y); };
  const LYS = [[state.dzBm.layer || 'PHOTO2', state.dzBm.op ?? 0.75]]; if (state.dzBm.layer2) LYS.push([state.dzBm.layer2, state.dzBm.op2 ?? 0.6]);   // v6.3i：可同時套疊第二圖層（如正射影像＋國土利用現況），各自透明度
  LYS.forEach(([LL, op]) => { ctx.save(); ctx.globalAlpha = Math.max(0.05, Math.min(1, op)); ctx.imageSmoothingEnabled = true;
  for (let X = X0; X <= X1; X++) for (let Y = Y0; Y <= Y1; Y++) {
    if (X < 0 || Y < 0 || X >= n || Y >= n) continue; const t = dzTile(z, X, Y, LL); if (!t.ok) continue;
    const a = ll(X, Y), b = ll(X + 1, Y), c = ll(X, Y + 1);
    ctx.save(); ctx.transform((b.x - a.x) / 256, (b.y - a.y) / 256, (c.x - a.x) / 256, (c.y - a.y) / 256, a.x, a.y);
    try { ctx.drawImage(t.img, 0, 0, 256, 256); } catch (e) { } ctx.restore();
  }
  ctx.restore(); });
  ctx.save(); ctx.font = '10px "Noto Sans TC"'; ctx.fillStyle = 'rgba(226,232,240,0.85)'; ctx.textAlign = 'left'; ctx.fillText(`底圖：國土測繪中心 ${[state.dzBm.layer, state.dzBm.layer2].filter(Boolean).map(k => (DZ_BM_LAYERS.find(q => q[0] === k) || [0, k])[1]).join('＋')}（z${z}）${G.ok ? '' : '｜未設控制點：專案座標視為 TWD97'}`, 230, h - 10); ctx.restore();
}

/* ===================== E. DEM 匯入與取樣 ===================== */
function dzDemZ(x, y) {   // 專案座標 → DEM 高程（雙線性）；無資料＝null
  const D = state.dzDem; if (!D || !state.dzDemOn) return null;
  const t = dzGeo().f(x, y), fx = (t.E - D.x0) / D.dx, fy = (t.N - D.y0) / D.dy, i = Math.floor(fx), j = Math.floor(fy);
  if (i < 0 || j < 0 || i >= D.nx - 1 || j >= D.ny - 1) return null;
  const Z = D.z, k = j * D.nx + i, a = Z[k], b = Z[k + 1], c = Z[k + D.nx], d = Z[k + D.nx + 1];
  if (![a, b, c, d].every(v => Number.isFinite(v) && v > -9000)) return null;
  const u = fx - i, v = fy - j; return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function dzDemBBox() {   // 擷取範圍（TWD97）：測點、中心線、整治區、畫面，外加 1 km
  const G = dzGeo(); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; const add = (x, y) => { const t = G.f(x, y); x0 = Math.min(x0, t.E); x1 = Math.max(x1, t.E); y0 = Math.min(y0, t.N); y1 = Math.max(y1, t.N); };
  (state.points || []).forEach(p => add(p.x, p.y)); (state.axisNodes || []).forEach(p => add(p.x, p.y)); state.dzCases.forEach(c => (c.zone || []).concat(c.bl || []).forEach(p => add(p[0], p[1])));
  if (!Number.isFinite(x0)) { const cv = cadCanvas, W = cv.width / devicePixelRatio, H = cv.height / devicePixelRatio; [[0, 0], [W, H]].forEach(([sx, sy]) => { const p = screenToWorld2D(sx, sy); add(p.x, p.y); }); }
  const m = 1000; return { x0: x0 - m, y0: y0 - m, x1: x1 + m, y1: y1 + m };
}
async function dzDemLoad(file) {
  if (!file) return; const nm = file.name, ext = (nm.split('.').pop() || '').toLowerCase(), BB = dzDemBBox();
  updateStatus(`⏳ 讀取 DEM「${nm}」（只擷取專案範圍外加 1 km）…`);
  try {
    let D = null;
    if (ext === 'tif' || ext === 'tiff') D = await dzDemTiff(file, BB);
    else { const txt = await file.text(); D = /^\s*ncols/i.test(txt) ? dzDemAsc(txt, BB) : (/^\s*DSAA/.test(txt) ? dzDemGrd(txt, BB) : dzDemXyz(txt, BB)); }
    if (!D || D.nx < 2 || D.ny < 2) throw new Error('擷取範圍內沒有 DEM 資料（請確認座標系統為 TWD97 TM2，或先設好控制點）');
    D.name = nm; state.dzDem = D; state.dzDemOn = true; dzPanelUI(); rebuildAlignmentAndSections(); requestRedraw();
    updateStatus(`✅ 已匯入 DEM「${nm}」：${D.nx}×${D.ny} 格、格距 ${dzF(D.dx, 1)} m，範圍 E ${dzF(D.x0, 0)}～${dzF(D.x0 + D.dx * (D.nx - 1), 0)}、N ${dzF(D.y0, 0)}～${dzF(D.y0 + D.dy * (D.ny - 1), 0)}。實測三角網以外的位置以 DEM 補注地面高程。`);
  } catch (e) { console.error(e); alert('DEM 匯入失敗：' + e.message); updateStatus('⚠ DEM 匯入失敗：' + e.message); }
}
function dzDemFrom(pts, BB) {   // 規則格點 [x,y,z] → 格網
  if (pts.length < 4) return null;
  const xs = [...new Set(pts.map(p => Math.round(p[0] * 100) / 100))].sort((a, b) => a - b), ys = [...new Set(pts.map(p => Math.round(p[1] * 100) / 100))].sort((a, b) => a - b);
  const step = arr => { let m = Infinity; for (let i = 1; i < arr.length; i++) { const d = arr[i] - arr[i - 1]; if (d > 1e-6) m = Math.min(m, d); } return m; };
  const dx = step(xs), dy = step(ys); if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  const x0 = xs[0], y0 = ys[0], nx = Math.round((xs[xs.length - 1] - x0) / dx) + 1, ny = Math.round((ys[ys.length - 1] - y0) / dy) + 1;
  if (nx * ny > 4e6) throw new Error('擷取範圍太大（超過 400 萬格），請改用較小的 DEM 圖幅');
  const z = new Float32Array(nx * ny).fill(NaN); pts.forEach(([x, y, v]) => { const i = Math.round((x - x0) / dx), j = Math.round((y - y0) / dy); if (i >= 0 && j >= 0 && i < nx && j < ny) z[j * nx + i] = v; });
  return { x0, y0, dx, dy, nx, ny, z };
}
function dzDemXyz(txt, BB) {
  const P = []; txt.split(/\r?\n/).forEach(l => { const a = l.trim().split(/[\s,;]+/).map(Number); if (a.length < 3 || !a.slice(0, 3).every(Number.isFinite)) return; let [x, y, z] = a;
    if (x > 1e6 && y < 1e6) { const t = x; x = y; y = t; }   // N、E 順序互換
    if (x >= BB.x0 && x <= BB.x1 && y >= BB.y0 && y <= BB.y1 && z > -9000) P.push([x, y, z]); });
  return dzDemFrom(P, BB);
}
function dzDemAsc(txt, BB) {   // ESRI ASCII Grid
  const L = txt.split(/\r?\n/), H = {}; let k = 0;
  for (; k < L.length; k++) { const m = L[k].trim().match(/^([A-Za-z_]+)\s+(\S+)/); if (!m || !/^(ncols|nrows|xllcorner|yllcorner|xllcenter|yllcenter|cellsize|nodata_value|dx|dy)$/i.test(m[1])) break; H[m[1].toLowerCase()] = parseFloat(m[2]); }
  const nc = H.ncols, nr = H.nrows, cs = H.cellsize || H.dx, xc = H.xllcenter ?? (H.xllcorner + cs / 2), yc = H.yllcenter ?? (H.yllcorner + cs / 2), nd = H.nodata_value ?? -9999;
  const vals = L.slice(k).join(' ').trim().split(/\s+/).map(Number), P = [];
  for (let r = 0; r < nr; r++) { const y = yc + (nr - 1 - r) * cs; if (y < BB.y0 || y > BB.y1) continue; for (let c = 0; c < nc; c++) { const x = xc + c * cs; if (x < BB.x0 || x > BB.x1) continue; const v = vals[r * nc + c]; if (Number.isFinite(v) && v !== nd) P.push([x, y, v]); } }
  return dzDemFrom(P, BB);
}
function dzDemGrd(txt, BB) {   // Surfer ASCII Grid (DSAA)
  const a = txt.trim().split(/\s+/); const nx = +a[1], ny = +a[2], xlo = +a[3], xhi = +a[4], ylo = +a[5], yhi = +a[6], dx = (xhi - xlo) / (nx - 1), dy = (yhi - ylo) / (ny - 1), v = a.slice(9).map(Number), P = [];
  for (let j = 0; j < ny; j++) { const y = ylo + j * dy; if (y < BB.y0 || y > BB.y1) continue; for (let i = 0; i < nx; i++) { const x = xlo + i * dx, z = v[j * nx + i]; if (x >= BB.x0 && x <= BB.x1 && Number.isFinite(z) && z < 1.7e38) P.push([x, y, z]); } }
  return dzDemFrom(P, BB);
}
function dzLoadScript(src) { return new Promise((ok, no) => { if (window.GeoTIFF) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('無法載入 GeoTIFF 讀取元件（需連網）；可改用 .asc／.xyz 格式')); document.head.appendChild(s); }); }
async function dzDemTiff(file, BB) {
  await dzLoadScript('https://cdn.jsdelivr.net/npm/geotiff@2.0.5');
  const tif = await GeoTIFF.fromArrayBuffer(await file.arrayBuffer()), img = await tif.getImage(), [ox, oy] = img.getOrigin(), [rx, ry] = img.getResolution(), W = img.getWidth(), H = img.getHeight(), nd = img.getGDALNoData();
  const c0 = Math.max(0, Math.floor((BB.x0 - ox) / rx)), c1 = Math.min(W, Math.ceil((BB.x1 - ox) / rx) + 1), r0 = Math.max(0, Math.floor((BB.y1 - oy) / ry)), r1 = Math.min(H, Math.ceil((BB.y0 - oy) / ry) + 1);
  if (c1 - c0 < 2 || r1 - r0 < 2) return null;
  const [band] = await img.readRasters({ window: [c0, r0, c1, r1] }), nx = c1 - c0, ny = r1 - r0, dx = Math.abs(rx), dy = Math.abs(ry), z = new Float32Array(nx * ny);
  for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) { const v = band[r * nx + c]; z[(ny - 1 - r) * nx + c] = (nd !== null && v === nd) || v < -9000 ? NaN : v; }
  return { x0: ox + (c0 + 0.5) * rx, y0: oy + (r1 - 0.5) * ry, dx, dy, nx, ny, z };
}
function dzDemClear() { state.dzDem = null; dzPanelUI(); rebuildAlignmentAndSections(); requestRedraw(); updateStatus('已移除 DEM。'); }
function dzDemToggle(v) { state.dzDemOn = !!v; rebuildAlignmentAndSections(); requestRedraw(); }

/* ===================== C. 崩塌地整治：案件、整治區斜面積、基準線、擋土牆 ===================== */
function dzCase(i) { return state.dzCases[i === undefined ? state.dzSel : i]; }
function dzAddCase() { pushUndoSnapshot(); let k = 1; while (state.dzCases.some(c => c.name === '崩塌地' + k)) k++; state.dzCases.push({ id: 'Z' + Date.now().toString(36), name: '崩塌地' + k, zone: [], bl: [], walls: [], swalls: [], secs: [], secSel: 0 }); state.dzSel = state.dzCases.length - 1; dzPanelUI(); requestRedraw(); }
function dzDelCase(i) { const c = dzCase(i); if (!c || !confirm(`刪除案件「${c.name}」（整治區、基準線、擋土牆）？`)) return; pushUndoSnapshot(); state.dzCases.splice(i, 1); state.dzSel = Math.min(state.dzSel, state.dzCases.length - 1); dzPanelUI(); requestRedraw(); }
function dzRename(i, v) { const c = dzCase(i); if (c) { pushUndoSnapshot(); c.name = String(v || '').trim() || c.name; dzPanelUI(); requestRedraw(); } }
function dzStartDraw(kind, i) {
  if (i !== undefined) state.dzSel = i; const c = dzCase(); if (!c) return; if (state.viewMode !== '2D') setViewMode('2D');
  const T = { zone: 'DZ_ZONE', bl: 'DZ_BL', wall: 'DZ_WALL', swall: 'DZ_SWALL', prof: 'DZ_PROF' }[kind];
  if (kind === 'wall' && (c.bl || []).length < 2) { alert('請先畫這個案件的基準線。'); return; }
  setTool(T); state.dzTool = { cid: c.id, kind }; state.dzTmp = [];
  document.getElementById('hudToolTip').innerHTML = { zone: `🟧【整治區：${escAttr(c.name)}】左鍵依序點選崩塌地範圍頂點，右鍵／Enter／雙擊封閉；Backspace 退回上一點；Esc 取消。`, bl: `🟪【基準線：${escAttr(c.name)}】依序點選 BP→IP…→EP，右鍵／Enter／雙擊結束；Backspace 退回上一點。`, wall: `🧱【擋土牆：${escAttr(c.name)}】在基準線上點起點、再點迄點（點在基準線哪一側，牆就在那一側）。`, swall: `🟥【坡面擋土牆：${escAttr(c.name)}】在坡面上依序點選牆線 BP→IP…→EP（自由畫線，自帶樁號），右鍵／Enter／雙擊結束；Backspace 退回上一點。`, prof: `📈【坡面剖面：${escAttr(c.name)}】依序點選剖面線（可折線），右鍵／Enter／雙擊結束；結束後左側顯示地形剖面與各擋土牆位置。` }[kind];
  dzPanelUI();
}
function dzPolyLen(P) { let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; }
function dzBlAt(P, s) {   // 基準線樁號 s → 點與左法向
  let acc = 0; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (s <= acc + L + 1e-9 || i === P.length - 1) { const t = L ? Math.max(0, Math.min(1, (s - acc) / L)) : 0, ux = (b[0] - a[0]) / (L || 1), uy = (b[1] - a[1]) / (L || 1); return { x: a[0] + t * (b[0] - a[0]), y: a[1] + t * (b[1] - a[1]), ux, uy, nx: -uy, ny: ux }; } acc += L; }
  return null;
}
function dzBlProj(P, x, y) {   // 點投影到基準線 → 樁號、偏距（左正）
  let best = null, acc = 0; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, L = Math.sqrt(L2), t = L2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2)) : 0, px = a[0] + t * dx, py = a[1] + t * dy, d = Math.hypot(x - px, y - py);
    if (!best || d < best.d) best = { d, s: acc + t * L, off: ((x - a[0]) * -dy + (y - a[1]) * dx) / (L || 1) }; acc += L; }
  return best;
}
function dzBlSub(P, s0, s1, off) {   // 基準線 s0～s1 段，平移 off（左正）
  const S = [s0]; let acc = 0; for (let i = 1; i < P.length - 1; i++) { acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (acc > s0 + 1e-6 && acc < s1 - 1e-6) S.push(acc); } S.push(s1);
  return S.map(s => { const g = dzBlAt(P, s); return [g.x + g.nx * off, g.y + g.ny * off]; });
}
/* 地形取樣（斜面積用）：實測三角網（空間索引）→ DEM；回傳 {z, src} */
let DZ_TIX = null;
function dzTinIndex() {
  const T = state.triangles || [], Pp = state.points || []; if (DZ_TIX && DZ_TIX.T === T && DZ_TIX.n === T.length) return DZ_TIX;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; Pp.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
  const cs = Math.max(1, Math.sqrt(((x1 - x0) * (y1 - y0) || 1) / Math.max(1, T.length) * 4)), nx = Math.max(1, Math.ceil((x1 - x0) / cs) + 1), ny = Math.max(1, Math.ceil((y1 - y0) / cs) + 1), B = new Map();
  T.forEach((t, k) => { const a = Pp[t.a], b = Pp[t.b], c = Pp[t.c]; if (!a || !b || !c) return; const i0 = Math.floor((Math.min(a.x, b.x, c.x) - x0) / cs), i1 = Math.floor((Math.max(a.x, b.x, c.x) - x0) / cs), j0 = Math.floor((Math.min(a.y, b.y, c.y) - y0) / cs), j1 = Math.floor((Math.max(a.y, b.y, c.y) - y0) / cs);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const q = j * nx + i; let L = B.get(q); if (!L) B.set(q, L = []); L.push(k); } });
  return (DZ_TIX = { T, n: T.length, x0, y0, cs, nx, ny, B });
}
function dzZAt(x, y) {
  const X = dzTinIndex(), Pp = state.points, L = X.B.get(Math.floor((y - X.y0) / X.cs) * X.nx + Math.floor((x - X.x0) / X.cs));
  if (L) for (const k of L) { const t = X.T[k], a = Pp[t.a], b = Pp[t.b], c = Pp[t.c], det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y); if (Math.abs(det) < 1e-12) continue;
    const l1 = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / det, l2 = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / det, l3 = 1 - l1 - l2;
    if (l1 >= -1e-7 && l2 >= -1e-7 && l3 >= -1e-7) return { z: l1 * a.z + l2 * b.z + l3 * c.z, src: 'tin' }; }
  const d = dzDemZ(x, y); return d !== null ? { z: d, src: 'dem' } : null;
}
function dzPolyArea(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
function dzHeron(p, q, r) {   // 3D 三角形面積（海龍公式，Kahan 穩定式）
  const L = [Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]), Math.hypot(r[0] - q[0], r[1] - q[1], r[2] - q[2]), Math.hypot(p[0] - r[0], p[1] - r[1], p[2] - r[2])].sort((x, y) => y - x), [a, b, c] = L;
  return 0.25 * Math.sqrt(Math.max(0, (a + (b + c)) * (c - (a - b)) * (c + (a - b)) * (a + (b - c))));
}
function dzSlopeArea(P) {   // 整治區斜面積：細網格三角形（z 取自三角網／DEM）逐一以海龍公式算 3D 面積，邊界依多邊形裁切
  if (!P || P.length < 3) return null;
  const A2 = dzPolyArea(P), xs = P.map(p => p[0]), ys = P.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const h = Math.max(0.25, Math.sqrt((x1 - x0) * (y1 - y0) / 60000)), nx = Math.ceil((x1 - x0) / h), ny = Math.ceil((y1 - y0) / h);
  const Z = new Array((nx + 1) * (ny + 1)); for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) Z[j * (nx + 1) + i] = dzZAt(x0 + i * h, y0 + j * h);
  let As = 0, Ap = 0, aT = 0, aD = 0, aN = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const X0 = x0 + i * h, Y0 = y0 + j * h, k = j * (nx + 1) + i, v = [[X0, Y0, Z[k]], [X0 + h, Y0, Z[k + 1]], [X0 + h, Y0 + h, Z[k + nx + 2]], [X0, Y0 + h, Z[k + nx + 1]]];
    [[0, 1, 2], [0, 2, 3]].forEach(([p, q, r]) => {
      const T = [v[p], v[q], v[r]], C = T.map(t => [t[0], t[1]]), cut = tcoClip(P.map(p2 => [p2[0], p2[1]]), C), a = cut.length > 2 ? dzPolyArea(cut) : 0; if (a < 1e-9) return;
      Ap += a; if (T.every(t => t[2])) { const r3 = dzHeron(...T.map(t => [t[0], t[1], t[2].z])) / (h * h / 2); As += a * r3; if (T.every(t => t[2].src === 'tin')) aT += a; else aD += a; } else { As += a; aN += a; }
    });
  }
  return { A2, As, h, tin: aT / (Ap || 1), dem: aD / (Ap || 1), none: aN / (Ap || 1), slope: A2 > 0 ? Math.acos(Math.min(1, A2 / As)) * 180 / Math.PI : 0 };
}
function dzCaseCalc(c) {   // 快取
  const key = JSON.stringify([c.zone, (state.triangles || []).length, (state.points || []).length, state.dzDem ? state.dzDem.name + state.dzDem.nx : '', state.dzDemOn, state.dzCtrl]);
  if (c._k !== key) { c._k = key; c._a = c.zone && c.zone.length > 2 ? dzSlopeArea(c.zone) : null; }
  return c._a;
}
/* ---- 平面圖 ---- */
function dzDrawPlan() {
  if (state.viewMode !== '2D') return;
  const S = (x, y) => worldToScreen2D(x, y), path = (P, cl) => { ctx.beginPath(); P.forEach((p, i) => { const s = S(p[0], p[1]); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); }); if (cl) ctx.closePath(); };
  // DEM 範圍
  if (state.dzDem && state.dzDemOn) { const D = state.dzDem, G = dzGeo(), c = [[D.x0, D.y0], [D.x0 + D.dx * (D.nx - 1), D.y0], [D.x0 + D.dx * (D.nx - 1), D.y0 + D.dy * (D.ny - 1)], [D.x0, D.y0 + D.dy * (D.ny - 1)]].map(([E, N]) => { const p = G.g(E, N); return [p.x, p.y]; });
    ctx.save(); ctx.strokeStyle = 'rgba(250,204,21,0.55)'; ctx.setLineDash([10, 6]); ctx.lineWidth = 1; path(c, true); ctx.stroke(); ctx.setLineDash([]); const s = S(c[3][0], c[3][1]); ctx.fillStyle = 'rgba(250,204,21,0.8)'; ctx.font = '10px "Noto Sans TC"'; ctx.fillText(`DEM ${state.dzDem.name}（${dzF(state.dzDem.dx, 0)} m）`, s.x + 4, s.y + 12); ctx.restore(); }
  // 控制點
  state.dzCtrl.forEach((c, k) => { if (!c || !Number.isFinite(c.px) || !Number.isFinite(c.py)) return; const s = S(c.px, c.py); ctx.save(); ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x - 8, s.y); ctx.lineTo(s.x + 8, s.y); ctx.moveTo(s.x, s.y - 8); ctx.lineTo(s.x, s.y + 8); ctx.stroke(); ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 11px "Noto Sans TC"'; ctx.fillText('控制點' + (k + 1), s.x + 8, s.y - 8); ctx.restore(); });
  state.dzCases.forEach((c, ci) => {
    const sel = ci === state.dzSel, z = c.zone || [], bl = c.bl || [];
    if (z.length > 2) { ctx.save(); path(z, true); ctx.fillStyle = sel ? 'rgba(249,115,22,0.20)' : 'rgba(249,115,22,0.12)'; ctx.fill(); ctx.strokeStyle = '#f97316'; ctx.lineWidth = sel ? 2.2 : 1.5; ctx.setLineDash([8, 4]); ctx.stroke(); ctx.setLineDash([]);
      const a = dzCaseCalc(c), cx = z.reduce((s, p) => s + p[0], 0) / z.length, cy = z.reduce((s, p) => s + p[1], 0) / z.length, s = S(cx, cy);
      ctx.font = 'bold 12px "Noto Sans TC"'; ctx.textAlign = 'center'; ctx.fillStyle = '#fdba74'; ctx.fillText(c.name, s.x, s.y - 6); ctx.font = '11px "Noto Sans TC"';
      if (a) ctx.fillText(`平面 ${dzF(a.A2, 1)} m²｜斜面 ${dzF(a.As, 1)} m²`, s.x, s.y + 9); ctx.restore();
      if (sel && !dzEditOn()) z.forEach(p => { const q = S(p[0], p[1]); ctx.fillStyle = '#f97316'; ctx.fillRect(q.x - 3, q.y - 3, 6, 6); }); }
    if (bl.length > 1) { ctx.save(); path(bl, false); ctx.strokeStyle = '#c084fc'; ctx.lineWidth = sel ? 2.4 : 1.8; ctx.stroke();
      const L = dzPolyLen(bl), step = L > 200 ? 50 : 20; ctx.fillStyle = '#d8b4fe'; ctx.font = '10px "Noto Sans TC"'; ctx.textAlign = 'left';
      for (let s0 = 0; s0 <= L + 1e-6; s0 += step) { const g = dzBlAt(bl, Math.min(s0, L)), a = S(g.x + g.nx * 1.2, g.y + g.ny * 1.2), b = S(g.x - g.nx * 1.2, g.y - g.ny * 1.2); ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.fillText(formatStation(Math.min(s0, L)), a.x + 2, a.y - 2); }
      const s1 = S(bl[0][0], bl[0][1]), s2 = S(bl[bl.length - 1][0], bl[bl.length - 1][1]); ctx.font = 'bold 11px "Noto Sans TC"'; ctx.fillText(`${c.name} 基準線 BP`, s1.x + 6, s1.y + 14); ctx.fillText('EP', s2.x + 6, s2.y + 14); ctx.restore(); }
    (c.walls || []).forEach(w => { if (bl.length < 2) return; const P = dzBlSub(bl, Math.min(w.s0, w.s1), Math.max(w.s0, w.s1), (w.side === 'R' ? -1 : 1) * Math.abs(w.off || 0));
      ctx.save(); path(P, false); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3.2; ctx.stroke();
      const sg = dzWallTickSide(c, w), L = dzPolyLen(P); ctx.lineWidth = 1.2; for (let s0 = 0.5; s0 < L; s0 += Math.max(1, L / 40)) { const g = dzBlAt(P, s0), a = S(g.x, g.y), b = S(g.x + g.nx * sg * 1.0, g.y + g.ny * sg * 1.0); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      const m = dzBlAt(P, L / 2), t = S(m.x - m.nx * sg * 2.5, m.y - m.ny * sg * 2.5); ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 11px "Noto Sans TC"'; ctx.textAlign = 'center'; ctx.fillText(`${w.name || '擋土牆'} L=${dzF(L, 1)}m H=${dzF(w.H ?? 3, 1)}m`, t.x, t.y); ctx.restore(); });
    (c.swalls || []).forEach(w => { const P = w.pts || []; if (P.length < 2) return; ctx.save(); path(P, false); ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = sel ? 3.4 : 2.6; ctx.stroke(); ctx.setLineDash([]);
      const L = dzPolyLen(P); ctx.lineWidth = 1; for (let s0 = 0; s0 < L; s0 += Math.max(1, L / 30)) { const g = dzBlAt(P, s0), a = S(g.x, g.y), b = S(g.x + g.nx * 0.8, g.y + g.ny * 0.8); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      const m = dzBlAt(P, L / 2), t = S(m.x - m.nx * 2.2, m.y - m.ny * 2.2); ctx.fillStyle = '#fda4af'; ctx.font = 'bold 11px "Noto Sans TC"'; ctx.textAlign = 'center'; ctx.fillText(`${w.name} L=${dzF(L, 1)}m H=${dzF(w.H, 1)}m`, t.x, t.y);
      const a0 = S(P[0][0], P[0][1]); ctx.font = '10px "Noto Sans TC"'; ctx.textAlign = 'left'; ctx.fillText('BP', a0.x + 4, a0.y - 4); ctx.restore(); });
    (c.secs || []).forEach((w, k) => { const P = w.pts || []; if (P.length < 2) return; ctx.save(); path(P, false); ctx.strokeStyle = sel && k === c.secSel ? '#38bdf8' : 'rgba(56,189,248,0.6)'; ctx.lineWidth = 1.6; ctx.setLineDash([12, 4, 3, 4]); ctx.stroke(); ctx.setLineDash([]);
      const a0 = S(P[0][0], P[0][1]), a1 = S(P[P.length - 1][0], P[P.length - 1][1]); ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 11px "Noto Sans TC"'; ctx.fillText(w.name, a0.x + 5, a0.y - 5); ctx.fillText(w.name + "'", a1.x + 5, a1.y - 5); ctx.restore(); });
    if (sel && dzEditOn()) dzEditHandles(c).forEach(h => { const q = S(h.p[0], h.p[1]); ctx.save(); ctx.fillStyle = h.col; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.fillRect(q.x - 4, q.y - 4, 8, 8); ctx.strokeRect(q.x - 4, q.y - 4, 8, 8); ctx.restore(); });
  });
  // 繪製中的點
  if (state.dzTmp && state.dzTmp.length && DZ_TOOLS.includes(state.activeTool)) { ctx.save(); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; path(state.dzTmp, false); ctx.stroke(); state.dzTmp.forEach(p => { const q = S(p[0], p[1]); ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(q.x, q.y, 3.5, 0, Math.PI * 2); ctx.fill(); }); ctx.restore(); }
}
function dzWallTickSide(c, w) {   // 擋土牆擋土側（背側）：整治區所在那一側；無整治區＝牆所在側
  const sd = w.side === 'R' ? -1 : 1, z = c.zone || [];
  if (z.length > 2) { const cx = z.reduce((s, p) => s + p[0], 0) / z.length, cy = z.reduce((s, p) => s + p[1], 0) / z.length, pr = dzBlProj(c.bl, cx, cy); if (pr) return pr.off >= 0 ? 1 : -1; }
  return sd;
}
/* ---- 繪製工具：滑鼠／鍵盤 ---- */
function dzFinish() {
  const tl = state.activeTool, c = state.dzCases.find(q => state.dzTool && q.id === state.dzTool.cid), P = state.dzTmp.slice();
  if ((tl === 'DZ_ZONE' && P.length >= 3 || tl === 'DZ_BL' && P.length >= 2 || (tl === 'DZ_SWALL' || tl === 'DZ_PROF') && P.length >= 2) && c) pushUndoSnapshot();
  if (tl === 'DZ_SWALL' && c) { if (P.length < 2) { updateStatus('⚠ 坡面擋土牆至少要 2 點。'); return; } c.swalls = c.swalls || []; let k = c.swalls.length + 1; while (c.swalls.some(w => w.name === '坡面牆' + k)) k++; c.swalls.push({ name: '坡面牆' + k, pts: P, H: 3 }); const q = dzSwallCalc(c.swalls[c.swalls.length - 1]); updateStatus(`✅ ${c.name}：坡面牆 長 ${dzF(q.L, 2)} m、牆高 3 m（可於左側修改）；地面高 ${dzF(q.zmin)}～${dzF(q.zmax)} m。`); }
  if (tl === 'DZ_PROF' && c) { if (P.length < 2) { updateStatus('⚠ 剖面線至少要 2 點。'); return; } c.secs = c.secs || []; let k = c.secs.length + 1; while (c.secs.some(w => w.name === '剖面' + k)) k++; c.secs.push({ name: '剖面' + k, pts: P }); c.secSel = c.secs.length - 1; updateStatus(`✅ ${c.name}：${c.secs[c.secSel].name} 長 ${dzF(dzPolyLen(P), 2)} m；左側顯示地形剖面與擋土牆位置。`); }
  if (tl === 'DZ_ZONE' && c) { if (P.length < 3) { updateStatus('⚠ 整治區至少要 3 個頂點。'); return; } c.zone = P; const a = dzCaseCalc(c); updateStatus(`✅ ${c.name} 整治區：${P.length} 點，平面積 ${dzF(a.A2, 1)} m²、斜面積 ${dzF(a.As, 1)} m²（平均坡度 ${dzF(a.slope, 1)}°）。`); }
  else if (tl === 'DZ_BL' && c) { if (P.length < 2) { updateStatus('⚠ 基準線至少要 2 點。'); return; } c.bl = P; updateStatus(`✅ ${c.name} 基準線：長 ${dzF(dzPolyLen(P), 2)} m（BP 0K+000 起算）。`); }
  state.dzTmp = []; setTool('PAN'); dzPanelUI(); requestRedraw();
}
function dzClick(w) {
  const tl = state.activeTool, c = state.dzCases.find(q => state.dzTool && q.id === state.dzTool.cid);
  if (tl === 'DZ_ZONE' || tl === 'DZ_BL' || tl === 'DZ_SWALL' || tl === 'DZ_PROF' || tl === 'DN_BL') { const q = state.dzTmp[state.dzTmp.length - 1]; if (!q || Math.hypot(q[0] - w.x, q[1] - w.y) * dzPxM() > 4) state.dzTmp.push([+w.x.toFixed(3), +w.y.toFixed(3)]); requestRedraw(); return; }
  if (tl === 'DZ_WALL' && c) { const pr = dzBlProj(c.bl, w.x, w.y); if (!pr) return;
    if (!state.dzTool.w0) { state.dzTool.w0 = pr; state.dzTmp = [[w.x, w.y]]; updateStatus(`🧱 起點 ${formatStation(pr.s)}（${pr.off >= 0 ? '左' : '右'}側）；請點迄點。`); requestRedraw(); return; }
    const a = state.dzTool.w0, s0 = Math.min(a.s, pr.s), s1 = Math.max(a.s, pr.s); if (s1 - s0 < 0.5) { updateStatus('⚠ 擋土牆太短。'); return; }
    pushUndoSnapshot(); c.walls.push({ name: `擋土牆${c.walls.length + 1}`, s0: +s0.toFixed(2), s1: +s1.toFixed(2), side: a.off >= 0 ? 'L' : 'R', off: 0, H: 3 });
    state.dzTmp = []; setTool('PAN'); dzPanelUI(); requestRedraw(); updateStatus(`✅ ${c.name}：已沿基準線 ${formatStation(s0)}～${formatStation(s1)} 放置擋土牆（長 ${dzF(s1 - s0, 2)} m）。牆型斷面待擋土牆型式（1-03／0102-1）完成後接上。`); return; }
  if (tl === 'DZ_CTRL' && state.dzTool) { const k = state.dzTool.k, cc = state.dzCtrl[k] || (state.dzCtrl[k] = {}); cc.px = +w.x.toFixed(3); cc.py = +w.y.toFixed(3); setTool('PAN'); switchSideTab('tab-tin', document.querySelector('.panel-tab[data-tab="tab-tin"]')); dzPanelUI(); requestRedraw(); updateStatus(`📍 控制點 ${k + 1}：專案座標 X=${dzF(cc.px, 3)}、Y=${dzF(cc.py, 3)}；請輸入它的 TWD97 或經緯度。`); }
}
window.addEventListener('mousedown', e => {
  if (e.target && e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') return; if (e.button !== 0 || state.viewMode !== '2D') return;
  const r = cadCanvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, tl = state.activeTool;
  if (tl === 'PICK_AXIS') { const pl = dzNearPoly(mx, my); e.preventDefault(); e.stopImmediatePropagation(); if (pl) dzAxisFromPoly(pl); else updateStatus('⚠ 游標附近沒有 DXF 線，請靠近線再點。'); return; }
  if (tl === 'DRAW_AXIS') { const sn = dzSnapPt(mx, my); if (!sn) return; e.preventDefault(); e.stopImmediatePropagation();
    const last = state.tempAxisNodes[state.tempAxisNodes.length - 1]; if (last && Math.hypot(last.x - sn.x, last.y - sn.y) < 0.01) return;
    const defR = Math.max(0, parseFloat((document.getElementById('defaultIpRadius') || {}).value) || 0); state.tempAxisNodes.push({ x: +sn.x.toFixed(3), y: +sn.y.toFixed(3), r: defR });
    updateStatus(`🧲 已鎖點 [${state.tempAxisNodes.length === 1 ? 'BP (起點)' : 'IP' + (state.tempAxisNodes.length - 1)}] (${dzF(sn.x, 3)}, ${dzF(sn.y, 3)})；繼續點選，右鍵／Enter／雙擊結束；Backspace 退回上一點。`); requestRedraw(); return; }
  if (!DZ_TOOLS.includes(tl)) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const sn = dzSnapPt(mx, my), w = sn || screenToWorld2D(mx, my); dzClick(w);
}, true);
window.addEventListener('dblclick', e => { if (e.target && e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') return; if (['DZ_ZONE', 'DZ_BL', 'DZ_SWALL', 'DZ_PROF', 'DN_BL'].includes(state.activeTool)) { e.preventDefault(); e.stopImmediatePropagation(); dzFinish(); } }, true);
window.addEventListener('contextmenu', e => { if (e.target && e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') return; if (['DZ_ZONE', 'DZ_BL', 'DZ_SWALL', 'DZ_PROF', 'DN_BL'].includes(state.activeTool)) { e.preventDefault(); e.stopImmediatePropagation(); dzFinish(); } else if (DZ_TOOLS.includes(state.activeTool)) { e.preventDefault(); e.stopImmediatePropagation(); state.dzTmp = []; setTool('PAN'); } }, true);
window.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
  const tl = state.activeTool, undo = e.key === 'Backspace' || ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z'));
  if (tl === 'DRAW_AXIS' && undo) { e.preventDefault(); e.stopImmediatePropagation(); dzAxisUndo(); return; }
  if (!DZ_TOOLS.includes(tl)) return;
  if (undo) { e.preventDefault(); e.stopImmediatePropagation(); state.dzTmp.pop(); if (state.dzTool && tl === 'DZ_WALL') state.dzTool.w0 = null; requestRedraw(); axisOvDraw(); return; }
  if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); dzFinish(); return; }
  if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); state.dzTmp = []; setTool('PAN'); updateStatus('已取消。'); }
}, true);
function dzOvActive() { return DZ_TOOLS.includes(state.activeTool); }
function dzOvDraw(oc) {
  const tl = state.activeTool, m = AXOV_LAST; if (!m) return;
  if (tl === 'PICK_AXIS') { const pl = dzNearPoly(m.x, m.y); if (pl) { oc.strokeStyle = '#ff00ff'; oc.lineWidth = 3; oc.beginPath(); pl.pts.forEach((p, i) => { const s = worldToScreen2D(p.x, p.y); i ? oc.lineTo(s.x, s.y) : oc.moveTo(s.x, s.y); }); oc.stroke(); const s = worldToScreen2D(pl.pts[0].x, pl.pts[0].y); oc.fillStyle = '#ff00ff'; oc.font = 'bold 12px "Noto Sans TC"'; oc.fillText('BP', s.x + 6, s.y - 6); } return; }
  const sn = dzSnapPt(m.x, m.y), mp = sn ? worldToScreen2D(sn.x, sn.y) : m;
  if (sn) { oc.strokeStyle = '#ff00ff'; oc.lineWidth = 2; oc.strokeRect(mp.x - 6, mp.y - 6, 12, 12); }
  const T = state.dzTmp; if (T && T.length && ['DZ_ZONE', 'DZ_BL', 'DZ_WALL', 'DZ_SWALL', 'DZ_PROF', 'DN_BL'].includes(tl)) { const a = worldToScreen2D(T[T.length - 1][0], T[T.length - 1][1]); oc.strokeStyle = '#facc15'; oc.lineWidth = 2; oc.setLineDash([6, 4]); oc.beginPath(); oc.moveTo(a.x, a.y); oc.lineTo(mp.x, mp.y); if (tl === 'DZ_ZONE' && T.length > 1) { const b = worldToScreen2D(T[0][0], T[0][1]); oc.lineTo(b.x, b.y); } oc.stroke(); oc.setLineDash([]); }
}
/* ---- DXF（全圖平面）：案件只輸出一次 ---- */
function dzDxfPlan(D) {
  if (D._dz) return; D._dz = true;
  state.dzCases.forEach(c => {
    const z = c.zone || [], bl = c.bl || [], a = dzCaseCalc(c);
    if (z.length > 2) { D.poly(z, 'DZ_ZONE', 30, 0, true, 'DASHED'); const cx = z.reduce((s, p) => s + p[0], 0) / z.length, cy = z.reduce((s, p) => s + p[1], 0) / z.length; D.text(cx, cy + 1.2, 1.6, c.name, 'DZ_TEXT', 30, { align: 'c' }); if (a) D.text(cx, cy - 1.2, 1.2, `平面積 ${dzF(a.A2, 1)} m2  斜面積 ${dzF(a.As, 1)} m2`, 'DZ_TEXT', 30, { align: 'c' }); }
    if (bl.length > 1) { D.poly(bl, 'DZ_BASELINE', 6); const L = dzPolyLen(bl), step = L > 200 ? 50 : 20; for (let s0 = 0; s0 <= L + 1e-6; s0 += step) { const g = dzBlAt(bl, Math.min(s0, L)); D.line(g.x + g.nx, g.y + g.ny, 0, g.x - g.nx, g.y - g.ny, 0, 'DZ_BASELINE', 6); D.text(g.x + g.nx * 1.4, g.y + g.ny * 1.4, 1.0, formatStation(Math.min(s0, L)), 'DZ_TEXT', 6, { rot: Math.atan2(g.ny, g.nx) * 180 / Math.PI }); } D.text(bl[0][0], bl[0][1] - 2, 1.2, c.name + ' 基準線 BP', 'DZ_TEXT', 6); }
    (c.walls || []).forEach(w => { if (bl.length < 2) return; const P = dzBlSub(bl, Math.min(w.s0, w.s1), Math.max(w.s0, w.s1), (w.side === 'R' ? -1 : 1) * Math.abs(w.off || 0)), sg = dzWallTickSide(c, w), L = dzPolyLen(P); D.poly(P, 'DZ_WALL', 1);
      for (let s0 = 0.5; s0 < L; s0 += Math.max(1, L / 40)) { const g = dzBlAt(P, s0); D.line(g.x, g.y, 0, g.x + g.nx * sg, g.y + g.ny * sg, 0, 'DZ_WALL', 1); }
      const m = dzBlAt(P, L / 2); D.text(m.x - m.nx * sg * 2.5, m.y - m.ny * sg * 2.5, 1.2, `${w.name || '擋土牆'} L=${dzF(L, 2)}m H=${dzF(w.H ?? 3, 2)}m`, 'DZ_TEXT', 1, { align: 'c' }); });
    (c.swalls || []).forEach(w => { const P = w.pts || []; if (P.length < 2) return; const L = dzPolyLen(P); D.poly(P, 'DZ_SWALL', 1); for (let s0 = 0; s0 < L; s0 += Math.max(1, L / 30)) { const g = dzBlAt(P, s0); D.line(g.x, g.y, 0, g.x + g.nx * 0.8, g.y + g.ny * 0.8, 0, 'DZ_SWALL', 1); }
      const m = dzBlAt(P, L / 2); D.text(m.x - m.nx * 2.2, m.y - m.ny * 2.2, 1.2, `${w.name} L=${dzF(L, 2)}m H=${dzF(w.H, 2)}m`, 'DZ_TEXT', 1, { align: 'c' }); });
    (c.secs || []).forEach(w => { const P = w.pts || []; if (P.length < 2) return; D.poly(P, 'DZ_SECLINE', 4, 0, false, 'DASHED'); D.text(P[0][0], P[0][1] + 1, 1.2, w.name, 'DZ_TEXT', 4); D.text(P[P.length - 1][0], P[P.length - 1][1] + 1, 1.2, w.name + "'", 'DZ_TEXT', 4); });
  });
  dzDxfProfiles(D);
}
function dzCaseSheet() {
  if (!state.dzCases.length) return null; const H = a => a.map(v => ({ v, s: 1 })), r2 = v => Math.round(v * 1000) / 1000;
  const rows = [[{ v: '崩塌地整治：整治區面積與擋土牆', s: 5 }], [`斜面積＝細網格三角形（地面高程取自實測三角網，缺測處以 DEM）以海龍公式計算 3D 面積後加總，邊界依整治區多邊形裁切`], [], H(['案件', '項目', '起點', '迄點', '數量', '單位', '說明'])];
  state.dzCases.forEach(c => { const a = dzCaseCalc(c);
    if (a) { rows.push([{ v: c.name, s: 2 }, { v: '整治區平面積（水平投影）', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: r2(a.A2), s: 3 }, { v: 'm²', s: 2 }, { v: `${(c.zone || []).length} 頂點`, s: 10 }]);
      rows.push([{ v: c.name, s: 2 }, { v: '整治區斜面積（坡面實際面積；掛網植生等坡面工以此計）', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: r2(a.As), s: 3 }, { v: 'm²', s: 2 }, { v: `平均坡度 ${dzF(a.slope, 1)}°；網格 ${dzF(a.h, 2)} m；實測 ${dzF(a.tin * 100, 0)}%、DEM ${dzF(a.dem * 100, 0)}%${a.none > 0.001 ? `、無地形資料 ${dzF(a.none * 100, 0)}%（以平面計）` : ''}`, s: 10 }]); }
    if ((c.bl || []).length > 1) rows.push([{ v: c.name, s: 2 }, { v: '基準線長', s: 2 }, { v: '0K+000', s: 2 }, { v: formatStation(dzPolyLen(c.bl)), s: 2 }, { v: r2(dzPolyLen(c.bl)), s: 3 }, { v: 'm', s: 2 }, { v: '', s: 10 }]);
    (c.walls || []).forEach(w => rows.push([{ v: c.name, s: 2 }, { v: `${w.name || '擋土牆'}（沿基準線${w.side === 'R' ? '右' : '左'}側${w.off ? '、偏距 ' + dzF(Math.abs(w.off)) + ' m' : ''}）`, s: 2 }, { v: formatStation(Math.min(w.s0, w.s1)), s: 2 }, { v: formatStation(Math.max(w.s0, w.s1)), s: 2 }, { v: r2(dzPolyLen(dzBlSub(c.bl, Math.min(w.s0, w.s1), Math.max(w.s0, w.s1), (w.side === 'R' ? -1 : 1) * Math.abs(w.off || 0)))), s: 3 }, { v: 'm', s: 2 }, { v: `牆高 H＝${dzF(w.H ?? 3, 2)} m；牆面積 L×H＝${dzF(dzPolyLen(dzBlSub(c.bl, Math.min(w.s0, w.s1), Math.max(w.s0, w.s1), (w.side === 'R' ? -1 : 1) * Math.abs(w.off || 0))) * (w.H ?? 3), 2)} m²（牆型斷面待擋土牆型式完成後接上）`, s: 10 }]));
    (c.swalls || []).forEach(w => { const q = dzSwallCalc(w); rows.push([{ v: c.name, s: 2 }, { v: `${w.name}（坡面自由畫線）`, s: 2 }, { v: '0K+000', s: 2 }, { v: formatStation(q.L), s: 2 }, { v: r2(q.L), s: 3 }, { v: 'm', s: 2 }, { v: `牆高 H＝${dzF(w.H, 2)} m；牆面積 L×H＝${dzF(q.A, 2)} m²；牆底地面高 ${dzF(q.zmin)}～${dzF(q.zmax)} m（取自三角網／DEM）`, s: 10 }]); });
  });
  return { name: '崩塌地整治', cols: [12, 46, 11, 11, 12, 7, 60], rows, freeze: 4, merges: ['A1:G1'] };
}

/* ===================== v5.7 頂點編輯（拖曳、雙擊插入、右鍵刪除；皆可 Ctrl+Z 復原） ===================== */
function dzEditOn() { const t = document.getElementById('tab-dz'); return !!(t && t.style.display !== 'none' && state.viewMode === '2D' && !DZ_TOOLS.includes(state.activeTool) && dzCase()); }
function dzEditLists(c) {   // 可編輯折線：[{arr, closed, min, col, lab}]
  const L = [];
  if ((c.zone || []).length) L.push({ arr: c.zone, closed: true, min: 3, col: '#f97316', lab: '整治區' });
  if ((c.bl || []).length) L.push({ arr: c.bl, closed: false, min: 2, col: '#c084fc', lab: '基準線' });
  (c.swalls || []).forEach(w => { if ((w.pts || []).length) L.push({ arr: w.pts, closed: false, min: 2, col: '#f43f5e', lab: w.name }); });
  (c.secs || []).forEach(w => { if ((w.pts || []).length) L.push({ arr: w.pts, closed: false, min: 2, col: '#38bdf8', lab: w.name }); });
  return L;
}
function dzEditHandles(c) { const H = []; dzEditLists(c).forEach(l => l.arr.forEach((p, i) => H.push({ p, i, l, col: l.col }))); return H; }
function dzHit(mx, my) { const c = dzCase(); if (!c) return null; let best = null, bd = 8; dzEditHandles(c).forEach(h => { const q = worldToScreen2D(h.p[0], h.p[1]), d = Math.hypot(q.x - mx, q.y - my); if (d < bd) { bd = d; best = h; } }); return best; }
function dzHitEdge(mx, my) {   // 游標 6 px 內最近的邊 → {l, i（插在 i 之後）, w}
  const c = dzCase(); if (!c) return null; let best = null, bd = 6;
  dzEditLists(c).forEach(l => { const A = l.arr, n = A.length; for (let i = 0; i < (l.closed ? n : n - 1); i++) { const a = worldToScreen2D(A[i][0], A[i][1]), b = worldToScreen2D(A[(i + 1) % n][0], A[(i + 1) % n][1]), dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((mx - a.x) * dx + (my - a.y) * dy) / L2)), d = Math.hypot(a.x + dx * t - mx, a.y + dy * t - my);
    if (d < bd && t > 0.02 && t < 0.98) { bd = d; best = { l, i, w: [A[i][0] + (A[(i + 1) % n][0] - A[i][0]) * t, A[i][1] + (A[(i + 1) % n][1] - A[i][1]) * t] }; } } });
  return best;
}
function dzEdited(c) { c._k = null; dzPanelUI(); requestRedraw(); }
window.addEventListener('mousedown', e => {
  if (e.button !== 0 || !e.target || (e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') || !dzEditOn()) return;
  const r = cadCanvas.getBoundingClientRect(), h = dzHit(e.clientX - r.left, e.clientY - r.top); if (!h) return;
  e.preventDefault(); e.stopImmediatePropagation(); pushUndoSnapshot(); state.dzDrag = { pt: h.p, l: h.l, moved: false }; updateStatus(`✋ 拖曳 ${h.l.lab} 頂點 ${h.i + 1}（Alt＝不鎖點；放開完成；Ctrl+Z 復原）。`);
}, true);
window.addEventListener('mousemove', e => {
  if (!state.dzDrag) return; e.preventDefault(); e.stopImmediatePropagation();
  const r = cadCanvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, sn = e.altKey ? null : dzSnapPt(mx, my), w = sn || screenToWorld2D(mx, my);
  state.dzDrag.pt[0] = +w.x.toFixed(3); state.dzDrag.pt[1] = +w.y.toFixed(3); state.dzDrag.moved = true; dzCase()._k = null; requestRedraw();
}, true);
window.addEventListener('mouseup', e => { if (!state.dzDrag) return; e.preventDefault(); e.stopImmediatePropagation(); const d = state.dzDrag; state.dzDrag = null; if (!d.moved) state.undoStack.pop(); dzEdited(dzCase()); if (d.moved) updateStatus(`✅ 已移動 ${d.l.lab} 頂點。`); }, true);
window.addEventListener('dblclick', e => {
  if (!e.target || (e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') || !dzEditOn()) return;
  const r = cadCanvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; if (dzHit(mx, my)) return; const ed = dzHitEdge(mx, my); if (!ed) return;
  e.preventDefault(); e.stopImmediatePropagation(); pushUndoSnapshot(); ed.l.arr.splice(ed.i + 1, 0, [+ed.w[0].toFixed(3), +ed.w[1].toFixed(3)]); dzEdited(dzCase()); updateStatus(`➕ 已在 ${ed.l.lab} 第 ${ed.i + 1}～${ed.i + 2} 點之間插入頂點。`);
}, true);
window.addEventListener('contextmenu', e => {
  if (!e.target || (e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') || !dzEditOn()) return;
  const r = cadCanvas.getBoundingClientRect(), h = dzHit(e.clientX - r.left, e.clientY - r.top); if (!h) return; e.preventDefault(); e.stopImmediatePropagation();
  if (h.l.arr.length <= h.l.min) { updateStatus(`⚠ ${h.l.lab} 至少要 ${h.l.min} 個頂點，無法再刪。`); return; }
  pushUndoSnapshot(); h.l.arr.splice(h.i, 1); dzEdited(dzCase()); updateStatus(`🗑 已刪除 ${h.l.lab} 頂點 ${h.i + 1}。`);
}, true);
/* ===================== v5.7 坡面擋土牆（自由畫線）與坡面剖面 ===================== */
function dzZn(x, y) { const r = dzZAt(x, y); return r ? r.z : NaN; }
function dzSwallCalc(w) {   // 長度、牆底地面高（沿線取樣三角網／DEM）、牆頂線、牆面積 L×H
  const P = w.pts || [], L = dzPolyLen(P), n = Math.max(2, Math.ceil(L / 0.5)), G = [];
  for (let i = 0; i <= n; i++) { const s0 = L * i / n, g = dzBlAt(P, s0), z = dzZn(g.x, g.y); G.push({ s: s0, x: g.x, y: g.y, z }); }
  const zs = G.map(q => q.z).filter(Number.isFinite);
  return { L, G, A: L * (+w.H || 0), zmin: zs.length ? Math.min(...zs) : NaN, zmax: zs.length ? Math.max(...zs) : NaN };
}
function dzSegX(a, b, c, d) { const r = [b[0] - a[0], b[1] - a[1]], q = [d[0] - c[0], d[1] - c[1]], den = r[0] * q[1] - r[1] * q[0]; if (Math.abs(den) < 1e-12) return null; const t = ((c[0] - a[0]) * q[1] - (c[1] - a[1]) * q[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null; }
function dzPolyX(S, P) {   // 剖面線 S 與折線 P 的交點 → 剖面樁號 [s]
  const out = []; let s0 = 0;
  for (let i = 0; i + 1 < S.length; i++) { const L = Math.hypot(S[i + 1][0] - S[i][0], S[i + 1][1] - S[i][1]); for (let j = 0; j + 1 < P.length; j++) { const t = dzSegX(S[i], S[i + 1], P[j], P[j + 1]); if (t !== null) out.push(s0 + t * L); } s0 += L; }
  return out;
}
function dzProfData(c, sec) {
  const S = sec.pts || [], L = dzPolyLen(S), n = Math.max(20, Math.min(600, Math.ceil(L / 0.5))), G = [];
  for (let i = 0; i <= n; i++) { const s0 = L * i / n, g = dzBlAt(S, s0); G.push({ s: s0, z: dzZn(g.x, g.y) }); }
  const zAt = s0 => { const i = Math.max(0, Math.min(n - 1, Math.floor(s0 / L * n))), a = G[i], b = G[i + 1], t = (s0 - a.s) / ((b.s - a.s) || 1); return Number.isFinite(a.z) && Number.isFinite(b.z) ? a.z + (b.z - a.z) * t : (Number.isFinite(a.z) ? a.z : b.z); };
  const W = [];
  (c.walls || []).forEach(w => { if ((c.bl || []).length < 2) return; const P = dzBlSub(c.bl, Math.min(w.s0, w.s1), Math.max(w.s0, w.s1), (w.side === 'R' ? -1 : 1) * Math.abs(w.off || 0)); dzPolyX(S, P).forEach(s0 => W.push({ s: s0, z: zAt(s0), H: +(w.H ?? 3), name: w.name || '擋土牆' })); });
  (c.swalls || []).forEach(w => dzPolyX(S, w.pts || []).forEach(s0 => W.push({ s: s0, z: zAt(s0), H: +w.H || 0, name: w.name })));
  const Z = (c.zone || []).length > 2 ? dzPolyX(S, c.zone.concat([c.zone[0]])) : [], B = (c.bl || []).length > 1 ? dzPolyX(S, c.bl) : [];
  return { L, G, W, Z, B, zAt };
}
function dzProfDraw(cv, c, sec, big) {
  const g = cv.getContext('2d'), Wd = cv.width, Ht = cv.height, D = dzProfData(c, sec), zs = D.G.map(q => q.z).filter(Number.isFinite).concat(D.W.map(w => w.z + w.H).filter(Number.isFinite));
  g.fillStyle = '#0b1220'; g.fillRect(0, 0, Wd, Ht); if (!zs.length) { g.fillStyle = '#94a3b8'; g.font = '12px sans-serif'; g.fillText('剖面線沒有地形資料（三角網／DEM）', 10, 20); return; }
  let z0 = Math.min(...zs), z1 = Math.max(...zs); const pad = (z1 - z0) * 0.12 + 0.5; z0 -= pad; z1 += pad;
  const ml = big ? 56 : 40, mr = 12, mt = 14, mb = big ? 34 : 26, sx = (Wd - ml - mr) / (D.L || 1), sy = (Ht - mt - mb) / (z1 - z0), kx0 = sx, kx = sy < sx ? sy : sx, ky = sy < sx ? sy : Math.min(sy, sx * 6);   // 橫縱同比例；地形起伏小時縱向放大（最多 6 倍）
  const X = v => ml + v * kx, Y = z => Ht - mb - (z - z0) * ky, fs = big ? 12 : 10;
  g.strokeStyle = '#1e293b'; g.lineWidth = 1; g.fillStyle = '#64748b'; g.font = `${fs}px sans-serif`;
  const zt = Math.pow(10, Math.floor(Math.log10((z1 - z0) / 4))), zst = (z1 - z0) / zt > 8 ? zt * 2 : zt; for (let z = Math.ceil(z0 / zst) * zst; z <= z1; z += zst) { g.beginPath(); g.moveTo(ml, Y(z)); g.lineTo(Wd - mr, Y(z)); g.stroke(); g.fillText(z.toFixed(zst < 1 ? 1 : 0), 2, Y(z) + 3); }
  const st = D.L > 200 ? 50 : D.L > 60 ? 10 : 5; for (let v = 0; v <= D.L + 1e-6; v += st) { g.beginPath(); g.moveTo(X(v), mt); g.lineTo(X(v), Ht - mb); g.stroke(); g.fillText(formatStation(v), X(v) - 14, Ht - mb + fs + 2); }
  D.Z.forEach(v => { g.strokeStyle = 'rgba(249,115,22,.7)'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(v), mt); g.lineTo(X(v), Ht - mb); g.stroke(); g.setLineDash([]); g.fillStyle = '#fdba74'; g.fillText('整治區界', X(v) + 2, mt + fs); });
  D.B.forEach(v => { g.strokeStyle = 'rgba(192,132,252,.8)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(v), mt); g.lineTo(X(v), Ht - mb); g.stroke(); g.setLineDash([]); g.fillStyle = '#d8b4fe'; g.fillText('基準線', X(v) + 2, mt + fs * 2.2); });
  g.strokeStyle = '#e2e8f0'; g.lineWidth = 1.6; g.beginPath(); let on = false; D.G.forEach(q => { if (!Number.isFinite(q.z)) { on = false; return; } on ? g.lineTo(X(q.s), Y(q.z)) : g.moveTo(X(q.s), Y(q.z)); on = true; }); g.stroke();
  D.W.forEach(w => { if (!Number.isFinite(w.z)) return; const x = X(w.s), bw = Math.max(4, 0.5 * kx); g.fillStyle = 'rgba(244,63,94,.55)'; g.strokeStyle = '#f43f5e'; g.lineWidth = 1.2; g.fillRect(x - bw / 2, Y(w.z + w.H), bw, Y(w.z) - Y(w.z + w.H)); g.strokeRect(x - bw / 2, Y(w.z + w.H), bw, Y(w.z) - Y(w.z + w.H));
    g.fillStyle = '#fda4af'; g.font = `bold ${fs}px sans-serif`; g.fillText(`${w.name} H=${dzF(w.H, 1)}`, x + bw / 2 + 2, Y(w.z + w.H) - 2); g.font = `${fs}px sans-serif`; g.fillText(`${formatStation(w.s)} 地面 ${dzF(w.z)}`, x + bw / 2 + 2, Y(w.z + w.H) + fs); });
  g.fillStyle = '#7dd3fc'; g.font = `bold ${fs + 1}px sans-serif`; g.fillText(`${sec.name}（${sec.name}′）　長 ${dzF(D.L, 1)} m　縱向放大 ${dzF(ky / kx, 1)} 倍`, ml + 4, mt - 2 + fs);
}
function dzProfBig() { const c = dzCase(), sec = c && (c.secs || [])[c.secSel || 0]; if (!sec) return; let d = document.getElementById('dzProfDlg'); if (!d) { d = document.createElement('div'); d.id = 'dzProfDlg'; document.body.appendChild(d); }
  d.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;';
  d.innerHTML = `<div style="background:#0f172a;border-radius:8px;padding:8px;box-shadow:0 20px 50px rgba(0,0,0,.4);"><div style="display:flex;justify-content:space-between;color:#e2e8f0;margin-bottom:4px;"><b>📈 ${escAttr(c.name)}　坡面剖面　${escAttr(sec.name)}</b><button class="btn" onclick="document.getElementById('dzProfDlg').style.display='none'">關閉 ✕</button></div><canvas id="dzProfBigCv" width="${Math.min(1400, innerWidth - 80)}" height="${Math.min(620, innerHeight - 120)}"></canvas></div>`;
  dzProfDraw(document.getElementById('dzProfBigCv'), c, sec, true); }
function dzDxfProfiles(D) {   // DXF：各案件剖面畫在平面圖右側（1:1，圖面單位 m）
  const bb = state.coreBounds || { maxX: 0, minY: 0 }; let ox = (bb.maxX || 0) + 80, oy = (bb.maxY || 0);
  state.dzCases.forEach(c => (c.secs || []).forEach(sec => { const P = dzProfData(c, sec), zs = P.G.map(q => q.z).filter(Number.isFinite); if (!zs.length) return; const z0 = Math.floor(Math.min(...zs)) - 2, X = v => ox + v, Y = z => oy + (z - z0);
    D.text(ox, Y(Math.max(...zs) + 4), 1.6, `${c.name}　坡面剖面 ${sec.name}（1:1）`, 'DZ_PROFILE', 4);
    let pts = []; P.G.forEach(q => { if (Number.isFinite(q.z)) pts.push([X(q.s), Y(q.z)]); else if (pts.length) { D.poly(pts, 'DZ_PROFILE', 7); pts = []; } }); if (pts.length > 1) D.poly(pts, 'DZ_PROFILE', 7);
    D.line(X(0), Y(z0), 0, X(P.L), Y(z0), 0, 'DZ_PROFILE', 8); for (let v = 0; v <= P.L + 1e-6; v += 10) D.text(X(v), Y(z0) - 1.2, 0.8, formatStation(v), 'DZ_TEXT', 8, { align: 'c' });
    P.W.forEach(w => { if (!Number.isFinite(w.z)) return; D.poly([[X(w.s) - 0.25, Y(w.z)], [X(w.s) + 0.25, Y(w.z)], [X(w.s) + 0.25, Y(w.z + w.H)], [X(w.s) - 0.25, Y(w.z + w.H)]], 'DZ_WALL', 1, 0, true); D.text(X(w.s) + 0.5, Y(w.z + w.H) + 0.3, 0.9, `${w.name} H=${dzF(w.H, 2)}m`, 'DZ_TEXT', 1); });
    oy -= (Math.max(...zs) - z0) + 12; }));
}
/* ===================== 左側面板「崩塌地」（底圖／控制點／DEM 移到「圖層/等高線」） ===================== */
function dzSwSet(k, f, v) { const c = dzCase(), w = c && (c.swalls || [])[k]; if (!w) return; pushUndoSnapshot(); if (f === 'name') w.name = String(v).trim() || w.name; else { const x = parseFloat(v); if (Number.isFinite(x)) w.H = Math.max(0, x); } dzPanelUI(); requestRedraw(); }
function dzSwDel(k) { const c = dzCase(); if (!c) return; pushUndoSnapshot(); c.swalls.splice(k, 1); dzPanelUI(); requestRedraw(); }
function dzSecDel(k) { const c = dzCase(); if (!c) return; pushUndoSnapshot(); c.secs.splice(k, 1); c.secSel = Math.max(0, Math.min(c.secSel || 0, c.secs.length - 1)); dzPanelUI(); requestRedraw(); }
function dzPanelUI() {
  dzMapUI();
  const box = document.getElementById('dzPanel'); if (!box) return;
  if (box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'checkbox') return;
  const C = state.dzCases, c = dzCase();
  const caseRows = C.map((q, i) => { const a = dzCaseCalc(q); return `<tr onclick="state.dzSel=${i};dzPanelUI();requestRedraw();" style="cursor:pointer;${i === state.dzSel ? 'background:rgba(249,115,22,.12);' : ''}"><td><input class="input-text" style="width:70px;" value="${escAttr(q.name)}" onclick="event.stopPropagation()" onchange="dzRename(${i},this.value)"></td><td style="text-align:right;">${a ? dzF(a.A2, 1) : '—'}</td><td style="text-align:right;">${a ? dzF(a.As, 1) : '—'}</td><td style="text-align:right;">${(q.bl || []).length > 1 ? dzF(dzPolyLen(q.bl), 1) : '—'}</td><td style="text-align:center;">${(q.walls || []).length + (q.swalls || []).length}</td><td><button class="btn" style="padding:1px 6px;" onclick="event.stopPropagation();dzDelCase(${i})">✕</button></td></tr>`; }).join('');
  let det = '';
  if (c) { const a = dzCaseCalc(c), SW = c.swalls || [], SC = c.secs || [], cur = SC[c.secSel || 0];
    const wl = (c.walls || []).length ? `<div style="font-size:11px;font-weight:700;margin-top:6px;">沿基準線擋土牆（樁號跟隨基準線）</div><div class="pt-table-wrap" style="margin-top:3px;max-height:160px;"><table class="pt-table"><thead><tr><th>擋土牆</th><th>起樁</th><th>迄樁</th><th>側</th><th>偏距m</th><th>牆高m</th><th>長m</th><th></th></tr></thead><tbody>${c.walls.map((w, k) => `<tr><td><input class="input-text" style="width:58px;" value="${escAttr(w.name || '')}" onchange="dzWallSet(${k},'name',this.value)"></td><td><input type="number" class="input-num" style="width:54px;" step="0.5" value="${w.s0}" onchange="dzWallSet(${k},'s0',this.value)"></td><td><input type="number" class="input-num" style="width:54px;" step="0.5" value="${w.s1}" onchange="dzWallSet(${k},'s1',this.value)"></td><td><select class="input-select" onchange="dzWallSet(${k},'side',this.value)"><option value="L"${w.side !== 'R' ? ' selected' : ''}>左</option><option value="R"${w.side === 'R' ? ' selected' : ''}>右</option></select></td><td><input type="number" class="input-num" style="width:40px;" step="0.5" min="0" value="${w.off || 0}" onchange="dzWallSet(${k},'off',this.value)"></td><td><input type="number" class="input-num" style="width:44px;" step="0.1" min="0" value="${w.H ?? 3}" onchange="dzWallSet(${k},'H',this.value)"></td><td style="text-align:right;">${dzF(Math.abs(w.s1 - w.s0), 2)}</td><td><button class="btn" style="padding:1px 6px;" onclick="dzWallDel(${k})">✕</button></td></tr>`).join('')}</tbody></table></div>` : '';
    const sl = SW.length ? `<div style="font-size:11px;font-weight:700;margin-top:6px;">坡面擋土牆（自由畫線，各自樁號）</div><div class="pt-table-wrap" style="margin-top:3px;max-height:160px;"><table class="pt-table"><thead><tr><th>名稱</th><th>長m</th><th>牆高m</th><th>L×H m²</th><th>地面高m</th><th></th></tr></thead><tbody>${SW.map((w, k) => { const q = dzSwallCalc(w); return `<tr><td><input class="input-text" style="width:62px;" value="${escAttr(w.name)}" onchange="dzSwSet(${k},'name',this.value)"></td><td style="text-align:right;">${dzF(q.L, 2)}</td><td><input type="number" class="input-num" style="width:48px;" step="0.1" min="0" value="${w.H}" onchange="dzSwSet(${k},'H',this.value)"></td><td style="text-align:right;">${dzF(q.A, 2)}</td><td style="font-size:10.5px;">${dzF(q.zmin)}～${dzF(q.zmax)}</td><td><button class="btn" style="padding:1px 6px;" onclick="dzSwDel(${k})">✕</button></td></tr>`; }).join('')}</tbody></table></div><div style="font-size:10px;color:var(--text-muted);line-height:1.5;">牆底沿牆線取三角網／DEM 地面高，牆頂線＝地面高＋牆高；牆型斷面待擋土牆型式完成後接上（「沿等高線」輔助之後再做）。</div>` : '';
    const pf = SC.length ? `<div style="font-size:11px;font-weight:700;margin-top:6px;display:flex;justify-content:space-between;align-items:center;">坡面剖面 <span><select class="input-select" onchange="dzCase().secSel=+this.value;dzPanelUI();requestRedraw();">${SC.map((w, k) => `<option value="${k}"${k === (c.secSel || 0) ? ' selected' : ''}>${escAttr(w.name)}</option>`).join('')}</select> <button class="btn" style="padding:1px 6px;" onclick="dzProfBig()">放大</button> <button class="btn" style="padding:1px 6px;" onclick="dzSecDel(${c.secSel || 0})">✕</button></span></div><canvas id="dzProfCv" width="420" height="200" style="width:100%;margin-top:3px;border-radius:4px;"></canvas>` : '';
    det = `<div style="margin-top:6px;padding:6px 8px;border:1px solid var(--border-dim);border-radius:4px;background:rgba(249,115,22,.05);font-size:11.5px;line-height:1.6;">
      <b style="color:#c2410c;">${escAttr(c.name)}</b>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px;"><button class="btn${state.activeTool === 'DZ_ZONE' ? ' active' : ''}" onclick="dzStartDraw('zone')">🟧 ${c.zone && c.zone.length > 2 ? '重畫' : '畫'}整治區</button><button class="btn${state.activeTool === 'DZ_BL' ? ' active' : ''}" onclick="dzStartDraw('bl')">🟪 ${c.bl && c.bl.length > 1 ? '重畫' : '畫'}基準線</button><button class="btn${state.activeTool === 'DZ_WALL' ? ' active' : ''}" onclick="dzStartDraw('wall')">🧱 沿基準線加牆</button><button class="btn${state.activeTool === 'DZ_SWALL' ? ' active' : ''}" onclick="dzStartDraw('swall')">🟥 坡面畫擋土牆</button><button class="btn${state.activeTool === 'DZ_PROF' ? ' active' : ''}" style="grid-column:span 2;" onclick="dzStartDraw('prof')">📈 畫坡面剖面線</button></div>
      <div style="font-size:10.5px;color:#0369a1;margin-top:4px;line-height:1.5;">✏ 編輯：開著本頁籤時，平面圖上本案的頂點可直接<b>拖曳</b>；<b>雙擊</b>邊線插入頂點；<b>右鍵</b>頂點刪除（整治區至少 3 點、線至少 2 點）；以上皆可 Ctrl+Z 復原。</div>
      ${a ? `<div style="margin-top:5px;">平面積 <b>${dzF(a.A2, 2)}</b> m²｜<b style="color:#c2410c;">斜面積 ${dzF(a.As, 2)} m²</b>｜平均坡度 ${dzF(a.slope, 1)}°<br><span style="font-size:10.5px;color:var(--text-muted);">斜面積＝網格 ${dzF(a.h, 2)} m 的細三角形，高程取自實測三角網（${dzF(a.tin * 100, 0)}%）${a.dem > 0.0005 ? `、DEM（${dzF(a.dem * 100, 0)}%）` : ''}，逐一以海龍公式算 3D 面積後加總，邊界依多邊形裁切。${a.none > 0.001 ? `<b style="color:#b45309;">有 ${dzF(a.none * 100, 0)}% 範圍沒有地形資料，該部分以平面計。</b>` : ''}掛網植生、柔性防護網等坡面工以斜面積計。</span></div>` : '<div style="font-size:10.5px;color:var(--text-muted);margin-top:4px;">尚未畫整治區。</div>'}
      ${wl}${sl}${pf}
    </div>`; }
  box.innerHTML = `
  <div class="sec-card"><div class="sec-title"><span>⛰ 崩塌地整治</span></div>
    <div style="font-size:10.5px;color:var(--text-muted);line-height:1.55;">每個案件＝一塊整治區（任意多邊形，算平面積與斜面積）＋一條基準線（BP→IP→EP）＋擋土牆（沿基準線放置，或在坡面上自由畫線）＋坡面剖面。國土測繪中心底圖、控制點、DEM 在「圖層/等高線」頁籤。</div>
    ${C.length ? `<div class="pt-table-wrap" style="max-height:170px;margin-top:4px;"><table class="pt-table"><thead><tr><th>案件</th><th>平面積m²</th><th>斜面積m²</th><th>基準線m</th><th>牆</th><th></th></tr></thead><tbody>${caseRows}</tbody></table></div>` : ''}
    <div style="margin-top:5px;"><button class="btn primary" onclick="dzAddCase()">＋ 新增崩塌地案件</button></div>${det}</div>`;
  if (c && (c.secs || []).length) { const cv = document.getElementById('dzProfCv'); if (cv) dzProfDraw(cv, c, c.secs[c.secSel || 0], false); }
}
function dzMapUI() {
  const box = document.getElementById('dzMapBox'); if (!box) return;
  if (box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'checkbox' && document.activeElement.type !== 'range') return;
  const G = dzGeo(), D = state.dzDem;
  const ct = k => { const q = state.dzCtrl[k] || {}, ll = q.mode === 'll', PH = { px: '專案 X', py: '專案 Y', E: 'E (TWD97)', N: 'N (TWD97)', lat: '緯度', lon: '經度' }, inp = (f, v, st, w) => `<input type="number" class="input-num" style="width:${w || 96}px;" step="${st}" placeholder="${PH[f]}" title="${PH[f]}" value="${Number.isFinite(v) ? v : ''}" onchange="dzSetCtrl(${k},'${f}',this.value)">`;
    return `<tr><td style="white-space:nowrap;">點${k + 1} <button class="btn" style="padding:1px 5px;" onclick="dzPickCtrl(${k})" title="在平面圖點選">📍</button></td><td>${inp('px', q.px, 0.001)}<br>${inp('py', q.py, 0.001)}</td>
      <td><select class="input-select" style="width:84px;" onchange="dzSetCtrl(${k},'mode',this.value)"><option value="tw"${ll ? '' : ' selected'}>TWD97</option><option value="ll"${ll ? ' selected' : ''}>經緯度</option></select><br>${ll ? inp('lat', q.lat, 0.000001) + '<br>' + inp('lon', q.lon, 0.000001) : inp('E', q.E, 0.001) + '<br>' + inp('N', q.N, 0.001)}</td></tr>`; };
  box.innerHTML = `
  <div class="sec-card"><div class="sec-title"><span>🗺 國土測繪中心底圖・控制點</span></div>
    <label class="chk-item" style="font-weight:700;"><input type="checkbox" ${state.dzBm.on ? 'checked' : ''} onchange="state.dzBm.on=this.checked;dzMapUI();requestRedraw();"> 顯示國土測繪中心 WMTS 底圖（需連網）</label>
    <div style="display:flex;gap:6px;align-items:center;margin-top:4px;font-size:11px;"><select class="input-select" style="flex:1;" onchange="state.dzBm.layer=this.value;dzMapUI();requestRedraw();">${DZ_BM_LAYERS.map(([k, t]) => `<option value="${k}"${state.dzBm.layer === k ? ' selected' : ''}>${t}（${k}）</option>`).join('')}${DZ_BM_LAYERS.some(q => q[0] === state.dzBm.layer) ? '' : `<option value="${escAttr(state.dzBm.layer)}" selected>${escAttr(state.dzBm.layer)}</option>`}</select>
      <input class="input-text" style="width:70px;" placeholder="其他圖層" title="國土測繪中心 WMTS 圖層代碼（例如 EMAP、PHOTO2）" onchange="if(this.value.trim()){state.dzBm.layer=this.value.trim();dzMapUI();requestRedraw();}"></div>
    <div style="display:flex;gap:6px;align-items:center;margin-top:4px;font-size:11px;">透明度 <input type="range" min="0.1" max="1" step="0.05" value="${state.dzBm.op}" style="flex:1;" oninput="state.dzBm.op=+this.value;requestRedraw();"></div>
    <div style="display:flex;gap:6px;align-items:center;margin-top:6px;font-size:11px;">套疊第二圖層 <select class="input-select" style="flex:1;" onchange="state.dzBm.layer2=this.value;dzMapUI();requestRedraw();"><option value="">（無）</option>${DZ_BM_LAYERS.map(([k, t]) => `<option value="${k}"${state.dzBm.layer2 === k ? ' selected' : ''}>${t}（${k}）</option>`).join('')}${!state.dzBm.layer2 || DZ_BM_LAYERS.some(q => q[0] === state.dzBm.layer2) ? '' : `<option value="${escAttr(state.dzBm.layer2)}" selected>${escAttr(state.dzBm.layer2)}</option>`}</select>
      <input class="input-text" style="width:70px;" placeholder="其他圖層" title="國土測繪中心 WMTS 圖層代碼（例如 LUIMAP、LUIMAP109）" onchange="if(this.value.trim()){state.dzBm.layer2=this.value.trim();dzMapUI();requestRedraw();}"></div>
    ${state.dzBm.layer2 ? `<div style="display:flex;gap:6px;align-items:center;margin-top:4px;font-size:11px;">第二圖層透明度 <input type="range" min="0.1" max="1" step="0.05" value="${state.dzBm.op2 ?? 0.6}" style="flex:1;" oninput="state.dzBm.op2=+this.value;requestRedraw();"></div>` : ''}
    <div style="font-size:11px;font-weight:700;margin-top:6px;">控制點（兩點：專案座標 ↔ 真實座標）</div>
    <table class="pt-table" style="margin-top:3px;"><thead><tr><th></th><th>專案 X／Y</th><th>真實座標</th></tr></thead><tbody>${ct(0)}${ct(1)}</tbody></table>
    <div style="font-size:10.5px;line-height:1.55;margin-top:4px;color:${G.ok ? '#047857' : 'var(--text-muted)'};">${G.ok ? `✔ 已定位：比例 ${dzF(G.s, 6)}、旋轉 ${dzF(G.rot, 4)}°（專案座標 → TWD97 TM2）。` : '未設定兩個控制點時，專案座標視為 TWD97 TM2（實測 DXF 多已是 TWD97）。'}由兩點計算旋轉＋縮放＋平移，底圖與 DEM 依此套合。</div>
    ${G.ok || (state.dzCtrl[0] && state.dzCtrl[0].px !== undefined) ? `<button class="btn" style="margin-top:4px;" onclick="state.dzCtrl=[{},{}];dzMapUI();requestRedraw();">清除控制點</button>` : ''}</div>
  <div class="sec-card"><div class="sec-title"><span>⛰ 20 m DEM（無實測處補注地形）</span></div>
    <div style="font-size:10.5px;color:var(--text-muted);line-height:1.55;">支援 GeoTIFF（.tif）、ESRI ASCII（.asc）、Surfer（.grd）、XYZ 文字（.xyz／.txt／.csv）；座標須為 TWD97 TM2。只擷取專案範圍外加 1 km。原則以實測地形為主：實測三角網以外的位置才用 DEM。</div>
    <input type="file" accept=".tif,.tiff,.asc,.grd,.xyz,.txt,.csv" style="margin-top:5px;font-size:11px;" onchange="dzDemLoad(this.files[0]);this.value='';">
    ${D ? `<div style="font-size:11px;margin-top:5px;line-height:1.6;">已載入：<b>${escAttr(D.name)}</b>｜${D.nx}×${D.ny} 格、格距 ${dzF(D.dx, 1)} m<br><label class="chk-item"><input type="checkbox" ${state.dzDemOn ? 'checked' : ''} onchange="dzDemToggle(this.checked)"> 無實測處以 DEM 補注地面高程</label> <button class="btn" onclick="dzDemClear()">移除 DEM</button></div>` : ''}</div>`;
}

function dzWallSet(k, f, v) { const c = dzCase(), w = c && c.walls[k]; if (!w) return; pushUndoSnapshot(); if (f === 'name') w.name = String(v); else if (f === 'side') w.side = v === 'R' ? 'R' : 'L'; else { const x = parseFloat(v); if (Number.isFinite(x)) w[f] = f === 'off' || f === 'H' ? Math.max(0, x) : Math.max(0, Math.min(dzPolyLen(c.bl), x)); } dzPanelUI(); requestRedraw(); }
function dzWallDel(k) { const c = dzCase(); if (!c) return; pushUndoSnapshot(); c.walls.splice(k, 1); dzPanelUI(); requestRedraw(); }

/* ===================== 存檔／載入、工具切換、匯出 ===================== */
(function () {
  const _cp = collectProject; collectProject = function () {
    const o = _cp(); const D = state.dzDem;
    o.data.dz = { cases: state.dzCases.map(dzCaseClean), sel: state.dzSel, ctrl: state.dzCtrl, bm: state.dzBm, snap: state.dzSnap,
      dem: D ? { name: D.name, x0: D.x0, y0: D.y0, dx: D.dx, dy: D.dy, nx: D.nx, ny: D.ny, z: Array.from(D.z, v => Number.isFinite(v) ? Math.round(v * 100) / 100 : null) } : null, demOn: state.dzDemOn };
    return o;
  };
  const _ap = applyProject; applyProject = function (obj, fname) {
    const Z = (obj && obj.data && obj.data.dz) || {};
    state.dzCases = Array.isArray(Z.cases) ? Z.cases.map(dzCaseNorm) : [];
    state.dzSel = Math.min(Z.sel ?? (state.dzCases.length ? 0 : -1), state.dzCases.length - 1); state.dzCtrl = Array.isArray(Z.ctrl) && Z.ctrl.length === 2 ? Z.ctrl : [{}, {}];
    state.dzBm = Object.assign({ on: false, layer: 'PHOTO2', op: 0.75, layer2: '', op2: 0.6 }, Z.bm || {}); state.dzSnap = Z.snap !== false; state.dzDemOn = Z.demOn !== false;
    state.dzDem = Z.dem && Z.dem.z ? Object.assign({}, Z.dem, { z: Float32Array.from(Z.dem.z, v => (v === null ? NaN : v)) }) : null;
    _ap(obj, fname); dzPanelUI();
  };
  const _pu = pushUndoSnapshot; pushUndoSnapshot = function () { _pu(); try { const n = state.undoStack.length - 1, o = JSON.parse(state.undoStack[n]); o.dz = { cases: state.dzCases.map(dzCaseClean), sel: state.dzSel }; state.undoStack[n] = JSON.stringify(o); } catch (e) { } };
  const _un = undoLastAction; undoLastAction = function () { let dz = null; try { const t = state.undoStack[state.undoStack.length - 1]; dz = t ? JSON.parse(t).dz : null; } catch (e) { } _un(); if (dz) { state.dzCases = dz.cases.map(dzCaseNorm); state.dzSel = Math.min(dz.sel, state.dzCases.length - 1); dzPanelUI(); requestRedraw(); } };
  const _st = setTool; setTool = function (t) { if (t !== state.activeTool) { state.dzTmp = []; if (!DZ_TOOLS.includes(t)) state.dzTool = null; } _st(t); if (typeof axisOvDraw === 'function') axisOvDraw(); };
  const _bk = stQtyBook; stQtyBook = function () { const B = _bk(), e = dzEwSheet(), c = dzCaseSheet(); if (e) { B.sheets.push(e); B.n += 1; } if (c) { B.sheets.push(c); B.n += 1; } return B; };
  const _dc = stDrawCross; stDrawCross = function (sec, sx, sy, isLarge) { _dc(sec, sx, sy, isLarge); try { dzExLeader(sec, sx, sy, null); } catch (e) { } };
  const _xc = stDxfCross; stDxfCross = function (D, sec, sx, sy, TH) { _xc(D, sec, sx, sy, TH); try { dzExLeader(sec, sx, sy, D, TH); } catch (e) { } };
})();
function dzAfterSections() { dzEwUI(); dzPanelUI(); }
function dzCaseClean(c) { return { id: c.id, name: c.name, zone: c.zone || [], bl: c.bl || [], walls: (c.walls || []).map(w => ({ ...w })), swalls: (c.swalls || []).map(w => ({ name: w.name, pts: w.pts, H: w.H })), secs: (c.secs || []).map(w => ({ name: w.name, pts: w.pts })), secSel: c.secSel || 0 }; }
function dzCaseNorm(c) { return { id: c.id || ('Z' + Math.random().toString(36).slice(2, 7)), name: c.name || '崩塌地', zone: c.zone || [], bl: c.bl || [], walls: (c.walls || []).map(w => Object.assign({ H: 3 }, w)), swalls: (c.swalls || []).map(w => ({ name: w.name || '坡面牆', pts: w.pts || [], H: Number.isFinite(+w.H) ? +w.H : 3 })), secs: (c.secs || []).map(w => ({ name: w.name || '剖面', pts: w.pts || [] })), secSel: c.secSel || 0 }; }
(function () { const _sw = switchSideTab; switchSideTab = function (id, el) { _sw(id, el); if (id === 'tab-tin') dzMapUI(); requestRedraw(); }; })();

/* v5.8 空白啟動：開啟網頁不自動載入示範地形；無地形、無中心線時在平面圖顯示提示 */
function dzStartHint() {
  const el = document.getElementById('dzStartHint'); if (!el) return;
  const empty = !(state.points && state.points.length) && !(state.axisNodes && state.axisNodes.length) && !(state.rawCadPolys && state.rawCadPolys.length);
  el.style.display = empty && state.viewMode === '2D' ? 'block' : 'none';
}
setInterval(() => { try { dzStartHint(); } catch (e) {} }, 400);

/* v6.4：地形線透明度（平面圖畫面用；tFade＝快速淡化） */
function dzTerrAlpha() { const b = state.dzBm || {}, o = b.tOp == null ? 1 : b.tOp; return b.tFade ? Math.min(o, 0.2) : o; }
{ const _pu = dzPanelUI; dzPanelUI = function () { _pu.apply(this, arguments); const b = state.dzBm || {}, o = document.getElementById('terrOp'), f = document.getElementById('terrFade'); if (o && document.activeElement !== o) o.value = b.tOp == null ? 1 : b.tOp; if (f) f.checked = !!b.tFade; }; }
