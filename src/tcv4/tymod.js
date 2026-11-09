
/* ============================================================================
   v4.9 結構物型式註冊（沿岸帶狀：護岸／擋土牆…）
   每個型式只定義：參數表（分組＝導引步驟）、斷面幾何、每公尺數量、標準圖細節、檢核
   位置／起迄／e／加高拉寬／截斷／地形開挖回填／實長／彙總／DXF／xlsx 由共用引擎處理
   座標：a＝距中心線（往岸側為正），z＝高程；牆腳（設計河床處的水側面）在 a＝e
   共用鍵（單位 m）：H 設計河床以上高、n 水側坡 1:n、D 河床以下埋深；其餘型式專屬參數可用 cm
   ============================================================================ */
const TC_CATS = [{ id: 'rev', label: '護岸' }, { id: 'wall', label: '擋土牆' }];
const TC_TYPES = {}, TC_ORDER = [];
function tcReg(def) { TC_TYPES[def.id] = def; TC_ORDER.push(def.id); }
const tcType = id => TC_TYPES[id] || TC_TYPES.grav;
const TC_PEND = [   // 待移植的型式（導引中顯示為「待移植」）
  { cat: 'wall', label: '重力式／半重力式擋土牆', code: '1-03' },
  { cat: 'wall', label: '半重力式擋土牆', code: '0102-1' }];
/* 共用引擎參數（所有型式都有）：背填、開挖坡、伸縮縫、銜接、翼牆、標準圖示意地形 */
const TC_COMMON = [
  ['ec', '開挖坡 1:n', 0.05, '開挖邊坡：垂直 1、水平 n', 'exc'],
  ['sdx', '預留沉陷 橫向', 0.05, '牆頂背角往岸側的橫向距離（背填頂斜線）', 'exc'],
  ['sdz', '預留沉陷 垂直', 0.05, '牆頂背角上方的預留高度（負值＝向下）', 'exc'],
  ['g', '背填面坡度(往背後下降)', 0.01, '預留沉陷斜線後，背填面往背後下降的坡度（垂直/水平；0＝水平），遇地形線或開挖邊坡即止', 'exc'],
  ['jsp', '伸縮縫間距 (m)', 1, '每段護岸沿實長每隔此距離一處伸縮縫', 'join'],
  ['ldp', '跨落差頂線漸變長 (m)', 0.5, '護岸連續通過落差處（固床工等）時，低側護岸頂由高側頂高以直線漸變回原高度的長度；0＝不漸變（頂線隨河床跳階）', 'join'],
  ['sgH', '示意地形：背後地面高 (m，相對設計河床)', 0.1, '只用於標準圖與標準圖數量；空白預設＝0.7H', 'std'],
  ['sgS', '示意地形：背後地面坡度 (往岸側上升)', 0.05, '只用於標準圖；0＝水平', 'std']];
const TC_COMMON_DEF = { ec: 0.3, sdx: 0.3, sdz: 0.3, g: 0.05, jsp: 10, lt: 5, ldp: 5, cw: 4, ct: 0.3, crb: 13, crs: 0.3, sgH: null, sgS: 0 };   // cw＝收頭封牆延伸長，ct＝封牆厚 (m)，crb＝鋼筋號數，crs＝間距 (m)
const TC_SHARED = ['H', 'n', 'D', 'ec', 'sdx', 'sdz', 'g', 'jsp', 'lt', 'ldp', 'cw', 'ct', 'crb', 'crs', 'sgH', 'sgS'];   // 切換型式時沿用
const CNS560 = { D10: 0.560, D13: 0.995, D16: 1.560, D19: 2.250, D22: 3.040, D25: 3.980, D29: 5.040, D32: 6.390 };
const tcR2 = v => Math.round(v * 100) / 100;

function tcDefaults(id, H) {   // 型式預設參數（含共用）
  const T = tcType(id), p = Object.assign({}, TC_COMMON_DEF), qH = T.params.find(q => q.k === 'H'), H0 = H > 0 ? H : (qH ? qH.def : 3);
  T.params.forEach(q => { p[q.k] = typeof q.def === 'function' ? q.def(H0) : q.def; }); p.H = H0;
  Object.assign(p, T.commonDef || {});
  if (T.sync) T.sync(p);   // v5.5 層數型式：H、D、n 由原工具參數算出
  return p;
}
function tcPolyArea(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
function tcVertCover(polys, a, z0, z1) {   // 垂直線 x＝a 在 [z0,z1] 內落在多邊形中的長度
  let tot = 0;
  (polys || []).forEach(pg => {
    const P = pg.pts, zs = [];
    for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; if ((p[0] <= a && q[0] > a) || (q[0] <= a && p[0] > a)) zs.push(p[1] + (a - p[0]) / (q[0] - p[0]) * (q[1] - p[1])); }
    zs.sort((x, y) => x - y); for (let k = 0; k + 1 < zs.length; k += 2) tot += Math.max(0, Math.min(z1, zs[k + 1]) - Math.max(z0, zs[k]));
  });
  return tot;
}
function tcFaceZ(face, a) {   // 設計面（牆腳→牆頂→背）在 a 處高程
  for (let i = 0; i + 1 < face.length; i++) { const p = face[i], q = face[i + 1]; if (a <= q[0] + 1e-9) return q[0] - p[0] > 1e-9 ? p[1] + (a - p[0]) / (q[0] - p[0]) * (q[1] - p[1]) : q[1]; }
  return face[face.length - 1][1];
}

/* ===================== 型式 1：重力式混凝土護岸（AutoCAD 範本） ===================== */
tcReg({
  id: 'grav', cat: 'rev', label: '重力式混凝土護岸', code: '範本', note: '背側直立、水側 1:n、矩形根入基礎', prim: 'conc',
  groups: [{ k: 'main', t: '主體尺寸' }, { k: 'found', t: '基礎與開挖' }, { k: 'pipe', t: '排水管' }],
  params: [
    { k: 'H', nm: '牆高 H (設計河床以上)', u: 'm', st: 0.1, def: 3, g: 'main', tip: '設計河床高以上的牆高；岸頂＝設計河床高＋H（＋加高）' },
    { k: 'b', nm: '頂寬 b', u: 'm', st: 0.05, def: H => tcR2(0.15 * H), g: 'main', tip: '牆頂寬度（背側直立）' },
    { k: 'n', nm: '水側坡 1:n', u: '', st: 0.05, def: 0.3, g: 'main', tip: '水側斜面：垂直 1、水平 n；牆底寬＝b＋n×H' },
    { k: 'D', nm: '根入深 D (河床以下)', u: 'm', st: 0.1, def: H => tcR2(0.6 * H), g: 'found', tip: '矩形根入基礎深度；基礎寬＝牆底寬' },
    { k: 'ww', nm: '開挖工作寬', u: 'm', st: 0.05, def: H => tcR2(0.15 * H), g: 'found', tip: '基礎前後各外放的開挖底寬' },
    { k: 'pon', nm: '設置排水管', u: 'chk', def: 1, g: 'pipe' },
    { k: 'pdia', nm: '管徑 (m)', u: 'm', st: 0.005, def: 0.075, g: 'pipe' },
    { k: 'psp', nm: '間距 (m)', u: 'm', st: 0.5, def: 2, g: 'pipe' },
    { k: 'pz', nm: '離河床高 (m)', u: 'm', st: 0.1, def: H => tcR2(0.44 * H), g: 'pipe' },
    { k: 'psl', nm: '向水側下坡 (垂直/水平)', u: '', st: 0.01, def: 0.21, g: 'pipe' }],
  items: [{ k: 'conc', it: '混凝土 (210 kgf/cm²)', u: 'm³', fx: () => '平均斷面法 Σ(A1+A2)/2×L護岸實長；A＝H(2b+n·H)/2＋(n·H+b)×D' }, { k: 'form', it: '模板', u: 'm²', fx: () => '水側斜面＋基礎前面＋背面（頂面不計）' }],
  geo(R, zc) {
    const e = R.e, H = R.H, run = Math.max(R.n * H, 0.001), a0 = e + run, a0b = a0 + R.b, zTop = zc + H, zf = zc - R.D;
    const G = { face: [[e, zc], [a0, zTop], [a0b, zTop]], a0, a0b, zTop, zf, aF0: e - R.ww, aB0: a0b + R.ww, th: R.b, run,
      polys: [{ m: 'conc', pts: [[e, zc], [a0, zTop], [a0b, zTop], [a0b, zf], [e, zf]] }], form: Math.hypot(run, H) + R.D + (H + R.D), pipe: null };
    if (R.pon) {   // 排水管：自背面起，往水側以 psl 下降，於水側斜面穿出
      const zb = zc + R.pz, den = 1 - R.n * R.psl, t = (a0b - e - R.n * R.pz) / (den || 1);
      if (t > 0) { const w = Math.max(R.pdia, 0.035 * H); G.pipe = { a0: a0b, z0: zb, a1: a0b - t, z1: zb - R.psl * t, w, len: Math.hypot(t, R.psl * t), sp: R.psp, dia: R.pdia }; }
    }
    return G;
  },
  qty(G) { return { conc: tcPolyArea(G.polys[0].pts), form: G.form }; },
  template: true,
  stdDims(K) {   // 尺寸標註（K：dm 標註函式、X 鏡射、G、R、zc、T 文字）
    const { dm, X, G, R, zc, T, sg } = K;
    dm(X(G.a0), G.zTop + 0.8, X(G.a0b), G.zTop + 0.8, `b=${rvF(R.b)}`);
    dm(X(G.a0b + 1.2), zc, X(G.a0b + 1.2), G.zTop, `H=${rvF(R.H)}`, { dx: 0.25 });
    dm(X(G.a0b + 1.2), G.zf, X(G.a0b + 1.2), zc, `D=${rvF(R.D)}`, { dx: 0.25 });
    dm(X(R.e), G.zf - 1.0, X(G.a0b), G.zf - 1.0, `${rvF(G.a0b - R.e)}`);
    if (sg > 0) T(X((R.e + G.a0) / 2) - 0.1, (zc + G.zTop) / 2, 0.255, `1:${rvF(R.n)}`, '#7dd3fc', 4, 'STD_DIM', { al: 'r', va: 'm' });
  },
  dims(G, R, zc) { return { H: [[G.a0b + 0.6, zc], [G.a0b + 0.6, G.zTop]], b: [[G.a0, G.zTop + 0.4], [G.a0b, G.zTop + 0.4]], n: [[R.e, zc], [G.a0, G.zTop]], D: [[G.a0b + 0.6, G.zf], [G.a0b + 0.6, zc]], ww: [[G.aF0, G.zf - 0.3], [R.e, G.zf - 0.3]], pz: G.pipe ? [[G.pipe.a0, zc], [G.pipe.a0, G.pipe.z0]] : null }; },
  checks(R) { return [{ ok: R.b >= 0.3, text: `頂寬 b=${rvF(R.b)} m ${R.b >= 0.3 ? '≥ 0.30 m' : '< 0.30 m（偏薄）'}` }, { ok: R.D >= 0.5, text: `根入深 D=${rvF(R.D)} m ${R.D >= 0.5 ? '' : '（偏淺）'}` }]; }
});

/* ===================== 型式 2：水保標準圖 0402-1 乾砌石護岸（依使用者 v2 工具移植） ===================== */
const TC_BOULDER = [
  [[-0.3409, 0.3511], [-0.4368, 0.2424], [-0.5, -0.1523], [-0.3182, -0.423], [-0.0954, -0.4819], [0.0588, -0.4535], [0.2924, -0.3712], [0.5, -0.0928], [0.4847, 0.1618], [0.3543, 0.4408], [-0.0156, 0.5], [-0.2804, 0.413]],
  [[0.0729, 0.5], [-0.1243, 0.4914], [-0.3563, 0.3802], [-0.5, 0.2007], [-0.4648, -0.2647], [-0.2584, -0.467], [-0.0649, -0.5], [0.1972, -0.4659], [0.4028, -0.3578], [0.5, -0.1973], [0.4227, 0.2063], [0.2395, 0.4494], [0.0688, 0.4439], [-0.0496, 0.3627]],
  [[-0.0882, 0.4488], [-0.4292, 0.2528], [-0.5, 0.0585], [-0.4317, -0.1846], [-0.1235, -0.5], [0.239, -0.4979], [0.5, -0.2547], [0.4126, 0.2974], [0.1112, 0.5], [-0.1591, 0.4252]],
  [[-0.145, 0.4664], [-0.3822, 0.3886], [-0.5, 0.1072], [-0.4573, -0.1897], [-0.3037, -0.4234], [-0.0369, -0.5], [0.2738, -0.4366], [0.4398, -0.2927], [0.5, -0.167], [0.4998, 0.1173], [0.3396, 0.4416], [0.0872, 0.5], [-0.1277, 0.4449]],
  [[-0.1494, 0.5], [-0.2784, 0.4508], [-0.5, 0.205], [-0.4981, -0.1753], [-0.2535, -0.4918], [0.1095, -0.5], [0.4765, -0.2116], [0.5, 0.2054], [0.3249, 0.435], [0.0308, 0.4945], [-0.1144, 0.4622]],
  [[-0.145, 0.5], [-0.2739, 0.4509], [-0.5, 0.2069], [-0.5, -0.1732], [-0.2575, -0.4892], [0.1045, -0.5], [0.4728, -0.2139], [0.5, 0.2028], [0.3266, 0.4328], [0.0332, 0.494], [-0.1016, 0.4667]],
  [[-0.1518, 0.5], [-0.2817, 0.4384], [-0.5, 0.1636], [-0.4783, -0.2201], [-0.1971, -0.4978], [0.1675, -0.5], [0.5, -0.1835], [0.4601, 0.2286], [0.271, 0.4417], [-0.0297, 0.4932], [-0.1642, 0.4535]],
  [[-0.1489, 0.5], [-0.2789, 0.4488], [-0.5, 0.2016], [-0.4987, -0.1783], [-0.2546, -0.4935], [0.1072, -0.5], [0.4733, -0.2102], [0.5, 0.2063], [0.3263, 0.4356], [0.033, 0.4961], [-0.1194, 0.4631]]];
function tcDryModel(R) {   // 0402-1 原工具 computeModel 的幾何／數量部分（單位 cm；H、D 由 m 轉 cm）
  const H1 = R.H * 100, Df = R.D * 100, n = Math.max(0.1, R.n), NL = Math.max(3, Math.min(20, Math.round(R.NL))), Lt = Math.max(30, R.Ltop), Lb = Math.max(35, R.Lbot);
  const tgt = Math.max(0, R.tgt), tgb = Math.max(0, R.tgb), wef = Math.max(0, R.wef), wtf = Math.max(20, R.wtf);
  const H2 = Math.max(0, R.H2), Btoe = H2 > 0 ? Math.max(0, R.Btoe) : 0, Bheel = H2 > 0 ? Math.max(0, R.Bheel) : 0, R1 = Math.max(0, R.R1), P1 = Math.max(15, R.P1), tpc = Math.max(0, R.tpc), wpc = tpc > 0 ? Math.max(0, R.wpc) : 0;
  const Ht = H1 + Df, sf = Math.sqrt(1 + n * n), Ls = Ht * sf, Wb = Ht * n, B1 = Lt * sf, B2 = Lb * sf, hl = Ht / NL, ds = Ls / NL;
  const xbb = tgb, xbf = tgb + B2, xtf = xbf - Wb, xtb = xtf - B1, xgt = xtb - tgt;
  const xL = H2 > 0 ? -Bheel : 0, xR = H2 > 0 ? (xbf + Btoe) : (xbf + wef), B3 = xR - xL;
  const ksw = R1 / 3, ktw = R1 > 0 ? (P1 + 2 * ksw) : 0; let Xk = R.Xkey; if (R1 > 0) Xk = Math.max(0, Math.min(Xk, Math.max(0, B3 - ktw)));
  const ktr = xR - Xk, ktl = ktr - ktw, kbr = ktr - ksw, kbl = ktl + ksw;
  const xebl = xL, xebr = H2 > 0 ? Math.max(xR, xbf + wef) : (xbf + wef), yeb = -H2 - tpc, Bpc = tpc > 0 ? (B3 + 2 * wpc) : 0;
  let maxR5 = 0, minLS = 999, maxLS = 0;
  for (let i = 0; i < NL; i++) { const fr = NL > 1 ? i / (NL - 1) : 0, Li = Lb - fr * (Lb - Lt), Ha = Ht - i * hl; maxR5 = Math.max(maxR5, Ha / Li); const ls = Li / ds; minLS = Math.min(minLS, ls); maxLS = Math.max(maxLS, ls); }
  // 每公尺數量（m³/m、m²/m、kg/m）
  const Htm = Ht / 100, stone = ((B1 + B2) / 200) * Htm, gravel = ((tgt + tgb) / 200) * Htm, face = Ls / 100, veg = wtf / 100;
  const conc = (B3 / 100) * (H2 / 100) + (R1 > 0 ? ((P1 + ktw) / 200) * (R1 / 100) : 0), pc = tpc > 0 ? ((Bpc - ktw) / 100) * (tpc / 100) : 0;
  let rebar = 0, nMain = 0, nSub = 0; const Lu = Math.max(100, (R.jsp || 10) * 100), Lm = Lu / 100;
  if (H2 > 0) {
    const cb = 7.5, ls = (2 * ((B3 - 2 * cb) + Math.max(10, H2 - 2 * cb)) + 20) / 100, lk = R1 > 0 ? (P1 + 2 * R1 * Math.sqrt(1 + 1 / 9) + 60) / 100 : 0;
    nMain = Math.floor(Lu / Math.max(10, R.Srb)) + 1; const wm = nMain * (ls + lk) * (CNS560[R.rbm] || 1.56);
    nSub = Math.max(4, Math.floor((B3 - 2 * cb) / Math.max(10, R.Srb)) + 1) * 2 + (R1 > 0 ? 4 : 0); const ws = nSub * Lm * (CNS560[R.rbs] || 0.995);
    rebar = (wm + ws) / Lm;
  }
  return { H1, Df, Ht, n, NL, Lt, Lb, sf, Ls, Wb, B1, B2, hl, ds, xbb, xbf, xtf, xtb, xgt, xL, xR, B3, H2, R1, P1, ksw, ktw, ktr, ktl, kbr, kbl, tpc, wpc, Bpc, xebl, xebr, yeb, tgt, tgb, wef, wtf, maxR5, minLS, maxLS, nMain, nSub,
    q: { stone, gravel, face, veg, conc, pc, rebar } };
}
tcReg({
  id: 'dry0402', cat: 'rev', label: '乾砌石護岸', code: '0402-1', note: '水保標準圖 0402-1（乾砌大塊石＋背填卵礫石；選配混凝土基礎、止滑榫、PC）', prim: 'stone',
  groups: [{ k: 'main', t: '主體與塊石' }, { k: 'grav', t: '背填濾層與開挖' }, { k: 'base', t: '底部混凝土基礎、止滑榫與配筋' }],
  commonDef: { ec: 0.45, jsp: 10 },
  params: [
    { k: 'H', nm: '地面以上有效高度 H1', u: 'm', st: 0.1, def: 2.2, g: 'main', tip: '設計河床以上高度（原圖 220 cm）' },
    { k: 'D', nm: '溪床以下基礎埋深 Df', u: 'm', st: 0.1, def: 1.3, g: 'main', tip: '原圖 130 cm；規範 ≥ 1.3 m' },
    { k: 'n', nm: '臨水面坡度 1:n', u: '', st: 0.05, def: 0.45, g: 'main' },
    { k: 'NL', nm: '乾砌大塊石疊砌層數 N', u: '層', st: 1, def: 8, g: 'main' },
    { k: 'Ltop', nm: '頂層塊石長徑 L_top', u: 'cm', st: 5, def: 55, g: 'main', tip: '岸頂厚' },
    { k: 'Lbot', nm: '底層塊石長徑 L_bot', u: 'cm', st: 5, def: 80, g: 'main', tip: '基腳厚' },
    { k: 'Rb', nm: '大塊石佔比', u: '%', st: 1, def: 85, g: 'main' },
    { k: 'tgt', nm: '坡頂背填卵礫石水平寬', u: 'cm', st: 5, def: 30, g: 'grav' },
    { k: 'tgb', nm: '基底背填卵礫石水平寬', u: 'cm', st: 5, def: 30, g: 'grav' },
    { k: 'wef', nm: '前趾開挖底面餘寬', u: 'cm', st: 5, def: 30, g: 'grav' },
    { k: 'wtf', nm: '坡頂回填植生區頂寬', u: 'cm', st: 5, def: 125, g: 'grav' },
    { k: 'htf', nm: '坡頂回填高（三角形）', u: 'cm', st: 5, def: 35, g: 'grav', tip: '原圖值 35 cm；坡頂回填斷面＝頂寬×高×½' },
    { k: 'H2', nm: '混凝土基礎底板厚 H2', u: 'cm', st: 5, def: 0, g: 'base', tip: '0＝純乾砌石基腳' },
    { k: 'Btoe', nm: '基礎前趾外推寬', u: 'cm', st: 5, def: 20, g: 'base' },
    { k: 'Bheel', nm: '基礎後踵外推寬', u: 'cm', st: 5, def: 20, g: 'base' },
    { k: 'Xkey', nm: '止滑榫距前緣 X_key', u: 'cm', st: 5, def: 30, g: 'base' },
    { k: 'R1', nm: '梯形止滑榫深 R1 (1:3)', u: 'cm', st: 5, def: 0, g: 'base' },
    { k: 'P1', nm: '梯形止滑榫底寬 P1', u: 'cm', st: 5, def: 30, g: 'base' },
    { k: 'tpc', nm: 'PC 打底厚', u: 'cm', st: 5, def: 0, g: 'base' },
    { k: 'wpc', nm: 'PC 打底左右外推寬', u: 'cm', st: 5, def: 10, g: 'base' },
    { k: 'rbm', nm: '主筋 (CNS 560)', u: 'sel', def: 'D16', opt: Object.keys(CNS560), g: 'base' },
    { k: 'rbs', nm: '副筋 (CNS 560)', u: 'sel', def: 'D13', opt: Object.keys(CNS560), g: 'base' },
    { k: 'Srb', nm: '鋼筋間距', u: 'cm', st: 5, def: 20, g: 'base' }],
  items: [
    { k: 'stone', it: '乾砌∮41~80cm大塊石', u: 'm³', fx: R => `((B1+B2)/2)×(H1+Df)；大塊石佔 ${R.Rb}%` },
    { k: 'gravel', it: '背填卵礫石或級配濾層', u: 'm³', fx: R => `((頂寬 ${R.tgt}+底寬 ${R.tgb} cm)/2)×(H1+Df)` },
    { k: 'face', it: '乾砌石臨水面整平及填縫', u: 'm²', fx: () => '斜面長 (H1+Df)×√(1+n²)' },
    { k: 'veg', it: '坡頂植生綠化及石縫扦插活枝條', u: 'm²', fx: R => `坡頂回填寬 ${R.wtf} cm` },
    { k: 'conc', it: '底部基礎與止滑榫混凝土', u: 'm³', fx: () => 'B3×H2＋止滑榫梯形', opt: true },
    { k: 'pc', it: 'PC 打底混凝土', u: 'm³', fx: () => '(B_pc−止滑榫上口寬)×t_pc', opt: true },
    { k: 'rebar', it: '基礎與止滑榫竹節鋼筋', u: 'kg', fx: R => `主筋 ${R.rbm}／副筋 ${R.rbs} @${R.Srb} cm（每 ${rvF(R.jsp, 1)} m 分段計）`, opt: true }],
  geo(R, zc) {
    const m = tcDryModel(R), xtoe = m.xbf - (m.Df / m.Ht) * m.Wb, A = x => R.e + (xtoe - x) / 100, Z = y => zc + (y - m.Df) / 100, P = pts => pts.map(([x, y]) => [A(x), Z(y)]);
    const polys = [{ m: 'stone', pts: P([[m.xbb, 0], [m.xbf, 0], [m.xtf, m.Ht], [m.xtb, m.Ht]]) }];
    if (m.tgt + m.tgb > 1e-6) polys.push({ m: 'gravel', pts: P([[0, 0], [m.xbb, 0], [m.xtb, m.Ht], [m.xgt, m.Ht]]) });
    if (m.H2 > 0) polys.push({ m: 'conc', pts: P([[m.xL, -m.H2], [m.xR, -m.H2], [m.xR, 0], [m.xL, 0]]) });
    if (m.R1 > 0) polys.push({ m: 'conc', pts: P([[m.ktl, -m.H2], [m.ktr, -m.H2], [m.kbr, -m.H2 - m.R1], [m.kbl, -m.H2 - m.R1]]) });
    if (m.tpc > 0) { const y0 = -m.H2 - m.tpc, y1 = -m.H2, x0 = m.xL - m.wpc, x1 = m.xR + m.wpc; if (m.R1 > 0) { polys.push({ m: 'pc', pts: P([[x0, y0], [m.ktl, y0], [m.ktl, y1], [x0, y1]]) }, { m: 'pc', pts: P([[m.ktr, y0], [x1, y0], [x1, y1], [m.ktr, y1]]) }); } else polys.push({ m: 'pc', pts: P([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) }); }
    const a0 = A(m.xtf), zTop = Z(m.Ht), a0b = A(m.xgt);
    return { face: [[R.e, zc], [a0, zTop], [A(m.xtb), zTop], [a0b, zTop]], a0, a0b, zTop, zf: Z(m.yeb), aF0: A(m.xebr), aB0: A(m.xebl), th: m.B1 / 100, polys, form: 0, pipe: null, M: m, A, Z };
  },
  orig: {   // 原圖移植（ormod.js 自使用者原工具 0402-1 v2 抽出）：標準圖＝原工具三視圖＋數量表；各樁號橫斷面＝原圖塊石／卵礫石晶格／基礎配筋
    model: R => tcoDry402Model(R), prims: (m, o, part) => tcoDry402Prims(m, o, part),
    region: m => ({ outer: [[0, 0], [m.x_stone_bot_front, 0], [m.x_stone_top_front, m.H_total], [m.x_grav_top_left, m.H_total]] }) },
  qty(G) { return Object.assign({}, G.M.q); },
  stdDetail(K) {   // 標準圖細節：分層大塊石、卵礫石填充
    const { L, X, G } = K, m = G.M, A = G.A, Z = G.Z;
    for (let i = 0; i < m.NL; i++) {
      const fr = m.NL > 1 ? i / (m.NL - 1) : 0, Li = m.Lb - fr * (m.Lb - m.Lt), ym = (i + 0.5) * m.hl, xf = m.xbf - (ym / m.Ht) * m.Wb;
      const Nx = 1 / m.sf, Ny = m.n / m.sf, Tx = -m.n / m.sf, Ty = 1 / m.sf, xc = xf - 0.5 * Li * Nx, yc = ym - 0.5 * Li * Ny + 0.12 * m.hl, du = Li * 1.02, dv = m.ds * 1.04;
      L(TC_BOULDER[i % TC_BOULDER.length].map(([u, v]) => [X(A(xc + u * du * Nx + v * dv * Tx)), Z(yc + u * du * Ny + v * dv * Ty)]), '#e2e8f0', 7, 'STD_STONE', { cl: true, w: 0.8 });
    }
    const gp = G.polys.find(q => q.m === 'gravel'); if (gp) {   // 卵礫石：以小圓點填充
      const xs = gp.pts.map(p => p[0]), zs = gp.pts.map(p => p[1]), inP = (x, z) => { let c = false; const P = gp.pts; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if (((P[i][1] > z) !== (P[j][1] > z)) && (x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c; } return c; };
      let k = 0; for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.09) for (let z = Math.min(...zs); z <= Math.max(...zs); z += 0.09) { k++; const jx = x + (Math.sin(k * 12.9898) * 43758.5453 % 1) * 0.03, jz = z + (Math.sin(k * 78.233) * 12543.1 % 1) * 0.03, r = 0.018 + Math.abs(Math.sin(k * 3.1)) * 0.012; if (!inP(jx, jz)) continue; const c = []; for (let t = 0; t < 8; t++) c.push([X(jx + r * Math.cos(t * Math.PI / 4)), jz + r * Math.sin(t * Math.PI / 4)]); L(c, '#d946ef', 6, 'STD_GRAVEL', { cl: true, w: 0.5 }); }
    }
  },
  stdDims(K) {
    const { dm, X, G, R, zc, T, sg } = K, m = G.M;
    dm(X(G.a0b + 1.0), zc, X(G.a0b + 1.0), G.zTop, `H1=${rvF(R.H * 100, 0)}`, { dx: 0.25 });
    dm(X(G.a0b + 1.0), zc - R.D, X(G.a0b + 1.0), zc, `Df=${rvF(R.D * 100, 0)}`, { dx: 0.25 });
    dm(X(G.a0), G.zTop + 0.6, X(G.A(m.xtb)), G.zTop + 0.6, `B1=${rvF(m.B1, 1)}`);
    dm(X(G.A(m.xbf)), zc - R.D - 0.6, X(G.A(m.xbb)), zc - R.D - 0.6, `B2=${rvF(m.B2, 1)}`);
    if (m.tgt > 0) dm(X(G.A(m.xtb)), G.zTop + 1.2, X(G.a0b), G.zTop + 1.2, `${rvF(m.tgt, 0)}`);
    if (sg > 0) T(X((R.e + G.a0) / 2) - 0.1, (zc + G.zTop) / 2, 0.255, `1:${rvF(R.n)}`, '#7dd3fc', 4, 'STD_DIM', { al: 'r', va: 'm' });
    T(X(G.a0b + 2.2), zc - R.D - 1.3, 0.22, '（單位：cm）', '#94a3b8', 8, 'STD_DIM', { al: sg < 0 ? 'r' : 'l', va: 'm' });
  },
  dims(G, R, zc) { const m = G.M; return { H: [[G.a0b + 0.5, zc], [G.a0b + 0.5, G.zTop]], D: [[G.a0b + 0.5, zc - R.D], [G.a0b + 0.5, zc]], n: [[R.e, zc], [G.a0, G.zTop]], Ltop: [[G.a0, G.zTop + 0.3], [G.A(m.xtb), G.zTop + 0.3]], Lbot: [[G.A(m.xbf), zc - R.D - 0.3], [G.A(m.xbb), zc - R.D - 0.3]], tgt: [[G.A(m.xtb), G.zTop + 0.5], [G.a0b, G.zTop + 0.5]], tgb: [[G.A(m.xbb), zc - R.D - 0.5], [G.A(0), zc - R.D - 0.5]], wef: [[G.aF0, G.zf - 0.2], [G.A(m.xbf), G.zf - 0.2]], H2: m.H2 > 0 ? [[G.A(m.xL) + 0.2, zc - R.D], [G.A(m.xL) + 0.2, zc - R.D - m.H2 / 100]] : null }; },
  checks(R) {
    const m = tcDryModel(R);
    return [{ ok: m.H1 <= 400, text: `有效高 H1=${rvF(m.H1, 0)} cm ${m.H1 <= 400 ? '≤ 400 cm' : '> 400 cm（超出規範上限）'}` },
      { ok: m.Df >= 130, text: `基礎埋深 Df=${rvF(m.Df, 0)} cm ${m.Df >= 130 ? '≥ 130 cm' : '< 130 cm（小於規範下限）'}` },
      { ok: m.n >= 0.3, text: `臨水面坡度 1:${rvF(m.n)} ${m.n >= 0.3 ? '緩於 1:0.3' : '陡於 1:0.3（不符）'}` },
      { ok: m.Lb >= m.Lt, text: `塊石長徑由下往上縮減：底 ${m.Lb} → 頂 ${m.Lt} cm` },
      { ok: m.maxR5 <= 5, text: `任一砌石往上高 ≤ 5 倍長徑：最大 ${rvF(m.maxR5)} 倍` },
      { ok: m.minLS >= 1.15 && m.maxLS <= 1.85, text: `長短徑比（1.4～1.7 為佳）：${rvF(m.minLS)}～${rvF(m.maxLS)}` },
      { ok: m.ds >= 41 && m.Lb <= 80, text: `原圖 ∮41～80 cm：短徑 ${rvF(m.ds, 1)}～長徑 ${rvF(m.Lb, 1)} cm` }];
  }
});
