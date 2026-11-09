# v6.3 #1固床工（d8b90023，cadLine/cadPoly 框架，螢幕座標 y 向下）→ TCO_S['n1']
# 以 s=1（1 cm＝1 單位）呼叫原工具的 drawFrontView/drawPlanView/drawSideView，圖元 y 取負號 → 世界座標 cm
import re, json
ATT = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/'
h = open(ATT + 'd8b90023-______.html', encoding='utf8').read()
script = h[h.rindex('<script>') + 8:h.rindex('</script>')]
SUBS = [
  ('const stepX = 16 * s;', 'const stepX = p.stx * s;'), ('const stepY = 24 * s;', 'const stepY = p.sty * s;'),
  ('const cov = 5 * s;', 'const cov = p.cov * s;'), ('const rbLeftX = xBotFront + cov * 1.4;', 'const rbLeftX = xBotFront + p.lge * s;'),
  ('const hkW = 4.5 * s, hkL = 9 * s;', 'const hkW = p.hkw * s, hkL = p.hkl * s;'),
  ('for (let i = 1; i <= 3; i++) {\n        const px = rbLeftX + (i / 4) * (rbX - rbLeftX);', 'for (let i = 1; i <= p.nLeg; i++) {\n        const px = rbLeftX + (i / (p.nLeg + 1)) * (rbX - rbLeftX);'),
  ('let showGhost = true;', 'let showGhost = false;'),
]
for o, n in SUBS:
    assert o in script, o; script = script.replace(o, n)
DEF = {m.group(1): m.group(2) for m in re.finditer(r'<input type="number" id="(inp_[^"]+)" value="([^"]*)"', h)}
GT = ['1. 正視與俯視橫向尺寸（左右獨立，以溢流口中心線為界）', '2. 側視斷面高度與厚度', '3. 配筋與細部（原圖鋼筋 ∮16／∮13）']
PR = [
 ('inp_W_wing_L', '左側翼牆頂寬 W_wing_L (cm)', 10, 40, 1500, 0), ('inp_W_wing_R', '右側翼牆頂寬 W_wing_R (cm)', 10, 40, 1500, 0),
 ('inp_W_notch', '溢流口底寬 W_notch (cm)', 10, 80, 2000, 0), ('inp_B_bot', '固床工底寬 B_bot (cm)', 10, 100, 3000, 0),
 ('inp_D_wing_L', '左側翼牆折深 D_wing_L (cm)', 2, 25, 300, 0), ('inp_D_wing_R', '右側翼牆折深 D_wing_R (cm)', 2, 25, 300, 0),
 ('inp_m_notch', '溢流口邊坡 1:m_n', 0.05, 0.05, 2, 0),
 ('inp_H_up', '上部溢流深 H_up (cm)', 10, 40, 400, 1), ('inp_H_low', '下部基礎深 H_low (cm)', 10, 60, 500, 1),
 ('inp_T_top', '頂部冠寬 T_top (cm)', 5, 20, 150, 1), ('inp_m_front', '前坡面 1:m_f', 0.05, 0.05, 1.5, 1),
 ('inp_rebar_sp', '主筋與橫筋間距 (cm)', 5, 10, 60, 2),
]
PR0 = [{'k': 'p_LReq', 'nm': '左右兩側', 'def': '1', 'opt': [['1', '左右相同（右側跟左側）'], ['0', '左右分開']], 'g': 0}]; DEF['p_LReq'] = '1'
PR = PR0 + [{'k': k, 'nm': nm, 'def': DEF[k], 'st': str(st), 'min': str(mn), 'max': str(mx), 'g': g} for k, nm, st, mn, mx, g in PR]
EXTRA = [('p_cov', '鋼筋保護層 (cm)', '5', 0.5, 3, 15), ('p_lge', '底腳筋前端保護層 (cm)', '7', 0.5, 3, 30), ('p_hkw', '主筋頂部彎鉤寬 (cm)', '4.5', 0.5, 0, 30),
         ('p_hkl', '主筋頂部彎鉤長 (cm)', '9', 0.5, 0, 50), ('p_w16', '∮16 單位重 (kg/m)', '1.56', 0.01, 0.5, 5), ('p_w13', '∮13 單位重 (kg/m)', '0.995', 0.005, 0.3, 5),
         ('p_stx', '溢流口下游緣線外移 (cm)', '16', 1, 0, 100), ('p_sty', '溢流口下游緣線下移 (cm)', '24', 1, 0, 150)]
for k, nm, d, st, mn, mx in EXTRA:
    PR.append({'k': k, 'nm': nm, 'def': d, 'st': str(st), 'min': str(mn), 'max': str(mx), 'g': 2}); DEF[k] = d
JS = r"""
  const __num = (id, d) => { const v = parseFloat(el(id).value); return Number.isFinite(v) ? v : d; };
  const __P1 = getParams;
  getParams = function () { if (String(el('p_LReq').value) !== '0') { const L = el('inp_W_wing_L').value, D = el('inp_D_wing_L').value; RR = Object.assign({}, RR, { inp_W_wing_R: L, inp_D_wing_R: D }); }
    const p = __P1(); p.N_units = 1; p.title_tag = RR && RR.__tag ? String(RR.__tag) : '#1固床工';
    Object.assign(p, { cov: __num('p_cov', 5), lge: __num('p_lge', 7), hkw: __num('p_hkw', 4.5), hkl: __num('p_hkl', 9), w16: __num('p_w16', 1.56), w13: __num('p_w13', 0.995), stx: __num('p_stx', 16), sty: __num('p_sty', 24) });
    p.nLeg = Math.max(1, Math.round((p.T_bot - p.cov - p.lge) / p.rebar_sp) - 1); p.nVd = Math.max(6, Math.round(p.H_total / p.rebar_sp) - 1) + 1; return p; };
  function __geo1(p) {   // 依三視圖幾何（cm）：x＝溢流口中心線起算（右岸＋），z＝自頂向下
    const Wt = p.W_top_notch, xLo = -(p.W_wing_L + Wt / 2), xHi = p.W_wing_R + Wt / 2, bL = -p.B_bot / 2, bR = p.B_bot / 2, Hu = p.H_up, Ht = p.H_total, Hl = p.H_low;
    const T = z => p.T_top + (p.T_bot - p.T_top) * z / Ht, hn = z => Wt / 2 - p.dx_notch * z / Hu;
    const Tp = x => x < bL ? p.D_wing_L + (p.T_bot - p.D_wing_L) * (x - xLo) / (bL - xLo) : x > bR ? p.D_wing_R + (p.T_bot - p.D_wing_R) * (xHi - x) / (xHi - bR) : Infinity;
    const dTp = x => x < bL ? (p.T_bot - p.D_wing_L) / (bL - xLo) : x > bR ? (p.T_bot - p.D_wing_R) / (xHi - bR) : 0;
    const xl = z => z <= Hu ? xLo : xLo + (bL - xLo) * (z - Hu) / Hl, xr = z => z <= Hu ? xHi : xHi + (bR - xHi) * (z - Hu) / Hl;
    const inside = (x, z) => x >= xl(z) && x <= xr(z) && !(z < Hu && Math.abs(x) < hn(z));
    const th = (x, z) => Math.min(T(z), Tp(x)), kS = Math.hypot(1, (p.T_bot - p.T_top) / Ht);
    const G = { V: 0, Af: 0, Ads: 0, xLo, xHi, T, Tp, kS };
    const d = 1, nx = Math.ceil((xHi - xLo) / d), nz = Math.ceil(Ht / d);
    for (let j = 0; j < nz; j++) { const z = (j + 0.5) * Ht / nz, dz = Ht / nz;
      for (let i = 0; i < nx; i++) { const x = xLo + (i + 0.5) * (xHi - xLo) / nx, dx = (xHi - xLo) / nx; if (!inside(x, z)) continue;
        const a = dx * dz, t = th(x, z); G.V += a * t; G.Af += a; G.Ads += a * (T(z) <= Tp(x) ? kS : Math.hypot(1, dTp(x))); } }
    // 兩端模板：上段翼端直立面＋下段斜邊（底面不計）
    let Ae = 0; const n = 200;
    [[xLo, bL, 1], [xHi, bR, -1]].forEach(([xo, xb]) => { for (let k = 0; k < n; k++) { const z = (k + 0.5) * Hu / n; Ae += th(xo, z) * Hu / n; }
      const L = Math.hypot(xb - xo, Hl); for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, x = xo + (xb - xo) * f, z = Hu + Hl * f; Ae += th(x, z) * L / n; } });
    G.Ae = Ae;
    // 鋼筋（依側視圖配筋型式，沿正視圖寬度每 sp 一支）
    const c = p.cov, sp = p.rebar_sp; let n16 = 0, L16 = 0;
    for (let x = xLo + c; x <= xHi - c + 1e-6; x += sp) {
      const ax = Math.abs(x), zt = ax <= p.W_notch / 2 ? Hu : ax < Wt / 2 ? (Wt / 2 - ax) * Hu / p.dx_notch : 0;
      const zb = x >= bL && x <= bR ? Ht : x < bL ? Hu + Hl * (x - xLo) / (bL - xLo) : Hu + Hl * (xHi - x) / (xHi - bR);
      const lv = zb - zt - 2 * c; if (lv <= 0) continue; const leg = Math.max(0, th(x, zb) - c - p.lge); n16++; L16 += lv + leg + p.hkw + p.hkl; }
    let L13 = 0; const nV = p.nVd;
    for (let k = 0; k < nV; k++) { const z = c + 12 + k * (Ht - 2 * c - 18) / Math.max(1, nV - 1); let w = xr(z) - xl(z) - 2 * c; if (z < Hu) w -= 2 * hn(z) + 2 * c; L13 += Math.max(0, w); }
    L13 += p.nLeg * Math.max(0, p.B_bot - 2 * c);
    Object.assign(G, { n16, L16, L13, nV }); return G;
  }
  function computeQuantities(p) {
    const G = __geo1(p), f = (v, n) => (+v).toFixed(n === undefined ? 2 : n), rows = [];
    rows.push({ no: '1', name: '210kgf/cm²混凝土', unit: 'm³', formula: `∫∫厚度 dA（厚＝min(側視, 俯視)，見註記）`, qty: +(G.V / 1e6).toFixed(3), note: `冠寬 ${p.T_top}→中 ${p.T_mid}→底 ${p.T_bot} cm` });
    rows.push({ no: '2', name: '造型模板（下游斜坡面）', unit: 'm²', formula: `正視面積 × √(1+m²)（翼牆折角處依俯視斜面）`, qty: +(G.Ads / 1e4).toFixed(2), note: `前坡 1:${p.m_front}` });
    rows.push({ no: '3', name: '軀體模板（上游直立面）', unit: 'm²', formula: `正視圖輪廓面積 ${f(G.Af / 1e4, 3)} m²`, qty: +(G.Af / 1e4).toFixed(2), note: '' });
    rows.push({ no: '4', name: '簡易模板（兩側翼端面）', unit: 'm²', formula: `翼端直立面＋下段斜邊 × 該處厚度（兩側）`, qty: +(G.Ae / 1e4).toFixed(2), note: `折深 左${p.D_wing_L}／右${p.D_wing_R}` });
    rows.push({ no: '5', name: `鋼筋 ∮16@${p.rebar_sp}cm（主筋 L 型）`, unit: 'kg', formula: `${G.n16} 支 共 ${f(G.L16 / 100, 1)} m × ${p.w16} kg/m`, qty: +(G.L16 / 100 * p.w16).toFixed(1), note: '依原圖配筋表' });
    rows.push({ no: '6', name: `鋼筋 ∮13@${p.rebar_sp}cm（橫向分布筋）`, unit: 'kg', formula: `立面 ${G.nV} 列＋底腳 ${p.nLeg} 列 共 ${f(G.L13 / 100, 1)} m × ${p.w13} kg/m`, qty: +(G.L13 / 100 * p.w13).toFixed(1), note: '依原圖配筋表' });
    return rows;
  }
  function updateSidebarUI() { }
  const PAL = getPalette();
  function __draw(p) {
    const rows = computeQuantities(p), G = __geo1(p), f = (v, n) => (+v).toFixed(n === undefined ? 2 : n);
    const bF = drawFrontView(CTX, 0, 0, 1, p, PAL), planTop = bF.bottomY + 38; drawPlanView(CTX, 0, planTop, 1, p, PAL);
    const sideX = bF.xRightOuter + Math.max(155, p.W_total * 0.22); drawSideView(CTX, sideX, 0, 1, p, PAL);
    // 補標註（量測值）
    cadText(CTX, `正視面積 ${f(G.Af / 1e4, 3)} m²；體積 ${f(G.V / 1e6, 3)} m³`, 0, (bF.yMid + bF.yBot) / 2 + 30, 12, '#fde047', 'center', '600', 0, 'DIM_TEXT');
    cadText(CTX, `溢流口頂寬 ${p.W_top_notch}＝${p.W_notch}＋2×${p.dx_notch}`, 0, bF.yTop - 40, 12, '#fde047', 'center', '600', 0, 'DIM_TEXT');
    const xB = sideX + p.T_bot + 75; cadText(CTX, `下游斜面長 ${f(Math.hypot(p.H_total, p.T_bot - p.T_top), 1)}`, xB - p.T_bot - 20, p.H_total + 45 + 50, 12, '#fde047', 'right', '600', 0, 'DIM_TEXT');
    // 數量表
    const tx = sideX - 30, ty = Math.max(planTop + 35, p.H_total + 45 + 120), cw = [190, 330, 70, 45], rh = 24, H = ['工項名稱', '計算式（依圖面幾何）', '數量', '單位'];
    cadText(CTX, `${p.title_tag}每座工程數量計算式表`, tx, ty - 12, 13.5, PAL.textMain, 'left', '700', 0, 'TABLE_TEXT');
    const tw = cw.reduce((a, b) => a + b, 0), all = [H].concat(rows.map(r => [r.name, r.formula, String(r.qty), r.unit]));
    cadPoly(CTX, [[tx, ty], [tx + tw, ty], [tx + tw, ty + all.length * rh], [tx, ty + all.length * rh]], PAL.primaryLine, 1.4, true, null, [], 'QTY_TABLE');
    all.forEach((r, i) => { if (i) cadLine(CTX, tx, ty + i * rh, tx + tw, ty + i * rh, PAL.tableBorder, 0.95, [], 'QTY_TABLE'); let x = tx; r.forEach((v, j) => { cadText(CTX, v, j < 2 && i ? x + 6 : x + cw[j] / 2, ty + (i + 0.5) * rh, i ? 10 : 11.5, i ? (j === 2 ? PAL.dimText : PAL.textSub) : PAL.textMain, j < 2 && i ? 'left' : 'center', '600', 0, 'TABLE_TEXT'); x += cw[j]; }); });
    let x = tx; cw.slice(0, -1).forEach(w => { x += w; cadLine(CTX, x, ty, x, ty + all.length * rh, PAL.tableBorder, 0.95, [], 'QTY_TABLE'); });
    const N = [`混凝土＝正視輪廓（面積 ${f(G.Af / 1e4, 3)} m²）內逐點厚度積分`, `厚度取側視（${p.T_top}→${p.T_bot}，1:${p.m_front}）與俯視翼牆折深（左${p.D_wing_L}／右${p.D_wing_R}→${p.T_bot}）之小值`,
      `主筋 ∮16：沿正視寬每 ${p.rebar_sp} cm 一支，長＝該處高度−2×保護層 ${p.cov}＋底腳＋彎鉤 ${p.hkw}+${p.hkl}`, `分布筋 ∮13：立面 ${G.nV} 列（扣溢流口）＋底腳 ${p.nLeg} 列`];
    N.forEach((s, i) => cadText(CTX, '・' + s, tx, ty + all.length * rh + 18 + i * 17, 10, '#fde047', 'left', '500', 0, 'TABLE_TEXT'));
    return { frontYTop: bF.yTop, frontYMid: bF.yMid, frontYBot: bF.yBot, xLo: bF.xLeftOuter, xHi: bF.xRightOuter, planY0: planTop + 42, sideX, xBack: xB, sideYTop: 45 };
  }
"""
SHIM = r"""
  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.5, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.6, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadCircle(ctx, cx, cy, r, color, width, fill, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || 'REBAR' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.1, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }
  function cadArrow(ctx, x1, y1, x2, y2, color, width) { cadLine(ctx, x1, y1, x2, y2, color, width, [], 'LEADER'); const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux; O.push({ k: 'P', p: [[x2, -y2], [x2 - ux * 8 + nx * 2.4, -(y2 - uy * 8 + ny * 2.4)], [x2 - ux * 8 - nx * 2.4, -(y2 - uy * 8 - ny * 2.4)]], c: color, w: 1, f: color, cl: true, d: [], ly: 'LEADER' }); }
"""
out = f"""/* v6.3 #1固床工（使用者原工具 d8b90023 自動抽出；gen_n1.py） */
TCO_S['n1'] = (function () {{
  const DEF = {json.dumps(DEF, ensure_ascii=False)};
  let RR = null, O = [];
  const EL = {{}}, CTX = new Proxy({{}}, {{ get: (t, k) => (k in t ? t[k] : () => ({{ width: 0 }})), set: (t, k, v) => {{ t[k] = v; return true; }} }});
  const el = id => EL[id] || (EL[id] = {{ get value() {{ const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }}, set value(v) {{}}, textContent: '', innerHTML: '', className: '', style: {{}}, classList: {{ add() {{}}, remove() {{}} }}, addEventListener() {{}} }});
  const document = {{ getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({{ click() {{}}, style: {{}} }}), body: {{ appendChild() {{}}, removeChild() {{}} }} }};
  const window = {{ addEventListener() {{}}, devicePixelRatio: 1 }};
{script}
{JS}
{SHIM}
  return {{
    DEF, PR: {json.dumps(PR, ensure_ascii=False)}, GT: {json.dumps(GT, ensure_ascii=False)}, title: '#1固床工標準圖',
    run(R, opt) {{
      RR = R || {{}}; O = [];
      try {{ const P = getParams(), rows = computeQuantities(P), L = opt && opt.draw ? __draw(P) : null;
        const checks = [{{ ok: P.T_top >= 20, text: `頂部冠寬 T_top=${{P.T_top}} cm` }}, {{ ok: P.B_bot <= P.W_total, text: `底寬 B_bot ${{P.B_bot}} ≦ 頂全寬 ${{P.W_total}} cm` }}, {{ ok: P.W_notch >= 80, text: `溢流口底寬 ${{P.W_notch}} cm、頂寬 ${{P.W_top_notch}} cm` }}];
        return {{ P, rows, checks, O, L }}; }} finally {{ RR = null; }}
    }}
  }};
}})();
"""
open('/home/claude/tcv4/ormod3n1.js', 'w', encoding='utf8').write(out)
print('ormod3n1.js', len(out))
