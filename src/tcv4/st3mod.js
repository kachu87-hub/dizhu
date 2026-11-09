/* ============================================================================
   v8.0 固床工型式新增：梳子壩（直線型）、固床工＋80φ基樁（原工具 → ormodF.js，gen_st3.py）
   放置、平面、縱橫斷面、開挖沿用固床工型式機制（外包斷面）；平面／縱斷／橫斷畫面改畫本系統幾何視圖
   數量由圖面幾何計算（取代原工具校正常數與比例縮放）；鋼筋原圖無鋼筋表者以 kg/m³ 估算並標明
   ============================================================================ */
Object.assign(SLT, {
  comb: { label: '梳子壩（直線型、N 座梳齒墩）', code: '梳子壩', noAutoFit: true,
    env: P => ({ w: P.L_total / 100, whL: P.xC / 100, whR: (P.L_total - P.xC) / 100, h2: P.H_lower / 100, h3: (P.T_base + P.D_key) / 100, d1: P.B_base / 100, s2: 0 }),
    note: '以溢流口（梳子開口）中心為界：左寬＝左翼牆＋左斜坡＋左溢流段＋開口寬/2，右寬同理（左右可不同）；上游設計高（固定側高程）＝溢流口頂（底版頂＋H_lower）；出露高＝H_lower；基礎深＝底版厚＋止滑齒牆深；順水流厚＝壩底寬 B_base＝B_mid＋H_lower×(S_up＋S_dn)。前庭漿砌石槽與半橢圓護坦在下游側',
    fitTxt: '依此樁號溪床寬設定左右溢流段寬＝(溪床寬−梳子開口寬)÷2（墩數、墩寬、開口寬不變）',
    fit(sp, W) { const P = TCO_S.comb.getParams(sp), ws = P.N_pier * P.W_pier + (P.N_pier + 1) * P.W_slot, w = Math.max(0, Math.round((W * 100 - ws) / 2)); return { p_W_ovf_L: w, p_W_ovf_R: w }; } },
  gsp: { label: '固床工＋80φ基樁（溢流口型）', code: '固床工＋基樁', noAutoFit: true,
    env: P => ({ w: P.L_total / 100, whL: P.xC / 100, whR: (P.L_total - P.xC) / 100, h2: (P.H_mid + P.H_notch) / 100, h3: (P.H_lower + P.H_key) / 100, d1: P.B_base / 100, s2: 0 }),
    note: '以溢流口中心為界：左寬＝左翼牆＋左斜坡＋溢流口/2，右寬同理（左右可不同）；上游設計高＝溢流口兩端頂（中央低水槽再低 H_notch）；出露高＝中段＋低水槽差；基礎深＝基礎版厚＋止滑齒深；順水流厚＝總底寬。基樁另計（不併入外包開挖）',
    fitTxt: '依此樁號溪床寬設定中央溢流口總寬＝溪床寬（翼牆、斜坡不變）',
    fit(sp, W) { return { p_W_weir: Math.max(100, Math.round(W * 100)) }; } }
});
(function () {
  const i = SLT_ORDER.indexOf('cdam'); SLT_ORDER.splice(i + 1, 0, 'comb'); SLT_ORDER.splice(SLT_ORDER.indexOf('n1') + 1, 0, 'gsp');
  SLT_VIEW.comb = (P, L) => ({ plan: L.V.plan, sect: L.V.sect, elev: L.V.elev });
  SLT_VIEW.gsp = (P, L) => ({ plan: L.V.plan, sect: L.V.sect, elev: L.V.elev });
  const ST3 = ['comb', 'gsp'];
  // 原圖參數卡：加上各墩高度、樁位清單
  const _ph = sltParamHTML; sltParamHTML = function (st) {
    let h = _ph(st); if (!ST3.includes(st.sty)) return h;
    h = h.replace('📏 依溪床寬設箱籠數', st.sty === 'comb' ? '📏 依溪床寬設溢流段寬' : '📏 依溪床寬設溢流口寬');
    return h + (st.sty === 'comb' ? st3CombUI(st) : st3GspUI(st));
  };
  const _fw = sltFitW; sltFitW = function () {
    const st = state.structs[state.structSel]; if (!sltOn(st) || !ST3.includes(st.sty)) return _fw();
    const W = sltBedW(st); if (!W) { updateStatus('⚠ 找不到此樁號的溪床寬（兩岸護岸或設計河寬）。'); return; }
    pushUndoSnapshot(); st.sp = Object.assign({}, st.sp, SLT[st.sty].fit(st.sp, W)); sltSync(st); st._it = 0; ST_SIG = ''; rebuildAlignmentAndSections();
    const P = sltRun(st).P;
    updateStatus(`📏 ${st.name}：依溪床寬 ${rvF(W)} m 設定` + (st.sty === 'comb' ? `左右溢流段寬 ${st.sp.p_W_ovf_L} cm → 溢流寬 ${P.W_weir} cm（含梳子開口 ${P.W_slit} cm）。` : `溢流口總寬 ${P.W_weir} cm。`));
  };
  const _ci = catItems; catItems = function () {
    const A = _ci();
    A.forEach(it => { if (it.id === 'sl:comb') Object.assign(it, { g: '1', mat: ['混凝土', '漿砌塊石'], alias: '梳子壩 透過性防砂壩 開口壩 梳齒墩', sub: '原圖移植（數量依幾何）' });
      if (it.id === 'sl:gsp') Object.assign(it, { mat: ['混凝土', '鋼筋', '基樁'], alias: '基樁 樁基礎 場鑄樁 80cm 固床工', sub: '原圖移植（數量依幾何）' }); });
    return A;
  };
})();
function st3CombUI(st) {
  const P = sltRun(st).P;
  return `<div style="margin-top:6px;display:grid;grid-template-columns:1fr;gap:3px;font-size:11px;">
    <label style="display:flex;justify-content:space-between;align-items:center;gap:6px;"><span title="各座梳齒墩高度（cm），由左到右以逗號分隔；留空＝兩端墩＝H_lower、中間墩＝H_upper">各墩高度（左→右，cm）</span><input type="text" class="input-num" style="width:120px;" value="${P.pierHeights.join(',')}" onchange="st3SetList('__ph',this)"></label>
    <div style="color:var(--text-muted);">壩長 ${P.L_total} cm、溢流寬 ${P.W_weir} cm（開口 ${P.N_pier + 1} 孔×${P.W_slot}＋墩 ${P.N_pier}×${P.W_pier}）、壩底寬 ${rvF(P.B_base / 100)} m</div></div>`;
}
function st3GspUI(st) {
  const P = sltRun(st).P, auto = P.pmode === 'AUTO', up = P.piles.filter(q => q.row === 0).map(q => Math.round(q.x - P.xC)), dn = P.piles.filter(q => q.row === 1).map(q => Math.round(q.x - P.xC));
  return `<div style="margin-top:6px;display:grid;grid-template-columns:1fr;gap:3px;font-size:11px;">
    <label style="display:flex;justify-content:space-between;align-items:center;gap:6px;"><span title="上游排樁位（距溢流口中心 cm，左負右正），逗號分隔">上游排樁位</span><input type="text" class="input-num" style="width:150px;" value="${up.join(',')}" ${auto ? 'disabled' : ''} onchange="st3SetList('__pu',this)"></label>
    <label style="display:flex;justify-content:space-between;align-items:center;gap:6px;"><span title="下游排樁位（距溢流口中心 cm，左負右正），逗號分隔">下游排樁位</span><input type="text" class="input-num" style="width:150px;" value="${dn.join(',')}" ${auto ? 'disabled' : ''} onchange="st3SetList('__pd',this)"></label>
    <div style="display:flex;gap:4px;flex-wrap:wrap;"><button class="btn" onclick="st3PileToList()" title="把目前（自動排樁）的樁位寫入清單，之後可逐支修改">↧ 目前樁位轉為清單</button><button class="btn" onclick="st3PileReset()" title="清單恢復原圖 22 支樁位">↺ 原圖樁位</button></div>
    <div style="color:var(--text-muted);">基樁 ${P.piles.length} 支（上游排 ${up.length}、下游排 ${dn.length}）；${auto ? '自動排樁中，清單不可改' : '依清單'}</div></div>`;
}
function st3SetList(k, el) {
  const st = state.structs[state.structSel]; if (!sltOn(st)) return;
  const a = String(el.value).split(/[,，、\s]+/).map(x => parseFloat(x)).filter(Number.isFinite);
  pushUndoSnapshot(); st.sp = Object.assign({}, st.sp); if (a.length) st.sp[k] = a; else delete st.sp[k];
  if (k === '__ph' && a.length) st.sp.p_N_pier = a.length;
  sltSync(st); st._it = 0; ST_SIG = ''; rebuildAlignmentAndSections();
}
function st3PileToList() {
  const st = state.structs[state.structSel]; if (!sltOn(st) || st.sty !== 'gsp') return; const P = sltRun(st).P;
  pushUndoSnapshot(); st.sp = Object.assign({}, st.sp, { p_pmode: 'LIST', __pu: P.piles.filter(q => q.row === 0).map(q => Math.round(q.x - P.xC)), __pd: P.piles.filter(q => q.row === 1).map(q => Math.round(q.x - P.xC)) });
  sltSync(st); st._it = 0; ST_SIG = ''; rebuildAlignmentAndSections();
}
function st3PileReset() {
  const st = state.structs[state.structSel]; if (!sltOn(st) || st.sty !== 'gsp') return;
  pushUndoSnapshot(); st.sp = Object.assign({}, st.sp, { p_pmode: 'LIST' }); delete st.sp.__pu; delete st.sp.__pd; sltSync(st); st._it = 0; ST_SIG = ''; rebuildAlignmentAndSections();
}
