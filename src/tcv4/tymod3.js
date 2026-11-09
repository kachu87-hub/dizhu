/* ============================================================================
   v6.3 階段 3：B 型生態複合式砌石護岸（原工具 c4dc930e → ormod5.js，gen_bty.py）
   座標：原工具單側斷面 x＝自牆腳底往岸側（cm）、z＝自牆底向上；本系統 a＝R.e＋(x−m_low·D_bed)/100（設計河床處牆腳在 a＝e）
   H＝設計河床（拋石頂）以上高；上部乾砌石高 H_up＝H−(H_low−D_bed)，隨加高連動
   渠底 210 混凝土與拋石：不計入護岸（標準圖照原圖示意，數量另計）
   ============================================================================ */
(function () {
  const key = 'bty';
  const params = [
    { k: 'H', nm: '設計河床以上高 H', u: 'm', st: 0.1, def: 4.5, g: 'main', tip: '原圖 5.00 m（自牆底）＝4.5 m（自拋石頂）；上部乾砌石高 H_up＝H−(H_low−D_bed)' },
    { k: 'H_low', nm: '下部砌石護腳高 H_low', u: 'cm', st: 10, def: 200, g: 'main' },
    { k: 'H_back_vert', nm: '下部背牆直立段', u: 'cm', st: 10, def: 140, g: 'main' },
    { k: 'm_low', nm: '下部混凝土砌石坡 1:', u: '', st: 0.05, def: 0.3, g: 'main' },
    { k: 'm_up', nm: '上部乾砌石坡 1:', u: '', st: 0.1, def: 1.0, g: 'main' },
    { k: 'W_stone_low', nm: '下部混凝土砌石厚（水平）', u: 'cm', st: 5, def: 50, g: 'main' },
    { k: 'W_berm_tot', nm: '乾砌石坡趾距牆腳（水平）', u: 'cm', st: 5, def: 125, g: 'main', tip: '原圖 125＝110（坡面 60＋砌石 50）＋平台 15' },
    { k: 'B_base', nm: '基座底寬 B（牆腳至背面）', u: 'cm', st: 5, def: 220, g: 'main', tip: '原圖左岸 220、右岸 185' },
    { k: 'D_bed_sub', nm: '渠底拋石基盤總深 D_bed', u: 'cm', st: 5, def: 50, g: 'bed' },
    { k: 'kbd', nm: '拋石層占基盤深比', u: '', st: 0.02, def: 0.54, g: 'bed', tip: '原圖 0.54（拋石 27＋混凝土 23）' },
    { k: 'dt', nm: '乾砌石坡趾厚（法向）', u: 'cm', st: 2, def: 52, g: 'stone' },
    { k: 'dtr', nm: '乾砌石坡頂厚比', u: '', st: 0.05, def: 0.65, g: 'stone' },
    { k: 'q_pitch', nm: '乾砌排石 (m²/m，原圖表值)', u: '', st: 0.05, def: 0.8, g: 'stone', tip: '原圖數量表 0.80，圖面未繪位置' },
    { k: 'L_stake', nm: '疏伐木立椿長', u: 'cm', st: 10, def: 100, g: 'stone' },
    { k: 'stake_sp', nm: '立椿間距（平面）', u: 'cm', st: 1, def: 38, g: 'stone' },
    { k: 'sd_dry', nm: '乾砌石代表粒徑（繪圖排石）', u: 'cm', st: 1, def: 47, g: 'stone' },
    { k: 'sd_wet', nm: '混凝土砌石代表粒徑', u: 'cm', st: 1, def: 35, g: 'stone' },
    { k: 'sd_bed', nm: '拋石代表粒徑', u: 'cm', st: 1, def: 44, g: 'stone' },
    { k: 'N_bay', nm: '平/立面分區段數', u: '段', st: 1, def: 3, g: 'stone' },
    { k: 'L_draw', nm: '平/立面展示長度', u: 'cm', st: 50, def: 600, g: 'stone' }];
  const mdl = R => TCO_T[key].model(R);
  function geo(R, zc) {
    const m = mdl(R), off = m.m_low * m.D_bed, A = x => R.e + (x - off) / 100, Z = z => zc + (z - m.D_bed) / 100, P = q => q.map(([x, z]) => [A(x), Z(z)]);
    const polys = [{ m: 'conc', pts: P(m.conc) }, { m: 'stone', pts: P(m.band) }, { m: 'stone', pts: P(m.dry) }];
    const xt = m.W_berm + m.dxu, zt = m.H_low + m.H_up, face = [[R.e, zc], [A(m.dxl), Z(m.H_low)], [A(m.W_berm), Z(m.H_low)], [A(xt), Z(zt)], [A(xt + m.t1), Z(zt)]];
    return { face: tcoMono(face), a0: A(xt), a0b: A(xt + m.t1), zTop: Z(zt), zf: Z(0), aF0: A(0), aB0: A(Math.max(m.B, m.W_berm + m.t0)), th: m.t1 / 100, polys, form: 0, pipe: null, M: m };
  }
  const IT = [['conc', '結構用混凝土 機拌 210 kgf/cm²（背側護腳）', 'm³'], ['form', '場鑄結構混凝土用模板（金屬模板，背撐鋼板）', 'm²'], ['pitch', '乾砌排石（長徑 70~90cm）', 'm²'], ['dry', '乾砌石（長徑 40~110cm）', 'm²'],
    ['wet', '混凝土砌石（長徑 60cm 以上）', 'm²'], ['eco', '生態護坡（疏伐木利用）', 'm']];
  const FX = { conc: m => `背側混凝土斷面積（扣臨水面砌石帶）＝${rvF(m.Q.conc, 3)} m²`, form: m => `背側直立段 ${rvF(m.Hv / 100)} m`, pitch: () => '原圖數量表值（圖面未繪位置）',
    dry: m => `${rvF(m.H_up / 100)}×√(1+${m.m_up}²)`, wet: m => `${rvF(m.H_low / 100)}×√(1+${m.m_low}²)`, eco: () => '每公尺護岸 1 m',
    slab: m => `牆腳至中心線 ${rvF(m.e / 100)} m × 厚 ${rvF(m.Dc / 100)} m（扣牆面三角）`, rip: m => `牆腳至中心線 ${rvF(m.e / 100)} m × 厚 ${rvF((m.D_bed - m.Dc) / 100)} m（扣牆面三角）` };
  tcReg({
    id: key, cat: 'rev', label: 'B型生態複合式砌石護岸', code: 'B型', note: '上部 1:1 乾砌石＋下部 1:0.3 混凝土砌石護腳（背側 210 混凝土）＋坡頂疏伐木立椿；渠底拋石與 210 底版另計（不計入護岸）', prim: 'conc',
    groups: [{ k: 'main', t: '護腳與乾砌石坡' }, { k: 'bed', t: '渠底基盤（標準圖示意，不計入護岸）' }, { k: 'stone', t: '石材、立椿與繪圖' }],
    commonDef: { ec: 0.3, jsp: 10 },
    params,
    items: IT.map(([k, it, u, opt]) => ({ k, it, u, opt: !!opt, fx: p => { try { return FX[k](mdl(p)); } catch (e) { return ''; } } })),
    sync(p) { const m = mdl(p); p.D = tcR2(m.D_bed / 100); p.n = m.m_low; return p; },
    geo,
    orig: { model: R => mdl(R), prims: m => TCO_T[key].prims(m) },
    qty(G) { const Q = G.M.Q, o = {}; IT.forEach(([k]) => { o[k] = Q[k] || 0; }); return o; },
    dims() { return {}; },
    checks(p) { const m = mdl(p); return [
      { ok: m.H_up >= 50, text: `上部乾砌石高 H_up＝${rvF(m.H_up, 0)} cm（＝H ${rvF(p.H * 100, 0)}−(H_low ${m.H_low}−D_bed ${m.D_bed})）` },
      { ok: m.p.W_berm_lip >= 0, text: `乾砌石坡趾平台 ${rvF(m.p.W_berm_lip, 1)} cm（＝${m.W_berm}−坡面 ${rvF(m.dxl, 1)}−砌石 ${m.p.W_stone_low}）` },
      { ok: m.B > m.W_berm, text: `基座底寬 B ${m.B} cm；背牆直立 ${m.Hv}＋斜肩 ${m.H_low - m.Hv} cm` }]; }
  });
})();
/* ============================================================================
   v6.3 階段 3：預鑄 RC 箱複合式護岸（原工具 b130106e → ormod6.js，gen_rcb.py）
   原工具座標（cm）：牆背頂＝(0,0)、x 向河道、y 向下；本系統 a＝R.e＋(x 設計溪床處牆前緣 − x)/100、z＝zc＋(y 溪床 − y)/100
   H（設計河床以上總高）＝出水高 H_exp＋平台至坡頂高（由 RC 箱層數幾何算出），D＝溪床下埋深＋打底
   ============================================================================ */
(function () {
  const key = 'rcb';
  const P = (k, nm, u, st, def, g, tip) => ({ k, nm, u, st, def, g, tip });
  const params = [
    P('H_exposed', '溪床上出水高 H_exp', 'cm', 10, 120, 'wall'), P('H_embed', '溪床下埋深 H_embed', 'cm', 10, 180, 'wall'), P('B_base', '牆底寬 B_base', 'cm', 5, 120, 'wall'), P('W_out', '牆頂冠寬', 'cm', 5, 30, 'wall'),
    P('t_pc', '打底厚 t_pc', 'cm', 1, 5, 'wall'), P('pco', '牆打底外推寬', 'cm', 1, 6, 'wall'), P('wpy', '排水管距牆頂', 'cm', 2, 76, 'wall'), P('wsp', '3" PVC 排水管間距', 'cm', 10, 150, 'wall'),
    P('W_mid', '平台總水平寬', 'cm', 5, 105, 'plat'), P('W_in', '1:1 斜趾水平寬', 'cm', 5, 45, 'plat'), P('t_slab', '承台版厚', 'cm', 5, 50, 'plat'), P('H_beam', '基礎座底寬', 'cm', 5, 70, 'plat'), P('bmT', '間格樑厚 t', 'cm', 5, 30, 'plat', '原圖文字：承載版厚 50（底設間格樑 t=30cm@3m、深 70cm）'), P('bmS', '間格樑間距', 'cm', 50, 300, 'plat'), P('bmD', '間格樑深（版底往下）', 'cm', 5, 70, 'plat'),
    P('drop', '前趾下降深', 'cm', 5, 25, 'plat', '原圖 25'), P('pvd', '植草磚凹槽深', 'cm', 1, 8, 'plat'), P('pvo', '植草磚距斜趾', 'cm', 1, 12, 'plat'), P('pcl', '前趾打底外推（河側）', 'cm', 1, 5, 'plat'), P('pcr', '前趾打底外推（牆側）', 'cm', 1, 18, 'plat'),
    P('N_layers', '1:1 斜坡 RC 箱層數', '層', 1, 3, 'box'), P('L_box', '箱體長度 L', 'cm', 5, 120, 'box'), P('B_box', '箱體寬度 B（沿坡）', 'cm', 5, 90, 'box'), P('H_box', '箱體高度 H（垂直坡面）', 'cm', 5, 60, 'box'),
    P('T_box', '外框壁厚 T', 'cm', 1, 15, 'box'), P('t_box', '內隔牆厚 t', 'cm', 1, 10, 'box'), P('c_box', '內八角隅角 c', 'cm', 1, 10, 'box'), P('hr', '∮3" 孔半徑', 'cm', 0.1, 3.8, 'box'),
    P('bagT', '外層麻布袋層厚', 'cm', 1, 16, 'box'), P('bagH', '坡頂咖啡麻布袋單層高', 'cm', 0.5, 7.5, 'box'), P('nBolt', '每塊 M22 螺桿（組）', '', 1, 2, 'box'), P('nBag', '每塊碎石客土袋（袋）', '', 1, 8, 'box'),
    P('W_straw', '稻草蓆寬', 'cm', 10, 100, 'box'), P('N_plan_cols', '平面圖單列箱數（繪圖）', '', 1, 3, 'box'),
    P('sp', '牆與平台鋼筋間距', 'cm', 5, 30, 'rb'), P('cov', '牆鋼筋保護層', 'cm', 0.5, 5.5, 'rb'), P('w16', '∮16 單位重', 'kg/m', 0.01, 1.56, 'rb'), P('w13', '∮13 單位重', 'kg/m', 0.005, 0.995, 'rb'), P('wD10', 'D10 單位重（箱配筋表）', 'kg/m', 0.001, 0.56, 'rb'),
    P('rb1l', '箱筋 #1 長', 'm', 0.05, 0.5, 'rb'), P('rb1n', '箱筋 #1 支數', '', 1, 14, 'rb'), P('rb2l', '箱筋 #2 長', 'm', 0.05, 3.5, 'rb'), P('rb2n', '箱筋 #2 支數', '', 1, 5, 'rb'), P('rb3l', '箱筋 #3 長', 'm', 0.05, 0.5, 'rb'), P('rb3n', '箱筋 #3 支數', '', 1, 8, 'rb'),
    P('rb4l', '箱筋 #4 長', 'm', 0.05, 1.0, 'rb'), P('rb4n', '箱筋 #4 支數', '', 1, 2, 'rb'), P('rb5l', '箱筋 #5 長', 'm', 0.05, 0.9, 'rb'), P('rb5n', '箱筋 #5 支數', '', 1, 2, 'rb')];
  const mdl = R => TCO_T[key].model(R);
  function geo(R, zc) {
    const m = mdl(R), A = x => R.e + (m.xBed - x) / 100, Z = y => zc + (m.yBed - y) / 100, Pp = q => q.map(([x, y]) => [A(x), Z(y)]);
    const polys = [{ m: 'conc', pts: Pp(m.wall) }, { m: 'conc', pts: Pp(m.plat) }, { m: 'conc', pts: Pp(m.pcw) }, { m: 'conc', pts: Pp(m.pcs) }].concat(m.boxes.map(b => ({ m: 'stone', pts: Pp(b) })));
    const p = m.p, face = [[R.e, zc], [A(p.W_out), Z(0)], [A(-p.W_mid), Z(0)], [A(m.top[0]), Z(m.top[1])], [A(m.top[0]), Z(m.bankY)], [A(m.bankX - p.W_straw), Z(m.bankY)]];
    const xs = m.boxes.flat().map(q => q[0]).concat([m.fl - p.pcl]);
    return { face: tcoMono(face), a0: A(m.top[0]), a0b: A(m.bankX - p.W_straw), zTop: Z(m.bankY), zf: Z(m.Hw + p.t_pc), aF0: A(p.B_base + p.pco), aB0: A(Math.min(...xs)), th: p.W_straw / 100, polys, form: 0, pipe: null, M: m };
  }
  const IT = [['wall', '下部場鑄 RC 擋土牆 210 kgf/cm² 混凝土', 'm³'], ['plat', '中部平台與前趾 210 kgf/cm² 混凝土', 'm³'], ['pc', '210 kgf/cm² 混凝土打底', 'm³'], ['nBox', '預鑄 R.C 箱（C 型）', '塊'],
    ['bconc', '預鑄 R.C 箱 210 kgf/cm² 混凝土', 'm³'], ['bform', '預鑄 R.C 箱鋼模', 'm²'], ['brebar', '預鑄 R.C 箱鋼筋（依配筋表）', 'kg'], ['bfill', '箱內回填現場溪床料', 'm³'], ['bolt', '鍍鋅 M22 螺桿', '組'], ['bag', '碎石客土袋', '袋'],
    ['r16', '牆主筋 ∮16', 'kg'], ['r13', '牆與平台 ∮13', 'kg'], ['formS', '造型模板（牆前斜面）', 'm²'], ['formN', '普通模板（牆背、前趾）', 'm²'], ['geo', '織布鋪設', 'm²'], ['straw', '稻草蓆', 'm²'], ['paver', '植草磚', 'm²'], ['weep', '3" PVC 排水管', 'm']];
  const FX = { wall: m => `斷面 (${m.p.W_out}+${m.p.B_base})/2×${m.Hw}`, plat: m => `平台與前趾斷面 ${rvF(m.Q.plat - m.Q.beam, 3)} m²＋間格樑 ${m.p.bmT}/${m.p.bmS}×${rvF(-m.fr / 100)}×${rvF(m.p.bmD / 100)}`, pc: m => `牆底 (${m.p.B_base}+2×${m.p.pco})＋前趾 (${m.p.H_beam}+${m.p.pcl}+${m.p.pcr}) × ${m.p.t_pc}`,
    nBox: m => `${m.p.N_layers} 層 × 100/${m.p.L_box}`, bconc: m => `每塊 ${m.q.unitConc} m³`, bform: m => `每塊 ${m.q.unitForm} m²`, brebar: m => `每塊 ${m.q.unitRebar} kg`, bfill: m => `每塊 ${m.q.unitFill} m³`,
    bolt: m => `每塊 ${m.p.nBolt} 組`, bag: m => `每塊 ${m.p.nBag} 袋`, r16: m => `@${m.p.sp}，每支 ${rvF(m.L16 / (100 / m.p.sp), 2)} m`, r13: m => `牆 ${rvF(m.L13w, 1)}＋平台 ${rvF(m.L13p, 1)} m`, formS: m => `√((${m.p.B_base}−${m.p.W_out})²＋${m.Hw}²)`,
    formN: m => `牆背 ${m.Hw}＋前趾 ${rvF(m.fb - m.p.W_in, 0)} cm`, geo: m => `斜坡 ${m.p.L_slope}＋8 cm`, straw: m => `${m.p.W_straw} cm`, paver: m => `${m.p.W_mid}−${m.p.pvo} cm`, weep: m => `穿牆長×2 支 @${m.p.wsp} cm` };
  tcReg({
    id: key, cat: 'rev', label: '預鑄RC箱複合式護岸', code: 'RC箱', note: '下部場鑄 RC 擋土牆＋中部平台（植草磚）＋上部 1:1 斜坡預鑄 R.C 箱（C 型，交錯排列、M22 螺桿結合、回填溪床料＋麻布袋）', prim: 'wall',
    groups: [{ k: 'wall', t: '下部場鑄 RC 擋土牆' }, { k: 'plat', t: '中部平台與前趾' }, { k: 'box', t: '1:1 斜坡預鑄 R.C 箱' }, { k: 'rb', t: '鋼筋（牆依圖配筋、箱依配筋表）' }],
    commonDef: { ec: 0.3, jsp: 10 },
    params,
    items: IT.map(([k, it, u]) => ({ k, it, u, opt: false, fx: p => { try { return FX[k](mdl(p)); } catch (e) { return ''; } } })),
    sync(p) { const m = mdl(p); p.H = tcR2((m.yBed - m.bankY) / 100); p.D = tcR2((p.H_embed + p.t_pc) / 100); p.n = tcR2((m.p.B_base - m.p.W_out) / m.Hw); return p; },
    geo,
    orig: { model: R => mdl(R), prims: m => TCO_T[key].prims(m) },
    qty(G) { const Q = G.M.Q, o = {}; IT.forEach(([k]) => { o[k] = Q[k] || 0; }); return o; },
    dims() { return {}; },
    checks(p) { const m = mdl(p); return [
      { ok: true, text: `總高（設計河床以上）＝出水高 ${m.p.H_exposed}＋平台至坡頂 ${rvF(-m.bankY, 1)} cm（RC 箱 ${m.p.N_layers} 層沿 1:1 坡 ${m.p.L_slope} cm）` },
      { ok: m.p.H_embed >= 60, text: `溪床下埋深 ${m.p.H_embed} cm；承台底處牆厚 ${m.p.B_top} cm（幾何）` },
      { ok: m.q.unitConc > 0, text: `單塊 R.C 箱：實體 ${rvF(m.q.As, 0)} cm²×${m.p.H_box}，混凝土 ${m.q.unitConc} m³、鋼筋 ${m.q.unitRebar} kg` }]; }
  });
})();
