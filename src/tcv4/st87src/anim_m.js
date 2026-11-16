  /* ---- 幾何模型（cm）：剖面 x＝自護岸趾（基礎頂前緣）往岸側，y＝自護岸基礎底向上；立面寬 W_total＝2×(牆頂厚＋內斜)＋通道寬 ---- */
  function MODEL(p) {
    p = Object.assign({}, __D87, p); const f = G87.f;
    const Tb = p.T_wall_top + p.T_wall_in, Wt = 2 * Tb + p.W_ch, Lrs = p.L_base_exp + p.L_chamfer, sCE = Lrs + p.L_crest, sRE = sCE + p.L_ramp;
    const yBT = p.H_base, ySL = yBT + p.H_slope, yCT = ySL + p.H_top, Hw = p.H_top + p.H_slope, rbw = Lrs + p.L_crest + p.b_ext;
    const wall = [[0, yBT], [sCE, ySL], [sCE, yCT], [sRE, yCT], [sRE, 0], [rbw, 0], [rbw, yBT]];
    const s05 = [[0, yBT], [Lrs, ySL], [Lrs, yCT], [sCE, yCT], [sCE, ySL], [p.x_bk, yBT]];
    const th = y => (y >= yBT ? p.T_wall_top + p.T_wall_in * (yCT - y) / Hw : Tb);
    // 側牆（兩側）：側視多邊形 × 立面梯形厚度（沿高程 1 cm 條帶積分）
    let V1 = 0, Aup = 0, Adn = 0; for (let y = 0.5; y < yCT; y += 1) { const c = G87.chord(wall, y); V1 += c * th(y); if (y >= yBT) Aup += c; else Adn += c; }
    const As = G87.A(wall), Vw = 2 * V1 / 1e6, kIn = Math.hypot(1, p.T_wall_in / Hw), Fw = 2 * (As + Aup * kIn + Adn) / 1e4;
    // 鋼筋（原圖鋼筋表）
    const Hrn = p.H_base + p.H_slope + p.H_top, l1 = +((p.L_ramp - p.c_r1 + p.L_lap) / 100).toFixed(2), n1 = 2 * (Math.floor((Hrn - p.c_r2) / p.S_rebar) + 1), l2 = +((Hrn - p.c_r2) / 100).toFixed(2), n2 = 2 * Math.max(1, Math.floor((p.L_ramp - p.c_r1) / p.S_rebar));
    const w1 = p.uw * l1 * n1, w2 = p.uw * l2 * n2;
    // 土包袋：坡道每排（坡長 ÷ 袋寬×排距係數）× 通道寬可排袋數；上段全寬外展區
    const rampL = Math.hypot(sRE, p.H_slope), nRow = Math.max(5, Math.round(rampL / (p.W_bag * p.k_bag))), nCh = Math.max(1, Math.round(p.W_ch / p.W_bag)), nFull = Math.max(2, Math.round(Wt / p.W_bag)), nTopR = Math.max(1, Math.round(p.L_top_bag / (p.W_bag * p.k_bag)));
    const nBag = nRow * nCh + nFull * nTopR;
    // 既有護岸缺口扣除（護岸斷面 × 缺口寬 W_total）
    const Ad = G87.A(s05), Vd = Ad * Wt / 1e6, Fm = (Math.hypot(Lrs, p.H_slope) + p.H_top) * Wt / 1e4, Fp = (Math.hypot(sCE - p.x_bk, p.H_slope) + p.H_top) * Wt / 1e4, Rd = Vd * p.rbk_ded;
    const rows = [
      { k: 'conc', it: '210kgf/cm² 混凝土（側牆兩側）', u: 'm³', v: Vw, fx: `2 × 側視面積 ${f(As / 1e4, 3)} m² × 厚 ${p.T_wall_top}→${Tb} cm（沿高程積分）` },
      { k: 'form', it: '普通模板（側牆）', u: 'm²', v: Fw, fx: `2 × (外側 ${f(As / 1e4, 3)}＋內側 ${f(Aup / 1e4, 3)}×${f(kIn, 4)}（1:${f(Hw / Math.max(1e-6, p.T_wall_in), 1)} 斜面）＋${f(Adn / 1e4, 3)})` },
      { k: 'rb1', it: `①號 D${p.d_bar} 橫向鋼筋`, u: 'kg', v: w1, fx: `${p.uw}×${l1} m×${n1} 支（@${p.S_rebar} cm，原圖鋼筋表）` },
      { k: 'rb2', it: `②號 D${p.d_bar} 縱向鋼筋`, u: 'kg', v: w2, fx: `${p.uw}×${l2} m×${n2} 支（@${p.S_rebar} cm，原圖鋼筋表）` },
      { k: 'bag', it: '土包袋（坡道鋪底＋上段全寬外展）', u: '袋', v: nBag, fx: `坡道 ${nRow} 排×${nCh} 袋＋上段 ${nTopR} 排×${nFull} 袋`, dig: 0 },
      { k: 'dC', it: '既有護岸缺口扣除 210 混凝土', u: 'm³', v: -Vd, fx: `護岸斷面 ${f(Ad / 1e4, 4)} m² × 缺口寬 ${f(Wt / 100)} m` },
      { k: 'dFm', it: '既有護岸缺口扣除 造型模板（臨水面）', u: 'm²', v: -Fm, fx: `(斜面 ${f(Math.hypot(Lrs, p.H_slope) / 100, 3)}＋胸牆 ${f(p.H_top / 100)}) × ${f(Wt / 100)}` },
      { k: 'dFp', it: '既有護岸缺口扣除 普通模板（背面）', u: 'm²', v: -Fp, fx: `(背面 ${f(Math.hypot(sCE - p.x_bk, p.H_slope) / 100, 3)}＋${f(p.H_top / 100)}) × ${f(Wt / 100)}` },
      { k: 'dR', it: '既有護岸缺口扣除 鋼筋（估算）', u: 'kg', v: -Rd, fx: `${f(Vd, 3)} m³ × ${p.rbk_ded} kg/m³（原圖無扣除鋼筋明細，估算）` }];
    const d = { T_wall_bot: Tb, W_total: Wt, W_front_bot: p.W_ch + 2 * p.T_wall_in, L_rev_slope: Lrs, L_sec_total: sRE, H_sec_right: ySL, H_rebar_net: Hrn, H_wall_total: Hw,
      rebar1_len: l1, rebar1_cnt: n1, rebar1_wt: +w1.toFixed(2), rebar2_len: l2, rebar2_cnt: n2, rebar2_wt: +w2.toFixed(2), rebarTotalWt: +(w1 + w2).toFixed(2),
      sideWallConc: +Vw.toFixed(2), sideWallForm: +Fw.toFixed(2), dedFormPlain: +Fp.toFixed(2), dedFormMold: +Fm.toFixed(2), dedConc210: +Vd.toFixed(2), dedRebar: +Rd.toFixed(1), bagCount: nBag };
    return { p, d, rows, wall, s05, As, Vw, Fw, Wt, Lrs, sCE, sRE, yBT, ySL, yCT, Hw, Tb, rb: [{ bar: 'D' + p.d_bar, role: '①橫向', nb: n1, L: l1 * 100, kg: w1 }, { bar: 'D' + p.d_bar, role: '②縱向', nb: n2, L: l2 * 100, kg: w2 }] };
  }
