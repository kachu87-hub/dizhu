/* ---- v8.7 共用：ViewBuilder 圖元 → 本系統 O（cm、y 向上）；數量表圖元；多邊形量測 ---- */
const G87 = {
  O(items, LC, skip) {
    const O = [], col = l => ((LC[l] || {}).color || '#ffffff'), sk = skip || ['GHOST'];
    (items || []).forEach(o => { const ly = o.layer || '0'; if (sk.includes(ly)) return; const c = col(ly), d = o.dash && o.dash.length ? o.dash : [];
      if (o.type === 'LINE' || o.type === 'line') O.push({ k: 'L', p: [[o.x1, -o.y1], [o.x2, -o.y2]], c, w: o.lineWidth || 1.3, d, ly });
      else if (o.type === 'POLY' || o.type === 'poly') { if (o.pts && o.pts.length > 1) O.push({ k: 'P', p: o.pts.map(q => [q[0], -q[1]]), c, w: o.lineWidth || 1.4, f: null, cl: !!o.closed, d, ly }); }
      else if (o.type === 'CIRCLE' || o.type === 'circle') O.push({ k: 'C', x: o.cx, y: -o.cy, r: o.r, c, f: o.filled || o.fill ? c : null, w: 1, ly });
      else if (o.type === 'TEXT' || o.type === 'text') O.push({ k: 'T', x: o.x, y: -o.y, s: String(o.text), h: o.size || 10, c, al: o.align || 'center', bl: 'middle', rot: -(o.rotation || o.rot || 0), ly: '文字' }); });
    return O;
  },
  bb(O) { const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity }, f = (x, y) => { b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y); };
    O.forEach(o => { if (o.p) o.p.forEach(q => f(q[0], q[1])); else if (o.k === 'C') { f(o.x - o.r, o.y - o.r); f(o.x + o.r, o.y + o.r); } else if (o.k === 'T') { f(o.x, o.y); f(o.x + String(o.s).length * o.h * 0.9, o.y + o.h); } }); return b; },
  // 數量表（cm）：左上角 (x0, yTop)，y 向上；rows：[{name|it, unit|u, qty|v, formula|fx}]
  tbl(rows, x0, yTop, title, h) {
    h = h || 14; const O = [], cw = [h * 16, h * 4, h * 7, h * 46], rh = h * 2, W = cw.reduce((a, b) => a + b, 0), L = (p, c, w) => O.push({ k: 'P', p, c: c || '#94a3b8', w: w || 1, f: null, cl: false, d: [], ly: 'TABLE' }), T = (s, x, y, al, c, hh) => O.push({ k: 'T', x, y, s: String(s), h: hh || h, c: c || '#e2e8f0', al: al || 'left', bl: 'middle', rot: 0, ly: '文字' });
    T(title, x0, yTop + rh * 0.7, 'left', '#fde047', h * 1.25);
    const R = [['項目', '單位', '數量', '計算式（依圖面幾何）']].concat(rows.map(r => [r.name ?? r.it, r.unit ?? r.u, (+(r.qty ?? r.v)).toFixed(r.dig ?? 2), String(r.formula ?? r.fx ?? '')]));
    R.forEach((r, i) => { const y = yTop - i * rh; let x = x0; L([[x0, y], [x0 + W, y]]); r.forEach((s, j) => { const t = j === 3 && s.length > 60 ? s.slice(0, 60) + '…' : s; T(t, j === 2 ? x + cw[j] - h * 0.4 : x + h * 0.4, y - rh / 2, j === 2 ? 'right' : 'left', i ? '#e2e8f0' : '#38bdf8'); x += cw[j]; }); });
    const yb = yTop - R.length * rh; L([[x0, yb], [x0 + W, yb]]); let x = x0; [0].concat(cw).forEach(w => { x += w; L([[x - (w === 0 ? 0 : 0), yTop], [x, yb]]); });
    L([[x0, yTop], [x0, yb]]); return O;
  },
  A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; },
  chord(poly, z) {   // 多邊形在水平線 z 的截長（偶奇規則）
    const xs = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if ((a[1] - z) * (b[1] - z) < 0 || (a[1] === z && b[1] > z) || (b[1] === z && a[1] > z)) { if (a[1] === b[1]) continue; xs.push(a[0] + (z - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); } }
    xs.sort((a, b) => a - b); let L = 0; for (let i = 0; i + 1 < xs.length; i += 2) L += xs[i + 1] - xs[i]; return L;
  },
  simp(f, a, b, n) { n = Math.max(2, n || 200); if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; },
  lerpZ(pts, z) {   // 折線（依 z 單調）在 z 的 x
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if ((z - a[1]) * (z - b[1]) <= 0 && a[1] !== b[1]) return a[0] + (z - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); }
    return z <= Math.min(pts[0][1], pts[pts.length - 1][1]) ? (pts[0][1] < pts[pts.length - 1][1] ? pts[0][0] : pts[pts.length - 1][0]) : (pts[0][1] > pts[pts.length - 1][1] ? pts[0][0] : pts[pts.length - 1][0]);
  },
  f: (v, d) => (+v).toFixed(d === undefined ? 2 : d)
};
/* 固床工型式（橫向結構物）共用外殼：參數 → 幾何模型（數量、檢核、本系統視圖 m）→ 原圖（標準圖） */
G87.slt = function (cfg) {
  let RR = null; const DEF = cfg.DEF;
  const n = k => { const v = parseFloat(RR && RR[k] !== undefined && RR[k] !== null && RR[k] !== '' ? RR[k] : DEF[k]); return Number.isFinite(v) ? v : parseFloat(DEF[k]); };
  const getParams = () => { const P = Object.assign({}, cfg.H.D0); cfg.PR.forEach(q => { P[q.k.slice(2)] = q.opt ? String(RR && RR[q.k] !== undefined && RR[q.k] !== '' ? RR[q.k] : q.def) : n(q.k); }); (cfg.ints || []).forEach(k => { P[k] = Math.max(cfg.imin && cfg.imin[k] !== undefined ? cfg.imin[k] : 1, Math.round(P[k])); }); if (cfg.fix) cfg.fix(P, RR || {}); return P; };
  return {
    DEF, PR: cfg.PR, GT: cfg.GT, title: cfg.title,
    getParams: R => { RR = R || {}; try { return getParams(); } finally { RR = null; } },
    run(R, opt) {
      RR = R || {};
      try {
        const P = getParams(), M = cfg.model(P); Object.assign(P, M.set || {}, { __M: M });
        let O = [], L = null;
        if (opt && opt.draw) { O = G87.O(cfg.H.draw(Object.assign({}, P)), cfg.H.LC); if (cfg.post) O = cfg.post(O, P, M) || O; L = { V: M.V }; }
        return { P, rows: M.rows, checks: M.checks || [], O, L };
      } finally { RR = null; }
    }
  };
};
G87.row = (no, name, unit, qty, formula, note, dig) => ({ no: String(no), name, unit, qty: +(+qty).toFixed(dig === undefined ? 2 : dig), formula, note: note || '' });
G87.box = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
G87.pv = (p, c, f, d, cl) => ({ p, cl: cl !== false, c: c || '#ffffff', f: f === undefined ? 'rgba(255,255,255,0.05)' : f, d: !!d });
