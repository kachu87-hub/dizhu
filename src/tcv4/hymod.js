/* ============================================================================
   v6.0 水力檢核（概估）
   - 流量：Q25、Q50 由使用者輸入，可依中心線樁號分段
   - 糙度 n：左岸／主槽／右岸分開設，可分段；護岸面依護岸型式自動採用（可改表）
   - 水面線：一維恆定流標準步推法（分區曼寧通水量、能量損失＝摩擦＋擴縮）
       亞臨界由下游往上游、超臨界由控制點往下游，動量函數判定水躍；防砂壩／副壩以梯形溢流堰控制上游水位
   - 護岸出水高：護岸頂高 − 水位 ≥ 出水高（預設 0.3 m）
   - 輸出：縱斷面水面線、橫斷面水位／水深／流速、檢核表（畫面與 DXF 同步）、數量表附「水力檢核」頁
   ============================================================================ */
const HY_G = 9.81, HY_COL = { 25: '#38bdf8', 50: '#a78bfa' }, HY_DXFC = { 25: 5, 50: 6 };
const HY_RVC = { conc: '混凝土（重力式）', dry: '乾砌石', gab: '箱籠／土石籠', mas: '砌石混凝土／預鑄' };
function hyDef() {
  return { Q: [{ s0: null, s1: null, q25: null, q50: null }], n: { main: 0.04, left: 0.05, right: 0.05 }, nseg: [], rvn: { conc: 0.015, dry: 0.032, gab: 0.032, mas: 0.025 }, rvAuto: true,
    dir: 'auto', dx: 5, bc: { 25: { m: 'normal', w: null, S: null }, 50: { m: 'normal', w: null, S: null } }, fb: null, alpha: 0, weirC: 0.6, show: { 25: true, 50: true, lab: true, prof: true, cross: true, plan: true, v3d: true, flow: false } };
}
state.hy = hyDef(); state.hyRes = null; state.hyStale = false;
const hyF = (v, d = 2) => (Number.isFinite(+v) ? (+v).toFixed(d) : '—');
function hyClean(h) { const o = JSON.parse(JSON.stringify(h || state.hy)); delete o.res; return o; }
function hyNorm(o) {
  const d = hyDef(); if (!o) return d; const r = Object.assign(d, JSON.parse(JSON.stringify(o)));
  r.n = Object.assign(hyDef().n, r.n || {}); r.rvn = Object.assign(hyDef().rvn, r.rvn || {}); r.show = Object.assign(hyDef().show, r.show || {});
  r.bc = { 25: Object.assign({ m: 'normal', w: null, S: null }, (o.bc || {})[25]), 50: Object.assign({ m: 'normal', w: null, S: null }, (o.bc || {})[50]) };
  if (!Array.isArray(r.Q) || !r.Q.length) r.Q = hyDef().Q; if (!Array.isArray(r.nseg)) r.nseg = []; return r;
}
const hyNum = v => (v === null || v === undefined || v === '' || !Number.isFinite(+v) ? null : +v);

/* ---- 取值：分段 Q、n ---- */
function hyInSeg(g, s) { return (g.s0 === null || s >= g.s0 - 1e-6) && (g.s1 === null || s <= g.s1 + 1e-6); }
/* 出水高標準（水保手冊表工2-7-2／表3-4）：Q≤200→0.6、200~500→0.8、>500→1.0；fb 欄位有填＝手動覆蓋 */
function hyFbTxt(R) { return [25, 50].filter(k => R.runs[k]).map(k => `Q${k} ${hyF(R.fbReq[k])}`).join('／') + ' m'; }
function hyFbStd(Q) { return Q > 500 ? 1.0 : Q > 200 ? 0.8 : 0.6; }
function hyQAt(s, k) { const key = k === 25 ? 'q25' : 'q50'; let q = 0; state.hy.Q.forEach(g => { if (hyInSeg(g, s) && hyNum(g[key]) > 0) q = +g[key]; }); return q * (1 + Math.max(0, +state.hy.alpha || 0)); }
function hyNAt(s) { const n = Object.assign({}, state.hy.n); state.hy.nseg.forEach(g => { if (!hyInSeg(g, s)) return; ['main', 'left', 'right'].forEach(k => { if (hyNum(g[k]) > 0) n[k] = +g[k]; }); }); return n; }
function hyRvClass(T) { if (!T) return 'conc'; if (T.prim === 'gab') return 'gab'; if (T.code && /0402/.test(T.code)) return 'dry'; if (T.prim === 'conc') return 'conc'; return 'mas'; }

/* ---- 斷面幾何：{off[], z[], bl, br, toe{}, a0b{}, rn{}, top{}, nM,nL,nR, zmin, zmax, sta, side} ---- */
function hyGeoSec(sec) {
  const S = sec.samples || [], off = S.map(q => q.offset), z = S.map(q => q.desZ);
  const g = { sta: sec.sta, side: sec.side || '', off, z, toe: {}, a0: {}, a0b: {}, rn: {}, top: {}, sec };
  const W2 = sec.params && sec.params.W ? sec.params.W / 2 : 3, n = hyNAt(sec.sta); g.nM = n.main; g.nL = n.left; g.nR = n.right;
  ['L', 'R'].forEach(sd => {
    const B = sec.bkInfo && sec.bkInfo[sd]; let bank = W2;
    if (B && B.mode !== 'nat' && B.R) { const T = B.R.T || (B.R.rv && tcType(B.R.rv.type)); g.toe[sd] = B.e; g.a0[sd] = B.a0 || B.e; g.a0b[sd] = B.a0b || B.a0 || B.e; g.top[sd] = B.zTop; bank = g.a0[sd];
      g.rn[sd] = state.hy.rvAuto ? state.hy.rvn[hyRvClass(T)] : null; if (g.rn[sd] === undefined) g.rn[sd] = null; }
    g[sd === 'L' ? 'bl' : 'br'] = bank;
  });
  g.zmin = Math.min(...z); g.zmax = Math.max(...z); return g;
}
function hyZat(g, o) { const a = g.off, b = g.z; if (o <= a[0]) return b[0]; if (o >= a[a.length - 1]) return b[b.length - 1]; let i = 0; while (i < a.length - 2 && o > a[i + 1]) i++; return b[i] + (b[i + 1] - b[i]) * (o - a[i]) / ((a[i + 1] - a[i]) || 1); }
function hyGeoMix(A, B, t, sta) {   // 兩斷面之間內插（t：0＝A，1＝B）
  const off = [...new Set(A.off.concat(B.off).map(v => +v.toFixed(5)))].sort((p, q) => p - q), z = off.map(o => hyZat(A, o) * (1 - t) + hyZat(B, o) * t);
  const g = { sta, side: '', off, z, toe: {}, a0: {}, a0b: {}, rn: {}, top: {}, sec: null }, n = hyNAt(sta); g.nM = n.main; g.nL = n.left; g.nR = n.right;
  const mix = (a, b) => (Number.isFinite(a) && Number.isFinite(b) ? a * (1 - t) + b * t : (t < 0.5 ? (Number.isFinite(a) ? a : b) : (Number.isFinite(b) ? b : a)));
  ['L', 'R'].forEach(sd => {
    const has = (t < 0.5 ? A : B).toe[sd] !== undefined || (A.toe[sd] !== undefined && B.toe[sd] !== undefined);
    if (has && (A.toe[sd] !== undefined || B.toe[sd] !== undefined)) { ['toe', 'a0', 'a0b', 'top'].forEach(k => { g[k][sd] = mix(A[k][sd], B[k][sd]); }); g.rn[sd] = (t < 0.5 ? A : B).rn[sd] ?? (A.rn[sd] ?? B.rn[sd]) ?? null; }
    const W2 = 3; g[sd === 'L' ? 'bl' : 'br'] = g.a0[sd] !== undefined ? g.a0[sd] : mix(A[sd === 'L' ? 'bl' : 'br'], B[sd === 'L' ? 'bl' : 'br']) || W2;
  });
  g.zmin = Math.min(...z); g.zmax = Math.max(...z); return g;
}

/* ---- 水力特性 ---- */
function hyZone(g, m) { return m < -g.bl ? 0 : (m > g.br ? 2 : 1); }
function hySegN(g, m, zone) {
  const sd = m < 0 ? 'L' : 'R', a = Math.abs(m);
  if (g.rn[sd] !== null && g.rn[sd] !== undefined && g.toe[sd] !== undefined && a > g.toe[sd] && a <= g.a0b[sd]) return g.rn[sd];
  return zone === 1 ? g.nM : (zone === 0 ? g.nL : g.nR);
}
function hyProps(g, W) {
  const o = g.off, z = g.z, A = [0, 0, 0], P = [0, 0, 0], PN = [0, 0, 0]; let Bt = 0, I = 0, over = false;
  for (let i = 0; i < o.length - 1; i++) {
    const x1 = o[i], x2 = o[i + 1], z1 = z[i], z2 = z[i + 1]; if (!(x2 > x1)) continue;
    const d1 = W - z1, d2 = W - z2; if (d1 <= 0 && d2 <= 0) continue;
    let xa = x1, xb = x2, da = d1, db = d2;
    if (d1 <= 0) { xa = x1 + (x2 - x1) * d1 / (d1 - d2); da = 0; } else if (d2 <= 0) { xb = x1 + (x2 - x1) * d1 / (d1 - d2); db = 0; }
    const dx = xb - xa, mid = (xa + xb) / 2, zone = hyZone(g, mid), n = hySegN(g, mid, zone), per = Math.hypot(dx, db - da);
    A[zone] += (da + db) / 2 * dx; P[zone] += per; PN[zone] += per * Math.pow(n, 1.5); Bt += dx; I += dx * (da * da + da * db + db * db) / 6;
  }
  if (W > z[0] + 1e-9 || W > z[z.length - 1] + 1e-9) over = true;
  let At = 0, Kt = 0, K3 = 0, Pt = 0;
  for (let k = 0; k < 3; k++) if (A[k] > 1e-9 && P[k] > 1e-9) { const nc = Math.pow(PN[k] / P[k], 2 / 3), Kz = Math.pow(A[k] / P[k], 2 / 3) * A[k] / nc; At += A[k]; Kt += Kz; K3 += Kz * Kz * Kz / (A[k] * A[k]); Pt += P[k]; }
  const al = Kt > 0 ? Math.min(2, Math.max(1, K3 * At * At / (Kt * Kt * Kt))) : 1;
  return { A: At, B: Bt, K: Kt, P: Pt, al, I, over };
}
function hyHv(g, W, Q) { const p = hyProps(g, W); if (!(p.A > 1e-9)) return { hv: 1e6, sf: 1e6, V: 0, p }; const V = Q / p.A; return { hv: p.al * V * V / (2 * HY_G), sf: p.K > 0 ? Math.pow(Q / p.K, 2) : 1e6, V, p }; }
function hyFr2(g, W, Q) { const p = hyProps(g, W); return p.A > 1e-9 ? p.al * Q * Q * p.B / (HY_G * Math.pow(p.A, 3)) : 1e9; }
function hyWmax(g) { return g.zmax + 25; }
function hyCrit(g, Q) {
  const w0 = g.zmin + 1e-3, w1 = hyWmax(g); if (hyFr2(g, w0, Q) <= 1) return w0;
  let a = w0, W = w0;
  while (W < w1) { W += 0.05; if (hyFr2(g, W, Q) <= 1) { let lo = a, hi = W; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (hyFr2(g, m, Q) > 1) lo = m; else hi = m; } return (lo + hi) / 2; } a = W; }
  return w1;
}
function hyNormal(g, Q, S) {
  if (!(S > 0)) return null; let lo = g.zmin + 1e-3, hi = hyWmax(g); if (hyProps(g, hi).K * Math.sqrt(S) < Q) return hi;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; (hyProps(g, m).K * Math.sqrt(S) < Q) ? lo = m : hi = m; } return (lo + hi) / 2;
}
function hyMom(g, W, Q) { const p = hyProps(g, W); return p.A > 1e-9 ? Q * Q / (HY_G * p.A) + p.I : 1e9; }
/* 能量方程：已知節點 kn{W,hv,sf,Q}、未知節點 g（流量 Q）、距離 L；kdown＝已知節點在下游 */
function hyStep(g, Q, kn, L, kdown, wc) {
  const F = W => {
    const h = hyHv(g, W, Q), Ks = h.p.K + kn.K, sf = Ks > 0 ? Math.pow((Q + kn.Q) / Ks, 2) : 1e6, hf = L * sf, hu = kdown ? h.hv : kn.hv, hd = kdown ? kn.hv : h.hv, he = (hd > hu ? 0.1 : 0.3) * Math.abs(hd - hu);
    return kdown ? (W + h.hv) - (kn.W + kn.hv + hf + he) : (W + h.hv + hf + he) - (kn.W + kn.hv);
  };
  const w0 = g.zmin + 1e-3;
  if (kdown) {   // 亞臨界：W ≥ Wc，F 遞增
    if (F(wc) >= 0) return { W: wc, ctrl: true };
    let lo = wc, hi = hyWmax(g); if (F(hi) < 0) return { W: hi, ctrl: false, fail: true };
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; F(m) < 0 ? lo = m : hi = m; } return { W: (lo + hi) / 2 };
  }
  if (F(wc) > 0) return null;   // 超臨界：W ≤ Wc，無解＝能量不足（水躍發生）
  let lo = w0, hi = wc; if (F(lo) < 0) return { W: w0 };
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; F(m) > 0 ? lo = m : hi = m; } return { W: (lo + hi) / 2 };
}

/* ---- 溢流堰（防砂壩／副壩）：Q = (2/15)·C·√(2g)·(3B1+2B2)·h^1.5＝0.354(5w+4·s1·h)h^1.5（水保手冊式3-26～3-28；C=0.6↔0.354），B1＝溢洪口底寬 w，B2＝w+2·s1·h ---- */
function hyWeirH(st, Q) {
  const w = st.p.w, s1 = Math.max(0, st.p.s1), C = state.hy.weirC, k = 2 / 15 * C * Math.sqrt(2 * HY_G); let lo = 0, hi = 60;
  const q = h => k * (5 * w + 4 * s1 * h) * Math.pow(h, 1.5); for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; q(m) < Q ? lo = m : hi = m; } return (lo + hi) / 2;
}

/* ---- 節點串 ---- */
function hyFlowDir() {
  const h = state.hy.dir; if (h === '+') return 1; if (h === '-') return -1;
  const S = (state.sections || []).filter(s => s.samples && s.samples.length > 1).sort((a, b) => a.sta - b.sta); if (S.length < 2) return 1;
  return S[0].desCenterZ >= S[S.length - 1].desCenterZ ? 1 : -1;
}
function hyNodes(dir) {
  const ord = s => (s.side === 'post' || s.side === 'dn' ? 1 : 0), S = (state.sections || []).filter(s => s.samples && s.samples.length > 1);
  S.sort((a, b) => dir * (a.sta - b.sta) || dir * (ord(a) - ord(b))); const dx = Math.max(0.5, +state.hy.dx || 5), out = [];
  S.forEach((sec, i) => {
    const g = hyGeoSec(sec); out.push({ g, sec, sta: sec.sta, orig: true });
    const nx = S[i + 1]; if (!nx) return; const gap = Math.abs(nx.sta - sec.sta); if (gap > dx * 1.0001) {
      const n = Math.ceil(gap / dx), gB = hyGeoSec(nx); for (let k = 1; k < n; k++) { const t = k / n, s = sec.sta + (nx.sta - sec.sta) * t; out.push({ g: hyGeoMix(g, gB, t, s), sec: null, sta: s, orig: false }); }
    }
  });
  return out;
}
function hyDams() { return (state.structs || []).filter(st => st.type === 'dam' || st.type === 'sub'); }

/* ---- 單一流量的水面線 ---- */
function hySolve(nodes, k, warns) {
  const N = nodes.length, bc = state.hy.bc[k], res = { Q: [], W: new Array(N).fill(NaN), reg: new Array(N).fill(''), V: [], Fr: [], depth: [], A: [], B: [], hv: [], flag: new Array(N).fill(''), wc: [] };
  nodes.forEach((nd, i) => { res.Q[i] = hyQAt(nd.sta, k); });
  if (!res.Q.some(q => q > 0)) return null;
  const gap = nodes.filter((nd, i) => nd.orig && !(res.Q[i] > 0)); if (gap.length) warns.push(`Q${k}：${gap.length} 個斷面不在 Q 分段內，未計算（${gap.slice(0, 3).map(nd => fmtSta(nd.sta)).join('、')}${gap.length > 3 ? '…' : ''}）；Q 分段的起終點空白＝全線`);
  const Wc = nodes.map((nd, i) => (res.Q[i] > 0 ? hyCrit(nd.g, res.Q[i]) : NaN)); res.wc = Wc;
  const weir = new Array(N).fill(null);   // 溢流堰控制節點（流向上游側）
  hyDams().forEach(st => { for (let i = 0; i < N - 1; i++) if (nodes[i].orig && nodes[i + 1].orig && Math.abs(nodes[i].sta - st.sta) < 0.03 && Math.abs(nodes[i + 1].sta - st.sta) < 0.03 && res.Q[i] > 0) {
    const h = hyWeirH(st, res.Q[i]), zS = stPlace(st).zS; weir[i] = { W: Math.max(nodes[i].g.zmin + 1e-3, zS + h), st, h };
    if (h > st.p.h1 + 1e-6) warns.push(`${st.name}：Q${k} 溢流水深 ${hyF(h)} m 超過溢洪口高 h1=${hyF(st.p.h1)} m（水流越過壩翼，堰公式不適用）`); break; } });
  const cuts = []; for (let i = 0; i < N; i++) if (weir[i]) cuts.push(i);   // 切成河段：[start..end]，end＝堰節點或最末
  const reaches = []; let a = 0; cuts.forEach(c => { reaches.push([a, c]); a = c + 1; }); if (a <= N - 1) reaches.push([a, N - 1]);
  reaches.forEach(([rs, re], ri) => {
    let r0 = rs, r1 = re; while (r0 <= r1 && !(res.Q[r0] > 0)) r0++; while (r1 >= r0 && !weir[r1] && !(res.Q[r1] > 0)) r1--;
    if (r1 < r0) return;
    const sub = new Array(N).fill(NaN), ctrl = new Array(N).fill(false), sup = new Array(N).fill(NaN), start = new Array(N).fill(false);
    const info = i => { const h = hyHv(nodes[i].g, sub[i], res.Q[i]); return { W: sub[i], hv: h.hv, K: h.p.K, Q: res.Q[i] }; };
    // 下游邊界
    if (weir[r1]) { sub[r1] = Math.max(weir[r1].W, Wc[r1]); res.reg[r1] = 'weir'; }
    else {
      const g = nodes[r1].g; let W = null;
      if (bc.m === 'wse' && hyNum(bc.w) !== null) W = +bc.w;
      else { let S = hyNum(bc.S); if (!(S > 0)) { const j = Math.max(r0, r1 - 1), L = Math.abs(nodes[r1].sta - nodes[j].sta); S = L > 1e-6 ? (nodes[j].g.zmin - nodes[r1].g.zmin) / L : 0; if (!(S > 1e-5)) S = 0.001; } W = hyNormal(g, res.Q[r1], S); }
      if (W === null || W < Wc[r1]) { W = Wc[r1]; ctrl[r1] = true; } sub[r1] = W;
    }
    for (let i = r1 - 1; i >= r0; i--) { if (!(res.Q[i] > 0)) continue; const L = Math.abs(nodes[i].sta - nodes[i + 1].sta), r = hyStep(nodes[i].g, res.Q[i], info(i + 1), L, true, Wc[i]); sub[i] = r.W; if (r.ctrl || r.fail) ctrl[i] = true; if (r.fail) warns.push(`${fmtSta(nodes[i].sta)} Q${k}：水位超出計算範圍`); }
    // 超臨界起點：河段第一個節點
    if (ri > 0 && r0 === rs && weir[r0 - 1]) {   // 壩下：由堰池能量求超臨界水深
      const hw = hyHv(nodes[r0 - 1].g, weir[r0 - 1].W, res.Q[r0 - 1]), kn = { W: weir[r0 - 1].W, hv: hw.hv, K: hw.p.K, Q: res.Q[r0 - 1] }, r = hyStep(nodes[r0].g, res.Q[r0], kn, 0, false, Wc[r0]);
      if (r) { sup[r0] = r.W; start[r0] = true; } else { sup[r0] = Wc[r0]; start[r0] = true; }
    } else if (ri === 0) {   // 全線最上游：正常水深為超臨界時由正常水深起算
      const L = r1 > r0 ? Math.abs(nodes[r0 + 1].sta - nodes[r0].sta) : 0; let S = L > 1e-6 ? (nodes[r0].g.zmin - nodes[Math.min(r0 + 1, r1)].g.zmin) / L : 0;
      if (S > 1e-5) { const Wn = hyNormal(nodes[r0].g, res.Q[r0], S); if (Wn !== null && Wn < Wc[r0] - 1e-6) { sup[r0] = Wn; start[r0] = true; } }
    }
    let alive = !isNaN(sup[r0]);
    for (let i = r0; i <= r1; i++) {
      if (!(res.Q[i] > 0)) continue;
      if (i > r0) {
        if (alive && !isNaN(sup[i - 1])) {
          const h = hyHv(nodes[i - 1].g, sup[i - 1], res.Q[i - 1]), L = Math.abs(nodes[i].sta - nodes[i - 1].sta), r = hyStep(nodes[i].g, res.Q[i], { W: sup[i - 1], hv: h.hv, K: h.p.K, Q: res.Q[i - 1] }, L, false, Wc[i]);
          if (r) sup[i] = r.W; else alive = false;
        }
        if (isNaN(sup[i]) && ctrl[i] && !weir[i]) { sup[i] = Wc[i]; start[i] = true; alive = true; }
      }
      let useSup = false;
      if (!isNaN(sup[i]) && !weir[i]) { if (start[i]) useSup = true; else if (hyMom(nodes[i].g, sup[i], res.Q[i]) > hyMom(nodes[i].g, sub[i], res.Q[i]) * (1 + 1e-6)) useSup = true; else alive = false; }
      if (weir[i]) { res.W[i] = sub[i]; res.reg[i] = 'weir'; }
      else if (useSup) { res.W[i] = sup[i]; res.reg[i] = Math.abs(sup[i] - Wc[i]) < 2e-3 ? 'crit' : 'sup'; }
      else { res.W[i] = sub[i]; res.reg[i] = ctrl[i] ? 'crit' : 'sub'; }
    }
  });
  // 輸出量
  for (let i = 0; i < N; i++) { const W = res.W[i], Q = res.Q[i]; if (!Number.isFinite(W) || !(Q > 0)) { res.V[i] = res.Fr[i] = res.depth[i] = res.A[i] = res.B[i] = res.hv[i] = NaN; continue; }
    const p = hyProps(nodes[i].g, W); res.A[i] = p.A; res.B[i] = p.B; res.V[i] = p.A > 0 ? Q / p.A : NaN; res.depth[i] = W - nodes[i].g.zmin; res.hv[i] = p.al * res.V[i] * res.V[i] / (2 * HY_G);
    res.Fr[i] = p.A > 0 ? Math.sqrt(hyFr2(nodes[i].g, W, Q)) : NaN; if (p.over) res.flag[i] = '水位超出斷面範圍'; }
  return res;
}
function fmtSta(s) { return typeof formatStation === 'function' ? formatStation(s) : hyF(s, 1); }

function hySig() { const c = hyClean(); delete c.show; return JSON.stringify([c, (state.sections || []).map(s => [s.sta, s.side, s.desCenterZ]), (state.structs || []).length, (state.revs || []).length]); }
function hyRun() {
  const secs = (state.sections || []).filter(s => s.samples && s.samples.length > 1);
  if (secs.length < 2) { updateStatus('⚠ 水力檢核需要先有中心線、縱斷面與橫斷面。'); return null; }
  const dir = hyFlowDir(), nodes = hyNodes(dir), warns = [], runs = {};
  [25, 50].forEach(k => { try { const r = hySolve(nodes, k, warns); if (r) runs[k] = r; } catch (e) { console.error('hySolve', e); warns.push(`Q${k} 計算失敗：${e.message}`); } });
  if (!Object.keys(runs).length) { updateStatus('⚠ 請先在「水力」頁籤輸入設計流量 Q25 或 Q50。'); state.hyRes = null; hyPanelUI(); requestRedraw(); return null; }
  // 出水高
  const fbMan = state.hy.fb != null && state.hy.fb !== '' && Number.isFinite(+state.hy.fb) ? Math.max(0, +state.hy.fb) : null, chk = [], fbK = {};
  [25, 50].forEach(k => { const r = runs[k]; if (!r) return; const fb = fbMan !== null ? fbMan : hyFbStd(Math.max(0, ...r.Q.filter(Number.isFinite))); fbK[k] = fb; r.fbReq = fb; if (fbMan !== null && fbMan < 0.6 - 1e-9) warns.push(`Q${k} 出水高標準 ${fbMan} m 低於水保手冊護岸下限 0.6 m（表工2-7-2）`); r.fb = nodes.map((nd, i) => { const o = {}; ['L', 'R'].forEach(sd => { const top = nd.g.top[sd]; if (Number.isFinite(top) && Number.isFinite(r.W[i])) { o[sd] = { top, fb: top - r.W[i], ok: top - r.W[i] >= fb - 1e-9 }; } }); return o; }); });
  state.hyRes = { dir, nodes, runs, warns, sig: hySig(), fbReq: fbK, chk }; state.hyStale = false;
  const bad = hyBad(); updateStatus(`🌊 水面線完成（流向：樁號${dir > 0 ? '遞增' : '遞減'}方向，${nodes.length} 個計算斷面）；出水高不足 ${bad.length} 處。`);
  hyPanelUI(); requestRedraw(); return state.hyRes;
}
function hyClear() { state.hyRes = null; state.hyStale = false; hyPanelUI(); requestRedraw(); updateStatus('🗑 已清除水力結果（輸入的 Q、n 等設定保留，需要時再按「計算水面線」）。'); }
function hyBad() { const R = state.hyRes, out = []; if (!R) return out; [25, 50].forEach(k => { const r = R.runs[k]; if (!r) return; R.nodes.forEach((nd, i) => { if (!nd.orig) return; ['L', 'R'].forEach(sd => { const f = r.fb[i][sd]; if (f && !f.ok) out.push({ k, i, sd, sta: nd.sta, side: nd.g.side, fb: f.fb }); }); }); }); return out; }
function hyNodeOf(sec) { const R = state.hyRes; if (!R) return -1; return R.nodes.findIndex(n => n.sec === sec); }
function hyCheckStale() { if (state.hyRes && state.hyRes.sig !== hySig()) { state.hyStale = true; } }

/* ---- 繪圖 ---- */
function hyWet(g, W) {   // 水體多邊形 [[o,z]...]（逐段）
  const out = [], o = g.off, z = g.z;
  for (let i = 0; i < o.length - 1; i++) {
    const d1 = W - z[i], d2 = W - z[i + 1]; if (d1 <= 0 && d2 <= 0) continue; let xa = o[i], xb = o[i + 1], za = z[i], zb = z[i + 1];
    if (d1 <= 0) { xa = o[i] + (o[i + 1] - o[i]) * d1 / (d1 - d2); za = W; } else if (d2 <= 0) { xb = o[i] + (o[i + 1] - o[i]) * d1 / (d1 - d2); zb = W; }
    out.push([[xa, za], [xb, zb], [xb, W], [xa, W]]);
  }
  return out;
}
function hyExtent(g, W) { let lo = Infinity, hi = -Infinity; hyWet(g, W).forEach(P => { lo = Math.min(lo, P[0][0]); hi = Math.max(hi, P[1][0]); }); return Number.isFinite(lo) ? [lo, hi] : null; }
function hyLbl(r, i, k) { return `Q${k}=${hyF(r.Q[i], 1)}　水位 ${hyF(r.W[i])}　水深 ${hyF(r.depth[i])}　V=${hyF(r.V[i])} m/s　Fr=${hyF(r.Fr[i])}`; }
function hyDrawCross(sec, sx, sy, isLarge) {
  const R = state.hyRes; if (!R || !state.hy.show.cross) return; const i = hyNodeOf(sec); if (i < 0) return;
  [25, 50].forEach((k, ki) => { const r = R.runs[k]; if (!r || !state.hy.show[k] || !Number.isFinite(r.W[i])) return; const g = R.nodes[i].g, W = r.W[i];
    ctx.save(); ctx.fillStyle = k === 25 ? 'rgba(56,189,248,.20)' : 'rgba(167,139,250,.14)'; hyWet(g, W).forEach(P => { ctx.beginPath(); P.forEach((p, j) => (j ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1])))); ctx.closePath(); ctx.fill(); });
    const E = hyExtent(g, W); if (E) { ctx.strokeStyle = HY_COL[k]; ctx.lineWidth = isLarge ? 1.6 : 1.1; ctx.setLineDash(k === 25 ? [] : [7, 3]); ctx.beginPath(); ctx.moveTo(sx(E[0]), sy(W)); ctx.lineTo(sx(E[1]), sy(W)); ctx.stroke(); ctx.setLineDash([]);
      if (isLarge && state.hy.show.lab) { ctx.font = '11px "Noto Sans TC","JetBrains Mono"'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; const t = hyLbl(r, i, k), cx = sx((E[0] + E[1]) / 2), y = sy(W) - 6 - (1 - ki) * 15, w = ctx.measureText(t).width;
        ctx.fillStyle = 'rgba(11,18,32,.82)'; ctx.fillRect(cx - w / 2 - 3, y - 13, w + 6, 15); ctx.fillStyle = HY_COL[k]; ctx.fillText(t, cx, y); } }
    ['L', 'R'].forEach(sd => { const f = r.fb && r.fb[i] && r.fb[i][sd]; if (!f || !isLarge) return; const o = sd === 'L' ? -(g.a0[sd] ?? 0) : (g.a0[sd] ?? 0); ctx.fillStyle = f.ok ? '#16a34a' : '#ef4444'; ctx.font = (f.ok ? '' : 'bold ') + '10.5px "Noto Sans TC"'; ctx.textAlign = sd === 'L' ? 'right' : 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(`Q${k} 出水高 ${hyF(f.fb)}${f.ok ? '' : ' ✗不足'}`, sx(o), sy(f.top) - 4 - ki * 12); });
    ctx.restore(); });
}
function hyDxfCross(D, sec, sx, sy, TH) {
  const R = state.hyRes; if (!R || !state.hy.show.cross) return; const i = hyNodeOf(sec); if (i < 0) return;
  [25, 50].forEach((k, ki) => { const r = R.runs[k]; if (!r || !state.hy.show[k] || !Number.isFinite(r.W[i])) return; const g = R.nodes[i].g, W = r.W[i], E = hyExtent(g, W);
    if (E) { D.poly([[sx(E[0]), sy(W)], [sx(E[1]), sy(W)]], 'HY_WSE' + k, HY_DXFC[k], 0, false, k === 25 ? undefined : 'DASHED'); D.text(sx(E[0]), sy(W) + TH * (0.3 + ki * 1.0), TH * 0.7, hyLbl(r, i, k), 'HY_TEXT', HY_DXFC[k], { align: 'l', valign: 'b' }); }
    ['L', 'R'].forEach(sd => { const f = r.fb && r.fb[i] && r.fb[i][sd]; if (!f) return; const o = sd === 'L' ? -(g.a0[sd] ?? 0) : (g.a0[sd] ?? 0); D.text(sx(o), sy(f.top) + TH * (0.3 + ki * 0.9), TH * 0.65, `Q${k} 出水高 ${hyF(f.fb)}${f.ok ? '' : ' 不足'}`, f.ok ? 'HY_TEXT' : 'HY_FB', f.ok ? 3 : 1, { align: sd === 'L' ? 'r' : 'l', valign: 'b' }); }); });
}
function hyProfPts(k, a, b) { const R = state.hyRes; if (!R || !R.runs[k]) return []; const r = R.runs[k], out = []; R.nodes.forEach((nd, i) => { if (Number.isFinite(r.W[i]) && nd.sta >= a - 1e-6 && nd.sta <= b + 1e-6) out.push([nd.sta, r.W[i]]); }); return out; }
function hyDrawProfile(sx, sy, a, b) {
  const R = state.hyRes; if (!R || !state.hy.show.prof) return;
  [25, 50].forEach((k, ki) => { if (!state.hy.show[k]) return; const P = hyProfPts(k, a, b); if (P.length < 2) return; ctx.save(); ctx.strokeStyle = HY_COL[k]; ctx.lineWidth = 1.6; ctx.setLineDash(k === 25 ? [] : [7, 3]); ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1])))); ctx.stroke(); ctx.setLineDash([]);
    const r = R.runs[k], q = r.Q.find(v => v > 0), t = `Q${k} 水面線${state.hyStale ? '（輸入已變更，請重算）' : ''}　Q=${hyF(q, 1)} m³/s`, pm = P[Math.floor(P.length * 0.7)]; ctx.font = '10.5px "Noto Sans TC"'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; const w = ctx.measureText(t).width, x = sx(pm[0]), y = sy(pm[1]) - 8 - ki * 14;
    ctx.fillStyle = 'rgba(11,18,32,.8)'; ctx.fillRect(x - w / 2 - 3, y - 12, w + 6, 14); ctx.fillStyle = HY_COL[k]; ctx.fillText(t, x, y);
    R.nodes.forEach((nd, i) => { ['L', 'R'].forEach(sd => { const f = r.fb && r.fb[i] && r.fb[i][sd]; if (nd.orig && f && !f.ok && nd.sta >= a && nd.sta <= b) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; const x = sx(nd.sta), y = sy(f.top); ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke(); } }); });
    ctx.restore(); });
}
function hyDxfProfile(D, X, Y, a, b, th) {
  const R = state.hyRes; if (!R || !state.hy.show.prof) return;
  [25, 50].forEach((k, ki) => { if (!state.hy.show[k]) return; const P = hyProfPts(k, a, b); if (P.length < 2) return; D.poly(P.map(p => [X(p[0]), Y(p[1])]), 'HY_WSE' + k, HY_DXFC[k], 0, false, k === 25 ? undefined : 'DASHED');
    const r = R.runs[k], q = r.Q.find(v => v > 0); D.text(X(P[0][0]) + th * 0.4, Y(P[0][1]) + th * (0.6 + ki * 1.1), th * 0.8, `Q${k} 水面線　Q=${hyF(q, 1)} m3/s`, 'HY_TEXT', HY_DXFC[k]);
    R.nodes.forEach((nd, i) => { ['L', 'R'].forEach(sd => { const f = r.fb && r.fb[i] && r.fb[i][sd]; if (nd.orig && f && !f.ok && nd.sta >= a && nd.sta <= b) D.text(X(nd.sta), Y(f.top) + th * 0.5, th * 0.7, `×出水高不足 ${hyF(f.fb)}`, 'HY_FB', 1, { align: 'c', valign: 'b' }); }); }); });
}
function hyPlanMarks() {   // 出水高不足位置（平面）
  const R = state.hyRes, out = []; if (!R || !state.hy.show.plan) return out; const seen = new Set();
  hyBad().forEach(b => { const nd = R.nodes[b.i], sec = nd.sec; if (!sec) return; const key = b.sd + sec.sta.toFixed(2); if (seen.has(key)) return; seen.add(key); const g = nd.g, a = g.a0[b.sd] ?? 0, L = b.sd === 'L' ? sec.readL : sec.readR;
    const ex = b.sd === 'L' ? sec.lx : sec.rx, ey = b.sd === 'L' ? sec.ly : sec.ry, t = L > 1e-6 ? a / L : 0; out.push({ x: sec.cx + (ex - sec.cx) * t, y: sec.cy + (ey - sec.cy) * t, fb: b.fb, k: b.k }); });
  return out;
}
function hyDrawPlan() {
  if (state.viewMode !== '2D') return; hyPlanMarks().forEach(m => { const s = worldToScreen2D(m.x, m.y); ctx.save(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s.x - 4, s.y - 4); ctx.lineTo(s.x + 4, s.y + 4); ctx.moveTo(s.x + 4, s.y - 4); ctx.lineTo(s.x - 4, s.y + 4); ctx.stroke(); ctx.restore(); });
}
function hyDxfPlan(D) { hyPlanMarks().forEach(m => { D.poly([[m.x - 0.6, m.y - 0.6], [m.x + 0.6, m.y + 0.6]], 'HY_FB', 1, 0, false); D.poly([[m.x - 0.6, m.y + 0.6], [m.x + 0.6, m.y - 0.6]], 'HY_FB', 1, 0, false); D.text(m.x + 1, m.y + 1, 0.9, `Q${m.k} 出水高不足 ${hyF(m.fb)}`, 'HY_FB', 1); }); }

/* ---- 面板 ---- */
function hyAddQ() { pushUndoSnapshot(); const L = state.hy.Q[state.hy.Q.length - 1]; state.hy.Q.push({ s0: null, s1: null, q25: L ? L.q25 : null, q50: L ? L.q50 : null }); hyPanelUI(); }
function hyDelQ(i) { if (state.hy.Q.length < 2) return; pushUndoSnapshot(); state.hy.Q.splice(i, 1); hyPanelUI(); }
function hyAddN() { pushUndoSnapshot(); state.hy.nseg.push({ s0: null, s1: null, main: null, left: null, right: null }); hyPanelUI(); }
function hyDelN(i) { pushUndoSnapshot(); state.hy.nseg.splice(i, 1); hyPanelUI(); }
function hySet(kind, i, f, v) {
  pushUndoSnapshot(); const H = state.hy;
  const sta = t => { const s = String(t).trim(); if (s === '') return null; const x = typeof rvParseSta === 'function' ? rvParseSta(s) : parseFloat(s); return Number.isFinite(x) ? x : null; };
  if (kind === 'Q') { const g = H.Q[i]; g[f] = f === 's0' || f === 's1' ? sta(v) : hyNum(v); }
  else if (kind === 'nseg') { const g = H.nseg[i]; g[f] = f === 's0' || f === 's1' ? sta(v) : hyNum(v); }
  else if (kind === 'n') { const x = hyNum(v); if (x > 0) H.n[f] = x; }
  else if (kind === 'rvn') { const x = hyNum(v); if (x > 0) H.rvn[f] = x; }
  else if (kind === 'bc') { const b = H.bc[i]; if (f === 'm') b.m = v; else b[f] = hyNum(v); }
  else if (kind === 'g') { if (f === 'dx') H.dx = Math.max(0.5, hyNum(v) || 5); else if (f === 'fb') { const x = hyNum(v); H.fb = x === null ? null : Math.max(0, x); } else if (f === 'alpha') H.alpha = Math.max(0, hyNum(v) ?? 0); else if (f === 'weirC') H.weirC = Math.max(0.1, hyNum(v) || 0.6); else H[f] = v; }
  else if (kind === 'show') H.show[f] = !!v;
  else if (kind === 'rvAuto') H.rvAuto = !!v;
  hyCheckStale(); hyPanelUI(); requestRedraw();
}
function hyPanelUI() {
  const box = document.getElementById('hyPanel'); if (!box) return; if (box.contains(document.activeElement) && ['INPUT', 'SELECT'].includes(document.activeElement.tagName) && document.activeElement.type !== 'checkbox') return;
  hyCheckStale(); const H = state.hy, R = state.hyRes;
  const inp = (kind, i, f, v, w, ph) => `<input class="input-num" style="width:${w || 56}px;" value="${v === null || v === undefined ? '' : v}" placeholder="${ph || ''}" onchange="hySet('${kind}',${i},'${f}',this.value)">`;
  const stv = v => (v === null || v === undefined ? '' : fmtSta(v));
  const qRows = H.Q.map((g, i) => `<tr><td>${inp('Q', i, 's0', stv(g.s0), 58, '起點')}</td><td>${inp('Q', i, 's1', stv(g.s1), 58, '終點')}</td><td>${inp('Q', i, 'q25', g.q25, 44)}</td><td>${inp('Q', i, 'q50', g.q50, 44)}</td><td><button class="btn" style="padding:1px 6px;" onclick="hyDelQ(${i})">✕</button></td></tr>`).join('');
  const nRows = H.nseg.map((g, i) => `<tr><td>${inp('nseg', i, 's0', stv(g.s0), 56, '起點')}</td><td>${inp('nseg', i, 's1', stv(g.s1), 56, '終點')}</td><td>${inp('nseg', i, 'left', g.left, 40)}</td><td>${inp('nseg', i, 'main', g.main, 40)}</td><td>${inp('nseg', i, 'right', g.right, 40)}</td><td><button class="btn" style="padding:1px 6px;" onclick="hyDelN(${i})">✕</button></td></tr>`).join('');
  const bcRow = k => `<div style="display:flex;gap:6px;align-items:center;font-size:11px;margin-top:2px;"><b style="color:${HY_COL[k]};width:34px;">Q${k}</b><select class="input-select" style="width:92px;" onchange="hySet('bc',${k},'m',this.value)"><option value="normal"${H.bc[k].m !== 'wse' ? ' selected' : ''}>正常水深</option><option value="wse"${H.bc[k].m === 'wse' ? ' selected' : ''}>指定水位</option></select>${H.bc[k].m === 'wse' ? `水位 ${inp('bc', k, 'w', H.bc[k].w, 62)} m` : `坡降 ${inp('bc', k, 'S', H.bc[k].S, 56, '河床坡')}`}</div>`;
  let res = '';
  if (R) {
    const bad = hyBad(), rows = [];
    R.nodes.forEach((nd, i) => { if (!nd.orig) return; const c = k => { const r = R.runs[k]; if (!r || !Number.isFinite(r.W[i])) return '<td colspan="4" style="text-align:center;color:#94a3b8;">—</td>'; const regs = { sub: '緩', sup: '急', crit: '臨', weir: '堰' }; return `<td style="color:${HY_COL[k]};text-align:right;">${hyF(r.W[i])}</td><td style="text-align:right;">${hyF(r.depth[i])}</td><td style="text-align:right;">${hyF(r.V[i], 1)}</td><td style="text-align:right;" title="${r.flag[i] || ''}">${hyF(r.Fr[i])}${regs[r.reg[i]] || ''}</td>`; };
      const fb = k => { const r = R.runs[k]; if (!r) return ''; const f = r.fb[i]; const t = sd => (f[sd] ? `<span style="color:${f[sd].ok ? '#16a34a' : '#ef4444'};font-weight:${f[sd].ok ? 400 : 700};">${hyF(f[sd].fb)}</span>` : '–'); return `${t('L')}/${t('R')}`; };
      rows.push(`<tr><td>${fmtSta(nd.sta)}${nd.g.side && nd.g.side !== '' ? `<span style="color:#94a3b8;font-size:9.5px;"> ${{ pre: '前', post: '後', up: '上', dn: '下' }[nd.g.side] || ''}</span>` : ''}</td><td style="text-align:right;">${hyF(nd.g.zmin)}</td>${c(25)}<td style="text-align:center;font-size:10.5px;">${fb(25)}</td>${c(50)}<td style="text-align:center;font-size:10.5px;">${fb(50)}</td></tr>`); });
    res = `<div style="margin-top:6px;font-size:11.5px;line-height:1.6;">${state.hyStale ? '<b style="color:#b45309;">⚠ 輸入或斷面已變更，請按「計算水面線」更新。</b><br>' : ''}流向：樁號${R.dir > 0 ? '遞增' : '遞減'}方向　要求出水高 ${hyFbTxt(R)}　出水高不足 <b style="color:${bad.length ? '#ef4444' : '#16a34a'};">${bad.length}</b> 處${bad.length ? '（' + bad.slice(0, 6).map(b => `Q${b.k} ${fmtSta(b.sta)}${b.sd === 'L' ? '左' : '右'} ${hyF(b.fb)}`).join('、') + (bad.length > 6 ? '…' : '') + '）' : ''}
      ${R.warns.length ? `<div style="color:#b45309;font-size:10.5px;margin-top:2px;">${R.warns.slice(0, 8).map(escAttr).join('<br>')}</div>` : ''}</div>
      <div class="pt-table-wrap" style="max-height:260px;margin-top:4px;"><table class="pt-table" style="font-size:10.5px;"><thead><tr><th rowspan="2">樁號</th><th rowspan="2">河床低點</th><th colspan="4" style="color:${HY_COL[25]};">Q25</th><th rowspan="2">出水高 左/右</th><th colspan="4" style="color:${HY_COL[50]};">Q50</th><th rowspan="2">出水高 左/右</th></tr><tr><th>水位</th><th>水深</th><th>V</th><th>Fr</th><th>水位</th><th>水深</th><th>V</th><th>Fr</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Fr 後字：緩＝亞臨界、急＝超臨界、臨＝臨界控制、堰＝壩溢流堰上游水位。V 單位 m/s，水位、水深、出水高單位 m。</div>`;
  }
  box.innerHTML = `<div class="sec-card"><div class="sec-title"><span>🌊 水力檢核（概估）</span></div>
    <div style="font-size:10.5px;color:var(--text-muted);line-height:1.55;">一維恆定流標準步推法；Q25、Q50 同時計算，畫在縱斷面（水面線）與橫斷面（水位、水深、流速），並檢核護岸出水高。</div>
    <div style="font-size:11px;font-weight:700;color:#0369a1;margin:6px 0 2px;">① 設計流量 Q（m³/s，可依樁號分段）</div>
    <div class="pt-table-wrap"><table class="pt-table" style="font-size:11px;"><thead><tr><th>起點樁號</th><th>終點樁號</th><th style="color:${HY_COL[25]};">Q25</th><th style="color:${HY_COL[50]};">Q50</th><th></th></tr></thead><tbody>${qRows}</tbody></table></div>
    <button class="btn" style="margin-top:3px;" onclick="hyAddQ()">＋ 新增分段（支流匯入等）</button><span style="font-size:10px;color:var(--text-muted);"> 起終點空白＝全線；後面的分段覆蓋前面。</span>
    <div style="font-size:11px;font-weight:700;color:#0369a1;margin:8px 0 2px;">② 曼寧糙度 n</div>
    <div style="display:flex;gap:6px;align-items:center;font-size:11px;">左岸 ${inp('n', 0, 'left', H.n.left, 46)} 主槽 ${inp('n', 0, 'main', H.n.main, 46)} 右岸 ${inp('n', 0, 'right', H.n.right, 46)}</div>
    ${H.nseg.length ? `<div class="pt-table-wrap" style="margin-top:3px;"><table class="pt-table" style="font-size:11px;"><thead><tr><th>起點</th><th>終點</th><th>左岸</th><th>主槽</th><th>右岸</th><th></th></tr></thead><tbody>${nRows}</tbody></table></div>` : ''}
    <button class="btn" style="margin-top:3px;" onclick="hyAddN()">＋ n 值分段（空白欄＝沿用全線值）</button>
    <label style="display:flex;gap:6px;align-items:center;font-size:11px;margin-top:5px;"><input type="checkbox" ${H.rvAuto ? 'checked' : ''} onchange="hySet('rvAuto',0,'',this.checked)"> 護岸面依護岸型式自動採用 n（國際通用表 Chow 1959）</label>
    ${H.rvAuto ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 8px;font-size:11px;margin-top:2px;">${Object.keys(HY_RVC).map(k => `<label style="display:flex;justify-content:space-between;align-items:center;gap:4px;"><span>${HY_RVC[k]}</span>${inp('rvn', 0, k, H.rvn[k], 44)}</label>`).join('')}</div>` : ''}
    <div style="font-size:11px;font-weight:700;color:#0369a1;margin:8px 0 2px;">③ 邊界與設定</div>
    <label style="display:flex;justify-content:space-between;align-items:center;font-size:11px;"><span>水流方向</span><select class="input-select" style="width:150px;" onchange="hySet('g',0,'dir',this.value)"><option value="auto"${H.dir === 'auto' ? ' selected' : ''}>自動（依河床高低）</option><option value="+"${H.dir === '+' ? ' selected' : ''}>順樁號遞增</option><option value="-"${H.dir === '-' ? ' selected' : ''}>順樁號遞減</option></select></label>
    <div style="font-size:11px;margin-top:3px;">下游起算水位：</div>${bcRow(25)}${bcRow(50)}
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-size:11px;margin-top:4px;"><label>計算間距 ${inp('g', 0, 'dx', H.dx, 40)} m</label><label title="空白＝依手冊自動：Q≤200→0.6、200~500→0.8、>500→1.0 m；有填＝手動覆蓋">出水高 ${inp('g', 0, 'fb', H.fb, 40, '自動')} m</label><label title="設計洪水量 Qd=(1+α)Qp（水保手冊2.1.2）；上方 Q 欄填清水流量 Qp，α 空白＝0">含砂 α ${inp('g', 0, 'alpha', H.alpha || '', 36, '0')}</label><label title="防砂壩溢洪口 梯形堰流量係數">堰係數 C ${inp('g', 0, 'weirC', H.weirC, 40)}</label></div>
    <div style="font-size:11px;font-weight:700;color:#0369a1;margin:8px 0 2px;">④ 顯示</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;"><span style="color:var(--text-muted);">流量：</span>${['25', '50'].map(k => `<label style="color:${HY_COL[k]};"><input type="checkbox" ${H.show[k] ? 'checked' : ''} onchange="hySet('show',0,'${k}',this.checked)"> Q${k}</label>`).join('')}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;margin-top:2px;"><span style="color:var(--text-muted);">畫面：</span>${[['prof', '縱斷面'], ['cross', '橫斷面'], ['plan', '平面圖（出水高不足）'], ['v3d', '3D']].map(a => `<label><input type="checkbox" ${H.show[a[0]] ? 'checked' : ''} onchange="hySet('show',0,'${a[0]}',this.checked)"> ${a[1]}</label>`).join('')}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;margin-top:2px;"><label><input type="checkbox" ${H.show.lab ? 'checked' : ''} onchange="hySet('show',0,'lab',this.checked)"> 橫斷面標水深、流速</label><label><input type="checkbox" ${H.show.flow ? 'checked' : ''} onchange="hySet('show',0,'flow',this.checked)"> 3D 依流況上色（藍＝緩流、橘＝急流）</label></div>
    <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">以上勾選同時控制畫面與 DXF 輸出。</div>
    <button class="btn primary" style="width:100%;margin-top:6px;" onclick="hyRun()">▶ 計算水面線</button><button class="btn" style="width:100%;margin-top:4px;" onclick="hyClear()">🗑 清除水力結果（圖面水位、檢核表）</button>${res}
    <div style="font-size:10px;color:var(--text-muted);margin-top:6px;line-height:1.5;">概估限制：不處理橋、匯流、非恆定流；防砂壩下游淹沒與壩前淤砂不另計；水躍位置由動量函數判定。成果需由專業人員複核。</div></div>`;
}
function hySheet() {
  const R = state.hyRes; if (!R) return null; const H = a => a.map(v => ({ v, s: 1 })), r2 = v => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : ''), rows = [[{ v: '水力檢核（概估）', s: 5 }], [`一維恆定流標準步推法；出水高要求 ${hyFbTxt(R)}；流向：樁號${R.dir > 0 ? '遞增' : '遞減'}`],
    [`Q25 = ${R.runs[25] ? hyF(R.runs[25].Q.find(v => v > 0), 2) : '—'} m³/s　Q50 = ${R.runs[50] ? hyF(R.runs[50].Q.find(v => v > 0), 2) : '—'} m³/s（可分段，見各列）`], [],
    H(['樁號', '斷面', '河床低點 m', 'Q25 m³/s', 'Q25 水位 m', 'Q25 水深 m', 'Q25 V m/s', 'Q25 Fr', 'Q25 左出水高 m', 'Q25 右出水高 m', 'Q50 m³/s', 'Q50 水位 m', 'Q50 水深 m', 'Q50 V m/s', 'Q50 Fr', 'Q50 左出水高 m', 'Q50 右出水高 m', '備註'])];
  R.nodes.forEach((nd, i) => { if (!nd.orig) return; const o = [fmtSta(nd.sta), { pre: '前', post: '後', up: '上', dn: '下' }[nd.g.side] || '', r2(nd.g.zmin)], notes = [];
    [25, 50].forEach(k => { const r = R.runs[k]; if (!r || !Number.isFinite(r.W[i])) { o.push('', '', '', '', '', '', ''); return; } const f = r.fb[i]; o.push(r2(r.Q[i]), r2(r.W[i]), r2(r.depth[i]), r2(r.V[i]), r2(r.Fr[i]), f.L ? r2(f.L.fb) : '', f.R ? r2(f.R.fb) : ''); ['L', 'R'].forEach(sd => { if (f[sd] && !f[sd].ok) notes.push(`Q${k} ${sd === 'L' ? '左' : '右'}岸出水高不足`); }); if (r.flag[i]) notes.push(`Q${k} ${r.flag[i]}`); });
    o.push(notes.join('；')); rows.push(o); });
  if (R.warns.length) { rows.push([]); R.warns.forEach(w => rows.push([w])); }
  rows.push([], ['符號：Fr＝弗勞數（<1 亞臨界、>1 超臨界）；出水高＝護岸頂高−水位。']);
  return { name: '水力檢核', cols: [12, 6, 11, 10, 11, 10, 10, 8, 12, 12, 10, 11, 10, 10, 8, 12, 12, 34], rows, freeze: 5, merges: ['A1:R1'] };
}


/* ---- 3D 水面（半透明水面帶，由遠到近繪製）＋出水高不足標記 ---- */
function hyNodePos(nd, o) { if (!nd._c) nd._c = getPointAndNormalAtStation(nd.sta); const c = nd._c; return c ? [c.x - c.nx * o, c.y - c.ny * o] : null; }
function hyDraw3D() {
  const R = state.hyRes; if (!R || !state.hy.show.v3d || !state.coreBounds || !state.bounds) return;
  const dpr = window.devicePixelRatio || 1, w = cadCanvas.width / dpr, h = cadCanvas.height / dpr, { minX, maxX, minY, maxY } = state.coreBounds, { minZ, maxZ } = state.bounds;
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2, midZ = (minZ + maxZ) / 2, span = Math.max(maxX - minX, maxY - minY) || 100, zExag = parseFloat(document.getElementById('zScaleSlider').value) || 2.0;
  const cosY = Math.cos(state.cam3D.yaw), sinY = Math.sin(state.cam3D.yaw), cosP = Math.cos(state.cam3D.pitch), sinP = Math.sin(state.cam3D.pitch), scale3D = (Math.min(w, h) * 0.68 / span) * state.cam3D.zoom;
  const pj = (wx, wy, wz) => { const x = wx - midX, y = wy - midY, z = (wz - midZ) * zExag, rx = x * cosY - y * sinY, ry = x * sinY + y * cosY; return { sx: w / 2 + rx * scale3D, sy: h / 2 + (ry * sinP - z * cosP) * scale3D, depth: ry * cosP + z * sinP }; };
  const quads = [];
  [50, 25].forEach(k => { const r = R.runs[k]; if (!r || !state.hy.show[k]) return; if (!r.ext) r.ext = R.nodes.map((nd, i) => (Number.isFinite(r.W[i]) ? hyExtent(nd.g, r.W[i]) : null));
    for (let i = 0; i < R.nodes.length - 1; i++) { const a = R.nodes[i], b = R.nodes[i + 1], ea = r.ext[i], eb = r.ext[i + 1]; if (!ea || !eb || Math.abs(a.sta - b.sta) < 1e-6) continue;
      const pa0 = hyNodePos(a, ea[0]), pa1 = hyNodePos(a, ea[1]), pb0 = hyNodePos(b, eb[0]), pb1 = hyNodePos(b, eb[1]); if (!pa0 || !pa1 || !pb0 || !pb1) continue;
      const V = [pj(pa0[0], pa0[1], r.W[i]), pj(pa1[0], pa1[1], r.W[i]), pj(pb1[0], pb1[1], r.W[i + 1]), pj(pb0[0], pb0[1], r.W[i + 1])], sup = r.reg[i] === 'sup' || r.reg[i] === 'crit' || r.reg[i + 1] === 'sup';
      quads.push({ V, k, sup, depth: (V[0].depth + V[1].depth + V[2].depth + V[3].depth) / 4 }); } });
  quads.sort((p, q) => q.depth - p.depth);
  ctx.save(); ctx.scale(dpr, dpr);
  quads.forEach(q => { const fl = state.hy.show.flow; ctx.fillStyle = fl && q.sup ? (q.k === 25 ? 'rgba(251,146,60,.62)' : 'rgba(244,63,94,.45)') : (q.k === 25 ? 'rgba(56,189,248,.62)' : 'rgba(167,139,250,.45)'); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); q.V.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy))); ctx.closePath(); ctx.fill(); ctx.stroke(); });
  if (state.hy.show.plan) hyBad().forEach(b => { const nd = R.nodes[b.i], f = R.runs[b.k].fb[b.i][b.sd], o = b.sd === 'L' ? -(nd.g.a0[b.sd] ?? 0) : (nd.g.a0[b.sd] ?? 0), P = hyNodePos(nd, o); if (!P) return; const p = pj(P[0], P[1], f.top + 0.3);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(p.sx, p.sy, 5, 0, 6.2832); ctx.moveTo(p.sx - 3.5, p.sy - 3.5); ctx.lineTo(p.sx + 3.5, p.sy + 3.5); ctx.moveTo(p.sx + 3.5, p.sy - 3.5); ctx.lineTo(p.sx - 3.5, p.sy + 3.5); ctx.stroke(); });
  ctx.font = '11px "Noto Sans TC"'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; let yy = h - 14; [25, 50].forEach(k => { if (!R.runs[k] || !state.hy.show[k]) return; ctx.fillStyle = HY_COL[k]; ctx.fillText(`■ Q${k} 水面${state.hyStale ? '（輸入已變更，請重算）' : ''}`, 14, yy); yy -= 14; });
  if (state.hy.show.flow) { ctx.fillStyle = '#fb923c'; ctx.fillText('■ 橘＝急流／臨界', 14, yy); }
  ctx.restore();
}

/* ---- 掛勾 ---- */
(function () {
  const _dp = rvDrawPlan; rvDrawPlan = function () { _dp(); try { hyDrawPlan(); } catch (e) { console.error('hyDrawPlan', e); } };
  const _xp = rvDxfPlan; rvDxfPlan = function (D) { _xp(D); try { hyDxfPlan(D); } catch (e) { console.error('hyDxfPlan', e); } };
  const _dc = rvDrawCross; rvDrawCross = function (sec, sx, sy, isLarge) { _dc(sec, sx, sy, isLarge); try { hyDrawCross(sec, sx, sy, isLarge); } catch (e) { console.error('hyDrawCross', e); } };
  const _xc = rvDxfCross; rvDxfCross = function (D, sec, sx, sy, TH) { _xc(D, sec, sx, sy, TH); try { hyDxfCross(D, sec, sx, sy, TH); } catch (e) { console.error('hyDxfCross', e); } };
  const _pp = rvDrawProfile; rvDrawProfile = function (sx, sy, a, b) { _pp(sx, sy, a, b); try { hyDrawProfile(sx, sy, a, b); } catch (e) { console.error('hyDrawProfile', e); } };
  const _xpp = rvDxfProfile; rvDxfProfile = function (D, X, Y, a, b, th) { _xpp(D, X, Y, a, b, th); try { hyDxfProfile(D, X, Y, a, b, th); } catch (e) { console.error('hyDxfProfile', e); } };
  const _r3 = render3DTerrain; render3DTerrain = function () { _r3(); try { hyDraw3D(); } catch (e) { console.error('hyDraw3D', e); } };
  const _cp = collectProject; collectProject = function () { const o = _cp(); o.data.hy = hyClean(); return o; };
  const _ap = applyProject; applyProject = function (obj, fname) { state.hy = hyNorm(obj && obj.data && obj.data.hy); state.hyRes = null; state.hyStale = false; _ap(obj, fname); hyPanelUI(); };
  const _pu = pushUndoSnapshot; pushUndoSnapshot = function () { _pu(); try { const n = state.undoStack.length - 1, o = JSON.parse(state.undoStack[n]); o.hy = hyClean(); state.undoStack[n] = JSON.stringify(o); } catch (e) { } };
  const _un = undoLastAction; undoLastAction = function () { let hy = null; try { const t = state.undoStack[state.undoStack.length - 1]; hy = t ? JSON.parse(t).hy : null; } catch (e) { } _un(); if (hy) { state.hy = hyNorm(hy); hyCheckStale(); hyPanelUI(); requestRedraw(); } };
  const _bk = stQtyBook; stQtyBook = function () { const B = _bk(); let s = null; try { s = hySheet(); } catch (e) { console.error('hySheet', e); } if (s) { B.sheets.push(s); B.n += 1; } return B; };
})();
