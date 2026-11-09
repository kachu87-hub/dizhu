/* ============================================================================
   v6.3i 崩塌地整治：自由梁護坡（0201-1，原工具 98dd061f → ormodD.js TCO_D.frb）
   每個崩塌地案件可設一處：範圍＝整治區（多邊形）或沿基準線帶狀（左側偏距 w0～w1，左正）
   數量＝每 m² 單位量（依單格模數 (B2+B3)² 的圖面幾何）× 實際斜面積（三角網／DEM 以海龍公式積分）
   ============================================================================ */
const FRB_PR = [['B2_cm', '自由梁淨距 B2', 'cm', 5, 200], ['B3_cm', '自由梁寬 B3', 'cm', 1, 30], ['H_beam_cm', '自由梁高', 'cm', 1, 15], ['kArc', '梁頂圓弧係數（圖面）', '', 0.01, 0.88], ['t_sub_cm', '植生基材厚', 'cm', 1, 5],
  ['B1_cm', '錨釘間距 B1', 'cm', 5, 230], ['L1_cm', '輔錨釘（小ㄇ #4）長 L1', 'cm', 5, 70], ['L2_cm', '主錨釘（大ㄇ #5）長 L2', 'cm', 5, 120], ['L3_cm', '土(岩)釘（J 型 #6）長 L3', 'cm', 5, 150], ['hook_cm', '錨釘頂彎鉤寬', 'cm', 1, 10], ['hookJ_cm', 'J 型土釘彎鉤長', 'cm', 1, 22],
  ['d_hole_cm', '土岩釘鑽孔徑', 'cm', 0.5, 3], ['kMesh', '鐵絲網搭接係數', '', 0.01, 1.05], ['w3', '#3 單位重', 'kg/m', 0.001, 0.559], ['w4', '#4 單位重', 'kg/m', 0.001, 0.995], ['w5', '#5 單位重', 'kg/m', 0.001, 1.553], ['w6', '#6 單位重', 'kg/m', 0.001, 2.24], ['N_grid', '平面圖展示格數（圖面）', '格', 1, 3]];
function frbNorm(o) { o = o || {}; const p = {}; FRB_PR.forEach(q => { const v = parseFloat((o.p || {})[q[0]]); p[q[0]] = Number.isFinite(v) ? v : q[4]; }); return { on: !!o.on, src: o.src === 'bl' ? 'bl' : 'zone', w0: Number.isFinite(+o.w0) ? +o.w0 : 0, w1: Number.isFinite(+o.w1) ? +o.w1 : 10, p }; }
function frbUnit(p) {   // 每 m² 單位量（單格模數圖面幾何）
  const pitch = (p.B2_cm + p.B3_cm) / 100, Am = pitch * pitch, B3 = p.B3_cm / 100, Hb = p.H_beam_cm / 100, N = 80; let As = 0;
  for (let i = 0; i < N; i++) { const u = -1 + (i + 0.5) * 2 / N; As += Hb * Math.sqrt(Math.max(0, 1 - u * u * p.kArc)) * (B3 / N); }   // 圓弧頂梁斷面（圖面曲線積分）
  const Lb = 2 * pitch - B3, Vc = As * Lb, Asub = (p.B2_cm / 100) ** 2, wt3 = 2 * 2 * pitch * p.w3, wt4 = (p.L1_cm + p.hook_cm) / 100 * p.w4, wt5 = (p.L2_cm + p.hook_cm) / 100 * p.w5, wt6 = (p.L3_cm + p.hookJ_cm) / 100 * p.w6, kg = wt3 + wt4 + wt5 + wt6;
  const f = (v, d) => (+v).toFixed(d === undefined ? 2 : d);
  return { pitch, Am, As, Lb, Vc, Asub, kg, rows: [
    { k: 'mortar', it: `自由梁噴 1:3 水泥砂漿（寬 ${p.B3_cm}、高 ${p.H_beam_cm} cm 圓弧頂）`, u: 'm³', v: Vc / Am, fx: `單格梁長 2×${f(pitch)}−${f(B3)}＝${f(Lb)} m × 圖面梁斷面 ${f(As, 4)} m² ＝ ${f(Vc, 3)} m³/格 ÷ 單格 ${f(Am)} m²`, ok: ['q_mortar_m2', 'formula_mortar'] },
    { k: 'sub', it: `框內噴植生基材（厚 ${p.t_sub_cm} cm）`, u: 'm²', v: Asub / Am, fx: `框內淨面積 B2² ${f(Asub)} ÷ 單格 (B2＋B3)² ${f(Am)}（厚 ${p.t_sub_cm} cm，體積 ${f(Asub / Am * p.t_sub_cm / 100, 3)} m³/m²）`, ok: ['q_sub_area_m2', 'formula_sub'] },
    { k: 'mesh', it: '鍍鋅鐵絲網（一層，網目 50×50 mm）', u: 'm²', v: p.kMesh, fx: `全坡面滿鋪 × 搭接 ${p.kMesh}`, ok: ['q_mesh_m2', 'formula_mesh'] },
    { k: 'nail', it: `土(岩)釘（鑽孔 ∅${p.d_hole_cm} cm 灌 1:2 水泥漿，J 型 #6 L3＝${p.L3_cm} cm）`, u: '處', v: 1 / Am, fx: `每格交點 1 處 ÷ ${f(Am)} m²`, ok: ['q_nail_cnt_m2', 'formula_nail'] },
    { k: 'pins', it: `主錨釘（大ㄇ #5 L2＝${p.L2_cm}）＋輔錨釘（小ㄇ #4 L1＝${p.L1_cm}）`, u: '組', v: 1 / Am, fx: `每格 1 組 ÷ ${f(Am)} m²`, ok: ['q_pin_pair_m2', 'formula_pins'] },
    { k: 'rebar', it: '鋼筋加工及組立（#3 雙向梁筋＋#4＋#5＋#6）', u: 'kg', v: kg / Am, fx: `[#3 2×2×${f(pitch)}×${p.w3}＝${f(wt3)}＋#4 ${f((p.L1_cm + p.hook_cm) / 100)}×${p.w4}＋#5 ${f((p.L2_cm + p.hook_cm) / 100)}×${p.w5}＋#6 ${f((p.L3_cm + p.hookJ_cm) / 100)}×${p.w6}]＝${f(kg)} kg/格 ÷ ${f(Am)} m²`, ok: ['q_rebar_m2', 'formula_rebar'] }] };
}
function frbPoly(c) {   // 施作範圍平面多邊形
  const F = c.frb; if (!F) return null;
  if (F.src === 'zone') return c.zone && c.zone.length > 2 ? c.zone : null;
  const P = c.bl; if (!P || P.length < 2) return null; const L = dzPolyLen(P), a = dzBlSub(P, 0, L, F.w0), b = dzBlSub(P, 0, L, F.w1); return a.length > 1 && b.length > 1 ? a.concat(b.slice().reverse()) : null;
}
function frbCalc(c) {
  const F = c.frb; if (!F || !F.on) return null; const P = frbPoly(c); if (!P) return { P: null, A: 0, A2: 0 };
  const key = JSON.stringify([F.src, F.w0, F.w1, P, (state.triangles || []).length, (state.points || []).length, state.dzDem ? state.dzDem.name + state.dzDem.nx : '', state.dzDemOn, state.dzCtrl]);
  if (F._k !== key) { F._k = key; F._a = F.src === 'zone' ? dzCaseCalc(c) : dzSlopeArea(P); }
  const a = F._a || {}; return { P, A: a.As || 0, A2: a.A2 || 0, slope: a.slope || 0, U: frbUnit(F.p) };
}
function frbRows(c) { const r = frbCalc(c); if (!r || !r.U) return []; return r.U.rows.map(q => ({ it: q.it, u: q.u, v: q.v * r.A, per: q.v, fx: `${q.v.toFixed(3)} ${q.u}/m² × 斜面積 ${r.A.toFixed(2)} m²；${q.fx}` })); }
function frbSet(k, v) { const c = dzCase(); if (!c) return; pushUndoSnapshot(); c.frb = frbNorm(c.frb); const F = c.frb;
  if (k === 'on') F.on = !!v; else if (k === 'src') F.src = v; else if (k === 'w0' || k === 'w1') { const x = parseFloat(v); if (Number.isFinite(x)) F[k] = x; } else if (k.startsWith('p.')) { const x = parseFloat(v); if (Number.isFinite(x) && x >= 0) F.p[k.slice(2)] = x; }
  F._k = null; dzPanelUI(); requestRedraw(); }
function frbUI(c) {
  const F = c.frb = frbNorm(c.frb), r = frbCalc(c), inp = (k, v, st, w) => `<input type="number" class="input-num" style="width:${w || 64}px;" step="${st}" value="${v}" onchange="frbSet('${k}',this.value)">`;
  let h = `<div style="margin-top:8px;padding:6px 8px;border:1px solid var(--border-dim);border-radius:4px;"><div style="display:flex;justify-content:space-between;align-items:center;"><b>🟩 自由梁護坡（0201-1）</b><label><input type="checkbox"${F.on ? ' checked' : ''} onchange="frbSet('on',this.checked)"> 施作</label></div>`;
  if (!F.on) return h + '<div style="font-size:10.5px;color:var(--text-muted);">勾選後以整治區或沿基準線帶狀範圍的實際斜面積計算數量。</div></div>';
  h += `<div style="display:grid;grid-template-columns:1fr auto;gap:2px 6px;align-items:center;margin-top:4px;font-size:11px;"><span>範圍</span><select class="input-select" onchange="frbSet('src',this.value)"><option value="zone"${F.src === 'zone' ? ' selected' : ''}>整治區（多邊形）</option><option value="bl"${F.src === 'bl' ? ' selected' : ''}>沿基準線帶狀</option></select>`;
  if (F.src === 'bl') h += `<span>帶狀偏距 起（左正，m）</span>${inp('w0', F.w0, 0.5)}<span>帶狀偏距 迄（左正，m）</span>${inp('w1', F.w1, 0.5)}`;
  h += `</div><details style="margin-top:4px;"><summary style="cursor:pointer;font-size:11px;">標準圖參數（預設＝原圖）</summary><div style="display:grid;grid-template-columns:1fr auto;gap:2px 6px;align-items:center;font-size:11px;">${FRB_PR.map(q => `<span>${q[1]}${q[2] ? ' (' + q[2] + ')' : ''}</span>${inp('p.' + q[0], F.p[q[0]], q[3])}`).join('')}</div></details>`;
  if (!r || !r.P) return h + `<div style="color:#b45309;margin-top:4px;">${F.src === 'zone' ? '請先畫整治區。' : '請先畫基準線。'}</div></div>`;
  h += `<div style="margin-top:4px;font-size:11px;">施作範圍 平面積 ${dzF(r.A2, 2)} m²｜<b style="color:#15803d;">斜面積 ${dzF(r.A, 2)} m²</b>｜平均坡度 ${dzF(r.slope, 1)}°｜單格 ${dzF(r.U.pitch, 2)}×${dzF(r.U.pitch, 2)} m</div>`;
  h += `<div class="pt-table-wrap" style="margin-top:3px;"><table class="pt-table"><thead><tr><th>項目</th><th>單位</th><th>每 m²</th><th>數量</th></tr></thead><tbody>${frbRows(c).map(q => `<tr title="${escAttr(q.fx)}"><td>${escAttr(q.it)}</td><td>${q.u}</td><td style="text-align:right;">${q.per.toFixed(3)}</td><td style="text-align:right;">${dzF(q.v, 2)}</td></tr>`).join('')}</tbody></table></div>`;
  return h + `<button class="btn" style="margin-top:4px;" onclick="frbStdOpen()">📐 標準圖（原圖＋本案數量）</button></div>`;
}
function frbStdPrims(c) {
  const r = frbCalc(c), U = r.U, OV = { A_tot_m2: +r.A.toFixed(2), A_mod_m2: +U.Am.toFixed(2), N_cells_tot: +(r.A / U.Am).toFixed(1), q_mortar_cell: +U.Vc.toFixed(3), q_rebar_cell_kg: +U.kg.toFixed(2) };
  U.rows.forEach(q => { OV[q.ok[0]] = +q.v.toFixed(3); OV[q.ok[1]] = q.fx; }); OV.q_sub_vol_m2 = +(U.Asub / U.Am * c.frb.p.t_sub_cm / 100).toFixed(3);
  const O = TCO_D.frb.run(Object.assign({ A_tot_m2: +r.A.toFixed(2) }, c.frb.p), OV), P = tcoStdPrims(O, 0.01, 0, 0, 'STD_'), bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  P.forEach(o => { if (o.t === 't') { bb.x0 = Math.min(bb.x0, o.x); bb.x1 = Math.max(bb.x1, o.x + o.s.length * o.h); bb.y0 = Math.min(bb.y0, o.y - o.h); bb.y1 = Math.max(bb.y1, o.y + o.h); } else (o.p || []).forEach(v => { bb.x0 = Math.min(bb.x0, v[0]); bb.x1 = Math.max(bb.x1, v[0]); bb.y0 = Math.min(bb.y0, v[1]); bb.y1 = Math.max(bb.y1, v[1]); }); });
  const TH = Math.max(0.05, (bb.x1 - bb.x0) / 120); P.push({ t: 't', x: bb.x0, y: bb.y1 + TH * 2, h: TH * 1.4, s: `${c.name}　自由梁護坡（${c.frb.src === 'zone' ? '整治區' : `沿基準線 偏距 ${c.frb.w0}～${c.frb.w1} m`}　斜面積 ${r.A.toFixed(2)} m²）`, c: '#ffd08a', a: 30, ly: 'STD_TITLE', al: 'l', va: 'b', rot: 0 }); bb.y1 += TH * 4;
  return { P, bb };
}
function frbStdOpen() { const c = dzCase(); if (!c || !frbCalc(c) || !frbCalc(c).P) return; const r = frbStdPrims(c); stStdOpen(undefined, { P: r.P, bb: r.bb, name: c.name, title: `${c.name}　自由梁護坡標準圖` }); }
function frbDrawPlan() {
  if (state.viewMode !== '2D') return; (state.dzCases || []).forEach(c => { const r = frbCalc(c); if (!r || !r.P) return; const S = r.P.map(q => worldToScreen2D(q[0], q[1]));
    ctx.save(); ctx.beginPath(); S.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.6; ctx.setLineDash([8, 4]); ctx.stroke(); ctx.setLineDash([]); ctx.clip();
    const k = Math.abs(worldToScreen2D(1, 0).x - worldToScreen2D(0, 0).x), pit = r.U.pitch, xs = r.P.map(q => q[0]), ys = r.P.map(q => q[1]);
    if (pit * k > 4) { ctx.strokeStyle = 'rgba(34,197,94,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = Math.floor(Math.min(...xs) / pit) * pit; x <= Math.max(...xs); x += pit) { const a = worldToScreen2D(x, Math.min(...ys)), b = worldToScreen2D(x, Math.max(...ys)); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); } for (let y = Math.floor(Math.min(...ys) / pit) * pit; y <= Math.max(...ys); y += pit) { const a = worldToScreen2D(Math.min(...xs), y), b = worldToScreen2D(Math.max(...xs), y); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); } ctx.stroke(); }
    ctx.restore(); const cx = S.reduce((a, q) => a + q.x, 0) / S.length, cy = S.reduce((a, q) => a + q.y, 0) / S.length; ctx.save(); ctx.font = 'bold 12px "Noto Sans TC"'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(7,10,15,0.9)'; const t = `自由梁護坡 斜面積 ${r.A.toFixed(1)} m²`; ctx.strokeText(t, cx, cy + 22); ctx.fillStyle = "#4ade80"; ctx.fillText(t, cx, cy + 22); ctx.restore(); });
}
(function () {
  const _pu = dzPanelUI; dzPanelUI = function () { _pu.apply(this, arguments); try { const c = dzCase(), box = document.getElementById('dzPanel'); if (!c || !box) return; const d = document.createElement('div'); d.innerHTML = frbUI(c); const card = box.querySelector('.sec-card'); (card || box).appendChild(d); } catch (e) { console.error('frbUI', e); } };
  const _ha = drawHorizontalAlignmentOnCanvas; drawHorizontalAlignmentOnCanvas = function () { _ha.apply(this, arguments); try { frbDrawPlan(); } catch (e) { console.error('frbPlan', e); } };
  const _xp = rvDxfPlan; rvDxfPlan = function (D) { _xp(D); try { (state.dzCases || []).forEach(c => { const r = frbCalc(c); if (!r || !r.P) return; D.poly(r.P, 'DZ_FRB', 3, 0, true, 'DASHED'); const cx = r.P.reduce((a, q) => a + q[0], 0) / r.P.length, cy = r.P.reduce((a, q) => a + q[1], 0) / r.P.length; D.text(cx, cy, 0.8, `自由梁護坡 斜面積 ${r.A.toFixed(1)} m2`, 'DZ_FRB', 3, { align: 'c' }); }); } catch (e) { console.error('frbDxf', e); } };
  const _sd = rvDxfStdAll; rvDxfStdAll = function (D, xRight, yTop) { let y = _sd(D, xRight, yTop); try { (state.dzCases || []).forEach(c => { const r = frbCalc(c); if (!r || !r.P) return; const s = frbStdPrims(c), q = s.bb; stStdEmit(D, s.P, xRight - q.x1, y - q.y1); y -= (q.y1 - q.y0) + 20; }); } catch (e) { console.error('frbStd', e); } return y; };
  const _cn = dzCaseNorm; dzCaseNorm = function (c) { const o = _cn(c); if (c && c.frb) o.frb = frbNorm(c.frb); return o; };
  const _cc = dzCaseClean; dzCaseClean = function (c) { const o = _cc(c); if (c.frb) { const F = frbNorm(c.frb); o.frb = { on: F.on, src: F.src, w0: F.w0, w1: F.w1, p: F.p }; } return o; };
  const _cs = dzCaseSheet; dzCaseSheet = function () { const S = _cs.apply(this, arguments); try { const C = (state.dzCases || []).filter(c => c.frb && c.frb.on && frbCalc(c) && frbCalc(c).P); if (S && C.length) { C.forEach(c => { frbRows(c).forEach(q => S.rows.push([{ v: c.name, s: 2 }, { v: `自由梁護坡：${q.it}`, s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: +q.v.toFixed(3), s: 3 }, { v: q.u, s: 2 }, { v: q.fx, s: 10 }])); }); } } catch (e) { console.error('frbSheet', e); } return S; };
})();
