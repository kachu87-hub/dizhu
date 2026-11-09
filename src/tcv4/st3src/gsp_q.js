/* ---- v8.0 固床工＋基樁：幾何模型（cm）。斷面 x＝自下游趾（止滑齒側）往上游，z＝自止滑齒底往上 ---- */
let __P = {};
function getParams() {
  const p = Object.assign({}, __P);
  p.L_total = p.W_wing_L + p.W_slope_L + p.W_weir + p.W_slope_R + p.W_wing_R;
  p.L_base = p.L_total - p.L_ret_L - p.L_ret_R;
  p.H_total = p.H_wing_drop + p.H_upper + p.H_mid + p.H_notch + p.H_lower + p.H_key;
  p.B_weir = p.B_top + p.H_wing_drop * p.m_up;                    // y5 處寬（由頂寬與下游坡推得）
  p.B_mid = p.B_top + (p.H_wing_drop + p.H_upper) * p.m_up;       // y4 處寬
  p.N_pile = getPilePositions(p).length;
  return p;
}
function __gsY(p) { const y0 = 0, y1 = y0 + p.H_key, y2 = y1 + p.H_lower, y3 = y2 + p.H_mid, y4 = y3 + p.H_notch, y5 = y4 + p.H_upper, y6 = y5 + p.H_wing_drop; return { y0, y1, y2, y3, y4, y5, y6 }; }
function __gsSec(p) {   // 最大斷面（翼牆處）頂點，逆時針
  const { y0, y1, y2, y3, y4, y5, y6 } = __gsY(p), xBack = p.B_base, xApronL = p.B_base - p.B_apron, xMidL = xApronL + (p.H_mid + p.H_notch) * p.m_mid,
    xWeirL = xMidL + p.H_upper * p.m_up, xTopL = xWeirL + p.H_wing_drop * p.m_up, xTopR = xTopL + p.B_top, xKeyBotR = p.B_key, xKeyTopR = p.B_key + p.H_key * p.m_key;
  const poly = [[0, y0], [xKeyBotR, y0], [xKeyTopR, y1], [xBack, y1], [xBack, y2], [xTopR, y3], [xTopR, y6], [xTopL, y6], [xWeirL, y5], [xMidL, y4], [xApronL, y2], [0, y1]];
  const formed = [[[0, y1], [xApronL, y2]], [[xApronL, y2], [xMidL, y4]], [[xMidL, y4], [xWeirL, y5]], [[xWeirL, y5], [xTopL, y6]], [[xTopR, y6], [xTopR, y3]], [[xTopR, y3], [xBack, y2]], [[xBack, y2], [xBack, y1]]];
  return { poly, formed, xBack, xApronL, xMidL, xWeirL, xTopL, xTopR, xKeyBotR, xKeyTopR };
}
function __gsClip(poly, zb, zt) {   // 斷面多邊形取 zb ≤ z ≤ zt
  const cut = (P, z, keepAbove) => { const o = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = keepAbove ? a[1] >= z : a[1] <= z, ib = keepAbove ? b[1] >= z : b[1] <= z; if (ia) o.push(a); if (ia !== ib) { const t = (z - a[1]) / (b[1] - a[1]); o.push([a[0] + t * (b[0] - a[0]), z]); } } return o; };
  return cut(cut(poly, zb, true), zt, false);
}
function __gsArea(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
function __gsTop(p, X) {   // 正視頂緣 z(X)
  const { y3, y4, y5, y6 } = __gsY(p), x1 = p.W_wing_L, x2 = x1 + p.W_slope_L, x3 = x2 + p.W_weir, x4 = x3 + p.W_slope_R, L = p.L_total, xC = (x2 + x3) / 2, li = (xa, za, xb, zb) => za + (zb - za) * (X - xa) / ((xb - xa) || 1);
  if (X <= x1) return li(0, y6, x1, y5); if (X <= x2) return li(x1, y5, x2, y4); if (X <= xC) return li(x2, y4, xC, y3); if (X <= x3) return li(xC, y3, x3, y4); if (X <= x4) return li(x3, y4, x4, y5); return li(x4, y5, L, y6);
}
function __gsBot(p, X) {   // 正視底緣（兩端基礎斜退）
  const { y0, y5 } = __gsY(p), L = p.L_total;
  if (X < p.L_ret_L) return y5 + (y0 - y5) * X / p.L_ret_L; if (X > L - p.L_ret_R) return y5 + (y0 - y5) * (L - X) / p.L_ret_R; return y0;
}
function __gsBreaks(p) { const x1 = p.W_wing_L, x2 = x1 + p.W_slope_L, x3 = x2 + p.W_weir, x4 = x3 + p.W_slope_R, L = p.L_total; return [0, p.L_ret_L, x1, x2, (x2 + x3) / 2, x3, x4, L - p.L_ret_R, L].filter(v => v >= 0 && v <= L).sort((a, b) => a - b); }
function __gsInt(p, fn) {   // ∫ fn(X) dX，各段 Simpson（每段 60 格）
  const B = __gsBreaks(p); let s = 0;
  for (let i = 0; i + 1 < B.length; i++) { const a = B[i], b = B[i + 1]; if (b - a < 1e-9) continue; const n = 60, h = (b - a) / n; let t = fn(a + 1e-7) + fn(b - 1e-7); for (let k = 1; k < n; k++) t += (k % 2 ? 4 : 2) * fn(a + k * h); s += t * h / 3; }
  return s;
}
function __gsPlan(p) {   // 平面外框（x 正視位置, y 斷面位置）
  const S = __gsSec(p), B = __gsBreaks(p), xs = []; for (let i = 0; i + 1 < B.length; i++) for (let k = 0; k < 12; k++) xs.push(B[i] + (B[i + 1] - B[i]) * k / 12); xs.push(p.L_total);
  const lo = [], hi = []; xs.forEach(X => { const c = __gsClip(S.poly, __gsBot(p, X), __gsTop(p, X)); if (c.length < 3) return; let a = Infinity, b = -Infinity; c.forEach(q => { a = Math.min(a, q[0]); b = Math.max(b, q[0]); }); lo.push([X, a]); hi.push([X, b]); });
  return lo.concat(hi.reverse());
}
function __gsCrest(p) {   // 頂面下游緣（y 隨 X）
  const S = __gsSec(p), B = __gsBreaks(p), out = []; for (let i = 0; i + 1 < B.length; i++) for (let k = 0; k <= 12; k++) { const X = B[i] + (B[i + 1] - B[i]) * k / 12, c = __gsClip(S.poly, __gsBot(p, X), __gsTop(p, X)); if (c.length > 2) out.push([X, Math.min(...c.filter(q => Math.abs(q[1] - __gsTop(p, X)) < 1e-6).map(q => q[0]))]); }
  return out.filter(q => Number.isFinite(q[1]));
}
function getPilePositions(p) {   // 回傳 [{x, row}]，x＝正視位置（cm，自左端）
  const xCenter = p.W_wing_L + p.W_slope_L + p.W_weir / 2, out = [];
  if (p.pmode === 'AUTO') {
    const xs = [], hd = p.S_dense / 2, hs = p.S_sparse / 2;
    for (let x = p.xd0; x <= p.xd1 + 1e-6; x += hd) xs.push(x);
    for (let x = p.xd0 - hs; x >= p.xs0 - 1e-6; x -= hs) xs.unshift(x);
    for (let x = p.xd1 + hs; x <= p.xs1 + 1e-6; x += hs) xs.push(x);
    xs.forEach((x, i) => out.push({ x: xCenter + x, row: i % 2 }));
  } else {
    (p.rowU || []).forEach(x => out.push({ x: xCenter + x, row: 0 })); (p.rowD || []).forEach(x => out.push({ x: xCenter + x, row: 1 }));
    out.sort((a, b) => a.x - b.x);
  }
  return out;
}
function calcQuantities(p) {
  const S = __gsSec(p), m = v => v / 100;
  const Vg = __gsInt(p, X => __gsArea(__gsClip(S.poly, __gsBot(p, X), __gsTop(p, X))));
  const segLen = (a, b, zb, zt) => { const lo = Math.max(zb, Math.min(a[1], b[1])), hi = Math.min(zt, Math.max(a[1], b[1])), dz = Math.abs(b[1] - a[1]); if (dz < 1e-9) return 0; return hi > lo ? Math.hypot(b[0] - a[0], dz) * (hi - lo) / dz : 0; };
  const Fg = __gsInt(p, X => { const zb = Math.max(__gsBot(p, X), __gsY(p).y1), zt = __gsTop(p, X); return S.formed.reduce((s, [a, b]) => s + segLen(a, b, zb, zt), 0); });
  const piles = getPilePositions(p), nP = piles.length, Ap = Math.PI * Math.pow(p.D_pile / 2, 2);
  const Vemb = nP * Ap * p.L_embed;
  const sillConc = +((Vg - Vemb) / 1e6).toFixed(2), sillForm = +(Fg / 1e4).toFixed(2), sillRebar = +(sillConc * p.rbk).toFixed(2);
  // 基樁（每支，依配筋逐支計算）
  const mainLen = +((p.L_pile - p.c_main) / 100).toFixed(2);
  const w1 = +(p.N_main * mainLen * p.w32).toFixed(2);
  const nHoop2 = Math.round((p.L_pile - p.L_embed) / p.s_h2);
  const lenHoop2 = +(Math.PI * (p.D_pile - p.d_h2) / 100 + p.lap2 / 100).toFixed(2);
  const w2 = +(nHoop2 * lenHoop2 * p.w16).toFixed(2);
  const nHoop3 = Math.round((p.L_pile - p.L_embed) / p.s_h3);
  const lenHoop3 = +(Math.PI * (p.D_pile - p.d_h3) / 100 + p.lap3 / 100).toFixed(2);
  const w3 = +(nHoop3 * lenHoop3 * p.w16).toFixed(2);
  const sum16 = +(w2 + w3).toFixed(2), loss16 = +(sum16 * p.k16).toFixed(2), loss32 = +(w1 * p.k32).toFixed(2), pileRebarTotal = +(loss16 + loss32).toFixed(2);
  const pileConc = +(Ap / 1e4 * (p.L_pile / 100)).toFixed(2);
  return { sillConc, sillForm, sillRebar, Vg: Vg / 1e6, Vemb: Vemb / 1e6, nP, mainLen, w1, nHoop2, lenHoop2, w2, nHoop3, lenHoop3, w3, sum16, loss16, loss32, pileRebarTotal, pileConc, drill: m(p.L_pile - p.L_embed) };
}
