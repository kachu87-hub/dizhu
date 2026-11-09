/* ============================================================================
   v8.2 3D 視圖改版
   F0 WebGL 繪圖（自寫，不引入外部函式庫；有深度緩衝，遮擋正確）；不支援 WebGL 時退回 Canvas 2D 由遠到近
      同時修正：原 3D 投影是由地面下方往上看（左右鏡像），改為由上方往下看
   F1 平移（右鍵／中鍵拖曳、Shift＋左鍵、或開啟「平移」後左鍵）、以游標為中心縮放
   F2 預設視角：俯視、等角、上游看下游、下游看上游、左岸看、右岸看
   L1 左側 3D 專用圖示（顯示、視角、圖層、水力）；L2 右側浮動控制列；L3 左上標題列＋操作說明
   S1 防砂壩／副壩／固床工（壩體、齒牆、護坦、垂直壁、側牆）；S2 梳子壩壩墩、固床工基樁；S3 護岸
   只畫圖，不改任何數量與 DXF
   ============================================================================ */
const V3D = { show: { terr: true, grid: true, cl: true, st: true, pile: true, rv: true, water: true, lab: true }, gl: null, glc: null, fail: false, mode: '', mesh: null, hist: [], drag: null, lastPush: 0, stat: {} };
V3D.tm = 'des';   // 地形：orig 原地形／des 設計後（開挖、回填後）／both 兩者（設計後＋原地面半透明，挖方紅、填方綠）
try { const o = JSON.parse(localStorage.getItem('tc_v3d') || 'null'); if (o && o.show) Object.keys(V3D.show).forEach(k => { if (typeof o.show[k] === 'boolean') V3D.show[k] = o.show[k]; }); if (o && ['orig', 'des', 'both'].includes(o.tm)) V3D.tm = o.tm; } catch (e) { }
function v3dSave() { try { localStorage.setItem('tc_v3d', JSON.stringify({ show: V3D.show, tm: V3D.tm })); } catch (e) { } }
const V3D_COL = { cut: [184, 158, 118], fill: [139, 101, 64], cutB: [220, 70, 70], fillB: [60, 170, 90], body: [214, 199, 172], key: [196, 182, 158], apron: [188, 182, 168], wall: [206, 192, 166], tail: [200, 188, 160], acc: [196, 188, 170], pile: [245, 158, 11],
  conc: [204, 209, 216], stone: [172, 154, 130], gravel: [132, 121, 104], pc: [152, 160, 172], rv: [190, 190, 190] };

/* ---- 相機：yaw 方位、pitch 俯角、zoom、t 旋轉中心（世界座標，null＝全圖中心） ---- */
function v3dZx() { const e = document.getElementById('zScaleSlider'); return (e && parseFloat(e.value)) || 2.0; }
function v3dSpan() { const b = state.coreBounds; return b ? (Math.max(b.maxX - b.minX, b.maxY - b.minY) || 100) : 100; }
function v3dTgt() { const c = state.cam3D; if (c.t && c.t.every(Number.isFinite)) return c.t; const b = state.coreBounds, B = state.bounds; return [(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (B.minZ + B.maxZ) / 2]; }
function v3dCam(w, h) {
  const c = state.cam3D, k = v3dZx(), t = v3dTgt(), cY = Math.cos(c.yaw), sY = Math.sin(c.yaw), cP = Math.cos(c.pitch), sP = Math.sin(c.pitch), S = (Math.min(w, h) * 0.68 / v3dSpan()) * c.zoom;
  // 由上往下看：螢幕右＝(cY,−sY)；水平前方＝(sY,cY)；螢幕上＝前方·sP＋z·cP；深度（越大越遠）＝前方·cP − z·sP
  const P = (x, y, z) => { x -= t[0]; y -= t[1]; z = (z - t[2]) * k; const rx = x * cY - y * sY, ry = x * sY + y * cY; return { sx: w / 2 + rx * S, sy: h / 2 - (ry * sP + z * cP) * S, depth: ry * cP - z * sP }; };
  return { w, h, k, t, cY, sY, cP, sP, S, P };
}
function v3dPush(force) { const c = state.cam3D, now = Date.now(); if (!force && now - V3D.lastPush < 700) return; V3D.lastPush = now; V3D.hist.push({ yaw: c.yaw, pitch: c.pitch, zoom: c.zoom, t: c.t ? c.t.slice() : null }); if (V3D.hist.length > 40) V3D.hist.shift(); }
function v3dPrev() { const H = V3D.hist.pop(); if (!H) { updateStatus('已無更早的 3D 視角紀錄。'); return; } Object.assign(state.cam3D, H); V3D.lastPush = 0; requestRedraw(); updateStatus('⬅️ 已回復前一個 3D 視角。'); }
function v3dFit() { v3dPush(true); state.cam3D.t = null; state.cam3D.zoom = 1; requestRedraw(); updateStatus('⛶ 3D 已回到全圖（旋轉中心回到地形中央）。'); }
function v3dSize() { const r = cadCanvas.getBoundingClientRect(); return [r.width || cadCanvas.width / (window.devicePixelRatio || 1), r.height || cadCanvas.height / (window.devicePixelRatio || 1)]; }
function v3dZoomAt(f, mx, my) {
  const c = state.cam3D, [w, h] = v3dSize(), C = v3dCam(w, h), z1 = Math.max(0.2, Math.min(60, c.zoom * f)); f = z1 / c.zoom; if (Math.abs(f - 1) < 1e-9) return;
  if (mx !== undefined) { const ox = (mx - w / 2) / C.S, oy = (my - h / 2) / C.S, R = [C.cY, -C.sY, 0], D = [-C.sP * C.sY, -C.sP * C.cY, -C.cP / C.k], g = 1 - 1 / f;
    c.t = [0, 1, 2].map(i => C.t[i] + (R[i] * ox + D[i] * oy) * g); }
  c.zoom = z1; requestRedraw();
}
function v3dPan(dx, dy) { const c = state.cam3D, [w, h] = v3dSize(), C = v3dCam(w, h), R = [C.cY, -C.sY, 0], D = [-C.sP * C.sY, -C.sP * C.cY, -C.cP / C.k]; c.t = [0, 1, 2].map(i => C.t[i] - (R[i] * dx + D[i] * dy) / C.S); requestRedraw(); }
function v3dMidSta() { const S = state.sections; if (!S.length) return 0; return (S[0].sta + S[S.length - 1].sta) / 2; }
function v3dView(k) {
  v3dPush(true); const c = state.cam3D;
  if (k === 'top') { c.pitch = Math.PI / 2 - 0.002; c.yaw = 0; }
  else if (k === 'iso') { c.pitch = 0.62; c.yaw = -Math.PI / 4; }
  else {
    const s = v3dMidSta(), g = getPointAndNormalAtStation(s); if (!g) { updateStatus('尚未建立中心線，無法設定沿溪流的視角。'); return; }
    const dd = typeof stDownDir === 'function' ? stDownDir(s) : 1, F = { dn: [g.tx * dd, g.ty * dd], up: [-g.tx * dd, -g.ty * dd], lb: [-g.nx, -g.ny], rb: [g.nx, g.ny] }[k]; if (!F) return;
    c.yaw = Math.atan2(F[0], F[1]); c.pitch = 0.38;
  }
  const N = { top: '俯視', iso: '等角', dn: '上游看下游', up: '下游看上游', lb: '左岸看右岸', rb: '右岸看左岸' }; updateStatus(`🎥 3D 視角：${N[k] || k}`);
  requestRedraw();
}

/* ---- 幾何工具 ---- */
function v3dEar(P) {   // 簡單多邊形耳切三角化，回傳索引三元組
  const n = P.length; if (n < 3) return [];
  let A = 0; for (let i = 0; i < n; i++) { const j = (i + 1) % n; A += P[i][0] * P[j][1] - P[j][0] * P[i][1]; }
  const idx = [...Array(n).keys()]; if (A < 0) idx.reverse();
  const cr = (a, b, c) => (P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[b][1] - P[a][1]) * (P[c][0] - P[a][0]);
  const eps = 1e-10 * (Math.abs(A) + 1), out = []; let guard = 0;
  while (idx.length > 3 && guard++ < 20000) {
    let hit = false;
    for (let k = 0; k < idx.length; k++) {
      const m = idx.length, a = idx[(k + m - 1) % m], b = idx[k], c = idx[(k + 1) % m], v = cr(a, b, c);
      if (Math.abs(v) <= eps) { idx.splice(k, 1); hit = true; break; }   // 共線點直接略過
      if (v < 0) continue;
      let ok = true; for (const q of idx) { if (q === a || q === b || q === c) continue; if (cr(a, b, q) > eps && cr(b, c, q) > eps && cr(c, a, q) > eps) { ok = false; break; } }
      if (ok) { out.push([a, b, c]); idx.splice(k, 1); hit = true; break; }
    }
    if (!hit) { for (let k = 1; k < idx.length - 1; k++) out.push([idx[0], idx[k], idx[k + 1]]); return out; }   // 自交等異常：扇形補面
  }
  if (idx.length === 3) out.push(idx.slice());
  return out;
}
function v3dMesh() { return { p: [], n: [], c: [], lp: [], lc: [] }; }
function v3dTri(M, a, b, c, col) {
  if (!a || !b || !c) return;
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz); if (!(L > 1e-12)) return; nx /= L; ny /= L; nz /= L;
  M.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  for (let i = 0; i < 3; i++) { M.n.push(nx, ny, nz); M.c.push(col[0], col[1], col[2], col[3] === undefined ? 255 : col[3]); }
}
function v3dQuad(M, a, b, c, d, col) { v3dTri(M, a, b, c, col); v3dTri(M, a, c, d, col); }
function v3dLine(M, a, b, col) { if (!a || !b) return; M.lp.push(a[0], a[1], a[2], b[0], b[1], b[2]); for (let i = 0; i < 2; i++) M.lc.push(col[0], col[1], col[2], col[3] === undefined ? 255 : col[3]); }
function v3dCap(M, xz, W, col, E) {   // 平面多邊形（局部 2D 座標 xz → 世界 W[i]）補面
  const T = v3dEar(xz); T.forEach(([a, b, c]) => v3dTri(M, W[a], W[b], W[c], col));
  if (E) for (let i = 0; i < W.length; i++) v3dLine(E, W[i], W[(i + 1) % W.length], V3D_EDGE);
}
const V3D_EDGE = [30, 41, 59, 150];

/* ---- S1／S2 結構物 ---- */
const v3dWhite = c => /^#?(fff|ffffff|f8fafc|facc15|white)$/i.test(String(c || '').trim());   // 原圖外框（白）、混凝土底版（黃）
function v3dURange(SP) {   // 斷面（順水流 u, z）外框 → 某高程 z 的上下游範圍
  let z0 = Infinity, z1 = -Infinity; SP.forEach(P => P.forEach(q => { z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }));
  const at = z => { let a = Infinity, b = -Infinity;
    SP.forEach(P => { for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; if ((p[1] - z) * (q[1] - z) > 0) continue;
      if (Math.abs(q[1] - p[1]) < 1e-9) { a = Math.min(a, p[0], q[0]); b = Math.max(b, p[0], q[0]); } else { const u = p[0] + (q[0] - p[0]) * (z - p[1]) / (q[1] - p[1]); a = Math.min(a, u); b = Math.max(b, u); } } });
    return a < b ? [a, b] : (Number.isFinite(a) ? [a - 0.05, a + 0.05] : null); };
  return z => { const zz = Math.max(z0 + 1e-5, Math.min(z1 - 1e-5, z)); return at(zz) || at(z0 + (z1 - z0) / 2) || [-0.5, 0.5]; };
}
function v3dArea(P) { let a = 0; for (let i = 0; i < P.length; i++) { const j = (i + 1) % P.length; a += P[i][0] * P[j][1] - P[j][0] * P[i][1]; } return a / 2; }
function v3dInPoly(P, x, y, on) {   // on：邊界上也算
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2)) : 0; if (Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y) < 2e-3) return on; }
  let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c;
}
function v3dOuter(L) {   // 原圖正視圖常把壩墩等另畫一次：完全落在其他外框內者略去，避免重疊面閃爍
  const S = L.map(p => ({ p, a: Math.abs(v3dArea(p)) })).sort((a, b) => b.a - a.a), keep = [];
  S.forEach(o => { const cx = o.p.reduce((s, q) => s + q[0], 0) / o.p.length, cz = o.p.reduce((s, q) => s + q[1], 0) / o.p.length;
    if (keep.some(k => v3dInPoly(k, cx, cz, false) && o.p.every(q => v3dInPoly(k, q[0], q[1], true)))) return; keep.push(o.p); });
  return keep;
}
function v3dSweep(M, E, P, ur, zb, W, col) {   // 正視外形 (x,z) × 各高程的順水流範圍 ur(z) → 實體
  const n = P.length; if (n < 3) return;
  const Q = [], orig = [];
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; Q.push(a); orig.push(true);
    zb.filter(z => (z - a[1]) * (z - b[1]) < 0).sort((p, q) => (b[1] > a[1] ? p - q : q - p)).forEach(z => { const t = (z - a[1]) / (b[1] - a[1]); Q.push([a[0] + (b[0] - a[0]) * t, z]); orig.push(false); }); }
  const F = Q.map(([x, z]) => W(ur(z)[1], x, z)), B = Q.map(([x, z]) => W(ur(z)[0], x, z)); if (F.some(v => !v) || B.some(v => !v)) return;
  v3dEar(Q).forEach(([a, b, c]) => { v3dTri(M, F[a], F[b], F[c], col); v3dTri(M, B[a], B[c], B[b], col); });
  const m = Q.length;
  for (let i = 0; i < m; i++) { const j = (i + 1) % m; v3dQuad(M, F[i], F[j], B[j], B[i], col); if (E) { v3dLine(E, F[i], F[j], V3D_EDGE); v3dLine(E, B[i], B[j], V3D_EDGE); if (orig[i]) v3dLine(E, F[i], B[i], V3D_EDGE); } }
}
function v3dLoft(M, E, rings, col, capA, capB) {   // 依序相連的同點數斷面環
  for (let r = 0; r + 1 < rings.length; r++) { const A = rings[r], B = rings[r + 1], m = A.w.length;
    for (let i = 0; i < m; i++) { const j = (i + 1) % m; v3dQuad(M, A.w[i], A.w[j], B.w[j], B.w[i], col); if (E && (r % 4 === 0 || r + 2 === rings.length)) v3dLine(E, A.w[i], B.w[i], V3D_EDGE); } }
  if (rings.length) { if (capA !== false) v3dCap(M, rings[0].xz, rings[0].w, col, E); if (capB !== false) v3dCap(M, rings[rings.length - 1].xz, rings[rings.length - 1].w, col, E); }
}
function v3dAcc(st, g, W, M, E) {   // 護坦、垂直壁、側牆：沿 u 取 stAccCross 斷面相連
  const R = g.acc; if (!R) return; const br = [];
  if (R.apron) { br.push(R.apron.u0, R.apron.u1); if (R.apron.cut) br.push(R.apron.cut.u0, R.apron.cut.u1); }
  if (R.tail) br.push(R.tail.u0, R.tail.c1, R.tail.u1);
  (R.walls || []).forEach(w => br.push(w.uS, w.u0, w.u1));
  if (!br.length) return;
  const ua = Math.min(...br), ub = Math.max(...br); if (!(ub > ua)) return;
  const us = new Set(); for (let k = 0; k <= 40; k++) us.add(ua + (ub - ua) * k / 40);
  br.forEach(u => { us.add(u); us.add(u - 2e-3); us.add(u + 2e-3); });
  const U = [...us].filter(u => u >= ua - 1e-9 && u <= ub + 1e-9).sort((a, b) => a - b);
  const runs = {}, done = [];
  U.forEach(u => {
    const L = stAccCross(g, u) || [], cnt = {}, seen = new Set();
    L.forEach(pg => { const key = (pg.g || 'x') + ':' + (cnt[pg.g] = (cnt[pg.g] || 0) + 1), w = pg.map(([x, z]) => W(u, x, z)); if (w.some(v => !v)) return; seen.add(key);
      const r = runs[key]; if (r && r.rings[0].w.length === w.length) r.rings.push({ xz: pg, w }); else { if (r) done.push(r); runs[key] = { g: pg.g, rings: [{ xz: pg, w }] }; } });
    Object.keys(runs).forEach(k => { if (!seen.has(k)) { done.push(runs[k]); delete runs[k]; } });
  });
  Object.values(runs).forEach(r => done.push(r));
  done.forEach(r => v3dLoft(M, E, r.rings, V3D_COL[r.g] || V3D_COL.acc));
}
function v3dCyl(M, E, u, x, r, z0, z1, W, col) {
  const n = 14, B = [], T = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, uu = u + r * Math.cos(a), xx = x + r * Math.sin(a); B.push(W(uu, xx, z0)); T.push(W(uu, xx, z1)); }
  if (B.some(v => !v) || T.some(v => !v)) return;
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; v3dQuad(M, B[i], B[j], T[j], T[i], col); v3dTri(M, T[0], T[i], T[j], col); v3dTri(M, B[0], B[j], B[i], col); }
  if (E) for (let i = 0; i < n; i++) v3dLine(E, T[i], T[(i + 1) % n], V3D_EDGE);
}
function v3dPiles(st, V, W, M, E) {
  const isP = q => q.cl && /^#f59e0b$/i.test(String(q.c)) && q.p.length === 4;
  const ER = (V.elev || []).filter(isP), SR = (V.sect || []).filter(isP); if (!ER.length) return 0;
  const Us = SR.map(q => { const a = q.p.map(v => v[0]); return (Math.min(...a) + Math.max(...a)) / 2; });
  let rows = null; try { const P = sltRun(st).P; if (P.piles && P.piles.length === ER.length) rows = P.piles.map(p => p.row); } catch (e) { }
  ER.forEach((q, i) => { const xs = q.p.map(v => v[0]), zs = q.p.map(v => v[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const u = Us.length ? Us[Math.min(Us.length - 1, rows ? (rows[i] || 0) : i % Us.length)] : 0; v3dCyl(M, E, u, (x0 + x1) / 2, (x1 - x0) / 2, z0, z1, W, V3D_COL.pile); });
  return ER.length;
}
function v3dStruct(st, O, M, E, MP) {
  if (!getPointAndNormalAtStation(st.sta)) return;
  const g = stGeo(st), pl = stPlace(st), p = st.p;
  const W = (u, x, z) => { const w = stWorld(st, u, x); return w ? [w[0] - O[0], w[1] - O[1], pl.zS + z - O[2]] : null; };
  let V = null; try { V = typeof sltViews === 'function' ? sltViews(st) : null; } catch (e) { V = null; }
  let polys = null, ur = null, zb = [0];
  if (V && V.elev && V.sect) {
    const EP = V.elev.filter(q => q.cl && v3dWhite(q.c) && q.p.length >= 3), SP = V.sect.filter(q => q.cl && (v3dWhite(q.c) || /^#94a3b8$/i.test(String(q.c))) && q.p.length >= 3);
    const ez = EP.flatMap(q => q.p.map(v => v[1])), eH = ez.length ? Math.max(...ez) - Math.min(...ez) : 0;
    if (EP.length && SP.length && eH >= 0.6 * ((p.h2 || 0) + (p.h3 || 0))) { polys = v3dOuter(EP.map(q => q.p)); ur = v3dURange(SP.map(q => q.p)); zb = [...new Set(SP.flatMap(q => q.p.map(a => +a[1].toFixed(4))))]; }
  }
  if (!polys) {   // 標準圖型式或原圖無對應視圖：以壩體外包（正視外形 × 上下游面）
    polys = [g.fills.elev[0]]; ur = z => [g.uU(z), g.uD(z)];
    if (p.k > 0 && p.k1 > 0 && g.fills.elev[1]) { const ku1 = g.uD(g.zbt), ku0 = ku1 - p.k1; v3dSweep(M, E, g.fills.elev[1], () => [ku0, ku1], [], W, V3D_COL.key); }
  }
  polys.forEach(P => v3dSweep(M, E, P, ur, zb, W, V3D_COL.body));
  try { v3dAcc(st, g, W, M, E); } catch (e) { console.error('v3dAcc', e); }
  if (V && MP) V3D.stat.piles += v3dPiles(st, V, W, MP, E);
  V3D.stat.st++;
}

/* ---- S3 護岸 ---- */
function v3dSecW(sec, O) {
  let dx = sec.rx - sec.cx, dy = sec.ry - sec.cy, L = Math.hypot(dx, dy);
  if (!(L > 1e-6)) { const g = getPointAndNormalAtStation(sec.sta); if (!g) return null; dx = -g.nx; dy = -g.ny; L = 1; }
  dx /= L; dy /= L; return (x, z) => [sec.cx + dx * x - O[0], sec.cy + dy * x - O[1], z - O[2]];
}
const V3D_RV_TOL = 30;   // A2：護岸外框高程與該斷面地面／設計河床相差超過此值（m）即視為異常
/* A1：縱斷面設計點（VIP）高程與該處地面相差超過 V3D_RV_TOL，視為輸入錯誤（例：671.27 打成 991.27）。
   設計河床跟著錯，護岸與設計後地形會在該段整面衝高；以地面為準判斷，3D 略過該段並在檢核清單列出 */
function v3dGndAt(sta) {
  const S = (state.sections || []).filter(s => Number.isFinite(s.groundCenter)).slice().sort((a, b) => a.sta - b.sta); if (!S.length) return null;
  if (sta <= S[0].sta) return S[0].groundCenter; const n = S.length; if (sta >= S[n - 1].sta) return S[n - 1].groundCenter;
  let i = 0; while (i < n - 2 && S[i + 1].sta < sta) i++; const a = S[i], b = S[i + 1], t = (sta - a.sta) / ((b.sta - a.sta) || 1); return a.groundCenter + (b.groundCenter - a.groundCenter) * t;
}
function v3dVipBad() {
  const V = (state.profile && state.profile.vips) || [], out = [];
  V.forEach((v, i) => { const g = v3dGndAt(+v.sta); if (Number.isFinite(+v.z) && Number.isFinite(g) && Math.abs(v.z - g) > V3D_RV_TOL) out.push({ i, sta: +v.sta, z: +v.z, g, d: v.z - g }); });
  return out;
}
function v3dSecBad(sec) { return Number.isFinite(sec.desCenterZ) && Number.isFinite(sec.groundCenter) && Math.abs(sec.desCenterZ - sec.groundCenter) > V3D_RV_TOL; }
function v3dRvSane(sec, g) {
  if (v3dSecBad(sec)) return false;
  const zs = [sec.groundCenter].filter(Number.isFinite); (sec.samples || []).forEach(q => { if (Number.isFinite(q.groundZ)) zs.push(q.groundZ); });
  if (!zs.length) return true; const lo = Math.min(...zs) - V3D_RV_TOL, hi = Math.max(...zs) + V3D_RV_TOL, half = Math.max(sec.readL || 0, sec.readR || 0, 20) + 50;
  return g.G.polys.every(pg => pg.pts.every(q => Number.isFinite(q[0]) && Number.isFinite(q[1]) && q[1] >= lo && q[1] <= hi && Math.abs(q[0]) <= half));
}
function v3dRevs(O, M, E) {
  if (typeof rvGeomSec !== 'function' || !(state.revs || []).length) return;
  ['L', 'R'].forEach(sd => {
    let run = null; const flush = () => { if (run) run.polys.forEach((rings, i) => v3dLoft(M, E, rings, V3D_COL[run.m[i]] || V3D_COL.rv)); run = null; };
    state.sections.forEach(sec => {
      let g = null; try { g = rvGeomSec(sec, sd); } catch (e) { g = null; }
      if (g && typeof rvVis === 'function' && !rvVis(g.R.rv)) g = null;
      if (g && !v3dRvSane(sec, g)) { V3D.stat.rvBad.push(`${formatStation(sec.sta)}${sd === 'L' ? '左' : '右'}`); console.warn('v3d：護岸斷面高程異常，3D 略過', sec.sta, sd, g.G.polys.map(q => q.pts)); g = null; }
      const f = g && v3dSecW(sec, O), P = g && f ? g.G.polys.map(pg => ({ m: pg.m, xz: pg.pts.map(q => [q[0], q[1]]), w: pg.pts.map(q => f(g.sg * q[0], q[1])) })) : null;
      const same = run && P && run.rv === g.R.rv && run.polys.length === P.length && P.every((q, i) => q.m === run.m[i] && q.w.length === run.polys[i][0].w.length);
      if (!same) { flush(); if (P && P.length) { run = { rv: g.R.rv, m: P.map(q => q.m), polys: P.map(q => [q]) }; V3D.stat.rv++; } }
      else P.forEach((q, i) => run.polys[i].push(q));
    });
    flush();
  });
}

/* ---- 水力水面（hymod）：改由 WebGL 以深度畫半透明水面 ---- */
function v3dWater(O, M) {
  const R = state.hyRes; if (!R || !state.hy || !state.hy.show || !state.hy.show.v3d || typeof hyExtent !== 'function') return;
  const C = { 25: [56, 189, 248, 158], 50: [167, 139, 250, 115], s25: [251, 146, 60, 158], s50: [244, 63, 94, 115] };
  [50, 25].forEach(k => { const r = R.runs[k]; if (!r || !state.hy.show[k]) return; if (!r.ext) r.ext = R.nodes.map((nd, i) => (Number.isFinite(r.W[i]) ? hyExtent(nd.g, r.W[i]) : null));
    for (let i = 0; i < R.nodes.length - 1; i++) { const a = R.nodes[i], b = R.nodes[i + 1], ea = r.ext[i], eb = r.ext[i + 1]; if (!ea || !eb || Math.abs(a.sta - b.sta) < 1e-6) continue;
      const q = [hyNodePos(a, ea[0]), hyNodePos(a, ea[1]), hyNodePos(b, eb[1]), hyNodePos(b, eb[0])]; if (q.some(v => !v)) continue;
      const zz = [r.W[i], r.W[i], r.W[i + 1], r.W[i + 1]], w = q.map((v, j) => [v[0] - O[0], v[1] - O[1], zz[j] - O[2] + 0.02]);
      const sup = state.hy.show.flow && (r.reg[i] === 'sup' || r.reg[i] === 'crit' || r.reg[i + 1] === 'sup');
      v3dQuad(M, w[0], w[1], w[2], w[3], C[(sup ? 's' : '') + k]); } });
}

/* ---- B1 設計後地形：各橫斷面「開挖、回填後地面線」（samples 的 desZ）沿樁號相連；範圍內取代原地面三角網 ---- */
function v3dProf(sec) { const S = (sec.samples || []).filter(q => Number.isFinite(q.offset) && Number.isFinite(q.desZ)).slice().sort((a, b) => a.offset - b.offset); return S.length >= 2 ? S : null; }
function v3dAt(S, o) { if (o <= S[0].offset) return S[0]; const n = S.length; if (o >= S[n - 1].offset) return S[n - 1]; let i = 0; while (i < n - 2 && S[i + 1].offset < o) i++; const a = S[i], b = S[i + 1], t = (o - a.offset) / ((b.offset - a.offset) || 1), gz = (Number.isFinite(a.groundZ) && Number.isFinite(b.groundZ)) ? a.groundZ + (b.groundZ - a.groundZ) * t : a.desZ + (b.desZ - a.desZ) * t; return { offset: o, desZ: a.desZ + (b.desZ - a.desZ) * t, groundZ: gz }; }
function v3dDesign(O) {
  const secs = (state.sections || []).filter(s => v3dProf(s) && !v3dSecBad(s)).slice().sort((a, b) => a.sta - b.sta), MA = v3dMesh(), MB = v3dMesh(), L = [], Rr = [];
  if (secs.length < 2) return null;
  const col = (d, b) => { const t = 0.05; if (d > t) return b ? V3D_COL.cutB : V3D_COL.cut; if (d < -t) return b ? V3D_COL.fillB : V3D_COL.fill; return null; };
  const B = state.bounds, z0 = B.minZ, dz = (B.maxZ - B.minZ) || 1, ter = z => { const r = Math.max(0, Math.min(1, (z - z0) / dz)); return [Math.round(20 + r * 140), Math.round(95 + r * 110), Math.round(135 - r * 65), 255]; };
  const W = secs.map(s => v3dSecW(s, O)), P = secs.map(v3dProf);
  const tri = (a, b, c) => { const d = (a.d + b.d + c.d) / 3, z = (a.z + b.z + c.z) / 3; v3dTri(MA, a.w, b.w, c.w, col(d) || ter(z)); v3dTri(MB, a.w, b.w, c.w, col(d, true) || ter(z)); };
  const pt = (i, q) => ({ w: W[i](q.offset, q.desZ), d: (q.groundZ ?? q.desZ) - q.desZ, z: q.desZ });
  secs.forEach((s, i) => { if (!W[i]) return; const S = P[i]; L.push(W[i](S[0].offset, 0)); Rr.push(W[i](S[S.length - 1].offset, 0));
    for (let k = 0; k + 1 < S.length; k++) v3dLine(MA, W[i](S[k].offset, S[k].desZ), W[i](S[k + 1].offset, S[k + 1].desZ), [0, 240, 255, 70]); });
  for (let i = 0; i + 1 < secs.length; i++) {
    if (!W[i] || !W[i + 1]) continue; const A = P[i], Bq = P[i + 1];
    if (Math.abs(secs[i + 1].sta - secs[i].sta) > 60) continue;   // 斷面間距過大（如主支流分段）不相連
    const lo = Math.max(A[0].offset, Bq[0].offset), hi = Math.min(A[A.length - 1].offset, Bq[Bq.length - 1].offset); if (!(hi > lo)) continue;
    const U = [...new Set([lo, hi, ...A.map(q => q.offset), ...Bq.map(q => q.offset)].filter(o => o >= lo - 1e-9 && o <= hi + 1e-9).map(o => +o.toFixed(4)))].sort((a, b) => a - b);
    for (let k = 0; k + 1 < U.length; k++) { const a0 = pt(i, v3dAt(A, U[k])), a1 = pt(i, v3dAt(A, U[k + 1])), b0 = pt(i + 1, v3dAt(Bq, U[k])), b1 = pt(i + 1, v3dAt(Bq, U[k + 1])); tri(a0, a1, b1); tri(a0, b1, b0); }
    [[A, i, i + 1, Bq], [Bq, i + 1, i, A]].forEach(([X, ix, iy, Y]) => {   // 兩側較寬者的外緣：扇形接到另一斷面的端點
      const yl = pt(iy, v3dAt(Y, lo)), yh = pt(iy, v3dAt(Y, hi)), xl = X.filter(q => q.offset < lo - 1e-6).concat([v3dAt(X, lo)]), xh = [v3dAt(X, hi)].concat(X.filter(q => q.offset > hi + 1e-6));
      for (let k = 0; k + 1 < xl.length; k++) tri(pt(ix, xl[k]), pt(ix, xl[k + 1]), yl);
      for (let k = 0; k + 1 < xh.length; k++) tri(pt(ix, xh[k]), pt(ix, xh[k + 1]), yh); });
  }
  const poly = L.filter(Boolean).concat(Rr.filter(Boolean).reverse()).map(v => [v[0], v[1]]);
  return { A: v3dPiece(MA, 'desA'), B: v3dPiece(MB, 'desB'), poly };
}
function v3dDesSig() { return (state.sections || []).length + '|' + (state.sections || []).reduce((a, s) => a + (s.samples || []).reduce((b, q) => b + (q.desZ || 0) * 1.3 + (q.offset || 0) + (q.groundZ || 0) * 0.7, 0) + s.sta + (s.cx || 0) * 1e-3, 0).toFixed(4); }

/* ---- 網格建立（依資料簽章快取） ---- */
function v3dTerrSig() { const T = state.triangles || [], B = state.bounds || {}, cb = state.coreBounds || {}; let h = 0, hid = 0; const st = Math.max(1, Math.floor(T.length / 256));
  for (let i = 0; i < T.length; i++) { if (T[i].hidden) hid++; if (i % st === 0) { const p = state.points[T[i].a]; if (p) h += p.z * (i + 1) + p.x * 1e-3; } }
  return [T.length, hid, h.toFixed(3), B.minZ, B.maxZ, cb.minX, cb.maxX, cb.minY, cb.maxY].join('|'); }
function v3dObjSig() {
  let s = '';
  try { s = JSON.stringify([(state.structs || []).map(st => [st.id, st.sta, st.dir, st.zB, st.sty, st._gk, st.sp, st.a, st.p && st.p.off]), (state.revs || []).map(r => [r.id, r.side, r.type, r.s0, r.s1, r.e0, r.e1, r.p, r.raises, r.wids, r.cap, r.pt]),
    (state.sections || []).length, (state.sections || []).reduce((a, s) => a + s.sta * 7 + (s.desCenterZ || 0) + (s.cx || 0) * 1e-4, 0), state.rvCatShow || {}, V3D.show.pile]); } catch (e) { s = String(Date.now()); }
  return s;
}
function v3dPiece(M, key) { return { key, p: new Float32Array(M.p), n: new Float32Array(M.n), c: new Uint8Array(M.c), cnt: M.p.length / 3, lp: new Float32Array(M.lp), lc: new Uint8Array(M.lc), lcnt: M.lp.length / 3 }; }
function v3dBuild() {
  const old = V3D.mesh || {}, b = state.coreBounds, B = state.bounds; if (!b || !B) return null;
  const O = [(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, Math.floor(B.minZ || 0)], oK = O.join('|');
  const keep = old.oK === oK, mesh = { O, oK, terrOut: keep ? old.terrOut : null, ghost: keep ? old.ghost : null, desA: keep ? old.desA : null, desB: keep ? old.desB : null, terr: old.oK === oK ? old.terr : null, tSig: old.oK === oK ? old.tSig : '', obj: old.oK === oK ? old.obj : null, oSig: old.oK === oK ? old.oSig : '', water: null, wRef: null };
  const tSig = v3dTerrSig() + '#' + v3dDesSig();
  if (!mesh.terr || mesh.tSig !== tSig) {
    let D = null; try { D = v3dDesign(O); } catch (e) { console.error('v3dDesign', e); D = null; }
    const M = v3dMesh(), MO = v3dMesh(), MG = v3dMesh(), z0 = B.minZ, dz = (B.maxZ - B.minZ) || 1, pts = state.points, poly = D && D.poly.length >= 3 ? D.poly : null;
    const pb = poly ? [Math.min(...poly.map(q => q[0])), Math.min(...poly.map(q => q[1])), Math.max(...poly.map(q => q[0])), Math.max(...poly.map(q => q[1]))] : null;
    (state.triangles || []).forEach(t => { if (t.hidden) return; const A = pts[t.a], Bq = pts[t.b], Cq = pts[t.c]; if (!A || !Bq || !Cq) return;
      const v = [A, Bq, Cq].map(q => [q.x - O[0], q.y - O[1], q.z - O[2]]), e = (A.z + Bq.z + Cq.z) / 3, r = Math.max(0, Math.min(1, (e - z0) / dz)), c = [Math.round(20 + r * 140), Math.round(95 + r * 110), Math.round(135 - r * 65), 255];
      const inC = poly && v.every(q => q[0] >= pb[0] && q[0] <= pb[2] && q[1] >= pb[1] && q[1] <= pb[3]) && v.every(q => v3dInPoly(poly, q[0], q[1], true)), T = inC ? MG : MO;   // 三點都在設計範圍內＝由設計後地形取代
      v3dTri(M, v[0], v[1], v[2], c); v3dTri(T, v[0], v[1], v[2], inC ? [c[0], c[1], c[2], 70] : c);
      for (let i = 0; i < 3; i++) { v3dLine(M, v[i], v[(i + 1) % 3], [0, 240, 255, 56]); if (!inC) v3dLine(MO, v[i], v[(i + 1) % 3], [0, 240, 255, 56]); } });
    ['terr', 'terrOut', 'ghost', 'desA', 'desB'].forEach(k => mesh[k] && v3dFree(mesh[k]));
    mesh.terr = v3dPiece(M, 'terr'); mesh.terrOut = v3dPiece(MO, 'terrOut'); mesh.ghost = v3dPiece(MG, 'ghost'); mesh.desA = D ? D.A : null; mesh.desB = D ? D.B : null; mesh.tSig = tSig;
  }
  const oSig = v3dObjSig();
  if (!mesh.obj || mesh.oSig !== oSig) {
    V3D.stat = { st: 0, piles: 0, rv: 0, rvBad: [] };
    const MS = v3dMesh(), MP = v3dMesh(), MR = v3dMesh(), ES = v3dMesh(), ER = v3dMesh();
    (state.structs || []).forEach(st => { try { v3dStruct(st, O, MS, ES, MP); } catch (e) { console.error('v3dStruct', st && st.name, e); } });
    try { v3dRevs(O, MR, ER); } catch (e) { console.error('v3dRevs', e); }
    if (mesh.obj) Object.values(mesh.obj).forEach(v3dFree);
    MS.lp = ES.lp; MS.lc = ES.lc; MR.lp = ER.lp; MR.lc = ER.lc;
    mesh.obj = { st: v3dPiece(MS, 'st'), pile: v3dPiece(MP, 'pile'), rv: v3dPiece(MR, 'rv') }; mesh.oSig = oSig; mesh.stat = Object.assign({}, V3D.stat);
  } else mesh.stat = old.stat;
  if (old.water && old.wRef === state.hyRes && old.wK === v3dWaterKey()) { mesh.water = old.water; mesh.wRef = old.wRef; mesh.wK = old.wK; }
  else { if (old.water) v3dFree(old.water); const MW = v3dMesh(); try { v3dWater(O, MW); } catch (e) { console.error('v3dWater', e); } mesh.water = v3dPiece(MW, 'water'); mesh.wRef = state.hyRes; mesh.wK = v3dWaterKey(); }
  V3D.mesh = mesh; return mesh;
}
function v3dWaterKey() { const h = state.hy && state.hy.show; return h ? [h.v3d, h[25], h[50], h.flow, state.hyStale].join('|') : ''; }

/* ---- F0 WebGL ---- */
function v3dGL() {
  if (V3D.fail) return null;
  if (V3D.gl) { if (V3D.gl.isContextLost && V3D.gl.isContextLost()) { V3D.fail = true; V3D.gl = null; return null; } return V3D.gl; }
  try {
    const c = document.createElement('canvas'), o = { antialias: true, preserveDrawingBuffer: true, alpha: false, premultipliedAlpha: false, depth: true };
    const gl = c.getContext('webgl', o) || c.getContext('experimental-webgl', o); if (!gl) { V3D.fail = true; return null; }
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const vs = sh(gl.VERTEX_SHADER, `attribute vec3 aP; attribute vec3 aN; attribute vec4 aC;
      uniform mat4 uM; uniform float uK; uniform vec3 uV; uniform vec3 uL; uniform float uLit; varying vec4 vC;
      void main(){ gl_Position = uM * vec4(aP, 1.0); float l = 1.0;
        if (uLit > 0.5) { vec3 n = normalize(vec3(aN.x, aN.y, aN.z / uK)); if (dot(n, uV) < 0.0) n = -n; l = 0.34 + 0.52 * max(dot(n, uL), 0.0) + 0.26 * max(dot(n, uV), 0.0); }
        vC = vec4(min(aC.rgb * l, vec3(1.0)), aC.a); }`);
    const fs = sh(gl.FRAGMENT_SHADER, 'precision mediump float; varying vec4 vC; void main(){ gl_FragColor = vC; }');
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    V3D.loc = { aP: gl.getAttribLocation(pr, 'aP'), aN: gl.getAttribLocation(pr, 'aN'), aC: gl.getAttribLocation(pr, 'aC'), uM: gl.getUniformLocation(pr, 'uM'), uK: gl.getUniformLocation(pr, 'uK'), uV: gl.getUniformLocation(pr, 'uV'), uL: gl.getUniformLocation(pr, 'uL'), uLit: gl.getUniformLocation(pr, 'uLit') };
    c.addEventListener('webglcontextlost', e => { e.preventDefault(); V3D.fail = true; V3D.gl = null; requestRedraw(); });
    V3D.gl = gl; V3D.glc = c; V3D.prog = pr; return gl;
  } catch (e) { console.error('v3dGL', e); V3D.fail = true; return null; }
}
function v3dFree(pc) { const gl = V3D.gl; if (!pc || !pc.gb || !gl) return; Object.values(pc.gb).forEach(b => b && gl.deleteBuffer(b)); pc.gb = null; }
function v3dBuf(gl, pc) {
  if (pc.gb) return pc.gb; const mk = a => { if (!a.length) return null; const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); return b; };
  pc.gb = { p: mk(pc.p), n: mk(pc.n), c: mk(pc.c), lp: mk(pc.lp), lc: mk(pc.lc) }; return pc.gb;
}
function v3dDraw(gl, pc, lines) {
  if (!pc) return; const L = V3D.loc, gb = v3dBuf(gl, pc), cnt = lines ? pc.lcnt : pc.cnt; if (!cnt) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, lines ? gb.lp : gb.p); gl.enableVertexAttribArray(L.aP); gl.vertexAttribPointer(L.aP, 3, gl.FLOAT, false, 0, 0);
  if (lines) { gl.disableVertexAttribArray(L.aN); gl.vertexAttrib3f(L.aN, 0, 0, 1); } else { gl.bindBuffer(gl.ARRAY_BUFFER, gb.n); gl.enableVertexAttribArray(L.aN); gl.vertexAttribPointer(L.aN, 3, gl.FLOAT, false, 0, 0); }
  gl.bindBuffer(gl.ARRAY_BUFFER, lines ? gb.lc : gb.c); gl.enableVertexAttribArray(L.aC); gl.vertexAttribPointer(L.aC, 4, gl.UNSIGNED_BYTE, true, 0, 0);
  gl.uniform1f(L.uLit, lines ? 0 : 1); gl.drawArrays(lines ? gl.LINES : gl.TRIANGLES, 0, cnt);
}
function v3dMatrix(C, O, w, h) {   // 世界（相對原點 O）→ 剪裁座標，與 v3dCam 的投影一致
  const a = [O[0] - C.t[0], O[1] - C.t[1], O[2] - C.t[2]], k = C.k, S = C.S, sx = 2 * S / w, sy = 2 * S / h;
  const B = state.bounds, D = v3dSpan() * 2 + Math.abs((B.maxZ - B.minZ) * k) * 2 + Math.hypot(a[0], a[1], a[2] * k) * 2 + 10;
  const r0 = [sx * C.cY, -sx * C.sY, 0, sx * (C.cY * a[0] - C.sY * a[1])];
  const r1 = [sy * C.sP * C.sY, sy * C.sP * C.cY, sy * C.cP * k, sy * (C.sP * C.sY * a[0] + C.sP * C.cY * a[1] + C.cP * k * a[2])];
  const r2 = [C.cP * C.sY / D, C.cP * C.cY / D, -C.sP * k / D, (C.cP * C.sY * a[0] + C.cP * C.cY * a[1] - C.sP * k * a[2]) / D];
  return new Float32Array([r0[0], r1[0], r2[0], 0, r0[1], r1[1], r2[1], 0, r0[2], r1[2], r2[2], 0, r0[3], r1[3], r2[3], 1]);
}
function v3dRenderGL(gl, mesh, C, w, h) {
  const dpr = window.devicePixelRatio || 1, W = cadCanvas.width, H = cadCanvas.height, c = V3D.glc;
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  gl.viewport(0, 0, W, H); gl.clearColor(7 / 255, 10 / 255, 15 / 255, 1); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(V3D.prog); const L = V3D.loc;
  gl.uniformMatrix4fv(L.uM, false, v3dMatrix(C, mesh.O, w, h)); gl.uniform1f(L.uK, C.k);
  const vv = [-C.cP * C.sY, -C.cP * C.cY, C.sP], vl = Math.hypot(...vv); gl.uniform3f(L.uV, vv[0] / vl, vv[1] / vl, vv[2] / vl);
  const sl = [0.36, -0.42, 0.83], sn = Math.hypot(...sl); gl.uniform3f(L.uL, sl[0] / sn, sl[1] / sn, sl[2] / sn);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(2, 2);   // 地形略往後推：與結構物面重合時結構物在前
  const sh = V3D.show, T = v3dTerrSet(mesh);
  if (sh.terr) T.fill.forEach(p => v3dDraw(gl, p));
  gl.polygonOffset(1, 1);
  if (sh.st) v3dDraw(gl, mesh.obj.st);
  if (sh.pile) v3dDraw(gl, mesh.obj.pile);
  if (sh.rv) v3dDraw(gl, mesh.obj.rv);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  if (sh.terr && sh.grid) T.line.forEach(p => v3dDraw(gl, p, true));
  if (sh.st) v3dDraw(gl, mesh.obj.st, true);
  if (sh.rv) v3dDraw(gl, mesh.obj.rv, true);
  if (sh.water && mesh.water.cnt) { gl.depthMask(false); v3dDraw(gl, mesh.water); gl.depthMask(true); }
  if (sh.terr && T.ghost) { gl.depthMask(false); v3dDraw(gl, T.ghost); gl.depthMask(true); }
  gl.disable(gl.BLEND); gl.flush();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c, 0, 0); ctx.restore();
  void dpr;
}
function v3dTerrSet(mesh) {   // 依地形模式回傳要畫的面、線、半透明原地面
  const m = mesh.desA && mesh.desA.cnt ? V3D.tm : 'orig';
  if (m === 'orig') return { fill: [mesh.terr], line: [mesh.terr], ghost: null, mode: 'orig' };
  return { fill: [mesh.terrOut, m === 'both' ? mesh.desB : mesh.desA], line: [mesh.terrOut, mesh.desA], ghost: m === 'both' ? mesh.ghost : null, mode: m };
}
function v3dRenderCanvas(mesh, C) {   // 退回：Canvas 2D 由遠到近
  const O = mesh.O, sh = V3D.show, list = [], vv = [-C.cP * C.sY, -C.cP * C.cY, C.sP], vl = Math.hypot(...vv), V = vv.map(v => v / vl), sl = [0.36, -0.42, 0.83], sn = Math.hypot(...sl), Lt = sl.map(v => v / sn);
  const add = (pc, a, stroke) => { if (!pc) return; for (let i = 0; i < pc.cnt; i += 3) { const q = [0, 1, 2].map(j => C.P(pc.p[(i + j) * 3] + O[0], pc.p[(i + j) * 3 + 1] + O[1], pc.p[(i + j) * 3 + 2] + O[2]));
    let n = [pc.n[i * 3], pc.n[i * 3 + 1], pc.n[i * 3 + 2] / C.k]; const nl = Math.hypot(...n) || 1; n = n.map(v => v / nl); if (n[0] * V[0] + n[1] * V[1] + n[2] * V[2] < 0) n = n.map(v => -v);
    const l = 0.34 + 0.52 * Math.max(0, n[0] * Lt[0] + n[1] * Lt[1] + n[2] * Lt[2]) + 0.26 * Math.max(0, n[0] * V[0] + n[1] * V[1] + n[2] * V[2]), c = i * 4;
    list.push({ q, d: (q[0].depth + q[1].depth + q[2].depth) / 3, f: `rgba(${Math.min(255, Math.round(pc.c[c] * l))},${Math.min(255, Math.round(pc.c[c + 1] * l))},${Math.min(255, Math.round(pc.c[c + 2] * l))},${a ? (pc.c[c + 3] / 255).toFixed(3) : 1})`, s: stroke }); } };
  if (sh.terr) { const T = v3dTerrSet(mesh); T.fill.forEach(p => add(p, false, sh.grid)); if (T.ghost) add(T.ghost, true); } if (sh.st) add(mesh.obj.st, false); if (sh.pile) add(mesh.obj.pile, false); if (sh.rv) add(mesh.obj.rv, false); if (sh.water) add(mesh.water, true);
  list.sort((a, b) => b.d - a.d);
  const dpr = window.devicePixelRatio || 1; ctx.save(); ctx.scale(dpr, dpr); ctx.lineWidth = 0.7;
  list.forEach(t => { ctx.beginPath(); ctx.moveTo(t.q[0].sx, t.q[0].sy); ctx.lineTo(t.q[1].sx, t.q[1].sy); ctx.lineTo(t.q[2].sx, t.q[2].sy); ctx.closePath(); ctx.fillStyle = t.f; ctx.fill(); ctx.strokeStyle = t.s ? 'rgba(0,240,255,0.22)' : t.f; ctx.stroke(); });
  ctx.restore();
}
/* ---- 2D 疊加：中心線、結構物名稱、出水高不足標記、圖例 ---- */
function v3dOverlay(C) {
  const dpr = window.devicePixelRatio || 1; ctx.save(); ctx.scale(dpr, dpr);
  if (V3D.show.cl && state.sections.length >= 2) { ctx.strokeStyle = '#ffe600'; ctx.lineWidth = 2.4; ctx.beginPath(); state.sections.forEach((sec, i) => { const p = C.P(sec.cx, sec.cy, sec.groundCenter + 0.3); i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy); }); ctx.stroke(); }
  if (V3D.show.lab && V3D.show.st) { ctx.font = 'bold 12px "Noto Sans TC"'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    (state.structs || []).forEach(st => { const w = stWorld(st, 0, 0); if (!w) return; let pl; try { pl = stPlace(st); } catch (e) { return; } const p = C.P(w[0], w[1], pl.zTop + 1.2), s = `${st.name}　${formatStation(st.sta)}`;
      ctx.strokeStyle = 'rgba(7,10,15,0.85)'; ctx.lineWidth = 3.5; ctx.strokeText(s, p.sx, p.sy); ctx.fillStyle = '#ffd08a'; ctx.fillText(s, p.sx, p.sy); }); }
  const R = state.hyRes;
  if (R && V3D.show.water && state.hy && state.hy.show && state.hy.show.v3d) {
    if (state.hy.show.plan && typeof hyBad === 'function') hyBad().forEach(b => { const nd = R.nodes[b.i], f = R.runs[b.k].fb[b.i][b.sd], o = b.sd === 'L' ? -(nd.g.a0[b.sd] ?? 0) : (nd.g.a0[b.sd] ?? 0), P = hyNodePos(nd, o); if (!P) return; const p = C.P(P[0], P[1], f.top + 0.3);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(p.sx, p.sy, 5, 0, 6.2832); ctx.moveTo(p.sx - 3.5, p.sy - 3.5); ctx.lineTo(p.sx + 3.5, p.sy + 3.5); ctx.moveTo(p.sx + 3.5, p.sy - 3.5); ctx.lineTo(p.sx - 3.5, p.sy + 3.5); ctx.stroke(); });
    ctx.font = '11px "Noto Sans TC"'; ctx.textAlign = 'left'; let yy = C.h - 14;
    [25, 50].forEach(k => { if (!R.runs[k] || !state.hy.show[k] || typeof HY_COL === 'undefined') return; ctx.fillStyle = HY_COL[k]; ctx.fillText(`■ Q${k} 水面${state.hyStale ? '（輸入已變更，請重算）' : ''}`, 14, yy); yy -= 15; });
    if (state.hy.show.flow) { ctx.fillStyle = '#fb923c'; ctx.fillText('■ 橘＝急流／臨界', 14, yy); }
  }
  // 指北
  { const x0 = C.w - 46, y0 = C.h - 46, a = C.P(C.t[0], C.t[1], C.t[2]), b = C.P(C.t[0], C.t[1] + 1, C.t[2]); let dx = b.sx - a.sx, dy = b.sy - a.sy; const L = Math.hypot(dx, dy);
    if (L > 1e-9) { dx /= L; dy /= L; const f = Math.max(0.25, Math.min(1, L / (C.S || 1))); ctx.strokeStyle = '#e2e8f0'; ctx.fillStyle = '#e2e8f0'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x0, y0, 22, 0, 6.2832); ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(x0 + dx * 18 * f, y0 + dy * 18 * f); ctx.lineTo(x0 - dy * 5, y0 + dx * 5); ctx.lineTo(x0 + dy * 5, y0 - dx * 5); ctx.closePath(); ctx.fill();
      ctx.font = 'bold 11px "Noto Sans TC"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', x0 + dx * 30 * f, y0 + dy * 30 * f); ctx.textBaseline = 'alphabetic'; } }
  if (V3D.mode === 'canvas') { ctx.font = '11px "Noto Sans TC"'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'right'; ctx.fillText('此電腦無法使用 WebGL：改用簡易繪圖（物件互相遮擋可能不正確）', C.w - 80, C.h - 12); }
  ctx.restore();
}
function v3dRender() {
  const dpr = window.devicePixelRatio || 1, w = cadCanvas.width / dpr, h = cadCanvas.height / dpr;
  ctx.save(); ctx.scale(dpr, dpr); ctx.fillStyle = '#070a0f'; ctx.fillRect(0, 0, w, h); ctx.restore();
  if (!state.coreBounds || !state.bounds) return;
  const mesh = v3dBuild(); if (!mesh) return;
  const C = v3dCam(w, h), gl = v3dGL();
  if (gl) { try { v3dRenderGL(gl, mesh, C, w, h); V3D.mode = 'gl'; } catch (e) { console.error('v3dRenderGL', e); V3D.fail = true; V3D.mode = 'canvas'; v3dRenderCanvas(mesh, C); } }
  else { V3D.mode = 'canvas'; v3dRenderCanvas(mesh, C); }
  v3dOverlay(C); v3dInfo();
}
render3DTerrain = function () { try { v3dRender(); } catch (e) { console.error('v3dRender', e); } };

/* ---- F1 滑鼠：左鍵旋轉；右鍵／中鍵／Shift＋左鍵／平移開啟時左鍵＝平移；滾輪以游標為中心縮放 ---- */
window.addEventListener('mousedown', e => {
  if (state.viewMode !== '3D' || e.target !== cadCanvas) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const pan = e.button === 1 || e.button === 2 || (e.button === 0 && (e.shiftKey || state.panMode));
  v3dPush(true); V3D.drag = { x: e.clientX, y: e.clientY, pan }; cadCanvas.style.cursor = pan ? 'grabbing' : 'move';
}, true);
window.addEventListener('mousemove', e => {
  const d = V3D.drag; if (!d) return; if (state.viewMode !== '3D') { V3D.drag = null; return; }
  const ts = 1, dx = (e.clientX - d.x) / ts, dy = (e.clientY - d.y) / ts; d.x = e.clientX; d.y = e.clientY;
  if (d.pan) v3dPan(dx, dy);
  else { const c = state.cam3D; c.yaw += dx * 0.008; c.pitch = Math.max(0.05, Math.min(Math.PI / 2 - 0.002, c.pitch + dy * 0.008)); requestRedraw(); }
  e.stopImmediatePropagation();
}, true);
window.addEventListener('mouseup', () => { if (!V3D.drag) return; V3D.drag = null; cadCanvas.style.cursor = state.viewMode === '3D' && state.panMode ? 'grab' : ''; }, true);
window.addEventListener('wheel', e => {
  if (state.viewMode !== '3D' || e.target !== cadCanvas) return;
  e.preventDefault(); e.stopImmediatePropagation(); v3dPush(false);
  const r = cadCanvas.getBoundingClientRect(); v3dZoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
}, { capture: true, passive: false });
window.addEventListener('contextmenu', e => { if (state.viewMode === '3D' && e.target === cadCanvas) e.preventDefault(); }, true);

/* ---- L2 右側控制列在 3D 也顯示；L3 標題列 ---- */
{ const f = viewZoom; viewZoom = function (k) { if (state.viewMode === '3D') { v3dPush(true); v3dZoomAt(k); return; } return f.apply(this, arguments); }; }
{ const f = viewFit; viewFit = function () { if (state.viewMode === '3D') return v3dFit(); return f.apply(this, arguments); }; }
{ const f = focusMainCluster; focusMainCluster = function () { if (state.viewMode === '3D') return v3dFit(); return f.apply(this, arguments); }; }
{ const f = restorePreviousView; restorePreviousView = function () { if (state.viewMode === '3D') return v3dPrev(); return f.apply(this, arguments); }; }
{ const f = viewPanToggle; viewPanToggle = function () { if (state.viewMode === '3D') { state.panMode = !state.panMode; updateViewCtl(); updateStatus(state.panMode ? '✋ 3D 平移已開啟：左鍵拖曳移動畫面（再按一次關閉；右鍵、中鍵或 Shift＋左鍵拖曳隨時可平移）。' : '3D 平移已關閉：左鍵拖曳＝旋轉。'); return; } return f.apply(this, arguments); }; }
{ const f = updateViewCtl; updateViewCtl = function () { const r = f.apply(this, arguments); if (state.viewMode === '3D') { const vc = document.getElementById('viewCtl'), b = document.getElementById('vcPan'); if (vc) vc.style.display = 'flex'; if (b) b.classList.toggle('on', !!state.panMode); cadCanvas.style.cursor = state.panMode ? 'grab' : ''; } return r; }; }
{ const f = setViewMode; setViewMode = function (m) { const r = f.apply(this, arguments); v3dViewUI(m); return r; }; }
const V3D_TABS = { 'tab-3dv': ['顯示', '顯示設定', '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'],
  'tab-3dc': ['視角', '視角設定', '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'] };
function v3dHideMark() {   // 圖層頁：3D 用不到的平面卡片（2D 圖層開關、國土測繪中心底圖）在 3D 隱藏
  const tin = document.getElementById('tab-tin'); if (!tin) return;
  [...tin.querySelectorAll('.sec-card')].forEach(c => { const t = (c.querySelector(':scope > .sec-title') || {}).textContent || ''; if (/2D 平面圖層顯示開關|國土測繪中心底圖/.test(t)) c.dataset.v3dhide = '1'; });
}
function v3dViewUI(m) {
  v3dHideMark(); const on = m === '3D', bar = document.getElementById('v3dBar'); if (bar) bar.style.display = on ? 'flex' : 'none';
  try { updateViewCtl(); } catch (e) { }
  document.querySelectorAll('[data-v3dhide]').forEach(c => { c.style.display = on ? 'none' : ''; });
  if (!on) { V3D.drag = null; if (cadCanvas.style.cursor === 'grab') cadCanvas.style.cursor = ''; }
  else v3dPanelSync();
}
function v3dCard(title, html, id) { return `<div class="sec-card acc" id="${id}"><div class="sec-title"><span>${title}</span></div><div class="v3d-body">${html}</div></div>`; }
function v3dPanelHTML() {
  const ck = (k, lab, tip) => `<label class="v3d-ck" title="${tip || ''}"><input type="checkbox" data-v3dk="${k}" ${V3D.show[k] ? 'checked' : ''} onchange="v3dSet('${k}',this.checked)"> ${lab}</label>`;
  const dis = `<div class="v3d-grid">${ck('terr', '地形（三角網）')}${ck('grid', '三角網格線')}${ck('cl', '中心線')}${ck('lab', '結構物名稱')}${ck('st', '壩體／固床工（含護坦、側牆）')}${ck('pile', '基樁')}${ck('rv', '護岸')}${ck('water', '水力水面', '需先在「水力」頁計算，並勾選「3D」')}</div>
    <div class="v3d-tm" title="設計後＝以各橫斷面開挖、回填後的地面線取代原地形（只在橫斷面範圍內）">地形：${[['des', '設計後'], ['orig', '原地形'], ['both', '兩者']].map(([k, l]) => `<label class="v3d-ck"><input type="radio" name="v3dtm" data-v3dtm="${k}" ${V3D.tm === k ? 'checked' : ''} onchange="v3dSetTm('${k}')"> ${l}</label>`).join('')}</div>
    <div class="v3d-note" id="v3dLeg"></div>
    <div class="v3d-note" id="v3dStat"></div>`;
  const vb = (k, lab, tip) => `<button class="btn v3d-vb" onclick="v3dView('${k}')" title="${tip}">${lab}</button>`;
  const cam = `<div class="v3d-vg">${vb('top', '俯視', '由正上方看，北朝上')}${vb('iso', '等角', '斜 45° 俯瞰')}${vb('dn', '上游看下游', '站在上游往下游看（依全線中點的流向）')}${vb('up', '下游看上游', '站在下游往上游看')}${vb('lb', '左岸看右岸', '站在左岸（面向下游的左手邊）往右岸看')}${vb('rb', '右岸看左岸', '站在右岸往左岸看')}</div>
    <div class="v3d-vg"><button class="btn" onclick="v3dFit()" title="旋轉中心回到地形中央、縮放回 1 倍 (F)">⛶ 全圖</button><button class="btn" onclick="v3dPrev()" title="回到前一個視角 (Backspace)">⬅ 前視角</button></div>
    <div class="v3d-note" id="v3dAng"></div>
    <div class="v3d-note">左鍵拖曳＝旋轉；右鍵或中鍵拖曳（或 Shift＋左鍵）＝平移；滾輪＝以游標為中心縮放；F＝全圖。</div>`;
  return { dis: v3dCard('🧩 物件顯示', dis, 'v3dCardShow'), cam: v3dCard('🎥 預設視角', cam, 'v3dCardCam') };
}
function v3dSetTm(k) { V3D.tm = k; v3dSave(); v3dInfo(); requestRedraw(); }
function v3dSet(k, v) { V3D.show[k] = !!v; v3dSave(); requestRedraw(); }
function v3dPanelSync() { document.querySelectorAll('[data-v3dk]').forEach(i => { i.checked = !!V3D.show[i.dataset.v3dk]; }); document.querySelectorAll('[data-v3dtm]').forEach(i => { i.checked = i.dataset.v3dtm === V3D.tm; }); v3dInfo(); }
function v3dInfo() {
  const s = document.getElementById('v3dStat'), a = document.getElementById('v3dAng'), m = V3D.mesh, st = m && m.stat;
  const vb = s && st ? v3dVipBad() : [];
  if (s && st) { const t = `繪圖：${V3D.mode === 'gl' ? 'WebGL（深度緩衝，遮擋正確）' : V3D.mode === 'canvas' ? '簡易繪圖（此電腦無 WebGL）' : '—'}；結構物 ${st.st} 座、基樁 ${st.piles} 支、護岸 ${st.rv} 段${st.rvBad && st.rvBad.length ? `。⚠ 護岸外框高程異常、3D 略過的斷面：${st.rvBad.join('、')}（請到橫斷面檢查）` : ''}${vb.length ? `。⚠ 縱斷面設計點高程疑似輸入錯誤：${vb.map(b => `${formatStation(b.sta)} 設計 ${b.z.toFixed(2)} m、地面約 ${b.g.toFixed(2)} m`).join('；')}（請到「2. 縱斷」修正；該段 3D 先以原地形顯示）` : ''}`; if (s.textContent !== t) s.textContent = t; s.style.color = (st.rvBad && st.rvBad.length) || vb.length ? '#b45309' : ''; }
  const lg = document.getElementById('v3dLeg'); if (lg) { const hasD = m && m.desA && m.desA.cnt, t = !hasD ? '（尚無橫斷面，只能顯示原地形）' : V3D.tm === 'both' ? '設計後地形：紅＝挖方、綠＝填方；原地面以半透明疊在上面' : V3D.tm === 'des' ? '設計後地形：淺土色＝開挖面、深土色＝回填土；橫斷面範圍外為原地形' : '原地形（三角網）'; if (lg.textContent !== t) lg.textContent = t; }
  if (a) { const c = state.cam3D, az = ((c.yaw * 180 / Math.PI) % 360 + 360) % 360, t = `目前：看向方位角 ${az.toFixed(0)}°、俯角 ${(c.pitch * 180 / Math.PI).toFixed(0)}°、縮放 ${c.zoom.toFixed(2)} 倍`; if (a.textContent !== t) a.textContent = t; }
}
function v3dPanelInit(n) {
  const tin = document.getElementById('tab-tin'), tabT = document.querySelector('.panel-tab[data-tab="tab-tin"]'), hy = document.getElementById('tab-hy');
  if (!tin || !tabT) { if ((n || 0) < 40) setTimeout(() => v3dPanelInit((n || 0) + 1), 150); return; }
  if (!document.getElementById('v3dStyle')) { const s = document.createElement('style'); s.id = 'v3dStyle'; s.textContent = `
    .v3d-body { padding:4px 2px 2px; font-size:12px; }
    .sec-card.acc.folded > .v3d-body { display:none; }
    .v3d-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px 8px; }
    .v3d-ck { display:flex; align-items:center; gap:4px; cursor:pointer; white-space:nowrap; }
    .v3d-vg { display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:6px; }
    .v3d-vg .btn { width:100%; justify-content:center; margin:0; }
    .v3d-tm { display:flex; gap:10px; align-items:center; margin-top:8px; font-size:12px; }
    .v3d-note { font-size:11px; color:#64748b; margin-top:6px; line-height:1.5; }
    #v3dBar .hint { display:none; }
    #v3dBar.show-hint .hint { display:block; }`; document.head.appendChild(s); }
  if (!document.getElementById('tab-3dv')) {
    const H = v3dPanelHTML();
    Object.keys(V3D_TABS).forEach(id => { const L = V3D_TABS[id], t = document.createElement('div'); t.className = 'panel-tab'; t.dataset.tab = id; t.textContent = L[0]; t.style.setProperty('--ti', UIM_SVG(L[2])); t.style.display = 'none';
      t.addEventListener('click', () => switchSideTab(id, t)); tabT.before(t);
      const b = document.createElement('div'); b.className = 'panel-body'; b.id = id; b.style.display = 'none'; b.innerHTML = id === 'tab-3dv' ? H.dis : H.cam; (hy || tin).after(b);
      b.querySelectorAll('.sec-card.acc > .sec-title').forEach(ti => ti.addEventListener('click', e => { if (e.target.closest('button, input, select, label')) return; ti.parentElement.classList.toggle('folded'); })); });
    Object.keys(V3D_TABS).forEach(id => { UIM_TABS[id] = V3D_TABS[id].slice(0, 2); });
  }
  // 3D 地形顯示卡（高程誇大倍率）搬進「顯示」頁最上方
  const c3 = document.getElementById('card3D'), dv = document.getElementById('tab-3dv'); if (c3 && dv && c3.parentElement !== dv) dv.insertBefore(c3, dv.firstChild);
  const hint = document.querySelector('#hud3DCtrl > span:last-child'); if (hint && /拖曳/.test(hint.textContent)) hint.textContent = '（左鍵旋轉、右鍵平移、滾輪縮放）';
  // L3 視圖標題列
  const cb = document.getElementById('crossFloatingBar');
  if (cb && !document.getElementById('v3dBar')) { const b = document.createElement('div'); b.className = 'view-floating-bar'; b.id = 'v3dBar';
    b.innerHTML = '<span style="color:var(--cad-cyan);font-weight:700;">🏔️ 3D 地形模擬</span>'
      + '<button class="btn" onclick="v3dView(\'top\')" title="由正上方看，北朝上">俯視</button><button class="btn" onclick="v3dView(\'iso\')" title="斜 45° 俯瞰">等角</button><button class="btn" onclick="v3dView(\'dn\')" title="站在上游往下游看">上游看下游</button>'
      + '<button class="btn" onclick="document.getElementById(\'v3dBar\').classList.toggle(\'show-hint\')" title="顯示/隱藏 3D 操作說明">❔ 操作說明</button>'
      + '<span class="hint" style="color:var(--text-muted)">左鍵拖曳＝旋轉｜右鍵或中鍵拖曳（或 Shift＋左鍵）＝平移｜右側「✋ 平移」開啟時左鍵＝平移｜滾輪＝以游標為中心縮放｜F＝全圖｜Backspace＝前視角｜左側「顯示」可開關各類物件、「視角」有六種預設視角</span>';
    cb.after(b); }
  if (typeof VIEW_TABS !== 'undefined') VIEW_TABS['3D'] = ['tab-3dv', 'tab-3dc', 'tab-tin', 'tab-hy'];
  if (state.viewMode === '3D' && typeof applyViewLayout === 'function') applyViewLayout();
  v3dViewUI(state.viewMode);
}
{ const f = switchSideTab; switchSideTab = function (id, el) {
  const r = f.apply(this, arguments);
  Object.keys(V3D_TABS).forEach(t => { const e = document.getElementById(t); if (e) e.style.display = t === id ? 'flex' : 'none'; });
  if (V3D_TABS[id]) { v3dPanelSync(); if (typeof uimRail === 'function') uimRail(); }
  return r; }; }
{ const f = uimCurTab; uimCurTab = function () { const m = Object.keys(V3D_TABS).find(id => { const e = document.getElementById(id); return e && e.style.display !== 'none'; }); return m || f.apply(this, arguments); }; }
window.addEventListener('load', () => setTimeout(() => v3dPanelInit(0), 30));

/* A1：全專案檢核加「縱斷面設計點高程異常」 */
if (typeof chkCollect === 'function') { const _v3dCC = chkCollect; chkCollect = function () { const o = _v3dCC.apply(this, arguments); try { v3dVipBad().forEach(b => o.push({ sev: 'err', cat: '縱斷面', obj: `設計點 ${formatStation(b.sta)}`, msg: `設計高程 ${b.z.toFixed(2)} m 比地面（約 ${b.g.toFixed(2)} m）${b.d > 0 ? '高' : '低'} ${Math.abs(b.d).toFixed(1)} m，疑似輸入錯誤；護岸、土方、3D 都會跟著錯`, go: { view: 'PROFILE', tab: 'tab-earth', sta: b.sta } })); } catch (e) { } return o; }; }
