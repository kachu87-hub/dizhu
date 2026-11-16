/* ============================================================================
   v8.7 八種原工具整合（原工具 → ormodG.js，gen_st87.py）＋控制點 C4（專案座標換算 TWD97）
   一、路面（沿用排水溝放置框架：A 沿中心線＋起訖樁號＋偏距；B 平面自畫基線）
       RC 路面（rcrd）、級配複式斷面鋪設路面（gvrd）：數量依斷面幾何×長度；連繫板、伸縮縫依長度排出整數塊／處
   二、橫向結構物（固床工型式）：橫向截水溝＋TGB 格柵板、攔石工、透過性鋼格框潛壩、階梯式固床工
   三、護岸型式：植生塊（RC 箱）護岸　四、生物通道型式：RC 護岸開口式動物通道
   ============================================================================ */
/* ---------------- 一、路面 ---------------- */
(function () {
  const f = (v, d) => (+v).toFixed(d === undefined ? 2 : d);
  dn2Reg('rcrd', {
    alias: 'RC路面 混凝土路面 鋪面 道路 便道 管理道路 焊接鋼線網', label: 'RC 路面（焊接鋼線網）', mat: ['混凝土', '焊接鋼線網'], n: 0.015, sub: true, road: true, exQ: true,
    PR: [['W', '路面鋪設寬度 W', 'cm', 5, 250], ['T', '路面鋪設厚度 T', 'cm', 1, 20], ['fc', '混凝土強度', 'kgf/cm²', 70, 210], ['S_mesh', '焊接鋼線網間距', 'cm', 1, 10], ['d_wire', '鋼線線徑', 'mm', 0.5, 6],
      ['c_bot', '底部保護層', 'cm', 0.5, 5], ['c_side', '兩側保護層', 'cm', 0.5, 5], ['lap_factor', '鋼線網搭接損耗係數', '', 0.01, 1.10], ['kw', '鋼線單位重係數（kg/m ÷ mm²）', '', 0.000001, 0.006165]],
    geo(p) {
      const W = p.W, T = p.T, wkg = +(p.kw * p.d_wire * p.d_wire).toFixed(4), nper = +(100 / p.S_mesh).toFixed(2), mkg = +(2 * nper * wkg).toFixed(2), Wm = Math.max(0, W - 2 * p.c_side);
      const nLong = Math.max(1, Math.floor(Math.max(10, Wm) / p.S_mesh)) + 1;
      const Q = [
        { it: `${p.fc}kgf/cm² 混凝土`, u: 'm³', v: W * T / 1e4, fx: `寬 ${f(W / 100)} × 厚 ${f(T / 100)}` },
        { it: '普通模板（兩側邊模）', u: 'm²', v: 2 * T / 100, fx: `2 × 厚 ${f(T / 100)}` },
        { it: `${p.S_mesh}cm×${p.S_mesh}cm 焊接鋼線網（面積）`, u: 'm²', v: Wm / 100, fx: `寬 ${f(W / 100)} − 2×保護層 ${f(p.c_side / 100)}；縱向鋼線 ${nLong} 根@${p.S_mesh}cm` },
        { it: `焊接鋼線網（線徑 ${p.d_wire}mm 重量）`, u: 'kg', v: Wm / 100 * mkg * p.lap_factor, fx: `網面積 × ${mkg} kg/m²（2×${nper} 根/m×${wkg} kg/m）× 搭接 ${p.lap_factor}` },
        { it: '鋪設完成面整平掃紋處理', u: 'm²', v: W / 100, fx: `寬 ${f(W / 100)}` },
        { it: '路面底部整平壓實', u: 'm²', v: W / 100, fx: `寬 ${f(W / 100)}` }];
      return { polys: [[[-W / 2, 0], [W / 2, 0], [W / 2, T], [-W / 2, T]]], inner: [], Q, W, H: T, Wb: W, Wt: W, zb: 0, hyd: { B: 0, m: 0 }, exA: 0, ov: {} };
    }
  });
  dn2Reg('gvrd', {
    alias: '級配路面 複式斷面 車轍帶 混凝土車轍 碎石級配 透水路面 道路 便道', label: '級配複式斷面鋪設路面（兩側 RC 車轍帶＋中央級配）', mat: ['混凝土', '碎石級配', '焊接鋼線網'], n: 0.02, sub: true, road: true, exQ: true,
    PR: [['W_L', '左側混凝土車轍帶寬', 'cm', 5, 110], ['W_C', '中央碎石級配帶寬', 'cm', 5, 110], ['W_R', '右側混凝土車轍帶寬', 'cm', 5, 110], ['B_tie', '橫向混凝土連繫板寬', 'cm', 5, 110], ['L_unit', '伸縮縫單元長（連繫板間距）', 'cm', 10, 750],
      ['T', '鋪設厚度', 'cm', 1, 20], ['fc', '混凝土強度', 'kgf/cm²', 70, 210], ['S_mesh', '焊接鋼線網間距', 'cm', 1, 10], ['d_wire', '鋼線線徑', 'mm', 0.5, 6], ['c_bot', '底部保護層', 'cm', 0.5, 5],
      ['psi_gravel', '平面碎石級配示意粒徑', 'cm', 1, 22], ['kw', '鋼線單位重係數（kg/m ÷ mm²）', '', 0.000001, 0.006165]],
    geo(p) {
      const WL = p.W_L, WC = p.W_C, WR = p.W_R, T = p.T, Wt = WL + WC + WR, x0 = -Wt / 2, x1 = x0 + WL, x2 = x1 + WC, x3 = x2 + WR;
      const wkg = +(p.kw * p.d_wire * p.d_wire).toFixed(4), mkg = +(2 * +(100 / p.S_mesh).toFixed(2) * wkg).toFixed(2), Lu = p.L_unit / 100, Bt = Math.min(p.B_tie, p.L_unit) / 100;
      const nTie = L => Math.max(1, Math.round(L / Lu)), Ac = L => (WL + WR) / 100 * L + nTie(L) * WC / 100 * Bt, Lg = L => Math.max(0, L - nTie(L) * Bt);
      const per = (fn) => fn(Lu) / Lu;   // 每公尺（一個單元的平均）
      const Q = [
        { it: `${p.fc}kgf/cm² 混凝土`, u: 'm³', fn: L => Ac(L) * T / 100, fx: L => `[(左 ${f(WL / 100)}＋右 ${f(WR / 100)})×L ${f(L)}＋連繫板 ${nTie(L)} 塊×${f(WC / 100)}×${f(Bt)}] × 厚 ${f(T / 100)}` },
        { it: '碎石級配（中央透水帶）', u: 'm³', fn: L => WC / 100 * Lg(L) * T / 100, fx: L => `中央寬 ${f(WC / 100)} × (L ${f(L)} − ${nTie(L)}×${f(Bt)}) × 厚 ${f(T / 100)}` },
        { it: '普通模板（內外邊模）', u: 'm²', fn: L => (2 * L + 2 * Lg(L) + 2 * nTie(L) * WC / 100) * T / 100, fx: L => `(外側 2×${f(L)}＋級配區兩側 2×${f(Lg(L))}＋連繫板端 2×${nTie(L)}×${f(WC / 100)}) × ${f(T / 100)}` },
        { it: `${p.S_mesh}cm×${p.S_mesh}cm 焊接鋼線網（面積）`, u: 'm²', fn: L => Ac(L), fx: L => '＝混凝土鋪面面積' },
        { it: `焊接鋼線網（線徑 ${p.d_wire}mm 重量）`, u: 'kg', fn: L => Ac(L) * mkg, fx: L => `鋪面面積 ${f(Ac(L))} × ${mkg} kg/m²` },
        { it: '鋪設完成面整平掃紋處理', u: 'm²', fn: L => Ac(L), fx: L => '＝混凝土鋪面面積' },
        { it: '路面底部整平壓實', u: 'm²', fn: L => Wt / 100 * L, fx: L => `全寬 ${f(Wt / 100)} × ${f(L)}` },
        { it: `伸縮縫（@${f(Lu)} m，橫跨兩側車轍帶）`, u: 'm', fn: L => nTie(L) * (WL + WR) / 100, fx: L => `${nTie(L)} 處 × (${f(WL / 100)}＋${f(WR / 100)})` },
        { it: '橫向混凝土連繫板', u: '塊', fn: L => nTie(L), fx: L => `L ${f(L)} ÷ 單元長 ${f(Lu)} 取整數（至少 1）`, dig: 0 }];
      Q.forEach(q => { q.v = per(q.fn); });
      const polys = [[[x0, 0], [x1, 0], [x1, T], [x0, T]], [[x1, 0], [x2, 0], [x2, T], [x1, T]], [[x2, 0], [x3, 0], [x3, T], [x2, T]]];
      return { polys, inner: [], Q, W: Wt, H: T, Wb: Wt, Wt, zb: 0, hyd: { B: 0, m: 0 }, exA: 0, ov: {} };
    }
  });
  const isRd = d => !!(d && DN2[d.type] && DN2[d.type].road);
  window.dnIsRoad = isRd;
  // 數量列：路面以長度排整數塊（q.fn），第一列改稱「路面長度」
  const _rows = dnRows; dnRows = function (d) {
    if (!DN2[d.type] || !dn2Geo(d).Q.some(q => q.fn)) return _rows(d);
    const c = dnCalc(d), G = dn2Geo(d), L = c.L, rows = [{ it: isRd(d) ? '路面長度' : '排水溝長度', u: 'm', v: L, fx: d.mode === 'B' ? '基線長' : `${formatStation(d.s0)}～${formatStation(d.s1)}` }];
    G.Q.forEach(q => rows.push(q.fn ? { it: q.it, u: q.u, v: q.fn(L), fx: typeof q.fx === 'function' ? q.fx(L) : q.fx } : { it: q.it, u: q.u, v: q.v * L, fx: `${dn2f(q.v, 3)} ${q.u}/m × ${dn2f(L)} m；${q.fx}` }));
    return rows;
  };
  const _r2 = dnRows; dnRows = function (d) { const R = _r2(d); if (isRd(d) && R[0] && R[0].it === '排水溝長度') R[0] = Object.assign({}, R[0], { it: '路面長度' }); return R; };
  // 標準圖：原工具繪圖＋本段數量表
  const _sp = dn2StdPrims; dn2StdPrims = function (d) {
    if (!isRd(d)) return _sp(d);
    const G = dn2Geo(d), rows = dnRows(d).filter(r => r.it !== '路面長度').map(r => ({ name: r.it, unit: r.u, qty: r.v, formula: r.fx, dig: r.u === '塊' ? 0 : 2 })), L = dnLen(d);
    const O = TCO_D[d.type].run(Object.assign({}, G.p), { rows, title: `本段數量表（L＝${dn2f(L)} m，依圖面幾何×長度）` }), P = tcoStdPrims(O, 0.01, 0, 0, 'STD_'), bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    P.forEach(o => { if (o.t === 't') { bb.x0 = Math.min(bb.x0, o.x); bb.x1 = Math.max(bb.x1, o.x + o.s.length * o.h); bb.y0 = Math.min(bb.y0, o.y - o.h); bb.y1 = Math.max(bb.y1, o.y + o.h); } else (o.p || []).forEach(v => { bb.x0 = Math.min(bb.x0, v[0]); bb.x1 = Math.max(bb.x1, v[0]); bb.y0 = Math.min(bb.y0, v[1]); bb.y1 = Math.max(bb.y1, v[1]); }); });
    const TH = Math.max(0.05, (bb.x1 - bb.x0) / 120); P.push({ t: 't', x: bb.x0, y: bb.y1 + TH * 2, h: TH * 1.4, s: `${d.name}　${DN_TYPES[d.type].label}（${d.mode === 'A' ? `${d.side === 'L' ? '左' : '右'}側 ${formatStation(d.s0)}～${formatStation(d.s1)}` : '獨立基線'}　L＝${dn2f(L)} m）`, c: '#ffd08a', a: 30, ly: 'STD_TITLE', al: 'l', va: 'b', rot: 0 }); bb.y1 += TH * 4;
    return { P, bb };
  };
  // 新增：路面預設在中心線上（偏距 0）、頂面齊地面；名稱「路面n」
  const _add = dnAdd; dnAdd = function (mode, type) {
    const t = DN_TYPES[type] ? type : (state.dnPickType || 'rect'); if (!(DN2[t] && DN2[t].road)) return _add(mode, type);
    const n0 = state.dns.length; _add(mode, t); if (state.dns.length === n0) return; const d = state.dns[state.dns.length - 1];
    let k = 1; while (state.dns.some(x => x !== d && x.name === '路面' + k)) k++; d.name = '路面' + k; if (mode === 'A') { d.e = 0; d.ref = 'ground'; d.dz = 0; }
    d._k = null; dnPanelUI(); requestRedraw(); if (mode === 'A') updateStatus(`✅ 已新增「${d.name}」（${DN_TYPES[t].label}）沿中心線，偏距 0 m、頂面齊地面；可在「排水／路面」卡片改起訖樁號、偏距與斷面。`);
  };
  // 面板：路面專用新增鈕；路面不做通水檢核
  const _ui = dnPanelUI; dnPanelUI = function () {
    _ui(); const box = document.getElementById('dnPanel'); if (!box || !box.firstElementChild) return;
    const d = state.dns[state.dnSel];
    if (!box.querySelector('#v87RoadAdd')) { const g = box.querySelector('.sec-card > div[style*="grid-template-columns:1fr 1fr"]'); if (g) g.insertAdjacentHTML('afterend', `<div id="v87RoadAdd" style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px;"><button class="btn" onclick="dnAdd('A','rcrd')" title="RC 路面，沿中心線（偏距 0、頂面齊地面）；新增後可在斷面型式改為級配複式斷面">＋ 路面（沿中心線）</button><button class="btn" onclick="dnAdd('B','rcrd')" title="RC 路面，在平面圖自畫路線">＋ 路面（畫基線）</button></div>`); }
    const t = box.querySelector('.sec-title span'); if (t && t.textContent.indexOf('路面') < 0) t.textContent = '🟦 排水溝／路面';
    if (isRd(d)) box.querySelectorAll('div').forEach(el => { if (el.childElementCount === 0 && /地下排水（盲溝）/.test(el.textContent)) el.textContent = '路面：不做通水檢核；頂面高程依「溝頂齊地面」＝路面頂齊地面（可設 Δz）。開挖、回填不計（原圖數量表無此項）。'; });
    if (isRd(d)) box.querySelectorAll('b, div').forEach(el => { if (el.childElementCount === 0 && el.textContent === '通水檢核') el.textContent = '通水檢核（路面不適用）'; });
  };
  // 總表：路面自成一類
  if (typeof ttWorks === 'function') { const _tw = ttWorks; ttWorks = function (curOnly) { const W = _tw(curOnly); try { W.forEach(w => { if (w.cat === '排水溝' && Object.keys(DN2).some(k => DN2[k].road && DN_TYPES[k].label === w.sub)) w.cat = '路面'; }); } catch (e) { } return W; }; }
})();
/* ---------------- 二、橫向結構物（固床工型式） ---------------- */
Object.assign(SLT, {
  tgb: { label: '橫向截水溝＋TGB 格柵板（橫越路面）', code: '橫向截水溝', noAutoFit: true, ownEx: true,
    env: P => ({ w: P.L_tot / 100, whL: P.xc / 100, whR: (P.L_tot - P.xc) / 100, h2: 0, h3: P.Dp / 100, d1: P.Wp / 100, s2: 0 }),
    note: '橫越道路設置：以路面中心（溝內淨長中點）為界，左寬＝集水井＋過渡段＋溝內淨長/2，右寬＝其餘（含末端壁）；頂面齊路面（出露高 0）；基礎深＝集水井深；順路面方向厚＝集水井外寬。挖方、填方依原圖幾何另計（不另加外包斷面開挖）',
    fitTxt: '依此樁號路寬設定溝內淨長＝路寬、格柵段長＝路寬＋50 cm',
    fit(sp, W) { const b = Math.max(50, Math.round(W * 100)); return { p_L_bot: b, p_L_top: b + 50 }; } },
  rockc: { label: '攔石工（H 型鋼＋疏伐木）', code: '攔石工', noAutoFit: true,
    env: P => ({ w: P.L_total / 100, whL: P.xc / 100, whR: (P.L_total - P.xc) / 100, h2: P.H_exp / 100, h3: (P.H_base + P.t_pc) / 100, d1: P.W_base / 100, s2: 0 }),
    note: '以中央溢流段中心為界：左寬＝左翼段＋左斜坡＋溢流段/2，右寬同理（左右可不同）；上游設計高＝溢流段基礎頂；出露高＝H 型鋼露明高；基礎深＝基礎高＋打底；順水流厚＝基礎寬',
    fitTxt: '依此樁號溪床寬設定中央溢流段長＝溪床寬（翼段、斜坡不變）',
    fit(sp, W) { return { p_L_mid: Math.max(100, Math.round(W * 100)) }; } },
  steel: { label: '透過性鋼格框潛壩', code: '鋼格框潛壩', noAutoFit: true,
    env: P => ({ w: P.L_total / 100, whL: P.xC / 100, whR: (P.L_total - P.xC) / 100, h2: P.H_crib / 100, h3: (P.H_f1 + P.H_f2) / 100, d1: P.B_base / 100, s2: 0 }),
    note: '以中央隔墩中心為界：左寬＝左翼＋左斜坡＋左格框＋隔墩/2，右寬同理（左右可不同）；上游設計高＝鋼格框頂；出露高＝鋼格框段高；基礎深＝下部基礎兩層高；順水流厚＝基礎底寬',
    fitTxt: '依此樁號溪床寬設定左右鋼格框淨寬＝(溪床寬−隔墩−兩側斜坡)÷2',
    fit(sp, W) { const P = TCO_S.steel.getParams(sp), w = Math.max(50, Math.round((W * 100 - P.W_pier - P.L_slpL - P.L_slpR) / 2)); return { p_L_cribL: w, p_L_cribR: w }; } },
  stepgs: { label: '階梯式固床工（接既有固床工下游）', code: '階梯式固床工', noAutoFit: true,
    env: P => ({ w: P.W_total_cm / 100, whL: P.W_total_cm / 200, whR: P.W_total_cm / 200, h2: (P.yTop - P.H_s1) / 100, h3: P.H_s1 / 100, d1: P.D_total / 100, s2: 0 }),
    note: '左右對稱（全寬＝淨寬＋2×側牆）；上游設計高＝頂部胸牆頂；出露高＝胸牆頂至第 1 階頂；基礎深＝第 1 階高；順水流厚＝基礎底寬＋既有斜坡水平寬。漿排塊石護坦左右寬分開設定',
    fitTxt: '依此樁號溪床寬設定本體淨寬＝溪床寬−2×側牆厚',
    fit(sp, W) { const P = TCO_S.stepgs.getParams(sp); return { p_L_net: Math.max(300, Math.round(W * 100 - 2 * P.t_wall)) }; } }
});
(function () {
  const K = ['tgb', 'rockc', 'steel', 'stepgs'], ins = (after, k) => { const i = SLT_ORDER.indexOf(after); SLT_ORDER.splice(i < 0 ? SLT_ORDER.length : i + 1, 0, k); };
  ins('gsp', 'stepgs'); ins('comb', 'steel'); ins('steel', 'rockc'); SLT_ORDER.push('tgb');
  K.forEach(k => { SLT_VIEW[k] = (P, L) => ({ plan: L.V.plan, sect: L.V.sect, elev: L.V.elev }); });
  // TGB：挖填方用原圖幾何，不再加外包斷面開挖
  const _sq = sltQty; sltQty = function (st, q) {
    const r = _sq(st, q); if (!(SLT[st.sty] && SLT[st.sty].ownEx)) return r;
    r.rows = r.rows.filter(x => !/^結構物開挖/.test(x.it)); const e = r.rows.find(x => /^挖方/.test(x.it)); r.ex = e ? e.v : 0; return r;
  };
  const CATG = { tgb: '15', rockc: '1', steel: '1', stepgs: '2' }, ALIAS = { tgb: '橫向截水溝 截水溝 TGB 格柵板 集水井 路面排水 橫向集水', rockc: '攔石工 H型鋼欄石壩 欄石壩 疏伐木 透過性壩 鋼構壩', steel: '鋼格框 潛壩 透過性壩 鋼構壩 H型鋼 塊石填充', stepgs: '階梯固床工 階梯式 靜水池 魚道 隔板' },
    MAT = { tgb: ['混凝土', '鍍鋅格柵板'], rockc: ['混凝土', 'H型鋼', '疏伐木'], steel: ['混凝土', 'H型鋼', '塊石'], stepgs: ['混凝土', '鋼筋', '漿排塊石'] };
  if (!CAT_GROUPS.some(g => g.k === '29')) CAT_GROUPS.splice(CAT_GROUPS.findIndex(g => g.k === '31'), 0, { k: '29', t: '路面', n: '' });
  const _ci = catItems; catItems = function () {
    const A = _ci();
    A.forEach(it => { const k = it.id.slice(3); if (it.id.startsWith('sl:') && CATG[k]) Object.assign(it, { g: CATG[k], mat: MAT[k], alias: ALIAS[k], sub: '原圖移植（數量依幾何）' });
      if (it.kind === 'dn' && DN2[it.type] && DN2[it.type].road) Object.assign(it, { g: '29', sub: '路面' }); });
    return A;
  };
  if (typeof ttWorks === 'function') { const _tw = ttWorks, CN = { tgb: '橫向截水溝', rockc: '攔石工', steel: '潛壩' };
    ttWorks = function (curOnly) { const W = _tw(curOnly); try { W.forEach(w => { if (w.cat !== '固床工') return; const k = Object.keys(CN).find(k => SLT[k].label === w.sub); if (k) w.cat = CN[k]; }); } catch (e) { console.error(e); } return W; }; }
})();
/* ---------------- 三、護岸型式：植生塊（RC 箱）護岸（分層疊砌） ---------------- */
(function () {
  if (typeof tcReg !== 'function' || !TCO_T.rcbox) return;
  const key = 'rcbox', mdl = R => TCO_T.rcbox.model(R), UN = { cm: 'cm', m: 'm' };
  const GK = ['stack', 'box', 'fnd', 'rb'];
  const params = TCO_T.rcbox.PR.map(q => { const k = q.k.slice(2), m = /\(([^)]*)\)\s*$/.exec(q.nm), u = q.opt ? 'sel' : (m ? m[1] : (/層數|列數|支數|組數/.test(q.nm) ? '支' : '')), nm = q.nm.replace(/\s*\([^)]*\)\s*$/, '');
    return q.opt ? { k, nm, u: 'sel', opt: q.opt, def: q.def, g: GK[q.g] } : { k, nm, u: u === '°' ? '°' : u, st: +q.st, def: +q.def, g: GK[q.g] }; });
  const W = x => -x;   // 原工具 x（往岸側為負）→ 本系統（往岸側為正），河床 0
  const IT = [['box', '植生塊（RC 箱）', '塊'], ['boxV', '280 kgf/cm² 混凝土（植生塊預鑄）', 'm³'], ['form', '植生塊鋼模', 'm²'], ['rb', '植生塊鋼筋（原圖鋼筋表）', 'kg'], ['fill', '箱內回填現場溪床礫石料', 'm³'],
    ['bolt', 'M22 鍍鋅螺桿（含雙螺帽、鋼片）', '組'], ['fnd', '210 kgf/cm² 混凝土（L 型懸臂基礎）', 'm³'], ['fndF', '基礎模板', 'm²'], ['fndR', '基礎鋼筋（估算）', 'kg'], ['pc', 'PC 打底', 'm³'], ['bag', '太空包（施工擋水）', '個']];
  const FX = { box: m => `${m.N} 層 × 100 / B ${m.p.B_box} cm`, boxV: m => `塊數 × 每塊 ${m.d.f_rc_str} ＝ ${m.Vrc.toFixed(3)} m³`, form: m => `塊數 × 每塊 ${m.d.f_form_str} ＝ ${m.Af.toFixed(2)} m²`,
    rb: m => `塊數 × 每塊 ${m.Wrb.toFixed(2)} kg（D${m.p.d_rebar}：${m.d.rebars.map(r => `${r.len}m×${r.count}`).join('＋')}）`, fill: m => `塊數 × 每塊 ${m.d.f_fill_str} ＝ ${m.Vfill.toFixed(3)} m³`, bolt: m => `塊數 × ${m.p.n_bolt} 組`,
    fnd: m => `斷面量測 ${m.Q.fnd.toFixed(3)} m²（主柱 ${m.p.W_stem_bot}×${m.p.H_fnd_sub}＋懸臂 ${m.p.W_ledge}×${m.p.H_ledge}＋擋坎）× 1 m`, fndF: m => `前面 ${m.p.H_fnd_sub}＋擋坎斜面＋懸臂端 ${m.p.H_ledge}＋懸臂底 ${m.p.W_ledge}＋主柱背 ${m.p.H_lower_stem} ＝ ${(m.Lform / 100).toFixed(3)} m × 1 m`,
    fndR: m => `基礎 ${m.Q.fnd.toFixed(3)} m³ × ${m.p.rbk_fnd} kg/m³（原圖無基礎鋼筋表，估算）`, pc: m => `(${m.p.W_stem_bot}＋2×${m.p.pc_ext}) × ${m.p.pc_t} cm`, bag: m => `${m.p.n_bag} 個/m` };
  const sp = (q, c, f, w, d) => ({ k: 'P', p: q, c, w: w || 1.3, f: f || null, cl: true, d: d || [] }), WP = q => q.map(([x, y]) => [W(x), y]);
  tcReg({
    id: key, cat: 'rev', label: '植生塊（RC 箱）護岸（分層疊砌）', code: '植生塊護岸', prim: 'conc',
    note: '預鑄 RC 植生塊（箱）分層疊砌、每層退縮並後傾，箱內回填溪床礫石料植生；下部為 L 型懸臂基礎（前趾平台＋擋坎＋懸臂承托台）。原工具移植，數量依圖面幾何、鋼筋依原圖鋼筋表',
    groups: [{ k: 'stack', t: '植生塊疊砌' }, { k: 'box', t: '單一植生塊尺寸' }, { k: 'fnd', t: 'L 型懸臂基礎' }, { k: 'rb', t: '鋼筋（原圖鋼筋表）與附屬' }],
    commonDef: { ec: 0.3, jsp: 10 }, params,
    items: IT.map(([k, it, u]) => { const o = { k, it, u, opt: false, fx: p => { try { return FX[k](mdl(p)); } catch (e) { return ''; } } };
      if (k === 'box') { o.gridLen = p => (+p.B_box || 120) / 100; o.perGrid = p => Math.max(1, Math.round(p.N_layer)); }
      if (k === 'bolt') { o.gridLen = p => (+p.B_box || 120) / 100; o.perGrid = p => Math.max(1, Math.round(p.N_layer)) * Math.round(p.n_bolt); }
      return o; }),
    postInt(rows, p) { const g = k => rows.find(r => r.k === k), b = g('box'); if (!b) return; const m = mdl(p);
      [['boxV', m.Vrc, 'm³'], ['form', m.Af, 'm²'], ['rb', m.Wrb, 'kg'], ['fill', m.Vfill, 'm³']].forEach(([k, v]) => { const r = g(k); if (r) { r.v = b.v * v; r.fx = `${b.v} 塊 × ${v.toFixed(3)}（依圖面每塊）`; } });
      const bg = g('bag'); if (bg) { const v0 = bg.v; bg.v = Math.ceil(v0 - 1e-9); if (Math.abs(bg.v - v0) > 1e-6) bg.fx += `（${v0.toFixed(2)} 取整數）`; } },
    sync(p) { const m = mdl(p); p.H = tcR2(m.H / 100); p.D = tcR2(m.D / 100); p.n = tcR2((W(m.TL[0]) - W(m.boxes[0][1][0])) / Math.max(1, m.zTop)); return p; },
    geo(R, zc) {
      const m = mdl(R), A = x => R.e + x / 100, Z = z => zc + z / 100, M = q => q.map(([x, z]) => [A(W(x)), Z(z)]), fx = m.p;
      const yC = fx.H_curb, xB1 = m.boxes[0][1], xB1t = m.boxes[0][2], t1 = (yC - xB1[1]) / Math.max(1e-6, xB1t[1] - xB1[1]), xAtC = xB1[0] + t1 * (xB1t[0] - xB1[0]);
      const face = [[0, 0], [fx.W_toe_berm, 0], [fx.W_toe_berm + fx.dx_curb, yC], [W(xAtC), yC]];
      m.boxes.forEach((b, i) => { if (i) face.push([W(b[1][0]), b[1][1]]); face.push([W(b[2][0]), b[2][1]]); }); face.push([W(m.TL[0]), m.TL[1]]);
      const xs = m.fnd.map(q => W(q[0]));
      const polys = [{ m: 'conc', pts: M(m.fnd) }, { m: 'conc', pts: M(m.pc) }].concat(m.boxes.map(b => ({ m: 'stone', pts: M(b) })));
      return { face: tcoMono(face.map(([x, z]) => [A(x), Z(z)])), a0: A(W(m.TR[0])), a0b: A(W(m.TL[0])), zTop: Z(m.zTop), zf: Z(-m.D), aF0: A(-fx.pc_ext), aB0: A(Math.max(...xs) + fx.pc_ext), th: (W(m.TL[0]) - W(m.TR[0])) / 100, polys, form: 0, pipe: null, M: m, A: x => A(x), Z: z => Z(z) };
    },
    orig: { model: R => mdl(R), prims: m => TCO_T.rcbox.prims(m),
      sec: m => [sp(WP(m.fnd), '#ffe600', 'rgba(255,230,0,0.12)', 1.6), sp(WP(m.pc), '#94a3b8', null, 1.0)].concat(m.boxes.map(b => sp(WP(b), '#38bdf8', 'rgba(74,222,128,0.18)', 1.2))) },
    qty(G) { const Q = G.M.Q, o = {}; IT.forEach(([k]) => { o[k] = Q[k] || 0; }); return o; },
    dims() { return {}; },
    checks(p) { const m = mdl(p); return [
      { ok: m.N <= 6, text: `疊砌 ${m.N} 層、每層退縮 ${m.p.W_step} cm、後傾 ${m.p.tiltDeg}°；河床以上高 ${(m.zTop / 100).toFixed(2)} m（原工具 4 層標註 234.6 cm，本系統依圖面幾何）` },
      { ok: m.p.H_fnd_sub >= 100, text: `基礎埋深 ${m.p.H_fnd_sub} cm（≧ 100 cm）` },
      { ok: W(m.boxes[0][0][0]) <= m.p.W_stem_bot + m.p.W_ledge + 1e-6, text: `第 1 層植生塊後緣 ${W(m.boxes[0][0][0]).toFixed(1)} cm ${W(m.boxes[0][0][0]) <= m.p.W_stem_bot + m.p.W_ledge + 1e-6 ? '落在' : '超出'}懸臂承托台（${m.p.W_stem_bot + m.p.W_ledge} cm）內` }]; }
  });
})();
/* ---------------- 四、生物通道第二型：RC 護岸開口式動物通道（rv.bios 內 kind:'gap'） ----------------
   在既有 RC 護岸開缺口（寬＝2×側牆底厚＋通道寬），兩側新設混凝土側牆、中間土包袋坡道；護岸不刪除，缺口部分列「扣除」數量
   高度隨所屬護岸：護岸斜面高＝護岸高−胸牆高，斜面水平投影＝護岸坡度×斜面高（可取消連動改手動） */
var V87_NEWKIND = null;
(function () {
  if (typeof bioGeo !== 'function' || !TCO_B.anim) return;
  const AD = {}; TCO_B.anim.PR.forEach(q => { AD[q.k.slice(2)] = +q.def; }); AD.hAuto = true;
  const isGap = b => !!(b && b.kind === 'gap');
  const gapP = (b, R) => { const p = Object.assign({}, AD, b.p || {}); if (p.hAuto !== false && R) { const H = Math.max(0.5, R.H) * 100; p.H_slope = Math.max(30, Math.round(H - p.H_top)); p.L_base_exp = Math.max(0, Math.round((R.n || 0) * p.H_slope - p.L_chamfer)); } return p; };
  const rampOnly = (rv, fn) => { const B = rv.bios; rv.bios = (B || []).filter(b => !isGap(b)); try { return fn(); } finally { rv.bios = B; } };
  const _bn = bioNorm; bioNorm = function (b) { const o = _bn(b); if (isGap(b)) { o.kind = 'gap'; o.p = Object.assign({}, AD, b.p || {}); } return o; };
  const _cl = rvCleanArr; rvCleanArr = function (arr) { const a = _cl(arr); a.forEach((o, i) => { const r = (arr || [])[i]; if (r && r.bios && o.bios) o.bios.forEach((x, j) => { if (r.bios[j] && r.bios[j].kind) x.kind = r.bios[j].kind; }); }); return a; };
  const _bg = bioGeo; bioGeo = function (rv, b) {
    if (!isGap(b)) return _bg(rv, b);
    const R = rvAt(rv, b.sta, rvEDefAt(b.sta)), H = Math.max(0.5, R.H) * 100, P = gapP(b, R), m = TCO_B.anim.model(P), s0 = b.sta, s1 = b.sta + m.Wt / 100;
    return { R, H, Hn: P.H_slope, Lr: m.sRE, Lt: m.Wt, tw: m.Tb, twAuto: false, tw0: null, s0, s1, a: Math.min(s0, s1), b: Math.max(s0, s1), zr: () => H, A: m.As, conc: m.Vw, form: m.Fw, n: R.n || 0.3, e: R.e,
      brk: [s0, s0 + m.Tb / 100, s1 - m.Tb / 100].map(v => +v.toFixed(3)), gap: true, m, P };
  };
  const _rb = bioRebar; bioRebar = function (g, b) {
    if (!isGap(b)) return _rb(g, b); const R = g.m.rb.map(r => ({ part: '側牆', role: r.role, bar: r.bar, sp: g.P.S_rebar, nb: r.nb, L: r.L, len: r.nb * r.L / 100, kg: r.kg })), bars = [...new Set(R.map(r => r.bar))];
    return { R, c: 0, bars, kg: k => R.filter(r => r.bar === k).reduce((a, r) => a + r.kg, 0), tot: R.reduce((a, r) => a + r.kg, 0) };
  };
  const _cp = bioCutPieces; bioCutPieces = function (pcs, rv) { return rampOnly(rv, () => _cp(pcs, rv)); };
  const _qr = bioQtyRows; bioQtyRows = function (rv) { return rampOnly(rv, () => _qr(rv)); };
  const _wg = rvWings; rvWings = function (rv) { return rampOnly(rv, () => _wg(rv)); };
  const _in = bioIn; bioIn = function (sd, s, strict) { return _in(sd, s, strict).filter(o => !isGap(o.b)); };
  const _se = bioSecEx; bioSecEx = function (sec, rv, b) { return isGap(b) ? null : _se(sec, rv, b); };
  const _pp = bioPlanPolys; bioPlanPolys = function (rv, b) {
    if (!isGap(b)) return _pp(rv, b); const g = bioGeo(rv, b), sg = rvSg(rv), P = (s, o) => { const q = getPointAndNormalAtStation(s); return q ? [q.x - q.nx * sg * o, q.y - q.ny * sg * o] : null; };
    const a0 = g.e, a1 = g.e + g.m.sRE / 100, sm = (g.a + g.b) / 2, tw = g.tw / 100;
    return { box: [P(g.a, a0), P(g.b, a0), P(g.b, a1), P(g.a, a1)].filter(Boolean), ramp: [P(sm, a0), P(sm, a1)].filter(Boolean), walls: [[P(g.a + tw, a0), P(g.a + tw, a1)], [P(g.b - tw, a0), P(g.b - tw, a1)]], g, mid: P(sm, a1 + 0.6) };
  };
  const _si = bioSecItems; bioSecItems = function (sec) {
    const out = _si(sec).filter(K => !isGap(K.b));
    bioAll().forEach(({ rv, b }) => { if (!isGap(b)) return; const g = bioGeo(rv, b); if (sec.sta < g.a - 1e-6 || sec.sta > g.b + 1e-6) return; const G = rvGeomSec(sec, rv.side); if (!G) return;
      const zc = G.zc, e = G.R.e, m = g.m, X = x => e + x / 100, Z = y => zc + (y - g.P.H_base) / 100;
      out.push({ rv, b, g, sg: G.sg, zc, poly: m.wall.map(([x, y]) => [X(x), Z(y)]), tread: [[X(0), Z(m.yBT)], [X(m.sRE), Z(m.ySL)]], zt: Z(m.ySL) }); });
    return out;
  };
  const _sp = bioStdPrims; bioStdPrims = function (rv, b) {
    if (!isGap(b)) return _sp(rv, b); const g = bioGeo(rv, b), P = tcoStdPrims(TCO_B.anim.prims(g.P), 0.01, 0, 0, 'STD_'), bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    P.forEach(o => { if (o.t === 't') { bb.x0 = Math.min(bb.x0, o.x); bb.x1 = Math.max(bb.x1, o.x + o.s.length * o.h); bb.y0 = Math.min(bb.y0, o.y - o.h); bb.y1 = Math.max(bb.y1, o.y + o.h); } else (o.p || []).forEach(v => { bb.x0 = Math.min(bb.x0, v[0]); bb.x1 = Math.max(bb.x1, v[0]); bb.y0 = Math.min(bb.y0, v[1]); bb.y1 = Math.max(bb.y1, v[1]); }); });
    const TH = Math.max(0.08, (bb.x1 - bb.x0) / 120); P.push({ t: 't', x: bb.x0, y: bb.y1 + TH * 2, h: TH * 1.4, s: `${b.name}　RC 護岸開口式動物通道（${rv.side === 'L' ? '左岸' : '右岸'} ${formatStation(g.a)}～${formatStation(g.b)}）`, c: '#ffd08a', a: 30, ly: 'STD_TITLE', al: 'l', va: 'b', rot: 0 }); bb.y1 += TH * 4;
    return { P, bb };
  };
  const gapRows = (rv, b) => bioGeo(rv, b).m.rows;
  const _sh = bioSheet; bioSheet = function () {
    const S = _sh(); if (!S) return S; const G = bioAll().filter(x => isGap(x.b)); if (!G.length) return S; const names = new Set(G.map(x => x.b.name)), r3 = v => Math.round(v * 1000) / 1000;
    S.rows = S.rows.filter((r, i) => i < 2 || !names.has(r[0]));
    G.forEach(({ rv, b }) => { const g = bioGeo(rv, b), nm = rvShort ? rvShort(rv) : rv.side, rg = `${formatStation(g.a)}～${formatStation(g.b)}`; gapRows(rv, b).forEach(q => S.rows.push([b.name, nm, rg, q.it, q.u === '袋' ? q.v : r3(q.v), q.u, `${q.fx}（開口式，依圖面幾何）`])); });
    return S;
  };
  if (typeof ttWorks === 'function') { const _tw = ttWorks; ttWorks = function (curOnly) { const W = _tw(curOnly); try { bioAll().forEach(({ rv, b }) => { if (!isGap(b)) return; W.forEach(w => { if (w.cat === '生物通道' && String(w.name).indexOf(b.name) === 0) { w.rows = gapRows(rv, b).map(q => ({ it: q.it, u: q.u, v: q.v })); w.sub = 'RC 護岸開口式動物通道（' + w.sub + '）'; } }); }); } catch (e) { console.error(e); } return W; }; }
  const _pl = bioPlace; bioPlace = function (side, sta, rv0) { const k = V87_NEWKIND; V87_NEWKIND = null; const r = _pl(side, sta, rv0); if (r && k === 'gap') { const f = bioFind(BIO_SEL); if (f && !isGap(f.b) && state.dzTool !== 'x') { f.b.kind = 'gap'; f.b.p = Object.assign({}, AD); f.b.name = f.b.name.replace('生物通道', '動物通道'); bioRefresh(); } } return r; };
  window.v87BioNewGap = function () { V87_NEWKIND = 'gap'; bioPick('new'); V87_NEWKIND = 'gap'; };
  const _set = bioSet; bioSet = function (k, v) {
    const f = bioFind(BIO_SEL) || bioAll()[0]; if (!f) return;
    if (k === 'kind') { pushUndoSnapshot(); if (v === 'gap') { f.b.kind = 'gap'; f.b.p = Object.assign({}, AD); } else { delete f.b.kind; f.b.p = Object.assign({}, BIO_DEF); } bioRefresh(); return; }
    if (k === 'hAuto') { pushUndoSnapshot(); f.b.p.hAuto = !!v; bioRefresh(); return; }
    return _set(k, v);
  };
  const _ui = bioUI; bioUI = function () {
    _ui(); const d = document.getElementById('bioBox'); if (!d) return; const ab = d.querySelector('.rvab'); if (!ab) return;
    const bt = ab.querySelector('div'); if (bt && !d.querySelector('#v87GapAdd')) bt.insertAdjacentHTML('beforeend', `<button class="btn magenta" id="v87GapAdd" onclick="v87BioNewGap()" title="RC 護岸開缺口設置動物通道（原工具移植）：在平面圖點護岸位置">📍 新增開口式動物通道</button>`);
    const f = bioFind(BIO_SEL) || bioAll()[0]; if (!f) return; const { rv, b } = f, grid = ab.querySelector('div[style*="grid-template-columns:1fr auto"]'); if (!grid) return;
    const kindSel = `<span>型式</span><select class="input-select" onchange="bioSet('kind',this.value)"><option value="ramp"${isGap(b) ? '' : ' selected'}>坡道式（沿護岸）</option><option value="gap"${isGap(b) ? ' selected' : ''}>開口式（RC 護岸缺口）</option></select>`;
    if (!isGap(b)) { grid.insertAdjacentHTML('afterbegin', kindSel); return; }
    const g = bioGeo(rv, b), P = g.P, inp = (k, v, st) => `<input type="number" class="input-num" style="width:64px;" step="${st || 1}" value="${v}" onchange="bioSet('p.${k}',this.value)">`, au = P.hAuto !== false;
    const kv = grid.innerHTML.split('<span>坡道方向</span>')[0];
    grid.innerHTML = kindSel + kv.replace(/^[\s\S]*?(<span>名稱<\/span>)/, '$1') + `<span title="勾選：護岸斜面高＝護岸高−胸牆高、斜面水平投影＝護岸坡度×斜面高">高度隨所屬護岸</span><input type="checkbox"${au ? ' checked' : ''} onchange="bioSet('hAuto',this.checked)">`
      + TCO_B.anim.PR.map(q => { const k = q.k.slice(2), dis = au && (k === 'H_slope' || k === 'L_base_exp'); return `<span>${q.nm}</span>${dis ? `<input type="number" class="input-num" style="width:64px;" value="${P[k]}" disabled title="隨護岸">` : inp(k, P[k], q.st)}`; }).join('');
    const info = grid.nextElementSibling; if (info) info.innerHTML = `所屬：${rvShort ? rvShort(rv) : ''}　範圍 ${formatStation(g.a)}～${formatStation(g.b)}（缺口寬 ${g.m.Wt} cm）<br>` + g.m.rows.map(q => `${q.it} ${q.u === '袋' ? q.v : rvF(q.v, 2)} ${q.u}`).join('<br>');
  };
})();
/* ---------------- 五、控制點 C4：專案座標整體換算為 TWD97 ----------------
   以目前控制點套合（須勾「比例固定 1」：只平移＋旋轉，里程、長度、面積都不變）把地形測點、底圖 DXF 線與文字、中心線（含多條）、
   IP 表位置、崩塌地案件（整治區、基準線、坡面牆、剖面線）、獨立基線排水溝／路面、控制點專案座標一起換算；高程不變。
   換算後控制點變成「專案座標＝TWD97」，底圖、DEM 不再需要套合。可按「還原換算前座標」回到換算前（本次開啟期間有效） */
const V87_C4 = { bak: null, info: '' };
function v87C4Xf(o, f) {
  const P = q => { if (q && Number.isFinite(q.x) && Number.isFinite(q.y)) { const t = f(q.x, q.y); q.x = t.E; q.y = t.N; } };
  const A = a => (a || []).forEach(q => { if (Array.isArray(q) && Number.isFinite(q[0]) && Number.isFinite(q[1])) { const t = f(q[0], q[1]); q[0] = t.E; q[1] = t.N; } });
  const D = o.data; let n = 0; const cnt = a => { n += (a || []).length; };
  (D.points || []).forEach(P); cnt(D.points); (D.rawCadPolys || []).forEach(pl => { (pl.pts || []).forEach(P); cnt(pl.pts); }); (D.rawCadTexts || []).forEach(P); cnt(D.rawCadTexts); (D.axisNodes || []).forEach(P); cnt(D.axisNodes); P(D.ipTableWorldPos);
  (D.cls || []).forEach(c => { if (c && c.d) { (c.d.axisNodes || []).forEach(P); cnt(c.d.axisNodes); P(c.d.ipTableWorldPos); } });
  const Z = D.dz; if (Z) { (Z.cases || []).forEach(c => { [c.zone, c.bl].concat((c.swalls || []).map(w => w.pts), (c.secs || []).map(w => w.pts)).forEach(a => { A(a); cnt(a); }); });
    (Z.ctrl || []).forEach(c => { if (c && Number.isFinite(c.px) && Number.isFinite(c.py)) { const t = f(c.px, c.py); c.px = t.E; c.py = t.N; } }); if (Z.bm) Z.bm.fix1 = true; }
  if (D.dn && D.dn.list) D.dn.list.forEach(d => { A(d.pts); cnt(d.pts); });
  if (D.cam2D) D.cam2D = null;
  return n;
}
function v87C4Go() {
  const G = dzGeo(); if (!G.ok) { alert('尚未定位：請先輸入控制點（比例固定 1 時 1 點即可平移，2 點以上可求旋轉）。'); return; }
  if (!G.fix) { alert('請先勾選「比例固定 1」再換算。\n換算只做平移＋旋轉，里程、長度、面積才不會變；若比例不固定，所有樁號會跟著縮放。'); return; }
  const DG = ctlDiag(G), bad = DG.bad.map(k => `點${k + 1}`), w = (G.warn || []).slice();
  if (!confirm(`把整個專案座標換算為 TWD97？\n\n套合：${G.n} 點，旋轉 ${G.rot.toFixed(4)}°，均方根誤差 ${G.rms.toFixed(2)} m\n${bad.length ? `⚠ 可疑控制點：${bad.join('、')}（建議先停用再換算）\n` : ''}${w.length ? '⚠ ' + w.join('\n⚠ ') + '\n' : ''}\n地形、底圖、中心線、崩塌地與獨立基線都會一起平移旋轉；里程、高程、各結構物與數量不變。\n換算後請另存新檔。`)) return;
  const bak = JSON.stringify(collectProject()), o = JSON.parse(bak), f = G.f, n = v87C4Xf(o, f), nm = typeof projName === 'string' ? projName : '';
  try { applyProject(o, nm); } catch (e) { alert('換算失敗：' + e.message); try { applyProject(JSON.parse(bak), nm); } catch (e2) { } return; }
  V87_C4.bak = bak; V87_C4.info = `已換算 ${n} 個平面座標點（${G.n} 點套合，旋轉 ${G.rot.toFixed(4)}°，均方根誤差 ${G.rms.toFixed(2)} m）`;
  try { if (typeof viewFit === 'function') viewFit(); } catch (e) { }
  try { dzMapUI(); } catch (e) { } updateStatus(`🧭 ${V87_C4.info}。專案座標現在就是 TWD97，請另存新檔；要回復可按控制點卡片的「還原換算前座標」。`);
}
function v87C4Undo() {
  if (!V87_C4.bak) return; if (!confirm('還原到換算前的專案座標？（換算後所做的修改也會一起還原）')) return;
  const nm = typeof projName === 'string' ? projName : ''; applyProject(JSON.parse(V87_C4.bak), nm); V87_C4.bak = null; V87_C4.info = ''; try { dzMapUI(); } catch (e) { } updateStatus('↺ 已還原換算前的專案座標。');
}
(function () {
  if (typeof ctlSummaryHTML !== 'function') return;
  const _s = ctlSummaryHTML; ctlSummaryHTML = function () {
    let h = _s(); const G = dzGeo(), id = G.ok && Math.abs(G.rot) < 1e-9 && G.rms < 1e-6 && Math.hypot(G.f(0, 0).E, G.f(0, 0).N) < 1e-6;
    h += `<div id="v87C4" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px;font-size:11px;">
      <button class="btn" ${G.ok && !id ? '' : 'disabled'} onclick="v87C4Go()" title="以目前套合（須比例固定 1）把地形、底圖線、中心線、崩塌地、獨立基線一起平移旋轉成 TWD97；里程、高程、數量不變">🧭 專案座標換算為 TWD97</button>
      ${V87_C4.bak ? '<button class="btn" onclick="v87C4Undo()" title="回到換算前的專案（本次開啟期間有效）">↺ 還原換算前座標</button>' : ''}
      <span style="color:var(--text-muted);">${V87_C4.info ? escAttr(V87_C4.info) : (G.ok ? (G.fix ? '換算只平移＋旋轉' : '須先勾「比例固定 1」') : '先完成控制點套合')}</span></div>`;
    return h;
  };
})();
