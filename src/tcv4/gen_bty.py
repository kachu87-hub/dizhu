# v6.3 B型生態複合式砌石護岸（c4dc930e，cadLine 框架）→ TCO_T['bty']：model(R)／prims(m)
# 原工具幾何錯誤修正（標註與幾何不一致）：B_base＝牆腳至背面總寬；乾砌石坡趾距牆腳 W_berm_tot（125＝110＋15）
import re, json
ATT = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/'
h = open(ATT + 'c4dc930e-_________.html', encoding='utf8').read()
script = h[h.rindex('<script>') + 8:h.rindex('</script>')]
SUBS = [
  ('let showGhost = true;', 'let showGhost = false;'),
  ('const D_boulder = D_bed * 0.54;', 'const D_boulder = D_bed * p.kbd;'),
  ('const xBack_L = xToeBot_L + W_st_low - B_L;', 'const xBack_L = xToeBot_L - B_L;'),
  ('const xBack_R = xToeBot_R - W_st_low + B_R;', 'const xBack_R = xToeBot_R + B_R;'),
  ('[xStoneBackTop_L - W_lip, yBerm],', '[xToeBot_L - W_berm, yBerm],'),
  ('[xStoneBackTop_R + W_lip, yBerm],', '[xToeBot_R + W_berm, yBerm],'),
  ('[xToeBot_L - 12 * s, yBedConcTop],\n        [xToeBot_R + 12 * s, yBedConcTop],', '[xToeBot_L - p.m_low * D_conc, yBedConcTop],\n        [xToeBot_R + p.m_low * D_conc, yBedConcTop],'),
  ('const dryThick = 52 * s;', 'const dryThick = p.dt * s;'),
  ('const xDryToeOut_L = xStoneBackTop_L - W_lip;', 'const xDryToeOut_L = xToeBot_L - W_berm;'),
  ('const xDryToeOut_R = xStoneBackTop_R + W_lip;', 'const xDryToeOut_R = xToeBot_R + W_berm;'),
  ('xDryTopOut_L + ndLx * (dryThick * 0.65), yDryTopOut_L + ndLy * (dryThick * 0.65),', 'xDryTopOut_L + ndLx * (dryThick * p.dtr), yDryTopOut_L + ndLy * (dryThick * p.dtr),'),
  ('xDryTopOut_R + ndRx * (dryThick * 0.65), yDryTopOut_R + ndRy * (dryThick * 0.65),', 'xDryTopOut_R + ndRx * (dryThick * p.dtr), yDryTopOut_R + ndRy * (dryThick * p.dtr),'),
  ('const taper = 1.0 - tm * 0.28; // Slight natural taper towards crest as in original drawing', 'const taper = 1.0 - tm * (1 - p.dtr);'),
  ('const taper = 1.0 - tm * 0.28;\n', 'const taper = 1.0 - tm * (1 - p.dtr);\n'),
  ("cadDim(ctx, xFaceTop_R, yBerm, xBack_R, yBerm, -28, `${p.W_berm_tot}`, pal, 11);", "cadDim(ctx, xToeBot_R, yBerm, xToeBot_R + W_berm, yBerm, -28, `${p.W_berm_tot}`, pal, 11);"),
  ("cadDim(ctx, xFaceTop_R, yBerm, xFaceTop_R + W_lip, yBerm, -12, `${p.W_berm_lip}`, pal, 10);", "cadDim(ctx, xToeBot_R, yBerm, xStoneBackTop_R, yBerm, -12, `${+(p.W_stone_low + p.H_low * p.m_low).toFixed(1)}`, pal, 10);"),
  ("cadDim(ctx, xFaceTop_R + W_lip, yBerm, xBack_R, yBerm, -12, `${p.W_berm_slope}`, pal, 10.5);", "cadDim(ctx, xStoneBackTop_R, yBerm, xToeBot_R + W_berm, yBerm, -12, `${+p.W_berm_lip.toFixed(1)}`, pal, 10.5);"),
  ("cadDim(ctx, xStoneBackBot_R, yBase, xBack_R, yBase, 22, `${p.B_base_R}`, pal, 11.5);", "cadDim(ctx, xToeBot_R, yBase, xBack_R, yBase, 22, `${p.B_base_R}`, pal, 11.5);"),
  ('const s = 0.52; // Scale for Plan & Elevation views', 'const s = 0.46;'),
  ('const wCrestLow = p.W_stone_low * s;        // 50 * s', 'const wCrestLow = (p.W_berm_tot - p.H_low * p.m_low) * s;'),
  ("`${Math.round(p.W_stone_low + p.H_low * p.m_low)}`", "`${p.W_berm_tot}`"),
  ('const stakePitch = 38 * s;', 'const stakePitch = p.stake_sp * s;'),
  ("""        ctx.save();
        ctx.strokeStyle = pal.stakeLine;
        ctx.fillStyle = pal.stakeFill;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(sx, yStakeLine - 5, 5.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();""", "        cadCircle(ctx, sx, yStakeLine - 5, 5.2, pal.stakeLine, 1.2, pal.stakeFill, 'WOOD_STAKE');"),
  ('const yElevConcTop = yElevBase - hBedElev * 0.45;', 'const yElevConcTop = yElevBase - hBedElev * (1 - p.kbd);'),
]
for o, n in SUBS:
    assert o in script, o; script = script.replace(o, n)
JS = r"""
  const PAL = getPalette();
  function cadCircle(ctx, cx, cy, r, color, width, fill, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || '0' }); }
  const __n = (k, d) => { const v = parseFloat(RR ? RR[k] : undefined); return Number.isFinite(v) ? v : d; };
  function model(R) {
    RR = R || {};
    const H_low = Math.max(80, __n('H_low', 200)), D_bed = Math.max(20, __n('D_bed_sub', 50)), Hm = __n('H', 4.5), H_up = Math.max(30, Math.round((Hm * 100 - H_low + D_bed) * 10) / 10);
    const m_up = Math.max(0.3, __n('m_up', 1)), m_low = Math.max(0.05, __n('m_low', 0.3)), W_st = Math.max(20, __n('W_stone_low', 50)), dxl = H_low * m_low, dxu = H_up * m_up;
    const W_berm = Math.max(dxl + W_st, __n('W_berm_tot', 125)), B = Math.max(W_berm + 1, __n('B_base', 220)), Hv = Math.min(H_low - 10, Math.max(20, __n('H_back_vert', 140)));
    const kbd = Math.min(0.95, Math.max(0.05, __n('kbd', 0.54))), dt = __n('dt', 52), dtr = __n('dtr', 0.65), e = Math.max(0, __n('e', 3.8)) * 100;
    const p = { H_up, H_low, H_back_vert: Hv, D_bed_sub: D_bed, m_up, m_low, B_base_L: B, B_base_R: B, W_stone_low: W_st, W_berm_tot: W_berm, W_bed: Math.max(200, Math.min(1600, 2 * e)), L_total_m: __n('L_tot', 10),
      L_draw_cm: Math.max(200, __n('L_draw', 600)), N_bay: Math.max(1, Math.min(10, Math.round(__n('N_bay', 3)))), L_stake: __n('L_stake', 100), kbd, dt, dtr, stake_sp: __n('stake_sp', 38) };
    p.H_shoulder = H_low - Hv; p.H_total_cm = H_up + H_low; p.H_total_m = +(p.H_total_cm / 100).toFixed(2); p.W_berm_lip = W_berm - dxl - W_st; p.W_berm_slope = B - W_berm;
    p.nDryStonesPerSide = Math.max(3, Math.round(H_up * Math.hypot(1, m_up) / __n('sd_dry', 47))); p.nWetStonesPerSide = Math.max(2, Math.round(H_low * Math.hypot(1, m_low) / __n('sd_wet', 35))); p.nBedBoulders = Math.max(5, Math.round(p.W_bed / __n('sd_bed', 44)));
    // 單側斷面（cm）：x＝自牆腳底往岸側，z＝自牆底向上
    const band = [[0, 0], [W_st, 0], [dxl + W_st, H_low], [dxl, H_low]], conc = [[W_st, 0], [B, 0], [B, Hv], [W_berm, H_low], [dxl + W_st, H_low]];
    const kS = Math.hypot(1, m_up), t0 = dt * kS, t1 = dt * dtr * kS, dry = [[W_berm, H_low], [W_berm + dxu, H_low + H_up], [W_berm + dxu + t1, H_low + H_up], [W_berm + t0, H_low]];
    const Dc = D_bed * (1 - kbd), slab = [[-e, 0], [0, 0], [m_low * Dc, Dc], [-e, Dc]], rip = [[-e, Dc], [m_low * Dc, Dc], [m_low * D_bed, D_bed], [-e, D_bed]];
    const A = q => __A(q) / 1e4, bed = String(__n('bed', 1)) !== '0';
    const Q = { conc: A(conc), form: Hv / 100, pitch: __n('q_pitch', 0.8), dry: H_up * kS / 100, wet: H_low * Math.hypot(1, m_low) / 100, eco: 1, slab: bed ? A(slab) : 0, rip: bed ? A(rip) : 0, Acb: A(band), Adry: A(dry) };
    Object.assign(p, { q_concrete: Q.conc, q_formwork: Q.form, q_pitched_stone: Q.pitch, q_dry_stone: Q.dry, q_wet_stone: Q.wet, q_eco_stake: Q.eco });
    RR = null; return { p, band, conc, dry, slab, rip, Q, e, dxl, dxu, W_berm, B, Hv, H_low, H_up, D_bed, Dc, m_low, m_up, bed, t0, t1 };
  }
  function prims(m) {
    O = []; const p = m.p, s = 0.46, sc = 1 / s;
    const bSec = drawCrossSectionView(CTX, 640, 15, s, p, PAL), lx = Math.max(30, bSec.leftX), rx = bSec.rightX + 35;
    drawSectionTables(CTX, lx, bSec.bottomY + 20, rx, 110, p, PAL);
    const y0 = bSec.bottomY + 20 + 80 + 70; cadLine(CTX, 30, y0 - 25, rx + 240, y0 - 25, PAL.secondaryLine, 1.1, [10, 6], 'SHEET_DIV');
    const bP = drawPlanAndElevationViews(CTX, 210, y0, p, PAL);
    // 補標註：量測值（斷面積、斜長）
    const Q = m.Q, f = (v, n) => (+v).toFixed(n === undefined ? 2 : n), ty = y0 + 20, nx = bP.rightX + 20;
    const N = [`本系統依本段參數繪製（兩岸同尺寸）；斷面量測（單側，每公尺）：`, `背側混凝土斷面積 ${f(Q.conc, 3)} m²（扣臨水面 ${p.W_stone_low} cm 混凝土砌石帶 ${f(Q.Acb, 3)} m²）`,
      `乾砌石斜長 ${f(Q.dry, 3)} m＝${f(p.H_up / 100)}×√(1+${p.m_up}²)；混凝土砌石斜長 ${f(Q.wet, 3)} m＝${f(p.H_low / 100)}×√(1+${p.m_low}²)；背側模板＝直立段 ${f(m.Hv / 100)} m`,
      `乾砌石斷面積 ${f(Q.Adry, 3)} m²（厚 ${p.dt}→${f(p.dt * p.dtr, 1)} cm）；乾砌排石 ${f(Q.pitch)} m²/m 為原圖數量表值（圖面未繪位置）`,
      `渠底拋石（厚 ${f(m.D_bed - m.Dc, 1)} cm）與 210 混凝土底版（厚 ${f(m.Dc, 1)} cm）：圖面照原圖示意，不計入護岸數量（另計）`];
    N.forEach((t, i) => cadText(CTX, t, nx, ty + i * 20, 11.5, '#fde047', 'left', '600', 0, 'NOTE'));
    return O.map(o => { const q = Object.assign({}, o); if (q.p) q.p = q.p.map(([x, y]) => [x * sc, y * sc]); if (q.x !== undefined) { q.x *= sc; q.y *= sc; } if (q.r) q.r *= sc; if (q.h) q.h *= sc; return q; });
  }
  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
"""
SHIM = r"""
  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.3, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.5, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.05, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }
"""
out = f"""/* v6.3 B型生態複合式砌石護岸（使用者原工具 c4dc930e 自動抽出；gen_bty.py，勿手改） */
var TCO_T = window.TCO_T || (window.TCO_T = {{}});
TCO_T['bty'] = (function () {{
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
open('/home/claude/tcv4/ormod5.js', 'w', encoding='utf8').write(out)
print('ormod5.js', len(out))
