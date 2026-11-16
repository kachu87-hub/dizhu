  /* ---- 幾何模型（cm，原工具座標：x＝基礎前緣 0、往岸側為負；y＝計畫河床 0 向上） ---- */
  function MODEL(p) {
    p = Object.assign({}, __D87, p); const f = G87.f, a = p.tiltDeg * Math.PI / 180, cA = Math.cos(a), sA = Math.sin(a), N = Math.max(1, Math.round(p.N_layer));
    const yBot = -p.H_fnd_sub, yLB = yBot + p.H_lower_stem, yLT = yLB + p.H_ledge, xS = -p.W_stem_bot, xL = xS - p.W_ledge, xCB = -p.W_toe_berm, xCT = xCB - p.dx_curb, xCTL = xCT - p.W_curb_top, yC = p.H_curb;
    const fnd = [[xS, yBot], [0, yBot], [0, 0], [xCB, 0], [xCT, yC], [xCTL, yC], [xS, yLT], [xL, yLT], [xL, yLB], [xS, yLB]];
    const pc = [[xS - p.pc_ext, yBot - p.pc_t], [p.pc_ext, yBot - p.pc_t], [p.pc_ext, yBot], [xS - p.pc_ext, yBot]];
    const u = [cA, -sA], nn = [sA, cA], BR0 = [xS, yLT], BL0 = [BR0[0] - p.W_box * u[0], BR0[1] - p.W_box * u[1]], boxes = [];
    for (let i = 0; i < N; i++) { const b0 = [BL0[0] + i * (p.H_box * nn[0] - p.W_step * u[0]), BL0[1] + i * (p.H_box * nn[1] - p.W_step * u[1])], b1 = [b0[0] + p.W_box * u[0], b0[1] + p.W_box * u[1]];
      boxes.push([b0, b1, [b1[0] + p.H_box * nn[0], b1[1] + p.H_box * nn[1]], [b0[0] + p.H_box * nn[0], b0[1] + p.H_box * nn[1]]]); }
    const top = boxes[N - 1], TR = top[2], TL = top[3];
    // 單一植生塊（原圖數量表：外框−內空＋4 角內導角；鋼模＝內外側面＋頂面）
    const Le = (p.B_box - p.gap_box) / 100, We = p.W_box / 100, He = p.H_box / 100, Bi = Math.max(20, p.B_box - p.gap_box - 2 * p.t_wall_L) / 100, Wi = Math.max(20, p.W_box - 2 * p.t_wall_W) / 100, c = p.c_in / 100, r2 = Math.SQRT2;
    const Vin = Bi * Wi * He, Vch = 0.5 * c * c * He * 4, Vrc = Le * We * He - Vin + Vch, Vfill = Vin - Vch;
    const wE = p.t_wall_L / 100, wMo = (p.W_box - 2 * p.t_wall_L - 2 * p.c_in) / 100, bMo = (Bi * 100 - 2 * p.c_in) / 100, wSo = (Wi * 100 - 2 * p.c_in) / 100;
    const Af = Le * He * 2 + (wE * 2 + c * r2 * 2 + wMo) * He * 2 + (bMo * 2 + wSo * 2 + c * r2 * 4) * He + Le * We;
    const uw = ({ 10: p.w10, 13: p.w13, 16: p.w16 })[p.d_rebar] || p.w10, sL = p.B_box / 120, sW = p.W_box / 90, sH = p.H_box / 60;
    const RB = [[1, p.rb_l1 * (sW + sH) / 2, p.rb_n1, '約4.5', 'ㄇ型 50/75/50', '-'], [2, p.rb_l2 * (sL + sW) / 2, p.rb_n2, '約2.5', '環箍 85x75 (30)', '鋼筋搭接長30cm須錨縫'], [3, p.rb_l3 * (sL + sH) / 2, p.rb_n3, '約5', 'ㄇ型 50/85/50', '-'],
      [4, p.rb_l4 * (sL + sH) / 2, p.rb_n4, '-', '斜筋', 'y對角斜鋼筋兩側各一支'], [5, p.rb_l5 * (sW + sH) / 2, p.rb_n5, '-', '斜筋', 'x對角斜鋼筋兩側各一支']]
      .map(([id, len, cnt, spacing, shape, note]) => { len = +len.toFixed(2); cnt = Math.round(cnt); return { id, dia: p.d_rebar, uw, spacing, len, count: cnt, weight: +(uw * len * cnt).toFixed(2), shape, note }; });
    const Wrb = RB.reduce((s, r) => s + r.weight, 0);
    // 每公尺（沿護岸）：塊數＝層數×100/B_box（實際依段長取整數）；基礎、打底依斷面面積
    const Afnd = G87.A(fnd) / 1e4, Apc = G87.A(pc) / 1e4, nb = N * 100 / p.B_box;
    const Lform = p.H_fnd_sub + Math.hypot(p.dx_curb, p.H_curb) + p.H_ledge + p.W_ledge + p.H_lower_stem;
    const Q = { box: nb, boxV: nb * Vrc, form: nb * Af, rb: nb * Wrb, fill: nb * Vfill, bolt: nb * p.n_bolt, fnd: Afnd, fndF: Lform / 100, fndR: Afnd * p.rbk_fnd, pc: Apc, bag: p.n_bag };
    const zTop = Math.max(TR[1], TL[1]), H = zTop, D = p.H_fnd_sub + p.pc_t;
    const d = { H_above_bed: +zTop.toFixed(1), L_eff_m: +Le.toFixed(3), W_eff_m: We, H_eff_m: He, B_in_m: +Bi.toFixed(3), W_in_m: +Wi.toFixed(3), c_in_m: c, V_rc: +Vrc.toFixed(2), A_form: +Af.toFixed(2), rebars: RB, W_rebar_total: +Wrb.toFixed(2), V_fill: +Vfill.toFixed(2),
      areaFndM2: +Afnd.toFixed(3), f_rc_str: `${f(Le, 3)}*${f(We)}*${f(He)}-${f(Bi, 3)}*${f(Wi, 3)}*${f(He)}+0.5*${f(c)}*${f(c)}*${f(He)}*4`, f_fill_str: `${f(Bi, 3)}*${f(Wi, 3)}*${f(He)}-0.5*${f(c)}*${f(c)}*${f(He)}*4`,
      f_form_str: `${f(Le, 3)}*${f(He)}*2+(${f(wE)}*2+${f(c)}*√2*2+${f(wMo)})*${f(He)}*2+(${f(bMo)}*2+${f(wSo)}*2+${f(c)}*√2*4)*${f(He)}+${f(Le, 3)}*${f(We)}` };
    return { p, N, fnd, pc, boxes, TR, TL, zTop, H, D, Q, d, Vrc, Vfill, Af, Wrb, Lform };
  }
