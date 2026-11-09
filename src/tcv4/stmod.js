/* ============================================================================
   標準圖結構物（防砂壩）模組 v4.2
   依舊版 dam1.lsp / 網頁「防砂壩」全參數：w h1 d1 s1 h2 h3 k k1 s2 s3 s4 s5 ＋ 左/右壩翼 r1 rs r2 r3 r4 r5 ＋ 排水孔(整數) ＋ 開挖 kx km
   平面圖 = 結構物平面圖；縱斷面 = 斷面圖(順水流向)；橫斷面 = 立面圖(下游視)
   高程基準：z=0 為溢洪口底；下游河床 = zS−h2；基礎底 = zS−(h2+h3) = 整座壩底部高程 zB（不含 key）；key 底 = zB−k
   ============================================================================ */
state.structs = []; state.structSel = -1; state.stHL = {}; state.stPrio = true;
const ST_CL = 0.10;                                     // 開挖底：基礎底面（key 處為 key 底）再往下 (m)
const ST_P = [   // 共用參數 [鍵, 名稱, 預設, 單位, 最小值(需大於), 整數?]
  ['w', '溢洪口寬 w', 8, 'm', 0], ['h1', '溢洪口高 h1', 3.5, 'm', 0], ['d1', '溢洪口厚度 d1', 2.2, 'm', 0], ['s1', '溢洪口斜率 s1　1:', 0.5, '', -1],
  ['h2', '有效壩高 h2', 6, 'm', 0], ['h3', '壩基礎深 h3', 1.5, 'm', 0], ['hq', '出水高 hq', 1.0, 'm', -1], ['k', 'key 深 k', 1.5, 'm', -1], ['k1', 'key 厚 k1', 1.5, 'm', -1],
  ['s2', '壩體下游斜率 s2　1:', 0.3, '', -1], ['s3', '壩體上游斜率 s3　1:', 0.6, '', -1], ['s4', '壩翼下游斜率 s4　1:', 0.1, '', -1], ['s5', '壩翼上游斜率 s5　1:', 0.1, '', -1],
  ['dh', '排水孔徑 dh', 0.4, 'm', -1], ['nh', '排水孔數（0＝依規範排滿）', 0, '孔', -1, 1], ['hsp', '排水孔間距（2~3）', 2.0, 'm', 0], ['hcl', '頂層距溢洪口底（1.5~2）', 1.5, 'm', -1], ['hb', '底層孔底距溪床', 0, 'm', -1], ['hwx', '排列寬（0＝溢洪口頂寬）', 0, 'm', -1],
  ['kx', '開挖邊坡 kx　1:（垂直1：水平kx）', 0.3, '', 0], ['km', '開挖外放 km（工作面）', 0.1, 'm', -1], ['off', '中心偏移 off（＋右岸，面向下游）', 0, 'm', -1e9], ['wsp', '溢洪口左右分開', 0, '', -1, 1]
];
const ST_W = [   // 壩翼（左/右各自）[鍵, 名稱, 預設, 單位, 最小值]
  ['r1', '壩翼上斜長度 r1', 10, 'm', -1], ['rs', '壩翼斜率 rs　1:', 10, '', 0], ['r2', '壩翼水平長度 r2', 5, 'm', -1],
  ['r3', '壩翼開挖深度 r3', 1.5, 'm', -1], ['r4', '壩翼退階長度 r4', 3, 'm', -1], ['r5', '壩體退階長度 r5', 3, 'm', -1], ['ns', '端面坡 1:ns（固床工梯形，與 r5 連動）', 0, '', -1], ['wh', '溢洪口半寬（自中心線起，頂部）', 4, 'm', 0]
];
const ST_INFO = {}; ST_P.forEach(q => { ST_INFO[q[0]] = { n: q[1].replace(/　.*$/, '').replace(/（.*$/, ''), u: q[3] }; });
ST_W.forEach(q => { ['L', 'R'].forEach(s => { ST_INFO[q[0] + s] = { n: (s === 'L' ? '左' : '右') + q[1].replace(/　.*$/, ''), u: q[3] }; }); });
ST_INFO.zB = { n: '整座壩底部高程 zB', u: 'm' };
const ST_A = [   // 附屬構造 [群組, 鍵, 名稱, 預設(null＝跟隨), 單位, 最小值(需大於), 跟隨說明, 整數?]
  ['apron', 'cL', '長度比 cL（Lp=cL×(h2+hq)；手冊 c≥2）', 2.0, '', 0], ['apron', 'L0', '左側起點溪床半寬', null, 'm', 0, '牆頂內緣=x2+0.5'], ['apron', 'R0', '右側起點溪床半寬', null, 'm', 0, '牆頂內緣=x2+0.5'], ['apron', 'L1', '左側末端溪床半寬', null, 'm', 0, '有尾檻=w/2'], ['apron', 'R1', '右側末端溪床半寬', null, 'm', 0, '有尾檻=w/2'],
  ['apron', 'tp', '底板厚 tp', null, 'm', 0, '依手冊式3-99：H+h<10→0.8、10~15→1.1'], ['apron', 'kd', '截水牆深', null, 'm', -1, '=k'], ['apron', 'kw', '截水牆寬', null, 'm', -1, '=k1'],
  ['tail', 'ht', '頂高（水墊面上）', 1.0, 'm', 0], ['tail', 'hn', '溢流口深', 0.5, 'm', -1], ['tail', 'wn', '溢流口寬', null, 'm', 0, '=w'], ['tail', 'ts', '頂寬', 1.0, 'm', 0], ['tail', 'sd', '下游坡 1:', 0.3, '', -1],
  ['wall', 'tw', '頂寬 tw', 0.4, 'm', 0], ['wall', 'si', '內面坡 1:（外傾）', 0.5, '', -1], ['wall', 'so', '背面坡 1:', 0.3, '', -1], ['wall', 'hE', '末端牆高（底板面上）', null, 'm', 0, '=h1，但不高於 h2（牆頂不往下游升高）'],
  ['wall', 'dh', '洩水孔徑', 0.05, 'm', 0], ['wall', 'da', '每孔面積 m²', 2, 'm²', 0],
  ['sill', 'a', '距護坦末端', null, 'm', -1, '=Lp'], ['sill', 'sp', '間距', null, 'm', 0, '=Lp'], ['sill', 'n', '座數', 1, '座', 0, null, 1],
  ['sub', 'r', '新建時壩高比（×h2）', 0.333, '', 0], ['sub', 'L', '距壩趾（至副壩上游腳）', null, 'm', 0, '=Lp']
];
const ST_AG = { apron: '護坦／水墊底板', tail: '尾檻（勾選＝有尾檻，水墊）', wall: '側牆', sill: '固床工（溪床保護工）', sub: '副壩' }, ST_AON = { apron: true, tail: false, wall: true, sill: false, sub: false };
ST_A.forEach(q => { ST_INFO['a.' + q[0] + '.' + q[1]] = { n: ST_AG[q[0]] + q[2].replace(/（.*$/, ''), u: q[4] }; });
const ST_TYPES = [{ id: 'dam', label: '防砂壩', name: '防砂壩' }, { id: 'sub', label: '副壩', name: '副壩' }, { id: 'sill', label: '固床工', name: '固床工' }];
const stTypeLabel = t => (ST_TYPES.find(q => q.id === t) || ST_TYPES[0]).label;
/* 型式預設：副壩＝同防砂壩完整壩體（較低）；固床工＝無溢洪口缺口、頂部水平、兩岸嵌入（出露高 h2，可為 0＝帶工） */
function stPreset(type, base) {
  const d = stDefaults();
  if (base) { d.p = { ...base.p }; d.w = JSON.parse(JSON.stringify(base.w)); }
  if (type !== 'dam') Object.keys(d.a).forEach(k => { d.a[k].on = false; });
  if (type === 'sub') { d.p.h2 = +((base ? base.p.h2 * (base.a.sub.r || 0.333) : 2.0)).toFixed(2); ['L', 'R'].forEach(s => { d.w[s].auto = true; }); }
  if (type === 'sill') {
    const W = base ? Math.max(1, (stGeo(base).acc && stGeo(base).acc.apron ? stGeo(base).acc.b1 : base.p.w)) : 8;   // 固床工全長＝溪床寬＋兩岸各嵌入 2 m
    Object.assign(d.p, { w: +(W + 4).toFixed(2), h1: 0, s1: 0, h2: 0.5, h3: 1.0, hq: 0, d1: 1.0, s2: 0, s3: 0, s4: 0, s5: 0, k: 0, k1: 0, dh: 0 });
    ['L', 'R'].forEach(s => Object.assign(d.w[s], { r1: 0, rs: 10, r2: 0, r3: 0, r4: 0, r5: +(0.5 * (d.p.h2 + d.p.h3)).toFixed(4), ns: 0.5, auto: false }));   // v6.3：固床工預設梯形，左右端面坡各 1:0.5
  }
  return d;
}
const stType = () => ST_TYPES[0];

function stDefaults() {
  const p = {}; ST_P.forEach(q => { p[q[0]] = q[2]; });
  const wg = r5 => { const w = {}; ST_W.forEach(q => { w[q[0]] = q[2]; }); w.r5 = r5; w.auto = false; return w; };
  const a = {}; Object.keys(ST_AG).forEach(k => { a[k] = { on: ST_AON[k] }; }); ST_A.forEach(q => { a[q[0]][q[1]] = q[3]; });
  return { p, w: { L: wg(3), R: wg(5) }, a };
}
function stNorm(o) {
  const d = (o.type && o.type !== 'dam') ? stPreset(o.type) : stDefaults(), op = o.p || {}, st = { id: o.id || ('S' + Math.random().toString(36).slice(2, 7)), type: ST_TYPES.some(q => q.id === o.type) ? o.type : 'dam', par: o.par || null, ci: +o.ci || 0, name: o.name || '防砂壩', sta: +o.sta || 0, dir: (+o.dir) < 0 ? -1 : 1, p: d.p, w: d.w, a: d.a, eq: !!o.eq, link: o.link === undefined ? true : !!o.link, dz: +o.dz || 0, zB: (o.zB === undefined || o.zB === null) ? null : +o.zB };
  if (op.H !== undefined || op.B !== undefined) {      // 由 v4.1 檔案轉入（舊參數 → dam1 參數）
    const map = { B: 'w', H: 'h2', b: 'd1', ns: 's1', n: 's2', m: 's3', Df: 'h3', dh: 'dh', kx: 'kx', km: 'km' };
    Object.keys(map).forEach(k => { if (op[k] !== undefined) st.p[map[k]] = +op[k]; });
    st.link = false; if (o.zB === undefined || o.zB === null) st.zB = null;
  } else Object.keys(st.p).forEach(k => { if (op[k] !== undefined && Number.isFinite(+op[k])) st.p[k] = +op[k]; });

  if (o.a && o.a.apron) { const ap = o.a.apron; if (ap.b0 !== undefined && ap.b0 !== null && ap.L0 === undefined) { st.a.apron.L0 = st.a.apron.R0 = +ap.b0 / 2; } if (ap.b1 !== undefined && ap.b1 !== null && ap.L1 === undefined) { st.a.apron.L1 = st.a.apron.R1 = +ap.b1 / 2; } }
  st.p.nh = (op.hsp === undefined) ? 0 : Math.max(0, Math.round(st.p.nh || 0));   // 舊檔的孔數不沿用（改依規範）
  if (o.a) Object.keys(ST_AG).forEach(k => { if (!o.a[k]) return; if (o.a[k].on !== undefined) st.a[k].on = !!o.a[k].on; if (typeof o.a[k].nm === 'string' && o.a[k].nm.trim()) st.a[k].nm = o.a[k].nm.trim(); ST_A.forEach(q => { if (q[0] !== k) return; const v = o.a[k][q[1]]; if (v === null) st.a[k][q[1]] = null; else if (Number.isFinite(+v)) st.a[k][q[1]] = +v; }); });
  if (st.a.wall.on || st.a.tail.on) st.a.apron.on = true;   // v5.4：側牆／尾檻一定有底板（舊版即隱含計入護坦），改為明確的獨立結構物「護坦」
  if (o.w && o.w.L && o.w.L.r1 !== undefined) ['L', 'R'].forEach(s => { if (o.w[s]) ST_W.forEach(q => { if (Number.isFinite(+o.w[s][q[0]])) st.w[s][q[0]] = +o.w[s][q[0]]; }); st.w[s].auto = !!(o.w[s] && o.w[s].auto); });
  return st;
}
function stClean() { return state.structs.map(s => ({ id: s.id, type: s.type, par: s.par, ci: s.ci, name: s.name, sta: s.sta, dir: s.dir, p: { ...s.p }, w: { L: { ...s.w.L }, R: { ...s.w.R } }, a: JSON.parse(JSON.stringify(s.a)), eq: s.eq, link: s.link, dz: s.dz, zB: s.zB })); }
function stLoad(arr) { state.structs = (arr || []).map(stNorm); state.structSel = state.structs.length ? 0 : -1; ST_SIG = ''; }
function stW(st, side) { return (st.eq && side === 'R') ? st.w.L : st.w[side]; }
function stEff(st, side) {
  const w = stW(st, side), a = st._auto && st._auto[side], useA = !!w.auto && a !== null && a !== undefined;
  return { wh: (st.p.wsp && w.wh > 0) ? w.wh : st.p.w / 2, r1: useA ? a : w.r1, rs: w.rs, r2: w.r2, r3: w.r3, r4: w.r4, r5: (st.type === 'sill' && w.ns > 0) ? w.ns * (st.p.h2 + st.p.h3) : w.r5, auto: useA };   // v6.3：固床工端面坡 → 梯形
}

/* ---------- 真實比例幾何（z=0＝溢洪口底；x＝壩軸向(面向下游，右為正)；u＝順水流向(下游為正，壩頂中心為0)） ---------- */
function stSide(p, e) {
  const x1 = e.wh ?? p.w / 2, x2 = x1 + p.h1 * p.s1, x3 = x2 + e.r1, x4 = x3 + e.r2, x6 = Math.max(x1, x4 - e.r4), x7 = Math.max(0, Math.min(x6, x6 - e.r5));
  const zW = p.h1 + e.r1 / Math.max(e.rs, 1e-6);
  return { ...e, x1, x2, x3, x4, x6, x7, zW, zP5: zW - e.r3 };
}
function stGeo(st) {
  const eL = stEff(st, 'L'), eR = stEff(st, 'R'), key = JSON.stringify([st.p, eL, eR, st.a, st._bedKey || '']);
  if (st._gk === key && st._g) return st._g;
  const p = st.p, x1 = p.w / 2, L = stSide(p, eL), R = stSide(p, eR), S = x => (x < 0 ? L : R), zbt = -(p.h2 + p.h3);
  const uU = z => -p.d1 / 2 + (z >= 0 ? p.s5 * z : p.s3 * z), uD = z => p.d1 / 2 - (z >= 0 ? p.s4 * z : p.s2 * z);
  const topZ = x => { const s = S(x); x = Math.abs(x); if (x <= s.x1) return 0; if (x <= s.x2) return s.x2 > s.x1 ? p.h1 * (x - s.x1) / (s.x2 - s.x1) : p.h1; if (x <= s.x3) return p.h1 + (x - s.x2) / Math.max(s.rs, 1e-6); return s.zW; };
  const botZ = x => { const s = S(x); x = Math.min(Math.abs(x), s.x4); if (x <= s.x7) return zbt; if (x <= s.x6) return s.x6 > s.x7 ? zbt * (1 - (x - s.x7) / (s.x6 - s.x7)) : 0; return s.x4 > s.x6 ? s.zP5 * (x - s.x6) / (s.x4 - s.x6) : s.zP5; };
  const I = z => (z >= 0 ? p.d1 * z - (p.s4 + p.s5) * z * z / 2 : p.d1 * z - (p.s2 + p.s3) * z * z / 2);      // ∫0→z 厚度 dz
  const kw = x => (x < 0 ? L.x7 : R.x7);
  const A = (x, key2) => { const v = I(topZ(x)) - I(botZ(x)); return Math.max(0, v) + (key2 ? p.k * p.k1 : 0); };
  const xs = [...new Set([L.x4, L.x6, L.x7, L.x3, L.x2].map(v => -v).concat([R.x1, -L.x1, R.x2, R.x3, R.x7, R.x6, R.x4]).map(v => +v.toFixed(6)))].sort((a, c) => a - c);
  const cx = [-L.x4, -L.x6, -L.x7, R.x7, R.x6, R.x4].map(v => +v.toFixed(6)).filter((v, i, a) => !i || v > a[i - 1] + 1e-6);
  const plan = cx.map(x => [uU(botZ(x)), x]).concat(cx.slice().reverse().map(x => [uD(botZ(x)), x]));          // 基礎接地外形 [u,x]
  const g = { p, L, R, x1, zbt, uU, uD, topZ, botZ, A, I, kw, xs, plan, xmin: -L.x4, xmax: R.x4, uUpB: uU(zbt), uDnB: uD(zbt), maxW: Math.max(L.zW, R.zW),
    thMin: Math.min(p.d1 - (p.s4 + p.s5) * Math.max(L.zW, R.zW), p.d1) };
  g.x1L = L.x1; g.x1R = R.x1;
  g.holes = stHoles(p, L, R, zbt);
  g.acc = stAcc(st, g);
  Object.assign(g, stBuildLines(st, g));
  stAccLines(st, g);
  st._gk = key; st._g = g; return g;
}
/* 壩體排水孔：底層沿下游溪床高度、頂層距溢洪口底至少 hcl；水平範圍不超過溢洪口頂寬；三角形（交錯）排列，間距 hsp */
function stNoWing(st, g) { return (st.type === 'sill') || (g && g.maxW < 1e-6 && !(st.p.h1 > 1e-6)); }   // 無壩翼（固床工、帶工）：橫斷面不標翼頂／h1／開挖底註記
function stHoles(p, L, R, zbt) {
  const out = [], s = Math.max(0.5, p.hsp || 2), dh = p.dh || 0, r = dh / 2, xTop = R.x2, xTopL = L.x2, x2 = p.hwx > 0 ? Math.min(xTop, p.hwx / 2) : xTop, x2L = p.hwx > 0 ? Math.min(xTopL, p.hwx / 2) : xTopL, zBot = -p.h2 + Math.max(0, p.hb || 0) + r, zTop = -Math.max(0, p.hcl || 0) - r;
  if (!(dh > 0) || zTop < zBot - 1e-9) return out;
  const edge = (S, z) => { const t = zbt < 0 ? Math.min(1, Math.max(0, z / zbt)) : 0; return S.x6 + (S.x7 - S.x6) * t; };   // 該高程壩體兩岸邊緣
  for (let k = 0, z = zBot; z <= zTop + 1e-9; k++, z = zBot + k * s * Math.sqrt(3) / 2) {
    const lim = Math.min(x2 - r, edge(R, z) - 0.5 - r), limL = Math.min(x2L - r, edge(L, z) - 0.5 - r);
    for (let x = (k % 2) * s / 2; x <= Math.max(lim, limL) + 1e-9; x += s) { if (x <= lim + 1e-9) out.push([x, z]); if (x > 1e-9 && x <= limL + 1e-9) out.push([-x, z]); }
  }
  out.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  out.cap = out.length;
  const n = Math.round(p.nh || 0);
  if (n > 0 && n < out.length) {   // 指定孔數：由底層、自中央向兩側依序取用（保持對稱）
    const pick = out.slice().sort((a, b) => a[1] - b[1] || Math.abs(a[0]) - Math.abs(b[0]) || a[0] - b[0]).slice(0, n).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    pick.cap = out.length; return pick;
  }
  return out;
}
function stBuildLines(st, g) {
  const p = g.p, zbt = g.zbt, uu = g.uU, ud = g.uD, L = g.L, R = g.R, pl = [], se = [], el = [];
  const P = (a, t, k, dim) => ({ p: a, t, k, dim });
  const hs = [-1, 1];
  // ---- 平面（[u,x]）
  pl.push(P([[uu(0), -L.x1], [uu(0), R.x1]], ['w'], 'top', p.wsp ? `w=${stf(p.w)}（左${stf(L.x1)}／右${stf(R.x1)}）` : `w=${stf(p.w)}`), P([[ud(0), -L.x1], [ud(0), R.x1]], ['w'], 'top'),
    P([[uu(0), -L.x1], [ud(0), -L.x1]], ['d1'], 'top', `d1=${stf(p.d1)}`), P([[uu(0), R.x1], [ud(0), R.x1]], ['d1'], 'top'),
    P([[uu(zbt), -L.x7], [uu(zbt), R.x7]], ['s3', 'h2', 'h3', 'zB'], 'base'), P([[ud(zbt), -L.x7], [ud(zbt), R.x7]], ['s2', 'h2', 'h3', 'zB'], 'base'));
  const ku0 = ud(zbt) - p.k1, ku1 = ud(zbt);
  if (p.k > 0 && p.k1 > 0) pl.push(P([[ku0, -L.x7], [ku1, -L.x7]], ['k1', 'k'], 'hid'), P([[ku0, R.x7], [ku1, R.x7]], ['k1', 'k'], 'hid'), P([[ku0, -L.x7], [ku0, R.x7]], ['k1', 'k'], 'hid'));
  [[L, -1, 'L'], [R, 1, 'R']].forEach(([S, sg, D]) => {
    const X = v => sg * v;
    pl.push(P([[uu(0), X(S.x1)], [uu(p.h1), X(S.x2)]], ['h1', 's1', 's5'], 'top'), P([[ud(0), X(S.x1)], [ud(p.h1), X(S.x2)]], ['h1', 's1', 's4'], 'top'), P([[uu(p.h1), X(S.x2)], [ud(p.h1), X(S.x2)]], ['h1', 's1'], 'step'),
      P([[uu(p.h1), X(S.x2)], [uu(S.zW), X(S.x3)]], ['r1' + D, 'rs' + D, 's5'], 'top', `r1=${stf(S.r1)}`), P([[ud(p.h1), X(S.x2)], [ud(S.zW), X(S.x3)]], ['r1' + D, 'rs' + D, 's4'], 'top'), P([[uu(S.zW), X(S.x3)], [ud(S.zW), X(S.x3)]], ['r1' + D, 'rs' + D], 'step'),
      P([[uu(S.zW), X(S.x3)], [uu(S.zW), X(S.x4)]], ['r2' + D, 's5'], 'top', `r2=${stf(S.r2)}`), P([[ud(S.zW), X(S.x3)], [ud(S.zW), X(S.x4)]], ['r2' + D, 's4'], 'top'),
      P([[uu(S.zW), X(S.x4)], [uu(S.zP5), X(S.x4)]], ['r3' + D, 's5'], 'top'), P([[ud(S.zW), X(S.x4)], [ud(S.zP5), X(S.x4)]], ['r3' + D, 's4'], 'top'), P([[uu(S.zP5), X(S.x4)], [ud(S.zP5), X(S.x4)]], ['r3' + D], 'base'),
      P([[uu(S.zP5), X(S.x4)], [uu(0), X(S.x6)]], ['r4' + D], 'base', `r4=${stf(S.r4)}`), P([[ud(S.zP5), X(S.x4)], [ud(0), X(S.x6)]], ['r4' + D], 'base'), P([[uu(0), X(S.x6)], [ud(0), X(S.x6)]], ['r4' + D, 'r5' + D], 'step'),
      P([[uu(0), X(S.x6)], [uu(zbt), X(S.x7)]], ['r5' + D, 's3'], 'base', `r5=${stf(S.r5)}`), P([[ud(0), X(S.x6)], [ud(zbt), X(S.x7)]], ['r5' + D, 's2'], 'base'), P([[uu(zbt), X(S.x7)], [ud(zbt), X(S.x7)]], ['r5' + D], 'step'));
  });
  // ---- 斷面（[u,z]，順水流向）
  se.push(P([[uu(0), 0], [ud(0), 0]], ['d1'], 'main'),
    P([[ud(0), 0], [ud(-p.h2), -p.h2]], ['h2', 's2'], 'main'), P([[ud(-p.h2), -p.h2], [ud(zbt), zbt]], ['h3', 's2'], 'main'),
    P([[uu(0), 0], [uu(-p.h2), -p.h2]], ['h2', 's3'], 'main'), P([[uu(-p.h2), -p.h2], [uu(zbt), zbt]], ['h3', 's3'], 'main'),
    P([[uu(zbt), zbt], [ud(zbt), zbt]], ['s2', 's3', 'zB'], 'main'),
    P([[ku0, zbt], [ku0, zbt - p.k]], ['k'], 'main'), P([[ku0, zbt - p.k], [ku1, zbt - p.k]], ['k1'], 'main'), P([[ku1, zbt - p.k], [ku1, zbt]], ['k'], 'main'),
    P([[ud(-p.h2), -p.h2], [ud(-p.h2) + 2.5, -p.h2]], ['h2'], 'ref'), P([[uu(p.h1), p.h1], [ud(p.h1), p.h1]], ['h1'], 'ref'));
  const wd = [['R', R]]; if (Math.abs(L.zW - R.zW) > 1e-6) wd.push(['L', L]);
  wd.forEach(([D, S], i) => { const k = i ? 'wing2' : 'wing', tg = ['r1' + D, 'rs' + D, 'h1'], tg2 = (Math.abs(L.zW - R.zW) <= 1e-6) ? [...tg, 'r1L', 'rsL'] : tg;
    se.push(P([[uu(0), 0], [uu(S.zW), S.zW]], ['s5', ...tg2], k), P([[ud(0), 0], [ud(S.zW), S.zW]], ['s4', ...tg2], k), P([[uu(S.zW), S.zW], [ud(S.zW), S.zW]], tg2, k)); });
  // ---- 立面（[x,z]，下游視）
  el.push(P([[-L.x1, 0], [R.x1, 0]], ['w'], 'main', p.wsp ? `w=${stf(p.w)}（左${stf(L.x1)}／右${stf(R.x1)}）` : `w=${stf(p.w)}`));
  const xb = (S, sg) => { const t = p.h3 / (p.h2 + p.h3); return sg * (S.x7 + (S.x6 - S.x7) * t); };
  [[L, -1, 'L'], [R, 1, 'R']].forEach(([S, sg, D]) => {
    const X = v => sg * v;
    el.push(P([[X(S.x1), 0], [X(S.x2), p.h1]], ['h1', 's1'], 'main', D === 'R' ? `h1=${stf(p.h1)}  1:${p.s1}` : null),
      P([[X(S.x2), p.h1], [X(S.x3), S.zW]], ['r1' + D, 'rs' + D], 'main', `r1=${stf(S.r1)}  1:${stf(S.rs, 0)}`), P([[X(S.x3), S.zW], [X(S.x4), S.zW]], ['r2' + D], 'main', `r2=${stf(S.r2)}`),
      P([[X(S.x4), S.zW], [X(S.x4), S.zP5]], ['r3' + D], 'main', `r3=${stf(S.r3)}`), P([[X(S.x4), S.zP5], [X(S.x6), 0]], ['r4' + D], 'main', `r4=${stf(S.r4)}`),
      P([[X(S.x6), 0], [X(S.x7), zbt]], ['r5' + D, 'h2', 'h3'], 'main', `r5=${stf(S.r5)}`), P([[X(S.x7), zbt], [X(S.x7), zbt - p.k]], ['k'], 'hid'));
  });
  el.push(P([[-L.x7, zbt], [R.x7, zbt]], ['h2', 'h3', 'zB'], 'main', `h2+h3=${stf(p.h2 + p.h3)}`), P([[-L.x7, zbt - p.k], [R.x7, zbt - p.k]], ['k'], 'hid', `k=${stf(p.k)}`),
    P([[xb(L, -1), -p.h2], [xb(R, 1), -p.h2]], ['h2'], 'ref', `h2=${stf(p.h2)}`));
  // ---- 填色
  const upoly = pts => pts.map(q => q.slice());
  const Lw = [[-L.x4, L.zP5], [-L.x4, L.zW], [-L.x3, L.zW], [-L.x2, p.h1], [-L.x1, 0], [R.x1, 0], [R.x2, p.h1], [R.x3, R.zW], [R.x4, R.zW], [R.x4, R.zP5], [R.x6, 0], [R.x7, zbt], [-L.x7, zbt], [-L.x6, 0]];
  const elevFill = [Lw, [[-L.x7, zbt], [R.x7, zbt], [R.x7, zbt - p.k], [-L.x7, zbt - p.k]]];
  const sectFill = [[[uu(0), 0], [ud(0), 0], [ud(zbt), zbt], [uu(zbt), zbt]], [[ku0, zbt], [ku1, zbt], [ku1, zbt - p.k], [ku0, zbt - p.k]], [[uu(0), 0], [ud(0), 0], [ud(g.maxW), g.maxW], [uu(g.maxW), g.maxW]]];
  return { lines: { plan: pl, sect: se, elev: el }, fills: { plan: [g.plan], sect: sectFill, elev: elevFill } };
}


/* ============================================================================
   附屬構造（依附壩，下游側）：護坦／側牆／橫向帶工／副壩
   座標同壩：u 順水流(下游正)，x 壩軸向(面向下游右正)，z 以溢洪口底為 0；河床 z=−h2
   ============================================================================ */
function stAccV(st, grp, k) {   // 有效值（null＝跟隨）
  const v = st.a[grp][k], p = st.p, A = st.a, Lp = A.apron.cL * (p.h2 + p.hq), x2 = stEff(st, /[L]\d?$/.test(k) && k.startsWith('L') ? 'L' : 'R').wh + p.h1 * p.s1;
  if (v !== null && v !== undefined) return v;
  switch (grp + '.' + k) {
    case 'apron.L0': case 'apron.R0': return Math.max(0.25, x2 + 0.5 - A.wall.si * p.h2);                         // 牆頂內緣對齊 x2+0.5、壩端牆高＝h2（溢洪口底至底板面）
    case 'apron.L1': case 'apron.R1': return A.tail.on ? stAccV(st, 'tail', 'wn') / 2 : Math.max(0.25, x2 + 0.5 - A.wall.si * stAccV(st, 'wall', 'hE'));
    case 'apron.tp': { const H = p.h2, h = Math.max(0, p.h1 - p.hq), Hh = H + h; return Hh < 10 ? 0.8 : Hh <= 15 ? 1.1 : Math.max(1.2, (A.tail.on ? 0.1 : 0.2) * (0.6 * H + 3 * h - 1.0)); }   // 水保手冊式3-99／3-101（H＝護坦面至溢洪口底≈h2，h＝溢流水深≈h1−hq）
    case 'apron.tp0': return p.d1; case 'apron.kd': return p.k; case 'apron.kw': return p.k1;
    case 'tail.wn': return p.w; case 'wall.hf': return p.h3;
    case 'wall.hE': return Math.min(p.h1, p.h2);   // v5.4：末端牆高預設 h1，但不高於壩端（溢洪口底）→ 牆頂只往下游降低、不反向升高
    case 'sill.a': case 'sill.sp': case 'sub.L': return Lp;
  }
  return undefined;
}
function stBedDz(st, u) {   // 壩下游設計河床沿流向的高程變化（相對壩址下游側）
  const B = st._bed; if (!B || !B.length) return 0; const i = Math.max(0, Math.min(B.length - 1, u / 0.5)), k = Math.floor(i), f = i - k;
  return k + 1 < B.length ? B[k] + (B[k + 1] - B[k]) * f : B[B.length - 1];
}
function stBedSample(st) {
  if (typeof getDesignZ !== 'function') return; const z0 = getDesignZ(st.sta + st.dir * 0.01), arr = [];
  for (let u = 0; u <= 80 + 1e-9; u += 0.5) { const z = u < 0.01 ? z0 : getDesignZ(st.sta + st.dir * u); arr.push(Number.isFinite(z) && Number.isFinite(z0) ? +(z - z0).toFixed(3) : 0); }
  st._bed = arr; st._bedKey = arr.join(',');
}
/* 下游保護工幾何：護坦（無尾檻）或水墊＋尾檻（有尾檻），末端截水牆；兩側側牆連接壩下游面，內面坡 1:si 外傾、背面坡 1:so，溪床寬 b0→b1 漸變 */
function stAcc(st, g) {
  const p = st.p, A = st.a, V = (gr, k) => stAccV(st, gr, k), zAp = -p.h2, toe = g.uD(zAp), Lp = A.apron.cL * (p.h2 + p.hq), uE = toe + Lp;
  const hw = { '-1': [V('apron', 'L0'), V('apron', 'L1')], '1': [V('apron', 'R0'), V('apron', 'R1')] }, b0 = hw['-1'][0] + hw['1'][0], b1 = hw['-1'][1] + hw['1'][1];
  const bh = (u, sd) => { const t = Math.max(0, Math.min(1, (u - toe) / (Lp || 1))), f = q => q[0] + (q[1] - q[0]) * t; return sd ? f(hw[sd > 0 ? '1' : '-1']) : Math.max(f(hw['-1']), f(hw['1'])); };   // 溪床半寬（左 sd=-1／右 sd=1）
  const zface = u => (u <= p.d1 / 2 ? (p.s4 > 1e-9 ? (p.d1 / 2 - u) / p.s4 : 1e9) : (p.s2 > 1e-9 ? -(u - p.d1 / 2) / p.s2 : -1e9));   // 壩下游面：u≥uD(z) ⇔ z≥zface(u)
  const R = { Lp, toe, uE, zAp, zBed: zAp, b0, b1, hw, bh, zface, B: Math.max(...hw['-1'], ...hw['1']), apron: null, tail: null, walls: [], sills: [], sub: null, uMax: g.uDnB, xMax: 0 };
  const on = (A.apron.on || A.tail.on || A.wall.on) && Lp > 0;
  if (on) {
    const tp = V('apron', 'tp'), kd = V('apron', 'kd'), kw = Math.min(V('apron', 'kw'), Lp);
    R.apron = { u0: toe, u1: uE, zt: zAp, zb: zAp - tp, tp, B: R.B, water: !!A.tail.on, cut: (kd > 0 && kw > 0) ? { u0: uE - kw, u1: uE, zb: zAp - tp - kd, kd, kw } : null };
    R.apron.tooth = R.apron.cut;
  }
  if (on && A.tail.on) {
    const t = A.tail, ht = t.ht, wn = V('tail', 'wn'), bw = t.ts + t.sd * ht, u0 = Math.max(toe, uE - bw);
    R.tail = { u0, c1: u0 + t.ts, u1: uE, zt: zAp + ht, zn: zAp + ht - t.hn, ht, hn: t.hn, wn, ts: t.ts, sd: t.sd,
      top: (u, notch) => { const zt = notch ? zAp + ht - t.hn : zAp + ht, H = zt - zAp; if (u < u0 - 1e-9 || H <= 0) return null; const c1 = u0 + t.ts, ue = c1 + t.sd * H; if (u <= c1) return zt; if (u > ue + 1e-9) return null; return t.sd > 1e-9 ? zt - (u - c1) / t.sd : zt; } };
  }
  if (on && A.wall.on) {
    const w = A.wall, zt0 = 0, zt1 = zAp + V('wall', 'hE');                                    // 牆頂：壩端＝溢洪口底高程，末端＝底板面＋h1
    const uS = g.uD(zt0), zt = u => (u <= toe ? zt0 : zt0 + (zt1 - zt0) * (u - toe) / ((uE - toe) || 1));
    const zb = R.apron ? R.apron.zb : zAp;                                                        // 牆基礎與底板連成一體
    [-1, 1].forEach(sd => {
      const xin = (u, z) => bh(Math.max(u, toe), sd) + w.si * (z - zAp);                         // 內面 1:si（往上外傾），底板面處＝該側溪床半寬
      const xto = u => xin(u, zt(u)) + w.tw, xback = (u, z) => xto(u) - w.so * (zt(u) - z);
      R.walls.push({ sd, uS, u0: toe, u1: uE, zt0, zt1, zb, tw: w.tw, si: w.si, so: w.so, zt, xin, xto, xback, xo: Math.max(xback(toe, zAp), xback(uE, zAp), xto(uS)), xi: bh(toe, sd) });
    });
    const hs = [], area = (() => { let a = 0; for (let u = toe; u < uE; u += 0.05) a += Math.max(0, zt(u + 0.025) - zAp) * 0.05; return a * Math.sqrt(1 + w.si * w.si); })(), need = Math.ceil(area / Math.max(0.1, w.da));
    for (let s2 = Math.sqrt(Math.max(0.1, w.da)); s2 > 0.2 && hs.length < need; s2 *= 0.92) { hs.length = 0; for (let u = toe + s2 / 2; u < uE - 0.2; u += s2) for (let z = zAp + 0.3; z < zt(u) - 0.3; z += s2) hs.push([u, z]); }
    R.holes = { list: hs, need, area, dh: w.dh, n: hs.length };
  }
  R.xbk = (u, sd) => { const f = q => (R.walls.length ? R.walls.find(w => w.sd === q).xback(Math.max(u, toe), zAp) : bh(u, q)); return sd ? f(sd > 0 ? 1 : -1) : Math.max(f(-1), f(1)); };   // 底板外緣（有側牆時延伸至牆背）
  if (false) {   // 固床工改以完整結構物（子項）處理
    const a0 = (R.apron ? R.apron.u1 : toe) + V('sill', 'a'), sp = V('sill', 'sp'), bd = A.sill.bd, hd = A.sill.hd, B = b1 / 2;
    for (let i = 0; i < Math.round(A.sill.n); i++) { const u0 = a0 + i * sp, zt = zAp + stBedDz(st, u0 + bd / 2); R.sills.push({ i, u0, u1: u0 + bd, zt, zb: zt - hd, B }); }
  }
  if (false) {   // 副壩改以完整結構物（子項）處理
    const hs = A.sub.r * p.h2, zBs = zAp + stBedDz(st, toe + V('sub', 'L')), zc = zBs + hs, zf = zBs - p.h3, H = zc - zf, c0 = toe + V('sub', 'L') + p.s3 * H, c1 = c0 + A.sub.ts;
    R.sub = { hs, zc, zf, H, c0, c1, b0: c0 - p.s3 * H, b1: c1 + p.s2 * H, Bs: b1 / 2 + 1.0, s2: p.s2, s3: p.s3, ts: A.sub.ts,
      top: u => { if (u < c0 - p.s3 * H - 1e-9 || u > c1 + p.s2 * H + 1e-9) return null; if (u < c0) return p.s3 > 1e-9 ? zc - (c0 - u) / p.s3 : zc; if (u > c1) return p.s2 > 1e-9 ? zc - (u - c1) / p.s2 : zc; return zc; } };
  }
  const us = [R.apron && R.apron.u1, ...R.walls.map(w => w.u1), ...R.sills.map(s => s.u1), R.sub && R.sub.b1].filter(v => Number.isFinite(v));
  R.uMax = Math.max(g.uDnB, ...us);
  R.xMax = Math.max(R.apron ? R.B : 0, ...R.walls.map(w => w.xo), R.sills.length ? b1 / 2 : 0, R.sub ? R.sub.Bs : 0);
  R.any = !!(R.apron || R.walls.length || R.sills.length || R.sub);
  return R;
}
/* 側牆於 u 處之斷面（[x,z]，右側；左側取鏡射），已扣除壩體（壩下游面以上游部分） */
function stWallSec(R, w, u) {
  if (u < w.uS - 1e-9 || u > w.u1 + 1e-9) return null;
  const zt = w.zt(u), z0 = Math.max(R.zAp, R.zface(u)); if (zt <= z0 + 1e-6) return null;
  return [[w.xin(u, z0), z0], [w.xin(u, zt), zt], [w.xto(u), zt], [w.xback(u, z0), z0]];
}
/* 平面／縱斷面圖線 */
function stAccLines(st, g) {
  const R = g.acc; let GG = ''; const P = (a, t, k) => ({ p: a, t, k, g: GG }), pl = g.lines.plan, se = g.lines.sect, F = g.fills.sect, TA = ['h2', 'hq', 'a.apron.cL'];   // v5.4：g＝所屬附屬構造（apron／tail／wall）
  const rectS = (u0, u1, z0, z1, t, k) => [P([[u0, z1], [u1, z1]], t, k), P([[u1, z1], [u1, z0]], t, k), P([[u1, z0], [u0, z0]], t, k), P([[u0, z0], [u0, z1]], t, k)];
  const N = 12, along = (f, a, b) => { const o = []; for (let i = 0; i <= N; i++) { const u = a + (b - a) * i / N; o.push([u, f(u)]); } return o; };
  GG = 'apron'; if (R.apron) {
    const a = R.apron, t = [...TA, 'a.apron.tp', 'a.apron.L0', 'a.apron.R0', 'a.apron.L1', 'a.apron.R1'];
    [-1, 1].forEach(s => { pl.push(P(along(u => s * R.bh(u, s), a.u0, a.u1), t, 'base')); if (R.walls.length) pl.push(P(along(u => s * R.xbk(u, s), a.u0, a.u1), t, 'hid')); });
    pl.push(P([[a.u1, -R.xbk(a.u1, -1)], [a.u1, R.xbk(a.u1, 1)]], t, 'base'));
    se.push(...rectS(a.u0, a.u1, a.zb, a.zt, t, 'main')); F.push([[a.u0, a.zt], [a.u1, a.zt], [a.u1, a.zb], [a.u0, a.zb]]);
    if (a.cut) { const k = a.cut, tt = ['a.apron.kd', 'a.apron.kw']; pl.push(P([[k.u0, -R.bh(k.u0, -1)], [k.u0, R.bh(k.u0, 1)]], tt, 'hid')); se.push(P([[k.u0, a.zb], [k.u0, k.zb]], tt, 'main'), P([[k.u0, k.zb], [k.u1, k.zb]], tt, 'main'), P([[k.u1, k.zb], [k.u1, a.zb]], tt, 'main')); }
  }
  GG = 'tail'; if (R.tail) {
    const T = R.tail, t = ['a.tail.ht', 'a.tail.hn', 'a.tail.wn', 'a.tail.ts', 'a.tail.sd'], bL = R.bh(T.u1, -1), bR = R.bh(T.u1, 1);
    pl.push(P([[T.u0, -R.bh(T.u0, -1)], [T.u0, R.bh(T.u0, 1)]], t, 'top'), P([[T.c1, -bL], [T.c1, -T.wn / 2]], t, 'top'), P([[T.c1, T.wn / 2], [T.c1, bR]], t, 'top'), P([[T.u0, -T.wn / 2], [T.c1 + T.sd * (T.zn - R.zAp), -T.wn / 2]], t, 'top'), P([[T.u0, T.wn / 2], [T.c1 + T.sd * (T.zn - R.zAp), T.wn / 2]], t, 'top'));
    const pr = nt => { const zt = nt ? T.zn : T.zt, ue = T.c1 + T.sd * (zt - R.zAp); return [[T.u0, R.zAp], [T.u0, zt], [T.c1, zt], [ue, R.zAp]]; };
    const q = pr(true); q.slice(0, -1).forEach((v, i) => se.push(P([v, q[i + 1]], t, 'main')));
    const q2 = pr(false); q2.slice(0, -1).forEach((v, i) => se.push(P([v, q2[i + 1]], t, 'wing2')));
  }
  GG = 'wall'; R.walls.forEach(w => {
    const s = w.sd, t = [...TA, 'a.wall.tw', 'a.wall.si', 'a.wall.so', 'a.wall.hE', s < 0 ? 'a.apron.L0' : 'a.apron.R0', s < 0 ? 'a.apron.L1' : 'a.apron.R1'];
    pl.push(P(along(u => s * w.xin(u, w.zt(u)), w.uS, w.u1), t, 'top'), P(along(u => s * w.xto(u), w.uS, w.u1), t, 'top'),
      P([[w.u1, s * R.bh(w.u1, s)], [w.u1, s * w.xto(w.u1)]], t, 'top'), P([[w.uS, s * w.xin(w.uS, w.zt0)], [w.uS, s * w.xto(w.uS)]], t, 'step'));
    if (s > 0) {
      const top = along(u => w.zt(u), w.uS, w.u1), face = []; for (let i = 0; i <= 10; i++) { const z = w.zt0 + (R.zAp - w.zt0) * i / 10; face.push([g.uD(z), z]); }
      se.push(P(top, t, 'wing2'), P([[w.u1, w.zt1], [w.u1, R.zAp]], t, 'wing2'), P(face.filter(q => q[1] >= R.zAp - 1e-9), t, 'wing2'));
    }
  });
  R.sills.forEach(b => { const t = ['a.sill.a', 'a.sill.sp', 'a.sill.bd', 'a.sill.hd', 'a.sill.n'], rp = [[b.u0, -b.B], [b.u1, -b.B], [b.u1, b.B], [b.u0, b.B]]; rp.forEach((v, i) => pl.push(P([v, rp[(i + 1) % 4]], t, 'base'))); se.push(...rectS(b.u0, b.u1, b.zb, b.zt, t, 'main')); });
  if (R.sub) {
    const s = R.sub, t = ['a.sub.r', 'a.sub.L', 'a.sub.ts', 'h2', 'h3', 's2', 's3'], poly = [[s.b0, s.zf], [s.c0, s.zc], [s.c1, s.zc], [s.b1, s.zf]];
    [[s.c0, s.c1]].forEach(([a, b]) => { const rp = [[a, -s.Bs], [b, -s.Bs], [b, s.Bs], [a, s.Bs]]; rp.forEach((v, i) => pl.push(P([v, rp[(i + 1) % 4]], t, 'top'))); });
    pl.push(P([[s.b0, -s.Bs], [s.b0, s.Bs]], t, 'hid'), P([[s.b1, -s.Bs], [s.b1, s.Bs]], t, 'hid'));
    poly.forEach((q, i) => se.push(P([q, poly[(i + 1) % 4]], t, 'main')));
  }
}
/* 剖面（順水流，於壩軸向 x 處切）：附屬構造多邊形 [u,z] */
function stAccCut(g, x, only) {   // only：只取某一附屬構造（apron／tail／wall）
  const R = g.acc, out0 = [], ax = Math.abs(x), side = x < 0 ? -1 : 1; let GG = ''; const out = { push: (...a) => a.forEach(pg => { pg.g = GG; if (!only || only === GG) out0.push(pg); }) };
  const span = (u0, u1) => { let a = null, b = null; for (let i = 0; i <= 200; i++) { const u = u0 + (u1 - u0) * i / 200; if (R.xbk(u, side) >= ax - 1e-6) { if (a === null) a = u; b = u; } } return a === null ? null : [a, b]; };
  GG = 'apron'; if (R.apron) { const a = R.apron, sp = span(a.u0, a.u1); if (sp) { out.push([[sp[0], a.zt], [sp[1], a.zt], [sp[1], a.zb], [sp[0], a.zb]]); if (a.cut && sp[1] > a.cut.u0) out.push([[Math.max(sp[0], a.cut.u0), a.zb], [sp[1], a.zb], [sp[1], a.cut.zb], [Math.max(sp[0], a.cut.u0), a.cut.zb]]); } }
  GG = 'tail'; if (R.tail && ax <= R.bh(R.tail.u1, side) + 1e-6) { const T = R.tail, nt = ax < T.wn / 2, zt = nt ? T.zn : T.zt; if (zt > R.zAp) out.push([[T.u0, R.zAp], [T.u0, zt], [T.c1, zt], [T.c1 + T.sd * (zt - R.zAp), R.zAp]]); }
  GG = 'wall'; R.walls.forEach(w => {   // 側牆：以側牆立面（牆頂由壩端溢洪口底高漸降至末端）表示，切線位於該側牆外緣以內者繪出
    if ((w.sd > 0) !== (x > 0) && ax > 1e-6) return;
    let xo = 0; for (let i = 0; i <= 20; i++) xo = Math.max(xo, w.xto(w.uS + (w.u1 - w.uS) * i / 20));
    if (ax > xo + 1e-6) return;
    const top = [], bot = [];
    for (let i = 0; i <= 60; i++) {
      const u = w.uS + (w.u1 - w.uS) * i / 60, zt = w.zt(u), z0 = Math.max(R.zAp, R.zface(u));
      if (zt > z0 + 1e-6) { top.push([u, zt]); bot.push([u, z0]); }
    }
    if (top.length > 1) out.push(top.concat(bot.reverse()));
  });
  GG = 'x'; R.sills.forEach(b => { if (ax <= b.B + 1e-6) out.push([[b.u0, b.zt], [b.u1, b.zt], [b.u1, b.zb], [b.u0, b.zb]]); });
  if (R.sub && ax <= R.sub.Bs + 1e-6) { const s = R.sub; out.push([[s.b0, s.zf], [s.c0, s.zc], [s.c1, s.zc], [s.b1, s.zf]]); }
  return out0;
}
/* 橫斷面（於順水流 u 處切）：附屬構造多邊形 [x,z] */
function stAccCross(g, u, only) {
  const R = g.acc, out0 = [], In = (a, b) => u >= a - 1e-6 && u <= b + 1e-6; let GG = ''; const out = { push: (...a) => a.forEach(pg => { pg.g = GG; if (!only || only === GG) out0.push(pg); }) };
  GG = 'apron'; if (R.apron && In(R.apron.u0, R.apron.u1)) { const a = R.apron, BL = R.xbk(u, -1), BR = R.xbk(u, 1), zb = (a.cut && In(a.cut.u0, a.cut.u1)) ? a.cut.zb : a.zb; out.push([[-BL, a.zt], [BR, a.zt], [BR, zb], [-BL, zb]]); }
  GG = 'tail'; if (R.tail) { const T = R.tail, zt = T.top(u, false), zn = T.top(u, true), BL = R.bh(u, -1), BR = R.bh(u, 1); if (zt !== null && zt > R.zAp) { const z2 = zn === null ? R.zAp : Math.min(zn, zt), h = T.wn / 2; out.push([[-BL, R.zAp], [-BL, zt], [-h, zt], [-h, z2], [h, z2], [h, zt], [BR, zt], [BR, R.zAp]]); } }
  GG = 'wall'; R.walls.forEach(w => { const s = stWallSec(R, w, u); if (s) out.push(s.map(([x, z]) => [w.sd * x, z])); });
  GG = 'x'; R.sills.forEach(b => { if (In(b.u0, b.u1)) out.push([[-b.B, b.zt], [b.B, b.zt], [b.B, b.zb], [-b.B, b.zb]]); });
  if (R.sub) { const z = R.sub.top(u); if (z !== null && z > R.sub.zf) out.push([[-R.sub.Bs, z], [R.sub.Bs, z], [R.sub.Bs, R.sub.zf], [-R.sub.Bs, R.sub.zf]]); }
  return out0;
}
/* 開挖坑：各構件基礎平面外放 km 後以 1:kx 上坡；底＝構件底−10cm（絕對高程） */
function stAccPits(st, g, zS) {
  const R = g.acc, B = [];
  const XL = R.apron ? Math.max(R.xbk(R.apron.u0, -1), R.xbk(R.apron.u1, -1)) : R.B, XR = R.apron ? Math.max(R.xbk(R.apron.u0, 1), R.xbk(R.apron.u1, 1)) : R.B;
  if (R.apron) { const a = R.apron; B.push({ u0: a.u0, u1: a.u1, x0: -XL, x1: XR, z: zS + a.zb - ST_CL }); if (a.cut) B.push({ u0: a.cut.u0, u1: a.cut.u1, x0: -XL, x1: XR, z: zS + a.cut.zb - ST_CL }); }
  R.sills.forEach(b => B.push({ u0: b.u0, u1: b.u1, x0: -b.B, x1: b.B, z: zS + b.zb - ST_CL }));
  if (R.sub) B.push({ u0: R.sub.b0, u1: R.sub.b1, x0: -R.sub.Bs, x1: R.sub.Bs, z: zS + R.sub.zf - ST_CL });
  return B;
}
/* 附屬構造數量（數值積分 0.02 m） */
function stAccQty(st, g) {
  const R = g.acc, rows = [], SQ = v => Math.sqrt(1 + v * v), du = 0.02; let Vt = 0;
  const integ = (a, b, f) => { let s = 0; for (let u = a + du / 2; u < b; u += du) s += f(u) * du; return s; };
  if (R.apron) {
    const a = R.apron, nm = a.water ? '水墊（底板）' : '護坦', We = R.xbk(a.u1, -1) + R.xbk(a.u1, 1), v1 = integ(a.u0, a.u1, u => R.xbk(u, -1) + R.xbk(u, 1)) * a.tp, v2 = a.cut ? We * a.cut.kw * a.cut.kd : 0, f = We * (a.tp + (a.cut ? a.cut.kd : 0)) + 2 * (R.Lp * a.tp);
    rows.push({ g: 'apron', it: `附屬：${nm}混凝土`, u: 'm³', v: v1 + v2, fx: `溪床半寬 左 ${stf(R.hw['-1'][0])}→${stf(R.hw['-1'][1])}、右 ${stf(R.hw['1'][0])}→${stf(R.hw['1'][1])}（全寬 ${stf(R.b0)}→${stf(R.b1)}）${R.walls.length ? '，底板延伸至側牆背' : ''}，Lp=${stf(st.a.apron.cL)}×(h2+hq)=${stf(R.Lp)}，厚 ${stf(a.tp)}：${stf(v1)}` + (a.cut ? ` ＋ 截水牆 ${stf(We)}×${stf(a.cut.kw)}×${stf(a.cut.kd)}＝${stf(v2)}` : '') });
    rows.push({ g: 'apron', it: `附屬：${nm}模板`, u: 'm²', v: f, fx: `末端面×(厚＋截水牆深)＋兩側面` }); Vt += v1 + v2;
  }
  if (R.tail) {
    const T = R.tail, B = R.bh(T.u1, -1) + R.bh(T.u1, 1), Af = T.ht * T.ts + T.sd * T.ht * T.ht / 2, Hn = T.ht - T.hn, An = Af - (Hn > 0 ? Hn * T.ts + T.sd * Hn * Hn / 2 : 0), v = B * Af - T.wn * An, f = (B * T.ht) + (B * T.ht * SQ(T.sd));
    rows.push({ g: 'tail', it: '附屬：尾檻混凝土', u: 'm³', v, fx: `頂高 ${stf(T.ht)}（水墊面上）、頂寬 ${stf(T.ts)}、下游坡 1:${T.sd}，寬 ${stf(B)} 扣溢流口 ${stf(T.wn)}×深 ${stf(T.hn)}` });
    rows.push({ g: 'tail', it: '附屬：尾檻模板', u: 'm²', v: f, fx: '上游垂直面＋下游斜面（概算）' }); Vt += v;
  }
  if (R.walls.length) {
    const wv = R.walls.map(w => integ(w.uS, w.u1, u => { const s = stWallSec(R, w, u); if (!s) return 0; let A = 0; for (let i = 0; i < 4; i++) { const p = s[i], q = s[(i + 1) % 4]; A += p[0] * q[1] - q[0] * p[1]; } return Math.abs(A) / 2; }));
    const w = R.walls[0];
    const v = integ(w.uS, w.u1, u => { const s = stWallSec(R, w, u); if (!s) return 0; let A = 0; for (let i = 0; i < 4; i++) { const p = s[i], q = s[(i + 1) % 4]; A += p[0] * q[1] - q[0] * p[1]; } return Math.abs(A) / 2; });
    const fi = integ(w.uS, w.u1, u => Math.max(0, w.zt(u) - Math.max(R.zAp, R.zface(u)))) * SQ(w.si), fb = integ(w.uS, w.u1, u => Math.max(0, w.zt(u) - Math.max(R.zAp, R.zface(u)))) * SQ(w.so), He = w.zt1 - R.zAp, fe = He * (w.tw + (w.tw + (w.si - w.so) * He)) / 2;
    rows.push({ g: 'wall', it: '附屬：側牆混凝土（兩側）', u: 'm³', v: wv[0] + wv[1], fx: `連接壩下游面、基礎與底板一體；內面坡 1:${w.si}、背面坡 1:${w.so}、頂寬 ${stf(w.tw)}；牆高 ${stf(w.zt0 - R.zAp)}（壩端＝溢洪口底）→${stf(w.zt1 - R.zAp)} m（末端）；左 ${stf(wv[0])}、右 ${stf(wv[1])}` }); void v;
    rows.push({ g: 'wall', it: '附屬：側牆模板（兩側）', u: 'm²', v: 2 * (fi + fb + fe), fx: `每側 內面 ${stf(fi)} ＋ 背面 ${stf(fb)} ＋ 末端面 ${stf(fe)}` });
    if (R.holes) rows.push({ g: 'wall', it: `附屬：側牆洩水孔 φ${stf(R.holes.dh * 100, 0)}cm（兩側）`, u: '處', v: 2 * R.holes.n, fx: `每側內面面積 ${stf(R.holes.area)} m² ÷ ${stf(st.a.wall.da)} m²/孔 → 至少 ${R.holes.need} 孔，配置 ${R.holes.n} 孔` });
    Vt += wv[0] + wv[1];
  }
  if (R.sills.length) { const b = R.sills[0], v = 2 * b.B * (b.u1 - b.u0) * (b.zt - b.zb); rows.push({ it: `附屬：固床工混凝土（${R.sills.length} 條）`, u: 'm³', v: v * R.sills.length, fx: `每條 ${stf(2 * b.B)}×${stf(b.u1 - b.u0)}×${stf(b.zt - b.zb)}＝${stf(v)}` }); Vt += v * R.sills.length; }
  if (R.sub) {
    const s = R.sub, W = 2 * s.Bs, A = s.ts * s.H + (s.s2 + s.s3) * s.H * s.H / 2, f = W * s.H * (SQ(s.s2) + SQ(s.s3));
    rows.push({ it: '附屬：副壩混凝土', u: 'm³', v: W * A, fx: `高 ${stf(s.hs)}（${st.a.sub.r}×h2）＋基礎 ${stf(st.p.h3)}，頂寬 ${stf(s.ts)}，斷面 A＝${stf(A)} × 寬 ${stf(W)}` });
    rows.push({ it: '附屬：副壩模板', u: 'm²', v: f, fx: `上下游面 ${stf(W)}×H×(√(1+s2²)+√(1+s3²))` }); Vt += W * A;
  }
  return { rows, V: Vt };
}

/* 結構物高程（z 皆為絕對高程；zB＝基礎底面，key 在其下） */
function stDesign(st) {
  const zb = getDesignZBefore(st.sta), za = getDesignZ(st.sta);
  return st.dir > 0 ? { up: zb, dn: za } : { up: za, dn: zb };
}
function stZBlink(st) { const zb = getDesignZBefore(st.sta); return +(st.dir > 0 ? zb - st.p.h2 - st.p.h3 : zb - st.p.h3).toFixed(3); }
function stPlace(st) {
  const g = stGeo(st), d = stDesign(st), p = st.p, zB = (st.zB === null || st.zB === undefined) ? stZBlink(st) : st.zB, zS = zB + p.h2 + p.h3;
  return { zB, zS, zBed: zB + p.h3, zKey: zB - p.k, floor: zB - ST_CL, keyFloor: zB - p.k - ST_CL, zWL: zS + g.L.zW, zWR: zS + g.R.zW, zTop: zS + g.maxW, desUp: d.up, desDn: d.dn };
}
/* 附屬於壩的副壩／固床工：以完整結構物（子項）表示，位置跟隨主壩（距壩趾／護坦末端） */
function stChildU(par, ch) {
  const g = stGeo(par), A = g.acc, cg = stGeo(ch), toe = A ? A.toe : g.uD(-par.p.h2);
  if (ch.type === 'sub') return toe + stAccV(par, 'sub', 'L') - cg.uUpB;
  const a0 = (A && A.apron ? A.apron.u1 : toe) + stAccV(par, 'sill', 'a'), sp = stAccV(par, 'sill', 'sp');
  return a0 + (ch.ci || 0) * sp - cg.uUpB;
}
function stSyncChildren() {   // 副壩／固床工改為單獨放置：舊檔的附屬子項轉為獨立結構物
  state.structs.forEach(st => { if (st.par) { st.par = null; st.ci = 0; } if (!st.par && st.a) { st.a.sub.on = false; st.a.sill.on = false; } });
  return;
  const L = state.structs, keep = [];
  L.forEach(st => {
    if (st.par) { const par = L.find(q => q.id === st.par); if (!par) return; const want = st.type === 'sub' ? par.a.sub.on : (par.a.sill.on && st.ci < Math.round(par.a.sill.n)); if (!want) return; }
    keep.push(st);
  });
  L.filter(st => !st.par && st.type !== 'sill').forEach(par => {
    const need = []; if (par.a.sub.on) need.push(['sub', 0]); if (par.a.sill.on) for (let i = 0; i < Math.round(par.a.sill.n); i++) need.push(['sill', i]);
    need.forEach(([t, i]) => { if (keep.some(q => q.par === par.id && q.type === t && (q.ci || 0) === i)) return; const d = stPreset(t, par); keep.push(stNorm({ type: t, par: par.id, ci: i, name: `${par.name}-${t === 'sub' ? '副壩' : '固床工' + (Math.round(par.a.sill.n) > 1 ? i + 1 : '')}`, sta: par.sta, dir: par.dir, p: d.p, w: d.w, a: d.a, link: false, dz: 0 })); });
  });
  keep.forEach(ch => { if (!ch.par) return; const par = keep.find(q => q.id === ch.par); ch.dir = par.dir; ch.link = false; ch.dz = 0; ch.sta = +(par.sta + par.dir * stChildU(par, ch)).toFixed(3); });
  const sel = L[state.structSel];
  state.structs = keep.sort((a, b) => a.sta - b.sta); state.structSel = Math.max(sel ? state.structs.indexOf(sel) : -1, state.structs.length ? 0 : -1);
}
function stSyncDrops() {   // 每座結構物在縱斷面產生一個落差 dz；連動＝dir×h2，獨立＝使用者設定
  const P = state.profile; if (!P) return;
  stSyncChildren();
  P.drops = P.drops.filter(d => !d.sid);
  state.structs.forEach(st => { if (st.link) st.dz = +(st.dir * st.p.h2).toFixed(4); P.drops.push({ sta: +st.sta.toFixed(3), dz: +st.dz || 0, name: st.name, sid: st.id }); });
  P.drops.sort((a, b) => a.sta - b.sta);
}
function stReachAt(s) {
  let r = 0;
  state.structs.forEach(st => { if (Math.abs(st.sta - s) < 0.03) { const g = stGeo(st); r = Math.max(r, Math.max(g.xmax, -g.xmin) + 6 + (st._boost || 0)); st._reachCov = r; } });
  return r;
}
function stAtSec(sec) { return state.structs.filter(st => Math.abs(st.sta - sec.sta) < 0.03); }
function stZRange(sec) {
  const L = stAtSec(sec); let a = Infinity, b = -Infinity;
  L.forEach(st => { const pl = stPlace(st); a = Math.min(a, pl.keyFloor - 3.6); b = Math.max(b, pl.zTop, pl.desUp, pl.desDn); });   // 下方預留結構物名稱＋樁號標註空間
  stAccAtSec(sec).forEach(({ st, polys }) => { const zS = stPlace(st).zS; polys.forEach(pg => pg.forEach(q => { a = Math.min(a, zS + q[1] - ST_CL); b = Math.max(b, zS + q[1]); })); });
  return Number.isFinite(a) ? [a, b] : null;
}
function stAccAtSec(sec) {   // 該斷面切到的附屬構造（不含壩址本身）
  const out = [];
  state.structs.forEach(st => { if (Math.abs(st.sta - sec.sta) < 0.03) return; const g = stGeo(st); if (!g.acc || !g.acc.any) return; let u = (sec.sta - st.sta) * st.dir; if (u <= 0 || u > g.acc.uMax + 0.02) return; u = Math.min(u, g.acc.uMax - 1e-4); const polys = stAccCross(g, u); if (polys.length) out.push({ st, g, u, polys }); });
  return out;
}
function stKeyStations() {   // 附屬構造樁號（側牆／護坦／水墊末端）：加入斷面樁，各圖皆標示並繪橫斷面
  const out = [];
  state.structs.forEach(st => { const g = stGeo(st), A = g.acc; if (!A || !A.any || !A.apron && !A.walls.length) return; const u = A.uE, nm = A.walls.length ? '側牆末端' : (A.apron && A.apron.water ? '水墊末端' : '護坦末端'); out.push({ s: +(st.sta + st.dir * u).toFixed(3), ptName: `${st.name}${nm}`, priority: 4, isCurveTick: false }); });
  return out;
}
function stIncZ(inc, ra, rb) { state.structs.forEach(st => { if (ra !== undefined && (st.sta < ra - 2 || st.sta > rb + 2)) return; const pl = stPlace(st), g = stGeo(st); inc(pl.keyFloor); inc(pl.zTop); if (g.acc && g.acc.any) { if (g.acc.apron && g.acc.apron.tooth) inc(pl.zS + g.acc.apron.tooth.zb); g.acc.walls.forEach(w => inc(pl.zS + w.zb)); } }); }

/* ---------- 斷面讀值 ---------- */
const stf = (v, d = 2) => (Number.isFinite(+v) ? (+v).toFixed(d) : '—');
function stSecAt(st) {
  const L = state.sections.filter(x => Math.abs(x.sta - st.sta) < 0.03);
  return { pre: L.find(x => x.side === 'pre'), post: L.find(x => x.side === 'post'), any: L[0] };
}
function secInterp(sec, o, key) {
  const S = sec.samples; if (!S.length) return NaN; if (o <= S[0].offset) return S[0][key]; if (o >= S[S.length - 1].offset) return S[S.length - 1][key];
  let i = 0; while (i < S.length - 2 && o > S[i + 1].offset) i++;
  const a = S[i], b = S[i + 1]; return a[key] + (b[key] - a[key]) * (o - a.offset) / ((b.offset - a.offset) || 1);
}
/* 翼長自動：翼頂線(自 P2 起以 1:rs 向岸緩升)與地面(上、下游斷面較低者)相交處 → r1 */
function stAuto(st) {
  const S = stSecAt(st), secs = [S.pre, S.post].filter(Boolean); if (!secs.length && S.any) secs.push(S.any);
  const res = { L: null, R: null }; st._auto = res; st._autoMiss = {};
  if (!secs.length) return;
  const pl = stPlace(st), p = st.p;
  ['L', 'R'].forEach(side => {
    const w = stW(st, side); if (!w.auto) return; const x2 = stEff(st, side).wh + p.h1 * p.s1;
    const sg = side === 'L' ? -1 : 1, zT = pl.zS + p.h1;
    const gz = o => Math.min(...secs.map(s => secInterp(s, o, 'groundZ')));
    const lim = Math.min(...secs.map(s => side === 'L' ? (st.dir > 0 ? -s.samples[0].offset : s.samples[s.samples.length - 1].offset) : (st.dir > 0 ? s.samples[s.samples.length - 1].offset : -s.samples[0].offset)));
    let found = null;
    for (let x = x2; x <= lim - sg * (p.off || 0); x += 0.05) {
      const g = gz(st.dir * (sg * x + (p.off || 0))), top = zT + (x - x2) / Math.max(w.rs, 1e-6);
      if (Number.isFinite(g) && g >= top) { found = Math.max(0, Math.ceil((x - x2) * 10 - 1e-9) / 10); break; }
    }
    res[side] = found; if (found === null) st._autoMiss[side] = true;
  });
}


/* ---------- 壩址地形：TIN 直接取樣（含空間索引）；無 TIN 或等高線模式時以前後斷面沿樁號內插 ---------- */
let ST_TIX = null;
function stTinIndex() {
  const T = state.triangles, Pn = state.points;
  if (!T || !T.length || !Pn || !Pn.length) return null;
  if (ST_TIX && ST_TIX.T === T && ST_TIX.n === T.length && ST_TIX.P === Pn && ST_TIX.np === Pn.length) return ST_TIX;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; Pn.forEach(p => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); });
  const cell = Math.max(1, Math.sqrt(((x1 - x0) * (y1 - y0) || 1) / T.length) * 2), nx = Math.max(1, Math.ceil((x1 - x0) / cell) + 1), M = new Map();
  T.forEach((t, i) => {
    const a = Pn[t.a], b = Pn[t.b], c = Pn[t.c]; if (!a || !b || !c) return;
    const i0 = Math.floor((Math.min(a.x, b.x, c.x) - x0) / cell), i1 = Math.floor((Math.max(a.x, b.x, c.x) - x0) / cell), j0 = Math.floor((Math.min(a.y, b.y, c.y) - y0) / cell), j1 = Math.floor((Math.max(a.y, b.y, c.y) - y0) / cell);
    for (let ii = i0; ii <= i1; ii++) for (let jj = j0; jj <= j1; jj++) { const k = jj * nx + ii; let L = M.get(k); if (!L) M.set(k, L = []); L.push(i); }
  });
  ST_TIX = { T, n: T.length, P: Pn, np: Pn.length, x0, y0, cell, nx, M };
  return ST_TIX;
}
function stTinZ(x, y) {
  const I = stTinIndex(); if (!I) return null;
  const L = I.M.get(Math.floor((y - I.y0) / I.cell) * I.nx + Math.floor((x - I.x0) / I.cell)); if (!L) return null;
  let hid = null;
  for (const i of L) {
    const t = I.T[i], a = I.P[t.a], b = I.P[t.b], c = I.P[t.c];
    const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y); if (Math.abs(det) < 1e-9) continue;
    const l1 = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / det, l2 = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / det, l3 = 1 - l1 - l2;
    if (l1 >= -1e-4 && l2 >= -1e-4 && l3 >= -1e-4) { const z = l1 * a.z + l2 * b.z + l3 * c.z; if (!t.hidden) return z; if (hid === null) hid = z; }
  }
  return hid;
}
/* 沿樁號內插斷面值：s＝樁號，o＝斷面偏距；同樁號有前/後斷面時，左鄰取「後」、右鄰取「前」 */
function stSecInterpSta(s, o, key) {
  const S = state.sections; if (!S || !S.length) return NaN;
  let lo = null, hi = null;
  for (const c of S) {
    if (c.sta <= s + 1e-9 && (!lo || c.sta > lo.sta + 1e-9 || (Math.abs(c.sta - lo.sta) < 1e-9 && c.side === 'post'))) lo = c;
    if (c.sta >= s - 1e-9 && (!hi || c.sta < hi.sta - 1e-9 || (Math.abs(c.sta - hi.sta) < 1e-9 && c.side === 'pre'))) hi = c;
  }
  if (!lo) return secInterp(hi, o, key); if (!hi) return secInterp(lo, o, key);
  const a = secInterp(lo, o, key), b = secInterp(hi, o, key), L = hi.sta - lo.sta;
  if (L < 1e-9) return a; return a + (b - a) * (s - lo.sta) / L;
}
/* 回傳 {gnd(u,x) 地面, des(u,x) 設計面, surf(u,x)=min(地面,設計面)}；u=0 視為下游側 */
function stGround(st) {
  const useTin = !(typeof gmActive === 'function' && gmActive()) && !!stTinIndex(), dv = st.dir;
  const pos = (u, x) => { const s = st.sta + dv * (u === 0 ? 1e-6 : u), o = dv * (x + (st.p.off || 0)); return { s, o }; };
  const gnd = (u, x) => {
    if (useTin) { const w = stWorld(st, u, x); if (w) { const z = stTinZ(w[0], w[1]); if (z !== null && Number.isFinite(z)) return z; } }
    const q = pos(u, x); return stSecInterpSta(q.s, q.o, 'groundZ');
  };
  const des = (u, x) => { const q = pos(u, x); return stSecInterpSta(q.s, q.o, 'desZ'); };
  const surf = (u, x) => { const a = gnd(u, x), c = des(u, x), v = Math.min(a, c); return Number.isFinite(v) ? v : (Number.isFinite(a) ? a : -1e9); };
  return { gnd, des, surf, tin: useTin };
}

/* ---------- 自動開挖 ---------- */
function stNear(poly, u, x) {
  let best = 1e18, bu = 0, bx = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], c = poly[(i + 1) % poly.length], dx = c[0] - a[0], dy = c[1] - a[1], l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((u - a[0]) * dx + (x - a[1]) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
    const pu = a[0] + t * dx, px = a[1] + t * dy, d = (u - pu) * (u - pu) + (x - px) * (x - px);
    if (d < best) { best = d; bu = pu; bx = px; }
  }
  return { d: Math.sqrt(best), pu: bu, px: bx };
}
function stInPoly(poly, u, x) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > x) !== (b[1] > x) && u < (b[0] - a[0]) * (x - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
function stSimp(pts, tol) {          // 去除共線點
  const o = []; pts.forEach(q => { while (o.length >= 2) { const a = o[o.length - 2], b = o[o.length - 1], cr = Math.abs((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0])); if (cr < tol) o.pop(); else break; } o.push(q); }); return o;
}
/* 開挖：開挖底 = 基礎底面(隨基礎底斜率) − 10 cm；key 範圍再挖到 key 底 − 10 cm；基礎平面外緣外放 km 後，以 1:kx(垂直1：水平kx)往上斜，
   僅計算「地面與設計面較低者」以下（河道本身挖方已計於土方總表）。上游半邊(u<0)用上游側斷面、下游半邊用下游側斷面。 */
/* 剖面標記：{結構簡稱}{編號}-{樁號}；切點位置以距壩中心線之左/右偏距表示（面向下游） */
function stTextW(s, h) { let w = 0; for (const ch of String(s)) w += /[\u2E80-\uFFFF]/.test(ch) ? h : h * 0.62; return w; }
function stViewTxt(st) { return st.dir > 0 ? '面向下游：左岸在左' : '面向上游：左岸在右'; }   // 橫斷面依里程方向觀看
function stOffLab(x) { return Math.abs(x) < 0.005 ? '中' : (x < 0 ? '左' : '右') + stf(Math.abs(x)); }
function stAbbr(st) {
  const k = { dam: '防', sub: '副', sill: '固' }[st.type || 'dam'] || '構', m = String(st.name || '').match(/(\d+)\s*$/);
  return k + (m ? m[1] : (state.structs.filter(q => (q.type || 'dam') === (st.type || 'dam')).indexOf(st) + 1));
}
function stCutLab(st, acc) {   // 切面標示：防1-0K+003（整數）／防1-0K+014.10（有小數取兩位）
  const v = Math.round(Math.max(0, acc) * 100) / 100, k = Math.floor(v / 1000), r = v - k * 1000, intg = Math.abs(r - Math.round(r)) < 1e-9;
  return `${stAbbr(st)}-${k}K+` + (intg ? String(Math.round(r)).padStart(3, '0') : r.toFixed(2).padStart(6, '0'));
}
function stCutTag(st, lab) { return `${stAbbr(st)}-${formatStation(st.sta)}` + (lab ? ` ${lab}` : ''); }
const ST_NOACC = { any: false, apron: null, tail: null, walls: [], sills: [], sub: null, xMax: 0, uMax: -1e9, bh: () => 0, xbk: () => 0 };
function stExcav(st, noAcc) {   // noAcc：只算壩體（不含附屬構造基坑）→ 壩體開挖；附屬構造開挖＝整體−壩體
  const g0 = stGeo(st), g = noAcc ? Object.assign({}, g0, { acc: Object.assign({}, ST_NOACC, { uMax: g0.uDnB }) }) : g0, pl = stPlace(st), S = stSecAt(st), p = st.p, up = st.dir > 0 ? S.pre : S.post, dn = st.dir > 0 ? S.post : S.pre, U = up || S.any, Dn = dn || S.any;
  if (!U || !Dn) return { V: 0, Vu: 0, Vd: 0, Vk: 0, ok: false };
  const kx = Math.max(p.kx, 1e-3), km = Math.max(0, p.km), dv = st.dir, poly = g.plan;
  const gnd = (sec, x) => { const o = dv * (x + (p.off || 0)), a = secInterp(sec, o, 'groundZ'), c = secInterp(sec, o, 'desZ'), v = Math.min(a, c); return Number.isFinite(v) ? v : -1e9; };
  const GR = stGround(st), surf = GR.surf;
  const fl = x => pl.zS + g.botZ(x) - ST_CL;
  const kU0 = g.uDnB - p.k1, kU1 = g.uDnB, kX0 = -g.L.x7, kX1 = g.R.x7, hasKey = p.k > 0 && p.k1 > 0 && kX1 > kX0;
  const zk = (u, x) => { const d = Math.hypot(Math.max(kU0 - u, 0, u - kU1), Math.max(kX0 - x, 0, x - kX1)); return pl.keyFloor + (d <= km ? 0 : (d - km) / kx); };
  const zb0 = (u, x) => { if (stInPoly(poly, u, x)) return fl(x); const q = stNear(poly, u, x), f = fl(q.px); return q.d <= km ? f : f + (q.d - km) / kx; };
  const pits = stAccPits(st, g, pl.zS), zp = (u, x) => { let z = 1e9; for (const q of pits) { const d = Math.hypot(Math.max(q.u0 - u, 0, u - q.u1), Math.max(q.x0 - x, 0, x - q.x1)), v = q.z + (d <= km ? 0 : (d - km) / kx); if (v < z) z = v; } return z; };
  const zd = (u, x) => { const z = zb0(u, x); if (!hasKey) return z; const k = zk(u, x); return k < z ? k : z; };
  const zs = pits.length ? (u, x) => { const a = zd(u, x), c = zp(u, x); return c < a ? c : a; } : zd;
  let zmax = -1e9; [U, Dn].forEach(sec => sec.samples.forEach(s => { const v = Math.min(s.groundZ, s.desZ); if (Number.isFinite(v)) zmax = Math.max(zmax, v); }));
  const zLow = Math.min(pl.keyFloor, ...pits.map(q => q.z)), depthMax = Math.max(0.5, Math.min(25, zmax - zLow)), E = km + kx * depthMax + 0.5, AX = g.acc.xMax;
  const x0 = Math.min(g.xmin, -AX) - E, x1 = Math.max(g.xmax, AX) + E, u0 = g.uUpB - E, u1 = Math.max(g.uDnB, g.acc.uMax) + E, cell = Math.max(0.2, Math.max(x1 - x0, u1 - u0) / 260);
  const NU = Math.floor((u1 - u0) / cell) + 1, NX = Math.floor((x1 - x0) / cell) + 1, Dg = new Float64Array(NU * NX);
  let Vu = 0, Vd = 0, Vb = 0, Va = 0;
  for (let i = 0; i < NU; i++) { const u = u0 + i * cell; for (let j = 0; j < NX; j++) {
    const x = x0 + j * cell, sf = surf(u, x), b = zb0(u, x), z0 = hasKey ? Math.min(b, zk(u, x)) : b, z = pits.length ? Math.min(z0, zp(u, x)) : z0, d = sf - z; Dg[i * NX + j] = d;
    if (d > 0) { const v = d * cell * cell; if (u < 0) Vu += v; else Vd += v; if (z < z0 - 1e-9) Va += v - Math.max(0, sf - z0) * cell * cell; }
    if (sf - b > 0) Vb += (sf - b) * cell * cell;
  } }
  const V = Vu + Vd;
  // 開挖外緣：網格節點 d＝地面−開挖面 的 0 等值線（marching squares），串成折線
  const segs = [], P = (i, j) => [u0 + i * cell, x0 + j * cell], itp = (pa, pb, va, vb) => { const t = va / ((va - vb) || 1e-12); return [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]; };
  for (let i = 0; i + 1 < NU; i++) for (let j = 0; j + 1 < NX; j++) {
    const v = [Dg[i * NX + j], Dg[(i + 1) * NX + j], Dg[(i + 1) * NX + j + 1], Dg[i * NX + j + 1]], c = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
    let m = 0; v.forEach((w, k) => { if (w > 0) m |= 1 << k; }); if (m === 0 || m === 15) continue;
    const e = k => itp(c[k], c[(k + 1) % 4], v[k], v[(k + 1) % 4]), cr = []; for (let k = 0; k < 4; k++) if ((v[k] > 0) !== (v[(k + 1) % 4] > 0)) cr.push(e(k));
    if (cr.length === 2) segs.push(cr); else if (cr.length === 4) { segs.push([cr[0], cr[1]]); segs.push([cr[2], cr[3]]); }
  }
  const kf = q => q[0].toFixed(4) + ',' + q[1].toFixed(4), adj = new Map(), used = new Uint8Array(segs.length);
  segs.forEach((sg, i) => sg.forEach(q => { const k = kf(q); if (!adj.has(k)) adj.set(k, []); adj.get(k).push(i); }));
  const outl = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue; used[i] = 1; const line = [segs[i][0], segs[i][1]];
    for (const dir of [1, 0]) { for (;;) { const end = dir ? line[line.length - 1] : line[0], nb = (adj.get(kf(end)) || []).find(k => !used[k]); if (nb === undefined) break; used[nb] = 1; const sg = segs[nb], nx = kf(sg[0]) === kf(end) ? sg[1] : sg[0]; if (dir) line.push(nx); else line.unshift(nx); } }
    if (line.length > 3) outl.push(stSimp(line, cell * cell * 0.02));
  }
  const loop = outl.length ? outl.reduce((a, c) => (c.length > a.length ? c : a), outl[0]) : [];
  // 斷面外形：順水流向(壩軸 x=0) 與 壩軸向(取各 u 的最深者，含 key 處)
  const profs = []; { let cur = null; for (let u = u0; u <= u1 + 1e-9; u += 0.05) { const sf = surf(u, 0), z = zs(u, 0); if (sf > z) { if (!cur) cur = [[u, sf]]; cur.push([u, z]); } else if (cur) { cur.push([u, sf]); profs.push(stSimp(cur, 1e-4)); cur = null; } } if (cur) profs.push(stSimp(cur, 1e-4)); }
  const kMid = (kU0 + kU1) / 2, crossFor = sec => {
    const pts = []; let xa = null, xb = null;
    for (let x = x0; x <= x1; x += 0.1) { const z = Math.min(zs(0, x), hasKey ? zs(kMid, x) : 1e9); if (gnd(sec, x) > z) { if (xa === null) xa = x; xb = x; } }
    if (xa !== null) { pts.push([xa, gnd(sec, xa)]); for (let x = xa; x <= xb + 1e-9; x += 0.1) pts.push([x, Math.min(zs(0, x), hasKey ? zs(kMid, x) : 1e9)]); pts.push([xb, gnd(sec, xb)]); }
    return stSimp(pts, 1e-4);
  };
  // ---- 各變化段剖面：於壩軸向斷面形狀變化點切順水流剖面，開挖面積 A，以平均斷面法計算體積；兩端外推至開挖面積為 0 處
  const areaAt = (x, du) => { let A = 0, ua = null, ub = null; for (let u = u0 + du / 2; u < u1; u += du) { const d = surf(u, x) - zs(u, x); if (d > 0) { A += d * du; if (ua === null) ua = u; ub = u; } } return { A, ua, ub }; };
  const AC = g.acc, xAcc = []; if (AC.apron) xAcc.push(-AC.bh(AC.toe, -1), AC.bh(AC.toe, 1)); AC.walls.forEach(w => xAcc.push(w.sd * (w.xi + w.tw), w.sd * w.xo));
  const xsC = [...new Set(g.xs.concat([0], xAcc).map(v => +v.toFixed(4)))].sort((a, c) => a - c).filter((v, i, a) => !i || v - a[i - 1] > 1e-3);
  const hasK = p.k > 0 && p.k1 > 0;
  const cuts = xsC.map((x, i) => {
    const r = areaAt(x, 0.1), key = hasK && Math.abs(x) <= g.kw(x) + 1e-9, cut = { x, lab: stOffLab(x), A: r.A, Ac: g.A(x, key), key, ua: r.ua, ub: r.ub, top: g.topZ(x), bot: g.botZ(x) };
    const ga = Math.max(u0, (r.ua !== null ? r.ua : g.uUpB) - 2), gb = Math.min(u1, (r.ub !== null ? r.ub : g.uDnB) + 2), gl = [], dl = [];
    for (let u = ga; u <= gb + 1e-9; u += 0.1) { const a = GR.gnd(u, x), c = GR.des(u, x); if (Number.isFinite(a)) gl.push([u, a]); if (Number.isFinite(c)) dl.push([u, c]); }
    cut.gl = stSimp(gl, 1e-4); cut.dl = stSimp(dl, 1e-4);
    cut.ex = [];
    if (r.ua !== null) { let cur = null; for (let u = r.ua - 0.05; u <= r.ub + 0.1; u += 0.05) { const sf = surf(u, x), z = zs(u, x); if (sf > z) { if (!cur) cur = [[u, sf]]; cur.push([u, z]); } else if (cur) { cur.push([u, sf]); cut.ex.push(stSimp(cur, 1e-4)); cur = null; } } if (cur) cut.ex.push(stSimp(cur, 1e-4)); }
    return cut;
  });
  const endSearch = (xs0, sg) => { let x = xs0; for (let k = 0; k < 600; k++) { const nx = x + sg * 0.2; if ((sg < 0 && nx < x0) || (sg > 0 && nx > x1)) return nx; if (areaAt(nx, 0.2).A < 1e-3) return nx; x = nx; } return x; };
  const xEL = cuts.length && cuts[0].A > 1e-3 ? endSearch(cuts[0].x, -1) : (cuts.length ? cuts[0].x : 0), xER = cuts.length && cuts[cuts.length - 1].A > 1e-3 ? endSearch(cuts[cuts.length - 1].x, 1) : (cuts.length ? cuts[cuts.length - 1].x : 0);
  // 標準圖由左至右（圖左＝右岸翼端，x 最大）編號 S1、S2…；累距自圖左翼端 x＝g.xmax 起算
  const xRef = g.xmax; cuts.sort((a, c) => c.x - a.x); cuts.forEach((c, i) => { c.id = 'S' + (i + 1); c.acc = xRef - c.x; c.lab = stCutLab(st, c.acc); });   // 標示＝結構物簡稱-累距（整數 0K+003、有小數兩位 0K+014.10）
  const seq = [{ x: xER, A: 0, lab: '端', acc: xRef - xER }].concat(cuts).concat([{ x: xEL, A: 0, lab: '端', acc: xRef - xEL }]).filter((c, i, a) => !i || a[i - 1].x - c.x > 1e-6 || c.lab !== '端');
  const vrows = []; let Vsec = 0;
  for (let i = 0; i + 1 < seq.length; i++) { const a = seq[i], b = seq[i + 1], L = a.x - b.x; if (L < 1e-9) continue; const v = (a.A + b.A) / 2 * L; Vsec += v; vrows.push({ a: a.lab, b: b.lab, xa: a.x, xb: b.x, accA: a.acc, accB: b.acc, L, Aa: a.A, Ab: b.A, V: v }); }
  st[noAcc ? '_exFD' : '_exF'] = { surf, zs, gnd: GR.gnd, des: GR.des, kMid: (kU0 + kU1) / 2, hasKey, u0, u1, x0, x1, tin: GR.tin };
  return { V: Vsec, Vgrid: V, Vu, Vd, Vk: V - Vb - Va, Vacc: Va, ok: true, loop, outl, profs, crossU: crossFor(U), crossD: crossFor(Dn), cuts, vrows, xEL, xER, tin: GR.tin };
}

/* ---------- 數量（各斷面分段的切頭公式） ---------- */
function stQty(st) {
  const g = stGeo(st), p = st.p, SQ = v => Math.sqrt(1 + v * v), nh = g.holes.length, dh = p.dh || 0, xs = g.xs;
  let V = 0, Va = 0, Vs = 0, F = 0, Vkey = 0; const segs = [];
  const fk = SQ(p.s3) + SQ(p.s2);
  const Fx = x => { const zb = g.botZ(x); return zb < 0 ? -zb * fk : 0; };
  for (let i = 0; i + 1 < xs.length; i++) {
    const xa = xs[i], xb = xs[i + 1], L = xb - xa; if (L < 1e-9) continue;
    const xm = (xa + xb) / 2, ky = p.k > 0 && p.k1 > 0 && Math.abs(xm) <= g.kw(xm) + 1e-9;
    const A1 = g.A(xa + 1e-9 * Math.sign(L), ky), A2 = g.A(xb - 1e-9, ky), Am = g.A(xm, ky);
    const vv = L / 3 * (A1 + A2 + Math.sqrt(A1 * A2)), ff = (Fx(xa) + Fx(xb)) / 2 * L;
    segs.push({ x0: xa, x1: xb, L, A1, A2, V: vv, Va: L * (A1 + A2) / 2, Vs: L / 6 * (A1 + 4 * Am + A2), F: ff, key: ky });
    V += vv; Va += L * (A1 + A2) / 2; Vs += L / 6 * (A1 + 4 * Am + A2); F += ff; if (ky) Vkey += L * p.k * p.k1;
  }
  const bw = p.d1 + (p.s2 + p.s3) * (p.h2 + p.h3), drain = g.holes.reduce((a, [, z]) => a + Math.PI * dh * dh / 4 * (g.uD(z) - g.uU(z)), 0), wear = (p.w + 2 * p.h1 * SQ(p.s1)) * p.d1;
  const ex = st._exD || st._ex || stExcav(st), pl = stPlace(st), rows = [];   // v5.4：壩體開挖（不含附屬構造基坑）
  rows.push({ it: '210kg/cm² 混凝土（切頭公式，含 key）', u: 'm³', v: V - drain, fx: `ΣV ${stf(V)}（${segs.length} 區段，V=L/3×(A1+A2+√(A1×A2))）` + (drain > 0 ? ` − 排水孔 ${nh} 孔×π/4×${stf(dh)}²×各孔處壩厚＝${stf(drain, 3)}` : '') });
  void bw;
  rows.push({ it: '　其中 key 混凝土', u: 'm³', v: Vkey, fx: `k×k1×key長 ＝ ${stf(p.k)}×${stf(p.k1)}×${stf(Vkey / Math.max(1e-9, p.k * p.k1))}` });
  rows.push({ it: '（參考）平均斷面法混凝土', u: 'm³', v: Va - drain, fx: 'Σ(A1+A2)/2×L − 排水孔（偏大）' });
  rows.push({ it: '（參考）Simpson 精算混凝土', u: 'm³', v: Vs - drain, fx: '各區段 A(x) 為二次式，Simpson 為精確值' });
  rows.push({ it: '壩體模板（上、下游壩面；不含壩翼兩側面、翼端面）', u: 'm²', v: F, fx: `Σ L×(起迄面長)/2；面長＝(溢洪口底以下深)×(√(1+s3²)+√(1+s2²))` });
  rows.push({ it: '溢洪口抗磨損設施面積', u: 'm²', v: wear, fx: `(w+2×h1×√(1+s1²))×d1 ＝ (${stf(p.w)}+2×${stf(p.h1)}×${stf(SQ(p.s1), 4)})×${stf(p.d1)}` });
  if (nh > 0) { const zs = [...new Set(g.holes.map(h => h[1].toFixed(3)))], cap = g.holes.cap || nh, want = Math.round(p.nh || 0); rows.push({ it: `排水孔 φ${stf(dh * 100, 0)}cm`, u: '處', v: nh, fx: (want > 0 ? (want > cap ? `⚠ 指定 ${want} 孔超過規範範圍可配置上限 ${cap} 孔，已配置 ${cap} 孔；` : `指定 ${want} 孔（上限 ${cap}）；`) : `依規範排滿 ${cap} 孔；`) + `三角形交錯排列，間距 ${stf(p.hsp)} m、${zs.length} 層；底層沿下游溪床（孔底＝河床），頂層距溢洪口底 ≥ ${stf(p.hcl)} m，範圍寬 ${stf(p.hwx > 0 ? Math.min(p.hwx, p.w + 2 * p.h1 * p.s1) : p.w + 2 * p.h1 * p.s1)} m（不超過溢洪口頂寬）${p.hb > 0 ? `，底層孔底高出溪床 ${stf(p.hb)} m` : ''}` }); }
  rows.push({ it: '結構物開挖（各變化段剖面，平均斷面法；設計面以下，含邊坡、key 加挖' + (g.acc && g.acc.any ? '；不含附屬構造，附屬構造開挖列於護坦' : '') + '）', u: 'm³', v: ex.V, fx: ex.ok ? `${ex.cuts.length} 個剖面（${ex.cuts.map(c => c.lab + '(' + stf(c.acc) + ')').join('、')}）＋兩端收斂至面積 0（x=${stf(ex.xEL)}、${stf(ex.xER)}）；V＝Σ(A1+A2)/2×Δx。開挖底＝基礎底面−${ST_CL * 100}cm（EL ${stf(pl.floor)}），key 處加挖至 key 底−${ST_CL * 100}cm（EL ${stf(pl.keyFloor)}），外放 ${stf(p.km)} m，邊坡 1:${p.kx}；地形取${ex.tin ? ' TIN' : '前後斷面內插'}` : '尚無斷面' });
  const AQ = { V: 0 };   // v5.4：護坦／側牆／尾檻改為獨立結構物，數量見各自（st._accQ）
  if (ex.ok) rows.push({ it: '（參考）網格法開挖', u: 'm³', v: ex.Vgrid, fx: `0.2 m 級網格逐格積分；上游側 ${stf(ex.Vu)} ＋ 下游側 ${stf(ex.Vd)}（其中 key 加挖 ${stf(ex.Vk)}${ex.Vacc > 0.005 ? `、附屬構造加挖 ${stf(ex.Vacc)}` : ''}）；與剖面法差 ${stf(ex.V - ex.Vgrid)} m³（${stf(ex.Vgrid ? (ex.V - ex.Vgrid) / ex.Vgrid * 100 : 0, 1)}%）` });
  const tSeg = [['區段', 'x 範圍(m)', 'L(m)', 'A1/A2(m²)', 'V切頭(m³)', 'V Simpson', '模板(m²)'], ...segs.map((s, i) => [String(i + 1) + (s.key ? '·key' : ''), stf(s.x0) + '~' + stf(s.x1), stf(s.L), stf(s.A1) + '/' + stf(s.A2), stf(s.V, 3), stf(s.Vs, 3), stf(s.F)]), ['合計', '', '', '', stf(V, 3), stf(Vs, 3), stf(F)]];
  const tExc = ex.ok ? [['剖面區間', '累距(m)', 'Δx(m)', '平均A(m²)', 'V(m³)'], ...ex.vrows.map(r => [r.a + '～' + r.b, stf(r.accA) + '～' + stf(r.accB), stf(r.L), stf((r.Aa + r.Ab) / 2), stf(r.V, 2)]), ['合計', '', '', '', stf(ex.V, 2)]] : null;
  return { rows, tSeg, tExc, segs, V: V - drain, Vacc: AQ.V, F, ex: ex.V, wear, Vkey, Va, Vs: Vs - drain };
}
/* v5.4 附屬構造（獨立結構物）數量：護坦（含截水牆、附屬構造基坑開挖）／側牆／尾檻 */
const ST_ACC_K = ['apron', 'wall', 'tail'];
function stAccLabel(st, k) { return k === 'apron' ? (st.a.tail.on ? '水墊' : '護坦') : (k === 'wall' ? '側牆' : '尾檻'); }
function stAccName(st, k) { return (st.a[k] && st.a[k].nm) || `${stAbbr(st)}-${stAccLabel(st, k)}`; }
function stAccList(st) { return st && (st.type || 'dam') === 'dam' && st.a ? ST_ACC_K.filter(k => st.a[k] && st.a[k].on) : []; }
function stAccRange(st, k) {   // 順水流 u 範圍
  const g = stGeo(st), R = g.acc; if (!R) return null;
  if (k === 'apron' && R.apron) return [R.apron.u0, R.apron.u1];
  if (k === 'wall' && R.walls.length) return [R.walls[0].uS, R.walls[0].u1];
  if (k === 'tail' && R.tail) return [R.tail.u0, R.tail.u1];
  return null;
}
function stAccOwnQ(st) {
  const g = stGeo(st), out = {}; if (!g.acc || !g.acc.any) return out;
  const AQ = stAccQty(st, g), exA = st._ex && st._ex.ok && st._exD && st._exD.ok ? Math.max(0, st._ex.V - st._exD.V) : 0;
  stAccList(st).forEach(k => {
    const rows = AQ.rows.filter(r => r.g === k).map(r => Object.assign({}, r, { it: r.it.replace(/^附屬：/, '') })), V = rows.filter(r => r.u === 'm³' && /混凝土/.test(r.it)).reduce((a, r) => a + r.v, 0), F = rows.filter(r => r.u === 'm²' && /模板/.test(r.it)).reduce((a, r) => a + r.v, 0);
    let ex = 0; if (k === 'apron' && st._ex && st._ex.ok) { ex = exA; rows.push({ it: '開挖（附屬構造基坑：護坦／水墊、截水牆、側牆、尾檻範圍）', u: 'm³', v: exA, fx: `＝壩址整體開挖 ${stf(st._ex.V)} − 壩體開挖 ${stf(st._exD.V)}（兩者皆為各變化段剖面平均斷面法）` }); }
    const ur = stAccRange(st, k); out[k] = { rows, V, F, ex, u0: ur ? ur[0] : 0, u1: ur ? ur[1] : 0 };
  });
  return out;
}
let ST_BUSY = false, ST_SIG = '';
function stRecalc(noUI) {
  let need = false;
  [...state.structs].sort((a, b) => (a.par ? 1 : 0) - (b.par ? 1 : 0)).forEach(st => {
    try {
      if (st.par) { const par = state.structs.find(q => q.id === st.par); if (par) { const u = stChildU(par, st); st.zB = +(stPlace(par).zBed + stBedDz(par, u) - st.p.h3).toFixed(3); } } else
      if (st.link) st.zB = (st._zT !== undefined && st._zT !== null) ? st._zT : stZBlink(st); else if (st.zB === null || st.zB === undefined) st.zB = stZBlink(st);
      stBedSample(st); stAuto(st); { const ga = stGeo(st); st._exD = ga.acc && ga.acc.any ? stExcav(st, true) : null; if (!st._exD) st._exFD = null; } st._ex = stExcav(st); st._q = stQty(st); st._accQ = stAccOwnQ(st);
      const g = stGeo(st), r = Math.max(g.xmax, -g.xmin) + 6; let nd = false;
      if (st._autoMiss && (st._autoMiss.L || st._autoMiss.R) && (st._boost || 0) < 50) { if ((st._it || 0) < 6) { st._boost = (st._boost || 0) + 10; nd = true; } }
      else if (st._reachCov !== undefined && r > st._reachCov + 0.01 && (st._it || 0) < 6) nd = true;
      if (nd) { st._it = (st._it || 0) + 1; need = true; }
    } catch (e) { st._q = null; console.error('stRecalc', e); }
  });
  if (!noUI) stRenderUI(); else stUpdDyn();
  if (need && !ST_BUSY && !noUI) { ST_BUSY = true; setTimeout(() => { ST_BUSY = false; rebuildAlignmentAndSections(); }, 0); }
}

/* ---------- 新增 / 修改 ---------- */
/* 設計線隨壩：使「上游側(里程小側)設計高」等於指定值 → 於該樁號加/改 VIP（其餘 VIP 不動） */
function stShiftDesignBefore(sta, target) {
  if (!Number.isFinite(target)) return;
  ensureVipMode(); buildProfileModel();
  const d = target - getDesignZBefore(sta); if (Math.abs(d) < 5e-4) return;
  const P = state.profile; let v = P.vips.find(q => Math.abs(q.sta - sta) < 0.3);
  if (!v) { v = { sta: +(+sta).toFixed(3), z: +evalProfileLine(sta).toFixed(3), L: 0 }; P.vips.push(v); P.vips.sort((a, b) => a.sta - b.sta); }
  v.z = +(v.z + d).toFixed(3);
}
function stFitDesign(st, zBt) {   // 壩底高程為 zBt 時，固定側(里程小側)設計高應為：dir>0 → 溢洪口底；dir<0 → 下游河床
  const p = st.p; stShiftDesignBefore(st.sta, st.dir > 0 ? zBt + p.h2 + p.h3 : zBt + p.h3);
}
function stCommitMove(st) {   // 連動：壩被移動後，設計線跟著調整；獨立：不動
  if (st.link && st._zT !== undefined && st._zT !== null) { const z = st._zT; st._zT = null; pushUndoSnapshotIfNeeded(); stFitDesign(st, z); }
  st._zT = null;
}
function pushUndoSnapshotIfNeeded() {}
function stDownDir(sta) {   // 水流順下坡：以中心線地面高程比較樁號前後
  const S = state.sections; if (S.length < 2) return 1;
  const zAt = s => { s = Math.max(S[0].sta, Math.min(S[S.length - 1].sta, s)); let i = 0; while (i < S.length - 2 && S[i + 1].sta < s) i++; const a = S[i], b = S[i + 1]; return a.groundCenter + (b.groundCenter - a.groundCenter) * (s - a.sta) / ((b.sta - a.sta) || 1); };
  return zAt(sta + 3) <= zAt(sta - 3) ? 1 : -1;
}
function stAdd(sta, typeId, dir, h2) {
  if (!dir) { const o = state.structs.filter(q => !q.par); dir = o.length ? o[0].dir : stDownDir(+sta); }   // 水流方向：沿用既有結構物（全線一致），否則依地面順下坡
  typeId = typeId || 'dam';
  const cur = state.structs[state.structSel], same = cur && cur.type === typeId && !cur.par ? cur : null;
  pushUndoSnapshot();
  const k = state.structs.filter(q => q.type === typeId && !q.par).length + 1, d = same ? { p: same.p, w: JSON.parse(JSON.stringify(same.w)), a: same.a } : stPreset(typeId);
  const st = stNorm({ type: typeId, sta: +(+sta).toFixed(2), dir: dir || 1, name: stTypeLabel(typeId) + k, p: d.p, w: d.w, a: d.a, eq: same ? same.eq : false, link: true });
  if (h2 > 0) st.p.h2 = +h2;
  st.zB = stZBlink(st);
  state.structs.push(st); state.structs.sort((a, c) => a.sta - c.sta); state.structSel = state.structs.indexOf(st);
  rebuildAlignmentAndSections();
  updateStatus(`🏗 已於 ${formatStation(st.sta)} 放置「${st.name}」：連動設計線（落差 ΔZ=${stf(st.dir * st.p.h2)}），壩底 EL ${stf(st.zB)}、溢洪口底 EL ${stf(st.zB + st.p.h2 + st.p.h3)}。`);
}
function stAddFromInputs() {
  const s = parseFloat(document.getElementById('stSta').value);
  if (isNaN(s)) { updateStatus('⚠ 請先輸入樁號(m)，或按「圖面點擊放置」直接在平面圖點選。'); return; }
  stAdd(s, (document.getElementById('stKind') || {}).value || 'dam', +document.getElementById('stDir').value);
}
function stSelect(i) { state.structSel = i; state.stAccSel = null; stRenderUI(); const st = state.structs[i]; if (st) { const k = state.sections.findIndex(x => Math.abs(x.sta - st.sta) < 0.03); if (k >= 0) selectStationIndex(k); } requestRedraw(); }
function stDel(i) {
  const st = state.structs[i]; if (!st) return; pushUndoSnapshot();
  if (st.par) { const par = state.structs.find(q => q.id === st.par); if (par) { if (st.type === 'sub') par.a.sub.on = false; else { par.a.sill.n = Math.max(0, Math.round(par.a.sill.n) - 1); if (par.a.sill.n === 0) par.a.sill.on = false; } } }
  state.structs = state.structs.filter(q => q !== st && q.par !== st.id); state.structSel = Math.min(state.structSel, state.structs.length - 1); ST_SIG = ''; rebuildAlignmentAndSections(); return;
  state.structs.splice(i, 1); state.structSel = Math.min(state.structSel, state.structs.length - 1); rebuildAlignmentAndSections(); }
function stEditField(i, f, el) {
  const st = state.structs[i]; if (!st) return;
  pushUndoSnapshot();
  if (f === 'name') st.name = String(el.value).trim() || st.name;
  else if (f === 'sta') { const v = parseFloat(el.value); if (!isNaN(v) && !st.par) st.sta = +v.toFixed(2); }
  else if (f === 'dir') { st.dir = +el.value < 0 ? -1 : 1; }
  st._it = 0; st._boost = 0;
  const cur = st; state.structs.sort((a, c) => a.sta - c.sta); state.structSel = state.structs.indexOf(cur);
  rebuildAlignmentAndSections();
}
/* 縱斷面落差表 ↔ 結構物（編輯 sid 列） */
function stDropEdit(sid, field, val) {
  const st = state.structs.find(s => s.id === sid); if (!st) return;
  pushUndoSnapshot();
  if (field === 'name') st.name = String(val).trim() || st.name;
  else if (field === 'sta') { const v = parseFloat(val); if (!isNaN(v)) { st.sta = +v.toFixed(2); state.structs.sort((a, c) => a.sta - c.sta); } }
  else if (field === 'dz' || field === 'zd') {
    let v = parseFloat(val); if (isNaN(v)) return; if (field === 'zd') v = getDesignZBefore(st.sta) - v;
    if (st.link) { if (Math.abs(v) < 0.05) return; st.dir = v < 0 ? -1 : 1; st.p.h2 = +Math.abs(v).toFixed(3); st.dz = +v.toFixed(4); }
    else st.dz = +v.toFixed(4);
  }
  else if (field === 'zb') { const v = parseFloat(val); if (!isNaN(v)) stShiftDesignBefore(st.sta, v); }
  st._it = 0; st._boost = 0; state.structSel = state.structs.indexOf(st);
  setTimeout(rebuildAlignmentAndSections, 0);
}
function stDelById(sid) { const i = state.structs.findIndex(s => s.id === sid); if (i >= 0) stDel(i); }
function stGetPath(st, path) { let o = st; for (const k of path.split('.')) { if (o === undefined || o === null) return undefined; o = o[k]; } return o; }
function stSetPath(st, path, v) { const ks = path.split('.'); let o = st; for (const k of ks.slice(0, -1)) o = o[k]; o[ks[ks.length - 1]] = v; }
function stDefOf(st, path) {
  if (path === 'zB') return stZBlink(st);
  const d = st.type && st.type !== 'dam' ? stPreset(st.type) : stDefaults(), ks = path.split('.'); let o = d; for (const k of ks) { if (o === undefined) return undefined; o = o[k]; } return o;
}
function stMinOf(path) {
  const ks = path.split('.'), k = ks[ks.length - 1]; if (path === 'zB') return -1e9;
  if (ks[0] === 'a') { const q = ST_A.find(r => r[0] === ks[1] && r[1] === k); return q ? q[5] : -1; }
  const q = ks[0] === 'p' ? ST_P.find(r => r[0] === k) : ST_W.find(r => r[0] === k); return q ? q[4] : -1;
}
function stTagOf(path) { const ks = path.split('.'); return ks[0] === 'p' ? ks[1] : (ks[0] === 'w' ? ks[2] + ks[1] : path); }
const stNullable = path => { const ks = path.split('.'); if (ks[0] !== 'a') return false; const q = ST_A.find(r => r[0] === ks[1] && r[1] === ks[2]); return !!(q && q[3] === null); };
/* 輸入：oninput 即時更新圖面（不重建表單），onchange 才完整重算（斷面寬度/自動翼長） */
let ST_TOUCH = false;
function stApplyVal(st, path, v) {
  if (path === 'zB') { if (st.link) st._zT = +v.toFixed(3); else st.zB = +v.toFixed(3); }
  else {
    if (path === 'p.nh' || path === 'a.sill.n') v = Math.max(0, Math.round(v));
    stSetPath(st, path, +v.toFixed(4));
    if (path.endsWith('.r1')) { const sd = path.split('.')[1]; stSetPath(st, 'w.' + sd + '.auto', false); }
    if (st.p.wsp) {   // v6.3：溢洪口左右分開：w＝左半寬＋右半寬；改 w 則兩側各取一半
      if (/^w\.[LR]\.wh$/.test(path)) st.p.w = +((stW(st, 'L').wh || 0) + (stW(st, 'R').wh || 0)).toFixed(4);
      else if (path === 'p.w') ['L', 'R'].forEach(sd => { st.w[sd].wh = +(st.p.w / 2).toFixed(4); });
    }
    if (st.type === 'sill') {   // v6.3：固床工端面 r5（退階長）與 1:ns（坡）互相連動，改任一個都生效
      const Ht = Math.max(1e-6, st.p.h2 + st.p.h3), sync = sd => { const w = st.w[sd]; if (path === 'w.' + sd + '.r5') w.ns = +(w.r5 / Ht).toFixed(4); else w.r5 = +((w.ns || 0) * Ht).toFixed(4); };
      if (/^w\.[LR]\.(r5|ns)$/.test(path)) sync(path.split('.')[1]); else if (path === 'p.h2' || path === 'p.h3') ['L', 'R'].forEach(sync);
    }
  }
}
function stLive(el) {
  const st = state.structs[state.structSel]; if (!st) return;
  const path = el.dataset.path, v = parseFloat(el.value), mn = stMinOf(path);
  if (isNaN(v) || v <= mn) return;
  if (!ST_TOUCH) { pushUndoSnapshot(); ST_TOUCH = true; }
  stApplyVal(st, path, v); stRecalc(true); requestRedraw();
}
function stCommit(el) {
  ST_TOUCH = false;
  const st = state.structs[state.structSel]; if (!st) return;
  const path = el.dataset.path, v = parseFloat(el.value), mn = stMinOf(path);
  if (String(el.value).trim() === '' && stNullable(path)) { pushUndoSnapshot(); stSetPath(st, path, null); st._it = 0; st._boost = 0; rebuildAlignmentAndSections(); return; }
  if (isNaN(v) || v <= mn) { updateStatus(`⚠ 欄位輸入不合理(需大於 ${mn > -1e8 ? mn : '—'})，已還原。`); stUpdDyn(true); return; }
  stApplyVal(st, path, v); stCommitMove(st); st._it = 0; st._boost = 0; rebuildAlignmentAndSections();
}
function stRst(path) { const st = state.structs[state.structSel]; if (!st) return; const d = stDefOf(st, path); if (d === undefined) return; pushUndoSnapshot(); if (path === 'zB') { st.link = true; } else stSetPath(st, path, d); st._it = 0; st._boost = 0; rebuildAlignmentAndSections(); }
function stSetFlag(path, v) {
  const st = state.structs[state.structSel]; if (!st) return; pushUndoSnapshot();
  if (path === 'eq' && v) { st.w.L = { ...st.w.L }; }
  if (path === 'eq' && !v && st.eq) st.w.R = { ...st.w.L };
  if (path === 'link') { st.link = v; if (v) st.dz = +(st.dir * st.p.h2).toFixed(4); }
  else if (path === 'wsp') { st.p.wsp = v ? 1 : 0; ['L', 'R'].forEach(sd => { st.w[sd].wh = +(st.p.w / 2).toFixed(4); }); }
  else stSetPath(st, path, v);
  st._it = 0; st._boost = 0; ST_SIG = ''; rebuildAlignmentAndSections();
}
function stResetAll() {
  const st = state.structs[state.structSel]; if (!st) return; pushUndoSnapshot();
  const d = stDefaults(); st.p = d.p; st.w = d.w; st.eq = false; st.link = true; st._it = 0; st._boost = 0; ST_SIG = ''; rebuildAlignmentAndSections();
  updateStatus('已還原「' + st.name + '」所有參數為預設值。');
}
function stHLset(tag, focus) { state.stHL = state.stHL || {}; state.stHL[focus ? 'focus' : 'hover'] = tag; requestRedraw(); }
function stHLclr(tag, focus) { state.stHL = state.stHL || {}; if (state.stHL[focus ? 'focus' : 'hover'] === tag) state.stHL[focus ? 'focus' : 'hover'] = null; requestRedraw(); }

/* ---------- 左側面板 ---------- */
(function () { const s = document.createElement('style'); s.textContent = '.stlab{display:flex;justify-content:space-between;align-items:center;gap:4px;font-size:10.5px;color:var(--text-muted);padding:1px 2px;border-radius:3px}.stlab:hover{background:rgba(255,79,216,.10)}.stlab input{width:54px}.stlab input:focus{border-color:#ff4fd8!important;box-shadow:0 0 0 1px #ff4fd8}.stmk{font-size:9px;min-width:26px;display:inline-block}.stmk a{cursor:pointer;color:#c2410c}'; document.head.appendChild(s); })();
const stIdOf = path => 'stf_' + path.replace(/\./g, '_');
function stFld(path, lab, step, w) {
  const tag = stTagOf(path), id = stIdOf(path);
  return `<label class="stlab" onmouseenter="stHLset('${tag}')" onmouseleave="stHLclr('${tag}')"><span>${lab}</span><span style="display:flex;align-items:center;gap:2px;"><input id="${id}" data-path="${path}" type="number" class="input-num" ${w ? `style="width:${w}px"` : ''} step="${step || 0.1}" onfocus="stHLset('${tag}',true)" onblur="stHLclr('${tag}',true)" oninput="stLive(this)" onchange="stCommit(this)"><span class="stmk" id="stm_${id}"></span></span></label>`;
}
function stInp(path, step, w, lab) {   // 只有輸入框（用於左右並排表格；名稱在列首）
  const tag = stTagOf(path), id = stIdOf(path);
  return `<span class="stlab stin" data-lab="${escAttr(lab || '')}" onmouseenter="stHLset('${tag}')" onmouseleave="stHLclr('${tag}')"><input id="${id}" data-path="${path}" type="number" class="input-num" style="width:${w || 58}px" step="${step || 0.1}" onfocus="stHLset('${tag}',true)" onblur="stHLclr('${tag}',true)" oninput="stLive(this)" onchange="stCommit(this)"><span class="stmk" id="stm_${id}"></span></span>`;
}
/* 左右對稱排版：每列＝一個部位，左側值與右側值並排；單側項目以兩欄網格排列 */
function stLRTable(rows, hL, hR) {   // rows: {lab, tip, L, R}｜{lab, tip, one}（單一值橫跨兩欄）｜{hdr:true}
  let h = '<div class="stlr">';
  if (hL !== undefined) h += `<div class="stlr-h0"></div><div class="stlr-h">${hL}</div><div class="stlr-h">${hR}</div>`;
  rows.forEach(r => {
    if (r.hdr) { h += `<div class="stlr-h0"></div><div class="stlr-h">左側</div><div class="stlr-h">右側</div>`; return; }
    h += `<div class="stlr-l" title="${escAttr(r.tip || '')}">${r.lab}</div>` + (r.one !== undefined ? `<div class="stlr-c stlr-one">${r.one}</div>` : `<div class="stlr-c">${r.L}</div><div class="stlr-c">${r.R}</div>`);
  });
  return h + '</div>';
}
function stAccGroupHTML(sel, k) {   // 一個部位一列：左右成對者並排（左側｜右側），單一值橫跨兩欄；跟隨說明放在滑鼠提示
  const qs = ST_A.filter(q => q[0] === k), rows = [], done = new Set();
  const stepOf = q => q[7] ? 1 : (q[1] === 'r' ? 0.01 : 0.05), tipOf = q => (q[2] + (q[6] ? `｜空白＝跟隨預設：${q[6]}` : ''));
  let hdrShown = false;
  qs.forEach(q => {
    if (done.has(q[1])) return;
    const m = q[1].match(/^([LR])(\d)$/), mate = m && qs.find(r => r[1] === (m[1] === 'L' ? 'R' : 'L') + m[2]);
    if (m && mate) {
      const qL = m[1] === 'L' ? q : mate, qR = m[1] === 'L' ? mate : q; done.add(qL[1]); done.add(qR[1]);
      const nm = qL[2].replace(/^左側/, '');
      if (!hdrShown) { rows.push({ hdr: true }); hdrShown = true; }
      rows.push({ lab: nm, tip: tipOf(qL).replace(/^左側/, ''), L: stInp(`a.${k}.${qL[1]}`, stepOf(qL), 62, '左側' + nm), R: stInp(`a.${k}.${qR[1]}`, stepOf(qR), 62, '右側' + nm) });
      return;
    }
    const nm = q[2].replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim() || q[2];
    rows.push({ lab: nm + (q[6] ? ' <span style="color:#0369a1;">ⓘ</span>' : ''), tip: tipOf(q), one: stInp(`a.${k}.${q[1]}`, stepOf(q), 62, nm) });
  });
  return stLRTable(rows);
}
function stHereList() {   // 目前橫斷面（樁號）上出現的結構物：壩址在此，或附屬構造延伸至此
  const sec = state.sections && state.sections[state.selectedStaIdx]; if (!sec) return { sec: null, L: [] };
  const L = []; stAtSec(sec).forEach(st => L.push({ st, how: '壩址' }));
  try { state.structs.forEach(st => { if (Math.abs(st.sta - sec.sta) < 0.03) return; const u = (sec.sta - st.sta) * st.dir; stAccList(st).forEach(k => { const r = stAccRange(st, k); if (r && u > 0 && u >= r[0] - 0.02 && u <= r[1] + 0.02) L.push({ st, how: '附屬', k }); }); }); } catch (e) { }   // v5.4：附屬構造（獨立結構物）逐項列出
  return { sec, L };
}
function stPickHere(id, k) { const i = state.structs.findIndex(s => s.id === id); if (i < 0) return; state.structSel = i; state.stAccSel = k || null; ST_SIG = ''; stRenderUI(); requestRedraw(); }
/* ---- v5.4 附屬構造（護坦／水墊、側牆、尾檻）＝獨立結構物：選取、加入、刪除、更名 ---- */
function stSelectAcc(i, k) { state.structSel = i; state.stAccSel = k || null; if (k) { state.stOpen = state.stOpen || {}; state.stOpen.accp = true; } ST_SIG = ''; stRenderUI(); requestRedraw(); }
function stAccAdd(i, k) {
  const st = state.structs[i]; if (!st || (st.type || 'dam') !== 'dam') return; pushUndoSnapshot();
  st.a[k].on = true; let extra = ''; if (k !== 'apron' && !st.a.apron.on) { st.a.apron.on = true; extra = `（${k === 'wall' ? '側牆' : '尾檻'}須有底板，已一併加入「${stAccName(st, 'apron')}」）`; }
  state.structSel = i; state.stAccSel = k; state.stOpen = state.stOpen || {}; state.stOpen.accp = true; st._it = 0; st._boost = 0; ST_SIG = ''; rebuildAlignmentAndSections();
  updateStatus(`🏗 已加入「${stAccName(st, k)}」（獨立結構物，附屬於 ${st.name}）${extra}。`);
}
function stAccDel(i, k) {
  const st = state.structs[i]; if (!st) return; pushUndoSnapshot(); const nm = stAccName(st, k);
  let msg = `🗑 已刪除「${nm}」。`;
  if (k === 'apron' && (st.a.wall.on || st.a.tail.on)) { const o = ['wall', 'tail'].filter(q => st.a[q].on).map(q => stAccName(st, q)); st.a.wall.on = false; st.a.tail.on = false; msg = `🗑 已刪除「${nm}」；側牆／尾檻須有底板，一併刪除：${o.join('、')}。`; }
  st.a[k].on = false; if (state.stAccSel && !stAccList(st).includes(state.stAccSel)) state.stAccSel = null; st._it = 0; st._boost = 0; ST_SIG = ''; rebuildAlignmentAndSections(); updateStatus(msg);
}
function stAccRename(i, k, v) { const st = state.structs[i]; if (!st) return; pushUndoSnapshot(); v = String(v || '').trim(); if (v) st.a[k].nm = v; else delete st.a[k].nm; ST_SIG = ''; stRenderUI(); requestRedraw(); }
/* ---- 手風琴摺疊：①～④ 同時只展開一組，⑤ 數量獨立 ---- */
const ST_ACC_GRP = ['elev', 'body', 'wing', 'acc'];
function stSecOpen(k) { state.stOpen = state.stOpen || {}; return !!state.stOpen[k]; }   // v6.3：預設收合
function stSetSec(k, on) {
  state.stOpen = state.stOpen || {};
  if (on && ST_ACC_GRP.includes(k)) ST_ACC_GRP.forEach(q => { state.stOpen[q] = false; });
  state.stOpen[k] = !!on; ST_SIG = ''; stRenderUI();
}
function stToggleSec(k) { stSetSec(k, !stSecOpen(k)); }
function stSecWrap(X) {
  return X.split('\u0001').map((seg, i) => {
    if (!i) return seg; const k = seg.slice(0, seg.indexOf('\u0002')), t = seg.slice(seg.indexOf('\u0002') + 1, seg.indexOf('\u0003')), body = seg.slice(seg.indexOf('\u0003') + 1), op = stSecOpen(k);
    return `<div class="stsec${op ? ' on' : ''}" data-sec="${k}"><div class="stsec-h" onclick="stToggleSec('${k}')" title="${op ? '點擊收合' : '點擊展開'}"><span class="stsec-ar">${op ? '▾' : '▸'}</span><span class="stsec-t">${t}</span><span class="stsec-sum" id="stSs_${k}"></span></div><div class="stsec-b"${op ? '' : ' style="display:none"'}>${body}</div></div>`;
  }).join('');
}
function stSecSums(sel) {   // 收合時於標題列顯示重點數值
  const $ = id => document.getElementById(id), set = (k, t) => { const e = $('stSs_' + k); if (e) e.textContent = stSecOpen(k) ? '' : t; }, pl = stPlace(sel), p = sel.p, q = sel._q;
  set('elev', `壩底 ${stf(pl.zB)}／溢洪口底 ${stf(pl.zS)}`);
  set('body', `h2=${stf(p.h2)} w=${stf(p.w)} d1=${stf(p.d1)}`);
  set('wing', `r1 左${stf(stEff(sel, 'L').r1, 1)}／右${stf(stEff(sel, 'R').r1, 1)}`);
  set('acc', Object.keys(ST_AG).filter(k => k !== 'sill' && k !== 'sub' && sel.a[k].on).map(k => ST_AG[k].replace(/（.*$/, '')).join('、') || '無');
  set('qty', q ? `混凝土 ${stf(q.V)} m³｜開挖 ${stf(q.ex)} m³` : '');
}
(function () { const s = document.createElement('style'); s.textContent = '.stsec{margin-top:8px;border:1px solid var(--border-dim);border-radius:4px;background:var(--bg-panel)}.stsec-h{display:flex;flex-wrap:wrap;gap:2px 6px;align-items:center;padding:6px 8px;cursor:pointer;font-size:11.5px;font-weight:700;color:var(--cad-cyan);user-select:none}.stsec-h:hover{background:rgba(14,116,144,.07)}.stsec.on>.stsec-h{border-bottom:1px solid var(--border-dim);background:rgba(14,116,144,.05)}.stsec-ar{width:10px;color:var(--text-muted)}.stsec-sum{flex-basis:100%;padding-left:16px;font-weight:400;font-size:10.5px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stsec-sum:empty{display:none}.stsec-b{padding:4px 8px 8px}.stflash{animation:stfl 1.6s ease}@keyframes stfl{0%,45%{background:rgba(192,38,211,.22);box-shadow:0 0 0 2px #c026d3}100%{background:transparent;box-shadow:none}}'; document.head.appendChild(s); })();

/* ---- 點圖定位：點結構線／控點 → 切到該結構物、展開對應欄位組、捲動並聚焦欄位 ---- */
let ST_PK = [], ST_PKLAST = null, ST_HCLICK = null;
function stFieldPaths(st) {
  const P = ['zB', ...ST_P.map(q => 'p.' + q[0])]; ['L', 'R'].forEach(sd => ST_W.forEach(q => P.push('w.' + sd + '.' + q[0])));
  ST_A.forEach(q => { if (st.a && st.a[q[0]] && st.a[q[0]].on) P.push(`a.${q[0]}.${q[1]}`); }); return P;
}
function stSecOf(path) { return path === 'zB' ? 'elev' : path.startsWith('p.') ? 'body' : path.startsWith('w.') ? 'wing' : 'accp'; }
function stLocate(st, path) {
  const i = state.structs.indexOf(st); if (i < 0) return;
  if (st.eq && path.startsWith('w.R.')) path = 'w.L.' + path.slice(4);
  state.structSel = i; { const gk = path.startsWith('a.') ? path.split('.')[1] : null; state.stAccSel = gk && ST_ACC_K.includes(gk) ? gk : null; }   // v5.4：附屬構造欄位 → 切到該附屬構造卡片
  const tb = document.querySelector('.panel-tab[data-tab="tab-earth"]'); if (tb && !tb.classList.contains('active') && typeof switchSideTab === 'function') switchSideTab('tab-earth', tb);
  if (typeof EARTH_GROUPS !== 'undefined' && typeof earthShowGroup === 'function') { const g = EARTH_GROUPS.findIndex(x => x.name === '結構物'); if (g >= 0 && earthGrp !== g) earthShowGroup(g); }
  const card = document.getElementById('stCard'); if (card) card.classList.remove('folded');
  state.stOpen = state.stOpen || {}; ST_ACC_GRP.forEach(q => { state.stOpen[q] = false; }); state.stOpen[stSecOf(path)] = true; ST_SIG = ''; stRenderUI();
  const go = () => {
    const inp = document.getElementById(stIdOf(path)); if (!inp) return;
    const lab = inp.closest('.stlab') || inp; inp.scrollIntoView({ block: 'center', behavior: 'smooth' });
    lab.classList.remove('stflash'); void lab.offsetWidth; lab.classList.add('stflash');
    if (!inp.disabled) inp.focus({ preventScroll: true }); else stHLset(stTagOf(path), true);
  };
  go(); setTimeout(go, 120);   // 其他點擊處理（選樁號等）可能重繪面板，延遲再定位一次
  const inp = document.getElementById(stIdOf(path)), lab = inp && (inp.closest('.stlab') || inp);
  updateStatus(`🎯 已定位「${st.name}」欄位：${(lab && lab.dataset.lab) || (lab && lab.querySelector('span') || {}).textContent || path}（再點同一條線可切換到下一個相關欄位）`);
}
function stPickAt(cx, cy) {
  const v = state.viewMode, c = state.cams && state.cams[v], sc = c ? state.textScale * c.k : 1, tol = 7 / sc, b = camInv(cx, cy);
  let best = null, bd = tol;
  ST_PK.forEach(o => { if (o.v !== v) return; for (let i = 0; i + 1 < o.p.length; i++) { const a = o.p[i], e = o.p[i + 1], dx = e[0] - a[0], dy = e[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((b.x - a[0]) * dx + (b.y - a[1]) * dy) / L2)) : 0, d = Math.hypot(b.x - a[0] - t * dx, b.y - a[1] - t * dy); if (d < bd) { bd = d; best = o; } } });
  if (!best || !best.t || !best.t.length) return false;
  const st = best.st, F = stFieldPaths(st), M = {}; F.forEach(p => { const tg = stTagOf(p); if (!(tg in M)) M[tg] = p; });
  const rk = p => p.startsWith('a.') ? 0 : p.startsWith('w.') ? 1 : p.startsWith('p.') ? 2 : 3, cand = [...new Set(best.t.map(t => M[t]).filter(Boolean))].sort((x, y) => rk(x) - rk(y)); if (!cand.length) return false;   // 附屬構造欄位優先
  const key = st.id + '|' + best.t.join(','), k = ST_PKLAST && ST_PKLAST.key === key ? (ST_PKLAST.i + 1) % cand.length : 0;
  ST_PKLAST = { key, i: k }; stLocate(st, cand[k]); return true;
}
(function stInitPick() {
  let d0 = null;
  window.addEventListener('mousedown', e => {
    d0 = null; ST_HCLICK = null; if (e.target.id !== 'cadCanvas' || e.button !== 0 || e.shiftKey || e.altKey) return;
    d0 = { x: e.clientX, y: e.clientY, t: Date.now() };
  }, true);
  window.addEventListener('mouseup', e => {
    if (!d0) return; const o = d0; d0 = null;
    if (Math.hypot(e.clientX - o.x, e.clientY - o.y) > 4 || Date.now() - o.t > 600) return;
    const hc = ST_HCLICK; ST_HCLICK = null;
    if (hc) { const p = ({ zB: 'zB', zS: 'p.h2', h1: 'p.h1', wL: 'w.L.r1', wR: 'w.R.r1' })[hc.kind]; const st = hc.st; if (p) setTimeout(() => stLocate(st, p), 60); return; }
    const v = state.viewMode; if (!(v === '2D' || v === 'PROFILE' || (v === 'CROSS' && state.crossDisplayMode === 'SINGLE'))) return;
    if (v === '2D' && state.activeTool !== 'PAN') return;
    if (state.panMode && v !== '2D') return;
    const r = document.getElementById('cadCanvas').getBoundingClientRect(); stPickAt(e.clientX - r.left, e.clientY - r.top);
  });
})();
function stRenderUI() {
  const box = document.getElementById('stBox'); if (!box) return;
  const L = state.structs, sel = state.structs[state.structSel], HR = stHereList();
  if (state.stAccSel && !stAccList(sel).includes(state.stAccSel)) state.stAccSel = null;
  const AK = state.stAccSel, sig = JSON.stringify([L.map(s => [s.id, s.name, s.sta, s.dir, stAccList(s).map(k => stAccName(s, k))]), state.structSel, AK, HR.sec && HR.sec.sta, HR.L.map(o => o.st.id + (o.k || '')), sel && [sel.eq, sel.link, sel.w.L.auto, sel.w.R.auto, Object.keys(ST_AG).map(k => sel.a[k].on)]]);
  document.getElementById('stBadge').textContent = L.length + ' 座';
  if (sig !== ST_SIG) {
    ST_SIG = sig;
    const hd = (k, t) => `\u0001${k}\u0002${t}\u0003`, tip = t => `<div style="font-size:10px;color:var(--text-muted);margin:2px 0 3px;">${t}</div>`;
    const hereIds = new Set(HR.L.map(o => o.st.id));
    let h = (HR.sec && HR.L.length ? `<div class="sthere"><span class="sthere-t" title="目前橫斷面上出現的結構物（壩址在此，或其護坦／側牆等附屬構造延伸至此）；點選即切換下方欄位">本樁結構物 ${formatStation(HR.sec.sta)}</span>` +
      HR.L.map(o => `<button class="btn${o.st === sel && (o.k || null) === (AK || null) ? ' on' : ''}" onclick="stPickHere('${o.st.id}'${o.k ? `,'${o.k}'` : ''})" title="${escAttr(o.k ? stAccName(o.st, o.k) : o.st.name)}（${o.how}）">${escAttr(stAbbr(o.st))}<span style="font-size:10px;opacity:.75;">・${o.k ? stAccLabel(o.st, o.k) : '壩址'}</span></button>`).join('') + '</div>' : '') +
      (L.length ? `<div class="pt-table-wrap" style="max-height:150px;margin-top:6px;"><table class="pt-table"><thead><tr><th>名稱</th><th>樁號(m)</th><th>水流</th><th>混凝土m³</th><th>開挖m³</th><th></th></tr></thead><tbody>` +
      L.map((s, i) => `<tr onclick="stSelect(${i})" style="${i === state.structSel && !AK ? 'background:rgba(14,116,144,.12);' : ''}cursor:pointer;${hereIds.has(s.id) ? 'box-shadow:inset 3px 0 0 #c2410c;' : ''}" title="${hereIds.has(s.id) ? '出現在目前橫斷面' : ''}">
        <td title="${stTypeLabel(s.type)}${s.par ? '（附屬）' : ''}">${s.par ? '<span style="color:#0369a1;">└</span>' : ''}<input class="input-text" style="width:${s.par ? 58 : 66}px;" value="${escAttr(s.name)}" onclick="event.stopPropagation()" onchange="stEditField(${i},'name',this)"></td>
        <td>${s.par ? `<span style="font-size:10.5px;color:var(--text-muted);" title="跟隨主壩（距離於主壩「④ 附屬構造」設定）">${(+s.sta).toFixed(2)}</span>` : `<input type="number" class="input-num" style="width:66px;" step="0.5" value="${s.sta}" onclick="event.stopPropagation()" onchange="stEditField(${i},'sta',this)">`}</td>
        <td><select class="input-select" style="width:54px;" ${s.par ? 'disabled' : ''} onclick="event.stopPropagation()" onchange="stEditField(${i},'dir',this)"><option value="1"${s.dir > 0 ? ' selected' : ''}>增→</option><option value="-1"${s.dir < 0 ? ' selected' : ''}>←減</option></select></td>
        <td id="stV_${i}"></td><td id="stE_${i}"></td>
        <td><button class="btn" style="padding:1px 6px;" onclick="event.stopPropagation();stDel(${i})">✕</button></td></tr>` +
        stAccList(s).map(k => { const r = stAccRange(s, k); return `<tr onclick="stSelectAcc(${i},'${k}')" style="${i === state.structSel && AK === k ? 'background:rgba(14,116,144,.12);' : ''}cursor:pointer;" title="${stAccLabel(s, k)}：獨立結構物（位置與高程依附 ${escAttr(s.name)}）">
          <td><span style="color:#0369a1;">└</span><input class="input-text" style="width:62px;" value="${escAttr(stAccName(s, k))}" onclick="event.stopPropagation()" onchange="stAccRename(${i},'${k}',this.value)"></td>
          <td><span style="font-size:10.5px;color:var(--text-muted);" title="依附主壩：壩趾起算">${r ? (s.sta + s.dir * r[0]).toFixed(2) : ''}</span></td>
          <td style="font-size:10.5px;color:var(--cad-amber);">${stAccLabel(s, k)}</td>
          <td id="stAV_${i}_${k}"></td><td id="stAE_${i}_${k}"></td>
          <td><button class="btn" style="padding:1px 6px;" onclick="event.stopPropagation();stAccDel(${i},'${k}')">✕</button></td></tr>`; }).join('')).join('') + '</tbody></table></div>' : '<div style="color:var(--text-muted);font-size:11px;margin-top:6px;">尚未放置結構物。輸入樁號按「加入」，或按「圖面點擊放置」在平面圖中心線上點一下。</div>');
    if (sel && AK) {   // v5.4：附屬構造卡片（獨立結构物）
      const i0 = state.structSel, r = stAccRange(sel, AK), lb = stAccLabel(sel, AK), nm = stAccName(sel, AK), S = u => formatStation(sel.sta + sel.dir * u);
      const help = { apron: `${lb}長 Lp＝cL×(h2＋hq)，自壩趾（主壩下游面與河床交點）起；左右兩側溪床半寬可分別設定（起點→末端漸變；預設使側牆頂內緣對齊溢洪口頂點 x2 外 0.5 m，往下以 1:si 內收；有尾檻時末端預設＝主壩溢洪口寬 w 的一半）。有側牆時底板延伸至牆背；末端設截水牆。附屬構造基坑開挖列於本項。`,
        wall: '側牆連接主壩下游面，基礎與底板連成一體；內面坡 1:si（往上外傾）、背面坡 1:so、頂寬 tw。牆頂由壩端「溢洪口底高程」直線降至末端「底板面＋末端牆高」（預設 h1，但不高於 h2，牆頂只往下游降低）。溪床半寬（牆腳位置）於護坦設定。洩水孔每 da m² 至少 1 孔。',
        tail: '尾檻位於水墊末端（有尾檻＝水墊），頂高、溢流口、頂寬、下游坡可調；寬度＝水墊末端溪床寬。' }[AK];
      let X = `<div style="margin-top:8px;padding:6px 8px;border:1px solid var(--border-dim);border-radius:4px;background:rgba(194,65,12,.05);font-size:11.5px;line-height:1.6;">
          <b style="color:var(--cad-amber);">${escAttr(nm)}</b>　${lb}（獨立結構物）<br><span style="font-size:10.5px;color:var(--text-muted);">附屬於 <a style="cursor:pointer;color:#0369a1;" onclick="stSelectAcc(${i0},null)">${escAttr(sel.name)}</a>：位置與高程依附主壩（壩趾起算）；參數、數量、標準圖各自獨立。${r ? `範圍 ${S(r[0])}～${S(r[1])}` : ''}</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;"><button class="btn amber" onclick="stAccStdOpen('${AK}')">📐 ${lb}標準圖</button><button class="btn" onclick="stSelectAcc(${i0},null)">← 回到 ${escAttr(sel.name)}</button><button class="btn danger" onclick="stAccDel(${i0},'${AK}')">刪除</button></div></div>` +
        hd('accp', `① ${lb}參數`) + tip('欄位空白＝跟隨括號內預設；輸入中的欄位，其對應圖線會在圖面變洋紅色') + stAccGroupHTML(sel, AK) +
        `<div style="font-size:10px;color:var(--text-muted);margin-top:3px;line-height:1.5;">${help}</div>` +
        hd('qty', '② 數量計算') + `<div id="stQty"></div>`;
      h += stSecWrap(X);
    } else if (sel) {
      const isSill = sel.type === 'sill', hasAcc = !sel.par && !isSill;
      let X = (typeof catCurHTML === 'function' ? catCurHTML(sel) : '') + hd('elev', `① 高程　${escAttr(sel.name)}　<span style="color:var(--cad-amber);">${stTypeLabel(sel.type)}${sel.par ? '（附屬於 ' + escAttr((state.structs.find(q => q.id === sel.par) || {}).name || '') + '，高程與位置跟隨主壩）' : ''}</span>`) +
        `<div style="display:flex;gap:10px;align-items:center;margin-top:4px;font-size:11px;">
          <label style="display:flex;gap:4px;align-items:center;" title="連動：落差 ΔZ＝水流向×h2，壩底高程依固定側(上游/下游)設計線推得；改壩底、拖曳、改落差即轉獨立"><input type="checkbox" ${sel.link ? 'checked' : ''} onchange="stSetFlag('link',this.checked)"> 連動設計線</label>
          <span style="color:var(--text-muted);font-size:10.5px;" id="stLinkTxt"></span></div>
        <div style="display:grid;grid-template-columns:1fr;gap:2px;margin-top:4px;">${stFld('zB', '<b style="color:var(--cad-amber)">整座壩底部高程 zB（基礎底，不含 key）</b>', 0.05, 80)}</div>
        <div id="stElev" style="margin-top:4px;font-size:10.5px;line-height:1.7;background:rgba(3,105,161,.05);border:1px solid var(--border-dim);padding:4px 6px;border-radius:4px;"></div>
        <div style="margin-top:3px;"><button class="btn amber" onclick="stAlign()" title="縱斷面在壩址建立落差 ΔZ＝水流向×h2（＝連動）">設計線對齊壩(連動)</button> <button class="btn" onclick="stResetAll()">全部還原預設</button></div>
        <div style="margin-top:4px;"><button class="btn amber" style="width:100%;" onclick="stStdOpen()">📐 標準圖（平面／立面／各變化段剖面／數量）</button></div>` +
        (sltOn(sel) ? sltParamHTML(sel) + ' ' :
        hd('body', '② 壩體參數') + tip('輸入中的欄位，其對應圖線會在圖面變洋紅色；點圖面結構線可跳回對應欄位') +
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1px 10px;margin-top:4px;">` + ST_P.filter(q => q[0] !== 'wsp').map(q => stFld('p.' + q[0], q[1], q[5] ? 1 : (q[0].startsWith('s') || q[0] === 'kx' ? 0.05 : 0.1), 54)).join('') + '</div>' +
        hd('wing', isSill ? '③ 左右端面（梯形，左右各自）' : '③ 左右壩翼') + tip(isSill ? '面向下游；端面坡 1:ns＝自頂端往下以 1:ns 內收（梯形）；退階長 r5＝ns×(h2＋h3)，改任一個另一個自動跟著變' : '面向下游；溢洪口位置隨「中心偏移 off」左右移動') +
        `<label style="font-size:11px;color:var(--text-muted);display:flex;gap:6px;align-items:center;margin-top:3px;"><input type="checkbox" ${sel.eq ? 'checked' : ''} onchange="stSetFlag('eq',this.checked)"> 右翼＝左翼（全部參數同左）</label>` +
        `<label style="font-size:11px;display:flex;gap:6px;align-items:center;margin-top:3px;" title="預設以全段寬 w 調整（中心對稱）；勾選後以中心線為界，左、右半寬各自設定（頂部溢洪口線），w＝左＋右"><input type="checkbox" ${sel.p.wsp ? 'checked' : ''} onchange="stSetFlag('wsp',this.checked)"> ${isSill ? '頂寬 w' : '溢洪口'}左右分開（以中心線為界，調整頂部溢洪口線）</label>` +
        stLRTable(ST_W.filter(q => (q[0] === 'wh' && sel.p.wsp) || (isSill ? ['ns', 'r5'].includes(q[0]) : (q[0] !== 'ns' && q[0] !== 'wh'))).sort((a, b) => (b[0] === 'wh') - (a[0] === 'wh')).map(q => {
          const nm = q[1].replace(/　.*$/, '').replace('壩翼', '').replace('壩體', '體'), st1 = q[0] === 'rs' ? 1 : 0.1;
          const cell = sd => (sel.eq && sd === 'R') ? `<span style="opacity:.6;font-size:10.5px;color:var(--text-muted);">＝左 <span id="stEqV_${q[0]}"></span></span>` : stInp('w.' + sd + '.' + q[0], st1, 62, (sd === 'L' ? '左翼' : '右翼') + nm);
          const row = { lab: nm, tip: q[1], L: cell('L'), R: cell('R') };
          if (q[0] !== 'r1') return [row];
          const ck = sd => (sel.eq && sd === 'R') ? '' : `<label style="font-size:10px;color:var(--text-muted);display:flex;gap:3px;align-items:center;" title="r1 依地面自動"><input type="checkbox" ${sel.w[sd].auto ? 'checked' : ''} onchange="stSetFlag('w.${sd}.auto',this.checked)">自動 <span id="stAuto_${sd}" style="color:var(--cad-amber);"></span></label>`;
          return [row, { lab: '<span style="font-weight:400;">r1 依地面</span>', tip: 'r1 依地面自動', L: ck('L'), R: ck('R') }];
        }).flat(), '左翼', `右翼${sel.eq ? '（同左）' : ''}`) +
        `<div style="font-size:10px;color:var(--text-muted);margin-top:3px;line-height:1.5;">r1＝壩翼上斜長度(自溢洪口邊 P2 起，翼頂以 1:rs 緩升)；r2＝翼頂水平長；r3＝翼端面高(開挖深)；r4＝翼端退階長；r5＝壩體退階長。翼高＝h1＋r1/rs。</div>`) +
        (hasAcc ? hd('acc', '④ 附屬構造（獨立結構物）') + tip('護坦／水墊、側牆、尾檻為獨立結構物：各自的參數、數量、標準圖（上方清單 └ 列）；位置與高程依附本壩（壩趾起算）。副壩、固床工請以上方「型式」單獨放置。') +
        `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">` + ST_ACC_K.map(k => sel.a[k].on ? `<button class="btn amber" onclick="stSelectAcc(${state.structSel},'${k}')" title="開啟「${escAttr(stAccName(sel, k))}」卡片">✎ ${escAttr(stAccName(sel, k))}</button>` : `<button class="btn" onclick="stAccAdd(${state.structSel},'${k}')">＋ ${k === 'apron' ? '護坦／水墊' : (k === 'wall' ? '側牆' : '尾檻（水墊）')}</button>`).join('') + '</div>' +
        `<div style="font-size:10px;color:var(--text-muted);margin-top:3px;line-height:1.5;">加入側牆或尾檻時會一併加入護坦（底板）；有尾檻時護坦即為水墊。</div>` : (isSill && !sltOn(sel) ? `<div style="font-size:10px;color:var(--text-muted);margin-top:6px;line-height:1.5;">固床工：w＝固床工全長（溪床寬＋兩岸嵌入，預設各 2 m），h2＝出露高（0＝帶工），h3＝基礎深（埋入溪床下），d1＝頂寬，s2／s3＝下游／上游坡；h1、壩翼 r1～r5 預設 0（頂部水平、矩形斷面），需要時可再加。</div>` : '')) +
        hd('qty', '⑤ 數量計算') + `<div id="stQty"></div>`;
      h += stSecWrap(X);
    }
    h += `<div id="stSum"></div>`;
    box.innerHTML = h;
  }
  stUpdDyn(true);
}
function stUpdDyn(syncVals) {
  const box = document.getElementById('stBox'); if (!box) return;
  const L = state.structs, sel = state.structs[state.structSel], $ = id => document.getElementById(id), df = (a, b) => { const d = a - b; return `<span style="color:${Math.abs(d) < 0.005 ? '#0369a1' : '#c2410c'};">${d >= 0 ? '+' : ''}${stf(d)}</span>`; };
  L.forEach((s, i) => { const a = $('stV_' + i), b = $('stE_' + i); if (a) a.textContent = s._q ? stf(s._q.V) : ''; if (b) b.textContent = s._q ? stf(s._q.ex) : '';
    stAccList(s).forEach(k => { const Q = (s._accQ || {})[k], c = $(`stAV_${i}_${k}`), d = $(`stAE_${i}_${k}`); if (c) c.textContent = Q ? stf(Q.V) : ''; if (d) d.textContent = Q && Q.ex ? stf(Q.ex) : ''; }); });
  if (sel) {
    const pl = stPlace(sel), g = stGeo(sel), t = $('stLinkTxt'); if (t) t.innerHTML = sel.link ? `ΔZ＝${stf(sel.dir * sel.p.h2)} 自動` : `<span style="color:#c2410c">獨立（ΔZ＝${stf(sel.dz)}）</span>`;
    const e = $('stElev');
    if (e) e.innerHTML = `開挖底 <b style="color:#a21caf">${stf(pl.floor)}</b>（基礎底−${ST_CL * 100}cm）　key 底 ${stf(pl.zKey)}，key 開挖底 <b style="color:#a21caf">${stf(pl.keyFloor)}</b><br>
      下游河床 <b>${stf(pl.zBed)}</b>（zB+h3）　溢洪口底 <b>${stf(pl.zS)}</b>（+h2）　壩頂最高 <b>${stf(pl.zTop)}</b>（翼高 左${stf(g.L.zW)}／右${stf(g.R.zW)}）<br>
      上游設計 ${stf(pl.desUp)}　溢洪口底 ${stf(pl.zS)}　差(壩−設計) ${df(pl.zS, pl.desUp)}　｜　下游設計 ${stf(pl.desDn)}　河床 ${stf(pl.zBed)}　差 ${df(pl.zBed, pl.desDn)}` +
      (g.thMin <= 0.2 ? `<br><span style="color:#a21caf;">⚠ 壩翼頂厚度 ${stf(g.thMin)} m 過小，請檢查 d1/s4/s5/翼高</span>` : '') + (sel._autoMiss && (sel._autoMiss.L || sel._autoMiss.R) ? `<br><span style="color:#a21caf;">⚠ 翼頂線未與地面相交（${sel._autoMiss.L ? '左' : ''}${sel._autoMiss.R ? '右' : ''}）→ 請手動 r1</span>` : '');
    const paths = ['zB', ...ST_P.map(q => 'p.' + q[0])]; ['L', 'R'].forEach(sd => ST_W.forEach(q => paths.push('w.' + sd + '.' + q[0]))); ST_A.forEach(q => paths.push(`a.${q[0]}.${q[1]}`));
    paths.forEach(path => {
      const inp = $(stIdOf(path)); if (!inp) return;
      let v = stGetPath(sel, path); if (path.endsWith('.r1')) { const sd = path.split('.')[1], ef = stEff(sel, sd); v = +(+ef.r1).toFixed(3); }
      if (syncVals || document.activeElement !== inp) inp.value = (v === undefined || v === null) ? '' : +(+v).toFixed(4);
      if (path.startsWith('a.')) { const ks = path.split('.'); inp.placeholder = v === null ? stf(stAccV(sel, ks[1], ks[2])) : ''; }
      inp.disabled = path.endsWith('.r1') && sel.w[path.split('.')[1]].auto;
      const d = stDefOf(sel, path), mod = path === 'zB' ? !sel.link : (path.startsWith('a.') ? (v !== d && !(v !== null && d !== null && Math.abs(v - d) < 1e-9)) : (d !== undefined && d !== null && Math.abs(v - d) > 1e-9)), mk = $('stm_' + stIdOf(path));
      inp.style.borderColor = mod ? '#c2410c' : ''; inp.style.background = mod ? 'rgba(194,65,12,.08)' : '';
      if (mk) mk.innerHTML = mod ? `<a onclick="stRst('${path}')" title="${path === 'zB' ? '還原為連動' : '還原預設 ' + d}">${path === 'zB' ? '連動↺' : '↺'}</a>` : '';
    });
    ['L', 'R'].forEach(sd => { const s = $('stAuto_' + sd); if (s) { const ef = stEff(sel, sd); s.textContent = sel.w[sd].auto ? (ef.auto ? '→ ' + stf(ef.r1, 1) : '（未相交）') : ''; } });
    ST_W.forEach(q => { const s = $('stEqV_' + q[0]); if (s) s.textContent = '＝' + stf(sel.w.L[q[0]], 1); });
    const qb = $('stQty'), q = sel._q, AK = state.stAccSel, AQ = AK && (sel._accQ || {})[AK];
    stSecSums(sel);
    if (AK) { const e2 = $('stSs_qty'); if (e2) e2.textContent = stSecOpen('qty') || !AQ ? '' : `混凝土 ${stf(AQ.V)} m³${AQ.ex ? `｜開挖 ${stf(AQ.ex)} m³` : ''}`; const e3 = $('stSs_accp'); if (e3) e3.textContent = ''; }
    if (qb && AK) qb.innerHTML = AQ ? `<div class="pt-table-wrap" style="max-height:300px;"><table class="pt-table" style="white-space:normal;"><thead><tr><th>項目（下行為算式）</th><th>單位</th><th>數量</th></tr></thead><tbody>` +
      AQ.rows.map(r => `<tr><td>${r.it}</td><td>${r.u}</td><td style="text-align:right;"><b>${stf(r.v, r.u === '處' ? 0 : 2)}</b></td></tr><tr><td colspan="3" style="font-size:10px;color:var(--text-muted);padding-bottom:5px;">${r.fx}</td></tr>`).join('') + '</tbody></table></div>' : '';
    else if (qb) qb.innerHTML = q ? `<div style="font-size:10px;color:var(--text-muted);margin:2px 0 3px;">各斷面分段切頭公式</div><div class="pt-table-wrap" style="max-height:260px;"><table class="pt-table" style="white-space:normal;"><thead><tr><th>項目（下行為算式）</th><th>單位</th><th>數量</th></tr></thead><tbody>` +
      q.rows.map(r => `<tr><td>${r.it}</td><td>${r.u}</td><td style="text-align:right;"><b>${stf(r.v, r.u === '處' ? 0 : 2)}</b></td></tr><tr><td colspan="3" style="font-size:10px;color:var(--text-muted);padding-bottom:5px;">${r.fx}</td></tr>`).join('') + '</tbody></table></div>' +
      `<div class="pt-table-wrap" style="max-height:170px;margin-top:6px;"><table class="pt-table"><thead><tr>${q.tSeg[0].map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${q.tSeg.slice(1).map(r => `<tr>${r.map((c, k) => `<td style="${k ? 'text-align:right;' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` +
      (q.tExc ? `<div style="font-size:10.5px;color:#a21caf;margin-top:6px;">開挖：${stCutTag(sel, '')} 各變化段剖面（平均斷面法；切面標示＝結構物簡稱-累距，累距自圖左翼端起算，0K+000 即圖左翼端）</div><div class="pt-table-wrap" style="max-height:200px;margin-top:3px;"><table class="pt-table"><thead><tr>${q.tExc[0].map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${q.tExc.slice(1).map(r => `<tr>${r.map((c, k) => `<td style="${k ? 'text-align:right;' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '') : '';
  }
  const sm = $('stSum');
  const aS = f => L.reduce((a, s) => a + Object.values(s._accQ || {}).reduce((b, Q) => b + (Q[f] || 0), 0), 0), nA = L.reduce((a, s) => a + stAccList(s).length, 0);
  if (sm) sm.innerHTML = L.length + nA > 1 ? `<div style="margin-top:8px;font-size:11px;color:#c2410c;">全線合計（含附屬構造）：混凝土 ${stf(L.reduce((a, s) => a + (s._q ? s._q.V : 0), 0) + aS('V'))} m³｜模板 ${stf(L.reduce((a, s) => a + (s._q ? s._q.F : 0), 0) + aS('F'))} m²｜結構物開挖 ${stf(L.reduce((a, s) => a + (s._q ? s._q.ex : 0), 0) + aS('ex'))} m³</div>` : '';
}
/* 設計線對齊壩 = 回到連動 */
function stAlign() { const st = state.structs[state.structSel]; if (!st) return; stSetFlag('link', true); updateStatus(`✔ 「${st.name}」已連動：縱斷面落差 ΔZ=${stf(st.dir * st.p.h2)} m，壩底 EL ${stf(stZBlink(st))}。`); }

/* ---------- 圖線繪製（含洋紅強調） ---------- */
const ST_STY = { main: ['#ff9f43', 1.0, null], top: ['#ffd08a', 0.8, null], base: ['#ff9f43', 1.0, null], step: ['#ffb066', 0.6, null], hid: ['#ffd08a', 0.8, [5, 3]], ref: ['#7dd3fc', 0.7, [6, 3]], wing: ['#ffd08a', 0.9, null], wing2: ['#ffd08a', 0.8, [7, 3]] };
function stHLtag() { const h = state.stHL || {}; return h.focus || h.hover || null; }
function stHit(st, tags) {
  const t = stHLtag(); if (!t || !tags) return false; if (tags.includes(t)) return true;
  if (st.eq && /[LR]$/.test(t) && t !== 'zB') return tags.includes(t.slice(0, -1) + (t.endsWith('L') ? 'R' : 'L'));
  return false;
}
function stHLlabel(st) {
  const t = stHLtag(); if (!t) return ''; let n = (ST_INFO[t] || {}).n || t, v, u = (ST_INFO[t] || {}).u || '';
  if (t === 'zB') v = stPlace(st).zB; else if (t.startsWith('a.')) { const ks = t.split('.'); v = stAccV(st, ks[1], ks[2]); } else if (/^(r\d|rs)[LR]$/.test(t)) { const e = stEff(st, t.slice(-1)); v = e[t.slice(0, -1)]; } else v = st.p[t];
  return `${n} = ${stf(v, t === 'nh' ? 0 : 2)}${u}`;
}
function stPaint(st, lines, map, o) {
  o = o || {}; const lw = o.lw || 1;
  ctx.save(); ctx.lineJoin = 'round';
  lines.forEach(l => {
    const sty = ST_STY[l.k || 'main']; ctx.strokeStyle = (o.col && l.k !== 'ref') ? o.col : ((o.yellow && l.k !== 'ref') ? '#ffe600' : sty[0]); ctx.lineWidth = sty[1] * lw; ctx.setLineDash(o.dash ? (l.k === 'hid' ? [2, 3] : [7, 4]) : (sty[2] || [])); ctx.beginPath();
    l.p.forEach((q, i) => { const s = map(q); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.stroke();
    if (l.t && l.t.length && !ST_NOPK) ST_PK.push({ st, v: state.viewMode, p: l.p.map(map), t: l.t });
  });
  const sel = st === state.structs[state.structSel];
  if (sel && stHLtag()) {
    let shown = false; ctx.setLineDash([]); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 3.4 * lw; ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 6;
    lines.forEach(l => {
      if (!stHit(st, l.t)) return; ctx.beginPath(); l.p.forEach((q, i) => { const s = map(q); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.stroke();
      if (!shown) { shown = true; const a = map(l.p[0]), b = map(l.p[l.p.length - 1]); o._hl = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
    });
    ctx.shadowBlur = 0;
    if (shown && !o.noLabel) { const tx = stHLlabel(st); ctx.font = 'bold 12px "Noto Sans TC"'; const w = ctx.measureText(tx).width; ctx.fillStyle = 'rgba(11,16,24,.88)'; ctx.fillRect(o._hl[0] + 8, o._hl[1] - 22, w + 10, 18); ctx.fillStyle = '#ff4fd8'; ctx.textAlign = 'left'; ctx.fillText(tx, o._hl[0] + 13, o._hl[1] - 9); }
  }
  ctx.restore();
}
function stFillPolys(polys, map, colors) { return;   // 依使用者要求：結構物不填色
  polys.forEach((poly, i) => { ctx.beginPath(); poly.forEach((q, k) => { const s = map(q); k ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fillStyle = colors[i] || colors[0]; ctx.fill(); });
}

/* ---------- 拖曳控點（縱斷面／橫斷面） ---------- */
let ST_H = [], ST_DRAG = null;
const stSnap = z => Math.round(z / 0.05) * 0.05;
function stApplyDrag(hd, z) {
  const st = hd.st, pl = stPlace(st); z = +stSnap(z).toFixed(3);
  if (hd.kind === 'zB') { if (st.link) st._zT = z; else st.zB = z; }
  else if (hd.kind === 'zS') { st.p.h2 = +Math.max(0.3, z - pl.zBed).toFixed(3); if (st.link) st._zT = (hd.zB0 !== undefined ? hd.zB0 : pl.zB); else st.zB = pl.zB; }
  else if (hd.kind === 'h1') st.p.h1 = +Math.max(0.1, z - pl.zS).toFixed(3);
  else { const sd = hd.kind === 'wL' ? 'L' : 'R', e = stEff(st, sd), tg = (st.eq && sd === 'R') ? 'L' : sd; st.w[tg].r1 = +Math.max(0, (z - pl.zS - st.p.h1) * Math.max(e.rs, 1e-6)).toFixed(2); st.w[tg].auto = false; }
}
(function stInitDrag() {
  const hit = e => {
    const cv = document.getElementById('cadCanvas'); if (!cv || (state.viewMode !== 'PROFILE' && state.viewMode !== 'CROSS')) return null;
    const r = cv.getBoundingClientRect(), b = camInv(e.clientX - r.left, e.clientY - r.top); let best = null, bd = 9;
    ST_H.forEach(h => { if (h.view !== state.viewMode) return; const d = Math.hypot(b.x - h.x, b.y - h.y); if (d < bd) { bd = d; best = h; } });
    return best ? { h: best, b } : null;
  };
  window.addEventListener('mousedown', e => {
    if (e.target.id !== 'cadCanvas' || e.button !== 0 || state.panMode || e.shiftKey || e.altKey) return;
    const r = hit(e); if (!r) return;
    pushUndoSnapshot(); ST_DRAG = r.h; ST_HCLICK = r.h; ST_DRAG.zB0 = stPlace(r.h.st).zB; state.structSel = state.structs.indexOf(r.h.st); state.stHL = { focus: ({ zB: 'zB', zS: 'h2', h1: 'h1', wL: 'r1L', wR: 'r1R' })[r.h.kind] }; e.stopPropagation(); e.preventDefault();
  }, true);
  window.addEventListener('mousemove', e => {
    const cv = document.getElementById('cadCanvas');
    if (ST_DRAG) {
      const r = cv.getBoundingClientRect(), b = camInv(e.clientX - r.left, e.clientY - r.top);
      stApplyDrag(ST_DRAG, ST_DRAG.zAtY(b.y)); stRecalc(true); requestRedraw(); return;
    }
    if (e.target.id === 'cadCanvas' && !state.panDrag) { const r = hit(e); if (r) cv.style.cursor = 'ns-resize'; else if (cv.style.cursor === 'ns-resize') cv.style.cursor = ''; }
  });
  window.addEventListener('mouseup', () => {
    if (!ST_DRAG) return; const st = ST_DRAG.st; ST_DRAG = null; state.stHL = {}; stCommitMove(st); st._it = 0; st._boost = 0; ST_SIG = ''; rebuildAlignmentAndSections();
    const pl = stPlace(st); updateStatus(`已拖曳調整「${st.name}」：壩底 EL ${stf(pl.zB)}、溢洪口底 EL ${stf(pl.zS)}（h2=${stf(st.p.h2)}）、h1=${stf(st.p.h1)}、翼頂 L ${stf(pl.zWL)} / R ${stf(pl.zWR)}。${st.link ? '（設計線已隨壩調整）' : ''}`);
  });
})();
function stHandle(h, x, y, label, color) {
  ST_H.push(h); ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = '#0b1018'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x, y - 7.5); ctx.lineTo(x + 7.5, y); ctx.lineTo(x, y + 7.5); ctx.lineTo(x - 7.5, y); ctx.closePath(); ctx.fill(); ctx.stroke();   // v7.6：控點放大
  if (label) { ctx.font = 'bold 11px "JetBrains Mono"'; ctx.textAlign = h.left ? 'right' : 'left'; const tx = h.left ? x - 11 : x + 11, w = ctx.measureText(label).width; ctx.fillStyle = 'rgba(8,12,18,0.82)'; ctx.fillRect(h.left ? tx - w - 2 : tx - 2, y - 8, w + 4, 15); ctx.fillStyle = color; ctx.fillText(label, tx, y + 4); }
  ctx.restore();
}
const stZAt = (zRef, sy) => { const y0 = sy(zRef), y1 = sy(zRef + 1); return y => zRef + (y - y0) / ((y1 - y0) || 1); };

/* ---------- 平面圖：結構物平面圖 ---------- */
function stWorld(st, u, x) {      // u：順水流向(下游為正)；x：壩軸向(面向下游，右為正) → 世界座標
  const g = getPointAndNormalAtStation(st.sta); if (!g) return null;
  const o = st.dir * (x + (st.p.off || 0));   // v6.3：中心偏移
  return [g.x + g.tx * st.dir * u - g.nx * o, g.y + g.ty * st.dir * u - g.ny * o];
}
function stDrawExcPlan(st, sel) {
  const ex = st._ex; if (!ex || !ex.ok || !ex.outl || !ex.outl.length) return;
  const hl = sel && ['kx', 'km'].includes(stHLtag());
  ctx.save(); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = hl ? 3.4 : 1.0; ctx.setLineDash(hl ? [] : [6, 4]);
  ex.outl.forEach(L => { const E = L.map(([u, x]) => stWorld(st, u, x)).filter(Boolean).map(q => worldToScreen2D(q[0], q[1])); ctx.beginPath(); E.forEach((q, k) => k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); });
  ctx.restore();
}
function stPlanLabels(st, g) {   // 平面圖樁號標示（標於各構造物下方）
  const S = u => formatStation(st.sta + st.dir * u), R = g.acc || {}, out = [{ t: `${st.name}　${S(0)}`, pts: g.plan, c: '#ffd08a', main: true }];
  const rect = (u0, u1, x0, x1) => [[u0, x0], [u1, x0], [u1, x1], [u0, x1]];
  if (R.apron) out.push({ t: `${stAccName(st, 'apron')} ${S(R.apron.u0)}～${S(R.apron.u1)}`, pts: rect(R.apron.u0, R.apron.u1, -R.apron.B, R.apron.B), c: '#ffe3b8' });
  if (R.tail) out.push({ t: `${stAccName(st, 'tail')} ${S((R.tail.u0 + R.tail.u1) / 2)}`, pts: rect(R.tail.u0, R.tail.u1, -R.bh(R.tail.u1), R.bh(R.tail.u1)), c: '#ffe3b8' });
  if (R.walls && R.walls.length) out.push({ t: `${stAccName(st, 'wall')}末端 ${S(R.walls[0].u1)}`, pts: rect(R.walls[0].u0, R.walls[0].u1, -R.walls[0].xo, R.walls[0].xo), c: '#ffe3b8' });
  (R.sills || []).forEach((b, i) => out.push({ t: `固床工${R.sills.length > 1 ? i + 1 : ''} ${S((b.u0 + b.u1) / 2)}`, pts: rect(b.u0, b.u1, -b.B, b.B), c: '#ffe3b8' }));
  if (R.sub) out.push({ t: `副壩 ${S((R.sub.c0 + R.sub.c1) / 2)}`, pts: rect(R.sub.b0, R.sub.b1, -R.sub.Bs, R.sub.Bs), c: '#ffe3b8' });
  return out;
}
function stDrawPlan() {
  if (!state.structs.length || state.viewMode !== '2D') return;
  state.structs.forEach((st, i) => {
    const g = stGeo(st), sel = i === state.structSel, map = ([u, x]) => { const w = stWorld(st, u, x); if (!w) return [0, 0]; const s = worldToScreen2D(w[0], w[1]); return [s.x, s.y]; };
    if (!getPointAndNormalAtStation(st.sta)) return;
    ctx.save();
    stFillPolys(g.fills.plan, map, [sel ? 'rgba(255,159,67,0.40)' : 'rgba(255,159,67,0.28)']);
    ctx.restore();
    stPaint(st, g.lines.plan, map, { lw: sel ? 2.0 : 1.8, col: '#ffffff' });   // 平面圖：白色粗線，與地形等高線區隔
    const c0 = stWorld(st, 0, 0);
    if (c0) {
      ctx.save(); const C = worldToScreen2D(c0[0], c0[1]);
      ctx.fillStyle = '#ffd08a'; ctx.font = 'bold 12px "Noto Sans TC"'; ctx.textAlign = 'left';
      stPlanLabels(st, g).forEach(it => { const S = it.pts.map(([u, x]) => { const w = stWorld(st, u, x); return w ? worldToScreen2D(w[0], w[1]) : null; }).filter(Boolean); if (!S.length) return; const yb = Math.max(...S.map(q => q.y)), xc = S.reduce((a, q) => a + q.x, 0) / S.length; ctx.textAlign = 'center'; ctx.fillStyle = it.c; ctx.font = (it.main ? 'bold 12px' : '11px') + ' "Noto Sans TC"'; ctx.fillText(it.t, xc, yb + 15); });
      const u0 = stWorld(st, g.uUpB - 2.5, 0), u1 = stWorld(st, g.uUpB - 0.4, 0);   // 水流方向箭頭（上游→下游）
      if (u0 && u1) {
        const A = worldToScreen2D(u0[0], u0[1]), B2 = worldToScreen2D(u1[0], u1[1]), dx = B2.x - A.x, dy = B2.y - A.y, d = Math.hypot(dx, dy) || 1;
        if (d > 6) { ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B2.x, B2.y); ctx.stroke(); ctx.fillStyle = '#7dd3fc'; ctx.beginPath(); ctx.moveTo(B2.x, B2.y); ctx.lineTo(B2.x - 8 * dx / d + 4 * dy / d, B2.y - 8 * dy / d - 4 * dx / d); ctx.lineTo(B2.x - 8 * dx / d - 4 * dy / d, B2.y - 8 * dy / d + 4 * dx / d); ctx.closePath(); ctx.fill(); }
      }
      ctx.restore();
    }
  });
}

/* ---------- 縱斷面：結構物斷面圖（順水流向，沿中心線；含壩翼高） ---------- */
function stDrawProfile(sx, sy, minSta, maxSta) {
  ST_H = ST_H.filter(h => h.view !== 'PROFILE');
  state.structs.forEach((st, i) => {
    if (st.sta < minSta - 1e-6 || st.sta > maxSta + 1e-6) return;
    const g = stGeo(st), pl = stPlace(st), sel = i === state.structSel, map = ([u, z]) => [sx(st.sta + st.dir * u), sy(pl.zS + z)];
    ctx.save();
    stFillPolys(g.fills.sect, map, ['rgba(255,159,67,0.35)', 'rgba(255,159,67,0.45)', 'rgba(255,208,138,0.16)']);
    ctx.restore();
    const ex = st._ex;   // 開挖：底 + 兩側 1:kx 邊坡（至設計面/地面較低者），key 處加挖
    if (ex && ex.ok && ex.profs.length) {
      ctx.save(); const hl = sel && ['kx', 'km'].includes(stHLtag()); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = hl ? 3.2 : 0.8; ctx.setLineDash(hl ? [] : [5, 3]);
      ex.profs.forEach(pf => { ctx.beginPath(); pf.forEach(([u, z], k) => { const X = sx(st.sta + st.dir * u), Y = sy(z); k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); }); ctx.restore();
    }
    stPaint(st, g.lines.sect, map, { lw: 0.7 });
    { const X0 = sx(st.sta), Y0 = sy(pl.zTop) - 10, Y1 = Y0 - 26; ctx.save(); ctx.strokeStyle = '#ffd08a'; ctx.fillStyle = '#ffd08a'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y1); ctx.lineTo(X0 + 22, Y1); ctx.stroke(); ctx.font = 'bold 12px "Noto Sans TC"'; ctx.textAlign = 'left'; ctx.fillText(`${st.name}　${formatStation(st.sta)}`, X0 + 26, Y1 + 4); ctx.restore(); }
    if (g.acc && g.acc.holes && g.acc.holes.n) { ctx.save(); ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 0.7; ctx.setLineDash([2, 2]); const r = Math.max(1.5, g.acc.holes.dh / 2 * Math.abs(sx(st.sta + 1) - sx(st.sta))); g.acc.holes.list.forEach(([u, z]) => { ctx.beginPath(); ctx.arc(sx(st.sta + st.dir * u), sy(pl.zS + z), r, 0, Math.PI * 2); ctx.stroke(); }); ctx.restore(); }
    const cx = sx(st.sta), off = 12, za = stZAt(pl.zB, sy);
    stHandle({ view: 'PROFILE', st, kind: 'zB', x: cx, y: sy(pl.zB), zAtY: za, left: true }, cx, sy(pl.zB), `底 ${stf(pl.zB)}`, '#ff4fd8');   // v7.6：縱斷面控點加標籤
    stHandle({ view: 'PROFILE', st, kind: 'zS', x: cx, y: sy(pl.zS), zAtY: za, left: true }, cx, sy(pl.zS), `頂 ${stf(pl.zS)}`, '#ffd08a');
  });
}


/* ---------- 立面尺寸線（延伸線 + 尺寸線 + 斜tick，離結構線一段距離） ---------- */
function stElevDims(g, st) {
  const p = g.p, L = g.L, R = g.R, zbt = g.zbt, zt = g.maxW, dims = [];
  const top = [[-L.x4, L.zW], [-L.x3, L.zW], [-L.x2, p.h1], [-L.x1, 0], [R.x1, 0], [R.x2, p.h1], [R.x3, R.zW], [R.x4, R.zW]];
  const tl = [`r2=${stf(L.r2)}`, `r1=${stf(L.r1)}`, `${stf(L.x2 - L.x1)}`, p.wsp ? `w=${stf(p.w)}（左${stf(L.x1)}／右${stf(R.x1)}）` : `w=${stf(p.w)}`, `${stf(R.x2 - R.x1)}`, `r1=${stf(R.r1)}`, `r2=${stf(R.r2)}`];
  dims.push({ k: 'h', pts: top, labels: tl, side: 'top', refZ: zt, lvl: 1 });
  if (!stNoWing(st, g)) dims.push({ k: 'h', pts: [[-L.x4, L.zW], [R.x4, R.zW]].map(q => q), labels: [`${stf(L.x4 + R.x4)}`], side: 'top', refZ: zt, lvl: 2 });   // 無壩翼：總長只標下方一次
  const bot = [[-L.x4, L.zP5], [-L.x6, 0], [-L.x7, zbt], [R.x7, zbt], [R.x6, 0], [R.x4, R.zP5]];
  if (!(stNoWing(st, g) && Math.abs(L.x7 + R.x7 - p.w) < 1e-6 && Math.abs(L.x4 - L.x7) < 1e-6 && Math.abs(R.x4 - R.x7) < 1e-6)) dims.push({ k: 'h', pts: bot, labels: [`r4=${stf(L.r4)}`, `r5=${stf(L.r5)}`, `${stf(L.x7 + R.x7)}`, `r5=${stf(R.r5)}`, `r4=${stf(R.r4)}`], side: 'bot', refZ: zbt - p.k, lvl: 1 });
  // 右側：k、h2+h3、h1 ；r3 另一欄
  const xb = (S) => S.x7 + (S.x6 - S.x7) * (p.h3 / (p.h2 + p.h3));
  dims.push({ k: 'v', side: 'R', col: 1, pts: [[R.x7, zbt - p.k], [R.x7, zbt], [xb(R), -p.h2], [R.x1, 0], [R.x2, p.h1]], zs: [zbt - p.k, zbt, -p.h2, 0, p.h1], labels: [`k=${stf(p.k)}`, `h3=${stf(p.h3)}`, `h2=${stf(p.h2)}`, `h1=${stf(p.h1)}`] });
  dims.push({ k: 'v', side: 'R', col: 2, pts: [[R.x4, R.zP5], [R.x4, R.zW]], zs: [R.zP5, R.zW], labels: [`r3=${stf(R.r3)}`] });
  dims.push({ k: 'v', side: 'L', col: 1, pts: [[-L.x4, L.zP5], [-L.x4, L.zW]], zs: [L.zP5, L.zW], labels: [`r3=${stf(L.r3)}`] });
  return dims;
}
/* 多邊形與鉛直線(axis=0, x=v)或水平線(axis=1, z=v)之交集範圍 → [min,max] 或 null */
function stPolyCut(poly, axis, v) {
  if (!poly || poly.length < 2) return null; let lo = Infinity, hi = -Infinity; const n = poly.length, o = 1 - axis;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], a0 = a[axis], b0 = b[axis];
    if ((a0 - v) * (b0 - v) > 0) continue;
    if (Math.abs(b0 - a0) < 1e-12) { lo = Math.min(lo, a[o], b[o]); hi = Math.max(hi, a[o], b[o]); continue; }
    const t = (v - a0) / (b0 - a0), w = a[o] + t * (b[o] - a[o]); lo = Math.min(lo, w); hi = Math.max(hi, w);
  }
  return lo <= hi ? [lo, hi] : null;
}
/* 產生圖元：map([x,z])→[X,Y]；o={up:+1(Y向上)/-1(螢幕)，gap,over,step,tk}；回傳 {ln:[[x1,y1,x2,y2]], tx:[{x,y,s,rot,al,va}]}
   延伸線一律由結構外輪廓「外側」起拉（不穿越壩體）；左右欄依實際繪圖方向自動判定（含 dir 反向、標準圖下游視鏡射） */
function stDimPrims(g, st, map, o) {
  const out = { ln: [], tx: [] }, ln = (a, b, c, d) => out.ln.push([a, b, c, d]), up = o.up, EP = g.fills && g.fills.elev && g.fills.elev[0];
  const xs0 = [map([g.xmin, 0])[0], map([g.xmax, 0])[0]], xmin = Math.min(...xs0), xmax = Math.max(...xs0), xc = (xmin + xmax) / 2;
  stElevDims(g, st).forEach(d => {
    if (d.k === 'h') {
      const top = d.side === 'top', Q = d.pts.map(q => { const r = stPolyCut(EP, 0, q[0]); return [q[0], r ? (top ? Math.max(q[1], r[1]) : Math.min(q[1], r[0])) : q[1]]; });
      const P = Q.map(map), Pl = d.pts.map(map);
      const yRef = map([0, d.refZ])[1], sg = top ? up : -up, yd = yRef + sg * (o.gap + o.step * (d.lvl - 1));
      const xsP = P.map(q => q[0]); ln(Math.min(...xsP), yd, Math.max(...xsP), yd);
      P.forEach(q => { ln(q[0], q[1] + sg * o.gap * 0.5, q[0], yd + sg * o.over); ln(q[0] - o.tk, yd - o.tk * sg, q[0] + o.tk, yd + o.tk * sg); });
      d.labels.forEach((s, i) => { const xa = Pl[i][0], xb = Pl[i + 1][0]; if (Math.abs(xb - xa) < 1e-6) return; out.tx.push({ x: (xa + xb) / 2, y: yd + sg * o.th * 0.35, s, rot: 0, al: 'c', va: sg === up ? 'b' : 't' }); });
    } else {
      const outR = d.side === 'R', Q = d.pts.map(q => { const r = stPolyCut(EP, 1, q[1]); return [r ? (outR ? Math.max(q[0], r[1]) : Math.min(q[0], r[0])) : q[0], q[1]]; });
      const P = Q.map(map), xe0 = map([outR ? g.xmax : g.xmin, 0])[0], sd = xe0 >= xc ? 1 : -1, xe = sd > 0 ? xmax : xmin, xd = xe + sd * (o.gap + o.step * (d.col - 1));
      const ys = d.zs.map(z => map([0, z])[1]); ln(xd, Math.min(...ys), xd, Math.max(...ys));
      P.forEach(q => { const yy = q[1]; ln(q[0] + sd * o.gap * 0.5, yy, xd + sd * o.over, yy); ln(xd - o.tk, yy - o.tk, xd + o.tk, yy + o.tk); });
      let alt = 0; d.labels.forEach((s, i) => { const sp = Math.abs(ys[i + 1] - ys[i]); if (sp < 1e-6) return; const tight = sp < s.length * o.th * 0.62; if (tight) alt++; const xo = tight && alt % 2 === 0 ? o.th * 1.25 : 0; out.tx.push({ x: xd + sd * (o.th * 0.35 + xo), y: (ys[i] + ys[i + 1]) / 2, s, rot: 90, al: 'c', va: sd > 0 ? 'b' : 't', sd }); });   // 間距過小者交錯外移，避免文字重疊
    }
  });
  return out;
}

/* ---------- 橫斷面：結構物立面圖（下游視）＋開挖線＋結構線尺寸 ---------- */
function stDrawAccCross(sec, sx, sy, isLarge, focus) {
  stAccAtSec(sec).forEach(({ st, g, u, polys }) => {
    const pl = stPlace(st), d = st.dir, OF = st.p.off || 0, map = ([x, z]) => [sx(d * (x + OF)), sy(pl.zS + z)], F = st._exF;
    ctx.save(); if (focus && focus !== st) ctx.globalAlpha = 0.45; stFillPolys(polys, map, ['rgba(255,230,0,0.10)']);
    ctx.strokeStyle = '#ffe600'; ctx.lineWidth = isLarge ? 1.0 : 0.8; ctx.setLineDash([]);
    polys.forEach(pg => { ctx.beginPath(); pg.forEach((q, k) => { const s = map(q); k ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.stroke(); });
    if (F) { const pts = []; let xa = null, xb = null; for (let x = F.x0; x <= F.x1 + 1e-9; x += 0.1) { const gz = Math.min(secInterp(sec, d * (x + OF), 'groundZ'), secInterp(sec, d * (x + OF), 'desZ')); if (gz > F.zs(u, x)) { if (xa === null) xa = x; xb = x; } }
      if (xa !== null) { const gz = x => Math.min(secInterp(sec, d * (x + OF), 'groundZ'), secInterp(sec, d * (x + OF), 'desZ')); pts.push([xa, gz(xa)]); for (let x = xa; x <= xb + 1e-9; x += 0.1) pts.push([x, F.zs(u, x)]); pts.push([xb, gz(xb)]);
        ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = isLarge ? 1 : 0.8; ctx.setLineDash([5, 3]); ctx.beginPath(); stSimp(pts, 1e-4).forEach(([x, z], k) => { const X = sx(d * (x + OF)), Y = sy(z); k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); } }
    if (isLarge) { ctx.setLineDash([]); ctx.fillStyle = '#ffd08a'; ctx.font = '11px "Noto Sans TC"'; ctx.textAlign = 'left'; const top = Math.max(...polys.flat().map(q => q[1])), xl = Math.min(...polys.flat().map(q => sx(d * q[0]))), gk = [...new Set(polys.map(pg => pg.g).filter(k => ST_ACC_K.includes(k)))]; ctx.fillText(`${gk.map(k => stAccName(st, k)).join('／') || st.name + ' 附屬構造'}（距壩 ${stf(u)} m）`, xl, sy(pl.zS + top) - 10); }   // v5.4：標附屬構造名稱，靠左避開中心線高程標籤
    ctx.restore();
  });
}
function stDrawCross(sec, sx, sy, isLarge) {
  if (isLarge) ST_H = ST_H.filter(h => h.view !== 'CROSS');
  const many = isLarge && stHereList().L.length > 1, selSt = state.structs[state.structSel];   // 本樁有多座：未選取者淡化
  ctx.save(); if (many) ctx.globalAlpha = 1;
  stDrawAccCross(sec, sx, sy, isLarge, many ? selSt : null);
  ctx.restore();
  stAtSec(sec).forEach(st => {
    const g = stGeo(st), pl = stPlace(st), d = st.dir, X = x => sx(d * (x + (st.p.off || 0))), map = ([x, z]) => [X(x), sy(pl.zS + z)], sel = st === state.structs[state.structSel];
    ctx.save(); if (many && !sel) ctx.globalAlpha = 0.45;
    ctx.save();
    stFillPolys(g.fills.elev, map, ['rgba(255,230,0,0.07)', 'rgba(255,230,0,0.12)']);
    ctx.restore();
    // 縱斷面設計高(上/下游)比對線
    const xl = Math.min(X(g.xmin), X(g.xmax)) - 18, xr = Math.max(X(g.xmin), X(g.xmax)) + 18;
    ctx.save(); ctx.lineWidth = 1; ctx.setLineDash([6, 3]);
    [[pl.desUp, '#7dd3fc', '上游設計'], [pl.desDn, '#38bdf8', '下游設計']].forEach(([z, c, t], k) => {
      if (stNoWing(st, g)) return;   // 無壩翼（固床工）：不標上／下游設計高（與頂高、設計線重複）
      if (k === 1 && Math.abs(pl.desUp - pl.desDn) < 1e-6) return;
      ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(xl, sy(z)); ctx.lineTo(xr, sy(z)); ctx.stroke();
      if (isLarge) { ctx.fillStyle = c; ctx.font = '10px "JetBrains Mono"'; ctx.textAlign = 'right'; ctx.fillText(`${Math.abs(pl.desUp - pl.desDn) < 1e-6 ? '設計(上下游)' : t} ${stf(z)}`, xl - 3, sy(z) + 3); }
    });
    ctx.restore();
    // 開挖線（含 key 加挖）：依本斷面屬上游/下游側取對應地面
    const ex = st._ex, S = stSecAt(st), isUp = (S.pre && S.post) ? (d > 0 ? sec === S.pre : sec === S.post) : true, cr = ex && ex.ok ? (isUp ? ex.crossU : ex.crossD) : null;
    if (cr && cr.length > 1) {
      ctx.save(); const hl = sel && ['kx', 'km'].includes(stHLtag()); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = hl ? 3.2 : (isLarge ? 1 : 0.8); ctx.setLineDash(hl ? [] : [5, 3]); ctx.beginPath();
      cr.forEach(([x, z], k) => { const Xp = X(x), Yp = sy(z); k ? ctx.lineTo(Xp, Yp) : ctx.moveTo(Xp, Yp); }); ctx.stroke(); ctx.restore();
    }
    const isDn = !isUp && !!(S.pre && S.post);   // 壩址下游側斷面：壩體立面為背景虛線，另繪側牆／護坦斷面
    stPaint(st, g.lines.elev, map, { lw: isLarge ? 1.0 : 0.8, noLabel: !isLarge, yellow: true, dash: isDn });
    if (isDn && g.acc && g.acc.any) { const polys = stAccCross(g, g.acc.toe + 0.05); ctx.save(); ctx.strokeStyle = '#ffe600'; ctx.lineWidth = isLarge ? 1.0 : 0.8; ctx.setLineDash([]); polys.forEach(pg => { ctx.beginPath(); pg.forEach((q, k) => { const s2 = map(q); k ? ctx.lineTo(s2[0], s2[1]) : ctx.moveTo(s2[0], s2[1]); }); ctx.closePath(); ctx.stroke(); }); ctx.restore(); }
    if (isLarge && sel && stHLtag() && ['nh', 'hsp', 'hcl', 'hb', 'hwx', 'dh'].includes(stHLtag())) { ctx.save(); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 2.6; g.holes.forEach(([hx, hz]) => { ctx.beginPath(); ctx.arc(X(hx), sy(pl.zS + hz), Math.max(3, st.p.dh / 2 * Math.abs(sx(1) - sx(0))), 0, Math.PI * 2); ctx.stroke(); }); ctx.restore(); }
    if (isLarge) {
      ctx.save(); ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 1; ctx.setLineDash(isDn ? [3, 2] : []); g.holes.forEach(([hx, hz]) => { ctx.beginPath(); ctx.arc(X(hx), sy(pl.zS + hz), Math.max(1.5, st.p.dh / 2 * Math.abs(sx(1) - sx(0))), 0, Math.PI * 2); ctx.stroke(); });
      ctx.setLineDash([]); ctx.font = '10.5px "JetBrains Mono"'; ctx.textAlign = 'center';
      if (state.stPrio && !isDn) {   // 結構線優先：標準尺寸線（上游側斷面）
        const pr = stDimPrims(g, st, map, { up: -1, gap: 38, step: 28, over: 5, tk: 3.5, th: 10.5 });
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.7; ctx.setLineDash([]); ctx.beginPath(); pr.ln.forEach(a => { ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); }); ctx.stroke();
        if (window.CXL) pr.tx.forEach(t => { const w = t.s.length * 10.5 * 0.62, h = 12; window.CXL.push(t.rot ? { x0: t.x - h, x1: t.x + h, y0: t.y - w / 2, y1: t.y + w / 2 } : { x0: t.x - w / 2, x1: t.x + w / 2, y0: t.y - h, y1: t.y + h }); });   // 結構物尺寸文字先登記，護岸尺寸避開
        ctx.fillStyle = '#ffffff'; pr.tx.forEach(t => { ctx.save(); ctx.translate(t.x, t.y); if (t.rot) ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = t.rot ? (t.sd > 0 ? 'top' : 'bottom') : (t.va === 'b' ? 'bottom' : 'top'); ctx.fillText(t.s, 0, 0); ctx.restore(); });
        ctx.textBaseline = 'alphabetic';
      }
      const nw = stNoWing(st, g);   // 無壩翼（固床工等）：精簡標註
      if (!nw) { ctx.fillStyle = '#ff7ae0'; ctx.fillText(`開挖底 EL ${stf(pl.floor)}　key 底 ${stf(pl.keyFloor)}　邊坡 1:${st.p.kx}`, X(0), sy(pl.keyFloor) + 22 + 34); }
      if (!isDn) {   // 結構物名稱＋樁號：置於結構物下方（置中、雙底線），參數列於其下
        const y0 = sy(pl.keyFloor) + 22 + 34 + 26, t1 = `${st.name}　${formatStation(st.sta)}`;
        ctx.font = 'bold 13px "Noto Sans TC"'; ctx.fillStyle = '#ffd08a'; ctx.fillText(t1, X(0), y0); const w1 = ctx.measureText(t1).width;
        ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(X(0) - w1 / 2 - 4, y0 + 5); ctx.lineTo(X(0) + w1 / 2 + 4, y0 + 5); ctx.moveTo(X(0) - w1 / 2 - 4, y0 + 8); ctx.lineTo(X(0) + w1 / 2 + 4, y0 + 8); ctx.stroke();
        ctx.font = '10.5px "JetBrains Mono"'; ctx.fillText(`立面圖（${stViewTxt(st)}）　h2=${stf(st.p.h2)}　w=${stf(st.p.w)}　d1=${stf(st.p.d1)}`, X(0), y0 + 22);
      }
      ctx.restore();
      const za = stZAt(pl.zB, sy);
      const nw2 = stNoWing(st, g);
      { const xz = X(0); stHandle({ view: 'CROSS', st, kind: 'zB', x: xz, y: sy(pl.zB), zAtY: za, left: true }, xz, sy(pl.zB), `${nw2 ? '底' : '壩底'} ${stf(pl.zB)}`, '#ff4fd8'); }   // v7.6：底控點移回結構物中心正下方（標籤放左側）   // 無壩翼：底高標籤移離中心線（避開地面高標籤）
      stHandle({ view: 'CROSS', st, kind: 'zS', x: X(0), y: sy(pl.zS), zAtY: za }, X(0), sy(pl.zS), `${nw2 ? '頂' : '溢洪口底'} ${stf(pl.zS)}`, '#ffd08a');
      if (!nw2) {
        stHandle({ view: 'CROSS', st, kind: 'h1', x: X(g.R.x2), y: sy(pl.zS + st.p.h1), zAtY: za }, X(g.R.x2), sy(pl.zS + st.p.h1), `h1 ${stf(st.p.h1)}`, '#a7f3d0');
        stHandle({ view: 'CROSS', st, kind: 'wL', x: X(-g.L.x3), y: sy(pl.zWL), zAtY: za }, X(-g.L.x3), sy(pl.zWL), `左翼頂 ${stf(pl.zWL)}`, '#7dd3fc');
        stHandle({ view: 'CROSS', st, kind: 'wR', x: X(g.R.x3), y: sy(pl.zWR), zAtY: za }, X(g.R.x3), sy(pl.zWR), `右翼頂 ${stf(pl.zWR)}`, '#38bdf8');
      }
    }
    ctx.restore();
  });
}

/* ---------- DXF ---------- */
function stDxfLines(D, lines, map, layer, col) {
  lines.forEach(l => { const P = l.p.map(map); D.poly(P, layer, l.k === 'ref' ? 5 : (l.k === 'hid' ? 8 : (col || 30)), 0, false, (l.k === 'hid' || l.k === 'ref' || l.k === 'wing2') ? 'DASHED' : undefined); });
}
function stDxfPlan(D) {
  state.structs.forEach(st => {
    const g = stGeo(st); if (!getPointAndNormalAtStation(st.sta)) return;
    const map = ([u, x]) => stWorld(st, u, x);
    D.poly(g.plan.map(q => map(q)), 'STRUCT_PLAN', 7, 0, true);
    stDxfLines(D, g.lines.plan, map, 'STRUCT_PLAN', 7);
    { const a = stWorld(st, g.uUpB - 2.5, 0), b = stWorld(st, g.uUpB - 0.4, 0); if (a && b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, h = 0.6; D.line(a[0], a[1], 0, b[0], b[1], 0, 'PLAN_FLOW', 4); D.poly([[b[0] - ux * h * 1.6 - uy * h * 0.6, b[1] - uy * h * 1.6 + ux * h * 0.6], [b[0], b[1]], [b[0] - ux * h * 1.6 + uy * h * 0.6, b[1] - uy * h * 1.6 - ux * h * 0.6]], 'PLAN_FLOW', 4); } }

    const c0 = stWorld(st, 0, 0), gg = getPointAndNormalAtStation(st.sta);
    if (c0) stPlanLabels(st, g).forEach(it => { const W = it.pts.map(q => map(q)).filter(Boolean); if (!W.length) return; const yb = Math.min(...W.map(q => q[1])), xc = W.reduce((a, q) => a + q[0], 0) / W.length; D.text(xc, yb - (it.main ? 2.0 : 1.6), it.main ? 1.4 : 1.1, it.t, 'STRUCT_TEXT', 30, { align: 'c' }); });
  });
}
function stDxfProfile(D, X, Y, minSta, maxSta, th) {
  state.structs.forEach(st => {
    if (st.sta < minSta || st.sta > maxSta) return;
    const g = stGeo(st), pl = stPlace(st), map = ([u, z]) => [X(st.sta + st.dir * u), Y(pl.zS + z)];
    g.fills.sect.slice(0, 2).forEach(pg => D.poly(pg.map(map), 'STRUCT_PROF', 30, 0, true));
    stDxfLines(D, g.lines.sect, map, 'STRUCT_PROF');
    if (g.acc && g.acc.holes) g.acc.holes.list.forEach(([u, z]) => D.circle(X(st.sta + st.dir * u), Y(pl.zS + z), Math.max(0.05, g.acc.holes.dh / 2), 'STRUCT_PROF', 30));
    if (st._ex && st._ex.ok) st._ex.profs.forEach(pf => D.poly(pf.map(([u, z]) => [X(st.sta + st.dir * u), Y(z)]), 'STRUCT_EXC', 6, 0, false, 'DASHED'));
    { const X0 = X(st.sta), Y0 = Y(pl.zTop) + th * 0.5, Y1 = Y0 + th * 3; D.poly([[X0, Y0], [X0, Y1], [X0 + th * 3, Y1]], 'STRUCT_TEXT', 30); D.text(X0 + th * 3.4, Y1 - th * 0.3, th * 0.9, `${st.name} ${formatStation(st.sta)}`, 'STRUCT_TEXT', 30); }
  });
}
function stDxfCross(D, sec, sx, sy, TH) {
  stAccAtSec(sec).forEach(({ st, u, polys }) => { const pl = stPlace(st), d = st.dir; polys.forEach(pg => D.poly(pg.map(([x, z]) => [sx(d * (x + (st.p.off || 0))), sy(pl.zS + z)]), 'STRUCT_ELEV', 2, 0, true)); D.text(Math.min(...polys.flat().map(q => sx(d * q[0]))), sy(pl.zS + Math.max(...polys.flat().map(q => q[1]))) + TH * 0.8, TH * 0.9, `${[...new Set(polys.map(pg => pg.g).filter(k => ST_ACC_K.includes(k)))].map(k => stAccName(st, k)).join('/') || st.name + ' 附屬構造'}(距壩 ${stf(u)} m)`, 'STRUCT_TEXT', 30, { align: 'l' }); });
  stAtSec(sec).forEach(st => {
    const g = stGeo(st), pl = stPlace(st), d = st.dir, X = x => sx(d * (x + (st.p.off || 0))), map = ([x, z]) => [X(x), sy(pl.zS + z)], E = g.fills.elev[0].map(map);
    const S0 = stSecAt(st), isDn = !!(S0.pre && S0.post) && (d > 0 ? sec === S0.post : sec === S0.pre);
    if (isDn) { g.lines.elev.forEach(l => D.poly(l.p.map(map), 'STRUCT_ELEV', 2, 0, false, 'DASHED')); if (g.acc && g.acc.any) stAccCross(g, g.acc.toe + 0.05).forEach(pg => D.poly(pg.map(map), 'STRUCT_ELEV', 2, 0, true)); }
    else { D.poly(E, 'STRUCT_ELEV', 2, 0, true); D.poly(g.fills.elev[1].map(map), 'STRUCT_ELEV', 8, 0, true, 'DASHED'); stDxfLines(D, g.lines.elev, map, 'STRUCT_ELEV', 2); }
    if (state.stPrio && !isDn) { const pr = stDimPrims(g, st, map, { up: 1, gap: TH * 2.8, step: TH * 2.1, over: TH * 0.4, tk: TH * 0.25, th: TH * 0.7 });
      pr.ln.forEach(a => D.line(a[0], a[1], 0, a[2], a[3], 0, 'STRUCT_DIM', 7));
      pr.tx.forEach(t => D.text(t.x, t.y, TH * 0.7, t.s, 'STRUCT_DIM', 7, { align: 'c', valign: t.rot ? (t.sd > 0 ? 't' : 'b') : (t.va === 'b' ? 'b' : 't'), rot: t.rot ? 90 : 0 })); }
    g.holes.forEach(([hx, hz]) => D.circle(X(hx), sy(pl.zS + hz), st.p.dh / 2, 'STRUCT_ELEV', 30));
    const xl = Math.min(X(g.xmin), X(g.xmax)) - 0.5, xr = Math.max(X(g.xmin), X(g.xmax)) + 0.5;
    if (!stNoWing(st, g)) D.line(xl, sy(pl.desUp), 0, xr, sy(pl.desUp), 0, 'STRUCT_EXC', 5, 'DASHED');
    if (!stNoWing(st, g) && Math.abs(pl.desUp - pl.desDn) > 1e-6) D.line(xl, sy(pl.desDn), 0, xr, sy(pl.desDn), 0, 'STRUCT_EXC', 5, 'DASHED');
    const S = stSecAt(st), isUp = (S.pre && S.post) ? (d > 0 ? sec === S.pre : sec === S.post) : true, cr = st._ex && st._ex.ok ? (isUp ? st._ex.crossU : st._ex.crossD) : null;
    if (cr && cr.length > 1) D.poly(cr.map(([x, z]) => [X(x), sy(z)]), 'STRUCT_EXC', 6, 0, false, 'DASHED');
    if (!stNoWing(st, g)) D.text(X(0), sy(pl.keyFloor) - TH * 2.4, TH * 0.8, `開挖底 EL ${stf(pl.floor)} (基礎底面 -10cm)  key 開挖底 EL ${stf(pl.keyFloor)}  邊坡 1:${st.p.kx}`, 'STRUCT_TEXT', 6, { align: 'c' });
    if (!isDn) {   // 結構物名稱＋樁號：置於結構物下方（置中、雙底線）
      const y0 = sy(pl.keyFloor) - TH * 4.2, t1 = `${st.name} ${formatStation(st.sta)}`, w1 = stTextW(t1, TH * 1.1);
      D.text(X(0), y0, TH * 1.1, t1, 'STRUCT_TEXT', 30, { align: 'c' });
      D.line(X(0) - w1 / 2 - 0.2, y0 - TH * 0.35, 0, X(0) + w1 / 2 + 0.2, y0 - TH * 0.35, 0, 'STRUCT_TEXT', 30); D.line(X(0) - w1 / 2 - 0.2, y0 - TH * 0.55, 0, X(0) + w1 / 2 + 0.2, y0 - TH * 0.55, 0, 'STRUCT_TEXT', 30);
      D.text(X(0), y0 - TH * 1.6, TH * 0.7, `立面圖(${stViewTxt(st)}) h2=${stf(st.p.h2)} w=${stf(st.p.w)} d1=${stf(st.p.d1)} 壩底 ${stf(pl.zB)}`, 'STRUCT_TEXT', 30, { align: 'c' });
    }
  });
}
function stQtyHeight() { const th = 1.6; let h = th * 2.2; state.structs.forEach(st => { if (st._q) h += th * 4.2 + st._q.rows.length * th * 1.4 + th * 0.8; Object.values(st._accQ || {}).forEach(Q => { h += th * 1.6 + Q.rows.length * th * 1.4 + th * 0.8; }); }); return h; }
function stDxfQty(D, x0, yBase) {   // 結構物數量表（文字）：置於橫斷面圖上方
  if (!state.structs.length) return;
  const th = 1.6; let y = yBase + stQtyHeight();
  D.text(x0, y, th * 1.3, (clMulti() ? `【${clName()}】` : '') + '結構物數量表（各斷面分段切頭公式；開挖底 = 基礎底面 -10cm、key 底 -10cm，邊坡 1:kx）', 'STRUCT_TEXT', 30); y -= th * 2.2;
  state.structs.forEach(st => {
    if (!st._q) return;
    const g = stGeo(st), pl = stPlace(st), p = st.p;
    D.text(x0, y, th, `${st.name}  ${formatStation(st.sta)}  w=${stf(p.w)} h1=${stf(p.h1)} d1=${stf(p.d1)} s1=${p.s1} h2=${stf(p.h2)} h3=${stf(p.h3)} k=${stf(p.k)} k1=${stf(p.k1)} s2=${p.s2} s3=${p.s3} s4=${p.s4} s5=${p.s5}  壩底 EL ${stf(pl.zB)}`, 'STRUCT_TEXT', 30); y -= th * 1.6;
    D.text(x0 + th, y, th * 0.9, `左翼 r1=${stf(g.L.r1, 1)} rs=1:${g.L.rs} r2=${stf(g.L.r2)} r3=${stf(g.L.r3)} r4=${stf(g.L.r4)} r5=${stf(g.L.r5)}　右翼 r1=${stf(g.R.r1, 1)} rs=1:${g.R.rs} r2=${stf(g.R.r2)} r3=${stf(g.R.r3)} r4=${stf(g.R.r4)} r5=${stf(g.R.r5)}`, 'STRUCT_TEXT', 7); y -= th * 1.2;
    D.text(x0 + th, y, th * 0.9, `排水孔 ${stGeo(st).holes.length} 處 φ${stf(p.dh * 100, 0)}cm　開挖 kx=1:${p.kx} km=${stf(p.km)}`, 'STRUCT_TEXT', 7); y -= th * 1.2;
    st._q.rows.forEach(r => { D.text(x0 + th, y, th * 0.9, `${r.it}  ${stf(r.v, r.u === '處' ? 0 : 2)} ${r.u}    ${r.fx}`, 'STRUCT_TEXT', 7); y -= th * 1.4; });
    y -= th * 0.8;
    stAccList(st).forEach(k => { const Q = (st._accQ || {})[k]; if (!Q) return; D.text(x0, y, th, `${stAccName(st, k)}（${stAccLabel(st, k)}，附屬於 ${st.name}）  ${formatStation(st.sta + st.dir * Q.u0)}～${formatStation(st.sta + st.dir * Q.u1)}`, 'STRUCT_TEXT', 30); y -= th * 1.6;
      Q.rows.forEach(r => { D.text(x0 + th, y, th * 0.9, `${r.it}  ${stf(r.v, r.u === '處' ? 0 : 2)} ${r.u}    ${String(r.fx).replace(/<[^>]+>/g, '')}`, 'STRUCT_TEXT', 7); y -= th * 1.4; }); y -= th * 0.8; });
  });
}

/* ---------- 橫斷面「單一圖」下方站號條：迷你縱斷面＋樁號刻度（結構物所在樁橘色），單擊切換斷面 ---------- */
const ST_STRIP_H = 58;
function stDrawStrip(w, h) {
  const secs = state.sections; if (secs.length < 2) { state._strip = null; return; }
  const x0 = 65, x1 = w - 40, y0 = h - ST_STRIP_H + 2, y1 = h - 8, s0 = secs[0].sta, s1 = secs[secs.length - 1].sta, span = (s1 - s0) || 1;
  let zmin = Infinity, zmax = -Infinity; secs.forEach(s => { zmin = Math.min(zmin, s.groundCenter, s.desCenterZ); zmax = Math.max(zmax, s.groundCenter, s.desCenterZ); });
  state.structs.forEach(st => { const pl = stPlace(st); zmin = Math.min(zmin, pl.zB); zmax = Math.max(zmax, pl.zTop); });
  const X = s => x0 + (s - s0) / span * (x1 - x0), Y = z => y1 - 12 - (z - zmin) / ((zmax - zmin) || 1) * (y1 - y0 - 24);
  ctx.save();
  ctx.fillStyle = '#0b1018'; ctx.strokeStyle = '#233146'; ctx.lineWidth = 1; ctx.fillRect(x0 - 8, y0 - 2, x1 - x0 + 16, y1 - y0 + 4); ctx.strokeRect(x0 - 8, y0 - 2, x1 - x0 + 16, y1 - y0 + 4);
  ctx.beginPath(); ctx.rect(x0 - 8, y0 - 2, x1 - x0 + 16, y1 - y0 + 4); ctx.clip();
  [['groundCenter', 'rgba(255,255,255,.8)'], ['desCenterZ', 'rgba(59,130,246,.95)']].forEach(([k, c]) => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); secs.forEach((s, i) => { const x = X(s.sta), y = Y(s[k]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); });
  const items = [];
  state.structs.forEach(st => { const pl = stPlace(st), x = X(st.sta); ctx.fillStyle = 'rgba(255,159,67,.9)'; ctx.fillRect(x - 2, Y(pl.zTop), 4, Math.max(2, Y(pl.zB) - Y(pl.zTop))); });
  secs.forEach((s, i) => {
    const hasS = state.structs.some(t => Math.abs(t.sta - s.sta) < 0.03), off = s.side === 'pre' ? -3 : (s.side === 'post' ? 3 : 0), x = X(s.sta) + off, cur = i === state.selectedStaIdx;
    items.push({ x, idx: i });
    ctx.strokeStyle = cur ? '#00f0ff' : (hasS ? '#ff9f43' : '#64748b'); ctx.lineWidth = cur ? 2.4 : (hasS ? 1.6 : 0.8);
    ctx.beginPath(); ctx.moveTo(x, y1 - (cur ? 12 : 7)); ctx.lineTo(x, y1); ctx.stroke();
    if (hasS) { ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.moveTo(x, y1 - 14); ctx.lineTo(x - 4, y1 - 21); ctx.lineTo(x + 4, y1 - 21); ctx.closePath(); ctx.fill(); }
  });
  const cur = secs[state.selectedStaIdx];
  if (cur) { ctx.font = 'bold 11px "JetBrains Mono"'; ctx.fillStyle = '#00f0ff'; ctx.textAlign = 'center'; const cx = Math.max(x0 + 40, Math.min(x1 - 40, X(cur.sta))); ctx.fillText(cur.staLabel, cx, y0 + 10); }
  ctx.restore();
  ctx.save(); ctx.font = '10px "Noto Sans TC"'; ctx.fillStyle = '#8b9bb4'; ctx.textAlign = 'right'; ctx.fillText('樁號條', x0 - 12, y1 - 4); ctx.restore();
  state._strip = { x0, x1, y0, y1, items };
}

/* ---------- 繪中心線：橡皮筋預覽改以輕量覆蓋層即時繪製（不受主圖重繪延遲影響） ---------- */
let AXOV_LAST = null, AXOV_ON = false;
function axisOvDraw() {
  const ov = document.getElementById('axisOverlay'), cv = document.getElementById('cadCanvas'); if (!ov || !cv) return;
  const ext = state.viewMode === '2D' && AXOV_LAST && typeof dzOvActive === 'function' && dzOvActive();   // v5.6：鎖點、選線、整治區／基準線繪製等覆蓋顯示
  const draw = state.viewMode === '2D' && state.activeTool === 'DRAW_AXIS' && AXOV_LAST;
  const active = draw || ext;
  if (!active && !AXOV_ON) return;
  const d = window.devicePixelRatio || 1, r = cv.getBoundingClientRect(), W = Math.round(r.width * d), H = Math.round(r.height * d);
  if (ov.width !== W || ov.height !== H) { ov.width = W; ov.height = H; }
  const oc = ov.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, ov.width, ov.height);
  AXOV_ON = !!active; if (!active) return;
  oc.setTransform(d, 0, 0, d, 0, 0);
  if (draw) {
    const sn = typeof dzSnapPt === 'function' ? dzSnapPt(AXOV_LAST.x, AXOV_LAST.y) : null, mp = sn ? worldToScreen2D(sn.x, sn.y) : AXOV_LAST;
    if (state.tempAxisNodes.length) {
      const nd = state.tempAxisNodes[state.tempAxisNodes.length - 1], p = worldToScreen2D(nd.x, nd.y);
      oc.strokeStyle = '#00e676'; oc.lineWidth = 2.2; oc.setLineDash([6, 4]); oc.beginPath(); oc.moveTo(p.x, p.y); oc.lineTo(mp.x, mp.y); oc.stroke(); oc.setLineDash([]);
    }
    if (sn) { oc.strokeStyle = '#ff00ff'; oc.lineWidth = 2; oc.strokeRect(mp.x - 6, mp.y - 6, 12, 12); }
    else if (state.tempAxisNodes.length) { oc.fillStyle = '#ffe600'; oc.beginPath(); oc.arc(mp.x, mp.y, 3.5, 0, Math.PI * 2); oc.fill(); }
  }
  if (ext) dzOvDraw(oc);
}
window.addEventListener('mousemove', e => { const cv = document.getElementById('cadCanvas'); if (!cv) return; const r = cv.getBoundingClientRect(); AXOV_LAST = { x: e.clientX - r.left, y: e.clientY - r.top, alt: e.altKey }; if (state.activeTool === 'DRAW_AXIS' || AXOV_ON || (typeof dzOvActive === 'function' && dzOvActive())) axisOvDraw(); }, true);

function stNearVip(sta) { return state.structs.length > 0; }

/* ============================================================================
   標準圖（每座壩一張）：平面圖／立面圖（下游視，含尺寸）／各變化段剖面（順水流向，含地形線、設計線、開挖線）／數量
   圖元以「公尺」為單位（S=1:100 時 1 m = 10 mm），畫面與 DXF 共用同一份圖元
   ============================================================================ */
const ST_SC = { st: '#ffe600', dim: '#ffffff', gnd: '#cbd5e1', des: '#38bdf8', exc: '#ff4fd8', cut: '#7dd3fc', txt: '#e2e8f0', ttl: '#ffd08a' };
function stStdPrims(st) {
  const g = stGeo(st), pl = stPlace(st), p = st.p, ex = st._exD || st._ex, F = st._exFD || st._exF, P = [], TH = 0.3, zS = pl.zS;   // v5.4：壩體標準圖只畫壩體（護坦／側牆／尾檻各有標準圖）
  const L = (pts, c, a, ly, o = {}) => { const q = pts.filter(v => Number.isFinite(v[0]) && Number.isFinite(v[1])); if (q.length > 1) P.push({ t: 'l', p: q, c, a, ly, d: o.d || 0, w: o.w || 1, cl: !!o.cl }); };
  const T = (x, y, h, s, c, a, ly, o = {}) => P.push({ t: 't', x, y, h, s: String(s), c, a, ly, al: o.al || 'l', va: o.va || 'b', rot: o.rot || 0 });
  const Fi = () => {};   // 不填色
  const circ = (cx, cy, r) => { const o = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; };
  const ok = ex && ex.ok && F;
  // ===== 平面圖：上游在上、水流向下；X = −x（與立面圖下游視一致：右岸在圖左、左岸在圖右，與總平面實際方位相符） =====
  const pm = ([u, x]) => [-x, -u], DX0 = -g.xmax, DX1 = -g.xmin;
  let uA = g.uUpB - 1, uB = g.uDnB + 1;
  g.plan.forEach(([u]) => { uA = Math.min(uA, u - 1); uB = Math.max(uB, u + 1); });
  const planTop = -uA + 1, planBot = -uB - 1;
  Fi(g.plan.map(pm), 'rgba(255,230,0,0.10)');
  g.lines.plan.forEach(l => { if (!l.g) L(l.p.map(pm), ST_SC.st, 2, 'STD_STRUCT', { d: l.k === 'hid' ? 1 : 0 }); });

  L([[DX0 - 1.5, 0], [DX1 + 1.5, 0]], ST_SC.cut, 4, 'STD_AXIS', { d: 2 }); T(DX1 + 1.7, 0, TH * 0.8, '壩軸', ST_SC.cut, 4, 'STD_TEXT', { va: 'm' });
  T(DX0 - 0.3, 0.5, TH, '右岸', ST_SC.txt, 7, 'STD_TEXT', { al: 'r', va: 'b' }); T(DX1 + 0.3, 0.5, TH, '左岸', ST_SC.txt, 7, 'STD_TEXT', { al: 'l', va: 'b' });
  { const ax = DX0 - 3, y0 = -(g.uUpB - 1), y1 = -(g.uDnB + 1); L([[ax, y0], [ax, y1]], ST_SC.des, 5, 'STD_TEXT'); L([[ax - 0.35, y1 + 0.7], [ax, y1], [ax + 0.35, y1 + 0.7]], ST_SC.des, 5, 'STD_TEXT'); T(ax - 0.4, (y0 + y1) / 2, TH, '水流', ST_SC.des, 5, 'STD_TEXT', { al: 'r', va: 'm' }); }
  if (ok) { let tier = 0, px = null; ex.cuts.forEach(c => {   // 切線相距 <0.5 m 者，標示上下錯開（每級退一個字長）
    tier = px !== null && Math.abs(c.x - px) < 0.5 ? (tier + 1) % 3 : 0; px = c.x; const dy = tier * (stTextW(c.lab, TH * 0.7) + 0.3);
    L([[-c.x, planTop - 0.3 - dy], [-c.x, planBot + 0.3 + dy]], ST_SC.cut, 4, 'STD_CUT', { d: 2 }); T(-c.x, planTop - 0.2 - dy, TH * 0.7, c.lab, ST_SC.cut, 4, 'STD_CUT', { al: 'l', va: 'm', rot: 90 }); T(-c.x, planBot + 0.2 + dy, TH * 0.7, c.lab, ST_SC.cut, 4, 'STD_CUT', { al: 'r', va: 'm', rot: 90 }); }); }
  T((DX0 + DX1) / 2, planBot - 2.2, TH * 1.4, `${stNm(st)}　平面圖　S=1:100`, ST_SC.ttl, 30, 'STD_TITLE', { al: 'c', va: 't' });
  // ===== 立面圖（下游視）：置於平面圖上方，X = x，Y = (z − 溢洪口底) + oyE =====
  const dO = { up: 1, gap: TH * 2, step: TH * 2.2, over: TH * 0.5, tk: TH * 0.3, th: TH };
  const zLoR = g.zbt - p.k - ST_CL, oyE = planTop + 4 + (-zLoR) + dO.gap + TH * 2 + 1, em = ([x, z]) => [-x, z + oyE], ea = (x, zabs) => [-x, zabs - zS + oyE];
  Fi(g.fills.elev[0].map(em), 'rgba(255,230,0,0.08)');
  g.lines.elev.forEach(l => L(l.p.map(em), l.k === 'ref' ? ST_SC.des : ST_SC.st, l.k === 'ref' ? 5 : 2, 'STD_STRUCT', { d: (l.k === 'hid' || l.k === 'ref') ? 1 : 0 }));
  g.holes.forEach(([hx, hz]) => L(circ(-hx, hz + oyE, p.dh / 2), ST_SC.st, 2, 'STD_STRUCT'));
  if (ok) {
    const gl = [], dl = [], xl = []; let xa = null, xb = null; const zl = x => Math.min(F.zs(0, x), F.hasKey ? F.zs(F.kMid, x) : 1e9);
    for (let x = Math.max(F.x0, ex.xEL - 2); x <= Math.min(F.x1, ex.xER + 2) + 1e-9; x += 0.1) { const a = F.gnd(0, x), c = F.des(0, x); if (Number.isFinite(a)) gl.push(ea(x, a)); if (Number.isFinite(c)) dl.push(ea(x, c)); if (F.surf(0, x) > zl(x)) { if (xa === null) xa = x; xb = x; } }
    L(stSimp(gl, 1e-5), ST_SC.gnd, 8, 'STD_GROUND'); L(stSimp(dl, 1e-5), ST_SC.des, 5, 'STD_DESIGN', { d: 1 });
    if (xa !== null) { xl.push(ea(xa, F.surf(0, xa))); for (let x = xa; x <= xb + 1e-9; x += 0.1) xl.push(ea(x, zl(x))); xl.push(ea(xb, F.surf(0, xb))); L(stSimp(xl, 1e-5), ST_SC.exc, 6, 'STD_EXC', { d: 1 }); }
  }
  { const pr = stDimPrims(g, st, em, dO); pr.ln.forEach(a => L([[a[0], a[1]], [a[2], a[3]]], ST_SC.dim, 7, 'STD_DIM', { w: 0.7 })); pr.tx.forEach(t => T(t.x, t.y, TH * 0.85, t.s, ST_SC.dim, 7, 'STD_DIM', { al: 'c', va: t.rot ? (t.sd > 0 ? 't' : 'b') : t.va, rot: t.rot ? 90 : 0 })); }
  const EP = g.fills.elev[0], elTag = (z, txt) => { const y = z + oyE, xe = DX0 - 4.2 - dO.gap - dO.step, xr = stPolyCut(EP, 1, z), xs = xr ? -xr[1] - 0.3 : DX0 - 0.3; L([[xe + 0.1, y], [xs, y]], ST_SC.gnd, 8, 'STD_TEXT', { d: 1, w: 0.6 }); T(xe, y, TH * 0.8, txt, ST_SC.txt, 7, 'STD_TEXT', { al: 'r', va: 'm' }); };
  elTag(0, `溢洪口底 EL ${stf(zS)}`); elTag(-p.h2, `下游河床 EL ${stf(pl.zBed)}`); elTag(g.zbt, `壩底 EL ${stf(pl.zB)}`); elTag(g.R.zW, `右翼頂 EL ${stf(pl.zWR)}`);
  const eTop = g.maxW + oyE + dO.gap + dO.step + TH * 5;
  T(0, eTop, TH * 1.4, `${stNm(st)}　立面圖（下游視：右岸在左、左岸在右）　S=1:100`, ST_SC.ttl, 30, 'STD_TITLE', { al: 'c', va: 'b' });
  T(0, eTop - TH * 1.7, TH * 0.85, `${formatStation(st.sta)}　h2=${stf(p.h2)}　h3=${stf(p.h3)}　w=${stf(p.w)}　d1=${stf(p.d1)}　hq=${stf(p.hq)}　開挖底 EL ${stf(pl.floor)}　key 開挖底 EL ${stf(pl.keyFloor)}　邊坡 1:${p.kx}`, ST_SC.txt, 7, 'STD_TEXT', { al: 'c', va: 'b' });
  // ===== 各變化段剖面（順水流向；X = u，Y = z）：置於平面圖下方 =====
  let qY = planBot - 3;
  if (ok && ex.cuts.length) {
    let uMin = Infinity, uMax = -Infinity, zHi = -Infinity, zLo = Infinity;
    let span = 0;
    ex.cuts.forEach(c => { let h = -Infinity, l = Infinity; [c.gl, ...c.ex].forEach(a => a.forEach(([u, z]) => { uMin = Math.min(uMin, u); uMax = Math.max(uMax, u); h = Math.max(h, z - zS); l = Math.min(l, z - zS); })); h = Math.max(h, c.top); l = Math.min(l, c.bot - (c.key ? p.k : 0) - ST_CL); c._zh = h; c._zl = l; span = Math.max(span, h - l); });
    const cw = Math.max((uMax - uMin) + 3, TH * 22), ch = span + TH * 7, top0 = eTop + TH * 2, hL = top0 - (planBot - 3), sx0 = DX1 + 9 + dO.gap + dO.step, WL = g.xmax - g.xmin + 16, HL = hL + 12, nC = ex.cuts.length;
    let nrow = 1, best = 1e9; for (let r = 1; r <= nC; r++) { const c = Math.ceil(nC / r), asp = (WL + c * cw) / Math.max(HL, r * ch + 4), e = Math.abs(Math.log(asp / 1.414)); if (e < best) { best = e; nrow = r; } }
    const ncol = Math.ceil(nC / nrow);
    T(sx0, top0, TH * 1.4, `${stNm(st)}　各變化段剖面　S=1:100（順水流向、上游在左；S1…由圖左至右編號，累距自圖左翼端起算）`, ST_SC.ttl, 30, 'STD_TITLE', { va: 't' });
    ex.cuts.forEach((c, i) => {
      const col = i % ncol, row = Math.floor(i / ncol), ox = sx0 + col * cw - uMin + 1, yT = top0 - TH * 3 - row * ch, oy = yT - TH * 1 - c._zh;
      const mp = ([u, zabs]) => [ox + u, zabs - zS + oy], mr = ([u, z]) => [ox + u, z + oy];
      const zb = c.bot, zt = c.top, fu = [[g.uU(zb), zb]], fd = [[g.uD(zb), zb]];
      if (zb < 0 && zt > 0) { fu.push([g.uU(0), 0]); fd.push([g.uD(0), 0]); }
      fu.push([g.uU(zt), zt]); fd.push([g.uD(zt), zt]);
      const poly = fu.concat(fd.reverse()); Fi(poly.map(mr), 'rgba(255,230,0,0.12)'); L(poly.concat([poly[0]]).map(mr), ST_SC.st, 2, 'STD_STRUCT');
      if (c.key) { const k0 = g.uDnB - p.k1, k1 = g.uDnB, kp = [[k0, g.zbt], [k0, g.zbt - p.k], [k1, g.zbt - p.k], [k1, g.zbt]]; Fi(kp.map(mr), 'rgba(255,230,0,0.12)'); L(kp.map(mr), ST_SC.st, 2, 'STD_STRUCT'); }
      L(c.gl.map(mp), ST_SC.gnd, 8, 'STD_GROUND'); L(c.dl.map(mp), ST_SC.des, 5, 'STD_DESIGN', { d: 1 }); c.ex.forEach(e => L(e.map(mp), ST_SC.exc, 6, 'STD_EXC', { d: 1 }));
      const cx = ox + (uMin + uMax) / 2;
      {   // 剖面樁號標於剖面下方（置中、底線），面積列於右側
        const tag = c.lab, h = TH * 1.1, yL = oy + c._zl - TH * 0.9, w = stTextW(tag, h), x0 = cx - w / 2;
        T(cx, yL, h, tag, ST_SC.ttl, 30, 'STD_TITLE', { al: 'c', va: 't' });
        L([[x0 - 0.2, yL - h * 1.25], [x0 + w + 0.2, yL - h * 1.25]], ST_SC.ttl, 30, 'STD_TITLE'); L([[x0 - 0.2, yL - h * 1.45], [x0 + w + 0.2, yL - h * 1.45]], ST_SC.ttl, 30, 'STD_TITLE');
        T(x0 + w + 0.8, yL, TH * 0.75, `混凝土 A=${stf(c.Ac)} m²${c.key ? '(含 key)' : ''}`, ST_SC.txt, 7, 'STD_TEXT', { va: 't' });
        T(x0 + w + 0.8, yL - TH * 1.1, TH * 0.75, `開挖　 A=${stf(c.A)} m²`, ST_SC.exc, 6, 'STD_TEXT', { va: 't' });
      }
    });
  }
  // ===== 數量 =====
  const q = st._q, qx = DX0 - 3; let y = qY;
  if (q) {
    T(qx, y, TH * 1.3, `${stNm(st)}　數量計算`, ST_SC.ttl, 30, 'STD_TITLE', { va: 't' }); y -= TH * 2.2;
    q.rows.forEach(r => { T(qx, y, TH * 0.85, `${r.it}　${stf(r.v, r.u === '處' ? 0 : 2)} ${r.u}`, ST_SC.txt, 7, 'STD_QTY', { va: 't' }); y -= TH * 1.3; T(qx + 0.6, y, TH * 0.65, r.fx.replace(/<[^>]+>/g, ''), '#94a3b8', 8, 'STD_QTY', { va: 't' }); y -= TH * 1.5; });
    if (q.segs && q.segs.length) {   // v6.3：混凝土逐區段計算表（A1、A2＝各變化段剖面圖標註的混凝土 A；累距同剖面標籤）
      const x00 = q.segs[q.segs.length - 1].x1;   /* 剖面累距自圖左翼端（下游視右岸）起算＝x 反向 */ y -= TH; T(qx, y, TH * 0.95, `混凝土：各變化段剖面切頭公式 V＝L/3×(A1＋A2＋√(A1×A2))（A 見各剖面標註）`, ST_SC.txt, 7, 'STD_QTY', { va: 't' }); y -= TH * 1.6;
      const cw2 = [3.2, 5.2, 2.6, 4.6, 3.4], R2 = [['區段', '累距(m)', 'L(m)', 'A1／A2(m²)', 'V(m³)'], ...q.segs.slice().reverse().map((g2, i) => [String(i + 1) + (g2.key ? '·key' : ''), stf(x00 - g2.x1) + '～' + stf(x00 - g2.x0), stf(g2.L), stf(g2.A2) + '／' + stf(g2.A1), stf(g2.V)])];
      R2.forEach((r, i) => { let xx = qx; r.forEach((cell, k) => { T(xx + (k ? cw2[k] - 0.2 : 0), y, TH * 0.75, cell, i ? ST_SC.txt : ST_SC.ttl, 7, 'STD_QTY', { al: k ? 'r' : 'l', va: 't' }); xx += cw2[k]; }); y -= TH * 1.25; });
    }
    if (q.tExc) {
      y -= TH; T(qx, y, TH * 0.95, `開挖：${stCutTag(st, '')} 各變化段剖面平均斷面法`, ST_SC.exc, 6, 'STD_QTY', { va: 't' }); y -= TH * 1.6;
      const cwid = [5.2, 4.6, 2.6, 3.4, 3.4]; q.tExc.forEach((r, i) => { let xx = qx; r.forEach((cell, k) => { T(xx + (k ? cwid[k] - 0.2 : 0), y, TH * 0.75, cell, i ? ST_SC.txt : ST_SC.ttl, 7, 'STD_QTY', { al: k ? 'r' : 'l', va: 't' }); xx += cwid[k]; }); y -= TH * 1.25; });
    }
  }
  const bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }, ext = (x, y2) => { bb.x0 = Math.min(bb.x0, x); bb.x1 = Math.max(bb.x1, x); bb.y0 = Math.min(bb.y0, y2); bb.y1 = Math.max(bb.y1, y2); };
  P.forEach(o => { if (o.t === 't') { ext(o.x, o.y); ext(o.x + (o.al === 'l' ? 1 : -1) * o.s.length * o.h * 0.9, o.y); } else o.p.forEach(v => ext(v[0], v[1])); });
  return { P, bb };
}

/* ---- v5.4 附屬構造（護坦／水墊、側牆、尾檻）獨立標準圖：平面圖（上游在上）＋順水流剖面（上游在左）＋橫斷面（下游視）＋數量 ---- */
function stAccStdPrims(st, k) {
  const g = stGeo(st), R = g.acc, pl = stPlace(st), zS = pl.zS, P = [], TH = 0.3, nm = stAccName(st, k), lb = stAccLabel(st, k), Q = (st._accQ || {})[k];
  if (!R || !R.any) return { P, bb: { x0: 0, y0: 0, x1: 1, y1: 1 } };
  const L = (pts, c, a, ly, o = {}) => { const q = pts.filter(v => Number.isFinite(v[0]) && Number.isFinite(v[1])); if (q.length > 1) P.push({ t: 'l', p: q, c, a, ly, d: o.d || 0, w: o.w || 1, cl: !!o.cl }); };
  const T = (x, y, h, s, c, a, ly, o = {}) => P.push({ t: 't', x, y, h, s: String(s), c, a, ly, al: o.al || 'l', va: o.va || 'b', rot: o.rot || 0 });
  const tk = TH * 0.35, DC = ST_SC.dim;
  const dH = (xa, xb, y, yRef, txt) => { if (Math.abs(xb - xa) < 1e-6) return; const sg = y >= yRef ? 1 : -1; L([[xa, y], [xb, y]], DC, 7, 'STD_DIM', { w: 0.7 }); [xa, xb].forEach(x => { L([[x, yRef + sg * TH * 0.3], [x, y + sg * TH * 0.4]], DC, 7, 'STD_DIM', { w: 0.5 }); L([[x - tk, y - tk], [x + tk, y + tk]], DC, 7, 'STD_DIM', { w: 0.7 }); }); T((xa + xb) / 2, y + sg * TH * 0.25, TH * 0.8, txt, DC, 7, 'STD_DIM', { al: 'c', va: sg > 0 ? 'b' : 't' }); };
  const dV = (ya, yb, x, xRef, txt) => { if (Math.abs(yb - ya) < 1e-6) return; const sg = x >= xRef ? 1 : -1; L([[x, ya], [x, yb]], DC, 7, 'STD_DIM', { w: 0.7 }); [ya, yb].forEach(y => { L([[xRef + sg * TH * 0.3, y], [x + sg * TH * 0.4, y]], DC, 7, 'STD_DIM', { w: 0.5 }); L([[x - tk, y - tk], [x + tk, y + tk]], DC, 7, 'STD_DIM', { w: 0.7 }); }); T(x + sg * TH * 0.25, (ya + yb) / 2, TH * 0.8, txt, DC, 7, 'STD_DIM', { al: 'c', va: sg > 0 ? 't' : 'b', rot: 90 }); };
  const bbOf = pts => { const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; pts.forEach(([x, y]) => { b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y); }); return b; };
  const ur = stAccRange(st, k) || [R.toe, R.uE], toe = R.toe, uE = R.uE, zAp = R.zAp, W = R.walls[0];
  // ===== 1. 平面圖：X＝−x（下游視方位：右岸在圖左），Y＝−u（上游在上、水流向下） =====
  const pm = ([u, x]) => [-x, -u], lines = g.lines.plan.filter(l => l.g === k), ref = g.lines.plan.filter(l => l.g && l.g !== k);
  const pp = lines.flatMap(l => l.p.map(pm)), pb = bbOf(pp.length ? pp : [[0, -ur[0]], [0, -ur[1]]]);
  L([[pb.x0 - 1.2, -toe], [pb.x1 + 1.2, -toe]], ST_SC.des, 5, 'STD_REF', { d: 1, w: 0.6 }); T(pb.x1 + 1.3, -toe, TH * 0.75, '壩趾', ST_SC.des, 5, 'STD_TEXT', { va: 'm' });
  ref.forEach(l => L(l.p.map(pm), '#94a3b8', 8, 'STD_REF', { d: 1, w: 0.5 }));   // 其他附屬構造（參考）
  lines.forEach(l => L(l.p.map(pm), ST_SC.st, 2, 'STD_STRUCT', { d: l.k === 'hid' ? 1 : 0 }));
  T(pb.x0 - 0.3, -ur[0] + 0.5, TH, '右岸', ST_SC.txt, 7, 'STD_TEXT', { al: 'r', va: 'b' }); T(pb.x1 + 0.3, -ur[0] + 0.5, TH, '左岸', ST_SC.txt, 7, 'STD_TEXT', { al: 'l', va: 'b' });
  { const ax = pb.x0 - 3.2, y0 = -ur[0] + 0.5, y1 = -ur[1] - 0.5; L([[ax, y0], [ax, y1]], ST_SC.des, 5, 'STD_TEXT'); L([[ax - 0.35, y1 + 0.7], [ax, y1], [ax + 0.35, y1 + 0.7]], ST_SC.des, 5, 'STD_TEXT'); T(ax - 0.4, (y0 + y1) / 2, TH, '水流', ST_SC.des, 5, 'STD_TEXT', { al: 'r', va: 'm' }); }
  if (k === 'apron') {
    const BL0 = R.xbk(toe, -1), BR0 = R.xbk(toe, 1), BL1 = R.xbk(uE, -1), BR1 = R.xbk(uE, 1);
    dV(-uE, -toe, pb.x0 - 1.6, -BR0, `Lp=${stf(uE - toe)}`);
    dH(-BR0, BL0, -toe + 1.1, -toe, `${stf(BL0 + BR0)}`); dH(-BR1, BL1, -uE - 1.1, -uE, `${stf(BL1 + BR1)}`);
    if (R.apron.cut) dV(-uE, -R.apron.cut.u0, pb.x1 + 1.6, BL1, `截水牆 ${stf(R.apron.cut.kw)}`);
  } else if (k === 'wall' && W) {
    dV(-W.u1, -W.uS, pb.x0 - 1.6, -W.xo, `${stf(W.u1 - W.uS)}`);
    const wR = R.walls.find(w => w.sd > 0); if (wR) dH(-wR.xto(wR.u1), -wR.xin(wR.u1, wR.zt1), -wR.u1 - 1.1, -wR.u1, `tw=${stf(wR.tw)}`);
  } else if (k === 'tail' && R.tail) {
    const Tt = R.tail, BL = R.bh(Tt.u1, -1), BR = R.bh(Tt.u1, 1);
    dH(-BR, BL, -Tt.u1 - 1.1, -Tt.u1, `${stf(BL + BR)}`); dH(-Tt.wn / 2, Tt.wn / 2, -Tt.u0 + 1.1, -Tt.u0, `溢流口 ${stf(Tt.wn)}`);
    dV(-Tt.u1, -Tt.u0, pb.x1 + 1.6, BL, `${stf(Tt.u1 - Tt.u0)}`);
  }
  const plBot = Math.min(pb.y0, -ur[1]) - 2.4;
  T((pb.x0 + pb.x1) / 2, plBot, TH * 1.3, `${nm}　平面圖　S=1:100`, ST_SC.ttl, 30, 'STD_TITLE', { al: 'c', va: 't' });
  T((pb.x0 + pb.x1) / 2, plBot - TH * 1.7, TH * 0.75, `上游在上、水流向下；右岸在圖左（與主壩標準圖一致）；壩趾 ${formatStation(st.sta + st.dir * toe)}`, '#94a3b8', 8, 'STD_TEXT', { al: 'c', va: 't' });
  // ===== 2. 順水流剖面（中心線處，上游在左）：X＝u，Y＝z（相對溢洪口底，標示絕對高程） =====
  const sx0 = pb.x1 + 7 - g.uUpB, oyS = -ur[0] - 1, sm = ([u, z]) => [sx0 + u, z + oyS];
  const xC = k === 'tail' && R.tail ? (R.tail.wn / 2 + R.bh(R.tail.u1, 1)) / 2 : 0, polys = stAccCut(g, xC, k).slice(0, k === 'wall' ? 1 : 99), refS = g.fills.sect[0];
  L(refS.concat([refS[0]]).map(sm), '#94a3b8', 8, 'STD_REF', { d: 1, w: 0.5 });   // 主壩斷面（參考）
  stAccCut(g, xC).filter(pg => pg.g !== k && pg.g !== 'x').forEach(pg => L(pg.concat([pg[0]]).map(sm), '#94a3b8', 8, 'STD_REF', { d: 1, w: 0.5 }));
  polys.forEach(pg => L(pg.concat([pg[0]]).map(sm), ST_SC.st, 2, 'STD_STRUCT', { cl: true }));
  const sp = polys.flat(), sb = bbOf((sp.length ? sp : [[toe, zAp], [uE, zAp]]).map(sm));
  L([sm([toe - 2, zAp]), sm([uE + 2, zAp])], ST_SC.des, 5, 'STD_DESIGN', { d: 1, w: 0.6 }); T(sm([uE + 2.1, zAp])[0], sm([0, zAp])[1], TH * 0.7, `底板面 EL ${stf(zS + zAp)}`, ST_SC.des, 5, 'STD_TEXT', { va: 'm' });
  if (k === 'apron' && R.apron) {
    const a = R.apron; dH(sm([toe, 0])[0], sm([uE, 0])[0], sb.y0 - 1.0, sb.y0, `Lp=cL×(h2+hq)=${stf(uE - toe)}`);
    dV(sm([0, a.zb])[1], sm([0, a.zt])[1], sm([toe, 0])[0] - 1.0, sm([toe, 0])[0], `tp=${stf(a.tp)}`);
    if (a.cut) { dV(sm([0, a.cut.zb])[1], sm([0, a.zb])[1], sm([uE, 0])[0] + 1.0, sm([uE, 0])[0], `kd=${stf(a.cut.kd)}`); dH(sm([a.cut.u0, 0])[0], sm([uE, 0])[0], sm([0, a.cut.zb])[1] - 0.9, sm([0, a.cut.zb])[1], `kw=${stf(a.cut.kw)}`); }
  } else if (k === 'wall' && W) {
    dV(sm([0, zAp])[1], sm([0, W.zt0])[1], sm([W.uS, 0])[0] - 1.0, sm([W.uS, 0])[0], `${stf(W.zt0 - zAp)}`);
    dV(sm([0, zAp])[1], sm([0, W.zt1])[1], sm([W.u1, 0])[0] + 1.0, sm([W.u1, 0])[0], `${stf(W.zt1 - zAp)}`);
    dH(sm([W.uS, 0])[0], sm([W.u1, 0])[0], sb.y1 + 1.0, sb.y1, `${stf(W.u1 - W.uS)}`);
    T(sm([(toe + W.u1) / 2, 0])[0], sm([0, (W.zt0 + W.zt1) / 2])[1] + 0.35, TH * 0.75, `牆頂：壩端 EL ${stf(zS + W.zt0)} → 末端 EL ${stf(zS + W.zt1)}`, ST_SC.txt, 7, 'STD_TEXT', { al: 'c', va: 'b' });
  } else if (k === 'tail' && R.tail) {
    const Tt = R.tail; dV(sm([0, zAp])[1], sm([0, Tt.zt])[1], sm([Tt.u0, 0])[0] - 1.0, sm([Tt.u0, 0])[0], `ht=${stf(Tt.ht)}`);
    dH(sm([Tt.u0, 0])[0], sm([Tt.c1, 0])[0], sb.y1 + 1.0, sb.y1, `ts=${stf(Tt.ts)}`); T(sm([Tt.c1 + Tt.sd * Tt.ht / 2, 0])[0] + 0.3, sm([0, zAp + Tt.ht / 2])[1], TH * 0.75, `1:${Tt.sd}`, DC, 7, 'STD_DIM', { va: 'm' });
  }
  const sTitleY = sb.y0 - 2.4, scx = (sb.x0 + sb.x1) / 2;
  T(scx, sTitleY, TH * 1.3, `${nm}　順水流剖面（${xC ? '溢流口外 x=' + stf(xC) : '中心線'}）　S=1:100`, ST_SC.ttl, 30, 'STD_TITLE', { al: 'c', va: 't' });
  T(scx, sTitleY - TH * 1.7, TH * 0.75, '上游在左；虛線＝主壩斷面及其他附屬構造（參考）', '#94a3b8', 8, 'STD_TEXT', { al: 'c', va: 't' });
  // ===== 3. 橫斷面（下游視：X＝−x），起點與末端 =====
  const us = k === 'tail' && R.tail ? [[R.tail.u0 + 0.02, '尾檻']] : [[Math.max(ur[0], toe) + 0.05, '起點（壩趾）'], [ur[1] - 0.05, '末端']];
  let cx0 = sb.x0, cyT = sTitleY - TH * 4.5;
  us.forEach(([u, t]) => {
    const own = stAccCross(g, u, k), oth = stAccCross(g, u).filter(pg => pg.g !== k && pg.g !== 'x'), all = own.concat(oth).flat(); if (!all.length) return;
    const xb = bbOf(all.map(([x, z]) => [-x, z])), ox = cx0 - xb.x0 + 1.5, oy = cyT - xb.y1 - 1.6, cm = ([x, z]) => [ox - x, oy + z];
    oth.forEach(pg => L(pg.concat([pg[0]]).map(cm), '#94a3b8', 8, 'STD_REF', { d: 1, w: 0.5 }));
    own.forEach(pg => L(pg.concat([pg[0]]).map(cm), ST_SC.st, 2, 'STD_STRUCT', { cl: true }));
    L([[ox + xb.x0 - 1, oy + zAp], [ox + xb.x1 + 1, oy + zAp]], ST_SC.des, 5, 'STD_DESIGN', { d: 1, w: 0.5 });
    const ob = bbOf(own.flat().map(cm)), ab = bbOf(all.map(cm));
    if (k === 'apron' && R.apron) { const BL = R.xbk(u, -1), BR = R.xbk(u, 1); dH(cm([BR, 0])[0], cm([-BL, 0])[0], ob.y0 - 0.9, ob.y0, `${stf(BL + BR)}`); }
    if (k === 'wall') R.walls.forEach(w => { const s2 = stWallSec(R, w, u); if (!s2) return; const P2 = s2.map(([x, z]) => cm([w.sd * x, z])), top = [P2[1], P2[2]]; dH(Math.min(top[0][0], top[1][0]), Math.max(top[0][0], top[1][0]), Math.max(top[0][1], top[1][1]) + 0.9, Math.max(top[0][1], top[1][1]), `${stf(w.tw)}`);
      const xo = w.sd > 0 ? Math.min(...P2.map(q => q[0])) : Math.max(...P2.map(q => q[0])); dV(P2[0][1], P2[1][1], xo + (w.sd > 0 ? -0.9 : 0.9), xo, `${stf(s2[1][1] - s2[0][1])}`);
      const mi = [(P2[0][0] + P2[1][0]) / 2, (P2[0][1] + P2[1][1]) / 2], mb = [(P2[2][0] + P2[3][0]) / 2, (P2[2][1] + P2[3][1]) / 2];
      T(mi[0] + (w.sd > 0 ? 0.25 : -0.25), mi[1], TH * 0.7, `1:${w.si}`, DC, 7, 'STD_DIM', { al: w.sd > 0 ? 'l' : 'r', va: 'm' }); T(mb[0] + (w.sd > 0 ? -0.25 : 0.25), mb[1], TH * 0.7, `1:${w.so}`, DC, 7, 'STD_DIM', { al: w.sd > 0 ? 'r' : 'l', va: 'm' }); });
    if (k === 'tail' && R.tail) { const Tt = R.tail; dH(cm([Tt.wn / 2, 0])[0], cm([-Tt.wn / 2, 0])[0], ob.y1 + 0.9, ob.y1, `wn=${stf(Tt.wn)}`); dV(cm([0, Tt.zn])[1], cm([0, Tt.zt])[1], ob.x1 + 0.9, ob.x1, `hn=${stf(Tt.hn)}`); }
    T((ob.x0 + ob.x1) / 2, Math.min(ab.y0, oy + zAp) - 2.0, TH * 1.1, `${nm}　橫斷面－${t}（${formatStation(st.sta + st.dir * u)}）`, ST_SC.ttl, 30, 'STD_TITLE', { al: 'c', va: 't' });
    T((ob.x0 + ob.x1) / 2, Math.min(ab.y0, oy + zAp) - 2.0 - TH * 1.5, TH * 0.7, '下游視：右岸在左、左岸在右（與主壩立面圖一致）', '#94a3b8', 8, 'STD_TEXT', { al: 'c', va: 't' });
    cx0 = Math.max(ob.x1, ab.x1) + 4;
  });
  // ===== 4. 數量 =====
  let y = Math.min(plBot - 4, cyT - 14), qx = pb.x0 - 3;
  T(qx, y, TH * 1.3, `${nm}　數量計算（${lb}；附屬於 ${st.name}，位置與高程依附主壩）`, ST_SC.ttl, 30, 'STD_TITLE', { va: 't' }); y -= TH * 2.2;
  (Q ? Q.rows : []).forEach(r => { T(qx, y, TH * 0.85, `${r.it}　${stf(r.v, r.u === '處' ? 0 : 2)} ${r.u}`, ST_SC.txt, 7, 'STD_QTY', { va: 't' }); y -= TH * 1.3; T(qx + 0.6, y, TH * 0.65, String(r.fx || '').replace(/<[^>]+>/g, ''), '#94a3b8', 8, 'STD_QTY', { va: 't' }); y -= TH * 1.5; });
  const ttl = `${nm}　${lb}標準圖（平面／順水流剖面／橫斷面／數量）　附屬於 ${st.name}`;
  const bb = bbOf(P.flatMap(o => o.t === 't' ? [[o.x, o.y], [o.x + (o.al === 'l' ? 1 : (o.al === 'r' ? -1 : 0.5)) * stTextW(o.s, o.h), o.y]] : o.p));
  T(bb.x0, bb.y1 + 1.0, TH * 1.5, ttl, ST_SC.ttl, 30, 'STD_TITLE', { va: 'b' }); bb.y1 += 1.0 + TH * 2;
  return { P, bb };
}
function stAccStdOpen(k, i) {
  if (i !== undefined) state.structSel = i; const st = state.structs[state.structSel]; if (!st || !stAccList(st).includes(k)) { updateStatus('⚠ 請先選擇附屬構造。'); return; }
  const r = stAccStdPrims(st, k); stStdOpen(undefined, { P: r.P, bb: r.bb, name: stAccName(st, k), title: `${stAccName(st, k)}　${stAccLabel(st, k)}標準圖（平面／順水流剖面／橫斷面／數量）` });
}

/* ---- 標準圖視窗（獨立畫布：滾輪縮放、拖曳平移） ---- */
let ST_STD = null;
function stStdOpen(i, custom) {   // custom：{P, bb, name, title}＝護岸等非結構物的標準圖
  if (i !== undefined) state.structSel = i;
  const st = custom ? { name: custom.name } : state.structs[state.structSel]; if (!st) { updateStatus('⚠ 請先選擇一座結構物。'); return; }
  let ov = document.getElementById('stStdOv');
  if (!ov) {
    ov = document.createElement('div'); ov.id = 'stStdOv';
    ov.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#0b1018;display:flex;flex-direction:column;';
    ov.innerHTML = `<div style="display:flex;gap:8px;align-items:center;padding:6px 10px;border-bottom:1px solid #233146;background:#111827;color:#e2e8f0;font-size:13px;">
      <b id="stStdTtl" style="color:#ffd08a;">標準圖</b><span style="flex:1"></span>
      <span style="font-size:11px;color:#8b9bb4;">滾輪縮放、拖曳平移</span>
      <button class="btn" onclick="stStdFit()">全圖</button><button class="btn amber" onclick="stStdDxf()">匯出標準圖 DXF</button><button class="btn" onclick="stStdClose()">關閉 ✕</button></div>
      <canvas id="stStdCv" style="flex:1;width:100%;display:block;cursor:grab;"></canvas>`;
    document.body.appendChild(ov);
    const cv = ov.querySelector('#stStdCv');
    cv.addEventListener('wheel', e => { e.preventDefault(); if (!ST_STD) return; const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, V = ST_STD.v, wx = V.cx + (mx - r.width / 2) / V.k, wy = V.cy - (my - r.height / 2) / V.k, f = e.deltaY < 0 ? 1.15 : 1 / 1.15; V.k *= f; V.cx = wx - (mx - r.width / 2) / V.k; V.cy = wy + (my - r.height / 2) / V.k; stStdDraw(); }, { passive: false });
    let drag = null;
    cv.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY, cx: ST_STD.v.cx, cy: ST_STD.v.cy }; cv.style.cursor = 'grabbing'; });
    window.addEventListener('mousemove', e => { if (!drag || !ST_STD) return; ST_STD.v.cx = drag.cx - (e.clientX - drag.x) / ST_STD.v.k; ST_STD.v.cy = drag.cy + (e.clientY - drag.y) / ST_STD.v.k; stStdDraw(); });
    window.addEventListener('mouseup', () => { if (drag) { drag = null; cv.style.cursor = 'grab'; } });
    window.addEventListener('resize', () => { if (ST_STD && ov.style.display !== 'none') stStdDraw(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && ov.style.display !== 'none') stStdClose(); });
  }
  ov.style.display = 'flex';
  const r = custom ? custom : stStdPrims(st); ST_STD = { st, P: r.P, bb: r.bb, v: { cx: 0, cy: 0, k: 10 } };
  document.getElementById('stStdTtl').textContent = custom ? custom.title : `${st.name}　標準圖（平面圖／立面圖／各變化段剖面／數量）　${formatStation(st.sta)}`;
  stStdFit();
}
function stStdClose() { const ov = document.getElementById('stStdOv'); if (ov) ov.style.display = 'none'; ST_STD = null; }
function stStdFit() {
  if (!ST_STD) return; const cv = document.getElementById('stStdCv'), r = cv.getBoundingClientRect(), b = ST_STD.bb;
  ST_STD.v = { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, k: Math.min((r.width - 40) / Math.max(1, b.x1 - b.x0), (r.height - 40) / Math.max(1, b.y1 - b.y0)) };
  stStdDraw();
}
function stStdDraw() {
  if (!ST_STD) return;
  const cv = document.getElementById('stStdCv'), r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(r.width * d) || cv.height !== Math.round(r.height * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
  const c = cv.getContext('2d'), V = ST_STD.v, W = r.width, H = r.height, S = (x, y) => [W / 2 + (x - V.cx) * V.k, H / 2 - (y - V.cy) * V.k];
  c.setTransform(d, 0, 0, d, 0, 0); c.fillStyle = '#0b1018'; c.fillRect(0, 0, W, H); c.lineJoin = 'round';
  ST_STD.P.forEach(o => {
    if (o.t === 'f') { c.beginPath(); o.p.forEach((v, i) => { const s = S(v[0], v[1]); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath(); c.fillStyle = o.c; c.fill(); return; }
    if (o.t === 'l') { c.beginPath(); o.p.forEach((v, i) => { const s = S(v[0], v[1]); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); if (o.cl) c.closePath(); c.strokeStyle = o.c; c.lineWidth = Math.max(0.6, Math.min(1.6, o.w * V.k / 25)); c.setLineDash(o.d === 1 ? [6, 4] : (o.d === 2 ? [12, 3, 2, 3] : [])); c.stroke(); return; }
    const px = o.h * V.k; if (px < 3) return; const s = S(o.x, o.y);
    c.save(); c.translate(s[0], s[1]); if (o.rot) c.rotate(-o.rot * Math.PI / 180);
    c.font = `${px}px "Noto Sans TC","JetBrains Mono",sans-serif`; c.fillStyle = o.c; c.textAlign = o.al === 'c' ? 'center' : (o.al === 'r' ? 'right' : 'left'); c.textBaseline = o.va === 't' ? 'top' : (o.va === 'm' ? 'middle' : 'bottom'); c.fillText(o.s, 0, 0); c.restore();
  });
  c.setLineDash([]);
}
function stStdEmit(D, P, dx, dy) {
  P.forEach(o => {
    if (o.t === 'f') return;
    if (o.t === 'l') { D.poly(o.p.map(v => [v[0] + dx, v[1] + dy]), o.ly, o.a, 0, o.cl, o.d ? 'DASHED' : undefined); return; }
    D.text(o.x + dx, o.y + dy, o.h, o.s, o.ly, o.a, { align: o.al, valign: o.va, rot: o.rot });
  });
}
function stStdDxf() {
  if (!ST_STD) return; const D = makeDXFWriter(); stStdEmit(D, ST_STD.P, 0, 0);
  downloadBlob(D.build(), `${ST_STD.st.name}_標準圖.dxf`, 'application/dxf');
  updateStatus(`💾 已匯出「${ST_STD.st.name}」標準圖 DXF（單位 m；平面／立面／各變化段剖面／數量，S=1:100）。`);
}
function stDxfStdAll(D, xRight, yTop) {   // 全圖 DXF：各壩標準圖置於平面圖左側，由上而下排列
  let y = yTop;
  state.structs.forEach(st => { if (!st._q) return; const r = stStdPrims(st), b = r.bb; stStdEmit(D, r.P, xRight - b.x1, y - b.y1); y -= (b.y1 - b.y0) + 20;
    stAccList(st).forEach(k => { const r2 = stAccStdPrims(st, k), b2 = r2.bb; stStdEmit(D, r2.P, xRight - b2.x1, y - b2.y1); y -= (b2.y1 - b2.y0) + 20; }); });   // v5.4：護坦／側牆／尾檻各自一張標準圖
  return y;
}

/* 點選橫斷面樁號：若該樁有結構物（或其附屬構造），立即切換左側結構物資料 */
function stOnStation(idx) {
  const sec = state.sections[idx]; if (!sec || !state.structs.length) return;
  const H = stHereList().L, cur = state.structs[state.structSel];
  if (H.length && !H.some(o => o.st === cur)) state.structSel = state.structs.indexOf(H[0].st);   // 目前選取的結構物不在本樁 → 改選本樁第一座
  stRenderUI();
}

/* ---------- 平面圖：指北針（畫面）---------- */
function stDrawNorth() {
  if (state.viewMode !== '2D') return;
  const W = cadCanvas.width / window.devicePixelRatio, H = cadCanvas.height / window.devicePixelRatio, cx = W - 110, cy = H - 64, R = 17;
  const a = worldToScreen2D(0, 0), b = worldToScreen2D(0, 100), dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, px = -uy, py = ux;
  ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = '#e2e8f0'; ctx.fillStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  const tip = [cx + ux * R * 1.15, cy + uy * R * 1.15], tl = [cx - ux * R * 0.75 + px * R * 0.38, cy - uy * R * 0.75 + py * R * 0.38], tr = [cx - ux * R * 0.75 - px * R * 0.38, cy - uy * R * 0.75 - py * R * 0.38], md = [cx - ux * R * 0.35, cy - uy * R * 0.35];
  ctx.beginPath(); ctx.moveTo(...tip); ctx.lineTo(...tl); ctx.lineTo(...md); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(...tip); ctx.lineTo(...tr); ctx.lineTo(...md); ctx.closePath(); ctx.stroke();
  ctx.font = 'bold 13px "Chakra Petch","Noto Sans TC"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', cx + ux * (R * 1.15 + 9), cy + uy * (R * 1.15 + 9));
  ctx.textBaseline = 'alphabetic'; ctx.restore();
}

/* ---------- DXF 平面圖：指北針＋圖例 ---------- */
function stDxfPlanDeco(D, bb) {
  const span = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0), th = Math.max(1.6, Math.min(6, span / 220));
  {   // 指北針（N 座標＝+Y 為北）
    const R = th * 4, cx = bb.x1 + R * 3, cy = bb.y1 - R * 2.2, Ly = 'PLAN_NORTH';
    D.circle(cx, cy, R, Ly, 7);
    D.poly([[cx, cy + R * 1.15], [cx - R * 0.38, cy - R * 0.75], [cx, cy - R * 0.35], [cx + R * 0.38, cy - R * 0.75]], Ly, 7, 0, true);
    D.line(cx, cy + R * 1.15, 0, cx, cy - R * 0.35, 0, Ly, 7);
    D.text(cx, cy + R * 1.45, th * 1.8, 'N', Ly, 7, { align: 'c' });
  }
  {   // 圖例（兩欄：圖示／地物名稱），置於平面圖右下方
    const items = [
      ['l', 1, null, '中心線'], ['l', 5, null, '河寬邊線'], ['l', 30, null, 'IP 切線'], ['l', 2, null, '橫斷面樁號線'],
      ['l', 2, null, '計曲線'], ['l', 4, null, '首曲線'], ['l', 7, null, '結構物（防砂壩／副壩／固床工）'], ['l', 7, 'DASHED', '結構物隱藏線'], ['a', 4, null, '水流方向']];
    const rh = th * 2.2, c1 = th * 8, c2 = th * 17, W = c1 + c2, H = rh * (items.length + 1), x0 = bb.x1 - W, y0 = bb.y0 - 40, Ly = 'PLAN_LEGEND';
    D.text(x0 + W / 2, y0 + th * 0.8, th * 1.5, '圖　　例', Ly, 7, { align: 'c' });
    D.poly([[x0, y0], [x0 + W, y0], [x0 + W, y0 - H], [x0, y0 - H]], Ly, 7, 0, true);
    D.line(x0 + c1, y0, 0, x0 + c1, y0 - H, 0, Ly, 7);
    for (let i = 1; i <= items.length; i++) D.line(x0, y0 - rh * i, 0, x0 + W, y0 - rh * i, 0, Ly, 7);
    D.text(x0 + c1 / 2, y0 - rh * 0.7, th, '圖　示', Ly, 7, { align: 'c' }); D.text(x0 + c1 + c2 / 2, y0 - rh * 0.7, th, '地 物 名 稱', Ly, 7, { align: 'c' });
    items.forEach(([k, col, lt, nm], i) => {
      const ym = y0 - rh * (i + 1.5), xa = x0 + th, xb = x0 + c1 - th;
      D.line(xa, ym, 0, xb, ym, 0, Ly, col, lt || undefined);
      if (k === 'a') D.poly([[xb - th * 0.9, ym + th * 0.4], [xb, ym], [xb - th * 0.9, ym - th * 0.4]], Ly, col);
      D.text(x0 + c1 + th * 0.8, ym - th * 0.35, th * 0.9, nm, Ly, 7);
    });
  }
}

/* ---------- DXF：圖面清單（簡化版，列出本次匯出包含之圖面） ---------- */
function stDxfIndex(D, bb, infos) {
  const span = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0), th = Math.max(1.6, Math.min(6, span / 220)) * 1.2;
  if (!infos) { const secs = state.sections || []; infos = [{ name: '', nSec: secs.length, s0: secs.length ? secs[0].sta : 0, s1: secs.length ? secs[secs.length - 1].sta : 0, hasPf: true, sts: state.structs.filter(s => s._q).map(s => `${s.name}（${stAbbr(s)}，${formatStation(s.sta)}）標準圖：平面／立面／各變化段剖面／數量`) }]; }
  const multi = infos.length > 1, list = [multi ? `平面配置圖（${infos.map(f => f.name).join('、')} 共 ${infos.length} 條中心線、樁號、結構物、IP 資料曲線表、指北針、圖例）` : '平面配置圖（中心線、樁號、結構物、IP 資料曲線表、指北針、圖例）'];
  infos.forEach(f => {
    const pre = multi ? `【${f.name}】` : '';
    if (f.hasPf) list.push(pre + '縱斷面設計圖');
    if (f.nSec) list.push(pre + `橫斷面設計圖（共 ${f.nSec} 處：${formatStation(f.s0)}～${formatStation(f.s1)}）`);
    if (f.sts.length) list.push(pre + '結構物數量表');
    f.sts.forEach(t => list.push(pre + t));
  });
  const n = list.length, rh = th * 2.2, c1 = th * 6, c2 = Math.max(th * 34, ...list.map(t => stTextW(t, th * 0.9) + th * 2)), W = c1 + c2, H = rh * (n + 1), x0 = bb.x0, y0 = bb.y1 + th * 6 + H, Ly = 'SHEET_INDEX';
  D.text(x0 + W / 2, y0 + th * 0.9, th * 1.6, '圖　面　清　單', Ly, 7, { align: 'c' });
  D.poly([[x0, y0], [x0 + W, y0], [x0 + W, y0 - H], [x0, y0 - H]], Ly, 7, 0, true);
  D.line(x0 + c1, y0, 0, x0 + c1, y0 - H, 0, Ly, 7);
  for (let i = 1; i <= n; i++) D.line(x0, y0 - rh * i, 0, x0 + W, y0 - rh * i, 0, Ly, 7);
  D.text(x0 + c1 / 2, y0 - rh * 0.7, th, '圖　號', Ly, 7, { align: 'c' }); D.text(x0 + c1 + c2 / 2, y0 - rh * 0.7, th, '圖　　名', Ly, 7, { align: 'c' });
  list.forEach((t, i) => { const ym = y0 - rh * (i + 1.5) - th * 0.35; D.text(x0 + c1 / 2, ym, th * 0.9, `${i + 1}/${n}`, Ly, 7, { align: 'c' }); D.text(x0 + c1 + th, ym, th * 0.9, t, Ly, 7); });
}
