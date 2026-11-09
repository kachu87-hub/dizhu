/* ============================================================================
   v8.0 護坡基礎補強（RC 格框＋格室漿砌塊石；原工具 → ormodF.js TCO_S.tfr，gen_st3.py）
   放置：左岸／右岸＋起訖樁號；格框內緣沿「護岸牆腳」往溪心偏 W_gap_slope，無護岸處以「設計河寬邊線」為準
   座數：自動＝floor((區間長＋間距)÷(單座長＋間距))（整數，置中排列），或手動指定座數
   數量：每座依 TCO_S.tfr 幾何計算 × 座數；平面畫出每座格框（含角隅斜角），橫斷面經過補強座時畫格樑斷面
   資料：state.tfrs（全專案一份，每筆記 cl＝所屬中心線 id，只在該中心線作用）
   ============================================================================ */
state.tfrs = []; let TFR_SEL = null, TFR_OPEN = false, TFR_SIG = '';
const tfrCl = () => ((state.cls && state.cls[state.clCur | 0]) || {}).id || 'C0';
function tfrNorm(t) {
  t = t || {}; const s0 = Number.isFinite(+t.s0) ? +t.s0 : 0, s1 = Number.isFinite(+t.s1) ? +t.s1 : s0 + 20;
  return { id: t.id || ('tfr' + Math.random().toString(36).slice(2, 7)), name: t.name || '護坡基礎補強', cl: t.cl || tfrCl(), side: t.side === 'R' ? 'R' : 'L', s0, s1, mode: t.mode === 'n' ? 'n' : 'auto', n: Math.max(1, Math.round(+t.n || 1)), ec: Number.isFinite(+t.ec) && t.ec !== null && t.ec !== '' ? +t.ec : 0.3, sp: Object.assign({}, t.sp || {}) };
}
const tfrClean = t => ({ id: t.id, name: t.name, cl: t.cl, side: t.side, s0: t.s0, s1: t.s1, mode: t.mode, n: t.n, ec: t.ec, sp: Object.assign({}, t.sp) });
const tfrList = () => (state.tfrs || []).filter(t => t.cl === tfrCl());
const tfrSideNm = sd => (sd === 'L' ? '左岸' : '右岸');
function tfrRun(t) { const k = JSON.stringify(t.sp); if (t._k !== k || !t._r) { t._r = TCO_S.tfr.run(t.sp); t._k = k; } return t._r; }
function tfrUnits(t) {   // 座位置（樁號，m）
  const R = tfrRun(t), P = R.P, Lu = P.L_total / 100, Su = P.S_unit / 100, a = Math.min(t.s0, t.s1), b = Math.max(t.s0, t.s1), Ls = b - a;
  const n = t.mode === 'n' ? Math.max(1, Math.round(t.n)) : Math.max(1, Math.floor((Ls + Su) / (Lu + Su) + 1e-9)), occ = n * Lu + (n - 1) * Su, s0 = a + (Ls - occ) / 2;
  const units = Array.from({ length: n }, (_, i) => ({ a: s0 + i * (Lu + Su), b: s0 + i * (Lu + Su) + Lu }));
  return { R, P, n, units, Lu, Su, W: P.W_total / 100, gap: P.W_gap_slope / 100, a, b, occ, over: occ > Ls + 1e-6 };
}
function tfrBase(side, s) {   // 內緣基準：護岸牆腳（距中心線 m）；無護岸＝設計河寬邊線
  let rv = null; try { rv = typeof rvActive === 'function' ? rvActive(side, s) : null; } catch (e) { rv = null; }
  if (rv) { try { const R = rvAt(rv, s, rvEDefAt(s)); if (R && Number.isFinite(R.e)) return { e: R.e, src: 'rv', rv }; } catch (e) { } }
  return { e: rvEDefAt(s), src: 'des', rv: null };
}
function tfrPt(side, s, o) { const q = getPointAndNormalAtStation(s); if (!q) return null; const sg = rvSgS(side); return [q.x - q.nx * sg * o, q.y - q.ny * sg * o]; }
/* ---- 平面：每座外框＋格室（扣角隅）；局部座標 u＝沿樁號（m，自座起點）、v＝自內緣往溪心（m） ---- */
function tfrPlanPolys(t) {
  const U = tfrUnits(t), P = U.P, T = P.T_wall / 100, Wc = P.W_cell / 100, Lc = P.L_cell / 100, c = Math.min(P.L_chamfer / 100, Wc / 2 - 1e-3, Lc / 2 - 1e-3), out = [];
  U.units.forEach(un => {
    const M = (u, v) => { const s = un.a + u, B = tfrBase(t.side, s); return tfrPt(t.side, s, B.e - U.gap - v); }, seg = (u0, u1, v) => { const k = Math.max(1, Math.ceil((u1 - u0) / 1)); return Array.from({ length: k + 1 }, (_, i) => M(u0 + (u1 - u0) * i / k, v)); };
    const box = seg(0, U.Lu, 0).concat(seg(0, U.Lu, U.W).reverse()).filter(Boolean), cells = [];
    for (let i = 0; i < P.N_col; i++) for (let j = 0; j < P.N_row; j++) {
      const v0 = T + i * (Wc + T), v1 = v0 + Wc, u0 = T + j * (Lc + T), u1 = u0 + Lc;
      cells.push([[u0 + c, v0], [u1 - c, v0], [u1, v0 + c], [u1, v1 - c], [u1 - c, v1], [u0 + c, v1], [u0, v1 - c], [u0, v0 + c]].map(([u, v]) => M(u, v)).filter(Boolean));
    }
    out.push({ un, box, cells });
  });
  const sm = (U.units[0].a + U.units[U.n - 1].b) / 2, Bm = tfrBase(t.side, sm);
  return { U, items: out, mid: tfrPt(t.side, sm, Bm.e - U.gap - U.W - 1.2), src: Bm.src };
}
function tfrDrawPlan() {
  if (state.viewMode !== '2D') return;
  tfrList().forEach(t => { let Q; try { Q = tfrPlanPolys(t); } catch (e) { return; } const S = p => worldToScreen2D(p[0], p[1]), sel = TFR_SEL === t.id; ctx.save();
    const path = (pts, cl) => { ctx.beginPath(); pts.forEach((p, i) => { const s = S(p); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); }); if (cl) ctx.closePath(); };
    Q.items.forEach(it => { if (it.box.length < 4) return; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = sel ? 2.2 : 1.4; ctx.fillStyle = 'rgba(56,189,248,0.18)'; path(it.box, true); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(180,140,90,0.45)'; ctx.lineWidth = sel ? 1.4 : 1; it.cells.forEach(cl => { if (cl.length < 3) return; path(cl, true); ctx.fill(); ctx.stroke(); }); });
    if (Q.mid) { const m = S(Q.mid); ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 12px "Noto Sans TC",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${t.name}（${tfrSideNm(t.side)} ${Q.U.n} 座 ${formatStation(Q.U.a)}～${formatStation(Q.U.b)}）`, m.x, m.y); }
    ctx.restore(); });
}
function tfrDxfPlan(D) {
  tfrList().forEach(t => { let Q; try { Q = tfrPlanPolys(t); } catch (e) { return; }
    Q.items.forEach(it => { if (it.box.length >= 4) D.poly(it.box, 'TFR_FRAME', 4, 0, true); it.cells.forEach(cl => { if (cl.length >= 3) D.poly(cl, 'TFR_FRAME', 4, 0, true); }); });
    if (Q.mid) D.text(Q.mid[0], Q.mid[1], 0.5, `${t.name} ${tfrSideNm(t.side)} ${Q.U.n}座 ${formatStation(Q.U.a)}～${formatStation(Q.U.b)}`, 'TFR_TEXT', 4, { align: 'c' }); });
}
/* ---- 橫斷面：經過補強座的樁號畫格樑斷面（橫樑段＝實心；格室段＝直樑＋格室漿砌石） ---- */
function tfrSecItems(sec) {
  const out = []; tfrList().forEach(t => { let U; try { U = tfrUnits(t); } catch (e) { return; } const un = U.units.find(q => sec.sta >= q.a - 1e-6 && sec.sta <= q.b + 1e-6); if (!un) return;
    const P = U.P, T = P.T_wall / 100, Wc = P.W_cell / 100, Lc = P.L_cell / 100, H = P.H_beam / 100, u = sec.sta - un.a, B = tfrBase(t.side, sec.sta), oIn = B.e - U.gap, oOut = oIn - U.W, zt = sec.desCenterZ, zb = zt - H;
    let solid = false; for (let j = 0; j <= P.N_row; j++) { const x0 = j * (Lc + T); if (u >= x0 - 1e-6 && u <= x0 + T + 1e-6) solid = true; }
    const walls = [], cells = []; if (solid) walls.push([oOut, oIn]); else for (let i = 0; i <= P.N_col; i++) { const w1 = oIn - i * (Wc + T); walls.push([w1 - T, w1]); if (i < P.N_col) cells.push([w1 - T - Wc, w1 - T]); }
    out.push({ t, sg: rvSgS(t.side), oIn, oOut, zt, zb, walls, cells, solid, src: B.src, gap: U.gap }); });
  return out;
}
function tfrDrawCross(sec, sx, sy, isLarge) {
  tfrSecItems(sec).forEach(K => { const X = a => sx(K.sg * a), rect = (a0, a1) => { ctx.beginPath(); ctx.moveTo(X(a0), sy(K.zb)); ctx.lineTo(X(a1), sy(K.zb)); ctx.lineTo(X(a1), sy(K.zt)); ctx.lineTo(X(a0), sy(K.zt)); ctx.closePath(); };
    ctx.save(); ctx.lineWidth = isLarge ? 1.4 : 1; ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(180,140,90,0.45)'; K.cells.forEach(([a0, a1]) => { rect(a0, a1); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = 'rgba(148,163,184,0.55)'; K.walls.forEach(([a0, a1]) => { rect(a0, a1); ctx.fill(); ctx.stroke(); });
    try { const xl = tfrExLine(sec, K); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = isLarge ? 1.1 : 0.8; ctx.setLineDash([7, 4]); ctx.beginPath(); xl.forEach(([a, z], i) => (i ? ctx.lineTo(X(a), sy(z)) : ctx.moveTo(X(a), sy(z)))); ctx.stroke(); ctx.setLineDash([]); } catch (e) { }
    if (isLarge) { ctx.fillStyle = '#38bdf8'; ctx.font = '11px "Noto Sans TC",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${K.t.name}（格樑深 ${rvF(K.zt - K.zb)}${K.solid ? '，橫樑' : ''}）`, (X(K.oIn) + X(K.oOut)) / 2, sy(K.zb) + 14); }
    ctx.restore(); });
}
function tfrDxfCross(D, sec, sx, sy, TH) {
  tfrSecItems(sec).forEach(K => { const X = a => sx(K.sg * a), R = (a0, a1) => [[X(a0), sy(K.zb)], [X(a1), sy(K.zb)], [X(a1), sy(K.zt)], [X(a0), sy(K.zt)]];
    K.cells.forEach(([a0, a1]) => D.poly(R(a0, a1), 'TFR_STONE', 42, 0, true)); K.walls.forEach(([a0, a1]) => D.poly(R(a0, a1), 'TFR_FRAME', 4, 0, true));
    try { D.poly(tfrExLine(sec, K).map(([a, z]) => [X(a), sy(z)]), 'TFR_EXC', 6, 0, false, 'DASHED'); } catch (e) { }
    D.text((X(K.oIn) + X(K.oOut)) / 2, sy(K.zb) - TH * 0.4, TH * 0.7, `${K.t.name}（格樑深 ${rvF(K.zt - K.zb)}）`, 'TFR_TEXT', 4, { align: 'c', valign: 't' }); });
}

/* ---- v8.1 開挖、回填（每座以三維網格積分；地面＝實測三角網／DEM，設計面＝該樁號設計河床高）
   同護岸規則：只算設計河床以下（以上屬全線河道土方）；開挖線＝格框底面（設計河床−格樑深）往外 1:ec；內側（護岸側）最多到護岸牆腳
   回填：格框外的開挖空間回填至設計河床（地面較低處至地面）；格框本體（混凝土＋格室塊石）不回填 ---- */
function tfrEc(t) { const v = parseFloat(t.ec); if (Number.isFinite(v) && v >= 0) return v; return 0.3; }
function tfrExUnit(t, U, un, G) {
  const H = U.P.H_beam / 100, ec = Math.max(tfrEc(t), 1e-3), dd = 0.2, rows = [];
  const row = u => { const s = un.a + u, B = tfrBase(t.side, s), q = getPointAndNormalAtStation(s); let zd = null; try { zd = getDesignZ(s); } catch (e) { } return q && Number.isFinite(zd) ? { s, e: B.e, q, zd, sg: rvSgS(t.side) } : null; };
  const zAt = (R, v) => { const o = R.e - U.gap - v, x = R.q.x - R.q.nx * R.sg * o, y = R.q.y - R.q.ny * R.sg * o, r = typeof dzZAt === 'function' ? dzZAt(x, y) : null; return r && Number.isFinite(r.z) ? r.z : null; };
  let gmax = -Infinity; [0, U.Lu / 2, U.Lu].forEach(u => { const R = row(u); if (R) [0, U.W / 2, U.W].forEach(v => { const z = zAt(R, v); if (z !== null) gmax = Math.max(gmax, z); }); });
  const R0 = row(U.Lu / 2); if (!R0 || !Number.isFinite(gmax)) return { x: 0, k: 0, ok: false };
  const ext = Math.max(0, gmax - (R0.zd - H) + 0.5) * ec, vin = Math.min(ext, U.gap); let x = 0, k = 0, nOk = 0, n = 0;
  for (let u = -ext + dd / 2; u < U.Lu + ext; u += dd) { const R = row(u); if (!R) continue; const zb = R.zd - H;
    for (let v = -vin + dd / 2; v < U.W + ext; v += dd) { n++; const g = zAt(R, v); if (g === null) continue; nOk++;
      const gc = Math.min(g, R.zd), du = Math.max(0, -u, u - U.Lu), dv = Math.max(0, -v, v - U.W), d = Math.hypot(du, dv), zex = zb + d / ec; if (gc <= zex) continue;
      x += (gc - zex) * dd * dd; if (d > 0) k += (gc - zex) * dd * dd; } }
  return { x, k, ok: nOk > 0, cov: n ? nOk / n : 0, ext };
}
function tfrEx(t) {
  const U = tfrUnits(t), key = JSON.stringify([tfrClean(t), (state.points || []).length, state.clCur, (state.revs || []).map(r => [r.s0, r.s1, r.side, r.p && r.p.ec]), (state.profile && state.profile.vips || []).length, typeof dzDemZ === 'function' && state.dzDem ? 1 : 0, U.units.map(u => u.a)]);
  if (t._ek === key && t._ex) return t._ex;
  let x = 0, k = 0, ok = true; const per = U.units.map(un => { const r = tfrExUnit(t, U, un); x += r.x; k += r.k; if (!r.ok) ok = false; return r; });
  t._ek = key; t._ex = { x, k, ok, per, ec: tfrEc(t) }; return t._ex;
}
function tfrExLine(sec, K) {   // 橫斷面開挖線：格框底兩側 1:ec 斜線至地面
  const ec = Math.max(tfrEc(K.t), 1e-3), zb = K.zb, hS = K.sg < 0 ? sec.readL : sec.readR, gz = a => secInterp(sec, K.sg * a, 'groundZ'), zx = a => zb + Math.max(0, (K.oOut - a) / ec, (a - K.oIn) / ec);
  let lo = K.oOut, hi = K.oIn; const lim = K.oIn + Math.max(0, K.gap);
  while (lo > K.oOut - 30 && lo > -hS && Number.isFinite(gz(lo)) && gz(lo) > zx(lo)) lo -= 0.05; while (hi < lim && Number.isFinite(gz(hi)) && gz(hi) > zx(hi)) hi += 0.05;
  return [[lo, zx(lo)], [K.oOut, zb], [K.oIn, zb], [hi, zx(hi)]];
}
/* ---- 標準圖（原工具平面＋A-A～D-D 剖面＋開口詳圖＋數量表） ---- */
function tfrStdPrims(t) {
  const U = tfrUnits(t), R = TCO_S.tfr.run(t.sp, { draw: true }), P = tcoStdPrims(R.O, 0.01, 0, 0, 'STD_'), bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  P.forEach(o => { if (o.t === 't') { bb.x0 = Math.min(bb.x0, o.x); bb.x1 = Math.max(bb.x1, o.x + o.s.length * o.h); bb.y0 = Math.min(bb.y0, o.y - o.h); bb.y1 = Math.max(bb.y1, o.y + o.h); } else o.p.forEach(v => { bb.x0 = Math.min(bb.x0, v[0]); bb.x1 = Math.max(bb.x1, v[0]); bb.y0 = Math.min(bb.y0, v[1]); bb.y1 = Math.max(bb.y1, v[1]); }); });
  const TH = Math.max(0.12, (bb.x1 - bb.x0) / 160); P.push({ t: 't', x: bb.x0, y: bb.y1 + TH * 2.2, h: TH * 1.4, s: `${t.name}　護坡基礎補強（${tfrSideNm(t.side)} ${formatStation(U.a)}～${formatStation(U.b)}，${U.n} 座；圖上數量為每座）`, c: '#ffd08a', a: 30, ly: 'STD_TITLE', al: 'l', va: 'b', rot: 0 });
  bb.y1 += TH * 4; return { P, bb };
}
function tfrStdOpen() { const t = tfrFind(TFR_SEL) || tfrList()[0]; if (!t) return; const r = tfrStdPrims(t); stStdOpen(undefined, { P: r.P, bb: r.bb, name: t.name, title: `${t.name}　護坡基礎補強標準圖` }); }
/* ---- 數量 ---- */
function tfrRows(t) { const U = tfrUnits(t), o = U.R.rows.map(r => ({ it: r.name, u: r.unit, v: +(r.qty * U.n).toFixed(2), per: r.qty, f: r.formula }));
  let E = null; try { E = tfrEx(t); } catch (e) { console.error('tfrEx', e); }
  if (E && E.ok) { const fx = E.per.map((r, i) => `第${i + 1}座 ${rvF(r.x, 2)}`).join('、'), fk = E.per.map((r, i) => `第${i + 1}座 ${rvF(r.k, 2)}`).join('、');
    o.push({ it: '基礎開挖', u: 'm³', v: +E.x.toFixed(2), f: `設計河床以下、格框底（設計河床−格樑深）外 1:${E.ec} 斜開（地面取實測三角網／DEM；設計河床以上屬全線河道土方），三維網格 0.2 m 積分｜${fx}` });
    o.push({ it: '基礎回填', u: 'm³', v: +E.k.toFixed(2), f: `格框外的開挖空間回填至設計河床（地面較低處至地面），格框本體不回填｜${fk}` }); }
  return o; }
function tfrAllCl() {   // 全部中心線的補強（含中心線名稱）
  return (state.tfrs || []).map(t => { const i = (state.cls || []).findIndex(c => c.id === t.cl); return { t, cl: i >= 0 ? i : 0 }; }).filter(x => (state.cls || []).length <= 1 || (state.cls[x.cl] || {}).id === x.t.cl);
}
function tfrSheet() {
  const L = tfrAllCl(); if (!L.length) return null; const multi = (state.cls || []).length > 1;
  const rows = [[{ v: '護坡基礎補強數量（每座依原圖格框幾何計算 × 座數；座數＝floor((區間長＋間距)÷(單座長＋間距)) 或手動指定；開挖回填依地形逐座計算）', s: 7 }], ['名稱', '岸別', '樁號範圍', '座數', '工項', '數量', '單位', '計算式（每座）']];
  L.forEach(({ t, cl }) => { const U = tfrUnits(t), nm = t.name + (multi ? `（${clName(cl)}）` : ''), rg = `${formatStation(U.a)}～${formatStation(U.b)}`;
    tfrRows(t).forEach(r => rows.push([nm, tfrSideNm(t.side), rg, U.n, r.it, r.v, r.u, r.per !== undefined ? `每座 ${r.per} ${r.u} × ${U.n} 座｜${r.f}` : `${U.n} 座合計｜${r.f}`])); });
  return { name: '護坡基礎補強', cols: [16, 6, 22, 6, 22, 10, 6, 90], rows, freeze: 2, merges: ['A1:H1'] };
}
/* ---- 面板（護岸面板下方，預設摺疊） ---- */
function tfrFind(id) { return tfrList().find(t => t.id === id); }
function tfrUI() {
  const box = document.getElementById('rvBox'); if (!box) return; let d = document.getElementById('tfrBox');
  const L = tfrList(), sig = JSON.stringify([TFR_SEL, TFR_OPEN, L.map(tfrClean), tfrCl(), (state.revs || []).length]); if (d && sig === TFR_SIG) return; TFR_SIG = sig;
  if (!d) { d = document.createElement('div'); d.id = 'tfrBox'; const bx = document.getElementById('bioBox'); (bx || box).parentNode.insertBefore(d, (bx || box).nextSibling); }
  const sel = L.find(t => t.id === TFR_SEL) || L[0], inp = (k, v, w, st) => `<input type="number" class="input-num" style="width:${w || 64}px;" step="${st || 1}" value="${v}" onchange="tfrSet('${k}',this.value)">`;
  let h = `<details class="rvacc"${TFR_OPEN ? ' open' : ''} ontoggle="TFR_OPEN=this.open"><summary>🧱 護坡基礎補強<span class="sm">${L.length} 處（RC 格框＋格室漿砌塊石；沿護岸牆腳，無護岸＝設計河寬邊線）</span></summary><div class="rvab" style="font-size:11px;">`;
  h += `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px;"><button class="btn" onclick="tfrAdd('L')">＋左岸</button><button class="btn" onclick="tfrAdd('R')">＋右岸</button>${sel ? `<button class="btn" onclick="tfrStdOpen()">📐 標準圖</button><button class="btn" onclick="tfrDel()">刪除</button>` : ''}</div>`;
  if (L.length) h += `<select class="input-select" style="width:100%;margin-bottom:4px;" onchange="TFR_SEL=this.value;TFR_SIG='';tfrUI();requestRedraw();">${L.map(t => `<option value="${t.id}"${sel && sel.id === t.id ? ' selected' : ''}>${escAttr(t.name)}（${tfrSideNm(t.side)} ${formatStation(Math.min(t.s0, t.s1))}～${formatStation(Math.max(t.s0, t.s1))}）</option>`).join('')}</select>`;
  if (sel) { const U = tfrUnits(sel), P = U.P, B = tfrBase(sel.side, (U.a + U.b) / 2), Pd = TCO_S.tfr.getParams({});
    h += `<div style="display:grid;grid-template-columns:1fr auto;gap:2px 6px;align-items:center;">
      <span>名稱</span><input type="text" class="input-num" style="width:110px;" value="${escAttr(sel.name)}" onchange="tfrSet('name',this.value)">
      <span>岸別</span><select class="input-select" onchange="tfrSet('side',this.value)"><option value="L"${sel.side === 'L' ? ' selected' : ''}>左岸</option><option value="R"${sel.side === 'R' ? ' selected' : ''}>右岸</option></select>
      <span>起點樁號 (m) <a style="cursor:pointer;color:#0369a1;" onclick="tfrSetSec('s0')" title="取目前選取的橫斷面樁號">⟵斷面</a></span>${inp('s0', +sel.s0.toFixed(2), 80, 0.1)}
      <span>終點樁號 (m) <a style="cursor:pointer;color:#0369a1;" onclick="tfrSetSec('s1')" title="取目前選取的橫斷面樁號">⟵斷面</a></span>${inp('s1', +sel.s1.toFixed(2), 80, 0.1)}
      <span>座數</span><span style="white-space:nowrap;"><select class="input-select" onchange="tfrSet('mode',this.value)"><option value="auto"${sel.mode === 'auto' ? ' selected' : ''}>依區間自動</option><option value="n"${sel.mode === 'n' ? ' selected' : ''}>手動指定</option></select> ${sel.mode === 'n' ? inp('n', sel.n, 44, 1) : `<b>${U.n}</b>`}</span>
      <span title="開挖線自格框底往外的坡比（水平/垂直）">開挖坡比 1:ec</span>${inp('ec', sel.ec, 64, 0.1)}
      ${TCO_S.tfr.PR.map(q => `<span title="原圖預設 ${q.def}">${q.nm}</span>${inp('p.' + q.k, sel.sp[q.k] !== undefined ? sel.sp[q.k] : Pd[q.k.slice(2)], 64, q.st)}`).join('')}</div>
      <div style="margin-top:4px;line-height:1.6;background:rgba(56,189,248,.06);border:1px solid var(--border-dim);padding:3px 6px;border-radius:4px;">
      每座 ${rvF(U.Lu)} m（順水流）× ${rvF(U.W)} m（垂直水流），${P.N_row}×${P.N_col} 格；${U.n} 座，間距 ${rvF(U.Su)} m${U.over ? '<br><span style="color:#b91c1c;">⚠ 座數排不下區間，已置中超出</span>' : ''}${B.e - U.gap - U.W < 0 ? '<br><span style="color:#b91c1c;">⚠ 格框外緣已越過中心線（溪床寬不足），請減少橫向格數或格寬</span>' : ''}<br>
      內緣基準：${B.src === 'rv' ? '護岸牆腳' : '<span style="color:#b45309;">此段無護岸，以設計河寬邊線為準</span>'}，往溪心偏 ${rvF(U.gap)} m<br>
      ${tfrRows(sel).map(r => `${r.it} ${rvF(r.v, 2)} ${r.u}`).join('、')}（${U.n} 座合計）</div>`; }
  h += '</div></details>'; d.innerHTML = h;
}
function tfrRefresh() { TFR_SIG = ''; try { rebuildAlignmentAndSections(); } catch (e) { requestRedraw(); } tfrUI(); }
function tfrAdd(side) {
  const sec = state.sections[state.selectedStaIdx], s = sec ? sec.sta : state.alignment.startSta, end = state.alignment.endSta || (s + 20); pushUndoSnapshot();
  const t = tfrNorm({ name: `護坡基礎補強${(state.tfrs || []).length + 1}`, side, s0: +s.toFixed(2), s1: +Math.min(end, s + 20).toFixed(2) }); if (t.s1 - t.s0 < 5) t.s0 = +Math.max(state.alignment.startSta || 0, t.s1 - 20).toFixed(2);
  state.tfrs.push(t); TFR_SEL = t.id; TFR_OPEN = true; tfrRefresh(); updateStatus(`🧱 已在${tfrSideNm(side)} ${formatStation(t.s0)}～${formatStation(t.s1)} 加入${t.name}（${tfrUnits(t).n} 座）。`);
}
function tfrDel() { const t = tfrFind(TFR_SEL) || tfrList()[0]; if (!t) return; pushUndoSnapshot(); state.tfrs = state.tfrs.filter(x => x !== t); TFR_SEL = null; tfrRefresh(); }
function tfrSetSec(k) { const sec = state.sections[state.selectedStaIdx]; if (sec) tfrSet(k, sec.sta); }
function tfrSet(k, v) {
  const t = tfrFind(TFR_SEL) || tfrList()[0]; if (!t) return; pushUndoSnapshot();
  if (k === 'name') t.name = String(v || '護坡基礎補強'); else if (k === 'side') t.side = v === 'R' ? 'R' : 'L'; else if (k === 'mode') t.mode = v === 'n' ? 'n' : 'auto';
  else if (k === 'ec') { const x = parseFloat(v); if (Number.isFinite(x) && x >= 0) t.ec = x; }
  else if (k === 's0' || k === 's1' || k === 'n') { const x = parseFloat(v); if (Number.isFinite(x)) t[k] = k === 'n' ? Math.max(1, Math.round(x)) : x; if (k === 'mode' || k === 'n') t.n = Math.max(1, Math.round(t.n)); }
  else if (k.startsWith('p.')) { const x = parseFloat(v), q = TCO_S.tfr.PR.find(z => z.k === k.slice(2)); if (Number.isFinite(x)) { t.sp = Object.assign({}, t.sp, { [k.slice(2)]: q && q.g === 0 && /N_/.test(q.k) ? Math.max(1, Math.round(x)) : x }); } }
  if (k === 'mode' && t.mode === 'n') t.n = tfrUnits(Object.assign({}, t, { mode: 'auto' })).n;
  tfrRefresh();
}
/* ---- 掛勾：平面、DXF、橫斷面、標準圖、數量書、總表、型錄、存檔／復原 ---- */
(function () {
  const _dp = rvDrawPlan; rvDrawPlan = function () { _dp(); try { tfrDrawPlan(); } catch (e) { console.error('tfrDrawPlan', e); } };
  const _xp = rvDxfPlan; rvDxfPlan = function (D) { _xp(D); try { tfrDxfPlan(D); } catch (e) { console.error('tfrDxfPlan', e); } };
  const _dc = rvDrawCross; rvDrawCross = function (sec, sx, sy, isLarge) { _dc(sec, sx, sy, isLarge); try { tfrDrawCross(sec, sx, sy, isLarge); } catch (e) { console.error('tfrDrawCross', e); } };
  const _xc = rvDxfCross; rvDxfCross = function (D, sec, sx, sy, TH) { _xc(D, sec, sx, sy, TH); try { tfrDxfCross(D, sec, sx, sy, TH); } catch (e) { console.error('tfrDxfCross', e); } };
  const _ui = rvRenderUI; rvRenderUI = function () { _ui(); try { tfrUI(); } catch (e) { console.error('tfrUI', e); } };
  const _ks = rvKeyStations; rvKeyStations = function () { const o = _ks(); try { tfrList().forEach(t => { const U = tfrUnits(t), u = U.units[0]; o.push({ s: +((u.a + u.b) / 2).toFixed(3), ptName: `${t.name}`, priority: 2, isCurveTick: false }); }); } catch (e) { } return o; };
  const _sd = rvDxfStdAll; rvDxfStdAll = function (D, xRight, yTop) { let y = _sd(D, xRight, yTop); try { tfrList().forEach(t => { const r = tfrStdPrims(t), q = r.bb; stStdEmit(D, r.P, xRight - q.x1, y - q.y1); y -= (q.y1 - q.y0) + 20; }); } catch (e) { console.error('tfrStd', e); } return y; };
  const _bk = stQtyBook; stQtyBook = function () { const B = _bk(); let s = null; try { s = tfrSheet(); } catch (e) { console.error('tfrSheet', e); } if (s) { B.sheets.push(s); B.n += 1; } return B; };
  if (typeof ttWorks === 'function') { const _tw = ttWorks; ttWorks = function (curOnly) { const W = _tw(curOnly);
    try { W.forEach(w => { if (typeof SLT === 'undefined') return; if (SLT.comb && w.sub === SLT.comb.label) w.cat = '梳子壩'; if (SLT.gsp && w.sub === SLT.gsp.label) w.cat = '固床工＋基樁'; }); } catch (e) { }
    try { const multi = (state.cls || []).length > 1; (curOnly ? tfrList().map(t => ({ t, cl: state.clCur | 0 })) : tfrAllCl()).forEach(({ t, cl }) => { const U = tfrUnits(t);
      W.push({ cat: '護坡基礎補強', name: t.name + (multi ? `（${clName(cl)}）` : ''), sub: `${tfrSideNm(t.side)} ${U.n} 座`, a: U.a, b: U.b, L: U.b - U.a, rows: tfrRows(t).map(r => ({ it: r.it, u: r.u, v: r.v })) }); }); } catch (e) { console.error('tfr ttWorks', e); }
    return W; }; }
  const _ci = catItems; catItems = function () { const A = _ci(); A.push({ id: 'tfr:1', g: '8', name: '護坡基礎補強（RC 格框＋格室漿砌塊石）', sub: '沿護岸牆腳（無護岸＝設計河寬邊線）；原圖移植（數量依幾何）', code: '護坡基礎補強', mat: ['混凝土', '鋼筋', '漿砌塊石'], kind: 'tfr', alias: '既有護坡 基礎補強 格框 格樑 護腳 護岸基礎保護' }); return A; };
  const _cp = catPick; catPick = function (id) { const it = catItems().find(x => x.id === id); if (!it || it.kind !== 'tfr') return _cp(id); try { catClose(); } catch (e) { }
    const tb = document.querySelector('.panel-tab[data-tab="tab-earth"]'); if (tb) switchSideTab('tab-earth', tb); tfrAdd('L'); try { rvRenderUI(); const bx = document.getElementById('tfrBox'); if (bx) bx.scrollIntoView({ block: 'center' }); } catch (e) { } };
  const _cpj = collectProject; collectProject = function () { const o = _cpj.apply(this, arguments); o.data.tfr = { list: (state.tfrs || []).map(tfrClean) }; return o; };
  const _ap = applyProject; applyProject = function (obj) { const Z = (obj && obj.data && obj.data.tfr) || {}; state.tfrs = Array.isArray(Z.list) ? Z.list.map(tfrNorm) : []; TFR_SEL = null; TFR_SIG = ''; return _ap.apply(this, arguments); };
  const _pu = pushUndoSnapshot; pushUndoSnapshot = function () { _pu(); try { const n = state.undoStack.length - 1, o = JSON.parse(state.undoStack[n]); o.tfr = (state.tfrs || []).map(tfrClean); state.undoStack[n] = JSON.stringify(o); } catch (e) { } };
  const _un = undoLastAction; undoLastAction = function () { let L = null; try { const t = state.undoStack[state.undoStack.length - 1]; L = t ? JSON.parse(t).tfr : null; } catch (e) { } _un(); if (L) { state.tfrs = L.map(tfrNorm); TFR_SIG = ''; try { rebuildAlignmentAndSections(); } catch (e) { requestRedraw(); } tfrUI(); } };
})();
