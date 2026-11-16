  /* ---- 幾何模型（cm）：x＝沿截水溝軸（集水井外緣 0 → 溝末端），y＝距路面向下，w＝垂直溝軸（溝中心 0） ---- */
  function MODEL(p) {
    const f = G87.f, t = p.t_wall, B = p.B_ch, Wo = B + 2 * t, Wp = p.W_pit + 2 * t, Lp = p.L_pit + p.L_neck, Dp = p.H_pit - p.H_curb;
    const xG = Lp - p.t_curb, xStep = t + Math.round((p.L_pit - t) * p.k_step), xCi = Lp + p.L_bot, xEnd = Math.max(xG + p.L_top, xCi + p.t_end), tEnd = xEnd - xCi;
    const Hx = x => p.H_chL + (p.H_chR - p.H_chL) * (x - xG) / Math.max(1, xCi - xG), H0 = Hx(Lp), H1 = p.H_chR;
    // 集水井：外框 − 井內空間（深區 t→xStep 至井底、淺區 xStep→xG 至溝底高）
    const Vpo = Lp * Wp * Dp, Vpi = p.W_pit * ((xStep - t) * (Dp - p.t_bot) + Math.max(0, xG - xStep) * p.H_chL), Vpit = Vpo - Vpi;
    // 溝身（x＝Lp→xCi，深度線性 H0→H1）＋端牆
    const Lc = xCi - Lp, Hm = (H0 + H1) / 2, Vch = Lc * (Wo * (Hm + p.t_bot) - B * Hm), Vend = tEnd * Wo * (H1 + p.t_bot);
    // 塊狀護欄 2 座（長＝(井外寬−溝寬)/2，高 H_curb，厚 t_curb）
    const Lcb = (Wp - B) / 2, Vcb = 2 * Lcb * p.H_curb * p.t_curb, Vc = (Vpit + Vch + Vend + Vcb) / 1e6;
    // 模板：溝身內外側面、端牆內外面、井外 4 面與井內壁、護欄四側
    const Ach = 2 * Lc * (Hm + p.t_bot) + 2 * Lc * Hm, Aend = Wo * (H1 + p.t_bot) + B * H1, Apo = 2 * (Lp + Wp) * Dp - Wo * (H0 + p.t_bot);
    const Api = 2 * ((xStep - t) + p.W_pit) * (Dp - p.t_bot) + 2 * (Math.max(0, xG - xStep) + p.W_pit) * p.H_chL - B * H0, Acb = 2 * (2 * Lcb + 2 * p.t_curb) * p.H_curb;
    const Af = (Ach + Aend + Apo + Api + Acb) / 1e4;
    const nG = Math.max(1, Math.round(p.L_top / p.S_grate)), wG = p.w_cover + p.w_frame, Wr = Vc * p.rbk;
    // 開挖（路面以下外框，四周各加工作寬 b_ex，垂直開挖）、回填＝開挖−結構外框
    const be = p.b_ex, Vo = Vpo + Lc * Wo * (Hm + p.t_bot) + Vend, Vex = ((Lp + 2 * be) * (Wp + 2 * be) * (Dp + be) + Lc * (Wo + 2 * be) * (Hm + p.t_bot + be) + (tEnd + be) * (Wo + 2 * be) * (H1 + p.t_bot + be)) / 1e6, Vbf = Math.max(0, Vex - Vo / 1e6);
    const rows = [
      G87.row(1, `${p.fc}kgf/cm²混凝土`, 'm³', Vc, `集水井 ${f(Vpit / 1e6, 3)}（外框 ${f(Lp / 100)}×${f(Wp / 100)}×${f(Dp / 100)}－井內）＋溝身 ${f(Vch / 1e6, 3)}（長 ${f(Lc / 100)}、溝深 ${f(H0, 1)}→${f(H1, 1)}）＋端牆 ${f(Vend / 1e6, 3)}＋護欄 2 座 ${f(Vcb / 1e6, 3)}`, '依圖面幾何'),
      G87.row(2, '普通模板', 'm²', Af, `溝身內外側 ${f(Ach / 1e4)}＋端牆 ${f(Aend / 1e4)}＋井外 ${f(Apo / 1e4)}＋井內 ${f(Api / 1e4)}＋護欄 ${f(Acb / 1e4)}`, '底面、頂面不組模'),
      G87.row(3, '鋼筋（含損耗，估算）', 'kg', Wr, `混凝土 ${f(Vc, 3)} m³ × ${p.rbk} kg/m³`, '原圖無鋼筋表，以 kg/m³ 估算'),
      G87.row(4, `TGB-60 鍍鋅格柵板（蓋 ${p.w_cover}＋框 ${p.w_frame} kg）`, '組', nG, `格柵長 ${p.L_top} cm ÷ 每組 ${p.S_grate} cm，取整數`, `共 ${f(nG * wG, 1)} kg`, 0),
      G87.row(5, '挖方', 'm³', Vex, `路面以下結構外框四周各加工作寬 ${be} cm（垂直開挖）`, '依圖面幾何'),
      G87.row(6, '填方', 'm³', Vbf, `挖方 ${f(Vex, 3)} − 結構外框 ${f(Vo / 1e6, 3)}`, '依圖面幾何')];
    const checks = [
      { ok: xG + p.L_top <= xEnd + 1e-6 && xCi + p.t_end <= xEnd + 1e-6, text: `格柵 ${p.L_top} cm、溝內淨長 ${p.L_bot} cm、端牆 ${f(tEnd, 0)} cm（總長 ${f(xEnd, 0)} cm）` },
      { ok: p.H_chL >= p.H_chR, text: `溝深 ${p.H_chL}→${p.H_chR} cm（往集水井加深，縱坡 ${f((p.H_chL - p.H_chR) / Math.max(1, xCi - xG) * 100, 1)}%）` },
      { ok: Dp - p.t_bot > p.H_chL, text: `集水井內底比溝底低 ${f(Dp - p.t_bot - p.H_chL, 0)} cm（沉砂、消能）` }];
    // 本系統視圖（m）：x 以路面中心（溝軸上，距集水井外緣 Lp＋L_bot/2）為 0；z 以路面為 0；u 沿道路（垂直溝軸）
    const xc = Lp + p.L_bot / 2, X = x => (x - xc) / 100, Z = y => -y / 100, U = w => w / 100, W = '#ffffff', Gy = '#94a3b8', Cy = '#22d3ee';
    const elev = [G87.pv([[X(0), Z(0)], [X(0), Z(Dp)], [X(Lp), Z(Dp)], [X(Lp), Z(H0 + p.t_bot)], [X(xEnd), Z(H1 + p.t_bot)], [X(xEnd), Z(0)], [X(xG), Z(0)], [X(xG), Z(-p.H_curb)], [X(xG - p.t_curb), Z(-p.H_curb)], [X(xG - p.t_curb), Z(0)]]),
      G87.pv([[X(t), Z(0)], [X(t), Z(Dp - p.t_bot)], [X(xStep), Z(Dp - p.t_bot)], [X(xStep), Z(p.H_chL)], [X(xCi), Z(H1)], [X(xCi), Z(0)]], Cy, 'rgba(34,211,238,0.10)'), G87.pv([[X(xG), Z(0)], [X(xCi), Z(0)]], Cy, null, false, false)];
    const sect = [G87.pv([[U(-Wo / 2), Z(0)], [U(-Wo / 2), Z(Hm + p.t_bot)], [U(Wo / 2), Z(Hm + p.t_bot)], [U(Wo / 2), Z(0)], [U(B / 2), Z(0)], [U(B / 2), Z(Hm)], [U(-B / 2), Z(Hm)], [U(-B / 2), Z(0)]]), G87.pv([[U(-B / 2), Z(0)], [U(B / 2), Z(0)]], Cy, null, false, false)];
    const P2 = (u0, u1, x0, x1, c, fl) => G87.pv([[U(u0), X(x0)], [U(u1), X(x0)], [U(u1), X(x1)], [U(u0), X(x1)]], c, fl);
    const plan = [P2(-Wp / 2, Wp / 2, 0, Lp), P2(-Wo / 2, Wo / 2, Lp, xEnd), P2(-B / 2, B / 2, xG, xG + p.L_top, Cy, 'rgba(34,211,238,0.12)'), P2(-Wp / 2, -B / 2, xG - p.t_curb, xG, Gy, 'rgba(148,163,184,0.25)'), P2(B / 2, Wp / 2, xG - p.t_curb, xG, Gy, 'rgba(148,163,184,0.25)')];
    return { rows, checks, V: { plan, sect, elev }, q: { nGrates: nG, grateWeightEach: wG, grateTotalKg: +(nG * wG).toFixed(1), V_conc_site: +Vc.toFixed(2), A_form_site: +Af.toFixed(2), W_rebar_site: +Wr.toFixed(2), V_exc_site: +Vex.toFixed(2), V_fill_site: +Vbf.toFixed(2) },
      set: { L_tot: xEnd, xc, Dp, Wo, Wp }, Vc, Vex, Vbf };
  }
