# v6.3i 護岸原圖移植：混凝土格籠(框)護岸 0416-1（b1bfd32e）、展開式蜂巢圍束網格緩坡護岸 0414-1（33144323）→ ormodE.js
# TCO_T[key].model(R)：本系統幾何（cm）與每公尺數量（全部由斷面幾何量測）；prims(m)：原工具繪圖（數量表以本系統幾何覆寫）
ATT = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/'
SHIM = r"""
  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.3, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.5, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadCircle(ctx, cx, cy, r, color, width, fill, dash, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || '0' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.05, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }
"""
HEAD = r"""
  let RR = null, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };
"""
COMMON = r"""
  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  const __n = (k, d) => { const v = parseFloat(RR ? RR[k] : undefined); return Number.isFinite(v) ? v : d; };
  function setInputs(R, keys) { keys.forEach(k => { if (R && R[k] !== undefined && R[k] !== null && R[k] !== '') el('inp_' + k).value = String(R[k]); else el('inp_' + k).value = ''; }); }
  function sheet(fn, s, m) { O = []; const PAL = getPalette(), p = Object.assign({}, m.p, m.OV); fn(p, PAL); const sc = 1 / s; return O.map(o => { const q = Object.assign({}, o); if (q.p) q.p = q.p.map(([x, y]) => [x * sc, y * sc]); if (q.x !== undefined) { q.x *= sc; q.y *= sc; } if (q.r) q.r *= sc; if (q.h) q.h *= sc; return q; }); }
"""
# ---------------- 混凝土格籠(框)護岸 ----------------
h = open(ATT + 'b1bfd32e-__________.html', encoding='utf8').read()
crib = h[h.rindex('<script>') + 8:h.rindex('</script>')]
CRIB_SUBS = [
  ('let showGhost = true;', 'let showGhost = false;'),
  ('      const wLug = 25;                  // 25 cm rear lug width\n      const wFront = 36;                // 36 cm front toe ledge\n      const wKeyBot = 30;               // 30 cm shear key bottom width\n      const wKeySlope = 20;             // 20 cm shear key sloped transition width',
   '      const wLug = p.wLug, wFront = p.wFront, wKeyBot = p.wKeyBot, wKeySlope = p.wKeySlope;'),
  ('const wallPitch_cm = (p.H_cm - 20) / p.N_tiers;', 'const wallPitch_cm = (p.H_cm - p.hBot) / p.N_tiers;'),
  ('const totalV_cm = 20 + p.N_tiers * wallPitch_cm;', 'const totalV_cm = p.hBot + p.N_tiers * wallPitch_cm;'),
  ('const hNotch = 5.5;', 'const hNotch = p.hNotch;'),
  ('const hStr = 19;', 'const hStr = p.hStrD;'),
  ('const [topHdrRightX, topHdrRightY] = pt(uHdrR + 38, vTopWeb);', 'const [topHdrRightX, topHdrRightY] = pt(uHdrR + p.wCrest, vTopWeb);'),
  ('const yStreambed = baseBotLeftY - p.df_cm * s * 0.72;', 'const yStreambed = baseBotLeftY - p.df_cm * s * p.kdf;'),
  ("cadDim(ctx, pBaseTL_x, pBaseTL_y, pToeR_x, pToeR_y, -18, `36`, pal, 10);", "cadDim(ctx, pBaseTL_x, pBaseTL_y, pToeR_x, pToeR_y, -18, `${wFront}`, pal, 10);"),
  ("cadDim(ctx, pBaseBL_x, pBaseBL_y, pKey1_x, pKey1_y, 22, `30`, pal, 10);", "cadDim(ctx, pBaseBL_x, pBaseBL_y, pKey1_x, pKey1_y, 22, `${wKeyBot}`, pal, 10);"),
  ("cadDim(ctx, pKey1_x, pKey1_y, pKey2_x, pKey2_y, 22, `20`, pal, 10);", "cadDim(ctx, pKey1_x, pKey1_y, pKey2_x, pKey2_y, 22, `${wKeySlope}`, pal, 10);"),
  ("cadDim(ctx, pLugTL_x, pLugTL_y, pLugTR_x, pLugTR_y, -18, `25`, pal, 10);", "cadDim(ctx, pLugTL_x, pLugTL_y, pLugTR_x, pLugTR_y, -18, `${wLug}`, pal, 10);"),
]
for o, n in CRIB_SUBS:
    assert o in crib, ('crib', o[:60]); crib = crib.replace(o, n)
CRIB_JS = r"""
  const KEYS = ['N_tiers', 'H_cm', 'df_cm', 'm_tilt', 'B_cm', 'B1_cm', 'h1_cm', 'h2_cm', 'h3_cm', 'b1_cm', 'b2_cm', 'b3_cm', 'h_hdr', 'h_str', 'N_bay', 'L_tot_m'];
  function model(R) {
    RR = R || {}; setInputs(R, KEYS);
    try {
      const p = getParams(); ['wLug', 'wFront', 'wKeyBot', 'wKeySlope', 'hBot', 'hNotch', 'hStrD', 'wCrest', 'kdf', 'kgHdr', 'kgStr', 'kgBase'].forEach(k => { p[k] = __n(k, { wLug: 25, wFront: 36, wKeyBot: 30, wKeySlope: 20, hBot: 20, hNotch: 5.5, hStrD: 19, wCrest: 38, kdf: 1, kgHdr: 8.2, kgStr: 7.8, kgBase: 10.88 }[k]); });
      const th = Math.atan(1 / p.m_tilt), cT = Math.cos(th), sT = Math.sin(th), X = (u, v) => [u * cT + v * sT, v * cT - u * sT], P = q => q.map(([u, v]) => X(u, v));
      const B = p.B_cm, h1 = p.h1_cm, h2 = p.h2_cm, hLug = Math.max(20, p.h3_cm - h1), uLugL = B - p.wLug;
      const base = [[0, 0], [uLugL, 0], [uLugL, hLug], [B, hLug], [B, -h1], [p.wKeyBot + p.wKeySlope, -h1], [p.wKeyBot, -(h1 + h2)], [0, -(h1 + h2)]];
      const pitch = (p.H_cm - p.hBot) / p.N_tiers, nib = (p.b1_cm - p.b2_cm) / 2, uHL = p.wFront - nib, uHR = uHL + p.b1_cm, uWL = uHL + nib, uWR = uHR - nib, wS = p.h_str, hS = p.hStrD;
      const strs = [], hdrs = [];
      for (let t = 0; t < p.N_tiers; t++) { const v0 = t * pitch, v1 = v0 + hS, vw0 = v1, vw1 = vw0 + (pitch - hS), vl0 = vw0 - p.hNotch, vl1 = vw1 + p.hNotch;
        strs.push([[uWL, v0], [uWL + wS, v0], [uWL + wS, v1], [uWL, v1]], [[uWR - wS, v0], [uWR, v0], [uWR, v1], [uWR - wS, v1]]);
        hdrs.push([[uHL, vl0], [uWL, vl0], [uWL, vw0], [uWR, vw0], [uWR, vl0], [uHR, vl0], [uHR, vl1], [uWR, vl1], [uWR, vw1], [uWL, vw1], [uWL, vl1], [uHL, vl1]]); }
      const vTop = p.N_tiers * pitch, vCap = vTop + hS; strs.push([[uWL, vTop], [uWL + wS, vTop], [uWL + wS, vCap], [uWL, vCap]]);
      const env = [[uHL, 0], [uHR, 0], [uHR, vTop], [uHL, vTop]];
      // 每公尺數量（全部依斷面幾何）：順條沿牆連續（每公尺體積＝斷面積）；丁條每 b3 一組（每公尺＝層數×斷面積×丁條寬÷b3）
      const As = strs.reduce((a, q) => a + __A(q), 0), Ah1 = __A(hdrs[0]), nS = strs.length, b3 = p.b3_cm;
      const Q = {}; Q.hdrCnt = p.N_tiers * 100 / b3; Q.hdrV = Q.hdrCnt * Ah1 * p.h_hdr / 1e6; Q.strCnt = nS * 100 / b3; Q.strV = As / 1e4; Q.base = __A(base) / 1e4;
      Q.cob = Math.max(0, (__A(env) * 100 - Q.hdrV * 1e6 - As * 100 + (__A(strs[nS - 1]) * 100)) / 1e6);   // 格籠外廓（丁條全長×層高範圍）扣丁條、順條（頂部壓頂順條不在外廓內）
      Q.rbP = Q.hdrCnt * p.kgHdr + Q.strCnt * p.kgStr; Q.rbB = B / 100 * p.kgBase; Q.rb = Q.rbP + Q.rbB;
      // 世界斷面（x 往岸側、z 向上；原點＝基礎前趾頂角）
      const zBot = X(0, -(h1 + h2))[1], zBed = zBot + p.df_cm, crest = X(uWL + wS, vCap), crestEnd = X(uHR + p.wCrest, vTop)[0];
      const front = [X(0, -(h1 + h2)), X(0, 0), X(uHL, 0), X(uHL, vTop), X(uWL, vTop), X(uWL, vCap), crest];
      let xBed = front[0][0]; for (let i = 1; i < front.length; i++) { const a = front[i - 1], b = front[i]; if ((a[1] - zBed) * (b[1] - zBed) <= 0 && Math.abs(b[1] - a[1]) > 1e-9) { xBed = a[0] + (zBed - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); break; } }
      const f = (v, n) => (+v).toFixed(n === undefined ? 2 : n);
      const OV = { q_hdr_cnt: +Q.hdrCnt.toFixed(2), formula_hdr_cnt: `${p.N_tiers} 層 × 100 / 順條長 b3 ${b3} cm（每格一組丁條）`, q_hdr_rc: +Q.hdrV.toFixed(3), formula_hdr_rc: `${f(Q.hdrCnt)} 支/m × 圖面丁條斷面 ${f(Ah1, 0)} cm²（含兩端 ${f(nib, 1)} cm 凸榫、中段凹槽 ${p.hNotch}）× 寬 ${p.h_hdr} cm`,
        q_str_cnt: +Q.strCnt.toFixed(2), formula_str_cnt: `圖面每格 ${nS} 支（每層前後 2 支×${p.N_tiers} 層＋壓頂 1 支）× 100 / ${b3}`, q_str_rc: +Q.strV.toFixed(3), formula_str_rc: `順條沿牆連續：${nS} 支 × 斷面 ${wS}×${hS} cm ＝ ${f(As / 1e4, 4)} m²/m`,
        q_base_rc: +Q.base.toFixed(3), formula_base_rc: `圖面基礎台斷面量測 ${f(Q.base, 4)} m²（B ${B}、h1 ${h1}、止滑榫 ${p.wKeyBot}/${p.wKeySlope}×${h2}、後踵 ${p.wLug}×${f(hLug, 0)}）× 1.00 m`,
        q_cobble_vol: +Q.cob.toFixed(3), formula_cobble_vol: `格籠外廓 b1 ${f(p.b1_cm / 100)} × 籠高 ${f(vTop / 100)}（沿 1:${p.m_tilt} 斜量）－丁條 ${f(Q.hdrV, 3)}－順條 ${f((As - __A(strs[nS - 1])) / 1e4, 3)}`,
        q_rebar_precast: +Q.rbP.toFixed(1), q_rebar_base: +Q.rbB.toFixed(1), q_rebar_tot: +Q.rb.toFixed(1), formula_rebar: `丁條 ${f(Q.hdrCnt, 1)} 支×${p.kgHdr} kg＋順條 ${f(Q.strCnt, 1)} 支×${p.kgStr} kg＋基礎台 B ${f(B / 100)}×${p.kgBase} kg/m（依原圖配筋）` };
      return { p, OV, Q, th, X, P, base, strs, hdrs, env, zBot, zBed, xBed, crest, crestEnd, front, H: crest[1] - zBed, D: zBed - zBot, B, h1, h2, hLug, vTop, uHL, uHR };
    } finally { RR = null; }
  }
  function prims(m) { return sheet((p, PAL) => { const bSec = drawMainCrossSectionView(CTX, 30, 12, p, PAL), bPE = drawSynthesizedPlanAndElevationViews(CTX, bSec.rightX + 25, 12, p, PAL), bDet = drawHeaderAndStretcherDetails(CTX, bPE.rightX + 25, 12, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 45, Math.max(bSec.bottomY, bPE.bottomY, bDet.bottomY) + 45, p, PAL);
    const Q = m.Q, y = -6; cadText(CTX, `斷面量測（每公尺）：基礎台 ${Q.base.toFixed(3)} m²、順條 ${m.strs.length} 支/格、丁條斷面 ${(__A(m.hdrs[0])).toFixed(0)} cm²、格籠外廓 ${(__A(m.env) / 1e4).toFixed(3)} m²；鋼筋依原圖配筋（丁條 ${p.kgHdr}、順條 ${p.kgStr} kg/支）`, 45, y, 11.5, '#fde047', 'left', '600', 0, 'NOTE'); }, 0.88, m); }
"""
# ---------------- 展開式蜂巢圍束網格緩坡護岸 ----------------
h = open(ATT + '33144323-__________.html', encoding='utf8').read()
hc = h[h.rindex('<script>') + 8:h.rindex('</script>')]
HC_SUBS = [('let showGhost = true;', 'let showGhost = false;')]
for o, n in HC_SUBS:
    assert o in hc, ('hc', o[:60]); hc = hc.replace(o, n)
HC_JS = r"""
  const KEYS = ['n_slope', 'H_slope', 'D_cell', 'W_cell', 'W_top', 'H_cov', 'W_toe_lap', 'sub_ratio', 'S_pin_slope', 'S_pin_long', 'S_tendon', 'L_pin', 'd_pin', 'N_cell_pin', 'B_fdn', 'H_fdn', 'L_draw_cm', 'L_tot_m'];
  function model(R) {
    RR = R || {}; setInputs(R, KEYS);
    try {
      const p = getParams(), dk = { hUp: 32, fa: 38, fb: 3, fc: 8, fd: 15, padOff: 4, kTr: 1.6, Vemb: 0.14, Vrip: 0.38 }; Object.keys(dk).forEach(k => { p[k] = __n(k, dk[k]); });
      const n = p.n_slope, Hs = p.H_slope, D = p.D_cell, Ws = Hs * n, Wt = p.W_top, Wl = p.W_toe_lap, B = p.B_fdn, Hf = p.H_fdn, kS = Math.hypot(1, n) / n, Ls = Math.hypot(Hs, Ws);
      // 斷面（cm）：原點＝坡腳轉折點（網格底）；x 往岸側、z 向上
      const fdn = [[-B, -(Hf - p.hUp)], [0, -(Hf - p.hUp)], [0, 0], [-Wl, 0], [-Wl, D], [0, D], [0, p.hUp], [-B + p.fa, p.hUp + p.fb], [-B + p.fc, D - p.fd]];
      const cell = [[-Wl, 0], [0, 0], [Ws, Hs], [Ws + Wt, Hs], [Ws + Wt, Hs + D], [Ws, Hs + D], [D / kS * 0, D], [-Wl, D]];
      const trench = [[Ws, Hs + D], [Ws + Wt, Hs + D], [Ws + Wt * (1 + (p.kTr - 1) / 2), Hs + D + p.H_cov], [Ws - Wt * (p.kTr - 1) / 2, Hs + D + p.H_cov]];
      const Lnet = Wl + Ls + Wt, sub = p.sub_ratio / 100, subL = sub * Ls + Wl, expL = (1 - sub) * Ls + Wt, nRow = Math.floor(Ls / p.S_pin_slope) + 1 + 2;
      const Afdn = __A(fdn) / 1e4, Atr = __A(trench) / 1e4, Q = { geo: Lnet / 100, pin: nRow * 100 / p.S_pin_long, tendon: 100 / p.S_tendon * Lnet / 100, subg: subL * D / 1e4, grass: expL / 100, top: expL * D / 1e4 + Atr, fdn: Math.max(0, Afdn - p.Vemb), rip: p.Vemb + p.Vrip, Afdn, Atr, Lnet, Ls };
      const f = (v, d) => (+v).toFixed(d === undefined ? 2 : d);
      const OV = { q_geocell_area: +Q.geo.toFixed(2), formula_geocell_area: `[坡底折入 ${f(Wl / 100)}＋斜坡長 √(${f(Hs / 100)}²＋${f(Ws / 100)}²)＝${f(Ls / 100)}＋坡頂 ${f(Wt / 100)}] × 1.00 m（圖面展開長）`,
        q_pin_cnt: +Q.pin.toFixed(2), formula_pin_cnt: `[斜坡 ${f(Ls, 0)}/${p.S_pin_slope}＋1＝${nRow - 2} 支＋坡頂／坡底 2 支] × 100/${p.S_pin_long}`,
        q_tendon_len: +Q.tendon.toFixed(2), formula_tendon_len: `(100/${p.S_tendon}) × 網格展開長 ${f(Lnet / 100)} m`,
        q_sub_gravel: +Q.subg.toFixed(3), formula_sub_gravel: `[浸水段斜長 ${p.sub_ratio}%×${f(Ls / 100)}＋坡底折入 ${f(Wl / 100)}＝${f(subL / 100)}] × 網格深 ${f(D / 100)}`,
        q_grass_area: +Q.grass.toFixed(2), formula_grass_area: `[出水段斜長 ${100 - p.sub_ratio}%×${f(Ls / 100)}＋坡頂 ${f(Wt / 100)}] × 1.00 m`,
        q_topsoil_vol: +Q.top.toFixed(3), formula_topsoil_vol: `網格內表土 ${f(expL / 100)}×${f(D / 100)}＋坡頂錨固溝覆土（圖面梯形 底 ${f(Wt / 100)}、頂 ${f(Wt * p.kTr / 100)}、高 ${f(p.H_cov / 100)}）${f(Atr, 3)}`,
        q_fdn_conc: +Q.fdn.toFixed(3), formula_fdn_conc: `圖面基礎台斷面量測 ${f(Afdn, 4)} m²（${B}×${Hf}，含錨固槽）－臨水嵌石 ${f(p.Vemb)}（原圖表值）`,
        q_riprap_vol: +Q.rip.toFixed(2), formula_riprap_vol: `臨水嵌塊石 ${f(p.Vemb)}＋坡腳保護塊石 ${f(p.Vrip)}（原圖數量表值，圖面未完整繪出）`, L_slope_cm: Math.round(Ls), W_slope_horiz: Math.round(Ws), L_net_cm: Math.round(Lnet) };
      const zBed = p.hUp - p.padOff, a = [-B + p.fc, D - p.fd], b = [-B + p.fa, p.hUp + p.fb], xBed = a[0] + (zBed - a[1]) / ((b[1] - a[1]) || 1e-9) * (b[0] - a[0]);
      return { p, OV, Q, fdn, cell, trench, zBed, xBed, zBot: -(Hf - p.hUp), H: Hs + D - zBed, D: zBed + (Hf - p.hUp), Ws, Wt, Hs, Dc: D, B };
    } finally { RR = null; }
  }
  function prims(m) { return sheet((p, PAL) => { const bSec = drawMainCrossSectionView(CTX, 25, 12, p, PAL), bPE = drawSynthesizedPlanAndElevationViews(CTX, bSec.rightX + 20, 12, p, PAL), bIso = drawFiveOriginalIsometricDetails(CTX, bPE.rightX + 20, 12, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 40, Math.max(bSec.bottomY, bPE.bottomY, bIso.bottomY) + 45, p, PAL);
    const Q = m.Q, y = -6; cadText(CTX, `斷面量測（每公尺）：網格展開長 ${(Q.Lnet / 100).toFixed(2)} m、斜坡長 ${(Q.Ls / 100).toFixed(2)} m、基礎台斷面 ${Q.Afdn.toFixed(3)} m²、坡頂錨固溝 ${Q.Atr.toFixed(3)} m²（網格厚於斷面圖放大繪示）`, 40, y, 11.5, '#fde047', 'left', '600', 0, 'NOTE'); }, 0.85, m); }
"""
out = ["/* v6.3i 護岸原圖移植：混凝土格籠(框)護岸、展開式蜂巢圍束網格緩坡護岸（gen_revE.py 自動產生，勿手改） */", "var TCO_T = window.TCO_T || (window.TCO_T = {});"]
for key, script, js in [('crib', crib, CRIB_JS), ('hcell', hc, HC_JS)]:
    out.append(f"TCO_T['{key}'] = (function () {{\n{HEAD}\n{script}\n{SHIM}\n{COMMON}\n{js}\n  return {{ model, prims }};\n}})();")
open('/home/claude/tcv4/ormodE.js', 'w', encoding='utf8').write('\n'.join(out) + '\n'); print('ormodE.js ok')
