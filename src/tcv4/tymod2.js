/* ============================================================================
   v5.5 原圖移植型式：0404-1 土石籠護岸、0403-1 箱籠護岸、0406-1 三明治砌石護岸
   計算（computeModel）與繪圖（renderCAD）皆取自使用者原工具（ormod2.js，由 gen_or2.py 自動抽出）
   座標：原圖 cm，x 往河道為正、y 向上；本系統 a＝距中心線（往岸側為正），z＝高程
   層數型式（土石籠／箱籠）：高度＝層數×單層高，固定層數；加高＝加幾層（整數）；埋深＝df×(1＋k_df)
   ============================================================================ */
function tcoIn(RR, id, fb) { const v = parseFloat(RR ? RR[id.slice(4)] : undefined); return Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : fb; }
function tcoSel(RR, id, d) { const v = RR ? RR[id] : undefined; return (v === undefined || v === null || v === '') ? d : String(v); }
const TCO_MC = new Map();
function tcoModel(key, inp, keys) {   // 原工具 computeModel（快取）
  const k = key + '|' + keys.map(q => inp[q]).join(','); let m = TCO_MC.get(k);
  if (!m) { m = TCO_T[key].model(inp); if (TCO_MC.size > 600) TCO_MC.clear(); TCO_MC.set(k, m); }
  return m;
}
const tcoR4 = v => Math.round(v * 1e4) / 1e4;
function tcoCross(pl, y) {   // 折線 pl 與水平線 y 的第一個交點 x
  for (let i = 0; i + 1 < pl.length; i++) { const a = pl[i], b = pl[i + 1]; if ((a[1] - y) * (b[1] - y) <= 0 && Math.abs(b[1] - a[1]) > 1e-9) return a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); }
  return null;
}
function tcoMono(face) { for (let i = 1; i < face.length; i++) face[i][0] = Math.max(face[i][0], face[i - 1][0]); return face; }
/* 層數型式（土石籠／箱籠）幾何 */
function tcoLayGeo(R, zc, m) {
  const L = m.layersInfo, F = []; L.forEach(l => F.push(l.ptFrontBot, l.ptFrontTop));
  const bx = m.basePoly.map(q => q[0]), by = m.basePoly.map(q => q[1]), front = [[Math.max(...bx), Math.min(...by)], [Math.max(...bx), F[0][1]]].concat(F);
  const xToe = tcoCross(front, m.y_bed) ?? F[0][0];
  const A = x => R.e + (xToe - x) / 100, Z = y => zc + (y - m.y_bed) / 100, P = pts => pts.map(([x, y]) => [A(x), Z(y)]);
  const polys = L.map(l => ({ m: 'stone', pts: P([l.ptBackBot, l.ptFrontBot, l.ptFrontTop, l.ptBackTop]) }));
  polys.push({ m: 'conc', pts: P(m.basePoly) });
  if (m.gravelPoly && m.gravelPoly.length > 2) polys.push({ m: 'gravel', pts: P(m.gravelPoly) });
  if (m.topSandPoly && m.topSandPoly.length > 2) polys.push({ m: 'gravel', pts: P(m.topSandPoly) });
  const top = L[L.length - 1], face = [[R.e, zc]];
  front.forEach(q => { if (q[1] > m.y_bed + 1e-6) face.push([A(q[0]), Z(q[1])]); });
  face.push([A(top.ptBackTop[0]), Z(top.ptBackTop[1])]); const a0b = Math.max(A(m.gravTopLeft[0]), A(top.ptBackTop[0])); face.push([a0b, Z(m.gravTopLeft[1])]);
  const yLo = Math.min(...by) - (m.t_pc || 0), xs = bx.concat(m.gravBotLeft ? [m.gravBotLeft[0]] : []);
  return { face: tcoMono(face), a0: A(top.ptFrontTop[0]), a0b, zTop: Z(top.ptFrontTop[1]), zf: Z(yLo), aF0: A(Math.max(...bx) + (m.w_pc || 0)), aB0: A(Math.min(...xs) - (m.w_pc || 0)), th: (top.ptFrontTop[0] - top.ptBackTop[0]) / 100, polys, form: 0, pipe: null, M: m, A, Z };
}
/* 三明治砌石幾何 */
function tcoSandGeo(R, zc, m) {
  const bx = m.basePoly.map(q => q[0]), by = m.basePoly.map(q => q[1]), xR = Math.max(...bx), front = [[xR, Math.min(...by)], [xR, 0], m.ptFrontToe, m.ptFrontTop];
  const xToe = m.ptFrontToe[0];   // v5.6：e 量到砌石牆腳（承台前緣伸出部分在 e 的河道側）
  const A = x => R.e + (xToe - x) / 100, Z = y => zc + (y - m.y_bed) / 100, P = pts => pts.map(([x, y]) => [A(x), Z(y)]);
  const polys = [{ m: 'stone', pts: P(m.stoneLayerPoly) }, { m: 'conc', pts: P(m.midConcPoly) }, { m: 'gravel', pts: P(m.gravelPoly) }, { m: 'conc', pts: P(m.basePoly) }];
  const aF = A(tcoCross(front, m.y_bed) ?? xR), face = aF < R.e ? [[aF, zc]] : [[R.e, zc], [aF, zc]]; front.forEach(q => { if (q[1] > m.y_bed + 1e-6) face.push([A(q[0]), Z(q[1])]); });
  const a0b = A(m.ptGravBackTop[0]); face.push([a0b, Z(m.ptGravBackTop[1])]);
  const gx = m.gravelPoly.map(q => q[0]), yLo = Math.min(...by) - (m.t_pc || 0);
  return { face: tcoMono(face), a0: A(m.ptFrontTop[0]), a0b, zTop: Z(m.ptFrontTop[1]), zf: Z(yLo), aF0: A(xR + (m.w_pc || 0)), aB0: A(Math.min(...bx, ...gx) - (m.w_pc || 0)), th: (m.ptFrontTop[0] - m.ptGravBackTop[0]) / 100, polys, form: 0, pipe: null, M: m, A, Z };
}
/* 數量項目：依原工具數量表名稱對應（開挖改依地形計算，不取原表） */
function tcoQ(m, it) { const q = m.quantities.find(x => it.mt.test(x.name)); return q ? q.perM : 0; }
function tcoItems(list, key, mfn) {   // list：[k, 名稱, 單位, 比對, opt]
  return list.map(([k, it, u, mt, opt]) => ({ k, it, u, mt, opt: !!opt, fx: p => { try { const q = mfn(p).quantities.find(x => mt.test(x.name)); return q ? `原工具：${String(q.formula || '').replace(/\s*\*\s*[\d.]+\s*$/, '')}（每公尺 ${rvF(q.perM, 3)}）${q.note ? '；' + q.note : ''}` : ''; } catch (e) { return ''; } } }));
}
const TCO_RB = ['NONE', 'D13', 'D16', 'D19', 'D22'], TCO_RBS = ['D10', 'D13', 'D16'];
const TCO_SEL_LAB = { sym: '對稱階梯型', single: '單側階梯型（背部齊平）', river: '現況河床土石粒料', ac: '瀝青混凝土刨除料', NONE: '無鋼筋', YES: '設濾層盒', NO: '不設濾層盒' };
function tcoLayDef(key, extra) {   // 土石籠／箱籠共用參數
  const P = [
    { k: 'N_layer', nm: '堆疊層數 N_layer', u: '層', st: 1, def: 3, g: 'main', tip: '每段固定層數；高度＝層數×單層高（加高區段以「加幾層」表示）' },
    { k: 'N_bot', nm: '底層並排籠數 N_bot', u: '籠', st: 1, def: 3, g: 'main' },
    { k: 'B1', nm: '單一籠寬 B1', u: 'cm', st: 5, def: 100, g: 'main' },
    { k: 'H1', nm: '單一籠高 H1', u: 'cm', st: 5, def: 100, g: 'main' },
    { k: 'm_toe', nm: '前趾開挖坡 1:', u: '', st: 0.05, def: 0.45, g: 'grav', tip: '原圖值 0.45；前趾開挖三角＝½×D_embed²×坡' },
    { k: 'lap', nm: '不織布底部搭接長', u: 'cm', st: 5, def: 30, g: 'grav', tip: '原圖值 30 cm' },
    { k: 'L_gab', nm: '單一籠長 L_gab', u: 'cm', st: 10, def: 200, g: 'main' },
    { k: 'B2', nm: '每層退縮 B2', u: 'cm', st: 5, def: 50, g: 'main' },
    { k: 'alpha', nm: '整體後傾角 α', u: '°', st: 0.5, def: 5, g: 'main' },
    { k: 'sel_step_type', nm: '階梯造型', u: 'sel', def: 'sym', opt: ['sym', 'single'], g: 'main' }];
  return P.concat(extra.main || [], [
    { k: 'df', nm: '預期沖刷深 df', u: 'cm', st: 5, def: 85, g: 'grav', tip: '河床總埋深 D_embed＝df×(1＋k_df)' },
    { k: 'k_df', nm: '沖刷下埋深比 k_df', u: '', st: 0.05, def: 0.5, g: 'grav', tip: '0.2～0.5' }], extra.grav || [], [
    { k: 't_grav_top', nm: '背部透水層頂寬', u: 'cm', st: 5, def: 30, g: 'grav' },
    { k: 't_grav_bot', nm: '背部透水層底寬', u: 'cm', st: 5, def: 30, g: 'grav' },
    { k: 'w_top_fill', nm: '坡頂回填區頂面寬', u: 'cm', st: 5, def: key === 'g404' ? 160 : 150, g: 'grav' },
    { k: 't_base', nm: '混凝土基礎台厚 t', u: 'cm', st: 5, def: 50, g: 'base' },
    { k: 'B_toe', nm: '基礎台前趾外推寬', u: 'cm', st: 5, def: 0, g: 'base' },
    { k: 'B_heel', nm: '基礎台後踵外推寬', u: 'cm', st: 5, def: 0, g: 'base' },
    { k: 'X_key', nm: '止滑榫距前緣 X_key', u: 'cm', st: 5, def: 40, g: 'base' },
    { k: 'R1', nm: '梯形止滑榫深 R1 (1:3)', u: 'cm', st: 5, def: 0, g: 'base' },
    { k: 'P1', nm: '梯形止滑榫底寬 P1', u: 'cm', st: 5, def: 30, g: 'base' },
    { k: 't_pc', nm: 'PC 打底厚', u: 'cm', st: 5, def: 0, g: 'base' },
    { k: 'w_pc', nm: 'PC 打底左右外推寬', u: 'cm', st: 5, def: 10, g: 'base' },
    { k: 'sel_rebar_main', nm: '基礎配筋 (CNS 560)', u: 'sel', def: 'NONE', opt: TCO_RB, g: 'base' },
    { k: 'sel_rebar_sub', nm: '縱向副筋 (CNS 560)', u: 'sel', def: 'D13', opt: TCO_RBS, g: 'base' }]);
}
function tcoRegLayer(key, def) {
  const params = tcoLayDef(key, def.extra), keys = params.map(q => q.k).concat(['L_unit']);
  const inp = R => Object.assign({}, R, { L_unit: (R.jsp || 10) * 100, N_layer: Math.max(1, Math.min(6, Math.round(R.N_layer || 3))) });
  const mdl = R => tcoModel(key, inp(R), keys);
  tcReg({
    id: key, cat: 'rev', label: def.label, code: def.code, note: def.note, prim: 'gab', layered: true,
    groups: [{ k: 'main', t: '籠體與堆疊' }, { k: 'grav', t: '埋深、背填與覆土' }, { k: 'base', t: '混凝土基礎台、止滑榫與配筋' }],
    commonDef: { ec: 0.3, jsp: 10 },
    params,
    items: tcoItems(def.items, key, mdl),
    sync(p) { const m = mdl(p); p.H = tcoR4((m.layersInfo[m.layersInfo.length - 1].ptFrontTop[1] - m.y_bed) / 100); p.D = tcoR4(m.D_embed / 100); p.n = tcoR4(m.n_eff); return p; },
    geo(R, zc) { return tcoLayGeo(R, zc, mdl(R)); },
    orig: { model: R => mdl(R), prims: (m, o, part) => TCO_T[key].prims(m, o, part), sec: m => TCO_T[key].prims(m, {}, 'sec') },
    qty(G) { const o = {}; this.items.forEach(it => { o[it.k] = tcoQ(G.M, it); }); return o; },
    dims() { return {}; },
    checks(p) { const m = mdl(p); return [
      { ok: true, text: `高度：${m.N_layer} 層 × H1 ${m.H1} cm＝${m.H_total} cm；河床以上外露 ${rvF(p.H)} m` },
      { ok: m.k_df >= 0.2 && m.k_df <= 0.5, text: `埋深 D_embed＝df ${m.df} ×(1＋${m.k_df})＝${rvF(m.D_embed, 1)} cm（k_df ${m.k_df >= 0.2 && m.k_df <= 0.5 ? '在' : '不在'} 0.2～0.5）` },
      { ok: true, text: `臨水面等效坡度 1:${rvF(m.n_eff)}（後傾 ${m.alpha_deg}°、每層退縮 ${m.B2} cm）` }]; }
  });
}
tcoRegLayer('b403', { label: '箱籠護岸', code: '0403-1', note: '水保標準圖 0403-1（箱型石籠疊砌＋背部透水層＋地工織布；混凝土基礎台）', extra: {},
  items: [['gab', '鍍鋅/PVC低碳鋼線箱型石籠', 'm³', /箱型石籠/], ['fill', '箱籠內填塊卵石', 'm³', /內填塊卵石/], ['face', '表層及臨水面塊石人工整面', 'm²', /人工整面/], ['conc', '210 kgf/cm² 混凝土基礎台', 'm³', /混凝土基礎台/],
    ['gravel', '背部碎石級配透水層', 'm³', /透水層/], ['geo', '地工織布或不織布', 'm²', /地工織布/], ['pc', 'PC 打底混凝土', 'm³', /PC 打底/, 1], ['rebar', '基礎台與止滑榫竹節鋼筋', 'kg', /鋼筋/, 1]] });
tcoRegLayer('g404', { label: '土石籠護岸', code: '0404-1', note: '水保標準圖 0404-1（土石籠＋內襯織布袋＋袋內填河床粒料；背部透水層與坡頂覆土）',
  extra: { main: [{ k: 'bag_w', nm: '內襯織布袋寬/長', u: 'cm', st: 5, def: 105, g: 'main' }, { k: 'bag_h', nm: '內襯織布袋高', u: 'cm', st: 5, def: 110, g: 'main' }, { k: 'sel_fill_mat', nm: '織布袋填充料', u: 'sel', def: 'river', opt: ['river', 'ac'], g: 'main' }],
    grav: [{ k: 't_top_sand', nm: '坡頂覆土層厚', u: 'cm', st: 2, def: 18, g: 'grav' }] },
  items: [['gab', '鍍鋅/PVC低碳鋼線箱型土石籠網', 'm³', /土石籠網/], ['bag', '內襯土石籠織布(或不織布)袋', '只', /織布.*袋/], ['fill', '袋內拋填粒料', 'm³', /袋內拋填/], ['face', '表層及臨水面塊石人工整面', 'm²', /人工整面/],
    ['conc', '210 kgf/cm² 混凝土基礎台', 'm³', /混凝土基礎台/], ['gravel', '背部透水層與坡頂覆土回填', 'm³', /透水層/], ['pc', 'PC 打底混凝土', 'm³', /PC 打底/, 1], ['rebar', '基礎台與止滑榫竹節鋼筋', 'kg', /鋼筋/, 1]] });
/* 0406-1 三明治砌石護岸：H 連續（河床以上外露高；牆高 H_wall＝H－(H_base－D)） */
(function () {
  const key = 's406';
  const params = [
    { k: 'H', nm: '河床以上外露高 H', u: 'm', st: 0.1, def: 3.4, g: 'main', tip: '設計河床以上高度；原圖斜牆高 H_wall＝H－(基礎座高 H_base－埋深 D)，預設 300 cm' },
    { k: 'n', nm: '臨水面坡度 1:n', u: '', st: 0.05, def: 0.55, g: 'main', tip: '0.3～1.0' },
    { k: 'D', nm: '河床面下埋入深 D_embed', u: 'm', st: 0.05, def: 0.8, g: 'main', tip: '規範 ≥ 60 cm' },
    { k: 't_stone', nm: '外層混凝土砌石厚', u: 'cm', st: 5, def: 45, g: 'main' },
    { k: 't_mid_conc', nm: '中層 210 混凝土厚', u: 'cm', st: 5, def: 20, g: 'main' },
    { k: 't_grav_top', nm: '內層背填礫石頂寬', u: 'cm', st: 5, def: 20, g: 'main' },
    { k: 'weep_x', nm: '排水管外伸長', u: 'cm', st: 1, def: 15, g: 'main', tip: '原圖值 15 cm；單支長＝砌石水平厚＋混凝土水平厚＋外伸' },
    { k: 't_grav_bot', nm: '內層背填礫石底寬', u: 'cm', st: 5, def: 20, g: 'main' },
    { k: 'S_weep', nm: '∮3" PVC-B 排水管間距', u: 'cm', st: 10, def: 200, g: 'main' },
    { k: 'sel_filter_box', nm: '薄型透水濾層盒', u: 'sel', def: 'YES', opt: ['YES', 'NO'], g: 'main' },
    { k: 'B_base', nm: '基礎座總寬 B_base', u: 'cm', st: 5, def: 160, g: 'base' },
    { k: 'B_front', nm: '基礎前緣承台寬 B_front', u: 'cm', st: 5, def: 100, g: 'base' },
    { k: 'H_base', nm: '基礎座總高 H_base', u: 'cm', st: 5, def: 120, g: 'base' },
    { k: 'sel_rebar_main', nm: '主筋 (CNS 560)', u: 'sel', def: 'D16', opt: ['D13', 'D16', 'D19', 'D22', 'NONE'], g: 'base' },
    { k: 'sel_rebar_sub', nm: '副筋 (CNS 560)', u: 'sel', def: 'D13', opt: TCO_RBS, g: 'base' },
    { k: 'S_rebar', nm: '鋼筋間距', u: 'cm', st: 5, def: 20, g: 'base' },
    { k: 'X_key', nm: '止滑榫距前緣 X_key', u: 'cm', st: 5, def: 40, g: 'base' },
    { k: 'R1', nm: '梯形止滑榫深 R1 (1:3)', u: 'cm', st: 5, def: 0, g: 'base' },
    { k: 'P1', nm: '梯形止滑榫底寬 P1', u: 'cm', st: 5, def: 30, g: 'base' },
    { k: 't_pc', nm: 'PC 打底厚', u: 'cm', st: 5, def: 10, g: 'base' },
    { k: 'w_pc', nm: 'PC 打底左右外推寬', u: 'cm', st: 5, def: 10, g: 'base' }];
  const keys = params.map(q => q.k).concat(['H_wall', 'n_slope', 'D_embed', 'L_unit']);
  const inp = R => Object.assign({}, R, { H_wall: tcoR4(R.H * 100 - ((R.H_base ?? 120) - R.D * 100)), n_slope: R.n, D_embed: tcoR4(R.D * 100), L_unit: (R.jsp || 10) * 100 });
  const mdl = R => tcoModel(key, inp(R), keys);
  tcReg({
    id: key, cat: 'rev', label: '三明治砌石護岸', code: '0406-1', note: '水保標準圖 0406-1（外層混凝土砌石＋中層 210 混凝土＋內層背填礫石；五邊形基礎座、排水管）', prim: 'stone',
    groups: [{ k: 'main', t: '斜牆三層與排水' }, { k: 'base', t: '基礎座、止滑榫與配筋' }],
    commonDef: { ec: 0.3, jsp: 10 },
    params,
    items: tcoItems([['stone', '外層臨水面混凝土砌塊(卵)石', 'm³', /第1層/], ['mid', '中層 210 kgf/cm² 混凝土襯砌', 'm³', /第2層/], ['gravel', '內層背填卵礫石或級配', 'm³', /第3層/],
      ['conc', '五邊形 210 kgf/cm² 混凝土基礎座', 'm³', /基礎座$|混凝土基礎座/], ['rebar', '基礎座與斜牆竹節鋼筋', 'kg', /鋼筋/, 1], ['pipe', '∮3" PVC-B 排水管', 'm', /排水管/, 1], ['joint', '伸縮縫兼施工縫及倒角', 'm²', /伸縮縫/], ['pc', 'PC 打底混凝土', 'm³', /PC 打底/, 1]], key, mdl),
    geo(R, zc) { return tcoSandGeo(R, zc, mdl(R)); },
    orig: { model: R => mdl(R), prims: (m, o, part) => TCO_T[key].prims(m, o, part), sec: m => TCO_T[key].prims(m, {}, 'sec') },
    qty(G) { const o = {}; this.items.forEach(it => { o[it.k] = tcoQ(G.M, it); }); return o; },
    dims() { return {}; },
    checks(p) { const m = mdl(p); return [
      { ok: m.D_embed >= 60, text: `河床面下埋入深 D_embed＝${rvF(m.D_embed, 0)} cm ${m.D_embed >= 60 ? '≥ 60 cm' : '< 60 cm（不符規範）'}` },
      { ok: m.n_slope >= 0.3 && m.n_slope <= 1.0, text: `臨水面坡度 1:${rvF(m.n_slope)}（0.3～1.0）` },
      { ok: m.H_wall > 0, text: `原圖斜牆高 H_wall＝${rvF(m.H_wall, 0)} cm（＝H ${rvF(p.H * 100, 0)}－(H_base ${m.H_base}－D ${rvF(m.D_embed, 0)})）` }]; }
  });
})();
/* ============================================================================
   v5.7 0405-1／0405-2 預鑄舖排式護岸（原工具 ormod4.js，gen_or4.py 自動抽出）
   座標換算：原圖 cm，x 往岸側為正（基礎板預鑄塊前緣 x＝0）、y 向上（基礎板底 y＝0）
   0405-2：計畫河床＝基礎板預鑄塊頂（23×sy cm），e 量到基礎板前緣；斷面依原圖預鑄塊、蓋板、濾層、打底多邊形
   0405-1：原圖為雙岸對稱 R.C 箱（原圖斷面以 1/2 比例繪製），本系統每岸各算一段 → 數量取原表之半
   ============================================================================ */
Object.assign(TCO_SEL_LAB, { '0405-2': '0405-2 凹槽卡榫塊（二）', '0405-1': '0405-1 鋼索 R.C 箱（一）' });
(function () {
  const key = 'p405';
  const g2 = '0405-2 預鑄塊', g1 = '0405-1 R.C 箱';
  const params = [
    { k: 'sel_dwg_mode', nm: '標準圖配置', u: 'sel', def: '0405-2', opt: ['0405-2', '0405-1'], g: 'main', tip: '0405-2 凹槽卡榫預鑄塊（階梯鋪排）／0405-1 鋼索 R.C 箱' },
    { k: 'N_stone', nm: '下部裝石頭層數 N_stone', u: '層', st: 1, def: 3, g: 'main', tip: g2 + '：設計洪水位以下抗沖刷' },
    { k: 'N_soil', nm: '上部裝土壤層數 N_soil', u: '層', st: 1, def: 4, g: 'main', tip: g2 + '：設計洪水位以上植生' },
    { k: 'H_blk', nm: '預鑄塊總高 H_blk', u: 'cm', st: 0.5, def: 48.7, g: 'main' },
    { k: 'B_blk', nm: '預鑄塊底板寬 B_blk', u: 'cm', st: 0.5, def: 34.1, g: 'main' },
    { k: 'L_blk', nm: '預鑄塊單元長 L_blk', u: 'cm', st: 5, def: 125, g: 'main' },
    { k: 't_wall', nm: '底壁／側壁厚 t_wall', u: 'cm', st: 0.5, def: 10, g: 'main' },
    { k: 'h_lip', nm: '前趾上段高 h_lip', u: 'cm', st: 0.2, def: 15.6, g: 'main' },
    { k: 'S_back', nm: '背斜總長 S_back', u: 'cm', st: 0.5, def: 55.9, g: 'main' },
    { k: 'cap_a', nm: '頂端蓋板水平寬 a', u: 'cm', st: 0.5, def: 46.9, g: 'main' },
    { k: 'cap_b', nm: '頂端蓋板前緣高 b', u: 'cm', st: 0.5, def: 14.6, g: 'main' },
    { k: 't_cap', nm: '頂端蓋板厚 t_cap', u: 'cm', st: 0.5, def: 10, g: 'main' },
    { k: 'B_fnd', nm: '基礎板預鑄塊底寬 B_fnd', u: 'cm', st: 1, def: 56.8, g: 'main' },
    { k: 'N_rc', nm: 'R.C 箱鋪排階數 N_rc', u: '階', st: 1, def: 2, g: 'rc', tip: g1 },
    { k: 'rc_B', nm: '護岸頂部水平寬 B', u: 'cm', st: 10, def: 120, g: 'rc' },
    { k: 'rc_L', nm: '單岸總水平寬 L', u: 'cm', st: 10, def: 360, g: 'rc' },
    { k: 'm_rc', nm: '岸坡斜率 1:m_rc', u: '', st: 0.05, def: 0.7, g: 'rc' },
    { k: 'rc_hs', nm: 'R.C 箱每階垂直高', u: 'cm', st: 2, def: 148, g: 'rc', tip: '原圖值 148 cm（斷面圖 1:2 縮繪 74）' },
    { k: 'rc_t', nm: 'R.C 箱垂直坡面厚', u: 'cm', st: 2, def: 84, g: 'rc', tip: '原圖值 84 cm（斷面圖 1:2 縮繪 42）' },
    { k: 'pe_d', nm: 'PE 土包袋回填深', u: 'cm', st: 5, def: 150, g: 'rc', tip: '原圖值 150 cm' },
    { k: 'H_rc_fnd', nm: '210 混凝土基礎深 H_rc_fnd', u: 'cm', st: 10, def: 200, g: 'rc' },
    { k: 'B_rc_fnd', nm: '210 混凝土基礎寬 B_rc_fnd', u: 'cm', st: 10, def: 160, g: 'rc' },
    { k: 't_grav_top', nm: '背填碎石濾層頂寬', u: 'cm', st: 5, def: 20, g: 'base' },
    { k: 't_grav_bot', nm: '背填碎石濾層底寬', u: 'cm', st: 5, def: 20, g: 'base' },
    { k: 't_pc', nm: '210 混凝土基礎打底厚 t_pc', u: 'cm', st: 1, def: 5, g: 'base' },
    { k: 'w_pc', nm: '打底左右外推寬 w_pc', u: 'cm', st: 1, def: 5, g: 'base' },
    { k: 'X_key', nm: '止滑榫位置 X_key', u: 'cm', st: 5, def: 15, g: 'base' },
    { k: 'R1', nm: '止滑榫深 R1 (1:3)', u: 'cm', st: 5, def: 0, g: 'base' },
    { k: 'P1', nm: '止滑榫底寬 P1', u: 'cm', st: 5, def: 20, g: 'base' }];
  const keys = params.map(q => q.k).concat(['L_unit']);
  const mdl = R => tcoModel(key, Object.assign({}, R, { L_unit: Math.max(125, (R.jsp || 10) * 100) }), keys);
  const half = m => m.dwg_mode === '0405-1' ? 0.5 : 1;
  function geo(R, zc) {
    const m = mdl(R), sx = m.sx, sy = m.sy;
    if (m.dwg_mode === '0405-1') {   // 原圖 1/2 比例 → 實尺寸 ×2；x 自牆腳往岸側
      const stepH = 148, stepW = stepH * m.m_rc, th = 84, ang = Math.atan2(stepH, stepW), nx = Math.sin(ang) * th, ny = -Math.cos(ang) * th, fW = m.B_rc_fnd, fH = m.H_rc_fnd;
      const A = x => R.e + x / 100, Z = y => zc + y / 100, P = pts => pts.map(([x, y]) => [A(x), Z(y)]);
      const polys = [{ m: 'conc', pts: P([[0, 0], [-60, 0], [-60, -fH], [fW - 60, -fH], [fW - 60, -64]]) }];
      for (let k = 0; k < m.N_rc; k++) { const x1 = k * stepW, y1 = k * stepH, x2 = (k + 1) * stepW, y2 = (k + 1) * stepH; polys.push({ m: 'conc', pts: P([[x1, y1], [x2, y2], [x2 + nx, y2 + ny], [x1 + nx, y1 + ny]]) }); }
      const xt = m.N_rc * stepW, yt = m.N_rc * stepH, face = [[A(-60), zc], [A(0), zc], [A(xt), Z(yt)], [A(xt + m.rc_B), Z(yt + 30)]];
      return { face: tcoMono(face), a0: A(xt), a0b: A(xt + m.rc_B), zTop: Z(yt), zf: Z(-fH), aF0: A(-60), aB0: A(Math.max(fW - 60, xt + nx)), th: m.rc_B / 100, polys, form: 0, pipe: null, M: m };
    }
    const fx = m.B_fnd / 56.75, yBed = 23 * sy, A = x => R.e + x / 100, Z = y => zc + (y - yBed) / 100, P = pts => pts.map(([x, y]) => [A(x), Z(y)]);
    const polys = [{ m: 'conc', pts: P([[0, 0], [56.75 * fx, 0], [56.75 * fx, 10.54 * sy], [45.84 * sx, 13.39 * sy], [44.37 * sx, 10.67 * sy], [10.80 * sx, 19.44 * sy], [12.75 * sx, 26.89 * sy], [11.73 * sx, 23.00 * sy], [0, 23.00 * sy]]) }];
    const face = [[A(0), zc]];
    for (let i = 0; i < m.N_total; i++) {
      const bx = 10.80 * sx + i * m.stepDx, by = 19.44 * sy + i * m.stepDy;
      polys.push({ m: 'conc', pts: P([[bx, by], [bx + 33.57 * sx, by - 8.77 * sy], [bx + 35.04 * sx, by - 6.05 * sy], [bx + 45.95 * sx, by - 8.90 * sy], [bx + 70.87 * sx, by + 39.55 * sy], [bx + 59.96 * sx, by + 42.40 * sy], [bx + 37.89 * sx, by + 1.45 * sy], [bx + 15.34 * sx, by + 3.95 * sy], [bx + 14.33 * sx, by + 5.72 * sy], [bx + 21.71 * sx, by + 47.13 * sy], [bx + 24.93 * sx, by + 48.45 * sy], [bx + 25.64 * sx, by + 51.19 * sy], [bx + 19.56 * sx, by + 51.03 * sy], [bx + 12.82 * sx, by + 49.05 * sy]]) });
      polys.push({ m: i < m.N_stone ? 'stone' : 'gravel', pts: P([[24.93, 48.45], [21.71, 47.13], [14.03, 4.10], [37.88, 1.45], [60.68, 43.75]].map(([u, v]) => [bx + u * sx, by + v * sy])) });
      if (by + 49.05 * sy > yBed) face.push([A(bx + 12.82 * sx), Z(by + 49.05 * sy)]);
    }
    const tx = 10.80 * sx + (m.N_total - 1) * m.stepDx, ty = 19.44 * sy + (m.N_total - 1) * m.stepDy, cX = m.cap_a / 46.9, cY = m.t_cap / 10, cB = m.cap_b / 14.6;
    const cap = [[tx + 24.92 * sx, ty + 58.44 * sy], [tx + (24.92 + 48 * cX) * sx, ty + 58.44 * sy], [tx + (24.92 + 48 * cX) * sx, ty + (58.44 - 14.9 * cB) * sy], [tx + (24.92 + 37.3 * cX) * sx, ty + (58.44 - 11.8 * cB) * sy], [tx + (24.92 + 35.8 * cX) * sx, ty + (58.44 - 14.7 * cB) * sy], [tx + 24.92 * sx, ty + (58.44 - 10 * cY) * sy]];
    polys.push({ m: 'conc', pts: P(cap) });
    const bb = [56.75 * fx, 10.54 * sy], bt = [10.80 * sx + m.N_total * m.stepDx + 72.91 * cX, 19.44 * sy + m.N_total * m.stepDy + 43.53 * cY];
    if (m.t_grav_top > 0 || m.t_grav_bot > 0) polys.push({ m: 'gravel', pts: P([bb, bt, [bt[0] + m.t_grav_top, bt[1]], [bb[0] + m.t_grav_bot, bb[1]]]) });
    if (m.t_pc > 0) polys.push({ m: 'conc', pts: P([[-m.w_pc, 0], [m.B_fnd + m.w_pc, 0], [m.B_fnd + m.w_pc, -m.t_pc], [-m.w_pc, -m.t_pc]]) });
    face.push(cap[0], cap[1].map((v, i) => v)); face[face.length - 2] = [A(cap[0][0]), Z(cap[0][1])]; face[face.length - 1] = [A(cap[1][0]), Z(cap[1][1])];
    const a0b = A(Math.max(cap[1][0], bt[0] + m.t_grav_top));
    face.push([a0b, Z(cap[1][1])]);
    return { face: tcoMono(face), a0: A(cap[0][0]), a0b, zTop: Z(cap[0][1]), zf: Z(-m.t_pc - m.R1), aF0: A(-m.w_pc), aB0: A(Math.max(m.B_fnd + m.w_pc, bb[0] + m.t_grav_bot)), th: (cap[1][0] - cap[0][0]) / 100, polys, form: 0, pipe: null, M: m };
  }
  const IT = [['blk', '245 kgf/cm² 工廠預鑄混凝土塊', '塊', /工廠預鑄混凝土塊/, 1], ['fc', '基礎板及頂端蓋板預鑄塊', 'm³', /基礎板預鑄塊/, 1], ['stone', '洪水位以下凹槽回填塊石', 'm³', /凹槽回填塊石/, 1], ['soil', '洪水位以上凹槽回填植生沃土', 'm³', /植生沃土/, 1],
    ['gravel', '土坡界面天然碎石級配濾層', 'm³', /碎石級配濾層/, 1], ['pc', '210 kgf/cm² 混凝土基礎打底', 'm³', /基礎打底/, 1],
    ['rcbox', '預鑄護岸 R.C 箱體（單岸）', 'm³', /R\.C 箱體/, 1], ['rcfnd', '210 kgf/cm² 混凝土基礎台（單岸）', 'm³', /混凝土基礎台/, 1], ['rope16', 'Ø16mm 鍍鋅鋼絞索（單岸）', '處', /Ø16mm/, 1], ['rope6', 'Ø6mm 鍍鋅鋼索捆紮（單岸）', '組', /Ø6mm/, 1], ['pe', '背部 PE 土包袋鋪設及回填土（單岸）', 'm³', /PE 土包袋/, 1]];
  tcReg({
    id: key, cat: 'rev', label: '預鑄舖排式護岸', code: '0405-1／0405-2', note: '水保標準圖 0405-2（凹槽卡榫預鑄塊階梯鋪排，下層裝石、上層植生）／0405-1（鋼索 R.C 箱；原圖雙岸，本系統每岸各計一半）', prim: 'main',
    groups: [{ k: 'main', t: '配置與 0405-2 預鑄塊' }, { k: 'rc', t: '0405-1 R.C 箱' }, { k: 'base', t: '濾層、打底與止滑榫' }],
    commonDef: { ec: 0.3, jsp: 10 },
    params,
    items: tcoItems(IT, key, mdl).map(it => Object.assign(it, { fx: p => { const m = mdl(p), q = m.quantities.find(x => it.mt.test(x.name)); return q ? `原工具：${q.formula}${half(m) < 1 ? '（雙岸 ÷2）' : ''}` : ''; } })),
    sync(p) { const G = geo(Object.assign({}, p, { e: 0 }), 0); p.H = tcoR4(G.zTop); p.D = tcoR4(-G.zf); p.n = tcoR4(G.M.dwg_mode === '0405-1' ? G.M.m_rc : G.M.m_eff); return p; },
    geo,
    orig: { model: R => mdl(R), prims: (m, o, part) => TCO_T[key].prims(m, o, part) },
    qty(G) { const m = G.M, o = {}; this.items.forEach(it => { const q = m.quantities.find(x => it.mt.test(x.name)); o[it.k] = q ? q.perM * half(m) : 0; }); o.main = m.dwg_mode === '0405-1' ? o.rcbox : (o.fc || 0) + (o.blk || 0) * (m.__qf ? m.__qf.vBlk : 0.0885 * m.sx * m.sy * m.L_blk / 100); return o; },   // v6.3：單塊體積＝斷面圖多邊形實算
    dims() { return {}; },
    checks(p) { const m = mdl(p); return m.dwg_mode === '0405-1' ? [{ ok: m.m_rc >= 0.5, text: `岸坡斜率 1:${rvF(m.m_rc)}；R.C 箱 ${m.N_rc} 階` }, { ok: true, text: '原圖數量為雙岸，本段（單岸）取一半' }]
      : [{ ok: true, text: `${m.N_stone} 層裝石＋${m.N_soil} 層植生，共 ${m.N_total} 層；等效坡度 1:${rvF(m.m_eff)}；護岸總高 ${rvF(m.H_revetment, 1)} cm` }, { ok: m.t_pc >= 5, text: `基礎打底厚 t_pc＝${m.t_pc} cm（約 5 cm）` }]; }
  });
})();
