/* v6.4 參數亮點（通用）：游標移到／點入參數輸入欄 → 圖面上「隨該參數改變長度的邊」以洋紅亮線＋黃色亮點標示
   作法：把該參數加一個增量重算幾何，邊長有變者即為該參數控制的尺寸（平移不算）。適用所有護岸型式（斷面圖、導引新增預覽） */
var TC_HL = { focus: null, hover: null };
function tcHLTag() { return TC_HL.focus || TC_HL.hover; }
function tcHLSet(k, focus) { TC_HL[focus ? 'focus' : 'hover'] = k; requestRedraw(); }
function tcHLClr(k, focus) { const f = focus ? 'focus' : 'hover'; if (TC_HL[f] === k) TC_HL[f] = null; requestRedraw(); }
const TC_HL_CACHE = {};
function tcHLDiff(T, R, zc, k) {   // → { segs:[[[a,z],[a,z]]], pts:[[a,z]] }
  const q = T.params.find(x => x.k === k); if (!q || q.u === 'sel' || q.u === 'chk') return null;
  const v = +R[k]; if (!Number.isFinite(v)) return null; const key = T.id + '|' + k + '|' + JSON.stringify(R, (kk, vv) => (kk === 'rv' || kk === 'T' ? undefined : vv)).length + '|' + v;
  if (TC_HL_CACHE[key]) return TC_HL_CACHE[key];
  const d = Math.max(Math.abs(v) * 0.15, (q.st || 0.1)), out = { segs: [], pts: [] };
  const G0 = T.geo(R, zc);
  if (T.orig && G0.A) {   // 原圖移植型式：以原圖斷面細部圖元比對（涵蓋基礎、止滑榫、排水管等）
    let O0 = null; try { O0 = tcoSecPrims(T, R).O; } catch (e) { }
    if (O0) [d, -d].forEach(dd => { if (out.segs.length) return; let O1; try { O1 = tcoSecPrims(T, Object.assign({}, R, { [k]: v + dd })).O; } catch (e) { return; }
      if (O1.length !== O0.length) return;
      O0.forEach((o, j) => { const o1 = O1[j]; if (!o.p || !o1.p || !Array.isArray(o.p) || o.p.length !== o1.p.length || !Array.isArray(o.p[0])) return;
        const A = o.p, B = o1.p; for (let i = 0; i < A.length - 1; i++) { const l0 = Math.hypot(A[i + 1][0] - A[i][0], A[i + 1][1] - A[i][1]), l1 = Math.hypot(B[i + 1][0] - B[i][0], B[i + 1][1] - B[i][1]); if (Math.abs(l1 - l0) > 1e-3) out.segs.push([A[i], A[i + 1]]); } });
      out.raw = true; });
    if (out.segs.length) { const seen = {}; out.segs.forEach(s => s.forEach(p => { const id = p[0].toFixed(2) + ',' + p[1].toFixed(2); if (!seen[id]) { seen[id] = 1; out.pts.push(p); } })); TC_HL_CACHE[key] = out; return out; }
    out.raw = false;
  }
  [d, -d].forEach(dd => { if (out.segs.length) return; let G1; try { G1 = T.geo(Object.assign({}, R, { [k]: v + dd }), zc); } catch (e) { return; }
    const add = (A, B) => { for (let i = 0; i < A.length - 1 && i < B.length - 1; i++) { const l0 = Math.hypot(A[i + 1][0] - A[i][0], A[i + 1][1] - A[i][1]), l1 = Math.hypot(B[i + 1][0] - B[i][0], B[i + 1][1] - B[i][1]); if (Math.abs(l1 - l0) > 1e-4) out.segs.push([A[i], A[i + 1]]); } };
    if (G0.polys.length === G1.polys.length) G0.polys.forEach((pg, j) => { const A = pg.pts.slice(), B = G1.polys[j].pts.slice(); if (A.length === B.length) { A.push(A[0]); B.push(B[0]); add(A, B); } });
    if (G0.face && G1.face && G0.face.length === G1.face.length) add(G0.face, G1.face); });
  const seen = {}; out.segs.forEach(s => s.forEach(p => { const id = p[0].toFixed(4) + ',' + p[1].toFixed(4); if (!seen[id]) { seen[id] = 1; out.pts.push(p); } }));
  TC_HL_CACHE[key] = out; return out;
}
function tcHLPaint(ctx, T, R, zc, k, X, Y, lab) {   // X(a)、Y(z)：幾何座標→畫面
  const D = tcHLDiff(T, R, zc, k); if (!D || !D.segs.length) return false;
  if (D.raw) { const G = T.geo(R, zc), X0 = X, Y0 = Y; X = x => X0(G.A(x)); Y = y => Y0(G.Z(y)); }
  return tcHLDraw(ctx, D, X, Y, lab);
}
function tcHLDraw(ctx, D, X, Y, lab) {
  ctx.save(); ctx.setLineDash([]); ctx.lineJoin = 'round'; ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 3.4; ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 6;
  ctx.beginPath(); D.segs.forEach(s => { ctx.moveTo(X(s[0][0]), Y(s[0][1])); ctx.lineTo(X(s[1][0]), Y(s[1][1])); }); ctx.stroke(); ctx.shadowBlur = 0;
  D.pts.forEach(p => { ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 4.5, 0, 7); ctx.fillStyle = '#ffe600'; ctx.fill(); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 1.4; ctx.stroke(); });
  if (lab) { const s = D.segs[0], mx = (X(s[0][0]) + X(s[1][0])) / 2, my = (Y(s[0][1]) + Y(s[1][1])) / 2; ctx.font = 'bold 12px "Noto Sans TC"'; const w = ctx.measureText(lab).width; ctx.fillStyle = 'rgba(11,16,24,.88)'; ctx.fillRect(mx + 8, my - 22, w + 10, 18); ctx.fillStyle = '#ff4fd8'; ctx.textAlign = 'left'; ctx.fillText(lab, mx + 13, my - 9); }
  return tcHLDraw(ctx, D, X, Y, lab);
}
function tcHLLabel(T, p, k) { const q = T.params.find(x => x.k === k); return q ? `${String(q.nm).replace(/[（(].*$/, '')} = ${rvF(p[k], 2)}${q.u && q.u !== 'm' ? ' ' + q.u : (q.u === 'm' ? ' m' : '')}` : ''; }
function tcHLDrawWiz(c, T, R, G, focus, X, Y) { if (!focus) return; tcHLPaint(c, T, R, 0, focus, X, Y, tcHLLabel(T, R, focus)); }
/* 輸入欄掛上亮點事件 */
{ const _pi = rvParamIn; rvParamIn = function (q, p) { let h = _pi.apply(this, arguments); const k = q.k;
    return h.replace(/(<(?:input|select)[^>]*data-rv="p\.[^"]+")/, `$1 onfocus="tcHLSet('${k}',1)" onblur="tcHLClr('${k}',1)" onmouseenter="tcHLSet('${k}')" onmouseleave="tcHLClr('${k}')"`); }; }
/* 斷面圖：選取中的護岸疊畫亮線 */
{ const _dc = rvDrawCross; rvDrawCross = function (sec, sx, sy, isLarge) { _dc.apply(this, arguments);
    const k = tcHLTag(); if (!k || !sec || !sec.bkInfo) return; const rv = state.revs[state.rvSel]; if (!rv) return;
    ['L', 'R'].forEach(sd => { const g = rvGeomSec(sec, sd); if (!g || g.R.rv !== rv) return; const sg = g.sg;
      try { tcHLPaint(ctx, g.R.T, g.R, g.zc || 0, k, a => sx(sg * a), z => sy(z), sd === 'L' && isLarge ? tcHLLabel(g.R.T, g.R, k) : (isLarge ? tcHLLabel(g.R.T, g.R, k) : '')); } catch (e) { } }); }; }

/* ---- 排水溝：輸入欄（onchange="dnSet('p.xxx',…)"）以事件委派掛亮點；斷面圖對該溝比對邊長 ---- */
var TC_DNHL = { focus: null, hover: null };
(function () {
  const info = el => { if (!el || !/^(INPUT|SELECT)$/.test(el.tagName)) return null; const m = /dnSet\('p\.(\w+)'/.exec(el.getAttribute('onchange') || ''); if (!m) return null; const lb = el.closest('label') || el.parentElement, sp = lb && lb.querySelector('span'); return { k: m[1], nm: (el.getAttribute('data-nm') || (sp ? sp.textContent : m[1])).replace(/\s*\(.*$/, ''), el }; };
  const on = (ev, f, field) => document.addEventListener(ev, e => { const i = info(e.target); if (f === 'set') { if (i) { TC_DNHL[field] = i; requestRedraw(); } } else if (TC_DNHL[field] && i && TC_DNHL[field].k === i.k) { TC_DNHL[field] = null; requestRedraw(); } });
  on('focusin', 'set', 'focus'); on('focusout', 'clr', 'focus'); on('mouseover', 'set', 'hover'); on('mouseout', 'clr', 'hover');
})();
{ const _dd = dnDrawCross; dnDrawCross = function (sec, sx, sy, isLarge) { _dd.apply(this, arguments);
    const H = TC_DNHL.focus || TC_DNHL.hover; if (!H) return; const d = state.dns[state.dnSel]; if (!d) return;
    try { const K0 = dnSecItems(sec).find(K => K.d === d); if (!K0) return; const v = +d.p[H.k]; if (!Number.isFinite(v)) return; const q = (K0.polys, 0), dd = Math.max(Math.abs(v) * 0.15, 0.02), segs = [], pts = [];
      [dd, -dd].forEach(x => { if (segs.length) return; const old = d.p[H.k]; d.p[H.k] = v + x; let K1; try { K1 = dnSecItems(sec).find(K => K.d === d); } finally { d.p[H.k] = old; }
        if (!K1 || K1.polys.length !== K0.polys.length) return; K0.polys.forEach((P, j) => { const B = K1.polys[j]; if (B.length !== P.length) return; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], a1 = B[i], b1 = B[(i + 1) % P.length]; if (Math.abs(Math.hypot(b[0] - a[0], b[1] - a[1]) - Math.hypot(b1[0] - a1[0], b1[1] - a1[1])) > 1e-5) segs.push([a, b]); } }); });
      if (!segs.length) return; const seen = {}; segs.forEach(s => s.forEach(p => { const id = p[0].toFixed(4) + ',' + p[1].toFixed(4); if (!seen[id]) { seen[id] = 1; pts.push(p); } }));
      tcHLDraw(ctx, { segs, pts }, a => sx(a), z => sy(z), isLarge ? `${H.nm} = ${H.el.value}` : ''); } catch (e) { } }; }
