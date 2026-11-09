/* ============================================================================
   v6.3 階段 5：生物通道（原工具 #3-#10 9e42c77d；附掛於護岸 rv.bios）
   放置：所屬護岸（左／右岸）上的起點樁號；通道頂＝該樁號護岸頂（順著護岸頂線），長度由護岸高度推得
   方向 dir：+1＝坡道自起點（高）往里程增加方向下降；−1＝反向（上下游對調）
   幾何（原圖正視圖）：端牆 t｜坡道 L_ramp＝坡比 k×淨高｜底部平台 L_land｜端牆 t；淨高 H_net＝護岸高 H − 基礎外露 h_exp；底版厚 H_base
   數量：坡道混凝土＝(2t＋L_ramp)/2×H_net（正視圖坡道多邊形）× 坡道寬 W；軀體模板＝兩端牆內外 4 面 × W × H_net
   v6.3：通道範圍內護岸扣除——平面線、縱斷面岸頂／基礎線、橫斷面護岸斷面、護岸數量皆扣除；
   全線土方的護岸基礎開挖／背填在此段為 0，通道本身的開挖、回填另計（橫斷面切算，列於「生物通道」工作表）
   ============================================================================ */
const BIO_DEF = { H_base: 30, W_ramp: 40, t_wall: 20, k_slope: 2, L_land: 40, h_exp: 20, nf: 4, cb: 82, rt: 24, tAuto: true, rbm: 'D19', rbd: 'D13', sm: 20, sdw: 30, sdb: 28, cov: 7.5 };   // 鋼筋：依半重力式擋土牆標準圖（直向主筋 D19@20、水平副筋 D13 牆@30／基礎@28、保護層 7.5 cm）
const BIO_RB = { D10: 0.560, D13: 0.994, D16: 1.56, D19: 2.25, D22: 3.04, D25: 3.98, D29: 5.08 };
function bioTopW(R) {   // 護岸牆頂寬（cm）：重力式＝頂寬 b；乾砌石＝頂寬 Ltop；其他型式無單一牆頂寬 → null（用手動端牆厚）
  const id = R && R.rv && R.rv.type; if (id === 'grav' && +R.b > 0) return +R.b * 100; if (id === 'dry0402' && +R.Ltop > 0) return +R.Ltop; return null; }
const BIO_PR = [['W_ramp', '生物坡道寬 W', 'cm', 5], ['t_wall', '端牆厚 t', 'cm', 5], ['k_slope', '坡道坡比 1:k（水平/垂直）', '', 0.1], ['L_land', '底部緩衝平台長', 'cm', 5],
  ['h_exp', '底版頂高出河床 h_exp', 'cm', 5], ['H_base', '底版基礎厚 H_base', 'cm', 5], ['nf', '軀體模板面數（兩端牆內外）', '', 1], ['cb', '側視圖渠道示意寬', 'cm', 1], ['rt', '側視圖對側牆頂示意寬', 'cm', 1]];
let BIO_SEL = null;
function bioNorm(b) { b = b || {}; return { id: b.id || ('bio' + Math.random().toString(36).slice(2, 7)), name: b.name || '生物通道', sta: +b.sta || 0, dir: (+b.dir) < 0 ? -1 : 1, p: Object.assign({}, BIO_DEF, b.p || {}) }; }
/* ---- 鋼筋配置（端牆、斜版、底版）：主筋 rbm@sm、副筋 rbd（牆／斜版 @sdw、底版 @sdb），保護層 cov ---- */
function bioRebar(g, b) {
  const p = b.p, c = +p.cov || 7.5, W = p.W_ramp, Hw = g.Hn + p.H_base, Ls = Math.hypot(g.Lr, g.Hn), Lb = g.Lt, uw = k => BIO_RB[k] || 0, n = (L, sp) => Math.max(1, Math.floor(Math.max(0, L) / Math.max(1, sp)) + 1), Wi = Math.max(0, W - 2 * c);
  const R = [
    { part: '端牆', role: '直向主筋（兩座×內外兩面）', bar: p.rbm, sp: p.sm, nb: 4 * n(Wi, p.sm), L: Hw - 2 * c },
    { part: '端牆', role: '水平副筋（兩座×內外兩面）', bar: p.rbd, sp: p.sdw, nb: 4 * n(Hw - 2 * c, p.sdw), L: Wi },
    { part: '斜版', role: '順坡主筋', bar: p.rbm, sp: p.sm, nb: n(Wi, p.sm), L: Ls - 2 * c },
    { part: '斜版', role: '橫向副筋', bar: p.rbd, sp: p.sdw, nb: n(Ls - 2 * c, p.sdw), L: Wi },
    { part: '底版', role: '縱向主筋', bar: p.rbm, sp: p.sm, nb: n(Wi, p.sm), L: Lb - 2 * c },
    { part: '底版', role: '橫向副筋', bar: p.rbd, sp: p.sdb, nb: n(Lb - 2 * c, p.sdb), L: Wi }];
  R.forEach(r => { r.L = Math.max(0, r.L); r.len = r.nb * r.L / 100; r.kg = r.len * uw(r.bar); });
  const kg = k => R.filter(r => r.bar === k).reduce((a, r) => a + r.kg, 0), bars = [...new Set(R.map(r => r.bar))];
  return { R, c, bars, kg, tot: R.reduce((a, r) => a + r.kg, 0) };
}
function bioRebarPrims(g, b, x0, y0) {   // 配筋圖（m）：縱剖面（高端在左）＋斜版橫斷面＋鋼筋表
  const P = [], p = b.p, k = 0.01, RB = bioRebar(g, b), c = RB.c * k, TH = Math.max(0.05, (g.Lt * k) / 40), L = (pts, col, o = {}) => P.push({ t: 'l', p: pts.map(([x, y]) => [x0 + x, y0 + y]), c: col, a: o.a || 7, ly: o.ly || 'STD_REBAR', d: o.d || 0, w: o.w || 1, cl: !!o.cl }),
    T = (x, y, h, str, col, al, va) => P.push({ t: 't', x: x0 + x, y: y0 + y, h, s: str, c: col || '#e2e8f0', a: 7, ly: 'STD_TEXT', al: al || 'l', va: va || 'b', rot: 0 }), dot = (x, y, r, col) => L(Array.from({ length: 9 }, (_, i) => [x + r * Math.cos(i * Math.PI / 4), y + r * Math.sin(i * Math.PI / 4)]), col, { cl: true });
  const tw = g.tw * k, Lr = g.Lr * k, Ll = p.L_land * k, Lt = g.Lt * k, Hb = p.H_base * k, H = g.H * k, he = p.h_exp * k, zb = he - Hb;   // z 相對設計河床
  // 縱剖面外框：高端端牆 → 坡面 → 底部平台 → 末端端牆（兩端端牆皆全高，同原圖正視圖）
  const out = [[0, zb], [Lt, zb], [Lt, H], [Lt - tw, H], [Lt - tw, he], [tw + Lr, he], [tw, H], [0, H]]; L(out, '#ffffff', { cl: true, w: 1.6 });
  // 端牆直向主筋（齊外面、內面各一，保護層內）、斜版順坡主筋、底版縱向主筋
  [[c, tw - c], [Lt - tw + c, Lt - c]].forEach(([a, b2]) => { L([[a, zb + c], [a, H - c]], '#f87171', { w: 1.6 }); L([[b2, zb + c], [b2, H - c]], '#f87171', { w: 1.6 }); });
  const nx = -(H - he), ny = -Lr, nl = Math.hypot(nx, ny) || 1, ox = -nx / nl * c, oy = -ny / nl * c;   // 斜面法向（向內）
  L([[tw + ox * 0 + 0, H - c], [tw + Lr - c * (Lr / Math.hypot(Lr, H - he)), he - c]], '#f87171', { w: 1.6 });
  L([[c, zb + c], [Lt - c, zb + c]], '#f87171', { w: 1.6 });
  // 副筋點（剖面上的橫向筋）
  const r = Math.max(0.012, TH * 0.18);
  for (let z = zb + c; z <= H - c + 1e-9; z += p.sdw * k) { dot(c + r * 1.6, z, r, '#60a5fa'); dot(Lt - c - r * 1.6, z, r, '#60a5fa'); }
  for (let x = c; x <= Lt - c + 1e-9; x += p.sdb * k) dot(x, zb + c + r * 1.6, r, '#60a5fa');
  { const Ls = Math.hypot(Lr, H - he), ux = Lr / Ls, uy = -(H - he) / Ls; for (let t = 0; t <= Ls + 1e-9; t += p.sdw * k) dot(tw + ux * t, H - c - r * 1.6 + uy * t, r, '#60a5fa'); }
  T(0, H + TH * 1.2, TH * 1.3, `${b.name}　配筋圖（縱剖面，高端在左）`, '#ffd08a');
  T(tw * 0.5, zb - TH * 1.4, TH * 0.8, `主筋 ${p.rbm}@${p.sm}（紅）　副筋 ${p.rbd} 牆／斜版@${p.sdw}、底版@${p.sdb}（藍點）　保護層 ${RB.c} cm`, '#e2e8f0');
  // 斜版橫斷面（寬 W）
  const W = p.W_ramp * k, X0 = Lt + TH * 4, t0 = Math.max(Hb, 0.3); L([[X0, 0], [X0 + W, 0], [X0 + W, t0], [X0, t0]], '#ffffff', { cl: true, w: 1.4 });
  L([[X0 + c, t0 - c - r * 2], [X0 + W - c, t0 - c - r * 2]], '#60a5fa', { w: 1.2 }); for (let x = c; x <= W - c + 1e-9; x += p.sm * k) dot(X0 + x, t0 - c, r, '#f87171');
  T(X0, t0 + TH * 0.6, TH * 0.9, `斜版橫斷面（寬 ${p.W_ramp}）`, '#ffd08a');
  // 鋼筋表
  let ty = zb - TH * 3.4; T(0, ty, TH * 0.9, '部位　筋別　號數＠間距　支數　單支長(cm)　總長(m)　重量(kg)', '#fde047'); ty -= TH * 1.3;
  RB.R.forEach(q => { T(0, ty, TH * 0.85, `${q.part}　${q.role}　${q.bar}@${q.sp}　${q.nb}　${q.L.toFixed(1)}　${q.len.toFixed(2)}　${q.kg.toFixed(1)}`); ty -= TH * 1.15; });
  T(0, ty, TH * 0.9, `合計 ${RB.bars.map(k2 => `${k2} ${RB.kg(k2).toFixed(1)} kg`).join('、')}，共 ${RB.tot.toFixed(1)} kg（依半重力式擋土牆配筋）`, '#fde047');
  return { P, bb: { x0: x0, x1: X0 + W + x0, y0: y0 + ty - TH, y1: y0 + H + TH * 3 } };
}
const bioAll = () => { const o = []; (state.revs || []).forEach(rv => (rv.bios || []).forEach(b => o.push({ rv, b }))); return o; };
function bioGeo(rv, b) {
  const p = b.p, R = rvAt(rv, b.sta, rvEDefAt(b.sta)), H = Math.max(0.5, R.H) * 100, Hn = Math.max(30, H - p.h_exp), Lr = p.k_slope * Hn, tw0 = bioTopW(R), twAuto = p.tAuto !== false && !!tw0, tw = twAuto ? tw0 : p.t_wall, Lt = 2 * tw + Lr + p.L_land;
  const s0 = b.sta, s1 = b.sta + Lt / 100, hi = b.dir > 0 ? s0 : s1, sg = b.dir > 0 ? 1 : -1;
  const zr = s => {   // 坡面頂相對設計河床（cm）
    const d = (s - hi) * sg * 100; if (d <= tw) return H; if (d <= tw + Lr) return H - (d - tw) / Lr * Hn; return p.h_exp; };
  const A = (2 * tw + Lr) / 2 * Hn, conc = A * p.W_ramp / 1e6, form = p.W_ramp * Hn * p.nf / 1e4;
  return { R, H, Hn, Lr, Lt, tw, twAuto, tw0, s0, s1, a: Math.min(s0, s1), b: Math.max(s0, s1), zr, A, conc, form, n: R.n || 0.3, e: R.e, brk: [s0 + sg * 0, hi + sg * tw / 100, hi + sg * (tw + Lr) / 100, hi + sg * (tw + Lr + p.L_land) / 100].map(v => +v.toFixed(3)) };
}
function bioIn(sd, s, strict) {   // 該岸在樁號 s 的生物通道（strict：範圍內部，不含起迄端）
  const o = [], sv = BIO_CUT; BIO_CUT = null;
  try { bioAll().forEach(({ rv, b }) => { if (rv.side !== sd) return; const g = bioGeo(rv, b), t = strict ? 0.01 : -0.01; if (s > g.a + t && s < g.b - t) o.push({ rv, b, g }); }); } finally { BIO_CUT = sv; }
  return o;
}
function bioSecEx(sec, rv, b) {   // 通道在此橫斷面的開挖、回填面積（同護岸規則：設計面以下、開挖線＝底版底前後緣外 1:ec；回填扣通道體；通道踏面以上不回填）
  const sd = rv.side, B = sec.bkInfo && sec.bkInfo[sd]; if (!B || !B.R) return null;
  const sv = BIO_CUT; BIO_CUT = null; let g; try { g = bioGeo(rv, b); } finally { BIO_CUT = sv; }
  const R = B.R, zc = sec.desCenterZ, n = R.n, e = R.e, af = z => e + n * z, zt = g.zr(sec.sta) / 100, zb = (b.p.h_exp - b.p.H_base) / 100, W = b.p.W_ramp / 100;
  const poly = [[af(zb), zc + zb], [af(zb) + W, zc + zb], [af(zt) + W, zc + zt], [af(zt), zc + zt]], sg = sd === 'L' ? -1 : 1, hS = sg < 0 ? sec.readL : sec.readR;
  const gz = a => secInterp(sec, sg * a, 'groundZ'), dz0 = a => secInterp(sec, sg * a, 'desZ'), a1 = af(zt), a2 = af(zt) + W, dz = a => (a >= a1 && a <= a2 ? Math.min(dz0(a), zc + zt) : dz0(a));
  const G = { zf: zc + zb, aF0: af(zb), aB0: af(zb) + W, polys: [{ pts: poly }] }, ec = Math.max(R.ec || 0.5, 1e-3), fe = rvFillEx(G, { ec }, zc, gz, dz, hS);
  return { x: fe.ex, k: fe.bf, G, ec, gz, sg, hS, name: b.name, id: b.id };
}
function bioQtyRows(rv) {   // 護岸數量表：註明扣除的通道範圍
  const q = rv._q, sv = BIO_CUT; BIO_CUT = null; let G; try { G = rv.bios.map(b => ({ b, g: bioGeo(rv, b) })); } finally { BIO_CUT = sv; }
  const L = rvLim(rv), In = G.filter(({ g }) => g.b > L.a && g.a < L.b); if (!In.length || q.rows.some(r => r.k === 'bioX')) return;
  const len = In.reduce((a, { g }) => a + Math.min(g.b, L.b) - Math.max(g.a, L.a), 0), i = q.rows.findIndex(r => r.k === 'nJ');
  q.rows.splice(i < 0 ? q.rows.length : i, 0, { k: 'bioX', it: '扣除生物通道範圍（不計護岸）', u: 'm', v: len, fx: In.map(({ b, g }) => `${b.name} ${formatStation(g.a)}～${formatStation(g.b)}`).join('、') + '；以上各項已扣除，通道數量另列' });
  const j = q.rows.find(r => r.k === 'nJ'); if (j) j.fx = j.fx.replace('含接壩／側牆端', '含接壩／側牆／生物通道端'); q.bioLen = len;
}
function bioCutPieces(pcs, rv) {
  const sv = BIO_CUT; BIO_CUT = null; let B; try { B = (rv.bios || []).map(b => { const g = bioGeo(rv, b); return [g.a, g.b, b.name]; }); } finally { BIO_CUT = sv; } if (!B.length) return pcs;
  let out = pcs; B.forEach(([a, b, nm]) => { const o = []; out.forEach(pc => { if (!(a < pc.b - 1e-6 && b > pc.a + 1e-6)) { o.push(pc); return; } const j = s => ({ s, zone: nm, zk: 'bio', kind: 'bio', face: null });
    if (a > pc.a + 1e-6) o.push({ a: pc.a, b: a, ja: pc.ja, jb: j(a) }); if (b < pc.b - 1e-6) o.push({ a: b, b: pc.b, ja: j(b), jb: pc.jb }); }); out = o; });
  return out.filter(pc => pc.b - pc.a > 0.02);
}
let BIO_CUT = null;
/* ---- 平面圖：通道外框（護岸牆腳～牆面頂退縮＋坡道寬）＋坡道斜線 ---- */
function bioPlanPolys(rv, b) {
  const g = bioGeo(rv, b), sg = rvSg(rv), P = (s, o) => { const q = getPointAndNormalAtStation(s); return q ? [q.x - q.nx * sg * o, q.y - q.ny * sg * o] : null; };
  const aIn = g.e, aOut = g.e + g.n * g.H / 100 + (b.p.W_ramp + g.tw) / 100, aR = g.e + g.n * g.H / 100;
  const box = [P(g.a, aIn), P(g.b, aIn), P(g.b, aOut), P(g.a, aOut)].filter(Boolean), [h0, h1, h2] = g.brk.slice(1);
  const ramp = [P(h0, aR + b.p.W_ramp / 100), P(h1, g.e + g.n * (b.p.h_exp / 100) + b.p.W_ramp / 100)].filter(Boolean);
  const walls = [[P(g.a, aIn), P(g.a + g.tw / 100, aIn)], [P(g.b - g.tw / 100, aIn), P(g.b, aIn)]];
  return { box, ramp, walls, g, mid: P((g.a + g.b) / 2, aOut + 0.6) };
}
function bioDrawPlan() {
  if (state.viewMode !== '2D') return;
  bioAll().forEach(({ rv, b }) => { if (!rvVis(rv)) return; let Q; try { Q = bioPlanPolys(rv, b); } catch (e) { return; } if (Q.box.length < 4) return;
    const S = p => worldToScreen2D(p[0], p[1]), sel = BIO_SEL === b.id; ctx.save(); ctx.strokeStyle = '#4ade80'; ctx.lineWidth = sel ? 2.4 : 1.6; ctx.fillStyle = 'rgba(74,222,128,0.12)';
    ctx.beginPath(); Q.box.forEach((p, i) => { const s = S(p); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (Q.ramp.length === 2) { ctx.setLineDash([6, 3]); ctx.beginPath(); const a = S(Q.ramp[0]), c = S(Q.ramp[1]); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke(); ctx.setLineDash([]); }
    if (Q.mid) { const m = S(Q.mid); ctx.fillStyle = '#4ade80'; ctx.font = 'bold 12px "Noto Sans TC",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${b.name}（${formatStation(Q.g.a)}～${formatStation(Q.g.b)}）`, m.x, m.y); }
    ctx.restore(); });
}
function bioDxfPlan(D) {
  bioAll().forEach(({ rv, b }) => { let Q; try { Q = bioPlanPolys(rv, b); } catch (e) { return; } if (Q.box.length < 4) return;
    D.poly(Q.box, 'BIO_PASS', 3, 0, true); if (Q.ramp.length === 2) D.poly(Q.ramp, 'BIO_PASS', 3, 0, false, 'DASHED');
    if (Q.mid) D.text(Q.mid[0], Q.mid[1], 0.5, `${b.name} ${formatStation(Q.g.a)}～${formatStation(Q.g.b)}`, 'BIO_TEXT', 3, { align: 'c' }); });
}
/* ---- 橫斷面：坡道帶（沿護岸面，寬 W）＋踏面 ---- */
function bioSecItems(sec) {
  const out = []; bioAll().forEach(({ rv, b }) => { const g = bioGeo(rv, b); if (sec.sta < g.a - 1e-6 || sec.sta > g.b + 1e-6) return; const G = rvGeomSec(sec, rv.side); if (!G) return;
    const zc = G.zc, n = g.n, e = G.R.e, af = z => e + n * z, zt = g.zr(sec.sta) / 100, zb = (b.p.h_exp - b.p.H_base) / 100, W = b.p.W_ramp / 100;
    out.push({ rv, b, g, sg: G.sg, zc, poly: [[af(zb), zc + zb], [af(zb) + W, zc + zb], [af(zt) + W, zc + zt], [af(zt), zc + zt]], tread: [[af(zt), zc + zt], [af(zt) + W, zc + zt]], zt: zc + zt }); });
  return out;
}
function bioDrawCross(sec, sx, sy, isLarge) {
  if (isLarge) { BIO_XC = { k0: sx(0) }; if (state.activeTool === 'BIO_PICK') { ctx.save(); ctx.fillStyle = 'rgba(74,222,128,.9)'; ctx.font = 'bold 13px "Noto Sans TC"'; ctx.textAlign = 'center'; ['L', 'R'].forEach(sd => { const rv = rvActive(sd, sec.sta); if (!rv) return; const R = rvAt(rv, sec.sta, rvEDefAt(sec.sta)), a = (sd === 'L' ? -1 : 1) * (R.e + R.n * R.H), x = sx(a), y = sy(sec.desCenterZ + R.H); ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillText(`點此側放置（${sd === 'L' ? '左岸' : '右岸'} ${formatStation(sec.sta)}）`, x, y - 12); }); ctx.restore(); } }
  bioSecItems(sec).forEach(K => { const X = a => sx(K.sg * a); ctx.save(); ctx.strokeStyle = '#4ade80'; ctx.fillStyle = 'rgba(74,222,128,0.2)'; ctx.lineWidth = isLarge ? 1.4 : 1; ctx.setLineDash([5, 3]);
    ctx.beginPath(); K.poly.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), sy(p[1])) : ctx.moveTo(X(p[0]), sy(p[1])))); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = isLarge ? 2.4 : 1.6;
    ctx.beginPath(); ctx.moveTo(X(K.tread[0][0]), sy(K.tread[0][1])); ctx.lineTo(X(K.tread[1][0]), sy(K.tread[1][1])); ctx.stroke();
    if (isLarge) { ctx.fillStyle = '#4ade80'; ctx.font = '11px "Noto Sans TC",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${K.b.name} 踏面 ${rvF(K.zt)}`, X(K.tread[1][0]), sy(K.zt) - 6); }
    const xl = bioExLine(sec, K); if (xl.length > 1) { ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = isLarge ? 1.1 : 0.8; ctx.setLineDash([7, 4]); ctx.beginPath(); xl.forEach(([a, z], i) => (i ? ctx.lineTo(X(a), sy(z)) : ctx.moveTo(X(a), sy(z)))); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore(); });
}
function bioDxfCross(D, sec, sx, sy, TH) {
  bioSecItems(sec).forEach(K => { const X = a => sx(K.sg * a); D.poly(K.poly.map(p => [X(p[0]), sy(p[1])]), 'BIO_PASS', 3, 0, true, 'DASHED'); D.poly(K.tread.map(p => [X(p[0]), sy(p[1])]), 'BIO_PASS', 3, 0, false);
    D.text(X(K.tread[1][0]), sy(K.zt) + TH * 0.4, TH * 0.7, `${K.b.name} 踏面 ${rvF(K.zt)}`, 'BIO_TEXT', 3, { align: 'c', valign: 'b' });
    const xl = bioExLine(sec, K); if (xl.length > 1) D.poly(xl.map(([a, z]) => [X(a), sy(z)]), 'BIO_EXC', 6, 0, false, 'DASHED'); });
}
function bioExLine(sec, K) {   // 通道開挖線（地面以下部分）
  const E = bioSecEx(sec, K.rv, K.b); if (!E) return []; const { G, ec, gz } = E, zx = a => G.zf + Math.max(0, (G.aF0 - a) / ec, (a - G.aB0) / ec), o = [];
  let lo = G.aF0, hi = G.aB0; while (lo > G.aF0 - 30 && Number.isFinite(gz(lo)) && gz(lo) > zx(lo)) lo -= 0.05; while (hi < G.aB0 + 30 && Number.isFinite(gz(hi)) && gz(hi) > zx(hi)) hi += 0.05;
  o.push([lo, zx(lo)], [G.aF0, G.zf], [G.aB0, G.zf], [hi, zx(hi)]); return o;
}
/* ---- 標準圖（原工具三視圖＋數量表；參數由本通道幾何帶入） ---- */
function bioStdPrims(rv, b) {
  const g = bioGeo(rv, b), O = TCO_B.bio.run(Object.assign({}, b.p, { t_wall: g.tw, name: b.name, H_total: g.Hn + b.p.H_base, L_ramp: g.Lr, m_side: g.n, Hn: g.Hn, A: g.A, conc: g.conc, form: g.form })), P = tcoStdPrims(O, 0.01, 0, 0, 'STD_'), bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  P.forEach(o => { if (o.t === 't') { bb.x0 = Math.min(bb.x0, o.x); bb.x1 = Math.max(bb.x1, o.x + o.s.length * o.h); bb.y0 = Math.min(bb.y0, o.y - o.h); bb.y1 = Math.max(bb.y1, o.y + o.h); } else o.p.forEach(v => { bb.x0 = Math.min(bb.x0, v[0]); bb.x1 = Math.max(bb.x1, v[0]); bb.y0 = Math.min(bb.y0, v[1]); bb.y1 = Math.max(bb.y1, v[1]); }); });
  try { const RP = bioRebarPrims(g, b, bb.x1 + 1.0, (bb.y0 + bb.y1) / 2); RP.P.forEach(o => P.push(o)); bb.x1 = Math.max(bb.x1, RP.bb.x1); bb.y0 = Math.min(bb.y0, RP.bb.y0); bb.y1 = Math.max(bb.y1, RP.bb.y1); } catch (e) { console.error('bioRebarPrims', e); }
  const TH = Math.max(0.08, (bb.x1 - bb.x0) / 120); P.push({ t: 't', x: bb.x0, y: bb.y1 + TH * 2, h: TH * 1.4, s: `${b.name}　生物通道（${rv.side === 'L' ? '左岸' : '右岸'} ${formatStation(g.a)}～${formatStation(g.b)}）`, c: '#ffd08a', a: 30, ly: 'STD_TITLE', al: 'l', va: 'b', rot: 0 }); bb.y1 += TH * 4;
  return { P, bb };
}
function bioStdOpen() { const f = bioFind(BIO_SEL) || bioAll()[0]; if (!f) return; const r = bioStdPrims(f.rv, f.b); stStdOpen(undefined, { P: r.P, bb: r.bb, name: f.b.name, title: `${f.b.name}　生物通道標準圖` }); }
/* ---- 數量表 ---- */
function bioSheet() {
  const L = bioAll(); if (!L.length) return null; const r3 = v => Math.round(v * 1000) / 1000; try { dzEwRows(); } catch (e) { } const EW = typeof BIO_EW !== 'undefined' ? BIO_EW : {};
  const rows = [[{ v: '生物通道數量（依原圖正視圖：坡道多邊形面積×坡道寬；軀體模板＝兩端牆內外面）', s: 5 }], [{ v: '名稱', s: 1 }, { v: '所屬護岸', s: 1 }, { v: '樁號範圍', s: 1 }, { v: '工項', s: 1 }, { v: '數量', s: 1 }, { v: '單位', s: 1 }, { v: '計算式', s: 1 }]];
  L.forEach(({ rv, b }) => { const g = bioGeo(rv, b), nm = rvShort ? rvShort(rv) : rv.side, rg = `${formatStation(g.a)}～${formatStation(g.b)}`;
    rows.push([b.name, nm, rg, '210kgf/cm² 混凝土', r3(g.conc), 'm³', `(2×${rvF(g.tw, 0)}${g.twAuto ? '（端牆厚＝護岸牆頂寬）' : ''}＋${rvF(g.Lr, 1)})/2×${rvF(g.Hn, 1)}×${b.p.W_ramp}÷10⁶（淨高＝護岸高 ${rvF(g.H, 0)}−${b.p.h_exp}；坡長＝1:${b.p.k_slope}×淨高）`]);
    rows.push([b.name, nm, rg, '軀體模板', r3(g.form), 'm²', `${b.p.W_ramp}×${rvF(g.Hn, 1)}×${b.p.nf}÷10⁴`]);
    { const RB = bioRebar(g, b); RB.bars.forEach(k => rows.push([b.name, nm, rg, `鋼筋 ${k}`, +RB.kg(k).toFixed(1), 'kg', RB.R.filter(q => q.bar === k).map(q => `${q.part}${q.role} ${q.nb}支×${rvF(q.L / 100)}m`).join('＋') + `×${BIO_RB[k]} kg/m（依配筋圖；保護層 ${RB.c} cm）`])); }
    const E = EW[b.name]; if (E) { const fx = E.rows.map(r => `${formatStation(r.a)}～${formatStation(r.b)}：(${rvF(r.x1)}+${rvF(r.x2)})/2×${rvF(r.L)}`).join('；');
      rows.push([b.name, nm, rg, '通道開挖', r3(E.x), 'm³', `橫斷面切算，平均斷面法（設計面以下、底版底前後緣外 1:ec）｜${fx}`]);
      rows.push([b.name, nm, rg, '通道回填', r3(E.k), 'm³', `開挖空間回填至設計面（踏面以上不回填），已扣通道體｜` + E.rows.map(r => `(${rvF(r.k1)}+${rvF(r.k2)})/2×${rvF(r.L)}`).join('；')]); }
    if (rv._q && rv._q.bioLen) rows.push([b.name, nm, rg, '（說明）護岸扣除長度', r3(rv._q.bioLen), 'm', `${rvShort ? rvShort(rv) : ''} 數量表已扣除此範圍；全線土方表此範圍護岸基礎開挖／背填為 0`]); });
  return { name: '生物通道', cols: [14, 14, 22, 20, 10, 6, 70], rows, freeze: 2, merges: ['A1:G1'] };
}
/* ---- 面板（附在護岸面板下方） ---- */
let BIO_SIG = '';
function bioUI() {
  const box = document.getElementById('rvBox'); if (!box) return; let d = document.getElementById('bioBox');
  const sig = JSON.stringify([BIO_SEL, bioAll().map(({ rv, b }) => [rv.id, rv.side, b, rv.p.H])]); if (d && sig === BIO_SIG) return; if (d && d.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName) && sig === BIO_SIG) return; BIO_SIG = sig;
  if (!d) { d = document.createElement('div'); d.id = 'bioBox'; box.parentNode.insertBefore(d, box.nextSibling); }
  const L = bioAll(), sel = L.find(x => x.b.id === BIO_SEL) || L[0], inp = (k, v, w, st) => `<input type="number" class="input-num" style="width:${w || 64}px;" step="${st || 1}" value="${v}" onchange="bioSet('${k}',this.value)">`;
  let h = `<details class="rvacc" open><summary>🦎 生物通道<span class="sm">${L.length} 處（附掛於護岸，順著護岸頂線；範圍內平面護岸線刪除）</span></summary><div class="rvab" style="font-size:11px;">`;
  h += `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px;"><button class="btn magenta" onclick="bioPick('new')" title="在平面圖點護岸位置（自動吸附最近的護岸頂線，決定岸別與起點樁號），或在橫斷面圖點左／右岸護岸頂">📍 圖面點擊新增</button>${sel ? '<button class="btn" onclick="bioPick(\'move\')" title="在平面圖或橫斷面圖點一下，把選取的通道移到該處；平面圖上也可直接拖曳通道框">📍 點擊移動</button>' : ''}<button class="btn" onclick="bioAdd('L')">＋左岸</button><button class="btn" onclick="bioAdd('R')">＋右岸</button>${sel ? `<button class="btn" onclick="bioStdOpen()">📐 標準圖</button><button class="btn" onclick="bioDel()">刪除</button>` : ''}</div>`;
  if (L.length) h += `<select class="input-select" style="width:100%;margin-bottom:4px;" onchange="BIO_SEL=this.value;bioUI();requestRedraw();">${L.map(({ rv, b }) => `<option value="${b.id}"${sel && sel.b.id === b.id ? ' selected' : ''}>${b.name}（${rv.side === 'L' ? '左岸' : '右岸'} ${formatStation(b.sta)}）</option>`).join('')}</select>`;
  if (sel) { const { rv, b } = sel, g = bioGeo(rv, b);
    h += `<div style="display:grid;grid-template-columns:1fr auto;gap:2px 6px;align-items:center;">
      <span>名稱</span><input type="text" class="input-num" style="width:110px;" value="${escAttr(b.name)}" onchange="bioSet('name',this.value)">
      <span>岸別（移到該岸同樁號護岸）</span><select class="input-select" onchange="bioSet('side',this.value)"><option value="L"${rv.side === 'L' ? ' selected' : ''}>左岸</option><option value="R"${rv.side === 'R' ? ' selected' : ''}>右岸</option></select>
      <span>起點樁號 (m)</span>${inp('sta', b.sta, 80, 0.1)}
      <span>坡道方向</span><select class="input-select" onchange="bioSet('dir',this.value)"><option value="1"${b.dir > 0 ? ' selected' : ''}>高端在起點（往里程增加下降）</option><option value="-1"${b.dir < 0 ? ' selected' : ''}>高端在終點（上下游對調）</option></select>
      <span title="勾選：端牆厚＝通道起點樁號所在位置的護岸牆頂寬（重力式取頂寬 b、乾砌石取頂寬）">端牆厚取起點護岸牆頂寬${g.tw0 ? `（${rvF(g.tw0, 0)} cm）` : '（此型式無，改用手動）'}</span><input type="checkbox"${b.p.tAuto !== false ? ' checked' : ''}${g.tw0 ? '' : ' disabled'} onchange="bioSet('tAuto',this.checked)">
      <span>主筋號數／間距 (cm)</span><span style="white-space:nowrap;"><select class="input-select" style="width:60px;" onchange="bioSet('rb.rbm',this.value)">${Object.keys(BIO_RB).map(k => `<option${k === b.p.rbm ? ' selected' : ''}>${k}</option>`).join('')}</select> @${inp('p.sm', b.p.sm, 44, 5)}</span>
      <span>副筋號數／間距 牆・斜版 (cm)</span><span style="white-space:nowrap;"><select class="input-select" style="width:60px;" onchange="bioSet('rb.rbd',this.value)">${Object.keys(BIO_RB).map(k => `<option${k === b.p.rbd ? ' selected' : ''}>${k}</option>`).join('')}</select> @${inp('p.sdw', b.p.sdw, 44, 1)}</span>
      <span>副筋間距 底版 (cm)／保護層 (cm)</span><span style="white-space:nowrap;">@${inp('p.sdb', b.p.sdb, 44, 1)} ${inp('p.cov', b.p.cov, 44, 0.5)}</span>
      ${BIO_PR.map(([k, nm, u, st]) => `<span>${nm}${u ? ' (' + u + ')' : ''}</span>${k === 't_wall' && g.twAuto ? `<input type="number" class="input-num" style="width:64px;" value="${rvF(g.tw, 0)}" disabled title="取護岸牆頂寬">` : inp('p.' + k, b.p[k], 64, st)}`).join('')}</div>
      <div style="margin-top:4px;line-height:1.6;background:rgba(74,222,128,.06);border:1px solid var(--border-dim);padding:3px 6px;border-radius:4px;">
      所屬：${rvShort ? rvShort(rv) : ''}　範圍 ${formatStation(g.a)}～${formatStation(g.b)}（全長 ${rvF(g.Lt, 0)} cm）<br>
      護岸高 ${rvF(g.H, 0)} → 淨高 ${rvF(g.Hn, 0)}、坡長 ${rvF(g.Lr, 0)}（1:${b.p.k_slope}）<br>混凝土 ${rvF(g.conc, 3)} m³、軀體模板 ${rvF(g.form, 2)} m²、鋼筋 ${(() => { const RB = bioRebar(g, b); return RB.bars.map(k => `${k} ${rvF(RB.kg(k), 1)}`).join('＋') + ' kg'; })()}${(() => { try { dzEwRows(); const E = BIO_EW[b.name]; return E ? `<br>通道開挖 ${rvF(E.x, 2)} m³、回填 ${rvF(E.k, 2)} m³（橫斷面切算）` : ''; } catch (e) { return ''; } })()}<br><span style="color:#b45309;">範圍內護岸已扣除（平面、縱橫斷面、護岸數量、土方）</span></div>`; }
  h += '</div></details>'; d.innerHTML = h;
}
function bioFind(id) { return bioAll().find(x => x.b.id === id); }
function bioAdd(side) {
  const sec = state.sections[state.selectedStaIdx], s = sec ? sec.sta : state.alignment.startSta, rv = rvActive(side, s) || state.revs.find(r => r.side === side);
  if (!rv) { updateStatus(`⚠ ${side === 'L' ? '左' : '右'}岸沒有護岸，請先建立護岸。`); return; }
  pushUndoSnapshot(); rv.bios = rv.bios || []; const n = bioAll().length + 1, b = bioNorm({ name: `生物通道${n}`, sta: +(Math.max(rvLim(rv).a, Math.min(rvLim(rv).b - 4, s))).toFixed(2) }); rv.bios.push(b); BIO_SEL = b.id;
  bioRefresh(); updateStatus(`🦎 已在 ${rvShort ? rvShort(rv) : side} ${formatStation(b.sta)} 加入${b.name}。`);
}
function bioDel() { const f = bioFind(BIO_SEL) || bioAll()[0]; if (!f) return; pushUndoSnapshot(); f.rv.bios = f.rv.bios.filter(b => b !== f.b); BIO_SEL = null; bioRefresh(); }
function bioSet(k, v) {
  const f = bioFind(BIO_SEL) || bioAll()[0]; if (!f) return; const { rv, b } = f; pushUndoSnapshot();
  if (k.startsWith('rb.')) b.p[k.slice(3)] = String(v); else if (k === 'tAuto') b.p.tAuto = !!v; else if (k === 'name') b.name = String(v || '生物通道'); else if (k === 'sta') { const x = parseFloat(v); if (Number.isFinite(x)) b.sta = x; } else if (k === 'dir') b.dir = +v < 0 ? -1 : 1;
  else if (k === 'side') { if (v !== rv.side) { const to = rvActive(v, b.sta) || state.revs.find(r => r.side === v); if (!to) { updateStatus('⚠ 對岸沒有護岸。'); return; } rv.bios = rv.bios.filter(x => x !== b); to.bios = to.bios || []; to.bios.push(b); } }
  else if (k.startsWith('p.')) { const x = parseFloat(v); if (Number.isFinite(x)) b.p[k.slice(2)] = x; }
  bioRefresh();
}
function bioRefresh() { RV_ZDIRTY = true; RV_SIG = ''; (state.revs || []).forEach(r => { r._pck = null; }); try { rebuildAlignmentAndSections(); } catch (e) { requestRedraw(); } bioUI(); }
/* ---- 滑鼠放置：平面圖點擊（吸附最近護岸頂線）、橫斷面點左／右岸；平面圖拖曳通道框 ---- */
function bioRvTop(rv, s) { const R = rvAt(rv, s, rvEDefAt(s)), a = R.e + R.n * R.H, q = getPointAndNormalAtStation(s); if (!q) return null; const sg = rvSg(rv); return [q.x - q.nx * sg * a, q.y - q.ny * sg * a]; }   // 護岸頂（臨水面頂緣）平面位置
function bioSnap(x, y) {   // 平面點 → 最近的護岸頂線：{rv, side, sta, d}
  const pr = projectWorldPointToAlignment(x, y); if (!pr) return null; let best = null;
  (state.revs || []).forEach(rv => { if (!rvVis(rv)) return; const L = rvLim(rv); if (pr.sta < L.a - 0.01 || pr.sta > L.b + 0.01) return; const p = bioRvTop(rv, pr.sta); if (!p) return; const d = Math.hypot(p[0] - x, p[1] - y); if (!best || d < best.d) best = { rv, side: rv.side, sta: pr.sta, d }; });
  return best;
}
function bioPick(mode) {
  if (!(state.revs || []).length) { updateStatus('⚠ 尚無護岸；生物通道須附掛在護岸上，請先建立護岸。'); return; }
  if (mode === 'move' && !(bioFind(BIO_SEL) || bioAll()[0])) mode = 'new'; if (state.viewMode !== '2D' && state.viewMode !== 'CROSS') setViewMode('2D');
  setTool('BIO_PICK'); state.dzTool = { kind: 'biop', mode }; state.dzTmp = [];
  document.getElementById('hudToolTip').innerHTML = `📍【生物通道${mode === 'move' ? '移動' : '新增'}】平面圖：點護岸附近（吸附最近的護岸頂線＝起點）；橫斷面圖：點左或右岸。Esc 取消。`;
  updateStatus(`📍 請在平面圖點護岸位置，或在橫斷面圖點左／右岸（${mode === 'move' ? '移動選取的通道' : '新增通道'}）。`); requestRedraw();
}
function bioPlace(side, sta, rv0) {
  const mode = state.dzTool && state.dzTool.mode, rv = rv0 || rvActive(side, sta) || (state.revs || []).find(r => r.side === side && sta >= rvLim(r).a - 0.01 && sta <= rvLim(r).b + 0.01);
  if (!rv) { updateStatus(`⚠ ${side === 'L' ? '左' : '右'}岸此樁號沒有護岸。`); return false; }
  pushUndoSnapshot(); let b; const f = mode === 'move' ? (bioFind(BIO_SEL) || bioAll()[0]) : null;
  if (f) { b = f.b; if (f.rv !== rv) { f.rv.bios = f.rv.bios.filter(x => x !== b); rv.bios = rv.bios || []; rv.bios.push(b); } } else { rv.bios = rv.bios || []; b = bioNorm({ name: `生物通道${bioAll().length + 1}` }); rv.bios.push(b); }
  const L = rvLim(rv), sv = BIO_CUT; BIO_CUT = null; let Lt = 4; try { b.sta = sta; Lt = bioGeo(rv, b).Lt / 100; } finally { BIO_CUT = sv; }
  b.sta = +Math.max(L.a, Math.min(L.b - Lt, sta)).toFixed(2); BIO_SEL = b.id; setTool('PAN'); state.dzTmp = []; bioRefresh();
  updateStatus(`🦎 ${b.name}：${rvShort ? rvShort(rv) : side} 起點 ${formatStation(b.sta)}（吸附護岸頂線）。平面圖可直接拖曳通道框微調。`); return true;
}
if (typeof DZ_TOOLS !== 'undefined' && !DZ_TOOLS.includes('BIO_PICK')) DZ_TOOLS.push('BIO_PICK');
let BIO_XC = null, BIO_DRG = null;
(function () {
  const _ck = dzClick; dzClick = function (w) {
    if (state.activeTool !== 'BIO_PICK') return _ck(w);
    const h = bioSnap(w.x, w.y); if (!h) { updateStatus('⚠ 這裡沒有護岸（點在護岸附近，或確認護岸範圍）。'); return; } bioPlace(h.side, Math.round(h.sta * 10) / 10, h.rv);
  };
  const bioPanelOn = () => { const d = document.getElementById('bioBox'); return !!(d && d.offsetParent); };
  const pip = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if (((a[1] > y) !== (b[1] > y)) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  window.addEventListener('mousedown', e => {
    if (e.button !== 0 || (e.target && e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay')) return;
    if (state.viewMode === 'CROSS' && state.activeTool === 'BIO_PICK') {   // 橫斷面：左半＝左岸、右半＝右岸，起點＝此斷面樁號
      const sec = state.sections[state.selectedStaIdx]; if (!sec || !BIO_XC || typeof camInv !== 'function') return; const rc = cadCanvas.getBoundingClientRect(), b = camInv(e.clientX - rc.left, e.clientY - rc.top);
      e.preventDefault(); e.stopImmediatePropagation(); bioPlace(b.x < BIO_XC.k0 ? 'L' : 'R', sec.sta); return; }
    if (state.viewMode !== '2D' || state.activeTool !== 'PAN' || !bioPanelOn()) return; const rc = cadCanvas.getBoundingClientRect(), w = screenToWorld2D(e.clientX - rc.left, e.clientY - rc.top);
    const hit = bioAll().find(({ rv, b }) => { try { const Q = bioPlanPolys(rv, b); return Q.box.length > 3 && pip(Q.box, w.x, w.y); } catch (er) { return false; } }); if (!hit) return;
    const pr = projectWorldPointToAlignment(w.x, w.y); if (!pr) return; e.preventDefault(); e.stopImmediatePropagation(); pushUndoSnapshot(); BIO_SEL = hit.b.id; BIO_DRG = { rv: hit.rv, b: hit.b, d0: pr.sta - hit.b.sta, moved: false, s0: hit.b.sta };
    updateStatus(`↔ 拖曳「${hit.b.name}」沿護岸頂線移動（Shift＝不吸附 0.5 m；拖到對岸附近會換岸）。`);
  }, true);
  window.addEventListener('mousemove', e => {
    const D = BIO_DRG; if (!D) return; e.stopImmediatePropagation(); const rc = cadCanvas.getBoundingClientRect(), w = screenToWorld2D(e.clientX - rc.left, e.clientY - rc.top), h = bioSnap(w.x, w.y); if (!h) return;
    let s = h.sta - D.d0; if (!e.shiftKey) s = Math.round(s * 2) / 2; if (h.rv !== D.rv) { D.rv.bios = D.rv.bios.filter(x => x !== D.b); h.rv.bios = h.rv.bios || []; h.rv.bios.push(D.b); D.rv = h.rv; }
    const L = rvLim(D.rv), sv = BIO_CUT; BIO_CUT = null; let Lt = 4; try { Lt = bioGeo(D.rv, D.b).Lt / 100; } finally { BIO_CUT = sv; } D.b.sta = +Math.max(L.a, Math.min(L.b - Lt, s)).toFixed(2); D.moved = true;
    (state.revs || []).forEach(r => { r._pck = null; r._bpk = null; }); updateStatus(`↔ ${D.b.name}：${rvShort ? rvShort(D.rv) : D.rv.side} 起點 ${formatStation(D.b.sta)}`); requestRedraw();
  }, true);
  window.addEventListener('mouseup', () => { const D = BIO_DRG; if (!D) return; BIO_DRG = null; if (!D.moved) { state.undoStack.pop(); bioUI(); requestRedraw(); return; } bioRefresh(); updateStatus(`✅ ${D.b.name}：起點 ${formatStation(D.b.sta)}（範圍內護岸、土方已重算）。`); }, true);
})();
/* ---- 掛勾 ---- */
(function () {
  const _n = rvNorm; rvNorm = function (o) { const r = _n(o); r.bios = ((o && o.bios) || []).map(bioNorm); return r; };
  const _c = rvCleanArr; rvCleanArr = function (arr) { const a = _c(arr); a.forEach((o, i) => { const r = (arr || [])[i]; if (r && r.bios && r.bios.length) o.bios = r.bios.map(b => ({ id: b.id, name: b.name, sta: b.sta, dir: b.dir, p: Object.assign({}, b.p) })); }); return a; };
  const _pi = rvPiecesInfo; rvPiecesInfo = function (rv) { const pcs = _pi(rv); if (!((BIO_CUT === rv || BIO_CUT === 'all') && rv.bios && rv.bios.length)) return pcs; const k = JSON.stringify([rv._pck, rv.bios, rv.p, rv.raises, rv.wids, rv.cps, rv.s0, rv.s1, rv.e0, rv.e1]); if (rv._bpk !== k || !rv._bpc) { rv._bpc = bioCutPieces(pcs, rv); rv._bpk = k; } return rv._bpc; };
  const _pl = rvPlanLines; rvPlanLines = function (rv, step) { BIO_CUT = rv; try { return _pl(rv, step); } finally { BIO_CUT = null; } };
  const _w = rvWings; rvWings = function (rv) { const W = _w(rv); if ((BIO_CUT !== rv && BIO_CUT !== 'all') || !(rv.bios || []).length) return W; const sv = BIO_CUT; BIO_CUT = null; try { const G = rv.bios.map(b => bioGeo(rv, b)); return W.filter(w => !G.some(g => Math.abs(w.s - g.a) < 0.03 || Math.abs(w.s - g.b) < 0.03)); } finally { BIO_CUT = sv; } };
  const _ks = rvKeyStations; rvKeyStations = function () { const o = _ks(); try { bioAll().forEach(({ rv, b }) => { const g = bioGeo(rv, b); g.brk.forEach((s, i) => o.push({ s, ptName: i === 0 ? `${b.name}起` : '', priority: i === 0 ? 4 : 2, isCurveTick: false })); o.push({ s: +g.b.toFixed(3), ptName: `${b.name}迄`, priority: 4, isCurveTick: false }); }); } catch (e) { } return o; };
  const _dp = rvDrawPlan; rvDrawPlan = function () { _dp(); try { bioDrawPlan(); } catch (e) { console.error('bioDrawPlan', e); } };
  const _xp = rvDxfPlan; rvDxfPlan = function (D) { _xp(D); try { bioDxfPlan(D); } catch (e) { console.error('bioDxfPlan', e); } };
  const _dc = rvDrawCross; rvDrawCross = function (sec, sx, sy, isLarge) { hide(sec, () => _dc(sec, sx, sy, isLarge)); try { bioDrawCross(sec, sx, sy, isLarge); } catch (e) { console.error('bioDrawCross', e); } };
  const _xc = rvDxfCross; rvDxfCross = function (D, sec, sx, sy, TH) { hide(sec, () => _xc(D, sec, sx, sy, TH)); try { bioDxfCross(D, sec, sx, sy, TH); } catch (e) { console.error('bioDxfCross', e); } };
  const _ui = rvRenderUI; rvRenderUI = function () { const sv = BIO_CUT; BIO_CUT = 'all'; try { _ui(); } finally { BIO_CUT = sv; } try { bioUI(); } catch (e) { console.error('bioUI', e); } };
  const _rc = rvRecalc; rvRecalc = function () { const sv = BIO_CUT; BIO_CUT = 'all'; try { _rc(); } finally { BIO_CUT = sv; } let any = false; try { state.revs.forEach(rv => { if (!rv._q || !(rv.bios || []).length) return; any = true; bioQtyRows(rv); }); } catch (e) { console.error('bioQtyRows', e); } if (any) rvRenderUI(); };
  const _pf = rvProfLines; rvProfLines = function (rv, a, b) { const sv = BIO_CUT; BIO_CUT = rv; try { return _pf(rv, a, b); } finally { BIO_CUT = sv; } };
  const hide = (sec, fn) => { const bk = sec.bkInfo; if (!bk) return fn(); const sds = ['L', 'R'].filter(sd => bioIn(sd, sec.sta, true).length); if (!sds.length) return fn(); const c = Object.assign({}, bk); sds.forEach(sd => { c[sd] = { mode: 'nat' }; }); sec.bkInfo = c; try { return fn(); } finally { sec.bkInfo = bk; } };
  const _sd = rvDxfStdAll; rvDxfStdAll = function (D, xRight, yTop) { let y = _sd(D, xRight, yTop); try { bioAll().forEach(({ rv, b }) => { const r = bioStdPrims(rv, b), q = r.bb; stStdEmit(D, r.P, xRight - q.x1, y - q.y1); y -= (q.y1 - q.y0) + 20; }); } catch (e) { console.error('bioStd', e); } return y; };
  const _bk = stQtyBook; stQtyBook = function () { const B = _bk(); let s = null; try { s = bioSheet(); } catch (e) { console.error('bioSheet', e); } if (s) { B.sheets.push(s); B.n += 1; } return B; };
})();
