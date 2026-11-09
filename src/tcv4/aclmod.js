/* ============================================================================
   v6.3 自動建議中心線：在平面圖點「起點」「迄點」，依溪流附近平均低點產生建議中心線（虛線），
   使用者確認後才套用為中心線（BP→IP…→EP，可再拖曳 IP 微調）
   1. 粗路徑：起迄點間網格最低成本路徑（成本＝1＋α×高出起迄高程內插線的高度），沿谷底走
   2. 細修：每隔取樣間距沿路徑法向 ±搜尋寬取地面高程，取「最低點＋容許差」以內各點的平均位置（附近平均低點）
   3. 平滑（移動平均）→ Douglas-Peucker 簡化成 IP（容許偏差），IP 半徑取預設曲線半徑（不足時自動縮小）
   地形資料不足（三角網與 DEM 皆無）處，以周圍有資料點的高程平均補值，並在建議線上以橘色標示
   ============================================================================ */
const ACL_DEF = { ds: 5, W: 15, tol: 0.3, sm: 3, dp: 1.5, R: 15, cell: 0, gap: 20, ang: 8, tgt: 0 };
let ACL = { p: Object.assign({}, ACL_DEF), A: null, B: null, res: null };
function aclZ(x, y) { try { const r = dzZAt(x, y); return r ? r.z : null; } catch (e) { return null; } }
function aclZFill(x, y, rad) {   // 有資料直接用；無資料取周圍 8 方向、由近而遠的有效高程（反距離平均）
  const z = aclZ(x, y); if (z !== null) return { z, miss: false };
  let sw = 0, sz = 0;
  for (let k = 1; k <= 5 && !sw; k++) { const d = rad * k / 5; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = aclZ(x + Math.cos(a) * d, y + Math.sin(a) * d); if (q !== null) { sw += 1 / d; sz += q / d; } } }
  return sw ? { z: sz / sw, miss: true } : { z: null, miss: true };
}
function aclStart() {
  if (!(state.points || []).length && !(state.dzDem && state.dzDemOn)) { alert('目前沒有地形資料（測點三角網或 DEM），無法依高程找低點。'); return; }
  if (state.viewMode !== '2D') setViewMode('2D');
  ACL.A = ACL.B = null; ACL.res = null; setTool('AUTO_AXIS');
  document.getElementById('hudToolTip').innerHTML = '🧭【自動建議中心線】：在平面圖點「起點」（上游或下游端皆可，起點＝BP），再點「迄點」。Esc 取消。';
  updateStatus('🧭 請在平面圖點選中心線「起點」（BP）。'); aclUI();
}
function aclCancel() { ACL.A = ACL.B = null; ACL.res = null; if (state.activeTool === 'AUTO_AXIS') setTool('PAN'); aclUI(); requestRedraw(); }
function aclSet(k, v) { const x = parseFloat(v); if (Number.isFinite(x) && x >= 0) ACL.p[k] = x; aclUI(); }
// ---- 1. 網格最低成本路徑 ----
function aclCoarse(A, B) {
  const L = Math.hypot(B.x - A.x, B.y - A.y), m = Math.max(30, L * 0.45), cs = ACL.p.cell > 0 ? ACL.p.cell : Math.max(1, L / 260);
  const x0 = Math.min(A.x, B.x) - m, y0 = Math.min(A.y, B.y) - m, nx = Math.ceil((Math.max(A.x, B.x) + m - x0) / cs) + 1, ny = Math.ceil((Math.max(A.y, B.y) + m - y0) / cs) + 1, N = nx * ny;
  const zA = aclZFill(A.x, A.y, 10).z, zB = aclZFill(B.x, B.y, 10).z, ux = (B.x - A.x) / (L * L), uy = (B.y - A.y) / (L * L);
  const Z = new Float32Array(N), C = new Float32Array(N); let zs = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const z = aclZ(x0 + i * cs, y0 + j * cs); Z[j * nx + i] = z === null ? NaN : z; if (z !== null) zs.push(z); }
  if (!zs.length) return null;
  zs.sort((a, b) => a - b); const rng = Math.max(1, zs[Math.floor(zs.length * 0.95)] - zs[Math.floor(zs.length * 0.05)]), alpha = 60 / rng, MISS = 0.5 * rng;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i, x = x0 + i * cs, y = y0 + j * cs; let t = (x - A.x) * ux + (y - A.y) * uy; t = Math.max(0, Math.min(1, t));
    const zl = (zA !== null && zB !== null) ? zA + (zB - zA) * t : NaN, z = Z[k]; C[k] = 1 + alpha * (Number.isFinite(z) && Number.isFinite(zl) ? Math.max(0, z - zl) : MISS); }
  const id = (x, y) => Math.max(0, Math.min(ny - 1, Math.round((y - y0) / cs))) * nx + Math.max(0, Math.min(nx - 1, Math.round((x - x0) / cs)));
  const s = id(A.x, A.y), g = id(B.x, B.y), D = new Float64Array(N).fill(Infinity), P = new Int32Array(N).fill(-1), H = [];
  const push = (k, d) => { H.push([d, k]); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const t = H[0], l = H.pop(); if (H.length) { H[0] = l; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m2 = i; if (a < H.length && H[a][0] < H[m2][0]) m2 = a; if (b < H.length && H[b][0] < H[m2][0]) m2 = b; if (m2 === i) break; [H[m2], H[i]] = [H[i], H[m2]]; i = m2; } } return t; };
  D[s] = 0; push(s, 0); const NB = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  while (H.length) { const [d, k] = pop(); if (d > D[k]) continue; if (k === g) break; const i = k % nx, j = (k - i) / nx;
    for (const [di, dj, w] of NB) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue; const q = jj * nx + ii, nd = d + w * cs * (C[k] + C[q]) / 2; if (nd < D[q]) { D[q] = nd; P[q] = k; push(q, nd); } } }
  if (!Number.isFinite(D[g])) return null;
  const out = []; for (let k = g; k >= 0; k = P[k]) { out.push({ x: x0 + (k % nx) * cs, y: y0 + Math.floor(k / nx) * cs }); if (k === s) break; }
  out.reverse(); out[0] = { x: A.x, y: A.y }; out[out.length - 1] = { x: B.x, y: B.y }; return out;
}
function aclResample(P, ds) {
  const o = [P[0]]; let acc = 0;
  for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], L = Math.hypot(b.x - a.x, b.y - a.y); let t = ds - acc;
    while (t <= L) { o.push({ x: a.x + (b.x - a.x) * t / L, y: a.y + (b.y - a.y) * t / L }); t += ds; } acc = L - (t - ds); }
  const e = P[P.length - 1], l = o[o.length - 1]; if (Math.hypot(e.x - l.x, e.y - l.y) > ds * 0.3) o.push(e); else o[o.length - 1] = e; return o;
}
function aclSmooth(P, k) { if (k < 1) return P; const o = P.map(p => ({ ...p })); for (let i = 1; i < P.length - 1; i++) { let sx = 0, sy = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(P.length - 1, i + k); j++) { sx += P[j].x; sy += P[j].y; n++; } o[i].x = sx / n; o[i].y = sy / n; } return o; }
// ---- 2. 附近平均低點細修 ----
function aclRefine(P, W) {
  const tol = ACL.p.tol, st = Math.max(0.25, W / 40), o = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], tl = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / tl, ny = (b.x - a.x) / tl;
    if (i === 0 || i === P.length - 1) { o.push({ ...P[i], miss: aclZFill(P[i].x, P[i].y, W).miss }); continue; }
    const S = []; let miss = 0;
    for (let d = -W; d <= W + 1e-9; d += st) { const r = aclZFill(P[i].x + nx * d, P[i].y + ny * d, Math.max(3, W / 3)); if (r.z === null) { miss++; continue; } if (r.miss) miss++; S.push([d, r.z]); }
    if (S.length < 3) { o.push({ ...P[i], miss: true }); continue; }
    const zm = Math.min(...S.map(s => s[1])), L = S.filter(s => s[1] <= zm + tol), dm = L.reduce((t, s) => t + s[0], 0) / L.length;
    o.push({ x: P[i].x + nx * dm, y: P[i].y + ny * dm, z: zm, miss: miss > S.length * 0.5 });
  }
  return o;
}
// ---- 3. 簡化成 IP ----
function aclDP(P, eps) {
  if (P.length < 3) return P.slice(); let dm = 0, im = 0; const a = P[0], b = P[P.length - 1], L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  for (let i = 1; i < P.length - 1; i++) { const d = Math.abs((b.x - a.x) * (a.y - P[i].y) - (a.x - P[i].x) * (b.y - a.y)) / L; if (d > dm) { dm = d; im = i; } }
  if (dm <= eps) return [a, b]; const l = aclDP(P.slice(0, im + 1), eps), r = aclDP(P.slice(im), eps); return l.slice(0, -1).concat(r);
}
// ---- 3b. IP 精簡：最小偏角、最小間距、目標 IP 數 ----
function aclDefl(Q, i) { const a = Q[i - 1], p = Q[i], b = Q[i + 1], t1 = Math.atan2(p.y - a.y, p.x - a.x), t2 = Math.atan2(b.y - p.y, b.x - p.x); let th = Math.abs(t2 - t1); if (th > Math.PI) th = 2 * Math.PI - th; return th * 180 / Math.PI; }
function aclPrune(Q0, gap, ang) {
  const Q = Q0.map(p => ({ x: p.x, y: p.y }));
  for (let it = 0; it < 500 && Q.length > 2; it++) {   // 每輪先刪偏角最小且低於門檻者；其次刪太近（< 間距）的兩個 IP 中偏角較小者
    let worst = -1, wv = Infinity;
    for (let i = 1; i < Q.length - 1; i++) { const d = aclDefl(Q, i); if (ang > 0 && d < ang && d < wv) { wv = d; worst = i; } }
    if (worst < 0 && gap > 0) for (let i = 1; i < Q.length; i++) { const d = Math.hypot(Q[i].x - Q[i - 1].x, Q[i].y - Q[i - 1].y); if (d >= gap) continue;
      const cand = [i - 1, i].filter(k => k > 0 && k < Q.length - 1); if (!cand.length) continue; let pk = cand[0], pv = Infinity; cand.forEach(k => { const v = aclDefl(Q, k); if (v < pv) { pv = v; pk = k; } }); worst = pk; break; }
    if (worst < 0) break; Q.splice(worst, 1);
  }
  return Q;
}
function aclSimplify(R) {   // DP → 精簡；有目標 IP 數時逐步放寬 DP 容許偏差
  let eps = ACL.p.dp, Q = aclPrune(aclDP(R, eps), ACL.p.gap, ACL.p.ang), tgt = Math.round(ACL.p.tgt);
  for (let k = 0; tgt > 0 && Q.length - 2 > tgt && k < 60; k++) { eps *= 1.25; Q = aclPrune(aclDP(R, eps), ACL.p.gap, ACL.p.ang); }
  return { Q, eps };
}
function aclMaxDev(path, ips) {   // 建議低點線各點到 IP 折線的最大距離
  let mx = 0; path.forEach(p => { let best = Infinity; for (let i = 1; i < ips.length; i++) { const a = ips[i - 1], b = ips[i], dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2)), d = Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t)); if (d < best) best = d; } if (best > mx) mx = best; }); return mx;
}
function aclIPs(Q) {   // 每個 IP 半徑：預設 R，若切線長超過相鄰邊長的一半則縮小
  return Q.map((p, i) => { if (i === 0 || i === Q.length - 1) return { x: +p.x.toFixed(3), y: +p.y.toFixed(3), r: 0 };
    const a = Q[i - 1], b = Q[i + 1], l1 = Math.hypot(p.x - a.x, p.y - a.y), l2 = Math.hypot(b.x - p.x, b.y - p.y);
    const t1 = Math.atan2(p.y - a.y, p.x - a.x), t2 = Math.atan2(b.y - p.y, b.x - p.x); let th = Math.abs(t2 - t1); if (th > Math.PI) th = 2 * Math.PI - th;
    let R = ACL.p.R; const T = Math.tan(th / 2); if (T > 1e-6) R = Math.min(R, 0.45 * Math.min(l1, l2) / T); return { x: +p.x.toFixed(3), y: +p.y.toFixed(3), r: Math.max(0, Math.floor(R)) }; });
}
function aclRun() {
  const A = ACL.A, B = ACL.B; if (!A || !B) return;
  updateStatus('🧭 計算建議中心線中…'); const t0 = performance.now();
  let P = aclCoarse(A, B); if (!P) { updateStatus('⚠ 起迄點之間沒有可用的地形資料，無法計算。'); ACL.res = null; aclUI(); return; }
  P = aclSmooth(aclResample(P, ACL.p.ds), ACL.p.sm);
  let R = aclRefine(P, ACL.p.W); R = aclSmooth(R, ACL.p.sm); R = aclRefine(R, Math.max(3, ACL.p.W / 2)); const M = R.map(p => p.miss); R = aclSmooth(R, ACL.p.sm).map((p, i) => ({ ...p, miss: M[i] }));
  const sm = aclSimplify(R), ips = aclIPs(sm.Q); let len = 0; for (let i = 1; i < R.length; i++) len += Math.hypot(R[i].x - R[i - 1].x, R[i].y - R[i - 1].y);
  const segs = []; R.forEach((p, i) => { if (!p.miss) return; const s = segs[segs.length - 1]; if (s && s.b === i - 1) s.b = i; else segs.push({ a: i, b: i }); });
  ACL.res = { path: R, ips, len, segs, ms: performance.now() - t0, eps: sm.eps, dev: aclMaxDev(R, ips) };
  updateStatus(`🧭 建議中心線：長約 ${len.toFixed(1)} m，BP＋${ips.length - 2} 個 IP＋EP，與低點線最大偏離 ${ACL.res.dev.toFixed(1)} m${segs.length ? `；地形資料不足 ${segs.length} 段（橘色，以周圍高程平均補值）` : ''}。確認後按「套用為中心線」。`);
  aclUI(); requestRedraw();
}
function aclRedev() { const r = ACL.res; if (!r) return; r.ips = aclIPs(r.ips); r.dev = aclMaxDev(r.path, r.ips); aclUI(); requestRedraw(); }
function aclDelIP(i) { const r = ACL.res; if (!r || i < 1 || i >= r.ips.length - 1) return; r.ips.splice(i, 1); aclRedev(); updateStatus(`🧭 已刪除 IP${i}；與低點線最大偏離 ${ACL.res.dev.toFixed(1)} m。`); }
function aclApply() {
  const r = ACL.res; if (!r || r.ips.length < 2) return;
  if ((state.axisNodes || []).length >= 2 && ((state.structs || []).length || (state.revs || []).length) && !confirm('套用後中心線改變，已放置的結構物、護岸以樁號定位，位置會跟著新中心線移動。確定套用？')) return;
  const n0 = state.undoStack.length; setTool('DRAW_AXIS'); state.tempAxisNodes = r.ips.map(p => ({ ...p })); finishAxisDrawing();
  if (state.undoStack.length > n0 + 1) state.undoStack.length = n0 + 1;   // 一次 Ctrl+Z 即回到套用前
  ACL.A = ACL.B = null; ACL.res = null; aclUI(); requestRedraw();
  updateStatus(`✅ 已套用建議中心線（BP＋${state.axisNodes.length - 2} 個 IP＋EP）。可拖曳 IP 圓點微調，或於 IP 表修改半徑；Ctrl+Z 可復原。`);
}
function aclUI() {
  const box = document.getElementById('aclBox'); if (!box) return; const p = ACL.p, r = ACL.res, on = state.activeTool === 'AUTO_AXIS' || r;
  if (!on) { box.innerHTML = ''; return; }
  const f = (k, nm, u, st, tip) => `<span title="${tip || ''}">${nm}</span><span><input type="number" class="input-num" style="width:56px;" step="${st}" value="${p[k]}" onchange="aclSet('${k}',this.value)"> ${u}</span>`;
  box.innerHTML = `<div style="margin-top:5px;padding:5px 6px;border:1px solid #0e7490;border-radius:5px;background:rgba(14,116,144,.08);font-size:11px;line-height:1.5;">
    <b style="color:#22d3ee;">🧭 自動建議中心線</b>　${!ACL.A ? '請點起點（BP）' : !ACL.B ? '請點迄點（EP）' : r ? `長 ${r.len.toFixed(1)} m｜BP＋${r.ips.length - 2} IP＋EP${r.segs.length ? `｜<span style="color:#fb923c;">資料不足 ${r.segs.length} 段</span>` : ''}` : ''}
    <div style="display:grid;grid-template-columns:1fr auto;gap:2px 6px;margin-top:3px;align-items:center;">
      ${f('ds', '取樣間距', 'm', 1, '沿線每隔多少公尺找一次低點')}${f('W', '低點搜尋寬 ±', 'm', 1, '每個取樣點沿法向左右各搜尋的寬度')}${f('tol', '低點容許差', 'm', 0.1, '高程在最低點＋此值以內的各點取平均位置（附近平均低點）')}
      ${f('sm', '平滑強度', '點', 1, '移動平均前後各幾點；越大線越順')}${f('dp', 'IP 簡化容許偏差', 'm', 0.5, '建議線轉成 IP 折線時允許的最大偏差；越大 IP 越少')}${f('R', '預設曲線半徑', 'm', 1, '各 IP 半徑，空間不足時自動縮小')}
      ${f('gap', 'IP 最小間距', 'm', 5, '相鄰 IP 距離小於此值時，刪除偏角較小者（0＝不限）')}${f('ang', 'IP 最小偏角', '°', 1, '偏角小於此值的 IP 視為直線、直接刪除（0＝不限）')}${f('tgt', '目標 IP 數', '個', 1, '設定後自動放寬簡化偏差，直到 IP 數不超過此值（0＝不限）')}</div>
    ${r ? `<div style="margin-top:3px;">與低點線最大偏離 <b style="color:${r.dev > 8 ? '#fb923c' : '#4ade80'};">${r.dev.toFixed(1)}</b> m（太直就調小間距／偏角／目標數）。<b>調整 IP</b>：預覽上拖曳圓點移動，Shift＋點圓點刪除，或按下表 ✕。</div><div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:2px;">${r.ips.map((q, i) => i && i < r.ips.length - 1 ? `<span style="border:1px solid #166534;border-radius:3px;padding:0 3px;">IP${i} ${aclDefl(r.ips, i).toFixed(0)}° <a style="cursor:pointer;color:#f87171;" title="刪除此 IP" onclick="aclDelIP(${i})">✕</a></span>` : '').join('')}</div>` : ''}
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">${r ? '<button class="btn primary" onclick="aclApply()">✅ 套用為中心線</button><button class="btn" onclick="aclRun()">↻ 依參數重算</button>' : ''}<button class="btn" onclick="aclStart()">重新點選</button><button class="btn" onclick="aclCancel()">取消</button></div>
    <div style="color:var(--text-muted);font-size:10.5px;margin-top:3px;">虛線＝建議線（未套用）；橘色＝地形資料不足、以周圍高程平均補值的區段。</div></div>`;
}
function aclDraw() {
  if (state.viewMode !== '2D' || !(ACL.A || ACL.res)) return;
  ctx.save(); const dpr = window.devicePixelRatio || 1; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = ACL.res;
  if (r) { const P = r.path; ctx.lineWidth = 3; ctx.setLineDash([10, 6]);
    for (let i = 1; i < P.length; i++) { const a = worldToScreen2D(P[i - 1].x, P[i - 1].y), b = worldToScreen2D(P[i].x, P[i].y); ctx.strokeStyle = (P[i].miss || P[i - 1].miss) ? '#fb923c' : '#4ade80'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.setLineDash([]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(74,222,128,.55)'; ctx.beginPath(); r.ips.forEach((p, i) => { const s = worldToScreen2D(p.x, p.y); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); }); ctx.stroke();
    r.ips.forEach((p, i) => { const s = worldToScreen2D(p.x, p.y); ctx.fillStyle = '#0b1018'; ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4ade80'; ctx.font = 'bold 11px "JetBrains Mono"'; ctx.textAlign = 'left'; ctx.fillText(i === 0 ? 'BP' : i === r.ips.length - 1 ? 'EP' : `IP${i}${p.r ? ` R=${p.r}` : ''}`, s.x + 7, s.y - 6); }); }
  [ACL.A, ACL.B].forEach((q, i) => { if (!q) return; const s = worldToScreen2D(q.x, q.y); ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e0f2fe'; ctx.font = 'bold 12px "Noto Sans TC"'; ctx.textAlign = 'left'; ctx.fillText(i ? '迄點' : '起點', s.x + 9, s.y + 4); });
  ctx.restore();
}
(function () {
  const _cu = clUI; clUI = function () { _cu.apply(this, arguments); try { aclUI(); } catch (e) { } };
  const _r = render2DCAD; render2DCAD = function () { _r.apply(this, arguments); try { aclDraw(); } catch (e) { console.error('aclDraw', e); } };
  window.addEventListener('mousedown', e => {
    if (state.activeTool !== 'AUTO_AXIS' || state.viewMode !== '2D' || e.button !== 0) return; if (e.target && e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') return;
    e.preventDefault(); e.stopImmediatePropagation(); const rc = cadCanvas.getBoundingClientRect(), w = screenToWorld2D(e.clientX - rc.left, e.clientY - rc.top);
    if (!ACL.A) { ACL.A = { x: w.x, y: w.y }; updateStatus('🧭 已設起點；請點迄點（EP）。'); aclUI(); requestRedraw(); return; }
    if (Math.hypot(w.x - ACL.A.x, w.y - ACL.A.y) < 5) { updateStatus('⚠ 迄點離起點太近（< 5 m）。'); return; }
    ACL.B = { x: w.x, y: w.y }; state.activeTool = 'PAN'; setTool('PAN'); aclRun();
  }, true);
  // 預覽 IP：拖曳移動、Shift＋點刪除
  let _acd = null; const hitIP = e => { const r = ACL.res; if (!r || state.viewMode !== '2D' || state.activeTool === 'AUTO_AXIS' || e.button !== 0) return -1; if (e.target && e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') return -1;
    const rc = cadCanvas.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top; let bi = -1, bd = 9; r.ips.forEach((p, i) => { const s = worldToScreen2D(p.x, p.y), d = Math.hypot(s.x - mx, s.y - my); if (d < bd) { bd = d; bi = i; } }); return bi; };
  window.addEventListener('mousedown', e => { const i = hitIP(e); if (i < 0) return; e.preventDefault(); e.stopImmediatePropagation();
    if (e.shiftKey) { aclDelIP(i); return; } _acd = { i }; }, true);
  window.addEventListener('mousemove', e => { if (!_acd || !ACL.res) return; e.stopImmediatePropagation(); const rc = cadCanvas.getBoundingClientRect(), w = screenToWorld2D(e.clientX - rc.left, e.clientY - rc.top), p = ACL.res.ips[_acd.i]; p.x = +w.x.toFixed(3); p.y = +w.y.toFixed(3); requestRedraw(); }, true);
  window.addEventListener('mouseup', e => { if (!_acd) return; _acd = null; aclRedev(); }, true);
  window.addEventListener('keydown', e => { if (state.activeTool === 'AUTO_AXIS' && e.key === 'Escape') { e.preventDefault(); aclCancel(); updateStatus('已取消自動建議中心線。'); } }, true);
})();
