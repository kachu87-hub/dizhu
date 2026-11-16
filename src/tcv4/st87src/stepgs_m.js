  /* ---- 幾何模型（cm）：沿原圖錨點，x＝順水流反向（0＝既有固床工斜坡趾，下游為 −x），y＝自基礎底向上 ---- */
  function STEPG(p) {
    const n = Math.max(2, Math.round(p.N_tiers)), topWallX = p.B_slp - p.t_top, yL = [0, p.H_s1];
    for (let i = 2; i <= n; i++) yL.push(yL[yL.length - 1] + (i === 2 ? p.H_s2 : p.H_s3));
    const yTop = yL[n] + p.H_top, xR = [-p.W_base];
    for (let i = 1; i < n; i++) xR.push(topWallX - (n - i) * p.S_w);
    xR.push(topWallX);
    // 本體外框：階梯面 → 頂部胸牆 → 背面沿既有固床工斜坡 (B_slp, H_back) 回到錨點（原工具少畫此段，補上）
    const outer = [[0, 0], [-p.W_base, 0]];
    for (let i = 0; i < n; i++) { outer.push([xR[i], yL[i + 1]]); outer.push([xR[i + 1], yL[i + 1]]); }
    outer.push([topWallX, yTop], [p.B_slp, yTop]); if (yTop > p.H_back) outer.push([p.B_slp, p.H_back]);
    const xb = p.B_slp, part = [[0, 0], [-p.W_base, 0]];
    for (let i = 0; i < n; i++) { const yt = i === n - 1 ? yTop : yL[i + 2], yf = yt - p.D_pool; part.push([xR[i], yt], [xR[i] + p.t_wall, yt], [xR[i] + p.t_wall, yf], [xR[i + 1], yf]); }
    part.push([topWallX, yTop], [xb + p.key_a, yTop], [xb + p.key_a, yTop - 70], [xb + p.key_a - 30, yTop - 70], [xb + p.key_a - 30, yTop - 50], [xb + 15, yTop - 50]);
    return { n, topWallX, yL, yTop, xR, outer, part };
  }
  function MODEL(p) {
    const f = G87.f, g = STEPG(p), n = g.n, nB = Math.max(3, Math.round(p.N_bay)), nP = nB - 1, Lm = p.L_net / 100, tw = p.t_wall / 100, Wt = p.L_net + 2 * p.t_wall;
    const A_step = G87.A(g.outer) / 1e4, A_part = G87.A(g.part) / 1e4;
    // 側牆：下部梯形（底 W_base → 中 W_base＋k_sw×H_sw1）＋上部梯形（中 → 頂 W_swTop），上部高隨層數加高
    const h1 = p.H_sw1, h2 = p.H_sw2 + (n - 3) * p.H_s3, wMid = p.W_base + p.k_sw * h1, A_sw = ((p.W_base + wMid) * h1 / 2 + (wMid + p.W_swTop) * h2 / 2) / 1e4;
    const A_key = ((p.key_a + p.key_b + p.key_c) * p.key_h / 2 + p.key_c * p.key_t) / 1e4;
    // 隔板：A~C 梯形（寬 w_baf，左高＝右高＋dh）；D~F 下緣內縮 k_notch×h 的缺角梯形（多邊形面積）
    const r = 8 / p.slope_inv, H3 = [p.h_bA, p.h_bB, p.h_bC], DH = [p.dh_D, p.dh_E, p.dh_F];
    const Aabc = H3.map(h => ((h + Math.round(10 * r)) + h) / 2 * p.w_baf / 1e4);
    const Adef = H3.map((h, i) => { const wT = p.w_bafB + p.k_notch * h; return G87.A([[0, 0], [0, h + Math.round(DH[i] * r)], [wT, h], [p.w_bafB, 0]]) / 1e4; });
    // 每道隔牆每層一塊隔板：第 1、2、3 層依序 A、B、C（D、E、F），超過 3 層者同 C（F）；一道隔牆用 D~F，其餘 nP−1 道用 A~C
    const sumT = a => { let s = 0; for (let i = 0; i < n; i++) s += a[Math.min(i, 2)]; return s; }, sABC = sumT(Aabc), sDEF = sumT(Adef), nW_abc = Math.max(1, nP - 1);
    const Vbaf = (sABC * nW_abc + sDEF) * tw;
    const Vc = A_step * Lm + A_sw * tw * 2 + Vbaf + A_part * tw * nP + A_key * p.key_w / 100 * p.N_key;
    const Aord = A_sw * 2 * 2 + A_part * nP + A_key * 2 + (sABC * nW_abc + sDEF) * 2 + p.key_w / 100 * p.key_f / 100 * p.N_key;
    const ts = n / 3, Aart = A_part * nP + p.H_top / 100 * Lm * 2 + p.f_art1 / 100 * ts * Lm + p.f_art2 / 100 * ts * Lm;
    const Wr = Vc * p.rbk, sp = p.s_bar / 100, Nd = Math.round(Lm / sp * p.n_dowel);
    const lap = p.L_apron / 100, AsL = (p.W_stL_up + p.W_stL) / 200 * lap * p.k_apL, AsR = (p.W_stR_up + p.W_stR) / 200 * lap * p.k_apR;
    const str_conc = `階梯 ${f(A_step)}×${f(Lm)}＋側牆 ${f(A_sw)}×${f(tw)}×2＋隔板 (${f(sABC)}×${nW_abc}＋${f(sDEF)})×${f(tw)}＋隔牆 ${f(A_part)}×${f(tw)}×${nP}＋連接榫 ${f(A_key)}×${f(p.key_w / 100)}×${p.N_key}`;
    const str_ord = `側牆 ${f(A_sw)}×2×2＋隔牆 ${f(A_part)}×${nP}＋榫側 ${f(A_key)}×2＋隔板 (${f(sABC)}×${nW_abc}＋${f(sDEF)})×2＋榫端 ${f(p.key_w / 100)}×${f(p.key_f / 100)}×${p.N_key}`;
    const str_art = `隔牆 ${f(A_part)}×${nP}＋胸牆 ${f(p.H_top / 100)}×${f(Lm)}×2＋${f(p.f_art1 / 100 * ts)}×${f(Lm)}＋${f(p.f_art2 / 100 * ts)}×${f(Lm)}`;
    const rows = [G87.row(1, `${p.fc}kgf/cm²混凝土`, 'm³', Vc, str_conc, '依圖面幾何（多邊形面積）'), G87.row(2, '普通模板', 'm²', Aord, str_ord, '依圖面幾何'), G87.row(3, '造型模板', 'm²', Aart, str_art, '階梯面高度係數 f_art1、f_art2 依原圖'),
      G87.row(4, '鋼筋（估算）', 'kg', Wr, `混凝土 ${f(Vc, 3)} m³ × ${p.rbk} kg/m³`, '以 kg/m³ 估算（預設＝原圖鋼筋量÷原圖混凝土）'), G87.row(5, '植筋', '孔', Nd, `${f(Lm)}/${f(sp)}×${p.n_dowel}，取整數`, '', 0),
      G87.row(6, '漿排塊石護坦（左岸）', 'm²', AsL, `(${p.W_stL_up}+${p.W_stL})/200×${f(lap)}×${p.k_apL}`, `底層混凝土 t=${p.t_pc} cm`), G87.row(7, '漿排塊石護坦（右岸）', 'm²', AsR, `(${p.W_stR_up}+${p.W_stR})/200×${f(lap)}×${p.k_apR}`, `底層混凝土 t=${p.t_pc} cm`)];
    const checks = [{ ok: g.xR.every((x, i) => i === 0 || x > g.xR[i - 1]), text: `${n} 層階梯，踏步 ${p.S_w} cm、基礎底寬 ${p.W_base} cm、頂高 ${g.yTop} cm` },
      { ok: g.yTop >= p.H_back, text: `胸牆頂 ${g.yTop} cm ≥ 既有固床工結合高 ${p.H_back} cm` }, { ok: p.D_pool < p.H_s2 + p.H_s3, text: `橫向 ${nB} 格、隔牆 ${nP} 道、全寬 ${Wt} cm` }];
    // 本系統視圖（m）：u＝順水流（上游→下游為正，以底寬中點為 0），z 以胸牆頂為 0，x＝橫向（中心 0）
    const uc = (p.B_slp - p.W_base) / 2, U = x => -(x - uc) / 100, Z = y => (y - g.yTop) / 100, X = w => (w - Wt / 2) / 100, Gy = '#94a3b8';
    const sect = [G87.pv(g.outer.map(([x, y]) => [U(x), Z(y)])), G87.pv([[U(0), Z(0)], [U(p.B_slp), Z(p.H_back)], [U(p.B_slp + p.key_a), Z(p.H_back)], [U(p.B_slp + p.key_a), Z(0)]], Gy, null, true)];
    const Lp = n * p.S_w + p.t_top, u0 = U(g.topWallX + p.t_top), plan = [G87.pv([[u0, X(0)], [u0 + Lp / 100, X(0)], [u0 + Lp / 100, X(Wt)], [u0, X(Wt)]])];
    for (let i = 1; i <= nP; i++) { const w = p.t_wall + i * (p.L_net - nP * p.t_wall) / nB + (i - 0.5) * p.t_wall; plan.push(G87.pv([[u0, X(w)], [u0 + Lp / 100, X(w)]], Gy, null, false, false)); }
    for (let i = 1; i < n; i++) { const u = u0 + (p.t_top + i * p.S_w) / 100; plan.push(G87.pv([[u, X(0)], [u, X(Wt)]], Gy, null, false, false)); }
    const elev = [G87.pv([[X(0), Z(0)], [X(Wt), Z(0)], [X(Wt), Z(g.yTop)], [X(0), Z(g.yTop)]])];
    g.yL.slice(1).forEach(y => elev.push(G87.pv([[X(p.t_wall), Z(y)], [X(Wt - p.t_wall), Z(y)]], Gy, null, false, false)));
    return { rows, checks, V: { plan, sect, elev },
      q: { A_step: +A_step.toFixed(2), A_sidewall: +A_sw.toFixed(2), A_key: +A_key.toFixed(2), A_part: +A_part.toFixed(2), wMidM: +(wMid / 100).toFixed(2),
        A_baffleA: Aabc[0], A_baffleB: Aabc[1], A_baffleC: Aabc[2], A_baffleD: Adef[0], A_baffleE: Adef[1], A_baffleF: Adef[2], A_stone_L: +AsL.toFixed(2), A_stone_R: +AsR.toFixed(2),
        V_conc: +Vc.toFixed(2), str_conc, A_form_ord: +Aord.toFixed(2), str_form_ord: str_ord, A_form_art: +Aart.toFixed(2), str_form_art: str_art, W_rebar: +Wr.toFixed(2), str_rebar: `${f(Vc, 3)}×${p.rbk}（估算）`, N_dowel_total: Nd, str_dowel: `${f(Lm)}/${f(sp)}×${p.n_dowel}` },
      set: { W_total_cm: Wt, yTop: g.yTop, D_total: p.W_base + p.B_slp } };
  }
