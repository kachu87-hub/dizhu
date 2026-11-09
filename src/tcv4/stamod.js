/* ============================================================================
   v6.3 樁號刻度與引線（平面圖畫面與 DXF）
   預設「刻度」模式：中心線上只畫短刻度（兩側各 tk m），不畫橫跨河道的線；
   引線只拉一側，自刻度端起，越過河寬邊線或護岸外緣（取較遠者）再 +out m，文字寫在引線尾端；
   文字避開中心線、其他樁號文字、結構物／護岸／排水溝／整地平面外框；變坡點加樁（VIP）預設只標樁號、字小一級
   其他模式：邊線外（刻度與引線皆越過河寬邊線）、短刻度（±len）、全寬（舊樣式）；選取中的樁號一律畫全寬
   ============================================================================ */
function staTickNorm(o) {
  o = o || {}; const n = (v, d, lo, hi) => { const x = +v; return Number.isFinite(x) && x >= lo && x <= hi ? x : d; };
  let mode = ['full', 'short', 'edge', 'tick'].includes(o.mode) ? o.mode : 'tick', tsz = n(o.tsz, 1, 0.5, 6), out = n(o.out, 2, 0, 50);
  if (!o.v2 && o.mode === 'edge' && +o.tsz === 1.5) { mode = 'tick'; tsz = 1; out = 2; }   // 舊預設（邊線外、字高 1.5）→ 新預設
  return { v2: 1, mode, len: n(o.len, 8, 0.1, 200), tk: n(o.tk, 1, 0.1, 20), out, side: o.side === 'L' || o.side === 'R' ? o.side : 'auto', tsz, vip: ['sta', 'hide', 'full'].includes(o.vip) ? o.vip : 'sta' };
}
state.staTick = staTickNorm(state.staTick);
function staTickShort() { return state.staTick && state.staTick.mode !== 'full'; }
function staTxtK() { return state.staTick ? state.staTick.tsz : 1; }
function staHalfRoad() { const el = document.getElementById('corridorWidth'); return (parseFloat(el && el.value) || 14) / 2; }
function staTickHalf() { const T = state.staTick; if (T.mode === 'tick') return T.tk; if (T.mode === 'edge') return Math.max(T.len, staHalfRoad() + T.out); return T.len; }
function staIsVip(sec) { return /VIP/.test(sec.ptName || ''); }
function staText(sec) { return staIsVip(sec) && state.staTick.vip === 'sta' ? formatStation(sec.sta) : sec.staLabel; }
// 斷面線端點：刻度／短刻度／邊線外時截短（選取中的樁號畫全寬）
function staTickEnds(sec, isSel) {
  if (!staTickShort() || isSel) return [sec.lx, sec.ly, sec.rx, sec.ry];
  const L = staTickHalf(), f = (x, y) => { const dx = x - sec.cx, dy = y - sec.cy, d = Math.hypot(dx, dy); if (d <= L || d < 1e-9) return [x, y]; return [sec.cx + dx / d * L, sec.cy + dy / d * L]; };
  const a = f(sec.lx, sec.ly), b = f(sec.rx, sec.ry); return [a[0], a[1], b[0], b[1]];
}
// 某側（sgn=1：斷面 lx 側＝左岸）引線應越過的距離：河寬邊線、該岸護岸外緣取大者
function staOuterDist(sec, sgn) {
  let d = staHalfRoad(); const sd = sgn > 0 ? 'L' : 'R';
  try { const G = typeof rvGeomSec === 'function' ? rvGeomSec(sec, sd) : null; if (G && G.polys) G.polys.forEach(q => q.pts.forEach(([a]) => { d = Math.max(d, Math.abs(a)); })); else if (typeof rvActive === 'function') { const rv = rvActive(sd, sec.sta); if (rv) { const R = rvAt(rv, sec.sta, rvEDefAt(sec.sta)); d = Math.max(d, R.e + (R.n || 0) * (R.H || 0) + (+R.b || 0.5)); } } } catch (e) { }
  return d + state.staTick.out;
}
// 平面障礙（結構物、護岸、排水溝、整地外框），附外接矩形以加速
let STA_OBS = null, STA_OBK = '';
function staObstacles() {
  const k = JSON.stringify([(state.revs || []).map(r => [r.side, r.s0, r.s1, r.e0, r.e1, r.type, (r.cps || []).length]), (state.structs || []).map(s => [s.sta, s.type, s.sty]), (state.dns || []).map(d => [d.s0, d.s1, d.e, d.side, d.mode, (d.pts || []).length]), (state.grades || []).map(g => [g.s0, g.s1, g.side]), state.alignment && state.alignment.totalLength]);
  if (k === STA_OBK && STA_OBS) return STA_OBS; const O = [], add = P => { if (!P || P.length < 2) return; const xs = P.map(q => q.x), ys = P.map(q => q.y); O.push({ P, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }); }, pt = (s, o) => { const g = getPointAndNormalAtStation(s); return g ? { x: g.x + g.nx * o, y: g.y + g.ny * o } : null; };
  try { (state.revs || []).forEach(rv => { if (typeof rvVis === 'function' && !rvVis(rv)) return; const L = rvLim(rv), sg = rvSg(rv); for (let s = L.a; s < L.b - 1e-6; s += 4) { const s2 = Math.min(L.b, s + 4), R1 = rvAt(rv, s, rvEDefAt(s)), R2 = rvAt(rv, s2, rvEDefAt(s2)), o1 = R1.e + (R1.n || 0) * (R1.H || 0) + (+R1.b || 0.5), o2 = R2.e + (R2.n || 0) * (R2.H || 0) + (+R2.b || 0.5); const q = [pt(s, sg * R1.e), pt(s, sg * o1), pt(s2, sg * o2), pt(s2, sg * R2.e)]; if (q.every(Boolean)) add(q); } }); } catch (e) { }
  try { const hw = staHalfRoad() + 6; (state.structs || []).forEach(st => { let L = 6; try { if (st.sty === 'cdam') { const P = sltRun(st).P; L = (P.R * (1 - Math.cos(P.theta / 2)) + P.Wap + 300) / 100; } } catch (e) { } const a = st.sta - 1.5, b = st.sta + L * (st.dir || 1), q = [pt(a, -hw), pt(a, hw), pt(b, hw), pt(b, -hw)]; if (q.every(Boolean)) add(q); }); } catch (e) { }
  try { (state.dns || []).forEach(d => { if (typeof dnOn === 'function' && !dnOn(d)) return; const L = dnPlanLines(d).filter(l => l.k === 'o'); if (L.length < 2) return; const A = L[0].pts, B = L[1].pts; for (let i = 0; i + 1 < A.length; i += 4) { const j = Math.min(A.length - 1, i + 4); add([A[i], A[j], B[j], B[i]].map(p => ({ x: p[0], y: p[1] }))); } }); } catch (e) { }
  try { (state.grades || []).forEach(G => { const Q = grdPlanLines(G); if (Q.foot && Q.foot.length > 2) add(Q.foot.map(p => ({ x: p[0], y: p[1] }))); }); } catch (e) { }
  STA_OBS = O; STA_OBK = k; return O;
}
(function () {
  const _lay = layoutStationLabelsWorld;
  layoutStationLabelsWorld = function (items, th, cwid, textOf) {
    if (!staTickShort()) return _lay(items, th, cwid, textOf);
    const T = state.staTick; items = items.filter(it => !(T.vip === 'hide' && staIsVip(it.sec) && it.prio < 3));
    const placed = [], out = [], CLp = centerlineWorldPts(), pref = T.side === 'R' ? [-1, 1] : [1, -1], OB = staObstacles(), s0 = T.mode === 'tick' ? T.tk : 0;
    const clHit = poly => { for (let i = 0; i < CLp.length - 1; i++) if (polysOverlap(poly, [CLp[i], CLp[i + 1]])) return true; return false; };
    const bb = P => { const xs = P.map(q => q.x), ys = P.map(q => q.y); return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]; };
    const obHit = poly => { const b = bb(poly); return OB.some(o => o.x1 >= b[0] && o.x0 <= b[1] && o.y1 >= b[2] && o.y0 <= b[3] && polysOverlap(poly, o.P)); };
    const mk = (sec, text, tw, sgn, len, dx, dy, k) => {
      const h = th * k, ux = dx * sgn, uy = dy * sgn, flip = ux < -1e-9, ex = flip ? -ux : ux, ey = flip ? -uy : uy, ang = Math.atan2(ey, ex);
      const a0 = len + h * 0.4, a1 = a0 + tw * k, lo = flip ? -a1 : a0, hi = flip ? -a0 : a1;
      const al = (sv, hh) => ({ x: sec.cx + ex * sv + (-ey) * hh, y: sec.cy + ey * sv + ex * hh });
      return { sec, ux, uy, len, s0, ang, flip, text, sgn, k, box: [al(lo, -h * 0.6), al(hi, -h * 0.6), al(hi, h * 0.6), al(lo, h * 0.6)], lead: [{ x: sec.cx + ux * Math.max(s0, h * 0.5), y: sec.cy + uy * Math.max(s0, h * 0.5) }, { x: sec.cx + ux * len, y: sec.cy + uy * len }] };
    };
    items.slice().sort((a, b) => b.prio - a.prio).forEach(it => {
      const sec = it.sec, text = textOf === undefined ? staText(sec) : staText(sec), k = staIsVip(sec) && it.prio < 3 ? 0.85 : 1, tw = text.length * cwid;
      let dx = sec.lx - sec.cx, dy = sec.ly - sec.cy; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const base = sg => T.mode === 'tick' ? Math.max(staOuterDist(sec, sg), th * 1.5) : Math.max(staTickHalf(), th * 1.5);
      const ext = [0, 1.5, 3, 5, 8, 12], combos = []; if (T.side === 'auto') ext.forEach(e => pref.forEach(g => combos.push([e, g]))); else pref.forEach(g => ext.forEach(e => combos.push([e, g])));
      let pick = null;
      for (const [extra, sgn] of combos) { const c = mk(sec, text, tw, sgn, base(sgn) + extra * th, dx, dy, k); if (placed.some(P => polysOverlap(c.box, P)) || placed.some(P => polysOverlap(c.lead, P)) || clHit(c.box) || obHit(c.box)) continue; pick = c; break; }
      if (!pick) pick = mk(sec, text, tw, pref[0], base(pref[0]), dx, dy, k);
      placed.push(pick.box, pick.lead); out.push(pick);
    });
    return out;
  };
  const _cp = collectProject; collectProject = function () { const o = _cp(); o.data.staTick = staTickNorm(state.staTick); return o; };
  const _ap = applyProject; applyProject = function (obj, fname) { state.staTick = staTickNorm(obj && obj.data && obj.data.staTick); STA_OBS = null; _ap(obj, fname); staTickUI(); };
  const _rb = rebuildAlignmentAndSections; rebuildAlignmentAndSections = function () { STA_OBS = null; return _rb.apply(this, arguments); };
})();
function staTickUI() {
  const T = state.staTick, g = id => document.getElementById(id), m = g('staTickMode'); if (!m) return;
  m.value = T.mode; const l = g('staTickLen'), tk = g('staTickTk'), o = g('staTickOut'), sd = g('staTickSide'), k = g('staTickTsz'), v = g('staTickVip');
  if (l) { l.value = T.len; l.disabled = T.mode !== 'short' && T.mode !== 'edge'; } if (tk) { tk.value = T.tk; tk.disabled = T.mode !== 'tick'; } if (o) { o.value = T.out; o.disabled = T.mode === 'full' || T.mode === 'short'; }
  if (sd) sd.value = T.side; if (k) k.value = T.tsz; if (v) v.value = T.vip;
}
function staTickSet(k, v) {
  const T = state.staTick, x = parseFloat(v);
  if (k === 'mode') T.mode = ['full', 'short', 'edge', 'tick'].includes(v) ? v : 'tick';
  else if (k === 'side') T.side = v === 'L' || v === 'R' ? v : 'auto';
  else if (k === 'vip') T.vip = ['sta', 'hide', 'full'].includes(v) ? v : 'sta';
  else if (k === 'out') { if (Number.isFinite(x) && x >= 0) T.out = x; }
  else if (k === 'tk') { if (Number.isFinite(x) && x > 0) T.tk = x; }
  else if (k === 'tsz') { if (Number.isFinite(x) && x >= 0.5 && x <= 6) T.tsz = x; }
  else if (Number.isFinite(x) && x > 0) T.len = x;
  staTickUI(); requestRedraw();
}

/* v6.3i：自行加樁號列的「📍 圖面點擊加樁」 */
function staPickAdd() { if (state.viewMode !== '2D') setViewMode('2D'); setTool('ADD_STA'); updateStatus('📍 在平面圖中心線附近點擊即加樁（投影到中心線）；按「平移」或 Esc 結束。'); }
