
/* ============================================================================
   v4.6 護岸：有起迄樁號的物件，左右岸各自獨立（起迄、距中心線距離、高度、型式參數、加高區段）
   - 第一型式：重力式混凝土護岸（依 AutoCAD 範本：背側直立、水側 1:n 斜面、矩形根入基礎、預留沉陷、開挖線、PVC 排水管）
   - 無護岸（也無結構物）的路段：設計線＝地形線；僅護岸範圍產生背填
   - 數量以護岸實長（沿偏移曲線）計：左右岸各列一行，最後合計
   ============================================================================ */
state.revs = []; state.rvSel = -1; state.rvPend = null;
const RV_TYPES = [{ id: 'grav', label: '重力式混凝土', note: '範本：背側直立、水側 1:n、矩形根入基礎' }];
const RV_DEF = { H: 3, b: 0.45, n: 0.3, D: 1.8, ww: 0.45, ec: 0.3, sdx: 0.3, sdz: 0.3, g: 0.05, pon: 1, pdia: 0.075, psp: 2, pz: 1.3, psl: 0.21, jsp: 10, lt: 5, cw: 4, ct: 0.3, crb: 13, crs: 0.3 };
const RV_P = [   // [鍵, 名稱, 步進, 提示]
  ['H', '牆高 H (設計河床以上)', 0.1, '設計河床高以上的牆高；岸頂＝設計河床高＋H（＋加高）'],
  ['b', '頂寬 b', 0.05, '牆頂寬度（背側直立）'],
  ['n', '水側坡 1:n', 0.05, '水側斜面：垂直 1、水平 n；牆底寬＝b＋n×H'],
  ['D', '根入深 D (河床以下)', 0.1, '矩形根入基礎深度；基礎寬＝牆底寬'],
  ['ww', '開挖工作寬', 0.05, '基礎前後各外放的開挖底寬'],
  ['ec', '開挖坡 1:n', 0.05, '開挖邊坡：垂直 1、水平 n'],
  ['sdx', '預留沉陷 橫向', 0.05, '牆頂背角往岸側的橫向距離（背填頂斜線）'],
  ['sdz', '預留沉陷 垂直', 0.05, '牆頂背角上方的預留高度（負值＝向下）'],
  ['g', '背填面坡度(往背後下降)', 0.01, '預留沉陷斜線後，背填面往背後下降的坡度（垂直/水平；0＝水平），遇地形線或開挖邊坡即止'],
];
const RV_PIPE = [['pdia', '管徑 (m)', 0.005], ['psp', '間距 (m)', 0.5], ['pz', '離河床高 (m)', 0.1], ['psl', '向水側下坡 (垂直/水平)', 0.01]];
const rvF = (v, d = 2) => (Number.isFinite(+v) ? (+v).toFixed(d) : '—');
const rvSg = rv => (rv.side === 'L' ? -1 : 1);
const rvSgS = sd => (sd === 'L' ? -1 : 1);
let RV_BUSY = false;

function rvNorm(o) {
  o = o || {}; const type = TC_TYPES[o.type] ? o.type : 'grav', T = tcType(type), op = o.p || {};
  const H0 = Number.isFinite(+op.H) && +op.H > 0 ? +op.H : undefined, p = Object.assign(tcDefaults(type, H0), op);
  T.params.forEach(q => { if (q.u === 'sel') { if (!q.opt.includes(p[q.k])) p[q.k] = q.def; } else if (!Number.isFinite(+p[q.k])) p[q.k] = typeof q.def === 'function' ? q.def(p.H) : q.def; else p[q.k] = +p[q.k]; });
  Object.keys(TC_COMMON_DEF).forEach(k => { if (k === 'sgH') { p.sgH = p.sgH === null || p.sgH === undefined || p.sgH === '' || !Number.isFinite(+p.sgH) ? null : +p.sgH; return; } p[k] = Number.isFinite(+p[k]) ? +p[k] : TC_COMMON_DEF[k]; });
  const num = v => (v === null || v === undefined || v === '' || !Number.isFinite(+v) ? null : +v);
  if (T.sync) { p.N_layer = Math.max(1, Math.min(6, Math.round(p.N_layer || 3))); T.sync(p); }   // v5.5 層數型式：H、D、n 由層數與原工具參數算出
  return { id: o.id || ('rv' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36)), side: o.side === 'R' ? 'R' : 'L', type, s0: num(o.s0), s1: num(o.s1), e0: num(o.e0), e1: num(o.e1), p,
    pt: o.pt && typeof o.pt === 'object' ? JSON.parse(JSON.stringify(o.pt)) : {}, j0: { m: o.j0 && o.j0.m === 'taper' ? 'taper' : 'direct', L: Math.max(0.5, +(o.j0 && o.j0.L) || 10) },
    ign: !!o.ign, cap: { a: !!(o.cap && o.cap.a), b: !!(o.cap && o.cap.b), c: !!(o.cap && o.cap.c) },
    raises: (o.raises || []).map(r => ({ s0: +r.s0, s1: +r.s1, dh: +r.dh || 0, t0: Math.max(0, +r.t0 || 0), t1: Math.max(0, +r.t1 || 0) })).filter(r => Number.isFinite(r.s0) && Number.isFinite(r.s1)),
    wids: (o.wids || []).map(r => ({ s0: +r.s0, s1: +r.s1, de: +r.de || 0, t0: Math.max(0, +r.t0 || 0), t1: Math.max(0, +r.t1 || 0) })).filter(r => Number.isFinite(r.s0) && Number.isFinite(r.s1)),
    cps: (o.cps || []).map(c => ({ s: +c.s, e: +c.e })).filter(c => Number.isFinite(c.s) && Number.isFinite(c.e) && c.e > 0).sort((a, b) => a.s - b.s) };
}
function rvCleanArr(arr) { return (arr || []).map(r => ({ id: r.id, side: r.side, type: r.type, s0: r.s0, s1: r.s1, e0: r.e0, e1: r.e1, ign: !!r.ign, cap: Object.assign({ a: false, b: false, c: false }, r.cap), j0: Object.assign({ m: 'direct', L: 10 }, r.j0), pt: JSON.parse(JSON.stringify(r.pt || {})), p: Object.assign({}, r.p), raises: r.raises.map(q => Object.assign({}, q)), cps: (r.cps || []).map(c => ({ s: c.s, e: c.e })), wids: (r.wids || []).map(q => Object.assign({}, q)) })); }
function rvClean() { return rvCleanArr(state.revs); }
function rvLoad(arr) { state.revs = (arr || []).map(rvNorm); state.rvSel = state.revs.length ? 0 : -1; RV_SIG = ''; }
function rvMigrateFrom(ui) {   // 舊專案：全線護岸斷面樣板 → 兩岸各一段全線重力式護岸（頂寬 0、預留沉陷＝舊「護岸頂斜線」，維持原圖）
  const g = k => { const v = parseFloat(ui && ui[k]); return Number.isFinite(v) ? v : null; };
  const H = g('pfBankH') ?? g('desBankH'); if (!(H > 0)) return [];
  const n = g('desBankSlope'), D = g('pfFoundD') ?? g('desFoundD');
  const mk = side => rvNorm({ side, type: 'grav', s0: null, s1: null, e0: null, e1: null, p: { H, b: 0, n: n !== null && n >= 0 ? n : 0.5, D: D !== null && D >= 0 ? D : 0, ww: 0.5, ec: 0.3, sdx: g('bfDx') ?? 0.3, sdz: g('bfDz') ?? 0.3, g: 0, pon: 0 } });
  return [mk('L'), mk('R')];
}
function rvParseSta(t) {
  t = String(t).trim(); if (t === '') return null;
  const m = /^(\d+)\s*K\s*\+\s*(\d+(?:\.\d+)?)$/i.exec(t); if (m) return +m[1] * 1000 + +m[2];
  const v = parseFloat(t); return Number.isFinite(v) ? v : NaN;
}
function rvLim(rv) { const al = state.alignment; return { a: rv.s0 ?? al.startSta, b: rv.s1 ?? al.endSta }; }
// v6.9：同岸護岸依起點樁號排序編號（起點相同比終點，再比新增順序）；不重排 state.revs，索引不受影響
function rvNo(rv) {
  const A = state.revs.filter(r => r.side === rv.side), L = r => { try { const m = rvLim(r); return [+m.a || 0, +m.b || 0]; } catch (e) { return [0, 0]; } };
  const K = A.map((r, i) => ({ r, i, m: L(r) })); K.sort((u, v) => (u.m[0] - v.m[0]) || (u.m[1] - v.m[1]) || (u.i - v.i));
  return K.findIndex(k => k.r === rv) + 1;
}
function rvName(rv) { return (rv.side === 'L' ? '左' : '右') + '岸護岸' + rvNo(rv); }
function rvShort(rv) { return (rv.side === 'L' ? '左' : '右') + '護' + rvNo(rv); }
/* ---- 結構物截斷區：壩體上游面～下游面；有側牆時延伸至側牆末端。區內不放護岸 ---- */
/* 截斷優先序：哪一種結構物截斷哪一類沿岸結構物（預設全部截斷） */
state.tcPrio = {}; state.rvCatShow = { rev: true, wall: true };
const TC_ZKINDS = [['dam', '防砂壩'], ['sub', '副壩'], ['sill', '固床工']];
const TC_PRIO_DEF = { sill: { rev: false, wall: false } };   // v5.4：副壩比照防砂壩截斷護岸（貼壩面收頭）；固床工預設不截斷   // 預設：固床工不截斷護岸／擋土牆（固床工兩端頂護岸基礎）
function tcPrioOn(kind, cat) { const r = (state.tcPrio || {})[kind]; if (r && r[cat] !== undefined) return r[cat] !== false; const d = TC_PRIO_DEF[kind]; return !d || d[cat] !== false; }
const rvVis = rv => (state.rvCatShow || {})[tcType(rv.type).cat] !== false;
let RV_ZDIRTY = true, RV_ZKEY = '', RV_ZONES = [], RV_ZVER = 0;
function rvZones() {
  const sts = state.structs || [], key = sts.length + '|' + sts.map(t => t.id + ':' + t.sta + ':' + t.dir + ':' + ((t.p && t.p.off) || 0)).join(',');
  if (!RV_ZDIRTY && key === RV_ZKEY) return RV_ZONES;
  const z = [];
  sts.forEach(st => {
    let g = null; try { g = stGeo(st); } catch (e) { g = null; } if (!g) return;
    const zAp = -st.p.h2, uUp = g.uU(0), toe = g.uD(zAp), A = g.acc, hasW = !!(A && A.any && A.walls && A.walls.length), uEnd = hasW ? Math.max(toe, ...A.walls.map(w => w.u1)) : toe;
    const sA = st.sta + st.dir * uUp, sB = st.sta + st.dir * uEnd, sEnd = st.sta + st.dir * uEnd;
    z.push({ a: Math.min(sA, sB), b: Math.max(sA, sB), name: st.name, kind: st.type || 'dam', walls: hasW, endS: sEnd, sUp: sA, hw: hasW ? A.hw : null, sid: st.id, dir: st.dir < 0 ? -1 : 1, off: +(st.p && st.p.off) || 0 });
  });
  z.sort((p, q) => p.a - q.a); RV_ZONES = z; RV_ZKEY = key; RV_ZDIRTY = false; RV_ZVER++; return z;
}
function rvPiecesInfo(rv) {   // 護岸扣除結構物截斷區後的連續段 [{a,b,ja,jb}]；ja/jb＝截斷端資訊（null＝護岸本身端點）
  const L = rvLim(rv), cat = tcType(rv.type).cat, zs = rvZones().filter(z => tcPrioOn(z.kind, cat)), key = RV_ZVER + '|' + L.a + '|' + L.b + '|' + (rv.ign ? 1 : 0) + '|' + rv.side + '|' + cat + '|' + JSON.stringify(state.tcPrio || {});
  if (rv._pck === key && rv._pc) return rv._pc;
  let pcs = [{ a: L.a, b: L.b, ja: null, jb: null }];
  if (!rv.ign) zs.forEach(z => {
    const out = [], mk = (s, zone) => { const kd = zone.walls && Math.abs(s - zone.endS) < 1e-6 ? 'wall' : 'dam'; return { s, zone: zone.name, zk: zone.kind, kind: kd, face: kd === 'wall' ? null : (Math.abs(s - zone.sUp) < 1e-6 ? 'up' : 'dn'), sid: zone.sid, eW: zone.walls && zone.hw ? rvWallE(rv, zone) : null }; };
    pcs.forEach(pc => {
      if (!(z.a < pc.b - 1e-6 && z.b > pc.a + 1e-6)) { out.push(pc); return; }
      if (z.a > pc.a + 1e-6) out.push({ a: pc.a, b: z.a, ja: pc.ja, jb: mk(z.a, z) });
      if (z.b < pc.b - 1e-6) out.push({ a: z.b, b: pc.b, ja: mk(z.b, z), jb: pc.jb });
    });
    pcs = out;
  });
  pcs = pcs.filter(pc => pc.b - pc.a > 0.05); rv._pck = key; rv._pc = pcs; return pcs;
}
function rvWallE(rv, zone) {   // v6.7 側牆末端內面距中心線（護岸 e 座標）：壩以「面向下游」定左右、護岸以「面向里程增加」定左右，依水流方向 dir 對應，並計入壩中心偏移 off
  const sg = rvSg(rv), dir = zone.dir || 1, sd = sg * dir;
  return zone.hw[sd < 0 ? '-1' : '1'][1] + sg * dir * (zone.off || 0);
}
function rvActive(side, s) {   // 某樁號該岸有效的護岸（重疊時取起點較後者，即交界樁號採後一段；結構物截斷區內無護岸）
  let best = null;
  state.revs.forEach(rv => { if (rv.side !== side) return; const L = rvLim(rv); if (s < L.a - 1e-6 || s > L.b + 1e-6) return; if (!rvPiecesInfo(rv).some(pc => s >= pc.a - 1e-6 && s <= pc.b + 1e-6)) return; if (!best || L.a >= rvLim(best).a - 1e-9) best = rv; });
  return best;
}
function rvTaperSum(rv, arr, key, s) {   // 區段量（加高 dh／拉寬 de）：區段內全量，兩端各自漸變回 0（限於護岸範圍內）
  const L = rvLim(rv); let v = 0;
  (arr || []).forEach(r => {
    let k = 0, a = Math.min(r.s0, r.s1), b = Math.max(r.s0, r.s1);
    if (s >= a && s <= b) k = 1;
    else if (s < a && r.t0 > 1e-9 && s > a - r.t0) k = (s - (a - r.t0)) / r.t0;
    else if (s > b && r.t1 > 1e-9 && s < b + r.t1) k = 1 - (s - b) / r.t1;
    if (k > 0 && s >= L.a - 1e-6 && s <= L.b + 1e-6) v += r[key] * k;
  });
  return v;
}
function rvDropRaise(rv, s, side) {   // 護岸連續通過落差（固床工等）：低側頂線由高側頂高以直線漸變回原高（長度 ldp）
  const D = state.profile && state.profile.drops; if (!D || !D.length) return 0; const Lt = Math.max(0, rv.p.ldp ?? 5); if (!(Lt > 1e-6)) return 0;
  let v = 0; const pcs = rvPiecesInfo(rv);
  D.forEach(d => {
    const dz = +d.dz || 0; if (!d.sid || Math.abs(dz) < 1e-6 || !pcs.some(pc => d.sta > pc.a - 1e-3 && d.sta < pc.b + 1e-3)) return;   // 只限結構物（固床工、副壩）造成的落差；落差在分段交界上也套用（由低側那段漸變）
    let dist = null;
    if (dz > 0) { if (s > d.sta + 1e-6 || (Math.abs(s - d.sta) <= 1e-6 && side !== 'pre')) dist = Math.max(0, s - d.sta); }
    else if (s < d.sta - 1e-6 || (Math.abs(s - d.sta) <= 1e-6 && side === 'pre')) dist = Math.max(0, d.sta - s);
    if (dist !== null && dist < Lt) v += Math.abs(dz) * (1 - dist / Lt);
  });
  return v;
}
function rvRaise(rv, s) { return rvTaperSum(rv, rv.raises, 'dh', s); }
function rvWiden(rv, s) { return rvTaperSum(rv, rv.wids, 'de', s); }
const rvSmooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
function rvPrev(rv) {   // 同岸、同類別、迄點恰為本段起點的前一段（接點）
  const L = rvLim(rv); let best = null; state.revs.forEach(o => { if (o === rv || o.side !== rv.side) return; if (Math.abs(rvLim(o).b - L.a) < 0.05) best = o; }); return best;
}
function rvNext(rv) {   // 同岸、起點恰為本段迄點的下一段
  const L = rvLim(rv); let best = null; state.revs.forEach(o => { if (o === rv || o.side !== rv.side) return; if (Math.abs(rvLim(o).a - L.b) < 0.05) best = o; }); return best;
}
const rvEDef0 = (s, eDef) => (typeof rvEDefAt === 'function' ? rvEDefAt(s) : eDef);
function rvERaw(rv, s, eDef) {   // 未含接點處理的 e：控制點曲線／起迄線性內插／自動 W/2，加拉寬區段
  const L = rvLim(rv), t = L.b > L.a + 1e-9 ? Math.max(0, Math.min(1, (s - L.a) / (L.b - L.a))) : 0;
  let e; if (rv.cps && rv.cps.length) e = rvCurveE(rv, s, eDef); else if (rv.e0 === null && rv.e1 === null) e = eDef; else { const a = rv.e0 ?? rv.e1, b = rv.e1 ?? rv.e0; e = a + (b - a) * t; }
  return e + rvWiden(rv, s);
}
function rvJoinCont(A, B, J) { const ed = rvEDef0(J, 7); return Math.abs(rvERaw(A, J, ed) - rvERaw(B, J, ed)) < 0.01; }
function rvCornerAt(A, B, J, s) {   // A→B 在 J 相接且 e 連續：交界前後各 h＝L/2 以拋物線修圓（同縱斷豎曲線），兩側直線段不變
  const LA = rvLim(A), LB = rvLim(B), h = Math.min(Math.max(0.5, (B.j0 && B.j0.L) || 10) / 2, (J - LA.a) / 2, (LB.b - J) / 2), x = Math.abs(s - J);
  if (!(h > 0.05) || x >= h || !rvJoinCont(A, B, J)) return 0;
  const dd = Math.min(0.5, h), eJ = rvERaw(A, J, rvEDef0(J, 7)), kL = (eJ - rvERaw(A, J - dd, rvEDef0(J - dd, 7))) / dd, kR = (rvERaw(B, J + dd, rvEDef0(J + dd, 7)) - rvERaw(B, J, rvEDef0(J, 7))) / dd;
  return (kR - kL) * (h - x) * (h - x) / (4 * h);
}
function rvCorner(rv, s) {   // 本段起點（與前一段順接）與迄點（下一段選順接）處的修圓量
  const L = rvLim(rv); let c = 0;
  if (rv.j0 && rv.j0.m === 'taper') { const pv = rvPrev(rv); if (pv) c += rvCornerAt(pv, rv, L.a, s); }
  const nx = rvNext(rv); if (nx && nx.j0 && nx.j0.m === 'taper') c += rvCornerAt(rv, nx, L.b, s);
  return c;
}
function rvGeo(R, zc) { return (R.T || tcType(R.rv && R.rv.type)).geo(R, zc || 0); }

/* v6.3 護岸控制點：e 不受河寬限制，控制點之間以自然曲線（單調三次 PCHIP，Fritsch–Carlson）連接，平面不出現折角、不凸出 */
function rvCurvePts(rv, eDef) {
  const L = rvLim(rv), ed = sv => (typeof rvEDefAt === 'function' ? rvEDefAt(sv) : eDef), P = [];
  P.push({ s: L.a, e: rv.e0 ?? ed(L.a) });
  (rv.cps || []).forEach(c => { if (c.s > L.a + 1e-6 && c.s < L.b - 1e-6) P.push({ s: c.s, e: c.e }); });
  P.push({ s: L.b, e: rv.e1 ?? ed(L.b) });
  return P.sort((a, b) => a.s - b.s).filter((p, i, A) => !i || p.s > A[i - 1].s + 1e-6);
}
function rvPchip(P, x) {
  const n = P.length; if (n === 1) return P[0].e; if (x <= P[0].s) return P[0].e; if (x >= P[n - 1].s) return P[n - 1].e;
  const h = [], d = []; for (let i = 0; i < n - 1; i++) { h.push(P[i + 1].s - P[i].s); d.push((P[i + 1].e - P[i].e) / h[i]); }
  const m = new Array(n).fill(0);
  if (n === 2) { m[0] = m[1] = d[0]; } else {
    for (let i = 1; i < n - 1; i++) { if (d[i - 1] * d[i] <= 0) m[i] = 0; else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); } }
    m[0] = d[0]; m[n - 1] = d[n - 2]; if (d[0] !== 0) m[0] = 0; if (d[n - 2] !== 0) m[n - 1] = 0;   // 兩端切線水平＝與上下游平順銜接
  }
  let k = 0; while (k < n - 2 && x > P[k + 1].s) k++;
  const t = (x - P[k].s) / h[k], t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * P[k].e + (t3 - 2 * t2 + t) * h[k] * m[k] + (-2 * t3 + 3 * t2) * P[k + 1].e + (t3 - t2) * h[k] * m[k + 1];
}
function rvCurveE(rv, s, eDef) { return rvPchip(rvCurvePts(rv, eDef), s); }
function rvCpPt(rv, c) { const g = getPointAndNormalAtStation(c.s); if (!g) return null; const sg = rvSg(rv); return { x: g.x - g.nx * sg * c.e, y: g.y - g.ny * sg * c.e }; }
function rvCpAdd(s) {
  const rv = state.revs[state.rvSel]; if (!rv) return; const L = rvLim(rv); if (!Number.isFinite(s)) { const sec = state.sections[state.selectedStaIdx]; s = sec ? sec.sta : (L.a + L.b) / 2; }
  if (s <= L.a + 0.1 || s >= L.b - 0.1) { updateStatus('⚠ 控制點須在護岸起迄樁號之間。'); return; }
  pushUndoSnapshot(); const e = +rvAt(rv, s, rvEDefAt(s)).e.toFixed(3) - rvWiden(rv, s); rv.cps = (rv.cps || []).concat([{ s: +s.toFixed(2), e: +e.toFixed(3) }]).sort((a, b) => a.s - b.s);
  RV_SIG = ''; rebuildAlignmentAndSections(); updateStatus(`📍 ${rvName(rv)}：於 ${formatStation(s)} 加控制點（e＝${rvF(e)} m），可在平面圖拖曳或在卡片修改。`);
}
function rvCpDel(k) { const rv = state.revs[state.rvSel]; if (!rv || !rv.cps) return; pushUndoSnapshot(); rv.cps.splice(k, 1); RV_SIG = ''; rebuildAlignmentAndSections(); }
function rvCpSet(k, f, v) { const rv = state.revs[state.rvSel]; if (!rv || !rv.cps || !rv.cps[k]) return; const x = parseFloat(v); if (!Number.isFinite(x) || (f === 'e' && x <= 0)) return; pushUndoSnapshot(); rv.cps[k][f] = x; rv.cps.sort((a, b) => a.s - b.s); RV_SIG = ''; rebuildAlignmentAndSections(); }
function rvAt(rv, s, eDef, depth, side) {   // side：落差樁號上的斷面屬 'pre'（上游側設計高）或其他（下游側）   // 某樁號的護岸有效參數（含加高、拉寬、偏移距離內插、接點順接、銜接側牆）
  const L = rvLim(rv), t = L.b > L.a + 1e-9 ? Math.max(0, Math.min(1, (s - L.a) / (L.b - L.a))) : 0, p = rv.p, T = tcType(rv.type);
  let e = rvERaw(rv, s, eDef);   // 偏移距離內插＋拉寬區段
  const eCn = rvCorner(rv, s); e += eCn;   // v6.7 順接接點折角修圓
  let pp = p;
  if (T.layered) {   // v5.5 層數型式（土石籠／箱籠）：加高＝加幾層（整數，區段內全量、不漸變），高度由層數重算；不做跨落差漸變
    let dN = 0; (rv.raises || []).forEach(r => { const a = Math.min(r.s0, r.s1), b = Math.max(r.s0, r.s1); if (s >= a - 1e-6 && s <= b + 1e-6 && s >= L.a - 1e-6 && s <= L.b + 1e-6) dN += Math.round(+r.dh || 0); });
    if (dN) { pp = Object.assign({}, p, { N_layer: Math.max(1, Math.min(6, Math.round(p.N_layer) + dN)) }); T.sync(pp); }
  }
  let H = T.layered ? pp.H : Math.max(0, p.H + rvRaise(rv, s) + rvDropRaise(rv, s, side));
  if (rv.j0 && rv.j0.m === 'taper' && (depth || 0) < 4) {   // 與前一段順接：e、H 平滑漸變（層數型式只漸變 e）
    const pv = rvPrev(rv), Lt = Math.max(0.5, rv.j0.L || 10), d = s - L.a;
    if (pv && d >= -1e-6 && d < Lt) { const Rp = rvAt(pv, L.a, eDef, (depth || 0) + 1), k = rvSmooth(d / Lt); if (!rvJoinCont(pv, rv, L.a)) e = Rp.e + (e - Rp.e) * k; if (!T.layered) H = Rp.H + (H - Rp.H) * k; }   // v6.7：e 已連續時改由 rvCorner 修圓，這裡只漸變 H
  }
  const pc = rvPiecesInfo(rv).find(x => s >= x.a - 1e-6 && s <= x.b + 1e-6), lt0 = Math.max(0, p.lt ?? 5);
  if (pc) [[pc.ja, s - pc.a], [pc.jb, pc.b - s]].forEach(([j, d]) => {   // 銜接側牆：e 由側牆內面平滑順接（長度≥3 倍 e 變化量）
    if (!j || j.kind !== 'wall' || j.eW === null) return; /* v6.7：順接長度不超過該段長度 */ const lt = Math.min(Math.max(lt0, 3 * Math.abs(e - j.eW)), Math.max(pc.b - pc.a, 0.5)); if (lt > 1e-6 && d < lt) e = j.eW + (e - j.eW) * rvSmooth(Math.max(0, d) / lt);
  });
  return Object.assign({}, pp, { H, e: Math.max(0.05, e), run: Math.max(pp.n * H, 0.001), rv, T });
}
function rvParams(params, s, side) {   // 併入斷面參數：每岸的護岸有效值；無護岸＝H=0
  params.rv = { L: null, R: null }; const eDef = params.W / 2;
  ['L', 'R'].forEach(sd => {
    const rv = rvActive(sd, s), R = rv ? rvAt(rv, s, eDef, 0, side) : null;
    params.rv[sd] = R; params['e' + sd] = R ? R.e : eDef; params['H' + sd] = R ? R.H : 0; params['n' + sd] = R ? R.n : 0.5; params['D' + sd] = R ? R.D : 0;
  });
  params.D = Math.max(params.DL, params.DR);
}
function rvReach(params, H, n, sd) {   // 讀取長度：涵蓋護岸、背填及開挖範圍
  const R = params.rv && params.rv[sd]; if (!R || !(H > 0)) return 0;
  const G = rvGeo(R, 0); return Math.max(G.a0b + Math.max(R.sdx, 0) + 30, G.aB0 + (R.H - G.zf) * R.ec + 2);
}
function rvBF() { return {}; }
function rvBF_old() { const f = (id, d) => { const v = parseFloat((document.getElementById(id) || {}).value); return Number.isFinite(v) ? v : d; }; return { maxH: Math.max(0, f('bfMaxH', 5)), n2: Math.max(1e-6, f('bfSlope', 0.5)) }; }
function rvSlope() { const v = parseFloat((document.getElementById('desSideSlope') || {}).value); return v > 0 ? v : 1.5; }

/* ---- 一岸的設計線（河床 → 水側斜面 → 牆頂 → 預留沉陷斜線 → 背填面至地形線）；無護岸＝地形線 ---- */
function rvBank(R, e, zc, hS, g, BF) {
  const pts = []; if (!R) return { B: { mode: 'nat', e }, pts };
  const G = rvGeo(R, zc), H = R.H, a0 = G.a0, a0b = G.a0b, zTop = G.zTop, gg = a => g(Math.min(a, hS)); void BF;
  G.face.forEach(p => pts.push(p[0]));
  const B = { R, G, H, n: R.n, e, run: a0 - e, a0, a0b, zTop, face: G.face, mode: 'hill' };
  if (gg(a0b) <= zTop + 1e-6) {   // 牆背地形低於牆頂：背填
    const a1 = a0b + Math.max(0.001, R.sdx), z1 = zTop + R.sdz, gr = R.g || 0, zh = a => z1 - gr * (a - a1);   // 預留沉陷斜線後，背填面以 g 往背後下降
    B.mode = 'back'; B.a1 = a1; B.z1 = z1; B.gr = gr; pts.push(a1);
    let contact = null, aPrev = a1, fPrev = gg(a1) - z1;
    if (fPrev >= 0) contact = a1;
    else for (let aa = a1 + 0.25; aa <= hS + 0.25; aa += 0.25) {
      const ac = Math.min(aa, hS), f = gg(ac) - zh(ac);
      if (f >= 0) { contact = aPrev + (-fPrev) / ((f - fPrev) || 1) * (ac - aPrev); break; }
      aPrev = ac; fPrev = f; if (ac >= hS) break;
    }
    if (contact !== null) { B.contact = contact; pts.push(contact); }
    else { B.open = true; pts.push(hS); }
  }
  return { B, pts };
}
function designOffsetZ(off, zc, p, slope, gZ, bk) {
  const a = Math.abs(off), left = off < 0, BL = bk ? bk[-1] : null, BR = bk ? bk[1] : null, B = left ? BL : BR;
  const anyRev = (BL && BL.mode !== 'nat') || (BR && BR.mode !== 'nat');
  if (a <= 1e-9) return anyRev ? zc : gZ;
  if (!B || B.mode === 'nat') return gZ;                                    // 無護岸：設計線＝地形線
  if (a <= (B.face ? Math.min(B.e, B.face[0][0]) : B.e) + 1e-9) return zc; // 設計河床（v5.6：基礎承台可伸出牆腳 e 之外）
  if (a <= B.a0b + 1e-9) return B.face ? tcFaceZ(B.face, a) : B.zTop;      // 水側面→牆頂→背（依型式）
  if (B.mode === 'hill') return Math.min(B.zTop + (a - B.a0b) / slope, gZ); // 地形高於牆頂：開挖邊坡向上至地形
  if (a <= B.a1 + 1e-9) return B.zTop + (a - B.a0b) / (B.a1 - B.a0b) * (B.z1 - B.zTop);   // 預留沉陷斜線
  const zh = B.z1 + B.gr * (a - B.a1);
  if (B.contact !== undefined) return a < B.contact - 1e-9 ? zh : gZ;       // 背填面，碰到地形線即停止
  return zh;
}
function spCellHTML(sec, idx, f) {   // 樁號表：護岸高／斜率／基礎深改由「護岸」物件決定（唯讀顯示）
  if (['HL', 'HR', 'nL', 'nR', 'D'].includes(f)) {
    const p = sec.params; if (!p) return '<td></td>';
    const sd = f === 'HL' || f === 'nL' ? 'L' : (f === 'HR' || f === 'nR' ? 'R' : null), R = sd ? p.rv && p.rv[sd] : null;
    const txt = f === 'D' ? (p.DL > 0 || p.DR > 0 ? (p.DL === p.DR ? rvF(p.DL) : rvF(p.DL) + '/' + rvF(p.DR)) : '—') : (R ? rvF(f[0] === 'H' ? R.H : R.n) : '—');
    return `<td style="color:#8b9bb4;text-align:center;font-size:11px;" title="護岸高／斜率／基礎深由「護岸」卡片的護岸物件決定（此處唯讀）">${txt}</td>`;
  }
  return spCellHTML_old(sec, idx, f);
}

/* ---- 斷面幾何（畫圖與數量共用） ---- */
function rvTrench(R, zc, g, hS, G) {   // 開挖線：基礎底（型式定義的前後緣）以 1:ec 往上至地面
  G = G || rvGeo(R, zc); const zf = G.zf, aF0 = G.aF0, aB0 = G.aB0, ec = Math.max(R.ec, 1e-3), gz = a => g(Math.min(Math.max(a, 0), hS));
  let aB = hS; for (let a = aB0; a <= hS + 1e-9; a += 0.05) { if (zf + (a - aB0) / ec >= gz(a) - 1e-9) { aB = a; break; } }
  let aF = Math.max(0, aF0); for (let a = aF0; a >= 0; a -= 0.05) { if (zf + (aF0 - a) / ec >= gz(a) - 1e-9) { aF = a; break; } if (a - 0.05 < 0) aF = 0; }
  const need = gz(aB0) > zf + 1e-6 || gz(aF0) > zf + 1e-6;
  return { zf, aF0, aB0, aF, aB, zF: zf + Math.max(0, aF0 - aF) / ec, zB: zf + (aB - aB0) / ec, need, ec };
}
function rvPipe(R, zc) { return rvGeo(R, zc).pipe; }
function rvGeomSec(sec, sd) {
  const B = sec.bkInfo && sec.bkInfo[sd]; if (!B || B.mode === 'nat' || !B.R) return null;
  const R = B.R, zc = sec.desCenterZ, sg = rvSgS(sd), G = B.G || rvGeo(R, zc), hS = sg < 0 ? sec.readL : sec.readR, g = a => secInterp(sec, sg * a, 'groundZ');
  return { R, B, G, sg, zc, zf: G.zf, polys: G.polys, wall: G.polys[0].pts, trench: rvTrench(R, zc, g, hS, G), pipe: G.pipe, g, hS };
}
function rvZRange(sec) {
  let lo = Infinity, hi = -Infinity;
  ['L', 'R'].forEach(sd => { const G = rvGeomSec(sec, sd); if (!G) return; lo = Math.min(lo, G.zf - 0.2); hi = Math.max(hi, G.B.zTop + Math.max(0, G.R.sdz) + 0.2); G.polys.forEach(pg => pg.pts.forEach(p => { lo = Math.min(lo, p[1] - 0.2); })); });
  return isFinite(lo) ? [lo, hi] : null;
}

/* ---- 斷面面積（平均斷面法用）：混凝土、模板長、開挖、回填 ---- */
function rvFillEx(G, R, zc, g, dz, hS) {   // 開挖（設計面以下、開挖線以內）與回填（開挖空間回填至設計面，扣除結構體）每公尺面積
  const zf = G.zf, aF0 = G.aF0, aB0 = G.aB0, ec = Math.max(R.ec, 1e-3);
  let gmax = zf; for (let a = 0; a <= hS; a += 0.5) { const v = g(a); if (Number.isFinite(v)) gmax = Math.max(gmax, v); }
  const ext = (gmax - zf + 1) * ec, lo = Math.max(0, aF0 - ext), hi = Math.min(hS, aB0 + ext), da = 0.05;
  let ex = 0, bf = 0;
  for (let a = lo + da / 2; a < hi; a += da) {
    const gz = g(a), d = dz(a); if (!Number.isFinite(gz) || !Number.isFinite(d)) continue;
    const zEx = zf + Math.max(0, (aF0 - a) / ec, (a - aB0) / ec), top = Math.min(gz, d), lw = Math.min(gz, zEx);
    ex += Math.max(0, top - zEx) * da;
    if (d > lw) bf += Math.max(0, (d - lw) - tcVertCover(G.polys, a, lw, d)) * da;
  }
  return { ex, bf };
}
function rvSecQ(sec, rv) {
  const s = sec.sta, sg = rvSg(rv), zc = sec.desCenterZ, eDef = sec.params ? sec.params.W / 2 : 7, R = rvAt(rv, s, eDef, 0, sec.side), hS = sg < 0 ? sec.readL : sec.readR;
  const g = a => secInterp(sec, sg * a, 'groundZ'), slope = rvSlope(), { B } = rvBank(R, R.e, zc, hS, g, {}), G = B.G, T = R.T;
  const bk = { [sg]: B, [-sg]: { mode: 'nat', e: R.e } }, dz = a => designOffsetZ(sg * a, zc, { W: 2 * R.e }, slope, g(Math.min(a, hS)), bk);
  const fe = rvFillEx(G, R, zc, g, dz, hS), q = Object.assign({}, T.qty(G, R));
  return { s, R, G, q, Ac: q[T.prim] || 0, form: q.form || 0, ex: fe.ex, bf: fe.bf, Hv: R.H, e: R.e, zTop: G.zTop, zf: G.zf, pipeLen: G.pipe ? G.pipe.len : 0, pipeSp: G.pipe ? G.pipe.sp : 0 };
}
/* v6.4 件數取整數：type 項目可帶 gridLen(p)→m（每格長）與 perGrid(p)→每格件數；否則逐項進位 */
function rvIntCount(rows, T, p, pLens, lenB) {
  const INTU = ['支', '塊', '片', '個', '組'];
  rows.forEach(r => { const x = T.items.find(i => i.k === r.k); if (!x || !INTU.includes(r.u)) return;
    if (x.gridLen && x.perGrid) { const gl = x.gridLen(p), ng = pLens.reduce((a, l) => a + Math.ceil(l / gl - 1e-9), 0), pg = x.perGrid(p); r.v = ng * pg; r.fx = `${ng} 格（每格 ${rvF(gl, 2)} m，逐段進位）× 每格 ${pg} 支＝${r.v} 支`; }
    else { const v0 = r.v; r.v = Math.ceil(v0 - 1e-9); if (Math.abs(r.v - v0) > 1e-6) r.fx = `${r.fx}（${rvF(v0, 2)} 取整數）`; } });
  if (T.postInt) T.postInt(rows, p);
}
function rvLen(rv, sA, sB, eA, eB) {   // 偏移曲線實長（兩斷面間，距離 e 線性變化）；回傳 {len, bad}
  const sg = rvSg(rv), n = Math.max(1, Math.ceil((sB - sA) / 0.5)); let len = 0, bad = false, pp = null, pc = null;
  for (let i = 0; i <= n; i++) {
    const s = sA + (sB - sA) * i / n, e = eA + (eB - eA) * i / n, g = getPointAndNormalAtStation(s); if (!g) continue;
    const P = [g.x - g.nx * sg * e, g.y - g.ny * sg * e], C = [g.x, g.y];
    if (pp) { const dx = P[0] - pp[0], dy = P[1] - pp[1]; len += Math.hypot(dx, dy); if (dx * (C[0] - pc[0]) + dy * (C[1] - pc[1]) <= 0) bad = true; }
    pp = P; pc = C;
  }
  return { len, bad };
}
function rvWings(rv) {   // 收頭封牆位置 [{s, inward, kind:'a'|'b'|'c'}]（依各端勾選）
  const out = [], pcs = rvPiecesInfo(rv), c = rv.cap || {};
  pcs.forEach(pc => {
    if (pc.ja ? c.c : c.a) out.push({ s: pc.a, inward: 1, kind: pc.ja ? 'c' : 'a' });
    if (pc.jb ? c.c : c.b) out.push({ s: pc.b, inward: -1, kind: pc.jb ? 'c' : 'b' });
  });
  return out;
}
/* ---- v5.4 收頭封牆：正視＝封住護岸斷面（含基礎）＋背側梯形延伸（頂與護岸頂齊、伸入 cw、末端高 he＝H/3，斜邊回到基礎背側底角）；平面＝長方形（厚 T，置於護岸端外側） ---- */
const RV_RB = [10, 13, 16, 19, 22, 25];
function rvCapGeo(R, p) {   // → {pts:[[a,z]], A, per, top, aMin, aMax, he, zT, zf, a0, a0b, Lx, polys}
  const G = rvGeo(R, 0), polys = G.polys.map(pg => pg.pts).filter(q => q && q.length > 2); if (!polys.length) return null;
  const all = polys.flat(), zf = Math.min(...all.map(q => q[1])), zT = Math.max(G.zTop, ...all.map(q => q[1])), Lx = Math.max(0, +p.cw || 0), a0b = G.a0b, aE = a0b + Lx;
  const he = Math.min(zT - zf, Math.max(0.3, Math.round(Math.max(0, zT) / 3 * 20) / 20));
  const span = z => { let lo = Infinity, hi = -Infinity; polys.forEach(P => { for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if ((a[1] - z) * (b[1] - z) <= 0 && Math.abs(b[1] - a[1]) > 1e-12) { const x = a[0] + (z - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); lo = Math.min(lo, x); hi = Math.max(hi, x); } } }); return [lo, hi]; };
  const eps = 1e-5, aBB = span(zf + eps)[1], zK = zT - he;
  const trap = z => (z >= zK - 1e-9 ? aE : aBB + (aE - aBB) * (z - zf) / Math.max(1e-6, zK - zf));
  const Zs = new Set([zf, zT, zK]); all.forEach(q => Zs.add(q[1])); for (let k = 1; k < 40; k++) Zs.add(zf + (zT - zf) * k / 40);
  const zs = [...Zs].filter(z => z >= zf - 1e-9 && z <= zT + 1e-9).sort((a, b) => a - b), Lp = [], Rp = [];
  zs.forEach(z => [z - eps, z + eps].forEach(zz => { zz = Math.max(zf + eps, Math.min(zT - eps, zz)); const [lo, hi] = span(zz); if (!Number.isFinite(lo)) return; Lp.push([lo, zz]); Rp.push([Math.max(hi, trap(zz)), zz]); }));
  if (Lp.length < 2) return null;
  const pts = [[Lp[0][0], zf], ...Lp, [Lp[Lp.length - 1][0], zT], [aE, zT], ...Rp.slice().reverse(), [Rp[0][0], zf]];
  const simp = []; pts.forEach(q => { const n = simp.length; if (n && Math.hypot(q[0] - simp[n - 1][0], q[1] - simp[n - 1][1]) < 1e-4) return; if (n >= 2) { const a = simp[n - 2], b = simp[n - 1], cr = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]); if (Math.abs(cr) < 1e-7) simp.pop(); } simp.push(q); });
  const A = tcPolyArea(simp); let per = 0; simp.forEach((q, i) => { const r = simp[(i + 1) % simp.length]; per += Math.hypot(r[0] - q[0], r[1] - q[1]); });
  return { pts: simp, A, per, top: aE - Lp[Lp.length - 1][0], aMin: Math.min(...simp.map(q => q[0])), aMax: Math.max(...simp.map(q => q[0])), he, zT, zf, a0: G.a0, a0b, Lx, polys: G.polys, G };
}
function rvCapQ(A, p) {   // 每座封牆數量：混凝土＝A×T；模板＝兩側面 2A；鋼筋單層雙向＝2A/s 長
  const T = Math.max(0.05, +p.ct || 0.3), sp = Math.max(0.05, +p.crs || 0.3), d = +p.crb || 13, uw = (typeof CNS560 !== 'undefined' && CNS560['D' + d]) || 0.995;
  return { V: A * T, F: 2 * A, Lr: 2 * A / sp, W: 2 * A / sp * uw, T, sp, d, uw };
}
function rvRecalc() {
  RV_ZDIRTY = true;
  state.revs.forEach(rv => {
    try {
      const al = state.alignment, T = tcType(rv.type); rv._q = null; rv._warn = '';
      if (!al.segments || !al.segments.length) return;
      const pcs = rvPiecesInfo(rv).map(x => Object.assign({}, x, { a: Math.max(x.a, al.startSta), b: Math.min(x.b, al.endSta) })).filter(x => x.b > x.a + 1e-6);
      if (!pcs.length) { rv._warn = rvPiecesInfo(rv).length ? '起迄樁號不在中心線範圍內' : '全段被結構物（壩體／側牆）截斷，無護岸'; return; }
      const segs = [], p = rv.p, I = {}; let lenB = 0, lenC = 0, EX = 0, BFv = 0, nP = 0, pipeL = 0, nJ = 0; const pLens = [];
      for (const pc of pcs) {
        const secs = state.sections.filter(x => x.sta >= pc.a - 0.02 && x.sta <= pc.b + 0.02);
        if (secs.length < 2) { rv._warn = '範圍內斷面不足'; return; }
        const Q = secs.map(sec => { try { return rvSecQ(sec, rv); } catch (e) { console.error(e); return null; } }); if (Q.some(q => !q)) { rv._warn = '斷面計算失敗'; return; }
        let lp = 0;
        for (let i = 0; i < Q.length - 1; i++) {
          const q1 = Q[i], q2 = Q[i + 1], ds = q2.s - q1.s; if (ds < 1e-6) continue;
          const r = rvLen(rv, q1.s, q2.s, q1.e, q2.e); if (r.bad) rv._warn = '偏移距離大於曲率半徑，偏移線自相交叉，實長不可信';
          const Lb = r.len, it = {}; new Set(Object.keys(q1.q).concat(Object.keys(q2.q))).forEach(k => { it[k] = ((q1.q[k] || 0) + (q2.q[k] || 0)) / 2 * Lb; I[k] = (I[k] || 0) + it[k]; });
          const sg = { a: q1.s, b: q2.s, ds, Lb, it, A1: q1.Ac, A2: q2.Ac, v: (q1.Ac + q2.Ac) / 2 * Lb, f: it.form || 0, x1: q1.ex, x2: q2.ex, ex: (q1.ex + q2.ex) / 2 * Lb, b1: q1.bf, b2: q2.bf, bf: (q1.bf + q2.bf) / 2 * Lb, H1: q1.Hv, H2: q2.Hv, pi: pcs.indexOf(pc) };
          segs.push(sg); lp += Lb; lenC += ds; EX += sg.ex; BFv += sg.bf;
        }
        lenB += lp; pLens.push(lp); if (Q[0].pipeLen > 0 && Q[0].pipeSp > 0) { const n = Math.floor(lp / Math.max(Q[0].pipeSp, 0.1)) + 1; nP += n; pipeL += n * Q[0].pipeLen; }
        nJ += Math.floor(lp / Math.max(p.jsp, 0.5)) + (pc.ja ? 1 : 0) + (pc.jb ? 1 : 0);
      }
      // v5.4 收頭封牆：封住護岸斷面＋梯形延伸；鋼筋混凝土，另列數量
      const wl = rvWings(rv).filter(w => w.s >= al.startSta - 0.02 && w.s <= al.endSta + 0.02);
      let nW = 0, Vw = 0, Fw = 0, Rw = 0, Lw = 0, Aw = 0, cq = null; wl.forEach(w => { const C = rvCapGeo(rvAt(rv, w.s, rvEDefAt(w.s)), p); if (!C) return; cq = rvCapQ(C.A, p); nW++; Aw += C.A; Vw += cq.V; Fw += cq.F; Rw += cq.W; Lw += cq.Lr; });
      if (nW) { I.capC = Vw; I.capF = Fw; I.capR = Rw; }
      const a = pcs[0].a, b = pcs[pcs.length - 1].b, nCut = pcs.reduce((k, x) => k + (x.ja ? 1 : 0) + (x.jb ? 1 : 0), 0);
      const rows = T.items.filter(x => !x.opt || (I[x.k] || 0) > 1e-9).map(x => ({ k: x.k, it: x.it, u: x.u, v: I[x.k] || 0, fx: x.fx(p) }));
      rvIntCount(rows, T, p, pLens, lenB);   // v6.4：以「支、塊、片」計的項目一律取整數（有格長者以格數×每格件數）
      // v5.7：開挖、回填不列於護岸數量表，併入全線土方表（護岸基礎開挖、護岸背填回填兩欄）
      if (nP) rows.push({ k: 'nP', it: `排水管 PVC ${rvF((p.pdia || 0) * 39.37, 0)}"@${rvF(p.psp, 1)}m`, u: '支', v: nP, fx: `長度合計 ${rvF(pipeL, 1)} m` });
      rows.push({ k: 'nJ', it: '伸縮縫', u: '處', v: nJ, fx: `每 ${rvF(p.jsp, 1)} m 一處` + (nCut ? `；含接壩／側牆端 ${nCut} 處` : '') });
      if (nW) rows.push({ k: 'nW', it: '收頭封牆', u: '座', v: nW, fx: `封住護岸斷面＋背側梯形延伸 ${rvF(p.cw)} m（末端高＝H/3）；正視面積合計 ${rvF(Aw)} m²` },
        { k: 'capC', it: '收頭封牆 混凝土', u: 'm³', v: Vw, fx: `正視面積 ${rvF(Aw)} m² × 厚 T=${rvF(cq.T * 100, 0)} cm` },
        { k: 'capF', it: '收頭封牆 模板', u: 'm²', v: Fw, fx: '兩側面 2×正視面積' },
        { k: 'capR', it: `收頭封牆 鋼筋 D${cq.d}`, u: 'kg', v: Rw, fx: `單層雙向 @${rvF(cq.sp * 100, 0)} cm：長 2A/s＝${rvF(Lw, 1)} m × ${cq.uw} kg/m` });
      rv._q = { a, b, segs, lenB, lenC, I, V: I[T.prim] || 0, F: I.form || 0, EX, BF: BFv, nP, pipeL, nJ, nW, Vw, Fw, Rw, Aw, nPc: pcs.length, nCut, prim: T.prim, Ac0: segs.length ? segs[0].A1 : 0, rows };
    } catch (e) { rv._q = null; rv._warn = '計算錯誤'; console.error('rvRecalc', e); }
  });
  rvRenderUI();
}
function rvTotals(side) {
  const T = { lenB: 0, lenC: 0, V: 0, F: 0, EX: 0, BF: 0, nP: 0, pipeL: 0, nJ: 0, nW: 0, n: 0, I: {} };
  state.revs.forEach(rv => { if ((side && rv.side !== side) || !rv._q) return; const q = rv._q; T.n++; ['lenB', 'lenC', 'V', 'F', 'EX', 'BF', 'nP', 'pipeL', 'nJ', 'nW'].forEach(k => T[k] += q[k] || 0); Object.entries(q.I || {}).forEach(([k, v]) => { T.I[k] = (T.I[k] || 0) + v; }); });
  return T;
}
/* ---- 關鍵樁號：護岸起迄、加高區段端點（斷面以其為轉折） ---- */
function rvKeyStations() {
  RV_ZDIRTY = true; const out = [];
  state.revs.forEach(rv => {
    const L = rvLim(rv), pcs = rvPiecesInfo(rv), sh = rvShort(rv), lt = Math.max(0, rv.p.lt ?? 5);
    pcs.forEach(pc => {
      if (pc.ja ? pc.ja.zk !== 'sub' : rv.s0 !== null) out.push({ s: +pc.a.toFixed(3), ptName: sh + (pc.ja ? (pc.ja.kind === 'wall' ? '接側牆起' : pc.ja.kind === 'bio' ? '接' + pc.ja.zone : '接壩起') : '起'), priority: 4, isCurveTick: false });
      if (pc.jb ? pc.jb.zk !== 'sub' : rv.s1 !== null) out.push({ s: +pc.b.toFixed(3), ptName: sh + (pc.jb ? (pc.jb.kind === 'wall' ? '接側牆迄' : pc.jb.kind === 'bio' ? '接' + pc.jb.zone : '接壩迄') : '迄'), priority: 4, isCurveTick: false });
      if (pc.ja && pc.ja.kind === 'wall' && pc.a + lt < pc.b - 0.02) out.push({ s: +(pc.a + lt).toFixed(3), ptName: '', priority: 2, isCurveTick: false });
      if (pc.jb && pc.jb.kind === 'wall' && pc.b - lt > pc.a + 0.02) out.push({ s: +(pc.b - lt).toFixed(3), ptName: '', priority: 2, isCurveTick: false });
    });
    rv.raises.concat(rv.wids || []).forEach(r => { const a = Math.min(r.s0, r.s1), b = Math.max(r.s0, r.s1); [a - r.t0, a, b, b + r.t1].forEach(s => { if (s > L.a + 0.02 && s < L.b - 0.02) out.push({ s: +s.toFixed(3), ptName: '', priority: 2, isCurveTick: false }); }); });
  });
  return out;
}
function rvIncZ(inc, ra, rb) {   // 縱斷面範圍：岸頂線（ra～rb：只計該樁號範圍，A3 分張用）
  state.revs.forEach(rv => { const L = rvLim(rv), al = state.alignment; if (!al.segments || !al.segments.length) return; const s0 = Math.max(L.a, al.startSta, ra ?? -Infinity), s1 = Math.min(L.b, al.endSta, rb ?? Infinity); if (!(s1 >= s0)) return; for (let s = s0; s <= s1 + 1e-6; s += (ra === undefined ? Math.max(2, (L.b - L.a) / 40) : Math.max(0.5, (s1 - s0) / 20))) { const z = getDesignZ(s); if (Number.isFinite(z)) { inc(z + rvAt(rv, s, 7).H); inc(z - rv.p.D); } } });
}
function rvTopTxt(s, sec) {
  const f = sd => { const R = sec.params && sec.params.rv && sec.params.rv[sd]; return R ? (sec.desCenterZ + R.H).toFixed(2) : '—'; };
  const a = f('L'), b = f('R'); return a === b ? a : a + '/' + b;
}
function rvRowBank(sec) { return rvTopTxt(0, sec); }
function rvRowFound(sec) {
  const f = sd => { const R = sec.params && sec.params.rv && sec.params.rv[sd]; return R ? (sec.desCenterZ + rvGeo(R, 0).zf).toFixed(2) : '—'; };
  const a = f('L'), b = f('R'); return a === b ? a : a + '/' + b;
}
/* ---- 平面圖 ---- */
const RV_COL = { L: '#22d3ee', R: '#f472b6' };
const RV_PLAN_COL = '#ffffff', RV_HI = '#22d3ee';   // 平面圖護岸線：白色三條線、不填滿；選取／預覽以青色外框
const rvEDefAt = s => { const sec = state.sections.find(x => Math.abs(x.sta - s) < 0.02); return sec && sec.params ? sec.params.W / 2 : (parseFloat(document.getElementById('desWidth').value) || 14) / 2; };
function rvPlanLines(rv, step) {   // → { pieces:[{toe,top,back,a,b}], wings:[[pt×4]], a, b }
  const al = state.alignment; if (!al.segments || !al.segments.length) return null;
  const sg = rvSg(rv), pieces = [];
  rvPiecesInfo(rv).forEach(pc => {
    const a = Math.max(pc.a, al.startSta), b = Math.min(pc.b, al.endSta); if (!(b > a)) return;
    const toe = [], top = [], back = [], n = Math.max(1, Math.ceil((b - a) / (step || 1))), eA = rvEDefAt(a), eB = rvEDefAt(b);
    for (let i = 0; i <= n; i++) {
      const s = a + (b - a) * i / n, g = getPointAndNormalAtStation(s); if (!g) continue;
      const R = rvAt(rv, s, eA + (eB - eA) * i / n), G = rvGeo(R, 0), e = R.e, at = G.a0, ab = G.a0b, P = o => [g.x - g.nx * sg * o, g.y - g.ny * sg * o];
      toe.push(P(e)); top.push(P(at)); back.push(P(ab));
    }
    if (toe.length > 1) {
      [[pc.ja, a, 0], [pc.jb, b, 1]].forEach(([j, sE, atEnd]) => {   // 接壩體上／下游面：頂線、背線止於壩面在護岸頂高程處（壩面有斜率時與趾線不同樁號）
        const s2 = rvFaceSta(rv, j, sE); if (s2 === null || Math.abs(s2 - sE) < 1e-4) return;
        const g2 = getPointAndNormalAtStation(s2); if (!g2) return; const R = rvAt(rv, sE, atEnd ? eB : eA), G = rvGeo(R, 0), P2 = o => [g2.x - g2.nx * sg * o, g2.y - g2.ny * sg * o];
        if (atEnd) { top[top.length - 1] = P2(G.a0); back[back.length - 1] = P2(G.a0b); } else { top[0] = P2(G.a0); back[0] = P2(G.a0b); }
      });
      pieces.push({ toe, top, back, a, b });
    }
  });
  if (!pieces.length) return null;
  const wings = [], eD = rvEDefAt(pieces[0].a);
  rvWings(rv).forEach(w => {
    const R = rvAt(rv, w.s, eD), C = rvCapGeo(R, rv.p); if (!C) return; const Tt = Math.max(0.05, +rv.p.ct || 0.3);
    const g1 = getPointAndNormalAtStation(w.s); if (!g1) return; const d = -w.inward * Tt, g2 = Object.assign({}, g1, { x: g1.x + g1.tx * d, y: g1.y + g1.ty * d });   // 沿切線往護岸端外側 T（中心線端點外亦可）
    const P = (g, o) => [g.x - g.nx * sg * o, g.y - g.ny * sg * o]; wings.push([P(g1, C.aMin), P(g1, C.aMax), P(g2, C.aMax), P(g2, C.aMin)]);
  });
  return { pieces, wings, a: pieces[0].a, b: pieces[pieces.length - 1].b };
}
function rvFaceSta(rv, j, sE) {   // 接壩體面（上游面／無側牆之下游面）：護岸頂高程處壩面的中心線樁號
  if (!j || !j.face || j.sid === undefined) return null; const st = state.structs.find(t => t.id === j.sid); if (!st) return null;
  let g = null; try { g = stGeo(st); } catch (e) { return null; } const H = rvAt(rv, sE, rvEDefAt(sE)).H;
  const u = j.face === 'up' ? g.uU(Math.min(H, g.maxW)) : g.uD(-st.p.h2 + H); return st.sta + st.dir * u;
}
function rvLenAt(rv, a, b) {   // a～b 間護岸實長（沿偏移線，e 取實際值）
  const sg = rvSg(rv), n = Math.max(1, Math.ceil((b - a) / 0.5)), eA = rvEDefAt(a), eB = rvEDefAt(b); let len = 0, pp = null;
  for (let i = 0; i <= n; i++) { const s = a + (b - a) * i / n, g = getPointAndNormalAtStation(s); if (!g) continue; const e = rvAt(rv, s, eA + (eB - eA) * i / n).e, P = [g.x - g.nx * sg * e, g.y - g.ny * sg * e]; if (pp) len += Math.hypot(P[0] - pp[0], P[1] - pp[1]); pp = P; }
  return len;
}
function rvStretches(rv) {   // 平面標示用：高度相同的連續段合併；加高漸變段另列。→ [{a,b,len,H1,H2,taper}]
  const al = state.alignment, out = [];
  rvPiecesInfo(rv).forEach(pc => {
    const a = Math.max(pc.a, al.startSta), b = Math.min(pc.b, al.endSta); if (!(b > a + 0.05)) return;
    const bp = [a, b]; rv.raises.forEach(r => { const x = Math.min(r.s0, r.s1), y = Math.max(r.s0, r.s1); [x - r.t0, x, y, y + r.t1].forEach(v => { if (v > a + 0.05 && v < b - 0.05) bp.push(v); }); });
    { const Lt = Math.max(0, rv.p.ldp ?? 5); ((state.profile && state.profile.drops) || []).forEach(d => { if (!d.sid || Math.abs(+d.dz || 0) < 1e-6) return; [d.sta, d.sta + (d.dz > 0 ? Lt : -Lt)].forEach(v => { if (v > a + 0.05 && v < b - 0.05) bp.push(v); }); }); }
    bp.sort((p, q) => p - q); const u = bp.filter((v, k) => !k || v - bp[k - 1] > 0.05), mine = [];
    for (let k = 0; k + 1 < u.length; k++) {
      const x = u[k], y = u[k + 1], H1 = rvAt(rv, x + 1e-4, 7).H, H2 = rvAt(rv, y - 1e-4, 7).H, Hm = rvAt(rv, (x + y) / 2, 7).H, taper = Math.abs(H1 - H2) > 1e-6 || Math.abs(Hm - (H1 + H2) / 2) > 1e-6;
      const prev = mine[mine.length - 1];
      if (!taper && prev && !prev.taper && Math.abs(prev.H2 - H1) < 1e-6) { prev.b = y; prev.H2 = H2; } else mine.push({ a: x, b: y, H1, H2, taper });
    }
    mine.forEach(m => { m.len = rvLenAt(rv, m.a, m.b); out.push(m); });
  });
  return out;
}
const rvLabTxt = m => [`${formatStation(m.a)}～${formatStation(m.b)}`, m.taper ? `漸變 L=${rvF(m.len, 1)}　H=${rvF(m.H1)}→${rvF(m.H2)}` : `L=${rvF(m.len, 1)}　H=${rvF(m.H1)}`];
function rvHandlePt(rv, which) {   // 起／迄端點小方塊位置（腳線上）
  const al = state.alignment, L = rvLim(rv), s = Math.max(al.startSta, Math.min(al.endSta, which === 's0' ? L.a : L.b)), g = getPointAndNormalAtStation(s); if (!g) return null;
  const sg = rvSg(rv), e = rvAt(rv, s, rvEDefAt(s)).e; return { s, x: g.x - g.nx * sg * e, y: g.y - g.ny * sg * e };
}
function rvJoints(rv) {   // 與前一段的「直接換」接點：沿法線的連接線範圍 {s, o0, o1}
  const pv = rvPrev(rv); if (!pv || (rv.j0 && rv.j0.m === 'taper')) return null; const s = rvLim(rv).a, al = state.alignment;
  if (s < al.startSta - 1e-6 || s > al.endSta + 1e-6) return null;
  if (!rvPiecesInfo(rv).some(pc => Math.abs(pc.a - s) < 0.02) || !rvPiecesInfo(pv).some(pc => Math.abs(pc.b - s) < 0.02)) return null;
  const ed = rvEDefAt(s), A = rvAt(pv, s, ed), B = rvAt(rv, s, ed), GA = rvGeo(A, 0), GB = rvGeo(B, 0);
  return { s, o0: Math.min(A.e, B.e), o1: Math.max(GA.a0b, GB.a0b) };
}
function rvHitTest(wpt) {   // 平面圖點位落在哪一段護岸（index 或 -1）
  if (!state.revs || !state.revs.length) return -1;
  const proj = projectWorldPointToAlignment(wpt.x, wpt.y); if (!proj) return -1;
  const d = (wpt.x - proj.x) * proj.nx + (wpt.y - proj.y) * proj.ny, side = d > 0 ? 'L' : 'R', ao = Math.abs(d), tol = 6 * rvPxW();
  let hit = -1;
  state.revs.forEach((r, i) => {
    if (r.side !== side || !rvVis(r) || !rvPiecesInfo(r).some(pc => proj.sta >= pc.a - 1e-6 && proj.sta <= pc.b + 1e-6)) return;
    const R = rvAt(r, proj.sta, rvEDefAt(proj.sta)); if (ao >= R.e - tol && ao <= rvGeo(R, 0).a0b + tol) hit = i;
  });
  return hit;
}
let RV_HOVT = 0;
function rvHover(wpt) { const now = performance.now(); if (now - RV_HOVT < 40) return; RV_HOVT = now; const h = rvHitTest(wpt); if (h !== state.rvHover) { state.rvHover = h; requestRedraw(); } }
/* ---- 標示放置：沿護岸外側（遠離河道）引線，避開護岸線、中心線、結構物外形與其他標示 ---- */
function rvSegHitsRect(ax, ay, bx, by, r) {   // 線段與矩形相交（Liang–Barsky）
  let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay;
  for (const [p, q] of [[-dx, ax - r.x0], [dx, r.x1 - ax], [-dy, ay - r.y0], [dy, r.y1 - ay]]) {
    if (Math.abs(p) < 1e-12) { if (q < 0) return false; continue; }
    const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}
function rvPlaceLabel(A, ux, uy, w, h, segs, placed, o0, dO, nO) {   // A：引線起點；(ux,uy)：外側單位向量；回傳 {cx,cy,r}
  const tx = -uy, ty = ux, shifts = [0, 1, -1, 2, -2];
  const ok = r => !placed.some(q => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0) && !segs.some(sg => !(sg[4] < r.x0 || sg[5] > r.x1 || sg[6] < r.y0 || sg[7] > r.y1) && rvSegHitsRect(sg[0], sg[1], sg[2], sg[3], r));
  const sup = Math.abs(ux) * w / 2 + Math.abs(uy) * h / 2, tl = Math.abs(tx) * w / 2 + Math.abs(ty) * h / 2;   // 盒子沿外側方向／切向的半寬
  const mk = (off, f) => { const cx = A.x + ux * (off + sup) + tx * f * tl, cy = A.y + uy * (off + sup) + ty * f * tl; return { cx, cy, r: { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 } }; };
  for (let k = 0; k < nO; k++) for (const f of shifts) { const c = mk(o0 + k * dO, f); if (ok(c.r)) return c; }
  return mk(o0 + nO * dO, 0);
}
function rvObstSegs(map, clip) {   // 障礙線段（已投影）：所有護岸三線、中心線、結構物平面外形；clip＝只取此範圍內
  const out = [], add = (P, Q) => { const a = map(P), b = map(Q); if (!a || !b) return; const sg = [a.x, a.y, b.x, b.y, Math.max(a.x, b.x), Math.min(a.x, b.x), Math.max(a.y, b.y), Math.min(a.y, b.y)]; if (clip && (sg[4] < clip.x0 || sg[5] > clip.x1 || sg[6] < clip.y0 || sg[7] > clip.y1)) return; out.push(sg); };
  const line = pts => { for (let i = 0; i < pts.length - 1; i++) add(pts[i], pts[i + 1]); };
  state.revs.forEach(rv => { if (!rvVis(rv)) return; const P = rvPlanLines(rv, 1); if (!P) return; P.pieces.forEach(pc => { line(pc.toe); line(pc.top); line(pc.back); }); });
  try { const al = state.alignment; if (al.segments && al.segments.length) { const C = []; for (let s = al.startSta; s <= al.endSta + 1e-6; s += Math.max(1, (al.endSta - al.startSta) / 400)) { const g = getPointAndNormalAtStation(Math.min(s, al.endSta)); if (g) C.push([g.x, g.y]); } line(C); } } catch (e) { }
  try { (state.structs || []).forEach(st => { const g = stGeo(st); const P = g.plan.map(q => stWorld(st, q[0], q[1])).filter(Boolean); if (P.length > 1) line(P.concat([P[0]])); }); } catch (e) { }
  return out;
}
function rvDrawPlan() {
  if (!state.revs || !state.revs.length || state.viewMode !== '2D') return;
  const placed = [], S1 = p => worldToScreen2D(p[0], p[1]), cw0 = cadCanvas.width / window.devicePixelRatio, ch0 = cadCanvas.height / window.devicePixelRatio;
  const OBS = rvObstSegs(p => worldToScreen2D(p[0], p[1]), { x0: -200, y0: -200, x1: cw0 + 200, y1: ch0 + 200 });
  state.revs.forEach((rv, i) => {
    if (!rvVis(rv)) return;
    const P = rvPlanLines(rv, 1); if (!P) return; const sel = i === state.rvSel, hov = i === state.rvHover && !sel, col = RV_PLAN_COL;
    ctx.save(); ctx.setLineDash([]);
    const path = pts => { ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); };
    if (sel || hov) P.pieces.forEach(pc => {   // 選取／預覽：青色外框＋淡填色
      const T = pc.toe.map(S1), K = pc.back.map(S1); ctx.beginPath(); T.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); K.slice().reverse().forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath();
      ctx.fillStyle = sel ? 'rgba(34,211,238,0.22)' : 'rgba(34,211,238,0.10)'; ctx.fill(); ctx.strokeStyle = RV_HI; ctx.globalAlpha = sel ? 0.9 : 0.55; ctx.lineWidth = sel ? 6 : 4; ctx.stroke(); ctx.globalAlpha = 1;
    });
    ctx.strokeStyle = col;
    P.pieces.forEach(pc => {
      const T = pc.toe.map(S1), M = pc.top.map(S1), K = pc.back.map(S1);
      ctx.lineWidth = sel ? 2 : 1.4; path(T); path(M); ctx.setLineDash([6, 3]); path(K); ctx.setLineDash([]);
      ctx.lineWidth = sel ? 1.6 : 1.1; [[T[0], M[0], K[0]], [T[T.length - 1], M[M.length - 1], K[K.length - 1]]].forEach(c => path(c));
    });
    const J = rvJoints(rv); if (J) { const g = getPointAndNormalAtStation(J.s); if (g) { const sg = rvSg(rv), a = worldToScreen2D(g.x - g.nx * sg * J.o0, g.y - g.ny * sg * J.o0), b = worldToScreen2D(g.x - g.nx * sg * J.o1, g.y - g.ny * sg * J.o1); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
    P.wings.forEach(w => { const q = w.map(S1); ctx.lineWidth = 1.2; ctx.beginPath(); q.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke(); });
    // 標示：里程、長度、高度（高度相同的連續段只標一次，有變化才另標）；一律以引線拉到護岸外側，避開線條與其他文字；選取／預覽時名稱併入框內第一行
    ctx.font = '11.5px "Noto Sans TC"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const SM = rvStretches(rv), big = SM.reduce((m2, x, k) => (x.b - x.a > SM[m2].b - SM[m2].a ? k : m2), 0);
    SM.forEach((m, mi) => {
      const sm = (m.a + m.b) / 2, g = getPointAndNormalAtStation(sm); if (!g) return;
      const sg = rvSg(rv), R = rvAt(rv, sm, rvEDefAt(sm)), at = R.e, ab = rvGeo(R, 0).a0b, A = worldToScreen2D(g.x - g.nx * sg * ab, g.y - g.ny * sg * ab), B = worldToScreen2D(g.x - g.nx * sg * at, g.y - g.ny * sg * at);
      let ux = A.x - B.x, uy = A.y - B.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul; if (ul < 1e-6) { ux = 0; uy = rv.side === 'L' ? -1 : 1; }
      const tx = rvLabTxt(m), nm = (sel || hov) && mi === big ? `${rvShort(rv)}　${tcType(rv.type).label}` : null, lines = nm ? [nm, ...tx] : tx;
      ctx.font = '11.5px "Noto Sans TC"'; const w = Math.max(...lines.map(t => ctx.measureText(t).width)) + 10, h = 15 * lines.length + 2;
      const c = rvPlaceLabel(A, ux, uy, w, h, OBS, placed, 18, 14, 18);
      placed.push(c.r); const ex = Math.max(c.r.x0, Math.min(c.r.x1, A.x)), ey = Math.max(c.r.y0, Math.min(c.r.y1, A.y));
      ctx.lineWidth = 1; ctx.strokeStyle = sel ? RV_HI : col; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.beginPath(); ctx.arc(A.x, A.y, 2, 0, Math.PI * 2); ctx.fillStyle = sel ? RV_HI : col; ctx.fill();
      ctx.fillStyle = 'rgba(11,16,24,.88)'; ctx.fillRect(c.r.x0, c.r.y0, w, h); if (sel || hov) { ctx.strokeStyle = RV_HI; ctx.strokeRect(c.r.x0, c.r.y0, w, h); }
      lines.forEach((t, k) => { const yy = c.r.y0 + 9 + k * 15; if (nm && k === 0) { ctx.fillStyle = sel ? RV_HI : 'rgba(34,211,238,.75)'; ctx.fillRect(c.r.x0 + 1, c.r.y0 + 1, w - 2, 15); ctx.fillStyle = '#0b1018'; ctx.font = 'bold 11.5px "Noto Sans TC"'; } else { ctx.fillStyle = col; ctx.font = '11.5px "Noto Sans TC"'; } ctx.fillText(t, c.cx, yy); });
    });
    ctx.textBaseline = 'alphabetic';
    if (sel) (rv.cps || []).forEach((c, k) => { const hp = rvCpPt(rv, c); if (!hp) return; const q = worldToScreen2D(hp.x, hp.y); ctx.save(); ctx.fillStyle = '#22d3ee'; ctx.strokeStyle = '#0b1018'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.font = 'bold 10.5px "Noto Sans TC"'; ctx.textAlign = 'left'; const t = `控${k + 1} ${formatStation(c.s)} e=${rvF(c.e)}`, w = ctx.measureText(t).width + 8; ctx.fillStyle = 'rgba(11,16,24,.9)'; ctx.fillRect(q.x + 8, q.y + 4, w, 14); ctx.fillStyle = '#22d3ee'; ctx.fillText(t, q.x + 12, q.y + 15); ctx.restore(); });
    if (sel) ['s0', 's1'].forEach(wh => {   // 端點小方塊＋樁號
      const hp = rvHandlePt(rv, wh); if (!hp) return; const q = worldToScreen2D(hp.x, hp.y);
      if (state.rvFlash && state.rvFlash.wh === wh) { ctx.save(); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; [14, 24].forEach(rr => { ctx.beginPath(); ctx.arc(q.x, q.y, rr, 0, Math.PI * 2); ctx.stroke(); }); ctx.restore(); } ctx.fillStyle = '#fff'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.fillRect(q.x - 5, q.y - 5, 10, 10); ctx.strokeRect(q.x - 5, q.y - 5, 10, 10);
      const t = (wh === 's0' ? '起 ' : '迄 ') + formatStation(hp.s); ctx.font = 'bold 11px "Noto Sans TC"'; ctx.textAlign = 'left'; const w = ctx.measureText(t).width + 8; ctx.fillStyle = 'rgba(11,16,24,.9)'; ctx.fillRect(q.x + 8, q.y - 18, w, 15); ctx.fillStyle = '#fbbf24'; ctx.fillText(t, q.x + 12, q.y - 7);
    });
    ctx.restore();
  });
}
function rvDxfPlan(D) {
  const placed = [], TH = 1.6, OBS = rvObstSegs(p => ({ x: p[0], y: p[1] }), null);
  state.revs.forEach(rv => {
    if (!rvVis(rv)) return; const P = rvPlanLines(rv, 1); if (!P) return; const col = 7;
    const J = rvJoints(rv); if (J) { const g = getPointAndNormalAtStation(J.s); if (g) { const sg = rvSg(rv); D.line(g.x - g.nx * sg * J.o0, g.y - g.ny * sg * J.o0, 0, g.x - g.nx * sg * J.o1, g.y - g.ny * sg * J.o1, 0, 'REV_BACK', col); } }
    P.pieces.forEach(pc => { D.poly(pc.toe, 'REV_TOE', col); D.poly(pc.top, 'REV_TOP', col); D.poly(pc.back, 'REV_BACK', col, 0, false, 'DASHED');
      D.poly([pc.toe[0], pc.top[0], pc.back[0]], 'REV_BACK', col); const n = pc.toe.length - 1; D.poly([pc.toe[n], pc.top[n], pc.back[n]], 'REV_BACK', col); });
    P.wings.forEach(w => D.poly(w, 'REV_WING', col, 0, true));
    rvStretches(rv).forEach(m => {   // 與畫面相同：引線拉到護岸外側、避開線條與其他標示（世界座標）
      const sm = (m.a + m.b) / 2, g = getPointAndNormalAtStation(sm); if (!g) return; const sg = rvSg(rv), R = rvAt(rv, sm, rvEDefAt(sm)), ab = rvGeo(R, 0).a0b;
      const A = { x: g.x - g.nx * sg * ab, y: g.y - g.ny * sg * ab }, ux = -g.nx * sg, uy = -g.ny * sg, tx = rvLabTxt(m), w = Math.max(stTextW(tx[0], TH), stTextW(tx[1], TH)) + 1, h = TH * 2.8;
      const c = rvPlaceLabel(A, ux, uy, w, h, OBS, placed, 1.2, 1.0, 18);
      placed.push(c.r); const ex = Math.max(c.r.x0, Math.min(c.r.x1, A.x)), ey = Math.max(c.r.y0, Math.min(c.r.y1, A.y)); D.line(A.x, A.y, 0, ex, ey, 0, 'REV_TEXT', col);
      D.text(c.cx, c.cy + TH * 0.25, TH, tx[0], 'REV_TEXT', col, { align: 'c' }); D.text(c.cx, c.cy - TH * 1.3, TH, tx[1], 'REV_TEXT', col, { align: 'c' });
    });
  });
}

/* ---- 縱斷面：兩岸岸頂線 ---- */
const rvPfOn = k => { const el = document.getElementById('pfRv' + k); return !el || el.checked; };   // k: TL TR BL BR（縱斷面：護岸頂／基礎底線勾選）
function rvPieces(rv) { return rvPiecesInfo(rv).map(pc => [pc.a, pc.b]); }
function rvProfLines(rv, minSta, maxSta) {   // 回傳 [{kind:'T'|'B', pts:[[s,z]...], label}]
  const al = state.alignment, out = [], sd = rv.side, name = rvName(rv); if (!rvVis(rv)) return out;
  rvPieces(rv).forEach(([p0, p1], pi) => {
    const a = Math.max(p0, al.startSta, minSta), b = Math.min(p1, al.endSta, maxSta); if (!(b > a)) return;
    const st = Math.max(0.5, (b - a) / 300), T = [], B = [];
    for (let s = a; s <= b + 1e-6; s += st) { const q = Math.min(s, b), R = rvAt(rv, q, 7), zd = getDesignZ(q); T.push([q, zd + R.H]); B.push([q, zd + rvGeo(R, 0).zf]); if (q >= b) break; }
    if (rvPfOn('T' + sd)) out.push({ kind: 'T', pts: T, label: name + ' 岸頂', first: pi === 0 });
    if (rvPfOn('B' + sd)) out.push({ kind: 'B', pts: B, label: name + ' 基礎底', first: pi === 0 });
  });
  return out;
}
function rvDrawProfile(sx, sy, minSta, maxSta) {
  if (!state.revs.length) return; const al = state.alignment; if (!al.segments || !al.segments.length) return;
  state.revs.forEach((rv, ri) => {
    rvProfLines(rv, minSta, maxSta).forEach(ln => {
      ctx.save(); ctx.strokeStyle = RV_COL[rv.side]; ctx.lineWidth = (ln.kind === 'T' ? 1.4 : 1.1) * (ri === state.rvSel ? 2 : 1); ctx.setLineDash(ln.kind === 'T' ? [6, 3] : [2, 3]); ctx.beginPath();
      ln.pts.forEach((p, k) => { const x = sx(p[0]), y = sy(p[1]); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke(); ctx.setLineDash([]);
      if (ln.first) { ctx.font = '10.5px "Noto Sans TC"'; ctx.fillStyle = RV_COL[rv.side]; ctx.textAlign = 'left'; const p = ln.pts[0], dy = (ri % 3) * 11 * (ln.kind === 'T' ? -1 : 1); ctx.fillText(ln.label, sx(p[0]) + 4, sy(p[1]) + (ln.kind === 'T' ? -5 : 12) + dy); }
      ctx.restore();
    });
  });
}
function rvDxfProfile(D, X, Y, minSta, maxSta, th) {
  const al = state.alignment; if (!al.segments || !al.segments.length) return;
  state.revs.forEach((rv, ri) => {
    rvProfLines(rv, minSta, maxSta).forEach(ln => {
      const pts = ln.pts.map(p => [X(p[0]), Y(p[1])]); if (pts.length < 2) return;
      D.poly(pts, 'PROF_REV', rv.side === 'L' ? 4 : 6, 0, false, 'DASHED');
      if (ln.first) D.text(pts[0][0] + th * 0.3, pts[0][1] + (ln.kind === 'T' ? 0.3 : -1.1) * th + (ri % 3) * th * 1.1 * (ln.kind === 'T' ? 1 : -1), th * 0.8, ln.label, 'PROF_REV', rv.side === 'L' ? 4 : 6);
    });
  });
}

/* ---- 橫斷面 ---- */
const RV_MAT = { conc: { c: '#ffe600', f: 'rgba(255,230,0,0.10)', ly: 'REV_WALL', a: 2 }, stone: { c: '#e2e8f0', f: 'rgba(226,232,240,0.14)', ly: 'REV_STONE', a: 7 }, gravel: { c: '#d946ef', f: 'rgba(217,70,239,0.12)', ly: 'REV_GRAVEL', a: 6 }, pc: { c: '#94a3b8', f: 'rgba(148,163,184,0.18)', ly: 'REV_PC', a: 8 } };
/* ---- 橫斷面護岸尺寸線（v5.3：只標尺寸，不標 EL／W 文字）：H、D 直向串列、頂寬、距中心線 e、坡度小三角；統一避讓 ---- */
function rvRectHit(r, L) { return L.some(q => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0); }
function rvDimSet(g, sx, sy, o, REG) {   // o：{ydn:螢幕y向下?, gap, step, over, tk, th, cw(字寬係數)}；回傳 {ln, tx, tri}
  const sg = g.sg, X = a => sx(sg * a), Y = z => sy(z), R = g.R, G = g.G, B = g.B, out = { ln: [], tx: [], tri: [] }, up = o.ydn ? -1 : 1;
  const aMax = Math.max(G.a0b, ...G.polys.flatMap(pg => pg.pts.map(p => p[0]))), so = Math.sign(X(aMax + 1) - X(aMax)) || 1;
  const tRect = (x, y, s, rot) => { const w = s.length * o.th * o.cw, h = o.th * 1.1; return rot ? { x0: x - h / 2, x1: x + h / 2, y0: y - w / 2, y1: y + w / 2 } : { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 }; };
  const place = (mk) => { for (let k = 0; k < 4; k++) { const d = mk(k); if (!d.tx.some(t => rvRectHit(tRect(t.x, t.y, t.s, t.rot), REG))) { d.tx.forEach(t => REG.push(tRect(t.x, t.y, t.s, t.rot))); return d; } } const d = mk(3); d.tx = []; return d; };   // 往外推 3 次仍重疊者省略文字
  const push = d => { out.ln.push(...d.ln); out.tx.push(...d.tx); };
  // v5.4：D、H 直向尺寸與距中心線 e 不標（只留頂寬與坡度三角）
  // 頂寬（臨水面頂緣 → 背面頂緣）
  if (G.a0b - G.a0 > 0.02) push(place(k => { const yd = Y(B.zTop) + up * -1 * -1 * 0 + (o.ydn ? -1 : 1) * (o.gap * 0.8 + k * o.step); const ln = [[X(G.a0), yd, X(G.a0b), yd]];
    [G.a0, G.a0b].forEach(a => ln.push([X(a), Y(B.zTop) + (o.ydn ? -1 : 1) * o.gap * 0.25, X(a), yd + (o.ydn ? -1 : 1) * o.over], [X(a) - o.tk, yd + o.tk, X(a) + o.tk, yd - o.tk]));
    return { ln, tx: [{ x: (X(G.a0) + X(G.a0b)) / 2, y: yd + (o.ydn ? -1 : 1) * o.th * 0.7, s: rvF(G.a0b - G.a0), rot: false }] }; }));
  // 坡度小三角（臨水面中段，河道側）：直邊 1、橫邊 n
  if (R.n > 0.01 && B.zTop - g.zc > 0.3) { const zm = g.zc + (B.zTop - g.zc) * 0.55, am = R.e + R.n * (zm - g.zc), px = X(am), py = Y(zm), L = o.tri, d = -so;
    out.tri.push({ p: [[px, py], [px + d * L * R.n, py], [px + d * L * R.n, py + (o.ydn ? 1 : -1) * L]], t1: { x: px + d * (L * R.n + o.th * 0.6), y: py + (o.ydn ? 1 : -1) * L / 2, s: '1' }, tn: { x: px + d * L * R.n / 2, y: py - (o.ydn ? 1 : -1) * o.th * 0.6, s: rvF(R.n) } }); }
  return out;
}
function rvSkewAt(rv, s) {   // 護岸平面走向與斷面法線的斜交角（e 沿樁號變化 → de/ds；忽略曲率差）
  try { const d = 1, e0 = rvAt(rv, s - d, rvEDefAt(s - d)).e, e1 = rvAt(rv, s + d, rvEDefAt(s + d)).e, t = Math.atan2(e1 - e0, 2 * d); return { deg: t * 180 / Math.PI, f: 1 / Math.cos(t) }; } catch (e) { return { deg: 0, f: 1 }; }
}
function rvDrawCross(sec, sx, sy, isLarge) {
  if (!sec.bkInfo) return;
  const G0 = { L: rvGeomSec(sec, 'L'), R: rvGeomSec(sec, 'R') }; if (!G0.L && !G0.R) return;
  const REG = window.CXL || []; if (isLarge) { const cx = sx(0); [sec.groundCenter, sec.desCenterZ].forEach(z => REG.push({ x0: cx - 4, x1: cx + 95, y0: sy(z) - 34, y1: sy(z) + 34 })); }   // 中心線高程標籤（稍後繪出）預留
  ctx.save(); ctx.setLineDash([]); ctx.lineJoin = 'round';
  ['L', 'R'].forEach(sd => {
    const g = G0[sd]; if (!g || !rvVis(g.R.rv)) return; const sg = g.sg, X = a => sx(sg * a), Y = z => sy(z), R = g.R, B = g.B, G = g.G, sel = state.revs[state.rvSel] === R.rv;
    if (g.trench.need) {   // 開挖線
      const T = g.trench; ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = isLarge ? 1.1 : 0.8; ctx.setLineDash([7, 4]); ctx.beginPath();
      ctx.moveTo(X(T.aF), Y(T.zF)); ctx.lineTo(X(T.aF0), Y(T.zf)); ctx.lineTo(X(T.aB0), Y(T.zf)); ctx.lineTo(X(T.aB), Y(T.zB)); ctx.stroke(); ctx.setLineDash([]);
    }
    if (R.T.layered) { ctx.save(); ctx.fillStyle = '#0b1018'; G.polys.forEach(pg => { ctx.beginPath(); pg.pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.closePath(); ctx.fill(); }); ctx.restore(); }   // v6.3i 分層籠體：先以底色遮住地形線、填方線，籠體畫在最上層
    if (R.T.orig && G.A) { const S = tcoSecPrims(R.T, R); tcoCanvas(S.O, (x, y) => [X(G.A(x)), Y(G.Z(y))], Math.abs(sx(1) - sx(0)) / 100, { lite: !isLarge }); }   // 原圖細部
    if (R.T.layered && isLarge) { const k = rvSkewAt(R.rv, sec.sta); if (Math.abs(k.deg) >= 2) { const top = G.polys.flat ? null : null; void top; let zt = -Infinity, at = 0; G.polys.forEach(pg => pg.pts.forEach(p => { if (p[1] > zt) { zt = p[1]; at = p[0]; } }));
      ctx.save(); ctx.font = 'bold 10.5px "Noto Sans TC"'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center'; ctx.fillText(`斜交 ${Math.abs(k.deg).toFixed(1)}°（斷面所見寬 ×${k.f.toFixed(3)}）`, X(at), Y(zt) - 30); ctx.restore(); } }
    else G.polys.forEach(pg => { const M = RV_MAT[pg.m] || RV_MAT.conc; ctx.strokeStyle = M.c; ctx.fillStyle = M.f; ctx.lineWidth = (isLarge ? 1.8 : 1.2) * (sel ? 1.4 : 1);
      ctx.beginPath(); pg.pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(X(B.e), Y(g.zc)); ctx.lineTo(X(B.a0b), Y(g.zc)); ctx.strokeStyle = '#ffe600'; ctx.lineWidth = 0.6; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);   // 設計河床高處的分界
    if (g.pipe) {   // 排水管（示意）
      const P = g.pipe, w = P.w / 2; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 0.9; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(X(P.a0), Y(P.z0 + w)); ctx.lineTo(X(P.a1), Y(P.z1 + w)); ctx.moveTo(X(P.a0), Y(P.z0 - w)); ctx.lineTo(X(P.a1), Y(P.z1 - w)); ctx.stroke(); ctx.setLineDash([]);
    }
    if (isLarge) {   // 只標尺寸（H、D、頂寬、e、坡度三角）
      const DS = rvDimSet(g, sx, sy, { ydn: true, gap: 26, step: 18, over: 4, tk: 3, th: 10.5, cw: 0.62, tri: 16 }, REG);
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 0.7; ctx.beginPath(); DS.ln.forEach(a => { ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); }); ctx.stroke();
      ctx.fillStyle = '#e2e8f0'; ctx.font = '10.5px "JetBrains Mono","Noto Sans TC"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      DS.tx.forEach(t => { ctx.save(); ctx.translate(t.x, t.y); if (t.rot) ctx.rotate(-Math.PI / 2); ctx.fillText(t.s, 0, 0); ctx.restore(); });
      DS.tri.forEach(T => { ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); T.p.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke(); ctx.fillStyle = '#94a3b8'; ctx.font = '9px "JetBrains Mono"'; ctx.fillText(T.t1.s, T.t1.x, T.t1.y); ctx.fillText(T.tn.s, T.tn.x, T.tn.y); });
      ctx.textBaseline = 'alphabetic';
    }
  });
  ctx.restore();
}
function rvDxfCross(D, sec, sx, sy, TH) {
  const REG = [{ x0: sx(0) - 0.2, x1: sx(0) + 4.5, y0: sy(sec.groundCenter) - 1.6, y1: sy(sec.groundCenter) + 1.6 }, { x0: sx(0) - 0.2, x1: sx(0) + 4.5, y0: sy(sec.desCenterZ) - 1.6, y1: sy(sec.desCenterZ) + 1.6 }];
  ['L', 'R'].forEach(sd => {
    const g = rvGeomSec(sec, sd); if (!g || !rvVis(g.R.rv)) return; const sg = g.sg, X = a => sx(sg * a), Y = z => sy(z), R = g.R, B = g.B;
    if (g.trench.need) { const T = g.trench; D.poly([[X(T.aF), Y(T.zF)], [X(T.aF0), Y(T.zf)], [X(T.aB0), Y(T.zf)], [X(T.aB), Y(T.zB)]], 'REV_EXC', 6, 0, false, 'DASHED'); }
    if (R.T.orig && g.G.A) { const S = tcoSecPrims(R.T, R); tcoDxf(D, S.O, (x, y) => [X(g.G.A(x)), Y(g.G.Z(y))], 0.01, 'REV_'); }
    if (R.T.layered) { const k = rvSkewAt(R.rv, sec.sta); if (Math.abs(k.deg) >= 2) { let zt = -Infinity, at = 0; g.G.polys.forEach(pg => pg.pts.forEach(p => { if (p[1] > zt) { zt = p[1]; at = p[0]; } })); D.text(X(at), Y(zt) + TH * 2.2, TH * 0.7, `斜交 ${Math.abs(k.deg).toFixed(1)}°（斷面所見寬 ×${k.f.toFixed(3)}）`, 'REV_DIM', 2, { align: 'c' }); } }
    else g.G.polys.forEach(pg => { const M = RV_MAT[pg.m] || RV_MAT.conc; D.poly(pg.pts.map(p => [X(p[0]), Y(p[1])]), M.ly, M.a, 0, true); });
    D.line(X(B.e), Y(g.zc), 0, X(B.a0b), Y(g.zc), 0, 'REV_WALL', 8, 'DASHED');
    if (g.pipe) { const P = g.pipe, w = P.w / 2; D.line(X(P.a0), Y(P.z0 + w), 0, X(P.a1), Y(P.z1 + w), 0, 'REV_PIPE', 5, 'DASHED'); D.line(X(P.a0), Y(P.z0 - w), 0, X(P.a1), Y(P.z1 - w), 0, 'REV_PIPE', 5, 'DASHED'); }
    const DS = rvDimSet(g, sx, sy, { ydn: false, gap: 1.3, step: 0.9, over: 0.2, tk: 0.15, th: TH * 0.8, cw: 0.62, tri: 0.8 }, REG);
    DS.ln.forEach(a => D.line(a[0], a[1], 0, a[2], a[3], 0, 'REV_DIM', 7));
    DS.tx.forEach(t => D.text(t.x, t.y, TH * 0.8, t.s, 'REV_DIM', 7, { align: 'c', valign: 'm', rot: t.rot ? 90 : 0 }));
    DS.tri.forEach(T => { D.poly(T.p, 'REV_DIM', 8, 0, true); D.text(T.t1.x, T.t1.y, TH * 0.6, T.t1.s, 'REV_DIM', 8, { align: 'c', valign: 'm' }); D.text(T.tn.x, T.tn.y, TH * 0.6, T.tn.s, 'REV_DIM', 8, { align: 'c', valign: 'm' }); });
  });
}
/* ---- 標準圖（典型斷面＋數量）：依範本繪製，S=1:100，圖元單位 m ---- */
function rvStdModel(rv) {   // 標準圖模式：典型斷面（起點參數、兩岸對稱示意、示意地形）→ { R, G, gz, B, fe, q }
  const p = rv.p, T = tcType(rv.type), zc = 0, R = Object.assign({}, p, { H: p.H, e: 6, run: Math.max(p.n * p.H, 0.001), rv, T }), G = T.geo(R, zc);
  const hb = p.sgH === null || p.sgH === undefined ? 0.7 * p.H : p.sgH, gs = p.sgS || 0;
  const gz = a => (a <= R.e ? zc : a <= G.a0b ? zc + hb * (a - R.e) / Math.max(1e-6, G.a0b - R.e) : zc + hb + gs * (a - G.a0b));   // 示意地形：前方＝設計河床，背後高 hb、坡度 gs
  const hS = G.a0b + 40, { B } = rvBank(R, R.e, zc, hS, gz, {}), slope = rvSlope(), dz = a => designOffsetZ(a, zc, { W: 2 * R.e }, slope, gz(a), { [-1]: B, 1: B });
  const fe = rvFillEx(G, R, zc, gz, dz, hS), q = Object.assign({}, T.qty(G, R), { EX: fe.ex, BF: fe.bf });
  return { R, G, gz, B, dz, q, hS, T, zc };
}
function rvStdPrims(rv) {
  { const TY0 = tcType(rv.type); if (TY0.orig) {   // 原圖移植型式：標準圖＝原工具完整圖面（斷面／立面／平面／數量表），參數取本段
    const S0 = rvStdModel(rv), m = TY0.orig.model(S0.R), P = tcoStdPrims(TY0.orig.prims(m, {}, 'all'), 0.01, 0, 0), bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }, ext = (a, b) => { bb.x0 = Math.min(bb.x0, a); bb.x1 = Math.max(bb.x1, a); bb.y0 = Math.min(bb.y0, b); bb.y1 = Math.max(bb.y1, b); };
    P.forEach(o => { if (o.t === 't') { ext(o.x, o.y); ext(o.x + (o.al === 'l' ? 1 : (o.al === 'r' ? -1 : 0.5)) * o.s.length * o.h, o.y); } else o.p.forEach(v => ext(v[0], v[1])); });
    P.push({ t: 't', x: bb.x0, y: bb.y1 + 0.35, h: 0.2, s: `${rvName(rv)}　${TY0.label}（原圖移植）　參數取本段起點：${TY0.layered ? `${S0.R.N_layer} 層、` : ''}河床以上 H=${rvF(S0.R.H * 100, 0)} cm、埋深 D=${rvF(S0.R.D * 100, 0)} cm、1:${rvF(S0.R.n)}`, c: '#ffd08a', a: 30, ly: 'STD_TITLE', al: 'l', va: 'b', rot: 0 }); bb.y1 += 0.7;
    rvStdAddCap(rv, P, bb); return { P, bb };
  } }
  const S = rvStdModel(rv), { R, G, gz, B, q, zc } = S, TY = S.T, P = [], TH = 0.3, p = rv.p, e = R.e;
  const L = (pts, c, a, ly, o = {}) => { const qq = pts.filter(v => Number.isFinite(v[0]) && Number.isFinite(v[1])); if (qq.length > 1) P.push({ t: 'l', p: qq, c, a, ly, d: o.d || 0, w: o.w || 1, cl: !!o.cl }); };
  const T = (x, y, h, s, c, a, ly, o = {}) => P.push({ t: 't', x, y, h, s: String(s), c, a, ly, al: o.al || 'l', va: o.va || 'b', rot: o.rot || 0 });
  const slope = rvSlope(), dz = (o, g) => designOffsetZ(o, zc, { W: 2 * e }, slope, g, { [-1]: B, 1: B });
  const aMaxD = G.a0b + Math.max(0, R.sdx) + 8 + R.H, gLine = [], dLine = [];
  for (let o = -aMaxD; o <= aMaxD + 1e-9; o += 0.25) { const a = Math.abs(o), g = gz(a); gLine.push([o, g]); dLine.push([o, dz(o, a <= e ? zc : g)]); }
  [gLine.filter(v => v[0] <= -G.a0b + 1e-9), gLine.filter(v => Math.abs(v[0]) <= e + 1e-9), gLine.filter(v => v[0] >= G.a0b - 1e-9)].forEach(g => L(g, '#cbd5e1', 8, 'STD_GROUND'));
  L(dLine, '#38bdf8', 5, 'STD_DESIGN', { d: 1 });
  [-1, 1].forEach(sg => {
    const X = a => sg * a;
    G.polys.forEach(pg => { const M = RV_MAT[pg.m] || RV_MAT.conc; L(pg.pts.map(q2 => [X(q2[0]), q2[1]]), M.c, M.a, 'STD_' + pg.m.toUpperCase(), { cl: true }); });
    L([[X(e), zc], [X(G.a0b), zc]], '#ffe600', 2, 'STD_STRUCT', { d: 1, w: 0.5 });
    const T2 = rvTrench(R, zc, gz, S.hS, G);
    if (T2.need) L([[X(T2.aF), T2.zF], [X(T2.aF0), T2.zf], [X(T2.aB0), T2.zf], [X(T2.aB), T2.zB]], '#ff4fd8', 6, 'STD_EXC', { d: 1 });
    const pp = G.pipe; if (pp) { const w = pp.w / 2; L([[X(pp.a0), pp.z0 + w], [X(pp.a1), pp.z1 + w]], '#3b82f6', 5, 'STD_PIPE', { d: 1 }); L([[X(pp.a0), pp.z0 - w], [X(pp.a1), pp.z1 - w]], '#3b82f6', 5, 'STD_PIPE', { d: 1 }); L([[X(pp.a0), pp.z0 - w], [X(pp.a0), pp.z0 + w]], '#3b82f6', 5, 'STD_PIPE'); }
    const dm = (x1, y1, x2, y2, txt, o = {}) => { L([[x1, y1], [x2, y2]], '#ffffff', 7, 'STD_DIM', { w: 0.7 }); const tk = 0.18; if (Math.abs(y1 - y2) < 1e-9) { L([[x1, y1 - tk], [x1, y1 + tk]], '#ffffff', 7, 'STD_DIM', { w: 0.7 }); L([[x2, y2 - tk], [x2, y2 + tk]], '#ffffff', 7, 'STD_DIM', { w: 0.7 }); T((x1 + x2) / 2, y1 + 0.15, TH * 0.85, txt, '#ffffff', 7, 'STD_DIM', { al: 'c', va: 'b' }); } else { L([[x1 - tk, y1], [x1 + tk, y1]], '#ffffff', 7, 'STD_DIM', { w: 0.7 }); L([[x2 - tk, y2], [x2 + tk, y2]], '#ffffff', 7, 'STD_DIM', { w: 0.7 }); T(x1 + (o.dx || 0.2) * (sg), (y1 + y2) / 2, TH * 0.85, txt, '#ffffff', 7, 'STD_DIM', { al: sg < 0 ? 'r' : 'l', va: 'm' }); } };
    if (TY.stdDetail) TY.stdDetail({ L, T, X, G, R, zc, sg });
    if (TY.stdDims) TY.stdDims({ dm, L, T, X, G, R, zc, sg });
  });
  dmX(L, T, -e, e, zc - Math.max(2.2, R.D + 1.4), `設計河寬 W=${rvF(2 * e)}（示意）`);
  const top = G.zTop + R.H * 0.35 + 3.5;
  T(0, top, TH * 1.4, `${rvName(rv)}　${TY.label}　標準斷面（示意：兩岸對稱）　S=1:100`, '#ffd08a', 30, 'STD_TITLE', { al: 'c', va: 'b' });
  const smry = TY.params.filter(x => x.u !== 'chk').slice(0, 9).map(x => `${x.nm.replace(/\s*\(.*?\)/g, '')} ${x.u === 'sel' ? p[x.k] : x.u === 'm' && typeof stdCmNum === 'function' && Number.isFinite(+p[x.k]) ? stdCmNum(+p[x.k]) : rvF(p[x.k], x.u === 'cm' || x.u === '層' || x.u === '籠' || x.u === '%' ? 0 : 2)}${x.u === 'cm' || (x.u === 'm' && typeof stdCmNum === 'function') ? 'cm' : ''}`).join('　');
  T(0, top - TH * 1.7, TH * 0.8, smry, '#e2e8f0', 7, 'STD_TEXT', { al: 'c', va: 'b' });
  T(0, top - TH * 3.1, TH * 0.75, `示意地形：前方＝設計河床，背後地面高 ${rvF(p.sgH === null || p.sgH === undefined ? 0.7 * p.H : p.sgH)} m、坡度 ${rvF(p.sgS || 0)}（僅供標準圖）`, '#94a3b8', 8, 'STD_TEXT', { al: 'c', va: 'b' });
  // 每公尺數量（標準圖示意地形）＋本段數量
  let y = zc - Math.max(4.5, R.D + 3.5), x = -aMaxD;
  T(x, y, TH * 1.3, `${rvName(rv)}　標準斷面每公尺數量（示意地形；開挖回填依地形計）`, '#ffd08a', 30, 'STD_TITLE', { va: 't' }); y -= TH * 2.0;
  TY.items.forEach(it => { const v = q[it.k] || 0; if (it.opt && v <= 1e-9) return; T(x, y, TH * 0.85, `${it.it}　${rvF(v, it.u === 'kg' ? 1 : 3)} ${it.u}/m`, '#e2e8f0', 7, 'STD_QTY', { va: 't' }); y -= TH * 1.35; });
  T(x, y, TH * 0.85, `開挖　${rvF(q.EX, 3)} m³/m　　回填　${rvF(q.BF, 3)} m³/m`, '#e2e8f0', 7, 'STD_QTY', { va: 't' }); y -= TH * 1.8;
  if (TY.checks) { T(x, y, TH * 0.95, '設計原則檢核', '#ff4fd8', 6, 'STD_QTY', { va: 't' }); y -= TH * 1.5; TY.checks(p).forEach(c => { T(x, y, TH * 0.75, `${c.ok ? '✔' : '⚠'} ${c.text}`, c.ok ? '#86efac' : '#fca5a5', c.ok ? 3 : 1, 'STD_QTY', { va: 't' }); y -= TH * 1.25; }); y -= TH * 0.6; }
  const qq = rv._q; T(x, y, TH * 1.3, `${rvName(rv)}　本段數量（${qq ? formatStation(qq.a) + '～' + formatStation(qq.b) : '—'}）`, '#ffd08a', 30, 'STD_TITLE', { va: 't' }); y -= TH * 2.2;
  if (qq) {
    T(x, y, TH * 0.85, `護岸實長 ${rvF(qq.lenB)} m（中心線長 ${rvF(qq.lenC)} m）`, '#e2e8f0', 7, 'STD_QTY', { va: 't' }); y -= TH * 1.5;
    qq.rows.forEach(r => { T(x, y, TH * 0.85, `${r.it}　${rvF(r.v, ['處', '支', '座'].includes(r.u) ? 0 : 2)} ${r.u}`, '#e2e8f0', 7, 'STD_QTY', { va: 't' }); y -= TH * 1.3; T(x + 0.6, y, TH * 0.65, r.fx, '#94a3b8', 8, 'STD_QTY', { va: 't' }); y -= TH * 1.5; });
    T(x, y, TH * 0.75, '開挖、回填：併入全線土方表', '#94a3b8', 8, 'STD_QTY', { va: 't' }); y -= TH * 1.4;
    y -= TH; T(x, y, TH * 0.95, `各斷面區間（平均斷面法；A＝${(TY.items.find(i => i.k === TY.prim) || {}).it || '主材'}）`, '#ff4fd8', 6, 'STD_QTY', { va: 't' }); y -= TH * 1.6;
    const cw = [7.2, 3.2, 3.2, 3.6, 3.6]; [['樁號區間', 'L實長', 'A1', 'A2', 'V']].concat(qq.segs.map(s2 => [`${formatStation(s2.a)}～${formatStation(s2.b)}`, rvF(s2.Lb), rvF(s2.A1), rvF(s2.A2), rvF(s2.v)])).forEach((r, i) => { let xx = x; r.forEach((c, k) => { T(xx + (k ? cw[k] - 0.2 : 0), y, TH * 0.75, c, i ? '#e2e8f0' : '#ffd08a', 7, 'STD_QTY', { al: k ? 'r' : 'l', va: 't' }); xx += cw[k]; }); y -= TH * 1.25; });
  }
  const bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }, ext = (a, b) => { bb.x0 = Math.min(bb.x0, a); bb.x1 = Math.max(bb.x1, a); bb.y0 = Math.min(bb.y0, b); bb.y1 = Math.max(bb.y1, b); };
  P.forEach(o => { if (o.t === 't') { ext(o.x, o.y); ext(o.x + (o.al === 'l' ? 1 : (o.al === 'r' ? -1 : 0.5)) * o.s.length * o.h * 0.9, o.y); } else o.p.forEach(v => ext(v[0], v[1])); });
  rvStdAddCap(rv, P, bb); return { P, bb };
}
/* v5.4 收頭封牆詳圖（正視＋剖面），單位 cm；回傳圖元（標準圖格式），左上角約在 (x0, yTop) */
function rvCapStdPrims(rv, x0, yTop) {
  const ws = rvWings(rv); if (!ws.length) return [];
  const w = ws[0], R = rvAt(rv, w.s, rvEDefAt(w.s)), C = rvCapGeo(R, rv.p); if (!C) return [];
  const cq = rvCapQ(C.A, rv.p), P = [], TH = 0.3, cm = v => rvF(v * 100, 0);
  const ox = x0 + 1.2 - C.aMin, oy = yTop - 2.2 - C.zT, M = q => [ox + q[0], oy + q[1]];
  const L = (pts, c, a, ly, o = {}) => P.push({ t: 'l', p: pts, c, a, ly, d: o.d || 0, w: o.w || 1, cl: !!o.cl });
  const T = (x, y, h, s2, c, a, ly, o = {}) => P.push({ t: 't', x, y, h, s: String(s2), c, a, ly, al: o.al || 'l', va: o.va || 'b', rot: o.rot || 0 });
  const tk = 0.12;
  const dH = (xa, xb, y, yRef, txt) => { L([[xa, y], [xb, y]], '#ffffff', 7, 'STD_DIM', { w: 0.7 }); [xa, xb].forEach(x => { L([[x, yRef + (y > yRef ? 0.12 : -0.12)], [x, y + (y > yRef ? 0.15 : -0.15)]], '#ffffff', 7, 'STD_DIM', { w: 0.5 }); L([[x - tk, y - tk], [x + tk, y + tk]], '#ffffff', 7, 'STD_DIM', { w: 0.7 }); }); T((xa + xb) / 2, y + 0.08, TH * 0.75, txt, '#ffffff', 7, 'STD_DIM', { al: 'c', va: 'b' }); };
  const dV = (ya, yb, x, xRef, txt) => { L([[x, ya], [x, yb]], '#ffffff', 7, 'STD_DIM', { w: 0.7 }); [ya, yb].forEach(y => { L([[xRef + (x > xRef ? 0.12 : -0.12), y], [x + (x > xRef ? 0.15 : -0.15), y]], '#ffffff', 7, 'STD_DIM', { w: 0.5 }); L([[x - tk, y - tk], [x + tk, y + tk]], '#ffffff', 7, 'STD_DIM', { w: 0.7 }); }); T(x - 0.08, (ya + yb) / 2, TH * 0.75, txt, '#ffffff', 7, 'STD_DIM', { al: 'c', va: 'b', rot: 90 }); };
  // 護岸斷面（細虛線示意）
  C.polys.forEach(pg => { const Mt = RV_MAT[pg.m] || RV_MAT.conc; L(pg.pts.map(M), Mt.c, Mt.a, 'STD_CAP_REF', { cl: true, w: 0.6, d: 1 }); });
  // 封牆外框
  L(C.pts.map(M), '#ffe600', 2, 'STD_CAP', { cl: true, w: 1.6 });
  // 鋼筋（單層雙向 @s，保護層 5 cm）
  const cv = 0.05, sp = cq.sp, Pg = C.pts;
  const cut = (k, v) => { const xs = []; for (let i = 0; i < Pg.length; i++) { const a = Pg[i], b = Pg[(i + 1) % Pg.length], pa = a[k], pb = b[k]; if ((pa - v) * (pb - v) < 0) xs.push(a[1 - k] + (v - pa) / (pb - pa) * (b[1 - k] - a[1 - k])); } return xs.sort((x, y) => x - y); };
  for (let z = C.zf + cv; z <= C.zT - cv + 1e-9; z += sp) { const xs = cut(1, z); for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > 2 * cv) L([M([xs[i] + cv, z]), M([xs[i + 1] - cv, z])], '#f472b6', 6, 'STD_CAP_RB', { w: 0.5 }); }
  for (let a = C.aMin + cv; a <= C.aMax - cv + 1e-9; a += sp) { const zs = cut(0, a); for (let i = 0; i + 1 < zs.length; i += 2) if (zs[i + 1] - zs[i] > 2 * cv) L([M([a, zs[i] + cv]), M([a, zs[i + 1] - cv])], '#f472b6', 6, 'STD_CAP_RB', { w: 0.5 }); }
  // 尺寸（cm）
  const aBB = Math.max(...C.pts.filter(q => Math.abs(q[1] - C.zf) < 1e-6).map(q => q[0])), aE = C.a0b + C.Lx, yT = oy + C.zT, yB = oy + C.zf;
  dH(ox + C.a0, ox + C.a0b, yT + 0.7, yT, cm(C.a0b - C.a0)); if (C.Lx > 1e-6) dH(ox + C.a0b, ox + aE, yT + 0.7, yT, cm(C.Lx));
  dH(ox + C.aMin, ox + aBB, yB - 0.7, yB, cm(aBB - C.aMin)); if (aE - aBB > 1e-6) dH(ox + aBB, ox + aE, yB - 0.7, yB, cm(aE - aBB));
  if (C.zf < -1e-6) dV(oy + C.zf, oy, ox + C.aMin - 0.8, ox + C.aMin, cm(-C.zf));
  dV(oy, yT, ox + C.aMin - 0.8, ox + C.aMin, cm(C.zT));
  dV(yT - C.he, yT, ox + aE + 0.7, ox + aE, cm(C.he));
  // 引出標示
  const lx = ox + aE + 1.6, mk = (px, py, ty, txt) => { L([[px, py], [lx, ty], [lx + 0.6, ty]], '#ffffff', 7, 'STD_TEXT', { w: 0.6 }); T(lx + 0.7, ty, TH * 0.7, txt, '#e2e8f0', 7, 'STD_TEXT', { va: 'm' }); };
  const zK = C.zT - C.he, zm = (C.zf + zK) / 2, am = aBB + (aE - aBB) * (zm - C.zf) / Math.max(1e-6, zK - C.zf);
  mk(ox + am, oy + zm, oy + zm - 0.5, `封牆，T=${cm(cq.T)}cm（混凝土）`);
  mk(ox + (C.a0b + aE) / 2, yT - C.he / 2, yT - C.he / 2 + 0.3, `D${cq.d}@${cm(sp)}（單層雙向）`);
  const cxF = ox + (C.aMin + aE) / 2;
  T(cxF, yB - 1.6, TH * 1.2, `${rvName(rv)}　護岸封牆詳圖（正視）`, '#ffd08a', 30, 'STD_TITLE', { al: 'c', va: 't' });
  T(cxF, yB - 1.6 - TH * 1.6, TH * 0.7, `單位：cm　依 ${formatStation(w.s)} 斷面；頂與護岸頂齊、延伸 ${cm(C.Lx)}、末端高 ${cm(C.he)}（＝H/3），斜邊回到基礎背側底角`, '#94a3b8', 8, 'STD_TEXT', { al: 'c', va: 't' });
  // 剖面詳圖：厚 T × 高（基礎底～頂），中線鋼筋點 @s
  const sx0 = lx + 8.5, Ht = C.zT - C.zf, Tt = cq.T;
  L([[sx0, yB], [sx0 + Tt, yB], [sx0 + Tt, yT], [sx0, yT]], '#ffe600', 2, 'STD_CAP', { cl: true, w: 1.6 });
  for (let z = cv; z <= Ht - cv + 1e-9; z += sp) { const cx = sx0 + Tt / 2, cy = yB + z, r = 0.03, c = []; for (let i = 0; i <= 12; i++) { const t = i / 12 * Math.PI * 2; c.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } L(c, '#f472b6', 6, 'STD_CAP_RB', { w: 0.6 }); }
  L([[sx0 + Tt / 2, yB + cv], [sx0 + Tt / 2, yT - cv]], '#f472b6', 6, 'STD_CAP_RB', { w: 0.5, d: 1 });
  dH(sx0, sx0 + Tt, yT + 0.7, yT, cm(Tt)); dV(yB, yT, sx0 - 0.8, sx0, cm(Ht));
  const l2 = sx0 + Tt + 0.9; [[yB + Ht * 0.62, `混凝土 厚 ${cm(Tt)}cm`], [yB + Ht * 0.35, `D${cq.d}@${cm(sp)}（單層雙向）`]].forEach(([y, t]) => { L([[sx0 + Tt, y], [l2, y + 0.4], [l2 + 0.6, y + 0.4]], '#ffffff', 7, 'STD_TEXT', { w: 0.6 }); T(l2 + 0.7, y + 0.4, TH * 0.7, t, '#e2e8f0', 7, 'STD_TEXT', { va: 'm' }); });
  T(sx0 + Tt / 2, yB - 1.6, TH * 1.2, '護岸封牆剖面詳圖', '#ffd08a', 30, 'STD_TITLE', { al: 'c', va: 't' }); T(sx0 + Tt / 2, yB - 1.6 - TH * 1.6, TH * 0.7, '單位：cm', '#94a3b8', 8, 'STD_TEXT', { al: 'c', va: 't' });
  T(ox + C.aMin, yB - 1.6 - TH * 3.6, TH * 0.75, `每座：正視面積 ${rvF(C.A)} m²　混凝土 ${rvF(cq.V)} m³　模板 ${rvF(cq.F)} m²　鋼筋 D${cq.d} ${rvF(cq.W, 1)} kg`, '#e2e8f0', 7, 'STD_QTY', { va: 't' });
  return P;
}
function rvStdAddCap(rv, P, bb) {   // 標準圖右側加封牆詳圖（有勾選封牆時）
  const Q = rvCapStdPrims(rv, bb.x1 + 3, bb.y1); if (!Q.length) return;
  Q.forEach(o => { P.push(o); if (o.t === 't') { bb.x1 = Math.max(bb.x1, o.x + o.s.length * o.h * 0.9); bb.y0 = Math.min(bb.y0, o.y - o.h); } else o.p.forEach(v => { bb.x1 = Math.max(bb.x1, v[0]); bb.y0 = Math.min(bb.y0, v[1]); bb.y1 = Math.max(bb.y1, v[1]); }); });
}
function dmX(L, T, x1, x2, y, txt) { L([[x1, y], [x2, y]], '#ffffff', 7, 'STD_DIM', { w: 0.7 }); [x1, x2].forEach(x => L([[x, y - 0.18], [x, y + 0.18]], '#ffffff', 7, 'STD_DIM', { w: 0.7 })); T((x1 + x2) / 2, y + 0.15, 0.26, txt, '#ffffff', 7, 'STD_DIM', { al: 'c', va: 'b' }); }
function rvStdOpen(i) {
  if (i !== undefined) state.rvSel = i; const rv = state.revs[state.rvSel]; if (!rv) { updateStatus('⚠ 請先選擇一段護岸。'); return; }
  const r = rvStdPrims(rv); stStdOpen(undefined, { P: r.P, bb: r.bb, name: rvName(rv), title: `${rvName(rv)}　護岸標準圖（典型斷面／數量）` });
}
function rvDxfStdAll(D, xRight, yTop) {
  let y = yTop; state.revs.forEach(rv => { if (!rv._q) return; const r = rvStdPrims(rv), b = r.bb; stStdEmit(D, r.P, xRight - b.x1, y - b.y1); y -= (b.y1 - b.y0) + 20; }); return y;
}

/* ---- 介面 ---- */
let RV_SIG = '';
const rvEsc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function rvNumIn(path, val, step, w, ph) { return `<input class="input-num" style="width:${w || 64}px" type="number" step="${step || 0.1}" data-rv="${path}" value="${val === null || val === undefined || !Number.isFinite(+val) ? '' : +(+val).toFixed(4)}" ${ph ? `placeholder="${ph}"` : ''} onchange="rvSet(this)">`; }
function rvSel(i) { state.rvSel = i; RV_SIG = ''; rvRenderUI(); const rv = state.revs[i]; if (rv) { const L = rvLim(rv), k = state.sections.findIndex(s => Math.abs(s.sta - L.a) < 0.03); if (k >= 0 && typeof selectStationIndex === 'function' && state.viewMode === 'CROSS') selectStationIndex(k); } requestRedraw(); }
function rvAddBoth() { rvAdd('L'); rvAdd('R'); updateStatus('🧱 已新增左、右岸各一段全線護岸。'); }
function rvCopyOpp() {
  const rv = state.revs[state.rvSel]; if (!rv) return; pushUndoSnapshot();
  const c = rvNorm(JSON.parse(JSON.stringify(Object.assign({}, rv, { id: null, side: rv.side === 'L' ? 'R' : 'L' })))); state.revs.push(c); state.rvSel = state.revs.length - 1; RV_SIG = ''; rebuildAlignmentAndSections();
  updateStatus(`已複製「${rvName(rv)}」到${c.side === 'L' ? '左' : '右'}岸（之後兩岸互不連動）。`);
}
function rvDel() { const rv = state.revs[state.rvSel]; if (!rv) return; pushUndoSnapshot(); const nm = rvName(rv); state.revs.splice(state.rvSel, 1); state.rvSel = state.revs.length ? Math.min(state.rvSel, state.revs.length - 1) : -1; RV_SIG = ''; rebuildAlignmentAndSections(); updateStatus(`🗑 已刪除「${nm}」。`); }
function rvSplit(here) {
  const rv = state.revs[state.rvSel]; if (!rv) { updateStatus('⚠ 請先選擇一段護岸。'); return; }
  const sec = state.sections[state.selectedStaIdx], el = document.getElementById('rvSplitSta');
  const s = here ? (sec ? +sec.sta.toFixed(3) : NaN) : rvParseSta(el ? el.value : '');
  const L = rvLim(rv); if (!Number.isFinite(s) || s <= L.a + 0.5 || s >= L.b - 0.5) { updateStatus(`⚠ 切開樁號須在 ${formatStation(L.a)}～${formatStation(L.b)} 之間（距兩端至少 0.5 m）。`); return; }
  pushUndoSnapshot(); const eDef = (state.sections[0] && state.sections[0].params ? state.sections[0].params.W / 2 : 7), eS = (rv.e0 === null && rv.e1 === null) ? null : +rvAt(rv, s, eDef).e.toFixed(3);
  const c = rvNorm(JSON.parse(JSON.stringify(Object.assign({}, rv, { id: null })))); c.s0 = s; c.e0 = eS; c.j0 = { m: 'taper', L: (rv.j0 && rv.j0.L) || 10 }; c.cap = { a: false, b: rv.cap ? rv.cap.b : false, c: rv.cap ? rv.cap.c : false };
  rv.s1 = s; rv.e1 = eS; if (rv.cap) rv.cap.b = false; state.revs.push(c); state.rvSel = state.revs.indexOf(rv); RV_SIG = ''; rebuildAlignmentAndSections();
  updateStatus(`✂ 已於 ${formatStation(s)} 將「${rvName(rv)}」切成兩段（參數沿用，可各自修改；接點預設順接，折角自動修圓，可在「銜接與收頭」改回直接換）。`);
}
function rvPickRaise(mode) {
  const rv = state.revs[state.rvSel]; if (!rv) { updateStatus('⚠ 請先選擇一段護岸。'); return; }
  state.rvMode = mode === 'widen' ? 'widen' : 'raise'; state.rvPend = null; setTool('ADD_REV'); updateStatus(`${mode === 'widen' ? '↔ 拉寬' : '⬆ 加高'}：在平面圖中心線上點「起」與「迄」樁號（對象：${rvName(rv)}）。`);
}
function rvAddWiden() { const rv = state.revs[state.rvSel]; if (!rv) return; const L = rvLim(rv), m = (L.a + L.b) / 2, q = Math.max(5, (L.b - L.a) / 6); pushUndoSnapshot(); rv.wids = rv.wids || []; rv.wids.push({ s0: +(m - q / 2).toFixed(2), s1: +(m + q / 2).toFixed(2), de: 1, t0: 10, t1: 10 }); RV_SIG = ''; rebuildAlignmentAndSections(); }
function rvDelTaper(kind, i) { const rv = state.revs[state.rvSel]; if (!rv) return; pushUndoSnapshot(); (kind === 'w' ? rv.wids : rv.raises).splice(i, 1); RV_SIG = ''; rebuildAlignmentAndSections(); }
function rvAddRaise() { const rv = state.revs[state.rvSel]; if (!rv) return; const L = rvLim(rv), m = (L.a + L.b) / 2, q = Math.max(5, (L.b - L.a) / 6); pushUndoSnapshot(); rv.raises.push(tcType(rv.type).layered ? { s0: +(m - q / 2).toFixed(2), s1: +(m + q / 2).toFixed(2), dh: 1, t0: 0, t1: 0 } : { s0: +(m - q / 2).toFixed(2), s1: +(m + q / 2).toFixed(2), dh: 0.5, t0: 10, t1: 10 }); RV_SIG = ''; rebuildAlignmentAndSections(); }
function rvDelRaise(i) { const rv = state.revs[state.rvSel]; if (!rv) return; pushUndoSnapshot(); rv.raises.splice(i, 1); RV_SIG = ''; rebuildAlignmentAndSections(); }
function rvEndHere(which) {   // 起/迄樁號＝目前橫斷面樁號
  const rv = state.revs[state.rvSel], sec = state.sections[state.selectedStaIdx]; if (!rv || !sec) { updateStatus('⚠ 請先選擇護岸與橫斷面。'); return; }
  rvSetEnd(rv, which, sec.sta);
}
function rvSetEnd(rv, which, sta) {   // 設定護岸起／迄樁號，並在平面圖閃示端點
  pushUndoSnapshot(); rv[which] = +(+sta).toFixed(3); let wh = which; if (rv.s0 !== null && rv.s1 !== null && rv.s0 > rv.s1) { const q = rv.s0; rv.s0 = rv.s1; rv.s1 = q; wh = which === 's0' ? 's1' : 's0'; }
  state.rvSel = state.revs.indexOf(rv); state.rvFlash = { wh, t: Date.now() }; RV_SIG = ''; rebuildAlignmentAndSections();
  clearTimeout(rvSetEnd._t); rvSetEnd._t = setTimeout(() => { state.rvFlash = null; requestRedraw(); }, 2600);
  updateStatus(`📌 「${rvName(rv)}」${wh === 's0' ? '起' : '迄'}點＝${formatStation(rv[wh])}${state.viewMode === '2D' ? '（平面圖已閃示該端點）' : '（切到平面圖可看到端點標示）'}。`);
}
function rvPickEnd(which) {   // 按下後在平面圖中心線上點選起／迄點
  const rv = state.revs[state.rvSel]; if (!rv) { updateStatus('⚠ 請先選擇一段護岸。'); return; }
  state.rvMode = 'end'; state.rvPickWh = which; state.rvPend = null;
  if (state.viewMode !== '2D' && typeof setViewMode === 'function') setViewMode('2D');
  setTool('ADD_REV'); updateStatus(`📌 請在平面圖中心線上點選「${rvName(rv)}」的${which === 's0' ? '起' : '迄'}點（Esc 或切換工具取消）。`);
}
function rvStaIn(path, val, ph, rvi, w, nb) {   // 樁號欄：◀ 前一個關鍵樁號、▾ 清單、▶ 下一個；仍可手打
  const di = rvi === undefined || rvi === null ? '' : ` data-rvi="${rvi}"`, ai = rvi === undefined || rvi === null ? 'null' : rvi;
  const inp = `<input class="input-num" style="width:${w || 84}px;${(w || 84) < 80 ? 'font-size:10.5px;padding:1px 2px;' : ''}" type="text" data-rv="${path}"${di} value="${val === null || val === undefined ? '' : formatStation(val)}" placeholder="${ph || ''}" title="可輸入里程 m（如 85.5）或 0K+085.5；不在斷面樁上時自動加樁" onclick="event.stopPropagation()" onchange="rvSet(this)">`;
  if (nb) return inp;
  return `<span class="rvsta"><button class="btn rvsb" onclick="event.stopPropagation();rvStaStep('${path}',${ai},-1)" title="前一個關鍵樁號">◀</button>${inp}<button class="btn rvsb" onclick="event.stopPropagation();rvStaMenu(this,'${path}',${ai})" title="從關鍵樁號清單選取">▾</button><button class="btn rvsb" onclick="event.stopPropagation();rvStaStep('${path}',${ai},1)" title="下一個關鍵樁號">▶</button></span>`;
}
function rvKeyList() {   // 關鍵樁號清單（起終點、BC/MC/EC、加樁、結構物截斷端、其他護岸端點）
  const al = state.alignment, m = new Map(), add = (s, n) => { if (!Number.isFinite(s)) return; const k = Math.round(s * 100) / 100, o = m.get(k); if (o) { if (n && !o.n.includes(n)) o.n.push(n); } else m.set(k, { s: k, n: n ? [n] : [] }); };
  if (al.segments && al.segments.length) { add(al.startSta, '起點'); add(al.endSta, '終點'); }
  state.sections.forEach(sc => { if (sc.ptName) add(sc.sta, sc.ptName); });
  (state.customStations || []).forEach(c => add(c.s, c.name || '加樁'));
  rvZones().forEach(z => { if (!TC_CATS.some(c => tcPrioOn(z.kind, c.id))) { const st = state.structs.find(t => t.id === z.sid); if (st) add(st.sta, z.name); return; } add(z.a, z.name + ' 截斷起'); add(z.b, z.name + (z.walls && Math.abs(z.b - z.endS) < 1e-6 ? ' 側牆末端' : ' 截斷迄')); });
  state.revs.forEach(r => { if (r.s0 !== null) add(r.s0, rvShort(r) + '起'); if (r.s1 !== null) add(r.s1, rvShort(r) + '迄'); });
  state.revs.forEach(r => { (r.raises || []).forEach(x => { add(x.s0, rvShort(r) + '加高起'); add(x.s1, rvShort(r) + '加高迄'); }); (r.wids || []).forEach(x => { add(x.s0, rvShort(r) + '拉寬起'); add(x.s1, rvShort(r) + '拉寬迄'); }); });
  (state.profile && state.profile.drops || []).forEach(d => add(d.sta, d.name || '落差'));
  return [...m.values()].sort((a, b) => a.s - b.s);
}
function rvStaInput(path, rvi) { return document.querySelector(rvi === null || rvi === undefined ? `#rvBox input[data-rv="${path}"]:not([data-rvi])` : `#rvBox input[data-rv="${path}"][data-rvi="${rvi}"]`); }
function rvStaStep(path, rvi, dir) {
  const el = rvStaInput(path, rvi); if (!el) return; const rv = state.revs[rvi === null || rvi === undefined ? state.rvSel : rvi]; if (!rv) return; const L = rvLim(rv);
  let v = rvParseSta(el.value); if (!Number.isFinite(v)) v = path.endsWith('s1') ? L.b : L.a;
  const ks = rvKeyList().map(k => k.s), nx = dir > 0 ? ks.find(s => s > v + 0.01) : ks.slice().reverse().find(s => s < v - 0.01);
  if (nx === undefined) { updateStatus('已到清單盡頭。'); return; } el.value = formatStation(nx); rvSet(el);
}
function rvStaMenu(btn, path, rvi) {
  document.querySelectorAll('.rvmenu').forEach(x => x.remove());
  const r = btn.getBoundingClientRect(), d = document.createElement('div'); d.className = 'rvmenu';
  d.style.left = Math.max(4, Math.min(window.innerWidth - 300, r.left - 160)) + 'px'; d.style.top = Math.min(window.innerHeight - 280, r.bottom + 2) + 'px';
  d.innerHTML = `<div class="rvmi rvmadd" data-a="add">＋ 平面加樁（到平面圖中心線點擊）</div>` + rvKeyList().map(k => `<div class="rvmi" data-s="${k.s}"><b>${formatStation(k.s)}</b>　${rvEsc(k.n.join('、'))}</div>`).join('');
  d.addEventListener('click', ev => { const it = ev.target.closest('.rvmi'); if (!it) return; d.remove(); if (it.dataset.a === 'add') { rvAddSta(); return; } const el = rvStaInput(path, rvi); if (!el) return; el.value = formatStation(+it.dataset.s); rvSet(el); });
  document.body.appendChild(d); setTimeout(() => document.addEventListener('mousedown', function f(ev) { if (!d.contains(ev.target)) { d.remove(); document.removeEventListener('mousedown', f); } }), 0);
}
function rvAddSta() { if (state.viewMode !== '2D') setViewMode('2D'); setTool('ADD_STA'); updateStatus('📍 在平面圖中心線上點擊加樁；完成後回到護岸卡片，從樁號清單（▾）選取。'); }
function rvParamIn(q, p) {   // 依型式參數表產生輸入欄
  if (q.u === 'chk') return `<span title="${rvEsc(q.tip || '')}">${q.nm}</span><input type="checkbox" ${p[q.k] ? 'checked' : ''} data-rv="p.${q.k}" onchange="this.value=this.checked?1:0;rvSet(this)"><span></span>`;
  if (q.u === 'sel') return `<span title="${rvEsc(q.tip || '')}">${q.nm}</span><select class="input-select" style="width:84px;" data-rv="p.${q.k}" onchange="rvSet(this)">${q.opt.map(o => `<option value="${o}"${o === p[q.k] ? ' selected' : ''}>${typeof TCO_SEL_LAB !== 'undefined' && TCO_SEL_LAB[o] ? TCO_SEL_LAB[o] : o}</option>`).join('')}</select><span></span>`;
  return `<span title="${rvEsc(q.tip || '')}">${q.nm}</span>${rvNumIn('p.' + q.k, p[q.k], q.st, 84)}<span class="rvu">${q.u && q.u !== 'm' ? q.u : (q.u === 'm' ? 'm' : '')}</span>`;
}
function rvSetType(rv, id) {   // 切換型式：保存舊型式參數；共用鍵（H、n、D、開挖、背填、縫距…）沿用
  if (!TC_TYPES[id] || rv.type === id) return; const T = tcType(id);
  rv.pt = rv.pt || {}; rv.pt[rv.type] = JSON.parse(JSON.stringify(rv.p));
  const np = rv.pt[id] ? JSON.parse(JSON.stringify(rv.pt[id])) : tcDefaults(id, rv.p.H);
  TC_SHARED.forEach(k => { if ((k in TC_COMMON_DEF) || T.params.some(q => q.k === k)) { if (rv.p[k] !== undefined && !(rv.pt[id] && k !== 'H')) np[k] = rv.p[k]; } });
  rv.p = np; rv.type = id; state.rvLastType = id;
}
function rvSet(el) {
  if (el.dataset.rvi !== undefined) state.rvSel = +el.dataset.rvi;
  const rv = state.revs[state.rvSel]; if (!rv) return; const path = el.dataset.rv, t = String(el.value).trim(), ks = path.split('.');
  pushUndoSnapshot();
  const pick = () => {
    if (ks[0] === 'p') {
      const k = ks[1], q = tcType(rv.type).params.find(x => x.k === k);
      if (q && q.u === 'sel') { rv.p[k] = t; const TT = tcType(rv.type); if (TT.sync) TT.sync(rv.p); return true; }
      if (k === 'sgH' && t === '') { rv.p.sgH = null; return true; }
      const v = parseFloat(t); if (!Number.isFinite(v)) return false;
      rv.p[k] = (q && q.u === 'chk') || k === 'pon' ? (v ? 1 : 0) : (['sdz', 'sgH', 'sgS'].includes(k) ? v : Math.max(k === 'ec' ? 0.01 : 0, v));
      if (k === 'N_layer') rv.p.N_layer = Math.max(1, Math.min(6, Math.round(rv.p.N_layer)));
      const TT = tcType(rv.type); if (TT.sync) TT.sync(rv.p); return true;
    }
    if (ks[0] === 'r' || ks[0] === 'w') { const r = (ks[0] === 'r' ? rv.raises : rv.wids)[+ks[1]]; if (!r) return false; const k = ks[2]; if (k === 's0' || k === 's1') { const v = rvParseSta(t); if (!Number.isFinite(v)) return false; r[k] = v; } else { const v = parseFloat(t); if (!Number.isFinite(v)) return false; r[k] = (k === 'dh' || k === 'de') ? v : Math.max(0, v); } return true; }
    if (ks[0] === 'cap') { rv.cap = rv.cap || { a: false, b: false, c: false }; rv.cap[ks[1]] = !!parseFloat(t); return true; }
    if (ks[0] === 'j0') { rv.j0 = rv.j0 || { m: 'direct', L: 10 }; if (ks[1] === 'm') rv.j0.m = t === 'taper' ? 'taper' : 'direct'; else { const v = parseFloat(t); if (!(v > 0)) return false; rv.j0.L = v; } return true; }
    if (path === 'type') { rvSetType(rv, t); return true; }
    if (path === 'ign') { rv.ign = !!parseFloat(t); return true; }
    if (path === 's0' || path === 's1') { const v = rvParseSta(t); if (Number.isNaN(v)) return false; rv[path] = v; if (rv.s0 !== null && rv.s1 !== null && rv.s0 > rv.s1) { const q = rv.s0; rv.s0 = rv.s1; rv.s1 = q; } return true; }
    if (path === 'e0' || path === 'e1') { rv[path] = t === '' ? null : (Number.isFinite(parseFloat(t)) ? Math.max(0.05, parseFloat(t)) : rv[path]); return true; }
    if (path === 'side') { rv.side = t === 'R' ? 'R' : 'L'; return true; }
    return false;
  };
  if (!pick()) { updateStatus('⚠ 輸入值不合理，已還原。'); RV_SIG = ''; rvRenderUI(); return; }
  RV_SIG = ''; setTimeout(rebuildAlignmentAndSections, 0);
}
function rvDefaults(side, type) {
  type = type || state.rvLastType || 'grav'; const g = id => parseFloat((document.getElementById(id) || {}).value);
  return tcDefaults(type, type === 'grav' ? (g('pfBankH') > 0 ? g('pfBankH') : 3) : undefined);
}
function rvAdd(side, s0, s1, type, extra) {
  pushUndoSnapshot(); type = type || state.rvLastType || 'grav';
  let gapTxt = ''; if (s0 === undefined && s1 === undefined) { const gp = rvGap(side); if (gp) { s0 = gp.a; s1 = gp.b; gapTxt = `（放在該岸第一段空檔 ${formatStation(gp.a)}～${formatStation(gp.b)}）`; } else if (state.revs.some(r => r.side === side)) gapTxt = '（該岸已無空檔，暫設全線，請修改起迄以免重疊）'; }
  const rv = rvNorm(Object.assign({ side, type, s0: s0 ?? null, s1: s1 ?? null, p: rvDefaults(side, type) }, extra || {})); state.revs.push(rv); state.rvSel = state.revs.length - 1; RV_SIG = ''; state.rvLastType = type;
  updateStatus(`🧱 已新增「${rvName(rv)}」${tcType(type).label}${rv.s0 === null && rv.s1 === null ? '（全線；可於卡片改起迄樁號）' : gapTxt}；參數取型式預設，可逐項修改。`);
  rebuildAlignmentAndSections();
}
function rvTemplate() {
  const rv = state.revs[state.rvSel]; if (!rv) return; const T = tcType(rv.type), fs = T.params.filter(q => typeof q.def === 'function'); if (!fs.length) return;
  pushUndoSnapshot(); fs.forEach(q => { rv.p[q.k] = q.def(rv.p.H); }); RV_SIG = ''; rebuildAlignmentAndSections();
  updateStatus(`已依 H 套用「${T.label}」預設比例：${fs.map(q => q.nm.replace(/\s*\(.*?\)/g, '')).join('、')}。`);
}
const RV_OPEN = { a: true, b: true };
const RV_NUM = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫';
function rvOverlaps(rv) {
  const L = rvLim(rv); return state.revs.filter(o => o !== rv && o.side === rv.side).filter(o => { const M = rvLim(o); return Math.min(L.b, M.b) - Math.max(L.a, M.a) > 0.05; });
}
function rvGap(side) {   // 該岸尚無護岸的第一段空檔（≥1 m）；全無護岸＝null（整條中心線）
  const al = state.alignment, iv = state.revs.filter(r => r.side === side).map(r => rvLim(r)).sort((a, b) => a.a - b.a); if (!iv.length) return null;
  let cur = al.startSta; for (const q of iv) { if (q.a - cur >= 1) return { a: +cur.toFixed(2), b: +q.a.toFixed(2) }; cur = Math.max(cur, q.b); }
  return al.endSta - cur >= 1 ? { a: +cur.toFixed(2), b: +al.endSta.toFixed(2) } : null;
}
function rvTypeSelect(cur, attrs) {
  return `<select class="input-select" ${attrs}>${TC_CATS.map(c => `<optgroup label="${c.label}">${TC_ORDER.filter(id => TC_TYPES[id].cat === c.id).map(id => `<option value="${id}"${id === cur ? ' selected' : ''}>${TC_TYPES[id].label}</option>`).join('')}${TC_PEND.filter(q => q.cat === c.id).map(q => `<option disabled>${q.label}（待移植）</option>`).join('')}</optgroup>`).join('')}</select>`;
}
function rvRenderUI() {
  const box = document.getElementById('rvBox'); if (!box) return;
  const bd = document.getElementById('rvBadge'); if (bd) bd.textContent = state.revs.length + ' 段';
  const act = document.activeElement; if (act && box.contains(act) && (act.tagName === 'INPUT' || act.tagName === 'SELECT') && act.dataset.rv && RV_SIG) return;
  const T2 = ['L', 'R'].map(sd => rvTotals(sd)), TT = rvTotals();
  const sig = JSON.stringify([state.revs.map(r => [r.id, r.side, r.type, r.s0, r.s1, r.e0, r.e1, r.p, r.raises, r.wids, r.ign, r.cap, r.j0, rvPiecesInfo(r).map(x => [x.a, x.b]), r._q ? [r._q.V, r._q.lenB, r._q.EX] : 0, r._warn]), state.rvSel, state.alignment.startSta, state.alignment.endSta, state.rvCatShow, state.tcPrio]);
  if (sig === RV_SIG) return; RV_SIG = sig;
  const rvIn = (i, path, val, w) => `<input class="input-num" style="width:${w}px;padding:1px 3px;font-size:10.5px;" type="text" data-rvi="${i}" data-rv="${path}" value="${val === null || val === undefined || !Number.isFinite(+val) ? '' : +(+val).toFixed(3)}" onclick="event.stopPropagation()" onchange="rvSet(this)">`;
  const bankRows = sd => {
    const idx = state.revs.map((r, i) => i).filter(i => state.revs[i].side === sd).sort((a, b) => rvLim(state.revs[a]).a - rvLim(state.revs[b]).a);
    if (!idx.length) return '';
    const col = sd === 'L' ? '#0891b2' : '#db2777';
    return `<div style="font-weight:700;color:${col};background:rgba(100,116,139,.12);padding:2px 6px;font-size:11px;">${sd === 'L' ? '左岸' : '右岸'}（${idx.length} 段）</div>` + idx.map(i => {
      const rv = state.revs[i], q = rv._q, L = rvLim(rv), pcs = rvPiecesInfo(rv), cut = pcs.length !== 1 || pcs[0].ja || pcs[0].jb, ov = rvOverlaps(rv), sel = i === state.rvSel, T = tcType(rv.type);
      const rz = rv.raises.map(r => `加高 ${formatStation(Math.min(r.s0, r.s1))}～${formatStation(Math.max(r.s0, r.s1))} +${rvF(r.dh)}（漸變 ${rvF(r.t0, 0)}/${rvF(r.t1, 0)}）`).concat((rv.wids || []).map(r => `拉寬 ${formatStation(Math.min(r.s0, r.s1))}～${formatStation(Math.max(r.s0, r.s1))} ${r.de >= 0 ? '+' : ''}${rvF(r.de)}（漸變 ${rvF(r.t0, 0)}/${rvF(r.t1, 0)}）`)).join('；');
      let h = `<div onclick="rvSel(${i})" style="cursor:pointer;padding:3px 6px 3px ${sel ? 3 : 6}px;border-top:1px solid var(--border-dim);${sel ? 'background:rgba(34,211,238,.16);border-left:4px solid #22d3ee;' : ''}${rvVis(rv) ? '' : 'opacity:.5;'}">
        <div style="display:flex;gap:3px;align-items:center;"><b style="color:${col};font-size:10.5px;width:38px;white-space:nowrap;">${rvShort(rv)}</b>${rvStaIn('s0', rv.s0 ?? L.a, '', i, 68)}<span>～</span>${rvStaIn('s1', rv.s1 ?? L.b, '', i, 68)}</div>
        <div style="display:flex;gap:4px;align-items:center;margin-top:2px;font-size:10.5px;"><span style="width:38px;color:var(--text-muted);font-size:9.5px;line-height:1.1;">${T.label.replace('護岸', '').replace('混凝土', '')}</span><span>H</span>${rvIn(i, 'p.H', rv.p.H, 40)}<span>e</span>${rvIn(i, 'e0', rv.e0, 40)}<span>→</span>${rvIn(i, 'e1', rv.e1, 40)}<span style="color:var(--text-muted);margin-left:4px;">${q ? `${rvF(q.lenB, 1)} m` : '—'}</span></div>`;
      if (rz) h += `<div style="font-size:10px;color:#b45309;margin-top:2px;">${rz}</div>`;
      if (cut) h += `<div style="font-size:10px;color:#7c3aed;margin-top:2px;">${pcs.length ? '保留 ' + pcs.map(x => `${formatStation(x.a)}～${formatStation(x.b)}`).join('、') : '全段被結構物截斷'}${rv.ign ? '（已忽略截斷）' : '（被壩體／側牆自動截斷）'}</div>`;
      if (ov.length) h += `<div style="font-size:10px;color:#dc2626;font-weight:700;margin-top:2px;">⚠ 與 ${ov.map(rvShort).join('、')} 範圍重疊（重疊處以起點較後者為準）</div>`;
      return h + '</div>';
    }).join('');
  };
  const rows = bankRows('L') + bankRows('R');
  let h = `<div class="clbtns" style="grid-template-columns:1fr 1fr;"><button class="btn primary" onclick="catOpen('add')" title="開啟結構物名冊（依功能分類、附縮圖、可搜尋比較），選型式後依導引逐步填參數">＋ 名冊選型新增</button><button class="btn" onclick="state.rvMode='rev';setTool('ADD_REV')" title="平面圖：在中心線上依序點起點、迄點；第一點落在中心線哪一側，就放在哪一岸（型式沿用上次）">圖面點選起迄</button><button class="btn" onclick="rvAdd('L')" title="快速新增左岸一段（型式沿用上次，放在第一段空檔）">＋ 左岸</button><button class="btn" onclick="rvAdd('R')" title="快速新增右岸一段">＋ 右岸</button></div>
    <div style="font-size:11px;margin-top:4px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;"><span style="color:var(--text-muted);">顯示：</span>${TC_CATS.map(c => `<label><input type="checkbox" ${(state.rvCatShow || {})[c.id] !== false ? 'checked' : ''} onchange="state.rvCatShow['${c.id}']=this.checked;RV_SIG='';rvRenderUI();requestRedraw()"> ${c.label}</label>`).join('')}</div>
    <details class="rvacc" ${RV_OPEN.prio ? 'open' : ''} ontoggle="RV_OPEN.prio=this.open"><summary>截斷規則<span class="sm">結構物 × 類別：勾選＝該結構物範圍內不放</span></summary><div class="rvab"><table class="pt-table"><thead><tr><th>結構物</th>${TC_CATS.map(c => `<th>${c.label}</th>`).join('')}</tr></thead><tbody>${TC_ZKINDS.map(([k, nm]) => `<tr><td>${nm}（壩體＋側牆）</td>${TC_CATS.map(c => `<td style="text-align:center;"><input type="checkbox" ${tcPrioOn(k, c.id) ? 'checked' : ''} onchange="tcSetPrio('${k}','${c.id}',this.checked)"></td>`).join('')}</tr>`).join('')}</tbody></table><div style="font-size:10px;color:var(--text-muted);">個別護岸仍可在「銜接與收頭」勾選忽略自動截斷。</div></div></details>
    <div style="font-size:10.5px;color:var(--text-muted);line-height:1.5;margin-top:3px;">圖上：滑鼠移到護岸會預覽、點選＝選取；選取後兩端白色小方塊可沿中心線拖曳改起迄（吸附 0.5 m 與關鍵樁號，Shift 不吸附）。</div>
    <div style="margin-top:6px;border:1px solid var(--border-dim);border-radius:4px;max-height:320px;overflow-y:auto;">${rows || '<div style="padding:8px;text-align:center;color:var(--text-muted);font-size:11px;">尚無護岸（無護岸路段設計線＝地形線）</div>'}</div>
    <div style="font-size:10px;color:var(--text-muted);">樁號欄：◀ ▶ 跳前／後一個關鍵樁號，▾ 開清單（可加樁）；e 空白＝設計河寬 W/2。</div>`;
  const rv = state.revs[state.rvSel];
  let ni = 0; const acc = (k, title, sm, body, def) => { if (RV_OPEN[k] === undefined) RV_OPEN[k] = false;   /* v6.3：預設收合 */ return `<details class="rvacc" ${RV_OPEN[k] ? 'open' : ''} ontoggle="RV_OPEN['${k}']=this.open"><summary>${RV_NUM[ni++] || ''} ${title}<span class="sm">${sm}</span></summary><div class="rvab">${body}</div></details>`; };
  if (rv) {
    const L = rvLim(rv), q = rv._q, p = rv.p, pcs = rvPiecesInfo(rv), col = rv.side === 'L' ? '#0891b2' : '#db2777', T = tcType(rv.type), pv = rvPrev(rv);
    const trow = (arr, kind, key, nm) => arr.map((r, i) => `<div style="border:1px solid #cbd5e1;border-radius:5px;padding:3px 5px;margin-top:3px;font-size:11px;display:grid;grid-template-columns:auto auto 1fr;gap:2px 5px;align-items:center;white-space:nowrap;">
        <b>${i + 1}</b><span>起</span><span style="display:flex;align-items:center;">${rvStaIn(`${kind}.${i}.s0`, r.s0, '', null, 74)}<button class="btn" style="padding:0 7px;margin-left:auto;color:#dc2626;" onclick="rvDelTaper('${kind}',${i})" title="刪除這一列">✕</button></span>
        <span></span><span>迄</span><span>${rvStaIn(`${kind}.${i}.s1`, r.s1, '', null, 74)}</span>
        <span></span><span>${nm}</span><span style="display:flex;gap:3px;align-items:center;">${kind === 'r' && T.layered ? `${rvNumIn(`${kind}.${i}.${key}`, r[key], 1, 50)}<span>層（整數；區段兩端直接換層數，不漸變）</span>` : `${rvNumIn(`${kind}.${i}.${key}`, r[key], 0.1, 60)}<span>前漸變</span>${rvNumIn(`${kind}.${i}.t0`, r.t0, 1, 54)}<span>後</span>${rvNumIn(`${kind}.${i}.t1`, r.t1, 1, 54)}<span>m</span>`}</span></div>`).join('');
    const grp = gk => `<div class="rvg">${T.params.filter(x => x.g === gk).map(x => rvParamIn(x, p)).join('')}</div>`;
    const comm = gk => `<div class="rvg">${TC_COMMON.filter(x => x[4] === gk).map(([k, nm, st, tip]) => `<span title="${rvEsc(tip)}">${nm}</span>${rvNumIn('p.' + k, p[k], st, 84, k === 'sgH' ? rvF(0.7 * p.H) : '')}<span></span>`).join('')}</div>`;
    const ck = T.checks ? T.checks(p) : [];
    h += `<div style="margin-top:8px;padding:6px;border:2px solid #22d3ee;border-radius:4px;">
      <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;"><b style="color:${col};">${rvName(rv)}</b>
        <select class="input-select" style="width:64px;" data-rv="side" onchange="rvSet(this)"><option value="L"${rv.side === 'L' ? ' selected' : ''}>左岸</option><option value="R"${rv.side === 'R' ? ' selected' : ''}>右岸</option></select>
        ${rvTypeSelect(rv.type, 'style="max-width:210px;" data-rv="type" onchange="rvSet(this)" title="切換型式：原型式參數會保留，切回時還原；H、n、D、開挖、背填等共用值沿用"')}</div>
      <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;">${typeof dzNoCode === 'function' ? dzNoCode(T.note) : (T.note || '')}</div>
      ${acc('a', '起迄與距離', `${formatStation(L.a)}～${formatStation(L.b)}　e ${rv.e0 === null && rv.e1 === null ? 'W/2' : rvF(rv.e0 ?? rv.e1) + '→' + rvF(rv.e1 ?? rv.e0)}`, `<div class="rvg2">
        <span style="white-space:nowrap;">起樁號</span>${rvStaIn('s0', rv.s0, '全線起 ' + formatStation(L.a), null, 74)}<span style="display:inline-flex;gap:2px;"><button class="btn" style="padding:1px 4px;font-size:10.5px;" onclick="rvEndHere('s0')" title="起點＝目前橫斷面樁號">取斷面</button><button class="btn" style="padding:1px 4px;font-size:10.5px;" onclick="rvPickEnd('s0')" title="按下後在平面圖中心線上點選起點樁號">圖上點</button></span>
        <span style="white-space:nowrap;">迄樁號</span>${rvStaIn('s1', rv.s1, '全線迄 ' + formatStation(L.b), null, 74)}<span style="display:inline-flex;gap:2px;"><button class="btn" style="padding:1px 4px;font-size:10.5px;" onclick="rvEndHere('s1')" title="迄點＝目前橫斷面樁號">取斷面</button><button class="btn" style="padding:1px 4px;font-size:10.5px;" onclick="rvPickEnd('s1')" title="按下後在平面圖中心線上點選迄點樁號">圖上點</button></span></div>
        <div class="rvg"><span title="水側面底（設計河床邊緣）距中心線的距離；起迄不同時線性漸變；空白＝設計河寬 W/2">距中心線 e 起</span>${rvNumIn('e0', rv.e0, 0.1, 84, '自動 W/2')}<span></span>
        <span>距中心線 e 迄</span>${rvNumIn('e1', rv.e1, 0.1, 84, '自動 W/2')}<span></span></div>
        <div style="font-size:11px;font-weight:700;color:#0369a1;margin-top:6px;">控制點（e 不受河寬限制；點與點之間自然曲線連接） <button class="btn" style="padding:0 6px;" onclick="rvCpAdd()" title="在目前橫斷面樁號加控制點，之後可在平面圖拖曳">＋ 於目前樁號加點</button></div>
        ${(rv.cps || []).length ? `<table class="pt-table" style="font-size:11px;margin-top:2px;"><thead><tr><th>#</th><th>樁號 (m)</th><th>e (m)</th><th></th></tr></thead><tbody>${rv.cps.map((c, k) => `<tr><td>${k + 1}</td><td><input class="input-num" style="width:72px" type="number" step="0.5" value="${c.s}" onchange="rvCpSet(${k},'s',this.value)"></td><td><input class="input-num" style="width:60px" type="number" step="0.1" value="${c.e}" onchange="rvCpSet(${k},'e',this.value)"></td><td><button class="btn" style="padding:0 5px;" onclick="rvCpDel(${k})">✕</button></td></tr>`).join('')}</tbody></table>` : '<div style="font-size:10.5px;color:var(--text-muted);">無控制點：起迄之間直線漸變。加點後在平面圖拖曳青色圓點即可移動。</div>'}
        <div style="font-size:11px;margin-top:6px;"><button class="btn" style="padding:0 6px;" onclick="rvAddSta()" title="到平面圖中心線點擊加樁，之後可從清單選取">＋ 平面加樁</button>　分段 <input class="input-num" id="rvSplitSta" style="width:84px;" type="text" placeholder="切開樁號" title="可輸入里程 m（如 85.5）或 0K+085.5"> <button class="btn" style="padding:0 6px;" onclick="rvSplit()">在此切開</button> <button class="btn" style="padding:0 6px;" onclick="rvSplit(true)" title="於目前橫斷面樁號切開">在目前斷面切開</button></div>`, true)}
      ${acc('b', '加高、拉寬區段', `加高 ${rv.raises.length} 處　拉寬 ${(rv.wids || []).length} 處`, `<div style="font-size:11px;font-weight:700;color:#0369a1;">加高（兩端各自漸變回原高度） <button class="btn" style="padding:0 6px;" onclick="rvAddRaise()">＋ 加高</button> <button class="btn" style="padding:0 6px;" onclick="rvPickRaise('raise')" title="平面圖中心線上點起、迄樁號">圖上點選</button></div>${trow(rv.raises, 'r', 'dh', T.layered ? '加層' : 'Δh')}
        <div style="font-size:11px;font-weight:700;color:#0369a1;margin-top:8px;">拉寬（Δe 向外為正；兩端漸變回原 e） <button class="btn" style="padding:0 6px;" onclick="rvAddWiden()">＋ 拉寬</button> <button class="btn" style="padding:0 6px;" onclick="rvPickRaise('widen')" title="平面圖中心線上點起、迄樁號">圖上點選</button></div>${trow(rv.wids || [], 'w', 'de', 'Δe')}`, true)}
      ${T.groups.map((g, gi) => acc('g_' + rv.type + '_' + g.k, g.t, T.params.filter(x => x.g === g.k && x.u !== 'chk').slice(0, 4).map(x => `${x.k}=${x.u === 'sel' ? p[x.k] : rvF(p[x.k], x.u === 'cm' || x.u === '層' || x.u === '籠' || x.u === '%' ? 0 : 2)}`).join(' '), (gi === 0 && T.params.some(x => typeof x.def === 'function') ? `<button class="btn" style="padding:0 6px;margin-bottom:4px;" onclick="rvTemplate()" title="依 H 重算有比例關係的參數">依 H 套用預設比例</button>` : '') + grp(g.k))).join('')}
      ${acc('exc', '開挖與背填', `開挖 1:${rvF(p.ec)}　背填坡 ${rvF(p.g * 100, 1)}%`, comm('exc'))}
      ${acc('join', '銜接與收頭', (rv.ign ? '已忽略自動截斷' : (pcs.length === 1 && !pcs[0].ja && !pcs[0].jb ? '未被截斷' : `保留 ${pcs.length} 段`)) + `　接點 ${rv.j0 && rv.j0.m === 'taper' ? '順接' : '直接換'}` + (rv.cap && (rv.cap.a || rv.cap.b || rv.cap.c) ? '　含封牆' : ''), `
        <div style="font-size:11px;"><b>與前一段接點</b>（${pv ? rvShort(pv) + '→' + rvShort(rv) + ' @ ' + formatStation(L.a) : '本段起點前無相鄰段'}）：<select class="input-select" style="width:150px;" data-rv="j0.m" onchange="rvSet(this)"><option value="direct"${rv.j0.m !== 'taper' ? ' selected' : ''}>直接換（連接線＋伸縮縫）</option><option value="taper"${rv.j0.m === 'taper' ? ' selected' : ''}>順接（e、H 平滑漸變，折角修圓）</option></select> 長 ${rvNumIn('j0.L', rv.j0.L, 1, 52)} m</div>
        <div style="font-size:10.5px;color:var(--text-muted);line-height:1.5;margin-top:4px;">壩體上游邊（溢洪口位置）～下游面（有側牆則至側牆末端）依截斷規則不放護岸，護岸收在壩面或側牆端，接頭計伸縮縫。</div>
        <div class="rvg" style="margin-top:3px;">${comm('join').replace(/^<div class="rvg">|<\/div>$/g, '')}<span title="勾選＝不自動截斷，護岸照設定起迄通過結構物">忽略自動截斷</span><input type="checkbox" ${rv.ign ? 'checked' : ''} data-rv="ign" onchange="this.value=this.checked?1:0;rvSet(this)"><span></span>
          <span title="接側牆時，e 由側牆內面平滑順接；實際長度至少為 e 變化量的 3 倍">銜接側牆順接長度 (m)</span>${rvNumIn('p.lt', p.lt, 1, 84)}<span></span>
          <span title="收頭封牆：封住護岸斷面後，由護岸背側頂緣以梯形往岸側延伸的長度（頂與護岸頂齊，末端高＝H/3，斜邊回到基礎背側底角）">封牆延伸長 (m)</span>${rvNumIn('p.cw', p.cw, 0.1, 84)}<span></span>
          <span title="封牆厚 T">封牆厚 T (cm)</span><input class="input-num" style="width:84px" type="number" step="5" data-rv="p.ct" value="${rvF((+p.ct || 0.3) * 100, 0)}" onchange="this.value=String(parseFloat(this.value)/100);rvSet(this)"><span></span>
          <span title="單層雙向配筋">封牆鋼筋</span><span style="white-space:nowrap;"><select class="input-select" style="width:58px;" data-rv="p.crb" onchange="rvSet(this)">${RV_RB.map(d => `<option value="${d}"${+p.crb === d ? ' selected' : ''}>D${d}</option>`).join('')}</select> @<input class="input-num" style="width:44px" type="number" step="5" data-rv="p.crs" value="${rvF((+p.crs || 0.3) * 100, 0)}" onchange="this.value=String(parseFloat(this.value)/100);rvSet(this)">cm</span><span></span></div>
        <div style="font-size:11px;margin-top:3px;">加收頭封牆：<label><input type="checkbox" ${rv.cap && rv.cap.a ? 'checked' : ''} data-rv="cap.a" onchange="this.value=this.checked?1:0;rvSet(this)"> 起端</label>　<label><input type="checkbox" ${rv.cap && rv.cap.b ? 'checked' : ''} data-rv="cap.b" onchange="this.value=this.checked?1:0;rvSet(this)"> 迄端</label>　<label><input type="checkbox" ${rv.cap && rv.cap.c ? 'checked' : ''} data-rv="cap.c" onchange="this.value=this.checked?1:0;rvSet(this)"> 接壩／側牆端</label></div>
        <div style="font-size:10.5px;color:var(--text-muted);">封牆＝封住護岸斷面（含基礎）＋背側梯形延伸，鋼筋混凝土另列數量（混凝土、模板、鋼筋）；平面為長方形，置於護岸端外側；詳圖見標準圖。</div>`)}
      ${acc('std', '標準圖', `示意地形 背後高 ${rvF(p.sgH === null || p.sgH === undefined ? 0.7 * p.H : p.sgH)} m`, comm('std') + `<button class="btn" style="margin-top:4px;" onclick="rvStdOpen()" title="開啟標準圖（典型斷面、型式細節、每公尺數量、檢核、本段數量），可匯出 DXF">開啟標準圖</button>`)}
      ${ck.length ? acc('chk', '設計原則檢核', ck.every(c => c.ok) ? '全部符合' : `${ck.filter(c => !c.ok).length} 項需注意`, ck.map(c => `<div style="font-size:11px;color:${c.ok ? '#15803d' : '#b91c1c'};">${c.ok ? '✔' : '⚠'} ${c.text}</div>`).join('')) : ''}
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;"><button class="btn" onclick="rvStdOpen()">標準圖</button><button class="btn" onclick="rvCopyOpp()" title="複製這段到對岸（之後互不連動）">複製到對岸</button><button class="btn danger" onclick="rvDel()">刪除</button></div>
      ${rv._warn ? `<div style="margin-top:6px;color:#b91c1c;font-size:11px;">⚠ ${rv._warn}</div>` : ''}
      ${q ? `<div style="margin-top:6px;font-size:11.5px;line-height:1.6;">實長 <b>${rvF(q.lenB)}</b> m（中心線長 ${rvF(q.lenC)} m）<br>${q.rows.map(r => `${r.it} <b>${rvF(r.v, ['處', '支', '座'].includes(r.u) ? 0 : (r.u === 'kg' ? 1 : 2))}</b> ${r.u}`).join('　')}<br><span style="color:var(--text-muted);font-size:10.5px;">開挖、回填：併入全線土方表（縱橫斷面頁籤）</span></div>` : ''}
    </div>`;
  }
  if (TT.n) {
    const keys = []; state.revs.forEach(r => { if (r._q) r._q.rows.forEach(x => { if (!keys.some(k => k.k === x.k && k.u === x.u)) keys.push({ k: x.k, it: x.it, u: x.u }); }); });
    const val = (t, k) => (k.k === 'EX' ? t.EX : k.k === 'BF' ? t.BF : k.k === 'nP' ? t.nP : k.k === 'nJ' ? t.nJ : k.k === 'nW' ? t.nW : (t.I[k.k] || 0));
    h += `<div style="margin-top:8px;font-size:11px;"><table class="pt-table"><thead><tr><th>項目</th><th>左岸</th><th>右岸</th><th>合計</th></tr></thead><tbody><tr><td>段數／實長 m</td>${[T2[0], T2[1], TT].map(t => `<td style="text-align:right;">${t.n}／${rvF(t.lenB, 1)}</td>`).join('')}</tr>${keys.map(k => `<tr><td>${k.it} (${k.u})</td>${[T2[0], T2[1], TT].map(t => `<td style="text-align:right;">${rvF(val(t, k), ['處', '支', '座'].includes(k.u) ? 0 : 1)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  box.innerHTML = h;
}
function tcSetPrio(kind, cat, on) { pushUndoSnapshot(); state.tcPrio = state.tcPrio || {}; state.tcPrio[kind] = Object.assign({}, state.tcPrio[kind], { [cat]: !!on }); RV_ZDIRTY = true; RV_SIG = ''; rebuildAlignmentAndSections(); }

(function () {
  const s = document.createElement('style');
  s.textContent = `.rvg{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:3px 6px;align-items:center;font-size:11px;} .rvg>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:help;}
  .rvacc{margin-top:6px;border:1px solid var(--border-dim);border-radius:4px;} .rvacc>summary{cursor:pointer;font-size:11px;font-weight:700;color:#0369a1;padding:3px 6px;background:rgba(14,116,144,.06);} .rvacc .sm{font-weight:400;color:var(--text-muted);margin-left:8px;font-size:10.5px;} .rvab{padding:5px 6px;}
  .rvg2{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:3px 6px;align-items:center;font-size:11px;} .rvsta{display:inline-flex;gap:1px;align-items:center;} .rvsb{padding:0 3px!important;font-size:10px;min-width:0;line-height:1.4;} .rvu{font-size:10px;color:var(--text-muted);}
  .rvmenu{position:fixed;z-index:9999;width:300px;max-height:280px;overflow-y:auto;background:var(--bg-panel,#fff);border:1px solid #94a3b8;border-radius:4px;box-shadow:0 6px 20px rgba(0,0,0,.25);font-size:11.5px;} .rvmi{padding:4px 8px;cursor:pointer;border-bottom:1px solid rgba(148,163,184,.25);} .rvmi:hover{background:rgba(34,211,238,.18);} .rvmadd{color:#0369a1;font-weight:700;}
  .rvr{display:grid;grid-template-columns:16px 84px 84px 52px 52px 52px auto;gap:3px 4px;align-items:center;font-size:11px;}`;
  document.head.appendChild(s);
})();
function rvRelabel() {   // 舊「護岸斷面樣板」欄位：改作「新增護岸時的預設值」說明
  const set = (id, t) => { const el = document.getElementById(id), lab = el && el.parentNode && el.parentNode.querySelector('.form-label'); if (lab) lab.textContent = t; };
  set('desBankH', '新增護岸預設牆高 H (m)；護岸改於「護岸」卡片逐段設定'); set('desFoundD', '（舊樣板）基礎深 D：僅供舊專案轉換參考'); set('desBankSlope', '（舊樣板）護岸斜率：僅供舊專案轉換參考');
  set('cutSlope', '（已停用）設計線低於地形斜率：無護岸路段設計線＝地形線'); set('bfDx', '（舊樣板）護岸頂斜線 橫向：改為每段護岸的「預留沉陷」'); set('bfDz', '（舊樣板）護岸頂斜線 垂直：改為每段護岸的「預留沉陷」');
  ['bfMaxH', 'bfSlope'].forEach(id => { const el = document.getElementById(id), row = el && (el.closest('.form-row') || el.parentElement); if (row) row.style.display = 'none'; });
}
window.addEventListener('load', () => setTimeout(rvRelabel, 0));
function rvReverse(S) {
  state.revs.forEach(rv => {
    const a = rv.s0, b = rv.s1; rv.s0 = b === null ? null : +(S - b).toFixed(3); rv.s1 = a === null ? null : +(S - a).toFixed(3);
    const e0 = rv.e0; rv.e0 = rv.e1; rv.e1 = e0; if (rv.cap) { const ca = rv.cap.a; rv.cap.a = rv.cap.b; rv.cap.b = ca; } rv.side = rv.side === 'L' ? 'R' : 'L';
    rv.raises.concat(rv.wids || []).forEach(r => { const lo = Math.min(r.s0, r.s1), hi = Math.max(r.s0, r.s1), t0 = r.t0; r.s0 = +(S - hi).toFixed(3); r.s1 = +(S - lo).toFixed(3); r.t0 = r.t1; r.t1 = t0; });
  });
}
function rvPick(sta, wpt, proj) {   // 圖面點選：第一次＝起點、第二次＝迄點；加高／拉寬模式則為區段起迄
  const mode = state.rvMode || 'rev';
  if (mode === 'end') { const rv = state.revs[state.rvSel]; state.rvMode = 'rev'; setTool('PAN'); if (rv) rvSetEnd(rv, state.rvPickWh || 's0', sta); return; }
  if (!state.rvPend) {
    let side = 'L', hint = '';
    if (mode === 'rev' && wpt && proj) { const d = (wpt.x - proj.x) * proj.nx + (wpt.y - proj.y) * proj.ny; if (Math.abs(d) < 0.5) hint = '（點在中心線上，預設左岸；請點在中心線的某一側以指定左右岸）'; else side = d > 0 ? 'L' : 'R'; }
    state.rvPend = { s0: sta, side };
    updateStatus(mode === 'raise' ? `⬆ 加高起點 ${formatStation(sta)}；請再點迄點。` : mode === 'widen' ? `↔ 拉寬起點 ${formatStation(sta)}；請再點迄點。` : `🧱 護岸起點 ${formatStation(sta)}（${side === 'L' ? '左' : '右'}岸）${hint}；請再點迄點。`); return;
  }
  const a = Math.min(state.rvPend.s0, sta), b = Math.max(state.rvPend.s0, sta), side = state.rvPend.side; state.rvPend = null;
  if (b - a < 0.5) { updateStatus('⚠ 起迄距離太短，已取消。'); state.rvMode = 'rev'; setTool('PAN'); return; }
  if (mode === 'raise' || mode === 'widen') {
    const rv = state.revs[state.rvSel]; state.rvMode = 'rev'; setTool('PAN'); if (!rv) return;
    pushUndoSnapshot();
    if (mode === 'raise') rv.raises.push(tcType(rv.type).layered ? { s0: +a.toFixed(2), s1: +b.toFixed(2), dh: 1, t0: 0, t1: 0 } : { s0: +a.toFixed(2), s1: +b.toFixed(2), dh: 0.5, t0: 10, t1: 10 }); else { rv.wids = rv.wids || []; rv.wids.push({ s0: +a.toFixed(2), s1: +b.toFixed(2), de: 1, t0: 10, t1: 10 }); }
    RV_SIG = ''; rebuildAlignmentAndSections();
    updateStatus(mode === 'raise' ? `⬆ 已於「${rvName(rv)}」加高區段 ${formatStation(a)}～${formatStation(b)}（Δh 預設 0.5、前後漸變 10 m，請在卡片內修改）。` : `↔ 已於「${rvName(rv)}」拉寬區段 ${formatStation(a)}～${formatStation(b)}（Δe 預設 +1.0、前後漸變 10 m，向外為正，請在卡片內修改）。`); return;
  }
  rvAdd(side, +a.toFixed(2), +b.toFixed(2)); state.rvMode = 'rev'; setTool('PAN');
}

/* ---- 平面圖互動：點選護岸、拖曳起迄端點 ---- */
state.rvDrag = null;
function rvPxW() { const a = screenToWorld2D(0, 0), b = screenToWorld2D(1, 0); return Math.hypot(b.x - a.x, b.y - a.y); }
function rvMouseDown(mx, my, wpt) {   // 回傳 true＝已開始拖曳端點（不再平移）
  if (!state.revs || !state.revs.length) return false;
  const rv = state.revs[state.rvSel];
  if (rv && rvVis(rv)) for (let k = 0; k < (rv.cps || []).length; k++) { const hp = rvCpPt(rv, rv.cps[k]); if (!hp) continue; const q = worldToScreen2D(hp.x, hp.y);
    if (Math.hypot(q.x - mx, q.y - my) <= 9) { pushUndoSnapshot(); state.rvDrag = { i: state.rvSel, cp: k, moved: false }; updateStatus(`↔ 拖曳「${rvName(rv)}」控制點 ${k + 1}：左右移動改距離 e、沿線移動改樁號（Shift＝不吸附 0.5 m）。`); return true; } }
  if (rv && rvVis(rv)) for (const wh of ['s0', 's1']) {
    const hp = rvHandlePt(rv, wh); if (!hp) continue; const q = worldToScreen2D(hp.x, hp.y);
    if (Math.abs(q.x - mx) <= 8 && Math.abs(q.y - my) <= 8) { pushUndoSnapshot(); state.rvDrag = { i: state.rvSel, wh, moved: false }; updateStatus(`↔ 拖曳「${rvName(rv)}」${wh === 's0' ? '起' : '迄'}端：沿中心線移動，吸附 0.5 m 與關鍵樁號（Shift＝不吸附）。`); return true; }
  }
  const hit = rvHitTest(wpt);
  if (hit >= 0 && hit !== state.rvSel) { rvSel(hit); updateStatus(`🧱 已選取「${rvName(state.revs[hit])}」（兩端小方塊可拖曳改起迄）。`); }
  return false;
}
function rvDragMove(wpt, shift) {
  const D = state.rvDrag, rv = D && state.revs[D.i]; if (!rv) return;
  const proj = projectWorldPointToAlignment(wpt.x, wpt.y); if (!proj) return; const al = state.alignment, L = rvLim(rv);
  if (D.cp !== undefined) { const c = rv.cps[D.cp]; if (!c) return; let sv = Math.max(L.a + 0.5, Math.min(L.b - 0.5, proj.sta)); if (!shift) sv = Math.round(sv * 2) / 2; const g = getPointAndNormalAtStation(sv); if (!g) return;
    let e = -((wpt.x - g.x) * g.nx + (wpt.y - g.y) * g.ny) * rvSg(rv) - rvWiden(rv, sv); if (!shift) e = Math.round(e * 10) / 10; c.s = +sv.toFixed(2); c.e = +Math.max(0.1, e).toFixed(3); D.moved = true; RV_SIG = ''; updateStatus(`↔ ${rvName(rv)} 控制點 ${D.cp + 1}：${formatStation(c.s)}、e＝${rvF(c.e)} m`); requestRedraw(); return; }
  let s = proj.sta;
  if (!shift) {
    const cand = [al.startSta, al.endSta]; rvZones().forEach(z => cand.push(z.a, z.b)); state.revs.forEach((r, k) => { if (k !== D.i) { const M = rvLim(r); cand.push(M.a, M.b); } });
    let best = null, bd = 0.6; cand.forEach(c => { const dd = Math.abs(c - s); if (dd < bd) { bd = dd; best = c; } });
    s = best !== null ? best : Math.round(s * 2) / 2;
  } else s = +s.toFixed(2);
  s = Math.max(al.startSta, Math.min(al.endSta, s));
  if (D.wh === 's0') s = Math.min(s, L.b - 0.5); else s = Math.max(s, L.a + 0.5);
  if (Math.abs((rv[D.wh] ?? (D.wh === 's0' ? L.a : L.b)) - s) < 1e-9) return;
  rv[D.wh] = +s.toFixed(3); D.moved = true; RV_SIG = ''; updateStatus(`↔ ${rvName(rv)} ${D.wh === 's0' ? '起' : '迄'}端 → ${formatStation(s)}`); requestRedraw();
}
function rvDragEnd() {
  const D = state.rvDrag; if (!D) return; state.rvDrag = null;
  if (D.moved) { if (D.cp !== undefined) { const rv = state.revs[D.i]; if (rv && rv.cps) rv.cps.sort((a, b) => a.s - b.s); } RV_SIG = ''; rebuildAlignmentAndSections(); updateStatus(D.cp !== undefined ? '✅ 已更新護岸控制點（斷面與數量已重算）。' : '✅ 已更新護岸起迄樁號（斷面與數量已重算）。'); }
}

/* ---- 導引新增：選型式 → 依型式分組逐步填參數（右側斷面預覽，焦點欄位尺寸高亮） → 開挖背填 → 位置 → 確認 ---- */
let RVW = null;
function rvWizard() {
  const type = state.rvLastType || 'grav';
  RVW = { step: 0, type, p: tcDefaults(type), side: 'L', s0: null, s1: null, e0: null, e1: null, focus: null };
  const gp = rvGap('L'); if (gp) { RVW.s0 = gp.a; RVW.s1 = gp.b; }
  let d = document.getElementById('rvWiz'); if (!d) { d = document.createElement('div'); d.id = 'rvWiz'; document.body.appendChild(d); }
  d.style.display = 'flex'; rvWizRender();
}
function rvWizSteps() { const T = tcType(RVW.type); return [{ k: 'type', t: '選型式' }].concat(T.groups.map(g => ({ k: 'g:' + g.k, t: g.t })), [{ k: 'exc', t: '開挖與背填' }, { k: 'pos', t: '位置與範圍' }, { k: 'ok', t: '確認' }]); }
function rvWizClose() { const d = document.getElementById('rvWiz'); if (d) d.style.display = 'none'; RVW = null; }
function rvWizGo(k) { const st = rvWizSteps(); RVW.step = Math.max(0, Math.min(st.length - 1, RVW.step + k)); RVW.focus = null; rvWizRender(); }
function rvWizType(id) { if (!TC_TYPES[id]) return; const H = RVW.p.H; RVW.type = id; RVW.p = tcDefaults(id, id === 'grav' ? H : undefined); rvWizRender(); }
function rvWizSet(el) {
  const k = el.dataset.w, T = tcType(RVW.type), q = T.params.find(x => x.k === k), t = String(el.value).trim();
  if (['side'].includes(k)) RVW.side = t; else if (['s0', 's1'].includes(k)) { const v = rvParseSta(t); RVW[k] = Number.isFinite(v) ? v : null; } else if (['e0', 'e1'].includes(k)) { RVW[k] = t === '' ? null : Math.max(0.05, parseFloat(t) || 0); }
  else if (q && q.u === 'sel') RVW.p[k] = t; else if (q && q.u === 'chk') RVW.p[k] = el.checked ? 1 : 0; else { const v = parseFloat(t); if (Number.isFinite(v)) RVW.p[k] = v; }
  if (T.sync) T.sync(RVW.p);
  if (k === 'H') { T.params.forEach(x => { if (typeof x.def === 'function') RVW.p[x.k] = x.def(RVW.p.H); }); rvWizRender(); return; }
  if (k === 'side') { const gp = rvGap(t); RVW.s0 = gp ? gp.a : null; RVW.s1 = gp ? gp.b : null; rvWizRender(); return; }
  rvWizPreview();
}
function rvWizFocus(k) { RVW.focus = k; rvWizPreview(); }
function rvWizField(nm, k, val, st, u, tip, extra) {
  return `<label class="rvwf" title="${rvEsc(tip || '')}"><span>${nm}</span>${extra || `<input type="number" step="${st || 0.1}" value="${val === null || val === undefined ? '' : +(+val).toFixed(4)}" data-w="${k}" onfocus="rvWizFocus('${k}')" oninput="rvWizSet(this)">`}<em>${u || ''}</em></label>`;
}
function rvWizRender() {
  const d = document.getElementById('rvWiz'); if (!d || !RVW) return; const st = rvWizSteps(), cur = st[RVW.step], T = tcType(RVW.type), p = RVW.p;
  let body = '';
  if (cur.k === 'type') {
    body = TC_CATS.map(c => `<div class="rvwcat">${c.label}</div><div class="rvwcards">${TC_ORDER.filter(id => TC_TYPES[id].cat === c.id).map(id => `<div class="rvwcard${id === RVW.type ? ' on' : ''}" onclick="rvWizType('${id}')"><canvas width="150" height="90" data-thumb="${id}"></canvas><b>${TC_TYPES[id].label}</b><small>${TC_TYPES[id].code === '範本' ? 'AutoCAD 範本' : '標準圖'}</small></div>`).join('')}${TC_PEND.filter(q => q.cat === c.id).map(q => `<div class="rvwcard off"><div class="rvwph">待移植</div><b>${q.label}</b><small>標準圖</small></div>`).join('')}</div>`).join('');
  } else if (cur.k.startsWith('g:')) {
    const gk = cur.k.slice(2);
    body = T.params.filter(x => x.g === gk).map(x => x.u === 'sel' ? rvWizField(x.nm, x.k, null, 0, '', x.tip, `<select data-w="${x.k}" onfocus="rvWizFocus('${x.k}')" onchange="rvWizSet(this)">${x.opt.map(o => `<option value="${o}"${o === p[x.k] ? ' selected' : ''}>${typeof TCO_SEL_LAB !== 'undefined' && TCO_SEL_LAB[o] ? TCO_SEL_LAB[o] : o}</option>`).join('')}</select>`) : x.u === 'chk' ? rvWizField(x.nm, x.k, null, 0, '', x.tip, `<input type="checkbox" ${p[x.k] ? 'checked' : ''} data-w="${x.k}" onchange="rvWizSet(this)">`) : rvWizField(x.nm, x.k, p[x.k], x.st, x.u === 'm' ? 'm' : x.u, x.tip)).join('');
  } else if (cur.k === 'exc') {
    body = TC_COMMON.filter(x => x[4] === 'exc' || x[0] === 'jsp').map(([k, nm, s2, tip]) => rvWizField(nm, k, p[k], s2, '', tip)).join('');
  } else if (cur.k === 'pos') {
    const ks = rvKeyList(), opt = v => `<option value="">（手動）</option>` + ks.map(k => `<option value="${k.s}"${v !== null && Math.abs(k.s - v) < 0.01 ? ' selected' : ''}>${formatStation(k.s)}　${rvEsc(k.n.join('、'))}</option>`).join('');
    body = rvWizField('岸別', 'side', null, 0, '', '', `<select data-w="side" onchange="rvWizSet(this)"><option value="L"${RVW.side === 'L' ? ' selected' : ''}>左岸</option><option value="R"${RVW.side === 'R' ? ' selected' : ''}>右岸</option></select>`) +
      ['s0', 's1'].map(k => rvWizField(k === 's0' ? '起樁號' : '迄樁號', k, null, 0, '', '從關鍵樁號選，或手打（m 或 0K+085）', `<span style="display:flex;gap:3px;"><select style="width:150px;" onchange="this.nextElementSibling.value=this.value?formatStation(+this.value):this.nextElementSibling.value;rvWizSet(this.nextElementSibling)">${opt(RVW[k])}</select><input type="text" style="width:84px;" data-w="${k}" value="${RVW[k] === null ? '' : formatStation(RVW[k])}" placeholder="${k === 's0' ? '全線起' : '全線迄'}" onchange="rvWizSet(this)"></span>`)).join('') +
      rvWizField('距中心線 e 起', 'e0', RVW.e0, 0.1, 'm', '空白＝設計河寬 W/2') + rvWizField('距中心線 e 迄', 'e1', RVW.e1, 0.1, 'm', '空白＝設計河寬 W/2') +
      `<div style="font-size:11px;margin-top:6px;"><button class="btn" onclick="rvWizClose();rvAddSta()">＋ 先到平面加樁</button>（加完樁後重新開啟導引即可從清單選）</div>`;
  } else {
    const M = rvStdModel({ p, type: RVW.type, side: RVW.side, raises: [], wids: [], s0: null, s1: null, e0: null, e1: null, j0: { m: 'direct', L: 10 }, cap: {}, ign: false }), ck = T.checks ? T.checks(p) : [];
    body = `<div style="font-size:12px;line-height:1.7;"><b>${T.label}</b>　${RVW.side === 'L' ? '左岸' : '右岸'}　${RVW.s0 === null ? '全線起' : formatStation(RVW.s0)}～${RVW.s1 === null ? '全線迄' : formatStation(RVW.s1)}<br>
      <b>每公尺數量（標準斷面、示意地形）</b><br>${T.items.filter(it => !it.opt || (M.q[it.k] || 0) > 1e-9).map(it => `${it.it}：${rvF(M.q[it.k] || 0, it.u === 'kg' ? 1 : 3)} ${it.u}/m`).join('<br>')}<br>開挖：${rvF(M.q.EX, 3)} m³/m　回填：${rvF(M.q.BF, 3)} m³/m</div>` +
      (ck.length ? `<div style="margin-top:6px;font-size:11.5px;">${ck.map(c => `<div style="color:${c.ok ? '#15803d' : '#b91c1c'};">${c.ok ? '✔' : '⚠'} ${c.text}</div>`).join('')}</div>` : '') + `<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">按「建立」後即放置；之後可在卡片的風琴分組逐項修改。</div>`;
  }
  d.innerHTML = `<div class="rvwbox"><div class="rvwhd"><b>導引新增結構物（沿岸）</b><span>${st.map((x, i) => `<i class="${i === RVW.step ? 'on' : i < RVW.step ? 'done' : ''}">${i + 1}. ${x.t}</i>`).join('')}</span><button class="btn" onclick="rvWizClose()">✕</button></div>
    <div class="rvwbd"><div class="rvwl">${body}</div><div class="rvwr"><canvas id="rvWizCv" width="420" height="330"></canvas><div id="rvWizTip" style="font-size:11px;color:var(--text-muted);"></div></div></div>
    <div class="rvwft"><button class="btn" ${RVW.step ? '' : 'disabled'} onclick="rvWizGo(-1)">上一步</button>${RVW.step < st.length - 1 ? `<button class="btn primary" onclick="rvWizGo(1)">下一步</button>` : `<button class="btn primary" onclick="rvWizCreate()">建立</button>`}</div></div>`;
  d.querySelectorAll('canvas[data-thumb]').forEach(cv => rvWizDraw(cv, cv.dataset.thumb, tcDefaults(cv.dataset.thumb), null, true));
  rvWizPreview();
}
function rvWizPreview() { const cv = document.getElementById('rvWizCv'); if (cv && RVW) rvWizDraw(cv, RVW.type, RVW.p, RVW.focus, false); const tp = document.getElementById('rvWizTip'); if (tp && RVW) { const q = tcType(RVW.type).params.find(x => x.k === RVW.focus); tp.textContent = q ? `${q.nm}${q.tip ? '：' + q.tip : ''}` : '點選左側欄位，圖上對應的尺寸會以黃色標示。'; } }
function rvWizDraw(cv, type, p, focus, thumb) {   // 斷面示意（單岸）：結構體、示意地形、設計面、開挖線、尺寸
  const c = cv.getContext('2d'), W = cv.width, Hc = cv.height, T = tcType(type), R = Object.assign({}, p, { e: 0.5, rv: { type }, T }), G = T.geo(R, 0);
  const hb = p.sgH === null || p.sgH === undefined ? 0.7 * p.H : p.sgH, gz = a => (a <= R.e ? 0 : a <= G.a0b ? hb * (a - R.e) / Math.max(1e-6, G.a0b - R.e) : hb + (p.sgS || 0) * (a - G.a0b));
  const tr = rvTrench(R, 0, gz, G.a0b + 30, G), xs = [0, G.a0b + 1.5, tr.aB + 0.3], zs = [G.zTop + 0.5, G.zf - 0.4];
  G.polys.forEach(pg => pg.pts.forEach(q => { xs.push(q[0]); zs.push(q[1]); }));
  const x0 = Math.min(...xs) - 0.3, x1 = Math.max(...xs) + 0.3, z0 = Math.min(...zs), z1 = Math.max(...zs), pad = thumb ? 6 : 26, k = Math.min((W - 2 * pad) / (x1 - x0), (Hc - 2 * pad) / (z1 - z0));
  const X = a => pad + (a - x0) * k, Y = z => Hc - pad - (z - z0) * k;
  c.fillStyle = '#0b1018'; c.fillRect(0, 0, W, Hc); c.lineJoin = 'round';
  c.strokeStyle = '#64748b'; c.lineWidth = 1; c.beginPath(); for (let a = x0; a <= x1; a += 0.1) { const y = Y(gz(Math.max(0, a))); a === x0 ? c.moveTo(X(a), y) : c.lineTo(X(a), y); } c.stroke();
  if (tr.need) { c.strokeStyle = '#ff4fd8'; c.setLineDash([5, 3]); c.beginPath(); c.moveTo(X(tr.aF), Y(tr.zF)); c.lineTo(X(tr.aF0), Y(tr.zf)); c.lineTo(X(tr.aB0), Y(tr.zf)); c.lineTo(X(tr.aB), Y(tr.zB)); c.stroke(); c.setLineDash([]); }
  G.polys.forEach(pg => { const M = RV_MAT[pg.m] || RV_MAT.conc; c.fillStyle = M.f.replace(/0\.\d+\)$/, '0.25)'); c.strokeStyle = M.c; c.lineWidth = thumb ? 1 : 1.5; c.beginPath(); pg.pts.forEach((q, i) => (i ? c.lineTo(X(q[0]), Y(q[1])) : c.moveTo(X(q[0]), Y(q[1])))); c.closePath(); c.fill(); c.stroke(); });
  c.strokeStyle = '#38bdf8'; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(X(x0), Y(0)); c.lineTo(X(R.e), Y(0)); G.face.forEach(q => c.lineTo(X(q[0]), Y(q[1]))); c.stroke(); c.setLineDash([]);
  if (!thumb && typeof tcHLDrawWiz === 'function') tcHLDrawWiz(c, T, R, G, focus, X, Y);
  if (thumb) return;
  const D = T.dims ? T.dims(G, R, 0) : {}; c.font = '11px "Noto Sans TC"';
  Object.entries(D).forEach(([kk, sg]) => { if (!sg) return; const on = kk === focus; c.strokeStyle = on ? '#fde047' : 'rgba(226,232,240,.45)'; c.fillStyle = c.strokeStyle; c.lineWidth = on ? 2.5 : 1; c.beginPath(); c.moveTo(X(sg[0][0]), Y(sg[0][1])); c.lineTo(X(sg[1][0]), Y(sg[1][1])); c.stroke(); [sg[0], sg[1]].forEach(q => { c.beginPath(); c.arc(X(q[0]), Y(q[1]), on ? 3 : 2, 0, 7); c.fill(); }); const q = T.params.find(x => x.k === kk); c.fillText(kk + (on && q ? ' ' + q.nm.replace(/\s*\(.*?\)/g, '') : ''), (X(sg[0][0]) + X(sg[1][0])) / 2 + 4, (Y(sg[0][1]) + Y(sg[1][1])) / 2 - 4); });
  c.fillStyle = '#94a3b8'; c.fillText('← 河道（中心線側）', 6, 14); c.fillText('設計河床', X(R.e) - 50, Y(0) - 4);
}
function rvWizCreate() {
  if (!RVW) return; const w = RVW; rvWizClose();
  rvAdd(w.side, w.s0 === null ? null : +w.s0.toFixed(2), w.s1 === null ? null : +w.s1.toFixed(2), w.type, { p: w.p, e0: w.e0, e1: w.e1 });
}
(function () {
  const s = document.createElement('style');
  s.textContent = `#rvWiz{position:fixed;inset:0;z-index:9000;background:rgba(2,6,23,.55);display:none;align-items:center;justify-content:center;}
  .rvwbox{width:min(980px,96vw);max-height:92vh;display:flex;flex-direction:column;background:var(--bg-panel,#fff);color:var(--text-main,#0f172a);border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,.35);overflow:hidden;}
  .rvwhd{display:flex;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--border-dim,#cbd5e1);} .rvwhd>span{flex:1;display:flex;gap:4px;flex-wrap:wrap;font-size:11px;} .rvwhd i{font-style:normal;padding:2px 6px;border-radius:10px;background:rgba(148,163,184,.18);} .rvwhd i.on{background:#0891b2;color:#fff;} .rvwhd i.done{background:rgba(8,145,178,.25);}
  .rvwbd{display:flex;gap:12px;padding:12px;overflow:auto;} .rvwl{flex:1;min-width:300px;} .rvwr{width:420px;flex:none;}
  .rvwf{display:grid;grid-template-columns:1fr auto 34px;gap:6px;align-items:center;font-size:12px;margin-bottom:5px;} .rvwf input[type=number]{width:96px;} .rvwf em{font-style:normal;font-size:11px;color:var(--text-muted,#64748b);}
  .rvwcat{font-weight:700;color:#0369a1;margin:6px 0 4px;} .rvwcards{display:flex;gap:8px;flex-wrap:wrap;} .rvwcard{width:166px;border:2px solid var(--border-dim,#cbd5e1);border-radius:6px;padding:6px;cursor:pointer;display:flex;flex-direction:column;gap:2px;font-size:12px;} .rvwcard.on{border-color:#0891b2;background:rgba(8,145,178,.08);} .rvwcard.off{opacity:.45;cursor:not-allowed;} .rvwcard small{color:var(--text-muted,#64748b);} .rvwph{height:90px;display:flex;align-items:center;justify-content:center;background:#0b1018;color:#64748b;}
  .rvwft{display:flex;justify-content:flex-end;gap:8px;padding:8px 12px;border-top:1px solid var(--border-dim,#cbd5e1);}`;
  document.head.appendChild(s);
})();

/* ---- 橫斷面顯示範圍：結構物／護岸（含開挖線）及設計異於地形者外側 + m 公尺；可改全寬（DXF 同步） ---- */
state.crossCrop = { on: true, m: 10 };
function crossXExt(sec) {   // 該斷面「值得顯示」的偏移範圍 [lo,hi]；無任何設計者回傳 null（顯示全寬）
  let lo = Infinity, hi = -Infinity; const inc = o => { if (Number.isFinite(o)) { lo = Math.min(lo, o); hi = Math.max(hi, o); } };
  sec.samples.forEach(s => { if (Math.abs(s.desZ - s.groundZ) > 0.02) inc(s.offset); });
  try {
    stAtSec(sec).forEach(st => { const g = stGeo(st), d = st.dir, ex = st._ex, OF = st.p.off || 0; inc(d * (g.xmin + OF)); inc(d * (g.xmax + OF)); if (ex && ex.ok) [ex.crossU, ex.crossD].forEach(c => (c || []).forEach(q => inc(d * (q[0] + OF)))); });
    stAccAtSec(sec).forEach(({ st, polys }) => { const OF = st.p.off || 0; polys.forEach(pg => pg.forEach(q => inc(st.dir * (q[0] + OF)))); const F = st._exF; if (F) { inc(st.dir * (F.x0 + OF)); inc(st.dir * (F.x1 + OF)); } });
  } catch (e) { }
  ['L', 'R'].forEach(sd => { let G = null; try { G = rvGeomSec(sec, sd); } catch (e) { G = null; } if (!G) return; const sg = G.sg; G.polys.forEach(pg => pg.pts.forEach(p => inc(sg * p[0]))); if (G.trench) { inc(sg * G.trench.aB); inc(sg * G.trench.aF); } });
  return Number.isFinite(lo) ? [lo, hi] : null;
}
function crossCropRange(sec) {   // → [minOff,maxOff]（已夾在取樣範圍內）
  const a = sec.samples[0].offset, b = sec.samples[sec.samples.length - 1].offset, C = state.crossCrop || {};
  if (!C.on) return [a, b]; const ex = crossXExt(sec); if (!ex) return [a, b]; const m = Math.max(0, +C.m || 0);
  const lo = Math.max(a, Math.min(ex[0], 0) - m), hi = Math.min(b, Math.max(ex[1], 0) + m); return hi > lo + 1 ? [lo, hi] : [a, b];
}
function secCropSamples(sec, lo, hi) {   // 取樣點裁切至 [lo,hi]（兩端內插）
  const S = sec.samples, out = [], at = o => { let i = 0; while (i < S.length - 2 && S[i + 1].offset < o) i++; const p = S[i], q = S[i + 1], t = (o - p.offset) / ((q.offset - p.offset) || 1); return Object.assign({}, p, { offset: o, groundZ: p.groundZ + (q.groundZ - p.groundZ) * t, desZ: p.desZ + (q.desZ - p.desZ) * t }); };
  if (S[0].offset < lo - 1e-9) out.push(at(lo));
  S.forEach(s => { if (s.offset >= lo - 1e-9 && s.offset <= hi + 1e-9) out.push(s); });
  if (S[S.length - 1].offset > hi + 1e-9) out.push(at(hi));
  return out;
}
function crossCropSet(on, m) { state.crossCrop = state.crossCrop || { on: true, m: 10 }; if (on !== null && on !== undefined) state.crossCrop.on = !!on; if (m !== null && m !== undefined && Number.isFinite(+m)) state.crossCrop.m = Math.max(0, +m); crossCropUI(); requestRedraw(); }
function crossCropUI() { const C = state.crossCrop || {}, a = document.getElementById('ccMode'), b = document.getElementById('ccM'); if (a) a.value = C.on ? 'crop' : 'full'; if (b) { b.value = C.m; b.disabled = !C.on; } }

/* ---- 原圖移植型式（TY.orig）：原工具繪圖圖元 → 標準圖／橫斷面畫面／DXF ---- */
const TCO_ACI = { '#facc15': 2, '#eab308': 2, '#fde047': 2, '#fbbf24': 2, '#d946ef': 6, '#c084fc': 6, '#f472b6': 6, '#38bdf8': 4, '#ef4444': 1, '#22c55e': 3, '#4ade80': 3, '#94a3b8': 8, '#334155': 8, '#cbd5e1': 8, '#e2e8f0': 7, '#f8fafc': 7, '#ffffff': 7 };
const TCO_LY = { 1: 'REBAR', 2: 'STONE', 3: 'PC', 4: 'DIM', 6: 'GRAVEL', 7: 'LINE', 8: 'NOTE' };
const TCO_ACI_RGB = [[1, 255, 0, 0], [2, 250, 204, 21], [3, 34, 197, 94], [4, 56, 189, 248], [5, 59, 130, 246], [6, 217, 70, 239], [7, 240, 240, 240], [8, 148, 163, 184], [30, 251, 146, 60]];
const tcoAci = c => { const k = String(c || '').toLowerCase(); if (TCO_ACI[k]) return TCO_ACI[k]; let r, g, b; const m = k.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/); if (m) { r = +m[1]; g = +m[2]; b = +m[3]; } else if (/^#[0-9a-f]{6}$/.test(k)) { r = parseInt(k.slice(1, 3), 16); g = parseInt(k.slice(3, 5), 16); b = parseInt(k.slice(5, 7), 16); } else return 7;
  let best = 7, bd = Infinity; TCO_ACI_RGB.forEach(([a, R2, G2, B2]) => { const d = (r - R2) ** 2 + (g - G2) ** 2 + (b - B2) ** 2; if (d < bd) { bd = d; best = a; } }); return best; };   // v5.5：任意顏色→最接近的 ACI
/* v5.5 填充樣式線段（以中點判斷在外框內、孔洞外）：G＝GRAVEL 晶格、H＝HONEY 六角格網、E＝EARTH 交錯三線 */
function tcoHatchSegs(o) {
  const out = [], xs = o.outer.map(p => p[0]), ys = o.outer.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), H = o.holes || [];
  const add = (a, b) => { const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (pointInPoly(mid, o.outer) && !H.some(h => pointInPoly(mid, h))) out.push([a, b]); };
  if (o.k === 'G') { const T = o.tile, SG = o.segs || TCO_GRAVEL_TILE_SEGS; for (let tx = Math.floor(x0 / T) * T; tx < Math.ceil(x1 / T) * T; tx += T) for (let ty = Math.floor(y0 / T) * T; ty < Math.ceil(y1 / T) * T; ty += T) SG.forEach(sg => add([tx + sg[0][0] * T, ty + sg[0][1] * T], [tx + sg[1][0] * T, ty + sg[1][1] * T])); }
  else if (o.k === 'H') { const r = o.r, dx = r * 1.5, dy = r * Math.sqrt(3); for (let c = Math.floor(x0 / dx) - 1; c <= Math.ceil(x1 / dx) + 1; c++) for (let q = Math.floor(y0 / dy) - 1; q <= Math.ceil(y1 / dy) + 1; q++) { const cx = c * dx, cy = q * dy + (Math.abs(c) % 2 === 1 ? 0.5 * dy : 0); for (let k = 0; k < 6; k++) { const a1 = k * Math.PI / 3, a2 = (k + 1) * Math.PI / 3; add([cx + r * Math.cos(a1), cy + r * Math.sin(a1)], [cx + r * Math.cos(a2), cy + r * Math.sin(a2)]); } } }
  else if (o.k === 'E') { const C = o.cell, sub = C * 0.24; for (let q = Math.floor(y0 / C) - 1; q <= Math.ceil(y1 / C) + 1; q++) for (let c = Math.floor(x0 / C) - 1; c <= Math.ceil(x1 / C) + 1; c++) { const X0 = c * C, Y0 = q * C, sl = (Math.abs(q + c) % 2) === 0; for (let k = -1; k <= 1; k++) { const off = k * sub; if (sl) add([X0 + C * 0.18 + off * 0.5, Y0 + C * 0.18 - off * 0.5], [X0 + C * 0.82 + off * 0.5, Y0 + C * 0.82 - off * 0.5]); else add([X0 + C * 0.18 + off * 0.5, Y0 + C * 0.82 + off * 0.5], [X0 + C * 0.82 + off * 0.5, Y0 + C * 0.18 + off * 0.5]); } } }
  return out;
}
function tcoClip(P, C) {   // Sutherland–Hodgman：多邊形 P 以凸多邊形 C 裁切
  let out = P; const n = C.length, ar = C.reduce((a, p, i) => a + p[0] * C[(i + 1) % n][1] - C[(i + 1) % n][0] * p[1], 0), sg = ar >= 0 ? 1 : -1;
  const inside = (p, a, b) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
  const X = (p, q, a, b) => { const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1], A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1], d = A1 * B2 - A2 * B1; return Math.abs(d) < 1e-12 ? q : [(B2 * C1 - B1 * C2) / d, (A1 * C2 - A2 * C1) / d]; };
  for (let i = 0; i < n && out.length; i++) { const a = C[i], b = C[(i + 1) % n], inp = out; out = []; for (let j = 0; j < inp.length; j++) { const p = inp[j], q = inp[(j + 1) % inp.length]; const pi = inside(p, a, b), qi = inside(q, a, b); if (qi) { if (!pi) out.push(X(p, q, a, b)); out.push(q); } else if (pi) out.push(X(p, q, a, b)); } }
  return out;
}
function tcoFlat(O) {   // 展開 CB／CE（原工具 ctx.clip 區塊）：區塊內封閉多邊形以凸多邊形裁切、開放線以中點判斷、圓以圓心判斷（DXF／標準圖用）
  const out = []; let C = null;
  O.forEach(o => { if (o.k === 'CB') { C = o.p; return; } if (o.k === 'CE') { C = null; return; } if (!C) { out.push(o); return; }
    if (o.k === 'P' && o.cl) { const q = tcoClip(o.p, C); if (q.length > 2) out.push(Object.assign({}, o, { p: q })); }
    else if (o.k === 'P' || o.k === 'L') { const mid = o.p.length > 1 ? [(o.p[0][0] + o.p[o.p.length - 1][0]) / 2, (o.p[0][1] + o.p[o.p.length - 1][1]) / 2] : o.p[0]; if (pointInPoly(mid, C)) out.push(o); }
    else if (o.k === 'C') { if (pointInPoly([o.x, o.y], C)) out.push(o); } else out.push(o); });
  return out;
}
function tcoGravelSegs(o) {   // 原圖 GRAVEL 晶格線段：以中點判斷在外框內、塊石外（與原工具 DXF 輸出相同）
  const out = [], T = o.tile, xs = o.outer.map(p => p[0]), ys = o.outer.map(p => p[1]);
  for (let tx = Math.floor(Math.min(...xs) / T) * T; tx < Math.ceil(Math.max(...xs) / T) * T; tx += T) for (let ty = Math.floor(Math.min(...ys) / T) * T; ty < Math.ceil(Math.max(...ys) / T) * T; ty += T)
    TCO_GRAVEL_TILE_SEGS.forEach(sg => { const a = [tx + sg[0][0] * T, ty + sg[0][1] * T], b = [tx + sg[1][0] * T, ty + sg[1][1] * T], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (!pointInPoly(mid, o.outer) || o.holes.some(h => pointInPoly(mid, h))) return; out.push([a, b]); });
  return out;
}
const tcoCirc = (o, n = 12) => Array.from({ length: n }, (_, i) => [o.x + o.r * Math.cos(i * 2 * Math.PI / n), o.y + o.r * Math.sin(i * 2 * Math.PI / n)]);
function dzStripNo(s) {   // v6.3：原圖移植圖面文字不顯示圖號（例：(圖號：0607-1)、（0603-1）、水保標準圖 0404-1）
  return String(s == null ? '' : s).replace(/\s*[（(]\s*(?:圖號\s*[：:]?[^)）]*|標準基礎型\s*)?\s*(?:\d{4}-\d|\d-0\d)(?:\s*[/／]\s*(?:\d{4}-\d|\d-0\d))?[^)）]{0,12}[)）]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/～~]+/g, '').replace(/水保標準圖\s*[0-9]{1,4}-[0-9][0-9A-Za-z\-／/]*\s*/g, '').replace(/^\s*[0-9]{4}-[0-9]_/, '').replace(/(^|[【\s])[0-9]{4}-[0-9](?:\s*[/／]\s*[0-9]{4}-[0-9])?\s+(?=\S)/g, '$1');
}
function tcoStdPrims(O, sc, dx, dy, lyPre) {   // → 標準圖圖元（t:'l'/'f'/'t'），座標 × sc ＋ 平移
  const P = [], M = p => [p[0] * sc + dx, p[1] * sc + dy], ly = c => (lyPre || 'STD_') + (TCO_LY[tcoAci(c)] || 'LINE'), dsh = d => (d && d.length ? 1 : 0);
  tcoFlat(O).forEach(o => {
    if (o.k === 'L') P.push({ t: 'l', p: o.p.map(M), c: o.c, a: tcoAci(o.c), ly: ly(o.c), d: dsh(o.d), w: o.w, cl: false });
    else if (o.k === 'P') { if (o.f) P.push({ t: 'f', p: o.p.map(M), c: o.f }); if (o.c) P.push({ t: 'l', p: o.p.map(M), c: o.c, a: tcoAci(o.c), ly: ly(o.c), d: dsh(o.d), w: o.w, cl: !!o.cl }); }
    else if (o.k === 'C') { const pts = tcoCirc(o).map(M); if (o.f) P.push({ t: 'f', p: pts, c: o.f }); P.push({ t: 'l', p: pts, c: o.c, a: tcoAci(o.c), ly: ly(o.c), d: 0, w: o.w, cl: true }); }
    else if (o.k === 'T') P.push({ t: 't', x: o.x * sc + dx, y: o.y * sc + dy, h: o.h * sc, s: dzStripNo(o.s), c: o.c, a: tcoAci(o.c), ly: (lyPre || 'STD_') + 'TEXT', al: o.al === 'left' ? 'l' : (o.al === 'right' ? 'r' : 'c'), va: o.bl === 'top' ? 't' : (o.bl === 'bottom' || o.bl === 'alphabetic' ? 'b' : 'm'), rot: (o.rot || 0) * 180 / Math.PI });
    else if (o.k === 'G' || o.k === 'H' || o.k === 'E') { if (o.k === 'G') P.push({ t: 'f', p: o.outer.map(M), c: 'rgba(217,70,239,0.05)' }); tcoHatchSegs(o).forEach(s => P.push({ t: 'l', p: s.map(M), c: o.c, a: tcoAci(o.c), ly: (lyPre || 'STD_') + 'HATCH', d: 0, w: o.k === 'G' ? 1.15 : 0.7, cl: false })); }
  });
  return P;
}
function tcoCanvas(O, map, kpx, opt) {   // 橫斷面畫面：map(x,y)→[px,py]；kpx＝每原圖單位(cm)像素；opt.lite＝矩陣總覽簡化
  opt = opt || {}; const path = (pts, cl) => { ctx.beginPath(); pts.forEach((p, i) => { const s = map(p[0], p[1]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); if (cl) ctx.closePath(); };
  const lw = w => Math.max(0.45, Math.min(1.0, (w || 1) * (opt.lite ? 0.3 : 0.42)));   // 橫斷面：細線
  let clipN = 0;
  O.forEach(o => {
    if (o.k === 'CB') { ctx.save(); clipN++; path(o.p, true); ctx.clip(); return; }   // v5.5：原工具 ctx.clip 區塊
    if (o.k === 'CE') { if (clipN) { ctx.restore(); clipN--; } return; }
    ctx.save(); ctx.setLineDash(o.d && o.d.length ? o.d : []);
    if (o.k === 'L') { path(o.p, false); ctx.strokeStyle = o.c; ctx.lineWidth = lw(o.w); ctx.stroke(); }
    else if (o.k === 'P') { path(o.p, !!o.cl); if (o.f) { ctx.fillStyle = o.f; ctx.fill(); } if (o.c) { ctx.strokeStyle = o.c; ctx.lineWidth = lw(o.w); ctx.stroke(); } }
    else if (o.k === 'C') { if (!opt.lite) { const s = map(o.x, o.y); ctx.beginPath(); ctx.arc(s[0], s[1], Math.max(1, o.r * kpx), 0, Math.PI * 2); if (o.f) { ctx.fillStyle = o.f; ctx.fill(); } ctx.strokeStyle = o.c; ctx.lineWidth = 0.8; ctx.stroke(); } }
    else if (o.k === 'T') { const px = o.h * kpx; if (!opt.lite && px >= 6) { const s = map(o.x, o.y); ctx.translate(s[0], s[1]); if (o.rot) ctx.rotate(-o.rot); ctx.font = `600 ${px}px "Noto Sans TC",sans-serif`; ctx.fillStyle = o.c; ctx.textAlign = o.al; ctx.textBaseline = o.bl; ctx.fillText(dzStripNo(dzStripNo(o.s)), 0, 0); } }
    else if (o.k === 'H' || o.k === 'E') {
      if (opt.lite) { path(o.outer, true); ctx.fillStyle = 'rgba(148,163,184,0.10)'; ctx.fill(); }
      else { path(o.outer, true); ctx.clip(); ctx.strokeStyle = o.c; ctx.lineWidth = 0.45; ctx.beginPath(); tcoHatchSegs(Object.assign({}, o, { outer: o.outer.map(p => p), holes: [] })).forEach(sg => { const a = map(sg[0][0], sg[0][1]), b = map(sg[1][0], sg[1][1]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }); ctx.stroke(); }
    }
    else if (o.k === 'G') {
      ctx.beginPath(); [o.outer].concat(o.holes || []).forEach(pg => { pg.forEach((p, i) => { const s = map(p[0], p[1]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.closePath(); });
      if (opt.lite) { ctx.fillStyle = 'rgba(217,70,239,0.16)'; ctx.fill('evenodd'); }
      else { ctx.clip('evenodd'); ctx.fillStyle = 'rgba(217,70,239,0.05)'; ctx.fill('evenodd'); ctx.strokeStyle = o.c; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.8; ctx.beginPath(); const T = o.tile, xs = o.outer.map(p => p[0]), ys = o.outer.map(p => p[1]);
        for (let tx = Math.floor(Math.min(...xs) / T) * T; tx < Math.max(...xs); tx += T) for (let ty = Math.floor(Math.min(...ys) / T) * T; ty < Math.max(...ys); ty += T) (o.segs || TCO_GRAVEL_TILE_SEGS).forEach(sg => { const a = map(tx + sg[0][0] * T, ty + sg[0][1] * T), b = map(tx + sg[1][0] * T, ty + sg[1][1] * T); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); });
        ctx.stroke(); }
    }
    ctx.restore();
  });
  while (clipN-- > 0) ctx.restore();
}
function tcoDxf(D, O, map, sc, lyPre) {   // DXF：map(x,y)→[X,Y]（圖面座標）；sc＝原圖單位→圖面單位
  const ly = c => (lyPre || 'REV_') + (TCO_LY[tcoAci(c)] || 'LINE');
  tcoFlat(O).forEach(o => {
    if (o.k === 'L') D.poly(o.p.map(p => map(p[0], p[1])), ly(o.c), tcoAci(o.c), 0, false, o.d && o.d.length ? 'DASHED' : undefined);
    else if (o.k === 'P') { if (o.c) D.poly(o.p.map(p => map(p[0], p[1])), ly(o.c), tcoAci(o.c), 0, !!o.cl, o.d && o.d.length ? 'DASHED' : undefined); }
    else if (o.k === 'C') { const s = map(o.x, o.y); D.circle(s[0], s[1], Math.max(0.01, o.r * sc), ly(o.c), tcoAci(o.c)); }
    else if (o.k === 'T') { const s = map(o.x, o.y); D.text(s[0], s[1], o.h * sc, dzStripNo(o.s), (lyPre || 'REV_') + 'TEXT', tcoAci(o.c), { align: o.al === 'left' ? 'l' : (o.al === 'right' ? 'r' : 'c'), valign: o.bl === 'top' ? 't' : (o.bl === 'middle' ? 'm' : 'b'), rot: (o.rot || 0) * 180 / Math.PI }); }
    else if (o.k === 'G' || o.k === 'H' || o.k === 'E') tcoHatchSegs(o).forEach(s => { const a = map(s[0][0], s[0][1]), b = map(s[1][0], s[1][1]); D.line(a[0], a[1], 0, b[0], b[1], 0, (lyPre || 'REV_') + 'HATCH', tcoAci(o.c)); });
  });
}
function tcoSecPrims(TY, R) {   // 某斷面的原圖細部（原圖座標）：濾層＋塊石間卵礫石晶格（扣塊石）、分層塊石、基礎／止滑榫／PC／鋼筋
  if (TY.orig.sec) { const m = TY.orig.model(R); return { m, O: TY.orig.sec(m) }; }   // v5.5：原工具斷面區（A 區結構部分）直接沿用
  const m = TY.orig.model(R), O = []; const reg = TY.orig.region(m);
  O.push({ k: 'G', outer: reg.outer, holes: m.boulders.map(b => b.poly), tile: 52, c: '#d946ef' }, { k: 'P', p: reg.outer, c: '#c084fc', w: 0.9, f: null, cl: true, d: [] });
  return { m, O: O.concat(TY.orig.prims(m, {}, 'sec')) };
}

/* v5.8 收頭封牆畫在橫斷面：只在封牆所在樁號（護岸起迄端、接壩／接牆端）的斷面，實線外框＋標註 */
function rvCapSec(sec, sd) {
  const g = rvGeomSec(sec, sd); if (!g || !rvVis(g.R.rv)) return null; const rv = g.R.rv;
  if (!rvWings(rv).some(w => Math.abs(w.s - sec.sta) < 0.03)) return null;
  const C = rvCapGeo(g.R, rv.p); if (!C) return null;
  return { g, pts: C.pts.map(q => [q[0], q[1] + g.zc]), T: Math.max(0.05, +rv.p.ct || 0.3), Lx: C.Lx, aE: C.aMax, zT: C.zT + g.zc };
}
(function () {
  const _d = rvDrawCross;
  rvDrawCross = function (sec, sx, sy, isLarge) {
    _d(sec, sx, sy, isLarge); if (!sec.bkInfo) return;
    ['L', 'R'].forEach(sd => {
      const K = rvCapSec(sec, sd); if (!K) return; const sg = K.g.sg, X = a => sx(sg * a), Y = z => sy(z);
      ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = '#ffb020'; ctx.lineWidth = isLarge ? 1.6 : 1.1; ctx.beginPath();
      K.pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.closePath(); ctx.stroke();
      if (isLarge) { ctx.fillStyle = '#ffb020'; ctx.font = '11px "Noto Sans TC","JetBrains Mono"'; ctx.textAlign = sg < 0 ? 'right' : 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(`封牆 T=${rvF(K.T * 100, 0)}cm（延伸 ${rvF(K.Lx)} m）`, X(K.aE), Y(K.zT) - 4); }
      ctx.restore();
    });
  };
  const _x = rvDxfCross;
  rvDxfCross = function (D, sec, sx, sy, TH) {
    _x(D, sec, sx, sy, TH); if (!sec.bkInfo) return;
    ['L', 'R'].forEach(sd => {
      const K = rvCapSec(sec, sd); if (!K) return; const sg = K.g.sg, X = a => sx(sg * a), Y = z => sy(z);
      D.poly(K.pts.map(p => [X(p[0]), Y(p[1])]), 'REV_CAP', 30, 0, true);
      D.text(X(K.aE), Y(K.zT) + TH * 0.5, TH * 0.8, `封牆 T=${rvF(K.T * 100, 0)}cm（延伸 ${rvF(K.Lx)} m）`, 'REV_CAP', 30, { align: sg < 0 ? 'r' : 'l', valign: 'b' });
    });
  };
})();

/* ---- v6.3 橫斷面拖曳護岸左右移動：拖動護岸牆腳（青色菱形），放開後於此樁號建立／更新控制點（起迄樁號則改 e 起／e 迄），前後以自然曲線連接 ---- */
let RV_XH = [], RV_XD = null;
function rvXSet(h, e) {
  const rv = h.rv, s = h.sec.sta, L = rvLim(rv), de = rvWiden(rv, s); e = Math.max(0.1, +(e - de).toFixed(3));
  if (Math.abs(s - L.a) < 0.05) rv.e0 = e; else if (Math.abs(s - L.b) < 0.05) rv.e1 = e;
  else { rv.cps = rv.cps || []; const c = rv.cps.find(q => Math.abs(q.s - s) < 0.05); if (c) c.e = e; else { rv.cps.push({ s: +s.toFixed(3), e }); rv.cps.sort((a, b) => a.s - b.s); } }
  RV_SIG = '';
}
(function () {
  const _d = rvDrawCross;
  rvDrawCross = function (sec, sx, sy, isLarge) {
    _d(sec, sx, sy, isLarge); if (!isLarge || state.viewMode !== 'CROSS') return;
    try {
      RV_XH = [];
      ['L', 'R'].forEach(sd => {
        const G = rvGeomSec(sec, sd); if (!G || !rvVis(G.R.rv)) return; const e = RV_XD && RV_XD.h.sd === sd && RV_XD.h.sec === sec ? RV_XD.e : G.R.e, o = G.sg * e, x = sx(o), y = sy(G.zc);
        RV_XH.push({ sd, rv: G.R.rv, sec, x, y, k0: sx(0), k1: (sx(1) - sx(0)) || 1, sg: G.sg });
        ctx.save(); ctx.fillStyle = '#22d3ee'; ctx.strokeStyle = '#0b1018'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.font = 'bold 10.5px "Noto Sans TC"'; ctx.textAlign = G.sg < 0 ? 'right' : 'left'; ctx.fillStyle = '#22d3ee'; ctx.fillText(`↔ ${rvShort(G.R.rv)} e=${rvF(e)}`, x + (G.sg < 0 ? -10 : 10), y + 16); ctx.restore();
      });
    } catch (err) { }
  };
  const hit = ev => { const cv = document.getElementById('cadCanvas'); if (!cv || state.viewMode !== 'CROSS') return null; const r = cv.getBoundingClientRect(), b = camInv(ev.clientX - r.left, ev.clientY - r.top);
    let best = null, bd = 10; RV_XH.forEach(h => { const d = Math.hypot(b.x - h.x, b.y - h.y); if (d < bd) { bd = d; best = h; } }); return best ? { h: best, b } : null; };
  window.addEventListener('mousedown', ev => {
    if (ev.target.id !== 'cadCanvas' || ev.button !== 0 || state.panMode || ev.altKey) return; const r = hit(ev); if (!r) return;
    pushUndoSnapshot(); RV_XD = { h: r.h, e: r.h.sg * (r.h.x - r.h.k0) / r.h.k1, moved: false }; state.rvSel = state.revs.indexOf(r.h.rv); ev.stopPropagation(); ev.preventDefault();
    updateStatus(`↔ 拖曳「${rvName(r.h.rv)}」：左右移動護岸（此樁號建立控制點，前後自然曲線連接；Shift＝不吸附 0.05 m）。`);
  }, true);
  window.addEventListener('mousemove', ev => {
    const cv = document.getElementById('cadCanvas');
    if (RV_XD) { const r = cv.getBoundingClientRect(), b = camInv(ev.clientX - r.left, ev.clientY - r.top), h = RV_XD.h; let e = h.sg * (b.x - h.k0) / h.k1; if (!ev.shiftKey) e = Math.round(e / 0.05) * 0.05; RV_XD.e = Math.max(0.1, e); RV_XD.moved = true; updateStatus(`↔ ${rvName(h.rv)} ${formatStation(h.sec.sta)}：e＝${rvF(RV_XD.e)} m`); requestRedraw(); return; }
    if (ev.target.id === 'cadCanvas' && state.viewMode === 'CROSS' && !state.panDrag) { const r = hit(ev); if (r) cv.style.cursor = 'ew-resize'; else if (cv.style.cursor === 'ew-resize') cv.style.cursor = ''; }
  });
  window.addEventListener('mouseup', () => {
    if (!RV_XD) return; const D = RV_XD; RV_XD = null; if (!D.moved) return;
    rvXSet(D.h, D.e); rebuildAlignmentAndSections(); updateStatus(`✅ ${rvName(D.h.rv)}：${formatStation(D.h.sec.sta)} 護岸距中心線 e＝${rvF(D.e)} m（已建立控制點，前後自然曲線連接；斷面與數量已重算）。`);
  });
})();
