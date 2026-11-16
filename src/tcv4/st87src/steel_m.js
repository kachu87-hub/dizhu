  /* ---- 幾何模型（cm）：正視 x（左端 0→右端 L）、y（格框頂下為正）；斷面寬 B(y) 依斷面圖折線；以 5 cm 帶狀積分 ---- */
  function MODEL(p) {
    const f = G87.f, x1 = p.L_wL, x2 = x1 + p.L_slpL, x3 = x2 + p.L_cribL, x4 = x3 + p.W_pier, x5 = x4 + p.L_cribR, x6 = x5 + p.L_slpR, L = x6 + p.L_wR;
    const HL = p.H_crestL + p.H_upperL, HR = p.H_crestR + p.H_upperR, yT = Math.max(HL, HR), y0L = yT - HL, y0R = yT - HR, yB = yT + p.H_crib, yS = yB + p.H_f1, yE = yS + p.H_f2;
    const xRef = p.L_wL + (x6 - x1) / 2 + p.dx_fnd, xFL = xRef - p.L_fndL, xFR = xRef + p.L_fndR, Bb = p.B_toe + p.B_fslp_D + p.B_fnd_body;
    const front = [[0, y0L], [x1, y0L + p.H_crestL], [x2, yT], [x5, yT], [x6, y0R + p.H_crestR], [L, y0R], [L, yT], [xFR, yS], [xFR, yE], [xFL, yE], [xFL, yS], [0, yT]];
    // 斷面：u＝自下游面（0）往上游；各側（L/R）冠部高不同 → 格框頂以上分側
    const xL3 = p.B_toe + p.B_fslp_D, xR3 = xL3 + p.B_mid2, sc = (p.B_mid2 - p.B_mid1) / 2, xL2 = xL3 + sc, xR2 = xR3 - sc;
    const prof = (Hc, Hu) => { const yy0 = yT - Hc - Hu, yy1 = yy0 + Hc; return { L: [[xR2 - p.B_top1, yy0], [xR2 - p.B_top2, yy1], [xL2, yT], [xL3, yB], [p.B_toe, yS]], R: [[xR2, yy0], [xR2, yT], [xR3, yB], [Bb, yS], [Bb, yE]] }; };
    const PL = prof(p.H_crestL, p.H_upperL), PRf = prof(p.H_crestR, p.H_upperR), xC = (x3 + x4) / 2;
    const at = (A, y) => { for (let i = 1; i < A.length; i++) { const a = A[i - 1], b = A[i]; if (y >= a[1] - 1e-9 && y <= b[1] + 1e-9) return b[1] === a[1] ? b[0] : a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); } return y < A[0][1] ? A[0][0] : A[A.length - 1][0]; };
    const uL = (S, y) => (y > yS ? 0 : at(S.L, y)), uR = (S, y) => at(S.R, y), Bw = (S, y) => uR(S, y) - uL(S, y);
    const dsl = (S, y, k) => { const e = 1; return Math.hypot(1, ((k === 'L' ? uL(S, y + e) - uL(S, y - e) : uR(S, y + e) - uR(S, y - e)) / (2 * e))); };
    const ivs = y => { const xs = []; for (let i = 0; i < front.length; i++) { const a = front[i], b = front[(i + 1) % front.length]; if ((a[1] - y) * (b[1] - y) < 0) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); } xs.sort((a, b) => a - b); const o = []; for (let i = 0; i + 1 < xs.length; i += 2) o.push([xs[i], xs[i + 1]]); return o; };
    const opn = y => (y > yT && y < yB ? [[x2 - p.k_crib * (y - yT), x3], [x4, x5 + p.k_crib * (y - yT)]] : []);
    const dy = 5; let Vc = 0, Vst = 0, Vsteel = 0, Af = 0, Ap = 0;
    for (let y = Math.min(y0L, y0R) + dy / 2; y < yE; y += dy) {
      const I = ivs(y); if (!I.length) continue; const O = opn(y);
      // 依 x 分左右兩側（格框頂以上各側冠部高不同）
      const seg = (a, b) => { const r = []; if (a < xC) r.push([a, Math.min(b, xC), PL]); if (b > xC) r.push([Math.max(a, xC), b, PRf]); return r; };
      I.forEach(([a, b]) => seg(a, b).forEach(([s, e, S]) => { let len = e - s; O.forEach(([oa, ob]) => { len -= Math.max(0, Math.min(e, ob) - Math.max(s, oa)); }); const B = Bw(S, y); Vc += len * B * dy; Af += len * (dsl(S, y, 'L') + (y > yS ? 1 : dsl(S, y, 'R'))) * dy; }));
      O.forEach(([oa, ob]) => { const S = oa < xC ? PL : PRf, B = Bw(S, y), w = ob - oa; Vst += w * Math.max(0, B - 2 * p.c_emb) * dy; Vsteel += w * Math.min(B, 2 * p.c_emb) * dy; Ap += B * dy * (1 + Math.hypot(1, p.k_crib)); });
    }
    Vc /= 1e6; Vst /= 1e6; Af = (Af + Ap) / 1e4;
    const Wsub = p.L_beam * p.w_beam * p.N_beam, Wtot = Wsub * (1 + p.k_loss / 100), Apaint = p.L_beam * p.a_paint * p.N_beam;
    const str_conc_line1 = `正視圖外框（含兩側斜坡、下部基礎 ${f((xFR - xFL) / 100)} m）× 斷面寬 B(y)（冠 ${f(p.B_top1 / 100)}→${f(p.B_top2 / 100)}→格框頂 ${f(p.B_mid1 / 100)}→底 ${f(p.B_mid2 / 100)}→基礎 ${f(Bb / 100)}）`;
    const str_conc_line2 = `沿高程每 ${dy} cm 積分，扣兩側格框開口（1:${p.k_crib} 斜擴）＝${Vc.toFixed(2)}m3`;
    const str_form = `上下游面（依斷面斜率實長）＋格框開口側面 ＝ ${Af.toFixed(2)}m2`;
    const str_stone = `格框開口 × (斷面寬−2×${p.c_emb}) 積分 ＝ ${Vst.toFixed(1)}m3`;
    const rows = [G87.row(1, '210kgf/cm²混凝土', 'm³', Vc, str_conc_line1 + '；' + str_conc_line2, '依圖面幾何'), G87.row(2, '軀體模板', 'm²', Af, str_form, '依圖面幾何'),
      G87.row(3, '填築 φ30～60cm 塊石', 'm³', Vst, str_stone, '依圖面幾何'), G87.row(4, 'H200×200×8×12 型鋼（含損耗）', 'kg', Wtot, `${p.L_beam}×${p.w_beam}×${p.N_beam} 支×(1＋${p.k_loss}%)`, '依原圖型鋼表'),
      G87.row(5, '鋼構造表面塗裝（一底二度）', 'm²', Apaint, `${p.L_beam}×${p.a_paint}×${p.N_beam}`, '依原圖型鋼表')];
    const checks = [{ ok: xFL >= 0 && xFR <= L, text: `下部基礎 ${f(xFL, 0)}～${f(xFR, 0)} cm（壩長 ${f(L, 0)} cm）` },
      { ok: Math.abs(p.L_beam * 100 - (Math.max(p.L_cribL, p.L_cribR) + 2 * p.L_emb)) < 1, text: `型鋼長 ${p.L_beam} m ↔ 格框淨寬 ${Math.max(p.L_cribL, p.L_cribR)}＋兩側埋入 2×${p.L_emb} cm` }];
    // 本系統視圖（m）：x 以中央隔墩中心為 0、z 以格框頂（溢流口）為 0；u 以斷面中心為 0（往下游為正）
    const X = x => (x - xC) / 100, Z = y => (yT - y) / 100, uc = Bb / 2, U = u => (uc - u) / 100, Gy = '#94a3b8', St = '#fbbf24';
    const elev = [G87.pv(front.map(([x, y]) => [X(x), Z(y)])), G87.pv([[X(x2), Z(yT)], [X(x3), Z(yT)], [X(x3), Z(yB)], [X(x2 - p.k_crib * p.H_crib), Z(yB)]], St, 'rgba(251,191,36,0.10)'), G87.pv([[X(x4), Z(yT)], [X(x5), Z(yT)], [X(x5 + p.k_crib * p.H_crib), Z(yB)], [X(x4), Z(yB)]], St, 'rgba(251,191,36,0.10)'), G87.pv([[X(xFL), Z(yS)], [X(xFR), Z(yS)]], Gy, null, true, false)];
    const S = PRf, sp = S.L.concat([[0, yS], [0, yE]]).concat(S.R.slice().reverse());
    const sect = [G87.pv(sp.map(([u, y]) => [U(u), Z(y)])), G87.pv([[U(xL2), Z(yT)], [U(xR2), Z(yT)], [U(xR3), Z(yB)], [U(xL3), Z(yB)]], St, 'rgba(251,191,36,0.10)')];
    const pl = (u0, u1, xa, xb, c, fl) => G87.pv([[U(u0), X(xa)], [U(u1), X(xa)], [U(u1), X(xb)], [U(u0), X(xb)]], c, fl);
    const plan = [G87.pv([[U(0), X(x1)], [U(0), X(x6)], [U(uc - p.B_top2 / 2), X(L)], [U(uc + p.B_top2 / 2), X(L)], [U(Bb), X(x6)], [U(Bb), X(x1)], [U(uc + p.B_top2 / 2), X(0)], [U(uc - p.B_top2 / 2), X(0)]]), pl(xL2, xR2, x2, x3, St, 'rgba(251,191,36,0.12)'), pl(xL2, xR2, x4, x5, St, 'rgba(251,191,36,0.12)')];
    const H_total = yE - Math.min(y0L, y0R);
    return { rows, checks, V: { plan, sect, elev },
      q: { L_total: L, xFndL: xFL, xFndR: xFR, L_fnd: Math.round(xFR - xFL), B_base: Bb, H_total, diagL: Math.round(Math.hypot(Math.max(0, xFL), yS - yT)), diagR: Math.round(Math.hypot(Math.max(0, L - xFR), yS - yT)),
        V_stone: +Vst.toFixed(1), str_stone, V_conc: +Vc.toFixed(2), str_conc_line1, str_conc_line2, A_form: +Af.toFixed(2), str_form, W_steel_sub: +Wsub.toFixed(1), W_steel_tot: +Wtot.toFixed(2), A_paint_tot: +Apaint.toFixed(2) },
      set: { L_total: L, xC, yT, H_total, B_base: Bb, Hdn: yE - yT } };
  }
