  /* ---- 幾何模型（cm）：x＝沿壩軸（左端 0 → 右端 L），y＝距翼段基礎頂向下；溢流段（中央）基礎頂低 H_drop ---- */
  function MODEL(p) {
    const f = G87.f, lPL = p.L_wingL + p.L_slpL, lPR = p.L_wingR + p.L_slpR, L = lPL + p.L_mid + lPR, pitch = p.B_H + p.S_clear;
    const nBays = Math.max(2, Math.floor((L - p.B_H) / pitch + 1e-9)), nBeams = nBays + 1, span = (nBeams - 1) * pitch + p.B_H, x0 = (L - span) / 2;
    const xW1 = p.L_wingL, xM1 = lPL, xM2 = lPL + p.L_mid, xW2 = xM2 + p.L_slpR, W = p.W_base, Hb = p.H_base, hL = Math.hypot(p.L_slpL, p.H_drop), hR = Math.hypot(p.L_slpR, p.H_drop);
    // 立面基礎：等垂直厚 H_base（斜坡段為平行四邊形）→ 立面積＝H_base×L；打底同理＝t_pc×L
    const Ael = Hb * L, Vfnd = W * Ael, Vpc = W * p.t_pc * L, Vc = (Vfnd + Vpc) / 1e6;
    const Af = (2 * Ael + 2 * W * Hb) / 1e4;   // 兩側面＋兩端面（打底不組模）
    const Lalong = p.L_wingL + p.L_wingR + p.L_mid + hL + hR, Wr = (p.w16 + p.w13) / (p.s_bar / 100) * (W / 100 * Lalong / 100 + Hb / 100 * L / 100);
    const Wh = p.w_H * (p.H_exp + p.H_emb) / 100 * nBeams, Wa = p.w_ang * p.L_ang_mm / 1000 * p.n_ang * nBays;
    // 疏伐木：依立面各格（兩端格 H_log3、跨斜坡轉折格 H_log2、其餘 H_log1）÷ 原木徑取整數根，每根長＝淨距＋兩端搭 L_log_add
    const mid = i => { const c = x0 + i * pitch + p.B_H / 2; return c >= xM1 - 15 && c <= xM2 + 15; };
    let nPc = 0, n1 = 0, n2 = 0, n3 = 0; const H = [];
    for (let i = 0; i < nBays; i++) { const end = i === 0 || i === nBays - 1, tr = mid(i) !== mid(i + 1), h = end ? p.H_log3 : tr ? p.H_log2 : p.H_log1, k = Math.ceil(h / p.D_log - 1e-9); H.push(h); nPc += k; if (end) n3++; else if (tr) n2++; else n1++; }
    const Lcut = (p.S_clear + p.L_log_add) / 100, Nlog = Math.ceil(nPc * Lcut / p.L_log_std - 1e-9);
    const str_conc = `${f(W / 100)}×${f(Hb / 100)}×${f(L / 100)}（立面等厚，斜坡段平行四邊形）＋打底 ${f(W / 100)}×${f(p.t_pc / 100)}×${f(L / 100)}`;
    const str_form = `2×${f(Hb / 100)}×${f(L / 100)}＋兩端 2×${f(W / 100)}×${f(Hb / 100)}`;
    const str_rebar = `(${p.w16}+${p.w13})/${f(p.s_bar / 100)}×(${f(W / 100)}×${f(Lalong / 100)}＋${f(Hb / 100)}×${f(L / 100)})`;
    const str_Hbeam = `${p.w_H}×${f((p.H_exp + p.H_emb) / 100)}×${nBeams}支`, str_angle = `${p.w_ang}×${f(p.L_ang_mm / 1000)}×${p.n_ang}×${nBays}格`;
    const str_logs = `(${n1}格×${Math.ceil(p.H_log1 / p.D_log - 1e-9)}＋${n2}格×${Math.ceil(p.H_log2 / p.D_log - 1e-9)}＋${n3}格×${Math.ceil(p.H_log3 / p.D_log - 1e-9)}＝${nPc}根)×${f(Lcut)}/${p.L_log_std} 取整`;
    const rows = [G87.row(1, '210kgf/cm²混凝土（含打底）', 'm³', Vc, str_conc, '依圖面幾何'), G87.row(2, '普通模板', 'm²', Af, str_form, '依圖面幾何'),
      G87.row(3, '鋼筋', 'kg', Wr, str_rebar, '原圖計算式（雙向 @s_bar，面積改依圖面）'), G87.row(4, `H型鋼 ${p.B_H * 10}×${p.B_H * 10}`, 'kg', Wh, str_Hbeam, `${nBeams} 支`, 0),
      G87.row(5, 'L型角鐵 90×90×6', 'kg', Wa, str_angle, ''), G87.row(6, `疏伐木（原木長 ${p.L_log_std} m）`, '支', Nlog, str_logs, `裁切 ${nPc} 根×${f(Lcut)} m`, 0)];
    const checks = [{ ok: x0 >= 0, text: `H型鋼 ${nBeams} 支 @${pitch} cm，兩端餘 ${f(x0, 1)} cm；壩長 ${f(L / 100)} m` },
      { ok: n2 >= 2, text: `疏伐木：一般格 ${n1}、轉折格 ${n2}、端格 ${n3}，共 ${nPc} 根` }];
    // 本系統視圖（m）：x 以溢流段中心為 0，z 以溢流段基礎頂為 0
    const xc = xM1 + p.L_mid / 2, X = x => (x - xc) / 100, Z = y => (p.H_drop - y) / 100, U = w => (w - W / 2) / 100, Gy = '#94a3b8', St = '#22d3ee';
    const top = [[0, 0], [xW1, 0], [xM1, p.H_drop], [xM2, p.H_drop], [xW2, 0], [L, 0]], bot = top.map(([x, y]) => [x, y + Hb]).reverse(), pcb = top.map(([x, y]) => [x, y + Hb + p.t_pc]).reverse();
    const elev = [G87.pv(top.concat(bot).map(([x, y]) => [X(x), Z(y)])), G87.pv(bot.slice().reverse().concat(pcb).map(([x, y]) => [X(x), Z(y)]), Gy, null)];
    const plan = [G87.pv([[U(0), X(0)], [U(W), X(0)], [U(W), X(L)], [U(0), X(L)]])], sect = [G87.pv([[U(0), Z(p.H_drop)], [U(W), Z(p.H_drop)], [U(W), Z(p.H_drop + Hb)], [U(0), Z(p.H_drop + Hb)]]), G87.pv([[U(0), Z(p.H_drop + Hb)], [U(W), Z(p.H_drop + Hb)], [U(W), Z(p.H_drop + Hb + p.t_pc)], [U(0), Z(p.H_drop + Hb + p.t_pc)]], Gy, null)];
    for (let i = 0; i < nBeams; i++) { const bx = x0 + i * pitch, yb = mid(i) ? p.H_drop : 0; elev.push(G87.pv([[X(bx), Z(yb - p.H_exp)], [X(bx + p.B_H), Z(yb - p.H_exp)], [X(bx + p.B_H), Z(yb + p.H_emb)], [X(bx), Z(yb + p.H_emb)]], St, null));
      plan.push(G87.pv([[U(W / 2 - p.B_H / 2), X(bx)], [U(W / 2 + p.B_H / 2), X(bx)], [U(W / 2 + p.B_H / 2), X(bx + p.B_H)], [U(W / 2 - p.B_H / 2), X(bx + p.B_H)]], St, 'rgba(34,211,238,0.25)')); }
    sect.push(G87.pv([[U(W / 2 - p.B_H / 2), Z(-p.H_exp + p.H_drop)], [U(W / 2 + p.B_H / 2), Z(-p.H_exp + p.H_drop)], [U(W / 2 + p.B_H / 2), Z(p.H_drop + p.H_emb)], [U(W / 2 - p.B_H / 2), Z(p.H_drop + p.H_emb)]], St, null));
    return { rows, checks, V: { plan, sect, elev }, q: { nBays, nBeams, L_total: L, pitch, nNormalBays: n1, L_cut_m: +Lcut.toFixed(2), V_conc: +Vc.toFixed(2), str_conc, A_form: +Af.toFixed(2), str_form, W_rebar: +Wr.toFixed(2), str_rebar, W_Hbeam: Math.round(Wh), str_Hbeam, W_angle: +Wa.toFixed(2), str_angle, N_logs: Nlog, str_logs },
      set: { L_total: L, xc, nBeams, nBays } };
  }
