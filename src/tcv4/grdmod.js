/* ============================================================================
   v6.3 整地（不設結構物，只整地）＋崩塌地整治共用
   斷面：基準高底面（基準線兩側底寬 e）→ 1:N 邊坡（挖方 Nc／填方 Nf）每升（降）階高 h 設平台 w → 再 1:N … 至地面
   預設依《水土保持手冊》階段式邊坡：階高 5 m、平台寬 2 m；坡比可依手冊表工 1-4-6／1-4-7 土質套用
   基準：中心線（整樁斷面；基準高＝設計河床＋zb）或崩塌地基準線（每 ds 取斷面；基準高＝絕對高程 zb）
   起點、迄點各一標準斷面（zb、eL、eR），中間線性內插；個別樁號可覆寫；可自動調整基準高使挖填平衡
   平面：整地線（坡趾、平台邊緣、挖方坡頂／填方坡腳）並把整地範圍內原地形淡化
   ============================================================================ */
const GRD_PRESET = [   // 水土保持手冊表工1-4-6／1-4-7（取表列範圍較緩值）
  ['', '— 依土質套用手冊參考坡度 —'], ['hr', '硬岩：挖 1:0.5', 0.5, null], ['sr', '軟岩：挖 1:0.8', 0.8, null],
  ['gv', '礫石（級配良好）：挖 1:0.8、填 1:1.5', 0.8, 1.5], ['sd', '沉泥質砂／黏土質砂（緊密）：挖 1:1.0、填 1:1.5', 1.0, 1.5],
  ['sl', '砂質土（疏鬆）：挖 1:1.5、填 1:2.0', 1.5, 2.0], ['cl', '黏土、粉土：挖 1:1.2、填 1:1.5', 1.2, 1.5],
  ['cb', '夾岩塊或礫石之黏性土：挖 1:1.5、填 1:1.5', 1.5, 1.5], ['hp', '高塑性黏土或粉土：填 1:2.0', null, 2.0]];
/* ---- 型式庫：每個型式是一張「逐階表」，每階各自的挖方坡比、填方坡比、階高 h、平台寬 w；最後一階可設「重複至地面」或「一路坡至地面」 ---- */
const grdNum = (v, d) => (Number.isFinite(+v) && +v >= 0 ? +v : d);
function grdTierNorm(q) { q = q || {}; return { ncL: grdNum(q.ncL, 1.0), ncR: grdNum(q.ncR, grdNum(q.ncL, 1.0)), nfL: grdNum(q.nfL, 1.5), nfR: grdNum(q.nfR, grdNum(q.nfL, 1.5)), h: grdNum(q.h, 5) || 5, w: grdNum(q.w, 2) }; }
function grdTypNorm(t) { t = t || {}; return { id: t.id || ('T' + Math.random().toString(36).slice(2, 6)), name: t.name || '型式', rep: t.rep === undefined ? true : !!t.rep, tiers: (Array.isArray(t.tiers) && t.tiers.length ? t.tiers : [{}]).map(grdTierNorm) }; }
const GRD_T0 = () => grdTypNorm({ id: 'T1', name: '標準型（階高 5 m、平台 2 m）', rep: true, tiers: [{ ncL: 1.0, ncR: 1.0, nfL: 1.5, nfR: 1.5, h: 5, w: 2 }] });
state.grdTypes = (state.grdTypes || []).map(grdTypNorm); if (!state.grdTypes.length) state.grdTypes = [GRD_T0()];
function grdTyp(id) { return state.grdTypes.find(t => t.id === id) || state.grdTypes[0]; }
function grdNorm(o) {
  o = o || {}; const P = q => ({ zb: Number.isFinite(+(q || {}).zb) ? +q.zb : 0, eL: Number.isFinite(+(q || {}).eL) ? +q.eL : 3, eR: Number.isFinite(+(q || {}).eR) ? +q.eR : 3 }), n = grdNum;
  let tp = o.tp && state.grdTypes.some(t => t.id === o.tp) ? o.tp : null;
  if (!tp) {   // 舊版（整組共用 ncL/ncR/nfL/nfR/h/w）→ 轉成型式
    if (['ncL', 'ncR', 'nfL', 'nfR', 'h', 'w'].some(k => o[k] !== undefined)) { const q = grdTierNorm({ ncL: o.ncL, ncR: o.ncR, nfL: o.nfL, nfR: o.nfR, h: o.h, w: o.w }), f = state.grdTypes.find(t => t.rep && t.tiers.length === 1 && ['ncL', 'ncR', 'nfL', 'nfR', 'h', 'w'].every(k => t.tiers[0][k] === q[k]));
      if (f) tp = f.id; else { const t = grdTypNorm({ name: `1:${q.ncL}／1:${q.nfL}，階高 ${q.h} m、平台 ${q.w} m`, rep: true, tiers: [q] }); state.grdTypes.push(t); tp = t.id; } }
    else tp = state.grdTypes[0].id;
  }
  const ov = Object.assign({}, o.ov || {}); Object.keys(ov).forEach(k => { ov[k] = Object.assign({}, ov[k]); if (ov[k].tiers) ov[k].tiers = ov[k].tiers.map(grdTierNorm); });
  return { id: o.id || ('G' + Math.random().toString(36).slice(2, 7)), name: o.name || '整地', src: o.src === 'dz' ? 'dz' : 'cl', dz: o.dz || null, s0: +o.s0 || 0, s1: Number.isFinite(+o.s1) ? +o.s1 : 40, side: ['L', 'R'].includes(o.side) ? o.side : 'B',
    link: o.link !== false, rv: ['none', 'toe', 'back'].includes(o.rv) ? o.rv : 'none', P0: P(o.P0), P1: P(o.P1), tp, segs: (o.segs || []).filter(q => q && Number.isFinite(+q.a) && Number.isFinite(+q.b)).map(q => ({ a: +q.a, b: +q.b, t: q.t })), ds: n(o.ds, 10) || 10, ov };
}
state.grades = (state.grades || []).map(grdNorm);
let GRD_SEL = null, GRD_SECK = null, GRD_VER = 0, GRD_OPEN = false, GRD_TSEL = null;
const grdF = (v, d) => (Number.isFinite(v) ? v : 0).toFixed(d === undefined ? 2 : d);
function grdSel() { return state.grades.find(g => g.id === GRD_SEL) || state.grades[0] || null; }
function grdCase(G) { return (state.dzCases || []).find(c => c.id === G.dz) || null; }
/* ---- 斷面取樣站 ---- */
function grdStations(G) {
  const o = [];
  if (G.src === 'cl') {
    const a = Math.min(G.s0, G.s1), b = Math.max(G.s0, G.s1);
    (state.sections || []).forEach(sec => { if (sec.sta < a - 0.005 || sec.sta > b + 0.005) return; const dx = (sec.rx - sec.cx), dy = (sec.ry - sec.cy), dl = Math.hypot(dx, dy) || 1;
      o.push({ sta: sec.sta, key: sec.sta.toFixed(2), lab: formatStation(sec.sta), sec, zc: sec.desCenterZ, g: off => secInterp(sec, off, 'groundZ'), W: off => [sec.cx + dx / dl * off, sec.cy + dy / dl * off], amax: { L: sec.readL, R: sec.readR } }); });
    return o;
  }
  const c = grdCase(G), P = (c && c.bl) || []; if (P.length < 2) return o;
  const ch = [0]; for (let i = 1; i < P.length; i++) ch.push(ch[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); const Lb = ch[ch.length - 1];
  const a = Math.max(0, Math.min(G.s0, G.s1)), b = Math.min(Lb, Math.max(G.s0, G.s1)); if (b - a < 0.1) return o;
  const ss = []; for (let s = a; s < b - 1e-6; s += G.ds) ss.push(s); ss.push(b);
  ss.forEach(s => { let i = 1; while (i < P.length - 1 && ch[i] < s) i++; const p = P[i - 1], q = P[i], L = (ch[i] - ch[i - 1]) || 1, t = (s - ch[i - 1]) / L, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t, tx = (q[0] - p[0]) / L, ty = (q[1] - p[1]) / L;
    const nx = -ty, ny = tx, W = off => [x - nx * off, y - ny * off], cache = new Map();   // off<0＝基準線左側
    const g = off => { const k = Math.round(off * 2) / 2; if (!cache.has(k)) { const r = typeof aclZFill === 'function' ? aclZFill(...W(k), 6) : { z: null }; cache.set(k, r.z); } const z0 = cache.get(k); if (z0 === null || z0 === undefined) return NaN; return z0; };
    o.push({ sta: s, key: s.toFixed(2), lab: `${G.name} ${grdF(s, 1)} m`, zc: 0, g, W, amax: { L: 60, R: 60 } }); });
  return o;
}
function grdParAt(G, st, list) {
  const a = Math.min(G.s0, G.s1), b = Math.max(G.s0, G.s1), t = b - a > 1e-9 ? Math.max(0, Math.min(1, (st.sta - a) / (b - a))) : 0, A = G.s0 <= G.s1 ? G.P0 : G.P1, B = G.s0 <= G.s1 ? G.P1 : G.P0;
  const p = { zb: A.zb + (B.zb - A.zb) * t, eL: A.eL + (B.eL - A.eL) * t, eR: A.eR + (B.eR - A.eR) * t }, ov = G.ov[st.key]; const own = {};
  if (ov) ['zb', 'eL', 'eR'].forEach(k => { if (Number.isFinite(+ov[k])) { p[k] = +ov[k]; own[k] = true; } });
  if (G.link) { p.eR = p.eL; if (own.eL) own.eR = true; }
  // 型式：此斷面指定型式／自訂各階 ＞ 依樁號分段 ＞ 預設型式
  const sg = (G.segs || []).find(q => st.sta >= Math.min(q.a, q.b) - 1e-6 && st.sta <= Math.max(q.a, q.b) + 1e-6);
  let typ = grdTyp(sg ? sg.t : G.tp), tiers = typ.tiers, rep = typ.rep, ownT = false, custom = false;
  if (ov && ov.t && state.grdTypes.some(x => x.id === ov.t)) { typ = grdTyp(ov.t); tiers = typ.tiers; rep = typ.rep; ownT = true; }
  if (ov && ov.tiers) { tiers = ov.tiers; rep = ov.rep !== undefined ? ov.rep : rep; ownT = true; custom = true; }
  return { ...p, own, typ, tiers, rep, ownT, custom };
}
/* ---- 單側斷面：a≥0 往外；d(a)＝設計線 ---- */
function grdSide(g, z0, e, T, rep, amax) {   // T＝逐階表 [{nc,nf,h,w}]；rep＝最後一階重複至地面（否則最後一階一路坡至地面）
  const pts = [[0, z0], [e, z0]], benches = [], gE = g(e);
  if (!Number.isFinite(gE)) return { pts, toe: e, benches, day: [e, z0], kind: 'na', over: true, clamp: false };
  const nc = Math.max(1e-3, T[0].nc);
  // 地面取樣（0.25 m）與其後最大值：判斷坡頂是否已露出、是否需挖方
  const aEnd = Math.max(amax, e + 1), st = 0.25, N = Math.ceil((aEnd - e) / st) + 1, GA = new Float64Array(N), SM = new Float64Array(N);
  for (let i = 0; i < N; i++) { const z = g(e + i * st); GA[i] = Number.isFinite(z) ? z : -Infinity; }
  SM[N - 1] = GA[N - 1]; for (let i = N - 2; i >= 0; i--) SM[i] = Math.max(GA[i], SM[i + 1]);
  const sufMax = a => { const k = Math.max(0, Math.min(N - 1, Math.ceil((a - e) / st))); return SM[k]; };
  let cutNeed = false; for (let i = 0; i < N; i++) if (GA[i] > z0 + (i * st) / nc + 1e-4) { cutNeed = true; break; }   // 地面高於第一階挖方坡線 → 需挖方（與坡趾高低無關，避免斷面突變）
  const kind = cutNeed ? 'cut' : (gE < z0 - 1e-4 ? 'fill' : 'none');
  if (kind === 'none') return { pts, toe: e, benches, day: [e, z0], kind, over: false, clamp: false };
  const sg = kind === 'cut' ? 1 : -1, lim = aEnd + 30; let a = e, z = z0, day = null, over = false, lastX = null;
  const seg = (a0, z0_, a1, z1) => { const L = a1 - a0, M = Math.max(2, Math.ceil(L / 0.05)); let fp = z0_ - g(a0);
    for (let i = 1; i <= M; i++) { const t = i / M, aa = a0 + L * t, zz = z0_ + (z1 - z0_) * t, gz = g(aa); if (!Number.isFinite(gz)) continue; const fc = zz - gz;
      if (kind === 'cut' && fp < 0 && fc >= 0) { const u = fc - fp !== 0 ? -fp / (fc - fp) : 1, ap = a0 + L * (i - 1) / M, zp = z0_ + (z1 - z0_) * (i - 1) / M; lastX = [ap + (aa - ap) * u, zp + (zz - zp) * u]; }
      if (kind === 'fill' && fc <= 0) { const u = fc - fp !== 0 ? -fp / (fc - fp) : 1, ap = a0 + L * (i - 1) / M, zp = z0_ + (z1 - z0_) * (i - 1) / M; return [ap + (aa - ap) * u, zp + (zz - zp) * u]; }
      fp = fc; } return null; };
  const done = () => kind === 'cut' && z > sufMax(a) + 1e-6;   // 挖方：設計線已高於其後所有地面 → 最後一次露出點即坡頂
  for (let k = 0; k < 60 && !day; k++) {
    const tr = T[Math.min(k, T.length - 1)], n = Math.max(1e-3, kind === 'cut' ? tr.nc : tr.nf), fin = !rep && k >= T.length - 1;   // fin＝最後一階：一路坡至地面（無平台）
    const hh = fin ? Math.max(1, (lim - a) / n) : tr.h;
    const a1 = a + hh * n, z1 = z + sg * hh, r = seg(a, z, a1, z1); if (r) { day = r; break; } pts.push([a1, z1]); a = a1; z = z1;
    if (done()) break; if (fin || a > lim) { over = true; break; }
    if (tr.w > 1e-6) { const r2 = seg(a, z, a + tr.w, z); if (r2) { day = r2; break; } benches.push([[a, z], [a + tr.w, z]]); a += tr.w; pts.push([a, z]); if (done()) break; }
    if (a > lim) { over = true; break; }
  }
  if (kind === 'cut') day = lastX || [e, z0];
  if (!day) { day = pts[pts.length - 1]; over = true; }
  let P = pts.filter(p => p[0] < day[0] - 1e-9), clamp = false; P.push(day);
  if (day[0] > amax + 1e-6 && amax > e + 1e-6) {   // 坡頂（坡腳）超出斷面實測範圍：截在範圍邊界，不再外插（避免平面坡頂線凸出）
    const O = [P[0]]; for (let i = 1; i < P.length; i++) { const p = P[i - 1], q = P[i]; if (q[0] <= amax + 1e-9) { O.push(q); continue; } if (p[0] < amax) { const t = (amax - p[0]) / (q[0] - p[0]); O.push([amax, p[1] + (q[1] - p[1]) * t]); } break; }
    P = O; day = P[P.length - 1]; clamp = true; over = true;
  }
  return { pts: P, toe: e, benches: benches.filter(b => b[1][0] <= day[0] + 1e-9), day, kind, over: over || clamp, clamp };
}
function grdArea(g, S) {   // 0～坡頂（坡腳）之間挖／填面積
  const P = S.pts, aEnd = S.day[0]; let cut = 0, fill = 0, i = 0; const st = 0.05;
  for (let a = st / 2; a < aEnd; a += st) { while (i < P.length - 2 && P[i + 1][0] < a) i++; const p = P[i], q = P[i + 1], d = q[0] - p[0] > 1e-9 ? p[1] + (q[1] - p[1]) * (a - p[0]) / (q[0] - p[0]) : q[1], gz = g(a); if (!Number.isFinite(gz)) continue;
    if (gz > d) cut += (gz - d) * st; else fill += (d - gz) * st; }
  return { cut, fill };
}
function grdSecCalc(G, st, dzAdd) {
  const p = grdParAt(G, st), z0 = st.zc + p.zb + (dzAdd || 0), out = { st, p, z0, sides: {}, cut: 0, fill: 0 };
  ['L', 'R'].forEach(sd => { if (G.side !== 'B' && G.side !== sd) return; const sg = sd === 'L' ? -1 : 1, g = a => st.g(sg * a), e = sd === 'L' ? p.eL : p.eR;
    const T = p.tiers.map(q => ({ nc: G.link || sd === 'L' ? q.ncL : q.ncR, nf: G.link || sd === 'L' ? q.nfL : q.nfR, h: q.h, w: q.w }));
    const RV = G.src === 'cl' && G.rv !== 'none' && st.sec && typeof rvGeomSec === 'function' ? (() => { try { return rvGeomSec(st.sec, sd); } catch (er) { return null; } })() : null;
    let S, A;
    if (RV && G.rv === 'toe') {   // 整地至護岸牆腳：此側不設邊坡，護岸本身即為邊界
      const B = RV.B, aT = Math.max(0, B.face && B.face.length ? Math.min(B.e, B.face[0][0]) : B.e);
      S = { pts: [[0, z0], [aT, z0]], toe: aT, benches: [], day: [aT, z0], kind: 'rv', over: false, clamp: false, rv: 'toe' }; A = grdArea(g, S);
    } else if (RV && G.rv === 'back') {   // 整地在護岸背後：自牆頂背側起算，基準高＝護岸頂
      const B = RV.B, a0 = Math.max(0, B.a0b), zT = B.zTop, gs = a => g(a0 + a);
      S = grdSide(gs, zT, Math.max(0, e - a0), T, p.rep, Math.max(1, (st.amax[sd] || 60) - a0)); A = grdArea(gs, S);
      const sh = q => [q[0] + a0, q[1]]; S.pts = S.pts.map(sh); S.benches = S.benches.map(b => b.map(sh)); S.day = sh(S.day); S.toe += a0; S.a0 = a0; S.zT = zT; S.rv = 'back';
    } else { S = grdSide(g, z0, Math.max(0, e), T, p.rep, st.amax[sd] || 60); A = grdArea(g, S); }
    S.sg = sg; S.A = A; out.sides[sd] = S; out.cut += A.cut; out.fill += A.fill; });
  return out;
}
function grdCalc(G, dzAdd) {
  const ST = grdStations(G), R = ST.map(st => grdSecCalc(G, st, dzAdd)); let Vc = 0, Vf = 0;
  for (let i = 1; i < R.length; i++) { const L = Math.abs(R[i].st.sta - R[i - 1].st.sta); R[i].L = L; R[i].Vc = (R[i].cut + R[i - 1].cut) / 2 * L; R[i].Vf = (R[i].fill + R[i - 1].fill) / 2 * L; Vc += R[i].Vc; Vf += R[i].Vf; }
  return { R, Vc, Vf };
}
function grdRes(G) { const k = JSON.stringify([JSON.stringify(G, (kk, v) => kk === '_r' || kk === '_k' ? undefined : v), JSON.stringify(state.grdTypes), GRD_VER, (state.sections || []).length, G.rv !== 'none' ? JSON.stringify(state.revs || []) : '', G.src === 'cl' ? (state.sections || []).filter(s => s.sta >= Math.min(G.s0, G.s1) - 0.01 && s.sta <= Math.max(G.s0, G.s1) + 0.01).map(s => [s.sta, s.desCenterZ, s.samples.length]) : (grdCase(G) || {}).bl]); if (G._k !== k || !G._r) { G._r = grdCalc(G); G._k = k; } return G._r; }
function grdBalance() {
  const G = grdSel(); if (!G) return; const f = d => { const r = grdCalc(G, d); return r.Vc - r.Vf; };
  let lo = -20, hi = 20, flo = f(lo), fhi = f(hi); if (flo * fhi > 0) { updateStatus('⚠ 在基準高 ±20 m 內找不到挖填平衡點（可能整地範圍太小或地形資料不足）。'); return; }
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2, fm = f(m); if (flo * fm <= 0) { hi = m; fhi = fm; } else { lo = m; flo = fm; } }
  // 斷面形狀在挖／填轉換處不連續：於近旁 ±0.5 m 細掃，取 |挖−填| 最小者
  let d = (lo + hi) / 2, best = Math.abs(f(d)); for (let x = d - 0.5; x <= d + 0.5 + 1e-9; x += 0.01) { const v = Math.abs(f(x)); if (v < best) { best = v; d = x; } }
  d = +d.toFixed(3); pushUndoSnapshot(); G.P0.zb = +(G.P0.zb + d).toFixed(3); G.P1.zb = +(G.P1.zb + d).toFixed(3); Object.values(G.ov).forEach(o => { if (Number.isFinite(+o.zb)) o.zb = +(+o.zb + d).toFixed(3); });
  G._r = null; const r = grdRes(G); grdRefresh(); updateStatus(`⚖ ${G.name}：基準高整體調整 ${d >= 0 ? '+' : ''}${grdF(d, 3)} m → 挖方 ${grdF(r.Vc, 1)} m³、填方 ${grdF(r.Vf, 1)} m³（差 ${grdF(r.Vc - r.Vf, 1)} m³）。`);
}
/* ---- 平面：整地線 ---- */
function grdPlanLines(G) {
  const R = grdRes(G).R, L = {}, add = (k, p) => { (L[k] = L[k] || []).push(p); }, brk = k => { if (L[k] && L[k].length && L[k][L[k].length - 1] !== null) L[k].push(null); };
  R.forEach(r => ['L', 'R'].forEach(sd => { const S = r.sides[sd]; if (!S) return; const W = a => r.st.W(S.sg * a);
    add(sd + 'toe', W(S.toe)); add(sd + 'day', W(S.day[0])); for (let k = 0; k < 12; k++) { const b = S.benches[k]; if (b) { add(sd + 'b' + k + 'i', W(b[0][0])); add(sd + 'b' + k + 'o', W(b[1][0])); } else { brk(sd + 'b' + k + 'i'); brk(sd + 'b' + k + 'o'); } } }));
  const foot = []; const dL = R.map(r => r.sides.L ? r.st.W(-r.sides.L.day[0]) : r.st.W(0)), dR = R.map(r => r.sides.R ? r.st.W(r.sides.R.day[0]) : r.st.W(0)); if (R.length > 1) foot.push(...dL, ...dR.reverse());
  const caps = [], overs = []; [R[0], R[R.length - 1]].forEach((r, ri) => { if (!r || (ri && R.length < 2)) return; ['L', 'R'].forEach(sd => { const S = r.sides[sd]; if (!S || S.kind === 'na' || S.day[0] - S.toe < 0.05) return; const W = a => r.st.W(S.sg * a); caps.push([W(S.toe), W(S.day[0])]); }); });   // 起迄兩端封口：坡趾→坡頂
  R.forEach(r => ['L', 'R'].forEach(sd => { const S = r.sides[sd]; if (S && S.clamp) overs.push(r.st.W(S.sg * S.day[0])); }));
  const segs = Object.entries(L).map(([k, P]) => { const o = []; let cur = []; P.forEach(p => { if (!p) { if (cur.length > 1) o.push(cur); cur = []; } else cur.push(p); }); if (cur.length > 1) o.push(cur); return o.map(p => ({ k, p })); }).flat();
  const kindOf = sd => { const r = R.find(q => q.sides[sd]); return r ? r.sides[sd].kind : 'none'; };
  caps.forEach(p => segs.push({ k: 'cap', p })); return { segs, foot, kindOf, overs };
}
const GRD_COL = { toe: '#a3e635', day: '#f472b6', bench: '#facc15', cap: '#fda4af' };
function grdDrawFade() {
  if (state.viewMode !== '2D') return; (state.grades || []).forEach(G => { let Q; try { Q = grdPlanLines(G); } catch (e) { return; } if (Q.foot.length < 3) return;
    ctx.save(); ctx.fillStyle = 'rgba(9,12,16,0.62)'; ctx.beginPath(); Q.foot.forEach((p, i) => { const s = worldToScreen2D(p[0], p[1]); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); }); ctx.closePath(); ctx.fill(); ctx.restore(); });
}
function grdDrawPlan() {
  if (state.viewMode !== '2D') return; (state.grades || []).forEach(G => { let Q; try { Q = grdPlanLines(G); } catch (e) { console.error('grdPlan', e); return; } const sel = GRD_SEL === G.id;
    ctx.save(); Q.segs.forEach(({ k, p }) => { const t = k === 'cap' ? 'cap' : /toe$/.test(k) ? 'toe' : /day$/.test(k) ? 'day' : 'bench'; ctx.strokeStyle = GRD_COL[t]; ctx.lineWidth = (t === 'bench' || t === 'cap' ? 1.2 : 2) * (sel ? 1.3 : 1); ctx.setLineDash(t === 'day' ? [] : t === 'bench' ? [6, 4] : []);
      ctx.beginPath(); p.forEach((q, i) => { const s = worldToScreen2D(q[0], q[1]); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); }); ctx.stroke(); });
    ctx.setLineDash([]); (Q.overs || []).forEach(w => { const s = worldToScreen2D(w[0], w[1]); ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.arc(s.x, s.y, 3.2, 0, Math.PI * 2); ctx.fill(); });   // 橘點＝坡頂超出實測範圍、截在邊界
    const R = grdRes(G).R; if (R.length) { const m = R[Math.floor(R.length / 2)], s = worldToScreen2D(...m.st.W(0)); ctx.font = 'bold 12px "Noto Sans TC"'; ctx.fillStyle = '#a3e635'; ctx.textAlign = 'center';
      const a = R[0].st, b = R[R.length - 1].st; ctx.fillText(`${G.name}　${G.src === 'cl' ? `${formatStation(a.sta)}～${formatStation(b.sta)}` : `${grdF(a.sta, 1)}～${grdF(b.sta, 1)} m`}`, s.x, s.y - 14); }
    ctx.restore(); });
}
function grdDxfPlan(D) {
  (state.grades || []).forEach(G => { let Q; try { Q = grdPlanLines(G); } catch (e) { return; } Q.segs.forEach(({ k, p }) => { const t = k === 'cap' ? 'CAP' : /toe$/.test(k) ? 'TOE' : /day$/.test(k) ? 'DAYLIGHT' : 'BENCH'; D.poly(p, 'GRADE_' + t, t === 'TOE' ? 3 : t === 'DAYLIGHT' ? 6 : t === 'CAP' ? 1 : 2, 0, false, t === 'BENCH' ? 'DASHED' : undefined); });
    const R = grdRes(G).R; if (R.length) { const m = R[Math.floor(R.length / 2)], w = m.st.W(0); D.text(w[0], w[1], 0.6, G.name, 'GRADE_TEXT', 3, { align: 'c' }); } });
}
/* ---- 橫斷面 ---- */
function grdSecItems(sec) { const o = []; (state.grades || []).forEach(G => { if (G.src !== 'cl') return; const r = grdRes(G).R.find(q => q.st.sec === sec || Math.abs(q.st.sta - sec.sta) < 0.005); if (r) o.push({ G, r }); }); return o; }
function grdSecPoly(r, sd) { const S = r.sides[sd]; return S ? S.pts.filter(p => p[0] <= S.day[0] + 1e-9).map(p => [S.sg * p[0], p[1]]) : []; }
function grdDrawCross(sec, sx, sy, isLarge) {
  grdSecItems(sec).forEach(({ G, r }) => { ctx.save(); ['L', 'R'].forEach(sd => { const P = grdSecPoly(r, sd); if (P.length < 2) return; const S = r.sides[sd];
      // 挖填區塊
      const g = a => secInterp(sec, a, 'groundZ'), st = 0.1, a1 = S.day[0];
      for (let a = 0; a < a1; a += st) { const off = S.sg * (a + st / 2), gz = g(off); let d = null; for (let i = 0; i + 1 < S.pts.length; i++) { const p = S.pts[i], q = S.pts[i + 1]; if (a + st / 2 >= p[0] - 1e-9 && a + st / 2 <= q[0] + 1e-9) { d = q[0] - p[0] > 1e-9 ? p[1] + (q[1] - p[1]) * (a + st / 2 - p[0]) / (q[0] - p[0]) : q[1]; break; } } if (d === null || !Number.isFinite(gz)) continue;
        ctx.fillStyle = gz > d ? 'rgba(248,113,113,0.28)' : 'rgba(96,165,250,0.28)'; const x0 = sx(S.sg * a), x1 = sx(S.sg * (a + st)); ctx.fillRect(Math.min(x0, x1), Math.min(sy(gz), sy(d)), Math.abs(x1 - x0) + 0.5, Math.abs(sy(gz) - sy(d))); }
      if (S.clamp) { const q = P[P.length - 1]; ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.arc(sx(q[0]), sy(q[1]), 3.5, 0, Math.PI * 2); ctx.fill(); if (isLarge) { ctx.font = 'bold 10.5px "Noto Sans TC"'; ctx.textAlign = S.sg < 0 ? 'right' : 'left'; ctx.fillText('超出實測範圍', sx(q[0]) + S.sg * 6, sy(q[1]) - 6); } }
      ctx.strokeStyle = '#a3e635'; ctx.lineWidth = isLarge ? 2.4 : 1.5; ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1])))); ctx.stroke(); });
    ctx.restore(); });
  if (isLarge) grdXHandles(sec, sx, sy);
}
function grdDxfCross(D, sec, sx, sy, TH) {
  grdSecItems(sec).forEach(({ G, r }) => { ['L', 'R'].forEach(sd => { const P = grdSecPoly(r, sd); if (P.length > 1) D.poly(P.map(p => [sx(p[0]), sy(p[1])]), 'GRADE_LINE', 3, 0, false); });
  });
}
/* ---- 數量表 ---- */
function grdSheet() {
  if (!(state.grades || []).length) return null;
  const rows = [[{ v: '整地數量（橫斷面平均斷面積法；斷面：底面→逐階 1:N 邊坡→平台→…→至地面，依型式庫）', s: 5 }], ['名稱', '樁號／里程', '基準高 (m)', '底寬 左/右 (m)', '挖方面積 (m²)', '填方面積 (m²)', '距離 (m)', '挖方 (m³)', '填方 (m³)', '型式'].map(v => ({ v, s: 1 }))];
  state.grades.forEach(G => { const { R, Vc, Vf } = grdRes(G);
    R.forEach(r => rows.push([G.name, G.src === 'cl' ? formatStation(r.st.sta) : grdF(r.st.sta, 2), +grdF(r.z0, 3), `${grdF(r.p.eL)}/${grdF(r.p.eR)}`, +grdF(r.cut, 3), +grdF(r.fill, 3), r.L ? +grdF(r.L, 2) : '', r.Vc !== undefined ? +grdF(r.Vc, 2) : '', r.Vf !== undefined ? +grdF(r.Vf, 2) : '', r.p.typ.name + (r.p.custom ? '（此斷面自訂）' : '')].map(v => ({ v }))));
    rows.push([{ v: `${G.name} 合計`, s: 2 }, { v: [...new Set(R.map(r => r.p.typ.name))].join('、') }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: +grdF(Vc, 2), s: 2 }, { v: +grdF(Vf, 2), s: 2 }]);
    rows.push([{ v: '' }, { v: '挖填差（挖−填）' }, { v: +grdF(Vc - Vf, 2), s: 2 }]); });
  return { name: '整地', cols: [12, 14, 12, 14, 14, 14, 10, 12, 12, 26], rows, freeze: 2, merges: ['A1:J1'] };
}
/* ---- 面板 ---- */
function grdWarn(G) {   // 超出實測範圍、坡頂位置突變的斷面
  const R = grdRes(G).R, over = [], jump = []; R.forEach((r, i) => { let o = false; ['L', 'R'].forEach(sd => { const S = r.sides[sd]; if (S && S.clamp) o = true; }); if (o) over.push(r.st.lab);
    if (i) { let j = false; ['L', 'R'].forEach(sd => { const a = r.sides[sd], b = R[i - 1].sides[sd]; if (a && b && a.kind !== 'none' && b.kind !== 'none' && a.kind !== 'na' && b.kind !== 'na' && Math.abs(a.day[0] - b.day[0]) > 5) j = true; }); if (j) jump.push(`${R[i - 1].st.lab}→${r.st.lab}`); } }); return { over, jump };
}
function grdTierEd(tiers, rep, link, ctx) {   // 逐階表：階 | 挖方坡比 | 填方坡比 | 階高 | 平台寬 | ✕
  const inp = (i, k, v, w, dis) => `<input type="number" class="input-num" style="width:${w || 58}px;" step="0.1" min="0" value="${v}"${dis ? ' disabled' : ''} onchange="grdTierSet(${ctx},${i},'${k}',this.value)">`, n = tiers.length;
  const lab = (t, tt) => `<span style="font-size:10px;color:var(--text-muted);white-space:nowrap;" title="${tt || ''}">${t}</span>`;
  let h = `<div style="margin-top:3px;">`;
  tiers.forEach((q, i) => { const last = i === n - 1 && !rep;
    h += `<div style="border:1px solid var(--border-dim);border-radius:4px;padding:3px 4px;margin-bottom:3px;">
      <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;"><b style="min-width:30px;">${i + 1}${i === n - 1 ? (rep ? '↻' : '⤴') : ''}</b>${lab('挖左 1:', '挖方坡比 1:n' + (link ? '（左右相同）' : '（左）'))}${inp(i, 'ncL', q.ncL, 52)}${lab('填左 1:', '填方坡比 1:n')}${inp(i, 'nfL', q.nfL, 52)}${link ? '' : lab('挖右 1:') + inp(i, 'ncR', q.ncR, 52) + lab('填右 1:') + inp(i, 'nfR', q.nfR, 52)}</div>
      <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin-top:2px;"><span style="min-width:30px;"></span>${lab('階高 h', '每階垂直高度')}${last ? '<span style="color:var(--text-muted);">至地面</span>' : inp(i, 'h', q.h, 58)}${lab('平台 w', '平台寬')}${last ? '' : inp(i, 'w', q.w, 58)}${n > 1 ? `<a style="cursor:pointer;color:#f87171;margin-left:auto;" title="刪除此階" onclick="grdTierOp(${ctx},'del',${i})">✕</a>` : ''}</div></div>`; });
  return h + `</div><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:2px;"><button class="btn" style="padding:0 6px;" onclick="grdTierOp(${ctx},'add')">＋階</button><label title="勾選：最後一階（↻）的階高與平台寬重複，直到接地面（手冊 5 m／2 m 的做法）。不勾：最後一階（⤴）一路以該坡比坡到地面，不再設平台。"><input type="checkbox"${rep ? ' checked' : ''} onchange="grdTierOp(${ctx},'rep',this.checked)"> 末階重複至地面</label></div>`;
}
function grdUI() {
  const d = document.getElementById('grdBox'); if (!d) return; const bd = document.getElementById('grdBadge'); if (bd) bd.textContent = `${state.grades.length} 處`;
  if (d.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName) && document.activeElement.type !== 'checkbox') return;
  const L = state.grades, G = grdSel();
  if (GRD_OPEN) { const card = document.getElementById('grdCard'); if (card && card.classList.contains('folded') && typeof earthShowCard === 'function') earthShowCard(card); } GRD_OPEN = false;
  let h = `<div style="font-size:11px;">`;
  h += `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px;"><button class="btn" onclick="grdAdd('cl')">＋沿中心線</button><button class="btn" onclick="grdAdd('dz')" title="沿崩塌地案件的基準線取斷面">＋沿崩塌地基準線</button>${G ? '<button class="btn magenta" onclick="grdPick()" title="在平面圖依序點起點、迄點（沿中心線取樁號；崩塌地型沿基準線取里程）；Esc 取消。選取中的整地在平面圖有起、迄、中間三個把手，可拖曳調整或整段平移。">📍 在平面圖點選範圍</button><button class="btn amber" onclick="grdBalance()" title="整體上下調整基準高（起迄標準斷面與覆寫值同步加減），使總挖方≈總填方">⚖ 自動挖填平衡</button><button class="btn" onclick="grdDel()">刪除</button>' : ''}</div>`;
  if (!G) { d.innerHTML = h + '<div style="color:var(--text-muted);">尚未建立整地。中心線：以目前選取樁號起 40 m；崩塌地：沿該案件基準線。</div></div>'; return; }
  if (L.length > 1) h += `<select class="input-select" style="width:100%;margin-bottom:4px;" onchange="GRD_SEL=this.value;grdUI();requestRedraw();">${L.map(g => `<option value="${g.id}"${g.id === G.id ? ' selected' : ''}>${escAttr(g.name)}</option>`).join('')}</select>`;
  const inp = (k, v, w, st, dis) => `<input type="number" class="input-num" style="width:${w || 58}px;" step="${st || 0.1}" value="${v}"${dis ? ' disabled' : ''} onchange="grdSet('${k}',this.value)">`, cl = G.src === 'cl';
  const cases = (state.dzCases || []).filter(c => (c.bl || []).length > 1);
  h += `<div style="display:grid;grid-template-columns:1fr auto;gap:2px 6px;align-items:center;">
    <span>名稱</span><input type="text" class="input-num" style="width:110px;" value="${escAttr(G.name)}" onchange="grdSet('name',this.value)">
    <span>基準</span>${cl ? '<span>中心線（基準高＝設計河床＋值）</span>' : `<select class="input-select" onchange="grdSet('dz',this.value)">${cases.map(c => `<option value="${c.id}"${c.id === G.dz ? ' selected' : ''}>${escAttr(c.name)} 基準線</option>`).join('')}</select>`}
    <span>${cl ? '起點樁號' : '起點里程（沿基準線）'} (m)</span>${inp('s0', G.s0, 72, 0.1)}<span>${cl ? '迄點樁號' : '迄點里程'} (m)</span>${inp('s1', G.s1, 72, 0.1)}
    ${cl ? '' : `<span>斷面間距 (m)</span>${inp('ds', G.ds, 58, 1)}`}
    <span>側別</span><select class="input-select" onchange="grdSet('side',this.value)">${[['B', '兩側'], ['L', '左側'], ['R', '右側']].map(([v, t]) => `<option value="${v}"${G.side === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
    ${cl ? `<span title="整地範圍內該側有護岸時的處理方式">遇護岸</span><select class="input-select" onchange="grdSet('rv',this.value)">${[['toe', '整地至護岸牆腳（該側不設邊坡）'], ['back', '整地在護岸背後（自牆頂背側起）'], ['none', '不考慮護岸']].map(([v, t]) => `<option value="${v}"${G.rv === v ? ' selected' : ''}>${t}</option>`).join('')}</select>` : ''}
    <span>左右相同</span><input type="checkbox"${G.link ? ' checked' : ''} onchange="grdSet('link',this.checked)"></div>`;
  h += `<table class="pt-table" style="margin-top:4px;width:100%;"><thead><tr><th>標準斷面</th><th>起點</th><th>迄點</th></tr></thead><tbody>
    <tr><td>基準高 ${cl ? '（相對設計河床）' : '（絕對高程）'} m</td><td>${inp('P0.zb', G.P0.zb, 74, 0.1)}</td><td>${inp('P1.zb', G.P1.zb, 74, 0.1)}</td></tr>
    <tr><td>底寬：基準線至左坡趾 m${cl && G.rv === 'back' ? '<br><span style="color:var(--text-muted);font-size:10px;">有護岸處：小於牆頂背側者自牆背起坡</span>' : ''}</td><td>${inp('P0.eL', G.P0.eL, 60, 0.5)}</td><td>${inp('P1.eL', G.P1.eL, 60, 0.5)}</td></tr>
    <tr><td>底寬：基準線至右坡趾 m</td><td>${inp('P0.eR', G.link ? G.P0.eL : G.P0.eR, 60, 0.5, G.link)}</td><td>${inp('P1.eR', G.link ? G.P1.eL : G.P1.eR, 60, 0.5, G.link)}</td></tr></tbody></table>`;
  // ---- 型式庫（逐階表）----
  if (!GRD_TSEL || !state.grdTypes.some(t => t.id === GRD_TSEL)) GRD_TSEL = G.tp;
  const TY = grdTyp(GRD_TSEL), tw = [];
  TY.tiers.forEach((q, i) => { if (q.h > 5 + 1e-9 && !(i === TY.tiers.length - 1 && !TY.rep)) tw.push(`第 ${i + 1} 階高 ${q.h} m`); if (q.w < 2 - 1e-9 && !(i === TY.tiers.length - 1 && !TY.rep)) tw.push(`第 ${i + 1} 階平台 ${q.w} m`); });
  h += `<div style="margin-top:6px;padding:4px 6px;border:1px solid var(--border-dim);border-radius:4px;"><b>型式庫（每階各自設定）</b>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px;align-items:center;"><select class="input-select" style="flex:1;min-width:120px;" onchange="GRD_TSEL=this.value;grdUI();">${state.grdTypes.map(t => `<option value="${t.id}"${t.id === TY.id ? ' selected' : ''}>${escAttr(t.name)}（${t.tiers.length} 階）</option>`).join('')}</select>
      <button class="btn" style="padding:0 6px;" onclick="grdTypOp('new')" title="新增型式（複製目前這個）">＋</button><button class="btn" style="padding:0 6px;" onclick="grdTypOp('del')" title="刪除這個型式（使用中的改用其他型式）">✕</button></div>
    <div style="margin-top:3px;"><input type="text" class="input-num" style="width:100%;" value="${escAttr(TY.name)}" onchange="grdTypOp('name',this.value)"></div>
    ${grdTierEd(TY.tiers, TY.rep, G.link, `'T','${TY.id}'`)}
    <select class="input-select" style="width:100%;margin-top:3px;" onchange="grdPreset(this.value)">${GRD_PRESET.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>
    ${tw.length ? `<div style="color:#f59e0b;margin-top:2px;">⚠ ${tw.join('；')}（水土保持手冊：階高 ≤ 5 m、平台寬 ≥ 2 m）</div>` : ''}</div>`;
  // ---- 分段套用 ----
  h += `<div style="margin-top:6px;padding:4px 6px;border:1px solid var(--border-dim);border-radius:4px;"><b>依${cl ? '樁號' : '里程'}分段套用型式</b>
    <div style="display:flex;gap:4px;align-items:center;margin-top:3px;"><span>預設型式</span><select class="input-select" style="flex:1;" onchange="grdSet('tp',this.value)">${state.grdTypes.map(t => `<option value="${t.id}"${t.id === G.tp ? ' selected' : ''}>${escAttr(t.name)}</option>`).join('')}</select></div>`;
  if ((G.segs || []).length) h += `<table class="pt-table" style="width:100%;margin-top:3px;"><thead><tr><th>起 (m)</th><th>迄 (m)</th><th>型式</th><th></th></tr></thead><tbody>${G.segs.map((q, i) => `<tr><td><input type="number" class="input-num" style="width:64px;" step="0.1" value="${q.a}" onchange="grdSegSet(${i},'a',this.value)"></td><td><input type="number" class="input-num" style="width:64px;" step="0.1" value="${q.b}" onchange="grdSegSet(${i},'b',this.value)"></td><td><select class="input-select" style="width:100%;" onchange="grdSegSet(${i},'t',this.value)">${state.grdTypes.map(t => `<option value="${t.id}"${t.id === q.t ? ' selected' : ''}>${escAttr(t.name)}</option>`).join('')}</select></td><td><a style="cursor:pointer;color:#f87171;" onclick="grdSegDel(${i})">✕</a></td></tr>`).join('')}</tbody></table>`;
  h += `<div style="margin-top:3px;"><button class="btn" style="padding:0 6px;" onclick="grdSegAdd()" title="新增一段（預設取範圍後半，型式取目前編輯中的型式）">＋分段</button> <span style="color:var(--text-muted);font-size:10.5px;">範圍內的${cl ? '樁號' : '里程'}依序比對，先符合的先用；不同型式之間不內插，在分段交界直接切換；基準高、底寬仍由起迄標準斷面內插。</span></div></div>`;
  const { R, Vc, Vf } = grdRes(G), W = grdWarn(G);
  h += `<div style="margin-top:5px;line-height:1.6;background:rgba(163,230,53,.07);border:1px solid var(--border-dim);padding:3px 6px;border-radius:4px;">斷面 ${R.length} 處　挖方 <b>${grdF(Vc, 1)}</b> m³　填方 <b>${grdF(Vf, 1)}</b> m³　差（挖−填）<b style="color:${Math.abs(Vc - Vf) <= Math.max(1, 0.02 * Math.max(Vc, Vf)) ? '#4ade80' : '#f59e0b'};">${grdF(Vc - Vf, 1)}</b> m³</div>`;
  if (W.over.length) h += `<div style="color:#fb923c;margin-top:2px;">⚠ 坡頂超出斷面實測範圍、已截在範圍邊界（${W.over.length} 處：${W.over.slice(0, 4).join('、')}${W.over.length > 4 ? '…' : ''}）。請加大「路寬/河寬設定」的取樣寬，或縮小整地範圍／底寬。</div>`;
  if (W.jump.length) h += `<div style="color:#fb923c;margin-top:2px;">⚠ 坡頂位置在相鄰斷面間差超過 5 m（${W.jump.slice(0, 3).join('、')}${W.jump.length > 3 ? '…' : ''}）：平面坡頂線會有明顯折角，建議加斷面或調整基準高／型式。</div>`;
  if (R.length) {
    const ks = R.find(r => r.st.key === GRD_SECK) || R[Math.floor(R.length / 2)]; GRD_SECK = ks.st.key; const ovk = G.ov[ks.st.key] || {};
    h += `<div style="max-height:190px;overflow:auto;margin-top:4px;"><table class="pt-table" style="width:100%;"><thead><tr><th>${cl ? '樁號' : '里程'}</th><th>基準高</th><th>底寬左</th>${G.link ? '' : '<th>底寬右</th>'}<th>挖 m²</th><th>填 m²</th><th></th></tr></thead><tbody>${R.map(r => { const o = r.p.own, c = k => o[k] ? 'font-weight:700;color:#fde047;' : 'color:#94a3b8;';
      const ci = (k, v) => `<input type="number" class="input-num" style="width:64px;${c(k)}" step="0.1" value="${grdF(v)}" onchange="grdOv('${r.st.key}','${k}',this.value)">`, ovn = Object.keys(G.ov[r.st.key] || {}).length;
      return `<tr style="${r.st.key === GRD_SECK ? 'background:rgba(163,230,53,.12);' : ''}"><td style="cursor:pointer;" onclick="GRD_SECK='${r.st.key}';grdUI();" title="${escAttr(r.p.typ.name)}${r.p.custom ? '（此斷面自訂）' : ''}">${cl ? formatStation(r.st.sta) : grdF(r.st.sta, 1)}${r.p.ownT ? '<span style="color:#fde047;">●</span>' : ''}</td><td>${ci('zb', r.p.zb)}</td><td>${ci('eL', r.p.eL)}</td>${G.link ? '' : `<td>${ci('eR', r.p.eR)}</td>`}<td>${grdF(r.cut)}</td><td>${grdF(r.fill)}</td><td>${ovn ? `<button class="btn" style="padding:0 4px;" title="清除此斷面的覆寫（基準高、底寬、型式、各階），回到起迄內插值與分段型式" onclick="grdOv('${r.st.key}',null)">↺</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>
      <div style="font-size:10.5px;color:var(--text-muted);">灰字＝起迄標準斷面內插值；黃字＝此斷面覆寫值（直接改即可）；● ＝此斷面另指定型式或自訂各階。點樁號切換下方預覽與設定。</div>
      <div style="margin-top:4px;padding:4px 6px;border:1px solid var(--border-dim);border-radius:4px;"><b>此斷面（${ks.st.lab}）</b>　型式：<select class="input-select" style="width:150px;" onchange="grdSecType(this.value)"><option value="">依分段（${escAttr((() => { const sg = (G.segs || []).find(q => ks.st.sta >= Math.min(q.a, q.b) - 1e-6 && ks.st.sta <= Math.max(q.a, q.b) + 1e-6); return grdTyp(sg ? sg.t : G.tp).name; })())}）</option>${state.grdTypes.map(t => `<option value="${t.id}"${ovk.t === t.id ? ' selected' : ''}>${escAttr(t.name)}</option>`).join('')}</select>
        ${ks.p.custom ? '<button class="btn" style="padding:0 6px;" onclick="grdSecCustom(false)" title="放棄此斷面自訂的各階，回到型式">↺ 回到型式</button>' : '<button class="btn" style="padding:0 6px;" onclick="grdSecCustom(true)" title="把這個斷面的各階複製出來，只改這個斷面">✎ 此斷面自訂各階</button>'}
        ${ks.p.custom ? grdTierEd(ovk.tiers, ovk.rep !== undefined ? ovk.rep : ks.p.rep, G.link, `'S','${ks.st.key}'`) : ''}</div>
      <canvas id="grdCv" width="330" height="190" style="width:100%;margin-top:4px;background:#0b1018;border:1px solid var(--border-dim);border-radius:4px;cursor:crosshair;" onmousedown="grdMiniDown(event)"></canvas>
      <div style="font-size:10.5px;color:var(--text-muted);">預覽上可拖曳：中間菱形＝上下調基準高；兩側圓點＝左右調底寬（寫成此斷面的覆寫值）。${cl ? '橫斷面圖上也可拖曳同樣的點。' : ''}</div>`;
    d.innerHTML = h + '</div>'; grdDrawMini(ks); return;
  }
  d.innerHTML = h + `<div style="color:#f59e0b;margin-top:4px;">範圍內沒有斷面${cl ? '（起迄樁號會自動加樁；請確認在中心線範圍內）' : '（請確認崩塌地基準線已畫且里程範圍正確）'}。</div></div>`;
}
let GRD_MH = [], GRD_MD = null;
function grdDrawMini(r) {
  const c = document.getElementById('grdCv'); if (!c) return; const g = c.getContext('2d'), W = c.width, H = c.height, st = r.st, xs = [], zs = [];
  ['L', 'R'].forEach(sd => { const S = r.sides[sd]; if (!S) return; S.pts.forEach(p => { xs.push(S.sg * p[0]); zs.push(p[1]); }); xs.push(S.sg * (S.day[0] + 3)); });
  if (!xs.length) return; let x0 = Math.min(0, ...xs) - 2, x1 = Math.max(0, ...xs) + 2; const gp = []; for (let a = x0; a <= x1; a += (x1 - x0) / 120) { const z = st.g(a); if (Number.isFinite(z)) { gp.push([a, z]); zs.push(z); } }
  let z0 = Math.min(...zs) - 1, z1 = Math.max(...zs) + 1; const k = Math.min((W - 20) / (x1 - x0), (H - 30) / (z1 - z0)), X = a => 10 + (a - x0) * k, Y = z => H - 18 - (z - z0) * k;
  g.fillStyle = '#0b1018'; g.fillRect(0, 0, W, H); g.strokeStyle = '#94a3b8'; g.lineWidth = 1.2; g.beginPath(); gp.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.stroke();
  ['L', 'R'].forEach(sd => { const S = r.sides[sd]; if (!S) return; g.strokeStyle = '#a3e635'; g.lineWidth = 2; g.beginPath(); S.pts.filter(p => p[0] <= S.day[0] + 1e-9).forEach((p, i) => (i ? g.lineTo(X(S.sg * p[0]), Y(p[1])) : g.moveTo(X(S.sg * p[0]), Y(p[1])))); g.stroke(); });
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(0), 4); g.lineTo(X(0), H - 14); g.stroke(); g.setLineDash([]);
  // 可拖曳控制點：基準高（中央菱形）、左右坡趾（圓點）
  GRD_MH = [{ t: 'zb', x: X(0), y: Y(r.z0), k, key: st.key }]; g.fillStyle = '#22d3ee'; g.strokeStyle = '#0b1018'; g.lineWidth = 1.2; { const x = X(0), y = Y(r.z0); g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 6, y); g.lineTo(x, y + 6); g.lineTo(x - 6, y); g.closePath(); g.fill(); g.stroke(); }
  ['L', 'R'].forEach(sd => { const S = r.sides[sd]; if (!S) return; const e = sd === 'L' ? r.p.eL : r.p.eR, x = X(S.sg * e), y = Y(r.z0); GRD_MH.push({ t: sd === 'L' ? 'eL' : 'eR', sd, sg: S.sg, x, y, k, key: st.key }); g.fillStyle = '#facc15'; g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI * 2); g.fill(); g.stroke(); });
  g.fillStyle = '#e2e8f0'; g.font = '11px "Noto Sans TC"'; g.textAlign = 'left'; g.fillText(`${st.lab}　基準高 ${grdF(r.z0)}　挖 ${grdF(r.cut)} m²　填 ${grdF(r.fill)} m²`, 8, 13);
  g.fillStyle = '#94a3b8'; g.fillText('灰：原地形　綠：整地線　◆基準高　●坡趾', 8, H - 4);
}
function grdMiniDown(ev) {
  const G = grdSel(), c = ev.target; if (!G || !GRD_MH.length) return; const rc = c.getBoundingClientRect(), mx = (ev.clientX - rc.left) * c.width / rc.width, my = (ev.clientY - rc.top) * c.height / rc.height;
  const h = GRD_MH.find(q => Math.hypot(q.x - mx, q.y - my) < 10); if (!h) return; ev.preventDefault(); pushUndoSnapshot(); GRD_MD = { h, G, c };
  const r0 = grdRes(G).R.find(q => q.st.key === h.key); GRD_MD.v0 = h.t === 'zb' ? r0.p.zb : h.t === 'eL' ? r0.p.eL : r0.p.eR;
  const mv = e => { const D = GRD_MD; if (!D) return; const rc2 = c.getBoundingClientRect(), x = (e.clientX - rc2.left) * c.width / rc2.width, y = (e.clientY - rc2.top) * c.height / rc2.height; let v;
    if (D.h.t === 'zb') v = D.v0 + (D.h.y - y) / D.h.k; else v = Math.max(0, D.v0 + D.h.sg * (x - D.h.x) / D.h.k); v = Math.round(v / (D.h.t === 'zb' ? 0.05 : 0.1)) * (D.h.t === 'zb' ? 0.05 : 0.1);
    grdOvQ(D.G, D.h.key, D.h.t, +v.toFixed(3)); D.G._r = null; const r = grdRes(D.G).R.find(q => q.st.key === D.h.key); if (r) { GRD_MH = []; grdDrawMini(r); } requestRedraw(); };
  const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); GRD_MD = null; grdRefresh(); };
  window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
}
function grdOvQ(G, key, k, v) { const o = G.ov[key] = G.ov[key] || {}; o[k] = v; if (G.link && k === 'eL') o.eR = v; }
function grdAdd(src) {
  if (src === 'dz') { const c = (state.dzCases || []).find(q => (q.bl || []).length > 1); if (!c) { alert('沒有已畫基準線的崩塌地案件。請先到「崩塌地」頁籤畫案件的基準線。'); return; }
    let Lb = 0; for (let i = 1; i < c.bl.length; i++) Lb += Math.hypot(c.bl[i][0] - c.bl[i - 1][0], c.bl[i][1] - c.bl[i - 1][1]);
    const za = typeof aclZFill === 'function' ? aclZFill(c.bl[0][0], c.bl[0][1], 6).z : 0, zb = typeof aclZFill === 'function' ? aclZFill(c.bl[c.bl.length - 1][0], c.bl[c.bl.length - 1][1], 6).z : 0;
    pushUndoSnapshot(); const G = grdNorm({ name: `${c.name}整地`, src: 'dz', dz: c.id, s0: 0, s1: +Lb.toFixed(2), side: 'L', P0: { zb: +(za || 0).toFixed(2), eL: 0, eR: 0 }, P1: { zb: +(zb || 0).toFixed(2), eL: 0, eR: 0 } }); state.grades.push(G); GRD_SEL = G.id; grdRefresh(true); return; }
  if (!(state.sections || []).length) { alert('請先建立中心線。'); return; }
  const sec = state.sections[state.selectedStaIdx] || state.sections[0], al = state.alignment, s0 = Math.max(al.startSta, Math.min(sec.sta, al.endSta - 5)), s1 = Math.min(al.endSta, s0 + 40);
  pushUndoSnapshot(); const G = grdNorm({ name: `整地${state.grades.length + 1}`, src: 'cl', rv: 'toe', s0: +s0.toFixed(2), s1: +s1.toFixed(2) }); state.grades.push(G); GRD_SEL = G.id; grdRefresh(true);
}
function grdDel() { const G = grdSel(); if (!G) return; pushUndoSnapshot(); state.grades = state.grades.filter(g => g !== G); GRD_SEL = null; grdRefresh(true); }
function grdSet(k, v) {
  const G = grdSel(); if (!G) return; pushUndoSnapshot(); const num = parseFloat(v), rb = G.src === 'cl' && (k === 's0' || k === 's1');
  if (k === 'name') G.name = String(v || '整地'); else if (k === 'side') G.side = v; else if (k === 'link') G.link = !!v; else if (k === 'rv') G.rv = ['none', 'toe', 'back'].includes(v) ? v : 'none'; else if (k === 'dz') G.dz = v; else if (k === 'tp') { if (state.grdTypes.some(t => t.id === v)) { G.tp = v; GRD_TSEL = v; } }
  else if (k.startsWith('P')) { const [P, f] = k.split('.'); if (Number.isFinite(num)) { G[P][f] = num; if (G.link && f === 'eL') G[P].eR = num; } }
  else if ((k === 's0' || k === 's1') && Number.isFinite(num) || k === 'ds' && Number.isFinite(num) && num > 0) G[k] = num;
  G._r = null; grdRefresh(rb);
}
function grdPreset(k) { const P = GRD_PRESET.find(p => p[0] === k), T = grdTyp(GRD_TSEL); if (!T || !P || !k) return; pushUndoSnapshot(); T.tiers.forEach(q => { if (P[2] !== null) { q.ncL = q.ncR = P[2]; } if (P[3] !== null) { q.nfL = q.nfR = P[3]; } }); grdRefresh(); updateStatus(`⛰ 型式「${T.name}」：套用手冊參考坡度「${P[1]}」（各階）。`); }
function grdTierTarget(kind, id) { if (kind === 'T') { const T = grdTyp(id); return { tiers: T.tiers, get rep() { return T.rep; }, set rep(v) { T.rep = v; } }; } const G = grdSel(), o = G && G.ov[id]; if (!o || !o.tiers) return null; return { tiers: o.tiers, get rep() { return o.rep !== undefined ? o.rep : true; }, set rep(v) { o.rep = v; } }; }
function grdTierSet(kind, id, i, k, v) { const T = grdTierTarget(kind, id), G = grdSel(); if (!T || !T.tiers[i]) return; const x = parseFloat(v); if (!Number.isFinite(x) || x < 0) return; pushUndoSnapshot(); const q = T.tiers[i]; q[k] = (k === 'h' && x <= 0) ? q[k] : x; if (G && G.link) { if (k === 'ncL') q.ncR = x; if (k === 'nfL') q.nfR = x; } grdRefresh(); }
function grdTierOp(kind, id, op, i) { const T = grdTierTarget(kind, id); if (!T) return; pushUndoSnapshot(); if (op === 'add') T.tiers.push(Object.assign({}, T.tiers[T.tiers.length - 1])); else if (op === 'del') { if (T.tiers.length > 1) T.tiers.splice(i, 1); } else if (op === 'rep') T.rep = !!i; grdRefresh(); }
function grdTypOp(op, v) {
  const T = grdTyp(GRD_TSEL); pushUndoSnapshot();
  if (op === 'new') { const t = grdTypNorm({ name: `${T.name.replace(/（複製）$/, '')}（複製）`, rep: T.rep, tiers: JSON.parse(JSON.stringify(T.tiers)) }); state.grdTypes.push(t); GRD_TSEL = t.id; }
  else if (op === 'name') T.name = String(v || '型式');
  else if (op === 'del') { if (state.grdTypes.length < 2) { updateStatus('⚠ 至少要保留一個型式。'); return; } const rest = state.grdTypes.filter(t => t !== T), f = rest[0].id; state.grdTypes = rest; (state.grades || []).forEach(G => { if (G.tp === T.id) G.tp = f; (G.segs || []).forEach(q => { if (q.t === T.id) q.t = f; }); Object.values(G.ov).forEach(o => { if (o.t === T.id) delete o.t; }); }); GRD_TSEL = f; }
  grdRefresh();
}
function grdSegAdd() { const G = grdSel(); if (!G) return; pushUndoSnapshot(); const a = Math.min(G.s0, G.s1), b = Math.max(G.s0, G.s1); G.segs.push({ a: +((a + b) / 2).toFixed(2), b: +b.toFixed(2), t: GRD_TSEL && state.grdTypes.some(t => t.id === GRD_TSEL) ? GRD_TSEL : G.tp }); grdRefresh(); }
function grdSegSet(i, k, v) { const G = grdSel(), q = G && G.segs[i]; if (!q) return; pushUndoSnapshot(); if (k === 't') q.t = v; else { const x = parseFloat(v); if (Number.isFinite(x)) q[k] = x; } grdRefresh(); }
function grdSegDel(i) { const G = grdSel(); if (!G) return; pushUndoSnapshot(); G.segs.splice(i, 1); grdRefresh(); }
function grdSecType(v) { const G = grdSel(); if (!G || !GRD_SECK) return; pushUndoSnapshot(); const o = G.ov[GRD_SECK] = G.ov[GRD_SECK] || {}; if (v) o.t = v; else delete o.t; if (!Object.keys(o).length) delete G.ov[GRD_SECK]; grdRefresh(); }
function grdSecCustom(on) { const G = grdSel(); if (!G || !GRD_SECK) return; pushUndoSnapshot(); const o = G.ov[GRD_SECK] = G.ov[GRD_SECK] || {};
  if (on) { const r = grdRes(G).R.find(q => q.st.key === GRD_SECK); o.tiers = JSON.parse(JSON.stringify(r.p.tiers)); o.rep = r.p.rep; } else { delete o.tiers; delete o.rep; } if (!Object.keys(o).length) delete G.ov[GRD_SECK]; grdRefresh(); }
function grdOv(key, k, v) { const G = grdSel(); if (!G) return; pushUndoSnapshot(); if (k === null) delete G.ov[key]; else { const x = parseFloat(v); if (!Number.isFinite(x)) return; grdOvQ(G, key, k, x); } G._r = null; GRD_SECK = key; grdRefresh(); }
function grdRefresh(rebuild) { GRD_OPEN = true; (state.grades || []).forEach(g => { g._r = null; }); if (rebuild) { try { rebuildAlignmentAndSections(); } catch (e) { } } grdUI(); requestRedraw(); }
function grdClean() { return (state.grades || []).map(g => { const o = Object.assign({}, g); delete o._r; delete o._k; return JSON.parse(JSON.stringify(o)); }); }
function grdExclRanges() { return (state.grades || []).filter(G => G.src === 'cl' && G.side === 'B' && G.rv !== 'back').map(G => ({ grd: G, a: Math.min(G.s0, G.s1), b: Math.max(G.s0, G.s1), name: G.name })); }   // 兩側整地範圍：全線土方「河道挖填」不重複計算（護岸基礎開挖／背填照算）
/* ---- 平面圖點選範圍、起迄把手拖曳 ---- */
function grdBl(G) { const c = grdCase(G); return (c && c.bl && c.bl.length > 1) ? c.bl : null; }
function grdChainOf(P, x, y) { let best = Infinity, out = 0, acc = 0; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-9, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (L * L))), d = Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t)); if (d < best) { best = d; out = acc + L * t; } acc += L; } return { s: out, d: best, L: acc }; }
function grdPtAt(G, s) {
  if (G.src === 'cl') { const g = getPointAndNormalAtStation(Math.max(state.alignment.startSta, Math.min(state.alignment.endSta, s))); return g ? [g.x, g.y] : null; }
  const P = grdBl(G); if (!P) return null; let acc = 0; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (acc + L >= s || i === P.length - 1) { const t = L > 1e-9 ? Math.max(0, Math.min(1, (s - acc) / L)) : 0; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; } acc += L; } return null;
}
function grdSAt(G, x, y) {   // 平面點 → 樁號（中心線）或里程（基準線）
  if (G.src === 'cl') { const pr = projectWorldPointToAlignment(x, y); return pr ? Math.max(state.alignment.startSta, Math.min(state.alignment.endSta, pr.sta)) : null; }
  const P = grdBl(G); return P ? grdChainOf(P, x, y).s : null;
}
function grdLim(G) { if (G.src === 'cl') return [state.alignment.startSta, state.alignment.endSta]; const P = grdBl(G); return [0, P ? grdChainOf(P, P[0][0], P[0][1]).L : 0]; }
function grdLab(G, s) { return G.src === 'cl' ? formatStation(s) : `${grdF(s, 1)} m`; }
function grdPick() {
  const G = grdSel(); if (!G) return; if (G.src === 'dz' && !grdBl(G)) { alert('此整地所屬的崩塌地案件沒有基準線。'); return; }
  if (state.viewMode !== '2D') setViewMode('2D'); setTool('GRD_PICK'); state.dzTool = { kind: 'grdp', gid: G.id, p0: null }; state.dzTmp = [];
  document.getElementById('hudToolTip').innerHTML = `📍【${escAttr(G.name)}】在平面圖點整地<b>起點</b>，再點<b>迄點</b>（${G.src === 'cl' ? '取中心線上最近的樁號' : '取崩塌地基準線上最近的里程'}）；Esc 取消。`;
  updateStatus(`📍 請點選「${G.name}」的起點。`);
}
if (typeof DZ_TOOLS !== 'undefined' && !DZ_TOOLS.includes('GRD_PICK')) DZ_TOOLS.push('GRD_PICK');
(function () {
  const _ck = dzClick; dzClick = function (w) {
    if (state.activeTool !== 'GRD_PICK') return _ck(w);
    const G = (state.grades || []).find(g => state.dzTool && g.id === state.dzTool.gid); if (!G) return; const s = grdSAt(G, w.x, w.y); if (s === null) return; const q = grdPtAt(G, s);
    if (state.dzTool.p0 === null) { state.dzTool.p0 = s; state.dzTmp = q ? [q] : []; updateStatus(`📍 起點 ${grdLab(G, s)}；請點迄點。`); requestRedraw(); return; }
    const a = Math.min(state.dzTool.p0, s), b = Math.max(state.dzTool.p0, s); if (b - a < 2) { updateStatus('⚠ 整地範圍太短（< 2 m），請重點迄點。'); return; }
    pushUndoSnapshot(); G.s0 = +a.toFixed(2); G.s1 = +b.toFixed(2); state.dzTmp = []; setTool('PAN'); GRD_SEL = G.id; grdRefresh(G.src === 'cl');
    updateStatus(`✅ ${G.name}：${grdLab(G, a)}～${grdLab(G, b)}（L＝${grdF(b - a, 1)} m）。可拖曳平面圖上的起、迄、中間把手微調。`);
  };
})();
let GRD_PD = null;
function grdHandles(G) { const a = Math.min(G.s0, G.s1), b = Math.max(G.s0, G.s1), A = grdPtAt(G, a), B = grdPtAt(G, b), M = grdPtAt(G, (a + b) / 2); return [A && { t: 's0', p: A, s: a }, B && { t: 's1', p: B, s: b }, M && { t: 'mid', p: M, s: (a + b) / 2 }].filter(Boolean); }
function grdDrawHandles() {
  if (state.viewMode !== '2D') return; const G = grdSel(); if (!G || !GRD_SHOWH()) return; const H = GRD_PD ? GRD_PD.H : grdHandles(G);
  ctx.save(); if (GRD_PD) { ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.setLineDash([8, 5]); ctx.beginPath(); const a = Math.min(GRD_PD.s0, GRD_PD.s1), b = Math.max(GRD_PD.s0, GRD_PD.s1); for (let k = 0; k <= 40; k++) { const p = grdPtAt(G, a + (b - a) * k / 40); if (!p) continue; const s = worldToScreen2D(p[0], p[1]); k ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); } ctx.stroke(); ctx.setLineDash([]); }
  H.forEach(h => { const s = worldToScreen2D(h.p[0], h.p[1]); ctx.fillStyle = h.t === 'mid' ? '#22d3ee' : '#facc15'; ctx.strokeStyle = '#0b1018'; ctx.lineWidth = 1.5; ctx.beginPath(); if (h.t === 'mid') { ctx.moveTo(s.x, s.y - 8); ctx.lineTo(s.x + 8, s.y); ctx.lineTo(s.x, s.y + 8); ctx.lineTo(s.x - 8, s.y); ctx.closePath(); } else ctx.rect(s.x - 6, s.y - 6, 12, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 11px "Noto Sans TC"'; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,12,18,.85)'; const t = h.t === 's0' ? `起 ${grdLab(G, h.s)}` : h.t === 's1' ? `迄 ${grdLab(G, h.s)}` : '↔ 平移'; ctx.strokeText(t, s.x + 10, s.y - 8); ctx.fillText(t, s.x + 10, s.y - 8); });
  ctx.restore();
}
function GRD_SHOWH() { const c = document.getElementById('grdCard'), tb = document.getElementById('tab-earth'); return !!(c && !c.classList.contains('folded') && c.offsetParent && tb && tb.style.display !== 'none'); }   // 整地卡片展開時才顯示把手
(function () {
  const cvXY = e => { const rc = cadCanvas.getBoundingClientRect(); return { x: e.clientX - rc.left, y: e.clientY - rc.top }; };
  window.addEventListener('mousedown', e => {
    if (state.viewMode !== '2D' || e.button !== 0 || state.activeTool !== 'PAN' || (e.target && e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay')) return; const G = grdSel(); if (!G || !GRD_SHOWH()) return;
    const m = cvXY(e); let hit = null, bd = 10; grdHandles(G).forEach(h => { const s = worldToScreen2D(h.p[0], h.p[1]), d = Math.hypot(s.x - m.x, s.y - m.y); if (d < bd) { bd = d; hit = h; } }); if (!hit) return;
    e.preventDefault(); e.stopImmediatePropagation(); pushUndoSnapshot(); const w = screenToWorld2D(m.x, m.y); GRD_PD = { G, t: hit.t, s0: G.s0, s1: G.s1, a0: Math.min(G.s0, G.s1), b0: Math.max(G.s0, G.s1), sw: grdSAt(G, w.x, w.y), H: grdHandles(G), moved: false };
    updateStatus(hit.t === 'mid' ? '↔ 拖曳整段平移（長度不變；Shift＝不吸附 1 m）。' : `↔ 拖曳整地${hit.t === 's0' ? '起點' : '迄點'}（Shift＝不吸附 1 m）。`);
  }, true);
  window.addEventListener('mousemove', e => {
    const D = GRD_PD; if (!D) return; e.stopImmediatePropagation(); const m = cvXY(e), w = screenToWorld2D(m.x, m.y), G = D.G; let s = grdSAt(G, w.x, w.y); if (s === null) return; if (!e.shiftKey) s = Math.round(s); const [lo, hi] = grdLim(G);
    let a = D.a0, b = D.b0; if (D.t === 's0') a = Math.min(s, b - 2); else if (D.t === 's1') b = Math.max(s, a + 2); else { let d = s - (e.shiftKey ? D.sw : Math.round(D.sw)); d = Math.max(lo - D.a0, Math.min(hi - D.b0, d)); a = D.a0 + d; b = D.b0 + d; }
    a = Math.max(lo, a); b = Math.min(hi, b); D.s0 = +a.toFixed(2); D.s1 = +b.toFixed(2); D.moved = true;
    D.H = [{ t: 's0', p: grdPtAt(G, a), s: a }, { t: 's1', p: grdPtAt(G, b), s: b }, { t: 'mid', p: grdPtAt(G, (a + b) / 2), s: (a + b) / 2 }].filter(h => h.p);
    updateStatus(`↔ ${G.name}：${grdLab(G, a)}～${grdLab(G, b)}（L＝${grdF(b - a, 1)} m）`); requestRedraw();
  }, true);
  window.addEventListener('mouseup', () => { const D = GRD_PD; if (!D) return; GRD_PD = null; if (!D.moved) { state.undoStack.pop(); requestRedraw(); return; } D.G.s0 = D.s0; D.G.s1 = D.s1; GRD_SEL = D.G.id; grdRefresh(D.G.src === 'cl'); updateStatus(`✅ ${D.G.name}：${grdLab(D.G, D.s0)}～${grdLab(D.G, D.s1)}（L＝${grdF(D.s1 - D.s0, 1)} m）。`); }, true);
})();
/* ---- 橫斷面圖上拖曳：基準高（菱形）、左右坡趾（圓點）→ 寫成此斷面覆寫值 ---- */
let GRD_XH = [], GRD_XD = null;
function grdXHandles(sec, sx, sy) {
  GRD_XH = GRD_XH.filter(h => h.sec !== sec); if (state.viewMode !== 'CROSS') return;
  const items = grdSecItems(sec); if (!items.length) return; const it = items.find(q => q.G.id === GRD_SEL) || items[0], G = it.G, r = it.r, k0 = sx(0), kx = (sx(1) - sx(0)) || 1, ky = (sy(r.z0 + 1) - sy(r.z0)) || -1;
  const add = (t, x, y, sg, o) => { GRD_XH.push(Object.assign({ t, x, y, sg, sec, G, key: r.st.key, k0, kx, ky, zc0: sy(r.z0), v0: t === 'zb' ? r.p.zb : t === 'eL' ? r.p.eL : t === 'eR' ? r.p.eR : 0 }, o || {})); };
  ctx.save(); ctx.strokeStyle = '#0b1018'; ctx.lineWidth = 1.2;
  { const sdz = r.sides.L ? -1 : 1, ez = (sdz < 0 ? r.p.eL : r.p.eR) || 0, x = ez > 0.4 ? sx(sdz * ez * 0.5) : sx(0) + 16, y = sy(r.z0); add('zb', x, y, 0); /* 基準高把手：底面中段（避開中心線上的設計高標記） */ ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ['L', 'R'].forEach(sd => { const S = r.sides[sd]; if (!S || S.rv === 'toe') return; const x = sx(S.sg * S.toe), y = sy(S.rv === 'back' ? S.zT : r.z0); add(sd === 'L' ? 'eL' : 'eR', x, y, S.sg, { a0: S.a0 || 0 }); ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
  // 每階台階把手：台階內角（上下拖＝該階階高）、平台外端（左右拖＝該階平台寬）
  ['L', 'R'].forEach(sd => { const S = r.sides[sd]; if (!S || !S.benches) return; const ex = S.kind === 'cut' ? 1 : -1;
    S.benches.forEach((b, i) => { const ti = i, T = r.p.tiers[Math.min(ti, r.p.tiers.length - 1)];
      const x1 = sx(S.sg * b[0][0]), y1 = sy(b[0][1]), x2 = sx(S.sg * b[1][0]), y2 = sy(b[1][1]);
      add('th', x1, y1, S.sg, { ti, kind: ex, v0: T.h }); add('tw', x2, y2, S.sg, { ti, v0: T.w });
      ctx.fillStyle = '#f472b6'; ctx.fillRect(x1 - 4.5, y1 - 4.5, 9, 9); ctx.strokeRect(x1 - 4.5, y1 - 4.5, 9, 9); ctx.fillStyle = '#c084fc'; ctx.beginPath(); ctx.arc(x2, y2, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }); });
  ctx.restore();
}
function grdTierQ(G, key, ti, f, v) {   // 此斷面自訂各階（必要時由目前型式複製、補足重複階）
  const r = grdRes(G).R.find(q => q.st.key === key); if (!r) return; const o = G.ov[key] = G.ov[key] || {};
  if (!o.tiers) { o.tiers = JSON.parse(JSON.stringify(r.p.tiers)); o.rep = r.p.rep; }
  while (o.tiers.length <= ti) o.tiers.push(Object.assign({}, o.tiers[o.tiers.length - 1]));
  if (o.rep !== false && o.tiers.length === ti + 1) o.tiers.push(Object.assign({}, o.tiers[ti]));   // 只改這一階：其後各階維持原值
  o.tiers[ti][f] = v;
}
(function () {
  const hit = ev => { const cv = document.getElementById('cadCanvas'); if (!cv || state.viewMode !== 'CROSS' || typeof camInv !== 'function') return null; const r = cv.getBoundingClientRect(), b = camInv(ev.clientX - r.left, ev.clientY - r.top); let best = null, bd = 10; GRD_XH.forEach(h => { const d = Math.hypot(b.x - h.x, b.y - h.y); if (d < bd) { bd = d; best = h; } }); return best ? { h: best, b } : null; };
  window.addEventListener('mousedown', ev => { if (ev.target.id !== 'cadCanvas' || ev.button !== 0 || state.panMode || ev.altKey) return; const r = hit(ev); if (!r) return; ev.stopImmediatePropagation(); ev.preventDefault(); pushUndoSnapshot(); GRD_XD = { h: r.h, moved: false }; GRD_SEL = r.h.G.id; GRD_SECK = r.h.key;
    updateStatus(r.h.t === 'zb' ? '↕ 拖曳整地基準高（此斷面覆寫；Shift＝不吸附）。' : r.h.t === 'th' ? `↕ 拖曳第 ${r.h.ti + 1} 階階高（此斷面自訂各階）。` : r.h.t === 'tw' ? `↔ 拖曳第 ${r.h.ti + 1} 階平台寬（此斷面自訂各階）。` : '↔ 拖曳整地坡趾位置（此斷面底寬覆寫；Shift＝不吸附）。'); }, true);
  window.addEventListener('mousemove', ev => { const cv = document.getElementById('cadCanvas');
    if (GRD_XD) { const h = GRD_XD.h, rc = cv.getBoundingClientRect(), b = camInv(ev.clientX - rc.left, ev.clientY - rc.top); let v;
      if (h.t === 'th' || h.t === 'tw') {
        if (h.t === 'th') { v = Math.max(0.5, h.v0 + h.kind * (b.y - h.y) / h.ky); if (!ev.shiftKey) v = Math.round(v / 0.1) * 0.1; } else { v = Math.max(0, h.v0 + h.sg * (b.x - h.x) / h.kx); if (!ev.shiftKey) v = Math.round(v / 0.1) * 0.1; }
        if (!GRD_XD.base) GRD_XD.base = JSON.stringify(h.G.ov[h.key] || null); else h.G.ov[h.key] = JSON.parse(GRD_XD.base) || undefined; if (!h.G.ov[h.key]) delete h.G.ov[h.key];
        grdTierQ(h.G, h.key, h.ti, h.t === 'th' ? 'h' : 'w', +v.toFixed(3)); h.G._r = null; GRD_XD.moved = true; ev.stopImmediatePropagation(); requestRedraw(); updateStatus(`第 ${h.ti + 1} 階${h.t === 'th' ? '階高' : '平台寬'} ＝ ${v.toFixed(2)} m（此斷面自訂各階）`); return; }
      if (h.t === 'zb') { v = h.v0 + (b.y - h.zc0) / h.ky; if (!ev.shiftKey) v = Math.round(v / 0.05) * 0.05; } else { v = Math.max(0, h.sg * (b.x - h.k0) / h.kx); if (!ev.shiftKey) v = Math.round(v / 0.1) * 0.1; }
      grdOvQ(h.G, h.key, h.t, +v.toFixed(3)); h.G._r = null; GRD_XD.moved = true; ev.stopImmediatePropagation(); requestRedraw(); updateStatus(`${h.t === 'zb' ? '基準高（相對設計河床）' : '坡趾距中心線'} ＝ ${v.toFixed(2)} m`); return; }
    if (ev.target.id === 'cadCanvas' && state.viewMode === 'CROSS' && !state.panDrag) { const r = hit(ev); if (r) cv.style.cursor = r.h.t === 'zb' || r.h.t === 'th' ? 'ns-resize' : 'ew-resize'; else if (cv.style.cursor === 'ns-resize' || cv.style.cursor === 'ew-resize') cv.style.cursor = ''; } }, true);
  window.addEventListener('mouseup', () => { if (!GRD_XD) return; const D = GRD_XD; GRD_XD = null; if (!D.moved) return; grdRefresh(); updateStatus(`✅ ${D.h.G.name} ${grdSecLab(D.h)}：已寫成此斷面的覆寫值（整地面板可看到黃字，↺ 清除）。`); }, true);
})();
function grdSecLab(h) { return h.sec && h.sec.staLabel ? h.sec.staLabel : ''; }
/* ---- 掛勾 ---- */
(function () {
  if (typeof dzSecCFtxt === 'function') { const _cf = dzSecCFtxt; dzSecCFtxt = function (sec, u) { try { const it = grdSecItems(sec).find(q => q.G.side === 'B') || grdSecItems(sec)[0]; if (it) return `挖:${it.r.cut.toFixed(1)}${u}  填:${it.r.fill.toFixed(1)}${u}（${it.G.name}）`; } catch (e) { } return _cf(sec, u); }; }   // 整地範圍：斷面標題挖填只顯示整地結果
  const _rb = rebuildAlignmentAndSections; rebuildAlignmentAndSections = function () { const r = _rb.apply(this, arguments); GRD_VER++; return r; };
  const _ks = rvKeyStations; rvKeyStations = function () { const o = _ks(); try { (state.grades || []).forEach(G => { if (G.src !== 'cl') return; o.push({ s: +Math.min(G.s0, G.s1).toFixed(3), ptName: `${G.name}起`, priority: 4, isCurveTick: false }); o.push({ s: +Math.max(G.s0, G.s1).toFixed(3), ptName: `${G.name}迄`, priority: 4, isCurveTick: false }); }); } catch (e) { } return o; };
  const _ha = drawHorizontalAlignmentOnCanvas; drawHorizontalAlignmentOnCanvas = function () { try { grdDrawFade(); } catch (e) { console.error('grdFade', e); } _ha.apply(this, arguments); try { grdDrawPlan(); grdDrawHandles(); } catch (e) { console.error('grdPlan', e); } };
  const _xp = rvDxfPlan; rvDxfPlan = function (D) { _xp(D); try { grdDxfPlan(D); } catch (e) { console.error('grdDxfPlan', e); } };
  const _dc = rvDrawCross; rvDrawCross = function (sec, sx, sy, isLarge) { _dc(sec, sx, sy, isLarge); try { grdDrawCross(sec, sx, sy, isLarge); } catch (e) { console.error('grdDrawCross', e); } };
  const _xc = rvDxfCross; rvDxfCross = function (D, sec, sx, sy, TH) { _xc(D, sec, sx, sy, TH); try { grdDxfCross(D, sec, sx, sy, TH); } catch (e) { console.error('grdDxfCross', e); } };
  const _ui = rvRenderUI; rvRenderUI = function () { _ui(); try { grdUI(); } catch (e) { console.error('grdUI', e); } };
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => { try { grdUI(); } catch (e) { } }, 50));
  const _bk = stQtyBook; stQtyBook = function () { const B = _bk(); let s = null; try { s = grdSheet(); } catch (e) { console.error('grdSheet', e); } if (s) { B.sheets.push(s); B.n += 1; } return B; };
  const _cp = collectProject; collectProject = function () { const o = _cp(); o.data.grades = grdClean(); o.data.grdTypes = JSON.parse(JSON.stringify(state.grdTypes)); return o; };
  const _ap = applyProject; applyProject = function (obj, fname) { state.grdTypes = ((obj && obj.data && obj.data.grdTypes) || []).map(grdTypNorm); if (!state.grdTypes.length) state.grdTypes = [GRD_T0()]; state.grades = ((obj && obj.data && obj.data.grades) || []).map(grdNorm); GRD_SEL = null; GRD_TSEL = null; _ap(obj, fname); try { grdUI(); } catch (e) { } };
  const _pu = pushUndoSnapshot; pushUndoSnapshot = function () { _pu(); try { const n = state.undoStack.length - 1, o = JSON.parse(state.undoStack[n]); o.grades = grdClean(); o.grdTypes = JSON.parse(JSON.stringify(state.grdTypes)); state.undoStack[n] = JSON.stringify(o); } catch (e) { } };
  const _un = undoLastAction; undoLastAction = function () { let gr = null, gt = null; try { const t = state.undoStack[state.undoStack.length - 1]; gr = t ? JSON.parse(t).grades : null; gt = t ? JSON.parse(t).grdTypes : null; } catch (e) { } _un(); if (gr) { if (gt && gt.length) state.grdTypes = gt.map(grdTypNorm); state.grades = gr.map(grdNorm); grdRefresh(true); } };
})();
