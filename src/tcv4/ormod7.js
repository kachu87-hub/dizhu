/* ============================================================================
   v6.3 階段 4：曲型副壩（依原圖 PDF 圖號 12～16 重建參數化 3D 幾何；原工具 1751672c 數量全為原圖總數×比例，已全面改為幾何計算）
   座標（cm）：r＝距弧心（外側＝上游），s＝沿壩軸（基礎頂中心線）展開長，自拱冠（單元 B 中心）起算，右岸為正；z＝自基礎底面向上
   斷面：基礎（頂寬 B_top、高 H_f；下游 1:m_dn、上游 1:m_up）＋下游趾部止滑榫；端部 A-A＝基礎＋壩身 H_w；翼牆 B-B＝再加高 H_u（頂寬 t_wt）
   立柱：單元 A／B 底寬 B_col（置中於壩軸）、上游面為圓弧鼻端（半徑 Rn）；立柱間放修枝木
   所有弧線半徑由壩軸半徑 R 與斷面偏移推得（不寫死比例）
   ============================================================================ */
TCO_S['cdam'] = (function () {
  const GT = ['1. 平面：曲率半徑、弧長與立柱座數（左右可分開）', '2. 斷面：基礎、止滑榫、端部壩身', '3. 單元 A／B 立柱與修枝木', '4. 翼牆（左右分開）', '5. 護坦、填石、配筋與附屬'];
  const Q = (k, nm, def, st, mn, mx, g, opt) => (opt ? { k, nm, def, opt, g } : { k, nm, def: String(def), st: String(st), min: String(mn), max: String(mx), g });
  const PR = [
    Q('p_R', '壩軸曲率半徑 R (cm)', 3400, 50, 800, 20000, 0), Q('p_U', '壩軸弧長 U (cm)', 5767, 10, 1000, 30000, 0),
    Q('p_nmode', '立柱座數', 'AUTO', 0, 0, 0, 0, [['AUTO', '依弧長自動（左右相同）'], ['MANUAL', '手動指定左右座數']]),
    Q('p_NL', '左側單元 A 立柱數', 6, 1, 0, 40, 0), Q('p_NR', '右側單元 A 立柱數', 6, 1, 0, 40, 0), Q('p_Lt0', '自動排列時端部壩身弧長下限 (cm)', 400, 10, 0, 3000, 0),
    Q('p_Btop', '基礎頂寬 B_top (cm)', 480, 10, 200, 1500, 1), Q('p_Hf', '基礎高 H_f (cm)', 200, 10, 50, 800, 1), Q('p_mdn', '下游面坡 1:m（內側）', 0.3, 0.05, 0, 1.5, 1), Q('p_mup', '上游面坡 1:m（外側）', 0.5, 0.05, 0, 2, 1),
    Q('p_Hw', '端部壩身高 H_w (cm)', 300, 10, 50, 1000, 1), Q('p_Bwt', '端部壩身頂寬 (cm)', 240, 10, 30, 1500, 1), Q('p_Hk', '止滑榫深 (cm)', 100, 10, 0, 400, 1), Q('p_Bkb', '止滑榫底寬 (cm)', 100, 10, 20, 500, 1), Q('p_Bkt', '止滑榫頂寬 (cm)', 170, 10, 20, 800, 1),
    Q('p_Bc', '立柱底寬（徑向）B_col (cm)', 430, 10, 100, 1200, 2), Q('p_WA', '單元 A 立柱寬 W_A (cm)', 200, 10, 50, 600, 2), Q('p_HA', '單元 A 立柱高 H_A (cm)', 300, 10, 50, 1000, 2), Q('p_RnA', '單元 A 鼻端半徑 (cm)', 125, 5, 50, 1000, 2),
    Q('p_WB', '單元 B 立柱寬 W_B (cm)', 304, 2, 50, 1000, 2), Q('p_HB', '單元 B 立柱高 H_B (cm)', 150, 10, 30, 1000, 2), Q('p_RnB', '單元 B 鼻端半徑 (cm)', 308, 2, 100, 3000, 2), Q('p_S', '立柱間淨距 S (cm)', 140, 10, 40, 600, 2),
    Q('p_slw', '木柵凹槽寬 (cm)', 70, 5, 0, 200, 2), Q('p_sld', '木柵凹槽深 (cm)', 50, 5, 0, 200, 2), Q('p_hlA', '單元 A 間修枝木堆高 (cm)', 190, 10, 0, 1000, 2), Q('p_hlB', '單元 B 旁修枝木堆高 (cm)', 50, 10, 0, 1000, 2),
    Q('p_ld', '修枝木直徑 (cm)', 25, 0.5, 5, 60, 2), Q('p_lp', '修枝木堆疊間距 (cm)', 25, 1, 5, 100, 2), Q('p_lL', '修枝木長 (cm)', 280, 10, 50, 1000, 2),
    Q('p_LReq', '翼牆左右', '1', 0, 0, 0, 3, [['1', '左右相同（右側跟左側）'], ['0', '左右分開']]),
    Q('p_WtL', '左翼頂部平段寬 (cm)', 350, 10, 0, 2000, 3), Q('p_HuL', '左翼加高 H_u (cm)', 440, 10, 0, 1500, 3), Q('p_mwL', '左翼斜坡 1:m', 1, 0.1, 0, 3, 3), Q('p_htL', '左翼端頂部高 (cm)', 117, 1, 20, 500, 3),
    Q('p_WtR', '右翼頂部平段寬 (cm)', 350, 10, 0, 2000, 3), Q('p_HuR', '右翼加高 H_u (cm)', 440, 10, 0, 1500, 3), Q('p_mwR', '右翼斜坡 1:m', 1, 0.1, 0, 3, 3), Q('p_htR', '右翼端頂部高 (cm)', 117, 1, 20, 500, 3),
    Q('p_twt', '翼牆頂寬 (cm)', 100, 5, 30, 500, 3), Q('p_WeL', '左翼端段寬（平段只剩翼牆）(cm)', 139, 1, 20, 1000, 3), Q('p_WeR', '右翼端段寬（平段只剩翼牆）(cm)', 139, 1, 20, 1000, 3),
    Q('p_Wap', '漿排塊石護坦寬（拱冠趾至下游直線緣）(cm)', 600, 10, 0, 3000, 4), Q('p_tap', '漿排塊石護坦厚 (cm)', 100, 10, 30, 500, 4), Q('p_kst', '∮60~120cm 塊石佔比', 0.9, 0.05, 0.5, 1, 4), Q('p_kac', '護坦混凝土扣除：塊石折算比', 0.3, 0.05, 0, 1, 4),
    Q('p_Afill', '填塊石斷面積 (m²，原圖數量表)', 7.13, 0.01, 0, 100, 4), Q('p_sp', '配筋間距 (cm)', 30, 5, 10, 60, 4), Q('p_cov', '鋼筋保護層 (cm)', 18, 1, 5, 30, 4),
    Q('p_w16', '∮16 單位重 (kg/m)', 1.56, 0.01, 0.5, 5, 4), Q('p_w13', '∮13 單位重 (kg/m)', 0.994, 0.001, 0.3, 5, 4), Q('p_nanA', '單元 A 錨定鋼筋數', 18, 1, 0, 100, 4), Q('p_nanB', '單元 B 錨定鋼筋數', 15, 1, 0, 100, 4), Q('p_lan', '錨定鋼筋長 (cm)', 45, 1, 10, 200, 4),
    Q('p_pvA', '單元 A／C 預埋 12" PVC 管長 (cm)', 180, 10, 0, 1000, 4), Q('p_pvB', '單元 B 預埋 12" PVC 管長 (cm)', 220, 10, 0, 1000, 4), Q('p_rhA', '單元 A 鋼模水平肋條數', 6, 1, 0, 30, 4), Q('p_rvA', '單元 A 鋼模縱向肋條數', 3, 1, 0, 30, 4),
    Q('p_rhB', '單元 B 鋼模水平肋條數', 3, 1, 0, 30, 4), Q('p_rvB', '單元 B 鋼模縱向肋條數', 5, 1, 0, 30, 4), Q('p_cai', '1 才＝(m³)', 0.0027826, 0.0000001, 0.001, 0.01, 4)];
  const DEF = {}; PR.forEach(q => { DEF[q.k] = q.def; });
  let RR = null, O = [];
  const g = (k) => { const v = RR && RR[k] !== undefined && RR[k] !== null && RR[k] !== '' ? RR[k] : DEF[k]; return v; }, n = k => { const v = parseFloat(g(k)); return Number.isFinite(v) ? v : parseFloat(DEF[k]); };
  const segArea = (Rn, c) => { const h = Math.min(Rn, c / 2), th = 2 * Math.asin(h / Rn); return Rn * Rn / 2 * (th - Math.sin(th)); };
  const arcLen = (Rn, c) => 2 * Rn * Math.asin(Math.min(1, c / 2 / Rn));
  const noseCut = (Rn, c) => { const sag = Rn - Math.sqrt(Math.max(0, Rn * Rn - c * c / 4)); return Math.max(0, sag * c - segArea(Rn, c)); };   // 鼻端圓弧削去的平面面積
  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function __per(p, cl) { let s = 0; for (let i = 0; i < p.length - (cl ? 0 : 1); i++) { const a = p[i], b = p[(i + 1) % p.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); } return s; }
  function __off(P, d) {   // 多邊形內縮 d（凸多邊形近似：各邊內移後求交點）
    const nP = P.length, A = __sgn(P), L = [];
    for (let i = 0; i < nP; i++) { const a = P[i], b = P[(i + 1) % nP], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * A, ny = dx / l * A; L.push([[a[0] + nx * d, a[1] + ny * d], [b[0] + nx * d, b[1] + ny * d]]); }
    return L.map((l1, i) => { const l0 = L[(i - 1 + nP) % nP]; return __x(l0, l1) || l1[0]; });
  }
  function __sgn(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s > 0 ? 1 : -1; }
  function __x(l1, l2) { const [[x1, y1], [x2, y2]] = l1, [[x3, y3], [x4, y4]] = l2, d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); if (Math.abs(d) < 1e-9) return null; const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d; return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]; }

  function getParams() {
    const P = {}; PR.forEach(q => { P[q.k.slice(2)] = q.opt ? String(g(q.k)) : n(q.k); });
    const eq = P.LReq !== '0'; if (eq) { P.WtR = P.WtL; P.HuR = P.HuL; P.mwR = P.mwL; P.htR = P.htL; P.WeR = P.WeL; }
    // 立柱座數與端部壩身弧長（沿壩軸 R）
    const pitch = P.WA + P.S;
    if (P.nmode !== 'MANUAL') { const N = Math.max(0, Math.floor((P.U / 2 - P.WB / 2 - P.S - P.Lt0) / pitch)); P.NL = P.NR = N; }
    P.NL = Math.max(0, Math.round(P.NL)); P.NR = Math.max(0, Math.round(P.NR));
    const used = P.WB + (P.NL + P.NR) * P.WA + (P.NL + P.NR + 2) * P.S, rest = P.U - used; P.LtL = P.LtR = rest / 2;
    P.theta = P.U / P.R;
    // 斷面（r 為距壩軸的徑向偏移 d，外側＝上游＝正）
    P.Bt2 = P.Btop / 2; P.dToe = -P.Bt2 - P.mdn * P.Hf; P.dHeel = P.Bt2 + P.mup * P.Hf; P.Bbase = P.dHeel - P.dToe;
    P.Bwb = P.Bwt + (P.mdn + P.mup) * P.Hw; P.Bw2 = P.Bwb / 2;   // 端部壩身：頂寬為輸入，底寬＝頂寬＋(m下＋m上)×H_w（置中於基礎）
    P.BtA = P.Bc - (P.mdn + P.mup) * P.HA; P.BtB = P.Bc - (P.mdn + P.mup) * P.HB;
    P.zW = P.Hf + P.Hw; P.zD = P.Hf + P.HB;   // v6.3i：上游設計高＝單元 B（中間大立柱）頂＝溢洪口
    // 翼牆（直線段，自弧端沿壩軸切線方向延伸；長＝頂部平段＋斜坡水平）
    ['L', 'R'].forEach(sd => { P['Lw' + sd] = P['Wt' + sd] + P['Hu' + sd] * P['mw' + sd]; const a = -P.Bw2 + P.mdn * P.Hw, b = P.Bw2 - P.mup * P.Hw, ta = a + P.mdn * P['Hu' + sd], tb = Math.max(ta + 10, Math.min(b, ta + P.twt)); P['dS1' + sd] = tb; P['dS0' + sd] = tb - P['We' + sd]; });   // 翼端平段：只剩翼牆，寬 We（上游緣齊翼牆頂上游緣）
    P.phE = P.R > 0 ? (P.U / 2) / P.R : 0; P.x0E = P.R * Math.sin(P.phE); P.u0E = P.R * (1 - Math.cos(P.phE));
    return P;
  }
  // ---- 各區段沿 s 的斷面（d 偏移，z）多邊形 ----
  function secFound(P) { const t = P.dToe, k0 = t - P.mdn * P.Hk; return [[k0, -P.Hk], [k0 + P.Bkb, -P.Hk], [t + P.Bkt, 0], [P.dHeel, 0], [P.Bt2, P.Hf], [-P.Bt2, P.Hf], [t, 0]]; }
  function secWall(P) { return [[-P.Bw2, P.Hf], [P.Bw2, P.Hf], [P.Bw2 - P.mup * P.Hw, P.zW], [-P.Bw2 + P.mdn * P.Hw, P.zW]]; }
  function secWing(P, Hu) { const a = -P.Bw2 + P.mdn * P.Hw, b = P.Bw2 - P.mup * P.Hw, ta = a + P.mdn * Hu, tb = Math.max(ta + 10, Math.min(b, ta + P.twt)); return [[a, P.zW], [b, P.zW], [tb, P.zW + Hu], [ta, P.zW + Hu]]; }
  function secCol(P, H) { const b = P.Bc / 2; return [[-b, P.Hf], [b, P.Hf], [b - P.mup * H, P.Hf + H], [-b + P.mdn * H, P.Hf + H]]; }
  const centroidD = poly => { let A = 0, cx = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], c = a[0] * b[1] - b[0] * a[1]; A += c; cx += (a[0] + b[0]) * c; } return A ? cx / (3 * A) : 0; };
  // ---- 沿 s 的區段表（右側正、左側負）----
  function zones(P) {
    const Z = [], add = (s0, s1, kind, o) => Z.push(Object.assign({ s0, s1, kind }, o || {}));
    add(-P.WB / 2, P.WB / 2, 'B');
    [['R', 1, P.NR], ['L', -1, P.NL]].forEach(([sd, sg, N]) => {
      let s = P.WB / 2; const seg = (len, kind, o) => { const a = s, b = s + len; add(sg > 0 ? a : -b, sg > 0 ? b : -a, kind, Object.assign({ sd }, o || {})); s = b; };
      seg(P.S, 'gapB'); for (let i = 0; i < N; i++) { seg(P.WA, 'A', { i }); seg(P.S, 'gap'); }
      seg(P['Lt' + sd], 'end'); seg(P['Lw' + sd], 'wing');
    });
    return Z.sort((a, b) => a.s0 - b.s0);
  }
  // ---- 平面座標：s → 壩軸點與切線（弧段後接直線翼牆）；u＝順水流（下游＋，拱冠壩軸 u＝0），x＝右岸＋ ----
  function axisAt(P, s) {
    const sg = s < 0 ? -1 : 1, sd = sg > 0 ? 'R' : 'L', se = P.U / 2, as = Math.abs(s);
    if (as <= se) { const ph = s / P.R; return { x: P.R * Math.sin(ph), u: P.R * (1 - Math.cos(ph)), nx: Math.sin(ph), nu: -Math.cos(ph), arc: true }; }
    const ph = sg * se / P.R, x0 = P.R * Math.sin(ph), u0 = P.R * (1 - Math.cos(ph)), t = as - se;   // 翼牆：自弧端沿 x 方向（與河道垂直）延伸
    return { x: x0 + sg * t, u: u0, nx: 0, nu: -1, arc: false, ph };
  }
  // v6.3 弧段與翼牆斜接：偏移 d 的弧線（半徑 R＋d）延伸到與翼牆線（u＝u0−d）相交，平面外框連續、無三角形缺口
  const xm = (P, d) => { const R = P.R, c = Math.cos(P.phE), v = (R + d) * (R + d) - (R * c + d) * (R * c + d); return v > 0 ? Math.sqrt(v) : 0; };
  const phm = (P, d) => (P.R + d > 1e-9 ? Math.asin(Math.min(1, xm(P, d) / (P.R + d))) : 0);
  const plan = (P, s, d) => {   // d＞0＝上游
    const sE = P.U / 2, as = Math.abs(s), sg = s < 0 ? -1 : 1;
    if (as <= sE) { const ph = sE > 1e-9 ? sg * (as / sE) * phm(P, d) : 0; return [(P.R + d) * Math.sin(ph), P.R - (P.R + d) * Math.cos(ph)]; }
    const t = as - sE, T0 = wT0(P, sg > 0 ? 'R' : 'L'), xa = xm(P, d), xb = P.x0E + T0; return [sg * (t >= T0 ? P.x0E + t : xa + (xb - xa) * t / T0), P.u0E - d];   // 翼牆：斜接點後 T0 內漸變，其後 x＝弧端＋t（橫斷線垂直）
  };
  function wT0(P, sd) { const Lw = P['Lw' + sd], Ls = Lw - P['Wt' + sd]; return Math.max(1, Math.min(Lw * 0.5, Ls > 1 ? Ls : Lw * 0.5)); }
  const inv = (P, X, U) => {   // 平面 (x,u) cm → 展開 {s,d}
    const sE = P.U / 2, sg = X < 0 ? -1 : 1, dw = P.u0E - U, xa = xm(P, dw);
    if (sE > 1e-9 && Math.abs(X) >= xa) { const T0 = wT0(P, sg > 0 ? 'R' : 'L'), xb = P.x0E + T0, ax = Math.abs(X); return { s: sg * (sE + (ax >= xb ? ax - P.x0E : (xb - xa > 1e-9 ? (ax - xa) / (xb - xa) * T0 : 0))), d: dw }; }
    const r = Math.hypot(X, P.R - U), d = r - P.R, ph = Math.atan2(X, P.R - U), pm = phm(P, d); return { s: pm > 1e-9 ? sg * Math.abs(ph) / pm * sE : 0, d };
  };
  const flatOf = (P, s) => { const sE = P.U / 2, as = Math.abs(s), sd = s < 0 ? 'L' : 'R'; return as > sE + P['Lw' + sd] - P['Wt' + sd] + 1e-9 && P['Wt' + sd] > 1e-9 ? sd : null; };   // 翼端平段
  function frame(P) {   // 平面外框（x,u cm）：上游底緣→右翼（斜坡段全寬→平段翼牆）→下游趾→左翼
    const sE = P.U / 2, sl = -sE - P.LwL, sr = sE + P.LwR, sl2 = P.WtL > 1e-9 ? sl + P.WtL : sl, sr2 = P.WtR > 1e-9 ? sr - P.WtR : sr, A = (d, a, b, n) => Array.from({ length: n + 1 }, (_, i) => plan(P, a + (b - a) * i / n, d)), o = [];
    o.push(...A(P.dHeel, sl2, sr2, 120)); if (sr2 < sr) { o.push(...A(P.dS1R, sr2, sr, 8)); o.push(...A(P.dS0R, sr, sr2, 8)); } o.push(...A(P.dToe, sr2, sl2, 120)); if (sl2 > sl) { o.push(...A(P.dS0L, sl2, sl, 8)); o.push(...A(P.dS1L, sl, sl2, 8)); }
    return o;
  }
  // v6.3i 護坦：上游緣＝基礎趾線（弧段＋翼牆），下游緣＝直線（u＝拱冠趾＋W_ap，垂直流向）；R 小時不再有內弧尖角。回傳平面 (x,u) cm 多邊形
  function apronPoly(P) {
    const sE = P.U / 2, sl = -sE - P.LwL, sr = sE + P.LwR, n = 240, T = Array.from({ length: n + 1 }, (_, i) => plan(P, sl + (sr - sl) * i / n, P.dToe)), ue = -P.dToe + P.Wap;
    if (P.Wap <= 0) return []; let i0 = 0, i1 = n; while (i0 < n && T[i0][1] > ue) i0++; while (i1 > 0 && T[i1][1] > ue) i1--; if (i0 > i1) return [];
    const X = (a, b) => { const t = (ue - a[1]) / ((b[1] - a[1]) || 1e-9); return [a[0] + (b[0] - a[0]) * t, ue]; };
    const L = i0 > 0 ? X(T[i0 - 1], T[i0]) : [T[0][0], ue], R = i1 < n ? X(T[i1 + 1], T[i1]) : [T[n][0], ue];
    const o = [L].concat(T.slice(i0, i1 + 1), [R]); return o.filter((q, k) => k === 0 || Math.hypot(q[0] - o[k - 1][0], q[1] - o[k - 1][1]) > 0.5);
  }
  const dRange = (P, s) => { const f = flatOf(P, s); if (f) return [P['dS0' + f], P['dS1' + f]]; const F = secFound(P); return [Math.min(...F.map(q => q[0])), Math.max(...F.map(q => q[0]))]; };
  // ---- 頂部高程（展開）----
  function topZ(P, zn, s) {
    const as = Math.abs(s);
    if (zn.kind === 'B') return P.Hf + P.HB; if (zn.kind === 'A') return P.Hf + P.HA; if (zn.kind === 'gap' || zn.kind === 'gapB') return P.Hf; if (zn.kind === 'end') return P.zW;
    const t = as - (P.U / 2), sd = zn.sd, Hu = P['Hu' + sd], m = P['mw' + sd]; return P.zW + Math.min(Hu, m > 0 ? t / m : Hu);
  }
  function botZ(P, zn, s) {   // 翼端外側底面沿岸坡上升（原圖正視圖翼端斜邊）
    if (zn.kind !== 'wing') return -P.Hk; const sd = zn.sd, t = Math.abs(s) - P.U / 2, L = P['Lw' + sd], W = P['Wt' + sd], top = P.zW + P['Hu' + sd];
    if (t <= L - W || W <= 0) return -P.Hk; return -P.Hk + (top - P['ht' + sd] + P.Hk) * (t - (L - W)) / W;
  }
  // ---- 數量（逐段積分；弧段以斷面形心半徑修正 Pappus，翼牆直線段 ×1）----
  function compute(P) {
    const Zs = zones(P), F = secFound(P), Wl = secWall(P), q = { V: {}, F: {}, R: {} }, k = d => (P.R + d) / P.R;
    const prism = (poly, s0, s1, clipZ0) => {   // poly 沿 s0～s1 掃掠（弧段／直線段）
      let A = __A(poly); if (!A) return 0; const dc = centroidD(poly), se = P.U / 2;
      const a0 = Math.max(-se, Math.min(se, s0)), a1 = Math.max(-se, Math.min(se, s1)), arcL = Math.max(0, a1 - a0), strL = (s1 - s0) - arcL;
      return A * (arcL * k(dc) + strL);
    };
    let Vf = 0, Vk = 0, Vw = 0, Vwing = 0, VA = 0, VB = 0, Lfnd = 0;
    const Fk = F.filter(p => p[1] <= 0), fnd = [[P.dToe, 0], [P.dHeel, 0], [P.Bt2, P.Hf], [-P.Bt2, P.Hf]], key = [[P.dToe - P.mdn * P.Hk, -P.Hk], [P.dToe - P.mdn * P.Hk + P.Bkb, -P.Hk], [P.dToe + P.Bkt, 0], [P.dToe, 0]];
    const Akey = __A(key), Afnd = __A(fnd);
    // 翼端底面上升：基礎與止滑榫在翼端外側被岸坡截除 → 以數值積分處理翼牆段
    Zs.forEach(zn => {
      const L = zn.s1 - zn.s0;
      if (zn.kind !== 'wing') { Vf += prism(fnd, zn.s0, zn.s1); Vk += prism(key, zn.s0, zn.s1); Lfnd += L; }
      if (zn.kind === 'end') Vw += prism(Wl, zn.s0, zn.s1);
      if (zn.kind === 'A') VA += __A(secCol(P, P.HA)) * P.WA - noseCut(P.RnA, P.WA) * P.HA;
      if (zn.kind === 'B') VB += __A(secCol(P, P.HB)) * P.WB - noseCut(P.RnB, P.WB) * P.HB;
      if (zn.kind === 'wing') {   // 直線段：逐 5 cm 切片，斷面＝基礎＋壩身＋翼牆加高，扣除岸坡以下
        const n = Math.max(10, Math.ceil(L / 5)), ds = L / n;
        for (let i = 0; i < n; i++) { const s = zn.s0 + (i + 0.5) * ds, zb = botZ(P, zn, s), zt = topZ(P, zn, s), Hu = zt - P.zW, fl = flatOf(P, s);
          if (fl) { Vwing += P['We' + fl] * Math.max(0, zt - Math.max(zb, -P.Hk)) * ds; continue; }   // 翼端平段：只剩翼牆（寬 We）
          const parts = [key, fnd, Wl].concat(Hu > 0.5 ? [secWing(P, Hu)] : []);
          parts.forEach(pg => { const cut = __clipZ(pg, zb); Vwing += __A(cut) * ds; }); }
      }
    });
    // 弧端與翼牆交接折角（Pappus：斷面繞壩軸點轉 φ_end，形心偏移 d̄）
    const Asec = __A(fnd) + __A(key) + __A(Wl), dcs = (centroidD(fnd) * __A(fnd) + centroidD(key) * __A(key) + centroidD(Wl) * __A(Wl)) / Asec, phE = P.U / 2 / P.R;
    // 斜接：偏移 d 處實際長＝弧 (R＋d)·φm(d)＋翼 (x1−xm(d))；與「弧 (R＋d)·φE＋翼 Lw」之差逐 d 積分（基礎＋止滑榫＋壩身斷面）
    const thk = (poly, d) => { const zs = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if ((a[0] - d) * (b[0] - d) <= 0 && Math.abs(b[0] - a[0]) > 1e-9) zs.push(a[1] + (d - a[0]) / (b[0] - a[0]) * (b[1] - a[1])); } return zs.length >= 2 ? Math.max(...zs) - Math.min(...zs) : 0; };
    let Vcorner = 0; { const PS = [fnd, key, Wl], d0 = Math.min(...PS.flat().map(q => q[0])), d1 = Math.max(...PS.flat().map(q => q[0])), dd = 1;
      for (let d = d0 + dd / 2; d < d1; d += dd) { const h = PS.reduce((a, pg) => a + thk(pg, d), 0); if (h <= 0) continue; const cc = (P.R + d) * (phm(P, d) - phE) + (P.x0E - xm(P, d)); Vcorner += 2 * h * cc * dd; } }   // 左右兩端
    // 凹槽（木柵）扣除：單元 A 兩側、單元 C（端部壩身）一側、單元 B 兩側
    const nA = P.NL + P.NR, Vslot = P.slw * P.sld * (2 * nA * P.HA + 2 * P.HA + 2 * P.HB);
    const Vconc0 = Vf + Vk + Vw + Vwing + VA + VB + Vcorner - Vslot;
    // 護坦（下游內側，沿基礎趾線：弧段＋翼牆）
    const APg = apronPoly(P), Aap = APg.length > 2 ? __A(APg) : 0, apW = APg.length > 2 ? Math.max(...APg.map(q => q[0])) - Math.min(...APg.map(q => q[0])) : 0;   // 護坦面積：直接由平面多邊形計算
    const Vap = Aap * P.tap / 1e6, Vst = Vap * P.kst, Vapc = Vap * 0.5 - Vst * P.kac;
    // 投影寬（正視圖）
    const xL = plan(P, -(P.U / 2 + P.LwL), 0)[0], xR = plan(P, P.U / 2 + P.LwR, 0)[0];
    // 模板
    const kD = Math.hypot(1, P.mdn), kU = Math.hypot(1, P.mup), endLen = P.LtL + P.LtR, wingL = P.LwL + P.LwR, rIn = P.R - P.Bw2, rOut = P.R + P.Bw2;
    let Fds = 0, Fus = 0;   // 端部壩身與翼牆的下游（造型）／上游（普通）面
    Zs.filter(z => z.kind === 'end' || z.kind === 'wing').forEach(zn => { const n = Math.max(4, Math.ceil((zn.s1 - zn.s0) / 5)), ds = (zn.s1 - zn.s0) / n;
      for (let i = 0; i < n; i++) { const s = zn.s0 + (i + 0.5) * ds, h = topZ(P, zn, s) - Math.max(P.Hf, botZ(P, zn, s)), arc = Math.abs(s) <= P.U / 2;
        if (h > 0) { Fds += h * kD * ds * (arc ? rIn / P.R : 1); const hw = Math.min(h, P.Hw); Fus += hw * kU * ds * (arc ? rOut / P.R : 1); } } });
    const Fcol = nA * P.WA * P.HA * kD + P.WB * P.HB * kD;   // 立柱下游面（造型模板）
    const FformS = (Fds + Fcol) / 1e4;
    const Fsteel = (nA * arcLen(P.RnA, P.WA) * P.HA * kU + arcLen(P.RnB, P.WB) * P.HB * kU) / 1e4;
    const Ffnd = Lfnd * (P.Hf * kD * (P.R + P.dToe + P.Bt2) / 2 / P.R + P.Hf * kU + P.Hk * Math.hypot(1, P.mdn)) / 1e4;
    const Fside = ((2 * nA + 2) * __A(secCol(P, P.HA)) + 2 * __A(secCol(P, P.HB))) / 1e4;
    const FformN = Ffnd + Fus / 1e4 + Fside;
    const Rib = (nA * (P.rhA * arcLen(P.RnA, P.WA) + P.rvA * P.HA * kU) + P.rhB * arcLen(P.RnB, P.WB) + P.rvB * P.HB * kU) / 100;
    // 鋼筋（依剖面配筋圖：斷面周邊保護層內 ∮16 箍筋@sp（橫向）＋∮13 縱向筋@sp；立柱另計）
    const rebar = (poly, len) => { const inP = __off(poly, P.cov), per = __per(inP, true); return { r16: per / 100 * (len / P.sp), r13: (per / P.sp) * len / 100 }; };
    const RB = { r16: 0, r13: 0 }, addRB = o => { RB.r16 += o.r16; RB.r13 += o.r13; };
    addRB(rebar(F, Lfnd * k(centroidD(F))));
    addRB(rebar(Wl, endLen * k(centroidD(Wl)) + wingL));
    const HuAvg = ['L', 'R'].reduce((a, sd) => a + (P['Hu' + sd] * (P['Wt' + sd] + P['Hu' + sd] * P['mw' + sd] / 2)), 0) / Math.max(1, wingL);
    if (HuAvg > 1) addRB(rebar(secWing(P, HuAvg), wingL));
    const cA = rebar(secCol(P, P.HA), P.WA), cB = rebar(secCol(P, P.HB), P.WB);
    RB.r16 += nA * cA.r16 + cB.r16; RB.r13 += nA * cA.r13 + cB.r13 + (nA * P.nanA + P.nanB) * P.lan / 100;
    const W16 = RB.r16 * P.w16, W13 = RB.r13 * P.w13;
    // 修枝木、PVC
    const nRowA = Math.round(P.hlA / P.lp), nRowB = Math.round(P.hlB / P.lp), nLogs = nRowA * nA + nRowB * 2, Vlog = nLogs * Math.PI * Math.pow(P.ld / 200, 2) * P.lL / 100;
    const pvc = (2 * nA * P.pvA + 2 * P.pvA + 2 * P.pvB) / 100, caps = 2 * nA + 2 + 2;
    const fillL = (xR - xL) / 100;
    Object.assign(q, { Vf, Vk, Vw, Vwing, VA, VB, Vcorner, Vslot, Vap, Vst, Vapc, Aap, apW, xL, xR, Lfnd, FformS, Fsteel, FformN, Ffnd, Fus, Fside, Fds, Fcol, Rib, RB, W16, W13, nLogs, Vlog, pvc, caps, fillL, nA, Akey, Afnd,
      Vconc: Vconc0 / 1e6 + Vapc });
    return q;
  }
  function __clipZ(poly, zb) {   // 保留 z ≥ zb 的部分
    const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ia = a[1] >= zb, ib = b[1] >= zb; if (ia) out.push(a); if (ia !== ib) { const t = (zb - a[1]) / (b[1] - a[1]); out.push([a[0] + t * (b[0] - a[0]), zb]); } }
    return out;
  }
  function computeQuantities(P) {
    const q = compute(P), f = (v, d) => (+v).toFixed(d === undefined ? 2 : d), rows = [];
    const r = (no, name, unit, qty, formula, note) => rows.push({ no: String(no), name, unit, qty: +(+qty).toFixed(unit === 'kg' || unit === '才' ? 1 : 2), formula, note: note || '' });
    r(1, '280kg/cm²混凝土', 'm³', q.Vconc, `基礎 ${f(q.Vf / 1e6)}＋止滑榫 ${f(q.Vk / 1e6)}＋端部壩身 ${f(q.Vw / 1e6)}＋翼牆 ${f(q.Vwing / 1e6)}＋立柱A ${f(q.VA / 1e6)}＋B ${f(q.VB / 1e6)}＋折角 ${f(q.Vcorner / 1e6)}－凹槽 ${f(q.Vslot / 1e6)}＋護坦 ${f(q.Vapc)}`, '弧段以斷面形心半徑修正');
    r(2, '鋼模板', 'm²', q.Fsteel, `單元A ${q.nA}×鼻端弧長 ${f(arcLen(P.RnA, P.WA) / 100)}×${f(P.HA / 100)}×√(1+${P.mup}²)＋單元B 弧長 ${f(arcLen(P.RnB, P.WB) / 100)}×${f(P.HB / 100)}×√(1+${P.mup}²)`);
    r(3, '扁鋼肋條', 'm', q.Rib, `單元A ${q.nA}×(${P.rhA}×${f(arcLen(P.RnA, P.WA) / 100)}＋${P.rvA}×${f(P.HA / 100 * Math.hypot(1, P.mup))})＋單元B (${P.rhB}×${f(arcLen(P.RnB, P.WB) / 100)}＋${P.rvB}×${f(P.HB / 100 * Math.hypot(1, P.mup))})`);
    r(4, '普通模板', 'm²', q.FformN, `基礎上下游面與止滑榫 ${f(q.Ffnd)}＋壩身/翼牆上游面 ${f(q.Fus / 1e4)}＋立柱側面 ${f(q.Fside)}`);
    r(5, '造型模板', 'm²', q.FformS, `壩身/翼牆下游面 ${f(q.Fds / 1e4)}＋立柱下游面 ${f(q.Fcol / 1e4)}（×√(1+${P.mdn}²)）`);
    r(6, '鋼筋', 'kg', q.W16 + q.W13, `∮16 ${f(q.RB.r16, 1)} m×${P.w16}＋∮13 ${f(q.RB.r13, 1)} m×${P.w13}`, '依剖面配筋圖（保護層 ' + P.cov + ' cm，@' + P.sp + '）');
    r(7, '修枝木', '才', q.Vlog / P.cai, `${q.nLogs} 支×π×(${P.ld / 100}/2)²×${P.lL / 100}÷${P.cai}`);
    r(8, '填塊石', 'm³', P.Afill * q.fillL, `${P.Afill}（原圖斷面積）×正視投影寬 ${f(q.fillL)}`);
    r(9, '排塊石', 'm³', q.Vap, `護坦平面面積 ${f(q.Aap / 1e4)} m²（基礎趾線～下游直線緣，拱冠寬 ${f(P.Wap / 100)}、直線緣長 ${f(q.apW / 100)} m）×厚 ${f(P.tap / 100)}`);
    r(10, '∮60~120cm塊石', 'm³', q.Vst, `排塊石×${P.kst}`);
    r(11, '12"PVC管', 'm', q.pvc, `(2×${q.nA}＋2)×${P.pvA / 100}＋2×${P.pvB / 100}`);
    r(12, 'PE內塞管蓋', '個', q.caps, `2×${q.nA}＋2＋2`);
    return rows;
  }
  /* ================================ 繪圖（cm，y 向上） ================================ */
  const C = { s: '#ffffff', d: '#22d3ee', t: '#e2e8f0', y: '#fde047', g: '#94a3b8', r: '#ef4444', w: '#facc15', st: '#c084fc' };
  const L_ = (a, b, c, w, d, ly) => O.push({ k: 'L', p: [a, b], c: c || C.s, w: w || 1.4, d: d || [], ly: ly || '0' });
  const PL = (p, c, cl, f, w, d, ly) => { if (p.length >= 2) O.push({ k: 'P', p: p.map(q => [q[0], q[1]]), c: c || C.s, w: w || 1.5, f: f || null, cl: cl !== false, d: d || [], ly: ly || '0' }); };
  const T = (s, x, y, h, c, al, rot) => O.push({ k: 'T', x, y, s: String(s), h: (h || 30) * 1.8, c: c || C.t, al: al || 'center', bl: 'middle', rot: rot || 0, ly: '文字' });
  const DH = (x1, x2, y, yd, txt, h) => { L_([x1, y], [x1, yd], C.d, 1, [], 'DIM'); L_([x2, y], [x2, yd], C.d, 1, [], 'DIM'); L_([x1, yd], [x2, yd], C.d, 1, [], 'DIM'); T(txt, (x1 + x2) / 2, yd + (yd >= y ? 1 : -1) * (h || 28) * 1.5, h || 28, C.d); };
  const DV = (y1, y2, x, xd, txt, h) => { L_([x, y1], [xd, y1], C.d, 1, [], 'DIM'); L_([x, y2], [xd, y2], C.d, 1, [], 'DIM'); L_([xd, y1], [xd, y2], C.d, 1, [], 'DIM'); T(txt, xd + (xd >= x ? 1 : -1) * (h || 28) * 1.6, (y1 + y2) / 2, h || 28, C.d, 'center', Math.PI / 2); };
  const TITLE = (s, x, y, h) => { T(s, x, y, h || 60, '#38bdf8'); L_([x - s.length * (h || 60) * 0.5, y - (h || 60) * 0.8], [x + s.length * (h || 60) * 0.5, y - (h || 60) * 0.8], '#38bdf8', 1.5, [], '輔助線'); };
  function drawFront(P, ox, oy) {   // 正視圖（自下游向上游看；x＝投影寬）
    const Zs = zones(P), X = s => plan(P, s, 0)[0] + ox, Y = z => oy + z, top = [], bot = [];
    Zs.forEach(zn => { const n = zn.kind === 'wing' ? 24 : 4; for (let i = 0; i <= n; i++) { const s = zn.s0 + (zn.s1 - zn.s0) * i / n; top.push([X(s), Y(zn.kind === 'gap' || zn.kind === 'gapB' ? P.Hf : topZ(P, zn, s))]); bot.push([X(s), Y(botZ(P, zn, s))]); } });
    // 外框：基礎底（含止滑榫）＋頂緣
    const sE = P.U / 2;
    PL(bot.concat(top.slice().reverse()), C.s, true, 'rgba(255,255,255,0.03)', 1.7, [], 'FRONT');
    L_([X(-sE - P.LwL + P.WtL), Y(0)], [X(sE + P.LwR - P.WtR), Y(0)], C.g, 1.1, [6, 4], '0');
    L_([X(-sE - P.LwL), Y(P.Hf)], [X(sE + P.LwR), Y(P.Hf)], C.s, 1.2, [], '0');
    Zs.forEach(zn => { if (zn.kind === 'A' || zn.kind === 'B') { const H = zn.kind === 'A' ? P.HA : P.HB; PL([[X(zn.s0), Y(P.Hf)], [X(zn.s1), Y(P.Hf)], [X(zn.s1), Y(P.Hf + H)], [X(zn.s0), Y(P.Hf + H)]], C.s, true, 'rgba(255,255,255,0.06)', 1.6, [], 'COL'); }
      if (zn.kind === 'gap' || zn.kind === 'gapB') { const h = zn.kind === 'gap' ? P.hlA : P.hlB, z0 = P.Hf + (zn.kind === 'gap' ? Math.max(0, P.HA - h - P.sld) : 0); for (let z = z0 + P.lp / 2; z < z0 + h; z += P.lp) L_([X(zn.s0), Y(z)], [X(zn.s1), Y(z)], '#a16207', 1.2, [], 'LOGS'); } });
    // 標註
    const xl = X(-sE - P.LwL), xr = X(sE + P.LwR), zt = P.zW + Math.max(P.HuL, P.HuR);
    DH(xl, xr, Y(-P.Hk), Y(-P.Hk - 160), `正視投影全寬 ${(xr - xl).toFixed(0)}`);
    DH(X(-sE), X(sE), Y(P.zW), Y(zt + 120), `弧端投影寬 ${(X(sE) - X(-sE)).toFixed(0)}`);
    DV(Y(-P.Hk), Y(0), xl, xl - 120, `${P.Hk}`); DV(Y(0), Y(P.Hf), xl, xl - 120, `${P.Hf}`); DV(Y(P.Hf), Y(P.zW), xl, xl - 120, `${P.Hw}`); DV(Y(P.zW), Y(P.zW + P.HuL), xl, xl - 120, `${P.HuL}`);
    DV(Y(P.zW), Y(P.zW + P.HuR), xr, xr + 120, `${P.HuR}`); DV(Y(P.Hf), Y(P.zW), xr, xr + 120, `${P.Hw}`);
    T(`單元A ${P.NL}＋${P.NR} 座、單元B 1 座、立柱高 ${P.HA}/${P.HB}`, ox, Y(P.Hf + P.HA + 60), 34, C.y);
    TITLE('曲型副壩正視圖', ox, Y(-P.Hk - 320));
    return { xl, xr, yb: Y(-P.Hk - 380), yt: Y(zt + 200) };
  }
  function drawPlan(P, ox, oy) {   // 俯視圖（上游在上：y＝−u）
    const M = (s, d) => { const [x, u] = plan(P, s, d); return [ox + x, oy - u]; }, sE = P.U / 2, sl = -sE - P.LwL, sr = sE + P.LwR;
    const arcPts = (d, a, b, n) => Array.from({ length: (n || 90) + 1 }, (_, i) => M(a + (b - a) * i / (n || 90), d));
    const lines = [[P.dHeel, '基礎上游底緣'], [P.Bt2, '基礎頂上游緣'], [-P.Bt2, '基礎頂下游緣'], [P.dToe, '基礎下游底緣（趾）'], [P.dToe - P.mdn * P.Hk, '止滑榫底']];
    const sl2 = P.WtL > 1e-9 ? -sE - P.LwL + P.WtL : sl, sr2 = P.WtR > 1e-9 ? sE + P.LwR - P.WtR : sr;   // 靠壩斜坡段（基礎全寬）／翼端平段（只剩翼牆）
    PL(frame(P).map(q => [ox + q[0], oy - q[1]]), C.s, true, null, 1.7, [], 'PLAN');   // 連續外框（弧段＋斜接＋翼牆兩段）
    lines.forEach(([d], i) => { if (i === 0 || i === 3) return; PL(arcPts(d, sl2, sr2, 120), C.g, false, null, 1.1, i === 4 ? [8, 5] : [], 'PLAN'); });
    [[sl2, 'L'], [sr2, 'R']].forEach(([s, sd]) => { if (P['Wt' + sd] > 1e-9) PL([M(s, P['dS0' + sd]), M(s, P['dS1' + sd])], C.g, false, null, 1, [6, 4]); });
    [[-sE, 'L'], [sE, 'R']].forEach(([s]) => { PL([M(s, P.dToe), M(s, P.dHeel)], C.g, false, null, 1, [10, 6]); });
    // 立柱（底部外框＋上游圓弧鼻端）
    zones(P).forEach(zn => { if (zn.kind !== 'A' && zn.kind !== 'B') return; const W = zn.s1 - zn.s0, sc = (zn.s0 + zn.s1) / 2, Rn = zn.kind === 'A' ? P.RnA : P.RnB, b = P.Bc / 2, a = axisAt(P, sc);
      const tx = a.nu, tu = -a.nx, pt = (t, d) => [ox + a.x + a.nx * d + tx * t, oy - (a.u + a.nu * d + tu * t)], sag = Rn - Math.sqrt(Math.max(0, Rn * Rn - W * W / 4)), dn = b - sag, cy = dn - (Rn - sag);
      const nose = Array.from({ length: 17 }, (_, i) => { const t = -W / 2 + W * i / 16; return pt(t, cy + Math.sqrt(Math.max(0, Rn * Rn - t * t))); });
      PL([pt(-W / 2, -b), pt(W / 2, -b)].concat(nose.slice().reverse()), C.s, true, 'rgba(255,255,255,0.08)', 1.5, [], 'COL');
      if (zn.kind === 'A' || zn.kind === 'B') T(zn.kind === 'A' ? `${W.toFixed(0)}` : `B ${W.toFixed(0)}`, pt(0, -b - 70)[0], pt(0, -b - 70)[1], 26, C.d, 'center', -Math.atan2(tu, tx)); });
    // 修枝木（壩軸上三排）
    zones(P).forEach(zn => { if (zn.kind !== 'gap' && zn.kind !== 'gapB') return; [-16, 0, 16].forEach(dd => PL(arcPts(dd, zn.s0, zn.s1, 6), '#facc15', false, null, 1.4, [], 'LOGS')); });
    // 護坦（下游內側）
    const APg = apronPoly(P); PL(APg.map(q => [ox + q[0], oy - q[1]]), '#4ade80', true, 'rgba(74,222,128,0.06)', 1.3, [], 'APRON');
    if (APg.length > 2) { const a = APg[0], b = APg[APg.length - 1], y = oy - a[1]; DH(ox + a[0], ox + b[0], y, y - 120, `護坦下游直線緣 ${(Math.abs(b[0] - a[0])).toFixed(0)}`); const pt = M(0, P.dToe); DV(pt[1], y, pt[0], pt[0] + 180, `${P.Wap}`); }
    // 弧長標註（各弧線半徑由壩軸 R 與斷面偏移推得）
    lines.forEach(([d, nm], i) => { if (i === 4) return; const r = P.R + d, U = r * P.theta, p = M(0, d); T(`${nm} R=${(r / 100).toFixed(2)}m U=${(U / 100).toFixed(2)}m`, p[0] + 60, p[1] + (i % 2 ? -36 : 36), 30, C.y, 'left'); });
    { const p = M(0, 0); T(`壩軸 R=${(P.R / 100).toFixed(2)}m U=${(P.U / 100).toFixed(2)}m（圓心張角 ${(P.theta * 180 / Math.PI).toFixed(1)}°）`, p[0], p[1] - 110, 34, C.y); }
    const pc = M(0, P.dToe - P.Wap); T(`漿排塊石護坦（拱冠趾至下游直線緣）寬 ${P.Wap}、厚 ${P.tap}`, pc[0], pc[1] - 80, 32, '#4ade80');
    const yl = oy - plan(P, sl, 0)[1]; DH(ox + plan(P, sl, 0)[0], ox + plan(P, sr, 0)[0], yl, yl - 300, `翼端距 ${(plan(P, sr, 0)[0] - plan(P, sl, 0)[0]).toFixed(0)}`);
    DH(ox + plan(P, -sE, 0)[0], ox + plan(P, -sl === 0 ? 0 : -sE - P.LwL, 0)[0], yl, yl + 160, `左翼 ${P.LwL.toFixed(0)}`); DH(ox + plan(P, sE, 0)[0], ox + plan(P, sr, 0)[0], yl, yl + 160, `右翼 ${P.LwR.toFixed(0)}`);
    const rise = P.R * (1 - Math.cos(P.theta / 2)); DV(oy, oy - rise, ox + 40, ox + 40, `矢高 ${rise.toFixed(0)}`);
    TITLE('曲型副壩俯視圖', ox, oy - Math.max(rise, 0) - P.Wap - 700);
    return { yb: oy - rise - P.Wap - 760 };
  }
  function drawDeveloped(P, ox, oy) {   // 展開圖（沿壩軸 s）
    const Zs = zones(P), X = s => ox + s, Y = z => oy + z;
    const top = [], bot = []; Zs.forEach(zn => { const nn = zn.kind === 'wing' ? 24 : 2; for (let i = 0; i <= nn; i++) { const s = zn.s0 + (zn.s1 - zn.s0) * i / nn; top.push([X(s), Y(zn.kind === 'gap' || zn.kind === 'gapB' ? P.Hf : topZ(P, zn, s))]); bot.push([X(s), Y(botZ(P, zn, s))]); } });
    PL(bot.concat(top.slice().reverse()), C.s, true, 'rgba(255,255,255,0.03)', 1.6, [], 'DEV');
    L_([Zs[0].s0 + ox, Y(0)], [Zs[Zs.length - 1].s1 + ox, Y(0)], C.g, 1, [6, 4]); L_([Zs[0].s0 + ox, Y(P.Hf)], [Zs[Zs.length - 1].s1 + ox, Y(P.Hf)], C.s, 1.1);
    let yd = Y(P.zW + Math.max(P.HuL, P.HuR) + 90);
    Zs.forEach(zn => { const w = zn.s1 - zn.s0; if (zn.kind === 'A' || zn.kind === 'B') PL([[X(zn.s0), Y(P.Hf)], [X(zn.s1), Y(P.Hf)], [X(zn.s1), Y(P.Hf + (zn.kind === 'A' ? P.HA : P.HB))], [X(zn.s0), Y(P.Hf + (zn.kind === 'A' ? P.HA : P.HB))]], C.s, true, null, 1.5);
      L_([X(zn.s0), yd - 20], [X(zn.s0), yd + 20], C.d, 1); T(w.toFixed(zn.kind === 'end' ? 1 : 0), X((zn.s0 + zn.s1) / 2), yd + 30, w < 150 ? 20 : 26, C.d); });
    L_([X(Zs[0].s0), yd], [X(Zs[Zs.length - 1].s1), yd], C.d, 1);
    const sE = P.U / 2; DH(X(-sE - P.LwL), X(sE + P.LwR), Y(-P.Hk), Y(-P.Hk - 120), `基礎展開長（壩軸）${(P.U + P.LwL + P.LwR).toFixed(0)}`); DH(X(-sE), X(sE), Y(-P.Hk), Y(-P.Hk - 220), `弧段 U ${P.U}`);
    TITLE('曲型副壩展開圖（沿壩軸）', ox, Y(-P.Hk - 400));
  }
  function drawSection(P, ox, oy, kind) {   // A-A（端部壩身）／B-B（翼牆）剖面，下游（內側）在左
    const X = d => ox + d, Y = z => oy + z, F = secFound(P), W = secWall(P), Hu = kind === 'BB' ? Math.max(P.HuL, P.HuR) : 0;
    const out = F.map(p => [X(p[0]), Y(p[1])]); PL(out, C.s, true, 'rgba(255,255,255,0.04)', 1.8, [], 'SEC');
    PL(W.map(p => [X(p[0]), Y(p[1])]), C.s, true, 'rgba(255,255,255,0.04)', 1.8, [], 'SEC');
    if (Hu > 0) PL(secWing(P, Hu).map(p => [X(p[0]), Y(p[1])]), C.s, true, 'rgba(255,255,255,0.04)', 1.8, [], 'SEC');
    // 配筋（保護層內 ∮16 箍筋輪廓）
    [F, W].concat(Hu > 0 ? [secWing(P, Hu)] : []).forEach(pg => PL(__off(pg, P.cov).map(p => [X(p[0]), Y(p[1])]), C.r, true, null, 1.2, [10, 4], 'REBAR'));
    // 漿排塊石（下游）
    PL([[X(P.dToe - 40), Y(P.Hf * 0.5)], [X(P.dToe - P.Wap), Y(P.Hf * 0.5 - P.Wap * 0.15)], [X(P.dToe - P.Wap), Y(P.Hf * 0.5 - P.Wap * 0.15 - P.tap)], [X(P.dToe - 40), Y(P.Hf * 0.5 - P.tap)]], '#4ade80', true, null, 1.2, [], 'APRON');
    DH(X(-P.Bt2), X(P.Bt2), Y(P.Hf), Y(P.Hf - 40), `${P.Btop}`); DH(X(P.dToe), X(P.dHeel), Y(0), Y(-P.Hk - 60), `${P.Bbase.toFixed(0)}`);
    DH(X(P.dToe - P.mdn * P.Hk), X(P.dToe - P.mdn * P.Hk + P.Bkb), Y(-P.Hk), Y(-P.Hk - 30), `${P.Bkb}`); DH(X(P.dToe), X(P.dToe + P.Bkt), Y(0), Y(30), `${P.Bkt}`);
    DH(W[3][0] + ox, W[2][0] + ox, Y(P.zW), Y(P.zW + 40 + Hu), `${P.Bwt.toFixed(0)}`);
    const xr = X(P.dHeel + 140); DV(Y(-P.Hk), Y(0), xr, xr, `${P.Hk}`); DV(Y(0), Y(P.Hf), xr, xr, `${P.Hf}`); DV(Y(P.Hf), Y(P.zW), xr, xr, `${P.Hw}`); if (Hu > 0) DV(Y(P.zW), Y(P.zW + Hu), xr, xr, `${Hu}`);
    T(`1:${P.mdn}`, X(P.dToe + P.mdn * P.Hf * 0.5 - 70), Y(P.Hf * 0.5), 26, C.t); T(`1:${P.mup}`, X(P.dHeel - P.mup * P.Hf * 0.5 + 70), Y(P.Hf * 0.5), 26, C.t);
    const Af = __A(F) / 1e4, Aw = __A(W) / 1e4, Aw2 = Hu > 0 ? __A(secWing(P, Hu)) / 1e4 : 0;
    T(`斷面積：基礎＋止滑榫 ${Af.toFixed(3)}＋壩身 ${Aw.toFixed(3)}${Hu > 0 ? `＋翼牆加高 ${Aw2.toFixed(3)}` : ''} m²`, ox, Y(-P.Hk - 150), 26, C.y);
    T(`∮16@${P.sp}cm 箍筋、∮13@${P.sp}cm 縱向筋（保護層 ${P.cov}）`, ox, Y(-P.Hk - 190), 24, C.r);
    TITLE(kind === 'BB' ? '曲型副壩端部B-B剖面圖（翼牆）' : '曲型副壩端部A-A剖面圖', ox, Y(-P.Hk - 260), 44);
    T('下游（凹側）', X(P.dToe - 260), Y(P.zW), 26, C.g); T('上游（凸側）', X(P.dHeel + 260), Y(P.zW), 26, C.g);
  }
  function drawColumn(P, ox, oy, which) {
    const H = which === 'A' ? P.HA : P.HB, W = which === 'A' ? P.WA : P.WB, Rn = which === 'A' ? P.RnA : P.RnB, sec = secCol(P, H), X = d => ox + d, Y = z => oy + z - P.Hf;
    PL(sec.map(p => [X(p[0]), Y(p[1])]), C.s, true, 'rgba(255,255,255,0.05)', 1.7, [], 'COL'); PL(__off(sec, P.cov * 0.6).map(p => [X(p[0]), Y(p[1])]), C.r, true, null, 1.1, [8, 4], 'REBAR');
    PL([[X(-P.slw / 2), Y(P.Hf + H - P.sld - (which === 'A' ? 190 : 50))], [X(P.slw / 2), Y(P.Hf + H - P.sld - (which === 'A' ? 190 : 50))], [X(P.slw / 2), Y(P.Hf + H)], [X(-P.slw / 2), Y(P.Hf + H)]], C.g, true, null, 1, [6, 4]);
    DH(X(-P.Bc / 2), X(P.Bc / 2), Y(P.Hf), Y(P.Hf - 50), `${P.Bc}`); DH(X(sec[3][0]), X(sec[2][0]), Y(P.Hf + H), Y(P.Hf + H + 50), `${(which === 'A' ? P.BtA : P.BtB).toFixed(0)}`);
    DV(Y(P.Hf), Y(P.Hf + H), X(P.Bc / 2), X(P.Bc / 2 + 80), `${H}`);
    // 俯視（鼻端圓弧）
    const py = Y(P.Hf - 260), b = P.Bc / 2, sag = Rn - Math.sqrt(Math.max(0, Rn * Rn - W * W / 4)), cx = b - sag - (Rn - sag);
    const nose = Array.from({ length: 17 }, (_, i) => { const t = -W / 2 + W * i / 16; return [X(cx + Math.sqrt(Math.max(0, Rn * Rn - t * t))), py + t]; });
    PL([[X(-b), py - W / 2], [X(-b), py + W / 2]].concat(nose.slice().reverse()), C.s, true, null, 1.5, [], 'COL');
    T(`鼻端 R=${Rn}，弧長 ${(arcLen(Rn, W) / 100).toFixed(2)} m`, ox, py - W / 2 - 50, 24, C.y); DV(py - W / 2, py + W / 2, X(-b), X(-b - 60), `${W}`);
    const V = (__A(sec) * W - noseCut(Rn, W) * H) / 1e6;
    TITLE(`單元${which}立柱剖面／俯視圖`, ox, py - W / 2 - 130, 36); T(`每座混凝土 ${V.toFixed(3)} m³（斷面 ${(__A(sec) / 1e4).toFixed(3)} m²×${W / 100}－鼻端）`, ox, py - W / 2 - 180, 22, C.y);
  }
  function drawTable(P, tx, ty) {
    const rows = computeQuantities(P), cw = [120, 560, 120, 2900, 300], rh = 90, head = ['項次', '工項', '單位', '計算式（依圖面幾何）', '數量'], tw = cw.reduce((a, b) => a + b, 0), all = [head].concat(rows.map(r => [r.no, r.name, r.unit, r.formula, String(r.qty)]));
    T('曲型副壩每座數量表（依圖面幾何計算）', tx, ty + 80, 36, '#38bdf8', 'left');
    PL([[tx, ty], [tx + tw, ty], [tx + tw, ty - rh * all.length], [tx, ty - rh * all.length]], '#475569', true, null, 1.2, [], 'TABLE');
    all.forEach((r, i) => { const y = ty - rh * (i + 0.5); if (i) L_([tx, ty - rh * i], [tx + tw, ty - rh * i], '#334155', 1, [], 'TABLE'); let x = tx; r.forEach((v, j) => { T(v, j === 1 || j === 3 ? x + 10 : x + cw[j] / 2, y, j === 3 ? 21 : 25, i ? (j === 4 ? '#4ade80' : j === 3 ? '#67e8f9' : C.t) : C.y, j === 1 || j === 3 ? 'left' : 'center'); x += cw[j]; }); });
    let x = tx; cw.slice(0, -1).forEach(w => { x += w; L_([x, ty], [x, ty - rh * all.length], '#334155', 1, [], 'TABLE'); });
    const N = [`弧線半徑：壩軸 R＝${P.R}，其餘各弧＝R＋斷面偏移（基礎頂 ±${P.Bt2}、底 ${P.dToe.toFixed(0)}／+${P.dHeel.toFixed(0)}），弧長＝半徑×張角 ${P.theta.toFixed(4)} rad`,
      `立柱排列：單元B ${P.WB}＋每側 [淨距 ${P.S}＋(單元A ${P.WA}＋淨距 ${P.S})×N]，端部壩身弧長＝餘量 左 ${P.LtL.toFixed(1)}／右 ${P.LtR.toFixed(1)} cm`,
      `翼牆：自弧端沿與河道垂直方向延伸（頂部平段＋1:m 斜坡），翼端外側底面沿岸坡上升至頂下 ${P.htL}/${P.htR} cm；弧端折角以 Pappus 定理計`,
      `填塊石斷面積為原圖數量表值（圖面未量得）；護坦混凝土＝排塊石×0.5－塊石×${P.kac}（原表算法）`];
    N.forEach((s, i) => T('・' + s, tx, ty - rh * all.length - 90 - i * 75, 24, C.y, 'left'));
  }
  function renderAll(P) {
    O = []; const fr = drawFront(P, 0, 0), pl = drawPlan(P, 0, fr.yb - 400 - P.R * (1 - Math.cos(P.theta / 2)) * 0 - 200);
    const sx = fr.xr + 1600; drawSection(P, sx, 400, 'AA'); drawSection(P, sx + 2000, 400, 'BB'); drawColumn(P, sx, -1500, 'A'); drawColumn(P, sx + 1500, -1500, 'B');
    drawDeveloped(P, sx + 2600, -4200);
    drawTable(P, fr.xl, pl.yb - 500);
    return { pl };
  }
  /* ---- 本系統視圖（m）：plan (u,x)、sect (u,z)、elev (x,z)；z 相對溢洪口（單元 B 頂＝基礎底＋H_f＋H_B） ---- */
  function hostViews(P) {
    const zt = P.zD, out = { plan: [], sect: [], elev: [] }, sE = P.U / 2, sl = -sE - P.LwL, sr = sE + P.LwR, pp = (s, d) => { const [x, u] = plan(P, s, d); return [u / 100, x / 100]; };
    const arc = (d, a, b, nn) => Array.from({ length: nn + 1 }, (_, i) => pp(a + (b - a) * i / nn, d));
    out.plan.push({ p: frame(P).map(([x, u]) => [u / 100, x / 100]), cl: true, c: '#ffffff', f: 'rgba(255,255,255,0.06)', d: false });
    { const sl2 = P.WtL > 1e-9 ? sl + P.WtL : sl, sr2 = P.WtR > 1e-9 ? sr - P.WtR : sr; [P.Bt2, -P.Bt2].forEach(d => out.plan.push({ p: arc(d, sl2, sr2, 120), cl: false, c: '#94a3b8', f: null, d: false })); }
    zones(P).forEach(zn => { if (zn.kind === 'A' || zn.kind === 'B') { const b = P.Bc / 2; out.plan.push({ p: [pp(zn.s0, -b), pp(zn.s1, -b), pp(zn.s1, b), pp(zn.s0, b)], cl: true, c: '#ffffff', f: 'rgba(255,255,255,0.1)', d: false }); } });
    { const APg = apronPoly(P); if (APg.length > 2) out.plan.push({ p: APg.map(([x, u]) => [u / 100, x / 100]), cl: true, c: '#4ade80', f: 'rgba(74,222,128,0.06)', d: true }); }
    const S = (poly) => poly.map(([d, z]) => [-d / 100, (z - zt) / 100]);   // 拱冠處：u＝−d（上游 d＞0 → u＜0）
    out.sect.push({ p: S(secFound(P)), cl: true, c: '#ffffff', f: 'rgba(255,255,255,0.05)', d: false }, { p: S(secCol(P, P.HB)), cl: true, c: '#ffffff', f: 'rgba(255,255,255,0.05)', d: false }, { p: S(secWall(P)), cl: true, c: '#94a3b8', f: null, d: true });
    const Zs = zones(P), top = [], bot = []; Zs.forEach(zn => { const nn = zn.kind === 'wing' ? 16 : 2; for (let i = 0; i <= nn; i++) { const s = zn.s0 + (zn.s1 - zn.s0) * i / nn, x = plan(P, s, 0)[0] / 100; top.push([x, ((zn.kind === 'gap' || zn.kind === 'gapB' ? P.Hf : topZ(P, zn, s)) - zt) / 100]); bot.push([x, (botZ(P, zn, s) - zt) / 100]); } });
    out.elev.push({ p: bot.concat(top.slice().reverse()), cl: true, c: '#ffffff', f: 'rgba(255,255,255,0.04)', d: false });
    Zs.forEach(zn => { if (zn.kind === 'A' || zn.kind === 'B') { const H = zn.kind === 'A' ? P.HA : P.HB, x0 = plan(P, zn.s0, 0)[0] / 100, x1 = plan(P, zn.s1, 0)[0] / 100; out.elev.push({ p: [[x0, (P.Hf - zt) / 100], [x1, (P.Hf - zt) / 100], [x1, (P.Hf + H - zt) / 100], [x0, (P.Hf + H - zt) / 100]], cl: true, c: '#ffffff', f: 'rgba(255,255,255,0.08)', d: false }); } });
    return out;
  }
  return {
    DEF, PR, GT, title: '曲型副壩標準圖',
    geo: { apronPoly, zones, axisAt, botZ, secFound, plan, inv, flatOf, dRange, frame, getParams: R => { RR = R || {}; try { return getParams(); } finally { RR = null; } } },
    run(R, opt) {
      RR = R || {}; O = [];
      try { const P = getParams(), rows = computeQuantities(P), q = compute(P); P.__q = q; let L = null;
        if (opt && opt.draw) { renderAll(P); L = { V: hostViews(P) }; }
        const checks = [{ ok: P.LtL >= 100 && P.LtR >= 100, text: `端部壩身弧長 左 ${P.LtL.toFixed(1)}／右 ${P.LtR.toFixed(1)} cm（＝U−立柱排列）` },
          { ok: P.theta < Math.PI * 0.95, text: `圓心張角 ${(P.theta * 180 / Math.PI).toFixed(1)}°、矢高 ${(P.R * (1 - Math.cos(P.theta / 2))).toFixed(0)} cm` },
          { ok: P.Bwt > 30 && P.BtA > 30, text: `壩身頂寬 ${P.Bwt.toFixed(0)}、立柱頂寬 A ${P.BtA.toFixed(0)}／B ${P.BtB.toFixed(0)} cm` },
          { ok: P.Bwb <= P.Btop + 1e-6, text: `端部壩身底寬 ${P.Bwb.toFixed(0)}（＝頂寬 ${P.Bwt}＋(${P.mdn}＋${P.mup})×${P.Hw}）${P.Bwb <= P.Btop + 1e-6 ? '≤' : '大於'}基礎頂寬 ${P.Btop} cm` }];
        return { P, rows, checks, O: O.slice(), L };
      } finally { RR = null; }
    }
  };
})();
