/* ============================================================================
   v6.3i 護岸型式：混凝土格籠(框)護岸（0416-1，b1bfd32e）、展開式蜂巢圍束網格緩坡護岸（0414-1，33144323）
   原工具 → ormodE.js（gen_revE.py）。數量全部由本系統斷面幾何量測，原工具寫死值改為參數（預設＝原值）
   本系統 a＝R.e＋(x−x設計河床處牆前緣)/100、z＝zc＋(z−z設計河床)/100；H＝設計河床以上高、D＝以下埋深（由幾何反算顯示）
   ============================================================================ */
(function () {
  const P = (k, nm, u, st, def, g, tip) => ({ k, nm, u, st, def, g, tip });
  const secPrim = (q, c, f, w, d) => ({ k: 'P', p: q, c, w: w || 1.3, f: f || null, cl: true, d: d || [] });
  /* ---------------- 混凝土格籠(框)護岸 ---------------- */
  {
    const key = 'crib', mdl = R => TCO_T[key].model(R);
    const params = [
      P('N_tiers', '丁條層數', '層', 1, 8, 'crib'), P('H_cm', '單階岸高 H（不含基礎，沿 1:m 斜量）', 'cm', 5, 275, 'crib'), P('m_tilt', '岸體後傾 1:m', '', 0.5, 6, 'crib'), P('df_cm', '埋入深度 df（溪床至基礎底）', 'cm', 5, 150, 'crib', '≧150 cm'),
      P('b1_cm', '丁條長 b1', 'cm', 5, 200, 'crib'), P('b2_cm', '丁條內縮長 b2', 'cm', 1, 178, 'crib'), P('b3_cm', '順條長 b3（丁條間距）', 'cm', 5, 200, 'crib'), P('h_hdr', '丁條斷面 w＝h', 'cm', 1, 25, 'crib'), P('h_str', '順條斷面寬', 'cm', 1, 20, 'crib'),
      P('hStrD', '順條斷面高（圖面）', 'cm', 0.5, 19, 'crib', '原圖 19'), P('hNotch', '丁條凸榫凹槽深', 'cm', 0.5, 5.5, 'crib', '原圖 5.5'), P('hBot', '最下層順條底至基礎頂', 'cm', 1, 20, 'crib', '原圖：H＝20＋層數×層距'), P('wCrest', '坡頂植生區超出丁條', 'cm', 1, 38, 'crib'),
      P('B_cm', '基礎台總寬 B', 'cm', 5, 250, 'base'), P('h1_cm', '基礎台高 h1', 'cm', 5, 60, 'base'), P('h2_cm', '止滑榫高 h2', 'cm', 5, 40, 'base'), P('h3_cm', '後踵總高 h3', 'cm', 5, 90, 'base'),
      P('wFront', '前趾平台寬', 'cm', 1, 36, 'base', '原圖 36'), P('wKeyBot', '止滑榫底寬', 'cm', 1, 30, 'base', '原圖 30'), P('wKeySlope', '止滑榫斜接寬', 'cm', 1, 20, 'base', '原圖 20'), P('wLug', '後踵凸台寬', 'cm', 1, 25, 'base', '原圖 25'),
      P('kgHdr', '丁條鋼筋（每支）', 'kg', 0.1, 8.2, 'rb', '原圖配筋：4 主筋＋9 箍筋 #3'), P('kgStr', '順條鋼筋（每支）', 'kg', 0.1, 7.8, 'rb', '原圖配筋：4 主筋＋11 箍筋 #3'), P('kgBase', '基礎台鋼筋（每 m 寬）', 'kg/m', 0.1, 10.88, 'rb'),
      P('kdf', '標準圖溪床線位置係數（×df）', '', 0.01, 1, 'draw', '1＝溪床線畫在 df 處'), P('N_bay', '平/立面分區格數', '格', 1, 3, 'draw')];
    function geo(R, zc) {
      const m = mdl(R), A = x => R.e + (x - m.xBed) / 100, Z = z => zc + (z - m.zBed) / 100, M = q => q.map(([x, z]) => [A(x), Z(z)]), PP = q => M(m.P(q));
      const cap = m.strs[m.strs.length - 1], polys = [{ m: 'conc', pts: PP(m.base) }, { m: 'stone', pts: PP(m.env) }, { m: 'conc', pts: PP(cap) }];
      const face = [[R.e, zc]].concat(m.front.filter(q => q[1] > m.zBed + 1e-6).map(([x, z]) => [A(x), Z(z)]));
      const xs = m.P(m.base).map(q => q[0]), zs = m.P(m.base).map(q => q[1]);
      return { face: tcoMono(face), a0: A(m.crest[0]), a0b: A(m.crestEnd), zTop: Z(m.crest[1]), zf: Z(Math.min(...zs)), aF0: A(Math.min(...xs)), aB0: A(Math.max(...xs)), th: (m.crestEnd - m.crest[0]) / 100, polys, form: 0, pipe: null, M: m,
        A: x => A(x), Z: z => Z(z) };
    }
    const IT = [['hdrCnt', '預鑄丁條（b1×25×25）', '支'], ['hdrV', '預鑄丁條混凝土', 'm³'], ['strCnt', '預鑄順條（b3×20×20）', '支'], ['strV', '預鑄順條混凝土', 'm³'], ['base', '210 kgf/cm² 場鑄混凝土基礎台', 'm³'],
      ['cob', '格籠內填卵塊石', 'm³'], ['rbP', '預鑄丁條／順條鋼筋', 'kg'], ['rbB', '基礎台鋼筋', 'kg']];
    const FX = { hdrCnt: m => m.OV.formula_hdr_cnt, hdrV: m => m.OV.formula_hdr_rc, strCnt: m => m.OV.formula_str_cnt, strV: m => m.OV.formula_str_rc, base: m => m.OV.formula_base_rc, cob: m => m.OV.formula_cobble_vol,
      rbP: m => `丁條 ${rvF(m.Q.hdrCnt, 2)}×${m.p.kgHdr}＋順條 ${rvF(m.Q.strCnt, 2)}×${m.p.kgStr} kg（原圖配筋）`, rbB: m => `B ${rvF(m.B / 100)} m × ${m.p.kgBase} kg/m（原圖配筋）` };
    tcReg({
      id: key, cat: 'rev', label: '混凝土格籠(框)護岸', code: '0416-1', note: '預鑄丁條（header）與順條（stretcher）交錯疊砌成 1:6 後傾格籠，籠內填卵塊石；下為 210 場鑄混凝土基礎台（止滑榫＋後踵凸台）；坡頂客土植生', prim: 'conc',
      groups: [{ k: 'crib', t: '格籠（丁條／順條）' }, { k: 'base', t: '混凝土基礎台' }, { k: 'rb', t: '鋼筋（原圖配筋）' }, { k: 'draw', t: '標準圖繪製' }],
      commonDef: { ec: 0.3, jsp: 10 },
      params,
      items: IT.map(([k, it, u]) => { const o = { k, it, u, opt: false, fx: p => { try { return FX[k](mdl(p)); } catch (e) { return ''; } } };
        if (k === 'hdrCnt') { o.gridLen = p => (p.b3_cm || 200) / 100; o.perGrid = p => Math.round(p.N_tiers); }
        if (k === 'strCnt') { o.gridLen = p => (p.b3_cm || 200) / 100; o.perGrid = p => mdl(p).strs.length; }
        return o; }),
      postInt(rows, p) { const g = k => rows.find(r => r.k === k), h = g('hdrCnt'), s = g('strCnt'), rb = g('rbP'); if (h && s && rb) { rb.v = h.v * p.kgHdr + s.v * p.kgStr; rb.fx = `丁條 ${h.v} 支×${p.kgHdr}＋順條 ${s.v} 支×${p.kgStr} kg（依圖面配筋）`; } },
      sync(p) { const m = mdl(p); p.H = tcR2(m.H / 100); p.D = tcR2(m.D / 100); p.n = tcR2(1 / m.p.m_tilt); return p; },
      geo,
      orig: { model: R => mdl(R), prims: m => TCO_T[key].prims(m), sec: m => [secPrim(m.P(m.env), '#e2e8f0', 'rgba(226,232,240,0.10)', 1.0, [6, 4]), secPrim(m.P(m.base), '#ffe600', 'rgba(255,230,0,0.12)', 1.6)].concat(m.strs.map(q => secPrim(m.P(q), '#38bdf8', 'rgba(15,23,42,0.85)', 1.1)), m.hdrs.map(q => secPrim(m.P(q), '#38bdf8', 'rgba(30,41,59,0.85)', 1.1))) },
      qty(G) { const Q = G.M.Q, o = {}; IT.forEach(([k]) => { o[k] = Q[k] || 0; }); return o; },
      dims() { return {}; },
      checks(p) { const m = mdl(p); return [
        { ok: m.p.H_cm <= 400, text: `單階岸高 H ${m.p.H_cm} cm（≦ 400 cm）；層距 ${rvF((m.p.H_cm - m.p.hBot) / m.p.N_tiers, 1)} cm × ${m.p.N_tiers} 層` },
        { ok: m.p.df_cm >= 150, text: `埋入深度 df ${m.p.df_cm} cm（≧ 150 cm）` },
        { ok: m.uHR <= m.B - m.p.wLug + 1e-6, text: `丁條後端 ${rvF(m.uHR, 0)} cm ${m.uHR <= m.B - m.p.wLug + 1e-6 ? '≦' : '超出'}後踵凸台內緣 ${rvF(m.B - m.p.wLug, 0)} cm（前趾 ${m.p.wFront}－凸榫 ${rvF((m.p.b1_cm - m.p.b2_cm) / 2, 1)}＋b1 ${m.p.b1_cm}）` }]; }
    });
  }
  /* ---------------- 展開式蜂巢圍束網格緩坡護岸 ---------------- */
  {
    const key = 'hcell', mdl = R => TCO_T[key].model(R);
    const params = [
      P('n_slope', '邊坡斜率 1:n', '', 0.1, 2.5, 'slope'), P('H_slope', '斜坡垂直高差', 'cm', 5, 180, 'slope'), P('W_top', '坡頂錨固平段', 'cm', 5, 100, 'slope'), P('H_cov', '坡頂覆土厚', 'cm', 1, 40, 'slope'), P('kTr', '坡頂錨固溝頂寬比（×W_top）', '', 0.05, 1.6, 'slope', '原圖 1.6'),
      P('W_toe_lap', '坡底水平折入寬', 'cm', 5, 80, 'slope'), P('sub_ratio', '浸水段比例（填碎石）', '%', 1, 45, 'slope'),
      P('D_cell', '蜂巢網格深度', 'cm', 1, 10, 'cell'), P('W_cell', '單一網格尺寸', 'cm', 1, 20, 'cell'), P('S_tendon', '腱線間距', 'cm', 0.1, 73.2, 'cell'), P('S_pin_slope', '錨釘斜距', 'cm', 5, 80, 'cell'), P('S_pin_long', '錨釘縱向間距', 'cm', 5, 100, 'cell'),
      P('L_pin', 'J 型錨釘長', 'cm', 5, 60, 'cell'), P('d_pin', 'J 型錨釘直徑', 'mm', 1, 13, 'cell'), P('N_cell_pin', '每幾格配置 1 支', '格', 1, 5, 'cell'),
      P('B_fdn', '基礎台寬', 'cm', 5, 140, 'fdn'), P('H_fdn', '基礎台深', 'cm', 5, 140, 'fdn'), P('hUp', '基礎台頂高出坡腳轉折', 'cm', 1, 32, 'fdn', '原圖 32'), P('fa', '基礎台頂前緣內退', 'cm', 1, 38, 'fdn'), P('fb', '基礎台頂前緣加高', 'cm', 0.5, 3, 'fdn'),
      P('fc', '基礎台前面下緣內退', 'cm', 1, 8, 'fdn'), P('fd', '基礎台前面下緣低於網格頂', 'cm', 1, 15, 'fdn'), P('padOff', '溪床面低於基礎台頂', 'cm', 1, 4, 'fdn'),
      P('Vemb', '臨水面嵌塊石（原圖表值）', 'm³/m', 0.01, 0.14, 'fdn'), P('Vrip', '坡腳保護塊石（原圖表值）', 'm³/m', 0.01, 0.38, 'fdn'), P('L_draw_cm', '平/立面展示長', 'cm', 50, 400, 'draw')];
    function geo(R, zc) {
      const m = mdl(R), A = x => R.e + (x - m.xBed) / 100, Z = z => zc + (z - m.zBed) / 100, M = q => q.map(([x, z]) => [A(x), Z(z)]), p = m.p;
      const polys = [{ m: 'conc', pts: M(m.fdn) }, { m: 'gravel', pts: M(m.cell) }];
      const face = [[R.e, zc], [A(-m.B + p.fa), Z(p.hUp + p.fb)], [A(m.Ws), Z(m.Hs + m.Dc)], [A(m.Ws + m.Wt), Z(m.Hs + m.Dc)]];
      return { face: tcoMono(face), a0: A(m.Ws), a0b: A(m.Ws + m.Wt), zTop: Z(m.Hs + m.Dc), zf: Z(m.zBot), aF0: A(-m.B), aB0: A(0), th: m.Dc / 100, polys, form: 0, pipe: null, M: m, A: x => A(x), Z: z => Z(z) };
    }
    const IT = [['geo', '展開式蜂巢圍束網格（深 10 cm）', 'm²'], ['pin', 'J 型錨釘', '支'], ['tendon', '高強力聚酯腱線', 'm'], ['subg', '浸水段單尺寸碎石填充', 'm³'], ['grass', '出水段表土填充＋草皮', 'm²'],
      ['top', '表土（網格內＋坡頂覆土）', 'm³'], ['fdn', '210 kgf/cm² 混凝土基礎台', 'm³'], ['rip', '嵌石／坡腳拋塊石', 'm³']];
    const OK = { geo: 'geocell_area', pin: 'pin_cnt', tendon: 'tendon_len', subg: 'sub_gravel', grass: 'grass_area', top: 'topsoil_vol', fdn: 'fdn_conc', rip: 'riprap_vol' };
    tcReg({
      id: key, cat: 'rev', label: '展開式蜂巢圍束網格緩坡護岸', code: '0414-1', note: '緩於 1:1 的土坡鋪展開式蜂巢網格（坡底折入基礎台錨固槽、坡頂錨固平段覆土），J 型錨釘與腱線固定；浸水段填碎石、出水段填表土植草；坡腳 140×140 混凝土基礎台', prim: 'gab',
      groups: [{ k: 'slope', t: '坡面與錨固' }, { k: 'cell', t: '蜂巢網格、錨釘與腱線' }, { k: 'fdn', t: '坡腳基礎台' }, { k: 'draw', t: '標準圖繪製' }],
      commonDef: { ec: 0.3, jsp: 10 },
      params,
      items: IT.map(([k, it, u]) => ({ k, it, u, opt: false, fx: p => { try { return mdl(p).OV['formula_' + OK[k]]; } catch (e) { return ''; } } })),
      sync(p) { const m = mdl(p); p.H = tcR2(m.H / 100); p.D = tcR2(m.D / 100); p.n = tcR2(m.p.n_slope); return p; },
      geo,
      orig: { model: R => mdl(R), prims: m => TCO_T[key].prims(m), sec: m => [secPrim(m.fdn, '#ffe600', 'rgba(255,230,0,0.12)', 1.6), secPrim(m.cell, '#facc15', 'rgba(250,204,21,0.25)', 1.3), secPrim(m.trench, '#a3e635', 'rgba(163,230,53,0.10)', 1.0, [5, 3])] },
      qty(G) { const Q = G.M.Q, o = {}; IT.forEach(([k]) => { o[k] = Q[k] || 0; }); return o; },
      dims() { return {}; },
      checks(p) { const m = mdl(p); return [
        { ok: m.p.n_slope >= 1, text: `邊坡 1:${m.p.n_slope}（須緩於 1:1）；斜坡長 ${rvF(m.Q.Ls / 100)} m` },
        { ok: m.p.W_top >= 100, text: `坡頂錨固平段 ${m.p.W_top} cm（≧ 100 cm）、覆土 ${m.p.H_cov} cm（30～50）` },
        { ok: true, text: `網格展開長 ${rvF(m.Q.Lnet / 100)} m；錨釘 ${rvF(m.Q.pin, 1)} 支/m` }]; }
    });
  }
})();
