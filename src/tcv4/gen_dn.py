# v6.3 排水溝原圖移植（使用者原工具 5 種：乾砌石溝、箱籠溝、土袋溝、漿砌石溝、草溝）→ TCO_D[key].run(R, OV)
# R＝原工具輸入（inp_* 去前綴）；OV＝以本系統圖面幾何算出的數量／計算式覆寫原工具 p.q_*／p.formula_*（圖上數量表與本系統一致）
import re
ATT = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/'
TOOLS = [
  dict(key='dry', file='b8de3f57-_______.html', s=1.45,
       subs=[('let showGhost = true;', 'let showGhost = false;'),
             ('const xTopOutL = xTopInL - D_wall * 0.92;', 'const xTopOutL = xTopInL - D_wall * p.kt;'),
             ('const xTopOutR = xTopInR + D_wall * 0.92;', 'const xTopOutR = xTopInR + D_wall * p.kt;'),
             ('const xBotOutL = xBedInL - D_wall * 1.18;', 'const xBotOutL = xBedInL - D_wall * p.kb;'),
             ('const xBotOutR = xBedInR + D_wall * 1.18;', 'const xBotOutR = xBedInR + D_wall * p.kb;'),
             ('const yBedBot = yBedTop + (p.use_bed_stone ? D_bed : 8 * s);', 'const yBedBot = yBedTop + (p.use_bed_stone ? D_bed : p.nb0 * s);')],
       draw="""const bSec = drawMainCrossSectionView(CTX, 25, 12, p, PAL), bPP = drawSynthesizedPlanAndProfileViews(CTX, bSec.rightX + 35, 12, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 40, Math.max(bSec.bottomY, bPP.bottomY) + 45, p, PAL);"""),
  dict(key='wet', file='6a6a18f6-____.html', s=1.65,
       subs=[('let showGhost = true;', 'let showGhost = false;'),
             ('const bedPitch_cm = 12.5;', "const bedPitch_cm = num('inp_bedPitch_cm', 12.5);"),
             ('const wallVertPitch_cm = 14.0;', "const wallVertPitch_cm = num('inp_wallVertPitch_cm', 14.0);"),
             ('const B_cm = Math.round(W_cm + 2 * H_cm * m_in + 33);', "const B_cm = +(W_cm + 2 * H_cm * m_in + num('inp_bAdd_cm', 33)).toFixed(1);"),
             ('const W_base_out_cm = Math.round(W_cm + 2 * B1_cm + 18);', "const W_base_out_cm = +(W_cm + 2 * B1_cm + num('inp_baseAdd_cm', 18)).toFixed(1);"),
             ('const W_cm = Math.round(N_bed * bedPitch_cm);', 'const W_cm = +(N_bed * bedPitch_cm).toFixed(1);'),
             ('const H_cm = Math.round(N_wall * wallVertPitch_cm);', 'const H_cm = +(N_wall * wallVertPitch_cm).toFixed(1);'),
             ('D_stone * 0.67', 'D_stone * p.kEmb'),
             ('const xPcOutL = xBotOutL - 5 * s;', 'const xPcOutL = xBotOutL - p.pcExt_cm * s;'),
             ('const xPcOutR = xBotOutR + 5 * s;', 'const xPcOutR = xBotOutR + p.pcExt_cm * s;')],
       draw="""const bPS = drawPlanAndSectionViews(CTX, 20, 10, p, PAL), bProf = drawLongitudinalProfileAndLegend(CTX, bPS.rightX + 25, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 35, Math.max(bPS.bottomY, bProf.bottomY) + 42, p, PAL);"""),
  dict(key='gab', file='3a76cecf-______.html', s=0.88,
       subs=[('let showGhost = true;', 'let showGhost = false;')],
       draw="""const bFP = drawPlanAndFrontViews(CTX, 25, 10, p, PAL), bProf = drawLongitudinalProfileAndLegend(CTX, bFP.rightX + 35, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 35, Math.max(bFP.bottomY, bProf.bottomY) + 42, p, PAL);"""),
  dict(key='bag', file='2df316e3-___.html', s=1.62,
       subs=[('let showGhost = true;', 'let showGhost = false;'),
             ('const xExcavBotL = xBedInL - B1 - 24 * s;', 'const xExcavBotL = xBedInL - B1 - p.ex_cm * s;'),
             ('const xExcavTopL = xWallOutL - 24 * s;', 'const xExcavTopL = xWallOutL - p.ex_cm * s;'),
             ('const xExcavBotR = xBedInR + B1 + 24 * s;', 'const xExcavBotR = xBedInR + B1 + p.ex_cm * s;'),
             ('const xExcavTopR = xWallOutR + 24 * s;', 'const xExcavTopR = xWallOutR + p.ex_cm * s;')],
       draw="""const bPS = drawPlanAndCrossSectionViews(CTX, 20, 10, p, PAL), bBP = drawBagDetailsAndLongitudinalProfile(CTX, bPS.rightX + 25, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 35, Math.max(bPS.bottomY, bBP.bottomY) + 42, p, PAL);"""),
  dict(key='grass', file='5279e774-__.html', s=1.95,
       subs=[('let showGhost = true;', 'let showGhost = false;'), ('const cobPitch_cm = 10.0;', "const cobPitch_cm = num('inp_cobPitch_cm', 10.0);")],
       draw="""const bSec = drawBothCrossSections(CTX, 20, 10, p, PAL), bPP = drawPlanAndLongitudinalViews(CTX, bSec.rightX + 25, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 35, Math.max(bSec.bottomY, bPP.bottomY) + 42, p, PAL);"""),
  dict(key='wave', file='324f92f5-_____.html', s=1.65,
       subs=[('let showGhost = true;', 'let showGhost = false;')],
       draw="""const bSec = drawCrossSectionView(CTX, 15, 10, p, PAL), bDet = drawDetailAAndDetailB(CTX, bSec.rightX + 10, 10, p, PAL), bSP = drawSideAndPlanViews(CTX, bDet.rightX + 20, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 25, Math.max(bSec.bottomY, bDet.bottomY, bSP.bottomY) + 36, p, PAL);"""),
  dict(key='pat', file='38f52a00-___.html', s=1.95, drop=['ANSI31_HATCH'],
       subs=[('let showGhost = true;', 'let showGhost = false;'),
             ('const depth = H * (1 - Math.pow(Math.abs(u), 2.35));', 'const depth = H * (1 - Math.pow(Math.abs(u), p.nExp));'),
             ('const dydx = (H * 2.35 * Math.pow(Math.abs(u), 1.35) * (u >= 0 ? -1 : 1)) / (W / 2);', 'const dydx = (H * p.nExp * Math.pow(Math.abs(u), p.nExp - 1) * (u >= 0 ? -1 : 1)) / (W / 2);'),
             ('const depth = H * (1 - Math.pow(Math.abs(uVal), 2.35));', 'const depth = H * (1 - Math.pow(Math.abs(uVal), p.nExp));')],
       draw="""const bSM = drawWireMeshDetailAndCrossSection(CTX, 20, 10, p, PAL), bPP = drawPlanAndLongitudinalViews(CTX, bSM.rightX + 30, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 30, Math.max(bSM.bottomY, bPP.bottomY) + 38, p, PAL);"""),
  dict(key='bl1', file='814fb7a3-_______.html', s=1.95,
       subs=[('let showGhost = true;', 'let showGhost = false;')],
       draw="""const bL = drawLeftBlindDitchSections(CTX, 25, 10, p, PAL), bR = drawGabionBlindDitchPlanAndProfile(CTX, bL.rightX + 35, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 25, Math.max(bL.bottomY, bR.bottomY) + 38, p, PAL);"""),
  dict(key='bl2', file='baedde2d-HDPE______.html', s=1.95,
       subs=[('let showGhost = true;', 'let showGhost = false;'), ('const d_px = Math.max(22, (p.d_cm * s) * 1.15);', 'const d_px = Math.max(p.dMinPx, (p.d_cm * s) * p.kPipe);')],
       draw="""const bL = drawHdpeBuriedThreeViews(CTX, 25, 10, p, PAL), bR = drawRightHdpePipeDetailAndTables(CTX, bL.rightX + 35, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 25, Math.max(bL.bottomY, bR.bottomY) + 38, p, PAL);"""),
  dict(key='frb', file='98dd061f-_____.html', s=1.0,
       subs=[('let showGhost = true;', 'let showGhost = false;'),
             ('const by = ySecBase - hBeam * Math.sqrt(Math.max(0, 1 - u * u * 0.88));', 'const by = ySecBase - hBeam * Math.sqrt(Math.max(0, 1 - u * u * p.kArc));'),
             ('const yMax = ySecBase - hBeam * Math.sqrt(Math.max(0, 1 - u * u * 0.88)) + 5;', 'const yMax = ySecBase - hBeam * Math.sqrt(Math.max(0, 1 - u * u * p.kArc)) + 5;')],
       draw="""const bTop = drawTopRowViews(CTX, 20, 10, p, PAL), bBot = drawPlanAndSectionViews(CTX, 20, bTop.bottomY + 12, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 25, bBot.bottomY + 38, p, PAL);"""),
]
SHIM = r"""
  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.3, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.5, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadCircle(ctx, cx, cy, r, color, width, fill, dash, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || '0' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.05, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }
"""
out = ["/* v6.3 排水溝原圖移植（gen_dn.py 自動產生，勿手改） */", "var TCO_D = window.TCO_D || (window.TCO_D = {});"]
for T in TOOLS:
    h = open(ATT + T['file'], encoding='utf8').read()
    script = h[h.rindex('<script>') + 8:h.rindex('</script>')]
    for o, n in T['subs']:
        assert o in script, (T['key'], o); script = script.replace(o, n)
    out.append(f"""TCO_D['{T['key']}'] = (function () {{
  let O = [];
  const EL = {{}}, CTX = new Proxy({{}}, {{ get: (t, k) => (k in t ? t[k] : () => ({{ width: 0 }})), set: (t, k, v) => {{ t[k] = v; return true; }} }});
  const el = id => EL[id] || (EL[id] = {{ value: '', textContent: '', innerHTML: '', className: '', style: {{}}, classList: {{ add() {{}}, remove() {{}}, toggle() {{}} }}, addEventListener() {{}}, getContext: () => CTX, parentElement: {{ getBoundingClientRect: () => ({{ width: 100, height: 100 }}) }} }});
  const document = {{ getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({{ click() {{}}, style: {{}} }}), body: {{ appendChild() {{}}, removeChild() {{}}, classList: {{ add() {{}}, remove() {{}}, toggle() {{}}, contains: () => false }} }}, documentElement: {{ classList: {{ contains: () => false, add() {{}}, remove() {{}}, toggle() {{}} }} }}, addEventListener() {{}} }};
  const window = {{ addEventListener() {{}}, devicePixelRatio: 1, matchMedia: () => ({{ matches: false, addEventListener() {{}} }}) }};
{script}
{SHIM}
  const STRIP = s => String(s).replace(/\\s*[（(]\\s*圖號[^）)]*[）)]/g, '').replace(/\\s*[（(]\\s*\\d{{4}}-\\d\\s*[/／]\\s*\\d{{3}}\\s*[）)]/g, '').replace(/\\s*圖號\\s*[：:]?\\s*[0-9A-Za-z#\\-／/ ]+/g, ' ');
  function params(R) {{ Object.keys(R || {{}}).forEach(k => {{ el('inp_' + k).value = String(R[k]); }}); return getParams(); }}
  function run(R, OV) {{
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {{}}, OV || {{}});
    {T['draw']}
    {('O = O.filter(o => !' + repr(T.get('drop', [])) + '.includes(o.ly));') if T.get('drop') else ''}
    const sc = 1 / {T['s']}; return O.map(o => {{ const r = Object.assign({{}}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) {{ r.x *= sc; r.y *= sc; }} if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; }});
  }}
  return {{ run, params }};
}})();""")
open('/home/claude/tcv4/ormodD.js', 'w', encoding='utf8').write('\n'.join(out) + '\n'); print('ormodD.js ok')
