function computeDerivedAndQuantities(p) {   // v8.0：改為依圖面幾何計算（取代原工具校正常數）；鋼筋以 kg/m³ 估算（原圖無鋼筋表）
  syncPierHeightsArray(p);
  const N_pier = p.N_pier, N_slot = N_pier + 1;
  const pierHeights = p.pierHeights.map(h => Math.max(50, Number(h) || p.H_upper));
  const maxPierH = Math.max(...pierHeights, p.H_lower);
  const W_slit = N_pier * p.W_pier + N_slot * p.W_slot;
  const W_weir = p.W_ovf_L + W_slit + p.W_ovf_R;
  const L_total = p.W_wing_L + p.W_slope_L + W_weir + p.W_slope_R + p.W_wing_R;
  const L_base = Math.max(100, L_total - p.W_cut_L - p.W_cut_R);
  const H_total = p.D_key + p.T_base + p.H_lower + p.H_upper + p.H_wing_rise;
  const H_dam_body = p.H_lower + p.H_upper, Hd = H_dam_body;
  const dH_slot = Math.max(0, p.H_lower - p.H_upper);
  const B_base = p.B_mid + p.H_lower * (p.S_up + p.S_dn);
  const B_slot = B_base - p.H_upper * (p.S_up + p.S_dn);
  const B_key_top = p.D_key > 0 ? (p.B_key_bot + p.D_key * p.S_up) : 0;
  const L_heel = B_base - B_key_top;
  const getPierTopWidthCm = (hCm) => Math.max(80, B_base - hCm * (p.S_up + p.S_dn));
  const B_stone_up_top = p.B_stone_top, B_stone_up_bot = p.B_stone_bot;
  const M = v => v / 100, f = (v, d) => (+v).toFixed(d === undefined ? 2 : d);
  // 正視幾何（x 沿壩軸自左端起，z 自底版頂起）
  const xSlitL = p.W_wing_L + p.W_slope_L + p.W_ovf_L, xSlitR = xSlitL + W_slit;
  const endL = z => p.W_cut_L * (1 - z / Hd), endR = z => L_total - p.W_cut_R * (1 - z / Hd);   // 兩岸端面斜線
  const xWeirL = p.W_wing_L + p.W_slope_L, xWeirR = xSlitR + p.W_ovf_R;
  const slpL = z => xWeirL - p.W_slope_L * (z - p.H_lower) / p.H_upper, slpR = z => xWeirR + p.W_slope_R * (z - p.H_lower) / p.H_upper;
  const Llb_L = xSlitL - endL(0), Llt_L = xSlitL - endL(p.H_lower), Llb_R = endR(0) - xSlitR, Llt_R = endR(p.H_lower) - xSlitR;   // 下段壩身底／頂長（溢流段＋斜坡＋翼牆，扣梳子開口）
  const Lub_L = slpL(p.H_lower) - endL(p.H_lower), Lut_L = p.W_wing_L, Lub_R = endR(p.H_lower) - slpR(p.H_lower), Lut_R = p.W_wing_R;   // 上段（翼牆）
  const pz = (H, Bb, Bt, Lb, Lt) => H / 6 * ((2 * Bb + Bt) * Lb + (2 * Bt + Bb) * Lt);   // 擬柱體（寬、長皆隨高線性）
  // 1. 混凝土
  const V_key = p.D_key > 0 ? (B_key_top + p.B_key_bot) / 2 * p.D_key * L_base : 0;
  const V_base_slab = L_base * B_base * p.T_base;
  let V_piers_net = 0; pierHeights.forEach(h => { V_piers_net += (getPierTopWidthCm(h) + B_base) / 2 * h * p.W_pier; });
  const V_lower_wings = pz(p.H_lower, B_base, p.B_mid, Llb_L + Llb_R, Llt_L + Llt_R);
  const V_upper_wings = pz(p.H_upper, p.B_mid, p.B_weir_top, Lub_L + Lub_R, Lut_L + Lut_R);
  const V_top_rise = pz(p.H_wing_rise, p.B_weir_top, p.B_wing_top, p.W_wing_L + p.W_wing_R, 0);
  const V_conc = (V_key + V_base_slab + V_piers_net + V_lower_wings + V_upper_wings + V_top_rise) / 1e6;
  // 2. 模板（依斷面實際坡面長；兩岸端面、壩頂、止滑齒牆底不組模）
  const sfUp = Math.hypot(1, p.S_up), sfDn = Math.hypot(1, p.S_dn);
  const kUpDn = (p.H_upper * p.S_up + p.B_weir_top - p.B_mid) / p.H_upper, kRsDn = p.H_wing_rise > 0 ? (p.H_wing_rise * p.S_up + p.B_wing_top - p.B_weir_top) / p.H_wing_rise : 0;
  const sfUpDn = Math.hypot(1, kUpDn), sfRsDn = Math.hypot(1, kRsDn);
  const A_form_base = L_base * ((p.D_key + p.T_base) + p.T_base);
  let A_form_pier_sides = (p.B_mid + B_base) / 2 * p.H_lower * 2, sumPierFaceArea = 0;
  pierHeights.forEach(h => { A_form_pier_sides += 2 * (getPierTopWidthCm(h) + B_base) / 2 * h; sumPierFaceArea += p.W_pier * h; });
  const A_low_front = (Llb_L + Llt_L) / 2 * p.H_lower + (Llb_R + Llt_R) / 2 * p.H_lower;
  const A_form_lower_faces = (sfDn + sfUp) * (A_low_front + sumPierFaceArea);
  const A_up_front = (Lub_L + Lut_L) / 2 * p.H_upper + (Lub_R + Lut_R) / 2 * p.H_upper, A_rise_front = (p.W_wing_L + p.W_wing_R) * p.H_wing_rise / 2;
  const A_form_upper_faces = (sfUp + sfUpDn) * A_up_front + (sfUp + sfRsDn) * A_rise_front;
  const sLenL = Math.hypot(p.W_slope_L, p.H_upper), sLenR = Math.hypot(p.W_slope_R, p.H_upper);
  const A_form_wing_slopes = (p.B_weir_top + p.B_mid) / 2 * (sLenL + sLenR);
  const A_form = (A_form_base + A_form_pier_sides + A_form_lower_faces + A_form_upper_faces + A_form_wing_slopes) / 1e4;
  // 3. 鋼筋（S5b：原圖無鋼筋表 → kg/m³ 估算）
  const W_rebar = V_conc * p.rbk;
  // 原工具配筋圖標註用（支數、跨距；不再用於計重）
  const m_rebar_span = Number(((L_base - 2 * p.C_rebar) / 100).toFixed(1));
  const n_bays_main = Math.round(m_rebar_span / (p.S_rebar_main / 100));
  const L_outer_u = Number((7.3 * (p.H_lower / 600)).toFixed(1));
  const n_pier_bars = Math.max(2, Math.round((p.W_pier - 30) / p.S_rebar_pier)), n_pier_anc = Math.max(2, n_pier_bars - 1);
  // 4. 漿砌塊石：下游端漿砌石槽（梯形）＋半橢圓護坦
  const A_apron = Math.PI / 4 * W_weir * p.L_apron_dn;
  const A_apron_dn = Number((A_apron / 1e4).toFixed(2));
  const V_stone_up = (B_stone_up_top + B_stone_up_bot) / 2 * p.D_stone_up * L_base / 1e6, V_stone_dn = A_apron * p.T_apron_dn / 1e6, V_stone = V_stone_up + V_stone_dn;
  // 計算式字串（圖上數量表）
  const f_conc_str1 = `止滑齒牆 (${f(M(B_key_top))}+${f(M(p.B_key_bot))})/2×${f(M(p.D_key))}×${f(M(L_base))}＋底版 ${f(M(L_base))}×${f(M(B_base))}×${f(M(p.T_base))}＋梳齒墩 Σ(${N_pier}墩)=${f(V_piers_net / 1e6)}＋下段壩身 ${f(M(p.H_lower))}/6×[(2×${f(M(B_base))}+${f(M(p.B_mid))})×(${f(M(Llb_L))}+${f(M(Llb_R))})+(2×${f(M(p.B_mid))}+${f(M(B_base))})×(${f(M(Llt_L))}+${f(M(Llt_R))})]`;
  const f_conc_str2 = `＋上段翼牆 ${f(M(p.H_upper))}/6×[(2×${f(M(p.B_mid))}+${f(M(p.B_weir_top))})×(${f(M(Lub_L))}+${f(M(Lub_R))})+(2×${f(M(p.B_weir_top))}+${f(M(p.B_mid))})×(${f(M(Lut_L))}+${f(M(Lut_R))})]＋翼牆加高 ${f(M(p.H_wing_rise))}/6×(2×${f(M(p.B_weir_top))}+${f(M(p.B_wing_top))})×${f(M(p.W_wing_L + p.W_wing_R))} = ${f(V_conc)} m3`;
  const f_form_str1 = `底版 ${f(M(L_base))}×(${f(M(p.D_key + p.T_base))}+${f(M(p.T_base))})＋開口側牆 ${f(A_form_pier_sides / 1e4)}＋下段壩面 (${f(sfDn, 3)}+${f(sfUp, 3)})×(${f(A_low_front / 1e4)}+墩面 ${f(sumPierFaceArea / 1e4)})`;
  const f_form_str2 = `＋上段壩面 (${f(sfUp, 3)}+${f(sfUpDn, 3)})×${f(A_up_front / 1e4)}＋加高 (${f(sfUp, 3)}+${f(sfRsDn, 3)})×${f(A_rise_front / 1e4)}＋斜坡翼牆面 ${f(M((p.B_weir_top + p.B_mid) / 2))}×(${f(M(sLenL))}+${f(M(sLenR))}) = ${f(A_form)} m2`;
  const f_rebar_str1 = `原圖無鋼筋表，以 ${p.rbk} kg/m³ 估算（含損耗）`;
  const f_rebar_str2 = `${p.rbk}×混凝土 ${f(V_conc)} m³ = ${f(W_rebar)} kg`;
  const f_stone_str = `(${f(M(B_stone_up_top))}+${f(M(B_stone_up_bot))})/2×${f(M(p.D_stone_up))}×${f(M(L_base))}＋半橢圓護坦 π/4×${f(M(W_weir))}×${f(M(p.L_apron_dn))}=${A_apron_dn}×${f(M(p.T_apron_dn))} = ${f(V_stone)} m3`;
  const uniquePierHeights = []; pierHeights.forEach(h => { if (!uniquePierHeights.some(u => Math.abs(u - h) < 0.5)) uniquePierHeights.push(h); }); uniquePierHeights.sort((a, b) => b - a);
  return { N_pier, N_slot, pierHeights, maxPierH, uniquePierHeights, getPierTopWidthCm, W_slit, W_weir, L_total, L_base, H_total, H_dam_body, dH_slot, B_slot, B_base, B_key_top, L_heel,
    B_stone_up_top, B_stone_up_bot, A_apron_dn, m_rebar_span, n_bays_main, L_outer_u, n_pier_bars, n_pier_anc, V_conc, A_form, W_rebar, V_stone,
    f_conc_str1, f_conc_str2, f_form_str1, f_form_str2, f_rebar_str1, f_rebar_str2, f_stone_str,
    __q: { V_key: V_key / 1e6, V_base_slab: V_base_slab / 1e6, V_piers_net: V_piers_net / 1e6, V_lower_wings: V_lower_wings / 1e6, V_upper_wings: V_upper_wings / 1e6, V_top_rise: V_top_rise / 1e6, V_stone_up, V_stone_dn, xSlitL, xSlitR, xWeirL, xWeirR, Llb_L, Llb_R, Llt_L, Llt_R, Lub_L, Lub_R } };
}
