  /* ---- 本系統介面：參數、圖元轉換、視圖（m）、數量表 ---- */
  let RR = null;
  const g = k => { const v = RR && RR[k] !== undefined && RR[k] !== null && RR[k] !== '' ? RR[k] : DEF[k]; return v; }, n = k => { const v = parseFloat(g(k)); return Number.isFinite(v) ? v : parseFloat(DEF[k]); };
  function getParams() {
    const P = {}; PR.forEach(q => { if (!q.opt) P[q.k.slice(2)] = n(q.k); });
    P.N_pier = Math.max(1, Math.round(P.N_pier));
    const ph = RR && Array.isArray(RR.__ph) ? RR.__ph.map(Number).filter(v => v > 0) : [];
    P.pierHeights = Array.from({ length: P.N_pier }, (_, i) => ph[i] !== undefined ? ph[i] : (i === 0 || i === P.N_pier - 1 ? P.H_lower : P.H_upper));
    if (P.N_pier === 1 && ph[0] === undefined) P.pierHeights = [P.H_lower];
    return P;
  }
  function toO(prims, LC) {
    const O = [], col = l => LC[l] || '#ffffff', dsh = b => (b ? [14, 9] : []);
    prims.forEach(o => {
      if (o.type === 'LINE') O.push({ k: 'L', p: [[o.x1, o.y1], [o.x2, o.y2]], c: col(o.layer), w: o.lineWidth || 1.4, d: dsh(o.dashed), ly: o.layer });
      else if (o.type === 'POLY') O.push({ k: 'P', p: o.pts.map(q => [q[0], q[1]]), c: col(o.layer), w: o.lineWidth || 1.4, f: o.fill || null, cl: !!o.closed, d: dsh(o.dashed), ly: o.layer });
      else if (o.type === 'CIRCLE') O.push({ k: 'C', x: o.cx, y: o.cy, r: o.r, c: col(o.layer), f: o.filled ? col(o.layer) : null, w: 1, ly: o.layer });
      else if (o.type === 'TEXT') O.push({ k: 'T', x: o.x, y: o.y, s: String(o.text), h: o.size, c: col(o.layer), al: o.align || 'center', bl: 'middle', rot: (o.angleDeg || 0) * Math.PI / 180, ly: '文字' });
    });
    return O;
  }
  function hostViews(P, d) {
    const q = d.__q, Hd = P.H_lower + P.H_upper, r = P.H_wing_rise, B = d.B_base, xC = q.xWeirL + d.W_weir / 2, L = d.L_total;
    const X = x => (x - xC) / 100, Zf = z => (z - P.H_lower) / 100, U = s => (s - B / 2) / 100;
    const out = { plan: [], sect: [], elev: [] }, W = '#ffffff', Gy = '#94a3b8', St = '#fbbf24';
    const poly = (A, p, c, f, dd, cl) => A.push({ p, cl: cl !== false, c: c || W, f: f === undefined ? 'rgba(255,255,255,0.05)' : f, d: !!dd });
    const xBL = P.W_cut_L, xBR = L - P.W_cut_R, xWgL = P.W_wing_L, xWgR = L - P.W_wing_R;
    // 正視（x, z）
    const E = (x, z) => [X(x), Zf(z)];
    poly(out.elev, [E(xBL, 0), E(xBR, 0), E(xBR, -P.T_base - P.D_key), E(xBL, -P.T_base - P.D_key)]);
    if (P.D_key > 0) out.elev.push({ p: [E(xBL, -P.T_base), E(xBR, -P.T_base)], cl: false, c: Gy, f: null, d: true });
    poly(out.elev, [E(xBL, 0), E(0, Hd), E(0, Hd + r), E(xWgL, Hd), E(q.xWeirL, P.H_lower), E(q.xSlitL, P.H_lower), E(q.xSlitL, 0)]);
    poly(out.elev, [E(q.xSlitR, 0), E(q.xSlitR, P.H_lower), E(q.xWeirR, P.H_lower), E(xWgR, Hd), E(L, Hd + r), E(L, Hd), E(xBR, 0)]);
    let cx = q.xSlitL; d.pierHeights.forEach(h => { cx += P.W_slot; poly(out.elev, [E(cx, 0), E(cx + P.W_pier, 0), E(cx + P.W_pier, h), E(cx, h)]); cx += P.W_pier; });
    // 順水流斷面（u, z）：s＝距上游底緣
    const S = (s, z) => [U(s), Zf(z)], sU = z => z * P.S_up;
    const kt = d.B_key_top, kbU = (kt - P.B_key_bot) / 2;
    poly(out.sect, [S(0, 0), S(B, 0), S(B, -P.T_base), S(kt, -P.T_base)].concat(P.D_key > 0 ? [S(kbU + P.B_key_bot, -P.T_base - P.D_key), S(kbU, -P.T_base - P.D_key)] : [S(0, -P.T_base)]).concat([S(0, -P.T_base)]));
    poly(out.sect, [S(0, 0), S(B, 0), S(B - P.H_lower * P.S_dn, P.H_lower), S(sU(P.H_lower), P.H_lower)]);
    out.sect.push({ p: [S(sU(P.H_lower), P.H_lower), S(sU(Hd), Hd), S(sU(Hd + r), Hd + r), S(sU(Hd + r) + P.B_wing_top, Hd + r), S(sU(Hd) + P.B_weir_top, Hd), S(B - P.H_lower * P.S_dn, P.H_lower)], cl: false, c: Gy, f: null, d: true });
    const s0 = B, s1 = B + P.B_stone_top;
    if (P.D_stone_up > 0 && P.B_stone_top > 0) poly(out.sect, [S(s0, 0), S(s1, 0), S(s0 + P.B_stone_bot, -P.D_stone_up), S(s0, -P.D_stone_up)], St, 'rgba(251,191,36,0.08)');
    if (P.L_apron_dn > 0 && P.T_apron_dn > 0) { const dz = P.L_apron_dn * P.S_apron / 100; poly(out.sect, [S(s1, 0), S(s1 + P.L_apron_dn, -dz), S(s1 + P.L_apron_dn, -dz - P.T_apron_dn), S(s1, -P.T_apron_dn)], St, 'rgba(251,191,36,0.08)'); }
    // 平面（u, x）
    const Pn = (s, x) => [U(s), X(x)], sCr = sU(Hd + r);
    poly(out.plan, [Pn(sCr, 0), Pn(0, xBL), Pn(0, xBR), Pn(sCr, L), Pn(sCr + P.B_wing_top, L), Pn(B, xBR), Pn(B, xBL), Pn(sCr + P.B_wing_top, 0)]);
    [[sU(P.H_lower), q.xWeirL, q.xSlitL], [B - P.H_lower * P.S_dn, q.xWeirL, q.xSlitL], [sU(P.H_lower), q.xSlitR, q.xWeirR], [B - P.H_lower * P.S_dn, q.xSlitR, q.xWeirR], [sU(Hd), 0, q.xWeirL], [sU(Hd), q.xWeirR, L]].forEach(([s, a, b]) => out.plan.push({ p: [Pn(s, a), Pn(s, b)], cl: false, c: Gy, f: null, d: false }));
    cx = q.xSlitL; d.pierHeights.forEach(h => { cx += P.W_slot; const bt = d.getPierTopWidthCm(h), su = sU(h); poly(out.plan, [Pn(su, cx), Pn(su, cx + P.W_pier), Pn(su + bt, cx + P.W_pier), Pn(su + bt, cx)], W, 'rgba(255,255,255,0.12)'); cx += P.W_pier; });
    if (P.B_stone_top > 0) poly(out.plan, [Pn(s0, xBL), Pn(s0, xBR), Pn(s1, xBR), Pn(s1, xBL)], St, 'rgba(251,191,36,0.06)');
    if (P.L_apron_dn > 0) out.plan.push({ p: Array.from({ length: 41 }, (_, i) => { const t = i / 40 * Math.PI; return Pn(s1 + Math.sin(t) * P.L_apron_dn, xC - Math.cos(t) * d.W_weir / 2); }), cl: true, c: St, f: 'rgba(251,191,36,0.05)', d: false });
    return out;
  }
  function computeQuantities(P, d) {
    const rows = [], f = (v, k) => (+v).toFixed(k === undefined ? 2 : k);
    const r = (no, name, unit, qty, formula, note) => rows.push({ no: String(no), name, unit, qty: +(+qty).toFixed(2), formula, note: note || '' });
    r(1, '280kgf/cm²混凝土', 'm³', d.V_conc, d.f_conc_str1 + d.f_conc_str2, '依圖面幾何（擬柱體公式）');
    r(2, '軀體模板', 'm²', d.A_form, d.f_form_str1 + d.f_form_str2, '兩岸端面、壩頂、止滑齒牆底不組模');
    r(3, '鋼筋（含損耗，估算）', 'kg', d.W_rebar, d.f_rebar_str2, '原圖無鋼筋表，以 kg/m³ 估算');
    r(4, '漿砌塊石', 'm³', d.V_stone, d.f_stone_str, '前庭漿砌石槽＋半橢圓護坦');
    return rows;
  }
  return {
    DEF, PR, GT, title: '梳子壩標準圖',
    getParams: R => { RR = R || {}; try { return getParams(); } finally { RR = null; } },
    run(R, opt) {
      RR = R || {};
      try {
        const P = getParams(), d = __H.comp(Object.assign({}, P, { pierHeights: P.pierHeights.slice() })), rows = computeQuantities(P, d);
        Object.assign(P, { L_total: d.L_total, L_base: d.L_base, B_base: d.B_base, W_weir: d.W_weir, W_slit: d.W_slit, xC: d.__q.xWeirL + d.W_weir / 2, __d: d });
        let O = [], L = null;
        if (opt && opt.draw) { O = toO(__H.draw(Object.assign({}, P, { pierHeights: P.pierHeights.slice() })), __H.LC); L = { V: hostViews(P, d) }; }
        const bt = Math.min(...P.pierHeights.map(h => d.B_base - h * (P.S_up + P.S_dn)));
        const checks = [
          { ok: bt >= 80, text: `梳齒墩頂寬最小 ${f0(bt)} cm（≥80 cm；不足時以 80 cm 計）` },
          { ok: P.B_weir_top <= P.B_mid && P.B_wing_top <= P.B_weir_top + 1e-6, text: `壩頂寬：中段 ${P.B_mid} ≥ 溢流段頂 ${P.B_weir_top} ≥ 翼牆頂 ${P.B_wing_top} cm` },
          { ok: d.L_base > 0 && P.W_cut_L + P.W_cut_R < d.L_total, text: `壩長 ${f0(d.L_total)} cm、底版長 ${f0(d.L_base)} cm、溢流寬 ${f0(d.W_weir)} cm（開口 ${P.N_pier + 1} 孔）` }];
        return { P, rows, checks, O, L };
      } finally { RR = null; }
    }
  };
  function f0(v) { return (+v).toFixed(0); }
