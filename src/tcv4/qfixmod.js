/* ============================================================================
   qfixmod.js（v6.3）護岸原圖移植型式：數量計算式修正＋「數量計算依據」註記（圖上未直接標示的推算值與係數）
   ============================================================================ */
const QF_F = (v, d = 2) => (Number.isFinite(+v) ? (+v).toFixed(d) : '—');
const QF_NOTES = {
  dry0402: m => { const Df = m.Df / 100, fr = (m.w_exc_front / 100 + 0.5 * Df * (m.n_slope + m.m_exc)) * Df; return [
    `塊石層：頂寬 B1＝${QF_F(m.B1, 1)}、底寬 B2＝${QF_F(m.B2, 1)}、總高 H＝${m.H_total} cm（斷面圖標註），斷面積＝(B1＋B2)/2×H`,
    `臨水面斜長＝H×√(1＋n²)＝${m.H_total}×${QF_F(m.slopeFactor, 3)}＝${QF_F(m.L_slope, 1)} cm`,
    `前趾開挖斷面＝(前趾餘寬 ${m.w_exc_front}＋½×Df ${m.Df}×(n ${m.n_slope}＋開挖坡 ${m.m_exc}))×Df＝${QF_F(fr, 3)} m²`,
    `坡頂回填＝回填寬 ${m.w_top_fill} × 高 ${m.__htf ?? 35} × ½`] },
  b403: m => [
    `外露面：頂層籠寬＋(層數−1)×退縮 B2＝${QF_F(m.B1 + (m.N_layer - 1) * m.B2, 0)} cm；立面 ${m.N_layer}×H1 ${m.H1} cm`,
    `不織布：總高 ${m.H_total} cm ＋ 背面階梯水平長（頂、底層後緣差＋礫石底 ${m.t_grav_bot}＋搭接 ${m.__lap ?? 30} cm）`,
    `開挖前趾三角＝½×D_embed ${QF_F(m.D_embed, 1)}²×${m.__mt ?? 0.45}（開挖坡 1:${m.__mt ?? 0.45}）＝${QF_F(0.5 * Math.pow(m.D_embed / 100, 2) * (m.__mt ?? 0.45), 3)} m²`,
    '籠內填石：80% 主石 22~35 cm、15% 填充石、5% 填縫卵石'],
  g404: m => [
    `外露面：頂層籠寬＋(層數−1)×退縮 B2＝${QF_F(m.B1 + (m.N_layer - 1) * m.B2, 0)} cm；立面 ${m.N_layer}×H1 ${m.H1} cm`,
    `坡頂覆土＝覆土寬 ${m.w_top_fill} × 厚 ${m.t_top_sand} cm`,
    `開挖前趾三角＝½×D_embed ${QF_F(m.D_embed, 1)}²×${m.__mt ?? 0.45}（開挖坡 1:${m.__mt ?? 0.45}）＝${QF_F(0.5 * Math.pow(m.D_embed / 100, 2) * (m.__mt ?? 0.45), 3)} m²`,
    '每 1 m³ 籠體內裝 1 只織布袋'],
  s406: m => [
    `砌石層、混凝土層、礫石層、基礎座斷面積均由斷面圖多邊形計算（臨水面斜率 1:${m.n_slope}，斜長＝${m.H_wall}×${QF_F(m.slopeFactor, 3)}＝${QF_F(m.H_wall * m.slopeFactor, 1)} cm）`,
    `排水管：斜面積 ${QF_F(m.H_wall * m.slopeFactor / 100, 2)}×L ÷ 2 m²（@2m²）取整；單支長＝砌石水平厚 ${QF_F(m.w_stone_h, 1)}＋混凝土 ${QF_F(m.w_mid_h, 1)}＋外伸 ${m.__wx ?? 15} cm`,
    `鋼筋：主筋 ${m.rebar_main_key}、副筋 ${m.rebar_sub_key} @${m.S_rebar} cm，支數＝分段長÷間距＋1，單支長依斷面配筋展開`],
  p405: m => m.dwg_mode === '0405-1' ? [m.__qf1 ? `R.C 箱斷面依斷面圖：每階斜長 ${m.__qf1.sl.toFixed(1)} cm（階高 ${(m.__R || {}).rc_hs ?? 148}、坡 1:${m.m_rc}）× 厚 ${m.__qf1.th} cm＝${m.__qf1.A.toFixed(3)} m²` : '', `PE 土包袋回填深 ${(m.__R || {}).pe_d ?? 150} cm × 寬 B ${m.rc_B} cm`, '斷面圖為 1:2 縮繪，標註值為實際尺寸'] : [
    m.__qf ? `斷面圖多邊形實算：預鑄塊混凝土 ${m.__qf.Ab.toFixed(0)} cm²、凹槽 ${m.__qf.Ap.toFixed(0)} cm²、基礎板 ${m.__qf.Af.toFixed(0)} cm²、蓋板 ${m.__qf.Ac.toFixed(0)} cm²；凹槽淨長 ${m.__qf.Lin}＝${m.L_blk}−兩端牆 3+3 cm；單塊 ${m.__qf.vBlk.toFixed(4)} m³` : '預鑄塊斷面依原圖',
    `濾層斜長＝√((層數×${QF_F(m.stepDx, 1)})²＋(層數×${QF_F(m.stepDy, 1)})²)；打底寬 B_pc＝B_fnd ${m.B_fnd}＋2×${m.w_pc} cm`,
    '開挖斷面＝預鑄塊淨斷面×層數＋基礎板＋蓋板＋濾層＋打底']
};

/* p405（0405-2）：預鑄塊、凹槽、基礎板、蓋板改由斷面圖多邊形實算（原工具寫死 0.0885／0.0945／0.168／+0.006） */
const QF_P405 = { blk: [[0, 0], [33.57, -8.77], [35.04, -6.05], [45.95, -8.90], [70.87, 39.55], [59.96, 42.40], [37.89, 1.45], [15.34, 3.95], [14.33, 5.72], [21.71, 47.13], [24.93, 48.45], [25.64, 51.19], [19.56, 51.03], [12.82, 49.05]],
  pocket: [[24.93,48.45],[21.71,47.13],[14.03,4.1],[37.88,1.45],[60.68,43.75],[24.93,48.45]], fnd: [[0, 0], [56.75, 0], [56.75, 10.54], [45.84, 13.39], [44.37, 10.67], [10.80, 19.44], [12.75, 26.89], [11.73, 23.00], [0, 23.00]] };
function qfA(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
function qfP405(m) {
  if (!m.quantities) return;
  if (m.dwg_mode === '0405-1') {   // 斷面圖（1:2 縮繪）：每階 R.C 箱＝斜長 √(148²＋(148·m)²) × 厚 84 cm（原圖 1.80×1.20 改依圖面）
    const R0 = m.__R || {}, hs = +(R0.rc_hs ?? 148), sl = Math.hypot(hs, hs * m.m_rc), th = +(R0.rc_t ?? 84), A = sl * th / 1e4, q = m.quantities.find(x => x.id === '1');
    m.__qf1 = { sl, th, A };
    if (q) { q.perM = 2 * m.N_rc * A; q.total = q.perM * m.Lm; q.formula = `2岸 × ${m.N_rc}階 × (斜長 ${sl.toFixed(1)} × 厚 ${th}) cm² × ${m.Lm.toFixed(1)}m`; }
    return;
  }
  const sx = m.sx || 1, sy = m.sy || 1, fx = m.B_fnd / 56.75, csx = m.cap_a / 46.9, csy = m.t_cap / 10, cb = m.cap_b / 14.6;
  const Ab = qfA(QF_P405.blk.map(p => [p[0] * sx, p[1] * sy])), Ap = qfA(QF_P405.pocket.map(p => [p[0] * sx, p[1] * sy])), Af = qfA(QF_P405.fnd.map(p => [p[0] * (p[0] > 50 ? fx : (p[0] === 0 ? 1 : sx)), p[1] * sy])) ;
  const Ac = qfA([[24.92 * sx, 58.44 * sy], [(24.92 + 48 * csx) * sx, 58.44 * sy], [(24.92 + 48 * csx) * sx, (58.44 - 14.9 * cb) * sy], [(24.92 + 37.3 * csx) * sx, (58.44 - 11.8 * cb) * sy], [(24.92 + 35.8 * csx) * sx, (58.44 - 14.7 * cb) * sy], [24.92 * sx, (58.44 - 10 * csy) * sy]]);
  const Lb = m.L_blk, Lin = Lb - 6, nPerM = 100 / Lb, vBlk = (Ab * Lb + Ap * 6) / 1e6, Lm = m.Lm;
  m.__qf = { Ab, Ap, Af, Ac, vBlk, Lin };
  const Q = id => m.quantities.find(q => q.id === id), set = (id, perM, f) => { const q = Q(id); if (!q) return; q.perM = perM; q.total = perM * Lm; q.formula = f; };
  const q1 = Q('1'); if (q1) { q1.formula = `(${m.N_stone}+${m.N_soil})層 × (${m.L_unit}/${Lb})塊/層 = ${(m.N_total * m.L_unit / Lb).toFixed(1)}塊；單塊＝(斷面 ${Ab.toFixed(0)} cm²×${Lb} ＋ 端牆 2×3×凹槽 ${Ap.toFixed(0)} cm²)＝${vBlk.toFixed(4)} m³`; q1.note = `每塊 ${vBlk.toFixed(3)} m³（斷面圖多邊形實算）`; }
  set('2', (Af + Ac) / 1e4, `(基礎板 ${Af.toFixed(0)} ＋ 蓋板 ${Ac.toFixed(0)}) cm² × ${Lm.toFixed(1)}`);
  set('3', m.N_stone * Ap / 1e4 * Lin / Lb, `${m.N_stone}層 × 凹槽 ${Ap.toFixed(0)} cm² × (${Lin}/${Lb}) × ${Lm.toFixed(1)}`);
  set('4', m.N_soil * Ap / 1e4 * Lin / Lb, `${m.N_soil}層 × 凹槽 ${Ap.toFixed(0)} cm² × (${Lin}/${Lb}) × ${Lm.toFixed(1)}`);
  const q5 = Q('5'), q6 = Q('6'), fl = q5 ? q5.perM : 0, pc = q6 ? q6.perM : 0, ex = m.N_total * (Ab + Ap) / 1e4 + (Af + Ac) / 1e4 + fl + pc;
  set('7', ex, `(${m.N_total}×(${Ab.toFixed(0)}+${Ap.toFixed(0)}) ＋ ${Af.toFixed(0)} ＋ ${Ac.toFixed(0)}) cm² ＋ 濾層 ${fl.toFixed(3)} ＋ 打底 ${pc.toFixed(3)} m² × ${Lm.toFixed(1)}`);
}
function qfFixModel(key, m, R) {
  if (R && m) { const n = v => (Number.isFinite(+v) && v !== null && v !== '' ? +v : undefined); m.__htf = n(R.htf); m.__mt = n(R.m_toe); m.__lap = n(R.lap); m.__wx = n(R.weep_x); }
  if (key === 'p405') { try { qfP405(m); } catch (e) { console.error('qfP405', e); } }
  try {
    if (key === 's406' && m.quantities) m.quantities.forEach(q => { if (q.id === '1' || q.id === '2') q.formula = `斷面積 ${QF_F(q.perM, 3)} m²（斷面圖多邊形）× ${QF_F(m.Lm, 1)}`; });
  } catch (e) { }
  return m;
}
function qfAddNotes(key, m, O) {
  const f = QF_NOTES[key]; if (!f || !Array.isArray(O) || !O.length) return O;
  let x0 = Infinity, y0 = Infinity; const hs = [];
  O.forEach(o => { if (o.k === 'T') { x0 = Math.min(x0, o.x); y0 = Math.min(y0, o.y); hs.push(+o.h || 0); } else if (o.p) o.p.forEach(v => { x0 = Math.min(x0, v[0]); y0 = Math.min(y0, v[1]); }); });
  if (!Number.isFinite(x0)) return O; hs.sort((a, b) => a - b); const h = (hs[Math.floor(hs.length / 2)] || 8) * 1.1;
  let N = []; try { N = f(m); } catch (e) { N = []; }
  O.push({ k: 'T', x: x0, y: y0 - h * 2.2, s: '數量計算依據（圖上未直接標示的推算值與係數）：', h: h * 1.1, c: '#fde047', al: 'left', bl: 'middle', rot: 0 });
  N.forEach((s, i) => O.push({ k: 'T', x: x0 + h, y: y0 - h * 2.2 - (i + 1) * h * 1.8, s: '・' + s, h, c: '#fde047', al: 'left', bl: 'middle', rot: 0 }));
  return O;
}
(function () {
  if (typeof tcoDry402Model === 'function') { const _m = tcoDry402Model; tcoDry402Model = function (R) { return qfFixModel('dry0402', _m(R), R); }; }
  if (typeof tcoDry402Prims === 'function') { const _p = tcoDry402Prims; tcoDry402Prims = function (m, o, part) { const O = _p(m, o, part); return part === 'all' ? qfAddNotes('dry0402', m, O) : O; }; }
  if (typeof TCO_T !== 'undefined') ['g404', 'b403', 's406', 'p405'].forEach(k => { const T = TCO_T[k]; if (!T) return;
    if (T.model) { const _m = T.model; T.model = function (...a) { return qfFixModel(k, _m.apply(this, a), a[0]); }; }
    if (T.prims) { const _p = T.prims; T.prims = function (m, o, part) { const O = _p.call(this, m, o, part); return part === 'all' ? qfAddNotes(k, m, O) : O; }; } });
})();
