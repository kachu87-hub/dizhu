/* ============================================================================
   v5.9 排水溝（表 2-4 編號 15）
   兩種放法：
     A 沿中心線一側：中心線左右岸＋起訖樁號＋中心偏距 e；溝底依「設計線＋Δz」或「溝頂齊地面（下 Δz）」
     B 獨立基線：平面圖自畫折線（BP→EP）；溝底依「起點溝底高＋縱坡 %」或「溝頂齊地面（下 Δz）」
   斷面：矩形溝（RC）、U 型溝（預鑄）、梯形溝（混凝土／漿砌石襯砌）
   開挖：底＝溝體底（含墊層）−0.1 m，兩側各留 0.1 m，再以 1:ec 往上至地面；回填＝開挖−溝體外形（概估）
   ============================================================================ */
state.dns = []; state.dnSel = -1;
const DN_TYPES = {
  rect: { label: '矩形溝（RC）', code: '標準斷面', mat: ['鋼筋混凝土'], p: { B: 0.6, H: 0.6, t: 0.15, tb: 0.15, m: 0, pad: 0.1, lm: 'conc' } },
  u: { label: 'U 型溝（預鑄）', code: '標準斷面', mat: ['預鑄混凝土'], p: { B: 0.4, H: 0.4, t: 0.08, tb: 0.08, m: 0, pad: 0.1, lm: 'conc' } },
  trap: { label: '梯形溝（襯砌）', code: '標準斷面', mat: ['混凝土／漿砌石'], p: { B: 0.5, H: 0.6, t: 0.15, tb: 0.15, m: 1, pad: 0.1, lm: 'conc' } }
};
const DN_ORDER = ['rect', 'u', 'trap'];
const DN_COL = '#22d3ee';
const dnF = (v, d = 2) => (Number.isFinite(+v) ? (+v).toFixed(d) : '—');
function dnClId() { const c = state.cls && state.cls[state.clCur]; return c ? c.id : 'C0'; }
function dnOn(d) { return d.mode === 'B' || d.cl === dnClId(); }   // A：只屬於建立時的中心線
function dnNorm(o) {
  const T = DN_TYPES[o.type] ? o.type : 'rect';
  return { id: o.id || ('D' + Math.random().toString(36).slice(2, 7)), name: o.name || '排水溝', mode: o.mode === 'B' ? 'B' : 'A', type: T, p: Object.assign({}, DN_TYPES[T].p, o.p || {}), ec: o.ec ?? 0.3,
    cl: o.cl || 'C0', side: o.side === 'R' ? 'R' : 'L', s0: +o.s0 || 0, s1: +o.s1 || 0, e: o.e ?? 10, ref: o.ref || (o.mode === 'B' ? 'ground' : 'design'), dz: +o.dz || 0,
    q: Number.isFinite(+o.q) && o.q !== null && o.q !== '' ? +o.q : null, nv: Number.isFinite(+o.nv) && o.nv !== null && o.nv !== '' ? +o.nv : null, pts: Array.isArray(o.pts) ? o.pts.map(q => [+q[0], +q[1]]) : [], z0: o.z0 ?? null, sl: o.sl ?? 2 };
}
function dnClean(d) { const o = Object.assign({}, d); delete o._k; return JSON.parse(JSON.stringify(o)); }


/* ---- v6.2 通水檢核（水保手冊 2.18：Q=A·V、曼寧；流速 >0.8 m/s 防淤積、混凝土 ≤6.1 m/s；出水高＝設計水深 25%、最小 20 cm） ---- */
function dnN(d) { return d.nv || (d.p.lm === 'stone' ? 0.020 : 0.015); }   // 混凝土 0.015（抹光 0.013～用板刮平 0.015）；漿砌石 0.020（表工2-18-1）
function dnHydGeom(d, h) { const S = d.p, B = +S.B, m = d.type === 'trap' ? +S.m : 0, A = (B + m * h) * h, P = B + 2 * h * Math.sqrt(1 + m * m); return { A, P, R: A / P }; }
function dnQAt(d, h, S) { const g = dnHydGeom(d, h); return g.A / dnN(d) * Math.pow(g.R, 2 / 3) * Math.sqrt(Math.max(S, 0)); }
function dnHydCheck(d) {
  if (!d.q || !(d.q > 0)) return null; const c = dnCalc(d); if (!c || !Number.isFinite(c.smin)) return null; const H = dnSec(d).H, Q = d.q;
  const hN = S => { if (!(S > 1e-6)) return NaN; let lo = 0, hi = 20; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; dnQAt(d, m, S) < Q ? lo = m : hi = m; } return (lo + hi) / 2; };
  const Smin = c.smin / 100, Smax = c.smax / 100, h1 = hN(Smin), h2 = hN(Smax);
  const V = (h) => Number.isFinite(h) ? Q / dnHydGeom(d, h).A : NaN, fb = h => Math.max(0.25 * h, 0.2);
  const hc = Math.min(H / 1.25, H - 0.2), Qcap = Smin > 1e-6 ? dnQAt(d, Math.max(hc, 0), Smin) : 0;
  const o = { Q, n: dnN(d), Smin: c.smin, Smax: c.smax, h: h1, V1: V(h1), V2: V(h2), fb: Number.isFinite(h1) ? fb(h1) : NaN, Qcap, H, msg: [] };
  if (!(Smin > 1e-6)) o.msg.push('最小縱坡 ≤0，無法以曼寧計算（請確認溝底下降方向）');
  else {
    if (h1 + o.fb > H + 1e-9) o.msg.push(`通水能力不足：設計水深 ${h1.toFixed(2)} m＋出水高 ${o.fb.toFixed(2)} m 超過溝深 ${H.toFixed(2)} m（滿足出水高的容許流量 ${Qcap.toFixed(3)} cms）`);
    if (o.V1 < 0.8 - 1e-9) o.msg.push(`最小坡段流速 ${o.V1.toFixed(2)} m/s 小於 0.8 m/s，易淤積`);
    if (o.V2 > 6.1 + 1e-9) o.msg.push(`最大坡段流速 ${o.V2.toFixed(2)} m/s 超過混凝土容許 6.1 m/s，宜設跌水或消能`);
  }
  o.ok = !o.msg.length; return o;
}

/* ---- 斷面（局部座標：x 以溝中心為 0，z 以溝底為 0） ---- */
function dnSec(d) {
  const p = d.p, B = Math.max(0.05, +p.B), H = Math.max(0.05, +p.H), t = Math.max(0.02, +p.t), tb = Math.max(0.02, +p.tb), m = d.type === 'trap' ? Math.max(0, +p.m) : 0;
  if (d.type === 'trap') {
    const k = Math.sqrt(1 + m * m), dx = t * (k - m) /* 外緣水平外移量（底角處） */;
    const inner = [[-B / 2 - m * H, H], [-B / 2, 0], [B / 2, 0], [B / 2 + m * H, H]];
    const outer = [[B / 2 + m * H + t * k, H], [B / 2 + dx, -t], [-B / 2 - dx, -t], [-B / 2 - m * H - t * k, H]];
    const lin = inner.concat(outer), A = t * (B + 2 * H * k), Wb = B + 2 * dx, Wt = B + 2 * m * H + 2 * t * k;
    return { polys: [lin], inner, A, Wb, Wt, zb: -t, H, B, m, t, tb: t, k, voidA: (B + m * H) * H, outA: (Wb + Wt) / 2 * (H + t) };
  }
  const W = B + 2 * t, P = [[-W / 2, -tb], [W / 2, -tb], [W / 2, H], [B / 2, H], [B / 2, 0], [-B / 2, 0], [-B / 2, H], [-W / 2, H]];
  return { polys: [P], inner: [[-B / 2, H], [-B / 2, 0], [B / 2, 0], [B / 2, H]], A: W * (H + tb) - B * H, Wb: W, Wt: W, zb: -tb, H, B, m: 0, t, tb, voidA: B * H, outA: W * (H + tb) };
}
function dnArea(d, D) {   // D＝地面在溝底以上的高度 → 每公尺開挖、回填、墊層
  const S = dnSec(d), pad = Math.max(0, +d.p.pad || 0), fl = S.zb - pad - 0.1, W0 = S.Wb + 0.2, ec = Math.max(0, d.ec), sl = d.type === 'trap' ? Math.max(ec, S.m) : ec;
  const h = Math.max(0, D - fl), ex = (W0 + sl * h) * h;
  const top = Math.max(S.zb, Math.min(D, S.H)), Wo = S.Wb + (S.Wt - S.Wb) * (top - S.zb) / Math.max(1e-6, S.H - S.zb), body = (S.Wb + Wo) / 2 * (top - S.zb);
  const bf = D > fl ? Math.max(0, ex - body - pad * (S.Wb + 0.2) - 0.1 * W0) : 0;
  return { ex, bf, padA: pad * (S.Wb + 0.2), lev: 0.1 * W0, fl, W0, sl, h };
}

/* ---- 沿線取樣：{s, x, y, nx, ny, zi（溝底）, zg（地面）} ---- */
function dnLen(d) { return d.mode === 'B' ? (typeof dzPolyLen === 'function' ? dzPolyLen(d.pts) : 0) : Math.max(0, d.s1 - d.s0); }
function dnAt(d, s) {   // A：s＝中心線樁號；B：s＝基線里程
  const S = dnSec(d);
  if (d.mode === 'B') {
    if (d.pts.length < 2) return null; const g = dzBlAt(d.pts, s); if (!g) return null; const zg = dzZn(g.x, g.y);
    let zi = d.ref === 'slope' ? (d.z0 !== null && d.z0 !== '' && Number.isFinite(+d.z0) ? +d.z0 : (Number.isFinite(dzZn(d.pts[0][0], d.pts[0][1])) ? dzZn(d.pts[0][0], d.pts[0][1]) - S.H : NaN)) - (+d.sl || 0) / 100 * s : zg - d.dz - S.H;
    return { s, x: g.x, y: g.y, nx: g.nx, ny: g.ny, ux: g.ux, uy: g.uy, zi, zg };
  }
  const g = getPointAndNormalAtStation(s); if (!g) return null; const sg = rvSgS(d.side), x = g.x - g.nx * sg * d.e, y = g.y - g.ny * sg * d.e;
  let zg = typeof dzZn === 'function' ? dzZn(x, y) : NaN;
  const zi = d.ref === 'ground' && Number.isFinite(zg) ? zg - d.dz - S.H : getDesignZ(s) + d.dz;
  return { s, x, y, nx: g.nx * sg, ny: g.ny * sg, ux: g.tx, uy: g.ty, zi, zg };
}
function dnSamples(d, step) {
  const L = dnLen(d); if (!(L > 0.05)) return []; const a = d.mode === 'B' ? 0 : d.s0, n = Math.max(1, Math.ceil(L / (step || 1))), out = [];
  for (let i = 0; i <= n; i++) { const q = dnAt(d, a + L * i / n); if (q) out.push(q); }
  return out;
}
function dnCalc(d) {
  const key = JSON.stringify([dnClean(d), RV_ZVER || 0, (state.points || []).length, state.alignment && state.alignment.totalLength, (state.profile.vips || []).length, dnClId()]);
  if (d._k && d._k.key === key) return d._k.v;
  const S = dnSec(d), Q = dnSamples(d, 1), L = dnLen(d); let ex = 0, bf = 0, padV = 0, lev = 0, dmin = Infinity, dmax = -Infinity, nG = 0, smin = Infinity, smax = -Infinity;
  for (let i = 0; i < Q.length; i++) {
    const q = Q[i], D = Number.isFinite(q.zg) ? q.zg - q.zi : S.H; if (Number.isFinite(q.zg)) nG++;
    const a = dnArea(d, D), w = (i === 0 || i === Q.length - 1 ? 0.5 : 1) * (Q.length > 1 ? L / (Q.length - 1) : 0);
    ex += a.ex * w; bf += a.bf * w; padV += a.padA * w; lev += a.lev * w; dmin = Math.min(dmin, D); dmax = Math.max(dmax, D);
    if (i) { const ds = Q[i].s - Q[i - 1].s, g = ds > 1e-6 ? (Q[i - 1].zi - Q[i].zi) / ds * 100 : 0; smin = Math.min(smin, g); smax = Math.max(smax, g); }
  }
  const v = { L, S, ex, bf, pad: padV, lev, conc: d.type === 'u' ? 0 : S.A * L, form: d.type === 'rect' ? (2 * S.H + 2 * (S.H + S.tb)) * L : d.type === 'trap' ? 0 : 0, dmin, dmax, nG, n: Q.length, smin, smax, zi0: Q.length ? Q[0].zi : NaN, zi1: Q.length ? Q[Q.length - 1].zi : NaN };
  d._k = { key, v }; return v;
}
function dnRows(d) {
  const c = dnCalc(d), T = DN_TYPES[d.type], S = c.S, rows = [];
  rows.push({ it: '排水溝長度', u: 'm', v: c.L, fx: d.mode === 'B' ? '基線長' : `${formatStation(d.s0)}～${formatStation(d.s1)}` });
  if (d.type === 'u') rows.push({ it: `預鑄 U 型溝 內寬 ${dnF(S.B * 100, 0)}×內高 ${dnF(S.H * 100, 0)} cm`, u: 'm', v: c.L, fx: '依長度' });
  else if (d.type === 'trap' && d.p.lm === 'stone') rows.push({ it: '漿砌石襯砌', u: 'm³', v: c.conc, fx: `襯砌面積 ${dnF(S.A, 3)} m²/m × 長` });
  else rows.push({ it: d.type === 'trap' ? '混凝土襯砌' : '鋼筋混凝土', u: 'm³', v: c.conc, fx: `斷面積 ${dnF(S.A, 3)} m²/m × 長` });
  if (d.type === 'rect') rows.push({ it: '模板', u: 'm²', v: c.form, fx: '內側 2H＋外側 2(H+底板)' });
  if (c.pad > 0) rows.push({ it: '碎石級配墊層', u: 'm³', v: c.pad, fx: `厚 ${dnF(d.p.pad * 100, 0)} cm × 寬(外寬＋0.2)` });
  rows.push({ it: '開挖（依地形，概估）', u: 'm³', v: c.ex, fx: `底＝溝底−墊層−0.1 m、兩側各留 0.1 m、1:${dnF(d.type === 'trap' ? Math.max(d.ec, S.m) : d.ec)} 至地面；有地形 ${c.nG}/${c.n} 點` });
  rows.push({ it: '回填（概估）', u: 'm³', v: c.bf, fx: '開挖−溝體外形−墊層' });
  return rows;
}

/* ---- 平面圖 ---- */
function dnPlanLines(d) {   // [{pts, k:'o'|'i'}]
  const Q = dnSamples(d, d.mode === 'B' ? 0.5 : Math.max(0.5, dnLen(d) / 400)), S = dnSec(d); if (Q.length < 2) return [];
  const off = o => Q.map(q => [q.x + q.nx * o, q.y + q.ny * o]), wo = S.Wt / 2, wi = (S.B + 2 * S.m * S.H) / 2;
  return [{ pts: off(wo), k: 'o' }, { pts: off(-wo), k: 'o' }, { pts: off(wi), k: 'i' }, { pts: off(-wi), k: 'i' }, { pts: Q.map(q => [q.x, q.y]), k: 'c' }];
}
function dnDrawPlan() {
  if (state.viewMode !== '2D' || (typeof ST_NOPK !== 'undefined' && ST_NOPK)) return;
  state.dns.forEach((d, i) => {
    if (!dnOn(d)) return; const L = dnPlanLines(d); if (!L.length) return; const sel = i === state.dnSel;
    ctx.save();
    L.forEach(l => { ctx.strokeStyle = DN_COL; ctx.lineWidth = l.k === 'o' ? (sel ? 2.4 : 1.5) : 0.9; ctx.setLineDash(l.k === 'i' ? [4, 3] : l.k === 'c' ? [10, 4, 2, 4] : []); if (l.k === 'c') ctx.strokeStyle = 'rgba(34,211,238,.55)';
      ctx.beginPath(); l.pts.forEach((p, k) => { const s = worldToScreen2D(p[0], p[1]); k ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); }); ctx.stroke(); });
    ctx.setLineDash([]); const c = L[4].pts, m = c[Math.floor(c.length / 2)], m2 = c[Math.min(c.length - 1, Math.floor(c.length / 2) + 1)], s = worldToScreen2D(m[0], m[1]), s2 = worldToScreen2D(m2[0], m2[1]);
    let an = Math.atan2(s2.y - s.y, s2.x - s.x); if (an > Math.PI / 2) an -= Math.PI; if (an < -Math.PI / 2) an += Math.PI;
    ctx.translate(s.x, s.y); ctx.rotate(an); ctx.fillStyle = DN_COL; ctx.font = `${sel ? 'bold ' : ''}11px "Noto Sans TC"`; ctx.textAlign = 'center'; ctx.fillText(`${d.name}（${DN_TYPES[d.type].label}）`, 0, -8);
    ctx.restore();
    const q0 = c[0], q1 = c[c.length - 1], a0 = worldToScreen2D(q0[0], q0[1]), a1 = worldToScreen2D(q1[0], q1[1]);   // 流向：溝底高→低
    const C = dnCalc(d); if (Number.isFinite(C.zi0) && Number.isFinite(C.zi1) && Math.abs(C.zi0 - C.zi1) > 1e-3) { const [p, q] = C.zi0 > C.zi1 ? [c[c.length - 2], q1] : [c[1], q0], P = worldToScreen2D(p[0], p[1]), Qs = worldToScreen2D(q[0], q[1]), ang = Math.atan2(Qs.y - P.y, Qs.x - P.x);
      ctx.save(); ctx.fillStyle = DN_COL; ctx.translate(Qs.x, Qs.y); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -4); ctx.lineTo(-10, 4); ctx.closePath(); ctx.fill(); ctx.restore(); }
    void a0; void a1;
  });
}
function dnDxfPlan(D) {
  state.dns.forEach(d => {
    if (!dnOn(d)) return; if (d.mode === 'B' && state.clCur !== 0 && clMulti()) return;
    const L = dnPlanLines(d); if (!L.length) return;
    L.forEach(l => D.poly(l.pts, 'DN_DRAIN', 4, 0, false, l.k === 'o' ? undefined : 'DASHED'));
    const c = L[4].pts, m = c[Math.floor(c.length / 2)], m2 = c[Math.min(c.length - 1, Math.floor(c.length / 2) + 1)]; let an = Math.atan2(m2[1] - m[1], m2[0] - m[0]) * 180 / Math.PI; if (an > 90) an -= 180; if (an < -90) an += 180;
    D.text(m[0], m[1] + 1, 1.0, `${d.name}（${DN_TYPES[d.type].label}）`, 'DN_TEXT', 4, { align: 'c', rot: an });
  });
}

/* ---- 橫斷面（A，所在中心線的斷面） ---- */
function dnSecItems(sec) {
  const out = []; state.dns.forEach(d => { if (d.mode !== 'A' || !dnOn(d) || sec.sta < Math.min(d.s0, d.s1) - 1e-3 || sec.sta > Math.max(d.s0, d.s1) + 1e-3) return; const q = dnAt(d, sec.sta); if (!q || !Number.isFinite(q.zi)) return;
    const sg = rvSgS(d.side), a0 = sg * d.e, S = dnSec(d), zg = secInterp(sec, a0, 'groundZ'), A = dnArea(d, Number.isFinite(zg) ? zg - q.zi : S.H);
    const X = x => a0 + x * (sg < 0 ? -1 : 1);
    const tr = Number.isFinite(zg) && zg > q.zi + A.fl ? [[X(-A.W0 / 2 - A.sl * (zg - q.zi - A.fl)), zg], [X(-A.W0 / 2), q.zi + A.fl], [X(A.W0 / 2), q.zi + A.fl], [X(A.W0 / 2 + A.sl * (zg - q.zi - A.fl)), zg]] : null;
    out.push({ d, polys: S.polys.map(P => P.map(p => [X(p[0]), q.zi + p[1]])), tr, a0, zi: q.zi, top: q.zi + S.H }); });
  return out;
}
function dnDrawCross(sec, sx, sy, isLarge) {
  dnSecItems(sec).forEach(K => {
    ctx.save(); ctx.setLineDash([]);
    if (K.tr) { ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = isLarge ? 1 : 0.7; ctx.setLineDash([6, 4]); ctx.beginPath(); K.tr.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1])))); ctx.stroke(); ctx.setLineDash([]); }
    K.polys.forEach(P => { ctx.fillStyle = 'rgba(34,211,238,.18)'; ctx.strokeStyle = DN_COL; ctx.lineWidth = isLarge ? 1.6 : 1.1; ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1])))); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    if (isLarge) { ctx.fillStyle = DN_COL; ctx.font = '11px "Noto Sans TC","JetBrains Mono"'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(`${K.d.name} 溝底 ${dnF(K.zi)}`, sx(K.a0), sy(K.top) - 4); }
    ctx.restore();
  });
}
function dnDxfCross(D, sec, sx, sy, TH) {
  dnSecItems(sec).forEach(K => {
    if (K.tr) D.poly(K.tr.map(p => [sx(p[0]), sy(p[1])]), 'DN_EXC', 6, 0, false, 'DASHED');
    K.polys.forEach(P => D.poly(P.map(p => [sx(p[0]), sy(p[1])]), 'DN_DRAIN', 4, 0, true));
    D.text(sx(K.a0), sy(K.top) + TH * 0.4, TH * 0.75, `${K.d.name} 溝底 ${dnF(K.zi)}`, 'DN_TEXT', 4, { align: 'c', valign: 'b' });
  });
}
/* ---- 縱斷面（A：溝底線） ---- */
function dnProfLines(minSta, maxSta) {
  const out = []; state.dns.forEach(d => { if (d.mode !== 'A' || !dnOn(d)) return; const Q = dnSamples(d, Math.max(0.5, dnLen(d) / 300)).filter(q => q.s >= minSta - 1e-6 && q.s <= maxSta + 1e-6 && Number.isFinite(q.zi)); if (Q.length > 1) out.push({ d, pts: Q.map(q => [q.s, q.zi]) }); });
  return out;
}
function dnDrawProfile(sx, sy, minSta, maxSta) {
  dnProfLines(minSta, maxSta).forEach((l, k) => { ctx.save(); ctx.strokeStyle = DN_COL; ctx.lineWidth = 1.3; ctx.setLineDash([8, 3, 2, 3]); ctx.beginPath(); l.pts.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1])))); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = DN_COL; ctx.font = '10.5px "Noto Sans TC"'; ctx.textAlign = 'left'; ctx.fillText(`${l.d.name} 溝底（${l.d.side === 'L' ? '左' : '右'}側）`, sx(l.pts[0][0]) + 4, sy(l.pts[0][1]) + 12 + k * 11); ctx.restore(); });
}
function dnDxfProfile(D, X, Y, minSta, maxSta, th) {
  dnProfLines(minSta, maxSta).forEach(l => { D.poly(l.pts.map(p => [X(p[0]), Y(p[1])]), 'DN_DRAIN', 4, 0, false, 'DASHED'); D.text(X(l.pts[0][0]) + th * 0.4, Y(l.pts[0][1]) - th * 1.2, th * 0.8, `${l.d.name} 溝底`, 'DN_TEXT', 4); });
}

/* ---- 縱斷剖面圖（面板／B 用）：地面線、溝頂、溝底 ---- */
function dnProfDraw(cv, d) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, Q = dnSamples(d, Math.max(0.5, dnLen(d) / 200)), S = dnSec(d), a = d.mode === 'B' ? 0 : d.s0;
  g.fillStyle = '#0b1220'; g.fillRect(0, 0, W, H); if (Q.length < 2) { g.fillStyle = '#94a3b8'; g.font = '12px sans-serif'; g.fillText('尚無資料', 10, 20); return; }
  const zs = []; Q.forEach(q => { [q.zg, q.zi, q.zi + S.H].forEach(z => { if (Number.isFinite(z)) zs.push(z); }); }); if (!zs.length) return;
  let z0 = Math.min(...zs), z1 = Math.max(...zs); const pd = (z1 - z0) * 0.1 + 0.3; z0 -= pd; z1 += pd; const L = dnLen(d), ml = 44, mb = 22, mt = 16;
  const X = s => ml + (s - a) / (L || 1) * (W - ml - 10), Y = z => H - mb - (z - z0) / (z1 - z0) * (H - mb - mt);
  g.strokeStyle = '#1e293b'; g.fillStyle = '#64748b'; g.font = '10px sans-serif'; const zt = Math.pow(10, Math.floor(Math.log10((z1 - z0) / 4))) || 1;
  for (let z = Math.ceil(z0 / zt) * zt; z <= z1; z += zt) { g.beginPath(); g.moveTo(ml, Y(z)); g.lineTo(W - 10, Y(z)); g.stroke(); g.fillText(z.toFixed(zt < 1 ? 1 : 0), 4, Y(z) + 3); }
  const st = L > 200 ? 50 : L > 60 ? 10 : 5; for (let v = 0; v <= L + 1e-6; v += st) g.fillText(formatStation(a + v), X(a + v) - 14, H - 6);
  const line = (f, col, dash) => { g.strokeStyle = col; g.setLineDash(dash || []); g.lineWidth = 1.4; g.beginPath(); let on = false; Q.forEach(q => { const z = f(q); if (!Number.isFinite(z)) { on = false; return; } on ? g.lineTo(X(q.s), Y(z)) : g.moveTo(X(q.s), Y(z)); on = true; }); g.stroke(); g.setLineDash([]); };
  line(q => q.zg, '#e2e8f0'); line(q => q.zi + S.H, 'rgba(34,211,238,.6)', [4, 3]); line(q => q.zi, DN_COL);
  g.fillStyle = '#7dd3fc'; g.font = 'bold 11px sans-serif'; g.fillText(`${d.name}　白＝地面　實線＝溝底　虛線＝溝頂`, ml + 4, 12);
}

/* ---- 面板 ---- */
function dnAdd(mode, type) {
  type = DN_TYPES[type] ? type : (state.dnPickType || 'rect');
  if (mode === 'A' && !(state.alignment && state.alignment.segments && state.alignment.segments.length)) { alert('請先建立中心線。'); return; }
  pushUndoSnapshot(); let k = 1; while (state.dns.some(d => d.name === '排水溝' + k)) k++;
  const al = state.alignment || {}, W = parseFloat((document.getElementById('desWidth') || {}).value) || 10;
  const d = dnNorm({ name: '排水溝' + k, mode, type, cl: dnClId(), side: 'L', s0: +(al.startSta || 0).toFixed(2), s1: +(al.endSta || 0).toFixed(2), e: +(W / 2 + 3).toFixed(2), ref: mode === 'A' ? 'design' : 'ground', dz: mode === 'A' ? 0 : 0 });
  if (mode === 'A') { d.ref = 'ground'; }
  state.dns.push(d); state.dnSel = state.dns.length - 1;
  if (mode === 'B') { dnPanelUI(); dnStartBl(); return; }
  dnPanelUI(); requestRedraw(); updateStatus(`✅ 已新增「${d.name}」沿中心線${d.side === 'L' ? '左' : '右'}側，偏距 ${dnF(d.e)} m；可在「排水」頁籤改起訖樁號、偏距與斷面。`);
}
function dnStartBl() {
  const d = state.dns[state.dnSel]; if (!d || d.mode !== 'B') return; if (state.viewMode !== '2D') setViewMode('2D');
  setTool('DN_BL'); state.dzTool = { kind: 'dn', did: d.id }; state.dzTmp = [];
  document.getElementById('hudToolTip').innerHTML = `🟦【排水溝基線：${escAttr(d.name)}】依序點選起點→轉折點…→終點（水流方向不拘，依溝底高低自動判斷），右鍵／Enter／雙擊結束；Backspace 退回上一點；Esc 取消。`;
  updateStatus(`🟦 請在平面圖點選「${d.name}」的基線。`);
}
function dnDel(i) { const d = state.dns[i]; if (!d || !confirm(`刪除「${d.name}」？`)) return; pushUndoSnapshot(); state.dns.splice(i, 1); state.dnSel = Math.min(state.dnSel, state.dns.length - 1); dnPanelUI(); requestRedraw(); }
function dnSet(f, v) {
  const d = state.dns[state.dnSel]; if (!d) return; pushUndoSnapshot();
  if (f === 'name') d.name = String(v).trim() || d.name;
  else if (f === 'type') { d.type = DN_TYPES[v] ? v : d.type; d.p = Object.assign({}, DN_TYPES[d.type].p); }
  else if (f === 'side' || f === 'ref') d[f] = v;
  else if (f.startsWith('p.')) { const k = f.slice(2); if (k === 'lm') d.p.lm = v; else { const x = parseFloat(v); if (Number.isFinite(x)) d.p[k] = Math.max(0, x) / (['B', 'H', 't', 'tb', 'pad'].includes(k) ? 100 : 1); } }
  else { const x = parseFloat(v); if (Number.isFinite(x)) { d[f] = x; if (f === 's0' || f === 's1') { const al = state.alignment; d[f] = Math.max(al.startSta, Math.min(al.endSta, x)); } } }
  if (f === 'z0' && (v === '' || v === null)) d.z0 = null;
  if (f === 'q' || f === 'nv') { const x = parseFloat(v); d[f] = Number.isFinite(x) && x > 0 ? x : null; }
  d._k = null; dnPanelUI(); requestRedraw();
}
function dnPanelUI() {
  const box = document.getElementById('dnPanel'); if (!box) return;
  if (box.contains(document.activeElement) && ['INPUT', 'SELECT'].includes(document.activeElement.tagName) && document.activeElement.type !== 'checkbox') return;
  const D = state.dns, d = D[state.dnSel];
  const rows = D.map((q, i) => { const c = dnOn(q) ? dnCalc(q) : null; return `<tr onclick="state.dnSel=${i};dnPanelUI();requestRedraw();" style="cursor:pointer;${i === state.dnSel ? 'background:rgba(34,211,238,.14);' : ''}${dnOn(q) ? '' : 'opacity:.5;'}"><td>${escAttr(q.name)}</td><td>${q.mode === 'A' ? '沿中心線' : '獨立基線'}</td><td>${DN_TYPES[q.type].label}</td><td style="text-align:right;">${c ? dnF(c.L, 1) : '其他中心線'}</td><td><button class="btn" style="padding:1px 6px;" onclick="event.stopPropagation();dnDel(${i})">✕</button></td></tr>`; }).join('');
  let det = '';
  if (d) {
    const c = dnOn(d) ? dnCalc(d) : null, p = d.p, cm = v => dnF(v * 100, 0), inp = (f, v, st, w) => `<input type="number" class="input-num" style="width:${w || 70}px;" step="${st}" value="${v}" onchange="dnSet('${f}',this.value)">`;
    const lab = (t, h, tip) => `<label style="display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:11px;"${tip ? ` title="${escAttr(tip)}"` : ''}><span>${t}</span>${h}</label>`;
    const sec = DN_TYPES[d.type].orig ? dn2Fields(d, lab, inp) : [lab('斷面型式', `<select class="input-select" style="width:140px;" onchange="dnSet('type',this.value)">${DN_ORDER.map(k => `<option value="${k}"${k === d.type ? ' selected' : ''}>${DN_TYPES[k].label}</option>`).join('')}</select>`),
      lab(d.type === 'trap' ? '底寬 b (cm)' : '內寬 B (cm)', inp('p.B', cm(p.B), 5)), lab(d.type === 'trap' ? '溝深 H (cm)' : '內高 H (cm)', inp('p.H', cm(p.H), 5)),
      lab(d.type === 'trap' ? '襯砌厚 t (cm)' : '側壁厚 t (cm)', inp('p.t', cm(p.t), 1))].concat(d.type === 'trap' ? [lab('側坡 1:m', inp('p.m', p.m, 0.1)), lab('襯砌材料', `<select class="input-select" style="width:100px;" onchange="dnSet('p.lm',this.value)"><option value="conc"${p.lm !== 'stone' ? ' selected' : ''}>混凝土</option><option value="stone"${p.lm === 'stone' ? ' selected' : ''}>漿砌石</option></select>`)] : [lab('底板厚 (cm)', inp('p.tb', cm(p.tb), 1))])
      .concat([lab('碎石墊層厚 (cm)', inp('p.pad', cm(p.pad), 5)), lab('開挖坡 1:n', inp('ec', d.ec, 0.05))]);
    const pos = d.mode === 'A' ? [lab('岸別', `<select class="input-select" style="width:90px;" onchange="dnSet('side',this.value)"><option value="L"${d.side === 'L' ? ' selected' : ''}>左側</option><option value="R"${d.side === 'R' ? ' selected' : ''}>右側</option></select>`, '面向中心線前進方向（里程增加）'),
      `<button class="btn${state.activeTool === 'DN_PICK' ? ' active' : ''}" onclick="dnStartPick()" title="在平面圖依序點起點、迄點；第一點同時決定岸別與溝中心偏距">📍 圖面點選起訖點（含岸別、偏距）</button>`, lab('起點樁號 (m)', inp('s0', dnF(d.s0), 1, 84)), lab('迄點樁號 (m)', inp('s1', dnF(d.s1), 1, 84)), lab('溝中心偏距 e (m)', inp('e', dnF(d.e), 0.5), '中心線到溝中心的水平距離'),
      lab('溝底高程依據', `<select class="input-select" style="width:150px;" onchange="dnSet('ref',this.value)"><option value="ground"${d.ref === 'ground' ? ' selected' : ''}>溝頂齊地面</option><option value="design"${d.ref === 'design' ? ' selected' : ''}>中心設計線＋Δz</option></select>`),
      lab(d.ref === 'ground' ? '溝頂低於地面 Δz (m)' : '溝底＝設計線＋Δz (m)', inp('dz', dnF(d.dz), 0.1))]
      : [lab('溝底高程依據', `<select class="input-select" style="width:150px;" onchange="dnSet('ref',this.value)"><option value="ground"${d.ref === 'ground' ? ' selected' : ''}>溝頂齊地面</option><option value="slope"${d.ref === 'slope' ? ' selected' : ''}>起點溝底高＋縱坡</option></select>`)]
        .concat(d.ref === 'slope' ? [lab('起點溝底高 (m)', `<input type="number" class="input-num" style="width:84px;" step="0.1" value="${d.z0 ?? ''}" placeholder="地面−H" onchange="dnSet('z0',this.value)">`), lab('縱坡 % (往終點下降為正)', inp('sl', dnF(d.sl), 0.5))] : [lab('溝頂低於地面 Δz (m)', inp('dz', dnF(d.dz), 0.1))])
        .concat([`<button class="btn${state.activeTool === 'DN_BL' ? ' active' : ''}" onclick="dnStartBl()">🟦 ${d.pts.length > 1 ? '重畫' : '畫'}基線</button>`]);
    const q = c ? dnRows(d) : [];
    det = `<div style="margin-top:6px;padding:6px 8px;border:1px solid var(--border-dim);border-radius:4px;background:rgba(34,211,238,.05);font-size:11.5px;line-height:1.6;">
      <div style="display:flex;gap:6px;align-items:center;"><input class="input-text" style="flex:1;" value="${escAttr(d.name)}" onchange="dnSet('name',this.value)"><span style="font-size:10.5px;color:var(--text-muted);">${d.mode === 'A' ? '沿中心線（A）' : '獨立基線（B）'}</span></div>
      <div style="display:grid;grid-template-columns:1fr;gap:2px;margin-top:4px;">${pos.join('')}</div>
      <div style="font-size:11px;font-weight:700;color:#0369a1;margin:6px 0 2px;">斷面</div><div style="display:grid;grid-template-columns:1fr;gap:2px;">${sec.join('')}</div>
      ${(() => { if (typeof DN2 !== 'undefined' && DN2[d.type] && DN2[d.type].sub) return `<div style="font-size:11px;font-weight:700;color:#0369a1;margin:6px 0 2px;">通水檢核</div><div style="font-size:10.5px;color:var(--text-muted);">地下排水（盲溝）：滲排地下水，不做明渠曼寧通水檢核。</div>`; const h = c ? dnHydCheck(d) : null; return `<div style="font-size:11px;font-weight:700;color:#0369a1;margin:6px 0 2px;">通水檢核（手冊 2.18）</div><div style="display:grid;grid-template-columns:1fr;gap:2px;">${lab('設計流量 Q (cms)', `<input type="number" class="input-num" style="width:84px;" step="0.01" value="${d.q ?? ''}" placeholder="空白＝不檢核" onchange="dnSet('q',this.value)">`, '清水＋含砂後的設計洪峰量')}${lab('曼寧 n', `<input type="number" class="input-num" style="width:84px;" step="0.001" value="${d.nv ?? ''}" placeholder="${dnN(d)}（自動）" onchange="dnSet('nv',this.value)">`, '空白＝混凝土 0.015、漿砌石 0.020（水保手冊表工2-18-1／Chow）')}</div>${h ? `<div style="margin-top:3px;font-size:11px;line-height:1.55;color:${h.ok ? '#16a34a' : '#b45309'};">${h.ok ? '✔ 通水、流速、出水高均符合' : '⚠ ' + h.msg.join('<br>⚠ ')}<br><span style="color:var(--text-muted);">設計水深 ${dnF(h.h)} m（最小坡 ${dnF(h.Smin, 1)}%），流速 ${dnF(h.V1)}～${dnF(h.V2)} m/s，需出水高 ${dnF(h.fb)} m，容許流量 ${dnF(h.Qcap, 3)} cms</span></div>` : ''}`; })()}
      ${c ? `<div style="margin-top:6px;font-size:10.5px;color:var(--text-muted);">溝底 ${dnF(c.zi0)} → ${dnF(c.zi1)} m；縱坡 ${dnF(c.smin, 1)}～${dnF(c.smax, 1)} %；地面至溝底 ${dnF(c.dmin)}～${dnF(c.dmax)} m${c.nG < c.n ? `；<b style="color:#b45309;">${c.n - c.nG} 點無地形資料（以溝深計）</b>` : ''}${d.mode === 'A' ? (() => { const S0 = (state.sections || []).find(x => x.sta >= d.s0 && x.samples && x.samples.length); if (!S0) return ''; const w = d.e + c.S.Wt / 2 + 1, lim = d.side === 'L' ? -S0.samples[0].offset : S0.samples[S0.samples.length - 1].offset; return w > lim ? `；<b style="color:#b45309;">⚠ 溝位超出橫斷面取樣寬（${d.side === 'L' ? '左' : '右'}側 ${dnF(lim, 1)} m），橫斷面看不到溝旁地面；請加大「路寬/河寬設定」的取樣寬</b>` : ''; })() : ''}${c.smin < -0.01 && c.smax > 0.01 ? '；<b style="color:#b45309;">⚠ 縱坡正負交錯（溝底有逆坡）</b>' : ''}</div>
        <canvas id="dnProfCv" width="380" height="150" style="width:100%;margin-top:4px;border-radius:4px;"></canvas>
        <div class="pt-table-wrap" style="margin-top:4px;"><table class="pt-table"><thead><tr><th>項目</th><th>單位</th><th>數量</th></tr></thead><tbody>${q.map(r => `<tr title="${escAttr(r.fx)}"><td>${escAttr(r.it)}</td><td>${r.u}</td><td style="text-align:right;">${dnF(r.v)}</td></tr>`).join('')}</tbody></table></div>` : `<div style="margin-top:6px;color:#b45309;">${d.mode === 'B' ? '請先畫基線。' : '這條排水溝屬於其他中心線，請切換中心線後編輯。'}</div>`}
    </div>`;
  }
  box.innerHTML = `<div class="sec-card"><div class="sec-title"><span>🟦 排水溝</span></div>
    <div style="font-size:10.5px;color:var(--text-muted);line-height:1.55;">A＝沿中心線一側（起訖樁號＋偏距，縱斷面畫溝底線、橫斷面畫溝體）；B＝獨立基線（平面自畫折線，適合截水溝、坡頂排水）。斷面：矩形溝、U 型溝、梯形溝。數量列入「匯出數量表」。</div>
    ${D.length ? `<div class="pt-table-wrap" style="max-height:170px;margin-top:4px;"><table class="pt-table"><thead><tr><th>名稱</th><th>放法</th><th>型式</th><th>長 m</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:5px;"><button class="btn primary" onclick="dnAdd('A')">＋ 沿中心線（A）</button><button class="btn primary" onclick="dnAdd('B')">＋ 畫獨立基線（B）</button></div>
    <div style="font-size:10.5px;color:var(--text-muted);margin-top:3px;">新增型式：${DN_TYPES[state.dnPickType || 'rect'].label}（可由「📚 名冊」選，或新增後在下方改）</div>${det}</div>`;
  if (d && dnOn(d)) { const cv = document.getElementById('dnProfCv'); if (cv) dnProfDraw(cv, d); }
}
function dnSheet() {
  if (!state.dns.length) return null; const H = a => a.map(v => ({ v, s: 1 })), r3 = v => Math.round(v * 1000) / 1000, rows = [[{ v: '排水溝數量', s: 5 }], ['開挖、回填依地形（三角網／DEM）沿線每 1 m 取樣，平均斷面法，屬概估'], [], H(['排水溝', '放法', '型式', '項目', '數量', '單位', '說明'])];
  const cur = state.clCur;
  const each = (fn) => { if (typeof clEach === 'function') clEach(fn); else fn(0); };
  const seen = new Set();
  each(() => state.dns.forEach(d => { if (seen.has(d.id) || !dnOn(d)) return; seen.add(d.id); dnRows(d).forEach(r => rows.push([{ v: d.name, s: 2 }, { v: d.mode === 'A' ? `沿中心線（${clName ? clName() : ''}）${d.side === 'L' ? '左' : '右'}側` : '獨立基線', s: 2 }, { v: DN_TYPES[d.type].label, s: 2 }, { v: r.it, s: 2 }, { v: r3(r.v), s: 3 }, { v: r.u, s: 2 }, { v: r.fx, s: 10 }])); }));
  void cur;
  return { name: '排水溝', cols: [12, 22, 16, 34, 12, 7, 60], rows, freeze: 4, merges: ['A1:G1'] };
}

/* ---- 掛勾：繪圖、DXF、工具、存檔、復原、數量表 ---- */
(function () {
  const _dp = rvDrawPlan; rvDrawPlan = function () { _dp(); try { dnDrawPlan(); } catch (e) { console.error('dnDrawPlan', e); } };
  const _xp = rvDxfPlan; rvDxfPlan = function (D) { _xp(D); try { dnDxfPlan(D); } catch (e) { console.error('dnDxfPlan', e); } };
  const _dc = rvDrawCross; rvDrawCross = function (sec, sx, sy, isLarge) { _dc(sec, sx, sy, isLarge); try { dnDrawCross(sec, sx, sy, isLarge); } catch (e) { console.error('dnDrawCross', e); } };
  const _xc = rvDxfCross; rvDxfCross = function (D, sec, sx, sy, TH) { _xc(D, sec, sx, sy, TH); try { dnDxfCross(D, sec, sx, sy, TH); } catch (e) { console.error('dnDxfCross', e); } };
  const _pp = rvDrawProfile; rvDrawProfile = function (sx, sy, a, b) { _pp(sx, sy, a, b); try { dnDrawProfile(sx, sy, a, b); } catch (e) { console.error('dnDrawProfile', e); } };
  const _xpp = rvDxfProfile; rvDxfProfile = function (D, X, Y, a, b, th) { _xpp(D, X, Y, a, b, th); try { dnDxfProfile(D, X, Y, a, b, th); } catch (e) { console.error('dnDxfProfile', e); } };
  const _fi = dzFinish; dzFinish = function () {
    if (state.activeTool !== 'DN_BL') return _fi();
    const P = state.dzTmp.slice(), d = state.dns.find(q => state.dzTool && q.id === state.dzTool.did);
    if (d && P.length >= 2) { pushUndoSnapshot(); d.pts = P; d._k = null; const c = dnCalc(d); updateStatus(`✅ ${d.name} 基線：${P.length} 點，長 ${dnF(c.L)} m；溝底 ${dnF(c.zi0)} → ${dnF(c.zi1)} m。`); }
    else updateStatus('⚠ 排水溝基線至少要 2 點。');
    state.dzTmp = []; setTool('PAN'); dnPanelUI(); requestRedraw();
  };
  const _cp = collectProject; collectProject = function () { const o = _cp(); o.data.dn = { list: state.dns.map(dnClean), sel: state.dnSel, pick: state.dnPickType || 'rect' }; return o; };
  const _ap = applyProject; applyProject = function (obj, fname) { const Z = (obj && obj.data && obj.data.dn) || {}; state.dns = Array.isArray(Z.list) ? Z.list.map(dnNorm) : []; state.dnSel = Math.min(Z.sel ?? (state.dns.length ? 0 : -1), state.dns.length - 1); state.dnPickType = Z.pick || 'rect'; _ap(obj, fname); dnPanelUI(); };
  const _pu = pushUndoSnapshot; pushUndoSnapshot = function () { _pu(); try { const n = state.undoStack.length - 1, o = JSON.parse(state.undoStack[n]); o.dn = { list: state.dns.map(dnClean), sel: state.dnSel }; state.undoStack[n] = JSON.stringify(o); } catch (e) { } };
  const _un = undoLastAction; undoLastAction = function () { let dn = null; try { const t = state.undoStack[state.undoStack.length - 1]; dn = t ? JSON.parse(t).dn : null; } catch (e) { } _un(); if (dn) { state.dns = dn.list.map(dnNorm); state.dnSel = Math.min(dn.sel, state.dns.length - 1); dnPanelUI(); requestRedraw(); } };
  if (typeof crossXExt === 'function') { const _ce = crossXExt; crossXExt = function (sec) { const ex = _ce(sec); let K = []; try { K = dnSecItems(sec); } catch (e) { } if (!K.length) return ex; let lo = ex ? ex[0] : Infinity, hi = ex ? ex[1] : -Infinity; K.forEach(k => k.polys.concat(k.tr ? [k.tr] : []).forEach(P => P.forEach(p => { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]); }))); return [lo, hi]; }; }
  const _bk = stQtyBook; stQtyBook = function () { const B = _bk(), s = dnSheet(); if (s) { B.sheets.push(s); B.n += 1; } return B; };
})();

/* v5.9.1 A：平面圖點選起訖點（第一點決定岸別＋偏距）；全線土方表附排水溝開挖／回填 */
function dnStartPick() {
  const d = state.dns[state.dnSel]; if (!d || d.mode !== 'A' || !dnOn(d)) return; if (state.viewMode !== '2D') setViewMode('2D');
  setTool('DN_PICK'); state.dzTool = { kind: 'dnp', did: d.id, p0: null }; state.dzTmp = [];
  document.getElementById('hudToolTip').innerHTML = `📍【${escAttr(d.name)}】在平面圖點選排水溝<b>起點</b>（點的位置＝溝中心，決定岸別與偏距），再點<b>迄點</b>；Esc 取消。`;
  updateStatus(`📍 請點選「${d.name}」的起點。`);
}
if (!DZ_TOOLS.includes('DN_PICK')) DZ_TOOLS.push('DN_PICK');
(function () {
  const _ck = dzClick; dzClick = function (w) {
    if (state.activeTool !== 'DN_PICK') return _ck(w);
    const d = state.dns.find(q => state.dzTool && q.id === state.dzTool.did), pr = projectWorldPointToAlignment(w.x, w.y); if (!d || !pr) return;
    const g = getPointAndNormalAtStation(pr.sta); if (!g) return; const dot = (w.x - g.x) * g.nx + (w.y - g.y) * g.ny;
    if (!state.dzTool.p0) { state.dzTool.p0 = { sta: pr.sta, side: dot > 0 ? 'L' : 'R', e: Math.abs(dot) }; state.dzTmp = [[w.x, w.y]]; updateStatus(`📍 起點 ${formatStation(pr.sta)}（${dot > 0 ? '左' : '右'}側，偏距 ${dnF(Math.abs(dot))} m）；請點迄點。`); requestRedraw(); return; }
    const a = state.dzTool.p0, s0 = Math.min(a.sta, pr.sta), s1 = Math.max(a.sta, pr.sta); if (s1 - s0 < 0.5) { updateStatus('⚠ 排水溝太短，請重點迄點。'); return; }
    pushUndoSnapshot(); Object.assign(d, { s0: +s0.toFixed(2), s1: +s1.toFixed(2), side: a.side, e: +a.e.toFixed(2) }); d._k = null;
    state.dzTmp = []; setTool('PAN'); dnPanelUI(); requestRedraw(); updateStatus(`✅ ${d.name}：${formatStation(s0)}～${formatStation(s1)}，${a.side === 'L' ? '左' : '右'}側，偏距 ${dnF(a.e)} m。`);
  };
  const _ew = dzEwSheet; dzEwSheet = function () {
    const S = _ew(); if (!S || !state.dns.length) return S; const r2 = v => Math.round(v * 100) / 100, H = a => a.map(v => ({ v, s: 1 }));
    const L = []; const seen = new Set(); const each = fn => (typeof clEach === 'function' ? clEach(fn) : fn(0));
    each(() => state.dns.forEach(d => { if (seen.has(d.id) || !dnOn(d)) return; seen.add(d.id); const c = dnCalc(d); L.push([d.name, d.mode === 'A' ? `沿中心線（${clName()}）${d.side === 'L' ? '左' : '右'}側 ${formatStation(d.s0)}～${formatStation(d.s1)}` : '獨立基線', DN_TYPES[d.type].label, c.L, c.ex, c.bf]); }));
    if (!L.length) return S; const tx = L.reduce((a, r) => a + r[4], 0), tb = L.reduce((a, r) => a + r[5], 0);
    S.rows.push([], [{ v: '排水溝開挖／回填（依排水溝表，概估；不含於上方逐站計算）', s: 5 }], H(['排水溝', '位置', '型式', '長度 m', '開挖 m³', '回填 m³']));
    L.forEach(r => S.rows.push([r[0], r[1], r[2], r2(r[3]), r2(r[4]), r2(r[5])]));
    S.rows.push([{ v: '排水溝合計', s: 2 }, '', '', '', { v: r2(tx), s: 3 }, { v: r2(tb), s: 3 }]);
    const T = dzEwTot(); if (T) S.rows.push([{ v: '全線合計（河道＋護岸＋排水溝；結構物另計）', s: 2 }, '', '', '', { v: r2(T.c + tx), s: 3 }, { v: r2(T.f + tb), s: 3 }]);
    return S;
  };
  const _eu = dzEwUI; dzEwUI = function () { _eu(); const box = document.getElementById('dzEwBox'); if (!box || !state.dns.length) return; let tx = 0, tb = 0, n = 0; state.dns.forEach(d => { if (!dnOn(d)) return; const c = dnCalc(d); tx += c.ex; tb += c.bf; n++; }); if (!n) return;
    const T = dzEwTot(), el = document.createElement('div'); el.style.cssText = 'font-size:11px;margin-top:4px;line-height:1.6;color:#0e7490;'; el.innerHTML = `排水溝 ${n} 條：開挖 <b>${dnF(tx)}</b>、回填 <b>${dnF(tb)}</b> m³（另列）｜含排水溝合計：挖 <b>${dnF((T ? T.c : 0) + tx)}</b>、填 <b>${dnF((T ? T.f : 0) + tb)}</b> m³`;
    const det = box.querySelector('details'); if (det) det.parentNode.insertBefore(el, det); else box.appendChild(el); };
})();
