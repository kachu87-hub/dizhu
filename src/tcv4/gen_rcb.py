# v6.3 預鑄RC箱複合式護岸（b130106e，cadLine 框架）→ TCO_T['rcb']：model(R)／prims(m)
import re, json
ATT = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/'
h = open(ATT + 'b130106e-__RC______.html', encoding='utf8').read()
script = h[h.rindex('<script>') + 8:h.rindex('</script>')]
SUBS = [
  ('let showGhostBaseline = true;', 'let showGhostBaseline = false;'),
  ('const cov = 5.5 * s;', 'const cov = p.cov * s;'),
  ('const pcOut = 6 * s;', 'const pcOut = p.pco * s;'),
  ('const weepY1 = wallTopY + 76 * s;', 'const weepY1 = wallTopY + p.wpy * s;'),
  ('const hDrop = 25 * s;           // 25 cm drop at toe', 'const hDrop = p.drop * s;'),
  ('const paverDepth = 8 * s;', 'const paverDepth = p.pvd * s;'),
  ('const paverLeftX = toeKneeX + 12 * s;', 'const paverLeftX = toeKneeX + p.pvo * s;'),
  ('[footLeftX - 5 * s, footBotY],\n        [footRightX + 18 * s, footBotY],\n        [footRightX + 18 * s, footBotY + pcH],\n        [footLeftX - 5 * s, footBotY + pcH]',
   '[footLeftX - p.pcl * s, footBotY],\n        [footRightX + p.pcr * s, footBotY],\n        [footRightX + p.pcr * s, footBotY + pcH],\n        [footLeftX - p.pcl * s, footBotY + pcH]'),
  ("      cadLine(ctx, paverLeftX + 14 * s, toeKneeY + paverDepth, paverLeftX + 14 * s, slabBotY, pal.secondaryLine, 1.0, [], 'BEAM_LINE');\n      cadLine(ctx, paverLeftX + 34 * s, toeKneeY + paverDepth, paverLeftX + 34 * s, slabBotY, pal.secondaryLine, 1.0, [], 'BEAM_LINE');",
   "      cadPoly(ctx, [[footRightX, slabBotY], [footRightX, slabBotY + p.bmD * s], [wallBackX, slabBotY + p.bmD * s], [wallBackX, slabBotY]], pal.secondaryLine, 1.2, false, null, [8, 5], 'BEAM_LINE');\n      cadDimLinear(ctx, wallBackX - 8 * s, slabBotY, wallBackX - 8 * s, slabBotY + p.bmD * s, -30, `${p.bmD}`, pal, 11);"),
  ("cadLeader(ctx, footRightX - 10 * s, slabBotY, footLeftX - 40, footBotY + 86, -1, ['間格樑t=30cm@3m'], pal);", "cadLeader(ctx, (footRightX + wallBackX) / 2, slabBotY + p.bmD / 2 * s, footLeftX - 40, footBotY + 86, -1, [`間格樑 t=${p.bmT}cm@${p.bmS / 100}m（虛線，版底下深 ${p.bmD}）`, `承載版厚 ${p.t_slab}cm`], pal);"),
  ('const bagLayerThick = 16 * s;', 'const bagLayerThick = p.bagT * s;'),
  ('const bagH = 7.5 * s;', 'const bagH = p.bagH * s;'),
  ("cadDimLinear(ctx, footLeftX, slabBotY, footLeftX, footBotY, -18, `25`, pal, 12);", "cadDimLinear(ctx, footLeftX, slabBotY, footLeftX, footBotY, -18, `${p.drop}`, pal, 12);"),
  ("cadText(ctx, `${p.B_top}`, (wallBackX + wallSoffitFrontX) / 2 + 12", "cadText(ctx, `${+((wallSoffitFrontX - wallBackX) / s).toFixed(1)}`, (wallBackX + wallSoffitFrontX) / 2 + 12"),
  ("cadDimLinear(ctx, vDimX1, bankTopY, vDimX1, wallTopY, 18, `180`, pal, 13);", "cadDimLinear(ctx, vDimX1, bankTopY, vDimX1, wallTopY, 18, `${+((wallTopY - bankTopY) / s).toFixed(1)}`, pal, 13);"),
  ("drawSectionTitle(ctx, '預鑄護岸詳細圖1', '0k+009-0k+038.5', sec1CenterX, sec1TitleY, pal);", "drawSectionTitle(ctx, '預鑄護岸詳細圖1', p.__rng || '', sec1CenterX, sec1TitleY, pal);"),
  ('const wallY = h * (15 / 90);', 'const wallY = h * (__P.T_box / __P.B_box);'),
  ('const chY = h * (10 / 90);', 'const chY = h * (__P.c_box / __P.B_box);'),
  ('const flatY = h * (40 / 90);', 'const flatY = h * ((__P.B_box - 2 * __P.T_box - 2 * __P.c_box) / __P.B_box);'),
  ("const chX = w * (10 / 120);\n        const endRecessX = w * (20 / 120);\n        const wallX = w * (15 / 120);", "const chX = w * (__P.c_box / __P.L_box);\n        const endRecessX = w * (2 * __P.t_box / __P.L_box);\n        const wallX = w * (__P.T_box / __P.L_box);"),
  ("const chX = w * (10 / 60);\n        const wallX = w * (15 / 60);", "const chX = w * (__P.c_box / (__P.L_box / 2));\n        const wallX = w * (__P.T_box / (__P.L_box / 2));"),
  ('const lx2 = rx + w * (25 / 60);', 'const lx2 = rx + w * ((__P.L_box / 2 - 2 * __P.t_box - __P.T_box) / (__P.L_box / 2));'),
  ("const chX = w * (10 / 60);\n        const endRecessX = w * (20 / 60);", "const chX = w * (__P.c_box / (__P.L_box / 2));\n        const endRecessX = w * (2 * __P.t_box / (__P.L_box / 2));"),
  ('const rx2 = rx + w - w * (25 / 60);', 'const rx2 = rx + w - w * ((__P.L_box / 2 - 2 * __P.t_box - __P.T_box) / (__P.L_box / 2));'),
  ("['1', '10', '0.559',", "['1', '10', `${__P.wD10}`,"), ("['2', '10', '0.559',", "['2', '10', `${__P.wD10}`,"), ("['3', '10', '0.559',", "['3', '10', `${__P.wD10}`,"), ("['4', '10', '0.559',", "['4', '10', `${__P.wD10}`,"), ("['5', '10', '0.559',", "['5', '10', `${__P.wD10}`,"),
]
for o, n in SUBS:
    assert o in script, o; script = script.replace(o, n)
JS = r"""
  let __P = null; const PAL = getPalette();
  const __n = (k, d) => { const v = parseFloat(RR ? RR[k] : undefined); return Number.isFinite(v) ? v : d; };
  computeQuantities = function (p) {   // 依圖面幾何（預鑄 RC 箱平面：外框－中央八角孔－兩端半八角凹口；cm）
    const L = p.L_box, B = p.B_box, H = p.H_box, T = p.T_box, t = p.t_box, c = p.c_box, rec = 2 * t, Bi = B - 2 * T, Lo = L - 2 * rec - 2 * T, r2 = Math.SQRT2;
    const Aoct = Lo * Bi - 2 * c * c, Arec = rec * Bi - c * c, As = L * B - Aoct - 2 * Arec, holes = 2 * Math.PI * p.hr * p.hr * T;
    const conc = (As * H - holes) / 1e6, voidA = L * B - As, fill = voidA * Math.max(0, H - p.bagT) / 1e6;
    const endOut = 2 * T + 2 * c + 2 * c * r2 + (Bi - 2 * c), perO = 2 * L + 2 * endOut, perH = 2 * (Lo - 2 * c) + 2 * (Bi - 2 * c) + 4 * c * r2, form = ((perO + perH) * H + As) / 1e4;
    const rows = [1, 2, 3, 4, 5].map(i => { const len = p['rb' + i + 'l'], cnt = p['rb' + i + 'n']; return { len, cnt, wt: +(len * cnt * p.wD10).toFixed(2) }; }), rebar = rows.reduce((a, r) => a + r.wt, 0);
    const f = v => (+v).toFixed(1);
    return { unitFill: +fill.toFixed(3), unitConc: +conc.toFixed(3), unitForm: +form.toFixed(2), unitRebar: +rebar.toFixed(2), unitBolts: p.nBolt, unitBags: p.nBag, rebarRows: rows,
      strFillFormula: `=(${f(L)}×${f(B)}−實體 ${f(As)})×(${H}−袋層 ${p.bagT})÷10⁶`, strConcFormula: `=實體 ${f(As)} cm²×${H}−∮3"孔 ${f(holes)} cm³（八角孔 ${f(Aoct)}、凹口 2×${f(Arec)}）`,
      strFormFormula1: `=(外周 ${f(perO)}＋孔周 ${f(perH)})×${H}`, strFormFormula2: `＋底面 ${f(As)} cm²`, As, Aoct, Arec, holes, perO, perH };
  };
  function model(R) {
    RR = R || {};
    const g = __n, p = { B_base: g('B_base', 120), W_out: g('W_out', 30), H_embed: g('H_embed', 180), H_exposed: g('H_exposed', 120), t_pc: g('t_pc', 5), N_layers: Math.max(1, Math.min(8, Math.round(g('N_layers', 3)))),
      N_plan_cols: Math.max(2, Math.min(10, Math.round(g('N_plan_cols', 3)))), t_slab: g('t_slab', 50), H_beam: g('H_beam', 70), W_in: g('W_in', 45), W_mid: g('W_mid', 105), L_slope: 0, W_straw: g('W_straw', 100),
      L_box: g('L_box', 120), B_box: g('B_box', 90), H_box: g('H_box', 60), T_box: g('T_box', 15), t_box: g('t_box', 10), c_box: g('c_box', 10), L_total_m: g('L_tot', 10),
      cov: g('cov', 5.5), pco: g('pco', 6), wpy: g('wpy', 76), drop: g('drop', 25), pvd: g('pvd', 8), pvo: g('pvo', 12), pcl: g('pcl', 5), pcr: g('pcr', 18), bagT: g('bagT', 16), bagH: g('bagH', 7.5),
      hr: g('hr', 3.8), bmT: g('bmT', 30), bmS: g('bmS', 300), bmD: g('bmD', 70), nBolt: g('nBolt', 2), nBag: g('nBag', 8), wD10: g('wD10', 0.56), sp: g('sp', 30), w16: g('w16', 1.56), w13: g('w13', 0.995), wsp: g('wsp', 150),
      rb1l: g('rb1l', 0.5), rb1n: g('rb1n', 14), rb2l: g('rb2l', 3.5), rb2n: g('rb2n', 5), rb3l: g('rb3l', 0.5), rb3n: g('rb3n', 8), rb4l: g('rb4l', 1.0), rb4n: g('rb4n', 2), rb5l: g('rb5l', 0.9), rb5n: g('rb5n', 2), __rng: RR.__rng || '' };
    p.H_wall = p.H_embed + p.H_exposed; p.W_platform = p.W_mid; p.L_slope = p.N_layers * p.B_box; p.B_top = +(p.W_out + (p.B_base - p.W_out) * p.t_slab / p.H_wall).toFixed(1);
    __P = p; const q = computeQuantities(p);
    // 斷面（cm，原工具座標 s＝1：牆背頂＝(0,0)，x 向河道，y 向下）
    const c45 = Math.SQRT1_2, Hw = p.H_wall, Bb = p.B_base, Wo = p.W_out, Wm = p.W_mid, Wi = p.W_in, ts = p.t_slab, fb = ts + p.drop, fl = -Wm - Wi, fr = fl + p.H_beam;
    const wall = [[0, Hw], [Bb, Hw], [Wo, 0], [0, 0]], pcw = [[-p.pco, Hw], [Bb + p.pco, Hw], [Bb + p.pco, Hw + p.t_pc], [-p.pco, Hw + p.t_pc]];
    const plat = [[fl, Wi], [-Wm, 0], [-Wm + p.pvo, 0], [-Wm + p.pvo, p.pvd], [0, p.pvd], [0, ts], [fr, ts], [fr, fb], [fl, fb]], pcs = [[fl - p.pcl, fb], [fr + p.pcr, fb], [fr + p.pcr, fb + p.t_pc], [fl - p.pcl, fb + p.t_pc]];
    const Hb = p.H_box, sB = [-Wm - Hb * c45, Hb * c45], sp = (d, k) => [sB[0] - c45 * d + c45 * k, sB[1] - c45 * d - c45 * k], boxes = [];
    for (let i = 0; i < p.N_layers; i++) boxes.push([sp(i * p.B_box, 0), sp((i + 1) * p.B_box, 0), sp((i + 1) * p.B_box, Hb), sp(i * p.B_box, Hb)]);
    const top = sp(p.L_slope, Hb), bankY = top[1] - 2 * p.bagH, bankX = top[0] - 28 + 4, yBed = Hw - p.H_embed, xBed = Wo + (Bb - Wo) * yBed / Hw;
    // 每公尺數量
    const A = P => __A(P) / 1e4, nBox = p.N_layers * 100 / p.L_box, hyp = Math.hypot;
    const wFront = hyp(Bb - Wo, Hw) / 100, cv = p.cov, nps = 100 / p.sp;
    const L16 = ((Hw - 2 * cv) + 5 + 8 + (Bb - cv - 1.25 * cv)) / 100 * nps, L13w = (hyp((Bb - 1.25 * cv) - (Wo - cv), Hw - 2 * cv) + 10) / 100 * nps + 20;
    const L13p = ((Wm - 6) + (Wm + Wi - 10) + hyp(Wi - 4, Wi + 4 - p.pvd - 5) + (fb - 5 - (Wi + 4)) + (p.H_beam - 11) + (fb - p.pvd - 10)) / 100 * nps + 6;
    const weep = (Wo + (Bb - Wo) * (p.wpy + 4) / Hw) / 100 * 2 * 100 / p.wsp;
    const beam = Math.max(0, -fr) * p.bmD / 1e4 * p.bmT / p.bmS;
    const Q = { beam, wall: A(wall), plat: A(plat) + beam, pc: A(pcw) + A(pcs), nBox, bconc: nBox * q.unitConc, bfill: nBox * q.unitFill, bform: nBox * q.unitForm, brebar: nBox * q.unitRebar, bolt: nBox * p.nBolt, bag: nBox * p.nBag,
      r16: L16 * p.w16, r13: (L13w + L13p) * p.w13, formS: wFront, formN: (Hw + (fb - Wi)) / 100, geo: (p.L_slope + 8) / 100, straw: p.W_straw / 100, paver: (Wm - p.pvo) / 100, weep };
    RR = null; return { p, q, Q, wall, pcw, plat, pcs, boxes, top, bankY, bankX, yBed, xBed, Hw, Bb, fl, fr, fb, L16, L13w, L13p };
  }
  function prims(m) {
    O = []; const p = m.p, q = m.q, s = 1.08, sc = 1 / s; __P = p;
    const b1 = drawSheet1(CTX, 40, 30, p, q, PAL), y2 = 30 + b1.height + 110;
    cadLine(CTX, 40, y2 - 55, 1380, y2 - 55, PAL.paperBorder || '#64748b', 1.5, [10, 6], 'SHEET_SEP');
    const b2 = drawSheet2(CTX, 40, y2, p, q, PAL);
    const Q = m.Q, f = (v, n) => (+v).toFixed(n === undefined ? 3 : n), ty = y2 + b2.height + 30, N = [
      `每公尺量測（單岸）：下部 RC 牆斷面 ${f(Q.wall)} m²（頂 ${p.W_out}、底 ${p.B_base}、高 ${m.Hw}；承台底處牆厚 ${p.B_top}）；平台與前趾斷面 ${f(Q.plat - Q.beam)} m²＋間格樑 ${f(Q.beam)} m³/m（${p.bmT}/${p.bmS}×寬 ${f(-m.fr, 0)}×版底下深 ${p.bmD}）；打底 ${f(Q.pc)} m²`,
      `RC 箱：每公尺 ${f(Q.nBox, 2)} 塊（${p.N_layers} 層 × 100/${p.L_box}）；單塊 混凝土 ${f(q.unitConc)} m³、回填 ${f(q.unitFill)} m³、鋼模 ${f(q.unitForm, 2)} m²、鋼筋 ${f(q.unitRebar, 2)} kg（依配筋表）`,
      `牆鋼筋（依圖配筋）：∮16@${p.sp} 主筋每支 ${f(m.L16 / (100 / p.sp), 2)} m；∮13 斜筋＋分布筋 ${f(m.L13w, 1)} m/m；平台 ∮13 ${f(m.L13p, 1)} m/m`,
      `造型模板＝牆前斜面 ${f(Q.formS)} m²/m；普通模板＝牆背直立＋前趾直立 ${f(Q.formN)} m²/m；織布＝斜坡 ${p.L_slope}＋8 cm；植草磚寬 ${p.W_mid - p.pvo} cm；PVC 排水管 @${p.wsp} cm`];
    N.forEach((t, i) => cadText(CTX, t, 60, ty + i * 20, 12, '#fde047', 'left', '600', 0, 'NOTE'));
    return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; return r; });
  }
  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
"""
SHIM = r"""
  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.5, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.6, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadCircle(ctx, cx, cy, r, color, width, fill, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || '0' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.05, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }
"""
out = f"""/* v6.3 預鑄RC箱複合式護岸（使用者原工具 b130106e 自動抽出；gen_rcb.py，勿手改） */
var TCO_T = window.TCO_T || (window.TCO_T = {{}});
TCO_T['rcb'] = (function () {{
  let RR = null, O = [];
  const EL = {{}}, CTX = new Proxy({{}}, {{ get: (t, k) => (k in t ? t[k] : () => ({{ width: 0 }})), set: (t, k, v) => {{ t[k] = v; return true; }} }});
  const el = id => EL[id] || (EL[id] = {{ value: '', textContent: '', innerHTML: '', className: '', style: {{}}, classList: {{ add() {{}}, remove() {{}} }}, addEventListener() {{}} }});
  const document = {{ getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({{ click() {{}}, style: {{}} }}), body: {{ appendChild() {{}}, removeChild() {{}} }} }};
  const window = {{ addEventListener() {{}}, devicePixelRatio: 1 }};
{script}
{JS}
{SHIM}
  return {{ model, prims }};
}})();
"""
open('/home/claude/tcv4/ormod6.js', 'w', encoding='utf8').write(out)
print('ormod6.js', len(out))
