/* ============================================================================
   v5.6 固床工型式：一般固床工（矩形，原有）＋原圖移植 0607-1 石樑、6-06 嵌石、0608-1 預鑄拱型
   計算與標準圖取自使用者原工具（ormod3.js，gen_or3.py 自動抽出）；放置、平面、縱橫斷面、地形開挖
   以「外包斷面」（全長 w、出露高 h2、基礎深 h3、厚 d1、下游坡 s2）套用原有固床工機制
   st.sty＝型式代號；st.sp＝原工具參數（鍵＝原工具欄位 id，單位 cm／°）
   ============================================================================ */
const SLT = {
  gen: { label: '一般固床工（矩形、現場混凝土）', code: '' },
  r0607: { label: '石樑固床工', code: '0607-1', wKey: 'p_W_bed',
    env: P => ({ w: P.W_bed / 100, h2: P.H_drop / 100, h3: Math.max(0.1, (P.d_main - P.H_drop) / 100), d1: 1.25 * P.d_main / 100, s2: 0 }),
    note: '全長＝溪床計畫寬 W_bed；出露高＝上下游河床落差 ΔH_drop；基礎深＝主力石高 d − ΔH_drop；順水流厚＝1.25 d（墊石長）' },
  e606: { label: '嵌石固床工', code: '6-06', wKey: 'p_W_weir',
    env: P => ({ w: P.W_weir / 100, h2: P.dH_slope / 100, h3: P.t_slab / 100, d1: P.B_up / 100, s2: P.slope_n }),
    note: '全長＝橫向總寬 W_weir；出露高＝斜坡落差 L/n；頂寬＝上游基座寬 B_up；下游坡＝1:n；基礎深＝底板厚 t_slab',
    extra(P) { const W = P.W_weir / 100, v = ((P.B_up * Math.max(0, P.D_up - P.t_slab)) + (P.B_dn * Math.max(0, P.D_dn - P.t_slab))) / 1e4 * W;
      return [{ it: '上下游基座加深開挖（原工具基座斷面，外包斷面以外）', u: 'm³', v, fx: `[B_up ${P.B_up}×(D_up ${P.D_up}−t ${P.t_slab}) ＋ B_dn ${P.B_dn}×(D_dn ${P.D_dn}−t ${P.t_slab})]/10⁴ × W ${rvF(W)} ＝ ${rvF(v, 3)}` }]; } },
  a0608: { label: '預鑄拱型固床工（標準基礎型）', code: '0608-1',
    env: P => ({ w: P.L_total / 100, h2: P.H_eff / 100, h3: P.D_fnd / 100, d1: P.BL / 100, s2: 0 }),
    note: '全長＝左W0＋左L2＋中W0＋右L2＋右W0（左右可分開）；出露高＝層數×單層高；基礎深 D_fnd；順水流厚＝基礎厚 BL',
    fitTxt: '雙拱模組：依此樁號溪床寬反算左右內弦長 L2＝(溪床寬−左W0−中W0−右W0)/2（180～600 cm）',
    fit(sp, W) { const D = TCO_S.a0608.DEF, eq = String(sp.p_LReq ?? D.p_LReq) !== '0', W0 = +(sp.p_W0 ?? D.p_W0), WC = +(sp.p_W0C ?? D.p_W0C), WR = eq ? W0 : +(sp.p_W0R ?? D.p_W0R), L2 = Math.max(180, Math.min(600, Math.round((W * 100 - W0 - WC - WR) / 2))); return { p_L2: L2, p_L2R: L2 }; } },
  g604: { label: '箱籠固床工', code: '6-04', hide: ['p_W'],
    env: (P, sp) => { const ne = Math.max(0, Math.min(P.N_layer, Math.round(+(sp && sp.__exp !== undefined ? sp.__exp : P.N_layer)))), rcW = Math.max(P.maxFrontW, P.frontCounts[0] * P.B1) + (P.extL ?? 259) + (P.extR ?? 259);
      return { w: rcW / 100, h2: ne * P.H1 / 100, h3: Math.max(0.1, (P.H - ne * P.H1 + P.t) / 100), d1: P.B / 100, s2: 0 }; },
    note: '全長＝RC 基礎台長（最寬層＋左、右延伸，預設各 259 cm）；上游設計高＝箱籠頂、下游設計高＝RC 底板頂（比照防砂壩）；出露高＝出露層數×H1（預設＝全部層，可改）；基礎深＝其餘箱籠層＋底板厚 t；順水流厚＝側面底寬 B',
    fitTxt: '依此樁號溪床寬設定頂層箱籠數 N_bay＝溪床寬÷B1（四捨五入）',
    fit(sp, W) { const B1 = +(sp.p_B1 ?? TCO_S.g604.DEF.p_B1), n = Math.max(1, Math.round(W * 100 / B1)); return { p_N_bay: n, __fc: [] }; } },
  s0603: { label: '踏步式固床工', code: '0603-1',
    env: P => ({ w: P.W1 / 100, h2: P.h1 / 100, h3: P.H / 100, d1: P.B_pc / 100, s2: 0 }),
    note: '全長＝頂寬 W1（高位踏步 N×b1＋低位通道 (N−1)×b2＋左右端加寬）；壩頂＝計畫河床，出露高＝踏步高 h1；基礎深＝固床工高 H（含打底）；順水流厚＝打底寬',
    fitTxt: '依此樁號溪床寬反算高位踏步塊數 N＝(溪床寬−左右端加寬＋b2)÷(b1＋b2)（四捨五入）',
    fit(sp, W) { const D = TCO_S.s0603.DEF, g = k => +(sp[k] ?? D[k]), eq = String(sp.p_LReq ?? D.p_LReq) !== '0', eL = g('p_eL'), eR = eq ? eL : g('p_eR'); return { p_N_high: Math.max(2, Math.round((W * 100 - eL - eR + g('p_b2')) / (g('p_b1') + g('p_b2')))) }; } },
  bcul: { label: '場鑄箱涵', code: '箱涵', noAutoFit: true,
    env: P => ({ w: (P.W_cm + 2 * P.t_cm) / 100, h2: (P.H_cm + P.t_cm) / 100, h3: (P.t_cm + P.t_pc) / 100, d1: P.L_m, s2: 0 }),
    note: '以通水孔底（箱涵內底）為高程基準：連動設計線時通水孔底＝設計河床；外包：寬＝W＋2t、出露高＝H＋t（孔底以上）、基礎深＝底版 t＋PC、順水流長＝L。可放多座（每座一個結構物）',
    fitTxt: '依此樁號溪床寬設定內部跨度 W＝溪床寬−2t',
    fit(sp, W) { const t = +(sp.inp_t_cm ?? TCO_S.bcul.DEF.inp_t_cm); return { inp_W_cm: Math.max(60, Math.round(W * 100 - 2 * t)) }; } },
  cdam: { label: '曲型副壩（梳子壩）', code: '圖號12～16', noAutoFit: true,
    env: P => { const q = P.__q; return { w: (q.xR - q.xL) / 100, whL: -q.xL / 100, whR: q.xR / 100, h2: P.HB / 100, h3: (P.Hf + P.Hk) / 100, d1: P.Bbase / 100, s2: 0 }; },
    note: '拱冠（單元 B 中心）置於此樁號、弧凸向上游；上游設計高（固定側高程）＝單元 B（中間大立柱）頂＝溢洪口；左右寬＝翼端正視投影；外包斷面（設計線連動、縱橫斷面用）以基礎底寬 × 正視投影寬的直線帶表示；開挖依實際弧形基礎，垂直壩軸切斷面、平均斷面法 × 壩軸弧長；平面圖與數量依實際弧形',
    fitTxt: '依此樁號溪床寬反算：保持目前圓心張角 θ，R＝溪床寬÷(2 sin(θ/2))、U＝R×θ（弧端弦長＝溪床寬）',
    fit(sp, W) { const R0 = +(sp.p_R ?? TCO_S.cdam.DEF.p_R), U0 = +(sp.p_U ?? TCO_S.cdam.DEF.p_U), th = Math.max(0.05, Math.min(Math.PI * 0.95, U0 / R0)), R = W * 100 / (2 * Math.sin(th / 2)); return { p_R: Math.round(R), p_U: Math.round(R * th) }; } },   // v6.3：保持目前張角，同時反算 R 與 U
  n1: { label: '#1固床工（溢流口型）', code: '#1',
    env: P => ({ w: P.W_total / 100, whL: (P.W_wing_L + P.W_top_notch / 2) / 100, whR: (P.W_wing_R + P.W_top_notch / 2) / 100, h2: P.H_up / 100, h3: P.H_low / 100, d1: P.T_bot / 100, s2: 0 }),
    note: '以溢流口中心線為界：左寬＝左翼頂寬＋溢流口頂寬/2，右寬同理（左右可不同）；出露高＝上部溢流深 H_up；基礎深＝H_low；順水流厚＝底厚 T_bot',
    fitTxt: '依此樁號溪床寬設定左右翼牆頂寬＝(溪床寬−溢流口頂寬)/2',
    fit(sp, W) { const D = TCO_S.n1.DEF, g = k => +(sp[k] ?? D[k]), wt = g('inp_W_notch') + 2 * Math.round(g('inp_H_up') * g('inp_m_notch')), w = Math.max(40, Math.round((W * 100 - wt) / 2)); return { inp_W_wing_L: w, inp_W_wing_R: w }; } },
  f0605: { label: '格框式固床工', code: '0605-1/2',
    env: (P, sp) => { const ne = Math.max(0, Math.min(P.N_layer, Math.round(+(sp && sp.__exp !== undefined ? sp.__exp : P.N_layer)))), b = P.layerLR[0], L = Math.max(P.maxLeftBays * P.B_cell, b.left * P.B_cell + P.rcL), R = Math.max(P.maxRightBays * P.B_cell, b.right * P.B_cell + P.rcR);
      return { w: (L + R) / 100, whL: L / 100, whR: R / 100, h2: ne * P.H_cell / 100, h3: Math.max(0.1, ((P.N_layer - ne) * P.H_cell + P.t) / 100), d1: P.B_rc / 100, s2: 0 }; },
    note: '以中心線為界：左寬＝max(最寬層左格數×B, 底層左格數×B＋RC左外伸)，右寬同理（左右可不同）；出露高＝出露層數×H_cell（預設全部層）；基礎深＝其餘層＋RC 台厚 t；順水流厚＝RC 台寬',
    fitTxt: '依此樁號溪床寬設定頂層格數＝溪床寬÷B_cell（左右平分），下層每層左右各少 1 格',
    fit(sp, W) { const D = TCO_S.f0605.DEF, B = +(sp.p_B_cell ?? D.p_B_cell), N = Math.max(1, Math.round(+(sp.p_N_layer ?? D.p_N_layer))), n = Math.max(1, Math.round(W * 100 / B)), tl = Math.floor(n / 2), tr = n - tl;
      return { __lr: Array.from({ length: N }, (_, i) => ({ left: Math.max(1, tl - (N - 1 - i)), right: Math.max(1, tr - (N - 1 - i)) })) }; } }
};
(function () {   // v5.8 箱籠固床工：頂層箱籠數改數字輸入（2～60 顆），B1 範圍放寬
  const q = TCO_S.g604.PR.find(x => x.k === 'p_N_bay'); if (q) { delete q.opt; q.st = '1'; q.min = '2'; q.max = '60'; }
  const b = TCO_S.g604.PR.find(x => x.k === 'p_B1'); if (b) { b.st = '10'; b.min = '100'; b.max = '400'; }
})();
const SLT_ORDER = ['gen', 'bcul', 'cdam', 'n1', 'r0607', 'e606', 'a0608', 'g604', 's0603', 'f0605'];
const sltOn = st => !!(st && st.type === 'sill' && st.sty && st.sty !== 'gen' && SLT[st.sty] && typeof TCO_S !== 'undefined' && TCO_S[st.sty]);
const SLT_MC = new Map();
function sltRun(st, draw) {
  const k = st.sty + '|' + (draw ? 1 : 0) + '|' + JSON.stringify(st.sp || {}); let r = SLT_MC.get(k);
  if (!r) { r = TCO_S[st.sty].run(st.sp || {}, draw ? { draw: true, chkShowRefDxf: false, chkShowNotes: true, chkShowTable: true } : {}); if (SLT_MC.size > 200) SLT_MC.clear(); SLT_MC.set(k, r); }
  return r;
}
function sltSync(st) {   // 外包斷面 → 固床工通用參數
  if (!sltOn(st)) return;
  const e = SLT[st.sty].env(sltRun(st).P, st.sp), r4 = v => Math.round(v * 1e4) / 1e4;
  Object.assign(st.p, { h1: 0, s1: 0, hq: 0, k: 0, k1: 0, s3: 0, s4: 0, s5: 0, dh: 0, nh: 0 });
  Object.keys(e).forEach(k => { if (k !== 'whL' && k !== 'whR') st.p[k] = r4(e[k]); });
  ['L', 'R'].forEach(s => Object.assign(st.w[s], { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, ns: 0, auto: false }));
  if (e.whL !== undefined) { st.p.wsp = 1; st._wspSlt = 1; st.w.L.wh = r4(e.whL); st.w.R.wh = r4(e.whR); } else if (st._wspSlt) { st.p.wsp = 0; st._wspSlt = 0; }   // v6.3：左右不對稱（以中心線為界）
}
function sltBedW(st) {   // 結構物所在樁號的溪床寬（兩岸護岸牆腳距離；無護岸＝設計河寬）
  let W = null;
  try { const inR = r => { const a = r.s0 ?? -1e9, b = r.s1 ?? 1e9; return st.sta >= Math.min(a, b) - 1e-6 && st.sta <= Math.max(a, b) + 1e-6; }, RL = (state.revs || []).find(r => r.side === 'L' && inR(r)), RR = (state.revs || []).find(r => r.side === 'R' && inR(r));
    if (RL && RR) { const a = rvAt(RL, st.sta, rvEDefAt(st.sta)), b = rvAt(RR, st.sta, rvEDefAt(st.sta)); if (a && b && Number.isFinite(a.e + b.e)) W = a.e + b.e; } } catch (e) { W = null; }
  if (!(W > 0)) { const v = parseFloat((document.getElementById('desWidth') || {}).value); W = v > 0 ? v : null; }
  return W;
}
function sltSetType(v) {
  const st = state.structs[state.structSel]; if (!st || st.type !== 'sill') return; pushUndoSnapshot();
  st.sty = SLT[v] ? v : 'gen';
  if (st.sty === 'gen') Object.assign(st.p, stPreset('sill').p, { w: st.p.w });
  else { st.sp = Object.assign({}, st.sp || {}); const W = sltBedW(st); if (W && SLT[st.sty].wKey && st.sp[SLT[st.sty].wKey] === undefined) st.sp[SLT[st.sty].wKey] = Math.round(W * 100); if (W && SLT[st.sty].fit && !SLT[st.sty].noAutoFit && !st.sp.__fit) { Object.assign(st.sp, SLT[st.sty].fit(st.sp, W)); st.sp.__fit = 1; } sltSync(st); }
  st._it = 0; ST_SIG = ''; rebuildAlignmentAndSections();
  updateStatus(`🧱 ${st.name}：固床工型式改為「${SLT[st.sty].label}」。`);
}
function sltSet(k, el) {
  const st = state.structs[state.structSel]; if (!sltOn(st)) return; const q = TCO_S[st.sty].PR.find(x => x.k === k); if (!q) return;
  let v = q.opt ? el.value : parseFloat(el.value); if (!q.opt && !Number.isFinite(v)) { el.value = st.sp[k] ?? q.def; return; }
  if (st.sty === 'g604' && k === 'p_N_bay') { v = Math.max(2, Math.min(60, Math.round(v))); el.value = v; }
  pushUndoSnapshot(); st.sp = Object.assign({}, st.sp, { [k]: v }); if (st.sty === 'g604' && (k === 'p_N_bay' || k === 'p_front_mode')) st.sp.__fc = []; sltSync(st); st._it = 0; ST_SIG = ''; rebuildAlignmentAndSections();
}
function sltFitW() {   // 依結構物所在樁號的溪床寬設定全長
  const st = state.structs[state.structSel]; if (!sltOn(st)) return; const W = sltBedW(st); if (!W) { updateStatus('⚠ 找不到此樁號的溪床寬（兩岸護岸或設計河寬）。'); return; }
  pushUndoSnapshot(); const T = SLT[st.sty]; st.sp = Object.assign({}, st.sp);
  if (T.wKey) { st.sp[T.wKey] = Math.round(W * 100); if (TCO_S[st.sty].DEF.p_WhL !== undefined) { st.sp.p_WhL = st.sp.p_WhR = Math.round(W * 50); } } else if (T.fit) Object.assign(st.sp, T.fit(st.sp, W));   // v6.3：左右分開時兩半寬各取一半
  sltSync(st); st._it = 0; ST_SIG = ''; rebuildAlignmentAndSections();
  const P = sltRun(st).P; updateStatus(`📏 ${st.name}：依溪床寬 ${rvF(W)} m 設定` + (T.wKey ? `全長 ${rvF(W)} m。` : st.sty === 'bcul' ? `內部跨度 W＝${P.W_cm} cm。` : st.sty === 'cdam' ? `半徑 R＝${P.R} cm、弧長 U＝${P.U} cm（保持張角 ${rvF(P.theta * 180 / Math.PI, 1)}°、單元A ${P.NL}＋${P.NR} 座）。` : st.sty === 'n1' ? `左右翼牆頂寬 ${P.W_wing_L} cm → 全寬 ${P.W_total} cm（與溪床寬差 ${rvF(P.W_total / 100 - W)} m）。` : st.sty === 's0603' ? `高位踏步 ${P.N_high} 塊 → 頂寬 W1 ${P.W1} cm（與溪床寬差 ${rvF(P.W1 / 100 - W)} m）。` : st.sty === 'f0605' ? `頂層 左${P.layerLR[P.N_layer - 1].left}＋右${P.layerLR[P.N_layer - 1].right} 格 → 頂層寬 ${P.W_top} cm（與溪床寬差 ${rvF(P.W_top / 100 - W)} m）。` : st.sty === 'a0608' ? `內弦長 L2＝${st.sp.p_L2} cm → 總長 ${P.L_total} cm（雙拱模組，與溪床寬差 ${rvF(P.L_total / 100 - W)} m）。` : `頂層箱籠 ${P.N_bay} 顆 → 頂層寬 ${P.W} cm（與溪床寬差 ${rvF(P.W / 100 - W)} m）。`));
}
function sltTypeHTML(st) {
  if (!st || st.type !== 'sill') return '';
  const cur = st.sty && SLT[st.sty] ? st.sty : 'gen';
  return `<div style="display:flex;gap:6px;align-items:center;margin-top:6px;font-size:11.5px;"><b style="color:var(--cad-amber);white-space:nowrap;">固床工型式</b><select class="input-select" style="flex:1;" onchange="sltSetType(this.value)">${SLT_ORDER.map(k => `<option value="${k}"${k === cur ? ' selected' : ''}>${SLT[k].label}</option>`).join('')}</select></div>`;
}
function sltParamHTML(st) {   // 原圖參數（取代通用壩體參數）
  const S = TCO_S[st.sty], T = SLT[st.sty], R = sltRun(st), sp = st.sp || {};
  const inp = q => { const v = sp[q.k] ?? q.def; return q.opt ? `<select class="input-select" style="width:96px;" onchange="sltSet('${q.k}',this)">${q.opt.map(([o, t]) => `<option value="${o}"${String(v) === String(o) ? ' selected' : ''}>${escAttr(t)}</option>`).join('')}</select>`
    : `<input type="number" class="input-num" style="width:76px;" step="${q.st || 1}"${q.min ? ` min="${q.min}"` : ''}${q.max ? ` max="${q.max}"` : ''} value="${v}" onchange="sltSet('${q.k}',this)">`; };
  const grp = S.GT.map((t, gi) => ({ t: t.replace(/^\d+\.\s*/, ''), qs: S.PR.filter(q => q.g === gi && q.k !== 'p_k_gap' && !(T.hide || []).includes(q.k)) })).filter(g => g.qs.length);
  const e = SLT[st.sty].env(R.P, st.sp);
  return `\u0001body\u0002② ${T.label}參數\u0003` + `<div style="display:grid;grid-template-columns:1fr;gap:2px;margin:4px 0;">${stFld('p.off', '中心偏移 off（＋右岸，面向下游）', 0.1, 70)}</div>` +
    grp.map(g => `<div style="font-size:11px;font-weight:700;color:#0369a1;margin:6px 0 2px;">${escAttr(g.t)}</div><div style="display:grid;grid-template-columns:1fr;gap:2px;">` +
      g.qs.map(q => `<label style="display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:11px;"><span>${escAttr(q.nm)}</span>${inp(q)}</label>`).join('') + '</div>').join('') +
    `<div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap;"><button class="btn" onclick="sltFitW()" title="${T.wKey ? '把全長設為此樁號的溪床寬（兩岸護岸牆腳距離；無護岸＝設計河寬）' : T.fitTxt}">📏 依溪床寬${T.wKey ? '設全長' : st.sty === 'a0608' ? '反算 L2' : st.sty === 's0603' ? '反算踏步數' : st.sty === 'n1' ? '設翼牆寬' : st.sty === 'cdam' ? '反算 R、U' : st.sty === 'bcul' ? '設跨度 W' : st.sty === 'f0605' ? '設頂層格數' : '設箱籠數'}</button></div>` + (st.sty === 'bcul' ? `<div style="margin-top:6px;font-size:11px;display:flex;justify-content:space-between;align-items:center;gap:6px;"><span title="輸入後改為不連動設計線；連動時孔底＝設計河床">通水孔底高程（基準）</span><input type="number" class="input-num" style="width:86px;" step="0.01" value="${(() => { try { return sltBculInv(st).toFixed(3); } catch (e) { return ''; } })()}" onchange="sltBculSetInv(this.value)"></div>` : '') + (st.sty === 'g604' ? sltG604UI(st, R) : st.sty === 'f0605' ? sltF605UI(st, R) : '') +
    `<div style="margin-top:5px;font-size:10.5px;line-height:1.6;background:rgba(3,105,161,.05);border:1px solid var(--border-dim);padding:4px 6px;border-radius:4px;">外包斷面（平面、縱橫斷面、地形開挖用）：全長 w＝${rvF(e.w)} m、出露高 h2＝${rvF(e.h2)} m、基礎深 h3＝${rvF(e.h3)} m、順水流厚 d1＝${rvF(e.d1)} m${e.s2 ? `、下游坡 1:${rvF(e.s2)}` : ''}<br><span style="color:var(--text-muted);">${T.note}</span>${st.sty === 'g604' ? `<br>上游設計高＝箱籠頂（壩底＋${rvF(e.h3 + e.h2)} m）　下游設計高＝RC 底板頂（壩底＋${rvF(e.h3)} m）　落差 ${rvF(e.h2)} m` : ''}</div>` +
    (R.checks.length ? `<div style="margin-top:5px;font-size:10.5px;line-height:1.55;">${R.checks.map(c => `<div style="color:${c.ok ? '#047857' : '#b45309'};">${c.ok ? '✔' : '⚠'} ${escAttr(c.text)}</div>`).join('')}</div>` : '');
}
function sltQty(st, q) {
  const R = sltRun(st), T = SLT[st.sty];
  const rows = R.rows.map(x => ({ it: x.name, u: x.unit, v: +x.qty, fx: `原工具：${x.formula}${x.note ? '；' + x.note : ''}` }));
  const exr = q.rows.find(r => /^結構物開挖/.test(r.it)); if (exr) rows.push(Object.assign({}, exr, { it: '結構物開挖（依地形；外包斷面概估，平均斷面法，含邊坡）' }));
  if (T.extra) T.extra(R.P).forEach(r => rows.push(r));
  const V = rows.filter(r => r.u === 'm³' && /混凝土/.test(r.it)).reduce((a, r) => a + r.v, 0), Vst = rows.filter(r => r.u === 'm³' && /石/.test(r.it) && !/混凝土/.test(r.it)).reduce((a, r) => a + r.v, 0);
  const exExtra = rows.filter(r => /加深開挖/.test(r.it)).reduce((a, r) => a + r.v, 0);
  return { rows, tSeg: [['項目', '數量']].concat(R.rows.map(x => [String(x.name).slice(0, 18), `${rvF(+x.qty)} ${x.unit}`])), tExc: q.tExc, segs: [], V, Vstone: Vst, Vacc: 0, F: 0, ex: q.ex + exExtra, wear: 0, Vkey: 0, Va: V, Vs: V, slt: st.sty };
}
function sltStdPrims(st) {   // 原工具完整標準圖（原圖 cm → 標準圖 m）
  const R = sltRun(st, true), O = st.sty === 'e606' ? R.O.concat(slt606Front(R.P, ((R.L && R.L.bounds && R.L.bounds.maxX) || (R.P.L + R.P.B_up + 620)) + 250, 0)) : R.O, P = tcoStdPrims(O, 0.01, 0, 0, 'STD_'), bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  P.forEach(o => { if (o.t === 't') { bb.x0 = Math.min(bb.x0, o.x); bb.x1 = Math.max(bb.x1, o.x + o.s.length * o.h); bb.y0 = Math.min(bb.y0, o.y - o.h); bb.y1 = Math.max(bb.y1, o.y + o.h); } else o.p.forEach(v => { bb.x0 = Math.min(bb.x0, v[0]); bb.x1 = Math.max(bb.x1, v[0]); bb.y0 = Math.min(bb.y0, v[1]); bb.y1 = Math.max(bb.y1, v[1]); }); });
  const T = SLT[st.sty], TH = Math.max(0.12, (bb.x1 - bb.x0) / 160); P.push({ t: 't', x: bb.x0, y: bb.y1 + TH * 2.2, h: TH * 1.4, s: `${st.name}　${T.label}　${formatStation(st.sta)}`, c: '#ffd08a', a: 30, ly: 'STD_TITLE', al: 'l', va: 'b', rot: 0 });
  bb.y1 += TH * 4;
  return { P, bb };
}
/* ---- v6.3 場鑄箱涵：以通水孔底為基準（連動時孔底＝設計河床） ---- */
(function () { const _z = stZBlink; stZBlink = function (st) { return sltOn(st) && st.sty === 'bcul' ? +(getDesignZBefore(st.sta) - st.p.h3).toFixed(3) : _z(st); }; })();
function sltBculInv(st) { const pl = stPlace(st); return pl.zB + st.p.h3; }
function sltBculSetInv(v) { const st = state.structs[state.structSel]; if (!sltOn(st) || st.sty !== 'bcul') return; const z = parseFloat(v); if (!Number.isFinite(z)) return; pushUndoSnapshot(); st.link = false; st.zB = +(z - st.p.h3).toFixed(3); st._it = 0; ST_SIG = ''; rebuildAlignmentAndSections(); }
/* ---- 掛到既有固床工流程 ---- */
(function () {
  const _q = stQty; stQty = function (st) { const q = _q(st); return sltOn(st) ? sltQty(st, q) : q; };
  const _s = stStdPrims; stStdPrims = function (st) { return sltOn(st) ? sltStdPrims(st) : _s(st); };
  const _n = stNorm; stNorm = function (o) { const st = _n(o); if (st.type === 'sill') { st.sty = SLT[o.sty] ? o.sty : 'gen'; st.sp = o.sp && typeof o.sp === 'object' ? Object.assign({}, o.sp) : {}; sltSync(st); } return st; };
  const _c = stClean; stClean = function () { const a = _c(); a.forEach((o, i) => { const s = state.structs[i]; if (s && s.type === 'sill') { o.sty = s.sty || 'gen'; o.sp = Object.assign({}, s.sp || {}); } }); return a; };
})();

/* ============================================================================
   v5.7 固床工原圖視圖：平面圖（俯視）、縱斷面（順水流斷面）、橫斷面（正視）改畫原工具的圖
   原工具 renderCAD 圖元（cm）依各型式視圖位置選取，換算成結構物座標：
     平面 (u, x)、順水流斷面 (u, z)、正視 (x, z)；u＝順水流（下游為正，壩軸 0），z＝相對壩頂 zS（m）
   外包斷面僅供開挖、設計線連動，畫面改以原圖為準；6-06 原圖無正視圖 → 依原圖尺寸產生，
   且每個橫斷面依其在斜坡上的實際位置畫（上游基座／第幾段斜坡與嵌石列／下游基座／護坦）
   ============================================================================ */
function sltG604UI(st, R) {
  const P = R.P, sp = st.sp || {}, fc = [...P.frontCounts].reverse().join(','), ne = sp.__exp !== undefined ? sp.__exp : P.N_layer;
  return `<div style="margin-top:6px;display:grid;grid-template-columns:1fr;gap:3px;font-size:11px;">
    <label style="display:flex;justify-content:space-between;align-items:center;gap:6px;"><span title="正面圖各層箱籠顆數，由頂層到底層，以逗號分隔；留空＝依立面交錯公式自動">正面各層箱籠數（頂→底）</span><input type="text" class="input-num" style="width:96px;" value="${fc}" onchange="sltSetX('__fc',this)"></label>
    <label style="display:flex;justify-content:space-between;align-items:center;gap:6px;"><span title="露出下游河床的箱籠層數（決定上下游落差 h2；預設全部層＝下游設計高在 RC 底板頂）；其餘層與基礎台埋入河床">出露層數（落差）</span><input type="number" class="input-num" style="width:76px;" min="0" max="${P.N_layer}" step="1" value="${ne}" onchange="sltSetX('__exp',this)"></label>
    <div style="color:var(--text-muted);">側面各層（頂→底）：${[...P.sideCounts].reverse().join('、')} 顆；頂層寬 W＝${P.W} cm；總高 H＝${P.H} cm</div></div>`;
}
function sltSetX(k, el) {
  const st = state.structs[state.structSel]; if (!sltOn(st)) return; let v;
  if (k === '__fc') { const a = String(el.value).split(/[,，、\s]+/).map(x => parseInt(x)).filter(x => x > 0); v = a.length ? a.reverse() : []; }
  else { v = parseFloat(el.value); if (!Number.isFinite(v)) return; }
  pushUndoSnapshot(); st.sp = Object.assign({}, st.sp, { [k]: v }); if (k === '__fc' && v.length) st.sp.p_N_layer = String(v.length); sltSync(st); st._it = 0; ST_SIG = ''; rebuildAlignmentAndSections();
}
function sltF605UI(st, R) {   // v6.3 格框式：各層左／右格數（頂→底）＋左右相同、出露層數
  const P = R.P, sp = st.sp || {}, eq = sp.__lrEq !== 0, L = [...P.layerLR].reverse(), ne = sp.__exp !== undefined ? sp.__exp : P.N_layer;
  return `<div style="margin-top:6px;display:grid;grid-template-columns:1fr;gap:3px;font-size:11px;">
    <label style="display:flex;gap:6px;align-items:center;"><input type="checkbox" ${eq ? 'checked' : ''} onchange="sltSetLR('eq',this)"> 各層左右格數相同（右側跟左側）</label>
    <label style="display:flex;justify-content:space-between;align-items:center;gap:6px;"><span title="以中心線 X=0 為界，由頂層到底層，以逗號分隔">各層左格數（頂→底）</span><input type="text" class="input-num" style="width:96px;" value="${L.map(o => o.left).join(',')}" onchange="sltSetLR('left',this)"></label>
    <label style="display:flex;justify-content:space-between;align-items:center;gap:6px;"><span title="以中心線 X=0 為界，由頂層到底層，以逗號分隔">各層右格數（頂→底）</span><input type="text" class="input-num" style="width:96px;" value="${L.map(o => o.right).join(',')}" ${eq ? 'disabled' : ''} onchange="sltSetLR('right',this)"></label>
    <label style="display:flex;justify-content:space-between;align-items:center;gap:6px;"><span title="露出下游河床的格框層數（決定上下游落差 h2）；其餘層與 RC 基礎台埋入河床">出露層數（落差）</span><input type="number" class="input-num" style="width:76px;" min="0" max="${P.N_layer}" step="1" value="${ne}" onchange="sltSetX('__exp',this)"></label>
    <div style="color:var(--text-muted);">頂層寬 ${P.W_top} cm（左${P.layerLR[P.N_layer - 1].left}＋右${P.layerLR[P.N_layer - 1].right}）；總高 ${P.H_total} cm；RC 台長 ${P.layerLR[0].total * P.B_cell + P.rcL + P.rcR} cm</div></div>`;
}
function sltSetLR(k, el) {
  const st = state.structs[state.structSel]; if (!sltOn(st) || st.sty !== 'f0605') return; const P = sltRun(st).P, N = P.N_layer;
  let A = P.layerLR.map(o => ({ left: o.left, right: o.right })), eq = st.sp.__lrEq !== 0;
  if (k === 'eq') eq = !!el.checked;
  else { const a = String(el.value).split(/[,，、\s]+/).map(x => parseInt(x)).filter(x => x >= 0).reverse(); if (!a.length) return; for (let i = 0; i < N; i++) A[i][k] = a[Math.min(i, a.length - 1)]; }
  if (eq) A.forEach(o => { o.right = o.left; }); A.forEach(o => { if (o.left + o.right < 1) o.right = 1; });
  pushUndoSnapshot(); st.sp = Object.assign({}, st.sp, { __lr: A, __lrEq: eq ? 1 : 0 }); sltSync(st); st._it = 0; ST_SIG = ''; rebuildAlignmentAndSections();
}
const SLT_ANN = /^(DIM|標註|文字|字|!字|TABLE|輔助線|REF_DXF|中心線|HONEY|NOTE|TEXT)$/i;
function sltPick(O, box, f) {   // 選取視圖範圍內的結構圖元（排除標註、文字、填充紋）
  const out = []; let dep = 0;
  O.forEach(o => {
    if (o.k === 'CB') { dep++; return; } if (o.k === 'CE') { dep = Math.max(0, dep - 1); return; }
    if (dep || o.k === 'T' || SLT_ANN.test(o.ly || '') || /^#22d3ee$/i.test(o.c || '') || /^#38bdf8$/i.test(o.c || '')) return;
    const pts = o.k === 'C' ? Array.from({ length: 24 }, (_, i) => [o.x + o.r * Math.cos(i * Math.PI / 12), o.y + o.r * Math.sin(i * Math.PI / 12)]) : o.p;
    if (!pts || !pts.length || !pts.every(p => p[0] >= box[0] && p[0] <= box[2] && p[1] >= box[1] && p[1] <= box[3])) return;
    if (f && !f(o)) return;
    out.push({ p: pts, cl: o.k === 'C' ? true : !!o.cl, c: o.c || '#ffffff', f: o.f || null, d: (o.d || []).length > 0 });
  });
  return out;
}
const sltBB = A => { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; A.forEach(o => o.p.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); })); return { x0, x1, y0, y1 }; };
const sltTf = (A, tf) => A.map(o => Object.assign({}, o, { p: o.p.map(tf) }));
const SLT_VIEW = {   // 各型式：plan (u,x)、sect (u,z)、elev (x,z)
  a0608(P, L) { const T = P.D_fnd + P.H_eff, Lt = P.L_total, BL = P.BL, O = this.O;
    return { elev: sltTf(sltPick(O, [-5, -5, Lt + 5, T + 5]), ([x, y]) => [(x - Lt / 2) / 100, (y - T) / 100]),
      sect: sltTf(sltPick(O, [L.secOx - 5, -5, L.secOx + BL + 5, T + 5]), ([x, y]) => [-(x - (L.secOx + BL / 2)) / 100, (y - T) / 100]),
      plan: sltTf(sltPick(O, [-5, L.planOy - 5, Lt + 5, L.planOy + BL + 5]), ([x, y]) => [-(y - (L.planOy + BL / 2)) / 100, (x - Lt / 2) / 100]) }; },
  e606(P, L) { const xA = P.L + P.B_up / 2, yA = P.dH_slope, O = this.O, xl = -P.topLip_dn - P.L_riprap - 215, xr = P.L + P.B_up + 170, yc = L.planBotY + (P.WhL ?? P.W_weir / 2);
    return { sect: sltTf(sltPick(O, [xl, L.secMinY, xr, P.dH_slope + P.h1 + 200]), ([x, y]) => [-(x - xA) / 100, (y - yA) / 100]),
      plan: sltTf(sltPick(O, [xl, L.planBotY - 5, xr, L.planTopY + 5]), ([x, y]) => [-(x - xA) / 100, (y - yc) / 100]), elev: null }; },
  g604(P, L) { const H = P.H, O = this.O, cx = L.frontCenterX, B = P.B, sc = L.sideLeftX + B / 2, pc = (L.planBotY + L.planTopY) / 2, rw = Math.max(P.maxFrontW, P.frontCounts[0] * P.B1) / 2 + ((P.extL ?? 259) + (P.extR ?? 259)) / 2;
    return { elev: sltTf(sltPick(O, [cx - rw - 5, -P.t - 5, cx + rw + 5, H + 5]), ([x, y]) => [(x - cx) / 100, (y - H) / 100]),
      sect: sltTf(sltPick(O, [L.sideLeftX - 5, -P.t - 5, L.sideRightX + 5, H + 5]), ([x, y]) => [(x - sc) / 100, (y - H) / 100]),
      plan: sltTf(sltPick(O, [L.frontMinX - 5, L.planBotY - 5, L.frontMaxX + 5, L.planTopY + 5]), ([x, y]) => [(y - pc) / 100, (x - cx) / 100]) }; },
  bcul(P) { const W = P.W_cm, H = P.H_cm, t = P.t_cm, F = P.F_cm, L = P.L_m * 100, top = H + t, z = v => (v - top) / 100, x = v => v / 100, hw = W / 2 + t;
    const outer = [[-hw, -t], [hw, -t], [hw, H + t], [-hw, H + t]].map(([a, b]) => [x(a), z(b)]), inner = [[-W / 2 + F, 0], [W / 2 - F, 0], [W / 2, F], [W / 2, H - F], [W / 2 - F, H], [-W / 2 + F, H], [-W / 2, H - F], [-W / 2, F]].map(([a, b]) => [x(a), z(b)]);
    const pc = [[-hw - P.ext_pc, -t - P.t_pc], [hw + P.ext_pc, -t - P.t_pc], [hw + P.ext_pc, -t], [-hw - P.ext_pc, -t]].map(([a, b]) => [x(a), z(b)]);
    const u = v => v / 100 - L / 200, sect = [{ p: [[u(0), z(-t)], [u(L), z(-t)], [u(L), z(H + t)], [u(0), z(H + t)]], cl: true, c: '#ffffff', f: 'rgba(255,255,255,0.05)', d: false }, { p: [[u(0), z(0)], [u(L), z(0)], [u(L), z(H)], [u(0), z(H)]], cl: true, c: '#22d3ee', f: 'rgba(14,165,233,0.12)', d: false }];
    return { elev: [{ p: outer, cl: true, c: '#ffffff', f: 'rgba(255,255,255,0.06)', d: false }, { p: inner, cl: true, c: '#22d3ee', f: 'rgba(14,165,233,0.15)', d: false }, { p: pc, cl: true, c: '#94a3b8', f: null, d: false }], sect,
      plan: [{ p: [[u(0), x(-hw)], [u(L), x(-hw)], [u(L), x(hw)], [u(0), x(hw)]], cl: true, c: '#ffffff', f: 'rgba(255,255,255,0.06)', d: false }, { p: [[u(0), x(-W / 2)], [u(L), x(-W / 2)]], cl: false, c: '#94a3b8', f: null, d: true }, { p: [[u(0), x(W / 2)], [u(L), x(W / 2)]], cl: false, c: '#94a3b8', f: null, d: true }] }; },
  cdam(P, L) { return { plan: L.V.plan, sect: L.V.sect, elev: L.V.elev }; },
  n1(P, L) { const O = this.O, ok = o => /OUTLINE|NOTCH|CREST|MID_LINE/.test(o.ly || ''), yT = L.frontYTop, Ht = P.H_total, yc = L.planY0 + P.T_bot / 2, xs = L.xBack - P.T_bot / 2;
    return { elev: sltTf(sltPick(O, [L.xLo - 5, -(L.frontYBot + 5), L.xHi + 5, -(yT - 5)], ok), ([x, y]) => [x / 100, (y + yT) / 100]),
      sect: sltTf(sltPick(O, [L.xBack - P.T_bot - 5, -(L.sideYTop + Ht + 5), L.xBack + 5, -(L.sideYTop - 5)], ok), ([x, y]) => [-(x - xs) / 100, (y + L.sideYTop) / 100]),
      plan: sltTf(sltPick(O, [L.xLo - 5, -(L.planY0 + P.T_bot + 5), L.xHi + 5, -(L.planY0 - 5)], ok), ([x, y]) => [(-y - yc) / 100, x / 100]) }; },
  s0603(P, L) { const O = this.O, T = P.H + P.h1, ox = L.secAA_X, nr = o => o.ly !== '鋼筋';
    return { elev: sltTf(sltPick(O, [-5, -5, P.W1 + 5, T + 5], nr), ([x, y]) => [(x - P.W1 / 2) / 100, (y - T) / 100]),
      sect: sltTf(sltPick(O, [ox - 5, -5, ox + P.B_pc + 5, T + 5], nr), ([x, y]) => [(x - (ox + P.B_pc / 2)) / 100, (y - T) / 100]),
      plan: sltTf(sltPick(O, [-5, L.planBotY - 5, P.W1 + 5, L.planTopY + 5]), ([x, y]) => [-(y - (L.planBotY + L.planTopY) / 2) / 100, (x - P.W1 / 2) / 100]) }; },
  f0605(P, L) { const O = this.O, T = P.H_total, b = P.layerLR[0], x0 = Math.min(P.frontMinX, -b.left * P.B_cell - P.rcL), x1 = Math.max(P.frontMaxX, b.right * P.B_cell + P.rcR), nh = o => o.ly !== 'HATCH' && o.ly !== '2';
    return { elev: sltTf(sltPick(O, [x0 - 5, -P.t - 5, x1 + 5, T + 5], nh), ([x, y]) => [x / 100, (y - T) / 100]),
      sect: sltTf(sltPick(O, [L.secCenterX - P.B_rc / 2 - 5, -P.t - 5, L.secCenterX + P.B_rc / 2 + 5, T + 5], nh), ([x, y]) => [(x - L.secCenterX) / 100, (y - T) / 100]),
      plan: sltTf(sltPick(O, [P.frontMinX - 5, L.planBotY - 5, P.frontMaxX + 5, L.planTopY + 5], nh), ([x, y]) => [-(y - L.planCenterY) / 100, x / 100]) }; },
  r0607(P, L, e) { const O = this.O, st = o => o.ly === '塊石' || o.ly === '水管' && false;
    const mx1 = (L.secOx + L.frOx) / 2, mx2 = (L.frOx + L.plOx) / 2, my1 = (L.secOy + L.szOy) / 2, my2 = (L.frOy + L.dtOy) / 2;
    const S = sltPick(O, [-1e9, my1, mx1, 1e9], o => o.ly === '塊石'), s = 0.01 / L.kSec;
    const F = sltPick(O, [mx1, my2, mx2, 1e9], o => o.ly === '塊石'), fb = sltBB(F), fx = e.w / ((fb.x1 - fb.x0) || 1), fz = (e.h2 + e.h3) / ((fb.y1 - fb.y0) || 1);
    const Pl = sltPick(O, [mx2, -1e9, 1e9, 1e9], o => o.ly === '塊石'), pb = sltBB(Pl), pcx = (pb.x0 + pb.x1) / 2, pcy = (pb.y0 + pb.y1) / 2;
    return { sect: sltTf(S, ([x, y]) => [(x - L.secOx) * s - e.d1 / 2, (y - L.secOy) * s]),
      elev: sltTf(F, ([x, y]) => [(x - (fb.x0 + fb.x1) / 2) * fx, (y - fb.y1) * fz]),
      plan: sltTf(Pl, ([x, y]) => [-(y - pcy) * 0.01 / (L.kyPl || 1), (x - pcx) * 0.01 / (L.kxPl || 1)]) }; }
};
const SLT_VC = new Map();
function sltViews(st) {
  if (!sltOn(st) || !SLT_VIEW[st.sty]) return null;
  const k = st.sty + '|' + JSON.stringify(st.sp || {}); let v = SLT_VC.get(k); if (v) return v;
  try { const R = sltRun(st, true), e = SLT[st.sty].env(R.P, st.sp); v = SLT_VIEW[st.sty].call({ O: R.O }, R.P, R.L || {}, e); v.P = R.P; v.e = e; } catch (err) { console.error('sltViews', err); v = { plan: [], sect: [], elev: [] }; }
  if (SLT_VC.size > 60) SLT_VC.clear(); SLT_VC.set(k, v); return v;
}
/* ---- 6-06 嵌石固床工：依位置 u（m，自壩軸往下游）產生正視斷面（cm 計算，輸出 (x, z) m） ---- */
function slt606At(P, u) {
  const xA = P.L + P.B_up / 2, x = xA - u * 100, W = P.W_weir, hw = W / 2, out = [], z = y => (y - P.dH_slope) / 100, X = c => c / 100;
  const rect = (y0, y1, c, f) => out.push({ p: [[X(-hw), z(y0)], [X(hw), z(y0)], [X(hw), z(y1)], [X(-hw), z(y1)]], cl: true, c, f, d: false });
  const ell = (cx, cy, rx, ry, c) => out.push({ p: Array.from({ length: 20 }, (_, i) => [X(cx + rx * Math.cos(i * Math.PI / 10)), z(cy + ry * Math.sin(i * Math.PI / 10))]), cl: true, c, f: 'rgba(249,115,22,0.18)', d: false });
  const row = (n, yTop, ry, protrude) => { const sp = W / n; for (let i = 0; i < n; i++) ell(-hw + (i + 0.5) * sp, yTop + protrude - ry, Math.min(sp * 0.46, P.S_stone * 0.62), ry, '#f97316'); };
  const cob = (yTop) => { const n = Math.max(2, Math.floor(W / P.psi)), sp = W / n, r = P.psi * 0.45; for (let i = 0; i < n; i++) ell(-hw + (i + 0.5) * sp, yTop - r * 0.35, r, r * 0.8, '#fb923c'); };
  let part = '', k = -1;
  if (x >= P.L - 1e-6 && x <= P.L + P.B_up + 1e-6) { part = '上游基座'; rect(P.dH_slope - P.D_up, P.dH_slope, '#facc15', 'rgba(250,204,21,0.06)'); row(P.nUpRows, P.dH_slope, P.S_stone * 0.5, Math.min(P.h1, P.S_stone * 0.4)); }
  else if (x >= 0 && x < P.L) {
    k = Math.min(P.N_bay - 1, Math.floor(x / P.L1)); const yS = x / P.L * P.dH_slope, yB = -128 + (P.dH_slope - P.t_slab + 128) * x / P.L, stepColW = Math.min(105, P.L1 * 0.32), inStep = x - k * P.L1 <= stepColW;
    part = `第 ${k + 1} 段斜坡（共 ${P.N_bay} 段）` + (inStep ? '・踏步石列' : '・嵌石區');
    rect(yB, yS, '#facc15', 'rgba(250,204,21,0.06)');
    if (inStep) row(P.nStepRows, yS, P.S_stone * 0.5, P.h1); else cob(yS);
  } else if (x < 0 && x >= -P.B_dn) { part = '下游基座'; rect(-P.D_dn, 0, '#facc15', 'rgba(250,204,21,0.06)'); row(P.nStepRows, 0, P.S_stone * 0.5, Math.min(P.h1, 68)); }
  else if (x < -P.B_dn && x >= -P.topLip_dn - P.L_riprap) { part = '下游護坦回填塊石'; for (let ly = 0; ly < 3; ly++) { const n = Math.max(2, Math.round(W / 80)) - (ly ? 1 : 0), sp = W / n; for (let i = 0; i < n; i++) ell(-hw + (i + 0.5 + (ly ? 0.5 : 0)) * sp, -32 - ly * 64, Math.min(sp * 0.48, 52), 35, '#a16207'); } }
  else return null;
  return { prims: out, part, k, zTop: x >= P.L ? 0 : x >= 0 ? z(x / P.L * P.dH_slope) : z(0) };
}
function slt606Range(st) { const P = sltRun(st).P, a = -P.B_up / 2, b = P.B_up / 2 + P.L + P.topLip_dn + P.L_riprap; return [a, b]; }
function slt606Front(P, ox, oy) {   // 標準圖用：正視圖（自下游往上游看）原圖無此視圖，依原圖尺寸產生（cm）
  const O = [], W = P.W_weir, L = (p, c, w, d, cl) => O.push({ k: 'P', p, c: c || '#facc15', w: w || 1.5, f: null, cl: !!cl, d: d || [], ly: '0' }), T = (s, x, y, h, c, al) => O.push({ k: 'T', x, y, s, h, c: c || '#22d3ee', al: al || 'center', bl: 'middle', rot: 0, ly: 'DIM' });
  const yTop = P.dH_slope, X = x => ox + x, Y = y => oy + y;
  L([[X(0), Y(-P.D_dn)], [X(W), Y(-P.D_dn)], [X(W), Y(yTop)], [X(0), Y(yTop)]], '#facc15', 1.8, [], true);
  for (let k = 0; k <= P.N_bay; k++) { const y = k * P.L1 / P.L * P.dH_slope; L([[X(0), Y(y)], [X(W), Y(y)]], '#ffffff', 1.2); }
  L([[X(0), Y(P.dH_slope - P.D_up)], [X(W), Y(P.dH_slope - P.D_up)]], '#94a3b8', 1, [10, 6]);
  L([[X(0), Y(-128)], [X(W), Y(-128)]], '#94a3b8', 1, [10, 6]);
  for (let k = 0; k < 1; k++) { const y = k * P.L1 / P.L * P.dH_slope, n = P.nStepRows, sp = W / n, ry = P.S_stone * 0.5, rx = Math.min(sp * 0.46, P.S_stone * 0.62);
    for (let i = 0; i < n; i++) { const cx = (i + 0.5) * sp, cy = y + P.h1 - ry; L(Array.from({ length: 20 }, (_, j) => [X(cx + rx * Math.cos(j * Math.PI / 10)), Y(cy + ry * Math.sin(j * Math.PI / 10))]), '#f97316', 1.2, [], true); } }
  { const n = P.nUpRows, sp = W / n, ry = P.S_stone * 0.5, rx = Math.min(sp * 0.46, P.S_stone * 0.62); for (let i = 0; i < n; i++) { const cx = (i + 0.5) * sp, cy = yTop + Math.min(P.h1, P.S_stone * 0.4) - ry; L(Array.from({ length: 20 }, (_, j) => [X(cx + rx * Math.cos(j * Math.PI / 10)), Y(cy + ry * Math.sin(j * Math.PI / 10))]), '#94a3b8', 1, [8, 5], true); } }
  const dy = -P.D_dn - 70; L([[X(0), Y(dy)], [X(W), Y(dy)]], '#22d3ee', 1.1); L([[X(0), Y(dy - 15)], [X(0), Y(dy + 15)]], '#22d3ee', 1.1); L([[X(W), Y(dy - 15)], [X(W), Y(dy + 15)]], '#22d3ee', 1.1); T(`W_weir=${W}`, X(W / 2), Y(dy + 22), 26);
  const dx = W + 90; L([[X(dx), Y(0)], [X(dx), Y(yTop)]], '#22d3ee', 1.1); T(`ΔH=${P.dH_slope}`, X(dx + 20), Y(yTop / 2), 24, '#22d3ee', 'left');
  L([[X(dx), Y(-P.D_dn)], [X(dx), Y(0)]], '#22d3ee', 1.1); T(`D_dn=${P.D_dn}`, X(dx + 20), Y(-P.D_dn / 2), 24, '#22d3ee', 'left');
  T('第1段起點（下游基座頂）', X(-30), Y(0), 22, '#e2e8f0', 'right'); T('上游基座頂', X(-30), Y(yTop), 22, '#e2e8f0', 'right'); T('上游基座底（虛線）', X(-30), Y(P.dH_slope - P.D_up), 22, '#94a3b8', 'right'); T('各段斜坡起點（白線）；最前排踏步石實線、上游端巨石虛線（被遮）', X(W / 2), Y(yTop + P.S_stone + 60), 22, '#e2e8f0');
  T('正 視 圖', X(W / 2), Y(dy - 80), 34, '#38bdf8'); T('（依原圖尺寸產生，原圖無此視圖；自下游往上游看）', X(W / 2), Y(dy - 125), 24, '#fde047');
  return O;
}
/* ---- 畫面與 DXF：把原圖視圖疊到結構物位置 ---- */
function sltPaintPrims(A, map, o) {
  o = o || {}; ctx.save();
  A.forEach(q => { const S = q.p.map(map); if (S.length < 2) return; ctx.beginPath(); S.forEach((s, i) => i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1])); if (q.cl) ctx.closePath();
    if (q.f && q.cl && o.fill !== false) { ctx.fillStyle = q.f; ctx.fill(); } ctx.strokeStyle = o.col || q.c || '#ffffff'; ctx.lineWidth = o.lw || 1; ctx.setLineDash(q.d || o.dash ? [4, 3] : []); ctx.stroke(); });
  ctx.restore();
}
function sltDxfPrims(D, A, map, layer, col) { A.forEach(q => { const P = q.p.map(map).filter(Boolean); if (P.length >= 2) D.poly(P, layer, col, 0, q.cl, q.d ? 'DASHED' : undefined); }); }
function slt606Sec(st, sec) {   // 6-06 斜坡範圍內的橫斷面
  const u = (sec.sta - st.sta) * st.dir, P = sltRun(st).P; if (u < -P.B_up / 2 - 1e-6) return null; return slt606At(P, u);
}
(function () {
  const _g = stGeo; stGeo = function (st) { const g = _g(st); if (sltOn(st) && SLT_VIEW[st.sty] && g._sltK !== st.sty) { g._sltLines = g.lines; g.lines = {}; Object.keys(g._sltLines).forEach(k => { g.lines[k] = []; }); g._sltK = st.sty; } return g; };
  const _dp = stDrawPlan; stDrawPlan = function () { _dp(); if (state.viewMode !== '2D') return;
    state.structs.forEach((st, i) => { const V = sltViews(st); if (!V || !V.plan || !getPointAndNormalAtStation(st.sta)) return; const map = ([u, x]) => { const w = stWorld(st, u, x); if (!w) return [0, 0]; const s = worldToScreen2D(w[0], w[1]); return [s.x, s.y]; }; sltPaintPrims(V.plan, map, { lw: i === state.structSel ? 1.6 : 1.2 }); }); };
  const _pp = stDrawProfile; stDrawProfile = function (sx, sy, minSta, maxSta) { _pp(sx, sy, minSta, maxSta);
    state.structs.forEach(st => { if (st.sta < minSta - 1e-6 || st.sta > maxSta + 1e-6) return; const V = sltViews(st); if (!V || !V.sect) return; const pl = stPlace(st); sltPaintPrims(V.sect, ([u, z]) => [sx(st.sta + st.dir * u), sy(pl.zS + z)], { lw: 1 }); }); };
  const _dc = stDrawCross; stDrawCross = function (sec, sx, sy, isLarge) { _dc(sec, sx, sy, isLarge);
    (state.structs || []).forEach(st => { if (!sltOn(st)) return; const pl = stPlace(st), d = st.dir, map = ([x, z]) => [sx(d * (x + (st.p.off || 0))), sy(pl.zS + z)];
      if (st.sty === 'e606') { const r = slt606Sec(st, sec); if (!r) return; sltPaintPrims(r.prims, map, { lw: isLarge ? 1.3 : 0.9 });
        if (isLarge) { ctx.save(); ctx.fillStyle = '#fde047'; ctx.font = 'bold 12px "Microsoft JhengHei", sans-serif'; ctx.textAlign = 'left'; const [tx, ty] = map([-st.dir * sltRun(st).P.W_weir / 200, r.zTop + 1.6]); ctx.fillText(`${st.name} 嵌石固床工：${r.part}（距壩軸 ${rvF((sec.sta - st.sta) * st.dir)} m）`, tx, ty); ctx.restore(); } return; }
      if (!stAtSec(sec).includes(st)) return; const V = sltViews(st); if (V && V.elev) sltPaintPrims(V.elev, map, { lw: isLarge ? 1.3 : 0.9 }); }); };
  const _xp = stDxfPlan; stDxfPlan = function (D) { _xp(D); state.structs.forEach(st => { const V = sltViews(st); if (!V || !V.plan || !getPointAndNormalAtStation(st.sta)) return; sltDxfPrims(D, V.plan, ([u, x]) => stWorld(st, u, x), 'STRUCT_PLAN', 30); }); };
  const _xf = stDxfProfile; stDxfProfile = function (D, X, Y, minSta, maxSta, th) { _xf(D, X, Y, minSta, maxSta, th); state.structs.forEach(st => { if (st.sta < minSta || st.sta > maxSta) return; const V = sltViews(st); if (!V || !V.sect) return; const pl = stPlace(st); sltDxfPrims(D, V.sect, ([u, z]) => [X(st.sta + st.dir * u), Y(pl.zS + z)], 'STRUCT_PROF', 30); }); };
  const _xc = stDxfCross; stDxfCross = function (D, sec, sx, sy, TH) { _xc(D, sec, sx, sy, TH);
    (state.structs || []).forEach(st => { if (!sltOn(st)) return; const pl = stPlace(st), d = st.dir, map = ([x, z]) => [sx(d * (x + (st.p.off || 0))), sy(pl.zS + z)];
      if (st.sty === 'e606') { const r = slt606Sec(st, sec); if (!r) return; sltDxfPrims(D, r.prims, map, 'STRUCT_ELEV', 30); const [tx, ty] = map([sltRun(st).P.W_weir / 200 + 0.3, r.zTop + 0.5]); D.text(tx, ty, TH || 0.3, `${st.name} 嵌石固床工：${r.part}`, 'STRUCT_TEXT', 30); return; }
      if (!stAtSec(sec).includes(st)) return; const V = sltViews(st); if (V && V.elev) sltDxfPrims(D, V.elev, map, 'STRUCT_ELEV', 30); }); };
  const _zr = stZRange; stZRange = function (sec) { let r = _zr(sec); (state.structs || []).forEach(st => { if (!sltOn(st) || st.sty !== 'e606') return; const q = slt606Sec(st, sec); if (!q) return; const pl = stPlace(st), P = sltRun(st).P, lo = pl.zS + (Math.min(-P.D_up, -P.dH_slope - P.D_dn, -P.dH_slope - 200) / 100), hi = pl.zS + q.zTop + P.h1 / 100 + 0.3; r = r ? [Math.min(r[0], lo), Math.max(r[1], hi)] : [lo, hi]; }); return r; };
})();

/* v5.8 箱籠固床工拖動：在縱／橫斷面拖動高程＝增減箱籠層數（頂高改變）；
   RC 底板與下游設計高不動（埋入層數不變）。連動時：上游側設計線改到新箱籠頂，下游側設計線維持原高（里程大側 VIP 同步平移抵銷落差變化） */
(function () {
  const _a = stApplyDrag;
  stApplyDrag = function (hd, z) {
    const st = hd.st;
    if (!(sltOn(st) && st.sty === 'g604' && (hd.kind === 'zB' || hd.kind === 'zS'))) return _a(hd, z);
    const P = sltRun(st).P, H1 = P.H1 / 100;
    if (hd.g0 === undefined) { const pl = stPlace(st), ne = st.sp.__exp !== undefined ? Math.round(+st.sp.__exp) : P.N_layer; hd.g0 = { N: P.N_layer, bur: Math.max(0, P.N_layer - Math.min(P.N_layer, ne)), zB: pl.zB, top: pl.zS, h2: st.p.h2, exp: st.sp.__exp }; st._gH0 = st.p.h2; }
    const g = hd.g0, dTop = hd.kind === 'zB' ? z - (hd.zB0 !== undefined ? hd.zB0 : g.zB) : z - g.top;
    const N = Math.max(1, Math.min(10, g.N + Math.round(dTop / H1))); if (N === Math.round(+st.sp.p_N_layer || g.N) && st._gDrag) return;
    st._gDrag = 1; st.sp = Object.assign({}, st.sp, { p_N_layer: String(N), __fc: [] });
    if (g.exp !== undefined) st.sp.__exp = Math.max(0, N - g.bur);
    sltSync(st); if (st.link) st._zT = g.zB; else st.zB = g.zB;
  };
  const _c = stCommitMove;
  stCommitMove = function (st) {
    if (st && st._gDrag) {
      const dH = st.p.h2 - (st._gH0 || 0); st._gDrag = 0; st._gH0 = undefined;
      if (st.link && Math.abs(dH) > 1e-6) {
        ensureVipMode(); buildProfileModel(); const V = state.profile.vips;
        if (!V.some(q => Math.abs(q.sta - st.sta) < 0.3)) { V.push({ sta: +(+st.sta).toFixed(3), z: +evalProfileLine(st.sta).toFixed(3), L: 0 }); V.sort((a, b) => a.sta - b.sta); }
        V.forEach(q => { if (q.sta > st.sta + 0.3) q.z = +(q.z + st.dir * dH).toFixed(3); });
      }
    }
    return _c(st);
  };
})();

/* ============================================================================
   v6.3 曲型副壩開挖：沿實際弧形基礎，垂直壩軸（徑向）切斷面，平均斷面法 × 壩軸弧長
   開挖底＝基礎底（止滑榫處為榫底；翼端隨岸坡升高）−10 cm；基礎平面外緣外放 km 後以 1:kx 往上斜；
   只計「地面與設計面較低者」以下（河道本身挖方已計於土方總表）。切點＝各區段（單元 B／A、間隙、端部壩身、翼牆）交界，
   段內再加密至 ≤2.5 m；兩端沿翼牆延伸方向外推至開挖面積為 0。
   ============================================================================ */
function cdamExcav(st) {
  const S = TCO_S.cdam, Gm = S.geo, P = sltRun(st).P, pl = stPlace(st), p = st.p, kx = Math.max(p.kx, 1e-3), km = Math.max(0, p.km);
  const GR = stGround(st), surf = GR.surf, zW = P.zD, zOf = zc => pl.zS + (zc - zW) / 100;
  const Z = Gm.zones(P), sE = P.U / 2, sl = -sE - P.LwL, sr = sE + P.LwR, F = Gm.secFound(P);
  const dLo = Math.min(...F.map(q => q[0])), dHi = Math.max(...F.map(q => q[0]));
  const fBot = d => { let lo = Infinity; for (let i = 0; i < F.length; i++) { const a = F[i], b = F[(i + 1) % F.length]; if ((a[0] - d) * (b[0] - d) <= 0 && Math.abs(b[0] - a[0]) > 1e-9) lo = Math.min(lo, a[1] + (d - a[0]) / (b[0] - a[0]) * (b[1] - a[1])); else if (Math.abs(a[0] - d) < 1e-9) lo = Math.min(lo, a[1]); } return Number.isFinite(lo) ? lo : 0; };
  const zoneAt = s => Z.find(z => s >= z.s0 - 1e-6 && s <= z.s1 + 1e-6) || (s < 0 ? Z[0] : Z[Z.length - 1]);
  const rngAt = s => (Gm.dRange ? Gm.dRange(P, Math.max(sl, Math.min(sr, s))) : [dLo, dHi]);   // v6.3：翼端平段只剩翼牆（寬 We）
  const floorZ = (s, d) => { const sc = Math.max(sl, Math.min(sr, s)), fl = Gm.flatOf && Gm.flatOf(P, sc), [lo, hi] = rngAt(sc), dc = Math.max(lo, Math.min(hi, d)); return zOf(fl ? Gm.botZ(P, zoneAt(sc), sc) : Math.max(fBot(dc), Gm.botZ(P, zoneAt(sc), sc))) - ST_CL; };
  const zsDev = (s, d) => { const [lo, hi] = rngAt(s), ds = Math.max(0, sl - s, s - sr) / 100, dd = Math.max(0, lo - d, d - hi) / 100, dist = Math.hypot(ds, dd); return floorZ(s, d) + (dist <= km ? 0 : (dist - km) / kx); };
  const toUX = (s, d) => { const q = Gm.plan(P, s, d); return [q[1] / 100, q[0] / 100]; };   // → [u, x] m
  const inv = (u, x) => {   // [u,x] m → 展開座標 {s,d} cm（v6.3：與斜接平面對應）
    if (Gm.inv) return Gm.inv(P, x * 100, u * 100);
    const X = x * 100, U = u * 100, ph = Math.atan2(X, P.R - U), s = P.R * ph;
    if (Math.abs(s) <= sE) return { s, d: Math.hypot(X, P.R - U) - P.R };
    const sg = ph < 0 ? -1 : 1, phE = sg * sE / P.R, x0 = P.R * Math.sin(phE), u0 = P.R * (1 - Math.cos(phE)), t = sg * (X - x0);
    return t >= 0 ? { s: sg * (sE + t), d: u0 - U } : { s, d: Math.hypot(X, P.R - U) - P.R };
  };
  const zs = (u, x) => { const q = inv(u, x); return zsDev(q.s, q.d); };
  // 深度上限 → 外推距離
  let zmax = -1e9; const SA = stSecAt(st); [SA.pre, SA.post, SA.any].forEach(sec => sec && sec.samples.forEach(s => { const v = Math.min(s.groundZ, s.desZ); if (Number.isFinite(v)) zmax = Math.max(zmax, v); }));
  const zLow = zOf(-P.Hk) - ST_CL, depthMax = Math.max(0.5, Math.min(25, zmax - zLow)), E = km + kx * depthMax + 0.5;
  // 徑向切斷面面積 A(s)：沿 d 積分（地面以下、開挖面以上）
  const dA = dLo - E * 100, dB = dHi + E * 100, dd = 5;
  const areaAt = s => { let A = 0, da = null, db = null; for (let d = dA + dd / 2; d < dB; d += dd) { const [u, x] = toUX(s, d), h = surf(u, x) - zsDev(s, d); if (h > 0) { A += h * dd / 100; if (da === null) da = d; db = d; } } return { A, da, db }; };
  // 切點：區段交界＋加密（≤250 cm）
  let ss = [sl, sr, 0]; Z.forEach(z => ss.push(z.s0, z.s1)); ss = [...new Set(ss.map(v => +v.toFixed(2)))].sort((a, b) => a - b);
  const sc = []; ss.forEach((v, i) => { if (i) { const a = ss[i - 1], n = Math.ceil((v - a) / 250); for (let k = 1; k < n; k++) sc.push(a + (v - a) * k / n); } sc.push(v); });
  const kindLab = s => { const z = zoneAt(s); return { B: '單元B', A: '單元A', gap: '間隙', gapB: '間隙', end: '端部壩身', wing: '翼牆' }[z.kind] || ''; };
  const cuts = sc.map(s => { const r = areaAt(s), c = { s, x: s / 100, A: r.A, key: true, da: r.da, db: r.db, kind: kindLab(s) };
    const ga = Math.max(dA, (r.da !== null ? r.da : dLo) - 200), gb = Math.min(dB, (r.db !== null ? r.db : dHi) + 200), gl = [], dl = [], ex = []; let cur = null;
    for (let d = ga; d <= gb + 1e-6; d += 10) { const [u, x] = toUX(s, d), a = GR.gnd(u, x), b = GR.des(u, x), sf = surf(u, x), z = zsDev(s, d); if (Number.isFinite(a)) gl.push([d / 100, a]); if (Number.isFinite(b)) dl.push([d / 100, b]);
      if (sf > z) { if (!cur) cur = [[d / 100, sf]]; cur.push([d / 100, z]); } else if (cur) { cur.push([d / 100, sf]); ex.push(stSimp(cur, 1e-4)); cur = null; } }
    if (cur) ex.push(stSimp(cur, 1e-4));
    c.gl = stSimp(gl, 1e-4); c.dl = stSimp(dl, 1e-4); c.ex = ex; return c; });
  const endSearch = (s0, sg) => { let s = s0; for (let k = 0; k < 400; k++) { const ns = s + sg * 20; if (areaAt(ns).A < 1e-3) return ns; s = ns; } return s; };
  const sEL = cuts.length && cuts[0].A > 1e-3 ? endSearch(cuts[0].s, -1) : sl, sER = cuts.length && cuts[cuts.length - 1].A > 1e-3 ? endSearch(cuts[cuts.length - 1].s, 1) : sr;
  // 標示：S1…自圖左（右岸翼端，s 最大）起；累距＝沿壩軸自右翼端起算 (m)
  const sRef = sr; cuts.sort((a, b) => b.s - a.s); cuts.forEach((c, i) => { c.id = 'S' + (i + 1); c.acc = (sRef - c.s) / 100; c.lab = stCutLab(st, c.acc); });
  const seq = [{ s: sER, A: 0, lab: '端', acc: (sRef - sER) / 100 }].concat(cuts).concat([{ s: sEL, A: 0, lab: '端', acc: (sRef - sEL) / 100 }]).filter((c, i, a) => !i || a[i - 1].s - c.s > 1e-6);
  const vrows = []; let Vsec = 0;
  for (let i = 0; i + 1 < seq.length; i++) { const a = seq[i], b = seq[i + 1], L = (a.s - b.s) / 100; if (L < 1e-9) continue; const v = (a.A + b.A) / 2 * L; Vsec += v; vrows.push({ a: a.lab, b: b.lab, xa: a.s / 100, xb: b.s / 100, accA: a.acc, accB: b.acc, L, Aa: a.A, Ab: b.A, V: v }); }
  // 平面網格：開挖外緣（參考體積）
  const bx = []; for (let s = sEL; s <= sER + 1e-6; s += (sER - sEL) / 80) [dA, dB].forEach(d => bx.push(toUX(s, d)));
  const u0 = Math.min(...bx.map(q => q[0])), u1 = Math.max(...bx.map(q => q[0])), x0 = Math.min(...bx.map(q => q[1])), x1 = Math.max(...bx.map(q => q[1])), cell = Math.max(0.2, Math.max(x1 - x0, u1 - u0) / 260);
  const NU = Math.floor((u1 - u0) / cell) + 1, NX = Math.floor((x1 - x0) / cell) + 1, Dg = new Float64Array(NU * NX); let Vu = 0, Vd = 0;
  for (let i = 0; i < NU; i++) { const u = u0 + i * cell; for (let j = 0; j < NX; j++) { const x = x0 + j * cell, d = surf(u, x) - zs(u, x); Dg[i * NX + j] = d; if (d > 0) { if (u < 0) Vu += d * cell * cell; else Vd += d * cell * cell; } } }
  const segs = [], PT = (i, j) => [u0 + i * cell, x0 + j * cell], itp = (pa, pb, va, vb) => { const t = va / ((va - vb) || 1e-12); return [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]; };
  for (let i = 0; i + 1 < NU; i++) for (let j = 0; j + 1 < NX; j++) {
    const v = [Dg[i * NX + j], Dg[(i + 1) * NX + j], Dg[(i + 1) * NX + j + 1], Dg[i * NX + j + 1]], c = [PT(i, j), PT(i + 1, j), PT(i + 1, j + 1), PT(i, j + 1)]; let m = 0; v.forEach((w, k) => { if (w > 0) m |= 1 << k; }); if (m === 0 || m === 15) continue;
    const cr = []; for (let k = 0; k < 4; k++) if ((v[k] > 0) !== (v[(k + 1) % 4] > 0)) cr.push(itp(c[k], c[(k + 1) % 4], v[k], v[(k + 1) % 4]));
    if (cr.length === 2) segs.push(cr); else if (cr.length === 4) { segs.push([cr[0], cr[1]]); segs.push([cr[2], cr[3]]); }
  }
  const kf = q => q[0].toFixed(4) + ',' + q[1].toFixed(4), adj = new Map(), used = new Uint8Array(segs.length); segs.forEach((sg, i) => sg.forEach(q => { const k = kf(q); if (!adj.has(k)) adj.set(k, []); adj.get(k).push(i); }));
  const outl = []; for (let i = 0; i < segs.length; i++) { if (used[i]) continue; used[i] = 1; const line = [segs[i][0], segs[i][1]];
    for (const dir of [1, 0]) { for (;;) { const end = dir ? line[line.length - 1] : line[0], nb = (adj.get(kf(end)) || []).find(k => !used[k]); if (nb === undefined) break; used[nb] = 1; const sg = segs[nb], nx = kf(sg[0]) === kf(end) ? sg[1] : sg[0]; if (dir) line.push(nx); else line.unshift(nx); } }
    if (line.length > 3) outl.push(stSimp(line, cell * cell * 0.02)); }
  const loop = outl.length ? outl.reduce((a, c) => (c.length > a.length ? c : a), outl[0]) : [];
  const profs = []; { let cur = null; for (let u = u0; u <= u1 + 1e-9; u += 0.05) { const sf = surf(u, 0), z = zs(u, 0); if (sf > z) { if (!cur) cur = [[u, sf]]; cur.push([u, z]); } else if (cur) { cur.push([u, sf]); profs.push(stSimp(cur, 1e-4)); cur = null; } } if (cur) profs.push(stSimp(cur, 1e-4)); }
  const gnd = (sec, x) => { const o = st.dir * (x + (p.off || 0)), a = secInterp(sec, o, 'groundZ'), c = secInterp(sec, o, 'desZ'), v = Math.min(a, c); return Number.isFinite(v) ? v : -1e9; };
  const crossFor = sec => { if (!sec) return []; const pts = []; let xa = null, xb = null; for (let x = x0; x <= x1; x += 0.1) { if (gnd(sec, x) > zs(0, x)) { if (xa === null) xa = x; xb = x; } }
    if (xa !== null) { pts.push([xa, gnd(sec, xa)]); for (let x = xa; x <= xb + 1e-9; x += 0.1) pts.push([x, zs(0, x)]); pts.push([xb, gnd(sec, xb)]); } return stSimp(pts, 1e-4); };
  const up = st.dir > 0 ? SA.pre : SA.post, dn = st.dir > 0 ? SA.post : SA.pre;
  st._exF = { surf, zs, gnd: GR.gnd, des: GR.des, kMid: 0, hasKey: false, u0, u1, x0, x1, tin: GR.tin };
  return { V: Vsec, Vgrid: Vu + Vd, Vu, Vd, Vk: 0, Vacc: 0, ok: true, loop, outl, profs, crossU: crossFor(up || SA.any), crossD: crossFor(dn || SA.any), cuts, vrows, xEL: sEL / 100, xER: sER / 100, tin: GR.tin, radial: true, sl, sr, dLo, dHi, E };
}
/* 曲型副壩標準圖：加繪「開挖切斷面（垂直壩軸）」與逐段計算表 */
function cdamExcStd(st, P0, bb) {
  const ex = st._ex; if (!ex || !ex.ok || !ex.radial || !ex.cuts.length) return;
  const pl = stPlace(st), zS = pl.zS, Pm = sltRun(st).P, Gm = TCO_S.cdam.geo, F = Gm.secFound(Pm), zOf = zc => (zc - Pm.zD) / 100;
  let TH = 0.3; const L = (pts, c, a, ly, o = {}) => { const q = pts.filter(v => Number.isFinite(v[0]) && Number.isFinite(v[1])); if (q.length > 1) P0.push({ t: 'l', p: q, c, a, ly, d: o.d || 0, w: o.w || 1, cl: !!o.cl }); };
  const T = (x, y, h, s, c, a, ly, o = {}) => P0.push({ t: 't', x, y, h, s: String(s), c, a, ly, al: o.al || 'l', va: o.va || 'b', rot: o.rot || 0 });
  let dMin = Infinity, dMax = -Infinity, span = 0; ex.cuts.forEach(c => { let h = -Infinity, l = Infinity; [c.gl, ...c.ex].forEach(a => a.forEach(([d, z]) => { dMin = Math.min(dMin, d); dMax = Math.max(dMax, d); h = Math.max(h, z - zS); l = Math.min(l, z - zS); }));
    h = Math.max(h, zOf(Pm.Hf)); l = Math.min(l, zOf(-Pm.Hk) - ST_CL); c._zh = h; c._zl = l; span = Math.max(span, h - l); });
  if (!Number.isFinite(dMin)) return;
  TH = Math.max(0.2, (dMax - dMin) / 22);
  const cw = (dMax - dMin) + TH * 14, ch = span + TH * 7, nC = ex.cuts.length, WL = bb.x1 - bb.x0, HL = bb.y1 - bb.y0; let nrow = 1, best = 1e9;
  for (let r = 1; r <= nC; r++) { const c = Math.ceil(nC / r), asp = (WL + c * cw + TH * 6) / Math.max(HL, r * ch + TH * 30), e = Math.abs(Math.log(asp / 1.414)); if (e < best) { best = e; nrow = r; } }
  const ncol = Math.ceil(nC / nrow), top0 = bb.y1 - TH * 2, x00 = bb.x1 + TH * 6;
  T(x00, top0, TH * 1.4, `${st.name}　開挖切斷面（垂直壩軸，下游在左；S1…自右岸翼端起編號，累距沿壩軸自右翼端起算）　開挖底＝基礎底−${ST_CL * 100}cm、外放 km=${stf(st.p.km)} m、邊坡 1:${st.p.kx}`, ST_SC.ttl, 30, 'STD_TITLE', { va: 't' });
  const fp = F.map(([d, z]) => [-d / 100, zOf(z)]);   // d＞0＝上游 → 圖上取 −d（下游在左）
  ex.cuts.forEach((c, i) => {
    const col = i % ncol, row = Math.floor(i / ncol), ox = x00 + col * cw + dMax + TH * 2, yT = top0 - TH * 3 - row * ch, oy = yT - TH - c._zh;
    const mp = ([d, zabs]) => [ox - d, zabs - zS + oy], mr = ([x, z]) => [ox + x, z + oy];
    const zb = Math.max(0, Gm.botZ(Pm, Gm.zones(Pm).find(z => c.s >= z.s0 - 1e-6 && c.s <= z.s1 + 1e-6) || { kind: 'B' }, c.s) + Pm.Hk) / 100;
    L(fp.map(([x, z]) => [x, z + zb]).concat([[fp[0][0], fp[0][1] + zb]]).map(mr), ST_SC.st, 2, 'STD_STRUCT');
    L(c.gl.map(mp), ST_SC.gnd, 8, 'STD_GROUND'); L(c.dl.map(mp), ST_SC.des, 5, 'STD_DESIGN', { d: 1 }); c.ex.forEach(e => L(e.map(mp), ST_SC.exc, 6, 'STD_EXC', { d: 1 }));
    const yL = oy + c._zl - TH * 0.6; T(ox - (dMax + dMin) / 2, yL, TH * 1.0, `${c.id} ${c.lab}（${c.kind}）`, ST_SC.ttl, 30, 'STD_TITLE', { al: 'c', va: 't' });
    T(ox - (dMax + dMin) / 2, yL - TH * 1.4, TH * 0.8, `開挖 A=${stf(c.A)} m²`, ST_SC.exc, 6, 'STD_TEXT', { al: 'c', va: 't' });
  });
  let y = top0 - TH * 3 - nrow * ch - TH * 2;
  T(x00, y, TH * 1.3, `${st.name}　開挖逐段計算（V＝(A1+A2)/2×L，L＝兩切斷面間壩軸弧長）`, ST_SC.ttl, 30, 'STD_TITLE', { va: 't' }); y -= TH * 2;
  const cols = [0, 14, 24, 32, 42, 52].map(v => x00 + v * TH), hd = ['區間', '累距(m)', 'L(m)', 'A1(m²)', 'A2(m²)', 'V(m³)'];
  hd.forEach((h, k) => T(cols[k], y, TH * 0.8, h, ST_SC.txt, 7, 'STD_QTY', { va: 't' })); y -= TH * 1.3;
  const half = Math.ceil(ex.vrows.length / 2), y0 = y, w2 = 64 * TH;
  ex.vrows.forEach((v, i) => { const off = i < half ? 0 : w2, yy = y0 - (i < half ? i : i - half) * TH * 1.15; if (i === half) hd.forEach((h, k) => T(cols[k] + w2, y0 + TH * 1.3, TH * 0.8, h, ST_SC.txt, 7, 'STD_QTY', { va: 't' }));
    [`${v.a}～${v.b}`, `${stf(v.accA)}～${stf(v.accB)}`, stf(v.L), stf(v.Aa), stf(v.Ab), stf(v.V)].forEach((t, k) => T(cols[k] + off, yy, TH * 0.72, t, '#cbd5e1', 7, 'STD_QTY', { va: 't' })); });
  y = y0 - half * TH * 1.15 - TH * 0.6; T(x00, y, TH * 0.9, `合計 V＝${stf(ex.V)} m³（${ex.cuts.length} 個切斷面＋兩端收斂至面積 0）；（參考）網格法 ${stf(ex.Vgrid)} m³`, ST_SC.exc, 6, 'STD_QTY', { va: 't' });
  bb.x1 = Math.max(bb.x1, x00 + ncol * cw, x00 + 2 * w2); bb.y0 = Math.min(bb.y0, y - TH * 2);
}
(function () {
  const _e = stExcav; stExcav = function (st, noAcc) { return sltOn(st) && st.sty === 'cdam' ? cdamExcav(st) : _e(st, noAcc); };
  // v6.3i：護岸在曲型副壩前後截斷——上游段止於翼牆（端部壩身）上游面、下游段自翼牆下游面再起（翼牆位於弧端，較拱冠偏下游一個矢高）
  let CDZ_SIG = '', CDZ_SIDE = null;
  const cdamFace = (st, P, sd) => {   // 護岸所在側：牆腳橫距 e → 翼牆位置 s → 該處壩體上下游面（翼端平段只剩翼牆 dS0～dS1，其餘為端部壩身底寬 ±B_w/2）
    const sg = sd === 'L' ? -1 : 1, e = rvEDefAt(st.sta), xc = (sg * e * st.dir - (st.p.off || 0)) * 100, w = xc < 0 ? 'L' : 'R', sw = (xc < 0 ? -1 : 1) * (P.U / 2 + Math.max(0, Math.abs(xc) - P.x0E));
    const f = TCO_S.cdam.geo.flatOf(P, sw), d0 = f ? P['dS0' + f] : -P.Bw2, d1 = f ? P['dS1' + f] : P.Bw2; void w;
    const sA = st.sta + st.dir * (P.u0E - d1) / 100, sB = st.sta + st.dir * (P.u0E - d0) / 100; return { a: Math.min(sA, sB), b: Math.max(sA, sB), sUp: sA, endS: sB }; };
  const _rz = rvZones; rvZones = function () { const Z = _rz(); let sig = '';
    Z.forEach(z => { const st = (state.structs || []).find(t => t.id === z.sid); if (!st || st.sty !== 'cdam' || !sltOn(st)) return; try { const P = sltRun(st).P, F = { L: cdamFace(st, P, 'L'), R: cdamFace(st, P, 'R') }, U = CDZ_SIDE ? F[CDZ_SIDE] : { a: Math.min(F.L.a, F.R.a), b: Math.max(F.L.b, F.R.b), sUp: F.L.sUp, endS: F.L.endS };
      Object.assign(z, U, { kind: 'cdam', walls: false, hw: null, cdam: true }); sig += z.sid + ':' + ['L', 'R'].map(k => F[k].a.toFixed(3) + ':' + F[k].b.toFixed(3)).join(':') + ';'; } catch (e) { } });
    if (sig !== CDZ_SIG) { CDZ_SIG = sig; RV_ZVER++; } Z.sort((p, q) => p.a - q.a); return Z; };
  const _pi = rvPiecesInfo; rvPiecesInfo = function (rv) { const o = CDZ_SIDE; CDZ_SIDE = rv.side; try { return _pi(rv); } finally { CDZ_SIDE = o; } };
  const _fs = rvFaceSta; rvFaceSta = function (rv, j, sE) { const st = j && j.sid !== undefined ? (state.structs || []).find(t => t.id === j.sid) : null; if (st && st.sty === 'cdam') return j.s; return _fs(rv, j, sE); };
  // v6.3i：曲型副壩縱斷面標「溢洪口 EL」（單元 B 頂＝上游設計高）
  const cdamSp = (minSta, maxSta) => (state.structs || []).filter(st => sltOn(st) && st.sty === 'cdam' && st.sta >= minSta - 1e-6 && st.sta <= maxSta + 1e-6);
  const _dp = stDrawProfile; stDrawProfile = function (sx, sy, minSta, maxSta) { _dp(sx, sy, minSta, maxSta); try { cdamSp(minSta, maxSta).forEach(st => { const pl = stPlace(st), X = sx(st.sta), Y = sy(pl.zS), dx = -st.dir * 14;
    ctx.save(); ctx.strokeStyle = '#38bdf8'; ctx.fillStyle = '#38bdf8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X - 6, Y); ctx.lineTo(X + 6, Y); ctx.moveTo(X, Y); ctx.lineTo(X + dx, Y - 16); ctx.lineTo(X + dx * 5, Y - 16); ctx.stroke();
    ctx.font = 'bold 11px "Noto Sans TC"'; ctx.textAlign = dx < 0 ? 'right' : 'left'; ctx.fillText(`溢洪口 EL ${stf(pl.zS)}`, X + dx * 5 + (dx < 0 ? -3 : 3), Y - 12); ctx.restore(); }); } catch (e) { console.error('cdamProfLab', e); } };
  const _dxp = stDxfProfile; stDxfProfile = function (D, X, Y, minSta, maxSta, th) { _dxp(D, X, Y, minSta, maxSta, th); try { cdamSp(minSta, maxSta).forEach(st => { const pl = stPlace(st), x = X(st.sta), y = Y(pl.zS), dx = -st.dir * (th || 0.3) * 1.5;
    D.line(x, y, 0, x + dx, y + (th || 0.3) * 1.6, 0, 'STRUCT_TEXT', 4); D.line(x + dx, y + (th || 0.3) * 1.6, 0, x + dx * 6, y + (th || 0.3) * 1.6, 0, 'STRUCT_TEXT', 4);
    D.text(x + dx * 6, y + (th || 0.3) * 2, (th || 0.3) * 0.8, `溢洪口 EL ${stf(pl.zS)}`, 'STRUCT_TEXT', 4, { align: dx < 0 ? 'r' : 'l' }); }); } catch (e) { console.error('cdamDxfLab', e); } };
  const _sp = sltStdPrims; sltStdPrims = function (st) { const r = _sp(st); if (st.sty === 'cdam') { try { cdamExcStd(st, r.P, r.bb); } catch (e) { console.error('cdamExcStd', e); } } return r; };
  const _sq = sltQty; sltQty = function (st, q) { const r = _sq(st, q); if (st.sty === 'cdam') { const ex = st._ex; r.rows.forEach(x => { if (/^結構物開挖/.test(x.it)) { x.it = '結構物開挖（依地形；垂直壩軸切斷面，平均斷面法×壩軸弧長，含邊坡）'; if (ex && ex.ok && ex.radial) x.fx = `${ex.cuts.length} 個徑向切斷面（區段交界＋加密 ≤2.5 m）＋兩端沿翼牆方向收斂至面積 0；V＝Σ(A1+A2)/2×L，L＝壩軸弧長。開挖底＝基礎底（止滑榫處為榫底、翼端隨岸坡）−${ST_CL * 100}cm，外放 km=${stf(st.p.km)} m，邊坡 1:${st.p.kx}；只計地面與設計面較低者以下。（參考）網格法 ${stf(ex.Vgrid)} m³`; } }); } return r; };
})();
