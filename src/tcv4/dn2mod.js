/* ============================================================================
   v6.3 排水溝原圖移植（乾砌石溝、箱籠溝、土袋溝、漿砌石溝、草溝及複式草溝；v6.3i 加浪型鋼板溝、拍漿溝、塑料盲溝（一）（二））
   套入規定：數量一律由本系統斷面幾何計算（與圖上數量表一致），原工具寫死的數值改為可調參數（預設＝原圖）
   斷面（局部 cm）：x 以溝中心為 0、z 以溝底（渠底面）為 0；dnSec 轉 m 供平面、橫斷面、開挖、通水檢核共用
   標準圖：原工具繪圖（ormodD.js，TCO_D[key].run），數量表改用本系統幾何數量
   ============================================================================ */
const DN2 = {};
const dn2A = P => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
const dn2Len = P => { let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; };
const dn2f = (v, d) => (+v).toFixed(d === undefined ? 2 : d);
function dn2Reg(key, def) {
  DN2[key] = def; const p = {}; def.PR.forEach(q => { p[q[0]] = q[4]; });
  DN_TYPES[key] = { label: def.label, code: '標準圖', mat: def.mat, p, orig: true, alias: def.alias || '' }; if (!DN_ORDER.includes(key)) DN_ORDER.push(key);
}
function dn2P(d) { const T = DN2[d.type], o = {}; T.PR.forEach(q => { const v = d.p[q[0]]; o[q[0]] = (q[5] === 'sel') ? (v === undefined ? q[4] : v) : (Number.isFinite(+v) ? +v : q[4]); }); return o; }
function dn2Geo(d) { const T = DN2[d.type], p = dn2P(d), k = JSON.stringify([d.type, p]); if (d._g && d._g.k === k) return d._g.v; const v = T.geo(p); v.p = p; d._g = { k, v }; return v; }

/* ---- 1. 乾砌石溝（兩側塊石乾砌＋溝底塊石＋背填級配碎石） ---- */
dn2Reg('dry', {
  alias: '乾砌石排水溝 砌石溝 卵石溝', label: '乾砌石溝', mat: ['乾砌石', '級配碎石'], n: 0.032,
  PR: [['W_cm', '溝底寬 W', 'cm', 5, 80], ['h2_cm', '設計水深 h2', 'cm', 5, 55], ['h1_cm', '出水高 h1', 'cm', 5, 20], ['m_slope', '側坡 1:m', '', 0.05, 0.3],
    ['D_wall', '側牆塊石長徑（均）', 'cm', 1, 25], ['D_bed', '溝底塊石長徑（均）', 'cm', 1, 35], ['use_bed_stone', '溝底鋪塊石', '', 1, 1, 'sel', [[1, '鋪設'], [0, '不鋪（依河床質）']]],
    ['t_gravel', '背填碎石厚', 'cm', 1, 20], ['kt', '側牆頂外緣寬係數（×長徑）', '', 0.01, 0.92], ['kb', '側牆底外緣寬係數（×長徑）', '', 0.01, 1.18], ['nb0', '不鋪溝底塊石時側牆入土深', 'cm', 1, 8], ['L_draw_cm', '平面／縱斷面繪製長度（圖面）', 'cm', 10, 300]],
  geo(p) {
    const W = p.W_cm, H = p.h1_cm + p.h2_cm, m = p.m_slope, Dw = p.D_wall, t = p.t_gravel, use = +p.use_bed_stone ? 1 : 0, zB = -(use ? p.D_bed : p.nb0);
    const xTi = W / 2 + H * m, xTo = xTi + p.kt * Dw, xBo = W / 2 + p.kb * Dw;
    const body = [[-xTo, H], [-xBo, zB], [xBo, zB], [xTo, H], [xTi, H], [W / 2, 0], [-W / 2, 0], [-xTi, H]];
    const grv = [[-(xTo + t), H], [-xTo, H], [-xBo, zB], [xBo, zB], [xTo, H], [xTo + t, H], [xBo + t, zB - t], [-(xBo + t), zB - t]];
    const bed = use ? W * p.D_bed : 0, under = W * Math.abs(zB), Awall = dn2A(body) - under, face = 2 * H * Math.hypot(1, m), Agrv = dn2A(grv), comp = dn2Len([[-(xTo + t), H], [-(xBo + t), zB - t], [xBo + t, zB - t], [xTo + t, H]]);
    const Q = [
      { it: `兩側塊石乾砌（長徑 D20～30 cm，均 ${Dw} cm）`, u: 'm³', v: Awall / 1e4, fx: `斷面量測：側牆外框面積 ${dn2f(dn2A(body) / 1e4, 4)}－溝底下方 ${dn2f(under / 1e4, 4)} ＝ ${dn2f(Awall / 1e4, 4)} m²/m`, ok: 'q_wall_stone_vol' },
      { it: `兩側乾砌石溝面面積（坡度 1:${m}）`, u: 'm²', v: face / 100, fx: `2×溝深 ${dn2f(H / 100)}×√(1＋${m}²)`, ok: 'q_wall_stone_area' },
      { it: `溝底塊石鋪底（長徑 D30～40 cm，均 ${p.D_bed} cm）`, u: 'm³', v: bed / 1e4, fx: use ? `溝底寬 ${dn2f(W / 100)}×${dn2f(p.D_bed / 100)}` : '不鋪設＝0', ok: 'q_bed_stone_vol' },
      { it: `背填級配碎石（厚約 ${t} cm）`, u: 'm³', v: Agrv / 1e4, fx: `斷面量測：碎石帶面積 ${dn2f(Agrv / 1e4, 4)} m²/m（兩側斜帶＋底層）`, ok: 'q_gravel_vol' },
      { it: '底土土壤壓實（壓實度 80% 以上）', u: 'm²', v: comp / 100, fx: `開挖外廓（兩側斜邊＋底寬）量測長 ${dn2f(comp / 100)} m`, ok: 'q_compact_area' }];
    return { polys: [body, grv], inner: [[-xTi, H], [-W / 2, 0], [W / 2, 0], [xTi, H]], Q, W, H, m, Wb: 2 * (xBo + t), Wt: 2 * (xTo + t), zb: zB - t, hyd: { B: W, m }, ov: { B_cm: +(2 * xTo).toFixed(1), W_inner_top_cm: +(2 * xTi).toFixed(1) } };   // 圖上 B＝幾何溝寬
  }
});

/* ---- 2. 漿砌石溝（漿砌塊石＋210 背襯混凝土＋140 打底） ---- */
dn2Reg('wet', {
  alias: '漿砌石排水溝 漿砌石溝', label: '漿砌石溝', mat: ['漿砌石', '混凝土'], n: 0.025,
  PR: [['N_bed', '溝底塊石數', '顆', 1, 4], ['N_wall', '側牆每側塊石數', '顆', 1, 5], ['bedPitch_cm', '溝底塊石短徑（間距）', 'cm', 0.5, 12.5], ['wallVertPitch_cm', '側牆塊石垂直間距', 'cm', 0.5, 14],
    ['m_in', '內側坡 1:m', '', 0.05, 0.3], ['bAdd_cm', '溝頂寬加寬（B＝W＋2Hm＋此值）', 'cm', 1, 33], ['B1_cm', '背襯混凝土厚 B1', 'cm', 1, 15], ['B2_cm', '溝頂牆厚 B2', 'cm', 1, 30],
    ['baseAdd_cm', '底寬加寬（底寬＝W＋2B1＋此值）', 'cm', 1, 18], ['D_stone_cm', '塊石長徑 φ', 'cm', 1, 25], ['kEmb', '塊石埋入比（長徑）', '', 0.01, 0.67], ['t_pc_cm', '140 打底混凝土厚', 'cm', 1, 5], ['pcExt_cm', '打底每側外伸', 'cm', 1, 5], ['L_draw_cm', '平面／縱斷面繪製長度（圖面）', 'cm', 10, 200]],
  geo(p) {
    const W = p.N_bed * p.bedPitch_cm, H = p.N_wall * p.wallVertPitch_cm, B = W + 2 * H * p.m_in + p.bAdd_cm, Wb = W + 2 * p.B1_cm + p.baseAdd_cm, zc = -(p.D_stone_cm * p.kEmb + p.B1_cm), zp = zc - p.t_pc_cm, Wp = Wb + 2 * p.pcExt_cm;
    const body = [[-(B / 2 + p.B2_cm), H], [-B / 2, H], [-W / 2, 0], [W / 2, 0], [B / 2, H], [B / 2 + p.B2_cm, H], [Wb / 2, zc], [-Wb / 2, zc]], pc = [[-Wp / 2, zc], [Wp / 2, zc], [Wp / 2, zp], [-Wp / 2, zp]];
    const nSt = 2 * p.N_wall + p.N_bed, aSt = Math.PI * (p.D_stone_cm / 2) * (0.48 * p.bedPitch_cm), Vst = nSt * aSt, Abody = dn2A(body), Vc = Abody - Vst * p.kEmb;
    const slant = Math.hypot(H, (B - W) / 2), face = 2 * slant + W, outS = Math.hypot(H - zc, (B / 2 + p.B2_cm) - Wb / 2), comp = Wp + 2 * outS + 2 * p.t_pc_cm;
    const Q = [
      { it: `漿砌塊石，表面不勾縫（φ${p.D_stone_cm} cm，埋入 ${dn2f(p.kEmb * 100, 0)}%）`, u: 'm³', v: Vst / 1e4, fx: `${nSt} 顆/斷面 × 圖面塊石橢圓面積 π×${dn2f(p.D_stone_cm / 2, 1)}×${dn2f(0.48 * p.bedPitch_cm, 1)} cm² ＝ ${dn2f(Vst / 1e4, 4)} m²/m`, ok: 'q_stone_vol' },
      { it: '漿砌石露出面積', u: 'm²', v: face / 100, fx: `兩側斜長 2×${dn2f(slant / 100)}＋溝底寬 ${dn2f(W / 100)}（斜長依圖面：底寬 W 至溝頂寬 B）`, ok: 'q_stone_area' },
      { it: '210kgf/cm² 背襯混凝土', u: 'm³', v: Vc / 1e4, fx: `斷面量測：外框面積 ${dn2f(Abody / 1e4, 4)}－埋入塊石 ${dn2f(Vst * p.kEmb / 1e4, 4)} ＝ ${dn2f(Vc / 1e4, 4)} m²/m`, ok: 'q_rc210_vol' },
      { it: '140kgf/cm² 打底混凝土', u: 'm³', v: Wp * p.t_pc_cm / 1e4, fx: `寬 ${dn2f(Wp / 100)}（底寬 ${dn2f(Wb / 100)}＋2×${dn2f(p.pcExt_cm / 100)}）× 厚 ${dn2f(p.t_pc_cm / 100)}`, ok: 'q_pc140_vol' },
      { it: '基層土壤壓實（壓實度 80% 以上）', u: 'm²', v: comp / 100, fx: `打底寬 ${dn2f(Wp / 100)}＋兩側外斜邊 2×${dn2f(outS / 100)}＋打底側面 2×${dn2f(p.t_pc_cm / 100)}`, ok: 'q_compact_area' }];
    return { polys: [body, pc], inner: [[-B / 2, H], [-W / 2, 0], [W / 2, 0], [B / 2, H]], Q, W, H, Wb: Wp, Wt: B + 2 * p.B2_cm, zb: zp, hyd: { B: W, m: (B - W) / (2 * H) }, ov: { W_cm: +W.toFixed(1), H_cm: +H.toFixed(1), B_cm: +B.toFixed(1), W_base_out_cm: +Wb.toFixed(1) } };
  }
});

/* ---- 3. 箱籠溝（階梯箱型石籠＋溝底箱籠＋不織布＋杉木樁） ---- */
dn2Reg('gab', {
  alias: '石籠溝 箱型石籠溝', label: '箱籠溝', mat: ['箱型石籠', '不織布', '杉木樁'], n: 0.032,
  PR: [['W_cm', '溝底寬 W', 'cm', 10, 200], ['N_side', '每側箱籠層數', '層', 1, 2], ['H1_cm', '單層箱籠高 H1', 'cm', 5, 50], ['B1_cm', '單箱長 B1（橫向）', 'cm', 10, 150], ['B2_cm', '單箱寬 B2（縱向）', 'cm', 10, 100],
    ['B3_cm', '每層外退 B3', 'cm', 5, 50], ['B4_cm', '木樁間距 B4', 'cm', 10, 100], ['nPileRow', '每側木樁排數（交錯）', '排', 1, 2], ['L_pile_cm', '木樁長 L', 'cm', 10, 200], ['d_pile_cm', '木樁末徑', 'cm', 1, 10],
    ['geo_up_cm', '不織布外包上翻', 'cm', 5, 60], ['N_rows', '平面繪製排數（圖面）', '排', 1, 3], ['S_long_pct', '縱斷面繪製坡度（圖面）', '%', 0.1, 6.8]],
  geo(p) {
    const W = p.W_cm, N = Math.max(1, Math.round(p.N_side)), H1 = p.H1_cm, B1 = p.B1_cm, B3 = p.B3_cm, H = N * H1, Wt = W + 2 * (N - 1) * B3, polys = [[[-B1, -H1], [B1, -H1], [B1, 0], [-B1, 0]]];
    for (let i = 0; i < N; i++) { const xi = W / 2 + i * B3; polys.push([[-xi - B1, i * H1], [-xi, i * H1], [-xi, (i + 1) * H1], [-xi - B1, (i + 1) * H1]], [[xi, i * H1], [xi + B1, i * H1], [xi + B1, (i + 1) * H1], [xi, (i + 1) * H1]]); }
    const V = polys.reduce((a, P) => a + dn2A(P), 0), box = B1 * p.B2_cm * H1;
    const g = [[-(Wt / 2 + B1), H], [-(Wt / 2 + B1), H - H1]]; for (let i = N - 1; i >= 0; i--) { const xo = W / 2 + i * B3 + B1; g.push([-xo, i * H1]); if (i > 0) { const xn = W / 2 + (i - 1) * B3 + B1; g.push([-xn, i * H1], [-xn, i * H1]); } }
    g.push([-B1, 0], [-B1, -H1], [B1, -H1], [B1, 0]); for (let i = 0; i < N; i++) { const xo = W / 2 + i * B3 + B1; g.push([xo, i * H1], [xo, (i + 1) * H1]); }
    const Lg = dn2Len(g) + 2 * p.geo_up_cm, np = 2 * p.nPileRow * 100 / p.B4_cm;
    const Q = [
      { it: '箱型石籠（填卵塊石）', u: 'm³', v: V / 1e4, fx: `斷面量測：兩側 2×${N} 層×${dn2f(B1 / 100)}×${dn2f(H1 / 100)}＋溝底 ${dn2f(2 * B1 / 100)}×${dn2f(H1 / 100)} ＝ ${dn2f(V / 1e4, 3)} m²/m`, ok: 'q_gabion_vol' },
      { it: `鍍鋅低碳鋼線箱型石籠網（單箱 ${B1}×${p.B2_cm}×${H1}）`, u: '組', v: V * 100 / box, fx: `每公尺石籠體積 ${dn2f(V / 1e4, 3)} ÷ 單箱 ${dn2f(box / 1e6, 3)} m³`, ok: 'q_mesh_sets' },
      { it: '防蝕透水不織布', u: 'm²', v: Lg / 100, fx: `圖面鋪設線量測長 ${dn2f((Lg - 2 * p.geo_up_cm) / 100)}（溝底、階梯背側）＋兩側外包上翻 2×${dn2f(p.geo_up_cm / 100)}`, ok: 'q_geo_area' },
      { it: `杉木樁（末徑 ${p.d_pile_cm} cm）`, u: '支', v: np, fx: `兩側×${p.nPileRow} 排×(100÷${p.B4_cm})`, ok: 'q_pile_cnt' },
      { it: '杉木樁長度', u: 'm', v: np * p.L_pile_cm / 100, fx: `${dn2f(np)} 支/m × ${dn2f(p.L_pile_cm / 100)} m`, ok: 'q_pile_len' }];
    return { polys, inner: [[-Wt / 2, H], [-W / 2, 0], [W / 2, 0], [Wt / 2, H]], Q, W, H, Wb: 2 * B1, Wt: Wt + 2 * B1, zb: -H1, hyd: { B: W, m: B3 / H1 * (N > 1 ? 1 : 0) } };
  }
});

/* ---- 4. 土袋溝（客土植生袋疊砌＋固定排樁＋兩側回填夯實） ---- */
dn2Reg('bag', {
  alias: '植生袋溝 土包袋溝', label: '土袋溝', mat: ['植生袋', '排樁'], n: 0.030,
  PR: [['W_cm', '溝底寬 W', 'cm', 5, 80], ['N_side', '側壁層數', '層', 1, 3], ['N_bed', '溝底層數', '層', 1, 2], ['N_bed_cols', '溝底橫向袋數', '袋', 1, 2], ['t_bag_cm', '單袋厚', 'cm', 1, 10],
    ['m_slope', '側坡 1:m', '', 0.05, 0.3], ['B1_cm', '袋長 B1（橫向）', 'cm', 1, 42], ['B2_cm', '袋寬 B2（縱向）', 'cm', 1, 32], ['lap_cm', '搭接', 'cm', 1, 5], ['pitchL_cm', '縱向排距（含搭接）', 'cm', 0.5, 28.57],
    ['ex_cm', '整坡開挖外放（袋外）', 'cm', 1, 24], ['S_stake_m', '排樁間距', 'm', 0.5, 2], ['N_stake_row', '每排樁數', '支', 1, 6], ['L_empty_cm', '空袋長（詳圖）', 'cm', 5, 60], ['W_empty_cm', '空袋寬（詳圖）', 'cm', 5, 40], ['N_rows', '平面繪製排數（圖面）', '排', 1, 6]],
  geo(p) {
    const W = p.W_cm, t = p.t_bag_cm, H = Math.round(p.N_side) * t, H1 = Math.round(p.N_bed) * t, m = p.m_slope, B1 = p.B1_cm, xTi = W / 2 + H * m, ex = p.ex_cm;
    const body = [[-(W / 2 + B1), -H1], [W / 2 + B1, -H1], [W / 2 + B1, 0], [xTi + B1, H], [xTi, H], [W / 2, 0], [-W / 2, 0], [-xTi, H], [-(xTi + B1), H], [-(W / 2 + B1), 0]];
    const wedge = [[W / 2 + B1, -H1], [W / 2 + B1 + ex, -H1], [xTi + B1 + ex, H], [xTi + B1, H], [W / 2 + B1, 0]], Abf = 2 * dn2A(wedge);
    const nSec = 2 * (Math.round(p.N_bed) + Math.round(p.N_side)) + Math.round(p.N_bed) * Math.round(p.N_bed_cols), rows = 100 / p.pitchL_cm, nb = nSec * rows, vb = B1 * p.B2_cm * t;
    const Q = [
      { it: '笮式客土植生袋（混草種）', u: '袋', v: nb, fx: `兩側 2×(底 ${Math.round(p.N_bed)}＋壁 ${Math.round(p.N_side)})＋溝底 ${Math.round(p.N_bed)}×${Math.round(p.N_bed_cols)} ＝ ${nSec} 袋/排 × (100÷${p.pitchL_cm}＝${dn2f(rows)} 排/m)`, ok: 'q_bags_cnt' },
      { it: '植生袋填充物（級配礫石＋砂石壤土混草種）', u: 'm³', v: nb * vb / 1e6, fx: `${dn2f(nb, 1)} 袋/m × 單袋 ${dn2f(B1 / 100)}×${dn2f(p.B2_cm / 100)}×${dn2f(t / 100)}`, ok: 'q_bag_fill_vol' },
      { it: '固定排樁', u: '支', v: p.N_stake_row / p.S_stake_m, fx: `每排 ${p.N_stake_row} 支 ÷ 間距 ${dn2f(p.S_stake_m, 1)} m`, ok: 'q_stake_cnt' },
      { it: '整坡開挖兩側回填土夯實', u: 'm³', v: Abf / 1e4, fx: `斷面量測：兩側回填楔形 2×${dn2f(dn2A(wedge) / 1e4, 4)} m²（袋外至整坡線，外放 ${ex} cm）`, ok: 'q_backfill_vol' }];
    return { polys: [body], inner: [[-xTi, H], [-W / 2, 0], [W / 2, 0], [xTi, H]], Q, W, H, Wb: W + 2 * (B1 + ex), Wt: 2 * (xTi + B1 + ex), zb: -H1, hyd: { B: W, m } };
  }
});

/* ---- 5. 草溝及複式草溝（拋物線斷面；複式＝溝底鋪卵石帶） ---- */
dn2Reg('grass', {
  alias: '草溝 複式草溝 植草溝', label: '草溝及複式草溝', mat: ['草皮', '卵石'], n: 0.035, exQ: true,
  PR: [['comp', '型式', '', 1, 0, 'sel', [[0, '一般草溝'], [1, '複式草溝（溝底鋪卵石）']]], ['W_cm', '溝頂寬 W', 'cm', 5, 140], ['H_cm', '設計水深 H', 'cm', 1, 48], ['f_cm', '出水高 f', 'cm', 1, 10], ['t_soil_cm', '客入表土厚', 'cm', 1, 15],
    ['N_cob', '溝底卵石橫向顆數', '顆', 1, 9], ['cobPitch_cm', '卵石橫向間距', 'cm', 0.5, 10], ['D_cob_cm', '卵石長徑', 'cm', 1, 10], ['sod_lap_cm', '草皮搭接', 'cm', 1, 2], ['S_wall_m', '縱斷面繪製間距（圖面）', 'm', 1, 15]],
  geo(p) {
    const W = p.W_cm, Ht = p.H_cm + p.f_cm, z = x => Ht * (x / (W / 2)) ** 2, arc = a => { let L = 0, n = 200; for (let i = 0; i < n; i++) { const x0 = -a + 2 * a * i / n, x1 = -a + 2 * a * (i + 1) / n; L += Math.hypot(x1 - x0, z(x1) - z(x0)); } return L; };
    const Pa = arc(W / 2), Wc = Math.min(W - 20, p.N_cob * p.cobPitch_cm), Pc = +p.comp ? arc(Wc / 2) : 0, Aex = 2 / 3 * W * Ht, ts = p.t_soil_cm;
    const top = [], bot = []; for (let i = 0; i <= 40; i++) { const x = -W / 2 + W * i / 40; top.push([x, z(x)]); bot.push([x, z(x) - ts]); }
    const band = top.concat(bot.reverse());
    const Q = [{ it: +p.comp ? '複式草溝：兩側邊坡匍匐性草皮' : '一般草溝：匍匐性草皮鋪植', u: 'm²', v: (Pa - Pc) / 100, fx: +p.comp ? `拋物線弧長 ${dn2f(Pa / 100)}－卵石帶弧長 ${dn2f(Pc / 100)}（圖面量測）` : `拋物線弧長量測 ${dn2f(Pa / 100)} m（溝頂寬 ${dn2f(W / 100)}、總深 ${dn2f(Ht / 100)}）`, ok: +p.comp ? 'q_grass_comp' : 'q_grass_std' }];
    if (+p.comp) Q.push({ it: `溝底鋪卵石（D${p.D_cob_cm} cm，${p.N_cob} 顆×${p.cobPitch_cm} cm）`, u: 'm²', v: Pc / 100, fx: `卵石帶寬 ${dn2f(Wc / 100)} 沿拋物線弧長 ${dn2f(Pc / 100)} m`, ok: 'q_cobble_area' }, { it: '溝底卵石體積', u: 'm³', v: Pc * p.D_cob_cm / 1e4, fx: `${dn2f(Pc / 100)} × 長徑 ${dn2f(p.D_cob_cm / 100)}`, ok: 'q_cobble_vol' });
    Q.push({ it: '拋物線草溝挖掘土方', u: 'm³', v: Aex / 1e4, fx: `(2/3)×${dn2f(W / 100)}×${dn2f(Ht / 100)}（拋物線面積）`, ok: 'q_excav_vol' }, { it: `鋤鬆種植面與客入良好表土（厚 ${ts} cm）`, u: 'm³', v: Pa * ts / 1e4, fx: `弧長 ${dn2f(Pa / 100)} × ${dn2f(ts / 100)}`, ok: 'q_topsoil_vol' }, { it: '底土土壤壓實（80% 以上）', u: 'm²', v: Pa / 100, fx: `開挖底床弧長 ${dn2f(Pa / 100)} m`, ok: 'q_compact_area' });
    if (!+p.comp) Q.push({ it: '（對照）複式時卵石帶', u: 'm²', v: 0, fx: '一般草溝不鋪卵石', ok: 'q_cobble_area' });
    return { polys: [band], inner: top.slice(), Q: Q.filter(q => !/對照/.test(q.it)), Qall: Q, W, H: Ht, Wb: W, Wt: W, zb: -ts, hyd: { para: true, T: W, D: Ht }, exA: Aex, ov: (() => { const P2 = arc(Wc / 2), o = { P_arc_m: +(Pa / 100).toFixed(2), W_cob_cm: Wc, H_tot_cm: Ht, q_grass_std: +(Pa / 100).toFixed(2), formula_grass_std: `拋物線弧長量測 ${dn2f(Pa / 100)} m（溝頂寬 ${dn2f(W / 100)}、總深 ${dn2f(Ht / 100)}）`,
      q_cobble_area: +(P2 / 100).toFixed(2), formula_cobble_area: `卵石帶寬 ${dn2f(Wc / 100)} 沿拋物線弧長 ${dn2f(P2 / 100)} m`, q_cobble_vol: +(P2 * p.D_cob_cm / 1e4).toFixed(3), formula_cobble_vol: `${dn2f(P2 / 100)} × 長徑 ${dn2f(p.D_cob_cm / 100)}`,
      q_grass_comp: +((Pa - P2) / 100).toFixed(2), formula_grass_comp: `拋物線弧長 ${dn2f(Pa / 100)}－卵石帶弧長 ${dn2f(P2 / 100)}（圖面量測）` }; return o; })() };   // 圖上一般／複式兩種斷面的數量都以幾何量測
  }
});

/* ---- 6. 浪型鋼板溝（0509-1：U 型浪型鋼板＋角鋼架／橫支柱＋兩側碎石級配回填） ---- */
dn2Reg('wave', {
  alias: '浪型鋼板溝 鋼板溝 U型鋼板溝', label: '浪型鋼板溝', mat: ['浪型鋼板', '角鋼', '級配碎石'], n: 0.024,
  PR: [['W_cm', '溝寬 W', 'cm', 5, 90], ['H_cm', '溝深 H', 'cm', 5, 100], ['R_cm', '溝底圓角半徑 R', 'cm', 1, 15], ['t_mm', '浪型鋼板厚 t', 'mm', 0.1, 1.6], ['L_unit_cm', '單元長度 L', 'cm', 5, 100],
    ['S_strut_cm', '橫支柱間距', 'cm', 5, 100], ['N_waves', '單元波數（圖面）', '波', 1, 10], ['w_gravel_cm', '兩側回填碎石寬', 'cm', 1, 20], ['hc_cm', '鋼板＋角鋼架外框厚（圖面）', 'cm', 0.1, 2.2],
    ['fold_cm', '兩側頂緣折邊展開（合計）', 'cm', 1, 7], ['lap_cm', '單元搭接長', 'cm', 0.1, 3.8], ['wL50', '角鋼 L50×50×4 單位重', 'kg/m', 0.01, 3.06], ['strutExt_cm', '橫支柱長＝W＋此值', 'cm', 1, 10],
    ['nRail', '縱向壓頂角鋼支數', '支', 1, 2], ['nbS', '每支橫支柱螺栓組數', '組', 1, 4], ['nbF', '每組搭接角鋼架螺栓組數', '組', 1, 5]],
  geo(p) {
    const W = p.W_cm, H = p.H_cm, R = Math.min(p.R_cm, W / 2 - 1, H - 1), c = p.hc_cm, w = p.w_gravel_cm;
    const U = (ww, hh, rr) => { const o = [[-ww / 2, hh]]; for (let i = 0; i <= 8; i++) { const a = Math.PI + Math.PI / 2 * i / 8; o.push([-ww / 2 + rr + rr * Math.cos(a), rr + rr * Math.sin(a) + (hh - H) * 0]); } for (let i = 0; i <= 8; i++) { const a = 1.5 * Math.PI + Math.PI / 2 * i / 8; o.push([ww / 2 - rr + rr * Math.cos(a), rr + rr * Math.sin(a)]); } o.push([ww / 2, hh]); return o; };
    const inn = U(W, H, R), out = U(W + 2 * c, H, R + c).map(([x, z]) => [x, z - c]), plate = inn.concat(out.slice().reverse());
    const xg = W / 2 + c, gL = [[-xg - w, H], [-xg, H], [-xg, 0], [-xg - w, 0]], gR = [[xg, H], [xg + w, H], [xg + w, 0], [xg, 0]];
    const Pu = dn2Len(inn), lr = (p.L_unit_cm + p.lap_cm) / p.L_unit_cm, Aplate = (Pu + p.fold_cm) / 100 * lr;
    const Lst = (W + p.strutExt_cm) / 100 * 100 / p.S_strut_cm, Lfr = (Pu + p.fold_cm) / 100 * 100 / p.L_unit_cm, Lang = p.nRail + Lst + Lfr, Ag = dn2A(gL) + dn2A(gR), comp = 2 * (H + c) + (W + 2 * c + 2 * w);
    const Q = [
      { it: `浪型鋼板（厚 ${p.t_mm} mm，鍍鋅量 ≧400 g/m²）`, u: 'm²', v: Aplate, fx: `圖面 U 型內緣展開長 ${dn2f(Pu / 100)}（直牆 2×${dn2f((H - R) / 100)}＋底 ${dn2f((W - 2 * R) / 100)}＋圓弧 π×${dn2f(R / 100)}）＋折邊 ${dn2f(p.fold_cm / 100)} × 搭接 (${p.L_unit_cm}＋${p.lap_cm})/${p.L_unit_cm}`, ok: 'q_plate_area' },
      { it: '角鋼架與橫支柱（L50×50×4mm）', u: 'kg', v: Lang * p.wL50, fx: `[壓頂角鋼 ${p.nRail}×1.00＋橫支柱 (${dn2f(W / 100)}＋${dn2f(p.strutExt_cm / 100)})×100/${p.S_strut_cm}＝${dn2f(Lst)}＋搭接角鋼架 ${dn2f((Pu + p.fold_cm) / 100)}×100/${p.L_unit_cm}＝${dn2f(Lfr)}] m × ${p.wL50} kg/m`, ok: 'q_angle_wt' },
      { it: '鍍鋅螺栓與墊片 1×50 mm', u: '組', v: p.nbS * 100 / p.S_strut_cm + p.nbF * 100 / p.L_unit_cm, fx: `橫支柱 ${p.nbS} 組×100/${p.S_strut_cm}＋搭接角鋼架 ${p.nbF} 組×100/${p.L_unit_cm}`, ok: 'q_bolt_sets' },
      { it: '兩側回填碎石級配夯實', u: 'm³', v: Ag / 1e4, fx: `斷面量測：兩側碎石帶 2×${dn2f(w / 100)}×${dn2f(H / 100)} ＝ ${dn2f(Ag / 1e4, 4)} m²/m`, ok: 'q_gravel_vol' },
      { it: '小型機械開挖並夯實兩側溝壁及底部', u: 'm²', v: comp / 100, fx: `開挖外廓量測：兩側壁 2×${dn2f((H + c) / 100)}＋底寬 ${dn2f((W + 2 * c + 2 * w) / 100)}`, ok: 'q_compact_area' }];
    return { polys: [plate, gL, gR], inner: inn, Q, W, H, Wb: W + 2 * c + 2 * w, Wt: W + 2 * c + 2 * w, zb: -c, hyd: { B: W, m: 0 }, ov: { P_unwrap_m: +((Pu + p.fold_cm) / 100).toFixed(2), L_angle_tot_m: +Lang.toFixed(2) } };
  }
});

/* ---- 7. 拍漿溝（0508-1：拍漿混凝土碗形斷面＋二層立體鐵絲網＋#5 錨筋＋溝側碎石） ---- */
dn2Reg('pat', {
  alias: '拍漿溝 拍漿排水溝', label: '拍漿溝', mat: ['混凝土', '鐵絲網', '鋼筋'], n: 0.015,
  PR: [['W_cm', '溝寬 W', 'cm', 5, 90], ['H_cm', '溝深 H', 'cm', 1, 30], ['t_cm', '混凝土厚 t', 'cm', 1, 15], ['w_gravel_cm', '溝側回填碎石寬', 'cm', 1, 20], ['N_long_bars', '縱向 #5 鋼筋支數', '支', 1, 6],
    ['N_anchor_sec', '每排錨筋孔數', '孔', 1, 4], ['L_anc_cm', '錨筋長', 'cm', 5, 100], ['S_anc_cm', '錨筋縱向間距', 'cm', 5, 100], ['N_mesh_layers', '鐵絲網層數', '層', 1, 2],
    ['nExp', '碗形斷面指數（深度∝|x|ⁿ）', '', 0.05, 2.35], ['sh_cm', '溝肩展開長（兩側合計）', 'cm', 1, 17], ['gExt_cm', '溝側碎石深＝t＋此值', 'cm', 1, 5], ['wt5', '#5 鋼筋單位重', 'kg/m', 0.001, 1.553]],
  geo(p) {
    const W = p.W_cm, H = p.H_cm, t = p.t_cm, n = Math.max(1.2, p.nExp), N = 60, inn = [];
    for (let i = 0; i <= N; i++) { const x = -W / 2 + W * i / N; inn.push([x, H * Math.pow(Math.abs(2 * x / W), n)]); }
    const out = inn.map((q, i) => { const a = inn[Math.max(0, i - 1)], b = inn[Math.min(N, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; return [q[0] + dz / L * t, q[1] - dx / L * t]; });
    const sh = p.sh_cm / 2, xe = Math.max(W / 2 + sh, out[N][0]), body = inn.concat([[xe, H], [xe, Math.min(H - t, out[N][1])]], out.slice().reverse(), [[-xe, Math.min(H - t, out[0][1])], [-xe, H]]);
    const Pa = dn2Len(inn), Pt = Pa + p.sh_cm, Ac = dn2A(body), gd = t + p.gExt_cm, w = p.w_gravel_cm, gL = [[-xe - w, H], [-xe, H], [-xe, H - gd], [-xe - w, H - gd]], gR = gL.map(([x, z]) => [-x, z]).reverse(), Ag = dn2A(gL) + dn2A(gR);
    const na = p.N_anchor_sec * 100 / p.S_anc_cm, Lb = p.N_long_bars * 1 + na * p.L_anc_cm / 100;
    const Q = [
      { it: `拍漿混凝土（厚 ${t} cm）`, u: 'm³', v: Ac / 1e4, fx: `斷面量測：碗形溝弧（弧長 ${dn2f(Pa / 100)}）沿法向厚 ${dn2f(t / 100)}＋兩側溝肩，外框面積 ${dn2f(Ac / 1e4, 4)} m²/m`, ok: 'q_conc_vol' },
      { it: `鍍鋅立體鐵絲網（${p.N_mesh_layers} 層，網目 50×50 mm）`, u: 'm²', v: p.N_mesh_layers * Pt / 100, fx: `${p.N_mesh_layers} 層 × 溝面展開寬（弧長 ${dn2f(Pa / 100)}＋溝肩 ${dn2f(p.sh_cm / 100)}＝${dn2f(Pt / 100)}）`, ok: 'q_mesh_area' },
      { it: '鑽孔 ∅3.8 cm 灌 1:3 水泥砂漿插 #5 錨筋', u: '支', v: na, fx: `每排 ${p.N_anchor_sec} 孔 × 100/${p.S_anc_cm}`, ok: 'q_anchor_cnt' },
      { it: '#5 鋼筋（縱向筋＋錨筋）', u: 'kg', v: Lb * p.wt5, fx: `[縱向 ${p.N_long_bars}×1.00＋錨筋 ${dn2f(na)}×${dn2f(p.L_anc_cm / 100)}] m × ${p.wt5} kg/m`, ok: 'q_rebar_wt' },
      { it: '溝側回填碎石', u: 'm³', v: Ag / 1e4, fx: `斷面量測：兩側 2×${dn2f(w / 100)}×${dn2f(gd / 100)}`, ok: 'q_gravel_vol' }];
    return { polys: [body, gL, gR], inner: inn, Q, W, H, Wb: 2 * (xe + w), Wt: 2 * (xe + w), zb: Math.min(...out.map(q => q[1])), hyd: { curve: inn }, ov: { P_arc_m: +(Pt / 100).toFixed(2) } };
  }
});

/* ---- 8. 塑料盲溝（一）不織布土石籠／包覆型（0513-1；地下排水，不做明渠通水檢核） ---- */
dn2Reg('bl1', {
  alias: '盲溝 塑料盲溝 不織布土石籠盲溝 包覆型盲溝 地下排水', label: '塑料盲溝（一）不織布土石籠／包覆型', mat: ['碎石級配', '不織布', '土石籠'], n: 0.03, exQ: true, sub: true,
  PR: [['B1_cm', '溝頂寬 B1', 'cm', 5, 50], ['B2_cm', '溝底寬 B2', 'cm', 5, 30], ['t1_cm', '原土回填厚 t1', 'cm', 1, 10], ['h1_cm', '上下碎石級配厚 h1', 'cm', 1, 15], ['h2_cm', '中央盲溝厚層 h2', 'cm', 1, 20],
    ['W_core_cm', '土石籠核心寬', 'cm', 1, 20], ['lap_cm', '核心不織布搭接', 'cm', 1, 12], ['slope_pct', '縱斷面繪製坡度（圖面）', '%', 0.1, 2], ['L_prof_cm', '平／縱面展示長（圖面）', 'cm', 10, 250]],
  geo(p) {
    const B1 = p.B1_cm, B2 = p.B2_cm, h1 = p.h1_cm, h2 = p.h2_cm, H = 2 * h1 + h2, t = p.t1_cm, k = (B1 - B2) / 2 / H, Bs = B1 + 2 * k * t, Wc = Math.min(p.W_core_cm, B2 - 4);
    const trap = [[-B2 / 2, 0], [B2 / 2, 0], [B1 / 2, H], [-B1 / 2, H]], top = [[-B1 / 2, H], [B1 / 2, H], [Bs / 2, H + t], [-Bs / 2, H + t]], core = [[-Wc / 2, h1], [Wc / 2, h1], [Wc / 2, h1 + h2], [-Wc / 2, h1 + h2]];
    const side = Math.hypot((B1 - B2) / 2, H), Aex = dn2A(trap) + dn2A(top), Ag = dn2A(trap) - dn2A(core), Lgo = B2 + 2 * side + B1, Lgi = 2 * (Wc + h2) + p.lap_cm;
    const Q = [
      { it: '梯形盲溝開挖（含原土回填層）', u: 'm³', v: Aex / 1e4, fx: `斷面量測：(溝底 ${dn2f(B2 / 100)}＋地表 ${dn2f(Bs / 100)})/2 × (H ${dn2f(H / 100)}＋t1 ${dn2f(t / 100)})`, ok: 'q_excav_vol' },
      { it: `頂層原土回填（厚 ${t} cm）`, u: 'm³', v: dn2A(top) / 1e4, fx: `(${dn2f(B1 / 100)}＋${dn2f(Bs / 100)})/2 × ${dn2f(t / 100)}`, ok: 'q_backfill_vol' },
      { it: '中央不織布土石籠（卵塊石）', u: 'm³', v: dn2A(core) / 1e4, fx: `${dn2f(Wc / 100)} × h2 ${dn2f(h2 / 100)}`, ok: 'q_core_gabion' },
      { it: '外圍碎石級配濾料', u: 'm³', v: Ag / 1e4, fx: `梯形 (${dn2f(B1 / 100)}＋${dn2f(B2 / 100)})/2×${dn2f(H / 100)}＝${dn2f(dn2A(trap) / 1e4, 3)} － 土石籠 ${dn2f(dn2A(core) / 1e4, 3)}`, ok: 'q_gravel_outer' },
      { it: '透水不織布', u: 'm²', v: (Lgo + Lgi) / 100, fx: `外槽包覆 ${dn2f(Lgo / 100)}（底＋兩斜邊＋頂）＋土石籠包覆 2×(${dn2f(Wc / 100)}＋${dn2f(h2 / 100)})＋搭接 ${dn2f(p.lap_cm / 100)}`, ok: 'q_geo_area' },
      { it: '基層土壤壓實（80% 以上）', u: 'm²', v: (B2 + 2 * side) / 100, fx: `溝底 ${dn2f(B2 / 100)}＋兩斜邊 2×${dn2f(side / 100)}`, ok: 'q_compact_area' }];
    return { polys: [trap, core, top], inner: [[-B1 / 2, H + t], [B1 / 2, H + t]], Q, W: B2, H: H + t, Wb: B2, Wt: Bs, zb: 0, hyd: { B: B2, m: k }, exA: Aex, ov: { H_cm: H } };
  }
});

/* ---- 9. 塑料盲溝（二）HDPE 透水網管（0513-1；地下排水，不做明渠通水檢核） ---- */
dn2Reg('bl2', {
  alias: '盲溝 HDPE 透水網管 塑料盲溝 地下排水', label: '塑料盲溝（二）HDPE 透水網管', mat: ['碎石', '不織布', 'HDPE 網管'], n: 0.03, exQ: true, sub: true,
  PR: [['pipe_model', '網管型號', '', 1, 150, 'sel', [[50, '2"（d 50 mm）'], [75, '3"（d 75 mm）'], [100, '4"（d 100 mm）'], [125, '5"（d 125 mm）'], [150, '6"（d 150 mm）'], [200, '8"（d 200 mm）'], [250, '10"（d 250 mm）']]],
    ['perf_type', '開孔型式', '', 1, 'PARTIAL_120', 'sel', [['FULL', '全透水（360°）'], ['PARTIAL_120', '2/3 透水（底 120° 不開孔）'], ['PARTIAL_180', '1/2 透水（底 180° 不開孔）']]],
    ['B1_cm', '溝頂寬 B1', 'cm', 5, 50], ['B2_cm', '溝底寬 B2', 'cm', 5, 30], ['t_cm', '原土回填厚 t', 'cm', 1, 10], ['H1_cm', '碎石盲溝深 H1', 'cm', 1, 40], ['lap_cm', '外槽不織布頂搭接', 'cm', 1, 15],
    ['kPipe', '網管圖面放大倍率（圖面）', '', 0.05, 1.15], ['dMinPx', '網管圖面最小直徑（圖面 px）', '', 1, 22], ['slope_pct', '縱斷面繪製坡度（圖面）', '%', 0.1, 2], ['L_prof_cm', '縱剖展示長（圖面）', 'cm', 10, 250]],
  geo(p) {
    const B1 = p.B1_cm, B2 = p.B2_cm, H = p.H1_cm, t = p.t_cm, k = (B1 - B2) / 2 / H, Bs = B1 + 2 * k * t, d = (+p.pipe_model) / 10, r = d / 2, zc = H / 2;
    const trap = [[-B2 / 2, 0], [B2 / 2, 0], [B1 / 2, H], [-B1 / 2, H]], top = [[-B1 / 2, H], [B1 / 2, H], [Bs / 2, H + t], [-Bs / 2, H + t]], pipe = Array.from({ length: 24 }, (_, i) => [r * Math.cos(i / 24 * 2 * Math.PI), zc + r * Math.sin(i / 24 * 2 * Math.PI)]);
    const side = Math.hypot((B1 - B2) / 2, H), Aex = dn2A(trap) + dn2A(top), Ap = Math.PI * r * r, Ag = dn2A(trap) - Ap, Lgo = B2 + 2 * side + B1 + p.lap_cm;
    const perf = { FULL: '全透水型（360° 開孔）', PARTIAL_120: '2/3 透水型（底 120° 不開孔）', PARTIAL_180: '1/2 透水型（底 180° 不開孔）' }[p.perf_type] || p.perf_type;
    const Q = [
      { it: '梯形盲溝開挖（含原土回填層）', u: 'm³', v: Aex / 1e4, fx: `斷面量測：(溝底 ${dn2f(B2 / 100)}＋地表 ${dn2f(Bs / 100)})/2 × (H1 ${dn2f(H / 100)}＋t ${dn2f(t / 100)})`, ok: 'q_excav_vol' },
      { it: `頂層原土回填（厚 ${t} cm）`, u: 'm³', v: dn2A(top) / 1e4, fx: `(${dn2f(B1 / 100)}＋${dn2f(Bs / 100)})/2 × ${dn2f(t / 100)}`, ok: 'q_backfill_vol' },
      { it: '2～6 cm 清碎石濾料', u: 'm³', v: Ag / 1e4, fx: `梯形 (${dn2f(B1 / 100)}＋${dn2f(B2 / 100)})/2×${dn2f(H / 100)}＝${dn2f(dn2A(trap) / 1e4, 3)} － 網管 π/4×${dn2f(d / 100, 3)}²＝${dn2f(Ap / 1e4, 4)}`, ok: 'q_gravel_hdpe' },
      { it: '透水不織布', u: 'm²', v: (Lgo + Math.PI * d) / 100, fx: `外槽包覆（底＋兩斜邊＋頂＋搭接 ${dn2f(p.lap_cm / 100)}）${dn2f(Lgo / 100)}＋網管外包 π×${dn2f(d / 100, 3)}`, ok: 'q_geo_area' },
      { it: `HDPE 透水網管 d${+p.pipe_model} mm（${perf}，外包不織布）`, u: 'm', v: 1, fx: '沿溝長 1.00 m/m', ok: 'q_pipe_len' },
      { it: '基層土壤壓實（80% 以上）', u: 'm²', v: (B2 + 2 * side) / 100, fx: `溝底 ${dn2f(B2 / 100)}＋兩斜邊 2×${dn2f(side / 100)}`, ok: 'q_compact_area' }];
    return { polys: [trap, pipe, top], inner: [[-B1 / 2, H + t], [B1 / 2, H + t]], Q, W: B2, H: H + t, Wb: B2, Wt: Bs, zb: 0, hyd: { B: B2, m: k }, exA: Aex, ov: { H_tot_cm: H + t } };
  }
});

/* ---- 共用：dnSec／通水斷面／n／數量列／面板欄位／標準圖 ---- */
(function () {
  const _sec = dnSec; dnSec = function (d) {
    if (!DN2[d.type]) return _sec(d); const G = dn2Geo(d), c = q => q.map(([x, z]) => [x / 100, z / 100]), polys = G.polys.map(c);
    const A = G.polys.reduce((a, P) => a + dn2A(P), 0) / 1e4, Wb = G.Wb / 100, Wt = G.Wt / 100, H = G.H / 100, zb = G.zb / 100;
    return { polys, inner: c(G.inner), A, Wb, Wt, zb, H, B: (G.hyd.B !== undefined ? G.hyd.B : 0) / 100, m: G.hyd.m !== undefined ? G.hyd.m : (G.W / 2) / G.H, t: 0, tb: 0, voidA: dn2A(G.inner) / 1e4, outA: (Wb + Wt) / 2 * (H - zb), orig: true };
  };
  const _hg = dnHydGeom; dnHydGeom = function (d, h) {
    if (!DN2[d.type]) return _hg(d, h); const G = dn2Geo(d), Y = G.hyd;
    if (Y.para) { const T = Y.T / 100, D = Y.D / 100, hh = Math.min(h, D), w = T * Math.sqrt(hh / D), A = 2 / 3 * w * hh, P = w + 8 / 3 * hh * hh / Math.max(1e-6, w); return { A, P, R: A / P }; }   // 拋物線斷面
    if (Y.curve) { const C = Y.curve.map(([x, z]) => [x / 100, z / 100]); let A = 0, P = 0; for (let i = 1; i < C.length; i++) { const [x0, z0] = C[i - 1], [x1, z1] = C[i]; const d0 = h - z0, d1 = h - z1; if (d0 <= 0 && d1 <= 0) continue; let xa = x0, za = z0, xb = x1, zb = z1; if (d0 < 0) { const u = d1 / (d1 - d0); xa = x1 + (x0 - x1) * u; za = h; } if (d1 < 0) { const u = d0 / (d0 - d1); xb = x0 + (x1 - x0) * u; zb = h; } A += (xb - xa) * ((h - za) + (h - zb)) / 2; P += Math.hypot(xb - xa, zb - za); } return { A, P: Math.max(P, 1e-6), R: A / Math.max(P, 1e-6) }; }   // 任意曲線斷面（拍漿溝碗形）
    const B = Y.B / 100, m = Y.m || 0, A = (B + m * h) * h, P = B + 2 * h * Math.sqrt(1 + m * m); return { A, P, R: A / P };
  };
  const _calc = dnCalc; dnCalc = function (d) { const v = _calc(d); if (DN2[d.type] && DN2[d.type].exQ && v && !v._ex2) { const G = dn2Geo(d); v.ex = G.exA / 1e4 * v.L; v.bf = 0; v._ex2 = 1; } return v; };   // 草溝：開挖＝拋物線斷面
  const _hc = dnHydCheck; dnHydCheck = function (d) { return DN2[d.type] && DN2[d.type].sub ? null : _hc(d); };   // 盲溝：地下排水，不做通水檢核
  const _n = dnN; dnN = function (d) { return DN2[d.type] ? (d.nv || DN2[d.type].n) : _n(d); };
  const _rows = dnRows; dnRows = function (d) {
    if (!DN2[d.type]) return _rows(d); const c = dnCalc(d), G = dn2Geo(d), L = c.L, rows = [{ it: '排水溝長度', u: 'm', v: L, fx: d.mode === 'B' ? '基線長' : `${formatStation(d.s0)}～${formatStation(d.s1)}` }];
    G.Q.forEach(q => rows.push({ it: q.it, u: q.u, v: q.v * L, fx: `${dn2f(q.v, 3)} ${q.u}/m × ${dn2f(L)} m；${q.fx}` }));
    if (DN2[d.type].exQ) return rows;
    rows.push({ it: '開挖（依地形，概估）', u: 'm³', v: c.ex, fx: `底＝構造底−0.1 m、兩側各留 0.1 m、1:${dn2f(d.ec)} 至地面；有地形 ${c.nG}/${c.n} 點` });
    rows.push({ it: '回填（概估）', u: 'm³', v: c.bf, fx: '開挖−構造外形' }); return rows;
  };
})();
function dn2Fields(d, lab, inp) {
  const T = DN2[d.type], p = dn2P(d);
  const typeSel = lab('斷面型式', `<select class="input-select" style="width:140px;" onchange="dnSet('type',this.value)">${DN_ORDER.map(k => `<option value="${k}"${k === d.type ? ' selected' : ''}>${DN_TYPES[k].label}</option>`).join('')}</select>`);
  return [typeSel].concat(T.PR.map(q => q[5] === 'sel' ? lab(q[1], `<select class="input-select" style="width:110px;" onchange="dnSet('p.${q[0]}',this.value)">${q[6].map(([v, t]) => `<option value="${v}"${String(v) === String(p[q[0]]) ? ' selected' : ''}>${t}</option>`).join('')}</select>`)
    : lab(`${q[1]}${q[2] ? ' (' + q[2] + ')' : ''}`, inp('p.' + q[0], p[q[0]], q[3])))).concat([lab('開挖坡 1:n', inp('ec', d.ec, 0.05)), `<button class="btn" onclick="dn2StdOpen()">📐 標準圖（原圖＋本段數量）</button>`]);
}
function dn2StdPrims(d) {
  const G = dn2Geo(d), OV = {}; G.Q.forEach(q => { if (q.ok) { OV[q.ok] = +q.v.toFixed(3); OV[q.ok.replace(/^q_/, 'formula_')] = q.fx; } });
  Object.assign(OV, G.ov || {}); const O = TCO_D[d.type].run(Object.assign({ L_tot_m: +dnLen(d).toFixed(1) || 30 }, G.p), OV), P = tcoStdPrims(O, 0.01, 0, 0, 'STD_'), bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  P.forEach(o => { if (o.t === 't') { bb.x0 = Math.min(bb.x0, o.x); bb.x1 = Math.max(bb.x1, o.x + o.s.length * o.h); bb.y0 = Math.min(bb.y0, o.y - o.h); bb.y1 = Math.max(bb.y1, o.y + o.h); } else (o.p || []).forEach(v => { bb.x0 = Math.min(bb.x0, v[0]); bb.x1 = Math.max(bb.x1, v[0]); bb.y0 = Math.min(bb.y0, v[1]); bb.y1 = Math.max(bb.y1, v[1]); }); });
  const TH = Math.max(0.05, (bb.x1 - bb.x0) / 120); P.push({ t: 't', x: bb.x0, y: bb.y1 + TH * 2, h: TH * 1.4, s: `${d.name}　${DN_TYPES[d.type].label}（${d.mode === 'A' ? `${d.side === 'L' ? '左' : '右'}側 ${formatStation(d.s0)}～${formatStation(d.s1)}` : '獨立基線'}　L＝${dn2f(dnLen(d))} m）`, c: '#ffd08a', a: 30, ly: 'STD_TITLE', al: 'l', va: 'b', rot: 0 }); bb.y1 += TH * 4;
  return { P, bb };
}
function dn2StdOpen() { const d = state.dns[state.dnSel]; if (!d || !DN2[d.type]) return; const r = dn2StdPrims(d); stStdOpen(undefined, { P: r.P, bb: r.bb, name: d.name, title: `${d.name}　${DN_TYPES[d.type].label}標準圖` }); }
(function () {
  const _sd = rvDxfStdAll; rvDxfStdAll = function (D, xRight, yTop) { let y = _sd(D, xRight, yTop); try { (state.dns || []).forEach(d => { if (!DN2[d.type] || (typeof dnOn === 'function' && !dnOn(d))) return; const r = dn2StdPrims(d), q = r.bb; stStdEmit(D, r.P, xRight - q.x1, y - q.y1); y -= (q.y1 - q.y0) + 20; }); } catch (e) { console.error('dn2Std', e); } return y; };
})();
