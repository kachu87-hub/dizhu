# v6.3 場鑄箱涵（8318469e，cadLine 框架）→ TCO_S['bcul']：數量依配筋表形狀與斷面幾何
import re, json
ATT = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/'
h = open(ATT + '8318469e-____.html', encoding='utf8').read()
script = h[h.rindex('<script>') + 8:h.rindex('</script>')]
script = script.replace('let showGhost = true;', 'let showGhost = false;')
DEF = {m.group(1): m.group(2) for m in re.finditer(r'<input type="number" id="(inp_[^"]+)" value="([^"]*)"', h)}
GT = ['1. 箱涵主體斷面（以通水孔底為基準）', '2. ①～⑦號鋼筋中心距（配筋表）', '3. 配筋表形狀尺寸（原表值改參數）']
lab = {'inp_W_cm': '內部跨度 W (cm)', 'inp_H_cm': '內部高度 H (cm)', 'inp_t_cm': '箱涵壁厚 t (cm)', 'inp_F_cm': '隅角填角 F (cm)', 'inp_t_pc': 'PC 打底厚 (cm)', 'inp_ext_pc': 'PC 單側外伸寬 (cm)', 'inp_cover': '保護層 (cm)', 'inp_L_m': '箱涵長度（順水流）L (m)',
       'inp_sp1': '① 頂底版內主筋中心距', 'inp_sp2': '② ㄇ型外主筋中心距', 'inp_sp3': '③ L 型角隅筋中心距', 'inp_sp4': '④ 側牆內立筋中心距', 'inp_sp5': '⑤⑥ 縱向筋中心距', 'inp_sp7': '⑦ 腋部斜筋中心距'}
PR = []
for k, nm in lab.items():
    g = 0 if not k.startswith('inp_sp') else 1
    PR.append({'k': k, 'nm': nm, 'def': DEF[k], 'st': '0.5' if k == 'inp_L_m' else '1', 'min': '1', 'max': '5000', 'g': g})
EX = [('p_hb', '①④ 彎鉤長 b/j (cm)', '16'), ('p_hc', '①④ 彎鉤彎曲段 c/k (cm)', '6.5'), ('p_e1', '①④ 端部退縮 (cm)', '5'), ('p_doff', '② 頂段 d 扣減 (cm)', '7'), ('p_lap', '② 側牆搭接長 (cm)', '16'),
      ('p_r2e', '② 端鉤 e (cm)', '20'), ('p_bend', '② 彎曲扣減 (cm)', '3'), ('p_r3x', '③ 臂長 g＝t＋ (cm)', '13'), ('p_r3h', '③ h (cm)', '7'), ('p_r3a', '③ 長度加計 (cm)', '2'), ('p_r7x', '⑦ l＝F√2＋ (cm)', '7'), ('p_r7g', '⑦ 兩端錨定長合計 (cm)', '60'),
      ('p_w16', 'D16 單位重 (kg/m)', '1.56'), ('p_w13', 'D13 單位重 (kg/m)', '0.995')]
for k, nm, d in EX:
    PR.append({'k': k, 'nm': nm, 'def': d, 'st': '0.5' if '.' in d else '1', 'min': '0', 'max': '500', 'g': 2}); DEF[k] = d
JS = r"""
  const __n = (id, d) => { const v = parseFloat(el(id).value); return Number.isFinite(v) ? v : d; };
  computeCulvertData = function (p) {
    const g = k => __n(k, parseFloat(DEF[k])), hb = g('p_hb'), hc = g('p_hc'), e1 = g('p_e1'), cov = p.cover, W = p.W_cm, H = p.H_cm, t = p.t_cm, F = p.F_cm, w16 = g('p_w16'), w13 = g('p_w13');
    const r1a = W + 2 * t - 2 * cov - 2 * e1, r1 = { dia: 'D16', sp: p.sp1, a: +r1a.toFixed(1), b: hb, c: hc, len: +(r1a + 2 * (hb + hc)).toFixed(1) };
    const r2d = W + 2 * t - 2 * cov - g('p_doff'), r2f = (H + 2 * t - 2 * cov) / 2 + g('p_lap') / 2, r2 = { dia: 'D16', sp: p.sp2, d: +r2d.toFixed(1), e: g('p_r2e'), f: +r2f.toFixed(1), len: +(r2d + 2 * r2f + 2 * g('p_r2e') - g('p_bend')).toFixed(1) };
    const r3g = t + g('p_r3x'), r3 = { dia: 'D16', sp: p.sp3, g: r3g, h: g('p_r3h'), len: +(2 * r3g + g('p_r3a')).toFixed(1) };
    const r4i = H + 2 * t - 2 * cov - 2 * e1, r4 = { dia: 'D13', sp: p.sp4, i: +r4i.toFixed(1), j: hb, k: hc, len: +(r4i + 2 * (hb + hc)).toFixed(1) };
    const r7l = F * Math.SQRT2 + g('p_r7x'), r7 = { dia: 'D13', sp: p.sp7, l: +r7l.toFixed(1), len: +(r7l + g('p_r7g')).toFixed(1) };
    const pO = 2 * ((W + 2 * t - 2 * cov) + (H + 2 * t - 2 * cov)), pI = 2 * ((W + 2 * cov) + (H + 2 * cov)), n5 = pO / p.sp5, n6 = pI / p.sp5;
    const r5 = { dia: 'D13', sp: p.sp5, len: 100, n: n5 }, r6 = { dia: 'D13', sp: p.sp5, len: 100, n: n6 };
    const kg = { r1: 2 * (100 / p.sp1) * r1.len / 100 * w16, r2: 2 * (100 / p.sp2) * r2.len / 100 * w16, r3: 4 * (100 / p.sp3) * r3.len / 100 * w16, r4: 2 * (100 / p.sp4) * r4.len / 100 * w13, r5: n5 * w13, r6: n6 * w13, r7: 4 * (100 / p.sp7) * r7.len / 100 * w13 };
    const conc = ((W + 2 * t) * (H + 2 * t) - W * H + 2 * F * F) / 1e4, pc = (W + 2 * t + 2 * p.ext_pc) * p.t_pc / 1e4;
    const form = (2 * (H + 2 * t) + (W - 2 * F) + 2 * (H - 2 * F) + 4 * F * Math.SQRT2 + 2 * p.t_pc) / 100;
    const rebar = Object.values(kg).reduce((a, b) => a + b, 0);
    return { Wm: (W / 100).toFixed(2), Hm: (H / 100).toFixed(2), tm: (t / 100).toFixed(2), r1, r2, r3, r4, r5, r6, r7, kg, conc210_m: +conc.toFixed(3), pc140_m: +pc.toFixed(3), rebar_m: +rebar.toFixed(2), form_m: +form.toFixed(2), pO, pI };
  };
  function computeQuantities(p) {
    const q = computeCulvertData(p), L = p.L_m, f = (v, n) => (+v).toFixed(n === undefined ? 2 : n), rows = [];
    rows.push({ no: '1', name: "fc'=210kgf/cm² 混凝土", unit: 'm³', qty: +(q.conc210_m * L).toFixed(2), formula: `[(${p.W_cm}+2×${p.t_cm})×(${p.H_cm}+2×${p.t_cm})－${p.W_cm}×${p.H_cm}＋4×${p.F_cm}²/2]÷10⁴＝${f(q.conc210_m, 3)} m³/m × L ${L}` });
    rows.push({ no: '2', name: "fc'=140kgf/cm² 混凝土（PC 打底）", unit: 'm³', qty: +(q.pc140_m * L).toFixed(2), formula: `(${p.W_cm}+2×${p.t_cm}+2×${p.ext_pc})×${p.t_pc}÷10⁴＝${f(q.pc140_m, 3)} m³/m × ${L}` });
    rows.push({ no: '3', name: '鋼筋', unit: 'kg', qty: +(q.rebar_m * L).toFixed(1), formula: `依配筋表 ①～⑦：${Object.entries(q.kg).map(([k, v]) => k.replace('r', '') + ' ' + f(v, 1)).join('、')}＝${f(q.rebar_m)} kg/m × ${L}` });
    rows.push({ no: '4', name: '模板', unit: 'm²', qty: +(q.form_m * L).toFixed(2), formula: `外側牆 2×${p.H_cm + 2 * p.t_cm}＋頂版底 ${p.W_cm - 2 * p.F_cm}＋內側牆 2×${p.H_cm - 2 * p.F_cm}＋腋 4×${p.F_cm}√2＋PC 側 2×${p.t_pc}＝${f(q.form_m)} m²/m × ${L}` });
    return rows;
  }
  const PAL = getPalette();
  function __draw(p) {
    const q = computeCulvertData(p), sec = drawCulvertSection(CTX, 55, 20, p, PAL), mid = Math.max(580, sec.rightX + 45), jt = drawJointDetailAndNotes(CTX, mid, 20, p, PAL);
    const rx = Math.max(mid + 455, jt.rightX + 45), pp = drawPlanAndLongitudinalViews(CTX, rx, 20, p, PAL), ry = sec.bottomY + 25; drawRebarShapesCluster(CTX, 85, ry, q, PAL);
    const ty = Math.max(ry + 245, jt.bottomY + 35, pp.bottomY + 35, 760); drawBottomScheduleTables(CTX, 55, ty, q, PAL);
    const N = [`通水孔底（箱涵內底）為高程基準；底版厚 t＝${p.t_cm}、PC ${p.t_pc} cm 在其下`, `數量依斷面幾何與配筋表形狀計算（每 m）：混凝土 ${q.conc210_m}、PC ${q.pc140_m} m³、鋼筋 ${q.rebar_m} kg、模板 ${q.form_m} m²`,
      `⑤⑥ 縱向筋支數＝外層周長 ${q.pO.toFixed(0)}／內層周長 ${q.pI.toFixed(0)} ÷ 中心距 ${p.sp5}`];
    N.forEach((s, i) => cadText(CTX, '・' + s, 55, ty + 175 + i * 16, 11, '#fde047', 'left', '600', 0, 'NOTE'));
  }
"""
SHIM = open('/home/claude/tcv4/gen_n1.py', encoding='utf8').read().split('SHIM = r"""')[1].split('"""')[0]
SHIM = SHIM.replace("h: (size || 12) * 1.1", "h: (size || 12) * 1.05")
out = f"""/* v6.3 場鑄箱涵（使用者原工具 8318469e 自動抽出；gen_bcul.py，勿手改） */
TCO_S['bcul'] = (function () {{
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
    DEF, PR: {json.dumps(PR, ensure_ascii=False)}, GT: {json.dumps(GT, ensure_ascii=False)}, title: '場鑄箱涵標準圖',
    run(R, opt) {{
      RR = R || {{}}; O = [];
      try {{ const P = getParams(), rows = computeQuantities(P); if (opt && opt.draw) __draw(P); const q = computeCulvertData(P);
        const sc = 1 / 1.52, OO = opt && opt.draw ? O.map(o => {{ const r = Object.assign({{}}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) {{ r.x *= sc; r.y *= sc; }} if (r.r) r.r *= sc; if (r.h) r.h *= sc; return r; }}) : [];
        Object.assign(P, {{ __q: q }});
        const checks = [{{ ok: P.cover >= 5, text: `保護層 ${{P.cover}} cm（附註 4：5 cm）` }}, {{ ok: P.t_pc >= 10, text: `PC 打底 ${{P.t_pc}} cm（min 10 cm）` }}, {{ ok: Math.abs(P.F_cm - P.t_cm) < 1e-6, text: `隅角填角 F＝${{P.F_cm}}（附註 8：F＝t＝${{P.t_cm}}）` }}];
        return {{ P, rows, checks, O: OO, L: null }}; }} finally {{ RR = null; }}
    }}
  }};
}})();
"""
open('/home/claude/tcv4/ormod8.js', 'w', encoding='utf8').write(out)
print('ormod8.js', len(out))
